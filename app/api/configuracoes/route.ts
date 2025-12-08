import { NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';

const configPath = path.join(process.cwd(), 'public', 'data', 'configuracoes.json');

async function readConfiguracoes() {
  const content = await readFile(configPath, 'utf-8');
  return JSON.parse(content);
}

async function writeConfiguracoes(data: any) {
  await writeFile(configPath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function PUT(request: Request) {
  try {
    const config = await request.json();
    await writeConfiguracoes(config);
    return NextResponse.json(config);
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar configurações' },
      { status: 500 }
    );
  }
}
