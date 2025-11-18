# Teste: Todos caindo na mesma tela

## 🚨 Problema Reportado
Todos os usuários (admin e analista) estão abrindo na mesma tela, independente do role.

## 🔍 Logs Adicionados

Adicionei logs **SUPER DETALHADOS** em TODOS os pontos críticos:

### 1. Google Apps Script - getUserRole()
- Normaliza o role (minúsculas, sem espaços)
- Retorna `{ success: true, data: { email, name, role, id } }`

### 2. AuthContext - getUserByEmail() e getUserById()
```
📥 getUserByEmail - Resultado COMPLETO: {...}
📦 getUserByEmail - Dados extraídos: {...}
✅ getUserByEmail - User FINAL: {...}
🎭 getUserByEmail - ROLE: admin (tipo: string)
```

### 3. AuthContext - login()
```
🔐 LOGIN - Email: admin@email.com
👤 LOGIN - Dados recebidos: {...}
💾 LOGIN - Salvando user: {...}
🎭 LOGIN - ROLE a ser salvo: admin
🔍 LOGIN - role === "admin": true
🔍 LOGIN - role === "analista": false
```

### 4. App.tsx - Roteamento
```
============================================================
🎯 APP.TSX - ROTEAMENTO
============================================================
👤 Usuário: {...}
🎭 Role: admin
🔍 Tipo do role: string
📏 Tamanho do role: 5
🔍 Role === "admin": true
🔍 Role === "analista": false
============================================================
✅ Redirecionando para AdminDashboard
============================================================
```

### 5. Dashboards
```
🎨 AdminDashboard RENDERIZADO - Este é o painel de ADMINISTRADOR
ou
📊 AnalystDashboard RENDERIZADO - Este é o painel de ANALISTA
```

## 🧪 Como Testar AGORA

### Passo 1: Atualizar Google Apps Script (IMPORTANTE!)

Copie e cole o código de `google-apps-script-updated.js` no editor do Apps Script.

**VERIFICAR** se a função `getUserRole` tem esta linha:
```javascript
const normalizedRole = rawRole ? String(rawRole).toLowerCase().trim() : '';
```

### Passo 2: Verificar Aba USUARIOS

Na planilha, verifique se os roles estão corretos:

```
| Email              | Nome          | Role     | ID                |
|--------------------|---------------|----------|-------------------|
| admin@email.com    | Administrador | admin    | admin@email.com   |
| analista@email.com | Analista José | analista | analista@email.com|
```

**IMPORTANTE**:
- Role do admin deve ser `admin` (tudo minúsculo)
- Role do analista deve ser `analista` (tudo minúsculo)
- Sem espaços antes ou depois

### Passo 3: LIMPAR TUDO

**SUPER IMPORTANTE** - Faça isso ANTES de testar:

1. Abra o Console do navegador (F12)
2. Execute:
```javascript
localStorage.clear();
console.log('✅ localStorage limpo!');
```
3. Recarregue a página (Ctrl+R ou Cmd+R)

### Passo 4: Fazer Login com ADMIN

1. Faça login com email de admin
2. **OBSERVE ATENTAMENTE OS LOGS** no console

**O que DEVE aparecer:**
```
🔄 Chamando Google Apps Script: https://script.google.com/...
📡 Resposta recebida - Status: 200
✅ Dados recebidos: {success: true, data: {...}}
📥 getUserByEmail - Resultado COMPLETO: {success: true, data: {email: "...", role: "admin", ...}}
📦 getUserByEmail - Dados extraídos: {email: "...", role: "admin", ...}
✅ getUserByEmail - User FINAL: {id: "...", email: "...", role: "admin", ...}
🎭 getUserByEmail - ROLE: admin (tipo: string)
🔐 LOGIN - Email: admin@email.com
👤 LOGIN - Dados recebidos: {id: "...", email: "...", role: "admin", ...}
💾 LOGIN - Salvando user: {id: "...", email: "...", role: "admin", ...}
🎭 LOGIN - ROLE a ser salvo: admin
🔍 LOGIN - role === "admin": true
🔍 LOGIN - role === "analista": false
============================================================
🎯 APP.TSX - ROTEAMENTO
============================================================
👤 Usuário: {id: "...", email: "...", role: "admin", ...}
🎭 Role: admin
🔍 Tipo do role: string
📏 Tamanho do role: 5
🔍 Role === "admin": true
🔍 Role === "analista": false
============================================================
✅ Redirecionando para AdminDashboard
============================================================
🎨 AdminDashboard RENDERIZADO - Este é o painel de ADMINISTRADOR
```

### Passo 5: Verificar a Tela

**Se for ADMIN, deve ver:**
- Título: "Sistema de Triagem"
- Subtítulo: "Admin: [nome]"
- 6 abas: Importar, Alocação, Meus Candidatos, Classificados, Desclassificados, À Revisar
- 5 caixas de estatísticas (incluindo "Total Triados" roxa)

### Passo 6: Fazer Logout e Testar ANALISTA

1. Clique em "Sair"
2. **LIMPE o localStorage novamente**:
```javascript
localStorage.clear();
```
3. Recarregue a página
4. Faça login com email de analista
5. **OBSERVE OS LOGS**

**O que DEVE aparecer:**
```
... (logs similares aos do admin) ...
🎭 LOGIN - ROLE a ser salvo: analista
🔍 LOGIN - role === "admin": false
🔍 LOGIN - role === "analista": true
============================================================
🎯 APP.TSX - ROTEAMENTO
============================================================
🎭 Role: analista
🔍 Role === "admin": false
🔍 Role === "analista": true
============================================================
✅ Redirecionando para AnalystDashboard
============================================================
📊 AnalystDashboard RENDERIZADO - Este é o painel de ANALISTA
```

