import { ethers } from "hardhat";

async function main() {
  const HelloWorld = await ethers.getContractFactory("");

  // Start deployment, returning a promise that resolves to a contract object
  const hello_world = await HelloWorld.deploy();
  console.log("Contract deployed to address:", hello_world.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });