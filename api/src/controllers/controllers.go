package controllers

import (
	"api/src/responses"
	"errors"
	"net/http"

	"gorm.io/gorm"
)

// responderErroDeBusca traduz o erro de uma busca por id: 404 quando o
// registro não existe, 500 para qualquer outra falha.
func responderErroDeBusca(w http.ResponseWriter, err error) {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		responses.Err(w, http.StatusNotFound, errors.New("recurso não encontrado"))
		return
	}
	responses.Err(w, http.StatusInternalServerError, err)
}

// Controllers agrupa os handlers HTTP e as dependências que eles usam.
// O *gorm.DB é criado uma única vez no boot (ele já é um pool de conexões)
// e compartilhado por todas as requisições.
type Controllers struct {
	db *gorm.DB
}

func New(db *gorm.DB) *Controllers {
	return &Controllers{db: db}
}
