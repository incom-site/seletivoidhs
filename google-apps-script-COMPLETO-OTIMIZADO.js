// ============================================
// GOOGLE APPS SCRIPT - SISTEMA DE TRIAGEM COMPLETO
// VERSÃO OTIMIZADA - TODAS AS FUNÇÕES CORRELACIONADAS
// ============================================

// ==================== CONFIGURAÇÕES ====================

const SPREADSHEET_ID = '1iQSQ06P_OXkqxaGWN3uG5jRYFBKyjWqQyvzuGk2EplY';
const SHEET_USUARIOS = 'USUARIOS';
const SHEET_CANDIDATOS = 'CANDIDATOS';
const SHEET_MENSAGENS = 'MENSAGENS';
const SHEET_MOTIVOS = 'MOTIVOS_DESCLASSIFICACAO';
const SHEET_TEMPLATES = 'TEMPLATES_MENSAGEM';

const CACHE_TTL = 60;
const CACHE_KEYS = {
  REPORT_DATA: 'report_data_v4',
  USERS: 'users_data_v4',
  STATS: 'stats_data_v4',
  INTERVIEWERS: 'interviewers_v4',
  REASONS: 'disqualification_reasons_v4',
  CANDIDATES: 'candidates_data_v4'
};

// ==================== CACHE SERVICE ====================

class AdvancedCacheService {
  static getCache() {
    return CacheService.getScriptCache();
  }

  static getLock() {
    return LockService.getScriptLock();
  }

  static safeStringify(obj) {
    return JSON.stringify(obj, (key, value) =>
      value === undefined ? null : value
    );
  }

  static safeParse(str) {
    try {
      return str ? JSON.parse(str) : null;
    } catch (e) {
      Logger.log('Cache parse error: ' + e);
      return null;
    }
  }

  static get(key) {
    const cached = this.getCache().get(key);
    return this.safeParse(cached);
  }

  static set(key, data, ttl = CACHE_TTL) {
    try {
      this.getCache().put(key, this.safeStringify(data), ttl);
      return true;
    } catch (error) {
      Logger.log('Cache set error: ' + error);
      return false;
    }
  }

  static invalidate(key) {
    this.getCache().remove(key);
  }

  static invalidateAll() {
    this.getCache().removeAll(Object.values(CACHE_KEYS));
  }

  static getWithFallback(key, fetchFunction, ttl = CACHE_TTL) {
    let data = this.get(key);

    if (data !== null) {
      return data;
    }

    const lock = this.getLock();

    if (lock.tryLock(10000)) {
      try {
        data = this.get(key);
        if (data !== null) {
          return data;
        }

        data = fetchFunction();
        this.set(key, data, ttl);
      } catch (error) {
        Logger.log('Error in fetchFunction: ' + error);
      } finally {
        lock.releaseLock();
      }
    } else {
      data = this.get(key) || fetchFunction();
    }

    return data;
  }
}

// ==================== FUNÇÕES AUXILIARES ====================

function _ss() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function _sheet(name) {
  return _ss().getSheetByName(name);
}

function _getHeaders_(sh) {
  const lastCol = sh.getLastColumn();
  if (lastCol === 0) return [];
  return sh.getRange(1, 1, 1, lastCol).getValues()[0];
}

function _colMap_(headers) {
  const map = {};
  headers.forEach((h, i) => { map[h] = i; });
  return map;
}

function _getRev_() {
  return PropertiesService.getScriptProperties().getProperty('SHEET_REV') || '0';
}

function _bumpRev_() {
  const rev = parseInt(_getRev_(), 10) + 1;
  PropertiesService.getScriptProperties().setProperty('SHEET_REV', String(rev));
  AdvancedCacheService.invalidateAll();
  return rev;
}

function _buildIndex_(sh, headers) {
  const cpfCol = headers.indexOf('CPF');
  const regCol = headers.indexOf('Número de Inscrição') >= 0
    ? headers.indexOf('Número de Inscrição')
    : headers.indexOf('NUMEROINSCRICAO');

  if (cpfCol < 0 && regCol < 0) return {};

  const lastRow = sh.getLastRow();
  if (lastRow <= 1) return {};

  const data = sh.getRange(2, 1, lastRow - 1, headers.length).getValues();
  const idx = {};

  data.forEach((row, i) => {
    const rowNum = i + 2;
    if (cpfCol >= 0 && row[cpfCol]) {
      idx[String(row[cpfCol]).trim()] = rowNum;
    }
    if (regCol >= 0 && row[regCol]) {
      idx[String(row[regCol]).trim()] = rowNum;
    }
  });

  return idx;
}

