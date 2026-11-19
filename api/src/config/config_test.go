package config

import "testing"

// H7: sem SECRET_KEY o servidor não pode subir (assinaria tokens com chave vazia).
func TestH7_SecretKeyVaziaFalhaNoBoot(t *testing.T) {
	t.Setenv("SECRET_KEY", "")
	if err := Carregar(); err == nil {
		t.Fatal("Carregar() aceitou SECRET_KEY vazia")
	}
}

func TestH7_SecretKeyPreenchidaCarrega(t *testing.T) {
	t.Setenv("SECRET_KEY", "uma-chave-qualquer")
	if err := Carregar(); err != nil {
		t.Fatalf("Carregar() falhou com SECRET_KEY definida: %v", err)
	}
	if string(SecretKey) != "uma-chave-qualquer" {
		t.Fatalf("SecretKey = %q", SecretKey)
	}
}
