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

