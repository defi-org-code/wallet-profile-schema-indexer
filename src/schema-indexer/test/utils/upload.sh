
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
      {"name":"wethPrice", "type": "double"}]' -F data=@uv_price_coins_3.csv 'http://34.145.174.225:9000/imp?name=price_3'


curl -F schema='[
      {"name":"ts", "type": "TIMESTAMP, "pattern": "yyyy-MM-ddTHH:mm:ss.SSSz"},
      {"name":"block", "type": "INT"},
      {"name":"symbol", "type": "SYMBOL"},
      {"name":"wethPrice", "type": "double"}]' -F data=@uv_price_coins_3.csv 'http://34.145.174.225:9000/imp?name=price_ts&timestamp=ts&partitionBy=DAY'

# With TS no reserve
curl -F schema='[
      {"name":"ts", "type": "TIMESTAMP", "pattern": "yyyy-MM-ddTHH:mm:ss.SSSz"},
      {"name":"block", "type": "INT"},
      {"name":"symbol", "type": "SYMBOL"},
      {"name":"priceWeth", "type": "double"},
      {"name":"priceToken", "type": "double"}]' -F data=@woo.csv 'http://34.145.174.225:9000/imp?name=woo_price&timestamp=ts&partitionBy=DAY'


curl -F schema='[
      {"name":"timestamp", "type": "TIMESTAMP", "pattern": "yyyy-MM-ddTHH:mm:ss.SSSz"},
      {"name":"block", "type": "INT"},
      {"name":"symbol", "type": "SYMBOL"},
      {"name":"priceWeth", "type": "double"},
      {"name":"priceToken", "type": "double"}]' -F data=@price.yfi.csv 'http://34.145.174.225:9000/imp?name=price_yfi_1&timestamp=timestamp&partitionBy=DAY'


-- WORKING!
curl -F data=@uv_price_multi_4.csv http://34.145.174.225:9000/imp

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