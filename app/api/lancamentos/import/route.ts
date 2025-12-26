"use server";
import { NextResponse } from 'next/server'
import { getOrSeed, setJSON, KV_KEYS } from '@/lib/kv'
import type { ContaBancariaImportacao } from '@/lib/api'

type Partida = {
  id: string
  contaCodigo: string
  contaNome: string
  natureza: 'debito' | 'credito'
  valor: number
}

type Lancamento = {
  id: string
  data: string
  historico: string
  documento?: string
  partidas: Partida[]
  criadoEm: string
  atualizadoEm?: string
}

async function readLancamentos(): Promise<Lancamento[]> {
  const data = await getOrSeed<Lancamento[]>(KV_KEYS.lancamentos, 'data/lancamentos.json', [])
  return Array.isArray(data) ? data : []
}

async function writeLancamentos(data: Lancamento[]) {
  await setJSON<Lancamento[]>(KV_KEYS.lancamentos, data);
}

export async function POST(request: Request) {
  let response;
  try {
    const body = await request.json();
    const lancamentosImportados: Partial<Lancamento>[] = Array.isArray(body?.lancamentos) ? body.lancamentos : [];
    if (lancamentosImportados.length === 0) {
      return NextResponse.json({ error: 'Nenhum lançamento fornecido para importação' }, { status: 400 });
    }
    const lancamentos = await readLancamentos();
    const agora = Date.now();

    // Buscar contas bancárias configuradas
    const config = await getOrSeed<any>(KV_KEYS.configuracoes, 'data/configuracoes.json', {});
    const contasBancarias: ContaBancariaImportacao[] = Array.isArray(config?.contasBancarias) ? config.contasBancarias : [];

    function getContaPadrao(natureza: 'debito' | 'credito') {
      // Procura a primeira conta bancária ativa e padrão para o tipo
      const conta = contasBancarias.find(cb => cb.ativa && cb.padrao);
      if (!conta) return { codigo: '', nome: '' };
      if (natureza === 'credito' && conta.contaPadraoReceita) {
        return { codigo: conta.contaPadraoReceita, nome: '' };
      }
      if (natureza === 'debito' && conta.contaPadraoDespesa) {
        return { codigo: conta.contaPadraoDespesa, nome: '' };
      }
      return { codigo: '', nome: '' };
    }

    function categorizarPartida(partida: any) {
      if (!partida.contaCodigo || !partida.contaNome) {
        const padrao = getContaPadrao(partida.natureza);
        return {
          ...partida,
          contaCodigo: padrao.codigo,
          contaNome: padrao.nome,
        };
      }
      return partida;
    }

    const normalizados: Lancamento[] = lancamentosImportados.map((l, idx) => {
      const partidasCorrigidas = Array.isArray(l.partidas)
        ? l.partidas.map(categorizarPartida)
        : [];
      return {
        ...(l as any),
        id: l.id || `${agora}-${idx}`,
        criadoEm: l?.criadoEm || new Date().toISOString(),
        atualizadoEm: l?.atualizadoEm || new Date().toISOString(),
        partidas: partidasCorrigidas,
      };
    }) as Lancamento[];

    lancamentos.push(...normalizados);
    await writeLancamentos(lancamentos);
    return NextResponse.json({ inseridos: normalizados.length });
  } catch (error) {
    console.error('Erro ao importar lançamentos:', error);
    return NextResponse.json({ error: 'Erro ao importar lançamentos' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server'
import { getOrSeed, setJSON, KV_KEYS } from '@/lib/kv'
import type { ContaBancariaImportacao } from '@/lib/api'

type Partida = {
  id: string
  contaCodigo: string
  contaNome: string
  natureza: 'debito' | 'credito'
  valor: number
}

type Lancamento = {
  id: string
  data: string
  historico: string
  documento?: string
  partidas: Partida[]
  criadoEm: string
  atualizadoEm?: string
}

async function readLancamentos(): Promise<Lancamento[]> {
  const data = await getOrSeed<Lancamento[]>(KV_KEYS.lancamentos, 'data/lancamentos.json', [])
  return Array.isArray(data) ? data : []
}

async function writeLancamentos(data: Lancamento[]) {
  await setJSON<Lancamento[]>(KV_KEYS.lancamentos, data)
}


  try {
    const body = await request.json();
    const lancamentosImportados: Partial<Lancamento>[] = Array.isArray(body?.lancamentos) ? body.lancamentos : [];
    if (lancamentosImportados.length === 0) {
        return NextResponse.json({ error: 'Nenhum lançamento fornecido para importação' }, { status: 400 });
    }
    const lancamentos = await readLancamentos();
    const agora = Date.now();

    // Buscar contas bancárias configuradas
    const config = await getOrSeed<any>(KV_KEYS.configuracoes, 'data/configuracoes.json', {});
    const contasBancarias: ContaBancariaImportacao[] = Array.isArray(config?.contasBancarias) ? config.contasBancarias : [];

    function getContaPadrao(natureza: 'debito' | 'credito') {
      // Procura a primeira conta bancária ativa e padrão para o tipo
      const conta = contasBancarias.find(cb => cb.ativa && cb.padrao);
      if (!conta) return { codigo: '', nome: '' };
      if (natureza === 'credito' && conta.contaPadraoReceita) {
        return { codigo: conta.contaPadraoReceita, nome: '' };
      }
      if (natureza === 'debito' && conta.contaPadraoDespesa) {
        return { codigo: conta.contaPadraoDespesa, nome: '' };
      }
      return { codigo: '', nome: '' };
    }

    function categorizarPartida(partida: any) {
      if (!partida.contaCodigo || !partida.contaNome) {
        const padrao = getContaPadrao(partida.natureza);
        return {
          ...partida,
          contaCodigo: padrao.codigo,
          contaNome: padrao.nome,
        };
      }
      return partida;
    }

    const normalizados: Lancamento[] = lancamentosImportados.map((l, idx) => {
      const partidasCorrigidas = Array.isArray(l.partidas)
        ? l.partidas.map(categorizarPartida)
        : [];
      return {
        ...(l as any),
        id: l.id || `${agora}-${idx}`,
        criadoEm: l?.criadoEm || new Date().toISOString(),
        atualizadoEm: l?.atualizadoEm || new Date().toISOString(),
        partidas: partidasCorrigidas,
      };
    }) as Lancamento[];

    lancamentos.push(...normalizados);
    await writeLancamentos(lancamentos);
      return NextResponse.json({ inseridos: normalizados.length });
  } catch (error) {
    console.error('Erro ao importar lançamentos:', error);
      return NextResponse.json({ error: 'Erro ao importar lançamentos' }, { status: 500 });
  }
}
