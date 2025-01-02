const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");
const { expect } = require("chai")

describe("UTToken", function () {

    async function deployUTTokenLoadFixture() {
        // Constructor params
        const [initialAddress, txnTaxWallet, user1, user2, user3] = await ethers.getSigners();
        const preMintValue = String(10000000)
        const _tokenTicker = "UT"
        const _tokenName = "UtilityToken"
        const _initialAddress = initialAddress
        const _actions = {
            canMint: true,
            canBurn: true,
            canPause: true,
            canBlacklist: true,
            canChangeOwner: false,
            canTxTax: true,
            canBuyBack: false,
            canStake: true
        };
        const _txnTaxRate = String(2)
        const _txnTaxWallet = txnTaxWallet
        const decimals_ = String(18)
        const rewardRates = [[3,5],[6,10],[9,15],[12,20]]  

        const UTContract = await ethers.getContractFactory("UTtokenV2")
        const UTDeploy = await UTContract.deploy(preMintValue, _tokenTicker, _tokenName, _initialAddress, _actions, _txnTaxRate, _txnTaxWallet, decimals_,rewardRates)
        return { UTDeploy, _tokenName, _tokenTicker, _initialAddress, _txnTaxWallet, preMintValue, decimals_,rewardRates, user1, user2, user3 }

    }
    describe("UTToken Deployment", function () {
        it("should check the Name, Symbol, balance, and decimals of contract", async function () {
            const { UTDeploy, _tokenName, _tokenTicker, preMintValue, decimals_ } = await loadFixture(deployUTTokenLoadFixture)

            const expectBal = BigInt(preMintValue) * BigInt(10 ** decimals_)
            expect(await UTDeploy.name()).to.equal(_tokenName)
            expect(await UTDeploy.symbol()).to.equal(_tokenTicker)
            expect(await UTDeploy.decimals()).to.equal(decimals_)
            expect((await UTDeploy.balanceOf(UTDeploy)).toString()).to.equal(expectBal.toString())
        })
    })
    
    describe("UTToken : stake and unstake", function () {
        it("should successfully unstake tokens with a valid amount", async function () {
            const { UTDeploy, user1 } = await loadFixture(deployUTTokenLoadFixture);
            const stakeAmount = BigInt(100);
            const lockDuration = 3; // Representing months (e.g., 3 months)
        
            // Stake tokens first
            await UTDeploy.transferTokensToUser(user1.address, 100000, 3);
        
            await UTDeploy.connect(user1).stake(stakeAmount, 3); // Stake 3 months
            await UTDeploy.connect(user1).stake(stakeAmount, 6); // Stake 6 months
            await UTDeploy.connect(user1).stake(stakeAmount, 7); // Stake 7 months
        
            // Verify total stakes
            let totalStakes = await UTDeploy.nextStakeId(user1.address);
            expect(totalStakes).to.equal(3);
        
            // Logging all stakes and calculating reward rates
            let  userStakes = [];
            let rewardRates = [];
            const oneMonthInSeconds = 3*(30 * 24 * 60 * 60); // 3months 
            
            // Fast forward time
            await ethers.provider.send("evm_increaseTime", [oneMonthInSeconds]);
            await ethers.provider.send("evm_mine"); // Mine the next block
        
            const currentTimestamp = BigInt((await ethers.provider.getBlock("latest")).timestamp);
            console.log("Current Timestamp:", currentTimestamp);
        
            for (let i = 0; i < totalStakes; i++) {
                const stake = await UTDeploy.userStakes(user1.address, i);
                const rewardRate = await UTDeploy.stakeRewardCal(stake[0], stake[2], currentTimestamp);
        
                rewardRates.push(rewardRate);
                userStakes.push(stake);
            }
        
            console.log("User Stakes:", userStakes);
            console.log("Reward Rates:", rewardRates);
        

            let user1Bal = await UTDeploy.balanceOf(user1.address);
            console.log("Befoere unstake ", user1Bal);
            
            // unstakeBy Id
            await UTDeploy.connect(user1).unstakeById(0)
            
            user1Bal = await UTDeploy.balanceOf(user1.address);
            console.log("After unstake ", user1Bal);

            userStakes = []
            rewardRates = []

            totalStakes = await UTDeploy.nextStakeId(user1.address);
            for (let i = 0; i < totalStakes; i++) {
                const stake = await UTDeploy.userStakes(user1.address, i);
                const rewardRate = await UTDeploy.stakeRewardCal(stake[0], stake[2], currentTimestamp);
        
                rewardRates.push(rewardRate);
                userStakes.push(stake);
            }
        
            console.log("User Stakes:", userStakes);
            console.log("Reward Rates:", rewardRates);
            
            
            
        });
        
        

    })
})