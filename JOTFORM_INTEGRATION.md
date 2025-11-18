# Integração Jotform → Google Sheets

Este guia explica como configurar a integração automática entre o Jotform e o Google Sheets para eliminar downloads manuais.

## Passo 1: Configurar Integração Nativa Jotform

O Jotform possui integração nativa com Google Sheets que é simples e confiável.

### 1.1 No Jotform:

1. Abra seu formulário no Jotform
2. Clique em **Settings** → **Integrations**
3. Procure por **Google Sheets** na lista de integrações
4. Clique em **Add Integration**
5. Faça login com sua conta Google
6. Autorize o Jotform a acessar suas planilhas
7. Selecione a planilha onde deseja enviar os dados
8. Configure o mapeamento de campos:
   - Cada campo do formulário deve corresponder a uma coluna na planilha
   - Use os mesmos nomes de colunas que estão configurados na aplicação

### 1.2 Mapeamento de Campos Recomendado:

Certifique-se de que sua planilha tenha estas colunas (na ordem):

| Coluna | Descrição |
|--------|-----------|
| Número de Inscrição | ID único da submissão |
| Data de Envio | Data/hora da submissão |
| Nome Completo | Nome do candidato |
| Telefone | Telefone/celular |
| Área | Administrativa ou Assistencial |
| Cargo Administrativo | Cargo para área administrativa |
| Cargo Assistencial | Cargo para área assistencial |
| Currículo (Administrativo) | URL do currículo - administrativa |
| Diploma (Administrativo) | URL do diploma - administrativa |
| Documentos Pessoais (Administrativo) | URLs dos documentos - administrativa |
| Cursos (Administrativo) | URLs de certificados - administrativa |
| Currículo (Assistencial) | URL do currículo - assistencial |
| Diploma (Assistencial) | URL do diploma - assistencial |
| Carteira do Conselho | URL da carteira - assistencial |
| Cursos (Assistencial) | URLs de certificados - assistencial |
| Documentos Pessoais (Assistencial) | URLs dos documentos - assistencial |
| Status Triagem | Classificado/Desclassificado/Revisar |
| Data Hora Triagem | Timestamp da triagem |
| Analista Triagem | Email do analista |

## Passo 2: Testar a Integração

1. Faça uma submissão de teste no formulário
2. Verifique se os dados aparecem automaticamente na planilha
3. Atualize a aplicação (botão refresh)
4. Confirme que o candidato aparece na lista

## Passo 3: Configurar Permissões da Planilha

Para que múltiplos analistas possam trabalhar:

1. Abra a planilha no Google Sheets
2. Clique em **Compartilhar**
3. Adicione os emails dos analistas
4. Configure permissão como **Editor**
5. Desmarque "Notificar pessoas" (opcional)

## Vantagens da Integração Nativa

- **Confiável**: Mantida oficialmente pelo Jotform
- **Tempo Real**: Dados aparecem instantaneamente
- **Sem Código**: Não requer programação
- **Escalável**: Suporta milhares de submissões
- **Backup Automático**: Dados ficam no Google Sheets

## Visualização de Documentos

Os documentos enviados no Jotform ficam hospedados nos servidores do Jotform. A aplicação:

1. Detecta automaticamente múltiplos arquivos por campo
2. Cria botões para cada arquivo
3. Abre os documentos em nova aba (sem download)
4. Suporta PDFs, imagens e outros formatos

### URLs dos Documentos

O Jotform fornece URLs diretas dos arquivos no formato:
```
https://www.jotform.com/uploads/[user]/[form]/[submission]/[filename]
```

Essas URLs são permanentes e podem ser acessadas diretamente.

## Solução de Problemas

### Dados não aparecem na planilha

1. Verifique se a integração está ativa no Jotform
2. Confirme as permissões da conta Google
3. Teste com uma nova submissão
4. Verifique se não há filtros aplicados na planilha

### Aplicação não mostra candidatos novos

1. Clique no botão **Refresh** (atualizar)
2. Verifique se os filtros não estão escondendo candidatos
3. Confirme que a planilha está configurada corretamente no código

### Documentos não abrem

1. Verifique se as URLs estão corretas na planilha
2. Confirme que os arquivos foram enviados no Jotform
3. Teste abrir a URL diretamente no navegador
4. Verifique permissões de acesso aos arquivos

## Estratégia para 15 Mil Candidatos

### Dividir o Trabalho:

1. **Por Área**: Configure filtros para Administrativa e Assistencial
2. **Por Lote**: Cada analista filtra por data/período
3. **Por Status**: Separe pendentes, classificados e desclassificados

### Melhorar Performance:

1. **Filtros**: Use os filtros da aplicação para carregar menos dados
2. **Paginação**: Trabalhe em lotes de 50-100 candidatos
3. **Cache do Navegador**: Os dados ficam em cache após o primeiro carregamento
4. **Múltiplas Abas**: Crie abas separadas na planilha por região/área

### Trabalho Simultâneo:

1. Cada analista marca o campo "Analista Triagem" com seu email
2. Use filtros para ver apenas seus candidatos
3. Evite trabalhar no mesmo candidato ao mesmo tempo
4. Atualize frequentemente para ver mudanças de outros analistas

## Backup e Segurança

- **Histórico de Versões**: Google Sheets mantém histórico automático
- **Backup Manual**: Faça cópias periódicas da planilha
- **Permissões**: Controle quem pode editar vs visualizar
- **Auditoria**: Coluna "Analista Triagem" rastreia quem fez cada triagem

## Próximos Passos

1. Configure a integração Jotform → Google Sheets
2. Teste com algumas submissões
3. Treine a equipe de analistas
4. Comece a triagem com os atalhos de teclado (1, 2, 3)
5. Monitore o progresso através das métricas
