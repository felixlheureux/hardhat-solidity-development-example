import dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";

import "./tasks/tasks";

dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs: any, hre: { ethers: { getSigners: () => any; }; }) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more
const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    mainnet: {
      url: process.env.MAINNET_PROVIDER_URL || "", // or any other JSON-RPC provider
      accounts: process.env.MAINNET_ACCOUNTS || [],
    },
    rinkeby: {
      url: process.env.RINKEBY_PROVIDER_URL || "", // or any other JSON-RPC provider
      accounts: process.env.RINKEBY_ACCOUNTS || [],
    }
  },
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 500
      }
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    token: "ETH",
    coinmarketcap: process.env.COINMARKETCAP_KEY || ""
  },
  etherscan: {
    apiKey: {
      mainnet: "",
      rinkeby: process.env.ETHERSCAN_API_KEY || ""
    }
  },
  typechain: {
    outDir: "./typechain-types"
  }
};

export default config;
