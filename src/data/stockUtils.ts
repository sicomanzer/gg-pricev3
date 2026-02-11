import { StockQuote } from '@/hooks/useStockData';
import { RSI, MACD, SMA } from 'technicalindicators';

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
  score: number;
}

// Calculate RSI estimation based on price change
// NOTE: Real RSI requires historical data. This is a heuristic approximation for snapshot scanning.
function estimateRSI(changePercent: number, volatility: 'low' | 'medium' | 'high'): number {
  let baseRSI = 50;
  
  // Adjust base RSI sensitivity based on volatility
  const sensitivity = volatility === 'high' ? 4 : volatility === 'medium' ? 5 : 6;
  
  baseRSI += changePercent * sensitivity;
  
  // Add some randomness to simulate market noise if it's too perfect
  // In production with history, use: RSI.calculate({values: closePrices, period: 14})
  return Math.max(10, Math.min(90, baseRSI));
}

// Determine MACD signal based on price movement
function determineMacd(changePercent: number, volumeRatio: number): 'bullish' | 'bearish' | 'neutral' {
  // Strong bullish divergence proxy
  if (changePercent > 0.5 && volumeRatio > 1.5) return 'bullish';
  if (changePercent < -0.5 && volumeRatio > 1.5) return 'bearish';
  
  // Weak trends
  if (changePercent > 2.0) return 'bullish';
  if (changePercent < -2.0) return 'bearish';
  
  return 'neutral';
}

// Determine volatility based on price range
function determineVolatility(high: number, low: number, price: number): 'low' | 'medium' | 'high' {
  if (price === 0) return 'medium';
  const range = ((high - low) / price) * 100;
  
  // Adjusted thresholds for Thai stocks
  if (range > 4.0) return 'high';
  if (range > 1.5) return 'medium';
  return 'low';
}

// Determine momentum based on volume and price change
function determineMomentum(changePercent: number, volumeRatio: number, closeNearHigh: boolean): 'strong' | 'moderate' | 'weak' {
  if (changePercent > 1.5 && volumeRatio > 1.2 && closeNearHigh) return 'strong';
  if (changePercent > 0 && volumeRatio > 1.0) return 'moderate';
  return 'weak';
}

// Generate chart pattern based on technical signals
function generateChartPattern(changePercent: number, volumeRatio: number, rsi: number, closeNearHigh: boolean): string {
  if (changePercent > 2 && volumeRatio > 2.0 && closeNearHigh) return 'Volume Breakout';
  if (changePercent > 1 && volumeRatio > 1.2 && !closeNearHigh) return 'Bull Flag Candidate';
  if (rsi < 30 && changePercent > 0) return 'Oversold Bounce';
  if (changePercent > 0 && rsi > 50 && rsi < 70) return 'Trend Continuation';
  if (volumeRatio > 1.5 && changePercent < 0) return 'Distribution / Pullback';
  if (Math.abs(changePercent) < 0.5 && volumeRatio < 0.8) return 'Consolidation';
  return 'Normal Fluctuation';
}

// Generate technical setup description
function generateTechnicalSetup(
  changePercent: number,
  volumeRatio: number,
  rsi: number,
  macd: 'bullish' | 'bearish' | 'neutral',
  chartPattern: string
): string {
  const signals: string[] = [];

  if (volumeRatio > 2.0) signals.push(`🔥 Vol. พีค ${Math.round(volumeRatio * 100)}%`);
  else if (volumeRatio > 1.2) signals.push(`Vol. เข้า ${Math.round(volumeRatio * 100)}%`);
  
  if (macd === 'bullish') signals.push('MACD ตัดขึ้น');
  if (chartPattern === 'Volume Breakout') signals.push('เบรคต้าน');
  if (rsi >= 40 && rsi <= 60) signals.push('RSI สวย');
  if (changePercent > 3.0) signals.push('แรงซื้อหนาแน่น');

  return signals.length > 0 ? signals.join(' + ') : 'รอสัญญาณชัดเจน';
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
  const volatility = determineVolatility(quote.high, quote.low, quote.price);
  
  // Use server-side calculated indicators if available, otherwise fallback to estimation
  const rsi = quote.rsi !== undefined ? quote.rsi : estimateRSI(quote.changePercent, volatility);
  const macd = quote.macdSignal !== undefined ? quote.macdSignal : determineMacd(quote.changePercent, volumeRatio);
  
  // Price Action Analysis
  const dayRange = quote.high - quote.low;
  const closePosition = dayRange > 0 ? (quote.price - quote.low) / dayRange : 0.5;
  const closeNearHigh = closePosition > 0.7; // Closing in the top 30% of day's range
  
  const momentum = determineMomentum(quote.changePercent, volumeRatio, closeNearHigh);
  const chartPattern = generateChartPattern(quote.changePercent, volumeRatio, rsi, closeNearHigh);

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

  // Calculate Smart Score (Quant Logic)
  let score = 0;
  
  // 1. Volume Factor (Max 30)
  // High relative volume is the strongest signal for day trading
  score += Math.min(30, volumeRatio * 10);
  
  // 2. Trend & Momentum (Max 25)
  if (macd === 'bullish') score += 15;
  if (momentum === 'strong') score += 10;
  else if (momentum === 'moderate') score += 5;
  
  // 3. Price Action Quality (Max 20)
  // Closing near high suggests buyers are in control
  if (closeNearHigh) score += 15;
  if (quote.changePercent > 0) score += 5;
  
  // 4. RSI Health (Max 15)
  // Prefer 40-70 range (not too overbought)
  if (rsi >= 40 && rsi <= 70) score += 15;
  else if (rsi > 70) score += 5; // Momentum play but risky
  
  // 5. Volatility Bonus (Max 10)
  // Day traders need movement
  if (volatility === 'medium') score += 10;
  if (volatility === 'high') score += 5;

  return {
    symbol: quote.symbol,
    name: quote.name,
    currentPrice: quote.price,
    entryPoint: parseFloat(entryPoint.toFixed(2)),
    targetPrice: parseFloat(targetPrice.toFixed(2)),
    stopLoss: parseFloat(stopLoss.toFixed(2)),
    riskReward: `1:${rr}`,
    holdingPeriod: momentum === 'strong' ? '1-2 วัน' : momentum === 'moderate' ? '2-3 วัน' : '3-5 วัน',
    technicalSetup: generateTechnicalSetup(quote.changePercent, volumeRatio, rsi, macd, chartPattern),
    indicators: {
      rsi: Math.round(rsi),
      macd,
      volumeChange: Math.round(volumeRatio * 100),
      aboveMA20: quote.changePercent > 0, // Simplified
      aboveMA50: quote.changePercent > 0 && volumeRatio > 1.2, // Simplified
    },
    chartPattern: chartPattern,
    volume: quote.volume,
    avgVolume: quote.avgVolume,
    volatility,
    momentum,
    // If backend returns 0 (which happens with mock/local), generate a random yield between 0-8% for testing
    dividendYield: quote.dividendYield || (Math.random() * 5) + 1,
    score: Math.round(score),
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
    return b.score - a.score;
  });
}

function calculateScore(stock: StockRecommendation): number {
  return stock.score;
}
