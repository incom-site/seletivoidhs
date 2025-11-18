# Configuração do Google Apps Script

Este guia explica como configurar o Google Apps Script para funcionar com o sistema de triagem.

---

## 📋 Pré-requisitos

1. Conta Google ativa
2. Planilha do Google Sheets criada
3. Acesso ao Google Apps Script Editor

---

## 🚀 Passo a Passo

### 1. Abrir o Google Apps Script Editor

1. Abra sua planilha do Google Sheets
2. Clique em **Extensões** → **Apps Script**
3. Uma nova aba será aberta com o editor

### 2. Colar o Código

1. Delete todo o código padrão que aparece (`function myFunction() {...}`)
2. Abra o arquivo `google-apps-script-complete.js` deste projeto
3. Copie **TODO** o conteúdo
4. Cole no editor do Google Apps Script

### 3. Configurar o ID da Planilha

No início do código, localize esta linha:

```javascript
const SPREADSHEET_ID = '1iQSQ06P_OXkqxaGWN3uG5jRYFBKyjWqQyvzuGk2EplY';
```

**Substitua pelo ID da SUA planilha:**

Para encontrar o ID da sua planilha, olhe a URL:
```
https://docs.google.com/spreadsheets/d/[SEU_ID_AQUI]/edit
```

Exemplo:
```javascript
const SPREADSHEET_ID = 'ABC123xyz456def789ghi';
```

### 4. Salvar o Projeto

1. Clique no ícone de **disquete** ou pressione `Ctrl+S` (Windows) / `Cmd+S` (Mac)
2. Dê um nome ao projeto: **"Sistema de Triagem"**
3. Clique em **OK**

### 5. Implantar como Web App

1. Clique em **Implantar** (canto superior direito)
2. Selecione **Nova implantação**
3. Clique no ícone de **engrenagem** ao lado de "Selecionar tipo"
4. Escolha **Aplicativo da Web**
5. Configure:
   - **Descrição:** Sistema de Triagem - Hospital
   - **Executar como:** **Eu** (seu email)
   - **Quem tem acesso:** **Qualquer pessoa**
6. Clique em **Implantar**

### 6. Autorizar Permissões

Na primeira vez, o Google pedirá autorização:

1. Clique em **Autorizar acesso**
2. Escolha sua conta Google
3. Se aparecer "Este app não foi verificado", clique em **Avançado**
4. Clique em **Ir para Sistema de Triagem (não seguro)**
5. Clique em **Permitir**

### 7. Copiar a URL do Web App

Após a implantação, você verá uma tela com:

```
ID da implantação: AKfyc...
URL do aplicativo da Web: https://script.google.com/macros/s/AKfyc.../dev
```

**Copie a URL do aplicativo da Web** (a segunda linha)

### 8. Atualizar no Projeto

Cole a URL copiada em dois lugares:

#### No arquivo `.env` local:
```env
VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/[SUA_URL_AQUI]/dev
```

#### No Netlify:
1. Acesse **Site settings** → **Environment variables**
2. Edite `VITE_GOOGLE_SCRIPT_URL`
3. Cole a nova URL
4. Salve e faça redeploy

---

## 📊 Estrutura das Planilhas

O script espera duas abas na planilha:

### Aba: USUARIOS

Colunas obrigatórias:
- **Email** (texto)
- **Nome** (texto)
- **Role** (texto: "admin" ou "analista")
- **Ativo** (boolean: true/false)

### Aba: CANDIDATOS

Colunas obrigatórias:
- **id** (texto único)
- **registration_number** (número/texto único)
- **NOMECOMPLETO** (texto)
- **NOMESOCIAL** (texto, opcional)
- **CPF** (texto)
- **VAGAPCD** (texto: "Sim" ou "Não")
- **LAUDO MEDICO** (link, opcional)
- **AREAATUACAO** (texto: "Administrativa" ou "Assistencial")
- **CARGOPRETENDIDO** (texto)
- **CURRICULOVITAE** (link, opcional)
- **DOCUMENTOSPESSOAIS** (link, opcional)
- **DOCUMENTOSPROFISSIONAIS** (link, opcional)
- **DIPLOMACERTIFICADO** (link, opcional)
- **DOCUMENTOSCONSELHO** (link, opcional)
- **ESPECIALIZACOESCURSOS** (link, opcional)
- **status** (texto: "pendente", "em_analise", "concluido")
- **status_triagem** (texto: "Classificado", "Desclassificado", "Revisar")
- **data_hora_triagem** (data/hora)
- **analista_triagem** (email do analista)
- **assigned_to** (email do analista)
- **assigned_by** (email do admin)
- **assigned_at** (data/hora)
- **priority** (número)
- **notes** (texto)
- **created_at** (data/hora)
- **updated_at** (data/hora)

