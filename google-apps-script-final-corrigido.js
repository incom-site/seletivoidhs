// ============================================
// GOOGLE APPS SCRIPT - SISTEMA DE TRIAGEM COMPLETO
// VERSÃO CORRIGIDA - CORS E FETCH RESOLVIDOS
// ============================================

const SPREADSHEET_ID = '1iQSQ06P_OXkqxaGWN3uG5jRYFBKyjWqQyvzuGk2EplY';
const SHEET_USUARIOS = 'USUARIOS';
const SHEET_CANDIDATOS = 'CANDIDATOS';
const SHEET_MOTIVOS = 'MOTIVOS';
const SHEET_MENSAGENS = 'MENSAGENS';
const SHEET_TEMPLATES = 'TEMPLATES';
const SHEET_ALIASES = 'ALIASES';

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
// CORS HEADERS - CORREÇÃO DEFINITIVA
// ============================================

function createCorsResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
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
      'getEmailAliases': () => getEmailAliases(params),
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
// FUNÇÕES DE USUÁRIOS
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
  const sheet = initUsuariosSheet();
  const data = sheet.getDataRange().getValues();
  const analysts = [];

  for (let i = 1; i < data.length; i++) {
    const rawRole = data[i][2];
    const normalizedRole = rawRole ? String(rawRole).toLowerCase().trim() : '';
    if (normalizedRole === 'analista') {
      analysts.push({
        id: data[i][3] || data[i][0],
        email: data[i][0],
        name: data[i][1] || data[i][0],
        role: normalizedRole,
        active: true
      });
    }
  }
  return { analysts: analysts };
}

// ============================================
// FUNÇÕES DE CANDIDATOS
// ============================================

function getCandidates(params) {
  const {sheet, headers, values} = _readSheetBlock_(SHEET_CANDIDATOS);
  if (!sheet || !values.length) return { candidates: [] };

  const out = values.map(row => {
    const obj = {};
    for (let j = 0; j < headers.length; j++) obj[headers[j]] = row[j];
    return obj;
  });
  return { candidates: out };
}

function updateCandidateStatus(params) {
  const sh = _sheet(SHEET_CANDIDATOS);
  const headers = _getHeaders_(sh);
  const col = _colMap_(headers);

  const statusCol  = col['Status'];
  const cpfCol     = col['CPF'];
  const regNumCol  = (col['Número de Inscrição'] ?? col['NUMEROINSCRICAO']);
  const analystCol = (col['Analista'] ?? col['assigned_to']);
  const dateCol    = (col['Data Triagem'] ?? col['data_hora_triagem']);
  const reasonCol  = col['Motivo Desclassificação'];
  const notesCol   = (col['Observações'] ?? col['screening_notes']);

  const idx = _getIndex_(sh, headers);
  const searchKey = String(params.registrationNumber).trim();
  let row = idx[searchKey];

  const checkMismatch =
    row &&
    (
      (cpfCol>=0 && String(sh.getRange(row, cpfCol+1).getValue()).trim() !== searchKey) &&
      (regNumCol>=0 && String(sh.getRange(row, regNumCol+1).getValue()).trim() !== searchKey)
    );

  if (!row || checkMismatch){
    const newIdx = _buildIndex_(sh, headers);
    const rev = _getRev_();
    CacheService.getDocumentCache().put(`${IDX_CACHE_KEY}${rev}`, JSON.stringify(newIdx), CACHE_TTL_SEC);
    row = newIdx[searchKey];
  }

  if (!row) throw new Error('Candidato não encontrado');

  const lastCol = sh.getLastColumn();
  const rowVals = sh.getRange(row, 1, 1, lastCol).getValues()[0];

  if (statusCol>=0) rowVals[statusCol] = params.statusTriagem;
  if (analystCol>=0 && params.analystEmail) rowVals[analystCol] = params.analystEmail;
  if (dateCol>=0) rowVals[dateCol] = getCurrentTimestamp();
  if (reasonCol>=0 && params.reasonId) rowVals[reasonCol] = getDisqualificationReasonById(params.reasonId);
  if (notesCol>=0 && params.notes) rowVals[notesCol] = params.notes;

  _writeWholeRow_(sh, row, rowVals);
  return { success: true, message: 'Status atualizado' };
}

