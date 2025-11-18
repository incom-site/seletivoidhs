// ==================================================
// SCRIPT DE TESTE PARA VERIFICAR ANALISTAS
// ==================================================
//
// Este script deve ser executado no Google Apps Script
// para verificar se os analistas estão sendo retornados
// corretamente.
//
// INSTRUÇÕES:
// 1. Copie este código
// 2. Cole no Editor do Apps Script
// 3. Execute a função testGetAnalysts()
// 4. Verifique os logs em "Execuções"

// Constantes (mesmas do script principal)
const SPREADSHEET_ID = '1iQSQ06P_OXkqxaGWN3uG5jRYFBKyjWqQyvzuGk2EplY';
const SHEET_USUARIOS = 'USUARIOS';

function testGetAnalysts() {
  Logger.log('========================================');
  Logger.log('TESTE: Verificando Analistas');
  Logger.log('========================================');

  try {
    // 1. Verificar se a planilha existe
    Logger.log('\n1. Verificando planilha...');
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    Logger.log('✅ Planilha encontrada: ' + ss.getName());

    // 2. Verificar se a aba USUARIOS existe
    Logger.log('\n2. Verificando aba USUARIOS...');
    let sheet = ss.getSheetByName(SHEET_USUARIOS);

    if (!sheet) {
      Logger.log('⚠️ Aba USUARIOS não encontrada. Criando...');
      sheet = ss.insertSheet(SHEET_USUARIOS);
      sheet.getRange('A1:D1').setValues([['Email', 'Nome', 'Role', 'ID']]);

      // Adicionar usuários padrão
      const defaultUsers = [
        ['admin@email.com', 'Administrador', 'admin', 'admin@email.com'],
        ['analista@email.com', 'Analista Teste', 'analista', 'analista@email.com']
      ];
      sheet.getRange(2, 1, defaultUsers.length, 4).setValues(defaultUsers);
      Logger.log('✅ Aba USUARIOS criada com usuários padrão');
    } else {
      Logger.log('✅ Aba USUARIOS encontrada');
    }

    // 3. Ler todos os dados
    Logger.log('\n3. Lendo dados da aba USUARIOS...');
    const data = sheet.getDataRange().getValues();
    Logger.log('📊 Total de linhas: ' + data.length);

    // 4. Exibir cabeçalho
    Logger.log('\n4. Cabeçalho da planilha:');
    Logger.log('   Coluna A: ' + data[0][0]);
    Logger.log('   Coluna B: ' + data[0][1]);
    Logger.log('   Coluna C: ' + data[0][2]);
    Logger.log('   Coluna D: ' + data[0][3]);

    // 5. Processar cada linha
    Logger.log('\n5. Processando usuários...');
    const analysts = [];

    for (let i = 1; i < data.length; i++) {
      const email = data[i][0];
      const name = data[i][1];
      const rawRole = data[i][2];
      const id = data[i][3];

      Logger.log('\n👤 Usuário ' + i + ':');
      Logger.log('   Email: "' + email + '"');
      Logger.log('   Nome: "' + name + '"');
      Logger.log('   Role (original): "' + rawRole + '"');
      Logger.log('   ID: "' + id + '"');

      // Normalizar role
      const normalizedRole = rawRole ? String(rawRole).toLowerCase().trim() : '';
      Logger.log('   Role (normalizada): "' + normalizedRole + '"');

      // Verificar se é analista
      if (normalizedRole === 'analista') {
        Logger.log('   ✅ É ANALISTA!');
        const analyst = {
          id: id || email,
          email: email,
          name: name || email,
          role: normalizedRole,
          active: true
        };
        analysts.push(analyst);
      } else {
        Logger.log('   ❌ Não é analista (role: "' + normalizedRole + '")');
      }
    }

    // 6. Resultado final
    Logger.log('\n========================================');
    Logger.log('RESULTADO FINAL');
    Logger.log('========================================');
    Logger.log('📋 Total de analistas encontrados: ' + analysts.length);

    if (analysts.length > 0) {
      Logger.log('\n✅ Analistas:');
      analysts.forEach((analyst, index) => {
        Logger.log('\n' + (index + 1) + '. ' + analyst.name);
        Logger.log('   Email: ' + analyst.email);
        Logger.log('   ID: ' + analyst.id);
        Logger.log('   Role: ' + analyst.role);
      });

      Logger.log('\n📦 JSON de retorno:');
      Logger.log(JSON.stringify({ analysts: analysts }, null, 2));
    } else {
      Logger.log('\n⚠️ NENHUM ANALISTA ENCONTRADO!');
      Logger.log('\nVerifique:');
      Logger.log('1. Se há usuários na planilha além do cabeçalho');
      Logger.log('2. Se a coluna "Role" está preenchida corretamente');
      Logger.log('3. Se o texto é exatamente "analista" (minúscula, sem acentos)');
    }

    Logger.log('\n========================================');
    Logger.log('TESTE CONCLUÍDO');
    Logger.log('========================================');

    return { analysts: analysts };

  } catch (error) {
    Logger.log('\n========================================');
    Logger.log('❌ ERRO NO TESTE');
    Logger.log('========================================');
    Logger.log('Erro: ' + error.toString());
    Logger.log('Stack: ' + error.stack);
    throw error;
  }
}

// Função auxiliar para adicionar um analista manualmente
function addAnalyst(email, name) {
  Logger.log('Adicionando analista: ' + name);

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_USUARIOS);

    if (!sheet) {
      Logger.log('Aba USUARIOS não existe. Execute testGetAnalysts() primeiro.');
      return;
    }

    // Adicionar nova linha
    const newRow = [email, name, 'analista', email];
    sheet.appendRow(newRow);

    Logger.log('✅ Analista adicionado com sucesso!');
    Logger.log('Email: ' + email);
    Logger.log('Nome: ' + name);

  } catch (error) {
    Logger.log('❌ Erro ao adicionar analista: ' + error.toString());
    throw error;
  }
}

// Função para limpar e recriar a aba USUARIOS
function resetUsuariosSheet() {
  Logger.log('Recriando aba USUARIOS...');

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_USUARIOS);

    // Deletar aba existente se houver
    if (sheet) {
      ss.deleteSheet(sheet);
      Logger.log('Aba antiga deletada');
    }

    // Criar nova aba
    sheet = ss.insertSheet(SHEET_USUARIOS);
    sheet.getRange('A1:D1').setValues([['Email', 'Nome', 'Role', 'ID']]);

    // Adicionar usuários padrão
    const defaultUsers = [
      ['admin@email.com', 'Administrador', 'admin', 'admin@email.com'],
      ['analista1@email.com', 'Analista Um', 'analista', 'analista1@email.com'],
      ['analista2@email.com', 'Analista Dois', 'analista', 'analista2@email.com']
    ];
    sheet.getRange(2, 1, defaultUsers.length, 4).setValues(defaultUsers);

    // Formatar cabeçalho
    sheet.getRange('A1:D1').setFontWeight('bold').setBackground('#4285f4').setFontColor('#ffffff');

    Logger.log('✅ Aba USUARIOS recriada com sucesso!');
    Logger.log('Usuários adicionados:');
    Logger.log('- 1 Admin');
    Logger.log('- 2 Analistas');

  } catch (error) {
    Logger.log('❌ Erro ao recriar aba: ' + error.toString());
    throw error;
  }
}
