// find all Transfer events of BAT ERC20 contract
const BigNumber = require('bignumber.js');
const holders = new Set();
var contarcts = [];


class Schema {
  async onInit(web3, data) {
    data.trackState();
    this.web3 = web3;
    for(var address in coins) {
      let symbol = coins[address];
      contarcts.push(this.web3.Contract(abi, address));
    }

    // this.yfi = this.web3.Contract(abi, "0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e");
  }
  
  async onBlock(blockNumber) {
    if(!blockNumber) {
      return
    }
    if (blockNumber % 10000 == 0) {
      console.log(`block:${blockNumber}`);
      console.log('holder set length ', holders.size);
    }
    if(blockNumber < 12430795) {
      return;
    }
    try {
      //console.log('getting events for yfi '+Date.now());
      //const events = await this.yfi.getEvents("Transfer");
      //console.log('yfi tasnfer events', events.length, +Date.now());

      await collectHoldersByCoin()
      
    
      } catch(e) {
        console.log(`expection at blockNumber ${blockNumber}`);
        console.log(e);
      }
  }
  async  onDone() {
    await printHolders(holders);
    console.log('finished');
  }
}


async function collectHoldersByCoin() {
  //console.log('collectHoldersByCoin');
  for(var contract of contarcts) {
    //console.log('get events for symbol');

    let events = await contract.getEvents("Transfer"); 
    //console.log('events ', events.length);
    if (events.length > 0) {
      for(let ev of events) {
        let from = ev.returnValues[0];
        let to = ev.returnValues[1];
        holders.add(from);
        holders.add(to);
      }
    }
  }
}

const coins = {
  // '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e': 'yfi',
  // '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2': 'sushi',
  // '0xc00e94cb662c3520282e6f5717214004a7f26888': 'comp',
  // '0x3472a5a71965499acd81997a54bba8d852c6e53d': 'badger',
  // '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9': 'aave', 
  // '0xba100000625a3754423978a60c9317c58a424e3d': 'balancer',
  // '0xd533a949740bb3306d119cc777fa900ba034cd52': 'curve',
  // '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984':'balancer',
  // '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9': 'uni',
  // '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0': 'polygon',
  // '0x2de72ada48bdf7bac276256d3f016fe058490c34': 'floki',
  // '0xdfb4a81727aa961b6ee830720843104fae0fdff9': 'babyelon',
  // '0xac8e13ecc30da7ff04b842f21a62a1fb0f10ebd5': 'BABYDOGE',
  // '0x9f8eef61b1ad834b44c089dbf33eb854746a6bf9': 'DAWGS',
  '0x976091738973b520a514ea206acdd008a09649de': 'mishka',
}



const PATH = './csv/mishka-holders.csv';
const fs = require('fs');
var logStream = fs.createWriteStream(PATH, {flags: 'w'});
logStream.write(`address,balance,block,timestamp\n`);
logStream.end();

function printHolders() {
  let buf = ``;
  for (let [key, value] of holders.entries()) {
    buf += `${key}\n`;
  }
  fs.appendFileSync(PATH, buf);
}

module.exports = Schema;

const abi =
'[{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"constant":false,"inputs":[{"internalType":"address","name":"_minter","type":"address"}],"name":"addMinter","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"governance","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"mint","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"minters","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_minter","type":"address"}],"name":"removeMinter","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_governance","type":"address"}],"name":"setGovernance","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"}]';

