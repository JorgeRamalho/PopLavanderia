import { uid } from "./format.js";
import { hashSecret } from "./crypto.js";
import { read, write } from "./storage.js";
import { isValidCPF, isValidEmail, isValidPhone, isStrongPassword, isAdult, isValidCEP } from "./validation.js";

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
  const errors = {};

  if (!payload.nomeCompleto || payload.nomeCompleto.trim().split(" ").length < 2) {
    errors.nomeCompleto = "Informe nome e sobrenome.";
  }
  if (!isValidCPF(payload.cpf)) errors.cpf = "CPF inválido.";
  if (!isValidEmail(email)) errors.email = "E-mail inválido.";
  if (!isValidPhone(payload.telefone)) errors.telefone = "Telefone inválido.";
  if (!isAdult(payload.dataNascimento)) errors.dataNascimento = "É preciso ter 16 anos ou mais.";
  if (!isValidCEP(payload.cep)) errors.cep = "CEP inválido.";
  if (!payload.logradouro) errors.logradouro = "Informe o endereço.";
  if (!payload.numero) errors.numero = "Informe o número.";
  if (!payload.bairro) errors.bairro = "Informe o bairro.";
  if (!payload.cidade) errors.cidade = "Informe a cidade.";
  if (!payload.estado) errors.estado = "Informe o estado.";
  if (!isStrongPassword(payload.senha)) {
    errors.senha = "Use 8+ caracteres, com letra, número e símbolo.";
  }
  if (payload.senha !== payload.confirmarSenha) errors.confirmarSenha = "As senhas não coincidem.";
  if (!payload.aceitaTermos) errors.aceitaTermos = "Aceite os termos para criar a conta.";
  if (findUserByEmail(email)) errors.email = "Este e-mail já possui cadastro.";
  if (listUsers().some((user) => user.cpf === String(payload.cpf).replace(/\D/g, ""))) {
    errors.cpf = "Este CPF já possui cadastro.";
  }

  if (Object.keys(errors).length) {
    return { ok: false, errors };
  }

  const user = {
    id: uid("usr"),
    nomeCompleto: payload.nomeCompleto.trim(),
    cpf: String(payload.cpf).replace(/\D/g, ""),
    email,
    telefone: String(payload.telefone).replace(/\D/g, ""),
    dataNascimento: payload.dataNascimento,
    endereco: {
      cep: String(payload.cep).replace(/\D/g, ""),
      logradouro: payload.logradouro.trim(),
      numero: payload.numero.trim(),
      complemento: (payload.complemento ?? "").trim(),
      bairro: payload.bairro.trim(),
      cidade: payload.cidade.trim(),
      estado: payload.estado.trim().toUpperCase(),
    },
    passwordHash: await hashSecret(`${email}:${payload.senha}`),
    credits: 20,
    aceitaNovidades: Boolean(payload.aceitaNovidades),
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
