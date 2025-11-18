// Adicione esta função ao seu Google Apps Script

function createUser(e) {
  try {
    const { Email, Nome, Role, Ativo, Password } = e.parameter;

    if (!Email || !Nome || !Role || !Password) {
      return createResponse({error: 'Dados incompletos. Email, Nome, Role e Password são obrigatórios.'}, 400);
    }

    const ss = getSpreadsheet();
    const userSheet = ss.getSheetByName(SHEET_USUARIOS);

    if (!userSheet) {
      return createResponse({error: 'Planilha de usuários não encontrada'}, 404);
    }

    // Verificar se a planilha tem headers, se não, criar
    const lastRow = userSheet.getLastRow();
    if (lastRow === 0) {
      // Criar headers
      userSheet.appendRow(['Email', 'Nome', 'Role', 'Ativo', 'Password']);
    }

    // Verificar se o usuário já existe
    const data = userSheet.getDataRange().getValues();
    const headers = data[0];
    const emailIndex = headers.indexOf('Email');

    for (let i = 1; i < data.length; i++) {
      if (data[i][emailIndex] === Email) {
        return createResponse({error: 'Usuário já existe com este email'}, 400);
      }
    }

    // Adicionar novo usuário
    const newRow = [];
    headers.forEach(header => {
      switch(header) {
        case 'Email':
          newRow.push(Email);
          break;
        case 'Nome':
          newRow.push(Nome);
          break;
        case 'Role':
          newRow.push(Role);
          break;
        case 'Ativo':
          newRow.push(Ativo === 'true' || Ativo === true);
          break;
        case 'Password':
          newRow.push(Password);
          break;
        default:
          newRow.push('');
      }
    });

    userSheet.appendRow(newRow);

    return createResponse({
      success: true,
      message: 'Usuário criado com sucesso',
      user: {
        Email: Email,
        Nome: Nome,
        Role: Role,
        Ativo: Ativo === 'true' || Ativo === true
      }
    });
  } catch (error) {
    return createResponse({error: error.message}, 500);
  }
}

// Atualize a função handleRequest para incluir a nova ação
function handleRequest(e) {
  try {
    const action = e.parameter.action;

    const actions = {
      // Usuários
      'getUserRole': getUserRole,
      'getAllUsers': getAllUsers,
      'updateUserRole': updateUserRole,
      'createUser': createUser, // NOVA FUNÇÃO

      // Candidatos
      'getCandidates': getCandidates,
      'addCandidate': addCandidate,
      'updateCandidate': updateCandidate,
      'deleteCandidate': deleteCandidate
    };

    if (actions[action]) {
      return actions[action](e);
    } else {
      return createResponse({error: 'Ação não encontrada'}, 404);
    }
  } catch (error) {
    return createResponse({error: error.message}, 500);
  }
}
