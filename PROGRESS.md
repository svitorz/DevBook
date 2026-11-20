# DevBook — PROGRESS

> Memória do projeto. Ler ANTES de qualquer coisa ao iniciar sessão ou após compactação.

## Fase atual
**Fase C — interface mais bonita e intuitiva. C0 e C1 concluídas; aguardando "continuar" para a C2 (feed)**
Branch: `feat/web-ui` (criada de `main@cba7a89`; a fase B foi mergeada via PR #3).

### Decisões da Fase C (confirmadas pelo usuário em 2026-11-19)
Meta: melhorar visual e usabilidade **só no front**, sem mudar a API. Cada parada traz prints de antes/depois, e a suíte existente continua verde.
1. **Estilo:** limpo e neutro (referência: GitHub/Linear), com uma cor de destaque.
2. **Fonte:** Inter servida pelo próprio app (`@fontsource-variable/inter`), sem CDN. Motivo: o `system-ui` virava fonte monoespaçada no Linux do usuário.
3. **Ícones:** ~10 SVGs próprios num componente `Icone.vue`, sem biblioteca.
4. **Tema:** segue o sistema, com botão para alternar; a escolha fica no `localStorage`.
5. **Limitação aceita:** a publicação só traz `autor_nick`, então o avatar usa iniciais do nick com cor derivada dele. Nome no cartão exigiria mudar a API (fora da meta).
6. **Subfases (parada ao fim de cada uma):**
   - C0: fundação visual (tokens, fonte, ícones, tema claro/escuro, componentes base)
   - C1: navegação (logo, menu do avatar, barra de abas no celular)
   - C2: feed (publicar recolhido, cartão com avatar e tempo relativo, esqueleto, confirmação própria, avisos)
   - C3: perfil, busca e conexões (cabeçalho do perfil, abas, busca ao digitar, Seguir nas listas)
   - C4: entrada e conta (apresentação, mostrar senha, regras visíveis, seções)

### Checklist Fase C
- [x] C0 fonte Inter e tokens de design (`27ad4e3`); contraste ≥ 4.5:1 em todos os pares texto/fundo, nos dois temas (calculado)
- [x] C0 tema claro/escuro com botão no cabeçalho e `Icone.vue` (`bb86e9a`); 7 testes novos falhavam antes
- [x] C0 rótulo "Digite <nick> para confirmar" quebrava em 3 linhas, defeito anterior à fase C (`0454adb`); prova visual
- [x] C0 94 testes Vitest + build passando; imagem web rebuildada com `npm ci` (`:8080` → 200)
- [x] C0 prova no navegador: só o subconjunto latino da Inter é baixado; alternar grava `devbook.tema` e aplica `data-tema`; o F5 mantém a escolha; prints de antes/depois de feed, perfil e conta. Usuário de teste `c0_visual` (id 46) criado no banco de dev, seguindo o `b2_outra`
- [x] C1 avatar com iniciais e cor por nick (`4cb42da`); 7 testes falhavam antes
- [x] C1 cabeçalho com logo e favicon, nav Início/Buscar/Perfil com ícones e `aria-current`, menu da conta (nome, @nick, Minha conta, Sair) e barra de abas no celular (`752726e`); 11 testes falhavam antes
- [x] C1 110 testes Vitest + build passando; imagem web rebuildada (`:8080` → 200, favicon novo servido)
- [x] C1 prova no navegador: menu abre pelo mouse e pelo teclado (Tab → Enter → Tab em "Minha conta" → Esc fecha e devolve o foco ao avatar); clique fora fecha; em 375px a nav fica `fixed` no rodapé (bottom = 812 = altura da tela), sem rolagem horizontal e com `padding-bottom` de 64px no body; Perfil ativo em `/perfil/46/seguindo`; Sair pelo menu limpa o storage, e deslogado o cabeçalho mostra só marca e tema (sem padding); o login carrega o avatar ("VC") sem F5
- [ ] C2 feed
- [ ] C3 perfil, busca e conexões
- [ ] C4 entrada e conta

### Fase B — front Vue (concluída, PR #3)

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
- [x] B0 arquivos de demonstração do template removidos (com confirmação do usuário)
- [x] B1 guarda de rotas + `?redirect=` seguro + sessão expirada vai para /entrar (`1d6f256`)
- [x] B1 tela de login (`b0a8d0d`; erro de tipo no teste corrigido em `1abcf57`)
- [x] B1 tela de cadastro com login automático (`6940be8`)
- [x] B1 layout com cabeçalho e Sair (`97c3edc`)
- [x] B1 39 testes Vitest + build passando
- [x] B1 prova no navegador contra a API real: deslogado em `/` vai para `/entrar?redirect=/`; cadastro com senha fraca mostra o 400 da API; cadastro válido entra direto no feed; F5 mantém a sessão; Sair limpa o storage e vai para `/entrar`; nick duplicado mostra o 409; senha errada mostra o 401; login correto respeita `?redirect=/?de=link`
- [x] Extra pedido pelo usuário antes da B2: compose na raiz builda e sobe db + API + web juntos (`a1d36fc`, `4331dd0`, `ac1dbbf`). Prova: `docker compose build` construiu `devbook-app` e `devbook-web`; `down` (sem `-v`) + `up -d` puro subiu os três; o usuário de teste da B1 (id 31) continuou no banco; `:8080/` → 200, F5 em `/entrar` → index.html, `/api/publicacoes` sem token → 401 da API, bundle sem `localhost:5000`; login no navegador em `:8080` fez `POST /api/login` → 200, e a sessão sobrevive ao F5; fumaça 66/0
- [x] B1 sessão expirada (401 com token): provada no navegador na B2. Com o token adulterado no storage, o F5 no feed recebeu 401, a sessão foi limpa e a tela foi para `/entrar?redirect=/`
- [x] B2 API: campo `curtiu` (decisão do usuário) com `TestB2_CurtiuIndicaSeOUsuarioDoTokenCurtiu` (falhava e agora passa); de quebra, sai o N+1 das curtidas (`791ceeb`); suíte Go ok; fumaça 66/0
- [x] B2 composable `useListaDePublicacoes` (`403f3dc`)
- [x] B2 formulário de publicação para criar e editar (`ddada28`)
- [x] B2 feed: cartão com curtir (toggle), editar e excluir; estados carregando, vazio e erro (`e200eff`)
- [x] B2 62 testes Vitest + build passando; container web rebuildado
- [x] B2 prova no navegador contra a API real: feed mostra o post de quem segue; curtir sobrevive ao F5 (♥ 1, `aria-pressed=true`); publicar coloca o post no topo com nick e data reais e limpa o formulário; só o post próprio tem Editar/Excluir; a edição persiste após o F5; excluir pede confirmação e remove; descurtir volta a ♡ 0 após o F5
- [x] B3 página de perfil com seguir/deixar de seguir (`9777545`; plural corrigido em `46dee93`)
- [x] B3 listas de seguidores e seguindo (`3cc6528`); o teste foi escrito junto com o código e a falha foi provada depois, com `git stash` (2 falhavam sem o código)
- [x] B3 busca `/buscar?q=`, links Buscar/Meu perfil no cabeçalho e @autor como link (`ab90f4f`)
- [x] B3 76 testes Vitest + build passando; container web rebuildado (F5 em `/perfil/40` no nginx → 200)
- [x] B3 prova no navegador contra a API real: a busca "b2_" põe `?q=` na URL e acha `@b2_outra`; o perfil mostra nome, @nick, membro desde, 1 seguidor, 0 seguindo e o post; deixar de seguir → Seguir/0, e seguir → Deixar de seguir/1, ambos persistindo após o F5; a lista de seguidores mostra o b1 com link; o próprio perfil não tem botão Seguir e marca "Meu perfil" como ativo; o @autor do feed leva a `/perfil/40`; `/perfil/999999` mostra "Usuário não encontrado"
- [x] B4 bug latente corrigido antes da tela: senha atual errada (401 com token) deslogaria o usuário; `request()` ganhou `ignorar401DeSessao`, usado só no `atualizar-senha` (`ac222df`). O teste falhava e agora passa
- [x] B4 `/conta`: editar perfil, trocar senha (com confirmação) e excluir conta (digitando o nick) (`bdd51b7`); os 9 testes falhavam antes
- [x] B4 87 testes Vitest + build passando; container web rebuildado (F5 em `/conta` no nginx → 200); fumaça 66/0
- [x] B4 prova no navegador contra a API real, com o usuário descartável `b4_descartavel`: o nome editado persiste após o F5; senha atual errada → "Senha atual incorreta." **com a sessão mantida**; troca correta → "Senha alterada." e campos limpos (pela API, a senha antiga → 401 e a nova → 200); o botão excluir fica travado com o nick parcial e libera com o nick completo; excluir → `/entrar?conta=excluida` com aviso e storage limpo; o login da conta excluída → 401; o usuário 42 sumiu do banco, e `b1_1795119` e `b2_outra` continuam

### Como rodar o front
**Tudo em container:** `docker compose up -d --build` da raiz sobe banco, API e web. Front em **http://localhost:8080** (nginx; `/api` encaminhado para a API, mesma origem).
**Dev com hot reload:** `cd web && npm install && npm run dev`. Abrir **http://localhost:5173** (não 127.0.0.1: o CORS compara a origem exata). Testes: `npm test`. Tipos + build: `npm run build`.

### Fase A — correções da API (concluída)

### Decisões da Fase 2 (confirmadas pelo usuário em 2026-11-19)
1. **Contrato:** todos os itens `[contrato]` da fumaça foram aprovados como estão: 409 para duplicado; login devolve `{"token"}`; 400 para validação; curtir 2x é idempotente (204); senha atual errada dá 401; CORS liberado para `http://localhost:5173`.
2. **Testes Go:** integração com `httptest` contra o banco `devbook_test` no MySQL do compose. Os testes pulam quando `TEST_DB_DSN` não está definido.
3. **Schema:** `api/sql/schema.sql` aplicado via `docker-entrypoint-initdb.d`; a app não roda DDL.

### Como rodar os testes
```bash
docker compose up -d db        # da raiz (o compose saiu de api/ em ac1dbbf)
cd api
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
- 2026-11-19 — **Fase C1, decisões técnicas**: (1) **o Perfil saiu do menu e foi para a nav**, e a nav tem 3 itens (Início, Buscar, Perfil): cabem na barra de abas do celular sem apertar. Minha conta e Sair ficam no menu do avatar, que existe nas duas larguras. Descartado: duplicar os links (nav no desktop + barra diferente no celular), que daria dois lugares para manter; (2) **uma única `<nav>`**, que vira barra de abas só por CSS (`@media max-width: 639px`); (3) **menu como disclosure** (`aria-expanded` + `aria-controls`), não `role=menu`: o papel de menu promete navegação por setas e Home/End, e com Tab + Esc o padrão disclosure é o correto; (4) nome/nick ficam na store da sessão, **fora do localStorage**: são buscados a cada carga e depois de salvar o perfil, e a API segue como fonte da verdade (como na B3). Se a busca falhar, o avatar mostra "?" e o menu continua funcionando; (5) `backdrop-filter` desligado no celular: ele torna o header o containing block de descendentes `position: fixed`, e a barra ficaria presa ao header; (6) o espaço para a barra usa `body:has(.nav-principal)`, então deslogado não sobra padding; (7) testes de cabeçalho que viviam em `BuscaView.test` e `ContaView.test` verificavam o lugar antigo dos links (mudança aprovada no plano da fase C). Foram para `CabecalhoApp.test`, não afrouxados; o `ContaView.test` ganhou "salvar o perfil atualiza o nome no menu".
- 2026-11-19 — **Fase C0, decisões técnicas**: (1) **componentes base mudaram de subfase**: o Avatar entra na C1 (primeiro uso: menu do cabeçalho) e o Campo na C4 (formulários de entrada/conta). Criá-los agora deixaria código sem uso nem teste no contexto real; botões continuam como classes CSS (`.botao`, `.botao-secundario`, `.botao-perigo`, `.botao-texto`, `.botao-icone`), porque um componente wrapper não acrescentaria comportamento; (2) tema em store pinia, como a sessão, e não num ref de módulo, que vazaria estado entre testes; (3) um script inline no `index.html` aplica o tema salvo antes do paint. Trade-off: a chave `devbook.tema` aparece em dois lugares (comentado nos dois). Descartado: aplicar só no `main.ts`, que pisca a cada F5 para quem escolheu o tema oposto ao do sistema; (4) depois de clicar, a escolha manual vale sobre o sistema, e não há opção "voltar a seguir o sistema" (um botão de dois estados é mais claro que um ciclo de três); (5) no tema escuro, o texto dos botões coloridos é escuro (`--texto-sobre-cor`): branco sobre `#818cf8`/`#f87171` ficaria abaixo de 3:1; (6) o lock foi regenerado de novo com o npm da imagem, porque o `npm install` do host removeu o `@emnapi/*`; (7) o `npm audit` acusa 5 moderadas, todas anteriores e só de dev (`@vue/test-utils` → `editorconfig` → `minimatch`); o "fix" é rebaixar o test-utils, por isso não mexi.
- 2026-11-19 — Branch `chore/api-hardening` criada de `main` sem mexer no WIP não comitado (switch carrega as mudanças; nada foi descartado).
- 2026-11-19 — Não subi o docker na Fase 0 (criaria containers/volume e a Fase 0 é só leitura). H11 validada por leitura + `docker compose config`. A execução real é o 1º passo da Fase 1.

- 2026-11-19 — **Baseline = GORM** (decisão do usuário, contra a minha recomendação de `database/sql`). Motivo registrado: o WIP já compila e está "tidy". Consequências: (1) o "pool no boot" da Fase 1 vira um único `*gorm.DB` criado no `main` e injetado, porque o `*gorm.DB` já encapsula o pool de `*sql.DB`; (2) "não encontrado" precisa ser tratado explicitamente (`First` + `gorm.ErrRecordNotFound` no lugar de `Find+Limit(1)`), o que entra na Fase 2 junto com N7; (3) a regra "não introduza ORM" passa a valer como "não introduza OUTRO ORM nem recursos mágicos do GORM (AutoMigrate, hooks, associations) sem decisão".

- 2026-11-19 — **Infra (Fase 1)**: compose com `name: devbook`, porque o nome padrão `api` colide com containers `api-*` de outro projeto na máquina. Banco publicado em 3310, já que 3306 e 3307 estão ocupados no host. Dentro da rede a API usa `db:3306` fixo. A API escuta na mesma `API_PORT` dentro e fora. Healthcheck no MySQL, para a API só subir com o banco pronto (necessário agora que ela conecta no boot). Removi o volume `.:/app`, que esconderia o binário. A falta de `.env` virou aviso em vez de `log.Fatal`. Descartado: manter o `.env` dentro da imagem, porque vaza segredo e não é assim que o compose injeta variáveis.
- 2026-11-19 — **Pool por injeção, não global**. Os handlers viraram métodos de `controllers.Controllers{db}`, e as rotas viraram funções `rotasX(c)`. Alternativa descartada: `var DB *gorm.DB` global no pacote `database`. Seria um diff menor (só troca o `Conectar()` por `database.DB`), mas cria estado global: os testes não conseguem trocar o banco sem mutar um global compartilhado, o que impede `t.Parallel()`, e a dependência fica escondida. Custo da escolha: assinatura nova em todos os handlers e um diff mecânico maior. Não configurei `SetMaxOpenConns` e afins: os defaults bastam para um projeto de estudo.
- 2026-11-19 — **Efeitos colaterais da refatoração** (inevitáveis, porque o código removido era o próprio bug): (1) em `BuscarUsuarios`, o nil-deref quando `Conectar` falhava (parte do H4) deixou de existir; (2) o vazamento de pool no `CriarPublicacao` (parte do H2) deixou de existir. Nenhum dos dois era observável pela fumaça. O primeiro só acontecia com o banco fora do ar; a prova do segundo é a contagem de conexões acima. Agora uma falha de banco no boot dá `log.Fatal` com a mensagem, e não durante uma requisição.
- 2026-11-19 — **Fase B0, decisões técnicas**: (1) cliente próprio sobre `fetch` (~60 linhas) em vez de axios: ele cobre JSON, token, `ApiError` e 204 sem dependência; (2) um 401 *com token enviado* encerra a sessão (token expirado), mas um 401 sem token (login errado) não, senão o login com senha errada "deslogaria"; (3) `configurarCliente` injeta o token e o callback no `main.ts`, para o cliente não importar a store (evita dependência circular e facilita teste); (4) Vite com `strictPort: 5173`, porque se a porta estiver ocupada ele pularia para 5174 e o CORS bloquearia em silêncio; (5) sem alias `@/`: imports relativos bastam no tamanho atual.
- 2026-11-19 — **Fase B1, decisões técnicas**: (1) guarda única por `meta.soVisitante`: o padrão é exigir sessão, então rota nova nasce protegida (o erro "esqueci de proteger" vira o erro inofensivo "esqueci de liberar"); (2) `?redirect=` só aceita caminho interno: `//host` e `/\host` seriam open redirect; (3) `aoExpirarSessao` navega por nome para `/entrar`, porque o `push('/')` da B0 era navegação duplicada quando o usuário já estava em `/`: a guarda não rodava e a tela ficava aberta sem sessão; (4) as regras de senha **não** são repetidas no front: a API é a fonte da verdade e a tela mostra a mensagem dela. Descartado: validar em JS também, que daria feedback antes do envio, mas duplicaria a regra em dois lugares; (5) cadastro faz login automático. Se só o login falhar, vai para `/entrar?conta=criada`, porque reenviar daria 409; (6) logout é só local, porque o JWT é stateless e a API não tem revogação. Um token copiado vale até expirar (6h). Ver Ideias futuras; (7) `/entrar` e `/cadastro` são lazy (code splitting por rota, nativo do Vite).
- 2026-11-19 — **Fase B4, decisões técnicas**: (1) o 401 de "senha atual errada" não encerra a sessão. Resolvido no cliente, com uma opção por requisição. Descartado: mudar o status na API para 400/403, que mexeria no contrato aprovado na fase 2; (2) esse 401 vira "Senha atual incorreta." na tela, porque a API manda a mensagem crua do bcrypt; (3) "confirmar nova senha" é a única regra checada só no front: a API nem recebe a confirmação. As regras de força continuam só como dica e `minlength`. A API **não** valida a força da senha nova (achado já registrado); (4) excluir conta exige digitar o nick em vez de um `confirm()`, porque é irreversível e cascateia (FKs `ON DELETE CASCADE` em publicações, seguidores e curtidas); depois `sessao.sair()`, já que o token seguiria válido para um usuário inexistente; (5) três componentes em `components/conta/`, cada um com seu estado de erro/sucesso, testados juntos em `ContaView.test.ts`, num commit só, porque compartilham a rota e o arquivo de teste.
- 2026-11-19 — **Fase B3, decisões técnicas**: (1) "eu sigo este perfil?" sai da lista de **seguidores**, que o perfil já busca para a contagem: o dado é exato e a API não muda. Descartado: um campo novo na API, como foi o `curtiu`, que aqui seria redundante; (2) depois de seguir ou deixar de seguir, a lista de seguidores é buscada de novo, em vez de um ±1 local: contagem e estado vêm da API; (3) rotas com restrição no padrão (`:id(\d+)`, `:tipo(seguidores|seguindo)`): URL inválida cai no redirect em vez de chamar a API com `NaN`; (4) `watch` no id/tipo, porque ir de um perfil a outro reaproveita o componente; (5) a busca roda ao enviar, não a cada tecla (sem debounce e sem uma requisição por letra), e o termo fica em `?q=`, então F5 e link funcionam; termo vazio não chama a API, porque o `LIKE '%%'` listaria todo mundo; (6) o e-mail não é exibido em perfil nem listas, embora a API o devolva (ver achados); (7) `ListaUsuarios` é compartilhada pela busca e pelas conexões.
- 2026-11-19 — **Fase B2, decisões técnicas**: (1) `curtiu` na API (opção escolhida pelo usuário) em vez de localStorage, que mentiria em outro navegador, ou de um "curtir" sem toggle; (2) `curtidas` e `curtiu` viram subconsultas correlacionadas no SELECT. Isso remove o N+1 que existia (um COUNT por post). Descartado: mais uma consulta por post, que dobraria o N+1; (3) o estado da lista fica num **composable**, não numa store pinia: o feed e o perfil (B3) têm listas independentes, e só muda a função que busca; (4) escritas não são otimistas: o estado só muda depois da confirmação da API. É mais simples e não precisa de rollback; o custo é a latência visível, aceitável aqui; (5) criar recarrega o feed em vez de inserir a resposta do POST, que não tem `autor_nick` e tem a data zerada (N14); (6) os componentes recebem as ações como funções async (`aoSalvar`, `aoCurtir`…) em vez de emitir eventos: assim o erro de cada ação aparece perto do botão que a disparou; (7) excluir usa `window.confirm`: é nativo, acessível e sem modal próprio. O link do autor para o perfil fica para a B3.
- 2026-11-19 — **Compose único (pedido do usuário; opções escolhidas por ele)**: (1) `docker-compose.yml` na raiz, com contextos `./api` e `./web`. O `name: devbook` foi mantido, então o volume `devbook_mysql_data` é o mesmo; (2) web = build de produção (node:24-slim → nginx:alpine) em `:8080`, com `/api` encaminhado pelo nginx para `app:API_PORT`. Mesma origem: o container não depende de CORS, a API não mudou e o `npm run dev` na 5173 continua funcionando em paralelo. Descartados: nginx na 5173 (colidiria com o `npm run dev`) e Vite dev no container (não é build; HMR com bind mount é instável); (3) `${VAR:-padrão}` com os valores de dev, para o `up -d` funcionar sem `.env`. Trade-off aceito: a `SECRET_KEY` padrão é pública. Não criei um `.env.example` na raiz (duplicaria o `api/.env.example`); o README lista padrões e variáveis; (4) node **slim**, não alpine: o lock foi gerado em glibc; (5) o lock precisou de `@emnapi/*`, porque o npm 11.19 da imagem recusou o `npm ci` com o lock do npm 11.6 do host. Regenerei só o lock, com `--package-lock-only`, sem mudar versão. Descartado: `npm install` no Dockerfile, que tornaria o build não reprodutível.
- 2026-11-19 — **Erro de processo (compose)**: o `git mv` deixou a renomeação preparada, e ela entrou no commit da imagem web (`4331dd0`) ainda com o conteúdo antigo (`build: .`). Nesse commit isolado, o compose da raiz não builda; o `ac1dbbf` conserta. Não reescrevi o histórico (pede confirmação; os commits são só locais).
- 2026-11-19 — **Erro de processo (B1)**: o `b0a8d0d` foi comitado com o `vue-tsc` falhando, porque o `grep` no fim do encadeamento mascarou o código de saída (mesma classe do erro do H6). A correção veio em `1abcf57`. Desde então o front só é comitado depois de um script que roda testes e build e devolve o código de saída real.
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
| respostas de publicação | só `curtidas` | + `curtiu: bool` (o usuário do token curtiu), na fase B2; aditivo |
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
- Mensagens de validação da API com erros de digitação: `" e-mail inserido é inválido"` (espaço no início) e `"o senha é obrigatório"` (gênero). O front mostra essas mensagens como vêm.
- `GET` autenticado sem header `Authorization` responde 401 `"token is malformed: token contains an invalid number of segments"`; um "token ausente" seria mais claro (visto ao testar o proxy).
- A imagem da API usa `golang:1.24` inteira como runtime (~1 GB); um multi-stage com imagem mínima reduziria muito o tamanho.
- `atualizar-senha` com a senha atual errada devolve no `erro` a mensagem crua do bcrypt (`crypto/bcrypt: hashedPassword is not the hash...`); deveria ser algo como "senha atual incorreta", igual ao login. O front já mascara.
- **Privacidade:** `GET /usuarios?usuario=`, `/usuarios/{id}`, `/seguidores` e `/seguindo` devolvem o **e-mail** de qualquer usuário para qualquer logado. O front não mostra, mas está na resposta. Sugestão: só devolver `email` para o próprio usuário (DTO de saída, já listado em Ideias futuras).
- Busca: `%` e `_` do termo não são escapados no `LIKE`, então viram curingas (`b2_` casa `b2x`). É baixo risco, mas a busca fica imprecisa.
- Testes Go no host: a `TEST_DB_DSN` usa `loc=Local` (-03:00 no host) contra um MySQL em UTC, então os horários lidos nos testes ficam rotulados com o fuso errado (`20:33-03:00` para 17:33 local). O app não é afetado, porque API e banco rodam em UTC no container e a API devolve `...Z`. Correção possível: `loc=UTC` na DSN de teste.
- A introdução do README da raiz ainda descreve o projeto só como "API RESTful".

## Ideias futuras
- **DTOs de entrada/saída** em vez de reaproveitar `models.Usuario` (o N1 foi resolvido limpando o campo; `json:"-"` com DTO seria seguro por padrão).
- `atualizar-senha` validar a força da senha nova com `validarSenha` (hoje aceita qualquer coisa).
- Login: comparar com um hash fictício quando o e-mail não existe, para o tempo de resposta não denunciar a existência do e-mail (timing).
- `SECRET_KEY` com tamanho mínimo (32 bytes para HS256).
- Configurar o logger do GORM para não imprimir `record not found` como erro (agora o 404 passa por ele).
- Logout com revogação (lista de tokens revogados ou expiração curta + refresh), já que hoje o "Sair" só apaga o token local.
- Paginação em feed/listas, rate limit no login, refresh token: fora do escopo, como combinado.

## Próximo passo
C1 concluída. Aguardando "continuar" para a C2 (feed: publicar recolhido, cartão com avatar e tempo relativo, curtir com ícone, esqueleto de carregamento, confirmação própria no lugar do `window.confirm`, avisos curtos).
