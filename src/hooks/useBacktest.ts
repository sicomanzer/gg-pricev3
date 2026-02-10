
import { useState, useEffect } from 'react';
import { StockRecommendation } from '@/data/stockUtils';

export interface BacktestRecord {
    id: string;
    symbol: string;
    entryDate: string;
    recommendationPrice: number; // Price on recommendation day
    entryPrice: number; // Actual entry price (e.g. at open/limit)
    targetPrice: number;
    stopLoss: number;
    status: 'OPEN' | 'WIN' | 'LOSS' | 'HOLD';
    exitPrice?: number;
    exitDate?: string;
    percentChange?: number;
}

const STORAGE_KEY = 'stock_backtest_records';

export function useBacktest() {
    const [records, setRecords] = useState<BacktestRecord[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            setRecords(JSON.parse(saved));
        }
    }, []);

    const saveToHistory = (stock: StockRecommendation) => {
        const newRecord: BacktestRecord = {
            id: crypto.randomUUID(),
            symbol: stock.symbol,
            entryDate: new Date().toISOString(),
            recommendationPrice: stock.currentPrice,
            entryPrice: stock.entryPoint,
            targetPrice: stock.targetPrice,
            stopLoss: stock.stopLoss,
            status: 'OPEN',
        };

        setRecords(prev => {
            // Avoid duplicates for same symbol on same day
            const today = new Date().toISOString().split('T')[0];
            const exists = prev.find(r => r.symbol === stock.symbol && r.entryDate.startsWith(today));
            if (exists) return prev;

            const updated = [newRecord, ...prev];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });

        return newRecord;
    };

    const updateStatus = (id: string, currentPrice: number) => {
        setRecords(prev => {
            const updated = prev.map(record => {
                if (record.id !== id || record.status !== 'OPEN') return record;

                // Check Win/Loss conditions
                if (currentPrice >= record.targetPrice) {
                    return {
                        ...record,
                        status: 'WIN',
                        exitPrice: currentPrice,
                        exitDate: new Date().toISOString(),
                        percentChange: ((currentPrice - record.entryPrice) / record.entryPrice) * 100
                    } as BacktestRecord;
                }

                if (currentPrice <= record.stopLoss) {
                    return {
                        ...record,
                        status: 'LOSS',
                        exitPrice: currentPrice,
                        exitDate: new Date().toISOString(),
                        percentChange: ((currentPrice - record.entryPrice) / record.entryPrice) * 100
                    } as BacktestRecord;
                }

                return record;
            });

            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
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

    const clearHistory = () => {
        setRecords([]);
        localStorage.removeItem(STORAGE_KEY);
    };

    return {
        records,
        saveToHistory,
        updateStatus,
        getStats,
        clearHistory
    };
}
