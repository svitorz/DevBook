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

// H14: login responde JSON {"token": "..."} e o token funciona.
func TestH14_LoginRespondeJSONComToken(t *testing.T) {
	a := novaAPI(t)
	a.criarUsuario("alice")

	w := a.req(http.MethodPost, "/login", `{"email":"alice@devbook.test","senha":"`+senhaValida+`"}`, "")
	esperarStatus(t, w, http.StatusOK)
	if ct := w.Header().Get("Content-Type"); ct != "application/json" {
		t.Fatalf("Content-Type = %q", ct)
	}
	var corpo struct {
		Token string `json:"token"`
	}
	decodificar(t, w, &corpo)
	if corpo.Token == "" {
		t.Fatalf("sem token: %s", w.Body.String())
	}

	esperarStatus(t, a.req(http.MethodGet, "/publicacoes", "", corpo.Token), http.StatusOK)
}
