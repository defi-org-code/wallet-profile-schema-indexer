
const redis = require("redis");
const client = redis.createClient({
    db: 1, 
  //  host: '34.134.236.209',
    password: 'admin@orbs'
});

import {HOLDERS_SCORE_SCHEME, HOLDER_SCORE_TABLE, deployCSV2TableByCurl } from './build'

import {generateScroesForSet} from './zerion-csv'


async function main() {
    console.time('scoresRedisToQuest')
   // let accounts = await readAllAccounts();
   // let csvPath = await generateScroesForSet(accounts);
    let holderScoreResult = await deployCSV2TableByCurl('./csv/redis-holders.score.csv', HOLDERS_SCORE_SCHEME ,HOLDER_SCORE_TABLE /*,'&overwrite=true'*/);
    console.log(holderScoreResult);
    console.timeEnd('scoresRedisToQuest')
}

function readAllAccounts():Promise<string[]> {
    return new Promise( (resolve, reject ) => {

        client.keys('*', (err, rslt) => {
            console.log(rslt);
            let accounts = rslt.map( (it)=> { return it.replace('wallet2-time-series:', ''); });
            resolve(accounts)
        }) 
    })
}

main()