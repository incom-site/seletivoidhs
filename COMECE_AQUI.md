# 🎯 COMECE AQUI - Setup Completo em 15 Minutos

## ✅ O Que Este Sistema Faz

Sistema completo de **triagem de candidatos** com:
- ✅ Login admin e analista
- ✅ Classificação de candidatos
- ✅ Envio de emails
- ✅ Envio de SMS (opcional)
- ✅ Templates de mensagens
- ✅ Logs e relatórios

**Tudo funcionando com Google Sheets!**

---

## 🚀 Setup em 3 Passos

### PASSO 1: Google Apps Script (5 min)

```
1. Abrir: https://docs.google.com/spreadsheets/d/1iQSQ06P_OXkqxaGWN3uG5jRYFBKyjWqQyvzuGk2EplY
2. Extensões > Apps Script
3. DELETE todo código
4. Abrir arquivo: google-apps-script-final-corrigido.js
5. COPIAR todo conteúdo
6. COLAR no editor
7. Salvar (Ctrl+S)
8. Implantar > Nova implantação
   - Tipo: Aplicativo da Web
   - Executar como: Eu
   - Acesso: Qualquer pessoa
9. COPIAR URL (vai precisar!)
```

**URL será algo como:**
```
https://script.google.com/macros/s/AKfycbz...SEU_ID.../exec
```

---

### PASSO 2: Configurar Projeto (5 min)

#### 2.1. Atualizar .env
Abrir arquivo `.env` e colar sua URL:

```env
VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/SUA_URL_AQUI/exec
```

#### 2.2. Build
```bash
npm install
npm run build
```

Aguarde: `✓ built in X.XXs` ✅

---

### PASSO 3: Deploy (5 min)

#### Opção A: Netlify (Recomendado)
```bash
# Se usar Git
git add .
git commit -m "Sistema pronto"
git push

# Configure no Netlify:
# - Variável: VITE_GOOGLE_SCRIPT_URL
# - Redesenhar o site
```

**Detalhes:** Ver `DEPLOY_NETLIFY.md`

#### Opção B: Outro Host
```bash
# Upload da pasta dist/
```

---

## ✅ Testar

### Teste 1: URL do Script
Abra no navegador:
```
https://script.google.com/macros/s/SUA_URL/exec?action=test
```

**Deve retornar JSON:**
```json
{"success":true,"data":{"status":"OK",...}}
```

### Teste 2: Login
1. Acesse seu site
2. Login: `admin@email.com`
3. Senha: qualquer coisa
4. Deve entrar! ✅

---

## 📚 Documentação Completa

**Leia na ordem:**

### 1. Configuração Básica
- **CONFIGURACAO_APENAS_GOOGLE_SHEETS.md** ⭐ - Guia completo
- **GUIA_RAPIDO_CORRECAO.md** - Se algo der errado

### 2. Deploy
- **DEPLOY_NETLIFY.md** - Como fazer deploy

### 3. Solução de Problemas
- **SOLUCAO_DEFINITIVA_ERROS.md** - Resolver erros

### 4. Entender as Mudanças
- **MUDANCAS_SISTEMA.md** - O que mudou

---

## 🎯 Estrutura do Google Sheets

Sua planilha precisa destas abas:

### ABA: USUARIOS
```
Email               | Nome      | Role     | ID
admin@email.com     | Admin     | admin    | admin@email.com
analista@email.com  | Analista  | analista | analista@email.com
```

### ABA: CANDIDATOS
```
CPF         | NOMECOMPLETO | EMAIL          | TELEFONE    | Status | ...
12345678900 | João Silva   | joao@email.com | 11999999999 |        | ...
```

### ABA: MOTIVOS
```
ID   | Motivo                    | Ativo
M001 | Documentação incompleta   | Sim
M002 | Não atende requisitos     | Sim
```

### ABA: MENSAGENS
```
Data/Hora | Número Inscrição | Tipo  | Destinatário | ...
(logs automáticos de emails/SMS enviados)
```

### ABA: TEMPLATES
```
ID   | Nome                  | Tipo  | Assunto | Conteúdo
T001 | Classificado - Email  | email | ...     | ...
T002 | Classificado - SMS    | sms   |         | ...
```

---

