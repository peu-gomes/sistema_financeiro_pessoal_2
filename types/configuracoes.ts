import type { TipoCategoria } from '@/lib/iconesUtils';

export interface ContaAnaliticaResumo {
  codigo: string;
  nome: string;
  categoria?: string;
}

export type IconesCategoriaMap = Record<TipoCategoria, string>;
