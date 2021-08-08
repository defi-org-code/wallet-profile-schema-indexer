//find all Transfer events of (any) ERC20 contract
const BigNumber = require('bignumber.js');
const QuestDBWriter = require('../questdb/writer-pg');
const HEX = 0x1000;

////////////////////////////////////////
class Schema {
  async onInit(web3, data) {
    data.trackState();
    this.web3 = web3;
    //const DAWGS = '0x9f8eef61b1ad834b44c089dbf33eb854746a6bf9';    
    const ADDRESS = '0x0D8775F648430679A709E98d2b0Cb6250d2887EF';
    // console.log('INIT DAWGS', DAWGS);
    // this.contract = this.web3.Contract(contractAbi, DAWGS);    
    console.log('INIT BAT', ADDRESS);
     this.contract = this.web3.Contract(abi, ADDRESS);        
    this.writeDB = QuestDBWriter('uv_bat');
    await this.writeDB.connect();
  }
  ////////////////////////////////////////
  async writeChangedBalance(blockNumber){
    const events = await this.contract.getEvents("Transfer");
    if(!events.length){
      return;
    }
    const block = await this.web3.getBlock();
    if(!block){
      console.log(`get block failed #${blockNumber}`);
      return;
    }
    let changes = new Set();
    events.forEach( (ev)=> {
      let from = ev.returnValues[0];
      let to = ev.returnValues[1];
      changes.add(from);
      changes.add(to);
    })
    const isodt = new Date(block.timestamp * 1000).toISOString();

    // read balances on set
    for( let c of changes){
      const bal = await this.contract.methods.balanceOf(c).call();
      let row = [isodt, blockNumber, c, BigNumber(bal, 10).toString(HEX)];
      await this.writeDB.addRow(row);
    }
  }
  ////////////////////////////////////////
  async onBlock(blockNumber) {
    // debug STOP condition
    // if (blockNumber >= 3900000){
    //   console.log('stopped');
    //   return;
    // }
    if(!(blockNumber %100000 ))
      console.log('block: ', blockNumber);

    if(this.writeDB){
      await this.writeChangedBalance(blockNumber);      
    }
  }
  ////////////////////////////////////////
  async onDone() {
    if(this.writeDB){
      await this.writeDB.flush();
    }
  }
}

module.exports = Schema;
const abi =
  '[{"constant":true,"inputs":[],"name":"batFundDeposit","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"batFund","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"tokenExchangeRate","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"finalize","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"version","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"refund","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"tokenCreationCap","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"isFinalized","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"fundingEndBlock","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"ethFundDeposit","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"createTokens","outputs":[],"payable":true,"type":"function"},{"constant":true,"inputs":[],"name":"tokenCreationMin","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"fundingStartBlock","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"type":"function"},{"inputs":[{"name":"_ethFundDeposit","type":"address"},{"name":"_batFundDeposit","type":"address"},{"name":"_fundingStartBlock","type":"uint256"},{"name":"_fundingEndBlock","type":"uint256"}],"payable":false,"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_to","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"LogRefund","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_to","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"CreateBAT","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_from","type":"address"},{"indexed":true,"name":"_to","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_owner","type":"address"},{"indexed":true,"name":"_spender","type":"address"},{"indexed":false,"name":"_value","type":"uint256"}],"name":"Approval","type":"event"}]';