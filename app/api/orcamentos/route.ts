import { NextResponse } from 'next/server'
import { getOrSeed, setJSON, KV_KEYS } from '@/lib/kv'

type ItemOrcamento = {
  id: string
  contaCodigo: string
  contaNome: string
  categoria: 'receita' | 'despesa'
  valorPlanejado: number
  periodicidade: 'mensal' | 'anual' | 'semanal' | 'quinzenal' | 'trimestral' | 'semestral'
  ativo: boolean
  diaVencimento?: number
  observacao?: string
}

type Orcamento = {
  id: string
  tipo: 'fixo' | 'mensal'
  nome: string
  mes?: number
  ano?: number
  itens: ItemOrcamento[]
  criadoEm: string
  atualizadoEm?: string
}

async function readOrcamentos(): Promise<Orcamento[]> {
  const data = await getOrSeed<Orcamento[]>(KV_KEYS.orcamentos, 'data/orcamentos.json', [])
  return Array.isArray(data) ? data : []
}

async function writeOrcamentos(data: Orcamento[]) {
  await setJSON<Orcamento[]>(KV_KEYS.orcamentos, data)
}

export async function GET() {
  try {
    const orcamentos = await readOrcamentos()
    return NextResponse.json(orcamentos)
  } catch (error) {
    console.error('Erro ao buscar orçamentos:', error)
    return NextResponse.json({ error: 'Erro ao buscar orçamentos' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const orcamento = (await request.json()) as Orcamento
    const orcamentos = await readOrcamentos()
    const index = orcamentos.findIndex((o) => o.id === orcamento.id)
    if (index >= 0) {
      orcamentos[index] = { ...orcamento, atualizadoEm: new Date().toISOString() }
    } else {
      orcamentos.push({
        ...orcamento,
        id: orcamento.id || Date.now().toString(),
        criadoEm: new Date().toISOString(),
      })
    }
    await writeOrcamentos(orcamentos)
    return NextResponse.json(orcamento)
  } catch (error) {
    console.error('Erro ao salvar orçamento:', error)
    return NextResponse.json({ error: 'Erro ao salvar orçamento' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = (await request.json()) as { id: string }
    const orcamentos = await readOrcamentos()
    const filtered = orcamentos.filter((o) => o.id !== id)
    await writeOrcamentos(filtered)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar orçamento:', error)
    return NextResponse.json({ error: 'Erro ao deletar orçamento' }, { status: 500 })
  }
}
