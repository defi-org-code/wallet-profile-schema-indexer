import axios from 'axios';
import BN from 'bignumber.js';
import * as csvWriter from 'csv-writer';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import fs from 'fs';

const ETHERSCAN_API_KEY = 'GEQZVMM3JHZMCKES5RC6M9J4U3HADDRI26';
const ETHERSCAN_API_URL = `https://api.etherscan.io/api?apikey=${ETHERSCAN_API_KEY}`;

const web3 = new Web3(new Web3.providers.HttpProvider(`https://eth-mainnet.g.alchemy.com/v2/T2CqQfiMJI3yJa1BTnfQfPG6hcfir7Tn`));

const erc20Abi = [
    {
        "constant": true,
        "inputs": [
            {
                "name": "_owner",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "name": "balance",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
] as AbiItem[];

export interface TokenHolder {
    address: string;
    balance: string;
}


const getTokenDecimals = async (tokenAddress: string): Promise<number> => {
  const erc20ABI = [
    {
      constant: true,
      inputs: [],
      name: 'decimals',
      outputs: [{ name: '', type: 'uint8' }],
      payable: false,
      stateMutability: 'view',
      type: 'function',
    },
  ] as AbiItem[];

  const tokenContract = new web3.eth.Contract(erc20ABI, tokenAddress);
  const decimals = await tokenContract.methods.decimals().call();
  return parseInt(decimals);
};

async function getERC20TokenHolders(tokenAddress: string, pairAddress: string): Promise<TokenHolder[]> {
    try {
        let url = `${ETHERSCAN_API_URL}&module=account&action=tokentx&contractaddress=${tokenAddress}&address=${pairAddress}`;
        const response = await axios.get(url);
        const dexSwaps = response.data.result;
        
        const tokenHoldersSet = new Set<string>();
        dexSwaps.forEach((swap: any) => {
            tokenHoldersSet.add(swap.from);
            tokenHoldersSet.add(swap.to);
        });
        
        const tokenHolders: TokenHolder[] = [];
        const holderAddresses = Array.from(tokenHoldersSet);
        const batchSize = 4;
        const tokenDecimals = await getTokenDecimals(tokenAddress);
        console.log(`Token decimals: ${tokenDecimals}, holder addresses: ${holderAddresses.length}`);
        
        
        for (let i = 0; i < holderAddresses.length; i += batchSize) {
            const batch = holderAddresses.slice(i, i + batchSize);
            const batchBalances = await Promise.all(batch.map(holderAddress => getERC20TokenBalance(holderAddress, tokenAddress, tokenDecimals)));
            
            batch.forEach((holderAddress, index) => {
                const balance = batchBalances[index];
                if (parseFloat(balance) < 1) return;
                
                //console.log(`** Address: ${holderAddress}, Balance: ${balance}`);
                tokenHolders.push({ address: holderAddress, balance });
            });
        }
        
        return tokenHolders;
    } catch (error) {
        console.error(error);
        return [];
    }
}

async function getERC20TokenBalance(address: string, tokenAddress, decimals = 18): Promise<string> {
    try {
        const erc20Contract = new web3.eth.Contract(erc20Abi, tokenAddress);
        const balance = await erc20Contract.methods.balanceOf(address).call();
        
        const formattedBalance = new BN(balance).dividedBy(new BN(10).pow(decimals)).toFixed(2);
        return formattedBalance;
    } catch (error) {
        console.error(error);
        return '0';
    }
}

async function dumpTokenHoldersToCSV(tokenHolders: TokenHolder[], fileName: string): Promise<void> {
    const csvWriterInstance = csvWriter.createObjectCsvWriter({
        path: fileName,
        header: [
            { id: 'address', title: 'Address' },
            { id: 'balance', title: 'Balance' },
        ],
    });
    
    await csvWriterInstance.writeRecords(tokenHolders);
    console.log(`Token holders data successfully written to ${fileName}`);
}

export function fetchHolders(tokenAddress: string, pairAddress: string): Promise<TokenHolder[]> {
    return getERC20TokenHolders(tokenAddress, pairAddress);
}

export async function getHoldersCSV(tokenAddress: string, pairAddress: string, csvFileName: string): Promise<TokenHolder[]> {
    if (fs.existsSync(csvFileName)) {
        console.log(`File ${csvFileName} already exists. Skipping fetching token holders.`);
        return;   
    }
    const tokenHolders = await fetchHolders(tokenAddress, pairAddress);
    await dumpTokenHoldersToCSV(tokenHolders, csvFileName);
    return tokenHolders;
}
