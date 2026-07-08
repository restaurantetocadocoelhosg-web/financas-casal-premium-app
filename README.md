# Finanças do Casal

Aplicativo React para Rubens e Nayara acompanharem gastos, ganhos, metas e relatórios mensais.

## Funções principais

- Lançamento manual, por texto ou por voz.
- Anexo de foto de recibo/nota no lançamento.
- Agente financeiro local para resumo do mês, economia, metas e contas fixas.
- Relatórios com exportação em CSV, planilha Excel compatível (`.xls`), PDF e impressão.
- Backup/importação em JSON para trocar dados entre aparelhos.
- Login online por email/senha com Supabase Auth.
- Espaço compartilhado no Supabase com sincronização automática dos dados.
- Aba Admin para acompanhar membros, status da sincronização e gerar convites.

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

## Supabase

O frontend continua hospedado no GitHub Pages, e o login/dados usam o projeto Supabase:

- URL: `https://zuwdgyvbuaocbzckhhlm.supabase.co`
- Tabelas: `finance_workspaces`, `finance_members`, `finance_app_state`, `finance_invites`
- RPCs: `finance_bootstrap_workspace`, `finance_create_invite`, `finance_accept_invite`

As tabelas do app usam RLS. As RPCs de criação/convite exigem usuário autenticado.

## Observação sobre dados

O app ainda mantém uma cópia local para carregamento e backup. Na primeira entrada online, se o Supabase estiver vazio e houver dados neste aparelho, o app envia esse histórico para o workspace. O modo offline interno/instalável fica para a próxima fase de teste.
