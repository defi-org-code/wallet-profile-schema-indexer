// find all Transfer events of BAT ERC20 contract
let holders = {};
const BigNumber = require('bignumber.js');

class Schema {
  async onInit(web3, data) {
    data.trackState();
    this.web3 = web3;
    this.batContract = this.web3.Contract(abi, "0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e");
  }
  
  async onBlock(blockNumber) {
    let ts = new Date().toISOString();
    if (blockNumber % 10000 == 0) {
      console.log(`${new Date().toISOString()} block:${blockNumber}`);
    }
    if(blockNumber < 12430795) {
      return;
    }
    try {
      let block = await this.web3.getBlock();

      const events = await this.batContract.getEvents("Transfer");
      if (events.length > 0) {
        for(let ev of events) {
          let from = ev.returnValues[0];
          let to = ev.returnValues[1];
		
  		    const toBalance = await this.batContract.methods.balanceOf(to).call()
          const fromBalance = await this.batContract.methods.balanceOf(from).call()
          holders[to] = new BigNumber(toBalance);
          holders[from] = new BigNumber(fromBalance);
        }
        
        if(block) {
          ts = new Date(block.timestamp*1000).toISOString();
        }

        
      }
      await printHoldersByBlock(holders, blockNumber, ts);
    } catch(e) {
      console.log(`expection at blockNumber ${blockNumber}`);
      console.log(e);
    }
  }
  async  onDone() {
    console.log('finished');
  }
}


const PATH = './csv/yfi-call.csv';
const fs = require('fs');
var logStream = fs.createWriteStream(PATH, {flags: 'w'});
logStream.write(`address,balance,block,timestamp\n`);
logStream.end();

function printHoldersByBlock(holders, blockNumber, timestamp) {
  let buf = ``;
  for(var key in holders) {
    let val = holders[key];
    if(val.gt(0)) {
      buf+= `${key},${val},${blockNumber},${timestamp}\n`;
    }
  }
  fs.appendFileSync(PATH, buf);    
}

module.exports = Schema;

const abi =
'[{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"constant":false,"inputs":[{"internalType":"address","name":"_minter","type":"address"}],"name":"addMinter","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"governance","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"mint","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"minters","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_minter","type":"address"}],"name":"removeMinter","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_governance","type":"address"}],"name":"setGovernance","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"}]';

