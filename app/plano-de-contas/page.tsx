'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import FilterBar from '@/components/FilterBar';
import { useScrollCompact } from '@/lib/hooks/useScrollCompact';
import { 
  validarCodigo, 
  gerarProximoCodigo, 
  getMascaraPadrao, 
  getMascaraDescricao,
  getNivelCodigo,
  getCodigoPai,
  gerarExemploCodigo,
  formatarCodigoComMascara,
  isCodigoCompleto,
  validarMascara
} from '@/lib/maskUtils';
import { getIconeCategoria, ICONES_PADRAO } from '@/lib/iconesUtils';
import { getContas, saveContas, getConfiguracoes } from '@/lib/api';
import type { ContaBancaria } from '@/lib/api';

interface SugestaoIA {
  id: string;
  nome: string;
  categoria: ContaBancaria['categoria'];
  tipoCC: 'sintetica' | 'analitica';
  parentId: string;
  motivo: string;
  codigo?: string;
}

interface AiMensagem {
  id: string;
  autor: 'usuario' | 'assistente';
  texto: string;
  sugestoes?: SugestaoIA[];
}

interface PreviewIA {
  nome: string;
  tipo: 'sintetica' | 'analitica';
  categoria: ContaBancaria['categoria'];
  parentNome: string;
  codigoPrevisto: string;
}

type ContaComPreview = ContaBancaria & { isPreview?: boolean };

// Tipos
interface FormData {
  nome: string;
  codigo: string;
}

// Dados iniciais - removidos, serão carregados da API

// Componentes auxiliares
const IconeCategoria = ({ categoria, iconesCustomizados }: { categoria: string; iconesCustomizados?: Record<string, string> }) => {
  const iconeSvg = iconesCustomizados?.[categoria] || getIconeCategoria(categoria as any);
  
  return (
    <div 
      className="w-4 h-4 flex items-center justify-center" 
      dangerouslySetInnerHTML={{ __html: iconeSvg }} 
    />
  );
};

const corCategoria = (categoria: string) => {
  const cores: Record<string, string> = {
    ativo: 'text-blue-600',
    passivo: 'text-red-600',
    patrimonio: 'text-green-600',
    receita: 'text-emerald-600',
    despesa: 'text-orange-600',
  };
  return cores[categoria] || 'text-gray-600';
};

