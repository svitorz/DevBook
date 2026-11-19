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
	"strconv"
	"strings"

	"github.com/gorilla/mux"
)

func (c *Controllers) CriarUsuario(w http.ResponseWriter, r *http.Request) {
	request, err := ioutil.ReadAll(r.Body)
	if err != nil {
		responses.Err(w, http.StatusUnprocessableEntity, err)
		return
	}

	var usuario models.Usuario
	if err = json.Unmarshal(request, &usuario); err != nil {
		responses.Err(w, http.StatusBadRequest, err)
		return
	}

	if err := usuario.Preparar("cadastrar"); err != nil {
		responses.Err(w, http.StatusBadRequest, err)
		return
	}

	repository := repository.NewUsersRepository(c.db)
	usuario.ID, err = repository.Store(usuario)
	if err != nil {
		responses.Err(w, http.StatusInternalServerError, err)
		return
	}

	usuario.Senha = "" // nunca devolver o hash (omitempty remove o campo)
	responses.JSON(w, http.StatusCreated, usuario)
}

func (c *Controllers) BuscarUsuarios(w http.ResponseWriter, r *http.Request) {
	nomeOuNick := strings.ToLower((r.URL.Query().Get("usuario")))

	rep := repository.NewUsersRepository(c.db)
	users, err := rep.ShowAll(nomeOuNick)
	if err != nil {
		responses.Err(w, http.StatusInternalServerError, err)
		return
	}

	responses.JSON(w, http.StatusOK, users)
}

func (c *Controllers) BuscarUsuario(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)

	userID, err := strconv.ParseUint(params["usuarioId"], 10, 64)
	if err != nil {
		responses.Err(w, http.StatusBadRequest, err)
		return
	}

	repository := repository.NewUsersRepository(c.db)
	user, err := repository.Show(userID)
	if err != nil {
		responderErroDeBusca(w, err)
		return
	}

	responses.JSON(w, http.StatusOK, user)
}

func (c *Controllers) AtualizarUsuario(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)

	userID, err := strconv.ParseUint(params["usuarioId"], 10, 64)
	if err != nil {
		responses.Err(w, http.StatusBadRequest, err)
		return
	}

	tokenUserId, err := auth.GetUserID(r)
	if err != nil {
		responses.Err(w, http.StatusUnauthorized, err)
		return
	}

	if userID != tokenUserId {
		responses.Err(w, http.StatusForbidden, errors.New("não é possível alterar um usuário se não o seu"))
		return
	}

	request, err := ioutil.ReadAll(r.Body)
	if err != nil {
		responses.Err(w, http.StatusUnprocessableEntity, err)
		return
	}

	var user models.Usuario

	if err = json.Unmarshal(request, &user); err != nil {
		responses.Err(w, http.StatusBadRequest, err)
		return
	}

	if err := user.Preparar("atualizar"); err != nil {
		responses.Err(w, http.StatusBadRequest, err)
		return
	}

	repository := repository.NewUsersRepository(c.db)
	if err = repository.Update(userID, user); err != nil {
		responses.Err(w, http.StatusInternalServerError, err)
		return
	}

	responses.JSON(w, http.StatusOK, nil)
}

func (c *Controllers) DeletarUsuario(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	userID, err := strconv.ParseUint(params["usuarioId"], 10, 64)
	if err != nil {
		responses.Err(w, http.StatusBadRequest, err)
		return
	}

	tokenUserId, err := auth.GetUserID(r)
	if err != nil {
		responses.Err(w, http.StatusUnauthorized, err)
		return
	}

	if userID != tokenUserId {
		responses.Err(w, http.StatusForbidden, errors.New("não é possível deletar um usuário se não o seu"))
		return
	}
	repository := repository.NewUsersRepository(c.db)
	if err = repository.Destroy(userID); err != nil {
		responses.Err(w, http.StatusInternalServerError, err)
		return
	}

	responses.JSON(w, http.StatusNoContent, nil)
}

