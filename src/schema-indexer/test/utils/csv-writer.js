const fs = require('fs');
const { exec } = require('child_process');
class HoldersCsvWriter {
  
  constructor(path, topHoldersPath, csvHeader = 'address,balance,block,symbol,timestamp') {
    if(!path || !topHoldersPath) {
      console.error('bad path for CSVWRITER', arguments);
    }
    this.topHolders = {};
    this.rowCounter = 0;
    this.loadTopHolders(topHoldersPath);
    this.path = path;
    console.log(`creating csv file at  ${path} | reading top holders at ${topHoldersPath}`);
    let logStream = fs.createWriteStream(this.path, {flags: 'w'});
    logStream.write(`${csvHeader}\n`);
    logStream.end();
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

  writetHolders(holders, blockNumber, symbol, timestamp) {
    //console.log(`write holders length = ${Object.keys(holders).length}`);
    this.buf = ``;
    for(var key in holders) {
      let val = holders[key];
     // console.log(`holder(${key}) value is ${val.toString(10)}`);
      if(val.gt(0)) {
        this.buf += `${key},${val.toString(10)},${symbol},${blockNumber},${timestamp}\n`;
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