function _getIndex_(sh, headers) {
  const rev = _getRev_();
  const cacheKey = 'index_' + sh.getName() + '_rev' + rev;
  return AdvancedCacheService.getWithFallback(cacheKey, () => _buildIndex_(sh, headers), 300);
}

function _readSheetBlock_(name) {
  const sheet = _sheet(name);
  if (!sheet) return { sheet: null, headers: [], values: [] };

  const headers = _getHeaders_(sheet);
  if (headers.length === 0) return { sheet, headers: [], values: [] };

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { sheet, headers, values: [] };

  const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();

  return { sheet, headers, values };
}

function _writeWholeRow_(sh, row, rowArray) {
  const lastCol = sh.getLastColumn();
  const safe = rowArray.slice(0, lastCol);
  while (safe.length < lastCol) safe.push('');
  sh.getRange(row, 1, 1, lastCol).setValues([safe]);
}

function _normalizeValue_(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (trimmed === '' ||
        trimmed.toLowerCase() === 'null' ||
        trimmed.toLowerCase() === 'undefined' ||
        trimmed === '0' ||
        trimmed.toLowerCase() === 'false') {
      return null;
    }

    return trimmed;
  }

  return value;
}

// ==================== CORS ====================

function createCorsResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ==================== HANDLERS PRINCIPAIS ====================

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    const params = e.parameter || {};
    const action = params.action;

    if (!action) {
      return createCorsResponse({
        success: false,
        error: 'Ação não especificada'
      });
    }

    let result;

    switch (action) {
      // ===== AUTENTICAÇÃO E USUÁRIOS =====
      case 'getUserRole':
        result = getUserRole(params);
        break;
      case 'getAnalysts':
        result = getAnalysts(params);
        break;
      case 'getInterviewers':
        result = getInterviewers(params);
        break;

      // ===== CANDIDATOS =====
      case 'getCandidates':
        result = getCandidates(params);
        break;
      case 'updateCandidateStatus':
        result = updateCandidateStatus(params);
        break;
      case 'getCandidatesByStatus':
        result = getCandidatesByStatus(params);
        break;
      case 'assignCandidates':
        result = assignCandidates(params);
        break;
      case 'saveScreening':
        result = saveScreening(params);
        break;

      // ===== ENTREVISTAS =====
      case 'getInterviewCandidates':
        result = getInterviewCandidates(params);
        break;
      case 'moveToInterview':
        result = moveToInterview(params);
        break;
      case 'getInterviewerCandidates':
        result = getInterviewerCandidates(params);
        break;
      case 'allocateToInterviewer':
        result = allocateToInterviewer(params);
        break;
      case 'updateInterviewStatus':
        result = updateInterviewStatus(params);
        break;
      case 'saveInterviewEvaluation':
        result = saveInterviewEvaluation(params);
        break;

      // ===== MENSAGENS =====
      case 'logMessage':
        result = logMessage(params);
        break;
      case 'sendMessages':
        result = sendMessages(params);
        break;
      case 'updateMessageStatus':
        result = updateMessageStatus(params);
        break;
      case 'getMessageTemplates':
        result = getMessageTemplates(params);
        break;

      // ===== RELATÓRIOS =====
      case 'getReport':
        result = getReport(params);
        break;
      case 'getReportStats':
        result = getReportStats(params);
        break;

      // ===== CONFIGURAÇÕES =====
      case 'getDisqualificationReasons':
        result = getDisqualificationReasons();
        break;
      case 'getSpreadsheet':
        result = getSpreadsheet();
        break;
      case 'testConnection':
        result = testConnection();
        break;

      default:
        return createCorsResponse({
          success: false,
          error: 'Ação desconhecida: ' + action
        });
    }

    return createCorsResponse({
      success: true,
      data: result
    });

  } catch (error) {
    Logger.log('ERRO em handleRequest: ' + error.toString());
    Logger.log('Stack: ' + error.stack);

    return createCorsResponse({
      success: false,
      error: error.toString(),
      stack: error.stack
    });
  }
}

