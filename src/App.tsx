import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, ShoppingCart, PlusCircle, 
  Sparkles, Bell, X, User, ShieldCheck, CreditCard,
  Building, Folder, Truck, MapPin, DollarSign, ChevronRight, Layers, Filter, Calendar,
  LogOut, Lock, Mail, Database, RefreshCw, CheckCircle2, AlertCircle, Wifi, WifiOff
} from "lucide-react";
import { ShoppingList, ShoppingItem, CategoryType, AppCategory, INITIAL_APP_CATEGORIES } from "./types";
import Dashboard from "./components/Dashboard";
import Lists from "./components/Lists";
import Categories from "./components/Categories";
import ScanReceiptModal from "./components/ScanReceiptModal";
import { 
  listenShoppingLists, 
  listenCategories, 
  listenSettings, 
  saveShoppingList, 
  deleteShoppingList, 
  deleteShoppingLists, 
  saveMultipleShoppingLists, 
  saveCategory, 
  deleteCategory, 
  saveMultipleCategories, 
  saveSettings 
} from "./firebase";

// Initial seeded list of shopping items and lists is empty to allow starting from scratch
const INITIAL_LISTS: ShoppingList[] = [];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem("shopcontrol_loggedin") === "true";
  });
  const [loginUsername, setLoginUsername] = useState("User");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [activeTab, setActiveTab] = useState<'dashboard' | 'lists' | 'categories'>('dashboard');
  const [userProfileName, setUserProfileName] = useState("User");
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
  const [newListFormSolicitante, setNewListFormSolicitante] = useState("User");
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

  // Database Synchronization & Cohesion State
  const [syncTrigger, setSyncTrigger] = useState(0);
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    return localStorage.getItem("shopcontrol_lastsync") || null;
  });
  const [dbStatus, setDbStatus] = useState<'online' | 'syncing' | 'error'>('online');
  const [syncFeedback, setSyncFeedback] = useState<{
    show: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  } | null>(null);

  // Dynamic calculations for sidebar and desktop header
  const currentMonthTotalSpent = shoppingLists
    .filter((list) => list.status === "CONCLUÍDO")
    .reduce((sum, list) => sum + list.spent, 0);

  // Load profile name and set up Firebase real-time listeners
  useEffect(() => {
    // Load local profile name first
    const savedName = localStorage.getItem("shopcontrol_profilename");
    if (savedName) setUserProfileName(savedName);

    // 1. Listen to shopping lists on Firestore
    const unsubscribeLists = listenShoppingLists((firestoreLists) => {
      if (firestoreLists && firestoreLists.length > 0) {
        setShoppingLists(firestoreLists);
        localStorage.setItem("shopcontrol_lists", JSON.stringify(firestoreLists));
      } else {
        // If firestore is completely empty, upload local items if any exist
        const savedLists = localStorage.getItem("shopcontrol_lists");
        if (savedLists) {
          try {
            const parsed = JSON.parse(savedLists) as ShoppingList[];
            const filtered = parsed.filter((list) => !list.id.startsWith("seed-list-"));
            if (filtered.length > 0) {
              saveMultipleShoppingLists(filtered);
            }
          } catch (e) {
            console.error("Erro ao migrar listas locais para o Firestore:", e);
          }
        }
      }
    });

    // 2. Listen to categories on Firestore
    const unsubscribeCategories = listenCategories((firestoreCats) => {
      if (firestoreCats && firestoreCats.length > 0) {
        setCategories(firestoreCats);
        localStorage.setItem("shopcontrol_categories", JSON.stringify(firestoreCats));
        
        // Also update form default if not set
        setNewListFormCategory(`${firestoreCats[0].description} - ${firestoreCats[0].code}`);
      } else {
        // If firestore is empty, seed/upload local categories
        const savedCategories = localStorage.getItem("shopcontrol_categories");
        let loadedCats: AppCategory[] = INITIAL_APP_CATEGORIES;
        if (savedCategories) {
          try {
            loadedCats = JSON.parse(savedCategories);
          } catch (e) {
            loadedCats = INITIAL_APP_CATEGORIES;
          }
        }
        saveMultipleCategories(loadedCats);
      }
    });

    // 3. Listen to budget/income settings on Firestore
    const unsubscribeSettings = listenSettings((firestoreSettings) => {
      if (firestoreSettings) {
        setMonthlyIncome(firestoreSettings.monthlyIncome);
        setMonthlyLimit(firestoreSettings.monthlyLimit);
        localStorage.setItem("shopcontrol_income", firestoreSettings.monthlyIncome.toString());
        localStorage.setItem("shopcontrol_limit", firestoreSettings.monthlyLimit.toString());
      } else {
        // Seed with current local values if settings do not exist on Firestore
        const savedIncome = localStorage.getItem("shopcontrol_income");
        const savedLimit = localStorage.getItem("shopcontrol_limit");
        const income = savedIncome ? parseFloat(savedIncome) : 3570.50;
        const limit = savedLimit ? parseFloat(savedLimit) : 2500.00;
        saveSettings({ monthlyIncome: income, monthlyLimit: limit });
      }
    });

    return () => {
      unsubscribeLists();
      unsubscribeCategories();
      unsubscribeSettings();
    };
  }, [syncTrigger]);

  // Performs a manual structural integrity check, data repair, and Firestore subscription refresh
  const handleDatabaseSync = async () => {
    setIsSyncingDb(true);
    setDbStatus('syncing');
    
    try {
      // 1. Connection and structural health check
      let repairedCount = 0;
      
      const normalizedLists = shoppingLists.map((list) => {
        let listRepaired = false;
        
        // Ensure lists have a valid items array
        let itemsCopy = Array.isArray(list.items) ? [...list.items] : [];
        if (!Array.isArray(list.items)) {
          listRepaired = true;
        }

        // Validate individual item structures inside the list to avoid undefined crashes in table renders
        const repairedItems = itemsCopy.map((item) => {
          let itemRepaired = false;
          const updatedItem = { ...item };
          
          if (typeof updatedItem.price !== 'number' || isNaN(updatedItem.price)) {
            updatedItem.price = 0;
            itemRepaired = true;
          }
          if (typeof updatedItem.quantity !== 'number' || isNaN(updatedItem.quantity)) {
            updatedItem.quantity = 1;
            itemRepaired = true;
          }
          if (!updatedItem.name) {
            updatedItem.name = "Item sem Nome";
            itemRepaired = true;
          }
          
          if (itemRepaired) repairedCount++;
          return updatedItem;
        });

        // Recalculate spent values if discrepancy is found
        const calculatedSpent = repairedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Ensure category matches standardized list formatting
        let cat = list.category || "Custos Diversos de Baixo Valor - Operacional - 16008";
        if (!list.category) {
          listRepaired = true;
        }

        if (listRepaired || list.spent !== calculatedSpent || JSON.stringify(repairedItems) !== JSON.stringify(list.items)) {
          repairedCount++;
          return {
            ...list,
            category: cat,
            items: repairedItems,
            spent: calculatedSpent
          };
        }
        
        return list;
      });

      // 2. Seed standard categories if database is empty
      let categoriesCheckedCount = categories.length;
      if (categories.length === 0) {
        await saveMultipleCategories(INITIAL_APP_CATEGORIES);
        categoriesCheckedCount = INITIAL_APP_CATEGORIES.length;
      }

      // 3. Write back any repaired lists to Firestore to synchronize structural fixes
      if (repairedCount > 0) {
        await saveMultipleShoppingLists(normalizedLists);
      }

      // 4. Force refresh the listeners
      setSyncTrigger((prev) => prev + 1);

      // Save sync timestamp
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      setLastSyncTime(timeStr);
      localStorage.setItem("shopcontrol_lastsync", timeStr);
      setDbStatus('online');

      // Set highly detailed informative feedback
      setSyncFeedback({
        show: true,
        type: 'success',
        title: 'Sincronização Concluída',
        message: `Banco de dados 100% íntegro e atualizado! ${normalizedLists.length} lançamentos e ${categoriesCheckedCount} categorias validadas. ${repairedCount > 0 ? `${repairedCount} correções estruturais efetuadas.` : 'Nenhum erro de coesão encontrado.'}`
      });

    } catch (error) {
      console.error("Erro na sincronização do banco de dados:", error);
      setDbStatus('error');
      setSyncFeedback({
        show: true,
        type: 'error',
        title: 'Erro de Sincronização',
        message: 'Falha ao conectar com o servidor Firestore. Os dados locais continuam acessíveis.'
      });
    } finally {
      setIsSyncingDb(false);
      // Auto dismiss feedback after 6 seconds
      setTimeout(() => {
        setSyncFeedback((prev) => prev ? { ...prev, show: false } : null);
      }, 6000);
    }
  };

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
    saveMultipleShoppingLists(migratedList).catch(err => {
      console.error("Erro ao sincronizar listas com o Firestore:", err);
    });
  };

  const saveCategoriesToStorage = (updatedCats: AppCategory[]) => {
    setCategories(updatedCats);
    localStorage.setItem("shopcontrol_categories", JSON.stringify(updatedCats));

    if (updatedCats.length > 0 && !newListFormCategory) {
      setNewListFormCategory(`${updatedCats[0].description} - ${updatedCats[0].code}`);
    }
    saveMultipleCategories(updatedCats).catch(err => {
      console.error("Erro ao sincronizar categorias com o Firestore:", err);
    });
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
    saveSettings({ monthlyIncome: income, monthlyLimit: limit }).catch(err => {
      console.error("Erro ao sincronizar configurações com o Firestore:", err);
    });
  };

  const saveProfileName = (newName: string) => {
    setUserProfileName(newName);
    localStorage.setItem("shopcontrol_profilename", newName);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim()) {
      setLoginError("Por favor, insira seu usuário.");
      return;
    }
    if (!loginPassword) {
      setLoginError("Por favor, insira sua senha.");
      return;
    }
    if (loginPassword !== "1234") {
      setLoginError("Senha incorreta. Tente novamente.");
      return;
    }

    setLoginError("");
    setIsLoggedIn(true);
    localStorage.setItem("shopcontrol_loggedin", "true");

    const username = loginUsername.trim();
    const capitalized = username.charAt(0).toUpperCase() + username.slice(1);
    setUserProfileName(capitalized);
    localStorage.setItem("shopcontrol_profilename", capitalized);
  };

  const handleLogout = () => {
    if (window.confirm("Deseja realmente encerrar a sessão?")) {
      setIsLoggedIn(false);
      localStorage.setItem("shopcontrol_loggedin", "false");
      setLoginPassword("");
      alert("Sessão encerrada com sucesso.");
    }
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
    setNewListFormSolicitante(userProfileName || "User");
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

  const handleDeleteLists = (listIds: string[]) => {
    const updated = shoppingLists.filter(list => !listIds.includes(list.id));
    saveListsToStorage(updated);
    if (selectedListId && listIds.includes(selectedListId)) {
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
    // Collect all list IDs to delete them from Firestore in batch
    const idsToDelete = shoppingLists.map(l => l.id);
    if (idsToDelete.length > 0) {
      deleteShoppingLists(idsToDelete).catch(err => {
        console.error("Erro ao limpar listas do Firestore:", err);
      });
    }
    
    // Reset settings in Firestore
    saveSettings({ monthlyIncome: 3000, monthlyLimit: 2000 }).catch(err => {
      console.error("Erro ao redefinir configurações no Firestore:", err);
    });

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

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50 p-4">
        <div className="max-w-md w-full bg-white border border-slate-200/80 rounded-3xl p-8 md:p-10 shadow-xl transition-all duration-300">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-50 flex items-center justify-center rounded-2xl text-indigo-600 mb-5 mx-auto shadow-sm">
              <ShoppingCart className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-serif" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
              Controle de Compras
            </h1>
            <p className="text-xs text-slate-500 mt-2 max-w-[280px] mx-auto">
              Gerencie e acompanhe todas as compras e faturamentos corporativos
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 text-xs flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Usuário de Acesso
              </label>
              <input
                type="text"
                required
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="User"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-2xs text-sm"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5 text-xs flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Senha de Acesso
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-2xs text-sm"
              />
            </div>

            {loginError && (
              <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-xl flex items-center gap-2 text-rose-600 text-xs font-semibold animate-pulse">
                <X className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] duration-100 mt-2 cursor-pointer text-sm flex items-center justify-center gap-2"
            >
              <span>Entrar na Plataforma</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

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

        {/* Database Status & Sync Control */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-slate-700">
              <Database className="w-4 h-4 text-slate-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Banco de Dados</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className={`w-2 h-2 rounded-full ${
                dbStatus === 'online' ? 'bg-emerald-500 animate-pulse' :
                dbStatus === 'syncing' ? 'bg-indigo-500 animate-spin' :
                'bg-rose-500'
              }`} />
              <span className="text-[9px] font-bold font-mono text-slate-500 uppercase">
                {dbStatus === 'online' ? 'Online' :
                 dbStatus === 'syncing' ? 'Sinc...' : 'Erro'}
              </span>
            </div>
          </div>
          
          <div className="text-[10px] text-slate-500 flex flex-col font-mono leading-relaxed border-t border-slate-100/60 pt-2">
            <span className="flex justify-between"><span>Status:</span><span className="font-bold text-slate-700">Coeso</span></span>
            {lastSyncTime ? (
              <span className="flex justify-between"><span>Sinc:</span><span className="font-semibold">{lastSyncTime}</span></span>
            ) : (
              <span className="flex justify-between"><span>Sinc:</span><span className="text-slate-400">Nunca</span></span>
            )}
          </div>

          <button
            onClick={handleDatabaseSync}
            disabled={isSyncingDb}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl transition-all shadow-xs text-xs cursor-pointer active:scale-95 disabled:pointer-events-none"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDb ? 'animate-spin' : ''}`} />
            <span>{isSyncingDb ? 'Sincronizar' : 'Atualizar'}</span>
          </button>
        </div>

        {/* Desktop Sidebar Logout */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl cursor-pointer text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-all text-left text-sm font-semibold"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair</span>
          </button>
          <div className="px-4 text-[10px] text-slate-400 font-mono text-center md:text-left">
            Versão 1.6.0
          </div>
        </div>
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

            {/* Database Sync Header Action */}
            <button 
              onClick={handleDatabaseSync}
              disabled={isSyncingDb}
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-95 duration-100 cursor-pointer ${
                dbStatus === 'error' ? 'bg-rose-50 text-rose-500 hover:bg-rose-100' :
                dbStatus === 'syncing' ? 'bg-indigo-50 text-indigo-600' :
                'hover:bg-slate-100 text-slate-500'
              }`}
              title={isSyncingDb ? "Sincronizando banco de dados..." : "Sincronizar banco de dados para manter a integridade"}
            >
              <RefreshCw className={`w-5 h-5 ${isSyncingDb ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            <button 
              onClick={() => alert("Você não possui novas notificações no momento.")}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors active:scale-95 duration-100 cursor-pointer"
              title="Notificações"
            >
              <Bell className="w-5 h-5 text-slate-500" />
            </button>

            {/* Header Logout button for mobile (icon-only to save space) */}
            <button 
              onClick={handleLogout}
              className="w-10 h-10 md:hidden flex items-center justify-center rounded-full hover:bg-rose-50 text-rose-500 hover:text-rose-600 transition-colors active:scale-95 duration-100 cursor-pointer"
              title="Sair da plataforma"
            >
              <LogOut className="w-5 h-5" />
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
              onDeleteLists={handleDeleteLists}
              onImportLists={handleImportLists}
              selectedListId={selectedListId}
              onSelectList={(list) => setSelectedListId(list ? list.id : null)}
              onOpenNewListModal={() => setIsNewListModalOpen(true)}
              onNavigate={setActiveTab}
              onLogout={handleLogout}
              userProfileName={userProfileName}
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
                          placeholder="Ex: User"
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

      {/* Floating Database Sync Status Feedback Toast */}
      {syncFeedback && syncFeedback.show && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-white border border-slate-100/80 rounded-2xl shadow-2xl p-5 flex gap-4 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="shrink-0 mt-0.5">
            {syncFeedback.type === 'success' ? (
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                <AlertCircle className="w-5 h-5" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-900 leading-none flex items-center gap-1.5">
              {syncFeedback.title}
            </h4>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              {syncFeedback.message}
            </p>
            {lastSyncTime && (
              <div className="mt-2.5 flex items-center gap-2">
                <span className="text-[9px] text-slate-400 font-mono">
                  Última sincronização: {lastSyncTime}
                </span>
              </div>
            )}
          </div>
          <button 
            onClick={() => setSyncFeedback(prev => prev ? { ...prev, show: false } : null)}
            className="shrink-0 text-slate-400 hover:text-slate-600 self-start p-1 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
