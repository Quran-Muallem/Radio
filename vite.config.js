import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// SINGLEFILE=1 npm run build  -> eine einzige, komplett eigenständige index.html
export default defineConfig({
  plugins: [react(), tailwindcss(), ...(process.env.SINGLEFILE ? [viteSingleFile()] : [])],
  base: './',
});
