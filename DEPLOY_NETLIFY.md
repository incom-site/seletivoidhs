# 🚀 Deploy no Netlify

## Configuração Rápida

### 1. Criar Conta (se não tiver)
https://app.netlify.com/signup

### 2. Conectar Repositório

#### Opção A: Via Git (Recomendado)
1. Acesse https://app.netlify.com
2. **Add new site** > **Import an existing project**
3. Escolha: **GitHub** / **GitLab** / **Bitbucket**
4. Autorize o Netlify
5. Escolha o repositório
6. Configure:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
7. **Deploy site**

#### Opção B: Via Drag & Drop
1. Acesse https://app.netlify.com
2. Arraste a pasta **`dist/`** para o upload
3. Pronto!

---

## ⚙️ Configurar Variável de Ambiente

**IMPORTANTE**: O Netlify precisa da URL do Google Apps Script!

### Passo a Passo:

1. No Netlify, acesse seu site
2. **Site configuration** > **Environment variables**
3. Clique em **Add a variable**
4. Configure:

| Key | Value | Scopes |
|-----|-------|--------|
| `VITE_GOOGLE_SCRIPT_URL` | `https://script.google.com/macros/s/SEU_ID/exec` | Production, Deploy previews, Branch deploys |

5. **Save**

### ⚠️ DEPOIS de adicionar a variável:

**Você DEVE redesenhar o site!**

1. Vá em **Deploys**
2. **Trigger deploy** > **Clear cache and deploy site**
3. Aguarde o deploy

**Por quê?** Variáveis de ambiente são injetadas no build. Sem redesenhar, o site não terá a variável!

---

## 🔄 Deploy Automático

Se conectou via Git (Opção A):

```bash
git add .
git commit -m "Atualizar sistema"
git push
```

O Netlify faz deploy automaticamente! 🎉

---

## 🌐 Domínio Personalizado (Opcional)

### Usar Domínio do Netlify
URL gerada automaticamente:
```
https://seu-site.netlify.app
```

### Usar Domínio Próprio
1. **Domain management** > **Add domain**
2. Digite seu domínio: `seudominio.com`
3. Siga instruções para configurar DNS
4. Aguarde propagação (~24h)

---

## 📝 Arquivo netlify.toml

Já existe no projeto! Conteúdo:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**O que faz:**
- Define comando de build
- Define pasta de publicação
- Redireciona todas rotas para index.html (SPA)

---

## ✅ Verificar Deploy

### 1. Build Logs
1. Acesse **Deploys**
2. Clique no deploy mais recente
3. Veja os logs

**Procure por:**
```
✓ built in X.XXs
```

### 2. Testar Site
1. Acesse a URL do site
2. Tente fazer login
3. Abra o Console (F12)
4. Verifique se há erros

**Erros comuns:**
- ❌ Variável `VITE_GOOGLE_SCRIPT_URL` não configurada
- ❌ Site não redesenhado após adicionar variável
- ❌ URL do Google Script incorreta

---

## 🔧 Solução de Problemas

### Erro: "URL do Google Script não configurada"

**Causa:** Variável de ambiente não configurada no Netlify

**Solução:**
1. **Site configuration** > **Environment variables**
2. Adicionar `VITE_GOOGLE_SCRIPT_URL`
3. **Trigger deploy** > **Clear cache and deploy site**

---

### Erro: "Failed to fetch"

**Causa:** URL do Google Script incorreta ou CORS

**Solução:**
1. Testar URL diretamente: `SUA_URL?action=test`
2. Se não funcionar:
   - Reimplantar Google Apps Script
   - Certifique-se: "Quem tem acesso: **Qualquer pessoa**"
3. Atualizar URL no Netlify
4. Redesenhar site

---

### Deploy com erro

**Procure no log por:**
```
npm ERR!
```

**Soluções comuns:**
```bash
# Limpar e reinstalar
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

### Site carrega mas não funciona

**Verifique:**
1. Console do navegador (F12) - erros?
2. Variável de ambiente configurada?
3. Site redesenhado após adicionar variável?
4. URL do Google Script funciona?

---

## 📊 Monitoramento

### Analytics (Opcional)
1. **Integrations** > **Analytics**
2. Escolha provider (Google Analytics, etc)
3. Adicione tracking ID

### Functions (Não usado)
Este projeto não usa Netlify Functions. Tudo roda no Google Apps Script!

### Forms (Não usado)
Este projeto não usa Netlify Forms. Candidatos vêm do Google Sheets!

---

## 💰 Planos Netlify

### Free Plan (Grátis)
✅ Perfeito para este projeto!
- 100 GB bandwidth/mês
- Builds ilimitados
- Deploy automático
- HTTPS grátis
- Domínio customizado

### Pro Plan ($19/mês)
Só necessário se:
- Mais de 100 GB bandwidth/mês
- Precisa de autenticação Netlify Identity
- Precisa de mais build minutes

**Para este projeto: FREE é suficiente! 🎉**

---

## ✅ Checklist Deploy

- [ ] Código no Git (se usar Opção A)
- [ ] Build local funciona: `npm run build`
- [ ] Site criado no Netlify
- [ ] Variável `VITE_GOOGLE_SCRIPT_URL` configurada
- [ ] Site redesenhado após adicionar variável
- [ ] Deploy com sucesso (✓ built in X.XXs)
- [ ] Site acessível via URL
- [ ] Login funciona
- [ ] Candidatos aparecem
- [ ] Console sem erros

---

## 🎉 Pronto!

Seu sistema está no ar!

**URL do site:**
```
https://seu-site.netlify.app
```

**Próximos passos:**
1. Testar todas as funcionalidades
2. Adicionar usuários na planilha
3. Importar candidatos
4. Compartilhar URL com equipe

---

**Dúvidas?** Consulte: `SOLUCAO_DEFINITIVA_ERROS.md`
