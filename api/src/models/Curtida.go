package models

type Curtida struct {
	UserID uint64 `gorm:"column:user_id;primaryKey"`
	PostID uint64 `gorm:"column:post_id;primaryKey"`
}

func (Curtida) TableName() string {
	return "likes"
}
