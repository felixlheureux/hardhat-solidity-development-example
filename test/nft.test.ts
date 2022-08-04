import { ethers } from "hardhat";
import { expect } from "chai";
import { MerkleTree } from "merkletreejs";
import { keccak256 } from "js-sha3";

const MAX_SUPPLY = 100;
const MAX_PUBLIC_MINT = 3;
const MAX_ALLOWLIST_MINT = 3;
const PUBLIC_PRICE = 0.001;
const ALLOWLIST_PRICE = 0.001;
const PUBLIC_PRICE_WEI = ethers.utils.parseEther("0.001");
const ALLOWLIST_PRICE_WEI = ethers.utils.parseEther("0.001");
const AMOUNT_FOR_DEVS = 200;
const CONTRACT_FACTORY = "NFT";

describe("NFT", function() {
  beforeEach(async function() {
    this.NFT = await ethers.getContractFactory(CONTRACT_FACTORY);
    this.nft = await this.NFT.deploy(
      MAX_SUPPLY,
      MAX_PUBLIC_MINT,
      MAX_ALLOWLIST_MINT,
      PUBLIC_PRICE_WEI,
      ALLOWLIST_PRICE_WEI,
      AMOUNT_FOR_DEVS
    );
    await this.nft.deployed();
  });

  it("Only owner should devMint", async function() {
    const [ owner, minter1 ] = await ethers.getSigners();

    await expect(this.nft.connect(minter1).devMint(200)).to.be.revertedWith("Ownable: caller is not the owner");

    await this.nft.connect(owner).devMint(200);
  });

  it("Should devMint only once", async function() {
    const [ owner ] = await ethers.getSigners();

    await this.nft.connect(owner).devMint(200);

    await expect(this.nft.connect(owner).devMint(200)).to.be.revertedWith("too many already minted before dev mint");
  });

  it("Should not devMint more then allowed", async function() {
    const [ owner ] = await ethers.getSigners();

    await expect(this.nft.connect(owner).devMint(AMOUNT_FOR_DEVS + 1)).to.be.revertedWith("too many already minted before dev mint");
  });

  it("Should devMint only multiple of maxBatchSize", async function() {
    const [ owner ] = await ethers.getSigners();

    await expect(this.nft.connect(owner).devMint(199)).to.be.revertedWith("can only mint a multiple of maxBatchSize");

    await this.nft.connect(owner).devMint(200);
  });

  it("Only owner should set params", async function() {
    const [ owner, minter1 ] = await ethers.getSigners();

    await expect(this.nft.connect(minter1).togglePublicSale()).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(this.nft.connect(minter1).toggleAllowListSale()).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(this.nft.connect(minter1).setPublicSaleKey(3)).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(this.nft.connect(minter1).setBaseURI("test.com")).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(this.nft.connect(minter1).setMerkleRoot(ethers.utils.formatBytes32String(""))).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(this.nft.connect(minter1).withdrawMoney()).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(this.nft.connect(minter1).setContractURI("test.com")).to.be.revertedWith("Ownable: caller is not the owner");

    await this.nft.connect(owner).togglePublicSale();
    await this.nft.connect(owner).toggleAllowListSale();
    await this.nft.connect(owner).setPublicSaleKey(3);
    await this.nft.connect(owner).setBaseURI("test.com");
    await this.nft.connect(owner).setMerkleRoot(ethers.utils.formatBytes32String(""));
    await this.nft.connect(owner).withdrawMoney();
    await this.nft.connect(owner).setContractURI("test.com");
  });

  it("Should not public mint if active and no sale key is set", async function() {
    const [ owner, minter1 ] = await ethers.getSigners();

    await this.nft.connect(owner).togglePublicSale();
    await expect(this.nft.connect(minter1).publicMint(2, 3, { value: ethers.utils.parseEther((PUBLIC_PRICE * 2).toString()) })).to.be.revertedWith("invalid public sale key");
  });

  it("Should not public mint if public key is set and not active", async function() {
    const [ owner, minter1 ] = await ethers.getSigners();

    await this.nft.connect(owner).setPublicSaleKey(3);
    await expect(this.nft.connect(minter1).publicMint(2, 3, { value: ethers.utils.parseEther((PUBLIC_PRICE * 2).toString()) })).to.be.revertedWith("public mint not active");
  });

  it("Should public mint if active and sale key is set", async function() {
    const [ owner, minter1 ] = await ethers.getSigners();

    await this.nft.connect(owner).setPublicSaleKey(3);
    await this.nft.connect(owner).togglePublicSale();
    await this.nft.connect(minter1).publicMint(2, 3, { value: ethers.utils.parseEther((PUBLIC_PRICE * 2).toString()) });
  });

  it("Should allow list mint if active and address is authorized", async function() {
    const [ owner, minter1, minter2, minter3 ] = await ethers.getSigners();

    const allowlistAddresses = [
      minter1.address,
      minter2.address
    ];

    const leafNodes = allowlistAddresses.map(address => ethers.utils.keccak256(address));
    const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
    const merkleRoot = merkleTree.getRoot();
    const merkleProof1 = merkleTree.getHexProof(leafNodes[0]);
    const merkleProof2 = merkleTree.getHexProof(leafNodes[1]);

    await this.nft.connect(owner).setMerkleRoot(merkleRoot);
    await this.nft.connect(owner).toggleAllowListSale();

    await this.nft.connect(minter1).allowlistMint(merkleProof1, 1, { value: ethers.utils.parseEther((ALLOWLIST_PRICE).toString()) });

    await this.nft.connect(minter2).allowlistMint(merkleProof2, 1, { value: ethers.utils.parseEther((ALLOWLIST_PRICE).toString()) });

    await expect(this.nft.connect(minter3).allowlistMint(merkleProof2, 1, { value: ethers.utils.parseEther((ALLOWLIST_PRICE).toString()) })).to.be.revertedWith("unauthorized address");
  });

  it("Should not allow list mint if active and address is not authorized", async function() {
    const [ owner, minter1, minter2 ] = await ethers.getSigners();

    const allowlistAddresses = [
      minter1.address
    ];

    const leafNodes = allowlistAddresses.map(address => ethers.utils.keccak256(address));
    const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
    const merkleRoot = merkleTree.getRoot();
    const merkleProof1 = merkleTree.getHexProof(leafNodes[0]);

    await this.nft.connect(owner).setMerkleRoot(merkleRoot);
    await this.nft.connect(owner).toggleAllowListSale();

    await this.nft.connect(minter1).allowlistMint(merkleProof1, 1, { value: ethers.utils.parseEther(ALLOWLIST_PRICE.toString()) });

    await expect(this.nft.connect(minter2).allowlistMint(merkleProof1, 1, { value: ethers.utils.parseEther(ALLOWLIST_PRICE.toString()) })).to.be.revertedWith("unauthorized address");
  });

  it("Should not allow list mint if not active and address is authorized", async function() {
    const [ owner, minter1 ] = await ethers.getSigners();

    const allowlistAddresses = [
      minter1.address
    ];

    const leafNodes = allowlistAddresses.map(address => ethers.utils.keccak256(address));
    const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
    const merkleRoot = merkleTree.getRoot();
    const merkleProof1 = merkleTree.getHexProof(leafNodes[0]);

    await this.nft.connect(owner).setMerkleRoot(merkleRoot);

    await expect(this.nft.connect(minter1).allowlistMint(merkleProof1, 1, { value: ethers.utils.parseEther(ALLOWLIST_PRICE.toString()) })).to.be.revertedWith("allow list mint not active");
  });

  it("Should not allow list mint if active and merkle root not set", async function() {
    const [ owner, minter1 ] = await ethers.getSigners();

    const allowlistAddresses = [
      minter1.address
    ];

    const leafNodes = allowlistAddresses.map(address => ethers.utils.keccak256(address));
    const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
    const merkleProof1 = merkleTree.getHexProof(leafNodes[0]);

    await this.nft.connect(owner).toggleAllowListSale();

    await expect(this.nft.connect(minter1).allowlistMint(merkleProof1, 1, { value: ethers.utils.parseEther(ALLOWLIST_PRICE.toString()) })).to.be.revertedWith("unauthorized address");
  });

  it("Should not mint more then max supply", async function() {
    const MAX_SUPPLY = 2;
    const NFT = await ethers.getContractFactory("NFT");
    const nft = await NFT.deploy(
      MAX_SUPPLY,
      MAX_PUBLIC_MINT,
      MAX_ALLOWLIST_MINT,
      PUBLIC_PRICE_WEI,
      ALLOWLIST_PRICE_WEI,
      AMOUNT_FOR_DEVS
    );
    await this.nft.deployed();

    const [ owner, minter1 ] = await ethers.getSigners();

    await nft.connect(owner).togglePublicSale();
    await nft.connect(owner).setPublicSaleKey(1);

    await nft.connect(minter1).publicMint(2, 1, { value: ethers.utils.parseEther((PUBLIC_PRICE * 2).toString()) });

    await expect(nft.connect(minter1).publicMint(1, 1, { value: ethers.utils.parseEther(PUBLIC_PRICE.toString()) })).to.be.revertedWith("max supply reached");
  });

  it("Should not public mint more then allowed amount per address", async function() {
    const [ owner, minter1 ] = await ethers.getSigners();

    await this.nft.connect(owner).togglePublicSale();
    await this.nft.connect(owner).setPublicSaleKey(1);

    await this.nft.connect(minter1).publicMint(MAX_PUBLIC_MINT, 1, { value: ethers.utils.parseEther((PUBLIC_PRICE * 3).toString()) });

    await expect(this.nft.connect(minter1).publicMint(1, 1, { value: ethers.utils.parseEther(PUBLIC_PRICE.toString()) })).to.be.revertedWith("allowed mint amount exceeded");
  });

  it("Should not allow list mint more then allowed amount per address", async function() {
    const [ owner, minter1 ] = await ethers.getSigners();

    const allowlistAddresses = [
      minter1.address
    ];

    const leafNodes = allowlistAddresses.map(address => ethers.utils.keccak256(address));
    const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
    const merkleRoot = merkleTree.getRoot();
    const merkleProof1 = merkleTree.getHexProof(leafNodes[0]);

    await this.nft.connect(owner).setMerkleRoot(merkleRoot);
    await this.nft.connect(owner).toggleAllowListSale();

    await this.nft.connect(minter1).allowlistMint(merkleProof1, MAX_ALLOWLIST_MINT, { value: ethers.utils.parseEther((ALLOWLIST_PRICE * 3).toString()) });

    await expect(this.nft.connect(minter1).allowlistMint(merkleProof1, 1, { value: ethers.utils.parseEther(ALLOWLIST_PRICE.toString()) })).to.be.revertedWith("allowed mint amount exceeded");
  });

  it("Should set baseURI and get tokenURI", async function() {
    const baseURI = "https://test.com/";

    const [ owner, minter1 ] = await ethers.getSigners();

    await this.nft.connect(owner).togglePublicSale();
    await this.nft.connect(owner).setPublicSaleKey(1);

    await this.nft.connect(minter1).publicMint(MAX_PUBLIC_MINT, 1, { value: ethers.utils.parseEther((PUBLIC_PRICE * 3).toString()) });

    await this.nft.connect(owner).setBaseURI(baseURI);
    const response = await this.nft.connect(owner).tokenURI(1);
    expect(response).to.equal(`${baseURI}1`);
  });

  it("Should set contractURI and get contractURI", async function() {
    const contractURI = "https://test.com";

    const [ owner, minter1 ] = await ethers.getSigners();

    await this.nft.connect(owner).togglePublicSale();
    await this.nft.connect(owner).setPublicSaleKey(1);

    await this.nft.connect(minter1).publicMint(MAX_PUBLIC_MINT, 1, { value: ethers.utils.parseEther((PUBLIC_PRICE * 3).toString()) });

    await this.nft.connect(owner).setContractURI(contractURI);
    const response = await this.nft.connect(owner).contractURI();
    expect(response).to.equal(contractURI);
  });

  it("Public mint founds sent should be equal to price * quantity", async function() {
    const [ owner, minter1 ] = await ethers.getSigners();

    await this.nft.connect(owner).togglePublicSale();
    await this.nft.connect(owner).setPublicSaleKey(1);

    await this.nft.connect(minter1).publicMint(1, 1, { value: ethers.utils.parseEther((PUBLIC_PRICE).toString()) });

    await expect(this.nft.connect(minter1).publicMint(1, 1, { value: ethers.utils.parseEther((PUBLIC_PRICE - 0.0001).toString()) })).to.be.revertedWith("insufficient founds sent");
    await expect(this.nft.connect(minter1).publicMint(1, 1, { value: ethers.utils.parseEther((PUBLIC_PRICE * 2).toString()) })).to.be.revertedWith("insufficient founds sent");
  });

  it("Allow list mint founds sent should be equal to price * quantity", async function() {
    const [ owner, minter1 ] = await ethers.getSigners();

    const allowlistAddresses = [
      minter1.address
    ];

    const leafNodes = allowlistAddresses.map(address => ethers.utils.keccak256(address));
    const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
    const merkleRoot = merkleTree.getRoot();
    const merkleProof1 = merkleTree.getHexProof(leafNodes[0]);

    await this.nft.connect(owner).setMerkleRoot(merkleRoot);
    await this.nft.connect(owner).toggleAllowListSale();

    await this.nft.connect(minter1).allowlistMint(merkleProof1, 1, { value: ethers.utils.parseEther((ALLOWLIST_PRICE).toString()) });

    await expect(this.nft.connect(minter1).allowlistMint(merkleProof1, 1, { value: ethers.utils.parseEther((ALLOWLIST_PRICE - 0.0001).toString()) })).to.be.revertedWith("insufficient founds sent");
    await expect(this.nft.connect(minter1).allowlistMint(merkleProof1, 1, { value: ethers.utils.parseEther((ALLOWLIST_PRICE * 2).toString()) })).to.be.revertedWith("insufficient founds sent");
  });
});
