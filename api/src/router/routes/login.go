package routes

import (
	"api/src/controllers"
	"net/http"
)

func rotaLogin(c *controllers.Controllers) Route {
	return Route{
		URI:                "/login",
		Metodo:             http.MethodPost,
		Funcao:             c.Login,
		RequerAutenticacao: false,
	}
}
