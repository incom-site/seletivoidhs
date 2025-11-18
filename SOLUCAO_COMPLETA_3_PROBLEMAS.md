# Solução Completa para os 3 Problemas

## 🚨 Problemas Identificados

1. ❌ **Candidatos não aparecem** - Tela do admin retorna vazio
2. ❌ **Admin abre tela de analista** - Role não reconhecido corretamente
3. ❌ **Analistas não listam** - Lista vazia na alocação

---

## ✅ CORREÇÕES APLICADAS

### 1️⃣ Role Normalizado no Google Apps Script

**Arquivo**: `google-apps-script-updated.js`

**Problema**: Role vinha como estava na planilha ("Admin", "ADMIN", " admin ")

**Solução**:
```javascript
function getUserRole(params) {
  // ...
  const rawRole = data[i][2];
  const normalizedRole = rawRole ? String(rawRole).toLowerCase().trim() : '';

  return {
    email: data[i][0],
    name: data[i][1],
    role: normalizedRole,  // ← sempre minúsculo sem espaços
    id: data[i][3]
  };
}
```

### 2️⃣ Função getAnalysts() Criada

**Problema**: Função não existia no Google Apps Script

**Solução**:
```javascript
function getAnalysts(params) {
  const analysts = [];

  for (let i = 1; i < data.length; i++) {
    const normalizedRole = String(data[i][2]).toLowerCase().trim();

    if (normalizedRole === 'analista') {
      analysts.push({
        id: data[i][3] || data[i][0],
        email: data[i][0],
        name: data[i][1],
        role: normalizedRole,
        active: true
      });
    }
  }

  return { analysts: analysts };
}
```

**Action adicionada**:
```javascript
const actions = {
  'getAnalysts': () => getAnalysts(params),
  // ...
};
```

### 3️⃣ Função assignCandidates() Criada

**Problema**: Alocação não funcionava - função não existia

**Solução**:
```javascript
function assignCandidates(params) {
  const candidateIds = params.candidateIds.split(',');

  for (let i = 1; i < data.length; i++) {
    if (candidateIds.includes(String(data[i][cpfCol]))) {
      // Atualiza assigned_to, assigned_by, assigned_at, Status
      sheet.getRange(i + 1, assignedToCol + 1).setValue(params.analystEmail);
      sheet.getRange(i + 1, assignedByCol + 1).setValue(params.adminEmail);
      sheet.getRange(i + 1, assignedAtCol + 1).setValue(getCurrentTimestamp());
      sheet.getRange(i + 1, statusCol + 1).setValue('em_analise');
    }
  }

  return { success: true, assignedCount: X };
}
```

**Action adicionada**:
```javascript
const actions = {
  'assignCandidates': () => assignCandidates(params),
  // ...
};
```

### 4️⃣ getCandidates() Retorna Formato Correto

**Problema**: Retornava array direto, frontend esperava objeto

**Solução**:
```javascript
function getCandidates(params) {
  // ... processa candidatos ...

  return { candidates: candidates };  // ← não return candidates
}
```

### 5️⃣ Frontend Atualizado

**userService.ts**:
```typescript
export async function getAnalysts(): Promise<User[]> {
  const result = await sheetsService.fetchData('getAnalysts');
  const analysts = result.data?.analysts || result.analysts || [];
  return analysts;
}
```

**candidateService.ts**:
```typescript
async getCandidates(): Promise<Candidate[]> {
  const result = await this.fetchData('getCandidates');
  const candidatesArray = result.data?.candidates || result.candidates || [];
  return candidatesArray.map(...);
}
```

---

## 📋 ESTRUTURA DA PLANILHA

### Aba: USUARIOS

| Email              | Nome          | Role     | ID                |
|--------------------|---------------|----------|-------------------|
| admin@email.com    | Administrador | admin    | admin@email.com   |
| analista@email.com | José Silva    | analista | analista@email.com|

**CRÍTICO**:
- Role deve ser `admin` ou `analista` (minúsculo)
- Sem espaços extras

### Aba: CANDIDATOS

