import dotenv from "dotenv";
dotenv.config();

import Fastify from "fastify";
import cors from "@fastify/cors";
import { logger } from "./utils/logger";
import { errorHandlerPlugin } from "./plugins/errorHandler";
import { webhookRoutes } from "./routes/webhook";
import { transactionRoutes } from "./routes/transactions";
import { branchRoutes } from "./routes/branches";
import { customerRoutes } from "./routes/customers";
import { supplierRoutes } from "./routes/suppliers";
import { bankAccountRoutes } from "./routes/bankAccounts";
import { chartOfAccountRoutes } from "./routes/chartOfAccounts";
import { dreRoutes } from "./routes/dre";
import { cashFlowRoutes } from "./routes/cashflow";

import crypto from "crypto";

const server = Fastify({
  logger: false,
  genReqId: () => crypto.randomUUID(),
});

// --- Plugins ---

const isDev = process.env.NODE_ENV !== "production";

server.register(errorHandlerPlugin);

server.register(cors, {
  origin: isDev ? "*" : ["http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
});

// Hook global para capturar erros silenciosos
server.addHook("onError", async (request, reply, error) => {
  logger.error({
    msg: "Erro capturado via hook global onError",
    error: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
    traceId: request.id
  });
});

// "Escudo" contra erro 400 por Content-Type em corpo vazio (ex: DELETE)
// Movido para onRequest para agir ANTES do parser de body do Fastify
server.addHook("onRequest", async (request) => {
  if (request.method === "DELETE" && request.headers["content-type"]) {
    delete request.headers["content-type"];
  }
});

// --- Hooks de Observabilidade ---

server.addHook("onRequest", async (request) => {
  logger.info({
    msg: "Request received",
    method: request.method,
    url: request.url,
    traceId: request.id,
  });
});

server.addHook("onResponse", async (request, reply) => {
  logger.info({
    msg: "Request completed",
    method: request.method,
    url: request.url,
    statusCode: reply.statusCode,
    responseTime: Math.round(reply.elapsedTime),
    traceId: request.id,
  });
});

server.addHook("onSend", async (request, reply, payload) => {
  if (reply.statusCode === 400) {
    logger.warn({
      msg: "Resposta 400 enviada pelo servidor",
      url: request.url,
      method: request.method,
      payload: payload,
      traceId: request.id
    });
  }
});

// --- Healthcheck ---

server.get("/health", async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

// --- Registro de Rotas Modulares ---

server.register(webhookRoutes);
server.register(transactionRoutes);
server.register(branchRoutes);
server.register(customerRoutes);
server.register(supplierRoutes);
server.register(bankAccountRoutes);
server.register(chartOfAccountRoutes);
server.register(dreRoutes);
server.register(cashFlowRoutes);


// --- Bootstrap ---

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3001;
    await server.listen({ port, host: "0.0.0.0" });
    logger.info(`Server listening on port ${port}`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

start();
