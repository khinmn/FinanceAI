// ─────────────────────────────────────────────────────────────────────────────
// Global TypeScript types for FinanceAI
// ─────────────────────────────────────────────────────────────────────────────

// ── Auth ─────────────────────────────────────────────────────────────────────
export interface User {
  id: number;
  email: string;
  name: string;
  is_active: boolean;
  created_at: string;
  has_business: boolean;
}

export interface Business {
  id: number;
  user_id: number;
  business_name: string;
  industry: string;
  description: string | null;
  currency: string;
  currency_name: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  business: Business | null;
  access_token: string;
  refresh_token: string;
}

// ── Category ──────────────────────────────────────────────────────────────────
export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  color: string;
  is_default: boolean;
}

// ── Transaction ───────────────────────────────────────────────────────────────
export type TransactionType = 'income' | 'expense';
export type PaymentMethod = 'cash' | 'bank' | 'card' | 'mobile' | 'other';

export interface Transaction {
  id: number;
  user_id: number;
  category_id: number | null;
  category_name: string;
  category_color: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  payment_method: PaymentMethod;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionFormData {
  type: TransactionType;
  amount: string;
  description: string;
  date: string;
  category_id: number | null;
  payment_method: PaymentMethod;
  note: string;
}

export interface Pagination {
  page: number;
  per_page: number;
  total: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export interface DashboardSummary {
  period: { month: number; year: number };
  total_income: number;
  total_expense: number;
  net_balance: number;
  savings_rate: number;
  expense_ratio: number;
  transaction_count: number;
  income_count: number;
  expense_count: number;
  income_change_pct: number | null;
  expense_change_pct: number | null;
  currency: string;
}

export interface MonthlyChartData {
  month: string;
  year: number;
  month_num: number;
  income: number;
  expense: number;
  net: number;
}

export interface CategoryChartData {
  name: string;
  color: string;
  amount: number;
  percentage: number;
}

// ── Gap Analysis ──────────────────────────────────────────────────────────────
export type Severity = 'high' | 'medium' | 'low';
export type HealthStatus = 'good' | 'fair' | 'warning' | 'critical' | 'unknown';

export interface GapFinding {
  rule_id: string;
  title: string;
  description: string;
  severity: Severity;
  metric: string;
  recommendation: string;
}

export interface GapAnalysisResult {
  id: number;
  generated_at: string;
  period_start: string | null;
  period_end: string | null;
  rule_findings: GapFinding[];
  ai_explanation: string | null;
  overall_health: HealthStatus;
  finding_count: number;
}

// ── Chat ──────────────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: number;
  session_id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ChatSession {
  id: number;
  title: string;
  message_count: number;
  created_at: string;
  updated_at: string;
  messages?: ChatMessage[];
}

// ── Reports ───────────────────────────────────────────────────────────────────
export interface CategoryReportItem {
  name: string;
  color: string;
  total: number;
  count: number;
  percentage: number;
}

export interface MonthlyReport {
  period: { month: number; year: number };
  total_income: number;
  total_expense: number;
  net_balance: number;
  income_by_category: CategoryReportItem[];
  expense_by_category: CategoryReportItem[];
  transactions: Transaction[];
  currency: string;
}

export interface CashflowItem {
  period: string;
  month: number;
  year: number;
  income: number;
  expense: number;
  net_cashflow: number;
  cumulative: number;
}

// ── API response wrappers ─────────────────────────────────────────────────────
export interface ApiError {
  error: string;
}
