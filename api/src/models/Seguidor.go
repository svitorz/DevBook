package models

type Seguidor struct {
	UsuarioID  uint64 `gorm:"column:usuario_id;primaryKey"`
	SeguidorID uint64 `gorm:"column:seguidor_id;primaryKey"`
}

func (Seguidor) TableName() string {
	return "SEGUIDORES"
}
