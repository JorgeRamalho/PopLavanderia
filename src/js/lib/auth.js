import { hashSecret } from "./crypto.js";
import { onlyDigits, uid } from "./format.js";
import { validateRegistration } from "./register-form.js";
import { read, write } from "./storage.js";
import { isStrongPassword } from "./validation.js";

const USERS_KEY = "pop.users";
const RESET_KEY = "pop.resetTokens";

export function listUsers() {
  return read(USERS_KEY, []);
}

function saveUsers(users) {
  write(USERS_KEY, users);
}

export function findUserByEmail(email) {
  const normalized = String(email).trim().toLowerCase();
  return listUsers().find((user) => user.email === normalized) ?? null;
}

export function findUserById(id) {
  return listUsers().find((user) => user.id === id) ?? null;
}

export function saveUser(updated) {
  const users = listUsers().map((user) => (user.id === updated.id ? updated : user));
  saveUsers(users);
  return updated;
}

export async function registerUser(payload) {
  const email = String(payload.email ?? "").trim().toLowerCase();
  const errors = validateRegistration(payload);

  if (findUserByEmail(email)) errors.email = "Este e-mail já possui cadastro.";
  if (listUsers().some((user) => user.cpf === onlyDigits(payload.cpf))) {
    errors.cpf = "Este CPF já possui cadastro.";
  }

  if (Object.keys(errors).length) {
    return { ok: false, errors };
  }

  const user = {
    id: uid("usr"),
    nomeCompleto: payload.nomeCompleto.trim(),
    nomeSocial: (payload.nomeSocial ?? "").trim(),
    cpf: onlyDigits(payload.cpf),
    rg: (payload.rg ?? "").trim(),
    genero: payload.genero ?? "prefiro_nao_informar",
    email,
    telefone: onlyDigits(payload.telefone),
    telefoneSecundario: payload.telefoneSecundario ? onlyDigits(payload.telefoneSecundario) : "",
    contatoEmergencia: {
      nome: (payload.contatoEmergenciaNome ?? "").trim(),
      telefone: payload.contatoEmergenciaTelefone ? onlyDigits(payload.contatoEmergenciaTelefone) : "",
    },
    dataNascimento: payload.dataNascimento,
    endereco: {
      cep: onlyDigits(payload.cep),
      logradouro: payload.logradouro.trim(),
      numero: payload.numero.trim(),
      complemento: (payload.complemento ?? "").trim(),
      bairro: payload.bairro.trim(),
      cidade: payload.cidade.trim(),
      estado: payload.estado.trim().toUpperCase(),
      referencia: (payload.referencia ?? "").trim(),
    },
    unidadePreferida: payload.unidadePreferida,
    comoConheceu: payload.comoConheceu ?? "",
    passwordHash: await hashSecret(`${email}:${payload.senha}`),
    credits: 20,
    aceitaNovidades: Boolean(payload.aceitaNovidades),
    aceitaPoliticaPrivacidade: Boolean(payload.aceitaPoliticaPrivacidade),
    createdAt: Date.now(),
  };

  saveUsers([...listUsers(), user]);
  return { ok: true, user };
}

export async function verifyPassword(user, password) {
  const hash = await hashSecret(`${user.email}:${password}`);
  return hash === user.passwordHash;
}

export async function requestPasswordReset(email) {
  const user = findUserByEmail(email);
  if (!user) return { ok: false, error: "Não encontramos uma conta com este e-mail." };

  const token = uid("rst").replace(/-/g, "").slice(0, 24);
  const tokens = read(RESET_KEY, {});
  tokens[token] = { userId: user.id, expiresAt: Date.now() + 1000 * 60 * 30 };
  write(RESET_KEY, tokens);
  return { ok: true, token, email: user.email };
}

export function getResetToken(token) {
  const tokens = read(RESET_KEY, {});
  const entry = tokens[token];
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) return null;
  return entry;
}

export async function resetPassword(token, password, confirm) {
  const entry = getResetToken(token);
  if (!entry) return { ok: false, error: "Link inválido ou expirado. Peça um novo acesso." };
  if (!isStrongPassword(password)) {
    return { ok: false, error: "Use 8+ caracteres, com letra, número e símbolo." };
  }
  if (password !== confirm) return { ok: false, error: "As senhas não coincidem." };

  const user = findUserById(entry.userId);
  if (!user) return { ok: false, error: "Conta não encontrada." };

  user.passwordHash = await hashSecret(`${user.email}:${password}`);
  saveUser(user);

  const tokens = read(RESET_KEY, {});
  delete tokens[token];
  write(RESET_KEY, tokens);
  return { ok: true };
}
