const { expect } = require("chai")
const  {loadFixture} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { string } = require("hardhat/internal/core/params/argumentTypes");
const { ethers } = require("hardhat");
describe("UTToken", function () {

    async function deployUTTokenLoadFixture() {
        // Constructor params
        const [initialAddress, txnTaxWallet] = await ethers.getSigners();
        const preMintValue = String(10000000)
        const _tokenTicker = "UT"
        const _tokenName = "UtilityToken"
        const _initialAddress = initialAddress
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
        const _txnTaxWallet = txnTaxWallet
        const decimals_ = String(18)

        const UTContract = await ethers.getContractFactory("UTToken")
        const UTDeploy = await UTContract.deploy(preMintValue, _tokenTicker, _tokenName, _initialAddress, _actions, _txnTaxRate, _txnTaxWallet, decimals_)
        return { UTDeploy, _tokenName, _tokenTicker, _initialAddress, }

    }
    describe("UTToken Deployment", function () {
        it("should set the token name", async function () {
            const { UTDeploy, _tokenName,_tokenTicker } = await loadFixture(deployUTTokenLoadFixture)
            expect(await UTDeploy.name()).to.equal(_tokenName)
            expect(await UTDeploy.symbol()).to.equal(_tokenTicker)
        })
    })
})

