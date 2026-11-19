# DevBook — PROGRESS

> Memória do projeto. Ler ANTES de qualquer coisa ao iniciar sessão ou após compactação.

## Fase atual
**Fase 0 — orientação (concluída, aguardando "continuar")**
Branch: `chore/api-hardening` (criada a partir de `main@fedaf99`).

## ⚠️ Bloqueio / decisão pendente
O working tree tem uma **migração para GORM NÃO comitada** (go.mod, database, models, repository,
controllers + `models/Curtida.go`, `models/Seguidor.go`). Isso contradiz a regra "não introduza ORM".
Precisa de decisão antes da Fase 1:
- (recomendado) preservar o WIP num branch `wip/gorm` e basear o hardening no `database/sql` do HEAD;
- ou adotar o GORM como baseline (comitar o WIP) e seguir com ele.
Até a decisão, o WIP continua não comitado no working tree (nada foi descartado).
A análise abaixo é sobre o **working tree** (o que compila hoje); diferenças relevantes do HEAD são citadas.

## Checklist
### Fase 0
- [x] Ler `api/` inteiro e README
- [x] Criar branch `chore/api-hardening`
- [x] Criar `PROGRESS.md`
- [x] Verificar hipóteses H1–H16 com arquivo:linha
- [x] `go build ./...` e `go vet ./...` passam (working tree)
- [ ] Subir o stack de verdade → movido para a Fase 1 (Fase 0 não altera nada; `docker compose --env-file .env.example config` foi usado para validar H11)

### Fase 1 — rede de segurança
- [ ] Decisão GORM vs database/sql
- [ ] compose + `.env.example` coerentes, stack sobe
- [ ] Script de fumaça cobrindo todos os endpoints + resultado atual registrado
- [ ] Um `*sql.DB` (pool) criado no boot e injetado

### Fase 2 — correções (pendente)

## Hipóteses — status verificado (Fase 0)
| # | Status | Evidência |
|---|---|---|
| H1 | CONFIRMADA | `router/routes/routes.go:23-32` registra 2x; mux usa o 1º match. Logger só nas autenticadas (`:24-26`). |
| H2 | CONFIRMADA | `controllers/publicacoes.go:32` antes de `:34`; tag `autor_id` em `models/Publicacao.go:13`. Sem `Desconectar` (`:44-49`) → vaza um pool por POST. |
| H3 | CONFIRMADA (+) | `publicacoes.go:120,134` sem return; `:138` `err==nil` → panic em `responses.go:22`. Mesmo padrão em Deletar `:177,191,195`. Com GORM, post inexistente não dá erro → cai no 403 → panic. |
| H4 | CONFIRMADA | `usuarios.go:206-208`, `:242-244` sem return (e executa Follow(self,self)); `:59-61` sem return → `Desconectar(nil)` panic. |
| H5 | CONFIRMADA no HEAD / REFUTADA no WT | HEAD `repository/usuarios.go:80` `return {}, nil`. WT (GORM) propaga erro, mas "não encontrado" vira 200 com usuário vazio (ver N7). |
| H6 | CONFIRMADA | `routes/usuarios.go:37`; controller valida em `controllers/usuarios.go:165`. Hoje dá 401, mas sem Logger e frágil. |
| H7 | CONFIRMADA | `config/config.go:38` aceita vazio; `auth/token.go:12` `dgrijalva/jwt-go` (CVE-2020-26160). |
| H8 | CONFIRMADA | `models/Usuarios.go:57` exige 8+ chars sempre → PUT sem senha = 400. Se mandar senha, ela é ignorada (`repository/usuarios.go:62`). |
| H9 | CONFIRMADA (+) | `database/database.go:12-33`: `gorm.Open` (novo pool) por request; DDL a cada request; `log.Fatal` `:26,:30`; `devbook` fixo `:42,:47`. |
| H10 | CONFIRMADA | `sql/script.sql:14` varchar(50); `:25` FK duplicada; `:44-45` `users`/`posts`; não faz DROP de `likes`. |
| H11 | CONFIRMADA (+) | compose `:11` DB_PASSWORD vs `config.go:32` DB_PASS; SECRET_KEY e API_PORT não passados (app cai em 9000, `config.go:27`); `:6` mapeia p/ 5000; Dockerfile `:12` EXPOSE 8080; `config.go:21-23` fatal sem `.env`. |
| H12 | PARCIAL | HEAD: tudo `// indirect`. WT: já "tidy" (requires diretos). Zero testes: confirmado. |
| H13 | CONFIRMADA | `routes/usuarios.go:22` `/usuario/{usuarioId}`. |
| H14 | CONFIRMADA | `controllers/login.go:58` texto puro; 403 p/ JSON inválido `publicacoes.go:35`; 500 p/ validação `:40`; 204 c/ erro `:65`. |
| H15 | CONFIRMADA | `repository/publicacoes.go:86-107` `Limit(1)` → um post. |
| H16 | CONFIRMADA | nenhum header CORS em lugar nenhum. |

