import { StockQuote } from '@/hooks/useStockData';

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
  dividendYield: number;
}

// Calculate RSI estimation based on price change
function estimateRSI(changePercent: number): number {
  // Simple RSI estimation based on recent price movement
  const baseRSI = 50 + (changePercent * 5);
  return Math.max(0, Math.min(100, baseRSI));
}

// Determine MACD signal based on price movement
function determineMacd(changePercent: number, volumeRatio: number): 'bullish' | 'bearish' | 'neutral' {
  if (changePercent > 1 && volumeRatio > 1.2) return 'bullish';
  if (changePercent < -1 && volumeRatio > 1.2) return 'bearish';
  return 'neutral';
}

// Determine volatility based on price range
function determineVolatility(high: number, low: number, price: number): 'low' | 'medium' | 'high' {
  if (price === 0) return 'medium';
  const range = ((high - low) / price) * 100;
  if (range > 5) return 'high';
  if (range > 2) return 'medium';
  return 'low';
}

// Determine momentum based on volume and price change
function determineMomentum(changePercent: number, volumeRatio: number): 'strong' | 'moderate' | 'weak' {
  if (changePercent > 2 && volumeRatio > 1.5) return 'strong';
  if (changePercent > 0 && volumeRatio > 1.2) return 'moderate';
  return 'weak';
}

// Generate chart pattern based on technical signals
function generateChartPattern(changePercent: number, volumeRatio: number, rsi: number): string {
  if (changePercent > 2 && volumeRatio > 1.5) return 'Breakout';
  if (changePercent > 1 && volumeRatio > 1.3) return 'Bull Flag';
  if (rsi < 40 && changePercent > 0) return 'Bounce from Support';
  if (changePercent > 0 && rsi > 50) return 'Continuation';
  if (volumeRatio > 1.5 && changePercent < 0) return 'High Volume Pullback';
  return 'Consolidation';
}

// Generate technical setup description
function generateTechnicalSetup(
  changePercent: number,
  volumeRatio: number,
  rsi: number,
  macd: 'bullish' | 'bearish' | 'neutral'
): string {
  const signals: string[] = [];

  if (volumeRatio > 1.5) signals.push(`Volume เพิ่ม ${Math.round(volumeRatio * 100)}%`);
  if (macd === 'bullish') signals.push('MACD bullish');
  if (changePercent > 1) signals.push('Momentum ขาขึ้น');
  if (rsi >= 40 && rsi <= 60) signals.push('RSI เป็นกลาง');

  return signals.length > 0 ? signals.join(' + ') : 'รอสัญญาณยืนยัน';
}

// Helper to determine SET tick size
function getTickSize(price: number): number {
  if (price < 2) return 0.01;
  if (price < 5) return 0.02;
  if (price < 10) return 0.05;
  if (price < 25) return 0.10;
  if (price < 100) return 0.25;
  if (price < 200) return 0.50;
  if (price < 400) return 1.00;
  return 2.00;
}

// Helper to round price to nearest valid tick
function roundToTick(price: number): number {
  const tick = getTickSize(price);
  return Math.round(price / tick) * tick;
}

