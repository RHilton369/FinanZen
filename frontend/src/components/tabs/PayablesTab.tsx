"use client";

import { useState, useEffect } from "react";
import { ArrowDownRight, CheckCircle, Clock, XCircle, Search } from "lucide-react";
import { fetchTransactions, updateTransaction, deleteTransaction } from "@/lib/api";
import { formatCurrency } from "@/lib/formatters";
import type { NotificationState } from "@/types";
import { Trash2, Pencil, Loader2 } from "lucide-react";

interface PayablesTabProps {
  setNotification: (n: NotificationState) => void;
  refreshData: () => void;
}

export default function PayablesTab({ setNotification, refreshData }: PayablesTabProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingTx, setEditingTx] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ description: "", amount: 0, dueDate: "" });

  useEffect(() => {
    loadPayables();
  }, []);

  const loadPayables = async () => {
    setIsLoading(true);
    try {
      const res = await fetchTransactions("type=EXPENSE");
      if (res.success) setTransactions(res.transactions);
    } catch (error) {
      // Falha ignorada silenciosamente na UI
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateTransaction(id, { status: newStatus });
      setNotification({ msg: `Status atualizado para ${newStatus}!`, type: "success" });
      loadPayables();
      refreshData();
    } catch {
      setNotification({ msg: "Erro ao atualizar status.", type: "error" });
    }
  };

  const handleDelete = async (tx: any) => {
    if (deletingId) return;
    if (!confirm(`Excluir a despesa "${tx.description}"?`)) return;

    setDeletingId(tx.id);
    try {
      await deleteTransaction(tx.id);
      setNotification({ msg: "Despesa excluída!", type: "success" });
      loadPayables();
      refreshData();
    } catch {
      setNotification({ msg: "Erro ao excluir despesa.", type: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  const openEdit = (tx: any) => {
    setEditingTx(tx);
    setEditForm({
      description: tx.description,
      amount: Number(tx.amount),
      dueDate: tx.dueDate ? tx.dueDate.split('T')[0] : ""
    });
  };

  const handleSaveEdit = async () => {
    if (!editingTx) return;
    setIsEditing(true);
    try {
      await updateTransaction(editingTx.id, editForm);
      setNotification({ msg: "Despesa atualizada com sucesso!", type: "success" });
      setEditingTx(null);
      loadPayables();
      refreshData();
    } catch {
      setNotification({ msg: "Erro ao atualizar despesa.", type: "error" });
    } finally {
      setIsEditing(false);
    }
  };

  const filtered = transactions.filter(t => t.description.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <ArrowDownRight className="w-6 h-6 text-red-500" />
            Contas a Pagar
          </h2>
          <p className="text-gray-400">Gestão de despesas e obrigações</p>
        </div>
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Buscar despesa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-4 pr-10 text-white focus:ring-2 focus:ring-red-500 outline-none transition"
          />
          <Search className="absolute right-3 top-2.5 w-5 h-5 text-gray-500" />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 border-b border-white/5 bg-white/5">
                <th className="p-4 font-medium">Descrição</th>
                <th className="p-4 font-medium">Vencimento</th>
                <th className="p-4 font-medium text-right">Valor</th>
                <th className="p-4 font-medium text-center">Status</th>
                <th className="p-4 font-medium text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="text-gray-300 divide-y divide-white/5">
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Nenhuma conta encontrada.</td></tr>
              ) : filtered.map((t) => (
                <tr key={t.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-medium text-white">{t.description}</td>
                  <td className="p-4">{t.dueDate ? new Date(t.dueDate).toLocaleDateString("pt-BR") : "N/A"}</td>
                  <td className="p-4 text-right font-bold text-red-400">{formatCurrency(t.amount)}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      t.status === "COMPLETED" || t.status === "PAID" ? "bg-emerald-500/20 text-emerald-400" :
                      t.status === "LATE" ? "bg-red-500/20 text-red-400" :
                      "bg-yellow-500/20 text-yellow-400"
                    }`}>
                      {t.status === "COMPLETED" || t.status === "PAID" ? "PAGO" : t.status === "LATE" ? "ATRASADO" : "PENDENTE"}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {t.status !== "PAID" && t.status !== "COMPLETED" ? (
                         <button onClick={() => handleStatusChange(t.id, "PAID")} className="p-2 text-emerald-400 hover:bg-emerald-400/20 rounded-lg transition" title="Baixar Título">
                           <CheckCircle className="w-5 h-5" />
                         </button>
                      ) : (
                         <button onClick={() => handleStatusChange(t.id, "PENDENTE")} className="p-2 text-yellow-400 hover:bg-yellow-400/20 rounded-lg transition" title="Estornar">
                           <Clock className="w-5 h-5" />
                         </button>
                      )}
                      <button onClick={() => openEdit(t)} className="p-2 text-blue-400 hover:bg-blue-400/20 rounded-lg transition" title="Editar">
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button disabled={deletingId === t.id} onClick={() => handleDelete(t)} className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition" title="Excluir">
                        {deletingId === t.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-white">Editar Despesa</h3>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Descrição</label>
              <input 
                type="text" 
                value={editForm.description}
                onChange={e => setEditForm({...editForm, description: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Valor (R$)</label>
                <input 
                  type="number" step="0.01"
                  value={editForm.amount}
                  onChange={e => setEditForm({...editForm, amount: Number(e.target.value)})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Vencimento</label>
                <input 
                  type="date" 
                  value={editForm.dueDate}
                  onChange={e => setEditForm({...editForm, dueDate: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => setEditingTx(null)}
                className="flex-1 py-3 bg-white/5 text-white rounded-xl font-bold hover:bg-white/10 transition"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveEdit}
                disabled={isEditing}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition flex items-center justify-center gap-2"
              >
                {isEditing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
