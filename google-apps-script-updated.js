// ============================================
// GOOGLE APPS SCRIPT - SISTEMA DE TRIAGEM ATUALIZADO
// ============================================

const SPREADSHEET_ID = '1iQSQ06P_OXkqxaGWN3uG5jRYFBKyjWqQyvzuGk2EplY';
const SHEET_USUARIOS = 'USUARIOS';
const SHEET_CANDIDATOS = 'CANDIDATOS';
const SHEET_MOTIVOS = 'MOTIVOS';
const SHEET_MENSAGENS = 'MENSAGENS';
const SHEET_TEMPLATES = 'TEMPLATES';

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

    // Adicionar usuários padrão
    const defaultUsers = [
      ['admin@email.com', 'Administrador', 'admin', 'admin@email.com'],
      ['analista@email.com', 'Analista', 'analista', 'analista@email.com']
    ];

    sheet.getRange(2, 1, defaultUsers.length, 4).setValues(defaultUsers);

    // Formatar cabeçalho
    sheet.getRange('A1:D1').setFontWeight('bold').setBackground('#4285f4').setFontColor('#ffffff');
  }

  return sheet;
}

function getUserRole(params) {
  const ss = getSpreadsheet();
  const sheet = initUsuariosSheet(); // Garante que a aba existe
  const data = sheet.getDataRange().getValues();

  Logger.log('🔍 getUserRole - Buscando email: ' + params.email);
  Logger.log('📊 getUserRole - Total de linhas: ' + data.length);

  // Normalizar email para comparação (minúsculas e sem espaços)
  const emailToFind = params.email ? params.email.toLowerCase().trim() : '';

  for (let i = 1; i < data.length; i++) {
    const emailInSheet = data[i][0] ? data[i][0].toLowerCase().trim() : '';

    if (emailInSheet === emailToFind) {
      const rawRole = data[i][2];
      // CRÍTICO: Normalizar o role (minúsculas e sem espaços)
      const normalizedRole = rawRole ? String(rawRole).toLowerCase().trim() : '';

      Logger.log('✅ getUserRole - Usuário encontrado!');
      Logger.log('  Email: ' + data[i][0]);
      Logger.log('  Nome: ' + data[i][1]);
      Logger.log('  Role RAW: ' + rawRole);
      Logger.log('  Role NORMALIZADO: ' + normalizedRole);

      return {
        email: data[i][0],
        name: data[i][1] || data[i][0],
        role: normalizedRole,
        id: data[i][3] || data[i][0]
      };
    }
  }

  Logger.log('❌ getUserRole - Usuário não encontrado');
  return null;
}

function getAnalysts(params) {
  const ss = getSpreadsheet();
  const sheet = initUsuariosSheet();
  const data = sheet.getDataRange().getValues();

  Logger.log('📋 getAnalysts - Buscando analistas...');
  Logger.log('📊 getAnalysts - Total de linhas: ' + data.length);

  const analysts = [];

  for (let i = 1; i < data.length; i++) {
    const rawRole = data[i][2];
    const normalizedRole = rawRole ? String(rawRole).toLowerCase().trim() : '';

    Logger.log('  Linha ' + i + ' - Email: ' + data[i][0] + ', Role: ' + normalizedRole);

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

  Logger.log('✅ getAnalysts - Total encontrados: ' + analysts.length);

  return { analysts: analysts };
}

// ============================================
// FUNÇÕES DE CANDIDATOS
// ============================================

function getCandidates(params) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_CANDIDATOS);

  if (!sheet) {
    Logger.log('⚠️ Aba CANDIDATOS não encontrada!');
    return { candidates: [] };
  }

  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    Logger.log('⚠️ Aba CANDIDATOS vazia (apenas cabeçalho ou sem dados)');
    return { candidates: [] };
  }

  const headers = data[0];
  Logger.log('📋 Cabeçalhos encontrados: ' + headers.join(', '));
  Logger.log('📊 Total de linhas (incluindo cabeçalho): ' + data.length);

  const candidates = [];
  for (let i = 1; i < data.length; i++) {
    const candidate = {};
    for (let j = 0; j < headers.length; j++) {
      candidate[headers[j]] = data[i][j];
    }
    candidates.push(candidate);
  }

  Logger.log('✅ Total de candidatos processados: ' + candidates.length);

  // Retornar no formato esperado pelo frontend
  return { candidates: candidates };
}

