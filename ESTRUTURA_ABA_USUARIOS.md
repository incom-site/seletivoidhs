# Estrutura da Aba USUARIOS

## 📋 Formato Esperado

A aba **USUARIOS** no Google Sheets deve ter a seguinte estrutura:

### Cabeçalho (Linha 1)
| A | B | C | D |
|---|---|---|---|
| Email | Nome | Role | ID |

### Dados (Linhas 2+)
| Email | Nome | Role | ID |
|-------|------|------|-----|
| admin@email.com | Administrador | admin | admin@email.com |
| analista@email.com | João Silva | analista | analista@email.com |
| maria@email.com | Maria Santos | analista | maria@email.com |

## 📝 Descrição das Colunas

### Coluna A - Email (Obrigatório)
- Email do usuário usado para login
- Deve ser único
- Exemplo: `admin@email.com`

### Coluna B - Nome (Obrigatório)
- Nome completo do usuário
- Será exibido no sistema
- Exemplo: `João Silva`

### Coluna C - Role (Obrigatório)
- Tipo de usuário
- Valores permitidos:
  - `admin` - Administrador (acesso total)
  - `analista` - Analista (apenas triagem)
- **Importante**: Deve estar em minúsculas

### Coluna D - ID (Opcional)
- Identificador único do usuário
- Se não informado, será usado o email como ID
- Exemplo: `user123` ou `admin@email.com`

## ✅ Exemplo de Aba USUARIOS Correta

```
+----------------------+-------------------+-----------+----------------------+
| Email                | Nome              | Role      | ID                   |
+----------------------+-------------------+-----------+----------------------+
| admin@hospital.com   | Admin Sistema     | admin     | admin@hospital.com   |
| joao@hospital.com    | João Analista     | analista  | joao@hospital.com    |
| maria@hospital.com   | Maria Analista    | analista  | maria@hospital.com   |
| pedro@hospital.com   | Pedro Coordenador | admin     | pedro@hospital.com   |
+----------------------+-------------------+-----------+----------------------+
```

## 🔐 Como o Login Funciona

1. Usuário digita o **email** na tela de login
2. Sistema busca na aba USUARIOS pela linha com esse email (coluna A)
3. Se encontrado, retorna os dados:
   - Email (coluna A)
   - Nome (coluna B)
   - Role (coluna C)
   - ID (coluna D, ou email se vazio)
4. Sistema faz o login e redireciona conforme o role:
   - **admin** → AdminDashboard (acesso total)
   - **analista** → AnalystDashboard (apenas triagem)

## ⚠️ Importante

1. **Não delete a linha de cabeçalho** (linha 1)
2. **Role deve estar em minúsculas**: `admin` ou `analista`
3. **Email deve ser único** - não pode ter emails duplicados
4. **Todos os campos são case-sensitive** no email

## 🧪 Testar o Sistema

### Teste 1: Login como Admin
1. Adicione um usuário com role `admin` na aba USUARIOS
2. Tente fazer login com o email desse usuário
3. Deve aparecer o painel de administrador

### Teste 2: Login como Analista
1. Adicione um usuário com role `analista` na aba USUARIOS
2. Tente fazer login com o email desse usuário
3. Deve aparecer o painel de analista

### Teste 3: Verificar Erro
1. Tente fazer login com um email que **não está** na aba USUARIOS
2. Deve mostrar erro "Usuário não encontrado"

## 🔧 Solução de Problemas

### Erro: "Usuário não encontrado"
- ✅ Verifique se o email está exatamente como na planilha
- ✅ Verifique se não há espaços extras no email
- ✅ Verifique se a aba se chama exatamente "USUARIOS" (maiúsculas)

### Usuário faz login mas não vê nada
- ✅ Verifique se o role está correto: `admin` ou `analista`
- ✅ Verifique se está em minúsculas
- ✅ Verifique os logs do navegador (F12)

### Como adicionar um novo usuário
1. Abra a aba USUARIOS
2. Vá para a última linha com dados
3. Na próxima linha, adicione:
   - Email do novo usuário
   - Nome completo
   - Role (`admin` ou `analista`)
   - ID (pode deixar em branco)
4. Salve a planilha
5. O usuário já pode fazer login

### Como desativar um usuário
**Opção 1 - Deletar a linha**
- Simplesmente delete a linha do usuário na aba USUARIOS

**Opção 2 - Adicionar coluna "Ativo"**
Se quiser manter um registro dos usuários inativos:
1. Adicione uma coluna E com o nome "Ativo"
2. Coloque "Sim" para usuários ativos
3. Coloque "Não" para usuários inativos
4. Atualize o script para verificar essa coluna

## 📞 Suporte

Se ainda tiver problemas:
1. Verifique se o Google Apps Script está atualizado
2. Verifique os logs do Apps Script (View > Logs)
3. Verifique o console do navegador (F12)
4. Certifique-se de que a URL do script está correta no arquivo `.env`

## 🎯 Exemplo Completo para Começar

Copie e cole na sua aba USUARIOS:

```
Email	Nome	Role	ID
admin@email.com	Administrador	admin	admin@email.com
analista1@email.com	Analista 1	analista	analista1@email.com
analista2@email.com	Analista 2	analista	analista2@email.com
```

Depois disso, você já pode fazer login com qualquer um desses emails!
