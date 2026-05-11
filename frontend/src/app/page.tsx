import { createClient } from '@/utils/supabase/server';
import DashboardClient from '@/components/DashboardClient';

export default async function Page() {
  try {
    const supabase = await createClient();

    // Buscar transações (usando os nomes reais das colunas no banco)
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        id, 
        amount, 
        type, 
        date, 
        description, 
        chart_of_account_id,
        chart_of_accounts (
          id, 
          name, 
          type
        )
      `)
      .order('date', { ascending: false })
      .limit(200);

    if (error) {
      console.error("[page.tsx] Falha ao buscar transações do Supabase:", error.message);
      return (
        <DashboardClient
          receitas={0}
          despesas={0}
          saldo={0}
          fluxoCaixa={[]}
          categorias={[]}
          transacoes={[]}
          trendReceitas={0}
          trendDespesas={0}
          errorMsg={`Erro Supabase: ${error.message}`}
        />
      );
    }

    // Normalização: Converter snake_case do DB para o padrão do componente
    const normalizedTransactions = (transactions || []).map((tx: any) => ({
      ...tx,
      categoryId: tx.chart_of_account_id,
      category: Array.isArray(tx.chart_of_accounts) ? tx.chart_of_accounts[0] : tx.chart_of_accounts
    }));

    let receitas = 0;
    let despesas = 0;
    let receitasMesAnterior = 0;
    let despesasMesAnterior = 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const fluxoCaixaMap = new Map();
    const categoryMap = new Map();

    normalizedTransactions.forEach((tx: any) => {
      const txDate = new Date(tx.date);
      const txMonth = txDate.getMonth();
      const txYear = txDate.getFullYear();
      const amount = Number(tx.amount);
      const isIncome = tx.type === 'INCOME';
      
      // Totais Mês Atual
      if (txMonth === currentMonth && txYear === currentYear) {
        if (isIncome) receitas += amount;
        else despesas += amount;
      }

      // Totais Mês Anterior
      if (txMonth === lastMonth && txYear === lastMonthYear) {
        if (isIncome) receitasMesAnterior += amount;
        else despesasMesAnterior += amount;
      }

      // Fluxo por dia (Mês Atual)
      if (txMonth === currentMonth && txYear === currentYear) {
        const dateStr = txDate.getDate().toString();
        if (!fluxoCaixaMap.has(dateStr)) {
          fluxoCaixaMap.set(dateStr, { name: dateStr, receita: 0, despesa: 0 });
        }
        const dayData = fluxoCaixaMap.get(dateStr);
        if (isIncome) dayData.receita += amount;
        else dayData.despesa += amount;
      }

      // Categorias (Mês Atual - apenas despesas no gráfico de pizza)
      if (txMonth === currentMonth && txYear === currentYear && !isIncome && tx.category) {
        const catId = tx.category.id;
        if (!categoryMap.has(catId)) {
          categoryMap.set(catId, { id: catId, name: tx.category.name, value: 0, color: tx.category.color });
        }
        categoryMap.get(catId).value += amount;
      }
    });

    const fluxoCaixa = Array.from(fluxoCaixaMap.values()).sort((a, b) => Number(a.name) - Number(b.name));
    const categoriasData = Array.from(categoryMap.values());
    const saldo = receitas - despesas;

    // Cálculos de Tendência
    const calcTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Number(((current - previous) / previous * 100).toFixed(1));
    };

    const trendReceitas = calcTrend(receitas, receitasMesAnterior);
    const trendDespesas = calcTrend(despesas, despesasMesAnterior);

    return (
      <DashboardClient 
        receitas={receitas}
        despesas={despesas}
        saldo={saldo}
        fluxoCaixa={fluxoCaixa}
        categorias={categoriasData}
        transacoes={normalizedTransactions}
        trendReceitas={trendReceitas}
        trendDespesas={trendDespesas}
      />
    );
  } catch (err: any) {
    console.error("[page.tsx] Erro crítico no Dashboard:", err);
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-4xl font-bold text-red-500 mb-4">Erro Crítico</h1>
        <p className="text-gray-400 mb-8 max-w-md">Ocorreu um problema ao carregar o dashboard. Detalhes técnicos para suporte:</p>
        <pre className="bg-white/5 p-6 rounded-xl border border-white/10 text-left text-xs overflow-auto max-w-2xl w-full">
          {err instanceof Error ? err.stack : String(err)}
        </pre>
        <a href="/" className="mt-8 px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition">
          Tentar Novamente
        </a>
      </div>
    );
  }
}
