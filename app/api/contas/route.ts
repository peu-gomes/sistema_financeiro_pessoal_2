import { NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';

export async function PUT(request: Request) {
  try {
    const { contas } = await request.json();
    const filePath = path.join(process.cwd(), 'public', 'data', 'plano-de-contas.json');
    
    const data = { contas };
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar plano de contas:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar plano de contas' },
      { status: 500 }
    );
  }
}
