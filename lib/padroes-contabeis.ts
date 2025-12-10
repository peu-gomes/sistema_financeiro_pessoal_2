/**
 * Sistema de Identificação de Padrões Contábeis
 * Identifica automaticamente o tipo de operação com base nas contas utilizadas
 */

export type PadraoContabil = {
  id: string;
  nome: string;
  descricao: string;
  emoji: string;
  cor: string;
  debito: string[]; // Categorias esperadas no débito
  credito: string[]; // Categorias esperadas no crédito
  exemplos: string[];
};

export type TipoOperacao = 
  | 'despesa-vista'           // D: Despesa, C: Ativo (Caixa/Banco)
  | 'despesa-prazo'           // D: Despesa, C: Passivo (Contas a Pagar)
  | 'receita-vista'           // D: Ativo (Caixa/Banco), C: Receita
  | 'receita-prazo'           // D: Ativo (Contas a Receber), C: Receita
  | 'pagamento-divida'        // D: Passivo, C: Ativo
  | 'recebimento-credito'     // D: Ativo (Caixa/Banco), C: Ativo (Contas a Receber)
  | 'investimento'            // D: Ativo (Investimentos), C: Ativo (Caixa/Banco)
  | 'resgate-investimento'    // D: Ativo (Caixa/Banco), C: Ativo (Investimentos)
  | 'emprestimo-recebido'     // D: Ativo (Caixa/Banco), C: Passivo
  | 'transferencia-entre-contas' // D: Ativo, C: Ativo
  | 'aporte-capital'          // D: Ativo, C: Patrimônio
  | 'retirada-capital'        // D: Patrimônio, C: Ativo
  | 'desconhecido';

