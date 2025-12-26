
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();


export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Exemplo: espera body = { data, historico, documento, partidas: [{contaCodigo, contaNome, natureza, valor}] }
    const lancamento = await prisma.lancamento.create({
      data: {
        data: new Date(body.data),
        historico: body.historico,
        documento: body.documento,
        partidas: {
          create: body.partidas
        }
      },
      include: { partidas: true }
    });
    return Response.json(lancamento);
  } catch (error) {
    return Response.json({ error: 'Erro ao importar lançamentos', details: error?.message }, { status: 500 });
  }
}
          contaCodigo: padrao.codigo,
          contaNome: padrao.nome,
        };
      }
      return partida;
    }

    const normalizados: Lancamento[] = lancamentosImportados.map((l, idx) => {
      const partidasCorrigidas = Array.isArray(l.partidas)
        ? l.partidas.map(categorizarPartida)
        : [];
      return {
        ...(l as any),
        id: l.id || `${agora}-${idx}`,
        criadoEm: l?.criadoEm || new Date().toISOString(),
        atualizadoEm: l?.atualizadoEm || new Date().toISOString(),
        partidas: partidasCorrigidas,
      };
    }) as Lancamento[];

    lancamentos.push(...normalizados);
    await writeLancamentos(lancamentos);
      return NextResponse.json({ inseridos: normalizados.length });
  } catch (error) {
    console.error('Erro ao importar lançamentos:', error);
      return NextResponse.json({ error: 'Erro ao importar lançamentos' }, { status: 500 });
  }
}
