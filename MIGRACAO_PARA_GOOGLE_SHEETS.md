# Migração Completa para Google Sheets

## ✅ Mudanças Realizadas

### 1. Remoção de Dependências do Supabase

Todos os componentes foram atualizados para **não depender mais do Supabase**:

- ✅ `DisqualificationModal.tsx` - Busca motivos do Google Sheets
- ✅ `MessagingModal.tsx` - Busca templates do Google Sheets
- ✅ `ClassifiedCandidatesList.tsx` - Busca candidatos do Google Sheets
- ✅ `DisqualifiedCandidatesList.tsx` - Busca candidatos do Google Sheets
- ✅ `ReviewCandidatesList.tsx` - Busca candidatos do Google Sheets
- ✅ `AnalystDashboard.tsx` - Atualiza status no Google Sheets

### 2. Google Apps Script Atualizado

O arquivo `google-apps-script-updated.js` agora inclui:

#### Novas Abas Criadas Automaticamente:
- **MOTIVOS**: Motivos de desclassificação pré-cadastrados
- **MENSAGENS**: Log de todas as mensagens enviadas
- **TEMPLATES**: Templates de mensagens (Email e SMS)

#### Novas Funções:
- `getDisqualificationReasons()` - Retorna motivos de desclassificação
- `getMessageTemplates(messageType)` - Retorna templates filtrados por tipo
- `updateCandidateStatus()` - Atualiza status e informações de triagem
- `getCandidatesByStatus()` - Busca candidatos por status
- `logMessage()` - Registra mensagens enviadas

### 3. Estrutura das Novas Abas

#### Aba "MOTIVOS"
| ID | Motivo | Ativo |
|----|--------|-------|
| M001 | Documentação incompleta | Sim |
| M002 | Não atende aos requisitos mínimos da vaga | Sim |
| M003 | Formação incompatível com a vaga | Sim |
| M004 | Experiência insuficiente | Sim |
| M005 | Documentos ilegíveis ou com qualidade inadequada | Sim |
| M006 | Dados inconsistentes ou contraditórios | Sim |
| M007 | Não apresentou documentos obrigatórios | Sim |
| M008 | Fora do prazo de inscrição | Sim |
| M009 | Outros motivos | Sim |

#### Aba "TEMPLATES"
| ID | Nome | Tipo | Assunto | Conteúdo |
|----|------|------|---------|----------|
| T001 | Classificado - Email | email | ... | ... |
| T002 | Classificado - SMS | sms | | ... |
| T003 | Desclassificado - Email | email | ... | ... |
| T004 | Em Revisão - Email | email | ... | ... |

#### Aba "MENSAGENS"
| Data/Hora | Número Inscrição | Tipo | Destinatário | Assunto | Conteúdo | Enviado Por |
|-----------|------------------|------|--------------|---------|----------|-------------|
| ... | ... | email | ... | ... | ... | ... |

#### Aba "CANDIDATOS" (colunas adicionais)
- **Status**: Classificado / Desclassificado / Revisar
- **Motivo Desclassificação**: Texto do motivo
- **Observações**: Notas do analista
- **Data Triagem**: Data/hora da triagem
- **Analista**: Email do analista

## 📋 Instruções de Atualização

### Passo 1: Atualizar o Google Apps Script

1. Acesse sua planilha: https://docs.google.com/spreadsheets/d/1iQSQ06P_OXkqxaGWN3uG5jRYFBKyjWqQyvzuGk2EplY/edit
2. Vá em **Extensões** > **Apps Script**
3. **Copie todo o conteúdo** do arquivo `google-apps-script-updated.js`
4. **Cole no editor**, substituindo todo o código anterior
5. Clique em **Salvar**

### Passo 2: Testar o Script

1. No editor do Apps Script, execute a função `testConnection()`
2. Autorize as permissões se solicitado
3. Verifique nos logs se retorna sucesso

### Passo 3: Reimplantar (se necessário)

Se você criou uma nova implantação ou mudou o código significativamente:

