import Web3 from "web3";
import BN from "bn.js";

export const zero = bn("0");
export const ether = bn18("1");
export const max = "115792089237316195423570985008687907853269984665640564039457584007913129639935";

export function bn(n: BN | string | number): BN {
  if (!n) return zero;
  return new BN(n, 10);
}

/**
 * assuming 18 decimals, uncommify
 */
export function bn18(n: string): BN {
  return bn(Web3.utils.toWei(n.split(",").join(""), "ether"));
}

/**
 * assuming 8 decimals, uncommify
 */
export function bn8(n: string): BN {
  return bn(Web3.utils.toWei(n.split(",").join(""), "shannon")).divn(10);
}

/**
 * assuming 6 decimals, uncommify
 */
export function bn6(e: string): BN {
  return bn(Web3.utils.toWei(e.split(",").join(""), "lovelace"));
}

export function fmt18(ether: BN | number | string) {
  return Web3.utils.fromWei(bn(ether), "ether");
}

export function fmt6(ether: BN | number | string) {
  return Web3.utils.fromWei(bn(ether), "lovelace");
}

export function configFile() {
  return require("../../.config.json");
}
