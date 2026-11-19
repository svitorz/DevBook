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

	w := a.req(http.MethodGet, "/usuarios/999999", "", token)
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

// N4: /seguindo lista quem o usuário segue (e não ele mesmo).
func TestN4_SeguindoListaQuemOUsuarioSegue(t *testing.T) {
	a := novaAPI(t)
	aliceID, tokenAlice := a.criarUsuario("alice")
	bobID, _ := a.criarUsuario("bob")
	carolID, _ := a.criarUsuario("carol")

	for _, alvo := range []uint64{bobID, carolID} {
		w := a.req(http.MethodPost, "/usuarios/"+strconv.FormatUint(alvo, 10)+"/seguir", "", tokenAlice)
		if w.Code >= 300 {
			t.Fatalf("seguir %d: status %d", alvo, w.Code)
		}
	}

	w := a.req(http.MethodGet, "/usuarios/"+strconv.FormatUint(aliceID, 10)+"/seguindo", "", tokenAlice)
	esperarStatus(t, w, http.StatusOK)
	var lista []struct {
		ID uint64 `json:"id"`
	}
	decodificar(t, w, &lista)

	ids := map[uint64]bool{}
	for _, u := range lista {
		ids[u.ID] = true
	}
	if len(lista) != 2 || !ids[bobID] || !ids[carolID] {
		t.Fatalf("seguindo = %s; esperado bob (%d) e carol (%d)", w.Body.String(), bobID, carolID)
	}
}

// H13: o detalhe do usuário fica em /usuarios/{id} (plural, como no resto da API).
func TestH13_BuscarUsuarioNaRotaPlural(t *testing.T) {
	a := novaAPI(t)
	id, token := a.criarUsuario("alice")

	esperarStatus(t, a.req(http.MethodGet, "/usuarios/"+strconv.FormatUint(id, 10), "", token), http.StatusOK)
	// a rota singular antiga deixa de existir
	esperarStatus(t, a.req(http.MethodGet, "/usuario/"+strconv.FormatUint(id, 10), "", token), http.StatusNotFound)
}
