import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

// frontend/ directory (Vite's root is src/, but wailsjs/ sits next to it)
const frontendDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: 'src',
  // dragula -> crossvent -> custom-event references Node's `global`,
  // which Parcel used to shim for us. Map it to the browser equivalent.
  define: {
    global: 'globalThis',
  },
  plugins: [tailwindcss()],
  server: {
    port: 1234,
    strictPort: true,
    fs: {
      allow: [frontendDir],
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    // Match the old Parcel output: no minification, no content hashes,
    // no source maps (wails embeds the whole dist dir, so plain names are fine).
    minify: false,
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name][extname]',
      },
    },
  },
});
