import axios from 'axios';

export async function fetchTopCoins() {
    try {
        const url = 'https://www.dextools.io/shared/hotpairs/hot?chain=ether';
        
        const response = await axios.get(url);
        console.log('Response:', response.data);
        
        if(response.status === 200 && response.data && response.data.data) {
            console.log('Response:', response.data.data);
            
            const coinsData = response.data.data[0].data;
            let result = {}
            coinsData.forEach((coin: any) => {
                if (!coin.name) {
                    return result;
                }
                
                const coinName = coin.name;
                const symbol = coin.symbol;
                const tokenAddress = coin.id.token;
                const pairAddress = coin.id.pair;
                const creationTime = coin.creationTime;
                const holders = coin.token.metrics.holders;
                const liquidity = coin.metrics.liquidity;
                const score = coin.dextScore.total;
                console.log('Coin:', coinName, tokenAddress, pairAddress, creationTime, holders, liquidity, score);
                
                result[coinName] = {
                    name: coinName,
                    symbol,
                    tokenAddress,
                    pairAddress,
                    creationTime,
                    holders,
                    liquidity,
                    score,
                };
                
            });
            
            return result;
        } else {
            console.error('Error fetching coin data');
        }
    } catch (error) {
        console.error('Error fetching coin data:', error);
    }
}




interface ResponseData {
    data:{
        price: number;
        liquidity: number;
        token: {
            name: string;
        };
        pool: {
            liquidity: number;
        }
    }[];
}

export async function fetchPairData(pairAddress: string) {
    try {
        const url = `https://www.dextools.io/shared/data/pair?address=${pairAddress}&chain=ether&audit=true`;
        console.log('fetchPairData url:', url);
        
        const response = await axios.get<any>(url);
        console.log(response.data.data);
        
        //@ts-ignore
        if (response.data.data.length > 0) {
            const resultData = response.data.data[0];
            console.log('Result:', resultData);
            
            const price = resultData.price;
            const liquidity = resultData.metrics.liquidity;
            const initialLiquidity = resultData.metrics.initialLiquidity;
            const name = resultData.token.name;
            const holders = resultData.token.metrics.holders;
            const fdv = resultData.token.metrics.fdv;
            const symbol = resultData.token.symbol;
            
            const responseObject = {
                price: price,
                fdv: fdv,
                price6h: resultData.price6h.price,
                buys6h: resultData.price6h.buys,
                sells6h: resultData.price6h.sells,
                price24h: resultData.price24h.price,
                buys24h: resultData.price24h.buys,
                sells24h: resultData.price24h.sells,
                volume24h: resultData.price24h.volume,
                liquidity: liquidity,
                initialLiquidity: initialLiquidity,
                name: name,
                symbol: symbol,
                holders: holders,
            };
            
            console.log(responseObject);
            
            return responseObject;
        } else {
            console.log("No results found.");
            return null;
        }
    } catch (error) {
        console.error("Error fetching data:", error);
        return null;
    }
}

// fetchPairData('0xa385bc4593b41c024dd53023538eb1128c040fcf')