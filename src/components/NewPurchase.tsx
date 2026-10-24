import React, { useState, useEffect } from "react";
import {
  Building,
  Folder,
  DollarSign,
  Calendar,
  CreditCard,
  User,
  Truck,
  MapPin,
  CheckCircle2,
  Plus,
  ArrowRight,
  FileSpreadsheet
} from "lucide-react";
import { ShoppingList, AppCategory } from "../types";

interface NewPurchaseProps {
  categories: AppCategory[];
  onCreateList: (newList: ShoppingList) => void;
  userProfileName?: string;
  onNavigateToLists: () => void;
}

export default function NewPurchase({
  categories,
  onCreateList,
  userProfileName,
  onNavigateToLists
}: NewPurchaseProps) {
  const [formDescricao, setFormDescricao] = useState("");
  const [formName, setFormName] = useState("");
  const [formBudget, setFormBudget] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formDataLancamento, setFormDataLancamento] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [formFinalCartao, setFormFinalCartao] = useState("9876");
  const [formParcelas, setFormParcelas] = useState("1");
  const [formSolicitante, setFormSolicitante] = useState(
    userProfileName || "User"
  );
  const [formSetor, setFormSetor] = useState("Tecnologia");
  const [formCentroCusto, setFormCentroCusto] = useState("CC-TI-42");
  const [formEntrega, setFormEntrega] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [formDestino, setFormDestino] = useState("Almoxarifado Central");
  const [successFeedback, setSuccessFeedback] = useState<{
    name: string;
    budget: number;
  } | null>(null);

  useEffect(() => {
    if (!formCategory && categories && categories.length > 0) {
      setFormCategory(`${categories[0].description} - ${categories[0].code}`);
    }
  }, [categories, formCategory]);

  useEffect(() => {
    if (userProfileName) {
      setFormSolicitante(userProfileName);
    }
  }, [userProfileName]);

  const handleCreatePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formDescricao.trim()) return;

    let parsedBudget = formBudget.trim();
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
      formCategory ||
      (categories[0]
        ? `${categories[0].description} - ${categories[0].code}`
        : "");

    const newShoppingList: ShoppingList = {
      id: `list-${Date.now()}`,
      name: formName.trim(),
      budget: budgetVal,
      spent: 0,
      date: dateStr,
      category: finalCategory,
      status: "PENDENTE",
      items: formDescricao.trim()
        ? [
            {
              id: `item-${Date.now()}`,
              name: formDescricao.trim(),
              price: budgetVal,
              quantity: 1,
              checked: false,
              category: finalCategory
            }
          ]
        : [],
      fornecedor: formName.trim(),
      parcelas: parseInt(formParcelas) || 1,
      solicitante: formSolicitante.trim(),
      setor: formSetor.trim(),
      centroCusto: formCentroCusto.trim(),
      finalCartao: formFinalCartao.trim(),
      entrega: formEntrega.trim(),
      destino: formDestino.trim(),
      descricao: formDescricao.trim(),
      dataLancamento: formDataLancamento
    };

    onCreateList(newShoppingList);
    setSuccessFeedback({ name: newShoppingList.name, budget: budgetVal });

    setFormDescricao("");
    setFormName("");
    setFormBudget("");
    if (categories && categories.length > 0) {
      setFormCategory(`${categories[0].description} - ${categories[0].code}`);
    } else {
      setFormCategory("");
    }
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    setFormDataLancamento(todayStr);
    setFormParcelas("1");
    setFormEntrega(todayStr);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6" id="new-purchase-container">
      <div
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
        id="new-purchase-header"
      >
        <div>
          <h1
            className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight"
            id="new-purchase-title"
          >
            Nova Compra Corporativa
          </h1>
          <p className="text-sm text-slate-500 mt-1" id="new-purchase-subtitle">
            Preencha os dados financeiros, contábeis e logísticos para abrir uma
            nova ordem de compra.
          </p>
        </div>
        <button
          onClick={onNavigateToLists}
          id="btn-view-launches"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-lg text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <FileSpreadsheet className="w-4 h-4 text-slate-500" />
          <span>Ver Lançamentos</span>
        </button>
      </div>

      {successFeedback && (
        <div
          className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          id="success-feedback"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">
                Compra registrada com sucesso
              </p>
              <p className="text-xs text-emerald-800 mt-0.5">
                {successFeedback.name} ·{" "}
                <span className="font-mono tabular-nums font-semibold">
                  R${" "}
                  {successFeedback.budget.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2
                  })}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setSuccessFeedback(null)}
              id="btn-insert-another"
              className="px-3.5 py-2 bg-white border border-emerald-200 hover:bg-emerald-100/50 text-emerald-800 font-semibold text-xs rounded-lg cursor-pointer transition-colors whitespace-nowrap"
            >
              Novo Registro
            </button>
            <button
              onClick={onNavigateToLists}
              id="btn-see-in-lists"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg cursor-pointer transition-colors whitespace-nowrap"
            >
              <span>Ver na Planilha</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <form
        onSubmit={handleCreatePurchaseSubmit}
        className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 space-y-8"
        id="new-purchase-form"
      >
        {/* Primary Item Description */}
        <div id="field-group-desc">
          <label
            htmlFor="input-product-desc"
            className="block text-slate-900 font-semibold text-xs mb-1.5"
          >
            Descrição do Produto ou Serviço{" "}
            <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            required
            id="input-product-desc"
            value={formDescricao}
            onChange={(e) => setFormDescricao(e.target.value)}
            placeholder="Ex: Notebook Dell Inspiron 15, Kit 5 Cadeiras Ergonômicas"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium text-sm placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
          />
          <p className="text-xs text-slate-500 mt-1.5">
            Este item será vinculado automaticamente à ficha do lançamento, onde
            você poderá incluir itens adicionais.
          </p>
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100"
          id="form-grid-columns"
        >
          {/* Financial & Accounting Column */}
          <div className="space-y-4" id="card-financial-info">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <h2 className="font-headline font-semibold text-sm text-slate-900">
                Dados Financeiros e Faturamento
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="input-fornecedor"
                  className="flex items-center gap-1.5 text-slate-700 font-medium mb-1.5 text-xs"
                >
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  Fornecedor / Estabelecimento{" "}
                  <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  id="input-fornecedor"
                  maxLength={60}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Leroy Merlin, Dell Computadores"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="select-category"
                  className="flex items-center gap-1.5 text-slate-700 font-medium mb-1.5 text-xs"
                >
                  <Folder className="w-3.5 h-3.5 text-slate-400" />
                  Classificação Contábil{" "}
                  <span className="text-rose-600">*</span>
                </label>
                <select
                  required
                  id="select-category"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors cursor-pointer"
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

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="input-valor"
                    className="flex items-center gap-1 text-slate-700 font-medium mb-1.5 text-xs"
                  >
                    <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                    Valor Total (R$) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    id="input-valor"
                    value={formBudget}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/[^0-9.,]/g, "");
                      setFormBudget(cleaned);
                    }}
                    placeholder="0,00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono tabular-nums font-semibold placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="input-data-lancamento"
                    className="flex items-center gap-1 text-slate-700 font-medium mb-1.5 text-xs"
                  >
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Data Lançamento <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    id="input-data-lancamento"
                    value={formDataLancamento}
                    onChange={(e) => setFormDataLancamento(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-mono tabular-nums focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="input-final-cartao"
                    className="block text-slate-700 font-medium mb-1.5 text-xs"
                  >
                    Final do Cartão
                  </label>
                  <input
                    type="text"
                    required
                    id="input-final-cartao"
                    maxLength={4}
                    value={formFinalCartao}
                    onChange={(e) =>
                      setFormFinalCartao(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="9876"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono tabular-nums focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="select-parcelas"
                    className="block text-slate-700 font-medium mb-1.5 text-xs"
                  >
                    Parcelas
                  </label>
                  <select
                    id="select-parcelas"
                    value={formParcelas}
                    onChange={(e) => setFormParcelas(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors cursor-pointer"
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

          {/* Logistics & Requester Column */}
          <div className="space-y-4" id="card-logistic-info">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Truck className="w-4 h-4 text-indigo-600" />
              <h2 className="font-headline font-semibold text-sm text-slate-900">
                Alocação e Logística de Entrega
              </h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="input-solicitante"
                    className="flex items-center gap-1 text-slate-700 font-medium mb-1.5 text-xs"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Solicitante <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    id="input-solicitante"
                    value={formSolicitante}
                    onChange={(e) => setFormSolicitante(e.target.value)}
                    placeholder="Responsável"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="input-setor"
                    className="block text-slate-700 font-medium mb-1.5 text-xs"
                  >
                    Setor <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    id="input-setor"
                    value={formSetor}
                    onChange={(e) => setFormSetor(e.target.value)}
                    placeholder="Ex: Tecnologia"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="input-centro-custo"
                  className="flex items-center gap-1.5 text-slate-700 font-medium mb-1.5 text-xs"
                >
                  <Folder className="w-3.5 h-3.5 text-slate-400" />
                  Centro de Custo <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  id="input-centro-custo"
                  value={formCentroCusto}
                  onChange={(e) => setFormCentroCusto(e.target.value)}
                  placeholder="Ex: CC-TI-42"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono tabular-nums focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="input-entrega"
                    className="flex items-center gap-1 text-slate-700 font-medium mb-1.5 text-xs"
                  >
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Previsão Entrega <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    id="input-entrega"
                    value={formEntrega}
                    onChange={(e) => setFormEntrega(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-mono tabular-nums focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors cursor-pointer"
                  />
                </div>

                <div>
                  <label
                    htmlFor="input-destino"
                    className="flex items-center gap-1 text-slate-700 font-medium mb-1.5 text-xs"
                  >
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    Destino Final <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    id="input-destino"
                    value={formDestino}
                    onChange={(e) => setFormDestino(e.target.value)}
                    placeholder="Almoxarifado"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-5 border-t border-slate-100">
          <button
            type="submit"
            id="btn-submit-purchase"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm cursor-pointer transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Salvar e Abrir Ficha</span>
          </button>
        </div>
      </form>
    </div>
  );
}
