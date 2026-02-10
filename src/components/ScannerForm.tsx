import { useState } from 'react';
import { Calendar as CalendarIcon, DollarSign, TrendingUp, Settings2, Percent, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface ScanParams {
  date: string;
  market: string;
  budget: number;
  riskLevel: 'low' | 'medium' | 'high';
  minVolume: number;
  minDividendYield: number;
  isSniperMode?: boolean;
}

interface ScannerFormProps {
  onScan: (params: ScanParams) => void;
  isLoading: boolean;
  autoScanEnabled: boolean;
  onAutoScanChange: (enabled: boolean) => void;
  nextScanIn?: number;
}

export function ScannerForm({ onScan, isLoading, autoScanEnabled, onAutoScanChange, nextScanIn }: ScannerFormProps) {
  const [params, setParams] = useState<ScanParams>({
    date: new Date().toISOString().split('T')[0],
    market: 'SET100', // Default to SET100 as per latest user preference context
    budget: 100000,
    riskLevel: 'medium',
    minVolume: 50000000,
    minDividendYield: 0,
    isSniperMode: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onScan(params);
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/20">
          <Settings2 className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-lg font-semibold">ตั้งค่าการสแกน</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date" className="text-muted-foreground text-sm flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            วันที่วิเคราะห์
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal bg-muted/50 border-border/50 hover:bg-muted/50",
                  !params.date && "text-muted-foreground"
                )}
              >
                {params.date ? format(new Date(params.date), "dd/MM/yyyy") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={params.date ? new Date(params.date) : undefined}
                onSelect={(date) => date && setParams({ ...params, date: format(date, 'yyyy-MM-dd') })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="market" className="text-muted-foreground text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            ตลาด
          </Label>
          <Select
            value={params.market}
            onValueChange={(value) => setParams({ ...params, market: value })}
          >
            <SelectTrigger className="bg-muted/50 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SET">SET (หุ้นยอดนิยม)</SelectItem>
              <SelectItem value="SET100">SET100 (รายชื่อล่าสุด)</SelectItem>
              <SelectItem value="mai">mai</SelectItem>
              <SelectItem value="US">ต่างประเทศ (US)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="budget" className="text-muted-foreground text-sm flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            งบประมาณ (บาท)
          </Label>
          <Input
            id="budget"
            type="number"
            value={params.budget}
            onChange={(e) => setParams({ ...params, budget: Number(e.target.value) })}
            className="bg-muted/50 border-border/50 focus:border-primary"
            placeholder="100,000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="risk" className="text-muted-foreground text-sm">
            ระดับความเสี่ยง
          </Label>
          <Select
            value={params.riskLevel}
            onValueChange={(value: 'low' | 'medium' | 'high') =>
              setParams({ ...params, riskLevel: value })
            }
          >
            <SelectTrigger className="bg-muted/50 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">ต่ำ</SelectItem>
              <SelectItem value="medium">กลาง</SelectItem>
              <SelectItem value="high">สูง</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="volume" className="text-muted-foreground text-sm">
            มูลค่าขั้นต่ำ (ล้านบาท)
          </Label>
          <Select
            value={String(params.minVolume)}
            onValueChange={(value) => setParams({ ...params, minVolume: Number(value) })}
          >
            <SelectTrigger className="bg-muted/50 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30000000">30 ล้าน</SelectItem>
              <SelectItem value="50000000">50 ล้าน</SelectItem>
              <SelectItem value="100000000">100 ล้าน</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dividend" className="font-medium text-muted-foreground text-sm flex items-center gap-2">
            <Percent className="w-4 h-4" />
            ปันผลขั้นต่ำ
          </Label>
          <Select
            value={params.minDividendYield.toString()}
            onValueChange={(value) => setParams({ ...params, minDividendYield: Number(value) })}
          >
            <SelectTrigger className="bg-muted/50 border-border/50">
              <SelectValue placeholder="เลือกอัตราปันผล" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">ไม่กำหนด</SelectItem>
              <SelectItem value="1">1% ขึ้นไป</SelectItem>
              <SelectItem value="2">2% ขึ้นไป</SelectItem>
              <SelectItem value="3">3% ขึ้นไป</SelectItem>
              <SelectItem value="4">4% ขึ้นไป</SelectItem>
              <SelectItem value="5">5% ขึ้นไป</SelectItem>
              <SelectItem value="6">6% ขึ้นไป</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end pb-0">
          <div className={`flex items-center gap-3 p-2.5 rounded-lg border w-full transition-all duration-300 ${params.isSniperMode ? 'bg-red-500/10 border-red-500/50' : 'bg-muted/30 border-border/50'}`}>
            <div className="flex items-center gap-2 flex-1">
              <div className={`p-1.5 rounded-full ${params.isSniperMode ? 'bg-red-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                <Settings2 className="w-4 h-4" />
              </div>
              <Label htmlFor="sniper-mode" className="cursor-pointer font-bold text-sm">
                Sniper Mode
              </Label>
            </div>
            <Switch
              id="sniper-mode"
              checked={params.isSniperMode}
              onCheckedChange={(checked) => setParams({ ...params, isSniperMode: checked })}
              className="data-[state=checked]:bg-red-500"
            />
          </div>
        </div>

        <div className="flex items-end pb-0">
          <div className={`flex items-center gap-3 p-2.5 rounded-lg border w-full transition-all duration-300 ${autoScanEnabled ? 'bg-blue-500/10 border-blue-500/50' : 'bg-muted/30 border-border/50'}`}>
            <div className="flex items-center gap-2 flex-1">
              <div className={`p-1.5 rounded-full ${autoScanEnabled ? 'bg-blue-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                <Zap className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <Label htmlFor="auto-scan" className="cursor-pointer font-bold text-sm">
                  โหมดสแกนอัตโนมัติ
                </Label>
                <span className="text-xs text-muted-foreground">
                  {autoScanEnabled 
                    ? (nextScanIn !== undefined ? `สแกนใหม่ใน ${nextScanIn} วินาที` : 'กำลังทำงาน...') 
                    : 'ทุกๆ 1 นาที'}
                </span>
              </div>
            </div>
            <Switch
              id="auto-scan"
              checked={autoScanEnabled}
              onCheckedChange={onAutoScanChange}
              className="data-[state=checked]:bg-blue-500"
            />
          </div>
        </div>

        <div className="flex items-end pb-0 lg:col-start-6">
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 glow-effect w-full h-[54px]"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                กำลังสแกน...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                สแกนหุ้น
              </span>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
