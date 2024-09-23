
require("@nomicfoundation/hardhat-toolbox");
const deployerPrivateKey = process.env.DEP_PRIVATE_KEY_1;

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
