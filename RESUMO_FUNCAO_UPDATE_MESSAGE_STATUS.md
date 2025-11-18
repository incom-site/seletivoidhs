# Resumo: Função updateMessageStatus Adicionada

## ✅ O Que Foi Adicionado

Foi criada uma nova função pública `updateMessageStatus` que permite atualizar manualmente o status de mensagem enviada (EMAIL_SENT ou SMS_SENT) na planilha CANDIDATOS.

## 📍 Arquivos Modificados

### 1. Google Apps Script (`google-apps-script-final-corrigido.js`)

#### Roteador (linha ~162)
```javascript
const actions = {
  // ... outras ações
  'sendMessages': () => sendMessages(params),
  'updateMessageStatus': () => updateMessageStatus(params),  // <-- NOVO
  'moveToInterview': () => moveToInterview(params),
  // ... outras ações
};
```

#### Nova Função (linha ~867)
```javascript
function updateMessageStatus(params) {
  try {
    Logger.log('📝 updateMessageStatus iniciado');

    const registrationNumber = params.registrationNumber;
    const messageType = params.messageType;

    // Validações
    if (!registrationNumber) {
      throw new Error('Número de inscrição é obrigatório');
    }

    if (!messageType || (messageType !== 'email' && messageType !== 'sms')) {
      throw new Error('Tipo de mensagem inválido. Use "email" ou "sms"');
    }

    // Busca planilha e colunas
    const sh = _sheet(SHEET_CANDIDATOS);
    const headers = _getHeaders_(sh);
    const col = _colMap_(headers);

    // Determina coluna alvo
    let targetCol;
    if (messageType === 'email') {
      targetCol = col['EMAIL_SENT'];
    } else if (messageType === 'sms') {
      targetCol = col['SMS_SENT'];
    }

    // Valida se coluna existe
    if (targetCol === undefined || targetCol < 0) {
      const colName = messageType === 'email' ? 'EMAIL_SENT' : 'SMS_SENT';
      throw new Error('Coluna ' + colName + ' não encontrada.');
    }

    // Busca candidato
    const idx = _getIndex_(sh, headers);
    const searchKey = String(registrationNumber).trim();
    let row = idx[searchKey];

    if (!row) {
      // Tenta rebuildar índice
      const newIdx = _buildIndex_(sh, headers);
      row = newIdx[searchKey];
    }

    if (!row) {
      throw new Error('Candidato não encontrado: ' + registrationNumber);
    }

    // Atualiza valor
    sh.getRange(row, targetCol + 1).setValue('Sim');
    _bumpRev_();

    Logger.log('✅ Status atualizado: ' + registrationNumber + ' - ' + messageType);

    return {
      success: true,
      message: 'Status de mensagem atualizado com sucesso',
      registrationNumber: registrationNumber,
      messageType: messageType,
      status: 'Sim'
    };

  } catch (error) {
    Logger.log('❌ Erro em updateMessageStatus: ' + error.toString());
    throw error;
  }
}
```

### 2. Frontend Service (`src/services/googleSheets.ts`)

#### Nova Função (linha ~258)
```typescript
async updateMessageStatus(
  registrationNumber: string,
  messageType: 'email' | 'sms'
): Promise<GoogleSheetsResponse> {
  try {
    const params = new URLSearchParams({
      action: 'updateMessageStatus',
      registrationNumber,
      messageType
    });

    const response = await fetch(`${SCRIPT_URL}?${params.toString()}`, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao atualizar status de mensagem:', error);
    return { success: false, error: 'Erro ao atualizar status de mensagem' };
  }
}
```

## 🎯 Como Usar

### Exemplo 1: Atualizar Status de Email

```typescript
import { googleSheetsService } from '../services/googleSheets';

const result = await googleSheetsService.updateMessageStatus(
  '12345678900',  // CPF do candidato
  'email'
);

if (result.success) {
  console.log('Email marcado como enviado!');
}
```

### Exemplo 2: Atualizar Status de SMS

```typescript
const result = await googleSheetsService.updateMessageStatus(
  '12345678900',  // CPF do candidato
  'sms'
);

if (result.success) {
  console.log('SMS marcado como enviado!');
}
```

