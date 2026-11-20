# DevBook — web

Front em Vue 3 + TypeScript (Vite), vue-router e pinia. Consome a API em `../api`.

## Rodar

Tudo pelo compose, da raiz do repositório (detalhes no [README da raiz](../README.md#-como-executar)):

```bash
docker compose up -d --build                         # build de produção: http://localhost:8080
docker compose --profile dev up -d                   # + Vite com hot reload: http://localhost:5173
docker compose run --rm --no-deps web-dev npm test   # testes (Vitest)
```

No container de produção (`Dockerfile`), o build usa `VITE_API_URL=/api` e o nginx encaminha `/api/*` para a API (`nginx/default.conf.template`), na mesma origem e sem CORS. Rotas do vue-router recarregadas com F5 caem no `index.html`.

O `web-dev` roda o Vite num `node:24-slim`, com esta pasta montada no container e o `node_modules` num volume próprio (não usa o `node_modules` do host). Ele chama a API direto em `http://localhost:5000`, por isso a página precisa ser aberta em `localhost:5173`, e não em `127.0.0.1`: o CORS compara a origem exata.

### Sem Docker para o front (Node no host)

Opcional. Precisa de [Node.js](https://nodejs.org/) 20.19+ ou 22.12+ (exigência do Vite 8) e da API do compose rodando. Pare antes o `web-dev` (`docker compose stop web-dev`), porque os dois usam a porta 5173.

```bash
npm install
npm run dev        # http://localhost:5173 (porta fixa: é a origem liberada no CORS da API)
```

A URL da API vem de `VITE_API_URL` (padrão `http://localhost:5000`; ver `.env.example`). Se mudar a porta ou o host do front, ajuste também `CORS_ORIGIN` na API. Se o `npm install` do host mexer no `package-lock.json`, não comite: o lock é gerado com o npm da imagem (`node:24-slim`), e o `npm ci` do build depende disso.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm test` | testes unitários (Vitest + jsdom) |
| `npm run build` | checagem de tipos (`vue-tsc`) + build de produção |

## Estrutura

- `src/api/client.ts`: `fetch` com JSON, token e `ApiError` (`status` + mensagem do `{"erro"}` da API); um 401 com token encerra a sessão, exceto onde o endpoint pede o contrário (`atualizar-senha`)
- `src/api/endpoints.ts`: uma função por endpoint; as views não montam URL
- `src/api/types.ts`: tipos do contrato (`Usuario`, `Publicacao`, `Sessao`)
- `src/stores/`: `sessao` (token + id no `localStorage`; nome/nick buscados da API), `tema` (claro/escuro), `avisos` (mensagens curtas que somem sozinhas)
- `src/router/index.ts`: rotas e guarda (toda rota exige sessão, exceto as `soVisitante`) e `?redirect=` seguro
- `src/composables/`: `useListaDePublicacoes` (feed e perfil) e `useQuemEuSigo` (botões Seguir nas listas)
- `src/utils/`: avatar (iniciais e cor pelo nick), tempo relativo, regras da senha (espelho da API, só para orientar)
- `src/views/`: `Login`, `Cadastro`, `Inicio` (feed), `Perfil` (com as abas de seguidores/seguindo), `Busca`, `Conta`
- `src/components/`: cabeçalho, janela modal (`<dialog>`), cartão e formulário de publicação, campo de formulário, avatar, ícones (SVG próprios), listas de usuários e as seções de `conta/`
- `src/style.css`: tokens de design (cores, espaçamento, cantos, tipografia) e temas claro/escuro; a fonte Inter vem do próprio app (`@fontsource-variable/inter`)

| Rota | Tela |
|---|---|
| `/entrar`, `/cadastro` | login e cadastro (só deslogado) |
| `/` | feed: "Novo post" (modal), editar, excluir, curtir |
| `/perfil/:id` | perfil, seguir/deixar de seguir, aba de publicações |
| `/perfil/:id/seguidores`, `/perfil/:id/seguindo` | abas de conexões do perfil, com Seguir em cada pessoa |
| `/buscar?q=` | busca por nome ou nick enquanto digita |
| `/conta` | editar perfil, trocar senha, excluir conta |
