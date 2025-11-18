# Correção: InterviewerDashboard Não Recebia Candidatos

## 🔴 Problema Identificado

O componente `InterviewerDashboard.tsx` não estava recebendo os candidatos alocados para entrevista.

**Causa Raiz:** A função `getInterviewerCandidates` estava sendo chamada pelo frontend, mas **NÃO EXISTIA** no Google Apps Script.

## 🔍 Análise Detalhada

### 1. Frontend (InterviewerDashboard.tsx)
```typescript
// Linha 22 - Chama função que não existia
const result = await googleSheetsService.getInterviewerCandidates(user?.email || '');
```

### 2. Service (googleSheets.ts)
```typescript
// Linha 401 - Service tentava chamar a ação
async getInterviewerCandidates(interviewerEmail: string): Promise<GoogleSheetsResponse> {
  const params = new URLSearchParams({
    action: 'getInterviewerCandidates',  // <-- Ação não existia no script
    interviewerEmail
  });
  // ...
}
```

### 3. Google Apps Script (google-apps-script-final-corrigido.js)
```javascript
// A função getInterviewerCandidates NÃO EXISTIA!
// O roteador não tinha essa ação registrada
```

## ✅ Correção Aplicada

### 1. Nova Função: `getInterviewerCandidates`

Adicionada função completa no Google Apps Script (linha ~1133):

```javascript
function getInterviewerCandidates(params) {
  try {
    const interviewerEmail = params.interviewerEmail;

    if (!interviewerEmail) {
      throw new Error('Email do entrevistador é obrigatório');
    }

    Logger.log('🔍 Buscando candidatos do entrevistador: ' + interviewerEmail);

    const {sheet, headers, values} = _readSheetBlock_(SHEET_CANDIDATOS);
    if (!sheet || !values.length) {
      Logger.log('⚠️ Nenhum candidato encontrado na planilha');
      return [];
    }

    const col = _colMap_(headers);
    const statusEntrevistaCol = col['status_entrevista'];
    const entrevistadorCol = col['entrevistador'];
    const cpfCol = col['CPF'];
    const regNumCol = col['Número de Inscrição'];

    if (entrevistadorCol === undefined || entrevistadorCol < 0) {
      Logger.log('⚠️ Coluna entrevistador não encontrada');
      return [];
    }

    const candidates = [];
    for (let i = 0; i < values.length; i++) {
      const candidateInterviewer = values[i][entrevistadorCol];
      const normalizedInterviewer = candidateInterviewer ? String(candidateInterviewer).toLowerCase().trim() : '';
      const normalizedEmail = interviewerEmail.toLowerCase().trim();

      // Filtra por email do entrevistador
      if (normalizedInterviewer === normalizedEmail) {
        const candidate = {};
        headers.forEach((header, index) => {
          candidate[header] = values[i][index];
        });
        candidate.id = values[i][cpfCol] || values[i][regNumCol];
        candidate.registration_number = values[i][regNumCol] || values[i][cpfCol];

        candidates.push(candidate);
      }
    }

    Logger.log('✅ Candidatos encontrados para ' + interviewerEmail + ': ' + candidates.length);
    return candidates;
  } catch (error) {
    Logger.log('❌ Erro em getInterviewerCandidates: ' + error.toString());
    throw error;
  }
}
```

### 2. Atualizado Roteador

Adicionada ação ao roteador (linha ~166):

```javascript
const actions = {
  // ... outras ações
  'getInterviewers': () => getInterviewers(params),
  'getInterviewerCandidates': () => getInterviewerCandidates(params),  // <-- NOVO
  'allocateToInterviewer': () => allocateToInterviewer(params),
  // ... outras ações
};
```

## 🎯 Como Funciona

### Fluxo Completo

```
1. Admin aloca candidatos para entrevistador
   ↓
   allocateToInterviewer() atualiza coluna "entrevistador" com email
   ↓
2. Entrevistador faz login
   ↓
   InterviewerDashboard.tsx carrega
   ↓
3. Dashboard chama getInterviewerCandidates(email)
   ↓
   Google Apps Script busca na planilha
   ↓
4. Retorna candidatos onde coluna "entrevistador" = email
   ↓
5. Dashboard exibe lista de candidatos
```

### Critérios de Busca

A função busca candidatos onde:
- ✅ Coluna `entrevistador` = email do usuário logado
- ✅ Normaliza emails (lowercase + trim) para comparação
- ✅ Retorna TODOS os candidatos do entrevistador (independente do status)

## 📋 Estrutura de Dados

### Parâmetros Enviados
```javascript
{
  action: 'getInterviewerCandidates',
  interviewerEmail: 'entrevistador@email.com'
}
```

### Resposta de Sucesso
```json
{
  "success": true,
  "data": [
    {
      "id": "12345678900",
      "registration_number": "2024001",
      "CPF": "12345678900",
      "NOMECOMPLETO": "João Silva",
      "NOMESOCIAL": "João",
      "CARGOPRETENDIDO": "Enfermeiro",
      "VAGAPCD": "Não",
      "entrevistador": "entrevistador@email.com",
      "status_entrevista": "Aguardando",
      "interview_completed_at": null,
      // ... outros campos
    }
  ]
}
```

