
const { Client } = require("pg")

/////////////////////////////////////
function QuestDBWriter(table, values, _batchSize){
  let batchSize = _batchSize || 0x10;
  let rows = [];
  let client;
  ////////////////////////////////////////
  async function connect(){
    try {
      client = new Client({
        database: "qdb",
        //host: "localhost",
        host: "34.145.174.225",
        password: "quest",
        port: 8812,
        user: "admin",
      })
      await client.connect();
    }
    catch(e){
      console.error('QuestDBWriter', e);
    }
  }
  /////////////////////////////////////
  async function flush(){
    // WRONG
    // for(let row of rows){
    //   await client.query(`INSERT INTO ${table} VALUES(${values});`, row);
    // }
    // RIGHT?
    for(let row of rows){
      // Providing a 'name' field allows for prepared statements / bind variables
      const query = {
        name: "insert-values",
        text: `INSERT INTO ${table} VALUES(${values});`,
        values: row,
      }
      const preparedStatement = await client.query(query);
      //console.log(preparedStatement);
    }

    const commit = await client.query("COMMIT");
    //console.log(commit);
    rows = [];
  }
  /////////////////////////////////////
  async function addRow(row){
    rows.push(row);
    if(rows.length < batchSize)
      return;

    //console.log('flush 1');
    await flush();
    //console.log('flush 2');
  }
  ////////////////////////////////////////
  return {
    connect:connect,
    addRow:addRow,
    client:()=>{return client},
    flush:flush
  }
}

///////////////////////////////////////////
// RUN TEST
async function test(){
  const table = 'uv_price_test6';
  this.writer = QuestDBWriter(table, "$1, $2, $3, $4");
  this.writer.connect();
  const createTable = await this.writer.client().query(`CREATE TABLE IF NOT EXISTS ${table} (ts TIMESTAMP, block LONG, t1 LONG256, t2 LONG256) timestamp(ts);`);
  console.log(createTable);
  const commit = await this.writer.client().query("COMMIT");
  console.log(commit);

  await writer.addRow([new Date().toISOString(), 1111, '1632129232106305727134396', '1632129232106305727134396']);
  await writer.addRow([new Date().toISOString(), 2222, '1632129232106305727134396', '1632129232106305727134396']);
  await writer.addRow([new Date().toISOString(), 3333, '1632129232106305727134396', '1632129232106305727134396']);

  await writer.flush();
  // writer.addRow([Date.now() * 1e6, 1111, '0x650D7913A9840987d80b5E8646F8EF9f82Cf3011', '1632129232106305727134396']);
  // writer.addRow([new Date().toISOString(), 2222, '0x650D7913A9840987d80b5E8646F8EF9f82Cf3022', 2]);
  // writer.addRow([new Date().toISOString(), 3333, '0x650D7913A9840987d80b5E8646F8EF9f82Cf3033', 3]);


}
///////////////////////////////////////////
if (require.main === module) {
  try{
    test();
  }catch(e){
    console.error('Error', e);
  }
}

module.exports = QuestDBWriter;