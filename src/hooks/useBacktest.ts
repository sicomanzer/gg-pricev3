
import { useState, useEffect, useCallback } from 'react';
import { StockRecommendation } from '@/data/stockUtils';
import { StockQuote } from '@/hooks/useStockData';
import { toast } from "sonner";
import { sendTelegramMessage } from '@/lib/telegram';
import { supabase } from "@/integrations/supabase/client";

export interface BacktestRecord {
    id: string;
    symbol: string;
    entryDate: string;
    recommendationPrice: number;
    entryPrice: number;
    targetPrice: number;
    stopLoss: number;
    status: 'OPEN' | 'WIN' | 'LOSS' | 'HOLD';
    exitPrice?: number;
    exitDate?: string;
    percentChange?: number;
}

export function useBacktest() {
    const [records, setRecords] = useState<BacktestRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Load from LocalStorage
    const loadFromLocal = () => {
        try {
            const saved = localStorage.getItem('stock_backtest_records');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error("Error parsing local records", e);
        }
        return [];
    };

    // Save to LocalStorage
    const saveToLocal = (newRecords: BacktestRecord[]) => {
        localStorage.setItem('stock_backtest_records', JSON.stringify(newRecords));
    };

    const fetchRecords = useCallback(async () => {
        setIsLoading(true);
        
        // 1. Load Local first (Immediate UI update)
        const localRecords = loadFromLocal();
        
        // 2. Try Fetch Cloud
        const { data, error } = await supabase
            .from('backtest_records')
            .select('*')
            .order('entry_date', { ascending: false });

        if (!error && data) {
            // Map snake_case DB to camelCase UI
            const cloudRecords: BacktestRecord[] = data.map((r: any) => ({
                id: r.id,
                symbol: r.symbol,
                entryDate: r.entry_date,
                recommendationPrice: r.recommendation_price,
                entryPrice: r.entry_price,
                targetPrice: r.target_price,
                stopLoss: r.stop_loss,
                status: r.status,
                exitPrice: r.exit_price,
                exitDate: r.exit_date,
                percentChange: r.percent_change
            }));

            // Merge Strategy: Prefer Cloud, but keep Local if Cloud fails or is empty (for anon users)
            // For now, let's just use Cloud if available, else Local
            // Or better: Use Cloud + Local (if ID not in Cloud).
            // Since we generate UUIDs, we can merge arrays.
            
            // Simple approach: Use Cloud if data exists, otherwise keep Local
            // Ideally we should sync Local -> Cloud if Cloud is empty but Local has data
            
            setRecords(cloudRecords);
            
            // Sync Cloud to Local backup
            saveToLocal(cloudRecords);
        } else {
            // If Cloud fails, fallback to Local
            setRecords(localRecords);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    const saveScanResults = async (stocks: StockRecommendation[]) => {
        if (stocks.length === 0) return;

        const today = new Date().toISOString().split('T')[0];

        // Filter duplicates
        const uniqueStocks = stocks.filter(stock => {
            const hasRecent = records.some(r =>
                r.symbol === stock.symbol &&
                r.entryDate &&
                r.entryDate.startsWith(today)
            );
            return !hasRecent;
        });

        if (uniqueStocks.length === 0) return;

        // Prepare new records
        const newLocalRecords: BacktestRecord[] = uniqueStocks.map(stock => ({
            id: crypto.randomUUID(), // Generate client-side ID
            symbol: stock.symbol,
            entryDate: new Date().toISOString(),
            recommendationPrice: stock.currentPrice,
            entryPrice: stock.entryPoint,
            targetPrice: stock.targetPrice,
            stopLoss: stock.stopLoss,
            status: 'OPEN'
        }));

        // 1. Save to LocalStorage immediately
        const updatedRecords = [...newLocalRecords, ...records];
        setRecords(updatedRecords);
        saveToLocal(updatedRecords);

        // 2. Try Save to Supabase (Best Effort)
        const dbRecords = newLocalRecords.map(r => ({
            id: r.id,
            symbol: r.symbol,
            entry_date: r.entryDate,
            recommendation_price: r.recommendationPrice,
            entry_price: r.entryPrice,
            target_price: r.targetPrice,
            stop_loss: r.stopLoss,
            status: r.status
        }));

        const { error } = await supabase
            .from('backtest_records')
            .insert(dbRecords);

        if (error) {
            console.warn("Failed to sync history to cloud (saved locally):", error);
            // Don't show error toast, user data is safe locally
        }
    };

    const updateOpenPositions = async (quotes: StockQuote[]) => {
        const quoteMap = new Map(quotes.map(q => [q.symbol, q.price]));
        const openRecords = records.filter(r => r.status === 'OPEN');

        if (openRecords.length === 0) return;

        let hasUpdates = false;
        let updatedRecords = [...records];

        for (const record of openRecords) {
            const currentPrice = quoteMap.get(record.symbol);
            if (currentPrice === undefined) continue;

            let newStatus: 'WIN' | 'LOSS' | null = null;

            if (currentPrice >= record.targetPrice) newStatus = 'WIN';
            else if (currentPrice <= record.stopLoss) newStatus = 'LOSS';

            if (newStatus) {
                hasUpdates = true;
                const percentChange = ((currentPrice - record.entryPrice) / record.entryPrice) * 100;
                const exitDate = new Date().toISOString();

                // Notification
                const profitText = newStatus === 'WIN' ? '✅ TAKE PROFIT' : '🛑 STOP LOSS';
                const message = `<b>${profitText} HIT!</b>\n\n` +
                    `<b>${record.symbol}</b>\n` +
                    `Entry: ${record.entryPrice.toFixed(2)}\n` +
                    `Exit: ${currentPrice.toFixed(2)}\n` +
                    `${newStatus === 'WIN' ? 'Profit' : 'Loss'}: ${percentChange > 0 ? '+' : ''}${percentChange.toFixed(2)}%`;

                sendTelegramMessage(message);

                if (newStatus === 'WIN') toast.success(`Take Profit: ${record.symbol}`);
                else toast.error(`Stop Loss: ${record.symbol}`);

                // 1. Update Local State & Storage
                updatedRecords = updatedRecords.map(r => 
                    r.id === record.id 
                    ? { ...r, status: newStatus!, exitPrice: currentPrice, exitDate, percentChange } 
                    : r
                );

                // 2. Update DB (Best Effort)
                await supabase
                    .from('backtest_records')
                    .update({
                        status: newStatus,
                        exit_price: currentPrice,
                        exit_date: exitDate,
                        percent_change: percentChange
                    })
                    .eq('id', record.id);
            }
        }

        if (hasUpdates) {
            setRecords(updatedRecords);
            saveToLocal(updatedRecords);
        }
    };

    const clearHistory = async () => {
        // 1. Clear Local
        setRecords([]);
        localStorage.removeItem('stock_backtest_records');

        // 2. Clear Cloud
        const { error } = await supabase
            .from('backtest_records')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (!error) {
            toast.success("ล้างประวัติเรียบร้อย");
        } else {
            // Even if cloud fail, local is cleared
            toast.success("ล้างประวัติในเครื่องเรียบร้อย");
        }
    };

    const getStats = () => {
        const closedTrades = records.filter(r => r.status === 'WIN' || r.status === 'LOSS');
        const wins = closedTrades.filter(r => r.status === 'WIN').length;
        const losses = closedTrades.filter(r => r.status === 'LOSS').length;
        const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;

        return {
            total: records.length,
            active: records.filter(r => r.status === 'OPEN').length,
            wins,
            losses,
            winRate
        };
    };

    return {
        records,
        saveScanResults,
        updateOpenPositions,
        getStats,
        clearHistory,
        isLoading
    };
}
