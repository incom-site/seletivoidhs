# 📋 Passo a Passo: Configuração Completa do Sistema

## ✅ Erro Corrigido

**Problema**: `TypeError: v.sendMessages is not a function`

**Solução**: Adicionada a função `sendMessages()` no arquivo `src/services/googleSheets.ts`

**Status**: ✅ Build concluído com sucesso

---

## 🚀 Configuração do Sistema

### Etapa 1: Configurar Google Apps Script

#### 1.1. Abrir o Editor

1. Abra sua planilha do Google Sheets
2. Clique em **Extensões** > **Apps Script**
3. Uma nova aba abrirá com o editor

#### 1.2. Substituir o Código

1. **Delete TODO o código** que está no editor
2. Abra o arquivo **`google-apps-script-completo.js`** neste projeto
3. **Copie TODO o conteúdo** do arquivo
4. **Cole** no editor do Apps Script
5. Clique em **💾 Salvar** (ou Ctrl+S)

#### 1.3. Implantar

1. Clique em **Implantar** (botão azul no topo direito)
2. Selecione **Gerenciar implantações**
3. Se já existir uma implantação:
   - Clique no ícone **✏️ Editar**
   - Em **Versão**, selecione **Nova versão**
   - Descrição: `Sistema completo com envio de mensagens`
   - Clique em **Implantar**
4. Se for a primeira vez:
   - Clique em **Nova implantação**
   - Tipo: **Aplicativo da Web**
   - Descrição: `Sistema de triagem completo`
   - Executar como: **Eu**
   - Quem tem acesso: **Qualquer pessoa**
   - Clique em **Implantar**

#### 1.4. Copiar URL da Implantação

Após implantar, você verá uma URL como:
```
https://script.google.com/macros/s/AKfycbz...SEU_ID_AQUI.../exec
```

**COPIE ESTA URL!** Você vai precisar dela.

#### 1.5. Autorizar Permissões

Na primeira execução:
1. Clique em **Revisar permissões**
2. Escolha sua conta Google
3. Clique em **Avançado** (se aparecer aviso)
4. Clique em **Acessar [Nome do Projeto] (não seguro)**
5. Clique em **Permitir**

---

### Etapa 2: Configurar Variáveis de Ambiente

#### 2.1. Abrir arquivo .env

No projeto, abra o arquivo `.env` (na raiz do projeto)

#### 2.2. Atualizar URL do Google Script

Cole a URL que você copiou:

```env
VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/SEU_ID_AQUI/exec
```

**IMPORTANTE**: Substitua `SEU_ID_AQUI` pela URL real que você copiou!

#### 2.3. Verificar outras variáveis

O arquivo `.env` deve ter algo assim:

```env
# Supabase (para autenticação)
VITE_SUPABASE_URL=https://seuproject.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_aqui

# Google Apps Script (para mensagens e dados)
VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/SEU_ID/exec
```

---

### Etapa 3: Configurar Twilio (Para SMS)

**OPCIONAL**: Pule esta etapa se não quiser usar SMS

#### 3.1. Criar Conta no Twilio

1. Acesse: https://www.twilio.com/try-twilio
2. Preencha o formulário de cadastro
3. Verifique seu email e telefone
4. Você receberá **$15 USD gratuito**

#### 3.2. Obter Credenciais

No Dashboard do Twilio:

1. **Account SID**:
   - Copie de "Account Info" no dashboard
   - Exemplo: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

2. **Auth Token**:
   - Clique em "Show" para revelar
   - Copie o token
   - Exemplo: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

3. **Número Twilio**:
   - Vá em **Phone Numbers** > **Manage** > **Active Numbers**
   - Copie seu número no formato: `+15551234567`
   - Se não tiver, clique em **Buy a Number**

#### 3.3. Adicionar Credenciais no Apps Script

1. Volte ao editor do Google Apps Script
2. Clique no ícone **⚙️ Configurações** (à esquerda)
3. Role até **Propriedades do script**
4. Clique em **Adicionar propriedade do script**

Adicione estas 3 propriedades:

| Propriedade | Valor |
|-------------|-------|
| `TWILIO_SID` | Seu Account SID (AC...) |
| `TWILIO_TOKEN` | Seu Auth Token |
| `TWILIO_FROM` | Seu número Twilio (+155...) |

5. Clique em **Salvar propriedades do script**

#### 3.4. Verificar Número (Conta Trial)

**IMPORTANTE**: Na conta trial, você só pode enviar SMS para números verificados!

Para verificar um número:
1. No Twilio Dashboard, vá em **Phone Numbers** > **Verified Caller IDs**
2. Clique em **Add a new Caller ID**
3. Digite o número (com DDD, ex: +5511999999999)
4. Clique em **Call me** ou **Text me**
5. Digite o código recebido

---

### Etapa 4: Preparar a Planilha

#### 4.1. Adicionar Colunas Necessárias

No Google Apps Script:

1. No menu dropdown de funções (topo), selecione: `addStatusColumnIfNotExists`
2. Clique em **▶️ Executar**
3. Aguarde a conclusão (verifica logs em **Execuções**)

Isso adiciona automaticamente estas colunas na aba CANDIDATOS:
- Status
- Motivo Desclassificação
- Observações
- Data Triagem
- Analista
- **EMAIL**
- **TELEFONE**

#### 4.2. Preencher Dados de Teste

Na aba **CANDIDATOS**, adicione pelo menos um candidato de teste:

| CPF | NOMECOMPLETO | EMAIL | TELEFONE | CARGOPRETENDIDO |
|-----|--------------|-------|----------|-----------------|
| 12345678900 | Teste Sistema | seu@email.com | 11999999999 | Desenvolvedor |

**IMPORTANTE**:
- EMAIL: Use seu email real para testar
- TELEFONE: Se for testar SMS, use um número verificado no Twilio

---

### Etapa 5: Testar o Sistema

#### 5.1. Build e Deploy

No terminal do projeto:

```bash
npm run build
```

Aguarde: `✓ built in X.XXs`

#### 5.2. Testar Localmente

```bash
npm run dev
```

Acesse: `http://localhost:5173`

#### 5.3. Fazer Login

Use um dos emails cadastrados na aba **USUARIOS** da planilha:
- `admin@email.com`
- `analista@email.com`

(A senha não importa, pois usa Supabase)

#### 5.4. Testar Envio de Email

1. No sistema, vá para a lista de candidatos
2. Selecione o candidato de teste
3. Clique em **Enviar Mensagens**
4. Escolha **Email**
5. Selecione um template ou digite:
   - Assunto: `Teste de Email`
   - Conteúdo: `Olá [NOME], testando o sistema!`
6. Clique em **Enviar**
7. Verifique seu email

#### 5.5. Testar Envio de SMS (Opcional)

1. Selecione o candidato
2. Clique em **Enviar Mensagens**
3. Escolha **SMS**
4. Digite: `Olá [NOME], teste de SMS!`
5. Clique em **Enviar**
6. Verifique se recebeu o SMS

---

## 📊 Verificar Logs

### No Console do Navegador

Pressione **F12** e vá na aba **Console**

Você verá logs como:
```
📤 Enviando mensagens via Google Apps Script...
  Tipo: email
  Candidatos: 1
✅ Sucesso: 1
❌ Falhas: 0
```

### No Google Apps Script

1. Abra o editor do Apps Script
2. Clique em **Execuções** (ícone de relógio, à esquerda)
3. Clique na execução mais recente
4. Veja logs detalhados:

```
📤 sendMessages iniciado
📋 Total de candidatos alvo: 1
📧 Enviando email via Gmail
  Para: teste@email.com
  Assunto: Teste de Email
✅ Email enviado com sucesso
✅ Sucesso: 1
❌ Falhas: 0
```

### Na Planilha (Aba MENSAGENS)

Todas as mensagens enviadas aparecem automaticamente:

