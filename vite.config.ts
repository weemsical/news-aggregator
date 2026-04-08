import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: ".",
  build: {
    outDir: "dist-ui",
  },
  resolve: {
    alias: {
      "@types": path.resolve(__dirname, "src/types"),
      "@repositories": path.resolve(__dirname, "src/repositories"),
      "@services": path.resolve(__dirname, "src/services"),
    },
  },
  server: {
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
