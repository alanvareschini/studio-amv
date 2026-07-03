import { defineConfig } from "vite";

// Configuração mínima e leve: sem plugins extras, build otimizado por padrão.
export default defineConfig({
  build: {
    target: "es2021",
    cssMinify: true,
  },
});
