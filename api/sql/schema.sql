-- Schema do DevBook: fonte ÚNICA de verdade.
--
-- Aplicado automaticamente pelo MySQL do compose (docker-entrypoint-initdb.d)
-- no banco MYSQL_DATABASE, apenas quando o volume está vazio.
-- Também é aplicado pelos testes de integração no banco de teste.
-- Rodando sem docker: mysql -u root -p <DB_NAME> < sql/schema.sql
--
-- Idempotente (IF NOT EXISTS), mas NÃO altera tabelas já existentes:
-- mudança de schema exige migração manual ou recriar o volume.

CREATE TABLE IF NOT EXISTS USUARIOS (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(50) NOT NULL,
  nick VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(50) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL, -- hash bcrypt (60 chars)
  criadoEm TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=INNODB;

CREATE TABLE IF NOT EXISTS SEGUIDORES (
  usuario_id INT NOT NULL,  -- quem é seguido
  seguidor_id INT NOT NULL, -- quem segue
  PRIMARY KEY (usuario_id, seguidor_id),
  FOREIGN KEY (usuario_id) REFERENCES USUARIOS(id) ON DELETE CASCADE,
  FOREIGN KEY (seguidor_id) REFERENCES USUARIOS(id) ON DELETE CASCADE
) ENGINE=INNODB;

CREATE TABLE IF NOT EXISTS PUBLICACOES (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(50) NOT NULL,
  conteudo VARCHAR(300) NOT NULL,
  autor_id INT NOT NULL,
  criadaEm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (autor_id) REFERENCES USUARIOS(id) ON DELETE CASCADE
) ENGINE=INNODB;

CREATE TABLE IF NOT EXISTS likes (
  user_id INT NOT NULL,
  post_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, post_id),
  FOREIGN KEY (user_id) REFERENCES USUARIOS(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES PUBLICACOES(id) ON DELETE CASCADE
) ENGINE=INNODB;
