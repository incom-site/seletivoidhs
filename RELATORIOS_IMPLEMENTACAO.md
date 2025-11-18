# Página de Relatórios - Implementação Completa

## 📊 Visão Geral

Foi criada uma página de relatórios completa e funcional no painel do Admin, com filtros por analista e diferentes tipos de relatórios.

## ✨ Funcionalidades Implementadas

### 1. Tipos de Relatórios

#### **Classificados - Triagem**
Lista todos os candidatos que foram **classificados** na fase de triagem.

**Campos exibidos:**
- Nome Completo
- Nome Social
- CPF
- Telefone
- Cargo Pretendido
- PCD

#### **Desclassificados - Triagem**
Lista todos os candidatos que foram **desclassificados** na fase de triagem.

**Campos exibidos:**
- Nome Completo
- Nome Social
- CPF
- Telefone
- Cargo Pretendido
- **Motivo Desclassificação**
- PCD

#### **Classificados - Entrevista**
Lista todos os candidatos que foram **classificados** após a entrevista.

**Campos exibidos:**
- Nome Completo
- Nome Social
- CPF
- Telefone
- Cargo Pretendido
- **Pontuação (0-120)**
- PCD

#### **Desclassificados - Entrevista**
Lista todos os candidatos que foram **desclassificados** após a entrevista.

**Campos exibidos:**
- Nome Completo
- Nome Social
- CPF
- Telefone
- Cargo Pretendido
- **Pontuação (0-120)**
- PCD

### 2. Filtros

#### **Por Analista**
- **Todos os Analistas:** Exibe dados de todos os analistas
- **Analista Específico:** Filtra dados de um analista específico

#### **Por Tipo de Relatório**
Dropdown com 4 opções de relatório

### 3. Estatísticas Gerais

Painel com 4 cards mostrando:
- 📊 **Classificados:** Total de candidatos classificados na triagem
- ❌ **Desclassificados:** Total de candidatos desclassificados na triagem
- ✅ **Aprovados Entrevista:** Total de candidatos aprovados na entrevista
- 🚫 **Reprovados Entrevista:** Total de candidatos reprovados na entrevista

### 4. Exportação CSV

Botão para exportar o relatório atual em formato CSV, incluindo:
- Todos os dados visíveis na tabela
- Nome do arquivo com data: `relatorio_[tipo]_[data].csv`
- Encoding UTF-8 para suporte a caracteres especiais

## 🏗️ Arquitetura

### Frontend

#### **Componente: `ReportsPage.tsx`**
Localização: `/src/components/ReportsPage.tsx`

**Responsabilidades:**
- Renderizar interface de relatórios
- Gerenciar filtros (analista e tipo)
- Carregar estatísticas e dados
- Exportar para CSV
- Exibir tabelas formatadas

**Props:**
```typescript
interface ReportsPageProps {
  onClose: () => void;
}
```

**Estados:**
```typescript
const [loading, setLoading] = useState(false);
const [analysts, setAnalysts] = useState<Array<{...}>>([]);
const [selectedAnalyst, setSelectedAnalyst] = useState<string>('todos');
const [reportType, setReportType] = useState<ReportType>('classificados');
const [reportData, setReportData] = useState<Candidate[]>([]);
const [stats, setStats] = useState({...});
```

#### **Serviço: `googleSheets.ts`**
Localização: `/src/services/googleSheets.ts`

**Novas Funções:**

1. **`getReportStats()`**
   - Retorna estatísticas gerais
   - Sem parâmetros
   - Retorna: `{ classificados, desclassificados, entrevistaClassificados, entrevistaDesclassificados }`

2. **`getReport(reportType, analystEmail?)`**
   - Retorna dados do relatório
   - Parâmetros:
     - `reportType`: 'classificados' | 'desclassificados' | 'entrevista_classificados' | 'entrevista_desclassificados'
     - `analystEmail`: (opcional) Email do analista para filtro
   - Retorna: Array de candidatos

### Backend (Google Apps Script)

#### **Função: `getReportStats()`**
Localização: `google-apps-script-final-corrigido.js` (linha ~1415)

**Lógica:**
1. Lê toda a planilha CANDIDATOS
2. Conta candidatos por status:
   - Status = 'Classificado' → classificados++
   - Status = 'Desclassificado' → desclassificados++
   - status_entrevista = 'Avaliado' + interview_result = 'Classificado' → entrevistaClassificados++
   - status_entrevista = 'Avaliado' + interview_result = 'Desclassificado' → entrevistaDesclassificados++
3. Retorna objeto com contadores

**Retorno:**
```javascript
{
  classificados: 45,
  desclassificados: 23,
  entrevistaClassificados: 18,
  entrevistaDesclassificados: 8
}
```

