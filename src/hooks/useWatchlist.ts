import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface WatchlistItem {
  id: string;
  stock_symbol: string;
  created_at: string;
}

export function useWatchlist() {
  const { user, isAuthenticated } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWatchlist = async () => {
    if (!isAuthenticated) {
      setWatchlist([]);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('watchlist_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setWatchlist(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchWatchlist();
  }, [isAuthenticated, user]);

  const addToWatchlist = async (stockSymbol: string) => {
    if (!user) {
      return { error: { message: 'กรุณาเข้าสู่ระบบก่อน' } };
    }

    const { data, error } = await supabase
      .from('watchlist_items')
      .insert({
        user_id: user.id,
        stock_symbol: stockSymbol,
      })
      .select()
      .single();

    if (!error && data) {
      setWatchlist((prev) => [data, ...prev]);
    }

    return { data, error };
  };

  const removeFromWatchlist = async (stockSymbol: string) => {
    if (!user) {
      return { error: { message: 'กรุณาเข้าสู่ระบบก่อน' } };
    }

    const { error } = await supabase
      .from('watchlist_items')
      .delete()
      .eq('user_id', user.id)
      .eq('stock_symbol', stockSymbol);

    if (!error) {
      setWatchlist((prev) => prev.filter((item) => item.stock_symbol !== stockSymbol));
    }

    return { error };
  };

  const isInWatchlist = (stockSymbol: string) => {
    return watchlist.some((item) => item.stock_symbol === stockSymbol);
  };

  return {
    watchlist,
    loading,
    error,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    refetch: fetchWatchlist,
  };
}