// ==================== FUNÇÕES DE CANDIDATOS ====================

function getCandidates(params) {
  try {
    Logger.log('═══════════════════════════════════════════════════');
    Logger.log('📋 getCandidates - INICIANDO');

    const { sheet, headers, values } = _readSheetBlock_(SHEET_CANDIDATOS);

    if (!sheet) {
      Logger.log('❌ Planilha CANDIDATOS não encontrada');
      return { candidates: [] };
    }

    if (!values || values.length === 0) {
      Logger.log('⚠️ Nenhum candidato na planilha');
      return { candidates: [] };
    }

    Logger.log('✅ Total de linhas: ' + values.length);

    const colMap = _colMap_(headers);
    const candidates = [];

    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      const obj = {};

      // Mapear todos os campos
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = _normalizeValue_(row[j]);
      }

      // ===== CAMPOS ESSENCIAIS =====
      obj.CPF = obj.CPF || obj.cpf || '';
      obj.NOMECOMPLETO = obj.NOMECOMPLETO || obj.nome_completo || obj.full_name || '';
      obj.NOMESOCIAL = obj.NOMESOCIAL || obj.nome_social || null;
      obj.TELEFONE = obj.TELEFONE || obj.telefone || obj.Telefone || null;
      obj.EMAIL = obj.EMAIL || obj.email || obj.Email || null;
      obj.AREAATUACAO = obj.AREAATUACAO || obj.area || obj.Area || null;
      obj.VAGAPCD = obj.VAGAPCD || obj.vaga_pcd || null;
      obj.PCD = obj.PCD || obj.pcd || null;

      // ===== CARGOS - CRÍTICO =====
      obj.CARGOADMIN = obj.CARGOADMIN || obj.cargo_administrativo || null;
      obj.CARGOASSIS = obj.CARGOASSIS || obj.cargo_assistencial || null;

      // ===== NORMALIZAR assigned_to - CRÍTICO =====
      const assignedToRaw = _normalizeValue_(obj.assigned_to || obj.Analista);
      obj.assigned_to = assignedToRaw;
      obj.Analista = assignedToRaw;

      // ===== STATUS =====
      obj.Status = obj.Status || obj.status || 'pendente';
      obj.status = String(obj.Status).toLowerCase();

      // ===== OUTROS CAMPOS DE ALOCAÇÃO =====
      obj.assigned_at = obj.assigned_at || null;
      obj.assigned_by = obj.assigned_by || null;

      // ===== DATAS =====
      obj.DataCadastro = obj.DataCadastro || obj.created_at || null;
      obj['Data Triagem'] = obj['Data Triagem'] || obj.data_triagem || null;

      // ===== ENTREVISTA =====
      obj.status_entrevista = obj.status_entrevista || null;
      obj.entrevistador = obj.entrevistador || null;
      obj.data_entrevista = obj.data_entrevista || null;
      obj.avaliacao_entrevista = obj.avaliacao_entrevista || null;

      // ===== TRIAGEM =====
      obj.screening_notes = obj.screening_notes || obj['Observações'] || null;
      obj.disqualification_reason = obj.disqualification_reason || obj['Motivo Desclassificação'] || null;

      // ===== MENSAGENS =====
      obj.EMAIL_SENT = obj.EMAIL_SENT || null;
      obj.SMS_SENT = obj.SMS_SENT || null;

      // ===== IDs =====
      obj.id = obj.CPF;
      obj.registration_number = obj['Número de Inscrição'] || obj.NUMEROINSCRICAO || obj.CPF;

      candidates.push(obj);

      if (i < 3) {
        Logger.log('👤 Candidato ' + (i + 1) + ': ' + obj.NOMECOMPLETO);
        Logger.log('   assigned_to: "' + obj.assigned_to + '"');
        Logger.log('   Status: ' + obj.Status);
      }
    }

    Logger.log('✅ Total de candidatos processados: ' + candidates.length);
    Logger.log('═══════════════════════════════════════════════════');

    return { candidates: candidates };

  } catch (error) {
    Logger.log('❌ ERRO em getCandidates: ' + error.toString());
    throw error;
  }
}

