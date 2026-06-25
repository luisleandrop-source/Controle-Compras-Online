import React, { useState, useMemo } from "react";
import { 
  Plus, Search, Filter, ShoppingBag, ChevronRight, X, Trash2, 
  Check, Square, CheckSquare, Sparkles, Wrench, Tv, Gamepad2, 
  Receipt, Utensils, CreditCard, ChevronLeft, PlusCircle, AlertTriangle,
  User, Building, Folder, Calendar, Truck, MapPin, Layers, Hash,
  Pencil, Eye, FileSpreadsheet, Download, Upload, LogOut
} from "lucide-react";
import * as XLSX from "xlsx";
import { ShoppingList, ShoppingItem, CategoryType, AppCategory } from "../types";

interface ListsProps {
  shoppingLists: ShoppingList[];
  onCreateList: (name: string, budget: number, category: CategoryType) => void;
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
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, filterFornecedor, filterCentroCusto, filterDestino, filterRequisitor, filterStartDate, filterEndDate, pageSize]);

  // Item additions inputs
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemQty, setNewItemQty] = useState("");

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

      return matchesSearch && matchesCategory && matchesFornecedor && matchesCentroCusto && matchesDestino && matchesRequisitor && matchesPeriod;
    });
  }, [shoppingLists, searchTerm, filterCategory, filterFornecedor, filterCentroCusto, filterDestino, filterRequisitor, filterStartDate, filterEndDate]);

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

    XLSX.writeFile(workbook, "Controle_de_Compras.xlsx");
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
          }
          if (!category) {
            category = categories[0] ? `${categories[0].description} - ${categories[0].code}` : "Custos Diversos de Baixo Valor - Operacional - 16008";
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

          {/* Button Actions Toolbar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
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

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-white border border-slate-200 text-slate-700 text-xs font-medium px-3 py-2 rounded-lg cursor-pointer focus:outline-hidden"
              >
                <option value={10}>10 por página</option>
                <option value={20}>20 por página</option>
                <option value={50}>50 por página</option>
                <option value={100}>100 por página</option>
              </select>
            </div>
          </div>

          {/* Filtros Container */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Filtros Avançados</span>
              {(filterFornecedor || filterCentroCusto !== "All" || filterDestino || filterRequisitor || searchTerm || filterCategory !== "All" || filterStartDate || filterEndDate) && (
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
                  }}
                  className="text-[11px] font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>Limpar Filtros</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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

              {/* 2. Fornecedor */}
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

          {/* Main Table Container */}
          {(() => {
            const totalPages = Math.ceil(filteredLists.length / pageSize) || 1;
            const startIndex = (currentPage - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const paginatedLists = filteredLists.slice(startIndex, endIndex);

            return (
              <div className="bg-white border border-slate-100 rounded-2xl shadow-2xs overflow-hidden">
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
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold ${renderCategoryBg(list.category)} hover:opacity-90 transition-opacity`} title={list.category}>
                              🏷️ {list.category}
                            </span>
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
        /* SHOPPING LIST DETAIL DRILL VIEW */
        <div className="space-y-lg animate-in slide-in-from-right-10 duration-200">
          
          {/* Detailed list Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-md border-b border-surface-container pb-lg">
            <div className="flex items-start gap-md">
              <button
                onClick={() => onSelectList(null)}
                className="p-2 border border-outline-variant rounded-xl hover:bg-surface-container-lowest transition-colors text-on-surface active:scale-95 duration-100"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-xs">
                  <h3 className="font-headline font-extrabold text-lg text-on-surface leading-tight">
                    {activeList.name}
                  </h3>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    activeList.status === 'CONCLUÍDO'
                      ? "bg-brand-secondary-container text-brand-on-secondary-container"
                      : "bg-surface-container-high text-on-surface-variant"
                  }`}>
                    {activeList.status}
                  </span>
                </div>
                
                <p className="font-sans text-[11px] text-on-surface-variant mt-1 font-semibold flex items-center gap-xs">
                  <span className={`inline-block w-2.5 h-2.5 rounded-full ${renderCategoryDotBg(activeList.category)}`}></span>
                  {activeList.category} • Orçamento Estimado: R$ {activeList.budget.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-sm self-end md:self-auto">
              <button
                onClick={() => toggleListStatus(activeList)}
                className={`py-2 px-md rounded-xl text-xs font-bold flex items-center gap-xs cursor-pointer active:scale-95 duration-100 transition-colors ${
                  activeList.status === 'CONCLUÍDO'
                    ? "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                    : "bg-brand-secondary text-brand-on-secondary-container hover:bg-brand-secondary/85"
                }`}
              >
                <Check className="w-4 h-4" />
                <span>{activeList.status === 'CONCLUÍDO' ? "Reabrir Lista" : "Concluir Compra"}</span>
              </button>

              <button
                onClick={() => {
                  if (confirm("Tem certeza que deseja apagar essa lista permanentemente?")) {
                    onDeleteList(activeList.id);
                  }
                }}
                className="p-2.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-xl transition-colors active:scale-95"
                title="Apagar Lista"
              >
                <Trash2 className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
            
            {/* Left side column: Items list */}
            <div className="lg:col-span-2 space-y-md">
              <div className="flex items-center justify-between">
                <h4 className="font-headline font-bold text-xs text-on-surface uppercase tracking-wider">
                  Itens da Lista ({activeList.items.length})
                </h4>
                <span className="font-sans text-[11px] text-on-surface-variant font-medium">
                  Adquiridos: {activeListCheckedItemsCount} de {activeList.items.length} ({
                    activeList.items.length > 0 
                      ? Math.round((activeListCheckedItemsCount / activeList.items.length) * 100) 
                      : 0
                  }%)
                </span>
              </div>

              {/* Items Card List */}
              <div className="space-y-sm">
                {activeList.items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-md rounded-2xl border transition-all ${
                      item.checked
                        ? "bg-surface-container-low/50 border-surface-container-high/80 opacity-70"
                        : "bg-surface-container-lowest border-surface-container-low hover:border-outline-variant shadow-xs"
                    }`}
                  >
                    <div 
                      onClick={() => handleToggleItem(activeList, item.id)}
                      className="flex items-center gap-md cursor-pointer flex-1 select-none mr-2"
                    >
                      <button className="text-on-surface-variant focus:outline-hidden">
                        {item.checked ? (
                          <CheckSquare className="w-5 h-5 text-brand-on-secondary-container" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>

                      <div className="max-w-xs truncate">
                        <p className={`font-sans text-xs font-semibold leading-tight ${item.checked ? 'line-through text-on-surface-variant/70' : 'text-on-surface'}`}>
                          {item.name}
                        </p>
                        <p className="font-sans text-[10px] text-on-surface-variant mt-0.5">
                          Quant: <span className="font-bold">{item.quantity}u</span> • Unitário: R$ {item.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-md">
                      <span className="font-mono text-xs font-bold text-on-surface">
                        R$ {(item.price * item.quantity).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                      
                      <button
                        onClick={() => handleDeleteItem(activeList, item.id)}
                        className="p-1 text-on-surface-variant hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Apagar item"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {activeList.items.length === 0 && (
                  <div className="p-xl text-center border-2 border-dashed border-outline-variant rounded-2xl bg-surface-container-low">
                    <Sparkles className="w-8 h-8 text-on-surface-variant/40 mx-auto mb-sm animate-bounce" />
                    <h5 className="font-headline font-bold text-xs text-on-surface">Esta lista está vazia</h5>
                    <p className="font-sans text-xs text-on-surface-variant mt-1.5">
                      Utilize o formulário ao lado para cadastrar os produtos que você precisa comprar.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right side column: Information, Budget summary and Add item panel */}
            <div className="space-y-lg">
              
              {/* Corporate Metadata Card */}
              <div className="bg-white p-lg rounded-2xl border border-slate-200 shadow-xs space-y-md font-sans text-xs">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Building className="w-5 h-5 text-brand-primary" />
                  <h4 className="font-headline font-bold text-xs text-slate-900 uppercase tracking-wider">
                    Ficha de Lançamento
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-slate-600">
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block font-bold">Fornecedor</span>
                    <span className="font-semibold text-slate-800 break-words block">{activeList.fornecedor || activeList.name}</span>
                  </div>
                  
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block font-bold">Data Recibo</span>
                    <span className="font-semibold text-slate-800 block">{activeList.date}</span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block font-bold">Solicitante</span>
                    <div className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-800 block">{activeList.solicitante || "Alex"}</span>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block font-bold">Setor</span>
                    <span className="font-semibold text-slate-800 block">{activeList.setor || "Tecnologia"}</span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block font-bold">Centro de Custo</span>
                    <div className="flex items-center gap-1">
                      <Folder className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-800 block font-mono">{activeList.centroCusto || "CC-TI-42"}</span>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block font-bold">Modalidade</span>
                    <div className="flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-800 block">💳 ...{activeList.finalCartao || "9876"}</span>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block font-bold">Parcelas</span>
                    <span className="font-semibold text-slate-800 block font-medium">
                      {activeList.parcelas && activeList.parcelas > 1 ? `${activeList.parcelas}x no cartão` : "À vista (1x)"}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block font-bold">Entrega</span>
                    <div className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-800 block">{formatDate(activeList.entrega)}</span>
                    </div>
                  </div>

                  {activeList.dataLancamento && (
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block font-bold">Data Lançamento</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-800 block">{formatDate(activeList.dataLancamento)}</span>
                      </div>
                    </div>
                  )}

                  <div className="col-span-2 space-y-0.5 border-t border-slate-100 pt-2 mt-1">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block font-bold">Destino Final</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-800 block">{activeList.destino || "Almoxarifado Central"}</span>
                    </div>
                  </div>

                  {activeList.descricao && (
                    <div className="col-span-2 space-y-1 border-t border-slate-100 pt-2 mt-1">
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Descrição do(s) Produto(s)</span>
                      <div className="bg-emerald-50/70 text-emerald-900 p-2.5 rounded-lg border border-emerald-100/60 flex items-start gap-1.5 leading-relaxed font-semibold text-[10.5px]">
                        <Sparkles className="w-3.5 h-3.5 mt-0.5 text-emerald-600 shrink-0" />
                        <span>{activeList.descricao}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Budget feedback */}
              <div className="bg-surface-container-lowest p-lg rounded-2xl border border-surface-container shadow-xs space-y-md font-sans text-xs">
                <h4 className="font-headline font-bold text-xs text-on-surface uppercase tracking-wider">
                  Resumo de Valores
                </h4>

                <div className="space-y-sm text-on-surface-variant">
                  <div className="flex justify-between">
                    <span>Orçamento Estipulado:</span>
                    <span className="font-mono font-bold text-on-surface">R$ {activeList.budget.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Soma de Todos os Itens:</span>
                    <span className="font-mono font-bold text-on-surface">R$ {activeListTotalItemsVal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Realizado (Adquirido):</span>
                    <span className="font-mono font-extrabold text-brand-on-secondary-container">R$ {activeList.spent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Progress bar inside detail card */}
                <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mt-md">
                  <div 
                    style={{ width: `${activeList.budget > 0 ? (activeListTotalItemsVal / activeList.budget) * 100 : 0}%` }}
                    className={`h-full ${activeListTotalItemsVal > activeList.budget ? "bg-red-500" : "bg-brand-secondary"}`}
                  ></div>
                </div>

                {activeListTotalItemsVal > activeList.budget && (
                  <div className="p-sm rounded-xl bg-red-50 border border-red-100 text-red-900 text-[11px] flex gap-sm leading-relaxed">
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                    <span>Atenção! A soma estimada dos itens ultrapassou o orçamento estipulado em R$ {(activeListTotalItemsVal - activeList.budget).toFixed(2)}. Considere rever quantidades.</span>
                  </div>
                )}
              </div>

              {/* Add item to list form */}
              <div className="bg-surface-container-lowest p-lg rounded-2xl border border-surface-container shadow-xs space-y-md">
                <h4 className="font-headline font-bold text-xs text-on-surface uppercase tracking-wider">
                  Adicionar Item
                </h4>

                <form onSubmit={handleAddItem} className="space-y-sm font-sans text-xs">
                  <div>
                    <label className="block text-on-surface-variant font-semibold mb-1">Nome do Produto</label>
                    <input
                      type="text"
                      required
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder="Ex: Arroz Tipo 1, Tomate..."
                      className="w-full bg-surface-container border-none rounded-xl px-sm py-2.5 text-on-surface focus:ring-1 focus:ring-brand-secondary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-sm">
                    <div>
                      <label className="block text-on-surface-variant font-semibold mb-1">Preço Un. (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(e.target.value)}
                        placeholder="Ex: 5.99"
                        className="w-full bg-surface-container border-none rounded-xl px-sm py-2.5 text-on-surface focus:ring-1 focus:ring-brand-secondary"
                      />
                    </div>
                    <div>
                      <label className="block text-on-surface-variant font-semibold mb-1">Quantidade</label>
                      <input
                        type="number"
                        min="1"
                        value={newItemQty}
                        onChange={(e) => setNewItemQty(e.target.value)}
                        placeholder="Ex: 2"
                        className="w-full bg-surface-container border-none rounded-xl px-sm py-2.5 text-on-surface focus:ring-1 focus:ring-brand-secondary"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-md py-2 px-md bg-brand-primary hover:bg-black/85 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-xs cursor-pointer transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Adicionar Item</span>
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
