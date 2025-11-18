# Diagnóstico: Candidatos não aparecem na tela

## 🔍 Problema

A tela do admin está retornando vazio, não mostra os candidatos da planilha.

## 🎯 Logs Adicionados

Adicionei logs detalhados em vários pontos:

### 1. Google Apps Script - getCandidates()
```
⚠️ Aba CANDIDATOS não encontrada! (se a aba não existir)
⚠️ Aba CANDIDATOS vazia (se não houver dados)
📋 Cabeçalhos encontrados: ...
📊 Total de linhas (incluindo cabeçalho): ...
✅ Total de candidatos processados: ...
```

### 2. Frontend - candidateService.getCandidates()
```
📞 Chamando getCandidates do Google Sheets...
🔄 Chamando Google Apps Script: [URL]
📡 Resposta recebida - Status: 200
✅ Dados recebidos: {...}
📥 Resultado completo recebido: {...}
📊 result.data: {...}
📊 result.data?.candidates: [...]
✅ Array de candidatos extraído: [...]
📏 Total de candidatos: X
👤 Exemplo do primeiro candidato: {...}
```

## 🧪 Como Diagnosticar

### Passo 1: Verificar a Aba CANDIDATOS na Planilha

1. Abra a planilha do Google Sheets
2. Verifique se existe uma aba chamada **CANDIDATOS** (exatamente com esse nome, em maiúsculas)
3. Verifique se a aba tem dados:
   - Linha 1: Cabeçalho com os nomes das colunas
   - Linha 2+: Dados dos candidatos

#### Estrutura Mínima Esperada:

```
| CPF          | NOMECOMPLETO    | AREAATUACAO    | CARGOPRETENDIDO | VAGAPCD | Status   |
|--------------|-----------------|----------------|-----------------|---------|----------|
| 12345678900  | João Silva      | Administrativa | Assistente      | Não     | pendente |
| 98765432100  | Maria Santos    | Assistencial   | Enfermeiro      | Sim     | pendente |
```

**Colunas Obrigatórias**:
- `CPF` - Identificador único
- `NOMECOMPLETO` - Nome do candidato
- `AREAATUACAO` - Área de atuação
- `CARGOPRETENDIDO` - Cargo pretendido
- `VAGAPCD` - Se é vaga PCD (Sim/Não)
- `Status` - Status da candidatura (pendente/em_analise/concluido)

### Passo 2: Testar o Google Apps Script

1. Abra o editor do Google Apps Script
2. Execute esta função de teste:

```javascript
function testGetCandidates() {
  Logger.log('====== TESTE GET CANDIDATES ======');

  const result = getCandidates({});

  Logger.log('Resultado:');
  Logger.log(JSON.stringify(result, null, 2));

  Logger.log('Total de candidatos:');
  Logger.log(result.candidates ? result.candidates.length : 0);

  if (result.candidates && result.candidates.length > 0) {
    Logger.log('Primeiro candidato:');
    Logger.log(JSON.stringify(result.candidates[0], null, 2));
  }

  Logger.log('================================');
}
```

3. Veja os logs (View > Logs ou Ctrl/Cmd + Enter)

**O que deve aparecer**:
```
====== TESTE GET CANDIDATES ======
📋 Cabeçalhos encontrados: CPF, NOMECOMPLETO, AREAATUACAO, ...
📊 Total de linhas (incluindo cabeçalho): 10
✅ Total de candidatos processados: 9
Resultado:
{
  "candidates": [
    { "CPF": "12345678900", "NOMECOMPLETO": "João Silva", ... },
    ...
  ]
}
Total de candidatos: 9
Primeiro candidato:
{ "CPF": "12345678900", "NOMECOMPLETO": "João Silva", ... }
================================
```

### Passo 3: Verificar no Frontend

1. Abra o sistema no navegador
2. Abra o Console (F12)
3. Faça login como admin
4. Vá na aba "Alocação" ou "Meus Candidatos"
5. Observe os logs

**Logs esperados**:
```
📞 Chamando getCandidates do Google Sheets...
🔄 Chamando Google Apps Script: https://script.google.com/...
📡 Resposta recebida - Status: 200
✅ Dados recebidos: {success: true, data: {candidates: [...]}}
📥 Resultado completo recebido: {success: true, data: {candidates: [...]}}
📊 result.data: {candidates: [...]}
📊 result.data?.candidates: [{...}, {...}, ...]
✅ Array de candidatos extraído: [{...}, {...}, ...]
📏 Total de candidatos: 9
👤 Exemplo do primeiro candidato: {CPF: "12345678900", ...}
```

## 🔧 Possíveis Problemas e Soluções

### Problema 1: Aba CANDIDATOS não existe

**Sintoma**:
```
⚠️ Aba CANDIDATOS não encontrada!
```

**Solução**:
1. Crie uma aba chamada **CANDIDATOS** (maiúsculas)
2. Adicione os cabeçalhos na primeira linha
3. Adicione alguns dados de teste