#### **Função: `getReport(params)`**
Localização: `google-apps-script-final-corrigido.js` (linha ~1477)

**Parâmetros:**
```javascript
{
  reportType: 'classificados' | 'desclassificados' | 'entrevista_classificados' | 'entrevista_desclassificados',
  analystEmail?: 'analista@email.com'
}
```

**Lógica:**
1. Lê toda a planilha CANDIDATOS
2. Para cada candidato:
   - Se `analystEmail` fornecido: filtra por coluna 'Analista'
   - Aplica filtro de tipo:
     - `classificados`: Status = 'Classificado'
     - `desclassificados`: Status = 'Desclassificado'
     - `entrevista_classificados`: status_entrevista = 'Avaliado' + interview_result = 'Classificado'
     - `entrevista_desclassificados`: status_entrevista = 'Avaliado' + interview_result = 'Desclassificado'
3. Retorna array de candidatos filtrados

**Retorno:**
```javascript
[
  {
    CPF: '12345678900',
    NOMECOMPLETO: 'João Silva',
    NOMESOCIAL: 'João',
    TELEFONE: '(99) 99999-9999',
    CARGOPRETENDIDO: 'Enfermeiro',
    VAGAPCD: 'Não',
    Status: 'Classificado',
    'Motivo Desclassificação': '',
    Analista: 'analista@email.com',
    // ... outros campos
  },
  // ... mais candidatos
]
```

## 🎨 Interface do Usuário

### Painel de Estatísticas
```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│  Classificados  │ Desclassificados│ Aprov. Entrev.  │ Reprov. Entrev. │
│       45        │       23        │       18        │        8        │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

### Filtros
```
🔍 Filtros:   [Tipo de Relatório ▼]   [Analista ▼]   [📥 Exportar CSV]
```

### Tabela de Dados
```
┌────────────────┬─────────────┬──────────────┬──────────────┬──────────────────┬──────┐
│ Nome Completo  │ Nome Social │     CPF      │   Telefone   │ Cargo Pretendido │ PCD  │
├────────────────┼─────────────┼──────────────┼──────────────┼──────────────────┼──────┤
│ João Silva     │ João        │ 12345678900  │ 99999-9999   │ Enfermeiro       │ Não  │
│ Maria Santos   │ Maria       │ 98765432100  │ 88888-8888   │ Médico           │ Sim  │
└────────────────┴─────────────┴──────────────┴──────────────┴──────────────────┴──────┘
```

## 🚀 Como Usar

### 1. Acessar Relatórios

1. Faça login como **Admin**
2. Clique na aba **"Relatórios"** (ícone 📄)
3. A página de relatórios será exibida

### 2. Visualizar Estatísticas

As estatísticas são carregadas automaticamente ao abrir a página:
- Classificados (triagem)
- Desclassificados (triagem)
- Aprovados na entrevista
- Reprovados na entrevista

### 3. Selecionar Tipo de Relatório

Use o dropdown "Tipo de Relatório":
- **Classificados - Triagem**
- **Desclassificados - Triagem**
- **Classificados - Entrevista**
- **Desclassificados - Entrevista**

### 4. Filtrar por Analista

Use o dropdown "Analista":
- **Todos os Analistas** (padrão)
- Selecione um analista específico da lista

### 5. Exportar CSV

1. Selecione o relatório desejado
2. Aplique os filtros (se necessário)
3. Clique no botão **"Exportar CSV"**
4. O arquivo será baixado automaticamente

**Exemplo de nome do arquivo:**
```
relatorio_classificados_2024-01-15.csv
relatorio_entrevista_desclassificados_2024-01-15.csv
```

## 📁 Estrutura de Dados CSV

### Classificados - Triagem
```csv
Nome Completo,Nome Social,CPF,Telefone,Cargo Pretendido,PCD
"João Silva","João","12345678900","(99) 99999-9999","Enfermeiro","Não"
"Maria Santos","Maria","98765432100","(99) 88888-8888","Médico","Sim"
```

### Desclassificados - Triagem
```csv
Nome Completo,Nome Social,CPF,Telefone,Cargo Pretendido,Motivo Desclassificação,PCD
"Pedro Lima","Pedro","11122233344","(99) 77777-7777","Técnico","Não atende requisitos","Não"
```

### Classificados/Desclassificados - Entrevista
```csv
Nome Completo,Nome Social,CPF,Telefone,Cargo Pretendido,Pontuação,PCD
"Ana Costa","Ana","55566677788","(99) 66666-6666","Enfermeiro","95/120","Não"
"Carlos Souza","Carlos","99988877766","(99) 55555-5555","Médico","45/120","Não"
```

## 🔧 Configuração

### Passo 1: Atualizar Google Apps Script

1. Copie **TODO** o arquivo `google-apps-script-final-corrigido.js`
2. Acesse: https://script.google.com
3. Cole no editor (substitua tudo)
4. Salve (Ctrl+S)
5. Implante > Nova versão

### Passo 2: Verificar Colunas da Planilha

Certifique-se de que a planilha CANDIDATOS tem as colunas:
- ✅ `Status` (Classificado/Desclassificado)
- ✅ `Analista` (email do analista)
- ✅ `status_entrevista` (Aguardando/Avaliado)
- ✅ `interview_result` (Classificado/Desclassificado)
- ✅ `interview_score` (0-120)
- ✅ `Motivo Desclassificação`

### Passo 3: Testar

1. Faça login como Admin
2. Acesse "Relatórios"
3. Verifique se as estatísticas aparecem
4. Teste cada tipo de relatório
5. Teste filtro por analista
6. Teste exportação CSV

## 🎯 Casos de Uso

### Caso 1: Relatório Geral de Classificados
```
1. Admin acessa Relatórios
2. Seleciona "Classificados - Triagem"
3. Mantém "Todos os Analistas"
4. Visualiza lista completa
5. Exporta CSV para arquivamento
```

### Caso 2: Desempenho de Analista Específico
```
1. Admin acessa Relatórios
2. Seleciona analista no dropdown
3. Verifica quantos candidatos foram classificados
4. Muda para "Desclassificados - Triagem"
5. Verifica motivos de desclassificação
```

### Caso 3: Resultado das Entrevistas
```
1. Admin acessa Relatórios
2. Seleciona "Classificados - Entrevista"
3. Verifica pontuações dos aprovados
4. Muda para "Desclassificados - Entrevista"
5. Analisa pontuações dos reprovados
6. Exporta ambos relatórios
```

## 📊 Logs do Google Apps Script

### getReportStats
```
📊 Gerando estatísticas de relatórios
✅ Estatísticas geradas
   - Classificados: 45
   - Desclassificados: 23
   - Entrevista Classificados: 18
   - Entrevista Desclassificados: 8
