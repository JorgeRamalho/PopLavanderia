import { findUserByEmail, findUserById, verifyPassword } from "./auth.js";
import { read, remove, write } from "./storage.js";

const SESSION_KEY = "pop.session";
const HOUR = 1000 * 60 * 60;

export function getSession() {
  const session = read(SESSION_KEY, null);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    remove(SESSION_KEY);
    return null;
  }
  return session;
}

export function getCurrentUser() {
  const session = getSession();
  if (!session) return null;
  return findUserById(session.userId);
}

export async function login(email, password, remember) {
  const user = findUserByEmail(email);
  if (!user) return { ok: false, error: "E-mail ou senha incorretos." };
  const valid = await verifyPassword(user, password);
  if (!valid) return { ok: false, error: "E-mail ou senha incorretos." };

  write(SESSION_KEY, {
    userId: user.id,
    remember: Boolean(remember),
    expiresAt: Date.now() + (remember ? HOUR * 24 * 30 : HOUR * 12),
  });
  return { ok: true, user };
}

export function logout() {
  remove(SESSION_KEY);
}

export function requireUser() {
  const user = getCurrentUser();
  if (!user) {
    const next = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
    window.location.href = `/login.html?next=${next}`;
    return null;
  }
  return user;
}