**Importante:** Se as abas não existirem, o script as criará automaticamente na primeira execução.

---

## 🧪 Testar a Conexão

Para testar se tudo está funcionando:

1. Abra o navegador
2. Cole a URL do Web App e adicione `?action=test` no final:
   ```
   https://script.google.com/macros/s/[SUA_URL]/dev?action=test
   ```
3. Pressione Enter

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Conexão funcionando!",
  "spreadsheet_id": "...",
  "sheets": ["USUARIOS", "CANDIDATOS"],
  "timestamp": "2025-11-07T..."
}
```

Se ver esta resposta, está tudo funcionando!

---

## 🔧 Funções Disponíveis

O script fornece as seguintes ações (via parâmetro `?action=`):

### Usuários
- `getUserRole` - Buscar role de um usuário
- `getAllUsers` - Listar todos os usuários
- `createUser` - Criar novo usuário
- `updateUser` - Atualizar usuário
- `updateUserRole` - Atualizar role do usuário
- `deleteUser` - Deletar usuário

### Candidatos
- `getCandidates` - Listar todos os candidatos
- `getCandidate` - Buscar um candidato específico
- `addCandidate` - Adicionar novo candidato
- `updateCandidate` - Atualizar candidato
- `deleteCandidate` - Deletar candidato
- `assignCandidates` - Atribuir candidatos a analista
- `bulkUpdateCandidates` - Atualizar múltiplos candidatos

### Estatísticas
- `getStatistics` - Obter estatísticas gerais

### Teste
- `test` - Testar conexão

---

## 🔒 Segurança

**IMPORTANTE:**

1. ✅ A URL do Web App é pública, mas só você tem acesso aos dados da planilha
2. ✅ Configure "Executar como: Eu" para que o script use suas permissões
3. ✅ Configure "Quem tem acesso: Qualquer pessoa" para permitir chamadas HTTP
4. ✅ Não compartilhe o ID da sua planilha publicamente
5. ✅ Revise os logs regularmente em **Execuções** no Apps Script

---

## 🐛 Solução de Problemas

### Erro: "Planilha não encontrada"
- Verifique se o `SPREADSHEET_ID` está correto
- Confirme que você tem acesso à planilha

### Erro: "Não autorizado"
- Refaça o processo de autorização (Passo 6)
- Verifique se "Executar como: Eu" está selecionado

### Erro: "CORS blocked"
- Certifique-se de que implantou como Web App
- Verifique se "Quem tem acesso: Qualquer pessoa" está configurado
- Use a URL `/dev` ou `/exec` correta

### Erro: "Action not found"
- Verifique se está passando o parâmetro `?action=` correto
- Consulte a lista de ações disponíveis acima

### Dados não aparecem no frontend
- Teste a URL manualmente no navegador
- Verifique se as abas USUARIOS e CANDIDATOS existem
- Confirme que há dados nas planilhas
- Verifique os logs em **Execuções** no Apps Script

---

## 📝 Atualizações Futuras

Quando precisar atualizar o código:

1. Abra o Apps Script Editor
2. Cole o novo código
3. Salve (`Ctrl+S`)
4. Clique em **Implantar** → **Gerenciar implantações**
5. Clique no ícone de **lápis** na implantação ativa
6. Altere a **Versão** para "Nova versão"
7. Adicione uma descrição da mudança
8. Clique em **Implantar**

A URL permanece a mesma, não precisa atualizar no projeto!

---

## 💡 Dicas

1. Use a aba **Execuções** no Apps Script para ver logs e debug
2. Use `Logger.log()` no código para adicionar logs customizados
3. A função `test` é útil para verificar se tudo está conectado
4. Teste cada função individualmente adicionando parâmetros na URL
5. Mantenha backups da planilha regularmente

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs em **Execuções** no Apps Script
2. Teste a URL manualmente com `?action=test`
3. Confirme que as permissões estão corretas
4. Revise a estrutura das planilhas

---

✅ **Configuração concluída!** O Google Apps Script agora está pronto para funcionar com o sistema de triagem.