function getCandidatesByStatus(params) {
  const { sheet, headers, values } = _readSheetBlock_(SHEET_CANDIDATOS);
  if (!sheet || !values.length) return [];

  const col = _colMap_(headers);
  const statusCol = col['Status'];
  const cpfCol = col['CPF'];
  const emailSentCol = col['EMAIL_SENT'];
  const smsSentCol = col['SMS_SENT'];

  const filtered = [];
  for (let i = 0; i < values.length; i++) {
    if (values[i][statusCol] === params.status) {
      const obj = {};
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = _normalizeValue_(values[i][j]);
      }

      obj.id = values[i][cpfCol];
      obj.registration_number = values[i][cpfCol];

      obj.email_sent = emailSentCol >= 0 ? (values[i][emailSentCol] === 'Sim' || values[i][emailSentCol] === true || values[i][emailSentCol] === 'TRUE') : false;
      obj.sms_sent = smsSentCol >= 0 ? (values[i][smsSentCol] === 'Sim' || values[i][smsSentCol] === true || values[i][smsSentCol] === 'TRUE') : false;

      filtered.push(obj);
    }
  }
  return filtered;
}

function updateCandidateStatus(params) {
  const sh = _sheet(SHEET_CANDIDATOS);
  const headers = _getHeaders_(sh);
  const col = _colMap_(headers);

  const statusCol = col['Status'];
  const cpfCol = col['CPF'];
  const regNumCol = col['Número de Inscrição'] || col['NUMEROINSCRICAO'];
  const analystCol = col['Analista'] || col['assigned_to'];
  const dateCol = col['Data Triagem'] || col['data_hora_triagem'];
  const reasonCol = col['Motivo Desclassificação'];
  const notesCol = col['Observações'] || col['screening_notes'];

  const idx = _getIndex_(sh, headers);
  const searchKey = String(params.registrationNumber).trim();
  let row = idx[searchKey];

  const checkMismatch =
    row &&
    cpfCol >= 0 &&
    params.cpf &&
    sh.getRange(row, cpfCol + 1).getValue() !== params.cpf;

  if (checkMismatch) {
    row = null;
    for (const k in idx) {
      if (k === params.cpf) {
        row = idx[k];
        break;
      }
    }
  }

  if (!row) {
    return { success: false, error: 'Candidato não encontrado' };
  }

  const currentRow = sh.getRange(row, 1, 1, headers.length).getValues()[0];

  if (statusCol >= 0) currentRow[statusCol] = params.status;
  if (analystCol >= 0 && params.analystId) currentRow[analystCol] = params.analystId;
  if (dateCol >= 0) currentRow[dateCol] = getCurrentTimestamp();
  if (reasonCol >= 0 && params.reason) currentRow[reasonCol] = params.reason;
  if (notesCol >= 0 && params.notes) currentRow[notesCol] = params.notes;

  _writeWholeRow_(sh, row, currentRow);
  _bumpRev_();

  return { success: true };
}

function assignCandidates(params) {
  if (!params.candidateIds || !params.analystId) {
    return { success: false, error: 'Parâmetros inválidos' };
  }

  const sh = _sheet(SHEET_CANDIDATOS);
  const headers = _getHeaders_(sh);
  const col = _colMap_(headers);

  const cpfCol = col['CPF'];
  const assignedToCol = col['assigned_to'] || col['Analista'];
  const assignedAtCol = col['assigned_at'];
  const assignedByCol = col['assigned_by'];
  const statusCol = col['Status'];

  if (cpfCol < 0 || assignedToCol < 0) {
    return { success: false, error: 'Colunas essenciais não encontradas' };
  }

  const idx = _getIndex_(sh, headers);
  const candidateIds = JSON.parse(params.candidateIds);
  let updated = 0;

  candidateIds.forEach(cpf => {
    const row = idx[String(cpf).trim()];
    if (row) {
      const currentRow = sh.getRange(row, 1, 1, headers.length).getValues()[0];

      currentRow[assignedToCol] = params.analystId;
      if (assignedAtCol >= 0) currentRow[assignedAtCol] = getCurrentTimestamp();
      if (assignedByCol >= 0 && params.adminId) currentRow[assignedByCol] = params.adminId;
      if (statusCol >= 0 && currentRow[statusCol] === 'pendente') {
        currentRow[statusCol] = 'em_analise';
      }

      _writeWholeRow_(sh, row, currentRow);
      updated++;
    }
  });

  if (updated > 0) {
    _bumpRev_();
  }

  return { success: true, updated: updated };
}

