import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { copyFileSync, mkdirSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isContentScript = process.env.BUILD_TARGET === 'content';

function copyPublicFiles() {
  return {
    name: 'copy-public-files',
    closeBundle() {
      mkdirSync(path.resolve(__dirname, 'dist/icons'), { recursive: true });
      copyFileSync(
        path.resolve(__dirname, 'public/manifest.json'),
        path.resolve(__dirname, 'dist/manifest.json')
      );
      copyFileSync(
        path.resolve(__dirname, 'public/icons/icon16.png'),
        path.resolve(__dirname, 'dist/icons/icon16.png')
      );
      copyFileSync(
        path.resolve(__dirname, 'public/icons/icon48.png'),
        path.resolve(__dirname, 'dist/icons/icon48.png')
      );
      copyFileSync(
        path.resolve(__dirname, 'public/icons/icon128.png'),
        path.resolve(__dirname, 'dist/icons/icon128.png')
      );
    }
  };
}

export default defineConfig({
  plugins: [react(), copyPublicFiles()],
  build: {
    outDir: "dist",
    emptyOutDir: !isContentScript,
    rollupOptions: {
      input: isContentScript 
        ? { content: path.resolve(__dirname, "src/content.tsx") }
        : {
            popup: path.resolve(__dirname, "public/index.html"),
            background: path.resolve(__dirname, "src/background.ts"),
          },
      output: isContentScript
        ? {
            entryFileNames: "[name].js",
            format: 'iife',
            inlineDynamicImports: true,
          }
        : {
            entryFileNames: "[name].js",
            chunkFileNames: "chunks/[name]-[hash].js",
            assetFileNames: "assets/[name]-[hash][extname]",
          },
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
});
