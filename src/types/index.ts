// Основные типы данных для AI Финансовый директор

export interface UserProfile {
  role: 'Owner' | 'CFO' | 'Accountant';
  baseCurrency: string;
  calendarType: 'standard' | '13-period';
}

export interface SalesRecord {
  doc_id: string;
  doc_date: string;
  counterparty_name: string;
  sku: string;
  qty: number;
  price: number;
  vat: number;
  amount: number;
  currency: string;
  project_id?: string;
  paid_date?: string;
}

export interface PurchaseRecord {
  doc_id: string;
  doc_date: string;
  supplier_name: string;
  sku: string;
  qty: number;
  price: number;
  vat: number;
  amount: number;
  currency: string;
  project_id?: string;
  paid_date?: string;
  expense_type: 'COGS' | 'OPEX';
}

export interface ARAPRecord {
  type: 'AR' | 'AP';
  doc_id: string;
  doc_date: string;
  counterparty_name: string;
  amount: number;
  currency: string;
  due_date: string;
  paid_date?: string;
}

export interface CashflowRecord {
  date: string;
  category: string;
  subcat: string;
  amount: number;
  currency: string;
}

export interface PlanRecord {
  period: string; // YYYY-MM
  metric: 'Revenue' | 'CF_IN' | 'CF_OUT';
  amount: number;
  currency: string;
}

export interface FinancialInstrument {
  id: string;
  name: string;
  rate_annual_percent: number;
  commissions_percent: number;
  other_costs_flat: number;
  repayment: 'annuity' | 'bullet' | 'coupon_only';
}

export interface AdvisorConfig {
  instruments: FinancialInstrument[];
}

// Типы для дайджеста
export type AlertSeverity = 'high' | 'medium' | 'low' | 'info';

export interface CFOAlert {
  id: string;
  title: string;
  severity: AlertSeverity;
  reason: string;
  why_link: string;
  ctaRoute: string;
}

// Типы для AR/AP анализа
export interface AgingBucket {
  range: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface ARAPMetrics {
  dso?: number;
  overdue_share: number;
  total_amount: number;
  aging_buckets: AgingBucket[];
  top_debtors: Array<{
    name: string;
    amount: number;
    days_overdue: number;
  }>;
}

// Типы для План-Факт-Прогноз
export interface PlanFactPoint {
  x: string; // период
  y: number; // значение
}

export interface PlanFactSeries {
  plan: PlanFactPoint[];
  fact: PlanFactPoint[];
  forecast: PlanFactPoint[];
  insights: string[];
}

// Типы для эдвайзера
export interface AdvisorCalculation {
  id: string;
  name: string;
  effectiveRate: number;
  totalCost: number;
  explanation: string;
}

export interface AdvisorRecommendation {
  id: string;
  why: string;
}

export interface AdvisorResult {
  items: AdvisorCalculation[];
  recommendation: AdvisorRecommendation;
}

// Типы для фильтров
export interface DateFilter {
  startDate: string;
  endDate: string;
}

export interface CounterpartyFilter {
  name?: string;
  type?: 'debtor' | 'creditor';
}

// Типы для состояния приложения
export interface AppState {
  profile: UserProfile | null;
  dataFiles: {
    sales?: SalesRecord[];
    purchases?: PurchaseRecord[];
    ar_ap?: ARAPRecord[];
    cashflow?: CashflowRecord[];
    plan?: PlanRecord[];
    advisor?: AdvisorConfig;
  };
  filters: {
    dateRange: DateFilter;
    counterparty?: CounterpartyFilter;
  };
  isLoading: boolean;
  error?: string;
}

// Типы для шаблонов писем
export interface EmailTemplate {
  aging_range: string;
  subject: string;
  body: string;
}

export interface EmailDraft {
  to: string;
  subject: string;
  body: string;
  doc_id: string;
  amount: number;
  days_overdue: number;
}
