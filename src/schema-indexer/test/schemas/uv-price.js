// find all Transfer events of (any) ERC20 contract
const BigNumber = require('bignumber.js');
const fs = require('fs');

////////////////////////////////////////
function CSV(path, header, bufSize){
  ////////////////////////////////////////
  var f = fs.createWriteStream(path, {flags: 'w'});
  f.write(`${header}\n`);
  let count =0;
  let rows = [];
  ////////////////////////////////////////
  function flush(){
    //console.log('flush');
    buf="";
    for(r of rows){
      buf += r.join()+'\n';
      count++;
    }
    fs.appendFileSync(path, buf);
    rows = [];
  }
  ////////////////////////////////////////
  function addRow(row){
    rows.push(row);
    if(rows.length >= bufSize){
      flush();
    }
  }
  ////////////////////////////////////////
  return{
    flush:flush,
    addRow:addRow,
    count:count
  }
}
////////////////////////////////////////
class Schema {
  constructor(flags) {
    this.coin = flags;
    this.coin.failed = true;

    console.dir('ctor',flags);
  }
  async onInit(web3, data) {
    data.trackState();
    //this.coins = mishkaOnly;
    //this.coins = usdcOnly; // for usd pricefeed;
    //this.coins = [_______coins[0]];
    //this.coins = coins.getAll();
    console.log('SINGLE COIN PRICE WETH ----------', this.coin.symbol);
    this.web3 = web3;
    this.wethAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2".toLowerCase();
    this.wethDecimals = 18;
    //const csvHeader = "ts,block,symbol,wethReserve,tokenReserve,priceWeth";
    const csvHeader = "timestamp,block,symbol,priceWeth,priceToken";
    this.csv = CSV(this.coin.outfile? outfile : `./csv/price.${this.coin.symbol}.csv`, csvHeader, 0x1000);
    this.reservesPos = "0x0000000000000000000000000000000000000000000000000000000000000008";
  }
  async getCoin(blockNumber){
    // already initialized
    if(!this.coin.failed){
      return this.coin;
    }
    console.log('HERE!-------------------------', typeof this.coin.lpCreateBlock, blockNumber);
    // assigned failed
    let coin = this.coin;

    // assume same abi for all LPs
    console.log('before creating contract', coin.lpAddress)
    coin.lpContract = await this.web3.Contract(abiLP, coin.lpAddress);
    console.log(`create LP contract ${coin.symbol}\tLP: ${coin.lpAddress}`);
    if(!coin.lpContract){
      console.log(`Failed to create contract ${coin.symbol}\tLP: ${coin.lpAddress}`);
      return;
    }

    // get token 0 and 1 - one must be weth
    const t0 = await coin.lpContract.methods.token0().call();
    const t1 = await coin.lpContract.methods.token1().call();
    console.log('PAIR weth-' + coin.symbol);
    console.log('token0', t0);
    console.log('token1', t1);
    coin.wethIndex = -1;
    if(t0.toLowerCase() == this.wethAddress){
      coin.wethIndex = 0;
      coin.tokenIndex = 1;
      coin.tokenAddress = t1;
    }
    else if(t1.toLowerCase() == this.wethAddress){
      coin.wethIndex = 1;
      coin.tokenIndex = 0;
      coin.tokenAddress = t0;
    }
    console.log('weth index:', coin.wethIndex)
    // failed
    if(this.wethIndex == -1){
      console.error(`pair ${coin.lpAddress} does not have WETH address`);
      return;
    }
    // assert token address is correct
    if(coin.tokenAddress.toLowerCase() != coin.address.toLowerCase()){
      console.error('DISCRAPANCY coin token address!!!',coin.symbol, coin.tokenAddress, coin.address);
      return;
    }
    console.log('token verified');
    //get decimals of tokens
    let contract = this.web3.Contract(abiErc20, coin.tokenAddress);
    if(!contract){
      console.error(`fail to create contract $${coin.symbol} ${coin.tokenAddress}`);
      return;
    }
    if(coin.forceDecimals){
      coin.tokenDecimals = coin.forceDecimals;
    }else{
      console.log('erc20 contract created', coin.tokenAddress);
      coin.tokenDecimals = await contract.methods.decimals().call();
      if(!coin.tokenDecimals){
        console.error(`fail to read decimals from contract $${coin.symbol} ${coin.tokenAddress}`);
        return
      }
    }
    /// HARD CODED FOR TEST REMOVE!!! coin.tokenDecimals = coin.decimals;
    console.log(`token ${coin.symbol} decimals=${coin.tokenDecimals}`);
    // SUCCESS!
    coin.failed = false;
    console.log('coin SUCCESS');
    console.log(`${blockNumber} START $${coin.symbol} : ${coin.tokenAddress}\tdecimals: ${coin.tokenDecimals}`);
    return coin;
  }
  ////////////////////////////////////////
  async onBlock(blockNumber) {
    // progress
    if(!(blockNumber % 1000000 )){
      console.log('block: ', blockNumber, this.coin.lpCreateBlock);
    }

    // not yet
    if(blockNumber < this.coin.lpCreateBlock){
      return;
    }

    const coin = await this.getCoin(blockNumber);
    if(!coin){
      return;
    }
    if(coin.failed){
      console.log(blockNumber, "failed");
    }

    // STOP FOR TEST
    // if(blockNumber > this.createBlock + 10000){
    //   console.log(`TEST STOP ${coin.symbol}`);
    //   return;
    // }

    //0x-TS-----|--14 bytes-----------------|--14 bytes-----------------|ts-tok1-tok2
    //0x5f5b19290000000026a5301d8e8cddb41c9400000000006c0ffbd0d7f226b7e1|
    //0x--------1---------2---------3--------4---------5---------6------|x64chars -32bytes
    let storage = "";
    try{
      storage = await coin.lpContract.getStorageAt(this.reservesPos);
      if(!storage){
        if(!(blockNumber % 100000 )){
          console.error(`failed to get $${coin.symbol}storageAt #${blockNumber}`);
        }
        return;
      }
    }
    catch(e){
      console.error(blockNumber, e);
      return;
    }
    // storage right to left
    const r1 = BigNumber(storage.substr(10, 28), 16);
    const r0 = BigNumber(storage.substr(38), 16);
    //const ts = new Date(parseInt(storage.substr(0, 10))*1000);
    const ts = parseInt(storage.substr(0, 10)) * 1000;

    let wethReserve = coin.wethIndex? r1 : r0;
    let tokenReserve = coin.wethIndex? r0 : r1;

    if(!(blockNumber % 10000 )){
      console.log(`${blockNumber} weth: ${wethReserve.toString(10)}\t${coin.symbol}: ${tokenReserve.toString(10)}`);
    }
    //console.log('before weth/token', wethReserve.toString(10), tokenReserve.toString(10));

    // normalize decimals
    const ten = BigNumber(10);
    wethReserve = wethReserve.div( ten.pow(this.wethDecimals));
    tokenReserve= tokenReserve.div( ten.pow(coin.tokenDecimals));
    //console.log(`${blockNumber} weth: ${wethReserve.toString(10)}\t${coin.symbol}: ${tokenReserve.toString(10)}`);

    //console.log('after  weth/token', wethReserve.toString(10), tokenReserve.toString(10));

    // ONLY IF USING BLOCK TIMESTAMP

    // let block = await this.web3.getBlock();
    // // every 10 block Quantize
    // if(!block){
    //   //if(!(blockNumber % 1000 )){
    //     console.log('failed to getBlock', blockNumber);
    //   //}
    //   return;
    // }

    //WETH always denominator
    const priceWeth = tokenReserve.div(wethReserve);
    const priceToken = wethReserve.div(tokenReserve);
    //let row = [ts, blockNumber, coin.symbol, wethReserve.toString(10), tokenReserve.toString(10), priceWeth.toFixed(2)];
    const tsIso = (new Date(ts)).toISOString();
    let row = [tsIso, blockNumber, coin.symbol, priceWeth.toFixed(16), priceToken.toFixed(16)];
    this.csv.addRow(row);

    // progress
    if(!(blockNumber % 100000 )){
      //console.log(`${blockNumber}AFTER  weth: ${wethReserve.toString(10)}\t${coin.symbol}: ${tokenReserve.toString(10)}\tprice: ${priceWeth.toFixed(2)}`);
      //console.log((new Date(ts)).toISOString());
      console.log(row.join());
    }

    // quantize by minute - filter out
    // let qts = this.tsQuantize(block.timestamp);
    // if(qts)
    // if(!(blockNumber % 10 )){
    //   await this.writerDB.addRow([new Date(block.timestamp*1000).toISOString(), blockNumber, t1.toString(16), t2.toString(16)]);
    // }

  }
  ////////////////////////////////////////
  async onDone() {
    await this.csv.flush();
    console.log('on Done! rows count', this.csv.count);
  }
}

