"use client";

import { useState, useEffect } from "react";
import { ArrowUpRight, CheckCircle, Clock, Search } from "lucide-react";
import { fetchTransactions, updateTransaction } from "@/lib/api";
import { formatCurrency } from "@/lib/formatters";
import type { NotificationState } from "@/types";

interface ReceivablesTabProps {
  setNotification: (n: NotificationState) => void;
}

export default function ReceivablesTab({ setNotification }: ReceivablesTabProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReceivables();
  }, []);

  const loadReceivables = async () => {
    setIsLoading(true);
    try {
      const res = await fetchTransactions("type=INCOME");
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
      loadReceivables();
    } catch {
      setNotification({ msg: "Erro ao atualizar status.", type: "error" });
    }
  };

  const filtered = transactions.filter(t => t.description.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <ArrowUpRight className="w-6 h-6 text-emerald-500" />
            Contas a Receber
          </h2>
          <p className="text-gray-400">Gestão de faturamento e entradas</p>
        </div>
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Buscar receita..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-4 pr-10 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
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
                  <td className="p-4 text-right font-bold text-emerald-400">{formatCurrency(t.amount)}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      t.status === "COMPLETED" || t.status === "PAID" ? "bg-emerald-500/20 text-emerald-400" :
                      t.status === "LATE" ? "bg-red-500/20 text-red-400" :
                      "bg-yellow-500/20 text-yellow-400"
                    }`}>
                      {t.status === "COMPLETED" || t.status === "PAID" ? "RECEBIDO" : t.status === "LATE" ? "ATRASADO" : "PENDENTE"}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {t.status !== "PAID" && t.status !== "COMPLETED" ? (
                       <button onClick={() => handleStatusChange(t.id, "PAID")} className="p-2 text-emerald-400 hover:bg-emerald-400/20 rounded-lg transition" title="Dar Baixa">
                         <CheckCircle className="w-5 h-5" />
                       </button>
                    ) : (
                       <button onClick={() => handleStatusChange(t.id, "PENDENTE")} className="p-2 text-yellow-400 hover:bg-yellow-400/20 rounded-lg transition" title="Estornar">
                         <Clock className="w-5 h-5" />
                       </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
