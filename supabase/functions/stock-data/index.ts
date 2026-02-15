
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Initialize Supabase Client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  avgVolume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  marketCap?: number;
  dividendYield?: number;
  rsi?: number;
  macdSignal?: 'bullish' | 'bearish' | 'neutral';
}

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Technical Analysis Helpers
function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  // Calculate initial average gain/loss
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change >= 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Calculate subsequent values using Wilder's Smoothing
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    const gain = change >= 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = ((avgGain * (period - 1)) + gain) / period;
    avgLoss = ((avgLoss * (period - 1)) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateEMA(prices: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const emaArray: number[] = [];

  if (prices.length < period) return [];

  // Initialize with SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
  }
  let ema = sum / period;
  emaArray.push(ema);

  // Calculate EMA
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] * k) + (ema * (1 - k));
    emaArray.push(ema);
  }

  return emaArray;
}

function calculateMACD(prices: number[]): 'bullish' | 'bearish' | 'neutral' {
  if (prices.length < 26) return 'neutral';

  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);

  // Align EMAs to the end of the price array
  const macdLine: number[] = [];
  const offset = 26 - 12; // 14

  for (let i = 0; i < ema26.length; i++) {
    macdLine.push(ema12[i + offset] - ema26[i]);
  }

  if (macdLine.length < 9) return 'neutral';

  // Signal Line = EMA(9) of MACD Line
  const signalLine = calculateEMA(macdLine, 9);

  // Check latest values
  const currentMACD = macdLine[macdLine.length - 1];
  const currentSignal = signalLine[signalLine.length - 1];
  const prevMACD = macdLine[macdLine.length - 2];
  const prevSignal = signalLine[signalLine.length - 2];

  // Crossover strategy
  if (currentMACD > currentSignal && prevMACD <= prevSignal) return 'bullish';
  if (currentMACD < currentSignal && prevMACD >= prevSignal) return 'bearish';

  // Trend following (if no recent crossover)
  if (currentMACD > currentSignal && currentMACD > 0) return 'bullish';
  if (currentMACD < currentSignal && currentMACD < 0) return 'bearish';

  return 'neutral';
}

// Fetch fundamental data (Dividend Yield) from Yahoo Finance Quote Summary
async function fetchFundamentals(symbol: string) {
  try {
    const yahooSymbol = symbol.includes('.') ? symbol : `${symbol}.BK`;
    // summaryDetail module contains dividendYield and trailingAnnualDividendYield
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${yahooSymbol}?modules=summaryDetail,defaultKeyStatistics`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) return null;

    const data = await response.json();
    const summary = data.quoteSummary?.result?.[0]?.summaryDetail;
    const keyStats = data.quoteSummary?.result?.[0]?.defaultKeyStatistics;

    if (!summary) return null;

    // Prioritize values
    let yieldValue = summary.dividendYield?.raw || summary.trailingAnnualDividendYield?.raw || 0;
    // Turn into percentage (e.g. 0.05 -> 5.0)
    yieldValue = yieldValue * 100;

    return {
      symbol: symbol.replace('.BK', ''),
      dividend_yield: yieldValue,
      pe_ratio: summary.trailingPE?.raw || null,
      market_cap: summary.marketCap?.raw || null
    };

  } catch (error) {
    console.error(`Error fetching fundamentals for ${symbol}:`, error);
    return null;
  }
}

async function fetchYahooFinanceQuote(symbol: string): Promise<StockQuote | null> {
  try {
    const yahooSymbol = symbol.includes('.') ? symbol : `${symbol}.BK`;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=3mo`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${symbol}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];

    if (!result) return null;

    const meta = result.meta;
    const quote = result.indicators?.quote?.[0];
    const timestamps = result.timestamp || [];

    // Get the latest available closing price
    const latestIndex = timestamps.length - 1;
    // previous close index
    const prevIndex = latestIndex - 1;

    const currentPrice = meta.regularMarketPrice || quote?.close?.[latestIndex] || 0;
    const previousClose = meta.previousClose || meta.chartPreviousClose || quote?.close?.[prevIndex] || currentPrice;

    const change = currentPrice - previousClose;
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

    const volumes = quote?.volume?.slice(-20) || [];
    const avgVolume = volumes.length > 0
      ? volumes.reduce((a: number, b: number) => (a || 0) + (b || 0), 0) / volumes.length
      : 0;

    const closePrices = quote?.close || [];
    const validClosePrices = closePrices.filter((p: number | null) => p !== null) as number[];

    const rsi = calculateRSI(validClosePrices, 14);
    const macdSignal = calculateMACD(validClosePrices);

    return {
      symbol: symbol.replace('.BK', ''),
      name: meta.shortName || meta.symbol || symbol,
      price: currentPrice,
      change: change,
      changePercent: changePercent,
      volume: quote?.volume?.[latestIndex] || 0,
      avgVolume: Math.round(avgVolume),
      high: quote?.high?.[latestIndex] || meta.regularMarketDayHigh || 0,
      low: quote?.low?.[latestIndex] || meta.regularMarketDayLow || 0,
      open: quote?.open?.[latestIndex] || meta.regularMarketOpen || 0,
      previousClose: previousClose,
      marketCap: meta.marketCap,
      rsi: Math.round(rsi),
      macdSignal: macdSignal,
      // Default to 0, will be enriched with DB data later
      dividendYield: 0
    };
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error);
    return null;
  }
}

