package controllers

import (
	"api/src/auth"
	"api/src/models"
	"api/src/repository"
	"api/src/responses"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

func (c *Controllers) CriarPublicacao(w http.ResponseWriter, r *http.Request) {
	userId, err := auth.GetUserID(r)
	if err != nil {
		responses.Err(w, http.StatusInternalServerError, err)
		return
	}

	request, err := io.ReadAll(r.Body)
	if err != nil {
		responses.Err(w, http.StatusUnprocessableEntity, err)
		return
	}

	var publicacao models.Publicacao
	if err = json.Unmarshal(request, &publicacao); err != nil {
		responses.Err(w, http.StatusForbidden, err)
		return
	}
	// Depois do Unmarshal: o autor vem do token, nunca do corpo.
	publicacao.AutorID = userId

	if err := publicacao.Preparar(); err != nil {
		responses.Err(w, http.StatusInternalServerError, err)
		return
	}

	newPostRespository := repository.NewPostsRepository(c.db)
	publicacao.ID, err = newPostRespository.Store(publicacao)
	if err != nil {
		responses.Err(w, http.StatusBadRequest, err)
		return
	}

	responses.JSON(w, http.StatusCreated, publicacao)
}

func (c *Controllers) BuscarPublicacao(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)

	postId, err := strconv.ParseUint(params["publicacaoId"], 10, 64)
	if err != nil {
		responses.Err(w, http.StatusNoContent, err)
		return
	}
	repository := repository.NewPostsRepository(c.db)
	post, err := repository.FindById(postId)
	if err != nil {
		responderErroDeBusca(w, err)
		return
	}

	responses.JSON(w, http.StatusOK, post)
}

func (c *Controllers) BuscarPublicacoes(w http.ResponseWriter, r *http.Request) {
	userId, err := auth.GetUserID(r)
	if err != nil {
		responses.Err(w, http.StatusUnauthorized, err)
		return
	}

	repository := repository.NewPostsRepository(c.db)
	posts, err := repository.Index(userId)
	if err != nil {
		responses.Err(w, http.StatusInternalServerError, err)
		return
	}

	responses.JSON(w, http.StatusOK, posts)
}

func (c *Controllers) AtualizarPublicacao(w http.ResponseWriter, r *http.Request) {
	userId, err := auth.GetUserID(r)
	if err != nil {
		responses.Err(w, http.StatusForbidden, err)
		return
	}

	params := mux.Vars(r)
	postId, err := strconv.ParseUint(params["publicacaoId"], 10, 64)
	if err != nil {
		responses.Err(w, http.StatusBadRequest, err)
		return
	}

	repository := repository.NewPostsRepository(c.db)
	savedPost, err := repository.FindById(postId)
	if err != nil {
		responderErroDeBusca(w, err)
		return
	}

	if savedPost.AutorID != userId {
		responses.Err(w, http.StatusForbidden, errors.New("não é possível alterar uma publicação de outro usuário"))
		return
	}

	request, err := io.ReadAll(r.Body)
	if err != nil {
		responses.Err(w, http.StatusBadRequest, err)
		return
	}

	var post models.Publicacao
	if err = json.Unmarshal(request, &post); err != nil {
		responses.Err(w, http.StatusBadRequest, err)
		return
	}

	if err = post.Preparar(); err != nil {
		responses.Err(w, http.StatusUnauthorized, err)
		return
	}

	if err = repository.Update(postId, post); err != nil {
		responses.Err(w, http.StatusInternalServerError, err)
		return
	}

	responses.JSON(w, http.StatusNoContent, nil)
}

func (c *Controllers) DeletarPublicacao(w http.ResponseWriter, r *http.Request) {
	userId, err := auth.GetUserID(r)
	if err != nil {
		responses.Err(w, http.StatusForbidden, err)
		return
	}

	params := mux.Vars(r)
	postId, err := strconv.ParseUint(params["publicacaoId"], 10, 64)
	if err != nil {
		responses.Err(w, http.StatusBadRequest, err)
		return
	}

	repository := repository.NewPostsRepository(c.db)
	savedPost, err := repository.FindById(postId)
	if err != nil {
		responderErroDeBusca(w, err)
		return
	}

	if savedPost.AutorID != userId {
		responses.Err(w, http.StatusForbidden, errors.New("não é possível alterar uma publicação de outro usuário"))
		return
	}

	if err = repository.Destroy(postId); err != nil {
		responses.Err(w, http.StatusInternalServerError, err)
		return
	}

	responses.JSON(w, http.StatusNoContent, nil)
}

func (c *Controllers) BuscarPublicacaoDoUsuario(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)

	postId, err := strconv.ParseUint(params["usuarioId"], 10, 64)
	if err != nil {
		responses.Err(w, http.StatusNoContent, err)
		return
	}
	repository := repository.NewPostsRepository(c.db)
	post, err := repository.FindByUserId(postId)
	if err != nil {
		responses.Err(w, http.StatusNotFound, err)
		return
	}

	responses.JSON(w, http.StatusOK, post)
}

func (c *Controllers) CurtirPublicacao(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)

	userId, err := auth.GetUserID(r)
	if err != nil {
		responses.Err(w, http.StatusUnauthorized, err)
		return
	}

	postId, err := strconv.ParseUint(params["publicacaoId"], 10, 64)
	if err != nil {
		responses.Err(w, http.StatusNoContent, err)
		return
	}

	repository := repository.NewPostsRepository(c.db)

	savedPost, err := repository.FindById(postId)
	if err != nil {
		responses.Err(w, http.StatusNotFound, err)
	}

	if err = repository.LikePost(userId, savedPost.ID); err != nil {
		responses.Err(w, http.StatusInternalServerError, err)
		return
	}

	responses.JSON(w, http.StatusNoContent, nil)
}

func (c *Controllers) DescurtirPublicacao(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)

	userId, err := auth.GetUserID(r)
	if err != nil {
		responses.Err(w, http.StatusUnauthorized, err)
		return
	}

	postId, err := strconv.ParseUint(params["publicacaoId"], 10, 64)
	if err != nil {
		responses.Err(w, http.StatusNoContent, err)
		return
	}

	repository := repository.NewPostsRepository(c.db)

	savedPost, err := repository.FindById(postId)
	if err != nil {
		responses.Err(w, http.StatusNotFound, err)
	}

	if err = repository.UnlikePost(userId, savedPost.ID); err != nil {
		responses.Err(w, http.StatusInternalServerError, err)
		return
	}

	responses.JSON(w, http.StatusNoContent, nil)
}
