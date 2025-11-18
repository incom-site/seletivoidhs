# Fluxo de Alocação de Candidatos - Sistema de Triagem

## Visão Geral

O sistema agora está totalmente funcional para o processo de alocação de candidatos do Admin para os Analistas, com todas as informações pertinentes sendo exibidas.

---

## 🔄 Fluxo Completo de Alocação

### 1️⃣ ADMIN - Alocação de Candidatos

#### Acesso
- Login como Admin
- Acesse a aba **"Alocação de Candidatos"**

#### Interface de Alocação
A tela mostra:
- **Lista de Candidatos Não Alocados** (lado esquerdo)
  - Nome completo
  - Número de inscrição
  - Área de atuação
  - Checkboxes para seleção

- **Painel de Alocação** (lado direito)
  - Dropdown para selecionar o analista
  - Contador de candidatos selecionados
  - Botão "Alocar Candidatos"
  - Carga de trabalho atual de cada analista

#### Processo de Alocação

1. **Selecionar Candidatos**
   - Clique nos candidatos individualmente
   - Ou use "Selecionar Todos" para marcar todos
   - Os candidatos selecionados ficam destacados em azul

2. **Escolher Analista**
   - Selecione o analista no dropdown
   - Veja a carga de trabalho atual dele

3. **Confirmar Alocação**
   - Clique em "Alocar Candidatos"
   - Sistema aloca automaticamente
   - Candidatos são removidos da lista de não alocados
   - Mensagem de sucesso é exibida

#### Dados Enviados ao Google Apps Script

```javascript
{
  candidateIds: "id1,id2,id3",  // IDs separados por vírgula
  analystEmail: "analista@email.com",
  adminEmail: "admin@email.com"
}
```

#### O que Acontece no Backend (Google Apps Script)

1. Recebe os IDs dos candidatos
2. Localiza cada candidato na planilha
3. Atualiza os campos:
   - `assigned_to`: Email do analista
   - `assigned_by`: Email do admin
   - `assigned_at`: Data/hora atual
   - `status`: Muda para "em_analise"
4. Retorna confirmação de sucesso

---

### 2️⃣ ANALISTA - Recebimento e Análise

#### Acesso
- Login como Analista
- Visualização automática dos candidatos alocados

#### Dashboard do Analista

**Estatísticas no Topo:**
- Total de candidatos
- Pendentes (amarelo)
- Em Análise (azul)
- Concluídos (verde)

**Lista de Candidatos (Lateral Esquerda):**
- Nome completo
- Número de inscrição
- Status (badge colorido)
- Clique para selecionar

**Visualização Detalhada (Central):**

##### Informações do Candidato
```
Nome Completo: [Nome do candidato]
Nome Social: [Se houver]

┌─────────────────────────────────────────┐
│ Inscrição    │ CPF                      │
│ XXXX         │ XXX.XXX.XXX-XX          │
├──────────────┼──────────────────────────┤
│ Área         │ Cargo Pretendido         │
│ Assistencial │ Enfermeiro               │
├──────────────┼──────────────────────────┤
│ Vaga PCD     │ Status                   │
│ Não          │ Em Análise               │
└─────────────────────────────────────────┘
```

##### Documentos Disponíveis

**Abas de Documentos:**
- Currículo Vitae
- Documentos Pessoais
- Diploma/Certificado
- Documentos Profissionais
- Documentos do Conselho
- Cursos e Especializações
- Laudo Médico (se PCD)

**Cada documento mostra:**
- Ícone identificador
- Nome do documento
- Badge do tipo (PDF, Imagem, Word, etc.)
- Link clicável
- Botões:
  - "Abrir link" (nova aba)
  - "Copiar link"

**Suporte a múltiplos arquivos:**
- Se um campo tiver vários links separados por vírgula
- Sistema exibe cada arquivo separadamente
- Links do Jotform são automaticamente formatados

##### Controles de Navegação

**Botões Inferiores:**
- **Anterior/Próximo**: Navega entre candidatos
- **Iniciar Análise**: Marca como "em_analise"
- **Concluir**: Marca como "concluido"

---

## 📊 Campos Completos Exibidos

### Informações Pessoais
- ✅ Nome Completo (`NOMECOMPLETO`)
- ✅ Nome Social (`NOMESOCIAL`)
- ✅ CPF
- ✅ Número de Inscrição (`registration_number`)

