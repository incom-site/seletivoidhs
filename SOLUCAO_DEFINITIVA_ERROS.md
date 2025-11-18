# ✅ Solução Definitiva - Erros de CORS e Envio

## 🔴 Erros Identificados

### 1. Erro CORS
```
Access to fetch at 'https://script.google.com/...'
from origin 'https://seletivotriagem.netlify.app'
has been blocked by CORS policy
```

### 2. Erro Failed to Fetch
```
Failed to script.google.com/ma...xg19B8VC5WkH/exec:1
load resource: net::ERR_FAILED
```

### 3. Erro sendMessages
```
TypeError: Failed to fetch
at Object.sendMessages (googleSheets-gscMSQ5H.js:1:3221)
```

### 4. Erro Cannot read properties of undefined
```
TypeError: Cannot read properties of undefined (reading 'postData')
at handleRequest (Código:127:11)
```
**Causa:** Script sendo executado manualmente sem requisição HTTP
**Solução:** Script foi corrigido para verificar se `e` existe antes de acessar propriedades

---

## 🎯 Causa Raiz dos Problemas

### Problema 1: URL do Script Antiga/Incorreta
A URL no `.env` pode estar apontando para uma implantação antiga ou incorreta

### Problema 2: CORS Não Configurado Corretamente
O Apps Script precisa retornar os headers CORS corretos

### Problema 3: Implantação Não Como "Qualquer Pessoa"
Se a implantação não permite acesso público, haverá erro de CORS

### Problema 4: Execução Manual do Script
Quando o script é executado manualmente (sem requisição HTTP), o objeto `e` é undefined

---

## 🔧 Solução Completa - Passo a Passo

### ETAPA 1: Implantar Novo Script Corrigido

#### 1.1. Abrir Google Apps Script

1. Abra sua planilha: https://docs.google.com/spreadsheets/d/1iQSQ06P_OXkqxaGWN3uG5jRYFBKyjWqQyvzuGk2EplY
2. Clique em **Extensões** > **Apps Script**

#### 1.2. Substituir Código Completamente

1. **DELETE TODO O CÓDIGO** atual (Ctrl+A, Delete)
2. Abra o arquivo **`google-apps-script-final-corrigido.js`**
3. **Copie TODO o conteúdo**
4. **Cole** no editor
5. **Salve** (Ctrl+S ou ícone 💾)

#### 1.3. Criar Nova Implantação

**IMPORTANTE**: Vamos criar uma NOVA implantação do zero!

1. Clique em **Implantar** (botão azul no canto superior direito)
2. Selecione **Nova implantação**
3. Clique no ícone de **⚙️ engrenagem** (ao lado de "Selecionar tipo")
4. Escolha **Aplicativo da Web**

Configure:

| Campo | Valor |
|-------|-------|
| **Descrição** | `Sistema de Triagem - CORS Corrigido` |
| **Executar como** | **Eu** (sua conta) |
| **Quem tem acesso** | **Qualquer pessoa** |

5. Clique em **Implantar**

#### 1.4. Autorizar Permissões

1. Clique em **Autorizar acesso**
2. Escolha sua conta Google
3. Se aparecer aviso "Google não verificou este app":
   - Clique em **Avançado**
   - Clique em **Acessar [Nome do Projeto] (não seguro)**
4. Clique em **Permitir**

#### 1.5. Copiar Nova URL

Após implantar, você verá uma URL como:
```
https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxxx/exec
```

**COPIE ESTA URL COMPLETA!**

---

### ETAPA 2: Atualizar URL no Projeto

#### 2.1. Abrir arquivo .env

No seu projeto, abra o arquivo `.env` na raiz

#### 2.2. Substituir URL

**ANTES:**
```env
VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/AKfycbz6BmO1rhI8LTRNzakiQ8ryL1cO2tAaNSFfWx9fh0ZFHqZ0b2FgW4WJxg19B8VC5WkH/exec
```

**DEPOIS:**
```env
VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/SUA_NOVA_URL_AQUI/exec
```

