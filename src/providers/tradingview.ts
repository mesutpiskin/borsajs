
import WebSocket from 'ws';
import { BaseProvider } from './base.js';
import { APIError } from '../exceptions.js';

export interface TradingViewQuote {
    symbol: string;
    exchange: string;
    last: number;
    change: number;
    changePercent: number;
    open: number;
    high: number;
    low: number;
    prevClose: number;
    volume: number;
    bid: number;
    ask: number;
    bidSize: number;
    askSize: number;
    timestamp: number;
    description: string;
    currency: string;
}

export interface TradingViewBar {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export class TradingViewProvider extends BaseProvider {
    private static readonly WS_URL = "wss://data.tradingview.com/socket.io/websocket";
    private static readonly ORIGIN = "https://www.tradingview.com";

    private static readonly TIMEFRAMES: Record<string, string> = {
        "1m": "1",
        "5m": "5",
        "15m": "15",
        "30m": "30",
        "1h": "60",
        "4h": "240",
        "1d": "1D",
        "1wk": "1W",
        "1w": "1W",
        "1mo": "1M",
    };

    private static readonly PERIOD_DAYS: Record<string, number> = {
        "1d": 1,
        "5d": 5,
        "1mo": 30,
        "3mo": 90,
        "6mo": 180,
        "1y": 365,
        "2y": 730,
        "5y": 1825,
        "10y": 3650,
        "ytd": 365,
        "max": 3650,
    };

    constructor() {
        super();
    }

