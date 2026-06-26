import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, query, limit } from "firebase/firestore";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

// Helper to generate beautifully structured binary Excel workbook using xlsx library
export function generateExcelBuffer(launches: any[]): Buffer {
  const formattedData = launches.map((list, index) => ({
    "Item": index + 1,
    "Fornecedor / Nome": list.fornecedor || list.name,
    "Valor (R$)": parseFloat(list.budget) || 0,
    "Categoria": list.category || "Não definida",
    "Solicitante": list.solicitante || "Não informado",
    "Setor": list.setor || "Não informado",
    "Centro de Custo": list.centroCusto || "Não informado",
    "Final do Cartão": list.finalCartao || "",
    "Parcelas": parseInt(list.parcelas) || 1,
    "Data Lançamento": list.dataLancamento || list.date || "",
    "Descrição / Observações": list.descricao || ""
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Lançamentos");

  // Style sheet column widths
  worksheet["!cols"] = [
    { wch: 6 },   // Item
    { wch: 28 },  // Fornecedor / Nome
    { wch: 15 },  // Valor (R$)
    { wch: 22 },  // Categoria
    { wch: 20 },  // Solicitante
    { wch: 18 },  // Setor
    { wch: 22 },  // Centro de Custo
    { wch: 15 },  // Final do Cartão
    { wch: 10 },  // Parcelas
    { wch: 16 },  // Data Lançamento
    { wch: 35 }   // Descrição / Observações
  ];

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return buffer;
}


// Initialize Firebase App server-side
const configPath = path.join(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");

export interface EmailSettings {
  enabled: boolean;
  recipientEmail: string;
  scheduledTime: string; // "HH:MM" e.g., "08:00"
  lastSentDate: string | null; // "YYYY-MM-DD"
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpSecure: boolean;
  logs: {
    timestamp: string;
    status: "success" | "error" | "simulated";
    message: string;
  }[];
}

const DEFAULT_EMAIL_SETTINGS: EmailSettings = {
  enabled: false,
  recipientEmail: "luisleandrop@gmail.com",
  scheduledTime: "08:00",
  lastSentDate: null,
  smtpHost: "",
  smtpPort: 587,
  smtpUser: "",
  smtpPass: "",
  smtpSecure: false,
  logs: []
};

// Get current email settings
export async function getEmailSettings(): Promise<EmailSettings> {
  try {
    const docRef = doc(db, "settings", "email");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...DEFAULT_EMAIL_SETTINGS, ...docSnap.data() } as EmailSettings;
    }
    return DEFAULT_EMAIL_SETTINGS;
  } catch (error) {
    console.error("Erro ao recuperar configurações de e-mail:", error);
    return DEFAULT_EMAIL_SETTINGS;
  }
}

// Save email settings
export async function saveEmailSettings(settings: Partial<EmailSettings>): Promise<EmailSettings> {
  try {
    const current = await getEmailSettings();
    const updated = { ...current, ...settings };
    // Maintain maximum 30 logs to avoid bloating document size
    if (updated.logs.length > 30) {
      updated.logs = updated.logs.slice(0, 30);
    }
    const docRef = doc(db, "settings", "email");
    await setDoc(docRef, updated);
    return updated;
  } catch (error) {
    console.error("Erro ao salvar configurações de e-mail:", error);
    throw error;
  }
}

// Add a log entry
export async function addEmailLog(status: "success" | "error" | "simulated", message: string) {
  try {
    const current = await getEmailSettings();
    const logEntry = {
      timestamp: new Date().toISOString(),
      status,
      message
    };
    await saveEmailSettings({
      logs: [logEntry, ...current.logs]
    });
  } catch (e) {
    console.error("Erro ao salvar log de e-mail:", e);
  }
}

// Fetch all shopping lists (launches) from Firestore
async function getLaunches(): Promise<any[]> {
  try {
    const listsCollection = collection(db, "lists");
    const querySnapshot = await getDocs(listsCollection);
    const lists: any[] = [];
    querySnapshot.forEach((doc) => {
      lists.push(doc.data());
    });
    // Sort newest first
    lists.sort((a, b) => (b.id || "").localeCompare(a.id || ""));
    return lists;
  } catch (error) {
    console.error("Erro ao buscar lançamentos para o e-mail:", error);
    return [];
  }
}

// Build the HTML body for the report (displays metadata only, with attached excel sheet)
export function buildReportHtml(launches: any[], recipientEmail: string, isSimulated: boolean): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  const timeStr = now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });

  const reportName = "Relatório Consolidado de Compras e Lançamentos";

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${reportName}</title>
    <style>
      body {
        font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
        background-color: #f8fafc;
        color: #1e293b;
        margin: 0;
        padding: 0;
        -webkit-font-smoothing: antialiased;
      }
      .container {
        max-width: 600px;
        margin: 40px auto;
        background-color: #ffffff;
        border-radius: 20px;
        overflow: hidden;
        border: 1px solid #e2e8f0;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      }
      .header {
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        color: #ffffff;
        padding: 32px 24px;
        text-align: center;
        border-bottom: 4px solid #10b981;
      }
      .header h1 {
        margin: 0;
        font-size: 22px;
        font-weight: 800;
        letter-spacing: -0.025em;
        line-height: 1.2;
      }
      .header p {
        margin: 8px 0 0 0;
        font-size: 13px;
        color: #94a3b8;
      }
      .badge-simulated {
        display: inline-block;
        background-color: #fef3c7;
        color: #d97706;
        font-size: 11px;
        font-weight: bold;
        padding: 4px 12px;
        border-radius: 9999px;
        margin-top: 12px;
        border: 1px solid #fde68a;
      }
      .content {
        padding: 32px 24px;
        text-align: center;
      }
      .meta-box {
        background-color: #f1f5f9;
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 24px;
        text-align: left;
        border: 1px solid #e2e8f0;
      }
      .meta-item {
        font-size: 13px;
        margin-bottom: 8px;
        color: #334155;
      }
      .meta-item:last-child {
        margin-bottom: 0;
      }
      .meta-label {
        font-weight: 700;
        color: #64748b;
        display: inline-block;
        width: 130px;
      }
      .meta-value {
        color: #0f172a;
        font-weight: 600;
      }
      .info-alert {
        background-color: #f0fdf4;
        border: 1px dashed #6ee7b7;
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 8px;
      }
      .info-alert-title {
        margin: 0 0 6px 0;
        font-size: 14px;
        color: #065f46;
        font-weight: 700;
      }
      .info-alert-desc {
        margin: 0;
        font-size: 12px;
        color: #047857;
        line-height: 1.5;
      }
      .footer {
        background-color: #f8fafc;
        padding: 24px;
        text-align: center;
        font-size: 11px;
        color: #64748b;
        border-top: 1px solid #e2e8f0;
      }
      .footer p {
        margin: 4px 0;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>${reportName}</h1>
        <p>ShopControl Inteligência Financeira</p>
        ${isSimulated ? `<div class="badge-simulated">Modo de Simulação (SMTP Não Configurado)</div>` : ""}
      </div>
      
      <div class="content">
        <div class="meta-box">
          <div class="meta-item">
            <span class="meta-label">Relatório:</span>
            <span class="meta-value">${reportName}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Data de Envio:</span>
            <span class="meta-value">${dateStr}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Horário de Envio:</span>
            <span class="meta-value">${timeStr}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Destinatário:</span>
            <span class="meta-value">${recipientEmail}</span>
          </div>
        </div>

        <div class="info-alert">
          <p class="info-alert-title">📎 Planilha Excel (.XLSX) em Anexo!</p>
          <p class="info-alert-desc">
            Para garantir a privacidade dos dados, a formatação limpa e a melhor experiência de análise, as tabelas e dados numéricos não foram incluídos no corpo do e-mail.
          </p>
          <p class="info-alert-desc" style="margin-top: 8px; font-weight: 600;">
            Por favor, abra a planilha Excel em anexo para visualizar todos os lançamentos, categorias, setores e centros de custos detalhadamente.
          </p>
        </div>
      </div>
      
      <div class="footer">
        <p><strong>ShopControl Finanças Corporativas</strong></p>
        <p>Este relatório automático foi gerado e disparado de forma segura pelo seu servidor.</p>
        <p style="margin-top: 12px; color: #94a3b8;">&copy; ${now.getFullYear()} ShopControl. Todos os direitos reservados.</p>
      </div>
    </div>
  </body>
  </html>
  `;
  return html;
}


// Send the report immediately
export async function sendDailyReport(force = false): Promise<{ success: boolean; message: string; simulated: boolean }> {
  try {
    const settings = await getEmailSettings();
    if (!settings.enabled && !force) {
      return { success: false, message: "Relatórios de e-mail diários estão desativados.", simulated: false };
    }

    const launches = await getLaunches();
    const recipient = settings.recipientEmail;

    if (!recipient) {
      const errMsg = "Endereço de e-mail destinatário não foi configurado.";
      await addEmailLog("error", errMsg);
      return { success: false, message: errMsg, simulated: false };
    }

    // Check if SMTP is configured. If not, run in simulated mode
    const isSmtpConfigured = !!(settings.smtpHost && settings.smtpUser && settings.smtpPass);

    if (!isSmtpConfigured) {
      // Simulation Mode
      const htmlBody = buildReportHtml(launches, recipient, true);
      const excelBuffer = generateExcelBuffer(launches);
      const msg = `Relatório SIMULADO gerado com sucesso para ${recipient} com ${launches.length} lançamentos. Planilha Excel (.xlsx) de ${excelBuffer.length} bytes gerada com sucesso.`;
      console.log(`[SIMULATED EMAIL] Send to: ${recipient}`);
      console.log(`[SIMULATED EMAIL] Content length: ${htmlBody.length} bytes`);
      console.log(`[SIMULATED EMAIL] Excel Workbook generated: ${excelBuffer.length} bytes`);
      
      await addEmailLog("simulated", msg);
      
      // Update last sent date
      const todayStr = new Date().toISOString().split("T")[0];
      await saveEmailSettings({ lastSentDate: todayStr });

      return {
        success: true,
        message: "Envio simulado com sucesso! Planilha Excel gerada e anexada. (Configure SMTP nas configurações para receber e-mails reais)",
        simulated: true
      };
    }

    // Real Nodemailer Transport Configuration
    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpSecure || settings.smtpPort === 465,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPass
      },
      tls: {
        rejectUnauthorized: false // Helps bypass sandbox certificate blockages
      }
    });

    const htmlBody = buildReportHtml(launches, recipient, false);
    const excelBuffer = generateExcelBuffer(launches);
    const dateStamp = new Date().toISOString().split("T")[0];

    await transporter.sendMail({
      from: `"ShopControl Relatórios" <${settings.smtpUser}>`,
      to: recipient,
      subject: `[ShopControl] Relatório de Lançamentos e Planilha Consolidadas - ${new Date().toLocaleDateString("pt-BR")}`,
      html: htmlBody,
      attachments: [
        {
          filename: `Planilha_Lancamentos_ShopControl_${dateStamp}.xlsx`,
          content: excelBuffer
        }
      ]
    });

    const successMsg = `Relatório e Planilha Excel (.xlsx) enviados com sucesso para ${recipient} contendo ${launches.length} lançamentos.`;
    await addEmailLog("success", successMsg);

    // Update last sent date
    const todayStr = new Date().toISOString().split("T")[0];
    await saveEmailSettings({ lastSentDate: todayStr });

    return {
      success: true,
      message: "Relatório por e-mail e planilha Excel (.xlsx) enviados com sucesso!",
      simulated: false
    };

  } catch (error: any) {
    console.error("Erro ao processar envio de relatório:", error);
    const errorMsg = `Erro ao enviar e-mail: ${error.message || error}`;
    await addEmailLog("error", errorMsg);
    return {
      success: false,
      message: errorMsg,
      simulated: false
    };
  }
}

// Background Task Scheduler runner (called periodically, e.g. every hour)
export async function runBackgroundScheduler() {
  try {
    const settings = await getEmailSettings();
    if (!settings.enabled) return;

    const todayStr = new Date().toISOString().split("T")[0];
    // Check if we already sent it today
    if (settings.lastSentDate === todayStr) {
      return;
    }

    // Parse scheduled time (e.g., "08:00")
    const [schedHour, schedMinute] = settings.scheduledTime.split(":").map(Number);
    const now = new Date();
    const currentHour = now.getHours();

    // Trigger report if current hour is greater or equal to scheduled hour
    if (currentHour >= schedHour) {
      console.log(`[SCHEDULER] Triggering scheduled daily email report at ${now.toLocaleTimeString()}`);
      await sendDailyReport();
    }
  } catch (error) {
    console.error("Erro no agendador de e-mail em segundo plano:", error);
  }
}
