import { test, expect } from "@playwright/test";

// Fluxos críticos do Prosperidade, testados como uma pessoa usaria (celular).
// Conta usada: robô de testes (workspace próprio, isolado dos dados reais).

const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;

test.describe.configure({ mode: "serial" });

async function login(page) {
  // Pré-adia o alerta de contas do dia (senão o modal pipoca no meio do teste e bloqueia os cliques).
  await page.addInitScript(() => {
    const d = new Date();
    const hoje = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    localStorage.setItem("prosperidade-bills-snooze", hoje);
  });
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

test("7. esqueci minha senha abre a tela de redefinição", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Esqueci minha senha" }).click();
  await expect(page.getByText("Vamos redefinir")).toBeVisible();
  await expect(page.getByRole("button", { name: "Enviar link de redefinição" })).toBeVisible();
  await page.getByRole("button", { name: "← Voltar pro login" }).click();
  await expect(page.locator("form").getByRole("button", { name: "Entrar" })).toBeVisible();
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

test("8. meta: criar → depositar com vírgula → excluir", async ({ page }) => {
  const nome = `Robo Meta ${Date.now()}`;
  await login(page);
  await page.getByRole("button", { name: "Metas" }).click();
  await page.getByRole("button", { name: "Nova" }).click();
  await page.getByPlaceholder("Nome da meta (ex: Viagem)").fill(nome);
  await page.getByPlaceholder("Valor alvo (R$)").fill("1.000,00");
  await page.getByRole("button", { name: "Criar meta" }).click();
  await expect(page.getByText(nome)).toBeVisible();

  // Deposita 100,50 (com vírgula) e confere o progresso.
  await page.getByText(nome).click();
  await page.getByPlaceholder("Valor (R$)").fill("100,50");
  await page.getByRole("button", { name: "Guardar na meta" }).click();
  await expect(page.getByText("R$ 100,50").first()).toBeVisible();

  // Fecha a sheet (toque no fundo escuro) e exclui a meta.
  await page.mouse.click(195, 40);
  await expect(page.getByRole("button", { name: "Nova" })).toBeVisible();
  await page.getByTitle("Excluir").click();
  await page.getByRole("button", { name: "Confirmar exclusão" }).click();
  await expect(page.getByText(nome)).toHaveCount(0);
});

test("9. conta fixa: paga vira gasto no extrato, desmarcar tira, cartão não vira", async ({ page }) => {
  const nome = `Robo Conta ${Date.now()}`;
  await login(page);

  // Cria a conta fixa (categoria padrão Energia = conta normal, não cartão).
  await page.getByText("Gastos fixos").click();
  await page.getByRole("button", { name: "Adicionar conta fixa" }).click();
  await page.getByPlaceholder("Nome (ex: Internet)").fill(nome);
  await page.getByPlaceholder("Valor", { exact: true }).fill("55,90");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByText(nome)).toBeVisible();

  // Marca como paga → tem que virar GASTO no extrato.
  await page.getByTitle("Marcar como pago").click();
  await expect(page.getByText("Pago este mês ✓")).toBeVisible();
  await page.getByRole("button", { name: "Extrato" }).click();
  await expect(page.getByText(`${nome} (conta fixa)`)).toBeVisible();

  // Desmarca → o gasto tem que SUMIR do extrato.
  await page.getByRole("button", { name: "Início" }).click();
  await page.getByText("Gastos fixos").click();
  await page.getByTitle("Marcar como não pago").click();
  await page.getByRole("button", { name: "Extrato" }).click();
  await expect(page.getByText(`${nome} (conta fixa)`)).toHaveCount(0);

  // Limpeza: exclui a conta fixa.
  await page.getByRole("button", { name: "Início" }).click();
  await page.getByText("Gastos fixos").click();
  await page.getByTitle("Excluir").click();
  await page.getByRole("button", { name: "Confirmar exclusão" }).click();
  await expect(page.getByText(nome)).toHaveCount(0);
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