| Data/Hora | Número Inscrição | Tipo | Destinatário | Assunto | Conteúdo | Enviado Por | Status |
|-----------|-----------------|------|--------------|---------|----------|-------------|---------|
| 2024-11-12T... | 12345678900 | email | teste@email.com | Teste... | Olá Teste... | admin@email.com | enviado |

---

## ❌ Problemas Comuns

### Erro: "Script function not found"

**Causa**: Código não foi salvo ou implantado corretamente

**Solução**:
1. Volte ao Apps Script
2. Salve o código (Ctrl+S)
3. Reimplante (Nova versão)
4. Atualize a URL no `.env`

### Erro: "CORS policy"

**Causa**: URL do script incorreta ou não implantado como "Qualquer pessoa"

**Solução**:
1. Verifique a URL em `.env`
2. Na implantação, confirme "Quem tem acesso: **Qualquer pessoa**"
3. Reimplante se necessário

### Email não envia

**Erro comum**: "Exception: Service invoked too many times"

**Causa**: Limite diário do Gmail atingido
- Conta pessoal: 100 emails/dia
- Google Workspace: 1.500 emails/dia

**Solução**: Aguarde 24h ou use Google Workspace

### SMS não envia (Trial)

**Erro**: "Cannot send to unverified number"

**Causa**: Número não verificado na conta trial

**Solução**:
1. Verifique o número no Twilio (Etapa 3.4)
2. Ou faça upgrade para conta paga

### Erro: "Twilio não configurado"

**Causa**: Propriedades do script não foram salvas

**Solução**:
1. Volte ao Apps Script
2. ⚙️ Configurações > Propriedades do script
3. Adicione as 3 propriedades:
   - TWILIO_SID
   - TWILIO_TOKEN
   - TWILIO_FROM
4. **Salvar propriedades do script**

---

## ✅ Checklist de Configuração

Use este checklist para verificar se tudo está configurado:

- [ ] Código do Apps Script colado e salvo
- [ ] Apps Script implantado
- [ ] URL da implantação copiada
- [ ] URL adicionada no `.env`
- [ ] Permissões autorizadas no Google
- [ ] (Opcional) Conta Twilio criada
- [ ] (Opcional) Credenciais Twilio adicionadas
- [ ] (Opcional) Número de teste verificado
- [ ] Colunas adicionadas via `addStatusColumnIfNotExists()`
- [ ] Candidato de teste adicionado
- [ ] Build executado com sucesso
- [ ] Email de teste enviado e recebido
- [ ] (Opcional) SMS de teste enviado e recebido
- [ ] Logs verificados (console + Apps Script + planilha)

---

## 🎯 Resumo das URLs e Chaves Necessárias

### 1. Google Apps Script
```
URL da implantação:
https://script.google.com/macros/s/[SEU_ID]/exec

Onde adicionar: arquivo .env
Variável: VITE_GOOGLE_SCRIPT_URL
```

### 2. Twilio (Opcional - SMS)
```
Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Auth Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Número: +15551234567

Onde adicionar: Google Apps Script > Configurações > Propriedades
Variáveis:
- TWILIO_SID
- TWILIO_TOKEN
- TWILIO_FROM
```

### 3. Supabase (Já configurado)
```
URL: https://[seu-projeto].supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6...

Onde adicionar: arquivo .env (já deve estar lá)
Variáveis:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
```

---

## 📚 Próximos Passos

Após configurar tudo:

1. ✅ Teste com candidatos reais
2. ✅ Personalize os templates na aba TEMPLATES
3. ✅ Adicione mais motivos de desclassificação na aba MOTIVOS
4. ✅ Convide analistas (adicione emails na aba USUARIOS)
5. ✅ Monitore logs na aba MENSAGENS

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs no console do navegador (F12)
2. Verifique os logs no Apps Script (Execuções)
3. Consulte a documentação:
   - `SCRIPT_COMPLETO_README.md`
   - `CONFIGURAR_ENVIO_MENSAGENS_APPS_SCRIPT.md`
   - `CONFIRMACAO_GOOGLE_APPS_SCRIPT.md`

---

**Status**: ✅ Sistema pronto para uso!
