package repository

import (
	"api/src/models"
	"fmt"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const colunasUsuario = "USUARIOS.id, USUARIOS.nome, USUARIOS.nick, USUARIOS.email, USUARIOS.criadoEm"

type usuarios struct {
	db *gorm.DB
}

func NewUsersRepository(db *gorm.DB) *usuarios {
	return &usuarios{db}
}

func (u usuarios) Store(usuario models.Usuario) (uint64, error) {
	if err := u.db.Create(&usuario).Error; err != nil {
		return 0, err
	}

	return usuario.ID, nil
}

func (u usuarios) ShowAll(nomeOuNick string) ([]models.Usuario, error) {
	nomeOuNick = fmt.Sprintf("%%%s%%", nomeOuNick) // %nomeOuNick&%

	var users []models.Usuario

	if err := u.db.
		Select(colunasUsuario).
		Where("USUARIOS.nome LIKE ? OR USUARIOS.nick LIKE ?", nomeOuNick, nomeOuNick).
		Find(&users).Error; err != nil {
		return nil, err
	}

	return users, nil
}

func (u usuarios) Show(ID uint64) (models.Usuario, error) {
	var usuario models.Usuario

	if err := u.db.
		Select(colunasUsuario).
		Where("USUARIOS.id = ?", ID).
		Take(&usuario).Error; err != nil {
		return models.Usuario{}, err // gorm.ErrRecordNotFound se não existir
	}

	return usuario, nil
}

func (u usuarios) Update(ID uint64, usuario models.Usuario) error {
	return u.db.
		Model(&models.Usuario{}).
		Where("id = ?", ID).
		Select("nome", "nick", "email").
		Updates(usuario).Error
}

func (u usuarios) Destroy(ID uint64) error {
	return u.db.Delete(&models.Usuario{}, ID).Error
}

func (u usuarios) FindByEmail(email string) (models.Usuario, error) {
	var usuario models.Usuario

	if err := u.db.
		Select("id", "senha").
		Where("email = ?", email).
		Limit(1).
		Find(&usuario).Error; err != nil {
		return models.Usuario{}, err
	}

	return usuario, nil
}

func (u usuarios) Follow(usuarioID, seguidorId uint64) error {
	return u.db.
		Clauses(clause.OnConflict{DoNothing: true}).
		Create(&models.Seguidor{UsuarioID: usuarioID, SeguidorID: seguidorId}).Error
}

func (u usuarios) Unfollow(usuarioID, seguidorId uint64) error {
	return u.db.
		Where("usuario_id = ? AND seguidor_id = ?", usuarioID, seguidorId).
		Delete(&models.Seguidor{}).Error
}

func (u usuarios) GetFollowers(usuarioId uint64) ([]models.Usuario, error) {
	var users []models.Usuario

	if err := u.db.
		Select(colunasUsuario).
		Joins("INNER JOIN SEGUIDORES s ON s.seguidor_id = USUARIOS.id").
		Where("s.usuario_id = ?", usuarioId).
		Find(&users).Error; err != nil {
		return nil, err
	}

	return users, nil
}

func (u usuarios) GetFollowing(usuarioId uint64) ([]models.Usuario, error) {
	var users []models.Usuario

	if err := u.db.
		Select(colunasUsuario).
		Joins("INNER JOIN SEGUIDORES s ON s.seguidor_id = USUARIOS.id").
		Where("s.seguidor_id = ?", usuarioId).
		Find(&users).Error; err != nil {
		return nil, err
	}

	return users, nil
}

func (u usuarios) GetPassword(userId uint64) (string, error) {
	var usuario models.Usuario

	if err := u.db.
		Select("senha").
		Where("id = ?", userId).
		Limit(1).
		Find(&usuario).Error; err != nil {
		return "", err
	}

	return usuario.Senha, nil
}

func (u usuarios) UpdatePassword(userId uint64, novaSenha string) error {
	return u.db.
		Model(&models.Usuario{}).
		Where("id = ?", userId).
		Update("senha", novaSenha).Error
}