function saveScreening(params) {
  const sh = _sheet(SHEET_CANDIDATOS);
  const headers = _getHeaders_(sh);
  const col = _colMap_(headers);

  const idx = _getIndex_(sh, headers);
  const searchKey = String(params.registrationNumber).trim();
  const row = idx[searchKey];

  if (!row) {
    return { success: false, error: 'Candidato não encontrado' };
  }

  const currentRow = sh.getRange(row, 1, 1, headers.length).getValues()[0];

  const statusCol = col['Status'];
  const reasonCol = col['Motivo Desclassificação'];
  const notesCol = col['Observações'] || col['screening_notes'];
  const dateCol = col['Data Triagem'] || col['data_hora_triagem'];
  const analystCol = col['Analista'] || col['assigned_to'];

  if (statusCol >= 0) currentRow[statusCol] = params.status;
  if (reasonCol >= 0) currentRow[reasonCol] = params.disqualificationReason || '';
  if (notesCol >= 0) currentRow[notesCol] = params.notes || '';
  if (dateCol >= 0) currentRow[dateCol] = getCurrentTimestamp();
  if (analystCol >= 0 && params.analystId) currentRow[analystCol] = params.analystId;

  _writeWholeRow_(sh, row, currentRow);
  _bumpRev_();

  return { success: true };
}

// ==================== FUNÇÕES DE USUÁRIOS ====================

function getUserRole(params) {
  if (!params.email) {
    return { role: null, user: null };
  }

  const { sheet, headers, values } = _readSheetBlock_(SHEET_USUARIOS);

  if (!sheet || !values.length) {
    return { role: null, user: null };
  }

  const col = _colMap_(headers);
  const emailCol = col['email'];
  const roleCol = col['role'];
  const nameCol = col['name'];
  const activeCol = col['active'];

  for (let i = 0; i < values.length; i++) {
    const userEmail = String(values[i][emailCol] || '').trim().toLowerCase();

    if (userEmail === params.email.toLowerCase()) {
      const isActive = activeCol >= 0 ? (values[i][activeCol] === true || values[i][activeCol] === 'TRUE' || values[i][activeCol] === 'Sim') : true;

      if (!isActive) {
        return { role: null, user: null };
      }

      // CRÍTICO: Normalizar role (remover espaços, lowercase)
      const rawRole = String(values[i][roleCol] || 'analista').trim().toLowerCase();

      const user = {
        id: userEmail,
        email: userEmail,
        name: values[i][nameCol] || userEmail,
        role: rawRole,
        active: isActive
      };

      Logger.log('✅ getUserRole - Usuário encontrado:');
      Logger.log('   Email: ' + user.email);
      Logger.log('   Role raw: "' + values[i][roleCol] + '"');
      Logger.log('   Role normalizado: "' + rawRole + '"');

      return { role: user.role, user: user };
    }
  }

  return { role: null, user: null };
}

function getAnalysts(params) {
  const { sheet, headers, values } = _readSheetBlock_(SHEET_USUARIOS);

  if (!sheet || !values.length) {
    return { analysts: [] };
  }

  const col = _colMap_(headers);
  const emailCol = col['email'];
  const roleCol = col['role'];
  const nameCol = col['name'];
  const activeCol = col['active'];

  const analysts = [];

  for (let i = 0; i < values.length; i++) {
    const role = String(values[i][roleCol] || '').trim().toLowerCase();
    const isActive = activeCol >= 0 ? (values[i][activeCol] === true || values[i][activeCol] === 'TRUE' || values[i][activeCol] === 'Sim') : true;

    // Aceitar tanto 'analista' quanto 'analyst' (português e inglês)
    if ((role === 'analista' || role === 'analyst' || role === 'admin') && isActive) {
      analysts.push({
        id: values[i][emailCol],
        email: values[i][emailCol],
        name: values[i][nameCol] || values[i][emailCol],
        role: role // Role já normalizado
      });
    }
  }

  Logger.log('✅ Total de analistas: ' + analysts.length);
  return { analysts: analysts };
}

