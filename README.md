# Finanças do Casal

Aplicativo React para Rubens e Nayara acompanharem gastos, ganhos, metas e relatórios mensais.

## Funções principais

- Lançamento manual, por texto ou por voz.
- Anexo de foto de recibo/nota no lançamento.
- Agente financeiro local para resumo do mês, economia, metas e contas fixas.
- Relatórios com exportação em CSV, planilha Excel compatível (`.xls`), PDF e impressão.
- Backup/importação em JSON para trocar dados entre aparelhos.

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

Os dados ficam no navegador de cada aparelho via `localStorage`. Use o backup JSON para transferir ou guardar uma cópia. Para uso compartilhado em tempo real, o próximo passo recomendado é adicionar login e banco de dados, por exemplo Supabase.
