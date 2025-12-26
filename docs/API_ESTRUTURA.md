# Estrutura de APIs e Banco KV

## Padrão de Organização

- **types/**: Definições de tipos e interfaces compartilhadas (ex: `lancamentos.ts`).
- **lib/kvService.ts**: Funções de leitura e escrita centralizadas para o banco KV.
- **app/api/**: Handlers de API enxutos, apenas orquestram lógica e usam serviços/tipos centralizados.

## Boas Práticas

- Não duplicar tipos ou funções em múltiplos arquivos.
- Sempre importar tipos e serviços de seus arquivos centrais.
- Handlers de API devem apenas receber requisições, validar dados e chamar serviços/utilitários.
- Teste localmente (`npm run build`) antes de subir para produção.
- Use variáveis de ambiente para separar configs locais e de produção.

## Exemplo de Uso

```ts
// app/api/lancamentos/import/route.ts
import { readLancamentos, writeLancamentos } from '@/lib/kvService';
import type { Lancamento } from '@/types/lancamentos';

export async function POST(request: Request) {
  // ...handler simplificado...
}
```

## Vantagens
- Menos erros de build/deploy
- Código mais limpo e fácil de manter
- Facilidade para testes e refatorações

---
Dúvidas ou sugestões? Edite este arquivo ou abra uma issue.
