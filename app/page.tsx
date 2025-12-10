'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { getLancamentos, type Lancamento } from '@/lib/api';
import { getOrcamentos, calcularValorMensal, type Orcamento } from '@/lib/api-orcamento';

export default function Home() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [naoClassificados, setNaoClassificados] = useState(0);
  const [precisamRevisao, setPrecisamRevisao] = useState(0);
  const [orcamentoMes, setOrcamentoMes] = useState<{receitas: number, despesas: number, saldo: number} | null>(null);
  const [contasPagar, setContasPagar] = useState<Array<{nome: string, valor: number, diaVencimento: number, vencido: boolean}>>([]);
  const [gastosPorCategoria, setGastosPorCategoria] = useState<Array<{categoria: string, total: number, percentual: number}>>([]);
  const [comparacaoOrcamento, setComparacaoOrcamento] = useState<Array<{categoria: string, planejado: number, realizado: number, diferenca: number, percentualGasto: number}>>([]);
  const [secaoExpandida, setSecaoExpandida] = useState<{[key: string]: boolean}>({
    planejadoVsRealizado: true,
    gastosPorCategoria: true,
    contasPagar: true,
    ultimosLancamentos: true
  });
  const [modalPerfilAberto, setModalPerfilAberto] = useState(false);
  const [perfil, setPerfil] = useState({ nome: '', foto: '' });
  const [nomeTemp, setNomeTemp] = useState('');
  const [fotoTemp, setFotoTemp] = useState('');
  const [loading, setLoading] = useState(true);
  const [mostrarResumoFixo, setMostrarResumoFixo] = useState(false);
  const [mostrarBotaoTopo, setMostrarBotaoTopo] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Marcar como mounted no client para evitar hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Carrega perfil salvo no client evitando acesso a localStorage no SSR
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const nome = localStorage.getItem('perfilNome') || '';
    const foto = localStorage.getItem('perfilFoto') || '';
    setPerfil({ nome, foto });
    setNomeTemp(nome);
    setFotoTemp(foto);
  }, []);

  const toggleSecao = (secao: string) => {
    setSecaoExpandida(prev => ({ ...prev, [secao]: !prev[secao] }));
  };

  const abrirModalPerfil = () => {
    setNomeTemp(perfil.nome);
    setFotoTemp(perfil.foto);
    setModalPerfilAberto(true);
  };

  const salvarPerfil = () => {
    localStorage.setItem('perfilNome', nomeTemp);
    localStorage.setItem('perfilFoto', fotoTemp);
    setPerfil({ nome: nomeTemp, foto: fotoTemp });
    setModalPerfilAberto(false);
  };

  const getIniciais = (nome: string) => {
    if (!nome) return '?';
    const partes = nome.trim().split(' ');
    if (partes.length === 1) return partes[0][0].toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  };

  const voltarAoTopo = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  useEffect(() => {
    carregarDados();
    
    // Monitorar scroll para mostrar/ocultar resumo fixo
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setMostrarResumoFixo(scrollY > 300);
      setMostrarBotaoTopo(scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const carregarDados = async () => {
    try {
      const lancamentosData = await getLancamentos();
      setLancamentos(lancamentosData);

      // Não classificados: débito ≠ crédito
      const naoClass = lancamentosData.filter(lanc => {
        const totalDebito = lanc.partidas.filter(p => p.natureza === 'debito').reduce((acc, p) => acc + p.valor, 0);
        const totalCredito = lanc.partidas.filter(p => p.natureza === 'credito').reduce((acc, p) => acc + p.valor, 0);
        return totalDebito !== totalCredito || lanc.partidas.length === 0;
      }).length;
      setNaoClassificados(naoClass);

      // Precisam revisão: sem documento ou histórico incompleto
      const precisamRev = lancamentosData.filter(lanc => 
        !lanc.documento || lanc.historico.trim() === '' || lanc.historico === 'Novo lançamento'
      ).length;
      setPrecisamRevisao(precisamRev);

      // Orçamento do mês atual
      const mesAtual = new Date().getMonth() + 1;
      const anoAtual = new Date().getFullYear();
      const orcamentos = await getOrcamentos();
      const orcMensal = orcamentos.find(orc => orc.tipo === 'mensal' && orc.mes === mesAtual && orc.ano === anoAtual);
      
      if (orcMensal) {
        const receitas = Number(orcMensal.itens
          .filter(item => item.categoria === 'receita')
          .reduce((acc, item) => acc + calcularValorMensal(item.valorPlanejado, item.periodicidade), 0));
        const despesas = Number(orcMensal.itens
          .filter(item => item.categoria === 'despesa')
          .reduce((acc, item) => acc + calcularValorMensal(item.valorPlanejado, item.periodicidade), 0));
        setOrcamentoMes({ receitas, despesas, saldo: receitas - despesas });

        // Extrair contas a pagar com vencimento
        const hoje = new Date().getDate();
        const contas = orcMensal.itens
          .filter(item => item.categoria === 'despesa' && item.diaVencimento)
          .map(item => ({
            nome: item.contaNome,
            valor: Number(calcularValorMensal(item.valorPlanejado, item.periodicidade)),
            diaVencimento: item.diaVencimento!,
            vencido: item.diaVencimento! < hoje
          }))
          .sort((a, b) => a.diaVencimento - b.diaVencimento);
        setContasPagar(contas);
      }

      // Calcular gastos por categoria
      const gastosPorConta: { [key: string]: number } = {};
      lancamentosData.forEach(lanc => {
        lanc.partidas
          .filter(p => p.natureza === 'debito' && p.contaCodigo.startsWith('5.')) // Despesas começam com 5
          .forEach(p => {
            const categoria = p.contaNome.split(' - ')[0] || p.contaNome; // Pega primeira parte do nome
            gastosPorConta[categoria] = (gastosPorConta[categoria] || 0) + p.valor;
          });
      });

      const totalGastos = Object.values(gastosPorConta).reduce((acc, val) => acc + val, 0);
      const gastosArray = Object.entries(gastosPorConta)
        .map(([categoria, total]) => ({
          categoria,
          total,
          percentual: totalGastos > 0 ? (total / totalGastos) * 100 : 0
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5); // Top 5 categorias
      
      setGastosPorCategoria(gastosArray);

      // Comparar orçamento planejado vs realizado
      if (orcMensal) {
        const comparacao: { [key: string]: { planejado: number, realizado: number } } = {};
        
        // Pegar valores planejados
        orcMensal.itens
          .filter(item => item.categoria === 'despesa')
          .forEach(item => {
            const categoria = item.contaNome;
            comparacao[categoria] = {
              planejado: calcularValorMensal(item.valorPlanejado, item.periodicidade),
              realizado: 0
            };
          });

        // Pegar valores realizados
        lancamentosData.forEach(lanc => {
          lanc.partidas
            .filter(p => p.natureza === 'debito' && p.contaCodigo.startsWith('5.'))
            .forEach(p => {
              const categoria = p.contaNome;
              if (!comparacao[categoria]) {
                comparacao[categoria] = { planejado: 0, realizado: 0 };
              }
              comparacao[categoria].realizado += p.valor;
            });
        });

        const comparacaoArray = Object.entries(comparacao)
          .map(([categoria, valores]) => ({
            categoria,
            planejado: Number(valores.planejado),
            realizado: Number(valores.realizado),
            diferenca: Number(valores.planejado) - Number(valores.realizado),
            percentualGasto: valores.planejado > 0 ? (valores.realizado / valores.planejado) * 100 : 0
          }))
          .filter(item => item.planejado > 0 || item.realizado > 0)
          .sort((a, b) => b.realizado - a.realizado);
        
        setComparacaoOrcamento(comparacaoArray);
      }

      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setLoading(false);
    }
  };

  const getMesNome = () => {
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return meses[new Date().getMonth()];
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-0">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Saudação com Perfil */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Olá{perfil.nome ? `, ${perfil.nome.split(' ')[0]}` : ''}! 👋
            </h1>
            <p className="text-gray-600 text-sm mt-1">Resumo das suas finanças</p>
          </div>
          
          {/* Avatar do Perfil */}
          <button
            onClick={abrirModalPerfil}
            className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg hover:shadow-xl transition-shadow border-2 border-white overflow-hidden"
          >
            {perfil.foto ? (
              <img src={perfil.foto} alt="Perfil" className="w-full h-full object-cover" />
            ) : (
              getIniciais(perfil.nome)
            )}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Alertas */}
            {(naoClassificados > 0 || precisamRevisao > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {naoClassificados > 0 && (
                  <a href="/lancamentos" className="block p-4 bg-white rounded-lg shadow border-l-4 border-red-500 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-2xl font-bold text-red-600">{naoClassificados}</div>
                        <div className="text-sm text-gray-600 mt-1">Não classificados</div>
                        <div className="text-xs text-gray-500 mt-0.5">Débito e crédito desbalanceados</div>
                      </div>
                      <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                  </a>
                )}

                {precisamRevisao > 0 && (
                  <a href="/lancamentos" className="block p-4 bg-white rounded-lg shadow border-l-4 border-yellow-500 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-2xl font-bold text-yellow-600">{precisamRevisao}</div>
                        <div className="text-sm text-gray-600 mt-1">Precisam revisão</div>
                        <div className="text-xs text-gray-500 mt-0.5">Documento ou histórico incompleto</div>
                      </div>
                      <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                  </a>
                )}
              </div>
            )}

            {/* Planejado vs Realizado */}
            {comparacaoOrcamento.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <button 
                  onClick={() => toggleSecao('planejadoVsRealizado')}
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <h2 className="text-lg font-semibold text-gray-800">Planejado vs Realizado</h2>
                  <svg 
                    className={`w-5 h-5 text-gray-600 transition-transform ${secaoExpandida.planejadoVsRealizado ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {secaoExpandida.planejadoVsRealizado && (
                  <div className="px-6 pb-6">
                    <div className="space-y-4">
                  {comparacaoOrcamento.map((item, index) => {
                    const excedeu = item.percentualGasto > 100;
                    const proximo = item.percentualGasto > 80 && item.percentualGasto <= 100;
                    
                    return (
                      <div key={index} className={`p-4 rounded-lg border-2 ${
                        excedeu ? 'border-red-300 bg-red-50' : 
                        proximo ? 'border-yellow-300 bg-yellow-50' : 
                        'border-gray-200 bg-white'
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">{item.categoria}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              Planejado: R$ {item.planejado.toFixed(2)} • Gasto: R$ {item.realizado.toFixed(2)}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className={`text-lg font-bold ${
                              excedeu ? 'text-red-600' : 
                              proximo ? 'text-yellow-600' : 
                              'text-green-600'
                            }`}>
                              {item.percentualGasto.toFixed(0)}%
                            </div>
                            <div className={`text-xs ${item.diferenca >= 0 ? 'text-gray-600' : 'text-red-600'}`}>
                              {item.diferenca >= 0 ? 'Restam' : 'Excedeu'} R$ {Math.abs(item.diferenca).toFixed(2)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              excedeu ? 'bg-red-500' : 
                              proximo ? 'bg-yellow-500' : 
                              'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(item.percentualGasto, 100)}%` }}
                          />
                        </div>
                      </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-600">Total Planejado</div>
                      <div className="text-lg font-semibold text-gray-800">
                        R$ {comparacaoOrcamento.reduce((acc, item) => acc + item.planejado, 0).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Total Realizado</div>
                      <div className="text-lg font-semibold text-red-600">
                        R$ {comparacaoOrcamento.reduce((acc, item) => acc + item.realizado, 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
                )}
              </div>
            )}            {/* Resumo do Mês */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Orçamento de {getMesNome()}</h2>
              
              {orcamentoMes ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white rounded-lg border-l-4 border-green-500 shadow">
                    <div className="text-sm text-gray-600 mb-1">Receitas</div>
                    <div className="text-2xl font-semibold text-green-600">
                      R$ {orcamentoMes.receitas.toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white rounded-lg border-l-4 border-red-500 shadow">
                    <div className="text-sm text-gray-600 mb-1">Despesas</div>
                    <div className="text-2xl font-semibold text-red-600">
                      R$ {orcamentoMes.despesas.toFixed(2)}
                    </div>
                  </div>
                  
                  <div className={`p-4 bg-white rounded-lg border-l-4 ${orcamentoMes.saldo >= 0 ? 'border-blue-500' : 'border-orange-500'} shadow`}>
                    <div className="text-sm text-gray-600 mb-1">Saldo</div>
                    <div className={`text-2xl font-semibold ${orcamentoMes.saldo >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                      R$ {orcamentoMes.saldo.toFixed(2)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500 text-sm mb-3">Nenhum orçamento criado para este mês</p>
                  <a href="/planejamento" className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                    Criar Orçamento
                  </a>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-800">{lancamentos.length}</div>
                    <div className="text-xs text-gray-600">Lançamentos</div>
                  </div>
                </div>
              </div>

              <a href="/lancamentos" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">Novo</div>
                    <div className="text-xs text-gray-600">Lançamento</div>
                  </div>
                </div>
              </a>

              <a href="/planejamento" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">Ver</div>
                    <div className="text-xs text-gray-600">Orçamento</div>
                  </div>
                </div>
              </a>

              <a href="/plano-de-contas" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">Gerenciar</div>
                    <div className="text-xs text-gray-600">Contas</div>
                  </div>
                </div>
              </a>
            </div>

            {/* Gráfico de Gastos por Categoria */}
            {gastosPorCategoria.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <button 
                  onClick={() => toggleSecao('gastosPorCategoria')}
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <h2 className="text-lg font-semibold text-gray-800">Onde Você Está Gastando Mais</h2>
                  <svg 
                    className={`w-5 h-5 text-gray-600 transition-transform ${secaoExpandida.gastosPorCategoria ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {secaoExpandida.gastosPorCategoria && (
                  <div className="px-6 pb-6">
                    <div className="space-y-4">
                  {gastosPorCategoria.map((item, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{item.categoria}</span>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-gray-800">R$ {item.total.toFixed(2)}</span>
                          <span className="text-xs text-gray-500 ml-2">({item.percentual.toFixed(1)}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            index === 0 ? 'bg-red-500' :
                            index === 1 ? 'bg-orange-500' :
                            index === 2 ? 'bg-yellow-500' :
                            index === 3 ? 'bg-blue-500' :
                            'bg-purple-500'
                          }`}
                          style={{ width: `${item.percentual}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Total de Gastos</span>
                    <span className="text-lg font-bold text-red-600">
                      R$ {gastosPorCategoria.reduce((acc, item) => acc + item.total, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              )}
              </div>
            )}

            {/* Contas a Pagar do Mês */}
            {contasPagar.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <button 
                  onClick={() => toggleSecao('contasPagar')}
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <h2 className="text-lg font-semibold text-gray-800">Contas a Pagar - {getMesNome()}</h2>
                  <svg 
                    className={`w-5 h-5 text-gray-600 transition-transform ${secaoExpandida.contasPagar ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {secaoExpandida.contasPagar && (
                  <div className="px-6 pb-6">
                    <div className="space-y-2">
                  {contasPagar.map((conta, index) => (
                    <div key={index} className={`flex items-center justify-between p-3 border-2 rounded-lg ${
                      conta.vencido 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-200 bg-white'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                          conta.vencido 
                            ? 'bg-red-200 text-red-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {conta.diaVencimento}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-800">{conta.nome}</div>
                          <div className="text-xs text-gray-500">
                            Vencimento dia {conta.diaVencimento}
                            {conta.vencido && <span className="text-red-600 font-medium ml-1">• Vencido</span>}
                          </div>
                        </div>
                      </div>
                      <div className={`text-sm font-semibold ${conta.vencido ? 'text-red-600' : 'text-gray-800'}`}>
                        R$ {conta.valor.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              )}
              </div>
            )}

            {/* Últimos Lançamentos */}
            <div className="bg-white rounded-lg shadow">
              <button 
                onClick={() => toggleSecao('ultimosLancamentos')}
                className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <h2 className="text-lg font-semibold text-gray-800">Últimos Lançamentos</h2>
                <svg 
                  className={`w-5 h-5 text-gray-600 transition-transform ${secaoExpandida.ultimosLancamentos ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {secaoExpandida.ultimosLancamentos && (
                <div className="px-6 pb-6">
              {lancamentos.length > 0 ? (
                <div className="space-y-2">
                  {lancamentos.slice(0, 5).map(lanc => {
                    const totalDebito = lanc.partidas.filter(p => p.natureza === 'debito').reduce((acc, p) => acc + p.valor, 0);
                    const totalCredito = lanc.partidas.filter(p => p.natureza === 'credito').reduce((acc, p) => acc + p.valor, 0);
                    const balanceado = totalDebito === totalCredito && lanc.partidas.length > 0;
                    
                    return (
                      <div key={lanc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-gray-800 truncate">{lanc.historico}</div>
                            {!balanceado && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full flex-shrink-0">
                                Revisar
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {new Date(lanc.data).toLocaleDateString('pt-BR')}
                            {lanc.documento && ` • ${lanc.documento}`}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-gray-800 ml-4">
                          R$ {Math.max(totalDebito, totalCredito).toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Nenhum lançamento cadastrado
                </div>
              )}
              </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal de Perfil */}
      {modalPerfilAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Editar Perfil</h2>
              <button
                onClick={() => setModalPerfilAberto(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Preview do Avatar */}
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg overflow-hidden mb-3">
                  {fotoTemp ? (
                    <img src={fotoTemp} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    getIniciais(nomeTemp)
                  )}
                </div>
                <p className="text-xs text-gray-500">Preview do avatar</p>
              </div>

              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={nomeTemp}
                  onChange={(e) => setNomeTemp(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* URL da Foto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL da Foto (opcional)
                </label>
                <input
                  type="url"
                  value={fotoTemp}
                  onChange={(e) => setFotoTemp(e.target.value)}
                  placeholder="https://exemplo.com/foto.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Cole o link de uma foto sua. Se deixar vazio, mostrará suas iniciais.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setModalPerfilAberto(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={salvarPerfil}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botão Voltar ao Topo */}
      {mostrarBotaoTopo && (
        <button
          onClick={voltarAoTopo}
          className="fixed bottom-24 right-6 md:bottom-8 md:right-8 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all z-40 flex items-center justify-center group"
          aria-label="Voltar ao topo"
        >
          <svg className="w-6 h-6 transform group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}

      {/* Navigation Mobile - Bottom bar com ícones */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 [padding-bottom:max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex justify-around items-center h-16">
          <a href="/" className="flex flex-col items-center justify-center flex-1 h-full text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs mt-1">Home</span>
          </a>
          <a href="/plano-de-contas" className="flex flex-col items-center justify-center flex-1 h-full text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span className="text-xs mt-1">Contas</span>
          </a>
          <a href="/planejamento" className="flex flex-col items-center justify-center flex-1 h-full text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-xs mt-1">Planejar</span>
          </a>
          <a href="/lancamentos" className="flex flex-col items-center justify-center flex-1 h-full text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-xs mt-1">Lançar</span>
          </a>
          <a href="/configuracoes" className="flex flex-col items-center justify-center flex-1 h-full text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs mt-1">Config</span>
          </a>
        </div>
      </nav>
    </div>
  );
}
