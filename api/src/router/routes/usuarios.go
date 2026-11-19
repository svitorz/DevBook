package routes

import (
	"api/src/controllers"
	"net/http"
)

func rotasUsuarios(c *controllers.Controllers) []Route {
	return []Route{
		{
			URI:                "/usuarios",
			Metodo:             http.MethodPost,
			Funcao:             c.CriarUsuario,
			RequerAutenticacao: false,
		},
		{
			URI:                "/usuarios",
			Metodo:             http.MethodGet,
			Funcao:             c.BuscarUsuarios,
			RequerAutenticacao: true,
		},
		{
			URI:                "/usuario/{usuarioId}",
			Metodo:             http.MethodGet,
			Funcao:             c.BuscarUsuario,
			RequerAutenticacao: true,
		},
		{
			URI:                "/usuarios/{usuarioId}",
			Metodo:             http.MethodPut,
			Funcao:             c.AtualizarUsuario,
			RequerAutenticacao: true,
		},
		{
			URI:                "/usuarios/{usuarioId}",
			Metodo:             http.MethodDelete,
			Funcao:             c.DeletarUsuario,
			RequerAutenticacao: false,
		},
		{
			URI:                "/usuarios/{usuarioId}/seguir",
			Metodo:             http.MethodPost,
			Funcao:             c.SeguirUsuario,
			RequerAutenticacao: true,
		},
		{
			URI:                "/usuarios/{usuarioId}/parar-de-seguir",
			Metodo:             http.MethodPost,
			Funcao:             c.PararDeSeguirUsuario,
			RequerAutenticacao: true,
		},
		{
			URI:                "/usuarios/{usuarioId}/seguidores",
			Metodo:             http.MethodGet,
			Funcao:             c.BuscarSeguidores,
			RequerAutenticacao: true,
		},
		{
			URI:                "/usuarios/{usuarioId}/seguindo",
			Metodo:             http.MethodGet,
			Funcao:             c.BuscarSeguindo,
			RequerAutenticacao: true,
		},
		{
			URI:                "/usuarios/{usuarioId}/atualizar-senha",
			Metodo:             http.MethodPost,
			Funcao:             c.AtualizarSenha,
			RequerAutenticacao: true,
		},
	}
}
