# Análise da Página de Lançamentos - Estado Atual

## 📋 O que existe atualmente

### **1. Estrutura da Página**
```
├── Header (Desktop Sticky)
│   ├── Navegação
│   ├── Estatísticas Rápidas (Total, Não classificados, Precisam revisão)
│
├── Main Content
│   ├── Header da Lista
│   │   ├── Título + Subtítulo
│   │   └── Botão "Novo Lançamento"
│   │
│   ├── Desktop (md:block)
│   │   └── Tabela com colunas:
│   │       ├── Data
│   │       ├── Documento (lg:only)
│   │       ├── Histórico
│   │       ├── Débito
│   │       ├── Crédito
│   │       ├── Valor
│   │       └── Ações (Editar, Excluir)
│   │
│   └── Mobile (md:hidden)
│       └── Cards com:
│           ├── Data como header (agrupada por dia)
│           ├── Histórico
│           ├── Valor
│           ├── Documento
│           ├── Débito/Crédito
│           └── Swipe-to-delete (drag left para excluir)
│
└── Modal "Novo Lançamento"
    ├── Data
    ├── Documento
    ├── Histórico
    ├── Seletor de modo de partidas (1-1, 1-N, N-1)
    ├── Tabela dinâmica de partidas
    └── Botões (Cancelar, Salvar)
```

---

## 🎨 Componentes/Seções Identificadas

### **A. Header Sticky (Desktop)**
- Navegação horizontal (5 links)
- Stats inline (Total, Não classificados, Precisam revisão)
- Border-bottom com separador
- Cor: branco, sombra leve

### **B. Card Principal (Lista)**
- Padding: p-6
- Shadow: shadow
- Rounded: rounded-lg
- Background: white

### **C. Header do Card**
- Flex responsive (col em mobile, row em desktop)
- Esquerda: Título (text-2xl bold) + Subtítulo (text-sm gray)
- Direita: Botão azul "Novo Lançamento"

### **D. Conteúdo Lista**

#### Desktop (Tabela)
- Headers em gray-700, bold
- Rows com hover:bg-gray-50
- Monospace para códigos
- Badges inline (D/C com cores)
- Ações: ícones azul/vermelho hover state

#### Mobile (Cards)
- Agrupados por data (header por dia)
- Card branco com sombra
- Histórico truncado em 2 linhas
- Valor em destaque (vermelho)
- Documento em cinza pequeno
- Partidas com badges D/C
- **Swipe-to-delete**: Drag left revela ícone delete em vermelho

### **E. Modal (Novo Lançamento)**
- Overlay semi-transparente
- Card branco com header sticky
- 3 modos de partidas (UI com botões)
- Tabela dinâmica de partidas
- Input validado
- Footer com botões

---

## 📊 Dimensões e Breakpoints

```
├── Mobile (< 768px)
│   ├── Cards empilhados
│   ├── Swipe gesture habilitado
│   ├── Padding: p-3, gap-4
│   ├── Textos menores (text-xs/sm)
│   └── Full width buttons
│
├── Tablet (768px - 1024px)
│   ├── Tabela começa (md:block)
│   ├── Alguns ícones (lg:hidden)
│   ├── Layout flex responsivo
│   └── Headers médios
│
└── Desktop (≥ 1024px)
│   ├── Tabela completa com todas colunas
│   ├── Coluna "Documento" visível (lg:table-cell)
│   ├── Hover states para rows
│   ├── Padding: p-6
│   └── Ícones com tooltip
```

---

## 🎯 Estados Visuais

### **Tabela (Desktop)**
- Default: bg-white, border-bottom gray
- Hover: bg-gray-50, cursor pointer
- Icons: text-blue-600 / text-red-600

### **Cards (Mobile)**
- Default: bg-white shadow-sm rounded-lg
- Active/Touch: bg-gray-50
- Swipe-left: translateX com fundo vermelho

### **Botões**
- Primário: bg-blue-600 hover:bg-blue-700
- Ícones: hover:bg-{color}-50 (soft background)

### **Badges**
- D (Débito): bg-green-100, text-green-700
- C (Crédito): bg-red-100, text-red-700

### **Status**
- Nenhum dado: Ícone grande + texto gray com CTA

