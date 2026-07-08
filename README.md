# Finanças do Casal

Aplicativo React para Rubens e Nayara acompanharem gastos, ganhos, metas e relatórios mensais.

## Funções principais

- Lançamento manual, por texto ou por voz.
- Anexo de foto de recibo/nota no lançamento.
- Agente financeiro local para resumo do mês, economia, metas e contas fixas.
- Relatórios com exportação em CSV, planilha Excel compatível (`.xls`), PDF e impressão.
- Backup/importação em JSON para trocar dados entre aparelhos.
- Primeiro acesso com criação de admin, login por usuário/senha e aba Admin para criar novos acessos.

## Rodar localmente

```bash
npm install
npm run dev
```

## Gerar versão de produção

```bash
npm run build
```

## Publicar no GitHub Pages

O projeto já inclui `.github/workflows/pages.yml`. Depois de enviar para um repositório no GitHub, cada push na branch `main` gera e publica o site pelo GitHub Pages.

## Observação sobre dados

Os dados e acessos ficam no navegador de cada aparelho via `localStorage`. Use o backup JSON para transferir ou guardar uma cópia. No GitHub Pages, a senha protege o uso local do app, mas não substitui autenticação com servidor. Para uso compartilhado em tempo real e login centralizado, o próximo passo recomendado é adicionar banco de dados e autenticação, por exemplo Supabase.
