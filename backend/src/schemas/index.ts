import { z } from "zod";

// --- Schemas de Transação ---

export const createTransactionSchema = z.object({
  description: z.string().min(1).max(255),
  amount: z.number().positive(),
  type: z.enum(["INCOME", "EXPENSE"]),
  date: z.string().datetime({ offset: true }).or(z.string().date()).optional(),
  dueDate: z.string().datetime({ offset: true }).or(z.string().date()).optional(),
  paymentDate: z.string().datetime({ offset: true }).or(z.string().date()).optional(),
  chartOfAccountId: z.string().uuid().optional(),
  branchId: z.string().uuid(),
  bankAccountId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  status: z.enum(["PENDING", "PAID", "LATE", "COMPLETED", "CANCELLED"]).default("COMPLETED"),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

export const updateTransactionSchema = z.object({
  description: z.string().min(1).max(255).optional(),
  amount: z.number().positive().optional(),
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  date: z.string().datetime({ offset: true }).or(z.string().date()).optional(),
  chartOfAccountId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  status: z.enum(["PENDING", "PAID", "LATE", "COMPLETED", "CANCELLED"]).optional(),
});

export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

// --- Schemas de Branch ---

export const createBranchSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  cnpj: z.string().max(20).optional(),
  userId: z.string().uuid(),
});

export const updateBranchSchema = createBranchSchema.partial();

// --- Schemas de Customer ---

export const createCustomerSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  document: z.string().max(20).optional(),
  email: z.string().email().max(255).optional().or(z.literal("")),
  phone: z.string().max(20).optional(),
  branchId: z.string().uuid(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

// --- Schemas de Supplier ---

export const createSupplierSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  document: z.string().max(20).optional(),
  email: z.string().email().max(255).optional().or(z.literal("")),
  phone: z.string().max(20).optional(),
  branchId: z.string().uuid(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

// --- Schemas de BankAccount ---

export const createBankAccountSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  bank: z.string().max(100).optional(),
  agency: z.string().max(20).optional(),
  account: z.string().max(20).optional(),
  branchId: z.string().uuid(),
});

export const updateBankAccountSchema = createBankAccountSchema.partial();

// --- Schemas de ChartOfAccount ---

export const createChartOfAccountSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  type: z.enum(["INCOME", "EXPENSE"]),
  dreCategory: z.string().max(100).optional(),
  branchId: z.string().uuid(),
});

export const updateChartOfAccountSchema = createChartOfAccountSchema.partial();
