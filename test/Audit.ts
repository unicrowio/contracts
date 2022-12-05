import chai, { expect } from "chai";

import { ethers, network } from "hardhat";
import { solidity } from "ethereum-waffle";

import { Unicrow } from "../types/Unicrow";
import { UnicrowDispute } from "../types/UnicrowDispute";

import { FakeToken } from "../types/FakeToken";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { setup } from "./helpers/deploy";

chai.use(solidity);

describe("Unicrow", function () {
  let unicrowContract: Unicrow;
  let unicrowDisputeContract: UnicrowDispute;
  let fakeTokenContract: FakeToken;

  let owner: SignerWithAddress;
  let buyer: SignerWithAddress;
  let bob: SignerWithAddress;
  let seller: SignerWithAddress;

  let payCommon: any;
  let payEther: any;

  const { AddressZero: ZERO_ADDRESS } = ethers.constants;

  const escrowValue = 9191;

  const escrowValueEth = 5;

  const escrowId = 0;

  beforeEach(async () => {
    // Get the list of accounts
    [owner, buyer, seller, bob] = await ethers.getSigners();

    const {
      unicrow,
      unicrowDispute,
      token,
    } = await setup();

    unicrowContract = unicrow;
    fakeTokenContract = token;
    unicrowDisputeContract = unicrowDispute;
    
    await fakeTokenContract.transfer(buyer.address, 1000000);
    await fakeTokenContract.transfer(seller.address, 10000);
    //@ts-ignore
    payCommon = {
      buyer: buyer.address,
      seller: seller.address,
      marketplace: ZERO_ADDRESS,
      currency: fakeTokenContract.address,
      marketplaceFee: 0,
      challengePeriod: 300,
      challengeExtension: 0,
      amount: escrowValue,
    };

    payEther = {
      buyer: buyer.address,
      seller: seller.address,
      marketplace: ZERO_ADDRESS,
      currency: ZERO_ADDRESS,
      marketplaceFee: 0,
      challengePeriod: 300,
      challengeExtension: 0,
      amount: escrowValueEth,
    };
  });

  context("When deposit happens", function () {
    it("steal user funds", async function () {
      // Buyer needs to approve escrowValue allowance to unicrowContract contract
      await fakeTokenContract.connect(buyer).approve(unicrowContract.address, escrowValue);

      //@ts-ignore
      await expect(
        unicrowContract.connect(buyer).pay(
          {
            //@ts-ignore
            ...payEther,
          },
          ZERO_ADDRESS,
          0
        , { value: 0})
      ).to.be.reverted
    });
  });
});
