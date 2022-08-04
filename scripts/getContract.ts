import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const PROXY_CONTRACT_ADDRESS = "";
const OWNERS = [];
const ABI = require("./ABI.json");

const cliProgress = require("cli-progress");

async function main() {
  const contract = await ethers.getContractAt(ABI, PROXY_CONTRACT_ADDRESS);

  const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

  progressBar.start(OWNERS.length, 0);

  const tokens: number[] = [];
  const map: { [key: string]: number[] } = {};

  for (let i = 0; i < OWNERS.length; i++) {
    await (async () => {
      try {
        // @ts-ignore
        const tokensOfOwner = await contract.tokensOfOwner(OWNERS[i]);
        tokensOfOwner.forEach((t: any) => {
          tokens.push(parseInt(t.toString()));
          if (map[OWNERS[i]] === undefined) {
            map[OWNERS[i]] = [ parseInt(t.toString()) ];
          } else {
            map[OWNERS[i]].push(parseInt(t.toString()));
          }
        });
      } catch (e) {
        console.log(e);
      }
    })();

    progressBar.update(i + 1);
  }

  progressBar.stop();

  console.log(`\n Tokens count: ${tokens.length}\n`);

  let json = JSON.stringify(tokens);

  fs.writeFileSync(path.resolve(`./`, `./scripts/tokens.json`), json, "utf8");

  json = JSON.stringify(map);

  fs.writeFileSync(path.resolve(`./`, `./scripts/tokensByAddress.json`), json, "utf8");
}

// This pattern is recommended to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
