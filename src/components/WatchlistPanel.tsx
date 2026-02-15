import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Star, Trash2, Loader2, Clock, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useWatchlist } from '@/hooks/useWatchlist';
import { AuthDialog } from './AuthDialog';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

export function WatchlistPanel() {
  const { user, isAuthenticated, signOut } = useAuth();
  const { watchlist, loading, removeFromWatchlist } = useWatchlist();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [removingSymbol, setRemovingSymbol] = useState<string | null>(null);

  const handleRemove = async (symbol: string) => {
    setRemovingSymbol(symbol);
    const { error } = await removeFromWatchlist(symbol);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`นำ ${symbol} ออกจาก Watchlist แล้ว`);
    }
    setRemovingSymbol(null);
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('ออกจากระบบแล้ว');
    }
  };

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Star className="w-4 h-4" />
            <span className="hidden sm:inline">Watchlist</span>
            {isAuthenticated && watchlist.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {watchlist.length}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-warning" />
              Watchlist
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {!isAuthenticated ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Star className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  เข้าสู่ระบบเพื่อบันทึกหุ้นที่สนใจ
                </p>
                <Button onClick={() => setShowAuthDialog(true)}>
                  <LogIn className="w-4 h-4 mr-2" />
                  เข้าสู่ระบบ
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-sm text-muted-foreground border-b border-border pb-3">
                  <span>{user?.email}</span>
                  <Button variant="ghost" size="sm" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-1" />
                    ออกจากระบบ
                  </Button>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : watchlist.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Star className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      ยังไม่มีหุ้นใน Watchlist
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      กดไอคอน ⭐ ที่หุ้นเพื่อเพิ่ม
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {watchlist.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors"
                      >
                        <div>
                          <p className="font-semibold">{item.stock_symbol}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(item.created_at), {
                              addSuffix: true,
                              locale: th,
                            })}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(item.stock_symbol)}
                          disabled={removingSymbol === item.stock_symbol}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          {removingSymbol === item.stock_symbol ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AuthDialog isOpen={showAuthDialog} onClose={() => setShowAuthDialog(false)} />
    </>
  );
}
