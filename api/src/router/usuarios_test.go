package router_test

import (
	"net/http"
	"testing"
)

// N7: usuário inexistente responde 404, não 200 com objeto zerado.
func TestN7_UsuarioInexistente404(t *testing.T) {
	a := novaAPI(t)
	_, token := a.criarUsuario("alice")

	w := a.req(http.MethodGet, "/usuario/999999", "", token)
	esperarStatus(t, w, http.StatusNotFound)
}
