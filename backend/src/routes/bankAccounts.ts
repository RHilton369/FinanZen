import type { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import { logger } from "../utils/logger";
import { prisma } from "../utils/prisma";
import { createBankAccountSchema, updateBankAccountSchema } from "../schemas";

const PRISMA_FK_VIOLATION = "P2003";
const PRISMA_NOT_FOUND = "P2025";

export async function bankAccountRoutes(server: FastifyInstance) {
  server.post("/bank-accounts", async (request, reply) => {
    const parsed = createBankAccountSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ statusCode: 400, error: "Validação falhou", details: parsed.error.issues });
    }

    try {
      const bankAccount = await prisma.bankAccount.create({ data: parsed.data });
      logger.info({ msg: "Conta bancária criada", bankAccountId: bankAccount.id, traceId: request.id });
      return reply.status(201).send({ success: true, bankAccount });
    } catch (error: unknown) {
      logger.error({ msg: "Erro ao criar conta bancária", error: error instanceof Error ? error.message : String(error), traceId: request.id });
      return reply.status(500).send({ error: "Erro interno ao criar conta bancária" });
    }
  });

  server.get("/bank-accounts", async (request, reply) => {
    const { branchId } = request.query as { branchId?: string };
    try {
      const bankAccounts = await prisma.bankAccount.findMany({
        where: branchId ? { branchId } : undefined,
        include: { _count: { select: { transactions: true } } },
      });
      return reply.status(200).send({ success: true, bankAccounts });
    } catch (error: unknown) {
      logger.error({ msg: "Erro ao listar contas bancárias", traceId: request.id });
      return reply.status(500).send({ error: "Erro interno" });
    }
  });

  server.patch("/bank-accounts/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = updateBankAccountSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ statusCode: 400, error: "Validação falhou", details: parsed.error.issues });
    }

    try {
      const bankAccount = await prisma.bankAccount.update({ where: { id }, data: parsed.data });
      return reply.status(200).send({ success: true, bankAccount });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === PRISMA_NOT_FOUND) {
        return reply.status(404).send({ error: "Conta bancária não encontrada" });
      }
      logger.error({ msg: "Erro ao atualizar conta bancária", id, traceId: request.id });
      return reply.status(500).send({ error: "Erro interno" });
    }
  });

  server.delete("/bank-accounts/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const dependencias = await prisma.bankAccount.findUnique({
        where: { id },
        select: { _count: { select: { transactions: true } } },
      });

      if (!dependencias) {
        return reply.status(404).send({ error: "Conta bancária não encontrada" });
      }

      if (dependencias._count.transactions > 0) {
        logger.warn({ msg: "Exclusão de conta bancária bloqueada por transações vinculadas", bankAccountId: id, transacoes: dependencias._count.transactions, traceId: request.id });
        return reply.status(409).send({
          error: "Esta conta bancária possui transações vinculadas e não pode ser excluída.",
          details: { transacoes: dependencias._count.transactions },
        });
      }

      await prisma.bankAccount.delete({ where: { id } });
      logger.info({ msg: "Conta bancária excluída", bankAccountId: id, traceId: request.id });
      return reply.status(200).send({ success: true });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === PRISMA_NOT_FOUND) return reply.status(404).send({ error: "Conta bancária não encontrada" });
        if (error.code === PRISMA_FK_VIOLATION) return reply.status(409).send({ error: "Conta bancária possui registros vinculados." });
      }
      logger.error({ msg: "Erro ao deletar conta bancária", id, error: error instanceof Error ? error.message : String(error), traceId: request.id });
      return reply.status(500).send({ error: "Erro interno ao excluir conta bancária" });
    }
  });
}
