import { isValidCPF, isValidEmail, isValidPhone, isValidCEP, isAdult, isStrongPassword } from "./validation.js";

export const REGISTER_STEPS = 4;

export function collectRegistrationPayload(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  return {
    ...data,
    aceitaTermos: form.aceitaTermos?.checked ?? false,
    aceitaPoliticaPrivacidade: form.aceitaPoliticaPrivacidade?.checked ?? false,
    aceitaNovidades: form.aceitaNovidades?.checked ?? false,
  };
}

export function validateRegistrationStep(step, payload) {
  const errors = {};

  if (step === 1) {
    if (!payload.nomeCompleto || payload.nomeCompleto.trim().split(/\s+/).length < 2) {
      errors.nomeCompleto = "Informe nome e sobrenome.";
    }
    if (!isValidCPF(payload.cpf)) errors.cpf = "CPF inválido.";
    if (!isAdult(payload.dataNascimento)) {
      errors.dataNascimento = "É preciso ter 16 anos ou mais.";
    }
    if (payload.rg && String(payload.rg).replace(/\D/g, "").length < 5) {
      errors.rg = "RG inválido.";
    }
  }

  if (step === 2) {
    const email = String(payload.email ?? "").trim().toLowerCase();
    const confirm = String(payload.confirmarEmail ?? "").trim().toLowerCase();
    if (!isValidEmail(email)) errors.email = "E-mail inválido.";
    if (email !== confirm) errors.confirmarEmail = "Os e-mails não coincidem.";
    if (!isValidPhone(payload.telefone)) errors.telefone = "Celular inválido.";
    if (payload.telefoneSecundario && !isValidPhone(payload.telefoneSecundario)) {
      errors.telefoneSecundario = "Telefone alternativo inválido.";
    }
    if (payload.contatoEmergenciaNome && !payload.contatoEmergenciaTelefone) {
      errors.contatoEmergenciaTelefone = "Informe o telefone do contato de emergência.";
    }
    if (payload.contatoEmergenciaTelefone && !isValidPhone(payload.contatoEmergenciaTelefone)) {
      errors.contatoEmergenciaTelefone = "Telefone de emergência inválido.";
    }
  }

  if (step === 3) {
    if (!isValidCEP(payload.cep)) errors.cep = "CEP inválido.";
    if (!payload.logradouro?.trim()) errors.logradouro = "Informe o logradouro.";
    if (!payload.numero?.trim()) errors.numero = "Informe o número.";
    if (!payload.bairro?.trim()) errors.bairro = "Informe o bairro.";
    if (!payload.cidade?.trim()) errors.cidade = "Informe a cidade.";
    if (!payload.estado?.trim() || payload.estado.trim().length !== 2) {
      errors.estado = "Use a sigla do estado (ex.: PR).";
    }
    if (!payload.unidadePreferida) errors.unidadePreferida = "Escolha a unidade que você mais usa.";
  }

  if (step === 4) {
    if (!isStrongPassword(payload.senha)) {
      errors.senha = "Use 8+ caracteres, com letra, número e símbolo.";
    }
    if (payload.senha !== payload.confirmarSenha) {
      errors.confirmarSenha = "As senhas não coincidem.";
    }
    if (!payload.aceitaTermos) errors.aceitaTermos = "Aceite os termos de uso.";
    if (!payload.aceitaPoliticaPrivacidade) {
      errors.aceitaPoliticaPrivacidade = "Aceite a política de privacidade (LGPD).";
    }
  }

  return errors;
}

export function validateRegistration(payload) {
  const errors = {};
  for (let step = 1; step <= REGISTER_STEPS; step += 1) {
    Object.assign(errors, validateRegistrationStep(step, payload));
  }
  return errors;
}
