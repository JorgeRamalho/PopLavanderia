import "../boot.js";
import { STORES } from "../data/stores.js";
import { getCurrentUser } from "../lib/session.js";

const grid = document.querySelector("[data-store-grid]");
if (grid) {
  grid.innerHTML = STORES.map((store) => `
    <article class="store-card">
      <img src="${store.image}" alt="${store.imageAlt}" width="720" height="480" loading="lazy">
      <div class="store-card-body">
        <p class="eyebrow">${store.neighborhood}${store.late ? " · Aberto até tarde" : ""}</p>
        <h2>${store.name}</h2>
        <p>${store.address} · ${store.hours}</p>
        <p>${store.summary}</p>
        <ul class="pill-row">
          ${store.amenities.slice(0, 4).map((item) => `<li>${item}</li>`).join("")}
        </ul>
        <div class="card-actions">
          <a class="btn btn-primary" href="/app.html?loja=${store.id}">${getCurrentUser() ? "Usar esta loja" : "Abrir no app"}</a>
          <a class="btn btn-ghost" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.mapQuery)}" target="_blank" rel="noopener noreferrer">Mapa</a>
        </div>
      </div>
    </article>
  `).join("");
}