function getCandidatesByStatus(params) {
  const {sheet, headers, values} = _readSheetBlock_(SHEET_CANDIDATOS);
  if (!sheet || !values.length) return [];

  const col = _colMap_(headers);
  const statusCol = col['Status'];
  const cpfCol = col['CPF'];
  const emailSentCol = col['EMAIL_SENT'];
  const smsSentCol = col['SMS_SENT'];

  const filtered = [];
  for (let i=0;i<values.length;i++){
    if (values[i][statusCol] === params.status){
      const obj = {};
      for (let j=0;j<headers.length;j++) obj[headers[j]] = values[i][j];
      obj.id = values[i][cpfCol];
      obj.registration_number = values[i][cpfCol];

      obj.email_sent = emailSentCol >= 0 ? (values[i][emailSentCol] === 'Sim' || values[i][emailSentCol] === true || values[i][emailSentCol] === 'TRUE') : false;
      obj.sms_sent = smsSentCol >= 0 ? (values[i][smsSentCol] === 'Sim' || values[i][smsSentCol] === true || values[i][smsSentCol] === 'TRUE') : false;

      filtered.push(obj);
    }
  }
  return filtered;
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

  if (cpfCol == null) throw new Error('Coluna CPF não encontrada');

  const lastRow = sh.getLastRow();
  if (lastRow <= HEADER_ROWS) {
    return { success: true, assignedCount: 0, message: 'Nada para alocar' };
  }

  const n = lastRow - HEADER_ROWS;
  const cpfs = sh.getRange(HEADER_ROWS+1, cpfCol+1, n, 1).getValues().map(r=> String(r[0]).trim());
  const assignedTo = assignedToCol!=null ? sh.getRange(HEADER_ROWS+1, assignedToCol+1, n, 1).getValues() : null;
  const assignedBy = assignedByCol!=null ? sh.getRange(HEADER_ROWS+1, assignedByCol+1, n, 1).getValues() : null;
  const assignedAt = assignedAtCol!=null ? sh.getRange(HEADER_ROWS+1, assignedAtCol+1, n, 1).getValues() : null;
  const status     = statusCol!=null     ? sh.getRange(HEADER_ROWS+1, statusCol+1, n, 1).getValues()     : null;

  const target = String(params.candidateIds || '').split(',').map(s=>s.trim()).filter(Boolean);
  const stamp = getCurrentTimestamp();
  let count = 0;

  const pos = new Map();
  for (let i=0;i<cpfs.length;i++) pos.set(cpfs[i], i);

  for (const id of target){
    const i = pos.get(id);
    if (i==null) continue;
    if (assignedTo) assignedTo[i][0] = params.analystEmail || '';
    if (assignedBy) assignedBy[i][0] = params.adminEmail || '';
    if (assignedAt) assignedAt[i][0] = stamp;
    if (status)     status[i][0]     = 'em_analise';
    count++;
  }

  if (assignedTo) sh.getRange(HEADER_ROWS+1, assignedToCol+1, n, 1).setValues(assignedTo);
  if (assignedBy) sh.getRange(HEADER_ROWS+1, assignedByCol+1, n, 1).setValues(assignedBy);
  if (assignedAt) sh.getRange(HEADER_ROWS+1, assignedAtCol+1, n, 1).setValues(assignedAt);
  if (status)     sh.getRange(HEADER_ROWS+1, statusCol+1, n, 1).setValues(status);

  return { success: true, assignedCount: count, message: `${count} candidatos alocados com sucesso` };
}

// ============================================
// MOTIVOS DE DESCLASSIFICAÇÃO
// ============================================

function initMotivosSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_MOTIVOS);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_MOTIVOS);
    sheet.getRange('A1:C1').setValues([['ID', 'Motivo', 'Ativo']]);

    const motivos = [
      ['M001', 'Documentação incompleta', 'Sim'],
      ['M002', 'Não atende aos requisitos mínimos da vaga', 'Sim'],
      ['M003', 'Formação incompatível com a vaga', 'Sim'],
      ['M004', 'Experiência insuficiente', 'Sim'],
      ['M005', 'Documentos ilegíveis ou com qualidade inadequada', 'Sim'],
      ['M006', 'Dados inconsistentes ou contraditórios', 'Sim'],
      ['M007', 'Não apresentou documentos obrigatórios', 'Sim'],
      ['M008', 'Fora do prazo de inscrição', 'Sim'],
      ['M009', 'Outros motivos', 'Sim']
    ];

    sheet.getRange(2, 1, motivos.length, 3).setValues(motivos);
  }

  return sheet;
}

function getDisqualificationReasons() {
  const sheet = initMotivosSheet();
  const data = sheet.getDataRange().getValues();
  const reasons = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === 'Sim') {
      reasons.push({
        id: data[i][0],
        reason: data[i][1],
        is_active: true
      });
    }
  }

  return reasons;
}

function getDisqualificationReasonById(reasonId) {
  const sheet = initMotivosSheet();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === reasonId) {
      return data[i][1];
    }
  }
  return 'Motivo não especificado';
}

// ============================================
// MENSAGENS
// ============================================

function initMensagensSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_MENSAGENS);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_MENSAGENS);
    sheet.getRange('A1:H1').setValues([
      ['Data/Hora', 'Número Inscrição', 'Tipo', 'Destinatário', 'Assunto', 'Conteúdo', 'Enviado Por', 'Status']
    ]);
  }

  return sheet;
}

function logMessage(params) {
  const sheet = initMensagensSheet();
  const newRow = [
    getCurrentTimestamp(),
    params.registrationNumber,
    params.messageType,
    params.recipient,
    params.subject || '',
    params.content,
    params.sentBy,
    params.status || 'pendente'
  ];
  sheet.appendRow(newRow);
  return true;
}

// ============================================
// TEMPLATES
// ============================================

function initTemplatesSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_TEMPLATES);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_TEMPLATES);
    sheet.getRange('A1:E1').setValues([['ID', 'Nome', 'Tipo', 'Assunto', 'Conteúdo']]);

    const templates = [
      ['T001', 'Classificado - Email', 'email', 'Processo Seletivo - Você foi classificado!',
       'Prezado(a) [NOME],\n\nParabéns! Você foi classificado(a) no processo seletivo para a vaga de [CARGO] na área [AREA].\n\nEm breve entraremos em contato com informações sobre as próximas etapas do processo.\n\nAtenciosamente,\nEquipe de Recrutamento e Seleção'],
      ['T002', 'Classificado - SMS', 'sms', '',
       'Parabéns [NOME]! Você foi classificado no processo seletivo para [CARGO]. Aguarde contato para próximas etapas.'],
      ['T003', 'Desclassificado - Email', 'email', 'Processo Seletivo - Resultado da Análise',
       'Prezado(a) [NOME],\n\nAgradecemos seu interesse em fazer parte da nossa equipe.\n\nInfelizmente, nesta etapa do processo seletivo, seu perfil não foi selecionado para a vaga de [CARGO].\n\nDesejamos muito sucesso em sua jornada profissional.\n\nAtenciosamente,\nEquipe de Recrutamento e Seleção'],
      ['T004', 'Em Revisão - Email', 'email', 'Processo Seletivo - Análise em Andamento',
       'Prezado(a) [NOME],\n\nSeu cadastro para a vaga de [CARGO] está sendo revisado pela nossa equipe de análise.\n\nEm breve daremos retorno sobre o andamento do seu processo seletivo.\n\nAtenciosamente,\nEquipe de Recrutamento e Seleção']
    ];

    sheet.getRange(2, 1, templates.length, 5).setValues(templates);
  }

  return sheet;
}

