# Análise de Correlação: InterviewEvaluationForm ↔ Google Apps Script ↔ Planilha

## 🔍 Visão Geral

Este documento analisa a correlação entre o formulário de avaliação de entrevista, o Google Apps Script e as colunas da planilha.

## 📊 Colunas da Planilha (Existentes)

```
status_entrevista
entrevistador
entrevistador_at          ❌ ERRO DE NOME (deveria ser data_entrevista)
entrevistador_by          ❌ NÃO UTILIZADO
interview_score           ⚠️ PARCIALMENTE UTILIZADO
interview_result          ✅ UTILIZADO
interview_notes           ✅ UTILIZADO
interview_completed_at    ✅ UTILIZADO
formacao_adequada         ✅ UTILIZADO
graduacoes_competencias   ✅ UTILIZADO
descricao_processos       ✅ UTILIZADO
terminologia_tecnica      ✅ UTILIZADO
calma_clareza             ✅ UTILIZADO
escalas_flexiveis         ✅ UTILIZADO
adaptabilidade_mudancas   ✅ UTILIZADO
ajustes_emergencia        ✅ UTILIZADO
residencia                ✅ UTILIZADO
resolucao_conflitos       ✅ UTILIZADO
colaboracao_equipe        ✅ UTILIZADO
adaptacao_perfis          ✅ UTILIZADO
```

## 🎯 Campos do Formulário (InterviewEvaluationForm.tsx)

### Dados Enviados (linhas 69-87)

```typescript
const evaluation: InterviewEvaluation = {
  candidateId: candidate.registration_number,        // ✅ Identificador

  // Seção 1: Formação (max 20 pontos)
  formacao_adequada,                                  // ✅ 1-5 * 2
  graduacoes_competencias,                            // ✅ 1-5 * 2

  // Seção 2: Comunicação (max 30 pontos)
  descricao_processos,                                // ✅ 1-5 * 2
  terminologia_tecnica,                               // ✅ 1-5 * 2
  calma_clareza,                                      // ✅ 1-5 * 2

  // Seção 3: Disponibilidade (max 30 pontos)
  escalas_flexiveis,                                  // ✅ 0/5/10
  adaptabilidade_mudancas,                            // ✅ 0/5/10
  ajustes_emergencia,                                 // ✅ 0/5/10

  // Seção 4: Residência (max 10 pontos)
  residencia,                                         // ✅ 2/4/6/8/10

  // Seção 5: Relacionamento (max 30 pontos)
  resolucao_conflitos,                                // ✅ 1-5 * 2
  colaboracao_equipe,                                 // ✅ 1-5 * 2
  adaptacao_perfis,                                   // ✅ 1-5 * 2

  // Impressão e resultado
  impressao_perfil,                                   // ✅ Texto livre
  resultado,                                          // ✅ Classificado/Desclassificado

  // Metadata
  interviewerEmail: user?.email || '',                // ✅ Email do entrevistador
  completed_at: new Date().toISOString()              // ✅ Data/hora conclusão
};
```

### Cálculo de Pontuação (linhas 40-55)

```typescript
const calculateTotal = () => {
  const secao1 = (formacao_adequada + graduacoes_competencias) * 2;        // Max: 20
  const secao2 = (descricao_processos + terminologia_tecnica + calma_clareza) * 2;  // Max: 30
  const secao3 = escalas_flexiveis + adaptabilidade_mudancas + ajustes_emergencia;  // Max: 30
  const secao4 = residencia;                                               // Max: 10
  const secao5 = (resolucao_conflitos + colaboracao_equipe + adaptacao_perfis) * 2; // Max: 30

  return {
    secao1, secao2, secao3, secao4, secao5,
    total: secao1 + secao2 + secao3 + secao4 + secao5  // Max: 120
  };
};
```

## ⚙️ Google Apps Script (saveInterviewEvaluation)

### Implementação Atual (linhas 1295-1338)

