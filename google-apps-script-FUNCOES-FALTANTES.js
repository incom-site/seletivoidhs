// ============================================
// FUNÇÕES QUE ESTÃO FALTANDO NO SCRIPT
// ============================================
//
// INSTRUÇÕES:
// 1. Abra o Google Apps Script atual
// 2. Encontre a função _applyTemplate_ (linha ~752)
// 3. ADICIONE estas funções LOGO APÓS a função _applyTemplate_
// 4. Salve e reimplante o script
//
// ============================================

// Função para extrair email do candidato
function _pickEmailFromRow_(headers, rowValues) {
  const col = _colMap_(headers);

  // Tentar colunas comuns de email
  const emailColumns = ['EMAIL', 'E-MAIL', 'EMAILPRINCIPAL', 'Email', 'E-mail'];

  for (let colName of emailColumns) {
    const colIndex = col[colName];
    if (colIndex !== undefined && colIndex >= 0) {
      const email = rowValues[colIndex];
      if (email && String(email).includes('@')) {
        return String(email).trim();
      }
    }
  }

  // Se não encontrou, procurar qualquer coluna que contenha "email" no nome
  for (let i = 0; i < headers.length; i++) {
    const headerName = String(headers[i]).toLowerCase();
    if (headerName.includes('email') || headerName.includes('e-mail')) {
      const email = rowValues[i];
      if (email && String(email).includes('@')) {
        return String(email).trim();
      }
    }
  }

  Logger.log('⚠️ Email não encontrado na linha');
  return null;
}

// Função para extrair telefone do candidato
function _pickPhoneFromRow_(headers, rowValues) {
  const col = _colMap_(headers);

  // Tentar colunas comuns de telefone
  const phoneColumns = [
    'TELEFONE',
    'CELULAR',
    'TELEFONEPRINCIPAL',
    'TELEFONECELULAR',
    'Telefone',
    'Celular',
    'WHATSAPP',
    'WhatsApp'
  ];

  for (let colName of phoneColumns) {
    const colIndex = col[colName];
    if (colIndex !== undefined && colIndex >= 0) {
      const phone = rowValues[colIndex];
      if (phone) {
        const phoneStr = String(phone).replace(/\D/g, '');
        // Verificar se tem pelo menos 10 dígitos (telefone válido)
        if (phoneStr.length >= 10) {
          return phoneStr;
        }
      }
    }
  }

  // Se não encontrou, procurar qualquer coluna que contenha "telefone" ou "celular" no nome
  for (let i = 0; i < headers.length; i++) {
    const headerName = String(headers[i]).toLowerCase();
    if (headerName.includes('telefone') ||
        headerName.includes('celular') ||
        headerName.includes('whatsapp') ||
        headerName.includes('fone')) {
      const phone = rowValues[i];
      if (phone) {
        const phoneStr = String(phone).replace(/\D/g, '');
        if (phoneStr.length >= 10) {
          return phoneStr;
        }
      }
    }
  }

  Logger.log('⚠️ Telefone não encontrado na linha');
  return null;
}

// ============================================
// LOCALIZAÇÃO NO SCRIPT ATUAL
// ============================================
//
// Procure por esta linha no seu script:
//
//   function _applyTemplate_(text, candidate){
//     if (!text) return '';
//     return String(text)
//       .replace(/\[NOME\]/g, candidate.NOMECOMPLETO || candidate.NOMESOCIAL || '')
//       .replace(/\[CARGO\]/g, candidate.CARGOPRETENDIDO || '')
//       .replace(/\[AREA\]/g, candidate.AREAATUACAO || '');
//   }
//
// Logo APÓS esta função (depois do fechamento }), adicione:
//
//   function _pickEmailFromRow_(headers, rowValues) {
//     ... (cole o código acima)
//   }
//
//   function _pickPhoneFromRow_(headers, rowValues) {
//     ... (cole o código acima)
//   }
//
// ============================================
