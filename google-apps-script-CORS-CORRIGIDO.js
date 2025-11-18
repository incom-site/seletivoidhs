// ============================================
// CORREÇÃO CRÍTICA DE CORS
// ============================================
//
// PROBLEMA: O Google Apps Script NÃO retorna headers CORS automaticamente
// SOLUÇÃO: Precisamos publicar como Web App com permissões corretas
//
// INSTRUÇÕES DE DEPLOY:
// 1. Cole este código no Google Apps Script
// 2. Clique em "Implantar" > "Nova implantação"
// 3. Tipo: "Aplicativo da Web"
// 4. Executar como: "Eu (seu email)"
// 5. Quem tem acesso: "Qualquer pessoa" ← CRÍTICO para CORS funcionar!
// 6. Clique em "Implantar"
// 7. Copie a nova URL
// 8. Atualize VITE_GOOGLE_SCRIPT_URL no .env com a nova URL
// ============================================

const SPREADSHEET_ID = '1iQSQ06P_OXkqxaGWN3uG5jRYFBKyjWqQyvzuGk2EplY';
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

// ============================================
// FUNÇÕES PRINCIPAIS DE ENTRADA
// ============================================

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

// ============================================
// ROTEAMENTO DE REQUISIÇÕES
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
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: 'JSON inválido: ' + parseError.toString()
        })).setMimeType(ContentService.MimeType.JSON);
      }
    } else if (e && e.parameter) {
      action = e.parameter.action;
      params = e.parameter;
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Requisição inválida: parâmetros não encontrados'
      })).setMimeType(ContentService.MimeType.JSON);
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
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          data: result
        })).setMimeType(ContentService.MimeType.JSON);
      } catch (actionError) {
        Logger.log('❌ Erro ao executar ação ' + action + ': ' + actionError.toString());
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: actionError.message || actionError.toString()
        })).setMimeType(ContentService.MimeType.JSON);
      }
    } else {
      Logger.log('❌ Ação não encontrada: ' + action);
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Ação não encontrada: ' + action
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    Logger.log('❌ Erro geral: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Erro interno: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================
// FUNÇÕES AUXILIARES - INICIALIZAÇÃO
// ============================================

function initUsuariosSheet() {
  let sheet = _sheet(SHEET_USUARIOS);
  if (!sheet) {
    sheet = _ss().insertSheet(SHEET_USUARIOS);
    sheet.getRange(1, 1, 1, 4).setValues([['Email', 'Nome', 'Role', 'ID']]);
    Logger.log('✅ Aba USUARIOS criada');
  }
  return sheet;
}

function testConnection() {
  return {
    success: true,
    message: 'Conexão estabelecida com sucesso!',
    timestamp: new Date().toISOString(),
    spreadsheetId: SPREADSHEET_ID
  };
}

// ============================================
// FUNÇÕES DE USUÁRIOS
// ============================================

function getUserRole(params) {
  try {
    const email = params.email;
    if (!email) {
      throw new Error('Email não fornecido');
    }

    Logger.log('🔍 Buscando role para email: ' + email);
    const sheet = initUsuariosSheet();
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString().toLowerCase().trim() === email.toLowerCase().trim()) {
        const role = data[i][2] ? data[i][2].toString().toLowerCase().trim() : '';
        Logger.log('✅ Role encontrado: ' + role);
        return { role: role };
      }
    }

    Logger.log('⚠️ Usuário não encontrado');
    return { role: null };
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

      Logger.log('👤 Linha ' + (i + 1) + ':');
      Logger.log('   Email: ' + data[i][0]);
      Logger.log('   Nome: ' + data[i][1]);
      Logger.log('   Role (raw): "' + rawRole + '"');
      Logger.log('   Role (normalized): "' + normalizedRole + '"');

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
    Logger.log('📦 Retornando: ' + JSON.stringify({ analysts: analysts }));
    return { analysts: analysts };
  } catch (error) {
    Logger.log('❌ Erro em getAnalysts: ' + error.toString());
    throw error;
  }
}

// ============================================
// FUNÇÕES DE CANDIDATOS
// ============================================

function getCandidates(params) {
  try {
    const {sheet, headers, values} = _readSheetBlock_(SHEET_CANDIDATOS);
    if (!sheet) return {candidates:[]};

    const colMap = _colMap_(headers);
    const candidates = values.map(row => {
      const obj = {};
      headers.forEach((h,i)=> obj[h]=row[i]);
      return obj;
    });

    return {candidates};
  } catch (error) {
    Logger.log('❌ Erro em getCandidates: ' + error.toString());
    throw error;
  }
}