### Problema 2: Aba CANDIDATOS vazia

**Sintoma**:
```
⚠️ Aba CANDIDATOS vazia (apenas cabeçalho ou sem dados)
📏 Total de candidatos: 0
```

**Solução**:
1. Adicione pelo menos uma linha de dados abaixo do cabeçalho
2. Certifique-se de que a linha 1 tem os cabeçalhos
3. Certifique-se de que a linha 2+ tem dados

### Problema 3: Google Script não atualizado

**Sintoma**:
```
📥 Resultado completo recebido: [array direto sem objeto]
```

**Solução**:
1. Copie o código de `google-apps-script-updated.js`
2. Cole no editor do Apps Script
3. Salve
4. Teste novamente

### Problema 4: Erro de CORS ou rede

**Sintoma**:
```
❌ Erro na comunicação com Google Apps Script: ...
```

**Solução**:
1. Verifique se a URL do script está correta no `.env`
2. Verifique se o script foi publicado como Web App
3. Verifique se o acesso está configurado como "Anyone"

### Problema 5: Formato de dados incorreto

**Sintoma**:
```
📏 Total de candidatos: 0
(mas o script retornou dados)
```

**Solução**:
1. Verifique se o formato é: `{ success: true, data: { candidates: [...] } }`
2. Atualize o Google Apps Script com o código mais recente

## 📊 Estrutura de Dados Esperada

### Do Google Apps Script:
```json
{
  "success": true,
  "data": {
    "candidates": [
      {
        "CPF": "12345678900",
        "NOMECOMPLETO": "João Silva",
        "AREAATUACAO": "Administrativa",
        "CARGOPRETENDIDO": "Assistente",
        "VAGAPCD": "Não",
        "Status": "pendente"
      }
    ]
  }
}
```

### Processado pelo Frontend:
```json
[
  {
    "id": "12345678900",
    "CPF": "12345678900",
    "registration_number": "12345678900",
    "name": "João Silva",
    "NOMECOMPLETO": "João Silva",
    "AREAATUACAO": "Administrativa",
    "CARGOPRETENDIDO": "Assistente",
    "VAGAPCD": "Não",
    "status": "pendente",
    "assigned_to": null,
    "assigned_at": null,
    "assigned_by": null,
    "created_at": null,
    "updated_at": null
  }
]
```

## 🎯 Checklist Completo

- [ ] Aba CANDIDATOS existe na planilha (maiúsculas)
- [ ] Aba tem cabeçalho na linha 1
- [ ] Aba tem pelo menos uma linha de dados
- [ ] Colunas obrigatórias estão presentes (CPF, NOMECOMPLETO, etc)
- [ ] Google Apps Script está atualizado com o código mais recente
- [ ] Função testGetCandidates() retorna dados
- [ ] URL do script está correta no .env
- [ ] Script publicado como Web App
- [ ] Acesso configurado como "Anyone"
- [ ] Frontend mostra logs de candidatos no console
- [ ] Total de candidatos > 0 nos logs

## 🆘 Teste Rápido no Console do Navegador

Execute este código no console após fazer login:

```javascript
// Forçar reload dos candidatos
async function testCandidates() {
  console.log('====== TESTE DE CANDIDATOS ======');

  const scriptUrl = 'SUA_URL_DO_SCRIPT_AQUI';
  const url = new URL(scriptUrl);
  url.searchParams.append('action', 'getCandidates');

  console.log('URL:', url.toString());

  const response = await fetch(url.toString(), {
    method: 'GET',
    mode: 'cors',
    headers: { 'Accept': 'application/json' }
  });

  console.log('Status:', response.status);

  const result = await response.json();
  console.log('Resultado:', result);
  console.log('Candidatos:', result.data?.candidates || result.candidates);
  console.log('Total:', (result.data?.candidates || result.candidates || []).length);

  console.log('================================');
}

testCandidates();
```

**Substitua `SUA_URL_DO_SCRIPT_AQUI`** pela URL do seu Google Apps Script.

## 💡 Dica: Criar Dados de Teste

Se a aba estiver vazia, copie e cole isso na planilha:

```
CPF	NOMECOMPLETO	AREAATUACAO	CARGOPRETENDIDO	VAGAPCD	Status
12345678900	João Silva	Administrativa	Assistente Admin	Não	pendente
98765432100	Maria Santos	Assistencial	Enfermeiro	Sim	pendente
11122233344	Pedro Costa	Administrativa	Analista RH	Não	pendente
```

Isso criará 3 candidatos de teste para você verificar se o sistema está funcionando.

## 📞 Próximos Passos

Depois de executar os testes acima:

1. Copie TODOS os logs do console
2. Copie os logs do Google Apps Script (View > Logs)
3. Tire um print da estrutura da aba CANDIDATOS
4. Envie tudo para análise

Isso permitirá identificar exatamente onde está o problema!
