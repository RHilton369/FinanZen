"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, Landmark, Loader2 } from "lucide-react";
import { createBankAccount, deleteBankAccount, fetchBankAccounts, extractErrorMessage } from "@/lib/api";
import type { NotificationState } from "@/types";

interface BankAccountsTabProps {
  setNotification: (n: NotificationState) => void;
  refreshData: () => void;
}

export default function BankAccountsTab({ setNotification, refreshData }: BankAccountsTabProps) {
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [newBankAccount, setNewBankAccount] = useState({ name: "", bank: "", agency: "", account: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadBankAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchBankAccounts();
      if (res.success) setBankAccounts(res.bankAccounts);
    } catch (error) {
      setNotification({ msg: extractErrorMessage(error, "Erro ao carregar contas bancárias."), type: "error" });
    } finally {
      setIsLoading(false);
    }
  }, [setNotification]);

  useEffect(() => { loadBankAccounts(); }, [loadBankAccounts]);

  const handleCreate = async () => {
    if (!newBankAccount.name || isCreating) return;
    setIsCreating(true);
    try {
      await createBankAccount({ ...newBankAccount, branchId: "00000000-0000-0000-0000-000000000000" });
      setNotification({ msg: "Conta criada!", type: "success" });
      setNewBankAccount({ name: "", bank: "", agency: "", account: "" });
      loadBankAccounts();
      refreshData();
    } catch (error) {
      setNotification({ msg: extractErrorMessage(error, "Erro ao criar conta."), type: "error" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (bankAccount: any) => {
    if (deletingId) return;
    if (!confirm(`Excluir a conta "${bankAccount.name}"?`)) return;
    setDeletingId(bankAccount.id);
    try {
      await deleteBankAccount(bankAccount.id);
      setNotification({ msg: "Conta removida!", type: "success" });
      loadBankAccounts();
      refreshData();
    } catch (error) {
      setNotification({ msg: extractErrorMessage(error, "Erro ao excluir conta."), type: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="glass-card p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Nova Conta Bancária</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input type="text" placeholder="Nome (Ex: Conta Nubank)" value={newBankAccount.name} onChange={(e) => setNewBankAccount({ ...newBankAccount, name: e.target.value })} className="col-span-2 bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-emerald-500 transition" />
          <input type="text" placeholder="Agência" value={newBankAccount.agency} onChange={(e) => setNewBankAccount({ ...newBankAccount, agency: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-emerald-500 transition" />
          <input type="text" placeholder="Conta" value={newBankAccount.account} onChange={(e) => setNewBankAccount({ ...newBankAccount, account: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-emerald-500 transition" />
          <button onClick={handleCreate} disabled={isCreating || !newBankAccount.name} className={`py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition shadow-lg flex items-center justify-center gap-2 ${isCreating || !newBankAccount.name ? "opacity-60 cursor-not-allowed" : ""}`}>
            {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
            Adicionar
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-orange-500 animate-spin" /></div>
      ) : bankAccounts.length === 0 ? (
        <div className="text-center py-12 text-gray-500"><Landmark className="w-12 h-12 mx-auto mb-4 opacity-30" /><p>Nenhuma conta cadastrada.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bankAccounts.map((acc) => {
            const isDeleting = deletingId === acc.id;
            return (
              <div key={acc.id} className={`glass-card p-6 flex justify-between items-center group hover:translate-y-[-2px] transition-all border-l-4 border-orange-500 ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-500/10 rounded-xl"><Landmark className="w-5 h-5 text-orange-500" /></div>
                  <div>
                    <h3 className="font-bold text-white">{acc.name}</h3>
                    <p className="text-xs text-gray-500">{acc.agency ? `Ag: ${acc.agency}` : ""} {acc.account ? `Cc: ${acc.account}` : ""}</p>
                  </div>
                </div>
                <button disabled={isDeleting} onClick={() => handleDelete(acc)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer z-10">
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
