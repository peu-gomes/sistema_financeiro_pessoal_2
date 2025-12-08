# Sistema Financeiro Pessoal

Sistema de gestão financeira pessoal com contabilidade por partidas dobradas.

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 20+ instalado
- npm ou yarn

### Instalação

```bash
# Instalar dependências
npm install

# Iniciar o sistema
npm run dev
```

O sistema estará disponível em:
- **Frontend**: http://localhost:3001
- **API**: http://localhost:3002

## 📋 Funcionalidades

### Plano de Contas
- Estrutura hierárquica de contas contábeis
- Contas sintéticas (categorias) e analíticas (folhas)
- Código personalizado com máscara configurável
- Busca e filtro de contas

### Lançamentos
- Sistema de partidas dobradas
- Três modos de lançamento:
  - **1:1** - Um débito e um crédito
  - **1→N** - Um débito para vários créditos
  - **N→1** - Vários débitos para um crédito
- Validação automática de balanceamento
- Histórico e documentos

### Configurações
- Permitir criação de contas raiz
- Personalização de máscaras de código

## 🗄️ Estrutura de Dados

Os dados são armazenados em arquivos JSON estáticos:
**`public/plano-de-contas.json`** - Plano de contas hierárquico:
```json
{
  "contas": [...]             // Estrutura hierárquica de contas
}
```

**`public/data/lancamentos.json`** - Lançamentos contábeis (transações de dupla entrada):
```json
[
  {
    "id": "...",
    "data": "2025-12-07",
    "documento": "REC001",
    "historico": "Descrição",
    "partidas": [...]          // Débitos e créditos
  }
]
```

**`public/data/orcamentos.json`** - Planejamento orçamentário:
```json
[
  {
    "id": "...",
    "nome": "Orçamento Dezembro 2025",
    "mes": 12,
    "ano": 2025,
    "itens": [...]             // Itens orçados
  }
]
```

**`public/data/configuracoes.json`** - Configurações do sistema:
```json
{
  "id": "config",
  "permitirCriarContasRaiz": false
}
```

O Next.js possui API routes que leem e escrevem nesses arquivos.

### Backup e Restauração

Para fazer backup dos seus dados:
```bash
# Copiar os arquivos de dados
cp public/data/lancamentos.json public/data/lancamentos.backup.json
cp public/data/orcamentos.json public/data/orcamentos.backup.json
cp public/data/configuracoes.json public/data/configuracoes.backup.json
cp public/plano-de-contas.json public/plano-de-contas.backup.json
```

Para restaurar:
```bash
# Restaurar os backups
cp public/data/lancamentos.backup.json public/data/lancamentos.json
cp public/data/orcamentos.backup.json public/data/orcamentos.json
cp public/data/configuracoes.backup.json public/data/configuracoes.json
cp public/plano-de-contas.backup.json public/plano-de-contas.json
```

## 🛠️ Comandos Disponíveis

```bash
# Desenvolvimento (inicia Next.js)
npm run dev
# Apenas Next.js (frontend)
npm run dev:next

# Apenas JSON Server (API)
npm run dev:api

# Build para produção
npm run build

# Iniciar produção
npm start

# Lint
npm run lint
```

## 📁 Estrutura do Projeto

```
├── app/                    # Páginas Next.js (App Router)
│   ├── api/               # API routes para persistência
│   │   ├── contas/        # Salvar plano de contas
│   │   ├── lancamentos/   # CRUD de lançamentos
│   │   └── configuracoes/ # Salvar configs
│   ├── lancamentos/       # Lançamentos contábeis
│   ├── plano-de-contas/   # Plano de contas
│   ├── planejamento/      # Planejamento orçamentário
│   └── configuracoes/     # Configurações
├── lib/                   # Bibliotecas e utilitários
│   ├── api.ts            # Wrapper da API
│   └── maskUtils.ts      # Utilitários de máscara
├── public/                # Arquivos públicos e dados
│   ├── data/
│   │   ├── lancamentos.json      # Lançamentos contábeis (gitignored)
│   │   ├── orcamentos.json       # Planejamento orçamentário (gitignored)
│   │   └── configuracoes.json    # Configurações do sistema (gitignored)
│   └── plano-de-contas.json      # Plano de contas hierárquico
```

## 🔒 Segurança

- Os arquivos `public/data/lancamentos.json`, `public/data/orcamentos.json` e `public/data/configuracoes.json` são ignorados pelo git para proteger seus dados pessoais
- Faça backups regulares de todos os arquivos JSON em `public/data/` e `public/plano-de-contas.json`
- Os dados ficam apenas localmente, não são enviados para nenhum servidor externo
- O sistema usa apenas Next.js (porta 3001) - sem servidores externos

## 📱 Responsivo

O sistema é totalmente responsivo e funciona em:
- Desktop (navegador completo)
- Tablet (layout adaptado)
- Mobile (navegação inferior)

## 🧪 Tecnologias

- **Next.js 16.0.7** - Framework React
- **React 19.2.0** - Biblioteca UI
- **TypeScript 5** - Linguagem
- **Tailwind CSS 4** - Estilização
- **JSON Server 1.0.0-beta.3** - API REST

## 📖 Documentação

Para mais informações sobre o desenvolvimento, consulte o arquivo `DEVELOPMENT.md`.

## 📄 Licença

Este é um projeto pessoal para uso individual.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
