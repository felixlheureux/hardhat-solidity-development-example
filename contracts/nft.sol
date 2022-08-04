// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "erc721a/contracts/extensions/ERC721ABurnable.sol";
import "erc721a/contracts/extensions/ERC721AQueryable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract NFT is Ownable, ERC721AQueryable, ERC721ABurnable, ReentrancyGuard {

    uint256 public immutable maxSupply;
    uint256 public immutable maxPublicMint;
    uint256 public immutable maxAllowlistMint;
    uint256 public immutable publicPrice;
    uint256 public immutable allowlistPrice;
    uint256 public immutable amountForDevs;

    uint256 public constant MAX_BATCH_SIZE = 5;

    bool public publicSale;
    bool public allowListSale;

    uint256 private publicSaleKey;
    bytes32 private merkleRoot;

    constructor(
        uint256 _maxSupply,
        uint256 _maxPublicMint,
        uint256 _maxAllowlistMint,
        uint256 _publicPriceWei,
        uint256 _allowlistPriceWei,
        uint256 _amountForDevs
    ) ERC721A("NFT", "NFT") {
        maxSupply = _maxSupply;
        maxPublicMint = _maxPublicMint;
        maxAllowlistMint = _maxAllowlistMint;
        publicPrice = _publicPriceWei;
        allowlistPrice = _allowlistPriceWei;
        amountForDevs = _amountForDevs;
    }

    modifier callerIsUser() {
        require(tx.origin == msg.sender, "the caller is another contract");
        _;
    }

    function publicMint(uint256 quantity, uint256 _publicSaleKey) external payable callerIsUser {
        require(publicSaleKey == _publicSaleKey, "invalid public sale key");
        require(publicSale, "public mint not active");
        require((totalSupply() + quantity) <= maxSupply, "max supply reached");
        require(numberMinted(msg.sender) + quantity <= maxPublicMint, "allowed mint amount exceeded");
        require(msg.value == (publicPrice * quantity), "insufficient founds sent");

        _safeMint(msg.sender, quantity);
    }

    function allowlistMint(bytes32[] memory _merkleProof, uint256 quantity) external payable callerIsUser {
        require(allowListSale, "allow list mint not active");
        require((totalSupply() + quantity) <= maxSupply, "max supply reached");
        require(numberMinted(msg.sender) + quantity <= maxAllowlistMint, "allowed mint amount exceeded");
        require(msg.value == (allowlistPrice * quantity), "insufficient founds sent");
        // create leaf node
        bytes32 sender = keccak256(abi.encodePacked(msg.sender));
        require(MerkleProof.verify(_merkleProof, merkleRoot, sender), "unauthorized address");

        _safeMint(msg.sender, quantity);
    }

    function devMint(uint256 quantity) external onlyOwner {
        require(totalSupply() + quantity <= amountForDevs, "too many already minted before dev mint");
        require(quantity % MAX_BATCH_SIZE == 0, "can only mint a multiple of maxBatchSize");

        uint256 numChunks = quantity / MAX_BATCH_SIZE;

        for (uint256 i = 0; i < numChunks; i++) {
            _safeMint(msg.sender, MAX_BATCH_SIZE);
        }
    }

    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
    }

    function toggleAllowListSale() external onlyOwner {
        allowListSale = !allowListSale;
    }

    function setPublicSaleKey(uint32 key) external onlyOwner {
        publicSaleKey = key;
    }

    function togglePublicSale() external onlyOwner {
        publicSale = !publicSale;
    }

    // metadata URI
    string private _baseTokenURI;

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string calldata baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    function withdrawMoney() external onlyOwner nonReentrant {
        (bool success,) = msg.sender.call{value : address(this).balance}("");
        require(success, "transfer failed");
    }

    function numberMinted(address owner) public view returns (uint256) {
        return _numberMinted(owner);
    }

    // contract metadata URI
    string private _contractURI;

    function setContractURI(string calldata contractURI_) external onlyOwner {
        _contractURI = contractURI_;
    }

    function contractURI() public view returns (string memory) {
        return _contractURI;
    }
}