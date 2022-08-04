import { ethers } from "ethers";
import { getContractAt } from "@nomiclabs/hardhat-ethers/internal/helpers";

// Helper method for fetching environment variables from .env
export const getEnvVariable = (key: any, defaultValue?: any) => {
  if (process.env[key]) {
    return process.env[key];
  }
  if (!defaultValue) {
    throw new Error(`${key} is not defined and no default value was provided`);
  }
  return defaultValue;
};

// Helper method for fetching a connection provider to the Ethereum network
export const getProvider = () => {
  return ethers.getDefaultProvider(getEnvVariable("NETWORK", "rinkeby"), {
    alchemy: getEnvVariable("RINKEBY_URL")
  });
};

// Helper method for fetching a wallet account using an environment variable for the PK
export const getAccount = () => {
  return new ethers.Wallet(getEnvVariable("PRIVATE_KEY"), getProvider());
};

// Helper method for fetching a contract instance at a given address
export const getContract = (contractName: any, hre: any) => {
  const account = getAccount();
  return getContractAt(
    hre,
    contractName,
    getEnvVariable("NFT_CONTRACT_ADDRESS"),
    account
  );
};
