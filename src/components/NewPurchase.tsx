import React, { useState, useEffect } from "react";
import { 
  PlusCircle, Sparkles, Building, Folder, DollarSign, Calendar, 
  CreditCard, User, Truck, MapPin, Check, Plus, ArrowRight, Eye
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
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [formFinalCartao, setFormFinalCartao] = useState("9876");
  const [formParcelas, setFormParcelas] = useState("1");
  const [formSolicitante, setFormSolicitante] = useState(userProfileName || "User");
  const [formSetor, setFormSetor] = useState("Tecnologia");
  const [formCentroCusto, setFormCentroCusto] = useState("CC-TI-42");
  const [formEntrega, setFormEntrega] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [formDestino, setFormDestino] = useState("Almoxarifado Central");
  const [successFeedback, setSuccessFeedback] = useState<{ name: string; budget: number } | null>(null);

  // Set default category if not set
  useEffect(() => {
    if (!formCategory && categories && categories.length > 0) {
      setFormCategory(`${categories[0].description} - ${categories[0].code}`);
    }
  }, [categories, formCategory]);

  // Update default solicitante with user profile name
  useEffect(() => {
    if (userProfileName) {
      setFormSolicitante(userProfileName);
    }
  }, [userProfileName]);

  const handleCreatePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formDescricao.trim()) return;

    const budgetVal = parseFloat(formBudget) || 0;
    
    const dateStr = new Date().toLocaleString("pt-BR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    }).replace(".", "");

    const finalCategory = formCategory || (categories[0] ? `${categories[0].description} - ${categories[0].code}` : "");

    const newShoppingList: ShoppingList = {
      id: `list-${Date.now()}`,
      name: formName.trim(),
      budget: budgetVal,
      spent: 0,
      date: dateStr,
      category: finalCategory,
      status: "PENDENTE",
      items: formDescricao.trim() ? [
        {
          id: `item-${Date.now()}`,
          name: formDescricao.trim(),
          price: budgetVal,
          quantity: 1,
          checked: false
        }
      ] : [],
      
      // Corporate tracking parameters
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

    // Show success feedback
    setSuccessFeedback({ name: newShoppingList.name, budget: budgetVal });
    
    // Clear ALL fields for next entry
    setFormDescricao("");
    setFormName("");
    setFormBudget("");
    if (categories && categories.length > 0) {
      setFormCategory(`${categories[0].description} - ${categories[0].code}`);
    } else {
      setFormCategory("");
    }
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setFormDataLancamento(todayStr);
    setFormFinalCartao("");
    setFormParcelas("1");
    setFormSolicitante(userProfileName || "");
    setFormSetor("");
    setFormCentroCusto("");
    setFormEntrega(todayStr);
    setFormDestino("");

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6" id="new-purchase-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5" id="new-purchase-header">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2" id="new-purchase-title">
            <PlusCircle className="w-7 h-7 text-emerald-600" id="new-purchase-icon" />
            Nova Compra
          </h1>
          <p className="text-sm text-slate-500" id="new-purchase-subtitle">Cadastre uma nova compra corporativa detalhada preenchendo o formulário abaixo.</p>
        </div>
        <button
          onClick={onNavigateToLists}
          id="btn-view-launches"
          className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
        >
          <Eye className="w-4 h-4" />
          <span>Ver Lançamentos</span>
        </button>
      </div>

      {successFeedback && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300 shadow-2xs" id="success-feedback">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">Compra registrada com sucesso!</p>
              <p className="text-xs text-emerald-700 font-medium mt-1">
                A compra de <span className="font-bold">"{successFeedback.name}"</span> no valor de R$ <span className="font-bold">{successFeedback.budget.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span> foi adicionada ao banco de dados com sucesso.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setSuccessFeedback(null)}
              id="btn-insert-another"
              className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200/80 text-emerald-800 font-bold text-xs rounded-lg cursor-pointer transition-colors"
            >
              Inserir Outra
            </button>
            <button
              onClick={onNavigateToLists}
              id="btn-see-in-lists"
              className="flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors shadow-2xs"
            >
              <span>Ver na Listagem</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleCreatePurchaseSubmit} className="space-y-6" id="new-purchase-form">
        {/* Descrição do Produto */}
        <div className="bg-emerald-50/20 p-5 rounded-2xl border border-emerald-100/60 space-y-2 shadow-2xs" id="field-group-desc">
          <label className="flex items-center gap-1.5 text-slate-800 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Descrição do Produto / Itens Comprados <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            id="input-product-desc"
            value={formDescricao}
            onChange={(e) => setFormDescricao(e.target.value)}
            placeholder="Ex: Notebook Dell Inspiron 15, Kit 5 Cadeiras de Escritório Ergonômicas, etc."
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold text-sm placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-transparent transition-all shadow-2xs"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="form-grid-columns">
          {/* Coluna 1: Dados Financeiros */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 space-y-5 shadow-2xs" id="card-financial-info">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CreditCard className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                Dados Financeiros e Faturamento
              </h4>
            </div>

            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-1.5 text-slate-700 font-bold mb-1.5 text-xs">
                  <Building className="w-4 h-4 text-slate-400" />
                  Fornecedor / Estabelecimento <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  id="input-fornecedor"
                  maxLength={35}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Leroy Merlin, Dell Computadores, etc."
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-slate-700 font-bold mb-1.5 text-xs">
                  <Folder className="w-4 h-4 text-slate-400" />
                  Classificação de Conta (Categoria) <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  id="select-category"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-transparent transition-all cursor-pointer"
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-slate-700 font-bold mb-1.5 text-xs">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    Valor Total (R$) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    id="input-valor"
                    min="1"
                    step="0.01"
                    value={formBudget}
                    onChange={(e) => setFormBudget(e.target.value)}
                    placeholder="0,00"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono font-semibold focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-slate-700 font-bold mb-1.5 text-xs">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    Data Lançamento <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    id="input-data-lancamento"
                    value={formDataLancamento}
                    onChange={(e) => setFormDataLancamento(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-transparent transition-all cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5 text-xs">
                    Final do Cartão
                  </label>
                  <input
                    type="text"
                    required
                    id="input-final-cartao"
                    maxLength={4}
                    value={formFinalCartao}
                    onChange={(e) => setFormFinalCartao(e.target.value.replace(/\D/g, ""))}
                    placeholder="Ex: 9876"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5 text-xs">
                    Parcelas
                  </label>
                  <select
                    id="select-parcelas"
                    value={formParcelas}
                    onChange={(e) => setFormParcelas(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-transparent transition-all cursor-pointer"
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

          {/* Coluna 2: Dados Logísticos */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 space-y-5 shadow-2xs" id="card-logistic-info">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Truck className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                Identificação &amp; Logística
              </h4>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-slate-700 font-bold mb-1.5 text-xs">
                    <User className="w-4 h-4 text-slate-400" />
                    Solicitante <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    id="input-solicitante"
                    value={formSolicitante}
                    onChange={(e) => setFormSolicitante(e.target.value)}
                    placeholder="Ex: User"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5 text-xs">
                    Setor <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    id="input-setor"
                    value={formSetor}
                    onChange={(e) => setFormSetor(e.target.value)}
                    placeholder="Ex: Tecnologia"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-slate-700 font-bold mb-1.5 text-xs">
                  <Folder className="w-4 h-4 text-slate-400" />
                  Centro de Custo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  id="input-centro-custo"
                  value={formCentroCusto}
                  onChange={(e) => setFormCentroCusto(e.target.value)}
                  placeholder="Ex: CC-TI-42"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-slate-700 font-bold mb-1.5 text-xs">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    Previsão Entrega <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    id="input-entrega"
                    value={formEntrega}
                    onChange={(e) => setFormEntrega(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-transparent transition-all cursor-pointer"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-slate-700 font-bold mb-1.5 text-xs">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    Local de Entrega <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    id="input-destino"
                    value={formDestino}
                    onChange={(e) => setFormDestino(e.target.value)}
                    placeholder="Ex: Almoxarifado"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-200">
          <button
            type="submit"
            id="btn-submit-purchase"
            className="flex items-center gap-1.5 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-xs hover:shadow-sm cursor-pointer transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>Salvar Nova Compra</span>
          </button>
        </div>
      </form>
    </div>
  );
}
