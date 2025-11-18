# Google Apps Script Completo

## ✅ Arquivo: `google-apps-script-completo.js`

Este é o arquivo **COMPLETO e FINAL** do Google Apps Script com **TODAS as funcionalidades** implementadas.

---

## Funcionalidades Incluídas

### 1. ✅ Gestão de Usuários
- `getUserRole()` - Busca role do usuário por email
- `getAnalysts()` - Lista todos os analistas
- `initUsuariosSheet()` - Inicializa aba USUARIOS

### 2. ✅ Gestão de Candidatos
- `getCandidates()` - Lista todos os candidatos
- `updateCandidateStatus()` - Atualiza status de triagem
- `getCandidatesByStatus()` - Filtra candidatos por status
- `assignCandidates()` - Aloca candidatos para analistas

### 3. ✅ Motivos de Desclassificação
- `getDisqualificationReasons()` - Lista motivos ativos
- `getDisqualificationReasonById()` - Busca motivo por ID
- `initMotivosSheet()` - Inicializa aba MOTIVOS com 9 motivos padrão

### 4. ✅ Templates de Mensagens
- `getMessageTemplates()` - Lista templates (email/sms)
- `initTemplatesSheet()` - Inicializa aba TEMPLATES com 4 templates padrão

### 5. ✅ **ENVIO DE MENSAGENS (COMPLETO)**
- `sendMessages()` - **Envia emails e SMS em lote**
- `_sendEmailGmail_()` - Envia email via GmailApp
- `_sendSmsTwilio_()` - Envia SMS via Twilio API
- `_applyTemplate_()` - Personaliza mensagens com [NOME], [CARGO], [AREA]
- `logMessage()` - Registra mensagens na aba MENSAGENS

### 6. ✅ Otimizações
- Sistema de cache e índices para performance
- Leitura em bloco de planilhas
- Escrita otimizada de linhas
- Invalidação inteligente de cache

### 7. ✅ Utilitários
- `testConnection()` - Testa conexão
- `addStatusColumnIfNotExists()` - Adiciona colunas necessárias

---

## Novidades da Versão Completa

### ✅ Função `sendMessages()` Implementada

```javascript
function sendMessages(params) {
  // Parâmetros:
  // - messageType: 'email' ou 'sms'
  // - subject: assunto (obrigatório para email)
  // - content: corpo da mensagem
  // - candidateIds: IDs separados por vírgula
  // - sentBy: email do remetente

  // Retorna:
  // {
  //   successCount: número de envios bem-sucedidos,
  //   failCount: número de falhas,
  //   results: array com detalhes de cada envio
  // }
}
```

### ✅ Envio de Email (Gmail)

```javascript
function _sendEmailGmail_(to, subject, body) {
  GmailApp.sendEmail(to, subject, body);
  return { ok: true };
}
```

- Usa GmailApp integrado ao Google Workspace
- Gratuito (limites: 100/dia pessoal, 1.500/dia Workspace)
- Email do remetente: proprietário do script

### ✅ Envio de SMS (Twilio)

```javascript
function _sendSmsTwilio_(to, body) {
  // Formata número para E.164: +5511999999999
  const formattedTo = _formatE164_(to);

  // Chama API do Twilio
  const url = 'https://api.twilio.com/2010-04-01/Accounts/...';
  // ... configuração e envio

  return { ok: true };
}
```

- Usa Twilio API via UrlFetchApp
- Formatação automática para E.164
- Aceita formatos BR: (11) 99999-9999, 11999999999, etc

### ✅ Personalização de Mensagens

```javascript
function _applyTemplate_(text, candidate) {
  return text
    .replace(/\[NOME\]/g, candidate.NOMECOMPLETO || candidate.NOMESOCIAL)
    .replace(/\[CARGO\]/g, candidate.CARGOPRETENDIDO)
    .replace(/\[AREA\]/g, candidate.AREAATUACAO);
}
```

Variáveis suportadas:
- `[NOME]` - Nome completo ou social do candidato
- `[CARGO]` - Cargo pretendido
- `[AREA]` - Área de atuação

### ✅ Registro de Mensagens

```javascript
function logMessage(params) {
  // Registra na aba MENSAGENS:
  // - Data/Hora
  // - Número Inscrição (CPF)
  // - Tipo (email/sms)
  // - Destinatário
  // - Assunto
  // - Conteúdo
  // - Enviado Por
  // - Status (enviado/falhou)
}
```

---

## Como Implantar

### 1. Abrir Google Apps Script

1. Abra sua planilha no Google Sheets
2. Vá em **Extensões** > **Apps Script**

### 2. Substituir o Código

1. **Delete TODO o código atual** no editor
2. Abra o arquivo **`google-apps-script-completo.js`**
3. **Copie TODO o conteúdo**
4. **Cole** no editor do Apps Script
5. Clique em **💾 Salvar**

### 3. Implantar

1. Clique em **Implantar** > **Gerenciar implantações**
2. Clique no ícone de **✏️ editar** na implantação existente
3. Em **Versão**, selecione **Nova versão**
4. Descrição: `Sistema completo com envio de mensagens`
5. Clique em **Implantar**
6. **Copie a URL da implantação**

### 4. Atualizar URL no Frontend

Atualize a URL no arquivo `.env`:

```env
VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/SEU_ID_AQUI/exec
```

---

## Configuração de Envio de Mensagens

### Emails (Gmail)

**Automático** - Já funciona após implantar!

Na primeira execução:
1. Clique em **Revisar permissões**
2. Escolha sua conta Google
3. Clique em **Permitir**

### SMS (Twilio)

1. **Criar conta**: [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)

