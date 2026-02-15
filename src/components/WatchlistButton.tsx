import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Star, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useWatchlist } from '@/hooks/useWatchlist';
import { AuthDialog } from './AuthDialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface WatchlistButtonProps {
  stockSymbol: string;
  size?: 'sm' | 'default' | 'icon';
  showLabel?: boolean;
}

export function WatchlistButton({ stockSymbol, size = 'icon', showLabel = false }: WatchlistButtonProps) {
  const { isAuthenticated } = useAuth();
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const [loading, setLoading] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const inWatchlist = isInWatchlist(stockSymbol);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }

    setLoading(true);

    try {
      if (inWatchlist) {
        const { error } = await removeFromWatchlist(stockSymbol);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success(`นำ ${stockSymbol} ออกจาก Watchlist แล้ว`);
        }
      } else {
        const { error } = await addToWatchlist(stockSymbol);
        if (error) {
          if (error.message.includes('duplicate')) {
            toast.info(`${stockSymbol} อยู่ใน Watchlist แล้ว`);
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success(`เพิ่ม ${stockSymbol} ลง Watchlist แล้ว`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size={size}
        onClick={handleClick}
        disabled={loading}
        className={cn(
          'hover:bg-warning/10',
          inWatchlist && 'text-warning'
        )}
        title={inWatchlist ? 'นำออกจาก Watchlist' : 'เพิ่มลง Watchlist'}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Star className={cn('w-4 h-4', inWatchlist && 'fill-warning')} />
        )}
        {showLabel && (
          <span className="ml-1">
            {inWatchlist ? 'ใน Watchlist' : 'เพิ่ม Watchlist'}
          </span>
        )}
      </Button>

      <AuthDialog isOpen={showAuthDialog} onClose={() => setShowAuthDialog(false)} />
    </>
  );
}
