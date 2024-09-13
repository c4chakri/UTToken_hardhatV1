const { expect } = require("chai")
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { string } = require("hardhat/internal/core/params/argumentTypes");
const { ethers } = require("hardhat");
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

        const UTContract = await ethers.getContractFactory("UTToken")
        const UTDeploy = await UTContract.deploy(preMintValue, _tokenTicker, _tokenName, _initialAddress, _actions, _txnTaxRate, _txnTaxWallet, decimals_)
        return { UTDeploy, _tokenName, _tokenTicker, _initialAddress, _txnTaxWallet, preMintValue, decimals_, user1, user2, user3 }

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
    describe("UTToken : Mint Supply", function () {
        it("should successfully mint tokens when called by owner", async function () {
            const { UTDeploy, _initialAddress } = await loadFixture(deployUTTokenLoadFixture);
            const mintAmount = BigInt(1000);
            const initialContractBalance = await UTDeploy.balanceOf(UTDeploy)
            // Call mintSupply as the owner
            await UTDeploy.connect(_initialAddress).mintSupply(mintAmount);

            // Check the contract's balance to verify minting
            const contractBalance = await UTDeploy.balanceOf(UTDeploy);
            expect(contractBalance).to.equal(initialContractBalance + mintAmount * BigInt(1e18));
        });
        it("should fail if amount is zero", async function() {
            const { UTDeploy, _initialAddress } = await loadFixture(deployUTTokenLoadFixture);
            const mintAmount = BigInt(0);
        
            await expect(UTDeploy.connect(_initialAddress).mintSupply(mintAmount))
                .to.be.revertedWith("Mint more than Zero");
        });
        it("should fail if non-owner tries to mint", async function() {
            const { UTDeploy, user1 } = await loadFixture(deployUTTokenLoadFixture);
            const mintAmount = BigInt(1000);
        
            await expect(UTDeploy.connect(user1).mintSupply(mintAmount))
                .to.be.revertedWithCustomError(UTDeploy,"OwnableUnauthorizedAccount");
        });
        it("should fail if contract is paused", async function() {
            const { UTDeploy, _initialAddress } = await loadFixture(deployUTTokenLoadFixture);
            const mintAmount = BigInt(1000);
        
            // Pause the contract
            await UTDeploy.connect(_initialAddress).pauseTokenTransfers();
        
            await expect(UTDeploy.connect(_initialAddress).mintSupply(mintAmount))
                .to.be.revertedWithCustomError(UTDeploy,"EnforcedPause()");
        });

    })
    describe("UTTpken : Burn Supply",function(){
        it("should successfully burn tokens when called by owner", async function() {
            const { UTDeploy, _initialAddress } = await loadFixture(deployUTTokenLoadFixture);
            const burnAmount = BigInt(1000);
            
            const initialContractBalance = await UTDeploy.balanceOf(UTDeploy)
            // First mint tokens to the contract so there are tokens to burn
            await UTDeploy.connect(_initialAddress).mintSupply(burnAmount);
        
            // Burn the tokens
            await UTDeploy.connect(_initialAddress).burnSupply(burnAmount);
        
            // Check the contract's balance to verify burn
            const contractBalance = await UTDeploy.balanceOf(UTDeploy);
            expect(contractBalance).to.equal(initialContractBalance);
        });
        it("should fail if burn amount is zero", async function() {
            const { UTDeploy, _initialAddress } = await loadFixture(deployUTTokenLoadFixture);
            const burnAmount = BigInt(0);
        
            await expect(UTDeploy.connect(_initialAddress).burnSupply(burnAmount))
                .to.be.revertedWith("Burn more than Zero");
        });
        it("should fail if non-owner tries to burn", async function() {
            const { UTDeploy, user1 } = await loadFixture(deployUTTokenLoadFixture);
            const burnAmount = BigInt(1000);
        
            await expect(UTDeploy.connect(user1).burnSupply(burnAmount))
                .to.be.revertedWithCustomError(UTDeploy,"OwnableUnauthorizedAccount");
        });
        it("should fail if contract is paused", async function() {
            const { UTDeploy, _initialAddress } = await loadFixture(deployUTTokenLoadFixture);
            const burnAmount = BigInt(1000);
        
            // Pause the contract
            await UTDeploy.connect(_initialAddress).pauseTokenTransfers();
        
            await expect(UTDeploy.connect(_initialAddress).burnSupply(burnAmount))
                .to.be.revertedWithCustomError(UTDeploy,"EnforcedPause()");
        });
        
        
    })
    describe("UTToken : TransferToUser", function () {
        it("should transfer token to user address from owner", async function () {
            const { UTDeploy, user1, user2, user3 } = await loadFixture(deployUTTokenLoadFixture)
            var user1Bal;
            const address = await UTDeploy.getAddress()
            user1Bal = await UTDeploy.balanceOf(user1);
            const initialContractBalance = await UTDeploy.balanceOf(address);
            expect(await UTDeploy.balanceOf(user1)).to.equal(String(user1Bal))
            const sendingBal = String(1000)
            await UTDeploy.transferTokensToUser(user1, sendingBal, "3")
            user1Bal += await UTDeploy.balanceOf(user1);
            const finalContractBalance = await UTDeploy.balanceOf(address);
            expect(await UTDeploy.balanceOf(user1)).to.equal(String(user1Bal))
            expect(finalContractBalance).to.equal(BigInt(initialContractBalance) - BigInt(sendingBal));

        })
        it("should transfer tokens with tax applied", async function () {
            const { UTDeploy, user1, user2, _txnTaxWallet } = await loadFixture(deployUTTokenLoadFixture);

            const transferAmount = BigInt(1000); // Use BigNumber for large numbers
            const txnTaxRateBasisPoints = await UTDeploy.txnTaxRateBasisPoints();

            // Calculate tax amount
            const taxAmount = BigInt(transferAmount * (txnTaxRateBasisPoints)) / BigInt(100 * 1000); // BigNumber calculations
            const amountAfterTax = transferAmount - (taxAmount);

            // Transfer tokens
            await UTDeploy.transferTokensToUser(user2, transferAmount, 3);

            // Check final user and tax wallet balances
            expect(await UTDeploy.balanceOf(user2)).to.equal(amountAfterTax);
            expect(await UTDeploy.balanceOf(_txnTaxWallet.getAddress())).to.equal(taxAmount);
        });
        it("should fail if sender is not the owner", async function () {
            const { UTDeploy, user1, user2 } = await loadFixture(deployUTTokenLoadFixture);
            const transferAmount = String(500);
            // console.log(await UTDeploy.connect(user1).transferTokensToUser(user2, transferAmount, 3));

            // Try transferring tokens as non-owner
            await expect(UTDeploy.connect(user1).transferTokensToUser(user2, transferAmount, 3))
                .to.be.revertedWithCustomError(UTDeploy, "OwnableUnauthorizedAccount")
                .withArgs(user1.address);  // Ensure the error is thrown for the correct unauthorized account


        });
        it("should fail if transfer amount is zero", async function () {
            const { UTDeploy, user1 } = await loadFixture(deployUTTokenLoadFixture);
            const transferAmount = String(0);

            await expect(UTDeploy.transferTokensToUser(user1, transferAmount, 3))
                .to.be.revertedWith("Transfer amount must be greater than zero");
        });
        it("should fail if user is blacklisted", async function () {
            const { UTDeploy, user1 } = await loadFixture(deployUTTokenLoadFixture);
            const transferAmount = String(500);

            // Blacklist user1
            await UTDeploy.blackListUser(user1);

            await expect(UTDeploy.transferTokensToUser(user1, transferAmount, 3))
                .to.be.revertedWith("User is blacklisted");
        });
        it("should fail if setting tax rate is zero", async function () {
            const { UTDeploy } = await loadFixture(deployUTTokenLoadFixture);
            await expect(UTDeploy.setTxnTaxRateBasisPoints(0)).to.be.rejectedWith("Rate must be grater than 0")

        });

    })
    describe("UTToken : StakeToken", function () {

        it("should successfully stake tokens with valid amount and lock duration", async function () {
            const { UTDeploy, user1 } = await loadFixture(deployUTTokenLoadFixture);
            const stakeAmount = BigInt(1000);
            const lockDuration = BigInt(2); // 2 months
            //transferring bal
            // Get initial balances and stake data
            await UTDeploy.transferTokensToUser(user1, 100000, 3)
            const initialUserBalance = await UTDeploy.balanceOf(user1);
            const initialTotalStakes = await UTDeploy.totalStakes(user1);
            // console.log(initialUserBalance);
            // Perform staking 1
            await UTDeploy.connect(user1).stake(stakeAmount, lockDuration);
            // Calculate expected lock end timestamp
            const expectedLockEndTimestamp = BigInt((await ethers.provider.getBlock('latest')).timestamp) + (lockDuration * BigInt(30 * 24 * 60 * 60));

            // Check balances and stakes)
            const finalUserBalance = await UTDeploy.balanceOf(user1);
            const finalTotalStakes = await UTDeploy.totalStakes(user1);
            const userStakes = await UTDeploy.userStakes(user1, 0);

            expect(finalUserBalance).to.equal(initialUserBalance - stakeAmount);
            expect(finalTotalStakes).to.equal(initialTotalStakes + stakeAmount);
            expect(userStakes.amount).to.equal(stakeAmount);
            expect(userStakes.lockEndTimestamp).to.equal(expectedLockEndTimestamp);
        });
        it("should fail if stake amount is zero", async function () {
            const { UTDeploy, user1 } = await loadFixture(deployUTTokenLoadFixture);
            const stakeAmount = BigInt(0);
            const lockDuration = BigInt(2); // 2 months

            await expect(UTDeploy.connect(user1).stake(stakeAmount, lockDuration))
                .to.be.revertedWith("Amount must be greater than zero");
        });
        it("should fail if lock duration is zero", async function () {
            const { UTDeploy, user1 } = await loadFixture(deployUTTokenLoadFixture);
            const stakeAmount = BigInt(1000);
            const lockDuration = BigInt(0); // Zero duration

            await expect(UTDeploy.connect(user1).stake(stakeAmount, lockDuration))
                .to.be.revertedWith("Lock duration must be greater than zero");
        });
        it("should fail if user is blacklisted", async function () {
            const { UTDeploy, user1 } = await loadFixture(deployUTTokenLoadFixture);
            const stakeAmount = BigInt(1000);
            const lockDuration = BigInt(2); // 2 months

            // Blacklist the user
            await UTDeploy.blackListUser(user1);

            await expect(UTDeploy.connect(user1).stake(stakeAmount, lockDuration))
                .to.be.revertedWith("User is blacklisted!");
        });
        it("should fail if contract is paused", async function () {
            const { UTDeploy, user1 } = await loadFixture(deployUTTokenLoadFixture);
            const stakeAmount = BigInt(1000);
            const lockDuration = BigInt(2); // 2 months

            // Pause the contract
            await UTDeploy.pauseTokenTransfers();

            await expect(UTDeploy.connect(user1).stake(stakeAmount, lockDuration))
                .to.be.revertedWithCustomError(UTDeploy, "EnforcedPause()");
        });
        it("should fail if stake amount exceeds user balance", async function () {
            const { UTDeploy, user1 } = await loadFixture(deployUTTokenLoadFixture);
            const userBalance = await UTDeploy.balanceOf(user1);
            const excessiveAmount = userBalance + BigInt(1); // Exceeding balance
            const lockDuration = BigInt(2); // 2 months

            await expect(UTDeploy.connect(user1).stake(excessiveAmount, lockDuration))
                .to.be.revertedWithCustomError(UTDeploy, "ERC20InsufficientBalance")
        });
    })
    describe("UTToken : Unstake", function () {
        it("should successfully unstake tokens with valid amount", async function () {
            const { UTDeploy, user1 } = await loadFixture(deployUTTokenLoadFixture);
            const stakeAmount = BigInt(1000);
            const lockDuration = BigInt(2); // 2 months

            // Stake tokens first
            await UTDeploy.transferTokensToUser(user1, 100000, 3)

            await UTDeploy.connect(user1).stake(stakeAmount, lockDuration);
            await UTDeploy.connect(user1).stake(stakeAmount + BigInt(200), lockDuration);
            await UTDeploy.connect(user1).stake(stakeAmount + BigInt(300), lockDuration);

            const unstakeAmount = BigInt(500);

            // Get initial balances and stake data
            const initialTotalStakes = await UTDeploy.totalStakes(user1);//3500
            const initialUserBalance = await UTDeploy.balanceOf(user1); //10000

            // Perform unstaking
            await UTDeploy.connect(user1).unstakeToken(unstakeAmount);
            // Check balances and stakes
            const finalUserBalance = await UTDeploy.balanceOf(user1);

            const finalTotalStakes = await UTDeploy.totalStakes(user1);
            expect(finalUserBalance).to.equal(initialUserBalance + unstakeAmount);
            expect(finalTotalStakes).to.equal(initialTotalStakes - unstakeAmount);
        });
        it("should fail if unstake amount exceeds staked balance", async function () {
            const { UTDeploy, user1 } = await loadFixture(deployUTTokenLoadFixture);
            const stakeAmount = BigInt(1000);
            const lockDuration = BigInt(2); // 2 months

            // Stake tokens first
            await UTDeploy.transferTokensToUser(user1, 10000, 2)
            await UTDeploy.connect(user1).stake(stakeAmount, lockDuration);

            const excessiveUnstakeAmount = BigInt(1500); // More than staked amount

            await expect(UTDeploy.connect(user1).unstakeToken(excessiveUnstakeAmount))
                .to.be.revertedWith("Not enough staked balance to unstake the requested amount");
        });
        it("should fail if unstake amount is zero", async function () {
            const { UTDeploy, user1 } = await loadFixture(deployUTTokenLoadFixture);
            const unstakeAmount = BigInt(0);

            await expect(UTDeploy.connect(user1).unstakeToken(unstakeAmount))
                .to.be.revertedWith("Amount must be greater than zero");
        });
        it("should fail if user is blacklisted", async function () {
            const { UTDeploy, user1 } = await loadFixture(deployUTTokenLoadFixture);
            const stakeAmount = BigInt(1000);
            const lockDuration = BigInt(2); // 2 months

            // Stake tokens first
            await UTDeploy.transferTokensToUser(user1, 10000, 5)
            await UTDeploy.connect(user1).stake(stakeAmount, lockDuration);

            const unstakeAmount = BigInt(500);

            // Blacklist the user
            await UTDeploy.blackListUser(user1);

            await expect(UTDeploy.connect(user1).unstakeToken(unstakeAmount))
                .to.be.revertedWith("User is blacklisted!");
        });
        it("should fail if contract is paused", async function () {
            const { UTDeploy, user1 } = await loadFixture(deployUTTokenLoadFixture);
            const stakeAmount = BigInt(1000);
            const lockDuration = BigInt(2); // 2 months

            // Stake tokens first
            await UTDeploy.transferTokensToUser(user1, 10000, 2)
            await UTDeploy.connect(user1).stake(stakeAmount, lockDuration);

            const unstakeAmount = BigInt(500);

            // Pause the contract
            await UTDeploy.pauseTokenTransfers();

            await expect(UTDeploy.connect(user1).unstakeToken(unstakeAmount))
                .to.be.revertedWithCustomError(UTDeploy, "EnforcedPause()");
        });

    })
    describe("UTToken : UnstakeAll", function () {
        it("should successfully unstake all tokens when lock period is over", async function () {
            const { UTDeploy, user1 } = await loadFixture(deployUTTokenLoadFixture);
            const stakeAmount = BigInt(1000);
            const lockDuration = BigInt(2); // 2 months

            // Stake tokens first
            await UTDeploy.transferTokensToUser(user1, 10000, 5)
            await UTDeploy.connect(user1).stake(stakeAmount, lockDuration);

            // Fast forward time to beyond the lock period
            await ethers.provider.send('evm_increaseTime', [2 * 30 * 24 * 60 * 60]); // 2 months
            await ethers.provider.send('evm_mine', []); // Mine a new block

            // Get initial balances
            const initialUserBalance = await UTDeploy.balanceOf(user1);
            const totalStakesBefore = await UTDeploy.totalStakes(user1);

            // Perform unstaking
            await UTDeploy.connect(user1).unStakeTotalAmount();

            // Check balances and total stakes
            const finalUserBalance = await UTDeploy.balanceOf(user1);
            const totalStakesAfter = await UTDeploy.totalStakes(user1);

            expect(finalUserBalance).to.equal(initialUserBalance + stakeAmount);
            expect(totalStakesAfter).to.equal(BigInt(0));
        });
        it("should fail if no tokens are staked", async function () {
            const { UTDeploy, user1 } = await loadFixture(deployUTTokenLoadFixture);

            await expect(UTDeploy.connect(user1).unStakeTotalAmount())
                .to.be.revertedWith("User doesn't have any staked token!");
        });

        // it("should fail if tokens are still locked", async function() {
        //     const { UTDeploy, user1 } = await loadFixture(deployUTTokenLoadFixture);
        //     const stakeAmount = BigInt(1000);
        //     const lockDuration = BigInt(2); // 2 months

        //     // Stake tokens first
        //     await UTDeploy.transferTokensToUser(user1,10000,2)
        //     await UTDeploy.connect(user1).stake(stakeAmount, lockDuration);

        //     // Attempt to unstake before lock period ends
        //     await expect(UTDeploy.connect(user1).unStakeTotalAmount())
        //         .to.be.revertedWith("Tokens are still locked");
        // });
        it("should fail if contract is paused", async function () {
            const { UTDeploy, user1 } = await loadFixture(deployUTTokenLoadFixture);
            const stakeAmount = BigInt(1000);
            const lockDuration = BigInt(2); // 2 months

            // Stake tokens first
            await UTDeploy.transferTokensToUser(user1, 10000, 2)
            await UTDeploy.connect(user1).stake(stakeAmount, lockDuration);

            // Fast forward time to beyond the lock period
            await ethers.provider.send('evm_increaseTime', [2 * 30 * 24 * 60 * 60]); // 2 months
            await ethers.provider.send('evm_mine', []); // Mine a new block

            // Pause the contract
            await UTDeploy.pauseTokenTransfers();

            await expect(UTDeploy.connect(user1).unStakeTotalAmount())
                .to.be.revertedWithCustomError(UTDeploy, "EnforcedPause()");
        });
        it("should fail if user is blacklisted", async function () {
            const { UTDeploy, user1 } = await loadFixture(deployUTTokenLoadFixture);
            const stakeAmount = BigInt(1000);
            const lockDuration = BigInt(2); // 2 months

            // Stake tokens first
            await UTDeploy.transferTokensToUser(user1, 10000, 2)
            await UTDeploy.connect(user1).stake(stakeAmount, lockDuration);

            // Fast forward time to beyond the lock period
            await ethers.provider.send('evm_increaseTime', [2 * 30 * 24 * 60 * 60]); // 2 months
            await ethers.provider.send('evm_mine', []); // Mine a new block

            // Blacklist the user
            await UTDeploy.blackListUser(user1.address);

            await expect(UTDeploy.connect(user1).unStakeTotalAmount())
                .to.be.revertedWith("User is blacklisted!");
        });


    })

})



