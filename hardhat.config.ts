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
  ARBISCAN_API_KEY,
  BASESCAN_API_KEY,
  REPORT_GAS
} = process.env;

if (MNEMONIC && MNEMONIC_PATH && GNOSIS_SAFE_ADDRESS && SAFE_SERVICE_URL) {
setupSafeDeployer(
    Wallet.fromMnemonic(MNEMONIC, MNEMONIC_PATH),
    GNOSIS_SAFE_ADDRESS,
  SAFE_SERVICE_URL
  );
}
const sharedNetworkConfig: HttpNetworkUserConfig = {};
if (MNEMONIC) {
sharedNetworkConfig.accounts = {
    mnemonic: MNEMONIC
};
}

task("safe", "Prints the configured safe account for mainnet deployments", async (_, hre) => {
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
    hardhat: {
      allowUnlimitedContractSize: true,
    },
    localhost: {
      url: "http://localhost:8545",
      chainId: 31337
    },
    arbitrum: {
      ...sharedNetworkConfig,
      url: "https://arb1.arbitrum.io/rpc",
      chainId: 42161
    },
    arbitrumSepolia: {
      ...sharedNetworkConfig,
      url: "https://sepolia-rollup.arbitrum.io/rpc",
      chainId: 421614
    },
    base: {
      ...sharedNetworkConfig,
      url: "https://arb1.arbitrum.io/rpc",
      chainId: 42161
    },
    base: {
      ...sharedNetworkConfig,
      url: 'https://mainnet.base.org',
      chainId: 8453
    },
    baseSepolia: {
      ...sharedNetworkConfig,
      url: "https://sepolia.base.org",
      chainId: 84532,
    },
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY || "",
      arbitrumSepolia: ARBISCAN_API_KEY || "",
      arbitrum: ARBISCAN_API_KEY || "",
      base: BASESCAN_API_KEY || "",
      baseSepolia: BASESCAN_API_KEY || ""
  },
    customChains: [
      {
        network: "arbitrum",
        chainId: 42161,
        urls: {
          apiURL: "https://api.arbiscan.io/api",
          browserURL: "https://arbiscan.io/"
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
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org/"
        }
      },
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://basescan.org/"
        }
      },
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org/"
        }
      },
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org/"
        }
      },
    ]
  },
  namedAccounts: {
    deployer: GNOSIS_SAFE_ADDRESS || "0x0000000000000000000000000000000000000001",
  },
  gasReporter: {
    currency: "USD",
    enabled: REPORT_GAS ? true : false
  },
  typechain: {
    outDir: "types",
    target: "ethers-v6",
    alwaysGenerateOverloads: false,
    externalArtifacts: ["artifacts/contracts/**/.json"],
  },
  external: process.env.HARDHAT_FORK
    ? {
      deployments: {
        hardhat: ['deployments/' + process.env.HARDHAT_FORK],
        localhost: ['deployments/' + process.env.HARDHAT_FORK],
      },
    }
    : undefined,
  mocha: {
    timeout: 100000
  }
};

export default userConfig;
