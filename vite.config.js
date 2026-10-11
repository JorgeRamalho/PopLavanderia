import { defineConfig } from "vite";
import { resolve } from "node:path";
import { pageRoutes } from "./scripts/page-routes.mjs";

const root = import.meta.dirname;

function pageAliasPlugin() {
  const aliases = new Map(
    Object.entries(pageRoutes).map(([url, file]) => [url, `/${file}`]),
  );

  const rewrite = (req, _res, next) => {
    if (!req.url) {
      next();
      return;
    }

    const queryAt = req.url.indexOf("?");
    const pathname = queryAt === -1 ? req.url : req.url.slice(0, queryAt);
    const search = queryAt === -1 ? "" : req.url.slice(queryAt);
    const target = aliases.get(pathname);
    if (target) req.url = `${target}${search}`;
    next();
  };

  return {
    name: "page-aliases",
    configureServer(server) {
      server.middlewares.use(rewrite);
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewrite);
    },
  };
}

const pageInput = Object.fromEntries(
  Object.values(pageRoutes).map((file) => {
    const name = file.split("/").pop().replace(/\.html$/, "");
    return [name, resolve(root, file)];
  }),
);

export default defineConfig({
  plugins: [pageAliasPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, "index.html"),
        ...pageInput,
      },
    },
  },
});
