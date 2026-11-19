package controllers

import "gorm.io/gorm"

// Controllers agrupa os handlers HTTP e as dependências que eles usam.
// O *gorm.DB é criado uma única vez no boot (ele já é um pool de conexões)
// e compartilhado por todas as requisições.
type Controllers struct {
	db *gorm.DB
}

func New(db *gorm.DB) *Controllers {
	return &Controllers{db: db}
}