async function fetchHistoricalData(symbol: string): Promise<CandleData[]> {
  try {
    const yahooSymbol = symbol.includes('.') ? symbol : `${symbol}.BK`;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1mo`;
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!response.ok) return [];
    const data = await response.json();
    const result = data.chart?.result?.[0];
    if (!result) return [];
    const timestamps = result.timestamp || [];
    const quote = result.indicators?.quote?.[0];
    if (!quote) return [];
    const candles: CandleData[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const open = quote.open?.[i];
      const high = quote.high?.[i];
      const low = quote.low?.[i];
      const close = quote.close?.[i];
      const volume = quote.volume?.[i];
      if (open != null && high != null && low != null && close != null) {
        candles.push({
          time: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
          open, high, low, close, volume: volume || 0
        });
      }
    }
    return candles;
  } catch { return []; }
}

const DEFAULT_SET_STOCKS = [
  'PTT', 'AOT', 'CPALL', 'SCC', 'ADVANC', 'KBANK', 'SCB', 'BBL', 'GULF', 'BDMS',
  'TRUE', 'DELTA', 'BEM', 'BTS', 'PTTEP', 'PTTGC', 'IVL', 'MINT', 'CPN', 'INTUCH'
];

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Robust Body Parsing
    let body: any = {};
    try {
      const text = await req.text();
      if (text) body = JSON.parse(text);
    } catch (e) {
      console.warn("Invalid JSON body received, using defaults");
    }

    // Default values if body is empty
    const { symbols, action = 'scan', symbol } = body;

    // 1. Historical Data
    if (action === 'historical' && symbol) {
      const candles = await fetchHistoricalData(symbol);
      return new Response(
        JSON.stringify({ candles, symbol, timestamp: new Date().toISOString() }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 2. Update Fundamentals (Triggered via UI or Cron)
    if (action === 'update-fundamentals') {
      const targetSymbols = symbols || DEFAULT_SET_STOCKS;
      console.log(`Updating fundamentals for ${targetSymbols.length} stocks...`);

      let successCount = 0;
      const results = [];

      // Process in chunks
      const CHUNK_SIZE = 5;
      // Limit total to 20 for prototype safety unless explicitly requested more
      const SAFE_LIMIT = 50;
      const limitedSymbols = targetSymbols.slice(0, SAFE_LIMIT);

      for (let i = 0; i < limitedSymbols.length; i += CHUNK_SIZE) {
        const chunk = limitedSymbols.slice(i, i + CHUNK_SIZE);
        const promises = chunk.map((s: string) => fetchFundamentals(s));
        const data = await Promise.all(promises);

        for (const item of data) {
          if (item) {
            const { error } = await supabase
              .from('stock_fundamentals')
              .upsert({
                symbol: item.symbol,
                dividend_yield: item.dividend_yield,
                pe_ratio: item.pe_ratio,
                market_cap: item.market_cap,
                updated_at: new Date().toISOString()
              }, { onConflict: 'symbol' });

            if (!error) successCount++;
            results.push(item);
          }
        }
        // Small delay to be nice to API
        await new Promise(r => setTimeout(r, 500));
      }

      return new Response(
        JSON.stringify({
          message: `Updated fundamentals for ${successCount}/${limitedSymbols.length} stocks`,
          results
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 2.1 Update Settings (Bypass RLS via Service Role)
    if (action === 'update-settings') {
      const { key, value } = body;
      if (!key || !value) {
        return new Response(
          JSON.stringify({ error: "Missing key or value" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const { error } = await supabase
        .from('stock_settings')
        .upsert({
          key,
          value,
          updated_at: new Date().toISOString()
        });

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      return new Response(
        JSON.stringify({ message: "Settings updated successfully" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 3. Scan / Get Quotes
    let stockSymbols: string[] = [];

    if (action === 'scan' || !action) {
      if (symbols && Array.isArray(symbols)) {
        stockSymbols = symbols;
      } else {
        const { data: settingData } = await supabase
          .from('stock_settings')
          .select('value')
          .eq('key', 'SET100_LIST')
          .single();

        if (settingData?.value && Array.isArray(settingData.value)) {
          stockSymbols = settingData.value;
        } else {
          stockSymbols = DEFAULT_SET_STOCKS;
        }
      }
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid Action" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch Live Quotes
    // Limit to 50 for performance in prototype
    // const effectiveSymbols = stockSymbols.slice(0, 50); 

    const quotes = await Promise.all(
      stockSymbols.map(symbol => fetchYahooFinanceQuote(symbol))
    );
    const validQuotes = quotes.filter((q): q is StockQuote => q !== null);

    // Enrich with Fundamental Data from DB
    if (validQuotes.length > 0) {
      const quoteSymbols = validQuotes.map(q => q.symbol);
      const { data: fundamentals } = await supabase
        .from('stock_fundamentals')
        .select('symbol, dividend_yield')
        .in('symbol', quoteSymbols);

      const fundMap = new Map();
      if (fundamentals) {
        fundamentals.forEach((f: any) => fundMap.set(f.symbol, f.dividend_yield));
      }

      // Merge logic
      validQuotes.forEach(q => {
        // Use DB yield if available, else 0. 
        q.dividendYield = fundMap.get(q.symbol) || 0;
      });
    }

    return new Response(
      JSON.stringify({ quotes: validQuotes, timestamp: new Date().toISOString() }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in stock-data function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
