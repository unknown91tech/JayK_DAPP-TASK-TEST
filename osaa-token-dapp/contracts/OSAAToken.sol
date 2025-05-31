// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title OSAA Token Contract
 * @dev ERC20 token contract for Project OSAA with enhanced security features
 * @notice This contract implements minting, transferring, and balance checking functionality
 */
contract OSAAToken is ERC20, Ownable, ReentrancyGuard, Pausable {
    
    // Events for better transparency and monitoring
    event TokensMinted(address indexed to, uint256 amount, address indexed minter);
    event TokensBurned(address indexed from, uint256 amount);
    event MaxSupplyUpdated(uint256 newMaxSupply);
    
    // Constants and state variables
    uint256 public constant INITIAL_SUPPLY = 1000000000 * 10**18; // 1 billion tokens with 18 decimals
    uint256 public maxSupply;
    mapping(address => bool) public authorizedMinters; // Addresses allowed to mint tokens
    
    // Modifier to check if caller is authorized to mint
    modifier onlyAuthorizedMinter() {
        require(authorizedMinters[msg.sender] || msg.sender == owner(), "Not authorized to mint");
        _;
    }
    
    /**
     * @dev Constructor initializes the token with name, symbol, and initial supply
     * @notice Sets up the OSAA token with basic parameters and mints initial supply to deployer
     */
    constructor() ERC20("OneStep Authentication Asset", "OSAA") Ownable(msg.sender) {
        maxSupply = INITIAL_SUPPLY * 10; // Max supply is 10x initial supply
        _mint(msg.sender, INITIAL_SUPPLY); // Mint initial supply to contract deployer
        authorizedMinters[msg.sender] = true; // Make deployer an authorized minter
    }
    
    /**
     * @dev Mints new tokens to specified address
     * @param to Address to receive the minted tokens
     * @param amount Amount of tokens to mint (in wei, considering 18 decimals)
     * @notice Only authorized minters or contract owner can call this function
     * @notice Cannot exceed maximum supply limit
     */
    function mint(address to, uint256 amount) 
        external 
        onlyAuthorizedMinter 
        nonReentrant 
        whenNotPaused 
    {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than zero");
        require(totalSupply() + amount <= maxSupply, "Would exceed maximum supply");
        
        _mint(to, amount);
        emit TokensMinted(to, amount, msg.sender);
    }
    
    /**
     * @dev Burns tokens from caller's balance
     * @param amount Amount of tokens to burn
     * @notice Anyone can burn their own tokens
     */
    function burn(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than zero");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance to burn");
        
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }
    
    /**
     * @dev Transfers tokens from caller to recipient
     * @param to Recipient address
     * @param amount Amount to transfer
     * @return success Boolean indicating if transfer was successful
     * @notice Enhanced transfer function with additional security checks
     */
    function transfer(address to, uint256 amount) 
        public 
        override 
        nonReentrant 
        whenNotPaused 
        returns (bool) 
    {
        require(to != address(0), "Cannot transfer to zero address");
        require(amount > 0, "Amount must be greater than zero");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        return super.transfer(to, amount);
    }
    
    /**
     * @dev Transfers tokens from one address to another (with allowance)
     * @param from Address to transfer from
     * @param to Address to transfer to
     * @param amount Amount to transfer
     * @return success Boolean indicating if transfer was successful
     */
    function transferFrom(address from, address to, uint256 amount) 
        public 
        override 
        nonReentrant 
        whenNotPaused 
        returns (bool) 
    {
        require(from != address(0), "Cannot transfer from zero address");
        require(to != address(0), "Cannot transfer to zero address");
        require(amount > 0, "Amount must be greater than zero");
        
        return super.transferFrom(from, to, amount);
    }
    
    /**
     * @dev Returns the balance of specified address
     * @param account Address to check balance for
     * @return balance Token balance of the address
     * @notice This is a view function that doesn't modify state
     */
    function getBalance(address account) external view returns (uint256) {
        require(account != address(0), "Cannot check balance of zero address");
        return balanceOf(account);
    }
    
    /**
     * @dev Adds an address to authorized minters list
     * @param minter Address to authorize for minting
     * @notice Only contract owner can add authorized minters
     */
    function addAuthorizedMinter(address minter) external onlyOwner {
        require(minter != address(0), "Cannot authorize zero address");
        require(!authorizedMinters[minter], "Address already authorized");
        
        authorizedMinters[minter] = true;
    }
    
    /**
     * @dev Removes an address from authorized minters list
     * @param minter Address to remove from minters
     * @notice Only contract owner can remove authorized minters
     */
    function removeAuthorizedMinter(address minter) external onlyOwner {
        require(minter != address(0), "Cannot remove zero address");
        require(authorizedMinters[minter], "Address not authorized");
        
        authorizedMinters[minter] = false;
    }
    
    /**
     * @dev Updates the maximum supply limit
     * @param newMaxSupply New maximum supply limit
     * @notice Only owner can update max supply, and it cannot be less than current supply
     */
    function updateMaxSupply(uint256 newMaxSupply) external onlyOwner {
        require(newMaxSupply >= totalSupply(), "New max supply cannot be less than current supply");
        
        maxSupply = newMaxSupply;
        emit MaxSupplyUpdated(newMaxSupply);
    }
    
    /**
     * @dev Pauses all token transfers and minting
     * @notice Only owner can pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpauses all token transfers and minting
     * @notice Only owner can unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Returns contract information for frontend integration
     * @return tokenName Token name
     * @return tokenSymbol Token symbol
     * @return tokenDecimals Number of decimals
     * @return currentTotalSupply Current total supply
     * @return currentMaxSupply Maximum allowed supply
     */
    function getTokenInfo() external view returns (
        string memory tokenName,
        string memory tokenSymbol,
        uint8 tokenDecimals,
        uint256 currentTotalSupply,
        uint256 currentMaxSupply
    ) {
        return (
            name(),
            symbol(),
            decimals(),
            totalSupply(),
            maxSupply
        );
    }
    
    /**
     * @dev Emergency function to recover accidentally sent ERC20 tokens
     * @param tokenAddress Address of the token contract
     * @param amount Amount to recover
     * @notice Only owner can recover tokens
     */
    function recoverERC20(address tokenAddress, uint256 amount) external onlyOwner {
        require(tokenAddress != address(this), "Cannot recover OSAA tokens");
        IERC20(tokenAddress).transfer(owner(), amount);
    }
}