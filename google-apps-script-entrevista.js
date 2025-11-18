// ============================================
// GOOGLE APPS SCRIPT - ATUALIZAÇÃO PARA ENTREVISTAS
// ============================================
//
// INSTRUÇÕES:
// 1. Abra seu Google Apps Script no projeto existente
// 2. Adicione as funções abaixo ao código existente
// 3. Adicione as novas colunas na aba CANDIDATOS conforme especificado
//
// NOVAS COLUNAS NA ABA CANDIDATOS:
// - email_sent (Data/Hora de envio do email)
// - sms_sent (Data/Hora de envio do SMS)
// - status_entrevista (valores: "Aguardando", "Alocado", "Realizada")
// - entrevistador (Email do entrevistador)
// - entrevistador_at (Data/hora da alocação)
// - entrevistador_by (Email do admin que alocou)
// - interview_score (Pontuação da entrevista)
// - interview_result (Classificado/Desclassificado)
// - interview_notes (Impressões do entrevistador)
// - interview_completed_at (Data/hora da conclusão)
// - formacao_adequada (1-5)
// - graduacoes_competencias (1-5)
// - descricao_processos (1-5)
// - terminologia_tecnica (1-5)
// - calma_clareza (1-5)
// - escalas_flexiveis (0, 5, 10)
// - adaptabilidade_mudancas (0, 5, 10)
// - ajustes_emergencia (0, 5, 10)
// - residencia (2, 4, 6, 8, 10)
// - resolucao_conflitos (1-5)
// - colaboracao_equipe (1-5)
// - adaptacao_perfis (1-5)
//
// ============================================

// Adicione esta ação ao handleRequest existente
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

      // NOVAS AÇÕES PARA ENTREVISTA
      'moveToInterview': () => moveToInterview(params),
      'getInterviewCandidates': () => getInterviewCandidates(),
      'getInterviewers': () => getInterviewers(),
      'allocateToInterviewer': () => allocateToInterviewer(params),
      'getInterviewerCandidates': () => getInterviewerCandidates(params),
      'saveInterviewEvaluation': () => saveInterviewEvaluation(params),

      'test': () => testConnection()
    };

    if (actions[action]) {
      const result = actions[action]();
      Logger.log('✅ Resultado: ' + JSON.stringify(result).substring(0, 200));
      return createCorsResponse({ success: true, data: result });
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

// ============================================
// NOVA FUNÇÃO: Atualizar sendMessages para registrar envio
// ============================================
function sendMessages(params) {
  try {
    const messageType = params.messageType;
    const candidateIds = params.candidateIds.split(',');
    const subject = params.subject || '';
    const content = params.content;
    const sentBy = params.sentBy;

    const sheet = _sheet(SHEET_CANDIDATOS);
    const headers = _getHeaders_(sheet);
    const colMap = _colMap_(headers);
    const idx = _getIndex_(sheet, headers);

    const emailSentCol = colMap['email_sent'];
    const smsSentCol = colMap['sms_sent'];
    const timestamp = new Date().toISOString();

    let successCount = 0;
    let failCount = 0;
    const results = [];

    for (const candidateId of candidateIds) {
      try {
        const row = idx[candidateId.trim()];
        if (!row) {
          results.push({
            success: false,
            candidateId: candidateId,
            error: 'Candidato não encontrado'
          });
          failCount++;
          continue;
        }

        const values = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
        const candidateName = values[colMap['NOMECOMPLETO']] || 'Desconhecido';

        // Marcar data de envio
        if (messageType === 'email' && emailSentCol !== undefined) {
          sheet.getRange(row, emailSentCol + 1).setValue(timestamp);
        } else if (messageType === 'sms' && smsSentCol !== undefined) {
          sheet.getRange(row, smsSentCol + 1).setValue(timestamp);
        }

        // Registrar no log de mensagens
        logMessage({
          registrationNumber: candidateId,
          messageType: messageType,
          recipient: messageType === 'email' ? values[colMap['EMAIL']] : values[colMap['TELEFONE']],
          subject: subject,
          content: content,
          sentBy: sentBy
        });

        results.push({
          success: true,
          candidateId: candidateId,
          candidateName: candidateName
        });
        successCount++;
      } catch (error) {
        results.push({
          success: false,
          candidateId: candidateId,
          error: error.toString()
        });
        failCount++;
      }
    }

    _bumpRev_();

    return {
      successCount: successCount,
      failCount: failCount,
      results: results
    };
  } catch (error) {
    Logger.log('Erro em sendMessages: ' + error);
    throw error;
  }
}

// ============================================
// NOVAS FUNÇÕES PARA ENTREVISTA
// ============================================

function moveToInterview(params) {
  try {
    const candidateIds = params.candidateIds.split(',');
    const sheet = _sheet(SHEET_CANDIDATOS);
    const headers = _getHeaders_(sheet);
    const colMap = _colMap_(headers);
    const idx = _getIndex_(sheet, headers);

    const statusEntrevistaCol = colMap['status_entrevista'];

    let successCount = 0;

    for (const candidateId of candidateIds) {
      const row = idx[candidateId.trim()];
      if (row && statusEntrevistaCol !== undefined) {
        sheet.getRange(row, statusEntrevistaCol + 1).setValue('Aguardando');
        successCount++;
      }
    }

    _bumpRev_();

    return {
      message: `${successCount} candidatos movidos para entrevista`,
      successCount: successCount
    };
  } catch (error) {
    Logger.log('Erro em moveToInterview: ' + error);
    throw error;
  }
}

function getInterviewCandidates() {
  try {
    const sheet = _sheet(SHEET_CANDIDATOS);
    const headers = _getHeaders_(sheet);
    const colMap = _colMap_(headers);
    const lastRow = sheet.getLastRow();

    if (lastRow <= HEADER_ROWS) {
      return [];
    }

    const values = sheet.getRange(HEADER_ROWS + 1, 1, lastRow - HEADER_ROWS, sheet.getLastColumn()).getValues();
    const candidates = [];

    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      const statusEntrevista = row[colMap['status_entrevista']] || '';

      if (statusEntrevista === 'Aguardando') {
        const candidate = {};
        headers.forEach((header, index) => {
          candidate[header] = row[index];
        });
        candidate.id = row[colMap[COL_ID_PRIMARY]] || row[colMap[COL_ID_ALT]];
        candidate.registration_number = row[colMap[COL_ID_ALT]] || row[colMap[COL_ID_PRIMARY]];
        candidates.push(candidate);
      }
    }

    return candidates;
  } catch (error) {
    Logger.log('Erro em getInterviewCandidates: ' + error);
    throw error;
  }
}

