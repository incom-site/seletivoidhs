# Solução Definitiva: Status de Mensagem e Mover para Entrevista

## 🔴 Problema Identificado

O erro "Selecione apenas candidatos que já receberam email ou SMS" ocorria mesmo quando candidatos já haviam recebido mensagens. Havia **DOIS problemas críticos**:

### Problema 1: Função `moveToInterview` não existia no Google Apps Script
A função era chamada pelo frontend mas não estava implementada no script.

### Problema 2: Validação de status de mensagem inconsistente
O frontend verificava se `email_sent` ou `sms_sent` eram truthy, mas os valores vinham da planilha como strings ("Sim", "TRUE") ou booleanos.

---

## ✅ Correções Aplicadas

### 1. Google Apps Script - Função `moveToInterview`

Adicionada função completa que:
- Verifica se as colunas EMAIL_SENT e SMS_SENT existem
- Valida se o candidato recebeu pelo menos uma mensagem
- Atualiza a coluna `status_entrevista` para "Aguardando"
- Registra logs detalhados de cada operação

```javascript
function moveToInterview(params) {
  try {
    const sh = _sheet(SHEET_CANDIDATOS);
    const headers = _getHeaders_(sh);
    const col = _colMap_(headers);

    const statusEntrevistaCol = col['status_entrevista'];
    const cpfCol = col['CPF'];
    const emailSentCol = col['EMAIL_SENT'];
    const smsSentCol = col['SMS_SENT'];

    if (statusEntrevistaCol === undefined || statusEntrevistaCol < 0) {
      throw new Error('Coluna status_entrevista não encontrada');
    }

    const candidateIds = String(params.candidateIds || '').split(',').map(s => s.trim()).filter(Boolean);
    Logger.log('📋 Movendo ' + candidateIds.length + ' candidatos para entrevista');

    const lastRow = sh.getLastRow();
    if (lastRow <= HEADER_ROWS) {
      return { success: true, movedCount: 0, message: 'Nenhum candidato para mover' };
    }

    const n = lastRow - HEADER_ROWS;
    const cpfs = sh.getRange(HEADER_ROWS + 1, cpfCol + 1, n, 1).getValues().map(r => String(r[0]).trim());
    const statusEntrevista = sh.getRange(HEADER_ROWS + 1, statusEntrevistaCol + 1, n, 1).getValues();

    const emailSent = emailSentCol >= 0 ? sh.getRange(HEADER_ROWS + 1, emailSentCol + 1, n, 1).getValues() : null;
    const smsSent = smsSentCol >= 0 ? sh.getRange(HEADER_ROWS + 1, smsSentCol + 1, n, 1).getValues() : null;

    let movedCount = 0;
    const pos = new Map();
    for (let i = 0; i < cpfs.length; i++) {
      pos.set(cpfs[i], i);
    }

    for (const cpf of candidateIds) {
      const i = pos.get(cpf);
      if (i === undefined) {
        Logger.log('⚠️ CPF não encontrado: ' + cpf);
        continue;
      }

      // VALIDAÇÃO CRÍTICA: Verifica se recebeu mensagem
      const hasEmail = emailSent && (emailSent[i][0] === 'Sim' || emailSent[i][0] === true || emailSent[i][0] === 'TRUE');
      const hasSms = smsSent && (smsSent[i][0] === 'Sim' || smsSent[i][0] === true || smsSent[i][0] === 'TRUE');

      if (!hasEmail && !hasSms) {
        Logger.log('⚠️ Candidato ' + cpf + ' não recebeu mensagens. Pulando.');
        continue;
      }

      statusEntrevista[i][0] = 'Aguardando';
      movedCount++;
      Logger.log('✅ ' + cpf + ' movido para entrevista');
    }

    if (movedCount > 0) {
      sh.getRange(HEADER_ROWS + 1, statusEntrevistaCol + 1, n, 1).setValues(statusEntrevista);
      _bumpRev_();
    }

    Logger.log('✅ Total movidos: ' + movedCount);
    return {
      success: true,
      movedCount: movedCount,
      message: movedCount + ' candidato(s) movido(s) para entrevista'
    };
  } catch (error) {
    Logger.log('❌ Erro em moveToInterview: ' + error.toString());
    throw error;
  }
}
```

### 2. Google Apps Script - Função `allocateToInterviewer`

Adicionada função para alocar candidatos a entrevistadores:

