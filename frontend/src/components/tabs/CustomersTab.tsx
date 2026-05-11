"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, Users, Loader2 } from "lucide-react";
import { createCustomer, deleteCustomer, fetchCustomers, extractErrorMessage } from "@/lib/api";
import type { NotificationState } from "@/types";

interface CustomersTabProps {
  setNotification: (n: NotificationState) => void;
  refreshData: () => void;
}

export default function CustomersTab({
  setNotification,
  refreshData,
}: CustomersTabProps) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [newCustomer, setNewCustomer] = useState({ name: "", document: "", phone: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchCustomers();
      if (res.success) setCustomers(res.customers);
    } catch (error) {
      setNotification({ msg: extractErrorMessage(error, "Erro ao carregar clientes."), type: "error" });
    } finally {
      setIsLoading(false);
    }
  }, [setNotification]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleCreate = async () => {
    if (!newCustomer.name || isCreating) return;

    setIsCreating(true);
    try {
      await createCustomer({ ...newCustomer, branchId: "00000000-0000-0000-0000-000000000000" });
      setNotification({ msg: "Cliente criado!", type: "success" });
      setNewCustomer({ name: "", document: "", phone: "" });
      loadCustomers();
      refreshData();
    } catch (error) {
      setNotification({ msg: extractErrorMessage(error, "Erro ao criar cliente."), type: "error" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (customer: any) => {
    if (deletingId) return;
    if (!confirm(`Excluir o cliente "${customer.name}"?`)) return;

    setDeletingId(customer.id);
    try {
      await deleteCustomer(customer.id);
      setNotification({ msg: "Cliente removido!", type: "success" });
      loadCustomers();
      refreshData();
    } catch (error) {
      setNotification({ msg: extractErrorMessage(error, "Erro ao excluir cliente."), type: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="glass-card p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Novo Cliente</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Nome"
            value={newCustomer.name}
            onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
            className="col-span-2 bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
          <input
            type="text"
            placeholder="CPF/CNPJ"
            value={newCustomer.document}
            onChange={(e) => setNewCustomer({ ...newCustomer, document: e.target.value })}
            className="bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
          <button
            onClick={handleCreate}
            disabled={isCreating || !newCustomer.name}
            className={`py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition shadow-lg flex items-center justify-center gap-2 ${isCreating || !newCustomer.name ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
            Adicionar
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Nenhum cliente cadastrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map((customer) => {
            const isDeleting = deletingId === customer.id;
            return (
              <div
                key={customer.id}
                className={`glass-card p-6 flex justify-between items-center group hover:translate-y-[-2px] transition-all border-l-4 border-blue-500 ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-xl">
                    <Users className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{customer.name}</h3>
                    <p className="text-xs text-gray-500">{customer.document || "S/ Doc"}</p>
                  </div>
                </div>
                <button
                  disabled={isDeleting}
                  onClick={() => handleDelete(customer)}
                  className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer z-10"
                >
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
