import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  avgVolume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  marketCap?: number;
  dividendYield?: number;
  rsi?: number;
  macdSignal?: 'bullish' | 'bearish' | 'neutral';
}

export interface StockDataResponse {
  quotes: StockQuote[];
  timestamp: string;
}

export function useStockData() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const fetchStockData = useCallback(async (market?: string, symbols?: string[]): Promise<StockQuote[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('stock-data', {
        body: symbols ? { symbols } : { action: 'scan', market }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setLastUpdate(data.timestamp);
      return data.quotes || [];
    } catch (err: any) {
      const errorMessage = err.message || 'ไม่สามารถดึงข้อมูลหุ้นได้';
      setError(errorMessage);
      toast.error(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    fetchStockData,
    isLoading,
    error,
    lastUpdate
  };
}
