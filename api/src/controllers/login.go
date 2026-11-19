package controllers

import (
	"api/src/auth"
	"api/src/models"
	"api/src/repository"
	"api/src/responses"
	"api/src/security"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
)

func (c *Controllers) Login(w http.ResponseWriter, r *http.Request) {
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		responses.Err(w, http.StatusUnprocessableEntity, err)
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

	if err = security.CheckPassword(usuario.Senha, usuarioSalvoNoBanco.Senha); err != nil {
		responses.Err(w, http.StatusUnauthorized, err)
		fmt.Println(err)
		return
	}

	token, err := auth.CreateToken(usuarioSalvoNoBanco.ID)
	if err != nil {
		responses.Err(w, http.StatusInternalServerError, err)
		return
	}

	w.Write([]byte(token))
}
