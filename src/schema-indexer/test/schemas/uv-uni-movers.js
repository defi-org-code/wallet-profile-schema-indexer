// find all Transfer events of BAT ERC20 contract
const BigNumber = require('bignumber.js');
const CSV = require('../utils/uv-csv');
const ten = BigNumber(10);

// npm run test-schema uv-uni-movers '{"symbol":"mishka","decimals":18,"address":"0x976091738973b520a514ea206acdd008a09649de", "lpAddress":"0x68ca62c3c0cc90c6501181d625e94b4f0fdc869c","lpCreateBlock":12768620}'

//npm run test-schema uv-uni-movers '{"symbol":"yfi","decimals":18,"address":"0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e", "lpAddress":"0x2fdbadf3c4d5a8666bc06645b8358ab803996e28","lpCreateBlock":10483166}'

// all
// npm run run-coins uv-uni-movers

// const
const zero = BigNumber(0);
const one = BigNumber(1);

////////////////////////////////////////
class Schema {
    constructor(flags) {
        this.coin = flags;
        console.log(`ctor UV-UNISWAP`);
        console.dir(flags);
    }
    ////////////////////////////////////////
    async onInit(web3, data) {
        this.web3 = web3;
        data.trackState();
        //this.pool = web3.Contract(uniV2pool, this.coin.lpAddress);
		this.wethAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2".toLowerCase();
		this.token = web3.Contract(abiErc20, this.coin.address);
		this.lpContract = web3.Contract(uniV2pool, this.coin.lpAddress);
        this.wethIndex = -1;

		this.poolLower = this.coin.lpAddress.toLowerCase();
        this.mem = {};
        this.swaps = 0;
        //this.senders = {};

        // this.balance = {};
        //this.outName = `./csv/uni${this.coin.symbol}.csv`;
        //const header = 'address,y0,y1';
        const header = 'address,symbol,events,in0,in1,out0,out1';
        this.csv = CSV(`./csv/uni-movers-coins.csv`, header, 1024, true);
		this.reservesPos = "0x0000000000000000000000000000000000000000000000000000000000000008";

        this.wethDenom = ten.pow(18);
		this.tokenDenom= ten.pow(this.coin.decimals);
        console.log(this.coin.decimals, 'this.tokenDenom',this.tokenDenom);

    }
    ////////////////////////////////////////
    sumRow(blockNumber, address, in0, in1, out0, out1) {
		if(blockNumber % 1000 == 0){
			console.log(`sumRow ${address} ${in0} ${in1} ${out0} ${out1}`);
		}
        address = address.toLowerCase();
        if(!(address in this.mem)){
            this.mem[address] = {
                in0:  BigNumber(0),
                in1:  BigNumber(0),
                out0:  BigNumber(0),
                out1:  BigNumber(0),
                events: 0
            }
        }

        let e = this.mem[address];
        e.events++;
        e.in0 = e.in0.plus(BigNumber(in0));
        e.in1 = e.in1.plus(BigNumber(in1));
        e.out0 = e.out0.plus(BigNumber(out0));
        e.out1 = e.out1.plus(BigNumber(out1));

        // if(e.events > 1){
        //     console.log(`xxx ${address} ${e.in0}, ${e.in1}, ${e.out0}, ${e.out1}`);
        // }
        //this.lastPrice =  e.in0.gt(zero)? e.in0.div(e.out1) : e.out0.div(e.in1);
    }
	async getBlockPrice(blockNumber){
		//0x-TS-----|--14 bytes-----------------|--14 bytes-----------------|ts-tok1-tok2
		//0x5f5b19290000000026a5301d8e8cddb41c9400000000006c0ffbd0d7f226b7e1|
		//0x--------1---------2---------3--------4---------5---------6------|x64chars -32bytes
		let storage = "";
		try{
			storage = await this.lpContract.getStorageAt(this.reservesPos);
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
		//const ts = parseInt(storage.substr(0, 10)) * 1000;

		let wethReserve = this.wethIndex? r1 : r0;
		let tokenReserve = this.wethIndex? r0 : r1;

		// if(!(blockNumber % 10000 )){
		// 	console.log(`${blockNumber} weth: ${wethReserve.toString(10)}\t${coin.symbol}: ${tokenReserve.toString(10)}`);
		// }
		//console.log('before weth/token', wethReserve.toString(10), tokenReserve.toString(10));

		// normalize decimals

		return tokenReserve.div(wethReserve);
	}
    ////////////////////////////////////////
    async onBlock(blockNumber) {
        if(!(blockNumber % 1000000 )){
            console.log('progress block: ', blockNumber);
        }
        if ( blockNumber < this.coin.lpCreateBlock ){
			return;
		}
        if(!(blockNumber % 100000 )){
            console.log('progress block: ', blockNumber);
        }
        if(this.wethIndex === -1){
            const t0 = await this.lpContract.methods.token0().call();
            this.wethIndex = (t0.toLowerCase() == this.wethAddress)? 0 : 1;
            console.log('Contract created, wethIndex = ', this.wethIndex);
        }

		// enum TRANSFER events
    	//  Transfer (index_topic_1 address from, index_topic_2 address to, uint256 value)
		const events = await this.token.getEvents("Transfer");

        //let sender ;
        events.forEach( async (ev)=> {
            this.transfers++;
			const from = ev.returnValues[0];
			const to = ev.returnValues[1];
			const value = ev.returnValues[2];
			if(from.toLowerCase() === this.poolLower){ // Pool->Wallet out0
				const price = await this.getBlockPrice(blockNumber);
				const valWeth = BigNumber(value).div(price).integerValue();
				//console.log(`${price.toString(10)}\t${value}\t${valWeth}`);
				this.sumRow(blockNumber, to, zero, valWeth, value, zero);
			}else if(to.toLowerCase() === this.poolLower){ // Wallet->Pool in0
				const price = await this.getBlockPrice(blockNumber);
				const valWeth = BigNumber(value).div(price).integerValue();
				//console.log(`${price.toString(10)}\t${value}\t${valWeth}`);
				this.sumRow(blockNumber, from, value, zero, zero, valWeth);
			}
        });

    }
    ////////////////////////////////////////
    async onDone() {
        let count = 0;
        let row;
        for( let address in this.mem){
            const e = this.mem[address];
            // add row
            // TODO: devide decimals before condition
            if(e.in1.gt(1) && e.out1.gt(0)){
                //'address,symbol,events,in0,in1,out0,out1';
                row = `${address},${this.coin.symbol},${e.events},${e.in0.div(this.tokenDenom)},${e.in1.div(this.wethDenom)},${e.out0.div(this.tokenDenom)},${e.out1.div(this.wethDenom)}`;
                //row = `${address},${this.coin.symbol},${e.events},${e.in0},${e.in1},${e.out0},${e.out1}`;
                this.csv.addRow(row);
            }
        }
        this.csv.flush();
        console.log(`total swaps: ${this.swaps}`);
        console.log(`${count} rows / ${Object.keys(this.mem).length} swappers | out of: ${this.swaps} swaps`);
        console.log('Done');
        // console.log('-- Senders ----------------------')
        // for (let s in this.senders){
        //     console.log(`${s} : ${this.senders[s]}`);
        // }
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

const uniV2pool = `[{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount0","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1","type":"uint256"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"Burn","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount0","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1","type":"uint256"}],"name":"Mint","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount0In","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1In","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount0Out","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1Out","type":"uint256"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"Swap","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint112","name":"reserve0","type":"uint112"},{"indexed":false,"internalType":"uint112","name":"reserve1","type":"uint112"}],"name":"Sync","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"constant":true,"inputs":[],"name":"DOMAIN_SEPARATOR","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"MINIMUM_LIQUIDITY","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"PERMIT_TYPEHASH","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"burn","outputs":[{"internalType":"uint256","name":"amount0","type":"uint256"},{"internalType":"uint256","name":"amount1","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getReserves","outputs":[{"internalType":"uint112","name":"_reserve0","type":"uint112"},{"internalType":"uint112","name":"_reserve1","type":"uint112"},{"internalType":"uint32","name":"_blockTimestampLast","type":"uint32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_token0","type":"address"},{"internalType":"address","name":"_token1","type":"address"}],"name":"initialize","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"kLast","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"mint","outputs":[{"internalType":"uint256","name":"liquidity","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"nonces","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"permit","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"price0CumulativeLast","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"price1CumulativeLast","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"skim","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"amount0Out","type":"uint256"},{"internalType":"uint256","name":"amount1Out","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"swap","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"sync","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"token0","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"token1","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"}]`