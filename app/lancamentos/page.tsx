'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import FilterBar from '@/components/FilterBar';
import { useScrollCompact } from '@/lib/hooks/useScrollCompact';
import { getLancamentos, createLancamento, deleteLancamento, getContas, getConfiguracoes, importLancamentos, type Lancamento as LancamentoAPI, type ContaBancaria as ContaBancariaAPI, type AutoPatternConfig } from '@/lib/api';
import { obterInformacoesPadrao, obterCorPadrao, type TipoOperacao } from '@/lib/padroes-contabeis';

type ModoPartidas = 'umUm' | 'debitoParaCreditos' | 'creditosParaDebito';

// Interfaces
interface Partida {
  id: string;
  contaCodigo: string;
  contaNome: string;
  natureza: 'debito' | 'credito';
  valor: number;
}

interface Lancamento {
  id: string;
  data: string; // ISO date string (YYYY-MM-DD)
  documento?: string;
  historico: string;
  partidas: Partida[];
  criadoEm: string;
  atualizadoEm?: string;
}

// Usar o tipo importado da API
type ContaBancaria = ContaBancariaAPI;

// Modal de Lançamento
interface ContaAnalitica {
  codigo: string;
  nome: string;
  categoria: string;
}

interface ModalLancamentoProps {
  isOpen: boolean;
  onClose: () => void;
  onSalvar: (lancamento: Lancamento) => void;
  contasAnaliticas: ContaAnalitica[];
  lancamentoEmEdicao?: Lancamento | null;
  autoPatterns?: AutoPatternConfig[];
}

