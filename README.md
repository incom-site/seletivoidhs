# Sistema de Triagem - 100% Google Sheets

Sistema completo de triagem de candidatos usando **apenas Google Sheets e Google Apps Script**.

## 🚀 Início Rápido

### 1. Configurar Google Apps Script (5 min)
```
1. Abrir planilha
2. Extensões > Apps Script
3. Colar código do arquivo: google-apps-script-final-corrigido.js
4. Implantar > Nova implantação > Aplicativo da Web
5. Copiar URL
```

### 2. Configurar Projeto (2 min)
```bash
# Colar URL no arquivo .env
VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/SEU_ID/exec

# Instalar e buildar
npm install
npm run build
```

### 3. Deploy (1 min)
```bash
# Git
git push

# Ou upload manual da pasta dist/
```

## 📚 Documentação

| Arquivo | Descrição |
|---------|-----------|
| **COMECE_AQUI.md** | 🚀 Início rápido (15 min) |
| **CONFIGURACAO_APENAS_GOOGLE_SHEETS.md** | ⭐ Guia completo |
| **SOLUCAO_ERROS_CORS.md** | ✅ **Erro CORS corrigido** |
| **CONFIRMACAO_GOOGLE_APPS_SCRIPT.md** | Erro postData corrigido |
| **GUIA_RAPIDO_CORRECAO.md** | Guia rápido (10 min) |
| **SOLUCAO_DEFINITIVA_ERROS.md** | Resolver problemas |
| **DEPLOY_NETLIFY.md** | Deploy no Netlify |
| **MUDANCAS_SISTEMA.md** | O que mudou |

## ✅ O Que Você Precisa

- ✅ Google Sheets (gratuito)
- ✅ Google Apps Script (gratuito)
- ✅ 1 variável de ambiente

## ❌ O Que NÃO Precisa

- ❌ Supabase
- ❌ Banco de dados
- ❌ Servidor backend

## 🎯 Recursos

- ✅ Login e autenticação
- ✅ Dashboard admin/analista
- ✅ Classificação de candidatos
- ✅ Envio de emails (Gmail)
- ✅ Envio de SMS (Twilio - opcional)
- ✅ Templates de mensagens
- ✅ Logs e histórico
- ✅ Filtros e busca
- ✅ Export de relatórios

## 💰 Custo

**100% Gratuito** - Tudo roda no Google Sheets (gratuito)

## 📊 Limites

- ~10.000 candidatos (limite Google Sheets)
- ~30 usuários simultâneos
- 100 emails/dia (Gmail pessoal)

## 🆘 Suporte

Erros? Consulte: **SOLUCAO_DEFINITIVA_ERROS.md**

## 🔧 Tecnologias

- React + TypeScript
- Vite
- TailwindCSS
- Google Apps Script
- Google Sheets