function updateCandidateStatus(params) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_CANDIDATOS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  Logger.log('📝 updateCandidateStatus - Params:', JSON.stringify(params));
  Logger.log('📋 Cabeçalhos:', headers.join(', '));

  const statusCol = headers.indexOf('Status');
  const cpfCol = headers.indexOf('CPF');
  const regNumCol = headers.indexOf('Número de Inscrição') >= 0 ? headers.indexOf('Número de Inscrição') : headers.indexOf('NUMEROINSCRICAO');
  const analystCol = headers.indexOf('Analista') >= 0 ? headers.indexOf('Analista') : headers.indexOf('assigned_to');
  const dateCol = headers.indexOf('Data Triagem') >= 0 ? headers.indexOf('Data Triagem') : headers.indexOf('data_hora_triagem');
  const reasonCol = headers.indexOf('Motivo Desclassificação');
  const notesCol = headers.indexOf('Observações') >= 0 ? headers.indexOf('Observações') : headers.indexOf('screening_notes');

  Logger.log('🔍 Índices de colunas:');
  Logger.log('  CPF col:', cpfCol);
  Logger.log('  RegNum col:', regNumCol);
  Logger.log('  Status col:', statusCol);

  // Buscar pelo CPF ou registration_number
  const searchValue = params.registrationNumber;
  Logger.log('🔎 Buscando por:', searchValue);

  for (let i = 1; i < data.length; i++) {
    const cpfValue = data[i][cpfCol] ? String(data[i][cpfCol]).trim() : '';
    const regNumValue = regNumCol >= 0 ? String(data[i][regNumCol]).trim() : '';
    const searchValueStr = String(searchValue).trim();

    // Comparar com CPF ou registration_number
    if (cpfValue === searchValueStr || regNumValue === searchValueStr) {
      Logger.log('✅ Candidato encontrado na linha:', i + 1);

      if (statusCol >= 0) {
        sheet.getRange(i + 1, statusCol + 1).setValue(params.statusTriagem);
        Logger.log('   ✅ Status atualizado para:', params.statusTriagem);
      }
      if (analystCol >= 0 && params.analystEmail) {
        sheet.getRange(i + 1, analystCol + 1).setValue(params.analystEmail);
        Logger.log('   ✅ Analista atualizado para:', params.analystEmail);
      }
      if (dateCol >= 0) {
        sheet.getRange(i + 1, dateCol + 1).setValue(getCurrentTimestamp());
        Logger.log('   ✅ Data atualizada');
      }
      if (reasonCol >= 0 && params.reasonId) {
        const reason = getDisqualificationReasonById(params.reasonId);
        Logger.log('   🔍 Motivo ID:', params.reasonId);
        Logger.log('   📝 Motivo texto:', reason);
        Logger.log('   📍 Coluna do motivo:', reasonCol);
        sheet.getRange(i + 1, reasonCol + 1).setValue(reason);
        Logger.log('   ✅ Motivo salvo na célula!');
      }
      if (notesCol >= 0 && params.notes) {
        sheet.getRange(i + 1, notesCol + 1).setValue(params.notes);
        Logger.log('   ✅ Observações salvas:', params.notes);
      }

      Logger.log('✅ Status atualizado com sucesso!');
      return { success: true, message: 'Status atualizado' };
    }
  }

  Logger.log('❌ Candidato não encontrado com registrationNumber:', searchValue);
  Logger.log('❌ Primeiros 3 CPFs da planilha:', data.slice(1, 4).map(row => row[cpfCol]));
  throw new Error('Candidato não encontrado');
}

