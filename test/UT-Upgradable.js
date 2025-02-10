const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers, upgrades } = require("hardhat");
const { expect, use } = require("chai");

describe("Upgradable Proxy UT", function () {
    async function UTParams() {
        const [owner, txnTaxWallet, user1, user2] = await ethers.getSigners();
        const preMintValue = String(10000000);
        const _tokenTicker = "UT";
        const _tokenName = "UtilityToken";
        const _initialAddress = owner.address;
        const _actions = {
            canMint: true,
            canBurn: true,
            canPause: true,
            canBlacklist: true,
            canChangeOwner: false,
            canTxTax: true,
            canBuyBack: false,
            canStake: true,
        };
        const _txnTaxRate = String(20);
        const decimals_ = String(18);
        const rewardRates = [
            [3, 5],
            [6, 10],
            [9, 15],
            [12, 20],
        ];


        return [
            preMintValue,
            _tokenTicker,
            _tokenName,
            _initialAddress,
            _actions,
            _txnTaxRate,
            txnTaxWallet.address,
            decimals_,
            rewardRates,
        ];

    }
    async function UT2Params() {
        const [owner, txnTaxWallet, user1, user2] = await ethers.getSigners();
        const preMintValue = String(10000000);
        const _tokenTicker = "UT_PROXY";
        const _tokenName = "UtilityToken_PROXY";
        const _initialAddress = owner.address;
        const _actions = {
            canMint: true,
            canBurn: true,
            canPause: true,
            canBlacklist: true,
            canChangeOwner: false,
            canTxTax: true,
            canBuyBack: false,
            canStake: true,
        };
        const _txnTaxRate = String(20);
        const decimals_ = String(18);
        const rewardRates = [
            [3, 5],
            [6, 10],
            [9, 15],
            [12, 20],
        ];


        return [
            preMintValue,
            _tokenTicker,
            _tokenName,
            _initialAddress,
            _actions,
            _txnTaxRate,
            txnTaxWallet.address,
            decimals_,
            rewardRates,
        ];

    }

    async function deployUTUpgradableProxy() {
        const { owner, user1 } = await ethers.getSigners();
        const params = await UTParams();
        const UT = await ethers.getContractFactory("UTtokenUpgradeable")
        const ut = await upgrades.deployProxy(UT, [...params])
        return { ut, owner, user1 }

    }

    describe("UTToken Deployment", function () {
        it("should check the Name, Symbol, balance, and decimals of contract", async function () {
            const { ut } = await loadFixture(deployUTUpgradableProxy)
            expect(await ut.name()).to.equal("UtilityToken")
            expect(await ut.symbol()).to.equal("UT")
            expect(await ut.decimals()).to.equal(18)
        })
        it("should transfer tokens to user1", async function () {
            // const 
            const [owner, txnTaxWallet, user1, user2] = await ethers.getSigners();
            const { ut } = await loadFixture(deployUTUpgradableProxy)
            const sendingBal = String(1000)

            await ut.connect(owner).transferUnrestrictedTokens(user1.address, sendingBal)

            expect(await ut.balanceOf(user1.address)).to.equal(sendingBal)






        })

        it("should checking New Implementation of Proxy........", async function () {
            const { ut } = await loadFixture(deployUTUpgradableProxy)
            const [owner,user1, user2] = await ethers.getSigners();
            console.log("first implementation...",ut.target);

            // transfer tokens to user1
            // new UT
            console.log(await ut.name());
            console.log(await ut.version());

            await ut.connect(owner).transferUnrestrictedTokens(user1.address, String(1000))
            console.log(await ut.balanceOf(user1.address));
            

            // imlementation 2
           const UTV2 = await ethers.getContractFactory("UTtokenUpgradeableV2")
           const utv2 = await upgrades.upgradeProxy(ut.target, UTV2)
           console.log("New Implementation....",utv2.target);

           console.log(await utv2.name());
           console.log(await utv2.version());
            
           await utv2.connect(owner).transferUnrestrictedTokens(user1.address, String(1000))
           console.log(await utv2.balanceOf(user1.address));
           
           
           // implermentation 3

           const UTV3 = await ethers.getContractFactory("UTtokenUpgradeable")
           const utv3 = await upgrades.upgradeProxy(utv2.target, UTV3)
           console.log("New Implementation....",utv3.target);

           console.log(await utv3.name());
           console.log(await utv3.version());


            
        })




    })



})