import React, { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Filter,
  ShoppingBag,
  ChevronRight,
  X,
  Trash2,
  Check,
  Square,
  CheckSquare,
  ChevronLeft,
  PlusCircle,
  AlertTriangle,
  Pencil,
  FileSpreadsheet,
  Download,
  Upload,
  DollarSign,
  FileText,
  Clock,
  CheckCircle2,
  BarChart3,
  SlidersHorizontal
} from "lucide-react";
import * as XLSX from "xlsx";
import { ShoppingList, ShoppingItem, AppCategory } from "../types";

interface ListsProps {
  shoppingLists: ShoppingList[];
  onCreateList: (newList: ShoppingList) => void;
  onUpdateList: (updatedList: ShoppingList) => void;
  onDeleteList: (listId: string) => void;
  onDeleteLists?: (listIds: string[]) => void;
  onImportLists?: (lists: ShoppingList[]) => void;
  selectedListId: string | null;
  onSelectList: (list: ShoppingList | null) => void;
  onOpenNewListModal: () => void;
  categories: AppCategory[];
  onNavigate?: (tab: "nova-compra" | "dashboard" | "lists" | "categories") => void;
  onLogout?: () => void;
  userProfileName?: string;
}

const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return "-";
  if (dateStr.includes("-") && dateStr.split("-").length === 3) {
    const parts = dateStr.split("-");
    if (parts[0].length === 4) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  return dateStr;
};

