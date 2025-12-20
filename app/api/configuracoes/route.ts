import { NextResponse } from 'next/server'
import { getOrSeed, setJSON, KV_KEYS } from '@/lib/kv'

type Configuracoes = {
  id: string
  permitirCriarContasRaiz: boolean
  tema?: 'light' | 'dark' | 'system'
  iconesCategoria?: {
    ativo?: string
    passivo?: string
    patrimonio?: string
    receita?: string
    despesa?: string
  }
  autoPatterns?: any[]
  contasBancarias?: any[]
}

const DEFAULT_CONFIG: Configuracoes = {
  id: 'config',
  permitirCriarContasRaiz: false,
  autoPatterns: [],
  contasBancarias: [],
}

export async function GET() {
  try {
    const config = await getOrSeed<Configuracoes>(
      KV_KEYS.configuracoes,
      'data/configuracoes.json',
      DEFAULT_CONFIG
    )
    return NextResponse.json(config)
  } catch (error) {
    console.error('Erro ao buscar configurações:', error)
    return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const config = (await request.json()) as Configuracoes
    await setJSON(KV_KEYS.configuracoes, config)
    return NextResponse.json(config)
  } catch (error) {
    console.error('Erro ao salvar configurações:', error)
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 })
  }
}
