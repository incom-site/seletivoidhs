# 🔍 Diagnóstico: "user não encontrado em data"

## 🎯 Problema

O erro mostra que `getUserRole` está retornando:
```json
{
  "success": true,
  "data": null
}
```

Isso significa que a função `getUserRole` retornou `{ role: null, user: null }`, que foi colocado em `data`.

---

## 🔎 Possíveis Causas

### 1. **Email não existe na planilha USUARIOS**
- O email que você está tentando usar no login não está cadastrado
- Ou está escrito diferente (maiúsculas/minúsculas, espaços)

### 2. **Usuário está marcado como inativo**
- A coluna `active` está com valor `FALSE`, `false`, `Não`, ou vazia

### 3. **Planilha USUARIOS está vazia**
- Não tem nenhum usuário cadastrado

### 4. **Colunas da planilha com nomes errados**
- Falta a coluna `email`, `name`, `role`, ou `active`
- Nomes das colunas com espaços ou acentos

---

## 🧪 Como Diagnosticar

### PASSO 1: Executar Teste no Google Apps Script

1. Abra seu Google Apps Script: https://script.google.com
2. Crie um novo arquivo (clique em `+` ao lado de "Arquivos")
3. Cole o conteúdo do arquivo: **`TESTE_GETUSERROLE.js`**
4. Salve (Ctrl+S)
5. Selecione a função: **`testeGetUserRole`**
6. Clique em **Executar** (▶)
7. Vá em **Execuções** (menu lateral esquerdo)
8. Clique na execução mais recente
9. **Copie TODOS os logs e me envie**

### PASSO 2: Verificar Planilha USUARIOS

Abra sua planilha e verifique:

#### Estrutura esperada (linha 1 - headers):
```
| email              | name          | role      | active |
|--------------------|---------------|-----------|--------|
| admin@teste.com    | Admin Sistema | admin     | TRUE   |
| analista@teste.com | João Silva    | analista  | TRUE   |
```

#### ⚠️ Problemas Comuns:

**❌ ERRADO:**
```
| Email              | Nome          | Papel     | Ativo  |  ← Nomes em português
| email              |               | role      | active |  ← Coluna 'name' vazia
|  admin@teste.com   | Admin         |  admin    |  TRUE  |  ← Espaços extras
| ANALISTA@TESTE.COM | João          | Analista  | TRUE   |  ← Maiúsculas (ok, é normalizado)
```

**✅ CORRETO:**
```
| email              | name          | role      | active |
| admin@teste.com    | Admin Sistema | admin     | TRUE   |
| analista@teste.com | João Silva    | analista  | TRUE   |
```

### PASSO 3: Verificar Email no Login

Quando você tenta fazer login, qual email está usando?

**Importante:**
- O email é convertido para lowercase automaticamente
- Espaços são removidos
- `Analista@Teste.COM` vira `analista@teste.com`

### PASSO 4: Verificar Logs Detalhados

Com as alterações que fiz, quando você tentar fazer login novamente, verá logs MUITO mais detalhados:

```
═══════════════════════════════════════════════════
🔎 getUserByEmail - INICIANDO
📧 Email solicitado: analista@teste.com
═══════════════════════════════════════════════════

📥 getUserByEmail - Resultado COMPLETO:
{
  "success": true,
  "data": null  ← AQUI ESTÁ O PROBLEMA!
}

❌ result.data é null ou undefined
   Isso significa que getUserRole retornou { role: null, user: null }
   Possíveis causas:
   1. Email não encontrado na planilha USUARIOS
   2. Usuário está inativo
   3. Erro ao ler a planilha
```

---

## 🔧 Soluções

### Solução 1: Adicionar Usuário na Planilha

1. Abra a planilha USUARIOS
2. Adicione uma nova linha:
   ```
   email: analista@teste.com
   name: Analista Teste
   role: analista
   active: TRUE
   ```
3. Salve
4. Aguarde 10 segundos (cache)
5. Tente fazer login novamente

### Solução 2: Ativar Usuário Existente

Se o usuário já existe mas está inativo:
1. Encontre a linha do usuário
2. Mude a coluna `active` para `TRUE`
3. Salve
4. Aguarde 10 segundos
5. Tente novamente

### Solução 3: Corrigir Email

Se o email está escrito diferente:
1. Copie o email EXATAMENTE como está na planilha
2. Use esse email no login
3. **OU** corrija o email na planilha para o que você quer usar

