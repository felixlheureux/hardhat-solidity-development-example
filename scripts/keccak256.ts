import { ethers } from "hardhat";

async function main() {
  console.log(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("")));
}

// This pattern is recommended to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