function getInterviewers() {
  try {
    const sheet = _sheet(SHEET_USUARIOS);
    if (!sheet) {
      return [];
    }

    const headers = _getHeaders_(sheet);
    const colMap = _colMap_(headers);
    const lastRow = sheet.getLastRow();

    if (lastRow <= HEADER_ROWS) {
      return [];
    }

    const values = sheet.getRange(HEADER_ROWS + 1, 1, lastRow - HEADER_ROWS, sheet.getLastColumn()).getValues();
    const interviewers = [];

    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      const role = (row[colMap['role']] || '').toString().toLowerCase();
      const active = row[colMap['active']] !== false && row[colMap['active']] !== 'false';

      if (role === 'entrevistador' && active) {
        interviewers.push({
          email: row[colMap['email']],
          name: row[colMap['name']] || row[colMap['nome']],
          role: 'entrevistador'
        });
      }
    }

    return interviewers;
  } catch (error) {
    Logger.log('Erro em getInterviewers: ' + error);
    throw error;
  }
}

function allocateToInterviewer(params) {
  try {
    const candidateIds = params.candidateIds.split(',');
    const interviewerEmail = params.interviewerEmail;
    const adminEmail = params.adminEmail;
    const timestamp = new Date().toISOString();

    const sheet = _sheet(SHEET_CANDIDATOS);
    const headers = _getHeaders_(sheet);
    const colMap = _colMap_(headers);
    const idx = _getIndex_(sheet, headers);

    const entrevistadorCol = colMap['entrevistador'];
    const entrevistadorAtCol = colMap['entrevistador_at'];
    const entrevistadorByCol = colMap['entrevistador_by'];
    const statusEntrevistaCol = colMap['status_entrevista'];

    let successCount = 0;

    for (const candidateId of candidateIds) {
      const row = idx[candidateId.trim()];
      if (row) {
        if (entrevistadorCol !== undefined) {
          sheet.getRange(row, entrevistadorCol + 1).setValue(interviewerEmail);
        }
        if (entrevistadorAtCol !== undefined) {
          sheet.getRange(row, entrevistadorAtCol + 1).setValue(timestamp);
        }
        if (entrevistadorByCol !== undefined) {
          sheet.getRange(row, entrevistadorByCol + 1).setValue(adminEmail);
        }
        if (statusEntrevistaCol !== undefined) {
          sheet.getRange(row, statusEntrevistaCol + 1).setValue('Alocado');
        }
        successCount++;
      }
    }

    _bumpRev_();

    return {
      message: `${successCount} candidatos alocados para ${interviewerEmail}`,
      successCount: successCount
    };
  } catch (error) {
    Logger.log('Erro em allocateToInterviewer: ' + error);
    throw error;
  }
}

