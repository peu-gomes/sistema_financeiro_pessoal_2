import { NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';

const lancamentosPath = path.join(process.cwd(), 'public', 'data', 'lancamentos.json');

async function readLancamentos() {
  const content = await readFile(lancamentosPath, 'utf-8');
  return JSON.parse(content);
}

async function writeLancamentos(data: any) {
  await writeFile(lancamentosPath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const lancamentosImportados = Array.isArray(body?.lancamentos) ? body.lancamentos : [];

    if (lancamentosImportados.length === 0) {
      return NextResponse.json({ error: 'Nenhum lançamento fornecido para importação' }, { status: 400 });
    }

    const lancamentos = await readLancamentos();
    const agora = Date.now();

    const normalizados = lancamentosImportados.map((l: any, idx: number) => ({
      ...l,
      id: l.id || `${agora}-${idx}`,
      criadoEm: l.criadoEm || new Date().toISOString(),
      atualizadoEm: l.atualizadoEm || new Date().toISOString(),
    }));

    lancamentos.push(...normalizados);
    await writeLancamentos(lancamentos);

    return NextResponse.json({ inseridos: normalizados.length });
  } catch (error) {
    console.error('Erro ao importar lançamentos:', error);
    return NextResponse.json({ error: 'Erro ao importar lançamentos' }, { status: 500 });
  }
}
