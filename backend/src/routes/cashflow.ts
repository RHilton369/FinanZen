import type { FastifyInstance } from "fastify";
import { prisma } from "../utils/prisma";
import { logger } from "../utils/logger";

export async function cashFlowRoutes(server: FastifyInstance) {
  server.get("/cash-flow/projection", async (request, reply) => {
    const { branchId, days = 15 } = request.query as {
      branchId?: string;
      days?: string;
    };

    if (!branchId) {
      return reply.status(400).send({ error: "O ID da filial (branchId) é obrigatório." });
    }

    try {
      const projectionDays = parseInt(days as string, 10);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + projectionDays);
      endDate.setHours(23, 59, 59, 999);

      // Busca o saldo atual aproximado (soma das transações já PAGAS)
      // Numa aplicação real, você teria um saldo consolidado ou traria do BankAccount
      const completedTransactions = await prisma.transaction.aggregate({
        where: {
          branchId,
          status: { in: ["COMPLETED", "PAID"] }
        },
        _sum: {
          amount: true
        }
      });

      // Como o Prisma não suporta agregação condicional simples no SQLite/Postgres de forma unificada na sintaxe de soma,
      // buscamos a soma agrupando por tipo ou buscando os registros. Para MVP vamos buscar os totais agrupados.
      const incomeSum = await prisma.transaction.aggregate({
        where: { branchId, status: { in: ["COMPLETED", "PAID"] }, type: "INCOME" },
        _sum: { amount: true }
      });
      const expenseSum = await prisma.transaction.aggregate({
        where: { branchId, status: { in: ["COMPLETED", "PAID"] }, type: "EXPENSE" },
        _sum: { amount: true }
      });

      let currentBalance = Number(incomeSum._sum.amount || 0) - Number(expenseSum._sum.amount || 0);

      // Busca transações pendentes/atrasadas previstas para a janela de tempo
      const upcomingTransactions = await prisma.transaction.findMany({
        where: {
          branchId,
          status: { in: ["PENDING", "LATE"] },
          dueDate: {
            gte: today,
            lte: endDate
          }
        },
        orderBy: { dueDate: 'asc' }
      });

      const projectionMap = new Map<string, { date: string, income: number, expense: number, balance: number }>();

      // Inicializar o mapa para os próximos dias
      let runningBalance = currentBalance;
      for (let i = 0; i <= projectionDays; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        projectionMap.set(dateStr, {
          date: dateStr,
          income: 0,
          expense: 0,
          balance: 0 // Será calculado progressivamente
        });
      }

      // Distribuir transações no mapa
      for (const t of upcomingTransactions) {
        if (!t.dueDate) continue;
        const dateStr = t.dueDate.toISOString().split('T')[0];
        
        const dayData = projectionMap.get(dateStr);
        if (dayData) {
          const amount = Number(t.amount);
          if (t.type === "INCOME") dayData.income += amount;
          else if (t.type === "EXPENSE") dayData.expense += amount;
        }
      }

      // Calcular o saldo projetado progressivamente
      const projectionList = Array.from(projectionMap.values());
      for (const day of projectionList) {
        runningBalance += day.income;
        runningBalance -= day.expense;
        day.balance = runningBalance;
      }

      const hasNegativeProjection = projectionList.some(day => day.balance < 0);

      return reply.status(200).send({
        success: true,
        currentBalance,
        projection: projectionList,
        alerts: {
          hasNegativeProjection
        }
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      logger.error({ msg: "Falha ao gerar projeção de fluxo de caixa", error: errorMessage, traceId: request.id });
      return reply.status(500).send({ error: "Falha ao gerar projeção" });
    }
  });
}
