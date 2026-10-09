import "./header-scroll.js";
import { ensureSeed } from "./lib/seed.js";
import { hydrateLayout } from "./ui/layout.js";

await ensureSeed();
hydrateLayout();
