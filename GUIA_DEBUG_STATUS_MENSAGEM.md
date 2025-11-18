# Guia de Debug: Status de Mensagem Enviada

## Problema

O sistema não reconhece que um candidato recebeu mensagem (email ou SMS) ao tentar mover para entrevista.

## Causa Raiz

Os valores das colunas `EMAIL_SENT` e `SMS_SENT` no Google Sheets podem estar em formatos diferentes (string "Sim", booleano true, ou vazios), e o sistema não estava validando todos os formatos possíveis.

## Correções Aplicadas

### 1. Componente ClassifiedCandidatesList.tsx

Adicionada função auxiliar `isMessageSent` que valida múltiplos formatos:

```typescript
function isMessageSent(value: any): boolean {
  return value === true || value === 'Sim' || value === 'TRUE' || value === 'true';
}
```

Atualizada validação em `handleMoveToInterview`:
```typescript
const withMessages = selected.filter(c => {
  const hasEmail = isMessageSent(c.email_sent);
  const hasSms = isMessageSent(c.sms_sent);
  return hasEmail || hasSms;
});
```

Adicionados logs para debug:
```typescript
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
```

Atualizado callback para recarregar lista após envio:
```typescript
onMessagesSent={() => {
  setSelectedCandidates(new Set());
  setShowMessagingModal(false);
  loadClassifiedCandidates(); // <-- ADICIONADO
}}
```

### 2. Google Apps Script

Certifique-se de que o script atualizado foi implantado com:
- Função `_updateMessageStatusInCandidates_` que atualiza as colunas na planilha
- Função `getCandidatesByStatus` que retorna campos booleanos
- Colunas `EMAIL_SENT` e `SMS_SENT` criadas na planilha

## Como Fazer Debug

### Passo 1: Abra o Console do Navegador

1. Pressione `F12` no navegador
2. Vá na aba "Console"
3. Mantenha aberto durante os testes

### Passo 2: Envie uma Mensagem

1. Selecione um candidato classificado
2. Clique em "Enviar Mensagens"
3. Envie um email ou SMS
4. Aguarde a confirmação

### Passo 3: Verifique a Planilha

**IMPORTANTE:** Antes de verificar na interface, confira diretamente no Google Sheets:

1. Abra a planilha CANDIDATOS
2. Localize o candidato que recebeu a mensagem
3. Verifique se a coluna `EMAIL_SENT` ou `SMS_SENT` foi marcada como "Sim"

**Se NÃO estiver marcado:**
- O Google Apps Script não foi atualizado corretamente
- Execute `addStatusColumnIfNotExists` no Apps Script
- Reimplante a nova versão do script

**Se estiver marcado:**
- O problema está na interface
- Continue para o Passo 4

### Passo 4: Recarregue a Lista

1. Na interface, saia e volte para a tela "Candidatos Classificados"
2. Verifique se o badge "Email enviado" ou "SMS enviado" aparece

**Se NÃO aparecer:**
- Abra o Console do navegador
- Clique em "Recarregar" (ou Ctrl+Shift+R)
- Verifique os logs no console

### Passo 5: Tente Mover para Entrevista

1. Selecione o candidato que recebeu a mensagem
2. Clique em "Mover para Entrevista"
3. Observe os logs no Console

**Logs Esperados:**
```
🔍 Candidatos selecionados: [...]
🔍 Verificando status de mensagens...
  - Nome do Candidato: {
      email_sent: "Sim" (ou true),
      email_sent_type: "string" (ou "boolean"),
      sms_sent: undefined,
      sms_sent_type: "undefined"
    }
✅ Candidatos com mensagens: 1
```

## Cenários de Erro

### Cenário 1: email_sent é undefined

**Causa:** A coluna EMAIL_SENT não existe ou o Google Apps Script não retornou o campo

**Solução:**
1. Execute `addStatusColumnIfNotExists` no Google Apps Script
2. Reimplante o script
3. Verifique se a função `getCandidatesByStatus` está retornando o campo

### Cenário 2: email_sent é string vazia ""

**Causa:** A coluna existe mas não foi atualizada após o envio

**Solução:**
1. Verifique se a função `sendMessages` está chamando `_updateMessageStatusInCandidates_`
2. Verifique os logs do Google Apps Script (View > Logs)
3. Teste enviar uma nova mensagem

### Cenário 3: email_sent é "Sim" mas validação falha

**Causa:** A função `isMessageSent` não reconhece o formato

**Solução:**
- Este problema foi corrigido no código
- Faça hard refresh (Ctrl+Shift+R)
- Limpe o cache do navegador

### Cenário 4: Badge não aparece mas planilha está marcada

**Causa:** Cache do navegador ou dados não foram recarregados

**Solução:**
1. Faça hard refresh (Ctrl+Shift+R)
2. Limpe o localStorage: `localStorage.clear()` no Console
3. Recarregue a página

## Checklist de Validação

Antes de reportar erro, verifique:

- [ ] Google Apps Script atualizado e reimplantado
- [ ] Função `addStatusColumnIfNotExists` executada
- [ ] Colunas EMAIL_SENT e SMS_SENT existem na planilha CANDIDATOS
- [ ] Valor na planilha é "Sim" após envio de mensagem
- [ ] Hard refresh feito no navegador (Ctrl+Shift+R)
- [ ] Console do navegador verificado para logs
- [ ] Lista de candidatos recarregada após envio

## Script de Teste Manual

Cole no Console do navegador para testar a função:

```javascript
// Teste a função isMessageSent
const testValues = [
  true,
  'Sim',
  'TRUE',
  'true',
  false,
  undefined,
  null,
  '',
  'Não'
];

testValues.forEach(val => {
  const result = (val === true || val === 'Sim' || val === 'TRUE' || val === 'true');
  console.log(`isMessageSent(${JSON.stringify(val)}):`, result);
});
```

**Resultado Esperado:**
```
isMessageSent(true): true
isMessageSent("Sim"): true
isMessageSent("TRUE"): true
isMessageSent("true"): true
isMessageSent(false): false
isMessageSent(undefined): false
isMessageSent(null): false
isMessageSent(""): false
isMessageSent("Não"): false
```

## Suporte Adicional

Se o problema persistir após seguir todos os passos:

1. Copie os logs completos do Console
2. Tire um print da linha na planilha com o problema
3. Verifique se há erros no log do Google Apps Script
4. Documente os passos exatos que reproduzem o problema