## Novos achados (não estavam nas hipóteses)
- **N1** (alta) `POST /usuarios` devolve o **hash da senha** no corpo: `controllers/usuarios.go:52` + `models/Usuarios.go:18`.
- **N2** (alta) Enumeração de usuário no login: e-mail inexistente e senha errada retornam mensagens de bcrypt diferentes (`controllers/login.go:46-47`).
- **N3** (alta) `DELETE /publicacoes/{id}` exige corpo JSON com título/conteúdo válidos (`publicacoes.go:199-214`); sem corpo = 400.
- **N4** (alta) `GET /usuarios/{id}/seguindo` com JOIN errado: `ON s.seguidor_id = USUARIOS.id WHERE s.seguidor_id = ?` devolve o próprio usuário N vezes (`repository/usuarios.go:115-116`; HEAD `:212`).
- **N5** (média) Curtir/Descurtir sem return após erro de FindById (`publicacoes.go:276,313`); curtir post inexistente → FK → 500; curtir 2x → PK duplicada → 500.
- **N6** (média) MySQL não sobe com `.env.example`: `MYSQL_ROOT_PASSWORD` vazio sem `MYSQL_ALLOW_EMPTY_PASSWORD`. `DB_PORT` é usado como porta do host e porta interna ao mesmo tempo.
- **N7** (média) 404 nunca acontece: `Find+Limit(1)` (WT) / `rows.Next()` (HEAD) não sinalizam "não encontrado" → 200 com objeto zerado.
- **N8** (média) Sem `.dockerignore` + `COPY . .` → um `.env` local seria embutido na imagem.
- **N9** (baixa) `USE devbook` num pool vale só para uma conexão; e o DSN já exige `DB_NAME` existente, então o `CREATE DATABASE` é código morto.
- **N10** (baixa) `sql/data.sql:13` usa coluna `seguidor` (inexistente).
- **N11** (baixa) Respostas 204 tentam escrever `null` no corpo; `AtualizarUsuario` responde 200 com `null` (`usuarios.go:154`).
- **N12** (baixa) Erro de token em Atualizar/Deletar publicação retorna 403 em vez de 401 (`publicacoes.go:113,170`).
- **N13** (baixa) `WORKDIR .` no Dockerfile resolve para `/go` (WORKDIR da imagem golang); o volume `.:/app` não serve para nada.

## Log de decisões
- 2026-11-19 — Branch `chore/api-hardening` criada de `main` sem mexer no WIP não comitado (switch carrega as mudanças; nada foi descartado).
- 2026-11-19 — Não subi o docker na Fase 0 (criaria containers/volume e a Fase 0 é só leitura). H11 validada por leitura + `docker compose config`. A execução real é o 1º passo da Fase 1.

## Contrato da API (mudanças)
_Nenhuma ainda._

## Achados fora de escopo
- `io/ioutil` depreciado (cosmético).
- Token é parseado duas vezes por request (middleware + `GetUserID`); `getToken` não checa o esquema `Bearer`.
- Chave JSON inconsistente: `criadoem` (usuário) vs `criadaEm` (publicação).
- README cita GORM "opcional" e `docker-compose` (v1).

## Ideias futuras
_(nada ainda)_

## Próximo passo
Usuário decide GORM vs database/sql e escreve "continuar" → Fase 1.
