import { NextResponse } from 'next/server'
import { getOrSeed, setJSON, KV_KEYS, getJSON } from '@/lib/kv'

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

export async function GET() {
  try {
    const lancamentos = await readLancamentos()
    return NextResponse.json(lancamentos)
  } catch (error) {
    console.error('Erro ao buscar lançamentos:', error)
    return NextResponse.json({ error: 'Erro ao buscar lançamentos' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const lancamento = (await request.json()) as Omit<Lancamento, 'id'>
    const lancamentos = await readLancamentos()
    const novo: Lancamento = {
      ...lancamento,
      id: Date.now().toString(),
      criadoEm: lancamento?.criadoEm || new Date().toISOString(),
      atualizadoEm: lancamento?.atualizadoEm || new Date().toISOString(),
    }
    lancamentos.push(novo)
    await writeLancamentos(lancamentos)
    return NextResponse.json(novo)
  } catch (error) {
    console.error('Erro ao criar lançamento:', error)
    return NextResponse.json({ error: 'Erro ao criar lançamento' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, ...updates } = (await request.json()) as Partial<Lancamento> & { id: string }
    const lancamentos = await readLancamentos()
    const index = lancamentos.findIndex((l) => l.id === id)
    if (index === -1) {
      return NextResponse.json({ error: 'Lançamento não encontrado' }, { status: 404 })
    }
    lancamentos[index] = {
      ...lancamentos[index],
      ...updates,
      atualizadoEm: new Date().toISOString(),
    }
    await writeLancamentos(lancamentos)
    return NextResponse.json(lancamentos[index])
  } catch (error) {
    console.error('Erro ao atualizar lançamento:', error)
    return NextResponse.json({ error: 'Erro ao atualizar lançamento' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = (await request.json()) as { id: string }
    const lancamentos = await readLancamentos()
    const filtered = lancamentos.filter((l) => l.id !== id)
    await writeLancamentos(filtered)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar lançamento:', error)
    return NextResponse.json({ error: 'Erro ao deletar lançamento' }, { status: 500 })
  }
}
