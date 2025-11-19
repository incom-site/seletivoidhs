# ✅ SOLUÇÃO FINAL - Candidatos Não Aparecem

## 🔍 PROBLEMA IDENTIFICADO

Você tem **6166 candidatos** carregados do Google Sheets, mas eles **não aparecem no painel de alocação**.

**Causa raiz**: A planilha Google Sheets tem a coluna `assigned_to` e/ou `Analista` **preenchidas com valores vazios ou incorretos**, fazendo com que o filtro `!assigned_to` não funcione.

## ✅ SOLUÇÃO COMPLETA

### Passo 1: Atualizar o Script do Google Apps Script

1. **Acesse o Google Apps Script**:
   - Vá para: https://script.google.com
   - Ou pela planilha: **Extensões > Apps Script**

2. **Substitua TODO o código** pelo arquivo `google-apps-script-CORRIGIDO-FINAL.js` deste projeto

3. **Importante**: A função `getCandidates` DEVE ter este código:

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
    Logger.log('📊 Headers: ' + JSON.stringify(headers));

    const candidates = values.map((row, index) => {
      const obj = {};

      // Mapear todos os campos
      for (let j = 0; j < headers.length; j++) {
        const header = headers[j];
        const value = row[j];

        // ✅ NORMALIZAR VALORES VAZIOS PARA NULL
        if (value === null || value === undefined || value === '') {
          obj[header] = null;
        } else {
          obj[header] = value;
        }
      }

      // ✅ CAMPOS ESSENCIAIS
      obj.CPF = obj.CPF || obj.cpf || '';
      obj.NOMECOMPLETO = obj.NOMECOMPLETO || obj.nome_completo || obj.full_name || '';
      obj.AREAATUACAO = obj.AREAATUACAO || obj.area || obj.Area || '';
      obj.VAGAPCD = obj.VAGAPCD || obj.vaga_pcd || '';

      // ✅ CAMPOS DE CARGO
      obj.CARGOADMIN = obj.CARGOADMIN || obj.cargo_administrativo || null;
      obj.CARGOASSIS = obj.CARGOASSIS || obj.cargo_assistencial || null;

      // ✅ NORMALIZAR assigned_to (CRÍTICO!)
      const assignedToRaw = obj.assigned_to || obj.Analista || '';
      obj.assigned_to = (assignedToRaw &&
                        assignedToRaw.trim() !== '' &&
                        assignedToRaw !== 'null' &&
                        assignedToRaw !== 'undefined')
        ? assignedToRaw.trim()
        : null;  // ← IMPORTANTE: null, não string vazia

      obj.Analista = obj.assigned_to; // Sincronizar

      // ✅ STATUS
      obj.Status = obj.Status || obj.status || 'pendente';
      obj.status = String(obj.Status).toLowerCase();

      // Log dos primeiros 3 candidatos para debug
      if (index < 3) {
        Logger.log(`Candidato ${index + 1}:`);
        Logger.log(`  CPF: ${obj.CPF}`);
        Logger.log(`  Nome: ${obj.NOMECOMPLETO}`);
        Logger.log(`  assigned_to: "${obj.assigned_to}"`);
        Logger.log(`  Status: ${obj.Status}`);
      }

      return obj;
    });

    Logger.log('✅ Total de candidatos processados: ' + candidates.length);
    return { candidates: candidates };

  } catch (error) {
    Logger.log('❌ Erro em getCandidates: ' + error.toString());
    Logger.log('Stack: ' + error.stack);
    throw error;
  }
}
```

4. **Salve o script**: Clique em **Salvar** (ícone de disquete)

5. **Implante a nova versão**:
   - Clique em **Implantar > Gerenciar implantações**
   - Clique no ícone de **lápis** ao lado da implantação ativa
   - Em "Versão", selecione **Nova versão**
   - Adicione descrição: "Correção assigned_to para null"
   - Clique em **Implantar**
   - ✅ A URL permanece a mesma, não precisa atualizar no frontend

### Passo 2: Limpar Cache e Testar

1. **Abra o sistema no navegador**
2. **Limpe o cache**:
   - Pressione `Ctrl + Shift + R` (Windows/Linux)
   - Ou `Cmd + Shift + R` (Mac)
   - Ou: F12 > Application > Clear Storage > Clear site data

3. **Faça login novamente**

4. **Vá para a aba "Alocação"**

5. **Abra o Console** (F12 > Console)

6. **Procure pelos logs**:

```
═══════════════════════════════════════════════════
🔍 [getUnassignedCandidates] Iniciando busca...
📊 [getUnassignedCandidates] Total de candidatos: 6166
👤 [getUnassignedCandidates] Exemplo do primeiro candidato (raw):
   - NOMECOMPLETO: Francisca lopes sousa da costa
   - CPF: 918.490.393-72
   - assigned_to: null  ← DEVE SER NULL, NÃO ""
   - Analista: null     ← DEVE SER NULL, NÃO ""
   - Tipo assigned_to: object  ← DEVE SER "object" (null é object em JS)
   - Tipo Analista: object
