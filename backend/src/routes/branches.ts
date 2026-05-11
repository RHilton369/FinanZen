import type { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import { logger } from "../utils/logger";
import { prisma } from "../utils/prisma";
import { createBranchSchema, updateBranchSchema } from "../schemas";

/** Código Prisma para violação de FK ou registro dependente */
const PRISMA_FK_VIOLATION = "P2003";
const PRISMA_NOT_FOUND = "P2025";

export async function branchRoutes(server: FastifyInstance) {
  server.post("/branches", async (request, reply) => {
    logger.info({ msg: "POST /branches recebido", body: request.body, traceId: request.id });
    const parsed = createBranchSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ statusCode: 400, error: "Validação falhou", details: parsed.error.issues, url: request.url, method: request.method });
    }

    try {
      const branch = await prisma.branch.create({ data: parsed.data });
      logger.info({ msg: "Filial criada", branchId: branch.id, traceId: request.id });
      return reply.status(201).send({ success: true, branch });
    } catch (error: unknown) {
      logger.error({ msg: "Erro ao criar filial", error: error instanceof Error ? error.message : String(error), traceId: request.id });
      return reply.status(500).send({ error: "Erro interno ao criar filial" });
    }
  });

  server.get("/branches", async (request, reply) => {
    const { userId } = request.query as { userId?: string };
    try {
      const branches = await prisma.branch.findMany({
        where: userId ? { userId } : undefined,
        include: {
          _count: {
            select: {
              transactions: true,
              customers: true,
              suppliers: true,
              bankAccounts: true,
              chartOfAccounts: true,
            },
          },
        },
      });
      return reply.status(200).send({ success: true, branches });
    } catch (error: unknown) {
      logger.error({ msg: "Erro ao listar filiais", traceId: request.id });
      return reply.status(500).send({ error: "Erro interno" });
    }
  });

  server.patch("/branches/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = updateBranchSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ statusCode: 400, error: "Validação falhou", details: parsed.error.issues });
    }

    try {
      const branch = await prisma.branch.update({ where: { id }, data: parsed.data });
      return reply.status(200).send({ success: true, branch });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === PRISMA_NOT_FOUND) {
        return reply.status(404).send({ error: "Filial não encontrada" });
      }
      logger.error({ msg: "Erro ao atualizar filial", id, traceId: request.id });
      return reply.status(500).send({ error: "Erro interno" });
    }
  });

  server.delete("/branches/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      // Verificação prévia de dependências antes de excluir
      const dependencias = await prisma.branch.findUnique({
        where: { id },
        select: {
          _count: {
            select: {
              transactions: true,
              customers: true,
              suppliers: true,
              bankAccounts: true,
              chartOfAccounts: true,
            },
          },
        },
      });

      if (!dependencias) {
        return reply.status(404).send({ error: "Filial não encontrada" });
      }

      const totais = dependencias._count;
      const possuiDependencias = totais.transactions > 0 ||
        totais.customers > 0 ||
        totais.suppliers > 0 ||
        totais.bankAccounts > 0 ||
        totais.chartOfAccounts > 0;

      if (possuiDependencias) {
        return reply.status(409).send({
          error: "Esta filial possui registros vinculados e não pode ser excluída.",
          details: totais,
        });
      }

      await prisma.branch.delete({ where: { id } });
      return reply.status(200).send({ success: true });
    } catch (error: unknown) {
      logger.error({ msg: "Erro ao deletar filial", id, error: error instanceof Error ? error.message : String(error), traceId: request.id });
      return reply.status(500).send({ error: "Erro interno ao excluir filial" });
    }
  });
}
