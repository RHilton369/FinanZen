"use client";

import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";
import { fetchDre, fetchBranches } from "@/lib/api";
import { formatCurrency } from "@/lib/formatters";
import type { NotificationState } from "@/types";

interface DreTabProps {
  setNotification: (n: NotificationState) => void;
}

export default function DreTab({ setNotification }: DreTabProps) {
  const [dre, setDre] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState("current_month");

  useEffect(() => {
    loadDre();
  }, [period]);

  const loadDre = async () => {
    setIsLoading(true);
    try {
      // Buscar filial ativa dinamicamente
      const resBranches = await fetchBranches();
      const branches = resBranches.branches || [];
      const branchId = branches[0]?.id;

      if (!branchId) {
        setNotification({ msg: "Nenhuma filial encontrada para DRE.", type: "error" });
        return;
      }
      
      let start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      
      let end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);

      if (period === "last_month") {
        start.setMonth(start.getMonth() - 1);
        end.setMonth(end.getMonth() - 1);
        // Correct end date for last month
        end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);
      } else if (period === "year") {
        start = new Date(new Date().getFullYear(), 0, 1);
        end = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999);
      }

      const res = await fetchDre(branchId, start.toISOString(), end.toISOString());
      if (res.success) {
        setDre(res.dre);
      }
    } catch (error) {
      // Erro silenciado para o usuário (Zero Vazamentos)
      setDre(null);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMargin = (value: number, base: number) => {
    if (!base || base === 0) return 0;
    return ((value / base) * 100).toFixed(1);
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-500" />
            D.R.E.
          </h2>
          <p className="text-gray-400">Demonstração do Resultado do Exercício</p>
        </div>
        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition flex items-center gap-2"
          >
            <option value="current_month" className="text-black">Mês Atual</option>
            <option value="last_month" className="text-black">Mês Anterior</option>
            <option value="year" className="text-black">Este Ano</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-gray-500 flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
          Carregando inteligência financeira...
        </div>
      ) : !dre ? (
        <div className="p-8 text-center text-gray-500 glass-card">
          Não foi possível carregar a DRE. Verifique as configurações da filial.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-card p-6 border-l-4 border-indigo-500">
              <p className="text-sm font-medium text-gray-400 mb-1">Receita Bruta</p>
              <h3 className="text-2xl font-bold text-white">{formatCurrency(dre.receitaBruta)}</h3>
            </div>
            <div className="glass-card p-6 border-l-4 border-red-500">
              <p className="text-sm font-medium text-gray-400 mb-1">Custos & Despesas</p>
              <h3 className="text-2xl font-bold text-white">{formatCurrency(dre.custos + dre.despesasOperacionais)}</h3>
            </div>
            <div className="glass-card p-6 border-l-4 border-emerald-500 relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-10">
                <DollarSign className="w-24 h-24 text-emerald-500" />
              </div>
              <p className="text-sm font-medium text-gray-400 mb-1">Lucro Líquido</p>
              <h3 className="text-3xl font-bold text-emerald-400 relative z-10">{formatCurrency(dre.lucroLiquido)}</h3>
            </div>
            <div className="glass-card p-6 border-l-4 border-blue-500">
              <p className="text-sm font-medium text-gray-400 mb-1">Margem Líquida</p>
              <h3 className="text-2xl font-bold text-blue-400">
                {calculateMargin(dre.lucroLiquido, dre.receitaBruta)}%
              </h3>
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="bg-indigo-500/10 p-4 border-b border-indigo-500/20">
              <h3 className="font-bold text-indigo-400 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Estrutura Vertical da DRE
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                
                {/* 1. Receita Bruta */}
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="font-bold text-white">1. Receita Operacional Bruta</span>
                  <span className="font-bold text-emerald-400">{formatCurrency(dre.receitaBruta)}</span>
                </div>
                
                {/* 2. Deduções */}
                <div className="flex justify-between items-center py-2 border-b border-white/5 text-gray-400 pl-4">
                  <span>(-) Deduções da Receita Bruta</span>
                  <span className="text-red-400">{formatCurrency(dre.deducoes)}</span>
                </div>

                {/* 3. Receita Líquida */}
                <div className="flex justify-between items-center py-2 border-b border-white/10 font-medium">
                  <span className="text-white">= Receita Operacional Líquida</span>
                  <span className="text-white">{formatCurrency(dre.receitaLiquida)}</span>
                </div>

                {/* 4. Custos */}
                <div className="flex justify-between items-center py-2 border-b border-white/5 text-gray-400 pl-4">
                  <span>(-) Custos dos Produtos/Serviços Vendidos (CPV/CSV)</span>
                  <span className="text-red-400">{formatCurrency(dre.custos)}</span>
                </div>

                {/* 5. Lucro Bruto */}
                <div className="flex justify-between items-center py-2 border-b border-white/10 font-medium">
                  <span className="text-white">= Lucro Bruto</span>
                  <span className="text-indigo-400">{formatCurrency(dre.lucroBruto)}</span>
                </div>

                {/* 6. Despesas Operacionais */}
                <div className="flex justify-between items-center py-2 border-b border-white/5 text-gray-400 pl-4">
                  <span>(-) Despesas Operacionais (Vendas, G&A)</span>
                  <span className="text-red-400">{formatCurrency(dre.despesasOperacionais)}</span>
                </div>

                {/* 7. Lucro Operacional */}
                <div className="flex justify-between items-center py-2 border-b border-white/10 font-medium">
                  <span className="text-white">= Lucro Operacional (EBITDA base)</span>
                  <span className="text-white">{formatCurrency(dre.lucroOperacional)}</span>
                </div>

                {/* 8. Impostos */}
                <div className="flex justify-between items-center py-2 border-b border-white/5 text-gray-400 pl-4">
                  <span>(-) Impostos (IRPJ, CSLL)</span>
                  <span className="text-red-400">{formatCurrency(dre.impostos)}</span>
                </div>

                {/* 9. Lucro Líquido */}
                <div className="flex justify-between items-center py-4 mt-2 bg-white/5 rounded-xl px-4">
                  <span className="font-bold text-xl text-white">Lucro Líquido do Exercício</span>
                  <div className="text-right">
                    <span className={`font-bold text-2xl ${dre.lucroLiquido >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatCurrency(dre.lucroLiquido)}
                    </span>
                    <p className="text-sm text-gray-400">
                      Margem: {calculateMargin(dre.lucroLiquido, dre.receitaBruta)}%
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
