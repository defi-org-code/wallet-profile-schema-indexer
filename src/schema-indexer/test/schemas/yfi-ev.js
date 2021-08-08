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
    if (blockNumber % 1000 == 0) {
      console.log(`block:${blockNumber}`);
    }
    if(blockNumber < 12030795) {
      return;
    }
    try {

      const events = await this.batContract.getEvents("Transfer");
      let block = await this.web3.getBlock()
      //console.log('events ', events.length);
      if (events.length > 0) {
        console.log('events ', events.length);
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
	      //  console.log('value', value.toString(10));
          holders[to] = holders[to].plus(value);
          holders[from] = holders[from].minus(value);

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
'[{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"Address","type":"address"},{"indexed":false,"internalType":"address","name":"Origin","type":"address"}],"name":"BanAddress","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"MaxTransaction","type":"uint256"}],"name":"MaxOutTxLimit","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"senderAddress","type":"address"},{"internalType":"address","name":"yourWalletAddress","type":"address"}],"name":"aaaReadMessage","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"sendToAddress","type":"address"},{"internalType":"string","name":"message","type":"string"}],"name":"aaaSendMessage","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_a","type":"address"}],"name":"addBot","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address[]","name":"_addresses","type":"address[]"}],"name":"addBotMultiple","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_address","type":"address"}],"name":"addExchangeAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"addLiquidity","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_address","type":"address"}],"name":"addWhitelist","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address[]","name":"_addresses","type":"address[]"}],"name":"addWhitelistMultiple","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_owner","type":"address"},{"internalType":"address","name":"_spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_spender","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_address","type":"address"}],"name":"assignAntiBot","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"banCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_address","type":"address"}],"name":"checkIfBanned","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"contractBalance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_address","type":"address"}],"name":"forgiveAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getCoolDownSeconds","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"isAntiBot","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_address","type":"address"}],"name":"isExchangeAddress","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_address","type":"address"}],"name":"isForgiven","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"isPublicTradingOpen","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_address","type":"address"}],"name":"isWhitelisted","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"openPublicTrading","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_a","type":"address"}],"name":"removeBot","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_address","type":"address"}],"name":"removeWhitelist","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_address","type":"address"}],"name":"rmExchangeAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_address","type":"address"}],"name":"rmForgivenAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"setAntiBotOff","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"setAntiBotOn","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address payable","name":"_charityAddress","type":"address"}],"name":"setCharityAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"charity","type":"uint256"}],"name":"setCharityBasisPoints","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"coolDownSeconds","type":"uint256"}],"name":"setCoolDownSeconds","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokens","type":"uint256"}],"name":"setNumOfTokensForDisperse","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address payable","name":"_tollAddress","type":"address"}],"name":"setTollAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"toll","type":"uint256"}],"name":"setTollBasisPoints","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"txLimit","type":"uint256"}],"name":"setTxLimit","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"setTxLimitMax","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"address","name":"_recipient","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_sender","type":"address"},{"internalType":"address","name":"_recipient","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_address","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}]';

