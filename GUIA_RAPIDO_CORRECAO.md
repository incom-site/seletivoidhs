# Guia Rápido - Correção do Problema de Analistas

## ✅ O Que Foi Feito

### 1. Logs Melhorados
- **Google Apps Script:** Função `getAnalysts()` com logs completos
- **Frontend:** `AssignmentPanel.tsx` com logs detalhados
- **UserService:** Já tinha logs extensivos

### 2. Ferramentas de Debug Criadas
- `TESTE_ANALISTAS_APPS_SCRIPT.js` - Teste no Google Apps Script
- `TESTE_ANALISTAS_FRONTEND.html` - Teste direto no navegador
- `DEBUG_ANALISTAS.md` - Guia completo de debug
- `SOLUCAO_PROBLEMA_ANALISTAS.md` - Soluções detalhadas

## 🚀 Como Resolver AGORA

### Passo 1: Teste Rápido no Navegador
1. Abra o arquivo `TESTE_ANALISTAS_FRONTEND.html` no navegador
2. Cole a URL do seu Google Apps Script
3. Clique em "Buscar Analistas"
4. Veja o resultado detalhado

**Resultado esperado:**
```json
{
  "success": true,
  "data": {
    "analysts": [
      {
        "id": "analista@email.com",
        "email": "analista@email.com",
        "name": "Nome do Analista",
        "role": "analista",
        "active": true
      }
    ]
  }
}
```

### Passo 2: Verificar a Planilha
Abra a planilha e vá para aba **USUARIOS**:

✅ **CORRETO:**
```
| Email               | Nome      | Role     | ID                  |
|---------------------|-----------|----------|---------------------|
| analista@email.com  | Analista  | analista | analista@email.com  |
```

❌ **INCORRETO:**
- Role com "Analista" (maiúscula)
- Role com "análista" (com acento)
- Role com espaços extras
- Aba USUARIOS não existe

### Passo 3: Teste no Apps Script
1. Abra o Editor do Google Apps Script
2. Copie o código de `TESTE_ANALISTAS_APPS_SCRIPT.js`
3. Execute a função `testGetAnalysts()`
4. Verifique os logs em "Execuções"

**Se não houver analistas:**
Execute no Apps Script:
```javascript
resetUsuariosSheet()
```

Isso criará a aba com usuários padrão.

### Passo 4: Verificar no Sistema
1. Faça login como admin
2. Vá para aba "Alocação"
3. Clique em "Recarregar Analistas"
4. Abra o Console (F12)
5. Veja os logs detalhados

## 🔍 O Que Procurar nos Logs

### Console do Navegador
```
========================================
📋 [AssignmentPanel] Iniciando carregamento de analistas...
========================================
🔄 [UserService] Chamando Google Apps Script: getAnalysts
📦 [UserService] Payload: {action: "getAnalysts"}
📡 [UserService] Resposta recebida - Status: 200
✅ [UserService] Dados recebidos: {...}
📊 [AssignmentPanel] Total de analistas: 2
✅ [AssignmentPanel] Analistas recebidos: [...]
========================================
```

### Google Apps Script (Execuções)
```
🔍 getAnalysts - Iniciando busca de analistas
📊 Total de linhas na planilha USUARIOS: 3
👤 Linha 2:
   Email: analista@email.com
   Nome: Analista
   Role (raw): "analista"
   Role (normalized): "analista"
✅ Analista encontrado: analista@email.com
📋 Total de analistas encontrados: 1
```

## 🎯 Solução Rápida

**Se você só quer resolver rápido:**

1. Execute no Google Apps Script:
```javascript
function resetUsuariosSheet() {
  const SPREADSHEET_ID = '1iQSQ06P_OXkqxaGWN3uG5jRYFBKyjWqQyvzuGk2EplY';
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('USUARIOS');
  if (sheet) ss.deleteSheet(sheet);

  sheet = ss.insertSheet('USUARIOS');
  sheet.getRange('A1:D1').setValues([['Email', 'Nome', 'Role', 'ID']]);
  sheet.getRange('A2:D3').setValues([
    ['admin@email.com', 'Admin', 'admin', 'admin@email.com'],
    ['analista@email.com', 'Analista', 'analista', 'analista@email.com']
  ]);
}
```

2. Execute a função acima
3. Recarregue o sistema
4. Vá para "Alocação" e clique em "Recarregar Analistas"

## 📝 Checklist Final

- [ ] Executei `testGetAnalysts()` no Apps Script?
- [ ] Os logs mostram analistas encontrados?
- [ ] A aba USUARIOS existe e tem dados?
- [ ] A coluna Role tem "analista" corretamente?
- [ ] Testei no navegador com `TESTE_ANALISTAS_FRONTEND.html`?
- [ ] O Console mostra os analistas sendo carregados?
- [ ] Os analistas aparecem no dropdown de alocação?

## ❓ Ainda Não Funciona?

Se após todos esses passos ainda não funcionar:

1. **Copie os logs do Console do navegador**
2. **Copie os logs do Google Apps Script**
3. **Tire um screenshot da aba USUARIOS**
4. **Compartilhe essas informações**

Os logs irão revelar exatamente qual é o problema.

## 🎉 Quando Funcionar

Você verá:
- Analistas listados no dropdown de alocação
- Número correto de analistas na seção "Carga de Trabalho"
- Possibilidade de alocar candidatos para analistas

Pronto! Sistema funcionando.
