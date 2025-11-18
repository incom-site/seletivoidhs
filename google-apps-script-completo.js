// ============================================
// GOOGLE APPS SCRIPT - SISTEMA DE TRIAGEM COMPLETO
// ============================================

const SPREADSHEET_ID = '1iQSQ06P_OXkqxaGWN3uG5jRYFBKyjWqQyvzuGk2EplY';
const SHEET_USUARIOS = 'USUARIOS';
const SHEET_CANDIDATOS = 'CANDIDATOS';
const SHEET_MOTIVOS = 'MOTIVOS';
const SHEET_MENSAGENS = 'MENSAGENS';
const SHEET_TEMPLATES = 'TEMPLATES';

// ======= OTIMIZAÇÃO / ÍNDICE E LEITURA EM BLOCO =======
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

    if (e.postData) {
      const data = JSON.parse(e.postData.contents);
      action = data.action;
      params = data;
    } else {
      action = e.parameter.action;
      params = e.parameter;
    }

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
      'test': () => testConnection()
    };

    if (actions[action]) {
      return createResponse({ success: true, data: actions[action]() });
    } else {
      return createResponse({ success: false, error: 'Ação não encontrada: ' + action });
    }
  } catch (error) {
    Logger.log('Erro no handleRequest: ' + error.toString());
    return createResponse({ success: false, error: error.toString() });
  }
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function createResponse(data) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  output.setContent(JSON.stringify(data));
  return output;
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
  const sheet = initUsuariosSheet();
  const data = sheet.getDataRange().getValues();
  const emailToFind = params.email ? params.email.toLowerCase().trim() : '';

  for (let i = 1; i < data.length; i++) {
    const emailInSheet = data[i][0] ? data[i][0].toLowerCase().trim() : '';
    if (emailInSheet === emailToFind) {
      const rawRole = data[i][2];
      const normalizedRole = rawRole ? String(rawRole).toLowerCase().trim() : '';
      return {
        email: data[i][0],
        name: data[i][1] || data[i][0],
        role: normalizedRole,
        id: data[i][3] || data[i][0]
      };
    }
  }
  return null;
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

  const filtered = [];
  for (let i=0;i<values.length;i++){
    if (values[i][statusCol] === params.status){
      const obj = {};
      for (let j=0;j<headers.length;j++) obj[headers[j]] = values[i][j];
      obj.id = values[i][cpfCol];
      obj.registration_number = values[i][cpfCol];
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
// FUNÇÕES DE MOTIVOS DE DESCLASSIFICAÇÃO
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
// FUNÇÕES DE MENSAGENS
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
// FUNÇÕES DE TEMPLATES
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
// FUNÇÕES DE ENVIO DE MENSAGENS
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
    Logger.log('⚠️ Twilio não configurado');
    return { ok: false, skipped: true, error: 'Twilio não configurado' };
  }

  const sid = _getProp_('TWILIO_SID');
  const token = _getProp_('TWILIO_TOKEN');
  const from = _getProp_('TWILIO_FROM');

  const formattedTo = _formatE164_(to);
  Logger.log('📱 Enviando SMS via Twilio');
  Logger.log('  Para: ' + formattedTo);
  Logger.log('  De: ' + from);

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
      Logger.log('✅ SMS enviado com sucesso');
      return { ok: true };
    }

    const errorMsg = 'Twilio HTTP ' + code + ': ' + res.getContentText();
    Logger.log('❌ ' + errorMsg);
    return { ok: false, error: errorMsg };
  } catch (e) {
    Logger.log('❌ Erro ao enviar SMS: ' + e.toString());
    return { ok: false, error: e.toString() };
  }
}

function _sendEmailGmail_(to, subject, body){
  try {
    Logger.log('📧 Enviando email via Gmail');
    Logger.log('  Para: ' + to);
    Logger.log('  Assunto: ' + subject);

    GmailApp.sendEmail(to, subject, body);
    Logger.log('✅ Email enviado com sucesso');
    return { ok: true };
  } catch (e) {
    Logger.log('❌ Erro ao enviar email: ' + e.toString());
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
  Logger.log('Params: ' + JSON.stringify(params));

  const messageType = params.messageType;
  const subject = params.subject || '';
  const content = params.content || '';
  const candidateIds = params.candidateIds || '';
  const sentBy = params.sentBy || 'system';

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
  Logger.log('📋 Total de candidatos alvo: ' + targetIds.length);

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
        Logger.log('⚠️ ' + nome + ' não tem email');
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

      result = _sendEmailGmail_(recipient, personalizedSubject, personalizedContent);

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
        Logger.log('⚠️ ' + nome + ' não tem telefone');
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

function testConnection() {
  return {
    status: 'OK',
    timestamp: getCurrentTimestamp(),
    spreadsheetId: SPREADSHEET_ID
  };
}

// ============================================
// FUNÇÃO PARA ADICIONAR COLUNAS DE STATUS
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
    'TELEFONE'
  ];

  let added = false;
  requiredColumns.forEach(colName => {
    if (headers.indexOf(colName) === -1) {
      const lastCol = sh.getLastColumn();
      sh.getRange(1, lastCol + 1).setValue(colName);
      added = true;
    }
  });

  if (added) _bumpRev_();
}
