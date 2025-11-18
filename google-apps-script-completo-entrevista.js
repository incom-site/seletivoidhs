// ============================================
// GOOGLE APPS SCRIPT - SISTEMA COMPLETO COM ENTREVISTAS
// ============================================
//
// INSTRUÇÕES DE CONFIGURAÇÃO:
// 1. Substitua TODO o código do seu Google Apps Script por este arquivo
// 2. Atualize o SPREADSHEET_ID abaixo com o ID da sua planilha
// 3. Adicione as novas colunas na aba CANDIDATOS (ver lista abaixo)
// 4. Salve e implante como Web App
//
// NOVAS COLUNAS NECESSÁRIAS NA ABA CANDIDATOS:
// Adicione estas colunas no final da planilha CANDIDATOS:
// - email_sent
// - sms_sent
// - status_entrevista
// - entrevistador
// - entrevistador_at
// - entrevistador_by
// - interview_score
// - interview_result
// - interview_notes
// - interview_completed_at
// - formacao_adequada
// - graduacoes_competencias
// - descricao_processos
// - terminologia_tecnica
// - calma_clareza
// - escalas_flexiveis
// - adaptabilidade_mudancas
// - ajustes_emergencia
// - residencia
// - resolucao_conflitos
// - colaboracao_equipe
// - adaptacao_perfis
//
// ============================================

// CONFIGURAÇÃO - ALTERE O ID DA SUA PLANILHA
const SPREADSHEET_ID = '1iQSQ06P_OXkqxaGWN3uG5jRYFBKyjWqQyvzuGk2EplY';

// NOMES DAS ABAS
const SHEET_USUARIOS = 'USUARIOS';
const SHEET_CANDIDATOS = 'CANDIDATOS';
const SHEET_MOTIVOS = 'MOTIVOS';
const SHEET_MENSAGENS = 'MENSAGENS';
const SHEET_TEMPLATES = 'TEMPLATES';

// CONFIGURAÇÕES
const HEADER_ROWS = 1;
const COL_ID_PRIMARY = 'CPF';
const COL_ID_ALT = 'Número de Inscrição';
const CACHE_TTL_SEC = 1200;
const PROP_REV_KEY = 'IDX_REV';
const IDX_CACHE_KEY = 'idx:v';

// ============================================
// FUNÇÕES AUXILIARES BÁSICAS
// ============================================

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getSheet(name) {
  return getSpreadsheet().getSheetByName(name);
}

function getHeaders(sheet) {
  const lastCol = sheet.getLastColumn();
  return lastCol ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
}

function createColumnMap(headers) {
  const map = {};
  headers.forEach((header, index) => {
    map[header] = index;
  });
  return map;
}

function getCurrentTimestamp() {
  return new Date().toISOString();
}

function getRevision() {
  return PropertiesService.getDocumentProperties().getProperty(PROP_REV_KEY) || '0';
}

function bumpRevision() {
  const props = PropertiesService.getDocumentProperties();
  const cur = Number(props.getProperty(PROP_REV_KEY) || '0') + 1;
  props.setProperty(PROP_REV_KEY, String(cur));
  return String(cur);
}

function buildIndex(sheet, headers) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= HEADER_ROWS) return {};

  const colMap = createColumnMap(headers);
  const colCpf = colMap[COL_ID_PRIMARY] ?? -1;
  const colAlt = colMap[COL_ID_ALT] ?? -1;
  const keyCols = [colCpf, colAlt].filter(c => c >= 0);
  if (!keyCols.length) return {};

  const values = sheet.getRange(HEADER_ROWS + 1, 1, lastRow - HEADER_ROWS, sheet.getLastColumn()).getValues();
  const idx = {};

  for (let i = 0; i < values.length; i++) {
    for (const c of keyCols) {
      const key = values[i][c];
      if (key) {
        const row = i + HEADER_ROWS + 1;
        idx[String(key).trim()] = row;
      }
    }
  }
  return idx;
}

