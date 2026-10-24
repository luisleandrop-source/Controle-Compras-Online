import React, { useState } from "react";
import { AppCategory } from "../types";
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Search,
  RefreshCw,
  Hash,
  FileText,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

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
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
      setErrorMessage("Preencha o código e a descrição da conta.");
      return;
    }

    const exists = categories.some(
      (cat) => cat.code.toUpperCase() === trimmedCode.toUpperCase()
    );
    if (exists) {
      setErrorMessage(
        `O código "${trimmedCode}" já está atribuído a outra conta.`
      );
      return;
    }

    onAddCategory(trimmedCode, trimmedDesc);
    setNewCode("");
    setNewDescription("");
    setSuccessMessage("Conta contábil cadastrada com sucesso.");

    setTimeout(() => setSuccessMessage(""), 4000);
  };

  const handleStartEdit = (cat: AppCategory) => {
    setEditingId(cat.id);
    setEditingCode(cat.code);
    setEditingDescription(cat.description);
    setConfirmDeleteId(null);
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
      setErrorMessage("Código e descrição são obrigatórios.");
      return;
    }

    const exists = categories.some(
      (cat) =>
        cat.id !== id && cat.code.toUpperCase() === trimmedCode.toUpperCase()
    );
    if (exists) {
      setErrorMessage(
        `O código "${trimmedCode}" já pertence a outra conta cadastrada.`
      );
      return;
    }

    onUpdateCategory(id, trimmedCode, trimmedDesc);
    setEditingId(null);
    setSuccessMessage("Conta contábil atualizada.");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const filteredCategories = categories.filter((cat) => {
    const q = searchQuery.toLowerCase();
    return (
      cat.code.toLowerCase().includes(q) ||
      cat.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6" id="categories-root">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Plano de Contas
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Padronização contábil de despesas operacionais, administrativas e
            ativos corporativos.
          </p>
        </div>

        {confirmReset ? (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-600">
              Restaurar as 41 contas padrão?
            </span>
            <button
              onClick={() => {
                onResetCategories();
                setConfirmReset(false);
                setSuccessMessage("Plano de contas padrão restaurado.");
                setTimeout(() => setSuccessMessage(""), 4000);
              }}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors whitespace-nowrap"
            >
              Confirmar
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium rounded-lg cursor-pointer transition-colors"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer text-xs shrink-0 whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Restaurar Padrão</span>
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Add Account Form & Summary (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          <section className="bg-white rounded-2xl p-6 border border-slate-200/80 space-y-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Nova Conta Contábil
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Adicione um novo código classificador ao catálogo
              </p>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="flex items-center gap-1.5 text-slate-700 font-medium mb-1.5 text-xs">
                  <Hash className="w-3.5 h-3.5 text-slate-400" />
                  Código da Conta <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 16022"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.trim())}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono tabular-nums font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors placeholder:font-sans placeholder:font-normal placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-slate-700 font-medium mb-1.5 text-xs">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Descrição da Conta <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Combustível e Lubrificantes"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors placeholder:text-slate-400"
                />
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl cursor-pointer transition-colors text-xs whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Conta</span>
              </button>
            </form>
          </section>

          <section className="bg-white rounded-2xl p-6 border border-slate-200/80 space-y-4">
            <h3 className="text-xs font-semibold text-slate-900">
              Estrutura do Plano
            </h3>
            <div className="grid grid-cols-2 divide-x divide-slate-100">
              <div className="pr-4">
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 block">
                  {categories.length}
                </span>
                <span className="text-xs text-slate-500">Contas ativas</span>
              </div>
              <div className="pl-4">
                <span className="text-2xl font-bold font-mono tabular-nums text-indigo-600 block">
                  {categories.filter((c) => c.code.startsWith("16")).length}
                </span>
                <span className="text-xs text-slate-500">Grupo 16XXX</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed pt-3 border-t border-slate-100">
              Prefixos recomendados: <span className="font-mono">14XXX</span>{" "}
              CMV, <span className="font-mono">16XXX</span> Operacional,{" "}
              <span className="font-mono">17XXX</span> Administrativo e{" "}
              <span className="font-mono">21XXX</span> Imobilizado.
            </p>
          </section>
        </div>

        {/* Right Column: Search & Accounts Table (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por código ou descrição da conta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-medium placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500">
                    <th className="py-3 px-5 w-28">Código</th>
                    <th className="py-3 px-5">Descrição da Conta</th>
                    <th className="py-3 px-5 text-right w-36">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredCategories.map((cat) => {
                    const isEditing = editingId === cat.id;

                    return (
                      <tr
                        key={cat.id}
                        className={`hover:bg-slate-50/80 transition-colors h-10 ${
                          isEditing ? "bg-indigo-50/40" : ""
                        }`}
                      >
                        <td className="py-2.5 px-5 font-mono tabular-nums font-semibold text-slate-700">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingCode}
                              onChange={(e) =>
                                setEditingCode(e.target.value.trim())
                              }
                              className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-mono tabular-nums text-xs focus:outline-hidden focus:border-indigo-600 text-slate-900 font-semibold"
                            />
                          ) : (
                            cat.code
                          )}
                        </td>

                        <td className="py-2.5 px-5 font-medium text-slate-900">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingDescription}
                              onChange={(e) =>
                                setEditingDescription(e.target.value)
                              }
                              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs focus:outline-hidden focus:border-indigo-600 text-slate-900 font-medium"
                            />
                          ) : (
                            cat.description
                          )}
                        </td>

                        <td className="py-2.5 px-5 text-right whitespace-nowrap">
                          {isEditing ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleSaveEdit(cat.id)}
                                className="p-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-md cursor-pointer transition-colors"
                                title="Salvar"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-1.5 border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 rounded-md cursor-pointer transition-colors"
                                title="Cancelar"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : confirmDeleteId === cat.id ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => {
                                  onDeleteCategory(cat.id);
                                  setConfirmDeleteId(null);
                                  setSuccessMessage("Conta removida.");
                                  setTimeout(() => setSuccessMessage(""), 2500);
                                }}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-semibold cursor-pointer"
                              >
                                Excluir
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleStartEdit(cat)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md cursor-pointer transition-colors"
                                title="Editar conta"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(cat.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer transition-colors"
                                title="Excluir conta"
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
                      <td
                        colSpan={3}
                        className="py-10 text-center text-slate-400 text-xs"
                      >
                        {searchQuery
                          ? "Nenhuma conta corresponde à pesquisa."
                          : "Nenhuma conta cadastrada."}
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
