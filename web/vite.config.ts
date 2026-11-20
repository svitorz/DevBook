import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // A API libera CORS para http://localhost:5173 (CORS_ORIGIN); fixar a
  // porta evita o Vite pular para 5174 e o navegador bloquear as chamadas.
  server: { port: 5173, strictPort: true },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/testes/setup.ts'],
  },
})
