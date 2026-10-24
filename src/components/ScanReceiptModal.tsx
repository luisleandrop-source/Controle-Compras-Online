import React, { useState, useRef } from "react";
import {
  UploadCloud,
  X,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ScanLine,
  FileText
} from "lucide-react";
import { ShoppingItem, ShoppingList, CategoryType } from "../types";

interface ScanReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReceiptProcessed: (newList: ShoppingList) => void;
}

export default function ScanReceiptModal({
  isOpen,
  onClose,
  onReceiptProcessed
}: ScanReceiptModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState("");
  const [scanError, setScanError] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<{
    storeName: string;
    category: CategoryType;
    totalAmount: number;
    items: { name: string; price: number; quantity: number }[];
    simulation: boolean;
    fornecedor?: string;
    parcelas?: number;
    solicitante?: string;
    setor?: string;
    centroCusto?: string;
    finalCartao?: string;
    entrega?: string;
    destino?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const presets = [
    {
      name: "Suprimentos Operacionais",
      totalLabel: "R$ 145,80",
      description:
        "Simulação de cupom de insumos básicos e material de copa corporativa.",
      imgUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDaPTTs9xxbv7RAM6mCoilWZxthhJNqD6td8i0pvaM6KOD_1r01tEMfuXb1_LtSyqPR0N1QVvap92wpZSa_7QBu2dxSI2bKA-y7V6SW7sAxeljgDIUuKEj6gk8LLy_NRCCwr09oSzrzUKz8SkE-T9ya3VTM9qa1WD-l4g0RRp2p3yaS1xIZQRoPGi0mRA36ndrKChehu5DOYEDMuKjgq4GLI6z1ETqjLI-8hLKe5Mcx7WZSaGGZlRxpg00qGm_mUanTqPJjdDk5tyI"
    },
    {
      name: "Manutenção Predial",
      totalLabel: "R$ 349,00",
      description:
        "Simulação de nota fiscal de materiais para reparos e infraestrutura.",
      imgUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDaPTTs9xxbv7RAM6mCoilWZxthhJNqD6td8i0pvaM6KOD_1r01tEMfuXb1_LtSyqPR0N1QVvap92wpZSa_7QBu2dxSI2bKA-y7V6SW7sAxeljgDIUuKEj6gk8LLy_NRCCwr09oSzrzUKz8SkE-T9ya3VTM9qa1WD-l4g0RRp2p3yaS1xIZQRoPGi0mRA36ndrKChehu5DOYEDMuKjgq4GLI6z1ETqjLI-8hLKe5Mcx7WZSaGGZlRxpg00qGm_mUanTqPJjdDk5tyI"
    },
    {
      name: "Despesa de Representação",
      totalLabel: "R$ 98,00",
      description:
        "Simulação de comprovante de alimentação corporativa em viagem.",
      imgUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDaPTTs9xxbv7RAM6mCoilWZxthhJNqD6td8i0pvaM6KOD_1r01tEMfuXb1_LtSyqPR0N1QVvap92wpZSa_7QBu2dxSI2bKA-y7V6SW7sAxeljgDIUuKEj6gk8LLy_NRCCwr09oSzrzUKz8SkE-T9ya3VTM9qa1WD-l4g0RRp2p3yaS1xIZQRoPGi0mRA36ndrKChehu5DOYEDMuKjgq4GLI6z1ETqjLI-8hLKe5Mcx7WZSaGGZlRxpg00qGm_mUanTqPJjdDk5tyI"
    }
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processImageFile = (file: File) => {
    setSelectedFile(file);
    setImageLoadError(false);
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    setScanError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        processImageFile(file);
      } else {
        setScanError(
          "Formato inválido. Envie uma imagem PNG, JPG, JPEG ou WEBP."
        );
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const runReceiptScan = async (base64Str: string, isPreset = false) => {
    setIsScanning(true);
    setScanError(null);
    setParsedResult(null);

    const steps = [
      "Decodificando imagem da nota fiscal...",
      "Identificando razão social e estabelecimento...",
      "Extraindo itens, quantidades e valores unitários...",
      "Classificando conta contábil correspondente..."
    ];

    let currentStepIdx = 0;
    setScanStep(steps[0]);

    const interval = setInterval(() => {
      if (currentStepIdx < steps.length - 1) {
        currentStepIdx++;
        setScanStep(steps[currentStepIdx]);
      }
    }, 450);

    try {
      const response = await fetch("/api/scan-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          image: base64Str,
          mimeType: isPreset
            ? "image/jpeg"
            : selectedFile?.type || "image/jpeg"
        })
      });

      clearInterval(interval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || "Falha ao processar leitura da nota fiscal."
        );
      }

      const result = await response.json();
      setParsedResult(result);
    } catch (err: any) {
      clearInterval(interval);
      setScanError(err.message || "Erro inesperado ao analisar o documento.");
    } finally {
      setIsScanning(false);
    }
  };

  const startScanningHandler = () => {
    if (selectedImage) {
      runReceiptScan(selectedImage);
    }
  };

  const handleSelectPreset = (preset: (typeof presets)[0]) => {
    setSelectedImage(preset.imgUrl);
    setImageLoadError(false);
    setSelectedFile(null);
    setScanError(null);
    runReceiptScan(preset.imgUrl, true);
  };

  const handleSaveResult = () => {
    if (!parsedResult) return;

    const shoppingItems: ShoppingItem[] = parsedResult.items.map((it, idx) => ({
      id: `scanned-item-${Date.now()}-${idx}`,
      name: it.name,
      price: it.price,
      quantity: it.quantity,
      checked: true
    }));

    const dateFormatted = new Date()
      .toLocaleString("pt-BR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
      })
      .replace(".", "");

    const newShoppingList: ShoppingList = {
      id: `scanned-list-${Date.now()}`,
      name: parsedResult.storeName,
      budget: parsedResult.totalAmount,
      spent: parsedResult.totalAmount,
      date: dateFormatted,
      category: parsedResult.category,
      status: "CONCLUÍDO",
      items: shoppingItems,
      fornecedor: parsedResult.fornecedor || parsedResult.storeName,
      parcelas: parsedResult.parcelas || 1,
      solicitante: parsedResult.solicitante || "User",
      setor: parsedResult.setor || "Tecnologia",
      centroCusto: parsedResult.centroCusto || "CC-TI-42",
      finalCartao: parsedResult.finalCartao || "9876",
      entrega:
        parsedResult.entrega || new Date().toISOString().split("T")[0],
      destino: parsedResult.destino || "Almoxarifado Central",
      dataLancamento: new Date().toISOString().split("T")[0]
    };

    onReceiptProcessed(newShoppingList);
    onClose();
    resetState();
  };

  const resetState = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setImageLoadError(false);
    setIsScanning(false);
    setScanError(null);
    setParsedResult(null);
    setDragActive(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <ScanLine className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-headline text-base font-bold text-slate-900">
                Importar Cupom ou Nota Fiscal (OCR)
              </h3>
              <p className="text-xs text-slate-500">
                Extração automática de estabelecimento, itens e valores
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onClose();
              resetState();
            }}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {scanError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <p className="font-semibold">Falha na leitura do documento</p>
                <p className="mt-0.5">{scanError}</p>
                <button
                  onClick={resetState}
                  className="mt-2 font-semibold underline hover:no-underline cursor-pointer"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          )}

          {!selectedImage && !parsedResult && !isScanning && (
            <div className="space-y-6">
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors duration-150 ${
                  dragActive
                    ? "border-indigo-600 bg-indigo-50/50"
                    : "border-slate-200 hover:border-indigo-400 bg-slate-50/60"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-3">
                  <UploadCloud className="w-5 h-5 text-slate-600" />
                </div>
                <h4 className="font-headline font-semibold text-sm text-slate-900">
                  Arraste a imagem da nota ou clique para selecionar
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Formatos aceitos: PNG, JPG, JPEG ou WEBP (até 10 MB)
                </p>
                <span className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                  Selecionar Arquivo
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-px bg-slate-200 flex-1" />
                  <span className="text-[11px] text-slate-400 font-medium">
                    Exemplos para simulação imediata
                  </span>
                  <div className="h-px bg-slate-200 flex-1" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {presets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className="p-4 text-left rounded-xl bg-slate-50/70 border border-slate-200/80 hover:border-indigo-400 hover:bg-white transition-colors flex flex-col justify-between cursor-pointer"
                    >
                      <div>
                        <h5 className="font-headline font-semibold text-xs text-slate-900">
                          {preset.name}
                        </h5>
                        <p className="text-[11px] text-slate-500 leading-relaxed mt-1.5">
                          {preset.description}
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="font-mono tabular-nums font-semibold text-slate-700">
                          {preset.totalLabel}
                        </span>
                        <span className="text-indigo-600 font-semibold">
                          Testar
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {isScanning && (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative w-44 h-52 border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center bg-slate-50">
                {selectedImage && !imageLoadError ? (
                  <img
                    src={selectedImage}
                    referrerPolicy="no-referrer"
                    alt="Documento em análise"
                    onError={() => setImageLoadError(true)}
                    className="w-full h-full object-cover opacity-60"
                  />
                ) : (
                  <FileText className="w-10 h-10 text-slate-300" />
                )}
              </div>
              <div className="flex items-center gap-2 text-indigo-600 font-headline font-semibold text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processando leitura da nota fiscal</span>
              </div>
              <p className="text-xs text-slate-500 max-w-sm">{scanStep}</p>
            </div>
          )}

          {parsedResult && !isScanning && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-xs text-emerald-950">
                    Dados extraídos com sucesso
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    {parsedResult.simulation
                      ? "Leitura demonstrativa concluída. Confira os itens antes de salvar."
                      : "Os itens e valores da nota fiscal foram identificados."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div className="pb-2 sm:pb-0 sm:pr-4">
                  <span className="text-[11px] text-slate-500 block">
                    Estabelecimento
                  </span>
                  <span className="font-semibold text-xs text-slate-900 mt-0.5 block">
                    {parsedResult.storeName}
                  </span>
                </div>
                <div className="py-2 sm:py-0 sm:px-4">
                  <span className="text-[11px] text-slate-500 block">
                    Conta Sugerida
                  </span>
                  <span className="text-xs font-medium text-slate-800 mt-0.5 block truncate">
                    {parsedResult.category}
                  </span>
                </div>
                <div className="pt-2 sm:pt-0 sm:pl-4">
                  <span className="text-[11px] text-slate-500 block">
                    Valor Total
                  </span>
                  <span className="font-mono tabular-nums text-sm font-bold text-slate-900 mt-0.5 block">
                    R${" "}
                    {parsedResult.totalAmount.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2
                    })}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="font-semibold text-xs text-slate-900">
                  Itens Identificados ({parsedResult.items.length})
                </h5>
                <div className="border border-slate-200/80 rounded-xl overflow-hidden text-xs">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-left font-semibold text-slate-500 border-b border-slate-200/80">
                        <th className="py-2.5 px-4">Item</th>
                        <th className="py-2.5 px-3 text-center">Qtd.</th>
                        <th className="py-2.5 px-3 text-right">Unitário</th>
                        <th className="py-2.5 px-4 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedResult.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="py-2 px-4 font-medium text-slate-900 max-w-xs truncate">
                            {it.name}
                          </td>
                          <td className="py-2 px-3 text-center font-mono tabular-nums text-slate-600">
                            {it.quantity}x
                          </td>
                          <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-600">
                            R${" "}
                            {it.price.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2
                            })}
                          </td>
                          <td className="py-2 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                            R${" "}
                            {(it.price * it.quantity).toLocaleString("pt-BR", {
                              minimumFractionDigits: 2
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {selectedImage && !isScanning && !parsedResult && (
            <div className="space-y-4 flex flex-col items-center">
              <div className="relative max-w-xs w-full h-60 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                {!imageLoadError ? (
                  <img
                    src={selectedImage}
                    referrerPolicy="no-referrer"
                    alt="Pré-visualização da nota fiscal"
                    onError={() => setImageLoadError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4">
                    <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <span className="text-xs text-slate-500">
                      Documento carregado
                    </span>
                  </div>
                )}
                <button
                  onClick={resetState}
                  className="absolute top-3 right-3 p-1.5 bg-slate-900/70 rounded-lg text-white hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500 text-center max-w-sm">
                Imagem pronta para análise. Confirme abaixo para extrair os
                itens automaticamente.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              if (parsedResult) {
                resetState();
              } else {
                onClose();
              }
            }}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            {parsedResult ? "Escanear Outra" : "Fechar"}
          </button>

          {selectedImage && !parsedResult && !isScanning && (
            <button
              onClick={startScanningHandler}
              className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold inline-flex items-center gap-2 hover:bg-indigo-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Analisar Nota</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {parsedResult && !isScanning && (
            <button
              onClick={handleSaveResult}
              className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold inline-flex items-center gap-2 hover:bg-indigo-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Registrar Lançamento</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
