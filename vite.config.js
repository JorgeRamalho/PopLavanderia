import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        sobre: resolve(import.meta.dirname, "sobre.html"),
        servicos: resolve(import.meta.dirname, "servicos.html"),
        unidades: resolve(import.meta.dirname, "unidades.html"),
        cadastro: resolve(import.meta.dirname, "cadastro.html"),
        login: resolve(import.meta.dirname, "login.html"),
        recuperar: resolve(import.meta.dirname, "recuperar-senha.html"),
        redefinir: resolve(import.meta.dirname, "redefinir-senha.html"),
        app: resolve(import.meta.dirname, "app.html"),
        conta: resolve(import.meta.dirname, "conta.html"),
      },
    },
  },
});
