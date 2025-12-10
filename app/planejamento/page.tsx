'use client';

import { useEffect, useRef, useState } from 'react';
import type { TouchEvent } from 'react';
import Header from '@/components/Header';
import { getContas, type ContaBancaria } from '@/lib/api';
import { 
  getOrcamentos,
  getOrcamentoFixo,
  getOrcamentoMensal,
  criarOrcamentoMensalDoFixo,
  saveOrcamento, 
  deleteOrcamento,
  calcularValorMensal,
  calcularValorAnual,
  type Orcamento, 
  type ItemOrcamento 
} from '@/lib/api-orcamento';

export default function Planejamento() {
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [contasAnaliticas, setContasAnaliticas] = useState<ContaBancaria[]>([]);
  const [orcamentoFixo, setOrcamentoFixo] = useState<Orcamento | null>(null);
  const [orcamentoMensal, setOrcamentoMensal] = useState<Orcamento | null>(null);
  const [tipoAtivo, setTipoAtivo] = useState<'fixo' | 'mensal'>('mensal'); // Começa com mensal
  const [mesAtual, setMesAtual] = useState(new Date().getMonth() + 1);
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear());
  const [visualizacao, setVisualizacao] = useState<'mensal' | 'anual'>('mensal');
  const [modalAberto, setModalAberto] = useState(false);
  const [itemEmEdicao, setItemEmEdicao] = useState<ItemOrcamento | null>(null);
  const [modoCompacto, setModoCompacto] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullStartY, setPullStartY] = useState<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [mounted, setMounted] = useState(false);
  const autoSaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveFirstRun = useRef(true);

  const orcamentoAtual = tipoAtivo === 'fixo' ? orcamentoFixo : orcamentoMensal;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    carregarDados();
    
    // Listener de scroll para modo compacto
    const handleScroll = () => {
      setModoCompacto(window.scrollY > 200);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    carregarOrcamentoMensal(mesAtual, anoAtual);
  }, [mesAtual, anoAtual]);

  // Auto-save debounce para orçamentos
  useEffect(() => {
    if (autoSaveFirstRun.current) {
      autoSaveFirstRun.current = false;
      return;
    }

    if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);

    autoSaveTimeout.current = setTimeout(() => {
      if (orcamentoFixo) saveOrcamento(orcamentoFixo);
      if (orcamentoMensal) saveOrcamento(orcamentoMensal);
    }, 800);

    return () => {
      if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);
    };
  }, [orcamentoFixo, orcamentoMensal]);

  const carregarDados = async () => {
    const contasData = await getContas();
    setContas(contasData);
    
    // Extrair contas analíticas de receita e despesa
    const analiticas: ContaBancaria[] = [];
    const extrairAnaliticas = (conta: ContaBancaria) => {
      if (conta.tipoCC === 'analitica' && (conta.categoria === 'receita' || conta.categoria === 'despesa')) {
        analiticas.push(conta);
      }
      conta.subcontas?.forEach(extrairAnaliticas);
    };
    contasData.forEach(extrairAnaliticas);
    setContasAnaliticas(analiticas);

    // Carregar orçamento fixo
    const fixo = await getOrcamentoFixo();
    if (fixo) {
      setOrcamentoFixo(fixo);
    } else {
      // Criar novo orçamento fixo vazio
      const novoFixo: Orcamento = {
        id: 'orcamento-fixo',
        tipo: 'fixo',
        nome: 'Orçamento Fixo (Recorrente)',
        itens: [],
        criadoEm: new Date().toISOString()
      };
      setOrcamentoFixo(novoFixo);
    }

    // Carregar orçamento mensal atual
    await carregarOrcamentoMensal(mesAtual, anoAtual);
  };

  const carregarOrcamentoMensal = async (mes: number, ano: number) => {
    const mensal = await getOrcamentoMensal(mes, ano);
    setOrcamentoMensal(mensal);
  };

  const handleCriarOrcamentoMensalDoFixo = async () => {
    if (!confirm(`Criar orçamento de ${getNomeMes(mesAtual)}/${anoAtual} baseado no fixo?\n\nIsso irá copiar todos os itens do orçamento fixo.`)) return;
    
    const novoMensal = await criarOrcamentoMensalDoFixo(mesAtual, anoAtual);
    await saveOrcamento(novoMensal);
    setOrcamentoMensal(novoMensal);
  };

  const handleMesAnterior = () => {
    if (mesAtual === 1) {
      setMesAtual(12);
      setAnoAtual(anoAtual - 1);
    } else {
      setMesAtual(mesAtual - 1);
    }
  };

  const handleMesProximo = () => {
    if (mesAtual === 12) {
      setMesAtual(1);
      setAnoAtual(anoAtual + 1);
    } else {
      setMesAtual(mesAtual + 1);
    }
  };

  const handleSalvarItem = (item: Partial<ItemOrcamento>) => {
    if (!orcamentoAtual) return;
    
    const novoItem: ItemOrcamento = {
      id: item.id || `item-${Date.now()}`,
      contaCodigo: item.contaCodigo!,
      contaNome: item.contaNome!,
      categoria: item.categoria!,
      valorPlanejado: item.valorPlanejado!,
      periodicidade: item.periodicidade || 'mensal',
      ativo: item.ativo !== undefined ? item.ativo : true,
      diaVencimento: item.diaVencimento,
      observacao: item.observacao
    };

    let novosItens = [...orcamentoAtual.itens];
    const index = novosItens.findIndex(i => i.id === novoItem.id);
    
    if (index >= 0) {
      novosItens[index] = novoItem;
    } else {
      novosItens.push(novoItem);
    }

    const orcAtualizado = { ...orcamentoAtual, itens: novosItens };
    
    if (tipoAtivo === 'fixo') {
      setOrcamentoFixo(orcAtualizado);
    } else {
      setOrcamentoMensal(orcAtualizado);
    }
    
    saveOrcamento(orcAtualizado);
    setModalAberto(false);
    setItemEmEdicao(null);
  };

  const refreshDados = async () => {
    setIsRefreshing(true);
    await carregarDados();
    setIsRefreshing(false);
    setPullDistance(0);
    setPullStartY(null);
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (window.scrollY === 0) {
      setPullStartY(e.touches[0].clientY);
      setPullDistance(0);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (pullStartY === null) return;
    const distance = e.touches[0].clientY - pullStartY;
    if (distance > 0) {
      setPullDistance(Math.min(distance, 140));
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 70) {
      refreshDados();
    }
    setPullStartY(null);
    setPullDistance(0);
  };

  const handleExcluirItem = (id: string) => {
    if (!orcamentoAtual || !confirm('Deseja excluir este item do orçamento?')) return;
    
    const novosItens = orcamentoAtual.itens.filter(i => i.id !== id);
    const orcAtualizado = { ...orcamentoAtual, itens: novosItens };
    
    if (tipoAtivo === 'fixo') {
      setOrcamentoFixo(orcAtualizado);
    } else {
      setOrcamentoMensal(orcAtualizado);
    }
    
    saveOrcamento(orcAtualizado);
  };

  const handleToggleAtivo = (id: string) => {
    if (!orcamentoAtual) return;
    
    const novosItens = orcamentoAtual.itens.map(i => 
      i.id === id ? { ...i, ativo: !i.ativo } : i
    );
    const orcAtualizado = { ...orcamentoAtual, itens: novosItens };
    
    if (tipoAtivo === 'fixo') {
      setOrcamentoFixo(orcAtualizado);
    } else {
      setOrcamentoMensal(orcAtualizado);
    }
    
    saveOrcamento(orcAtualizado);
  };

  const calcularTotais = () => {
    if (!orcamentoAtual) return { receitas: 0, despesas: 0, saldo: 0 };
    
    const calcularFn = visualizacao === 'mensal' ? calcularValorMensal : calcularValorAnual;
    
    const receitas = orcamentoAtual.itens
      .filter(i => i.categoria === 'receita' && i.ativo)
      .reduce((sum, i) => sum + calcularFn(i.valorPlanejado, i.periodicidade), 0);
    
    const despesas = orcamentoAtual.itens
      .filter(i => i.categoria === 'despesa' && i.ativo)
      .reduce((sum, i) => sum + calcularFn(i.valorPlanejado, i.periodicidade), 0);
    
    return { receitas, despesas, saldo: receitas - despesas };
  };

  const getNomeMes = (mes: number): string => {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return meses[mes - 1] || 'Mês';
  };
  const totais = calcularTotais();

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-0">
      <Header />

      {/* Indicador de pull-to-refresh (mobile) */}
      {(isRefreshing || pullDistance > 0) && (
        <div className="md:hidden flex items-center justify-center text-[12px] text-gray-600 py-2 transition-all" style={{ transform: `translateY(${pullDistance ? Math.min(pullDistance, 80) / 4 : 0}px)` }}>
          {isRefreshing ? 'Atualizando...' : pullDistance > 70 ? 'Solte para atualizar' : 'Puxe para atualizar'}
        </div>
      )}

      {/* Main Content */}
      <main
        className="max-w-7xl mx-auto px-4 py-8"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: pullDistance ? `translateY(${Math.min(pullDistance, 80) / 6}px)` : undefined }}
      >
        {/* Abas Fixo / Mensal - STICKY com modo compacto */}
        <div className={`bg-white rounded-lg shadow mb-6 sticky top-12 z-30 transition-all duration-300 ${
          modoCompacto ? 'shadow-md' : ''
        }`}>
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setTipoAtivo('mensal')}
                className={`flex-1 md:flex-none md:px-8 text-sm font-medium border-b-2 transition-all ${
                  modoCompacto ? 'py-2' : 'py-4'
                } ${
                  tipoAtivo === 'mensal'
                    ? 'border-blue-700 dark:border-blue-500 text-blue-700 bg-white dark:bg-blue-900/30 dark:text-blue-400'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                }`}
              >
                {modoCompacto ? '📅' : '📅 Mensal'}
              </button>
              <button
                onClick={() => setTipoAtivo('fixo')}
                className={`flex-1 md:flex-none md:px-8 text-sm font-medium border-b-2 transition-all ${
                  modoCompacto ? 'py-2' : 'py-4'
                } ${
                  tipoAtivo === 'fixo'
                    ? 'border-blue-700 dark:border-blue-500 text-blue-700 bg-white dark:bg-blue-900/30 dark:text-blue-400'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                }`}
              >
                {modoCompacto ? '🔄' : '🔄 Fixo (Recorrente)'}
              </button>
            </div>
          </div>

          {/* Seletor de Mês (apenas para mensal) - Compacto quando scrolling */}
          {tipoAtivo === 'mensal' && (
            <div className={`px-6 bg-gray-50 border-b border-gray-200 transition-all duration-300 ${
              modoCompacto ? 'py-2' : 'py-4'
            }`}>
              <div className="flex items-center justify-between">
                <button
                  onClick={handleMesAnterior}
                  className={`hover:bg-gray-200 rounded-lg transition-all ${
                    modoCompacto ? 'p-1' : 'p-2'
                  }`}
                  title="Mês anterior"
                >
                  <svg className={`text-gray-600 transition-all ${
                    modoCompacto ? 'w-4 h-4' : 'w-5 h-5'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <div className="text-center">
                  <div className={`font-semibold text-gray-800 transition-all ${
                    modoCompacto ? 'text-sm' : 'text-lg'
                  }`}>
                    {getNomeMes(mesAtual)} / {anoAtual}
                  </div>
                  {!modoCompacto && !orcamentoMensal && (
                    <button
                      onClick={handleCriarOrcamentoMensalDoFixo}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      ✨ Criar baseado no fixo
                    </button>
                  )}
                </div>
                
                <button
                  onClick={handleMesProximo}
                  className={`hover:bg-gray-200 rounded-lg transition-all ${
                    modoCompacto ? 'p-1' : 'p-2'
                  }`}
                  title="Próximo mês"
                >
                  <svg className={`text-gray-600 transition-all ${
                    modoCompacto ? 'w-4 h-4' : 'w-5 h-5'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          <div className={`border-b border-gray-200 transition-all duration-300 ${
            modoCompacto ? 'p-3' : 'p-6'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {!modoCompacto && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {tipoAtivo === 'fixo' ? 'Orçamento Fixo (Recorrente)' : `Orçamento de ${getNomeMes(mesAtual)}/${anoAtual}`}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {tipoAtivo === 'fixo' 
                      ? 'Itens recorrentes que se repetem mensalmente'
                      : 'Planejamento específico deste mês com ajustes e extras'}
                  </p>
                </div>
              )}
              
              {/* Toggle Mensal/Anual - Compacto quando scrolling */}
              <div className={`flex gap-2 bg-gray-100 rounded-lg transition-all ${
                modoCompacto ? 'p-0.5 ml-auto' : 'p-1'
              }`}>
                <button
                  onClick={() => setVisualizacao('mensal')}
                  className={`rounded-md text-sm font-medium transition-all ${
                    modoCompacto ? 'px-3 py-1' : 'px-4 py-2'
                  } ${
                    visualizacao === 'mensal'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {modoCompacto ? 'M' : 'Mensal'}
                </button>
                <button
                  onClick={() => setVisualizacao('anual')}
                  className={`rounded-md text-sm font-medium transition-all ${
                    modoCompacto ? 'px-3 py-1' : 'px-4 py-2'
                  } ${
                    visualizacao === 'anual'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {modoCompacto ? 'A' : 'Anual'}
                </button>
              </div>
            </div>
          </div>

          {/* Resumo - Compacto quando scrolling */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 bg-white transition-all duration-300 ${
            modoCompacto ? 'p-3' : 'p-6'
          } ${modoCompacto ? 'hidden md:grid' : ''}`}>
            <div className={`bg-white rounded-lg shadow border-l-4 border-green-500 transition-all ${
              modoCompacto ? 'p-2' : 'p-4'
            }`}>
              <div className={`text-gray-600 font-medium transition-all ${
                modoCompacto ? 'text-xs mb-0.5' : 'text-sm mb-1'
              }`}>
                {modoCompacto ? '💰' : `Receitas ${visualizacao === 'mensal' ? 'Mensais' : 'Anuais'}`}
              </div>
              <div className={`font-semibold text-green-600 transition-all ${
                modoCompacto ? 'text-base' : 'text-2xl'
              }`}>
                R$ {totais.receitas.toFixed(2)}
              </div>
            </div>
            <div className={`bg-white rounded-lg shadow border-l-4 border-red-500 transition-all ${
              modoCompacto ? 'p-2' : 'p-4'
            }`}>
              <div className={`text-gray-600 font-medium transition-all ${
                modoCompacto ? 'text-xs mb-0.5' : 'text-sm mb-1'
              }`}>
                {modoCompacto ? '💸' : `Despesas ${visualizacao === 'mensal' ? 'Mensais' : 'Anuais'}`}
              </div>
              <div className={`font-semibold text-red-600 transition-all ${
                modoCompacto ? 'text-base' : 'text-2xl'
              }`}>
                R$ {totais.despesas.toFixed(2)}
              </div>
            </div>
            <div className={`bg-white rounded-lg shadow border-l-4 transition-all ${
              totais.saldo >= 0 ? 'border-blue-500' : 'border-orange-500'
            } ${
              modoCompacto ? 'p-2' : 'p-4'
            }`}>
              <div className={`text-gray-600 font-medium transition-all ${
                modoCompacto ? 'text-xs mb-0.5' : 'text-sm mb-1'
              }`}>
                {modoCompacto ? '📊' : `Saldo ${visualizacao === 'mensal' ? 'Mensal' : 'Anual'}`}
              </div>
              <div className={`font-semibold transition-all ${
                totais.saldo >= 0 ? 'text-blue-600' : 'text-orange-600'
              } ${
                modoCompacto ? 'text-base' : 'text-2xl'
              }`}>
                R$ {totais.saldo.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Resumo ultra-compacto para mobile quando em modo compacto */}
          {modoCompacto && (
            <div className="md:hidden grid grid-cols-3 gap-2 bg-white/90 backdrop-blur rounded-xl shadow-sm border border-gray-200 px-3 py-2 mb-4">
              <div className="flex flex-col items-center text-[11px] text-gray-600">
                <span className="text-green-600 font-semibold">R$ {totais.receitas.toFixed(0)}</span>
                <span>Receitas</span>
              </div>
              <div className="flex flex-col items-center text-[11px] text-gray-600">
                <span className="text-red-600 font-semibold">R$ {totais.despesas.toFixed(0)}</span>
                <span>Despesas</span>
              </div>
              <div className="flex flex-col items-center text-[11px] text-gray-600">
                <span className={`${totais.saldo >= 0 ? 'text-blue-600' : 'text-orange-600'} font-semibold`}>
                  R$ {totais.saldo.toFixed(0)}
                </span>
                <span>Saldo</span>
              </div>
            </div>
          )}
        </div>

        {/* Lista de Itens */}
        <div className="bg-white rounded-lg shadow">
          <div className={`border-b border-gray-200 flex items-center justify-between ${
            modoCompacto ? 'p-4' : 'p-6'
          }`}>
            <h3 className="text-lg font-semibold text-gray-800">Itens do Orçamento</h3>
            <button
              onClick={() => {
                setItemEmEdicao(null);
                setModalAberto(true);
              }}
              className={`bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium ${
                modoCompacto ? 'px-3 py-2' : 'px-4 py-2'
              }`}
            >
              + Adicionar Item
            </button>
          </div>

          <div className="p-6">
            {!orcamentoAtual || orcamentoAtual.itens.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500 text-lg mb-2">Nenhum item cadastrado</p>
                <p className="text-gray-400 text-sm">Adicione receitas e despesas ao seu orçamento</p>
              </div>
            ) : (
              <>
                {/* Tabela Desktop */}
                <div className="hidden md:block overflow-x-auto -mx-6 px-6">
                  <table className="w-full table-fixed min-w-[700px]">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-2 text-sm font-semibold text-gray-700 w-16">Tipo</th>
                        <th className="text-left py-2 px-2 text-sm font-semibold text-gray-700 w-24">Código</th>
                        <th className="text-left py-2 px-2 text-sm font-semibold text-gray-700">Categoria</th>
                        <th className="text-left py-2 px-2 text-sm font-semibold text-gray-700 w-24">Periodicidade</th>
                        <th className="text-center py-2 px-2 text-sm font-semibold text-gray-700 w-16">Dia</th>
                        <th className="text-right py-2 px-2 text-sm font-semibold text-gray-700 w-28">Valor</th>
                        <th className="text-right py-2 px-2 text-sm font-semibold text-gray-700 w-28">{visualizacao === 'mensal' ? 'Mensal' : 'Anual'}</th>
                        <th className="text-center py-2 px-1 text-sm font-semibold text-gray-700 w-20">
                          <span className="sr-only">Ações</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {orcamentoAtual.itens.map((item) => {
                        const valorPlanejado = item.valorPlanejado || 0;
                        const valorConvertido = visualizacao === 'mensal'
                          ? calcularValorMensal(valorPlanejado, item.periodicidade)
                          : calcularValorAnual(valorPlanejado, item.periodicidade);
                        return (
                          <tr key={item.id} className={`border-b border-gray-100 hover:bg-gray-50 ${tipoAtivo === 'mensal' && !item.ativo ? 'opacity-50' : ''}`}>
                            <td className="py-2 px-2 text-sm align-top">
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                item.categoria === 'receita' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {item.categoria === 'receita' ? 'Receita' : 'Despesa'}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-sm text-gray-700 font-mono align-top">
                              {item.contaCodigo}
                            </td>
                            <td className="py-2 px-2 text-sm text-gray-700 align-top">
                              <div className="line-clamp-2" title={item.contaNome}>{item.contaNome}</div>
                              {item.observacao && (
                                <div className="text-xs text-gray-500 mt-0.5 italic">{item.observacao}</div>
                              )}
                            </td>
                            <td className="py-2 px-2 text-sm text-gray-600 align-top capitalize">
                              {item.periodicidade}
                            </td>
                            <td className="py-2 px-2 text-sm text-center text-gray-700 align-top">
                              {item.diaVencimento ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 text-blue-700 font-medium">
                                  {item.diaVencimento}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-2 px-2 text-sm text-right text-gray-700 font-medium align-top">
                              R$ {valorPlanejado.toFixed(2)}
                            </td>
                            <td className="py-2 px-2 text-sm text-right text-gray-900 font-semibold align-top">
                              R$ {valorConvertido.toFixed(2)}
                            </td>
                            <td className="py-2 px-1 text-center align-top">
                              <div className="flex items-center justify-center gap-0.5">
                                {tipoAtivo === 'mensal' && (
                                  <button
                                    onClick={() => handleToggleAtivo(item.id)}
                                    className={`inline-flex items-center justify-center w-7 h-7 rounded transition-colors ${
                                      item.ativo 
                                        ? 'text-green-600 hover:text-green-800 hover:bg-green-50' 
                                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                    }`}
                                    title={item.ativo ? 'Desativar' : 'Ativar'}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      {item.ativo ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      )}
                                    </svg>
                                    <span className="sr-only">{item.ativo ? 'Desativar' : 'Ativar'}</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setItemEmEdicao(item);
                                    setModalAberto(true);
                                  }}
                                  className="inline-flex items-center justify-center w-7 h-7 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                  title="Editar"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  <span className="sr-only">Editar</span>
                                </button>
                                <button
                                  onClick={() => handleExcluirItem(item.id)}
                                  className="inline-flex items-center justify-center w-7 h-7 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                  title="Excluir"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  <span className="sr-only">Excluir</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Cards Mobile */}
                <div className="md:hidden space-y-3">
                  {orcamentoAtual.itens.map((item) => {
                    const valorConvertido = visualizacao === 'mensal'
                      ? calcularValorMensal(item.valorPlanejado, item.periodicidade)
                      : calcularValorAnual(item.valorPlanejado, item.periodicidade);
                    return (
                      <div
                        key={item.id}
                        className={`bg-white border rounded-lg p-4 ${tipoAtivo === 'mensal' && !item.ativo ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                              item.categoria === 'receita' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {item.categoria === 'receita' ? 'Receita' : 'Despesa'}
                            </span>
                            <p className="text-sm font-medium text-gray-900 mt-2">{item.contaNome}</p>
                            <p className="text-xs text-gray-500 font-mono">{item.contaCodigo}</p>
                            {item.observacao && (
                              <p className="text-xs text-gray-500 mt-1 italic">{item.observacao}</p>
                            )}
                            {item.diaVencimento && (
                              <p className="text-xs text-blue-600 mt-1">📅 Dia {item.diaVencimento}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900">
                              R$ {valorConvertido.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">{visualizacao === 'mensal' ? 'mensal' : 'anual'}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="text-xs text-gray-600">
                            <span className="capitalize">{item.periodicidade}</span>
                            <span className="mx-1">•</span>
                            <span>R$ {item.valorPlanejado.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {tipoAtivo === 'mensal' && (
                              <button
                                onClick={() => handleToggleAtivo(item.id)}
                                className={`p-2 rounded ${
                                  item.ativo 
                                    ? 'text-green-600 hover:bg-green-50' 
                                    : 'text-gray-400 hover:bg-gray-50'
                                }`}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  {item.ativo ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  )}
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setItemEmEdicao(item);
                                setModalAberto(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleExcluirItem(item.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Modal de Item */}
      {modalAberto && (
        <ModalItem
          isOpen={modalAberto}
          onClose={() => {
            setModalAberto(false);
            setItemEmEdicao(null);
          }}
          onSalvar={handleSalvarItem}
          contasAnaliticas={contasAnaliticas}
          itemEmEdicao={itemEmEdicao}
        />
      )}

      {/* Navigation Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 [padding-bottom:max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex justify-around items-center h-16">
          <a href="/" className="flex flex-col items-center justify-center flex-1 h-full text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            <span className="text-xs mt-1">Home</span>
          </a>
          <a href="/plano-de-contas" className="flex flex-col items-center justify-center flex-1 h-full text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            <span className="text-xs mt-1">Contas</span>
          </a>
          <a href="/planejamento" className="flex flex-col items-center justify-center flex-1 h-full text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            <span className="text-xs mt-1">Planejar</span>
          </a>
          <a href="/lancamentos" className="flex flex-col items-center justify-center flex-1 h-full text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            <span className="text-xs mt-1">Lançar</span>
          </a>
          <a href="/configuracoes" className="flex flex-col items-center justify-center flex-1 h-full text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="text-xs mt-1">Config</span>
          </a>
        </div>
      </nav>
    </div>
  );
}

// Modal para adicionar/editar item
function ModalItem({ 
  isOpen, 
  onClose, 
  onSalvar, 
  contasAnaliticas, 
  itemEmEdicao 
}: { 
  isOpen: boolean;
  onClose: () => void;
  onSalvar: (item: Partial<ItemOrcamento>) => void;
  contasAnaliticas: ContaBancaria[];
  itemEmEdicao: ItemOrcamento | null;
}) {
  const [formData, setFormData] = useState<Partial<ItemOrcamento>>({
    id: itemEmEdicao?.id || '',
    contaCodigo: itemEmEdicao?.contaCodigo || '',
    contaNome: itemEmEdicao?.contaNome || '',
    categoria: itemEmEdicao?.categoria || 'despesa',
    valorPlanejado: itemEmEdicao?.valorPlanejado || 0,
    periodicidade: itemEmEdicao?.periodicidade || 'mensal',
    ativo: itemEmEdicao?.ativo !== undefined ? itemEmEdicao.ativo : true,
    diaVencimento: itemEmEdicao?.diaVencimento,
    observacao: itemEmEdicao?.observacao || ''
  });

  const handleContaSelecionada = (codigo: string) => {
    const conta = contasAnaliticas.find(c => c.codigo === codigo);
    if (conta) {
      setFormData({
        ...formData,
        contaCodigo: conta.codigo,
        contaNome: conta.nome,
        categoria: conta.categoria as 'receita' | 'despesa'
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.contaCodigo || !formData.valorPlanejado) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }
    onSalvar(formData);
  };

  if (!isOpen) return null;

  const valorMensal = calcularValorMensal(formData.valorPlanejado || 0, formData.periodicidade || 'mensal');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            {itemEmEdicao ? 'Editar Item' : 'Novo Item do Orçamento'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.contaCodigo}
                onChange={(e) => handleContaSelecionada(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Selecione uma conta</option>
                <optgroup label="Receitas">
                  {contasAnaliticas
                    .filter(c => c.categoria === 'receita')
                    .map(c => (
                      <option key={c.id} value={c.codigo}>
                        {c.codigo} - {c.nome}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Despesas">
                  {contasAnaliticas
                    .filter(c => c.categoria === 'despesa')
                    .map(c => (
                      <option key={c.id} value={c.codigo}>
                        {c.codigo} - {c.nome}
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>

            {/* Periodicidade, Valor e Dia de Vencimento */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Periodicidade <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.periodicidade}
                  onChange={(e) => setFormData({ ...formData, periodicidade: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="semanal">Semanal</option>
                  <option value="quinzenal">Quinzenal</option>
                  <option value="mensal">Mensal</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="semestral">Semestral</option>
                  <option value="anual">Anual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor Planejado <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valorPlanejado}
                  onChange={(e) => setFormData({ ...formData, valorPlanejado: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dia do Vencimento
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.diaVencimento || ''}
                  onChange={(e) => setFormData({ ...formData, diaVencimento: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 5"
                />
              </div>
            </div>

            {/* Observação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observação
              </label>
              <textarea
                value={formData.observacao}
                onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Adicione uma nota ou lembrete..."
                rows={2}
              />
            </div>

            {/* Equivalente Mensal */}
            {formData.periodicidade !== 'mensal' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-blue-900">Equivalente Mensal</p>
                    <p className="text-lg font-semibold text-blue-700">R$ {valorMensal.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {itemEmEdicao ? 'Salvar Alterações' : 'Adicionar Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
