import type { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import { logger } from "../utils/logger";
import { prisma } from "../utils/prisma";
import { createChartOfAccountSchema, updateChartOfAccountSchema } from "../schemas";

const PRISMA_FK_VIOLATION = "P2003";
const PRISMA_NOT_FOUND = "P2025";

export async function chartOfAccountRoutes(server: FastifyInstance) {
  server.post("/chart-of-accounts", async (request, reply) => {
    const parsed = createChartOfAccountSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ statusCode: 400, error: "Validação falhou", details: parsed.error.issues });
    }

    try {
      const chartOfAccount = await prisma.chartOfAccount.create({ data: parsed.data });
      logger.info({ msg: "Plano de contas criado", chartOfAccountId: chartOfAccount.id, traceId: request.id });
      return reply.status(201).send({ success: true, chartOfAccount });
    } catch (error: unknown) {
      logger.error({ msg: "Erro ao criar plano de contas", error: error instanceof Error ? error.message : String(error), traceId: request.id });
      return reply.status(500).send({ error: "Erro interno ao criar plano de contas" });
    }
  });

  server.get("/chart-of-accounts", async (request, reply) => {
    const { branchId } = request.query as { branchId?: string };
    try {
      const chartOfAccounts = await prisma.chartOfAccount.findMany({
        where: branchId ? { branchId } : undefined,
        include: { _count: { select: { transactions: true } } },
      });
      return reply.status(200).send({ success: true, chartOfAccounts });
    } catch (error: unknown) {
      logger.error({ msg: "Erro ao listar planos de contas", traceId: request.id });
      return reply.status(500).send({ error: "Erro interno" });
    }
  });

  server.patch("/chart-of-accounts/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = updateChartOfAccountSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ statusCode: 400, error: "Validação falhou", details: parsed.error.issues });
    }

    try {
      const chartOfAccount = await prisma.chartOfAccount.update({ where: { id }, data: parsed.data });
      return reply.status(200).send({ success: true, chartOfAccount });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === PRISMA_NOT_FOUND) {
        return reply.status(404).send({ error: "Plano de contas não encontrado" });
      }
      logger.error({ msg: "Erro ao atualizar plano de contas", id, traceId: request.id });
      return reply.status(500).send({ error: "Erro interno" });
    }
  });

  server.delete("/chart-of-accounts/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const dependencias = await prisma.chartOfAccount.findUnique({
        where: { id },
        select: { _count: { select: { transactions: true } } },
      });

      if (!dependencias) {
        return reply.status(404).send({ error: "Plano de contas não encontrado" });
      }

      if (dependencias._count.transactions > 0) {
        logger.warn({ msg: "Exclusão de plano de contas bloqueada por transações vinculadas", chartOfAccountId: id, transacoes: dependencias._count.transactions, traceId: request.id });
        return reply.status(409).send({
          error: "Este plano de contas possui transações vinculadas e não pode ser excluído.",
          details: { transacoes: dependencias._count.transactions },
        });
      }

      await prisma.chartOfAccount.delete({ where: { id } });
      logger.info({ msg: "Plano de contas excluído", chartOfAccountId: id, traceId: request.id });
      return reply.status(200).send({ success: true });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === PRISMA_NOT_FOUND) return reply.status(404).send({ error: "Plano de contas não encontrado" });
        if (error.code === PRISMA_FK_VIOLATION) return reply.status(409).send({ error: "Plano de contas possui registros vinculados." });
      }
      logger.error({ msg: "Erro ao deletar plano de contas", id, error: error instanceof Error ? error.message : String(error), traceId: request.id });
      return reply.status(500).send({ error: "Erro interno ao excluir plano de contas" });
    }
  });
}
