# ✅ CORREÇÃO: Erro de Envio de SMS e Email

## 🐛 Erro Original
```
❌ Erro ao enviar mensagens: Error: _pickPhoneFromRow_ is not defined
```

## 🎯 Causa
As funções `_pickPhoneFromRow_` e `_pickEmailFromRow_` estavam sendo chamadas mas não existiam no Google Apps Script.

## ✅ Solução Implementada

Adicionei duas funções ao script:

### 1. `_pickEmailFromRow_`
Extrai o email do candidato buscando nas colunas:
- EMAIL
- E-MAIL
- EMAILPRINCIPAL
- Ou qualquer coluna que contenha "email" no nome

### 2. `_pickPhoneFromRow_`
Extrai o telefone do candidato buscando nas colunas:
- TELEFONE
- CELULAR
- TELEFONEPRINCIPAL
- TELEFONECELULAR
- WHATSAPP
- Ou qualquer coluna que contenha "telefone", "celular", "whatsapp" ou "fone"

## 📋 Passo a Passo para Atualizar

### Opção 1: Copiar Script Completo Atualizado (RECOMENDADO)

1. Abra o Google Apps Script: https://script.google.com
2. Selecione seu projeto
3. **Selecione TODO o código** (Ctrl+A ou Cmd+A)
4. Abra o arquivo `google-apps-script-COMPLETO-FINAL.js` deste projeto
5. **Copie TODO o conteúdo** do arquivo
6. **Cole** no Google Apps Script (substituindo tudo)
7. Clique em **Salvar** (💾)
8. Clique em **Implantar** > **Gerenciar implantações**
9. Clique no ícone **✏️ (editar)** na implantação atual
10. Clique em **Nova versão**
11. **Implantar**

### Opção 2: Adicionar Apenas as Funções Faltantes

1. Abra o Google Apps Script: https://script.google.com
2. Procure pela função `_applyTemplate_` (deve estar por volta da linha 752)
3. **Logo APÓS** essa função, adicione este código:

```javascript
function _pickEmailFromRow_(headers, rowValues) {
  const col = _colMap_(headers);

  // Tentar colunas comuns de email
  const emailColumns = ['EMAIL', 'E-MAIL', 'EMAILPRINCIPAL', 'Email', 'E-mail'];

  for (let i = 0; i < emailColumns.length; i++) {
    const colName = emailColumns[i];
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

  for (let i = 0; i < phoneColumns.length; i++) {
    const colName = phoneColumns[i];
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
```

4. Clique em **Salvar** (💾)
5. Clique em **Implantar** > **Gerenciar implantações**
6. Clique no ícone **✏️ (editar)** na implantação atual
7. Clique em **Nova versão**
8. **Implantar**

## ✅ Como Testar

1. Acesse o sistema
2. Faça login como admin ou analista
3. Selecione um candidato
4. Clique em "Enviar Mensagem"
5. Escolha Email ou SMS
6. Preencha o conteúdo
7. Clique em "Enviar"

**Resultado esperado:**
- ✅ Sem erro `_pickPhoneFromRow_ is not defined`
- ✅ Mensagens são enviadas
- ✅ Logs mostram sucesso

## 📊 O Que as Funções Fazem

### `_pickEmailFromRow_`
1. Procura por colunas de email na planilha
2. Verifica se o valor contém "@"
3. Retorna o email encontrado ou `null`

### `_pickPhoneFromRow_`
1. Procura por colunas de telefone na planilha
2. Remove caracteres não numéricos
3. Verifica se tem pelo menos 10 dígitos
4. Retorna o telefone ou `null`

## 🔍 Validações Implementadas

### Para Email:
- ✅ Busca em múltiplas colunas possíveis
- ✅ Valida presença de "@"
- ✅ Remove espaços em branco
- ⚠️ Retorna null se não encontrar

### Para Telefone:
- ✅ Busca em múltiplas colunas possíveis
- ✅ Remove formatação (parênteses, hífens, espaços)
- ✅ Valida mínimo de 10 dígitos
- ⚠️ Retorna null se não encontrar

## 📋 Colunas Reconhecidas

### Email:
- EMAIL
- E-MAIL
- EMAILPRINCIPAL
- Email
- E-mail
- Qualquer coluna com "email" no nome

### Telefone:
- TELEFONE
- CELULAR
- TELEFONEPRINCIPAL
- TELEFONECELULAR
- Telefone
- Celular
- WHATSAPP
- WhatsApp
- Qualquer coluna com "telefone", "celular", "whatsapp" ou "fone" no nome

## ⚠️ IMPORTANTE

**A URL do Google Apps Script NÃO muda!**

Quando você:
1. Edita o código
2. Salva
3. Vai em "Gerenciar implantações"
4. Clica no ✏️ (editar) da implantação EXISTENTE
5. Clica em "Nova versão"
6. Implanta

A URL **permanece a mesma**. Você NÃO precisa:
- ❌ Atualizar o .env
- ❌ Atualizar variáveis no Netlify
- ❌ Fazer redeploy do frontend

Apenas atualize o script e reimplante. As mudanças serão aplicadas automaticamente!

## 🎊 Conclusão

Após seguir esses passos, o envio de emails e SMS funcionará corretamente. As funções agora conseguem extrair emails e telefones dos candidatos na planilha.
