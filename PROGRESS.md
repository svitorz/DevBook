# DevBook — PROGRESS

> Memória do projeto. Ler ANTES de qualquer coisa ao iniciar sessão ou após compactação.

## Fase atual
**Fase 0 — orientação (concluída, aguardando "continuar")**
Branch: `chore/api-hardening` (criada a partir de `main@fedaf99`).

## Baseline
**GORM** (decisão do usuário, 2026-11-19). O WIP de migração foi comitado como baseline em `a10bf17`.
A análise abaixo é sobre esse código; diferenças do `database/sql` antigo (`fedaf99`) são citadas como "HEAD".

## Checklist
### Fase 0
- [x] Ler `api/` inteiro e README
- [x] Criar branch `chore/api-hardening`
- [x] Criar `PROGRESS.md`
- [x] Verificar hipóteses H1–H16 com arquivo:linha
- [x] `go build ./...` e `go vet ./...` passam (working tree)
- [ ] Subir o stack de verdade → movido para a Fase 1 (Fase 0 não altera nada; `docker compose --env-file .env.example config` foi usado para validar H11)

### Fase 1 — rede de segurança
- [x] Decisão GORM vs database/sql → GORM
- [x] compose + `.env.example` coerentes, stack sobe (`6c3dfce`)
- [x] Script de fumaça cobrindo todos os endpoints + resultado atual registrado
- [ ] Um `*gorm.DB` (pool) criado no boot e injetado

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

## Fumaça (`api/scripts/smoke.sh`)
Como rodar: `cd api && docker compose --env-file .env.example up -d --build && ./scripts/smoke.sh`
(sem `.env`, o compose lê o exemplo; com `cp .env.example .env` basta `docker compose up -d`).
O ESPERADO de cada item é o contrato-alvo da fase 2. Itens `[contrato]` dependem de decisão a confirmar na fase 2
(409 duplicado, login em JSON `{"token"}`, 400 em validação, curtir idempotente 204, senha atual errada 401, CORS).

### Baseline (Fase 1, antes de qualquer correção de lógica): 43 OK / 23 FALHA
| Item que falha | Obtido hoje | Bug |
|---|---|---|
| cadastro não expõe senha | hash bcrypt no corpo | N1 |
| [contrato] e-mail duplicado → 409 | 500 com erro cru do MySQL | H14 |
| login não revela se e-mail existe | mensagens de bcrypt diferentes | N2 |
| [contrato] login responde JSON | texto puro | H14 |
| [contrato] `GET /usuarios/{id}` | 405 | H13 |
| usuário inexistente → 404 (2 itens) | 200 com objeto zerado | N7 |
| atualizar perfil sem senha → 204 | 400 "senha ≥ 8" | H8 |
| A não vira seguidor de si mesmo | 403, mas o follow é gravado | H4 |
| `/seguindo` (2 itens) | devolve o próprio A repetido | N4 |
| autor = usuário do token | `autor_id` do corpo vence | H2 |
| [contrato] publicação inválida → 400 | 500 | H14 |
| publicação inexistente → 404 (2 itens) | 200 com objeto zerado | N7 |
| `/publicacoes/usuario/{id}` é lista | um objeto só | H15 |
| editar/deletar post de outro → 403 (2 itens) | **000 (panic)** | H3 |
| editar post inexistente → 404 | **000 (panic)** | H3/N7 |
| [contrato] curtir 2x → 204 | 500 PK duplicada | N5 |
| curtir post inexistente → 404 | 500 FK | N5 |
| deletar próprio post sem corpo → 204 | 400 "unexpected end of JSON input" | N3 |
| [contrato] preflight CORS | sem header | H16 |

Não cobertos pela fumaça (provar com teste Go na fase 2): H1 (registro duplicado de rota), H7 (SECRET_KEY vazia), H9/H10/H11 (infra).

## Log de decisões
- 2026-11-19 — Branch `chore/api-hardening` criada de `main` sem mexer no WIP não comitado (switch carrega as mudanças; nada foi descartado).
- 2026-11-19 — Não subi o docker na Fase 0 (criaria containers/volume e a Fase 0 é só leitura). H11 validada por leitura + `docker compose config`. A execução real é o 1º passo da Fase 1.

- 2026-11-19 — **Baseline = GORM** (decisão do usuário, contra a minha recomendação de `database/sql`). Motivo registrado: o WIP já compila e está "tidy". Consequências: (1) o "pool no boot" da Fase 1 vira um único `*gorm.DB` criado no `main` e injetado, porque o `*gorm.DB` já encapsula o pool de `*sql.DB`; (2) "não encontrado" precisa ser tratado explicitamente (`First` + `gorm.ErrRecordNotFound` no lugar de `Find+Limit(1)`), o que entra na Fase 2 junto com N7; (3) a regra "não introduza ORM" passa a valer como "não introduza OUTRO ORM nem recursos mágicos do GORM (AutoMigrate, hooks, associations) sem decisão".

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
Usuário escreve "continuar" → Fase 1, passo 1: subir o stack com compose + `.env.example` coerentes.
