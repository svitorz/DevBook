package responses

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// H14: 204 não tem corpo (antes escrevia "null").
func TestH14_NoContentSemCorpo(t *testing.T) {
	w := httptest.NewRecorder()
	JSON(w, http.StatusNoContent, nil)

	if w.Code != http.StatusNoContent || w.Body.Len() != 0 {
		t.Fatalf("status %d, corpo %q; esperado 204 sem corpo", w.Code, w.Body.String())
	}
}

// H14: erro 5xx não expõe detalhes internos (SQL, driver) ao cliente.
func TestH14_Erro500NaoVazaDetalhes(t *testing.T) {
	w := httptest.NewRecorder()
	Err(w, http.StatusInternalServerError, errors.New("Error 1452 (23000): Cannot add or update a child row"))

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("status %d", w.Code)
	}
	if strings.Contains(w.Body.String(), "1452") || !strings.Contains(w.Body.String(), `"erro"`) {
		t.Fatalf("corpo do 500: %s", w.Body.String())
	}
}

// Erros 4xx continuam mostrando a mensagem (é ela que o front exibe).
func TestErro4xxMantemMensagem(t *testing.T) {
	w := httptest.NewRecorder()
	Err(w, http.StatusBadRequest, errors.New("o título da publicação não pode estar vazio"))

	if !strings.Contains(w.Body.String(), "o título da publicação não pode estar vazio") {
		t.Fatalf("corpo do 400: %s", w.Body.String())
	}
}
