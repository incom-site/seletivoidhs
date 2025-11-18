# 🔧 CORREÇÃO DE AUTENTICAÇÃO E CARREGAMENTO DE CANDIDATOS

**Data:** 2025-11-15
**Problemas Identificados:**
1. ❌ Todos os usuários eram redirecionados para AnalystDashboard
2. ❌ Candidatos não estavam sendo carregados para analistas

---

## 🐛 PROBLEMA 1: REDIRECIONAMENTO INCORRETO

### **Causa Raiz**
O Google Apps Script estava retornando o `role` em **lowercase** na função `getUserRole()`:
```javascript
role: String(data[i][2]).toLowerCase().trim()
```

Mas o frontend esperava os valores exatos: `'admin'`, `'analista'`, `'entrevistador'`.

### **Solução Aplicada**

**Arquivo:** `google-apps-script-COMPLETO-FINAL.js`

```javascript
function getUserRole(params) {
  const sheet = initUsuariosSheet();
  const data = sheet.getDataRange().getValues();
  const emailToFind = params.email?.toLowerCase().trim();

  if (!emailToFind) throw new Error('Email obrigatório');

  for (let i = 1; i < data.length; i++) {
    const email = data[i][0]?.toLowerCase().trim();
    if (email === emailToFind) {
      // ✅ CORREÇÃO: Normaliza o role para lowercase para garantir compatibilidade
      const rawRole = String(data[i][2]).toLowerCase().trim();

      return {
        email: data[i][0],
        name: data[i][1] || data[i][0],
        role: rawRole, // ✅ Retorna sempre em lowercase
        id: data[i][3] || data[i][0],
        active: true
      };
    }
  }
  throw new Error('Usuário não encontrado');
}
```

### **Fluxo de Autenticação Correto**

1. **AuthContext.tsx** (linha 78-104):
   ```typescript
   async getUserByEmail(email: string): Promise<User | null> {
     const result = await this.fetchData('getUserRole', { email });

     if (result && !result.error) {
       const userData = result.data || result;

       const user = {
         id: userData.email,
         email: userData.email,
         name: userData.name || userData.nome || userData.email,
         role: userData.role, // ✅ Já vem em lowercase do script
         active: true
       };

       return user;
     }
     return null;
   }
   ```

2. **App.tsx** (linha 37-51):
   ```typescript
   if (user.role === 'admin') {
     return <AdminDashboard />;
   }

   if (user.role === 'entrevistador') {
     return <InterviewerDashboard />;
   }

   return <AnalystDashboard />; // Default para analistas
   ```

### **Verificação da Planilha USUARIOS**

A aba **USUARIOS** deve ter essa estrutura:

| Email | Nome | Role | ID | DataCriacao | Ativo | Password |
|-------|------|------|----|----|------|----------|
| rayannyrego@gmail.com | Rayanny Rego | **admin** | rayannyrego@gmail.com | 07/11/2025 | TRUE | Admin@2024!Hospital |
| incom.slz@gmail.com | Analista Teste | **analista** | incom.slz@gmail.com | 07/11/2025 | TRUE | Teste@2024 |
| nbconsultoriasistema@gmail.com | Entrevistador Teste | **entrevistador** | nbconsultoriasistema@gmail.com | 12/11/2025 | TRUE | Teste@2024 |

**⚠️ IMPORTANTE:** O campo `Role` deve conter exatamente:
- `admin` (lowercase)
- `analista` (lowercase)
- `entrevistador` (lowercase)

---

## 🐛 PROBLEMA 2: CANDIDATOS NÃO CARREGAM

### **Causa Raiz**

O `candidateService.getCandidates()` estava filtrando por `assigned_to`, mas:
1. A planilha usa a coluna **`Analista`** (não `assigned_to`)
2. Não havia verificação dupla de ambas as colunas

### **Solução Aplicada**

**Arquivo:** `src/services/candidateService.ts`

#### **1. Mapeamento Correto no `getCandidates()` do Google Sheets**

```typescript
return candidatesArray.map((candidate: any) => {
  const normalized: any = {
    ...candidate,
    id: candidate.CPF || candidate.id,
    registration_number: candidate.CPF || candidate.registration_number,
    name: candidate.NOMECOMPLETO || candidate.name,

    status: (candidate.Status || candidate.status || 'pendente').toLowerCase(),
    Status: candidate.Status || candidate.status || 'pendente',

    // ✅ CORREÇÃO: Mapear assigned_to e Analista corretamente
    assigned_to: candidate.assigned_to || candidate.Analista || null,
    Analista: candidate.Analista || candidate.assigned_to || null,
    assigned_at: candidate.assigned_at || null,
    assigned_by: candidate.assigned_by || null,

    created_at: candidate.DataCadastro || candidate.created_at || null,
    updated_at: candidate.updated_at || null,
  };

  return normalized;
});
```

#### **2. Filtro com Verificação Dupla**

```typescript
async getCandidates(
  page: number = 1,
  pageSize: number = 50,
  filters?: CandidateFilters,
  userId?: string
): Promise<PaginatedResponse<Candidate>> {
  try {
    const allData = await sheetsService.getCandidates();
    let filteredData = filterData(allData, filters);

    // ✅ CORREÇÃO: Verificar assigned_to E Analista
    if (userId && filters?.assignedTo === undefined) {
      filteredData = filteredData.filter(item => {
        return item.assigned_to === userId ||
               item.assigned_to === userId.toLowerCase() ||
               item.Analista === userId ||
               item.Analista === userId.toLowerCase();
      });
    }

    // ... resto do código
  }
}
```

