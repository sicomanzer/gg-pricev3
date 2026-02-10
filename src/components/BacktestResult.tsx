
import { useBacktest, BacktestRecord } from '@/hooks/useBacktest';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, XCircle, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export function BacktestResult() {
    const { records, getStats, clearHistory } = useBacktest();
    const stats = getStats();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'WIN': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'LOSS': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
        }
    };

    return (
        <div className="space-y-6 animate-slide-up">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">ประวัติการแนะนำ (Backtest Report)</h2>
                {records.length > 0 && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                                <Trash2 className="w-4 h-4 mr-2" />
                                ล้างประวัติ
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>ยืนยันการล้างข้อมูล?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    ประวัติการเทรดทั้งหมดจะถูกลบถาวร ไม่สามารถกู้คืนได้
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                <AlertDialogAction onClick={clearHistory} className="bg-destructive hover:bg-destructive/90">
                                    ลบข้อมูล
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{stats.winRate.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">อัตราการชนะ</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">ชนะ (Wins)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">{stats.wins}</div>
                        <p className="text-xs text-muted-foreground">เข้าเป้าหมาย</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">แพ้ (Losses)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">{stats.losses}</div>
                        <p className="text-xs text-muted-foreground">โดน Stop Loss</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">สถานะรอ (Open)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-500">{stats.active}</div>
                        <p className="text-xs text-muted-foreground">รอผลลัพธ์</p>
                    </CardContent>
                </Card>
            </div>

            {/* History List */}
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle>รายการย้อนหลัง</CardTitle>
                    <CardDescription>แสดงผลลัพธ์จากการแนะนำของระบบ</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-4">
                            {records.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground">
                                    ยังไม่มีประวัติการแนะนำ
                                </div>
                            ) : (
                                records.map((record) => (
                                    <div key={record.id} className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/50">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-lg">{record.symbol}</span>
                                                <Badge variant="outline" className={getStatusColor(record.status)}>
                                                    {record.status === 'WIN' && <Trophy className="w-3 h-3 mr-1" />}
                                                    {record.status === 'LOSS' && <XCircle className="w-3 h-3 mr-1" />}
                                                    {record.status === 'OPEN' && <Clock className="w-3 h-3 mr-1" />}
                                                    {record.status}
                                                </Badge>
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(record.entryDate).toLocaleDateString('th-TH')}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-8 text-right text-sm">
                                            <div>
                                                <span className="text-muted-foreground block text-xs">จุดเข้า</span>
                                                <span className="font-mono">฿{record.entryPrice.toFixed(2)}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground block text-xs">เป้าหมาย</span>
                                                <span className="font-mono text-green-500">฿{record.targetPrice.toFixed(2)}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground block text-xs">ตัดขาดทุน</span>
                                                <span className="font-mono text-red-500">฿{record.stopLoss.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
