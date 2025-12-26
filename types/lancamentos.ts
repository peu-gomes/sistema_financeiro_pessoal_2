export type Partida = {
  id: string;
  contaCodigo: string;
  contaNome: string;
  natureza: 'debito' | 'credito';
  valor: number;
};

export type Lancamento = {
  id: string;
  data: string;
  historico: string;
  documento?: string;
  partidas: Partida[];
  criadoEm: string;
  atualizadoEm?: string;
};