func (c *Controllers) SeguirUsuario(w http.ResponseWriter, r *http.Request) {
	seguidorID, err := auth.GetUserID(r)
	if err != nil {
		responses.Err(w, http.StatusUnauthorized, err)
		return
	}

	params := mux.Vars(r)
	usuarioId, err := strconv.ParseUint(params["usuarioId"], 10, 64)
	if err != nil {
		responses.Err(w, http.StatusBadRequest, err)
		return
	}

	if seguidorID == usuarioId {
		responses.Err(w, http.StatusForbidden, errors.New("Não é possível seguir você mesmo."))
		return
	}

	repository := repository.NewUsersRepository(c.db)

	if err = repository.Follow(usuarioId, seguidorID); err != nil {
		responses.Err(w, http.StatusInternalServerError, err)
		return
	}

	responses.JSON(w, http.StatusNoContent, nil)
}

func (c *Controllers) PararDeSeguirUsuario(w http.ResponseWriter, r *http.Request) {
	seguidorID, err := auth.GetUserID(r)
	if err != nil {
		responses.Err(w, http.StatusUnauthorized, err)
		return
	}

	params := mux.Vars(r)
	usuarioId, err := strconv.ParseUint(params["usuarioId"], 10, 64)
	if err != nil {
		responses.Err(w, http.StatusBadRequest, err)
		return
	}

	if seguidorID == usuarioId {
		responses.Err(w, http.StatusForbidden, errors.New("Não é possível parar de seguir você mesmo."))
		return
	}

	repository := repository.NewUsersRepository(c.db)
	if err = repository.Unfollow(usuarioId, seguidorID); err != nil {
		responses.Err(w, http.StatusInternalServerError, err)
		return
	}

	responses.JSON(w, http.StatusNoContent, nil)
}

func (c *Controllers) BuscarSeguidores(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	usuarioId, err := strconv.ParseUint(params["usuarioId"], 10, 64)
	if err != nil {
		responses.Err(w, http.StatusBadRequest, err)
		return
	}

	repository := repository.NewUsersRepository(c.db)
	seguidores, err := repository.GetFollowers(usuarioId)
	if err != nil {
		responses.Err(w, http.StatusInternalServerError, err)
		return
	}

	responses.JSON(w, http.StatusOK, seguidores)
}

func (c *Controllers) BuscarSeguindo(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	usuarioId, err := strconv.ParseUint(params["usuarioId"], 10, 64)
	if err != nil {
		responses.Err(w, http.StatusBadRequest, err)
		return
	}

	repository := repository.NewUsersRepository(c.db)
	seguidores, err := repository.GetFollowing(usuarioId)
	if err != nil {
		responses.Err(w, http.StatusInternalServerError, err)
		return
	}

	responses.JSON(w, http.StatusOK, seguidores)
}

func (c *Controllers) AtualizarSenha(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)

	userID, err := strconv.ParseUint(params["usuarioId"], 10, 64)
	if err != nil {
		responses.Err(w, http.StatusBadRequest, err)
		return
	}

	tokenUserId, err := auth.GetUserID(r)
	if err != nil {
		responses.Err(w, http.StatusUnauthorized, err)
		return
	}

	if userID != tokenUserId {
		responses.Err(w, http.StatusForbidden, errors.New("não é possível alterar um usuário se não o seu"))
		return
	}

	request, err := ioutil.ReadAll(r.Body)
	if err != nil {
		responses.Err(w, http.StatusUnprocessableEntity, err)
		return
	}
	var senha models.Senha
	if err = json.Unmarshal(request, &senha); err != nil {
		responses.Err(w, http.StatusBadRequest, err)
		return
	}

	repository := repository.NewUsersRepository(c.db)
	senhaAntiga, err := repository.GetPassword(userID)
	if err != nil {
		responses.Err(w, http.StatusInternalServerError, err)
		return
	}

	if err = security.CheckPassword(senha.Atual, senhaAntiga); err != nil {
		responses.Err(w, http.StatusUnauthorized, err)
		return
	}

	passwordHash, err := security.Hash(senha.Nova)
	if err != nil {
		responses.Err(w, http.StatusInternalServerError, err)
		return
	}

	if err = repository.UpdatePassword(userID, string(passwordHash)); err != nil {
		responses.Err(w, http.StatusInternalServerError, err)
		return
	}
	responses.JSON(w, http.StatusNoContent, nil)
}
