package router_test

// Infraestrutura dos testes de integração: sobe o router real (rotas +
// middlewares + controllers + repositories) contra um banco MySQL de teste.
//
// TEST_DB_DSN='root:devbook_dev@tcp(127.0.0.1:3310)/devbook_test?parseTime=True&loc=Local' go test ./...

import (
	"api/src/auth"
	"api/src/config"
	"api/src/database"
	"api/src/router"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	mysqldriver "github.com/go-sql-driver/mysql"
	gormmysql "gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var testDB *gorm.DB

func TestMain(m *testing.M) {
	config.SecretKey = []byte("segredo-de-teste")

	if dsn := os.Getenv("TEST_DB_DSN"); dsn != "" {
		db, err := abrirBancoDeTeste(dsn)
		if err != nil {
			fmt.Fprintln(os.Stderr, "banco de teste:", err)
			os.Exit(1)
		}
		testDB = db
	}

	os.Exit(m.Run())
}

func abrirBancoDeTeste(dsn string) (*gorm.DB, error) {
	cfg, err := mysqldriver.ParseDSN(dsn)
	if err != nil {
		return nil, err
	}
	nome := cfg.DBName
	if !strings.Contains(nome, "test") {
		return nil, fmt.Errorf("recusando banco %q: o nome precisa conter 'test' (os testes apagam dados)", nome)
	}

	// Cria o banco de teste conectando sem banco selecionado.
	cfg.DBName = ""
	semBanco, err := gorm.Open(gormmysql.Open(cfg.FormatDSN()), &gorm.Config{Logger: logger.Discard})
	if err != nil {
		return nil, err
	}
	if err := semBanco.Exec("CREATE DATABASE IF NOT EXISTS `" + nome + "`").Error; err != nil {
		return nil, err
	}
	if sqlDB, err := semBanco.DB(); err == nil {
		sqlDB.Close()
	}

	db, err := database.Abrir(dsn)
	if err != nil {
		return nil, err
	}
	if err := aplicarSchema(db); err != nil {
		return nil, err
	}
	return db, nil
}

// aplicarSchema executa sql/schema.sql (a mesma fonte usada pelo compose).
func aplicarSchema(db *gorm.DB) error {
	conteudo, err := os.ReadFile("../../sql/schema.sql")
	if err != nil {
		return err
	}
	for _, comando := range strings.Split(string(conteudo), ";") {
		if strings.TrimSpace(semComentarios(comando)) == "" {
			continue
		}
		if err := db.Exec(comando).Error; err != nil {
			return fmt.Errorf("schema.sql: %w", err)
		}
	}
	return nil
}

func semComentarios(sql string) string {
	var linhas []string
	for _, l := range strings.Split(sql, "\n") {
		if !strings.HasPrefix(strings.TrimSpace(l), "--") {
			linhas = append(linhas, l)
		}
	}
	return strings.Join(linhas, "\n")
}

func precisaBanco(t *testing.T) {
	t.Helper()
	if testDB == nil {
		t.Skip("TEST_DB_DSN não definido; pulando teste de integração")
	}
}

// limpar apaga os dados em ordem compatível com as FKs.
func limpar(t *testing.T) {
	t.Helper()
	for _, tabela := range []string{"likes", "SEGUIDORES", "PUBLICACOES", "USUARIOS"} {
		if err := testDB.Exec("DELETE FROM " + tabela).Error; err != nil {
			t.Fatalf("limpar %s: %v", tabela, err)
		}
	}
}

type api struct {
	t *testing.T
	h http.Handler
}

func novaAPI(t *testing.T) *api {
	t.Helper()
	precisaBanco(t)
	limpar(t)
	return &api{t: t, h: router.Gerar(testDB)}
}

func (a *api) req(method, path, body, token string) *httptest.ResponseRecorder {
	a.t.Helper()
	r := httptest.NewRequest(method, path, strings.NewReader(body))
	if body != "" {
		r.Header.Set("Content-Type", "application/json")
	}
	if token != "" {
		r.Header.Set("Authorization", "Bearer "+token)
	}
	w := httptest.NewRecorder()
	a.h.ServeHTTP(w, r)
	return w
}

const senhaValida = "Senha@123"

// criarUsuario cadastra pela API e devolve o id e um token válido para ele.
func (a *api) criarUsuario(nick string) (uint64, string) {
	a.t.Helper()
	body := fmt.Sprintf(`{"nome":"%s","nick":"%s","email":"%s@devbook.test","senha":"%s"}`, nick, nick, nick, senhaValida)
	w := a.req(http.MethodPost, "/usuarios", body, "")
	if w.Code != http.StatusCreated {
		a.t.Fatalf("criar usuário %s: status %d, corpo %s", nick, w.Code, w.Body.String())
	}
	var u struct {
		ID uint64 `json:"id"`
	}
	decodificar(a.t, w, &u)
	token, err := auth.CreateToken(u.ID)
	if err != nil {
		a.t.Fatal(err)
	}
	return u.ID, token
}

// criarPublicacao cria pela API e devolve o id.
func (a *api) criarPublicacao(token, titulo string) uint64 {
	a.t.Helper()
	w := a.req(http.MethodPost, "/publicacoes", fmt.Sprintf(`{"titulo":"%s","conteudo":"conteúdo"}`, titulo), token)
	if w.Code != http.StatusCreated {
		a.t.Fatalf("criar publicação: status %d, corpo %s", w.Code, w.Body.String())
	}
	var p struct {
		ID uint64 `json:"id"`
	}
	decodificar(a.t, w, &p)
	return p.ID
}

func decodificar(t *testing.T, w *httptest.ResponseRecorder, destino any) {
	t.Helper()
	if err := json.Unmarshal(w.Body.Bytes(), destino); err != nil {
		t.Fatalf("corpo não é o JSON esperado (%v): %s", err, w.Body.String())
	}
}

func esperarStatus(t *testing.T, w *httptest.ResponseRecorder, esperado int) {
	t.Helper()
	if w.Code != esperado {
		t.Fatalf("status esperado %d, obtido %d; corpo: %s", esperado, w.Code, w.Body.String())
	}
}
