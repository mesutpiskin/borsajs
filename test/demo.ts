/**
 * Test script for borsajs APIs
 * Run with: npx tsx test/demo.ts
 */
import { Crypto, cryptoPairs } from '../src/crypto.js';
import { FX } from '../src/fx.js';
import { Fund, searchFunds } from '../src/fund.js';
import { Index, indices } from '../src/index-class.js';
import { Inflation } from '../src/inflation.js';
import { Ticker } from '../src/ticker.js';
import { symbols, searchSymbols, cryptoSymbols, fxSymbols, indexSymbols } from '../src/market.js';

async function testCrypto() {
    console.log('\n🪙 CRYPTO (BtcTurk)');
    console.log('─'.repeat(60));
    try {
        const btc = new Crypto('BTCTRY');
        const current = await btc.getCurrent();
        console.log('BTC/TRY:', JSON.stringify(current, null, 2));

        const pairs = await cryptoPairs('TRY');
        console.log(`\nAvailable pairs: ${pairs.slice(0, 10).join(', ')}... (${pairs.length} total)`);
    } catch (error) { console.error('Error:', error); }
}

async function testFX() {
    console.log('\n💱 FX (doviz.com)');
    console.log('─'.repeat(60));
    try {
        const usd = new FX('USD');
        const current = await usd.getCurrent();
        console.log('USD/TRY:', JSON.stringify(current, null, 2));

        const gold = new FX('gram-altin');
        const goldCurrent = await gold.getCurrent();
        console.log('\nGold (gram):', JSON.stringify(goldCurrent, null, 2));

        console.log(`\nFX Symbols: ${fxSymbols.slice(0, 10).join(', ')}...`);
    } catch (error) { console.error('Error:', error); }
}

async function testTicker() {
    console.log('\n📈 TICKER (Paratic)');
    console.log('─'.repeat(60));
    try {
        const stock = new Ticker('THYAO');
        const info = await stock.getInfo();
        console.log('THYAO:', JSON.stringify(info, null, 2));

        const history = await stock.getHistory({ period: '5d', interval: '1d' });
        console.log(`\nHistory (5d): ${history.length} records`);
        if (history.length > 0) console.log('Last:', JSON.stringify(history[history.length - 1], null, 2));
    } catch (error) { console.error('Error:', error); }
}

async function testIndex() {
    console.log('\n📊 INDEX (Paratic)');
    console.log('─'.repeat(60));
    try {
        console.log('Index Symbols:', indexSymbols.slice(0, 10).join(', '));

        const xu100 = new Index('XU100');
        const info = await xu100.getInfo();
        console.log('\nXU100:', JSON.stringify(info, null, 2));
    } catch (error) { console.error('Error:', error); }
}

async function testFund() {
    console.log('\n🏦 FUND (TEFAS)');
    console.log('─'.repeat(60));
    try {
        const results = await searchFunds('ak', 3);
        console.log('Search "ak":', JSON.stringify(results, null, 2));

        if (results.length > 0) {
            const fund = new Fund(results[0].fundCode);
            const info = await fund.getInfo();
            console.log(`\n${results[0].fundCode}:`, JSON.stringify(info, null, 2));
        }
    } catch (error) { console.error('Error:', error); }
}

async function testInflation() {
    console.log('\n📉 INFLATION (TCMB)');
    console.log('─'.repeat(60));
    try {
        const inflation = new Inflation();
        const latest = await inflation.getLatest();
        console.log('Latest CPI:', JSON.stringify(latest, null, 2));

        const calc = await inflation.calculate(100000, '2020-01', '2024-01');
        console.log('\nCalculation (100K TL, 2020-01 → 2024-01):', JSON.stringify(calc, null, 2));
    } catch (error) { console.error('Error:', error); }
}

async function testSymbols() {
    console.log('\n🏢 SYMBOLS');
    console.log('─'.repeat(60));
    try {
        // Stock symbols
        const stockSymbols = symbols();
        console.log(`Stock Symbols: ${stockSymbols.slice(0, 15).join(', ')}... (${stockSymbols.length} total)`);

        // Search stocks
        const banks = searchSymbols('BNK');
        console.log(`\nSearch "BNK": ${banks.join(', ')}`);

        // Crypto symbols
        const cryptoList = await cryptoSymbols('TRY');
        console.log(`\nCrypto Symbols: ${cryptoList.slice(0, 10).join(', ')}... (${cryptoList.length} total)`);

        // FX symbols
        console.log(`\nFX Symbols: ${fxSymbols.join(', ')}`);

        // Index symbols
        console.log(`\nIndex Symbols: ${indexSymbols.join(', ')}`);
    } catch (error) { console.error('Error:', error); }
}

async function main() {
    console.log('🚀 borsajs API Test');
    console.log('═'.repeat(60));

    await testCrypto();
    await testFX();
    await testTicker();
    await testIndex();
    await testFund();
    await testInflation();
    await testSymbols();

    console.log('\n' + '═'.repeat(60));
    console.log('✅ All tests completed!');
}

main().catch(console.error);