function getIndex(sheet, headers) {
  const rev = getRevision();
  const key = `${IDX_CACHE_KEY}${rev}`;
  const cache = CacheService.getDocumentCache();
  const cached = cache.get(key);

  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      Logger.log('Erro ao fazer parse do cache: ' + e);
    }
  }

  const idx = buildIndex(sheet, headers);
  try {
    cache.put(key, JSON.stringify(idx), CACHE_TTL_SEC);
  } catch (e) {
    Logger.log('Erro ao salvar no cache: ' + e);
  }
  return idx;
}

// ============================================
// CORS E RESPOSTA
// ============================================

function createCorsResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ============================================
// ENDPOINTS PRINCIPAIS
// ============================================

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

// ============================================
// ROTEAMENTO
// ============================================

function handleRequest(e) {
  try {
    let action, params;

    if (e && e.postData && e.postData.contents) {
      try {
        const data = JSON.parse(e.postData.contents);
        action = data.action;
        params = data;
      } catch (parseError) {
        Logger.log('Erro ao fazer parse do JSON: ' + parseError);
        return createCorsResponse({
          success: false,
          error: 'JSON inválido: ' + parseError.toString()
        });
      }
    } else if (e && e.parameter) {
      action = e.parameter.action;
      params = e.parameter;
    } else {
      return createCorsResponse({
        success: false,
        error: 'Requisição inválida'
      });
    }

    Logger.log('Ação: ' + action);

    const actions = {
      'getUserRole': () => getUserRole(params),
      'getAnalysts': () => getAnalysts(params),
      'getCandidates': () => getCandidates(params),
      'assignCandidates': () => assignCandidates(params),
      'updateCandidateStatus': () => updateCandidateStatus(params),
      'getCandidatesByStatus': () => getCandidatesByStatus(params),
      'logMessage': () => logMessage(params),
      'getDisqualificationReasons': () => getDisqualificationReasons(),
      'getMessageTemplates': () => getMessageTemplates(params),
      'sendMessages': () => sendMessages(params),
      'moveToInterview': () => moveToInterview(params),
      'getInterviewCandidates': () => getInterviewCandidates(),
      'getInterviewers': () => getInterviewers(),
      'allocateToInterviewer': () => allocateToInterviewer(params),
      'getInterviewerCandidates': () => getInterviewerCandidates(params),
      'saveInterviewEvaluation': () => saveInterviewEvaluation(params),
      'test': () => testConnection()
    };

    if (actions[action]) {
      const result = actions[action]();
      return createCorsResponse({ success: true, data: result });
    } else {
      return createCorsResponse({
        success: false,
        error: 'Ação não encontrada: ' + action
      });
    }
  } catch (error) {
    Logger.log('Erro: ' + error.toString());
    return createCorsResponse({
      success: false,
      error: error.toString()
    });
  }
}

// ============================================
// FUNÇÕES DE USUÁRIO
// ============================================

function getUserRole(params) {
  try {
    const email = params.email;
    const sheet = getSheet(SHEET_USUARIOS);
    if (!sheet) {
      throw new Error('Aba USUARIOS não encontrada');
    }

    const headers = getHeaders(sheet);
    const colMap = createColumnMap(headers);
    const lastRow = sheet.getLastRow();

    if (lastRow <= HEADER_ROWS) {
      throw new Error('Nenhum usuário cadastrado');
    }

    const values = sheet.getRange(HEADER_ROWS + 1, 1, lastRow - HEADER_ROWS, sheet.getLastColumn()).getValues();

    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      const userEmail = (row[colMap['email']] || '').toString().toLowerCase().trim();

      if (userEmail === email.toLowerCase().trim()) {
        return {
          email: row[colMap['email']],
          name: row[colMap['name']] || row[colMap['nome']],
          role: row[colMap['role']],
          active: row[colMap['active']] !== false && row[colMap['active']] !== 'false'
        };
      }
    }

    throw new Error('Usuário não encontrado');
  } catch (error) {
    Logger.log('Erro em getUserRole: ' + error);
    throw error;
  }
}