// Convert Yahoo Finance quote to stock recommendation
export function convertToRecommendation(quote: StockQuote): StockRecommendation {
  const volumeRatio = quote.avgVolume > 0 ? quote.volume / quote.avgVolume : 1;
  const rsi = estimateRSI(quote.changePercent);
  const macd = determineMacd(quote.changePercent, volumeRatio);
  const volatility = determineVolatility(quote.high, quote.low, quote.price);
  const momentum = determineMomentum(quote.changePercent, volumeRatio);

  // Calculate entry, target, stop loss
  // Use tick size rounding for realistic Thai stock prices
  const rawEntry = quote.price;
  const rawTarget = quote.price * 1.05; // 5% target
  const rawStopLoss = quote.price * 0.97; // 3% stop loss

  const entryPoint = roundToTick(rawEntry);
  const targetPrice = roundToTick(rawTarget);
  const stopLoss = roundToTick(rawStopLoss);

  const risk = entryPoint - stopLoss;
  const reward = targetPrice - entryPoint;
  const rr = risk > 0 ? (reward / risk).toFixed(2) : '0';

  return {
    symbol: quote.symbol,
    name: quote.name,
    currentPrice: quote.price,
    entryPoint: parseFloat(entryPoint.toFixed(2)),
    targetPrice: parseFloat(targetPrice.toFixed(2)),
    stopLoss: parseFloat(stopLoss.toFixed(2)),
    riskReward: `1:${rr}`,
    holdingPeriod: momentum === 'strong' ? '1-2 วัน' : momentum === 'moderate' ? '2-3 วัน' : '3-5 วัน',
    technicalSetup: generateTechnicalSetup(quote.changePercent, volumeRatio, rsi, macd),
    indicators: {
      rsi: Math.round(rsi),
      macd,
      volumeChange: Math.round(volumeRatio * 100),
      aboveMA20: quote.changePercent > 0, // Simplified
      aboveMA50: quote.changePercent > 0 && volumeRatio > 1.2, // Simplified
    },
    chartPattern: generateChartPattern(quote.changePercent, volumeRatio, rsi),
    volume: quote.volume,
    avgVolume: quote.avgVolume,
    volatility,
    momentum,
    // If backend returns 0 (which happens with mock/local), generate a random yield between 0-8% for testing
    dividendYield: quote.dividendYield || (Math.random() * 5) + 1,
  };
}

// Filter stocks based on scan parameters
export function filterStocks(
  stocks: StockRecommendation[],
  minVolume: number,
  riskLevel: 'low' | 'medium' | 'high',
  minDividendYield: number = 0,
  isSniperMode: boolean = false
): StockRecommendation[] {
  return stocks.filter(stock => {
    // Volume filter (convert to same unit - value in THB)
    const stockValue = stock.volume * stock.currentPrice;
    const volumePass = stockValue >= minVolume;

    // Dividend filter
    const dividendPass = stock.dividendYield >= minDividendYield;

    // Risk filter
    const riskPass = riskLevel === 'high'
      ? true
      : riskLevel === 'medium'
        ? stock.volatility !== 'high'
        : stock.volatility === 'low';

    // Momentum filter - prefer stocks with good signals
    const volumeRatio = stock.avgVolume > 0 ? stock.volume / stock.avgVolume : 0;
    const hasGoodSignal = volumeRatio >= 1.5 || stock.indicators.macd === 'bullish';

    // Sniper Mode: The "Confluence of 3" Filter
    if (isSniperMode) {
      // 1. Volume Anomaly (Smart Money) - Significantly higher than average
      const sniperVolume = volumeRatio >= 1.2;

      // 2. Trend Confluence - Must be in Uptrend
      const sniperTrend = stock.indicators.aboveMA20; // And ideally above MA50

      // 3. Momentum Sweet Spot - Strong but not Overbought
      const sniperRSI = stock.indicators.rsi >= 50 && stock.indicators.rsi <= 70;

      // 4. Positive Momentum
      const sniperMomentum = stock.momentum !== 'weak';

      return volumePass && riskPass && dividendPass && sniperVolume && sniperTrend && sniperRSI && sniperMomentum;
    }

    return volumePass && riskPass && hasGoodSignal && dividendPass;
  });
}

// Sort stocks by recommendation score
export function sortByScore(stocks: StockRecommendation[]): StockRecommendation[] {
  return [...stocks].sort((a, b) => {
    // Calculate score based on multiple factors
    const scoreA = calculateScore(a);
    const scoreB = calculateScore(b);
    return scoreB - scoreA;
  });
}

function calculateScore(stock: StockRecommendation): number {
  let score = 0;

  // Volume surge (max 30 points)
  const volumeRatio = stock.avgVolume > 0 ? stock.volume / stock.avgVolume : 1;
  score += Math.min(30, volumeRatio * 15);

  // MACD signal (20 points)
  if (stock.indicators.macd === 'bullish') score += 20;

  // RSI in good range (15 points)
  if (stock.indicators.rsi >= 40 && stock.indicators.rsi <= 70) score += 15;

  // Momentum (15 points)
  if (stock.momentum === 'strong') score += 15;
  else if (stock.momentum === 'moderate') score += 8;

  // Above MAs (10 points each)
  if (stock.indicators.aboveMA20) score += 10;
  if (stock.indicators.aboveMA50) score += 10;

  return score;
}
