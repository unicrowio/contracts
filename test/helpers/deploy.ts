
import { getContractAddress } from "@ethersproject/address";
import { ethers } from "hardhat";
import { UnicrowArbitrator__factory } from "../../types/factories/UnicrowArbitrator__factory";
import { UnicrowClaim__factory } from "../../types/factories/UnicrowClaim__factory";
import { UnicrowDispute__factory } from "../../types/factories/UnicrowDispute__factory";
import { Unicrow__factory } from "../../types/factories/Unicrow__factory";
import { FakeToken__factory } from "../../types/factories/FakeToken__factory";
import { FakeToken } from "../../types/FakeToken";
import { Unicrow } from "../../types/Unicrow";
import { UnicrowArbitrator } from "../../types/UnicrowArbitrator";
import { UnicrowClaim } from "../../types/UnicrowClaim";
import { UnicrowDispute } from "../../types/UnicrowDispute";

const UNICROW_FEE = 0 // bips;

export const GetFactories = async () => {
      const UnicrowFactory = (await ethers.getContractFactory(
        "Unicrow"
      )) as Unicrow__factory;
  
      const UnicrowClaimFactory = (await ethers.getContractFactory(
        "UnicrowClaim"
      )) as UnicrowClaim__factory;
  
      const UnicrowDisputeFactory = (await ethers.getContractFactory(
        "UnicrowDispute"
      )) as UnicrowDispute__factory;
  
      const UnicrowArbitratorFactory = (await ethers.getContractFactory(
        "UnicrowArbitrator"
      )) as UnicrowArbitrator__factory;

      const FakeTokenFactory = (await ethers.getContractFactory(
        "FakeToken"
      )) as FakeToken__factory;

      return {
        UnicrowFactory,
        UnicrowClaimFactory,
        UnicrowDisputeFactory,
        UnicrowArbitratorFactory,
        FakeTokenFactory
      }
}

export const predictAddresses = async () => {
    const [owner] = await ethers.getSigners();

    let transactionCount = await owner.getTransactionCount()

    const UnicrowAddressNonce = getContractAddress({
        from: owner.address,
        nonce: transactionCount
    })

    const UnicrowClaimAddressNonce = getContractAddress({
        from: owner.address,
        nonce: transactionCount + 1
    })

    const UnicrowDisputeAddressNonce = getContractAddress({
        from: owner.address,
        nonce: transactionCount + 2
    })

    const UnicrowArbitratorAddressNonce = getContractAddress({
        from: owner.address,
        nonce: transactionCount + 3
    })

    const FakeTokenrAddressNonce = getContractAddress({
        from: owner.address,
        nonce: transactionCount + 4
    })

    return {
        UnicrowAddressNonce,
        UnicrowClaimAddressNonce,
        UnicrowDisputeAddressNonce,
        UnicrowArbitratorAddressNonce,
        FakeTokenrAddressNonce
    }
}

export const setup = async () => {

    const [owner, buyer, seller, bob, marketplace, treasury] = await ethers.getSigners();

    const {
        UnicrowFactory,
        UnicrowClaimFactory,
        UnicrowDisputeFactory,
        UnicrowArbitratorFactory,
        FakeTokenFactory
    } = await GetFactories();

    const {
        UnicrowAddressNonce,
        UnicrowClaimAddressNonce,
        UnicrowDisputeAddressNonce,
        UnicrowArbitratorAddressNonce,
    } = await predictAddresses();
    
    const unicrow : Unicrow = await UnicrowFactory.deploy(UnicrowClaimAddressNonce, UnicrowArbitratorAddressNonce, UnicrowDisputeAddressNonce, treasury.address, UNICROW_FEE);
    await unicrow.deployed();

    const unicrowClaim: UnicrowClaim = await UnicrowClaimFactory.deploy(UnicrowAddressNonce, UnicrowArbitratorAddressNonce, treasury.address);
    await unicrowClaim.deployed();

    const unicrowDispute: UnicrowDispute = await UnicrowDisputeFactory.deploy(UnicrowAddressNonce, UnicrowClaimAddressNonce, UnicrowArbitratorAddressNonce);
    await unicrowDispute.deployed();

    const unicrowArbitrator: UnicrowArbitrator = await UnicrowArbitratorFactory.deploy(UnicrowAddressNonce, UnicrowClaimAddressNonce);
    await unicrowArbitrator.deployed();

    const fakeToken: FakeToken = await FakeTokenFactory.deploy("FakeToken", "CROW");
    await fakeToken.deployed();
    
    return {
        unicrow,
        unicrowDispute,
        unicrowArbitrator,
        unicrowClaim,
        token: fakeToken
    }
  
}