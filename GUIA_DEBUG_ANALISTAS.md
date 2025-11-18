# Guia de Debug - Problema com Analistas Não Retornando

## Problema

O AdminDashboard não está retornando os analistas cadastrados após a migração para POST.

## Diagnóstico

O sistema agora possui logs detalhados para identificar exatamente onde está o problema.

---

## Passos de Debug

### 1. Abrir o Console do Navegador

1. Pressione **F12** para abrir DevTools
2. Vá para a aba **Console**
3. Recarregue a página do AdminDashboard
4. Procure por logs relacionados a "analistas"

---

### 2. Logs Esperados

Você verá uma sequência de logs como esta:

```
🔄 [UserService] Chamando Google Apps Script: getAnalysts
📦 [UserService] Payload: { action: "getAnalysts" }
📡 [UserService] Resposta recebida - Status: 200
✅ [UserService] Dados recebidos: { success: true, data: { analysts: [...] } }
🔍 Buscando analistas...
📥 Resultado completo de getAnalysts: {
  "success": true,
  "data": {
    "analysts": [
      {
        "id": "analista@email.com",
        "email": "analista@email.com",
        "name": "Analista Teste",
        "role": "analista",
        "active": true
      }
    ]
  }
}
📦 Estrutura detectada: { success: true, data: { analysts: [...] } }
✅ Analistas extraídos: [...]
📊 Total de analistas: 1
✅ Analistas mapeados: [...]
✅ Analistas carregados: [...]
```

---

### 3. Possíveis Problemas e Soluções

#### Problema 1: Erro CORS

**Sintoma:**
```
Access to fetch at '...' has been blocked by CORS policy
```

**Causa:** O Google Apps Script não está aceitando POST

**Solução:**
1. Verifique se o Google Apps Script tem a função `doPost(e)`
2. Verifique se o script está implantado corretamente
3. O script **JÁ DEVE TER** `doPost`, então pode ser um problema de cache

**Ação imediata:**
- Limpe o cache do navegador (Ctrl+Shift+Delete)
- Recarregue a página (Ctrl+F5)

---

#### Problema 2: Estrutura de Dados Diferente

**Sintoma:**
```
⚠️ Estrutura de dados inesperada: {...}
⚠️ Nenhum analista encontrado
```

**Causa:** O Google Apps Script está retornando uma estrutura diferente da esperada

**Solução:**
1. Copie o objeto completo do log `📥 Resultado completo de getAnalysts`
2. Envie para análise
3. Podemos adicionar suporte para essa estrutura

---

#### Problema 3: Nenhum Analista na Planilha

**Sintoma:**
```
✅ Analistas extraídos: []
📊 Total de analistas: 0
⚠️ Nenhum analista encontrado. Verifique:
   1. Se há usuários com role "analista" na aba USUARIOS
```

**Causa:** Não há usuários com role "analista" cadastrados

**Solução:**
1. Abra a planilha: https://docs.google.com/spreadsheets/d/1iQSQ06P_OXkqxaGWN3uG5jRYFBKyjWqQyvzuGk2EplY
2. Vá para a aba **USUARIOS**
3. Verifique se existe pelo menos uma linha com:
   - Coluna `Role` = `analista` (exatamente assim, minúsculo)
4. Se não existir, adicione um usuário analista:

| Email | Nome | Role | ID |
|-------|------|------|-----|
| analista@email.com | Analista Teste | analista | analista@email.com |

---

#### Problema 4: Erro HTTP 500

**Sintoma:**
```
❌ [UserService] Erro na resposta: Erro HTTP 500
```

**Causa:** Erro no Google Apps Script

**Solução:**
1. Acesse o Google Apps Script
2. Vá em **Execuções** (menu lateral)
3. Veja o log de erro da última execução
4. Procure por erros relacionados a `getAnalysts`

**Possíveis erros no script:**
- Planilha não encontrada
- Aba USUARIOS não existe
- Permissões insuficientes

---

### 4. Testando o Google Apps Script Diretamente

Se suspeitar que o problema está no Google Apps Script:

1. Acesse: https://script.google.com/home/projects/1HYxA8oL_IWjEJz4qPbnK9uGwSDu2g9GaSXMK9IZ2WYxRcbRUdVSZx2Fq

2. Cole este código de teste:

```javascript
function testGetAnalysts() {
  const result = getAnalysts({});
  Logger.log('📦 Resultado de getAnalysts:');
  Logger.log(JSON.stringify(result, null, 2));

  if (result.analysts && result.analysts.length > 0) {
    Logger.log('✅ Sucesso! Total de analistas: ' + result.analysts.length);
    result.analysts.forEach((analyst, index) => {
      Logger.log(`  ${index + 1}. ${analyst.name} (${analyst.email})`);
    });
  } else {
    Logger.log('❌ Nenhum analista encontrado');
  }
}
```

