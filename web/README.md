# DevBook — web

Front em Vue 3 + TypeScript (Vite), vue-router e pinia. Consome a API em `../api`.

## Rodar

```bash
# Tudo em container (da raiz do repositório): front em http://localhost:8080
docker compose up -d --build

# Desenvolvimento com hot reload (aqui em web/, com a API do compose rodando)
npm install
npm run dev        # http://localhost:5173 (porta fixa: é a origem liberada no CORS da API)
```

Abra **http://localhost:5173**, e não 127.0.0.1: o CORS compara a origem exata.
A URL da API vem de `VITE_API_URL` (padrão `http://localhost:5000`; ver `.env.example`).

No container (`Dockerfile`), o build usa `VITE_API_URL=/api` e o nginx encaminha `/api/*` para a API (`nginx/default.conf.template`), na mesma origem e sem CORS. Rotas do vue-router recarregadas com F5 caem no `index.html`.

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
- `src/stores/sessao.ts`: token + id do usuário, persistidos no `localStorage`
- `src/router/index.ts`: rotas e guarda (toda rota exige sessão, exceto as `soVisitante`) e `?redirect=` seguro
- `src/composables/useListaDePublicacoes.ts`: estado e ações de uma lista de publicações (feed e perfil)
- `src/views/`: `Login`, `Cadastro`, `Inicio` (feed), `Perfil`, `Conexoes` (seguidores/seguindo), `Busca`, `Conta`
- `src/components/`: cabeçalho, formulário e cartão de publicação, lista de usuários e as seções de `conta/`

| Rota | Tela |
|---|---|
| `/entrar`, `/cadastro` | login e cadastro (só deslogado) |
| `/` | feed: publicar, editar, excluir, curtir |
| `/perfil/:id` | perfil, seguir/deixar de seguir, publicações |
| `/perfil/:id/seguidores`, `/perfil/:id/seguindo` | conexões |
| `/buscar?q=` | busca por nome ou nick |
| `/conta` | editar perfil, trocar senha, excluir conta |
