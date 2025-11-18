# Análise de Problemas e Soluções - Console Errors

## 🔴 PROBLEMA 1: Erro de CORS

### Mensagem de Erro:
```
Access to fetch at 'https://script.google.com/macros/library/d/1lfVun4jtVF_rOFUZt7KbzuI05VTB1Hh6HIYmMQCaxbgTtCS9GVA9JsoY/3'
from origin 'https://seletivoatriagem.netlify.app' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### Causa Raiz:
A URL fornecida é uma **URL de biblioteca do Google Apps Script** (`/macros/library/d/...`), não uma **URL de Web App implantado** (`/macros/s/.../exec`). URLs de biblioteca não podem ser acessadas via HTTP e não possuem endpoints públicos.

---

## ✅ SOLUÇÕES

### SOLUÇÃO EXTERNA (OBRIGATÓRIA - Google Apps Script)

#### Passo 1: Publicar como Web App

1. Abra o projeto no Google Apps Script Editor
2. Clique em **Implantar** → **Nova implantação**
3. Selecione o tipo: **Aplicativo da Web**
4. Configure:
   - **Descrição:** Sistema de Triagem - Hospital
   - **Executar como:** Eu (seu email do Google)
   - **Quem tem acesso:** **Qualquer pessoa**
5. Clique em **Implantar**
6. Copie a **URL do Web App** (formato: `https://script.google.com/macros/s/[SCRIPT_ID]/exec`)

#### Passo 2: Configurar CORS no Google Apps Script

Adicione este código no seu projeto do Google Apps Script:

```javascript
// Função principal para GET requests
function doGet(e) {
  return handleRequest(e);
}

// Função principal para POST requests (se necessário)
function doPost(e) {
  return handleRequest(e);
}

// Handler unificado com CORS
function handleRequest(e) {
  try {
    const action = e.parameter.action;

    let result = {};

    // Roteamento de ações
    switch(action) {
      case 'getUserRole':
        result = getUserRole(e.parameter.email);
        break;
      case 'getAllUsers':
        result = getAllUsers();
        break;
      case 'createUser':
        result = createUser(e.parameter);
        break;
      case 'updateUser':
        result = updateUser(e.parameter);
        break;
      case 'assignCandidates':
        result = assignCandidates(e.parameter);
        break;
      // Adicione outras ações conforme necessário
      default:
        result = { error: 'Ação não reconhecida' };
    }

    // Retornar resposta com CORS headers
    return createJsonResponse(result);

  } catch (error) {
    return createJsonResponse({
      error: error.toString(),
      success: false
    });
  }
}

// Função helper para criar resposta JSON com CORS
function createJsonResponse(data) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  output.setContent(JSON.stringify(data));

  // IMPORTANTE: Não é possível adicionar headers CORS customizados via Apps Script
  // O Google automaticamente adiciona os headers necessários quando o Web App
  // está configurado com acesso "Qualquer pessoa"

  return output;
}

// Exemplo de função getUserRole
function getUserRole(email) {
  try {
    const sheet = SpreadsheetApp.openById('SEU_SHEET_ID').getSheetByName('USUARIOS');
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toLowerCase() === email.toLowerCase()) { // Assumindo email na coluna A
        return {
          email: data[i][0],
          nome: data[i][1],
          role: data[i][2],
          ativo: data[i][3],
          success: true
        };
      }
    }

    return { error: 'Usuário não encontrado', success: false };
  } catch (error) {
    return { error: error.toString(), success: false };
  }
}

// Adicione suas outras funções aqui (getAllUsers, createUser, etc.)
```

#### Passo 3: Testar o Web App

1. Copie a URL do Web App implantado
2. Teste no navegador:
   ```
   https://script.google.com/macros/s/[SCRIPT_ID]/exec?action=getUserRole&email=teste@email.com
   ```
3. Você deve receber uma resposta JSON

---

### SOLUÇÃO INTERNA (No Código da Aplicação)

#### 1. Atualizar a URL no arquivo .env

Substitua a URL atual pela URL do Web App que você obteve:

```env
VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/[SEU_SCRIPT_ID]/exec
```

#### 2. Atualizar no Netlify

Vá em **Site settings** → **Environment variables** e atualize:
```
VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/[SEU_SCRIPT_ID]/exec
```

---

## 🔴 PROBLEMA 2: TypeError no Login

### Mensagem de Erro:
```
Erro no login: TypeError: Failed to fetch
at ep.fetchData (index-B9f3C3wU.js:40:57761)
at ep.getUserByEmail (index-B9f3C3wU.js:40:58011)
```

### Causa Raiz:
O método `fetchData` está falhando porque:
1. A URL do Google Script está incorreta (biblioteca ao invés de web app)
2. Não há tratamento adequado de erros de rede
3. O CORS está bloqueando as requisições

### Solução:
Após corrigir a URL do Google Script (PROBLEMA 1), este erro será automaticamente resolvido.

---

## 📋 CHECKLIST DE RESOLUÇÃO

### Tarefas Externas (Google Apps Script):
- [ ] Publicar o script como Web App com acesso "Qualquer pessoa"
- [ ] Copiar a URL do Web App implantado (formato `/macros/s/.../exec`)
- [ ] Implementar função `doGet()` com tratamento de ações
- [ ] Implementar função `createJsonResponse()` para retornar JSON
- [ ] Testar a URL do Web App no navegador

### Tarefas Internas (Aplicação):
- [ ] Atualizar `VITE_GOOGLE_SCRIPT_URL` no arquivo `.env` local
- [ ] Atualizar `VITE_GOOGLE_SCRIPT_URL` nas variáveis de ambiente do Netlify
- [ ] Fazer rebuild da aplicação no Netlify
- [ ] Testar login após deploy

---

## 🎯 RESULTADO ESPERADO

Após implementar todas as soluções:
1. ✅ Sem erros de CORS no console
2. ✅ Requisições ao Google Apps Script funcionando
3. ✅ Login funcionando corretamente
4. ✅ Dados sendo carregados da planilha

---

## 📞 AJUDA ADICIONAL

Se os erros persistirem após seguir todos os passos:

1. **Verifique se a URL está correta:**
   - URL correta: `https://script.google.com/macros/s/[ID]/exec`
   - URL incorreta: `https://script.google.com/macros/library/d/[ID]/[VERSION]`

2. **Verifique as permissões no Google Apps Script:**
   - O Web App deve ter acesso: "Qualquer pessoa"
   - Não "Somente eu" ou "Qualquer pessoa na organização"

3. **Teste a URL manualmente:**
   - Abra a URL no navegador
   - Adicione `?action=test` no final
   - Você deve ver uma resposta JSON, não um erro de autenticação

4. **Verifique o console do Netlify:**
   - Confirme que a variável de ambiente foi salva
   - Faça um redeploy após alterar variáveis de ambiente
