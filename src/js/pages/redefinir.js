import "../boot.js";
import { getResetToken, resetPassword } from "../lib/auth.js";
import { toast } from "../ui/toast.js";

const token = new URLSearchParams(window.location.search).get("token") ?? "";
const form = document.querySelector("#form-redefinir");
const invalid = document.querySelector("[data-invalid-token]");

if (!getResetToken(token)) {
  form?.setAttribute("hidden", "");
  if (invalid) invalid.hidden = false;
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const response = await resetPassword(token, form.senha.value, form.confirmarSenha.value);
  const errorBox = document.querySelector("[data-reset-error]");
  if (!response.ok) {
    if (errorBox) errorBox.textContent = response.error;
    toast(response.error, "warn");
    return;
  }
  toast("Senha atualizada. Entre com o novo acesso.");
  window.location.href = "/login.html";
});