| CPF | NOMECOMPLETO | AREAATUACAO | CARGOPRETENDIDO | VAGAPCD | Status | assigned_to | assigned_by | assigned_at |
|-----|--------------|-------------|-----------------|---------|--------|-------------|-------------|-------------|
| ... | ...          | ...         | ...             | ...     | ...    |             |             |             |

**Colunas obrigatórias**:
- CPF, NOMECOMPLETO, AREAATUACAO, CARGOPRETENDIDO, VAGAPCD, Status
- assigned_to, assigned_by, assigned_at (para alocação)

---

## 🔧 COMO APLICAR AS CORREÇÕES

### PASSO 1: Atualizar Google Apps Script

1. Abra sua planilha no Google Sheets
2. Extensions > Apps Script
3. **APAGUE todo código antigo**
4. Copie TODO o conteúdo de `google-apps-script-updated.js`
5. Cole no editor
6. Salve (Ctrl+S)
7. Publique novamente:
   - Deploy > New deployment
   - Type: Web app
   - Execute as: Me
   - Who has access: Anyone
   - Deploy
   - **Copie a nova URL**

### PASSO 2: Atualizar .env (se necessário)

Se a URL mudou:
```env
VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/SUA_NOVA_URL/exec
```

### PASSO 3: Verificar Planilha

**Aba USUARIOS**:
- [ ] Existe
- [ ] Tem colunas: Email, Nome, Role, ID
- [ ] Roles estão como `admin` ou `analista` (minúsculo)
- [ ] Tem pelo menos 1 admin e 1 analista

**Aba CANDIDATOS**:
- [ ] Existe
- [ ] Tem coluna CPF
- [ ] Tem dados além do cabeçalho
- [ ] Tem colunas: assigned_to, assigned_by, assigned_at
- [ ] Status está como: pendente, em_analise ou concluido

### PASSO 4: Limpar Cache e Testar

```javascript
// No console do navegador (F12)
localStorage.clear();
location.reload();
```

---

## 🧪 TESTES

### Teste 1: Login como Admin

1. Faça login com admin@email.com
2. **Console deve mostrar**:
```
🔐 LOGIN - Email: admin@email.com
🎭 getUserByEmail - ROLE: admin (tipo: string)
🔍 LOGIN - role === "admin": true

============================================================
🎯 APP.TSX - ROTEAMENTO
🎭 Role: admin
🔍 Role === "admin": true
✅ Redirecionando para AdminDashboard
============================================================
🎨 AdminDashboard RENDERIZADO
```

3. **Tela deve mostrar**:
   - Título: "Sistema de Triagem"
   - Subtítulo: "Admin: [nome]"
   - 6 abas: Importar, Alocação, Meus Candidatos, Classificados, Desclassificados, À Revisar

### Teste 2: Ver Candidatos

1. Clique na aba "Alocação"
2. **Console deve mostrar**:
```
📞 Chamando getCandidates...
✅ Array de candidatos extraído: [...]
📏 Total de candidatos: X
```

3. **Tela deve mostrar**:
   - Lista de candidatos não alocados
   - Checkboxes para selecionar

### Teste 3: Ver Analistas

Na mesma tela de Alocação:

**Console deve mostrar**:
```
🔍 Buscando analistas...
✅ Analistas extraídos: [...]
📊 Total de analistas: Y
```

**Tela deve mostrar**:
- Dropdown com lista de analistas
- Nome e email de cada analista

### Teste 4: Alocar Candidatos

1. Selecione alguns candidatos
2. Escolha um analista
3. Clique em "Alocar Selecionados"
4. **Console deve mostrar**:
```
🔵 Alocando candidatos: {...}
✅ Alocação concluída: {...}
```

5. **Planilha deve atualizar**:
   - Coluna `assigned_to` com email do analista
   - Coluna `assigned_by` com email do admin
   - Coluna `assigned_at` com data/hora
   - Coluna `Status` mudou para `em_analise`

### Teste 5: Login como Analista

1. Logout
2. Limpe localStorage novamente
3. Login com analista@email.com
4. **Console deve mostrar**:
```
🎭 Role: analista
🔍 Role === "admin": false
🔍 Role === "analista": true
✅ Redirecionando para AnalystDashboard
📊 AnalystDashboard RENDERIZADO
```