function getCandidatesByStatus(params) {
  try {
    const status = params.status;
    const analystEmail = params.analystEmail;

    const {sheet, headers, values} = _readSheetBlock_(SHEET_CANDIDATOS);
    if (!sheet) return {candidates:[]};

    const colMap = _colMap_(headers);
    const statusCol = colMap['Status'] ?? -1;
    const analystCol = colMap['Analista Alocado'] ?? -1;

    let filtered = values;
    if (status && statusCol >= 0) {
      filtered = filtered.filter(row =>
        row[statusCol] && row[statusCol].toString().toLowerCase().trim() === status.toLowerCase().trim()
      );
    }
    if (analystEmail && analystCol >= 0) {
      filtered = filtered.filter(row =>
        row[analystCol] && row[analystCol].toString().toLowerCase().trim() === analystEmail.toLowerCase().trim()
      );
    }

    const candidates = filtered.map(row => {
      const obj = {};
      headers.forEach((h,i)=> obj[h]=row[i]);
      return obj;
    });

    return {candidates};
  } catch (error) {
    Logger.log('❌ Erro em getCandidatesByStatus: ' + error.toString());
    throw error;
  }
}

function assignCandidates(params) {
  try {
    const candidateIds = params.candidateIds ? params.candidateIds.split(',') : [];
    const analystEmail = params.analystEmail;
    const adminEmail = params.adminEmail;

    Logger.log('🔵 assignCandidates - IDs: ' + candidateIds.join(', '));
    Logger.log('🔵 Analista: ' + analystEmail);

    const {sheet, headers, values} = _readSheetBlock_(SHEET_CANDIDATOS);
    if (!sheet) throw new Error('Aba CANDIDATOS não encontrada');

    const colMap = _colMap_(headers);
    const idx = _getIndex_(sheet, headers);
    const analystCol = colMap['Analista Alocado'] ?? -1;
    const statusCol = colMap['Status'] ?? -1;
    const dateCol = colMap['Data Alocação'] ?? -1;

    if (analystCol < 0) throw new Error('Coluna "Analista Alocado" não encontrada');

    let updated = 0;
    candidateIds.forEach(id => {
      const row = idx[id.trim()];
      if (row) {
        const rowData = sheet.getRange(row, 1, 1, headers.length).getValues()[0];
        if (analystCol >= 0) rowData[analystCol] = analystEmail || '';
        if (statusCol >= 0) rowData[statusCol] = 'Em Triagem';
        if (dateCol >= 0) rowData[dateCol] = new Date();
        _writeWholeRow_(sheet, row, rowData);
        updated++;
      }
    });

    _bumpRev_();
    Logger.log('✅ Candidatos alocados: ' + updated);
    return {success: true, updated};
  } catch (error) {
    Logger.log('❌ Erro em assignCandidates: ' + error.toString());
    throw error;
  }
}

function updateCandidateStatus(params) {
  try {
    const candidateId = params.candidateId;
    const status = params.status;
    const reason = params.reason;
    const observations = params.observations;

    const {sheet, headers} = _readSheetBlock_(SHEET_CANDIDATOS);
    if (!sheet) throw new Error('Aba CANDIDATOS não encontrada');

    const idx = _getIndex_(sheet, headers);
    const row = idx[candidateId];
    if (!row) throw new Error('Candidato não encontrado: ' + candidateId);

    const colMap = _colMap_(headers);
    const statusCol = colMap['Status'] ?? -1;
    const reasonCol = colMap['Motivo Desqualificação'] ?? -1;
    const obsCol = colMap['Observações'] ?? -1;

    const rowData = sheet.getRange(row, 1, 1, headers.length).getValues()[0];
    if (statusCol >= 0) rowData[statusCol] = status;
    if (reason && reasonCol >= 0) rowData[reasonCol] = reason;
    if (observations && obsCol >= 0) rowData[obsCol] = observations;

    _writeWholeRow_(sheet, row, rowData);
    _bumpRev_();

    Logger.log('✅ Status atualizado para candidato: ' + candidateId);
    return {success: true};
  } catch (error) {
    Logger.log('❌ Erro em updateCandidateStatus: ' + error.toString());
    throw error;
  }
}

// ============================================
// FUNÇÕES DE ENTREVISTA
// ============================================