function ModalLancamento({ isOpen, onClose, onSalvar, contasAnaliticas, lancamentoEmEdicao, autoPatterns = [] }: ModalLancamentoProps) {
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [documento, setDocumento] = useState('');
  const [historico, setHistorico] = useState('');
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [modoPartidas, setModoPartidas] = useState<ModoPartidas>('umUm');
  const [erro, setErro] = useState('');

  // Verifica se uma máscara bate com um código de conta
  const casaMascara = (mascara: string, codigo: string): boolean => {
    if (!mascara) return false;
    if (mascara.endsWith('*')) {
      const prefixo = mascara.slice(0, -1);
      return codigo.startsWith(prefixo);
    }
    return codigo === mascara || codigo.startsWith(`${mascara}.`);
  };

  // Verifica se uma conta está bloqueada por padrão
  const isContaBloqueada = (codigo: string): boolean => {
    return autoPatterns.some(p => p.bloquearSelecao && (
      casaMascara(p.mascaraDebito, codigo) || casaMascara(p.mascaraCredito, codigo)
    ));
  };

  const criarPartidasIniciais = (modo: ModoPartidas): Partida[] => {
    if (modo === 'umUm') {
      return [
        { id: `${Date.now()}-d`, contaCodigo: '', contaNome: '', natureza: 'debito', valor: 0 },
        { id: `${Date.now()}-c`, contaCodigo: '', contaNome: '', natureza: 'credito', valor: 0 },
      ];
    }

    if (modo === 'debitoParaCreditos') {
      return [
        { id: `${Date.now()}-d`, contaCodigo: '', contaNome: '', natureza: 'debito', valor: 0 },
        { id: `${Date.now()}-c1`, contaCodigo: '', contaNome: '', natureza: 'credito', valor: 0 },
      ];
    }

    return [
      { id: `${Date.now()}-c`, contaCodigo: '', contaNome: '', natureza: 'credito', valor: 0 },
      { id: `${Date.now()}-d1`, contaCodigo: '', contaNome: '', natureza: 'debito', valor: 0 },
    ];
  };

  const isMultiCredito = modoPartidas === 'debitoParaCreditos';
  const isMultiDebito = modoPartidas === 'creditosParaDebito';
  const isUmUm = modoPartidas === 'umUm';
  const multiSide = isMultiCredito ? 'credito' : isMultiDebito ? 'debito' : null;
  const valorUmUm = isUmUm ? (partidas[0]?.valor || 0) : 0;

  const atualizarValorUmUm = (valor: number) => {
    if (!isUmUm) return;
    setPartidas(partidas.map(p => ({ ...p, valor })));
  };

  // Resetar ao abrir
  useEffect(() => {
    if (isOpen) {
      if (lancamentoEmEdicao) {
        // Editar: carregar dados existentes
        setData(lancamentoEmEdicao.data);
        setDocumento(lancamentoEmEdicao.documento || '');
        setHistorico(lancamentoEmEdicao.historico);
        setPartidas(lancamentoEmEdicao.partidas);
        setModoPartidas('umUm'); // Para edição, mantém modo 1:1 por enquanto
      } else {
        // Criar novo: resetar valores
        setData(new Date().toISOString().split('T')[0]);
        setDocumento('');
        setHistorico('');
        setPartidas(criarPartidasIniciais(modoPartidas));
      }
      setErro('');
    }
  }, [isOpen, modoPartidas, lancamentoEmEdicao]);

  const calcularTotais = () => {
    const debitos = partidas.filter(p => p.natureza === 'debito').reduce((sum, p) => sum + p.valor, 0);
    const creditos = partidas.filter(p => p.natureza === 'credito').reduce((sum, p) => sum + p.valor, 0);
    return { debitos, creditos, diferenca: debitos - creditos };
  };

  const adicionarPartida = (natureza: 'debito' | 'credito') => {
    if (multiSide && natureza !== multiSide) return;

    setPartidas([...partidas, {
      id: Date.now().toString(),
      contaCodigo: '',
      contaNome: '',
      natureza,
      valor: 0
    }]);
  };

  const removerPartida = (id: string) => {
    setPartidas(partidas.filter(p => p.id !== id));
  };

  const atualizarPartida = (id: string, campo: keyof Partida, valor: any) => {
    setPartidas(partidas.map(p => p.id === id ? { ...p, [campo]: valor } : p));
  };

  const selecionarConta = (id: string, entrada: string) => {
    if (!entrada.trim()) {
      atualizarPartida(id, 'contaCodigo', '');
      atualizarPartida(id, 'contaNome', '');
      return;
    }

    const entradaNormalizada = entrada.trim();

    // Primeiro tenta extrair o código se vier no formato "codigo - nome"
    let contaEncontrada = null;
    
    // Se tem " - " no texto, extrai o código
    if (entradaNormalizada.includes(' - ')) {
      const partes = entradaNormalizada.split(' - ');
      const codigo = partes[0].trim();
      contaEncontrada = contasAnaliticas.find(c => c.codigo === codigo);
      console.log('Buscando por formato "codigo - nome":', codigo, contaEncontrada);
    }
    
    // Se não encontrou, busca normalmente (por código ou nome)
    if (!contaEncontrada) {
      const entradaLower = entradaNormalizada.toLowerCase();
      
      // Busca exata por código
      contaEncontrada = contasAnaliticas.find(c => c.codigo.toLowerCase() === entradaLower);
      console.log('Buscando por código exato:', entradaLower, contaEncontrada);
      
      // Se não encontrou, busca exata por nome
      if (!contaEncontrada) {
        contaEncontrada = contasAnaliticas.find(c => c.nome.toLowerCase() === entradaLower);
        console.log('Buscando por nome exato:', entradaLower, contaEncontrada);
      }
      
      // Se não encontrou, busca parcial
      if (!contaEncontrada) {
        contaEncontrada = contasAnaliticas.find((c) => {
          const codigoNome = `${c.codigo} - ${c.nome}`.toLowerCase();
          const startsWithMatch = codigoNome.startsWith(entradaLower);
          const nomeIncludesMatch = c.nome.toLowerCase().includes(entradaLower);
          const codigoIncludesMatch = c.codigo.toLowerCase().includes(entradaLower);
          
          return startsWithMatch || nomeIncludesMatch || codigoIncludesMatch;
        });
        console.log('Buscando por parcial match:', entradaLower, contaEncontrada);
      }
    }

    if (contaEncontrada) {
      if (isContaBloqueada(contaEncontrada.codigo)) {
        setErro('Esta conta está bloqueada por configuração');
        return;
      }

      // Usar setState para garantir atualização
      setPartidas(prev => prev.map(p => 
        p.id === id 
          ? { ...p, contaCodigo: contaEncontrada.codigo, contaNome: contaEncontrada.nome }
          : p
      ));
    } else {
      // Se não encontrou, limpa os campos
      console.log('❌ Conta não encontrada para:', entrada);
      setPartidas(prev => prev.map(p => 
        p.id === id 
          ? { ...p, contaCodigo: '', contaNome: '' }
          : p
      ));
    }
  };

  const handleSalvar = () => {
    setErro('');

    if (!data) {
      setErro('Data é obrigatória');
      return;
    }

    if (!historico.trim()) {
      setErro('Histórico é obrigatório');
      return;
    }

    if (partidas.length < 2) {
      setErro('É necessário ao menos 2 partidas (débito e crédito)');
      return;
    }

    const totalDebitos = partidas.filter(p => p.natureza === 'debito').length;
    const totalCreditos = partidas.filter(p => p.natureza === 'credito').length;

    if (modoPartidas === 'umUm' && (totalDebitos !== 1 || totalCreditos !== 1)) {
      setErro('Modo 1:1 requer exatamente 1 débito e 1 crédito');
      return;
    }

    if (modoPartidas === 'debitoParaCreditos') {
      if (totalDebitos !== 1 || totalCreditos < 1) {
        setErro('Modo 1 débito → vários créditos requer 1 débito e ao menos 1 crédito');
        return;
      }
    }

    if (modoPartidas === 'creditosParaDebito') {
      if (totalCreditos !== 1 || totalDebitos < 1) {
        setErro('Modo vários débitos → 1 crédito requer 1 crédito e ao menos 1 débito');
        return;
      }
    }

    // Validar cada partida
    for (const partida of partidas) {
      if (!partida.contaCodigo || !partida.contaNome) {
        console.log('Partida inválida:', partida);
        setErro(`Selecione uma conta válida para ${partida.natureza === 'debito' ? 'o débito' : 'o crédito'}`);
        return;
      }
      const contaValida = contasAnaliticas.find(c => c.codigo === partida.contaCodigo);
      if (!contaValida) {
        setErro(`A conta "${partida.contaCodigo}" não é uma conta analítica válida`);
        return;
      }
      if (partida.valor <= 0) {
        setErro('Todas as partidas devem ter valor maior que zero');
        return;
      }
    }

    // Validar débitos = créditos
    const { debitos, creditos } = calcularTotais();
    if (Math.abs(debitos - creditos) > 0.01) {
      setErro(`Lançamento não está balanceado. Débitos: R$ ${debitos.toFixed(2)} / Créditos: R$ ${creditos.toFixed(2)}`);
      return;
    }

    const novoLancamento: Lancamento = {
      id: lancamentoEmEdicao?.id || Date.now().toString(),
      data,
      documento,
      historico,
      partidas,
      criadoEm: lancamentoEmEdicao?.criadoEm || new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    };

    onSalvar(novoLancamento);
  };

  if (!isOpen) return null;

  const totais = calcularTotais();
  const isBalanceado = Math.abs(totais.diferenca) < 0.01;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full my-auto max-h-[75vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <h3 className="text-xl font-semibold text-gray-800">
            {lancamentoEmEdicao ? 'Editar Lançamento Contábil' : 'Novo Lançamento Contábil'}
          </h3>
          <p className="text-sm text-gray-600 mt-1">Registro de partidas dobradas</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Informações básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data *
              </label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Documento (opcional)
              </label>
              <input
                type="text"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                placeholder="Ex: 001, NF-123, etc"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Histórico *
            </label>
            <textarea
              value={historico}
              onChange={(e) => setHistorico(e.target.value)}
              placeholder="Descrição do lançamento"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {/* Partidas */}
          <div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
              <div className="flex items-center gap-3">
                <label className="block text-sm font-medium text-gray-700">
                  Partidas *
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setModoPartidas('umUm')}
                    className={`px-3 py-1 text-xs rounded-full border ${modoPartidas === 'umUm' ? 'bg-blue-50 border-blue-400 text-blue-700' : 'border-gray-300 text-gray-600'}`}
                  >
                    1 débito ↔ 1 crédito
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoPartidas('debitoParaCreditos')}
                    className={`px-3 py-1 text-xs rounded-full border ${modoPartidas === 'debitoParaCreditos' ? 'bg-blue-50 border-blue-400 text-blue-700' : 'border-gray-300 text-gray-600'}`}
                  >
                    1 débito → vários créditos
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoPartidas('creditosParaDebito')}
                    className={`px-3 py-1 text-xs rounded-full border ${modoPartidas === 'creditosParaDebito' ? 'bg-blue-50 border-blue-400 text-blue-700' : 'border-gray-300 text-gray-600'}`}
                  >
                    vários débitos → 1 crédito
                  </button>
                </div>
              </div>

              {multiSide && (
                <button
                  type="button"
                  onClick={() => adicionarPartida(multiSide)}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Adicionar {multiSide === 'credito' ? 'crédito' : 'débito'}
                </button>
              )}
            </div>

            <div className="space-y-3">
              {!isUmUm ? (
                <>
              {partidas.map((partida, index) => (
                <div key={partida.id} className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                    <div className="md:col-span-2 space-y-1">
                      <input
                        type="text"
                        value={partida.contaNome ? `${partida.contaCodigo} - ${partida.contaNome}` : (partida.contaCodigo || '')}
                        onChange={(e) => selecionarConta(partida.id, e.target.value)}
                        onBlur={(e) => selecionarConta(partida.id, e.target.value)}
                        placeholder="Digite o código ou nome da conta"
                        list="contas-analiticas"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
                      />
                      {partida.contaCodigo && !partida.contaNome && (
                        <p className="text-xs text-red-500">Conta não encontrada. Selecione uma conta válida.</p>
                      )}
                      {!partida.contaCodigo && (
                        <p className="text-xs text-gray-500">Somente contas analíticas ativas do plano de contas</p>
                      )}
                    </div>

                    <div className="flex items-center">
                      <span className={`px-3 py-2 text-xs font-semibold rounded-lg ${partida.natureza === 'debito' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {partida.natureza === 'debito' ? 'Débito' : 'Crédito'}
                      </span>
                    </div>

                    <div>
                      <input
                        type="number"
                        value={partida.valor || ''}
                        onChange={(e) => atualizarPartida(partida.id, 'valor', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400 text-right"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removerPartida(partida.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
                </>
              ) : (
                <div className="bg-white p-4 rounded-lg border border-gray-300 space-y-3">
                  {partidas.map((partida, idx) => (
                    <div key={partida.id} className="pb-3 border-b last:border-b-0 last:pb-0">
                      <p className="text-xs text-gray-600 font-medium mb-2">{partida.natureza === 'debito' ? 'Débito' : 'Crédito'}:</p>
                      <input
                        type="text"
                        value={partida.contaNome ? `${partida.contaCodigo} - ${partida.contaNome}` : (partida.contaCodigo || '')}
                        onChange={(e) => selecionarConta(partida.id, e.target.value)}
                        placeholder="Digite o código ou nome da conta"
                        list="contas-analiticas"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
                      />
                      {partida.contaCodigo && !partida.contaNome && (
                        <p className="text-xs text-red-500 mt-1">Conta não encontrada. Selecione uma conta válida.</p>
                      )}
                    </div>
                  ))}
                  <div className="pt-3 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Valor *</label>
                    <input
                      type="number"
                      value={valorUmUm || ''}
                      onChange={(e) => atualizarValorUmUm(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400 text-right font-semibold text-lg"
                    />
                  </div>
                </div>
              )}

              {/* Sugestões de contas (compartilhadas) */}
              <datalist id="contas-analiticas">
                {contasAnaliticas
                  .filter((conta) => !isContaBloqueada(conta.codigo))
                  .map((conta) => (
                    <option key={conta.codigo} value={`${conta.codigo} - ${conta.nome}`} />
                  ))}
              </datalist>

              {partidas.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Clique em "Adicionar Partida" para começar
                </div>
              )}
            </div>
          </div>

          {/* Totais */}
          {partidas.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-gray-600">Total Débitos:</span>
                <span className="font-semibold text-gray-800">R$ {totais.debitos.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-gray-600">Total Créditos:</span>
                <span className="font-semibold text-gray-800">R$ {totais.creditos.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200">
                <span className="text-gray-600">Diferença:</span>
                <span className={`font-semibold ${isBalanceado ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {Math.abs(totais.diferenca).toFixed(2)}
                  {isBalanceado && ' ✓'}
                </span>
              </div>
            </div>
          )}

          {/* Mensagem de erro */}
          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {erro}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Salvar Lançamento
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Lancamentos() {
  const [mounted, setMounted] = useState(false);
  const modoCompacto = useScrollCompact(150);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [lancamentoEmEdicao, setLancamentoEmEdicao] = useState<Lancamento | null>(null);
  const [lancamentoExpandido, setLancamentoExpandido] = useState<string | null>(null);
  const [contasAnaliticas, setContasAnaliticas] = useState<{ codigo: string; nome: string; categoria: string }[]>([]);
  const [autoPatterns, setAutoPatterns] = useState<AutoPatternConfig[]>([]);
  const [importModalAberto, setImportModalAberto] = useState(false);
  const [importContaBanco, setImportContaBanco] = useState('');
  const [importContaReceita, setImportContaReceita] = useState('');
  const [importContaDespesa, setImportContaDespesa] = useState('');
  const [importPreview, setImportPreview] = useState<Array<{ 
    data: string; 
    historico: string; 
    valor: number; 
    tipo: 'entrada' | 'saida';
    contaSugerida?: string;
    contaSugeridaNome?: string;
    confianca?: number;
    razaoSugestao?: string;
  }>>([]);
  const [importErro, setImportErro] = useState('');
  const [importResumo, setImportResumo] = useState<{ sucesso: number; erros: number }>({ sucesso: 0, erros: 0 });
  const [importCarregando, setImportCarregando] = useState(false);
  
  // Estados dos filtros
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'classificados' | 'nao-classificados' | 'precisam-revisao'>('todos');
  const [filtroConta, setFiltroConta] = useState('');
  const [filtroValorMin, setFiltroValorMin] = useState('');
  const [filtroValorMax, setFiltroValorMax] = useState('');
  const [filtroPadrao, setFiltroPadrao] = useState<TipoOperacao | 'todos'>('todos');
  const [ordenacao, setOrdenacao] = useState<'data-desc' | 'data-asc' | 'valor-desc' | 'valor-asc'>('data-desc');
  const [filtrosVisiveis, setFiltrosVisiveis] = useState(false);

  // Função auxiliar para obter categoria da conta
  const obterCategoriaConta = (contaCodigo: string): string => {
    // Primeiro tenta buscar do cache de contas analíticas
    const conta = contasAnaliticas.find(c => c.codigo === contaCodigo);
    if (conta?.categoria) return conta.categoria.toLowerCase().trim();

    // Fallback: infere categoria pelo primeiro dígito do código
    // 1.x.x = Ativo, 2.x.x = Passivo, 3.x.x = Patrimônio, 4.x.x = Receita, 5.x.x = Despesa
    const primeiroDigito = contaCodigo.charAt(0);
    const categoriaMap: Record<string, string> = {
      '1': 'ativo',
      '2': 'passivo',
      '3': 'patrimonio',
      '4': 'receita',
      '5': 'despesa'
    };
    return categoriaMap[primeiroDigito] || '';
  };

  const obterNomeConta = (contaCodigo: string): string => {
    return contasAnaliticas.find(c => c.codigo === contaCodigo)?.nome || contaCodigo;
  };

  // Verifica se um código casa com a máscara (suporta prefixo com *)
  const casaMascara = (mascara: string, codigo: string) => {
    if (!mascara) return false;
    if (mascara.endsWith('*')) {
      const prefixo = mascara.slice(0, -1);
      return codigo.startsWith(prefixo);
    }
    return codigo === mascara || codigo.startsWith(`${mascara}.`);
  };

  // Conta bloqueada por configuração
  const isContaBloqueada = (codigo: string) => {
    return autoPatterns.some(p => p.bloquearSelecao && (
      casaMascara(p.mascaraDebito, codigo) || casaMascara(p.mascaraCredito, codigo)
    ));
  };

  // Importação de extrato bancário
  const normalizarData = (valor: string): string => {
    if (!valor) return '';
    const trimmed = valor.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      const [d, m, a] = trimmed.split('/');
      return `${a}-${m}-${d}`;
    }
    return '';
  };

  const parseValor = (valorRaw: string): number => {
    if (!valorRaw) return 0;
    const normalizado = valorRaw.replace(/\./g, '').replace(',', '.').trim();
    const num = Number(normalizado);
    return Number.isFinite(num) ? num : 0;
  };

  const detectarTipo = (token: string, valor: number): 'entrada' | 'saida' => {
    const t = (token || '').toLowerCase();
    if (t.startsWith('s') || t.startsWith('d') || t === '-') return 'saida';
    if (t.startsWith('e') || t.startsWith('c') || t === '+') return 'entrada';
    return valor < 0 ? 'saida' : 'entrada';
  };

  const parseExtratoCSV = (texto: string) => {
    const linhas = texto.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (linhas.length === 0) return [] as Array<{ data: string; historico: string; valor: number; tipo: 'entrada' | 'saida' }>;

    const delim = texto.includes(';') ? ';' : ',';
    const registros: Array<{ data: string; historico: string; valor: number; tipo: 'entrada' | 'saida' }> = [];

    linhas.forEach((linha, idx) => {
      const cols = linha.split(delim).map(c => c.trim());
      const possivelCabecalho = cols.some(c => /data|descricao|historico|valor|tipo/i.test(c));
      if (idx === 0 && possivelCabecalho) return;

      const [colData, colHistorico, colValor, colTipo] = cols;
      const data = normalizarData(colData);
      const valor = parseValor(colValor);
      const tipo = detectarTipo(colTipo, valor);

      if (!data || !colHistorico || !Number.isFinite(valor)) {
        return;
      }

      registros.push({
        data,
        historico: colHistorico || 'Movimentação bancária',
        valor: Math.abs(valor),
        tipo
      });
    });

    return registros;
  };

  const processarArquivoImportacao = async (file: File) => {
    setImportErro('');
    const reader = new FileReader();
    reader.onload = async (e) => {
      const texto = (e.target?.result as string) || '';
      try {
        const registros = parseExtratoCSV(texto);
        
        // Busca configuração do banco selecionado para aplicar regras
        const config = await getConfiguracoes();
        const bancoConta = config.contasBancarias?.find(b => b.contaCodigo === importContaBanco);
        
        // Aplica classificação automática e sugestões de IA
        const registrosComSugestoes = registros.map(reg => {
          // 1. Tenta classificação por regras
          const classificacaoRegra = classificarTransacaoAutomatica(reg.historico, reg.tipo, bancoConta);
          
          if (classificacaoRegra) {
            const conta = contasAnaliticas.find(c => c.codigo === classificacaoRegra.conta);
            return {
              ...reg,
              contaSugerida: classificacaoRegra.conta,
              contaSugeridaNome: conta?.nome || classificacaoRegra.conta,
              confianca: classificacaoRegra.confianca,
              razaoSugestao: 'Regra configurada'
            };
          }
          
          // 2. Tenta sugestão por IA (histórico)
          const sugestaoIA = gerarSugestaoIA(reg.historico, reg.valor, reg.tipo, lancamentos);
          
          if (sugestaoIA) {
            return {
              ...reg,
              contaSugerida: sugestaoIA.contaSugerida,
              contaSugeridaNome: sugestaoIA.contaNomeSugerida,
              confianca: sugestaoIA.confianca,
              razaoSugestao: sugestaoIA.razao
            };
          }
          
          // 3. Usa conta padrão como fallback
          const contaPadrao = reg.tipo === 'entrada' 
            ? bancoConta?.contaPadraoReceita || importContaReceita
            : bancoConta?.contaPadraoDespesa || importContaDespesa;
          
          if (contaPadrao) {
            const conta = contasAnaliticas.find(c => c.codigo === contaPadrao);
            return {
              ...reg,
              contaSugerida: contaPadrao,
              contaSugeridaNome: conta?.nome || contaPadrao,
              confianca: 50,
              razaoSugestao: 'Conta padrão do banco'
            };
          }
          
          return reg;
        });
        
        setImportPreview(registrosComSugestoes);
        setImportResumo({ sucesso: registrosComSugestoes.length, erros: registrosComSugestoes.length === 0 ? 1 : 0 });
      } catch (err) {
        console.error(err);
        setImportErro('Falha ao ler o arquivo. Verifique se é CSV com colunas: data, descrição, valor, tipo(opcional)');
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  // Função para identificar o padrão do lançamento
  const identificarPadraoLancamento = (lancamento: Lancamento): { tipo: TipoOperacao; emoji: string; nome: string; cor: string } => {
    const partidaDebito = lancamento.partidas.find(p => p.natureza === 'debito');
    const partidaCredito = lancamento.partidas.find(p => p.natureza === 'credito');

    if (!partidaDebito || !partidaCredito) {
      return {
        tipo: 'desconhecido',
        emoji: '❓',
        nome: 'Indefinido',
        cor: 'bg-slate-100 text-slate-600 border-slate-200'
      };
    }

    // 1) Tenta casar com padrões configurados pelo usuário
    const padraoConfig = autoPatterns.find(p =>
      casaMascara(p.mascaraDebito, partidaDebito.contaCodigo) &&
      casaMascara(p.mascaraCredito, partidaCredito.contaCodigo)
    );
    if (padraoConfig) {
      const padrao = obterInformacoesPadrao(padraoConfig.tipo as TipoOperacao);
      const cor = obterCorPadrao(padraoConfig.tipo as TipoOperacao);
      return {
        tipo: padraoConfig.tipo as TipoOperacao,
        emoji: padraoConfig.emojiOperacao || padrao.emoji,
        nome: padraoConfig.nomeOperacao || padrao.nome,
        cor,
      };
    }

    // Sem padrão configurado, retorna marcador neutro
    return {
      tipo: 'desconhecido',
      emoji: '❓',
      nome: 'Sem padrão configurado',
      cor: 'bg-slate-100 text-slate-600 border-slate-200'
    };
  };

  // Função para classificar transação automaticamente baseado em regras
  const classificarTransacaoAutomatica = (
    historico: string,
    tipo: 'entrada' | 'saida',
    contaBancaria?: import('@/lib/api').ContaBancariaImportacao
  ): { conta: string; confianca: number; regra?: string } | null => {
    if (!contaBancaria?.regrasClassificacao) return null;

    const historicoNorm = historico.toLowerCase().trim();
    
    // Filtra regras ativas do tipo correto, ordenadas por prioridade
    const regrasAplicaveis = contaBancaria.regrasClassificacao
      .filter(r => r.ativo && r.tipo === tipo)
      .sort((a, b) => (a.prioridade || 99) - (b.prioridade || 99));

    for (const regra of regrasAplicaveis) {
      for (const palavra of regra.palavrasChave) {
        if (historicoNorm.includes(palavra.toLowerCase())) {
          return {
            conta: regra.contaDestino,
            confianca: 95, // Alta confiança em regras configuradas
            regra: regra.id
          };
        }
      }
    }

    return null;
  };

  // Função para gerar sugestão baseada em IA (análise de histórico)
  const gerarSugestaoIA = (
    historico: string,
    valor: number,
    tipo: 'entrada' | 'saida',
    lancamentosHistorico: Lancamento[]
  ): import('@/lib/api').SugestaoIA | null => {
    const historicoNorm = historico.toLowerCase().trim();
    
    // Busca lançamentos similares (mesma descrição ou palavras-chave)
    const palavrasChave = historicoNorm
      .split(/\s+/)
      .filter(p => p.length > 3); // Ignora palavras muito curtas
    
    const lancamentosSimilares = lancamentosHistorico.filter(lanc => {
      const lancHistNorm = lanc.historico.toLowerCase();
      const valorProximo = Math.abs(lanc.partidas[0].valor - valor) < valor * 0.3; // 30% de tolerância
      
      // Verifica se tem palavras em comum
      const temPalavraComum = palavrasChave.some(p => lancHistNorm.includes(p));
      
      return temPalavraComum && valorProximo;
    });

    if (lancamentosSimilares.length === 0) return null;

    // Conta frequência de cada conta usada
    const frequenciasContas = new Map<string, { count: number; nome: string; ids: string[] }>();
    
    lancamentosSimilares.forEach(lanc => {
      // Para saídas, pega conta de débito; para entradas, conta de crédito
      const partida = tipo === 'saida' 
        ? lanc.partidas.find(p => p.natureza === 'debito' && p.contaCodigo.startsWith('5.'))
        : lanc.partidas.find(p => p.natureza === 'credito' && p.contaCodigo.startsWith('4.'));
      
      if (partida) {
        const atual = frequenciasContas.get(partida.contaCodigo) || { count: 0, nome: partida.contaNome, ids: [] };
        frequenciasContas.set(partida.contaCodigo, {
          count: atual.count + 1,
          nome: partida.contaNome,
          ids: [...atual.ids, lanc.id]
        });
      }
    });

    if (frequenciasContas.size === 0) return null;

    // Pega a conta mais frequente
    const [contaMaisFrequente, dados] = Array.from(frequenciasContas.entries())
      .sort((a, b) => b[1].count - a[1].count)[0];

    const confianca = Math.min(95, Math.round((dados.count / lancamentosSimilares.length) * 100));

    return {
      transacaoId: '', // Será preenchido pelo caller
      historico,
      contaSugerida: contaMaisFrequente,
      contaNomeSugerida: dados.nome,
      confianca,
      razao: `Baseado em ${dados.count} lançamento(s) similar(es)`,
      baseadoEm: dados.ids.slice(0, 3) // Máximo 3 referências
    };
  };

  // Função para extrair contas analíticas do plano de contas hierárquico
  const extrairContasAnaliticas = (contas: ContaBancaria[]): { codigo: string; nome: string; categoria: string }[] => {
    const resultado: { codigo: string; nome: string; categoria: string }[] = [];
    
    const percorrer = (conta: ContaBancaria) => {
      // Conta analítica é aquela que não tem subcontas ou tem array vazio
      if (!conta.subcontas || conta.subcontas.length === 0) {
        if (conta.ativa) {
          resultado.push({
            codigo: conta.codigo,
            nome: conta.nome,
            categoria: conta.categoria?.toLowerCase() || 'outro'
          });
        }
      } else {
        // Continua percorrendo subcontas
        conta.subcontas.forEach(subconta => percorrer(subconta));
      }
    };
    
    contas.forEach(conta => percorrer(conta));
    return resultado;
  };

  // Carregar contas analíticas do plano de contas
  useEffect(() => {
    const carregarContas = async () => {
      try {
        const todasContas = await getContas();
        const analiticas = extrairContasAnaliticas(todasContas);
        setContasAnaliticas(analiticas);

        // Sugestões de conta padrão para importação
        const primeiraAtivo = analiticas.find(c => c.codigo.startsWith('1.'));
        const primeiraReceita = analiticas.find(c => c.codigo.startsWith('4.'));
        const primeiraDespesa = analiticas.find(c => c.codigo.startsWith('5.'));

        if (!importContaBanco && primeiraAtivo) setImportContaBanco(primeiraAtivo.codigo);
        if (!importContaReceita && primeiraReceita) setImportContaReceita(primeiraReceita.codigo);
        if (!importContaDespesa && primeiraDespesa) setImportContaDespesa(primeiraDespesa.codigo);
      } catch (error) {
        console.error('Erro ao carregar contas:', error);
      }
    };

    carregarContas();
  }, []);

  useEffect(() => {
    const carregarLancamentos = async () => {
      try {
        const lancamentosAPI = await getLancamentos();
        setLancamentos(lancamentosAPI);
        setMounted(true);
      } catch (error) {
        console.error('Erro ao carregar lançamentos:', error);
        setMounted(true);
      }
    };
    carregarLancamentos();
  }, []);

  useEffect(() => {
    const carregarConfigPadroes = async () => {
      try {
        const config = await getConfiguracoes();
        setAutoPatterns(config.autoPatterns || []);

        // Usa conta bancária padrão configurada para importação
        const contaPadrao = config.contasBancarias?.find(c => c.padrao && c.ativa);
        if (contaPadrao && !importContaBanco) {
          setImportContaBanco(contaPadrao.contaCodigo);
        }
      } catch (error) {
        console.error('Erro ao carregar padrões automáticos:', error);
      }
    };

    carregarConfigPadroes();
  }, [importContaBanco]);

  const handleExcluirLancamento = async (id: string) => {
    if (!confirm('Deseja realmente excluir este lançamento?')) return;

    try {
      await deleteLancamento(id);
      setLancamentos(lancamentos.filter(l => l.id !== id));
    } catch (error) {
      console.error('Erro ao excluir lançamento:', error);
      alert('Erro ao excluir lançamento. Tente novamente.');
    }
  };

  const handleImportarLancamentos = async () => {
    setImportErro('');

    if (!importContaBanco || !importContaReceita || !importContaDespesa) {
      setImportErro('Selecione as contas de banco, receita e despesa');
      return;
    }

    if (importPreview.length === 0) {
      setImportErro('Envie um arquivo CSV com colunas: data, descrição, valor, tipo (opcional)');
      return;
    }

    setImportCarregando(true);
    try {
      const agora = Date.now();
      const isoAgora = new Date().toISOString();
      const contaBancoNome = obterNomeConta(importContaBanco);
      const contaReceitaNome = obterNomeConta(importContaReceita);
      const contaDespesaNome = obterNomeConta(importContaDespesa);

      const novosLancamentos = importPreview.map((reg, idx) => {
        const ehEntrada = reg.tipo === 'entrada';
        const valor = Math.abs(reg.valor);
        
        // Usa conta sugerida se disponível e com alta confiança, senão usa padrão
        let contaClassificacao = ehEntrada ? importContaReceita : importContaDespesa;
        let contaClassificacaoNome = ehEntrada ? contaReceitaNome : contaDespesaNome;
        
        if (reg.contaSugerida && (reg.confianca || 0) >= 70) {
          contaClassificacao = reg.contaSugerida;
          contaClassificacaoNome = reg.contaSugeridaNome || obterNomeConta(reg.contaSugerida);
        }
        
        const debitoConta = ehEntrada ? importContaBanco : contaClassificacao;
        const creditoConta = ehEntrada ? contaClassificacao : importContaBanco;
        const debitoNome = ehEntrada ? contaBancoNome : contaClassificacaoNome;
        const creditoNome = ehEntrada ? contaClassificacaoNome : contaBancoNome;

        return {
          id: `${agora}-${idx}`,
          data: reg.data,
          documento: undefined,
          historico: reg.historico,
          partidas: [
            {
              id: `${agora}-${idx}-d`,
              contaCodigo: debitoConta,
              contaNome: debitoNome,
              natureza: 'debito' as const,
              valor
            },
            {
              id: `${agora}-${idx}-c`,
              contaCodigo: creditoConta,
              contaNome: creditoNome,
              natureza: 'credito' as const,
              valor
            }
          ],
          criadoEm: isoAgora,
          atualizadoEm: isoAgora
        } as Lancamento;
      });

      const payload = novosLancamentos.map(({ id, ...rest }) => rest);
      await importLancamentos(payload as Omit<Lancamento, 'id'>[]);

      setLancamentos(prev => [...prev, ...novosLancamentos]);
      setImportResumo({ sucesso: novosLancamentos.length, erros: 0 });
      setImportModalAberto(false);
      setImportPreview([]);
    } catch (error) {
      console.error('Erro ao importar lançamentos:', error);
      setImportErro('Erro ao importar. Verifique o arquivo e tente novamente.');
    } finally {
      setImportCarregando(false);
    }
  };

  const handleEditarLancamento = (id: string) => {
    const lancamento = lancamentos.find(l => l.id === id);
    if (lancamento) {
      setLancamentoEmEdicao(lancamento);
      setModalAberto(true);
    }
  };

  if (!mounted) {
    return null;
  }

  // Estatísticas dos lançamentos
  const naoClassificados = lancamentos.filter(lanc => {
    const totalDebito = lanc.partidas.filter(p => p.natureza === 'debito').reduce((acc, p) => acc + p.valor, 0);
    const totalCredito = lanc.partidas.filter(p => p.natureza === 'credito').reduce((acc, p) => acc + p.valor, 0);
    return totalDebito !== totalCredito || lanc.partidas.length === 0;
  }).length;

  const precisamRevisao = lancamentos.filter(lanc => 
    !lanc.documento || lanc.historico.trim() === '' || lanc.historico === 'Novo lançamento'
  ).length;

  // Aplicar filtros
  const lancamentosFiltrados = lancamentos.filter(lanc => {
    // Filtro de texto (busca em histórico e documento)
    if (filtroTexto) {
      const texto = filtroTexto.toLowerCase();
      const contemTexto = 
        lanc.historico.toLowerCase().includes(texto) ||
        (lanc.documento && lanc.documento.toLowerCase().includes(texto)) ||
        lanc.partidas.some(p => 
          p.contaNome.toLowerCase().includes(texto) || 
          p.contaCodigo.toLowerCase().includes(texto)
        );
      if (!contemTexto) return false;
    }

    // Filtro de data início
    if (filtroDataInicio) {
      if (lanc.data < filtroDataInicio) return false;
    }

    // Filtro de data fim
    if (filtroDataFim) {
      if (lanc.data > filtroDataFim) return false;
    }

    // Filtro de status
    if (filtroStatus !== 'todos') {
      const totalDebito = lanc.partidas.filter(p => p.natureza === 'debito').reduce((acc, p) => acc + p.valor, 0);
      const totalCredito = lanc.partidas.filter(p => p.natureza === 'credito').reduce((acc, p) => acc + p.valor, 0);
      const isClassificado = totalDebito === totalCredito && lanc.partidas.length > 0;
      const precisaRevisao = !lanc.documento || lanc.historico.trim() === '' || lanc.historico === 'Novo lançamento';

      if (filtroStatus === 'classificados' && !isClassificado) return false;
      if (filtroStatus === 'nao-classificados' && isClassificado) return false;
      if (filtroStatus === 'precisam-revisao' && !precisaRevisao) return false;
    }

    // Filtro de conta
    if (filtroConta) {
      const temConta = lanc.partidas.some(p => p.contaCodigo === filtroConta);
      if (!temConta) return false;
    }

    // Filtro de valor
    const valorLanc = lanc.partidas.find(p => p.natureza === 'debito')?.valor || 0;
    if (filtroValorMin && valorLanc < parseFloat(filtroValorMin)) return false;
    if (filtroValorMax && valorLanc > parseFloat(filtroValorMax)) return false;

    // Filtro de padrão
    if (filtroPadrao !== 'todos') {
      const padraoLanc = identificarPadraoLancamento(lanc);
      if (padraoLanc.tipo !== filtroPadrao) return false;
    }

    return true;
  });

  // Aplicar ordenação
  const lancamentosOrdenados = [...lancamentosFiltrados].sort((a, b) => {
    if (ordenacao === 'data-desc') return b.data.localeCompare(a.data);
    if (ordenacao === 'data-asc') return a.data.localeCompare(b.data);
    
    const valorA = a.partidas.find(p => p.natureza === 'debito')?.valor || 0;
    const valorB = b.partidas.find(p => p.natureza === 'debito')?.valor || 0;
    if (ordenacao === 'valor-desc') return valorB - valorA;
    if (ordenacao === 'valor-asc') return valorA - valorB;
    
    return 0;
  });

  const totalFiltrados = lancamentosOrdenados.length;
  const filtrosAtivos = 
    filtroTexto || 
    filtroDataInicio || 
    filtroDataFim || 
    filtroStatus !== 'todos' || 
    filtroConta || 
    filtroValorMin || 
    filtroValorMax ||
    filtroPadrao !== 'todos';

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-0">
      <Header />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-2 md:px-4 py-4 md:py-8">
        <FilterBar
          compact={modoCompacto}
          topClassName="top-0 md:top-[65px]"
          primary={
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar..."
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                className="w-full px-3 md:px-4 py-2 pl-9 md:pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <svg
                className="w-4 h-4 md:w-5 md:h-5 text-gray-400 absolute left-2.5 md:left-3 top-2.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          }
          secondary={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFiltrosVisiveis(!filtrosVisiveis)}
                className={`flex-1 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                  filtrosAtivos
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-gray-300 text-gray-700'
                }`}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                  <span className="hidden xs:inline">Filtros</span>
                  {filtrosAtivos && <span className="font-semibold">({totalFiltrados})</span>}
                </span>
              </button>

              <select
                value={ordenacao}
                onChange={(e) => setOrdenacao(e.target.value as any)}
                className="flex-1 px-2 md:px-3 py-2 border border-gray-300 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="data-desc">Mais recentes</option>
                <option value="data-asc">Mais antigos</option>
                <option value="valor-desc">Maior valor</option>
                <option value="valor-asc">Menor valor</option>
              </select>

              <button
                onClick={() => setImportModalAberto(true)}
                className="px-3 md:px-4 py-2 border border-blue-600 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium whitespace-nowrap"
              >
                Importar extrato
              </button>

              <button
                onClick={() => setModalAberto(true)}
                className="px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
              >
                + Novo
              </button>
            </div>
          }
          secondaryMini={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFiltrosVisiveis(!filtrosVisiveis)}
                className={`flex-1 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                  filtrosAtivos
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-gray-300 text-gray-700'
                }`}
                title="Filtros"
              >
                <span className="flex items-center justify-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                  <span className="hidden xs:inline">Filtros</span>
                  {filtrosAtivos && <span className="font-semibold">({totalFiltrados})</span>}
                </span>
              </button>

              <select
                value={ordenacao}
                onChange={(e) => setOrdenacao(e.target.value as any)}
                className="flex-1 px-2 md:px-3 py-2 border border-gray-300 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                title="Ordenação"
              >
                <option value="data-desc">Mais recentes</option>
                <option value="data-asc">Mais antigos</option>
                <option value="valor-desc">Maior valor</option>
                <option value="valor-asc">Menor valor</option>
              </select>

              <button
                onClick={() => setModalAberto(true)}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
                title="Novo lançamento"
              >
                +
              </button>
            </div>
          }
        />

        <div className="bg-white rounded-lg shadow">
          <div className="p-3 md:p-4 border-b border-gray-200">
            {/* Painel de Filtros Avançados */}
            {filtrosVisiveis && (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                {/* Período em linha no mobile */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">De</label>
                    <input
                      type="date"
                      value={filtroDataInicio}
                      onChange={(e) => setFiltroDataInicio(e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Até</label>
                    <input
                      type="date"
                      value={filtroDataFim}
                      onChange={(e) => setFiltroDataFim(e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value as any)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="todos">Todos</option>
                    <option value="classificados">Classificados</option>
                    <option value="nao-classificados">Não classificados</option>
                    <option value="precisam-revisao">Precisam revisão</option>
                  </select>
                </div>

                {/* Conta */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Conta</label>
                  <select
                    value={filtroConta}
                    onChange={(e) => setFiltroConta(e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todas</option>
                    {contasAnaliticas.map(conta => (
                      <option key={conta.codigo} value={conta.codigo}>
                        {conta.codigo} - {conta.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tipo de Operação */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Operação</label>
                  <select
                    value={filtroPadrao}
                    onChange={(e) => setFiltroPadrao(e.target.value as any)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="todos">Todos os tipos</option>
                    <option value="despesa-vista">💳 Despesa à Vista</option>
                    <option value="despesa-prazo">📅 Despesa a Prazo</option>
                    <option value="receita-vista">💰 Receita à Vista</option>
                    <option value="receita-prazo">📈 Receita a Prazo</option>
                    <option value="pagamento-divida">✅ Pagamento de Dívida</option>
                    <option value="recebimento-credito">💵 Recebimento de Crédito</option>
                    <option value="investimento">📊 Aplicação/Investimento</option>
                    <option value="resgate-investimento">💎 Resgate de Investimento</option>
                    <option value="emprestimo-recebido">🏦 Empréstimo Recebido</option>
                    <option value="transferencia-entre-contas">🔄 Transferência</option>
                    <option value="aporte-capital">💼 Aporte de Capital</option>
                    <option value="retirada-capital">📤 Retirada de Capital</option>
                  </select>
                </div>

                {/* Valores em linha */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Valor mín</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={filtroValorMin}
                      onChange={(e) => setFiltroValorMin(e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Valor máx</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={filtroValorMax}
                      onChange={(e) => setFiltroValorMax(e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>

                {/* Botão Limpar */}
                {filtrosAtivos && (
                  <button
                    onClick={() => {
                      setFiltroTexto('');
                      setFiltroDataInicio('');
                      setFiltroDataFim('');
                      setFiltroStatus('todos');
                      setFiltroConta('');
                      setFiltroValorMin('');
                      setFiltroValorMax('');
                      setFiltroPadrao('todos');
                    }}
                    className="w-full px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    Limpar Filtros
                  </button>
                )}
              </div>
            )}

            {/* Resumo dos Resultados - Compacto */}
            {filtrosAtivos && (
              <div className="mt-2 text-xs md:text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{totalFiltrados}</span> de <span className="font-semibold text-gray-900">{lancamentos.length}</span>
              </div>
            )}
          </div>

          {/* Lista de lançamentos */}
          <div className="p-6">
            {lancamentosOrdenados.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 text-lg mb-2">
                  {filtrosAtivos ? 'Nenhum lançamento encontrado' : 'Nenhum lançamento cadastrado'}
                </p>
                <p className="text-gray-400 text-sm">
                  {filtrosAtivos ? 'Tente ajustar os filtros' : 'Clique em "+ Novo" para começar'}
                </p>
              </div>
            ) : (
              <>
                {/* Tabela para telas médias e grandes */}
                <div className="hidden md:block overflow-x-auto -mx-6 px-6">
                <table className="w-full table-fixed min-w-[700px]">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-2 text-xs md:text-sm font-semibold text-gray-700 w-24">Tipo</th>
                      <th className="text-left py-2 px-2 text-xs md:text-sm font-semibold text-gray-700 w-20">Data</th>
                      <th className="hidden lg:table-cell text-left py-2 px-2 text-sm font-semibold text-gray-700 w-20">Documento</th>
                      <th className="text-left py-2 px-2 text-xs md:text-sm font-semibold text-gray-700 w-32 lg:w-40">Histórico</th>
                      <th className="text-left py-2 px-2 text-xs md:text-sm font-semibold text-gray-700 w-32 lg:w-40">Débito</th>
                      <th className="text-left py-2 px-2 text-xs md:text-sm font-semibold text-gray-700 w-32 lg:w-40">Crédito</th>
                      <th className="text-right py-2 px-2 text-xs md:text-sm font-semibold text-gray-700 w-20">Valor</th>
                      <th className="text-center py-2 px-1 text-xs md:text-sm font-semibold text-gray-700 w-14">
                        <span className="sr-only">Ações</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lancamentosOrdenados.map((lancamento) => {
                      const partidaDebito = lancamento.partidas.find(p => p.natureza === 'debito');
                      const partidaCredito = lancamento.partidas.find(p => p.natureza === 'credito');
                      const valor = partidaDebito?.valor || partidaCredito?.valor || 0;
                      const padraoInfo = identificarPadraoLancamento(lancamento);

                      return (
                        <tr key={lancamento.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-2 text-xs align-top">
                            <span 
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${padraoInfo.cor}`}
                              title={padraoInfo.nome}
                            >
                              <span>{padraoInfo.emoji}</span>
                              <span className="hidden xl:inline">{padraoInfo.nome.split(' ')[0]}</span>
                            </span>
                          </td>
                          <td className="py-2 px-2 text-xs md:text-sm text-gray-700 whitespace-nowrap align-top">
                            {new Date(lancamento.data).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="hidden lg:table-cell py-2 px-2 text-sm text-gray-700 align-top">
                            {lancamento.documento || '-'}
                          </td>
                          <td className="py-2 px-2 text-xs md:text-sm text-gray-700 align-top">
                            <div className="line-clamp-2 break-words" title={lancamento.historico}>
                              {lancamento.historico}
                            </div>
                          </td>
                          <td className="py-2 px-2 text-gray-700 align-top">
                            {partidaDebito ? (
                              <>
                                <div className="flex items-center gap-1">
                                  <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-green-100 text-green-700 font-semibold text-[10px] flex-shrink-0">D</span>
                                  <span className="font-mono text-[10px] md:text-xs text-gray-600">{partidaDebito.contaCodigo}</span>
                                </div>
                                <div className="text-xs md:text-sm line-clamp-2 break-words leading-none" title={partidaDebito.contaNome}>{partidaDebito.contaNome}</div>
                              </>
                            ) : '-'}
                          </td>
                          <td className="py-2 px-2 text-gray-700 align-top">
                            {partidaCredito ? (
                              <>
                                <div className="flex items-center gap-1">
                                  <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-red-100 text-red-700 font-semibold text-[10px] flex-shrink-0">C</span>
                                  <span className="font-mono text-[10px] md:text-xs text-gray-600">{partidaCredito.contaCodigo}</span>
                                </div>
                                <div className="text-xs md:text-sm line-clamp-2 break-words leading-none" title={partidaCredito.contaNome}>{partidaCredito.contaNome}</div>
                              </>
                            ) : '-'}
                          </td>
                          <td className="py-2 px-2 text-xs md:text-sm text-right text-gray-700 font-medium whitespace-nowrap align-top">
                            R$ {valor.toFixed(2)}
                          </td>
                          <td className="py-2 px-1 text-center align-top">
                            <div className="flex items-center justify-center gap-0.5">
                            <button 
                              onClick={() => handleEditarLancamento(lancamento.id)}
                              className="inline-flex items-center justify-center w-7 h-7 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                              title="Editar lançamento"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              <span className="sr-only">Editar</span>
                            </button>
                            <button 
                              onClick={() => handleExcluirLancamento(lancamento.id)}
                              className="inline-flex items-center justify-center w-7 h-7 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                              title="Excluir lançamento"
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
              <div className="md:hidden space-y-4">
                {lancamentosOrdenados.reduce<React.ReactNode[]>((acc, lancamento, index, array) => {
                  const dataFormatada = new Date(lancamento.data).toLocaleDateString('pt-BR', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  });
                  
                  const dataDiferente = index === 0 || 
                    new Date(array[index - 1].data).toDateString() !== new Date(lancamento.data).toDateString();

                  const partidaDebito = lancamento.partidas.find(p => p.natureza === 'debito');
                  const partidaCredito = lancamento.partidas.find(p => p.natureza === 'credito');
                  const valor = partidaDebito?.valor || partidaCredito?.valor || 0;
                  const padraoInfo = identificarPadraoLancamento(lancamento);

                  acc.push(
                    <React.Fragment key={`${lancamento.id}-fragment`}>
                      {dataDiferente && (
                        <div className="px-3 pt-2 pb-1">
                          <h3 className="text-sm font-semibold text-gray-700">{dataFormatada}</h3>
                        </div>
                      )}
                      
                      <div
                        className="relative mx-2 bg-white rounded-lg shadow-sm overflow-hidden"
                        style={{ touchAction: 'pan-y' }}
                      >
                        <div className="absolute inset-0 bg-red-500 flex items-center justify-end px-6">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </div>

                        <div
                          onClick={() => handleEditarLancamento(lancamento.id)}
                          onTouchStart={(e) => {
                            const touch = e.touches[0];
                            const target = e.currentTarget as HTMLElement;
                            (target as any).touchStartX = touch.clientX;
                            (target as any).touchStartTime = Date.now();
                          }}
                          onTouchMove={(e) => {
                            const touch = e.touches[0];
                            const target = e.currentTarget as HTMLElement;
                            const startX = (target as any).touchStartX;
                            if (startX) {
                              const deltaX = touch.clientX - startX;
                              if (deltaX < 0) {
                                target.style.transform = `translateX(${Math.max(deltaX, -100)}px)`;
                                target.style.transition = 'none';
                              }
                            }
                          }}
                          onTouchEnd={(e) => {
                            const target = e.currentTarget as HTMLElement;
                            const startX = (target as any).touchStartX;
                            const startTime = (target as any).touchStartTime;
                            const currentX = e.changedTouches[0].clientX;
                            const deltaX = currentX - startX;
                            const deltaTime = Date.now() - startTime;

                            if (deltaX < -80 || (deltaX < -40 && deltaTime < 300)) {
                              handleExcluirLancamento(lancamento.id);
                            }
                            
                            target.style.transform = 'translateX(0)';
                            target.style.transition = 'transform 0.3s ease';
                            setTimeout(() => {
                              target.style.transition = '';
                            }, 300);
                          }}
                          className="relative bg-white p-3 cursor-pointer active:bg-gray-50 transition-colors"
                        >
                          {/* Badge de Tipo no Card Mobile */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span 
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${padraoInfo.cor}`}
                            >
                              <span>{padraoInfo.emoji}</span>
                              <span>{padraoInfo.nome}</span>
                            </span>
                            {lancamento.documento && (
                              <span className="text-xs text-gray-500">
                                {lancamento.documento}
                              </span>
                            )}
                          </div>

                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-sm leading-5 line-clamp-2">
                                {lancamento.historico}
                              </p>
                            </div>
                            <div className="flex flex-col items-end flex-shrink-0">
                              <p className="text-base font-semibold text-red-600 whitespace-nowrap">
                                -R$ {valor.toFixed(2).replace('.', ',')}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-green-100 text-green-700 font-semibold text-xs flex-shrink-0">
                                D
                              </span>
                              <span className="text-gray-600 truncate">
                                {partidaDebito?.contaNome || '-'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-red-100 text-red-700 font-semibold text-xs flex-shrink-0">
                                C
                              </span>
                              <span className="text-gray-600 truncate">
                                {partidaCredito?.contaNome || '-'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                  return acc;
                }, [])}
              </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Modal de Importação de Extrato */}
      {importModalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full my-auto max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
              <h3 className="text-xl font-semibold text-gray-800">Importar extrato bancário (CSV)</h3>
              <p className="text-sm text-gray-600 mt-1">Colunas esperadas: <code>data</code>, <code>descrição</code>, <code>valor</code>, <code>tipo</code> (opcional: entrada/saída)</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Arquivo CSV</label>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) processarArquivoImportacao(file);
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Conta bancária (ativo)</label>
                  <select
                    value={importContaBanco}
                    onChange={(e) => setImportContaBanco(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Selecione</option>
                    {contasAnaliticas.filter(c => c.codigo.startsWith('1.')).map(c => (
                      <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              {importErro && <div className="text-sm text-red-600">{importErro}</div>}
              {importResumo.sucesso > 0 && (
                <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
                  {importResumo.sucesso} linhas prontas para importar.
                </div>
              )}

              {importPreview.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-2 bg-gray-50 text-sm font-medium text-gray-700">
                    Pré-visualização com classificação inteligente (primeiras 10 linhas)
                  </div>
                  <div className="max-h-96 overflow-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-100 text-gray-700 sticky top-0">
                        <tr>
                          <th className="px-3 py-2">Data</th>
                          <th className="px-3 py-2">Histórico</th>
                          <th className="px-3 py-2 text-right">Valor</th>
                          <th className="px-3 py-2">Tipo</th>
                          <th className="px-3 py-2">Classificação Sugerida</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.slice(0, 10).map((linha, idx) => {
                          const confiancaCor = 
                            !linha.confianca ? 'bg-gray-100 text-gray-600' :
                            linha.confianca >= 90 ? 'bg-green-100 text-green-800 border-green-300' :
                            linha.confianca >= 70 ? 'bg-blue-100 text-blue-800 border-blue-300' :
                            'bg-yellow-100 text-yellow-800 border-yellow-300';
                          
                          const confiancaIcone = 
                            !linha.confianca ? '❓' :
                            linha.confianca >= 90 ? '✅' :
                            linha.confianca >= 70 ? '🎯' : '⚠️';
                          
                          return (
                            <tr key={`${linha.data}-${idx}`} className="border-t border-gray-100 hover:bg-gray-50">
                              <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{linha.data}</td>
                              <td className="px-3 py-2 text-gray-700">{linha.historico}</td>
                              <td className="px-3 py-2 text-gray-700 text-right font-medium">R$ {linha.valor.toFixed(2)}</td>
                              <td className="px-3 py-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                  linha.tipo === 'entrada' 
                                    ? 'bg-green-100 text-green-700 border border-green-200' 
                                    : 'bg-red-100 text-red-700 border border-red-200'
                                }`}>
                                  {linha.tipo === 'entrada' ? '↗ Entrada' : '↙ Saída'}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                {linha.contaSugerida ? (
                                  <div className="flex flex-col gap-1">
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${confiancaCor}`}>
                                      <span>{confiancaIcone}</span>
                                      <span className="font-mono">{linha.contaSugeridaNome}</span>
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {linha.razaoSugestao} ({linha.confianca}% confiança)
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400 italic">Usar conta padrão</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
                    <div className="flex gap-4">
                      <span>✅ Alta confiança (90%+)</span>
                      <span>🎯 Boa confiança (70-89%)</span>
                      <span>⚠️ Baixa confiança (&lt;70%)</span>
                      <span>❓ Sem sugestão</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setImportModalAberto(false);
                    setImportPreview([]);
                    setImportErro('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleImportarLancamentos}
                  disabled={importCarregando}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-semibold"
                >
                  {importCarregando ? 'Importando...' : 'Importar lançamentos'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Lançamento */}
      {modalAberto && (
        <ModalLancamento
          isOpen={modalAberto}
          onClose={() => {
            setModalAberto(false);
            setLancamentoEmEdicao(null);
          }}
          onSalvar={async (novoLancamento) => {
            try {
              if (lancamentoEmEdicao) {
                // Editar lançamento existente
                const { updateLancamento } = await import('@/lib/api');
                const lancamentoAtualizado = await updateLancamento(lancamentoEmEdicao.id, novoLancamento);
                setLancamentos(lancamentos.map(l => l.id === lancamentoEmEdicao.id ? lancamentoAtualizado : l));
              } else {
                // Criar novo lançamento
                const lancamentoSalvo = await createLancamento(novoLancamento);
                setLancamentos([...lancamentos, lancamentoSalvo]);
              }
              setModalAberto(false);
              setLancamentoEmEdicao(null);
            } catch (error) {
              console.error('Erro ao salvar lançamento:', error);
              alert('Erro ao salvar lançamento. Tente novamente.');
            }
          }}
          contasAnaliticas={contasAnaliticas}
          lancamentoEmEdicao={lancamentoEmEdicao}
          autoPatterns={autoPatterns}
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
          <a href="/planejamento" className="flex flex-col items-center justify-center flex-1 h-full text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            <span className="text-xs mt-1">Planejar</span>
          </a>
          <a href="/lancamentos" className="flex flex-col items-center justify-center flex-1 h-full text-blue-600">
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
