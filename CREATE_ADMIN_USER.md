# Criar Usuário Admin

## Dados do Usuário Admin

**Email:** rayannyrego@gmail.com
**Nome:** Rayanny Rego
**Role:** admin
**Senha:** Admin@2024!Hospital
**Ativo:** TRUE

---

## Como Adicionar na Planilha Google Sheets

1. Acesse a planilha: https://docs.google.com/spreadsheets/d/1iQSQ06P_OXkqxaGWN3uG5jRYFBKyjWqQyvzuGk2EplY/edit

2. Vá para a aba **USUARIOS**

3. Adicione uma nova linha com os seguintes dados:

| Email | Nome | Role | Ativo | Password |
|-------|------|------|-------|----------|
| rayannyrego@gmail.com | Rayanny Rego | admin | TRUE | Admin@2024!Hospital |

---

## Estrutura Esperada da Planilha USUARIOS

A planilha deve ter as seguintes colunas (na primeira linha):

- **Email** - Email do usuário (único)
- **Nome** - Nome completo do usuário
- **Role** - Papel do usuário (admin ou analista)
- **Ativo** - TRUE ou FALSE (indica se o usuário está ativo)
- **Password** - Senha do usuário (em texto plano - apenas para desenvolvimento)

---

## Instruções de Login

Após adicionar o usuário na planilha:

1. Acesse a aplicação
2. Use as credenciais:
   - **Email:** rayannyrego@gmail.com
   - **Senha:** Admin@2024!Hospital

---

## Criando Mais Usuários

Para criar analistas, use a mesma estrutura mas com `Role = analista`:

```
Email: analista@hospital.com
Nome: Nome do Analista
Role: analista
Ativo: TRUE
Password: SenhaDoAnalista123
```

---

## Segurança

⚠️ **IMPORTANTE:**
- As senhas estão em texto plano apenas para desenvolvimento
- Em produção, implemente hash de senhas (bcrypt, etc)
- Não compartilhe estas credenciais
- Altere a senha após o primeiro login

---

## Verificando o Google Apps Script

Certifique-se de que o Google Apps Script está configurado e publicado:

1. Abra o editor de scripts do Google Sheets (Extensões > Apps Script)
2. Cole o código do arquivo `src/services/googleSheets.ts`
3. Clique em "Implantar" > "Nova implantação"
4. Selecione "Aplicativo da Web"
5. Configure:
   - Execute como: Eu
   - Quem tem acesso: Qualquer pessoa
6. Copie a URL do aplicativo web e atualize nos arquivos de serviço
