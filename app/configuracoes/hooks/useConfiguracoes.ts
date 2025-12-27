import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getConfiguracoes,
  saveConfiguracoes,
  getContasSupabase,
  type Configuracoes,
  type AutoPatternConfig,
  type ContaBancaria,
  type ContaBancariaImportacao,
} from '@/lib/api';
import { getMascaraPadrao } from '@/lib/maskUtils';
import { ICONES_PADRAO, type TipoCategoria } from '@/lib/iconesUtils';
import type { ContaAnaliticaResumo } from '@/types/configuracoes';

const normalizarPadroes = (padroes?: AutoPatternConfig[]) =>
  (padroes || []).map((p) => ({
    ...p,
    id: p.id || `${p.tipo}-${p.mascaraDebito}-${p.mascaraCredito}`,
  }));

export function useConfiguracoesData() {
  const [permitirContasRaiz, setPermitirContasRaiz] = useState(false);
  const [mascara, setMascara] = useState(getMascaraPadrao().mascara);
  const [iconesCategoria, setIconesCategoria] = useState<Record<TipoCategoria, string>>({ ...ICONES_PADRAO });
  const [autoPatterns, setAutoPatterns] = useState<AutoPatternConfig[]>([]);
  const [contasRaiz, setContasRaiz] = useState<ContaBancaria[]>([]);
  const [bancos, setBancos] = useState<ContaBancariaImportacao[]>([]);
  const [configBase, setConfigBase] = useState<Configuracoes | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const contasAnaliticas: ContaAnaliticaResumo[] = useMemo(() => {
    const resultado: ContaAnaliticaResumo[] = [];
    const percorrer = (conta?: ContaBancaria) => {
      if (!conta) return;
      if (!conta.subcontas || conta.subcontas.length === 0) {
        if (conta.ativa !== false) {
          resultado.push({ codigo: conta.codigo, nome: conta.nome, categoria: conta.categoria });
        }
      } else {
        conta.subcontas.forEach((sub) => percorrer(sub));
      }
    };
    contasRaiz.forEach((c) => percorrer(c));
    return resultado.sort((a, b) => a.codigo.localeCompare(b.codigo));
  }, [contasRaiz]);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const config = await getConfiguracoes();
      setConfigBase(config);
      setPermitirContasRaiz(config.permitirCriarContasRaiz);

      const mascaraSalva = typeof window !== 'undefined' ? localStorage.getItem('mascara') : null;
      if (mascaraSalva) {
        setMascara(mascaraSalva);
      } else {
        setMascara(getMascaraPadrao().mascara);
      }

      if (config.iconesCategoria) {
        setIconesCategoria(config.iconesCategoria as Record<TipoCategoria, string>);
      }

      setAutoPatterns(normalizarPadroes(config.autoPatterns));

      const contas = await getContasSupabase();
      setContasRaiz(contas);

      if (config.contasBancarias) {
        setBancos(config.contasBancarias);
      }

      setErro(null);
    } catch (e) {
      console.error('Erro ao carregar configurações:', e);
      setErro('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  }, []);

  const montarConfiguracaoPayload = useCallback(
    (override?: Partial<Configuracoes>): Configuracoes => {
      const base = configBase || {};
      return {
        ...base,
        id: (base as Configuracoes).id || 'config',
        permitirCriarContasRaiz: permitirContasRaiz,
        iconesCategoria,
        autoPatterns,
        contasBancarias: bancos,
        ...override,
      } as Configuracoes;
    },
    [autoPatterns, bancos, configBase, iconesCategoria, permitirContasRaiz],
  );

  const salvarConfiguracoes = useCallback(
    async (override?: Partial<Configuracoes>) => {
      const payload = montarConfiguracaoPayload(override);
      const salvo = await saveConfiguracoes(payload);
      setConfigBase(salvo);

      if (typeof salvo.permitirCriarContasRaiz === 'boolean') {
        setPermitirContasRaiz(salvo.permitirCriarContasRaiz);
      }
      if (salvo.iconesCategoria) {
        setIconesCategoria(salvo.iconesCategoria as Record<TipoCategoria, string>);
      }
      if (salvo.autoPatterns) {
        setAutoPatterns(normalizarPadroes(salvo.autoPatterns));
      }
      if (salvo.contasBancarias) {
        setBancos(salvo.contasBancarias);
      }

      return salvo;
    },
    [montarConfiguracaoPayload],
  );

  const salvarBancos = useCallback(
    async (bancosAtualizados: ContaBancariaImportacao[], configAtual?: Configuracoes) => {
      const base = configAtual || configBase || undefined;
      const salvo = await salvarConfiguracoes({
        ...base,
        contasBancarias: bancosAtualizados,
      });
      setBancos(salvo.contasBancarias || bancosAtualizados);
    },
    [configBase, salvarConfiguracoes],
  );

  useEffect(() => {
    carregar();
  }, [carregar]);

  return {
    permitirContasRaiz,
    setPermitirContasRaiz,
    mascara,
    setMascara,
    iconesCategoria,
    setIconesCategoria,
    autoPatterns,
    setAutoPatterns,
    contasRaiz,
    setContasRaiz,
    bancos,
    setBancos,
    contasAnaliticas,
    loading,
    erro,
    recarregar: carregar,
    salvarBancos,
    salvarConfiguracoes,
    configBase,
  } as const;
}
