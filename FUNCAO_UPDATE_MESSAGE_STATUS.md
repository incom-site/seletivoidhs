# Função updateMessageStatus - Google Apps Script

## Descrição

A função `updateMessageStatus` permite atualizar manualmente o status de mensagem enviada (EMAIL_SENT ou SMS_SENT) na planilha CANDIDATOS.

## Quando Usar

Use esta função quando:
- Você enviou uma mensagem por um sistema externo e precisa registrar na planilha
- Precisa corrigir manualmente o status de envio de mensagem
- Quer marcar que um candidato recebeu mensagem sem de fato enviá-la

## Parâmetros

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `registrationNumber` | string | Sim | CPF ou Número de Inscrição do candidato |
| `messageType` | string | Sim | Tipo de mensagem: `"email"` ou `"sms"` |

## Como Usar

### 1. Via Google Apps Script (Teste Manual)

Abra o Google Apps Script e execute este código no console:

```javascript
function testUpdateMessageStatus() {
  const result = updateMessageStatus({
    registrationNumber: '12345678900',  // CPF do candidato
    messageType: 'email'                // ou 'sms'
  });

  Logger.log(result);
}
```

### 2. Via Frontend (JavaScript/TypeScript)

```typescript
import { googleSheetsService } from '../services/googleSheets';

// Atualizar status de email enviado
const result = await googleSheetsService.updateMessageStatus(
  '12345678900',  // CPF do candidato
  'email'         // tipo: 'email' ou 'sms'
);

if (result.success) {
  console.log('Status atualizado com sucesso!');
} else {
  console.error('Erro:', result.error);
}
```

### 3. Via URL (Requisição HTTP)

```bash
# Exemplo com curl
curl "https://script.google.com/macros/s/SEU_SCRIPT_ID/exec?action=updateMessageStatus&registrationNumber=12345678900&messageType=email"
```

## Comportamento

1. **Busca o candidato** pelo CPF ou Número de Inscrição
2. **Valida** se a coluna EMAIL_SENT ou SMS_SENT existe
3. **Atualiza** a coluna com o valor `"Sim"`
4. **Invalida o cache** para forçar atualização dos dados
5. **Retorna** sucesso ou erro

## Resposta de Sucesso

```json
{
  "success": true,
  "message": "Status de mensagem atualizado com sucesso",
  "registrationNumber": "12345678900",
  "messageType": "email",
  "status": "Sim"
}
```

## Erros Possíveis

### Erro 1: Número de inscrição não fornecido

```json
{
  "success": false,
  "error": "Número de inscrição é obrigatório"
}
```

**Solução:** Forneça o parâmetro `registrationNumber`

### Erro 2: Tipo de mensagem inválido

```json
{
  "success": false,
  "error": "Tipo de mensagem inválido. Use \"email\" ou \"sms\""
}
```

**Solução:** Use apenas `"email"` ou `"sms"` como `messageType`

### Erro 3: Coluna não encontrada

```json
{
  "success": false,
  "error": "Coluna EMAIL_SENT não encontrada. Execute addStatusColumnIfNotExists primeiro."
}
```

**Solução:** Execute a função `addStatusColumnIfNotExists` no Google Apps Script

### Erro 4: Candidato não encontrado

```json
{
  "success": false,
  "error": "Candidato não encontrado: 12345678900"
}
```

**Solução:** Verifique se o CPF/Número de Inscrição está correto na planilha

## Exemplo Completo: Atualizar Múltiplos Candidatos

```typescript
async function marcarMensagensEnviadas() {
  const candidatos = [
    { cpf: '12345678900', tipo: 'email' },
    { cpf: '98765432100', tipo: 'sms' },
    { cpf: '11122233344', tipo: 'email' }
  ];

  for (const candidato of candidatos) {
    const result = await googleSheetsService.updateMessageStatus(
      candidato.cpf,
      candidato.tipo as 'email' | 'sms'
    );

    if (result.success) {
      console.log(`✅ ${candidato.cpf} - ${candidato.tipo} atualizado`);
    } else {
      console.error(`❌ ${candidato.cpf} - Erro: ${result.error}`);
    }
  }
}
```

