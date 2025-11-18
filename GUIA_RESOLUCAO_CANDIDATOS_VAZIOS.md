# 🔧 GUIA DE RESOLUÇÃO - CANDIDATOS NÃO CARREGAM

## 📋 PROBLEMAS REPORTADOS

❌ **Candidatos não estão carregando:**
- AnalystDashboard vazio
- InterviewerDashboard vazio
- AdminDashboard sem candidatos para alocar
- Listas de classificados/desclassificados vazias

---

## 🔍 DIAGNÓSTICO

### **CAUSA PRINCIPAL: Colunas Ausentes**

O sistema precisa de colunas específicas na planilha CANDIDATOS para funcionar. Se essas colunas não existirem, as funções retornam arrays vazios.

### **Colunas Críticas:**

**Para Analistas:**
- `Status` - Exibe apenas candidatos com status específico
- `Analista` ou `assigned_to` - Filtra candidatos do analista

**Para Entrevistadores:**
- `Entrevistador` - Filtra candidatos do entrevistador

**Para Admin (Listas):**
- `Status` - Classificar candidatos por status
- `Analista` - Ver quem está alocado
- `Entrevistador` - Ver entrevistas

---

## ✅ SOLUÇÃO COMPLETA (PASSO A PASSO)

### **ETAPA 1: Fazer Deploy do Script Atualizado**

1. **Abra o Google Apps Script** do seu projeto

2. **Cole o conteúdo completo** de `google-apps-script-COMPLETO-FINAL.js`

3. **Salve** o projeto (Ctrl+S)

4. **Faça o Deploy:**
   - Clique em "Implantar" > "Nova implementação"
   - Tipo: "Aplicativo da Web"
   - Execute como: "Eu"
   - Quem tem acesso: "Qualquer pessoa"
   - Clique em "Implantar"
   - **Copie a URL do webapp** (você vai precisar)

---

### **ETAPA 2: Executar Diagnóstico**

1. **Abra o Google Apps Script**

2. **Cole a função de diagnóstico** do arquivo `google-apps-script-diagnostico.js`

3. **Execute a função:**
   ```
   Selecione: diagnosticoCompleto
   Clique em: Executar (▶️)
   ```

4. **Veja os logs:**
   - Clique em "Ver" > "Executions"
   - OU clique em "Executar" no histórico
   - Leia TODOS os logs com atenção

5. **Anote os problemas encontrados:**
   ```
   Exemplo de saída:
   ⚠️ PROBLEMAS ENCONTRADOS:
     1. Coluna ID faltando em USUARIOS
     2. Coluna Status faltando em CANDIDATOS
     3. Coluna Analista faltando em CANDIDATOS
     4. Coluna Entrevistador faltando em CANDIDATOS
   ```

---

### **ETAPA 3: Corrigir Estrutura das Planilhas**

#### **OPÇÃO A: Correção Automática (RECOMENDADO)**

1. **No Google Apps Script, execute:**
   ```javascript
   setupAllSheets()
   ```

2. **Aguarde a execução** (pode levar alguns segundos)

3. **Verifique os logs:**
   - Deve mostrar "✅ Coluna X adicionada"
   - Deve mostrar "✅ Planilha Y criada"

4. **Execute novamente o diagnóstico:**
   ```javascript
   diagnosticoCompleto()
   ```

5. **Confirme que todos os problemas foram resolvidos**

---

#### **OPÇÃO B: Correção Manual (se a automática falhar)**

**1. Planilha USUARIOS:**

Estrutura correta:
```
| A: Email | B: Nome | C: Role | D: ID | E: DataCriacao | F: Ativo | G: Password |
```

Se a coluna ID não existir:
1. Clique na coluna D
2. Clique com botão direito
3. "Inserir 1 coluna à esquerda"
4. Digite "ID" na célula D1
5. Na D2, digite: `=A2`
6. Arraste para baixo
7. Copie a coluna D e cole apenas valores

---

**2. Planilha CANDIDATOS:**

Adicione as colunas faltantes NO FINAL da planilha (após a última coluna):

**Colunas de Triagem:**
- `Status` - (deixe vazio inicialmente)
- `Analista` - (deixe vazio inicialmente)
- `Data Triagem` - (deixe vazio inicialmente)
- `Motivo Desclassificação` - (deixe vazio inicialmente)
- `Observações` - (deixe vazio inicialmente)

**Colunas de Atribuição:**
- `assigned_to` - (deixe vazio inicialmente)
- `assigned_at` - (deixe vazio inicialmente)
- `assigned_by` - (deixe vazio inicialmente)