function getInterviewers(params) {
  const { sheet, headers, values } = _readSheetBlock_(SHEET_USUARIOS);

  if (!sheet || !values.length) {
    return { interviewers: [] };
  }

  const col = _colMap_(headers);
  const emailCol = col['email'];
  const roleCol = col['role'];
  const nameCol = col['name'];
  const activeCol = col['active'];

  const interviewers = [];

  for (let i = 0; i < values.length; i++) {
    const role = String(values[i][roleCol] || '').trim().toLowerCase();
    const isActive = activeCol >= 0 ? (values[i][activeCol] === true || values[i][activeCol] === 'TRUE' || values[i][activeCol] === 'Sim') : true;

    if (role === 'interviewer' && isActive) {
      interviewers.push({
        id: values[i][emailCol],
        email: values[i][emailCol],
        name: values[i][nameCol] || values[i][emailCol],
        role: 'interviewer'
      });
    }
  }

  Logger.log('✅ Total de entrevistadores: ' + interviewers.length);
  return { interviewers: interviewers };
}

// ==================== FUNÇÕES DE ENTREVISTA ====================

function getInterviewCandidates(params) {
  const allData = getCandidates({});
  const candidates = allData.candidates || [];

  const interviewCandidates = candidates.filter(c => {
    const status = String(c.Status || '').toLowerCase();
    return status === 'entrevista' || status === 'para_entrevista';
  });

  Logger.log('✅ Total de candidatos para entrevista: ' + interviewCandidates.length);
  return interviewCandidates;
}

function moveToInterview(params) {
  if (!params.candidateIds) {
    return { success: false, error: 'candidateIds não fornecido' };
  }

  const sh = _sheet(SHEET_CANDIDATOS);
  const headers = _getHeaders_(sh);
  const col = _colMap_(headers);

  const cpfCol = col['CPF'];
  const statusCol = col['Status'];
  const statusEntrevistaCol = col['status_entrevista'];

  if (cpfCol < 0 || statusCol < 0) {
    return { success: false, error: 'Colunas essenciais não encontradas' };
  }

  const idx = _getIndex_(sh, headers);
  const candidateIds = JSON.parse(params.candidateIds);
  let updated = 0;

  candidateIds.forEach(cpf => {
    const row = idx[String(cpf).trim()];
    if (row) {
      const currentRow = sh.getRange(row, 1, 1, headers.length).getValues()[0];

      currentRow[statusCol] = 'entrevista';
      if (statusEntrevistaCol >= 0) {
        currentRow[statusEntrevistaCol] = 'aguardando_alocacao';
      }

      _writeWholeRow_(sh, row, currentRow);
      updated++;
    }
  });

  if (updated > 0) {
    _bumpRev_();
  }

  return { success: true, updated: updated };
}

function getInterviewerCandidates(params) {
  if (!params.interviewerId) {
    return [];
  }

  const allData = getCandidates({});
  const candidates = allData.candidates || [];

  const interviewerCandidates = candidates.filter(c => {
    const entrevistador = c.entrevistador;
    const status = String(c.Status || '').toLowerCase();

    return entrevistador === params.interviewerId && status === 'entrevista';
  });

  Logger.log('✅ Candidatos do entrevistador ' + params.interviewerId + ': ' + interviewerCandidates.length);
  return interviewerCandidates;
}

function allocateToInterviewer(params) {
  if (!params.candidateIds || !params.interviewerId) {
    return { success: false, error: 'Parâmetros inválidos' };
  }

  const sh = _sheet(SHEET_CANDIDATOS);
  const headers = _getHeaders_(sh);
  const col = _colMap_(headers);

  const cpfCol = col['CPF'];
  const entrevistadorCol = col['entrevistador'];
  const statusEntrevistaCol = col['status_entrevista'];
  const dataEntrevistaCol = col['data_entrevista'];

  if (cpfCol < 0 || entrevistadorCol < 0) {
    return { success: false, error: 'Colunas essenciais não encontradas' };
  }

  const idx = _getIndex_(sh, headers);
  const candidateIds = JSON.parse(params.candidateIds);
  let updated = 0;

  candidateIds.forEach(cpf => {
    const row = idx[String(cpf).trim()];
    if (row) {
      const currentRow = sh.getRange(row, 1, 1, headers.length).getValues()[0];

      currentRow[entrevistadorCol] = params.interviewerId;
      if (statusEntrevistaCol >= 0) {
        currentRow[statusEntrevistaCol] = 'alocado';
      }
      if (dataEntrevistaCol >= 0 && params.interviewDate) {
        currentRow[dataEntrevistaCol] = params.interviewDate;
      }

      _writeWholeRow_(sh, row, currentRow);
      updated++;
    }
  });

  if (updated > 0) {
    _bumpRev_();
  }

  return { success: true, updated: updated };
}

