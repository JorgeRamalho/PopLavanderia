import fs from "node:fs";
import { pageRoutes } from "./page-routes.mjs";

const files = ["index.html", ...Object.values(pageRoutes)];

const tag = '    <script defer src="/header-scroll.js"></script>\n';
const needle = 'type="image/svg+xml" />\n';

for (const file of files) {
  let source = fs.readFileSync(file, "utf8");
  if (source.includes("header-scroll.js")) {
    console.log("skip", file);
    continue;
  }
  if (!source.includes(needle)) {
    throw new Error(`Favicon anchor not found in ${file}`);
  }
  source = source.replace(needle, needle + tag);
  fs.writeFileSync(file, source);
  console.log("ok", file);
}
