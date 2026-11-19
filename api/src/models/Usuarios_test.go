package models

import "testing"

// H8: atualizar perfil não envia senha (ela muda em /atualizar-senha).
func TestH8_AtualizarSemSenhaEValido(t *testing.T) {
	u := Usuario{Nome: "Alice", Nick: "alice", Email: "alice@devbook.test"}
	if err := u.Preparar("atualizar"); err != nil {
		t.Fatalf("atualizar sem senha foi rejeitado: %v", err)
	}
}

func TestCadastroContinuaExigindoSenhaForte(t *testing.T) {
	casos := map[string]string{
		"vazia":         "",
		"curta":         "Ab@1",
		"sem maiúscula": "senha@123",
		"sem especial":  "Senha1234",
		"sem número":    "Senha@abc",
		"sem minúscula": "SENHA@123",
	}
	for nome, senha := range casos {
		u := Usuario{Nome: "Alice", Nick: "alice", Email: "alice@devbook.test", Senha: senha}
		if err := u.Preparar("cadastrar"); err == nil {
			t.Errorf("cadastro aceitou senha %s (%q)", nome, senha)
		}
	}

	u := Usuario{Nome: "Alice", Nick: "alice", Email: "alice@devbook.test", Senha: "Senha@123"}
	if err := u.Preparar("cadastrar"); err != nil {
		t.Fatalf("cadastro rejeitou senha forte: %v", err)
	}
}