1. No Apps Script, clique em **Implantar** > **Gerenciar implantações**
2. Clique no ícone de lápis na implantação ativa
3. Em "Versão", selecione **Nova versão**
4. Adicione uma descrição: "Migração completa para Google Sheets"
5. Clique em **Implantar**
6. A URL permanecerá a mesma

### Passo 4: Verificar Abas Criadas

Após executar qualquer função pela primeira vez, verifique se as novas abas foram criadas:

- ✅ MOTIVOS
- ✅ TEMPLATES
- ✅ MENSAGENS

Se não foram criadas automaticamente, execute manualmente no editor:
- `initMotivosSheet()`
- `initTemplatesSheet()`
- `initMensagensSheet()`
- `addStatusColumnIfNotExists()` - adiciona colunas na aba CANDIDATOS

## 🧪 Testes Recomendados

### Teste 1: Motivos de Desclassificação
1. Faça login como analista
2. Clique em "Desclassificar" em um candidato
3. Verifique se os motivos aparecem no modal
4. Selecione um motivo e desclassifique
5. Verifique na planilha se foi salvo

### Teste 2: Templates de Mensagens
1. Faça login como admin
2. Vá na aba "Classificados"
3. Selecione candidatos
4. Clique em "Enviar Mensagens"
5. Verifique se os templates aparecem
6. Selecione um template e envie
7. Verifique na aba "MENSAGENS" se foi registrado

### Teste 3: Classificação de Candidatos
1. Como analista, classifique um candidato
2. Verifique na aba "CANDIDATOS" se:
   - Status = "Classificado"
   - Data Triagem foi preenchida
   - Analista foi preenchido

### Teste 4: Listas no Admin
1. Como admin, acesse cada aba:
   - Classificados
   - Desclassificados
   - À Revisar
2. Verifique se os candidatos aparecem corretamente

## 🔧 Personalização

### Editar Motivos de Desclassificação
1. Acesse a aba "MOTIVOS" na planilha
2. Edite os motivos existentes ou adicione novos
3. Mantenha a coluna "Ativo" como "Sim" para aparecer no sistema

### Editar Templates de Mensagens
1. Acesse a aba "TEMPLATES" na planilha
2. Edite os templates existentes ou adicione novos
3. Use as variáveis:
   - `[NOME]` - Nome do candidato
   - `[CARGO]` - Cargo pretendido
   - `[AREA]` - Área de atuação

### Adicionar Novas Colunas na Aba CANDIDATOS
Se precisar adicionar colunas personalizadas:
1. Edite a função `addStatusColumnIfNotExists()` no script
2. Adicione o nome da coluna no array `requiredColumns`
3. Salve e execute a função

## ⚠️ Importante

1. **Não delete as abas** MOTIVOS, TEMPLATES e MENSAGENS
2. **Mantenha os cabeçalhos** (linha 1) nas abas
3. **Não altere as colunas ID** nas abas MOTIVOS e TEMPLATES
4. **Faça backup** da planilha antes de fazer alterações grandes

## 📞 Solução de Problemas

### Erro: "Ação não encontrada"
- Certifique-se de copiar TODO o código atualizado
- Verifique se salvou o script
- Tente reimplantar

### Motivos não aparecem no modal
- Execute manualmente `initMotivosSheet()` no editor
- Verifique se a aba MOTIVOS existe
- Verifique se há motivos com "Ativo" = "Sim"

### Templates não aparecem
- Execute manualmente `initTemplatesSheet()` no editor
- Verifique se a aba TEMPLATES existe
- Verifique se o tipo (email/sms) está correto

### Status não atualiza
- Execute manualmente `addStatusColumnIfNotExists()` no editor
- Verifique se as colunas foram adicionadas na aba CANDIDATOS
- Verifique os logs do Apps Script (View > Logs)

## 🎉 Benefícios da Migração

✅ **Zero dependência do Supabase**
✅ **Tudo em um único lugar** (Google Sheets)
✅ **Fácil de editar** motivos e templates
✅ **Histórico completo** de mensagens
✅ **Mais rápido** (menos requisições de rede)
✅ **Mais confiável** (Google infrastructure)
