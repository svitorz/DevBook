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

// H3: editar/deletar publicação de outro usuário responde 403 (antes: panic).
func TestH3_EditarOuDeletarPublicacaoDeOutro403(t *testing.T) {
	a := novaAPI(t)
	_, tokenAlice := a.criarUsuario("alice")
	_, tokenBob := a.criarUsuario("bob")
	postID := a.criarPublicacao(tokenAlice, "da alice")
	path := fmt.Sprintf("/publicacoes/%d", postID)

	w := a.req(http.MethodPut, path, `{"titulo":"hack","conteudo":"hack"}`, tokenBob)
	esperarStatus(t, w, http.StatusForbidden)

	w = a.req(http.MethodDelete, path, "", tokenBob)
	esperarStatus(t, w, http.StatusForbidden)

	var titulo string
	testDB.Raw("SELECT titulo FROM PUBLICACOES WHERE id = ?", postID).Scan(&titulo)
	if titulo != "da alice" {
		t.Fatalf("publicação foi alterada por outro usuário: titulo = %q", titulo)
	}
}

// H3: editar/deletar publicação inexistente responde 404.
func TestH3_EditarOuDeletarPublicacaoInexistente404(t *testing.T) {
	a := novaAPI(t)
	_, token := a.criarUsuario("alice")

	var erro struct {
		Erro string `json:"erro"`
	}
	w := a.req(http.MethodPut, "/publicacoes/999999", `{"titulo":"x","conteudo":"x"}`, token)
	esperarStatus(t, w, http.StatusNotFound)
	decodificar(t, w, &erro) // falha se o handler seguiu e escreveu uma 2ª resposta

	w = a.req(http.MethodDelete, "/publicacoes/999999", "", token)
	esperarStatus(t, w, http.StatusNotFound)
	decodificar(t, w, &erro)
}

// N3: DELETE não exige corpo.
func TestN3_DeletarPropriaPublicacaoSemCorpo(t *testing.T) {
	a := novaAPI(t)
	_, token := a.criarUsuario("alice")
	postID := a.criarPublicacao(token, "minha")
	path := fmt.Sprintf("/publicacoes/%d", postID)

	w := a.req(http.MethodDelete, path, "", token)
	esperarStatus(t, w, http.StatusNoContent)

	w = a.req(http.MethodGet, path, "", token)
	esperarStatus(t, w, http.StatusNotFound)
}
