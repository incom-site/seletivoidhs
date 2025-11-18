# 📋 COLUNAS NECESSÁRIAS NAS PLANILHAS

## 🔍 ANÁLISE COMPLETA DO SISTEMA

### **PLANILHA: USUARIOS**

Estrutura correta (7 colunas):
```
A: Email
B: Nome
C: Role
D: ID
E: DataCriacao
F: Ativo
G: Password
```

**Valores do Role:**
- `admin` (lowercase)
- `analista` (lowercase)
- `entrevistador` (lowercase)

---

### **PLANILHA: CANDIDATOS**

#### **Colunas Obrigatórias do Jotform:**
- NUMEROINSCRICAO
- CPF
- NOMECOMPLETO
- NOMESOCIAL
- AREAATUACAO
- CARGOPRETENDIDO
- VAGAPCD
- CURRICULOVITAE
- DOCUMENTOSPESSOAIS
- DOCUMENTOSPROFISSIONAIS
- DIPLOMACERTIFICADO
- DOCUMENTOSCONSELHO
- ESPECIALIZACOESCURSOS
- LAUDO MEDICO (se PCD)

#### **Colunas de Controle do Sistema:**

**Triagem (Analista):**
- `Status` - Status da triagem (vazio, Classificado, Desclassificado, Revisar)
- `Analista` - Email do analista responsável
- `Data Triagem` - Data/hora da triagem
- `Motivo Desclassificação` - Motivo se desclassificado
- `Observações` - Observações do analista

**Atribuição:**
- `assigned_to` - Email do analista atribuído (sinônimo de Analista)
- `assigned_at` - Data/hora da atribuição
- `assigned_by` - Email do admin que atribuiu

**Entrevista:**
- `Entrevistador` - Email do entrevistador responsável
- `entrevistador_at` - Data/hora da alocação para entrevista
- `Status Entrevista` - Status da entrevista
- `Data Entrevista` - Data/hora da entrevista
- `Avaliacao Entrevista` - Nota ou avaliação
- `Observacoes Entrevista` - Observações da entrevista

**Mensagens:**
- `Status Mensagem` - Status do envio (Pendente, Enviada, Falha)
- `Ultima Mensagem` - Última mensagem enviada
- `Data Envio` - Data do último envio

---

### **PLANILHA: MOTIVOS**

Estrutura:
```
A: ID
B: Motivo
C: Ativo
```

Motivos padrão:
- Documentação incompleta
- Não atende requisitos mínimos
- Fora do perfil da vaga
- Duplicidade de cadastro
- Outros

---

### **PLANILHA: MENSAGENS (Opcional)**

Estrutura:
```
A: ID
B: Candidato_CPF
C: Tipo
D: Status
E: Mensagem
F: Data_Envio
G: Erro
```

---

## 🔧 MAPEAMENTO DE COLUNAS NO CÓDIGO

### **Função getCandidates()**
Retorna TODAS as colunas da planilha CANDIDATOS.

```javascript
return {
  candidates: values.map(row => {
    const obj = {};
    headers.forEach((h, j) => obj[h] = row[j]);
    return obj;
  })
};
```

### **Função updateCandidateStatus()**
Atualiza:
- `Status` ou `status`
- `Analista` ou `analista` ou `assigned_to`
- `Data Triagem` ou `datatriagem`
- `Motivo Desclassificação` ou `motivodesclassificacao`
- `Observações` ou `observacoes`

### **Função assignCandidates()**
Atualiza:
- `assigned_to` ou `analista`
- `assigned_at` ou `assignedat`
- `assigned_by` ou `assignedby`
- `Status` (para "em_analise")

### **Função getInterviewerCandidates()**
Busca por:
- `Entrevistador` ou `entrevistador`

### **Função allocateToInterviewer()**
Atualiza:
- `Entrevistador` ou `entrevistador`
- `entrevistador_at` ou `entrevistadorat`

---

## ⚠️ PROBLEMAS COMUNS

### **1. Colunas com Nomes Variados**

O código procura variações:
```javascript
const statusCol = col['Status'] ?? col['status'];
const analystCol = col['Analista'] ?? col['analista'] ?? col['assigned_to'];
```

