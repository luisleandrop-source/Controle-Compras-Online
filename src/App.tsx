import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  PlusCircle,
  X,
  User,
  CreditCard,
  Building,
  Folder,
  Truck,
  MapPin,
  DollarSign,
  Layers,
  Calendar,
  LogOut,
  Lock,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ScanLine,
  Plus,
  Check,
  Edit2
} from "lucide-react";
import {
  APP_VERSION,
  ShoppingList,
  CategoryType,
  AppCategory,
  INITIAL_APP_CATEGORIES
} from "./types";
import Dashboard from "./components/Dashboard";
import Lists from "./components/Lists";
import Categories from "./components/Categories";
import NewPurchase from "./components/NewPurchase";
import ScanReceiptModal from "./components/ScanReceiptModal";
import {
  listenShoppingLists,
  listenCategories,
  listenSettings,
  deleteShoppingList,
  deleteShoppingLists,
  saveMultipleShoppingLists,
  deleteCategory,
  saveMultipleCategories,
  saveSettings
} from "./firebase";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem("shopcontrol_loggedin") === "true";
  });
  const [loginUsername, setLoginUsername] = useState("User");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [confirmLogout, setConfirmLogout] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "nova-compra" | "dashboard" | "lists" | "categories"
  >("dashboard");
  const [userProfileName, setUserProfileName] = useState("User");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempProfileName, setTempProfileName] = useState("User");

  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [categories, setCategories] = useState<AppCategory[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState(3570.5);
  const [monthlyLimit, setMonthlyLimit] = useState(2500.0);

  // Controls
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isNewListModalOpen, setIsNewListModalOpen] = useState(false);
  const [lastSavedPurchase, setLastSavedPurchase] = useState<{
    name: string;
    budget: number;
  } | null>(null);
  const [consecutiveLaunchesCount, setConsecutiveLaunchesCount] = useState(0);

  // New list form parameters
  const [newListFormName, setNewListFormName] = useState("");
  const [newListFormBudget, setNewListFormBudget] = useState("");
  const [newListFormCategory, setNewListFormCategory] =
    useState<CategoryType>("");
  const [newListFormParcelas, setNewListFormParcelas] = useState("1");
  const [newListFormSolicitante, setNewListFormSolicitante] = useState("User");
  const [newListFormSetor, setNewListFormSetor] = useState("Tecnologia");
  const [newListFormCentroCusto, setNewListFormCentroCusto] =
    useState("CC-TI-42");
  const [newListFormFinalCartao, setNewListFormFinalCartao] = useState("9876");
  const [newListFormEntrega, setNewListFormEntrega] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [newListFormDataLancamento, setNewListFormDataLancamento] = useState(
    () => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }
  );
  const [newListFormDestino, setNewListFormDestino] = useState(
    "Almoxarifado Central"
  );
  const [newListFormDescricao, setNewListFormDescricao] = useState("");

  // Database Synchronization State
  const [syncTrigger, setSyncTrigger] = useState(0);
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{
    show: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    const savedName = localStorage.getItem("shopcontrol_profilename");
    if (savedName) {
      setUserProfileName(savedName);
      setTempProfileName(savedName);
      setNewListFormSolicitante(savedName);
    }

    const unsubscribeLists = listenShoppingLists((firestoreLists) => {
      if (firestoreLists && firestoreLists.length > 0) {
        setShoppingLists(firestoreLists);
        localStorage.setItem(
          "shopcontrol_lists",
          JSON.stringify(firestoreLists)
        );
      } else {
        const savedLists = localStorage.getItem("shopcontrol_lists");
        if (savedLists) {
          try {
            const parsed = JSON.parse(savedLists) as ShoppingList[];
            const filtered = parsed.filter(
              (list) => !list.id.startsWith("seed-list-")
            );
            if (filtered.length > 0) {
              saveMultipleShoppingLists(filtered);
            }
          } catch (e) {
            console.error("Erro ao migrar listas locais para o Firestore:", e);
          }
        }
      }
    });

    const unsubscribeCategories = listenCategories((firestoreCats) => {
      if (firestoreCats && firestoreCats.length > 0) {
        setCategories(firestoreCats);
        localStorage.setItem(
          "shopcontrol_categories",
          JSON.stringify(firestoreCats)
        );
        setNewListFormCategory(
          `${firestoreCats[0].description} - ${firestoreCats[0].code}`
        );
      } else {
        const savedCategories = localStorage.getItem("shopcontrol_categories");
        let loadedCats: AppCategory[] = INITIAL_APP_CATEGORIES;
        if (savedCategories) {
          try {
            loadedCats = JSON.parse(savedCategories);
          } catch {
            loadedCats = INITIAL_APP_CATEGORIES;
          }
        }
        saveMultipleCategories(loadedCats);
      }
    });

    const unsubscribeSettings = listenSettings((firestoreSettings) => {
      if (firestoreSettings) {
        setMonthlyIncome(firestoreSettings.monthlyIncome);
        setMonthlyLimit(firestoreSettings.monthlyLimit);
        localStorage.setItem(
          "shopcontrol_income",
          firestoreSettings.monthlyIncome.toString()
        );
        localStorage.setItem(
          "shopcontrol_limit",
          firestoreSettings.monthlyLimit.toString()
        );
      } else {
        const savedIncome = localStorage.getItem("shopcontrol_income");
        const savedLimit = localStorage.getItem("shopcontrol_limit");
        const income = savedIncome ? parseFloat(savedIncome) : 3570.5;
        const limit = savedLimit ? parseFloat(savedLimit) : 2500.0;
        saveSettings({ monthlyIncome: income, monthlyLimit: limit });
      }
    });

    return () => {
      unsubscribeLists();
      unsubscribeCategories();
      unsubscribeSettings();
    };
  }, [syncTrigger]);

  const handleDatabaseSync = async () => {
    setIsSyncingDb(true);
    try {
      let repairedCount = 0;

      const normalizedLists = shoppingLists.map((list) => {
        let listRepaired = false;
        const itemsCopy = Array.isArray(list.items) ? [...list.items] : [];
        if (!Array.isArray(list.items)) {
          listRepaired = true;
        }

        const repairedItems = itemsCopy.map((item) => {
          let itemRepaired = false;
          const updatedItem = { ...item };

          const priceNum = Number(updatedItem.price);
          if (typeof updatedItem.price !== "number" || isNaN(priceNum)) {
            updatedItem.price = isNaN(priceNum) ? 0 : priceNum;
            itemRepaired = true;
          } else {
            updatedItem.price = priceNum;
          }

          const qtyNum = Number(updatedItem.quantity);
          if (typeof updatedItem.quantity !== "number" || isNaN(qtyNum)) {
            updatedItem.quantity = isNaN(qtyNum) ? 1 : qtyNum;
            itemRepaired = true;
          } else {
            updatedItem.quantity = qtyNum;
          }

          if (!updatedItem.name) {
            updatedItem.name = "Item sem Nome";
            itemRepaired = true;
          }

          if (itemRepaired) repairedCount++;
          return updatedItem;
        });

        let calculatedSpent = list.spent;
        if (repairedItems.length > 0) {
          if (list.status === "CONCLUÍDO") {
            calculatedSpent = repairedItems.reduce(
              (sum, item) => sum + item.price * item.quantity,
              0
            );
          } else {
            const checkedSum = repairedItems
              .filter((item) => item.checked)
              .reduce((sum, item) => sum + item.price * item.quantity, 0);
            calculatedSpent = checkedSum > 0 ? checkedSum : list.spent ?? 0;
          }
        } else {
          calculatedSpent = list.spent ?? 0;
        }

        const cat =
          list.category !== undefined && list.category !== null
            ? list.category
            : "";
        if (list.category === undefined || list.category === null) {
          listRepaired = true;
        }

        if (
          listRepaired ||
          list.spent !== calculatedSpent ||
          JSON.stringify(repairedItems) !== JSON.stringify(list.items)
        ) {
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

      let categoriesCheckedCount = categories.length;
      if (categories.length === 0) {
        await saveMultipleCategories(INITIAL_APP_CATEGORIES);
        categoriesCheckedCount = INITIAL_APP_CATEGORIES.length;
      }

      if (repairedCount > 0) {
        await saveMultipleShoppingLists(normalizedLists);
      }

      setSyncTrigger((prev) => prev + 1);

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
      localStorage.setItem("shopcontrol_lastsync", timeStr);

      setSyncFeedback({
        show: true,
        type: "success",
        title: "Dados sincronizados",
        message: `${normalizedLists.length} lançamentos e ${categoriesCheckedCount} contas verificadas.${repairedCount > 0 ? ` ${repairedCount} ajustes aplicados.` : ""}`
      });
    } catch (error) {
      console.error("Erro na sincronização do banco de dados:", error);
      setSyncFeedback({
        show: true,
        type: "error",
        title: "Falha de sincronização",
        message:
          "Não foi possível conectar ao servidor no momento. Seus dados locais permanecem preservados."
      });
    } finally {
      setIsSyncingDb(false);
      setTimeout(() => {
        setSyncFeedback((prev) => (prev ? { ...prev, show: false } : null));
      }, 5000);
    }
  };

  const saveListsToStorage = (
    updatedList: ShoppingList[],
    skipFirestoreSync: boolean = false
  ) => {
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
          } else if (upper === "OUTROS") {
            cat = "Custos Diversos de Baixo Valor - Operacional - 16008";
          } else if (!upper) {
            cat = "";
          }
        }
      }
      return { ...list, category: cat };
    });

    setShoppingLists(migratedList);
    localStorage.setItem("shopcontrol_lists", JSON.stringify(migratedList));
    if (!skipFirestoreSync) {
      saveMultipleShoppingLists(migratedList).catch((err) => {
        console.error("Erro ao sincronizar listas com o Firestore:", err);
      });
    }
  };

  const saveCategoriesToStorage = (updatedCats: AppCategory[]) => {
    setCategories(updatedCats);
    localStorage.setItem("shopcontrol_categories", JSON.stringify(updatedCats));

    if (updatedCats.length > 0 && !newListFormCategory) {
      setNewListFormCategory(
        `${updatedCats[0].description} - ${updatedCats[0].code}`
      );
    }
    saveMultipleCategories(updatedCats).catch((err) => {
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

  const handleUpdateCategory = (
    id: string,
    code: string,
    description: string
  ) => {
    const updated = categories.map((cat) =>
      cat.id === id ? { ...cat, code, description } : cat
    );
    saveCategoriesToStorage(updated);
  };

  const handleDeleteCategory = (id: string) => {
    const updated = categories.filter((cat) => cat.id !== id);
    saveCategoriesToStorage(updated);
    deleteCategory(id).catch((err) => {
      console.error("Erro ao excluir categoria do Firestore:", err);
    });
  };

  const handleResetCategories = () => {
    saveCategoriesToStorage(INITIAL_APP_CATEGORIES);
    if (INITIAL_APP_CATEGORIES.length > 0) {
      setNewListFormCategory(
        `${INITIAL_APP_CATEGORIES[0].description} - ${INITIAL_APP_CATEGORIES[0].code}`
      );
    }
  };

  const saveProfileName = (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setUserProfileName(trimmed);
    setTempProfileName(trimmed);
    localStorage.setItem("shopcontrol_profilename", trimmed);
    setIsEditingProfile(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim()) {
      setLoginError("Informe seu usuário de acesso.");
      return;
    }
    if (!loginPassword) {
      setLoginError("Informe sua senha de acesso.");
      return;
    }
    if (loginPassword !== "1234") {
      setLoginError("Credenciais inválidas. Verifique a senha informada.");
      return;
    }

    setLoginError("");
    setIsLoggedIn(true);
    localStorage.setItem("shopcontrol_loggedin", "true");

    const username = loginUsername.trim();
    const capitalized = username.charAt(0).toUpperCase() + username.slice(1);
    setUserProfileName(capitalized);
    setTempProfileName(capitalized);
    localStorage.setItem("shopcontrol_profilename", capitalized);
  };

  const executeLogout = () => {
    setIsLoggedIn(false);
    setConfirmLogout(false);
    localStorage.setItem("shopcontrol_loggedin", "false");
    setLoginPassword("");
  };

  const handleOpenNewListModal = () => {
    setLastSavedPurchase(null);
    setConsecutiveLaunchesCount(0);
    setIsNewListModalOpen(true);
  };

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListFormName.trim()) return;

    let parsedBudget = newListFormBudget.trim();
    if (parsedBudget.includes(".") && parsedBudget.includes(",")) {
      parsedBudget = parsedBudget.replace(/\./g, "").replace(",", ".");
    } else if (parsedBudget.includes(",")) {
      parsedBudget = parsedBudget.replace(",", ".");
    }
    const budgetVal = parseFloat(parsedBudget) || 0;

    const dateStr = new Date()
      .toLocaleString("pt-BR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
      })
      .replace(".", "");

    const finalCategory =
      newListFormCategory ||
      (categories[0]
        ? `${categories[0].description} - ${categories[0].code}`
        : "");

    const newShoppingList: ShoppingList = {
      id: `list-${Date.now()}`,
      name: newListFormName.trim(),
      budget: budgetVal,
      spent: 0,
      date: dateStr,
      category: finalCategory,
      status: "PENDENTE",
      items: newListFormDescricao.trim()
        ? [
            {
              id: `item-${Date.now()}`,
              name: newListFormDescricao.trim(),
              price: budgetVal,
              quantity: 1,
              checked: false,
              category: finalCategory
            }
          ]
        : [],
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

    setSelectedListId(newShoppingList.id);
    setActiveTab("lists");

    setNewListFormName("");
    setNewListFormBudget("");
    setNewListFormDescricao("");

    setLastSavedPurchase({ name: newShoppingList.name, budget: budgetVal });
    setConsecutiveLaunchesCount((prev) => prev + 1);
  };

  const handleUpdateList = (updatedList: ShoppingList) => {
    const updated = shoppingLists.map((list) =>
      list.id === updatedList.id ? updatedList : list
    );
    saveListsToStorage(updated);
  };

  const handleDeleteList = (listId: string) => {
    const updated = shoppingLists.filter((list) => list.id !== listId);
    saveListsToStorage(updated, true);
    if (selectedListId === listId) {
      setSelectedListId(null);
    }
    deleteShoppingList(listId).catch((err) => {
      console.error("Erro ao excluir lista do Firestore:", err);
    });
  };

  const handleDeleteLists = (listIds: string[]) => {
    const updated = shoppingLists.filter((list) => !listIds.includes(list.id));
    saveListsToStorage(updated, true);
    if (selectedListId && listIds.includes(selectedListId)) {
      setSelectedListId(null);
    }
    deleteShoppingLists(listIds).catch((err) => {
      console.error("Erro ao excluir listas em lote do Firestore:", err);
    });
  };

  const handleImportLists = (imported: ShoppingList[]) => {
    const merged = [...shoppingLists];
    imported.forEach((item) => {
      const idx = merged.findIndex((l) => l.id === item.id);
      if (idx !== -1) {
        merged[idx] = item;
      } else {
        merged.push(item);
      }
    });
    saveListsToStorage(merged);
  };

  const handleReceiptProcessed = (newList: ShoppingList) => {
    const updated = [newList, ...shoppingLists];
    saveListsToStorage(updated);
    setSelectedListId(newList.id);
    setActiveTab("lists");
  };

  const activeSelectedList = shoppingLists.find((l) => l.id === selectedListId);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl p-8 md:p-10 shadow-sm">
          <div className="mb-8">
            <div className="w-11 h-11 bg-indigo-600 flex items-center justify-center rounded-xl text-white mb-5">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              ShopControl
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
              Gestão corporativa de compras, alocação por centro de custo e
              conciliação contábil.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-slate-700 font-medium mb-1.5 text-xs">
                Usuário de acesso
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="Informe seu usuário"
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 font-medium placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1.5 text-xs">
                Senha de acesso
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••"
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 font-medium placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors text-sm"
                />
              </div>
            </div>

            {loginError && (
              <div className="bg-rose-50 border border-rose-200 px-3.5 py-2.5 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors duration-150 mt-2 cursor-pointer text-sm flex items-center justify-center whitespace-nowrap"
            >
              Entrar na Plataforma
            </button>
          </form>

          <p className="mt-6 pt-4 border-t border-slate-100 text-center text-[11px] font-mono tabular-nums text-slate-400">
            ShopControl · v{APP_VERSION}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900">
      {/* DESKTOP SIDEBAR (256px SaaS Workspace Canvas) */}
      <aside className="hidden md:flex md:w-60 lg:w-64 bg-white flex-col justify-between shrink-0 sticky top-0 h-screen border-r border-slate-200/80 px-4 py-6">
        <div className="space-y-7">
          {/* Brand Zone */}
          <div className="flex items-center justify-between gap-2 px-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                <ShoppingCart className="w-4 h-4 text-white" />
              </div>
              <span className="font-headline font-bold text-base tracking-tight text-slate-900 whitespace-nowrap">
                ShopControl
              </span>
            </div>
            <span className="font-mono tabular-nums text-[11px] text-slate-400 shrink-0">
              v{APP_VERSION}
            </span>
          </div>

          {/* Primary Navigation */}
          <nav className="space-y-1" aria-label="Navegação Principal">
            <button
              onClick={() => {
                setActiveTab("dashboard");
                setSelectedListId(null);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 text-left text-sm font-medium whitespace-nowrap ${
                activeTab === "dashboard"
                  ? "bg-indigo-50 text-indigo-700 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Painel Geral</span>
            </button>

            <button
              onClick={() => setActiveTab("lists")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 text-left text-sm font-medium whitespace-nowrap ${
                activeTab === "lists"
                  ? "bg-indigo-50 text-indigo-700 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span className="flex items-center gap-3">
                <ShoppingCart className="w-4 h-4 shrink-0" />
                <span>Lançamentos</span>
              </span>
              <span className="font-mono tabular-nums text-xs text-slate-400">
                {shoppingLists.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("nova-compra");
                setSelectedListId(null);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 text-left text-sm font-medium whitespace-nowrap ${
                activeTab === "nova-compra"
                  ? "bg-indigo-50 text-indigo-700 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>Nova Compra</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("categories");
                setSelectedListId(null);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 text-left text-sm font-medium whitespace-nowrap ${
                activeTab === "categories"
                  ? "bg-indigo-50 text-indigo-700 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span className="flex items-center gap-3">
                <Layers className="w-4 h-4 shrink-0" />
                <span>Plano de Contas</span>
              </span>
              <span className="font-mono tabular-nums text-xs text-slate-400">
                {categories.length}
              </span>
            </button>
          </nav>

          {/* Secondary Utility Action */}
          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => setIsScanOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors duration-150 cursor-pointer whitespace-nowrap"
            >
              <ScanLine className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Importar Nota (OCR)</span>
            </button>
          </div>
        </div>

        {/* Account & Session Footer */}
        <div className="pt-4 border-t border-slate-200/80 space-y-3">
          {/* Analyst Profile Row */}
          <div className="px-2">
            {isEditingProfile ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={tempProfileName}
                  onChange={(e) => setTempProfileName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveProfileName(tempProfileName);
                    if (e.key === "Escape") setIsEditingProfile(false);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md px-2 py-1 text-xs font-medium text-slate-900 focus:outline-hidden focus:border-indigo-600"
                  autoFocus
                />
                <button
                  onClick={() => saveProfileName(tempProfileName)}
                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                  title="Salvar nome"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="p-1 text-slate-400 hover:bg-slate-100 rounded cursor-pointer"
                  title="Cancelar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between group">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {userProfileName}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    Gestão Corporativa
                  </p>
                </div>
                <button
                  onClick={() => {
                    setTempProfileName(userProfileName);
                    setIsEditingProfile(true);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                  title="Editar nome de exibição"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDatabaseSync}
              disabled={isSyncingDb}
              className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
              title="Sincronizar e verificar integridade dos dados"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 shrink-0 ${isSyncingDb ? "animate-spin text-indigo-600" : ""}`}
              />
              <span>{isSyncingDb ? "Sincronizando" : "Sincronizar"}</span>
            </button>

            {confirmLogout ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={executeLogout}
                  className="px-2.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  Confirmar
                </button>
                <button
                  onClick={() => setConfirmLogout(false)}
                  className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Cancelar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmLogout(true)}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-slate-600 hover:bg-rose-50 hover:text-rose-600 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
                title="Encerrar sessão"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span>Sair</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN WORKSPACE CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Bar Contract: Breadcrumb on Left, Primary Actions on Right */}
        <header className="w-full sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200/80 h-14 md:h-16 flex items-center justify-between gap-8 px-4 md:px-8 shrink-0">
          {/* Left Zone: Mobile Wordmark or Desktop Contextual Breadcrumb */}
          <div className="flex items-center min-w-0">
            <span className="md:hidden font-headline font-bold text-base tracking-tight text-slate-900 whitespace-nowrap shrink-0">
              ShopControl
            </span>

            <nav
              aria-label="Breadcrumb"
              className="hidden md:flex items-center gap-2 text-sm min-w-0"
            >
              <span className="text-slate-400 whitespace-nowrap shrink-0">
                Plataforma
              </span>
              <span className="text-slate-300" aria-hidden="true">
                /
              </span>
              <button
                onClick={() => {
                  if (activeTab === "lists" && selectedListId) {
                    setSelectedListId(null);
                  }
                }}
                className={`whitespace-nowrap shrink-0 ${
                  activeTab === "lists" && selectedListId
                    ? "text-slate-500 hover:text-slate-900 cursor-pointer transition-colors"
                    : "font-semibold text-slate-900 cursor-default"
                }`}
              >
                {activeTab === "nova-compra"
                  ? "Nova Compra"
                  : activeTab === "dashboard"
                    ? "Painel Geral"
                    : activeTab === "lists"
                      ? "Lançamentos"
                      : "Plano de Contas"}
              </button>
              {activeTab === "lists" && activeSelectedList && (
                <>
                  <span className="text-slate-300" aria-hidden="true">
                    /
                  </span>
                  <span className="font-semibold text-slate-900 truncate max-w-[260px]">
                    {activeSelectedList.fornecedor || activeSelectedList.name}
                  </span>
                </>
              )}
            </nav>
          </div>

          {/* Right Zone: Concise Primary Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsScanOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0"
            >
              <ScanLine className="w-3.5 h-3.5 text-slate-500" />
              <span>Escanear Nota</span>
            </button>

            <button
              onClick={handleOpenNewListModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Lançamento</span>
            </button>

            <button
              onClick={executeLogout}
              className="md:hidden p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Encerrar sessão"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Primary Tab Viewport */}
        <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 md:px-8 py-6 md:py-8 pb-24 md:pb-12">
          {activeTab === "nova-compra" && (
            <NewPurchase
              categories={categories}
              onCreateList={(newList) => {
                const updatedLists = [newList, ...shoppingLists];
                saveListsToStorage(updatedLists);
                setSelectedListId(newList.id);
                setActiveTab("lists");
              }}
              userProfileName={userProfileName}
              onNavigateToLists={() => setActiveTab("lists")}
            />
          )}

          {activeTab === "dashboard" && (
            <Dashboard
              shoppingLists={shoppingLists}
              monthlyLimit={monthlyLimit}
              monthlyIncome={monthlyIncome}
              onNavigate={setActiveTab}
              onOpenScan={() => setIsScanOpen(true)}
              onOpenNewListModal={handleOpenNewListModal}
              onSelectList={(list) => {
                setSelectedListId(list.id);
                setActiveTab("lists");
              }}
              userProfileName={userProfileName}
              onEditProfileName={saveProfileName}
            />
          )}

          {activeTab === "lists" && (
            <Lists
              shoppingLists={shoppingLists}
              categories={categories}
              onCreateList={(newList) => {
                const updatedLists = [newList, ...shoppingLists];
                saveListsToStorage(updatedLists);
                setSelectedListId(newList.id);
              }}
              onUpdateList={handleUpdateList}
              onDeleteList={handleDeleteList}
              onDeleteLists={handleDeleteLists}
              onImportLists={handleImportLists}
              selectedListId={selectedListId}
              onSelectList={(list) => setSelectedListId(list ? list.id : null)}
              onOpenNewListModal={handleOpenNewListModal}
              onNavigate={setActiveTab}
              onLogout={executeLogout}
              userProfileName={userProfileName}
            />
          )}

          {activeTab === "categories" && (
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

      {/* Mobile Bottom Navigation (Compact <= 15% Viewport Cap) */}
      <nav
        aria-label="Navegação Mobile"
        className="fixed bottom-0 left-0 right-0 w-full h-16 flex justify-around items-center bg-white border-t border-slate-200 z-40 md:hidden px-2"
      >
        <button
          onClick={() => {
            setActiveTab("dashboard");
            setSelectedListId(null);
          }}
          className={`flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === "dashboard"
              ? "text-indigo-600 font-semibold"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[11px] leading-none">Painel</span>
        </button>

        <button
          onClick={() => setActiveTab("lists")}
          className={`flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === "lists"
              ? "text-indigo-600 font-semibold"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="text-[11px] leading-none">Compras</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("nova-compra");
            setSelectedListId(null);
          }}
          className={`flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === "nova-compra"
              ? "text-indigo-600 font-semibold"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <PlusCircle className="w-5 h-5" />
          <span className="text-[11px] leading-none">Nova</span>
        </button>

        <button
          onClick={() => setIsScanOpen(true)}
          className="flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-lg text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
        >
          <ScanLine className="w-5 h-5" />
          <span className="text-[11px] leading-none">Nota OCR</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("categories");
            setSelectedListId(null);
          }}
          className={`flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            activeTab === "categories"
              ? "text-indigo-600 font-semibold"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[11px] leading-none">Contas</span>
        </button>
      </nav>

      {/* Quick Launch Modal */}
      {isNewListModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-3xl w-full shadow-xl border border-slate-200/80 text-xs space-y-6 my-8">
            <div className="flex justify-between items-start border-b border-slate-200/80 pb-4">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Lançamento corporativo
                </p>
                <h3 className="font-headline font-bold text-xl text-slate-900 mt-0.5">
                  Registrar Nova Compra
                </h3>
              </div>
              <button
                onClick={() => setIsNewListModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                title="Fechar janela"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {lastSavedPurchase && (
              <div className="bg-emerald-50/80 border border-emerald-200 text-emerald-900 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-xs">
                      Lançamento #{consecutiveLaunchesCount} registrado
                    </p>
                    <p className="text-xs text-emerald-800">
                      {lastSavedPurchase.name} ·{" "}
                      <span className="font-mono tabular-nums font-semibold">
                        R${" "}
                        {lastSavedPurchase.budget.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2
                        })}
                      </span>
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-emerald-700 font-medium whitespace-nowrap">
                  Pronto para próximo registro
                </span>
              </div>
            )}

            <form onSubmit={handleCreateList} className="space-y-6">
              <div>
                <label className="block text-slate-700 font-semibold text-xs mb-1.5">
                  Descrição do Produto ou Itens Comprados{" "}
                  <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newListFormDescricao}
                  onChange={(e) => setNewListFormDescricao(e.target.value)}
                  placeholder="Ex: Notebook Dell Inspiron 15, Kit 5 Cadeiras Ergonômicas"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-medium text-sm placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                />
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Este item será incluído automaticamente na ficha do
                  fornecedor.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                {/* Financial Column */}
                <div className="space-y-4">
                  <h4 className="font-headline font-semibold text-sm text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    Faturamento e Classificação
                  </h4>

                  <div className="space-y-3.5">
                    <div>
                      <label className="flex items-center gap-1.5 text-slate-700 font-medium mb-1.5 text-xs">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        Fornecedor / Estabelecimento{" "}
                        <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={60}
                        value={newListFormName}
                        onChange={(e) => setNewListFormName(e.target.value)}
                        placeholder="Ex: Dell Computadores, Kalunga"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-slate-900 font-medium placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-slate-700 font-medium mb-1.5 text-xs">
                        <Folder className="w-3.5 h-3.5 text-slate-400" />
                        Classificação Contábil{" "}
                        <span className="text-rose-600">*</span>
                      </label>
                      <select
                        required
                        value={newListFormCategory}
                        onChange={(e) => setNewListFormCategory(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors cursor-pointer"
                      >
                        {categories.map((cat) => {
                          const val = `${cat.description} - ${cat.code}`;
                          return (
                            <option key={cat.id} value={val}>
                              {cat.code} · {cat.description}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="flex items-center gap-1 text-slate-700 font-medium mb-1.5 text-xs">
                          <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                          Valor Previsto{" "}
                          <span className="text-rose-600">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                            R$
                          </span>
                          <input
                            type="text"
                            inputMode="decimal"
                            required
                            value={newListFormBudget}
                            onChange={(e) => {
                              const cleaned = e.target.value.replace(
                                /[^0-9.,]/g,
                                ""
                              );
                              setNewListFormBudget(cleaned);
                            }}
                            placeholder="0,00"
                            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 font-mono tabular-nums font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="flex items-center gap-1 text-slate-700 font-medium mb-1.5 text-xs">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Data Lançamento{" "}
                          <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={newListFormDataLancamento}
                          onChange={(e) =>
                            setNewListFormDataLancamento(e.target.value)
                          }
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono tabular-nums focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-medium mb-1.5 text-xs">
                          Final do Cartão
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={4}
                          value={newListFormFinalCartao}
                          onChange={(e) =>
                            setNewListFormFinalCartao(
                              e.target.value.replace(/\D/g, "")
                            )
                          }
                          placeholder="9876"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-slate-900 font-mono tabular-nums focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-medium mb-1.5 text-xs">
                          Parcelas
                        </label>
                        <select
                          value={newListFormParcelas}
                          onChange={(e) =>
                            setNewListFormParcelas(e.target.value)
                          }
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors cursor-pointer"
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

                {/* Logistics Column */}
                <div className="space-y-4">
                  <h4 className="font-headline font-semibold text-sm text-slate-900 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-indigo-600" />
                    Alocação e Logística
                  </h4>

                  <div className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="flex items-center gap-1 text-slate-700 font-medium mb-1.5 text-xs">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          Solicitante <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newListFormSolicitante}
                          onChange={(e) =>
                            setNewListFormSolicitante(e.target.value)
                          }
                          placeholder="Responsável"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-medium mb-1.5 text-xs">
                          Setor <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newListFormSetor}
                          onChange={(e) => setNewListFormSetor(e.target.value)}
                          placeholder="Ex: Tecnologia"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-slate-700 font-medium mb-1.5 text-xs">
                        <Folder className="w-3.5 h-3.5 text-slate-400" />
                        Centro de Custo <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newListFormCentroCusto}
                        onChange={(e) =>
                          setNewListFormCentroCusto(e.target.value)
                        }
                        placeholder="Ex: CC-TI-42"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-slate-900 font-mono tabular-nums focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="flex items-center gap-1 text-slate-700 font-medium mb-1.5 text-xs">
                          <Truck className="w-3.5 h-3.5 text-slate-400" />
                          Previsão Entrega{" "}
                          <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={newListFormEntrega}
                          onChange={(e) =>
                            setNewListFormEntrega(e.target.value)
                          }
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono tabular-nums focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-1 text-slate-700 font-medium mb-1.5 text-xs">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          Destino Final <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newListFormDestino}
                          onChange={(e) =>
                            setNewListFormDestino(e.target.value)
                          }
                          placeholder="Almoxarifado"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center pt-5 border-t border-slate-200/80 gap-4">
                <span className="text-xs text-slate-500">
                  {consecutiveLaunchesCount > 0
                    ? `${consecutiveLaunchesCount} ${consecutiveLaunchesCount === 1 ? "compra lançada" : "compras lançadas"} nesta sessão.`
                    : "A janela permanece aberta após salvar para lançamentos em sequência."}
                </span>
                <div className="flex gap-2.5 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setIsNewListModalOpen(false)}
                    className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {consecutiveLaunchesCount > 0 ? "Concluir" : "Cancelar"}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl cursor-pointer transition-colors whitespace-nowrap"
                  >
                    Lançar Compra
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OCR Receipt Scan Modal */}
      <ScanReceiptModal
        isOpen={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        onReceiptProcessed={handleReceiptProcessed}
      />

      {/* Database Sync Toast */}
      {syncFeedback && syncFeedback.show && (
        <div className="fixed bottom-20 md:bottom-6 right-6 z-50 max-w-sm bg-white border border-slate-200 rounded-xl shadow-lg p-4 flex items-start gap-3">
          {syncFeedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-semibold text-slate-900">
              {syncFeedback.title}
            </h4>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              {syncFeedback.message}
            </p>
          </div>
          <button
            onClick={() =>
              setSyncFeedback((prev) => (prev ? { ...prev, show: false } : null))
            }
            className="text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
