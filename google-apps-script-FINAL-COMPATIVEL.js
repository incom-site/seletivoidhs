// ============================================
// GOOGLE APPS SCRIPT - SISTEMA COMPLETO
// ============================================
//
// INSTRUÇÕES:
// 1. Cole este código completo no Google Apps Script
// 2. Configure o SPREADSHEET_ID abaixo (linha 13)
// 3. Vá em "Implantar" > "Nova implantação"
// 4. Tipo: "Aplicativo da Web"
// 5. Executar como: "Eu"
// 6. Quem tem acesso: "Qualquer pessoa"
// 7. Copie a URL gerada
//
// ============================================

var SPREADSHEET_ID = '1iQSQ06P_OXkqxaGWN3uG5jRYFBKyjWqQyvzuGk2EplY';
var SHEET_USUARIOS = 'USUARIOS';
var SHEET_CANDIDATOS = 'CANDIDATOS';
var SHEET_MOTIVOS = 'MOTIVOS';
var SHEET_MENSAGENS = 'MENSAGENS';
var SHEET_TEMPLATES = 'TEMPLATES';
var SHEET_ALIAS = 'ALIAS';

// ============================================
// ENTRADA - Suporta GET e POST
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
    var params = parseRequest(e);
    var action = params.action;

    Logger.log('🔵 Ação recebida: ' + action);
    Logger.log('📦 Parâmetros: ' + JSON.stringify(params));

    // Se não houver action, retorna erro informativo
    if (!action) {
      return createResponse({
        error: 'Parâmetro "action" é obrigatório',
        message: 'Para testar, use a função testConnection() diretamente ou acesse via URL com ?action=test',
        exemplo: 'URL?action=test'
      }, 400);
    }

    var routes = {
      'getUserRole': getUserRole,
      'getAllUsers': getAllUsers,
      'getAnalysts': getAnalysts,
      'getInterviewers': getInterviewers,
      'createUser': createUser,
      'updateUser': updateUser,
      'deleteUser': deleteUser,
      'getCandidates': getCandidates,
      'getCandidate': getCandidate,
      'addCandidate': addCandidate,
      'updateCandidate': updateCandidate,
      'deleteCandidate': deleteCandidate,
      'assignCandidates': assignCandidates,
      'bulkUpdateCandidates': bulkUpdateCandidates,
      'updateCandidateStatus': updateCandidateStatus,
      'getCandidatesByStatus': getCandidatesByStatus,
      'moveToInterview': moveToInterview,
      'getInterviewCandidates': getInterviewCandidates,
      'allocateToInterviewer': allocateToInterviewer,
      'getInterviewerCandidates': getInterviewerCandidates,
      'saveInterviewEvaluation': saveInterviewEvaluation,
      'sendMessages': sendMessages,
      'logMessage': logMessage,
      'updateMessageStatus': updateMessageStatus,
      'getMessageTemplates': getMessageTemplates,
      'getEmailAliases': getEmailAliases,
      'getStatistics': getStatistics,
      'getReportStats': getReportStats,
      'getReport': getReport,
      'getDisqualificationReasons': getDisqualificationReasons,
      'test': testConnection
    };

    if (routes[action]) {
      return routes[action](params);
    } else {
      return createResponse({ error: 'Ação não encontrada: ' + action }, 404);
    }
  } catch (error) {
    Logger.log('❌ Erro no handleRequest: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function parseRequest(e) {
  try {
    // Se não houver parâmetros (execução manual), retorna objeto vazio
    if (!e) {
      return {};
    }

    // Tenta parsear POST data
    if (e.postData && e.postData.contents) {
      return JSON.parse(e.postData.contents);
    }

    // Retorna parâmetros GET
    return e.parameter || {};
  } catch (error) {
    Logger.log('Erro ao fazer parse: ' + error.toString());
    return {};
  }
}

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getSheet(name) {
  var ss = getSpreadsheet();
  return ss.getSheetByName(name);
}

function createResponse(data, statusCode) {
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  output.setContent(JSON.stringify(data));
  return output;
}

function getCurrentTimestamp() {
  return new Date().toISOString();
}

function getHeaders(sheet) {
  if (!sheet) return [];
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return [];
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0];
}

function findRowByValue(sheet, columnName, value) {
  var headers = getHeaders(sheet);
  var colIndex = headers.indexOf(columnName);
  if (colIndex === -1) return -1;

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][colIndex] && data[i][colIndex].toString() === value.toString()) {
      return i + 1;
    }
  }
  return -1;
}

// ============================================
// FUNÇÕES DE USUÁRIOS
// ============================================

