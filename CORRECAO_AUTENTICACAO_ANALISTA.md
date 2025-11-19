# 🔧 Correção: Autenticação de Analista

## 🎯 Problema Identificado

**Sintoma**: Analista via dashboard do admin, com vários erros

**Causa Raiz**:
1. Frontend esperava `result.data` diretamente como objeto user
2. Google Apps Script retorna `{ success: true, data: { role: ..., user: {...} } }`
3. Frontend não estava acessando `result.data.user` corretamente
4. Role não estava sendo normalizado (espaços, case sensitivity)

---

## ✅ Correções Aplicadas

### 1. AuthContext.tsx - getUserByEmail e getUserById

**❌ ANTES:**
```typescript
const userData = result.data || result; // ← ERRADO
```

**✅ DEPOIS:**
```typescript
if (result && result.success && result.data) {
  const userRoleData = result.data;
  const userData = userRoleData.user; // ← CORRETO: acessa user dentro de data

  if (!userData) {
    console.error('❌ user não encontrado em data');
    return null;
  }

  const user = {
    id: userData.email,
    email: userData.email,
    name: userData.name || userData.nome || userData.email,
    role: userData.role, // Role já vem normalizado do script
    active: true
  };

  return user;
}
```

### 2. Google Apps Script - getUserRole

**❌ ANTES:**
```javascript
role: values[i][roleCol] || 'analyst', // ← Podia ter espaços, case incorreto
```

**✅ DEPOIS:**
```javascript
// CRÍTICO: Normalizar role (remover espaços, lowercase)
const rawRole = String(values[i][roleCol] || 'analista').trim().toLowerCase();

const user = {
  id: userEmail,
  email: userEmail,
  name: values[i][nameCol] || userEmail,
  role: rawRole, // ← Limpo e normalizado
  active: isActive
};

Logger.log('✅ getUserRole - Usuário encontrado:');
Logger.log('   Role raw: "' + values[i][roleCol] + '"');
Logger.log('   Role normalizado: "' + rawRole + '"');
```

### 3. Google Apps Script - getAnalysts

**❌ ANTES:**
```javascript
if ((role === 'analyst' || role === 'admin') && isActive) { // ← Só aceitava inglês
  analysts.push({
    role: values[i][roleCol] // ← Não normalizado
  });
}
```

**✅ DEPOIS:**
```javascript
// Aceitar tanto 'analista' quanto 'analyst' (português e inglês)
if ((role === 'analista' || role === 'analyst' || role === 'admin') && isActive) {
  analysts.push({
    id: values[i][emailCol],
    email: values[i][emailCol],
    name: values[i][nameCol] || values[i][emailCol],
    role: role // ← Role já normalizado (lowercase, sem espaços)
  });
}
```

---

## 📊 Fluxo de Autenticação Corrigido

### Passo a Passo:

1. **Frontend chama**: `sheetsService.getUserByEmail('analista@exemplo.com')`

2. **Google Apps Script recebe**:
   ```
   action=getUserRole&email=analista@exemplo.com
   ```

3. **Script processa**:
   ```javascript
   // Normaliza role
   const rawRole = String(values[i][roleCol]).trim().toLowerCase();
   // rawRole = "analista" (sem espaços, lowercase)

   return { role: rawRole, user: { email, name, role: rawRole, ... } };
   ```

4. **handleRequest envolve**:
   ```javascript
   return createCorsResponse({
     success: true,
     data: { role: "analista", user: { ... } }
   });
   ```

5. **Frontend recebe**:
   ```json
   {
     "success": true,
     "data": {
       "role": "analista",
       "user": {
         "email": "analista@exemplo.com",
         "name": "Nome do Analista",
         "role": "analista",
         "active": true
       }
     }
   }
   ```

6. **Frontend extrai**:
   ```typescript
   const userRoleData = result.data; // { role: "analista", user: {...} }
   const userData = userRoleData.user; // { email, name, role: "analista", ... }
   ```

7. **App.tsx roteia**:
   ```typescript
   if (user.role === 'admin') {
     return <AdminDashboard />;
   }
   if (user.role === 'entrevistador') {
     return <InterviewerDashboard />;
   }
   // Qualquer outro role (incluindo 'analista') vai para:
   return <AnalystDashboard />; // ✅ CORRETO!
   ```

---

## 🧪 Como Testar

### 1. Limpar Cache
```bash
# No navegador:
Ctrl + Shift + R

# No localStorage (Console do navegador):
localStorage.clear();
```

### 2. Fazer Login como Analista
```
Email: analista@exemplo.com
Senha: (qualquer, não valida senha)
```

### 3. Verificar Logs no Console

