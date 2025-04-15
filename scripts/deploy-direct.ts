import { ethers } from "hardhat";
import dotenv from "dotenv";
import { getContractAddress } from "@ethersproject/address";

dotenv.config();

const { GNOSIS_SAFE_ADDRESS, UNICROW_FEE } = process.env;

async function main() {
  const [deployer] = await ethers.getSigners();

  const Unicrow = await ethers.getContractFactory("Unicrow");
  const UnicrowDispute = await ethers.getContractFactory("UnicrowDispute");
  const UnicrowArbitrator = await ethers.getContractFactory("UnicrowArbitrator");
  const UnicrowClaim = await ethers.getContractFactory("UnicrowClaim");

  console.log( `Deploying contracts with the account: ${deployer.address}`);
  
  let transactionCount = await deployer.getTransactionCount();

  const UnicrowAddress = getContractAddress({
    from: deployer.address,
    nonce: transactionCount++,
  })

  console.log(`Unicrow: ${UnicrowAddress}`);

  const UnicrowDisputeAddress = getContractAddress({
    from: deployer.address,
    nonce: transactionCount++,
  })

  console.log(`UnicrowDispute: ${UnicrowDisputeAddress}`);

  const UnicrowArbitratorAddress = getContractAddress({
    from: deployer.address,
    nonce: transactionCount++,
  })

  console.log(`UnicrowArbitrator: ${UnicrowArbitratorAddress}`);

  const UnicrowClaimAddress = getContractAddress({
    from: deployer.address,
    nonce: transactionCount++,
  })

  console.log(`UnicrowClaim: ${UnicrowClaimAddress}`);

  const unicrow = await Unicrow.deploy(
    UnicrowClaimAddress,
    UnicrowArbitratorAddress,
    UnicrowDisputeAddress,
    GNOSIS_SAFE_ADDRESS,
    UNICROW_FEE
  );

  await unicrow.deployed();

  console.log(`Unicrow deployed to: ${unicrow.address}`);

  const unicrowDispute = await UnicrowDispute.deploy(
    UnicrowAddress,
    UnicrowClaimAddress,
    UnicrowArbitratorAddress
  );

  await unicrowDispute.deployed();

  console.log(`UnicrowDispute deployed to: ${unicrowDispute.address}`);

  const unicrowArbitrator = await UnicrowArbitrator.deploy(
    UnicrowAddress,
    UnicrowClaimAddress
  );

  await unicrowArbitrator.deployed();

  console.log(`UnicrowArbitrator deployed to: ${unicrowArbitrator.address}`);

  const unicrowClaim = await UnicrowClaim.deploy(
    UnicrowAddress,
    UnicrowArbitratorAddress,
    GNOSIS_SAFE_ADDRESS
  );

  await unicrowClaim.deployed();

  console.log(`UnicrowClaim deployed to: ${unicrowClaim.address}`);

  // const FakeToken = await ethers.getContractFactory("FakeToken");
  // const fakeToken = await FakeToken.deploy("FakeToken", "FTK");
  // await fakeToken.deployed();
  // console.log(`FakeToken deployed to: ${fakeToken.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