function updateInterviewStatus(params) {
  const sh = _sheet(SHEET_CANDIDATOS);
  const headers = _getHeaders_(sh);
  const col = _colMap_(headers);

  const idx = _getIndex_(sh, headers);
  const searchKey = String(params.registrationNumber).trim();
  const row = idx[searchKey];

  if (!row) {
    return { success: false, error: 'Candidato não encontrado' };
  }

  const currentRow = sh.getRange(row, 1, 1, headers.length).getValues()[0];

  const statusEntrevistaCol = col['status_entrevista'];

  if (statusEntrevistaCol >= 0) {
    currentRow[statusEntrevistaCol] = params.status;
  }

  _writeWholeRow_(sh, row, currentRow);
  _bumpRev_();

  return { success: true };
}

function saveInterviewEvaluation(params) {
  const sh = _sheet(SHEET_CANDIDATOS);
  const headers = _getHeaders_(sh);
  const col = _colMap_(headers);

  const idx = _getIndex_(sh, headers);
  const searchKey = String(params.registrationNumber).trim();
  const row = idx[searchKey];

  if (!row) {
    return { success: false, error: 'Candidato não encontrado' };
  }

  const currentRow = sh.getRange(row, 1, 1, headers.length).getValues()[0];

  const avaliacaoCol = col['avaliacao_entrevista'];
  const statusEntrevistaCol = col['status_entrevista'];
  const statusGeralCol = col['Status'];

  if (avaliacaoCol >= 0) {
    currentRow[avaliacaoCol] = params.evaluation || '';
  }

  if (statusEntrevistaCol >= 0) {
    currentRow[statusEntrevistaCol] = params.result;
  }

  if (statusGeralCol >= 0 && params.result === 'aprovado') {
    currentRow[statusGeralCol] = 'aprovado';
  } else if (statusGeralCol >= 0 && params.result === 'reprovado') {
    currentRow[statusGeralCol] = 'desclassificado';
  }

  _writeWholeRow_(sh, row, currentRow);
  _bumpRev_();

  return { success: true };
}

// ==================== FUNÇÕES DE MENSAGENS ====================

function initMensagensSheet() {
  const sh = _sheet(SHEET_MENSAGENS);
  if (!sh) return;

  const headers = _getHeaders_(sh);
  if (headers.length === 0) {
    sh.getRange(1, 1, 1, 7).setValues([
      ['Timestamp', 'CPF', 'Nome', 'Tipo', 'Destinatário', 'Status', 'Mensagem']
    ]);
  }
}

function logMessage(params) {
  initMensagensSheet();
  const sh = _sheet(SHEET_MENSAGENS);
  if (!sh) return { success: false };

  sh.appendRow([
    getCurrentTimestamp(),
    params.cpf || '',
    params.name || '',
    params.type || '',
    params.recipient || '',
    params.status || '',
    params.message || ''
  ]);

  return { success: true };
}

function updateMessageStatus(params) {
  if (!params.cpf || !params.messageType) {
    return { success: false, error: 'Parâmetros inválidos' };
  }

  _updateMessageStatusInCandidates_(params.cpf, params.messageType);
  _bumpRev_();

  return { success: true };
}

function _updateMessageStatusInCandidates_(cpf, messageType) {
  const sh = _sheet(SHEET_CANDIDATOS);
  const headers = _getHeaders_(sh);
  const col = _colMap_(headers);

  const idx = _getIndex_(sh, headers);
  const row = idx[String(cpf).trim()];

  if (!row) return;

  const currentRow = sh.getRange(row, 1, 1, headers.length).getValues()[0];

  if (messageType === 'email' && col['EMAIL_SENT'] >= 0) {
    currentRow[col['EMAIL_SENT']] = 'Sim';
  } else if (messageType === 'sms' && col['SMS_SENT'] >= 0) {
    currentRow[col['SMS_SENT']] = 'Sim';
  }

  _writeWholeRow_(sh, row, currentRow);
}

