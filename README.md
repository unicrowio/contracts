# Contracts and interfaces for Unicrow audit

The map below might be useful to get quick bearings

![Contracts Map](./contracts-map.png)

# Basic Setup and Types

Run this command to install the packages:

```i
yarn install
```

Run this command to generate the types and compile the contracts with the new ABI:

```bash
yarn hardhat compile
```

Run this command to get the local rpc accounts:

```bash
yarn hardhat accounts
```

## Setup RPC Locally

Run ganache server to run a local RPC:

```bash
yarn hardhat node
```

## Deploy the Contracts

Setup environment variables:
```
cp .env.example .env
```

| KEY                 | VALUE                                            |
|---------------------|--------------------------------------------------|
| GNOSIS_SAFE_ADDRESS | Governance address multisign                     |
| PRIVATE_KEY         | Deployer account                                 |
| NODE_URL            | Infura, Alchemy or any node to deploy to mainnet |

Deploy the crow contracts with your local rpc:

```bash
yarn deploy:crow
```

## Interact using console

To interact with the contracts on the console you need to instance then and attach the address (or using the tests, that is easier than console).

Run this command to open the rpc and interact with the contracts locally:

```bash
yarn hardhat console --network development
```

After the contract opened you can use the contracts doing it:

```bash
let crow = ethers.getContractFactory("Crow") // or other contract names
crow = await crow.attach("address_of_the_contract_here");
```

And now just use the contract functions

```bash
await crow.pay({ paramters }) // in this case can be better to run the utils script that's faster than fill all paramters
```

## Tests

Run the tests locally:

```bash
yarn hardhat test --network localhost
```