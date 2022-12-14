import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {getContractAddress} from "@ethersproject/address";

const { GNOSIS_SAFE_ADDRESS, UNICROW_FEE } = process.env;

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployer} = await hre.getNamedAccounts();
	const {deploy} = hre.deployments;

  console.log( `Deploying contracts with the account: ${deployer}`);

  let transactionCount = await hre.web3.eth.getTransactionCount(deployer);

  const UnicrowContractAddress = getContractAddress({
    from: deployer,
    nonce: transactionCount,
  })

  console.log(`UnicrowContractAddress: ${UnicrowContractAddress}`);

  const UnicrowDisputeAddress = getContractAddress({
    from: deployer,
    nonce: transactionCount + 1,
  })

  console.log(`UnicrowDispute: ${UnicrowDisputeAddress}`);


  const UnicrowArbitratorAddress = getContractAddress({
    from: deployer,
    nonce: transactionCount + 2,
  })

  console.log(`UnicrowArbitrator: ${UnicrowArbitratorAddress}`);

  const UnicrowClaimAddress = getContractAddress({
    from: deployer,
    nonce: transactionCount + 3
  })

  console.log(`UnicrowClaim: ${UnicrowClaimAddress}`);

	await deploy('Unicrow', {
		from: deployer,
		args: [
      UnicrowClaimAddress,
      UnicrowArbitratorAddress,
      UnicrowDisputeAddress,
      GNOSIS_SAFE_ADDRESS,
      UNICROW_FEE
    ],
		log: true,
	});

	await deploy('UnicrowDispute', {
		from: deployer,
		args: [
      UnicrowContractAddress,
      UnicrowClaimAddress,
      UnicrowArbitratorAddress
    ],
		log: true,
	});

	await deploy('UnicrowArbitrator', {
		from: deployer,
		args: [
      UnicrowContractAddress,
      UnicrowClaimAddress
    ],
		log: true,
	});

	await deploy('UnicrowClaim', {
		from: deployer,
		args: [
      UnicrowContractAddress,
      UnicrowArbitratorAddress,
      GNOSIS_SAFE_ADDRESS
    ],
		log: true,
	});
};

export default func;
func.tags = ['Unicrow'];
