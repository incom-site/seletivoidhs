# Instruções para Configurar Aliases de Email

## O que foi alterado?

O sistema agora suporta **aliases do Gmail** como remetente de emails, permitindo que você personalize o endereço que aparecerá para os candidatos.

## Arquivos Atualizados

### 1. `google-apps-script-final-corrigido.js`
- ✅ Adicionada nova aba `ALIASES` para gerenciar emails remetentes
- ✅ Criada função `getEmailAliases()` para listar aliases disponíveis
- ✅ Modificada função `sendMessages()` para aceitar parâmetro `fromAlias`
- ✅ Modificada função `_sendEmailGmail_()` para usar alias como remetente
- ✅ Modificada função `updateMessageStatus()` para aceitar múltiplos candidatos

### 2. `src/services/googleSheets.ts`
- ✅ Adicionado parâmetro opcional `fromAlias` na função `sendMessages()`
- ✅ Criada função `getEmailAliases()` para buscar aliases do Google Sheets
- ✅ Modificada função `updateMessageStatus()` para aceitar array de registration numbers

### 3. `src/components/MessagingModal.tsx`
- ✅ Adicionado seletor de alias (dropdown) quando tipo = 'email'
- ✅ Implementado carregamento de aliases via `getEmailAliases()`
- ✅ Alias selecionado é enviado junto com a mensagem
- ✅ Fallback para alias padrão caso não encontre nenhum

---

## Como fazer o deploy

### Passo 1: Atualizar o Google Apps Script

1. Acesse: https://script.google.com/home/projects/1HYxA8oL_IWjEJz4qPbnK9uGwSDu2g9GaSXMK9IZ2WYxRcbRUdVSZx2Fq
2. Clique no arquivo `Code.gs`
3. **SUBSTITUA TODO O CONTEÚDO** pelo conteúdo do arquivo: `google-apps-script-final-corrigido.js`
4. Clique em **"Implantar"** > **"Gerenciar implantações"**
5. Clique no ícone de **"Editar"** (lápis) da implantação ativa
6. Em **"Versão"**, selecione **"Nova versão"**
7. Adicione uma descrição: `Suporte a aliases de email`
8. Clique em **"Implantar"**

### Passo 2: Criar a aba ALIASES no Google Sheets

A aba será criada automaticamente na primeira vez que você chamar a função `getEmailAliases()`. Mas você pode criá-la manualmente:

1. Abra sua planilha: https://docs.google.com/spreadsheets/d/1iQSQ06P_OXkqxaGWN3uG5jRYFBKyjWqQyvzuGk2EplY
2. Crie uma nova aba chamada **`ALIASES`**
3. Adicione os seguintes cabeçalhos na primeira linha:
   - A1: `Alias`
   - B1: `Ativo`
4. Adicione seus aliases de email:

| Alias | Ativo |
|-------|-------|
| seletivoinstitutoacqua@gmail.com | Sim |
| contato@institutoacqua.org.br | Sim |
| rh@institutoacqua.org.br | Sim |

**⚠️ IMPORTANTE:** Os emails na coluna `Alias` devem ser **aliases configurados no Gmail** do usuário que autorizou o script.

### Passo 3: Configurar Aliases no Gmail

Para que os aliases funcionem, você precisa configurá-los no Gmail:

1. Acesse: https://mail.google.com/mail/u/0/#settings/accounts
2. Na seção **"Enviar e-mail como:"**, clique em **"Adicionar outro endereço de e-mail"**
3. Digite o nome e o email do alias
4. Siga as instruções para verificar o alias
5. Após a verificação, o alias estará disponível para uso

**Opções de aliases:**
- Endereços de domínio próprio (ex: `rh@institutoacqua.org.br`)
- Aliases do Gmail (ex: `instituto.acqua+rh@gmail.com`)
- Grupos do Google Workspace

---

## Como funciona no frontend

### 1. Ao abrir o modal de mensagens
```typescript
// Carrega aliases disponíveis
const result = await googleSheetsService.getEmailAliases();
setAliases(result.data || []);
setSelectedAlias(result.data[0]); // Seleciona o primeiro por padrão
```

### 2. O usuário seleciona o alias
```tsx
<select value={selectedAlias} onChange={(e) => setSelectedAlias(e.target.value)}>
  {aliases.map((alias) => (
    <option key={alias} value={alias}>{alias}</option>
  ))}
</select>
```

