import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  // base: './' is the magic fix for the White Screen
  base: './', 
  plugins: [react()], // We removed crx() here to stop the loader error
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        background: 'service-worker.js'
      },
      output: {
        // Prevents the random hashes like -Gv29ID4j
        entryFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
        chunkFileNames: '[name].js',
      }
    }
  }
})