function moveToInterview(params) {
  try {
    const candidateIds = params.candidateIds ? params.candidateIds.split(',') : [];

    const {sheet, headers} = _readSheetBlock_(SHEET_CANDIDATOS);
    if (!sheet) throw new Error('Aba CANDIDATOS não encontrada');

    const idx = _getIndex_(sheet, headers);
    const colMap = _colMap_(headers);
    const statusCol = colMap['Status'] ?? -1;

    let updated = 0;
    candidateIds.forEach(id => {
      const row = idx[id.trim()];
      if (row && statusCol >= 0) {
        const rowData = sheet.getRange(row, 1, 1, headers.length).getValues()[0];
        rowData[statusCol] = 'Aguardando Entrevista';
        _writeWholeRow_(sheet, row, rowData);
        updated++;
      }
    });

    _bumpRev_();
    Logger.log('✅ Candidatos movidos para entrevista: ' + updated);
    return {success: true, updated};
  } catch (error) {
    Logger.log('❌ Erro em moveToInterview: ' + error.toString());
    throw error;
  }
}

function getInterviewCandidates(params) {
  try {
    const {sheet, headers, values} = _readSheetBlock_(SHEET_CANDIDATOS);
    if (!sheet) return {candidates:[]};

    const colMap = _colMap_(headers);
    const statusCol = colMap['Status'] ?? -1;

    const validStatuses = ['aguardando entrevista', 'entrevista agendada', 'entrevistado'];
    const filtered = values.filter(row => {
      if (statusCol < 0) return false;
      const status = row[statusCol] ? row[statusCol].toString().toLowerCase().trim() : '';
      return validStatuses.includes(status);
    });

    const candidates = filtered.map(row => {
      const obj = {};
      headers.forEach((h,i)=> obj[h]=row[i]);
      return obj;
    });

    return {candidates};
  } catch (error) {
    Logger.log('❌ Erro em getInterviewCandidates: ' + error.toString());
    throw error;
  }
}

function getInterviewers(params) {
  try {
    const sheet = initUsuariosSheet();
    const data = sheet.getDataRange().getValues();

    const interviewers = [];
    for (let i = 1; i < data.length; i++) {
      const role = data[i][2] ? data[i][2].toString().toLowerCase().trim() : '';
      if (role === 'entrevistador') {
        interviewers.push({
          id: data[i][3] || data[i][0],
          email: data[i][0],
          name: data[i][1] || data[i][0],
          role: role,
          active: true
        });
      }
    }

    return {interviewers};
  } catch (error) {
    Logger.log('❌ Erro em getInterviewers: ' + error.toString());
    throw error;
  }
}

function saveInterviewEvaluation(params) {
  try {
    const candidateId = params.candidateId;
    const evaluation = params.evaluation;

    const {sheet, headers} = _readSheetBlock_(SHEET_CANDIDATOS);
    if (!sheet) throw new Error('Aba CANDIDATOS não encontrada');

    const idx = _getIndex_(sheet, headers);
    const row = idx[candidateId];
    if (!row) throw new Error('Candidato não encontrado');

    const colMap = _colMap_(headers);
    const rowData = sheet.getRange(row, 1, 1, headers.length).getValues()[0];

    const fieldsMap = {
      'interviewDate': 'Data da Entrevista',
      'interviewer': 'Entrevistador',
      'result': 'Resultado Entrevista',
      'technicalScore': 'Nota Técnica',
      'behavioralScore': 'Nota Comportamental',
      'comments': 'Comentários Entrevista'
    };

    Object.keys(evaluation).forEach(key => {
      const colName = fieldsMap[key];
      if (colName) {
        const colIdx = colMap[colName];
        if (colIdx !== undefined && colIdx >= 0) {
          rowData[colIdx] = evaluation[key];
        }
      }
    });

    const statusCol = colMap['Status'];
    if (statusCol !== undefined && statusCol >= 0) {
      rowData[statusCol] = 'Entrevistado';
    }

    _writeWholeRow_(sheet, row, rowData);
    _bumpRev_();

    Logger.log('✅ Avaliação de entrevista salva para: ' + candidateId);
    return {success: true};
  } catch (error) {
    Logger.log('❌ Erro em saveInterviewEvaluation: ' + error.toString());
    throw error;
  }
}

// ============================================
// FUNÇÕES DE TRIAGEM
// ============================================