// ============================================
// ALIASES DE EMAIL
// ============================================

function initAliasesSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_ALIASES);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_ALIASES);
    sheet.getRange('A1:B1').setValues([['Alias', 'Ativo']]);

    const defaultAlias = [['seletivoinstitutoacqua@gmail.com', 'Sim']];
    sheet.getRange(2, 1, defaultAlias.length, 2).setValues(defaultAlias);
    sheet.getRange('A1:B1').setFontWeight('bold').setBackground('#4285f4').setFontColor('#ffffff');
  }

  return sheet;
}

function getEmailAliases(params) {
  try {
    Logger.log('📧 Buscando aliases de email');

    const sheet = initAliasesSheet();
    const data = sheet.getDataRange().getValues();
    const aliases = [];

    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === 'Sim') {
        aliases.push(data[i][0]);
      }
    }

    Logger.log('✅ Aliases encontrados: ' + aliases.length);
    Logger.log('   - Aliases: ' + aliases.join(', '));

    return aliases;
  } catch (error) {
    Logger.log('❌ Erro ao buscar aliases: ' + error.toString());
    throw error;
  }
}

function getMessageTemplates(params) {
  const sheet = initTemplatesSheet();
  const data = sheet.getDataRange().getValues();
  const templates = [];

  for (let i = 1; i < data.length; i++) {
    const messageType = params && params.messageType ? params.messageType : null;
    if (!messageType || data[i][2] === messageType) {
      templates.push({
        id: data[i][0],
        template_name: data[i][1],
        message_type: data[i][2],
        subject: data[i][3],
        content: data[i][4]
      });
    }
  }
  return templates;
}

// ============================================
// ENVIO DE MENSAGENS
// ============================================

function _getProp_(k){
  return PropertiesService.getScriptProperties().getProperty(k);
}

function _twilioEnabled_(){
  return !!(_getProp_('TWILIO_SID') && _getProp_('TWILIO_TOKEN') && _getProp_('TWILIO_FROM'));
}

function _formatE164_(phone){
  if (!phone) return '';
  let cleaned = String(phone).replace(/\D/g, '');
  cleaned = cleaned.replace(/^0+/, '');
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  return '+' + cleaned;
}

function _sendSmsTwilio_(to, body){
  if (!_twilioEnabled_()) {
    Logger.log('⚠️ Twilio não configurado - Pulando SMS');
    return { ok: false, skipped: true, error: 'Twilio não configurado' };
  }

  const sid = _getProp_('TWILIO_SID');
  const token = _getProp_('TWILIO_TOKEN');
  const from = _getProp_('TWILIO_FROM');

  const formattedTo = _formatE164_(to);
  Logger.log('📱 Enviando SMS: ' + formattedTo);

  const url = 'https://api.twilio.com/2010-04-01/Accounts/' + sid + '/Messages.json';
  const payload = {
    To: formattedTo,
    From: from,
    Body: body
  };

  const options = {
    method: 'post',
    payload: payload,
    muteHttpExceptions: true,
    headers: {
      Authorization: 'Basic ' + Utilities.base64Encode(sid + ':' + token)
    }
  };

  try {
    const res = UrlFetchApp.fetch(url, options);
    const code = res.getResponseCode();

    if (code >= 200 && code < 300) {
      Logger.log('✅ SMS enviado');
      return { ok: true };
    }

    const errorMsg = 'Twilio HTTP ' + code + ': ' + res.getContentText();
    Logger.log('❌ ' + errorMsg);
    return { ok: false, error: errorMsg };
  } catch (e) {
    Logger.log('❌ Erro SMS: ' + e.toString());
    return { ok: false, error: e.toString() };
  }
}

function _sendEmailGmail_(to, subject, body, fromAlias){
  try {
    Logger.log('📧 Enviando email: ' + to);
    Logger.log('📧 Alias remetente: ' + (fromAlias || 'padrão'));

    const options = {};
    if (fromAlias) {
      options.from = fromAlias;
    }

    GmailApp.sendEmail(to, subject, body, options);
    Logger.log('✅ Email enviado');
    return { ok: true };
  } catch (e) {
    Logger.log('❌ Erro email: ' + e.toString());
    return { ok: false, error: e.toString() };
  }
}

function _pickEmailFromRow_(headers, row){
  const cands = ['EMAIL', 'Email', 'email', 'E-MAIL', 'e-mail'];
  for (const k of cands){
    const i = headers.indexOf(k);
    if (i >= 0 && row[i]) return String(row[i]).trim();
  }
  return '';
}

