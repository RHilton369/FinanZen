/** URL base da API backend, centralizada para evitar hardcode espalhado */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";

// --- Helpers genéricos de fetch ---

/** Erro tipado da API com a mensagem semântica vinda do backend */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(statusCode: number, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const controller = new AbortController();
  /** Timeout de segurança para evitar requests pendentes infinitamente */
  const timeoutId = setTimeout(() => controller.abort(), 15_000);

  try {
    const headers: Record<string, string> = {};
    if (options?.body) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { ...headers, ...options?.headers },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(
        res.status,
        body.error || `Erro ${res.status}`,
        body.details
      );
    }

    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Extrai a mensagem de erro amigável para exibição na UI.
 * Prioriza a mensagem semântica do backend (ApiError) sobre mensagens genéricas.
 */
export function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    let msg = error.message;
    // Se houver detalhes (ex: erros de validação do Zod), tenta anexar para debug
    if (error.details && Array.isArray(error.details)) {
      const details = error.details
        .map((d: any) => `${d.path?.join(".") || "campo"}: ${d.message}`)
        .join(", ");
      msg += ` (${details})`;
    }
    return msg;
  }
  if (error instanceof Error) {
    if (error.name === "AbortError") return "A requisição excedeu o tempo limite.";
    return error.message;
  }
  return fallback;
}

// --- Transações ---

export function fetchTransactions(query?: string) {
  return request<{ success: boolean, transactions: any[] }>(`/transactions${query ? `?${query}` : ''}`);
}

export function createTransaction(data: any): Promise<{ success: boolean, transaction: any }> {
  return request("/transactions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deleteTransaction(id: string): Promise<{ success: boolean }> {
  return request(`/transactions/${id}`, { method: "DELETE" });
}

export function updateTransaction(
  id: string,
  data: Record<string, unknown>
): Promise<{ success: boolean }> {
  return request(`/transactions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// --- Entidades Base ---

export function fetchBranches() { return request<{ success: boolean, branches: any[] }>("/branches"); }
export function createBranch(data: any) { return request("/branches", { method: "POST", body: JSON.stringify(data) }); }
export function updateBranch(id: string, data: any) { return request(`/branches/${id}`, { method: "PATCH", body: JSON.stringify(data) }); }
export function deleteBranch(id: string) { return request(`/branches/${id}`, { method: "DELETE" }); }

export function fetchCustomers(branchId?: string) { return request<{ success: boolean, customers: any[] }>(`/customers${branchId ? `?branchId=${branchId}` : ''}`); }
export function createCustomer(data: any) { return request("/customers", { method: "POST", body: JSON.stringify(data) }); }
export function updateCustomer(id: string, data: any) { return request(`/customers/${id}`, { method: "PATCH", body: JSON.stringify(data) }); }
export function deleteCustomer(id: string) { return request(`/customers/${id}`, { method: "DELETE" }); }

export function fetchSuppliers(branchId?: string) { return request<{ success: boolean, suppliers: any[] }>(`/suppliers${branchId ? `?branchId=${branchId}` : ''}`); }
export function createSupplier(data: any) { return request("/suppliers", { method: "POST", body: JSON.stringify(data) }); }
export function updateSupplier(id: string, data: any) { return request(`/suppliers/${id}`, { method: "PATCH", body: JSON.stringify(data) }); }
export function deleteSupplier(id: string) { return request(`/suppliers/${id}`, { method: "DELETE" }); }

export function fetchBankAccounts(branchId?: string) { return request<{ success: boolean, bankAccounts: any[] }>(`/bank-accounts${branchId ? `?branchId=${branchId}` : ''}`); }
export function createBankAccount(data: any) { return request("/bank-accounts", { method: "POST", body: JSON.stringify(data) }); }
export function updateBankAccount(id: string, data: any) { return request(`/bank-accounts/${id}`, { method: "PATCH", body: JSON.stringify(data) }); }
export function deleteBankAccount(id: string) { return request(`/bank-accounts/${id}`, { method: "DELETE" }); }

export function fetchChartOfAccounts(branchId?: string) { return request<{ success: boolean, chartOfAccounts: any[] }>(`/chart-of-accounts${branchId ? `?branchId=${branchId}` : ''}`); }
export function createChartOfAccount(data: any) { return request("/chart-of-accounts", { method: "POST", body: JSON.stringify(data) }); }
export function updateChartOfAccount(id: string, data: any) { return request(`/chart-of-accounts/${id}`, { method: "PATCH", body: JSON.stringify(data) }); }
export function deleteChartOfAccount(id: string) { return request(`/chart-of-accounts/${id}`, { method: "DELETE" }); }

// --- Relatórios ---

export function fetchDre(branchId: string, startDate?: string, endDate?: string) {
  const query = new URLSearchParams({ branchId });
  if (startDate) query.append("startDate", startDate);
  if (endDate) query.append("endDate", endDate);
  return request<{ success: boolean, dre: any }>(`/dre?${query.toString()}`);
}

export function fetchCashFlowProjection(branchId: string, days: number = 15) {
  return request<{ success: boolean, currentBalance: number, projection: any[], alerts: any }>(`/cash-flow/projection?branchId=${branchId}&days=${days}`);
}

// --- Message Logs ---

import type { MessageLog } from "@/types";

export function fetchMessageLogs(): Promise<MessageLog[]> {
  return request("/message-logs");
}
