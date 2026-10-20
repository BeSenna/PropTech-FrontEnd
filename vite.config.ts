import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Em desenvolvimento, /api é encaminhado para o MS Moradores (porta 3001 por padrão).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const alvo = env.VITE_API_PROXY || 'http://localhost:3001';
  return {
    plugins: [react()],
    server: { port: 5173, proxy: { '/api': { target: alvo, changeOrigin: true } } },
    preview: { port: 5173, proxy: { '/api': { target: alvo, changeOrigin: true } } },
  };
});
