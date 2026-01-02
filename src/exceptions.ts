/**
 * Custom exceptions for borsajs.
 */

export class BorsajsError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'BorsajsError';
        Object.setPrototypeOf(this, BorsajsError.prototype);
    }
}

export class TickerNotFoundError extends BorsajsError {
    public readonly symbol: string;
    constructor(symbol: string) {
        super(`Ticker not found: ${symbol}`);
        this.name = 'TickerNotFoundError';
        this.symbol = symbol;
        Object.setPrototypeOf(this, TickerNotFoundError.prototype);
    }
}

export class DataNotAvailableError extends BorsajsError {
    constructor(message: string = 'Data not available') {
        super(message);
        this.name = 'DataNotAvailableError';
        Object.setPrototypeOf(this, DataNotAvailableError.prototype);
    }
}

export class APIError extends BorsajsError {
    public readonly statusCode?: number;
    constructor(message: string, statusCode?: number) {
        super(statusCode ? `API Error: ${message} (status: ${statusCode})` : `API Error: ${message}`);
        this.name = 'APIError';
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, APIError.prototype);
    }
}

export class AuthenticationError extends BorsajsError {
    constructor(message: string = 'Authentication failed') {
        super(message);
        this.name = 'AuthenticationError';
        Object.setPrototypeOf(this, AuthenticationError.prototype);
    }
}

export class RateLimitError extends BorsajsError {
    constructor(message: string = 'Rate limit exceeded') {
        super(message);
        this.name = 'RateLimitError';
        Object.setPrototypeOf(this, RateLimitError.prototype);
    }
}

export class InvalidPeriodError extends BorsajsError {
    public readonly period: string;
    public static readonly VALID_PERIODS = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max'];
    constructor(period: string) {
        super(`Invalid period: ${period}. Valid: ${InvalidPeriodError.VALID_PERIODS.join(', ')}`);
        this.name = 'InvalidPeriodError';
        this.period = period;
        Object.setPrototypeOf(this, InvalidPeriodError.prototype);
    }
}

export class InvalidIntervalError extends BorsajsError {
    public readonly interval: string;
    public static readonly VALID_INTERVALS = ['1m', '5m', '15m', '30m', '1h', '1d', '1wk', '1mo'];
    constructor(interval: string) {
        super(`Invalid interval: ${interval}. Valid: ${InvalidIntervalError.VALID_INTERVALS.join(', ')}`);
        this.name = 'InvalidIntervalError';
        this.interval = interval;
        Object.setPrototypeOf(this, InvalidIntervalError.prototype);
    }
}