function getInterviewerCandidates(params) {
  try {
    const interviewerEmail = params.interviewerEmail;
    const sheet = _sheet(SHEET_CANDIDATOS);
    const headers = _getHeaders_(sheet);
    const colMap = _colMap_(headers);
    const lastRow = sheet.getLastRow();

    if (lastRow <= HEADER_ROWS) {
      return [];
    }

    const values = sheet.getRange(HEADER_ROWS + 1, 1, lastRow - HEADER_ROWS, sheet.getLastColumn()).getValues();
    const candidates = [];

    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      const entrevistador = row[colMap['entrevistador']] || '';

      if (entrevistador.toLowerCase() === interviewerEmail.toLowerCase()) {
        const candidate = {};
        headers.forEach((header, index) => {
          candidate[header] = row[index];
        });
        candidate.id = row[colMap[COL_ID_PRIMARY]] || row[colMap[COL_ID_ALT]];
        candidate.registration_number = row[colMap[COL_ID_ALT]] || row[colMap[COL_ID_PRIMARY]];
        candidates.push(candidate);
      }
    }

    return candidates;
  } catch (error) {
    Logger.log('Erro em getInterviewerCandidates: ' + error);
    throw error;
  }
}

function saveInterviewEvaluation(params) {
  try {
    const candidateId = params.candidateId;
    const sheet = _sheet(SHEET_CANDIDATOS);
    const headers = _getHeaders_(sheet);
    const colMap = _colMap_(headers);
    const idx = _getIndex_(sheet, headers);

    const row = idx[candidateId];
    if (!row) {
      throw new Error('Candidato não encontrado');
    }

    // Calcular pontuações
    const secao1 = (parseInt(params.formacao_adequada) + parseInt(params.graduacoes_competencias)) * 2;
    const secao2 = (parseInt(params.descricao_processos) + parseInt(params.terminologia_tecnica) + parseInt(params.calma_clareza)) * 2;
    const secao3 = parseInt(params.escalas_flexiveis) + parseInt(params.adaptabilidade_mudancas) + parseInt(params.ajustes_emergencia);
    const secao4 = parseInt(params.residencia);
    const secao5 = (parseInt(params.resolucao_conflitos) + parseInt(params.colaboracao_equipe) + parseInt(params.adaptacao_perfis)) * 2;
    const totalScore = secao1 + secao2 + secao3 + secao4 + secao5;

    // Salvar campos da avaliação
    const fieldsToUpdate = [
      { col: 'formacao_adequada', value: params.formacao_adequada },
      { col: 'graduacoes_competencias', value: params.graduacoes_competencias },
      { col: 'descricao_processos', value: params.descricao_processos },
      { col: 'terminologia_tecnica', value: params.terminologia_tecnica },
      { col: 'calma_clareza', value: params.calma_clareza },
      { col: 'escalas_flexiveis', value: params.escalas_flexiveis },
      { col: 'adaptabilidade_mudancas', value: params.adaptabilidade_mudancas },
      { col: 'ajustes_emergencia', value: params.ajustes_emergencia },
      { col: 'residencia', value: params.residencia },
      { col: 'resolucao_conflitos', value: params.resolucao_conflitos },
      { col: 'colaboracao_equipe', value: params.colaboracao_equipe },
      { col: 'adaptacao_perfis', value: params.adaptacao_perfis },
      { col: 'interview_score', value: totalScore },
      { col: 'interview_result', value: params.resultado },
      { col: 'interview_notes', value: params.impressao_perfil },
      { col: 'interview_completed_at', value: params.completed_at },
      { col: 'status_entrevista', value: 'Realizada' }
    ];

    for (const field of fieldsToUpdate) {
      const colIndex = colMap[field.col];
      if (colIndex !== undefined) {
        sheet.getRange(row, colIndex + 1).setValue(field.value);
      }
    }

    _bumpRev_();

    return {
      message: 'Avaliação salva com sucesso',
      totalScore: totalScore
    };
  } catch (error) {
    Logger.log('Erro em saveInterviewEvaluation: ' + error);
    throw error;
  }
}
