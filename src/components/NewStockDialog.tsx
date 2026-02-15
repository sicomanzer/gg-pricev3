
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StockRecommendation } from "@/data/stockUtils";
import { Badge } from "@/components/ui/badge";
import { Zap, TrendingUp, X } from "lucide-react";

interface NewStockDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    newStocks: StockRecommendation[];
    onViewStock: (stock: StockRecommendation) => void;
}

export function NewStockDialog({
    open,
    onOpenChange,
    newStocks,
    onViewStock,
}: NewStockDialogProps) {
    if (newStocks.length === 0) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] border-l-4 border-l-primary animate-in fade-in zoom-in duration-300">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-primary/10">
                            <Zap className="w-6 h-6 text-primary animate-pulse" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">เจอหุ้นต้นเทรนด์ใหม่!</DialogTitle>
                            <DialogDescription>
                                ระบบตรวจพบหุ้นที่เข้าเงื่อนไขสแกนล่าสุด {newStocks.length} ตัว
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid gap-3 py-4 max-h-[60vh] overflow-y-auto pr-1">
                    {newStocks.map((stock) => (
                        <div
                            key={stock.symbol}
                            className="group flex flex-col gap-2 p-3 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-lg">{stock.symbol}</span>
                                    <Badge variant="outline" className="text-xs">
                                        {stock.name}
                                    </Badge>
                                </div>
                                <div className="text-right">
                                    <div className="font-mono font-medium text-lg">
                                        ฿{stock.currentPrice.toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <div className="flex gap-2 text-muted-foreground">
                                    <span>เป้า: <span className="text-green-500">฿{stock.targetPrice}</span></span>
                                    <span>|</span>
                                    <span>Stop: <span className="text-red-500">฿{stock.stopLoss}</span></span>
                                </div>
                                <Button
                                    size="sm"
                                    className="h-8 gap-1"
                                    onClick={() => onViewStock(stock)}
                                >
                                    <TrendingUp className="w-3 h-3" />
                                    ดูรายละเอียด
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                <DialogFooter className="sm:justify-between gap-2">
                    <Button
                        variant="ghost"
                        className="text-muted-foreground"
                        onClick={() => onOpenChange(false)}
                    >
                        ปิดหน้าต่าง
                    </Button>
                    <Button
                        className="w-full sm:w-auto bg-primary text-primary-foreground"
                        onClick={() => onOpenChange(false)}
                    >
                        รับทราบ
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
