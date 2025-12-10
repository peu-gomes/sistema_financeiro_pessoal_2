# Sistema de Identificação de Padrões Contábeis

## 🎯 Objetivo

Sistema automático que identifica e classifica lançamentos contábeis com base nas categorias das contas utilizadas (débito e crédito), facilitando a análise e filtragem de operações financeiras.

---

## 📊 Padrões Identificados

### 1. **💳 Despesa à Vista**
- **Padrão**: D: Despesa → C: Ativo
- **Descrição**: Gasto pago imediatamente com dinheiro disponível
- **Exemplos**:
  - Compra no supermercado
  - Pagamento de combustível
  - Conta de luz
  - Almoço no restaurante

### 2. **📅 Despesa a Prazo**
- **Padrão**: D: Despesa → C: Passivo
- **Descrição**: Gasto parcelado ou a ser pago futuramente
- **Exemplos**:
  - Compra no cartão de crédito
  - Parcelamento de produto
  - Conta a pagar

### 3. **💰 Receita à Vista**
- **Padrão**: D: Ativo (Caixa/Banco) → C: Receita
- **Descrição**: Dinheiro recebido imediatamente
- **Exemplos**:
  - Salário recebido
  - Venda à vista
  - Pagamento por serviço prestado

### 4. **📈 Receita a Prazo**
- **Padrão**: D: Ativo (Contas a Receber) → C: Receita
- **Descrição**: Valor a receber futuramente
- **Exemplos**:
  - Venda parcelada
  - Serviço a receber
  - Contas a receber

### 5. **✅ Pagamento de Dívida**
- **Padrão**: D: Passivo → C: Ativo
- **Descrição**: Quitação de valor devido
- **Exemplos**:
  - Pagamento de fatura do cartão
  - Quitação de empréstimo
  - Pagamento de fornecedor

### 6. **💵 Recebimento de Crédito**
- **Padrão**: D: Ativo (Caixa/Banco) → C: Ativo (Contas a Receber)
- **Descrição**: Entrada de dinheiro de valores a receber
- **Exemplos**:
  - Cliente pagou parcela
  - Recebimento de duplicata
  - Cobrança realizada

### 7. **📊 Aplicação/Investimento**
- **Padrão**: D: Ativo (Investimentos) → C: Ativo (Caixa/Banco)
- **Descrição**: Dinheiro aplicado em investimentos
- **Exemplos**:
  - Compra de ações
  - Aplicação em CDB
  - Investimento em fundo

### 8. **💎 Resgate de Investimento**
- **Padrão**: D: Ativo (Caixa/Banco) → C: Ativo (Investimentos)
- **Descrição**: Retirada de dinheiro de investimentos
- **Exemplos**:
  - Venda de ações
  - Resgate de CDB
  - Saque de investimento

### 9. **🏦 Empréstimo Recebido**
- **Padrão**: D: Ativo (Caixa/Banco) → C: Passivo
- **Descrição**: Entrada de dinheiro emprestado
- **Exemplos**:
  - Empréstimo bancário
  - Financiamento
  - Crédito pessoal

### 10. **🔄 Transferência entre Contas**
- **Padrão**: D: Ativo → C: Ativo (sem palavras-chave de investimento/recebimento)
- **Descrição**: Movimentação entre contas próprias
- **Exemplos**:
  - Transferência banco → carteira
  - TED entre contas
  - Saque no caixa eletrônico

### 11. **💼 Aporte de Capital**
- **Padrão**: D: Ativo → C: Patrimônio
- **Descrição**: Entrada de capital próprio
- **Exemplos**:
  - Capital inicial
  - Aporte de sócio
  - Investimento pessoal

### 12. **📤 Retirada de Capital**
- **Padrão**: D: Patrimônio → C: Ativo
- **Descrição**: Retirada de capital próprio
- **Exemplos**:
  - Pró-labore
  - Distribuição de lucros
  - Retirada pessoal

---

## 🔍 Como Funciona

### **Lógica de Identificação**

1. **Análise das Partidas**: Sistema verifica as categorias das contas de débito e crédito
2. **Análise de Palavras-chave**: Para padrões ambíguos (ex: Ativo → Ativo), analisa nomes das contas
3. **Classificação Automática**: Atribui emoji, nome e cor ao lançamento

### **Palavras-chave Reconhecidas**

- **Investimentos**: "investimento", "aplicação", "ações", "fundo"
- **Recebíveis**: "receber", "duplicata", "cliente"
- **Caixa/Banco**: ausência de palavras especiais em contas de ativo

---

## 🎨 Exibição Visual

### **Badges Coloridos**
Cada tipo de operação tem:
- **Emoji**: Identificação visual rápida
- **Nome**: Descrição curta
- **Cor**: Background e borda coloridos

