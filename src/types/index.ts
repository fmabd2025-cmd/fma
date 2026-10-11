export interface Member {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  shares: number;
  share_value: number;
  role: string;
  status: string;
  joined_date: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  member_id: string | null;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string | null;
  date: string;
  created_at: string;
  member?: Member | null;
}

export interface Investment {
  id: string;
  name: string;
  type: string;
  amount_invested: number;
  current_value: number;
  start_date: string;
  status: string;
  description: string | null;
  created_at: string;
}

export interface CircularSaving {
  id: string;
  name: string;
  cycle_number: number;
  total_amount: number;
  contribution_per_member: number;
  start_date: string | null;
  end_date: string | null;
  status: string;
  created_at: string;
}

export interface CircularContribution {
  id: string;
  circular_id: string;
  member_id: string;
  amount: number;
  contribution_date: string;
  status: string;
  created_at: string;
  member?: Member | null;
  circular?: CircularSaving | null;
}

export type PageId =
  | 'dashboard'
  | 'members'
  | 'transactions'
  | 'investments'
  | 'circular';

export const MEMBER_ROLES = ['member', 'president', 'treasurer', 'secretary'] as const;
export const MEMBER_STATUS = ['active', 'inactive'] as const;
export const TRANSACTION_CATEGORIES = [
  'dues', 'salary', 'rent', 'utilities', 'investment',
  'dividend', 'donation', 'loan', 'repayment', 'other'
] as const;
export const INVESTMENT_TYPES = [
  'fixed_deposit', 'stocks', 'bonds', 'real_estate', 'business', 'other'
] as const;
export const INVESTMENT_STATUS = ['active', 'matured', 'closed', 'loss'] as const;
export const CIRCULAR_STATUS = ['active', 'completed', 'cancelled'] as const;
export const CONTRIBUTION_STATUS = ['paid', 'pending', 'overdue'] as const;
