export function onlyDigits(value) {
  return String(value ?? "").replace(/\D/g, "");
}

export function formatCPF(value) {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function formatPhone(value) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
}

export function formatCEP(value) {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.replace(/(\d{5})(\d{0,3})/, "$1-$2").replace(/-$/, "");
}

export function formatBRL(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value) || 0);
}

export function formatCredits(value) {
  const amount = Number(value) || 0;
  return `${amount} ${amount === 1 ? "crédito" : "créditos"}`;
}

export function formatClock(totalSeconds) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = String(Math.floor(safe / 60)).padStart(2, "0");
  const seconds = String(safe % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function firstName(fullName) {
  return String(fullName ?? "").trim().split(" ")[0] || "você";
}

export function uid(prefix = "id") {
  return `${prefix}_${crypto.randomUUID()}`;
}
