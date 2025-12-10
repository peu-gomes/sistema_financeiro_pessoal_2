# Design System - Guia de Uso

Este é o design system centralizado para o Sistema Financeiro Pessoal. Ele padroniza cores, tipografia, espaçamento e componentes reutilizáveis.

## 📦 Como Usar

### 1. Importar o Design System
```tsx
import { COLORS, BUTTON_STYLES, CARD_STYLES, INPUT_STYLES } from '@/lib/designSystem';
```

### 2. Usar Componentes Reutilizáveis
```tsx
import { Button, Card, Input, Modal, Alert, Badge } from '@/components';
```

---

## 🎨 Variáveis de Design

### Cores
```tsx
// Primárias
COLORS.primary        // #2563eb (Azul)
COLORS.primaryLight   // #dbeafe
COLORS.primaryDark    // #1e40af

// Status
COLORS.success        // #10b981 (Verde)
COLORS.error          // #ef4444 (Vermelho)
COLORS.warning        // #f59e0b (Âmbar)
COLORS.info           // #3b82f6 (Info)

// Financeiras
COLORS.receita        // Verde
COLORS.despesa        // Vermelho
COLORS.transferencia  // Azul
```

### Espaçamento
```tsx
SPACING.xs   // 4px
SPACING.sm   // 8px
SPACING.md   // 16px
SPACING.lg   // 24px
SPACING.xl   // 32px
```

---

## 🧩 Componentes

### Button
```tsx
<Button variant="primary" size="md">
  Clique aqui
</Button>

// Variantes: primary, secondary, success, danger, warning, ghost
// Tamanhos: xs, sm, md, lg, xl
```

### Card
```tsx
<Card variant="default">
  <CardHeader>
    <h3>Título</h3>
  </CardHeader>
  <CardBody>
    Conteúdo
  </CardBody>
  <CardFooter>
    <Button>Ação</Button>
  </CardFooter>
</Card>

// Variantes: default, elevated, bordered, subtle
```

### Input
```tsx
<Input
  type="text"
  label="Nome"
  placeholder="Digite seu nome"
  value={name}
  onChange={(e) => setName(e.target.value)}
  required
/>
```

### Select
```tsx
<Select
  label="Categoria"
  options={[
    { value: 'ativo', label: 'Ativo' },
    { value: 'passivo', label: 'Passivo' }
  ]}
  value={category}
  onChange={(e) => setCategory(e.target.value)}
/>
```

### Modal
```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Novo Item"
  onConfirm={handleSalvar}
  confirmText="Salvar"
  cancelText="Cancelar"
>
  <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
</Modal>
```

### Alert
```tsx
<Alert type="success" title="Sucesso!">
  Item salvo com sucesso.
</Alert>

// Tipos: success, error, warning, info
```

### Badge
```tsx
<Badge variant="success">Ativo</Badge>
<Badge variant="error">Inativo</Badge>

// Variantes: primary, success, error, warning, gray
```

---

## 🎯 Padrões de Uso

### Página Completa
```tsx
'use client';

import { Card, CardHeader, CardBody, Button, Input, Alert } from '@/components';
import { COLORS, RESPONSIVE } from '@/lib/designSystem';

export default function MyPage() {
  return (
    <div className={`min-h-screen bg-gray-50 ${RESPONSIVE.container}`}>
      <Card variant="elevated">
        <CardHeader>
          <h1 className="text-2xl font-semibold text-gray-800">Título</h1>
        </CardHeader>
        <CardBody>
          <Alert type="info">Informação importante</Alert>
          <Input label="Campo" placeholder="Digite algo..." />
        </CardBody>
      </Card>
    </div>
  );
}
```

### Utilizar Cores Financeiras
```tsx
import { COLORS } from '@/lib/designSystem';

// Para receita (verde)
<span style={{ color: COLORS.receita }}>+R$ 1.000,00</span>

// Para despesa (vermelho)
<span style={{ color: COLORS.despesa }}>-R$ 500,00</span>

// Com Tailwind
<div className="text-green-600">Receita</div>
<div className="text-red-600">Despesa</div>
```

---

## 🔄 Migração de Código Existente

### Antes
```tsx
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
  Salvar
</button>
```

### Depois
```tsx
<Button variant="primary" size="md">
  Salvar
</Button>
```

---

## ✅ Checklist para Refatoração

- [ ] Importar design system em todas as páginas
- [ ] Substituir buttons inline por componente `<Button />`
- [ ] Substituir cards inline por componente `<Card />`
- [ ] Substituir inputs inline por componente `<Input />`
- [ ] Substituir alerts inline por componente `<Alert />`
- [ ] Usar COLORS para cores financeiras
- [ ] Usar SPACING para margens/paddings
- [ ] Usar TRANSITIONS para transições
- [ ] Adicionar responsive classes consistentemente
- [ ] Testar em mobile

---

## 📱 Responsividade

Use as classes Tailwind padrão:
```tsx
// Ocultar em mobile, mostrar em desktop
<div className="hidden md:block">Desktop apenas</div>

// Mostrar em mobile, ocultar em desktop
<div className="md:hidden">Mobile apenas</div>

// Grid responsivo
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

---

## 🚀 Próximas Melhorias

- [ ] Criar mais componentes (Tabs, Accordion, Pagination)
- [ ] Adicionar dark mode completo
- [ ] Criar storybook para documentar componentes
- [ ] Adicionar temas customizáveis
- [ ] Melhorar acessibilidade (ARIA labels)