export const PADROES_CONTABEIS: Record<TipoOperacao, PadraoContabil> = {
  'despesa-vista': {
    id: 'despesa-vista',
    nome: 'Despesa à Vista',
    descricao: 'Gasto pago imediatamente com dinheiro disponível',
    emoji: '💳',
    cor: 'red',
    debito: ['despesa'],
    credito: ['ativo'],
    exemplos: [
      'Compra no supermercado',
      'Pagamento de combustível',
      'Conta de luz',
      'Almoço no restaurante'
    ]
  },
  
  'despesa-prazo': {
    id: 'despesa-prazo',
    nome: 'Despesa a Prazo',
    descricao: 'Gasto parcelado ou a ser pago futuramente',
    emoji: '📅',
    cor: 'orange',
    debito: ['despesa'],
    credito: ['passivo'],
    exemplos: [
      'Compra no cartão de crédito',
      'Parcelamento de produto',
      'Conta a pagar'
    ]
  },
  
  'receita-vista': {
    id: 'receita-vista',
    nome: 'Receita à Vista',
    descricao: 'Dinheiro recebido imediatamente',
    emoji: '💰',
    cor: 'green',
    debito: ['ativo'],
    credito: ['receita'],
    exemplos: [
      'Salário recebido',
      'Venda à vista',
      'Pagamento por serviço prestado'
    ]
  },
  
  'receita-prazo': {
    id: 'receita-prazo',
    nome: 'Receita a Prazo',
    descricao: 'Valor a receber futuramente',
    emoji: '📈',
    cor: 'blue',
    debito: ['ativo'],
    credito: ['receita'],
    exemplos: [
      'Venda parcelada',
      'Serviço a receber',
      'Contas a receber'
    ]
  },
  
  'pagamento-divida': {
    id: 'pagamento-divida',
    nome: 'Pagamento de Dívida',
    descricao: 'Quitação de valor devido',
    emoji: '✅',
    cor: 'purple',
    debito: ['passivo'],
    credito: ['ativo'],
    exemplos: [
      'Pagamento de fatura do cartão',
      'Quitação de empréstimo',
      'Pagamento de fornecedor'
    ]
  },
  
  'recebimento-credito': {
    id: 'recebimento-credito',
    nome: 'Recebimento de Crédito',
    descricao: 'Entrada de dinheiro de valores a receber',
    emoji: '💵',
    cor: 'teal',
    debito: ['ativo'],
    credito: ['ativo'],
    exemplos: [
      'Cliente pagou parcela',
      'Recebimento de duplicata',
      'Cobrança realizada'
    ]
  },
  
  'investimento': {
    id: 'investimento',
    nome: 'Aplicação/Investimento',
    descricao: 'Dinheiro aplicado em investimentos',
    emoji: '📊',
    cor: 'indigo',
    debito: ['ativo'],
    credito: ['ativo'],
    exemplos: [
      'Compra de ações',
      'Aplicação em CDB',
      'Investimento em fundo'
    ]
  },
  
  'resgate-investimento': {
    id: 'resgate-investimento',
    nome: 'Resgate de Investimento',
    descricao: 'Retirada de dinheiro de investimentos',
    emoji: '💎',
    cor: 'cyan',
    debito: ['ativo'],
    credito: ['ativo'],
    exemplos: [
      'Venda de ações',
      'Resgate de CDB',
      'Saque de investimento'
    ]
  },
  
  'emprestimo-recebido': {
    id: 'emprestimo-recebido',
    nome: 'Empréstimo Recebido',
    descricao: 'Entrada de dinheiro emprestado',
    emoji: '🏦',
    cor: 'yellow',
    debito: ['ativo'],
    credito: ['passivo'],
    exemplos: [
      'Empréstimo bancário',
      'Financiamento',
      'Crédito pessoal'
    ]
  },
  
  'transferencia-entre-contas': {
    id: 'transferencia-entre-contas',
    nome: 'Transferência entre Contas',
    descricao: 'Movimentação entre contas próprias',
    emoji: '🔄',
    cor: 'gray',
    debito: ['ativo'],
    credito: ['ativo'],
    exemplos: [
      'Transferência banco → carteira',
      'TED entre contas',
      'Saque no caixa eletrônico'
    ]
  },
  
  'aporte-capital': {
    id: 'aporte-capital',
    nome: 'Aporte de Capital',
    descricao: 'Entrada de capital próprio',
    emoji: '💼',
    cor: 'emerald',
    debito: ['ativo'],
    credito: ['patrimonio'],
    exemplos: [
      'Capital inicial',
      'Aporte de sócio',
      'Investimento pessoal'
    ]
  },
  
  'retirada-capital': {
    id: 'retirada-capital',
    nome: 'Retirada de Capital',
    descricao: 'Retirada de capital próprio',
    emoji: '📤',
    cor: 'rose',
    debito: ['patrimonio'],
    credito: ['ativo'],
    exemplos: [
      'Pró-labore',
      'Distribuição de lucros',
      'Retirada pessoal'
    ]
  },
  
  'desconhecido': {
    id: 'desconhecido',
    nome: 'Padrão Não Identificado',
    descricao: 'Lançamento que não se encaixa em padrões conhecidos',
    emoji: '❓',
    cor: 'slate',
    debito: [],
    credito: [],
    exemplos: []
  }
};

/**
 * Identifica o tipo de operação baseado nas categorias das contas
 */