```javascript
function saveInterviewEvaluation(params) {
  try {
    const sh = _sheet(SHEET_CANDIDATOS);
    const headers = _getHeaders_(sh);
    const col = _colMap_(headers);

    // ❌ PROBLEMA: Busca apenas 5 colunas
    const statusEntrevistaCol = col['status_entrevista'];
    const notaFinalCol = col['nota_final'];                    // ❌ DEVERIA SER interview_score
    const observacoesCol = col['observacoes_entrevista'];      // ❌ DEVERIA SER interview_notes
    const entrevistadorCol = col['entrevistador'];
    const dataEntrevistaCol = col['data_entrevista'];

    const idx = _getIndex_(sh, headers);
    const searchKey = String(params.registrationNumber).trim();
    let row = idx[searchKey];

    if (!row) {
      const newIdx = _buildIndex_(sh, headers);
      row = newIdx[searchKey];
    }

    if (!row) throw new Error('Candidato não encontrado');

    const lastCol = sh.getLastColumn();
    const rowVals = sh.getRange(row, 1, 1, lastCol).getValues()[0];

    // ❌ PROBLEMA: Salva apenas 5 campos
    if (statusEntrevistaCol >= 0) rowVals[statusEntrevistaCol] = 'Avaliado';
    if (notaFinalCol >= 0) rowVals[notaFinalCol] = params.finalScore || '';
    if (observacoesCol >= 0) rowVals[observacoesCol] = params.observations || '';
    if (entrevistadorCol >= 0) rowVals[entrevistadorCol] = params.interviewerEmail || '';
    if (dataEntrevistaCol >= 0) rowVals[dataEntrevistaCol] = getCurrentTimestamp();

    _writeWholeRow_(sh, row, rowVals);
    _bumpRev_();

    Logger.log('✅ Avaliação de entrevista salva');
    return { success: true, message: 'Avaliação salva' };
  } catch (error) {
    Logger.log('❌ Erro em saveInterviewEvaluation: ' + error.toString());
    throw error;
  }
}
```

## 🔴 Problemas Identificados

### 1. **Mapeamento de Parâmetros Incorreto**

O frontend envia:
```typescript
{
  candidateId: '12345678900',
  formacao_adequada: 4,
  graduacoes_competencias: 5,
  // ... outros 11 campos
  impressao_perfil: 'Ótimo candidato',
  resultado: 'Classificado',
  interviewerEmail: 'entrevistador@email.com',
  completed_at: '2024-01-15T10:30:00.000Z'
}
```

Mas o script espera:
```javascript
params.registrationNumber  // ❌ NÃO ENVIADO (frontend envia candidateId)
params.finalScore          // ❌ NÃO ENVIADO
params.observations        // ❌ NÃO ENVIADO
```

### 2. **Campos Individuais Não Salvos**

O script **NÃO** salva os 13 campos de avaliação individuais:
- ❌ formacao_adequada
- ❌ graduacoes_competencias
- ❌ descricao_processos
- ❌ terminologia_tecnica
- ❌ calma_clareza
- ❌ escalas_flexiveis
- ❌ adaptabilidade_mudancas
- ❌ ajustes_emergencia
- ❌ residencia
- ❌ resolucao_conflitos
- ❌ colaboracao_equipe
- ❌ adaptacao_perfis
- ❌ impressao_perfil (só salva em observations)

### 3. **Campos da Planilha Não Correspondentes**

Planilha tem: `nota_final`, `observacoes_entrevista`
Script busca: `nota_final`, `observacoes_entrevista` ✅

Mas deveria buscar: `interview_score`, `interview_notes`

### 4. **Nome de Coluna Incorreto**

Planilha tem: `entrevistador_at` ❌
Deveria ser: `data_entrevista` ou `interview_date`

### 5. **Coluna Não Utilizada**

Planilha tem: `entrevistador_by` ❌
Não é usado em lugar nenhum

## ✅ Correção Completa

### Passo 1: Corrigir `saveInterviewEvaluation` no Google Apps Script

