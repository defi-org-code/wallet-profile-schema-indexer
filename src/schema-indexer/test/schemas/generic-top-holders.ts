const BigNumber = require('bignumber.js');
const fs = require('fs');
import { buildPortfolioHistory } from "../../../pipeline/zerion"
const process = require('process');
const MAX_HOLDERS = 5000;
const MIN_HOLDERS = 1000;

import {
  IWeb3,
  IData,
  IContract,
} from "../../interfaces";

type addressToScore = {
  [key: string]: number[];
};


class Schema {
  flags: object
  holders: object
  web3: IWeb3
  contract: IContract

  constructor(flags: object) {
    console.time('Top Holders Schema');
    this.flags = flags || {};
    this.holders = {};
    console.log('this.flags' ,this.flags);
  }
  
  async onInit(web3: IWeb3, data: IData) {
    data.trackState();
    this.web3 = web3;
    this.contract = this.web3.Contract(batContractAbi, this.flags['tokenContract']);
  }
  
  async onBlock(blockNumber) {
    if( blockNumber % 10000 == 0){
      console.log(`block ${blockNumber}:`);
    }  

    if(blockNumber < this.flags['startBlock']){
      return
    }
    const events = await this.contract.getEvents("Transfer");
    if (events.length > 0) {
      for (const ev of events) {
        console.dir(ev);
        let toBalance = ev.returnValues[1];
        this.addHolder(ev.returnValues['_to'], toBalance);
      }
    }
    let block = await this.web3.getBlock()
    let ts = new Date().toISOString();
    if(block) {
      ts = new Date(block?.timestamp*1000).toISOString()
    } else {
      console.log(`blocknmuber ${blockNumber} is null`);
    }
  }

  getAddressMapSlot(address, mapSlot) {
    return this.web3.utils.keccak256(this.web3.utils.padLeft(address, 64) + mapSlot);
  }

  addHolder(address, amount) {
    if(!this.holders.hasOwnProperty(address)) {
      this.holders[address] = new BigNumber(0);
    }
    this.holders[address] = this.holders[address].plus(amount);
  }

  onDone() {
   this.summarizeTopHolders();
   console.timeEnd('Top Holders Schema');
   process.exit();
  }

  summarizeTopHolders() {
    let arr =[];
    for(var key in this.holders) {
      arr.push({address:key, amount: this.holders[key]})
    }
  
    let soretedArr = arr.sort( (a,b)=> {
      return b.amount.minus(a.amount);
    })
    
    let topHoldesCount = soretedArr.length/10 < MIN_HOLDERS ? MIN_HOLDERS : soretedArr.length / 10;
    topHoldesCount = topHoldesCount > MAX_HOLDERS ? MAX_HOLDERS : topHoldesCount; 
    let top = soretedArr.slice(0, topHoldesCount ); //top
    let addresses = top.map( (it)=> {
      return it.address;
    });
    //this.getScores(addresses);
    // let topHoldersPath = `./csv/top-holders-${this.flags['symbol']}.csv`;
    // let logStream = fs.createWriteStream(topHoldersPath, {flags: 'w'});
    // logStream.write(`${addresses.join('\n')}`);
    // logStream.end();
    // console.log(`top holders file created topHolders:${addresses.length} out of totalHolders${soretedArr.length}`)
    // return topHoldersPath;
  }

  async getScores(holders: string[]): Promise<addressToScore> {
    let map: addressToScore = {};
    let error_counter = 0;
    for(let holder of holders) {
      try {

        let scores = await buildPortfolioHistory(holder);
        map[holder]= [ scores['score_w'],scores['score_m'],scores['score_y']];
      } catch(e) {
        console.log(`zerion errors ${error_counter++}`)
      }
    }
    console.log(map);
    return Promise.resolve(map);
  } 
}



    
module.exports = Schema;

const batContractAbi =
'[{"constant":true,"inputs":[],"name":"batFundDeposit","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"batFund","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"tokenExchangeRate","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"finalize","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"version","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"refund","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"tokenCreationCap","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"isFinalized","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"fundingEndBlock","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"ethFundDeposit","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"createTokens","outputs":[],"payable":true,"type":"function"},{"constant":true,"inputs":[],"name":"tokenCreationMin","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"fundingStartBlock","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"type":"function"},{"inputs":[{"name":"_ethFundDeposit","type":"address"},{"name":"_batFundDeposit","type":"address"},{"name":"_fundingStartBlock","type":"uint256"},{"name":"_fundingEndBlock","type":"uint256"}],"payable":false,"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_to","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"LogRefund","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_to","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"CreateBAT","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_from","type":"address"},{"indexed":true,"name":"_to","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_owner","type":"address"},{"indexed":true,"name":"_spender","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Approval","type":"event"}]';