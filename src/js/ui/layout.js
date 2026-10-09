import { formatCredits, firstName } from "../lib/format.js";
import { getCurrentUser, logout } from "../lib/session.js";

function pathOf() {
  const path = window.location.pathname.replace(/\\/g, "/");
  if (path.endsWith("/") || path.endsWith("/index.html")) return "/";
  return path.split("/").pop() ?? path;
}

export function hydrateLayout() {
  const user = getCurrentUser();
  const current = pathOf();

  document.querySelectorAll(".site-nav a").forEach((link) => {
    const href = link.getAttribute("href");
    const isCurrent =
      (current === "/" && (href === "/" || href === "/index.html" || href === "index.html")) ||
      href?.endsWith(current);
    if (isCurrent) link.setAttribute("aria-current", "page");
  });

  const slot = document.querySelector(".auth-slot");
  if (slot && user) {
    slot.innerHTML = `
      <a class="wallet-chip" href="/app.html#recarga" aria-label="Saldo de créditos" data-live-credits>
        ${formatCredits(user.credits)}
      </a>
      <a class="user-chip" href="/conta.html">${firstName(user.nomeCompleto)}</a>
      <button class="btn btn-ghost" type="button" data-logout>Sair</button>
    `;
    slot.querySelector("[data-logout]")?.addEventListener("click", () => {
      logout();
      window.location.href = "/";
    });
  }

  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  toggle?.addEventListener("click", () => {
    const open = nav?.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(Boolean(open)));
  });

  const year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());
}
