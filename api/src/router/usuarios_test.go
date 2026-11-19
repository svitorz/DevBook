package router_test

import (
	"net/http"
	"strconv"
	"testing"
)

// N7: usuário inexistente responde 404, não 200 com objeto zerado.
func TestN7_UsuarioInexistente404(t *testing.T) {
	a := novaAPI(t)
	_, token := a.criarUsuario("alice")

	w := a.req(http.MethodGet, "/usuario/999999", "", token)
	esperarStatus(t, w, http.StatusNotFound)
}

// H4: seguir/parar de seguir a si mesmo responde 403 e não grava nada.
func TestH4_SeguirASiMesmo403SemEfeito(t *testing.T) {
	a := novaAPI(t)
	id, token := a.criarUsuario("alice")
	base := "/usuarios/" + strconv.FormatUint(id, 10)

	w := a.req(http.MethodPost, base+"/seguir", "", token)
	esperarStatus(t, w, http.StatusForbidden)

	var n int64
	testDB.Raw("SELECT COUNT(*) FROM SEGUIDORES WHERE usuario_id = ? AND seguidor_id = ?", id, id).Scan(&n)
	if n != 0 {
		t.Fatalf("auto-follow foi gravado mesmo com 403 (%d linha)", n)
	}

	w = a.req(http.MethodPost, base+"/parar-de-seguir", "", token)
	esperarStatus(t, w, http.StatusForbidden)
}

// H8: PUT de perfil sem senha atualiza o usuário.
func TestH8_AtualizarPerfilSemSenha(t *testing.T) {
	a := novaAPI(t)
	id, token := a.criarUsuario("alice")

	body := `{"nome":"Alice Editada","nick":"alice","email":"alice@devbook.test"}`
	w := a.req(http.MethodPut, "/usuarios/"+strconv.FormatUint(id, 10), body, token)
	if w.Code >= 300 {
		t.Fatalf("status %d; corpo: %s", w.Code, w.Body.String())
	}

	var nome string
	testDB.Raw("SELECT nome FROM USUARIOS WHERE id = ?", id).Scan(&nome)
	if nome != "Alice Editada" {
		t.Fatalf("nome no banco = %q", nome)
	}
}

// N1: a resposta do cadastro não pode expor o hash da senha.
func TestN1_CadastroNaoExpoeSenha(t *testing.T) {
	a := novaAPI(t)
	w := a.req(http.MethodPost, "/usuarios",
		`{"nome":"Alice","nick":"alice","email":"alice@devbook.test","senha":"Senha@123"}`, "")
	esperarStatus(t, w, http.StatusCreated)

	var corpo map[string]any
	decodificar(t, w, &corpo)
	if _, tem := corpo["senha"]; tem {
		t.Fatalf("resposta expõe senha: %s", w.Body.String())
	}
}
