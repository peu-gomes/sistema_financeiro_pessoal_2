'use client';

import React, { useState, useEffect } from 'react';
import { getConfiguracoes } from '@/lib/api';
import type { ContaBancariaImportacao, RegraClassificacao } from '@/lib/api';
import Header from '@/components/Header';
import FilterBar from '@/components/FilterBar';
import { useScrollCompact } from '@/lib/hooks/useScrollCompact';

export default function ConfiguracaoBancos() {
  const modoCompacto = useScrollCompact(150);
  const [bancos, setBancos] = useState<ContaBancariaImportacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [bancoSelecionado, setBancoSelecionado] = useState<ContaBancariaImportacao | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalRegra, setModalRegra] = useState(false);
  const [novaRegra, setNovaRegra] = useState<Partial<RegraClassificacao>>({
    palavrasChave: [],
    ativo: true,
    prioridade: 1
  });
  const [novaPalavra, setNovaPalavra] = useState('');

  useEffect(() => {
    carregarBancos();
  }, []);

  const carregarBancos = async () => {
    try {
      const config = await getConfiguracoes();
      setBancos(config.contasBancarias || []);
      setCarregando(false);
    } catch (error) {
      console.error('Erro ao carregar bancos:', error);
      setCarregando(false);
    }
  };

  const handleAdicionarPalavra = () => {
    if (novaPalavra.trim()) {
      setNovaRegra({
        ...novaRegra,
        palavrasChave: [...(novaRegra.palavrasChave || []), novaPalavra.trim().toLowerCase()]
      });
      setNovaPalavra('');
    }
  };

  const handleRemoverPalavra = (palavra: string) => {
    setNovaRegra({
      ...novaRegra,
      palavrasChave: (novaRegra.palavrasChave || []).filter(p => p !== palavra)
    });
  };

  const handleSalvarRegra = () => {
    if (!bancoSelecionado || !novaRegra.contaDestino) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    const regras = [...(bancoSelecionado.regrasClassificacao || [])];
    const regra: RegraClassificacao = {
      id: `regra-${Date.now()}`,
      palavrasChave: novaRegra.palavrasChave || [],
      contaDestino: novaRegra.contaDestino,
      tipo: novaRegra.tipo || 'saida',
      prioridade: novaRegra.prioridade || 1,
      ativo: novaRegra.ativo ?? true
    };
    regras.push(regra);

    setBancoSelecionado({
      ...bancoSelecionado,
      regrasClassificacao: regras
    });

    setModalRegra(false);
    setNovaRegra({ palavrasChave: [], ativo: true, prioridade: 1 });
  };

  const handleRemoverRegra = (idRegra: string) => {
    if (!bancoSelecionado) return;
    
    setBancoSelecionado({
      ...bancoSelecionado,
      regrasClassificacao: (bancoSelecionado.regrasClassificacao || []).filter(r => r.id !== idRegra)
    });
  };

  const obterCor = (tipo: string) => {
    return tipo === 'entrada' 
      ? 'bg-green-100 text-green-700 border-green-200'
      : 'bg-red-100 text-red-700 border-red-200';
  };

  if (carregando) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <FilterBar
          compact={modoCompacto}
          topClassName="top-12"
          primary={
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className={`font-semibold text-gray-800 ${modoCompacto ? 'text-base' : 'text-lg'}`}>Configuração de Bancos</div>
                {!modoCompacto && (
                  <div className="text-sm text-gray-600">Regras de importação e classificação</div>
                )}
              </div>
              <button
                onClick={carregarBancos}
                className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Recarregar
              </button>
            </div>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Bancos */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <h2 className="text-lg font-bold">Bancos Configurados</h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {bancos.map(banco => (
                  <button
                    key={banco.id}
                    onClick={() => {
                      setBancoSelecionado(banco);
                      setModalAberto(true);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors ${
                      bancoSelecionado?.id === banco.id ? 'bg-blue-100 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{banco.nome}</div>
                        <div className="text-sm text-gray-500">{banco.contaCodigo}</div>
                      </div>
                      {banco.padrao && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
                          Padrão
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Detalhes do Banco Selecionado */}
          {bancoSelecionado && (
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex justify-between items-center">
                  <h2 className="text-lg font-bold">{bancoSelecionado.nome}</h2>
                  <button
                    onClick={() => setModalAberto(false)}
                    className="text-white hover:bg-blue-600 rounded p-1 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {/* Informações Básicas */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Código da Conta</label>
                      <input
                        type="text"
                        value={bancoSelecionado.contaCodigo}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Conta</label>
                      <input
                        type="text"
                        value={bancoSelecionado.contaNome}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Código da Receita Padrão</label>
                      <input
                        type="text"
                        value={bancoSelecionado.contaPadraoReceita || ''}
                        placeholder="Ex: 4.1.01.001"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm"
                        disabled
                      />
                      <p className="text-xs text-gray-500 mt-1">Conta usada para entradas sem classificação</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Código da Despesa Padrão</label>
                      <input
                        type="text"
                        value={bancoSelecionado.contaPadraoDespesa || ''}
                        placeholder="Ex: 5.99.99.999"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm"
                        disabled
                      />
                      <p className="text-xs text-gray-500 mt-1">Conta usada para saídas sem classificação</p>
                    </div>
                  </div>

                  <hr className="my-4" />

                  {/* Regras de Classificação */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-base font-semibold text-gray-900">Regras de Classificação</h3>
                      <button
                        onClick={() => {
                          setNovaRegra({ palavrasChave: [], ativo: true, prioridade: 1 });
                          setModalRegra(true);
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        + Adicionar Regra
                      </button>
                    </div>

                    {(bancoSelecionado.regrasClassificacao || []).length === 0 ? (
                      <p className="text-gray-500 text-sm italic">Nenhuma regra configurada</p>
                    ) : (
                      <div className="space-y-3">
                        {bancoSelecionado.regrasClassificacao
                          ?.sort((a, b) => (a.prioridade || 99) - (b.prioridade || 99))
                          .map(regra => (
                            <div
                              key={regra.id}
                              className="p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex justify-between items-start gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${obterCor(regra.tipo)}`}>
                                      {regra.tipo === 'entrada' ? '↗ Entrada' : '↙ Saída'}
                                    </span>
                                    <span className="text-xs font-medium text-gray-600">
                                      Prioridade: {regra.prioridade}
                                    </span>
                                    {!regra.ativo && (
                                      <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                                        Inativo
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="mb-2">
                                    <p className="text-sm font-medium text-gray-700 mb-1">Palavras-chave:</p>
                                    <div className="flex flex-wrap gap-2">
                                      {regra.palavrasChave.map(palavra => (
                                        <span
                                          key={palavra}
                                          className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-300 rounded text-xs"
                                        >
                                          {palavra}
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="text-sm">
                                    <span className="font-medium text-gray-700">Destino: </span>
                                    <span className="font-mono text-blue-600">{regra.contaDestino}</span>
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleRemoverRegra(regra.id)}
                                  className="text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                                  title="Remover regra"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Nova Regra */}
      {modalRegra && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-96 overflow-y-auto">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex justify-between items-center">
              <h3 className="text-lg font-bold">Adicionar Regra de Classificação</h3>
              <button
                onClick={() => setModalRegra(false)}
                className="text-white hover:bg-blue-600 rounded p-1 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Transação</label>
                <select
                  value={novaRegra.tipo || 'saida'}
                  onChange={(e) => setNovaRegra({ ...novaRegra, tipo: e.target.value as 'entrada' | 'saida' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm"
                >
                  <option value="saida">Saída (Despesa)</option>
                  <option value="entrada">Entrada (Receita)</option>
                </select>
              </div>

              {/* Conta Destino */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código da Conta (Destino)*</label>
                <input
                  type="text"
                  value={novaRegra.contaDestino || ''}
                  onChange={(e) => setNovaRegra({ ...novaRegra, contaDestino: e.target.value })}
                  placeholder="Ex: 5.3.01.001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm"
                />
              </div>

              {/* Prioridade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                <input
                  type="number"
                  value={novaRegra.prioridade || 1}
                  onChange={(e) => setNovaRegra({ ...novaRegra, prioridade: parseInt(e.target.value) })}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Menor número = maior prioridade</p>
              </div>

              {/* Palavras-chave */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Palavras-chave*</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={novaPalavra}
                    onChange={(e) => setNovaPalavra(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAdicionarPalavra()}
                    placeholder="Ex: supermercado, mercado"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm"
                  />
                  <button
                    onClick={handleAdicionarPalavra}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                  >
                    +
                  </button>
                </div>

                {(novaRegra.palavrasChave || []).length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(novaRegra.palavrasChave || []).map(palavra => (
                      <div
                        key={palavra}
                        className="inline-flex items-center gap-2 px-2 py-1 bg-blue-100 border border-blue-300 rounded text-sm"
                      >
                        {palavra}
                        <button
                          onClick={() => handleRemoverPalavra(palavra)}
                          className="text-blue-700 hover:text-blue-900 font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ativo */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={novaRegra.ativo ?? true}
                  onChange={(e) => setNovaRegra({ ...novaRegra, ativo: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600"
                />
                <label htmlFor="ativo" className="text-sm text-gray-700">
                  Ativa
                </label>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setModalRegra(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSalvarRegra}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