function getAnalysts() {
  try {
    const sheet = getSheet(SHEET_USUARIOS);
    if (!sheet) return [];

    const headers = getHeaders(sheet);
    const colMap = createColumnMap(headers);
    const lastRow = sheet.getLastRow();

    if (lastRow <= HEADER_ROWS) return [];

    const values = sheet.getRange(HEADER_ROWS + 1, 1, lastRow - HEADER_ROWS, sheet.getLastColumn()).getValues();
    const analysts = [];

    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      const role = (row[colMap['role']] || '').toString().toLowerCase();
      const active = row[colMap['active']] !== false && row[colMap['active']] !== 'false';

      if (role === 'analista' && active) {
        analysts.push({
          email: row[colMap['email']],
          name: row[colMap['name']] || row[colMap['nome']],
          role: 'analista'
        });
      }
    }

    return analysts;
  } catch (error) {
    Logger.log('Erro em getAnalysts: ' + error);
    throw error;
  }
}

// ============================================
// FUNÇÕES DE CANDIDATOS
// ============================================

function getCandidates(params) {
  try {
    const sheet = getSheet(SHEET_CANDIDATOS);
    if (!sheet) {
      throw new Error('Aba CANDIDATOS não encontrada');
    }

    const headers = getHeaders(sheet);
    const colMap = createColumnMap(headers);
    const lastRow = sheet.getLastRow();

    if (lastRow <= HEADER_ROWS) {
      return [];
    }

    const values = sheet.getRange(HEADER_ROWS + 1, 1, lastRow - HEADER_ROWS, sheet.getLastColumn()).getValues();
    const candidates = [];

    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      const candidate = {};

      headers.forEach((header, index) => {
        candidate[header] = row[index];
      });

      candidate.id = row[colMap[COL_ID_PRIMARY]] || row[colMap[COL_ID_ALT]];
      candidate.registration_number = row[colMap[COL_ID_ALT]] || row[colMap[COL_ID_PRIMARY]];

      if (params.assignedTo) {
        const assignedTo = (row[colMap['assigned_to']] || '').toString().toLowerCase();
        if (assignedTo === params.assignedTo.toLowerCase()) {
          candidates.push(candidate);
        }
      } else {
        candidates.push(candidate);
      }
    }

    return candidates;
  } catch (error) {
    Logger.log('Erro em getCandidates: ' + error);
    throw error;
  }
}

function assignCandidates(params) {
  try {
    const candidateIds = params.candidateIds.split(',');
    const analystEmail = params.analystEmail;
    const adminEmail = params.adminEmail;
    const timestamp = getCurrentTimestamp();

    const sheet = getSheet(SHEET_CANDIDATOS);
    const headers = getHeaders(sheet);
    const colMap = createColumnMap(headers);
    const idx = getIndex(sheet, headers);

    const assignedToCol = colMap['assigned_to'];
    const assignedAtCol = colMap['assigned_at'];
    const assignedByCol = colMap['assigned_by'];
    const statusCol = colMap['Status'];

    let successCount = 0;

    for (const candidateId of candidateIds) {
      const row = idx[candidateId.trim()];
      if (row) {
        if (assignedToCol !== undefined) {
          sheet.getRange(row, assignedToCol + 1).setValue(analystEmail);
        }
        if (assignedAtCol !== undefined) {
          sheet.getRange(row, assignedAtCol + 1).setValue(timestamp);
        }
        if (assignedByCol !== undefined) {
          sheet.getRange(row, assignedByCol + 1).setValue(adminEmail);
        }
        if (statusCol !== undefined) {
          sheet.getRange(row, statusCol + 1).setValue('em_analise');
        }
        successCount++;
      }
    }

    bumpRevision();

    return {
      message: `${successCount} candidatos alocados para ${analystEmail}`,
      successCount: successCount
    };
  } catch (error) {
    Logger.log('Erro em assignCandidates: ' + error);
    throw error;
  }
}

