import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2, Send, MessageSquare, Trash2, AlertTriangle, Database, RefreshCw, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { sendTelegramMessage } from '@/lib/telegram';
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const navigate = useNavigate();
  const [set100List, setSet100List] = useState("");
  const [isUpdatingList, setIsUpdatingList] = useState(false);
  const [isUpdatingFundamentals, setIsUpdatingFundamentals] = useState(false);

  // Telegram Settings
  const [telegramToken, setTelegramToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");

  useEffect(() => {
    // 1. Try Local Storage first (Priority)
    const localList = localStorage.getItem('SET100_LIST');
    let loadedFromLocal = false;
    
    if (localList) {
        try {
            const parsed = JSON.parse(localList);
            if (Array.isArray(parsed) && parsed.length > 0) {
                setSet100List(parsed.join('\n'));
                loadedFromLocal = true;
            }
        } catch (e) {
            console.error("Error parsing local list", e);
        }
    }

    // 2. If not in local, fetch from DB
    if (!loadedFromLocal) {
        fetchSet100List();
    }

    // Load Telegram settings
    const savedToken = localStorage.getItem('telegram_bot_token');
    const savedChatId = localStorage.getItem('telegram_chat_id');
    if (savedToken) setTelegramToken(savedToken);
    if (savedChatId) setTelegramChatId(savedChatId);
  }, []);

  const fetchSet100List = async () => {
    const { data, error } = await supabase
      .from('stock_settings')
      .select('value')
      .eq('key', 'SET100_LIST')
      .single();

    if (data?.value && Array.isArray(data.value)) {
      setSet100List(data.value.join('\n'));
    }
  };

  const saveTelegramSettings = async () => {
    if (!telegramToken || !telegramChatId) {
      toast.error("กรุณากรอก Bot Token และ Chat ID");
      return;
    }

    // Save to LocalStorage (for Client-side alerts)
    localStorage.setItem('telegram_bot_token', telegramToken);
    localStorage.setItem('telegram_chat_id', telegramChatId);

    // Save to Database (for Server-side Auto-Bot)
    const { error } = await supabase.from('stock_settings').upsert({
      key: 'TELEGRAM_CONFIG',
      value: { token: telegramToken, chatId: telegramChatId },
      updated_at: new Date().toISOString()
    });

    if (error) {
      console.error('Failed to save Telegram config to DB:', error);
      toast.warning("บันทึกในเครื่องสำเร็จ แต่บันทึกลง Server ไม่สำเร็จ (Auto-Bot อาจไม่ทำงาน)");
    } else {
      toast.success("บันทึกการตั้งค่า Telegram เรียบร้อย (Auto-Bot พร้อมใช้งาน)");
    }
  };

  const testTelegramNotification = async () => {
    if (!telegramToken || !telegramChatId) {
      toast.error("กรุณาบันทึกการตั้งค่าก่อนทดสอบ");
      return;
    }

    const loadingToast = toast.loading("กำลังส่งข้อความทดสอบ...");

    // Test Case 1: New Signal
    const msg1 = `📊 สัญญาณเทรดใหม่: <b>PTT</b>\n` +
      `💰 ราคาปัจจุบัน: ฿34.50\n` +
      `🛒 ราคาซื้อ: ฿34.25\n` +
      `🎯 ราคาเป้าหมาย: ฿36.00\n` +
      `🛑 ราคาตัดขาดทุน: ฿33.00`;

    const fullMessage = `<b>🔔 ทดสอบรูปแบบการแจ้งเตือน</b>\n\n` +
      msg1;

    const success = await sendTelegramMessage(fullMessage);

    toast.dismiss(loadingToast);

    if (success) {
      toast.success("ส่งข้อความทดสอบสำเร็จ");
    } else {
      toast.error("ส่งข้อความไม่สำเร็จ กรุณาตรวจสอบ Token และ Chat ID");
    }
  };


  const handleUpdateList = async () => {
    if (!set100List.trim()) {
      toast.error("กรุณากรอกรายชื่อหุ้น");
      return;
    }

    const stocks = set100List
      .split(/\n|\s+/) // Split by newline or whitespace
      .map(s => s.trim())
      .filter(s => s.length > 0 && /^[A-Z0-9]+$/.test(s)); // Basic validation

    if (stocks.length === 0) {
      toast.error("ไม่พบรายชื่อหุ้นที่ถูกต้อง");
      return;
    }

    setIsUpdatingList(true);

    // 1. Save to LocalStorage (Always success & Priority)
    localStorage.setItem('SET100_LIST', JSON.stringify(stocks));

    // 2. Try to save to Supabase DB (Best Effort)
    let dbSuccess = false;
    try {
      const { error } = await supabase
        .from('stock_settings')
        .upsert({
          key: 'SET100_LIST',
          value: stocks,
          updated_at: new Date().toISOString()
        });
      
      if (!error) dbSuccess = true;
    } catch (err) {
      console.warn("DB save failed (likely permission denied)", err);
    }

    setIsUpdatingList(false);

    if (dbSuccess) {
      toast.success(`บันทึกข้อมูลสำเร็จ! (${stocks.length} รายการ)`);
    } else {
      toast.success(`บันทึกลงเครื่องสำเร็จ (${stocks.length} รายการ)`, {
        description: "ข้อมูลถูกบันทึกใน Browser แล้ว (เข้าสู่ระบบเพื่อสำรองข้อมูลบน Cloud)"
      });
    }
  };

  const handleUpdateFundamentals = async () => {
    setIsUpdatingFundamentals(true);
    const toastId = toast.loading("กำลังเตรียมข้อมูล...", { duration: Infinity });

    try {
      const stocks = set100List
        .split(/\n|\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

      if (stocks.length === 0) {
        toast.error("ไม่พบรายชื่อหุ้น", { id: toastId });
        return;
      }

      let successCount = 0;
      const CHUNK_SIZE = 10; // Process 10 stocks at a time

      for (let i = 0; i < stocks.length; i += CHUNK_SIZE) {
        const chunk = stocks.slice(i, i + CHUNK_SIZE);
        
        toast.loading(
          `กำลังอัปเดตข้อมูลปันผล (${Math.min(i + chunk.length, stocks.length)}/${stocks.length})...`, 
          { id: toastId }
        );

        const { data, error } = await supabase.functions.invoke('stock-data', {
          body: {
            action: 'update-fundamentals',
            symbols: chunk
          }
        });

        if (error) {
          console.error(`Error chunk ${i}:`, error);
          // Don't throw, just log and continue to try other chunks
        } else {
          successCount += data?.results?.length || 0;
        }
      }

      toast.success(`อัปเดตข้อมูลพื้นฐานสำเร็จ! (${successCount} รายการ)`, { id: toastId });

    } catch (err: any) {
      console.error(err);
      toast.error("เกิดข้อผิดพลาด: " + err.message, { id: toastId });
    } finally {
      setIsUpdatingFundamentals(false);
      // Ensure toast is dismissed if not already success/error
      setTimeout(() => toast.dismiss(toastId), 3000);
    }
  };

  const handleFactoryReset = async () => {
    // Clear all app specific data from localStorage
    localStorage.removeItem('stock_backtest_records'); // History & Win Rate
    localStorage.removeItem('stock_price_alerts');     // Price Alerts
    localStorage.removeItem('telegram_bot_token');     // Telegram Token
    localStorage.removeItem('telegram_chat_id');       // Telegram Chat ID

    setSet100List("");
    setTelegramToken("");
    setTelegramChatId("");

    toast.success("ล้างข้อมูล Local Storage เรียบร้อยแล้ว (ข้อมูลบน Cloud ยังคงอยู่)");

    setTimeout(() => {
      window.location.href = '/';
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Header />

        <div className="glass-card p-6 space-y-6 animate-slide-up">
          <div>
            <h2 className="text-2xl font-bold mb-2">ตั้งค่าระบบ</h2>
            <p className="text-muted-foreground">จัดการข้อมูลรายชื่อหุ้นและการตั้งค่าอื่นๆ</p>
          </div>

          {/* Database Control Section */}
          <div className="p-4 border border-blue-500/20 rounded-lg bg-blue-500/5 space-y-4">
            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 text-blue-500 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-500">ฐานข้อมูลหุ้น & ปันผล</h3>
                <p className="text-sm text-muted-foreground">
                  อัปเดตข้อมูลพื้นฐาน (เช่น อัตราปันผล, P/E) ลงในฐานข้อมูล เพื่อใช้ในการสแกนที่แม่นยำขึ้น
                  (แก้ปัญหาข้อมูลปันผลไม่ถูกต้อง)
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleUpdateFundamentals}
              disabled={isUpdatingFundamentals}
              className="w-full md:w-auto"
            >
              {isUpdatingFundamentals ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  กำลังอัปเดต...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  อัปเดตข้อมูลปันผลเดี๋ยวนี้
                </>
              )}
            </Button>
          </div>


          <div className="space-y-4 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                อัปเดตรายชื่อ SET100 (ใช้สแกน)
              </h3>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">รายชื่อหุ้น (คัดลอกและวางที่นี่)</label>
              <Textarea
                placeholder="AAV&#10;ADVANC&#10;AEONTS&#10;..."
                className="font-mono min-h-[300px]"
                value={set100List}
                onChange={(e) => setSet100List(e.target.value)}
              />
              <p className="text-xs text-muted-foreground text-right">
                รองรับการวางข้อมูลแบบรายการแนวตั้งหรือเว้นวรรค
              </p>
            </div>

            <Button onClick={handleUpdateList} disabled={isUpdatingList} className="w-full md:w-auto">
              {isUpdatingList ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              บันทึกข้อมูลลงฐานข้อมูล
            </Button>
          </div>
        </div>

        {/* Telegram Settings Section */}
        <div className="glass-card p-6 space-y-6 animate-slide-up delay-100">
          <div>
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              การแจ้งเตือน Telegram
            </h2>
            <p className="text-muted-foreground">ตั้งค่าการแจ้งเตือนเมื่อพบหุ้นใหม่ผ่าน Telegram Bot</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="token">Bot Token</Label>
              <Input
                id="token"
                placeholder="เช่น 123456789:ABCdefGHIjkl..."
                value={telegramToken}
                onChange={(e) => setTelegramToken(e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="chatId">Chat ID</Label>
              <Input
                id="chatId"
                placeholder="เช่น -100123456789 หรือ 12345678"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button onClick={saveTelegramSettings} className="w-full sm:w-auto">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              บันทึกการตั้งค่า
            </Button>
            <Button variant="outline" onClick={testTelegramNotification} className="w-full sm:w-auto">
              <Send className="w-4 h-4 mr-2" />
              ทดสอบส่งข้อความ
            </Button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="glass-card p-6 space-y-6 animate-slide-up delay-200 border-destructive/20">
          <div>
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              พื้นที่อันตราย (Danger Zone)
            </h2>
          </div>

          <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-semibold text-destructive">ล้างข้อมูล Local Storage</h3>
              <p className="text-sm text-muted-foreground">
                การตั้งค่าบนเครื่องนี้จะหายไป (แต่ข้อมูลบน Cloud จะยังอยู่)
              </p>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full md:w-auto">
                  <Trash2 className="w-4 h-4 mr-2" />
                  ล้างข้อมูล
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>คุณแน่ใจหรือไม่?</AlertDialogTitle>
                  <AlertDialogDescription>
                    การกระทำนี้จะล้างข้อมูล Local Storage เท่านั้น ข้อมูลที่บันทึกลงฐานข้อมูลแล้วจะไม่หายไป
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                  <AlertDialogAction onClick={handleFactoryReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    ยืนยัน
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