function _pickPhoneFromRow_(headers, row){
  const cands = ['TELEFONE', 'Telefone', 'telefone', 'CELULAR', 'Celular', 'celular'];
  for (const k of cands){
    const i = headers.indexOf(k);
    if (i >= 0 && row[i]) return String(row[i]).trim();
  }
  return '';
}

function _applyTemplate_(text, candidate){
  if (!text) return '';
  return String(text)
    .replace(/\[NOME\]/g, candidate.NOMECOMPLETO || candidate.NOMESOCIAL || '')
    .replace(/\[CARGO\]/g, candidate.CARGOPRETENDIDO || '')
    .replace(/\[AREA\]/g, candidate.AREAATUACAO || '');
}

function sendMessages(params) {
  Logger.log('📤 sendMessages iniciado');

  const messageType = params.messageType;
  const subject = params.subject || '';
  const content = params.content || '';
  const candidateIds = params.candidateIds || '';
  const sentBy = params.sentBy || 'system';
  const fromAlias = params.fromAlias || '';

  if (!content) {
    throw new Error('Conteúdo da mensagem é obrigatório');
  }

  if (messageType === 'email' && !subject) {
    throw new Error('Assunto é obrigatório para emails');
  }

  const {sheet, headers, values} = _readSheetBlock_(SHEET_CANDIDATOS);
  if (!sheet) throw new Error('Planilha de candidatos não encontrada');

  const col = _colMap_(headers);
  const cpfCol = col['CPF'];

  const targetIds = candidateIds.split(',').map(s => s.trim()).filter(Boolean);
  Logger.log('📋 Candidatos alvo: ' + targetIds.length);

  const results = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < values.length; i++) {
    const cpf = String(values[i][cpfCol]).trim();

    if (!targetIds.includes(cpf)) continue;

    const candidate = {};
    for (let j = 0; j < headers.length; j++) {
      candidate[headers[j]] = values[i][j];
    }

    const nome = candidate.NOMECOMPLETO || candidate.NOMESOCIAL || 'Candidato';
    let recipient, result;

    if (messageType === 'email') {
      recipient = _pickEmailFromRow_(headers, values[i]);

      if (!recipient) {
        Logger.log('⚠️ Sem email: ' + nome);
        results.push({
          candidateId: cpf,
          candidateName: nome,
          success: false,
          error: 'Email não cadastrado'
        });
        failCount++;
        continue;
      }

      const personalizedSubject = _applyTemplate_(subject, candidate);
      const personalizedContent = _applyTemplate_(content, candidate);

      result = _sendEmailGmail_(recipient, personalizedSubject, personalizedContent, fromAlias);

      logMessage({
        registrationNumber: cpf,
        messageType: 'email',
        recipient: recipient,
        subject: personalizedSubject,
        content: personalizedContent,
        sentBy: sentBy,
        status: result.ok ? 'enviado' : 'falhou'
      });

    } else if (messageType === 'sms') {
      recipient = _pickPhoneFromRow_(headers, values[i]);

      if (!recipient) {
        Logger.log('⚠️ Sem telefone: ' + nome);
        results.push({
          candidateId: cpf,
          candidateName: nome,
          success: false,
          error: 'Telefone não cadastrado'
        });
        failCount++;
        continue;
      }

      const personalizedContent = _applyTemplate_(content, candidate);
      result = _sendSmsTwilio_(recipient, personalizedContent);

      if (result.skipped) {
        results.push({
          candidateId: cpf,
          candidateName: nome,
          success: false,
          error: 'Twilio não configurado'
        });
        failCount++;
        continue;
      }

      logMessage({
        registrationNumber: cpf,
        messageType: 'sms',
        recipient: recipient,
        subject: '',
        content: personalizedContent,
        sentBy: sentBy,
        status: result.ok ? 'enviado' : 'falhou'
      });

    } else {
      throw new Error('Tipo de mensagem inválido: ' + messageType);
    }

    if (result.ok) {
      successCount++;
      results.push({
        candidateId: cpf,
        candidateName: nome,
        success: true
      });

      _updateMessageStatusInCandidates_(cpf, messageType);
    } else {
      failCount++;
      results.push({
        candidateId: cpf,
        candidateName: nome,
        success: false,
        error: result.error || 'Erro desconhecido'
      });
    }
  }

  Logger.log('✅ Sucesso: ' + successCount);
  Logger.log('❌ Falhas: ' + failCount);

  return {
    successCount: successCount,
    failCount: failCount,
    results: results
  };
}

// ============================================
// TESTE
// ============================================

function _updateMessageStatusInCandidates_(cpf, messageType) {
  try {
    const sh = _sheet(SHEET_CANDIDATOS);
    if (!sh) return;

    const headers = _getHeaders_(sh);
    const col = _colMap_(headers);
    const cpfCol = col['CPF'];

    let targetCol;
    if (messageType === 'email') {
      targetCol = col['EMAIL_SENT'];
    } else if (messageType === 'sms') {
      targetCol = col['SMS_SENT'];
    }

    if (targetCol === undefined || targetCol < 0) {
      Logger.log('⚠️ Coluna ' + (messageType === 'email' ? 'EMAIL_SENT' : 'SMS_SENT') + ' não encontrada');
      return;
    }

    const idx = _getIndex_(sh, headers);
    const searchKey = String(cpf).trim();
    const row = idx[searchKey];

    if (!row) {
      Logger.log('⚠️ Candidato não encontrado para atualizar status de mensagem: ' + cpf);
      return;
    }

    sh.getRange(row, targetCol + 1).setValue('Sim');
    Logger.log('✅ Status de mensagem atualizado para ' + cpf + ' - ' + messageType);

  } catch (error) {
    Logger.log('❌ Erro ao atualizar status de mensagem: ' + error.toString());
  }
}