export function identificarPadrao(
  categoriaDebito: string,
  categoriaCredito: string,
  contaNomeDebito?: string,
  contaNomeCredito?: string
): TipoOperacao {
  const debito = categoriaDebito.toLowerCase();
  const credito = categoriaCredito.toLowerCase();
  const nomeDebito = contaNomeDebito?.toLowerCase() || '';
  const nomeCredito = contaNomeCredito?.toLowerCase() || '';

  // Despesa à Vista: D-Despesa, C-Ativo
  if (debito === 'despesa' && credito === 'ativo') {
    return 'despesa-vista';
  }

  // Despesa a Prazo: D-Despesa, C-Passivo
  if (debito === 'despesa' && credito === 'passivo') {
    return 'despesa-prazo';
  }

  // Receita à Vista: D-Ativo(Caixa/Banco), C-Receita
  if (debito === 'ativo' && credito === 'receita') {
    // Verifica se o ativo é caixa/banco (receita à vista) ou contas a receber (receita a prazo)
    const ehContaReceber = nomeDebito.includes('receber') || nomeDebito.includes('duplicata') || nomeDebito.includes('cliente');
    return ehContaReceber ? 'receita-prazo' : 'receita-vista';
  }

  // Pagamento de Dívida: D-Passivo, C-Ativo
  if (debito === 'passivo' && credito === 'ativo') {
    return 'pagamento-divida';
  }

  // Empréstimo Recebido: D-Ativo, C-Passivo
  if (debito === 'ativo' && credito === 'passivo') {
    return 'emprestimo-recebido';
  }

  // Aporte de Capital: D-Ativo, C-Patrimônio
  if (debito === 'ativo' && credito === 'patrimonio') {
    return 'aporte-capital';
  }

  // Retirada de Capital: D-Patrimônio, C-Ativo
  if (debito === 'patrimonio' && credito === 'ativo') {
    return 'retirada-capital';
  }

  // Operações entre Ativos (precisa análise mais detalhada)
  if (debito === 'ativo' && credito === 'ativo') {
    // Verifica palavras-chave nos nomes das contas
    const ehInvestimento = nomeDebito.includes('investimento') || nomeDebito.includes('aplicação') || 
                          nomeDebito.includes('ações') || nomeDebito.includes('fundo');
    const ehResgate = nomeCredito.includes('investimento') || nomeCredito.includes('aplicação') ||
                     nomeCredito.includes('ações') || nomeCredito.includes('fundo');
    const ehRecebimento = nomeCredito.includes('receber') || nomeCredito.includes('duplicata') || 
                         nomeCredito.includes('cliente');

    if (ehInvestimento && !ehResgate) return 'investimento';
    if (ehResgate && !ehInvestimento) return 'resgate-investimento';
    if (ehRecebimento) return 'recebimento-credito';
    
    return 'transferencia-entre-contas';
  }

  return 'desconhecido';
}

/**
 * Retorna informações do padrão identificado
 */
export function obterInformacoesPadrao(tipo: TipoOperacao): PadraoContabil {
  return PADROES_CONTABEIS[tipo];
}

/**
 * Retorna a cor do badge baseado no tipo de operação
 */
export function obterCorPadrao(tipo: TipoOperacao): string {
  const cores: Record<string, string> = {
    red: 'bg-red-100 text-red-700 border-red-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    teal: 'bg-teal-100 text-teal-700 border-teal-200',
    indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    cyan: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    rose: 'bg-rose-100 text-rose-700 border-rose-200',
    slate: 'bg-slate-100 text-slate-600 border-slate-200'
  };

  const padrao = PADROES_CONTABEIS[tipo];
  return cores[padrao.cor] || cores.slate;
}

/**
 * Análise de lançamento com identificação de padrão
 */
export function analisarLancamento(partidas: Array<{
  contaCodigo: string;
  contaNome: string;
  natureza: 'debito' | 'credito';
  valor: number;
  categoria?: string;
}>) {
  if (partidas.length < 2) {
    return { tipo: 'desconhecido' as TipoOperacao, padrao: PADROES_CONTABEIS['desconhecido'] };
  }

  const debitos = partidas.filter(p => p.natureza === 'debito');
  const creditos = partidas.filter(p => p.natureza === 'credito');

  if (debitos.length === 0 || creditos.length === 0) {
    return { tipo: 'desconhecido' as TipoOperacao, padrao: PADROES_CONTABEIS['desconhecido'] };
  }

  // Para simplificar, usa a primeira partida de cada lado
  const primeiroDebito = debitos[0];
  const primeiroCredito = creditos[0];

  const tipo = identificarPadrao(
    primeiroDebito.categoria || '',
    primeiroCredito.categoria || '',
    primeiroDebito.contaNome,
    primeiroCredito.contaNome
  );

  return {
    tipo,
    padrao: PADROES_CONTABEIS[tipo],
    debitos,
    creditos
  };
}