### Solução 4: Verificar Estrutura da Planilha

Execute o teste `testeGetUserRole` e veja os logs:
```
📋 Headers: email, name, role, active
📊 Total de linhas: 3

👤 Usuário 1:
   email: "admin@teste.com"
   name: "Admin Sistema"
   role: "admin"
   active: "TRUE"
```

Se os headers estiverem errados, renomeie as colunas.

---

## 🧪 Código de Teste Rápido (Console do Navegador)

Cole este código no Console (F12) para testar a conexão:

```javascript
// Teste 1: Verificar se o script responde
fetch('https://script.google.com/macros/s/AKfycbwbr9Vm-EJxPTxGEP12UtwWfeKTGU1LsCjnHxQzkY8a9AOOozLNeDKGcflIknT5_FOq/exec?action=testConnection')
  .then(r => r.json())
  .then(d => {
    console.log('✅ Script respondeu:');
    console.log(d);
  })
  .catch(e => {
    console.error('❌ Erro:', e);
  });
```

```javascript
// Teste 2: Testar getUserRole com seu email
fetch('https://script.google.com/macros/s/AKfycbwbr9Vm-EJxPTxGEP12UtwWfeKTGU1LsCjnHxQzkY8a9AOOozLNeDKGcflIknT5_FOq/exec?action=getUserRole&email=SEUEMAIL@AQUI.COM')
  .then(r => r.json())
  .then(d => {
    console.log('═'.repeat(60));
    console.log('📥 Resposta getUserRole:');
    console.log(JSON.stringify(d, null, 2));
    console.log('═'.repeat(60));

    if (d.success && d.data && d.data.user) {
      console.log('✅ USUÁRIO ENCONTRADO!');
      console.log('   Email:', d.data.user.email);
      console.log('   Nome:', d.data.user.name);
      console.log('   Role:', d.data.user.role);
    } else if (d.success && !d.data) {
      console.log('❌ USUÁRIO NÃO ENCONTRADO OU INATIVO');
      console.log('');
      console.log('🔍 VERIFICAÇÕES:');
      console.log('   1. O email existe na planilha USUARIOS?');
      console.log('   2. A coluna active está como TRUE?');
      console.log('   3. O email está escrito corretamente?');
    } else {
      console.log('❌ ERRO:', d.error);
    }
  })
  .catch(e => {
    console.error('❌ Erro na requisição:', e);
  });
```

**Substitua `SEUEMAIL@AQUI.COM` pelo email que você está tentando usar!**

---

## 📋 Checklist de Verificação

Antes de tentar novamente:

- [ ] Planilha USUARIOS existe
- [ ] Planilha tem as colunas: `email`, `name`, `role`, `active`
- [ ] Existe pelo menos 1 usuário cadastrado
- [ ] Coluna `active` do usuário está como `TRUE`
- [ ] Email do usuário está correto (sem espaços extras)
- [ ] Role do usuário está preenchida (`admin`, `analista`, ou `entrevistador`)
- [ ] Executei o teste `testeGetUserRole` no Apps Script
- [ ] Li os logs do teste
- [ ] Script está implantado corretamente

---

## 🆘 Próximos Passos

1. **Execute o teste**: `testeGetUserRole` no Google Apps Script
2. **Copie os logs completos** e me envie
3. **Tire um print** da planilha USUARIOS (primeiras 3 linhas)
4. **Execute o teste no Console** do navegador e me envie o resultado

Com essas informações consigo identificar exatamente o problema!

---

## 📝 Exemplo de Planilha USUARIOS Correta

```
┌───────────────────────┬──────────────────┬────────────┬────────┐
│ email                 │ name             │ role       │ active │
├───────────────────────┼──────────────────┼────────────┼────────┤
│ admin@hospital.com    │ Admin Sistema    │ admin      │ TRUE   │
│ analista1@hospital.com│ João Silva       │ analista   │ TRUE   │
│ analista2@hospital.com│ Maria Santos     │ analista   │ TRUE   │
│ entrev@hospital.com   │ Carlos Lima      │entrevistador│ TRUE   │
└───────────────────────┴──────────────────┴────────────┴────────┘
```

**IMPORTANTE:**
- Linha 1 = Headers (exatamente como mostrado)
- Linha 2+ = Dados dos usuários
- Sem linhas vazias entre os usuários
- Sem espaços extras nas células
