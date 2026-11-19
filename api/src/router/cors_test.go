package router_test

import (
	"api/src/router"
	"net/http"
	"net/http/httptest"
	"testing"
)

const origemFront = "http://localhost:5173"

func preflight(origem string) *httptest.ResponseRecorder {
	r := httptest.NewRequest(http.MethodOptions, "/publicacoes", nil)
	r.Header.Set("Origin", origem)
	r.Header.Set("Access-Control-Request-Method", http.MethodPost)
	r.Header.Set("Access-Control-Request-Headers", "authorization, content-type")
	w := httptest.NewRecorder()
	router.Gerar(nil).ServeHTTP(w, r)
	return w
}

// H16: preflight da origem do front é aceito.
func TestH16_PreflightDaOrigemDoFront(t *testing.T) {
	w := preflight(origemFront)
	esperarStatus(t, w, http.StatusNoContent)
	if got := w.Header().Get("Access-Control-Allow-Origin"); got != origemFront {
		t.Fatalf("Allow-Origin = %q", got)
	}
	if w.Header().Get("Access-Control-Allow-Headers") == "" || w.Header().Get("Access-Control-Allow-Methods") == "" {
		t.Fatalf("faltam Allow-Headers/Allow-Methods: %v", w.Header())
	}
}

// H16: outra origem não recebe os headers (o navegador bloqueia).
func TestH16_OutraOrigemNaoELiberada(t *testing.T) {
	w := preflight("http://evil.test")
	if got := w.Header().Get("Access-Control-Allow-Origin"); got != "" {
		t.Fatalf("origem não autorizada liberada: %q", got)
	}
}

// H16: respostas normais (inclusive erro) levam o header, senão o front não lê o 401.
func TestH16_RespostaDeErroTambemLevaCORS(t *testing.T) {
	r := httptest.NewRequest(http.MethodGet, "/usuarios", nil)
	r.Header.Set("Origin", origemFront)
	w := httptest.NewRecorder()
	router.Gerar(nil).ServeHTTP(w, r)

	esperarStatus(t, w, http.StatusUnauthorized)
	if got := w.Header().Get("Access-Control-Allow-Origin"); got != origemFront {
		t.Fatalf("Allow-Origin = %q", got)
	}
}
