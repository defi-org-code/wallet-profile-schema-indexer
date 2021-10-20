// find all Transfer events of BAT ERC20 contract
const BigNumber = require('bignumber.js');
const CSV = require('../utils/uv-csv');
const CSVIndex = require('../utils/uv-csv-index');
const basis = 10;
const HEX = 0x10;
const zero = new BigNumber(0);
// npm run test-schema uv-holder-uni-score '{"symbol":"mishka","address":"0x976091738973b520a514ea206acdd008a09649de", "lpCreatBlock":12768620}'
// npm run test-schema uv-holder-uni-score '{"symbol":"yfi","address":"0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e","lpCreateBlock":10475744}'
// run all coins
// npm run run-coins uv-holder-uni-score
////////////////////////////////////////
class Schema {
    constructor(flags) {
        //this.coin = flags || '{symbol:"yfi",address:"0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e"}';
        this.coin = flags;
        console.log(`ctor UV-HOLDER-UNI-SCORE`);
        console.dir(flags);
    }
    async onInit(web3, data) {
        this.web3 = web3;
        data.trackState();

        //this.contract = this.web3.Contract(abiErc20, "0x0D8775F648430679A709E98d2b0Cb6250d2887EF");
        this.contract = this.web3.Contract(abiErc20, this.coin.address);
        this.balance = {};
        //this.outName = `./csv/uni_score_${this.coin.symbol}.csv`;
        this.outName = `./csv/uni_score_all.csv`;
        this.header = 'timestamp,block,symbol,priceToken,priceUSD,matches,avgYield,avgYieldPos,avgYieldNeg,avgProf,waProf';
        this.csv = CSV(this.outName, this.header, 1024, true);
        this.latestCount = 0;
        this.total = 0;
        this.positive = 0;
        this.stop = false;

        this.uniScore = new CSVIndex();
        this.uniScore.load('/data/the-index/uniswap12k.csv', 0);
        console.log(this.uniScore.getRow('0x795065dCc9f64b5614C407a6EFDC400DA6221FB0'));

        this.blockPrice = new CSVIndex();
        this.blockPrice.load(`/data/the-index/csv/price240/${this.coin.symbol}.csv`, 1);
        console.log(this.blockPrice.getRow(12768720));

        this.blockPriceUSD = new CSVIndex();
        this.blockPriceUSD.load(`/data/the-index/csv/uv_price_weth_usdc.csv`, 0);
        console.log(this.blockPriceUSD.getRow(12050424));
    }

