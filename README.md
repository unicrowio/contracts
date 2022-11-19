# Contracts and interfaces for Unicrow audit

The map below might be useful to get quick bearings

![Contracts Map](./contracts-map.png)


# Setup

## Tests

Install the packages:
```
yarn install
```

Compile the contracts:
```
yarn build
```

Run the tests:
```
yarn test
```

## Deploy

Setup environment variables:
```
cp .env.example .env
```

| KEY                 | VALUE                                            |
|---------------------|--------------------------------------------------|
| GNOSIS_SAFE_ADDRESS | Governance address multisign                     |
| PRIVATE_KEY         | Deployer account                                 |
| NODE_URL            | Infura, Alchemy or any node to deploy to mainnet |

Command to deploy:
```
yarn hardhat run ./scripts/deploy.ts --network mainnet
```