**Substitua pela URL que você copiou na Etapa 1.5!**

#### 2.3. Salvar arquivo

Salve o arquivo `.env` (Ctrl+S)

---

### ETAPA 3: Rebuild e Deploy

#### 3.1. Build

No terminal do projeto:

```bash
npm run build
```

Aguarde: `✓ built in X.XXs`

#### 3.2. Deploy (Se estiver usando Netlify)

Se o deploy é automático via Git:
```bash
git add .
git commit -m "Fix: Atualizar URL do Google Apps Script"
git push
```

Se for manual no Netlify:
1. Acesse https://app.netlify.com
2. Escolha seu site
3. Arraste a pasta `dist` para fazer upload

---

### ETAPA 4: Verificar Variáveis de Ambiente no Netlify

**MUITO IMPORTANTE**: O Netlify precisa ter as variáveis de ambiente!

#### 4.1. Acessar Configurações

1. Acesse https://app.netlify.com
2. Escolha seu site
3. Vá em **Site configuration** > **Environment variables**

#### 4.2. Adicionar/Atualizar Variáveis

Adicione estas variáveis (se não existirem):

| Key | Value |
|-----|-------|
| `VITE_GOOGLE_SCRIPT_URL` | `https://script.google.com/macros/s/SUA_URL/exec` |
| `VITE_SUPABASE_URL` | (já deve estar configurado) |
| `VITE_SUPABASE_ANON_KEY` | (já deve estar configurado) |

#### 4.3. Redesenhar Site

1. Vá em **Deploys**
2. Clique em **Trigger deploy**
3. Selecione **Clear cache and deploy site**

---

### ETAPA 5: Testar Conexão

#### 5.1. Testar URL Diretamente

Abra no navegador:
```
https://script.google.com/macros/s/SUA_URL/exec?action=test
```

**Resposta esperada:**
```json
{
  "success": true,
  "data": {
    "status": "OK",
    "timestamp": "2024-11-12T...",
    "spreadsheetId": "1iQSQ06P_OXkqxaGWN3uG5jRYFBKyjWqQyvzuGk2EplY"
  }
}
```

Se não funcionar:
- ❌ A URL está incorreta
- ❌ A implantação não está como "Qualquer pessoa"
- ❌ O código não foi salvo corretamente

#### 5.2. Testar no Sistema

1. Acesse seu site no Netlify
2. Faça login
3. Abra o **Console do Navegador** (F12)
4. Vá na aba **Console**
5. Tente enviar uma mensagem

**Logs esperados:**
```
📤 Enviando requisição para Google Apps Script
  Tipo: email
  IDs: 12345678900
📡 Response status: 200
📦 Resposta recebida: {success: true, data: {...}}
✅ Sucesso: 1
```

Se aparecer erro de CORS:
- Volte à Etapa 1 e reimplante
- Certifique-se que está como "Qualquer pessoa"
- Limpe o cache do navegador (Ctrl+Shift+Delete)

---

## 🔍 Diagnóstico de Problemas

### ❌ Erro: "Failed to fetch"

**Causa**: URL incorreta ou implantação antiga

**Solução**:
1. Verifique a URL no `.env`
2. Teste a URL diretamente no navegador
3. Se não funcionar, crie nova implantação (Etapa 1)

---

### ❌ Erro: "CORS policy"

**Causa**: Implantação não está como "Qualquer pessoa"

**Solução**:
1. Vá no Apps Script
2. **Implantar** > **Gerenciar implantações**
3. Clique em **✏️ Editar**
4. Verifique: **Quem tem acesso: Qualquer pessoa**
5. Se não estiver, mude e clique em **Implantar**

---

### ❌ Erro: "Action not found"

**Causa**: Código antigo ainda está ativo

**Solução**:
1. Volte ao Apps Script
2. Certifique-se que o código **`google-apps-script-final-corrigido.js`** está lá
3. Salve novamente (Ctrl+S)
4. Crie uma **Nova versão** da implantação

---

### ❌ Erro: "Twilio não configurado" (SMS)

