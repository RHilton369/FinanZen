import type { FastifyInstance } from "fastify";
import { prisma } from "../utils/prisma";
import { logger } from "../utils/logger";

export async function dreRoutes(server: FastifyInstance) {
  server.get("/dre", async (request, reply) => {
    const { branchId, startDate, endDate } = request.query as {
      branchId?: string;
      startDate?: string;
      endDate?: string;
    };

    if (!branchId) {
      return reply.status(400).send({ error: "O ID da filial (branchId) é obrigatório para a DRE." });
    }

    try {
      const whereClause: any = {
        branchId,
        status: { in: ["COMPLETED", "PAID"] } // Apenas contas efetivadas para caixa (ou todas para competência, dependendo do regime. Aqui assumimos competência pela data do fato gerador)
      };

      if (startDate && endDate) {
        whereClause.date = {
          gte: new Date(startDate),
          lte: new Date(endDate)
        };
      }

      // Buscar transações associadas ao Plano de Contas
      const transactions = await prisma.transaction.findMany({
        where: whereClause,
        include: {
          chartOfAccount: true
        }
      });

      // Estrutura básica da DRE
      const dre = {
        receitaBruta: 0,
        deducoes: 0,
        receitaLiquida: 0,
        custos: 0,
        lucroBruto: 0,
        despesasOperacionais: 0,
        lucroOperacional: 0,
        impostos: 0,
        lucroLiquido: 0,
        detalhes: {} as Record<string, number>
      };

      for (const t of transactions) {
        if (!t.chartOfAccount) continue;
        
        const amount = Number(t.amount);
        const category = t.chartOfAccount.dreCategory || 'OUTROS';

        if (!dre.detalhes[category]) dre.detalhes[category] = 0;
        dre.detalhes[category] += amount;

        // Lógica simplificada baseada no tipo (A ser refinada pelas categorias exatas da DRE)
        if (t.type === "INCOME") {
          dre.receitaBruta += amount;
        } else if (t.type === "EXPENSE") {
          // Categorização heurística para o MVP
          if (category.toUpperCase().includes("CUSTO")) {
            dre.custos += amount;
          } else if (category.toUpperCase().includes("IMPOSTO")) {
            dre.impostos += amount;
          } else if (category.toUpperCase().includes("DEDU")) {
            dre.deducoes += amount;
          } else {
            dre.despesasOperacionais += amount;
          }
        }
      }

      // Cálculos Finais
      dre.receitaLiquida = dre.receitaBruta - dre.deducoes;
      dre.lucroBruto = dre.receitaLiquida - dre.custos;
      dre.lucroOperacional = dre.lucroBruto - dre.despesasOperacionais;
      dre.lucroLiquido = dre.lucroOperacional - dre.impostos;

      return reply.status(200).send({ success: true, dre });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      logger.error({ msg: "Falha ao gerar DRE", error: errorMessage, traceId: request.id });
      return reply.status(500).send({ error: "Falha ao gerar DRE" });
    }
  });
}
