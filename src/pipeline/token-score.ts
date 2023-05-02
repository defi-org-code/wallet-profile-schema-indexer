import { fetchHolders, TokenHolder } from "./token-holders";
import fs from "fs"
import csvParser from 'csv-parser';
import BN from 'bignumber.js';
import { scoreWallet } from "./zerion";


async function readTokenHoldersFromCSV(fileName: string): Promise<TokenHolder[]> {
  return new Promise((resolve, reject) => {
    const tokenHolders: TokenHolder[] = [];

    fs.createReadStream(fileName)
      .pipe(csvParser( ['address', 'balance']))
      .on('data', (data) => {
        const tokenHolder: TokenHolder = { address: data.address, balance: data.balance };
        tokenHolders.push(tokenHolder);
      })
      .on('end', () => {
        resolve(tokenHolders);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

async function buildTokenData(tokenAddress: string, pairAddress: string) {

}

function scoreAvg(scores: number[]): number {
    return scores.reduce((a, b) => a + b, 0) / scores.length;
}


export async function buildTokenScore(csvFileName: string) {
    
    let scores : number[] = [];

    let tries = 0;
    const tokenHolders = await readTokenHoldersFromCSV(csvFileName);
    for (let i = 0; i < tokenHolders.length; i++) {
        const holder = tokenHolders[i];
        console.log('fetching holder -> ', holder.address);
        const CACHE_ONLY = false;
        
        if (parseInt(holder.balance) < 1) continue;
        
        try {

            let scoreData = await scoreWallet(holder.address, CACHE_ONLY)
            //console.log(scoreData);
            tries++;

            //@ts-ignore
            if (scoreData.score_w < 10 && scoreData.score_w > -10) {
                //@ts-ignore
                scores.push(scoreData.score_w);
            }
        } catch (e) {
            console.log('error fetching holder -> ', holder.address, 'CACHE_ONLY -> ', CACHE_ONLY);
            continue;
        }
        }

    let avg = scoreAvg(scores);
    console.log(scores);
    
    console.log(`
Total wallets: ${tokenHolders.length} |
total-wallets/filtered-wallets:${tries}/${scores.length}  |
Holders Average score: ${avg * 100}`);
    
    return {
        totalWallets: tokenHolders.length,
        filteredWallets: scores.length,
        avgScore: avg * 100,
        scores
    }

}
