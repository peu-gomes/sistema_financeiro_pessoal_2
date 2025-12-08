import { NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';

const orcamentosPath = path.join(process.cwd(), 'public', 'data', 'orcamentos.json');

async function readOrcamentos() {
  const content = await readFile(orcamentosPath, 'utf-8');
  return JSON.parse(content);
}

async function writeOrcamentos(data: any) {
  await writeFile(orcamentosPath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function PUT(request: Request) {
  try {
    const orcamento = await request.json();
    const orcamentos = await readOrcamentos();
    
    const index = orcamentos.findIndex((o: any) => o.id === orcamento.id);
    if (index >= 0) {
      orcamentos[index] = { ...orcamento, atualizadoEm: new Date().toISOString() };
    } else {
      orcamentos.push({ ...orcamento, id: orcamento.id || Date.now().toString(), criadoEm: new Date().toISOString() });
    }
    
    await writeOrcamentos(orcamentos);
    return NextResponse.json(orcamento);
  } catch (error) {
    console.error('Erro ao salvar orçamento:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar orçamento' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    const orcamentos = await readOrcamentos();
    
    const filtered = orcamentos.filter((o: any) => o.id !== id);
    await writeOrcamentos(filtered);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar orçamento:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar orçamento' },
      { status: 500 }
    );
  }
}
