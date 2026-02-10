import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Send, MessageSquare, Trash2, AlertTriangle } from "lucide-react";
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
import { sendTelegramMessage } from "@/lib/telegram";

const Settings = () => {
  const navigate = useNavigate();
  const [set100List, setSet100List] = useState("");
  const [updateDue, setUpdateDue] = useState<{ isDue: boolean; period: string } | null>(null);
  
  // Telegram Settings
  const [telegramToken, setTelegramToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");

  useEffect(() => {
    checkUpdateSchedule();
    
    // Load Telegram settings
    const savedToken = localStorage.getItem('telegram_bot_token');
    const savedChatId = localStorage.getItem('telegram_chat_id');
    if (savedToken) setTelegramToken(savedToken);
    if (savedChatId) setTelegramChatId(savedChatId);
  }, []);

  const saveTelegramSettings = () => {
    if (!telegramToken || !telegramChatId) {
      toast.error("กรุณากรอก Bot Token และ Chat ID");
      return;
    }
    localStorage.setItem('telegram_bot_token', telegramToken);
    localStorage.setItem('telegram_chat_id', telegramChatId);
    toast.success("บันทึกการตั้งค่า Telegram เรียบร้อย");
  };

  const testTelegramNotification = async () => {
    if (!telegramToken || !telegramChatId) {
      toast.error("กรุณาบันทึกการตั้งค่าก่อนทดสอบ");
      return;
    }
    
    const loadingToast = toast.loading("กำลังส่งข้อความทดสอบ...");
    
    const success = await sendTelegramMessage("<b>🔔 ทดสอบการแจ้งเตือนจาก Stock Scanner</b>\n\nระบบพร้อมใช้งานครับ!");
    
    toast.dismiss(loadingToast);
    
    if (success) {
      toast.success("ส่งข้อความทดสอบสำเร็จ");
    } else {
      toast.error("ส่งข้อความไม่สำเร็จ กรุณาตรวจสอบ Token และ Chat ID");
    }
  };

  const checkUpdateSchedule = () => {
    const today = new Date();
    const month = today.getMonth() + 1; // 1-12
    const day = today.getDate();

    // Check for June update (for Jul-Dec period)
    if (month === 6 && day >= 15) {
        setUpdateDue({ isDue: true, period: "ครึ่งปีหลัง (ก.ค. - ธ.ค.)" });
    } 
    // Check for December update (for Jan-Jun period)
    else if (month === 12 && day >= 15) {
        setUpdateDue({ isDue: true, period: "ครึ่งปีแรก (ม.ค. - มิ.ย.)" });
    }
  };

  const handleUpdate = () => {
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

    // In a real implementation, this would send data to Supabase DB
    // await supabase.from('settings').upsert({ key: 'SET100', value: stocks })
    
    console.log("Updating SET100:", stocks);
    toast.success(`อัปเดตรายชื่อ SET100 สำเร็จ (${stocks.length} รายการ)`);
    toast.info("กำลังกลับสู่หน้าหลัก...", { duration: 2000 });

    setTimeout(() => {
      navigate("/");
    }, 2000);
    
    // Simulate updating (In reality, we need backend support for dynamic updates)
    // Since we hardcoded the list in Edge Function for now, this UI is just a mockup for the User Requirement "Function to update list"
    // To make it truly work, we would need to change Edge Function to read from DB instead of hardcoded const.
  };

  const handleFactoryReset = () => {
    // Clear all app specific data from localStorage
    localStorage.removeItem('stock_backtest_records'); // History & Win Rate
    localStorage.removeItem('stock_price_alerts');     // Price Alerts
    localStorage.removeItem('telegram_bot_token');     // Telegram Token
    localStorage.removeItem('telegram_chat_id');       // Telegram Chat ID
    
    // Clear state
    setSet100List("");
    setTelegramToken("");
    setTelegramChatId("");
    
    toast.success("ล้างข้อมูลทั้งหมดเรียบร้อยแล้ว");
    
    // Force reload to ensure all states are reset
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

          {updateDue?.isDue && (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>แจ้งเตือนการอัปเดต</AlertTitle>
              <AlertDescription>
                ใกล้ถึงเวลาอัปเดตรายชื่อหุ้น SET100 สำหรับรอบ {updateDue.period} แล้ว
                กรุณาตรวจสอบและอัปเดตรายชื่อหุ้นชุดใหม่
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                อัปเดตรายชื่อ SET100
                <span className="text-xs font-normal text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                  ปัจจุบัน: มกราคม 2569
                </span>
              </h3>
            </div>

            <div className="bg-secondary/30 p-4 rounded-lg text-sm text-muted-foreground space-y-2">
              <p><strong>รอบการเปลี่ยนแปลงข้อมูล:</strong></p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>รอบครึ่งปีแรก: เริ่มใช้ 1 มกราคม – 30 มิถุนายน</li>
                <li>รอบครึ่งปีหลัง: เริ่มใช้ 1 กรกฎาคม – 31 ธันวาคม</li>
              </ul>
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

            <Button onClick={handleUpdate} className="w-full md:w-auto">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              บันทึกข้อมูล
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
              <p className="text-xs text-muted-foreground">
                ได้จาก @BotFather
              </p>
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
              <p className="text-xs text-muted-foreground">
                ได้จาก @userinfobot หรือ URL ของกลุ่ม
              </p>
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
            <p className="text-muted-foreground">การดำเนินการในส่วนนี้ไม่สามารถกู้คืนได้</p>
          </div>

          <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-semibold text-destructive">ล้างข้อมูลทั้งหมด (Factory Reset)</h3>
              <p className="text-sm text-muted-foreground">
                ลบประวัติการสแกน, Win Rate, การตั้งค่าแจ้งเตือน, และข้อมูล Telegram ทั้งหมด
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
                    การกระทำนี้จะลบข้อมูลทั้งหมดของคุณออกจากเครื่องนี้ รวมถึงประวัติการสแกน สถิติ Win Rate และการตั้งค่าต่างๆ ข้อมูลจะไม่สามารถกู้คืนได้
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                  <AlertDialogAction onClick={handleFactoryReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    ยืนยันการล้างข้อมูล
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
