import { defineConfig } from 'vite';
export default defineConfig({
  base: './',
  build: { target: 'es2022', sourcemap: false },
  server: { host: '127.0.0.1', port: 5186, strictPort: true },
  preview: { host: '127.0.0.1', port: 4186, strictPort: true },
});
