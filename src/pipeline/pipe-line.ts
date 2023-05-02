import { fetchTopCoins } from "./dextools";
import { appendRow } from "./gsheets";
import { getHoldersCSV } from "./token-holders";
import { buildTokenScore } from "./token-score";
import { client } from "./cache";

const MAX_HOLDERS_FILTER= 2500;

function objToArray(obj: any) {
    return Object.keys(obj).map((key) => {
        return obj[key];
    });
}

async function main() {
    await client.connect();
    let topCoins = await fetchTopCoins();
    console.log(topCoins);
    
    const coins = objToArray(topCoins);
    for (let i = 0; i < coins.length; i++) {
        
        const coin = coins[i];
        if (coin.holders > MAX_HOLDERS_FILTER) {
            console.log(`skipping coin ${coin.name} with holders ${coin.holders}`);
            
            continue
        }

        console.log(`Processing ${i} of ${coins.length} | ${coin.name} | ${coin.tokenAddress} | ${coin.pairAddress} | ${coin.creationTime} | ${coin.holders} | ${coin.liquidity} | ${coin.score}`);
        const csv = `data/${coin.symbol}-holders-balance.csv`;
        console.log('*** getHoldersCSV ', csv);
        
        const holders = await getHoldersCSV(coin.tokenAddress, coin.pairAddress, csv)
        console.log(`*** Fetched ${holders?.length} holders`);
        
        const score = await buildTokenScore(csv);
        
        await appendRow([
            new Date().toISOString(), coin.name, coin.tokenAddress, coin.pairAddress, coin.creationTime, coin.holders, coin.liquidity, coin.score
            , score.avgScore, score.totalWallets, score.filteredWallets
        ]);
    }
    
    
}

main();