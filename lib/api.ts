/**
 * API Wrapper para arquivos JSON estáticos
 * Todos os dados são armazenados em arquivos JSON na pasta public/
 */

// Tipos
import { supabase } from './supabaseClient';
// Funções Supabase para plano de contas
export async function getContasSupabase(): Promise<ContaBancaria[]> {
  const { data, error } = await supabase
    .from('plano_de_contas')
    .select('*');
  if (error) throw error;
  // Adapta para o tipo ContaBancaria, se necessário
  return (data || []).map((item: any) => ({
    id: item.id,
    codigo: item.codigo,
    nome: item.nome,
    tipoCC: item.tipo_cc || 'analitica',
    categoria: item.categoria,
    ativa: item.ativa ?? true,
    subcontas: [], // Carregamento de subcontas pode ser implementado depois
  }));
}

export async function saveContasSupabase(contas: ContaBancaria[]): Promise<void> {
  // Para simplificação, faz upsert de todas as contas
  const upsertData = contas.map((c) => ({
    id: c.id,
    codigo: c.codigo,
    nome: c.nome,
    tipo_cc: c.tipoCC,
    categoria: c.categoria,
    ativa: c.ativa,
    // parent_id pode ser adicionado se houver hierarquia
  }));
  const { error } = await supabase
    .from('plano_de_contas')
    .upsert(upsertData, { onConflict: ['id'] });
  if (error) throw error;
}
export interface ContaBancaria {
  id: string;
  codigo: string;
  nome: string;
  tipoCC: 'sintetica' | 'analitica';
  categoria: 'ativo' | 'passivo' | 'patrimonio' | 'receita' | 'despesa';
  ativa: boolean;
  subcontas?: ContaBancaria[];
}

export type CsvCampoPadrao = 'data' | 'historico' | 'valor' | 'tipo' | 'identificador';

export interface CsvLayoutConfig {
  id: string;
  nome: string;
  /** Campos mínimos para considerar o layout compatível com o cabeçalho do CSV */
  camposObrigatorios: CsvCampoPadrao[];
  /** Aliases por campo (comparação é normalizada: lower + sem acentos) */
  aliases: Partial<Record<CsvCampoPadrao, string[]>>;
}

export interface ContaBancariaImportacao {
  id: string;
  nome: string; // Ex: "Banco do Brasil CC", "Nubank"
  contaCodigo: string; // Código da conta no plano de contas (ex: "1.1.01.001")
  contaNome: string; // Nome da conta no plano
  banco?: string; // Código/nome do banco
  agencia?: string;
  numeroConta?: string;
  padrao?: boolean; // Conta padrão para importação
  ativa: boolean;
  // Configurações de classificação automática
  contaPadraoReceita?: string; // Conta padrão para receitas (ex: "4.1.01.001")
  contaPadraoDespesa?: string; // Conta padrão para despesas (ex: "5.99.99.999")
  // Máscaras de codificação específicas para este banco
  mascaraDebito?: string; // Ex: "1.1.01.001 - 1.1.99.999"
  mascaraCredito?: string; // Ex: "1.1.01.002 - 1.1.99.999"
  // Importação por arquivo
  layoutsCsv?: CsvLayoutConfig[];
  regrasClassificacao?: RegraClassificacao[];
}

export interface RegraClassificacao {
  id: string;
  palavrasChave: string[]; // Ex: ["supermercado", "mercado", "alimentação"]
  contaDestino: string; // Ex: "5.3.01.001" (Alimentação)
  tipo: 'entrada' | 'saida';
  prioridade?: number; // Ordem de aplicação (menor = maior prioridade)
  ativo: boolean;
}

export interface SugestaoIA {
  transacaoId: string;
  historico: string;
  contaSugerida: string;
  contaNomeSugerida: string;
  confianca: number; // 0-100
  razao: string; // Explicação da sugestão
  baseadoEm?: string[]; // IDs de lançamentos similares usados
}

export interface AutoPatternConfig {
  id?: string;
  tipo: string; // TipoOperacao do domínio de padrões ou 'customizado'
  nomeOperacao?: string; // Nome customizado para operação livre
  emojiOperacao?: string; // Ícone customizado para operação livre
  mascaraDebito: string;
  mascaraCredito: string;
  incluirFilhas?: boolean;
  bloquearSelecao?: boolean;
}

export interface Configuracoes {
  id: string;
  permitirCriarContasRaiz: boolean;
  tema?: 'light' | 'dark' | 'system';
  iconesCategoria?: {
    ativo?: string;
    passivo?: string;
    patrimonio?: string;
    receita?: string;
    despesa?: string;
  };
  autoPatterns?: AutoPatternConfig[];
  contasBancarias?: ContaBancariaImportacao[];
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
    const response = await fetch('/api/contas', { cache: 'no-store' });
    if (!response.ok) throw new Error('Erro ao buscar plano de contas');
    const data = await response.json();
    return Array.isArray(data) ? data : (data?.contas || []);
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
    const response = await fetch('/api/lancamentos', { cache: 'no-store' });
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

export async function importLancamentos(lancamentos: Omit<Lancamento, 'id'>[]): Promise<number> {
  try {
    const response = await fetch('/api/lancamentos/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lancamentos }),
    });
    if (!response.ok) throw new Error('Erro ao importar lançamentos');
    const data = await response.json();
    return data.inseridos || 0;
  } catch (error) {
    console.error('Erro ao importar lançamentos:', error);
    throw error;
  }
}

// ===== CONFIGURAÇÕES =====

export async function getConfiguracoes(): Promise<Configuracoes> {
  try {
    const response = await fetch('/api/configuracoes', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Erro ao buscar configurações: ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    // Retorna configuração padrão se falhar
    return {
      id: 'config',
      permitirCriarContasRaiz: false,
      autoPatterns: [],
      contasBancarias: []
    };
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
