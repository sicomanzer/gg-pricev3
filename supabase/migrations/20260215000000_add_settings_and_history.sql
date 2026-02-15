-- Create stock_settings table for global config like SET100 list
CREATE TABLE IF NOT EXISTS public.stock_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for settings but allow public read for now (simplify for prototype)
ALTER TABLE public.stock_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read settings" ON public.stock_settings
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated update settings" ON public.stock_settings
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert settings" ON public.stock_settings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- Create backtest_records table to replace localStorage
CREATE TABLE IF NOT EXISTS public.backtest_records (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id), -- Optional for now if no auth
    symbol TEXT NOT NULL,
    entry_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    recommendation_price NUMERIC,
    entry_price NUMERIC NOT NULL,
    target_price NUMERIC NOT NULL,
    stop_loss NUMERIC NOT NULL,
    status TEXT CHECK (status IN ('OPEN', 'WIN', 'LOSS')) DEFAULT 'OPEN',
    exit_price NUMERIC,
    exit_date TIMESTAMP WITH TIME ZONE,
    percent_change NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.backtest_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.backtest_records
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON public.backtest_records
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.backtest_records
    FOR UPDATE USING (true);


-- Create stock_fundamentals table for caching real dividend data
CREATE TABLE IF NOT EXISTS public.stock_fundamentals (
    symbol TEXT PRIMARY KEY,
    dividend_yield NUMERIC DEFAULT 0,
    pe_ratio NUMERIC,
    market_cap NUMERIC,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.stock_fundamentals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read fundamentals" ON public.stock_fundamentals
    FOR SELECT USING (true);

CREATE POLICY "Allow service role update fundamentals" ON public.stock_fundamentals
    FOR ALL USING (true); -- Ideally restrict to service role


-- Create portfolios table (Phase 3)
CREATE TABLE IF NOT EXISTS public.portfolios (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    balance NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own portfolios" ON public.portfolios
    FOR ALL USING (auth.uid() = user_id);


-- Create portfolio_transactions table (Phase 3)
CREATE TABLE IF NOT EXISTS public.portfolio_transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    side TEXT CHECK (side IN ('BUY', 'SELL')),
    price NUMERIC NOT NULL,
    quantity NUMERIC NOT NULL,
    fees NUMERIC DEFAULT 0,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.portfolio_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own transactions" ON public.portfolio_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.portfolios
            WHERE id = portfolio_transactions.portfolio_id
            AND user_id = auth.uid()
        )
    );
