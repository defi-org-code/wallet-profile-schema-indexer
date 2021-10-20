const BigNumber = require('bignumber.js');
const fs = require('fs');
import { HoldersCsvWriter, AddressToAmount }  from "../utils/holder-score-writer";
const process = require('process')

import {
  IWeb3,
  IContract,
} from "../../interfaces";

class Schema {
  flags: object
  holders: AddressToAmount
  web3: IWeb3
  contract: IContract
  csvWriter: HoldersCsvWriter
  topHolders: object
  balancesSlot: string

  constructor(flags) {
    console.time('**** Top Holders ***** Schema: Holders Per Block');
    this.flags = flags || {};
    this.holders  = {} as AddressToAmount;
    console.log('this.flags',this.flags);
    this.csvWriter = new HoldersCsvWriter(`./csv/holder-score.${this.flags['symbol']}.csv`, `./csv/top-holders-${this.flags['symbol']}.csv`);
    this.topHolders = this.csvWriter.topHolders;
    this.balancesSlot = this.flags['balanceMappingSlot'] || "0000000000000000000000000000000000000000000000000000000000000001";
  }
  
  async onInit(web3, data) {
    data.trackState();
    this.web3 = web3;
    this.contract = this.web3.Contract(batContractAbi, this.flags['tokenContract']);
  }
  
  async onBlock(blockNumber) {
    if( blockNumber % 100000 == 0){
      console.log(`${blockNumber}: | rows in csv:${this.csvWriter.rowCounter}`);
    }  
    if(blockNumber < this.flags['startBlock']){
      return
    }
    //const stateChanged = await this.contract.hasStateChanges();
    //if( stateChanged ) {
    let events = await this.contract.getEvents("Transfer");
    //}
    if (events.length > 0) {
      for (const event of events) {
        // this filters out the non top holders addresses
        const from = event.returnValues['_from'];
        const to = event.returnValues['_to'];
        if(!this.isTopHolder(from) && !this.isTopHolder(to)) {
          return
        }
        //console.log(`${from} | ${to} is Top Holder`);
        // const fromBalance = await this.getBalanceByBalanceOf(from);
        // const toBalance = await this.getBalanceByBalanceOf(to);
        let fromBalance = '', toBalance = '0';
        
        fromBalance = await this.getBalanceByBalanceOf(from);
        toBalance = await this.getBalanceByBalanceOf(to);
        

        this.addHolder(event.returnValues['_from'], fromBalance);
        this.addHolder(event.returnValues['_to'], toBalance);
      }

      //TODO  writing only blocks wit hevents for optimzation
      let ts = new Date().toISOString();
      let block = await this.web3.getBlock();
      try {
        if(block) {
          ts = new Date(block?.timestamp*1000).toISOString()
        }  
      } catch(e) {
        console.log(`blockNumber ${blockNumber} getBlock failed`);
      }
      
      await this.csvWriter.writetHolders(this.holders, this.flags['symbol'], blockNumber, ts);
    }
    //TODO need to understand why the last blocks are null probablyl a data issue
    
   
  }

  getBalanceByBalanceOf(address) {
    return this.contract.methods.balanceOf(address).call();
  }

  getBalanceByStorage(address) {
    return this.contract.getStorageAt(this.getAddressMapSlot(address, this.balancesSlot));
  }

  getAddressMapSlot(address, mapSlot) {
    return this.web3.utils.keccak256(this.web3.utils.padLeft(address, 64) + mapSlot);
  }

  addHolder(address: string, amount: string) {    
    if(!this.isTopHolder(address)) {
      return
    }
    this.holders[address] = new BigNumber(amount);
  }

  onDone() {
    this.csvWriter.flush();
    console.timeEnd('Schema: Holders Per Block');
    process.exit();
  }

  isTopHolder(address: string): boolean {
    return this.topHolders.hasOwnProperty(address);
  }
  
}



    
module.exports = Schema;

const batContractAbi =
'[{"constant":true,"inputs":[],"name":"batFundDeposit","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"batFund","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"tokenExchangeRate","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"finalize","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"version","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"refund","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"tokenCreationCap","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"isFinalized","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"fundingEndBlock","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"ethFundDeposit","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"createTokens","outputs":[],"payable":true,"type":"function"},{"constant":true,"inputs":[],"name":"tokenCreationMin","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"fundingStartBlock","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"type":"function"},{"inputs":[{"name":"_ethFundDeposit","type":"address"},{"name":"_batFundDeposit","type":"address"},{"name":"_fundingStartBlock","type":"uint256"},{"name":"_fundingEndBlock","type":"uint256"}],"payable":false,"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_to","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"LogRefund","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_to","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"CreateBAT","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_from","type":"address"},{"indexed":true,"name":"_to","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_owner","type":"address"},{"indexed":true,"name":"_spender","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Approval","type":"event"}]';