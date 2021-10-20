// find all Transfer events of BAT ERC20 contract
const BigNumber = require('bignumber.js');
const CSV = require('../utils/uv-csv');
const basis = 10;
const HEX = 0x10;
const zero = new BigNumber(0);
// npm run test-schema uv-holder-count '{"symbol":"mishka","address":"0x976091738973b520a514ea206acdd008a09649de", "lpCreatBlock":12768620}'
// npm run test-schema uv-holder-count '{"symbo0l":"yfi","address":"0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e","lpCreateBlock":10475744}'
////////////////////////////////////////
class Schema {
    constructor(flags) {
        //this.coin = flags || '{symbol:"yfi",address:"0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e"}';
        this.coin = flags;
        console.log(`ctor UV-HOLDER_COUNT`);
        console.dir(flags);
    }
    async onInit(web3, data) {
        this.web3 = web3;
        data.trackState();

        //this.contract = this.web3.Contract(abiErc20, "0x0D8775F648430679A709E98d2b0Cb6250d2887EF");
        this.contract = this.web3.Contract(abiErc20, this.coin.address);
        this.balance = {};
        this.outName = `./csv/holder_count_${this.coin.symbol}.csv`;
        this.csv = CSV(this.outName, 'block,symbol,holder_total,holder_positive', 1024);
        this.latestCount = 0;
        this.total = 0;
        this.positive = 0;
        this.stop = false;


        //this.removed = new Set();
    }

    ////////////////////////////////////////
    async setCurBalance(){
        const events = await this.contract.getEvents("Transfer");
        let fromWasPositive;

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
    async writeBlockToCSV(blockNumber, changed){
        if(changed){
            // reformat row
            //const zero = BigNumber(0, basis);
            //let count = Object.keys(this.balance).length;
            // for( let b in this.balance){
            //     if(this.balance[b].gt(zero)){
            //         count++;
            //     }
            // }
            //this.latestCount = count;
            if(!(blockNumber % 1000)){
                console.log(blockNumber, this.total, this.positive);
            }
            this.lastRow = `${this.coin.symbol},${this.total},${this.positive}`;
        }
        if(this.lastRow)
            this.csv.addRow(`${blockNumber},${this.lastRow}`);
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

        // save to csv
        if(this.csv){
            await this.writeBlockToCSV(blockNumber, changed);
        }

        if(!(blockNumber %100000 )){
            this.printBlnc();
        }
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

// curl -F schema='[
//     {"name":"block", "type": "LONG"},
//     {"name":"symbol", "type": "SYMBOL"},
//     {"name":"holder_total", "type": "INT"},
//     {"name":"holder_positive", "type": "INT"}]' -F data=@short.csv 'http://34.145.174.225:9000/imp?name=holder_uv'



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