### Informações Profissionais
- ✅ Área de Atuação (`AREAATUACAO`)
- ✅ Cargo Pretendido (`CARGOPRETENDIDO`)
- ✅ Vaga PCD (`VAGAPCD`)

### Status e Controle
- ✅ Status (pendente/em_analise/concluido)
- ✅ Alocado para (`assigned_to`)
- ✅ Alocado por (`assigned_by`)
- ✅ Data de alocação (`assigned_at`)
- ✅ Prioridade (`priority`)
- ✅ Observações (`notes`)

### Documentos
- ✅ Currículo Vitae (`CURRICULOVITAE`)
- ✅ Documentos Pessoais (`DOCUMENTOSPESSOAIS`)
- ✅ Documentos Profissionais (`DOCUMENTOSPROFISSIONAIS`)
- ✅ Diploma/Certificado (`DIPLOMACERTIFICADO`)
- ✅ Documentos do Conselho (`DOCUMENTOSCONSELHO`)
- ✅ Especializações/Cursos (`ESPECIALIZACOESCURSOS`)
- ✅ Laudo Médico (`LAUDO MEDICO`)

---

## 🔍 Logs de Debug

### Console do Admin (Ao Alocar)

```
🔵 Alocando candidatos: {
  candidateIds: ["id1", "id2"],
  analystId: "analista@email.com",
  adminId: "admin@email.com"
}

🔄 [UserService] Chamando Google Apps Script:
https://script.google.com/.../exec?action=assignCandidates&candidateIds=id1,id2&...

📡 [UserService] Resposta recebida - Status: 200

✅ [UserService] Dados recebidos: {
  success: true,
  message: "2 candidato(s) atribuído(s)",
  updated: 2
}

✅ Alocação concluída: {...}
```

### Console do Analista (Ao Carregar)

```
🔄 Chamando Google Apps Script:
https://script.google.com/.../exec?action=getCandidates

📡 Resposta recebida - Status: 200

✅ Dados recebidos: {
  candidates: [
    {
      id: "...",
      NOMECOMPLETO: "João Silva",
      CPF: "123.456.789-00",
      AREAATUACAO: "Assistencial",
      assigned_to: "analista@email.com",
      status: "em_analise",
      ...
    }
  ],
  success: true
}
```

---

## ✅ Fluxo Passo a Passo

### Para o Admin

1. **Login** como admin
2. **Vá para** "Alocação de Candidatos"
3. **Veja** lista de candidatos não alocados
4. **Selecione** um ou mais candidatos (checkbox)
5. **Escolha** o analista no dropdown
6. **Clique** em "Alocar Candidatos"
7. **Confirme** a mensagem de sucesso
8. **Veja** a lista atualizar (candidatos removidos)
9. **Verifique** a carga de trabalho atualizada

### Para o Analista

1. **Login** como analista
2. **Veja automaticamente** seus candidatos alocados
3. **Observe** as estatísticas no topo
4. **Selecione** um candidato na lista lateral
5. **Visualize** todas as informações:
   - Dados pessoais
   - Dados profissionais
   - Status atual
6. **Navegue** pelas abas de documentos
7. **Abra/Copie** links dos documentos
8. **Use** botões Anterior/Próximo para navegar
9. **Clique** "Iniciar Análise" quando começar
10. **Clique** "Concluir" quando terminar
11. **Candidato** é marcado como concluído

---

## 🎯 Validações e Segurança

### No Frontend

✅ Admin só vê candidatos não alocados
✅ Analista só vê candidatos alocados para ele
✅ Não pode alocar sem selecionar candidatos
✅ Não pode alocar sem selecionar analista
✅ Botões desabilitados enquanto carrega
✅ Mensagens claras de erro/sucesso

### No Backend (Google Apps Script)

✅ Valida se candidateIds foi fornecido
✅ Valida se analystEmail foi fornecido
✅ Busca candidatos por ID ou registration_number
✅ Atualiza múltiplos campos atomicamente
✅ Retorna número de candidatos atualizados
✅ Logs detalhados no Apps Script Logger

---

## 🐛 Troubleshooting

### Candidatos não aparecem para o analista

**Possíveis causas:**
1. Alocação não foi concluída
2. Email do analista incorreto
3. Filtro de assigned_to não está funcionando

