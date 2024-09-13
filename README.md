# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/UTToken.js
```

```
  UTToken
    UTToken Deployment
      ✔ should check the Name, Symbol, balance, and decimals of contract (1292ms)
    UTToken : Mint Supply
      ✔ should successfully mint tokens when called by owner
      ✔ should fail if amount is zero
      ✔ should fail if non-owner tries to mint
      ✔ should fail if contract is paused
    UTTpken : Burn Supply
      ✔ should successfully burn tokens when called by owner
      ✔ should fail if burn amount is zero
      ✔ should fail if non-owner tries to burn
      ✔ should fail if contract is paused
    UTToken : TransferToUser
      ✔ should transfer token to user address from owner
      ✔ should transfer tokens with tax applied
      ✔ should fail if sender is not the owner
      ✔ should fail if transfer amount is zero
      ✔ should fail if user is blacklisted
      ✔ should fail if setting tax rate is zero
    UTToken : StakeToken
      ✔ should successfully stake tokens with valid amount and lock duration
      ✔ should fail if stake amount is zero
      ✔ should fail if lock duration is zero
      ✔ should fail if user is blacklisted
      ✔ should fail if contract is paused
      ✔ should fail if stake amount exceeds user balance
    UTToken : Unstake
      ✔ should successfully unstake tokens with valid amount
      ✔ should fail if unstake amount exceeds staked balance
      ✔ should fail if unstake amount is zero
      ✔ should fail if user is blacklisted
      ✔ should fail if contract is paused
    UTToken : UnstakeAll
      ✔ should successfully unstake all tokens when lock period is over
      ✔ should fail if no tokens are staked
      ✔ should fail if contract is paused
      ✔ should fail if user is blacklisted


  30 passing (2s)
```
# UTToken_hardhatV1