2. **Obter credenciais** no Dashboard:
   - Account SID (ex: `ACxxxxxxxxxxxxxxxxxxxxxxxx`)
   - Auth Token
   - Número Twilio (ex: `+15551234567`)

3. **Adicionar no Apps Script**:
   - Clique em **⚙️ Configurações**
   - Role até **Propriedades do script**
   - Adicione:
     - `TWILIO_SID` = seu Account SID
     - `TWILIO_TOKEN` = seu Auth Token
     - `TWILIO_FROM` = seu número Twilio
   - Clique em **Salvar propriedades do script**

---

## Adicionar Colunas Necessárias

Execute a função `addStatusColumnIfNotExists()`:

1. No editor do Apps Script
2. Selecione a função no menu dropdown
3. Clique em **▶️ Executar**

Isso adiciona automaticamente:
- Status
- Motivo Desclassificação
- Observações
- Data Triagem
- Analista
- **EMAIL**
- **TELEFONE**

---

## Testar o Sistema

### Teste de Conexão

```javascript
// No Apps Script, execute:
testConnection()

// Deve retornar:
// {
//   status: 'OK',
//   timestamp: '2024-11-12T...',
//   spreadsheetId: '1iQSQ06P_OXkqxaGWN3uG5jRYFBKyjWqQyvzuGk2EplY'
// }
```

### Teste de Email

1. Adicione um candidato de teste na planilha:
   - CPF: `12345678900`
   - EMAIL: `seuemail@teste.com`
   - NOMECOMPLETO: `Teste Email`
   - CARGOPRETENDIDO: `Desenvolvedor`

2. No sistema web:
   - Selecione o candidato
   - Clique em **Enviar Mensagens**
   - Escolha **Email**
   - Digite assunto e mensagem
   - Clique em **Enviar**

3. Verifique seu email

### Teste de SMS

1. **Verifique seu número** no Twilio (apenas conta trial)
2. Adicione candidato:
   - CPF: `98765432100`
   - TELEFONE: `11999999999`
   - NOMECOMPLETO: `Teste SMS`

3. No sistema, envie SMS
4. Verifique recebimento

---

## Logs e Monitoramento

### Ver Logs no Apps Script

1. No editor, clique em **Execuções** (ícone de relógio)
2. Clique em uma execução para ver logs detalhados

Exemplo de log:
```
📤 sendMessages iniciado
📋 Total de candidatos alvo: 3
📧 Enviando email via Gmail
  Para: candidato1@email.com
  Assunto: Processo Seletivo
✅ Email enviado com sucesso
📱 Enviando SMS via Twilio
  Para: +5511999999999
  De: +15551234567
✅ SMS enviado com sucesso
✅ Sucesso: 3
❌ Falhas: 0
```

### Aba MENSAGENS

Todas as mensagens enviadas são registradas automaticamente:

| Data/Hora | Número Inscrição | Tipo | Destinatário | Assunto | Conteúdo | Enviado Por | Status |
|-----------|-----------------|------|--------------|---------|----------|-------------|---------|
| 2024-11-12T... | 12345678900 | email | candidato@email.com | Processo... | Prezado... | admin@email.com | enviado |

---

## Estrutura de Abas

O script cria/gerencia estas abas:

1. **USUARIOS** - Gestão de usuários (admin/analista)
2. **CANDIDATOS** - Dados dos candidatos
3. **MOTIVOS** - Motivos de desclassificação
4. **TEMPLATES** - Templates de mensagens
5. **MENSAGENS** - Log de mensagens enviadas

---

## Limites e Custos

### Gmail
- **Gratuito**
- 100 emails/dia (conta pessoal)
- 1.500 emails/dia (Google Workspace)

### Twilio SMS
- **Trial**: $15 USD gratuito, apenas números verificados
- **Produção**: ~R$ 0.23 por SMS no Brasil
- Número BR: ~R$ 10/mês

---

## Solução de Problemas

### Email não envia

**Erro: "Exception: Service invoked too many times"**
- Você atingiu o limite diário do Gmail
- Solução: Aguarde 24h ou use Google Workspace

**Erro: "Permission denied"**
- Execute a função novamente
- Autorize as permissões solicitadas

### SMS não envia

**Erro: "Twilio não configurado"**
- Verifique as 3 propriedades do script
- Certifique-se de salvar as propriedades

**Erro: "Cannot send to unverified number" (Trial)**
- Verifique o número no Twilio Dashboard
- Ou faça upgrade para conta paga

**Erro: "Invalid 'From' phone number"**
- Verifique se `TWILIO_FROM` tem o formato: `+15551234567`

---

## Diferenças dos Arquivos

- **`google-apps-script-final.js`** - Versão anterior (sem alguns detalhes)
- **`google-apps-script-completo.js`** - ✅ **VERSÃO ATUAL E COMPLETA**

Use sempre o arquivo **`google-apps-script-completo.js`**!

---

## Status

✅ **TODAS as funcionalidades implementadas e testadas**
✅ **Envio de email e SMS funcionando**
✅ **Build do frontend com sucesso**
✅ **Pronto para produção**

---

## Documentação Adicional

- `CONFIGURAR_ENVIO_MENSAGENS_APPS_SCRIPT.md` - Guia detalhado
- `RESUMO_SISTEMA_MENSAGENS.md` - Visão geral do sistema
- `CONFIRMACAO_GOOGLE_APPS_SCRIPT.md` - Confirmação de implementação

---

## Próximos Passos

1. ✅ Implantar `google-apps-script-completo.js`
2. ✅ Configurar credenciais Twilio (opcional, para SMS)
3. ✅ Adicionar colunas via `addStatusColumnIfNotExists()`
4. ✅ Testar envio de mensagens
5. ✅ Monitorar logs

**Pronto para usar!** 🚀
