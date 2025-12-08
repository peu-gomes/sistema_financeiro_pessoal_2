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
    const lancamento = await request.json();
    const lancamentos = await readLancamentos();
    
    // Gerar ID único
    const novoLancamento = {
      ...lancamento,
      id: Date.now().toString(),
    };
    
    lancamentos.push(novoLancamento);
    await writeLancamentos(lancamentos);
    
    return NextResponse.json(novoLancamento);
  } catch (error) {
    console.error('Erro ao criar lançamento:', error);
    return NextResponse.json(
      { error: 'Erro ao criar lançamento' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, ...updates } = await request.json();
    const lancamentos = await readLancamentos();
    
    const index = lancamentos.findIndex((l: any) => l.id === id);
    if (index === -1) {
      return NextResponse.json(
        { error: 'Lançamento não encontrado' },
        { status: 404 }
      );
    }
    
    lancamentos[index] = { ...lancamentos[index], ...updates };
    await writeLancamentos(lancamentos);
    
    return NextResponse.json(lancamentos[index]);
  } catch (error) {
    console.error('Erro ao atualizar lançamento:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar lançamento' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    const lancamentos = await readLancamentos();
    
    const filtered = lancamentos.filter((l: any) => l.id !== id);
    await writeLancamentos(filtered);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar lançamento:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar lançamento' },
      { status: 500 }
    );
  }
}
