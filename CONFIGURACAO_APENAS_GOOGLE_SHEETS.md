# ✅ Sistema 100% Google Sheets + Google Apps Script

## 🎯 Configuração Simplificada

O sistema agora usa **APENAS Google Sheets e Google Apps Script**. Nenhum banco de dados externo é necessário!

---

## 📋 O Que Foi Removido

- ❌ Supabase (banco de dados)
- ❌ Dependências do @supabase/supabase-js
- ❌ Funções Edge do Supabase
- ❌ Configurações de RLS e migrações

---

## ✅ O Que Você Precisa

### 1. Google Sheets
- Planilha com ID: `1iQSQ06P_OXkqxaGWN3uG5jRYFBKyjWqQyvzuGk2EplY`
- Abas necessárias:
  - **USUARIOS** - Dados de login (email, nome, role)
  - **CANDIDATOS** - Lista de candidatos
  - **MOTIVOS** - Motivos de desclassificação
  - **MENSAGENS** - Log de mensagens enviadas
  - **TEMPLATES** - Templates de email/SMS

### 2. Google Apps Script
- Script implantado como "Aplicativo da Web"
- Acesso configurado como "Qualquer pessoa"
- URL da implantação no formato:
  ```
  https://script.google.com/macros/s/[ID]/exec
  ```

### 3. Variável de Ambiente
- Apenas **1 variável** necessária:
  ```env
  VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/SEU_ID/exec
  ```

---

## 🚀 Configuração Rápida (15 minutos)

### PASSO 1: Configurar Google Apps Script (10 min)

#### 1.1. Abrir Editor
1. Acesse sua planilha: https://docs.google.com/spreadsheets/d/1iQSQ06P_OXkqxaGWN3uG5jRYFBKyjWqQyvzuGk2EplY
2. **Extensões** > **Apps Script**

#### 1.2. Colar Código
1. **Delete TODO o código** existente (Ctrl+A, Delete)
2. Abra o arquivo `google-apps-script-final-corrigido.js`
3. **Copie TODO** o conteúdo
4. **Cole** no editor
5. **Salve** (Ctrl+S ou ícone 💾)

#### 1.3. Implantar
1. **Implantar** > **Nova implantação**
2. Tipo: **Aplicativo da Web**
3. Configurações:
   - Descrição: `Sistema de Triagem`
   - Executar como: **Eu**
   - Quem tem acesso: **Qualquer pessoa**
4. **Implantar**
5. **Autorizar** permissões quando solicitado
6. **COPIAR** a URL da implantação

#### 1.4. Adicionar Colunas (Opcional)
Se a planilha não tiver as colunas corretas:

1. No editor Apps Script
2. Selecionar função: `addStatusColumnIfNotExists`
3. Clicar em **▶️ Executar**

Isso adiciona automaticamente:
- Status
- Motivo Desclassificação
- Observações
- Data Triagem
- Analista
- EMAIL
- TELEFONE

---

### PASSO 2: Configurar Projeto (3 min)

#### 2.1. Atualizar .env
No arquivo `.env` na raiz do projeto:

```env
# Google Apps Script URL
VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/SUA_URL_AQUI/exec
```

**Substitua pela URL que você copiou!**

#### 2.2. Build
```bash
npm install
npm run build
```

Aguarde: `✓ built in X.XXs`

---

### PASSO 3: Deploy (2 min)

#### Opção A: Deploy Automático (Git)
```bash
git add .
git commit -m "Sistema 100% Google Sheets"
git push
```

#### Opção B: Deploy Manual (Netlify)
1. Acesse https://app.netlify.com
2. Escolha seu site
3. Arraste a pasta `dist`

**IMPORTANTE**: Configurar variável no Netlify:
1. **Site configuration** > **Environment variables**
2. Adicionar:
   - Key: `VITE_GOOGLE_SCRIPT_URL`
   - Value: `https://script.google.com/macros/s/SUA_URL/exec`
