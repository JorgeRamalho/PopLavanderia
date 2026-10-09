import "../boot.js";
import { DRYER_PROGRAMS, EXTRA_DRY_CREDITS, EXTRA_DRY_MINUTES, PACKAGES, WASHER_PROGRAMS } from "../data/pricing.js";
import { STORES, getStore } from "../data/stores.js";
import { findUserById } from "../lib/auth.js";
import { listLedger, recharge } from "../lib/credits.js";
import { formatBRL, formatClock, formatCredits, onlyDigits } from "../lib/format.js";
import {
  currentPhase,
  machinesByStore,
  startCycle,
  userActiveCycles,
  userHistory,
} from "../lib/machines.js";
import { requireUser } from "../lib/session.js";
import { luhnOk } from "../lib/validation.js";
import { toast } from "../ui/toast.js";

const user = requireUser();

const params = new URLSearchParams(window.location.search);
const hash = window.location.hash.replace("#", "");
const storeSelect = document.querySelector("#loja");
const machineGrid = document.querySelector("[data-machines]");
const walletValue = document.querySelector("[data-wallet]");
const suggest = document.querySelector("[data-suggest]");
const modal = document.querySelector("#modal-ciclo");
const rechargePanel = document.querySelector("section [data-view='recarga']");
const historyPanel = document.querySelector("section [data-view='historico']");
const machinesPanel = document.querySelector("section [data-view='maquinas']");

let filter = "all";
let selectedMachineId = null;
let extraDry = false;
let tick;

function selectedStoreId() {
  return storeSelect?.value || "batel";
}

function programOf(machine) {
  return machine.type === "washer" ? WASHER_PROGRAMS[machine.program] : DRYER_PROGRAMS[machine.program];
}

function refreshUserChip() {
  if (walletValue) walletValue.textContent = formatCredits(user.credits);
  document.querySelectorAll("[data-live-credits]").forEach((node) => {
    node.textContent = formatCredits(user.credits);
  });
}

function suggestionText() {
  const active = userActiveCycles(user.id);
  if (user.credits < 12) {
    return "Seu saldo está baixo. Recarregue para não interromper o ciclo.";
  }
  if (active.length) {
    const next = active.sort((a, b) => a.endsAt - b.endsAt)[0];
    const remain = Math.max(0, Math.ceil((next.endsAt - Date.now()) / 1000));
    const almostDone = remain <= 180;
    if (almostDone && next.type === "washer") {
      return "Sua lavagem está acabando. Deixe uma secadora livre reservada no olhar.";
    }
    return `Você tem ${active.length === 1 ? "um ciclo" : `${active.length} ciclos`} em andamento.`;
  }
  return "Escolha lavar ou secar. A máquina só parte com o valor em créditos.";
}

function renderStores() {
  if (!storeSelect) return;
  storeSelect.innerHTML = STORES.map(
    (store) => `<option value="${store.id}">${store.name} · ${store.neighborhood}</option>`,
  ).join("");
  const wanted = params.get("loja") || "batel";
  storeSelect.value = getStore(wanted) ? wanted : "batel";
}

function renderComfort() {
  const store = getStore(selectedStoreId());
  const box = document.querySelector("[data-comfort]");
  if (!store || !box) return;
  box.innerHTML = `
    <img src="${store.image}" alt="${store.imageAlt}" width="640" height="400">
    <div>
      <p class="eyebrow">Enquanto você espera</p>
      <h2>${store.name}</h2>
      <p>${store.summary}</p>
      <ul class="pill-row">${store.amenities.map((item) => `<li>${item}</li>`).join("")}</ul>
      <p class="muted">${store.address} · ${store.hours} · ${store.phone}</p>
    </div>
  `;
}

function machineCard(machine) {
  const program = programOf(machine);
  const mine = machine.userId === user.id;
  const busy = machine.status === "busy";
  const remain = busy ? Math.max(0, Math.ceil((machine.endsAt - Date.now()) / 1000)) : 0;
  const total = busy ? Math.max(1, Math.ceil((machine.endsAt - machine.startedAt) / 1000)) : program.minutes * 60;
  const ratio = busy ? 1 - remain / total : 0;
  const phase = currentPhase(machine);
  const status = machine.maintenance ? "Manutenção" : busy ? (mine ? "Sua máquina" : "Em uso") : "Livre";

  return `
    <article class="machine-card ${busy ? "is-busy" : ""} ${mine ? "is-mine" : ""} ${machine.maintenance ? "is-down" : ""}" data-machine="${machine.id}" data-type="${machine.type}">
      <header>
        <p class="eyebrow">${machine.type === "washer" ? "Lavar" : "Secar"} · ${program.load ?? `${program.minutes} min`}</p>
        <h3>${machine.label}</h3>
      </header>
      <div class="timer-ring" style="--ratio:${ratio}">
        <strong data-clock>${busy ? formatClock(remain) : `${program.minutes} min`}</strong>
        <span data-phase>${phase}</span>
      </div>
      <p class="machine-meta">
        <span class="status-dot">${status}</span>
        <span>${formatCredits(program.credits)}</span>
      </p>
      <button class="btn ${mine ? "btn-ghost" : "btn-primary"}" type="button" data-start="${machine.id}" ${machine.maintenance || (busy && !mine) ? "disabled" : ""}>
        ${mine ? "Acompanhar ciclo" : busy ? "Ocupada" : machine.maintenance ? "Indisponível" : `Iniciar · ${program.credits}`}
      </button>
    </article>
  `;
}

