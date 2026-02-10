
import { useState, useEffect } from 'react';
import { Calculator, AlertTriangle, checkCircle2, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface RiskCalculatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stockSymbol: string;
  entryPrice: number;
  suggestedStopLoss: number;
  budget?: number; // Optional budget passed from parent
}

export function RiskCalculatorDialog({
  open,
  onOpenChange,
  stockSymbol,
  entryPrice,
  suggestedStopLoss,
  budget = 100000
}: RiskCalculatorDialogProps) {
  const [accountBalance, setAccountBalance] = useState(budget);
  const [riskPercentage, setRiskPercentage] = useState(2); // Default 2% risk
  const [customStopLoss, setCustomStopLoss] = useState(suggestedStopLoss);

  // Reset state when opening a new stock
  useEffect(() => {
    if (open) {
      setCustomStopLoss(suggestedStopLoss);
      setAccountBalance(budget);
      setRiskPercentage(2); // Reset to default safe 2%
    }
  }, [open, stockSymbol, suggestedStopLoss, budget]);

  // Calculations
  const riskAmount = (accountBalance * riskPercentage) / 100;
  const riskPerShare = Math.max(0.01, entryPrice - customStopLoss);
  const maxShares = Math.floor(riskAmount / riskPerShare);
  const totalInvestment = maxShares * entryPrice;
  const isOverBudget = totalInvestment > accountBalance;
  
  // Odd lot adjustment (round down to nearest 100 if possible for Thai stocks logic, but let's keep it simple or strictly 100s)
  // Typically SET stocks trade in board lots of 100.
  const boardLotShares = Math.floor(maxShares / 100) * 100;
  const boardLotInvestment = boardLotShares * entryPrice;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] glass-card border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calculator className="w-5 h-5 text-primary" />
            คำนวณขนาดไม้ (Position Sizing)
          </DialogTitle>
          <DialogDescription>
            วางแผนการเทรด {stockSymbol} ที่ราคา ฿{entryPrice.toFixed(2)} อย่างปลอดภัย
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Account & Risk Settings */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="balance">เงินทุนในพอร์ต</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="balance"
                    type="number"
                    value={accountBalance}
                    onChange={(e) => setAccountBalance(Number(e.target.value))}
                    className="pl-9 bg-muted/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stopLoss">จุดตัดขาดทุน (Stop Loss)</Label>
                <Input
                  id="stopLoss"
                  type="number"
                  step="0.01"
                  value={customStopLoss}
                  onChange={(e) => setCustomStopLoss(Number(e.target.value))}
                  className="bg-muted/50 text-destructive font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>ความเสี่ยงที่ยอมรับได้ (Risk %)</Label>
                <span className="text-sm font-medium text-primary">{riskPercentage}% ({Math.round(riskAmount).toLocaleString()} บาท)</span>
              </div>
              <Slider
                value={[riskPercentage]}
                min={0.5}
                max={5}
                step={0.5}
                onValueChange={(vals) => setRiskPercentage(vals[0])}
                className="py-4"
              />
              <p className="text-xs text-muted-foreground">
                *แนะนำ 1-2% สำหรับมือใหม่ ไม่ควรเกิน 5%
              </p>
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Results */}
          <div className="grid grid-cols-2 gap-4">
             <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center text-center">
                <span className="text-sm text-muted-foreground mb-1">จำนวนหุ้นที่ควรซื้อ (Board Lot)</span>
                <span className="text-3xl font-bold text-primary">{boardLotShares.toLocaleString()}</span>
                <span className="text-xs text-primary/70 mt-1">หุ้น</span>
             </div>
             
             <div className="p-4 rounded-xl bg-muted/50 border border-border/50 flex flex-col justify-center space-y-2">
                <div className="flex justify-between text-sm">
                   <span className="text-muted-foreground">เงินลงทุนรวม:</span>
                   <span className="font-medium">{boardLotInvestment.toLocaleString()} บาท</span>
                </div>
                <div className="flex justify-between text-sm">
                   <span className="text-muted-foreground">ความเสี่ยงจริง:</span>
                   <span className="font-medium text-destructive">
                      -{(boardLotShares * (entryPrice - customStopLoss)).toLocaleString()} บาท
                   </span>
                </div>
                <div className="flex justify-between text-sm">
                   <span className="text-muted-foreground">% ของพอร์ต:</span>
                   <span className="font-medium">
                      {((boardLotInvestment / accountBalance) * 100).toFixed(1)}%
                   </span>
                </div>
             </div>
          </div>

           {boardLotShares === 0 && (
              <div className="flex items-center gap-2 text-yellow-500 bg-yellow-500/10 p-3 rounded-lg text-sm">
                 <AlertTriangle className="w-4 h-4" />
                 <span>ความเสี่ยงต่ำเกินไป หรือ Stop Loss แคบเกินไป ไม่สามารถซื้อหุ้นได้ครบ 100 หุ้น</span>
              </div>
           )}
        </div>

        <DialogFooter className="sm:justify-start">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            ปิดหน้าต่าง
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
