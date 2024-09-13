const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const initAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
module.exports = buildModule("UTToken", (m) => {
    const preMintValue = String(10000000)
    const _tokenTicker = "UT"
    const _tokenName = "UtilityToken"
    const _initialAddress = initAddress
    const _actions = {
        canMint: false,
        canBurn: false,
        canPause: false,
        canBlacklist: false,
        canChangeOwner: false,
        canTxTax: false,
        canBuyBack: false,
        canStake: false
    };
    const _txnTaxRate = String(2)
    const _txnTaxWallet = initAddress
    const decimals_ = String(18)

    const contract = m.contract("UTToken", [preMintValue, _tokenTicker,_tokenName,_initialAddress,_actions,_txnTaxRate,_txnTaxWallet,decimals_])
    return {contract}
})

// console.log(process.env.DEP_PRIVATE_KEY_1)