function updateMessageStatus(params) {
  try {
    Logger.log('📝 updateMessageStatus iniciado');

    const registrationNumbers = params.registrationNumbers || params.registrationNumber;
    const messageType = params.messageType;
    const status = params.status || 'Sim';

    if (!registrationNumbers) {
      throw new Error('Número(s) de inscrição é obrigatório');
    }

    if (!messageType || (messageType !== 'email' && messageType !== 'sms')) {
      throw new Error('Tipo de mensagem inválido. Use "email" ou "sms"');
    }

    const sh = _sheet(SHEET_CANDIDATOS);
    if (!sh) {
      throw new Error('Planilha de candidatos não encontrada');
    }

    const headers = _getHeaders_(sh);
    const col = _colMap_(headers);

    let targetCol;
    if (messageType === 'email') {
      targetCol = col['EMAIL_SENT'];
    } else if (messageType === 'sms') {
      targetCol = col['SMS_SENT'];
    }

    if (targetCol === undefined || targetCol < 0) {
      const colName = messageType === 'email' ? 'EMAIL_SENT' : 'SMS_SENT';
      throw new Error('Coluna ' + colName + ' não encontrada. Execute addStatusColumnIfNotExists primeiro.');
    }

    const candidatesList = String(registrationNumbers).split(',').map(s => s.trim()).filter(Boolean);
    const idx = _getIndex_(sh, headers);
    let updatedCount = 0;

    for (const regNumber of candidatesList) {
      const searchKey = String(regNumber).trim();
      let row = idx[searchKey];

      if (!row) {
        const newIdx = _buildIndex_(sh, headers);
        const rev = _getRev_();
        CacheService.getDocumentCache().put(`${IDX_CACHE_KEY}${rev}`, JSON.stringify(newIdx), CACHE_TTL_SEC);
        row = newIdx[searchKey];
      }

      if (!row) {
        Logger.log('⚠️ Candidato não encontrado: ' + regNumber);
        continue;
      }

      sh.getRange(row, targetCol + 1).setValue(status);
      updatedCount++;
      Logger.log('✅ Status atualizado: ' + regNumber + ' - ' + messageType + ' = ' + status);
    }

    if (updatedCount > 0) {
      _bumpRev_();
    }

    Logger.log('✅ Total de status atualizados: ' + updatedCount);

    return {
      success: true,
      message: updatedCount + ' status de mensagem(ns) atualizado(s) com sucesso',
      updatedCount: updatedCount,
      messageType: messageType,
      status: status
    };

  } catch (error) {
    Logger.log('❌ Erro em updateMessageStatus: ' + error.toString());
    throw error;
  }
}

function testConnection() {
  return {
    status: 'OK',
    timestamp: getCurrentTimestamp(),
    spreadsheetId: SPREADSHEET_ID
  };
}

// ============================================
// ADICIONAR COLUNAS
// ============================================