**Se for ANALISTA, deve ver:**
- Título: "Meus Candidatos"
- Subtítulo: "Analista: [nome]"
- Nenhuma aba (só lista)
- 4 caixas de estatísticas

## 🔧 Diagnóstico por Sintoma

### Sintoma 1: Ambos caem no AdminDashboard

**Logs esperados:**
```
🔍 LOGIN - role === "admin": true (para ambos)
✅ Redirecionando para AdminDashboard (para ambos)
```

**Problema**: O Google Sheets está retornando "admin" para todos

**Solução**:
1. Verifique a aba USUARIOS
2. Corrija os roles manualmente
3. Salve a planilha
4. Limpe localStorage e teste novamente

### Sintoma 2: Ambos caem no AnalystDashboard

**Logs esperados:**
```
🔍 LOGIN - role === "admin": false (para ambos)
✅ Redirecionando para AnalystDashboard (para ambos)
```

**Problema**: O Google Sheets está retornando "analista" para todos OU o role está vindo com valor diferente de "admin"

**Solução**:
1. Verifique a aba USUARIOS
2. Verifique se o role do admin está exatamente como "admin"
3. Verifique se não há espaços ou caracteres invisíveis
4. Execute no console:
```javascript
const user = JSON.parse(localStorage.getItem('currentUser'));
console.log('Role:', user.role);
console.log('Chars:', [...user.role].map(c => c.charCodeAt(0)));
// Para "admin" deve ser: [97, 100, 109, 105, 110]
```

### Sintoma 3: Role está correto mas tela errada

**Logs esperados:**
```
🎭 Role: admin
🔍 Role === "admin": false (!!)
✅ Redirecionando para AnalystDashboard
```

**Problema**: O role tem caracteres invisíveis ou o tipo está errado

**Solução**:
1. Verifique o tipo:
```javascript
const user = JSON.parse(localStorage.getItem('currentUser'));
console.log('Tipo:', typeof user.role);
console.log('É string?:', typeof user.role === 'string');
```
2. Se o tipo estiver errado, o problema está no Google Apps Script
3. Atualize o script com a versão mais recente

### Sintoma 4: Role vem como "Admin" ou "ADMIN"

**Logs esperados:**
```
🎭 Role: Admin
🔍 Role === "admin": false
```

**Problema**: O Google Apps Script não está normalizando

**Solução**:
1. Verifique se a função `getUserRole` tem:
```javascript
const normalizedRole = rawRole ? String(rawRole).toLowerCase().trim() : '';
```
2. Se não tiver, atualize o script

## 📊 Teste Definitivo

Execute este script no console **APÓS fazer login**:

```javascript
console.clear();
console.log('╔═══════════════════════════════════════════════════╗');
console.log('║         DIAGNÓSTICO COMPLETO DE ROLE              ║');
console.log('╚═══════════════════════════════════════════════════╝');
console.log('');

const user = JSON.parse(localStorage.getItem('currentUser'));

console.log('📋 Dados do localStorage:');
console.log('  User completo:', user);
console.log('');

console.log('🎭 Análise do ROLE:');
console.log('  Valor:', user.role);
console.log('  Tipo:', typeof user.role);
console.log('  Tamanho:', user.role?.length);
console.log('  É string?:', typeof user.role === 'string');
console.log('');

console.log('🔍 Comparações:');
console.log('  role === "admin":', user.role === 'admin');
console.log('  role === "analista":', user.role === 'analista');
console.log('');

console.log('🔢 Caracteres (charCodes):');
console.log('  Atual:', [...user.role].map(c => c.charCodeAt(0)));
console.log('  Esperado "admin":', [97, 100, 109, 105, 110]);
console.log('  Esperado "analista":', [97, 110, 97, 108, 105, 115, 116, 97]);
console.log('');

console.log('🎨 Tela que DEVERIA aparecer:');
const h1 = document.querySelector('h1')?.textContent;
console.log('  H1 atual:', h1);
if (user.role === 'admin') {
  console.log('  ✅ DEVERIA: "Sistema de Triagem" (AdminDashboard)');
  console.log('  ❌ NÃO DEVERIA: "Meus Candidatos" (AnalystDashboard)');
} else {
  console.log('  ✅ DEVERIA: "Meus Candidatos" (AnalystDashboard)');
  console.log('  ❌ NÃO DEVERIA: "Sistema de Triagem" (AdminDashboard)');
}
console.log('');

console.log('🎯 Status:');
if (h1?.includes('Sistema de Triagem') && user.role === 'admin') {
  console.log('  ✅ CORRETO - Admin vendo AdminDashboard');
} else if (h1?.includes('Meus Candidatos') && user.role === 'analista') {
  console.log('  ✅ CORRETO - Analista vendo AnalystDashboard');
} else {
  console.log('  ❌ INCORRETO - Tela não corresponde ao role!');
}

console.log('');
console.log('╚═══════════════════════════════════════════════════╝');
```

## 📞 O Que Enviar para Análise

1. **Print da aba USUARIOS** da planilha
2. **TODOS os logs do console** desde o login até aparecer a tela
3. **Resultado do "Teste Definitivo"** acima
4. **Print da tela** mostrando qual dashboard apareceu

Com essas 4 informações, conseguirei identificar EXATAMENTE onde está o problema!
