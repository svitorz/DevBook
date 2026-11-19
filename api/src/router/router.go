package router

import (
	"api/src/controllers"
	"api/src/router/routes"

	"github.com/gorilla/mux"
	"gorm.io/gorm"
)

func Gerar(db *gorm.DB) *mux.Router {
	r := mux.NewRouter()
	return routes.Configurar(r, controllers.New(db))
}
