import { defineConfig } from 'vite';
import { resolve }      from 'path';

export default defineConfig({
  base: '/be-esp-v4/',

  resolve: {
    alias: {
      '@':          resolve(__dirname, 'src'),
      '@core':      resolve(__dirname, 'src/core'),
      '@views':     resolve(__dirname, 'src/views'),
      '@components':resolve(__dirname, 'src/components'),
      '@data':      resolve(__dirname, 'src/data'),
      '@utils':     resolve(__dirname, 'src/utils'),
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['jspdf', 'xlsx'],
        },
      },
    },
  },

  server: {
    port: 3000,
    open: true,
  },
});
