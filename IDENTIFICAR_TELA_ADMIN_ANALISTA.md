# Como Identificar se Está na Tela Correta

## 🎨 Diferenças Visuais entre Admin e Analista

### 🔴 Tela do ADMINISTRADOR (AdminDashboard)

#### Título e Cabeçalho:
```
Sistema de Triagem
Admin: [Seu Nome]
```

#### Abas Disponíveis:
1. **Importar** - Importar candidatos via CSV
2. **Alocação** - Distribuir candidatos para analistas
3. **Meus Candidatos** - Ver seus candidatos (modo analista)
4. **Classificados** - Ver todos os classificados
5. **Desclassificados** - Ver todos os desclassificados
6. **À Revisar** - Ver todos os candidatos em revisão

#### Estatísticas (5 caixas):
- Total de Candidatos
- Pendente
- Em Análise
- Concluído
- **Total Triados** (roxa) - Esta caixa SÓ aparece no Admin

#### Botão Extra:
- **Resetar Contador** - Botão para resetar o total de triados

---

### 🔵 Tela do ANALISTA (AnalystDashboard)

#### Título e Cabeçalho:
```
Meus Candidatos
Analista: [Seu Nome]
```

#### Sem Abas - Apenas uma lista de candidatos

#### Estatísticas (4 caixas apenas):
- Total
- Pendente
- Em Análise
- Concluído

#### Sem botões extras

---

## 🔍 Como Verificar no Console do Navegador

### Passo 1: Abrir o Console
Pressione **F12** (Windows/Linux) ou **Cmd+Option+J** (Mac)

### Passo 2: Fazer Login
Faça login com seu usuário admin

### Passo 3: Verificar os Logs

#### Se estiver no ADMIN, você verá:
```
🔐 Tentando login com email: admin@email.com
📥 getUserByEmail - resultado do Google Sheets: {...}
✅ getUserByEmail - userData processado: {...}
👤 Dados do usuário recebidos: {role: "admin", ...}
🎭 Role do usuário: admin
🎯 App.tsx - Usuário atual: {role: "admin", ...}
🎭 App.tsx - Role do usuário: admin
🔍 App.tsx - Comparação (user.role === "admin"): true
✅ Redirecionando para AdminDashboard
🎨 AdminDashboard RENDERIZADO - Este é o painel de ADMINISTRADOR
👤 AdminDashboard - Usuário: {role: "admin", ...}
```

#### Se estiver no ANALISTA, você verá:
```
🔐 Tentando login com email: analista@email.com
📥 getUserByEmail - resultado do Google Sheets: {...}
✅ getUserByEmail - userData processado: {...}
👤 Dados do usuário recebidos: {role: "analista", ...}
🎭 Role do usuário: analista
🎯 App.tsx - Usuário atual: {role: "analista", ...}
🎭 App.tsx - Role do usuário: analista
🔍 App.tsx - Comparação (user.role === "admin"): false
✅ Redirecionando para AnalystDashboard
📊 AnalystDashboard RENDERIZADO - Este é o painel de ANALISTA
👤 AnalystDashboard - Usuário: {role: "analista", ...}
```

---

## ⚠️ SE VOCÊ ESTÁ VENDO O PAINEL ERRADO

### Sintoma 1: Sou admin mas vejo "Meus Candidatos" no título
**Isso significa**: Você está no AnalystDashboard

**Solução**:
1. Abra o Console (F12)
2. Verifique qual mensagem aparece:
   - Se aparecer "🎨 AdminDashboard RENDERIZADO" = Está correto
   - Se aparecer "📊 AnalystDashboard RENDERIZADO" = Está errado
3. Verifique o role no log
4. Se o role for "admin" mas estiver no AnalystDashboard, há um bug no roteamento

### Sintoma 2: Vejo "Sistema de Triagem" mas SEM as 5 abas
**Isso significa**: Pode estar carregando lentamente ou há um erro

