import express from "express";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { getEmailSettings, saveEmailSettings, sendDailyReport, runBackgroundScheduler } from "./emailService.js";

dotenv.config();

const app = express();

// Set up body parsers with limits for base64 images
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Start background task scheduler for email reports (check every 5 minutes)
runBackgroundScheduler().catch(err => console.error("Erro na inicialização do agendador:", err));
setInterval(() => {
  runBackgroundScheduler().catch(err => console.error("Erro na execução do agendador:", err));
}, 5 * 60 * 1000);

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini Client successfully initialized");
  } catch (error) {
    console.error("Failed to initialize Gemini Client: ", error);
  }
} else {
  console.log("No valid GEMINI_API_KEY found, server-side receipt scanner will run in Simulation Mode");
}

// REST API Endpoints
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    simulationMode: !ai,
    time: new Date().toISOString()
  });
});

// GET Email Settings
app.get("/api/settings/email", async (req, res) => {
  try {
    const settings = await getEmailSettings();
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao buscar configurações de e-mail.", details: error.message || error });
  }
});

// POST Save Email Settings
app.post("/api/settings/email", async (req, res) => {
  try {
    const updated = await saveEmailSettings(req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao salvar configurações de e-mail.", details: error.message || error });
  }
});

// POST Trigger Email Report Manual Send
app.post("/api/send-report", async (req, res) => {
  try {
    const force = req.query.force === "true" || req.body.force === true;
    const result = await sendDailyReport(force);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao processar envio de relatório.", details: error.message || error });
  }
});

// Scan Request Handler
app.post("/api/scan-receipt", async (req, res) => {
  const { image, mimeType } = req.body;

  if (!image) {
    return res.status(400).json({ error: "No image content provided." });
  }

  // If no Gemini client is available or in simulation mode
  if (!ai) {
    console.log("Processing container is in simulation mode (No GEMINI_API_KEY set)");
    // Provide a neat, realistic simulation delay so the UI feels authentic
    await new Promise((resolve) => setTimeout(resolve, 1800));

    // Choose a random realistic receipt content with a slight variance
    const simulatedReceipts = [
      {
        storeName: "Mercado da Vila",
        category: "16008 - Custos Diversos de Baixo Valor - Operacional",
        totalAmount: 145.80,
        simulation: true,
        fornecedor: "Mercado da Vila Ltda",
        parcelas: 1,
        solicitante: "Juliana Silva",
        setor: "Operações",
        centroCusto: "CC-OPE-50",
        finalCartao: "4832",
        entrega: "Imediata",
        destino: "Copa Administrativa",
        items: [
          { name: "Pão de Forma Integral", price: 8.50, quantity: 2 },
          { name: "Leite Desnatado 1L", price: 5.90, quantity: 4 },
          { name: "Queijo Muçarela Fatiado", price: 18.90, quantity: 1 },
          { name: "Café Torrado Especial", price: 29.90, quantity: 1 },
          { name: "Banana Prata Sacola", price: 12.40, quantity: 1 },
          { name: "Detergente Líquido", price: 3.20, quantity: 3 }
        ]
      },
      {
        storeName: "Depósito ConstruJá",
        category: "19002 - Manutenções - Materiais",
        totalAmount: 349.00,
        simulation: true,
        fornecedor: "ConstruJá Atacado de Tijolos",
        parcelas: 3,
        solicitante: "Alex Souza",
        setor: "Manutenção Sede",
        centroCusto: "CC-MAN-01",
        finalCartao: "9912",
        entrega: "2 dias úteis",
        destino: "Reparo Fachada bloco B",
        items: [
          { name: "Tinta Acrílica Branca 3.6L", price: 129.90, quantity: 1 },
          { name: "Rolo de Pintura Anti-respingo", price: 24.50, quantity: 2 },
          { name: "Fita Crepe Alta Fixação", price: 12.30, quantity: 3 },
          { name: "Massa Corrida Balde", price: 95.00, quantity: 1 },
          { name: "Lixa Ferro Grão 150", price: 3.50, quantity: 10 }
        ]
      },
      {
        storeName: "Cantina e Pizzaria Bella",
        category: "16008 - Custos Diversos de Baixo Valor - Operacional",
        totalAmount: 98.00,
        simulation: true,
        fornecedor: "Bella Cantina Ltda",
        parcelas: 1,
        solicitante: "Roberto Oliveira",
        setor: "Comercial / Vendas",
        centroCusto: "CC-COM-12",
        finalCartao: "5534",
        entrega: "Imediata",
        destino: "Almoço com Cliente Ideal",
        items: [
          { name: "Pizza Grande Meio/Meio", price: 68.00, quantity: 1 },
          { name: "Suco Natural Laranja Garrafa 1L", price: 14.00, quantity: 1 },
          { name: "Refrigerante Guaraná Lata", price: 6.00, quantity: 2 },
          { name: "Taxa de Serviço", price: 4.00, quantity: 1 }
        ]
      }
    ];

    const randomReceipt = simulatedReceipts[Math.floor(Math.random() * simulatedReceipts.length)];
    return res.json(randomReceipt);
  }

  try {
    console.log("Analyzing receipt using server-side Gemini Model 'gemini-3.5-flash'...");

    // Strip out base64 data prefix if present (e.g., 'data:image/jpeg;base64,')
    let base64Data = image;
    if (image.includes(";base64,")) {
      base64Data = image.split(";base64,")[1];
    }

    const imagePart = {
      inlineData: {
        mimeType: mimeType || "image/jpeg",
        data: base64Data,
      },
    };

    const textPart = {
      text: `Por favor, analise as informações contidas nessa imagem de nota fiscal ou cupom de compra. Extraia o nome do estabelecimento comercial (como fornecedor), estime qual é o código e a classificação de conta (categoria) mais apropriada no formato "CÓDIGO - DESCRIÇÃO" (ex: "14002 - CMV Fornecedores" para insumos/comida para comércio, "15002 - EPI E Uniformes" para segurança, "16004 - Material de Limpeza e Higiene" para higiene, "16008 - Custos Diversos de Baixo Valor - Operacional" para suprimentos operacionais/compras gerais, "17005 - Material de Escritório" para material administrativo, "19002 - Manutenções - Materiais" para materiais de conserto/pintura, ou "21005 - Moveis e Utensilios" para móveis/ativos). Extraia o valor total, número de parcelas (se houver indicação de parcelamento, senão 1), o usuário solicitante/comprador se visível na nota, setor corporativo sugerido, centro de custo sugerido, final do cartão de crédito (4 dígitos) se visível, status ou previsão de entrega, e utilizador/destino final. Também extraia todos os itens listados com seus preços individuais e as respectivas quantidades. Se não for possível ler algum item com exatidão, pule-o ou estime. Se o cupom for ilegível, simule valores coerentes bem formatados baseados no que puder ser observado.`,
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            storeName: { type: Type.STRING, description: "Nome do estabelecimento, mercado ou loja" },
            category: { type: Type.STRING, description: "Classificação de conta (categoria) no formato 'CÓDIGO - DESCRIÇÃO' (ex: '16008 - Custos Diversos de Baixo Valor - Operacional', '14002 - CMV Fornecedores')" },
            totalAmount: { type: Type.NUMBER, description: "Valor total do cupom fiscal ou recibo" },
            fornecedor: { type: Type.STRING, description: "Nome corporativo do fornecedor / estabelecimento" },
            parcelas: { type: Type.NUMBER, description: "Número de parcelas, p. ex. 1 para à vista, 3 se parcelado em 3x" },
            solicitante: { type: Type.STRING, description: "Nome do comprador ou funcionário solicitante" },
            setor: { type: Type.STRING, description: "Setor ou departamento corporativo (ex: Tecnologia, Administração, Almoxarifado, Operações, Comercial)" },
            centroCusto: { type: Type.STRING, description: "Identificação do Centro de Custo atribuído (ex: CC-TI-42, CC-MKT-08, CC-DIR-01)" },
            finalCartao: { type: Type.STRING, description: "Últimos 4 dígitos do cartão utilizado se visível, ou sugerido" },
            entrega: { type: Type.STRING, description: "Status de entrega ou previsão, ex: 'Imediata', '3 dias úteis', 'Entregue'" },
            destino: { type: Type.STRING, description: "Destino da compra ou utilizador final (ex: Escritório Sede, Obra Sul, Oficina)" },
            items: {
              type: Type.ARRAY,
              description: "Lista de itens ou produtos comprados",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Nome limpo e legível do produto" },
                  price: { type: Type.NUMBER, description: "Preço unitário do item" },
                  quantity: { type: Type.NUMBER, description: "Quantidade comprada do produto" }
                },
                required: ["name", "price", "quantity"]
              }
            }
          },
          required: ["storeName", "category", "totalAmount", "items"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No text response returned from Gemini Model");
    }

    const parsedData = JSON.parse(resultText.trim());
    return res.json({
      ...parsedData,
      simulation: false
    });

  } catch (error: any) {
    console.error("Gemini scanning processing failed: ", error);
    return res.status(500).json({
      error: "Ocorreu um erro ao processar a nota com inteligência artificial.",
      details: error.message || error
    });
  }
});

export default app;
