import { NextResponse } from 'next/server'
import { getOrSeed, setJSON, KV_KEYS, getJSON } from '@/lib/kv'

type ContaBancaria = {
  id: string
  codigo: string
  nome: string
  tipoCC: 'sintetica' | 'analitica'
  categoria: 'ativo' | 'passivo' | 'patrimonio' | 'receita' | 'despesa'
  ativa: boolean
  subcontas?: ContaBancaria[]
}

export async function GET() {
  try {
    // planto-de-contas.json pode ser {contas: []} ou [] — normalizamos para array
    const raw = await getOrSeed<any>(KV_KEYS.contas, 'data/plano-de-contas.json', [])
    console.log('[DEBUG][GET] Conteúdo bruto do plano de contas:', JSON.stringify(raw).slice(0, 500))
    const contas: ContaBancaria[] = Array.isArray(raw) ? raw : raw?.contas ?? []
    if (!Array.isArray(contas)) {
      console.error('[ERRO][GET] Formato inesperado do plano de contas:', raw)
      return NextResponse.json({ error: 'Formato inesperado do plano de contas', raw }, { status: 500 })
    }
    return NextResponse.json(contas)
  } catch (error: any) {
    console.error('[ERRO][GET] Erro ao buscar plano de contas:', error?.message, error)
    return NextResponse.json({ error: 'Erro ao buscar plano de contas', details: error?.message, stack: error?.stack }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const bodyText = await request.text();
    console.log('[DEBUG][PUT] Body recebido:', bodyText.slice(0, 500));
    let body;
    try {
      body = JSON.parse(bodyText);
    } catch (parseError) {
      const errMsg = (parseError instanceof Error) ? parseError.message : String(parseError);
      console.error('[ERRO][PUT] Erro de parsing do JSON:', parseError, bodyText);
      return NextResponse.json({ error: 'JSON inválido', details: errMsg }, { status: 400 });
    }
    const contas: ContaBancaria[] = Array.isArray(body) ? body : body?.contas;
    if (!Array.isArray(contas)) {
      console.error('[ERRO][PUT] Formato inválido do body:', body);
      return NextResponse.json({ error: 'Formato inválido', body }, { status: 400 });
    }
    await setJSON<ContaBancaria[]>(KV_KEYS.contas, contas);
    console.log('[DEBUG][PUT] Plano de contas salvo com sucesso. Total de contas:', contas.length);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[ERRO][PUT] Erro ao salvar plano de contas:', error?.message, error);
    return NextResponse.json({ error: 'Erro ao salvar plano de contas', details: error?.message, stack: error?.stack }, { status: 500 });
  }
}