### 3. Ao enviar mensagens
```typescript
await googleSheetsService.sendMessages(
  messageType,
  subject,
  content,
  candidateIds,
  user?.email,
  selectedAlias // ← Alias enviado aqui
);
```

### 4. No Google Apps Script
```javascript
function sendMessages(params) {
  const fromAlias = params.fromAlias || '';

  // Ao enviar email:
  GmailApp.sendEmail(to, subject, body, { from: fromAlias });
}
```

---

## Fallback e Tratamento de Erros

### Se não houver aliases configurados:
- O sistema usa um alias padrão: `seletivoinstitutoacqua@gmail.com`
- Aparece um aviso no modal: "Nenhum alias configurado no Gmail"

### Se o alias não estiver configurado no Gmail:
- O Gmail enviará com o email padrão da conta
- Pode aparecer um aviso de "enviado por outro endereço"

---

## Testando a Funcionalidade

### Teste 1: Verificar se aliases são carregados
1. Abra o sistema e faça login
2. Selecione candidatos e clique em "Enviar Mensagens"
3. Verifique se o dropdown "Remetente (Alias)" aparece
4. Verifique se os aliases da planilha estão listados

### Teste 2: Enviar email com alias
1. Selecione um alias do dropdown
2. Preencha assunto e conteúdo
3. Clique em "Enviar Mensagens"
4. Verifique o email recebido:
   - O remetente deve ser o alias selecionado
   - O email deve chegar normalmente

### Teste 3: Enviar SMS (não afeta)
1. Selecione tipo "SMS"
2. O dropdown de alias não deve aparecer
3. SMS é enviado normalmente via Twilio

---

## Troubleshooting

### Problema: Aliases não aparecem no dropdown
**Solução:**
1. Verifique se a aba `ALIASES` existe na planilha
2. Verifique se a coluna `Ativo` tem o valor "Sim"
3. Abra o console do navegador (F12) e verifique erros
4. Teste a função `getEmailAliases` no Google Apps Script

### Problema: Email não é enviado com o alias
**Solução:**
1. Verifique se o alias está configurado no Gmail
2. Acesse: https://mail.google.com/mail/u/0/#settings/accounts
3. Confirme que o alias aparece em "Enviar e-mail como:"
4. Se não aparecer, adicione e verifique o alias

### Problema: Email aparece como "enviado por..."
**Solução:**
- Isso acontece quando o alias não está verificado no Gmail
- Siga o processo de verificação enviado para o email do alias
- Após verificação, isso não aparecerá mais

---

## Resumo das Mudanças

| Componente | O que mudou |
|------------|-------------|
| **Google Apps Script** | Aceita `fromAlias` como parâmetro em `sendMessages()` |
| **Google Apps Script** | Nova função `getEmailAliases()` retorna lista de aliases |
| **Google Sheets** | Nova aba `ALIASES` para gerenciar emails remetentes |
| **Frontend** | Dropdown para selecionar alias ao enviar emails |
| **Frontend** | Função `getEmailAliases()` carrega aliases da planilha |

---

## Código de Exemplo

### Adicionar novo alias via script
```javascript
function addEmailAlias(alias, ativo = 'Sim') {
  const sheet = initAliasesSheet();
  sheet.appendRow([alias, ativo]);
  Logger.log('✅ Alias adicionado: ' + alias);
}

// Uso:
addEmailAlias('novoemail@institutoacqua.org.br');
```

### Desativar alias
```javascript
function disableAlias(aliasEmail) {
  const sheet = initAliasesSheet();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === aliasEmail) {
      sheet.getRange(i + 1, 2).setValue('Não');
      Logger.log('✅ Alias desativado: ' + aliasEmail);
      return;
    }
  }
}

// Uso:
disableAlias('seletivoinstitutoacqua@gmail.com');
```

---

## Próximos Passos

1. ✅ Deploy do Google Apps Script atualizado
2. ✅ Criar aba ALIASES no Google Sheets
3. ✅ Configurar aliases no Gmail
4. ✅ Testar envio de emails com diferentes aliases
5. ✅ Verificar recebimento dos emails

**Tudo pronto!** O sistema agora permite selecionar o email remetente ao enviar mensagens.
