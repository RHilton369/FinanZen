"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, Truck, Loader2 } from "lucide-react";
import { createSupplier, deleteSupplier, fetchSuppliers, extractErrorMessage } from "@/lib/api";
import type { NotificationState } from "@/types";

interface SuppliersTabProps {
  setNotification: (n: NotificationState) => void;
  refreshData: () => void;
}

export default function SuppliersTab({ setNotification, refreshData }: SuppliersTabProps) {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [newSupplier, setNewSupplier] = useState({ name: "", document: "", phone: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadSuppliers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchSuppliers();
      if (res.success) setSuppliers(res.suppliers);
    } catch (error) {
      setNotification({ msg: extractErrorMessage(error, "Erro ao carregar fornecedores."), type: "error" });
    } finally {
      setIsLoading(false);
    }
  }, [setNotification]);

  useEffect(() => { loadSuppliers(); }, [loadSuppliers]);

  const handleCreate = async () => {
    if (!newSupplier.name || isCreating) return;
    setIsCreating(true);
    try {
      await createSupplier({ ...newSupplier, branchId: "00000000-0000-0000-0000-000000000000" });
      setNotification({ msg: "Fornecedor criado!", type: "success" });
      setNewSupplier({ name: "", document: "", phone: "" });
      loadSuppliers();
      refreshData();
    } catch (error) {
      setNotification({ msg: extractErrorMessage(error, "Erro ao criar fornecedor."), type: "error" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (supplier: any) => {
    if (deletingId) return;
    if (!confirm(`Excluir o fornecedor "${supplier.name}"?`)) return;
    setDeletingId(supplier.id);
    try {
      await deleteSupplier(supplier.id);
      setNotification({ msg: "Fornecedor removido!", type: "success" });
      loadSuppliers();
      refreshData();
    } catch (error) {
      setNotification({ msg: extractErrorMessage(error, "Erro ao excluir fornecedor."), type: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="glass-card p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Novo Fornecedor</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input type="text" placeholder="Nome" value={newSupplier.name} onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })} className="col-span-2 bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-emerald-500 transition" />
          <input type="text" placeholder="CNPJ" value={newSupplier.document} onChange={(e) => setNewSupplier({ ...newSupplier, document: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-emerald-500 transition" />
          <button onClick={handleCreate} disabled={isCreating || !newSupplier.name} className={`py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition shadow-lg flex items-center justify-center gap-2 ${isCreating || !newSupplier.name ? "opacity-60 cursor-not-allowed" : ""}`}>
            {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
            Adicionar
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-purple-500 animate-spin" /></div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-12 text-gray-500"><Truck className="w-12 h-12 mx-auto mb-4 opacity-30" /><p>Nenhum fornecedor cadastrado.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map((supplier) => {
            const isDeleting = deletingId === supplier.id;
            return (
              <div key={supplier.id} className={`glass-card p-6 flex justify-between items-center group hover:translate-y-[-2px] transition-all border-l-4 border-purple-500 ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/10 rounded-xl"><Truck className="w-5 h-5 text-purple-500" /></div>
                  <div>
                    <h3 className="font-bold text-white">{supplier.name}</h3>
                    <p className="text-xs text-gray-500">{supplier.document || "S/ Doc"}</p>
                  </div>
                </div>
                <button disabled={isDeleting} onClick={() => handleDelete(supplier)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer z-10">
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
