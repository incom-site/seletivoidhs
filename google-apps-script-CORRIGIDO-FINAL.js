// ============================================
// GOOGLE APPS SCRIPT - VERSÃO CORRIGIDA
// Compatível com o sistema frontend
// ============================================

const CACHE_TTL = 60;
const CACHE_KEYS = {
  REPORT_DATA: 'report_data_v3',
  USERS: 'users_data_v3',
  STATS: 'stats_data_v3',
  INTERVIEWERS: 'interviewers_v3',
  REASONS: 'disqualification_reasons_v3'
};

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
      console.warn('Cache parse error:', e);
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
      console.warn('Cache set error:', error);
      return false;
    }
  }

  static getWithFallback(key, fetchFunction, ttl = CACHE_TTL) {
    let data = this.get(key);

    if (data !== null) {
      console.log('Cache hit:', key);
      return data;
    }

    const lock = this.getLock();

    if (lock.tryLock(10000)) {
      try {
        data = this.get(key);
        if (data !== null) {
          console.log('Cache hit após lock:', key);
          return data;
        }

        console.log('Cache miss + lock adquirido - executando fetch:', key);
        data = fetchFunction();

        this.set(key, data, ttl);
        console.log('Cache atualizado com sucesso:', key);
      } catch (error) {
        console.error('Erro crítico no fetchFunction:', error);
      } finally {
        lock.releaseLock();
      }
    } else {
      console.warn('Lock não adquirido, retornando dados antigos ou nulos:', key);
      data = this.get(key) || fetchFunction();
    }

    return data;
  }
}

const SPREADSHEET_ID = '1zXQauzKf5XO8HZY_h8xtth1c6MB5HMJvqD5qHhVfzSE';
const SHEET_USUARIOS = 'USUARIOS';
const SHEET_CANDIDATOS = 'CANDIDATOS';
const SHEET_MOTIVOS = 'MOTIVOS';
const SHEET_MENSAGENS = 'MENSAGENS';
const SHEET_TEMPLATES = 'TEMPLATES';

const HEADER_ROWS = 1;
const COL_ID_PRIMARY = 'CPF';
const COL_ID_ALT = 'Número de Inscrição';
const CACHE_TTL_SEC = 1200;
const PROP_REV_KEY = 'IDX_REV';
const IDX_CACHE_KEY = 'idx:v';

function _ss() { return SpreadsheetApp.openById(SPREADSHEET_ID); }
function _sheet(name){ return _ss().getSheetByName(name); }

function _getHeaders_(sh){
  const lastCol = sh.getLastColumn();
  return (lastCol ? sh.getRange(1,1,1,lastCol).getValues()[0] : []);
}

function _colMap_(headers){
  const m = {};
  headers.forEach((h,i)=> m[h]=i);
  return m;
}

function _getRev_(){
  return PropertiesService.getDocumentProperties().getProperty(PROP_REV_KEY) || '0';
}

function _bumpRev_(){
  const props = PropertiesService.getDocumentProperties();
  const cur = Number(props.getProperty(PROP_REV_KEY) || '0') + 1;
  props.setProperty(PROP_REV_KEY, String(cur));
  return String(cur);
}

function _buildIndex_(sh, headers){
  const lastRow = sh.getLastRow();
  if (lastRow <= HEADER_ROWS) return {};

  const colMap = _colMap_(headers);
  const colCpf = colMap[COL_ID_PRIMARY] ?? -1;
  const colAlt = colMap[COL_ID_ALT] ?? -1;
  const keyCols = [colCpf, colAlt].filter(c => c>=0);
  if (!keyCols.length) return {};

  const values = sh.getRange(HEADER_ROWS+1, 1, lastRow-HEADER_ROWS, sh.getLastColumn()).getValues();
  const idx = {};
  for (let i=0;i<values.length;i++){
    for (const c of keyCols){
      const key = values[i][c];
      if (key) {
        const row = i + HEADER_ROWS + 1;
        idx[String(key).trim()] = row;
      }
    }
  }
  return idx;
}

function _getIndex_(sh, headers){
  const rev = _getRev_();
  const key = `${IDX_CACHE_KEY}${rev}`;
  const cache = CacheService.getDocumentCache();
  const cached = cache.get(key);
  if (cached) return JSON.parse(cached);
  const idx = _buildIndex_(sh, headers);
  cache.put(key, JSON.stringify(idx), CACHE_TTL_SEC);
  return idx;
}

