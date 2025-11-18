# 🔧 CORREÇÕES REALIZADAS - SCRIPT E COMPONENTES

**Data:** 2025-11-15
**Objetivo:** Garantir compatibilidade total entre Google Apps Script e componentes React

---

## ✅ CORREÇÕES NO GOOGLE APPS SCRIPT

### 1. **Função `saveInterviewEvaluation()`**
**Problema:** Componente enviava `registrationNumber`, mas script esperava `candidateId`

**Solução:**
```javascript
// ANTES
const key = String(params.candidateId).trim();

// DEPOIS
const key = String(params.candidateId || params.registrationNumber || '').trim();
```

**Compatibilidade com campos:**
- `interview_result` ← `params.interview_result || params.resultado`
- `interview_notes` ← `params.interview_notes || params.impressao_perfil`

---

### 2. **Função `sendMessages()`**
**Problema:** Componente enviava IDs diferentes (CPF, id, registration_number), mas script só procurava por CPF

**Solução:**
```javascript
// Busca por CPF e NUMEROINSCRICAO
const cpf = String(values[i][cpfCol] || '').trim();
const regNum = String(values[i][regNumCol] || '').trim();
const candidateId = cpf || regNum;

// Verifica todos os identificadores possíveis
if (!targetIds.includes(candidateId) && !targetIds.includes(cpf) && !targetIds.includes(regNum)) continue;
```

**Suporte ao alias de email:**
```javascript
result = _sendEmailGmail_(recipient, subj, body, params.fromAlias);
```

---

### 3. **Função `updateMessageStatus()`**
**Problema:** Componente enviava array de IDs, mas script só aceitava um único ID

**Solução:**
```javascript
// Aceita array ou string separada por vírgulas
const keys = params.registrationNumbers
  ? (Array.isArray(params.registrationNumbers)
      ? params.registrationNumbers
      : String(params.registrationNumbers).split(',').map(s => s.trim()).filter(Boolean))
  : [String(params.registrationNumber || '').trim()];

// Atualiza múltiplos candidatos
let updated = 0;
for (const key of keys) {
  // ... código de atualização
  updated++;
}

return { success: true, updated };
```

---

### 4. **Função `addStatusColumnIfNotExists()`**
**Problema:** Faltavam colunas obrigatórias na planilha

**Colunas adicionadas:**
```javascript
const required = [
  // Colunas existentes
  'Status','Motivo Desclassificação','Observações','Data Triagem','Analista',
  'NUMEROINSCRICAO','EMAIL_SENT','SMS_SENT',

  // Entrevista
  'status_entrevista','entrevistador','entrevistador_at','entrevistador_by',
  'interview_score','interview_result','interview_notes','interview_completed_at',

  // Avaliação de entrevista (12 campos)
  'formacao_adequada','graduacoes_competencias',
  'descricao_processos','terminologia_tecnica','calma_clareza',
  'escalas_flexiveis','adaptabilidade_mudancas','ajustes_emergencia',
  'residencia','resolucao_conflitos','colaboracao_equipe','adaptacao_perfis',

  // Controle de alocação
  'assigned_to','assigned_at','assigned_by',

  // Campos adicionais
  'DataCadastro','updated_at','Telefone','Email',
  'documento_1','documento_2','documento_3','documento_4','documento_5',
  'capacidade_tecnica','conforme','nao_conforme','nao_se_aplica',
  'experiencia','total_score','analystEmail','notes','screenedAt'
];
```

---

## ✅ CORREÇÕES NOS COMPONENTES REACT

### 1. **InterviewEvaluationForm.tsx**
**Problema:** Faltavam campos duplicados para compatibilidade

**Solução:**
```typescript
const evaluation: any = {
  // Identificadores (envia todos)
  registrationNumber: candidate.registration_number || candidate.CPF || candidate.id,
  candidateId: candidate.CPF || candidate.registration_number || candidate.id,

  // Campos duplicados para compatibilidade
  interview_notes: impressao_perfil,
  impressao_perfil: impressao_perfil,  // ← Campo duplicado

  interview_result: resultado,
  resultado: resultado,  // ← Campo duplicado

  // Demais campos...
};
```

