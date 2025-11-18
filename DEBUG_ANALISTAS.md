# Guia de Debug - Analistas não aparecem

## Problema
Os analistas não estão sendo retornados quando o AdminDashboard tenta carregar a lista de analistas.

## Verificações Realizadas

### 1. Frontend (userService.ts)
O código já possui logs detalhados para debug:
- ✅ Logs na chamada do Google Apps Script
- ✅ Logs do resultado recebido
- ✅ Suporte para múltiplas estruturas de resposta
- ✅ Tratamento de erros adequado

### 2. Google Apps Script (getAnalysts)
Foi adicionado logging completo:
- ✅ Log de início da busca
- ✅ Log de cada linha da planilha USUARIOS
- ✅ Log do role antes e depois da normalização
- ✅ Log de analistas encontrados
- ✅ Log do total e do resultado final

## Passos para Debug

### Passo 1: Verificar a Planilha USUARIOS

1. Abra a planilha no Google Sheets
2. Vá para a aba **USUARIOS**
3. Verifique a estrutura:

```
| Email              | Nome      | Role     | ID                 |
|--------------------|-----------|----------|--------------------|
| admin@email.com    | Admin     | admin    | admin@email.com    |
| analista@email.com | Analista  | analista | analista@email.com |
```

**Pontos de atenção:**
- A coluna **Role** (coluna C) deve ter exatamente o texto `analista` (sem espaços extras)
- Não pode ter acentos: `analista` e não `análista`
- Deve estar em minúsculas ou o script vai normalizar

### Passo 2: Executar o Google Apps Script Manualmente

1. Abra o Editor do Apps Script
2. No menu superior, selecione a função `getAnalysts`
3. Clique em **Executar**
4. Vá em **Execuções** (ícone de relógio) para ver os logs
5. Procure por:
   - Total de linhas encontradas
   - Cada usuário sendo processado
   - Roles encontradas
   - Total de analistas retornados

### Passo 3: Verificar Logs do Frontend

1. Abra o Console do navegador (F12)
2. Limpe o console
3. No AdminDashboard, vá para a aba "Alocação"
4. Procure por logs que começam com `[UserService]`:

```
🔄 [UserService] Chamando Google Apps Script: getAnalysts
📦 [UserService] Payload: {action: "getAnalysts"}
📡 [UserService] Resposta recebida - Status: 200
✅ [UserService] Dados recebidos: {...}
```

### Passo 4: Verificar a Resposta do Google Apps Script

No console, procure pelo log:
```
📥 Resultado completo de getAnalysts:
```

A estrutura esperada é:
```json
{
  "success": true,
  "data": {
    "analysts": [
      {
        "id": "analista@email.com",
        "email": "analista@email.com",
        "name": "Analista",
        "role": "analista",
        "active": true
      }
    ]
  }
}
```

## Soluções Comuns

### Problema 1: Role escrita errada
**Sintoma:** Logs mostram roles como "Analista", "ANALISTA", ou com espaços

**Solução:**
1. Na planilha USUARIOS, edite a coluna Role
2. Certifique-se que está escrito exatamente: `analista` (minúscula, sem acentos)

### Problema 2: Aba USUARIOS não existe
**Sintoma:** Erro no Apps Script dizendo que a aba não foi encontrada

**Solução:**
1. Execute a função `initUsuariosSheet()` no Apps Script
2. Isso criará a aba automaticamente com usuários padrão

### Problema 3: Estrutura da resposta incorreta
**Sintoma:** Frontend recebe os dados mas não consegue extrair os analistas

**Solução:** O código já trata múltiplas estruturas, mas verifique se:
- `result.success` é `true`
- `result.data.analysts` existe e é um array

### Problema 4: CORS ou erro de rede
**Sintoma:** Erro 403, 404 ou erro de CORS no console

**Solução:**
1. Verifique se a URL do Google Apps Script está correta no `.env`
2. Certifique-se que o script foi implantado como "Web app"
3. Verifique se o acesso está configurado como "Qualquer pessoa"

## Teste Rápido

Execute este código no console do navegador para testar diretamente:

```javascript
// 1. Verificar URL configurada
console.log('URL:', import.meta.env.VITE_GOOGLE_SCRIPT_URL);

// 2. Testar chamada direta
fetch('SUA_URL_DO_GOOGLE_SCRIPT', {
  method: 'POST',
  mode: 'cors',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: JSON.stringify({ action: 'getAnalysts' })
})
.then(r => r.json())
.then(data => console.log('Resposta:', data))
.catch(err => console.error('Erro:', err));
```

## Criando um Analista Manualmente

Se a aba USUARIOS estiver vazia ou com problemas:

1. Abra a planilha
2. Vá para aba USUARIOS
3. Adicione uma nova linha:
   - **Coluna A (Email):** seuemail@exemplo.com
   - **Coluna B (Nome):** Seu Nome
   - **Coluna C (Role):** analista
   - **Coluna D (ID):** seuemail@exemplo.com

4. Salve e teste novamente

## Verificação Final

Depois de fazer as correções:

1. Recarregue a página do sistema
2. Faça login como admin
3. Vá para aba "Alocação"
4. Clique em "Recarregar Analistas" (botão com ícone de refresh)
5. Verifique se os analistas aparecem na lista

## Ainda não funciona?

Se após todas as verificações ainda não funcionar:

1. Copie TODOS os logs do console do navegador
2. Copie os logs do Google Apps Script (em Execuções)
3. Verifique se há alguma mensagem de erro específica
4. Tire um screenshot da aba USUARIOS mostrando a estrutura
