# Problemas Identificados - Sistema de Analistas

## 🔴 PROBLEMA CRÍTICO: URL do Google Apps Script Não Configurada

### Problema
O arquivo `.env` **NÃO TEM** a variável `VITE_GOOGLE_SCRIPT_URL` configurada.

Conteúdo atual do `.env`:
```env
VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Faltando:**
```env
VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/SEU_ID/exec
```

### Consequência
Quando `VITE_GOOGLE_SCRIPT_URL` não está configurada, o sistema usa URLs padrão hardcoded no código:

1. **userService.ts** (linha 62):
   ```typescript
   const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL ||
     'https://script.google.com/macros/s/AKfycbwRZ7vLEm4n8iha2GJSnIfCEjhHejRLme-OkIkp_qu6/dev';
   ```

2. **candidateService.ts** (linha 50):
   ```typescript
   this.scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL ||
     'https://script.google.com/macros/s/AKfycbwRZ7vLEm4n8iha2GJSnIfCEjhHejRLme-OkIkp_qu6/dev';
   ```

3. **AuthContext.tsx** (linha 134):
   ```typescript
   const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL ||
     'https://script.google.com/macros/s/AKfycbwRZ7vLEm4n8iha2GJSnIfCEjhHejRLme-OkIkp_qu6/dev';
   ```

**Essas URLs padrão provavelmente não são a URL do seu Google Apps Script!**

### ✅ Solução

#### Passo 1: Obter a URL do Google Apps Script
1. Abra o Google Apps Script
2. Vá em **Implantar** > **Gerenciar implantações**
3. Copie a URL da implantação (deve terminar com `/exec`)

#### Passo 2: Adicionar no .env
Edite o arquivo `.env` e adicione:
```env
VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/SUA_URL_AQUI/exec

VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Passo 3: Rebuild e Deploy
```bash
npm run build
```

#### Passo 4: Se usar Netlify
Adicione a variável de ambiente no Netlify:
- Site settings > Environment variables
- Add a variable
  - Key: `VITE_GOOGLE_SCRIPT_URL`
  - Value: `https://script.google.com/macros/s/SUA_URL_AQUI/exec`
- Redesenhar o site

---

## 🟡 Outros Problemas Potenciais

### 1. URLs Inconsistentes no Código

Há 3 URLs padrão diferentes no código:

**userService.ts e candidateService.ts:**
```
AKfycbwRZ7vLEm4n8iha2GJSnIfCEjhHejRLme-OkIkp_qu6/dev
```

**googleSheets.ts:**
```
AKfycbxfl0gWq3-dnZmYcz5AIHkpOyC1XdRb8QdaMRQTQZnn5sqyQZvV3qhCevhXuFHGYBk0/exec
```

**Solução:** Configure `VITE_GOOGLE_SCRIPT_URL` corretamente no `.env` e ignore essas URLs padrão.

### 2. Estrutura de Resposta do Google Apps Script

O Google Apps Script retorna:
```javascript
// getAnalysts() retorna:
{ analysts: [...] }

// Mas handleRequest() envolve em:
{ success: true, data: { analysts: [...] } }

// Estrutura final:
{
  success: true,
  data: {
    analysts: [
      {
        id: "email@exemplo.com",
        email: "email@exemplo.com",
        name: "Nome",
        role: "analista",
        active: true
      }
    ]
  }
}
```

O `userService.ts` já trata corretamente essa estrutura (linha 105-108).

### 3. Aba USUARIOS na Planilha

A aba USUARIOS pode não existir ou estar com dados incorretos:

**Estrutura correta:**
```
| Email               | Nome      | Role     | ID                  |
|---------------------|-----------|----------|---------------------|
| admin@email.com     | Admin     | admin    | admin@email.com     |
| analista@email.com  | Analista  | analista | analista@email.com  |
```

**Pontos críticos:**
- Coluna C (Role) deve ter exatamente "analista" (minúscula, sem acento)
- Não pode ter espaços extras

**Solução:** Use o script `resetUsuariosSheet()` do arquivo `TESTE_ANALISTAS_APPS_SCRIPT.js`

---

## 📋 Checklist de Correção

### Prioridade ALTA
- [ ] ✅ Adicionar `VITE_GOOGLE_SCRIPT_URL` no arquivo `.env`
- [ ] ✅ Verificar URL do Google Apps Script está correta
- [ ] ✅ Rebuild do projeto (`npm run build`)
- [ ] ✅ Se usar Netlify, adicionar variável de ambiente
- [ ] ✅ Redesenhar o site no Netlify (Clear cache)

### Prioridade MÉDIA
- [ ] ✅ Verificar aba USUARIOS existe na planilha
- [ ] ✅ Verificar coluna Role tem "analista" corretamente
- [ ] ✅ Executar `testGetAnalysts()` no Google Apps Script
- [ ] ✅ Ver logs no Console do navegador (F12)

### Prioridade BAIXA
- [ ] ✅ Testar com `TESTE_ANALISTAS_FRONTEND.html`
- [ ] ✅ Verificar logs do Google Apps Script

---

## 🎯 Resumo Executivo

**CAUSA RAIZ:** A variável `VITE_GOOGLE_SCRIPT_URL` não está configurada no `.env`.

**IMPACTO:** O sistema está tentando se conectar a URLs padrão que não são do seu Google Apps Script.

**SOLUÇÃO IMEDIATA:**
1. Copiar URL do Google Apps Script
2. Adicionar no `.env`: `VITE_GOOGLE_SCRIPT_URL=SUA_URL`
3. Executar `npm run build`
4. Deploy

**TEMPO ESTIMADO:** 5 minutos

**RESULTADO ESPERADO:** Analistas aparecerão no dropdown de alocação.

---

## 🔍 Como Verificar se Está Resolvido

### No Console do Navegador (F12):
```
========================================
🔄 [UserService] Chamando Google Apps Script: getAnalysts
📡 [UserService] Resposta recebida - Status: 200
✅ [UserService] Dados recebidos: { success: true, data: { analysts: [...] } }
📊 [AssignmentPanel] Total de analistas: 2
========================================
```

### Na Interface:
- Dropdown "Selecione o Analista" deve mostrar os analistas
- Seção "Carga de Trabalho" deve mostrar nomes dos analistas
- Botão "Alocar Candidatos" deve ficar habilitado ao selecionar analista e candidatos

---

## 🆘 Se Ainda Não Funcionar

Após adicionar a URL no `.env`:

1. **Verifique que a URL está sendo usada:**
   ```javascript
   // No Console do navegador:
   console.log(import.meta.env.VITE_GOOGLE_SCRIPT_URL);
   ```

2. **Teste a URL diretamente:**
   - Abra: `SUA_URL?action=test`
   - Deve retornar JSON com `success: true`

3. **Limpe o cache:**
   ```bash
   # Deletar pasta dist
   rm -rf dist
   # Rebuild
   npm run build
   ```

4. **No Netlify:**
   - Verifique que a variável foi salva
   - Faça um redeploy completo (Clear cache and deploy)