5. **Tela deve mostrar**:
   - Título: "Meus Candidatos"
   - Subtítulo: "Analista: [nome]"
   - NENHUMA aba (só lista de candidatos)
   - Lista dos candidatos alocados para este analista

---

## 🔍 DIAGNÓSTICO

### Se Admin ainda cai em Analista:

**Verificar no console**:
```javascript
const user = JSON.parse(localStorage.getItem('currentUser'));
console.log('Role:', user.role);
console.log('Tipo:', typeof user.role);
console.log('Comprimento:', user.role.length);
console.log('Chars:', [...user.role].map(c => c.charCodeAt(0)));
```

**Para "admin" deve ser**: `[97, 100, 109, 105, 110]`

**Se estiver diferente**: Role tem espaços ou caracteres invisíveis na planilha

### Se Candidatos não aparecem:

**No Apps Script**:
1. Executar função de teste
2. Ver logs (View > Logs)
3. Deve mostrar:
```
📋 Cabeçalhos encontrados: CPF, NOMECOMPLETO, ...
📊 Total de linhas: X
✅ Total processados: Y
```

**No Frontend**:
```
📏 Total de candidatos: X
```

Se X = 0: Aba CANDIDATOS está vazia ou não existe

### Se Analistas não aparecem:

**No Apps Script (logs)**:
```
📋 getAnalysts - Buscando...
  Linha 1 - Email: ..., Role: admin
  Linha 2 - Email: ..., Role: analista
✅ Total encontrados: 1
```

**No Frontend**:
```
📊 Total de analistas: X
```

Se X = 0: Nenhum usuário tem role `analista` na planilha

---

## ✅ CHECKLIST FINAL

- [ ] Google Apps Script atualizado
- [ ] Script republicado como Web App
- [ ] Aba USUARIOS: roles corretos (`admin`, `analista`)
- [ ] Aba CANDIDATOS: tem dados e colunas de alocação
- [ ] localStorage limpo antes de testar
- [ ] Admin vê "Sistema de Triagem" + 6 abas
- [ ] Analista vê "Meus Candidatos" + sem abas
- [ ] Candidatos aparecem na lista
- [ ] Analistas aparecem no dropdown
- [ ] Alocação funciona e atualiza planilha

---

## 📸 LOGS DE SUCESSO

### Login Admin Bem-Sucedido:
```
🔐 LOGIN - Email: admin@email.com
📥 getUserByEmail - Resultado COMPLETO: {success: true, data: {email: "admin@email.com", role: "admin", ...}}
🎭 getUserByEmail - ROLE: admin (tipo: string)
🔍 LOGIN - role === "admin": true
============================================================
🎯 APP.TSX - ROTEAMENTO
🎭 Role: admin
🔍 Role === "admin": true
✅ Redirecionando para AdminDashboard
============================================================
🎨 AdminDashboard RENDERIZADO - Este é o painel de ADMINISTRADOR
```

### Candidatos Carregados:
```
📞 Chamando getCandidates do Google Sheets...
🔄 Chamando Google Apps Script: https://script.google.com/...
📡 Resposta recebida - Status: 200
✅ Dados recebidos: {success: true, data: {candidates: [...]}}
📏 Total de candidatos: 25
👤 Exemplo do primeiro candidato: {CPF: "12345678900", NOMECOMPLETO: "João Silva", ...}
```

### Analistas Carregados:
```
🔍 Buscando analistas...
🔄 [UserService] Chamando Google Apps Script: ...
📡 [UserService] Resposta recebida - Status: 200
✅ [UserService] Dados recebidos: {success: true, data: {analysts: [...]}}
📊 Total de analistas: 3
```

### Alocação Bem-Sucedida:
```
🔵 Alocando candidatos: {candidateIds: ["123", "456"], analystId: "analista@email.com", ...}
✅ Alocação concluída: {success: true, assignedCount: 2, message: "2 candidatos alocados"}
```

---

## 🆘 AINDA NÃO FUNCIONA?

Envie:
1. Print da aba USUARIOS (com roles visíveis)
2. Print da aba CANDIDATOS (primeiras linhas)
3. TODOS os logs do console desde o login
4. Print da tela mostrando qual dashboard apareceu

Com isso conseguirei identificar exatamente o problema! 🎯
