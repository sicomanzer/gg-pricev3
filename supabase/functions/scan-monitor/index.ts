
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Initialize Supabase Client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Interfaces for Stock Logic (Reused from client, simplistic version)
interface StockQuote {
    symbol: string;
    price: number;
    changePercent: number;
    volume: number;
    avgVolume: number;
}

// Reuse logic from stock-data (Simplified for bot)
// In a real repo, we would share code via a shared module
async function fetchYahooFinanceQuote(symbol: string): Promise<StockQuote | null> {
    try {
        const yahooSymbol = symbol.includes('.') ? symbol : `${symbol}.BK`;
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=5d`;
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!res.ok) return null;
        const data = await res.json();
        const result = data.chart?.result?.[0];
        if (!result) return null;

        const meta = result.meta;
        const quote = result.indicators?.quote?.[0];
        const latestIndex = (result.timestamp || []).length - 1;

        const currentPrice = meta.regularMarketPrice || quote?.close?.[latestIndex] || 0;
        const previousClose = meta.previousClose || meta.chartPreviousClose || 0;
        const changePercent = previousClose > 0 ? ((currentPrice - previousClose) / previousClose) * 100 : 0;

        const volumes = quote?.volume?.slice(-20) || [];
        const avgVolume = volumes.reduce((a: number, b: number) => a + b, 0) / (volumes.length || 1);
        const volume = quote?.volume?.[latestIndex] || 0;

        return {
            symbol: symbol.replace('.BK', ''),
            price: currentPrice,
            changePercent,
            volume,
            avgVolume
        };
    } catch { return null; }
}

async function sendTelegramMessage(token: string, chatId: string, message: string) {
    if (!token || !chatId) return;
    try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML',
            }),
        });
    } catch (e) {
        console.error("Telegram Error:", e);
    }
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        console.log("Starting Auto-Scan Monitor...");

        // 1. Get Telegram Config from DB (Use the table we created? or Settings?)
        // Ideally we should store secrets in Vault, but for this prototype we user 'stock_settings'
        // We need to fetch the tokens. But wait! The tokens are in LocalStorage on Client side!
        // To run on Server, we MUST store them in DB.
        // Let's check 'stock_settings' for 'TELEGRAM_CONFIG'

        // Fetch Settings
        const { data: settings } = await supabase.from('stock_settings').select('key, value').in('key', ['SET100_LIST', 'TELEGRAM_CONFIG']);

        const set100List = settings?.find(s => s.key === 'SET100_LIST')?.value || [];
        const tgConfig = settings?.find(s => s.key === 'TELEGRAM_CONFIG')?.value;

        if (!tgConfig || !tgConfig.token || !tgConfig.chatId) {
            return new Response(JSON.stringify({ message: "No Telegram Config found. Skipping." }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const symbols: string[] = Array.isArray(set100List) ? set100List : ['PTT', 'AOT', 'CPALL']; // Fallback

        // 2. Scan Stocks
        // Limit to 20 to avoid timeouts in free tier edge function
        const scanSymbols = symbols.slice(0, 20);
        const quotes = await Promise.all(scanSymbols.map(fetchYahooFinanceQuote));
        const validQuotes = quotes.filter((q): q is StockQuote => q !== null);

        // 3. Apply "Sniper" Logic (Simplified)
        // Volume > 1.5x Avg AND Price Up > 1%
        const signals = validQuotes.filter(q => {
            const volumeRatio = q.avgVolume > 0 ? q.volume / q.avgVolume : 0;
            return volumeRatio > 1.5 && q.changePercent > 1.0;
        });

        // 4. Send Alerts
        if (signals.length > 0) {
            const messageHeader = `🤖 <b>AUTO-BOT SCAN REPORT</b> (${new Date().toLocaleTimeString('th-TH')})\n\n`;
            const messageBody = signals.map(s =>
                `🚀 <b>${s.symbol}</b>\n` +
                `Price: ${s.price.toFixed(2)} (${s.changePercent > 0 ? '+' : ''}${s.changePercent.toFixed(2)}%)\n` +
                `Vol: ${(s.volume / s.avgVolume).toFixed(1)}x Avg`
            ).join('\n\n');

            await sendTelegramMessage(tgConfig.token, tgConfig.chatId, messageHeader + messageBody);

            return new Response(JSON.stringify({ message: `Sent alerts for ${signals.length} stocks`, signals }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        return new Response(JSON.stringify({ message: "No signals found", scanned: validQuotes.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } catch (error: any) {
        console.error(error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
});
