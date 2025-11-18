# Sistema de Triagem de Candidatos - Guia de Configuração

## Visão Geral

Sistema web de triagem de candidatos para hospitais, integrado com Google Sheets e Supabase.

## Funcionalidades

- Autenticação com conta Google
- Dashboard de triagem com lista de candidatos
- Visualizador de documentos (PDF e imagens)
- Atalhos de teclado para agilizar a triagem
- Métricas de produtividade em tempo real
- Integração com Google Sheets para armazenamento de dados
- Rastreamento de sessões e avaliações no Supabase

## Configuração

### 1. Configurar Google Cloud Project

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative as APIs necessárias:
   - Google Sheets API
   - Google Drive API
   - Google OAuth2 API

### 2. Criar Credenciais OAuth 2.0

1. Vá para "APIs & Services" > "Credentials"
2. Clique em "Create Credentials" > "OAuth client ID"
3. Selecione "Web application"
4. Adicione sua URL de origem (ex: http://localhost:5173)
5. Copie o Client ID gerado

### 3. Configurar Google Sheets

1. Crie uma planilha no Google Sheets com as seguintes colunas (na ordem):

   | A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S |
   |---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
   | Submission Date | Seu nome | Telefone | Área de atuação pretendida | Cargo pretendido (ADMINISTRATIVO) | Cargo pretendido (ASSISTENCIAL) | ADM - CURRÍCULO VITAE | ADM - DIPLOMA OU CERTIFICADO DE ESCOLARIDADE | ADM - DOCUMENTOS PESSOAIS OBRIGATÓRIOS | ADM - CURSOS E ESPECIALIZAÇÕES | ASSIST - CURRÍCULO VITAE | ASSIST - DIPLOMA OU CERTIFICADO DE ESCOLARIDADE | ASSIST - CARTEIRA DO CONSELHO | ASSIST - CURSOS E ESPECIALIZAÇÕES | ASSIST - DOCUMENTOS PESSOAIS OBRIGATÓRIOS | NÚMERO DE INSCRIÇÃO | Status Triagem | Data/Hora Triagem | Analista Triagem |

2. Copie o ID da planilha da URL (a parte entre /d/ e /edit):
   ```
   https://docs.google.com/spreadsheets/d/[ID_DA_PLANILHA]/edit
   ```

3. Configure o compartilhamento:
   - Clique em "Compartilhar"
   - Mude para "Qualquer pessoa com o link pode ver"
   - Copie o link

### 4. Configurar Variáveis de Ambiente

Edite o arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://hfgpyisqlfdgcdyagety.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

VITE_GOOGLE_CLIENT_ID=seu_client_id_aqui
VITE_GOOGLE_SHEETS_ID=id_da_planilha_aqui
```

**IMPORTANTE**: Não é mais necessária a API Key. O sistema usa apenas OAuth para autenticação e acesso aos dados.

### 5. Instalar Dependências

```bash
npm install
```

### 6. Executar o Projeto

```bash
npm run dev
```

## Atalhos de Teclado

- **1**: Classificar candidato
- **2**: Desclassificar candidato
- **3**: Marcar para revisão
- **→** (seta direita): Próximo candidato
- **←** (seta esquerda): Candidato anterior
- **R**: Focar no currículo
- **D**: Focar no diploma
- **C**: Focar na carteira do conselho

## Fluxo de Trabalho

1. Faça login com sua conta Google
2. O sistema carrega automaticamente os candidatos da planilha
3. Use os filtros para selecionar área e cargo
4. Revise os documentos do candidato
5. Use os atalhos de teclado ou botões para classificar
6. O sistema atualiza automaticamente a planilha e as métricas

## Estrutura do Banco de Dados (Supabase)

### Tabela: analyst_sessions
Armazena as sessões de trabalho dos analistas.

### Tabela: candidate_reviews
Registra cada avaliação de candidato com timestamp e tempo gasto.

## Métricas Disponíveis

- Total de candidatos triados na sessão
- Tempo médio por candidato
- Número de classificados
- Número de desclassificados
- Número marcados para revisão

## Observações Importantes

- Os documentos devem estar em formato PDF ou imagem (JPG, PNG, etc)
- As URLs dos documentos devem ser públicas para visualização
- O sistema funciona melhor com conexão estável à internet
- Recomendado usar navegadores modernos (Chrome, Firefox, Edge)
