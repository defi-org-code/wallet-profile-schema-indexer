import { fetchPairData, fetchTopCoins } from "./dextools";
import { appendRow } from "./gsheets";
import { getHoldersCSV } from "./token-holders";
import { buildTokenScore } from "./token-score";
import { client } from "./cache";
import fs from "fs"

const MAX_HOLDERS_FILTER = 2500;

function objToArray(obj: any) {
    return Object.keys(obj).map((key) => {
        return obj[key];
    });
}

async function main(topCoins?: { [key: string]: any}) {
    await client.connect();
    
    topCoins = topCoins || (await fetchTopCoins());
    
    
    
    const coins = objToArray(topCoins);
    console.log(coins);
    
    for (let i = 0; i < coins.length; i++) {
        
        const coin = coins[i];
        if (coin.holders > MAX_HOLDERS_FILTER) {
            console.log(`skipping coin ${coin.name} with holders ${coin.holders}`);
            
            continue
        }

        console.log(`Processing ${i} of ${coins.length} | ${coin.name} | ${coin.tokenAddress} | ${coin.pairAddress} | ${coin.creationTime} | ${coin.holders} | ${coin.liquidity} | ${coin.score}`);
        const csv = `data/${coin.symbol}-holders-balance.csv`;
        if (fs.existsSync(csv)) {
            console.log(`*** File ${csv} exists, deleting...`);
            fs.unlinkSync(csv);
        }
        console.log('*** getHoldersCSV ', csv);
        
        const holders = await getHoldersCSV(coin.tokenAddress, coin.pairAddress, csv)
        console.log('*** getHoldersCSV result =', holders?.length);
        
        const score = await buildTokenScore(csv);
        
        const token = await fetchPairData(coin.pairAddress);

        await appendRow([
            new Date().toISOString(), `${token.name} - [${token.symbol}]`, token?.price ,token.volume24h, `6h buys:${token.buys6h} sells:${token.sells6h}` , coin.tokenAddress, coin.pairAddress, coin.creationTime, coin.holders, coin.liquidity, coin.score
            , score.avgScore, score.totalWallets, score.filteredWallets, token.fdv 
        ]);
    }
    
    
}

//main();

// setInterval(() => {

    main({
        // "Frog": {
        //     "name": "Hulk pepe",
        //     "symbol": "SMASH",
        //     "pairAddress": "0x71ba9b06e834f1ef1981f5fdae8ab61e9a74db37",
        //     "tokenAddress": "0xc864b54d3f066b18fafd6b0dcea0a1959f022001",
        //     "score": 1,
        //     "holders": 90,
        //     creationTime: 1629811200,
        //     liquidity: 11.62
        // },
        // "DHands": {
        //     "name": "Diamond Hands",
        //     "symbol": "DHANDS",
        //     "pairAddress": "0xadf75a4268073b2464baf31723f9e23228bb6ef1",
        //     "tokenAddress": "0xdb2c75dd52f379baf279d3e603d2d4df0d5c9c1a",
        //     "score": 1,
        //     "holders": 90,
        //     creationTime: 1629811200,
        //     liquidity: 67.62
        // },
        // "Elmo": {
        //     "name": "elmo",
        //     "symbol": "elmo",
        //     "pairAddress": "0x306eeaff376a128514e40b4846e1650d9ba7ae43",
        //     "tokenAddress": "0x335f4e66b9b61cee5ceade4e727fcec20156b2f0",
        //     "score": 1,
        //     "holders": 612,
        //     creationTime: 1629811200,
        //     liquidity: 91.1
        // },
        // "Liquidify": {
        //     "name": "Liquidify",
        //     "symbol": "LQFY",
        //     "pairAddress": "0x6854c913336e4d180806918bb6efea5c8c3f56b0",
        //     "tokenAddress": "0x4f7b1eb5f74ca7742b89c612d838ba45261bec03",
        //     "score": 1,
        //     "holders": 612,
        //     creationTime: 1629811200,
        //     liquidity: 91.1
        // }
    });

// }, 5 * 3600);

// main({
//     "Frog": {
//         "name": "Frog",
//         "symbol": "FROG",
//         "pairAddress": "0xa385bc4593b41c024dd53023538eb1128c040fcf",
//         "tokenAddress": "0x4d5b027125ea699d55a9d1857c714c237854d4be",
//         "score": 1,
//         "holders": 124,
//         creationTime: 1629811200,
//         liquidity: 57.62
//     },
// });