🔍 Candidato 1: Francisca lopes sousa da costa
   assigned_to: "null" | isUnassigned: true  ← DEVE SER TRUE
📊 [getUnassignedCandidates] Candidatos não alocados: XXXX
═══════════════════════════════════════════════════
```

### Passo 3: Verificar Resultado

Se tudo estiver correto, você deve ver:

```
✅ [AssignmentPanel] Resposta recebida: {...}
📊 [AssignmentPanel] Total de candidatos na resposta: XXXX
👤 [AssignmentPanel] Primeiro candidato: {...}
```

E os candidatos devem aparecer na tela.

## 🧪 TESTE RÁPIDO

Cole este código no Console do navegador para verificar:

```javascript
// Testar quantos candidatos não alocados existem
fetch('https://script.google.com/macros/s/AKfycbwbr9Vm-EJxPTxGEP12UtwWfeKTGU1LsCjnHxQzkY8a9AOOozLNeDKGcflIknT5_FOq/exec?action=getCandidates')
  .then(r => r.json())
  .then(d => {
    const candidates = d.data.candidates;
    console.log('📊 Total de candidatos:', candidates.length);

    // Filtrar candidatos não alocados (mesma lógica do sistema)
    const unassigned = candidates.filter(c => {
      const assignedTo = c.assigned_to || c.Analista;
      return !assignedTo || assignedTo === '' || assignedTo === 'null' || assignedTo === 'undefined';
    });

    console.log('✅ Candidatos não alocados:', unassigned.length);
    console.log('👤 Primeiros 5 não alocados:', unassigned.slice(0, 5).map(c => ({
      nome: c.NOMECOMPLETO,
      cpf: c.CPF,
      assigned_to: c.assigned_to,
      tipo: typeof c.assigned_to
    })));
  });
```

## 📋 CHECKLIST DE VERIFICAÇÃO

Após seguir os passos acima, verifique:

- [ ] Script do Google Apps Script atualizado
- [ ] Nova versão implantada (não muda a URL)
- [ ] Cache do navegador limpo
- [ ] Login realizado novamente
- [ ] Console aberto (F12)
- [ ] Aba "Alocação" aberta
- [ ] Logs aparecem no console
- [ ] `assigned_to` é `null` (não string vazia)
- [ ] `Candidatos não alocados` > 0
- [ ] Candidatos aparecem na tela

## ❓ CENÁRIOS E SOLUÇÕES

### Cenário 1: "Candidatos não alocados: 0"

**Problema**: TODOS os candidatos têm `assigned_to` preenchido na planilha.

**Solução**:
1. Abra a planilha do Google Sheets
2. Localize a coluna `assigned_to` ou `Analista`
3. Verifique se todas as células estão preenchidas
4. Para liberar candidatos, apague o conteúdo de algumas células
5. Recarregue o sistema

### Cenário 2: "assigned_to: """" (string vazia)"

**Problema**: O script antigo ainda está ativo.

**Solução**:
1. Verifique se você salvou e implantou a nova versão
2. Limpe o cache do Google Apps Script:
   - No editor do script, clique em **Executar > Limpar cache**
3. Aguarde 1-2 minutos
4. Recarregue o sistema

### Cenário 3: "Erro 404 ou erro ao carregar"

**Problema**: URL do script incorreta.

**Solução**:
1. Copie a URL da implantação do Google Apps Script
2. Atualize em `src/services/googleSheets.ts`:
```typescript
const SCRIPT_URL = 'SUA_URL_AQUI';
```
3. Execute `npm run build`
4. Recarregue o sistema

### Cenário 4: Candidatos aparecem duplicados

**Problema**: IDs duplicados (CPF com formatação diferente).

**Solução**: O sistema já normaliza CPF. Se ainda ocorrer:
1. Verifique na planilha se há CPFs duplicados
2. Use a função de busca: `Ctrl+F` e procure por CPFs repetidos
3. Remova ou corrija duplicatas

## 🎯 RESULTADO ESPERADO

Após aplicar a solução:

1. ✅ Candidatos não alocados aparecem no painel
2. ✅ Filtros funcionam corretamente
3. ✅ Alocação de candidatos funciona
4. ✅ Sincronização entre `assigned_to` e `Analista`
5. ✅ IDs únicos baseados em CPF
6. ✅ Campos de cargo (CARGOADMIN e CARGOASSIS) aparecem

## 📞 AINDA NÃO FUNCIONOU?

Envie para mim:

1. **Logs completos do console** que contêm:
   - `[getUnassignedCandidates]`
   - `[AssignmentPanel]`

2. **Resultado do teste rápido** (código JavaScript acima)

3. **Screenshot** da tela de alocação

4. **Confirmação**:
   - [ ] Script atualizado no Google Apps Script
   - [ ] Nova versão implantada
   - [ ] Cache limpo
   - [ ] Qual é o valor de "Candidatos não alocados" no log

Com essas informações, vou identificar exatamente o problema restante.
