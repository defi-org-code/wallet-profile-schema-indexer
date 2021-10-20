import { exec } from "child_process"
import { coin, getCoins} from "../schema-indexer/test/utils/uv-coins";

const os = require('os');
const cpuCount = os.cpus().length;

function pExec(cmd:string, cwd = '/data/the-index'): Promise<string> {
    console.log(`Starting job ${cmd}`);
    console.time(cmd);
    return new Promise( (resolve, reject) => {
        exec(cmd, { cwd: cwd}, (err, stdout, stderr) =>{
            if(err) {
                console.log(err);
                resolve(stdout);
                return
            }
            console.timeEnd(cmd);
            resolve(stdout);
        })
    })
}

async function execSchemasInParallel(jobname:string, coins :coin[]): Promise<void> {
    return new Promise( async (resolve, reject) => {

        let arr =[];
        for(let coin of coins) {
			const coinStr = JSON.stringify(coin);
			let cmd = `npm run test-schema ${jobname} '${coinStr}' > ./log/${jobname}_${coin.symbol}.log`
			console.log(cmd);
            arr.push(pExec(cmd));
            if(arr.length > cpuCount - 6) {
                console.log(`waiting for cores to be free jobs running in parallel: ${arr.length}`)
                await Promise.all(arr);
                arr = [];
                console.log('all cores are free ')
            }
        }
        await Promise.all(arr);
        resolve();
    });
}

async function run() {
	console.log('---------------------');
	console.log(process.argv);
	console.log('---------------------');

    console.time('uv-run-coins');
    const coins = getCoins();

    await execSchemasInParallel(process.argv[2], coins);

	console.timeEnd('uv-run-coins');
	process.exit();
}

run();