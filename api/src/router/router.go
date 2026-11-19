package router

import (
	"api/src/controllers"
	"api/src/middleware"
	"api/src/router/routes"
	"net/http"

	"github.com/gorilla/mux"
	"gorm.io/gorm"
)

func Gerar(db *gorm.DB) http.Handler {
	r := routes.Configurar(mux.NewRouter(), controllers.New(db))
	return middleware.CORS(r)
}
