package responses

import (
	"encoding/json"
	"log"
	"net/http"
)

// JSON escreve a resposta. 204 (ou dados nil) não leva corpo.
func JSON(w http.ResponseWriter, statusCode int, dados interface{}) {
	if statusCode == http.StatusNoContent || dados == nil {
		w.WriteHeader(statusCode)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	if err := json.NewEncoder(w).Encode(dados); err != nil {
		log.Println("erro ao codificar resposta:", err)
	}
}

// Err responde {"erro": "..."}. Em 5xx o detalhe vai só para o log: a
// mensagem interna (SQL, driver) não deve chegar ao cliente.
func Err(w http.ResponseWriter, statusCode int, err error) {
	mensagem := err.Error()
	if statusCode >= http.StatusInternalServerError {
		log.Printf("erro %d: %v", statusCode, err)
		mensagem = "erro interno do servidor"
	}

	JSON(w, statusCode, struct {
		Erro string `json:"erro"`
	}{
		Erro: mensagem,
	})
}
