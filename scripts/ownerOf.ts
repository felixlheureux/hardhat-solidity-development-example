import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

const PROXY_CONTRACT_ADDRESS = "";
const CONTRACT_NAME = "";
const ABI = require("./ABI.json");

const cliProgress = require("cli-progress");

async function main() {
  const contract = await ethers.getContractAt(ABI, PROXY_CONTRACT_ADDRESS);

  const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

  // @ts-ignore
  const totalSupply = await contract.totalSupply();

  console.log(`\n Total supply: ${totalSupply}\n`);

  progressBar.start(totalSupply, 0);

  const holdersMap: { [key: string]: string } = {};
  const holders: string[] = [];

  for (let i = 0; i < totalSupply; i++) {
    // @ts-ignore
    const holder = await contract.ownerOf(i);
    if (holdersMap[holder] === undefined) {
      holdersMap[holder] = holder;
      holders.push(holder);
    }

    progressBar.update(i + 1);
  }

  progressBar.stop();

  console.log(`\n Holder count: ${holders.length}\n`);

  let json = JSON.stringify(holders);

  fs.writeFileSync(path.resolve(`./`, `./scripts/holders.json`), json, "utf8");
}

// This pattern is recommended to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