function updateCandidateStatus(params) {
  try {
    const registrationNumber = params.registrationNumber;
    const statusTriagem = params.statusTriagem;
    const notes = params.notes || '';
    const analystEmail = params.analystEmail || '';
    const timestamp = getCurrentTimestamp();

    const sheet = getSheet(SHEET_CANDIDATOS);
    const headers = getHeaders(sheet);
    const colMap = createColumnMap(headers);
    const idx = getIndex(sheet, headers);

    const row = idx[registrationNumber];
    if (!row) {
      throw new Error('Candidato não encontrado');
    }

    const statusTriagemCol = colMap['status_triagem'];
    const dataHoraTriagemCol = colMap['data_hora_triagem'];
    const analistaTriagemCol = colMap['analista_triagem'];
    const notesCol = colMap['notes'];
    const statusCol = colMap['Status'];

    if (statusTriagemCol !== undefined) {
      sheet.getRange(row, statusTriagemCol + 1).setValue(statusTriagem);
    }
    if (dataHoraTriagemCol !== undefined) {
      sheet.getRange(row, dataHoraTriagemCol + 1).setValue(timestamp);
    }
    if (analistaTriagemCol !== undefined) {
      sheet.getRange(row, analistaTriagemCol + 1).setValue(analystEmail);
    }
    if (notesCol !== undefined && notes) {
      sheet.getRange(row, notesCol + 1).setValue(notes);
    }
    if (statusCol !== undefined) {
      sheet.getRange(row, statusCol + 1).setValue('concluido');
    }

    bumpRevision();

    return {
      message: 'Status atualizado com sucesso'
    };
  } catch (error) {
    Logger.log('Erro em updateCandidateStatus: ' + error);
    throw error;
  }
}

function getCandidatesByStatus(params) {
  try {
    const status = params.status;
    const sheet = getSheet(SHEET_CANDIDATOS);
    if (!sheet) {
      throw new Error('Aba CANDIDATOS não encontrada');
    }

    const headers = getHeaders(sheet);
    const colMap = createColumnMap(headers);
    const lastRow = sheet.getLastRow();

    if (lastRow <= HEADER_ROWS) {
      return [];
    }

    const values = sheet.getRange(HEADER_ROWS + 1, 1, lastRow - HEADER_ROWS, sheet.getLastColumn()).getValues();
    const candidates = [];

    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      const statusTriagem = row[colMap['status_triagem']] || '';

      if (statusTriagem === status) {
        const candidate = {};
        headers.forEach((header, index) => {
          candidate[header] = row[index];
        });
        candidate.id = row[colMap[COL_ID_PRIMARY]] || row[colMap[COL_ID_ALT]];
        candidate.registration_number = row[colMap[COL_ID_ALT]] || row[colMap[COL_ID_PRIMARY]];
        candidates.push(candidate);
      }
    }

    return candidates;
  } catch (error) {
    Logger.log('Erro em getCandidatesByStatus: ' + error);
    throw error;
  }
}

// ============================================
// FUNÇÕES DE MENSAGENS
// ============================================

function logMessage(params) {
  try {
    const sheet = getSheet(SHEET_MENSAGENS);
    if (!sheet) {
      throw new Error('Aba MENSAGENS não encontrada');
    }

    const timestamp = getCurrentTimestamp();

    sheet.appendRow([
      timestamp,
      params.registrationNumber,
      params.messageType,
      params.recipient,
      params.subject || '',
      params.content,
      params.sentBy
    ]);

    return {
      message: 'Mensagem registrada com sucesso'
    };
  } catch (error) {
    Logger.log('Erro em logMessage: ' + error);
    throw error;
  }
}

function getDisqualificationReasons() {
  try {
    const sheet = getSheet(SHEET_MOTIVOS);
    if (!sheet) return [];

    const headers = getHeaders(sheet);
    const lastRow = sheet.getLastRow();

    if (lastRow <= HEADER_ROWS) return [];

    const values = sheet.getRange(HEADER_ROWS + 1, 1, lastRow - HEADER_ROWS, sheet.getLastColumn()).getValues();
    const reasons = [];

    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      reasons.push({
        id: row[0],
        reason: row[1] || row[0]
      });
    }

    return reasons;
  } catch (error) {
    Logger.log('Erro em getDisqualificationReasons: ' + error);
    return [];
  }
}

