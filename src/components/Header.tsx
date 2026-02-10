import { TrendingUp, Zap, Settings } from 'lucide-react';
import { WatchlistPanel } from './WatchlistPanel';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const navigate = useNavigate();

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
              <p className="text-sm text-muted-foreground">ตลาด</p>
              <p className="font-semibold text-success flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                SET เปิดทำการ
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
