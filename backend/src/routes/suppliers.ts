import type { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import { logger } from "../utils/logger";
import { prisma } from "../utils/prisma";
import { createSupplierSchema, updateSupplierSchema } from "../schemas";

const PRISMA_FK_VIOLATION = "P2003";
const PRISMA_NOT_FOUND = "P2025";

export async function supplierRoutes(server: FastifyInstance) {
  server.post("/suppliers", async (request, reply) => {
    const parsed = createSupplierSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ statusCode: 400, error: "Validação falhou", details: parsed.error.issues });
    }

    try {
      const supplier = await prisma.supplier.create({ data: parsed.data });
      logger.info({ msg: "Fornecedor criado", supplierId: supplier.id, traceId: request.id });
      return reply.status(201).send({ success: true, supplier });
    } catch (error: unknown) {
      logger.error({ msg: "Erro ao criar fornecedor", error: error instanceof Error ? error.message : String(error), traceId: request.id });
      return reply.status(500).send({ error: "Erro interno ao criar fornecedor" });
    }
  });

  server.get("/suppliers", async (request, reply) => {
    const { branchId } = request.query as { branchId?: string };
    try {
      const suppliers = await prisma.supplier.findMany({
        where: branchId ? { branchId } : undefined,
        include: { _count: { select: { transactions: true } } },
      });
      return reply.status(200).send({ success: true, suppliers });
    } catch (error: unknown) {
      logger.error({ msg: "Erro ao listar fornecedores", traceId: request.id });
      return reply.status(500).send({ error: "Erro interno" });
    }
  });

  server.patch("/suppliers/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = updateSupplierSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ statusCode: 400, error: "Validação falhou", details: parsed.error.issues });
    }

    try {
      const supplier = await prisma.supplier.update({ where: { id }, data: parsed.data });
      return reply.status(200).send({ success: true, supplier });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === PRISMA_NOT_FOUND) {
        return reply.status(404).send({ error: "Fornecedor não encontrado" });
      }
      logger.error({ msg: "Erro ao atualizar fornecedor", id, traceId: request.id });
      return reply.status(500).send({ error: "Erro interno" });
    }
  });

  server.delete("/suppliers/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const dependencias = await prisma.supplier.findUnique({
        where: { id },
        select: { _count: { select: { transactions: true } } },
      });

      if (!dependencias) {
        return reply.status(404).send({ error: "Fornecedor não encontrado" });
      }

      if (dependencias._count.transactions > 0) {
        logger.warn({ msg: "Exclusão de fornecedor bloqueada por transações vinculadas", supplierId: id, transacoes: dependencias._count.transactions, traceId: request.id });
        return reply.status(409).send({
          error: "Este fornecedor possui transações vinculadas e não pode ser excluído.",
          details: { transacoes: dependencias._count.transactions },
        });
      }

      await prisma.supplier.delete({ where: { id } });
      logger.info({ msg: "Fornecedor excluído", supplierId: id, traceId: request.id });
      return reply.status(200).send({ success: true });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === PRISMA_NOT_FOUND) return reply.status(404).send({ error: "Fornecedor não encontrado" });
        if (error.code === PRISMA_FK_VIOLATION) return reply.status(409).send({ error: "Fornecedor possui registros vinculados." });
      }
      logger.error({ msg: "Erro ao deletar fornecedor", id, error: error instanceof Error ? error.message : String(error), traceId: request.id });
      return reply.status(500).send({ error: "Erro interno ao excluir fornecedor" });
    }
  });
}