const abiLP ='[{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount0","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1","type":"uint256"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"Burn","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount0","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1","type":"uint256"}],"name":"Mint","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount0In","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1In","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount0Out","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1Out","type":"uint256"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"Swap","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint112","name":"reserve0","type":"uint112"},{"indexed":false,"internalType":"uint112","name":"reserve1","type":"uint112"}],"name":"Sync","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"constant":true,"inputs":[],"name":"DOMAIN_SEPARATOR","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"MINIMUM_LIQUIDITY","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"PERMIT_TYPEHASH","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"burn","outputs":[{"internalType":"uint256","name":"amount0","type":"uint256"},{"internalType":"uint256","name":"amount1","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getReserves","outputs":[{"internalType":"uint112","name":"_reserve0","type":"uint112"},{"internalType":"uint112","name":"_reserve1","type":"uint112"},{"internalType":"uint32","name":"_blockTimestampLast","type":"uint32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_token0","type":"address"},{"internalType":"address","name":"_token1","type":"address"}],"name":"initialize","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"kLast","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"mint","outputs":[{"internalType":"uint256","name":"liquidity","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"nonces","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"permit","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"price0CumulativeLast","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"price1CumulativeLast","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"skim","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"amount0Out","type":"uint256"},{"internalType":"uint256","name":"amount1Out","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"swap","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"sync","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"token0","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"token1","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"}]';

const abiErc20 = [
  {
    "constant": true,
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "name": "",
        "type": "string"
      }
    ],
    "payable": false,
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "name": "",
        "type": "uint8"
      }
    ],
    "payable": false,
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "_owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "name": "balance",
        "type": "uint256"
      }
    ],
    "payable": false,
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "name": "",
        "type": "string"
      }
    ],
    "payable": false,
    "type": "function"
  }
];

module.exports = Schema;