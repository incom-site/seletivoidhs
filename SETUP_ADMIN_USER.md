# 🔐 Configuração do Usuário Admin

## Credenciais do Admin

**Email:** `rayannyrego@gmail.com`
**Senha:** `Admin@2024!Hospital`
**Nome:** Rayanny Rego
**Role:** admin
**Status:** Ativo

---

## Método 1: Adicionar Manualmente (Recomendado)

### Passo 1: Abrir a Planilha
Acesse: https://docs.google.com/spreadsheets/d/1iQSQ06P_OXkqxaGWN3uG5jRYFBKyjWqQyvzuGk2EplY/edit

### Passo 2: Ir para a aba USUARIOS
Clique na aba **USUARIOS** na parte inferior da planilha.

### Passo 3: Verificar os Headers
Certifique-se de que a primeira linha contém estes headers:

| Email | Nome | Role | Ativo | Password |
|-------|------|------|-------|----------|

Se não existirem, adicione-os na primeira linha.

### Passo 4: Adicionar o Usuário
Adicione uma nova linha com os seguintes dados:

| Email | Nome | Role | Ativo | Password |
|-------|------|------|-------|----------|
| rayannyrego@gmail.com | Rayanny Rego | admin | TRUE | Admin@2024!Hospital |

⚠️ **IMPORTANTE:**
- Certifique-se de que o valor da coluna **Ativo** seja `TRUE` (não texto, mas booleano)
- Use exatamente estes valores, respeitando maiúsculas e minúsculas

---

## Método 2: Usando o Script HTML

### Passo 1: Abrir o arquivo HTML
Abra o arquivo `add-admin-user.html` no navegador.

### Passo 2: Clicar no botão
Clique no botão "Adicionar Usuário na Planilha".

### Passo 3: Aguardar confirmação
O script tentará adicionar o usuário automaticamente.

---

## Método 3: Via Google Apps Script

### Passo 1: Abrir o Editor de Scripts
1. Abra a planilha do Google Sheets
2. Vá em **Extensões** > **Apps Script**

### Passo 2: Adicionar a Função createUser
Copie o código do arquivo `google-apps-script-create-user.js` e adicione ao seu script.

### Passo 3: Salvar e Reimplantar
1. Salve o script (Ctrl+S ou Cmd+S)
2. Clique em **Implantar** > **Gerenciar implantações**
3. Clique no ícone de edição (lápis) na implantação existente
4. Clique em **Implantar**

---

## Verificar se o Usuário foi Criado

### Via Planilha
1. Abra a planilha
2. Vá para a aba USUARIOS
3. Verifique se existe uma linha com o email `rayannyrego@gmail.com`

### Via Aplicação
1. Abra a aplicação: https://seletivo-hospital.netlify.app
2. Tente fazer login com:
   - Email: `rayannyrego@gmail.com`
   - Senha: `Admin@2024!Hospital`
3. Se o login funcionar, o usuário foi criado corretamente

---

## Criar Usuários Adicionais

### Analistas
Para criar usuários analistas, adicione linhas com `Role = analista`:

| Email | Nome | Role | Ativo | Password |
|-------|------|------|-------|----------|
| analista1@hospital.com | João Silva | analista | TRUE | Analista123! |
| analista2@hospital.com | Maria Santos | analista | TRUE | Analista456! |

### Administradores Adicionais
Para criar mais admins, use `Role = admin`:

| Email | Nome | Role | Ativo | Password |
|-------|------|------|-------|----------|
| admin2@hospital.com | Carlos Admin | admin | TRUE | Admin789! |

---

## Desativar Usuários

Para desativar um usuário sem deletá-lo:
1. Encontre a linha do usuário na planilha USUARIOS
2. Altere o valor da coluna **Ativo** para `FALSE`
3. O usuário não poderá mais fazer login

---

## Alterar Senha

Para alterar a senha de um usuário:
1. Encontre a linha do usuário na planilha USUARIOS
2. Altere o valor da coluna **Password**
3. O usuário deverá usar a nova senha no próximo login

---

## Estrutura Completa da Planilha USUARIOS

### Colunas Obrigatórias

1. **Email** (text)
   - Email único do usuário
   - Usado para login
   - Exemplo: `rayannyrego@gmail.com`

2. **Nome** (text)
   - Nome completo do usuário
   - Exibido na interface
   - Exemplo: `Rayanny Rego`

3. **Role** (text)
   - Papel do usuário no sistema
   - Valores permitidos: `admin` ou `analista`
   - Define as permissões

4. **Ativo** (boolean)
   - Status do usuário
   - Valores: `TRUE` ou `FALSE`
   - Apenas usuários ativos podem fazer login

5. **Password** (text)
   - Senha do usuário
   - ⚠️ Armazenada em texto plano (apenas para desenvolvimento)
   - Exemplo: `Admin@2024!Hospital`

---

## Permissões por Role

### Admin
- ✅ Visualizar todos os candidatos
- ✅ Importar candidatos via CSV
- ✅ Atribuir candidatos a analistas
- ✅ Gerenciar usuários
- ✅ Ver métricas globais
- ✅ Triar candidatos

### Analista
- ✅ Visualizar candidatos atribuídos
- ✅ Triar candidatos
- ✅ Ver próprias métricas
- ❌ Importar candidatos
- ❌ Atribuir candidatos
- ❌ Gerenciar usuários

---

## Solução de Problemas

### Não consigo fazer login
1. Verifique se o email está correto (com minúsculas)
2. Verifique se a senha está correta (case-sensitive)
3. Confirme que **Ativo = TRUE** na planilha
4. Limpe o cache do navegador e tente novamente

### Usuário criado mas não aparece
1. Atualize a página da planilha
2. Verifique se não há espaços extras no email
3. Confirme que a linha foi salva corretamente

### Erro ao adicionar usuário via script
1. Verifique se o Google Apps Script está publicado
2. Confirme que as permissões foram concedidas
3. Tente adicionar manualmente na planilha

---

## Segurança - IMPORTANTE ⚠️

### Desenvolvimento
- As senhas estão em texto plano
- Use apenas em ambiente de desenvolvimento
- Não compartilhe as credenciais

### Produção
Para usar em produção, você DEVE:
1. Implementar hash de senhas (bcrypt, argon2)
2. Adicionar autenticação de dois fatores
3. Usar HTTPS em todas as conexões
4. Implementar rate limiting
5. Adicionar logs de auditoria

---

## Próximos Passos

Após criar o usuário admin:

1. ✅ Fazer login na aplicação
2. ✅ Criar usuários analistas
3. ✅ Importar candidatos via CSV
4. ✅ Atribuir candidatos aos analistas
5. ✅ Iniciar o processo de triagem

---

## Suporte

Se você encontrar problemas:
1. Verifique os logs do console do navegador (F12)
2. Confirme que o Google Apps Script está funcionando
3. Teste as URLs diretamente no navegador
4. Verifique as permissões da planilha

---

**Última atualização:** 2024
**Versão da documentação:** 1.0