function sendMessages(params) {
  // Implementação de envio de mensagens
  // Esta função requer configuração de email/SMS
  return { success: true, sent: 0 };
}

function getMessageTemplates(params) {
  const { sheet, headers, values } = _readSheetBlock_(SHEET_TEMPLATES);

  if (!sheet || !values.length) {
    return { templates: [] };
  }

  const templates = values.map(row => ({
    type: row[0],
    subject: row[1],
    body: row[2]
  }));

  return { templates: templates };
}

// ==================== FUNÇÕES DE RELATÓRIOS ====================

function getReportStats(params) {
  const allData = getCandidates({});
  const candidates = allData.candidates || [];

  const stats = {
    total: candidates.length,
    pendente: 0,
    em_analise: 0,
    classificado: 0,
    desclassificado: 0,
    entrevista: 0,
    aprovado: 0
  };

  candidates.forEach(c => {
    const status = String(c.Status || '').toLowerCase();
    if (stats.hasOwnProperty(status)) {
      stats[status]++;
    }
  });

  return stats;
}

function getReport(params) {
  const allData = getCandidates({});
  const candidates = allData.candidates || [];

  const report = {
    total: candidates.length,
    byStatus: {},
    byAnalyst: {},
    byInterviewer: {},
    byArea: {}
  };

  candidates.forEach(c => {
    const status = c.Status || 'pendente';
    const analyst = c.assigned_to || 'Não alocado';
    const interviewer = c.entrevistador || 'Não alocado';
    const area = c.AREAATUACAO || 'Sem área';

    report.byStatus[status] = (report.byStatus[status] || 0) + 1;
    report.byAnalyst[analyst] = (report.byAnalyst[analyst] || 0) + 1;
    report.byInterviewer[interviewer] = (report.byInterviewer[interviewer] || 0) + 1;
    report.byArea[area] = (report.byArea[area] || 0) + 1;
  });

  return report;
}

// ==================== FUNÇÕES DE CONFIGURAÇÃO ====================

function getDisqualificationReasons() {
  const { sheet, headers, values } = _readSheetBlock_(SHEET_MOTIVOS);

  if (!sheet || !values.length) {
    return {
      reasons: [
        'Não atende requisitos mínimos',
        'Experiência insuficiente',
        'Formação incompatível',
        'Documentação incompleta',
        'Outro'
      ]
    };
  }

  const reasons = values.map(row => row[0]).filter(r => r);
  return { reasons: reasons };
}

function getSpreadsheet() {
  return {
    id: SPREADSHEET_ID,
    name: _ss().getName(),
    url: _ss().getUrl()
  };
}

function getCurrentTimestamp() {
  return Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    'dd/MM/yyyy HH:mm:ss'
  );
}

function testConnection() {
  return {
    success: true,
    message: 'Conexão OK',
    timestamp: getCurrentTimestamp(),
    spreadsheetId: SPREADSHEET_ID
  };
}

// ==================== FUNÇÕES DE INICIALIZAÇÃO ====================

function initUsuariosSheet() {
  const sh = _sheet(SHEET_USUARIOS);
  if (!sh) return;

  const headers = _getHeaders_(sh);
  if (headers.length === 0) {
    sh.getRange(1, 1, 1, 4).setValues([
      ['email', 'name', 'role', 'active']
    ]);
  }
}

function initMotivosSheet() {
  const sh = _sheet(SHEET_MOTIVOS);
  if (!sh) return;

  const headers = _getHeaders_(sh);
  if (headers.length === 0) {
    sh.getRange(1, 1, 1, 1).setValues([['Motivo']]);
    sh.getRange(2, 1, 5, 1).setValues([
      ['Não atende requisitos mínimos'],
      ['Experiência insuficiente'],
      ['Formação incompatível'],
      ['Documentação incompleta'],
      ['Outro']
    ]);
  }
}

function initTemplatesSheet() {
  const sh = _sheet(SHEET_TEMPLATES);
  if (!sh) return;

  const headers = _getHeaders_(sh);
  if (headers.length === 0) {
    sh.getRange(1, 1, 1, 3).setValues([
      ['Tipo', 'Assunto', 'Mensagem']
    ]);
  }
}
