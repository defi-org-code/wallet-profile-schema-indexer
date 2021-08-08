// find all Transfer events of BAT ERC20 contract
let holders = {};
const BigNumber = require('bignumber.js');

class Schema {
  async onInit(web3, data) {
    data.trackState();
    this.web3 = web3;
    this.batContract = this.web3.Contract(abi, "0x0D8775F648430679A709E98d2b0Cb6250d2887EF");
  }

  async onBlock(blockNumber) {
    if (blockNumber % 100000 == 0) {
      console.log(`block:${blockNumber}`);
    }
    try {

      const events = await this.batContract.getEvents("Transfer");
      let block = await this.web3.getBlock()
      if (events.length > 0) {

        for(let ev of events) {
          let from = ev.returnValues[0];
          let to = ev.returnValues[1];

          let value = new BigNumber(ev.returnValues[2]);
          if(!holders.hasOwnProperty(from)) {
            holders[from] = new BigNumber(0)
          }
          if(!holders.hasOwnProperty(to)) {
            holders[to] = new BigNumber(0)
          }
	//	console.log('value', value.toString(10));
          holders[to] = holders[to].plus(value);
          holders[from] = holders[from].minus(value);


		// const toBalance = await this.batContract.methods.balanceOf(to).call()
          // const fromBalance = await this.batContract.methods.balanceOf(from).call()
          // holders[to] = new BigNumber(toBalance, 18).toString(10);
          // holders[from] = new BigNumber(fromBalance, 18).toString(10);
        }

        // write csv row on every block
        if(events.length > 0) {
          await printHoldersByBlock(holders, blockNumber, new Date(block.timestamp*1000).toISOString() );
        }
      }
      } catch(e) {
        console.log(`expection at blockNumber ${blockNumber}`);
        console.log(e);
      }
  }
  async  onDone() {
    console.log('finished');
    console.dir(holders);
    for(var key in holders) {
      console.log(`${key}: ${holders[key].toString(10)}`);
    }
  }
}


const PATH = './csv/mishka.csv';
const fs = require('fs');
var logStream = fs.createWriteStream(PATH, {flags: 'w'});
logStream.write(`address,balance,block,timestamp\n`);
logStream.end();

function printHoldersByBlock(holders, blockNumber, timestamp) {
  let buf = ``;
  for(var key in holders) {
    let val = holders[key];
    if(val.gt(0)) {
      buf+= `${key},${val.toString(16)},${blockNumber},${timestamp}\n`;
    }
  }
  fs.appendFileSync(PATH, buf);
}

module.exports = Schema;

const abi =
  '[{"constant":true,"inputs":[],"name":"batFundDeposit","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"batFund","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"tokenExchangeRate","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"finalize","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"version","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"refund","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"tokenCreationCap","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"isFinalized","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"fundingEndBlock","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"ethFundDeposit","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"createTokens","outputs":[],"payable":true,"type":"function"},{"constant":true,"inputs":[],"name":"tokenCreationMin","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"fundingStartBlock","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"type":"function"},{"inputs":[{"name":"_ethFundDeposit","type":"address"},{"name":"_batFundDeposit","type":"address"},{"name":"_fundingStartBlock","type":"uint256"},{"name":"_fundingEndBlock","type":"uint256"}],"payable":false,"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_to","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"LogRefund","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_to","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"CreateBAT","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_from","type":"address"},{"indexed":true,"name":"_to","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_owner","type":"address"},{"indexed":true,"name":"_spender","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Approval","type":"event"}]';