function getMessageTemplates(params) {
  try {
    const messageType = params.messageType;
    const sheet = getSheet(SHEET_TEMPLATES);
    if (!sheet) return [];

    const headers = getHeaders(sheet);
    const colMap = createColumnMap(headers);
    const lastRow = sheet.getLastRow();

    if (lastRow <= HEADER_ROWS) return [];

    const values = sheet.getRange(HEADER_ROWS + 1, 1, lastRow - HEADER_ROWS, sheet.getLastColumn()).getValues();
    const templates = [];

    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      const type = row[colMap['message_type']] || '';

      if (!messageType || type === messageType) {
        templates.push({
          id: row[colMap['id']] || i.toString(),
          template_name: row[colMap['template_name']],
          message_type: row[colMap['message_type']],
          subject: row[colMap['subject']] || '',
          content: row[colMap['content']]
        });
      }
    }

    return templates;
  } catch (error) {
    Logger.log('Erro em getMessageTemplates: ' + error);
    return [];
  }
}

function sendMessages(params) {
  try {
    const messageType = params.messageType;
    const candidateIds = params.candidateIds.split(',');
    const subject = params.subject || '';
    const content = params.content;
    const sentBy = params.sentBy;

    const sheet = getSheet(SHEET_CANDIDATOS);
    const headers = getHeaders(sheet);
    const colMap = createColumnMap(headers);
    const idx = getIndex(sheet, headers);

    const emailSentCol = colMap['email_sent'];
    const smsSentCol = colMap['sms_sent'];
    const timestamp = getCurrentTimestamp();

    let successCount = 0;
    let failCount = 0;
    const results = [];

    for (const candidateId of candidateIds) {
      try {
        const row = idx[candidateId.trim()];
        if (!row) {
          results.push({
            success: false,
            candidateId: candidateId,
            error: 'Candidato não encontrado'
          });
          failCount++;
          continue;
        }

        const values = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
        const candidateName = values[colMap['NOMECOMPLETO']] || 'Desconhecido';

        if (messageType === 'email' && emailSentCol !== undefined) {
          sheet.getRange(row, emailSentCol + 1).setValue(timestamp);
        } else if (messageType === 'sms' && smsSentCol !== undefined) {
          sheet.getRange(row, smsSentCol + 1).setValue(timestamp);
        }

        logMessage({
          registrationNumber: candidateId,
          messageType: messageType,
          recipient: messageType === 'email' ? values[colMap['EMAIL']] : values[colMap['TELEFONE']],
          subject: subject,
          content: content,
          sentBy: sentBy
        });

        results.push({
          success: true,
          candidateId: candidateId,
          candidateName: candidateName
        });
        successCount++;
      } catch (error) {
        results.push({
          success: false,
          candidateId: candidateId,
          error: error.toString()
        });
        failCount++;
      }
    }

    bumpRevision();

    return {
      successCount: successCount,
      failCount: failCount,
      results: results
    };
  } catch (error) {
    Logger.log('Erro em sendMessages: ' + error);
    throw error;
  }
}

// ============================================
// FUNÇÕES DE ENTREVISTA
// ============================================

function moveToInterview(params) {
  try {
    const candidateIds = params.candidateIds.split(',');
    const sheet = getSheet(SHEET_CANDIDATOS);
    const headers = getHeaders(sheet);
    const colMap = createColumnMap(headers);
    const idx = getIndex(sheet, headers);

    const statusEntrevistaCol = colMap['status_entrevista'];

    let successCount = 0;

    for (const candidateId of candidateIds) {
      const row = idx[candidateId.trim()];
      if (row && statusEntrevistaCol !== undefined) {
        sheet.getRange(row, statusEntrevistaCol + 1).setValue('Aguardando');
        successCount++;
      }
    }

    bumpRevision();

    return {
      message: `${successCount} candidatos movidos para entrevista`,
      successCount: successCount
    };
  } catch (error) {
    Logger.log('Erro em moveToInterview: ' + error);
    throw error;
  }
}