```

### getReport
```
📋 Gerando relatório: classificados
✅ Relatório gerado: 45 registros
```

```
📋 Gerando relatório: desclassificados
   - Filtro por analista: analista@email.com
✅ Relatório gerado: 12 registros
```

## 🔍 Validação de Pontuação

As pontuações na entrevista são exibidas com cores:
- 🟢 **Verde:** ≥ 80 pontos (Bom desempenho)
- 🟡 **Amarelo:** 60-79 pontos (Desempenho médio)
- 🔴 **Vermelho:** < 60 pontos (Desempenho baixo)

## ⚠️ Tratamento de Erros

### Erro: Estatísticas não carregam
**Causa:** Script não está implantado ou URL incorreta

**Solução:**
1. Verifique se o script foi implantado
2. Confirme a URL no `.env`
3. Verifique logs do Google Apps Script

### Erro: Tabela vazia
**Causa:** Nenhum candidato corresponde aos filtros

**Solução:**
1. Verifique se existem candidatos com o status selecionado
2. Remova filtro de analista
3. Teste outro tipo de relatório

### Erro: CSV não exporta
**Causa:** Bloqueador de pop-up ou dados vazios

**Solução:**
1. Permita pop-ups do site
2. Verifique se há dados na tabela
3. Tente outro navegador

## 🆕 Integração no AdminDashboard

### Nova Aba
- **Ícone:** 📄 FileText
- **Label:** "Relatórios"
- **Cor:** Roxo (purple-600)
- **Posição:** Última aba à direita

### Estado
```typescript
type ActiveTab =
  | 'allocation'
  | 'my-candidates'
  | 'import'
  | 'classified'
  | 'disqualified'
  | 'review'
  | 'interview'
  | 'reports';  // ← NOVO
```

## 📝 Checklist de Funcionalidades

- ✅ Painel de estatísticas com 4 métricas
- ✅ Dropdown de tipo de relatório (4 opções)
- ✅ Dropdown de analista (Todos + Lista de analistas)
- ✅ Tabela responsiva com dados formatados
- ✅ Exportação CSV funcional
- ✅ Loading states
- ✅ Estado vazio (sem dados)
- ✅ Integração com Google Apps Script
- ✅ Filtros reativos (atualiza ao mudar)
- ✅ Build sem erros
- ✅ Aba no AdminDashboard

## 🎉 Conclusão

A página de relatórios está **100% funcional** e integrada ao sistema, permitindo que o admin:

1. ✅ Visualize estatísticas gerais do processo seletivo
2. ✅ Gere relatórios detalhados por tipo
3. ✅ Filtre por analista específico
4. ✅ Exporte dados em CSV
5. ✅ Analise resultados de triagem e entrevista
6. ✅ Acompanhe desempenho de candidatos

**Status:** Pronto para uso! 🚀
