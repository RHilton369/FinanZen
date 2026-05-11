"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, BookOpen, Loader2 } from "lucide-react";
import { createChartOfAccount, deleteChartOfAccount, fetchChartOfAccounts, extractErrorMessage } from "@/lib/api";
import type { NotificationState } from "@/types";

interface ChartOfAccountsTabProps {
  setNotification: (n: NotificationState) => void;
  refreshData: () => void;
}

export default function ChartOfAccountsTab({ setNotification, refreshData }: ChartOfAccountsTabProps) {
  const [chartOfAccounts, setChartOfAccounts] = useState<any[]>([]);
  const [newAccount, setNewAccount] = useState({ name: "", type: "EXPENSE", dreCategory: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadChartOfAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchChartOfAccounts();
      if (res.success) setChartOfAccounts(res.chartOfAccounts);
    } catch (error) {
      setNotification({ msg: extractErrorMessage(error, "Erro ao carregar planos de contas."), type: "error" });
    } finally {
      setIsLoading(false);
    }
  }, [setNotification]);

  useEffect(() => { loadChartOfAccounts(); }, [loadChartOfAccounts]);

  const handleCreate = async () => {
    if (!newAccount.name || isCreating) return;
    setIsCreating(true);
    try {
      await createChartOfAccount({ ...newAccount, branchId: "00000000-0000-0000-0000-000000000000" });
      setNotification({ msg: "Plano criado!", type: "success" });
      setNewAccount({ name: "", type: "EXPENSE", dreCategory: "" });
      loadChartOfAccounts();
      refreshData();
    } catch (error) {
      setNotification({ msg: extractErrorMessage(error, "Erro ao criar."), type: "error" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (account: any) => {
    if (deletingId) return;
    if (!confirm(`Excluir a conta "${account.name}"?`)) return;
    setDeletingId(account.id);
    try {
      await deleteChartOfAccount(account.id);
      setNotification({ msg: "Plano removido!", type: "success" });
      loadChartOfAccounts();
      refreshData();
    } catch (error) {
      setNotification({ msg: extractErrorMessage(error, "Erro ao excluir."), type: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="glass-card p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Novo Plano de Contas</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input type="text" placeholder="Nome (Ex: Energia Elétrica)" value={newAccount.name} onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })} className="col-span-2 bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-emerald-500 transition" />
          <select value={newAccount.type} onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-emerald-500 transition">
            <option value="EXPENSE">Despesa</option>
            <option value="INCOME">Receita</option>
          </select>
          <button onClick={handleCreate} disabled={isCreating || !newAccount.name} className={`py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition shadow-lg flex items-center justify-center gap-2 ${isCreating || !newAccount.name ? "opacity-60 cursor-not-allowed" : ""}`}>
            {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
            Adicionar
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>
      ) : chartOfAccounts.length === 0 ? (
        <div className="text-center py-12 text-gray-500"><BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" /><p>Nenhum plano de contas cadastrado.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chartOfAccounts.map((account) => {
            const isDeleting = deletingId === account.id;
            return (
              <div key={account.id} className={`glass-card p-6 flex justify-between items-center group hover:translate-y-[-2px] transition-all border-l-4 ${account.type === "INCOME" ? "border-emerald-500" : "border-red-500"} ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${account.type === "INCOME" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{account.name}</h3>
                    <p className="text-xs text-gray-500">{account.type === "INCOME" ? "Receita" : "Despesa"}</p>
                  </div>
                </div>
                <button disabled={isDeleting} onClick={() => handleDelete(account)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer z-10">
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