function getCandidatesByStatus(params) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_CANDIDATOS);

  if (!sheet) {
    Logger.log('❌ Aba CANDIDATOS não encontrada!');
    return [];
  }

  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    Logger.log('⚠️ Aba CANDIDATOS vazia');
    return [];
  }

  const headers = data[0];
  Logger.log('📊 getCandidatesByStatus - Buscando status:', params.status);
  Logger.log('📋 Cabeçalhos disponíveis:', headers.join(', '));

  const statusCol = headers.indexOf('Status');
  const cpfCol = headers.indexOf('CPF');
  const candidates = [];

  Logger.log('🔍 Status col:', statusCol);
  Logger.log('🔍 CPF col:', cpfCol);

  if (statusCol < 0) {
    Logger.log('❌ Coluna Status não encontrada!');
    return [];
  }

  for (let i = 1; i < data.length; i++) {
    const rowStatus = data[i][statusCol];

    if (rowStatus === params.status) {
      const candidate = {};

      for (let j = 0; j < headers.length; j++) {
        candidate[headers[j]] = data[i][j];
      }

      // Adicionar id (usando CPF como id)
      candidate.id = data[i][cpfCol];
      candidate.registration_number = data[i][cpfCol];

      candidates.push(candidate);

      // Log apenas para o primeiro candidato para análise completa
      if (candidates.length === 1) {
        Logger.log('✅ Candidato ' + candidates.length + ' encontrado:');
        Logger.log('   CPF:', data[i][cpfCol]);
        Logger.log('   Nome:', candidate['NOMECOMPLETO']);
        Logger.log('   Status:', rowStatus);

        if (params.status === 'Desclassificado') {
          Logger.log('\n🔍 ANÁLISE COMPLETA DO MOTIVO:');
          Logger.log('   candidate["Motivo Desclassificação"]:', candidate['Motivo Desclassificação']);
          Logger.log('   Tipo:', typeof candidate['Motivo Desclassificação']);
          Logger.log('   Valor (JSON):', JSON.stringify(candidate['Motivo Desclassificação']));

          // Mostrar TODOS os campos do candidato
          Logger.log('\n📋 TODOS OS CAMPOS DO CANDIDATO:');
          for (var key in candidate) {
            if (candidate.hasOwnProperty(key)) {
              Logger.log('   "' + key + '": ' + candidate[key]);
            }
          }
        }
      }
    }
  }

  Logger.log('📋 Total de candidatos com status "' + params.status + '":', candidates.length);

  return candidates;
}

function assignCandidates(params) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_CANDIDATOS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  Logger.log('📋 assignCandidates - Iniciando alocação...');
  Logger.log('  Candidatos: ' + params.candidateIds);
  Logger.log('  Analista: ' + params.analystEmail);
  Logger.log('  Admin: ' + params.adminEmail);

  const cpfCol = headers.indexOf('CPF');
  const assignedToCol = headers.indexOf('assigned_to');
  const assignedByCol = headers.indexOf('assigned_by');
  const assignedAtCol = headers.indexOf('assigned_at');
  const statusCol = headers.indexOf('Status');

  if (cpfCol < 0) {
    throw new Error('Coluna CPF não encontrada');
  }

  const candidateIds = params.candidateIds.split(',');
  let assignedCount = 0;

  for (let i = 1; i < data.length; i++) {
    const cpf = data[i][cpfCol];

    if (candidateIds.includes(String(cpf))) {
      Logger.log('  ✅ Alocando candidato CPF: ' + cpf);

      // Atualizar colunas de alocação
      if (assignedToCol >= 0) {
        sheet.getRange(i + 1, assignedToCol + 1).setValue(params.analystEmail);
      }
      if (assignedByCol >= 0) {
        sheet.getRange(i + 1, assignedByCol + 1).setValue(params.adminEmail);
      }
      if (assignedAtCol >= 0) {
        sheet.getRange(i + 1, assignedAtCol + 1).setValue(getCurrentTimestamp());
      }
      if (statusCol >= 0) {
        sheet.getRange(i + 1, statusCol + 1).setValue('em_analise');
      }

      assignedCount++;
    }
  }

  Logger.log('✅ assignCandidates - Total alocados: ' + assignedCount);

  return {
    success: true,
    assignedCount: assignedCount,
    message: assignedCount + ' candidatos alocados com sucesso'
  };
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
    sheet.getRange('A1:G1').setValues([
      ['Data/Hora', 'Número Inscrição', 'Tipo', 'Destinatário', 'Assunto', 'Conteúdo', 'Enviado Por']
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
    params.sentBy
  ];

  sheet.appendRow(newRow);
  return true;
}

// ============================================
// FUNÇÃO DE TESTE
// ============================================

function testConnection() {
  return {
    status: 'OK',
    timestamp: getCurrentTimestamp(),
    spreadsheetId: SPREADSHEET_ID
  };
}

// ============================================
// FUNÇÕES DE TEMPLATES DE MENSAGENS
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
// FUNÇÃO PARA ADICIONAR COLUNA STATUS
// ============================================

function addStatusColumnIfNotExists() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_CANDIDATOS);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  const requiredColumns = [
    'Status',
    'Motivo Desclassificação',
    'Observações',
    'Data Triagem',
    'Analista'
  ];

  requiredColumns.forEach(colName => {
    if (headers.indexOf(colName) === -1) {
      const lastCol = sheet.getLastColumn();
      sheet.getRange(1, lastCol + 1).setValue(colName);
    }
  });
}
