import { test, expect } from "@playwright/test";

// Fluxos críticos do Prosperidade, testados como uma pessoa usaria (celular).
// Conta usada: robô de testes (workspace próprio, isolado dos dados reais).

const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;

test.describe.configure({ mode: "serial" });

async function login(page) {
  await page.goto("/");
  await expect(page.getByPlaceholder("voce@email.com")).toBeVisible();
  await page.getByPlaceholder("voce@email.com").fill(EMAIL);
  await page.getByPlaceholder("Mínimo 6 caracteres").fill(PASSWORD);
  await page.locator("form").getByRole("button", { name: "Entrar" }).click();
  // Logado = navegação de baixo aparece.
  await expect(page.getByRole("button", { name: "Extrato" })).toBeVisible({ timeout: 30_000 });
}

// Lança um gasto manual e garante que a tela de salvar FECHOU (= salvou de verdade).
async function lancarManual(page, valor, marca) {
  await page.getByText("Manual", { exact: true }).click();
  await expect(page.getByText("Novo lançamento")).toBeVisible();
  await page.getByPlaceholder("0,00").fill(valor);
  await page.getByPlaceholder("Ex.: compras da semana").fill(marca);
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByText("Novo lançamento")).toBeHidden({ timeout: 10_000 });
}

test("1. tela de login abre", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Prosperidade").first()).toBeVisible();
  await expect(page.getByPlaceholder("voce@email.com")).toBeVisible();
});

test("2. login funciona e chega no painel", async ({ page }) => {
  await login(page);
  await expect(page.getByRole("button", { name: "Início" })).toBeVisible();
});

test("3. lançar manual → aparece no extrato → excluir (2 toques) → some", async ({ page }) => {
  const marca = `Robo E2E ${Date.now()}`;
  await login(page);

  // Lançamento manual pelo atalho "Manual" do Início.
  await lancarManual(page, "12.34", marca);

  // Confere no Extrato.
  await page.getByRole("button", { name: "Extrato" }).click();
  await expect(page.getByText(marca)).toBeVisible();

  // Exclui com a confirmação de 2 toques (a que corrigimos pro celular).
  const linha = page.locator("div").filter({ hasText: marca }).filter({ has: page.getByTitle("Excluir") }).last();
  await linha.getByTitle("Excluir").click();
  await page.getByRole("button", { name: "Confirmar exclusão" }).click();
  await expect(page.getByText(marca)).toHaveCount(0);
});

test("6. senha errada mostra o erro na tela (sem zerar o formulário)", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("voce@email.com").fill(EMAIL);
  await page.getByPlaceholder("Mínimo 6 caracteres").fill("senha-errada-123");
  await page.locator("form").getByRole("button", { name: "Entrar" }).click();
  // O erro tem que ficar visível na própria tela de login…
  await expect(page.getByText("Email ou senha incorretos", { exact: false })).toBeVisible({ timeout: 20_000 });
  // …e o email digitado não pode ter sumido (antes a tela "sincronizava" e voltava zerada).
  await expect(page.getByPlaceholder("voce@email.com")).toHaveValue(EMAIL);
});

test("5. valor com vírgula (12,34) salva o número certo", async ({ page }) => {
  const marca = `Robo Virgula ${Date.now()}`;
  await login(page);
  await lancarManual(page, "12,34", marca);
  await page.getByRole("button", { name: "Extrato" }).click();
  await expect(page.getByText(marca)).toBeVisible();
  // O valor tem que aparecer como 12,34 — não 0, não 1234.
  const linha = page.locator("div").filter({ hasText: marca }).filter({ has: page.getByTitle("Excluir") }).last();
  await expect(linha).toContainText("12,34");
  // Limpeza.
  await linha.getByTitle("Excluir").click();
  await page.getByRole("button", { name: "Confirmar exclusão" }).click();
  await expect(page.getByText(marca)).toHaveCount(0);
});

test("4. lançamento salvo de verdade no servidor (recarrega e continua)", async ({ page }) => {
  const marca = `Robo Persiste ${Date.now()}`;
  await login(page);

  await lancarManual(page, "7.89", marca);
  await page.getByRole("button", { name: "Extrato" }).click();
  await expect(page.getByText(marca)).toBeVisible();

  // Recarrega a página inteira — o dado tem que voltar do servidor.
  await page.reload();
  await expect(page.getByRole("button", { name: "Extrato" })).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Extrato" }).click();
  await expect(page.getByText(marca)).toBeVisible({ timeout: 15_000 });

  // Limpeza: exclui o que criou.
  const linha = page.locator("div").filter({ hasText: marca }).filter({ has: page.getByTitle("Excluir") }).last();
  await linha.getByTitle("Excluir").click();
  await page.getByRole("button", { name: "Confirmar exclusão" }).click();
  await expect(page.getByText(marca)).toHaveCount(0);
});
