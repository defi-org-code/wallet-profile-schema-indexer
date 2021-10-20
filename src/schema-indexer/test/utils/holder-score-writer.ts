import * as fs from 'fs';
const { exec } = require('child_process');
const BigNumber = require('bignumber.js');

export type AddressToAmount = {
  string: typeof BigNumber
}

export class HoldersCsvWriter {
  topHolders: object;
  rowCounter: number;
  path: string;
  buf: string;
  withZerionScore: boolean;

  constructor(path, topHoldersPath,  csvHeader = 'address,balance,symbol,block,scoreY,scoreM,scoreW,scoreA,timestamp') {

    if(!path || !topHoldersPath) {
      console.error('bad path for CSVWRITER', arguments);
    }
    console.log('2')
    this.topHolders = {};
    this.rowCounter = 0;
    this.loadTopHolders(topHoldersPath);
    this.path = path;

    console.log(`reading top holders at ${topHoldersPath} ->> creating csv file at  ${path} | reading top holders at ${topHoldersPath}`);
    let logStream = fs.createWriteStream(this.path, {flags: 'w'});
    logStream.write(`${csvHeader}\n`);
    logStream.end();
    console.log('4')
  }

  loadTopHolders(topHoldersPath) {
    let holdersStr;
    // in case file doesnt exsits
    try {
      holdersStr = fs.readFileSync(topHoldersPath, 'utf8');
    } catch(e) {
      console.error(`top holders file doesn't exsits please run schem 'generic-top-holders' before this schema`);
    }

    let arr = holdersStr.split('\n');
    console.log(`topHoldersPath line ${arr.length}`);
    arr.forEach( (it)=> {
      let row = it.split(',');
      let address = row[0];
      this.topHolders[address] = { "score_y": row[1], "score_m": row[2], "score_w": row[3], "score_a": row[4] };
    })
    console.dir(this.topHolders);
    console.log(`topholders length ${Object.keys(this.topHolders).length}`);
  }

  async writetHolders(holders: AddressToAmount, blockNumber: number, symbol: string, timestamp: string): Promise<void> {
    //console.log(`write holders length = ${Object.keys(holders).length}`);
    
    this.buf = ``;
    for(var holder in holders) {
      let val = holders[holder];
      
     // console.log(`holder(${key}) value is ${val.toString(10)}`);
      if(val.gt(0)) {        
        
        //let scores = await buildPortfolioHistory(holder);
        
        if(!this.topHolders.hasOwnProperty(holder)) {
          console.error(`top holder ${holder} is missing in the top holders object`);
          throw 'asseert';
        }
        let scores = this.topHolders[holder]
                    // 'address,balance,block,symbol,scoreY,scoreM,scoreW,scoreA,timestamp'
        this.buf += `${holder},${val.toString(10)},${blockNumber},${symbol},${scores['score_y']},${scores['score_m']},${scores['score_w']},${scores['score_a']},${timestamp}\n`; 
      
      }
    }
    this.rowCounter++;
    if(this.buf.length > 1000) {
      await this.flush();
    }
    return Promise.resolve();
  }

  flush() {
    if(!this.buf) {
      return;
    }
   // console.log(`flushing buffer -> ${this.path} this.buf.length = ${this.buf.length}`);
    fs.appendFileSync(this.path, this.buf);
    this.buf = '';
  }

  printSummary() {  
    exec(`wc -l ${this.path}`, (err, out, stderr) =>  { console.log(`CSV finished rows = ${out}`); });
  }
}




module.exports ={
  HoldersCsvWriter
};