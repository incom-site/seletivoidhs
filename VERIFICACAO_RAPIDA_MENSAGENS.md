# Verificação Rápida: Status de Mensagens

## 🚨 ATENÇÃO: Faça Isso PRIMEIRO!

Antes de usar o sistema, você PRECISA atualizar o Google Apps Script:

### Passo 1: Atualizar Google Apps Script ⚡

1. Acesse: https://script.google.com
2. Abra o projeto vinculado à sua planilha
3. Copie TODO o conteúdo do arquivo `google-apps-script-final-corrigido.js`
4. Cole no editor (substituindo todo o código anterior)
5. **Salve** (Ctrl+S)
6. Clique em "Implantar" > "Gerenciar implantações"
7. Clique no ícone de **lápis** (editar) na implantação atual
8. Mude para "**Nova versão**"
9. Clique em "**Implantar**"

### Passo 2: Criar Colunas na Planilha ⚡

1. No editor do Google Apps Script
2. Selecione a função `addStatusColumnIfNotExists` no menu dropdown
3. Clique em "▶ Executar"
4. Aguarde a execução (pode aparecer "Running...")
5. Verifique se as colunas `EMAIL_SENT` e `SMS_SENT` foram criadas na aba CANDIDATOS

### Passo 3: Limpar Cache do Navegador 🔄

1. Abra a interface do sistema
2. Pressione **Ctrl + Shift + R** (ou Cmd + Shift + R no Mac)
3. Isso faz um "hard refresh" limpando o cache

---

## ✅ Teste Rápido

### 1. Enviar Mensagem

1. Vá em "Candidatos Classificados"
2. Selecione um candidato
3. Clique em "Enviar Mensagens"
4. Envie um email de teste
5. Aguarde confirmação

### 2. Verificar na Planilha

1. Abra a planilha CANDIDATOS no Google Sheets
2. Localize o candidato pelo CPF
3. **Verifique se a coluna EMAIL_SENT tem o valor "Sim"**

❌ **Se não tiver "Sim":**
- O script não foi atualizado corretamente
- Repita os Passos 1 e 2 acima

✅ **Se tiver "Sim":**
- Continue para o próximo teste

### 3. Verificar na Interface

1. Volte para "Candidatos Classificados"
2. Pressione **F5** para recarregar
3. **Verifique se aparece o badge verde "Email enviado"**

❌ **Se não aparecer o badge:**
- Pressione Ctrl + Shift + R para limpar cache
- Verifique o Console do navegador (F12)

✅ **Se aparecer o badge:**
- Está funcionando! Continue

### 4. Mover para Entrevista

1. Selecione o mesmo candidato
2. Clique em "Mover para Entrevista"
3. **Deve funcionar sem erro**

❌ **Se aparecer erro "Selecione apenas candidatos que já receberam email ou SMS":**
- Abra o Console do navegador (F12)
- Tente novamente
- Copie os logs que aparecem começando com 🔍
- Me envie os logs

✅ **Se mover com sucesso:**
- Tudo funcionando! 🎉

---

## 🔍 Debug Rápido

Abra o Console do navegador (F12) e cole este código:

```javascript
// Copiar e colar no Console
console.log('=== TESTE DE VALIDAÇÃO ===');
const testValues = [true, 'Sim', 'TRUE', 'true', false, undefined, null, ''];
testValues.forEach(val => {
  const isValid = (val === true || val === 'Sim' || val === 'TRUE' || val === 'true');
  console.log(`${JSON.stringify(val).padEnd(10)} → ${isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
});
```

**Resultado Esperado:**
```
true       → ✅ VÁLIDO
"Sim"      → ✅ VÁLIDO
"TRUE"     → ✅ VÁLIDO
"true"     → ✅ VÁLIDO
false      → ❌ INVÁLIDO
undefined  → ❌ INVÁLIDO
null       → ❌ INVÁLIDO
""         → ❌ INVÁLIDO
```

---

## 🆘 Ainda não funciona?

### Checklist Final:

- [ ] Script atualizado no Google Apps Script?
- [ ] Nova versão implantada?
- [ ] Função `addStatusColumnIfNotExists` executada?
- [ ] Colunas EMAIL_SENT e SMS_SENT existem na planilha?
- [ ] Cache do navegador limpo (Ctrl+Shift+R)?
- [ ] Página recarregada após enviar mensagem?

Se todos os itens estão ✅ e ainda não funciona:

1. Abra o Console do navegador (F12)
2. Vá em "Candidatos Classificados"
3. Selecione um candidato que VOCÊ SABE que recebeu mensagem
4. Clique em "Mover para Entrevista"
5. **Copie TODOS os logs que aparecem no Console**
6. Envie os logs para análise

---

## 📊 Valores Válidos

A coluna EMAIL_SENT ou SMS_SENT na planilha deve ter UM destes valores:

✅ **VÁLIDOS:**
- `Sim` (texto)
- `TRUE` (texto)
- `true` (texto)
- `true` (booleano)

❌ **INVÁLIDOS:**
- (vazio)
- `Não`
- `0`
- `false`
- qualquer outro valor

---

## 💡 Dica Pro

Para evitar problemas no futuro:

1. Sempre verifique a planilha PRIMEIRO antes de verificar a interface
2. Use Ctrl+Shift+R para limpar cache após mudanças
3. Mantenha o Console aberto durante testes (F12)
4. Aguarde 5-10 segundos após enviar mensagem antes de mover para entrevista
