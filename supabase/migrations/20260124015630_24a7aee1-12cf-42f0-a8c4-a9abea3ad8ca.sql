-- Create watchlist_items table
CREATE TABLE public.watchlist_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stock_symbol TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, stock_symbol)
);

-- Enable Row Level Security
ALTER TABLE public.watchlist_items ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user owns the watchlist item
CREATE OR REPLACE FUNCTION public.is_watchlist_owner(item_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.watchlist_items
    WHERE id = item_id
      AND user_id = auth.uid()
  )
$$;

-- RLS Policies
CREATE POLICY "Users can view their own watchlist items"
ON public.watchlist_items
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their own watchlist"
ON public.watchlist_items
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watchlist items"
ON public.watchlist_items
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_watchlist_items_user_id ON public.watchlist_items(user_id);
CREATE INDEX idx_watchlist_items_symbol ON public.watchlist_items(stock_symbol);