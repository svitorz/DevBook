# DevBook — PROGRESS

> Memória do projeto. Ler ANTES de qualquer coisa ao iniciar sessão ou após compactação.

## Fase atual
**Fase B0 — fundação do front (concluída, aguardando "continuar")**
Branch: `feat/web-vue` (criada de `main@5572166`; a fase A inteira foi mergeada via PR #1 e PR #2).

### Decisões da Fase B (confirmadas pelo usuário em 2026-11-19)
1. **Stack:** Vite + Vue 3 (`<script setup>`) + TypeScript, vue-router, pinia, `fetch` nativo num cliente pequeno (sem axios), CSS próprio simples e Vitest. O dev server roda no host (`npm run dev`), fora do compose.
2. **Token:** fica no `localStorage`. Trade-off aceito: é legível por JS em caso de XSS. Mitigação: Vue escapa HTML por padrão e o projeto não usa `v-html`.
3. **Usuário logado:** o login da API passa a devolver `{"id", "token"}` (mudança aditiva).
4. **Escopo:** MVP completo, cobrindo todos os endpoints, em subfases com parada a cada uma:
   - B0: fundação (scaffold, cliente, sessão, testes, `id` no login)
   - B1: cadastro, login, logout e guarda de rotas
   - B2: feed (criar, editar e excluir post; curtir)
   - B3: perfil e social (posts do usuário, seguir/parar, seguidores/seguindo, busca)
   - B4: minha conta (editar perfil, trocar senha, excluir conta)

### Checklist Fase B
- [x] B0 `id` no login da API (`98b56c1`): teste falhava e agora passa; fumaça 66/0
- [x] B0 scaffold create-vite 9.3.4 isolado em um commit (`8cec2da`)
- [x] B0 cliente HTTP, endpoints, tipos, sessão (pinia + localStorage) e 13 testes Vitest (`ad983d0`)
- [x] B0 prova no navegador: `http://localhost:5173` chamou a API real e recebeu 401 via CORS
- [ ] B0 apagar os arquivos de demonstração do template (aguarda confirmação do usuário)
- [ ] B1 cadastro, login, logout, guarda de rotas
- [ ] B2 feed
- [ ] B3 perfil e social
- [ ] B4 minha conta

### Como rodar o front
`cd web && npm install && npm run dev`. Abrir **http://localhost:5173** (não 127.0.0.1: o CORS compara a origem exata). Testes: `npm test`. Tipos + build: `npm run build`.

### Fase A — correções da API (concluída)

### Decisões da Fase 2 (confirmadas pelo usuário em 2026-11-19)
1. **Contrato:** todos os itens `[contrato]` da fumaça foram aprovados como estão: 409 para duplicado; login devolve `{"token"}`; 400 para validação; curtir 2x é idempotente (204); senha atual errada dá 401; CORS liberado para `http://localhost:5173`.
2. **Testes Go:** integração com `httptest` contra o banco `devbook_test` no MySQL do compose. Os testes pulam quando `TEST_DB_DSN` não está definido.
3. **Schema:** `api/sql/schema.sql` aplicado via `docker-entrypoint-initdb.d`; a app não roda DDL.

### Como rodar os testes
```bash
cd api
docker compose --env-file .env.example up -d db
TEST_DB_DSN='root:devbook_dev@tcp(127.0.0.1:3310)/devbook_test?parseTime=True&loc=Local' go test ./...
```
Sem `TEST_DB_DSN`, só rodam os testes que não usam banco. O helper recusa qualquer banco cujo nome não contenha `test`, porque ele apaga os dados entre um teste e outro.

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
- [x] Um `*gorm.DB` (pool) criado no boot e injetado (`959dc47`): fumaça idêntica ao baseline; conexões MySQL por execução da fumaça 46 → 0

### Fase 2 — correções
Cada item tem um teste que falhava antes da correção e passa depois (`go test ./...` com `TEST_DB_DSN`).
- [x] Infra de testes de integração (`97fa8be`)
- [x] H1 rota registrada uma vez + Logger em todas (`9c3284e`)
- [x] H2 autor vem do token (`0163e5b`)
- [x] N7 busca por id inexistente → 404 (`b4741bc`), pré-requisito do H3
- [x] H3 + N3 ownership sem panic; DELETE sem corpo (`5029705`)
- [x] H4 auto-follow para no 403 (`0ed9e2e`)
- [x] H5 — sem mudança: no GORM o erro já é propagado; o "não encontrado" foi resolvido no N7
- [x] H6 DELETE /usuarios autenticado (`14e6b16` levou só o teste por erro meu de encadeamento de comandos; a correção está em `4266df2`)
- [x] H7 boot falha sem SECRET_KEY (`96076d6`) + JWT v5 isolado (`84022bf`)
- [x] H8 PUT de perfil sem senha (`547ff06`)
- [x] N1 cadastro não expõe hash (`d94cdf6`)
- [x] N2 login sem enumeração de e-mail (`31f558e`)
- [x] N4 JOIN do /seguindo (`ad15b6d`)
- [x] N5 curtir idempotente + 404 (`35fd40b`)
- [x] H9/H10 schema.sql no initdb; app sem DDL; DB_NAME respeitado (`f249204`). Prova feita num MySQL vazio (tmpfs) com `DB_NAME=devbook_alt`
- [x] H11 resto: README com portas, variáveis, testes e endpoints corretos
- [x] H12 `go.mod` tidy (já estava desde o baseline; o JWT v5 tirou o `dgrijalva`); agora há testes em 6 pacotes
- [x] H13 rota `GET /usuarios/{id}` (`9c0f210`)
- [x] H14 `responses` (`214dfd0`) + status por categoria (`76f9967`) + login JSON (`f8aec3f`)
- [x] H15 publicações do usuário como lista (`dc81402`)
- [x] H16 CORS (`26384cd`)
- [x] **Fumaça final: 65 ok / 0 falha** (baseline era 43/23); 0 panic no log; `go test ./...` verde

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

- 2026-11-19 — **Infra (Fase 1)**: compose com `name: devbook`, porque o nome padrão `api` colide com containers `api-*` de outro projeto na máquina. Banco publicado em 3310, já que 3306 e 3307 estão ocupados no host. Dentro da rede a API usa `db:3306` fixo. A API escuta na mesma `API_PORT` dentro e fora. Healthcheck no MySQL, para a API só subir com o banco pronto (necessário agora que ela conecta no boot). Removi o volume `.:/app`, que esconderia o binário. A falta de `.env` virou aviso em vez de `log.Fatal`. Descartado: manter o `.env` dentro da imagem, porque vaza segredo e não é assim que o compose injeta variáveis.
- 2026-11-19 — **Pool por injeção, não global**. Os handlers viraram métodos de `controllers.Controllers{db}`, e as rotas viraram funções `rotasX(c)`. Alternativa descartada: `var DB *gorm.DB` global no pacote `database`. Seria um diff menor (só troca o `Conectar()` por `database.DB`), mas cria estado global: os testes não conseguem trocar o banco sem mutar um global compartilhado, o que impede `t.Parallel()`, e a dependência fica escondida. Custo da escolha: assinatura nova em todos os handlers e um diff mecânico maior. Não configurei `SetMaxOpenConns` e afins: os defaults bastam para um projeto de estudo.
- 2026-11-19 — **Efeitos colaterais da refatoração** (inevitáveis, porque o código removido era o próprio bug): (1) em `BuscarUsuarios`, o nil-deref quando `Conectar` falhava (parte do H4) deixou de existir; (2) o vazamento de pool no `CriarPublicacao` (parte do H2) deixou de existir. Nenhum dos dois era observável pela fumaça. O primeiro só acontecia com o banco fora do ar; a prova do segundo é a contagem de conexões acima. Agora uma falha de banco no boot dá `log.Fatal` com a mensagem, e não durante uma requisição.
- 2026-11-19 — **Fase B0, decisões técnicas**: (1) cliente próprio sobre `fetch` (~60 linhas) em vez de axios: ele cobre JSON, token, `ApiError` e 204 sem dependência; (2) um 401 *com token enviado* encerra a sessão (token expirado), mas um 401 sem token (login errado) não, senão o login com senha errada "deslogaria"; (3) `configurarCliente` injeta o token e o callback no `main.ts`, para o cliente não importar a store (evita dependência circular e facilita teste); (4) Vite com `strictPort: 5173`, porque se a porta estiver ocupada ele pularia para 5174 e o CORS bloquearia em silêncio; (5) sem alias `@/`: imports relativos bastam no tamanho atual.
- 2026-11-19 — **Fase 2, decisões técnicas**: (1) "não encontrado" via `Take` + `gorm.ErrRecordNotFound`, traduzido em `responderErroDeBusca`; (2) 409/404 de escrita via `gorm.Config{TranslateError: true}` (`ErrDuplicatedKey`/`ErrForeignKeyViolated`), em vez de olhar o número do erro MySQL (seria acoplar ao driver); (3) curtir idempotente com `OnConflict{DoNothing}`, o mesmo padrão do Follow; (4) CORS escrito à mão (~20 linhas) em vez de `rs/cors`, sem lib nova; envolve o router inteiro porque o mux dá 405 ao OPTIONS; (5) N1 resolvido limpando `Senha` antes da resposta (DTO ficou em Ideias futuras); (6) H13 removeu a rota singular em vez de manter alias, porque ainda não há cliente.
- 2026-11-19 — **Erro de processo (H6)**: o commit `14e6b16` saiu só com o teste, porque o `&&` checava o `grep` e não o `go test`. Não reescrevi o histórico (pede confirmação); a correção veio em `4266df2`. Desde então os commits só rodam se o `go test` sair com 0.
- 2026-11-19 — Script de fumaça: o esperado de cada item é o contrato-alvo, e cada item isola um bug. Na primeira versão do script, o H2 contaminava os testes de ownership e eu tinha errado a direção do follow. Corrigi antes de registrar o baseline.

## Contrato da API (mudanças)
O contrato final está na tabela de endpoints do README. Mudanças em relação ao `main@fedaf99`:
| Endpoint | Antes | Agora |
|---|---|---|
| `GET /usuario/{id}` | singular | **`GET /usuarios/{id}`**; a rota singular foi removida |
| `POST /login` | token em texto puro | `200 {"id": 1, "token": "..."}`, `application/json` (o `id` foi adicionado na fase B0) |
| `POST /login` com falha | mensagem do bcrypt (vazava se o e-mail existe) | `401 {"erro":"e-mail ou senha inválidos"}` |
| `POST /usuarios` | resposta incluía `senha` (hash) | sem `senha`; duplicado → **409** |
| `PUT /usuarios/{id}` | exigia senha; 200 `null` | sem senha; **204**; nick/e-mail de outro → 409 |
| `DELETE /publicacoes/{id}` | exigia corpo JSON | sem corpo; 204 |
| `GET /publicacoes/usuario/{id}` | um objeto | **array** (mais recentes primeiro) |
| `POST /publicacoes` | `autor_id` do corpo era aceito | ignorado (autor = token); inválido → 400 |
| `POST .../curtir` repetido | 500 | 204 (idempotente) |
| `POST /usuarios/{id}/seguir` a si mesmo | 403, mas gravava | 403 sem efeito; usuário inexistente → 404 |
| `GET /usuarios/{id}/seguindo` | devolvia o próprio usuário | devolve quem ele segue |
| id inexistente (GET/PUT/DELETE/curtir) | 200 zerado / panic / 500 | **404** |
| id não numérico | 204/404 | **400** |
| qualquer 5xx | mensagem crua do MySQL | `{"erro":"erro interno do servidor"}` (detalhe no log) |
| qualquer 204 | escrevia `null` | sem corpo |
| CORS | inexistente | `CORS_ORIGIN` (padrão `http://localhost:5173`), preflight 204 |

## Achados fora de escopo
- **N14** (baixa): a resposta do `POST /publicacoes` mostra `criadaEm: 0001-01-01`. O default fica no banco e não volta para a struct (o mesmo vale para `criadoem` do usuário).
- `atualizar-senha` não valida as regras de força da senha nova (o cadastro valida).
- `io/ioutil` depreciado (cosmético).
- Token é parseado duas vezes por request (middleware + `GetUserID`); `getToken` não checa o esquema `Bearer`.
- Chave JSON inconsistente: `criadoem` (usuário) vs `criadaEm` (publicação).
- README cita GORM "opcional" e `docker-compose` (v1).

## Ideias futuras
- **DTOs de entrada/saída** em vez de reaproveitar `models.Usuario` (o N1 foi resolvido limpando o campo; `json:"-"` com DTO seria seguro por padrão).
- `atualizar-senha` validar a força da senha nova com `validarSenha` (hoje aceita qualquer coisa).
- Login: comparar com um hash fictício quando o e-mail não existe, para o tempo de resposta não denunciar a existência do e-mail (timing).
- `SECRET_KEY` com tamanho mínimo (32 bytes para HS256).
- Configurar o logger do GORM para não imprimir `record not found` como erro (agora o 404 passa por ele).
- Paginação em feed/listas, rate limit no login, refresh token: fora do escopo, como combinado.

## Próximo passo
Usuário escreve "continuar" → **B1**: telas de cadastro e login, logout, guarda de rotas (deslogado → /entrar) e layout com cabeçalho. Antes, confirmar se os arquivos de demonstração do template podem ser apagados.
