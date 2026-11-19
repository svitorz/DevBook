package main

import (
	"api/src/config"
	"api/src/database"
	"api/src/router"
	"fmt"
	"log"
	"net/http"
)

func main() {
	config.Carregar()

	db, err := database.Conectar()
	if err != nil {
		log.Fatal("erro ao conectar no banco: ", err)
	}

	r := router.Gerar(db)

	fmt.Println("Escutando na porta:", config.Port)
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%d", config.Port), r))
}
