const redis = require("redis");
const client = redis.createClient({
    db: 1, 
    host: '34.134.236.209',
    password: 'admin@orbs'
});
let io = require('socket.io-client');
// var colors = require('colors');
const BASE_URL = 'wss://api-v4.zerion.io/';
const TTL = 3600 * 3;
const ZERION_TIMEOUT = 3000;
export const HOLDERS:string = ":holders";
export const WALLET_TME_SERIES:string = "wallet2-time-series:"; 
export const PORTOLIO:string = "portfolio:"; 


client.on("error", function(error: Error) {
    console.error(error);
});

function get(socketNamespace: any, requestBody: any ,key:string): Promise<any> {
    const { socket, namespace } = socketNamespace;
    //chart can support multiple 
    const model = requestBody.scope[0];

    return new Promise( (resolve, reject)=> {
        var tid = setTimeout( ()=> {
            counters.failure++;
            reject();
        }, ZERION_TIMEOUT); 
        socket.emit('get', requestBody);
        socket.once(`received ${namespace} ${model}`, (data:any)=> { 
            socket.emit('unsubscribe');
            clearTimeout(tid);
            resolve(data); 
        });    
    })
}



var counters = {
    starts: 0,
    hit: 0,
    miss: 0,
    missOk: 0,
    failure: 0,
    failureQ: 0,
    emptyRsesponse: 0,
};


const addressSocket = {
    namespace: 'address',
    socket: io(`${BASE_URL}address`, {
        transports: ['websocket'],
        timeout: 60000,
        query: {
            api_token:'Zerion.oSQAHALTonDN9HYZiYSX5k6vnm4GZNcM',
            
        },
    }),
};


interface IChartResponse {
    payload: {
        charts: {
            others: string[]
        }
    }
}


interface IPortfolioResponse {
    payload: {
        portfolio: IPortfolio;
    }
}

interface IPortfolio {
    
    assets_value: number;
    deposited_value: number;
    borrowed_value: number;
    locked_value: number;
    staked_value: number;
    bsc_assets_value: number;
    polygon_assets_value: number;
    total_value: number;
    absolute_change_24h: number;
    relative_change_24h: number;
}

async function fetchChartRedis(address: string): Promise<string[]> {
    return new Promise( (resolve, reject) => {
        let key = WALLET_TME_SERIES + address;
        client.zrange(key, 0, -1, 'withscores', (err: Error, results: string[])=> {
            if(err) {
                console.log(err);
                return reject();          
            }
            resolve(results);
        });
    })
}


async function fetchChart(address: string, lookBack: ZERION_LOOK_BACK): Promise<IChartResponse> {
    return new Promise(async (resolve, reject)=> {
        counters.miss++;

        
        var tid = setTimeout( ()=> {
            //     graphiteCounter.addError('zerion.Timeout');
            //     console.log('fetchTimeSeries timeout', address);
            //    // counters.failure++;
            console.log(' ===== zerion timeout '+address, counters);
            //     delete callbacks['charts:'+address.toLowerCase()];
            //     delete callbacks['portfolio:'+address.toLowerCase()];
            return reject();
        }, ZERION_TIMEOUT);
        
        let started = Date.now();
        let response:any;
        try {

            response = await get(addressSocket, {
                scope: ['charts'],
                payload: {
                    address: address,
                    charts_type: lookBack,
                    currency: 'usd',
                    portfolio_fields: 'all'
                }}, 'charts:'+address.toLowerCase());
        } catch(e) {
            
            clearTimeout(tid);
            return reject()    
        }
            
        clearTimeout(tid);
        const took = Date.now() - started;
        let chartResposne = response as IChartResponse;
        if(!chartResposne.payload.charts.others) {
            console.log('charts.others is null ', address);
            counters.emptyRsesponse++;
            clearTimeout(tid);
            return reject();
        }
;       let chartLen = chartResposne.payload.charts.others.length;
        if (!chartResposne.payload && chartLen == 0) {
            //console.log('zerion.fetchTimeSeries others.length === 0', address);
            counters.emptyRsesponse++;
            clearTimeout(tid);
            return reject();
        }
        resolve(chartResposne);
        counters.missOk++;
        console.log('counters', counters);
        //console.log('zerion api success took', took, address);
            
            
    });
}
    
    
    
    
async function fetchProtfolio(address: string): Promise<IPortfolioResponse> {
    // console.log('fetchProtfolio', address)
    return new Promise(async (resolve, reject)=> {
        counters.miss++;
        
        var tid = setTimeout( ()=> {
            //     graphiteCounter.addError('zerion.Timeout');
            //     console.log('fetch zerion.Protfolio timeout', address);
            //    // counters.failure++;
            console.log('timeout '+address, counters);
            return reject();
        }, ZERION_TIMEOUT);
        
        //let started = Date.now();
        let response = await get(addressSocket, {
            scope: ['portfolio'],
            payload: {
                address: address,
                currency: 'usd',
                portfolio_fields: 'all'
            }
        },`portfolio:${address.toLowerCase()}`);

        
        clearTimeout(tid);
        let portfolioResposne = response as IPortfolioResponse;
        let portfolio = portfolioResposne.payload.portfolio;
        if (!portfolioResposne.payload && portfolio ) {
            console.log('zerion.fetch portfolio  is null', address);
            clearTimeout(tid);
            return reject();
        }
        resolve(portfolioResposne);
        counters.missOk++;
        console.log('counters', counters);
            //  console.log('success took', took, address,'payload.protfolio OK');
        
        
    })
}
    
    
    

