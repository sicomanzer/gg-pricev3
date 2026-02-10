import { useState } from 'react';
import { StockRecommendation } from '@/data/stockUtils';
import { TrendingUp, TrendingDown, Activity, Clock, Target, BarChart3, Bell, BellRing, Calculator } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CandlestickChart } from './CandlestickChart';
import { WatchlistButton } from './WatchlistButton';
import { SetAlertDialog } from './SetAlertDialog';
import { RiskCalculatorDialog } from './RiskCalculatorDialog';
import { PriceAlert } from '@/hooks/usePriceAlerts';

interface StockTableProps {
  stocks: StockRecommendation[];
  alerts?: PriceAlert[];
  onAddAlert?: (symbol: string, price: number, condition: 'above' | 'below') => void;
  onRemoveAlert?: (symbol: string) => void;
  budget?: number; // Added budget prop
}

export function StockTable({ stocks, alerts = [], onAddAlert, onRemoveAlert, budget = 100000 }: StockTableProps) {
  const [selectedStock, setSelectedStock] = useState<{ symbol: string; name: string } | null>(null);
  const [alertStock, setAlertStock] = useState<{ symbol: string; currentPrice: number } | null>(null);
  const [riskCalcStock, setRiskCalcStock] = useState<{ symbol: string; entryPrice: number; stopLoss: number } | null>(null);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('th-TH').format(num);
  };

  const formatVolume = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(0)}M`;
    }
    return formatNumber(num);
  };

  const getMomentumColor = (momentum: string) => {
    switch (momentum) {
      case 'strong': return 'bullish-badge';
      case 'moderate': return 'neutral-badge';
      default: return 'bearish-badge';
    }
  };

  const getVolatilityColor = (volatility: string) => {
    switch (volatility) {
      case 'low': return 'text-success';
      case 'medium': return 'text-warning';
      default: return 'text-destructive';
    }
  };

  const calculateProfitPercent = (entry: number, target: number) => {
    return (((target - entry) / entry) * 100).toFixed(1);
  };

  const calculateLossPercent = (entry: number, stopLoss: number) => {
    return (((entry - stopLoss) / entry) * 100).toFixed(1);
  };

  const getAlertForStock = (symbol: string) => {
    return alerts.find(a => a.symbol === symbol && a.isActive);
  };

  return (
    <>
      <div className="glass-card overflow-hidden animate-slide-up">
        <div className="overflow-x-auto scrollbar-thin">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium">หุ้น</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right">ราคาปัจจุบัน</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right">จุดซื้อ</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right">เป้าหมาย</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right">Stop Loss</TableHead>
                <TableHead className="text-muted-foreground font-medium text-center">ปันผล (%)</TableHead>
                <TableHead className="text-muted-foreground font-medium text-center">R:R</TableHead>
                <TableHead className="text-muted-foreground font-medium">Indicators</TableHead>
                <TableHead className="text-muted-foreground font-medium">เหตุผล</TableHead>
                <TableHead className="text-muted-foreground font-medium text-center">กราฟ</TableHead>
                <TableHead className="text-muted-foreground font-medium text-center">MM</TableHead>
                <TableHead className="text-muted-foreground font-medium text-center">แจ้งเตือน</TableHead>
                <TableHead className="text-muted-foreground font-medium text-center">Watchlist</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stocks.map((stock, index) => {
                const activeAlert = getAlertForStock(stock.symbol);
                return (
                  <TableRow
                    key={stock.symbol}
                    className="table-row-hover border-border/30"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{stock.symbol}</span>
                        <span className="text-xs text-muted-foreground">{stock.name}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={getMomentumColor(stock.momentum)}>
                            <Activity className="w-3 h-3 mr-1" />
                            {stock.momentum === 'strong' ? 'แรง' : stock.momentum === 'moderate' ? 'ปานกลาง' : 'อ่อน'}
                          </Badge>
                          <span className={`text-xs ${getVolatilityColor(stock.volatility)}`}>
                            Vol: {stock.volatility === 'low' ? 'ต่ำ' : stock.volatility === 'medium' ? 'กลาง' : 'สูง'}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-right font-mono">
                      <span className="text-foreground font-medium">฿{stock.currentPrice.toFixed(2)}</span>
                    </TableCell>

                    <TableCell className="text-right font-mono">
                      <span className="text-primary">฿{stock.entryPoint.toFixed(2)}</span>
                    </TableCell>

                    <TableCell className="text-right font-mono">
                      <div className="flex flex-col items-end">
                        <span className="text-success font-medium">฿{stock.targetPrice.toFixed(2)}</span>
                        <span className="text-xs text-success/70 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          +{calculateProfitPercent(stock.entryPoint, stock.targetPrice)}%
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right font-mono">
                      <div className="flex flex-col items-end">
                        <span className="text-destructive font-medium">฿{stock.stopLoss.toFixed(2)}</span>
                        <span className="text-xs text-destructive/70 flex items-center gap-1">
                          <TrendingDown className="w-3 h-3" />
                          -{calculateLossPercent(stock.entryPoint, stock.stopLoss)}%
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-center font-mono">
                      <span className={stock.dividendYield > 0 ? "text-success" : "text-muted-foreground"}>
                        {stock.dividendYield > 0 ? `${stock.dividendYield.toFixed(2)}%` : "-"}
                      </span>
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge variant="outline" className="neutral-badge font-mono">
                        <Target className="w-3 h-3 mr-1" />
                        {stock.riskReward}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" />
                        {stock.holdingPeriod}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className={stock.indicators.macd === 'bullish' ? 'bullish-badge' : stock.indicators.macd === 'bearish' ? 'bearish-badge' : 'neutral-badge'}>
                          MACD {stock.indicators.macd === 'bullish' ? '↑' : stock.indicators.macd === 'bearish' ? '↓' : '–'}
                        </Badge>
                        <Badge variant="outline" className={stock.indicators.rsi > 70 ? 'bearish-badge' : stock.indicators.rsi < 30 ? 'bullish-badge' : 'neutral-badge'}>
                          RSI {stock.indicators.rsi}
                        </Badge>
                        <Badge variant="outline" className="bullish-badge">
                          Vol +{stock.indicators.volumeChange}%
                        </Badge>
                      </div>
                      <div className="flex gap-1 mt-1">
                        {stock.indicators.aboveMA20 && (
                          <span className="text-xs text-success">✓ MA20</span>
                        )}
                        {stock.indicators.aboveMA50 && (
                          <span className="text-xs text-success">✓ MA50</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="max-w-[200px]">
                      <div className="flex flex-col">
                        <Badge variant="outline" className="neutral-badge w-fit mb-1">
                          {stock.chartPattern}
                        </Badge>
                        <span className="text-xs text-muted-foreground line-clamp-2">
                          {stock.technicalSetup}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedStock({ symbol: stock.symbol, name: stock.name })}
                        className="hover:bg-primary/10"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                    </TableCell>

                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        title="คำนวณ Money Management (MM)"
                        onClick={() => setRiskCalcStock({
                          symbol: stock.symbol,
                          entryPrice: stock.entryPoint,
                          stopLoss: stock.stopLoss
                        })}
                        className="hover:bg-primary/10 text-blue-400"
                      >
                        <Calculator className="w-4 h-4" />
                      </Button>
                    </TableCell>

                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAlertStock({ symbol: stock.symbol, currentPrice: stock.currentPrice })}
                        className={`hover:bg-primary/10 ${activeAlert ? 'text-yellow-500' : 'text-muted-foreground'}`}
                      >
                        {activeAlert ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                      </Button>
                    </TableCell>

                    <TableCell className="text-center">
                      <WatchlistButton stockSymbol={stock.symbol} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {selectedStock && (
        <CandlestickChart
          symbol={selectedStock.symbol}
          name={selectedStock.name}
          isOpen={!!selectedStock}
          onClose={() => setSelectedStock(null)}
        />
      )}

      {alertStock && (
        <SetAlertDialog
          open={!!alertStock}
          onOpenChange={(open) => !open && setAlertStock(null)}
          symbol={alertStock.symbol}
          currentPrice={alertStock.currentPrice}
          existingAlert={getAlertForStock(alertStock.symbol)}
          onSave={(symbol, price, condition) => {
            onAddAlert?.(symbol, price, condition);
            setAlertStock(null);
          }}
          onRemove={(symbol) => {
            onRemoveAlert?.(symbol);
            setAlertStock(null);
          }}
        />
      )}

      {riskCalcStock && (
        <RiskCalculatorDialog
          open={!!riskCalcStock}
          onOpenChange={(open) => !open && setRiskCalcStock(null)}
          stockSymbol={riskCalcStock.symbol}
          entryPrice={riskCalcStock.entryPrice}
          suggestedStopLoss={riskCalcStock.stopLoss}
          budget={budget}
        />
      )}
    </>
  );
}

