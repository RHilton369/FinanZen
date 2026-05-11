import type { FastifyInstance } from "fastify";
import { logger } from "../utils/logger";
import { prisma } from "../utils/prisma";
import { updateTransactionSchema, createTransactionSchema } from "../schemas";

export async function transactionRoutes(server: FastifyInstance) {
  server.post("/transactions", async (request, reply) => {
    const parsed = createTransactionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ statusCode: 400, error: "Validação falhou", details: parsed.error.issues });
    }

    try {
      const data = parsed.data;
      const transaction = await prisma.transaction.create({
        data: {
          description: data.description,
          amount: data.amount,
          type: data.type,
          status: data.status,
          date: data.date ? new Date(data.date) : undefined,
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
          paymentDate: data.paymentDate ? new Date(data.paymentDate) : undefined,
          branchId: data.branchId,
          chartOfAccountId: data.chartOfAccountId,
          bankAccountId: data.bankAccountId,
          customerId: data.customerId,
          supplierId: data.supplierId,
        }
      });
      logger.info({ msg: "Transação criada com sucesso", id: transaction.id, traceId: request.id });
      return reply.status(201).send({ success: true, transaction });
    } catch (error: unknown) {
      const { Prisma } = await import("@prisma/client");

      // Erro de chave estrangeira inválida (branchId, customerId, etc.)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        const campo = (error.meta?.field_name as string) ?? "desconhecido";
        logger.warn({ msg: "FK inválida ao criar transação", campo, traceId: request.id });
        return reply.status(400).send({
          error: `O registro referenciado no campo '${campo}' não existe no sistema.`,
          details: { field: campo },
        });
      }

      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      logger.error({ msg: "Falha ao criar transação", error: errorMessage, traceId: request.id });
      return reply.status(500).send({ error: "Falha ao criar transação" });
    }
  });

  server.get("/transactions", async (request, reply) => {
    const { branchId, type, status, startDate, endDate } = request.query as any;
    try {
      const where: any = {};
      if (branchId) where.branchId = branchId;
      if (type) where.type = type;
      if (status) where.status = status;
      if (startDate && endDate) {
        where.date = { gte: new Date(startDate), lte: new Date(endDate) };
      }
      
      const transactions = await prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        include: { chartOfAccount: true, customer: true, supplier: true, bankAccount: true }
      });
      return reply.status(200).send({ success: true, transactions });
    } catch (error: unknown) {
      logger.error({ msg: "Falha ao buscar transações", traceId: request.id });
      return reply.status(500).send({ error: "Falha ao buscar transações" });
    }
  });
  server.delete("/transactions/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      await prisma.transaction.delete({ where: { id } });
      logger.info({ msg: "Transação excluída com sucesso", id, traceId: request.id });
      return reply.status(200).send({ success: true });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      logger.error({ msg: "Falha ao excluir transação", id, error: errorMessage, traceId: request.id });
      return reply.status(500).send({ error: "Falha ao excluir transação" });
    }
  });

  server.patch("/transactions/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    // Sanitização via Zod antes de tocar no banco
    const parsed = updateTransactionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: "Validação falhou",
        details: parsed.error.issues,
      });
    }

    const { description, amount, type, date, chartOfAccountId, status } = parsed.data;

    try {
      const updated = await prisma.transaction.update({
        where: { id },
        data: {
          description,
          amount,
          type,
          status,
          date: date ? new Date(date) : undefined,
          chartOfAccountId,
        },
      });

      logger.info({ msg: "Transação atualizada com sucesso", id, traceId: request.id });
      return reply.status(200).send({ success: true, transaction: updated });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      logger.error({ msg: "Falha ao atualizar transação", id, error: errorMessage, traceId: request.id });
      return reply.status(500).send({ error: "Falha ao atualizar transação" });
    }
  });
}
