# DevBook 📘

API RESTful desenvolvida em **Go (Golang)** com foco em performance, boas práticas e escalabilidade. Inspirado em redes sociais, o DevBook permite que usuários se cadastrem, publiquem conteúdo, sigam outros perfis e curtam publicações.

## ✨ Funcionalidades

- ✅ Autenticação com **JWT**
- ✅ CRUD completo de usuários
- ✅ Sistema de **publicações**
- ✅ Relacionamentos de **seguidores** (follow/unfollow)
- ✅ Sistema de **likes** (curtidas)
- ✅ Arquitetura limpa com **padrão MVC** e camada de **repositórios**
- ✅ **Middlewares** para logging e autenticação
- ✅ Banco de dados relacional (**MySQL**)
- ✅ Integração completa com **Docker**: `docker compose up -d` sobe banco, API e front

---

## 🚀 Tecnologias Utilizadas

- [Go (Golang)](https://golang.org)
- [MySQL](https://www.mysql.com/)
- [Docker](https://www.docker.com/)
- [JWT (JSON Web Token)](https://jwt.io/)
- [Mux Router](https://github.com/gorilla/mux)
- [Vue 3](https://vuejs.org/) + [Vite](https://vite.dev/) + TypeScript (front em `web/`)
- [GORM](https://gorm.io/) (acesso a dados; o schema é SQL puro em `api/sql/schema.sql`)

---

## 📦 Como executar

### Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/)

### Clone e suba tudo

```bash
git clone https://github.com/svitorz/DevBook.git
cd DevBook
docker compose up -d --build
```

Esse comando builda as imagens da API (`api/`) e do front (`web/`) e sobe os três serviços:

| Serviço | Container | Endereço |
|---|---|---|
| Front (Vue, build de produção no nginx) | `devbook-web` | **[http://localhost:8080](http://localhost:8080)** |
| API (Go) | `go-api` | [http://localhost:5000](http://localhost:5000) |
| MySQL 8 | `mysql-db` | `localhost:3310` |

Depois do primeiro build, `docker compose up -d` basta. Use `--build` de novo quando mudar o código. O schema (`api/sql/schema.sql`) é aplicado pelo MySQL só na **primeira** subida, com o volume vazio.

O front no container chama a API por `/api`, e o nginx encaminha para o container da API. Como tudo fica na mesma origem, o CORS não entra em jogo.

### Variáveis (opcional)

Sem `.env`, o compose usa padrões de **desenvolvimento** (os mesmos de `api/.env.example`). Para mudar algum, crie um `.env` na raiz com só as variáveis que quer sobrescrever. **A `SECRET_KEY` padrão é pública: troque antes de qualquer uso real.**

| Variável | Padrão | Uso |
|---|---|---|
| `DB_USER`, `DB_PASS`, `DB_NAME` | `root`, `devbook_dev`, `devbook` | credenciais e nome do banco (`DB_PASS` também é a senha root do MySQL) |
| `DB_PORT` | `3310` | porta do MySQL publicada no host |
| `API_PORT` | `5000` | porta da API |
| `WEB_PORT` | `8080` | porta do front no host |
| `SECRET_KEY` | chave de dev | assinatura do JWT (a API não sobe sem ela) |
| `CORS_ORIGIN` | `http://localhost:5173` | origem liberada no CORS (a do `npm run dev`) |

### Testes da API

```bash
cd api
./scripts/smoke.sh   # fumaça: exercita todos os endpoints contra a API rodando
TEST_DB_DSN='root:devbook_dev@tcp(127.0.0.1:3310)/devbook_test?parseTime=True&loc=Local' go test ./...
```

Sem `TEST_DB_DSN`, os testes de integração são pulados.

### Desenvolvendo o front (hot reload)

Para editar o front com recarga automática, rode o Vite no host. Ele usa a API do compose e pode rodar junto com o container `devbook-web`.

**Pré-requisito:** [Node.js](https://nodejs.org/) 20.19+ ou 22.12+ (exigência do Vite 8).

```bash
cd web
npm install
npm run dev
```

Abra **[http://localhost:5173](http://localhost:5173)**. Use `localhost`, e não `127.0.0.1`: aqui o front chama a API em outra origem (`:5000`), e o CORS libera só a origem exata de `CORS_ORIGIN`. A porta é fixa (`strictPort`). Se a 5173 estiver ocupada, o Vite falha em vez de pular para a 5174, que o CORS bloquearia.

| Variável (`web/.env`) | Uso |
|---|---|
| `VITE_API_URL` | URL da API no `npm run dev` (padrão `http://localhost:5000`; ver `web/.env.example`). No container ela é fixada em `/api` no build. |

```bash
npm test        # testes unitários (Vitest)
npm run build   # checagem de tipos + build de produção em web/dist
```

---|---|
| `VITE_API_URL` | URL da API (padrão `http://localhost:5000`; ver `web/.env.example`) |

Se mudar a porta ou o host do front, ajuste também `CORS_ORIGIN` na API.

```bash
npm test        # testes unitários (Vitest)
npm run build   # checagem de tipos + build de produção em web/dist
```

---

## 🧪 Endpoints

Tudo é JSON. Erros vêm como `{"erro": "..."}`. Status: 400 entrada inválida, 401 token ausente/inválido, 403 sem permissão, 404 não encontrado, 409 nick/e-mail duplicado.

| Método | Rota | Auth | Sucesso |
|---|---|---|---|
| POST | `/usuarios` | — | 201 usuário (sem senha) |
| POST | `/login` | — | 200 `{"id": 1, "token": "..."}` |
| GET | `/usuarios?usuario=<nome ou nick>` | ✔ | 200 lista |
| GET | `/usuarios/{id}` | ✔ | 200 usuário |
| PUT | `/usuarios/{id}` | ✔ (dono) | 204 (`nome`, `nick`, `email`) |
| DELETE | `/usuarios/{id}` | ✔ (dono) | 204 |
| POST | `/usuarios/{id}/seguir` | ✔ | 204 |
| POST | `/usuarios/{id}/parar-de-seguir` | ✔ | 204 |
| GET | `/usuarios/{id}/seguidores` | ✔ | 200 lista |
| GET | `/usuarios/{id}/seguindo` | ✔ | 200 lista |
| POST | `/usuarios/{id}/atualizar-senha` | ✔ (dono) | 204 (`{"atual", "nova"}`; atual errada = 401) |
| POST | `/publicacoes` | ✔ | 201 publicação (autor = usuário do token) |
| GET | `/publicacoes` | ✔ | 200 feed (próprias + de quem segue) |
| GET | `/publicacoes/{id}` | ✔ | 200 publicação |
| GET | `/publicacoes/usuario/{id}` | ✔ | 200 lista de publicações do usuário |
| PUT | `/publicacoes/{id}` | ✔ (autor) | 204 |
| DELETE | `/publicacoes/{id}` | ✔ (autor) | 204 |
| POST | `/publicacoes/{id}/curtir` | ✔ | 204 (idempotente) |
| POST | `/publicacoes/{id}/descurtir` | ✔ | 204 |

---

## 🔐 Autenticação JWT

Ao fazer login, você recebe um token JWT (válido por 6 horas) que deve ser enviado no header:

```http
Authorization: Bearer seu_token_jwt
```

---

## 💡 Contribuindo

Pull requests são bem-vindos! Para mudanças maiores, abra uma issue para discutirmos o que você deseja modificar.

---

## 🧑‍💻 Autor

Desenvolvido por **[Vitor Fábio de Castro Souza](https://www.linkedin.com/in/svitorz)**
📧 [vitor.fabio.castro@gmail.com](mailto:vitor.fabio.castro@gmail.com)
🐙 [github.com/svitorz](https://github.com/svitorz)

---

## 📜 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para mais detalhes.
