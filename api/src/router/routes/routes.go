package routes

import (
	"api/src/controllers"
	"api/src/middleware"
	"net/http"

	"github.com/gorilla/mux"
)

type Route struct {
	URI                string
	Metodo             string
	Funcao             func(http.ResponseWriter, *http.Request)
	RequerAutenticacao bool
}

func Configurar(r *mux.Router, c *controllers.Controllers) *mux.Router {
	routes := rotasUsuarios(c)
	routes = append(routes, rotaLogin(c))
	routes = append(routes, rotasPublicacoes(c)...)
	for _, route := range routes {
		handler := route.Funcao
		if route.RequerAutenticacao {
			handler = middleware.Autenticar(handler)
		}
		// Um único registro por rota; o Logger envolve todas.
		r.HandleFunc(route.URI, middleware.Logger(handler)).Methods(route.Metodo)
	}

	return r
}
