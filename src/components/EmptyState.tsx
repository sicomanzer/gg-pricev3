import { BarChart3 } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="glass-card p-12 text-center animate-slide-up">
      <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-muted/50 mb-4">
        <BarChart3 className="w-12 h-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">พร้อมสแกนหุ้น</h3>
      <p className="text-muted-foreground max-w-md mx-auto">
        ตั้งค่าเงื่อนไขการคัดกรองด้านบน แล้วกดปุ่ม "สแกนหุ้น" เพื่อดูรายการหุ้นที่แนะนำ
      </p>
    </div>
  );
}
