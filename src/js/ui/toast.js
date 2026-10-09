let host;

function ensureHost() {
  if (host) return host;
  host = document.createElement("div");
  host.className = "toast-host";
  host.setAttribute("aria-live", "polite");
  document.body.append(host);
  return host;
}

export function toast(message, tone = "info") {
  const node = document.createElement("p");
  node.className = `toast toast-${tone}`;
  node.textContent = message;
  ensureHost().append(node);
  window.setTimeout(() => {
    node.classList.add("is-out");
    window.setTimeout(() => node.remove(), 280);
  }, 3600);
}
