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
import { getKapProvider } from '../src/providers/kap.js';
import { VIOP } from '../src/viop.js';

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

async function testKap() {
    console.log('\n🏛️  KAP (Public Disclosure Platform)');
    console.log('─'.repeat(60));
    try {
        const kap = getKapProvider();
        const companies = await kap.getCompanies();
        console.log(`Total Companies: ${companies.length}`);
        console.log('Sample:', JSON.stringify(companies.slice(0, 3), null, 2));

        const search = await kap.search('türk hava');
        console.log('\nSearch "türk hava":', JSON.stringify(search, null, 2));

        // Test disclosures
        const disclosures = await kap.getDisclosures('THYAO', 5);
        console.log(`\nRecent THYAO Disclosures (${disclosures.length}):`);
        disclosures.forEach((d, i) => {
            console.log(`  ${i + 1}. [${d.date}] ${d.title}`);
            console.log(`     ${d.url}`);
        });

        // Test calendar
        const calendar = await kap.getCalendar('THYAO');
        console.log(`\nTHYAO Expected Disclosures (${calendar.length}):`);
        calendar.slice(0, 3).forEach((c, i) => {
            console.log(`  ${i + 1}. ${c.subject} (${c.period} ${c.year})`);
            console.log(`     ${c.startDate} - ${c.endDate}`);
        });

        // Test company details
        const details = await kap.getCompanyDetails('THYAO');
        console.log('\nTHYAO Company Details:', JSON.stringify(details, null, 2));
    } catch (error) { console.error('Error:', error); }
}

async function testViop() {
    console.log('\n📊 VIOP (Derivatives Market)');
    console.log('─'.repeat(60));
    try {
        const viop = new VIOP();

        // Test stock futures
        const stockFutures = await viop.getStockFutures();
        console.log(`Stock Futures: ${stockFutures.length} contracts`);
        if (stockFutures.length > 0) {
            console.log('Sample:', JSON.stringify(stockFutures.slice(0, 2), null, 2));
        }

        // Test index futures
        const indexFutures = await viop.getIndexFutures();
        console.log(`\nIndex Futures: ${indexFutures.length} contracts`);
        if (indexFutures.length > 0) {
            console.log('Sample:', JSON.stringify(indexFutures.slice(0, 2), null, 2));
        }

        // Test by symbol
        const thyaoContracts = await viop.getBySymbol('THYAO');
        console.log(`\nTHYAO Contracts: ${thyaoContracts.length}`);
        if (thyaoContracts.length > 0) {
            console.log('First:', JSON.stringify(thyaoContracts[0], null, 2));
        }
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
    await testKap();
    await testViop();

    console.log('\n' + '═'.repeat(60));
    console.log('✅ All tests completed!');
}

main().catch(console.error);
