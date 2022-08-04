import { task } from "hardhat/config";
import { getAccount, getContract } from "./helpers";
import axios from "axios";

const MAX_SUPPLY = 100;
const MAX_PUBLIC_MINT = 3;
const MAX_ALLOWLIST_MINT = 3;
const PUBLIC_PRICE = "0.001";
const ALLOWLIST_PRICE = "0.001";
const AMOUNT_FOR_DEVS = 10;
const CONTRACT_FACTORY = "ChildrenOfUkiyo";

task("check-balance", "Prints out the balance of your account").setAction(
  async (taskArguments, hre) => {
    const account = getAccount();
    console.log(`Account balance for ${account.address}: ${hre.ethers.utils.formatUnits(await account.getBalance())}`);
  }
);

task("deploy", "Deploys the nft.sol contract").setAction(
  async (taskArguments, hre) => {
    const publicPriceWei = hre.ethers.utils.parseEther(PUBLIC_PRICE);
    const allowlistPriceWei = hre.ethers.utils.parseEther(ALLOWLIST_PRICE);

    const nftContractFactory = await hre.ethers.getContractFactory(
      CONTRACT_FACTORY,
      getAccount()
    );
    const nft = await nftContractFactory.deploy(
      MAX_SUPPLY,
      MAX_PUBLIC_MINT,
      MAX_ALLOWLIST_MINT,
      publicPriceWei,
      allowlistPriceWei,
      AMOUNT_FOR_DEVS
    );

    console.log(`Contract deployed to address: ${nft.address}`);
  }
);

task("public-mint", "Mints from the NFT contract")
  .addParam("address", "The address to receive a token")
  .setAction(async function(taskArguments, hre) {
    const contract = await getContract(CONTRACT_FACTORY, hre);
    const response = await contract.mintTo(taskArguments.address, {
      gasLimit: 500_000
    });
    console.log(`Transaction Hash: ${JSON.stringify(response, null, 2)}`);
  });

task("set-base-token-uri", "Sets the base token URI for the deployed smart contract")
  .addParam("baseUri", "The base of the tokenURI endpoint to set")
  .setAction(async function(taskArguments, hre) {
    const contract = await getContract(CONTRACT_FACTORY, hre);
    const response = await contract.setBaseURI(
      taskArguments.baseUrl, {
        gasLimit: 500_000
      }
    );
    console.log(`Transaction Hash: ${JSON.stringify(response, null, 2)}`);
  });

task("token-uri", "Fetches the token metadata for the given token ID")
  .addParam("tokenId", "The tokenID to fetch metadata for")
  .setAction(async function(taskArguments, hre) {
    const contract = await getContract(CONTRACT_FACTORY, hre);
    const response = await contract.tokenURI(taskArguments.tokenId, {
      gasLimit: 500_000
    });
    console.log(`Metadata URL: ${response}`);

    const metadata = await axios.get(response);

    console.log(`Metadata fetch response: ${JSON.stringify(metadata.data, null, 2)}`);
  });

task("toggle-public-mint", "Toggles the public mint")
  .setAction(async function(taskArguments, hre) {
    const contract = await getContract(CONTRACT_FACTORY, hre);
    const response = await contract.togglePublicSale({
      gasLimit: 500_000
    });

    console.log(`Public mint toggled: ${JSON.stringify(response, null, 2)}`);
  });

task("set-public-mint-key", "Sets the given key as the public mint key")
  .addParam("publicMintKey", "The key for the public mint")
  .setAction(async function(taskArguments, hre) {
    const contract = await getContract(CONTRACT_FACTORY, hre);
    const response = await contract.setPublicMintKey(taskArguments.publicMintKey, {
      gasLimit: 500_000
    });

    console.log(`Public mint key set: ${JSON.stringify(response, null, 2)}`);
  });

task("toggle-allowlist-mint", "Toggles the allow list mint")
  .setAction(async function(taskArguments, hre) {
    const contract = await getContract(CONTRACT_FACTORY, hre);
    const response = await contract.toggleAllowListSale({
      gasLimit: 500_000
    });

    console.log(`Allow list mint toggled: ${JSON.stringify(response, null, 2)}`);
  });

task("set-merkleroot", "Sets the merkle root for allow list")
  .addParam("merkleRoot", "Merkle root for the allow list")
  .setAction(async function(taskArguments, hre) {
    const contract = await getContract(CONTRACT_FACTORY, hre);
    const response = await contract.setMerkleRoot(Buffer.from(taskArguments.merkleRoot, "hex"), {
      gasLimit: 500_000
    });

    console.log(`Merkle root set: ${JSON.stringify(response, null, 2)}`);
  });

task("withdraw", "Withdraws the given amount of tokens from the contract")
  .setAction(async function(taskArguments, hre) {
    const contract = await getContract(CONTRACT_FACTORY, hre);
    const response = await contract.withdrawMoney({
      gasLimit: 500_000
    });

    console.log(`Withdraw: ${JSON.stringify(response, null, 2)}`);
  });