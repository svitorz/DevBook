package repository

import (
	"api/src/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// colunasPublicacao calcula curtidas e "curtiu" na mesma consulta (subconsultas
// correlacionadas), em vez de uma consulta extra por publicação. O único
// parâmetro (?) é o id do usuário que está lendo (o do token).
const colunasPublicacao = "PUBLICACOES.id, PUBLICACOES.titulo, PUBLICACOES.conteudo, PUBLICACOES.autor_id, PUBLICACOES.criadaEm, USUARIOS.nick AS autor_nick, " +
	"(SELECT COUNT(*) FROM likes WHERE likes.post_id = PUBLICACOES.id) AS curtidas, " +
	"EXISTS(SELECT 1 FROM likes WHERE likes.post_id = PUBLICACOES.id AND likes.user_id = ?) AS curtiu"

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

// FindById busca a publicação; leitorID é quem está lendo (define "curtiu").
func (p publicacoes) FindById(publicacaoID, leitorID uint64) (models.Publicacao, error) {
	var post models.Publicacao

	if err := p.db.
		Select(colunasPublicacao, leitorID).
		Joins("INNER JOIN USUARIOS ON USUARIOS.id = PUBLICACOES.autor_id").
		Where("PUBLICACOES.id = ?", publicacaoID).
		Take(&post).Error; err != nil {
		return models.Publicacao{}, err // gorm.ErrRecordNotFound se não existir
	}

	return post, nil
}

func (p publicacoes) Index(userId uint64) ([]models.Publicacao, error) {
	var publicacoes []models.Publicacao

	if err := p.db.
		Select("DISTINCT "+colunasPublicacao, userId).
		Joins("INNER JOIN USUARIOS ON USUARIOS.id = PUBLICACOES.autor_id").
		Joins("LEFT JOIN SEGUIDORES s ON PUBLICACOES.autor_id = s.usuario_id").
		Where("USUARIOS.id = ? OR s.seguidor_id = ?", userId, userId).
		Order("PUBLICACOES.id DESC").
		Find(&publicacoes).Error; err != nil {
		return nil, err
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

// FindByUserId devolve todas as publicações do autor, mais recentes primeiro;
// leitorID é quem está lendo (define "curtiu").
func (p publicacoes) FindByUserId(userId, leitorID uint64) ([]models.Publicacao, error) {
	publicacoes := []models.Publicacao{} // [] e não null quando vazio

	if err := p.db.
		Select(colunasPublicacao, leitorID).
		Joins("INNER JOIN USUARIOS ON USUARIOS.id = PUBLICACOES.autor_id").
		Where("PUBLICACOES.autor_id = ?", userId).
		Order("PUBLICACOES.id DESC").
		Find(&publicacoes).Error; err != nil {
		return nil, err
	}

	return publicacoes, nil
}

func (p publicacoes) LikePost(userId uint64, postId uint64) error {
	// Idempotente: curtir de novo não é erro (mesma ideia do Follow).
	return p.db.
		Clauses(clause.OnConflict{DoNothing: true}).
		Create(&models.Curtida{UserID: userId, PostID: postId}).Error
}

func (p publicacoes) UnlikePost(userId uint64, postId uint64) error {
	return p.db.
		Where("user_id = ? AND post_id = ?", userId, postId).
		Delete(&models.Curtida{}).Error
}
