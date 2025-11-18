# Instruções para Atualizar o Google Apps Script

## 1. Acessar o Google Apps Script

1. Abra sua planilha do Google Sheets: https://docs.google.com/spreadsheets/d/1iQSQ06P_OXkqxaGWN3uG5jRYFBKyjWqQyvzuGk2EplY/edit
2. Clique em **Extensões** > **Apps Script**
3. Isso abrirá o editor do Google Apps Script

## 2. Atualizar o Código

1. No editor, você verá o código atual
2. **Copie todo o conteúdo do arquivo `google-apps-script-updated.js`**
3. **Cole no editor, substituindo todo o código existente**
4. Clique em **Salvar** (ícone de disquete)

## 3. Preparar as Planilhas

O script criará automaticamente as abas necessárias, mas você pode preparar a estrutura:

### Aba "CANDIDATOS"
Adicione as seguintes colunas (se ainda não existirem):
- `Status` - para armazenar: Classificado, Desclassificado ou Revisar
- `Motivo Desclassificação` - motivo quando desclassificado
- `Observações` - notas do analista
- `Data Triagem` - data/hora da triagem
- `Analista` - email do analista que fez a triagem

### Aba "MOTIVOS" (será criada automaticamente)
O script criará esta aba com os motivos padrão de desclassificação:
- M001: Documentação incompleta
- M002: Não atende aos requisitos mínimos da vaga
- M003: Formação incompatível com a vaga
- M004: Experiência insuficiente
- M005: Documentos ilegíveis ou com qualidade inadequada
- M006: Dados inconsistentes ou contraditórios
- M007: Não apresentou documentos obrigatórios
- M008: Fora do prazo de inscrição
- M009: Outros motivos

### Aba "MENSAGENS" (será criada automaticamente)
O script criará esta aba para registrar todas as mensagens enviadas aos candidatos.

## 4. Testar o Script

1. No editor do Apps Script, clique em **Executar** > Selecione a função `testConnection`
2. Na primeira execução, ele pedirá autorização:
   - Clique em **Revisar permissões**
   - Escolha sua conta Google
   - Clique em **Avançado** > **Ir para [nome do projeto] (não seguro)**
   - Clique em **Permitir**
3. Verifique os logs (Ctrl + Enter) para confirmar que funcionou

## 5. Criar Nova Implantação (se necessário)

Se você ainda não tem uma implantação ou quer criar uma nova:

1. No editor do Apps Script, clique em **Implantar** > **Nova implantação**
2. Clique no ícone de engrenagem ⚙️ e selecione **Aplicativo da Web**
3. Configure:
   - **Descrição**: Sistema de Triagem v2
   - **Executar como**: Eu (sua conta)
   - **Quem tem acesso**: Qualquer pessoa
4. Clique em **Implantar**
5. **Copie a URL gerada** (ela deve ser parecida com a que você já tem)
6. Se a URL mudou, atualize no arquivo `.env` do projeto:
   ```
   VITE_GOOGLE_SCRIPT_URL=<nova URL>
   ```

## 6. Verificar Funcionalidades

Após a implantação, teste as seguintes funcionalidades:

### Teste 1: Classificar Candidato
1. No sistema, faça login como analista
2. Selecione um candidato
3. Clique em "Classificar"
4. Verifique na planilha se a coluna "Status" foi atualizada para "Classificado"

### Teste 2: Desclassificar Candidato
1. Selecione um candidato
2. Clique em "Desclassificar"
3. Escolha um motivo no pop-up
4. Adicione observações (opcional)
5. Confirme
6. Verifique na planilha se:
   - "Status" = "Desclassificado"
   - "Motivo Desclassificação" foi preenchido
   - "Observações" foi preenchido (se você adicionou)
   - "Data Triagem" foi preenchida
   - "Analista" foi preenchido

### Teste 3: Marcar para Revisão
1. Selecione um candidato
2. Clique em "Revisar"
3. Verifique na planilha se "Status" = "Revisar"

### Teste 4: Visualizar Listas no Admin
1. Faça login como admin
2. Clique na aba "Classificados" - deve mostrar candidatos classificados
3. Clique na aba "Desclassificados" - deve mostrar candidatos desclassificados
4. Clique na aba "À Revisar" - deve mostrar candidatos para revisão

### Teste 5: Enviar Mensagens
1. Na aba "Classificados", selecione candidatos (checkbox)
2. Clique em "Enviar Mensagens"
3. Escolha o tipo (Email ou SMS)
4. Selecione um template
5. Personalize a mensagem se necessário
6. Envie
7. Verifique na aba "MENSAGENS" da planilha se foi registrado

## 7. Solução de Problemas

### Erro: "Ação não encontrada"
- Certifique-se de que copiou TODO o código do arquivo `google-apps-script-updated.js`
- Salve novamente o script
- Reimplante o aplicativo

### Erro: "Candidato não encontrado"
- Verifique se a coluna "Número de Inscrição" existe na aba CANDIDATOS
- Verifique se o candidato tem um número de inscrição válido

### Mensagens não aparecem na planilha
- Verifique se a aba "MENSAGENS" foi criada
- Execute a função `initMensagensSheet()` manualmente no editor

### Status não atualiza
- Verifique se a coluna "Status" existe na aba CANDIDATOS
- Execute a função `addStatusColumnIfNotExists()` manualmente no editor

## 8. Adicionar Colunas Manualmente (se necessário)

Se as colunas não forem criadas automaticamente, adicione-as manualmente:

1. Abra a aba "CANDIDATOS"
2. Adicione as seguintes colunas no cabeçalho (linha 1):
   - Status
   - Motivo Desclassificação
   - Observações
   - Data Triagem
   - Analista

## 9. Dados dos Templates de Mensagens

Os templates de mensagens estão armazenados no Supabase. Se precisar gerenciá-los:

1. Acesse o painel do Supabase
2. Vá em "Table Editor"
3. Selecione a tabela `messages_templates`
4. Você pode adicionar, editar ou desativar templates

## Suporte

Se tiver problemas:
1. Verifique os logs do Apps Script (Ctrl + Enter no editor)
2. Verifique o console do navegador (F12)
3. Certifique-se de que todas as URLs e IDs estão corretos no arquivo `.env`
