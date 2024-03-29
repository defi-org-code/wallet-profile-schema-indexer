// find all Transfer events of BAT ERC20 contract
const BigNumber = require('bignumber.js');
const CSV = require('../utils/uv-csv');
const basis = 10;
const HEX = 0x10;

// npm run test-schema uv-uniswap '{"symbol":"mishka","address":"0x976091738973b520a514ea206acdd008a09649de", "lpAddress":"0x68ca62c3c0cc90c6501181d625e94b4f0fdc869c","lpCreateBlock":12768620}'

//npm run test-schema uv-uniswap '{"symbol":"yfi","address":"0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e", "lpAddress":"0x2fdbadf3c4d5a8666bc06645b8358ab803996e28","lpCreateBlock":10483166}'

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
        this.contract = web3.Contract(uniV2pool, this.coin.lpAddress);
        this.wethIndex = -1;
        this.wethAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2".toLowerCase();
        this.mem = {};
        this.swaps = 0;
        this.senders = {};

        // this.balance = {};
        //this.outName = `./csv/uni${this.coin.symbol}.csv`;
        //const header = 'address,y0,y1';
        const header = 'address,symbol,events,in0,in1,out0,out1,y0,y1,price,yield';
        this.csv = CSV(`./csv/uniswap_mishka.csv`, header, 1024, true);
        // this.latestCount = 0;
        // this.total = 0;
        // this.stop = false;
    }
    ////////////////////////////////////////
    sumRow(address, in0, in1, out0, out1) {
        let old = true;
        if(!(address in this.mem)){
            this.mem[address] = {
                in0:  BigNumber(0),
                in1:  BigNumber(0),
                out0:  BigNumber(0),
                out1:  BigNumber(0),
                events: 0
            }
        }
        else{
            old = true;
        }
        let e = this.mem[address];
        e.events++;
        e.in0 = e.in0.plus(BigNumber(in0));
        e.in1 = e.in1.plus(BigNumber(in1));
        e.out0 = e.out0.plus(BigNumber(out0));
        e.out1 = e.out1.plus(BigNumber(out1));

        if(e.events > 1){
            console.log(`xxx ${address} ${e.in0}, ${e.in1}, ${e.out0}, ${e.out1}`);
        }
        this.lastPrice =  e.in0.gt(zero)? e.in0.div(e.out1) : e.out0.div(e.in1);
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
            const t0 = await this.contract.methods.token0().call();
            this.wethIndex = (t0.toLowerCase() == this.wethAddress)? 0 : 1;
            console.log('Contract created, wethIndex = ', this.wethIndex);
        }

		// enum events
        // Swap(index_topic_1 address sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, index_topic_2 address to)
		const events = await this.contract.getEvents("Swap");

        let sender ;
        events.forEach( (ev)=> {
            this.swaps++;
            // let in0 = ev.returnValues[1];
            // let in1 = ev.returnValues[2];
            // let out0 = ev.returnValues[3];
            // let out1 = ev.returnValues[4];
            // let to = ev.returnValues[5];

            this.sumRow(ev.returnValues[5], ev.returnValues[1], ev.returnValues[2], ev.returnValues[3], ev.returnValues[4]);

            //maintain senders for statistics
            sender = ev.returnValues[0];
            if(sender in this.senders){
                this.senders[sender]++;
            }else{
                this.senders[sender] = 1;
            }
            if(blockNumber % 1000 == 0){
                const swap = `${ev.returnValues[5]},${this.coin.symbol},${ev.returnValues[1]},${ev.returnValues[2]},${ev.returnValues[3]},${ev.returnValues[4]}`;
                console.log(`${blockNumber}\t${swap}`);
            }
        });

    }
    ////////////////////////////////////////
    async onDone() {
        let count = 0;
        let row;
        let common;
        for( let address in this.mem){
            const e = this.mem[address];
            let y0 = BigNumber(0);
            let y1 = BigNumber(0);
            // calc yield
            if(e.in0.gt(zero)){
                e.price = e.in0.div(e.out1);
                y0 = e.out0.div(e.in0);
                if(!y0.eq(zero)){
                    y0 = y0.minus(one);
                }
            }
            if(e.in1.gt(zero)){
                e.price = e.out0.div(e.in1);
                y1 = e.out1.div(e.in1);
                if(!y1.eq(zero)){
                    y1 = y1.minus(one);
                }
            }

            // add row
            common = `${address},${this.coin.symbol},${e.events},${e.in0},${e.in1},${e.out0},${e.out1}`;
            if(!y0.eq(zero) || !y1.eq(zero)){
                count++;
                const yld = y0.plus(y1);
                //const row = `${address},${y0.toString(10)},${y1.toString(10)}`;
                row = `${common},${y0},${y1},${e.price},${yld}`;
                if(count % 100){
                    console.log(row);
                }
            }else{
                // use last price to calculate yield in case there is no enter+exit action
                let yld = (this.lastPrice.div(e.price)).minus(one);
                row = `${common},0,0,${e.price},${yld}`;
            }
            this.csv.addRow(row);
        }
        this.csv.flush();
        console.log(`total swaps: ${this.swaps}`);
        console.log(`${count} rows / ${Object.keys(this.mem).length} swappers | out of: ${this.swaps} swaps`);
        console.log('Done');
        console.log('-- Senders ----------------------')
        for (let s in this.senders){
            console.log(`${s} : ${this.senders[s]}`);
        }
    }
}


module.exports = Schema;

const uniV2pool = `[{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount0","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1","type":"uint256"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"Burn","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount0","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1","type":"uint256"}],"name":"Mint","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount0In","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1In","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount0Out","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1Out","type":"uint256"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"Swap","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint112","name":"reserve0","type":"uint112"},{"indexed":false,"internalType":"uint112","name":"reserve1","type":"uint112"}],"name":"Sync","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"constant":true,"inputs":[],"name":"DOMAIN_SEPARATOR","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"MINIMUM_LIQUIDITY","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"PERMIT_TYPEHASH","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"burn","outputs":[{"internalType":"uint256","name":"amount0","type":"uint256"},{"internalType":"uint256","name":"amount1","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getReserves","outputs":[{"internalType":"uint112","name":"_reserve0","type":"uint112"},{"internalType":"uint112","name":"_reserve1","type":"uint112"},{"internalType":"uint32","name":"_blockTimestampLast","type":"uint32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_token0","type":"address"},{"internalType":"address","name":"_token1","type":"address"}],"name":"initialize","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"kLast","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"mint","outputs":[{"internalType":"uint256","name":"liquidity","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"nonces","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"permit","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"price0CumulativeLast","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"price1CumulativeLast","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"skim","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"amount0Out","type":"uint256"},{"internalType":"uint256","name":"amount1Out","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"swap","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"sync","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"token0","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"token1","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"}]`