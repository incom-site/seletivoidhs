# Configuração do Google OAuth para o Sistema de Triagem

## ⚠️ SOLUÇÃO RÁPIDA - Erro de OAuth

Se você está vendo o erro "Não é possível fazer login no app porque ele não obedece à política do OAuth 2.0 do Google":

1. Acesse: https://console.cloud.google.com/apis/credentials
2. Clique no Client ID: `7946337108-ugfh3hq2goea4ujd12ronkh1u1cmjpbm`
3. Em **"Authorized redirect URIs"**, adicione:
   ```
   https://seletivo.netlify.app/
   ```
   ⚠️ **IMPORTANTE**: A barra `/` no final é obrigatória!
4. Em **"Authorized JavaScript origins"**, adicione:
   ```
   https://seletivo.netlify.app
   ```
   ⚠️ Aqui NÃO tem barra no final
5. Clique em **"SAVE"**
6. Aguarde 5 minutos e tente novamente

---

## Passo 1: Criar Projeto no Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Clique em "Select a project" no topo da página
3. Clique em "NEW PROJECT"
4. Nomeie o projeto (ex: "Sistema de Triagem")
5. Clique em "CREATE"

## Passo 2: Habilitar APIs Necessárias

1. No menu lateral, vá em "APIs & Services" > "Library"
2. Procure e habilite as seguintes APIs:
   - **Google Sheets API**
   - **Google Drive API** (opcional, mas recomendado)

## Passo 3: Criar Credenciais OAuth 2.0

### Configurar Tela de Consentimento OAuth

1. No menu lateral, vá em "APIs & Services" > "OAuth consent screen"
2. Selecione "External" (para qualquer conta Google)
3. Clique em "CREATE"
4. Preencha os campos obrigatórios:
   - **App name**: Sistema de Triagem
   - **User support email**: seu email
   - **Developer contact information**: seu email
5. Clique em "SAVE AND CONTINUE"
6. Em "Scopes", clique em "ADD OR REMOVE SCOPES" e adicione:
   - `.../auth/spreadsheets` (Ver, editar, criar e excluir planilhas)
   - `.../auth/userinfo.email` (Ver seu endereço de e-mail)
7. Clique em "SAVE AND CONTINUE"
8. Em "Test users", adicione os emails dos analistas que terão acesso
9. Clique em "SAVE AND CONTINUE"

### Criar Client ID OAuth

**JÁ EXISTE UM CLIENT ID CONFIGURADO**: `7946337108-ugfh3hq2goea4ujd12ronkh1u1cmjpbm.apps.googleusercontent.com`

Para usar o Client ID existente, você precisa garantir que:

1. No Google Cloud Console, vá em "APIs & Services" > "Credentials"
2. Encontre o Client ID: `7946337108-ugfh3hq2goea4ujd12ronkh1u1cmjpbm`
3. Clique para editar e verifique se contém:
   - **Authorized JavaScript origins**:
     - `https://seletivo.netlify.app`
     - `http://localhost:5173` (para desenvolvimento local)
   - **Authorized redirect URIs**:
     - `https://seletivo.netlify.app/`
     - `http://localhost:5173/` (para desenvolvimento local)
4. Se não estiverem configurados, adicione-os e clique em "SAVE"

**IMPORTANTE CRÍTICO**: Os URIs de redirecionamento DEVEM terminar com `/`:
- `https://seletivo.netlify.app/` (COM barra no final)
- `http://localhost:5173/` (COM barra no final)

Este é um requisito do Google OAuth 2.0 para implicit flow com `response_type=token`.

## Passo 4: Obter ID da Planilha

1. Abra sua planilha do Google Sheets
2. Na URL, copie **APENAS o ID** da planilha (não a URL completa):

   URL completa:
   ```
   https://docs.google.com/spreadsheets/d/1NaetcGUJ5_HYsQ-NCK3V3zFEnDfyfwmjX4wrUwI7NFw/edit?usp=sharing
   ```

   **Copie apenas esta parte:**
   ```
   1NaetcGUJ5_HYsQ-NCK3V3zFEnDfyfwmjX4wrUwI7NFw
   ```

   ⚠️ **IMPORTANTE**: NÃO inclua `/edit`, `?usp=sharing` ou qualquer outra parte da URL

