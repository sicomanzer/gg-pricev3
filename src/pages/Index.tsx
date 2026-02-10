import { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from '@/components/Header';
import { ScannerForm, ScanParams } from '@/components/ScannerForm';
import { StatsCards } from '@/components/StatsCards';
import { StockTable } from '@/components/StockTable';
import { EmptyState } from '@/components/EmptyState';
import { Disclaimer } from '@/components/Disclaimer';
import { NewStockDialog } from '@/components/NewStockDialog';
import { useStockData } from '@/hooks/useStockData';
import { StockRecommendation, convertToRecommendation, filterStocks, sortByScore } from '@/data/stockUtils';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { usePriceAlerts } from '@/hooks/usePriceAlerts';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { BacktestResult } from '@/components/BacktestResult';
import { useBacktest } from '@/hooks/useBacktest';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const playAlertSound = () => {
  if (typeof window === 'undefined') return;
  const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  // Alert sound pattern (beep-beep)
  oscillator.type = 'sine';
  oscillator.frequency.value = 880;

  gain.connect(context.destination);
  oscillator.connect(gain);

  const now = context.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.3, now + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

  oscillator.start(now);
  oscillator.stop(now + 0.6);
};

import { sendTelegramMessage } from '@/lib/telegram';

const Index = () => {
  const [stocks, setStocks] = useState<StockRecommendation[]>([]);
  const [hasScanned, setHasScanned] = useState(false);
  const [currentParams, setCurrentParams] = useState<ScanParams | null>(null);
  const [autoScanEnabled, setAutoScanEnabled] = useState(false);
  const [newStocksFound, setNewStocksFound] = useState<StockRecommendation[]>([]);
  const [showNewStockDialog, setShowNewStockDialog] = useState(false);
  const [countdown, setCountdown] = useState<number>(60);

  const { fetchStockData, isLoading, lastUpdate, error } = useStockData();
  const { alerts, addAlert, removeAlert, getAlert, checkAlerts } = usePriceAlerts();
  const { saveToHistory, updateStatus, records } = useBacktest();
  const previousSymbolsRef = useRef<string[]>([]);
  const hasInitialScanRef = useRef(false);

  // Sound unlock Ref (browser policy)
  const soundUnlocked = useRef(false);

  const handleScan = useCallback(async (params: ScanParams) => {
    setCurrentParams(params);
    // Unlock sound on user interaction (first manual scan)
    if (!soundUnlocked.current) {
      soundUnlocked.current = true;
    }

    const quotes = await fetchStockData(params.market);
    let sorted: StockRecommendation[] = [];
    if (quotes.length > 0) {
      checkAlerts(quotes);
      
      // Update Backtest Status for all active records using the fresh quotes
      // This ensures we track price changes even if we filter the stock from the display list
      const quoteMap = new Map(quotes.map(q => [q.symbol, q.price]));
      records.filter(r => r.status === 'OPEN').forEach(record => {
        const currentPrice = quoteMap.get(record.symbol);
        if (currentPrice !== undefined) {
          updateStatus(record.id, currentPrice);
        }
      });

      const recommendations = quotes.map(convertToRecommendation);
      const filtered = filterStocks(
        recommendations,
        params.minVolume,
        params.riskLevel,
        params.minDividendYield,
        params.isSniperMode
      );
      sorted = sortByScore(filtered);

      // Filter out stocks that are already in active records (OPEN status)
      // This prevents recommending stocks that the user has already bought and are still active
      const activeSymbols = new Set(records.filter(r => r.status === 'OPEN').map(r => r.symbol));
      sorted = sorted.filter(s => !activeSymbols.has(s.symbol));

      setStocks(sorted);

      // Save History
      if (sorted.length > 0) {
        sorted.forEach(stock => saveToHistory(stock));
      }
    } else {
      setStocks([]);
    }

    // Check for new stocks
    if (sorted.length > 0 && hasInitialScanRef.current) {
      const currentSymbols = sorted.map(s => s.symbol);
      const previousSymbols = previousSymbolsRef.current;
      const previousSet = new Set(previousSymbols);

      const newStocksList = sorted.filter(stock => !previousSet.has(stock.symbol));

      if (newStocksList.length > 0) {
        setNewStocksFound(newStocksList);
        setShowNewStockDialog(true);
        playAlertSound();

        // Send Telegram Notification
        const message = newStocksList.map(s => 
            `📊 สัญญาณเทรดใหม่: <b>${s.symbol}</b>\n` +
            `💰 ราคาปัจจุบัน: ฿${s.currentPrice.toFixed(2)}\n` +
            `🛒 ราคาซื้อ: ฿${s.entryPoint.toFixed(2)}\n` +
            `🎯 ราคาเป้าหมาย: ฿${s.targetPrice.toFixed(2)}\n` +
            `🛑 ราคาตัดขาดทุน: ฿${s.stopLoss.toFixed(2)}`
          ).join('\n\n------------------\n\n');
        
        sendTelegramMessage(message);

        toast.success(`พบหุ้นใหม่ ${newStocksList.length} ตัว!`, {
          description: "ตรวจสอบรายละเอียดได้ในหน้าต่างแจ้งเตือน",
          duration: 5000
        });
      }
      previousSymbolsRef.current = currentSymbols;
    } else if (sorted.length > 0) {
      previousSymbolsRef.current = sorted.map(s => s.symbol);
    }

    setHasScanned(true);
    if (!hasInitialScanRef.current) {
      hasInitialScanRef.current = true;
    }
  }, [fetchStockData, checkAlerts, records]);

  useEffect(() => {
    if (!autoScanEnabled || !currentParams) {
      setCountdown(60); // Reset countdown when disabled
      return;
    }
    
    // Immediate scan logic is handled by the user clicking "Scan" which sets autoScanEnabled usually,
    // or if we toggle autoScanEnabled, we might want to start countdown immediately.
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Trigger scan
          handleScan(currentParams);
          return 60; // Reset to 60 seconds
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoScanEnabled, currentParams, handleScan]);

  useEffect(() => {
    if (stocks.length > 0) {
      checkAlerts(stocks.map(s => ({ symbol: s.symbol, price: s.currentPrice })));
    }
  }, [stocks, checkAlerts]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Header />

        <ScannerForm
          onScan={handleScan}
          isLoading={isLoading}
          autoScanEnabled={autoScanEnabled}
          onAutoScanChange={setAutoScanEnabled}
          nextScanIn={countdown}
        />

        {hasScanned && (
          <Tabs defaultValue="results" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
              <TabsTrigger value="results">ผลการสแกน ({stocks.length})</TabsTrigger>
              <TabsTrigger value="history">ประวัติ & Win Rate</TabsTrigger>
            </TabsList>

            <TabsContent value="results" className="space-y-6 mt-6">
              {stocks.length > 0 ? (
                <>
                  <StatsCards stocks={stocks} budget={currentParams?.budget || 100000} />

                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      หุ้นแนะนำ
                      <span className="text-muted-foreground font-normal">
                        ({stocks.length} รายการ)
                      </span>
                      {lastUpdate && (
                        <Badge variant="outline" className="ml-2 text-xs flex items-center gap-1">
                          <Wifi className="w-3 h-3 text-green-500" />
                          Live Data
                        </Badge>
                      )}
                    </h2>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {lastUpdate && (
                        <span className="flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" />
                          อัปเดต: {new Date(lastUpdate).toLocaleTimeString('th-TH')}
                        </span>
                      )}
                      <span>ตลาด: {currentParams?.market}</span>
                    </div>
                  </div>

                  <StockTable
                    stocks={stocks}
                    alerts={alerts}
                    onAddAlert={addAlert}
                    onRemoveAlert={removeAlert}
                    budget={currentParams?.budget}
                  />
                </>
              ) : (
                <div className="glass-card p-12 text-center animate-slide-up">
                  {error ? (
                    <div className="flex flex-col items-center gap-2">
                      <WifiOff className="w-8 h-8 text-destructive" />
                      <p className="text-destructive font-medium">เกิดข้อผิดพลาดในการดึงข้อมูล</p>
                      <p className="text-muted-foreground text-sm">{error}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      ไม่พบหุ้นที่ตรงตามเงื่อนไขที่กำหนด ลองปรับเงื่อนไขใหม่
                    </p>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <BacktestResult />
            </TabsContent>
          </Tabs>
        )}

        {!hasScanned && <EmptyState />}



        <Disclaimer />

        <NewStockDialog
          open={showNewStockDialog}
          onOpenChange={setShowNewStockDialog}
          newStocks={newStocksFound}
          onViewStock={(stock) => {
            setShowNewStockDialog(false);
            // Optionally could scroll to the stock in table or open details
          }}
        />
      </div>
    </div>
  );
};

export default Index;
