package repository

import (
	"api/src/models"

	"gorm.io/gorm"
)

const colunasPublicacao = "PUBLICACOES.id, PUBLICACOES.titulo, PUBLICACOES.conteudo, PUBLICACOES.autor_id, PUBLICACOES.criadaEm, USUARIOS.nick AS autor_nick"

type publicacoes struct {
	db *gorm.DB
}

func NewPostsRepository(db *gorm.DB) *publicacoes {
	return &publicacoes{db}
}

func (p publicacoes) Store(publicacao models.Publicacao) (uint64, error) {
	if err := p.db.Create(&publicacao).Error; err != nil {
		return 0, err
	}

	return publicacao.ID, nil
}

func (p publicacoes) FindById(publicacaoID uint64) (models.Publicacao, error) {
	var post models.Publicacao

	if err := p.db.
		Select(colunasPublicacao).
		Joins("INNER JOIN USUARIOS ON USUARIOS.id = PUBLICACOES.autor_id").
		Where("PUBLICACOES.id = ?", publicacaoID).
		Take(&post).Error; err != nil {
		return models.Publicacao{}, err // gorm.ErrRecordNotFound se não existir
	}

	var err error
	post.Curtidas, err = p.getLikes(post.ID)
	if err != nil {
		return models.Publicacao{}, err
	}

	return post, nil
}

func (p publicacoes) Index(userId uint64) ([]models.Publicacao, error) {
	var publicacoes []models.Publicacao

	if err := p.db.
		Select("DISTINCT "+colunasPublicacao).
		Joins("INNER JOIN USUARIOS ON USUARIOS.id = PUBLICACOES.autor_id").
		Joins("LEFT JOIN SEGUIDORES s ON PUBLICACOES.autor_id = s.usuario_id").
		Where("USUARIOS.id = ? OR s.seguidor_id = ?", userId, userId).
		Order("PUBLICACOES.id DESC").
		Find(&publicacoes).Error; err != nil {
		return nil, err
	}

	for i := range publicacoes {
		curtidas, err := p.getLikes(publicacoes[i].ID)
		if err != nil {
			return nil, err
		}
		publicacoes[i].Curtidas = curtidas
	}

	return publicacoes, nil
}

func (p publicacoes) Update(publicacaoId uint64, publicacao models.Publicacao) error {
	return p.db.
		Model(&models.Publicacao{}).
		Where("id = ?", publicacaoId).
		Select("titulo", "conteudo").
		Updates(publicacao).Error
}

func (p publicacoes) Destroy(publicacaoId uint64) error {
	return p.db.Delete(&models.Publicacao{}, publicacaoId).Error
}

func (p publicacoes) FindByUserId(userId uint64) (models.Publicacao, error) {
	var post models.Publicacao

	if err := p.db.
		Select(colunasPublicacao).
		Joins("INNER JOIN USUARIOS ON USUARIOS.id = PUBLICACOES.autor_id").
		Where("PUBLICACOES.autor_id = ?", userId).
		Limit(1).
		Find(&post).Error; err != nil {
		return models.Publicacao{}, err
	}

	if post.ID != 0 {
		var err error
		post.Curtidas, err = p.getLikes(post.ID)
		if err != nil {
			return models.Publicacao{}, err
		}
	}

	return post, nil
}

func (p publicacoes) LikePost(userId uint64, postId uint64) error {
	return p.db.Create(&models.Curtida{UserID: userId, PostID: postId}).Error
}

func (p publicacoes) UnlikePost(userId uint64, postId uint64) error {
	return p.db.
		Where("user_id = ? AND post_id = ?", userId, postId).
		Delete(&models.Curtida{}).Error
}

func (p publicacoes) getLikes(postId uint64) (uint64, error) {
	var count int64

	if err := p.db.
		Model(&models.Curtida{}).
		Where("post_id = ?", postId).
		Count(&count).Error; err != nil {
		return 0, err
	}

	return uint64(count), nil
}