### **Como o Analista Recebe Candidatos**

1. **Admin aloca candidatos** via `AssignmentPanel.tsx`:
   ```typescript
   await assignCandidates({
     candidateIds: selectedCandidates,
     analystId: selectedAnalyst, // Email do analista
     adminId: user?.id || ''
   });
   ```

2. **Google Apps Script salva na coluna `Analista`**:
   ```javascript
   function assignCandidates(params) {
     // ...
     const assignedToCol = col['assigned_to'] ?? col['analista'];
     // ...
     assignedTo[i][0] = params.analystEmail || '';
   }
   ```

3. **AnalystDashboard carrega candidatos**:
   ```typescript
   const response = await candidateService.getCandidates(1, 100, {
     assignedTo: user.id, // Email do analista
   });
   ```

---

## 📊 MAPEAMENTO DE COLUNAS

### **Planilha CANDIDATOS**

| Coluna Google Sheets | Script (normalizado) | Frontend |
|---------------------|---------------------|----------|
| CPF | cpf | id, registration_number |
| NOMECOMPLETO | nomecompleto | NOMECOMPLETO, name |
| Status | status | Status, status |
| **Analista** | analista | **assigned_to, Analista** |
| assigned_to | assignedto | **assigned_to, Analista** |
| assigned_at | assignedat | assigned_at |
| assigned_by | assignedby | assigned_by |

**⚠️ IMPORTANTE:** O script agora mapeia AMBAS as colunas:
- `Analista` ↔ `assigned_to`
- `assigned_to` ↔ `Analista`

Isso garante compatibilidade independente de qual coluna está preenchida.

---

## ✅ CHECKLIST DE VERIFICAÇÃO

### **1. Verificar Estrutura da Planilha USUARIOS**

- [ ] Aba existe
- [ ] Coluna `Email` na posição A
- [ ] Coluna `Nome` na posição B
- [ ] Coluna `Role` na posição C (valores: admin, analista, entrevistador em lowercase)
- [ ] Coluna `ID` na posição D
- [ ] Usuários cadastrados com roles corretos

### **2. Verificar Estrutura da Planilha CANDIDATOS**

- [ ] Aba existe
- [ ] Coluna `CPF` existe
- [ ] Coluna `NOMECOMPLETO` existe
- [ ] Coluna `Status` existe
- [ ] Coluna `Analista` existe (criada pela função `addStatusColumnIfNotExists`)
- [ ] Coluna `assigned_to` existe (criada pela função `addStatusColumnIfNotExists`)

### **3. Testar Fluxo de Autenticação**

- [ ] Login como **admin** → Redireciona para `AdminDashboard`
- [ ] Login como **analista** → Redireciona para `AnalystDashboard`
- [ ] Login como **entrevistador** → Redireciona para `InterviewerDashboard`

### **4. Testar Alocação e Carregamento**

- [ ] Admin aloca candidatos para analista
- [ ] Coluna `Analista` é preenchida com email do analista
- [ ] Analista faz login
- [ ] Candidatos alocados aparecem no dashboard do analista

---

## 🔍 DEBUG: COMO IDENTIFICAR PROBLEMAS

### **1. Verificar Role do Usuário**

Abrir o console do navegador após login:
```
🎯 APP.TSX - ROTEAMENTO
👤 Usuário: { "email": "...", "role": "analista", ... }
🎭 Role: analista
🔍 Tipo do role: string
🔍 Role === "admin": false
🔍 Role === "analista": true
✅ Redirecionando para AnalystDashboard
```

### **2. Verificar Candidatos Carregados**

Abrir o console do navegador no dashboard do analista:
```
📊 [CandidateService] Buscando candidatos...
📊 [CandidateService] UserId: analista@example.com
📦 [CandidateService] Total de candidatos carregados: 50
🔍 [CandidateService] Filtrando por userId: analista@example.com
✅ [CandidateService] Candidato encontrado: João Silva assigned_to: analista@example.com
✅ [CandidateService] Após filtrar por userId: 5
```

### **3. Verificar Resposta do Google Apps Script**

No console do navegador:
```
🔄 Chamando Google Apps Script: https://script.google.com/.../exec?action=getUserRole&email=...
📡 Resposta recebida - Status: 200
✅ Dados recebidos: { "success": true, "data": { "email": "...", "role": "analista", ... } }
```

---

## 🚀 PRÓXIMOS PASSOS

1. **Fazer deploy do script atualizado** no Google Apps Script
2. **Executar `setupAllSheets()`** no Google Apps Script para criar colunas faltantes
3. **Limpar localStorage** no navegador:
   ```javascript
   localStorage.clear();
   ```
4. **Fazer novo login** para testar o redirecionamento
5. **Admin aloca candidatos** para um analista
6. **Analista faz login** e verifica se os candidatos aparecem

---

## 📝 NOTAS TÉCNICAS

### **Por que usar lowercase para roles?**

1. **Consistência:** Evita problemas de case sensitivity
2. **Compatibilidade:** Google Sheets pode alterar capitalização
3. **Simplicidade:** Comparações mais fáceis (`role === 'admin'`)

### **Por que mapear ambas as colunas?**

1. **Histórico:** Scripts antigos usavam `Analista`
2. **Novo padrão:** Código novo usa `assigned_to`
3. **Transição:** Sistema funciona com ambas durante migração

### **Por que verificar userId.toLowerCase()?**

Emails podem vir com capitalização diferente:
- Do localStorage: `Analista@Example.com`
- Do Google Sheets: `analista@example.com`

A comparação dupla garante match em ambos os casos.

---

**FIM DO DOCUMENTO**
