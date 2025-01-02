
require("@nomicfoundation/hardhat-toolbox");
require("hardhat-gas-reporter");

const deployerPrivateKey = process.env.DEP_PRIVATE_KEY_1??"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
   solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },

  allowUnlimitedContractSize: true,
  gasReporter: {
    enabled: true,
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: false,
    // coinmarketcap: COINMARKETCAP_API_KEY,
  },
};
