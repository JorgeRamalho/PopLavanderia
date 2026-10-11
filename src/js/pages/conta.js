import "../boot.js";
import { saveUser } from "../lib/auth.js";
import { STORES } from "../data/stores.js";
import { formatCEP, formatCPF, formatPhone } from "../lib/format.js";
import { requireUser } from "../lib/session.js";
import { toast } from "../ui/toast.js";

const user = requireUser();

const form = document.querySelector("#form-conta");
if (form && user) {
  form.nomeCompleto.value = user.nomeCompleto;
  form.nomeSocial.value = user.nomeSocial ?? "";
  form.cpf.value = formatCPF(user.cpf);
  form.email.value = user.email;
  form.telefone.value = formatPhone(user.telefone);
  form.telefoneSecundario.value = user.telefoneSecundario ? formatPhone(user.telefoneSecundario) : "";
  form.dataNascimento.value = user.dataNascimento;
  const store = STORES.find((item) => item.id === user.unidadePreferida);
  form.unidadePreferida.value = store ? `${store.name} — ${store.neighborhood}` : user.unidadePreferida ?? "";
  form.cep.value = formatCEP(user.endereco.cep);
  form.logradouro.value = user.endereco.logradouro;
  form.numero.value = user.endereco.numero;
  form.complemento.value = user.endereco.complemento;
  form.bairro.value = user.endereco.bairro;
  form.cidade.value = user.endereco.cidade;
  form.estado.value = user.endereco.estado;
  form.referencia.value = user.endereco.referencia ?? "";
  form.aceitaNovidades.checked = user.aceitaNovidades;
}

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  user.nomeCompleto = form.nomeCompleto.value.trim();
  user.nomeSocial = form.nomeSocial.value.trim();
  user.telefone = form.telefone.value.replace(/\D/g, "");
  user.telefoneSecundario = form.telefoneSecundario.value.replace(/\D/g, "");
  user.endereco = {
    cep: form.cep.value.replace(/\D/g, ""),
    logradouro: form.logradouro.value.trim(),
    numero: form.numero.value.trim(),
    complemento: form.complemento.value.trim(),
    bairro: form.bairro.value.trim(),
    cidade: form.cidade.value.trim(),
    estado: form.estado.value.trim().toUpperCase(),
    referencia: form.referencia.value.trim(),
  };
  user.aceitaNovidades = form.aceitaNovidades.checked;
  saveUser(user);
  toast("Dados atualizados.");
});
