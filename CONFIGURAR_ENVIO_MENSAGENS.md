# Configuração de Envio de Mensagens (Email e SMS)

Este guia explica como configurar o sistema de envio de emails e SMS para o sistema de triagem de candidatos.

---

## Visão Geral

O sistema utiliza:
- **Resend** para envio de emails
- **Twilio** para envio de SMS
- **Edge Functions do Supabase** para processar as requisições

---

## 1. Configurar Resend (Email)

### 1.1. Criar Conta no Resend

1. Acesse [https://resend.com](https://resend.com)
2. Clique em "Sign Up" e crie sua conta
3. Confirme seu email

### 1.2. Obter API Key

1. Após login, vá em **API Keys**
2. Clique em **Create API Key**
3. Dê um nome (ex: "Sistema Triagem")
4. Copie a API Key gerada (começa com `re_`)

### 1.3. Configurar Domínio (Opcional mas Recomendado)

1. Vá em **Domains**
2. Clique em **Add Domain**
3. Digite seu domínio (ex: `seudominio.com`)
4. Adicione os registros DNS conforme instruções do Resend
5. Aguarde verificação (pode levar até 48h)

**Nota**: Sem domínio configurado, você pode usar o domínio de teste do Resend, mas com limitações.

### 1.4. Atualizar Edge Function

Edite o arquivo `supabase/functions/send-email/index.ts`:

```typescript
// Linha 84 - Altere para seu domínio
from: "Processo Seletivo <noreply@seudominio.com>",
```

Se não tiver domínio, use:
```typescript
from: "onboarding@resend.dev", // Email de teste do Resend
```

---

## 2. Configurar Twilio (SMS)

### 2.1. Criar Conta no Twilio

1. Acesse [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Crie sua conta gratuitamente
3. Confirme seu email e telefone

### 2.2. Obter Credenciais

1. No Dashboard do Twilio, localize:
   - **Account SID** (começa com `AC...`)
   - **Auth Token** (clique em "Show" para visualizar)
2. Copie ambos os valores

### 2.3. Obter Número de Telefone

#### Conta Trial (Gratuita):
1. No Dashboard, vá em **Phone Numbers** > **Manage** > **Buy a number**
2. Selecione um número dos EUA (gratuito na trial)
3. Marque a opção **SMS**
4. Clique em **Buy**

**Limitações da Conta Trial**:
- Só envia SMS para números verificados
- Mensagens têm prefixo "Sent from your Twilio trial account"
- Crédito limitado (~$15 USD)

#### Para Produção (Números Brasileiros):
1. Faça upgrade da conta
2. Complete verificação de identidade
3. Compre número brasileiro (+55)

### 2.4. Verificar Números (Conta Trial)

Para testar com conta trial, você precisa verificar os números de destino:

1. No Dashboard, vá em **Phone Numbers** > **Manage** > **Verified Caller IDs**
2. Clique em **Add a new Caller ID**
3. Digite o número brasileiro no formato: `+5511999999999`
4. Complete a verificação por SMS

---

## 3. Configurar Variáveis de Ambiente no Supabase

### 3.1. Acessar Configurações de Edge Functions

1. Acesse o Dashboard do Supabase
2. Vá em **Edge Functions** no menu lateral
3. Clique em **Manage secrets**

### 3.2. Adicionar Variáveis

Adicione as seguintes secrets:

#### Para Email (Resend):
```
RESEND_API_KEY=re_sua_api_key_aqui
```

#### Para SMS (Twilio):
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=seu_auth_token_aqui
TWILIO_PHONE_NUMBER=+15551234567
```

#### Para Google Sheets (Opcional):
```
GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/seu_id_aqui/exec
```

### 3.3. Salvar Secrets

Clique em **Save** após adicionar cada secret.

---

## 4. Implantar Edge Functions

### 4.1. Verificar se as Functions Existem

As Edge Functions já foram criadas:
- `supabase/functions/send-email/index.ts`
- `supabase/functions/send-sms/index.ts`

### 4.2. Deploy via Supabase CLI (Opcional)

Se você tiver o Supabase CLI instalado:

```bash
# Deploy send-email
supabase functions deploy send-email

# Deploy send-sms
supabase functions deploy send-sms
```

### 4.3. Deploy via Dashboard

As Edge Functions serão implantadas automaticamente quando você fizer push para produção.

---

## 5. Testar o Sistema

### 5.1. Testar Email

1. Faça login no sistema como admin
2. Selecione candidatos na lista
3. Clique em **Enviar Mensagens**
4. Escolha **Email**
5. Selecione um template ou digite uma mensagem
6. Clique em **Enviar**

### 5.2. Testar SMS

1. Certifique-se de que os candidatos têm telefone cadastrado
2. **IMPORTANTE**: O telefone deve estar no formato:
   - `(11) 99999-9999`
   - `11999999999`
   - `+5511999999999`
3. Selecione candidatos
4. Clique em **Enviar Mensagens**
5. Escolha **SMS**
6. Digite uma mensagem curta (max 160 caracteres recomendado)
7. Clique em **Enviar**

### 5.3. Verificar Logs

Abra o Console do Navegador (F12) para ver logs detalhados:
- ✅ Mensagens enviadas com sucesso
- ❌ Erros e motivos de falha

---

## 6. Custos e Limites

### Resend (Email)

**Plano Gratuito**:
- 100 emails/dia
- 3.000 emails/mês
- Domínio verificado necessário para volume maior

**Planos Pagos**:
- A partir de $20/mês para 50.000 emails

### Twilio (SMS)

**Conta Trial**:
- ~$15 USD de crédito gratuito
- Apenas números verificados
- Mensagem com prefixo de trial

**Conta Produção**:
- SMS Brasil: ~$0.045 USD por mensagem
- Número brasileiro: ~$2 USD/mês

---

## 7. Solução de Problemas

### Email não enviado

**Erro: "Serviço de email não configurado"**
- Verifique se `RESEND_API_KEY` está configurada no Supabase

**Erro: "Formato de email inválido"**
- Verifique se o email do candidato está correto

**Erro: "Domain not found"**
- Configure um domínio no Resend ou use `onboarding@resend.dev`

### SMS não enviado

**Erro: "Serviço de SMS não configurado"**
- Verifique se todas as 3 variáveis do Twilio estão configuradas

**Erro: "Formato de telefone inválido"**
- O número deve ter 10-11 dígitos: `(11) 99999-9999`

**Erro: "Cannot send SMS to unverified number" (Conta Trial)**
- Verifique o número de destino no Twilio Dashboard

**Erro: "Invalid 'From' phone number"**
- Verifique se `TWILIO_PHONE_NUMBER` está no formato `+15551234567`

---

## 8. Formatos de Telefone Aceitos

O sistema aceita e normaliza automaticamente:

✅ `(11) 99999-9999`
✅ `11 99999-9999`
✅ `11999999999`
✅ `+5511999999999`

Todos são convertidos para o formato E.164: `+5511999999999`

---

## 9. Variáveis de Template

Ao criar mensagens, você pode usar:

- `[NOME]` - Nome completo do candidato
- `[CARGO]` - Cargo pretendido
- `[AREA]` - Área de atuação

Exemplo:
```
Olá [NOME],

Você foi classificado para a vaga de [CARGO] na área [AREA].

Aguarde contato para próximas etapas.
```

---

## 10. Registro de Mensagens

Todas as mensagens enviadas são registradas:
- Na aba **MENSAGENS** do Google Sheets (se configurado)
- Nos logs das Edge Functions (Supabase Dashboard)

Para visualizar:
1. Supabase Dashboard > **Edge Functions**
2. Clique em **send-email** ou **send-sms**
3. Veja os logs de execução

---

## 11. Próximos Passos

1. Configure as credenciais do Resend e Twilio
2. Adicione as secrets no Supabase
3. Teste com candidatos de exemplo
4. Ajuste os templates de mensagem conforme necessário
5. Monitore os custos e limites de uso

---

## Suporte

Se tiver problemas:
1. Verifique os logs no Console do navegador (F12)
2. Verifique os logs das Edge Functions no Supabase
3. Revise as credenciais e secrets configuradas
4. Consulte a documentação oficial:
   - [Resend Docs](https://resend.com/docs)
   - [Twilio Docs](https://www.twilio.com/docs)
