# Diagnóstico Detalhado - Candidatos Não Aparecem

## Status Atual

Você tem:
- ✅ 6166 candidatos carregados com sucesso
- ✅ Dados chegando do Google Sheets
- ❌ Candidatos não aparecem no painel de alocação

## Logs Adicionados

Adicionei logs extremamente detalhados em 3 pontos críticos:

### 1. AssignmentPanel - useEffect
```
═══════════════════════════════════════════════════
🔄 [AssignmentPanel] useEffect DISPARADO
📄 [AssignmentPanel] Página atual: X
👤 [AssignmentPanel] AdminId: XXX
═══════════════════════════════════════════════════
```

### 2. AssignmentPanel - loadUnassignedCandidates
```
🔵 [AssignmentPanel] loadUnassignedCandidates INICIADO
📄 [AssignmentPanel] Página: X
✅ [AssignmentPanel] Resposta recebida: {...}
📊 [AssignmentPanel] Total de candidatos na resposta: X
📄 [AssignmentPanel] Total de páginas: X
📋 [AssignmentPanel] Count: X
👤 [AssignmentPanel] Primeiro candidato: {...}
🏁 [AssignmentPanel] loadUnassignedCandidates FINALIZADO
```

### 3. CandidateService - getUnassignedCandidates
```
═══════════════════════════════════════════════════
🔍 [getUnassignedCandidates] Iniciando busca...
📊 [getUnassignedCandidates] Total de candidatos: 6166
👤 [getUnassignedCandidates] Exemplo do primeiro candidato (raw):
   - NOMECOMPLETO: XXX
   - CPF: XXX
   - assigned_to: XXX
   - Analista: XXX
   - Tipo assigned_to: string/undefined/null
   - Tipo Analista: string/undefined/null
🔍 Candidato 1: XXX
   assigned_to: "XXX" | isUnassigned: true/false
🔍 Candidato 2: XXX
   assigned_to: "XXX" | isUnassigned: true/false
...
📊 [getUnassignedCandidates] Candidatos não alocados: X
═══════════════════════════════════════════════════
```

## O Que Fazer Agora

### Passo 1: Limpar o Cache do Navegador
1. Pressione `Ctrl + Shift + R` (ou `Cmd + Shift + R` no Mac)
2. Ou abra o DevTools (F12) > Application > Clear Storage > Clear site data

### Passo 2: Recarregar a Página
1. Faça login novamente
2. Vá para a aba "Alocação"
3. Abra o Console (F12 > Console)

### Passo 3: Analisar os Logs

#### Cenário 1: Logs do AssignmentPanel NÃO aparecem
Se você NÃO vir os logs:
```
═══════════════════════════════════════════════════
🔄 [AssignmentPanel] useEffect DISPARADO
```

**Problema**: O componente AssignmentPanel não está sendo renderizado.

**Solução**: Verifique se você está clicando na aba "Alocação" corretamente.

---

#### Cenário 2: Logs aparecem mas "Total de candidatos não alocados: 0"
Se você vir:
```
📊 [getUnassignedCandidates] Candidatos não alocados: 0
```

**Problema**: TODOS os 6166 candidatos têm `assigned_to` preenchido.

**O que verificar nos logs**:
```
🔍 Candidato 1: Francisca lopes sousa da costa
   assigned_to: "algum_email@teste.com" | isUnassigned: false
```

Se `assigned_to` não está vazio, significa que TODOS os candidatos já foram alocados.

**Soluções**:

##### Opção A: Limpar alocações na planilha
1. Abra a planilha do Google Sheets
2. Na aba CANDIDATOS, localize as colunas:
   - `assigned_to`
   - `Analista`
3. Selecione algumas células dessas colunas e limpe o conteúdo
4. Recarregue o sistema

##### Opção B: Verificar o script do Google Apps
O script pode estar preenchendo automaticamente o campo `assigned_to` com algum valor padrão.

Verifique no script se há algo como:
```javascript
obj.assigned_to = obj.assigned_to || 'valor_padrao';
```

Deve ser:
```javascript
obj.assigned_to = obj.assigned_to || null;
```

---

#### Cenário 3: Candidatos encontrados mas não aparecem na tela
Se você vir:
```
📊 [getUnassignedCandidates] Candidatos não alocados: 100
✅ [AssignmentPanel] Resposta recebida: {...}
📊 [AssignmentPanel] Total de candidatos na resposta: 100
```

Mas nada aparece na tela, o problema é no render do componente.

**Verificar**:
1. Veja o log `👤 [AssignmentPanel] Primeiro candidato`
2. Copie o objeto completo e envie para mim
3. Pode haver um problema com IDs ou estrutura de dados

---

#### Cenário 4: Erro no console
Se você vir:
```
❌ [AssignmentPanel] Erro ao carregar candidatos: XXX
```

**Problema**: Erro durante o carregamento.

**Solução**: Copie o erro completo e o stack trace e me envie.

---

## Verificação Rápida

Cole este código no Console do navegador para ver o estado atual:

```javascript
// Ver todos os candidatos carregados
console.log('Total de candidatos no Google Sheets:',
  await fetch('https://script.google.com/macros/s/AKfycbwbr9Vm-EJxPTxGEP12UtwWfeKTGU1LsCjnHxQzkY8a9AOOozLNeDKGcflIknT5_FOq/exec?action=getCandidates')
    .then(r => r.json())
    .then(d => d.data.candidates.length)
);

// Ver quantos têm assigned_to vazio
fetch('https://script.google.com/macros/s/AKfycbwbr9Vm-EJxPTxGEP12UtwWfeKTGU1LsCjnHxQzkY8a9AOOozLNeDKGcflIknT5_FOq/exec?action=getCandidates')
  .then(r => r.json())
  .then(d => {
    const candidates = d.data.candidates;
    const unassigned = candidates.filter(c => !c.assigned_to && !c.Analista);
    console.log('Total de candidatos:', candidates.length);
    console.log('Candidatos não alocados:', unassigned.length);
    console.log('Primeiros 5 não alocados:', unassigned.slice(0, 5).map(c => ({
      nome: c.NOMECOMPLETO,
      cpf: c.CPF,
      assigned_to: c.assigned_to,
      Analista: c.Analista
    })));
  });
```

## Checklist de Verificação

Depois de recarregar a página, responda:

- [ ] Os logs do AssignmentPanel aparecem no console?
- [ ] Qual é o valor de "Candidatos não alocados"?
- [ ] Há algum erro no console?
- [ ] O primeiro candidato tem `assigned_to` vazio ou preenchido?
- [ ] Quantos candidatos aparecem quando você executa o código de verificação rápida?

## Próximos Passos

Com base nas respostas acima, me informe:

1. **Cenário encontrado**: (1, 2, 3 ou 4)
2. **Logs completos**: Cole todos os logs do console que mencionam `[AssignmentPanel]` ou `[getUnassignedCandidates]`
3. **Estrutura do primeiro candidato**: Cole o objeto completo que aparece em `👤 [AssignmentPanel] Primeiro candidato`

Com essas informações, vou identificar exatamente onde está o problema e aplicar a correção precisa.
