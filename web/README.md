# DevBook — web

Front em Vue 3 + TypeScript (Vite), vue-router e pinia. Consome a API em `../api`.

## Rodar

```bash
# 1. API (em ../api)
docker compose --env-file .env.example up -d --build

# 2. Front
npm install
npm run dev        # http://localhost:5173 (porta fixa: é a origem liberada no CORS da API)
```

Abra **http://localhost:5173**, e não 127.0.0.1: o CORS compara a origem exata.
A URL da API vem de `VITE_API_URL` (padrão `http://localhost:5000`; ver `.env.example`).

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm test` | testes unitários (Vitest + jsdom) |
| `npm run build` | checagem de tipos (`vue-tsc`) + build de produção |

## Estrutura

- `src/api/client.ts`: `fetch` com JSON, token e `ApiError` (`status` + mensagem do `{"erro"}` da API)
- `src/api/endpoints.ts`: uma função por endpoint; as views não montam URL
- `src/api/types.ts`: tipos do contrato (`Usuario`, `Publicacao`, `Sessao`)
- `src/stores/sessao.ts`: token + id do usuário, persistidos no `localStorage`
