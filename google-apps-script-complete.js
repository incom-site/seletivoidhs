// ============================================
// GOOGLE APPS SCRIPT - SISTEMA DE TRIAGEM
// ============================================
//
// INSTRUÇÕES DE CONFIGURAÇÃO:
// 1. Abra o Google Apps Script Editor
// 2. Cole este código completo
// 3. Configure SPREADSHEET_ID abaixo com o ID da sua planilha
// 4. Clique em "Implantar" > "Nova implantação"
// 5. Escolha "Aplicativo da Web"
// 6. Configure "Executar como": Eu
// 7. Configure "Quem tem acesso": Qualquer pessoa
// 8. Copie a URL gerada e use no projeto
//
// ============================================

// ============================================
// CONFIGURAÇÃO
// ============================================
const SPREADSHEET_ID = '1iQSQ06P_OXkqxaGWN3uG5jRYFBKyjWqQyvzuGk2EplY';
const SHEET_USUARIOS = 'USUARIOS';
const SHEET_CANDIDATOS = 'CANDIDATOS';

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
    const action = e.parameter.action;

    const actions = {
      // Usuários
      'getUserRole': getUserRole,
      'getAllUsers': getAllUsers,
      'createUser': createUser,
      'updateUser': updateUser,
      'updateUserRole': updateUserRole,
      'deleteUser': deleteUser,

      // Candidatos
      'getCandidates': getCandidates,
      'getCandidate': getCandidate,
      'addCandidate': addCandidate,
      'updateCandidate': updateCandidate,
      'deleteCandidate': deleteCandidate,
      'assignCandidates': assignCandidates,
      'bulkUpdateCandidates': bulkUpdateCandidates,

      // Estatísticas
      'getStatistics': getStatistics,

      // Teste
      'test': testConnection
    };

    if (actions[action]) {
      return actions[action](e);
    } else {
      return createResponse({ error: 'Ação não encontrada: ' + action }, 404);
    }
  } catch (error) {
    Logger.log('Erro no handleRequest: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function getSpreadsheet() {
  try {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (error) {
    throw new Error('Erro ao acessar planilha: ' + error.toString());
  }
}

function createResponse(data, statusCode = 200) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  output.setContent(JSON.stringify(data));
  return output;
}

function getCurrentTimestamp() {
  return new Date().toISOString();
}

function parsePostData(e) {
  try {
    if (e.postData && e.postData.contents) {
      return JSON.parse(e.postData.contents);
    }
    return e.parameter;
  } catch (error) {
    Logger.log('Erro ao fazer parse dos dados POST: ' + error.toString());
    return e.parameter;
  }
}

// ============================================
// FUNÇÕES DE USUÁRIOS
// ============================================

function getUserRole(e) {
  try {
    const params = parsePostData(e);
    const email = params.email || e.parameter.email;

    if (!email) {
      return createResponse({ error: 'Email é obrigatório' }, 400);
    }

    const ss = getSpreadsheet();
    const userSheet = ss.getSheetByName(SHEET_USUARIOS);

    if (!userSheet) {
      return createResponse({ error: 'Planilha de usuários não encontrada' }, 404);
    }

    const data = userSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return createResponse({ error: 'Nenhum usuário cadastrado', success: false }, 404);
    }

    const headers = data[0];
    const emailIndex = headers.indexOf('Email');
    const nomeIndex = headers.indexOf('Nome');
    const roleIndex = headers.indexOf('Role');
    const ativoIndex = headers.indexOf('Ativo');
    const passwordIndex = headers.indexOf('Password');

    for (let i = 1; i < data.length; i++) {
      if (data[i][emailIndex] && data[i][emailIndex].toLowerCase() === email.toLowerCase()) {
        const user = {
          email: data[i][emailIndex],
          nome: data[i][nomeIndex] || '',
          role: data[i][roleIndex] || 'analista',
          ativo: data[i][ativoIndex] === true || data[i][ativoIndex] === 'true' || data[i][ativoIndex] === 'TRUE',
          success: true
        };

        if (passwordIndex >= 0 && params.password) {
          if (data[i][passwordIndex] !== params.password) {
            return createResponse({ error: 'Senha incorreta', success: false }, 401);
          }
        }

        return createResponse(user);
      }
    }

    return createResponse({ error: 'Usuário não encontrado', success: false }, 404);
  } catch (error) {
    Logger.log('Erro em getUserRole: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

function getAllUsers(e) {
  try {
    const ss = getSpreadsheet();
    const userSheet = ss.getSheetByName(SHEET_USUARIOS);

    if (!userSheet) {
      return createResponse({ users: [], success: true });
    }

    const data = userSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return createResponse({ users: [], success: true });
    }

    const headers = data[0];
    const users = [];

    for (let i = 1; i < data.length; i++) {
      const user = {};
      headers.forEach((header, index) => {
        user[header] = data[i][index];
      });

      if (user.Email) {
        users.push({
          id: user.Email,
          email: user.Email,
          name: user.Nome || '',
          role: user.Role || 'analista',
          active: user.Ativo === true || user.Ativo === 'true' || user.Ativo === 'TRUE'
        });
      }
    }

    return createResponse({ users: users, success: true });
  } catch (error) {
    Logger.log('Erro em getAllUsers: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

function createUser(e) {
  try {
    const params = parsePostData(e);
    const email = params.email || params.Email || e.parameter.email || e.parameter.Email;
    const nome = params.name || params.Nome || e.parameter.name || e.parameter.Nome;
    const role = params.role || params.Role || e.parameter.role || e.parameter.Role;
    const ativo = params.active || params.Ativo || e.parameter.active || e.parameter.Ativo;
    const password = params.password || params.Password || e.parameter.password || e.parameter.Password;

    if (!email || !nome || !role) {
      return createResponse({ error: 'Email, Nome e Role são obrigatórios' }, 400);
    }

    const ss = getSpreadsheet();
    let userSheet = ss.getSheetByName(SHEET_USUARIOS);

    if (!userSheet) {
      userSheet = ss.insertSheet(SHEET_USUARIOS);
      userSheet.appendRow(['Email', 'Nome', 'Role', 'Ativo', 'Password']);
    }

    const data = userSheet.getDataRange().getValues();
    const emailIndex = 0;

    for (let i = 1; i < data.length; i++) {
      if (data[i][emailIndex] && data[i][emailIndex].toLowerCase() === email.toLowerCase()) {
        return createResponse({ error: 'Usuário já existe' }, 400);
      }
    }

    userSheet.appendRow([
      email,
      nome,
      role,
      ativo === 'true' || ativo === true || ativo === undefined ? 'TRUE' : 'FALSE',
      password || '123456'
    ]);

    return createResponse({
      success: true,
      message: 'Usuário criado com sucesso',
      user: {
        email: email,
        name: nome,
        role: role,
        active: ativo === 'true' || ativo === true || ativo === undefined
      }
    });
  } catch (error) {
    Logger.log('Erro em createUser: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

function updateUser(e) {
  try {
    const params = parsePostData(e);
    const email = params.email || params.Email || e.parameter.email || e.parameter.Email;
    const nome = params.name || params.Nome || e.parameter.name || e.parameter.Nome;
    const role = params.role || params.Role || e.parameter.role || e.parameter.Role;
    const ativo = params.active || params.Ativo || e.parameter.active || e.parameter.Ativo;

    if (!email) {
      return createResponse({ error: 'Email é obrigatório' }, 400);
    }

    const ss = getSpreadsheet();
    const userSheet = ss.getSheetByName(SHEET_USUARIOS);

    if (!userSheet) {
      return createResponse({ error: 'Planilha de usuários não encontrada' }, 404);
    }

    const data = userSheet.getDataRange().getValues();
    const headers = data[0];
    const emailIndex = headers.indexOf('Email');

    for (let i = 1; i < data.length; i++) {
      if (data[i][emailIndex] && data[i][emailIndex].toLowerCase() === email.toLowerCase()) {
        if (nome) userSheet.getRange(i + 1, headers.indexOf('Nome') + 1).setValue(nome);
        if (role) userSheet.getRange(i + 1, headers.indexOf('Role') + 1).setValue(role);
        if (ativo !== undefined) {
          userSheet.getRange(i + 1, headers.indexOf('Ativo') + 1).setValue(ativo === 'true' || ativo === true ? 'TRUE' : 'FALSE');
        }

        return createResponse({ success: true, message: 'Usuário atualizado' });
      }
    }

    return createResponse({ error: 'Usuário não encontrado' }, 404);
  } catch (error) {
    Logger.log('Erro em updateUser: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

function updateUserRole(e) {
  return updateUser(e);
}

function deleteUser(e) {
  try {
    const params = parsePostData(e);
    const email = params.email || params.Email || e.parameter.email || e.parameter.Email;

    if (!email) {
      return createResponse({ error: 'Email é obrigatório' }, 400);
    }

    const ss = getSpreadsheet();
    const userSheet = ss.getSheetByName(SHEET_USUARIOS);

    if (!userSheet) {
      return createResponse({ error: 'Planilha de usuários não encontrada' }, 404);
    }

    const data = userSheet.getDataRange().getValues();
    const emailIndex = 0;

    for (let i = 1; i < data.length; i++) {
      if (data[i][emailIndex] && data[i][emailIndex].toLowerCase() === email.toLowerCase()) {
        userSheet.deleteRow(i + 1);
        return createResponse({ success: true, message: 'Usuário deletado' });
      }
    }

    return createResponse({ error: 'Usuário não encontrado' }, 404);
  } catch (error) {
    Logger.log('Erro em deleteUser: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

// ============================================
// FUNÇÕES DE CANDIDATOS
// ============================================

function getCandidates(e) {
  try {
    const ss = getSpreadsheet();
    const candidateSheet = ss.getSheetByName(SHEET_CANDIDATOS);

    if (!candidateSheet) {
      return createResponse({ candidates: [], success: true });
    }

    const data = candidateSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return createResponse({ candidates: [], success: true });
    }

    const headers = data[0];
    const candidates = [];

    for (let i = 1; i < data.length; i++) {
      const candidate = {};
      headers.forEach((header, index) => {
        candidate[header] = data[i][index];
      });

      if (candidate.CPF || candidate.NOMECOMPLETO) {
        candidates.push(candidate);
      }
    }

    return createResponse({ candidates: candidates, success: true });
  } catch (error) {
    Logger.log('Erro em getCandidates: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

function getCandidate(e) {
  try {
    const params = parsePostData(e);
    const registrationNumber = params.registration_number || params.id || e.parameter.registration_number || e.parameter.id;

    if (!registrationNumber) {
      return createResponse({ error: 'Número de registro é obrigatório' }, 400);
    }

    const ss = getSpreadsheet();
    const candidateSheet = ss.getSheetByName(SHEET_CANDIDATOS);

    if (!candidateSheet) {
      return createResponse({ error: 'Planilha de candidatos não encontrada' }, 404);
    }

    const data = candidateSheet.getDataRange().getValues();
    const headers = data[0];
    const regNumIndex = headers.indexOf('registration_number') >= 0 ?
                        headers.indexOf('registration_number') :
                        headers.indexOf('id');

    for (let i = 1; i < data.length; i++) {
      if (data[i][regNumIndex] && data[i][regNumIndex].toString() === registrationNumber.toString()) {
        const candidate = {};
        headers.forEach((header, index) => {
          candidate[header] = data[i][index];
        });
        return createResponse({ candidate: candidate, success: true });
      }
    }

    return createResponse({ error: 'Candidato não encontrado' }, 404);
  } catch (error) {
    Logger.log('Erro em getCandidate: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

function addCandidate(e) {
  try {
    const params = parsePostData(e);
    const ss = getSpreadsheet();
    let candidateSheet = ss.getSheetByName(SHEET_CANDIDATOS);

    if (!candidateSheet) {
      candidateSheet = ss.insertSheet(SHEET_CANDIDATOS);
      candidateSheet.appendRow([
        'id', 'registration_number', 'NOMECOMPLETO', 'NOMESOCIAL', 'CPF',
        'VAGAPCD', 'LAUDO MEDICO', 'AREAATUACAO', 'CARGOPRETENDIDO',
        'CURRICULOVITAE', 'DOCUMENTOSPESSOAIS', 'DOCUMENTOSPROFISSIONAIS',
        'DIPLOMACERTIFICADO', 'DOCUMENTOSCONSELHO', 'ESPECIALIZACOESCURSOS',
        'status', 'status_triagem', 'data_hora_triagem', 'analista_triagem',
        'assigned_to', 'assigned_by', 'assigned_at', 'priority', 'notes',
        'created_at', 'updated_at'
      ]);
    }

    const data = candidateSheet.getDataRange().getValues();
    const headers = data[0];

    const newId = 'CAND_' + new Date().getTime();
    const timestamp = getCurrentTimestamp();

    const newRow = [];
    headers.forEach(header => {
      if (header === 'id') {
        newRow.push(params.id || newId);
      } else if (header === 'registration_number') {
        newRow.push(params.registration_number || params[header] || newId);
      } else if (header === 'created_at') {
        newRow.push(timestamp);
      } else if (header === 'updated_at') {
        newRow.push(timestamp);
      } else if (header === 'status' && !params[header]) {
        newRow.push('pendente');
      } else {
        newRow.push(params[header] || e.parameter[header] || '');
      }
    });

    candidateSheet.appendRow(newRow);

    return createResponse({
      success: true,
      message: 'Candidato adicionado com sucesso',
      id: params.id || newId
    });
  } catch (error) {
    Logger.log('Erro em addCandidate: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

function updateCandidate(e) {
  try {
    const params = parsePostData(e);
    const registrationNumber = params.registration_number || params.id || e.parameter.registration_number || e.parameter.id;

    if (!registrationNumber) {
      return createResponse({ error: 'Número de registro é obrigatório' }, 400);
    }

    const ss = getSpreadsheet();
    const candidateSheet = ss.getSheetByName(SHEET_CANDIDATOS);

    if (!candidateSheet) {
      return createResponse({ error: 'Planilha de candidatos não encontrada' }, 404);
    }

    const data = candidateSheet.getDataRange().getValues();
    const headers = data[0];
    const regNumIndex = headers.indexOf('registration_number') >= 0 ?
                        headers.indexOf('registration_number') :
                        headers.indexOf('id');

    for (let i = 1; i < data.length; i++) {
      if (data[i][regNumIndex] && data[i][regNumIndex].toString() === registrationNumber.toString()) {
        headers.forEach((header, colIndex) => {
          const value = params[header] !== undefined ? params[header] : e.parameter[header];
          if (value !== undefined && header !== 'id' && header !== 'registration_number') {
            candidateSheet.getRange(i + 1, colIndex + 1).setValue(value);
          }
        });

        const updatedAtIndex = headers.indexOf('updated_at');
        if (updatedAtIndex >= 0) {
          candidateSheet.getRange(i + 1, updatedAtIndex + 1).setValue(getCurrentTimestamp());
        }

        return createResponse({ success: true, message: 'Candidato atualizado' });
      }
    }

    return createResponse({ error: 'Candidato não encontrado' }, 404);
  } catch (error) {
    Logger.log('Erro em updateCandidate: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

function deleteCandidate(e) {
  try {
    const params = parsePostData(e);
    const registrationNumber = params.registration_number || params.id || e.parameter.registration_number || e.parameter.id;

    if (!registrationNumber) {
      return createResponse({ error: 'Número de registro é obrigatório' }, 400);
    }

    const ss = getSpreadsheet();
    const candidateSheet = ss.getSheetByName(SHEET_CANDIDATOS);

    if (!candidateSheet) {
      return createResponse({ error: 'Planilha de candidatos não encontrada' }, 404);
    }

    const data = candidateSheet.getDataRange().getValues();
    const headers = data[0];
    const regNumIndex = headers.indexOf('registration_number') >= 0 ?
                        headers.indexOf('registration_number') :
                        headers.indexOf('id');

    for (let i = 1; i < data.length; i++) {
      if (data[i][regNumIndex] && data[i][regNumIndex].toString() === registrationNumber.toString()) {
        candidateSheet.deleteRow(i + 1);
        return createResponse({ success: true, message: 'Candidato deletado' });
      }
    }

    return createResponse({ error: 'Candidato não encontrado' }, 404);
  } catch (error) {
    Logger.log('Erro em deleteCandidate: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

function assignCandidates(e) {
  try {
    const params = parsePostData(e);
    const candidateIds = params.candidateIds || e.parameter.candidateIds;
    const analystEmail = params.analystEmail || params.analystId || e.parameter.analystEmail || e.parameter.analystId;
    const adminEmail = params.adminEmail || params.adminId || e.parameter.adminEmail || e.parameter.adminId;

    Logger.log('📥 assignCandidates recebido:');
    Logger.log('  candidateIds: ' + candidateIds);
    Logger.log('  analystEmail: ' + analystEmail);
    Logger.log('  adminEmail: ' + adminEmail);

    if (!candidateIds || !analystEmail) {
      return createResponse({ error: 'IDs dos candidatos e email do analista são obrigatórios' }, 400);
    }

    const ids = typeof candidateIds === 'string' ? candidateIds.split(',').map(id => id.trim()) : candidateIds;
    Logger.log('🔢 IDs processados: ' + ids.join(', '));

    const ss = getSpreadsheet();
    const candidateSheet = ss.getSheetByName(SHEET_CANDIDATOS);

    if (!candidateSheet) {
      return createResponse({ error: 'Planilha de candidatos não encontrada' }, 404);
    }

    const data = candidateSheet.getDataRange().getValues();
    const headers = data[0];

    // Procura por várias colunas possíveis de ID
    const cpfIndex = headers.indexOf('CPF');
    const regNumIndex = headers.indexOf('registration_number');
    const idIndex = headers.indexOf('id');

    const assignedToIndex = headers.indexOf('assigned_to');
    const assignedByIndex = headers.indexOf('assigned_by');
    const assignedAtIndex = headers.indexOf('assigned_at');
    const statusIndex = headers.indexOf('Status');
    const statusLowerIndex = headers.indexOf('status');
    const updatedAtIndex = headers.indexOf('updated_at');

    const timestamp = getCurrentTimestamp();

    Logger.log('📊 Índices das colunas:');
    Logger.log('  CPF: ' + cpfIndex);
    Logger.log('  registration_number: ' + regNumIndex);
    Logger.log('  assigned_to: ' + assignedToIndex);
    Logger.log('  Status: ' + statusIndex);

    let updated = 0;
    const updatedCandidates = [];

    for (let i = 1; i < data.length; i++) {
      // Tenta identificar o candidato por CPF, registration_number ou id
      const cpfValue = cpfIndex >= 0 ? data[i][cpfIndex]?.toString() : '';
      const regNumValue = regNumIndex >= 0 ? data[i][regNumIndex]?.toString() : '';
      const idValue = idIndex >= 0 ? data[i][idIndex]?.toString() : '';

      // Verifica se algum desses valores está na lista de IDs
      const isMatch = ids.some(id => {
        return id === cpfValue || id === regNumValue || id === idValue;
      });

      if (isMatch) {
        Logger.log('✅ Alocando candidato na linha ' + (i + 1));

        // Atualiza assigned_to
        if (assignedToIndex >= 0) {
          candidateSheet.getRange(i + 1, assignedToIndex + 1).setValue(analystEmail);
        }

        // Atualiza assigned_by
        if (assignedByIndex >= 0 && adminEmail) {
          candidateSheet.getRange(i + 1, assignedByIndex + 1).setValue(adminEmail);
        }

        // Atualiza assigned_at
        if (assignedAtIndex >= 0) {
          candidateSheet.getRange(i + 1, assignedAtIndex + 1).setValue(timestamp);
        }

        // Atualiza Status (ou status)
        if (statusIndex >= 0) {
          candidateSheet.getRange(i + 1, statusIndex + 1).setValue('em_analise');
        } else if (statusLowerIndex >= 0) {
          candidateSheet.getRange(i + 1, statusLowerIndex + 1).setValue('em_analise');
        }

        // Atualiza updated_at
        if (updatedAtIndex >= 0) {
          candidateSheet.getRange(i + 1, updatedAtIndex + 1).setValue(timestamp);
        }

        updated++;
        updatedCandidates.push({
          cpf: cpfValue,
          regNum: regNumValue,
          linha: i + 1
        });
      }
    }

    Logger.log('✅ Total de candidatos alocados: ' + updated);
    Logger.log('📋 Candidatos atualizados:', JSON.stringify(updatedCandidates));

    return createResponse({
      success: true,
      message: updated + ' candidato(s) atribuído(s) com sucesso',
      updated: updated,
      details: updatedCandidates
    });
  } catch (error) {
    Logger.log('❌ Erro em assignCandidates: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

function bulkUpdateCandidates(e) {
  try {
    const params = parsePostData(e);
    const updates = params.updates || e.parameter.updates;

    if (!updates) {
      return createResponse({ error: 'Lista de atualizações é obrigatória' }, 400);
    }

    const updateList = typeof updates === 'string' ? JSON.parse(updates) : updates;
    const ss = getSpreadsheet();
    const candidateSheet = ss.getSheetByName(SHEET_CANDIDATOS);

    if (!candidateSheet) {
      return createResponse({ error: 'Planilha de candidatos não encontrada' }, 404);
    }

    const data = candidateSheet.getDataRange().getValues();
    const headers = data[0];
    let updated = 0;

    updateList.forEach(update => {
      const regNumIndex = headers.indexOf('registration_number') >= 0 ?
                          headers.indexOf('registration_number') :
                          headers.indexOf('id');

      for (let i = 1; i < data.length; i++) {
        if (data[i][regNumIndex] && data[i][regNumIndex].toString() === update.id.toString()) {
          Object.keys(update).forEach(key => {
            if (key !== 'id' && key !== 'registration_number') {
              const colIndex = headers.indexOf(key);
              if (colIndex >= 0) {
                candidateSheet.getRange(i + 1, colIndex + 1).setValue(update[key]);
              }
            }
          });
          updated++;
          break;
        }
      }
    });

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

// ============================================
// FUNÇÕES DE ESTATÍSTICAS
// ============================================

function getStatistics(e) {
  try {
    const ss = getSpreadsheet();
    const candidateSheet = ss.getSheetByName(SHEET_CANDIDATOS);

    if (!candidateSheet) {
      return createResponse({
        total: 0,
        pendente: 0,
        em_analise: 0,
        concluido: 0,
        administrativa: 0,
        assistencial: 0,
        pcd: 0,
        nao_pcd: 0,
        classificados: 0,
        desclassificados: 0,
        revisar: 0
      });
    }

    const data = candidateSheet.getDataRange().getValues();
    const headers = data[0];
    const statusIndex = headers.indexOf('status');
    const areaIndex = headers.indexOf('AREAATUACAO');
    const pcdIndex = headers.indexOf('VAGAPCD');
    const statusTriagemIndex = headers.indexOf('status_triagem');

    const stats = {
      total: data.length - 1,
      pendente: 0,
      em_analise: 0,
      concluido: 0,
      administrativa: 0,
      assistencial: 0,
      pcd: 0,
      nao_pcd: 0,
      classificados: 0,
      desclassificados: 0,
      revisar: 0
    };

    for (let i = 1; i < data.length; i++) {
      const status = data[i][statusIndex];
      if (status === 'pendente') stats.pendente++;
      if (status === 'em_analise') stats.em_analise++;
      if (status === 'concluido') stats.concluido++;

      const area = data[i][areaIndex];
      if (area && area.toLowerCase().includes('administrativa')) stats.administrativa++;
      if (area && area.toLowerCase().includes('assistencial')) stats.assistencial++;

      const pcd = data[i][pcdIndex];
      if (pcd && (pcd.toLowerCase() === 'sim' || pcd.toLowerCase() === 's')) {
        stats.pcd++;
      } else if (pcd) {
        stats.nao_pcd++;
      }

      const statusTriagem = data[i][statusTriagemIndex];
      if (statusTriagem === 'Classificado') stats.classificados++;
      if (statusTriagem === 'Desclassificado') stats.desclassificados++;
      if (statusTriagem === 'Revisar') stats.revisar++;
    }

    return createResponse(stats);
  } catch (error) {
    Logger.log('Erro em getStatistics: ' + error.toString());
    return createResponse({ error: error.toString() }, 500);
  }
}

// ============================================
// FUNÇÃO DE TESTE
// ============================================

function testConnection(e) {
  try {
    const ss = getSpreadsheet();
    const sheets = ss.getSheets();
    const sheetNames = sheets.map(sheet => sheet.getName());

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
