import { STORES } from "../data/stores.js";
import { registerUser } from "../lib/auth.js";
import { formatCEP, formatCPF, formatPhone, onlyDigits } from "../lib/format.js";
import {
  REGISTER_STEPS,
  collectRegistrationPayload,
  validateRegistrationStep,
} from "../lib/register-form.js";
import { login } from "../lib/session.js";
import { isValidCEP, passwordScore } from "../lib/validation.js";
import { toast } from "./toast.js";

const stepTitles = [
  "Dados pessoais",
  "Contato",
  "Endereço e unidade",
  "Senha e termos",
];

export function mountRegistrationForm(root = document) {
  const form = root.querySelector("#form-cadastro");
  if (!form) return;

  const steps = [...form.querySelectorAll("[data-step]")];
  const indicator = form.querySelector("[data-step-label]");
  const progress = form.querySelector("[data-progress]");
  let step = 1;

  const showStep = (next) => {
    step = next;
    steps.forEach((node) => {
      node.hidden = Number(node.dataset.step) !== step;
    });
    if (indicator) {
      indicator.textContent = `Etapa ${step} de ${REGISTER_STEPS} — ${stepTitles[step - 1]}`;
    }
    progress?.querySelectorAll("span").forEach((bar, index) => {
      bar.classList.toggle("is-on", index < step);
    });
    const firstField = steps[step - 1]?.querySelector("input, select, textarea");
    firstField?.focus();
  };

  const setError = (name, message) => {
    const field = form.querySelector(`[name="${name}"]`);
    const help = form.querySelector(`[data-error="${name}"]`);
    field?.setAttribute("aria-invalid", message ? "true" : "false");
    if (help) help.textContent = message ?? "";
  };

  const clearStepErrors = (currentStep) => {
    form
      .querySelector(`[data-step="${currentStep}"]`)
      ?.querySelectorAll("[data-error]")
      .forEach((node) => {
        const name = node.getAttribute("data-error");
        if (name) setError(name, "");
      });
  };

  const validateCurrentStep = () => {
    clearStepErrors(step);
    const payload = collectRegistrationPayload(form);
    const errors = validateRegistrationStep(step, payload);
    Object.entries(errors).forEach(([name, message]) => setError(name, message));
    return Object.keys(errors).length === 0;
  };

  const fillAddress = (data) => {
    form.logradouro.value = data.logradouro ?? "";
    form.bairro.value = data.bairro ?? "";
    form.cidade.value = data.localidade ?? "Curitiba";
    form.estado.value = data.uf ?? "PR";
  };

  const select = form.querySelector("[data-store-select]");
  if (select && select.options.length <= 1) {
    STORES.forEach((store) => {
      const option = document.createElement("option");
      option.value = store.id;
      option.textContent = `${store.name} — ${store.neighborhood}`;
      select.append(option);
    });
  }

  form.cpf?.addEventListener("input", () => {
    form.cpf.value = formatCPF(form.cpf.value);
  });
  form.telefone?.addEventListener("input", () => {
    form.telefone.value = formatPhone(form.telefone.value);
  });
  form.telefoneSecundario?.addEventListener("input", () => {
    form.telefoneSecundario.value = formatPhone(form.telefoneSecundario.value);
  });
  form.contatoEmergenciaTelefone?.addEventListener("input", () => {
    form.contatoEmergenciaTelefone.value = formatPhone(form.contatoEmergenciaTelefone.value);
  });
  form.cep?.addEventListener("input", () => {
    form.cep.value = formatCEP(form.cep.value);
  });

  form.cep?.addEventListener("blur", async () => {
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

  form.senha?.addEventListener("input", () => {
    const score = passwordScore(form.senha.value);
    const meter = form.querySelector("[data-password-meter]");
    if (meter) meter.style.setProperty("--score", String(score));
  });

  form.querySelectorAll("[data-next]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!validateCurrentStep()) {
        toast("Revise os campos desta etapa.", "warn");
        return;
      }
      showStep(Math.min(REGISTER_STEPS, step + 1));
    });
  });
  form.querySelectorAll("[data-prev]").forEach((button) => {
    button.addEventListener("click", () => showStep(Math.max(1, step - 1)));
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!validateCurrentStep()) {
      toast("Revise os campos desta etapa.", "warn");
      return;
    }

    const payload = collectRegistrationPayload(form);
    const result = await registerUser(payload);
    if (!result.ok) {
      Object.keys(result.errors).forEach((name) => setError(name, result.errors[name]));
      const step1 = ["nomeCompleto", "cpf", "dataNascimento", "rg"];
      const step2 = ["email", "confirmarEmail", "telefone", "telefoneSecundario", "contatoEmergenciaTelefone"];
      const step3 = ["cep", "logradouro", "numero", "bairro", "cidade", "estado", "unidadePreferida"];
      const first = Object.keys(result.errors)[0];
      if (step1.includes(first)) showStep(1);
      else if (step2.includes(first)) showStep(2);
      else if (step3.includes(first)) showStep(3);
      else showStep(4);
      toast("Confira os campos destacados.", "warn");
      return;
    }

    await login(payload.email, payload.senha, true);
    toast("Conta criada. Ganhou 20 créditos de boas-vindas.");
    window.location.href = "/app.html";
  });

  showStep(1);
}

export function scrollToRegistrationIfHash() {
  if (window.location.hash !== "#cadastro") return;
  const section = document.getElementById("cadastro");
  section?.scrollIntoView({ behavior: "smooth", block: "start" });
  section?.querySelector("input, select")?.focus({ preventScroll: true });
}
