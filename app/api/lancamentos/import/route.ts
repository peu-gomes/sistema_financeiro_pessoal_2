
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Expect body = { data, historico, documento, partidas: [{contaCodigo, contaNome, natureza, valor}] }
    if (!body || !Array.isArray(body.partidas)) {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
    }

    const lancamento = await prisma.lancamento.create({
      data: {
        data: new Date(body.data),
        historico: body.historico,
        documento: body.documento,
        partidas: {
          create: body.partidas.map((p: any) => ({
            contaCodigo: p.contaCodigo || '',
            contaNome: p.contaNome || '',
            natureza: p.natureza || 'debito',
            valor: Number(p.valor) || 0,
          })),
        },
      },
      include: { partidas: true },
    });

    return NextResponse.json(lancamento);
  } catch (error: any) {
    console.error('Erro ao criar lançamento:', error);
    return NextResponse.json({ error: 'Erro ao importar lançamentos', details: error?.message }, { status: 500 });
  } finally {
    // optional: disconnect prisma on edge or long-running environments
    // await prisma.$disconnect();
  }
}
