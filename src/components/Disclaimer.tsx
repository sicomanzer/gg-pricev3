import { AlertTriangle } from 'lucide-react';

export function Disclaimer() {
  return (
    <div className="glass-card p-4 border-warning/30 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-warning/20 shrink-0">
          <AlertTriangle className="w-4 h-4 text-warning" />
        </div>
        <div className="text-sm">
          <p className="font-medium text-warning mb-1">คำเตือน</p>
          <p className="text-muted-foreground">
            ข้อมูลนี้เป็นเพียงการวิเคราะห์ทางเทคนิคเพื่อประกอบการตัดสินใจ ไม่ใช่คำแนะนำในการลงทุน 
            การลงทุนมีความเสี่ยง ผู้ลงทุนควรศึกษาข้อมูลก่อนตัดสินใจลงทุน
          </p>
        </div>
      </div>
    </div>
  );
}
