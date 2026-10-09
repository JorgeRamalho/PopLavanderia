import { hashSecret } from "./crypto.js";
import { findUserByEmail, listUsers } from "./auth.js";
import { seedMachinesIfNeeded } from "./machines.js";
import { read, write } from "./storage.js";

export const DEMO_ACCOUNT = {
  email: "ana@poplavanderia.com",
  password: "Pop@1234",
};

export async function ensureSeed() {
  seedMachinesIfNeeded();
  if (read("pop.seeded", false) && findUserByEmail(DEMO_ACCOUNT.email)) return;

  if (!findUserByEmail(DEMO_ACCOUNT.email)) {
    const email = DEMO_ACCOUNT.email;
    const demoUser = {
      id: "usr_demo_ana",
      nomeCompleto: "Ana Pop Souza",
      cpf: "39053344705",
      email,
      telefone: "41999990026",
      dataNascimento: "1994-04-12",
      endereco: {
        cep: "80420090",
        logradouro: "Avenida do Batel",
        numero: "1230",
        complemento: "Loja 2",
        bairro: "Batel",
        cidade: "Curitiba",
        estado: "PR",
      },
      passwordHash: await hashSecret(`${email}:${DEMO_ACCOUNT.password}`),
      credits: 80,
      aceitaNovidades: true,
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 18,
    };
    write("pop.users", [...listUsers(), demoUser]);
  }

  write("pop.seeded", true);
}
