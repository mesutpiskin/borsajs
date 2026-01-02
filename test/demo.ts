/**
 * Test script to verify borsajs APIs
 * Run with: npx tsx test/demo.ts
 */

import { Crypto, cryptoPairs } from '../src/crypto.js';
import { FX } from '../src/fx.js';
import { Ticker } from '../src/ticker.js';
import { Index, indices } from '../src/index-class.js';
import { Fund, searchFunds } from '../src/fund.js';
import { Inflation } from '../src/inflation.js';

async function testCrypto() {
    console.log('\n🪙 Testing Crypto (BtcTurk)...');
    console.log('─'.repeat(50));

    try {
        // Get BTC/TRY price
        const btc = new Crypto('BTCTRY');
        const current = await btc.getCurrent();
        console.log('BTC/TRY Current:', JSON.stringify(current, null, 2));

        // Get history
        const history = await btc.getHistory({ period: '5d', interval: '1d' });
        console.log(`\nBTC/TRY History (last 5 days): ${history.length} records`);
        if (history.length > 0) {
            console.log('Latest:', JSON.stringify(history[history.length - 1], null, 2));
        }

        // Get pairs
        const pairs = await cryptoPairs('TRY');
        console.log(`\nAvailable TRY pairs: ${pairs.slice(0, 10).join(', ')}...`);
    } catch (error) {
        console.error('Crypto Error:', error);
    }
}

async function testFX() {
    console.log('\n💱 Testing FX (doviz.com)...');
    console.log('─'.repeat(50));

    try {
        // USD/TRY
        const usd = new FX('USD');
        const current = await usd.getCurrent();
        console.log('USD/TRY Current:', JSON.stringify(current, null, 2));

        // Gram altın
        const gold = new FX('gram-altin');
        const goldCurrent = await gold.getCurrent();
        console.log('\nGram Altın Current:', JSON.stringify(goldCurrent, null, 2));

        // History
        const history = await usd.getHistory({ period: '5d' });
        console.log(`\nUSD/TRY History (last 5 days): ${history.length} records`);
        if (history.length > 0) {
            console.log('Latest:', JSON.stringify(history[history.length - 1], null, 2));
        }
    } catch (error) {
        console.error('FX Error:', error);
    }
}

async function testTicker() {
    console.log('\n📈 Testing Ticker (Paratic)...');
    console.log('─'.repeat(50));

    try {
        // THYAO
        const thyao = new Ticker('THYAO');
        const info = await thyao.getInfo();
        console.log('THYAO Info:', JSON.stringify(info, null, 2));

        // History
        const history = await thyao.getHistory({ period: '5d', interval: '1d' });
        console.log(`\nTHYAO History (last 5 days): ${history.length} records`);
        if (history.length > 0) {
            console.log('Latest:', JSON.stringify(history[history.length - 1], null, 2));
        }
    } catch (error) {
        console.error('Ticker Error:', error);
    }
}

async function testIndex() {
    console.log('\n📊 Testing Index (Paratic)...');
    console.log('─'.repeat(50));

    try {
        // Available indices
        const allIndices = indices();
        console.log('Available indices:', allIndices.slice(0, 10).join(', '));

        // XU100
        const xu100 = new Index('XU100');
        const info = await xu100.getInfo();
        console.log('\nXU100 Info:', JSON.stringify(info, null, 2));

        // History
        const history = await xu100.getHistory({ period: '5d' });
        console.log(`\nXU100 History (last 5 days): ${history.length} records`);
        if (history.length > 0) {
            console.log('Latest:', JSON.stringify(history[history.length - 1], null, 2));
        }
    } catch (error) {
        console.error('Index Error:', error);
    }
}

async function testFund() {
    console.log('\n🏦 Testing Fund (TEFAS)...');
    console.log('─'.repeat(50));

    try {
        // Search funds
        const results = await searchFunds('ak', 5);
        console.log('Search "ak":', JSON.stringify(results, null, 2));

        // Get fund info
        if (results.length > 0) {
            const fund = new Fund(results[0].fundCode);
            const info = await fund.getInfo();
            console.log(`\n${results[0].fundCode} Info:`, JSON.stringify(info, null, 2));
        }
    } catch (error) {
        console.error('Fund Error:', error);
    }
}

async function testInflation() {
    console.log('\n📉 Testing Inflation (TCMB)...');
    console.log('─'.repeat(50));

    try {
        const inf = new Inflation();

        // Latest
        const latest = await inf.getLatest();
        console.log('Latest TUFE:', JSON.stringify(latest, null, 2));

        // TUFE history
        const tufe = await inf.getTufe({ limit: 3 });
        console.log('\nTUFE last 3 months:', JSON.stringify(tufe, null, 2));

        // Calculate
        const calc = await inf.calculate(100000, '2020-01', '2024-01');
        console.log('\n100,000 TL (2020-01 → 2024-01):', JSON.stringify(calc, null, 2));
    } catch (error) {
        console.error('Inflation Error:', error);
    }
}

// Run all tests
async function main() {
    console.log('🚀 borsajs API Test');
    console.log('═'.repeat(50));

    await testCrypto();
    await testFX();
    await testTicker();
    await testIndex();
    await testFund();
    await testInflation();

    console.log('\n' + '═'.repeat(50));
    console.log('✅ All tests completed!');
}

main().catch(console.error);
