package models

import (
	"api/src/security"
	"errors"
	"regexp"
	"strings"
	"time"

	"github.com/badoux/checkmail"
)

type Usuario struct {
	ID       uint64    `json:"id,omitempty" gorm:"column:id;primaryKey"`
	Nome     string    `json:"nome,omitempty" gorm:"column:nome"`
	Nick     string    `json:"nick,omitempty" gorm:"column:nick"`
	Email    string    `json:"email,omitempty" gorm:"column:email"`
	Senha    string    `json:"senha,omitempty" gorm:"column:senha"`
	CriadoEm time.Time `json:"criadoem" gorm:"column:criadoEm;default:CURRENT_TIMESTAMP"`
}

func (Usuario) TableName() string {
	return "USUARIOS"
}

func (usuario *Usuario) Preparar(action string) error {
	if err := usuario.validar(action); err != nil {
		return err
	}

	if err := usuario.formatar(action); err != nil {
		return err
	}

	return nil
}

func (usuario *Usuario) validar(action string) error {
	if usuario.Nome == "" {
		return errors.New("o nome é obrigatório e não pode estar em branco")
	}
	if usuario.Nick == "" {
		return errors.New("o nick é obrigatório e não pode estar em branco")
	}
	if usuario.Email == "" {
		return errors.New("o email é obrigatório e não pode estar em branco")
	}

	if err := checkmail.ValidateFormat(usuario.Email); err != nil {
		return errors.New(" e-mail inserido é inválido")
	}

	// A senha só é validada no cadastro: o PUT de perfil não a envia
	// (troca de senha tem rota própria, /atualizar-senha).
	if action == "cadastrar" {
		if err := validarSenha(usuario.Senha); err != nil {
			return err
		}
	}

	if len(usuario.Nome) > 50 {
		return errors.New("o nome não pode ter mais que 50 caracteres")
	}
	if len(usuario.Nick) > 50 {
		return errors.New("o nick não pode ter mais que 50 caracteres")
	}
	if len(usuario.Email) > 50 {
		return errors.New("o email não pode ter mais que 50 caracteres")
	}
	return nil
}

func validarSenha(senha string) error {
	if senha == "" {
		return errors.New("o senha é obrigatório e não pode estar em branco")
	}

	if len(senha) < 8 {
		return errors.New("a senha deve ter ao menos 8 caracteres")
	}

	if ok, err := regexp.MatchString(`[A-Z]`, senha); err != nil {
		return err
	} else if !ok {
		return errors.New("a senha deve conter ao menos uma letra maiúscula")
	}
	if ok, err := regexp.MatchString(`[a-z]`, senha); err != nil {
		return err
	} else if !ok {
		return errors.New("a senha deve conter ao menos uma letra minúscula")
	}
	if ok, err := regexp.MatchString(`[0-9]`, senha); err != nil {
		return err
	} else if !ok {
		return errors.New("a senha deve conter ao menos um número")
	}
	if ok, err := regexp.MatchString(`[!@#\$%\^&\*\(\)_\+\-=\[\]\{\};':"\\|,.<>\/?]`, senha); err != nil {
		return err
	} else if !ok {
		return errors.New("a senha deve conter ao menos um caracter especial. EX: !@#$")
	}
	return nil
}

func (usuario *Usuario) formatar(etapa string) error {
	usuario.Nome = strings.TrimSpace(usuario.Nome)
	usuario.Nick = strings.TrimSpace(usuario.Nick)
	usuario.Email = strings.TrimSpace(usuario.Email)

	if etapa == "cadastrar" {
		senhaComHash, err := security.Hash(usuario.Senha)
		if err != nil {
			return err
		}

		usuario.Senha = string(senhaComHash)
	}

	return nil
}
