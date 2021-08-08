import * as fs from "fs";
import { Perf } from "../perf";
import { processSchema } from "../processor";
import { LocalTestData } from "./data";


async function main() {
  console.log(process.argv);
  const schemaName = process.argv[2]; 
  let schemaArguments;
  try {
    //npm run test-schema generic-holders '{"symbol":"woo","address":"0x4691937a7508860f876c9c0a2a617e7d9e945d4b","createBlock":0,"decimals":18,"lpAddress":"0x6ada49aeccf6e556bb7a35ef0119cc8ca795294a","lpCreateBlock":11154588, "outfile":"woo.csv"}'
    schemaArguments = JSON.parse(process.argv[3]) || {};
  } catch(e) {
    schemaArguments = {};
  }
  if (!schemaName) {
    console.log("Usage: test-schema <name>");
    console.log(" name: blocks|events|calls|calls-detailed|storage|code|fast-holders");
    console.log("");
    process.exit(0);
  }

  const jsFilePath = `${__dirname}/schemas/${schemaName}.js`;
  if (!fs.existsSync(jsFilePath)) {
    console.error("ERROR: Invalid schema, see usage for available test schemas.", jsFilePath);
    process.exit(0);
  }

  const perf = new Perf();
  const data = new LocalTestData(process.env.THE_INDEX_DATA_DIR || `${__dirname}/data`, perf);

  console.log(`Processing schema:\n${jsFilePath}\n args ${schemaArguments}`);
  await processSchema(jsFilePath, data, perf, schemaArguments);

  perf.report();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
