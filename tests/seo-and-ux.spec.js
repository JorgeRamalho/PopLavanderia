import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const pages = [
  { path: "/", title: /PopLavanderia/, h1: /Lave e seque/ },
  { path: "/sobre.html", title: /Quem somos/, h1: /lavanderia saiu do porão/i },
  { path: "/servicos.html", title: /Serviços/, h1: /ciclo da máquina/i },
  { path: "/unidades.html", title: /Unidades/, h1: /Oito lojas/ },
  { path: "/login.html", title: /Entrar/, h1: /te ver de novo/i },
];

test.describe("SEO, estrutura e identidade", () => {
  for (const page of pages) {
    test(`${page.path} tem idioma, título, descrição e um h1`, async ({ page: browserPage }) => {
      await browserPage.goto(page.path);
      await expect(browserPage.locator("html")).toHaveAttribute("lang", "pt-BR");
      await expect(browserPage).toHaveTitle(page.title);
      const description = browserPage.locator('meta[name="description"]');
      await expect(description).toHaveAttribute("content", /.{40,}/);
      await expect(browserPage.locator("h1")).toHaveCount(1);
      await expect(browserPage.locator("h1")).toContainText(page.h1);
      await expect(browserPage.locator("header")).toBeVisible();
      await expect(browserPage.locator("nav.site-nav")).toHaveCount(1);
    });
  }

  test("home usa tipografia de marca e imagens com texto alternativo", async ({ page }) => {
    await page.goto("/");
    const font = await page.locator("h1").evaluate((node) => getComputedStyle(node).fontFamily);
    expect(font.toLowerCase()).toContain("syne");
    const images = page.locator("main img");
    const count = await images.count();
    expect(count).toBeGreaterThan(0);
    for (let index = 0; index < count; index += 1) {
      await expect(images.nth(index)).toHaveAttribute("alt", /./);
    }
  });

  test("home exibe a foto principal do hero", async ({ page }) => {
    await page.goto("/");
    const hero = page.locator(".hero-visual img");
    await expect(hero).toBeVisible();
    const width = await hero.evaluate((img) => img.naturalWidth);
    expect(width).toBeGreaterThan(0);
  });
});

test.describe("Usabilidade e fluxos", () => {
  test("login demonstração abre o app com saldo e máquinas", async ({ page }) => {
    await page.goto("/login.html");
    await page.getByRole("button", { name: "Usar conta demonstração" }).click();
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/app\.html/);
    await expect(page.locator("[data-wallet]")).toBeVisible();
    await expect(page.locator(".machine-card").first()).toBeVisible();
  });

  test("cadastro em 4 etapas e créditos de boas-vindas", async ({ page }) => {
    const stamp = Date.now();
    const email = `marina.${stamp}@poplavanderia.com`;
    await page.goto("/#cadastro");
    await page.locator('[name="nomeCompleto"]').fill("Marina Pop Lima");
    await page.locator('[name="cpf"]').fill("111.444.777-35");
    await page.locator('[name="dataNascimento"]').fill("1992-05-20");
    await page.getByRole("button", { name: "Continuar para contato" }).click();
    await page.locator('[name="email"]').fill(email);
    await page.locator('[name="confirmarEmail"]').fill(email);
    await page.locator('[name="telefone"]').fill("(41) 99999-2026");
    await page.getByRole("button", { name: "Continuar para endereço" }).click();
    await page.locator('[name="cep"]').fill("80420-090");
    await page.locator('[name="numero"]').fill("100");
    await page.locator('[name="logradouro"]').fill("Avenida do Batel");
    await page.locator('[name="bairro"]').fill("Batel");
    await page.locator('[name="unidadePreferida"]').selectOption("batel");
    await page.getByRole("button", { name: "Continuar para senha" }).click();
    await page.locator('[name="senha"]').fill("Pop@1234");
    await page.locator('[name="confirmarSenha"]').fill("Pop@1234");
    await page.locator('[name="aceitaTermos"]').check();
    await page.locator('[name="aceitaPoliticaPrivacidade"]').check();
    await page.getByRole("button", { name: "Criar conta e ganhar 20 créditos" }).click();
    await expect(page).toHaveURL(/app\.html/, { timeout: 15000 });
    await expect(page.locator("[data-wallet]")).toHaveText(/20 créditos/);
  });

  test("recuperar senha gera link local", async ({ page }) => {
    await page.goto("/recuperar-senha.html");
    await page.locator('[name="email"]').fill("ana@poplavanderia.com");
    await page.getByRole("button", { name: "Enviar link" }).click();
    await expect(page.getByRole("link", { name: "Redefinir senha agora" })).toBeVisible();
  });

  test("iniciar lavagem debita créditos e mostra o ciclo", async ({ page }) => {
    await page.goto("/login.html");
    await page.getByRole("button", { name: "Usar conta demonstração" }).click();
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.getByRole("button", { name: /Iniciar/ }).first().click();
    await page.getByRole("button", { name: "Confirmar e iniciar" }).click();
    await expect(page.getByRole("button", { name: "Acompanhar ciclo" })).toBeVisible();
  });

  test("recarga PIX aumenta o saldo", async ({ page }) => {
    await page.goto("/login.html");
    await page.getByRole("button", { name: "Usar conta demonstração" }).click();
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.getByRole("button", { name: "Recarga" }).click();
    await page.getByRole("button", { name: "Recarregar" }).first().click();
    await page.getByRole("button", { name: "Pagar com PIX" }).click();
    await expect(page.getByText(/Recarga de/)).toBeVisible();
  });
});

test.describe("Responsividade e acessibilidade", () => {
  test("páginas principais não geram rolagem horizontal", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const item of pages) {
      await page.goto(item.path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 4);
      expect(overflow, `overflow em ${item.path}`).toBeFalsy();
    }
  });

  test("home passa em checagem axe sem violações sérias", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const serious = results.violations.filter((item) => item.impact === "critical" || item.impact === "serious");
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
});