3. **Redesenhar** o site (Clear cache)

---

## 🔧 Como Funciona

### Autenticação
- **Login**: Busca email na aba USUARIOS do Google Sheets
- **Senha**: Não é validada (qualquer senha funciona)
- **Sessão**: Salva no localStorage do navegador
- **Roles**: Admin ou Analista (definido na planilha)

### Dados dos Candidatos
- **Origem**: Aba CANDIDATOS no Google Sheets
- **Busca**: Via Google Apps Script
- **Filtros**: Processados no Apps Script
- **Cache**: Implementado no Apps Script (20 min)

### Envio de Mensagens
- **Email**: Via GmailApp (Gmail do usuário do script)
- **SMS**: Via Twilio (configuração opcional)
- **Log**: Registrado na aba MENSAGENS
- **Templates**: Lidos da aba TEMPLATES

### Classificação
- **Status**: Gravado diretamente na planilha
- **Motivos**: Buscados da aba MOTIVOS
- **Histórico**: Mantido na planilha

---

## 📊 Estrutura das Abas

### ABA: USUARIOS
| Email | Nome | Role | ID |
|-------|------|------|-----|
| admin@email.com | Admin | admin | admin@email.com |
| analista@email.com | Analista | analista | analista@email.com |

**Campos obrigatórios:**
- Email (usado no login)
- Role (admin ou analista)

### ABA: CANDIDATOS
Colunas mínimas necessárias:
- CPF (ID único)
- NOMECOMPLETO
- EMAIL (para envio de emails)
- TELEFONE (para envio de SMS)
- Status
- Motivo Desclassificação
- Observações
- Data Triagem
- Analista

### ABA: MOTIVOS
| ID | Motivo | Ativo |
|----|--------|-------|
| M001 | Documentação incompleta | Sim |
| M002 | Não atende requisitos | Sim |

### ABA: MENSAGENS
| Data/Hora | Número Inscrição | Tipo | Destinatário | Assunto | Conteúdo | Enviado Por | Status |
|-----------|------------------|------|--------------|---------|----------|-------------|---------|
| 2024-11-12... | 12345678900 | email | teste@email.com | ... | ... | admin@email.com | enviado |

### ABA: TEMPLATES
| ID | Nome | Tipo | Assunto | Conteúdo |
|----|------|------|---------|----------|
| T001 | Classificado - Email | email | Parabéns! | Olá [NOME]... |
| T002 | Classificado - SMS | sms | | Parabéns [NOME]! |

---

## ✅ Testar Sistema

### Teste 1: Conexão
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

### Teste 2: Login
1. Acesse seu site
2. Faça login com: `admin@email.com`
3. Senha: qualquer coisa
4. Deve entrar no sistema

### Teste 3: Listar Candidatos
1. No sistema, vá para lista de candidatos
2. Deve aparecer os candidatos da planilha

### Teste 4: Enviar Email
1. Selecione um candidato
2. Clique em **Enviar Mensagens**
3. Escolha **Email**
4. Preencha e envie
5. Verifique:
   - Email recebido
   - Log na aba MENSAGENS

---

## 🔧 Configuração Avançada (Opcional)

### Habilitar SMS via Twilio

#### 1. Criar Conta Twilio
1. Acesse: https://www.twilio.com/try-twilio
2. Cadastre-se (ganha $15 USD grátis)
3. Anote:
   - Account SID
   - Auth Token
   - Número Twilio

#### 2. Adicionar no Apps Script
1. No editor Apps Script
2. **⚙️ Configurações** > **Propriedades do script**
3. Adicionar 3 propriedades:

| Propriedade | Valor |
|-------------|-------|
| TWILIO_SID | Seu Account SID |
| TWILIO_TOKEN | Seu Auth Token |
| TWILIO_FROM | Seu número (+15551234567) |

