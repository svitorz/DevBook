package router_test

// H14: status HTTP padronizados (400 validação/entrada, 401 token,
// 403 permissão, 404 não encontrado, 409 duplicado, 201/204 coerentes).

import (
	"fmt"
	"net/http"
	"strconv"
	"testing"
)

func TestH14_CadastroDuplicado409(t *testing.T) {
	a := novaAPI(t)
	a.criarUsuario("alice")

	emailRepetido := `{"nome":"Outra","nick":"outra","email":"alice@devbook.test","senha":"Senha@123"}`
	esperarStatus(t, a.req(http.MethodPost, "/usuarios", emailRepetido, ""), http.StatusConflict)

	nickRepetido := `{"nome":"Outra","nick":"alice","email":"outra@devbook.test","senha":"Senha@123"}`
	esperarStatus(t, a.req(http.MethodPost, "/usuarios", nickRepetido, ""), http.StatusConflict)
}

func TestH14_AtualizarPerfilParaNickDeOutro409(t *testing.T) {
	a := novaAPI(t)
	id, token := a.criarUsuario("alice")
	a.criarUsuario("bob")

	body := `{"nome":"Alice","nick":"bob","email":"alice@devbook.test"}`
	esperarStatus(t, a.req(http.MethodPut, "/usuarios/"+strconv.FormatUint(id, 10), body, token), http.StatusConflict)
}

func TestH14_AtualizarPerfil204(t *testing.T) {
	a := novaAPI(t)
	id, token := a.criarUsuario("alice")

	body := `{"nome":"Alice 2","nick":"alice","email":"alice@devbook.test"}`
	w := a.req(http.MethodPut, "/usuarios/"+strconv.FormatUint(id, 10), body, token)
	esperarStatus(t, w, http.StatusNoContent)
	if w.Body.Len() != 0 {
		t.Fatalf("204 com corpo: %q", w.Body.String())
	}
}

func TestH14_ErrosDeEntrada400(t *testing.T) {
	a := novaAPI(t)
	_, token := a.criarUsuario("alice")
	postID := a.criarPublicacao(token, "post")
	post := fmt.Sprintf("/publicacoes/%d", postID)

	casos := []struct {
		nome, metodo, path, body string
	}{
		{"publicação com título vazio", http.MethodPost, "/publicacoes", `{"titulo":"","conteudo":"x"}`},
		{"publicação com JSON inválido", http.MethodPost, "/publicacoes", `{`},
		{"editar publicação com título vazio", http.MethodPut, post, `{"titulo":"","conteudo":"x"}`},
		{"id de publicação não numérico", http.MethodGet, "/publicacoes/abc", ""},
		{"curtir com id não numérico", http.MethodPost, "/publicacoes/abc/curtir", ""},
		{"cadastro com JSON inválido", http.MethodPost, "/usuarios", `{`},
	}
	for _, c := range casos {
		t.Run(c.nome, func(t *testing.T) {
			esperarStatus(t, a.req(c.metodo, c.path, c.body, token), http.StatusBadRequest)
		})
	}
}

func TestH14_SeguirUsuarioInexistente404(t *testing.T) {
	a := novaAPI(t)
	_, token := a.criarUsuario("alice")

	esperarStatus(t, a.req(http.MethodPost, "/usuarios/999999/seguir", "", token), http.StatusNotFound)
}

func TestH14_ListasVaziasSaoArray(t *testing.T) {
	a := novaAPI(t)
	id, token := a.criarUsuario("alice")
	base := "/usuarios/" + strconv.FormatUint(id, 10)

	for _, path := range []string{
		base + "/seguidores",
		base + "/seguindo",
		"/usuarios?usuario=ninguem-com-esse-nome",
		"/publicacoes",
		"/publicacoes/usuario/" + strconv.FormatUint(id, 10),
	} {
		w := a.req(http.MethodGet, path, "", token)
		esperarStatus(t, w, http.StatusOK)
		if got := w.Body.String(); got != "[]\n" {
			t.Errorf("%s: corpo %q, esperado []", path, got)
		}
	}
}