---

### 2. **MessagingModal.tsx**
**Já estava correto**, mas validações melhoradas:
- ✅ Envia `fromAlias` para emails
- ✅ Coleta múltiplos identificadores (CPF, registration_number, id)
- ✅ Atualiza status usando array de IDs

---

### 3. **DisqualificationModal.tsx**
**Já estava correto**, usa:
- ✅ `googleSheetsService.getDisqualificationReasons()`
- ✅ Retorna `reasonId` e `notes`

---

### 4. **AnalystDashboard.tsx**
**Já estava correto**, usa:
- ✅ `googleSheetsService.updateCandidateStatus()`
- ✅ Envia `reasonId`, `notes`, `analystEmail`

---

### 5. **CandidateList.tsx e CandidateDetailView.tsx**
**Já estavam corretos**, usam as colunas originais do Google Sheets:
- ✅ `NOMECOMPLETO`, `NOMESOCIAL`
- ✅ `CPF`, `NUMEROINSCRICAO`
- ✅ `AREAATUACAO`, `CARGOPRETENDIDO`
- ✅ `VAGAPCD`, `LAUDOMEDICO`
- ✅ `CURRICULOVITAE`, `DOCUMENTOSPESSOAIS`, etc.

---

## 📊 MAPEAMENTO COMPLETO: COMPONENTES ↔ SCRIPT

### **Dados Básicos**
| Componente | Google Sheets | Script (normalizado) |
|-----------|---------------|---------------------|
| NOMECOMPLETO | NOMECOMPLETO | nomecompleto |
| NOMESOCIAL | NOMESOCIAL | nomesocial |
| CPF | CPF | cpf (ID primário) |
| NUMEROINSCRICAO | NUMEROINSCRICAO | numerodeinscricao (ID alternativo) |
| AREAATUACAO | AREAATUACAO | areaatuacao |
| CARGOPRETENDIDO | CARGOPRETENDIDO | cargopretendido |
| Email | Email | email |
| Telefone | Telefone | telefone |

### **Status e Triagem**
| Componente | Google Sheets | Função Script |
|-----------|---------------|---------------|
| Status | Status | updateCandidateStatus() |
| assigned_to / Analista | assigned_to / Analista | assignCandidates() |
| Data Triagem | Data Triagem | updateCandidateStatus() |
| Motivo Desclassificação | Motivo Desclassificação | getDisqualificationReasonById() |
| Observações | Observações | updateCandidateStatus() |

### **Mensagens**
| Componente | Google Sheets | Função Script |
|-----------|---------------|---------------|
| EMAIL_SENT | EMAIL_SENT | updateMessageStatus() |
| SMS_SENT | SMS_SENT | updateMessageStatus() |

### **Entrevista - Status**
| Componente | Google Sheets | Função Script |
|-----------|---------------|---------------|
| status_entrevista | status_entrevista | updateInterviewStatus(), moveToInterview() |
| entrevistador | entrevistador | allocateToInterviewer() |
| entrevistador_at | entrevistador_at | allocateToInterviewer() |

### **Entrevista - Avaliação (12 campos)**
| Seção | Campos | Peso | Função Script |
|-------|--------|------|---------------|
| **1. Formação (20 pontos)** | formacao_adequada, graduacoes_competencias | x2 | saveInterviewEvaluation() |
| **2. Comunicação (30 pontos)** | descricao_processos, terminologia_tecnica, calma_clareza | x2 | saveInterviewEvaluation() |
| **3. Disponibilidade (30 pontos)** | escalas_flexiveis, adaptabilidade_mudancas, ajustes_emergencia | x1 | saveInterviewEvaluation() |
| **4. Residência (10 pontos)** | residencia | direto | saveInterviewEvaluation() |
| **5. Relacionamento (30 pontos)** | resolucao_conflitos, colaboracao_equipe, adaptacao_perfis | x2 | saveInterviewEvaluation() |

