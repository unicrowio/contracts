import { task } from "hardhat/config";
import { HardhatUserConfig, HttpNetworkUserConfig } from "hardhat/types";
import "@typechain/hardhat";
import 'hardhat-deploy';
import '@nomiclabs/hardhat-ethers';
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan";
import "hardhat-gas-reporter";
import "@nomiclabs/hardhat-web3";
import { setupSafeDeployer } from "hardhat-safe-deployer";
import { Wallet } from "@ethersproject/wallet";
import dotenv from "dotenv";

dotenv.config();

const {
  MNEMONIC,
  MNEMONIC_PATH,
  SAFE_SERVICE_URL,
  GNOSIS_SAFE_ADDRESS,
  ETHERSCAN_API_KEY,
  ARBISCAN_API_KEY
} = process.env;

setupSafeDeployer(
  Wallet.fromMnemonic(MNEMONIC!!, MNEMONIC_PATH),
  GNOSIS_SAFE_ADDRESS!!,
  SAFE_SERVICE_URL
)

const sharedNetworkConfig: HttpNetworkUserConfig = {};
sharedNetworkConfig.accounts = {
  mnemonic: MNEMONIC!!
};

task("safe", "Prints the configured safe (deployer and governance account)", async (_, hre) => {
  const { deployer } = await hre.getNamedAccounts();
  console.log(deployer);
});

const userConfig: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  solidity: {
    compilers: [
      {
        version: "0.8.7",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1200,
          },
        }
      }
    ]
  },
  networks: {
    localhost: {
      // ...sharedNetworkConfig,
      url: "http://localhost:8545",
      chainId: 31337
    },
    sepolia: {
      ...sharedNetworkConfig,
      url: "https://rpc2.sepolia.org",
      chainId: 11155111
    },
    arbitrumSepolia: {
      ...sharedNetworkConfig,
      url: "https://sepolia-rollup.arbitrum.io/rpc",
      chainId: 421614
    },
    arbitrum: {
      ...sharedNetworkConfig,
      url: "https://arb1.arbitrum.io/rpc",
      chainId: 42161
    }
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY!!,
      arbitrumSepolia: ARBISCAN_API_KEY!!,
      arbitrum: ARBISCAN_API_KEY!!,
    },
    customChains: [
      {
        network: "sepolia",
        chainId: 11155111,
        urls: {
          apiURL: "https://api-sepolia.etherscan.io/api",
          browserURL: "https://sepolia.etherscan.io"
        }
      },
      {
        network: "arbitrumSepolia",
        chainId: 421614,
        urls: {
          apiURL: "https://api-sepolia.arbiscan.io/api",
          browserURL: "https://sepolia.arbiscan.io/"
        }
      },
      {
        network: "arbitrum",
        chainId: 42161,
        urls: {
          apiURL: "https://api.arbiscan.io/api",
          browserURL: "https://arbiscan.io/"
        }
      },
    ]
  },
  namedAccounts: {
    deployer: GNOSIS_SAFE_ADDRESS!!,
  },
  gasReporter: {
    currency: "USD",
  },
  typechain: {
    outDir: "types",
    target: "ethers-v6",
    alwaysGenerateOverloads: false, // should overloads with full signatures like deposit(uint256) be generated always, even if there are no overloads?
    externalArtifacts: ["artifacts/contracts/**/.json"], // optional array of glob patterns with external artifacts to process (for example external libs from node_modules)
  },
  external: process.env.HARDHAT_FORK
    ? {
      deployments: {
        // process.env.HARDHAT_FORK will specify the network that the fork is made from.
        // these lines allow it to fetch the deployments from the network being forked from both for node and deploy task
        hardhat: ['deployments/' + process.env.HARDHAT_FORK],
        localhost: ['deployments/' + process.env.HARDHAT_FORK],
      },
    }
    : undefined
};

export default userConfig