function getInterviewCandidates() {
  try {
    const sheet = getSheet(SHEET_CANDIDATOS);
    const headers = getHeaders(sheet);
    const colMap = createColumnMap(headers);
    const lastRow = sheet.getLastRow();

    if (lastRow <= HEADER_ROWS) {
      return [];
    }

    const values = sheet.getRange(HEADER_ROWS + 1, 1, lastRow - HEADER_ROWS, sheet.getLastColumn()).getValues();
    const candidates = [];

    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      const statusEntrevista = row[colMap['status_entrevista']] || '';

      if (statusEntrevista === 'Aguardando') {
        const candidate = {};
        headers.forEach((header, index) => {
          candidate[header] = row[index];
        });
        candidate.id = row[colMap[COL_ID_PRIMARY]] || row[colMap[COL_ID_ALT]];
        candidate.registration_number = row[colMap[COL_ID_ALT]] || row[colMap[COL_ID_PRIMARY]];
        candidates.push(candidate);
      }
    }

    return candidates;
  } catch (error) {
    Logger.log('Erro em getInterviewCandidates: ' + error);
    throw error;
  }
}

function getInterviewers() {
  try {
    const sheet = getSheet(SHEET_USUARIOS);
    if (!sheet) return [];

    const headers = getHeaders(sheet);
    const colMap = createColumnMap(headers);
    const lastRow = sheet.getLastRow();

    if (lastRow <= HEADER_ROWS) return [];

    const values = sheet.getRange(HEADER_ROWS + 1, 1, lastRow - HEADER_ROWS, sheet.getLastColumn()).getValues();
    const interviewers = [];

    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      const role = (row[colMap['role']] || '').toString().toLowerCase();
      const active = row[colMap['active']] !== false && row[colMap['active']] !== 'false';

      if (role === 'entrevistador' && active) {
        interviewers.push({
          email: row[colMap['email']],
          name: row[colMap['name']] || row[colMap['nome']],
          role: 'entrevistador'
        });
      }
    }

    return interviewers;
  } catch (error) {
    Logger.log('Erro em getInterviewers: ' + error);
    return [];
  }
}

function allocateToInterviewer(params) {
  try {
    const candidateIds = params.candidateIds.split(',');
    const interviewerEmail = params.interviewerEmail;
    const adminEmail = params.adminEmail;
    const timestamp = getCurrentTimestamp();

    const sheet = getSheet(SHEET_CANDIDATOS);
    const headers = getHeaders(sheet);
    const colMap = createColumnMap(headers);
    const idx = getIndex(sheet, headers);

    const entrevistadorCol = colMap['entrevistador'];
    const entrevistadorAtCol = colMap['entrevistador_at'];
    const entrevistadorByCol = colMap['entrevistador_by'];
    const statusEntrevistaCol = colMap['status_entrevista'];

    let successCount = 0;

    for (const candidateId of candidateIds) {
      const row = idx[candidateId.trim()];
      if (row) {
        if (entrevistadorCol !== undefined) {
          sheet.getRange(row, entrevistadorCol + 1).setValue(interviewerEmail);
        }
        if (entrevistadorAtCol !== undefined) {
          sheet.getRange(row, entrevistadorAtCol + 1).setValue(timestamp);
        }
        if (entrevistadorByCol !== undefined) {
          sheet.getRange(row, entrevistadorByCol + 1).setValue(adminEmail);
        }
        if (statusEntrevistaCol !== undefined) {
          sheet.getRange(row, statusEntrevistaCol + 1).setValue('Alocado');
        }
        successCount++;
      }
    }

    bumpRevision();

    return {
      message: `${successCount} candidatos alocados para ${interviewerEmail}`,
      successCount: successCount
    };
  } catch (error) {
    Logger.log('Erro em allocateToInterviewer: ' + error);
    throw error;
  }
}

