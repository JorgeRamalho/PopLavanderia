import "../boot.js";
import { DEMO_ACCOUNT } from "../lib/seed.js";
import { getCurrentUser, login } from "../lib/session.js";
import { toast } from "../ui/toast.js";

if (getCurrentUser()) {
  window.location.replace("/app.html");
}

const form = document.querySelector("#form-login");
const params = new URLSearchParams(window.location.search);
const next = params.get("next") || "/app.html";

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = form.email.value;
  const password = form.senha.value;
  const remember = form.lembrar.checked;
  const result = await login(email, password, remember);
  const errorBox = document.querySelector("[data-login-error]");
  if (!result.ok) {
    if (errorBox) errorBox.textContent = result.error;
    toast(result.error, "warn");
    return;
  }
  window.location.href = next.startsWith("/") ? next : "/app.html";
});

document.querySelector("[data-demo]")?.addEventListener("click", () => {
  form.email.value = DEMO_ACCOUNT.email;
  form.senha.value = DEMO_ACCOUNT.password;
  toast("Conta demonstração preenchida. É só entrar.");
});
