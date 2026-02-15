import { TrendingUp, Zap, Settings, Clock } from 'lucide-react';
import { WatchlistPanel } from './WatchlistPanel';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export function Header() {
  const navigate = useNavigate();
  const [marketStatus, setMarketStatus] = useState<{ isOpen: boolean; text: string; color: string }>({
    isOpen: false,
    text: 'กำลังโหลด...',
    color: 'text-muted-foreground'
  });

  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const thaiTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
      setCurrentTime(thaiTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkMarketStatus = () => {
      const now = new Date();
      // Convert to Thailand Time
      const thaiTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
      
      const day = thaiTime.getDay(); // 0 = Sunday, 6 = Saturday
      const hour = thaiTime.getHours();
      const minute = thaiTime.getMinutes();
      const timeInMinutes = hour * 60 + minute;

      // Market Hours (approximate):
      // Morning: 10:00 - 12:30 (600 - 750)
      // Afternoon: 14:00 - 16:30 (840 - 990)
      // Closed on Sat (6) & Sun (0)
      
      const isWeekend = day === 0 || day === 6;
      
      if (isWeekend) {
        setMarketStatus({ isOpen: false, text: 'SET ปิดทำการ (วันหยุด)', color: 'text-muted-foreground' });
        return;
      }

      // Check Pre-open / Open / Intermission / Closed
      if (timeInMinutes >= 600 && timeInMinutes <= 750) { // 10:00 - 12:30
        setMarketStatus({ isOpen: true, text: 'SET เปิดทำการ (เช้า)', color: 'text-success' });
      } else if (timeInMinutes > 750 && timeInMinutes < 840) { // 12:30 - 14:00
        setMarketStatus({ isOpen: false, text: 'พักเที่ยง', color: 'text-warning' });
      } else if (timeInMinutes >= 840 && timeInMinutes <= 990) { // 14:00 - 16:30
        setMarketStatus({ isOpen: true, text: 'SET เปิดทำการ (บ่าย)', color: 'text-success' });
      } else if (timeInMinutes > 990 && timeInMinutes <= 1020) { // 16:30 - 17:00 (Run off/Close)
         setMarketStatus({ isOpen: false, text: 'Pre-Close / Run Off', color: 'text-warning' });
      } else {
        setMarketStatus({ isOpen: false, text: 'SET ปิดทำการ', color: 'text-muted-foreground' });
      }
    };

    checkMarketStatus();
    const interval = setInterval(checkMarketStatus, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="glass-card mb-6 p-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div 
          className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate('/')}
        >
          <div className="relative">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/50 glow-effect">
              <TrendingUp className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="absolute -top-1 -right-1 p-1 rounded-full bg-success animate-pulse">
              <Zap className="w-3 h-3 text-success-foreground" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              <span className="gradient-text">Stock Scanner</span>
            </h1>
            <p className="text-muted-foreground text-sm">
              วิเคราะห์หุ้นเทรดระยะสั้น 1-5 วัน
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <WatchlistPanel />
          
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
            <Settings className="w-5 h-5" />
          </Button>

          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">สถานะตลาด</p>
              <p className={`font-semibold ${marketStatus.color} flex items-center gap-1 justify-end`}>
                {marketStatus.isOpen ? (
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                ) : (
                  <Clock className="w-3 h-3" />
                )}
                {marketStatus.text}
              </p>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                {currentTime}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