function addStatusColumnIfNotExists() {
  const sh = _sheet(SHEET_CANDIDATOS);
  const headers = _getHeaders_(sh);

  const requiredColumns = [
    'Status',
    'Motivo Desclassificação',
    'Observações',
    'Data Triagem',
    'Analista',
    'EMAIL',
    'TELEFONE',
    'EMAIL_SENT',
    'SMS_SENT',
    'status_entrevista',
    'entrevistador',
    'data_entrevista',
    'interview_completed_at',
    'interview_score',
    'interview_result',
    'interview_notes',
    'formacao_adequada',
    'graduacoes_competencias',
    'descricao_processos',
    'terminologia_tecnica',
    'calma_clareza',
    'escalas_flexiveis',
    'adaptabilidade_mudancas',
    'ajustes_emergencia',
    'residencia',
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

// ============================================
// FUNÇÕES DE ENTREVISTA
// ============================================

function getInterviewCandidates(params) {
  try {
    const {sheet, headers, values} = _readSheetBlock_(SHEET_CANDIDATOS);
    if (!sheet || !values.length) return [];

    const col = _colMap_(headers);
    const statusEntrevistaCol = col['status_entrevista'];
    const cpfCol = col['CPF'];
    const regNumCol = col['Número de Inscrição'];
    const emailSentCol = col['EMAIL_SENT'];
    const smsSentCol = col['SMS_SENT'];

    if (statusEntrevistaCol === undefined) {
      Logger.log('⚠️ Coluna status_entrevista não encontrada');
      return [];
    }

    const candidates = [];
    for (let i = 0; i < values.length; i++) {
      const statusEntrevista = values[i][statusEntrevistaCol];

      if (statusEntrevista === 'Aguardando' || statusEntrevista === 'aguardando') {
        const candidate = {};
        headers.forEach((header, index) => {
          candidate[header] = values[i][index];
        });
        candidate.id = values[i][cpfCol] || values[i][regNumCol];
        candidate.registration_number = values[i][regNumCol] || values[i][cpfCol];

        candidate.email_sent = emailSentCol >= 0 ? (values[i][emailSentCol] === 'Sim' || values[i][emailSentCol] === true || values[i][emailSentCol] === 'TRUE') : false;
        candidate.sms_sent = smsSentCol >= 0 ? (values[i][smsSentCol] === 'Sim' || values[i][smsSentCol] === true || values[i][smsSentCol] === 'TRUE') : false;

        candidates.push(candidate);
      }
    }

    Logger.log('📋 Candidatos para entrevista: ' + candidates.length);
    return candidates;
  } catch (error) {
    Logger.log('❌ Erro em getInterviewCandidates: ' + error.toString());
    throw error;
  }
}

function moveToInterview(params) {
  try {
    const sh = _sheet(SHEET_CANDIDATOS);
    const headers = _getHeaders_(sh);
    const col = _colMap_(headers);

    const statusEntrevistaCol = col['status_entrevista'];
    const cpfCol = col['CPF'];
    const emailSentCol = col['EMAIL_SENT'];
    const smsSentCol = col['SMS_SENT'];

    if (statusEntrevistaCol === undefined || statusEntrevistaCol < 0) {
      throw new Error('Coluna status_entrevista não encontrada');
    }

    const candidateIds = String(params.candidateIds || '').split(',').map(s => s.trim()).filter(Boolean);
    Logger.log('📋 Movendo ' + candidateIds.length + ' candidatos para entrevista');

    const lastRow = sh.getLastRow();
    if (lastRow <= HEADER_ROWS) {
      return { success: true, movedCount: 0, message: 'Nenhum candidato para mover' };
    }

    const n = lastRow - HEADER_ROWS;
    const cpfs = sh.getRange(HEADER_ROWS + 1, cpfCol + 1, n, 1).getValues().map(r => String(r[0]).trim());
    const statusEntrevista = sh.getRange(HEADER_ROWS + 1, statusEntrevistaCol + 1, n, 1).getValues();

    const emailSent = emailSentCol >= 0 ? sh.getRange(HEADER_ROWS + 1, emailSentCol + 1, n, 1).getValues() : null;
    const smsSent = smsSentCol >= 0 ? sh.getRange(HEADER_ROWS + 1, smsSentCol + 1, n, 1).getValues() : null;

    let movedCount = 0;
    const pos = new Map();
    for (let i = 0; i < cpfs.length; i++) {
      pos.set(cpfs[i], i);
    }

    for (const cpf of candidateIds) {
      const i = pos.get(cpf);
      if (i === undefined) {
        Logger.log('⚠️ CPF não encontrado: ' + cpf);
        continue;
      }

      const hasEmail = emailSent && (emailSent[i][0] === 'Sim' || emailSent[i][0] === true || emailSent[i][0] === 'TRUE');
      const hasSms = smsSent && (smsSent[i][0] === 'Sim' || smsSent[i][0] === true || smsSent[i][0] === 'TRUE');

      if (!hasEmail && !hasSms) {
        Logger.log('⚠️ Candidato ' + cpf + ' não recebeu mensagens. Pulando.');
        continue;
      }

      statusEntrevista[i][0] = 'Aguardando';
      movedCount++;
      Logger.log('✅ ' + cpf + ' movido para entrevista');
    }

    if (movedCount > 0) {
      sh.getRange(HEADER_ROWS + 1, statusEntrevistaCol + 1, n, 1).setValues(statusEntrevista);
      _bumpRev_();
    }

    Logger.log('✅ Total movidos: ' + movedCount);
    return {
      success: true,
      movedCount: movedCount,
      message: movedCount + ' candidato(s) movido(s) para entrevista'
    };
  } catch (error) {
    Logger.log('❌ Erro em moveToInterview: ' + error.toString());
    throw error;
  }
}

function getInterviewers(params) {
  try {
    const sheet = initUsuariosSheet();
    const data = sheet.getDataRange().getValues();
    const interviewers = [];

    for (let i = 1; i < data.length; i++) {
      const rawRole = data[i][2];
      const normalizedRole = rawRole ? String(rawRole).toLowerCase().trim() : '';

      if (normalizedRole === 'entrevistador') {
        interviewers.push({
          id: data[i][3] || data[i][0],
          email: data[i][0],
          name: data[i][1] || data[i][0],
          role: normalizedRole,
          active: true
        });
      }
    }

    Logger.log('👥 Entrevistadores encontrados: ' + interviewers.length);
    return interviewers;
  } catch (error) {
    Logger.log('❌ Erro em getInterviewers: ' + error.toString());
    throw error;
  }
}

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

function allocateToInterviewer(params) {
  try {
    const sh = _sheet(SHEET_CANDIDATOS);
    const headers = _getHeaders_(sh);
    const col = _colMap_(headers);

    const entrevistadorCol = col['entrevistador'];
    const dataEntrevistaCol = col['data_entrevista'];
    const cpfCol = col['CPF'];

    if (entrevistadorCol === undefined || entrevistadorCol < 0) {
      throw new Error('Coluna entrevistador não encontrada');
    }

    const candidateIds = String(params.candidateIds || '').split(',').map(s => s.trim()).filter(Boolean);
    const interviewerEmail = params.interviewerEmail;

    Logger.log('📋 Alocando ' + candidateIds.length + ' candidatos para ' + interviewerEmail);

    const lastRow = sh.getLastRow();
    if (lastRow <= HEADER_ROWS) {
      return { success: true, allocatedCount: 0, message: 'Nenhum candidato para alocar' };
    }

    const n = lastRow - HEADER_ROWS;
    const cpfs = sh.getRange(HEADER_ROWS + 1, cpfCol + 1, n, 1).getValues().map(r => String(r[0]).trim());
    const entrevistador = sh.getRange(HEADER_ROWS + 1, entrevistadorCol + 1, n, 1).getValues();
    const dataEntrevista = dataEntrevistaCol >= 0 ? sh.getRange(HEADER_ROWS + 1, dataEntrevistaCol + 1, n, 1).getValues() : null;

    const stamp = getCurrentTimestamp();
    let allocatedCount = 0;
    const pos = new Map();
    for (let i = 0; i < cpfs.length; i++) {
      pos.set(cpfs[i], i);
    }

    for (const cpf of candidateIds) {
      const i = pos.get(cpf);
      if (i === undefined) continue;

      entrevistador[i][0] = interviewerEmail;
      if (dataEntrevista) dataEntrevista[i][0] = stamp;
      allocatedCount++;
    }

    if (allocatedCount > 0) {
      sh.getRange(HEADER_ROWS + 1, entrevistadorCol + 1, n, 1).setValues(entrevistador);
      if (dataEntrevista && dataEntrevistaCol >= 0) {
        sh.getRange(HEADER_ROWS + 1, dataEntrevistaCol + 1, n, 1).setValues(dataEntrevista);
      }
      _bumpRev_();
    }

    Logger.log('✅ Total alocados: ' + allocatedCount);
    return {
      success: true,
      allocatedCount: allocatedCount,
      message: allocatedCount + ' candidato(s) alocado(s) para entrevista'
    };
  } catch (error) {
    Logger.log('❌ Erro em allocateToInterviewer: ' + error.toString());
    throw error;
  }
}

function updateInterviewStatus(params) {
  try {
    const sh = _sheet(SHEET_CANDIDATOS);
    const headers = _getHeaders_(sh);
    const col = _colMap_(headers);

    const statusEntrevistaCol = col['status_entrevista'];
    const entrevistadorCol = col['entrevistador'];
    const dataEntrevistaCol = col['data_entrevista'];
    const cpfCol = col['CPF'];
    const regNumCol = col['Número de Inscrição'];

    const idx = _getIndex_(sh, headers);
    const searchKey = String(params.registrationNumber).trim();
    let row = idx[searchKey];

    if (!row) {
      const newIdx = _buildIndex_(sh, headers);
      const rev = _getRev_();
      CacheService.getDocumentCache().put(`${IDX_CACHE_KEY}${rev}`, JSON.stringify(newIdx), CACHE_TTL_SEC);
      row = newIdx[searchKey];
    }

    if (!row) throw new Error('Candidato não encontrado');

    const lastCol = sh.getLastColumn();
    const rowVals = sh.getRange(row, 1, 1, lastCol).getValues()[0];

    if (statusEntrevistaCol >= 0) rowVals[statusEntrevistaCol] = params.status;
    if (entrevistadorCol >= 0 && params.interviewerEmail) rowVals[entrevistadorCol] = params.interviewerEmail;
    if (dataEntrevistaCol >= 0) rowVals[dataEntrevistaCol] = getCurrentTimestamp();

    _writeWholeRow_(sh, row, rowVals);
    _bumpRev_();

    Logger.log('✅ Status de entrevista atualizado');
    return { success: true, message: 'Status atualizado' };
  } catch (error) {
    Logger.log('❌ Erro em updateInterviewStatus: ' + error.toString());
    throw error;
  }
}

function saveInterviewEvaluation(params) {
  try {
    const sh = _sheet(SHEET_CANDIDATOS);
    const headers = _getHeaders_(sh);
    const col = _colMap_(headers);

    const cpfCol = col['CPF'];
    const statusEntrevistaCol = col['status_entrevista'];
    const entrevistadorCol = col['entrevistador'];
    const dataEntrevistaCol = col['data_entrevista'];
    const completedAtCol = col['interview_completed_at'];
    const scoreCol = col['interview_score'];
    const resultCol = col['interview_result'];
    const notesCol = col['interview_notes'];
    const formacaoCol = col['formacao_adequada'];
    const graduacoesCol = col['graduacoes_competencias'];
    const descricaoCol = col['descricao_processos'];
    const terminologiaCol = col['terminologia_tecnica'];
    const calmaCol = col['calma_clareza'];
    const escalasCol = col['escalas_flexiveis'];
    const adaptabilidadeCol = col['adaptabilidade_mudancas'];
    const ajustesCol = col['ajustes_emergencia'];
    const residenciaCol = col['residencia'];
    const conflitosCol = col['resolucao_conflitos'];
    const colaboracaoCol = col['colaboracao_equipe'];
    const adaptacaoPerfisCol = col['adaptacao_perfis'];

    const idx = _getIndex_(sh, headers);
    const searchKey = String(params.candidateId).trim();
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

    const secao1 = (Number(params.formacao_adequada) + Number(params.graduacoes_competencias)) * 2;
    const secao2 = (Number(params.descricao_processos) + Number(params.terminologia_tecnica) + Number(params.calma_clareza)) * 2;
    const secao3 = Number(params.escalas_flexiveis) + Number(params.adaptabilidade_mudancas) + Number(params.ajustes_emergencia);
    const secao4 = Number(params.residencia);
    const secao5 = (Number(params.resolucao_conflitos) + Number(params.colaboracao_equipe) + Number(params.adaptacao_perfis)) * 2;
    const totalScore = secao1 + secao2 + secao3 + secao4 + secao5;

    Logger.log('📊 Pontuação calculada: ' + totalScore + '/120');

    if (statusEntrevistaCol >= 0) rowVals[statusEntrevistaCol] = 'Avaliado';
    if (entrevistadorCol >= 0) rowVals[entrevistadorCol] = params.interviewerEmail || '';
    if (dataEntrevistaCol >= 0) rowVals[dataEntrevistaCol] = getCurrentTimestamp();
    if (completedAtCol >= 0) rowVals[completedAtCol] = params.completed_at || getCurrentTimestamp();
    if (scoreCol >= 0) rowVals[scoreCol] = totalScore;
    if (resultCol >= 0) rowVals[resultCol] = params.resultado || '';
    if (notesCol >= 0) rowVals[notesCol] = params.impressao_perfil || '';
    if (formacaoCol >= 0) rowVals[formacaoCol] = params.formacao_adequada || '';
    if (graduacoesCol >= 0) rowVals[graduacoesCol] = params.graduacoes_competencias || '';
    if (descricaoCol >= 0) rowVals[descricaoCol] = params.descricao_processos || '';
    if (terminologiaCol >= 0) rowVals[terminologiaCol] = params.terminologia_tecnica || '';
    if (calmaCol >= 0) rowVals[calmaCol] = params.calma_clareza || '';
    if (escalasCol >= 0) rowVals[escalasCol] = params.escalas_flexiveis || '';
    if (adaptabilidadeCol >= 0) rowVals[adaptabilidadeCol] = params.adaptabilidade_mudancas || '';
    if (ajustesCol >= 0) rowVals[ajustesCol] = params.ajustes_emergencia || '';
    if (residenciaCol >= 0) rowVals[residenciaCol] = params.residencia || '';
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

function getReportStats(params) {
  try {
    Logger.log('📊 Gerando estatísticas de relatórios');

    const {sheet, headers, values} = _readSheetBlock_(SHEET_CANDIDATOS);
    if (!sheet || !values.length) {
      return {
        classificados: 0,
        desclassificados: 0,
        entrevistaClassificados: 0,
        entrevistaDesclassificados: 0
      };
    }

    const col = _colMap_(headers);
    const statusCol = col['Status'];
    const statusEntrevistaCol = col['status_entrevista'];
    const interviewResultCol = col['interview_result'];

    let classificados = 0;
    let desclassificados = 0;
    let entrevistaClassificados = 0;
    let entrevistaDesclassificados = 0;

    for (let i = 0; i < values.length; i++) {
      const status = values[i][statusCol] ? String(values[i][statusCol]).trim() : '';
      const statusEntrevista = values[i][statusEntrevistaCol] ? String(values[i][statusEntrevistaCol]).trim() : '';
      const interviewResult = values[i][interviewResultCol] ? String(values[i][interviewResultCol]).trim() : '';

      if (status === 'Classificado') {
        classificados++;
      } else if (status === 'Desclassificado') {
        desclassificados++;
      }

      if (statusEntrevista === 'Avaliado') {
        if (interviewResult === 'Classificado') {
          entrevistaClassificados++;
        } else if (interviewResult === 'Desclassificado') {
          entrevistaDesclassificados++;
        }
      }
    }

    Logger.log('✅ Estatísticas geradas');
    Logger.log('   - Classificados: ' + classificados);
    Logger.log('   - Desclassificados: ' + desclassificados);
    Logger.log('   - Entrevista Classificados: ' + entrevistaClassificados);
    Logger.log('   - Entrevista Desclassificados: ' + entrevistaDesclassificados);

    return {
      classificados: classificados,
      desclassificados: desclassificados,
      entrevistaClassificados: entrevistaClassificados,
      entrevistaDesclassificados: entrevistaDesclassificados
    };
  } catch (error) {
    Logger.log('❌ Erro em getReportStats: ' + error.toString());
    throw error;
  }
}

function getReport(params) {
  try {
    const reportType = params.reportType;
    const analystEmail = params.analystEmail;

    Logger.log('📋 Gerando relatório: ' + reportType);
    if (analystEmail) {
      Logger.log('   - Filtro por analista: ' + analystEmail);
    }

    const {sheet, headers, values} = _readSheetBlock_(SHEET_CANDIDATOS);
    if (!sheet || !values.length) {
      Logger.log('⚠️ Nenhum candidato encontrado');
      return [];
    }

    const col = _colMap_(headers);
    const statusCol = col['Status'];
    const analistaCol = col['Analista'];
    const statusEntrevistaCol = col['status_entrevista'];
    const interviewResultCol = col['interview_result'];

    const candidates = [];

    for (let i = 0; i < values.length; i++) {
      const status = values[i][statusCol] ? String(values[i][statusCol]).trim() : '';
      const analista = values[i][analistaCol] ? String(values[i][analistaCol]).toLowerCase().trim() : '';
      const statusEntrevista = values[i][statusEntrevistaCol] ? String(values[i][statusEntrevistaCol]).trim() : '';
      const interviewResult = values[i][interviewResultCol] ? String(values[i][interviewResultCol]).trim() : '';

      if (analystEmail && analista !== analystEmail.toLowerCase().trim()) {
        continue;
      }

      let include = false;

      if (reportType === 'classificados' && status === 'Classificado') {
        include = true;
      } else if (reportType === 'desclassificados' && status === 'Desclassificado') {
        include = true;
      } else if (reportType === 'entrevista_classificados' && statusEntrevista === 'Avaliado' && interviewResult === 'Classificado') {
        include = true;
      } else if (reportType === 'entrevista_desclassificados' && statusEntrevista === 'Avaliado' && interviewResult === 'Desclassificado') {
        include = true;
      }

      if (include) {
        const candidate = {};
        headers.forEach((header, index) => {
          candidate[header] = values[i][index];
        });
        candidates.push(candidate);
      }
    }

    Logger.log('✅ Relatório gerado: ' + candidates.length + ' registros');
    return candidates;
  } catch (error) {
    Logger.log('❌ Erro em getReport: ' + error.toString());
    throw error;
  }
}
