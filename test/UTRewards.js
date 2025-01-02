const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("UTToken Staking and Unstaking", function () {
    async function deployUTTokenLoadFixture() {
        const [owner, txnTaxWallet, user1, user2] = await ethers.getSigners();
        const preMintValue = String(10000000);
        const _tokenTicker = "UT";
        const _tokenName = "UtilityToken";
        const _initialAddress = owner;
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
        const _txnTaxRate = String(2);
        const decimals_ = String(18);
        const rewardRates = [
            [3, 5],
            [6, 10],
            [9, 15],
            [12, 20],
        ];

        const UTContract = await ethers.getContractFactory("UTtokenV2");
        const UTDeploy = await UTContract.deploy(
            preMintValue,
            _tokenTicker,
            _tokenName,
            _initialAddress.address,
            _actions,
            _txnTaxRate,
            txnTaxWallet.address,
            decimals_,
            rewardRates
        );
        return { UTDeploy, owner, txnTaxWallet, user1, user2, rewardRates };
    }

    describe("Staking Functionality", function () {
        it("Should allow users to stake tokens", async function () {
            const { UTDeploy, user1 } = await loadFixture(deployUTTokenLoadFixture);

            const stakeAmount = ethers.parseUnits("100", 18); // 100 tokens
            const lockDuration = 6; // 6 months

            await UTDeploy.transferTokensToUser(user1.address, stakeAmount, 3);
            await UTDeploy.connect(user1).stake(stakeAmount, lockDuration);

            const stakeInfo = await UTDeploy.userStakes(user1.address, 0);
            expect(stakeInfo.amount).to.equal(stakeAmount);
            expect(stakeInfo.isActive).to.be.true;
        });

        it("Should fail if stake amount is zero", async function () {
            const { UTDeploy, user1 } = await loadFixture(deployUTTokenLoadFixture);
            await expect(UTDeploy.connect(user1).stake(0, 6)).to.be.revertedWith(
                "Amount must be greater than zero"
            );
        });

        it("Should fail if lock duration is out of bounds", async function () {
            const { UTDeploy, user1 } = await loadFixture(deployUTTokenLoadFixture);
            const stakeAmount = ethers.parseUnits("100", 18);

            await expect(UTDeploy.connect(user1).stake(stakeAmount, 25)).to.be.revertedWith(
                "Lock period must be between 1 and 24 months"
            );
        });
    });

    // Test suite for unstaking functionality
    describe("Unstaking Functionality", function () {
        it("Should allow users to unstake tokens after the lock period with reward calculations", async function () {
            const { UTDeploy, user1 } = await loadFixture(deployUTTokenLoadFixture);

            // Transfer tokens and stake them for various durations
            await UTDeploy.transferTokensToUser(user1.address, ethers.parseUnits("500", 18), 3);
            await UTDeploy.connect(user1).stake(ethers.parseUnits("100", 18), 3); // 3 months
            await UTDeploy.connect(user1).stake(ethers.parseUnits("50", 18), 6); // 6 months
            await UTDeploy.connect(user1).stake(ethers.parseUnits("200", 18), 9); // 9 months
            await UTDeploy.connect(user1).stake(ethers.parseUnits("150", 18), 12); // 12 months

            // Retrieve reward rates from the contract
            const rewardRates = await UTDeploy.getRewardRates();
            // console.log("Reward Rates:", rewardRates);

            // Fast forward time to make all stakes eligible
            const twelveMonthsInSeconds = 6 * 30 * 24 * 60 * 60; // 6 months in seconds
            await ethers.provider.send("evm_increaseTime", [twelveMonthsInSeconds]);
            await ethers.provider.send("evm_mine");

            // Retrieve and log stakes before unstaking
            const allStakesBefore = await UTDeploy.allStakes(user1.address);
            console.log("All Stakes Before Unstaking:", allStakesBefore);

            // Loop through all stakes to calculate and log rewards
           
            const userBalanceBefore = await UTDeploy.balanceOf(user1.address);
            console.log("User Balance Before Unstaking:", ethers.formatUnits(userBalanceBefore, 18));
            // Call withdrawAll
            await UTDeploy.connect(user1).withdrawAll();
            const allStakesAfter = await UTDeploy.allStakes(user1.address);
            console.log("All Stakes After Unstaking:", allStakesAfter);
            // Verify balances and states
            const userBalance = await UTDeploy.balanceOf(user1.address);
            const stakesAfter = await UTDeploy.allStakes(user1.address);
            console.log("User Balance After Unstaking:", ethers.formatUnits(userBalance, 18));
            console.log("Stakes After Unstaking:", stakesAfter);

            // Ensure all stakes are deactivated and rewarded
            // for (let i = 0; i < stakesAfter.length; i++) {
            //     expect(stakesAfter[i].isActive).to.be.false;
            //     expect(stakesAfter[i].isRewarded).to.be.true;
            // }
        });

        it("Should calculate and log rewards for individual stakes during unstaking", async function () {
            const { UTDeploy, user1 } = await loadFixture(deployUTTokenLoadFixture);

            // Stake tokens twice
            await UTDeploy.transferTokensToUser(user1.address, ethers.parseUnits("100", 18), 3);
            await UTDeploy.connect(user1).stake(ethers.parseUnits("50", 18), 6); // 6 months

            // Fast forward time for the first stake
            const sixMonthsInSeconds = 6 * 30 * 24 * 60 * 60; // 6 months
            await ethers.provider.send("evm_increaseTime", [sixMonthsInSeconds]);
            await ethers.provider.send("evm_mine");

            // Retrieve and log stake details before unstaking
            // const allStakes = await UTDeploy.allStakes(user1.address);
            // console.log("All Stakes Before Unstaking:", allStakes);

            const rewardRates = await UTDeploy.getRewardRates();
            console.log("Reward Rates:", rewardRates);

            // Retrieve all stakes for user1
            const allStakes = await UTDeploy.allStakes(user1.address);
            console.log("All Stakes:", allStakes);

        });
    });




    describe("Reward Calculation", function () {
        it("Should correctly calculate rewards based on staking duration", async function () {
            const { UTDeploy, user1 } = await loadFixture(deployUTTokenLoadFixture);
            const stakeAmount = ethers.parseUnits("100", 18);
            const lockDuration = 6;

            await UTDeploy.transferTokensToUser(user1.address, stakeAmount, 3);
            await UTDeploy.connect(user1).stake(stakeAmount, lockDuration);

            // Fast forward time
            const sixMonthsInSeconds = 6 * 30 * 24 * 60 * 60;
            await ethers.provider.send("evm_increaseTime", [sixMonthsInSeconds]);
            await ethers.provider.send("evm_mine");

            const currentTimestamp = BigInt((await ethers.provider.getBlock("latest")).timestamp);
            const stakeInfo = await UTDeploy.userStakes(user1.address, 0);

            const reward = await UTDeploy.stakeRewardCal(
                stakeInfo.amount,
                stakeInfo.startTime,
                currentTimestamp
            );

            const expectedReward = (stakeAmount * BigInt(10)) / BigInt(100); // 10% reward for 6 months
            expect(reward).to.equal(expectedReward);
        });
    });

    describe("Eligibility Checking", function () {
        it("Should return eligible stakes after lock period", async function () {
            const { UTDeploy, user1 } = await loadFixture(deployUTTokenLoadFixture);
            const stakeAmount = ethers.parseUnits("100", 18);

            await UTDeploy.transferTokensToUser(user1.address, stakeAmount, 3);
            await UTDeploy.connect(user1).stake(stakeAmount, 6); // 6 months

            // Fast forward time
            const sixMonthsInSeconds = 6 * 30 * 24 * 60 * 60;
            await ethers.provider.send("evm_increaseTime", [sixMonthsInSeconds]);
            await ethers.provider.send("evm_mine");

            const eligibleStakes = await UTDeploy.isEligible(user1.address);

            expect(eligibleStakes.length).to.be.greaterThan(0);
            expect(eligibleStakes[0].amount).to.equal(stakeAmount);
        });
    });
});
