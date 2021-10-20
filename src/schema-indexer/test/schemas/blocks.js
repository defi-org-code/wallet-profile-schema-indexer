// find all blocks with hash that starts with 0x12345

class Schema {
  async onInit(web3) {
    this.web3 = web3;
  }

  async onBlock(blockNumber) {
    if(blockNumber < 12000000) {
      return
    }

    if(blockNumber % 1000 !== 0) {
      return
    }
    const block = await this.web3.getBlock();
    console.dir(block);
    //if (block?.hash.startsWith("0x12345")) {
      console.log(`block ${blockNumber}: ${block?.gasLimit}`);
    //}
  }
}

module.exports = Schema;
