import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        vial: resolve(__dirname, 'src/sims/vial.html')
      }
    }
  },
  server: {
    open: '/index.html'
  }
}); 