### **Localização**
- **Desktop (Tabela)**: Coluna "Tipo" à esquerda
- **Mobile (Cards)**: Badge no topo do card
- **Tooltip**: Nome completo ao passar o mouse

---

## 🔧 Filtro por Tipo de Operação

### **No Painel de Filtros**
```
┌─────────────────────────────────┐
│ Tipo de Operação               │
├─────────────────────────────────┤
│ ☐ Todos os tipos               │
│ 💳 Despesa à Vista              │
│ 📅 Despesa a Prazo              │
│ 💰 Receita à Vista              │
│ 📈 Receita a Prazo              │
│ ✅ Pagamento de Dívida          │
│ 💵 Recebimento de Crédito       │
│ 📊 Aplicação/Investimento       │
│ 💎 Resgate de Investimento      │
│ 🏦 Empréstimo Recebido          │
│ 🔄 Transferência                │
│ 💼 Aporte de Capital            │
│ 📤 Retirada de Capital          │
└─────────────────────────────────┘
```

### **Funcionalidades**
- Filtragem instantânea
- Contador de resultados
- Combinável com outros filtros

---

## 📈 Casos de Uso

### **1. Análise de Despesas**
```
Filtrar por: Despesa à Vista + Despesa a Prazo
Resultado: Todas as despesas do período
```

### **2. Controle de Recebimentos**
```
Filtrar por: Receita à Vista + Recebimento de Crédito
Resultado: Todo dinheiro que entrou
```

### **3. Gestão de Investimentos**
```
Filtrar por: Aplicação/Investimento + Resgate de Investimento
Resultado: Movimentações de investimentos
```

### **4. Fluxo de Caixa**
```
Filtrar por: Transferência entre Contas
Resultado: Movimentações internas (não afetam resultado)
```

---

## 🧠 Lógica Avançada

### **Diferenciação Inteligente**

#### **Ativo → Ativo**
Sistema analisa nomes das contas para diferenciar:
- **Investimento**: Débito tem "investimento", "aplicação", etc.
- **Resgate**: Crédito tem "investimento", "aplicação", etc.
- **Recebimento**: Crédito tem "receber", "duplicata", "cliente"
- **Transferência**: Caso contrário

#### **Ativo → Receita**
Sistema analisa nome do débito:
- **Receita à Vista**: Caixa, Banco, Carteira
- **Receita a Prazo**: Contas a Receber, Duplicatas, Clientes

---

## 💡 Benefícios

### **Para o Usuário**
- ✅ Identificação visual imediata do tipo de operação
- ✅ Filtros inteligentes para análises específicas
- ✅ Compreensão facilitada dos lançamentos
- ✅ Análise rápida de padrões de gastos/receitas

### **Para Análise Financeira**
- ✅ Separação clara entre despesas à vista e a prazo
- ✅ Identificação de entrada/saída de caixa
- ✅ Diferenciação de operações que afetam resultado vs. movimentações
- ✅ Controle de investimentos e resgates

---

## 🎯 Exemplos Práticos

### **Cenário 1: Compra de Alimentos**
```
D: Despesas com Alimentação (Despesa)
C: Banco Itaú (Ativo)
→ Identificado como: 💳 Despesa à Vista
```

### **Cenário 2: Compra no Cartão**
```
D: Despesas com Vestuário (Despesa)
C: Cartão de Crédito (Passivo)
→ Identificado como: 📅 Despesa a Prazo
```

### **Cenário 3: Recebimento de Salário**
```
D: Banco Itaú (Ativo)
C: Salário (Receita)
→ Identificado como: 💰 Receita à Vista
```

### **Cenário 4: Cliente Pagou Parcela**
```
D: Banco Itaú (Ativo)
C: Clientes a Receber (Ativo)
→ Identificado como: 💵 Recebimento de Crédito
```

### **Cenário 5: Investiu em Ações**
```
D: Investimentos em Ações (Ativo)
C: Banco Itaú (Ativo)
→ Identificado como: 📊 Aplicação/Investimento
```

---

## 🔄 Integração

### **Arquivos Modificados**
- `lib/padroes-contabeis.ts` - Sistema de identificação
- `app/lancamentos/page.tsx` - Integração na UI

### **Dependências**
- Plano de contas com categorias definidas
- Lançamentos com partidas de débito e crédito

---

## 🚀 Próximas Melhorias

- [ ] Estatísticas por tipo de operação
- [ ] Gráficos de distribuição de padrões
- [ ] Machine learning para melhorar identificação
- [ ] Sugestão de padrão ao criar lançamento
- [ ] Histórico de padrões mais usados
- [ ] Alertas de padrões incomuns
- [ ] Export de análise por tipo

---

**Status**: ✅ Implementado e Funcional  
**Build**: ✅ Passing (exit code 0)  
**Compatibilidade**: 100% backward compatible