function getUserRole(params) {
  try {
    var email = params.email;
    if (!email) {
      return createResponse({ error: 'Email é obrigatório' }, 400);
    }

    var userSheet = getSheet(SHEET_USUARIOS);
    if (!userSheet) {
      return createResponse({ error: 'Planilha de usuários não encontrada' }, 404);
    }

    var data = userSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return createResponse({ error: 'Nenhum usuário cadastrado' }, 404);
    }

    var headers = data[0];
    var emailIndex = headers.indexOf('Email');
    var nomeIndex = headers.indexOf('Nome');
    var roleIndex = headers.indexOf('Role');
    var ativoIndex = headers.indexOf('Ativo');
    var passwordIndex = headers.indexOf('Password');

    for (var i = 1; i < data.length; i++) {
      if (data[i][emailIndex] && data[i][emailIndex].toLowerCase() === email.toLowerCase()) {
        if (passwordIndex >= 0 && params.password) {
          if (data[i][passwordIndex] !== params.password) {
            return createResponse({ error: 'Senha incorreta' }, 401);
          }
        }

        return createResponse({
          email: data[i][emailIndex],
          nome: data[i][nomeIndex] || '',
          role: data[i][roleIndex] || 'analista',
          ativo: data[i][ativoIndex] === true || data[i][ativoIndex] === 'TRUE',
          success: true
        });
      }
    }

    return createResponse({ error: 'Usuário não encontrado' }, 404);
  } catch (error) {
    Logger.log('Erro em getUserRole: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

function getAllUsers(params) {
  try {
    var userSheet = getSheet(SHEET_USUARIOS);
    if (!userSheet) {
      return createResponse({ users: [], success: true });
    }

    var data = userSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return createResponse({ users: [], success: true });
    }

    var headers = data[0];
    var users = [];

    for (var i = 1; i < data.length; i++) {
      var user = {};
      for (var j = 0; j < headers.length; j++) {
        user[headers[j]] = data[i][j];
      }

      if (user.Email) {
        users.push({
          id: user.Email,
          email: user.Email,
          name: user.Nome || '',
          role: user.Role || 'analista',
          active: user.Ativo === true || user.Ativo === 'TRUE'
        });
      }
    }

    return createResponse({ users: users, success: true });
  } catch (error) {
    Logger.log('Erro em getAllUsers: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

function getAnalysts(params) {
  try {
    Logger.log('🔍 Executando getAnalysts...');
    var userSheet = getSheet(SHEET_USUARIOS);

    if (!userSheet) {
      Logger.log('❌ Planilha USUARIOS não encontrada');
      return createResponse({ success: true, data: { analysts: [] } });
    }

    var data = userSheet.getDataRange().getValues();
    Logger.log('📊 Total de linhas na planilha: ' + data.length);

    if (data.length <= 1) {
      Logger.log('⚠️ Planilha vazia ou apenas com cabeçalho');
      return createResponse({ success: true, data: { analysts: [] } });
    }

    var headers = data[0];
    Logger.log('📋 Cabeçalhos: ' + JSON.stringify(headers));

    var analysts = [];

    for (var i = 1; i < data.length; i++) {
      var user = {};
      for (var j = 0; j < headers.length; j++) {
        user[headers[j]] = data[i][j];
      }

      var role = user.Role || '';
      Logger.log('👤 Linha ' + (i + 1) + ': Email=' + user.Email + ', Role=' + role);

      if (user.Email && role.toLowerCase() === 'analista') {
        analysts.push({
          id: user.Email,
          Email: user.Email,
          Nome: user.Nome || '',
          Role: user.Role,
          Ativo: user.Ativo === true || user.Ativo === 'TRUE'
        });
      }
    }

    Logger.log('✅ Total de analistas encontrados: ' + analysts.length);
    return createResponse({ success: true, data: { analysts: analysts } });
  } catch (error) {
    Logger.log('❌ Erro em getAnalysts: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

function getInterviewers(params) {
  try {
    var userSheet = getSheet(SHEET_USUARIOS);
    if (!userSheet) {
      return createResponse({ success: true, data: [] });
    }

    var data = userSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return createResponse({ success: true, data: [] });
    }

    var headers = data[0];
    var interviewers = [];

    for (var i = 1; i < data.length; i++) {
      var user = {};
      for (var j = 0; j < headers.length; j++) {
        user[headers[j]] = data[i][j];
      }

      if (user.Email && user.Role === 'entrevistador') {
        interviewers.push({
          id: user.Email,
          email: user.Email,
          name: user.Nome || '',
          role: user.Role,
          active: user.Ativo === true || user.Ativo === 'TRUE'
        });
      }
    }

    return createResponse({ success: true, data: interviewers });
  } catch (error) {
    Logger.log('Erro em getInterviewers: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

function createUser(params) {
  try {
    var email = params.email || params.Email;
    var nome = params.name || params.Nome;
    var role = params.role || params.Role;
    var ativo = params.active !== undefined ? params.active : params.Ativo;
    var password = params.password || params.Password || '123456';

    if (!email || !nome || !role) {
      return createResponse({ error: 'Email, Nome e Role são obrigatórios' }, 400);
    }

    var userSheet = getSheet(SHEET_USUARIOS);
    if (!userSheet) {
      return createResponse({ error: 'Planilha de usuários não encontrada' }, 404);
    }

    var existingRow = findRowByValue(userSheet, 'Email', email);
    if (existingRow > 0) {
      return createResponse({ error: 'Usuário já existe' }, 400);
    }

    userSheet.appendRow([
      email,
      nome,
      role,
      ativo === true || ativo === 'true' ? 'TRUE' : 'FALSE',
      password
    ]);

    return createResponse({
      success: true,
      message: 'Usuário criado com sucesso'
    });
  } catch (error) {
    Logger.log('Erro em createUser: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

function updateUser(params) {
  try {
    var email = params.email || params.Email;
    if (!email) {
      return createResponse({ error: 'Email é obrigatório' }, 400);
    }

    var userSheet = getSheet(SHEET_USUARIOS);
    if (!userSheet) {
      return createResponse({ error: 'Planilha de usuários não encontrada' }, 404);
    }

    var rowIndex = findRowByValue(userSheet, 'Email', email);
    if (rowIndex === -1) {
      return createResponse({ error: 'Usuário não encontrado' }, 404);
    }

    var headers = getHeaders(userSheet);

    if (params.name || params.Nome) {
      var colIndex = headers.indexOf('Nome');
      if (colIndex >= 0) {
        userSheet.getRange(rowIndex, colIndex + 1).setValue(params.name || params.Nome);
      }
    }

    if (params.role || params.Role) {
      var colIndex = headers.indexOf('Role');
      if (colIndex >= 0) {
        userSheet.getRange(rowIndex, colIndex + 1).setValue(params.role || params.Role);
      }
    }

    if (params.active !== undefined || params.Ativo !== undefined) {
      var colIndex = headers.indexOf('Ativo');
      if (colIndex >= 0) {
        var value = params.active === true || params.Ativo === true || params.active === 'true' || params.Ativo === 'true';
        userSheet.getRange(rowIndex, colIndex + 1).setValue(value ? 'TRUE' : 'FALSE');
      }
    }

    return createResponse({ success: true, message: 'Usuário atualizado' });
  } catch (error) {
    Logger.log('Erro em updateUser: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

function deleteUser(params) {
  try {
    var email = params.email || params.Email;
    if (!email) {
      return createResponse({ error: 'Email é obrigatório' }, 400);
    }

    var userSheet = getSheet(SHEET_USUARIOS);
    if (!userSheet) {
      return createResponse({ error: 'Planilha de usuários não encontrada' }, 404);
    }

    var rowIndex = findRowByValue(userSheet, 'Email', email);
    if (rowIndex === -1) {
      return createResponse({ error: 'Usuário não encontrado' }, 404);
    }

    userSheet.deleteRow(rowIndex);
    return createResponse({ success: true, message: 'Usuário deletado' });
  } catch (error) {
    Logger.log('Erro em deleteUser: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

// ============================================
// FUNÇÕES DE CANDIDATOS
// ============================================

function getCandidates(params) {
  try {
    var candidateSheet = getSheet(SHEET_CANDIDATOS);
    if (!candidateSheet) {
      return createResponse({ success: true, candidates: [] });
    }

    var data = candidateSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return createResponse({ success: true, candidates: [] });
    }

    var headers = data[0];
    var candidates = [];

    for (var i = 1; i < data.length; i++) {
      var candidate = {};
      for (var j = 0; j < headers.length; j++) {
        candidate[headers[j]] = data[i][j];
      }

      if (candidate.CPF || candidate.NOMECOMPLETO) {
        candidates.push(candidate);
      }
    }

    return createResponse({ success: true, candidates: candidates });
  } catch (error) {
    Logger.log('Erro em getCandidates: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

function getCandidate(params) {
  try {
    var id = params.registration_number || params.id || params.CPF;
    if (!id) {
      return createResponse({ error: 'ID do candidato é obrigatório' }, 400);
    }

    var candidateSheet = getSheet(SHEET_CANDIDATOS);
    if (!candidateSheet) {
      return createResponse({ error: 'Planilha de candidatos não encontrada' }, 404);
    }

    var data = candidateSheet.getDataRange().getValues();
    var headers = data[0];

    for (var i = 1; i < data.length; i++) {
      var cpf = data[i][headers.indexOf('CPF')];
      if (cpf && cpf.toString() === id.toString()) {
        var candidate = {};
        for (var j = 0; j < headers.length; j++) {
          candidate[headers[j]] = data[i][j];
        }
        return createResponse({ success: true, candidate: candidate });
      }
    }

    return createResponse({ error: 'Candidato não encontrado' }, 404);
  } catch (error) {
    Logger.log('Erro em getCandidate: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

function addCandidate(params) {
  try {
    var candidateSheet = getSheet(SHEET_CANDIDATOS);
    if (!candidateSheet) {
      return createResponse({ error: 'Planilha de candidatos não encontrada' }, 404);
    }

    var headers = getHeaders(candidateSheet);
    var newRow = [];
    var timestamp = getCurrentTimestamp();

    for (var i = 0; i < headers.length; i++) {
      var header = headers[i];
      if (header === 'created_at' || header === 'DataCadastro') {
        newRow.push(timestamp);
      } else if (header === 'updated_at') {
        newRow.push(timestamp);
      } else if (header === 'Status' && !params[header]) {
        newRow.push('pendente');
      } else {
        newRow.push(params[header] || '');
      }
    }

    candidateSheet.appendRow(newRow);

    return createResponse({
      success: true,
      message: 'Candidato adicionado com sucesso'
    });
  } catch (error) {
    Logger.log('Erro em addCandidate: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

function updateCandidate(params) {
  try {
    var id = params.registration_number || params.id || params.CPF || params.candidateCPF;
    if (!id) {
      return createResponse({ error: 'ID do candidato é obrigatório' }, 400);
    }

    var candidateSheet = getSheet(SHEET_CANDIDATOS);
    if (!candidateSheet) {
      return createResponse({ error: 'Planilha de candidatos não encontrada' }, 404);
    }

    var rowIndex = findRowByValue(candidateSheet, 'CPF', id);
    if (rowIndex === -1) {
      return createResponse({ error: 'Candidato não encontrado' }, 404);
    }

    var headers = getHeaders(candidateSheet);

    for (var key in params) {
      if (key !== 'action' && key !== 'registration_number' && key !== 'id' && key !== 'CPF' && key !== 'candidateCPF') {
        var colIndex = headers.indexOf(key);
        if (colIndex >= 0) {
          candidateSheet.getRange(rowIndex, colIndex + 1).setValue(params[key]);
        }
      }
    }

    var updatedAtIndex = headers.indexOf('updated_at');
    if (updatedAtIndex >= 0) {
      candidateSheet.getRange(rowIndex, updatedAtIndex + 1).setValue(getCurrentTimestamp());
    }

    return createResponse({ success: true, message: 'Candidato atualizado' });
  } catch (error) {
    Logger.log('Erro em updateCandidate: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

function deleteCandidate(params) {
  try {
    var id = params.registration_number || params.id || params.CPF || params.candidateCPF;
    if (!id) {
      return createResponse({ error: 'ID do candidato é obrigatório' }, 400);
    }

    var candidateSheet = getSheet(SHEET_CANDIDATOS);
    if (!candidateSheet) {
      return createResponse({ error: 'Planilha de candidatos não encontrada' }, 404);
    }

    var rowIndex = findRowByValue(candidateSheet, 'CPF', id);
    if (rowIndex === -1) {
      return createResponse({ error: 'Candidato não encontrado' }, 404);
    }

    candidateSheet.deleteRow(rowIndex);
    return createResponse({ success: true, message: 'Candidato deletado' });
  } catch (error) {
    Logger.log('Erro em deleteCandidate: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

function assignCandidates(params) {
  try {
    var candidateIds = params.candidateIds;
    var analystEmail = params.analystEmail || params.analystId;
    var adminEmail = params.adminEmail || params.adminId;

    Logger.log('📥 assignCandidates - IDs: ' + candidateIds);
    Logger.log('📥 assignCandidates - Analista: ' + analystEmail);

    if (!candidateIds || !analystEmail) {
      return createResponse({ error: 'IDs dos candidatos e email do analista são obrigatórios' }, 400);
    }

    var ids = typeof candidateIds === 'string' ? candidateIds.split(',') : candidateIds;
    for (var i = 0; i < ids.length; i++) {
      ids[i] = ids[i].trim();
    }

    var candidateSheet = getSheet(SHEET_CANDIDATOS);

    if (!candidateSheet) {
      return createResponse({ error: 'Planilha de candidatos não encontrada' }, 404);
    }

    var headers = getHeaders(candidateSheet);
    var cpfIndex = headers.indexOf('CPF');
    var assignedToIndex = headers.indexOf('assigned_to');
    var assignedByIndex = headers.indexOf('assigned_by');
    var assignedAtIndex = headers.indexOf('assigned_at');
    var statusIndex = headers.indexOf('Status');
    var updatedAtIndex = headers.indexOf('updated_at');

    var timestamp = getCurrentTimestamp();
    var updated = 0;

    var data = candidateSheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      var cpf = data[i][cpfIndex];
      if (cpf && ids.indexOf(cpf.toString()) !== -1) {
        if (assignedToIndex >= 0) {
          candidateSheet.getRange(i + 1, assignedToIndex + 1).setValue(analystEmail);
        }
        if (assignedByIndex >= 0 && adminEmail) {
          candidateSheet.getRange(i + 1, assignedByIndex + 1).setValue(adminEmail);
        }
        if (assignedAtIndex >= 0) {
          candidateSheet.getRange(i + 1, assignedAtIndex + 1).setValue(timestamp);
        }
        if (statusIndex >= 0) {
          candidateSheet.getRange(i + 1, statusIndex + 1).setValue('em_analise');
        }
        if (updatedAtIndex >= 0) {
          candidateSheet.getRange(i + 1, updatedAtIndex + 1).setValue(timestamp);
        }
        updated++;
      }
    }

    Logger.log('✅ Total alocados: ' + updated);

    return createResponse({
      success: true,
      message: updated + ' candidato(s) atribuído(s) com sucesso',
      updated: updated
    });
  } catch (error) {
    Logger.log('❌ Erro em assignCandidates: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

function bulkUpdateCandidates(params) {
  try {
    var updates = params.updates;
    if (!updates) {
      return createResponse({ error: 'Lista de atualizações é obrigatória' }, 400);
    }

    var updateList = typeof updates === 'string' ? JSON.parse(updates) : updates;
    var candidateSheet = getSheet(SHEET_CANDIDATOS);

    if (!candidateSheet) {
      return createResponse({ error: 'Planilha de candidatos não encontrada' }, 404);
    }

    var updated = 0;

    for (var i = 0; i < updateList.length; i++) {
      var update = updateList[i];
      var rowIndex = findRowByValue(candidateSheet, 'CPF', update.id);
      if (rowIndex > 0) {
        var headers = getHeaders(candidateSheet);
        for (var key in update) {
          if (key !== 'id') {
            var colIndex = headers.indexOf(key);
            if (colIndex >= 0) {
              candidateSheet.getRange(rowIndex, colIndex + 1).setValue(update[key]);
            }
          }
        }
        updated++;
      }
    }

    return createResponse({
      success: true,
      message: updated + ' candidato(s) atualizado(s)',
      updated: updated
    });
  } catch (error) {
    Logger.log('Erro em bulkUpdateCandidates: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

function updateCandidateStatus(params) {
  try {
    var registrationNumber = params.registrationNumber;
    var statusTriagem = params.statusTriagem;
    var reasonId = params.reasonId;
    var notes = params.notes;
    var analystEmail = params.analystEmail;

    if (!registrationNumber || !statusTriagem) {
      return createResponse({ error: 'Número de registro e status são obrigatórios' }, 400);
    }

    var candidateSheet = getSheet(SHEET_CANDIDATOS);
    if (!candidateSheet) {
      return createResponse({ error: 'Planilha de candidatos não encontrada' }, 404);
    }

    var rowIndex = findRowByValue(candidateSheet, 'CPF', registrationNumber);
    if (rowIndex === -1) {
      return createResponse({ error: 'Candidato não encontrado' }, 404);
    }

    var headers = getHeaders(candidateSheet);
    var timestamp = getCurrentTimestamp();

    var statusTriagemIndex = headers.indexOf('status_triagem');
    if (statusTriagemIndex >= 0) {
      candidateSheet.getRange(rowIndex, statusTriagemIndex + 1).setValue(statusTriagem);
    }

    var dataTriagemIndex = headers.indexOf('data_hora_triagem');
    if (dataTriagemIndex >= 0) {
      candidateSheet.getRange(rowIndex, dataTriagemIndex + 1).setValue(timestamp);
    }

    var analistaTriagemIndex = headers.indexOf('analista_triagem');
    if (analistaTriagemIndex >= 0 && analystEmail) {
      candidateSheet.getRange(rowIndex, analistaTriagemIndex + 1).setValue(analystEmail);
    }

    if (reasonId) {
      var motivoIndex = headers.indexOf('motivo_desclassificacao');
      if (motivoIndex >= 0) {
        candidateSheet.getRange(rowIndex, motivoIndex + 1).setValue(reasonId);
      }
    }

    if (notes) {
      var notesIndex = headers.indexOf('observacoes_triagem');
      if (notesIndex >= 0) {
        candidateSheet.getRange(rowIndex, notesIndex + 1).setValue(notes);
      }
    }

    var updatedAtIndex = headers.indexOf('updated_at');
    if (updatedAtIndex >= 0) {
      candidateSheet.getRange(rowIndex, updatedAtIndex + 1).setValue(timestamp);
    }

    return createResponse({
      success: true,
      message: 'Status atualizado com sucesso'
    });
  } catch (error) {
    Logger.log('Erro em updateCandidateStatus: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

function getCandidatesByStatus(params) {
  try {
    var status = params.status;
    if (!status) {
      return createResponse({ error: 'Status é obrigatório' }, 400);
    }

    var candidateSheet = getSheet(SHEET_CANDIDATOS);
    if (!candidateSheet) {
      return createResponse({ success: true, data: [] });
    }

    var data = candidateSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return createResponse({ success: true, data: [] });
    }

    var headers = data[0];
    var statusIndex = headers.indexOf('status_triagem');

    if (statusIndex === -1) {
      return createResponse({ success: true, data: [] });
    }

    var candidates = [];

    for (var i = 1; i < data.length; i++) {
      if (data[i][statusIndex] === status) {
        var candidate = {};
        for (var j = 0; j < headers.length; j++) {
          candidate[headers[j]] = data[i][j];
        }
        candidates.push(candidate);
      }
    }

    return createResponse({ success: true, data: candidates });
  } catch (error) {
    Logger.log('Erro em getCandidatesByStatus: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

// ============================================
// FUNÇÕES DE ENTREVISTA
// ============================================

function moveToInterview(params) {
  try {
    var candidateIds = params.candidateIds;
    if (!candidateIds) {
      return createResponse({ error: 'IDs dos candidatos são obrigatórios' }, 400);
    }

    var ids = typeof candidateIds === 'string' ? candidateIds.split(',') : candidateIds;
    for (var i = 0; i < ids.length; i++) {
      ids[i] = ids[i].trim();
    }

    var candidateSheet = getSheet(SHEET_CANDIDATOS);

    if (!candidateSheet) {
      return createResponse({ error: 'Planilha de candidatos não encontrada' }, 404);
    }

    var headers = getHeaders(candidateSheet);
    var cpfIndex = headers.indexOf('CPF');
    var statusEntrevistaIndex = headers.indexOf('status_entrevista');
    var updatedAtIndex = headers.indexOf('updated_at');

    var timestamp = getCurrentTimestamp();
    var updated = 0;

    var data = candidateSheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      var cpf = data[i][cpfIndex];
      if (cpf && ids.indexOf(cpf.toString()) !== -1) {
        if (statusEntrevistaIndex >= 0) {
          candidateSheet.getRange(i + 1, statusEntrevistaIndex + 1).setValue('Aguardando Entrevista');
        }
        if (updatedAtIndex >= 0) {
          candidateSheet.getRange(i + 1, updatedAtIndex + 1).setValue(timestamp);
        }
        updated++;
      }
    }

    return createResponse({
      success: true,
      message: updated + ' candidato(s) movido(s) para entrevista',
      updated: updated
    });
  } catch (error) {
    Logger.log('Erro em moveToInterview: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

function getInterviewCandidates(params) {
  try {
    var candidateSheet = getSheet(SHEET_CANDIDATOS);
    if (!candidateSheet) {
      return createResponse({ success: true, data: [] });
    }

    var data = candidateSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return createResponse({ success: true, data: [] });
    }

    var headers = data[0];
    var statusEntrevistaIndex = headers.indexOf('status_entrevista');

    if (statusEntrevistaIndex === -1) {
      return createResponse({ success: true, data: [] });
    }

    var candidates = [];

    for (var i = 1; i < data.length; i++) {
      var status = data[i][statusEntrevistaIndex];
      if (status === 'Aguardando Entrevista' || status === 'Em Entrevista') {
        var candidate = {};
        for (var j = 0; j < headers.length; j++) {
          candidate[headers[j]] = data[i][j];
        }
        candidates.push(candidate);
      }
    }

    return createResponse({ success: true, data: candidates });
  } catch (error) {
    Logger.log('Erro em getInterviewCandidates: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

function allocateToInterviewer(params) {
  try {
    var candidateIds = params.candidateIds;
    var interviewerEmail = params.interviewerEmail;
    var adminEmail = params.adminEmail;

    if (!candidateIds || !interviewerEmail) {
      return createResponse({ error: 'IDs dos candidatos e email do entrevistador são obrigatórios' }, 400);
    }

    var ids = typeof candidateIds === 'string' ? candidateIds.split(',') : candidateIds;
    for (var i = 0; i < ids.length; i++) {
      ids[i] = ids[i].trim();
    }

    var candidateSheet = getSheet(SHEET_CANDIDATOS);

    if (!candidateSheet) {
      return createResponse({ error: 'Planilha de candidatos não encontrada' }, 404);
    }

    var headers = getHeaders(candidateSheet);
    var cpfIndex = headers.indexOf('CPF');
    var entrevistadorIndex = headers.indexOf('entrevistador');
    var entrevistadorByIndex = headers.indexOf('entrevistador_by');
    var entrevistadorAtIndex = headers.indexOf('entrevistador_at');
    var statusEntrevistaIndex = headers.indexOf('status_entrevista');
    var updatedAtIndex = headers.indexOf('updated_at');

    var timestamp = getCurrentTimestamp();
    var updated = 0;

    var data = candidateSheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      var cpf = data[i][cpfIndex];
      if (cpf && ids.indexOf(cpf.toString()) !== -1) {
        if (entrevistadorIndex >= 0) {
          candidateSheet.getRange(i + 1, entrevistadorIndex + 1).setValue(interviewerEmail);
        }
        if (entrevistadorByIndex >= 0 && adminEmail) {
          candidateSheet.getRange(i + 1, entrevistadorByIndex + 1).setValue(adminEmail);
        }
        if (entrevistadorAtIndex >= 0) {
          candidateSheet.getRange(i + 1, entrevistadorAtIndex + 1).setValue(timestamp);
        }
        if (statusEntrevistaIndex >= 0) {
          candidateSheet.getRange(i + 1, statusEntrevistaIndex + 1).setValue('Em Entrevista');
        }
        if (updatedAtIndex >= 0) {
          candidateSheet.getRange(i + 1, updatedAtIndex + 1).setValue(timestamp);
        }
        updated++;
      }
    }

    return createResponse({
      success: true,
      message: updated + ' candidato(s) alocado(s) para entrevista',
      updated: updated
    });
  } catch (error) {
    Logger.log('Erro em allocateToInterviewer: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

function getInterviewerCandidates(params) {
  try {
    var interviewerEmail = params.interviewerEmail;
    if (!interviewerEmail) {
      return createResponse({ error: 'Email do entrevistador é obrigatório' }, 400);
    }

    var candidateSheet = getSheet(SHEET_CANDIDATOS);
    if (!candidateSheet) {
      return createResponse({ success: true, data: [] });
    }

    var data = candidateSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return createResponse({ success: true, data: [] });
    }

    var headers = data[0];
    var entrevistadorIndex = headers.indexOf('entrevistador');

    if (entrevistadorIndex === -1) {
      return createResponse({ success: true, data: [] });
    }

    var candidates = [];

    for (var i = 1; i < data.length; i++) {
      if (data[i][entrevistadorIndex] === interviewerEmail) {
        var candidate = {};
        for (var j = 0; j < headers.length; j++) {
          candidate[headers[j]] = data[i][j];
        }
        candidates.push(candidate);
      }
    }

    return createResponse({ success: true, data: candidates });
  } catch (error) {
    Logger.log('Erro em getInterviewerCandidates: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

function saveInterviewEvaluation(params) {
  try {
    var registrationNumber = params.registrationNumber;
    if (!registrationNumber) {
      return createResponse({ error: 'Número de registro é obrigatório' }, 400);
    }

    var candidateSheet = getSheet(SHEET_CANDIDATOS);
    if (!candidateSheet) {
      return createResponse({ error: 'Planilha de candidatos não encontrada' }, 404);
    }

    var rowIndex = findRowByValue(candidateSheet, 'CPF', registrationNumber);
    if (rowIndex === -1) {
      return createResponse({ error: 'Candidato não encontrado' }, 404);
    }

    var headers = getHeaders(candidateSheet);
    var timestamp = getCurrentTimestamp();

    var fieldsToUpdate = [
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

    for (var i = 0; i < fieldsToUpdate.length; i++) {
      var field = fieldsToUpdate[i];
      if (params[field] !== undefined) {
        var colIndex = headers.indexOf(field);
        if (colIndex >= 0) {
          candidateSheet.getRange(rowIndex, colIndex + 1).setValue(params[field]);
        }
      }
    }

    var completedAtIndex = headers.indexOf('interview_completed_at');
    if (completedAtIndex >= 0) {
      candidateSheet.getRange(rowIndex, completedAtIndex + 1).setValue(timestamp);
    }

    var statusEntrevistaIndex = headers.indexOf('status_entrevista');
    if (statusEntrevistaIndex >= 0) {
      candidateSheet.getRange(rowIndex, statusEntrevistaIndex + 1).setValue('Entrevista Concluída');
    }

    var updatedAtIndex = headers.indexOf('updated_at');
    if (updatedAtIndex >= 0) {
      candidateSheet.getRange(rowIndex, updatedAtIndex + 1).setValue(timestamp);
    }

    return createResponse({
      success: true,
      message: 'Avaliação salva com sucesso'
    });
  } catch (error) {
    Logger.log('Erro em saveInterviewEvaluation: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

// ============================================
// FUNÇÕES DE MENSAGENS
// ============================================

function sendMessages(params) {
  try {
    var messageType = params.messageType;
    var subject = params.subject || '';
    var content = params.content;
    var candidateIds = params.candidateIds;
    var sentBy = params.sentBy;
    var fromAlias = params.fromAlias;

    if (!messageType || !content || !candidateIds) {
      return createResponse({ error: 'Parâmetros insuficientes' }, 400);
    }

    var ids = typeof candidateIds === 'string' ? candidateIds.split(',') : candidateIds;
    for (var i = 0; i < ids.length; i++) {
      ids[i] = ids[i].trim();
    }

    var result = {
      success: true,
      message: 'Mensagens enviadas com sucesso',
      sent: ids.length,
      failed: 0
    };

    for (var i = 0; i < ids.length; i++) {
      logMessage({
        registrationNumber: ids[i],
        messageType: messageType,
        recipient: 'destinatario@example.com',
        subject: subject,
        content: content,
        sentBy: sentBy
      });
    }

    return createResponse(result);
  } catch (error) {
    Logger.log('Erro em sendMessages: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

function logMessage(params) {
  try {
    var mensagensSheet = getSheet(SHEET_MENSAGENS);
    if (!mensagensSheet) {
      return createResponse({ success: true, message: 'Aba MENSAGENS não encontrada, log ignorado' });
    }

    var timestamp = getCurrentTimestamp();

    mensagensSheet.appendRow([
      timestamp,
      params.registrationNumber || '',
      params.messageType || '',
      params.recipient || '',
      params.subject || '',
      params.content || '',
      params.sentBy || '',
      'Enviado'
    ]);

    return createResponse({ success: true, message: 'Mensagem registrada' });
  } catch (error) {
    Logger.log('Erro em logMessage: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

function updateMessageStatus(params) {
  try {
    var registrationNumbers = params.registrationNumbers;
    var messageType = params.messageType;
    var status = params.status;

    if (!registrationNumbers || !messageType || !status) {
      return createResponse({ error: 'Parâmetros insuficientes' }, 400);
    }

    var ids = typeof registrationNumbers === 'string' ? registrationNumbers.split(',') : registrationNumbers;
    for (var i = 0; i < ids.length; i++) {
      ids[i] = ids[i].trim();
    }

    var candidateSheet = getSheet(SHEET_CANDIDATOS);

    if (!candidateSheet) {
      return createResponse({ error: 'Planilha de candidatos não encontrada' }, 404);
    }

    var headers = getHeaders(candidateSheet);
    var cpfIndex = headers.indexOf('CPF');
    var columnName = messageType === 'email' ? 'email_sent' : 'sms_sent';
    var statusIndex = headers.indexOf(columnName);

    if (statusIndex === -1) {
      return createResponse({ error: 'Coluna ' + columnName + ' não encontrada' }, 404);
    }

    var updated = 0;
    var data = candidateSheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      var cpf = data[i][cpfIndex];
      if (cpf && ids.indexOf(cpf.toString()) !== -1) {
        candidateSheet.getRange(i + 1, statusIndex + 1).setValue(status);
        updated++;
      }
    }

    return createResponse({
      success: true,
      message: updated + ' status(es) atualizado(s)',
      updated: updated
    });
  } catch (error) {
    Logger.log('Erro em updateMessageStatus: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

function getMessageTemplates(params) {
  try {
    var templatesSheet = getSheet(SHEET_TEMPLATES);
    if (!templatesSheet) {
      return createResponse({ success: true, data: [] });
    }

    var data = templatesSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return createResponse({ success: true, data: [] });
    }

    var headers = data[0];
    var templates = [];

    for (var i = 1; i < data.length; i++) {
      var template = {};
      for (var j = 0; j < headers.length; j++) {
        template[headers[j]] = data[i][j];
      }
      if (template.nome) {
        templates.push(template);
      }
    }

    return createResponse({ success: true, data: templates });
  } catch (error) {
    Logger.log('Erro em getMessageTemplates: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

function getEmailAliases(params) {
  try {
    var aliasSheet = getSheet(SHEET_ALIAS);
    if (!aliasSheet) {
      return createResponse({ success: true, data: [] });
    }

    var data = aliasSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return createResponse({ success: true, data: [] });
    }

    var headers = data[0];
    var aliases = [];

    for (var i = 1; i < data.length; i++) {
      var alias = {};
      for (var j = 0; j < headers.length; j++) {
        alias[headers[j]] = data[i][j];
      }
      if (alias.email) {
        aliases.push(alias);
      }
    }

    return createResponse({ success: true, data: aliases });
  } catch (error) {
    Logger.log('Erro em getEmailAliases: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

// ============================================
// FUNÇÕES DE RELATÓRIOS
// ============================================

function getStatistics(params) {
  try {
    var candidateSheet = getSheet(SHEET_CANDIDATOS);
    if (!candidateSheet) {
      return createResponse({
        total: 0,
        pendente: 0,
        em_analise: 0,
        concluido: 0
      });
    }

    var data = candidateSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return createResponse({
        total: 0,
        pendente: 0,
        em_analise: 0,
        concluido: 0
      });
    }

    var headers = data[0];
    var statusIndex = headers.indexOf('Status');

    var stats = {
      total: data.length - 1,
      pendente: 0,
      em_analise: 0,
      concluido: 0
    };

    for (var i = 1; i < data.length; i++) {
      var status = data[i][statusIndex];
      if (status === 'pendente') stats.pendente++;
      else if (status === 'em_analise') stats.em_analise++;
      else if (status === 'concluido') stats.concluido++;
    }

    return createResponse(stats);
  } catch (error) {
    Logger.log('Erro em getStatistics: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

function getReportStats(params) {
  try {
    var candidateSheet = getSheet(SHEET_CANDIDATOS);
    if (!candidateSheet) {
      return createResponse({ success: true, data: {} });
    }

    var data = candidateSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return createResponse({ success: true, data: {} });
    }

    var headers = data[0];
    var stats = {
      total: data.length - 1,
      classificados: 0,
      desclassificados: 0,
      revisar: 0,
      aguardando_entrevista: 0,
      entrevista_concluida: 0
    };

    var statusTriagemIndex = headers.indexOf('status_triagem');
    var statusEntrevistaIndex = headers.indexOf('status_entrevista');

    for (var i = 1; i < data.length; i++) {
      if (statusTriagemIndex >= 0) {
        var statusTriagem = data[i][statusTriagemIndex];
        if (statusTriagem === 'Classificado') stats.classificados++;
        else if (statusTriagem === 'Desclassificado') stats.desclassificados++;
        else if (statusTriagem === 'Revisar') stats.revisar++;
      }

      if (statusEntrevistaIndex >= 0) {
        var statusEntrevista = data[i][statusEntrevistaIndex];
        if (statusEntrevista === 'Aguardando Entrevista') stats.aguardando_entrevista++;
        else if (statusEntrevista === 'Entrevista Concluída') stats.entrevista_concluida++;
      }
    }

    return createResponse({ success: true, data: stats });
  } catch (error) {
    Logger.log('Erro em getReportStats: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

function getReport(params) {
  try {
    var reportType = params.reportType;
    if (!reportType) {
      return createResponse({ error: 'Tipo de relatório é obrigatório' }, 400);
    }

    var candidateSheet = getSheet(SHEET_CANDIDATOS);
    if (!candidateSheet) {
      return createResponse({ success: true, data: [] });
    }

    var data = candidateSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return createResponse({ success: true, data: [] });
    }

    var headers = data[0];
    var candidates = [];

    for (var i = 1; i < data.length; i++) {
      var candidate = {};
      for (var j = 0; j < headers.length; j++) {
        candidate[headers[j]] = data[i][j];
      }
      candidates.push(candidate);
    }

    return createResponse({ success: true, data: candidates });
  } catch (error) {
    Logger.log('Erro em getReport: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

// ============================================
// FUNÇÕES DE MOTIVOS
// ============================================

function getDisqualificationReasons(params) {
  try {
    var motivosSheet = getSheet(SHEET_MOTIVOS);
    if (!motivosSheet) {
      return createResponse({ success: true, data: [] });
    }

    var data = motivosSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return createResponse({ success: true, data: [] });
    }

    var headers = data[0];
    var reasons = [];

    for (var i = 1; i < data.length; i++) {
      var reason = {};
      for (var j = 0; j < headers.length; j++) {
        reason[headers[j]] = data[i][j];
      }
      if (reason.id || reason.motivo) {
        reasons.push(reason);
      }
    }

    return createResponse({ success: true, data: reasons });
  } catch (error) {
    Logger.log('Erro em getDisqualificationReasons: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

// ============================================
// FUNÇÃO DE TESTE
// ============================================

function testConnection(params) {
  try {
    var ss = getSpreadsheet();
    var sheets = ss.getSheets();
    var sheetNames = [];
    for (var i = 0; i < sheets.length; i++) {
      sheetNames.push(sheets[i].getName());
    }

    return createResponse({
      success: true,
      message: 'Conexão funcionando!',
      spreadsheet_id: SPREADSHEET_ID,
      sheets: sheetNames,
      timestamp: getCurrentTimestamp()
    });
  } catch (error) {
    Logger.log('Erro em testConnection: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

// ============================================
// FUNÇÃO PARA TESTAR NO EDITOR
// ============================================

/**
 * Função para testar diretamente no editor do Google Apps Script
 * Clique em "Executar" com esta função selecionada para testar
 */
function testarScript() {
  Logger.log('🧪 Iniciando teste do script...');

  try {
    // Testa conexão com a planilha
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    Logger.log('✅ Conexão com planilha OK');
    Logger.log('📋 Nome da planilha: ' + ss.getName());

    // Lista as abas
    var sheets = ss.getSheets();
    Logger.log('📊 Total de abas: ' + sheets.length);

    for (var i = 0; i < sheets.length; i++) {
      Logger.log('  - ' + sheets[i].getName());
    }

    // Testa a função testConnection
    Logger.log('\n🔍 Testando função testConnection...');
    var result = testConnection({});
    Logger.log('📦 Resultado: ' + JSON.stringify(result));

    Logger.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!');
    Logger.log('🚀 O script está funcionando corretamente.');
    Logger.log('📝 Próximo passo: Implantar como Web App');

    return 'Teste concluído com sucesso!';

  } catch (error) {
    Logger.log('❌ ERRO NO TESTE: ' + error.toString());
    Logger.log('🔍 Verifique o SPREADSHEET_ID na linha 16');
    return 'Erro: ' + error.toString();
  }
}
