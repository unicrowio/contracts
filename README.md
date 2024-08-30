# Unicrow Contracts and Interfaces

The map below might be useful to get quick bearings

![Contracts Map](./contracts-map.png)

_Note: To make the map reasonably orderly, only the most significant relationships are displayed_

# Basic Setup and Types

To install the packages:

```bash
yarn install
```

To generate the types and compile the contracts with the new ABI:

```bash
yarn hardhat compile
```

To get local rpc accounts:

```bash
yarn hardhat accounts
```

To get the configured safe account:

```bash
yarn hardhat safe
```

## Setup RPC Locally

Run ganache server to run a local RPC:

```bash
yarn hardhat node --no-deploy
```

## Deploy the Contracts

Setup environment variables:
```bash
cp .env.example .env
```

| KEY                 | VALUE                                            |
|---------------------|--------------------------------------------------|
| GNOSIS_SAFE_ADDRESS | Governance address multisig                      |
| MNEMONIC            | Account of one of the Gnosis Safe owners         |
| SAFE_SERVICE_URL    | Gnosis safe service url (to submit tx proposals) |
| UNICROW_FEE         | Unicrow fee (in bips)                            |

Deploy the Unicrow contracts (directly) on your local node:

```bash
yarn deploy:local
```

Deploy the Unicrow contracts (directly) on the Sepolia testnet:

```bash
yarn deploy:sepolia
```

Deploy the Unicrow contracts (directly) on the Arbitrum Sepolia testnet:

```bash
yarn deploy:arbitrumSepolia
```

Deploy the Unicrow contracts on Arbitrum One (via the Gnosis Safe):

```bash
yarn deploy:arbitrum:viasafe
```

## Interact using a console

It is recommended running the tests (see below) to test interactions with the contracts, but it is possible to do it using the console too by running a console instance first and then attaching an address.

Open the console:

```bash
yarn hardhat console --network development
```

Initiate a contract:

```bash
let unicrow = ethers.getContractFactory("Unicrow") // Replace "Unicrow" for a name of any other contract
unicrow = await unicrow.attach("address_of_the_contract_here"); // address you got during the deployment
```

Call the contract function:

```bash
await unicrow.pay({ paramters }) 
```

## Tests

Run the tests locally:

```bash
yarn hardhat test --network localhost
```
