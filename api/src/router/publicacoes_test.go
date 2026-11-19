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

// N5: curtir duas vezes é idempotente (204) e conta uma curtida só.
func TestN5_CurtirDuasVezesEIdempotente(t *testing.T) {
	a := novaAPI(t)
	_, tokenAlice := a.criarUsuario("alice")
	_, tokenBob := a.criarUsuario("bob")
	postID := a.criarPublicacao(tokenAlice, "post")
	path := fmt.Sprintf("/publicacoes/%d", postID)

	esperarStatus(t, a.req(http.MethodPost, path+"/curtir", "", tokenBob), http.StatusNoContent)
	esperarStatus(t, a.req(http.MethodPost, path+"/curtir", "", tokenBob), http.StatusNoContent)

	var p publicacaoResp
	decodificar(t, a.req(http.MethodGet, path, "", tokenBob), &p)
	if p.Curtidas != 1 {
		t.Fatalf("curtidas = %d, esperado 1", p.Curtidas)
	}
}

// N5: curtir/descurtir publicação inexistente responde 404.
func TestN5_CurtirPublicacaoInexistente404(t *testing.T) {
	a := novaAPI(t)
	_, token := a.criarUsuario("alice")

	for _, acao := range []string{"curtir", "descurtir"} {
		w := a.req(http.MethodPost, "/publicacoes/999999/"+acao, "", token)
		esperarStatus(t, w, http.StatusNotFound)
		var erro struct {
			Erro string `json:"erro"`
		}
		decodificar(t, w, &erro)
	}
}

// H15: /publicacoes/usuario/{id} devolve TODAS as publicações do usuário, mais recentes primeiro.
func TestH15_PublicacoesDoUsuarioEUmaLista(t *testing.T) {
	a := novaAPI(t)
	aliceID, tokenAlice := a.criarUsuario("alice")
	_, tokenBob := a.criarUsuario("bob")
	p1 := a.criarPublicacao(tokenAlice, "primeira")
	p2 := a.criarPublicacao(tokenAlice, "segunda")
	a.criarPublicacao(tokenBob, "do bob")

	w := a.req(http.MethodGet, fmt.Sprintf("/publicacoes/usuario/%d", aliceID), "", tokenBob)
	esperarStatus(t, w, http.StatusOK)
	var lista []publicacaoResp
	decodificar(t, w, &lista)
	if len(lista) != 2 || lista[0].ID != p2 || lista[1].ID != p1 {
		t.Fatalf("esperado [%d, %d], obtido %s", p2, p1, w.Body.String())
	}
}

// B2: toda resposta de publicação diz se o usuário do token curtiu (`curtiu`),
// para o front saber se mostra "Curtir" ou "Descurtir" depois de recarregar.
func TestB2_CurtiuIndicaSeOUsuarioDoTokenCurtiu(t *testing.T) {
	a := novaAPI(t)
	aliceID, tokenAlice := a.criarUsuario("alice")
	_, tokenBob := a.criarUsuario("bob")
	postID := a.criarPublicacao(tokenAlice, "post")
	path := fmt.Sprintf("/publicacoes/%d", postID)
	esperarStatus(t, a.req(http.MethodPost, fmt.Sprintf("/usuarios/%d/seguir", aliceID), "", tokenBob), http.StatusNoContent)
	esperarStatus(t, a.req(http.MethodPost, path+"/curtir", "", tokenBob), http.StatusNoContent)

	type resp struct {
		ID       uint64 `json:"id"`
		Curtidas uint64 `json:"curtidas"`
		Curtiu   *bool  `json:"curtiu"` // ponteiro: campo ausente ≠ false
	}
	conferir := func(rota, token string, lista bool, querCurtiu bool) {
		t.Helper()
		w := a.req(http.MethodGet, rota, "", token)
		esperarStatus(t, w, http.StatusOK)
		var p resp
		if lista {
			var l []resp
			decodificar(t, w, &l)
			if len(l) != 1 {
				t.Fatalf("%s: esperado 1 publicação, obtido %s", rota, w.Body.String())
			}
			p = l[0]
		} else {
			decodificar(t, w, &p)
		}
		if p.Curtiu == nil || *p.Curtiu != querCurtiu || p.Curtidas != 1 {
			t.Fatalf("%s: esperado curtiu=%v e curtidas=1, obtido %s", rota, querCurtiu, w.Body.String())
		}
	}

	doUsuario := fmt.Sprintf("/publicacoes/usuario/%d", aliceID)
	for _, c := range []struct {
		rota  string
		lista bool
	}{{"/publicacoes", true}, {path, false}, {doUsuario, true}} {
		conferir(c.rota, tokenBob, c.lista, true)    // bob curtiu
		conferir(c.rota, tokenAlice, c.lista, false) // a mesma publicação, vista pela alice
	}

	esperarStatus(t, a.req(http.MethodPost, path+"/descurtir", "", tokenBob), http.StatusNoContent)
	var p resp
	decodificar(t, a.req(http.MethodGet, path, "", tokenBob), &p)
	if p.Curtiu == nil || *p.Curtiu || p.Curtidas != 0 {
		t.Fatalf("depois de descurtir: esperado curtiu=false e curtidas=0, obtido %+v", p)
	}
}
