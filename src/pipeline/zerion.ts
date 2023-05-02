
import { client } from './cache';
import  io  from 'socket.io-client';
// var colors = require('colors');
const BASE_URL = 'wss://api-v4.zerion.io/';
const TTL = 3600 * 3;

const ZERION_TIMEOUT = 10000;

export const HOLDERS: string = ":holders";
export const WALLET_SCORES :string = "wallet-scores:"; 
export const PORTFOLIO :string = "portfolio:"; 


//wss://api-v4.zerion.io/socket.io/?api_token=Zerion.oSQAHALTonDN9HYZiYSX5k6vnm4GZNcM&EIO=3&transport=websocket

client.on("error", function(error: Error) {
    console.error(error);
});

function get(socketNamespace: any, requestBody: any ,key:string): Promise<any> {
    const { socket, namespace } = socketNamespace;
    //chart can support multiple 
    const model = requestBody.scope[0];
    console.log(`get ${namespace} ${model}`);
    
    return new Promise( (resolve, reject)=> {
        var tid = setTimeout( ()=> {
            counters.failure++;
            console.log(`get ${namespace} ${model} timeout`);
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


async function fetchPortfolioRedis(address: string): Promise<any> {
    
    let key = PORTFOLIO + address;
    let data = await client.get(key)
    console.log('fetchPortfolioRedis',data);
    
    return JSON.parse(data)
    
}


async function fetchScores(key:string): Promise<string[]> {
    let data = await client.get(key)
    console.log(`${key} -- >`,data);
    
    if (!data) {
        return [];
    }
    return JSON.parse(data);
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
    
    
    
    
    async function fetchPortfolio(address: string): Promise<IPortfolioResponse> {
        
        return new Promise(async (resolve, reject)=> {
            counters.miss++;
            let cachedVersion = await fetchPortfolioRedis(address);
            
            if (cachedVersion && cachedVersion.assets_value) {
                console.log('zerion.fetchPortfolio redis hit', address);
                
                counters.missOk++;
                return resolve(cachedVersion);
            }
            
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
        })
    }
    
    
    
    
    var errors = 0;
    
    var counter = 0;
    var buildPortfolioHistoryCounter = 0;
    export async function buildPortfolio(holder: string): Promise<IPortfolio> {
        
        return new Promise( async (resolve, reject) => {
            // console.log('holder ',holder);
            try {
                counters.starts++;
                var portfolioResponse = await fetchPortfolio(holder);
                var key = PORTFOLIO + holder; 
                
                var portfolio = portfolioResponse.payload.portfolio;
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
    
    
    export async function buildPortfolioHistory(holder: string, cacheOnly: boolean): Promise<object> {
        //console.log(`buildPortfolioHistory ${holder}`);
        counters.starts++;
        return new Promise(async (resolve, reject) => {
            var key = WALLET_SCORES + holder;
            console.log('key', key);
            
            let cachedScores = {}
            try {
                cachedScores = await fetchScores(key);
                console.log('cachedTimeSeries', cachedScores);
            } catch(e) {
                console.log('fetchScores error', e);
            }
            if (Object.keys(cachedScores).length) {
                //HIT
                console.log({ cachedScores });
                counters.hit++;
                //@ts-ignore
                cachedScores.cache = 'HIT';
                resolve(cachedScores);
                return;
            }
            // we have no cache so we return empty object
            if (cacheOnly) {
                return reject();
            }
            
            
            //MISS
            try {
                let chartResponse = await fetchChart(holder, 'y');
                var charts = chartResponse.payload.charts.others;
                if (!charts || charts.length === 0) {
                    //console.log(`*** error: charts others.length == 0 ${chartResponse.payload} | ${holder}`);
                    return reject()
                }
                let timeSeries: string[] = [];
                charts.forEach( (it)=> {    
                    timeSeries.push(it[1] ,it[0]);
                })
                
                let portfolio = redisArrToTimeSeriesObj(timeSeries);
                let scores = calculateScores(portfolio);
                client.set(key, JSON.stringify(scores));
                //@ts-ignore
                cachedScores.cache = 'MISS';
                resolve(scores);
                
            } catch (e) {
                // timeout cache empty string for short TTL
                await client.set(key, '');
                await client.expire(key, 360);

                return reject();
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
    
    
    function findFirstScore(portfolio: Object, lookBack: ZERION_LOOK_BACK): number {
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
        for(var key in portfolio) {
            counter++;
            if(counter < offset) {
                continue;
            }
            if(parseInt(portfolio[key]) > 0){
                firstNonZero = parseInt(portfolio[key]);   
                break;
            }
        }
        
        return firstNonZero;
    }
    
    function  findLastScore(portfolio: Object): number{
        let firstNonZero = 0;
        let counter = 0;
        let keys = Object.keys(portfolio);
        for (let i = keys.length; i > 0; i--) {
            // key => timestamp : balance
            let key = keys[i];
            const balance = parseInt(portfolio[keys[i]]);
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
    
    
    
    
    export async function scoreWallet(wallet: string, cacheOnly = false) {
        //let protfolio = await buildPortfolio(wallet);
        
        let chart = await buildPortfolioHistory(wallet, cacheOnly);
        //@ts-ignore
        chart.wallet= wallet;
        return chart;
    }
    
    //scoreWallet('0xc102d21da143cb144bbdc4693553a850cf73ca5f')