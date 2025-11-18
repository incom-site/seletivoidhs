# Solução - Analistas Não Aparecem no AdminDashboard

## Problema Identificado
Os analistas não estão sendo retornados quando o sistema tenta carregar a lista para alocação de candidatos.

## Alterações Realizadas

### 1. Google Apps Script - Logs Adicionados
**Arquivo:** `google-apps-script-COMPLETO-FINAL.js`

Adicionados logs detalhados na função `getAnalysts()`:
- Log do total de linhas na planilha
- Log de cada usuário processado
- Log do role antes e depois da normalização
- Log do total de analistas encontrados
- Log do JSON retornado

### 2. Documentação de Debug
**Arquivo:** `DEBUG_ANALISTAS.md`

Criado guia completo com:
- Verificações a fazer na planilha
- Como executar debug no Apps Script
- Como verificar logs no frontend
- Soluções para problemas comuns
- Teste rápido via console do navegador

### 3. Script de Teste
**Arquivo:** `TESTE_ANALISTAS_APPS_SCRIPT.js`

Criado script completo para testar no Google Apps Script:
- `testGetAnalysts()` - Testa e exibe todos os detalhes
- `addAnalyst(email, name)` - Adiciona um analista manualmente
- `resetUsuariosSheet()` - Recria a aba USUARIOS do zero

## Como Resolver

### Opção 1: Verificar Planilha Manualmente

1. Abra a planilha do Google Sheets
2. Vá para a aba **USUARIOS**
3. Certifique-se que a estrutura está assim:

```
| Email                  | Nome           | Role     | ID                     |
|------------------------|----------------|----------|------------------------|
| admin@email.com        | Admin          | admin    | admin@email.com        |
| analista1@email.com    | Analista Um    | analista | analista1@email.com    |
```

**IMPORTANTE:**
- A coluna "Role" deve ter o texto exatamente como: `analista`
- Sem acentos: `analista` e NÃO `análista`
- Minúscula (o script normaliza, mas melhor já estar correto)

### Opção 2: Usar Script de Teste

1. Abra o Editor do Google Apps Script
2. Copie o conteúdo de `TESTE_ANALISTAS_APPS_SCRIPT.js`
3. Cole no editor
4. Execute a função `testGetAnalysts()`
5. Vá em "Execuções" para ver os logs detalhados

Se não houver analistas ou a aba não existir, execute:
```javascript
resetUsuariosSheet()
```

Isso irá criar/recriar a aba com usuários padrão incluindo 2 analistas.

### Opção 3: Adicionar Analista via Script

No Editor do Apps Script, execute:
```javascript
addAnalyst('seuemail@exemplo.com', 'Seu Nome')
```

### Opção 4: Verificar Logs do Frontend

1. Abra o navegador (Chrome/Firefox)
2. Pressione F12 para abrir o Console
3. Faça login como admin
4. Vá para aba "Alocação"
5. Clique em "Recarregar Analistas"
6. Verifique os logs que começam com `[UserService]`

Os logs vão mostrar:
- URL chamada
- Payload enviado
- Resposta recebida
- Estrutura dos dados
- Analistas extraídos

## Checklist de Verificação

- [ ] A aba USUARIOS existe na planilha?
- [ ] O cabeçalho está correto (Email, Nome, Role, ID)?
- [ ] Há pelo menos um usuário com role "analista"?
- [ ] O texto na coluna Role é exatamente "analista"?
- [ ] Executou `testGetAnalysts()` no Apps Script?
- [ ] Verificou os logs do Apps Script?
- [ ] Verificou os logs do Console do navegador?
- [ ] A URL do Google Apps Script está correta no .env?

## Estrutura Esperada da Resposta

O Google Apps Script deve retornar:

```json
{
  "success": true,
  "data": {
    "analysts": [
      {
        "id": "analista@email.com",
        "email": "analista@email.com",
        "name": "Analista Nome",
        "role": "analista",
        "active": true
      }
    ]
  }
}
```

O frontend está preparado para múltiplas estruturas, mas esta é a ideal.

## Após Resolver

Depois de corrigir o problema:

1. Recarregue a página do sistema
2. Faça login como admin
3. Vá para "Alocação"
4. Clique em "Recarregar Analistas"
5. Os analistas devem aparecer no dropdown

Se aparecerem, você pode:
- Selecionar candidatos na lista
- Escolher um analista no dropdown
- Clicar em "Alocar Candidatos"

## Prevenção de Problemas Futuros

### Ao adicionar novos analistas:

1. Na planilha USUARIOS, adicione uma nova linha com:
   - Email do usuário
   - Nome do usuário
   - Role: **analista** (exatamente assim)
   - ID: mesmo valor do email

2. Ou use o script:
```javascript
addAnalyst('novo@email.com', 'Nome do Novo Analista')
```

### Padronização:

Sempre use:
- ✅ `analista` (correto)
- ❌ `Analista` (funciona, mas não é padrão)
- ❌ `ANALISTA` (funciona, mas não é padrão)
- ❌ `análista` (não funciona - tem acento)
- ❌ `analista ` (não funciona - tem espaço extra)

## Suporte Adicional

Se o problema persistir após seguir todas as etapas:

1. Execute `testGetAnalysts()` no Apps Script
2. Copie TODOS os logs da execução
3. Abra o console do navegador
4. Copie TODOS os logs do console
5. Tire um screenshot da aba USUARIOS
6. Compartilhe essas informações para análise detalhada

Os logs vão revelar exatamente onde está o problema.
