
require("@nomicfoundation/hardhat-toolbox");
const deployerPrivateKey = process.env.DEP_PRIVATE_KEY_1??"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks:{
    localhost:{
      url:`https://mobius-besu-rpc.gov-cloud.ai/`,
      accounts:[deployerPrivateKey]

    }
  }
};
