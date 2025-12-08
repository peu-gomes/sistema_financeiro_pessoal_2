/**
 * API Wrapper para arquivos JSON estáticos
 * Todos os dados são armazenados em arquivos JSON na pasta public/
 */

// Tipos
export interface ContaBancaria {
  id: string;
  codigo: string;
  nome: string;
  tipoCC: 'sintetica' | 'analitica';
  categoria: 'ativo' | 'passivo' | 'patrimonio' | 'receita' | 'despesa';
  ativa: boolean;
  subcontas?: ContaBancaria[];
}

export interface Configuracoes {
  id: string;
  permitirCriarContasRaiz: boolean;
  tema?: 'light' | 'dark' | 'system';
}

export interface Lancamento {
  id: string;
  data: string;
  historico: string;
  documento?: string;
  partidas: Partida[];
  criadoEm: string;
  atualizadoEm?: string;
}

export interface Partida {
  id: string;
  contaCodigo: string;
  contaNome: string;
  natureza: 'debito' | 'credito';
  valor: number;
}

// ===== CONTAS =====

export async function getContas(): Promise<ContaBancaria[]> {
  try {
    const response = await fetch('/data/plano-de-contas.json');
    if (!response.ok) throw new Error('Erro ao buscar plano de contas');
    const data = await response.json();
    return data.contas || data; // Suporta formato com ou sem chave "contas"
  } catch (error) {
    console.error('Erro ao buscar contas:', error);
    throw error;
  }
}

export async function saveContas(contas: ContaBancaria[]): Promise<void> {
  try {
    const response = await fetch('/api/contas', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contas }),
    });
    if (!response.ok) throw new Error('Erro ao salvar plano de contas');
  } catch (error) {
    console.error('Erro ao salvar contas:', error);
    throw error;
  }
}

// ===== LANÇAMENTOS =====

export async function getLancamentos(): Promise<Lancamento[]> {
  try {
    const response = await fetch('/data/lancamentos.json');
    if (!response.ok) throw new Error('Erro ao buscar lançamentos');
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar lançamentos:', error);
    throw error;
  }
}

export async function createLancamento(lancamento: Omit<Lancamento, 'id'>): Promise<Lancamento> {
  try {
    const response = await fetch('/api/lancamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lancamento),
    });
    if (!response.ok) throw new Error('Erro ao criar lançamento');
    return await response.json();
  } catch (error) {
    console.error('Erro ao criar lançamento:', error);
    throw error;
  }
}

export async function updateLancamento(id: string, lancamento: Partial<Lancamento>): Promise<Lancamento> {
  try {
    const response = await fetch('/api/lancamentos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...lancamento }),
    });
    if (!response.ok) throw new Error('Erro ao atualizar lançamento');
    return await response.json();
  } catch (error) {
    console.error('Erro ao atualizar lançamento:', error);
    throw error;
  }
}

export async function deleteLancamento(id: string): Promise<void> {
  try {
    const response = await fetch('/api/lancamentos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) throw new Error('Erro ao deletar lançamento');
  } catch (error) {
    console.error('Erro ao deletar lançamento:', error);
    throw error;
  }
}

// ===== CONFIGURAÇÕES =====

export async function getConfiguracoes(): Promise<Configuracoes> {
  try {
    const response = await fetch('/data/configuracoes.json');
    if (!response.ok) throw new Error('Erro ao buscar configurações');
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    throw error;
  }
}

export async function saveConfiguracoes(config: Configuracoes): Promise<Configuracoes> {
  try {
    const response = await fetch('/api/configuracoes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!response.ok) throw new Error('Erro ao salvar configurações');
    return await response.json();
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    throw error;
  }
}