function _readSheetBlock_(name){
  const sh = _sheet(name);
  if (!sh) return {sheet:null, headers:[], values:[]};
  const headers = _getHeaders_(sh);
  const lastRow = sh.getLastRow(), lastCol = sh.getLastColumn();
  if (lastRow <= HEADER_ROWS || lastCol === 0){
    return {sheet:sh, headers, values:[]};
  }
  const values = sh.getRange(HEADER_ROWS+1, 1, lastRow-HEADER_ROWS, lastCol).getValues();
  return {sheet:sh, headers, values};
}

function _writeWholeRow_(sh, row, rowArray){
  const lastCol = sh.getLastColumn();
  sh.getRange(row, 1, 1, lastCol).setValues([rowArray]);
}

function createCorsResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

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
        error: 'Requisição inválida: parâmetros não encontrados'
      });
    }

    Logger.log('🔄 Ação recebida: ' + action);

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
      'updateMessageStatus': () => updateMessageStatus(params),
      'moveToInterview': () => moveToInterview(params),
      'getInterviewCandidates': () => getInterviewCandidates(params),
      'getInterviewers': () => getInterviewers(params),
      'getInterviewerCandidates': () => getInterviewerCandidates(params),
      'allocateToInterviewer': () => allocateToInterviewer(params),
      'updateInterviewStatus': () => updateInterviewStatus(params),
      'saveInterviewEvaluation': () => saveInterviewEvaluation(params),
      'getReportStats': () => getReportStats(params),
      'getReport': () => getReport(params),
      'getEmailAliases': () => getEmailAliases(),
      'saveScreening': () => saveScreening(params),
      'test': () => testConnection()
    };

    if (actions[action]) {
      try {
        const result = actions[action]();
        Logger.log('✅ Resultado: ' + JSON.stringify(result).substring(0, 200));
        return createCorsResponse({ success: true, data: result });
      } catch (actionError) {
        Logger.log('❌ Erro ao executar ação ' + action + ': ' + actionError.toString());
        return createCorsResponse({
          success: false,
          error: actionError.message || actionError.toString()
        });
      }
    } else {
      Logger.log('❌ Ação não encontrada: ' + action);
      return createCorsResponse({
        success: false,
        error: 'Ação não encontrada: ' + action
      });
    }
  } catch (error) {
    Logger.log('❌ Erro no handleRequest: ' + error.toString());
    Logger.log('Stack: ' + error.stack);
    return createCorsResponse({
      success: false,
      error: error.toString(),
      stack: error.stack
    });
  }
}

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getCurrentTimestamp() {
  return new Date().toISOString();
}

// ============================================
// FUNÇÃO CRÍTICA: getCandidates
// ============================================

