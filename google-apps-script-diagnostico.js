// ============================================
// FUNÇÃO DE DIAGNÓSTICO COMPLETO
// ============================================
// Cole esta função no seu Google Apps Script e execute

function diagnosticoCompleto() {
  Logger.log('═'.repeat(70));
  Logger.log('🔍 DIAGNÓSTICO COMPLETO DO SISTEMA');
  Logger.log('═'.repeat(70));
  Logger.log('');

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    Logger.log(`📊 Planilha: ${ss.getName()}`);
    Logger.log(`🔗 ID: ${ss.getId()}`);
    Logger.log('');

    // ============================================
    // 1. VERIFICAR PLANILHA USUARIOS
    // ============================================
    Logger.log('─'.repeat(70));
    Logger.log('1️⃣ PLANILHA USUARIOS');
    Logger.log('─'.repeat(70));

    const usuariosSheet = ss.getSheetByName('USUARIOS');
    if (!usuariosSheet) {
      Logger.log('❌ Planilha USUARIOS não existe!');
      Logger.log('   Execute setupAllSheets() para criar');
    } else {
      Logger.log('✅ Planilha USUARIOS existe');

      const usuariosData = usuariosSheet.getDataRange().getValues();
      const usuariosHeaders = usuariosData[0];

      Logger.log(`📋 Colunas (${usuariosHeaders.length}): ${usuariosHeaders.join(', ')}`);
      Logger.log(`📊 Total de usuários: ${usuariosData.length - 1}`);

      // Verificar estrutura esperada
      const esperado = ['Email', 'Nome', 'Role', 'ID', 'DataCriacao', 'Ativo', 'Password'];
      Logger.log('\n🔍 Verificando estrutura:');
      esperado.forEach((col, index) => {
        const existe = usuariosHeaders[index] === col;
        Logger.log(`  ${existe ? '✅' : '❌'} [${String.fromCharCode(65 + index)}] ${col} ${existe ? '' : '← FALTANDO!'}`);
      });

      // Listar usuários por role
      Logger.log('\n👥 Usuários cadastrados:');
      const usuarios = {
        admin: [],
        analista: [],
        entrevistador: [],
        outros: []
      };

      for (let i = 1; i < usuariosData.length; i++) {
        const email = usuariosData[i][0];
        const nome = usuariosData[i][1];
        const role = String(usuariosData[i][2]).toLowerCase().trim();

        if (!email) continue;

        const user = `${nome} (${email})`;

        if (role === 'admin') usuarios.admin.push(user);
        else if (role === 'analista') usuarios.analista.push(user);
        else if (role === 'entrevistador') usuarios.entrevistador.push(user);
        else usuarios.outros.push(`${user} - Role: "${role}"`);
      }

      Logger.log(`  👑 Admins (${usuarios.admin.length}): ${usuarios.admin.join(', ') || 'Nenhum'}`);
      Logger.log(`  📊 Analistas (${usuarios.analista.length}): ${usuarios.analista.join(', ') || 'Nenhum'}`);
      Logger.log(`  🎤 Entrevistadores (${usuarios.entrevistador.length}): ${usuarios.entrevistador.join(', ') || 'Nenhum'}`);
      if (usuarios.outros.length > 0) {
        Logger.log(`  ⚠️ Outros (${usuarios.outros.length}): ${usuarios.outros.join(', ')}`);
      }
    }

    Logger.log('');

    // ============================================
    // 2. VERIFICAR PLANILHA CANDIDATOS
    // ============================================
    Logger.log('─'.repeat(70));
    Logger.log('2️⃣ PLANILHA CANDIDATOS');
    Logger.log('─'.repeat(70));

    const candidatosSheet = ss.getSheetByName('CANDIDATOS');
    if (!candidatosSheet) {
      Logger.log('❌ Planilha CANDIDATOS não existe!');
      Logger.log('   Execute setupAllSheets() para criar');
    } else {
      Logger.log('✅ Planilha CANDIDATOS existe');

      const candidatosData = candidatosSheet.getDataRange().getValues();
      const candidatosHeaders = candidatosData[0];

      Logger.log(`📋 Total de colunas: ${candidatosHeaders.length}`);
      Logger.log(`📊 Total de candidatos: ${candidatosData.length - 1}`);

      Logger.log('\n📋 Colunas encontradas:');
      candidatosHeaders.forEach((col, index) => {
        Logger.log(`  [${String.fromCharCode(65 + index)}${index + 1}] ${col}`);
      });

      // Verificar colunas críticas
      Logger.log('\n🔍 Verificando colunas críticas:');
      const criticas = [
        'CPF',
        'NOMECOMPLETO',
        'AREAATUACAO',
        'CARGOPRETENDIDO',
        'Status',
        'Analista',
        'assigned_to',
        'Entrevistador'
      ];

      criticas.forEach(col => {
        const existe = candidatosHeaders.some(h =>
          String(h).toLowerCase().trim().replace(/\s+/g, '') ===
          col.toLowerCase().trim().replace(/\s+/g, '')
        );
        const index = candidatosHeaders.findIndex(h =>
          String(h).toLowerCase().trim().replace(/\s+/g, '') ===
          col.toLowerCase().trim().replace(/\s+/g, '')
        );
        Logger.log(`  ${existe ? '✅' : '❌'} ${col} ${existe ? `(coluna ${String.fromCharCode(65 + index)})` : '← FALTANDO!'}`);
      });

      // Estatísticas de candidatos
      if (candidatosData.length > 1) {
        Logger.log('\n📊 Estatísticas:');

        // Procurar coluna Status
        const statusIndex = candidatosHeaders.findIndex(h =>
          String(h).toLowerCase().trim().replace(/\s+/g, '') === 'status'
        );

        if (statusIndex >= 0) {
          const statusCounts = {};
          for (let i = 1; i < candidatosData.length; i++) {
            const status = String(candidatosData[i][statusIndex]).trim() || '(vazio)';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
          }
          Logger.log('  Por Status:');
          Object.entries(statusCounts).forEach(([status, count]) => {
            Logger.log(`    - ${status}: ${count}`);
          });
        }

        // Procurar coluna Analista
        const analistaIndex = candidatosHeaders.findIndex(h =>
          String(h).toLowerCase().trim().replace(/\s+/g, '') === 'analista'
        );

        if (analistaIndex >= 0) {
          let comAnalista = 0;
          let semAnalista = 0;
          for (let i = 1; i < candidatosData.length; i++) {
            const analista = String(candidatosData[i][analistaIndex]).trim();
            if (analista) comAnalista++;
            else semAnalista++;
          }
          Logger.log('  Alocação:');
          Logger.log(`    - Com analista: ${comAnalista}`);
          Logger.log(`    - Sem analista: ${semAnalista}`);
        }

        // Procurar coluna Entrevistador
        const entrevistadorIndex = candidatosHeaders.findIndex(h =>
          String(h).toLowerCase().trim() === 'entrevistador'
        );

        if (entrevistadorIndex >= 0) {
          let comEntrevistador = 0;
          for (let i = 1; i < candidatosData.length; i++) {
            const entrevistador = String(candidatosData[i][entrevistadorIndex]).trim();
            if (entrevistador) comEntrevistador++;
          }
          Logger.log(`    - Com entrevistador: ${comEntrevistador}`);
        }
      }
    }

    Logger.log('');

    // ============================================
    // 3. VERIFICAR PLANILHA MOTIVOS
    // ============================================
    Logger.log('─'.repeat(70));
    Logger.log('3️⃣ PLANILHA MOTIVOS');
    Logger.log('─'.repeat(70));

    const motivosSheet = ss.getSheetByName('MOTIVOS');
    if (!motivosSheet) {
      Logger.log('❌ Planilha MOTIVOS não existe!');
      Logger.log('   Execute setupAllSheets() para criar');
    } else {
      Logger.log('✅ Planilha MOTIVOS existe');

      const motivosData = motivosSheet.getDataRange().getValues();
      Logger.log(`📊 Total de motivos cadastrados: ${motivosData.length - 1}`);

      if (motivosData.length > 1) {
        Logger.log('\n📋 Motivos disponíveis:');
        for (let i = 1; i < motivosData.length; i++) {
          const id = motivosData[i][0];
          const motivo = motivosData[i][1];
          const ativo = motivosData[i][2];
          Logger.log(`  ${ativo ? '✅' : '❌'} [${id}] ${motivo}`);
        }
      }
    }

    Logger.log('');

    // ============================================
    // 4. TESTAR FUNÇÕES
    // ============================================
    Logger.log('─'.repeat(70));
    Logger.log('4️⃣ TESTAR FUNÇÕES');
    Logger.log('─'.repeat(70));

    // Testar getCandidates
    try {
      Logger.log('\n🧪 Testando getCandidates()...');
      const candidatesResult = getCandidates();
      if (candidatesResult && candidatesResult.candidates) {
        Logger.log(`✅ getCandidates() retornou ${candidatesResult.candidates.length} candidatos`);
      } else {
        Logger.log(`⚠️ getCandidates() retornou estrutura inesperada:`, candidatesResult);
      }
    } catch (e) {
      Logger.log(`❌ Erro em getCandidates(): ${e.message}`);
    }

    // Testar getAnalysts
    try {
      Logger.log('\n🧪 Testando getAnalysts()...');
      const analystsResult = getAnalysts();
      if (analystsResult && analystsResult.analysts) {
        Logger.log(`✅ getAnalysts() retornou ${analystsResult.analysts.length} analistas`);
      } else {
        Logger.log(`⚠️ getAnalysts() retornou estrutura inesperada:`, analystsResult);
      }
    } catch (e) {
      Logger.log(`❌ Erro em getAnalysts(): ${e.message}`);
    }

    // Testar getInterviewers
    try {
      Logger.log('\n🧪 Testando getInterviewers()...');
      const interviewersResult = getInterviewers();
      if (interviewersResult && interviewersResult.interviewers) {
        Logger.log(`✅ getInterviewers() retornou ${interviewersResult.interviewers.length} entrevistadores`);
      } else {
        Logger.log(`⚠️ getInterviewers() retornou estrutura inesperada:`, interviewersResult);
      }
    } catch (e) {
      Logger.log(`❌ Erro em getInterviewers(): ${e.message}`);
    }

    Logger.log('');

    // ============================================
    // 5. RESUMO E RECOMENDAÇÕES
    // ============================================
    Logger.log('═'.repeat(70));
    Logger.log('📋 RESUMO E RECOMENDAÇÕES');
    Logger.log('═'.repeat(70));

    const problemas = [];

    if (!usuariosSheet) problemas.push('Planilha USUARIOS não existe');
    if (!candidatosSheet) problemas.push('Planilha CANDIDATOS não existe');
    if (!motivosSheet) problemas.push('Planilha MOTIVOS não existe');

    if (usuariosSheet) {
      const usuariosData = usuariosSheet.getDataRange().getValues();
      if (usuariosData.length <= 1) problemas.push('Nenhum usuário cadastrado');

      const headers = usuariosData[0];
      if (!headers.includes('ID')) problemas.push('Coluna ID faltando em USUARIOS');
    }

    if (candidatosSheet) {
      const candidatosData = candidatosSheet.getDataRange().getValues();
      if (candidatosData.length <= 1) problemas.push('Nenhum candidato cadastrado');

      const headers = candidatosData[0];
      const criticas = ['Status', 'Analista', 'Entrevistador'];
      criticas.forEach(col => {
        const existe = headers.some(h =>
          String(h).toLowerCase().trim().replace(/\s+/g, '') === col.toLowerCase()
        );
        if (!existe) problemas.push(`Coluna ${col} faltando em CANDIDATOS`);
      });
    }

    if (problemas.length > 0) {
      Logger.log('\n⚠️ PROBLEMAS ENCONTRADOS:');
      problemas.forEach((p, i) => {
        Logger.log(`  ${i + 1}. ${p}`);
      });
      Logger.log('\n💡 SOLUÇÃO:');
      Logger.log('  Execute a função setupAllSheets() para corrigir automaticamente');
    } else {
      Logger.log('\n✅ ESTRUTURA OK!');
      Logger.log('  Todas as planilhas e colunas necessárias estão presentes');
    }

    Logger.log('');
    Logger.log('═'.repeat(70));
    Logger.log('✅ DIAGNÓSTICO CONCLUÍDO');
    Logger.log('═'.repeat(70));

  } catch (error) {
    Logger.log('');
    Logger.log('❌ ERRO DURANTE DIAGNÓSTICO:');
    Logger.log(error.toString());
    Logger.log('');
    Logger.log('Stack trace:');
    Logger.log(error.stack);
  }
}
