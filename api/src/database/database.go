package database

import (
	"api/src/config"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// Conectar abre o pool de conexões no banco configurado (DB_NAME). Deve ser
// chamada UMA vez no boot; o *gorm.DB retornado é seguro para uso concorrente.
// O schema NÃO é criado aqui: ele vem de sql/schema.sql (initdb do compose).
func Conectar() (*gorm.DB, error) {
	return Abrir(config.StringConexaoBanco)
}

// Abrir abre o pool para o DSN informado e confere a conexão (usado também pelos testes).
func Abrir(dsn string) (*gorm.DB, error) {
	// TranslateError: duplicidade vira gorm.ErrDuplicatedKey e FK inválida
	// vira gorm.ErrForeignKeyViolated, sem acoplar os controllers ao driver.
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{TranslateError: true})
	if err != nil {
		return nil, err
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}
	if err = sqlDB.Ping(); err != nil {
		return nil, err
	}
	return db, nil
}