**✅ Logs Esperados:**

```
═══════════════════════════════════════════════════
🔐 INICIANDO LOGIN
═══════════════════════════════════════════════════
📧 Email: analista@exemplo.com

📥 getUserByEmail - Resultado COMPLETO:
{
  "success": true,
  "data": {
    "role": "analista",
    "user": {
      "email": "analista@exemplo.com",
      "name": "Nome do Analista",
      "role": "analista",
      "active": true
    }
  }
}

📦 getUserByEmail - Data extraído:
{
  "role": "analista",
  "user": { ... }
}

👤 getUserByEmail - userData extraído:
{
  "email": "analista@exemplo.com",
  "name": "Nome do Analista",
  "role": "analista",
  "active": true
}

✅ getUserByEmail - User FINAL:
{
  "id": "analista@exemplo.com",
  "email": "analista@exemplo.com",
  "name": "Nome do Analista",
  "role": "analista",
  "active": true
}

🎭 getUserByEmail - ROLE: "analista" (tipo: string)

═══════════════════════════════════════════════════
✅ USUÁRIO PROCESSADO
═══════════════════════════════════════════════════
🎭 Role FINAL: "analista"

🧪 TESTES:
  role === "admin": false
  role === "analista": true ✅
  role === "entrevistador": false
═══════════════════════════════════════════════════

═══════════════════════════════════════════════════
🎯 APP.TSX - ROTEAMENTO
═══════════════════════════════════════════════════
🎭 Role: "analista"
🔍 Role === "admin": false
🔍 Role === "analista": true
✅ Redirecionando para AnalystDashboard
═══════════════════════════════════════════════════
```

### 4. Verificar Tela

Deve mostrar: **AnalystDashboard** (não AdminDashboard)

---

## 🔍 Diagnóstico de Problemas

### Problema: Ainda mostra AdminDashboard

**Possível causa 1**: Cache não limpo
```bash
# Solução:
localStorage.clear();
Ctrl + Shift + R
```

**Possível causa 2**: Role na planilha tem espaços ou caracteres especiais
```bash
# Verificar no Google Apps Script:
# Execute manualmente: getUserRole
# Veja os logs: "Role raw" vs "Role normalizado"
```

**Possível causa 3**: Script antigo ainda implantado
```bash
# Solução:
1. Verificar se o script tem a linha:
   const rawRole = String(values[i][roleCol] || 'analista').trim().toLowerCase();

2. Se não tiver, implantar nova versão:
   Implantar > Gerenciar implantações > Nova versão
```

### Problema: "user não encontrado em data"

**Causa**: Script está retornando formato antigo
```bash
# Solução:
1. Verificar resposta do script no Console:
   console.log(result);

2. Deve ter estrutura:
   { success: true, data: { role: "...", user: {...} } }

3. Se não tiver, reimplantar script atualizado
```

---

## 📝 Checklist de Verificação

Após aplicar as correções:

- [ ] Arquivo `src/contexts/AuthContext.tsx` atualizado
- [ ] Arquivo `google-apps-script-COMPLETO-OTIMIZADO.js` atualizado
- [ ] Nova versão do script implantada no Google Apps Script
- [ ] Cache do navegador limpo (Ctrl + Shift + R)
- [ ] localStorage limpo (`localStorage.clear()`)
- [ ] Login como analista testado
- [ ] Console mostra "✅ Redirecionando para AnalystDashboard"
- [ ] Tela correta (AnalystDashboard) aparece
- [ ] Nenhum erro no console

---

## 🎉 Resultado Final

Com as correções aplicadas:

### ✅ Analista
- Faz login
- Role é normalizado para `"analista"`
- É redirecionado para `AnalystDashboard`
- Vê apenas seus candidatos alocados
- Pode fazer triagem

### ✅ Admin
- Faz login
- Role é normalizado para `"admin"`
- É redirecionado para `AdminDashboard`
- Vê painel completo de administração
- Pode alocar candidatos

### ✅ Entrevistador
- Faz login
- Role é normalizado para `"entrevistador"`
- É redirecionado para `InterviewerDashboard`
- Vê apenas seus candidatos alocados para entrevista
- Pode avaliar entrevistas

---

## 🔄 Próximos Passos

1. **Implante o script atualizado** no Google Apps Script
2. **Recarregue o frontend** com Ctrl + Shift + R
3. **Teste o login** com usuário analista
4. **Verifique os logs** no Console
5. **Confirme** que a tela correta aparece

Se ainda houver problemas, me envie:
- Logs completos do Console (toda a seção de LOGIN)
- Screenshot da tela que aparece
- Role do usuário na planilha USUARIOS (copie exatamente)
