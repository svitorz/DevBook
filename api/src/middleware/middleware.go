package middleware

import (
	"api/src/auth"
	"api/src/config"
	"api/src/responses"
	"log"
	"net/http"
)

func Logger(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		log.Printf("\n %s %s %s", r.Method, r.RequestURI, r.Host)
		next(w, r)
	}
}

func Autenticar(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if err := auth.ValidateToken(r); err != nil {
			responses.Err(w, http.StatusUnauthorized, err)
			return
		}
		next(w, r)
	}
}

// CORS libera a origem do front (config.CorsOrigin). Envolve o router
// inteiro porque o mux responderia 405 ao preflight OPTIONS antes de
// chegar em qualquer middleware de rota.
func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if origem := r.Header.Get("Origin"); origem != "" && origem == config.CorsOrigin {
			h := w.Header()
			h.Set("Access-Control-Allow-Origin", origem)
			h.Add("Vary", "Origin")
			h.Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			h.Set("Access-Control-Allow-Headers", "Authorization, Content-Type")

			if r.Method == http.MethodOptions && r.Header.Get("Access-Control-Request-Method") != "" {
				w.WriteHeader(http.StatusNoContent)
				return
			}
		}
		next.ServeHTTP(w, r)
	})
}
