import { useEffect, useRef, useState } from 'react';
import {
  CandlestickData,
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  createChart,
  HistogramSeries,
  IChartApi,
  Time,
} from 'lightweight-charts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CandlestickChartProps {
  symbol: string;
  name: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CandlestickChart({ symbol, name, isOpen, onClose }: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistoricalData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('stock-data', {
        body: { action: 'historical', symbol }
      });

      if (fnError) throw fnError;
      
      if (data?.candles && data.candles.length > 0) {
        setCandles(data.candles);
      } else {
        setError('ไม่พบข้อมูลราคาย้อนหลัง');
      }
    } catch (err: any) {
      console.error('Error fetching historical data:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && symbol) {
      fetchHistoricalData();
    }
    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [isOpen, symbol]);

  useEffect(() => {
    if (!chartContainerRef.current || candles.length === 0 || !isOpen) return;

    // Clean up previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'hsl(var(--foreground))',
      },
      grid: {
        vertLines: { color: 'hsl(var(--border) / 0.3)' },
        horzLines: { color: 'hsl(var(--border) / 0.3)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      crosshair: {
        mode: CrosshairMode.Magnet,
      },
      rightPriceScale: {
        borderColor: 'hsl(var(--border))',
      },
      timeScale: {
        borderColor: 'hsl(var(--border))',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    const formattedData: CandlestickData<Time>[] = candles.map(c => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    candlestickSeries.setData(formattedData);

    // Add volume series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#3b82f6',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    const volumeData = candles.map(c => ({
      time: c.time as Time,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)',
    }));

    volumeSeries.setData(volumeData);

    chart.timeScale().fitContent();
    chartRef.current = chart;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [candles, isOpen]);

  const latestCandle = candles[candles.length - 1];
  const firstCandle = candles[0];
  const priceChange = latestCandle && firstCandle 
    ? ((latestCandle.close - firstCandle.close) / firstCandle.close) * 100 
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold">{symbol}</span>
              <span className="text-muted-foreground font-normal text-base">{name}</span>
              {latestCandle && (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg">฿{latestCandle.close.toFixed(2)}</span>
                  <span className={`flex items-center gap-1 text-sm ${priceChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {priceChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={fetchHistoricalData} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {isLoading && (
            <div className="flex items-center justify-center h-[400px]">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">กำลังโหลดข้อมูล...</span>
            </div>
          )}

          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center h-[400px] text-destructive">
              <p>{error}</p>
              <Button variant="outline" onClick={fetchHistoricalData} className="mt-4">
                ลองใหม่
              </Button>
            </div>
          )}

          {!isLoading && !error && candles.length > 0 && (
            <>
              <div ref={chartContainerRef} className="w-full" />
              <div className="flex justify-between mt-4 text-sm text-muted-foreground">
                <span>ข้อมูลย้อนหลัง 1 เดือน ({candles.length} วัน)</span>
                <span>แหล่งข้อมูล: Yahoo Finance</span>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}