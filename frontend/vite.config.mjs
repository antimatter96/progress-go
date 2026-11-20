import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

// frontend/ directory (Vite's root is src/, but bindings/ sits next to it)
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
    // Vite 8 defaults to binding `localhost`, which on this machine is IPv6-only
    // ([::1]). The Wails dev proxy dials 127.0.0.1 and would get a 502, so pin
    // the dev server to IPv4.
    host: '127.0.0.1',
    port: 9245,
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