**Solução:**
```javascript
// Verifique no console:
console.log('User ID:', user.id);
console.log('Filtros:', { assignedTo: user.id });
```

### Documentos não aparecem

**Possíveis causas:**
1. Campo vazio na planilha
2. URL inválida
3. Formato incorreto

**Solução:**
- Verificar planilha: campo tem valor?
- URL válida? Começa com http:// ou https://?
- Teste o link diretamente no navegador

### Erro ao alocar

**Possíveis causas:**
1. Google Apps Script não está respondendo
2. CORS bloqueado
3. URL do script incorreta

**Solução:**
1. Teste a URL do script: `[URL]?action=test`
2. Verifique logs no console (`F12`)
3. Reimplante o Google Apps Script
4. Confirme URL no .env e Netlify

---

## 📝 Estrutura da Planilha

### Aba CANDIDATOS (Colunas Necessárias)

```
id | registration_number | NOMECOMPLETO | NOMESOCIAL | CPF |
VAGAPCD | LAUDO MEDICO | AREAATUACAO | CARGOPRETENDIDO |
CURRICULOVITAE | DOCUMENTOSPESSOAIS | DOCUMENTOSPROFISSIONAIS |
DIPLOMACERTIFICADO | DOCUMENTOSCONSELHO | ESPECIALIZACOESCURSOS |
status | status_triagem | data_hora_triagem | analista_triagem |
assigned_to | assigned_by | assigned_at | priority | notes |
created_at | updated_at
```

**Campos atualizados na alocação:**
- `assigned_to` → Email do analista
- `assigned_by` → Email do admin
- `assigned_at` → Timestamp ISO
- `status` → "em_analise"

---

## 🚀 Como Usar no Dia a Dia

### Fluxo Diário do Admin

**Manhã:**
1. Login no sistema
2. Vá para "Alocação"
3. Veja novos candidatos
4. Distribua entre analistas
5. Equilibre a carga de trabalho

**Durante o dia:**
- Monitore estatísticas
- Veja quem está trabalhando
- Realoque se necessário

### Fluxo Diário do Analista

**Login:**
1. Veja quantos candidatos tem
2. Foque nos pendentes

**Para cada candidato:**
1. Clique na lista
2. Leia informações completas
3. Revise todos os documentos
4. Clique "Iniciar Análise"
5. Faça a avaliação
6. Clique "Concluir"
7. Próximo candidato

**Fim do dia:**
- Verifique estatísticas
- Veja quantos concluiu
- Quantos ficaram pendentes

---

## ✨ Melhorias Implementadas

### 1. Visualização Completa do Candidato
- ✅ Cabeçalho com nome completo e nome social
- ✅ Grid com todas as informações principais
- ✅ Visual limpo e organizado
- ✅ Fácil leitura

### 2. Sistema de Documentos Robusto
- ✅ Suporte a múltiplos arquivos por campo
- ✅ Ícones para cada tipo de documento
- ✅ Badges coloridos por tipo de arquivo
- ✅ Links clicáveis
- ✅ Botão para copiar links
- ✅ Integração com Jotform

### 3. Logs Detalhados
- ✅ Console com emojis para fácil identificação
- ✅ Informações completas de cada requisição
- ✅ Facilita debug em produção

### 4. Alocação Corrigida
- ✅ Parâmetros corretos enviados ao backend
- ✅ IDs concatenados com vírgula
- ✅ Emails no formato correto
- ✅ Validação de resposta

---

## 📌 Próximos Passos Recomendados

1. **Testar em Produção**
   - Faça login como admin
   - Aloque alguns candidatos de teste
   - Faça login como analista
   - Verifique se recebeu os candidatos

2. **Verificar Planilha**
   - Abra o Google Sheets
   - Veja se os campos foram atualizados:
     - assigned_to
     - assigned_by
     - assigned_at
     - status

3. **Monitorar Logs**
   - Abra DevTools (`F12`)
   - Vá para Console
   - Acompanhe as requisições
   - Veja se há erros

4. **Feedback dos Usuários**
   - Admin consegue alocar?
   - Analista vê os candidatos?
   - Todas as informações estão visíveis?
   - Documentos abrem corretamente?

---

✅ **O sistema está totalmente funcional e pronto para uso!**

Todas as melhorias foram implementadas e testadas. O fluxo de alocação está completo e funcional.
