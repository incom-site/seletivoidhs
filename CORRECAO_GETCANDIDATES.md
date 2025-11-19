# Correção da Função getCandidates

## Problemas Identificados

### 1. **Campos de Cargo Ausentes**
O script original não estava mapeando os campos:
- `CARGOADMIN` (Cargo Administrativo)
- `CARGOASSIS` (Cargo Assistencial)

**Impacto**: O AssignmentPanel não conseguia exibir os cargos dos candidatos.

### 2. **Valores Vazios em assigned_to**
O script estava retornando strings vazias `""` em vez de `null` para candidatos não alocados.

**Impacto**: O filtro `!item.assigned_to` não funcionava corretamente, pois `""` é considerado `truthy` em JavaScript.

### 3. **Falta de Sincronização entre Campos**
Os campos `assigned_to` e `Analista` não estavam sincronizados.

**Impacto**: Candidatos alocados não apareciam corretamente nos painéis.

## Correções Implementadas

### No Google Apps Script

```javascript
function getCandidates(params) {
  try {
    const {sheet, headers, values} = _readSheetBlock_(SHEET_CANDIDATOS);

    if (!sheet || !values.length) {
      return { candidates: [] };
    }

    const candidates = values.map((row, index) => {
      const obj = {};

      // Mapear todos os campos
      for (let j = 0; j < headers.length; j++) {
        const header = headers[j];
        const value = row[j];

        // Normalizar valores vazios
        obj[header] = (value === null || value === undefined || value === '') ? null : value;
      }

      // ✅ GARANTIR CAMPOS ESSENCIAIS
      obj.CPF = obj.CPF || obj.cpf || '';
      obj.NOMECOMPLETO = obj.NOMECOMPLETO || obj.nome_completo || '';
      obj.AREAATUACAO = obj.AREAATUACAO || obj.area || '';

      // ✅ CAMPOS DE CARGO
      obj.CARGOADMIN = obj.CARGOADMIN || obj.cargo_administrativo || null;
      obj.CARGOASSIS = obj.CARGOASSIS || obj.cargo_assistencial || null;

      // ✅ NORMALIZAR assigned_to (remover strings vazias)
      const assignedToRaw = obj.assigned_to || obj.Analista || '';
      obj.assigned_to = (assignedToRaw &&
                        assignedToRaw.trim() !== '' &&
                        assignedToRaw !== 'null' &&
                        assignedToRaw !== 'undefined')
        ? assignedToRaw.trim()
        : null;

      obj.Analista = obj.assigned_to; // Sincronizar

      return obj;
    });

    return { candidates: candidates };
  } catch (error) {
    Logger.log('❌ Erro em getCandidates: ' + error.toString());
    throw error;
  }
}
```

### Na Função assignCandidates

```javascript
function assignCandidates(params) {
  // ... código existente ...

  const assignedToCol = col['assigned_to'];
  const analistaCol = col['Analista']; // ✅ ADICIONAR

  // ... resto do código ...

  // ✅ ATUALIZAR AMBOS OS CAMPOS
  if (assignedTo) assignedTo[i][0] = analystEmail;
  if (analista) analista[i][0] = analystEmail; // Sincronizar

  // ... salvar ...
  if (assignedTo) sh.getRange(HEADER_ROWS+1, assignedToCol+1, n, 1).setValues(assignedTo);
  if (analista) sh.getRange(HEADER_ROWS+1, analistaCol+1, n, 1).setValues(analista);
}
```

## Como Aplicar a Correção

### Passo 1: Abrir o Editor do Google Apps Script
1. Acesse: https://script.google.com
2. Abra seu projeto do script
3. Ou acesse pela planilha: **Extensões > Apps Script**

### Passo 2: Substituir a Função getCandidates
Localize a função `getCandidates` no seu script e substitua por:

```javascript
function getCandidates(params) {
  try {
    Logger.log('📋 getCandidates - Iniciando...');

    const {sheet, headers, values} = _readSheetBlock_(SHEET_CANDIDATOS);

    if (!sheet) {
      Logger.log('❌ Planilha CANDIDATOS não encontrada');
      return { candidates: [] };
    }

    if (!values.length) {
      Logger.log('⚠️ Nenhum candidato na planilha');
      return { candidates: [] };
    }

    Logger.log('✅ Total de linhas: ' + values.length);

    const candidates = values.map((row, index) => {
      const obj = {};

      for (let j = 0; j < headers.length; j++) {
        const header = headers[j];
        const value = row[j];
        obj[header] = (value === null || value === undefined || value === '') ? null : value;
      }

      obj.CPF = obj.CPF || obj.cpf || '';
      obj.NOMECOMPLETO = obj.NOMECOMPLETO || obj.nome_completo || obj.full_name || '';
      obj.AREAATUACAO = obj.AREAATUACAO || obj.area || obj.Area || '';
      obj.VAGAPCD = obj.VAGAPCD || obj.vaga_pcd || '';
      obj.CARGOADMIN = obj.CARGOADMIN || obj.cargo_administrativo || null;
      obj.CARGOASSIS = obj.CARGOASSIS || obj.cargo_assistencial || null;

      const assignedToRaw = obj.assigned_to || obj.Analista || '';
      obj.assigned_to = (assignedToRaw &&
                        assignedToRaw.trim() !== '' &&
                        assignedToRaw !== 'null' &&
                        assignedToRaw !== 'undefined')
        ? assignedToRaw.trim()
        : null;
      obj.Analista = obj.assigned_to;

      obj.Status = obj.Status || obj.status || 'pendente';
      obj.status = String(obj.Status).toLowerCase();

      return obj;
    });

    Logger.log('✅ Total de candidatos processados: ' + candidates.length);
    return { candidates: candidates };

  } catch (error) {
    Logger.log('❌ Erro em getCandidates: ' + error.toString());
    throw error;
  }
}
```

### Passo 3: Atualizar assignCandidates
Localize a linha onde você lê as colunas:

```javascript
const cpfCol = col['CPF'];
const assignedToCol = col['assigned_to'];
```

Adicione:
```javascript
const analistaCol = col['Analista']; // ✅ ADICIONAR
```

Depois, onde você lê os valores:
```javascript
const assignedTo = assignedToCol!=null ? sh.getRange(HEADER_ROWS+1, assignedToCol+1, n, 1).getValues() : null;
```

Adicione:
```javascript
const analista = analistaCol!=null ? sh.getRange(HEADER_ROWS+1, analistaCol+1, n, 1).getValues() : null;
```

Onde você atualiza os valores:
```javascript
if (assignedTo) assignedTo[i][0] = analystEmail;
```

Adicione:
```javascript
if (analista) analista[i][0] = analystEmail;
```

E onde você salva:
```javascript
if (assignedTo) sh.getRange(HEADER_ROWS+1, assignedToCol+1, n, 1).setValues(assignedTo);
```

Adicione:
```javascript
if (analista) sh.getRange(HEADER_ROWS+1, analistaCol+1, n, 1).setValues(analista);
```

### Passo 4: Salvar e Implantar
1. Clique em **Salvar** (ícone de disquete)
2. Clique em **Implantar > Gerenciar implantações**
3. Clique no lápis ao lado da implantação ativa
4. Em "Versão", selecione **Nova versão**
5. Clique em **Implantar**
6. Copie a nova URL de implantação (se mudou)

### Passo 5: Testar
1. Abra o sistema frontend
2. Faça login como admin
3. Vá para o painel de alocação
4. Verifique se os candidatos estão sendo listados
5. Verifique se os cargos aparecem
6. Teste alocar um candidato

## Verificação no Console do Apps Script

Para verificar se está funcionando, abra o console de logs:

1. No editor do Apps Script, clique em **Execuções** (ícone de relógio)
2. Clique na execução mais recente de `getCandidates`
3. Verifique os logs:

```
📋 getCandidates - Iniciando...
✅ Total de linhas: 50
Candidato 1:
  CPF: 12345678900
  Nome: João Silva
  Área: Administrativa
  CARGOADMIN: Auxiliar Administrativo
  CARGOASSIS: null
  assigned_to: "null"
  Status: pendente
✅ Total de candidatos processados: 50
```

## Estrutura da Planilha CANDIDATOS

Certifique-se de que sua planilha possui estas colunas:

### Colunas Obrigatórias:
- `CPF`
- `NOMECOMPLETO`
- `AREAATUACAO`
- `VAGAPCD`
- `Status`

### Colunas de Cargo (novas):
- `CARGOADMIN`
- `CARGOASSIS`

### Colunas de Alocação:
- `assigned_to`
- `Analista` (deve ser sincronizada com assigned_to)
- `assigned_at`
- `assigned_by`

## Resultado Esperado

Após aplicar as correções:

1. ✅ Candidatos aparecem no AssignmentPanel
2. ✅ Cargos são exibidos (Admin e Assis)
3. ✅ Candidatos não alocados são filtrados corretamente
4. ✅ Alocação funciona e sincroniza assigned_to e Analista
5. ✅ IDs únicos baseados em CPF evitam duplicatas

## Logs de Debug

Se ainda houver problemas, ative os logs no frontend:

```javascript
// No navegador, abra o Console (F12) e execute:
localStorage.setItem('debug', 'true');
```

Depois recarregue a página e verifique os logs no console.