**Colunas de Entrevista:**
- `Entrevistador` - (deixe vazio inicialmente)
- `entrevistador_at` - (deixe vazio inicialmente)
- `Status Entrevista` - (deixe vazio inicialmente)
- `Data Entrevista` - (deixe vazio inicialmente)
- `Avaliacao Entrevista` - (deixe vazio inicialmente)
- `Observacoes Entrevista` - (deixe vazio inicialmente)

**Como adicionar:**
1. Vá para a última coluna com dados
2. Clique na próxima coluna vazia
3. Digite o nome da coluna na linha 1
4. Formate como cabeçalho (negrito, cor de fundo)
5. Repita para todas as colunas

---

**3. Planilha MOTIVOS:**

Se não existir, crie:

1. Clique no "+" para criar nova aba
2. Renomeie para "MOTIVOS"
3. Na linha 1, adicione:
   ```
   A: ID | B: Motivo | C: Ativo
   ```
4. Adicione os motivos padrão:
   ```
   1 | Documentação incompleta | TRUE
   2 | Não atende requisitos mínimos | TRUE
   3 | Fora do perfil da vaga | TRUE
   4 | Duplicidade de cadastro | TRUE
   5 | Outros | TRUE
   ```

---

### **ETAPA 4: Configurar Frontend**

1. **Abra o arquivo `.env` do projeto**

2. **Atualize a URL do Google Apps Script:**
   ```
   VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/SEU_ID_AQUI/exec
   ```
   (Use a URL que você copiou na Etapa 1)

3. **Salve o arquivo**

4. **No terminal, execute:**
   ```bash
   npm run build
   ```

5. **Verifique se o build foi bem-sucedido**

---

### **ETAPA 5: Limpar Cache e Testar**

1. **No navegador, abra o Console (F12)**

2. **Execute:**
   ```javascript
   localStorage.clear();
   ```

3. **Recarregue a página** (F5)

4. **Faça login** com cada tipo de usuário:

---

#### **TESTE 1: Admin**

1. Login com usuário admin
2. Deve redirecionar para `AdminDashboard`
3. Vá para aba "Alocação de Candidatos"
4. Deve aparecer:
   - ✅ Lista de candidatos não atribuídos
   - ✅ Lista de analistas

**Se não aparecer:**
- Abra o Console do Navegador (F12)
- Procure por erros (linhas vermelhas)
- Procure pelos logs:
  ```
  📊 [CandidateService] Total de candidatos carregados: X
  ```

---

#### **TESTE 2: Analista**

**Primeiro, o admin precisa alocar candidatos:**

1. Login como admin
2. Vá para "Alocação de Candidatos"
3. Selecione alguns candidatos
4. Selecione um analista
5. Clique em "Alocar Selecionados"
6. Aguarde confirmação

**Depois, teste como analista:**

1. Faça logout
2. Login com usuário analista
3. Deve redirecionar para `AnalystDashboard`
4. Deve aparecer os candidatos alocados

**Se não aparecer:**
- Verifique no Console:
  ```
  📊 [CandidateService] Total de candidatos carregados: X
  🔍 [CandidateService] Após filtrar por userId: Y
  ```
- Verifique na planilha CANDIDATOS:
  - Coluna `Analista` deve ter o email do analista
  - OU coluna `assigned_to` deve ter o email do analista

---

#### **TESTE 3: Entrevistador**

**Primeiro, mova candidatos para entrevista:**

1. Login como analista (ou admin)
2. Classifique alguns candidatos como "Classificado"
3. Admin deve ir em "Candidatos Classificados"
4. Selecionar candidatos
5. Selecionar entrevistador
6. Alocar para entrevista

**Depois, teste como entrevistador:**

1. Faça logout
2. Login com usuário entrevistador
3. Deve redirecionar para `InterviewerDashboard`
4. Deve aparecer os candidatos alocados

**Se não aparecer:**
- Verifique na planilha CANDIDATOS:
  - Coluna `Entrevistador` deve ter o email do entrevistador

---

### **ETAPA 6: Verificar Google Apps Script Logs**

Se os dados ainda não aparecem:

1. **Abra o Google Apps Script**

2. **Vá em "Ver" > "Executions"**

3. **Encontre as últimas execuções**

4. **Clique em cada uma e leia os logs:**

Procure por:
```
✅ Símbolos de sucesso
❌ Símbolos de erro
⚠️ Avisos
```

Logs importantes:
```
📥 getCandidates() chamada
📋 Headers encontrados: CPF, NOMECOMPLETO, Status, Analista, ...
📊 Total de candidatos: 150
✅ Retornando 150 candidatos
```

