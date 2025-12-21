'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { ContaBancariaImportacao, RegraClassificacao, CsvCampoPadrao, CsvLayoutConfig } from '@/lib/api';
import Header from '@/components/Header';
import FilterBar from '@/components/FilterBar';
import { useScrollCompact } from '@/lib/hooks/useScrollCompact';
import { useConfiguracoesData } from '@/app/configuracoes/hooks/useConfiguracoes';

export default function ConfiguracaoBancos() {
  const modoCompacto = useScrollCompact(150);
  const { bancos, contasAnaliticas, loading, erro, salvarBancos, recarregar } = useConfiguracoesData();

  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const bancoSelecionado = useMemo(
    () => (selecionadoId ? bancos.find((b) => b.id === selecionadoId) || null : null),
    [bancos, selecionadoId],
  );

  const [draft, setDraft] = useState<ContaBancariaImportacao | null>(null);
  const [dirty, setDirty] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [modalRegra, setModalRegra] = useState(false);
  const [novaRegra, setNovaRegra] = useState<Partial<RegraClassificacao>>({
    palavrasChave: [],
    ativo: true,
    prioridade: 1
  });
  const [novaPalavra, setNovaPalavra] = useState('');

  useEffect(() => {
    if (!selecionadoId && bancos.length > 0) {
      setSelecionadoId(bancos[0].id);
    }
  }, [bancos, selecionadoId]);

  useEffect(() => {
    if (!bancoSelecionado) {
      setDraft(null);
      setDirty(false);
      return;
    }
    setDraft(JSON.parse(JSON.stringify(bancoSelecionado)) as ContaBancariaImportacao);
    setDirty(false);
  }, [bancoSelecionado]);

  const camposCsv: CsvCampoPadrao[] = ['data', 'historico', 'valor', 'identificador', 'tipo'];
  const camposObrigatoriosBase: Array<Exclude<CsvCampoPadrao, 'tipo'>> = ['data', 'historico', 'valor'];

  const normalizarLista = (raw: string) =>
    raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  const atualizarDraft = (patch: Partial<ContaBancariaImportacao>) => {
    setDraft((prev) => {
      if (!prev) return prev;
      setDirty(true);
      return { ...prev, ...patch };
    });
  };

  const handleCriarConta = () => {
    const id = `banco-${Date.now()}`;
    const novo: ContaBancariaImportacao = {
      id,
      nome: 'Nova conta de importação',
      contaCodigo: '',
      contaNome: '',
      ativa: true,
      padrao: false,
      contaPadraoReceita: '',
      contaPadraoDespesa: '',
      layoutsCsv: [
        {
          id: `csv-${Date.now()}`,
          nome: 'Layout CSV',
          camposObrigatorios: [...camposObrigatoriosBase],
          aliases: {
            data: ['data'],
            historico: ['descricao', 'descrição'],
            valor: ['valor'],
          },
        },
      ],
      regrasClassificacao: [],
    };
    const atualizados = [novo, ...bancos];
    setSelecionadoId(id);
    setDraft(novo);
    setDirty(true);
    void salvarBancos(atualizados);
  };

  const handleSalvar = async () => {
    if (!draft) return;
    if (!draft.nome?.trim()) {
      alert('Informe o nome.');
      return;
    }
    if (!draft.contaCodigo?.trim()) {
      alert('Selecione a conta do plano de contas.');
      return;
    }

    const layoutsCsv = (draft.layoutsCsv || []).map((l) => {
      const obrigatorios = (l.camposObrigatorios || []).filter(Boolean);
      const normalizados = obrigatorios.length ? obrigatorios : [...camposObrigatoriosBase];
      return { ...l, camposObrigatorios: Array.from(new Set(normalizados)) };
    });

    const draftNormalizado: ContaBancariaImportacao = {
      ...draft,
      layoutsCsv,
      regrasClassificacao: draft.regrasClassificacao || [],
    };

    const atualizados = bancos.map((b) => (b.id === draftNormalizado.id ? draftNormalizado : b));
    const finalBancos = draftNormalizado.padrao
      ? atualizados.map((b) => (b.id === draftNormalizado.id ? b : { ...b, padrao: false }))
      : atualizados;

    try {
      setSalvando(true);
      await salvarBancos(finalBancos);
      setDirty(false);
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar bancos.');
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async () => {
    if (!draft) return;
    if (!confirm('Remover esta conta de importação?')) return;
    const atualizados = bancos.filter((b) => b.id !== draft.id);
    try {
      setSalvando(true);
      await salvarBancos(atualizados);
      setSelecionadoId(atualizados[0]?.id || null);
    } catch (e) {
      console.error(e);
      alert('Erro ao remover banco.');
    } finally {
      setSalvando(false);
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
    if (!draft || !novaRegra.contaDestino) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    const regras = [...(draft.regrasClassificacao || [])];
    const regra: RegraClassificacao = {
      id: `regra-${Date.now()}`,
      palavrasChave: novaRegra.palavrasChave || [],
      contaDestino: novaRegra.contaDestino,
      tipo: novaRegra.tipo || 'saida',
      prioridade: novaRegra.prioridade || 1,
      ativo: novaRegra.ativo ?? true
    };
    regras.push(regra);

    atualizarDraft({ regrasClassificacao: regras });

    setModalRegra(false);
    setNovaRegra({ palavrasChave: [], ativo: true, prioridade: 1 });
  };

  const handleRemoverRegra = (idRegra: string) => {
    if (!draft) return;
    atualizarDraft({
      regrasClassificacao: (draft.regrasClassificacao || []).filter((r) => r.id !== idRegra),
    });
  };

  const obterCor = (tipo: string) => {
    return tipo === 'entrada' 
      ? 'bg-green-100 text-green-700 border-green-200'
      : 'bg-red-100 text-red-700 border-red-200';
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <FilterBar
          compact={modoCompacto}
          topClassName="top-0 md:top-[65px]"
          primary={
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className={`font-semibold text-gray-800 ${modoCompacto ? 'text-base' : 'text-lg'}`}>Configuração de Bancos</div>
                {!modoCompacto && (
                  <div className="text-sm text-gray-600">Regras de importação e classificação</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCriarConta}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                >
                  + Nova conta
                </button>
                <button
                  onClick={recarregar}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Recarregar
                </button>
              </div>
            </div>
          }
        />

        {erro && (
          <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            {erro}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Bancos */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <h2 className="text-lg font-bold">Bancos Configurados</h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {bancos.map((banco) => (
                  <button
                    key={banco.id}
                    onClick={() => {
                      setSelecionadoId(banco.id);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors ${
                      selecionadoId === banco.id ? 'bg-blue-100 border-l-4 border-blue-600' : ''
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
                {bancos.length === 0 && (
                  <div className="p-4 text-sm text-gray-600">
                    Nenhuma conta configurada. Clique em <span className="font-semibold">+ Nova conta</span>.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Detalhes do Banco Selecionado */}
          {draft && (
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-bold">{draft.nome}</h2>
                    <div className="text-xs text-blue-100">Tudo aqui é configurável e fica salvo nas Configurações</div>
                  </div>
                  <button
                    onClick={() => setSelecionadoId(null)}
                    className="text-white hover:bg-blue-600 rounded p-1 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {/* Informações Básicas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome*</label>
                      <input
                        type="text"
                        value={draft.nome}
                        onChange={(e) => atualizarDraft({ nome: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700"
                      />
                    </div>
                    <div className="flex items-center gap-3 pt-6">
                      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={draft.ativa}
                          onChange={(e) => atualizarDraft({ ativa: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600"
                        />
                        Ativa
                      </label>
                      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={!!draft.padrao}
                          onChange={(e) => atualizarDraft({ padrao: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600"
                        />
                        Padrão
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Conta no Plano de Contas*</label>
                      <select
                        value={draft.contaCodigo}
                        onChange={(e) => {
                          const codigo = e.target.value;
                          const conta = contasAnaliticas.find((c) => c.codigo === codigo);
                          atualizarDraft({ contaCodigo: codigo, contaNome: conta?.nome || '' });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm"
                      >
                        <option value="">Selecione</option>
                        {contasAnaliticas.map((c) => (
                          <option key={c.codigo} value={c.codigo}>
                            {c.codigo} - {c.nome} ({c.categoria})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Conta</label>
                      <input
                        type="text"
                        value={draft.contaNome}
                        onChange={(e) => atualizarDraft({ contaNome: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Código da Receita Padrão</label>
                      <input
                        type="text"
                        value={draft.contaPadraoReceita || ''}
                        placeholder="Ex: 4.1.01.001"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm"
                        onChange={(e) => atualizarDraft({ contaPadraoReceita: e.target.value })}
                      />
                      <p className="text-xs text-gray-500 mt-1">Conta usada para entradas sem classificação</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Código da Despesa Padrão</label>
                      <input
                        type="text"
                        value={draft.contaPadraoDespesa || ''}
                        placeholder="Ex: 5.99.99.999"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm"
                        onChange={(e) => atualizarDraft({ contaPadraoDespesa: e.target.value })}
                      />
                      <p className="text-xs text-gray-500 mt-1">Conta usada para saídas sem classificação</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Banco (opcional)</label>
                      <input
                        type="text"
                        value={draft.banco || ''}
                        onChange={(e) => atualizarDraft({ banco: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm"
                        placeholder="Ex: Nu, 001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Agência (opcional)</label>
                      <input
                        type="text"
                        value={draft.agencia || ''}
                        onChange={(e) => atualizarDraft({ agencia: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm"
                        placeholder="Ex: 0001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Conta (opcional)</label>
                      <input
                        type="text"
                        value={draft.numeroConta || ''}
                        onChange={(e) => atualizarDraft({ numeroConta: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm"
                        placeholder="Ex: 12345-6"
                      />
                    </div>
                  </div>

                  <hr className="my-4" />

                  {/* Layouts CSV */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-base font-semibold text-gray-900">Layouts CSV (detecção por cabeçalho)</h3>
                      <button
                        onClick={() => {
                          const novo: CsvLayoutConfig = {
                            id: `csv-${Date.now()}`,
                            nome: 'Novo layout',
                            camposObrigatorios: [...camposObrigatoriosBase],
                            aliases: { data: ['data'], historico: ['descricao', 'descrição'], valor: ['valor'] },
                          };
                          atualizarDraft({ layoutsCsv: [...(draft.layoutsCsv || []), novo] });
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        + Layout
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">
                      A importação usa o cabeçalho do CSV para escolher automaticamente um layout compatível.
                    </p>

                    {(draft.layoutsCsv || []).length === 0 ? (
                      <div className="text-sm text-gray-500 italic">Nenhum layout CSV configurado</div>
                    ) : (
                      <div className="space-y-3">
                        {(draft.layoutsCsv || []).map((layout, idx) => (
                          <div key={layout.id} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Nome</label>
                                    <input
                                      type="text"
                                      value={layout.nome}
                                      onChange={(e) => {
                                        const layouts = [...(draft.layoutsCsv || [])];
                                        layouts[idx] = { ...layout, nome: e.target.value };
                                        atualizarDraft({ layoutsCsv: layouts });
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Campos obrigatórios (p/ bater no header)</label>
                                    <div className="flex flex-wrap gap-3 pt-1">
                                      {(['data', 'historico', 'valor', 'identificador'] as Array<Exclude<CsvCampoPadrao, 'tipo'>>).map((campo) => (
                                        <label key={campo} className="inline-flex items-center gap-2 text-sm text-gray-700">
                                          <input
                                            type="checkbox"
                                            checked={(layout.camposObrigatorios || []).includes(campo)}
                                            onChange={(e) => {
                                              const set = new Set(layout.camposObrigatorios || []);
                                              if (e.target.checked) set.add(campo);
                                              else set.delete(campo);
                                              const layouts = [...(draft.layoutsCsv || [])];
                                              layouts[idx] = { ...layout, camposObrigatorios: Array.from(set) };
                                              atualizarDraft({ layoutsCsv: layouts });
                                            }}
                                            className="rounded border-gray-300 text-blue-600"
                                          />
                                          <span className="font-mono text-xs">{campo}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {camposCsv.map((campo) => (
                                    <div key={campo}>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Aliases do header: <span className="font-mono">{campo}</span>
                                      </label>
                                      <input
                                        type="text"
                                        value={(layout.aliases?.[campo] || []).join(', ')}
                                        onChange={(e) => {
                                          const aliases = { ...(layout.aliases || {}) } as CsvLayoutConfig['aliases'];
                                          aliases[campo] = normalizarLista(e.target.value);
                                          const layouts = [...(draft.layoutsCsv || [])];
                                          layouts[idx] = { ...layout, aliases };
                                          atualizarDraft({ layoutsCsv: layouts });
                                        }}
                                        placeholder="Ex: data, date"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  const layouts = (draft.layoutsCsv || []).filter((l) => l.id !== layout.id);
                                  atualizarDraft({ layoutsCsv: layouts });
                                }}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                                title="Remover layout"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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

                    {(draft.regrasClassificacao || []).length === 0 ? (
                      <p className="text-gray-500 text-sm italic">Nenhuma regra configurada</p>
                    ) : (
                      <div className="space-y-3">
                        {draft.regrasClassificacao
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

                  <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleExcluir}
                      disabled={salvando}
                      className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      Remover
                    </button>
                    <button
                      onClick={handleSalvar}
                      disabled={!dirty || salvando}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-semibold"
                    >
                      {salvando ? 'Salvando...' : dirty ? 'Salvar alterações' : 'Salvo'}
                    </button>
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