**Problema:** Se a coluna tiver nome diferente (ex: `StatusTriagem`), não será encontrada.

**Solução:** Use os nomes exatos ou adicione ao mapeamento.

### **2. Colunas Ausentes**

Se uma coluna não existe, o código retorna `undefined`:
```javascript
if (statusCol === undefined) return [];
```

**Problema:** Funções podem retornar arrays vazios.

**Solução:** Execute `setupAllSheets()` para criar colunas.

### **3. Case Sensitivity**

O mapeamento converte para lowercase:
```javascript
function _colMap_(headers) {
  const map = {};
  for (let i = 0; i < headers.length; i++) {
    const k = String(headers[i]).toLowerCase().trim().replace(/\s+/g, '');
    map[k] = i;
  }
  return map;
}
```

**Colunas aceitas:**
- `Status` → `status`
- `Analista` → `analista`
- `AREAATUACAO` → `areaatuacao`
- `Data Triagem` → `datatriagem`

---

## ✅ VERIFICAÇÃO DE COLUNAS

### **Script de Verificação (Google Apps Script):**

```javascript
function verificarColunasNecessarias() {
  Logger.log('═'.repeat(60));
  Logger.log('VERIFICAÇÃO DE COLUNAS NECESSÁRIAS');
  Logger.log('═'.repeat(60));

  // Verificar USUARIOS
  Logger.log('\n📋 PLANILHA USUARIOS:');
  const usuarios = SpreadsheetApp.openById('SEU_ID').getSheetByName('USUARIOS');
  const usuariosHeaders = usuarios.getRange(1, 1, 1, usuarios.getLastColumn()).getValues()[0];
  Logger.log('Colunas: ' + usuariosHeaders.join(', '));

  const usuariosEsperadas = ['Email', 'Nome', 'Role', 'ID', 'DataCriacao', 'Ativo', 'Password'];
  usuariosEsperadas.forEach(col => {
    const existe = usuariosHeaders.includes(col);
    Logger.log(`  ${existe ? '✅' : '❌'} ${col}`);
  });

  // Verificar CANDIDATOS
  Logger.log('\n📋 PLANILHA CANDIDATOS:');
  const candidatos = SpreadsheetApp.openById('SEU_ID').getSheetByName('CANDIDATOS');
  const candidatosHeaders = candidatos.getRange(1, 1, 1, candidatos.getLastColumn()).getValues()[0];
  Logger.log('Total de colunas: ' + candidatosHeaders.length);
  Logger.log('Colunas: ' + candidatosHeaders.join(', '));

  const candidatosObrigatorias = [
    'CPF', 'NOMECOMPLETO', 'AREAATUACAO', 'CARGOPRETENDIDO',
    'Status', 'Analista', 'assigned_to', 'Entrevistador'
  ];
  Logger.log('\nColunas obrigatórias:');
  candidatosObrigatorias.forEach(col => {
    const existe = candidatosHeaders.some(h =>
      String(h).toLowerCase().trim().replace(/\s+/g, '') ===
      col.toLowerCase().trim().replace(/\s+/g, '')
    );
    Logger.log(`  ${existe ? '✅' : '❌'} ${col}`);
  });

  // Verificar MOTIVOS
  Logger.log('\n📋 PLANILHA MOTIVOS:');
  const motivos = SpreadsheetApp.openById('SEU_ID').getSheetByName('MOTIVOS');
  if (motivos) {
    const motivosHeaders = motivos.getRange(1, 1, 1, motivos.getLastColumn()).getValues()[0];
    Logger.log('Colunas: ' + motivosHeaders.join(', '));
  } else {
    Logger.log('❌ Planilha MOTIVOS não existe!');
  }

  Logger.log('\n' + '═'.repeat(60));
}
```

---

## 🚀 AÇÃO NECESSÁRIA

1. **Execute `setupAllSheets()` no Google Apps Script**
   - Cria todas as planilhas necessárias
   - Adiciona todas as colunas de controle
   - Configura valores padrão

2. **Verifique a estrutura:**
   ```javascript
   verificarColunasNecessarias();
   ```

3. **Se faltarem colunas, adicione manualmente ou re-execute setup**

---

**FIM DO DOCUMENTO**
