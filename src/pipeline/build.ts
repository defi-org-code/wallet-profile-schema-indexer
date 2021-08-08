import { exec } from "child_process"
import { coin, getCoins} from "../schema-indexer/test/utils/coins-typed";
import { generateTopHoldersScore } from "./zerion-csv"
const os = require('os')
const cpuCount = os.cpus().length;
const START_BLOCK = 12430795; //2 MONTH AGO
import * as path from 'path';
import * as process from 'process';
import { resolve } from "multiaddr";

const TASK_PRICE = 'pricefeed';
const TASK_TOP_HOLDERS = 'generic-top-holders';
const TASK_HOLDERS = 'generic-holders';
const HOLDER_TABLE = 'holder';
const PRICE_TABLE = 'price';
const HOLDER_SCORE_TABLE = 'score';
//const QUESTDB_IP = '34.145.174.225';  //questdb2
const QUESTDB_IP = '35.245.119.216'; // qdb7
//const QUESTDB_IP = '34.71.239.135';  //questdb3
//const QUESTDB_IP = '34.123.109.198'; //questdb4
const QUESTDB_HOMEDIR = '/home/indexer/';

const HOLDERS_SCORE_SCHEME = `[{"name":"address", "type": "SYMBOL"},{"name":"score", "type":"float"},{"name":"scoreW", "type":"float"},{"name":"scoreM", "type":"float"},{"name":"scoreY", "type":"float"}]`;
const HOLDERS_SCHEME = `[{"name":"address", "type": "symbol"},{"name":"timestamp", "type": "TIMESTAMP", "pattern": "yyyy-MM-ddTHH:mm:ss.SSSz"},{"name":"block", "type":"double"},{"name":"balance", "type": "double"},{"name":"symbol", "type": "symbol"}]`;
const PRICE_SCHEME = `[{"name":"timestamp", "type": "TIMESTAMP", "pattern": "yyyy-MM-ddTHH:mm:ss.SSSz"},
{"name":"priceToken", "type":"double"},
{"name":"priceWeth", "type": "double"},
{"name":"symbol", "type": "symbol"},
{"name":"block", "type":"long"}]`;


async function run() {
    console.time("pipeline");
    // const coins = getCoins();

    // await priceFeed(coins);

    // await holdersByCoin(coins);

    await scoresForTopHolders();
    console.timeEnd('pipeline');
}

function printMsg(message: string) {
    console.log(`-===============================================================    ${message}       =======================================================================-`);
}

async function execSchemasInParallel(jobname:string, coins :coin[]): Promise<void> {
    return new Promise( async (resolve, reject) => {

        let arr =[];
        for(let coin of coins) {
            arr.push(pExec(`npm run test-schema ${jobname} '{"startBlock": ${START_BLOCK}, "address":"${coin.address}", "tokenContract":"${coin.address}", "symbol": "${coin.symbol}","lpAddress":"${coin.lpAddress}","lpCreateBlock": ${coin.lpCreateBlock} }' > ${jobname}.${coin.symbol}.log`));


            if(arr.length > cpuCount - 6) {
                console.log(`waiting for cores to be free jobs running in parallel: ${arr.length}`)
                await Promise.all(arr);
                arr = [];
                console.log('all cores are free ')
            }
        }
        await Promise.all(arr);
        resolve();
    });
}


function pExec(cmd:string, cwd = '/data/the-index'): Promise<string> {
    console.log(`Starting job ${cmd}`);
    console.time(cmd);
    return new Promise( (resolve, reject) => {
        exec(cmd, { cwd: cwd}, (err, stdout, stderr) =>{
            if(err) {
                console.log(err);
                resolve(stdout);
                return    
            }
            console.timeEnd(cmd);
            resolve(stdout);
        })
    })
}
/**
 * Build Price Feed per con
 * @param coins coins[] has all the meta data address lp 
 */
async function priceFeed(coins: coin[]) {
     
    printMsg('Start Price Feed');
    await execSchemasInParallel(TASK_PRICE, coins); // -> CSV
    printMsg('Done Price Feed');
    printMsg('Price Feed Deploy to DB');
    let priceCurlPromises = [];
    for(let coin of coins) {
        let curlCmd = deployCSV2TableByCurl(`./csv/price.${coin.symbol}.csv`, PRICE_SCHEME ,PRICE_TABLE, `&timestamp=timestamp&partitionBy=DAY`);
        priceCurlPromises.push(curlCmd);
    }
    let pricesStdout = await Promise.all(priceCurlPromises);
    console.log(pricesStdout);
    printMsg('Price Feed Deploy to DB Completed');
}


