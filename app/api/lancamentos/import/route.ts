import { NextResponse } from 'next/server'
import { getOrSeed, setJSON, KV_KEYS } from '@/lib/kv'

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const lancamentosImportados: Partial<Lancamento>[] = Array.isArray(body?.lancamentos) ? body.lancamentos : [];
    if (lancamentosImportados.length === 0) {
      return NextResponse.json({ error: 'Nenhum lançamento fornecido para importação' }, { status: 400 });
    }
    const lancamentos = await readLancamentos();
    const agora = Date.now();

    // Códigos padrão para "sem categorização"
    const CONTA_SEM_CATEG_DESPESA = '4.999.01';
    const NOME_SEM_CATEG_DESPESA = 'Sem Categorização (Despesa)';
    const CONTA_SEM_CATEG_RECEITA = '3.999.01';
    const NOME_SEM_CATEG_RECEITA = 'Sem Categorização (Receita)';

    function categorizarPartida(partida: any) {
      if (!partida.contaCodigo || !partida.contaNome) {
        // Heurística simples: se for crédito, assume receita; débito, despesa
        if (partida.natureza === 'credito') {
          return {
            ...partida,
            contaCodigo: CONTA_SEM_CATEG_RECEITA,
            contaNome: NOME_SEM_CATEG_RECEITA,
          };
        } else {
          return {
            ...partida,
            contaCodigo: CONTA_SEM_CATEG_DESPESA,
            contaNome: NOME_SEM_CATEG_DESPESA,
          };
        }
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