**Solução**:
1. Recarregue a página (Ctrl+R ou Cmd+R)
2. Limpe o cache (Ctrl+Shift+R ou Cmd+Shift+R)
3. Verifique o console por erros

### Sintoma 3: Vejo 5 abas mas dentro da aba "Meus Candidatos"
**Isso significa**: Você está no AdminDashboard, na aba "Meus Candidatos"

**Explicação**:
- O AdminDashboard tem uma aba chamada "Meus Candidatos"
- Esta aba renderiza o AnalystDashboard DENTRO do AdminDashboard
- Isso é proposital! Permite que o admin também faça triagem
- Você pode alternar entre as abas normalmente

---

## 📊 Comparação Visual Lado a Lado

### AdminDashboard
```
┌────────────────────────────────────────┐
│ Sistema de Triagem       [Resetar] [Sair] │
│ Admin: João Silva                        │
│                                          │
│ [5 caixas de estatísticas incluindo     │
│  "Total Triados" em roxo]                │
│                                          │
│ [Importar] [Alocação] [Meus Candidatos] │
│ [Classificados] [Desclassificados]       │
│ [À Revisar]                              │
│                                          │
│ [Conteúdo da aba selecionada]           │
└────────────────────────────────────────┘
```

### AnalystDashboard
```
┌────────────────────────────────────────┐
│ Meus Candidatos                  [Sair] │
│ Analista: Maria Santos                  │
│                                          │
│ [4 caixas de estatísticas]              │
│                                          │
│ [Lista de candidatos]                   │
│ [Detalhes do candidato selecionado]     │
│                                          │
└────────────────────────────────────────┘
```

---

## 🧪 Teste Definitivo

Execute este código no Console do navegador:

```javascript
// Verificar qual dashboard está renderizado
const adminDashboard = document.querySelector('h1')?.textContent?.includes('Sistema de Triagem');
const analystDashboard = document.querySelector('h1')?.textContent?.includes('Meus Candidatos');

console.log('====== VERIFICAÇÃO DE DASHBOARD ======');
console.log('Está no AdminDashboard?', adminDashboard);
console.log('Está no AnalystDashboard?', analystDashboard);

// Verificar role no localStorage
const user = JSON.parse(localStorage.getItem('currentUser'));
console.log('Role salvo:', user?.role);
console.log('Deveria estar no AdminDashboard?', user?.role === 'admin');
console.log('Deveria estar no AnalystDashboard?', user?.role === 'analista');

// Verificar se está correto
const estaCorreto = (adminDashboard && user?.role === 'admin') || (analystDashboard && user?.role === 'analista');
console.log('✅ Dashboard correto:', estaCorreto);
console.log('====================================');
```

---

## 💡 Observação Importante

**O AdminDashboard inclui o AnalystDashboard dentro dele!**

Quando você está na aba "Meus Candidatos" do AdminDashboard, você verá:
- O cabeçalho do AdminDashboard no topo ("Sistema de Triagem")
- As 5 abas do AdminDashboard
- Dentro da área de conteúdo, o AnalystDashboard completo

Isso é NORMAL e ESPERADO! Permite que o admin também possa fazer triagem de candidatos.

---

## 📸 O que Você Deve Ver

### Como Admin:
1. Título: "Sistema de Triagem"
2. Subtítulo: "Admin: [seu nome]"
3. 5 caixas de estatísticas (incluindo "Total Triados" roxa)
4. 6 abas: Importar, Alocação, Meus Candidatos, Classificados, Desclassificados, À Revisar
5. Botão "Resetar Contador"

### Como Analista:
1. Título: "Meus Candidatos"
2. Subtítulo: "Analista: [seu nome]"
3. 4 caixas de estatísticas
4. Nenhuma aba (apenas lista de candidatos)
5. Sem botão "Resetar Contador"

---

## 🆘 Se Ainda Estiver Errado

1. Copie TODOS os logs do console
2. Tire um print da tela
3. Execute o "Teste Definitivo" acima e copie o resultado
4. Envie tudo para análise

Isso permitirá identificar exatamente onde o problema está!
