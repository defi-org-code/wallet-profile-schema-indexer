
178,727,745,595.927886699
166,001,100,833.764 MISHKA

curl \
-F schema='[{"name":"ts", "type": "TIMESTAMP", "pattern": "yyyy-MM-dd - HH:mm:ss"}]' \
-F data=@weather.csv 'http://localhost:9000/imp?overwrite=true&timestamp=ts'


block,symbol,wethReserve,tokenReserve,priceWeth

# working!!
curl -F schema='[
      {"name":"block", "type": "INT"},
      {"name":"symbol", "type": "SYMBOL"},
      {"name":"wethReserve", "type":"DOUBLE"},
      {"name":"tokenReserve", "type": "DOUBLE"},
      {"name":"wethPrice", "type": "double"}]' -F data=@uv_price_coins_3.csv 'http://35.245.119.216:9000/imp?name=price_3'

curl -F schema='[
      {"name":"address", "type": "SYMBOL"},
      {"name":"y0", "type": "DOUBLE"},
      {"name":"y1", "type": "DOUBLE"}]' -F data=@uniswap_yfi.csv 'http://35.245.119.216:9000/imp?overwrite=true&name=uniswap_yfi'


curl -F schema='[
      {"name":"ts", "type": "TIMESTAMP, "pattern": "yyyy-MM-ddTHH:mm:ss.SSSz"},
      {"name":"block", "type": "INT"},
      {"name":"symbol", "type": "SYMBOL"},
      {"name":"wethPrice", "type": "double"}]' -F data=@uv_price_coins_3.csv 'http://35.245.119.216:9000/imp?name=price_ts&timestamp=ts&partitionBy=DAY'

# With TS no reserve
curl -F schema='[
      {"name":"ts", "type": "TIMESTAMP", "pattern": "yyyy-MM-ddTHH:mm:ss.SSSz"},
      {"name":"block", "type": "INT"},
      {"name":"symbol", "type": "SYMBOL"},
      {"name":"priceWeth", "type": "double"},
      {"name":"priceToken", "type": "double"}]' -F data=@woo.csv 'http://35.245.119.216:9000/imp?name=woo_price&timestamp=ts&partitionBy=DAY'


curl -F schema='[
      {"name":"timestamp", "type": "TIMESTAMP", "pattern": "yyyy-MM-ddTHH:mm:ss.SSSz"},
      {"name":"block", "type": "INT"},
      {"name":"symbol", "type": "SYMBOL"},
      {"name":"priceWeth", "type": "double"},
      {"name":"priceToken", "type": "double"}]' -F data=@price.yfi.csv 'http://35.245.119.216:9000/imp?name=price_yfi_1&timestamp=timestamp&partitionBy=DAY'

# holder count
curl -F schema='[
      {"name":"block", "type": "INT"},
      {"name":"symbol", "type": "SYMBOL"},
      {"name":"holder_total", "type": "INT"},
      {"name":"holder_positive", "type": "INT"}]' -F data=@holder_count_mishka.csv 'http://35.245.119.216:9000/imp?name=holder_count_mishka&timestamp=timestamp'

# score_uniswap
curl -F schema='[
      {"name":"address", "type": "SYMBOL"},
      {"name":"score", "type": "float"}]' -F data=@score_uniswap.csv 'http://35.245.119.216:9000/imp?name=score_uniswap'

# uni_score_all
# timestamp,block,symbol,priceToken,priceUSD,matches,avgYield,avgYieldPos,avgYieldNeg,avgProf,waProf
curl -F schema='[
      {"name":"timestamp", "type": "TIMESTAMP", "pattern": "yyyy-MM-ddTHH:mm:ss.SSSSSSz"},
      {"name":"block", "type": "INT"},
      {"name":"symbol", "type": "symbol"},
      {"name":"priceToken", "type": "double"},
      {"name":"priceUSD", "type": "double"},
      {"name":"matches", "type": "short"},
      {"name":"avgYield", "type": "double"},
      {"name":"avgYieldPos", "type": "double"},
      {"name":"avgYieldNeg", "type": "double"},
      {"name":"avgProf", "type": "double"},
      {"name":"waProf", "type": "double"}]' -F data=@uni_score_all.csv 'http://35.245.119.216:9000/imp?name=uni_score_all&timestamp=timestamp&partitionBy=DAY'

# uv_price_weth_usdc.csv
# block,symbol,wethReserve,tokenReserve,priceWeth
curl -F schema='[
      {"name":"block", "type": "INT"},
      {"name":"price", "type": "double"}]' -F data=@uv_price_weth_usdc.csv 'http://35.245.119.216:9000/imp?name=uv_price_weth_usdc'



-- WORKING!
curl -F data=@uv_price_multi_4.csv http://35.245.119.216:9000/imp

12520000,usdc,0.000138509534776175,51156950610612688.68184,369338837887802843840.87688636514640736234



FLOKI 231889326393098336283
      420568431314882547530

WETH  426590211765492550520
      228006340129257951058

# symbol:"woo",
# address:"0x4691937a7508860f876c9c0a2a617e7d9e945d4b",
# createBlock:0,
# decimals:18,
# lpAddress:"0x6ada49aeccf6e556bb7a35ef0119cc8ca795294a",
# lpCreateBlock: 11154588 ,

npm run test-schema uv-price '{"symbol":"woo","address":"0x4691937a7508860f876c9c0a2a617e7d9e945d4b","createBlock":0,"decimals":18,"lpAddress":"0x6ada49aeccf6e556bb7a35ef0119cc8ca795294a","lpCreateBlock":11154588, "outfile":"woo.csv"}'
