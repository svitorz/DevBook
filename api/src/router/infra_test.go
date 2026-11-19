package router_test

import (
	"fmt"
	"net/http"
	"testing"
)

// Garante que a infraestrutura de teste funciona de ponta a ponta.
func TestInfra_CadastraEBuscaUsuario(t *testing.T) {
	a := novaAPI(t)
	id, token := a.criarUsuario("infra")

	w := a.req(http.MethodGet, fmt.Sprintf("/usuarios/%d", id), "", token)
	esperarStatus(t, w, http.StatusOK)
}