function getInterviewerCandidates(params) {
  try {
    const interviewerEmail = params.interviewerEmail;
    const sheet = getSheet(SHEET_CANDIDATOS);
    const headers = getHeaders(sheet);
    const colMap = createColumnMap(headers);
    const lastRow = sheet.getLastRow();

    if (lastRow <= HEADER_ROWS) {
      return [];
    }

    const values = sheet.getRange(HEADER_ROWS + 1, 1, lastRow - HEADER_ROWS, sheet.getLastColumn()).getValues();
    const candidates = [];

    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      const entrevistador = (row[colMap['entrevistador']] || '').toString().toLowerCase();

      if (entrevistador === interviewerEmail.toLowerCase()) {
        const candidate = {};
        headers.forEach((header, index) => {
          candidate[header] = row[index];
        });
        candidate.id = row[colMap[COL_ID_PRIMARY]] || row[colMap[COL_ID_ALT]];
        candidate.registration_number = row[colMap[COL_ID_ALT]] || row[colMap[COL_ID_PRIMARY]];
        candidates.push(candidate);
      }
    }

    return candidates;
  } catch (error) {
    Logger.log('Erro em getInterviewerCandidates: ' + error);
    throw error;
  }
}

function saveInterviewEvaluation(params) {
  try {
    const candidateId = params.candidateId;
    const sheet = getSheet(SHEET_CANDIDATOS);
    const headers = getHeaders(sheet);
    const colMap = createColumnMap(headers);
    const idx = getIndex(sheet, headers);

    const row = idx[candidateId];
    if (!row) {
      throw new Error('Candidato não encontrado');
    }

    const secao1 = (parseInt(params.formacao_adequada) + parseInt(params.graduacoes_competencias)) * 2;
    const secao2 = (parseInt(params.descricao_processos) + parseInt(params.terminologia_tecnica) + parseInt(params.calma_clareza)) * 2;
    const secao3 = parseInt(params.escalas_flexiveis) + parseInt(params.adaptabilidade_mudancas) + parseInt(params.ajustes_emergencia);
    const secao4 = parseInt(params.residencia);
    const secao5 = (parseInt(params.resolucao_conflitos) + parseInt(params.colaboracao_equipe) + parseInt(params.adaptacao_perfis)) * 2;
    const totalScore = secao1 + secao2 + secao3 + secao4 + secao5;

    const fieldsToUpdate = [
      { col: 'formacao_adequada', value: params.formacao_adequada },
      { col: 'graduacoes_competencias', value: params.graduacoes_competencias },
      { col: 'descricao_processos', value: params.descricao_processos },
      { col: 'terminologia_tecnica', value: params.terminologia_tecnica },
      { col: 'calma_clareza', value: params.calma_clareza },
      { col: 'escalas_flexiveis', value: params.escalas_flexiveis },
      { col: 'adaptabilidade_mudancas', value: params.adaptabilidade_mudancas },
      { col: 'ajustes_emergencia', value: params.ajustes_emergencia },
      { col: 'residencia', value: params.residencia },
      { col: 'resolucao_conflitos', value: params.resolucao_conflitos },
      { col: 'colaboracao_equipe', value: params.colaboracao_equipe },
      { col: 'adaptacao_perfis', value: params.adaptacao_perfis },
      { col: 'interview_score', value: totalScore },
      { col: 'interview_result', value: params.resultado },
      { col: 'interview_notes', value: params.impressao_perfil },
      { col: 'interview_completed_at', value: params.completed_at },
      { col: 'status_entrevista', value: 'Realizada' }
    ];

    for (const field of fieldsToUpdate) {
      const colIndex = colMap[field.col];
      if (colIndex !== undefined) {
        sheet.getRange(row, colIndex + 1).setValue(field.value);
      }
    }

    bumpRevision();

    return {
      message: 'Avaliação salva com sucesso',
      totalScore: totalScore
    };
  } catch (error) {
    Logger.log('Erro em saveInterviewEvaluation: ' + error);
    throw error;
  }
}

// ============================================
// FUNÇÃO DE TESTE
// ============================================

function testConnection() {
  return {
    message: 'Conexão OK',
    timestamp: getCurrentTimestamp(),
    spreadsheetId: SPREADSHEET_ID
  };
}
