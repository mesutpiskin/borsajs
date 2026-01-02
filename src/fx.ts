/**
 * FX class for forex and commodity data.
 */
import { getDovizcomProvider, FXCurrentData, FXHistoryData, HistoryOptions } from './providers/dovizcom.js';

export class FX {
    private readonly _asset: string;
    private _currentCache: FXCurrentData | null = null;

    constructor(asset: string) { this._asset = asset; }
    get asset(): string { return this._asset; }
    get symbol(): string { return this._asset; }

    async getCurrent(): Promise<FXCurrentData> {
        if (!this._currentCache) this._currentCache = await getDovizcomProvider().getCurrent(this._asset);
        return this._currentCache;
    }

    async getInfo(): Promise<FXCurrentData> { return this.getCurrent(); }

    async getHistory(options: HistoryOptions = {}): Promise<FXHistoryData[]> {
        return getDovizcomProvider().getHistory(this._asset, options);
    }

    toString(): string { return `FX('${this._asset}')`; }
}
