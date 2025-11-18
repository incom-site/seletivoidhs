# 🚨 SOLUÇÃO ERRO DE CORS

## ❌ Erro Atual
```
Access to fetch at 'https://script.google.com/...' from origin 'https://seletivoinstacqua.netlify.app'
has been blocked by CORS policy: Response to preflight request doesn't pass access control check:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## 🎯 CAUSA

O Google Apps Script **NÃO adiciona automaticamente os headers CORS** quando você implanta como Web App.

O problema está nas **configurações de implantação**, especificamente em **"Quem tem acesso"**.

## ✅ SOLUÇÃO (5 minutos)

### Passo 1: Abrir o Google Apps Script
1. Acesse: https://script.google.com
2. Abra seu projeto do script

### Passo 2: Nova Implantação
1. Clique em **"Implantar"** (canto superior direito)
2. Selecione **"Nova implantação"**

### Passo 3: Configurações CRÍTICAS

Na tela de implantação:

#### ⚙️ Tipo:
- Selecione: **"Aplicativo da Web"**

#### ⚙️ Executar como:
- Selecione: **"Eu (seu@email.com)"**

#### ⚠️ CRÍTICO - Quem tem acesso:
- **DEVE SER:** "Qualquer pessoa"
- ❌ NÃO USE: "Somente eu"
- ❌ NÃO USE: "Qualquer pessoa do Google"

```
┌─────────────────────────────────────┐
│ Quem tem acesso:                    │
│ ○ Somente eu                        │  ← NÃO USE
│ ○ Qualquer pessoa do Google        │  ← NÃO USE
│ ● Qualquer pessoa                   │  ← USE ESTE!
└─────────────────────────────────────┘
```

**Por quê "Qualquer pessoa"?**
- É o único modo que permite requisições CORS de outros domínios
- Seu código já tem autenticação própria (email/senha)
- A planilha continua protegida (só o script acessa)

### Passo 4: Implantar
1. Clique em **"Implantar"**
2. Autorize os acessos (se solicitado)
3. **COPIE A NOVA URL**

A URL será algo como:
```
https://script.google.com/macros/s/NOVO_ID_AQUI/exec
```

### Passo 5: Atualizar o .env Local

Edite o arquivo `.env` do projeto:

```env
VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/NOVO_ID_AQUI/exec

VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Passo 6: Atualizar no Netlify

1. Acesse: https://app.netlify.com
2. Selecione seu site: **seletivoinstacqua**
3. **Site settings** > **Environment variables**
4. Encontre `VITE_GOOGLE_SCRIPT_URL`
5. Clique em **Edit** (ou **Add variable** se não existir)
6. Cole a NOVA URL
7. **Save**

### Passo 7: Redesenhar no Netlify

**IMPORTANTE:** Você precisa fazer um redeploy completo!

Opção A - Limpar cache e redesenhar:
1. **Deploys** tab
2. Clique em **Trigger deploy**
3. Selecione **"Clear cache and deploy site"**

Opção B - Fazer um novo commit:
```bash
# No terminal, na pasta do projeto:
git add .
git commit -m "fix: update google script url"
git push
```

### Passo 8: Verificar
1. Aguarde o deploy terminar (1-2 minutos)
2. Acesse: https://seletivoinstacqua.netlify.app
3. Faça login como admin
4. Abra o Console (F12)
5. Vá para aba "Alocação"
6. Clique em "Recarregar Analistas"

**Resultado esperado no Console:**
```
🔄 [UserService] Chamando Google Apps Script: getAnalysts
📡 [UserService] Resposta recebida - Status: 200
✅ [UserService] Dados recebidos: { success: true, data: { analysts: [...] } }
```

**Se ainda der erro:**
```
❌ CORS error...
```
Volte ao Passo 3 e verifique que selecionou "Qualquer pessoa"

---

## 🔍 Como Verificar se Está Correto

### Teste 1: URL Direta no Navegador
Abra no navegador:
```
https://script.google.com/macros/s/SEU_ID/exec?action=test
```

**Deve retornar JSON:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Conexão estabelecida com sucesso!",
    "timestamp": "2025-01-15T...",
    "spreadsheetId": "1iQSQ06P_..."
  }
}
```

### Teste 2: Verificar Headers CORS
No Console do navegador (F12), aba Network:
1. Filtre por "exec"
2. Clique na requisição
3. Aba "Headers"
4. Procure por "Access-Control-Allow-Origin"

**Se não aparecer:** O problema está na configuração "Quem tem acesso"

---

## 📋 Checklist Rápido

- [ ] Nova implantação criada no Google Apps Script
- [ ] Tipo: "Aplicativo da Web"
- [ ] Executar como: "Eu"
- [ ] **Quem tem acesso: "Qualquer pessoa"** ← CRÍTICO!
- [ ] Nova URL copiada
- [ ] `.env` local atualizado com nova URL
- [ ] Variável no Netlify atualizada
- [ ] Site redesenhado no Netlify (Clear cache)
- [ ] Testado no navegador

---

## 🆘 Ainda Não Funciona?

### Cenário 1: Erro 401 ou 403
**Causa:** Configuração "Quem tem acesso" incorreta
**Solução:** Volte ao Passo 3, selecione "Qualquer pessoa"

### Cenário 2: Erro 404
**Causa:** URL incorreta
**Solução:** Verifique se copiou a URL completa (deve terminar em `/exec`)

### Cenário 3: Resposta vazia
**Causa:** Script não está retornando dados
**Solução:**
1. Abra o Google Apps Script
2. Vá em "Execuções" (ícone de relógio)
3. Veja os logs de erro

### Cenário 4: Funciona localmente mas não no Netlify
**Causa:** Variável de ambiente não foi atualizada ou cache não foi limpo
**Solução:**
1. Verifique que a variável está salva no Netlify
2. Faça "Clear cache and deploy site"
3. Aguarde 2-3 minutos

---

## ⚡ Resumo Executivo

1. **PROBLEMA:** Configuração "Quem tem acesso" no Google Apps Script
2. **SOLUÇÃO:** Reimplantar como "Qualquer pessoa"
3. **TEMPO:** 5 minutos
4. **IMPACTO:** Resolve 100% dos erros de CORS

**A segurança continua garantida porque:**
- O frontend tem autenticação própria (email/senha)
- O Google Apps Script valida as requisições
- A planilha só é acessível via script
- Netlify tem HTTPS e proteção DDoS