async function holdersByCoin(coins: coin[]) {
    /*Run Top Holders*/
    printMsg('Start top Holders')
    await execSchemasInParallel(TASK_TOP_HOLDERS, coins);
    printMsg('Done top Holders')
    await execSchemasInParallel(TASK_HOLDERS, coins);

    printMsg('Done Generic Holder')
    let curlPromises = [];
    for(let coin of coins) {
        printMsg(`Pushing  ${coin.symbol} Holders CSVs to DB at holders ${HOLDER_TABLE}`)
        console.time(`bulk ${coin.symbol}`)
        
        let out = await deployCSV2TableByScp(`/data/the-index/csv/holders.${coin.symbol}.csv`, HOLDERS_SCHEME , `${coin.symbol}holders`);
        //let out = await deployCSV2TableByCurl(`./csv/holders.${coin.symbol}.csv`, HOLDERS_SCHEME , `${coin.symbol}holders`);
        console.log(out);
        console.timeEnd(`bulk ${coin.symbol}`)
    }
    
    printMsg('Done Pushing CSVs to DB')
}



async function scoresForTopHolders() {
    printMsg('Build Holders Scores by zerion')
    let topHoldersCsv = await generateTopHoldersScore();
    printMsg('Done Holders Scores by zerion');

    let holderScoreResult = await deployCSV2TableByCurl(topHoldersCsv, HOLDERS_SCORE_SCHEME ,HOLDER_SCORE_TABLE,'&overwrite=true');
    printMsg(holderScoreResult);
}

async function scpFilesByPattern(filesPattern: string): Promise<string> {
    //scp -i '~/.ssh/id_ed25519' /data/the-index/csv/holders.*.csv 'indexer@35.245.119.216:/home/indexer/'

    return pExec(`scp -i '~/.ssh/id_ed25519' ${filesPattern} 'indexer@${QUESTDB_IP}:${QUESTDB_HOMEDIR}'`)
}


/**
 * CREATE TABLE holders(address SYMBOL, price DOUBLE, block DOUBLE,ts TIMESTAMP, s STRING)
  timestamp(ts)
PARTITION BY DAY;
 *
 *
*/


async function deployCSV2TableByScp(file: string, tableScheme:string, targetTable: string, curlPostfix = '&timestamp=timestamp&partitionBy=DAY&atomicity=1'): Promise<string> {
    let filepath = file;
    //scp file
    console.time(`scp ${file}`);
    let scpStdOut = await scpFilesByPattern(filepath);
    console.timeEnd(`scp ${file}`);
    console.log(scpStdOut);
    filepath = filepath.replace('/data/the-index/csv/', QUESTDB_HOMEDIR);
    let cmd = `curl -F schema='${tableScheme}' -F data=@${filepath} 'http://localhost:9000/imp?name=${targetTable}${curlPostfix}'`;
    let baseSSH = `ssh indexer@${QUESTDB_IP}`;
    let fullSSHcommand =  `${baseSSH} '${escapeSSH(cmd)}'`
    console.log('fullSSHcommand ->', fullSSHcommand);
    return pExec(fullSSHcommand, '/data/the-index/csv');
}




function deployCSV2TableByCurl(file: string, tableScheme:string, targetTable: string, curlPostfix = '&timestamp=timestamp&partitionBy=DAY&atomicity=1'): Promise<string> {
    
    let filepath = path.join(process.cwd(), file);
    let cmd = `curl -F schema='${tableScheme}' -F data=@${filepath} 'http://${QUESTDB_IP}:9000/imp?name=${targetTable}${curlPostfix}'`;
    // console.log('cmd', cmd);
    return pExec(cmd, '/data/the-index/csv');
}


function escapeSSH(cmd: string): string {
    let singleBackslash = "\\"
    return cmd.replace(/\'/g,`'${singleBackslash}''`)
}

run();


//curl -F data=@/data/the-index/csv/holders.yfi.csv 'http://34.71.239.135:9000/imp'