function getCandidates(params) {
  try {
    Logger.log('📋 getCandidates - Iniciando...');

    const {sheet, headers, values} = _readSheetBlock_(SHEET_CANDIDATOS);

    if (!sheet) {
      Logger.log('❌ Planilha CANDIDATOS não encontrada');
      return { candidates: [] };
    }

    if (!values.length) {
      Logger.log('⚠️ Nenhum candidato na planilha');
      return { candidates: [] };
    }

    Logger.log('✅ Total de linhas: ' + values.length);
    Logger.log('📊 Headers: ' + JSON.stringify(headers));

    const candidates = values.map((row, index) => {
      const obj = {};

      // Mapear todos os campos
      for (let j = 0; j < headers.length; j++) {
        const header = headers[j];
        const value = row[j];

        // Normalizar valores vazios
        if (value === null || value === undefined || value === '') {
          obj[header] = null;
        } else {
          obj[header] = value;
        }
      }

      // ✅ CAMPOS ESSENCIAIS - garantir que sempre existam
      obj.CPF = obj.CPF || obj.cpf || '';
      obj.NOMECOMPLETO = obj.NOMECOMPLETO || obj.nome_completo || obj.full_name || '';
      obj.AREAATUACAO = obj.AREAATUACAO || obj.area || obj.Area || '';
      obj.VAGAPCD = obj.VAGAPCD || obj.vaga_pcd || '';

      // ✅ CAMPOS DE CARGO - essenciais para o sistema
      obj.CARGOADMIN = obj.CARGOADMIN || obj.cargo_administrativo || null;
      obj.CARGOASSIS = obj.CARGOASSIS || obj.cargo_assistencial || null;

      // ✅ CAMPOS DE ALOCAÇÃO - normalizar valores vazios
      const assignedToRaw = obj.assigned_to || obj.Analista || '';
      obj.assigned_to = (assignedToRaw && assignedToRaw.trim() !== '' && assignedToRaw !== 'null' && assignedToRaw !== 'undefined')
        ? assignedToRaw.trim()
        : null;
      obj.Analista = obj.assigned_to; // Manter sincronizado

      // ✅ STATUS
      obj.Status = obj.Status || obj.status || 'pendente';
      obj.status = String(obj.Status).toLowerCase();

      // ✅ OUTROS CAMPOS
      obj.assigned_at = obj.assigned_at || null;
      obj.assigned_by = obj.assigned_by || null;
      obj.DataCadastro = obj.DataCadastro || obj.created_at || null;

      // Log apenas dos primeiros 3 candidatos para debug
      if (index < 3) {
        Logger.log(`Candidato ${index + 1}:`);
        Logger.log(`  CPF: ${obj.CPF}`);
        Logger.log(`  Nome: ${obj.NOMECOMPLETO}`);
        Logger.log(`  Área: ${obj.AREAATUACAO}`);
        Logger.log(`  CARGOADMIN: ${obj.CARGOADMIN}`);
        Logger.log(`  CARGOASSIS: ${obj.CARGOASSIS}`);
        Logger.log(`  assigned_to: "${obj.assigned_to}"`);
        Logger.log(`  Status: ${obj.Status}`);
      }

      return obj;
    });

    Logger.log('✅ Total de candidatos processados: ' + candidates.length);

    // ✅ RETORNAR NO FORMATO CORRETO
    return { candidates: candidates };

  } catch (error) {
    Logger.log('❌ Erro em getCandidates: ' + error.toString());
    Logger.log('Stack: ' + error.stack);
    throw error;
  }
}

// ============================================
// RESTO DAS FUNÇÕES (mantidas do script original)
// ============================================

function initUsuariosSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_USUARIOS);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_USUARIOS);
    sheet.getRange('A1:D1').setValues([['Email', 'Nome', 'Role', 'ID']]);
    const defaultUsers = [
      ['admin@email.com', 'Administrador', 'admin', 'admin@email.com'],
      ['analista@email.com', 'Analista', 'analista', 'analista@email.com']
    ];
    sheet.getRange(2, 1, defaultUsers.length, 4).setValues(defaultUsers);
    sheet.getRange('A1:D1').setFontWeight('bold').setBackground('#4285f4').setFontColor('#ffffff');
  }
  return sheet;
}

function getUserRole(params) {
  try {
    const sheet = initUsuariosSheet();
    const data = sheet.getDataRange().getValues();
    const emailToFind = params.email ? params.email.toLowerCase().trim() : '';

    if (!emailToFind) {
      throw new Error('Email é obrigatório');
    }

    Logger.log('🔍 Procurando usuário: ' + emailToFind);

    for (let i = 1; i < data.length; i++) {
      const emailInSheet = data[i][0] ? data[i][0].toLowerCase().trim() : '';
      if (emailInSheet === emailToFind) {
        const rawRole = data[i][2];
        const normalizedRole = rawRole ? String(rawRole).toLowerCase().trim() : '';

        Logger.log('✅ Usuário encontrado: ' + emailInSheet + ' | Role: ' + normalizedRole);

        return {
          email: data[i][0],
          name: data[i][1] || data[i][0],
          role: normalizedRole,
          id: data[i][3] || data[i][0],
          active: true
        };
      }
    }

    Logger.log('❌ Usuário não encontrado: ' + emailToFind);
    throw new Error('Usuário não encontrado');
  } catch (error) {
    Logger.log('❌ Erro em getUserRole: ' + error.toString());
    throw error;
  }
}

