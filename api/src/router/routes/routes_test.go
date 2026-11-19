package routes

import (
	"api/src/controllers"
	"bytes"
	"log"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gorilla/mux"
)

func configurarSemBanco() *mux.Router {
	return Configurar(mux.NewRouter(), controllers.New(nil))
}

// H1: cada (método, URI) deve ser registrado uma única vez. Um segundo
// registro sem middleware é um bypass de autenticação esperando acontecer.
func TestH1_CadaRotaRegistradaUmaVez(t *testing.T) {
	vistos := map[string]int{}
	err := configurarSemBanco().Walk(func(route *mux.Route, _ *mux.Router, _ []*mux.Route) error {
		path, _ := route.GetPathTemplate()
		metodos, _ := route.GetMethods()
		vistos[strings.Join(metodos, ",")+" "+path]++
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
	for rota, n := range vistos {
		if n != 1 {
			t.Errorf("%s registrada %d vezes", rota, n)
		}
	}
}

// H1: o Logger deve rodar em todas as rotas, inclusive as públicas.
func TestH1_LoggerRodaEmRotaPublica(t *testing.T) {
	var buf bytes.Buffer
	original := log.Writer()
	log.SetOutput(&buf)
	defer log.SetOutput(original)

	// JSON inválido faz o Login responder 400 antes de tocar no banco.
	r := httptest.NewRequest(http.MethodPost, "/login", strings.NewReader("{"))
	configurarSemBanco().ServeHTTP(httptest.NewRecorder(), r)

	if !strings.Contains(buf.String(), "POST /login") {
		t.Errorf("Logger não registrou a rota pública; log: %q", buf.String())
	}
}

// H6: só cadastro e login são públicos; todo o resto passa pelo Autenticar.
func TestH6_ApenasCadastroELoginSaoPublicas(t *testing.T) {
	publicasPermitidas := map[string]bool{
		"POST /usuarios": true,
		"POST /login":    true,
	}
	c := controllers.New(nil)
	todas := append(rotasUsuarios(c), rotaLogin(c))
	todas = append(todas, rotasPublicacoes(c)...)

	for _, rota := range todas {
		chave := rota.Metodo + " " + rota.URI
		if !rota.RequerAutenticacao && !publicasPermitidas[chave] {
			t.Errorf("%s está sem autenticação", chave)
		}
		if rota.RequerAutenticacao && publicasPermitidas[chave] {
			t.Errorf("%s deveria ser pública", chave)
		}
	}
}
