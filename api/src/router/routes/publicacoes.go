package routes

import (
	"api/src/controllers"
	"net/http"
)

func rotasPublicacoes(c *controllers.Controllers) []Route {
	return []Route{
		{
			URI:                "/publicacoes",
			Metodo:             http.MethodPost,
			Funcao:             c.CriarPublicacao,
			RequerAutenticacao: true,
		},
		{
			URI:                "/publicacoes",
			Metodo:             http.MethodGet,
			Funcao:             c.BuscarPublicacoes,
			RequerAutenticacao: true,
		},
		{
			URI:                "/publicacoes/{publicacaoId}",
			Metodo:             http.MethodGet,
			Funcao:             c.BuscarPublicacao,
			RequerAutenticacao: true,
		},
		{
			URI:                "/publicacoes/usuario/{usuarioId}",
			Metodo:             http.MethodGet,
			Funcao:             c.BuscarPublicacaoDoUsuario,
			RequerAutenticacao: true,
		},
		{
			URI:                "/publicacoes/{publicacaoId}",
			Metodo:             http.MethodPut,
			Funcao:             c.AtualizarPublicacao,
			RequerAutenticacao: true,
		},
		{
			URI:                "/publicacoes/{publicacaoId}",
			Metodo:             http.MethodDelete,
			Funcao:             c.DeletarPublicacao,
			RequerAutenticacao: true,
		},
		{
			URI:                "/publicacoes/{publicacaoId}/curtir",
			Metodo:             http.MethodPost,
			Funcao:             c.CurtirPublicacao,
			RequerAutenticacao: true,
		},
		{
			URI:                "/publicacoes/{publicacaoId}/descurtir",
			Metodo:             http.MethodPost,
			Funcao:             c.DescurtirPublicacao,
			RequerAutenticacao: true,
		},
	}
}
