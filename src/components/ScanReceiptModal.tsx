import React, { useState, useRef } from "react";
import { Camera, UploadCloud, X, ArrowRight, Loader2, Sparkles, Check, AlertCircle } from "lucide-react";
import { ShoppingItem, ShoppingList, CategoryType } from "../types";

interface ScanReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReceiptProcessed: (newList: ShoppingList) => void;
}

export default function ScanReceiptModal({ isOpen, onClose, onReceiptProcessed }: ScanReceiptModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState("");
  const [scanError, setScanError] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<{
    storeName: string;
    category: CategoryType;
    totalAmount: number;
    items: { name: string; price: number; quantity: number }[];
    simulation: boolean;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Preset mock receipts for extremely convenient simulation testing
  const presets = [
    {
      name: "Cupom Supermercado 🛒",
      preview: "Pão, Leite, Queijo, Frutas e Sabão... (Total: R$ 145,80)",
      description: "Carrega uma simulação de compra semanal de produtos básicos de mercearia.",
      imgUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDaPTTs9xxbv7RAM6mCoilWZxthhJNqD6td8i0pvaM6KOD_1r01tEMfuXb1_LtSyqPR0N1QVvap92wpZSa_7QBu2dxSI2bKA-y7V6SW7sAxeljgDIUuKEj6gk8LLy_NRCCwr09oSzrzUKz8SkE-T9ya3VTM9qa1WD-l4g0RRp2p3yaS1xIZQRoPGi0mRA36ndrKChehu5DOYEDMuKjgq4GLI6z1ETqjLI-8hLKe5Mcx7WZSaGGZlRxpg00qGm_mUanTqPJjdDk5tyI"
    },
    {
      name: "Nota Depósito ConstruJá 🛠️",
      preview: "Tinta Acrílica, Rolos, Massa Corrida... (Total: R$ 349,00)",
      description: "Carrega uma simulação de lista de materiais de pintura doméstica.",
      imgUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDaPTTs9xxbv7RAM6mCoilWZxthhJNqD6td8i0pvaM6KOD_1r01tEMfuXb1_LtSyqPR0N1QVvap92wpZSa_7QBu2dxSI2bKA-y7V6SW7sAxeljgDIUuKEj6gk8LLy_NRCCwr09oSzrzUKz8SkE-T9ya3VTM9qa1WD-l4g0RRp2p3yaS1xIZQRoPGi0mRA36ndrKChehu5DOYEDMuKjgq4GLI6z1ETqjLI-8hLKe5Mcx7WZSaGGZlRxpg00qGm_mUanTqPJjdDk5tyI"
    },
    {
      name: "Recibo Restaurante Bela 🍕",
      preview: "Pizza Grande, Suco Natural, Refris... (Total: R$ 98,00)",
      description: "Carrega uma simulação de refeição em pizzaria familiar.",
      imgUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDaPTTs9xxbv7RAM6mCoilWZxthhJNqD6td8i0pvaM6KOD_1r01tEMfuXb1_LtSyqPR0N1QVvap92wpZSa_7QBu2dxSI2bKA-y7V6SW7sAxeljgDIUuKEj6gk8LLy_NRCCwr09oSzrzUKz8SkE-T9ya3VTM9qa1WD-l4g0RRp2p3yaS1xIZQRoPGi0mRA36ndrKChehu5DOYEDMuKjgq4GLI6z1ETqjLI-8hLKe5Mcx7WZSaGGZlRxpg00qGm_mUanTqPJjdDk5tyI"
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
        setScanError("Apenas arquivos de imagem são aceitos (.png, .jpg, .jpeg, .webp)");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  // Run receipt analytical parse
  const runReceiptScan = async (base64Str: string, isPreset = false) => {
    setIsScanning(true);
    setScanError(null);
    setParsedResult(null);

    // Loop steps to show user beautiful realistic status progression
    const steps = [
      "Iniciando decodificação de imagem...",
      "Enviando cupom para processamento seguro...",
      "Identificando cabeçalho e razão social...",
      "Extraindo itens de compra, preços e quantidades...",
      "Categorizando despesas finais..."
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
          mimeType: isPreset ? "image/jpeg" : (selectedFile?.type || "image/jpeg")
        })
      });

      clearInterval(interval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Ocorreu um erro no servidor de escaneamento.");
      }

      const result = await response.json();
      setParsedResult(result);
    } catch (err: any) {
      clearInterval(interval);
      setScanError(err.message || "Erro desconhecido ao ler o cupom.");
    } finally {
      setIsScanning(false);
    }
  };

  const startScanningHandler = () => {
    if (selectedImage) {
      runReceiptScan(selectedImage);
    }
  };

  const handleSelectPreset = (preset: typeof presets[0]) => {
    setSelectedImage(preset.imgUrl);
    setSelectedFile(null);
    setScanError(null);
    // Presets run with safe mock values seamlessly
    runReceiptScan(preset.imgUrl, true);
  };

  const handleSaveResult = () => {
    if (!parsedResult) return;

    // Convert items to proper format
    const shoppingItems: ShoppingItem[] = parsedResult.items.map((it, idx) => ({
      id: `scanned-item-${Date.now()}-${idx}`,
      name: it.name,
      price: it.price,
      quantity: it.quantity,
      checked: true, // Marked as purchase items already bought
    }));

    const dateFormatted = new Date().toLocaleString("pt-BR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    }).replace(".", "");

    const newShoppingList: ShoppingList = {
      id: `scanned-list-${Date.now()}`,
      name: parsedResult.storeName,
      budget: parsedResult.totalAmount, // Perfect alignment
      spent: parsedResult.totalAmount,
      date: dateFormatted,
      category: parsedResult.category,
      status: "CONCLUÍDO",
      items: shoppingItems,
      fornecedor: parsedResult.fornecedor || parsedResult.storeName,
      parcelas: parsedResult.parcelas || 1,
      solicitante: parsedResult.solicitante || "Alex",
      setor: parsedResult.setor || "Tecnologia",
      centroCusto: parsedResult.centroCusto || "CC-TI-42",
      finalCartao: parsedResult.finalCartao || "9876",
      entrega: parsedResult.entrega || "Imediata",
      destino: parsedResult.destino || "Almoxarifado Central",
      dataLancamento: new Date().toISOString().split('T')[0],
    };

    onReceiptProcessed(newShoppingList);
    onClose();
    resetState();
  };

  const resetState = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setIsScanning(false);
    setScanError(null);
    setParsedResult(null);
    setDragActive(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-surface-container-lowest rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-lg border-b border-surface-container font-headline">
          <div className="flex items-center gap-xs">
            <div className="p-2 rounded-xl bg-brand-secondary/15 text-brand-secondary animate-pulse">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-headline text-lg font-bold">Escanear Cupom Fiscal por IA</h3>
              <p className="font-sans text-xs text-on-surface-variant">
                Carregue ou simule a leitura de notas fiscais com reconhecimento automático
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onClose();
              resetState();
            }}
            className="p-1.5 hover:bg-surface-container rounded-full text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-lg flex-1 overflow-y-auto space-y-lg">
          {scanError && (
            <div className="p-md rounded-xl bg-red-50 border border-red-200 flex items-start gap-md text-red-800 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
              <div>
                <p className="font-bold">Ocorreu um erro ao escanear</p>
                <p className="font-sans text-xs">{scanError}</p>
                <button
                  onClick={resetState}
                  className="mt-2 font-bold underline hover:no-underline text-xs"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          )}

          {/* Core State Selector */}
          {!selectedImage && !parsedResult && !isScanning && (
            <div className="space-y-lg">
              {/* Drag-and-drop / Upload Area */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-150 ${
                  dragActive
                    ? "border-brand-secondary bg-brand-secondary/10"
                    : "border-outline-variant hover:border-brand-secondary bg-surface-container-low"
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center mb-md shadow-sm">
                  <UploadCloud className="w-7 h-7 text-on-surface-variant" />
                </div>
                <h4 className="font-headline font-bold text-sm">Arraste a nota aqui ou selecione arquivos</h4>
                <p className="font-sans text-xs text-on-surface-variant mt-1">
                  Suporta formatos PNG, JPG, JPEG ou WEBP (até 10MB)
                </p>
                <button className="mt-lg px-lg py-2.5 bg-brand-primary text-white text-xs font-bold rounded-xl hover:bg-brand-primary/80 transition-colors">
                  Procurar Arquivo
                </button>
              </div>

              {/* Simulation Segment */}
              <div className="space-y-md">
                <div className="flex items-center gap-xs">
                  <div className="h-px bg-surface-container-high flex-1"></div>
                  <span className="font-sans text-[10px] uppercase tracking-wider text-on-surface-variant/80 font-bold px-sm bg-surface-container-lowest">
                    OU EXPERIMENTE NA PRÁTICA (RECOMENDADO)
                  </span>
                  <div className="h-px bg-surface-container-high flex-1"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                  {presets.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectPreset(preset)}
                      className="p-md text-left rounded-2xl bg-surface-container-low border border-surface-container hover:border-brand-secondary hover:bg-surface-container-lowest hover:shadow-xs transition-all flex flex-col justify-between group active:scale-98 duration-100 h-36"
                    >
                      <div>
                        <h5 className="font-headline font-bold text-xs group-hover:text-brand-secondary text-on-surface leading-tight">
                          {preset.name}
                        </h5>
                        <p className="font-sans text-[11px] text-on-surface-variant leading-relaxed mt-2 line-clamp-3">
                          {preset.description}
                        </p>
                      </div>
                      <span className="font-mono text-[9px] text-brand-secondary font-bold self-end bg-brand-secondary/15 px-1.5 py-0.5 rounded">
                        Iniciar Teste
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Active scanning loader view with scanning lasers */}
          {isScanning && (
            <div className="py-xl flex flex-col items-center justify-center text-center space-y-md">
              <div className="relative w-48 h-56 border border-surface-container rounded-xl overflow-hidden shadow-md flex items-center justify-center bg-surface-container-low">
                {selectedImage && (
                  <img
                    src={selectedImage}
                    referrerPolicy="no-referrer"
                    alt="Processando cupom"
                    className="w-full h-full object-cover opacity-60"
                  />
                )}
                {/* Horizontal scanner beam animation */}
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-brand-secondary to-transparent shadow-[0_0_20px_#6cf8bb] top-0 animate-[bounce_2s_infinite]"></div>
              </div>
              <div className="flex items-center gap-sm text-brand-secondary font-headline font-bold text-sm">
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
                <span>Analisando Nota com Inteligência Artificial</span>
              </div>
              <p className="font-sans text-xs text-on-surface-variant italic font-medium px-md max-w-sm h-4">
                {scanStep}
              </p>
            </div>
          )}

          {/* Results Display Grid */}
          {parsedResult && !isScanning && (
            <div className="space-y-lg">
              <div className="p-lg rounded-2xl bg-brand-secondary/10 border border-brand-secondary/30 flex items-start gap-md">
                <div className="p-2 rounded-xl bg-brand-secondary/20 text-brand-on-secondary-container mt-0.5">
                  <Check className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-headline font-bold text-sm text-brand-on-secondary-container">
                    Informações Extraídas com Sucesso!
                  </h4>
                  <p className="font-sans text-xs text-on-surface-variant mt-1">
                    {parsedResult.simulation 
                      ? "Escaneamento simulado: geramos uma resposta estruturada de alto padrão para demonstração."
                      : "Escaneamento por IA real sobre a nota fiscal processada com sucesso."}
                  </p>
                </div>
              </div>

              {/* Parsed summary properties */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-md bg-surface-container-low p-md rounded-2xl">
                <div>
                  <span className="font-sans text-[10px] text-on-surface-variant block uppercase font-extrabold tracking-wider">
                    Estabelecimento
                  </span>
                  <span className="font-headline font-bold text-sm text-on-surface">
                    {parsedResult.storeName}
                  </span>
                </div>
                <div>
                  <span className="font-sans text-[10px] text-on-surface-variant block uppercase font-extrabold tracking-wider">
                    Categoria Mapeada
                  </span>
                  <span className="font-sans text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
                    {parsedResult.category}
                  </span>
                </div>
                <div>
                  <span className="font-sans text-[10px] text-on-surface-variant block uppercase font-extrabold tracking-wider">
                    Valor Total
                  </span>
                  <span className="font-sans text-sm font-bold text-on-surface">
                    R$ {parsedResult.totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Items tabular view */}
              <div className="space-y-sm">
                <h5 className="font-headline font-bold text-xs text-on-surface">
                  Itens Detectados ({parsedResult.items.length})
                </h5>
                <div className="border border-surface-container rounded-2xl overflow-hidden font-sans text-xs">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low text-left font-bold text-on-surface-variant border-b border-surface-container">
                        <th className="p-sm pl-md">Item</th>
                        <th className="p-sm text-center">Quant.</th>
                        <th className="p-sm text-right">Unitário</th>
                        <th className="p-sm text-right pr-md">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container">
                      {parsedResult.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-surface-container-low/50">
                          <td className="p-sm pl-md font-medium text-on-surface max-w-xs truncate">{it.name}</td>
                          <td className="p-sm text-center text-on-surface-variant">{it.quantity}x</td>
                          <td className="p-sm text-right text-on-surface-variant">R$ {it.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                          <td className="p-sm text-right font-medium text-on-surface pr-md">R$ {(it.price * it.quantity).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Active Image loaded but scanning hasn't run yet */}
          {selectedImage && !isScanning && !parsedResult && (
            <div className="space-y-md flex flex-col items-center">
              <div className="relative max-w-sm w-full h-64 rounded-2xl overflow-hidden border border-surface-container shadow-inner">
                <img
                  src={selectedImage}
                  referrerPolicy="no-referrer"
                  alt="Previa do Cupom"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={resetState}
                  className="absolute top-md right-md p-1.5 bg-black/60 rounded-full text-white hover:bg-black transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="font-sans text-xs text-on-surface-variant text-center max-w-md">
                Imagem preparada. Clique no botão de confirmação abaixo para processar e inferir os valores via IA com o Gemini.
              </p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-lg bg-surface-container-low border-t border-surface-container flex items-center justify-between">
          <button
            onClick={() => {
              if (parsedResult) {
                resetState();
              } else {
                onClose();
              }
            }}
            className="px-lg py-3 rounded-xl border border-outline-variant hover:bg-surface text-xs font-bold text-on-surface transition-colors active:scale-98 duration-100"
          >
            {parsedResult ? "Escanear Outro" : "Fechar"}
          </button>

          {selectedImage && !parsedResult && !isScanning && (
            <button
              onClick={startScanningHandler}
              className="px-xl py-3 rounded-xl bg-brand-secondary text-brand-on-secondary-container text-xs font-bold flex items-center gap-xs hover:bg-brand-secondary/80 transition-colors active:scale-98 duration-100"
            >
              <span>Confirmar e Analisar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {parsedResult && !isScanning && (
            <button
              onClick={handleSaveResult}
              className="px-xl py-3 rounded-xl bg-brand-primary text-white text-xs font-bold flex items-center gap-xs hover:bg-brand-primary/85 transition-colors active:scale-98 duration-100"
            >
              <span>Salvar Como Lista de Compras</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
