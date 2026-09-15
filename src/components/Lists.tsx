import React, { useState, useMemo } from "react";
import { 
  Plus, Search, Filter, ShoppingBag, ChevronRight, X, Trash2, 
  Check, Square, CheckSquare, Sparkles, Wrench, Tv, Gamepad2, 
  Receipt, Utensils, CreditCard, ChevronLeft, PlusCircle, AlertTriangle,
  User, Building, Folder, Calendar, Truck, MapPin, Layers, Hash,
  Pencil, Eye, FileSpreadsheet, Download, Upload, LogOut, ChevronUp, ChevronDown,
  DollarSign, Briefcase, FileText, Store, Clock
} from "lucide-react";
import * as XLSX from "xlsx";
import { ShoppingList, ShoppingItem, CategoryType, AppCategory } from "../types";

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
  onNavigate?: (tab: 'dashboard' | 'lists' | 'categories') => void;
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
  // If it is in YYYY-MM-DD format (like "2026-06-23")
  if (clean.includes("-") && clean.split("-").length === 3) {
    const parts = clean.split("-");
    if (parts[0].length === 4) {
      return clean;
    } else if (parts[2].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }
  // If it is in DD/MM/YYYY format
  if (clean.includes("/") && clean.split("/").length === 3) {
    const parts = clean.split("/");
    if (parts[2].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }
  return clean;
};

export default function Lists({
  shoppingLists,
  onCreateList,
  onUpdateList,
  onDeleteList,
  onDeleteLists,
  onImportLists,
  selectedListId,
  onSelectList,
  onOpenNewListModal,
  categories,
  onNavigate,
  onLogout,
  userProfileName
}: ListsProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("All");
  
  // Custom filters matching the mockup visual structure
  const [filterFornecedor, setFilterFornecedor] = useState("");
  const [filterCentroCusto, setFilterCentroCusto] = useState<string>("All");
  const [filterDestino, setFilterDestino] = useState("");
  const [filterRequisitor, setFilterRequisitor] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, filterFornecedor, filterCentroCusto, filterDestino, filterRequisitor, filterStartDate, filterEndDate, filterValue, pageSize]);

  // Item additions inputs
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemQty, setNewItemQty] = useState("");

  // Detail View: Left Sidebar state (Lista de Lançamentos)
  const [detailSearchTerm, setDetailSearchTerm] = useState("");
  const [detailStatusFilter, setDetailStatusFilter] = useState<'ALL' | 'PENDENTE' | 'CONCLUÍDO'>('ALL');

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

  const startEditing = (list: ShoppingList) => {
    setEditingId(list.id);
    setEditDate(list.dataLancamento || list.date || "");
    setEditFornecedor(list.fornecedor || list.name || "");
    setEditCategory(list.category || "");
    setEditParcelas(list.parcelas || 1);
    setEditSpent(list.spent || 0);
    setEditSolicitante(list.solicitante || "Alex");
    setEditSetor(list.setor || "Tecnologia");
    setEditCentroCusto(list.centroCusto || "CC-TI-42");
    setEditFinalCartao(list.finalCartao || "9876");
    setEditEntrega(list.entrega || "");
    setEditDestino(list.destino || "Almoxarifado");
  };

  const saveRowEditing = (list: ShoppingList) => {
    const updated: ShoppingList = {
      ...list,
      date: editDate || list.date,
      dataLancamento: editDate || list.dataLancamento,
      name: editFornecedor || list.fornecedor || list.name,
      fornecedor: editFornecedor,
      category: editCategory || list.category,
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

  const activeList = shoppingLists.find(list => list.id === selectedListId) || null;

  const detailSidebarLists = useMemo(() => {
    return shoppingLists.filter(list => {
      if (detailStatusFilter !== 'ALL' && list.status !== detailStatusFilter) return false;
      if (detailSearchTerm.trim()) {
        const term = detailSearchTerm.toLowerCase().trim();
        const matchFornecedor = (list.fornecedor || list.name || "").toLowerCase().includes(term);
        const matchDesc = (list.descricao || "").toLowerCase().includes(term);
        const matchCat = (list.category || "").toLowerCase().includes(term);
        const matchSol = (list.solicitante || "").toLowerCase().includes(term);
        const matchCC = (list.centroCusto || "").toLowerCase().includes(term);
        return matchFornecedor || matchDesc || matchCat || matchSol || matchCC;
      }
      return true;
    });
  }, [shoppingLists, detailSearchTerm, detailStatusFilter]);

  const uniqueCentros = useMemo(() => {
    const centros = new Set<string>();
    shoppingLists.forEach(list => {
      if (list.centroCusto) {
        centros.add(list.centroCusto.trim());
      }
    });
    return Array.from(centros).filter(Boolean);
  }, [shoppingLists]);

  // Filtered lists summary
  const filteredLists = useMemo(() => {
    return shoppingLists.filter((list) => {
      // 1. General search bar term (Crash-safe and extremely robust)
      const term = searchTerm.toLowerCase().trim();
      const listName = list.name || "";
      
      const matchesSearch = !term ||
        listName.toLowerCase().includes(term) ||
        (list.descricao || "").toLowerCase().includes(term) ||
        (list.items && list.items.some(item => (item.name || "").toLowerCase().includes(term)));
      
      // 2. Category Select Filter
      const matchesCategory = filterCategory === "All" || list.category === filterCategory;
      
      // 3. Fornecedor Input Filter
      const matchesFornecedor = !filterFornecedor ||
        listName.toLowerCase().includes(filterFornecedor.toLowerCase()) ||
        (list.fornecedor || "").toLowerCase().includes(filterFornecedor.toLowerCase());
        
      // 4. Centro de Custo Select Filter
      const matchesCentroCusto = filterCentroCusto === "All" ||
        (list.centroCusto || "").trim() === filterCentroCusto.trim();
        
      // 5. Destino Input Filter
      const matchesDestino = !filterDestino ||
        (list.destino || "").toLowerCase().includes(filterDestino.toLowerCase());
        
      // 6. Requisitor Input Filter
      const matchesRequisitor = !filterRequisitor ||
        (list.solicitante || "").toLowerCase().includes(filterRequisitor.toLowerCase());

      // 7. Período de Compras (Date range filter)
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

      // 8. Valor Filter (Pesquisa por Valor - ex: 150, 150,00, >500, <100, 100-500)
      let matchesValue = true;
      if (filterValue.trim()) {
        const rawInput = filterValue.trim().toLowerCase().replace("r$", "").trim();
        const spentVal = Number(list.spent) || 0;
        const budgetVal = Number(list.budget) || 0;

        if (rawInput.startsWith(">")) {
          const target = parseFloat(rawInput.replace(">", "").trim().replace(".", "").replace(",", "."));
          if (!isNaN(target)) {
            matchesValue = spentVal >= target || budgetVal >= target;
          }
        } else if (rawInput.startsWith("<")) {
          const target = parseFloat(rawInput.replace("<", "").trim().replace(".", "").replace(",", "."));
          if (!isNaN(target)) {
            matchesValue = spentVal <= target || budgetVal <= target;
          }
        } else if (rawInput.includes("-")) {
          const parts = rawInput.split("-").map(p => parseFloat(p.trim().replace(".", "").replace(",", ".")));
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            const min = Math.min(parts[0], parts[1]);
            const max = Math.max(parts[0], parts[1]);
            matchesValue = (spentVal >= min && spentVal <= max) || (budgetVal >= min && budgetVal <= max);
          }
        } else {
          const numTarget = parseFloat(rawInput.replace(".", "").replace(",", "."));
          const spentBrl = spentVal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          const budgetBrl = budgetVal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          
          const spentStr = spentVal.toString();
          const budgetStr = budgetVal.toString();

          const textMatch = spentBrl.toLowerCase().includes(rawInput) ||
                            budgetBrl.toLowerCase().includes(rawInput) ||
                            spentStr.includes(rawInput) ||
                            budgetStr.includes(rawInput);

          const numMatch = !isNaN(numTarget) && (
            Math.abs(spentVal - numTarget) < 0.01 ||
            Math.abs(budgetVal - numTarget) < 0.01
          );

          matchesValue = textMatch || numMatch;
        }
      }

      return matchesSearch && matchesCategory && matchesFornecedor && matchesCentroCusto && matchesDestino && matchesRequisitor && matchesPeriod && matchesValue;
    });
  }, [shoppingLists, searchTerm, filterCategory, filterFornecedor, filterCentroCusto, filterDestino, filterRequisitor, filterStartDate, filterEndDate, filterValue]);

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

    // Convert shoppingLists to structured worksheet rows
    const dataToExport = filteredLists.map((list) => {
      // Collect items summary
      const itemsStr = list.items
        ? list.items.map(item => `${item.name} (${item.quantity}x - R$ ${item.price.toFixed(2)})`).join(", ")
        : "";
      
      return {
        "ID": list.id,
        "Data": formatExcelDate(list.dataLancamento || list.date),
        "Fornecedor": list.fornecedor || list.name || "",
        "Classificação / Categoria Contábil": list.category || "",
        "Produtos": list.descricao || itemsStr || "",
        "Valor Total (R$)": list.spent,
        "Parcelas": list.parcelas || 1,
        "Solicitante": list.solicitante || "Alex",
        "Setor": list.setor || "Tecnologia",
        "Centro de Custo": list.centroCusto || "CC-TI-42",
        "Final Cartão": list.finalCartao || "9876",
        "Previsão de Entrega": formatExcelDate(list.entrega),
        "Destino": list.destino || "Almoxarifado",
        "Descrição": list.descricao || "",
        "Status": list.status || "PENDENTE"
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Controle de Compras");
    
    // Auto-fit column widths
    const maxProps = ["ID", "Data", "Fornecedor", "Classificação / Categoria Contábil", "Produtos", "Valor Total (R$)", "Parcelas", "Solicitante", "Setor", "Centro de Custo", "Final Cartão", "Previsão de Entrega", "Destino", "Descrição", "Status"];
    const wscols = maxProps.map(prop => ({ wch: Math.max(prop.length + 3, 14) }));
    worksheet['!cols'] = wscols;

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const datePart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const timePart = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    const fullStamp = `${datePart}_${timePart}`;

    XLSX.writeFile(workbook, `Controle_de_Compras_${fullStamp}.xlsx`);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (!json || json.length === 0) {
          alert("O arquivo do Excel parece estar vazio.");
          return;
        }

        // Parse each row into a ShoppingList
        const importedLists: ShoppingList[] = json.map((row: any, index) => {
          const getVal = (keys: string[]) => {
            const cleanStr = (s: string) => 
              s.toLowerCase()
               .normalize("NFD")
               .replace(/[\u0300-\u036f]/g, "")
               .trim()
               .replace(/[\s\-\/_()$]/g, '');

            for (const key of keys) {
              const foundKey = Object.keys(row).find(k => 
                cleanStr(k) === cleanStr(key)
              );
              if (foundKey && row[foundKey] !== undefined) {
                return row[foundKey];
              }
            }
            return undefined;
          };

          // Extract values
          const id = getVal(["id", "identificador", "uuid", "codigo", "num", "sequencial"])?.toString() || `imported-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`;
          
          const dateRaw = getVal(["data", "datalancamento", "date", "lancamento", "datadelancamento", "datacompra", "datadecompra", "criadoem", "competencia", "dia"]);
          let dateVal = "";
          if (dateRaw) {
            if (dateRaw instanceof Date) {
              const y = dateRaw.getFullYear();
              const m = String(dateRaw.getMonth() + 1).padStart(2, '0');
              const d = String(dateRaw.getDate()).padStart(2, '0');
              dateVal = `${y}-${m}-${d}`;
            } else if (typeof dateRaw === "number") {
              const dateObj = XLSX.SSF.parse_date_code(dateRaw);
              dateVal = `${dateObj.y}-${String(dateObj.m).padStart(2, '0')}-${String(dateObj.d).padStart(2, '0')}`;
            } else {
              const str = dateRaw.toString().trim();
              if (str.includes("/")) {
                const parts = str.split("/");
                if (parts.length === 3) {
                  if (parts[2].length === 4) {
                    dateVal = `${parts[2]}-${String(parts[1]).padStart(2, '0')}-${String(parts[0]).padStart(2, '0')}`;
                  } else if (parts[0].length === 4) {
                    dateVal = `${parts[0]}-${String(parts[1]).padStart(2, '0')}-${String(parts[2]).padStart(2, '0')}`;
                  }
                }
              } else if (str.includes("-")) {
                const parts = str.split("-");
                if (parts.length === 3) {
                  if (parts[0].length === 4) {
                    dateVal = str;
                  } else if (parts[2].length === 4) {
                    dateVal = `${parts[2]}-${String(parts[1]).padStart(2, '0')}-${String(parts[0]).padStart(2, '0')}`;
                  }
                }
              } else {
                dateVal = str;
              }
            }
          }
          if (!dateVal) {
            const d = new Date();
            dateVal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          }

          const fornecedor = getVal(["fornecedor", "supplier", "nomefornecedor", "name", "nome", "parceiro", "empresa", "credor"])?.toString() || "Fornecedor Importado";
          
          // Match existing category
          let category = getVal(["categoria", "categoriacontabil", "classificacao", "category", "classificacaocategoriacontabil", "classificacaocategoria", "cat", "grupodespesa", "conta"])?.toString() || "";
          if (category) {
            const lowerCat = category.toLowerCase();
            const matched = categories.find(c => 
              lowerCat.includes(c.code.toLowerCase()) || 
              lowerCat.includes(c.description.toLowerCase())
            );
            if (matched) {
              category = `${matched.description} - ${matched.code}`;
            }
          } else {
            // Keep empty as requested if it was blank in the spreadsheet
            category = "";
          }

          const itemsRaw = getVal(["itens", "items", "itensadquiridos", "produtos", "produto", "produtosadquiridos", "descricaodositens", "detalhes"])?.toString() || "";
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
                id: `item-${Date.now()}-${pIdx}-${Math.random().toString(36).substr(2, 5)}`,
                name: nameOnly || "Item",
                price: price,
                quantity: qty,
                checked: true
              });
            });
          }

          // Robust Number parsing for Spent Value
          const rawSpent = getVal(["valortotal", "spent", "valor", "total", "valortotalr$", "valortotal(r$)", "valor(r$)", "preco", "precomaximo", "valordascompras"]);
          let spentVal = 0;
          if (rawSpent !== undefined && rawSpent !== null) {
            if (typeof rawSpent === "number") {
              spentVal = rawSpent;
            } else {
              let str = rawSpent.toString().trim();
              str = str.replace(/[R$\s]/g, "");
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

          // Robust Number parsing for Parcelas
          const rawParcelas = getVal(["parcelas", "installments", "nparcelas", "nroparcelas", "numeroofparcelas", "vezes", "quantidade_parcelas", "qtdparcelas", "prazo"]);
          let parcelasVal = 1;
          if (rawParcelas !== undefined && rawParcelas !== null) {
            if (typeof rawParcelas === "number") {
              parcelasVal = Math.round(rawParcelas);
            } else {
              const str = rawParcelas.toString().replace(/\D/g, "");
              parcelasVal = parseInt(str, 10) || 1;
            }
          }

          const solicitante = getVal(["solicitante", "requester", "solicitadopor", "solicitado", "requisitor", "requisitante", "colaborador", "criador", "responsavel", "quem", "comprador", "autor"])?.toString() || userProfileName || "User";
          const setor = getVal(["setor", "sector", "department", "departamento", "area", "divisao", "centroderesponsabilidade", "setor_solicitante"])?.toString() || "Tecnologia";
          const centroCusto = getVal([
            "centro", "centrodecusto", "centrocusto", "costcenter", "cc", "centro_de_custo", 
            "codigo_cc", "codigocc", "setor_cc", "centro_custo", "centrocustos",
            "nomedocentrodecusto", "nomecentrocusto", "ccusto", "cdecusto", 
            "centrodecustos", "codigodocentrodecusto", "codigocentrodecusto", 
            "setorcc", "ccnome", "ccdescricao", "descricaodocentrodecusto", 
            "custocentro", "cc_nome", "cc_descricao", "nome_centro_de_custo",
            "nome_cc", "cc_desc", "cc_codigo", "codigocentro_de_custo", "centrocusto_codigo"
          ])?.toString()?.trim() || "CC-TI-42";
          const finalCartao = getVal(["finalcartao", "card", "cartao", "finaldocartao", "numerodocartao", "numerocartao", "numdocartao", "n_cartao", "final", "cartaofinal", "final_cartao"])?.toString() || "9876";
          
          const entregaRaw = getVal(["previsaoentrega", "entrega", "delivery", "previsaodeentrega", "dataentrega", "prazodeentrega", "recebimento", "previsao", "data_entrega"]);
          let entregaVal = "";
          if (entregaRaw) {
            if (entregaRaw instanceof Date) {
              const y = entregaRaw.getFullYear();
              const m = String(entregaRaw.getMonth() + 1).padStart(2, '0');
              const d = String(entregaRaw.getDate()).padStart(2, '0');
              entregaVal = `${y}-${m}-${d}`;
            } else if (typeof entregaRaw === "number") {
              const dateObj = XLSX.SSF.parse_date_code(entregaRaw);
              entregaVal = `${dateObj.y}-${String(dateObj.m).padStart(2, '0')}-${String(dateObj.d).padStart(2, '0')}`;
            } else {
              const str = entregaRaw.toString().trim();
              if (str.includes("/")) {
                const parts = str.split("/");
                if (parts.length === 3) {
                  if (parts[2].length === 4) {
                    entregaVal = `${parts[2]}-${String(parts[1]).padStart(2, '0')}-${String(parts[0]).padStart(2, '0')}`;
                  } else if (parts[0].length === 4) {
                    entregaVal = `${parts[0]}-${String(parts[1]).padStart(2, '0')}-${String(parts[2]).padStart(2, '0')}`;
                  }
                }
              } else if (str.includes("-")) {
                const parts = str.split("-");
                if (parts.length === 3) {
                  if (parts[0].length === 4) {
                    entregaVal = str;
                  } else if (parts[2].length === 4) {
                    entregaVal = `${parts[2]}-${String(parts[1]).padStart(2, '0')}-${String(parts[0]).padStart(2, '0')}`;
                  }
                }
              } else {
                entregaVal = str;
              }
            }
          }

          const destino = getVal(["destino", "destination", "local", "localentrega", "destinatario", "enviara", "enviar_para"])?.toString() || "Almoxarifado";
          const descricao = getVal(["descricao", "description", "produtos", "produto", "obs", "observacao", "detalhes", "motivo", "observacoes"])?.toString() || "";
          const statusVal = getVal(["status", "situacao", "estado", "aprovado", "fase", "pago", "etapa"])?.toString()?.toUpperCase() === "PENDENTE" ? "PENDENTE" : "CONCLUÍDO";

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
        }
      } catch (err) {
        console.error(err);
        alert("Ocorreu um erro ao ler o arquivo de Excel. Certifique-se de que está no formato correto.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const handleToggleItem = (list: ShoppingList, itemId: string) => {
    const updatedItems = list.items.map((item) => {
      if (item.id === itemId) {
        return { ...item, checked: !item.checked };
      }
      return item;
    });

    // Automatically compute spent as the sum of checked items!
    // If none checked, spent is 0, or let list spent run as total of checked items
    const checkedSum = updatedItems
      .filter((it) => it.checked)
      .reduce((sum, it) => sum + (it.price * it.quantity), 0);

    const updatedList: ShoppingList = {
      ...list,
      items: updatedItems,
      spent: checkedSum > 0 ? checkedSum : 0 // spent matches checked sum for live tracking, or falls back safely
    };

    onUpdateList(updatedList);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeList || !newItemName.trim()) return;

    const price = parseFloat(newItemPrice) || 0;
    const qty = parseInt(newItemQty) || 1;

    const newItem: ShoppingItem = {
      id: `item-${Date.now()}`,
      name: newItemName.trim(),
      price: price,
      quantity: qty,
      checked: false
    };

    const updatedItems = [...activeList.items, newItem];
    
    // Recalculate spent budget based on checked items
    const checkedSum = updatedItems
      .filter((it) => it.checked)
      .reduce((sum, it) => sum + (it.price * it.quantity), 0);

    const updatedList: ShoppingList = {
      ...activeList,
      items: updatedItems,
      // If list is marked completed, spent becomes the full items sum, otherwise sum of checked
      spent: activeList.status === 'CONCLUÍDO' 
        ? updatedItems.reduce((sum, it) => sum + (it.price * it.quantity), 0)
        : (checkedSum > 0 ? checkedSum : activeList.spent)
    };

    onUpdateList(updatedList);

    // Reset inputs
    setNewItemName("");
    setNewItemPrice("");
    setNewItemQty("");
  };

  const handleDeleteItem = (list: ShoppingList, itemId: string) => {
    const updatedItems = list.items.filter((item) => item.id !== itemId);
    
    const checkedSum = updatedItems
      .filter((it) => it.checked)
      .reduce((sum, it) => sum + (it.price * it.quantity), 0);

    const updatedList: ShoppingList = {
      ...list,
      items: updatedItems,
      spent: list.status === 'CONCLUÍDO' 
        ? updatedItems.reduce((sum, it) => sum + (it.price * it.quantity), 0)
        : checkedSum
    };

    onUpdateList(updatedList);
  };

  const toggleListStatus = (list: ShoppingList) => {
    // When changing to completed, all items are checked and full price gets logged
    const isNowCompleted = list.status === 'PENDENTE';
    
    const updatedItems = list.items.map(item => ({
      ...item,
      checked: isNowCompleted ? true : item.checked
    }));

    // Calculate full sum
    const totalSum = updatedItems.reduce((sum, it) => sum + (it.price * it.quantity), 0);

    const updatedList: ShoppingList = {
      ...list,
      status: isNowCompleted ? 'CONCLUÍDO' : 'PENDENTE',
      items: updatedItems,
      spent: isNowCompleted ? totalSum : 0
    };

    onUpdateList(updatedList);
  };

  // Icon mapping helpers
  const renderCategoryIcon = (category: string) => {
    const code = category ? category.substring(0, 5) : "";
    if (code.startsWith('14')) return <ShoppingBag className="w-4 h-4 text-emerald-600" />; // CMV
    if (code.startsWith('15')) return <User className="w-4 h-4 text-indigo-600" />;       // EPI
    if (code.startsWith('16')) return <Sparkles className="w-4 h-4 text-violet-600" />;   // Operacional/Limpeza
    if (code.startsWith('17')) return <Hash className="w-4 h-4 text-blue-600" />;         // Administrativo/TI
    if (code.startsWith('18')) return <Layers className="w-4 h-4 text-rose-600" />;       // Decoraçao
    if (code.startsWith('19')) return <Wrench className="w-4 h-4 text-amber-600" />;       // Manutenções
    if (code.startsWith('21')) return <Truck className="w-4 h-4 text-sky-600" />;         // Ativos
    if (code.startsWith('25')) return <Folder className="w-4 h-4 text-purple-600" />;      // Socios
    return <CreditCard className="w-4 h-4 text-slate-600" />;
  };

  const renderCategoryBg = (category: string) => {
    const code = category ? category.substring(0, 5) : "";
    if (code.startsWith('14')) return 'bg-emerald-50 text-emerald-800 border border-emerald-200/60';
    if (code.startsWith('15')) return 'bg-indigo-50 text-indigo-800 border border-indigo-200/60';
    if (code.startsWith('16')) return 'bg-violet-50 text-violet-800 border border-violet-200/60';
    if (code.startsWith('17')) return 'bg-blue-50 text-blue-800 border border-blue-200/60';
    if (code.startsWith('18')) return 'bg-rose-50 text-rose-800 border border-rose-200/60';
    if (code.startsWith('19')) return 'bg-amber-50 text-amber-800 border border-amber-200/60';
    if (code.startsWith('21')) return 'bg-sky-50 text-sky-800 border border-sky-200/60';
    if (code.startsWith('25')) return 'bg-purple-50 text-purple-800 border border-purple-200/60';
    return 'bg-slate-50 text-slate-800 border border-slate-200';
  };

  const renderCategoryDotBg = (category: string) => {
    const code = category ? category.substring(0, 5) : "";
    if (code.startsWith('14')) return 'bg-emerald-500';
    if (code.startsWith('15')) return 'bg-indigo-500';
    if (code.startsWith('16')) return 'bg-violet-500';
    if (code.startsWith('17')) return 'bg-blue-500';
    if (code.startsWith('18')) return 'bg-rose-500';
    if (code.startsWith('19')) return 'bg-amber-500';
    if (code.startsWith('21')) return 'bg-sky-500';
    if (code.startsWith('25')) return 'bg-purple-500';
    return 'bg-slate-400';
  };

  // Compute stats of active visual shopping list
  const activeListTotalItemsVal = activeList
    ? activeList.items.reduce((sum, it) => sum + (it.price * it.quantity), 0)
    : 0;

  const activeListCheckedItemsCount = activeList
    ? activeList.items.filter(it => it.checked).length
    : 0;

  // Stats computed from filtered lists for the dashboard KPIs matching the mockup
  const kpiTotalPurchases = filteredLists.length;
  const kpiTotalSpent = filteredLists.reduce((sum, list) => sum + (list.spent || 0), 0);
  const kpiAverageSpent = kpiTotalPurchases > 0 ? kpiTotalSpent / kpiTotalPurchases : 0;

  const formatBRLCurrency = (val: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(val);
  };

  return (
    <div className="animate-in fade-in duration-300">
      
      {!activeList ? (
        /* LISTS DIRECTORY VIEW */
        <div className="space-y-6">
          
          {/* Mockup Header: Title, Subtitle and Sair button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-serif" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                Controle de Compras
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Gerencie e acompanhe todas as compras corporativas
              </p>
            </div>
            <div>
              <button
                onClick={() => {
                  if (window.confirm("Deseja realmente sair da plataforma?")) {
                    if (onLogout) {
                      onLogout();
                    } else if (onNavigate) {
                      onNavigate("dashboard");
                    }
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-white hover:bg-rose-50 text-rose-500 hover:text-rose-600 border border-rose-200 hover:border-rose-300 rounded-lg text-xs font-bold transition-all duration-100 active:scale-95 shadow-2xs cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair</span>
              </button>
            </div>
          </div>

          {/* KPI Statistics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div 
              className="bg-white border border-slate-100 rounded-2xl p-6 shadow-2xs"
              style={{ width: "218.8px", height: "101.588px" }}
            >
              <span className="text-xs text-slate-500 font-medium tracking-tight block mb-2">Total de Compras</span>
              <span className="text-3xl font-black text-slate-950 font-sans tracking-tight">
                {kpiTotalPurchases}
              </span>
            </div>
            
            <div 
              className="bg-white border border-slate-100 rounded-2xl p-6 shadow-2xs"
              style={{ height: "100.588px" }}
            >
              <span className="text-xs text-slate-500 font-medium tracking-tight block mb-2">Valor Total</span>
              <span className="text-3xl font-black text-slate-950 font-sans tracking-tight">
                {formatBRLCurrency(kpiTotalSpent)}
              </span>
            </div>

            <div 
              className="bg-white border border-slate-100 rounded-2xl p-6 shadow-2xs"
              style={{ height: "100.588px" }}
            >
              <span className="text-xs text-slate-500 font-medium tracking-tight block mb-2">Média por Compra</span>
              <span className="text-3xl font-black text-slate-950 font-sans tracking-tight">
                {formatBRLCurrency(kpiAverageSpent)}
              </span>
            </div>
          </div>

          {/* Painel de Lançamentos */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-6">
            {/* Button Actions Toolbar */}
            <div className="flex flex-wrap items-center gap-2.5 w-full">
              <button
                onClick={onOpenNewListModal}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs shadow-xs hover:shadow-sm cursor-pointer transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Compra</span>
              </button>
              
              <label className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs cursor-pointer transition-all active:scale-95">
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
                className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs cursor-pointer transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Exportar Excel</span>
              </button>

              <button
                onClick={() => {
                  if (onNavigate) {
                    onNavigate("dashboard");
                  } else {
                    alert("KPIs e Análises disponíveis no Painel Geral.");
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs cursor-pointer transition-all active:scale-95"
              >
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>KPIs & Análises</span>
              </button>

              {selectedIds.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm(`Deseja realmente excluir em massa os ${selectedIds.length} lançamentos selecionados?`)) {
                      if (onDeleteLists) {
                        onDeleteLists(selectedIds);
                      } else {
                        selectedIds.forEach(id => onDeleteList(id));
                      }
                      setSelectedIds([]);
                    }
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white border border-rose-600 rounded-lg text-xs font-bold shadow-xs hover:shadow-sm cursor-pointer transition-all active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5 text-white" />
                  <span>Excluir em Massa ({selectedIds.length})</span>
                </button>
              )}
            </div>

            {/* Filtros Container */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Filtros Avançados</span>
                {(filterFornecedor || filterCentroCusto !== "All" || filterDestino || filterRequisitor || searchTerm || filterCategory !== "All" || filterStartDate || filterEndDate || filterValue) && (
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
                    className="text-[11px] font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                    <span>Limpar Filtros</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* 1. Busca de Produtos */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block flex items-center gap-1">
                    <Search className="w-3 h-3 text-slate-400" />
                    Buscar Produto
                  </label>
                  <input
                    type="text"
                    placeholder="Pesquisar produto ou item..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* 2. Pesquisa por Valor */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-emerald-600" />
                    Pesquisar por Valor (R$)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 150,00 ou >500"
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* 3. Fornecedor */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Fornecedor</label>
                  <input
                    type="text"
                    placeholder="Filtrar por fornecedor"
                    value={filterFornecedor}
                    onChange={(e) => setFilterFornecedor(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* 3. Classificação Contábil */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Classificação Contábil</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500 transition-colors cursor-pointer"
                  >
                    <option value="All">Todas as Categorias</option>
                    {categories.map((cat) => {
                      const combined = `${cat.description} - ${cat.code}`;
                      return (
                        <option key={cat.id} value={combined}>
                          {combined}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* 4. Centro de Custo */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Centro de Custo</label>
                  <select
                    value={filterCentroCusto}
                    onChange={(e) => setFilterCentroCusto(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500 transition-colors cursor-pointer"
                  >
                    <option value="All">Todos os Centros</option>
                    {uniqueCentros.map((cc) => (
                      <option key={cc} value={cc}>
                        {cc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. Solicitante */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Solicitante</label>
                  <input
                    type="text"
                    placeholder="Filtrar por solicitante"
                    value={filterRequisitor}
                    onChange={(e) => setFilterRequisitor(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* 6. Destino */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Destino</label>
                  <input
                    type="text"
                    placeholder="Filtrar por destino"
                    value={filterDestino}
                    onChange={(e) => setFilterDestino(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* 7. Período: Início */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">DATA INICIAL</label>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500 transition-colors cursor-pointer"
                  />
                </div>

                {/* 8. Período: Até */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">DATA FINAL</label>
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500 transition-colors cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Painel de Listagem de Compras */}
          {(() => {
            const totalPages = Math.ceil(filteredLists.length / pageSize) || 1;
            const startIndex = (currentPage - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const paginatedLists = filteredLists.slice(startIndex, endIndex);

            return (
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden mt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Listagem de Compras</h2>
                      <p className="text-xs text-slate-500">Planilha detalhada de todos os lançamentos corporativos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {selectedIds.length > 0 && (
                      <span className="bg-rose-50 text-rose-700 text-xs font-bold px-3 py-1.5 rounded-full">
                        {selectedIds.length} selecionado(s)
                      </span>
                    )}
                    <span className="bg-emerald-100/70 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <span>{filteredLists.length}</span>
                      <span className="font-normal text-[10px] text-emerald-700">registros</span>
                    </span>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="bg-white border border-slate-200 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-lg cursor-pointer focus:outline-hidden"
                    >
                      <option value={10}>10 por página</option>
                      <option value={20}>20 por página</option>
                      <option value={50}>50 por página</option>
                      <option value={100}>100 por página</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1550px]">
                    <thead className="bg-slate-50/70 text-[10px] uppercase font-bold tracking-wider text-slate-500 border-b border-slate-100">
                      <tr>
                        <th className="px-2.5 py-2 text-center w-10">
                          <input
                            type="checkbox"
                            checked={paginatedLists.length > 0 && paginatedLists.every(list => selectedIds.includes(list.id))}
                            onChange={(e) => {
                              const visibleLists = paginatedLists;
                          if (e.target.checked) {
                            setSelectedIds(prev => {
                              const newSelection = [...prev];
                              visibleLists.forEach(list => {
                                if (!newSelection.includes(list.id)) {
                                  newSelection.push(list.id);
                                }
                              });
                              return newSelection;
                            });
                          } else {
                            const visibleIds = visibleLists.map(list => list.id);
                            setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </th>
                    <th className="px-2.5 py-2 whitespace-nowrap text-left">Data</th>
                    <th className="px-2.5 py-2 whitespace-nowrap text-left" style={{ height: "38px", width: "163.975px" }}>Produto</th>
                    <th className="px-2.5 py-2 whitespace-nowrap text-left">Valor</th>
                    <th className="px-2.5 py-2 whitespace-nowrap text-center" style={{ width: "60px" }}>Parc.</th>
                    <th className="px-2.5 py-2 whitespace-nowrap text-left">Fornecedor</th>
                    <th className="px-2.5 py-2 whitespace-nowrap text-left">Classificação / Categoria Contábil</th>
                    <th className="px-2.5 py-2 whitespace-nowrap text-left">Solicitante</th>
                    <th className="px-2.5 py-2 whitespace-nowrap text-left">Centro</th>
                    <th className="px-2.5 py-2 whitespace-nowrap text-left">Final Cartão</th>
                    <th className="px-2.5 py-2 whitespace-nowrap text-left">Destino</th>
                    <th className="px-2.5 py-2 whitespace-nowrap text-left">Entrega</th>
                    <th className="px-2.5 py-2 whitespace-nowrap text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-slate-700 divide-y divide-slate-100/70">
                  {paginatedLists.map((list) => {
                    const itemsSummary = list.items
                      .map(item => `${item.name} (${item.quantity}x)`)
                      .join(", ");
                    
                    const isEditing = editingId === list.id;
                    const productDisplay = list.descricao || itemsSummary || "Sem descrição";
                    
                    return (
                      <tr 
                        key={list.id} 
                        className={`${isEditing ? "bg-indigo-50/40" : "hover:bg-slate-50/40"} transition-colors cursor-pointer group`}
                        onClick={() => {
                          if (!isEditing) {
                            onSelectList(list);
                          }
                        }}
                      >
                        {/* Checkbox Cell */}
                        <td className="px-2.5 py-1.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(list.id)}
                            onChange={() => {
                              setSelectedIds(prev => 
                                prev.includes(list.id) 
                                  ? prev.filter(id => id !== list.id) 
                                  : [...prev, list.id]
                              );
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>

                        {/* Data Column */}
                        <td className="px-2.5 py-1.5 font-mono whitespace-nowrap text-slate-500">
                          {isEditing ? (
                            <input 
                              type="date" 
                              value={editDate} 
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => setEditDate(e.target.value)} 
                              className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs text-slate-800 font-mono w-28 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                            />
                          ) : (
                            list.dataLancamento ? formatDate(list.dataLancamento) : list.date
                          )}
                        </td>

                        {/* Produto Column */}
                        <td className="px-2.5 py-1.5 max-w-[280px] truncate font-medium text-slate-900" title={productDisplay}>
                          {productDisplay}
                        </td>

                        {/* Valor Total Column */}
                        <td className="px-2.5 py-1.5 font-sans font-bold text-slate-950 whitespace-nowrap">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                              <span className="text-[10px] text-slate-400">R$</span>
                              <input 
                                type="number" 
                                step="0.01" 
                                min="0"
                                value={editSpent} 
                                onChange={(e) => setEditSpent(Number(e.target.value))} 
                                className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs text-slate-800 font-mono w-24 text-right font-bold focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                          ) : (
                            `R$ ${list.spent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                          )}
                        </td>

                        {/* Parcelas Column */}
                        <td className="px-2.5 py-1.5 text-center font-mono text-slate-600">
                          {isEditing ? (
                            <input 
                              type="number" 
                              min="1" 
                              max="48"
                              value={editParcelas} 
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => setEditParcelas(Number(e.target.value))} 
                              className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs text-slate-800 font-mono w-14 text-center focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                            />
                          ) : (
                            list.parcelas && list.parcelas > 1 ? `${list.parcelas}x` : "1x"
                          )}
                        </td>

                        {/* Fornecedor Column */}
                        <td className="px-2.5 py-1.5 font-semibold text-slate-800 whitespace-nowrap">
                          {isEditing ? (
                            <input 
                              type="text" 
                              value={editFornecedor} 
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => setEditFornecedor(e.target.value)} 
                              className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs text-slate-800 font-semibold w-40 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                            />
                          ) : (
                            list.fornecedor || list.name
                          )}
                        </td>

                        {/* Classificação / Categoria Contábil Column */}
                        <td className="px-2.5 py-1.5 whitespace-nowrap">
                          {isEditing ? (
                            <select
                              value={editCategory}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => setEditCategory(e.target.value)}
                              className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs text-slate-800 font-medium max-w-[220px] focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value="">Sem classificação / em branco</option>
                              {categories.map((cat) => {
                                const combined = `${cat.description} - ${cat.code}`;
                                return (
                                  <option key={cat.id} value={combined}>
                                    {combined}
                                  </option>
                                );
                              })}
                            </select>
                          ) : (
                            list.category ? (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold ${renderCategoryBg(list.category)} hover:opacity-90 transition-opacity`} title={list.category}>
                                🏷️ {list.category}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal italic text-xs">-</span>
                            )
                          )}
                        </td>

                        {/* Solicitante Column */}
                        <td className="px-2.5 py-1.5 font-medium text-slate-700 whitespace-nowrap">
                          {isEditing ? (
                            <input 
                              type="text" 
                              value={editSolicitante} 
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => setEditSolicitante(e.target.value)} 
                              className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs text-slate-800 w-24 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                            />
                          ) : (
                            list.solicitante || "Alex"
                          )}
                        </td>

                        {/* Centro de Custo Column */}
                        <td className="px-2.5 py-1.5 font-mono text-slate-500 whitespace-nowrap">
                          {isEditing ? (
                            <input 
                              type="text" 
                              value={editCentroCusto} 
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => setEditCentroCusto(e.target.value)} 
                              className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs text-slate-800 font-mono w-24 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                            />
                          ) : (
                            list.centroCusto || "CC-TI-42"
                          )}
                        </td>

                        {/* Final Cartão Column */}
                        <td className="px-2.5 py-1.5 whitespace-nowrap font-mono text-slate-600">
                          {isEditing ? (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <span className="text-[10px] text-slate-400">💳 ...</span>
                              <input 
                                type="text" 
                                maxLength={4}
                                value={editFinalCartao} 
                                onChange={(e) => setEditFinalCartao(e.target.value)} 
                                className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs text-slate-800 font-mono w-14 text-center focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                          ) : (
                            `💳 ...${list.finalCartao || "9876"}`
                          )}
                        </td>

                        {/* Destino Column */}
                        <td className="px-2.5 py-1.5 text-slate-600 max-w-[150px] truncate whitespace-nowrap" title={list.destino || "Almoxarifado"}>
                          {isEditing ? (
                            <input 
                              type="text" 
                              value={editDestino} 
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => setEditDestino(e.target.value)} 
                              className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs text-slate-800 w-28 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                            />
                          ) : (
                            list.destino || "Almoxarifado"
                          )}
                        </td>

                        {/* Previsão Entrega Column */}
                        <td className="px-2.5 py-1.5 whitespace-nowrap text-slate-500">
                          {isEditing ? (
                            <input 
                              type="date" 
                              value={editEntrega} 
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => setEditEntrega(e.target.value)} 
                              className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs text-slate-800 font-mono w-28 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                            />
                          ) : (
                            list.entrega ? formatDate(list.entrega) : "-"
                          )}
                        </td>

                        {/* Ações Column */}
                        <td className="px-2.5 py-1.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          {isEditing ? (
                            <div className="flex items-center gap-1.5 justify-center">
                              <button 
                                onClick={() => saveRowEditing(list)}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold shadow-sm transition-colors cursor-pointer"
                                title="Salvar alterações"
                              >
                                Salvar
                              </button>
                              <button 
                                onClick={() => setEditingId(null)}
                                className="px-2.5 py-1 bg-slate-500 hover:bg-slate-600 text-white rounded text-[10px] font-bold shadow-sm transition-colors cursor-pointer"
                                title="Cancelar edições"
                              >
                                Voltar
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <button 
                                onClick={() => startEditing(list)}
                                className="text-indigo-600 hover:text-indigo-800 p-1 rounded hover:bg-indigo-50 transition-colors inline-flex items-center justify-center"
                                title="Editar"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => {
                                  if (window.confirm(`Deseja realmente excluir o lançamento "${list.fornecedor || list.name}"?`)) {
                                    onDeleteList(list.id);
                                  }
                                }}
                                className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition-colors inline-flex items-center justify-center"
                                title="Excluir"
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
                      <td colSpan={11} className="p-12 text-center bg-slate-50/20">
                        <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-3 animate-pulse" />
                        <p className="font-sans text-xs text-slate-400 font-medium">Nenhum lançamento localizado com os filtros ativos.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Controles de Paginação */}
            <div className="bg-slate-50/50 border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs font-semibold text-slate-500">
                Mostrando <span className="text-slate-800 font-bold">{filteredLists.length > 0 ? startIndex + 1 : 0}</span> até{" "}
                <span className="text-slate-800 font-bold">
                  {Math.min(endIndex, filteredLists.length)}
                </span>{" "}
                de <span className="text-slate-800 font-bold">{filteredLists.length}</span> lançamentos
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Anterior</span>
                </button>

                <div className="flex items-center gap-1.5">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                          currentPage === pageNum
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed transition-all cursor-pointer"
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
        /* SHOPPING LIST DETAIL SPLIT VIEW (Lista à Esquerda, Ficha à Direita) */
        <div className="space-y-5 animate-in fade-in duration-300">
          
          {/* Top Bar: Navegação e Ações Rápidas */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onSelectList(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer active:scale-95 shadow-2xs"
                title="Voltar para a Planilha Completa"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Voltar para Planilha</span>
              </button>
              <div className="h-4 w-px bg-slate-200 hidden sm:block" />
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
                <span>Visualização:</span>
                <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">Lista à Esquerda & Ficha à Direita</span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => toggleListStatus(activeList)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-2xs ${
                  activeList.status === 'CONCLUÍDO'
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{activeList.status === 'CONCLUÍDO' ? "Reabrir Lançamento" : "Concluir Lançamento"}</span>
              </button>

              <button
                onClick={() => {
                  if (confirm(`Tem certeza que deseja apagar permanentemente o lançamento "${activeList.fornecedor || activeList.name}"?`)) {
                    onDeleteList(activeList.id);
                    onSelectList(null);
                  }
                }}
                className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl transition-all cursor-pointer active:scale-95 shadow-2xs"
                title="Apagar este lançamento"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Grid Principal: Lista de Lançamentos à Esquerda (4 cols) e Ficha à Direita (8 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ======================================================== */}
            {/* COLUNA ESQUERDA: LISTA DE LANÇAMENTOS E ITENS (lg:col-span-5 xl:col-span-4) */}
            {/* ======================================================== */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-5">
              
              {/* Painel: Lista de Lançamentos (Navegação Rápida) */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Lista de Lançamentos
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {detailSidebarLists.length} registro{detailSidebarLists.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Busca Rápida na Lista Lateral */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filtrar fornecedor, setor..."
                    value={detailSearchTerm}
                    onChange={(e) => setDetailSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500 transition-colors"
                  />
                  {detailSearchTerm && (
                    <button
                      onClick={() => setDetailSearchTerm("")}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filtros rápidos de Status */}
                <div className="flex items-center gap-1.5 text-[10px] font-bold">
                  <button
                    onClick={() => setDetailStatusFilter('ALL')}
                    className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                      detailStatusFilter === 'ALL'
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setDetailStatusFilter('PENDENTE')}
                    className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                      detailStatusFilter === 'PENDENTE'
                        ? "bg-amber-600 text-white"
                        : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                    }`}
                  >
                    Pendentes
                  </button>
                  <button
                    onClick={() => setDetailStatusFilter('CONCLUÍDO')}
                    className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                      detailStatusFilter === 'CONCLUÍDO'
                        ? "bg-emerald-600 text-white"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    Concluídos
                  </button>
                </div>

                {/* Lista Scrollável de Lançamentos */}
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {detailSidebarLists.map((list) => {
                    const isSelected = list.id === activeList.id;
                    const itemsSummary = list.items
                      .map(it => it.name)
                      .slice(0, 2)
                      .join(", ");

                    return (
                      <div
                        key={list.id}
                        onClick={() => onSelectList(list)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                          isSelected
                            ? "bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-200 shadow-xs"
                            : "bg-slate-50/40 hover:bg-slate-100/70 border-slate-200/80 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${renderCategoryDotBg(list.category)}`} />
                              <h4 className={`text-xs font-bold truncate ${isSelected ? "text-indigo-950" : "text-slate-800"}`}>
                                {list.fornecedor || list.name}
                              </h4>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                              {list.descricao || itemsSummary || "Sem descrição"}
                            </p>
                          </div>

                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 ${
                            list.status === 'CONCLUÍDO'
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {list.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                          <span className="font-mono">{formatDate(list.dataLancamento || list.date)}</span>
                          <span className="font-mono font-bold text-slate-800">
                            R$ {(list.spent || list.budget || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {detailSidebarLists.length === 0 && (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      Nenhum lançamento encontrado com este filtro.
                    </div>
                  )}
                </div>
              </div>

              {/* Painel: Itens do Lançamento Selecionado */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Itens do Lançamento ({activeList.items.length})
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                    {activeListCheckedItemsCount} de {activeList.items.length} ({
                      activeList.items.length > 0 
                        ? Math.round((activeListCheckedItemsCount / activeList.items.length) * 100) 
                        : 0
                    }%)
                  </span>
                </div>

                {/* Lista de Itens com Checkbox */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {activeList.items.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                        item.checked
                          ? "bg-slate-50/70 border-slate-200 text-slate-500 opacity-80"
                          : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
                      }`}
                    >
                      <div
                        onClick={() => handleToggleItem(activeList, item.id)}
                        className="flex items-center gap-2.5 cursor-pointer flex-1 select-none min-w-0 mr-2"
                      >
                        <button className="text-slate-400 hover:text-indigo-600 transition-colors focus:outline-hidden">
                          {item.checked ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-semibold leading-tight truncate ${item.checked ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                            {item.name}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Qtd: <span className="font-bold text-slate-700">{item.quantity}u</span> • Un: R$ {item.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-xs font-bold text-slate-800">
                          R$ {(item.price * item.quantity).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                        
                        <button
                          onClick={() => handleDeleteItem(activeList, item.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remover item"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {activeList.items.length === 0 && (
                    <div className="py-6 px-4 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                      <Sparkles className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700">Nenhum item adicionado</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Utilize o formulário da Ficha à direita para incluir produtos.
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* ======================================================== */}
            {/* COLUNA DIREITA: FICHA DE LANÇAMENTO (lg:col-span-7 xl:col-span-8) */}
            {/* ======================================================== */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-5">
              
              {/* Card 1: Cabeçalho Principal da Ficha */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Ficha Cadastral
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        activeList.status === 'CONCLUÍDO'
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {activeList.status}
                      </span>
                    </div>

                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-serif" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                      {activeList.fornecedor || activeList.name}
                    </h2>
                  </div>

                  <div className="flex flex-col sm:items-end">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Orçamento Estimado</span>
                    <span className="text-xl font-mono font-bold text-indigo-600">
                      R$ {activeList.budget.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="pt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className={`w-2.5 h-2.5 rounded-full ${renderCategoryDotBg(activeList.category)}`} />
                    <span className="font-semibold text-slate-800">{activeList.category}</span>
                  </div>
                  <span className="text-slate-300">•</span>
                  <div className="flex items-center gap-1 text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Lançamento: <strong className="text-slate-700 font-mono">{formatDate(activeList.dataLancamento) || activeList.date}</strong></span>
                  </div>
                </div>
              </div>

              {/* Card 2: Dados Corporativos e Fiscais da Ficha */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Ficha de Lançamento
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Metadados e informações contábeis corporativas
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-50 border border-slate-100 px-2 py-1 rounded-md">
                    ID: {activeList.id.substring(0, 8)}
                  </span>
                </div>

                {/* Grid de Campos Detalhados */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* 1. Fornecedor */}
                  <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                      <Store className="w-3 h-3 text-slate-400" />
                      Fornecedor
                    </span>
                    <p className="text-xs font-bold text-slate-800 break-words">
                      {activeList.fornecedor || activeList.name}
                    </p>
                  </div>

                  {/* 2. Data Recibo */}
                  <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                      <Receipt className="w-3 h-3 text-slate-400" />
                      Data Recibo
                    </span>
                    <p className="text-xs font-semibold text-slate-800 font-mono">
                      {activeList.date || "-"}
                    </p>
                  </div>

                  {/* 3. Data Lançamento */}
                  <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Data Lançamento
                    </span>
                    <p className="text-xs font-semibold text-slate-800 font-mono">
                      {formatDate(activeList.dataLancamento) || activeList.date}
                    </p>
                  </div>

                  {/* 4. Solicitante */}
                  <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      Solicitante
                    </span>
                    <p className="text-xs font-bold text-slate-800">
                      {activeList.solicitante || "Alex"}
                    </p>
                  </div>

                  {/* 5. Setor */}
                  <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-slate-400" />
                      Setor
                    </span>
                    <p className="text-xs font-semibold text-slate-800">
                      {activeList.setor || "Tecnologia"}
                    </p>
                  </div>

                  {/* 6. Centro de Custo */}
                  <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                      <Folder className="w-3 h-3 text-slate-400" />
                      Centro de Custo
                    </span>
                    <p className="text-xs font-bold text-slate-800 font-mono">
                      {activeList.centroCusto || "CC-TI-42"}
                    </p>
                  </div>

                  {/* 7. Modalidade / Final Cartão */}
                  <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-slate-400" />
                      Modalidade / Cartão
                    </span>
                    <p className="text-xs font-semibold text-slate-800">
                      {activeList.finalCartao ? `💳 Final ${activeList.finalCartao}` : "Boleto / Pix"}
                    </p>
                  </div>

                  {/* 8. Parcelas */}
                  <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                      <Layers className="w-3 h-3 text-slate-400" />
                      Parcelas
                    </span>
                    <p className="text-xs font-semibold text-slate-800">
                      {activeList.parcelas && activeList.parcelas > 1 ? `${activeList.parcelas}x no cartão` : "À vista (1x)"}
                    </p>
                  </div>

                  {/* 9. Previsão de Entrega */}
                  <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                      <Truck className="w-3 h-3 text-slate-400" />
                      Entrega
                    </span>
                    <p className="text-xs font-semibold text-slate-800 font-mono">
                      {formatDate(activeList.entrega)}
                    </p>
                  </div>

                  {/* 10. Destino Final */}
                  <div className="col-span-1 sm:col-span-2 md:col-span-3 p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      Destino Final
                    </span>
                    <p className="text-xs font-semibold text-slate-800">
                      {activeList.destino || "Almoxarifado Central"}
                    </p>
                  </div>
                </div>

                {/* Descrição do(s) Produto(s) */}
                {activeList.descricao && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
                      Descrição do(s) Produto(s)
                    </span>
                    <div className="bg-emerald-50/80 text-emerald-950 p-3 rounded-xl border border-emerald-200/60 flex items-start gap-2.5 leading-relaxed text-xs">
                      <Sparkles className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />
                      <span className="font-medium">{activeList.descricao}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Card 3: Resumo Financeiro & Orçamento */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Resumo Financeiro & Orçamento
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Acompanhamento de orçamentos e valores realizados
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Orçamento Estipulado
                    </span>
                    <p className="text-base font-mono font-bold text-slate-800 mt-1">
                      R$ {activeList.budget.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Soma dos Itens
                    </span>
                    <p className="text-base font-mono font-bold text-slate-800 mt-1">
                      R$ {activeListTotalItemsVal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                      Total Realizado (Adquirido)
                    </span>
                    <p className="text-base font-mono font-bold text-emerald-800 mt-1">
                      R$ {activeList.spent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* Barra de Progresso do Orçamento */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-[11px] text-slate-500 font-semibold">
                    <span>Execução Financeira</span>
                    <span className="font-mono font-bold text-slate-700">
                      {activeList.budget > 0 ? Math.round((activeListTotalItemsVal / activeList.budget) * 100) : 0}% do teto
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${Math.min(activeList.budget > 0 ? (activeListTotalItemsVal / activeList.budget) * 100 : 0, 100)}%` }}
                      className={`h-full transition-all duration-300 ${
                        activeListTotalItemsVal > activeList.budget ? "bg-rose-500" : "bg-emerald-500"
                      }`}
                    />
                  </div>
                </div>

                {activeListTotalItemsVal > activeList.budget && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Atenção: A soma estimada dos itens ultrapassou o orçamento previsto em <strong>R$ {(activeListTotalItemsVal - activeList.budget).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>.</span>
                  </div>
                )}
              </div>

              {/* Card 4: Adicionar Item ao Lançamento */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <PlusCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Adicionar Item à Ficha
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Inclua produtos ou serviços pertencentes a este lançamento
                    </p>
                  </div>
                </div>

                <form onSubmit={handleAddItem} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-6">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nome do Produto / Descrição
                      </label>
                      <input
                        type="text"
                        required
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="Ex: Cesto de fritura 30 cm, Resma Papel A4..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500 transition-colors"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Preço Unitário (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(e.target.value)}
                        placeholder="0,00"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500 transition-colors font-mono"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Quantidade
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newItemQty}
                        onChange={(e) => setNewItemQty(e.target.value)}
                        placeholder="1"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500 transition-colors font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs active:scale-98"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Adicionar Item ao Lançamento</span>
                  </button>
                </form>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
