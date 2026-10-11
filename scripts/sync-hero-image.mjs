import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "src/assets/hero-principal.png");

if (!existsSync(source)) {
  console.warn("[sync-hero-image] Fonte ausente:", source);
  process.exit(0);
}

const targets = [
  join(root, "public/images/hero-principal.png"),
  join(root, "images/hero-principal.png"),
];

for (const target of targets) {
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(source, target);
}
