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
    const contas: ContaBancaria[] = Array.isArray(raw) ? raw : raw?.contas ?? []
    return NextResponse.json(contas)
  } catch (error) {
    console.error('Erro ao buscar plano de contas:', error)
    return NextResponse.json({ error: 'Erro ao buscar plano de contas' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const contas: ContaBancaria[] = Array.isArray(body) ? body : body?.contas
    if (!Array.isArray(contas)) {
      return NextResponse.json({ error: 'Formato inválido' }, { status: 400 })
    }
    await setJSON<ContaBancaria[]>(KV_KEYS.contas, contas)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao salvar plano de contas:', error)
    return NextResponse.json({ error: 'Erro ao salvar plano de contas' }, { status: 500 })
  }
}