```javascript
function saveInterviewEvaluation(params) {
  try {
    const sh = _sheet(SHEET_CANDIDATOS);
    const headers = _getHeaders_(sh);
    const col = _colMap_(headers);

    // Identificação
    const cpfCol = col['CPF'];
    const regNumCol = col['Número de Inscrição'];

    // Status e metadata
    const statusEntrevistaCol = col['status_entrevista'];
    const entrevistadorCol = col['entrevistador'];
    const dataEntrevistaCol = col['data_entrevista'];
    const completedAtCol = col['interview_completed_at'];

    // Resultado e notas
    const scoreCol = col['interview_score'];
    const resultCol = col['interview_result'];
    const notesCol = col['interview_notes'];

    // Seção 1: Formação
    const formacaoCol = col['formacao_adequada'];
    const graduacoesCol = col['graduacoes_competencias'];

    // Seção 2: Comunicação
    const descricaoCol = col['descricao_processos'];
    const terminologiaCol = col['terminologia_tecnica'];
    const calmaCol = col['calma_clareza'];

    // Seção 3: Disponibilidade
    const escalasCol = col['escalas_flexiveis'];
    const adaptabilidadeCol = col['adaptabilidade_mudancas'];
    const ajustesCol = col['ajustes_emergencia'];

    // Seção 4: Residência
    const residenciaCol = col['residencia'];

    // Seção 5: Relacionamento
    const conflitosCol = col['resolucao_conflitos'];
    const colaboracaoCol = col['colaboracao_equipe'];
    const adaptacaoPerfisCol = col['adaptacao_perfis'];

    // Buscar candidato
    const idx = _getIndex_(sh, headers);
    const searchKey = String(params.candidateId).trim();  // ✅ CORRIGIDO: candidateId
    let row = idx[searchKey];

    if (!row) {
      const newIdx = _buildIndex_(sh, headers);
      const rev = _getRev_();
      CacheService.getDocumentCache().put(`${IDX_CACHE_KEY}${rev}`, JSON.stringify(newIdx), CACHE_TTL_SEC);
      row = newIdx[searchKey];
    }

    if (!row) {
      Logger.log('❌ Candidato não encontrado: ' + searchKey);
      throw new Error('Candidato não encontrado: ' + searchKey);
    }

    Logger.log('📝 Salvando avaliação do candidato na linha: ' + row);

    const lastCol = sh.getLastColumn();
    const rowVals = sh.getRange(row, 1, 1, lastCol).getValues()[0];

    // Calcular pontuação total
    const secao1 = (Number(params.formacao_adequada) + Number(params.graduacoes_competencias)) * 2;
    const secao2 = (Number(params.descricao_processos) + Number(params.terminologia_tecnica) + Number(params.calma_clareza)) * 2;
    const secao3 = Number(params.escalas_flexiveis) + Number(params.adaptabilidade_mudancas) + Number(params.ajustes_emergencia);
    const secao4 = Number(params.residencia);
    const secao5 = (Number(params.resolucao_conflitos) + Number(params.colaboracao_equipe) + Number(params.adaptacao_perfis)) * 2;
    const totalScore = secao1 + secao2 + secao3 + secao4 + secao5;

    Logger.log('📊 Pontuação calculada: ' + totalScore + '/120');

    // Atualizar status e metadata
    if (statusEntrevistaCol >= 0) rowVals[statusEntrevistaCol] = 'Avaliado';
    if (entrevistadorCol >= 0) rowVals[entrevistadorCol] = params.interviewerEmail || '';
    if (dataEntrevistaCol >= 0) rowVals[dataEntrevistaCol] = getCurrentTimestamp();
    if (completedAtCol >= 0) rowVals[completedAtCol] = params.completed_at || getCurrentTimestamp();

    // Salvar resultado e pontuação
    if (scoreCol >= 0) rowVals[scoreCol] = totalScore;
    if (resultCol >= 0) rowVals[resultCol] = params.resultado || '';
    if (notesCol >= 0) rowVals[notesCol] = params.impressao_perfil || '';

    // Seção 1: Formação
    if (formacaoCol >= 0) rowVals[formacaoCol] = params.formacao_adequada || '';
    if (graduacoesCol >= 0) rowVals[graduacoesCol] = params.graduacoes_competencias || '';

    // Seção 2: Comunicação
    if (descricaoCol >= 0) rowVals[descricaoCol] = params.descricao_processos || '';
    if (terminologiaCol >= 0) rowVals[terminologiaCol] = params.terminologia_tecnica || '';
    if (calmaCol >= 0) rowVals[calmaCol] = params.calma_clareza || '';

    // Seção 3: Disponibilidade
    if (escalasCol >= 0) rowVals[escalasCol] = params.escalas_flexiveis || '';
    if (adaptabilidadeCol >= 0) rowVals[adaptabilidadeCol] = params.adaptabilidade_mudancas || '';
    if (ajustesCol >= 0) rowVals[ajustesCol] = params.ajustes_emergencia || '';

    // Seção 4: Residência
    if (residenciaCol >= 0) rowVals[residenciaCol] = params.residencia || '';

    // Seção 5: Relacionamento
    if (conflitosCol >= 0) rowVals[conflitosCol] = params.resolucao_conflitos || '';
    if (colaboracaoCol >= 0) rowVals[colaboracaoCol] = params.colaboracao_equipe || '';
    if (adaptacaoPerfisCol >= 0) rowVals[adaptacaoPerfisCol] = params.adaptacao_perfis || '';

    _writeWholeRow_(sh, row, rowVals);
    _bumpRev_();

    Logger.log('✅ Avaliação de entrevista salva com sucesso');
    Logger.log('   - Candidato: ' + searchKey);
    Logger.log('   - Pontuação: ' + totalScore + '/120');
    Logger.log('   - Resultado: ' + params.resultado);

    return {
      success: true,
      message: 'Avaliação salva com sucesso',
      score: totalScore,
      resultado: params.resultado
    };
  } catch (error) {
    Logger.log('❌ Erro em saveInterviewEvaluation: ' + error.toString());
    Logger.log('   Stack: ' + error.stack);
    throw error;
  }
}
```