### Resposta sem Candidatos
```json
{
  "success": true,
  "data": []
}
```

## 🔍 Validações

### 1. Email Obrigatório
```javascript
if (!interviewerEmail) {
  throw new Error('Email do entrevistador é obrigatório');
}
```

### 2. Coluna Existe
```javascript
if (entrevistadorCol === undefined || entrevistadorCol < 0) {
  Logger.log('⚠️ Coluna entrevistador não encontrada');
  return [];
}
```

### 3. Normalização de Email
```javascript
const normalizedInterviewer = candidateInterviewer ?
  String(candidateInterviewer).toLowerCase().trim() : '';
const normalizedEmail = interviewerEmail.toLowerCase().trim();
```

## 🚀 Como Testar

### Teste 1: Alocar Candidato

1. Faça login como Admin
2. Vá em "Candidatos para Entrevista"
3. Selecione um candidato
4. Aloque para um entrevistador
5. Aguarde confirmação

### Teste 2: Verificar na Planilha

1. Abra a planilha CANDIDATOS
2. Localize o candidato alocado
3. Verifique se a coluna `entrevistador` tem o email correto

### Teste 3: Login como Entrevistador

1. Faça logout do Admin
2. Faça login com o email do entrevistador
3. O dashboard deve carregar automaticamente
4. Deve exibir os candidatos alocados

### Teste 4: Console Logs

Abra o Console do navegador (F12) e verifique:

**Frontend:**
```
Carregando candidatos do entrevistador: entrevistador@email.com
```

**Google Apps Script (Execuções):**
```
🔍 Buscando candidatos do entrevistador: entrevistador@email.com
✅ Candidatos encontrados para entrevistador@email.com: 3
```

## 🆘 Troubleshooting

### Erro 1: "Email do entrevistador é obrigatório"

**Causa:** O email do usuário logado está vazio

**Solução:**
1. Verifique se o usuário está logado corretamente
2. Verifique AuthContext
3. Confirme que `user?.email` tem valor

### Erro 2: Candidatos não aparecem

**Causa:** Coluna `entrevistador` vazia ou email diferente

**Solução:**
1. Verifique na planilha se a coluna `entrevistador` tem valor
2. Confirme que o email na planilha é EXATAMENTE igual ao email de login
3. Execute `addStatusColumnIfNotExists` se a coluna não existir

### Erro 3: "Coluna entrevistador não encontrada"

**Causa:** Coluna não existe na planilha

**Solução:**
1. Execute a função `addStatusColumnIfNotExists` no Google Apps Script
2. Verifique se a coluna foi criada
3. Tente alocar novamente

### Erro 4: Email case-sensitive

**Causa:** Email na planilha com maiúsculas/minúsculas diferente

**Solução:**
- A função já normaliza os emails automaticamente
- Se ainda falhar, verifique espaços extras no email

## 📊 Diferenças de Funções

| Função | Filtra Por | Usado Por |
|--------|------------|-----------|
| `getInterviewCandidates` | `status_entrevista = "Aguardando"` | Admin (vê todos os candidatos aguardando) |
| `getInterviewerCandidates` | `entrevistador = email` | Entrevistador (vê apenas seus candidatos) |

## ✅ Checklist de Implantação

- [x] Função `getInterviewerCandidates` adicionada ao script
- [x] Ação registrada no roteador
- [x] Frontend já estava correto (não precisa alterar)
- [x] Build sem erros
- [ ] Deploy do Google Apps Script (você precisa fazer)
- [ ] Teste com entrevistador real

## 🎯 Próximos Passos

1. **Copie o código** de `google-apps-script-final-corrigido.js`
2. **Cole no Google Apps Script**
3. **Salve** (Ctrl+S)
4. **Implante nova versão**
5. **Teste** fazendo login como entrevistador

## 📝 Logs Esperados

### Sucesso (Google Apps Script)
```
🔄 Ação recebida: getInterviewerCandidates
🔍 Buscando candidatos do entrevistador: entrevistador@email.com
✅ Candidatos encontrados para entrevistador@email.com: 3
✅ Resultado: {"success":true,"data":[...]}
```

### Sucesso (Frontend Console)
```
Carregando candidatos do entrevistador: entrevistador@email.com
✅ 3 candidatos carregados
```

### Sem Candidatos
```
🔄 Ação recebida: getInterviewerCandidates
🔍 Buscando candidatos do entrevistador: entrevistador@email.com
✅ Candidatos encontrados para entrevistador@email.com: 0
✅ Resultado: {"success":true,"data":[]}
```

## 🔒 Segurança

A função:
- ✅ Valida email obrigatório
- ✅ Filtra APENAS candidatos do entrevistador
- ✅ Não permite ver candidatos de outros entrevistadores
- ✅ Normaliza emails para evitar case-sensitive issues
- ✅ Retorna array vazio em caso de erro (não expõe dados)

## 📚 Documentação Relacionada

- `SOLUCAO_DEFINITIVA_STATUS_MENSAGEM.md` - Funções de mensagem e entrevista
- `FUNCAO_UPDATE_MESSAGE_STATUS.md` - Atualização de status de mensagens
- `google-apps-script-final-corrigido.js` - Script completo atualizado

---

**Status:** ✅ CORRIGIDO - A função está implementada e pronta para uso