4. **Salvar**

#### 3. Verificar Números (Conta Trial)
Na conta trial, só envia para números verificados:
1. Twilio Dashboard > **Verified Caller IDs**
2. **Add new Caller ID**
3. Digite número (+5511999999999)
4. Receba código e valide

---

## ❌ Problemas Comuns

### Erro: "URL do Google Script não configurada"
**Solução**: Verifique o arquivo `.env` e certifique-se que `VITE_GOOGLE_SCRIPT_URL` está preenchida

### Erro: "Failed to fetch"
**Solução**:
1. Teste a URL diretamente: `SUA_URL?action=test`
2. Se não funcionar, reimplante o script
3. Certifique-se: "Quem tem acesso: **Qualquer pessoa**"

### Erro: "CORS policy"
**Solução**:
1. Reimplante o script com código atualizado
2. Verifique: "Quem tem acesso: **Qualquer pessoa**"
3. Limpe cache do navegador

### Erro: "Usuário não encontrado"
**Solução**: Verifique se o email existe na aba USUARIOS da planilha

### Email não envia
**Limites do Gmail**:
- Conta pessoal: 100 emails/dia
- Google Workspace: 1.500 emails/dia

**Solução**: Aguarde 24h ou use Google Workspace

### SMS não envia
**Twilio não configurado**: Configure conforme "Configuração Avançada"
**Conta trial**: Só envia para números verificados

---

## 📈 Vantagens desta Arquitetura

### ✅ Prós
- **Gratuito**: Google Sheets é gratuito
- **Simples**: Apenas 1 URL para configurar
- **Visual**: Dados visíveis na planilha
- **Backup**: Google faz backup automaticamente
- **Colaboração**: Múltiplos usuários na planilha
- **Sem servidor**: Zero custo de infraestrutura

### ⚠️ Limitações
- **Escala**: Até ~10.000 candidatos (limite Google Sheets)
- **Velocidade**: Mais lento que banco de dados
- **Concorrência**: Limite de 30 requisições simultâneas
- **Cache**: TTL de 20 minutos

### 🎯 Ideal Para
- Processos seletivos pequenos/médios (< 5.000 candidatos)
- Equipes pequenas (< 10 usuários simultâneos)
- Orçamento limitado
- Necessidade de visualizar/editar dados na planilha

---

## 📋 Checklist de Configuração

- [ ] Google Apps Script implantado
- [ ] Código `google-apps-script-final-corrigido.js` colado
- [ ] Tipo: Aplicativo da Web
- [ ] Acesso: Qualquer pessoa
- [ ] Permissões autorizadas
- [ ] URL copiada
- [ ] Arquivo `.env` atualizado com URL
- [ ] Build executado com sucesso
- [ ] Deploy realizado
- [ ] Teste de conexão OK (`?action=test`)
- [ ] Login funcionando
- [ ] Candidatos listando
- [ ] (Opcional) Twilio configurado para SMS

---

## 🎉 Sistema Pronto!

Tudo configurado! Agora você tem um sistema completo de triagem usando apenas Google Sheets.

**Arquivos importantes:**
- `google-apps-script-final-corrigido.js` - Script para colar no Apps Script
- `GUIA_RAPIDO_CORRECAO.md` - Guia rápido se algo der errado
- `SOLUCAO_DEFINITIVA_ERROS.md` - Solução de problemas detalhada

**Próximos passos:**
1. Adicione usuários na aba USUARIOS
2. Importe candidatos na aba CANDIDATOS
3. Personalize templates na aba TEMPLATES
4. Configure SMS (opcional) via Twilio

**Suporte:**
- Logs no console do navegador (F12)
- Logs no Apps Script (Execuções)
- Dados na planilha são a fonte da verdade

---

**Status**: ✅ Build concluído (5.08s)
**Dependências**: ✅ Supabase removido
**Sistema**: ✅ 100% Google Sheets
