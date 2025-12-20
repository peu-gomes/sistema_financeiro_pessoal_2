import { kv as vercelKv } from '@vercel/kv'
import { readFile } from 'fs/promises'
import path from 'path'

export const KV_KEYS = {
  configuracoes: 'configuracoes',
  contas: 'plano-de-contas',
  lancamentos: 'lancamentos',
  orcamentos: 'orcamentos',
} as const

export function isKvConfigured(): boolean {
  // Either serverless binding or REST credentials
  return Boolean(
    process.env.KV_URL ||
      (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
  )
}

export async function getJSON<T>(key: string): Promise<T | null> {
  if (!isKvConfigured()) return null
  try {
    const value = await vercelKv.get<T>(key)
    return (value as T) ?? null
  } catch (e) {
    return null
  }
}

export async function setJSON<T>(key: string, value: T): Promise<void> {
  if (!isKvConfigured()) {
    throw new Error('Vercel KV não configurado. Defina as variáveis KV no projeto.')
  }
  await vercelKv.set(key, value as any)
}

export async function getOrSeed<T>(
  key: string,
  seedRelativePath: string,
  fallback: T
): Promise<T> {
  // Tenta buscar no KV
  const cached = await getJSON<T>(key)
  if (cached) return cached

  // Lê arquivo público como semente
  try {
    const seedPath = path.join(process.cwd(), 'public', seedRelativePath)
    const raw = await readFile(seedPath, 'utf-8')
    const data = JSON.parse(raw) as T

    // Se possível, grava no KV para futuras leituras
    try {
      await setJSON<T>(key, data)
    } catch {
      // Ignora se KV não estiver configurado em dev
    }
    return data
  } catch {
    return fallback
  }
}