const BadgeTipoConta = ({ tipo }: { tipo: 'sintetica' | 'analitica' }) => {
  const estilos = {
    sintetica: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
    analitica: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  };
  const textos = {
    sintetica: 'Sintética',
    analitica: 'Analítica',
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${estilos[tipo]}`}>
      {textos[tipo]}
    </span>
  );
};

// Modal para editar máscara
const ModalEditarMascara = ({ 
  isOpen, 
  onClose, 
  onSalvar,
  mascaraAtual
}: any) => {
  const [novaMascara, setNovaMascara] = useState(mascaraAtual);
  const [erro, setErro] = useState('');

  useEffect(() => {
    setNovaMascara(mascaraAtual);
    setErro('');
  }, [isOpen, mascaraAtual]);

  const handleSalvar = () => {
    setErro('');

    if (!novaMascara.trim()) {
      setErro('Máscara é obrigatória');
      return;
    }

    // Usar função de validação de máscara
    if (!validarMascara(novaMascara)) {
      setErro('Máscara inválida. Formato: apenas 9 (dígito) e . (ponto). Exemplo: 9.9.99.999');
      return;
    }

    onSalvar(novaMascara);
  };

  if (!isOpen) return null;

  return (
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
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-mono placeholder:text-gray-200"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">
                Use <code className="bg-gray-100 px-1 rounded">9</code> para dígitos e <code className="bg-gray-100 px-1 rounded">.</code> como separador (ex: 9.9.99.999)
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                <strong>Aviso:</strong> Alterar a máscara pode impactar códigos existentes. Contas já cadastradas continuarão com seus códigos atuais.
              </p>
            </div>

            {erro && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{erro}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSalvar}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal para editar conta
const ModalEditarConta = ({
  isOpen,
  onClose,
  onSalvar,
  conta,
  nome,
  onNomeChange
}: any) => {
  if (!isOpen || !conta) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Editar Conta</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código
              </label>
              <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-900 font-mono">
                {conta.codigo}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Conta *
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => onNomeChange(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                autoFocus
              />
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onSalvar}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal para deletar conta
const ModalDeleteConta = ({
  isOpen,
  onClose,
  onConfirmar,
  conta,
  temFilhos
}: any) => {
  if (!isOpen || !conta) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Excluir Conta</h3>

          <div className="space-y-4">
            <p className="text-gray-700">
              Tem certeza que deseja excluir <strong>{conta.nome}</strong> ({conta.codigo})?
            </p>

            {temFilhos && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ Esta conta tem subconta(s). Escolha o que fazer:
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 mt-6">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            {temFilhos ? (
              <>
                <button
                  onClick={() => onConfirmar(false)}
                  className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                >
                  Excluir apenas esta conta (manter filhas)
                </button>
                <button
                  onClick={() => onConfirmar(true)}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Excluir esta conta e todas as filhas
                </button>
              </>
            ) : (
              <button
                onClick={() => onConfirmar(false)}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Excluir
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal para criar conta raiz
const ModalCriarContaRaiz = ({
  isOpen,
  onClose,
  onSalvar,
  mascara,
  codigosExistentes
}: any) => {
  const [nome, setNome] = useState('');
  const [codigo, setCodigo] = useState('');
  const [categoria, setCategoria] = useState<'ativo' | 'passivo' | 'patrimonio' | 'receita' | 'despesa'>('ativo');
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Gera próximo código raiz automaticamente
      const proximoCodigoRaw = gerarProximoCodigo('', codigosExistentes, mascara);
      // Formata com a máscara (apenas primeiro segmento para conta raiz)
      const proximoCodigoFormatado = formatarCodigoComMascara(proximoCodigoRaw, mascara, true);
      setCodigo(proximoCodigoFormatado);
    }
  }, [isOpen, codigosExistentes, mascara]);

  const handleCodigoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    // Auto-formata o código com a máscara (apenas primeiro segmento para conta raiz)
    const formatado = formatarCodigoComMascara(valor, mascara, true);
    setCodigo(formatado);
  };

  const handleSalvar = () => {
    setErro('');

    if (!nome.trim()) {
      setErro('Nome é obrigatório');
      return;
    }

    if (!codigo.trim() || !isCodigoCompleto(codigo)) {
      setErro('Código deve estar completo');
      return;
    }

    // Remove os _ para validar
    const codigoFinal = codigo.replace(/_/g, '');

    // Para conta raiz, valida apenas o primeiro segmento
    const primeiroSegmentoMascara = mascara.split('.')[0];
    if (codigoFinal.length !== primeiroSegmentoMascara.length) {
      setErro(`Código deve ter ${primeiroSegmentoMascara.length} dígito(s)`);
      return;
    }

    if (!/^\d+$/.test(codigoFinal)) {
      setErro('Código deve conter apenas números');
      return;
    }

    onSalvar({ 
      nome: nome.trim(), 
      codigo: codigoFinal,
      categoria 
    });
    setNome('');
    setCodigo('');
    setCategoria('ativo');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Nova Conta Raiz</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Conta *
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: RECEITAS"
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder:text-gray-200"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código (máscara: {mascara})
              </label>
              <input
                type="text"
                value={codigo}
                onChange={handleCodigoChange}
                placeholder={formatarCodigoComMascara('', mascara, true)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-mono placeholder:text-gray-200 tracking-widest"
              />
              <p className="text-xs text-gray-500 mt-1">Conta raiz: apenas o primeiro segmento da máscara</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria *
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as any)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
              >
                <option value="ativo">Ativo</option>
                <option value="passivo">Passivo</option>
                <option value="patrimonio">Patrimônio</option>
                <option value="receita">Receita</option>
                <option value="despesa">Despesa</option>
              </select>
            </div>

            {erro && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{erro}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSalvar}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Criar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal de criação rápida
const ModalCriarConta = ({ 
  isOpen, 
  onClose, 
  onSalvar, 
  codigoPai,
  mascara,
  codigosExistentes
}: any) => {
  const [nome, setNome] = useState('');
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (isOpen && codigoPai && codigosExistentes) {
      // Gera próximo código automaticamente
      const proximoCodigo = gerarProximoCodigo(codigoPai, codigosExistentes, mascara);
      setCodigo(proximoCodigo);
    } else if (isOpen) {
      setCodigo('');
    }
  }, [isOpen, codigoPai, codigosExistentes, mascara]);

  const handleCodigoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    // Auto-formata o código com a máscara
    const formatado = formatarCodigoComMascara(valor, mascara);
    setCodigo(formatado);
  };

  const handleSalvar = () => {
    setErro('');

    if (!nome.trim()) {
      setErro('Nome é obrigatório');
      return;
    }

    if (!codigo.trim() || !isCodigoCompleto(codigo)) {
      setErro('Código deve estar completo');
      return;
    }

    // Remove os _ para validar
    const codigoFinal = codigo.replace(/_/g, '');

    if (!validarCodigo(codigoFinal, mascara)) {
      setErro(`Código não segue a máscara: ${mascara}`);
      return;
    }

    onSalvar({ nome: nome.trim(), codigo: codigoFinal });
    setNome('');
    setCodigo('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Nova Conta</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Conta *
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Conta Corrente"
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder:text-gray-200"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código (máscara: {mascara})
              </label>
              <input
                type="text"
                value={codigo}
                onChange={handleCodigoChange}
                placeholder={formatarCodigoComMascara('', mascara)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-mono placeholder:text-gray-200 tracking-widest"
              />
              <p className="text-xs text-gray-500 mt-1">{getMascaraDescricao(mascara)}</p>
            </div>

            {erro && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{erro}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSalvar}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Criar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ModalAssistenteIA = ({
  isOpen,
  onClose,
  onEnviar,
  mensagens,
  sugestoes,
  mensagem,
  erro,
  jaExistentes,
  configAberto,
  onToggleConfig,
  sugestaoSelecionadaId,
  onSelectSugestao
}: any) => {
  const [texto, setTexto] = useState('');

  useEffect(() => {
    if (isOpen) setTexto('');
  }, [isOpen]);

  return (
    <div className={`fixed bottom-24 md:bottom-10 right-4 md:right-8 z-40 transition-all duration-300 ${isOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
      <div className="bg-white rounded-2xl shadow-2xl w-96 h-[600px] flex flex-col border border-gray-100">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-base font-semibold text-gray-800">Assistente IA</h3>
            <p className="text-xs text-gray-500">Diga o que criar</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleConfig}
              className={`p-2 rounded-lg transition-colors ${configAberto ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-500'}`}
              title="Configurações"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              title="Fechar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {configAberto && (
          <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 text-xs text-blue-700 flex-shrink-0">
            Ajustes rápidos (placeholder): futuras preferências ficarão aqui.
          </div>
        )}

        {/* Chat */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50/50 to-white divide-y divide-gray-100 p-3 space-y-2">
          {mensagens.length === 0 && (
            <div className="flex items-center justify-center h-full text-xs text-gray-500 text-center px-2">
              Diga o que quer criar, ex.: "assinatura disney+"
            </div>
          )}
          {mensagens.map((m: AiMensagem) => (
            <div key={m.id} className={`flex ${m.autor === 'assistente' ? 'justify-start' : 'justify-end'} gap-2`}>
              <div className={`flex flex-col gap-1.5 max-w-xs ${m.autor === 'assistente' ? '' : ''}`}>
                {/* Bolha de mensagem */}
                <div className={`px-3 py-2 rounded-2xl text-sm ${
                  m.autor === 'assistente'
                    ? 'bg-blue-100 text-blue-900 rounded-bl-none'
                    : 'bg-green-100 text-gray-900 rounded-br-none'
                }`}>
                  <div className="whitespace-pre-wrap break-words">{m.texto}</div>
                </div>

                {/* Sugestões inline */}
                {m.sugestoes && m.sugestoes.length > 0 && m.autor === 'assistente' && (
                  <div className="flex flex-col gap-1 max-w-xs">
                    {m.sugestoes.map((s: SugestaoIA) => (
                      <button
                        key={s.id}
                        onClick={() => onSelectSugestao(s.id)}
                        className={`w-full text-left px-3 py-2 border rounded-xl transition-colors text-xs ${
                          sugestaoSelecionadaId === s.id
                            ? 'bg-blue-200 border-blue-400 shadow-sm'
                            : 'bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                        }`}
                      >
                        <div className="font-semibold text-gray-800">{s.nome}</div>
                        <div className="text-gray-600 mt-0.5">{s.tipoCC === 'sintetica' ? 'Sint.' : 'Anal.'} · {s.categoria}</div>
                        {s.motivo && <div className="text-gray-500 mt-1 line-clamp-2">{s.motivo}</div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-gray-100 space-y-2 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onEnviar(texto);
                  setTexto('');
                }
              }}
              placeholder="Ex: assinatura disney+"
              className="flex-1 px-2.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
            />
            <button
              onClick={() => {
                onEnviar(texto);
                setTexto('');
              }}
              className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
            >
              Enviar
            </button>
          </div>

          {erro && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">{erro}</div>
          )}

          {mensagem && !erro && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">{mensagem}</div>
          )}

          {jaExistentes && jaExistentes.length > 0 && (
            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
              Já existe: {jaExistentes.join(', ')}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Linha de conta
const LinhaConta = ({ 
  conta, 
  nivel = 0, 
  expandidos, 
  toggleExpand,
  onEdit,
  onDelete,
  onAddSubconta,
  mascara,
  iconesCategoria
}: any) => {
  const temSubcontas = conta.subcontas && conta.subcontas.length > 0;
  const expanded = expandidos[conta.id] !== false;
  const podeAdicionarSubcontas = conta.tipoCC === 'sintetica';
  const isPreview = (conta as any).isPreview;

  return (
    <>
      <div id={conta.id} className={`border-b ${isPreview ? 'border-dashed border-green-300 bg-green-50/60 ring-2 ring-green-300 animate-pulse' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}>
        <div
          style={{ paddingLeft: `${nivel * 1.5}rem` }}
          className="py-3 px-4 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Botão expand */}
            {temSubcontas && (
              <button
                onClick={() => toggleExpand(conta.id)}
                className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
              >
                <svg
                  className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            {!temSubcontas && <div className="w-6 flex-shrink-0" />}

            {/* Ícone */}
            <div className={`${corCategoria(conta.categoria)} flex-shrink-0`}>
              <IconeCategoria categoria={conta.categoria} iconesCustomizados={iconesCategoria} />
            </div>

            {/* Código e nome */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-semibold text-sm text-gray-900">{conta.codigo}</span>
                <span className={`text-sm truncate ${conta.ativa ? 'text-gray-700' : 'text-gray-400 line-through'}`}>
                  {conta.nome}
                </span>
                {isPreview && (
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-semibold animate-pulse">✨ Prévia</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <BadgeTipoConta tipo={conta.tipoCC} />
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className={`flex gap-1 flex-shrink-0 ml-2 ${isPreview ? 'bg-green-50 px-2 py-1 rounded-lg border border-green-200 gap-2' : 'opacity-60 group-hover:opacity-100 transition-opacity'}`}>
            {isPreview ? (
              <>
                <button
                  onClick={() => onAddSubconta(conta)}
                  title="Confirmar inclusão"
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-medium"
                >
                  ✓ Confirmar
                </button>
                <button
                  onClick={() => onDelete(conta.id)}
                  title="Cancelar prévia"
                  className="px-3 py-1 text-xs border border-green-300 text-green-700 rounded hover:bg-green-100 transition-colors font-medium"
                >
                  ✕ Cancelar
                </button>
              </>
            ) : (
              <>
                {podeAdicionarSubcontas && (
                  <button
                    onClick={() => onAddSubconta(conta)}
                    title="Adicionar subconta"
                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => onEdit(conta)}
                  title="Editar"
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => onDelete(conta.id)}
                  title="Deletar"
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Subcontas */}
      {temSubcontas && expanded && (
        <>
          {conta.subcontas.map((subconta: ContaBancaria) => (
            <LinhaConta
              key={subconta.id}
              conta={subconta}
              nivel={nivel + 1}
              expandidos={expandidos}
              toggleExpand={toggleExpand}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddSubconta={onAddSubconta}
              mascara={mascara}
              iconesCategoria={iconesCategoria}
            />
          ))}
        </>
      )}
    </>
  );
};

// Função auxiliar para coletar todos os códigos
const coletarTodosCodigos = (contas: ContaBancaria[]): string[] => {
  const codigos: string[] = [];
  
  const percorrer = (contas: ContaBancaria[]) => {
    for (const conta of contas) {
      codigos.push(conta.codigo);
      if (conta.subcontas && conta.subcontas.length > 0) {
        percorrer(conta.subcontas);
      }
    }
  };
  
  percorrer(contas);
  return codigos;
};

const normalizar = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const localizarConta = (
  contas: ContaBancaria[],
  criterio: (c: ContaBancaria) => boolean,
  parent: ContaBancaria | null = null
): { conta: ContaBancaria; parent: ContaBancaria | null } | null => {
  for (const conta of contas) {
    if (criterio(conta)) {
      return { conta, parent };
    }
    if (conta.subcontas) {
      const encontrada = localizarConta(conta.subcontas, criterio, conta);
      if (encontrada) return encontrada;
    }
  }
  return null;
};

const encontrarContaPorId = (contas: ContaBancaria[], id: string): ContaBancaria | null => {
  for (const conta of contas) {
    if (conta.id === id) return conta;
    if (conta.subcontas) {
      const encontrada = encontrarContaPorId(conta.subcontas, id);
      if (encontrada) return encontrada;
    }
  }
  return null;
};

const encontrarRootPorCategoria = (
  contas: ContaBancaria[],
  categoria: ContaBancaria['categoria']
): ContaBancaria | null => localizarConta(contas, (c) => c.categoria === categoria && !c.codigo.includes('.'))?.conta || null;

const existeContaPorNome = (contas: ContaBancaria[], nome: string) =>
  !!localizarConta(contas, (c) => normalizar(c.nome) === normalizar(nome));

const deduzirCategoria = (texto: string): ContaBancaria['categoria'] => {
  const t = normalizar(texto);
  if (/(receita|salario|venda|bonus|comissao|renda)/.test(t)) return 'receita';
  if (/(investimento|aplicar|tesouro|acao|imovel)/.test(t)) return 'ativo';
  if (/(divida|emprestimo|cartao|financiamento|passivo)/.test(t)) return 'passivo';
  return 'despesa';
};

const deduzirGrupo = (texto: string, categoria: ContaBancaria['categoria']) => {
  const t = normalizar(texto);
  if (categoria === 'despesa') {
    if (/(assinatura|streaming|netflix|spotify|disney|prime|hbo)/.test(t)) return 'Assinaturas e Serviços';
    if (/(transporte|combustivel|uber|metro|onibus)/.test(t)) return 'Transporte Variável';
    if (/(energia|luz|agua|aluguel|condominio)/.test(t)) return 'Moradia';
    if (/(curso|faculdade|escola|livro)/.test(t)) return 'Educação';
    if (/(plano de saude|medico|dentista|farmacia)/.test(t)) return 'Saúde';
    if (/(viagem|lazer|cinema|jogos)/.test(t)) return 'Lazer e Entretenimento';
    return 'Outras Despesas';
  }
  if (categoria === 'receita') {
    if (/(freela|freelance|servico)/.test(t)) return 'Receitas de Serviços';
    if (/(aluguel|renda passiva)/.test(t)) return 'Outras Receitas';
    return 'Receitas do Trabalho';
  }
  if (categoria === 'ativo') {
    if (/(investimento|tesouro|cdb|fundos|acoes)/.test(t)) return 'Investimentos';
    return 'Disponibilidades';
  }
  if (categoria === 'passivo') {
    if (/(cartao)/.test(t)) return 'Cartões de Crédito';
    return 'Empréstimos a Pagar';
  }
  return 'Patrimônio Líquido';
};

const gerarNomeContaDoPrompt = (texto: string) => {
  const limpo = texto.replace(/\b(criar|nova|novo|conta|uma|um|de|para)\b/gi, '').trim();
  if (!limpo) return 'Conta Sugestão';
  return limpo
    .split(/\s+/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
};

const gerarSugestoesAPartirDoPrompt = (
  prompt: string,
  contas: ContaBancaria[],
  contadorAtual: number
): { sugestoes: SugestaoIA[]; mensagem: string; jaExistem: string[] } => {
  const categoria = deduzirCategoria(prompt);
  const grupo = deduzirGrupo(prompt, categoria);
  const nomeConta = gerarNomeContaDoPrompt(prompt);
  const root = encontrarRootPorCategoria(contas, categoria) || contas[0];
  if (!root) {
    return { sugestoes: [], mensagem: 'Plano de contas vazio.', jaExistem: [] };
  }
  const alvoGrupo = localizarConta(contas, (c) => normalizar(c.nome).includes(normalizar(grupo)));

  const sugestoes: SugestaoIA[] = [];
  const jaExistem: string[] = [];

  let parentId = root?.id;
  let parentNome = root?.nome || 'Plano de Contas';

  if (alvoGrupo) {
    const { conta, parent } = alvoGrupo;
    const destino = conta.tipoCC === 'sintetica' ? conta : parent || root;
    parentId = destino?.id || parentId;
    parentNome = destino?.nome || parentNome;
  } else if (root) {
    const novoId = `ai-${Date.now()}-${contadorAtual + sugestoes.length}`;
    sugestoes.push({
      id: novoId,
      nome: grupo,
      categoria,
      tipoCC: 'sintetica',
      parentId: root.id,
      motivo: `Criar agrupador "${grupo}" em ${root.nome}`
    });
    parentId = novoId;
    parentNome = grupo;
  }

  if (existeContaPorNome(contas, nomeConta)) {
    jaExistem.push(nomeConta);
  } else if (parentId) {
    sugestoes.push({
      id: `ai-${Date.now()}-${contadorAtual + sugestoes.length}`,
      nome: nomeConta,
      categoria,
      tipoCC: 'analitica',
      parentId,
      motivo: `Adicionar em ${parentNome}`
    });
  }

  const mensagemBase = jaExistem.length
    ? `${nomeConta} já existe no plano.`
    : `Vamos criar em ${parentNome} (${categoria}).`;

  return { sugestoes, mensagem: mensagemBase, jaExistem };
};

const inserirPreviewNaArvore = (
  contas: ContaBancaria[],
  preview: ContaComPreview,
  parentId: string
): ContaBancaria[] => {
  const clonar = (lista: ContaBancaria[]): ContaBancaria[] =>
    lista.map((c) => ({ ...c, subcontas: c.subcontas ? clonar(c.subcontas) : undefined }));

  const adicionar = (lista: ContaBancaria[]): ContaBancaria[] => {
    return lista.map((c) => {
      if (c.id === parentId) {
        const sub = c.subcontas ? [...c.subcontas, preview] : [preview];
        return { ...c, subcontas: sub };
      }
      if (c.subcontas) {
        return { ...c, subcontas: adicionar(c.subcontas) };
      }
      return c;
    });
  };

  const base = clonar(contas);
  return adicionar(base);
};

const buildPreviewFromSugestao = (
  s: SugestaoIA,
  contas: ContaBancaria[],
  mascara: string
): PreviewIA => {
  const parent = encontrarContaPorId(contas, s.parentId);
  const codigoPrev = parent
    ? formatarCodigoComMascara(
        gerarProximoCodigo(parent.codigo, coletarTodosCodigos(contas), mascara),
        mascara
      )
    : '';
  return {
    nome: s.nome,
    tipo: s.tipoCC,
    categoria: s.categoria,
    parentNome: parent?.nome || '—',
    codigoPrevisto: codigoPrev
  };
};

// Página principal
export default function PlanoDeContas() {
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({});
  const [mascara, setMascara] = useState(getMascaraPadrao().mascara);
  const [modalAberto, setModalAberto] = useState(false);
  const [contaSelecionada, setContaSelecionada] = useState<ContaBancaria | null>(null);
  const [contadorId, setContadorId] = useState(1000); // Contador para IDs únicos
  const [modalEditarMascaraAberto, setModalEditarMascaraAberto] = useState(false);
  const [novaMascara, setNovaMascara] = useState(getMascaraPadrao().mascara);
  const [busca, setBusca] = useState(''); // Estado para busca/filtro
  const [filtroCategoria, setFiltroCategoria] = useState<'todos' | 'ativo' | 'passivo' | 'receita' | 'despesa'>('todos');
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [contaEditando, setContaEditando] = useState<ContaBancaria | null>(null);
  const [nomeEditando, setNomeEditando] = useState('');
  const [modalDeleteAberto, setModalDeleteAberto] = useState(false);
  const [contaDeletando, setContaDeletando] = useState<ContaBancaria | null>(null);
  const [temFilhos, setTemFilhos] = useState(false);
  const [permitirContasRaiz, setPermitirContasRaiz] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [modalCriarContaRaizAberto, setModalCriarContaRaizAberto] = useState(false);
  const [modalAssistenteAberto, setModalAssistenteAberto] = useState(false);
  const [sugestoesIA, setSugestoesIA] = useState<SugestaoIA[]>([]);
  const [aiMensagem, setAiMensagem] = useState('');
  const [aiErro, setAiErro] = useState('');
  const [jaExistentes, setJaExistentes] = useState<string[]>([]);
  const [aiMensagens, setAiMensagens] = useState<AiMensagem[]>([
    {
      id: 'welcome',
      autor: 'assistente',
      texto: 'Olá! Envie o que você precisa e eu sugiro onde criar a conta. Ex: "criar conta de assinatura spotify"'
    }
  ]);
  const [aiConfigAberto, setAiConfigAberto] = useState(false);
  const [sugestaoSelecionadaId, setSugestaoSelecionadaId] = useState<string | null>(null);
  const [previewSelecionado, setPreviewSelecionado] = useState<PreviewIA | null>(null);
  const [previewConta, setPreviewConta] = useState<{ node: ContaComPreview; parentId: string } | null>(null);
  const [iconesCategoria, setIconesCategoria] = useState<Record<string, string>>({});
  const modoCompacto = useScrollCompact(150);

  const handleSelecionarSugestao = (id: string | null) => {
    if (!id) {
      setSugestaoSelecionadaId(null);
      setPreviewSelecionado(null);
      setPreviewConta(null);
      return;
    }
    const s = sugestoesIA.find((item) => item.id === id);
    if (!s) return;
    const preview = buildPreviewFromSugestao(s, contas, mascara);
    setSugestaoSelecionadaId(id);
    setPreviewSelecionado(preview);
    const node: ContaComPreview = {
      id: `preview-${s.id}`,
      codigo: preview.codigoPrevisto,
      nome: preview.nome,
      tipoCC: preview.tipo,
      categoria: preview.categoria,
      ativa: true,
      subcontas: [],
      isPreview: true
    };
    setPreviewConta({ node, parentId: s.parentId });
    setModalAssistenteAberto(false);
    // Scroll to preview after state update
    setTimeout(() => {
      const elem = document.getElementById(`preview-${s.id}`);
      if (elem) elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  // Carregar contas da API e configurações
  useEffect(() => {
    const carregarDados = async () => {
      try {
        // Carregar contas
        const contasAPI = await getContas();
        setContas(contasAPI);

        // Carregar configurações
        const config = await getConfiguracoes();
        setPermitirContasRaiz(config.permitirCriarContasRaiz);

        // Carregar ícones customizados
        if (config.iconesCategoria) {
          setIconesCategoria(config.iconesCategoria);
        }

        // Carregar máscara do localStorage (mantido para compatibilidade)
        const mascaraSalva = localStorage.getItem('mascara');
        if (mascaraSalva) {
          setMascara(mascaraSalva);
          setNovaMascara(mascaraSalva);
        }

        setMounted(true);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setMounted(true);
      }
    };

    carregarDados();
  }, []);

  // Salvar contas na API quando houver mudanças
  useEffect(() => {
    if (!mounted || contas.length === 0) return;

    const salvarContas = async () => {
      try {
        await saveContas(contas);
      } catch (error) {
        console.error('Erro ao salvar contas:', error);
      }
    };

    salvarContas();
  }, [contas, mounted]);

  const toggleExpand = (id: string) => {
    setExpandidos(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddSubconta = (conta: ContaBancaria) => {
    // If clicking confirm on preview, apply it
    if ((conta as any).isPreview) {
      aplicarSugestoesIA(sugestaoSelecionadaId);
      return;
    }
    setContaSelecionada(conta);
    setModalAberto(true);
  };

  const handleEdit = (conta: ContaBancaria) => {
    setContaEditando(conta);
    setNomeEditando(conta.nome);
    setModalEditarAberto(true);
  };

  const handleDelete = (id: string) => {
    // Check if it's a preview
    if (previewConta?.node.id === id) {
      handleSelecionarSugestao(null);
      return;
    }

    const encontrarConta = (contas: ContaBancaria[]): ContaBancaria | null => {
      for (const conta of contas) {
        if (conta.id === id) return conta;
        if (conta.subcontas) {
          const encontrada = encontrarConta(conta.subcontas);
          if (encontrada) return encontrada;
        }
      }
      return null;
    };

    const conta = encontrarConta(contas);
    if (!conta) return;

    const temSubcontas = !!(conta.subcontas && conta.subcontas.length > 0);
    setContaDeletando(conta);
    setTemFilhos(temSubcontas);
    setModalDeleteAberto(true);
  };

  const handleConfirmarDelete = (deletarFilhos: boolean) => {
    if (!contaDeletando) return;

    setContas(prevContas => {
      const deletar = (contas: ContaBancaria[], parentId?: string): ContaBancaria[] => {
        return contas.filter(conta => {
          if (conta.id === contaDeletando.id) {
            return false; // Remove a conta
          }
          if (conta.subcontas) {
            if (deletarFilhos) {
              // Remove todas as subcontas da conta deletada
              conta.subcontas = conta.subcontas.filter(sub => sub.id !== contaDeletando.id);
            }
            conta.subcontas = deletar(conta.subcontas, conta.id);
          }
          return true;
        });
      };
      return deletar(prevContas);
    });

    setModalDeleteAberto(false);
    setContaDeletando(null);
  };

  const handleCriarContaRaiz = (dados: { nome: string; codigo: string; categoria: string }) => {
    const novaContaRaiz: ContaBancaria = {
      id: `root-${contadorId}`,
      codigo: dados.codigo,
      nome: dados.nome,
      tipoCC: 'sintetica', // Conta raiz é sempre sintética
      categoria: dados.categoria as any,
      ativa: true,
      subcontas: []
    };

    setContas(prevContas => [...prevContas, novaContaRaiz]);
    setContadorId(prev => prev + 1);
    setModalCriarContaRaizAberto(false);
  };

  const handleSalvarEdicao = () => {
    if (!contaEditando || !nomeEditando.trim()) return;
    
    setContas(prevContas => {
      const atualizar = (contas: ContaBancaria[]): ContaBancaria[] => {
        return contas.map(conta => {
          if (conta.id === contaEditando.id) {
            return { ...conta, nome: nomeEditando.trim() };
          }
          if (conta.subcontas) {
            return { ...conta, subcontas: atualizar(conta.subcontas) };
          }
          return conta;
        });
      };
      return atualizar(prevContas);
    });
    
    setModalEditarAberto(false);
    setContaEditando(null);
  };

  const handleSalvarConta = ({ nome, codigo }: FormData) => {
    if (!contaSelecionada) return;

    const novoId = `conta-${contadorId}`;
    setContadorId(prev => prev + 1);

    // Determina tipoCC automaticamente pela máscara
    const mascaraConfig = configuracoes?.mascaraContas || getMascaraPadrao().mascara;
    const tipoCC = isCodigoCompleto(codigo) ? 'analitica' : 'sintetica';
    const novaConta: ContaBancaria = {
      id: novoId,
      codigo,
      nome,
      tipoCC,
      categoria: contaSelecionada.categoria,
      ativa: true
    };

    // Adicionar ao estado (implementar recursão depois)
    setContas(prevContas => {
      // Deep clone
      const novasContas = JSON.parse(JSON.stringify(prevContas));
      
      // Encontrar conta pai e adicionar subconta
      const encontrarEAdicionar = (contas: ContaBancaria[], idPai: string): boolean => {
        for (let conta of contas) {
          if (conta.id === idPai) {
            if (!conta.subcontas) conta.subcontas = [];
            conta.subcontas.push(novaConta);
            return true;
          }
          if (conta.subcontas && encontrarEAdicionar(conta.subcontas, idPai)) {
            return true;
          }
        }
        return false;
      };

      encontrarEAdicionar(novasContas, contaSelecionada.id);
      return novasContas;
    });

    setModalAberto(false);
    setContaSelecionada(null);
  };

  // Função para filtrar contas por busca (recursiva)
  const filtrarContas = (contas: ContaBancaria[], termoBusca: string): ContaBancaria[] => {
    const termo = termoBusca.toLowerCase().trim();
    
    if (!termo) return contas; // Se vazio, retorna todas

    return contas.filter(conta => {
      // Verifica se nome ou código contêm o termo
      const contemBusca = 
        conta.nome.toLowerCase().includes(termo) || 
        conta.codigo.toLowerCase().includes(termo);

      // Filtra subcontas recursivamente
      const subcontasFiltradas = conta.subcontas 
        ? filtrarContas(conta.subcontas, termoBusca)
        : [];

      // Mantém conta se: contém busca OU tem subcontas que contêm busca
      return contemBusca || subcontasFiltradas.length > 0;
    }).map(conta => {
      // Se tem subcontas, filtra elas também
      if (conta.subcontas) {
        return {
          ...conta,
          subcontas: filtrarContas(conta.subcontas, termoBusca)
        };
      }
      return conta;
    });
  };

  const contas_filtradas_base = filtrarContas(contas, busca);
  
  // Aplicar filtro de categoria
  const aplicarFiltroCategoria = (contas: ContaBancaria[]): ContaBancaria[] => {
    if (filtroCategoria === 'todos') return contas;
    
    const resultado: ContaBancaria[] = [];
    
    for (const conta of contas) {
      const subcontasFiltradas = conta.subcontas ? aplicarFiltroCategoria(conta.subcontas) : [];
      
      // Incluir conta se ela mesma corresponde ao filtro OU tem subcontas que correspondem
      if (conta.categoria === filtroCategoria || subcontasFiltradas.length > 0) {
        resultado.push({
          ...conta,
          subcontas: subcontasFiltradas.length > 0 ? subcontasFiltradas : conta.subcontas
        });
      }
    }
    
    return resultado;
  };
  
  const contas_filtradas_categoria = aplicarFiltroCategoria(contas_filtradas_base);
  const contas_filtradas: ContaBancaria[] = previewConta
    ? inserirPreviewNaArvore(contas_filtradas_categoria, previewConta.node, previewConta.parentId)
    : contas_filtradas_categoria;

  // Auto-expandir quando há busca ativa ou filtro de categoria
  useEffect(() => {
    if (busca.trim() || filtroCategoria !== 'todos') {
      // Coleta IDs de todas as contas que devem estar expandidas
      const coletarIdsComFiltro = (contas: ContaBancaria[], termo: string): Set<string> => {
        const ids = new Set<string>();
        
        const processar = (contas: ContaBancaria[]) => {
          for (const conta of contas) {
            const temSubcontasComFiltro = conta.subcontas?.some(s => 
              s.nome.toLowerCase().includes(termo.toLowerCase()) ||
              s.codigo.toLowerCase().includes(termo.toLowerCase())
            );
            
            const temSubcontasCategoria = filtroCategoria !== 'todos' && conta.subcontas?.some(s => 
              s.categoria === filtroCategoria
            );
            
            if (temSubcontasComFiltro || temSubcontasCategoria) {
              ids.add(conta.id);
            }
            
            if (conta.subcontas) {
              processar(conta.subcontas);
            }
          }
        };
        
        processar(contas);
        return ids;
      };

      const idsParaExpandir = coletarIdsComFiltro(contas, busca);
      const novoExpandidos: Record<string, boolean> = {};
      idsParaExpandir.forEach(id => {
        novoExpandidos[id] = true;
      });
      setExpandidos(prev => ({ ...prev, ...novoExpandidos }));
    }
  }, [busca, filtroCategoria, contas]);

  const handleSalvarMascara = (novaM: string) => {
    setMascara(novaM);
    localStorage.setItem('mascara', novaM);
    setModalEditarMascaraAberto(false);
  };

  const handleRename = (id: string, novoNome: string) => {
    setContas(prevContas => {
      const atualizarConta = (contas: ContaBancaria[]): ContaBancaria[] => {
        return contas.map(conta => {
          if (conta.id === id) {
            return { ...conta, nome: novoNome };
          }
          if (conta.subcontas) {
            return { ...conta, subcontas: atualizarConta(conta.subcontas) };
          }
          return conta;
        });
      };
      return atualizarConta(prevContas);
    });
  };

  const handleEnviarMensagemIA = (textoEntrada: string) => {
    setAiErro('');
    setAiMensagem('');
    setJaExistentes([]);

    if (!textoEntrada.trim()) {
      setAiErro('Descreva o que você precisa criar.');
      return;
    }

    if (!contas.length) {
      setAiErro('Carregue o plano de contas antes de pedir sugestões.');
      return;
    }

    const textoUsuario = textoEntrada.trim();
    setAiMensagens((prev) => [...prev, { id: `u-${Date.now()}`, autor: 'usuario', texto: textoUsuario }]);

    const resultado = gerarSugestoesAPartirDoPrompt(textoUsuario, contas, contadorId);
    setSugestoesIA(resultado.sugestoes);
    setAiMensagem(resultado.mensagem);
    setJaExistentes(resultado.jaExistem);

    setPreviewSelecionado(null);
    setSugestaoSelecionadaId(null);

    const resposta = resultado.sugestoes.length
      ? `Sugeri ${resultado.sugestoes.length} conta(s). ${resultado.mensagem}`
      : resultado.mensagem || 'Nada para sugerir agora.';

    setAiMensagens((prev) => [
      ...prev,
      { 
        id: `a-${Date.now()}`, 
        autor: 'assistente', 
        texto: resposta,
        sugestoes: resultado.sugestoes.length > 0 ? resultado.sugestoes : undefined
      }
    ]);

  };

  const aplicarSugestoesIA = (somenteId?: string | null) => {
    if (!sugestoesIA.length && !somenteId) return;

    const alvo = somenteId ? sugestoesIA.filter((s) => s.id === somenteId) : sugestoesIA;
    if (!alvo.length) return;

    setContas(prev => {
      const novas = JSON.parse(JSON.stringify(prev)) as ContaBancaria[];
      const inserir = (s: SugestaoIA) => {
        const parent = encontrarContaPorId(novas, s.parentId);
        if (!parent || parent.tipoCC !== 'sintetica') return;
        const codigo = gerarProximoCodigo(parent.codigo, coletarTodosCodigos(novas), mascara);
        const novaConta: ContaBancaria = {
          id: s.id,
          codigo,
          nome: s.nome,
          tipoCC: s.tipoCC,
          categoria: s.categoria,
          ativa: true,
          subcontas: s.tipoCC === 'sintetica' ? [] : undefined
        };
        if (!parent.subcontas) parent.subcontas = [];
        parent.subcontas.push(novaConta);
      };

      const ordenadas = [...alvo].sort((a, b) =>
        a.tipoCC === b.tipoCC ? 0 : a.tipoCC === 'sintetica' ? -1 : 1
      );
      ordenadas.forEach(inserir);
      return novas;
    });

    setContadorId(prev => prev + alvo.length);
    if (!somenteId) setSugestoesIA([]);
    setAiMensagem('Sugestões aplicadas com sucesso');
    setAiMensagens((prev) => [
      ...prev,
      { id: `a-${Date.now()}-aplicado`, autor: 'assistente', texto: 'Sugestões aplicadas com sucesso.' }
    ]);
    if (somenteId) {
      setSugestoesIA((prev) => prev.filter((s) => s.id !== somenteId));
      setSugestaoSelecionadaId(null);
      setPreviewSelecionado(null);
      setPreviewConta(null);
    }
  };

  // Calcular estatísticas para resumo
  const contarContas = (lista: ContaBancaria[]): number => {
    let total = 0;
    lista.forEach(conta => {
      total += 1;
      if (conta.subcontas) {
        total += contarContas(conta.subcontas);
      }
    });
    return total;
  };

  const contarPorCategoria = (lista: ContaBancaria[], cat: string): number => {
    let total = 0;
    lista.forEach(conta => {
      if (conta.categoria === cat) total += 1;
      if (conta.subcontas) {
        total += contarPorCategoria(conta.subcontas, cat);
      }
    });
    return total;
  };

  const totalContas = contarContas(contas);
  const totalAnaliticas = contas.reduce((acc, c) => {
    const contar = (conta: ContaBancaria): number => {
      let total = conta.tipoCC === 'analitica' ? 1 : 0;
      if (conta.subcontas) {
        conta.subcontas.forEach(sub => total += contar(sub));
      }
      return total;
    };
    return acc + contar(c);
  }, 0);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-0">
      <Header />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <FilterBar
          compact={modoCompacto}
          topClassName="top-0 md:top-[65px]"
          primary={
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {mounted && permitirContasRaiz && (
                  <button
                    onClick={() => setModalCriarContaRaizAberto(true)}
                    className={`bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium flex items-center gap-2 whitespace-nowrap ${
                      modoCompacto ? 'px-3 py-1.5' : 'px-4 py-2'
                    }`}
                    title="Criar nova conta raiz"
                  >
                    <svg
                      className={`transition-all ${modoCompacto ? 'w-3.5 h-3.5' : 'w-4 h-4'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {!modoCompacto && 'Nova Conta Raiz'}
                  </button>
                )}
                <div className="flex-1" />
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder={modoCompacto ? 'Buscar...' : 'Buscar por nome ou código...'}
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className={`w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400 transition-all ${
                    modoCompacto ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'
                  }`}
                />
                {busca && (
                  <button
                    onClick={() => setBusca('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    title="Limpar busca"
                  >
                    <svg
                      className={`transition-all ${modoCompacto ? 'w-4 h-4' : 'w-5 h-5'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          }
          secondary={
            <div className="flex flex-nowrap gap-2 overflow-x-auto">
              <button
                onClick={() => setFiltroCategoria('todos')}
                className={`flex items-center gap-2 rounded-lg font-medium transition-all whitespace-nowrap px-3 py-1.5 text-sm ${
                  filtroCategoria === 'todos'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                <div className="rounded-full bg-current w-2 h-2" />
                Todos
              </button>
              <button
                onClick={() => setFiltroCategoria(filtroCategoria === 'ativo' ? 'todos' : 'ativo')}
                className={`flex items-center gap-2 rounded-lg font-medium transition-all whitespace-nowrap px-3 py-1.5 text-sm ${
                  filtroCategoria === 'ativo'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-blue-600 hover:bg-blue-50 border border-gray-300'
                }`}
              >
                <IconeCategoria categoria="ativo" iconesCustomizados={iconesCategoria} />
                Ativo
              </button>
              <button
                onClick={() => setFiltroCategoria(filtroCategoria === 'passivo' ? 'todos' : 'passivo')}
                className={`flex items-center gap-2 rounded-lg font-medium transition-all whitespace-nowrap px-3 py-1.5 text-sm ${
                  filtroCategoria === 'passivo'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-white text-red-600 hover:bg-red-50 border border-gray-300'
                }`}
              >
                <IconeCategoria categoria="passivo" iconesCustomizados={iconesCategoria} />
                Passivo
              </button>
              <button
                onClick={() => setFiltroCategoria(filtroCategoria === 'receita' ? 'todos' : 'receita')}
                className={`flex items-center gap-2 rounded-lg font-medium transition-all whitespace-nowrap px-3 py-1.5 text-sm ${
                  filtroCategoria === 'receita'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-emerald-600 hover:bg-emerald-50 border border-gray-300'
                }`}
              >
                <IconeCategoria categoria="receita" iconesCustomizados={iconesCategoria} />
                Receita
              </button>
              <button
                onClick={() => setFiltroCategoria(filtroCategoria === 'despesa' ? 'todos' : 'despesa')}
                className={`flex items-center gap-2 rounded-lg font-medium transition-all whitespace-nowrap px-3 py-1.5 text-sm ${
                  filtroCategoria === 'despesa'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'bg-white text-orange-600 hover:bg-orange-50 border border-gray-300'
                }`}
              >
                <IconeCategoria categoria="despesa" iconesCustomizados={iconesCategoria} />
                Despesa
              </button>
            </div>
          }
          secondaryMini={
            <div className="flex flex-nowrap gap-2 overflow-x-auto">
              <button
                onClick={() => setFiltroCategoria('todos')}
                className={`flex items-center gap-2 rounded-lg font-medium transition-all whitespace-nowrap px-3 py-1.5 text-sm ${
                  filtroCategoria === 'todos'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                <div className="rounded-full bg-current w-2 h-2" />
                Todos
              </button>
              <button
                onClick={() => setFiltroCategoria(filtroCategoria === 'ativo' ? 'todos' : 'ativo')}
                className={`flex items-center gap-2 rounded-lg font-medium transition-all whitespace-nowrap px-3 py-1.5 text-sm ${
                  filtroCategoria === 'ativo'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-blue-600 hover:bg-blue-50 border border-gray-300'
                }`}
              >
                <IconeCategoria categoria="ativo" iconesCustomizados={iconesCategoria} />
                Ativo
              </button>
              <button
                onClick={() => setFiltroCategoria(filtroCategoria === 'passivo' ? 'todos' : 'passivo')}
                className={`flex items-center gap-2 rounded-lg font-medium transition-all whitespace-nowrap px-3 py-1.5 text-sm ${
                  filtroCategoria === 'passivo'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-white text-red-600 hover:bg-red-50 border border-gray-300'
                }`}
              >
                <IconeCategoria categoria="passivo" iconesCustomizados={iconesCategoria} />
                Passivo
              </button>
              <button
                onClick={() => setFiltroCategoria(filtroCategoria === 'receita' ? 'todos' : 'receita')}
                className={`flex items-center gap-2 rounded-lg font-medium transition-all whitespace-nowrap px-3 py-1.5 text-sm ${
                  filtroCategoria === 'receita'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-emerald-600 hover:bg-emerald-50 border border-gray-300'
                }`}
              >
                <IconeCategoria categoria="receita" iconesCustomizados={iconesCategoria} />
                Receita
              </button>
              <button
                onClick={() => setFiltroCategoria(filtroCategoria === 'despesa' ? 'todos' : 'despesa')}
                className={`flex items-center gap-2 rounded-lg font-medium transition-all whitespace-nowrap px-3 py-1.5 text-sm ${
                  filtroCategoria === 'despesa'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'bg-white text-orange-600 hover:bg-orange-50 border border-gray-300'
                }`}
              >
                <IconeCategoria categoria="despesa" iconesCustomizados={iconesCategoria} />
                Despesa
              </button>
            </div>
          }
        />

        {/* Árvore */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="divide-y divide-gray-200">
            {contas_filtradas.length > 0 ? (
              contas_filtradas.map(conta => (
                <LinhaConta
                  key={conta.id}
                  conta={conta}
                  expandidos={expandidos}
                  toggleExpand={toggleExpand}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onAddSubconta={handleAddSubconta}
                  onRename={handleRename}
                  mascara={mascara}
                  iconesCategoria={iconesCategoria}
                />
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>Nenhuma conta encontrada</p>
                {busca && <p className="text-sm mt-2">Tente outro termo de busca</p>}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal */}
      <ModalCriarConta
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onSalvar={handleSalvarConta}
        codigoPai={contaSelecionada?.codigo}
        mascara={mascara}
        codigosExistentes={coletarTodosCodigos(contas)}
      />

      {/* Modal Editar Conta */}
      <ModalEditarConta
        isOpen={modalEditarAberto}
        onClose={() => setModalEditarAberto(false)}
        onSalvar={handleSalvarEdicao}
        conta={contaEditando}
        nome={nomeEditando}
        onNomeChange={setNomeEditando}
      />

      {/* Modal Deletar Conta */}
      <ModalDeleteConta
        isOpen={modalDeleteAberto}
        onClose={() => setModalDeleteAberto(false)}
        onConfirmar={handleConfirmarDelete}
        conta={contaDeletando}
        temFilhos={temFilhos}
      />

      {/* Modal Criar Conta Raiz */}
      <ModalCriarContaRaiz
        isOpen={modalCriarContaRaizAberto}
        onClose={() => setModalCriarContaRaizAberto(false)}
        onSalvar={handleCriarContaRaiz}
        mascara={mascara}
        codigosExistentes={contas.map(c => c.codigo)}
      />

      {/* Modal Editar Máscara */}
      <ModalEditarMascara
        isOpen={modalEditarMascaraAberto}
        onClose={() => setModalEditarMascaraAberto(false)}
        onSalvar={handleSalvarMascara}
        mascaraAtual={mascara}
      />

      {/* Assistente IA */}
      <ModalAssistenteIA
        isOpen={modalAssistenteAberto}
        onClose={() => setModalAssistenteAberto(false)}
        onEnviar={handleEnviarMensagemIA}
        sugestoes={sugestoesIA}
        mensagem={aiMensagem}
        erro={aiErro}
        jaExistentes={jaExistentes}
        mensagens={aiMensagens}
        configAberto={aiConfigAberto}
        onToggleConfig={() => setAiConfigAberto((v) => !v)}
        sugestaoSelecionadaId={sugestaoSelecionadaId}
        onSelectSugestao={handleSelecionarSugestao}
      />

      {/* Botão flutuante */}
      <div className={`fixed bottom-28 right-4 md:bottom-10 md:right-8 z-40 transition-all duration-300 ${!modalAssistenteAberto ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-0 pointer-events-none'}`}>
        <button
          onClick={() => setModalAssistenteAberto(true)}
          className="w-14 h-14 shadow-lg rounded-full bg-blue-600/80 backdrop-blur text-white flex items-center justify-center hover:scale-105 transition-transform"
          title="Assistente IA"
        >
          <span className="sr-only">Assistente IA</span>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
          </svg>
        </button>
      </div>



      {/* Navigation Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 [padding-bottom:max(1rem,env(safe-area-inset-bottom))]">
        {/* Resumo Compacto Mobile - Aparece ao rolar */}
        {modoCompacto && totalContas > 0 && (
          <div className="flex items-center justify-around px-3 py-1.5 text-xs bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Total:</span>
              <span className="font-semibold text-blue-600">{totalContas}</span>
            </div>
            <div className="w-px h-3 bg-gray-300"></div>
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Analít.:</span>
              <span className="font-semibold text-green-600">{totalAnaliticas}</span>
            </div>
            {busca && (
              <>
                <div className="w-px h-3 bg-gray-300"></div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">Filtro:</span>
                  <span className="font-semibold text-orange-600">{contas_filtradas.length}</span>
                </div>
              </>
            )}
          </div>
        )}
        
        <div className="flex justify-around items-center h-16">
          <a href="/" className="flex flex-col items-center justify-center flex-1 h-full text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            <span className="text-xs mt-1">Home</span>
          </a>
          <a href="/plano-de-contas" className="flex flex-col items-center justify-center flex-1 h-full text-blue-600">
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
          <a href="/configuracoes" className="flex flex-col items-center justify-center flex-1 h-full text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="text-xs mt-1">Config</span>
          </a>
        </div>
      </nav>
    </div>
  );
}
