
import { getContractAddress } from "@ethersproject/address";
import { ethers } from "hardhat";

const UNICROW_FEE = 0 // bips;

export const GetFactories = async () => {
      const UnicrowFactory = await ethers.getContractFactory(
        "Unicrow"
      );
  
      const UnicrowClaimFactory = await ethers.getContractFactory(
        "UnicrowClaim"
      );
  
      const UnicrowDisputeFactory = await ethers.getContractFactory(
        "UnicrowDispute"
      );
  
      const UnicrowArbitratorFactory = await ethers.getContractFactory(
        "UnicrowArbitrator"
      );

      const FakeTokenFactory = await ethers.getContractFactory(
        "FakeToken"
      );

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

    const transactionCount = await owner.getTransactionCount()

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

    const [, , , , , treasury] = await ethers.getSigners();

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
    
    const unicrow = await UnicrowFactory.deploy(UnicrowClaimAddressNonce, UnicrowArbitratorAddressNonce, UnicrowDisputeAddressNonce, treasury.address, UNICROW_FEE);
    await unicrow.deployed();

    const unicrowClaim = await UnicrowClaimFactory.deploy(UnicrowAddressNonce, UnicrowArbitratorAddressNonce, treasury.address);
    await unicrowClaim.deployed();

    const unicrowDispute = await UnicrowDisputeFactory.deploy(UnicrowAddressNonce, UnicrowClaimAddressNonce, UnicrowArbitratorAddressNonce);
    await unicrowDispute.deployed();

    const unicrowArbitrator = await UnicrowArbitratorFactory.deploy(UnicrowAddressNonce, UnicrowClaimAddressNonce);
    await unicrowArbitrator.deployed();

    const fakeToken = await FakeTokenFactory.deploy("FakeToken", "CROW");
    await fakeToken.deployed();
    
    return {
        unicrow,
        unicrowDispute,
        unicrowArbitrator,
        unicrowClaim,
        token: fakeToken
    }
  
}