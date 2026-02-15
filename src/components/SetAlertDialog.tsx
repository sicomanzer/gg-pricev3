import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PriceAlert } from "@/hooks/usePriceAlerts";

interface SetAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  symbol: string;
  currentPrice: number;
  existingAlert?: PriceAlert;
  onSave: (symbol: string, price: number, condition: 'above' | 'below') => void;
  onRemove: (symbol: string) => void;
}

export function SetAlertDialog({
  open,
  onOpenChange,
  symbol,
  currentPrice,
  existingAlert,
  onSave,
  onRemove
}: SetAlertDialogProps) {
  const [price, setPrice] = useState<string>(currentPrice.toString());
  const [condition, setCondition] = useState<'above' | 'below'>('above');

  useEffect(() => {
    if (open) {
      if (existingAlert) {
        setPrice(existingAlert.targetPrice.toString());
        setCondition(existingAlert.condition);
      } else {
        setPrice(currentPrice.toString());
        // Auto-select condition based on current price vs default input
        setCondition('above');
      }
    }
  }, [open, currentPrice, existingAlert]);

  const handleSave = () => {
    const targetPrice = parseFloat(price);
    if (isNaN(targetPrice)) return;
    
    // Auto-detect condition if user didn't explicitly check (optional logic, but let's stick to explicit first)
    // Actually, logic: if target > current, condition usually 'above'. If target < current, 'below'.
    // Let's force the user to choose or infer it? 
    // Inferring is better UX.
    let finalCondition = condition;
    if (targetPrice > currentPrice) finalCondition = 'above';
    if (targetPrice < currentPrice) finalCondition = 'below';

    onSave(symbol, targetPrice, finalCondition);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>ตั้งเตือนราคา {symbol}</DialogTitle>
          <DialogDescription>
            ราคาปัจจุบัน: {currentPrice.toLocaleString()} บาท
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">
              ราคาเป้าหมาย
            </Label>
            <Input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="col-span-3"
            />
          </div>
          {/* We can hide condition selection and infer it, or show it. Let's show it for clarity */}
          {/* Actually, let's infer it to simplify UI, but display what will happen */}
          <div className="text-sm text-muted-foreground text-center">
            {price && !isNaN(parseFloat(price)) ? (
              parseFloat(price) > currentPrice ? (
                <span className="text-green-500">แจ้งเตือนเมื่อราคาขึ้นไปถึง {price}</span>
              ) : parseFloat(price) < currentPrice ? (
                <span className="text-red-500">แจ้งเตือนเมื่อราคาลงมาถึง {price}</span>
              ) : (
                <span>ราคาเท่ากับปัจจุบัน</span>
              )
            ) : null}
          </div>
        </div>
        <DialogFooter>
          {existingAlert && (
            <Button variant="destructive" onClick={() => { onRemove(symbol); onOpenChange(false); }}>
              ยกเลิกการแจ้งเตือน
            </Button>
          )}
          <Button onClick={handleSave}>บันทึก</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
