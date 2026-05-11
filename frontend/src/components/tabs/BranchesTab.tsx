"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, Building, AlertTriangle, Loader2 } from "lucide-react";
import { createBranch, deleteBranch, fetchBranches, extractErrorMessage } from "@/lib/api";
import type { NotificationState } from "@/types";

interface BranchesTabProps {
  setNotification: (n: NotificationState) => void;
  refreshData: () => void;
}

export default function BranchesTab({
  setNotification,
  refreshData,
}: BranchesTabProps) {
  const [branches, setBranches] = useState<any[]>([]);
  const [newBranch, setNewBranch] = useState({ name: "", cnpj: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  /** ID da filial sendo excluída; evita duplo-clique e feedback visual */
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadBranches = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchBranches();
      if (res.success) setBranches(res.branches);
    } catch (error) {
      setNotification({ msg: extractErrorMessage(error, "Erro ao carregar filiais."), type: "error" });
    } finally {
      setIsLoading(false);
    }
  }, [setNotification]);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  const handleCreate = async () => {
    if (!newBranch.name || isCreating) return;

    setIsCreating(true);
    try {
      await createBranch({ ...newBranch, userId: "00000000-0000-0000-0000-000000000000" });
      setNotification({ msg: "Filial criada!", type: "success" });
      setNewBranch({ name: "", cnpj: "" });
      loadBranches();
      refreshData();
    } catch (error) {
      setNotification({ msg: extractErrorMessage(error, "Erro ao criar filial."), type: "error" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (branch: any) => {
    console.log("Tentando excluir filial:", branch.name, branch.id);
    if (deletingId) {
      console.warn("Já existe uma exclusão em curso:", deletingId);
      return;
    }
    
    if (!confirm(`Excluir a filial "${branch.name}"?`)) {
      console.log("Exclusão cancelada pelo usuário.");
      return;
    }

    setDeletingId(branch.id);
    console.log("Iniciando DELETE via API para ID:", branch.id);
    try {
      await deleteBranch(branch.id);
      console.log("Exclusão bem-sucedida!");
      setNotification({ msg: "Filial removida!", type: "success" });
      loadBranches();
      refreshData();
    } catch (error) {
      console.error("Erro na exclusão:", error);
      setNotification({ msg: extractErrorMessage(error, "Erro ao excluir filial."), type: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  /** Calcula o total de dependências para exibir badge informativo */
  const getTotalDependencias = (branch: any): number => {
    if (!branch._count) return 0;
    const c = branch._count;
    return (c.transactions || 0) + (c.customers || 0) + (c.suppliers || 0) + (c.bankAccounts || 0) + (c.chartOfAccounts || 0);
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="glass-card p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Nova Filial</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Nome da filial (ex: Matriz)"
            value={newBranch.name}
            onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
          <input
            type="text"
            placeholder="CNPJ"
            value={newBranch.cnpj}
            onChange={(e) => setNewBranch({ ...newBranch, cnpj: e.target.value })}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
          <button
            onClick={handleCreate}
            disabled={isCreating || !newBranch.name}
            className={`px-8 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition shadow-lg shrink-0 flex items-center gap-2 ${isCreating || !newBranch.name ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
            Adicionar
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : branches.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Building className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Nenhuma filial cadastrada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map((branch) => {
            const totalDeps = getTotalDependencias(branch);
            const isDeleting = deletingId === branch.id;

            return (
              <div
                key={branch.id}
                className={`glass-card p-6 flex justify-between items-center hover:translate-y-[-2px] transition-all border-l-4 border-emerald-500 ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 rounded-xl">
                    <Building className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{branch.name}</h3>
                    <p className="text-xs text-gray-500">CNPJ: {branch.cnpj || "N/A"}</p>
                    {totalDeps > 0 && (
                      <p className="text-[10px] text-yellow-400/80 flex items-center gap-1 mt-1">
                        <AlertTriangle className="w-3 h-3" />
                        {totalDeps} registro{totalDeps > 1 ? "s" : ""} vinculado{totalDeps > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(branch);
                  }}
                  className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer z-10"
                  title="Excluir filial"
                >
                  {isDeleting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
