//SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
// buyback
//burnBurn
//sending decimals
// decimals and sizes of decimal 
// rate >0 
// staking means 
contract UTToken is ERC20, Ownable, Pausable, ReentrancyGuard {
    mapping(address => bool) public blackListedAddress;
    mapping(address => uint256) public stakes;

    uint8 public txnTaxRate;
    address public txnTaxWallet;
    uint8 private _decimals;
    IUniswapV2Router02 public uniswapRouter;

    struct smartContractActions{
        bool canMint;
        bool canBurn;
        bool canPause;
        bool canBlacklist;
        bool canChangeOwner;
        bool canTxTax;
        bool canBuyBack;
        bool canStake;
    }

    smartContractActions public actions;
    event LogApproval(address indexed owner, address indexed spender, uint256 value);
    event LogTotalSupply(uint256 totalSupply, uint256 decimals);

    modifier canMintModifier() {
        require(actions.canMint, "Minting Functionality is not enabled in this smart contract!");
        _;
    }

    modifier canBurnModifier() {
        require(actions.canBurn, "Burning Functionality is not enabled in this smart contract!");
        _;
    }

    modifier canPauseModifier() {
        require(actions.canPause, "Pause/Unpause Functionality is not enabled in this smart contract!");
        _;
    }

    modifier canBlacklistModifier() {
        require(actions.canBlacklist, "Blacklist Address Functionality is not enabled in this smart contract!");
        _;
    }

    modifier canChangeOwnerModifier() {
        require(actions.canChangeOwner, "Change Owner Functionality is not enabled in this smart contract!");
        _;
    }

    modifier canBuyBackModifier() {
        require(actions.canBuyBack, "Buyback Token Functionality is not enabled in this smart contract!");
        _;
    }

    modifier canStakeModifier() {
        require(actions.canStake, "Staking reward Functionality is not enabled in this smart contract!");
        _;
    }

    modifier canTxTaxModifier() {
        require(actions.canTxTax, "Txn Tax Functionality is not enabled in this smart contract!");
        _;
    }
    modifier  isBlackListed(){
        require(!blackListedAddress[msg.sender], "User is blacklisted!");
        _;
    }
   

    constructor(
        uint256 preMintValue,
        string memory _tokenTicker,
        string memory _tokenName,
        address _initialAddress,
        smartContractActions memory _actions,
        uint8 _txnTaxRate,
        address _txnTaxWallet,
        uint8 decimals_
    ) ERC20(_tokenName, _tokenTicker) Ownable(_initialAddress) {
        _decimals = decimals_;
        initializeToken(preMintValue);
        initializeTaxSettings(_txnTaxRate, _txnTaxWallet);
        initializeFeatures(_actions);
    }

    // function approveOwnerToTransfer() private  {
    //     uint256 total = totalSupply()/ 10 ** _decimals;
    //     approve(owner(), total);
    //     emit LogApproval(owner(), owner(), total);
    // }

    function initializeToken(uint256 preMintValue) internal {
        uint256 convertedValue = convertDecimals(preMintValue);
        _mint(address(this), convertedValue);
        // approveOwnerToTransfer();
         approve(owner(), convertedValue);
        emit LogTotalSupply(totalSupply(),decimals());

    }
       function decimals() public view virtual override  returns (uint8) {
        return _decimals;
    }

    function initializeTaxSettings(uint8 _txnTaxRate, address _txnTaxWallet) internal {
        require(_txnTaxWallet != address(0), "TxnTax Wallet can't be empty");
        require(_txnTaxRate>0,"Transaction rate must be grater than 0");
        txnTaxWallet = _txnTaxWallet;
        txnTaxRate = _txnTaxRate;
    }

    function initializeFeatures(smartContractActions memory _actions) private {
        actions.canStake = _actions.canStake;
        actions.canBurn = _actions.canBurn;
        actions.canMint = _actions.canMint;
        actions.canPause = _actions.canPause;
        actions.canBlacklist = _actions.canBlacklist;
        actions.canChangeOwner = _actions.canChangeOwner;
        actions.canTxTax = _actions.canTxTax;
        actions.canBuyBack = _actions.canBuyBack;
    }

    function pauseTokenTransfers() public canPauseModifier onlyOwner {
        require(!paused(), "Contract is already paused.");
        _pause();
    }

    function unPauseTokenTransfers() public canPauseModifier onlyOwner {
        require(paused(), "Contract is not paused.");
        _unpause();
    }

    function transferOwnership(address newOwner) public override canChangeOwnerModifier onlyOwner {
        _transferOwnership(newOwner);
    }

    function convertDecimals(uint256 _amount) private view returns(uint256){
        return _amount * 10 ** decimals();
    }
// 5 1
    function transferTokensToUser(address user, uint256 amount, uint256 _duration) public onlyOwner whenNotPaused{
        require(balanceOf(address(this)) >= amount, "Contract does not have enough tokens");
        require(!blackListedAddress[user], "User is blacklisted");
        require(amount>0,"Transfer amount is grater than zero"); 

        //monthly burn = duration/ 30 day
        // uint month = 30 days;
        uint256 transferAmount = amount;
        uint256 monthlyBurnLimit=transferAmount/_duration;

        if (actions.canTxTax) {
            uint256 taxAmount = transferAmount * txnTaxRate / 100;
            transferAmount = transferAmount - taxAmount;
            _transfer(address(this), txnTaxWallet, taxAmount);
        }

        _transfer(address(this), user, transferAmount);
        _approve(user, owner(), monthlyBurnLimit);
    }

    // function getSupply() view public returns(uint256){
    //     return totalSupply();
    // }

    function blackListUser(address _user) public canBlacklistModifier onlyOwner whenNotPaused {
        require(!blackListedAddress[_user], "User Address is already blacklisted");
        blackListedAddress[_user] = true;
    }

    function whiteListUser(address _user) public canBlacklistModifier onlyOwner whenNotPaused{
        require(blackListedAddress[_user], "User Address is not blacklisted");
        blackListedAddress[_user] = false;
    }

    function setTxnTaxRate(uint8 _rateValue) public canTxTaxModifier onlyOwner whenNotPaused {
        require(_rateValue>0,"Rate must be grater than 0");
        txnTaxRate = _rateValue;
    }

    function setTxnTaxWallet(address _txnTaxWallet) public canTxTaxModifier onlyOwner whenNotPaused {
        require(_txnTaxWallet!= address(0),"Txn tax wallet can't be empty");
        txnTaxWallet = _txnTaxWallet;
    }

    function buyBackTokens(uint256 amountOutMin) external canBuyBackModifier whenNotPaused payable {
        address[] memory path = new address[](2);
        path[0] = 0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2;//uniswapRouter.WETH(); //Weth contract address
        path[1] = address(this);    // erc20 address of this contract

        
        uniswapRouter.swapExactETHForTokens{value: msg.value}(
            amountOutMin,//amount of tokens wants to buy back from market
            path, // 
            address(this), // Tokens bought will be sent to the contract
            block.timestamp + 300 // Deadline
        );


    }

    function mintSupply(uint256 _amount) public canMintModifier onlyOwner whenNotPaused{
        require(_amount>0 ,"Mint more than Zero");
        _mint(address(this), convertDecimals(_amount));
    }

    function burnSupply(uint256 _amount) public canBurnModifier onlyOwner whenNotPaused{
        require(_amount>0 ,"Burn more than Zero");
        _burn(address(this), convertDecimals(_amount));
    }

    function stakeToken(uint256 _amount) public canStakeModifier nonReentrant whenNotPaused isBlackListed{
        require(balanceOf(msg.sender) >= _amount, "Insufficient token balance to stake");
        stakes[msg.sender] += _amount;
        _transfer(msg.sender, address(this), _amount);
    }

    function withdrawFull() external  canStakeModifier nonReentrant whenNotPaused isBlackListed{
        require(stakes[msg.sender] > 0, "User doesn't have any staked token!");
        stakes[msg.sender] = 0;
        _transfer(address(this), msg.sender, stakes[msg.sender]);
    }

    function withdrawTokenAmount(uint256 _amount) public canStakeModifier nonReentrant isBlackListed{
        // uint256 decimalAmount = convertDecimals(_amount);
        require(stakes[msg.sender] >= _amount, "User doesn't have enough staked token!");
        stakes[msg.sender] -= _amount;
        _transfer(address(this), msg.sender, _amount);
    }
   
    function burnFrom(address _user, uint256 _amount) public onlyOwner{
        // uint256 decimalAmount= convertDecimals(_amount);
        uint256 currentAllowance = allowance(_user,owner()); //100
        require(currentAllowance >= _amount, "Burn amount exceeds allowance");
        uint256 userBalance=balanceOf(_user);
        if(userBalance==0){
            _approve(_user, owner(), 0);
        }
        _burn(_user, _amount);

    }
}