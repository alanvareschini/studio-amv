import { defineConfig } from "vite";
import { resolve } from "node:path";

// Configuração mínima e leve: sem plugins extras, build otimizado por padrão.
// Multi-página: o site de vendas (index) e o painel (dashboard) são separados.
export default defineConfig({
  build: {
    target: "es2021",
    cssMinify: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        dashboard: resolve(__dirname, "dashboard.html"),
      },
    },
  },
});
