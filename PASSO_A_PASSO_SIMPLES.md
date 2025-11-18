# 📋 PASSO A PASSO SIMPLES - Corrigir Envio de Mensagens

## ⚡ RÁPIDO - 5 Minutos

### 🎯 O Que Fazer

Copiar o script atualizado para o Google Apps Script e reimplantar.

---

## 📝 PASSO 1: Abrir Google Apps Script

1. Abra no navegador: **https://script.google.com**
2. Clique no seu projeto (aquele que você está usando)

---

## 📝 PASSO 2: Selecionar Todo o Código

No editor do Google Apps Script:
1. Clique dentro do código
2. Pressione **Ctrl+A** (Windows/Linux) ou **Cmd+A** (Mac)
3. Todo o código fica selecionado (azul)

---

## 📝 PASSO 3: Abrir o Arquivo Atualizado

1. Volte para este projeto
2. Abra o arquivo: **`google-apps-script-COMPLETO-FINAL.js`**
3. Selecione TODO o conteúdo (**Ctrl+A** ou **Cmd+A**)
4. Copie (**Ctrl+C** ou **Cmd+C**)

---

## 📝 PASSO 4: Colar no Google Apps Script

1. Volte para o navegador (Google Apps Script)
2. Com o código selecionado (azul)
3. Cole (**Ctrl+V** ou **Cmd+V**)
4. O código antigo será substituído pelo novo

---

## 📝 PASSO 5: Salvar

1. Clique no ícone **💾 Salvar** (ou pressione **Ctrl+S**)
2. Aguarde a mensagem: "Projeto salvo"

---

## 📝 PASSO 6: Reimplantar

1. Clique em **"Implantar"** (canto superior direito)
2. Selecione **"Gerenciar implantações"**
3. Na lista, você verá sua implantação existente
4. Clique no ícone **✏️ (lápis)** ao lado dela
5. No topo da tela, clique em **"Nova versão"**
6. (Opcional) Adicione descrição: "Corrigido envio de mensagens"
7. Clique em **"Implantar"**
8. Aguarde a mensagem de sucesso

---

## 📝 PASSO 7: Fechar

1. Clique em **"Concluído"**
2. Pode fechar o Google Apps Script

---

## ✅ PRONTO!

A correção foi aplicada. Agora teste:

1. Acesse seu sistema
2. Faça login
3. Tente enviar uma mensagem (email ou SMS)
4. **Deve funcionar sem erros!**

---

## ❓ Dúvidas Comuns

### "Não encontrei meu projeto no script.google.com"
- Verifique se está logado com a conta correta
- O projeto deve estar listado na página inicial

### "Não aparece o botão Implantar"
- Certifique-se de que salvou o código (💾)
- Verifique se não há erros no código (linha vermelha)

### "Deu erro ao salvar"
- Verifique se tem permissão de edição
- Tente recarregar a página e tentar novamente

### "A URL mudou?"
- NÃO! A URL permanece a mesma quando você edita uma implantação existente
- Você NÃO precisa atualizar nada no frontend

### "Como sei se funcionou?"
- Tente enviar uma mensagem pelo sistema
- Se não der erro `_pickPhoneFromRow_ is not defined`, funcionou!

---

## 🆘 Se Não Funcionar

1. Verifique se seguiu todos os passos
2. Abra o Google Apps Script
3. Vá em "Execuções" (ícone de relógio no menu lateral)
4. Veja se aparece algum erro nos logs
5. Tire um print e compartilhe para análise

---

## 📊 O Que Foi Corrigido

Adicionei duas funções que estavam faltando:
- `_pickEmailFromRow_` - Extrai email do candidato
- `_pickPhoneFromRow_` - Extrai telefone do candidato

Essas funções são necessárias para o sistema conseguir enviar mensagens.

---

## 🎉 Está Pronto!

Após seguir esses passos, o envio de mensagens funcionará perfeitamente.

**Tempo estimado:** 5 minutos
**Dificuldade:** Fácil
**Requer:** Acesso ao Google Apps Script
