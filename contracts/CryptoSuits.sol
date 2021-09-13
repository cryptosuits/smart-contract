// SPDX-License-Identifier: MIT
// CryptoSuits NFT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "@openzeppelin/contracts/utils/Counters.sol";
import '@openzeppelin/contracts/utils/math/SafeMath.sol';

contract CryptoSuits is ERC721, Ownable {
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    /* CONSTANTS */
    // Price of a CryptoSuit NFT
    uint256 public constant PRICE = 0.033 ether;

    // Number of NFT available to mint
    uint256 public constant MAX_SUPPLY = 10000;

    // Maximum purchase of NFT in one transaction
    uint256 public constant MAX_PURCHASE = 20;


    /* VARIABLES */
    // Status of the sale (if paused, the sale has not started yet)
    bool public paused = true;

    // Base URI of the backend server
    string public baseURI = 'https://cryptosuit-api.herokuapp.com/json/';

    // Counter of the number of CryptoSuits token minted
    Counters.Counter private _tokenIds;


    /* EVENTS */
    event SaleStarted(bool started);
    event Withdraw(uint256 amount);
    event Mint(address minterAddress, address buyerAddress, uint256 tokenId);
    event GiveAway(address minterAddress, address winnerAddress, uint256 tokenId);


    /* CONSTRUCTOR */
    constructor() ERC721("CryptoSuits", "SUIT") {}


    /* FUNCTIONS */
    // Mint some CryptoSuits NFT
    function mint(address buyerAddress, uint256 quantity) public payable {
        // Check that the sale has started
        require(!paused, "The sale has not started yet");

        // Check that the 0 < quantity <= MAX_PURCHASE
        require(quantity > 0, "You need to buy at least 1 CryptoSuit NFT");
        require(quantity <= MAX_PURCHASE, "You can't buy that much tokens in a transaction (maximum is 20)");
        
        // Check that there are enough NFT left to mint
        require(_tokenIds.current().add(quantity) <= MAX_SUPPLY, "Exceending maximum supply");

        // Check that the price is correct
        require(PRICE.mul(quantity) <= msg.value, "Wrong price, don't fuck around!");
        
        // Mint some NFTs
        for (uint256 i = 0; i < quantity; i++) {
            _tokenIds.increment();
            _safeMint(buyerAddress, _tokenIds.current());
            emit Mint(msg.sender, buyerAddress, _tokenIds.current());
        }
    }

    // Give some CryptoSuit NFTs
    function giveaway(address winnerAddress, uint256 quantity) external onlyOwner {
        // Check that there are enough NFT left to mint
        require(_tokenIds.current().add(quantity) <= MAX_SUPPLY, "Exceending maximum supply");

        // Check that the quantity is a positive number
        require(quantity > 0, "You need to specify a positive quantity");

        // Giveaway some NFTs
        for (uint256 i = 0; i < quantity; i++) {
            _tokenIds.increment();
            _safeMint(winnerAddress, _tokenIds.current());
            emit GiveAway(msg.sender, winnerAddress, _tokenIds.current());
        }
    }

    // Return the token(s) owned by the address
    function getAssetsByOwner(address ownerAddress) public view returns(uint256[] memory) {
        // Get the number of assets owned by the address
        uint256 tokenCount = balanceOf(ownerAddress);
        if (tokenCount == 0) {
            return new uint256[](0);
        }

        // Find and return all the tokens owned by the address
        uint256[] memory tokens = new uint256[](tokenCount);
        uint256 tokenMinted = _tokenIds.current();
        uint256 index = 0;
        for (uint256 t = 0; t <= tokenMinted; t++) {
            if (_exists(t) && ownerOf(t) == ownerAddress) {
                tokens[index] = t;
                index++;
            }
        }
        return tokens;
    }

    // Find the tokens owned by the connected address
    function getMyAssets() external view returns(uint256[] memory) {
        return getAssetsByOwner(tx.origin);
    }

    // Withdraw the money from the smart contract
    function withdraw() external onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }


    /* GETTERS */
    // Get the status of the sale
    // If true, the sale is open and it is possible to mint tokens
    function getSaleStatus() public view returns (bool) {
        return paused;
    }

    // Get the base URI
    function getBaseURI() public view returns (string memory) {
        return baseURI;
    }

    // Get the number of token minted so far
    function getNumberofMintedTokens() public view returns (uint256) {
        return _tokenIds.current();
    }


    /* SETTERS */
    // Update the status of the sale and emit an event
    function setSaleStatus(bool newSaleStatus) public onlyOwner {
        paused = newSaleStatus;
        emit SaleStarted(!newSaleStatus);
    }

    // Set the base URI
    function setBaseUri(string memory newBaseURI) public onlyOwner {
        baseURI = newBaseURI;
    }


    /* OVERRIDE */
    // Override the baseURI of the server
    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }
}
