/*
# FMA 2025 — Core Schema for Friends Multipurpose Association

## Overview
Creates the full data model for the association management system: members/shareholders,
financial transactions, investments, and circular savings cycles with their contributions.
This is a single-tenant app with no sign-in screen, so all policies allow anon + authenticated.

## New Tables

### members
Association members and their shareholding information.
- id (uuid, PK)
- name (text, not null) — full name of the member
- email (text) — contact email
- phone (text) — phone number
- address (text) — home address
- shares (integer, default 0) — number of shares held
- share_value (numeric, default 0) — value per share in BDT
- role (text, default 'member') — member/president/treasurer/secretary
- status (text, default 'active') — active/inactive
- joined_date (date) — when the member joined
- created_at (timestamptz)

### transactions
Financial ledger entries for the association.
- id (uuid, PK)
- member_id (uuid, nullable, FK to members) — optional link to a member
- type (text, not null) — income/expense
- category (text, not null) — dues/salary/rent/utilities/investment/dividend/donation/other
- amount (numeric, not null) — transaction amount in BDT
- description (text)
- date (date, not null) — transaction date
- created_at (timestamptz)

### investments
Investment portfolio entries.
- id (uuid, PK)
- name (text, not null) — investment name/title
- type (text, not null) — fixed_deposit/stocks/bonds/real_estate/business/other
- amount_invested (numeric, not null) — initial investment in BDT
- current_value (numeric, default 0) — current valuation in BDT
- start_date (date, not null)
- status (text, default 'active') — active/matured/closed/loss
- description (text)
- created_at (timestamptz)

### circular_savings
Circular savings / contribution cycles.
- id (uuid, PK)
- name (text, not null) — cycle name
- cycle_number (integer, default 1)
- total_amount (numeric, default 0) — target total for the cycle
- contribution_per_member (numeric, default 0) — monthly per-member contribution
- start_date (date)
- end_date (date)
- status (text, default 'active') — active/completed/cancelled
- created_at (timestamptz)

### circular_contributions
Individual member contributions toward a circular savings cycle.
- id (uuid, PK)
- circular_id (uuid, FK to circular_savings) — which cycle this belongs to
- member_id (uuid, FK to members) — which member contributed
- amount (numeric, not null)
- contribution_date (date, not null)
- status (text, default 'paid') — paid/pending/overdue
- created_at (timestamptz)

## Security
- RLS enabled on every table.
- All policies use TO anon, authenticated with USING (true) / WITH CHECK (true) because
  this is a single-tenant shared management app with no sign-in screen.
*/

-- Members table
CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  address text,
  shares integer NOT NULL DEFAULT 0,
  share_value numeric NOT NULL DEFAULT 0,
  role text NOT NULL DEFAULT 'member',
  status text NOT NULL DEFAULT 'active',
  joined_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_members" ON members;
CREATE POLICY "anon_select_members" ON members FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_members" ON members;
CREATE POLICY "anon_insert_members" ON members FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_members" ON members;
CREATE POLICY "anon_update_members" ON members FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_members" ON members;
CREATE POLICY "anon_delete_members" ON members FOR DELETE
  TO anon, authenticated USING (true);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  category text NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  description text,
  date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_transactions" ON transactions;
CREATE POLICY "anon_select_transactions" ON transactions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_transactions" ON transactions;
CREATE POLICY "anon_insert_transactions" ON transactions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_transactions" ON transactions;
CREATE POLICY "anon_update_transactions" ON transactions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_transactions" ON transactions;
CREATE POLICY "anon_delete_transactions" ON transactions FOR DELETE
  TO anon, authenticated USING (true);

-- Investments table
CREATE TABLE IF NOT EXISTS investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  amount_invested numeric NOT NULL CHECK (amount_invested >= 0),
  current_value numeric NOT NULL DEFAULT 0 CHECK (current_value >= 0),
  start_date date NOT NULL,
  status text NOT NULL DEFAULT 'active',
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_investments" ON investments;
CREATE POLICY "anon_select_investments" ON investments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_investments" ON investments;
CREATE POLICY "anon_insert_investments" ON investments FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_investments" ON investments;
CREATE POLICY "anon_update_investments" ON investments FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_investments" ON investments;
CREATE POLICY "anon_delete_investments" ON investments FOR DELETE
  TO anon, authenticated USING (true);

-- Circular savings table
CREATE TABLE IF NOT EXISTS circular_savings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cycle_number integer NOT NULL DEFAULT 1,
  total_amount numeric NOT NULL DEFAULT 0,
  contribution_per_member numeric NOT NULL DEFAULT 0,
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE circular_savings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_circular_savings" ON circular_savings;
CREATE POLICY "anon_select_circular_savings" ON circular_savings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_circular_savings" ON circular_savings;
CREATE POLICY "anon_insert_circular_savings" ON circular_savings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_circular_savings" ON circular_savings;
CREATE POLICY "anon_update_circular_savings" ON circular_savings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_circular_savings" ON circular_savings;
CREATE POLICY "anon_delete_circular_savings" ON circular_savings FOR DELETE
  TO anon, authenticated USING (true);

-- Circular contributions table
CREATE TABLE IF NOT EXISTS circular_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circular_id uuid NOT NULL REFERENCES circular_savings(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount >= 0),
  contribution_date date NOT NULL,
  status text NOT NULL DEFAULT 'paid',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE circular_contributions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_circular_contributions" ON circular_contributions;
CREATE POLICY "anon_select_circular_contributions" ON circular_contributions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_circular_contributions" ON circular_contributions;
CREATE POLICY "anon_insert_circular_contributions" ON circular_contributions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_circular_contributions" ON circular_contributions;
CREATE POLICY "anon_update_circular_contributions" ON circular_contributions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_circular_contributions" ON circular_contributions;
CREATE POLICY "anon_delete_circular_contributions" ON circular_contributions FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_member_id ON transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_circular_contributions_circular_id ON circular_contributions(circular_id);
CREATE INDEX IF NOT EXISTS idx_circular_contributions_member_id ON circular_contributions(member_id);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
