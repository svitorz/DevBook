package router_test

import (
	"fmt"
	"net/http"
	"testing"
)

type publicacaoResp struct {
	ID       uint64 `json:"id"`
	AutorID  uint64 `json:"autor_id"`
	Titulo   string `json:"titulo"`
	Curtidas uint64 `json:"curtidas"`
}

// H2: o autor é sempre o usuário do token, nunca o autor_id enviado no corpo.
func TestH2_AutorIDDoCorpoEIgnorado(t *testing.T) {
	a := novaAPI(t)
	aliceID, tokenAlice := a.criarUsuario("alice")
	bobID, _ := a.criarUsuario("bob")

	body := fmt.Sprintf(`{"titulo":"forjado","conteudo":"x","autor_id":%d}`, bobID)
	w := a.req(http.MethodPost, "/publicacoes", body, tokenAlice)
	esperarStatus(t, w, http.StatusCreated)

	var p publicacaoResp
	decodificar(t, w, &p)
	if p.AutorID != aliceID {
		t.Fatalf("resposta: autor_id = %d, esperado %d (alice)", p.AutorID, aliceID)
	}

	var autorNoBanco uint64
	testDB.Raw("SELECT autor_id FROM PUBLICACOES WHERE id = ?", p.ID).Scan(&autorNoBanco)
	if autorNoBanco != aliceID {
		t.Fatalf("banco: autor_id = %d, esperado %d (alice)", autorNoBanco, aliceID)
	}
}

// N7: recurso inexistente responde 404, não 200 com objeto zerado.
func TestN7_PublicacaoInexistente404(t *testing.T) {
	a := novaAPI(t)
	_, token := a.criarUsuario("alice")

	w := a.req(http.MethodGet, "/publicacoes/999999", "", token)
	esperarStatus(t, w, http.StatusNotFound)
}
