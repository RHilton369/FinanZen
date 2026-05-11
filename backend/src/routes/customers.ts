import type { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import { logger } from "../utils/logger";
import { prisma } from "../utils/prisma";
import { createCustomerSchema, updateCustomerSchema } from "../schemas";

const PRISMA_FK_VIOLATION = "P2003";
const PRISMA_NOT_FOUND = "P2025";

export async function customerRoutes(server: FastifyInstance) {
  server.post("/customers", async (request, reply) => {
    const parsed = createCustomerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ statusCode: 400, error: "Validação falhou", details: parsed.error.issues });
    }

    try {
      const customer = await prisma.customer.create({ data: parsed.data });
      logger.info({ msg: "Cliente criado", customerId: customer.id, traceId: request.id });
      return reply.status(201).send({ success: true, customer });
    } catch (error: unknown) {
      logger.error({ msg: "Erro ao criar cliente", error: error instanceof Error ? error.message : String(error), traceId: request.id });
      return reply.status(500).send({ error: "Erro interno ao criar cliente" });
    }
  });

  server.get("/customers", async (request, reply) => {
    const { branchId } = request.query as { branchId?: string };
    try {
      const customers = await prisma.customer.findMany({
        where: branchId ? { branchId } : undefined,
        include: { _count: { select: { transactions: true } } },
      });
      return reply.status(200).send({ success: true, customers });
    } catch (error: unknown) {
      logger.error({ msg: "Erro ao listar clientes", traceId: request.id });
      return reply.status(500).send({ error: "Erro interno" });
    }
  });

  server.patch("/customers/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = updateCustomerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ statusCode: 400, error: "Validação falhou", details: parsed.error.issues });
    }

    try {
      const customer = await prisma.customer.update({ where: { id }, data: parsed.data });
      return reply.status(200).send({ success: true, customer });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === PRISMA_NOT_FOUND) {
        return reply.status(404).send({ error: "Cliente não encontrado" });
      }
      logger.error({ msg: "Erro ao atualizar cliente", id, traceId: request.id });
      return reply.status(500).send({ error: "Erro interno" });
    }
  });

  server.delete("/customers/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const dependencias = await prisma.customer.findUnique({
        where: { id },
        select: { _count: { select: { transactions: true } } },
      });

      if (!dependencias) {
        return reply.status(404).send({ error: "Cliente não encontrado" });
      }

      if (dependencias._count.transactions > 0) {
        logger.warn({ msg: "Exclusão de cliente bloqueada por transações vinculadas", customerId: id, transacoes: dependencias._count.transactions, traceId: request.id });
        return reply.status(409).send({
          error: "Este cliente possui transações vinculadas e não pode ser excluído.",
          details: { transacoes: dependencias._count.transactions },
        });
      }

      await prisma.customer.delete({ where: { id } });
      logger.info({ msg: "Cliente excluído", customerId: id, traceId: request.id });
      return reply.status(200).send({ success: true });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === PRISMA_NOT_FOUND) return reply.status(404).send({ error: "Cliente não encontrado" });
        if (error.code === PRISMA_FK_VIOLATION) return reply.status(409).send({ error: "Cliente possui registros vinculados." });
      }
      logger.error({ msg: "Erro ao deletar cliente", id, error: error instanceof Error ? error.message : String(error), traceId: request.id });
      return reply.status(500).send({ error: "Erro interno ao excluir cliente" });
    }
  });
}
