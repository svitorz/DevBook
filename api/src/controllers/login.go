package controllers

import (
	"api/src/auth"
	"api/src/models"
	"api/src/repository"
	"api/src/responses"
	"api/src/security"
	"encoding/json"
	"errors"
	"io/ioutil"
	"net/http"
)

var errCredenciaisInvalidas = errors.New("e-mail ou senha inválidos")

func (c *Controllers) Login(w http.ResponseWriter, r *http.Request) {
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		responses.Err(w, http.StatusBadRequest, err)
		return
	}

	var usuario models.Usuario

	if err = json.Unmarshal(body, &usuario); err != nil {
		responses.Err(w, http.StatusBadRequest, err)
		return
	}

	repository := repository.NewUsersRepository(c.db)

	usuarioSalvoNoBanco, err := repository.FindByEmail(usuario.Email)
	if err != nil {
		responses.Err(w, http.StatusInternalServerError, err)
		return
	}

	// Mesma resposta para e-mail inexistente e senha errada: não revela
	// quais e-mails estão cadastrados. (FindByEmail devolve usuário zerado
	// quando não encontra, e o bcrypt falha contra hash vazio.)
	if err = security.CheckPassword(usuario.Senha, usuarioSalvoNoBanco.Senha); err != nil {
		responses.Err(w, http.StatusUnauthorized, errCredenciaisInvalidas)
		return
	}

	token, err := auth.CreateToken(usuarioSalvoNoBanco.ID)
	if err != nil {
		responses.Err(w, http.StatusInternalServerError, err)
		return
	}

	responses.JSON(w, http.StatusOK, struct {
		ID    uint64 `json:"id"`
		Token string `json:"token"`
	}{ID: usuarioSalvoNoBanco.ID, Token: token})
}
