# Correção: Status de Mensagem Enviada

## Problema Identificado

Os componentes `ClassifiedCandidatesList.tsx` e `InterviewCandidatesList.tsx` não estavam exibindo o status de mensagem enviada (email/SMS) porque:

1. O Google Apps Script não estava atualizando as colunas `EMAIL_SENT` e `SMS_SENT` na planilha CANDIDATOS quando mensagens eram enviadas
2. A função `getCandidatesByStatus` não estava retornando explicitamente esses campos booleanos

## Correções Aplicadas no Google Apps Script

### 1. Nova função `_updateMessageStatusInCandidates_`

Adicionada função auxiliar que atualiza o status de mensagem enviada na planilha CANDIDATOS após o envio bem-sucedido:

```javascript
function _updateMessageStatusInCandidates_(cpf, messageType) {
  try {
    const sh = _sheet(SHEET_CANDIDATOS);
    if (!sh) return;

    const headers = _getHeaders_(sh);
    const col = _colMap_(headers);
    const cpfCol = col['CPF'];

    let targetCol;
    if (messageType === 'email') {
      targetCol = col['EMAIL_SENT'];
    } else if (messageType === 'sms') {
      targetCol = col['SMS_SENT'];
    }

    if (targetCol === undefined || targetCol < 0) {
      Logger.log('⚠️ Coluna ' + (messageType === 'email' ? 'EMAIL_SENT' : 'SMS_SENT') + ' não encontrada');
      return;
    }

    const idx = _getIndex_(sh, headers);
    const searchKey = String(cpf).trim();
    const row = idx[searchKey];

    if (!row) {
      Logger.log('⚠️ Candidato não encontrado para atualizar status de mensagem: ' + cpf);
      return;
    }

    sh.getRange(row, targetCol + 1).setValue('Sim');
    Logger.log('✅ Status de mensagem atualizado para ' + cpf + ' - ' + messageType);

  } catch (error) {
    Logger.log('❌ Erro ao atualizar status de mensagem: ' + error.toString());
  }
}
```

### 2. Atualização da função `sendMessages`

Modificado para chamar `_updateMessageStatusInCandidates_` após envio bem-sucedido:

```javascript
if (result.ok) {
  successCount++;
  results.push({
    candidateId: cpf,
    candidateName: nome,
    success: true
  });

  _updateMessageStatusInCandidates_(cpf, messageType);  // <-- NOVO
}
```

### 3. Atualização da função `getCandidatesByStatus`

Adicionado mapeamento explícito para os campos booleanos:

```javascript
function getCandidatesByStatus(params) {
  const {sheet, headers, values} = _readSheetBlock_(SHEET_CANDIDATOS);
  if (!sheet || !values.length) return [];

  const col = _colMap_(headers);
  const statusCol = col['Status'];
  const cpfCol = col['CPF'];
  const emailSentCol = col['EMAIL_SENT'];        // <-- NOVO
  const smsSentCol = col['SMS_SENT'];            // <-- NOVO

  const filtered = [];
  for (let i=0;i<values.length;i++){
    if (values[i][statusCol] === params.status){
      const obj = {};
      for (let j=0;j<headers.length;j++) obj[headers[j]] = values[i][j];
      obj.id = values[i][cpfCol];
      obj.registration_number = values[i][cpfCol];

      // <-- NOVO: Conversão explícita para booleano
      obj.email_sent = emailSentCol >= 0 ? (values[i][emailSentCol] === 'Sim' || values[i][emailSentCol] === true || values[i][emailSentCol] === 'TRUE') : false;
      obj.sms_sent = smsSentCol >= 0 ? (values[i][smsSentCol] === 'Sim' || values[i][smsSentCol] === true || values[i][smsSentCol] === 'TRUE') : false;

      filtered.push(obj);
    }
  }
  return filtered;
}
```

### 4. Atualização da função `getInterviewCandidates`

Adicionado o mesmo mapeamento para candidatos de entrevista:

```javascript
const emailSentCol = col['EMAIL_SENT'];
const smsSentCol = col['SMS_SENT'];

// ... dentro do loop
candidate.email_sent = emailSentCol >= 0 ? (values[i][emailSentCol] === 'Sim' || values[i][emailSentCol] === true || values[i][emailSentCol] === 'TRUE') : false;
candidate.sms_sent = smsSentCol >= 0 ? (values[i][smsSentCol] === 'Sim' || values[i][smsSentCol] === true || values[i][smsSentCol] === 'TRUE') : false;
```

### 5. Adicionadas colunas obrigatórias

Atualizada função `addStatusColumnIfNotExists` para incluir:

```javascript
const requiredColumns = [
  'Status',
  'Motivo Desclassificação',
  'Observações',
  'Data Triagem',
  'Analista',
  'EMAIL',
  'TELEFONE',
  'EMAIL_SENT',      // <-- NOVO
  'SMS_SENT',        // <-- NOVO
  'status_entrevista',
  'entrevistador',
  'data_entrevista',
  'nota_final',
  'observacoes_entrevista'
];
```

## Como Aplicar a Correção

1. **Abra o Google Apps Script**:
   - Acesse: https://script.google.com
   - Encontre o projeto vinculado à sua planilha

2. **Substitua o código completo**:
   - Copie todo o conteúdo do arquivo `google-apps-script-final-corrigido.js`
   - Cole no editor do Google Apps Script
   - Salve o projeto

3. **Implante a nova versão**:
   - Clique em "Implantar" > "Gerenciar implantações"
   - Clique no ícone de lápis (editar) na implantação atual
   - Mude a versão para "Nova versão"
   - Clique em "Implantar"

4. **Execute a função de criação de colunas** (primeira vez):
   - No editor, selecione a função `addStatusColumnIfNotExists`
   - Clique em "Executar"
   - Isso criará as colunas EMAIL_SENT e SMS_SENT se não existirem

5. **Verifique na planilha CANDIDATOS**:
   - Abra a planilha
   - Confirme que as colunas `EMAIL_SENT` e `SMS_SENT` foram criadas
   - Os valores devem ser "Sim" para candidatos que receberam mensagens

## Resultado Esperado

Após aplicar a correção:

1. **ClassifiedCandidatesList.tsx** exibirá corretamente:
   - Badge verde "Email enviado" para candidatos que receberam email
   - Badge azul "SMS enviado" para candidatos que receberam SMS
   - Texto "Nenhuma mensagem enviada" para os demais

2. **InterviewCandidatesList.tsx** receberá apenas candidatos que:
   - Estão com status "Classificado"
   - Receberam pelo menos uma mensagem (email ou SMS)
   - Foram movidos para a fase de entrevista

3. **Fluxo correto**:
   ```
   Candidatos Classificados
   → Enviar mensagem (email/SMS)
   → Status atualizado na planilha
   → Mover para Entrevista (apenas os que receberam mensagem)
   → Aparecem em "Candidatos para Entrevista"
   ```

## Validação

Para testar se está funcionando:

1. Classifique um candidato
2. Envie uma mensagem (email ou SMS) para ele
3. Verifique na planilha se a coluna EMAIL_SENT ou SMS_SENT foi marcada como "Sim"
4. Mova o candidato para entrevista
5. Verifique se ele aparece na lista "Candidatos para Entrevista"

## Troubleshooting

### Problema: Colunas não aparecem

**Solução**: Execute manualmente a função `addStatusColumnIfNotExists` no Google Apps Script

### Problema: Status não atualiza após enviar mensagem

**Solução**:
1. Verifique se a nova versão do script foi implantada
2. Verifique os logs do Google Apps Script para erros
3. Confirme que o CPF do candidato está correto na planilha

### Problema: Badge não aparece na interface

**Solução**:
1. Limpe o cache do navegador
2. Faça um hard refresh (Ctrl+Shift+R)
3. Verifique o console do navegador para erros
