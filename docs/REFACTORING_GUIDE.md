# Guia de Refatoração - Design System

## 🎯 Objetivo
Centralizar todo o estilo visual em um único Design System, eliminando duplicação de código e garantindo consistência em toda a aplicação.

---

## 📋 Arquivos Criados

### 1. **lib/designSystem.ts**
   - Arquivo central com todas as constantes de estilo
   - Cores, espaçamento, tipografia, sombras, transições
   - Estilos pré-definidos para buttons, cards, inputs, etc.

### 2. **components/Button.tsx**
   - Componente reutilizável de botão
   - Variantes: primary, secondary, success, danger, warning, ghost
   - Tamanhos: xs, sm, md, lg, xl

### 3. **components/Card.tsx**
   - Componente reutilizável de card
   - Subcomponentes: CardHeader, CardBody, CardFooter
   - Variantes: default, elevated, bordered, subtle

### 4. **components/Input.tsx**
   - Componentes de input, select e textarea
   - Suporte a labels, mensagens de erro e validação
   - Estilos consistentes

### 5. **components/Modal.tsx**
   - Modal reutilizável com header, body, footer
   - Suporte a confirmação e cancelamento

### 6. **components/Alert.tsx**
   - Componente de alerta
   - Tipos: success, error, warning, info

### 7. **components/Badge.tsx**
   - Componente de badge/tag
   - Variantes de cores

---

## 🔄 Como Migrar Código Existente

### Passo 1: Importar o Design System
```tsx
import { COLORS, BUTTON_STYLES, CARD_STYLES } from '@/lib/designSystem';
import { Button, Card, CardHeader, CardBody } from '@/components';
```

### Passo 2: Substituir Inline Styles

#### ANTES - Código repetitivo:
```tsx
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
  Salvar
</button>

<button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
  Deletar
</button>

<div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
  Conteúdo
</div>
```

#### DEPOIS - Código limpo:
```tsx
<Button variant="primary">Salvar</Button>
<Button variant="danger">Deletar</Button>

<Card>Conteúdo</Card>
```

---

## 📝 Checklist de Refatoração

Para cada página, siga este checklist:

### Imports
- [ ] Remover imports de `Header` se não for usado
- [ ] Adicionar: `import { COLORS, RESPONSIVE } from '@/lib/designSystem';`
- [ ] Adicionar: `import { Button, Card, Input, Modal, Alert } from '@/components';`

### Navegação
- [ ] Usar classes de RESPONSIVE para container
- [ ] Padronizar links de navegação
- [ ] Usar espaçamento consistente

### Botões
- [ ] Substituir `<button className="...">` por `<Button variant="..." size="...">`
- [ ] Revisar: primary, secondary, success, danger, warning, ghost

### Cards/Containers
- [ ] Substituir `<div className="bg-white p-6 rounded-lg...">` por `<Card>`
- [ ] Usar `<CardHeader>`, `<CardBody>`, `<CardFooter>` quando apropriado

### Inputs/Formulários
- [ ] Substituir inputs inline por `<Input label="..." />`
- [ ] Substituir selects inline por `<Select options={...} />`

### Modais
- [ ] Substituir modais inline por `<Modal isOpen={...} />`
- [ ] Usar novo padrão de header/body/footer

### Alertas
- [ ] Substituir alertas inline por `<Alert type="..." />`
- [ ] Padronizar cores e mensagens

### Cores Financeiras
- [ ] Receita → usar `COLORS.receita` (verde)
- [ ] Despesa → usar `COLORS.despesa` (vermelho)
- [ ] Transferência → usar `COLORS.transferencia` (azul)

### Espaçamento e Layout
- [ ] Usar `SPACING.*` para margens e paddings
- [ ] Usar `RESPONSIVE.container` para containers
- [ ] Usar `RESPONSIVE.gridCols` para grids responsivos

---

## 🚀 Cronograma de Refatoração (Recomendado)

### Fase 1: Componentes Base ✅ (Concluído)
- ✅ Design System criado
- ✅ Componentes básicos criados
- ✅ Documentação pronta

### Fase 2: Páginas Principais (Próximo)
- [ ] **app/page.tsx** (Dashboard)
- [ ] **app/planejamento/page.tsx**
- [ ] **app/plano-de-contas/page.tsx**
- [ ] **app/lancamentos/page.tsx**
- [ ] **app/configuracoes/page.tsx**

### Fase 3: Componentes de Domínio (Depois)
- [ ] Modais específicas (ModalItem, ModalLancamento, etc)
- [ ] Cards especializadas (CardOrcamento, CardConta, etc)
- [ ] Formulários complexos

### Fase 4: Testes e Ajustes Finais
- [ ] Testar em desktop
- [ ] Testar em mobile
- [ ] Ajustar responsividade
- [ ] Validar acessibilidade

---

## 💡 Dicas de Refatoração

### 1. Comece pelo Layout
```tsx
// Mude primeiro o layout base
<div className={`min-h-screen ${RESPONSIVE.container}`}>
```

### 2. Depois os Componentes
```tsx
// Depois refatore buttons
<Button variant="primary">Clique</Button>
```

### 3. Finalize com Cores
```tsx
// Por último, padronize cores
<span style={{ color: COLORS.receita }}>+R$ 1.000</span>
```

### 4. Use Find & Replace com Cuidado
```
Buscar: className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
Substituir: (manualmente, pois cada um é único)
```

---

## 🎨 Exemplos de Padrões

### Header de Página
```tsx
<div className="mb-8">
  <h1 className="text-3xl font-bold text-gray-800 mb-2">Título</h1>
  <p className="text-gray-600">Subtítulo ou descrição</p>
</div>
```

### Grid de Cards
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <Card>...</Card>
  <Card>...</Card>
  <Card>...</Card>
</div>
```

### Formulário Modal
```tsx
<Modal isOpen={isOpen} onClose={onClose} title="Novo Item">
  <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
  <Select label="Categoria" options={options} value={cat} onChange={(e) => setCat(e.target.value)} />
  <Button variant="primary" onClick={handleSave}>Salvar</Button>
</Modal>
```

### Tabela
```tsx
<Card>
  <CardHeader><h2>Histórico</h2></CardHeader>
  <table className="w-full">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Nome</th>
      </tr>
    </thead>
    <tbody>
      {items.map((item) => (
        <tr key={item.id} className="hover:bg-gray-50">
          <td className="px-4 py-3 text-sm">{item.name}</td>
        </tr>
      ))}
    </tbody>
  </table>
</Card>
```

---

## ✨ Benefícios

✅ **Código mais limpo** - Menos duplicação de classes  
✅ **Consistência visual** - Mesmos estilos em toda a app  
✅ **Fácil manutenção** - Alterar estilo em um lugar afeta toda a app  
✅ **Melhor performance** - CSS classes reutilizadas  
✅ **Componentes testáveis** - Componentes isolados e reutilizáveis  
✅ **Onboarding mais fácil** - Novos dev entendem o padrão rapidamente  

---

## 📞 Dúvidas?

Consulte:
- `DESIGN_SYSTEM.md` - Documentação completa
- `EXEMPLO_REFATORACAO.tsx` - Exemplo prático
- `lib/designSystem.ts` - Constantes disponíveis
- `components/` - Componentes criados

