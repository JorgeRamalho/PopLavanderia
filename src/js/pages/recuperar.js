import "../boot.js";
import { requestPasswordReset } from "../lib/auth.js";
import { toast } from "../ui/toast.js";

const form = document.querySelector("#form-recuperar");
const result = document.querySelector("[data-reset-result]");

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = form.email.value;
  const response = await requestPasswordReset(email);
  const errorBox = document.querySelector("[data-reset-error]");
  if (!response.ok) {
    if (errorBox) errorBox.textContent = response.error;
    toast(response.error, "warn");
    return;
  }
  if (errorBox) errorBox.textContent = "";
  const link = `/redefinir-senha.html?token=${encodeURIComponent(response.token)}`;
  if (result) {
    result.hidden = false;
    result.innerHTML = `
      <p>Enviamos um link para <strong>${response.email}</strong>. Como este é um ambiente local, o acesso aparece abaixo.</p>
      <a class="btn btn-primary" href="${link}">Redefinir senha agora</a>
    `;
  }
  toast("Link de recuperação gerado.");
});
