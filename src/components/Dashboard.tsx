import React, { useState, useMemo } from "react";
import { 
  ArrowLeft, Package, DollarSign, TrendingUp, Truck, Users, Tag, Calendar, 
  ShieldCheck, CreditCard, Activity, Layers, Filter, CheckCircle2, Clock, 
  Plus, ScanLine, Edit2, AlertTriangle, FileSpreadsheet, Check, X, ChevronRight, BarChart3, PieChart as PieChartIcon
} from "lucide-react";
import { 
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, 
  BarChart, Bar, Cell, PieChart, Pie, AreaChart, Area, Legend
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

const COLORS = [
  "#4f46e5", // Indigo
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#06b6d4", // Cyan
  "#ec4899", // Pink
  "#8b5cf6", // Violet
  "#ef4444", // Rose
  "#3b82f6"  // Blue
];

const formatBRL = (value: number) => {
  return "R$ " + value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export default function Dashboard({
  shoppingLists,
  monthlyLimit,
  monthlyIncome,
  onNavigate,
  onOpenScan,
  onOpenNewListModal,
  onSelectList,
  userProfileName,
  onEditProfileName
}: DashboardProps) {
  // Local UI State
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'year' | 'month' | 'last_month'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'CONCLUÍDO' | 'PENDENTE'>('all');
  const [filterSector, setFilterSector] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [distributionType, setDistributionType] = useState<'centroCusto' | 'setor'>('centroCusto');
  
  // Analyst Name Editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userProfileName);

  // Extract unique sectors for filter
  const sectorsList = useMemo(() => {
    const list = new Set<string>();
    shoppingLists.forEach(l => {
      if (l.setor) list.add(l.setor.trim());
    });
    return Array.from(list).filter(Boolean).sort();
  }, [shoppingLists]);

  // Extract unique categories for filter
  const categoriesList = useMemo(() => {
    const list = new Set<string>();
    shoppingLists.forEach(l => {
      if (l.category) list.add(l.category.trim());
    });
    return Array.from(list).filter(Boolean).sort();
  }, [shoppingLists]);

  // Handle Analyst Name Save
  const handleSaveName = () => {
    if (tempName.trim()) {
      onEditProfileName(tempName.trim());
      setIsEditingName(false);
    }
  };

  // Filtered shopping lists based on interactive controls
  const filteredLists = useMemo(() => {
    return shoppingLists.filter(list => {
      // 1. Status Filter
      if (filterStatus !== 'all' && list.status !== filterStatus) return false;
      
      // 2. Sector Filter
      if (filterSector !== 'all' && list.setor !== filterSector) return false;

      // 3. Category Filter
      if (filterCategory !== 'all' && list.category !== filterCategory) return false;
      
      // 4. Period Filter (Based on current simulated year 2026)
      const dateStr = list.dataLancamento || list.date || "";
      if (filterPeriod === 'year') {
        if (!dateStr.startsWith("2026")) return false;
      } else if (filterPeriod === 'month') {
        if (!dateStr.startsWith("2026-06")) return false;
      } else if (filterPeriod === 'last_month') {
        if (!dateStr.startsWith("2026-05")) return false;
      }
      
      return true;
    });
  }, [shoppingLists, filterStatus, filterSector, filterCategory, filterPeriod]);

  // Current Month Specific calculations for Budget Progress Gauge
  const currentMonthSpent = useMemo(() => {
    return shoppingLists
      .filter((list) => {
        const dateStr = list.dataLancamento || list.date || "";
        return dateStr.startsWith("2026-06");
      })
      .reduce((sum, list) => sum + (list.spent || 0), 0);
  }, [shoppingLists]);

  // Financial KPI Metrics
  const totalSpent = useMemo(() => {
    return filteredLists.reduce((sum, list) => sum + (list.spent || 0), 0);
  }, [filteredLists]);

  const totalQuantity = filteredLists.length;
  
  const averageTicket = useMemo(() => {
    return totalQuantity > 0 ? totalSpent / totalQuantity : 0;
  }, [totalSpent, totalQuantity]);

  const totalPending = useMemo(() => {
    return filteredLists
      .filter(list => list.status === 'PENDENTE')
      .reduce((sum, list) => sum + (list.spent || 0), 0);
  }, [filteredLists]);

  const totalCompleted = useMemo(() => {
    return filteredLists
      .filter(list => list.status === 'CONCLUÍDO')
      .reduce((sum, list) => sum + (list.spent || 0), 0);
  }, [filteredLists]);

  const uniqueSuppliersCount = useMemo(() => {
    return new Set(
      filteredLists
        .map(list => (list.fornecedor || list.name || "").trim().toLowerCase())
        .filter(Boolean)
    ).size;
  }, [filteredLists]);

  // Budget efficiency percentage
  const budgetPercentage = useMemo(() => {
    if (!monthlyLimit) return 0;
    return (currentMonthSpent / monthlyLimit) * 100;
  }, [currentMonthSpent, monthlyLimit]);

  // Chart 1: Month-by-Month Expenditure Timeline (Area Chart)
  const monthlyTimelineData = useMemo(() => {
    const monthlyMap: Record<string, { spent: number; count: number; sortKey: string }> = {};
    
    filteredLists.forEach((list) => {
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

    return Object.entries(monthlyMap)
      .map(([name, data]) => ({
        name,
        "Valor (R$)": Number(data.spent.toFixed(2)),
        "Volume": data.count,
        sortKey: data.sortKey
      }))
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [filteredLists]);

  // Chart 2: Cost Center or Sector Allocation (Toggleable Pie/Donut Chart)
  const allocationData = useMemo(() => {
    const map: Record<string, number> = {};
    
    filteredLists.forEach((list) => {
      const key = distributionType === 'centroCusto' 
        ? (list.centroCusto || "Não Informado").trim()
        : (list.setor || "Não Informado").trim();
      map[key] = (map[key] || 0) + (list.spent || 0);
    });

    return Object.entries(map)
      .map(([name, value]) => ({
        name,
        value: Number(value.toFixed(2))
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filteredLists, distributionType]);

  // Chart 3: Top Suppliers Matrix
  const topSuppliersData = useMemo(() => {
    const map: Record<string, { spent: number; count: number }> = {};
    
    filteredLists.forEach((list) => {
      const supplierName = (list.fornecedor || list.name || "Não Informado").trim();
      if (!map[supplierName]) {
        map[supplierName] = { spent: 0, count: 0 };
      }
      map[supplierName].spent += (list.spent || 0);
      map[supplierName].count += 1;
    });

    return Object.entries(map)
      .map(([name, data]) => ({
        name,
        spent: Number(data.spent.toFixed(2)),
        count: data.count
      }))
      .filter(item => item.spent > 0)
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 10);
  }, [filteredLists]);

  // Chart 4: Expense Distribution by Accounting Classification
  const categoryAllocationData = useMemo(() => {
    const map: Record<string, number> = {};
    
    filteredLists.forEach((list) => {
      // Clean category to show label nicely
      const rawCategory = list.category || "Não Classificado";
      // Extract code if present
      const label = rawCategory.length > 35 ? rawCategory.substring(0, 35) + "..." : rawCategory;
      map[label] = (map[label] || 0) + (list.spent || 0);
    });

    return Object.entries(map)
      .map(([name, value]) => ({
        name,
        value: Number(value.toFixed(2))
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredLists]);

  // Audit alerts & anomalies logic
  const auditAlerts = useMemo(() => {
    const alerts: Array<{ type: 'warning' | 'info' | 'danger'; message: string; title: string }> = [];

    // Unassigned cost centers or missing supplier
    let missingCCCount = 0;
    let missingSupplierCount = 0;
    let highInstallmentCount = 0;

    shoppingLists.forEach(l => {
      if (!l.centroCusto || l.centroCusto === 'Não informado' || l.centroCusto === 'Sem Centro de Custo') {
        missingCCCount++;
      }
      if (!l.fornecedor || l.fornecedor === 'Sem Fornecedor' || l.fornecedor.toLowerCase().includes('não informado')) {
        missingSupplierCount++;
      }
      if (l.parcelas && l.parcelas > 6) {
        highInstallmentCount++;
      }
    });

    if (missingCCCount > 0) {
      alerts.push({
        type: 'warning',
        title: 'Estruturação de Centro de Custo',
        message: `Detectamos ${missingCCCount} lançamentos sem centro de custo especificado. Recomendamos preencher para maior precisão de relatórios.`
      });
    }

    if (missingSupplierCount > 0) {
      alerts.push({
        type: 'info',
        title: 'Qualidade de Cadastro',
        message: `Existem ${missingSupplierCount} lançamentos cadastrados sem fornecedor formal. Considere padronizar.`
      });
    }

    if (highInstallmentCount > 0) {
      alerts.push({
        type: 'info',
        title: 'Análise de Parcelamento',
        message: `Há ${highInstallmentCount} lançamentos parcelados em mais de 6x. Isto impactará os fluxos de provisionamento futuros.`
      });
    }

    return alerts;
  }, [shoppingLists, budgetPercentage, currentMonthSpent, monthlyLimit]);

  // Top 10 Largest transactions for deep drill-down
  const topTransactions = useMemo(() => {
    return [...filteredLists]
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 10);
  }, [filteredLists]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* SECTION 1: HEADER & ANALYST PROFILE */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        {/* Subtle grid lines background overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 w-full flex flex-col items-center text-center">
            <div className="flex items-center gap-2 justify-center">
              <span className="px-2.5 py-1 bg-slate-800/60 text-slate-300 text-[10px] font-semibold tracking-wider uppercase rounded-lg border border-slate-700/50 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                Painel de Business Intelligence (BI)
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-100" style={{ fontFamily: "Arial, sans-serif" }}>
              Analise de Compras
            </h1>

          </div>
        </div>
      </div>

      {/* SECTION 2: INTERACTIVE BI FILTERS */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <Filter className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Filtros de Dados Operacionais</h2>
            <p className="text-[11px] text-slate-400">Refine a análise do painel de controle em tempo real</p>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Period Selection */}
          <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200/50">
            <button
              onClick={() => setFilterPeriod('all')}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${filterPeriod === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Tudo
            </button>
            <button
              onClick={() => setFilterPeriod('year')}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${filterPeriod === 'year' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
            >
              2026
            </button>
            <button
              onClick={() => setFilterPeriod('month')}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${filterPeriod === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Jun/26
            </button>
            <button
              onClick={() => setFilterPeriod('last_month')}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${filterPeriod === 'last_month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Mai/26
            </button>
          </div>

          {/* Status Selection */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2 rounded-xl focus:outline-none cursor-pointer transition-colors"
          >
            <option value="all">Status: Todos</option>
            <option value="CONCLUÍDO">Status: Pago / Concluído</option>
            <option value="PENDENTE">Status: Provisão / Pendente</option>
          </select>

          {/* Department Sector Selection */}
          <select
            value={filterSector}
            onChange={(e) => setFilterSector(e.target.value)}
            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2 rounded-xl focus:outline-none cursor-pointer transition-colors max-w-[180px] truncate"
          >
            <option value="all">Setor: Todos</option>
            {sectorsList.map((sec) => (
              <option key={sec} value={sec}>{sec}</option>
            ))}
          </select>

          {/* Category Selection */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2 rounded-xl focus:outline-none cursor-pointer transition-colors max-w-[220px] truncate"
            title="Filtrar por classificação contábil / categoria"
          >
            <option value="all">Categoria: Todas</option>
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Reset Filters Shortcut */}
          {(filterPeriod !== 'all' || filterStatus !== 'all' || filterSector !== 'all' || filterCategory !== 'all') && (
            <button
              onClick={() => {
                setFilterPeriod('all');
                setFilterStatus('all');
                setFilterSector('all');
                setFilterCategory('all');
              }}
              className="px-2.5 py-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Limpar Filtros
            </button>
          )}

        </div>
      </div>

      {/* SECTION 3: KEY PERFORMANCE INDICATORS (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1: Total Desembolsado */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-2xs flex flex-col justify-between min-h-[130px]">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-slate-400 tracking-tight uppercase">Desembolso Total</span>
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-slate-900 tracking-tight block font-sans">
              {formatBRL(totalSpent)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1 font-medium font-mono">
              Soma: {formatBRL(totalCompleted)} Concluído
            </span>
          </div>
        </div>

        {/* KPI 2: Provisões Pendentes */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-2xs flex flex-col justify-between min-h-[130px]">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-slate-400 tracking-tight uppercase">Provisionamento</span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-slate-900 tracking-tight block font-sans">
              {formatBRL(totalPending)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1 font-medium">
              Contas com pagamento pendente
            </span>
          </div>
        </div>

        {/* KPI 3: Ticket Médio por Lançamento */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-2xs flex flex-col justify-between min-h-[130px]">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-slate-400 tracking-tight uppercase">Ticket Médio</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-slate-900 tracking-tight block font-sans">
              {formatBRL(averageTicket)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1 font-medium">
              Por transação compilada
            </span>
          </div>
        </div>

        {/* KPI 4: Volume de Compras */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-2xs flex flex-col justify-between min-h-[130px]">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-slate-400 tracking-tight uppercase">Transações</span>
            <span className="p-1.5 bg-cyan-50 text-cyan-600 rounded-lg">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black text-slate-900 tracking-tight block font-sans">
              {totalQuantity}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1 font-medium font-mono">
              {uniqueSuppliersCount} fornecedores ativos
            </span>
          </div>
        </div>

      </div>

      {/* QUICK SHORTCUT ACTIONS BAR */}
      <div className="flex flex-wrap items-center gap-3 bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100/60 justify-between">
        <div className="flex items-center gap-2 text-slate-700">
          <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-bold">Atalhos de Ação do Analista:</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenNewListModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 duration-100"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Lançamento</span>
          </button>
          <button
            onClick={onOpenScan}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 duration-100"
          >
            <ScanLine className="w-3.5 h-3.5 text-indigo-500" />
            <span>Importar OCR Nota</span>
          </button>
          <button
            onClick={() => onNavigate("lists")}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 duration-100"
          >
            <span>Ir para Livro Razão</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SECTION 4: ADVANCED GRAPHICAL PLOTS (BENTO GRID) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Plot 1: Monthly Outflow Trend vs Volumetric Density (8 Cols) */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-2xs lg:col-span-8 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                Linha de Tendência Temporal: Desembolso vs Volume de Compras
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Análise de sazonalidade e fluxo de desembolsos mensais compilados</p>
            </div>
          </div>

          <div className="h-80 flex items-center justify-center">
            {monthlyTimelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTimelineData} margin={{ top: 15, right: 10, left: 10, bottom: 10 }}>
                  <defs>
                    <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `R$ ${val.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: '#06b6d4', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `${val} un`}
                  />
                  <Tooltip 
                    formatter={(value: any, name: string) => {
                      if (name === "Volume") return [value, "Quantidade de Compras"];
                      return [formatBRL(Number(value)), "Valor Total Faturado"];
                    }}
                    contentStyle={{ borderRadius: '16px', borderColor: '#e2e8f0', fontSize: '11px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="Valor (R$)" 
                    stroke="#4f46e5" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorSpent)" 
                    activeDot={{ r: 6 }}
                  />
                  <Area 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="Volume" 
                    stroke="#06b6d4" 
                    strokeWidth={2.5}
                    strokeDasharray="4 4"
                    fill="none"
                    activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center space-y-2">
                <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-400 italic">Nenhum registro encontrado para gerar a linha temporal.</p>
              </div>
            )}
          </div>
        </div>

        {/* Plot 2: Cost Allocation Toggle - Cost Center vs Sector (4 Cols) */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-2xs lg:col-span-4 min-w-0 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                <PieChartIcon className="w-4 h-4 text-indigo-500" />
                Alocação Corporativa
              </h3>
              
              {/* Distribution toggle button */}
              <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200/50">
                <button
                  onClick={() => setDistributionType('centroCusto')}
                  className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all cursor-pointer ${distributionType === 'centroCusto' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'}`}
                  title="Alocar por Centro de Custo"
                >
                  C. Custo
                </button>
                <button
                  onClick={() => setDistributionType('setor')}
                  className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all cursor-pointer ${distributionType === 'setor' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'}`}
                  title="Alocar por Setor / Departamento"
                >
                  Setor
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mb-6">Visualização proporcional de gastos por {distributionType === 'centroCusto' ? 'Centro de Custo' : 'Setor ou Departamento'}</p>
          </div>

          <div className="h-64 flex items-center justify-center relative">
            {allocationData.length > 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [formatBRL(Number(value)), 'Gasto Total']}
                      contentStyle={{ borderRadius: '12px', borderColor: '#e2e8f0', fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Total overlay in center text */}
                <div className="absolute top-[35%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Total</span>
                  <span className="text-sm font-extrabold text-slate-800 leading-none">{formatBRL(totalSpent)}</span>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-1">
                <p className="text-xs text-slate-400 italic">Sem dados proporcionais para exibir.</p>
              </div>
            )}
          </div>

          {/* Clean custom Legend */}
          <div className="max-h-24 overflow-y-auto border-t border-slate-50 pt-2.5 mt-2 space-y-1 scrollbar-thin">
            {allocationData.slice(0, 4).map((item, idx) => {
              const pct = totalSpent > 0 ? (item.value / totalSpent) * 100 : 0;
              return (
                <div key={item.name} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-slate-600 font-medium truncate" title={item.name}>{item.name}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-800">{pct.toFixed(1)}%</span>
                </div>
              );
            })}
            {allocationData.length > 4 && (
              <div className="text-[10px] text-slate-400 italic text-center">
                + {allocationData.length - 4} classificações adicionais
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Plot 3: Supplier Allocation Matrix (Horizontal Bar Chart) */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-2xs min-w-0 overflow-hidden">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-indigo-500" />
              Matriz de Concentração de Fornecedores (Top 10)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Top 10 fornecedores pelo montante total financeiro acumulado</p>
          </div>

          <div className="h-64 mt-6 flex items-center justify-center">
            {topSuppliersData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={topSuppliersData} 
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 35, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis 
                    type="number"
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `R$ ${val}`}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category"
                    tick={{ fill: '#475569', fontSize: 10, fontWeight: 'medium' }}
                    axisLine={false}
                    tickLine={false}
                    width={90}
                  />
                  <Tooltip 
                    formatter={(value: any, name: string, props: any) => [
                      `${formatBRL(Number(value))} (${props.payload.count} compras)`, 'Investimento'
                    ]}
                    contentStyle={{ borderRadius: '12px', borderColor: '#e2e8f0', fontSize: '11px' }}
                  />
                  <Bar dataKey="spent" radius={[0, 6, 6, 0]} barSize={20}>
                    {topSuppliersData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-400 italic">Sem lançamentos para avaliar fornecedores</span>
            )}
          </div>
        </div>

        {/* Plot 4: Concentration by Accounting Classification (Chart of Accounts) */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-2xs min-w-0 overflow-hidden flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-indigo-500" />
              Gasto por Classificação / Categoria Contábil
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Distribuição do fluxo de saída pelos planos de contas mais solicitados</p>
          </div>

          <div className="space-y-4 mt-6 overflow-y-auto max-h-[250px] pr-2 scrollbar-thin">
            {categoryAllocationData.length > 0 ? (
              categoryAllocationData.map((item, idx) => {
                const percentageOfTotal = totalSpent > 0 ? (item.value / totalSpent) * 100 : 0;
                return (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 truncate max-w-[300px]" title={item.name}>
                        {item.name}
                      </span>
                      <div className="flex items-center gap-2 font-mono text-slate-500 shrink-0">
                        <span className="font-semibold text-slate-900">{formatBRL(item.value)}</span>
                        <span>({percentageOfTotal.toFixed(1)}%)</span>
                      </div>
                    </div>
                    
                    {/* Visual Progress gauge */}
                    <div className="w-full bg-slate-50 h-2.5 rounded-full overflow-hidden border border-slate-100/50">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${percentageOfTotal}%`,
                          backgroundColor: COLORS[idx % COLORS.length]
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 italic py-6 text-center">Nenhuma categoria com gasto registrado.</p>
            )}
          </div>
        </div>

      </div>

      {/* SECTION 5: AUDITOR INSIGHTS & COMPLIANCE ANOMALIES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Audit Alerts (5 Cols) */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-2xs lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Relatório de Compliance & Auditoria Interna</h3>
            </div>
            <p className="text-[11px] text-slate-400 mb-5">Alertas de segurança estrutural, integridade cadastral e aderência ao orçamento</p>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin flex-1">
            {auditAlerts.length > 0 ? (
              auditAlerts.map((alert, idx) => (
                <div 
                  key={idx} 
                  className={`p-3.5 rounded-2xl border flex gap-3 ${
                    alert.type === 'danger' ? 'bg-rose-50/50 border-rose-100 text-rose-800' :
                    alert.type === 'warning' ? 'bg-amber-50/50 border-amber-100 text-amber-800' :
                    'bg-sky-50/50 border-sky-100 text-sky-800'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    <AlertTriangle className={`w-4 h-4 ${
                      alert.type === 'danger' ? 'text-rose-600' :
                      alert.type === 'warning' ? 'text-amber-600' :
                      'text-sky-600'
                    }`} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold leading-tight mb-0.5">{alert.title}</h4>
                    <p className="text-[10.5px] leading-relaxed opacity-90">{alert.message}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 bg-emerald-50/40 rounded-2xl border border-emerald-100 text-center text-emerald-800 space-y-2">
                <CheckCircle2 className="w-7 h-7 text-emerald-600 mx-auto" />
                <h4 className="text-xs font-bold">Base Totalmente Conforme!</h4>
                <p className="text-[10px] opacity-90">Nenhuma inconformidade cadastral ou orçamentária detectada nos algoritmos ativos.</p>
              </div>
            )}
          </div>

          {/* Disclaimer metadata */}
          <div className="mt-5 border-t border-slate-50 pt-3 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Scan Engine v2.1</span>
            <span>Próxima varredura: On-Demand</span>
          </div>
        </div>

        {/* Drill-down of largest transactions (7 Cols) */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-2xs lg:col-span-7 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-indigo-500" />
              Transações de Maior Impacto Financeiro (Top 10)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Análise prioritária dos desembolsos de maior valor. Clique em qualquer linha para auditar ou editar no Razão.</p>
          </div>

          <div className="mt-5 overflow-x-auto border border-slate-100 rounded-2xl flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                  <th className="p-3">Data</th>
                  <th className="p-3">Fornecedor</th>
                  <th className="p-3">Classificação / C. Custo</th>
                  <th className="p-3 text-right">Valor Total</th>
                  <th className="p-3 text-center">Auditar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {topTransactions.length > 0 ? (
                  topTransactions.map((list) => {
                    const formattedDate = list.dataLancamento 
                      ? list.dataLancamento.split("-").reverse().join("/") 
                      : list.date.split("-").reverse().join("/");
                    
                    return (
                      <tr 
                        key={list.id} 
                        onClick={() => onSelectList(list)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                      >
                        <td className="p-3 font-mono font-medium text-slate-500 whitespace-nowrap">{formattedDate}</td>
                        <td className="p-3 font-bold text-slate-800 truncate max-w-[140px]" title={list.fornecedor || list.name}>
                          {list.fornecedor || list.name || "Não informado"}
                        </td>
                        <td className="p-3 text-slate-500 whitespace-nowrap">
                          <span className="block font-semibold text-slate-700 max-w-[160px] truncate" title={list.category}>
                            {list.category || "Sem categoria"}
                          </span>
                          <span className="block text-[9.5px] text-slate-400 font-mono">
                            {list.centroCusto || "CC-Geral"}
                          </span>
                        </td>
                        <td className="p-3 text-right font-sans font-bold text-slate-950 whitespace-nowrap">
                          {formatBRL(list.spent)}
                        </td>
                        <td className="p-3 text-center">
                          <button className="p-1 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-all group-hover:scale-110">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400 italic">
                      Aguardando lançamentos para compilar transações de impacto.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-right">
            <span className="text-[10px] text-slate-400 font-medium">
              * Clique em uma linha para abrir a transação no painel de edição
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
