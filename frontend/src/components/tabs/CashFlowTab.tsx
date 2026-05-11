"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { Activity, AlertTriangle, TrendingUp, CalendarDays } from "lucide-react";
import { fetchCashFlowProjection } from "@/lib/api";
import { formatCurrency } from "@/lib/formatters";
import type { NotificationState } from "@/types";

interface CashFlowTabProps {
  setNotification: (n: NotificationState) => void;
}

export default function CashFlowTab({ setNotification }: CashFlowTabProps) {
  const [projection, setProjection] = useState<any[]>([]);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [hasAlert, setHasAlert] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProjection();
  }, []);

  const loadProjection = async () => {
    setIsLoading(true);
    try {
      const branchId = "00000000-0000-0000-0000-000000000000"; // Dummy branch MVP
      const res = await fetchCashFlowProjection(branchId, 15);
      if (res.success) {
        setProjection(res.projection);
        setCurrentBalance(res.currentBalance);
        setHasAlert(res.alerts.hasNegativeProjection);
      }
    } catch (error) {
      setNotification({ msg: "Erro ao carregar projeção de fluxo de caixa", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const formatShortDate = (dateStr: string) => {
    const d = new Date(dateStr);
    d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  // Encontrar o menor saldo projetado para exibir de forma destacada
  const lowestBalance = projection.length > 0 
    ? Math.min(...projection.map(p => p.balance))
    : 0;

  return (
    <div className="animate-in fade-in duration-500 space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-500" />
            Fluxo de Caixa (15 Dias)
          </h2>
          <p className="text-gray-400">Projeção diária com base em Contas a Pagar/Receber</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-indigo-400" />
          <span className="text-white font-medium">Próxima Quinzena</span>
        </div>
      </div>

      {hasAlert && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-4 animate-pulse">
          <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-1" />
          <div>
            <h3 className="text-red-400 font-bold">Aviso de Furo de Caixa Previsto!</h3>
            <p className="text-red-300 text-sm mt-1">
              Sua projeção indica que o saldo ficará negativo nos próximos 15 dias (Menor saldo previsto: {formatCurrency(lowestBalance)}). Considere antecipar recebíveis ou renegociar despesas.
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="p-12 text-center text-gray-500 flex flex-col items-center glass-card">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          Calculando viabilidade financeira...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 border-l-4 border-blue-500">
              <p className="text-sm font-medium text-gray-400 mb-1">Saldo Atual Em Caixa (D0)</p>
              <h3 className="text-3xl font-bold text-white">{formatCurrency(currentBalance)}</h3>
            </div>
            <div className={`glass-card p-6 border-l-4 ${lowestBalance < 0 ? 'border-red-500' : 'border-emerald-500'}`}>
              <p className="text-sm font-medium text-gray-400 mb-1">Menor Saldo no Período</p>
              <h3 className={`text-3xl font-bold ${lowestBalance < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {formatCurrency(lowestBalance)}
              </h3>
            </div>
          </div>

          <div className="glass-card p-6 h-[400px]">
            <h3 className="text-lg font-bold text-white mb-6">Evolução do Saldo Projetado</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={projection} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="date" stroke="#4b5563" tickFormatter={formatShortDate} />
                <YAxis stroke="#4b5563" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "rgba(23, 25, 31, 0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                  itemStyle={{ color: "#fff" }}
                  labelFormatter={(label) => `Data: ${formatShortDate(label as string)}`}
                  formatter={(value: any, name: any) => {
                    const numValue = Number(value);
                    if (name === "balance") return [formatCurrency(numValue), "Saldo Projetado"];
                    if (name === "income") return [formatCurrency(numValue), "Entradas Previstas"];
                    if (name === "expense") return [formatCurrency(numValue), "Saídas Previstas"];
                    return [value, name];
                  }}
                />
                <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#111827" }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card overflow-hidden mt-6">
             <div className="bg-white/5 p-4 border-b border-white/10">
               <h3 className="font-bold text-white flex items-center gap-2">
                 <TrendingUp className="w-5 h-5 text-blue-400" />
                 Detalhamento Diário
               </h3>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead>
                   <tr className="text-gray-400 border-b border-white/5 bg-white/5/50">
                     <th className="p-4 font-medium">Data</th>
                     <th className="p-4 font-medium text-right text-emerald-400">Entradas (R$)</th>
                     <th className="p-4 font-medium text-right text-red-400">Saídas (R$)</th>
                     <th className="p-4 font-medium text-right">Saldo Final (R$)</th>
                   </tr>
                 </thead>
                 <tbody className="text-gray-300 divide-y divide-white/5">
                   {projection.map((day, i) => (
                     <tr key={i} className="hover:bg-white/5 transition-colors">
                       <td className="p-4 font-medium text-white">{formatShortDate(day.date)}</td>
                       <td className="p-4 text-right text-emerald-400/80">{day.income > 0 ? `+${formatCurrency(day.income)}` : '-'}</td>
                       <td className="p-4 text-right text-red-400/80">{day.expense > 0 ? `-${formatCurrency(day.expense)}` : '-'}</td>
                       <td className={`p-4 text-right font-bold ${day.balance < 0 ? 'text-red-400' : 'text-blue-400'}`}>
                         {formatCurrency(day.balance)}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        </>
      )}
    </div>
  );
}
