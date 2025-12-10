# Development Guide

## Project Overview

This is a personal financial management system built with Next.js, TypeScript, and Tailwind CSS. The system manages financial data through a hierarchical chart of accounts structure, allowing users to organize and track their finances with flexibility and precision.

## Core Philosophy

The project prioritizes minimalism, functionality, and user experience. Every feature should serve a clear purpose. The interface is clean and intuitive, focusing on essential information without clutter. Changes should be conservative and maintain consistency with existing patterns.

## Technical Stack

- **Framework**: Next.js 16.0.7 with App Router
- **Language**: TypeScript 5 in strict mode
- **Styling**: Tailwind CSS 4 for responsive, utility-first design
- **State Management**: React 19.2.0 hooks (no external libraries)
- **Data Persistence**: JSON Server (REST API on port 3002)
- **Target Platforms**: Desktop and mobile (responsive design)

## System Architecture

The application uses Next.js (port 3001) with API routes for data persistence. **All data is stored in JSON files in the `public/` folder:**

- **`public/plano-de-contas.json`** - Complete hierarchical chart of accounts (`contas`)
- **`public/data/lancamentos.json`** - Accounting entries (double-entry bookkeeping transactions)
- **`public/data/orcamentos.json`** - Budget planning entries
- **`public/data/configuracoes.json`** - System settings and configuration

The chart of accounts uses a tree structure with recursive operations for traversal and manipulation. Each account can have child accounts, creating a hierarchical organization. The double-entry bookkeeping system ensures balanced transactions with debits and credits.

**Running the System:**
- Development: `npm run dev` - Starts Next.js on port 3001
- Next.js only: `npm run dev:next`

**API Structure:**
- `PUT /api/contas` - Save chart of accounts (writes to plano-de-contas.json)
- `POST /api/lancamentos` - Create accounting entry
- `PATCH /api/lancamentos` - Update accounting entry
- `DELETE /api/lancamentos` - Delete accounting entry
- `PUT /api/configuracoes` - Save system configuration
- Data files accessed directly: `/plano-de-contas.json`, `/data/lancamentos.json`, `/data/orcamentos.json`, `/data/configuracoes.json`
- All API routes: `app/api/` folder
- API wrapper: `lib/api.ts` provides typed fetch functions

**Data Model:**
- Contas: Hierarchical tree with `subcontas` arrays, supporting both synthetic (parent) and analytical (leaf) accounts. **Stored in `public/plano-de-contas.json`**
- Lançamentos: Double-entry transactions with multiple `partidas` (entries), each linking to an analytical account. **Stored in `public/data/lancamentos.json`**
- Orçamentos: Budget planning entries with monthly planning. **Stored in `public/data/orcamentos.json`**
- Configurações: Single object with system-wide settings (e.g., `permitirCriarContasRaiz`). **Stored in `public/data/configuracoes.json`**

All state changes are persisted to JSON files via Next.js API routes. The system reads directly from JSON files for GET operations and uses API routes for write operations (POST/PUT/PATCH/DELETE).

## Design Principles

The user interface emphasizes clarity and efficiency. Forms use inline validation to provide immediate feedback. Modal dialogs handle complex operations while keeping the main view uncluttered. The design is responsive, adapting seamlessly between desktop and mobile viewports. Color usage is intentional, with neutral tones for structure and blue accents for primary actions.

### Mobile Navigation Spacing

On mobile devices, the bottom navigation bar (`<nav>`) occupies space with height of 64px (`h-16`) plus padding for safe areas (notch/system bars). To prevent content from being hidden behind this navigation, modals and sticky footers implement `safe-area-bottom` spacing. This CSS class respects the viewport's safe-area-inset-bottom, ensuring content remains accessible even on devices with notches or system navigation bars.

**Implementation:**
- Sticky footer elements use `safe-area-bottom` class
- Container height calculations account for this spacing: `calc(100vh - 240px)` on mobile, `calc(70vh)` on desktop
- This ensures modal buttons and content are always visible above the navigation bar
- Applied to: Modal footers, sticky footers, and any bottom-aligned UI elements

## Development Approach

Features are implemented incrementally with thorough testing. Configuration toggles control advanced functionality, allowing gradual feature adoption. Validation occurs at multiple levels to ensure data integrity. Error messages are clear and actionable. The codebase maintains consistent patterns that make it easier to understand and extend.

## Key Concepts

The system uses a hierarchical code mask for account organization. Accounts are organized in a tree structure with parent-child relationships. Configuration options control system behavior and feature availability. Utility functions handle formatting, validation, and code generation. Components follow a consistent pattern for state management and data flow.

## Working with the System

When adding features, review existing code to understand established patterns. Keep the minimalist philosophy in mind. Test thoroughly across different screen sizes. Ensure data persists correctly through the API. Follow TypeScript strict mode requirements. Use Tailwind utilities for styling consistency. Maintain the recursive tree structure for hierarchical operations.

**API Integration:**
- Always use functions from `lib/api.ts` instead of direct fetch calls
- Handle async operations with try-catch blocks and user feedback
- Update local state optimistically, revert on errors
- All data modifications should persist to `db.json` via API calls

**API Integration:**
- Always use functions from `lib/api.ts` instead of direct fetch calls
- Handle async operations with try-catch blocks and user feedback
- Update local state optimistically, revert on errors
- All data modifications should persist to respective JSON files via API calls

**Key Files:**
- `public/data/lancamentos.json` - Stores accounting entries (git-ignored)
- `public/data/orcamentos.json` - Stores budget planning (git-ignored)
- `public/data/configuracoes.json` - Stores system configuration (git-ignored)
- `public/plano-de-contas.json` - Complete hierarchical chart of accounts
- `app/api/contas/route.ts` - API route to save chart of accounts
- `app/api/lancamentos/route.ts` - API route for lancamentos CRUD operations
- `app/api/configuracoes/route.ts` - API route to save configuracoes
- `lib/api.ts` - Typed API wrapper with all fetch operations
- `app/plano-de-contas/page.tsx` - Chart of accounts management
- `app/lancamentos/page.tsx` - Double-entry bookkeeping transactions
- `app/planejamento/page.tsx` - Budget planning module
- `app/configuracoes/page.tsx` - System settings
- `lib/maskUtils.ts` - Account code validation and formatting

## For AI Assistants

This codebase values consistency and simplicity. Before making changes, understand the existing patterns and conventions. All data persistence now uses JSON Server API (`lib/api.ts`) instead of localStorage. Implement features that align with the minimalist philosophy. Test changes thoroughly before marking work complete. Preserve the responsive design in all modifications. Keep changes focused and incremental. Follow the established validation and formatting patterns throughout the system.

**Important Notes:**
- The system uses Next.js API routes for data persistence (no external server needed)
- All data is stored in separate JSON files in the `public/` folder for better organization
- Chart of accounts is in `public/plano-de-contas.json`
- Lancamentos, orcamentos, and configuracoes are in separate files: `public/data/lancamentos.json`, `public/data/orcamentos.json`, `public/data/configuracoes.json`
- State changes are persisted via API routes that write to JSON files
- GET operations read directly from JSON files
- Always handle errors gracefully with user feedback
- Use the typed API wrapper functions from `lib/api.ts`
- No localStorage caching - data comes directly from JSON files