---

## 🔧 Tecnologias Usadas

- **React Hooks**: useState, useEffect
- **Tailwind CSS**: Classes inline (sem componentes)
- **Touch Events**: onTouchStart, onTouchMove, onTouchEnd
- **Data formatting**: Date.toLocaleDateString()
- **API Integration**: getLancamentos, createLancamento, deleteLancamento
- **Responsive**: Hidden/block classes (md:, lg:)

---

## 💡 Oportunidades de Organização

### **1. Remover Classes Inline Duplicadas**
Use `lib/styles.ts` para:
- `CARD_BASE`, `CARD_ELEVATED`
- `BTN_PRIMARY`, `BTN_ICON`
- `FLEX_BETWEEN`, `FLEX_COL_MD_ROW`
- Tabela headers/cells

### **2. Extrair Componentes Menores**
- `<LancamentoTableRow />` - Uma linha da tabela
- `<LancamentoCard />` - Um card mobile
- `<StatsBar />` - Barra de estatísticas
- `<ModalLancamento />` - Já extraído ✅

### **3. Melhorar Estrutura**
- Separar lógica de filtro/busca
- Criar hook `useLancamentos()`
- Padronizar responsividade

### **4. Acessibilidade**
- Adicionar ARIA labels
- Melhorar keyboard navigation
- Alt text para ícones

---

## 🏗️ Plano de Refatoração em 3 Fases

### **Fase 1: Usar Estilos Centralizados** ✅
```tsx
// Antes
className="p-6 bg-white rounded-lg shadow flex items-center justify-between"

// Depois
className={cn(CARD_BASE, FLEX_BETWEEN)}
```

### **Fase 2: Extrair Componentes**
```tsx
// Novo componente
<LancamentoTableRow lancamento={...} />
<LancamentoCard lancamento={...} />
<EstatsBar {...} />
```

### **Fase 3: Replicar Padrão**
Aplicar mesmos padrões em:
- Planejamento
- Plano de Contas
- Configurações

---

## 📱 Responsividade Detalhada

### **Mobile (< 768px)**
```
[Data Header - Sticky ou separador por dia]
[Card com Histórico, Valor, Partidas]
[Card com Histórico, Valor, Partidas]
← Swipe to delete →
```

### **Tablet (768px - 1024px)**
```
┌─────────────────────────────────┐
│ Data │ Histórico │ Débito │ Crédito │ Valor │ ✎ 🗑 │
├─────────────────────────────────┤
│ 08/12│ Descrição │ CC 1.1 │ CC 2.1 │ R$ XX │ ✎ 🗑 │
└─────────────────────────────────┘
```

### **Desktop (≥ 1024px)**
```
┌─────────────────────────────────────────────────┐
│ Data │ Documento │ Histórico │ Débito │ Crédito │ Valor │ ✎ 🗑 │
├─────────────────────────────────────────────────┤
│ 08/12│ NF 12345  │ Descrição │ CC 1.1 │ CC 2.1  │ R$ XX │ ✎ 🗑 │
└─────────────────────────────────────────────────┘
```

---

## ✅ Checklist de Organização

- [ ] **Phase 1**: Substituir inline classes por constantes de `lib/styles.ts`
- [ ] **Phase 2**: Extrair componentes (Row, Card, Stats)
- [ ] **Phase 3**: Melhorar responsividade (tablet intermediário)
- [ ] **Phase 4**: Adicionar feedback visual (loading, empty states)
- [ ] **Phase 5**: Replicar padrão nas outras páginas

---

## 🎨 Padrão a Ser Replicado

Após organizar Lançamentos, aplicar os mesmos padrões em:

1. **Dashboard** - Similar layout com cards
2. **Planejamento** - Tabela + mobile cards
3. **Plano de Contas** - Árvore + mobile alternativa
4. **Configurações** - Formulários com même responsividade

---

## 📝 Notas Importantes

- ✅ Já tem swipe-to-delete funcional no mobile
- ✅ Modal bem estruturado e isolado
- ✅ Responsividade implementada (faltam refinements)
- ⚠️ Muitas classes inline duplicadas
- ⚠️ Sem componentes reutilizáveis
- ⚠️ Sem estados de loading/erro bem definidos