var errors = 0;

var counter = 0;
var buildPortfolioHistoryCounter = 0;
export async function buildPortfolio(holder: string): Promise<IPortfolio> {
    // console.log('buildPortfolioHistory', holder);
    //console.log('buildPortfolioHistoryCounter ',buildPortfolioHistoryCounter++, holder);
    
    return new Promise( async (resolve, reject) => {
        // console.log('holder ',holder);
        try {
            counters.starts++;
            var protfolioResponse = await fetchProtfolio(holder);
            var key = PORTOLIO + holder; 
            
            var portfolio = protfolioResponse.payload.portfolio;
            if (!portfolio) {                
                console.log('*** error: portfolio response is null == 0',holder);
                return reject()
            }
            
            client.set(key, JSON.stringify(portfolio));
            //client.expire(key, TTL)
            resolve(portfolio);
        } catch(e) {
            reject(e);
        }
    });
    }
    
    
export async function buildPortfolioHistory(holder: string): Promise<object> {
    //console.log(`buildPortfolioHistory ${holder}`);
    counters.starts++;
    return new Promise( async (resolve, reject) => {
        let cachedTimeSeries = await fetchChartRedis(holder);
        if(cachedTimeSeries.length == 0 ) {
            //MISS
            try {
                let chartResponse = await fetchChart(holder, 'y');
                var key = WALLET_TME_SERIES + holder; 
                let multi = client.multi();
                
                var charts = chartResponse.payload.charts.others;
                if (!charts || charts.length === 0) {
                    
                    //console.log(`*** error: charts others.length == 0 ${chartResponse.payload} | ${holder}`);
                    return reject()
                }
                let timeSeries: string[] = [];
                charts.forEach( (it)=> {
                    multi.zadd(key, it[0] ,it[1]);
                    timeSeries.push(it[1] ,it[0]);
                })
                multi.exec(function(err: Error, results: string[]){
                    if (err) { throw err; } else {
                        //resolve(flatArr);
                        let portfolio = redisArrToTimeSeriesObj(timeSeries);
                        resolve(calculateScores(portfolio));
                    }
                });
            } catch(e) {
                return reject();
            }
        } else {
            counters.hit++;
            let portfolio = redisArrToTimeSeriesObj(cachedTimeSeries);
            let scores = calculateScores(portfolio);
            resolve(scores);
        }
    });
}

function calculateScores(portfolio: object): object {
    let scores = calcScoreByHistory(portfolio);
    let scoresW = calcScoreByHistory(portfolio, 'w');
    let scoresY = calcScoreByHistory(portfolio, 'y');
    return Object.assign(scoresW ,scores, scoresY);
}

type ZERION_LOOK_BACK = 'y' | 'm' | 'w';

function calcScoreByHistory(portfolio: object, daysToLookBack: ZERION_LOOK_BACK = 'm') : object {
    let firstBalance = findFirstScore(portfolio, daysToLookBack);
    let lastBalance = findLastScore(portfolio);
    let score = lastBalance / firstBalance - 1;
    score = isNaN(score) ? -1 : score;
    let out = {};
    let lookBackStr = '_' + daysToLookBack;
    out[`firstBalance${lookBackStr}`] = firstBalance;
    out[`lastBalance${lookBackStr}`] = lastBalance;
    out[`score${lookBackStr}`] = score;
    if(daysToLookBack == 'm') {
        out['score'] = score;
    }
    return out;
}


function findFirstScore(protfolio: Object, lookBack: ZERION_LOOK_BACK): number {
    let offset = 0; // M
    switch(lookBack) {
        case 'w':
            offset = 7;
            break;
        case 'm':
            offset = 30;
            break;
        case 'y':
            offset = 0;
            break;
    }
    let firstNonZero = 0;
    let counter = 0;
    for(var key in protfolio) {
        counter++;
        if(counter < offset) {
            continue;
        }
        if(parseInt(protfolio[key]) > 0){
            firstNonZero = parseInt(protfolio[key]);   
            break;
        }
    }
   
    return firstNonZero;
}

function  findLastScore(protfolio: Object): number{
    let firstNonZero = 0;
    let counter = 0;
    let keys = Object.keys(protfolio);
    for (let i = keys.length; i > 0; i--) {
        // key => timestamp : balance
        let key = keys[i];
        const balance = parseInt(protfolio[keys[i]]);
        if(balance > 0){
            firstNonZero = balance;   
            break;
        }
    }
    return firstNonZero;
}

function redisArrToTimeSeriesObj(arr: string[]) : Object{
    var obj = {};
    for(var i = 0; i < arr.length; i+=2) {
        obj[arr[i+1]] = arr[i];
    }
    return obj;
}