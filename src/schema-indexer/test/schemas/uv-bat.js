// find all Transfer events of BAT ERC20 contract
const BigNumber = require('bignumber.js');
const QuestDBWriter = require('../questdb/writer-pg');
const basis = 10;
const HEX = 0x10;

var fs = require('fs');

////////////////////////////////////////
class Schema {
  async onInit(web3) {
    this.web3 = web3;
    this.batContract = this.web3.Contract(batContractAbi, "0x0D8775F648430679A709E98d2b0Cb6250d2887EF");
    this.balance = {}
    this.blocks = [];
    this.save = false;
    //this.writeDB = QuestDBWriter;
    if(this.writeDB){
      await this.writeDB.connect();
    }
    this.outName = 'out_' + parseInt(Date.now() / 1000) + '.csv';
    this.stop = false;

    if(this.save){
      fs.appendFile(this.outName, 'timestamp,block,address,value', function (err) {
        if (err) throw err;
        console.log('Saved!');
      });
    }
  }
  ////////////////////////////////////////
  async setCurBalance(){
    const events = await this.batContract.getEvents("Transfer");
    if (events.length > 0) {
      events.forEach( (ev)=> {
        let from = ev.returnValues[0];

        let to = ev.returnValues[1];
        let value = BigNumber(ev.returnValues[2], basis);

        if(!(to in this.balance)) {
          this.balance[to] = BigNumber(0, basis);
        }
        this.balance[to] = this.balance[to].plus(value);
        //console.log('to', this.balance[to]);

        if(!(from in this.balance)) {
          this.balance[from] = BigNumber(0, basis);
        }
        this.balance[from] = this.balance[from].minus(value);
      })
    }
    return events.length;
  }
  ////////////////////////////////////////
  async writeBlockToCSV(blockNumber){
    const block = await this.web3.getBlock();
    const zero = BigNumber(0, basis);
    let count = 0;
    let buf = "";
    let write = false;
    for( let b in this.balance){
      count ++;
      if(this.balance[b].gt(zero)){
        buf += `${block.timestamp},${blockNumber},${b},${this.balance[b].toString(10)}\n`;
        console.log(`${block.timestamp},${blockNumber},${b},${this.balance[b].toString(10)}\n`);
      }
      if(!(count % 1024)){
        fs.appendFileSync(this.outName,buf);
        buf = "";
      }
      write = true;
    }
    if(write){
      fs.appendFileSync(this.outName,buf);
    }
  }
  async writeBlockToDB(blockNumber){
    const block = await this.web3.getBlock();
    const zero = BigNumber(0, basis);
    let row;
    for( let a in this.balance){
      if(this.balance[a].gt(zero)){
        const isodt = new Date(block.timestamp * 1000).toISOString();
        row = [isodt, blockNumber, a, this.balance[a].toString(HEX)];
        await this.writeDB.addRowAndSend(row);
      }
    }
  }
  ////////////////////////////////////////
  async onBlock(blockNumber) {
    // debug STOP condition
    // if (this.stop){
    //   //console.log('stopped');
    //   return;
    // }

    if(!(blockNumber %100000 ))
      console.log('block: ', blockNumber);

    const changes = await this.setCurBalance();

    // dont write if there are no changes on block
    if(!changes)
      return;

    // save to csv / questDB
    if(this.save){
      await this.writeBlockToCSV(blockNumber);
    }
    if(this.writeDB){
      await this.writeBlockToDB(blockNumber);
    }
  }
  ////////////////////////////////////////
  async onDone() {
    if(this.writeDB){
      this.writeDB.wait(()=>{
        console.log('writeDB done');
      });
    }
    console.log('finished');

    // wait for finished
    for( let b in this.balance){
      if(this.balance[b].lt(BigNumber(0,basis))){
        console.log('NEGATIVE!');
      }
      console.log(b, this.balance[b].toString(10));
    }
  }
}

// copy Data
// scp -i OrbsSharedSSH.pem "ubuntu@3.22.241.104:/data/the-index/*" /Users/yuvala/git/the-index/data

// big data
// ssh -i ~/.ssh/OrbsSharedSSH.pem "ec2-3-22-241-104.us-east-2.compute.amazonaws.com"
// ssh -i ~/.ssh/OrbsSharedSSH.pem "ubuntu@3.22.241.104"


// strongER ram machine 2 more cores
// ssh -i ~/.ssh/OrbsSharedSSH.pem "ubuntu@18.119.104.34"

// gcloud
// gcloud beta compute ssh --zone "us-east4-c" "quest-db"  --project "stunning-choir-314214"


// curl -F schema='[
//   {"name":"timestamp", "type": "long"},
//   {"name":"address", "type": "SYMBOL"},
//   {"name":"block", "type": "long"},
//   {"name":"balance", "type": "long"},
//   ]' -F data=@nativeholders-sync.csv 'http://localhost:9000/imp?name=holders2'

// create table holder_uv
// (
//     ts timestamp,
//     block int,
//     address symbol,
//     balance long256
// );
// // upload short
// curl -F data=@short.csv 'http://34.145.174.225:9000/imp'

// curl -F schema='[{"name":"ts", "type": "timestamp"},{"name":"Block", "type":"int"},{"name":"address", "type": "symbol"},{"name":"balance", "type": "long256"}]' -F data=@short.csv 'http://34.145.174.225:9000/imp?name=holder_uv'



module.exports = Schema;

const batContractAbi =
  '[{"constant":true,"inputs":[],"name":"batFundDeposit","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"batFund","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"tokenExchangeRate","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"finalize","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"version","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"refund","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"tokenCreationCap","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"isFinalized","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"fundingEndBlock","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"ethFundDeposit","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"createTokens","outputs":[],"payable":true,"type":"function"},{"constant":true,"inputs":[],"name":"tokenCreationMin","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"fundingStartBlock","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"type":"function"},{"inputs":[{"name":"_ethFundDeposit","type":"address"},{"name":"_batFundDeposit","type":"address"},{"name":"_fundingStartBlock","type":"uint256"},{"name":"_fundingEndBlock","type":"uint256"}],"payable":false,"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_to","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"LogRefund","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_to","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"CreateBAT","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_from","type":"address"},{"indexed":true,"name":"_to","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_owner","type":"address"},{"indexed":true,"name":"_spender","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Approval","type":"event"}]';