3. Execute a função `testGetAnalysts`
4. Veja os logs em **Execuções** > **Ver logs**

---

### 5. Verificando a Requisição POST

Use a aba **Network** do DevTools:

1. Abra DevTools (F12)
2. Vá para aba **Network**
3. Filtre por "Fetch/XHR"
4. Recarregue a página
5. Procure pela requisição para o Google Apps Script
6. Clique nela e verifique:

**Request:**
- **Method:** Deve ser `POST`
- **Request Headers:** Deve ter `Content-Type: application/json`
- **Request Payload:**
```json
{
  "action": "getAnalysts"
}
```

**Response:**
- **Status:** Deve ser `200 OK`
- **Response Headers:** Deve ter `Access-Control-Allow-Origin`
- **Response Body:**
```json
{
  "success": true,
  "data": {
    "analysts": [...]
  }
}
```

---

### 6. Verificação da Aba USUARIOS

A aba deve ter este formato **EXATO**:

| Email | Nome | Role | ID |
|-------|------|------|-----|
| admin@email.com | Administrador | admin | admin@email.com |
| analista@email.com | Analista | analista | analista@email.com |

**IMPORTANTE:**
- Coluna `Role` deve ter valor **"analista"** (tudo minúsculo)
- Não pode ter espaços extras
- Não pode ter acentuação diferente
- Se estiver como "Analista" (com A maiúsculo), o código normaliza para minúsculo

---

## Solução Rápida: Adicionar Analista Manualmente

Se não houver analistas, adicione um:

1. Abra a planilha
2. Aba **USUARIOS**
3. Adicione uma nova linha:

```
Email: teste.analista@gmail.com
Nome: Analista Teste
Role: analista
ID: teste.analista@gmail.com
```

4. Salve
5. Volte ao sistema
6. Clique em "Recarregar Analistas"

---

## Código de Verificação Manual

Cole este código no console do navegador para testar:

```javascript
// Teste 1: Verificar URL do script
console.log('URL do script:', import.meta.env.VITE_GOOGLE_SCRIPT_URL);

// Teste 2: Fazer requisição direta
fetch('SEU_SCRIPT_URL_AQUI', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ action: 'getAnalysts' })
})
.then(res => res.json())
.then(data => {
  console.log('✅ Resposta:', data);
  if (data.success && data.data && data.data.analysts) {
    console.log('✅ Analistas:', data.data.analysts);
  }
})
.catch(err => console.error('❌ Erro:', err));
```

---

## Checklist de Verificação

- [ ] Google Apps Script está implantado?
- [ ] Aba USUARIOS existe na planilha?
- [ ] Existe pelo menos um usuário com role "analista"?
- [ ] Role está escrito corretamente (minúsculo)?
- [ ] URL do script está correta no .env?
- [ ] Requisição está sendo feita via POST?
- [ ] Console mostra logs de debug?
- [ ] Network tab mostra status 200?
- [ ] Resposta JSON tem estrutura { success: true, data: { analysts: [...] } }?

---

## Informações para Suporte

Se o problema persistir, envie estas informações:

1. **Console logs completos** (copie tudo)
2. **Network tab** (screenshot da requisição e resposta)
3. **Estrutura da aba USUARIOS** (screenshot das primeiras linhas)
4. **Logs do Google Apps Script** (se acessível)
5. **Mensagem de erro** (se houver)

---

## Melhorias Implementadas

Para facilitar o debug, foram adicionados:

✅ Logs detalhados em cada etapa do processo
✅ Tratamento de múltiplas estruturas de dados
✅ Mensagens de erro descritivas
✅ Verificação de estrutura de dados
✅ Botão "Recarregar Analistas" no AdminDashboard
✅ Indicador visual de carregamento
✅ Mensagens de erro amigáveis na UI

---

## Logs Detalhados Implementados

### No userService.ts:
- ✅ Log da requisição sendo feita
- ✅ Log do payload enviado
- ✅ Log da resposta completa (JSON formatado)
- ✅ Log da estrutura detectada
- ✅ Log dos analistas extraídos
- ✅ Log dos analistas mapeados
- ✅ Warnings detalhados se não encontrar analistas

### No GoogleSheetsService:
- ✅ Log da ação sendo chamada
- ✅ Log do payload
- ✅ Log do status da resposta
- ✅ Log da resposta completa

---

## Próximos Passos

1. Recarregue a página do AdminDashboard
2. Abra o console (F12)
3. Veja os logs
4. Identifique qual dos problemas acima está acontecendo
5. Siga a solução correspondente

Se os logs mostrarem que os analistas estão sendo retornados mas não aparecem na UI, o problema pode estar no componente AssignmentPanel. Nesse caso, me avise com os logs completos.
