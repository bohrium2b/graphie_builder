import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  // Relative asset URLs so the same build works from a web server, from a
  // sub-path, and from a `file://` or `tauri://` origin (packaged Electron
  // and Tauri builds load index.html straight off disk).
  base: "./",
  plugins: [
    react(),
    svelte(),
  ],
  optimizeDeps: {
    exclude: ["@tauri-apps/api"],
    include: ["mafs", "react", "react-dom", "@use-gesture/react", "use-resize-observer"],
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          ui: ["@emotion/react", "@emotion/styled"],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": "/src",
    },
    dedupe: ["react", "react-dom"],
  },
  ssr: {
    noExternal: ["@emotion/react", "@emotion/styled", "file-saver", "jspdf", "svg2pdf.js", "html2canvas", "mafs"],
  },
  server: {
    port: 1420,
    strictPort: true,
    // The workspace holds very large build trees (Rust target dir, vendored
    // runtime). Watching them exhausts the dev server's heap.
    watch: {
      ignored: [
        "**/src-tauri/target/**",
        "**/graphie-to-png/**",
        "**/graphify-out/**",
        "**/dist/**",
        "**/release/**",
        "**/node_modules/**",
      ],
    },
  },
});
