import { CREDIT_RATE } from "../data/pricing.js";
import { findUserById, saveUser } from "./auth.js";
import { uid } from "./format.js";
import { getCurrentUser } from "./session.js";
import { read, write } from "./storage.js";

const LEDGER_KEY = "pop.ledger";

export function listLedger(userId) {
  return read(LEDGER_KEY, []).filter((entry) => entry.userId === userId);
}

function pushLedger(entry) {
  write(LEDGER_KEY, [entry, ...read(LEDGER_KEY, [])].slice(0, 400));
}

export function recharge(userId, credits, method, note) {
  const user = findUserById(userId);
  if (!user) throw new Error("Usuário não encontrado.");
  const amount = Math.floor(Number(credits));
  if (!Number.isFinite(amount) || amount < 10) {
    throw new Error("A recarga mínima é de 10 créditos.");
  }

  user.credits += amount;
  saveUser(user);
  pushLedger({
    id: uid("led"),
    userId,
    type: "recharge",
    credits: amount,
    money: amount * CREDIT_RATE,
    method,
    note,
    createdAt: Date.now(),
  });
  return user;
}

export function spend(userId, credits, note, meta = {}) {
  const user = findUserById(userId);
  if (!user) throw new Error("Usuário não encontrado.");
  const amount = Math.floor(Number(credits));
  if (user.credits < amount) {
    throw new Error("Créditos insuficientes. Recarregue para continuar.");
  }
  user.credits -= amount;
  saveUser(user);
  pushLedger({
    id: uid("led"),
    userId,
    type: "spend",
    credits: -amount,
    money: amount * CREDIT_RATE,
    method: "creditos",
    note,
    meta,
    createdAt: Date.now(),
  });
  return user;
}

export function currentBalance() {
  return getCurrentUser()?.credits ?? 0;
}