### Passo 2: Atualizar `addStatusColumnIfNotExists`

```javascript
function addStatusColumnIfNotExists() {
  const sh = _sheet(SHEET_CANDIDATOS);
  const headers = _getHeaders_(sh);

  const requiredColumns = [
    // Triagem
    'Status',
    'Motivo Desclassificação',
    'Observações',
    'Data Triagem',
    'Analista',

    // Mensagens
    'EMAIL',
    'TELEFONE',
    'EMAIL_SENT',
    'SMS_SENT',

    // Entrevista - Status
    'status_entrevista',
    'entrevistador',
    'data_entrevista',
    'interview_completed_at',

    // Entrevista - Resultado
    'interview_score',
    'interview_result',
    'interview_notes',

    // Seção 1: Formação
    'formacao_adequada',
    'graduacoes_competencias',

    // Seção 2: Comunicação
    'descricao_processos',
    'terminologia_tecnica',
    'calma_clareza',

    // Seção 3: Disponibilidade
    'escalas_flexiveis',
    'adaptabilidade_mudancas',
    'ajustes_emergencia',

    // Seção 4: Residência
    'residencia',

    // Seção 5: Relacionamento
    'resolucao_conflitos',
    'colaboracao_equipe',
    'adaptacao_perfis'
  ];

  let added = false;
  requiredColumns.forEach(colName => {
    if (headers.indexOf(colName) === -1) {
      const lastCol = sh.getLastColumn();
      sh.getRange(1, lastCol + 1).setValue(colName);
      Logger.log('➕ Coluna adicionada: ' + colName);
      added = true;
    }
  });

  if (added) {
    _bumpRev_();
    Logger.log('✅ Colunas adicionadas com sucesso');
  } else {
    Logger.log('✅ Todas as colunas já existem');
  }
}
```

## 📋 Mapeamento Final: Frontend ↔ Script ↔ Planilha