    ////////////////////////////////////////
    async setCurBalance(){
        const events = await this.contract.getEvents("Transfer");

        if (events.length > 0) {
            events.forEach( (ev)=> {
                let from = ev.returnValues[0];
                //let from = ev.returnValues._from;
                let to = ev.returnValues[1];
                //let to = ev.returnValues._to;
                let value = new BigNumber(ev.returnValues[2]);
                //let value = ev.returnValues._value;

                if(!(from in this.balance)){
                    this.total += 1;
                    this.balance[from] = new BigNumber(0);
                }
                if(!(to in this.balance)){
                    this.total += 1;
                    this.balance[to] = new BigNumber(0);
                }

                if(this.balance[to].eq(zero)){
                    this.positive += 1;

                }
                this.balance[to] = this.balance[to].plus(value);

                // transfer all hus funds
                // if(this.balance[from].isEqualTo(value)){
                //     this.positive -= 1;
                // }
                this.balance[from] = this.balance[from].minus(value);
                // if(this.removed.has(from)) {
                //     return;
                // }
                if(this.balance[from].eq(zero)){
                    //console.log('this.balance[from]', this.balance[from].toString(10), value.toString(10));
                    this.positive -= 1;
                //    this.removed.add(from);
                }
            })
        }
        // for ( let address of toDelete){
        //     delete this.balance[address];
        // }
        return events.length > 0;
    }
    ////////////////////////////////////////
    async writeBlockToCSV(blockNumber, priceToken, priceUSD){
        // collect all pos balances
        let row;
        //let posHolders=0;
        let matches =0;
        let sumYield =0;

        let sumYieldPos =0;
        let sumYieldNeg =0;
        let matchesPos =0;
        let matchesNeg =0;

        let sumProf =0;
        let sumWaProf =0;
        for (let address in this.uniScore.index){
            if(address in this.balance && this.balance[address].gt(zero)){
                row = this.uniScore.getRow(address);
                if(row){
                    matches++;
                    let _yield = parseFloat(row[4]);
                    sumYield += _yield;
                    sumProf += parseFloat(row[5]);
                    sumWaProf += parseFloat(row[6]);
                    // pos neg yield
                    if(_yield > 0){
                        sumYieldPos += _yield;
                        matchesPos++;
                    }else{
                        sumYieldNeg += _yield;
                        matchesNeg++;
                    }
                }
            }
        }

        let avgYield =0;
        let avgYieldPos =0;
        let avgYieldNeg =0;
        let avgProf =0;
        let avgWaProf =0;
        if(matches > 0){
            avgYield = sumYield / matches;
            avgProf = sumProf / matches;
            avgWaProf = sumWaProf / matches;
        }
        // only pos yield
        if(matchesPos > 0){
            avgYieldPos = sumYieldPos / matchesPos;
        }
        // only neg yield
        if(matchesNeg > 0){
            avgYieldNeg = sumYieldNeg / matchesNeg;
        }

        const _wethPerToken = parseFloat(priceToken[2]);
        let _priceUSD = 0;
        if(priceUSD){
            let usdsPerEther = parseFloat(priceUSD[4]);
            if( usdsPerEther ){
                _priceUSD = _wethPerToken * usdsPerEther;
            }
        }

                        // 'timestamp,block,symbol,priceToken,priceUSD,matches,avgYield,avgYieldPos,avgYieldNeg,avgProf,waProf'
        const writewRow = `${priceToken[0]},${blockNumber},${this.coin.symbol},${_wethPerToken},${_priceUSD},${matches},${avgYield},${avgYieldPos},${avgYieldNeg},${avgProf},${avgWaProf}`;

        this.csv.addRow(writewRow);
    }
    ////////////////////////////////////////
    async onBlock(blockNumber) {
        // debug STOP condition
        // if (this.stop){
        //   //console.log('stopped');
        //   return;
        // }
        if(!(blockNumber % 1000000 )){
            console.log('block: ', blockNumber, "positive: ",this.positive);
        }
        if(this.coin.lpCreateBlock && blockNumber < this.coin.lpCreateBlock){
            return;
        }

        if (!(await this.contract.isDeployed())) return;

        const changed = await this.setCurBalance(blockNumber);

        // dont write if there are no changes on block
        // if(!changes)
        //   return;

        // only once an hour

        if(blockNumber % 240 !== 0)
            return ;

        let priceToken = this.blockPrice.getRow(blockNumber);
        if(!priceToken) return;

        let priceUSD = this.blockPriceUSD.getRow(blockNumber);
        if(!priceUSD){
            console.error(`no usd price on block ${blockNumber}`);
        }

        // save to csv
        if(this.csv){
            await this.writeBlockToCSV(blockNumber, priceToken, priceUSD);
        }

        // if(!(blockNumber %100000 )){
        //     this.printBlnc();
        // }
    }
    ////////////////////////////////////////
    printBlnc(){
        console.log('---------------------------------------');
        let count = 0;
        for( let b in this.balance){
            if(count < 100){
                if(this.balance[b].lt(BigNumber(0,basis))){
                    console.log('NEGATIVE!');
                }
                console.log(b, this.balance[b].toString(10));
                count++;
            }
        }
        console.log('---------------------------------------');
    }
    ////////////////////////////////////////
    async onDone() {
        console.log('finished');
        this.csv.flush();

        // wait for finished
        this.printBlnc();
    }
}

module.exports = Schema;

const abiErc20 = `[
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
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "_spender",
                "type": "address"
            },
            {
                "name": "_value",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "_from",
                "type": "address"
            },
            {
                "name": "_to",
                "type": "address"
            },
            {
                "name": "_value",
                "type": "uint256"
            }
        ],
        "name": "transferFrom",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
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
        "stateMutability": "view",
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
        "stateMutability": "view",
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
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "_to",
                "type": "address"
            },
            {
                "name": "_value",
                "type": "uint256"
            }
        ],
        "name": "transfer",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "_owner",
                "type": "address"
            },
            {
                "name": "_spender",
                "type": "address"
            }
        ],
        "name": "allowance",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "payable": true,
        "stateMutability": "payable",
        "type": "fallback"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "spender",
                "type": "address"
            },
            {
                "indexed": false,
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Approval",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "from",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "to",
                "type": "address"
            },
            {
                "indexed": false,
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Transfer",
        "type": "event"
    }
]`

// =QUERY(A2:O,"SELECT A, COUNT(A) count, SUM(L) sumInETH, AVG(N) avgYield, SUM(P) sumProfWeighted  GROUP BY A")
// =QUERY(A2:O,"SELECT A, COUNT(A), SUM(L), AVG(N), SUM(P) GROUP BY A")