function renderMachines() {
  const machines = machinesByStore(selectedStoreId()).filter((machine) => {
    if (filter === "wash") return machine.type === "washer";
    if (filter === "dry") return machine.type === "dryer";
    if (filter === "free") return machine.status === "free" && !machine.maintenance;
    return true;
  });
  if (machineGrid) {
    machineGrid.innerHTML = machines.length
      ? machines.map(machineCard).join("")
      : `<p class="empty-state">Nenhuma máquina neste filtro. Tente ver todas ou escolher outra unidade.</p>`;
  }
  if (suggest) suggest.textContent = suggestionText();
  refreshUserChip();
  lastMachineStamp = machinesByStore(selectedStoreId())
    .map((item) => `${item.id}:${item.status}:${item.userId}:${item.maintenance}`)
    .join("|");
}

let lastMachineStamp = "";

function tickMachines() {
  const machines = machinesByStore(selectedStoreId());
  const stamp = machines.map((item) => `${item.id}:${item.status}:${item.userId}:${item.maintenance}`).join("|");
  if (stamp !== lastMachineStamp) {
    lastMachineStamp = stamp;
    renderMachines();
    return;
  }
  machines.forEach((machine) => {
    const card = machineGrid?.querySelector(`[data-machine="${machine.id}"]`);
    if (!card || machine.status !== "busy") return;
    const remain = Math.max(0, Math.ceil((machine.endsAt - Date.now()) / 1000));
    const total = Math.max(1, Math.ceil((machine.endsAt - machine.startedAt) / 1000));
    const ring = card.querySelector(".timer-ring");
    const clock = card.querySelector("[data-clock]");
    const phase = card.querySelector("[data-phase]");
    if (ring) ring.style.setProperty("--ratio", String(1 - remain / total));
    if (clock) clock.textContent = formatClock(remain);
    if (phase) phase.textContent = currentPhase(machine);
  });
  if (suggest) suggest.textContent = suggestionText();
}

function openModal(machineId) {
  const machine = machinesByStore(selectedStoreId()).find((item) => item.id === machineId);
  if (!machine || !modal) return;
  if (machine.status === "busy" && machine.userId === user.id) {
    toast("Esta máquina já está no seu ciclo. Acompanhe o tempo no cartão.");
    return;
  }
  selectedMachineId = machineId;
  extraDry = false;
  const program = programOf(machine);
  modal.hidden = false;
  modal.querySelector("[data-modal-title]").textContent = machine.label;
  modal.querySelector("[data-modal-copy]").innerHTML = `
    <p>Tempo de ${machine.type === "washer" ? "lavação" : "secagem"}: <strong>${program.minutes} min</strong></p>
    <p>Valor: <strong>${formatCredits(program.credits)}</strong> · Saldo atual: ${formatCredits(user.credits)}</p>
  `;
  const extra = modal.querySelector("[data-extra-dry]");
  extra.hidden = machine.type !== "dryer";
  extra.querySelector("input").checked = false;
}

function closeModal() {
  if (modal) modal.hidden = true;
  selectedMachineId = null;
}

function showView(name) {
  machinesPanel.hidden = name !== "maquinas";
  rechargePanel.hidden = name !== "recarga";
  historyPanel.hidden = name !== "historico";
  document.querySelectorAll(".app-tabs a, .app-tabs button").forEach((node) => {
    if (node.dataset.view === name) node.setAttribute("aria-current", "page");
    else node.removeAttribute("aria-current");
  });
}

function renderPackages() {
  const box = document.querySelector("[data-packages]");
  if (!box) return;
  box.innerHTML = PACKAGES.map((pack) => `
    <article class="pack-card ${pack.featured ? "is-featured" : ""}">
      <p class="eyebrow">${pack.featured ? "Mais escolhido" : "Recarga"}</p>
      <h3>${pack.name}</h3>
      <p class="pack-price">${pack.custom ? "Você escolhe" : formatBRL(pack.price)}</p>
      <p>${pack.custom ? pack.hint : `${pack.credits} créditos · ${pack.hint}`}</p>
      ${
        pack.custom
          ? `<label>Valor em reais
              <input type="number" min="10" step="10" value="30" data-custom-amount>
            </label>`
          : ""
      }
      <button class="btn btn-primary" type="button" data-pack="${pack.id}">Recarregar</button>
    </article>
  `).join("");
}

