// ============================================
// TESTE: getUserRole
// Execute esta função no Google Apps Script
// ============================================

function testeGetUserRole() {
  Logger.log('═'.repeat(60));
  Logger.log('🧪 TESTE getUserRole');
  Logger.log('═'.repeat(60));

  // Teste 1: Verificar planilha USUARIOS
  Logger.log('\n📋 TESTE 1: Verificar planilha USUARIOS');
  const ss = SpreadsheetApp.openById('1iQSQ06P_OXkqxaGWN3uG5jRYFBKyjWqQyvzuGk2EplY');
  const sheetUsuarios = ss.getSheetByName('USUARIOS');

  if (!sheetUsuarios) {
    Logger.log('❌ Planilha USUARIOS não encontrada!');
    return;
  }

  Logger.log('✅ Planilha USUARIOS encontrada');

  // Verificar headers
  const lastCol = sheetUsuarios.getLastColumn();
  const headers = sheetUsuarios.getRange(1, 1, 1, lastCol).getValues()[0];
  Logger.log('📋 Headers:', headers.join(', '));

  // Verificar quantas linhas tem
  const lastRow = sheetUsuarios.getLastRow();
  Logger.log('📊 Total de linhas (incluindo header):', lastRow);

  if (lastRow <= 1) {
    Logger.log('❌ Planilha vazia! Adicione usuários primeiro.');
    return;
  }

  // Listar todos os usuários
  Logger.log('\n👥 TESTE 2: Listar todos os usuários');
  const data = sheetUsuarios.getRange(2, 1, lastRow - 1, lastCol).getValues();

  const emailCol = headers.indexOf('email');
  const nameCol = headers.indexOf('name');
  const roleCol = headers.indexOf('role');
  const activeCol = headers.indexOf('active');

  Logger.log('📍 Índices das colunas:');
  Logger.log('   email:', emailCol);
  Logger.log('   name:', nameCol);
  Logger.log('   role:', roleCol);
  Logger.log('   active:', activeCol);
  Logger.log('');

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    Logger.log('👤 Usuário ' + (i + 1) + ':');
    Logger.log('   email: "' + row[emailCol] + '"');
    Logger.log('   name: "' + row[nameCol] + '"');
    Logger.log('   role: "' + row[roleCol] + '" (tipo: ' + typeof row[roleCol] + ')');
    Logger.log('   active: "' + row[activeCol] + '" (tipo: ' + typeof row[activeCol] + ')');
    Logger.log('');
  }

  // Teste 3: Testar getUserRole com primeiro email
  if (data.length > 0) {
    const testeEmail = String(data[0][emailCol]).trim().toLowerCase();
    Logger.log('\n🧪 TESTE 3: getUserRole com email: ' + testeEmail);

    const params = { email: testeEmail };
    const result = getUserRole(params);

    Logger.log('📤 Resultado getUserRole:');
    Logger.log(JSON.stringify(result, null, 2));

    if (result.user) {
      Logger.log('\n✅ SUCESSO! Usuário encontrado:');
      Logger.log('   Email: ' + result.user.email);
      Logger.log('   Nome: ' + result.user.name);
      Logger.log('   Role: "' + result.user.role + '"');
      Logger.log('   Active: ' + result.user.active);
    } else {
      Logger.log('\n❌ ERRO! Usuário não encontrado ou inativo');
      Logger.log('   role: ' + result.role);
      Logger.log('   user: ' + result.user);
    }
  }

  // Teste 4: Testar com email que não existe
  Logger.log('\n🧪 TESTE 4: getUserRole com email inexistente');
  const resultInexistente = getUserRole({ email: 'naoexiste@teste.com' });
  Logger.log('📤 Resultado:');
  Logger.log(JSON.stringify(resultInexistente, null, 2));

  Logger.log('\n' + '═'.repeat(60));
  Logger.log('🎉 TESTES CONCLUÍDOS');
  Logger.log('═'.repeat(60));
}

// ============================================
// COLE AQUI A FUNÇÃO getUserRole DO SEU SCRIPT
// ============================================

const SPREADSHEET_ID = '1iQSQ06P_OXkqxaGWN3uG5jRYFBKyjWqQyvzuGk2EplY';
const SHEET_USUARIOS = 'USUARIOS';

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

function getUserRole(params) {
  if (!params.email) {
    return { role: null, user: null };
  }

  const { sheet, headers, values } = _readSheetBlock_(SHEET_USUARIOS);

  if (!sheet || !values.length) {
    Logger.log('❌ Planilha vazia ou não encontrada');
    return { role: null, user: null };
  }

  const col = _colMap_(headers);
  const emailCol = col['email'];
  const roleCol = col['role'];
  const nameCol = col['name'];
  const activeCol = col['active'];

  Logger.log('🔍 Procurando email: ' + params.email.toLowerCase());

  for (let i = 0; i < values.length; i++) {
    const userEmail = String(values[i][emailCol] || '').trim().toLowerCase();

    Logger.log('   Comparando com: "' + userEmail + '"');

    if (userEmail === params.email.toLowerCase()) {
      Logger.log('✅ Email encontrado na linha ' + (i + 2));

      const isActive = activeCol >= 0 ? (values[i][activeCol] === true || values[i][activeCol] === 'TRUE' || values[i][activeCol] === 'Sim') : true;

      Logger.log('   Active: ' + isActive);

      if (!isActive) {
        Logger.log('❌ Usuário inativo');
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

  Logger.log('❌ Email não encontrado');
  return { role: null, user: null };
}
