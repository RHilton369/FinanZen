"use client";

import { useState, useEffect, useCallback } from "react";
import { DollarSign, CheckCircle, Activity, Loader2, Building, Tag } from "lucide-react";
import {
  createTransaction,
  fetchBranches,
  fetchChartOfAccounts,
  extractErrorMessage,
} from "@/lib/api";
import type { NotificationState } from "@/types";

interface PointOfSaleTabProps {
  setNotification: (n: NotificationState) => void;
  refreshData: () => void;
}

interface Branch {
  id: string;
  name: string;
}

interface ChartOfAccount {
  id: string;
  name: string;
  type: string;
}

interface LancamentoForm {
  description: string;
  amount: string;
  type: "INCOME" | "EXPENSE";
  branchId: string;
  chartOfAccountId: string;
}

export default function PointOfSaleTab({
  setNotification,
  refreshData,
}: PointOfSaleTabProps) {
  const [form, setForm] = useState<LancamentoForm>({
    description: "",
    amount: "",
    type: "INCOME",
    branchId: "",
    chartOfAccountId: "",
  });

  const [branches, setBranches] = useState<Branch[]>([]);
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  /** Filtra o plano de contas pelo tipo de movimentação selecionado */
  const contasFiltradas = chartOfAccounts.filter((c) => c.type === form.type);

  const carregarDados = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [resBranches, resChart] = await Promise.all([
        fetchBranches(),
        fetchChartOfAccounts(),
      ]);

      const branchList = resBranches.branches ?? [];
      const chartList = resChart.chartOfAccounts ?? [];

      setBranches(branchList);
      setChartOfAccounts(chartList);

      // Pré-seleciona a primeira filial automaticamente para agilizar o fluxo
      if (branchList.length > 0) {
        setForm((prev) => ({ ...prev, branchId: branchList[0].id }));
      }
    } catch (error) {
      setNotification({
        msg: extractErrorMessage(error, "Falha ao carregar dados do sistema."),
        type: "error",
      });
    } finally {
      setIsLoadingData(false);
    }
  }, [setNotification]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  /** Limpa a seleção de conta ao trocar o tipo de movimentação */
  const handleTipoChange = (tipo: "INCOME" | "EXPENSE") => {
    setForm((prev) => ({ ...prev, type: tipo, chartOfAccountId: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.branchId) {
      setNotification({ msg: "Selecione uma filial antes de confirmar.", type: "error" });
      return;
    }

    const amountVal = Number(form.amount.replace(",", "."));
    if (isNaN(amountVal) || amountVal <= 0) {
      setNotification({ msg: "Informe um valor válido e maior que zero.", type: "error" });
      return;
    }

    setIsProcessing(true);
    try {
      const payload: Record<string, unknown> = {
        description: form.description,
        amount: amountVal,
        type: form.type,
        status: "COMPLETED",
        branchId: form.branchId,
        date: new Date().toISOString(),
      };

      // Só inclui chartOfAccountId se o usuário tiver selecionado uma conta
      if (form.chartOfAccountId) {
        payload.chartOfAccountId = form.chartOfAccountId;
      }

      await createTransaction(payload);

      setNotification({ msg: "Lançamento realizado com sucesso!", type: "success" });
      setForm((prev) => ({
        description: "",
        amount: "",
        type: "INCOME",
        branchId: prev.branchId, // mantém a filial selecionada para agilizar
        chartOfAccountId: "",
      }));
      refreshData();
    } catch (error) {
      setNotification({
        msg: extractErrorMessage(error, "Erro ao processar lançamento."),
        type: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-8 max-w-4xl mx-auto">
      <div className="glass-card p-8">
        {/* Cabeçalho */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
            <DollarSign className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Frente de Caixa</h2>
            <p className="text-gray-400">Lançamentos rápidos e diretos à vista</p>
          </div>
        </div>

        {isLoadingData ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mr-3" />
            <span className="text-gray-400">Carregando dados do sistema...</span>
          </div>
        ) : branches.length === 0 ? (
          <div className="text-center py-16">
            <Building className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">Nenhuma filial cadastrada.</p>
            <p className="text-gray-500 text-sm mt-1">
              Cadastre ao menos uma filial antes de realizar lançamentos.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seleção de Filial */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                <Building className="w-4 h-4" /> Filial
              </label>
              <select
                value={form.branchId}
                onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:ring-2 focus:ring-emerald-500 transition"
                required
              >
                <option value="" disabled className="bg-gray-900">
                  Selecione a filial...
                </option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id} className="bg-gray-900">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Descrição e Valor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Descrição
                </label>
                <input
                  type="text"
                  placeholder="Ex: Venda Balcão #1234"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:ring-2 focus:ring-emerald-500 transition text-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Valor (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:ring-2 focus:ring-emerald-500 transition text-lg font-mono"
                  required
                />
              </div>
            </div>

            {/* Tipo de Movimentação */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-4">
                Tipo de Movimentação
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleTipoChange("INCOME")}
                  className={`p-4 rounded-xl font-bold transition-all border-2 flex items-center justify-center gap-2 ${
                    form.type === "INCOME"
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                      : "border-white/10 text-gray-400 hover:border-white/20"
                  }`}
                >
                  <CheckCircle className="w-5 h-5" /> ENTRADA (RECEITA)
                </button>
                <button
                  type="button"
                  onClick={() => handleTipoChange("EXPENSE")}
                  className={`p-4 rounded-xl font-bold transition-all border-2 flex items-center justify-center gap-2 ${
                    form.type === "EXPENSE"
                      ? "bg-red-500/20 border-red-500 text-red-400"
                      : "border-white/10 text-gray-400 hover:border-white/20"
                  }`}
                >
                  <Activity className="w-5 h-5" /> SAÍDA (DESPESA)
                </button>
              </div>
            </div>

            {/* Categoria (Plano de Contas) — opcional */}
            {contasFiltradas.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4" /> Categoria{" "}
                  <span className="text-gray-600">(opcional)</span>
                </label>
                <select
                  value={form.chartOfAccountId}
                  onChange={(e) => setForm({ ...form, chartOfAccountId: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:ring-2 focus:ring-emerald-500 transition"
                >
                  <option value="" className="bg-gray-900">
                    Sem categoria
                  </option>
                  {contasFiltradas.map((c) => (
                    <option key={c.id} value={c.id} className="bg-gray-900">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Botão de Confirmação */}
            <button
              type="submit"
              disabled={isProcessing || !form.branchId}
              className={`w-full py-4 rounded-xl text-white font-bold text-lg transition-all shadow-lg ${
                isProcessing || !form.branchId
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-emerald-500 hover:bg-emerald-600 hover:scale-[1.02] shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              }`}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> PROCESSANDO...
                </span>
              ) : (
                "CONFIRMAR LANÇAMENTO"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
