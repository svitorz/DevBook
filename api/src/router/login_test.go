package router_test

import (
	"net/http"
	"testing"
)

// N2: o login não pode revelar se o e-mail existe.
func TestN2_LoginNaoRevelaSeEmailExiste(t *testing.T) {
	a := novaAPI(t)
	a.criarUsuario("alice")

	senhaErrada := a.req(http.MethodPost, "/login", `{"email":"alice@devbook.test","senha":"Errada@123"}`, "")
	emailInexistente := a.req(http.MethodPost, "/login", `{"email":"ninguem@devbook.test","senha":"Errada@123"}`, "")

	esperarStatus(t, senhaErrada, http.StatusUnauthorized)
	esperarStatus(t, emailInexistente, http.StatusUnauthorized)
	if senhaErrada.Body.String() != emailInexistente.Body.String() {
		t.Fatalf("respostas diferentes:\n senha errada:      %s\n e-mail inexistente: %s",
			senhaErrada.Body.String(), emailInexistente.Body.String())
	}
}
