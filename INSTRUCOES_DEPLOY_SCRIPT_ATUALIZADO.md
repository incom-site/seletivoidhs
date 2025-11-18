# Instruções para Implantar o Script Atualizado no Google Apps Script

## Problema Identificado

O componente `DisqualifiedCandidatesList.tsx` está tentando chamar a função `getCandidatesByStatus`, mas ela não está implementada no Google Apps Script atual (arquivo `google-apps-script-complete.js`).

## Solução

O arquivo `google-apps-script-updated.js` já contém a função `getCandidatesByStatus` implementada corretamente. Você precisa **reimplantar** este script no Google Apps Script.

---

## Passo a Passo para Reimplantar

### 1. Acesse o Google Apps Script Editor

1. Abra o Google Sheets com sua planilha de candidatos
2. Vá em **Extensões** > **Apps Script**

### 2. Substitua o Código Atual

1. No editor do Google Apps Script, **selecione TODO o código atual**
2. **Delete** todo o código
3. Abra o arquivo **`google-apps-script-updated.js`** do seu projeto
4. **Copie TODO o conteúdo** deste arquivo
5. **Cole** no editor do Google Apps Script

### 3. Implante a Nova Versão

1. Clique em **Implantar** > **Gerenciar implantações**
2. Clique no **ícone de lápis (editar)** na implantação existente
3. Em **Versão**, selecione **Nova versão**
4. Adicione uma descrição: "Adicionado getCandidatesByStatus para lista de desclassificados"
5. Clique em **Implantar**

### 4. Atualize a URL (se necessário)

Se a URL da Web App mudou:
1. Copie a nova URL gerada
2. Atualize o arquivo `.env` do seu projeto com a nova URL em `VITE_GOOGLE_SCRIPT_URL`

---

## O Que Foi Corrigido

A função `getCandidatesByStatus` no script atualizado:

✅ **Busca candidatos por status** (Classificado, Desclassificado, Revisar)
✅ **Retorna um array de candidatos** que correspondem ao status
✅ **Inclui todos os campos** do candidato, incluindo:
   - `Motivo Desclassificação`
   - `Observações`
   - `Data Triagem`
   - `Analista`

✅ **Adiciona campos extras**:
   - `id` (usando o CPF)
   - `registration_number` (usando o CPF)

✅ **Logs detalhados** para facilitar debug

---

## Estrutura de Resposta

A função retorna:

```javascript
{
  success: true,
  data: [
    {
      CPF: "12345678900",
      NOMECOMPLETO: "João da Silva",
      AREAATUACAO: "Assistencial",
      CARGOPRETENDIDO: "Enfermeiro",
      Status: "Desclassificado",
      "Motivo Desclassificação": "Documentação incompleta",
      "Observações": "Faltou o diploma",
      "Data Triagem": "2025-11-11T10:30:00.000Z",
      Analista: "analista@email.com",
      id: "12345678900",
      registration_number: "12345678900",
      // ... outros campos da planilha
    }
  ]
}
```

---

## Como Verificar se Funcionou

1. Abra o console do navegador (F12)
2. Navegue até a aba "Desclassificados" no sistema
3. Verifique os logs no console:
   - Deve mostrar "✅ result.data é um array direto com X candidatos"
   - Deve listar os candidatos desclassificados

---

## Verificações Importantes

Antes de implantar, certifique-se de que:

1. ✅ A planilha tem uma aba chamada **CANDIDATOS**
2. ✅ A aba CANDIDATOS tem uma coluna chamada **Status**
3. ✅ Existem candidatos com Status = **"Desclassificado"** (exatamente com essa escrita)
4. ✅ A coluna **"Motivo Desclassificação"** existe na planilha

---

## Testando no Google Apps Script

Você pode testar a função diretamente no Apps Script:

1. No editor, adicione esta função temporária:

```javascript
function testarDesclassificados() {
  const result = getCandidatesByStatus({ status: 'Desclassificado' });
  Logger.log('Total encontrados: ' + result.length);
  Logger.log('Primeiro candidato: ' + JSON.stringify(result[0]));
}
```

2. Execute a função `testarDesclassificados`
3. Verifique o log em **Execuções** (ícone de relógio no menu lateral)

---

## Troubleshooting

### Problema: "Coluna Status não encontrada"

**Solução**: Adicione a coluna "Status" na planilha CANDIDATOS

### Problema: "Nenhum candidato retornado"

**Solução**: Verifique se:
- A coluna Status existe
- Existem linhas com Status = "Desclassificado"
- A escrita está exata (com letra maiúscula no início)

### Problema: "Motivo não aparece"

**Solução**: Verifique se:
- A coluna "Motivo Desclassificação" existe na planilha
- Os valores estão preenchidos nas linhas dos desclassificados

---

## Arquivos Relacionados

- **Script atualizado**: `google-apps-script-updated.js`
- **Componente frontend**: `src/components/DisqualifiedCandidatesList.tsx`
- **Serviço**: `src/services/googleSheets.ts`