```javascript
function allocateToInterviewer(params) {
  try {
    const sh = _sheet(SHEET_CANDIDATOS);
    const headers = _getHeaders_(sh);
    const col = _colMap_(headers);

    const entrevistadorCol = col['entrevistador'];
    const dataEntrevistaCol = col['data_entrevista'];
    const cpfCol = col['CPF'];

    if (entrevistadorCol === undefined || entrevistadorCol < 0) {
      throw new Error('Coluna entrevistador não encontrada');
    }

    const candidateIds = String(params.candidateIds || '').split(',').map(s => s.trim()).filter(Boolean);
    const interviewerEmail = params.interviewerEmail;

    Logger.log('📋 Alocando ' + candidateIds.length + ' candidatos para ' + interviewerEmail);

    const lastRow = sh.getLastRow();
    if (lastRow <= HEADER_ROWS) {
      return { success: true, allocatedCount: 0, message: 'Nenhum candidato para alocar' };
    }

    const n = lastRow - HEADER_ROWS;
    const cpfs = sh.getRange(HEADER_ROWS + 1, cpfCol + 1, n, 1).getValues().map(r => String(r[0]).trim());
    const entrevistador = sh.getRange(HEADER_ROWS + 1, entrevistadorCol + 1, n, 1).getValues();
    const dataEntrevista = dataEntrevistaCol >= 0 ? sh.getRange(HEADER_ROWS + 1, dataEntrevistaCol + 1, n, 1).getValues() : null;

    const stamp = getCurrentTimestamp();
    let allocatedCount = 0;
    const pos = new Map();
    for (let i = 0; i < cpfs.length; i++) {
      pos.set(cpfs[i], i);
    }

    for (const cpf of candidateIds) {
      const i = pos.get(cpf);
      if (i === undefined) continue;

      entrevistador[i][0] = interviewerEmail;
      if (dataEntrevista) dataEntrevista[i][0] = stamp;
      allocatedCount++;
    }

    if (allocatedCount > 0) {
      sh.getRange(HEADER_ROWS + 1, entrevistadorCol + 1, n, 1).setValues(entrevistador);
      if (dataEntrevista && dataEntrevistaCol >= 0) {
        sh.getRange(HEADER_ROWS + 1, dataEntrevistaCol + 1, n, 1).setValues(dataEntrevista);
      }
      _bumpRev_();
    }

    Logger.log('✅ Total alocados: ' + allocatedCount);
    return {
      success: true,
      allocatedCount: allocatedCount,
      message: allocatedCount + ' candidato(s) alocado(s) para entrevista'
    };
  } catch (error) {
    Logger.log('❌ Erro em allocateToInterviewer: ' + error.toString());
    throw error;
  }
}
```

### 3. Google Apps Script - Roteamento

Adicionadas ações ao roteador:

```javascript
const actions = {
  // ... outras ações
  'sendMessages': () => sendMessages(params),
  'moveToInterview': () => moveToInterview(params),           // <-- NOVO
  'getInterviewCandidates': () => getInterviewCandidates(params),
  'getInterviewers': () => getInterviewers(params),
  'allocateToInterviewer': () => allocateToInterviewer(params), // <-- NOVO
  // ... outras ações
};
```

### 4. Frontend - ClassifiedCandidatesList.tsx

Função auxiliar para validação consistente:

```typescript
function isMessageSent(value: any): boolean {
  return value === true || value === 'Sim' || value === 'TRUE' || value === 'true';
}
```

Logs de debug detalhados:

```typescript
async function handleMoveToInterview() {
  const selected = getSelectedCandidatesData();

  console.log('🔍 Candidatos selecionados:', selected);
  console.log('🔍 Verificando status de mensagens...');
  selected.forEach(c => {
    console.log(`  - ${c.NOMECOMPLETO}:`, {
      email_sent: c.email_sent,
      email_sent_type: typeof c.email_sent,
      sms_sent: c.sms_sent,
      sms_sent_type: typeof c.sms_sent
    });
  });

  const withMessages = selected.filter(c => {
    const hasEmail = isMessageSent(c.email_sent);
    const hasSms = isMessageSent(c.sms_sent);
    return hasEmail || hasSms;
  });

  console.log('✅ Candidatos com mensagens:', withMessages.length);
  // ... resto da função
}
```

Recarregamento automático após envio:

```typescript
<MessagingModal
  isOpen={showMessagingModal}
  onClose={() => setShowMessagingModal(false)}
  candidates={getSelectedCandidatesData()}
  onMessagesSent={() => {
    setSelectedCandidates(new Set());
    setShowMessagingModal(false);
    loadClassifiedCandidates(); // <-- RECARREGA A LISTA
  }}
/>
```

---

## 📋 Checklist de Implantação

### Passo 1: Atualizar Google Apps Script ⚡⚡⚡

**CRÍTICO:** Este é o passo mais importante!

1. Acesse: https://script.google.com
2. Abra o projeto vinculado à sua planilha
3. **Copie TODO o conteúdo** do arquivo `google-apps-script-final-corrigido.js`
4. **Cole no editor** (substituindo todo o código anterior)
5. **Salve** (Ctrl+S ou Cmd+S)
6. Clique em "**Implantar**" > "**Gerenciar implantações**"
7. Clique no ícone de **lápis (editar)** na implantação atual
8. Mude para "**Nova versão**"
9. Adicione descrição: "Correção: moveToInterview e allocateToInterviewer"
10. Clique em "**Implantar**"

### Passo 2: Criar Colunas na Planilha

