# 🔍 GUIA DE DEBUG - AUTENTICAÇÃO

## ⚠️ PROBLEMA REPORTADO
**Todos os usuários estão sendo redirecionados para AnalystDashboard**

---

## 🛠️ FERRAMENTAS DE DEBUG

### **1. Teste Rápido com HTML**

Use o arquivo `TESTE_AUTENTICACAO.html` criado na raiz do projeto:

1. Abra o arquivo no navegador
2. Configure a URL do Google Apps Script
3. Teste com os 3 emails:
   - `rayannyrego@gmail.com` (deve ser admin)
   - `incom.slz@gmail.com` (deve ser analista)
   - `nbconsultoriasistema@gmail.com` (deve ser entrevistador)

O teste mostrará:
- ✅ A resposta JSON do script
- ✅ O role exato retornado
- ✅ Comparações de igualdade
- ✅ Bytes do role (para detectar caracteres invisíveis)

---

## 📋 CHECKLIST DE VERIFICAÇÃO

### **1. Verificar Planilha USUARIOS**

Abra a planilha e verifique:

```
| Email                          | Nome               | Role          | ID  | DataCriacao | Ativo | Password |
|--------------------------------|-------------------|---------------|-----|-------------|-------|----------|
| rayannyrego@gmail.com          | Rayanny Rego      | admin         | ... | ...         | TRUE  | ...      |
| incom.slz@gmail.com            | Analista Teste    | analista      | ... | ...         | TRUE  | ...      |
| nbconsultoriasistema@gmail.com | Entrevistador     | entrevistador | ... | ...         | TRUE  | ...      |
```

**⚠️ VERIFICAÇÕES CRÍTICAS:**

- [ ] Coluna `Role` está na posição **C** (terceira coluna)
- [ ] Valores do role estão em **lowercase**: `admin`, `analista`, `entrevistador`
- [ ] **NÃO** há espaços antes ou depois: ` admin ` ❌
- [ ] **NÃO** há caracteres especiais: `Admin` ❌, `ADMIN` ❌
- [ ] Coluna `Ativo` está como `TRUE` (ou `Sim`)

---

### **2. Verificar Google Apps Script**

Abra o Google Apps Script e execute:

```javascript
function testeGetUserRole() {
  const email = 'rayannyrego@gmail.com';
  const result = getUserRole({ email: email });

  Logger.log('Resultado completo:');
  Logger.log(JSON.stringify(result, null, 2));
  Logger.log('Role retornado: ' + result.role);
  Logger.log('Tipo do role: ' + typeof result.role);
  Logger.log('Tamanho do role: ' + result.role.length);
  Logger.log('Role === "admin": ' + (result.role === 'admin'));
}
```

**Resultado Esperado:**
```
Resultado completo:
{
  "email": "rayannyrego@gmail.com",
  "name": "Rayanny Rego",
  "role": "admin",
  "id": "rayannyrego@gmail.com",
  "active": true
}
Role retornado: admin
Tipo do role: string
Tamanho do role: 5
Role === "admin": true
```

---

### **3. Verificar Logs do Navegador**

Abra o Console do Navegador (F12) e faça login. Procure por:

```
════════════════════════════════════════════════════════════
🔐 INICIANDO LOGIN
════════════════════════════════════════════════════════════
📧 Email: rayannyrego@gmail.com
📥 Dados brutos do Google Sheets: { ... }
════════════════════════════════════════════════════════════
✅ USUÁRIO PROCESSADO
════════════════════════════════════════════════════════════
User completo: { "role": "admin", ... }
🎭 Role FINAL: "admin"
📏 Tamanho: 5
🔤 Tipo: string
🔢 Bytes: 97, 100, 109, 105, 110

🧪 TESTES:
  role === "admin": true  ✅ DEVE SER TRUE
  role === "analista": false
  role === "entrevistador": false
════════════════════════════════════════════════════════════
💾 Salvo no localStorage
════════════════════════════════════════════════════════════
```

Depois, procure por:

```
════════════════════════════════════════════════════════════
🎯 APP.TSX - ROTEAMENTO
════════════════════════════════════════════════════════════
👤 Usuário: { "role": "admin", ... }
🎭 Role: admin
🔍 Tipo do role: string
📏 Tamanho do role: 5
🔍 Role === "admin": true  ✅ DEVE SER TRUE
🔍 Role === "analista": false
════════════════════════════════════════════════════════════
✅ Redirecionando para AdminDashboard  ✅ DEVE APARECER
════════════════════════════════════════════════════════════
```

---

## 🐛 PROBLEMAS COMUNS

### **Problema 1: Role com Espaços em Branco**

**Sintoma:**
```
🔢 Bytes: 32, 97, 100, 109, 105, 110  ← Começa com 32 (espaço)
```

**Solução:**
1. Abra a planilha USUARIOS
2. Na coluna `Role`, clique na célula
3. Apague e digite novamente: `admin` (sem espaços)
4. Repita para todas as linhas

---

### **Problema 2: Role com Maiúsculas**

**Sintoma:**
```
🎭 Role FINAL: "Admin"
Role === "admin": false  ← FALSE!
```

