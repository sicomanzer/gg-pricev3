import { TrendingUp, BarChart3, Target, AlertTriangle } from 'lucide-react';
import { StockRecommendation } from '@/data/mockStocks';

interface StatsCardsProps {
  stocks: StockRecommendation[];
  budget: number;
}

export function StatsCards({ stocks, budget }: StatsCardsProps) {
  const strongMomentum = stocks.filter(s => s.momentum === 'strong').length;
  const avgRR = stocks.reduce((acc, s) => {
    const rr = parseFloat(s.riskReward.split(':')[1]);
    return acc + rr;
  }, 0) / stocks.length;
  
  const totalVolume = stocks.reduce((acc, s) => acc + s.volume, 0);
  const highVolatility = stocks.filter(s => s.volatility === 'high').length;

  const stats = [
    {
      label: 'หุ้นที่ผ่านเงื่อนไข',
      value: stocks.length.toString(),
      subtext: 'รายการ',
      icon: BarChart3,
      color: 'text-primary',
      bgColor: 'bg-primary/20',
    },
    {
      label: 'โมเมนตัมแรง',
      value: strongMomentum.toString(),
      subtext: `จาก ${stocks.length} รายการ`,
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/20',
    },
    {
      label: 'R:R เฉลี่ย',
      value: `1:${avgRR.toFixed(1)}`,
      subtext: 'Risk/Reward',
      icon: Target,
      color: 'text-primary',
      bgColor: 'bg-primary/20',
    },
    {
      label: 'ความผันผวนสูง',
      value: highVolatility.toString(),
      subtext: 'ต้องระวัง',
      icon: AlertTriangle,
      color: 'text-warning',
      bgColor: 'bg-warning/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className="stat-card"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>
                {stat.value}
              </p>
              <p className="text-muted-foreground text-xs mt-1">{stat.subtext}</p>
            </div>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
