import React, { useState } from "react";
import { AppCategory, INITIAL_APP_CATEGORIES } from "../types";
import { Plus, Trash2, Edit2, Save, X, Search, RefreshCw, Layers, Hash, FileText, CheckCircle } from "lucide-react";

interface CategoriesProps {
  categories: AppCategory[];
  onAddCategory: (code: string, description: string) => void;
  onUpdateCategory: (id: string, code: string, description: string) => void;
  onDeleteCategory: (id: string) => void;
  onResetCategories: () => void;
}

export default function Categories({
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onResetCategories
}: CategoriesProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  // Edit mode state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCode, setEditingCode] = useState("");
  const [editingDescription, setEditingDescription] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const trimmedCode = newCode.trim();
    const trimmedDesc = newDescription.trim();

    if (!trimmedCode || !trimmedDesc) {
      setErrorMessage("Ambos os campos Código e Descrição são obrigatórios.");
      return;
    }

    // Check if code already exists
    const exists = categories.some(cat => cat.code.toUpperCase() === trimmedCode.toUpperCase());
    if (exists) {
      setErrorMessage(`O código "${trimmedCode}" já está cadastrado em outra categoria.`);
      return;
    }

    onAddCategory(trimmedCode, trimmedDesc);
    setNewCode("");
    setNewDescription("");
    setSuccessMessage("Categoria adicionada com sucesso!");
    
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  const handleStartEdit = (cat: AppCategory) => {
    setEditingId(cat.id);
    setEditingCode(cat.code);
    setEditingDescription(cat.description);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setErrorMessage("");
  };

  const handleSaveEdit = (id: string) => {
    setErrorMessage("");
    const trimmedCode = editingCode.trim();
    const trimmedDesc = editingDescription.trim();

    if (!trimmedCode || !trimmedDesc) {
      setErrorMessage("Ambos os campos Código e Descrição são obrigatórios.");
      return;
    }

    // Check code duplication excluding itself
    const exists = categories.some(cat => cat.id !== id && cat.code.toUpperCase() === trimmedCode.toUpperCase());
    if (exists) {
      setErrorMessage(`O código "${trimmedCode}" já está sendo usado por outra categoria.`);
      return;
    }

    onUpdateCategory(id, trimmedCode, trimmedDesc);
    setEditingId(null);
    setSuccessMessage("Categoria atualizada com sucesso!");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const filteredCategories = categories.filter(cat => {
    const q = searchQuery.toLowerCase();
    return cat.code.toLowerCase().includes(q) || cat.description.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-xl" id="categories-root">
      {/* Tab Header segment */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-md border-b border-slate-200/60 pb-5">
        <div>
          <h2 className="font-headline text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Layers className="w-7 h-7 text-indigo-600" />
            Categorias
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Plano de contas de despesas corporativas para padronização e governança do faturamento.
          </p>
        </div>

        <button
          onClick={() => {
            if (confirm("Deseja realmente restaurar as 41 categorias do padrão corporativo? Todas as alterações serão perdidas.")) {
              onResetCategories();
              setSuccessMessage("Categorias originais restauradas com sucesso!");
              setTimeout(() => setSuccessMessage(""), 4000);
            }
          }}
          className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-2xs text-xs active:scale-95 duration-100 uppercase tracking-wider shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin-slow" />
          Restaurar Categorias Padrão
        </button>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl">
        {/* ADD CATEGORY CARD & STATS */}
        <div className="space-y-lg">
          <section className="bg-white rounded-2xl p-6 shadow-2xs border border-slate-100">
            <h3 className="font-headline text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600" />
              Nova Categoria
            </h3>
            
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="flex items-center gap-1.5 text-slate-700 font-bold mb-1.5 text-xs uppercase tracking-wider">
                  <Hash className="w-3.5 h-3.5 text-slate-400" />
                  Código Conta <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 16022"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.trim())}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-bold font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-2xs placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-slate-700 font-bold mb-1.5 text-xs uppercase tracking-wider">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Descrição da Conta <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Combustível e Lubrificantes"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-2xs placeholder:text-slate-400"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 px-4 rounded-xl shadow-md cursor-pointer transition-all active:scale-98 duration-100 text-xs uppercase tracking-wider"
              >
                <Plus className="w-4 h-4" />
                Cadastrar Categoria
              </button>
            </form>
          </section>

          {/* Quick info card */}
          <section className="bg-white text-slate-700 rounded-2xl p-6 shadow-2xs border border-slate-100 space-y-3">
            <h4 className="font-headline font-bold text-xs uppercase tracking-widest text-indigo-600">Gabarito Consolidado</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-2xl font-black font-mono text-emerald-600 block">{categories.length}</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Categorias</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-2xl font-black font-mono text-indigo-600 block">
                  {categories.filter(c => c.code.startsWith("16")).length}
                </span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Grupo 16XXX</span>
              </div>
            </div>
            <p className="text-[10.5px] text-slate-500 leading-relaxed font-semibold">
              💡 Use códigos estruturados (ex: 14XXX faturamentos, 16XXX despesas operacionais, 17XXX despesas administrativas, 21XXX ativos fixos) para indexar o painel analítico.
            </p>
          </section>
        </div>

        {/* LIST & FILTER BLOCK */}
        <div className="lg:col-span-2 space-y-md">
          {/* Filtering */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Buscar por código ou descrição da conta de despesa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-slate-900 font-medium placeholder:text-slate-400/80 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
            />
          </div>

          {/* Categories responsive list view */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-6">Descrição da Conta</th>
                    <th className="py-4 px-6 w-32">Código</th>
                    <th className="py-4 px-6 text-right w-36">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredCategories.map((cat) => {
                    const isEditing = editingId === cat.id;

                    return (
                      <tr 
                        key={cat.id} 
                        className={`hover:bg-slate-50/50 transition-colors ${
                          isEditing ? "bg-indigo-50/20" : ""
                        }`}
                      >
                        {/* DESCRIPTION FIELD */}
                        <td className="py-3 px-6 font-semibold text-slate-700">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingDescription}
                              onChange={(e) => setEditingDescription(e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1 text-xs focus:outline-hidden focus:border-indigo-500 text-slate-950 font-bold"
                            />
                          ) : (
                            cat.description
                          )}
                        </td>

                        {/* CODE FIELD */}
                        <td className="py-3 px-6 font-mono font-bold text-slate-900">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingCode}
                              onChange={(e) => setEditingCode(e.target.value.trim())}
                              className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 font-mono text-xs focus:outline-hidden focus:border-indigo-500 text-slate-950 font-extrabold"
                            />
                          ) : (
                            <span className="bg-slate-100 text-slate-800 text-[11px] px-2 py-1 rounded font-extrabold">
                              {cat.code}
                            </span>
                          )}
                        </td>

                        {/* DESKTOP/MOBILE ACTIONS */}
                        <td className="py-3 px-6 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleSaveEdit(cat.id)}
                                className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg cursor-pointer transition-colors"
                                title="Salvar alteração"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-1.5 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                                title="Cancelar"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleStartEdit(cat)}
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                                title="Editar"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Deseja realmente excluir a categoria "${cat.description} - ${cat.code}"?`)) {
                                    onDeleteCategory(cat.id);
                                    setSuccessMessage("Categoria excluída!");
                                    setTimeout(() => setSuccessMessage(""), 2000);
                                  }
                                }}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
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

                  {filteredCategories.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-400 italic">
                        {searchQuery ? "Nenhuma categoria corresponde à busca." : "Nenhuma categoria cadastrada."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