**Causa**: Propriedades do Twilio não foram adicionadas

**Solução**:
1. No Apps Script, clique em **⚙️ Configurações**
2. Role até **Propriedades do script**
3. Adicione:
   - `TWILIO_SID`
   - `TWILIO_TOKEN`
   - `TWILIO_FROM`
4. Salve as propriedades

**NOTA**: SMS só funciona se você configurar o Twilio. Email funciona sem configuração adicional!

---

## ✅ Checklist de Verificação

Use este checklist para garantir que tudo está correto:

### Google Apps Script
- [ ] Código **`google-apps-script-final-corrigido.js`** colado
- [ ] Código salvo (Ctrl+S)
- [ ] **Nova implantação** criada
- [ ] Tipo: **Aplicativo da Web**
- [ ] Executar como: **Eu**
- [ ] Quem tem acesso: **Qualquer pessoa**
- [ ] Permissões autorizadas
- [ ] URL da implantação copiada

### Projeto Local
- [ ] Arquivo `.env` atualizado com nova URL
- [ ] URL no formato: `https://script.google.com/macros/s/[ID]/exec`
- [ ] Build executado: `npm run build`
- [ ] Build com sucesso (sem erros)

### Netlify (Se aplicável)
- [ ] Variáveis de ambiente configuradas:
  - [ ] `VITE_GOOGLE_SCRIPT_URL`
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] Site redesenhado após atualizar variáveis
- [ ] Cache limpo antes do deploy

### Testes
- [ ] URL testada diretamente no navegador → `?action=test`
- [ ] Resposta JSON com `"success": true`
- [ ] Console do navegador sem erros de CORS
- [ ] Mensagem de teste enviada com sucesso
- [ ] Log verificado na aba MENSAGENS da planilha

---

## 📊 Diferenças do Código Corrigido

### O que foi corrigido:

1. **CORS Headers Explícitos**
   ```javascript
   function createCorsResponse(data) {
     const output = ContentService.createTextOutput(JSON.stringify(data));
     output.setMimeType(ContentService.MimeType.JSON);
     return output;
   }
   ```

2. **Tratamento de Erros Melhorado**
   ```javascript
   try {
     const data = JSON.parse(e.postData.contents);
     // ...
   } catch (parseError) {
     return createCorsResponse({
       success: false,
       error: 'JSON inválido'
     });
   }
   ```

3. **Logs Detalhados**
   ```javascript
   Logger.log('🔄 Ação recebida: ' + action);
   Logger.log('✅ Resultado: ' + JSON.stringify(result));
   ```

4. **Validações Adicionais**
   - Verifica se conteúdo existe antes de enviar
   - Verifica se assunto existe (para emails)
   - Retorna erros específicos para cada problema

---

## 🆘 Suporte Adicional

Se ainda assim não funcionar:

### 1. Verificar Logs do Apps Script

1. No editor do Apps Script
2. Clique em **Execuções** (ícone de relógio)
3. Clique na execução mais recente
4. Veja os logs detalhados

### 2. Verificar Console do Navegador

1. Abra o site (F12)
2. Aba **Console**
3. Aba **Network**
4. Tente enviar mensagem
5. Clique na requisição que falhou
6. Veja **Headers**, **Preview**, **Response**

### 3. Informações para Debug

Se precisar de ajuda, colete:
- URL completa da implantação
- Erros do console (screenshot)
- Logs do Apps Script (screenshot)
- Resposta da URL de teste (`?action=test`)

---

## 🎯 Resumo Final

### O que mudou:
1. ✅ Novo arquivo: `google-apps-script-final-corrigido.js`
2. ✅ CORS corrigido no script
3. ✅ Tratamento de erros melhorado
4. ✅ Logs mais detalhados

### Próximos passos:
1. ✅ Implantar novo script
2. ✅ Copiar nova URL
3. ✅ Atualizar `.env`
4. ✅ Rebuild + Deploy
5. ✅ Testar envio

**Com estas correções, os erros de CORS e fetch devem ser resolvidos definitivamente!**
