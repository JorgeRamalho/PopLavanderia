import "../boot.js";
import { registerUser } from "../lib/auth.js";
import { formatCEP, formatCPF, formatPhone, onlyDigits } from "../lib/format.js";
import { login } from "../lib/session.js";
import { isStrongPassword, isValidCEP, passwordScore } from "../lib/validation.js";
import { toast } from "../ui/toast.js";

const form = document.querySelector("#form-cadastro");
const steps = [...document.querySelectorAll("[data-step]")];
const indicator = document.querySelector("[data-step-label]");
let step = 1;

function showStep(next) {
  step = next;
  steps.forEach((node) => {
    node.hidden = Number(node.dataset.step) !== step;
  });
  if (indicator) indicator.textContent = `Etapa ${step} de 3`;
  document.querySelectorAll("[data-progress] span").forEach((bar, index) => {
    bar.classList.toggle("is-on", index < step);
  });
}

function setError(name, message) {
  const field = form?.querySelector(`[name="${name}"]`);
  const help = form?.querySelector(`[data-error="${name}"]`);
  field?.setAttribute("aria-invalid", message ? "true" : "false");
  if (help) help.textContent = message ?? "";
}

function fillAddress(data) {
  form.logradouro.value = data.logradouro ?? "";
  form.bairro.value = data.bairro ?? "";
  form.cidade.value = data.localidade ?? "Curitiba";
  form.estado.value = data.uf ?? "PR";
}

form?.cpf?.addEventListener("input", () => {
  form.cpf.value = formatCPF(form.cpf.value);
});
form?.telefone?.addEventListener("input", () => {
  form.telefone.value = formatPhone(form.telefone.value);
});
form?.cep?.addEventListener("input", () => {
  form.cep.value = formatCEP(form.cep.value);
});

form?.cep.addEventListener("blur", async () => {
  if (!isValidCEP(form.cep.value)) return;
  try {
    const response = await fetch(`https://viacep.com.br/ws/${onlyDigits(form.cep.value)}/json/`);
    const data = await response.json();
    if (data.erro) {
      setError("cep", "CEP não encontrado. Preencha o endereço.");
      return;
    }
    setError("cep");
    fillAddress(data);
  } catch {
    setError("cep", "Não foi possível consultar o CEP agora.");
  }
});

form?.senha?.addEventListener("input", () => {
  const score = passwordScore(form.senha.value);
  const meter = document.querySelector("[data-password-meter]");
  if (meter) meter.style.setProperty("--score", String(score));
});

document.querySelectorAll("[data-next]").forEach((button) => {
  button.addEventListener("click", () => showStep(Math.min(3, step + 1)));
});
document.querySelectorAll("[data-prev]").forEach((button) => {
  button.addEventListener("click", () => showStep(Math.max(1, step - 1)));
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(form).entries());
  payload.aceitaTermos = form.aceitaTermos.checked;
  payload.aceitaNovidades = form.aceitaNovidades.checked;

  if (!isStrongPassword(payload.senha)) {
    showStep(3);
    setError("senha", "Use 8+ caracteres, com letra, número e símbolo.");
    return;
  }

  const result = await registerUser(payload);
  if (!result.ok) {
    Object.keys(result.errors).forEach((name) => setError(name, result.errors[name]));
    if (result.errors.nomeCompleto || result.errors.cpf || result.errors.email || result.errors.telefone || result.errors.dataNascimento) {
      showStep(1);
    } else if (result.errors.cep || result.errors.logradouro || result.errors.numero) {
      showStep(2);
    } else {
      showStep(3);
    }
    toast("Confira os campos destacados.", "warn");
    return;
  }

  await login(payload.email, payload.senha, true);
  toast("Conta criada. Ganhou 20 créditos de boas-vindas.");
  window.location.href = "/app.html";
});

showStep(1);
