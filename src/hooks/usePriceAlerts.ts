import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface PriceAlert {
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  isActive: boolean;
}

const STORAGE_KEY = 'stock_price_alerts';

export function usePriceAlerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);

  // Load alerts from local storage on mount
  useEffect(() => {
    const savedAlerts = localStorage.getItem(STORAGE_KEY);
    if (savedAlerts) {
      try {
        setAlerts(JSON.parse(savedAlerts));
      } catch (e) {
        console.error('Failed to parse alerts', e);
      }
    }
  }, []);

  // Save alerts to local storage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  }, [alerts]);

  const addAlert = useCallback((symbol: string, targetPrice: number, condition: 'above' | 'below') => {
    setAlerts(prev => {
      // Remove existing alert for this symbol if any (assuming 1 alert per symbol for simplicity, or allow multiple?)
      // Let's allow only 1 alert per symbol for now to keep UI simple
      const filtered = prev.filter(a => a.symbol !== symbol);
      const newAlert: PriceAlert = {
        symbol,
        targetPrice,
        condition,
        isActive: true
      };
      toast.success(`ตั้งเตือน ${symbol} ที่ราคา ${targetPrice}`);
      return [...filtered, newAlert];
    });
  }, []);

  const removeAlert = useCallback((symbol: string) => {
    setAlerts(prev => prev.filter(a => a.symbol !== symbol));
    toast.info(`ยกเลิกการแจ้งเตือน ${symbol}`);
  }, []);

  const getAlert = useCallback((symbol: string) => {
    return alerts.find(a => a.symbol === symbol);
  }, [alerts]);

  const checkAlerts = useCallback((quotes: { symbol: string, price: number }[]) => {
    let triggeredCount = 0;
    
    setAlerts(prevAlerts => {
      const nextAlerts = prevAlerts.map(alert => {
        if (!alert.isActive) return alert;

        const quote = quotes.find(q => q.symbol === alert.symbol);
        // Note: quotes/recommendations might use different casing or formatting, but usually it's consistent.
        if (!quote) return alert;

        let triggered = false;
        if (alert.condition === 'above' && quote.price >= alert.targetPrice) {
          triggered = true;
        } else if (alert.condition === 'below' && quote.price <= alert.targetPrice) {
          triggered = true;
        }

        if (triggered) {
          triggeredCount++;
          // Show notification
          toast.success(`แจ้งเตือนราคา: ${alert.symbol}`, {
            description: `ราคาเดินทางถึงเป้าหมาย ${alert.targetPrice} บาทแล้ว (ราคาปัจจุบัน: ${quote.price})`,
            duration: 10000, // Show for 10 seconds
          });
          
          // Deactivate alert after trigger
          return { ...alert, isActive: false };
        }

        return alert;
      });
      
      // Only update state if something changed to avoid infinite loops if used in effect
      // JSON.stringify comparison is a simple way to check deep equality for small objects
      if (JSON.stringify(prevAlerts) !== JSON.stringify(nextAlerts)) {
        return nextAlerts;
      }
      return prevAlerts;
    });

    return triggeredCount;
  }, []);

  return {
    alerts,
    addAlert,
    removeAlert,
    getAlert,
    checkAlerts
  };
}
