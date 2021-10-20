import { buildPortfolioHistory } from "./zerion"
import * as fs from "fs";


var OUTPUT_CSV = `./csv/holders.score.csv`;

export async function generateScroesForSet(holders: string[]): Promise<string> {
    OUTPUT_CSV = `./csv/redis-holders.score.csv`;
    initOutputCSV(OUTPUT_CSV);

    let holderSet = new Set<string>(holders);
    processHolders(holderSet);
    return Promise.resolve(OUTPUT_CSV);
}


export async function generateTopHoldersScore(): Promise<string> {
    initOutputCSV(OUTPUT_CSV);
    await generateHoldersList(`./csv/`);
    return Promise.resolve(OUTPUT_CSV);
}


function generateHoldersList(csvDir: string, filePattern = 'top-holders'): Promise<void> {
    let holders = new Set<string>();
    let files = fs.readdirSync(csvDir);
    files.forEach( (file)=> {
        if(file.includes(filePattern)) {
            let addresses = csvToRows(`${csvDir}${file}`);
            addresses.forEach( (address) => {
                holders.add(address);
            })
        }
    })
    return processHolders(holders);
}   


export function csvToRows(csvPath: string, separator = "\n"): string[] {
    let str = fs.readFileSync(csvPath, 'utf8');
    let addresses = str.split(separator);
    console.log(`${csvPath} row = ${addresses.length} `);
    return addresses;
}


var counter = 0;

async function processHolders(holders: Set<string>) {
    console.log(`Building scores for ${holders.size} of holders`);
    for(var address of holders) {
        if(counter % 10 == 0) {
            console.log(`addresses completed ${counter}`);
        }
        try {
            let rslt = await buildPortfolioHistory(address);
            writeRow(address, rslt);
        } catch(e) {
            console.log(e);
        }
        counter++
    }
    console.log(`Done`);
}




function initOutputCSV(name:string, csvHeader:string='address,scoreW,scoreM,scoreY,age') {
    let logStream = fs.createWriteStream(name, {flags: 'w'});
    logStream.write(`${csvHeader}\n`);
    logStream.end();
}


function writeRow(address:string, scoreObj: object) {
    let row = `${address},${scoreObj['score_w']},${scoreObj['score_m']},${scoreObj['score_y']}\n`
   // console.log(`${scoreObj['score']}    |     ${scoreObj['score_w']}    |     ${scoreObj['score_m']}    |     ${scoreObj['score_y']}`)
    fs.appendFile(OUTPUT_CSV, row, (err)=> {
        if(err) throw err;
    });
}



//generateTopHoldersScore();

//OUTPUT_CSV = './csv/public-sale.score.csv'
//generateHoldersList('./csv/','public-sale-accounts.csv');