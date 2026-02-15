export interface StockRecommendation {
  symbol: string;
  name: string;
  currentPrice: number;
  entryPoint: number;
  targetPrice: number;
  stopLoss: number;
  riskReward: string;
  holdingPeriod: string;
  technicalSetup: string;
  indicators: {
    rsi: number;
    macd: 'bullish' | 'bearish' | 'neutral';
    volumeChange: number;
    aboveMA20: boolean;
    aboveMA50: boolean;
  };
  chartPattern: string;
  volume: number;
  avgVolume: number;
  volatility: 'low' | 'medium' | 'high';
  momentum: 'strong' | 'moderate' | 'weak';
}

export const mockStocks: StockRecommendation[] = [
  {
    symbol: "PTT",
    name: "บมจ. ปตท.",
    currentPrice: 35.25,
    entryPoint: 35.00,
    targetPrice: 38.50,
    stopLoss: 33.75,
    riskReward: "1:2.8",
    holdingPeriod: "3-5 วัน",
    technicalSetup: "Breakout เหนือ MA50 พร้อม Volume เพิ่มขึ้น 180%",
    indicators: {
      rsi: 58,
      macd: 'bullish',
      volumeChange: 180,
      aboveMA20: true,
      aboveMA50: true,
    },
    chartPattern: "Cup & Handle",
    volume: 125000000,
    avgVolume: 70000000,
    volatility: 'medium',
    momentum: 'strong',
  },
  {
    symbol: "KBANK",
    name: "ธ.กสิกรไทย",
    currentPrice: 142.50,
    entryPoint: 141.00,
    targetPrice: 152.00,
    stopLoss: 137.00,
    riskReward: "1:2.75",
    holdingPeriod: "2-4 วัน",
    technicalSetup: "MACD ตัดขึ้น + RSI ออกจาก Oversold",
    indicators: {
      rsi: 52,
      macd: 'bullish',
      volumeChange: 165,
      aboveMA20: true,
      aboveMA50: false,
    },
    chartPattern: "Double Bottom",
    volume: 89000000,
    avgVolume: 54000000,
    volatility: 'medium',
    momentum: 'moderate',
  },
  {
    symbol: "DELTA",
    name: "เดลต้า อีเลคโทรนิคส์",
    currentPrice: 78.50,
    entryPoint: 77.50,
    targetPrice: 85.00,
    stopLoss: 74.00,
    riskReward: "1:2.14",
    holdingPeriod: "3-5 วัน",
    technicalSetup: "Pullback สู่ Support + Volume spike",
    indicators: {
      rsi: 48,
      macd: 'neutral',
      volumeChange: 220,
      aboveMA20: true,
      aboveMA50: true,
    },
    chartPattern: "Bull Flag",
    volume: 156000000,
    avgVolume: 71000000,
    volatility: 'high',
    momentum: 'strong',
  },
  {
    symbol: "GULF",
    name: "กัลฟ์ เอ็นเนอร์จี",
    currentPrice: 42.75,
    entryPoint: 42.25,
    targetPrice: 46.00,
    stopLoss: 40.50,
    riskReward: "1:2.14",
    holdingPeriod: "2-3 วัน",
    technicalSetup: "Breakout Resistance 42.50 + Strong momentum",
    indicators: {
      rsi: 62,
      macd: 'bullish',
      volumeChange: 195,
      aboveMA20: true,
      aboveMA50: true,
    },
    chartPattern: "Ascending Triangle",
    volume: 98000000,
    avgVolume: 50000000,
    volatility: 'medium',
    momentum: 'strong',
  },
  {
    symbol: "ADVANC",
    name: "แอดวานซ์ อินโฟร์ เซอร์วิส",
    currentPrice: 198.00,
    entryPoint: 196.50,
    targetPrice: 210.00,
    stopLoss: 190.00,
    riskReward: "1:2.08",
    holdingPeriod: "3-5 วัน",
    technicalSetup: "Golden Cross MA20/MA50 + Volume confirmation",
    indicators: {
      rsi: 55,
      macd: 'bullish',
      volumeChange: 175,
      aboveMA20: true,
      aboveMA50: true,
    },
    chartPattern: "Breakout",
    volume: 112000000,
    avgVolume: 64000000,
    volatility: 'low',
    momentum: 'moderate',
  },
  {
    symbol: "BEM",
    name: "บีทีเอส กรุ๊ป",
    currentPrice: 8.65,
    entryPoint: 8.50,
    targetPrice: 9.50,
    stopLoss: 8.10,
    riskReward: "1:2.5",
    holdingPeriod: "2-4 วัน",
    technicalSetup: "Bounce จาก Support zone + RSI divergence",
    indicators: {
      rsi: 45,
      macd: 'neutral',
      volumeChange: 160,
      aboveMA20: false,
      aboveMA50: false,
    },
    chartPattern: "Inverse Head & Shoulders",
    volume: 78000000,
    avgVolume: 49000000,
    volatility: 'medium',
    momentum: 'moderate',
  },
  {
    symbol: "CPALL",
    name: "ซีพี ออลล์",
    currentPrice: 62.25,
    entryPoint: 61.50,
    targetPrice: 67.00,
    stopLoss: 59.00,
    riskReward: "1:2.2",
    holdingPeriod: "3-5 วัน",
    technicalSetup: "Breakout descending trendline + High volume",
    indicators: {
      rsi: 51,
      macd: 'bullish',
      volumeChange: 185,
      aboveMA20: true,
      aboveMA50: false,
    },
    chartPattern: "Trendline Breakout",
    volume: 134000000,
    avgVolume: 72000000,
    volatility: 'low',
    momentum: 'moderate',
  },
  {
    symbol: "OR",
    name: "ปตท. น้ำมัน",
    currentPrice: 18.30,
    entryPoint: 18.10,
    targetPrice: 20.00,
    stopLoss: 17.20,
    riskReward: "1:2.11",
    holdingPeriod: "2-4 วัน",
    technicalSetup: "MACD bullish crossover + Volume surge",
    indicators: {
      rsi: 57,
      macd: 'bullish',
      volumeChange: 210,
      aboveMA20: true,
      aboveMA50: true,
    },
    chartPattern: "Pennant",
    volume: 167000000,
    avgVolume: 80000000,
    volatility: 'medium',
    momentum: 'strong',
  },
];

export const getFilteredStocks = (
  minVolume: number,
  riskLevel: 'low' | 'medium' | 'high'
): StockRecommendation[] => {
  return mockStocks.filter(stock => {
    const volumePass = stock.volume >= minVolume;
    const riskPass = riskLevel === 'high' 
      ? true 
      : riskLevel === 'medium' 
        ? stock.volatility !== 'high'
        : stock.volatility === 'low';
    return volumePass && riskPass;
  });
};