| Frontend (InterviewEvaluation) | Script (params) | Planilha (Coluna) | Tipo | Uso |
|-------------------------------|-----------------|-------------------|------|-----|
| `candidateId` | `candidateId` | `CPF` | string | 🔑 Identificação |
| `formacao_adequada` | `formacao_adequada` | `formacao_adequada` | 1-5 | ✅ Salvo |
| `graduacoes_competencias` | `graduacoes_competencias` | `graduacoes_competencias` | 1-5 | ✅ Salvo |
| `descricao_processos` | `descricao_processos` | `descricao_processos` | 1-5 | ✅ Salvo |
| `terminologia_tecnica` | `terminologia_tecnica` | `terminologia_tecnica` | 1-5 | ✅ Salvo |
| `calma_clareza` | `calma_clareza` | `calma_clareza` | 1-5 | ✅ Salvo |
| `escalas_flexiveis` | `escalas_flexiveis` | `escalas_flexiveis` | 0/5/10 | ✅ Salvo |
| `adaptabilidade_mudancas` | `adaptabilidade_mudancas` | `adaptabilidade_mudancas` | 0/5/10 | ✅ Salvo |
| `ajustes_emergencia` | `ajustes_emergencia` | `ajustes_emergencia` | 0/5/10 | ✅ Salvo |
| `residencia` | `residencia` | `residencia` | 2/4/6/8/10 | ✅ Salvo |
| `resolucao_conflitos` | `resolucao_conflitos` | `resolucao_conflitos` | 1-5 | ✅ Salvo |
| `colaboracao_equipe` | `colaboracao_equipe` | `colaboracao_equipe` | 1-5 | ✅ Salvo |
| `adaptacao_perfis` | `adaptacao_perfis` | `adaptacao_perfis` | 1-5 | ✅ Salvo |
| `impressao_perfil` | `impressao_perfil` | `interview_notes` | string | ✅ Salvo |
| `resultado` | `resultado` | `interview_result` | Classificado/Desclassificado | ✅ Salvo |
| (calculado) | (calculado) | `interview_score` | 0-120 | ✅ Calculado e salvo |
| `interviewerEmail` | `interviewerEmail` | `entrevistador` | string | ✅ Salvo |
| `completed_at` | `completed_at` | `interview_completed_at` | ISO datetime | ✅ Salvo |
| - | - | `status_entrevista` | string | ✅ Definido como 'Avaliado' |
| - | - | `data_entrevista` | timestamp | ✅ Timestamp atual |

## 🗑️ Colunas a Remover/Renomear

| Coluna Atual | Ação | Nova Coluna / Motivo |
|--------------|------|---------------------|
| `entrevistador_at` | ❌ Remover ou ✏️ Renomear | Já existe `data_entrevista` |
| `entrevistador_by` | ❌ Remover | Não é utilizada |
| `nota_final` | ✏️ Renomear | Deve ser `interview_score` |
| `observacoes_entrevista` | ✏️ Renomear | Deve ser `interview_notes` |

## 🚀 Implantação

### 1. Backup da Planilha
Faça uma cópia de segurança antes de qualquer alteração!

### 2. Atualizar Google Apps Script
1. Copie a nova função `saveInterviewEvaluation`
2. Copie a nova função `addStatusColumnIfNotExists`
3. Cole no Google Apps Script
4. Salve e implante nova versão

### 3. Criar Colunas
Execute `addStatusColumnIfNotExists` no Google Apps Script

### 4. Testar
1. Faça login como entrevistador
2. Avalie um candidato
3. Verifique na planilha se TODOS os campos foram salvos

## ✅ Validação

Após salvar uma avaliação, verifique na planilha:

- ✅ `status_entrevista` = "Avaliado"
- ✅ `entrevistador` = email do entrevistador
- ✅ `data_entrevista` = timestamp
- ✅ `interview_completed_at` = ISO datetime
- ✅ `interview_score` = número 0-120
- ✅ `interview_result` = "Classificado" ou "Desclassificado"
- ✅ `interview_notes` = texto da impressão
- ✅ Todos os 13 campos individuais preenchidos

## 📝 Logs Esperados

```
📝 Salvando avaliação do candidato na linha: 42
📊 Pontuação calculada: 95/120
✅ Avaliação de entrevista salva com sucesso
   - Candidato: 12345678900
   - Pontuação: 95/120
   - Resultado: Classificado
```