const normalizeToISODate = (dateStr: string | undefined): string => {
  if (!dateStr) return "";
  const clean = dateStr.trim();
  if (clean.includes("-") && clean.split("-").length === 3) {
    const parts = clean.split("-");
    if (parts[0].length === 4) {
      return clean;
    } else if (parts[2].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }
  if (clean.includes("/") && clean.split("/").length === 3) {
    const parts = clean.split("/");
    if (parts[2].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }
  return clean;
};

const formatCategoryDisplay = (category: string | undefined): { code: string; desc: string } => {
  if (!category) return { code: "", desc: "" };
  const matchEnd = category.match(/^(.+?)\s*-\s*(\d{5})$/);
  if (matchEnd) {
    return { code: matchEnd[2], desc: matchEnd[1] };
  }
  const matchStart = category.match(/^(\d{5})\s*-\s*(.+)$/);
  if (matchStart) {
    return { code: matchStart[1], desc: matchStart[2] };
  }
  return { code: "", desc: category };
};

export default function Lists({
  shoppingLists,
  onUpdateList,
  onDeleteList,
  onDeleteLists,
  onImportLists,
  selectedListId,
  onSelectList,
  onOpenNewListModal,
  categories,
  onNavigate,
  userProfileName
}: ListsProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [confirmRowDeleteId, setConfirmRowDeleteId] = useState<string | null>(null);
  const [confirmDetailDelete, setConfirmDetailDelete] = useState(false);
  const [importNotice, setImportNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showFilters, setShowFilters] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [filterFornecedor, setFilterFornecedor] = useState("");
  const [filterCentroCusto, setFilterCentroCusto] = useState<string>("All");
  const [filterDestino, setFilterDestino] = useState("");
  const [filterRequisitor, setFilterRequisitor] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [pageSize, setPageSize] = useState<number>(15);
  const [currentPage, setCurrentPage] = useState<number>(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    filterCategory,
    filterFornecedor,
    filterCentroCusto,
    filterDestino,
    filterRequisitor,
    filterStartDate,
    filterEndDate,
    filterValue,
    pageSize
  ]);

  // Item additions inputs (Center Form)
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemQty, setNewItemQty] = useState("");

  // Detail View: Left Navigator state
  const [detailSearchTerm, setDetailSearchTerm] = useState("");
  const [detailStatusFilter, setDetailStatusFilter] = useState<
    "ALL" | "PENDENTE" | "CONCLUÍDO"
  >("ALL");

  // Detail View: Right Ficha Inline Edit state
  const [isEditingFicha, setIsEditingFicha] = useState(false);
  const [fichaFornecedor, setFichaFornecedor] = useState("");
  const [fichaCategory, setFichaCategory] = useState("");
  const [fichaBudget, setFichaBudget] = useState<number>(0);
  const [fichaDataLancamento, setFichaDataLancamento] = useState("");
  const [fichaSolicitante, setFichaSolicitante] = useState("");
  const [fichaSetor, setFichaSetor] = useState("");
  const [fichaCentroCusto, setFichaCentroCusto] = useState("");
  const [fichaFinalCartao, setFichaFinalCartao] = useState("");
  const [fichaParcelas, setFichaParcelas] = useState<number>(1);
  const [fichaEntrega, setFichaEntrega] = useState("");
  const [fichaDestino, setFichaDestino] = useState("");
  const [fichaDescricao, setFichaDescricao] = useState("");

  // Inline Spreadsheet Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editFornecedor, setEditFornecedor] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editParcelas, setEditParcelas] = useState<number>(1);
  const [editSpent, setEditSpent] = useState<number>(0);
  const [editSolicitante, setEditSolicitante] = useState("");
  const [editSetor, setEditSetor] = useState("");
  const [editCentroCusto, setEditCentroCusto] = useState("");
  const [editFinalCartao, setEditFinalCartao] = useState("");
  const [editEntrega, setEditEntrega] = useState("");
  const [editDestino, setEditDestino] = useState("");

  const activeList =
    shoppingLists.find((list) => list.id === selectedListId) || null;

  React.useEffect(() => {
    setIsEditingFicha(false);
    setConfirmDetailDelete(false);
  }, [selectedListId]);

  const startEditingFicha = (list: ShoppingList) => {
    setFichaFornecedor(list.fornecedor || list.name || "");
    setFichaCategory(list.category || "");
    setFichaBudget(list.budget || 0);
    setFichaDataLancamento(normalizeToISODate(list.dataLancamento || list.date));
    setFichaSolicitante(list.solicitante || userProfileName || "User");
    setFichaSetor(list.setor || "Tecnologia");
    setFichaCentroCusto(list.centroCusto || "CC-TI-42");
    setFichaFinalCartao(list.finalCartao || "9876");
    setFichaParcelas(list.parcelas || 1);
    setFichaEntrega(normalizeToISODate(list.entrega));
    setFichaDestino(list.destino || "Almoxarifado Central");
    setFichaDescricao(list.descricao || "");
    setIsEditingFicha(true);
  };

  const saveFichaChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeList) return;
    const updated: ShoppingList = {
      ...activeList,
      name: fichaFornecedor.trim() || activeList.name,
      fornecedor: fichaFornecedor.trim() || activeList.fornecedor,
      category: fichaCategory,
      budget: Number(fichaBudget) || 0,
      dataLancamento: fichaDataLancamento || activeList.dataLancamento,
      solicitante: fichaSolicitante.trim(),
      setor: fichaSetor.trim(),
      centroCusto: fichaCentroCusto.trim(),
      finalCartao: fichaFinalCartao.trim(),
      parcelas: Number(fichaParcelas) || 1,
      entrega: fichaEntrega,
      destino: fichaDestino.trim(),
      descricao: fichaDescricao.trim()
    };
    onUpdateList(updated);
    setIsEditingFicha(false);
  };

  const startEditing = (list: ShoppingList) => {
    setEditingId(list.id);
    setEditDate(normalizeToISODate(list.dataLancamento || list.date));
    setEditFornecedor(list.fornecedor || list.name || "");
    setEditCategory(list.category || "");
    setEditParcelas(list.parcelas || 1);
    setEditSpent(list.spent || 0);
    setEditSolicitante(list.solicitante || "User");
    setEditSetor(list.setor || "Tecnologia");
    setEditCentroCusto(list.centroCusto || "CC-TI-42");
    setEditFinalCartao(list.finalCartao || "9876");
    setEditEntrega(normalizeToISODate(list.entrega));
    setEditDestino(list.destino || "Almoxarifado");
  };

  const saveRowEditing = (list: ShoppingList) => {
    const updated: ShoppingList = {
      ...list,
      date: editDate || list.date,
      dataLancamento: editDate || list.dataLancamento,
      name: editFornecedor || list.fornecedor || list.name,
      fornecedor: editFornecedor,
      category: editCategory,
      parcelas: Number(editParcelas) || 1,
      spent: Number(editSpent) || 0,
      solicitante: editSolicitante,
      setor: editSetor,
      centroCusto: editCentroCusto,
      finalCartao: editFinalCartao,
      entrega: editEntrega,
      destino: editDestino
    };
    onUpdateList(updated);
    setEditingId(null);
  };

  const detailSidebarLists = useMemo(() => {
    return shoppingLists.filter((list) => {
      if (detailStatusFilter !== "ALL" && list.status !== detailStatusFilter)
        return false;
      if (detailSearchTerm.trim()) {
        const term = detailSearchTerm.toLowerCase().trim();
        const matchFornecedor = (list.fornecedor || list.name || "")
          .toLowerCase()
          .includes(term);
        const matchDesc = (list.descricao || "").toLowerCase().includes(term);
        const matchCat = (list.category || "").toLowerCase().includes(term);
        const matchSol = (list.solicitante || "").toLowerCase().includes(term);
        const matchCC = (list.centroCusto || "").toLowerCase().includes(term);
        return (
          matchFornecedor || matchDesc || matchCat || matchSol || matchCC
        );
      }
      return true;
    });
  }, [shoppingLists, detailSearchTerm, detailStatusFilter]);

  const uniqueCentros = useMemo(() => {
    const centros = new Set<string>();
    shoppingLists.forEach((list) => {
      if (list.centroCusto) {
        centros.add(list.centroCusto.trim());
      }
    });
    return Array.from(centros).filter(Boolean).sort();
  }, [shoppingLists]);

  const filteredLists = useMemo(() => {
    return shoppingLists.filter((list) => {
      const term = searchTerm.toLowerCase().trim();
      const listName = list.name || "";

      const matchesSearch =
        !term ||
        listName.toLowerCase().includes(term) ||
        (list.descricao || "").toLowerCase().includes(term) ||
        (list.items &&
          list.items.some((item) =>
            (item.name || "").toLowerCase().includes(term)
          ));

      const matchesCategory =
        filterCategory === "All" || list.category === filterCategory;

      const matchesFornecedor =
        !filterFornecedor ||
        listName.toLowerCase().includes(filterFornecedor.toLowerCase()) ||
        (list.fornecedor || "")
          .toLowerCase()
          .includes(filterFornecedor.toLowerCase());

      const matchesCentroCusto =
        filterCentroCusto === "All" ||
        (list.centroCusto || "").trim() === filterCentroCusto.trim();

      const matchesDestino =
        !filterDestino ||
        (list.destino || "")
          .toLowerCase()
          .includes(filterDestino.toLowerCase());

      const matchesRequisitor =
        !filterRequisitor ||
        (list.solicitante || "")
          .toLowerCase()
          .includes(filterRequisitor.toLowerCase());

      let matchesPeriod = true;
      const listDateNorm = normalizeToISODate(list.dataLancamento || list.date);
      if (filterStartDate || filterEndDate) {
        if (listDateNorm) {
          if (filterStartDate && listDateNorm < filterStartDate) {
            matchesPeriod = false;
          }
          if (filterEndDate && listDateNorm > filterEndDate) {
            matchesPeriod = false;
          }
        } else {
          matchesPeriod = false;
        }
      }

      let matchesValue = true;
      if (filterValue.trim()) {
        const rawInput = filterValue
          .trim()
          .toLowerCase()
          .replace("r$", "")
          .trim();
        const spentVal = Number(list.spent) || 0;
        const budgetVal = Number(list.budget) || 0;

        if (rawInput.startsWith(">")) {
          const target = parseFloat(
            rawInput.replace(">", "").trim().replace(".", "").replace(",", ".")
          );
          if (!isNaN(target)) {
            matchesValue = spentVal >= target || budgetVal >= target;
          }
        } else if (rawInput.startsWith("<")) {
          const target = parseFloat(
            rawInput.replace("<", "").trim().replace(".", "").replace(",", ".")
          );
          if (!isNaN(target)) {
            matchesValue = spentVal <= target || budgetVal <= target;
          }
        } else if (rawInput.includes("-")) {
          const parts = rawInput
            .split("-")
            .map((p) =>
              parseFloat(p.trim().replace(".", "").replace(",", "."))
            );
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            const min = Math.min(parts[0], parts[1]);
            const max = Math.max(parts[0], parts[1]);
            matchesValue =
              (spentVal >= min && spentVal <= max) ||
              (budgetVal >= min && budgetVal <= max);
          }
        } else {
          const numTarget = parseFloat(
            rawInput.replace(".", "").replace(",", ".")
          );
          const spentBrl = spentVal.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });
          const budgetBrl = budgetVal.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });

          const textMatch =
            spentBrl.toLowerCase().includes(rawInput) ||
            budgetBrl.toLowerCase().includes(rawInput) ||
            spentVal.toString().includes(rawInput) ||
            budgetVal.toString().includes(rawInput);

          const numMatch =
            !isNaN(numTarget) &&
            (Math.abs(spentVal - numTarget) < 0.01 ||
              Math.abs(budgetVal - numTarget) < 0.01);

          matchesValue = textMatch || numMatch;
        }
      }

      return (
        matchesSearch &&
        matchesCategory &&
        matchesFornecedor &&
        matchesCentroCusto &&
        matchesDestino &&
        matchesRequisitor &&
        matchesPeriod &&
        matchesValue
      );
    });
  }, [
    shoppingLists,
    searchTerm,
    filterCategory,
    filterFornecedor,
    filterCentroCusto,
    filterDestino,
    filterRequisitor,
    filterStartDate,
    filterEndDate,
    filterValue
  ]);

  const handleExportToExcel = () => {
    const formatExcelDate = (dateStr: string | undefined): string => {
      if (!dateStr) return "";
      const cleanStr = dateStr.trim();
      if (cleanStr.includes("-") && cleanStr.split("-").length === 3) {
        const parts = cleanStr.split("-");
        if (parts[0].length === 4) {
          return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }
      return cleanStr.replace(/\//g, "-");
    };

    const dataToExport = filteredLists.map((list) => {
      const itemsStr = list.items
        ? list.items
            .map(
              (item) =>
                `${item.name} (${item.quantity}x - R$ ${item.price.toFixed(2)})`
            )
            .join(", ")
        : "";

      return {
        ID: list.id,
        Data: formatExcelDate(list.dataLancamento || list.date),
        Fornecedor: list.fornecedor || list.name || "",
        "Classificação / Categoria Contábil": list.category || "",
        Produtos: list.descricao || itemsStr || "",
        "Valor Total (R$)": list.spent,
        Parcelas: list.parcelas || 1,
        Solicitante: list.solicitante || "User",
        Setor: list.setor || "Tecnologia",
        "Centro de Custo": list.centroCusto || "CC-TI-42",
        "Final Cartão": list.finalCartao || "9876",
        "Previsão de Entrega": formatExcelDate(list.entrega),
        Destino: list.destino || "Almoxarifado",
        Descrição: list.descricao || "",
        Status: list.status || "PENDENTE"
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Controle de Compras");

    const maxProps = [
      "ID",
      "Data",
      "Fornecedor",
      "Classificação / Categoria Contábil",
      "Produtos",
      "Valor Total (R$)",
      "Parcelas",
      "Solicitante",
      "Setor",
      "Centro de Custo",
      "Final Cartão",
      "Previsão de Entrega",
      "Destino",
      "Descrição",
      "Status"
    ];
    worksheet["!cols"] = maxProps.map((prop) => ({
      wch: Math.max(prop.length + 3, 14)
    }));

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const fullStamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;

    XLSX.writeFile(workbook, `Controle_de_Compras_${fullStamp}.xlsx`);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (!json || json.length === 0) {
          setImportNotice({
            type: "error",
            text: "A planilha selecionada não possui linhas de dados válidas."
          });
          return;
        }

        const importedLists: ShoppingList[] = json.map((row: any, index) => {
          const getVal = (keys: string[]) => {
            const cleanStr = (s: string) =>
              s
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .trim()
                .replace(/[\s\-\/_()$]/g, "");

            for (const key of keys) {
              const foundKey = Object.keys(row).find(
                (k) => cleanStr(k) === cleanStr(key)
              );
              if (foundKey && row[foundKey] !== undefined) {
                return row[foundKey];
              }
            }
            return undefined;
          };

          const id =
            getVal([
              "id",
              "identificador",
              "uuid",
              "codigo",
              "num",
              "sequencial"
            ])?.toString() ||
            `imported-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`;

          const dateRaw = getVal([
            "data",
            "datalancamento",
            "date",
            "lancamento",
            "datadelancamento",
            "datacompra",
            "datadecompra",
            "criadoem",
            "competencia",
            "dia"
          ]);
          let dateVal = "";
          if (dateRaw) {
            if (dateRaw instanceof Date) {
              const y = dateRaw.getFullYear();
              const m = String(dateRaw.getMonth() + 1).padStart(2, "0");
              const d = String(dateRaw.getDate()).padStart(2, "0");
              dateVal = `${y}-${m}-${d}`;
            } else if (typeof dateRaw === "number") {
              const dateObj = XLSX.SSF.parse_date_code(dateRaw);
              dateVal = `${dateObj.y}-${String(dateObj.m).padStart(2, "0")}-${String(dateObj.d).padStart(2, "0")}`;
            } else {
              const str = dateRaw.toString().trim();
              if (str.includes("/")) {
                const parts = str.split("/");
                if (parts.length === 3) {
                  if (parts[2].length === 4) {
                    dateVal = `${parts[2]}-${String(parts[1]).padStart(2, "0")}-${String(parts[0]).padStart(2, "0")}`;
                  } else if (parts[0].length === 4) {
                    dateVal = `${parts[0]}-${String(parts[1]).padStart(2, "0")}-${String(parts[2]).padStart(2, "0")}`;
                  }
                }
              } else if (str.includes("-")) {
                const parts = str.split("-");
                if (parts.length === 3) {
                  if (parts[0].length === 4) {
                    dateVal = str;
                  } else if (parts[2].length === 4) {
                    dateVal = `${parts[2]}-${String(parts[1]).padStart(2, "0")}-${String(parts[0]).padStart(2, "0")}`;
                  }
                }
              } else {
                dateVal = str;
              }
            }
          }
          if (!dateVal) {
            const d = new Date();
            dateVal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          }

          const fornecedor =
            getVal([
              "fornecedor",
              "supplier",
              "nomefornecedor",
              "name",
              "nome",
              "parceiro",
              "empresa",
              "credor"
            ])?.toString() || "Fornecedor Importado";

          let category =
            getVal([
              "categoria",
              "categoriacontabil",
              "classificacao",
              "category",
              "classificacaocategoriacontabil",
              "classificacaocategoria",
              "cat",
              "grupodespesa",
              "conta"
            ])?.toString() || "";
          if (category) {
            const lowerCat = category.toLowerCase();
            const matched = categories.find(
              (c) =>
                lowerCat.includes(c.code.toLowerCase()) ||
                lowerCat.includes(c.description.toLowerCase())
            );
            if (matched) {
              category = `${matched.description} - ${matched.code}`;
            }
          }

          const itemsRaw =
            getVal([
              "itens",
              "items",
              "itensadquiridos",
              "produtos",
              "produto",
              "produtosadquiridos",
              "descricaodositens",
              "detalhes"
            ])?.toString() || "";
          const items: ShoppingItem[] = [];
          if (itemsRaw) {
            const parts = itemsRaw.split(",");
            parts.forEach((p: string, pIdx: number) => {
              const text = p.trim();
              if (!text) return;

              const qtyMatch = text.match(/\((\d+)x/);
              const priceMatch = text.match(/R\$\s*([\d.,]+)/);

              const nameOnly = text.replace(/\([^)]+\)/g, "").trim();
              const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
              let price = 0;
              if (priceMatch) {
                let pStr = priceMatch[1].trim();
                if (pStr.includes(",") && pStr.includes(".")) {
                  if (pStr.indexOf(",") > pStr.indexOf(".")) {
                    pStr = pStr.replace(/\./g, "").replace(",", ".");
                  } else {
                    pStr = pStr.replace(/,/g, "");
                  }
                } else if (pStr.includes(",")) {
                  pStr = pStr.replace(",", ".");
                }
                price = parseFloat(pStr) || 0;
              }

              items.push({
                id: `item-${Date.now()}-${pIdx}-${Math.random().toString(36).slice(2, 7)}`,
                name: nameOnly || "Item",
                price,
                quantity: qty,
                checked: true
              });
            });
          }

          const rawSpent = getVal([
            "valortotal",
            "spent",
            "valor",
            "total",
            "valortotalr$",
            "valortotal(r$)",
            "valor(r$)",
            "preco",
            "precomaximo",
            "valordascompras"
          ]);
          let spentVal = 0;
          if (rawSpent !== undefined && rawSpent !== null) {
            if (typeof rawSpent === "number") {
              spentVal = rawSpent;
            } else {
              let str = rawSpent.toString().trim().replace(/[R$\s]/g, "");
              if (str.includes(",") && str.includes(".")) {
                if (str.indexOf(",") > str.indexOf(".")) {
                  str = str.replace(/\./g, "").replace(",", ".");
                } else {
                  str = str.replace(/,/g, "");
                }
              } else if (str.includes(",")) {
                str = str.replace(",", ".");
              }
              spentVal = Number(str) || 0;
            }
          }

          const rawParcelas = getVal([
            "parcelas",
            "installments",
            "nparcelas",
            "nroparcelas",
            "numeroofparcelas",
            "vezes",
            "quantidade_parcelas",
            "qtdparcelas",
            "prazo"
          ]);
          let parcelasVal = 1;
          if (rawParcelas !== undefined && rawParcelas !== null) {
            if (typeof rawParcelas === "number") {
              parcelasVal = Math.round(rawParcelas);
            } else {
              const str = rawParcelas.toString().replace(/\D/g, "");
              parcelasVal = parseInt(str, 10) || 1;
            }
          }

          const solicitante =
            getVal([
              "solicitante",
              "requester",
              "solicitadopor",
              "solicitado",
              "requisitor",
              "requisitante",
              "colaborador",
              "criador",
              "responsavel",
              "quem",
              "comprador",
              "autor"
            ])?.toString() ||
            userProfileName ||
            "User";
          const setor =
            getVal([
              "setor",
              "sector",
              "department",
              "departamento",
              "area",
              "divisao",
              "centroderesponsabilidade",
              "setor_solicitante"
            ])?.toString() || "Tecnologia";
          const centroCusto =
            getVal([
              "centro",
              "centrodecusto",
              "centrocusto",
              "costcenter",
              "cc",
              "centro_de_custo",
              "codigo_cc",
              "codigocc",
              "setor_cc",
              "centro_custo",
              "centrocustos",
              "nomedocentrodecusto",
              "nomecentrocusto",
              "ccusto",
              "cdecusto",
              "centrodecustos",
              "codigodocentrodecusto",
              "codigocentrodecusto"
            ])
              ?.toString()
              ?.trim() || "CC-TI-42";
          const finalCartao =
            getVal([
              "finalcartao",
              "card",
              "cartao",
              "finaldocartao",
              "numerodocartao",
              "numerocartao",
              "numdocartao",
              "n_cartao",
              "final",
              "cartaofinal",
              "final_cartao"
            ])?.toString() || "9876";

          const entregaRaw = getVal([
            "previsaoentrega",
            "entrega",
            "delivery",
            "previsaodeentrega",
            "dataentrega",
            "prazodeentrega",
            "recebimento",
            "previsao",
            "data_entrega"
          ]);
          let entregaVal = "";
          if (entregaRaw) {
            if (entregaRaw instanceof Date) {
              const y = entregaRaw.getFullYear();
              const m = String(entregaRaw.getMonth() + 1).padStart(2, "0");
              const d = String(entregaRaw.getDate()).padStart(2, "0");
              entregaVal = `${y}-${m}-${d}`;
            } else if (typeof entregaRaw === "number") {
              const dateObj = XLSX.SSF.parse_date_code(entregaRaw);
              entregaVal = `${dateObj.y}-${String(dateObj.m).padStart(2, "0")}-${String(dateObj.d).padStart(2, "0")}`;
            } else {
              entregaVal = normalizeToISODate(entregaRaw.toString());
            }
          }

          const destino =
            getVal([
              "destino",
              "destination",
              "local",
              "localentrega",
              "destinatario",
              "enviara",
              "enviar_para"
            ])?.toString() || "Almoxarifado";
          const descricao =
            getVal([
              "descricao",
              "description",
              "produtos",
              "produto",
              "obs",
              "observacao",
              "detalhes",
              "motivo",
              "observacoes"
            ])?.toString() || "";
          const statusVal =
            getVal([
              "status",
              "situacao",
              "estado",
              "aprovado",
              "fase",
              "pago",
              "etapa"
            ])
              ?.toString()
              ?.toUpperCase() === "PENDENTE"
              ? "PENDENTE"
              : "CONCLUÍDO";

          return {
            id,
            name: fornecedor,
            budget: spentVal || 100,
            spent: spentVal,
            date: dateVal,
            category,
            status: statusVal,
            items,
            fornecedor,
            parcelas: parcelasVal,
            solicitante,
            setor,
            centroCusto,
            finalCartao,
            entrega: entregaVal,
            destino,
            descricao,
            dataLancamento: dateVal
          };
        });

        if (importedLists.length > 0) {
          onImportLists?.(importedLists);
          setImportNotice({
            type: "success",
            text: `${importedLists.length} lançamentos importados com sucesso.`
          });
          setTimeout(() => setImportNotice(null), 5000);
        }
      } catch (err) {
        console.error(err);
        setImportNotice({
          type: "error",
          text: "Não foi possível ler o arquivo. Verifique se está no formato .xlsx, .xls ou .csv."
        });
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const handleToggleItem = (list: ShoppingList, itemId: string) => {
    const updatedItems = list.items.map((item) =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );

    const checkedSum = updatedItems
      .filter((it) => it.checked)
      .reduce((sum, it) => sum + it.price * it.quantity, 0);

    const updatedList: ShoppingList = {
      ...list,
      items: updatedItems,
      spent: checkedSum > 0 ? checkedSum : 0
    };

    onUpdateList(updatedList);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeList || !newItemName.trim()) return;

    const price = parseFloat(newItemPrice.replace(",", ".")) || 0;
    const qty = parseInt(newItemQty) || 1;

    const newItem: ShoppingItem = {
      id: `item-${Date.now()}`,
      name: newItemName.trim(),
      price,
      quantity: qty,
      checked: activeList.status === "CONCLUÍDO"
    };

    const updatedItems = [...activeList.items, newItem];

    const checkedSum = updatedItems
      .filter((it) => it.checked)
      .reduce((sum, it) => sum + it.price * it.quantity, 0);

    const updatedList: ShoppingList = {
      ...activeList,
      items: updatedItems,
      spent:
        activeList.status === "CONCLUÍDO"
          ? updatedItems.reduce((sum, it) => sum + it.price * it.quantity, 0)
          : checkedSum > 0
            ? checkedSum
            : activeList.spent
    };

    onUpdateList(updatedList);
    setNewItemName("");
    setNewItemPrice("");
    setNewItemQty("");
  };

  const handleDeleteItem = (list: ShoppingList, itemId: string) => {
    const updatedItems = list.items.filter((item) => item.id !== itemId);

    const checkedSum = updatedItems
      .filter((it) => it.checked)
      .reduce((sum, it) => sum + it.price * it.quantity, 0);

    const updatedList: ShoppingList = {
      ...list,
      items: updatedItems,
      spent:
        list.status === "CONCLUÍDO"
          ? updatedItems.reduce((sum, it) => sum + it.price * it.quantity, 0)
          : checkedSum
    };

    onUpdateList(updatedList);
  };

  const toggleListStatus = (list: ShoppingList) => {
    const isNowCompleted = list.status === "PENDENTE";

    const updatedItems = list.items.map((item) => ({
      ...item,
      checked: isNowCompleted ? true : item.checked
    }));

    const totalSum = updatedItems.reduce(
      (sum, it) => sum + it.price * it.quantity,
      0
    );

    const updatedList: ShoppingList = {
      ...list,
      status: isNowCompleted ? "CONCLUÍDO" : "PENDENTE",
      items: updatedItems,
      spent: isNowCompleted ? totalSum || list.budget : 0
    };

    onUpdateList(updatedList);
  };

  const activeListTotalItemsVal = activeList
    ? activeList.items.reduce((sum, it) => sum + it.price * it.quantity, 0)
    : 0;

  const activeListCheckedItemsCount = activeList
    ? activeList.items.filter((it) => it.checked).length
    : 0;

  const kpiTotalPurchases = filteredLists.length;
  const kpiTotalSpent = filteredLists.reduce(
    (sum, list) => sum + (list.spent || 0),
    0
  );
  const kpiAverageSpent =
    kpiTotalPurchases > 0 ? kpiTotalSpent / kpiTotalPurchases : 0;

  const formatBRLCurrency = (val: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(val);
  };

  const hasActiveFilters = Boolean(
    filterFornecedor ||
      filterCentroCusto !== "All" ||
      filterDestino ||
      filterRequisitor ||
      searchTerm ||
      filterCategory !== "All" ||
      filterStartDate ||
      filterEndDate ||
      filterValue
  );

  return (
    <div>
      {!activeList ? (
        /* ============================================================== */
        /* DIRECTORY & LEDGER SPREADSHEET VIEW                            */
        /* ============================================================== */
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                Livro Razão de Compras
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Controle centralizado de solicitações, fornecedores, parcelas e
                conciliação contábil.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Importar Excel</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleImportExcel}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleExportToExcel}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Exportar Excel</span>
              </button>

              {onNavigate && (
                <button
                  onClick={() => onNavigate("dashboard")}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Painel Analítico</span>
                </button>
              )}
            </div>
          </div>

          {importNotice && (
            <div
              className={`px-4 py-3 rounded-xl border text-xs font-medium flex items-center justify-between gap-3 ${
                importNotice.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              <span>{importNotice.text}</span>
              <button
                onClick={() => setImportNotice(null)}
                className="p-1 hover:opacity-75 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* 3-Column KPI Strip (Full-Width Balanced Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-xl p-5">
              <span className="text-xs font-medium text-slate-500 block">
                Total de Lançamentos
              </span>
              <span className="text-2xl md:text-3xl font-bold text-slate-900 font-mono tabular-nums tracking-tight block mt-2">
                {kpiTotalPurchases}
              </span>
              <span className="text-xs text-slate-400 block mt-1">
                Registros filtrados na visualização
              </span>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-5">
              <span className="text-xs font-medium text-slate-500 block">
                Volume Financeiro Realizado
              </span>
              <span className="text-2xl md:text-3xl font-bold text-slate-900 font-mono tabular-nums tracking-tight block mt-2">
                {formatBRLCurrency(kpiTotalSpent)}
              </span>
              <span className="text-xs text-slate-400 block mt-1">
                Soma consolidada dos desembolsos
              </span>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-5">
              <span className="text-xs font-medium text-slate-500 block">
                Ticket Médio por Compra
              </span>
              <span className="text-2xl md:text-3xl font-bold text-slate-900 font-mono tabular-nums tracking-tight block mt-2">
                {formatBRLCurrency(kpiAverageSpent)}
              </span>
              <span className="text-xs text-slate-400 block mt-1">
                Valor médio por ordem registrada
              </span>
            </div>
          </div>

          {/* Search & Filters Surface */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-[240px]">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar produto, item ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                  />
                </div>

                <button
                  onClick={() => setShowFilters((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    showFilters || hasActiveFilters
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Filtros</span>
                </button>

                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      setFilterFornecedor("");
                      setFilterCentroCusto("All");
                      setFilterDestino("");
                      setFilterRequisitor("");
                      setSearchTerm("");
                      setFilterCategory("All");
                      setFilterStartDate("");
                      setFilterEndDate("");
                      setFilterValue("");
                    }}
                    className="text-xs font-medium text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Limpar filtros</span>
                  </button>
                )}
              </div>

              {/* Bulk Selection Delete Bar */}
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-medium">
                    <span className="font-mono tabular-nums font-semibold text-slate-900">
                      {selectedIds.length}
                    </span>{" "}
                    selecionado(s)
                  </span>
                  {confirmBulkDelete ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          if (onDeleteLists) {
                            onDeleteLists(selectedIds);
                          } else {
                            selectedIds.forEach((id) => onDeleteList(id));
                          }
                          setSelectedIds([]);
                          setConfirmBulkDelete(false);
                        }}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap"
                      >
                        Confirmar exclusão
                      </button>
                      <button
                        onClick={() => setConfirmBulkDelete(false)}
                        className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmBulkDelete(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir selecionados</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 pt-3 border-t border-slate-100">
                <div>
                  <label className="text-[11px] font-medium text-slate-500 mb-1 block">
                    Valor (R$)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: >500 ou 150,00"
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono tabular-nums placeholder:font-sans placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-500 mb-1 block">
                    Fornecedor
                  </label>
                  <input
                    type="text"
                    placeholder="Todos"
                    value={filterFornecedor}
                    onChange={(e) => setFilterFornecedor(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-500 mb-1 block">
                    Conta Contábil
                  </label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-600 transition-colors cursor-pointer"
                  >
                    <option value="All">Todas as contas</option>
                    {categories.map((cat) => {
                      const combined = `${cat.description} - ${cat.code}`;
                      return (
                        <option key={cat.id} value={combined}>
                          {cat.code} · {cat.description}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-500 mb-1 block">
                    Centro de Custo
                  </label>
                  <select
                    value={filterCentroCusto}
                    onChange={(e) => setFilterCentroCusto(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-indigo-600 transition-colors cursor-pointer"
                  >
                    <option value="All">Todos</option>
                    {uniqueCentros.map((cc) => (
                      <option key={cc} value={cc}>
                        {cc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-500 mb-1 block">
                    Solicitante / Destino
                  </label>
                  <input
                    type="text"
                    placeholder="Filtrar solicitante..."
                    value={filterRequisitor}
                    onChange={(e) => setFilterRequisitor(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-500 mb-1 block">
                    Data inicial
                  </label>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono tabular-nums focus:outline-hidden focus:border-indigo-600 transition-colors cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-500 mb-1 block">
                    Data final
                  </label>
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono tabular-nums focus:outline-hidden focus:border-indigo-600 transition-colors cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* High-Density Data Grid */}
          {(() => {
            const totalPages = Math.ceil(filteredLists.length / pageSize) || 1;
            const startIndex = (currentPage - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const paginatedLists = filteredLists.slice(startIndex, endIndex);

            return (
              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 border-b border-slate-200/80">
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Planilha de Lançamentos
                    </h2>
                    <span className="text-slate-300" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-xs text-slate-500 font-mono tabular-nums">
                      {filteredLists.length}{" "}
                      {filteredLists.length === 1 ? "registro" : "registros"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-slate-500">Exibir</span>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="bg-white border border-slate-200 text-slate-700 text-xs font-medium px-2.5 py-1.5 rounded-lg cursor-pointer focus:outline-hidden focus:border-indigo-600"
                    >
                      <option value={10}>10 linhas</option>
                      <option value={15}>15 linhas</option>
                      <option value={30}>30 linhas</option>
                      <option value={50}>50 linhas</option>
                      <option value={100}>100 linhas</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1380px]">
                    <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 border-b border-slate-200/80">
                      <tr>
                        <th className="px-3 py-2.5 text-center w-10">
                          <input
                            type="checkbox"
                            checked={
                              paginatedLists.length > 0 &&
                              paginatedLists.every((list) =>
                                selectedIds.includes(list.id)
                              )
                            }
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedIds((prev) => {
                                  const next = [...prev];
                                  paginatedLists.forEach((list) => {
                                    if (!next.includes(list.id))
                                      next.push(list.id);
                                  });
                                  return next;
                                });
                              } else {
                                const visibleIds = paginatedLists.map(
                                  (list) => list.id
                                );
                                setSelectedIds((prev) =>
                                  prev.filter((id) => !visibleIds.includes(id))
                                );
                              }
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </th>
                        <th className="px-3 py-2.5 whitespace-nowrap">Data</th>
                        <th className="px-3 py-2.5 whitespace-nowrap">
                          Fornecedor
                        </th>
                        <th className="px-3 py-2.5 whitespace-nowrap">
                          Produto / Descrição
                        </th>
                        <th className="px-3 py-2.5 whitespace-nowrap">
                          Status
                        </th>
                        <th className="px-3 py-2.5 whitespace-nowrap text-right">
                          Valor Realizado
                        </th>
                        <th className="px-3 py-2.5 whitespace-nowrap text-center">
                          Parc.
                        </th>
                        <th className="px-3 py-2.5 whitespace-nowrap">
                          Conta Contábil
                        </th>
                        <th className="px-3 py-2.5 whitespace-nowrap">
                          Solicitante
                        </th>
                        <th className="px-3 py-2.5 whitespace-nowrap">
                          C. Custo
                        </th>
                        <th className="px-3 py-2.5 whitespace-nowrap">
                          Cartão
                        </th>
                        <th className="px-3 py-2.5 whitespace-nowrap">
                          Destino / Entrega
                        </th>
                        <th className="px-3 py-2.5 whitespace-nowrap text-right pr-5">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-xs text-slate-700 divide-y divide-slate-100">
                      {paginatedLists.map((list) => {
                        const itemsSummary = list.items
                          .map((item) => `${item.name} (${item.quantity}x)`)
                          .join(", ");

                        const isEditing = editingId === list.id;
                        const productDisplay =
                          list.descricao || itemsSummary || "Sem descrição";
                        const catParsed = formatCategoryDisplay(list.category);

                        return (
                          <tr
                            key={list.id}
                            className={`${
                              isEditing
                                ? "bg-indigo-50/40"
                                : "hover:bg-slate-50/80"
                            } transition-colors cursor-pointer h-11`}
                            onClick={() => {
                              if (!isEditing) {
                                onSelectList(list);
                              }
                            }}
                          >
                            <td
                              className="px-3 py-2 text-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(list.id)}
                                onChange={() => {
                                  setSelectedIds((prev) =>
                                    prev.includes(list.id)
                                      ? prev.filter((id) => id !== list.id)
                                      : [...prev, list.id]
                                  );
                                }}
                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                            </td>

                            <td className="px-3 py-2 font-mono tabular-nums whitespace-nowrap text-slate-500">
                              {isEditing ? (
                                <input
                                  type="date"
                                  value={editDate}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => setEditDate(e.target.value)}
                                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 font-mono tabular-nums w-32 focus:outline-hidden focus:border-indigo-600"
                                />
                              ) : list.dataLancamento ? (
                                formatDate(list.dataLancamento)
                              ) : (
                                list.date
                              )}
                            </td>

                            <td className="px-3 py-2 font-semibold text-slate-900 whitespace-nowrap max-w-[180px] truncate">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editFornecedor}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) =>
                                    setEditFornecedor(e.target.value)
                                  }
                                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 font-semibold w-40 focus:outline-hidden focus:border-indigo-600"
                                />
                              ) : (
                                list.fornecedor || list.name
                              )}
                            </td>

                            <td
                              className="px-3 py-2 max-w-[240px] truncate text-slate-600"
                              title={productDisplay}
                            >
                              {productDisplay}
                            </td>

                            <td className="px-3 py-2 whitespace-nowrap">
                              {list.status === "CONCLUÍDO" ? (
                                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>Concluído</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-amber-700 font-medium">
                                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  <span>Pendente</span>
                                </span>
                              )}
                            </td>

                            <td className="px-3 py-2 font-mono tabular-nums font-semibold text-slate-900 text-right whitespace-nowrap">
                              {isEditing ? (
                                <div
                                  className="flex items-center justify-end gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span className="text-[10px] text-slate-400">
                                    R$
                                  </span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={editSpent}
                                    onChange={(e) =>
                                      setEditSpent(Number(e.target.value))
                                    }
                                    className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 font-mono tabular-nums w-24 text-right font-semibold focus:outline-hidden focus:border-indigo-600"
                                  />
                                </div>
                              ) : (
                                `R$ ${list.spent.toLocaleString("pt-BR", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}`
                              )}
                            </td>

                            <td className="px-3 py-2 text-center font-mono tabular-nums text-slate-500">
                              {isEditing ? (
                                <input
                                  type="number"
                                  min="1"
                                  max="48"
                                  value={editParcelas}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) =>
                                    setEditParcelas(Number(e.target.value))
                                  }
                                  className="bg-white border border-slate-300 rounded px-1.5 py-1 text-xs text-slate-900 font-mono tabular-nums w-14 text-center focus:outline-hidden focus:border-indigo-600"
                                />
                              ) : list.parcelas && list.parcelas > 1 ? (
                                `${list.parcelas}x`
                              ) : (
                                "1x"
                              )}
                            </td>

                            <td className="px-3 py-2 whitespace-nowrap max-w-[230px] truncate">
                              {isEditing ? (
                                <select
                                  value={editCategory}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) =>
                                    setEditCategory(e.target.value)
                                  }
                                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 max-w-[210px] focus:outline-hidden focus:border-indigo-600"
                                >
                                  <option value="">Sem classificação</option>
                                  {categories.map((cat) => {
                                    const combined = `${cat.description} - ${cat.code}`;
                                    return (
                                      <option key={cat.id} value={combined}>
                                        {cat.code} · {cat.description}
                                      </option>
                                    );
                                  })}
                                </select>
                              ) : list.category ? (
                                <span
                                  className="text-slate-600"
                                  title={list.category}
                                >
                                  {catParsed.code && (
                                    <span className="font-mono tabular-nums text-slate-400 mr-1.5">
                                      {catParsed.code}
                                    </span>
                                  )}
                                  <span>{catParsed.desc}</span>
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>

                            <td className="px-3 py-2 text-slate-700 whitespace-nowrap">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editSolicitante}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) =>
                                    setEditSolicitante(e.target.value)
                                  }
                                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 w-24 focus:outline-hidden focus:border-indigo-600"
                                />
                              ) : (
                                list.solicitante || "User"
                              )}
                            </td>

                            <td className="px-3 py-2 font-mono tabular-nums text-slate-500 whitespace-nowrap">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editCentroCusto}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) =>
                                    setEditCentroCusto(e.target.value)
                                  }
                                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 font-mono tabular-nums w-24 focus:outline-hidden focus:border-indigo-600"
                                />
                              ) : (
                                list.centroCusto || "CC-TI-42"
                              )}
                            </td>

                            <td className="px-3 py-2 whitespace-nowrap font-mono tabular-nums text-slate-500">
                              {isEditing ? (
                                <input
                                  type="text"
                                  maxLength={4}
                                  value={editFinalCartao}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) =>
                                    setEditFinalCartao(e.target.value)
                                  }
                                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 font-mono tabular-nums w-16 focus:outline-hidden focus:border-indigo-600"
                                />
                              ) : (
                                `Final ${list.finalCartao || "9876"}`
                              )}
                            </td>

                            <td
                              className="px-3 py-2 text-slate-600 max-w-[180px] truncate whitespace-nowrap"
                              title={`${list.destino || "Almoxarifado"} · ${formatDate(list.entrega)}`}
                            >
                              {isEditing ? (
                                <div
                                  className="flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <input
                                    type="text"
                                    value={editDestino}
                                    onChange={(e) =>
                                      setEditDestino(e.target.value)
                                    }
                                    className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 w-24 focus:outline-hidden focus:border-indigo-600"
                                  />
                                  <input
                                    type="date"
                                    value={editEntrega}
                                    onChange={(e) =>
                                      setEditEntrega(e.target.value)
                                    }
                                    className="bg-white border border-slate-300 rounded px-1.5 py-1 text-xs text-slate-900 font-mono tabular-nums w-28 focus:outline-hidden focus:border-indigo-600"
                                  />
                                </div>
                              ) : (
                                <span>
                                  {list.destino || "Almoxarifado"}
                                  {list.entrega && (
                                    <span className="text-slate-400 font-mono tabular-nums">
                                      {" "}
                                      · {formatDate(list.entrega)}
                                    </span>
                                  )}
                                </span>
                              )}
                            </td>

                            <td
                              className="px-3 py-2 text-right pr-5 whitespace-nowrap"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {isEditing ? (
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    onClick={() => saveRowEditing(list)}
                                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
                                  >
                                    Salvar
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="px-2.5 py-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded text-xs font-medium transition-colors cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              ) : confirmRowDeleteId === list.id ? (
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      onDeleteList(list.id);
                                      setConfirmRowDeleteId(null);
                                    }}
                                    className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-semibold cursor-pointer"
                                  >
                                    Excluir
                                  </button>
                                  <button
                                    onClick={() => setConfirmRowDeleteId(null)}
                                    className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    onClick={() => startEditing(list)}
                                    className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-md hover:bg-indigo-50 transition-colors cursor-pointer"
                                    title="Editar linha"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      setConfirmRowDeleteId(list.id)
                                    }
                                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Excluir lançamento"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}

                      {filteredLists.length === 0 && (
                        <tr>
                          <td colSpan={13} className="py-16 px-6 text-center">
                            <div className="max-w-sm mx-auto space-y-3">
                              <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto" />
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  Nenhum lançamento encontrado
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                  {hasActiveFilters
                                    ? "Ajuste ou limpe os filtros aplicados para visualizar os registros."
                                    : "Cadastre sua primeira solicitação de compra ou importe uma planilha Excel."}
                                </p>
                              </div>
                              {!hasActiveFilters && (
                                <button
                                  onClick={onOpenNewListModal}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Registrar Primeira Compra</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Bar */}
                <div className="bg-slate-50/50 border-t border-slate-200/80 px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-500">
                    Mostrando{" "}
                    <span className="text-slate-900 font-mono tabular-nums font-semibold">
                      {filteredLists.length > 0 ? startIndex + 1 : 0}
                    </span>{" "}
                    a{" "}
                    <span className="text-slate-900 font-mono tabular-nums font-semibold">
                      {Math.min(endIndex, filteredLists.length)}
                    </span>{" "}
                    de{" "}
                    <span className="text-slate-900 font-mono tabular-nums font-semibold">
                      {filteredLists.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Anterior</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          let pageNum = currentPage;
                          if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          if (pageNum < 1 || pageNum > totalPages) return null;

                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-8 h-8 rounded-lg text-xs font-mono tabular-nums font-semibold transition-colors cursor-pointer flex items-center justify-center ${
                                currentPage === pageNum
                                  ? "bg-indigo-600 text-white"
                                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        }
                      )}
                    </div>

                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <span>Próxima</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        /* ============================================================== */
        /* 3-COLUMN CENTERED DETAIL WORKBENCH                             */
        /* Left: Lista de Lançamentos                                     */
        /* Center: Resumo Financeiro & Orçamento + Adicionar Item + Itens */
        /* Right: Ficha Cadastral & Metadados Corporativos                */
        /* ============================================================== */
        <div className="space-y-6">
          {/* Contextual Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-3.5 rounded-2xl border border-slate-200/80">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => onSelectList(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold rounded-lg text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Voltar à Planilha</span>
              </button>

              <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
                /
              </span>

              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 min-w-0">
                <span className="font-semibold text-slate-900 truncate">
                  {activeList.fornecedor || activeList.name}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums whitespace-nowrap">
                  {formatDate(activeList.dataLancamento) || activeList.date}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                onClick={() => toggleListStatus(activeList)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                  activeList.status === "CONCLUÍDO"
                    ? "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>
                  {activeList.status === "CONCLUÍDO"
                    ? "Reabrir Lançamento"
                    : "Concluir Lançamento"}
                </span>
              </button>

              {confirmDetailDelete ? (
                <div className="inline-flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      onDeleteList(activeList.id);
                      onSelectList(null);
                    }}
                    className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap"
                  >
                    Confirmar exclusão
                  </button>
                  <button
                    onClick={() => setConfirmDetailDelete(false)}
                    className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDetailDelete(true)}
                  className="p-2 bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors cursor-pointer"
                  title="Excluir este lançamento"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* 3-Column Workbench: Lista (Left 3) | Resumo & Adicionar Item (Center 5) | Ficha (Right 4) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ======================================================== */}
            {/* COLUNA ESQUERDA (3 cols): LISTA DE LANÇAMENTOS           */}
            {/* ======================================================== */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-900">
                  Lista de Lançamentos
                </h3>
                <span className="text-xs font-mono tabular-nums text-slate-400">
                  {detailSidebarLists.length}
                </span>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filtrar fornecedor ou C.C..."
                  value={detailSearchTerm}
                  onChange={(e) => setDetailSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-indigo-600 transition-colors"
                />
                {detailSearchTerm && (
                  <button
                    onClick={() => setDetailSearchTerm("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Segmented Filter */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  onClick={() => setDetailStatusFilter("ALL")}
                  className={`py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    detailStatusFilter === "ALL"
                      ? "bg-white text-slate-900 shadow-2xs font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setDetailStatusFilter("PENDENTE")}
                  className={`py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    detailStatusFilter === "PENDENTE"
                      ? "bg-white text-amber-700 shadow-2xs font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Pendentes
                </button>
                <button
                  onClick={() => setDetailStatusFilter("CONCLUÍDO")}
                  className={`py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    detailStatusFilter === "CONCLUÍDO"
                      ? "bg-white text-emerald-700 shadow-2xs font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Concluídos
                </button>
              </div>

              {/* Scrollable List */}
              <div className="divide-y divide-slate-100 max-h-[540px] overflow-y-auto -mx-2 px-2">
                {detailSidebarLists.map((list) => {
                  const isSelected = list.id === activeList.id;
                  const itemsSummary = list.items
                    .map((it) => it.name)
                    .slice(0, 2)
                    .join(", ");

                  return (
                    <button
                      key={list.id}
                      type="button"
                      onClick={() => onSelectList(list)}
                      className={`w-full py-3 px-3 rounded-xl transition-colors cursor-pointer text-left block ${
                        isSelected
                          ? "bg-indigo-50/80 text-slate-900"
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`text-xs font-semibold truncate ${
                            isSelected ? "text-indigo-950" : "text-slate-900"
                          }`}
                        >
                          {list.fornecedor || list.name}
                        </span>
                        {list.status === "CONCLUÍDO" ? (
                          <CheckCircle2
                            className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5"
                            title="Concluído"
                          />
                        ) : (
                          <Clock
                            className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5"
                            title="Pendente"
                          />
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {list.descricao || itemsSummary || "Sem descrição"}
                      </p>

                      <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400 font-mono tabular-nums">
                        <span>
                          {formatDate(list.dataLancamento || list.date)}
                        </span>
                        <span className="font-semibold text-slate-800">
                          R${" "}
                          {(list.spent || list.budget || 0).toLocaleString(
                            "pt-BR",
                            { minimumFractionDigits: 2 }
                          )}
                        </span>
                      </div>
                    </button>
                  );
                })}

                {detailSidebarLists.length === 0 && (
                  <div className="py-10 text-center text-slate-400 text-xs">
                    Nenhum lançamento encontrado.
                  </div>
                )}
              </div>
            </div>

            {/* ======================================================== */}
            {/* COLUNA CENTRAL (5 cols): RESUMO FINANCEIRO & ADICIONAR   */}
            {/* ITEM À FICHA (Centro do Formulário) + CHECKLIST DE ITENS */}
            {/* ======================================================== */}
            <div className="lg:col-span-5 space-y-5">
              {/* 1. Resumo Financeiro & Orçamento (Centered Focal Block) */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-5">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Resumo Financeiro &amp; Orçamento
                    </h3>
                    <p className="text-xs text-slate-500">
                      Acompanhamento de orçamentos e valores realizados
                    </p>
                  </div>
                </div>

                {/* 3 Architectural Metric Columns (Single-Elevation, Hairline Dividers) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                  <div className="pb-3 sm:pb-0 sm:pr-4">
                    <span className="text-[11px] font-medium text-slate-500 block">
                      Orçamento Estipulado
                    </span>
                    <p className="text-lg font-mono tabular-nums font-bold text-slate-900 mt-1">
                      R${" "}
                      {activeList.budget.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2
                      })}
                    </p>
                  </div>

                  <div className="py-3 sm:py-0 sm:px-4">
                    <span className="text-[11px] font-medium text-slate-500 block">
                      Soma dos Itens
                    </span>
                    <p className="text-lg font-mono tabular-nums font-bold text-slate-900 mt-1">
                      R${" "}
                      {activeListTotalItemsVal.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2
                      })}
                    </p>
                  </div>

                  <div className="pt-3 sm:pt-0 sm:pl-4">
                    <span className="text-[11px] font-semibold text-emerald-700 block">
                      Total Realizado
                    </span>
                    <p className="text-lg font-mono tabular-nums font-bold text-emerald-700 mt-1">
                      R${" "}
                      {activeList.spent.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2
                      })}
                    </p>
                  </div>
                </div>

                {/* Budget Execution Bar */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex justify-between text-xs text-slate-600 font-medium">
                    <span>Execução Financeira</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-900">
                      {activeList.budget > 0
                        ? Math.round(
                            (activeListTotalItemsVal / activeList.budget) * 100
                          )
                        : 0}
                      % do teto
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${Math.min(
                          activeList.budget > 0
                            ? (activeListTotalItemsVal / activeList.budget) *
                                100
                            : 0,
                          100
                        )}%`
                      }}
                      className={`h-full transition-all duration-200 ${
                        activeListTotalItemsVal > activeList.budget &&
                        activeList.budget > 0
                          ? "bg-rose-600"
                          : "bg-emerald-600"
                      }`}
                    />
                  </div>
                </div>

                {activeList.budget > 0 &&
                  activeListTotalItemsVal > activeList.budget && (
                    <div className="px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>
                        Soma dos itens excede o teto previsto em{" "}
                        <strong className="font-mono tabular-nums">
                          R${" "}
                          {(
                            activeListTotalItemsVal - activeList.budget
                          ).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2
                          })}
                        </strong>
                        .
                      </span>
                    </div>
                  )}
              </div>

              {/* 2. Adicionar Item à Ficha (Centered Form Block) */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-5">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <PlusCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Adicionar Item à Ficha
                    </h3>
                    <p className="text-xs text-slate-500">
                      Inclua produtos ou serviços pertencentes a este lançamento
                    </p>
                  </div>
                </div>

                <form onSubmit={handleAddItem} className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Nome do Produto / Descrição
                      </label>
                      <input
                        type="text"
                        required
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="Ex: Cesto de fritura 30 cm, Resma Papel A4..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">
                          Preço Unitário (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={newItemPrice}
                          onChange={(e) => setNewItemPrice(e.target.value)}
                          placeholder="0,00"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors font-mono tabular-nums"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">
                          Quantidade
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={newItemQty}
                          onChange={(e) => setNewItemQty(e.target.value)}
                          placeholder="1"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors font-mono tabular-nums"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs inline-flex items-center justify-center gap-2 cursor-pointer transition-colors whitespace-nowrap"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Adicionar Item ao Lançamento</span>
                  </button>
                </form>
              </div>

              {/* 3. Checklist de Itens Vinculados (Directly Below Add Item Form) */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <ShoppingBag className="w-4 h-4 text-slate-500" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Itens do Lançamento
                    </h3>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-slate-500">
                    {activeListCheckedItemsCount}/{activeList.items.length}{" "}
                    adquiridos
                  </span>
                </div>

                {activeList.items.length > 0 ? (
                  <div className="divide-y divide-slate-100 max-h-[320px] overflow-y-auto">
                    {activeList.items.map((item) => (
                      <div
                        key={item.id}
                        className="py-3 flex items-center justify-between gap-3 group"
                      >
                        <div
                          onClick={() => handleToggleItem(activeList, item.id)}
                          className="flex items-start gap-2.5 cursor-pointer flex-1 select-none min-w-0"
                        >
                          <button
                            type="button"
                            className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                          >
                            {item.checked ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-xs font-semibold truncate ${
                                item.checked
                                  ? "line-through text-slate-400"
                                  : "text-slate-900"
                              }`}
                            >
                              {item.name}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                              {item.quantity}x · R${" "}
                              {item.price.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono tabular-nums text-xs font-semibold text-slate-900">
                            R${" "}
                            {(item.price * item.quantity).toLocaleString(
                              "pt-BR",
                              { minimumFractionDigits: 2 }
                            )}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteItem(activeList, item.id)
                            }
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="Remover item"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-xs font-medium text-slate-600">
                      Nenhum item cadastrado nesta ficha.
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Utilize o formulário acima para registrar os itens
                      adquiridos.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ======================================================== */}
            {/* COLUNA DIREITA (4 cols): FICHA DE LANÇAMENTO             */}
            {/* ======================================================== */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-6 space-y-5">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    {activeList.status === "CONCLUÍDO" ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Concluído
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Pendente
                      </span>
                    )}
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums text-slate-400">
                      ID {activeList.id.substring(0, 8)}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-slate-900 tracking-tight break-words">
                    {activeList.fornecedor || activeList.name}
                  </h2>
                </div>

                {!isEditingFicha && (
                  <button
                    type="button"
                    onClick={() => startEditingFicha(activeList)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0"
                  >
                    <Pencil className="w-3.5 h-3.5 text-slate-500" />
                    <span>Editar</span>
                  </button>
                )}
              </div>

              {isEditingFicha ? (
                <form onSubmit={saveFichaChanges} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Fornecedor
                    </label>
                    <input
                      type="text"
                      required
                      value={fichaFornecedor}
                      onChange={(e) => setFichaFornecedor(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium focus:bg-white focus:outline-hidden focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Conta Contábil
                    </label>
                    <select
                      value={fichaCategory}
                      onChange={(e) => setFichaCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-600"
                    >
                      <option value="">Sem classificação</option>
                      {categories.map((cat) => {
                        const combined = `${cat.description} - ${cat.code}`;
                        return (
                          <option key={cat.id} value={combined}>
                            {cat.code} · {cat.description}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        Orçamento (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={fichaBudget}
                        onChange={(e) => setFichaBudget(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono tabular-nums focus:bg-white focus:outline-hidden focus:border-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        Data Lançamento
                      </label>
                      <input
                        type="date"
                        value={fichaDataLancamento}
                        onChange={(e) => setFichaDataLancamento(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono tabular-nums focus:bg-white focus:outline-hidden focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        Solicitante
                      </label>
                      <input
                        type="text"
                        value={fichaSolicitante}
                        onChange={(e) => setFichaSolicitante(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        Setor
                      </label>
                      <input
                        type="text"
                        value={fichaSetor}
                        onChange={(e) => setFichaSetor(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        C. Custo
                      </label>
                      <input
                        type="text"
                        value={fichaCentroCusto}
                        onChange={(e) => setFichaCentroCusto(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-900 font-mono tabular-nums focus:bg-white focus:outline-hidden focus:border-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        Cartão
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        value={fichaFinalCartao}
                        onChange={(e) =>
                          setFichaFinalCartao(e.target.value.replace(/\D/g, ""))
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-900 font-mono tabular-nums focus:bg-white focus:outline-hidden focus:border-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        Parcelas
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="48"
                        value={fichaParcelas}
                        onChange={(e) =>
                          setFichaParcelas(Number(e.target.value))
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-900 font-mono tabular-nums focus:bg-white focus:outline-hidden focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        Previsão Entrega
                      </label>
                      <input
                        type="date"
                        value={fichaEntrega}
                        onChange={(e) => setFichaEntrega(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono tabular-nums focus:bg-white focus:outline-hidden focus:border-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        Destino
                      </label>
                      <input
                        type="text"
                        value={fichaDestino}
                        onChange={(e) => setFichaDestino(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Observações / Descrição
                    </label>
                    <textarea
                      rows={2}
                      value={fichaDescricao}
                      onChange={(e) => setFichaDescricao(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-600 resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsEditingFicha(false)}
                      className="px-3.5 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold cursor-pointer"
                    >
                      Salvar Ficha
                    </button>
                  </div>
                </form>
              ) : (
                /* Clean Architectural Definition List (Zero Cards-Within-Cards) */
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="font-semibold text-slate-900">
                      Dados Corporativos e Contábeis
                    </span>
                  </div>

                  <dl className="divide-y divide-slate-100 text-xs">
                    <div className="py-2.5 flex justify-between gap-4">
                      <dt className="text-slate-500">Classificação Contábil</dt>
                      <dd className="text-right font-medium text-slate-900">
                        {activeList.category || "Não classificado"}
                      </dd>
                    </div>

                    <div className="py-2.5 flex justify-between gap-4">
                      <dt className="text-slate-500">Data de Lançamento</dt>
                      <dd className="text-right font-mono tabular-nums font-medium text-slate-900">
                        {formatDate(activeList.dataLancamento) ||
                          activeList.date}
                      </dd>
                    </div>

                    <div className="py-2.5 flex justify-between gap-4">
                      <dt className="text-slate-500">Registro do Recibo</dt>
                      <dd className="text-right font-mono tabular-nums text-slate-700">
                        {activeList.date || "—"}
                      </dd>
                    </div>

                    <div className="py-2.5 flex justify-between gap-4">
                      <dt className="text-slate-500">Solicitante</dt>
                      <dd className="text-right font-semibold text-slate-900">
                        {activeList.solicitante || "User"}
                      </dd>
                    </div>

                    <div className="py-2.5 flex justify-between gap-4">
                      <dt className="text-slate-500">Setor / Departamento</dt>
                      <dd className="text-right font-medium text-slate-800">
                        {activeList.setor || "Tecnologia"}
                      </dd>
                    </div>

                    <div className="py-2.5 flex justify-between gap-4">
                      <dt className="text-slate-500">Centro de Custo</dt>
                      <dd className="text-right font-mono tabular-nums font-semibold text-slate-900">
                        {activeList.centroCusto || "CC-TI-42"}
                      </dd>
                    </div>

                    <div className="py-2.5 flex justify-between gap-4">
                      <dt className="text-slate-500">Modalidade / Cartão</dt>
                      <dd className="text-right font-mono tabular-nums text-slate-800">
                        {activeList.finalCartao
                          ? `Final ${activeList.finalCartao}`
                          : "Boleto / Pix"}
                      </dd>
                    </div>

                    <div className="py-2.5 flex justify-between gap-4">
                      <dt className="text-slate-500">Parcelamento</dt>
                      <dd className="text-right font-mono tabular-nums text-slate-800">
                        {activeList.parcelas && activeList.parcelas > 1
                          ? `${activeList.parcelas}x no cartão`
                          : "À vista (1x)"}
                      </dd>
                    </div>

                    <div className="py-2.5 flex justify-between gap-4">
                      <dt className="text-slate-500">Previsão de Entrega</dt>
                      <dd className="text-right font-mono tabular-nums text-slate-800">
                        {formatDate(activeList.entrega)}
                      </dd>
                    </div>

                    <div className="py-2.5 flex justify-between gap-4">
                      <dt className="text-slate-500">Destino Final</dt>
                      <dd className="text-right font-medium text-slate-900">
                        {activeList.destino || "Almoxarifado Central"}
                      </dd>
                    </div>
                  </dl>

                  {activeList.descricao && (
                    <div className="pt-3 border-t border-slate-100 space-y-1.5">
                      <span className="text-[11px] font-medium text-slate-500 block">
                        Descrição da Solicitação
                      </span>
                      <p className="text-xs text-slate-800 leading-relaxed bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-100">
                        {activeList.descricao}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
