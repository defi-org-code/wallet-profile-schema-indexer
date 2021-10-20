import * as fs from 'fs';
const { exec } = require('child_process');
import { buildPortfolioHistory } from "../../../pipeline/zerion"

export type AddressToAmount = {
  string: number
}

export class HoldersCsvWriter {
  topHolders: object;
  rowCounter: number;
  path: string;
  buf: string;
  withZerionScore: boolean;

  constructor(path, topHoldersPath, withZerionScore =false, csvHeader = 'address,balance,block,symbol,timestamp') {
    console.log('1')
    if(withZerionScore) {
      csvHeader = 'address,balance,block,symbol,scorey,timestamp'
    }
    if(!path || !topHoldersPath) {
      console.error('bad path for CSVWRITER', arguments);
    }
    console.log('2')
    this.withZerionScore = withZerionScore;
    this.topHolders = {};
    this.rowCounter = 0;
    this.loadTopHolders(topHoldersPath);
    this.path = path;
    console.log('3')
    console.log(`creating csv file at  ${path} | reading top holders at ${topHoldersPath}`);
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
    arr.forEach( (it)=> {
      this.topHolders[it] = 1;
    })
    console.log(`topholders length ${Object.keys(this.topHolders).length}`);
  }

  async writetHolders(holders: AddressToAmount, blockNumber: number, symbol: string, timestamp: string) {
    //console.log(`write holders length = ${Object.keys(holders).length}`);
    this.buf = ``;
    for(var holder in holders) {
      let val = holders[holder];
      
     // console.log(`holder(${key}) value is ${val.toString(10)}`);
      if(val.gt(0)) {
        if(this.withZerionScore) {
          let scores = await buildPortfolioHistory(holder)
          this.buf += `${holder},${val.toString(10)},${symbol},${scores['score_y'] || -2 },${blockNumber},${timestamp}\n`;
        } else {
          this.buf += `${holder},${val.toString(10)},${symbol},${blockNumber},${timestamp}\n`;
        }
      }
    }
    this.rowCounter++;
    if(this.buf.length > 10000) {
      this.flush();
    }
  }

  flush() {
    if(!this.buf) {
      return;
    }
    fs.appendFile(this.path, this.buf, (err)=> {
      if(err) throw err;
    });
    this.buf = '';
  }

  printSummary() {
    exec(`wc -l ${this.path}`, (err, out, stderr) =>  { console.log(`CSV finished rows = ${out}`); });
  }
}

module.exports ={
  HoldersCsvWriter
};