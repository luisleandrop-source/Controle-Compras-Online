import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, ShoppingCart, PlusCircle, 
  Sparkles, Bell, X, User, ShieldCheck, CreditCard,
  Building, Folder, Truck, MapPin, DollarSign, ChevronRight, Layers, Filter, Calendar
} from "lucide-react";
import { ShoppingList, ShoppingItem, CategoryType, AppCategory, INITIAL_APP_CATEGORIES } from "./types";
import Dashboard from "./components/Dashboard";
import Lists from "./components/Lists";
import Categories from "./components/Categories";
import ScanReceiptModal from "./components/ScanReceiptModal";

// Initial seeded list of shopping items and lists is empty to allow starting from scratch
const INITIAL_LISTS: ShoppingList[] = [];

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'lists' | 'categories'>('dashboard');
  const [userProfileName, setUserProfileName] = useState("Alex");
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [categories, setCategories] = useState<AppCategory[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState(3570.50); // Mock standard revenue ledger
  const [monthlyLimit, setMonthlyLimit] = useState(2500.00); // Standard spending limit target
  
  // Controls
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isNewListModalOpen, setIsNewListModalOpen] = useState(false);

  // New list form parameters
  const [newListFormName, setNewListFormName] = useState("");
  const [newListFormBudget, setNewListFormBudget] = useState("");
  const [newListFormCategory, setNewListFormCategory] = useState<CategoryType>("");
  const [newListFormParcelas, setNewListFormParcelas] = useState("1");
  const [newListFormSolicitante, setNewListFormSolicitante] = useState("Alex");
  const [newListFormSetor, setNewListFormSetor] = useState("Tecnologia");
  const [newListFormCentroCusto, setNewListFormCentroCusto] = useState("CC-TI-42");
  const [newListFormFinalCartao, setNewListFormFinalCartao] = useState("9876");
  const [newListFormEntrega, setNewListFormEntrega] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [newListFormDataLancamento, setNewListFormDataLancamento] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [newListFormDestino, setNewListFormDestino] = useState("Almoxarifado Central");
  const [newListFormDescricao, setNewListFormDescricao] = useState("");

  // Dynamic calculations for sidebar and desktop header
  const currentMonthTotalSpent = shoppingLists
    .filter((list) => list.status === "CONCLUÍDO")
    .reduce((sum, list) => sum + list.spent, 0);

  // Load state from localStorage on build
  useEffect(() => {
    const savedLists = localStorage.getItem("shopcontrol_lists");
    const savedIncome = localStorage.getItem("shopcontrol_income");
    const savedLimit = localStorage.getItem("shopcontrol_limit");
    const savedName = localStorage.getItem("shopcontrol_profilename");
    const savedCategories = localStorage.getItem("shopcontrol_categories");

    let loadedCats: AppCategory[] = INITIAL_APP_CATEGORIES;
    if (savedCategories) {
      try {
        loadedCats = JSON.parse(savedCategories);
      } catch (e) {
        loadedCats = INITIAL_APP_CATEGORIES;
      }
    }
    setCategories(loadedCats);
    localStorage.setItem("shopcontrol_categories", JSON.stringify(loadedCats));

    if (loadedCats.length > 0) {
      setNewListFormCategory(`${loadedCats[0].description} - ${loadedCats[0].code}`);
    }

    if (savedLists) {
      try {
        const parsed = JSON.parse(savedLists) as ShoppingList[];
        // Filter out any mock "seed" data so the user begins on an empty slate
        const filtered = parsed.filter((list) => !list.id.startsWith("seed-list-"));
        
        // Migrate legacy categories to modern coded classifications
        const migrated = filtered.map((list) => {
          let cat = list.category || "";
          const match = cat.match(/^(\d{5})\s*-\s*(.+)$/);
          if (match) {
            cat = `${match[2]} - ${match[1]}`;
          } else {
            const codeMatch = cat.match(/\b\d{5}\b/);
            if (!codeMatch) {
              const upper = cat.trim().toUpperCase();
              if (upper === "SUPERMERCADO" || upper === "ALIMENTAÇÃO") {
                cat = "Custos Diversos de Baixo Valor - Operacional - 16008";
              } else if (upper === "CONSTRUÇÃO") {
                cat = "Manutenções - Materiais - 19002";
              } else if (upper === "ELETRÔNICOS") {
                cat = "Equipamentos de Informatica - 21004";
              } else if (upper === "LAZER") {
                cat = "Custos Diversos de Baixo Valor - Operacional - 16008";
              } else if (upper === "SERVIÇOS") {
                cat = "Consultorias - Operacional - 16011";
              } else if (upper === "OUTROS" || !upper) {
                cat = "Custos Diversos de Baixo Valor - Operacional - 16008";
              }
            }
          }
          return { ...list, category: cat };
        });

        setShoppingLists(migrated);
        localStorage.setItem("shopcontrol_lists", JSON.stringify(migrated));
      } catch (e) {
        setShoppingLists(INITIAL_LISTS);
      }
    } else {
      setShoppingLists(INITIAL_LISTS);
    }

    if (savedIncome) setMonthlyIncome(parseFloat(savedIncome) || 3570.50);
    if (savedLimit) setMonthlyLimit(parseFloat(savedLimit) || 2500.00);
    if (savedName) setUserProfileName(savedName);
  }, []);

  // Sync utilities
  const saveListsToStorage = (updatedList: ShoppingList[]) => {
    // Add safety migration step to prevent any legacy categorisation leakages
    const migratedList = updatedList.map((list) => {
      let cat = list.category || "";
      const match = cat.match(/^(\d{5})\s*-\s*(.+)$/);
      if (match) {
        cat = `${match[2]} - ${match[1]}`;
      } else {
        const codeMatch = cat.match(/\b\d{5}\b/);
        if (!codeMatch) {
          const upper = cat.trim().toUpperCase();
          if (upper === "SUPERMERCADO" || upper === "ALIMENTAÇÃO") {
            cat = "Custos Diversos de Baixo Valor - Operacional - 16008";
          } else if (upper === "CONSTRUÇÃO") {
            cat = "Manutenções - Materiais - 19002";
          } else if (upper === "ELETRÔNICOS") {
            cat = "Equipamentos de Informatica - 21004";
          } else if (upper === "LAZER") {
            cat = "Custos Diversos de Baixo Valor - Operacional - 16008";
          } else if (upper === "SERVIÇOS") {
            cat = "Consultorias - Operacional - 16011";
          } else if (upper === "OUTROS" || !upper) {
            cat = "Custos Diversos de Baixo Valor - Operacional - 16008";
          }
        }
      }
      return { ...list, category: cat };
    });

    setShoppingLists(migratedList);
    localStorage.setItem("shopcontrol_lists", JSON.stringify(migratedList));
  };

  const saveCategoriesToStorage = (updatedCats: AppCategory[]) => {
    setCategories(updatedCats);
    localStorage.setItem("shopcontrol_categories", JSON.stringify(updatedCats));

    if (updatedCats.length > 0 && !newListFormCategory) {
      setNewListFormCategory(`${updatedCats[0].description} - ${updatedCats[0].code}`);
    }
  };

  const handleAddCategory = (code: string, description: string) => {
    const newCat: AppCategory = {
      id: `cat-${Date.now()}`,
      code,
      description
    };
    saveCategoriesToStorage([...categories, newCat]);
  };

  const handleUpdateCategory = (id: string, code: string, description: string) => {
    const updated = categories.map(cat => cat.id === id ? { ...cat, code, description } : cat);
    saveCategoriesToStorage(updated);
  };

  const handleDeleteCategory = (id: string) => {
    const updated = categories.filter(cat => cat.id !== id);
    saveCategoriesToStorage(updated);
  };

  const handleResetCategories = () => {
    saveCategoriesToStorage(INITIAL_APP_CATEGORIES);
    if (INITIAL_APP_CATEGORIES.length > 0) {
      setNewListFormCategory(`${INITIAL_APP_CATEGORIES[0].description} - ${INITIAL_APP_CATEGORIES[0].code}`);
    }
  };

  const saveBudgetSettings = (limit: number, income: number) => {
    setMonthlyLimit(limit);
    setMonthlyIncome(income);
    localStorage.setItem("shopcontrol_limit", limit.toString());
    localStorage.setItem("shopcontrol_income", income.toString());
  };

  const saveProfileName = (newName: string) => {
    setUserProfileName(newName);
    localStorage.setItem("shopcontrol_profilename", newName);
  };

  // State manipulation handlers
  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListFormName.trim()) return;

    const budgetVal = parseFloat(newListFormBudget) || 0;
    
    const dateStr = new Date().toLocaleString("pt-BR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    }).replace(".", "");

    const finalCategory = newListFormCategory || (categories[0] ? `${categories[0].description} - ${categories[0].code}` : "");

    const newShoppingList: ShoppingList = {
      id: `list-${Date.now()}`,
      name: newListFormName.trim(),
      budget: budgetVal,
      spent: 0,
      date: dateStr,
      category: finalCategory,
      status: "PENDENTE",
      items: newListFormDescricao.trim() ? [
        {
          id: `item-${Date.now()}`,
          name: newListFormDescricao.trim(),
          price: budgetVal,
          quantity: 1,
          checked: false
        }
      ] : [],
      
      // Seed corporate tracking parameters
      fornecedor: newListFormName.trim(),
      parcelas: parseInt(newListFormParcelas) || 1,
      solicitante: newListFormSolicitante.trim(),
      setor: newListFormSetor.trim(),
      centroCusto: newListFormCentroCusto.trim(),
      finalCartao: newListFormFinalCartao.trim(),
      entrega: newListFormEntrega.trim(),
      destino: newListFormDestino.trim(),
      descricao: newListFormDescricao.trim(),
      dataLancamento: newListFormDataLancamento
    };

    const updatedLists = [newShoppingList, ...shoppingLists];
    saveListsToStorage(updatedLists);

    // Drills down directly to let user add items to the list immediately
    setSelectedListId(newShoppingList.id);
    setActiveTab('lists');

    // Reset inputs & close
    setNewListFormName("");
    setNewListFormBudget("");
    setNewListFormCategory(categories[0] ? `${categories[0].description} - ${categories[0].code}` : "");
    setNewListFormParcelas("1");
    setNewListFormSolicitante(userProfileName || "Alex");
    setNewListFormSetor("Tecnologia");
    setNewListFormCentroCusto("CC-TI-42");
    setNewListFormFinalCartao("9876");
    const todayStr = (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();
    setNewListFormEntrega(todayStr);
    setNewListFormDataLancamento(todayStr);
    setNewListFormDestino("Almoxarifado Central");
    setNewListFormDescricao("");
    setIsNewListModalOpen(false);
  };

  const handleUpdateList = (updatedList: ShoppingList) => {
    const updated = shoppingLists.map((list) => {
      if (list.id === updatedList.id) {
        return updatedList;
      }
      return list;
    });
    saveListsToStorage(updated);
  };

  const handleDeleteList = (listId: string) => {
    const updated = shoppingLists.filter(list => list.id !== listId);
    saveListsToStorage(updated);
    if (selectedListId === listId) {
      setSelectedListId(null);
    }
  };

  const handleImportLists = (imported: ShoppingList[]) => {
    const merged = [...shoppingLists];
    imported.forEach(item => {
      const idx = merged.findIndex(l => l.id === item.id);
      if (idx !== -1) {
        merged[idx] = item;
      } else {
        merged.push(item);
      }
    });
    saveListsToStorage(merged);
  };

  const handleResetApp = () => {
    setShoppingLists([]);
    setSelectedListId(null);
    setMonthlyIncome(3000);
    setMonthlyLimit(2000);
    localStorage.removeItem("shopcontrol_lists");
    localStorage.removeItem("shopcontrol_income");
    localStorage.removeItem("shopcontrol_limit");
  };

  // Callback when scanned list is saved
  const handleReceiptProcessed = (newList: ShoppingList) => {
    const updated = [newList, ...shoppingLists];
    saveListsToStorage(updated);
    setSelectedListId(newList.id);
    setActiveTab('lists');
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row selection:bg-brand-secondary-container text-on-surface">
      
      {/* DESKTOP SIDEBAR */}
      <aside 
        className="hidden md:flex bg-white text-slate-700 flex-col p-6 space-y-8 shrink-0 sticky top-0 border-r border-slate-200"
        style={{ width: "211px", height: "700px" }}
      >
        <div className="flex items-center space-x-3 text-slate-900">
          <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center shadow-xs">
            <ShoppingCart className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-[12px] font-mono tracking-widest text-brand-secondary uppercase font-bold leading-none block mt-0.5">Compras Online</span>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <button
            onClick={() => setActiveTab('lists')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl cursor-pointer transition-all text-left text-sm font-semibold ${
              activeTab === 'lists'
                ? "bg-brand-secondary-container text-brand-on-secondary-container"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Lançamentos</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('dashboard');
              setSelectedListId(null);
            }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl cursor-pointer transition-all text-left text-sm font-semibold ${
              activeTab === 'dashboard'
                ? "bg-brand-secondary-container text-brand-on-secondary-container"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('categories');
              setSelectedListId(null);
            }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl cursor-pointer transition-all text-left text-sm font-semibold ${
              activeTab === 'categories'
                ? "bg-brand-secondary-container text-brand-on-secondary-container"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Layers className="w-5 h-5" />
            <span>Categorias</span>
          </button>
        </nav>
      </aside>

      {/* MAIN LAYOUT WRAPPER */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Responsive Header Banner */}
        <header className="w-full sticky top-0 z-40 bg-white border-b border-slate-200/80 h-16 flex items-center justify-between px-6 shrink-0 md:px-8">
          {/* Logo segment for mobile, Navigation breadcrumbs for desktop */}
          <div className="flex items-center gap-md">
            <div className="md:hidden flex items-center gap-sm">
              <div className="w-9 h-9 bg-brand-primary rounded-lg flex items-center justify-center shadow-xs">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div className="leading-none">
                <h1 className="font-headline font-black text-sm tracking-tight text-brand-primary leading-none">
                  Controle de Compras
                </h1>
                <span className="font-mono text-[9px] uppercase text-brand-on-secondary-container bg-brand-secondary-container px-1 py-0.5 rounded-sm inline-block mt-0.5 font-bold">
                  Online
                </span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
              <span className="text-slate-400">Plataforma</span>
              <span className="text-slate-300">/</span>
              <span className="text-brand-primary font-bold">
                {activeTab === 'dashboard' ? 'Painel Geral' : activeTab === 'lists' ? 'Lançamentos' : 'Categorias'}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-sm md:gap-md">
            <div className="hidden md:flex items-center gap-sm bg-slate-50 border border-slate-100 rounded-xl px-4 py-1.5 font-sans text-[11px] font-bold text-slate-500">
              <ShieldCheck className="w-4 h-4 text-brand-primary" />
              <span>Processador Seguro</span>
            </div>

            <button 
              onClick={() => alert("Você não possui novas notificações no momento.")}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors active:scale-95 duration-100 cursor-pointer"
              title="Notificações"
            >
              <Bell className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </header>

        {/* Primary tab workspace */}
        <main className="flex-1 w-full max-w-[1650px] mx-auto px-4 md:px-8 py-8 pb-32 md:pb-12 bg-slate-50/50">
          {activeTab === 'dashboard' && (
            <Dashboard
              shoppingLists={shoppingLists}
              monthlyLimit={monthlyLimit}
              monthlyIncome={monthlyIncome}
              onNavigate={setActiveTab}
              onOpenScan={() => setIsScanOpen(true)}
              onOpenNewListModal={() => setIsNewListModalOpen(true)}
              onSelectList={(list) => {
                setSelectedListId(list.id);
                setActiveTab('lists');
              }}
              userProfileName={userProfileName}
              onEditProfileName={saveProfileName}
            />
          )}

          {activeTab === 'lists' && (
            <Lists
              shoppingLists={shoppingLists}
              categories={categories}
              onCreateList={(name, budget, cat) => {
                // Direct state interface handle
              }}
              onUpdateList={handleUpdateList}
              onDeleteList={handleDeleteList}
              onImportLists={handleImportLists}
              selectedListId={selectedListId}
              onSelectList={(list) => setSelectedListId(list ? list.id : null)}
              onOpenNewListModal={() => setIsNewListModalOpen(true)}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'categories' && (
            <Categories
              categories={categories}
              onAddCategory={handleAddCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
              onResetCategories={handleResetCategories}
            />
          )}
        </main>
      </div>

      {/* Floating Action Menu for rapid inputs */}
      <button 
        onClick={() => setIsScanOpen(true)}
        className="fixed bottom-24 right-container-padding w-14 h-14 bg-brand-primary hover:bg-black/85 text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-40 md:hidden border border-white/20"
        title="Escaneamento Rápido"
      >
        <PlusCircle className="w-7 h-7" />
      </button>

      {/* Static premium bottom navigational bar */}
      <nav className="fixed bottom-0 left-0 right-0 w-full h-20 flex justify-around items-center bg-white border-t border-slate-200 shadow-[0px_-4px_20px_rgba(15,23,42,0.06)] z-50 rounded-t-2xl md:hidden">
        {/* Lists Nav Item */}
        <button
          onClick={() => setActiveTab('lists')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-4 rounded-full transition-all duration-150 active:scale-95 ${
            activeTab === 'lists'
              ? "bg-brand-secondary-container text-brand-on-secondary-container font-extrabold"
              : "text-on-surface-variant hover:bg-surface-container-low"
          }`}
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="font-sans text-[10px] font-semibold leading-none">Compras</span>
        </button>

        {/* Dashboard Active Nav Item */}
        <button
          onClick={() => {
            setActiveTab('dashboard');
            setSelectedListId(null);
          }}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-4 rounded-full transition-all duration-150 active:scale-95 ${
            activeTab === 'dashboard'
              ? "bg-brand-secondary-container text-brand-on-secondary-container font-extrabold"
              : "text-on-surface-variant hover:bg-surface-container-low"
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="font-sans text-[10px] font-semibold leading-none">Dashboard</span>
        </button>

        {/* Categorias Nav Item */}
        <button
          onClick={() => {
            setActiveTab('categories');
            setSelectedListId(null);
          }}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-4 rounded-full transition-all duration-150 active:scale-95 ${
            activeTab === 'categories'
              ? "bg-brand-secondary-container text-brand-on-secondary-container font-extrabold"
              : "text-on-surface-variant hover:bg-surface-container-low"
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="font-sans text-[10px] font-semibold leading-none">Categorias</span>
        </button>
      </nav>

      {/* MODALS INJECTIONS */}

      {/* New List Modal */}
      {isNewListModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-3xl p-8 max-w-4xl w-full shadow-2xl font-sans text-xs space-y-6 animate-in fade-in zoom-in-95 duration-200 my-8 border border-slate-100">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-5">
              <div className="space-y-1">
                <span className="bg-emerald-50 text-emerald-700 text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full border border-emerald-100">
                  Lançamento de Despesa Corporativa
                </span>
                <h3 className="font-headline font-extrabold text-xl text-slate-900 mt-1">Registrar Nova Compra</h3>
                <p className="text-xs text-slate-500">
                  Cadastre uma nova solicitação de faturamento preenchendo as informações abaixo.
                </p>
              </div>
              <button 
                onClick={() => setIsNewListModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateList} className="space-y-6">
              {/* Product description (Descrição do Produto) */}
              <div className="bg-emerald-50/40 p-6 rounded-2xl border border-emerald-100/85 space-y-2">
                <label className="flex items-center gap-1.5 text-slate-800 font-extrabold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                  Descrição do Produto / Itens Comprados <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newListFormDescricao}
                  onChange={(e) => setNewListFormDescricao(e.target.value)}
                  placeholder="Ex: Notebook Dell Inspiron 15, Kit 5 Cadeiras de Escritório Ergonômicas, etc."
                  className="w-full bg-white border border-emerald-200 rounded-xl px-4 py-3 text-slate-900 font-bold text-sm placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-2xs"
                />
                <p className="text-[10px] text-emerald-700/80 mt-1 font-medium">
                  💡 Esse produto será automaticamente registrado como o primeiro item faturado na ordem do fornecedor.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Section 1: Financial & Card Info */}
                <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200/60 pb-3 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-brand-primary">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <h4 className="font-headline font-extrabold text-xs uppercase tracking-wider text-slate-900">
                      Dados Financeiros e Faturamento
                    </h4>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="flex items-center gap-1.5 text-slate-700 font-bold mb-1.5 label text-xs">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        Fornecedor / Estabelecimento <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={35}
                        value={newListFormName}
                        onChange={(e) => setNewListFormName(e.target.value)}
                        placeholder="Ex: Leroy Merlin, Dell Computadores, etc."
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-medium placeholder:text-slate-400/80 focus:outline-hidden focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-slate-700 font-bold mb-1.5 label text-xs">
                        <Folder className="w-3.5 h-3.5 text-slate-400" />
                        Classificação de Conta (Categoria) <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={newListFormCategory}
                        onChange={(e) => setNewListFormCategory(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-semibold focus:outline-hidden focus:ring-1 focus:ring-brand-primary focus:border-transparent transition-all shadow-2xs cursor-pointer"
                      >
                        {categories.map((cat) => {
                          const val = `${cat.description} - ${cat.code}`;
                          return (
                            <option key={cat.id} value={val}>
                              {cat.description} - {cat.code}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-slate-700 font-bold mb-1.5 label text-xs">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                        Valor Total Estipulado (R$) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-semibold">R$</span>
                        <input
                          type="number"
                          required
                          min="1"
                          step="0.01"
                          value={newListFormBudget}
                          onChange={(e) => setNewListFormBudget(e.target.value)}
                          placeholder="0,00"
                          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 font-mono font-semibold focus:outline-hidden focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all shadow-2xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-slate-700 font-bold mb-1.5 label text-xs">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Data de Lançamento da Compra <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={newListFormDataLancamento}
                        onChange={(e) => setNewListFormDataLancamento(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all shadow-2xs cursor-pointer"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1.5 label text-xs">
                          Final do Cartão
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={4}
                          value={newListFormFinalCartao}
                          onChange={(e) => setNewListFormFinalCartao(e.target.value.replace(/\D/g, ""))}
                          placeholder="4 dígitos (ex: 9876)"
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all shadow-2xs"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1.5 label text-xs">
                          Parcelas
                        </label>
                        <select
                          value={newListFormParcelas}
                          onChange={(e) => setNewListFormParcelas(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all shadow-2xs cursor-pointer"
                        >
                          <option value="1">À vista (1x)</option>
                          <option value="2">2x no cartão</option>
                          <option value="3">3x no cartão</option>
                          <option value="4">4x no cartão</option>
                          <option value="5">5x no cartão</option>
                          <option value="6">6x no cartão</option>
                          <option value="10">10x no cartão</option>
                          <option value="12">12x no cartão</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Logistics & Identification details */}
                <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200/60 pb-3 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <Folder className="w-4 h-4" />
                    </div>
                    <h4 className="font-headline font-extrabold text-xs uppercase tracking-wider text-slate-900">
                      Identificação &amp; Destino Logístico
                    </h4>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center gap-1.5 text-slate-700 font-bold mb-1.5 label text-xs">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          Solicitante <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newListFormSolicitante}
                          onChange={(e) => setNewListFormSolicitante(e.target.value)}
                          placeholder="Ex: Alex"
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all shadow-2xs"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1.5 label text-xs">
                          Setor / Dept. <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newListFormSetor}
                          onChange={(e) => setNewListFormSetor(e.target.value)}
                          placeholder="Ex: Tecnologia"
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all shadow-2xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-slate-700 font-bold mb-1.5 label text-xs">
                        <Folder className="w-3.5 h-3.5 text-slate-400" />
                        Centro de Custo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newListFormCentroCusto}
                        onChange={(e) => setNewListFormCentroCusto(e.target.value)}
                        placeholder="Ex: CC-TI-42"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all shadow-2xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center gap-1.5 text-slate-700 font-bold mb-1.5 label text-xs">
                          <Truck className="w-3.5 h-3.5 text-slate-400" />
                          Previsão de Entrega <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={newListFormEntrega}
                          onChange={(e) => setNewListFormEntrega(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all shadow-2xs cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-1.5 text-slate-700 font-bold mb-1.5 label text-xs">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          Destino Final <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newListFormDestino}
                          onChange={(e) => setNewListFormDestino(e.target.value)}
                          placeholder="Ex: Almoxarifado Central"
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={() => setIsNewListModalOpen(false)}
                  className="px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-center transition-all cursor-pointer min-w-[120px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-center cursor-pointer transition-all active:scale-98 duration-100 shadow-md hover:shadow-lg min-w-[170px]"
                >
                  Criar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Camera/OCR Scan Modal */}
      <ScanReceiptModal
        isOpen={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        onReceiptProcessed={handleReceiptProcessed}
      />
    </div>
  );
}