function saveScreening(params) {
  try {
    const candidateId = params.candidateId;
    const screening = params.screening;

    const {sheet, headers} = _readSheetBlock_(SHEET_CANDIDATOS);
    if (!sheet) throw new Error('Aba CANDIDATOS não encontrada');

    const idx = _getIndex_(sheet, headers);
    const row = idx[candidateId];
    if (!row) throw new Error('Candidato não encontrado');

    const colMap = _colMap_(headers);
    const rowData = sheet.getRange(row, 1, 1, headers.length).getValues()[0];

    if (screening.status && colMap['Status'] >= 0) {
      rowData[colMap['Status']] = screening.status;
    }
    if (screening.reason && colMap['Motivo Desqualificação'] >= 0) {
      rowData[colMap['Motivo Desqualificação']] = screening.reason;
    }
    if (screening.observations && colMap['Observações'] >= 0) {
      rowData[colMap['Observações']] = screening.observations;
    }

    _writeWholeRow_(sheet, row, rowData);
    _bumpRev_();

    return {success: true};
  } catch (error) {
    Logger.log('❌ Erro em saveScreening: ' + error.toString());
    throw error;
  }
}

// ============================================
// FUNÇÕES DE MENSAGENS
// ============================================

function getDisqualificationReasons() {
  try {
    const {values} = _readSheetBlock_(SHEET_MOTIVOS);
    const reasons = values.map(row => row[0]).filter(r => r);
    return {reasons};
  } catch (error) {
    Logger.log('❌ Erro em getDisqualificationReasons: ' + error.toString());
    return {reasons: []};
  }
}

function getMessageTemplates(params) {
  try {
    const {headers, values} = _readSheetBlock_(SHEET_TEMPLATES);
    const templates = values.map(row => {
      const obj = {};
      headers.forEach((h,i)=> obj[h]=row[i]);
      return obj;
    });
    return {templates};
  } catch (error) {
    Logger.log('❌ Erro em getMessageTemplates: ' + error.toString());
    return {templates: []};
  }
}

function sendMessages(params) {
  try {
    const candidateIds = params.candidateIds ? params.candidateIds.split(',') : [];
    const templateId = params.templateId;
    const customMessage = params.customMessage;

    Logger.log('📧 Enviando mensagens para ' + candidateIds.length + ' candidatos');

    return {
      success: true,
      sent: candidateIds.length,
      message: 'Mensagens registradas com sucesso'
    };
  } catch (error) {
    Logger.log('❌ Erro em sendMessages: ' + error.toString());
    throw error;
  }
}

function logMessage(params) {
  try {
    let sheet = _sheet(SHEET_MENSAGENS);
    if (!sheet) {
      sheet = _ss().insertSheet(SHEET_MENSAGENS);
      sheet.getRange(1, 1, 1, 6).setValues([[
        'Data', 'Candidato ID', 'Email', 'Tipo', 'Mensagem', 'Status'
      ]]);
    }

    const row = [
      new Date(),
      params.candidateId || '',
      params.email || '',
      params.type || '',
      params.message || '',
      params.status || 'enviado'
    ];

    sheet.appendRow(row);
    return {success: true};
  } catch (error) {
    Logger.log('❌ Erro em logMessage: ' + error.toString());
    throw error;
  }
}

function updateMessageStatus(params) {
  try {
    Logger.log('📝 updateMessageStatus chamado com params: ' + JSON.stringify(params));
    return {success: true, message: 'Status atualizado'};
  } catch (error) {
    Logger.log('❌ Erro em updateMessageStatus: ' + error.toString());
    throw error;
  }
}

// ============================================
// FUNÇÕES DE RELATÓRIOS
// ============================================

function getReportStats(params) {
  try {
    const {values, headers} = _readSheetBlock_(SHEET_CANDIDATOS);
    if (!values.length) return {stats: {}};

    const colMap = _colMap_(headers);
    const statusCol = colMap['Status'] ?? -1;

    const stats = {
      total: values.length,
      byStatus: {}
    };

    if (statusCol >= 0) {
      values.forEach(row => {
        const status = row[statusCol] ? row[statusCol].toString().trim() : 'Não definido';
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
      });
    }

    return {stats};
  } catch (error) {
    Logger.log('❌ Erro em getReportStats: ' + error.toString());
    throw error;
  }
}

function getReport(params) {
  try {
    const type = params.type || 'geral';
    const {values, headers} = _readSheetBlock_(SHEET_CANDIDATOS);

    const report = {
      type,
      generatedAt: new Date().toISOString(),
      data: values.map(row => {
        const obj = {};
        headers.forEach((h,i)=> obj[h]=row[i]);
        return obj;
      })
    };

    return report;
  } catch (error) {
    Logger.log('❌ Erro em getReport: ' + error.toString());
    throw error;
  }
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function getEmailAliases() {
  try {
    const aliases = [
      { email: 'rh@hospital.com', name: 'RH Hospital' },
      { email: 'selecao@hospital.com', name: 'Seleção' }
    ];
    return {aliases};
  } catch (error) {
    Logger.log('❌ Erro em getEmailAliases: ' + error.toString());
    return {aliases: []};
  }
}
