import { KV_KEYS, getOrSeed, setJSON } from '@/lib/kv';
import { Lancamento } from '@/types/lancamentos';

export async function readLancamentos(): Promise<Lancamento[]> {
  const data = await getOrSeed<Lancamento[]>(KV_KEYS.lancamentos, 'data/lancamentos.json', []);
  return Array.isArray(data) ? data : [];
}

export async function writeLancamentos(data: Lancamento[]): Promise<void> {
  await setJSON<Lancamento[]>(KV_KEYS.lancamentos, data);
}
