package database

import (
	"api/src/config"
	"fmt"
	"log"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// Conectar abre o pool de conexões e prepara o schema. Deve ser chamada
// UMA vez no boot; o *gorm.DB retornado é seguro para uso concorrente.
func Conectar() (*gorm.DB, error) {
	db, err := Abrir(config.StringConexaoBanco)
	if err != nil {
		return nil, err
	}
	if err := CriarBancoSeNecessario(db); err != nil {
		return nil, err
	}

	if err := CriarTabelas(db); err != nil {
		return nil, err
	}
	return db, nil
}

// Abrir abre o pool para o DSN informado e confere a conexão (usado também pelos testes).
func Abrir(dsn string) (*gorm.DB, error) {
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
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

func CriarBancoSeNecessario(db *gorm.DB) error {
	err := db.Exec("CREATE DATABASE IF NOT EXISTS devbook").Error
	if err != nil {
		return fmt.Errorf("erro ao criar banco: %w", err)
	}

	err = db.Exec("USE devbook").Error
	if err != nil {
		return fmt.Errorf("erro ao usar banco: %w", err)
	}

	return nil
}

func CriarTabelas(db *gorm.DB) error {
	comandos := []string{
		`CREATE TABLE IF NOT EXISTS USUARIOS (
			id INT AUTO_INCREMENT PRIMARY KEY,
			nome VARCHAR(50) NOT NULL,
			nick VARCHAR(50) NOT NULL UNIQUE,
			email VARCHAR(50) NOT NULL UNIQUE,
			senha VARCHAR(255) NOT NULL,
			criadoEm TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		) ENGINE=INNODB;`,

		`CREATE TABLE IF NOT EXISTS SEGUIDORES (
			usuario_id INT NOT NULL,
			seguidor_id INT NOT NULL,
			PRIMARY KEY (usuario_id, seguidor_id),
			FOREIGN KEY (usuario_id) REFERENCES USUARIOS(id) ON DELETE CASCADE,
			FOREIGN KEY (seguidor_id) REFERENCES USUARIOS(id) ON DELETE CASCADE
		) ENGINE=INNODB;`,

		`CREATE TABLE IF NOT EXISTS PUBLICACOES (
			id INT AUTO_INCREMENT PRIMARY KEY,
			titulo VARCHAR(50) NOT NULL,
			conteudo VARCHAR(300) NOT NULL,
			autor_id INT NOT NULL,
			criadaEm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (autor_id) REFERENCES USUARIOS(id) ON DELETE CASCADE
		) ENGINE=INNODB;`,

		`CREATE TABLE IF NOT EXISTS likes (
			user_id INT NOT NULL,
			post_id INT NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (user_id, post_id),
			FOREIGN KEY (user_id) REFERENCES USUARIOS(id) ON DELETE CASCADE,
			FOREIGN KEY (post_id) REFERENCES PUBLICACOES(id) ON DELETE CASCADE
		) ENGINE=INNODB;`,
	}

	for _, comando := range comandos {
		if err := db.Exec(comando).Error; err != nil {
			return fmt.Errorf("erro ao criar tabela: %w", err)
		}
	}

	log.Println("Tabelas criadas ou já existentes.")
	return nil
}