## Passo 5: Configurar Variáveis de Ambiente no Netlify

1. Acesse seu projeto no Netlify: https://app.netlify.com/
2. Vá em "Site configuration" > "Environment variables"
3. Adicione as seguintes variáveis:

```
VITE_GOOGLE_SHEETS_ID=1NaetcGUJ5_HYsQ-NCK3V3zFEnDfyfwmjX4wrUwI7NFw
VITE_GOOGLE_CLIENT_ID=7946337108-ugfh3hq2goea4ujd12ronkh1u1cmjpbm.apps.googleusercontent.com
```

⚠️ **ATENÇÃO**:
- Use **APENAS o ID** da planilha em `VITE_GOOGLE_SHEETS_ID`
- **NÃO** use a URL completa com `/edit?usp=sharing`
- Não é mais necessária a API Key (VITE_GOOGLE_API_KEY)
- O sistema usa apenas OAuth para todas as operações

4. Clique em "Save"
5. Faça um novo deploy do site

## Passo 7: Estrutura da Planilha

Certifique-se de que sua planilha tem as seguintes colunas (A até S):

| Coluna | Nome | Descrição |
|--------|------|-----------|
| A | Data de Submissão | Data de envio |
| B | Nome | Nome completo do candidato |
| C | Telefone | Número de telefone |
| D | Área | Administrativa ou Assistencial |
| E | Cargo Administrativo | Cargo pretendido (área adm) |
| F | Cargo Assistencial | Cargo pretendido (área assist) |
| G | Currículo (Adm) | URL do currículo |
| H | Diploma (Adm) | URL do diploma |
| I | Documentos (Adm) | URLs dos documentos |
| J | Cursos (Adm) | URLs dos cursos |
| K | Currículo (Assist) | URL do currículo |
| L | Diploma (Assist) | URL do diploma |
| M | Carteira (Assist) | URL da carteira profissional |
| N | Cursos (Assist) | URLs dos cursos |
| O | Documentos (Assist) | URLs dos documentos |
| P | Número de Registro | ID único do candidato |
| Q | Status Triagem | Classificado/Desclassificado/Revisar |
| R | Data/Hora Triagem | Data e hora da avaliação |
| S | Analista Triagem | Email do analista |

## Passo 8: Compartilhar a Planilha

Para que a API Key funcione corretamente:

1. Abra sua planilha do Google Sheets
2. Clique em "Compartilhar" no canto superior direito
3. Em "Acesso geral", altere para "Qualquer pessoa com o link" pode **Visualizar**
4. Isso permite que a API Key leia os dados

## Solução de Problemas

### Erro: "redirect_uri mismatch"
- Verifique se `https://seletivo.netlify.app` está EXATAMENTE como configurado no Google Cloud Console
- Não adicione `/` no final
- Certifique-se de usar `https://` (não `http://`)

### Erro: "Access blocked: This app's request is invalid"
- Verifique se os scopes estão corretos na tela de consentimento
- Adicione seu email como "Test user" na tela de consentimento OAuth

### Erro ao ler a planilha
- Verifique se a planilha está compartilhada com "Qualquer pessoa com o link"
- Confirme se a API Key está configurada corretamente
- Verifique se a Google Sheets API está habilitada no projeto

### Erro ao escrever na planilha
- Certifique-se de que o usuário autenticado tem permissão de edição na planilha
- Verifique se o scope `.../auth/spreadsheets` está incluído na autenticação OAuth

## Testando Localmente

Para testar localmente antes de fazer deploy:

1. Crie um arquivo `.env.local` na raiz do projeto
2. Adicione as mesmas variáveis:
```
VITE_GOOGLE_SHEETS_ID=...
VITE_GOOGLE_API_KEY=...
VITE_GOOGLE_CLIENT_ID=...
```
3. Execute `npm run dev`
4. Acesse `http://localhost:5173`

## Importante

- **NÃO compartilhe suas credenciais publicamente**
- Mantenha sua API Key e Client ID seguros
- Adicione `.env.local` ao `.gitignore` para não versionar credenciais
- Use restrições de API Key para limitar seu uso apenas ao necessário