**Total:** 120 pontos máximo

### **Entrevista - Resultado**
| Componente | Google Sheets | Função Script |
|-----------|---------------|---------------|
| interview_score | interview_score | saveInterviewEvaluation() |
| interview_result | interview_result | saveInterviewEvaluation() |
| interview_notes | interview_notes | saveInterviewEvaluation() |
| interview_completed_at | interview_completed_at | saveInterviewEvaluation() |

---

## 🧪 TESTES RECOMENDADOS

### 1. **Testar Salvamento de Avaliação de Entrevista**
- [ ] Preencher formulário completo
- [ ] Verificar se todos os 12 campos são salvos
- [ ] Verificar cálculo do score (máx 120)
- [ ] Verificar se `interview_result` é salvo corretamente

### 2. **Testar Envio de Mensagens**
- [ ] Enviar email para múltiplos candidatos
- [ ] Verificar se `EMAIL_SENT` é marcado como "Sim"
- [ ] Enviar SMS para múltiplos candidatos
- [ ] Verificar se `SMS_SENT` é marcado como "Sim"
- [ ] Testar com alias de email diferente

### 3. **Testar Alocação de Candidatos**
- [ ] Alocar candidatos para analista
- [ ] Verificar se `assigned_to` é preenchido
- [ ] Verificar se `assigned_at` tem timestamp
- [ ] Verificar se `Status` muda para "em_analise"

### 4. **Testar Classificação/Desclassificação**
- [ ] Classificar candidato
- [ ] Verificar se `Status` = "Classificado"
- [ ] Desclassificar candidato
- [ ] Verificar se `Motivo Desclassificação` é preenchido
- [ ] Verificar se `Observações` são salvas

---

## 🚀 PRÓXIMOS PASSOS

1. **Fazer deploy do script atualizado** no Google Apps Script
2. **Executar `setupAllSheets()`** para criar colunas faltantes
3. **Testar todos os fluxos** listados acima
4. **Monitorar logs** do Google Apps Script e do navegador
5. **Documentar qualquer erro** encontrado

---

## 📝 NOTAS IMPORTANTES

### Normalização de Cabeçalhos
O script normaliza TODOS os cabeçalhos para busca case-insensitive:
```javascript
function _normalizeHeader(h) {
  return String(h)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // Remove acentos
    .replace(/[^a-z0-9]/g, '')        // Remove espaços e _
    .trim();
}
```

**Exemplos:**
- `Motivo Desclassificação` → `motivodesclassificacao`
- `status_entrevista` → `statusentrevista`
- `EMAIL_SENT` → `emailsent`

### Índice e Cache
O script usa cache para melhorar performance:
- **TTL:** 1200 segundos (20 minutos)
- **Invalidação:** Chamada automática de `_bumpRev_()` após cada alteração
- **Reconstrução:** Automática se candidato não for encontrado

### Identificadores Primários
O script aceita DOIS identificadores para busca:
1. **CPF** (primário)
2. **NUMEROINSCRICAO** (alternativo)

Todos os métodos que buscam candidatos procuram por ambos.

---

## ✅ CHECKLIST DE COMPATIBILIDADE

- [x] Função `saveInterviewEvaluation` aceita `registrationNumber` e `candidateId`
- [x] Função `sendMessages` aceita múltiplos identificadores (CPF, NUMEROINSCRICAO)
- [x] Função `updateMessageStatus` aceita array de IDs
- [x] Todas as colunas obrigatórias estão no `addStatusColumnIfNotExists`
- [x] Componente `InterviewEvaluationForm` envia campos duplicados
- [x] Componente `MessagingModal` envia `fromAlias` para emails
- [x] Todos os componentes usam nomes corretos das colunas

---

**FIM DO DOCUMENTO**