function getAnalysts(params) {
  try {
    Logger.log('🔍 getAnalysts - Iniciando busca de analistas');
    const sheet = initUsuariosSheet();
    const data = sheet.getDataRange().getValues();
    Logger.log('📊 Total de linhas na planilha USUARIOS: ' + data.length);

    const analysts = [];

    for (let i = 1; i < data.length; i++) {
      const rawRole = data[i][2];
      const normalizedRole = rawRole ? String(rawRole).toLowerCase().trim() : '';

      if (normalizedRole === 'analista') {
        const analyst = {
          id: data[i][3] || data[i][0],
          email: data[i][0],
          name: data[i][1] || data[i][0],
          role: normalizedRole,
          active: true
        };
        analysts.push(analyst);
        Logger.log('✅ Analista encontrado: ' + analyst.email);
      }
    }

    Logger.log('📋 Total de analistas encontrados: ' + analysts.length);
    return { analysts: analysts };
  } catch (error) {
    Logger.log('❌ Erro em getAnalysts: ' + error.toString());
    throw error;
  }
}

function assignCandidates(params) {
  const sh = _sheet(SHEET_CANDIDATOS);
  const headers = _getHeaders_(sh);
  const col = _colMap_(headers);

  const cpfCol        = col['CPF'];
  const assignedToCol = col['assigned_to'];
  const assignedByCol = col['assigned_by'];
  const assignedAtCol = col['assigned_at'];
  const statusCol     = col['Status'];
  const analistaCol   = col['Analista']; // ✅ ADICIONAR Analista

  if (cpfCol == null) throw new Error('Coluna CPF não encontrada');

  const lastRow = sh.getLastRow();
  if (lastRow <= HEADER_ROWS) {
    return { success: true, assignedCount: 0, message: 'Nada para alocar' };
  }

  const n = lastRow - HEADER_ROWS;
  const cpfs = sh.getRange(HEADER_ROWS+1, cpfCol+1, n, 1).getValues().map(r=> String(r[0]).trim());
  const assignedTo = assignedToCol!=null ? sh.getRange(HEADER_ROWS+1, assignedToCol+1, n, 1).getValues() : null;
  const analista = analistaCol!=null ? sh.getRange(HEADER_ROWS+1, analistaCol+1, n, 1).getValues() : null; // ✅ Ler Analista
  const assignedBy = assignedByCol!=null ? sh.getRange(HEADER_ROWS+1, assignedByCol+1, n, 1).getValues() : null;
  const assignedAt = assignedAtCol!=null ? sh.getRange(HEADER_ROWS+1, assignedAtCol+1, n, 1).getValues() : null;
  const status     = statusCol!=null     ? sh.getRange(HEADER_ROWS+1, statusCol+1, n, 1).getValues()     : null;

  const target = String(params.candidateIds || '').split(',').map(s=>s.trim()).filter(Boolean);
  const stamp = getCurrentTimestamp();
  const analystEmail = params.analystEmail || '';
  let count = 0;

  const pos = new Map();
  for (let i=0;i<cpfs.length;i++) pos.set(cpfs[i], i);

  for (const id of target){
    const i = pos.get(id);
    if (i==null) continue;

    // ✅ ATUALIZAR AMBOS: assigned_to E Analista
    if (assignedTo) assignedTo[i][0] = analystEmail;
    if (analista) analista[i][0] = analystEmail; // ✅ Sincronizar
    if (assignedBy) assignedBy[i][0] = params.adminEmail || '';
    if (assignedAt) assignedAt[i][0] = stamp;
    if (status)     status[i][0]     = 'em_analise';
    count++;
  }

  if (assignedTo) sh.getRange(HEADER_ROWS+1, assignedToCol+1, n, 1).setValues(assignedTo);
  if (analista) sh.getRange(HEADER_ROWS+1, analistaCol+1, n, 1).setValues(analista); // ✅ Salvar Analista
  if (assignedBy) sh.getRange(HEADER_ROWS+1, assignedByCol+1, n, 1).setValues(assignedBy);
  if (assignedAt) sh.getRange(HEADER_ROWS+1, assignedAtCol+1, n, 1).setValues(assignedAt);
  if (status)     sh.getRange(HEADER_ROWS+1, statusCol+1, n, 1).setValues(status);

  return { success: true, assignedCount: count, message: `${count} candidatos alocados com sucesso` };
}

// ============================================
// ADICIONE TODAS AS OUTRAS FUNÇÕES DO SCRIPT ORIGINAL AQUI
// (updateCandidateStatus, getCandidatesByStatus, etc.)
// Mantenha exatamente como está no script original
// ============================================

function testConnection() {
  return {
    status: 'OK',
    timestamp: getCurrentTimestamp(),
    spreadsheetId: SPREADSHEET_ID
  };
}
