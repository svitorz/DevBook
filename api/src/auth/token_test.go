package auth

import (
	"api/src/config"
	"net/http/httptest"
	"testing"
)

func TestTokenValidoDevolveUserID(t *testing.T) {
	config.SecretKey = []byte("chave-de-teste")
	token, err := CreateToken(42)
	if err != nil {
		t.Fatal(err)
	}

	r := httptest.NewRequest("GET", "/", nil)
	r.Header.Set("Authorization", "Bearer "+token)

	if err := ValidateToken(r); err != nil {
		t.Fatalf("token válido rejeitado: %v", err)
	}
	id, err := GetUserID(r)
	if err != nil || id != 42 {
		t.Fatalf("GetUserID = %d, %v; esperado 42", id, err)
	}
}

func TestTokenAssinadoComOutraChaveRejeitado(t *testing.T) {
	config.SecretKey = []byte("chave-a")
	token, _ := CreateToken(1)
	config.SecretKey = []byte("chave-b")

	r := httptest.NewRequest("GET", "/", nil)
	r.Header.Set("Authorization", "Bearer "+token)
	if err := ValidateToken(r); err == nil {
		t.Fatal("token de outra chave foi aceito")
	}
}

func TestTokenExpiradoRejeitado(t *testing.T) {
	config.SecretKey = []byte("chave-de-teste")
	// header {"alg":"HS256","typ":"JWT"}, payload {"exp":1,"userId":1}, assinado com "chave-de-teste"
	expirado := "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjEsInVzZXJJZCI6MX0.lGybaONfOuYWfcLOXH00qDNx3jQ13-9mq_VY0TePr9g"

	r := httptest.NewRequest("GET", "/", nil)
	r.Header.Set("Authorization", "Bearer "+expirado)
	if err := ValidateToken(r); err == nil {
		t.Fatal("token expirado foi aceito")
	}
}

func TestTokenAlgNoneRejeitado(t *testing.T) {
	config.SecretKey = []byte("chave-de-teste")
	// header {"alg":"none","typ":"JWT"}, payload {"userId":1}, sem assinatura
	semAssinatura := "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VySWQiOjF9."

	r := httptest.NewRequest("GET", "/", nil)
	r.Header.Set("Authorization", "Bearer "+semAssinatura)
	if err := ValidateToken(r); err == nil {
		t.Fatal("token alg=none foi aceito")
	}
}

func TestSemHeaderRejeitado(t *testing.T) {
	config.SecretKey = []byte("chave-de-teste")
	r := httptest.NewRequest("GET", "/", nil)
	if err := ValidateToken(r); err == nil {
		t.Fatal("requisição sem Authorization foi aceita")
	}
}
