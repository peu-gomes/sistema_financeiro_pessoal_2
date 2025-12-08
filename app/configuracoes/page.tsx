'use client';

import { useState, useEffect } from 'react';
import { getConfiguracoes, saveConfiguracoes } from '@/lib/api';
import { getMascaraPadrao, validarMascara } from '@/lib/maskUtils';
import { useTheme } from '@/contexts/ThemeContext';
import Header from '@/components/Header';

export default function Configuracoes() {
  const { tema, setTema } = useTheme();
  const [permitirContasRaiz, setPermitirContasRaiz] = useState(false);
  const [mascara, setMascara] = useState(getMascaraPadrao().mascara);
  const [mounted, setMounted] = useState(false);
  const [modalEditarMascaraAberto, setModalEditarMascaraAberto] = useState(false);
  const [novaMascara, setNovaMascara] = useState('');
  const [erroMascara, setErroMascara] = useState('');

  useEffect(() => {
    // Carregar configuração da API
    const carregarConfiguracoes = async () => {
      try {
        const config = await getConfiguracoes();
        setPermitirContasRaiz(config.permitirCriarContasRaiz);
        
        // Carregar máscara do localStorage
        const mascaraSalva = localStorage.getItem('mascara');
        if (mascaraSalva) {
          setMascara(mascaraSalva);
        }
        
        setMounted(true);
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        setMounted(true);
      }
    };

    carregarConfiguracoes();
  }, []);

  const handleToggleContasRaiz = async () => {
    const novoValor = !permitirContasRaiz;
    setPermitirContasRaiz(novoValor);
    
    try {
      await saveConfiguracoes({
        id: 'config',
        permitirCriarContasRaiz: novoValor
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      // Reverte mudança em caso de erro
      setPermitirContasRaiz(!novoValor);
    }
  };

  const handleAbrirModalMascara = () => {
    setNovaMascara(mascara);
    setErroMascara('');
    setModalEditarMascaraAberto(true);
  };

  const handleSalvarMascara = () => {
    setErroMascara('');

    if (!novaMascara.trim()) {
      setErroMascara('Máscara é obrigatória');
      return;
    }

    if (!validarMascara(novaMascara)) {
      setErroMascara('Máscara inválida. Formato: apenas 9 (dígito) e . (ponto). Exemplo: 9.9.99.999');
      return;
    }

    setMascara(novaMascara);
    localStorage.setItem('mascara', novaMascara);
    setModalEditarMascaraAberto(false);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-0">
      {/* Header */}
      <Header />

      {/* Navigation Desktop */}
      <nav className="bg-white border-b border-gray-200 hidden md:block">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            <a href="/" className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 hover:border-gray-300 border-b-2 border-transparent whitespace-nowrap">Dashboard</a>
            <a href="/plano-de-contas" className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 hover:border-gray-300 border-b-2 border-transparent whitespace-nowrap">Plano de Contas</a>
            <a href="/planejamento" className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 hover:border-gray-300 border-b-2 border-transparent whitespace-nowrap">Planejamento</a>
            <a href="/lancamentos" className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 hover:border-gray-300 border-b-2 border-transparent whitespace-nowrap">Lançamentos</a>
            <a href="/configuracoes" className="px-4 py-3 text-sm font-medium text-blue-600 border-b-2 border-blue-600 whitespace-nowrap">Configurações</a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Configurações
          </h2>

          {/* Plano de Contas Section */}
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Plano de Contas
              </h3>

              {/* Máscara de Codificação */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Máscara de Codificação
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Define o formato dos códigos das contas (ex: 9.9.99.999)
                    </p>
                    <code className="bg-white px-3 py-1.5 rounded border border-gray-300 text-sm font-mono text-gray-800">
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
                  onClick={handleToggleContasRaiz}
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