Se aparecer:
```
⚠️ Nenhum candidato encontrado na planilha
```

Significa que a planilha CANDIDATOS está vazia ou não tem dados na linha 2 em diante.

---

## 🧪 TESTES DETALHADOS

### **TESTE NO GOOGLE APPS SCRIPT**

Execute cada função individualmente:

```javascript
// Teste 1: getCandidates
function testarGetCandidates() {
  const result = getCandidates();
  Logger.log('Resultado:', JSON.stringify(result));
  Logger.log('Total:', result.candidates ? result.candidates.length : 0);
}

// Teste 2: getAnalysts
function testarGetAnalysts() {
  const result = getAnalysts();
  Logger.log('Resultado:', JSON.stringify(result));
  Logger.log('Total:', result.analysts ? result.analysts.length : 0);
}

// Teste 3: getInterviewers
function testarGetInterviewers() {
  const result = getInterviewers();
  Logger.log('Resultado:', JSON.stringify(result));
  Logger.log('Total:', result.interviewers ? result.interviewers.length : 0);
}

// Teste 4: getInterviewerCandidates
function testarGetInterviewerCandidates() {
  const email = 'nbconsultoriasistema@gmail.com'; // Substitua pelo email real
  const result = getInterviewerCandidates({ interviewerEmail: email });
  Logger.log('Resultado:', JSON.stringify(result));
  Logger.log('Total:', Array.isArray(result) ? result.length : 0);
}
```

---

### **TESTE NO FRONTEND**

Abra o Console do Navegador (F12) e execute:

```javascript
// Teste 1: Ver user atual
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
console.log('User:', currentUser);

// Teste 2: Testar chamada direta ao Google Apps Script
const scriptUrl = 'SUA_URL_AQUI';
fetch(`${scriptUrl}?action=getCandidates`)
  .then(r => r.json())
  .then(data => console.log('Candidatos:', data))
  .catch(err => console.error('Erro:', err));

// Teste 3: Ver se candidateService funciona
import('./services/candidateService.js').then(module => {
  module.candidateService.getCandidates(1, 100).then(result => {
    console.log('Candidatos:', result);
  });
});
```

---

## 📊 CHECKLIST FINAL

Antes de considerar resolvido, verifique:

### **Estrutura:**
- [ ] Planilha USUARIOS tem coluna ID na posição D
- [ ] Planilha CANDIDATOS tem coluna Status
- [ ] Planilha CANDIDATOS tem coluna Analista
- [ ] Planilha CANDIDATOS tem coluna Entrevistador
- [ ] Planilha MOTIVOS existe

### **Dados:**
- [ ] Há pelo menos 1 candidato na planilha CANDIDATOS
- [ ] Há pelo menos 1 analista na planilha USUARIOS (role = analista)
- [ ] Há pelo menos 1 entrevistador na planilha USUARIOS (role = entrevistador)

### **Configuração:**
- [ ] Script do Google Apps está atualizado e deployado
- [ ] URL do script está correta no `.env`
- [ ] localStorage foi limpo (`localStorage.clear()`)

### **Funcionalidade:**
- [ ] Admin consegue ver candidatos para alocar
- [ ] Admin consegue ver lista de analistas
- [ ] Analista consegue ver candidatos alocados para ele
- [ ] Entrevistador consegue ver candidatos alocados para ele
- [ ] Listas de classificados/desclassificados funcionam

---

## 🆘 SE AINDA NÃO FUNCIONAR

1. **Execute o diagnóstico completo:**
   ```javascript
   diagnosticoCompleto()
   ```

2. **Copie TODOS os logs**

3. **Compartilhe os logs** para análise

4. **Verifique:**
   - URL do Google Apps Script está correta?
   - Deploy foi feito como "Qualquer pessoa"?
   - Planilha tem permissão de acesso?

5. **Teste com dados de exemplo:**
   - Crie 1 candidato manualmente na planilha
   - Execute getCandidates() no script
   - Deve retornar esse candidato

---

## 📚 ARQUIVOS DE REFERÊNCIA

- `google-apps-script-COMPLETO-FINAL.js` - Script completo atualizado
- `google-apps-script-diagnostico.js` - Função de diagnóstico
- `COLUNAS_NECESSARIAS.md` - Lista completa de colunas
- `SOLUCAO_DEFINITIVA_AUTENTICACAO.md` - Correção do problema de autenticação

---

**BOA SORTE! 🚀**

Execute o diagnóstico, corrija os problemas encontrados e teste passo a passo.