**Solução:**
1. Abra a planilha USUARIOS
2. Na coluna `Role`, substitua:
   - `Admin` → `admin`
   - `Analista` → `analista`
   - `Entrevistador` → `entrevistador`

---

### **Problema 3: Script Retorna Estrutura Errada**

**Sintoma:**
```
📥 Dados brutos: { "success": true, "data": null }
```

**Solução:**
1. Verifique se a planilha USUARIOS existe
2. Execute `setupAllSheets()` no Google Apps Script
3. Verifique se há dados na planilha

---

### **Problema 4: localStorage com Dados Antigos**

**Sintoma:**
O login funciona, mas ao recarregar a página vai para o dashboard errado.

**Solução:**
1. Abra o Console do Navegador (F12)
2. Execute:
   ```javascript
   localStorage.clear();
   ```
3. Recarregue a página (F5)
4. Faça login novamente

---

## 🧪 TESTES PASSO A PASSO

### **Teste 1: Verificar Role no Script**

```javascript
// Cole no Google Apps Script e execute
function testeRoles() {
  const sheet = SpreadsheetApp.openById('SEU_ID').getSheetByName('USUARIOS');
  const data = sheet.getDataRange().getValues();

  Logger.log('Cabeçalhos:', data[0]);

  for (let i = 1; i < data.length; i++) {
    const email = data[i][0];
    const role = data[i][2];

    Logger.log('─'.repeat(50));
    Logger.log('Email:', email);
    Logger.log('Role original:', role);
    Logger.log('Role após lowercase:', String(role).toLowerCase().trim());
    Logger.log('Bytes:', Array.from(String(role)).map(c => c.charCodeAt(0)).join(', '));
  }
}
```

---

### **Teste 2: Verificar Frontend**

1. Limpe o localStorage:
   ```javascript
   localStorage.clear();
   ```

2. Faça login com cada usuário

3. Verifique os logs do console

4. Verifique qual componente foi carregado:
   ```javascript
   // No console do navegador
   document.title // Deve mostrar o título correto
   ```

---

## ✅ CORREÇÕES APLICADAS

### **1. AuthContext.tsx**

Adicionada limpeza forçada do role:
```typescript
const cleanRole = String(userData.role).toLowerCase().trim();
```

Isso garante:
- Remove espaços em branco
- Converte para lowercase
- Remove caracteres especiais

### **2. Google Apps Script**

A função `getUserRole` já retorna em lowercase:
```javascript
role: String(data[i][2]).toLowerCase().trim()
```

### **3. App.tsx**

Lógica de roteamento:
```typescript
if (user.role === 'admin') {
  return <AdminDashboard />;
}

if (user.role === 'entrevistador') {
  return <InterviewerDashboard />;
}

return <AnalystDashboard />; // Default
```

---

## 📞 PRÓXIMOS PASSOS

1. **Limpe o localStorage:**
   ```javascript
   localStorage.clear();
   ```

2. **Verifique a planilha USUARIOS:**
   - Roles em lowercase
   - Sem espaços
   - Coluna Role na posição C

3. **Faça novo deploy do Google Apps Script**

4. **Teste com cada usuário:**
   - Admin
   - Analista
   - Entrevistador

5. **Monitore os logs do console do navegador**

6. **Use o TESTE_AUTENTICACAO.html para validar**

---

## 🆘 SE NADA FUNCIONAR

Execute este script no Google Apps Script para ver exatamente o que está na planilha:

```javascript
function debugUsuarios() {
  const sheet = SpreadsheetApp.openById('SEU_ID').getSheetByName('USUARIOS');
  const data = sheet.getDataRange().getValues();

  Logger.log('═'.repeat(60));
  Logger.log('DEBUG COMPLETO DA PLANILHA USUARIOS');
  Logger.log('═'.repeat(60));
  Logger.log('');
  Logger.log('Cabeçalhos:');
  data[0].forEach((header, index) => {
    Logger.log(`  [${index}] ${header}`);
  });
  Logger.log('');

  for (let i = 1; i < data.length; i++) {
    Logger.log('─'.repeat(60));
    Logger.log(`LINHA ${i + 1}:`);
    Logger.log(`  Email: "${data[i][0]}"`);
    Logger.log(`  Nome: "${data[i][1]}"`);
    Logger.log(`  Role: "${data[i][2]}"`);
    Logger.log(`  Role (lowercase): "${String(data[i][2]).toLowerCase()}"`);
    Logger.log(`  Role (trim): "${String(data[i][2]).trim()}"`);
    Logger.log(`  Role (lower+trim): "${String(data[i][2]).toLowerCase().trim()}"`);
    Logger.log(`  Tamanho: ${String(data[i][2]).length}`);
    Logger.log(`  Bytes: ${Array.from(String(data[i][2])).map(c => c.charCodeAt(0)).join(', ')}`);

    const roleClean = String(data[i][2]).toLowerCase().trim();
    Logger.log(`  É admin? ${roleClean === 'admin'}`);
    Logger.log(`  É analista? ${roleClean === 'analista'}`);
    Logger.log(`  É entrevistador? ${roleClean === 'entrevistador'}`);
  }
  Logger.log('═'.repeat(60));
}
```

Copie a saída e envie para análise.

---

**FIM DO GUIA**
