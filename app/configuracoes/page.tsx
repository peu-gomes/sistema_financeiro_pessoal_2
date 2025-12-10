'use client';

import { useEffect, useMemo, useState } from 'react';
import { ICONES_DISPONIVEIS, ICONES_PADRAO, type TipoCategoria } from '@/lib/iconesUtils';
import { validarMascara } from '@/lib/maskUtils';
import { useTheme } from '@/contexts/ThemeContext';
import Header from '@/components/Header';
import { useConfiguracoesData } from './hooks/useConfiguracoes';

export default function Configuracoes() {
  const { tema, setTema } = useTheme();
  const {
    permitirContasRaiz,
    setPermitirContasRaiz,
    mascara,
    setMascara,
    iconesCategoria,
    setIconesCategoria,
    autoPatterns,
    setAutoPatterns,
    bancos,
    loading,
    erro,
    recarregar,
    salvarConfiguracoes,
  } = useConfiguracoesData();
  const [modalEditarMascaraAberto, setModalEditarMascaraAberto] = useState(false);
  const [novaMascara, setNovaMascara] = useState('');
  const [erroMascara, setErroMascara] = useState('');
  const [mensagemMascara, setMensagemMascara] = useState('');
  const [feedback, setFeedback] = useState<{ tipo: 'success' | 'error'; mensagem: string } | null>(null);
  const [salvandoIcones, setSalvandoIcones] = useState(false);
  const [salvandoPadroes, setSalvandoPadroes] = useState(false);
  
  // Estado de expansão das seções
  const [secoesExpanded, setSecoesExpanded] = useState<Record<string, boolean>>({
    mascara: false,
    icones: false,
    padroes: false,
    bancos: false,
  });

  const categorias = useMemo<TipoCategoria[]>(
    () => ['ativo', 'passivo', 'patrimonio', 'receita', 'despesa'],
    [],
  );
  const iconesDisponiveis = useMemo(() => Object.entries(ICONES_DISPONIVEIS), []);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 3500);
    return () => clearTimeout(timer);
  }, [feedback]);

  const handleToggleContasRaiz = async () => {
    const novoValor = !permitirContasRaiz;
    setPermitirContasRaiz(novoValor);
    
    try {
      await salvarConfiguracoes({ permitirCriarContasRaiz: novoValor });
      setFeedback({ tipo: 'success', mensagem: novoValor ? 'Criação de contas raiz habilitada' : 'Criação de contas raiz desabilitada' });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      // Reverte mudança em caso de erro
      setPermitirContasRaiz(!novoValor);
      setFeedback({ tipo: 'error', mensagem: 'Erro ao salvar configuração de contas raiz' });
    }
  };

  const handleAbrirModalMascara = () => {
    setNovaMascara(mascara);
    setErroMascara('');
    setModalEditarMascaraAberto(true);
  };

  const handleSalvarMascara = () => {
    setErroMascara('');
    setMensagemMascara('');

    if (!novaMascara.trim()) {
      setErroMascara('Máscara é obrigatória');
      return;
    }

    if (!validarMascara(novaMascara)) {
      setErroMascara('Máscara inválida. Formato: apenas 9 (dígito) e . (ponto). Exemplo: 9.9.99.999');
      return;
    }

    setMascara(novaMascara);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mascara', novaMascara);
    }
    setMensagemMascara('Máscara atualizada');
    setFeedback({ tipo: 'success', mensagem: 'Máscara salva com sucesso' });
    setModalEditarMascaraAberto(false);
  };

  if (erro) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white border border-red-200 rounded-lg p-6 text-center shadow-sm">
          <p className="text-red-700 font-medium mb-3">{erro}</p>
          <button
            onClick={recarregar}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600 text-sm">Carregando configurações...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-0">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Configurações
          </h2>

          {feedback && (
            <div
              className={`mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm shadow-sm border ${
                feedback.tipo === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${feedback.tipo === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>{feedback.mensagem}</span>
            </div>
          )}

          {/* Plano de Contas Section */}
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Plano de Contas
              </h3>

              {/* Máscara de Codificação - Acordeão */}
              <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setSecoesExpanded({ ...secoesExpanded, mascara: !secoesExpanded.mascara })}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-700">
                      Máscara de Codificação
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Define o formato dos códigos das contas
                    </p>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${secoesExpanded.mascara ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {secoesExpanded.mascara && (
                  <div className="p-4 bg-white border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-2">
                          Formato atual: ex: 9.9.99.999
                        </p>
                        <code className="bg-gray-100 px-3 py-1.5 rounded border border-gray-300 text-sm font-mono text-gray-800">
                          {mascara}
                        </code>
                      </div>
                      <button
                        onClick={handleAbrirModalMascara}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium self-start sm:self-auto sm:ml-4"
                      >
                        Editar
                      </button>
                    </div>
                    {mensagemMascara && (
                      <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                        <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                        {mensagemMascara}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Toggle: Permitir criar contas raiz */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Permitir criar contas raiz sem validação
                  </label>
                  <p className="text-xs text-gray-500">
                    Habilite para adicionar novas contas principais (como 3 RECEITAS) no Plano de Contas
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleContasRaiz}
                  role="switch"
                  aria-checked={permitirContasRaiz}
                  aria-label="Permitir criar contas raiz sem validação"
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors self-start sm:self-auto sm:ml-4 flex-shrink-0 ${
                    permitirContasRaiz ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      permitirContasRaiz ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Aparência Section */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Aparência
              </h3>

              {/* Tema */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tema
                </label>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setTema('light')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all ${
                      tema === 'light'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Claro
                  </button>
                  <button
                    onClick={() => setTema('dark')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all ${
                      tema === 'dark'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    Escuro
                  </button>
                  <button
                    onClick={() => setTema('system')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all ${
                      tema === 'system'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Sistema
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  {tema === 'system' 
                    ? 'Usando preferência do sistema operacional' 
                    : tema === 'dark'
                    ? 'Modo escuro ativado'
                    : 'Modo claro ativado'}
                </p>
              </div>
            </div>

            {/* Ícones de Categorias Section - Acordeão */}
            <div className="border-b border-gray-200 pb-6">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setSecoesExpanded({ ...secoesExpanded, icones: !secoesExpanded.icones })}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                >
                  <div className="flex-1">
                    <div className="text-lg font-medium text-gray-800">
                      Ícones de Categorias
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Personalize os ícones exibidos para cada categoria de conta
                    </p>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${secoesExpanded.icones ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {secoesExpanded.icones && (
                  <div className="p-4 bg-white border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 mb-4">
                      <button
                        type="button"
                        onClick={async () => {
                          setSalvandoIcones(true);
                          try {
                            await salvarConfiguracoes({ iconesCategoria });
                            setFeedback({ tipo: 'success', mensagem: 'Ícones salvos com sucesso' });
                          } catch (e) {
                            setFeedback({ tipo: 'error', mensagem: 'Erro ao salvar ícones' });
                          } finally {
                            setSalvandoIcones(false);
                          }
                        }}
                        disabled={salvandoIcones}
                        aria-busy={salvandoIcones}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 self-start sm:self-auto"
                      >
                        {salvandoIcones ? 'Salvando...' : 'Salvar Ícones'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {categorias.map((cat) => (
                        <div key={cat} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <label className="text-sm font-medium text-gray-700 capitalize w-32">
                              {cat}
                            </label>
                            <select
                              value={
                                iconesDisponiveis.find(([k, v]) => v.svg === iconesCategoria[cat])?.[0] ||
                                'moeda'
                              }
                              onChange={(e) => {
                                const iconeEscolhido = ICONES_DISPONIVEIS[e.target.value]?.svg || ICONES_PADRAO[cat];
                                setIconesCategoria({ ...iconesCategoria, [cat]: iconeEscolhido });
                              }}
                              aria-label={`Selecionar ícone para ${cat}`}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700"
                            >
                              {iconesDisponiveis.map(([key, { nome, svg }]) => (
                                <option key={key} value={key}>
                                  {nome}
                                </option>
                              ))}
                            </select>
                            <div
                              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded bg-white"
                              dangerouslySetInnerHTML={{ __html: iconesCategoria[cat] || ICONES_PADRAO[cat] }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Padrões Automáticos Section - Acordeão */}
            <div className="border-b border-gray-200 pb-6">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setSecoesExpanded({ ...secoesExpanded, padroes: !secoesExpanded.padroes })}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                >
                  <div className="flex-1">
                    <div className="text-lg font-medium text-gray-800">
                      Padrões Automáticos de Lançamento
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {autoPatterns.length} padrões configurados
                    </p>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${secoesExpanded.padroes ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {secoesExpanded.padroes && (
                  <div className="p-4 bg-white border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 mb-4">
                      <button
                        type="button"
                        onClick={async () => {
                          setSalvandoPadroes(true);
                          try {
                            await salvarConfiguracoes({ autoPatterns });
                            setFeedback({ tipo: 'success', mensagem: 'Padrões salvos com sucesso' });
                          } catch (e) {
                            setFeedback({ tipo: 'error', mensagem: 'Erro ao salvar padrões' });
                          } finally {
                            setSalvandoPadroes(false);
                          }
                        }}
                        disabled={salvandoPadroes}
                        aria-busy={salvandoPadroes}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 self-start sm:self-auto"
                      >
                        {salvandoPadroes ? 'Salvando...' : 'Salvar Padrões'}
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Defina regras para preencher automaticamente débito e crédito nos lançamentos.
                    </p>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                      ℹ️ Gerenciamento detalhado de padrões está disponível na página <strong>Lançamentos</strong> ao criar ou editar um lançamento.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bancos Section - Acordeão */}
            <div>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setSecoesExpanded({ ...secoesExpanded, bancos: !secoesExpanded.bancos })}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                >
                  <div className="flex-1">
                    <div className="text-lg font-medium text-gray-800">
                      Contas Bancárias para Importação
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {bancos.length} banco(s) configurado(s)
                    </p>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${secoesExpanded.bancos ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {secoesExpanded.bancos && (
                  <div className="p-4 bg-white border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-4">
                      Configure suas contas bancárias, regras de classificação inteligente e padrões de importação.
                    </p>
                    <a
                      href="/configuracao-bancos"
                      aria-label="Ir para página de configuração de bancos"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Gerenciar Bancos e Regras
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Editar Máscara */}
      {modalEditarMascaraAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Editar Máscara</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Formato da Máscara *
                  </label>
                  <input
                    type="text"
                    value={novaMascara}
                    onChange={(e) => setNovaMascara(e.target.value)}
                    placeholder="Ex: 9.9.99.999"
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-mono"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Use <code className="bg-gray-100 px-1 rounded">9</code> para dígitos e <code className="bg-gray-100 px-1 rounded">.</code> como separador (ex: 9.9.99.999)
                  </p>
                  {erroMascara && (
                    <p className="text-xs text-red-600 mt-2">{erroMascara}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setModalEditarMascaraAberto(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSalvarMascara}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
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
          <a href="/lancamentos" className="flex flex-col items-center justify-center flex-1 h-full text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            <span className="text-xs mt-1">Lançar</span>
          </a>
          <a href="/configuracoes" className="flex flex-col items-center justify-center flex-1 h-full text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="text-xs mt-1">Config</span>
          </a>
        </div>
      </nav>
    </div>
  );
}
