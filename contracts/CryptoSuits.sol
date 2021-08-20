// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import '@openzeppelin/contracts/utils/math/SafeMath.sol';

// Documentation :
// https://docs.openzeppelin.com/contracts/4.x/erc721

// YT :
// https://www.youtube.com/watch?v=75D0JjX7EZg&loop=0

// Contract examples :
// https://github.com/Cryptomojis-org/cryptomojis/blob/main/contracts/Cryptomoji.sol
// https://github.com/MarsGenesis/marsgenesis-contract/blob/main/contracts/MarsGenesisCore.sol
// https://github.com/search?l=Solidity&p=2&q=nft+collectible&type=Repositories

contract CryptoSuits is ERC721 {
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    /* Variables */
    // This variable represents the admin of the smart contract
    address public adminAddress;

    // Base URI of the server
    string public baseURI;

    // Status of the sale
    bool public saleStatus;

    // Counter of the number of CryptoSuits token minted
    Counters.Counter private _tokenIds;

    // Number of tokens available to mint
    uint public constant MINT_SUPPLY = 9800;

    // Maximum purchase of NFTs in one transaction
    uint public constant MAX_PURCHASE = 20;

    // Price of a CryptoSuit NFT
    uint256 public constant PRICE = 33000000000000000; // 0.033 ETH


    /* Events */
    event SaleStatusChanged(bool saleStatus);
    event Minted(address minterAddress, address buyerAddress, uint256 tokenId);


    /* Modifiers */
    // Modifier that checks that the caller is the admin
    modifier onlyAdmin() {
        require(msg.sender == adminAddress, "only admin");
        _;
    }


    /* Constructor */
    constructor() ERC721("CryptoSuits", "CS") {
        // The creator of the contract is the initial admin
        adminAddress = msg.sender;
    }


    /* Public functions */
    // Mint a number of CryptoSuits NFTs
    function mint(uint numberOfTokens, address buyerAddress) public payable {
        require(saleStatus, "The sale has not started yet.");
        require(numberOfTokens <= MAX_PURCHASE, "You can't buy that much tokens in a transaction, maximum is 20.");
        require(_tokenIds.current().add(numberOfTokens) <= MINT_SUPPLY, "Exceeding maximum supply.");
        require(PRICE.mul(numberOfTokens) <= msg.value, "Wrong price, don't fuck around!");
        
        for (uint i = 0; i < numberOfTokens; i++) {
            _tokenIds.increment();
            _safeMint(buyerAddress, _tokenIds.current());
            emit Minted(msg.sender, buyerAddress, _tokenIds.current());
        }
    }

    // Return the token(s) owned by the address
    function getTokensByAddress(address owner) view public returns(uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        if (tokenCount == 0) {
            return new uint256[](0);
        }

        uint256[] memory tokens = new uint256[](tokenCount);
        uint256 tokenMinted = _tokenIds.current();
        uint256 index = 0;

        for (uint256 t = 0; t <= tokenMinted; t++) {
            if (_exists(t) && ownerOf(t) == owner) {
                tokens[index] = t;
                index++;
            }
        }
        return tokens;
    }


    /* Getters */
    // Get the status of the sale
    // If true, the sale is open and it is possible to mint tokens
    function getSaleStatus() public view returns (bool) {
        return saleStatus;
    }

    // Get the ID of the next CryptoSuit token to be minted
    // It represents the number of token minted so far if you add 1 to it
    function getNextTokenIDToBeMinted() public view returns (uint256) {
        return _tokenIds.current();
    }


    /* Setters */
    // Update the address of the admin of the smart contract
    function setAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0));
        adminAddress = newAdmin;
    }

    // Set the base URI
    function setBaseUri(string memory newBaseURI) public onlyAdmin {
        baseURI = newBaseURI;
    }

    // Update the status of the sale and emit an event
    function setSaleStatus(bool newSaleStatus) public onlyAdmin {
        saleStatus = newSaleStatus;
        emit SaleStatusChanged(newSaleStatus);
    }


    /* Override */
    // Override the baseURI of the server
    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }
}