### Exemplo 3: Atualizar Múltiplos Candidatos

```typescript
const candidatos = ['12345678900', '98765432100', '11122233344'];

for (const cpf of candidatos) {
  await googleSheetsService.updateMessageStatus(cpf, 'email');
}
```

## 🔄 Diferença das Funções

### `_updateMessageStatusInCandidates_` (Interna)
- Função privada
- Chamada automaticamente por `sendMessages`
- Não valida parâmetros
- Não lança exceções
- Apenas loga erros

### `updateMessageStatus` (Pública - NOVA)
- Função pública
- Chamada manualmente pelo frontend
- Valida todos os parâmetros
- Lança exceções em caso de erro
- Retorna objeto com sucesso/erro
- Invalida cache após atualização

## 📋 Parâmetros

| Parâmetro | Tipo | Obrigatório | Valores Aceitos |
|-----------|------|-------------|-----------------|
| `registrationNumber` | string | ✅ Sim | CPF ou Número de Inscrição |
| `messageType` | string | ✅ Sim | `"email"` ou `"sms"` |

## ✅ Retorno de Sucesso

```json
{
  "success": true,
  "message": "Status de mensagem atualizado com sucesso",
  "registrationNumber": "12345678900",
  "messageType": "email",
  "status": "Sim"
}
```

## ❌ Possíveis Erros

| Erro | Causa | Solução |
|------|-------|---------|
| "Número de inscrição é obrigatório" | Parâmetro vazio | Forneça o CPF/Número |
| "Tipo de mensagem inválido" | messageType diferente de "email" ou "sms" | Use apenas "email" ou "sms" |
| "Coluna EMAIL_SENT não encontrada" | Coluna não existe na planilha | Execute `addStatusColumnIfNotExists` |
| "Candidato não encontrado" | CPF não existe na planilha | Verifique o CPF correto |

## 🚀 Implantação

### Passo 1: Atualizar Google Apps Script
1. Copie o código completo de `google-apps-script-final-corrigido.js`
2. Cole no Google Apps Script
3. Salve (Ctrl+S)
4. Implante nova versão

### Passo 2: Verificar Colunas
Execute `addStatusColumnIfNotExists` no Apps Script para garantir que as colunas existem.

### Passo 3: Testar
No Console do Apps Script:
```javascript
function teste() {
  const result = updateMessageStatus({
    registrationNumber: 'SEU_CPF_DE_TESTE',
    messageType: 'email'
  });
  Logger.log(result);
}
```

### Passo 4: Deploy Frontend
O frontend já está atualizado. Faça o deploy:
```bash
npm run build
```

## 🎯 Casos de Uso

### ✅ Quando Usar

1. **Integração com sistema externo de envio**
   - Você usa outro sistema para enviar emails/SMS
   - Precisa registrar na planilha do sistema

2. **Correção manual de dados**
   - Um envio falhou mas foi feito manualmente
   - Precisa corrigir status incorreto

3. **Testes de fluxo**
   - Quer testar "Mover para Entrevista" sem enviar mensagem
   - Precisa simular candidatos com mensagens enviadas

### ❌ Quando NÃO Usar

1. **Dentro do fluxo normal de envio**
   - `sendMessages` já atualiza automaticamente
   - Não precisa chamar manualmente

2. **Para falsificar envios**
   - Não use para burlar validações
   - Mantenha integridade dos dados

## 🔍 Logs Esperados

### Sucesso
```
📝 updateMessageStatus iniciado
✅ Status atualizado: 12345678900 - email
```

### Erro
```
📝 updateMessageStatus iniciado
❌ Erro em updateMessageStatus: Candidato não encontrado: 99999999999
```

## 📚 Documentação Completa

Para mais detalhes, consulte: `FUNCAO_UPDATE_MESSAGE_STATUS.md`

## ✨ Benefícios

1. ✅ **Flexibilidade**: Atualizar status manualmente quando necessário
2. ✅ **Integração**: Conectar com sistemas externos de envio
3. ✅ **Testes**: Facilita testes do fluxo completo
4. ✅ **Correção**: Permite corrigir dados rapidamente
5. ✅ **Auditoria**: Logs detalhados de todas as operações
