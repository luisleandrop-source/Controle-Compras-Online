export interface ShoppingItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  checked: boolean;
  category?: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  budget: number;
  spent: number;
  date: string;
  category: string;
  status: 'CONCLUÍDO' | 'PENDENTE';
  items: ShoppingItem[];
  
  // Custom Corporate Tracking Model Fields
  fornecedor?: string;       // Fornecedor (Supplier)
  parcelas?: number;         // Parcelas (Installments)
  solicitante?: string;      // Solicitante (Requester)
  setor?: string;            // Setor (Sector/Department)
  centroCusto?: string;      // Centro de Custo (Cost Center)
  finalCartao?: string;      // Final do Cartão (Card ending)
  entrega?: string;          // Informações de Entrega (Delivery info)
  destino?: string;          // Destino (Destination)
  descricao?: string;        // Descrição do Produto / Compra (Product Description)
  dataLancamento?: string;   // Data de Lançamento da Compra (Entry date)
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  date: string;
  category: string;
  description?: string;
  status: 'CONCLUÍDO' | 'PENDENTE';
}

export interface MonthlyConfig {
  limit: number; // Spend limit (Meta de Gastos)
  income: number; // Income (Rendimento/Receitas para cálculo de saldo)
}

export type CategoryType = string;

export interface AppCategory {
  id: string;
  code: string;
  description: string;
}

export const INITIAL_APP_CATEGORIES: AppCategory[] = [
  { id: "cat-1", code: "14002", description: "CMV Fornecedores" },
  { id: "cat-2", code: "14004", description: "Frete de Compras - CMV" },
  { id: "cat-3", code: "15002", description: "EPI E Uniformes" },
  { id: "cat-4", code: "15021", description: "Multas Indenizaçoes Trabalhistas" },
  { id: "cat-5", code: "16003", description: "Embalagens de Serviço" },
  { id: "cat-6", code: "16004", description: "Material de Limpeza e Higiene" },
  { id: "cat-7", code: "16005", description: "Gas" },
  { id: "cat-8", code: "16006", description: "Agua e Esgoto" },
  { id: "cat-9", code: "16008", description: "Custos Diversos de Baixo Valor - Operacional" },
  { id: "cat-10", code: "16009", description: "Dedetizaçao e Limpeza de Reservatorios" },
  { id: "cat-11", code: "16010", description: "Aluguel, Seguro e IPTU do Imovel" },
  { id: "cat-12", code: "16011", description: "Consultorias - Operacional" },
  { id: "cat-13", code: "16013", description: "Serviço de Desentupimento e Limpa Fossa" },
  { id: "cat-14", code: "16014", description: "Viagens e Representações" },
  { id: "cat-15", code: "16015", description: "Assistencia Tecnica - Operacional" },
  { id: "cat-16", code: "16020", description: "Combustivel" },
  { id: "cat-17", code: "16021", description: "Utensilios Operac e Reposiçoes" },
  { id: "cat-18", code: "17003", description: "Telefone e Internet" },
  { id: "cat-19", code: "17004", description: "Marcas e Patentes" },
  { id: "cat-20", code: "17005", description: "Material de Escritório" },
  { id: "cat-21", code: "17006", description: "Assistencia Tecnica - Administrativo" },
  { id: "cat-22", code: "17007", description: "Serviços de TI - Administrativo" },
  { id: "cat-23", code: "17008", description: "Despesas de Cartorios" },
  { id: "cat-24", code: "17009", description: "Sistemas de Gestao - Administrativo" },
  { id: "cat-25", code: "17010", description: "Despesas Diversas de Baixo Valor - Administrativo" },
  { id: "cat-26", code: "17011", description: "Consultorias - Administrativo" },
  { id: "cat-27", code: "17012", description: "Bombeiros - Taxas e Renovaçoes" },
  { id: "cat-28", code: "17013", description: "Monitoramento de Alarme" },
  { id: "cat-29", code: "17014", description: "Tarifas Bancárias e Anuidades de Cartões" },
  { id: "cat-30", code: "18015", description: "Decoraçao" },
  { id: "cat-31", code: "19001", description: "Manutenções - Mão de Obra" },
  { id: "cat-32", code: "19002", description: "Manutenções - Materiais" },
  { id: "cat-33", code: "21001", description: "Maquinas e Equipamentos" },
  { id: "cat-34", code: "21002", description: "Veiculos" },
  { id: "cat-35", code: "21003", description: "Instalações" },
  { id: "cat-36", code: "21004", description: "Equipamentos de Informatica" },
  { id: "cat-37", code: "21005", description: "Moveis e Utensilios" },
  { id: "cat-38", code: "21006", description: "Frete - Compra de Ativos" },
  { id: "cat-39", code: "21007", description: "Reformas e Melhorias" },
  { id: "cat-40", code: "21008", description: "Obras em Alojamentos" },
  { id: "cat-41", code: "25002", description: "Aquisição Societária - Sócios" }
];