1. No editor do Google Apps Script
2. Selecione a função `addStatusColumnIfNotExists` no menu dropdown
3. Clique em "▶ **Executar**"
4. Aguarde a execução concluir
5. Abra a planilha CANDIDATOS
6. Verifique se as colunas foram criadas:
   - ✅ EMAIL_SENT
   - ✅ SMS_SENT
   - ✅ status_entrevista
   - ✅ entrevistador
   - ✅ data_entrevista

### Passo 3: Testar Envio de Mensagem

1. Abra a interface do sistema
2. Faça hard refresh: **Ctrl+Shift+R** (ou Cmd+Shift+R)
3. Vá em "Candidatos Classificados"
4. Selecione um candidato
5. Clique em "Enviar Mensagens"
6. Envie um email de teste
7. Aguarde confirmação

### Passo 4: Verificar na Planilha

1. Abra a planilha CANDIDATOS
2. Localize o candidato pelo CPF
3. **Verifique:** coluna EMAIL_SENT = "Sim"

### Passo 5: Testar Mover para Entrevista

1. Volte para a interface
2. Abra o Console (F12)
3. Vá em "Candidatos Classificados"
4. Selecione o candidato que recebeu mensagem
5. Clique em "Mover para Entrevista"
6. **Observe os logs no Console**
7. Deve funcionar sem erros!

### Passo 6: Verificar Logs do Google Apps Script

1. No Google Apps Script, clique em "**Execuções**" (ícone de relógio)
2. Localize a execução mais recente
3. Clique para ver os logs
4. Verifique se há mensagens como:
   ```
   📋 Movendo 1 candidatos para entrevista
   ✅ [CPF] movido para entrevista
   ✅ Total movidos: 1
   ```

---

## 🔍 Como Identificar o Problema

Se ainda não funcionar, abra o Console (F12) e verifique os logs:

### ✅ Logs CORRETOS (funcionando):

```
🔍 Candidatos selecionados: [{...}]
🔍 Verificando status de mensagens...
  - João Silva: {
      email_sent: "Sim",
      email_sent_type: "string",
      sms_sent: undefined,
      sms_sent_type: "undefined"
    }
✅ Candidatos com mensagens: 1
```

### ❌ Logs INCORRETOS (não funcionando):

```
🔍 Candidatos selecionados: [{...}]
🔍 Verificando status de mensagens...
  - João Silva: {
      email_sent: undefined,
      email_sent_type: "undefined",
      sms_sent: undefined,
      sms_sent_type: "undefined"
    }
✅ Candidatos com mensagens: 0
```

**Se os valores forem `undefined`:**
- A coluna não existe na planilha
- O Google Apps Script não foi atualizado
- A função `addStatusColumnIfNotExists` não foi executada

---

## 🆘 Troubleshooting

### Erro: "Ação não encontrada: moveToInterview"

**Causa:** Google Apps Script não foi atualizado ou não foi implantado

**Solução:**
1. Verifique se você **SALVOU** o código no Apps Script
2. Verifique se você **IMPLANTOU** uma nova versão
3. Aguarde 1-2 minutos para propagação

### Erro: "Coluna status_entrevista não encontrada"

**Causa:** Função `addStatusColumnIfNotExists` não foi executada

**Solução:**
1. Execute a função manualmente no Apps Script
2. Verifique se a coluna apareceu na planilha
3. Aguarde e tente novamente

### Erro: Candidato não aparece em "Candidatos para Entrevista"

**Causa:** Campo `status_entrevista` não foi atualizado

**Solução:**
1. Verifique na planilha se o campo `status_entrevista` = "Aguardando"
2. Verifique os logs do Apps Script para ver se houve erro
3. Tente mover novamente

### Badges não aparecem na interface

**Causa:** Cache do navegador

**Solução:**
1. Ctrl+Shift+R (hard refresh)
2. Limpe o cache completamente
3. Feche e abra o navegador

---

## 📊 Fluxo Completo Esperado

```
1. Candidato classificado
   ↓
2. Enviar mensagem (email/SMS)
   ↓
3. Google Apps Script atualiza EMAIL_SENT ou SMS_SENT = "Sim"
   ↓
4. Badge aparece na interface: "Email enviado" ou "SMS enviado"
   ↓
5. Selecionar candidato e clicar "Mover para Entrevista"
   ↓
6. Frontend valida: isMessageSent(email_sent) || isMessageSent(sms_sent)
   ↓
7. Frontend envia requisição: action=moveToInterview, candidateIds=CPF
   ↓
8. Google Apps Script valida novamente se recebeu mensagem
   ↓
9. Atualiza status_entrevista = "Aguardando"
   ↓
10. Candidato aparece em "Candidatos para Entrevista"
```

---

## ✅ Validação Final

Após implantação completa, teste este cenário:

1. ✅ Classificar candidato
2. ✅ Enviar email
3. ✅ Ver badge "Email enviado"
4. ✅ Mover para entrevista SEM ERRO
5. ✅ Ver candidato em "Candidatos para Entrevista"
6. ✅ Alocar para entrevistador
7. ✅ Ver candidato na lista do entrevistador

Se **TODOS** os passos funcionarem, o sistema está correto! 🎉