    private _generateSessionId(prefix: string = "cs"): string {
        const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        let randomPart = "";
        for (let i = 0; i < 12; i++) {
            randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return `${prefix}_${randomPart}`;
    }

    private _formatPacket(data: string): string {
        return `~m~${data.length}~m~${data}`;
    }

    private _createMessage(method: string, params: any[]): string {
        const msg = JSON.stringify({ m: method, p: params });
        return this._formatPacket(msg);
    }

    private _parsePackets(raw: string): any[] {
        const packets: any[] = [];
        const parts = raw.split(/~m~\d+~m~/);
        for (const part of parts) {
            if (!part || part.startsWith("~h~")) continue;
            try {
                packets.push(JSON.parse(part));
            } catch (e) {
                continue;
            }
        }
        return packets;
    }

    private _calculateBars(period: string, interval: string, start?: Date, end?: Date): number {
        let days = 30;
        if (start && end) {
            days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        } else if (start) {
            days = Math.ceil((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24));
        } else if (period === "ytd") {
            const now = new Date();
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            days = Math.ceil((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
        } else {
            days = TradingViewProvider.PERIOD_DAYS[period] || 30;
        }

        const intervalMinutesMap: Record<string, number> = {
            "1m": 1, "5m": 5, "15m": 15, "30m": 30,
            "1h": 60, "4h": 240, "1d": 1440, "1wk": 10080, "1w": 10080, "1mo": 43200,
        };
        const intervalMinutes = intervalMinutesMap[interval] || 1440;
        const tradingMinutesPerDay = intervalMinutes < 1440 ? 510 : 1440;

        const bars = Math.ceil((days * tradingMinutesPerDay) / intervalMinutes);
        return Math.max(bars, 10);
    }

    public async getHistory(
        symbol: string,
        period: string = "1mo",
        interval: string = "1d",
        start?: Date,
        end?: Date,
        exchange: string = "BIST"
    ): Promise<TradingViewBar[]> {
        // Normalize symbol
        const cleanSymbol = symbol.toUpperCase().replace(".IS", "").replace(".E", "");
        const tvSymbol = `${exchange}:${cleanSymbol}`;
        const tf = TradingViewProvider.TIMEFRAMES[interval] || "1D";
        const bars = this._calculateBars(period, interval, start, end);
        const chartSession = this._generateSessionId("cs");

        return new Promise((resolve, reject) => {
            const ws = new WebSocket(`${TradingViewProvider.WS_URL}?type=chart`, {
                headers: { "Origin": TradingViewProvider.ORIGIN }
            });

            const periods: Record<number, TradingViewBar> = {};
            let dataReceived = false;
            let errorMsg: string | null = null;
            let timeoutId: NodeJS.Timeout;

            const cleanup = () => {
                clearTimeout(timeoutId);
                ws.close();
            };

            ws.on('open', () => {
                ws.send(this._createMessage("set_auth_token", ["unauthorized_user_token"]));
                ws.send(this._createMessage("chart_create_session", [chartSession, ""]));

                const symbolConfig = {
                    symbol: tvSymbol,
                    adjustment: "splits",
                    session: "regular",
                };
                ws.send(this._createMessage("resolve_symbol", [
                    chartSession,
                    "ser_1",
                    `=${JSON.stringify(symbolConfig)}`
                ]));

                ws.send(this._createMessage("create_series", [
                    chartSession,
                    "$prices",
                    "s1",
                    "ser_1",
                    tf,
                    bars,
                    "",
                ]));
            });

            ws.on('message', (data: WebSocket.Data) => {
                const message = data.toString();
                const packets = this._parsePackets(message);

                for (const packet of packets) {
                    if (typeof packet !== 'object') continue;

                    const method = packet.m;
                    const params = packet.p || [];

                    if (method === "timescale_update") {
                        if (params[1] && typeof params[1] === 'object') {
                            const seriesData = params[1]["$prices"]?.s || [];
                            for (const candle of seriesData) {
                                const v = candle.v || [];
                                if (v.length >= 6) {
                                    const ts = Math.floor(v[0]); // Keep as timestamp (seconds usually, but TV uses seconds in protocol mostly, check if needs ms conversion)
                                    // Actually TV websocket usually sends seconds, but let's check
                                    // Python code: ts = int(v[0]) -> periods[ts] = ...
                                    // It seems v[0] is seconds based on typical TV API
                                    periods[ts] = {
                                        time: ts,
                                        open: v[1],
                                        high: v[2],
                                        low: v[3],
                                        close: v[4],
                                        volume: v[5],
                                    };
                                }
                            }
                            dataReceived = true;
                        }
                    } else if (method === "series_completed") {
                        dataReceived = true;
                    } else if (method === "critical_error" || method === "symbol_error") {
                        errorMsg = JSON.stringify(params);
                        cleanup();
                        reject(new APIError(`TradingView error: ${errorMsg}`));
                    }
                }

                if (dataReceived) {
                    // Logic to ensure we have enough data or just resolve quickly
                    // For simplicity, resolve on first valid data batch or small delay
                    // In Python code it waits until data_received is True
                     cleanup();
                     const sortedBars = Object.values(periods).sort((a, b) => a.time - b.time);
                     resolve(sortedBars);
                }
            });

            ws.on('error', (err) => {
                cleanup();
                reject(new APIError(`WebSocket error: ${err.message}`));
            });

            timeoutId = setTimeout(() => {
                cleanup();
                if (dataReceived) { // Should have been handled above, but just in case
                     const sortedBars = Object.values(periods).sort((a, b) => a.time - b.time);
                     resolve(sortedBars);
                } else {
                    reject(new APIError("Timeout waiting for TradingView data"));
                }
            }, 10000); // 10s timeout
        });
    }

    public async getQuote(symbol: string, exchange: string = "BIST"): Promise<TradingViewQuote> {
        const cleanSymbol = symbol.toUpperCase().replace(".IS", "").replace(".E", "");
        const tvSymbol = `${exchange}:${cleanSymbol}`;
        const quoteSession = this._generateSessionId("qs");

        return new Promise((resolve, reject) => {
            const ws = new WebSocket(`${TradingViewProvider.WS_URL}?type=chart`, {
                 headers: { "Origin": TradingViewProvider.ORIGIN }
            });

            let rawData: any = {};
            let dataComplete = false;
            let errorMsg: string | null = null;
            let timeoutId: NodeJS.Timeout;

            const cleanup = () => {
                clearTimeout(timeoutId);
                ws.close();
            };

            ws.on('open', () => {
                ws.send(this._createMessage("set_auth_token", ["unauthorized_user_token"]));
                ws.send(this._createMessage("quote_create_session", [quoteSession]));
                
                const fields = [
                    "lp", "ch", "chp", "open_price", "high_price", "low_price",
                    "prev_close_price", "volume", "bid", "ask", "bid_size", "ask_size",
                    "lp_time", "description", "currency_code", "exchange", "type"
                ];
                ws.send(this._createMessage("quote_set_fields", [quoteSession, ...fields]));
                ws.send(this._createMessage("quote_add_symbols", [quoteSession, tvSymbol]));
            });

            ws.on('message', (data: WebSocket.Data) => {
                const message = data.toString();
                const packets = this._parsePackets(message);

                for (const packet of packets) {
                    if (typeof packet !== 'object') continue;

                    const method = packet.m;
                    const params = packet.p || [];

                    if (method === "qsd") {
                        if (params[1] && typeof params[1] === 'object') {
                            const v = params[1].v || {};
                            rawData = { ...rawData, ...v };
                            if ("lp" in rawData) {
                                dataComplete = true;
                            }
                        }
                    } else if (method === "critical_error" || method === "symbol_error") {
                        errorMsg = JSON.stringify(params);
                        cleanup();
                        reject(new APIError(`TradingView error: ${errorMsg}`));
                    }
                }

                if (dataComplete) {
                     // Wait a tiny bit more to ensure we get most fields? 
                     // Or just resolve immediately? Python code waits loop style.
                     // Here we can use a small debounce or just resolve if we have 'lp'
                     setTimeout(() => {
                        cleanup();
                        resolve({
                            symbol: symbol,
                            exchange: exchange,
                            last: rawData.lp,
                            change: rawData.ch,
                            changePercent: rawData.chp,
                            open: rawData.open_price,
                            high: rawData.high_price,
                            low: rawData.low_price,
                            prevClose: rawData.prev_close_price,
                            volume: rawData.volume,
                            bid: rawData.bid,
                            ask: rawData.ask,
                            bidSize: rawData.bid_size,
                            askSize: rawData.ask_size,
                            timestamp: rawData.lp_time,
                            description: rawData.description,
                            currency: rawData.currency_code
                        });
                     }, 200);
                }
            });

             ws.on('error', (err) => {
                cleanup();
                reject(new APIError(`WebSocket error: ${err.message}`));
            });

            timeoutId = setTimeout(() => {
                if (dataComplete) return; // Should have been handled
                cleanup();
                reject(new APIError("Timeout waiting for TradingView quote"));
            }, 10000);
        });
    }
}

// Singleton instance
let _provider: TradingViewProvider | null = null;

export function getTradingViewProvider(): TradingViewProvider {
    if (!_provider) {
        _provider = new TradingViewProvider();
    }
    return _provider;
}