## Logs do Google Apps Script

Quando a função é executada, você verá logs como:

```
📝 updateMessageStatus iniciado
✅ Status de mensagem atualizado: 12345678900 - email = Sim
```

Ou em caso de erro:

```
📝 updateMessageStatus iniciado
❌ Erro em updateMessageStatus: Candidato não encontrado: 12345678900
```

## Integração com o Fluxo de Envio de Mensagens

A função `sendMessages` já chama automaticamente `_updateMessageStatusInCandidates_` após enviar com sucesso. Use `updateMessageStatus` apenas quando:

1. Você quer atualizar manualmente sem enviar mensagem
2. Uma mensagem foi enviada por outro sistema
3. Precisa corrigir um status incorreto
4. Está testando o fluxo de movimentação de candidatos

## Verificar Status Atual

Para verificar se um candidato tem mensagem enviada, você pode:

### No Google Sheets
1. Abra a planilha CANDIDATOS
2. Localize o candidato pelo CPF
3. Verifique as colunas EMAIL_SENT e SMS_SENT
4. Valor esperado: `"Sim"` para mensagens enviadas

### Via Frontend
```typescript
const result = await googleSheetsService.getCandidatesByStatus('Classificado');
if (result.success && result.data) {
  const candidatos = result.data as any[];
  candidatos.forEach(c => {
    console.log(`${c.NOMECOMPLETO}: email=${c.email_sent}, sms=${c.sms_sent}`);
  });
}
```

## Diferença entre `_updateMessageStatusInCandidates_` e `updateMessageStatus`

| Característica | `_updateMessageStatusInCandidates_` | `updateMessageStatus` |
|----------------|-------------------------------------|----------------------|
| Visibilidade | Função interna (privada) | Função pública (API) |
| Validação | Mínima | Completa |
| Retorno | Void (não retorna) | Objeto com sucesso/erro |
| Uso | Chamada automática por `sendMessages` | Chamada manual pelo frontend |
| Erro | Loga mas não quebra | Lança exceção |

## Segurança

⚠️ **IMPORTANTE:** Esta função **NÃO** valida se uma mensagem foi realmente enviada. Ela apenas atualiza o campo na planilha.

Use com responsabilidade:
- ✅ Para registrar envios de sistemas externos
- ✅ Para correção de dados
- ✅ Para testes
- ❌ Não use para falsificar envio de mensagens
- ❌ Não use para burlar validações de fluxo

## Testando a Função

Execute este teste completo:

```javascript
function testeCompletoUpdateMessageStatus() {
  // Teste 1: Atualizar email
  Logger.log('=== TESTE 1: Email ===');
  let result = updateMessageStatus({
    registrationNumber: '12345678900',
    messageType: 'email'
  });
  Logger.log(result);

  // Teste 2: Atualizar SMS
  Logger.log('=== TESTE 2: SMS ===');
  result = updateMessageStatus({
    registrationNumber: '12345678900',
    messageType: 'sms'
  });
  Logger.log(result);

  // Teste 3: Erro - tipo inválido
  Logger.log('=== TESTE 3: Tipo Inválido ===');
  try {
    result = updateMessageStatus({
      registrationNumber: '12345678900',
      messageType: 'whatsapp'  // inválido
    });
  } catch (e) {
    Logger.log('Erro esperado: ' + e.message);
  }

  // Teste 4: Erro - candidato inexistente
  Logger.log('=== TESTE 4: Candidato Inexistente ===');
  try {
    result = updateMessageStatus({
      registrationNumber: '99999999999',
      messageType: 'email'
    });
  } catch (e) {
    Logger.log('Erro esperado: ' + e.message);
  }
}
```

## Conclusão

A função `updateMessageStatus` oferece flexibilidade para atualizar status de mensagens manualmente quando necessário, mantendo a integridade dos dados do sistema e permitindo integração com sistemas externos de envio de mensagens.