function renderHistory() {
  const cycles = userHistory(user.id);
  const ledger = listLedger(user.id);
  const cycleBox = document.querySelector("[data-cycle-history]");
  const ledgerBox = document.querySelector("[data-ledger]");
  if (cycleBox) {
    cycleBox.innerHTML = cycles.length
      ? cycles
          .map((cycle) => {
            const store = getStore(cycle.storeId);
            return `<li>
              <strong>${cycle.type === "washer" ? "Lavagem" : "Secagem"}</strong>
              <span>${store?.name ?? "Unidade"} · ${cycle.minutes} min · ${formatCredits(Math.abs(cycle.credits))}</span>
              <span>${cycle.status === "running" ? "Em andamento" : "Concluído"}</span>
            </li>`;
          })
          .join("")
      : "<li>Nenhum ciclo ainda. A primeira lavagem começa em um toque.</li>";
  }
  if (ledgerBox) {
    ledgerBox.innerHTML = ledger.length
      ? ledger
          .map(
            (entry) => `<li>
              <strong>${entry.type === "recharge" ? "Recarga" : "Uso"}</strong>
              <span>${entry.note} · ${entry.credits > 0 ? "+" : ""}${entry.credits}</span>
            </li>`,
          )
          .join("")
      : "<li>Sem movimentações de créditos.</li>";
  }
}

function pay(credits, method, note) {
  try {
    const updated = recharge(user.id, credits, method, note);
    user.credits = updated.credits;
    refreshUserChip();
    renderHistory();
    toast(`Recarga de ${formatCredits(credits)} concluída.`);
    showView("maquinas");
    renderMachines();
  } catch (error) {
    toast(error.message, "warn");
  }
}

function openPay(packId) {
  const pack = PACKAGES.find((item) => item.id === packId);
  if (!pack) return;
  let credits = pack.credits;
  if (pack.custom) {
    const input = document.querySelector("[data-custom-amount]");
    credits = Number(input?.value || 0);
  }
  if (credits < 10) {
    toast("A recarga mínima é de 10 créditos.", "warn");
    return;
  }
  const payModal = document.querySelector("#modal-pagamento");
  payModal.hidden = false;
  payModal.dataset.credits = String(credits);
  payModal.querySelector("[data-pay-total]").textContent = `${formatCredits(credits)} · ${formatBRL(credits)}`;
}

storeSelect?.addEventListener("change", () => {
  renderComfort();
  renderMachines();
});

document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    filter = button.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((node) => node.classList.toggle("is-on", node === button));
    renderMachines();
  });
});

machineGrid?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-start]");
  if (!button) return;
  openModal(button.dataset.start);
});

modal?.querySelector("[data-extra-dry] input")?.addEventListener("change", (event) => {
  extraDry = event.target.checked;
  const machine = machinesByStore(selectedStoreId()).find((item) => item.id === selectedMachineId);
  if (!machine) return;
  const program = programOf(machine);
  const minutes = program.minutes + (extraDry ? EXTRA_DRY_MINUTES : 0);
  const credits = program.credits + (extraDry ? EXTRA_DRY_CREDITS : 0);
  modal.querySelector("[data-modal-copy]").innerHTML = `
    <p>Tempo de secagem: <strong>${minutes} min</strong></p>
    <p>Valor: <strong>${formatCredits(credits)}</strong> · Saldo atual: ${formatCredits(user.credits)}</p>
  `;
});

modal?.querySelector("[data-confirm-cycle]")?.addEventListener("click", () => {
  try {
    startCycle({ userId: user.id, machineId: selectedMachineId, extraDry });
    const latest = findUserById(user.id);
    if (latest) user.credits = latest.credits;
    closeModal();
    toast("Ciclo iniciado. Acompanhe o tempo na máquina.");
    renderMachines();
    renderHistory();
  } catch (error) {
    toast(error.message, "warn");
    if (String(error.message).includes("Créditos")) showView("recarga");
  }
});

document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", () => {
    closeModal();
    const payModal = document.querySelector("#modal-pagamento");
    if (payModal) payModal.hidden = true;
  });
});

document.querySelector("[data-packages]")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-pack]");
  if (!button) return;
  openPay(button.dataset.pack);
});

document.querySelector("[data-pay-pix]")?.addEventListener("click", () => {
  const credits = Number(document.querySelector("#modal-pagamento")?.dataset.credits);
  pay(credits, "pix", "Recarga via PIX");
  document.querySelector("#modal-pagamento").hidden = true;
});

document.querySelector("#form-cartao")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const number = onlyDigits(form.numero.value);
  if (!luhnOk(number)) {
    toast("Número de cartão inválido.", "warn");
    return;
  }
  const credits = Number(document.querySelector("#modal-pagamento")?.dataset.credits);
  pay(credits, "cartao", "Recarga no cartão");
  document.querySelector("#modal-pagamento").hidden = true;
  form.reset();
});

document.querySelectorAll(".app-tabs [data-view]").forEach((node) => {
  node.addEventListener("click", (event) => {
    event.preventDefault();
    showView(node.dataset.view);
  });
});

if (user) {
  renderStores();
  renderComfort();
  renderPackages();
  renderHistory();
  refreshUserChip();
  showView(hash === "recarga" || hash === "historico" ? hash : "maquinas");
  renderMachines();
  tick = window.setInterval(tickMachines, 1000);
  window.addEventListener("beforeunload", () => window.clearInterval(tick));
}
