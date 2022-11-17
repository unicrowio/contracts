import { task } from "hardhat/config";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "hardhat-gas-reporter";
import dotenv from "dotenv";

dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (_, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(await account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

export default {
  solidity: "0.8.7",
  defaultNetwork: "hardhat",
  settings: {
    optimizer: {
      enabled: true,
      runs: 1200,
    },
  },
  networks: {
    localhost: {
      url: "http://localhost:8545",
    },
    // mainnet: {
    //   url: process.env.NODE_URL,
    //   accounts: [process.env.PRIVATE_KEY as string],
    // }
  },
  gasreporter: {
    currency: "USD",
  },
  typechain: {
    outDir: "types",
    target: "ethers-v5",
    alwaysGenerateOverloads: false, // should overloads with full signatures like deposit(uint256) be generated always, even if there are no overloads?
    externalArtifacts: ["artifacts/contracts/**/.json"], // optional array of glob patterns with external artifacts to process (for example external libs from node_modules)
  },
};
