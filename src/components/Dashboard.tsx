import React from "react";
import { 
  ArrowLeft, Package, DollarSign, TrendingUp, Truck 
} from "lucide-react";
import { 
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, 
  BarChart, Bar, Cell, PieChart, Pie, LineChart, Line 
} from "recharts";
import { ShoppingList } from "../types";

interface DashboardProps {
  shoppingLists: ShoppingList[];
  monthlyLimit: number;
  monthlyIncome: number;
  onNavigate: (tab: 'dashboard' | 'lists' | 'categories') => void;
  onOpenScan: () => void;
  onOpenNewListModal: () => void;
  onSelectList: (list: ShoppingList) => void;
  userProfileName: string;
  onEditProfileName: (newName: string) => void;
}

// Colors from the mockup: Blue, Green, Yellow/Orange, Red, Purple, Cyan, Pink, Violet
const COLORS = [
  "#4285F4", // Blue
  "#10B981", // Green
  "#F59E0B", // Orange/Yellow
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
  "#EC4899", // Pink
  "#A78BFA"  // Violet
];

const formatBRL = (value: number) => {
  return "R$ " + value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export default function Dashboard({
  shoppingLists,
  onNavigate
}: DashboardProps) {
  // 1. KPI Calculations
  const totalSpentAll = shoppingLists.reduce((sum, list) => sum + (list.spent || 0), 0);
  const kpiTotalPurchases = shoppingLists.length;
  const kpiAverageSpent = kpiTotalPurchases > 0 ? totalSpentAll / kpiTotalPurchases : 0;
  
  // Unique suppliers count
  const uniqueSuppliers = Array.from(
    new Set(
      shoppingLists
        .map((list) => (list.fornecedor || list.name || "").trim())
        .filter(Boolean)
    )
  ).length;

  // 2. Data Preparation: Top 5 Fornecedores (Bar Chart)
  const supplierMap: Record<string, number> = {};
  shoppingLists.forEach((list) => {
    const name = (list.fornecedor || list.name || "Não informado").trim();
    supplierMap[name] = (supplierMap[name] || 0) + (list.spent || 0);
  });
  
  const supplierChartData = Object.entries(supplierMap)
    .map(([name, spent]) => ({
      name,
      spent: Number(spent.toFixed(2))
    }))
    .filter(item => item.spent > 0)
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5);

  // 3. Data Preparation: Gasto por Centro de Custo (Pie Chart)
  const costCenterMap: Record<string, number> = {};
  shoppingLists.forEach((list) => {
    const cc = (list.centroCusto || "Não informado").trim();
    costCenterMap[cc] = (costCenterMap[cc] || 0) + (list.spent || 0);
  });

  const costCenterChartData = Object.entries(costCenterMap)
    .map(([name, spent]) => ({
      name,
      spent: Number(spent.toFixed(2))
    }))
    .filter(item => item.spent > 0)
    .sort((a, b) => b.spent - a.spent);

  // 4. Data Preparation: Compras por Mês (Line Chart)
  const monthlyMap: Record<string, { spent: number; count: number; sortKey: string }> = {};
  shoppingLists.forEach((list) => {
    const dateKey = list.dataLancamento || list.date;
    if (!dateKey || !dateKey.includes("-")) {
      const fallbackLabel = "Jun/26";
      if (!monthlyMap[fallbackLabel]) {
        monthlyMap[fallbackLabel] = { spent: 0, count: 0, sortKey: "2026-06" };
      }
      monthlyMap[fallbackLabel].spent += (list.spent || 0);
      monthlyMap[fallbackLabel].count += 1;
      return;
    }
    const parts = dateKey.split("-"); // yyyy-mm-dd
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const monthName = months[monthIndex] || "Jan";
    const label = `${monthName}/${year.substring(2)}`;
    const sortKey = `${year}-${parts[1]}`;

    if (!monthlyMap[label]) {
      monthlyMap[label] = { spent: 0, count: 0, sortKey };
    }
    monthlyMap[label].spent += (list.spent || 0);
    monthlyMap[label].count += 1;
  });

  const monthlyChartData = Object.entries(monthlyMap)
    .map(([name, data]) => ({
      name,
      spent: Number(data.spent.toFixed(2)),
      count: data.count,
      sortKey: data.sortKey
    }))
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  return (
    <div className="p-2 md:p-6 max-w-7xl mx-auto space-y-8 bg-slate-50/30 rounded-3xl animate-in fade-in duration-300">
      
      {/* Header section with Serif Font Title and Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-serif" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
            Análises & KPIs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Visualize indicadores principais e tendências de compras
          </p>
        </div>
        <div>
          <button
            onClick={() => onNavigate("lists")}
            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold shadow-2xs cursor-pointer transition-all active:scale-95 duration-100"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row (4 Column Grid matching the image perfectly) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Total de Compras */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-2xs relative flex flex-col justify-between min-h-[140px]">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-500 tracking-tight">Total de Compras</span>
            <span className="text-slate-400">
              <Package className="w-5 h-5 text-[#4285F4]" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3.5xl font-black text-slate-950 font-sans tracking-tight block">
              {kpiTotalPurchases}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1 font-medium">
              Registros no período
            </span>
          </div>
        </div>

        {/* Card 2: Valor Total */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-2xs relative flex flex-col justify-between min-h-[140px]">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-500 tracking-tight">Valor Total</span>
            <span className="text-slate-400">
              <DollarSign className="w-5 h-5 text-[#10B981]" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3.5xl font-black text-slate-950 font-sans tracking-tight block">
              {formatBRL(totalSpentAll)}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1 font-medium">
              Investimento total
            </span>
          </div>
        </div>

        {/* Card 3: Média por Compra */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-2xs relative flex flex-col justify-between min-h-[140px]">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-500 tracking-tight">Média por Compra</span>
            <span className="text-slate-400">
              <TrendingUp className="w-5 h-5 text-[#F59E0B]" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3.5xl font-black text-slate-950 font-sans tracking-tight block">
              {formatBRL(kpiAverageSpent)}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1 font-medium">
              Valor médio
            </span>
          </div>
        </div>

        {/* Card 4: Fornecedores */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-2xs relative flex flex-col justify-between min-h-[140px]">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold text-slate-500 tracking-tight">Fornecedores</span>
            <span className="text-slate-400">
              <Truck className="w-5 h-5 text-[#8B5CF6]" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3.5xl font-black text-slate-950 font-sans tracking-tight block">
              {uniqueSuppliers}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1 font-medium">
              Fornecedores únicos
            </span>
          </div>
        </div>
      </div>

      {/* Side-by-Side Charts (Middle Row) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 1: Top 5 Fornecedores */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-2xs min-w-0 overflow-hidden">
          <h3 className="text-sm font-bold text-slate-900 mb-6 tracking-tight">
            Top 5 Fornecedores
          </h3>
          <div className="h-72 flex items-center justify-center">
            {supplierChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={supplierChartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    angle={-30}
                    textAnchor="end"
                    height={50}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: '#64748b', fontSize: 10 }} 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `R$ ${val}`}
                  />
                  <Tooltip 
                    formatter={(value: any) => [formatBRL(Number(value)), 'Investimento']}
                    contentStyle={{ borderRadius: '12px', borderColor: '#e2e8f0', fontSize: '11px' }}
                  />
                  <Bar dataKey="spent" radius={[6, 6, 0, 0]} barSize={45}>
                    {supplierChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#4285F4" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-400 italic">Sem lançamentos para exibir</span>
            )}
          </div>
        </div>
 
        {/* Card 2: Gasto por Centro de Custo */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-2xs min-w-0 overflow-hidden">
          <h3 className="text-sm font-bold text-slate-900 mb-6 tracking-tight">
            Gasto por Centro de Custo
          </h3>
          <div className="h-72 flex items-center justify-center">
            {costCenterChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costCenterChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="spent"
                    label={({ name, spent }) => `${name}: R$ ${spent.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`}
                  >
                    {costCenterChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [formatBRL(Number(value)), 'Valor']}
                    contentStyle={{ borderRadius: '12px', borderColor: '#e2e8f0', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-400 italic">Sem lançamentos para exibir</span>
            )}
          </div>
        </div>
      </div>
 
      {/* Full-Width Chart: Compras por Mês */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-2xs min-w-0 overflow-hidden">
        <h3 className="text-sm font-bold text-slate-900 mb-6 tracking-tight">
          Compras por Mês
        </h3>
        <div className="h-72 flex items-center justify-center">
          {monthlyChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyChartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  formatter={(value: any, name: string, props: any) => {
                    if (name === "Quantidade") {
                      return [value, "Total de compras"];
                    }
                    return [formatBRL(props.payload.spent), "Valor faturado"];
                  }}
                  contentStyle={{ borderRadius: '12px', borderColor: '#e2e8f0', fontSize: '11px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  name="Quantidade"
                  stroke="#4285F4" 
                  strokeWidth={2.5}
                  dot={{ r: 5, fill: '#4285F4', strokeWidth: 1.5, stroke: '#fff' }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <span className="text-xs text-slate-400 italic">Aguardando lançamentos para exibir o histórico</span>
          )}
        </div>
      </div>

    </div>
  );
}
