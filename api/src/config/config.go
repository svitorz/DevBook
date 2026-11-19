package config

import (
	"errors"
	"fmt"
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

var (
	StringConexaoBanco = ""
	Port               = 0
	SecretKey          []byte
	// Origem do front liberada no CORS (Vite usa 5173 por padrão).
	CorsOrigin = "http://localhost:5173"
)

// Carregar lê a configuração do ambiente. Retorna erro se algo obrigatório faltar.
func Carregar() error {
	var err error

	// No container as variáveis vêm do compose e não existe .env; só avisa.
	if err = godotenv.Load(); err != nil {
		log.Println("aviso: .env não carregado, usando variáveis do ambiente:", err)
	}

	Port, err = strconv.Atoi(os.Getenv("API_PORT"))
	if err != nil {
		Port = 9000
	}

	StringConexaoBanco = fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8&parseTime=True&loc=Local",
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASS"),
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_NAME"),
	)

	if origem := os.Getenv("CORS_ORIGIN"); origem != "" {
		CorsOrigin = origem
	}

	SecretKey = []byte(os.Getenv("SECRET_KEY"))
	if len(SecretKey) == 0 {
		return errors.New("SECRET_KEY não definida: o servidor não sobe sem chave para assinar os tokens")
	}

	return nil
}
