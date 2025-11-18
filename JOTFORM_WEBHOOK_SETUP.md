# Configuração do Webhook Jotform → Supabase

Este guia explica como configurar o Jotform para enviar automaticamente as submissões para o banco de dados Supabase, eliminando a necessidade de downloads manuais.

## Pré-requisitos

- Formulário ativo no Jotform
- Edge Function `jotform-webhook` já implantada no Supabase
- URL do projeto Supabase

## Passo 1: Obter a URL do Webhook

A URL do seu webhook é:

```
https://[SEU-PROJETO].supabase.co/functions/v1/jotform-webhook
```

Substitua `[SEU-PROJETO]` pelo ID do seu projeto Supabase.

## Passo 2: Configurar Webhook no Jotform

1. Acesse o **Jotform** e abra seu formulário
2. Clique em **Settings** (Configurações)
3. No menu lateral, clique em **Integrations** (Integrações)
4. Procure por **Webhooks** e clique em **Add Integration**
5. Cole a URL do webhook obtida no Passo 1
6. Selecione o método: **POST**
7. Clique em **Complete Integration**

## Passo 3: Mapear os Campos do Formulário

O webhook espera os seguintes campos (ajuste os nomes conforme seu formulário):

### Campos Obrigatórios:
- `nome` - Nome completo do candidato
- `area` - Área da vaga (Administrativa ou Assistencial)

### Campos Opcionais:
- `telefone` - Telefone/celular
- `cargo` - Cargo pretendido
- `curriculo` - URL do currículo
- `diploma` - URL do diploma
- `documentos` - URLs dos documentos pessoais
- `cursos` - URLs dos certificados de cursos
- `carteira` - URL da carteira do conselho (apenas Assistencial)

## Passo 4: Testar a Integração

1. Faça uma submissão de teste no formulário
2. Verifique no Supabase se o registro foi criado na tabela `candidates`
3. Acesse a aplicação e veja se o candidato aparece na lista

## Solução de Problemas

### Webhook não está funcionando

1. Verifique se a URL está correta
2. Confirme que a Edge Function está implantada:
   - Acesse o painel do Supabase
   - Vá em **Edge Functions**
   - Verifique se `jotform-webhook` está na lista

### Campos não estão sendo mapeados

O webhook tenta mapear automaticamente os campos. Se alguns dados não aparecerem:

1. Verifique os nomes dos campos no Jotform
2. Ajuste o código da Edge Function se necessário
3. Reimplante a função

### Erro ao receber dados

- Verifique os logs da Edge Function no Supabase
- Confirme que o formato de dados do Jotform está correto
- Teste enviando os dados manualmente usando um cliente HTTP

## Vantagens da Integração Automática

- **Sem downloads manuais**: Dados chegam automaticamente
- **Tempo real**: Candidatos aparecem imediatamente na aplicação
- **Escalável**: Suporta milhares de submissões simultâneas
- **Confiável**: Sem risco de perder dados

## Migração de Dados Existentes

Se você já tem candidatos no Google Sheets:

1. Use a funcionalidade **Importar** na aplicação
2. Exporte os dados do Google Sheets como CSV/TXT
3. Faça o upload através da interface

## Próximos Passos

- Configure visualização direta dos documentos do Jotform
- Ajuste os campos conforme necessário
- Configure notificações para novas submissões (opcional)