## ⚙️ Adicionar Colunas na Planilha

Se sua planilha não tem todas as colunas:

```
1. No Apps Script
2. Selecionar função: addStatusColumnIfNotExists
3. Executar ▶️
4. Aguardar conclusão
```

Isso adiciona automaticamente:
- Status
- Motivo Desclassificação
- Observações
- Data Triagem
- Analista
- EMAIL
- TELEFONE

---

## 🔧 Configurações Opcionais

### SMS via Twilio (Opcional)

**Sem isso:** Emails funcionam normalmente
**Com isso:** Pode enviar SMS também

```
1. Criar conta: https://www.twilio.com/try-twilio
2. Pegar credenciais:
   - Account SID
   - Auth Token
   - Número Twilio
3. No Apps Script:
   ⚙️ Configurações > Propriedades do script
   Adicionar:
   - TWILIO_SID: seu SID
   - TWILIO_TOKEN: seu token
   - TWILIO_FROM: seu número
```

**Detalhes:** Ver `CONFIGURACAO_APENAS_GOOGLE_SHEETS.md`

---

## ❌ Problemas Comuns

### "URL do Google Script não configurada"
→ Verifique arquivo `.env`

### "Failed to fetch"
→ Teste a URL: `SUA_URL?action=test`
→ Se não funcionar, reimplante o script

### "CORS policy"
→ Script deve estar como "Qualquer pessoa"
→ Reimplante se necessário

### "Usuário não encontrado"
→ Adicione email na aba USUARIOS

### Email não envia
→ Limite Gmail: 100/dia (pessoal) ou 1500/dia (Workspace)

---

## 💡 Dicas

### Adicionar Usuários
Edite direto na aba USUARIOS do Google Sheets

### Importar Candidatos
Cole direto na aba CANDIDATOS (ou use CSV import no sistema)

### Personalizar Templates
Edite na aba TEMPLATES do Google Sheets

### Ver Logs
- Console do navegador (F12)
- Apps Script > Execuções
- Aba MENSAGENS na planilha

---

## 📊 Capacidade do Sistema

| Item | Limite |
|------|--------|
| Candidatos | ~10.000 |
| Usuários simultâneos | ~30 |
| Emails/dia | 100 (Gmail pessoal) |
| SMS/mês | Depende do Twilio |
| Custo | **R$ 0,00** (Gratuito!) |

---

## ✅ Checklist Completo

### Google Apps Script
- [ ] Código colado
- [ ] Salvo
- [ ] Implantado como "Aplicativo da Web"
- [ ] Acesso: "Qualquer pessoa"
- [ ] Permissões autorizadas
- [ ] URL copiada
- [ ] (Opcional) Função `addStatusColumnIfNotExists` executada

### Projeto
- [ ] Arquivo `.env` atualizado
- [ ] `npm install` executado
- [ ] `npm run build` com sucesso
- [ ] Deploy realizado

### Testes
- [ ] URL testada: `?action=test` retorna JSON
- [ ] Login funciona
- [ ] Candidatos aparecem
- [ ] Envio de email funciona
- [ ] (Opcional) SMS funciona

### Netlify (se usar)
- [ ] Variável `VITE_GOOGLE_SCRIPT_URL` configurada
- [ ] Site redesenhado após adicionar variável

---

## 🎉 Pronto para Usar!

**Seu sistema está configurado!**

**Próximos passos:**
1. ✅ Adicione analistas na aba USUARIOS
2. ✅ Importe candidatos na aba CANDIDATOS
3. ✅ Personalize templates na aba TEMPLATES
4. ✅ Comece a classificar!

---

## 🆘 Precisa de Ajuda?

1. **Erros?** → `SOLUCAO_DEFINITIVA_ERROS.md`
2. **Configuração?** → `CONFIGURACAO_APENAS_GOOGLE_SHEETS.md`
3. **Deploy?** → `DEPLOY_NETLIFY.md`
4. **Entender mudanças?** → `MUDANCAS_SISTEMA.md`

---

**Status:** ✅ Sistema pronto
**Build:** ✅ 4.91s
**Custo:** ✅ R$ 0,00 (Gratuito)
**Tempo setup:** ✅ ~15 minutos

**Boa triagem! 🎯**
