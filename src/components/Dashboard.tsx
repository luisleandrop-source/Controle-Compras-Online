import React, { useState, useMemo } from "react";
import {
  Package,
  DollarSign,
  TrendingUp,
  Truck,
  Tag,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  ChevronRight,
  BarChart3,
  PieChart as PieChartIcon,
  Mail,
  Send,
  RefreshCw,
  X
} from "lucide-react";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
  Legend
} from "recharts";
import { ShoppingList } from "../types";

interface DashboardProps {
  shoppingLists: ShoppingList[];
  monthlyLimit: number;
  monthlyIncome: number;
  onNavigate: (tab: "nova-compra" | "dashboard" | "lists" | "categories") => void;
  onOpenScan: () => void;
  onOpenNewListModal: () => void;
  onSelectList: (list: ShoppingList) => void;
  userProfileName: string;
  onEditProfileName: (newName: string) => void;
}

const COLORS = [
  "#4f46e5",
  "#0d9488",
  "#2563eb",
  "#d97706",
  "#7c3aed",
  "#0f172a",
  "#0284c7",
  "#e11d48"
];

const formatBRL = (value: number) => {
  return (
    "R$ " +
    value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  );
};

export default function Dashboard({
  shoppingLists,
  onNavigate,
  onSelectList
}: DashboardProps) {
  const [filterPeriod, setFilterPeriod] = useState<
    "all" | "year" | "month" | "last_month"
  >("all");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "CONCLUÍDO" | "PENDENTE"
  >("all");
  const [filterSector, setFilterSector] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [distributionType, setDistributionType] = useState<
    "centroCusto" | "setor"
  >("centroCusto");

  // Email Settings & Integration State
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [scheduledTime, setScheduledTime] = useState("08:00");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [emailStatusMsg, setEmailStatusMsg] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [showSmtpConfig, setShowSmtpConfig] = useState(false);

  const now = useMemo(() => new Date(), []);
  const currentYearPrefix = `${now.getFullYear()}`;
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonthDate = useMemo(
    () => new Date(now.getFullYear(), now.getMonth() - 1, 1),
    [now]
  );
  const lastMonthPrefix = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;

  React.useEffect(() => {
    fetchEmailSettings();
  }, []);

  const fetchEmailSettings = async () => {
    setIsLoadingEmail(true);
    try {
      const res = await fetch("/api/settings/email");
      if (res.ok) {
        const data = await res.json();
        setEmailEnabled(data.enabled);
        setRecipientEmail(data.recipientEmail || "");
        setScheduledTime(data.scheduledTime || "08:00");
        setSmtpHost(data.smtpHost || "");
        setSmtpPort(data.smtpPort || 587);
        setSmtpUser(data.smtpUser || "");
        setSmtpPass(data.smtpPass || "");
        setSmtpSecure(data.smtpSecure || false);
        setEmailLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Erro ao carregar configurações de e-mail:", err);
    } finally {
      setIsLoadingEmail(false);
    }
  };

  const handleSaveEmailSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingEmail(true);
    setEmailStatusMsg(null);
    try {
      const res = await fetch("/api/settings/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: emailEnabled,
          recipientEmail,
          scheduledTime,
          smtpHost,
          smtpPort: Number(smtpPort),
          smtpUser,
          smtpPass,
          smtpSecure
        })
      });
      if (res.ok) {
        const data = await res.json();
        setEmailLogs(data.logs || []);
        setEmailStatusMsg({
          type: "success",
          text: "Configurações de e-mail salvas com sucesso."
        });
      } else {
        setEmailStatusMsg({
          type: "error",
          text: "Não foi possível salvar as configurações."
        });
      }
    } catch (err: any) {
      setEmailStatusMsg({
        type: "error",
        text: err.message || "Erro de conexão."
      });
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handleTestEmailSend = async () => {
    setIsTestingEmail(true);
    setEmailStatusMsg({
      type: "info",
      text: "Processando envio de relatório de teste..."
    });
    try {
      const res = await fetch("/api/send-report?force=true", {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        setEmailStatusMsg({
          type: "success",
          text: data.simulated
            ? "Relatório gerado com sucesso em modo simulado (consulte o histórico ao lado)."
            : "Relatório enviado com sucesso para o destinatário configurado."
        });
        await fetchEmailSettings();
      } else {
        setEmailStatusMsg({
          type: "error",
          text: data.message || "Falha ao processar o envio."
        });
      }
    } catch (err: any) {
      setEmailStatusMsg({
        type: "error",
        text: err.message || "Erro de conexão ao disparar relatório."
      });
    } finally {
      setIsTestingEmail(false);
    }
  };

  const sectorsList = useMemo(() => {
    const list = new Set<string>();
    shoppingLists.forEach((l) => {
      if (l.setor) list.add(l.setor.trim());
    });
    return Array.from(list).filter(Boolean).sort();
  }, [shoppingLists]);

  const categoriesList = useMemo(() => {
    const list = new Set<string>();
    shoppingLists.forEach((l) => {
      if (l.category) list.add(l.category.trim());
    });
    return Array.from(list).filter(Boolean).sort();
  }, [shoppingLists]);

  const filteredLists = useMemo(() => {
    return shoppingLists.filter((list) => {
      if (filterStatus !== "all" && list.status !== filterStatus) return false;
      if (filterSector !== "all" && list.setor !== filterSector) return false;
      if (filterCategory !== "all" && list.category !== filterCategory)
        return false;

      const dateStr = list.dataLancamento || list.date || "";
      if (filterPeriod === "year") {
        if (!dateStr.startsWith(currentYearPrefix)) return false;
      } else if (filterPeriod === "month") {
        if (!dateStr.startsWith(currentMonthPrefix)) return false;
      } else if (filterPeriod === "last_month") {
        if (!dateStr.startsWith(lastMonthPrefix)) return false;
      }

      return true;
    });
  }, [
    shoppingLists,
    filterStatus,
    filterSector,
    filterCategory,
    filterPeriod,
    currentYearPrefix,
    currentMonthPrefix,
    lastMonthPrefix
  ]);

  const totalSpent = useMemo(() => {
    return filteredLists.reduce((sum, list) => sum + (list.spent || 0), 0);
  }, [filteredLists]);

  const totalQuantity = filteredLists.length;

  const averageTicket = useMemo(() => {
    return totalQuantity > 0 ? totalSpent / totalQuantity : 0;
  }, [totalSpent, totalQuantity]);

  const totalPending = useMemo(() => {
    return filteredLists
      .filter((list) => list.status === "PENDENTE")
      .reduce((sum, list) => sum + (list.spent || list.budget || 0), 0);
  }, [filteredLists]);

  const totalCompleted = useMemo(() => {
    return filteredLists
      .filter((list) => list.status === "CONCLUÍDO")
      .reduce((sum, list) => sum + (list.spent || 0), 0);
  }, [filteredLists]);

  const uniqueSuppliersCount = useMemo(() => {
    return new Set(
      filteredLists
        .map((list) => (list.fornecedor || list.name || "").trim().toLowerCase())
        .filter(Boolean)
    ).size;
  }, [filteredLists]);

  const monthlyTimelineData = useMemo(() => {
    const monthlyMap: Record<
      string,
      { spent: number; count: number; sortKey: string }
    > = {};
    const months = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez"
    ];

    filteredLists.forEach((list) => {
      const dateKey = list.dataLancamento || list.date;
      if (!dateKey || !dateKey.includes("-")) {
        const fallbackLabel = `${months[now.getMonth()]}/${String(now.getFullYear()).slice(2)}`;
        if (!monthlyMap[fallbackLabel]) {
          monthlyMap[fallbackLabel] = {
            spent: 0,
            count: 0,
            sortKey: currentMonthPrefix
          };
        }
        monthlyMap[fallbackLabel].spent += list.spent || 0;
        monthlyMap[fallbackLabel].count += 1;
        return;
      }

      const parts = dateKey.split("-");
      const year = parts[0];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const monthName = months[monthIndex] || "Jan";
      const label = `${monthName}/${year.substring(2)}`;
      const sortKey = `${year}-${parts[1]}`;

      if (!monthlyMap[label]) {
        monthlyMap[label] = { spent: 0, count: 0, sortKey };
      }
      monthlyMap[label].spent += list.spent || 0;
      monthlyMap[label].count += 1;
    });

    return Object.entries(monthlyMap)
      .map(([name, data]) => ({
        name,
        "Valor (R$)": Number(data.spent.toFixed(2)),
        Volume: data.count,
        sortKey: data.sortKey
      }))
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [filteredLists, now, currentMonthPrefix]);

  const allocationData = useMemo(() => {
    const map: Record<string, number> = {};

    filteredLists.forEach((list) => {
      const key =
        distributionType === "centroCusto"
          ? (list.centroCusto || "Não Informado").trim()
          : (list.setor || "Não Informado").trim();
      map[key] = (map[key] || 0) + (list.spent || 0);
    });

    return Object.entries(map)
      .map(([name, value]) => ({
        name,
        value: Number(value.toFixed(2))
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filteredLists, distributionType]);

  const topSuppliersData = useMemo(() => {
    const map: Record<string, { spent: number; count: number }> = {};

    filteredLists.forEach((list) => {
      const supplierName = (
        list.fornecedor ||
        list.name ||
        "Não Informado"
      ).trim();
      if (!map[supplierName]) {
        map[supplierName] = { spent: 0, count: 0 };
      }
      map[supplierName].spent += list.spent || 0;
      map[supplierName].count += 1;
    });

    return Object.entries(map)
      .map(([name, data]) => ({
        name,
        spent: Number(data.spent.toFixed(2)),
        count: data.count
      }))
      .filter((item) => item.spent > 0)
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 8);
  }, [filteredLists]);

  const categoryAllocationData = useMemo(() => {
    const map: Record<string, number> = {};

    filteredLists.forEach((list) => {
      const rawCategory = list.category || "Não Classificado";
      const label =
        rawCategory.length > 42
          ? rawCategory.substring(0, 42) + "..."
          : rawCategory;
      map[label] = (map[label] || 0) + (list.spent || 0);
    });

    return Object.entries(map)
      .map(([name, value]) => ({
        name,
        value: Number(value.toFixed(2))
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredLists]);

  const auditAlerts = useMemo(() => {
    const alerts: Array<{
      type: "warning" | "info" | "danger";
      message: string;
      title: string;
    }> = [];

    let missingCCCount = 0;
    let missingSupplierCount = 0;
    let highInstallmentCount = 0;

    shoppingLists.forEach((l) => {
      if (
        !l.centroCusto ||
        l.centroCusto === "Não informado" ||
        l.centroCusto === "Sem Centro de Custo"
      ) {
        missingCCCount++;
      }
      if (
        !l.fornecedor ||
        l.fornecedor === "Sem Fornecedor" ||
        l.fornecedor.toLowerCase().includes("não informado")
      ) {
        missingSupplierCount++;
      }
      if (l.parcelas && l.parcelas > 6) {
        highInstallmentCount++;
      }
    });

    if (missingCCCount > 0) {
      alerts.push({
        type: "warning",
        title: "Alocação de Centro de Custo",
        message: `${missingCCCount} lançamentos sem centro de custo especificado.`
      });
    }

    if (missingSupplierCount > 0) {
      alerts.push({
        type: "info",
        title: "Padronização de Fornecedores",
        message: `${missingSupplierCount} lançamentos sem razão social ou fornecedor definido.`
      });
    }

    if (highInstallmentCount > 0) {
      alerts.push({
        type: "info",
        title: "Comprometimento Futuro",
        message: `${highInstallmentCount} compras parceladas acima de 6x impactando exercícios futuros.`
      });
    }

    return alerts;
  }, [shoppingLists]);

  const topTransactions = useMemo(() => {
    return [...filteredLists]
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 8);
  }, [filteredLists]);

  const hasFilters =
    filterPeriod !== "all" ||
    filterStatus !== "all" ||
    filterSector !== "all" ||
    filterCategory !== "all";

  return (
    <div className="space-y-6">
      {/* Executive Page Header + Integrated Filter Bar */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Análise de Compras
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Visão consolidada de desembolsos, provisões, centros de custo e
            classificação contábil.
          </p>
        </div>

        {/* Clean Segmented & Dropdown Filter Strip */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 p-1 bg-slate-200/60 rounded-lg">
            <button
              onClick={() => setFilterPeriod("all")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                filterPeriod === "all"
                  ? "bg-white text-slate-900 shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tudo
            </button>
            <button
              onClick={() => setFilterPeriod("year")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                filterPeriod === "year"
                  ? "bg-white text-slate-900 shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {currentYearPrefix}
            </button>
            <button
              onClick={() => setFilterPeriod("month")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                filterPeriod === "month"
                  ? "bg-white text-slate-900 shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Mês Atual
            </button>
            <button
              onClick={() => setFilterPeriod("last_month")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                filterPeriod === "last_month"
                  ? "bg-white text-slate-900 shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Mês Anterior
            </button>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-white border border-slate-200 text-xs font-medium text-slate-700 px-3 py-2 rounded-lg focus:outline-hidden focus:border-indigo-600 cursor-pointer"
          >
            <option value="all">Status: Todos</option>
            <option value="CONCLUÍDO">Concluídos</option>
            <option value="PENDENTE">Pendentes</option>
          </select>

          <select
            value={filterSector}
            onChange={(e) => setFilterSector(e.target.value)}
            className="bg-white border border-slate-200 text-xs font-medium text-slate-700 px-3 py-2 rounded-lg focus:outline-hidden focus:border-indigo-600 cursor-pointer max-w-[160px] truncate"
          >
            <option value="all">Setor: Todos</option>
            {sectorsList.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-white border border-slate-200 text-xs font-medium text-slate-700 px-3 py-2 rounded-lg focus:outline-hidden focus:border-indigo-600 cursor-pointer max-w-[200px] truncate"
          >
            <option value="all">Conta: Todas</option>
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {hasFilters && (
            <button
              onClick={() => {
                setFilterPeriod("all");
                setFilterStatus("all");
                setFilterSector("all");
                setFilterCategory("all");
              }}
              className="inline-flex items-center gap-1 px-2.5 py-2 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpar</span>
            </button>
          )}
        </div>
      </div>

      {/* 4-Column KPI Strip (Single-Elevation, Tabular Numerals) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Desembolso Total
            </span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums tracking-tight block">
              {formatBRL(totalSpent)}
            </span>
            <span className="text-xs text-slate-400 block mt-1 font-mono tabular-nums">
              {formatBRL(totalCompleted)} liquidado
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Provisões em Aberto
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums tracking-tight block">
              {formatBRL(totalPending)}
            </span>
            <span className="text-xs text-slate-400 block mt-1">
              Lançamentos com status pendente
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Ticket Médio
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums tracking-tight block">
              {formatBRL(averageTicket)}
            </span>
            <span className="text-xs text-slate-400 block mt-1">
              Média por ordem de compra
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Volume Operacional
            </span>
            <Package className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums tracking-tight block">
              {totalQuantity}
            </span>
            <span className="text-xs text-slate-400 block mt-1 font-mono tabular-nums">
              {uniqueSuppliersCount} fornecedores ativos
            </span>
          </div>
        </div>
      </div>

      {/* Primary Charts Grid (8 + 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Outflow Trend */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 lg:col-span-8 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                Evolução Temporal: Desembolso vs. Volume
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Sazonalidade mensal de faturamento e quantidade de ordens
              </p>
            </div>
          </div>

          <div className="h-72 flex items-center justify-center">
            {monthlyTimelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyTimelineData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) =>
                      `R$ ${val.toLocaleString("pt-BR", {
                        maximumFractionDigits: 0
                      })}`
                    }
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: "#0d9488", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `${val}`}
                  />
                  <Tooltip
                    formatter={(value: any, name: string) => {
                      if (name === "Volume")
                        return [value, "Ordens de Compra"];
                      return [formatBRL(Number(value)), "Valor Realizado"];
                    }}
                    contentStyle={{
                      borderRadius: "10px",
                      borderColor: "#e2e8f0",
                      fontSize: "12px",
                      boxShadow: "0 4px 12px rgba(15,23,42,0.06)"
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="Valor (R$)"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorSpent)"
                    activeDot={{ r: 5 }}
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="Volume"
                    stroke="#0d9488"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fill="none"
                    activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400">
                Sem lançamentos no período selecionado para exibir tendência.
              </p>
            )}
          </div>
        </div>

        {/* Allocation Donut */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 lg:col-span-4 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-indigo-600" />
                Alocação Corporativa
              </h2>

              <div className="flex bg-slate-100 rounded-lg p-0.5">
                <button
                  onClick={() => setDistributionType("centroCusto")}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    distributionType === "centroCusto"
                      ? "bg-white text-slate-900 shadow-2xs font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  C. Custo
                </button>
                <button
                  onClick={() => setDistributionType("setor")}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    distributionType === "setor"
                      ? "bg-white text-slate-900 shadow-2xs font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Setor
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Proporção por{" "}
              {distributionType === "centroCusto"
                ? "Centro de Custo"
                : "Setor"}
            </p>
          </div>

          <div className="h-52 relative flex items-center justify-center my-2">
            {allocationData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={76}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {allocationData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [
                        formatBRL(Number(value)),
                        "Total"
                      ]}
                      contentStyle={{
                        borderRadius: "10px",
                        borderColor: "#e2e8f0",
                        fontSize: "12px"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[11px] text-slate-400">Total</span>
                  <span className="text-xs font-mono tabular-nums font-bold text-slate-900">
                    {formatBRL(totalSpent)}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-400">
                Sem dados proporcionais no período.
              </p>
            )}
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-1.5 max-h-28 overflow-y-auto">
            {allocationData.slice(0, 4).map((item, idx) => {
              const pct = totalSpent > 0 ? (item.value / totalSpent) * 100 : 0;
              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span
                      className="w-2.5 h-2.5 rounded-xs shrink-0"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span
                      className="text-slate-600 truncate"
                      title={item.name}
                    >
                      {item.name}
                    </span>
                  </div>
                  <span className="font-mono tabular-nums font-semibold text-slate-900 shrink-0">
                    {pct.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Secondary Charts Grid (6 + 6) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Suppliers */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 min-w-0">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-4 h-4 text-indigo-600" />
            Concentração por Fornecedor
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Maiores parceiros comerciais por volume faturado
          </p>

          <div className="h-64 mt-5 flex items-center justify-center">
            {topSuppliersData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topSuppliersData}
                  layout="vertical"
                  margin={{ top: 5, right: 24, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    type="number"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `R$ ${val}`}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fill: "#334155", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={100}
                  />
                  <Tooltip
                    formatter={(value: any, _name: string, props: any) => [
                      `${formatBRL(Number(value))} (${props.payload.count} compras)`,
                      "Volume"
                    ]}
                    contentStyle={{
                      borderRadius: "10px",
                      borderColor: "#e2e8f0",
                      fontSize: "12px"
                    }}
                  />
                  <Bar dataKey="spent" radius={[0, 4, 4, 0]} barSize={18}>
                    {topSuppliersData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-400">
                Sem lançamentos para avaliar fornecedores.
              </span>
            )}
          </div>
        </div>

        {/* Chart of Accounts Concentration */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 min-w-0 flex flex-col">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-indigo-600" />
              Gasto por Classificação Contábil
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Distribuição acumulada pelas contas de despesa mais acionadas
            </p>
          </div>

          <div className="space-y-3.5 mt-5 overflow-y-auto max-h-64 pr-1 flex-1">
            {categoryAllocationData.length > 0 ? (
              categoryAllocationData.map((item, idx) => {
                const percentageOfTotal =
                  totalSpent > 0 ? (item.value / totalSpent) * 100 : 0;
                return (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs gap-3">
                      <span
                        className="font-medium text-slate-800 truncate"
                        title={item.name}
                      >
                        {item.name}
                      </span>
                      <div className="flex items-center gap-2 font-mono tabular-nums text-slate-500 shrink-0">
                        <span className="font-semibold text-slate-900">
                          {formatBRL(item.value)}
                        </span>
                        <span>({percentageOfTotal.toFixed(1)}%)</span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
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
              <div className="h-full flex items-center justify-center">
                <p className="text-xs text-slate-400">
                  Nenhuma conta com gasto registrado.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audit Compliance & Top Transactions Table (5 + 7) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 lg:col-span-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Conformidade Cadastral
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 mb-5">
              Verificação automática de preenchimento contábil e parcelamento
            </p>

            <div className="space-y-3">
              {auditAlerts.length > 0 ? (
                auditAlerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border flex gap-3 ${
                      alert.type === "danger"
                        ? "bg-rose-50/60 border-rose-200 text-rose-900"
                        : alert.type === "warning"
                          ? "bg-amber-50/60 border-amber-200 text-amber-900"
                          : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    <AlertTriangle
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        alert.type === "danger"
                          ? "text-rose-600"
                          : alert.type === "warning"
                            ? "text-amber-600"
                            : "text-indigo-600"
                      }`}
                    />
                    <div>
                      <h4 className="text-xs font-semibold">{alert.title}</h4>
                      <p className="text-xs opacity-85 mt-0.5 leading-relaxed">
                        {alert.message}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 bg-emerald-50/50 rounded-xl border border-emerald-200/80 text-center text-emerald-900 space-y-1.5">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                  <h4 className="text-xs font-semibold">
                    Base integralmente conforme
                  </h4>
                  <p className="text-xs text-emerald-700">
                    Todos os lançamentos possuem fornecedor e centro de custo
                    válidos.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Deseja inspecionar todos os registros?
            </span>
            <button
              onClick={() => onNavigate("lists")}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer whitespace-nowrap"
            >
              <span>Abrir Livro Razão</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* High-Impact Transactions Table */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 lg:col-span-7 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                Transações de Maior Impacto
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Clique em qualquer linha para abrir a ficha detalhada
              </p>
            </div>
            <FileSpreadsheet className="w-4 h-4 text-slate-400" />
          </div>

          <div className="overflow-x-auto border border-slate-200/80 rounded-xl flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold">
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-3">Fornecedor</th>
                  <th className="py-2.5 px-3">Classificação / C.C.</th>
                  <th className="py-2.5 px-3 text-right">Valor</th>
                  <th className="py-2.5 px-3 text-right w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topTransactions.length > 0 ? (
                  topTransactions.map((list) => {
                    const formattedDate = list.dataLancamento
                      ? list.dataLancamento.split("-").reverse().join("/")
                      : list.date;

                    return (
                      <tr
                        key={list.id}
                        onClick={() => onSelectList(list)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors h-10"
                      >
                        <td className="py-2 px-3 font-mono tabular-nums text-slate-500 whitespace-nowrap">
                          {formattedDate}
                        </td>
                        <td
                          className="py-2 px-3 font-semibold text-slate-900 truncate max-w-[150px]"
                          title={list.fornecedor || list.name}
                        >
                          {list.fornecedor || list.name || "Não informado"}
                        </td>
                        <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                          <span
                            className="max-w-[170px] truncate inline-block align-bottom"
                            title={list.category}
                          >
                            {list.category || "Sem conta"}
                          </span>
                          <span className="text-slate-300 mx-1.5">·</span>
                          <span className="font-mono tabular-nums text-slate-400">
                            {list.centroCusto || "CC-Geral"}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                          {formatBRL(list.spent)}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-400">
                          <ChevronRight className="w-4 h-4 inline" />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-10 px-4 text-center text-slate-400"
                    >
                      Nenhum lançamento disponível para compilar ranking.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Daily Email Reports Configuration */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Relatórios Diários por E-mail
              </h2>
              <p className="text-xs text-slate-500">
                Agende ou dispare sob demanda o consolidado financeiro da
                operação
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-medium inline-flex items-center gap-1.5 ${
                emailEnabled ? "text-emerald-700" : "text-slate-500"
              }`}
            >
              {emailEnabled ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Disparo ativo ({scheduledTime})</span>
                </>
              ) : (
                <span>Agendamento inativo</span>
              )}
            </span>

            <button
              onClick={fetchEmailSettings}
              disabled={isLoadingEmail}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Recarregar configurações"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoadingEmail ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {emailStatusMsg && (
          <div
            className={`px-4 py-3 rounded-xl border text-xs font-medium ${
              emailStatusMsg.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : emailStatusMsg.type === "error"
                  ? "bg-rose-50 border-rose-200 text-rose-800"
                  : "bg-indigo-50 border-indigo-200 text-indigo-800"
            }`}
          >
            {emailStatusMsg.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSaveEmailSettings}
            className="lg:col-span-7 space-y-5"
          >
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div>
                <h4 className="text-xs font-semibold text-slate-900">
                  Habilitar envio diário automático
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Executa a consolidação e envia o resumo no horário definido
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailEnabled}
                  onChange={(e) => setEmailEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5.5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-4.5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-transform peer-checked:bg-indigo-600" />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  E-mail destinatário
                </label>
                <input
                  type="email"
                  required
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="financeiro@empresa.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Horário programado
                </label>
                <input
                  type="time"
                  required
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono tabular-nums focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowSmtpConfig(!showSmtpConfig)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                {showSmtpConfig
                  ? "Ocultar credenciais SMTP"
                  : "Configurar servidor SMTP (opcional)"}
              </button>

              {showSmtpConfig && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Sem credenciais SMTP preenchidas, o disparo opera em modo
                    simulado registrando o relatório completo no histórico.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-8">
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Host SMTP
                      </label>
                      <input
                        type="text"
                        placeholder="smtp.gmail.com"
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-600"
                      />
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Porta
                      </label>
                      <input
                        type="number"
                        placeholder="587"
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-mono tabular-nums focus:bg-white focus:outline-hidden focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Usuário / Remetente
                      </label>
                      <input
                        type="text"
                        placeholder="conta@gmail.com"
                        value={smtpUser}
                        onChange={(e) => setSmtpUser(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Senha de Aplicativo (16 caracteres)
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••••••••••"
                        value={smtpPass}
                        onChange={(e) => setSmtpPass(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={smtpSecure}
                      onChange={(e) => setSmtpSecure(e.target.checked)}
                      className="rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-600">
                      Conexão segura SSL/TLS (porta 465)
                    </span>
                  </label>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={isTestingEmail || isLoadingEmail}
                onClick={handleTestEmailSend}
                className="px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {isTestingEmail ? "Enviando..." : "Disparar Teste Agora"}
                </span>
              </button>

              <button
                type="submit"
                disabled={isSavingEmail || isLoadingEmail}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl cursor-pointer disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {isSavingEmail ? "Salvando..." : "Salvar Configuração"}
              </button>
            </div>
          </form>

          <div className="lg:col-span-5 lg:border-l lg:border-slate-100 lg:pl-6 flex flex-col justify-between space-y-5">
            <div>
              <h4 className="text-xs font-semibold text-slate-900 mb-1">
                Histórico de Disparos
              </h4>
              <p className="text-xs text-slate-500 mb-3">
                Últimas execuções registradas pelo agendador
              </p>

              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {emailLogs.length > 0 ? (
                  emailLogs.map((log, idx) => {
                    const formattedLogDate = new Date(
                      log.timestamp
                    ).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit"
                    });
                    return (
                      <div key={idx} className="py-2.5 text-xs space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono tabular-nums text-slate-400">
                            {formattedLogDate}
                          </span>
                          <span
                            className={`font-medium ${
                              log.status === "success"
                                ? "text-emerald-700"
                                : log.status === "simulated"
                                  ? "text-amber-700"
                                  : "text-rose-700"
                            }`}
                          >
                            {log.status === "success"
                              ? "Enviado"
                              : log.status === "simulated"
                                ? "Simulado"
                                : "Falha"}
                          </span>
                        </div>
                        <p className="text-slate-700 break-words">
                          {log.message}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <p className="py-6 text-xs text-slate-400">
                    Nenhum disparo registrado até o momento.
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 text-xs text-slate-600 space-y-1.5">
              <p className="font-semibold text-slate-900">
                Autenticação Gmail SMTP
              </p>
              <p className="leading-relaxed">
                Para envio via Gmail (<code className="font-mono">smtp.gmail.com:587</code>), ative a verificação em duas etapas na sua Conta Google, gere uma <strong>Senha de App</strong> de 16 caracteres e informe-a no campo de senha SMTP.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
