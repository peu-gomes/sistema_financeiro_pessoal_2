/**
 * API para gerenciamento de orçamentos
 */

export interface ItemOrcamento {
  id: string;
  contaCodigo: string;
  contaNome: string;
  categoria: 'receita' | 'despesa';
  valorPlanejado: number;
  periodicidade: 'mensal' | 'anual' | 'semanal' | 'quinzenal' | 'trimestral' | 'semestral';
  ativo: boolean;
  diaVencimento?: number; // Dia do mês para vencimento (1-31)
  observacao?: string;
}

export interface Orcamento {
  id: string;
  tipo: 'fixo' | 'mensal'; // Fixo = recorrente, Mensal = específico do mês
  nome: string;
  mes?: number; // 1-12, apenas para tipo 'mensal'
  ano?: number; // Apenas para tipo 'mensal'
  itens: ItemOrcamento[];
  criadoEm: string;
  atualizadoEm?: string;
}

// Helper para converter valores baseado na periodicidade
export function calcularValorMensal(valor: number, periodicidade: string): number {
  switch (periodicidade) {
    case 'semanal': return valor * 4.33; // média de semanas por mês
    case 'quinzenal': return valor * 2;
    case 'mensal': return valor;
    case 'trimestral': return valor / 3;
    case 'semestral': return valor / 6;
    case 'anual': return valor / 12;
    default: return valor;
  }
}

export function calcularValorAnual(valor: number, periodicidade: string): number {
  switch (periodicidade) {
    case 'semanal': return valor * 52;
    case 'quinzenal': return valor * 26;
    case 'mensal': return valor * 12;
    case 'trimestral': return valor * 4;
    case 'semestral': return valor * 2;
    case 'anual': return valor;
    default: return valor;
  }
}

export async function getOrcamentos(): Promise<Orcamento[]> {
  try {
    const response = await fetch('/data/orcamentos.json');
    if (!response.ok) throw new Error('Erro ao buscar orçamentos');
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar orçamentos:', error);
    return [];
  }
}

export async function getOrcamento(id: string): Promise<Orcamento | null> {
  const orcamentos = await getOrcamentos();
  return orcamentos.find(o => o.id === id) || null;
}

export async function getOrcamentoUnico(): Promise<Orcamento | null> {
  const orcamentos = await getOrcamentos();
  return orcamentos.length > 0 ? orcamentos[0] : null;
}

export async function getOrcamentoFixo(): Promise<Orcamento | null> {
  const orcamentos = await getOrcamentos();
  return orcamentos.find(o => o.tipo === 'fixo') || null;
}

export async function getOrcamentoMensal(mes: number, ano: number): Promise<Orcamento | null> {
  const orcamentos = await getOrcamentos();
  return orcamentos.find(o => o.tipo === 'mensal' && o.mes === mes && o.ano === ano) || null;
}

export async function criarOrcamentoMensalDoFixo(mes: number, ano: number): Promise<Orcamento> {
  const fixo = await getOrcamentoFixo();
  
  const novoOrcamento: Orcamento = {
    id: `orcamento-${ano}-${String(mes).padStart(2, '0')}`,
    tipo: 'mensal',
    nome: `Orçamento ${getNomeMes(mes)}/${ano}`,
    mes,
    ano,
    itens: fixo ? fixo.itens.map(item => ({
      ...item,
      id: `${item.id}-${ano}-${mes}`,
    })) : [],
    criadoEm: new Date().toISOString()
  };
  
  return novoOrcamento;
}

function getNomeMes(mes: number): string {
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return meses[mes - 1] || 'Mês';
}

export async function saveOrcamento(orcamento: Orcamento): Promise<Orcamento> {
  try {
    const response = await fetch('/api/orcamentos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orcamento),
    });
    if (!response.ok) throw new Error('Erro ao salvar orçamento');
    return await response.json();
  } catch (error) {
    console.error('Erro ao salvar orçamento:', error);
    throw error;
  }
}

export async function deleteOrcamento(id: string): Promise<void> {
  try {
    const response = await fetch('/api/orcamentos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) throw new Error('Erro ao deletar orçamento');
  } catch (error) {
    console.error('Erro ao deletar orçamento:', error);
    throw error;
  }
}
