import chai, { expect } from "chai";

import { ethers } from "hardhat";

import { solidity } from "ethereum-waffle";

import { Unicrow } from "../types/Unicrow";

import { UnicrowArbitrator } from "../types/UnicrowArbitrator";

import { UnicrowDispute } from "../types/UnicrowDispute";

import { FakeToken } from "../types/FakeToken";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { setup } from "./helpers/deploy";

chai.use(solidity);

describe("UnicrowArbitrator", function () {
  let unicrowContract: Unicrow;
  let crowToken: FakeToken;
  let unicrowDisputeContract: UnicrowDispute;
  let unicrowArbitratorContract: UnicrowArbitrator;

  let owner: SignerWithAddress;
  let buyer: SignerWithAddress;
  let bob: SignerWithAddress;
  let seller: SignerWithAddress;
  let jess: SignerWithAddress;

  let payCommon: any;
  let payEther: any;

  const { AddressZero: ZERO_ADDRESS } = ethers.constants;

  const escrowValue = 9191;
  const escrowValueParsed = 9191;

  const escrowValueEth = 5;

  const escrowId = 0;

  beforeEach(async () => {
    // Get the list of accounts
    [owner, buyer, seller, bob, jess] = await ethers.getSigners();

    const { 
      unicrow,
      unicrowArbitrator,
      unicrowDispute,
      token,
    } = await setup();

    unicrowContract = unicrow;
    unicrowArbitratorContract = unicrowArbitrator;
    unicrowDisputeContract = unicrowDispute;

    crowToken = token;

    await crowToken.transfer(buyer.address, 1000000);
    await crowToken.transfer(seller.address, 10000);
    //@ts-ignore
    payCommon = {
      buyer: buyer.address,
      seller: seller.address,
      marketplace: ZERO_ADDRESS,
      currency: crowToken.address,
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
  
  context("When deposit with arbitrator happens", function () {
    it("should be able to buyer deposits ERC20 into unicrowContract with arbitrary", async function () {
      // Buyer needs to approve escrowValue allowance to unicrowContract contract
  
      await crowToken.connect(buyer).approve(unicrowContract.address, escrowValueParsed);
  
      await expect(
        unicrowContract.connect(buyer).pay(
          {
            //@ts-ignore
            ...payCommon,
          },
          bob.address,
          0
        )
      ).to.emit(unicrowContract, "Pay");
  
      expect((await unicrowContract.getEscrow(escrowId)).amount).to.eq(escrowValue);
      
      expect(
        (await unicrowArbitratorContract.getArbitratorData(escrowId)).arbitrator
      ).to.eq(bob.address);
    });
    
    it("should not be able to add an arbitrator to a payment with arbitrator", async function () {
      // Buyer needs to approve escrowValue allowance to unicrowContract contract

      await crowToken.connect(buyer).approve(unicrowContract.address, escrowValueParsed);

      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        bob.address,
        1000
      );

      await expect(
        unicrowArbitratorContract
          .connect(seller)
          .proposeArbitrator(escrowId, jess.address, 100)
      ).to.be.revertedWith("2-006");
    });
    it("should not be able to add an arbitrator to an existent payment with consensus", async function () {
      // Buyer needs to approve escrowValue allowance to unicrowContract contract

      await crowToken.connect(buyer).approve(unicrowContract.address, escrowValueParsed);

      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        ZERO_ADDRESS,
        0
      );

      await unicrowArbitratorContract
        .connect(seller)
        .proposeArbitrator(escrowId, bob.address, 200);
      await unicrowArbitratorContract
        .connect(buyer)
        .approveArbitrator(escrowId, bob.address, 200);

      await expect(
        unicrowArbitratorContract
          .connect(seller)
          .proposeArbitrator(escrowId, jess.address, 100)
      ).to.be.revertedWith("2-006");
    });

    it("should not be able to add buyer as a arbitrator", async function () {
      // Buyer needs to approve escrowValue allowance to unicrowContract contract

      await crowToken.connect(buyer).approve(unicrowContract.address, escrowValueParsed);

      await expect(unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        buyer.address,
        0
      )).to.be.revertedWith("1-027");
    });

    it("should not be able to add seller as a arbitrator", async function () {
      // Buyer needs to approve escrowValue allowance to unicrowContract contract

      await crowToken.connect(buyer).approve(unicrowContract.address, escrowValueParsed);

      await expect(unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        seller.address,
        0
      )).to.be.revertedWith("1-027");
    });

    it("should not be able to propose buyer as a arbitrator", async function () {
      // Buyer needs to approve escrowValue allowance to unicrowContract contract

      await crowToken.connect(buyer).approve(unicrowContract.address, escrowValueParsed);

      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        ZERO_ADDRESS,
        0
      );

      await expect(unicrowArbitratorContract
        .connect(buyer)
        .proposeArbitrator(escrowId, buyer.address, 200)
      ).to.be.revertedWith("2-010");
    });

    it("should not be able to propose seller as a arbitrator", async function () {
      // Buyer needs to approve escrowValue allowance to unicrowContract contract

      await crowToken.connect(buyer).approve(unicrowContract.address, escrowValueParsed);

      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        ZERO_ADDRESS,
        0
      );

      await expect(unicrowArbitratorContract
        .connect(seller)
        .proposeArbitrator(escrowId, seller.address, 200)
      ).to.be.revertedWith("2-010");
    });

    it("should not be able to add an arbitrator with a wrong validation address field", async function () {
      // Buyer needs to approve escrowValue allowance to unicrowContract contract

      await crowToken.connect(buyer).approve(unicrowContract.address, escrowValueParsed);

      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        ZERO_ADDRESS,
        0
      );

      await unicrowArbitratorContract
        .connect(seller)
        .proposeArbitrator(escrowId, bob.address, 200);
      await expect(
        unicrowArbitratorContract
          .connect(buyer)
          .approveArbitrator(escrowId, buyer.address, 100)
      ).to.be.revertedWith("2-008");
    });

    it("should not be able to add an arbitrator with a wrong validation fee field", async function () {
      // Buyer needs to approve escrowValue allowance to unicrowContract contract

      await crowToken.connect(buyer).approve(unicrowContract.address, escrowValueParsed);

      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        ZERO_ADDRESS,
        0
      );

      await unicrowArbitratorContract
        .connect(seller)
        .proposeArbitrator(escrowId, bob.address, 200);
      await expect(
        unicrowArbitratorContract
          .connect(buyer)
          .approveArbitrator(escrowId, bob.address, 100)
      ).to.be.revertedWith("2-007");
    });

    it("should be able to add an arbitrator to an existent payment", async function () {
      // Buyer needs to approve escrowValue allowance to unicrowContract contract

      await crowToken.connect(buyer).approve(unicrowContract.address, escrowValueParsed);

      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        ZERO_ADDRESS,
        0
      );

      await unicrowArbitratorContract
        .connect(seller)
        .proposeArbitrator(escrowId, bob.address, 200);
      await unicrowArbitratorContract
        .connect(buyer)
        .approveArbitrator(escrowId, bob.address, 200);

      expect(
        (await unicrowArbitratorContract.getArbitratorData(escrowId)).arbitrator
      ).to.eq(bob.address);
      expect(
        (await unicrowArbitratorContract.getArbitratorData(escrowId)).arbitratorFee
      ).to.eq(200);
      expect(
        (await unicrowArbitratorContract.getArbitratorData(escrowId)).buyerConsensus
      ).to.eq(true);
      expect(
        (await unicrowArbitratorContract.getArbitratorData(escrowId)).sellerConsensus
      ).to.eq(true);
    });

    it("should not be able to approve an arbitrator twice", async function () {
      // Buyer needs to approve escrowValue allowance to unicrowContract contract

      await crowToken.connect(buyer).approve(unicrowContract.address, escrowValueParsed);

      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        ZERO_ADDRESS,
        0
      );

      await unicrowArbitratorContract
        .connect(seller)
        .proposeArbitrator(escrowId, bob.address, 200);
      await unicrowArbitratorContract
        .connect(buyer)
        .approveArbitrator(escrowId, bob.address, 200);

      await expect(
        unicrowArbitratorContract
          .connect(buyer)
          .approveArbitrator(escrowId, bob.address, 200)
      ).to.be.revertedWith("2-003");
    });

    it("should not be able to other parties arbitrate the payment", async function () {
      // Buyer needs to approve escrowValue allowance to unicrowContract contract

      await crowToken.connect(buyer).approve(unicrowContract.address, escrowValueParsed);

      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        ZERO_ADDRESS,
        0
      );

      await unicrowDisputeContract.connect(buyer).challenge(escrowId);

      await unicrowArbitratorContract
        .connect(seller)
        .proposeArbitrator(escrowId, bob.address, 200);

      await unicrowArbitratorContract
        .connect(buyer)
        .approveArbitrator(escrowId, bob.address, 200);

      //@ts-ignore
      const newSplit = [5000, 5000] as BigNumberish;

      await expect(
        unicrowArbitratorContract.connect(buyer).arbitrate(escrowId, newSplit)
      ).to.be.revertedWith("2-005");
    });

    it("should be able to the arbitrator arbitrate the payment", async function () {
      // Buyer needs to approve escrowValue allowance to unicrowContract contract

      await crowToken.connect(buyer).approve(unicrowContract.address, escrowValueParsed);

      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        ZERO_ADDRESS,
        0
      );

      await unicrowDisputeContract.connect(buyer).challenge(escrowId);

      await unicrowArbitratorContract
        .connect(seller)
        .proposeArbitrator(escrowId, bob.address, 200);

      await unicrowArbitratorContract
        .connect(buyer)
        .approveArbitrator(escrowId, bob.address, 200);

      //@ts-ignore
      const newSplit = [5000, 5000] as BigNumberish;

      await unicrowArbitratorContract.connect(bob).arbitrate(escrowId, newSplit);

      expect((await unicrowContract.getEscrow(escrowId)).consensus).to.deep.equal([
        2, 1,
      ]);
    });

    it("should be able to calculate arbitrate split correctly", async function () {
      await crowToken.connect(buyer).approve(unicrowContract.address, escrowValueParsed);

      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        bob.address,
        100
      );

      const { split } = await unicrowContract.getEscrow(escrowId);

      const [b, s, m, c ] = split;

      const escrowFee = await unicrowContract.protocolFee();

      const expectedResult = [0, 10000 - 100 - escrowFee, 0, escrowFee, 100];

      expect(
        await unicrowArbitratorContract.arbitrationCalculation(
          //@ts-ignore
          [b, s, m, c, 100]
        )
      ).to.deep.equal(expectedResult);
    });

    it("should be able to calculate split after a 50/50 settlement", async function () {
      await crowToken.connect(buyer).approve(unicrowContract.address, escrowValueParsed);

      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        bob.address,
        100
      );

      await unicrowDisputeContract.connect(buyer).challenge(escrowId);

      const { split } = await unicrowContract.getEscrow(escrowId);

      const [b, s, m, c ] = split;

      const expectedResult = [4950, 4950, 0, 0, 100];

      expect(
        await unicrowArbitratorContract.arbitrationCalculation(
          //@ts-ignore
          [5000, 5000, 0, c, 100]
        )
      ).to.deep.equal(expectedResult);
    });

    it("should be able to have the correct after a settlement offer", async function () {
      // Buyer needs to approve escrowValue allowance to unicrowContract contract

      await crowToken.connect(buyer).approve(unicrowContract.address, escrowValueParsed);

      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        bob.address,
        1000
      );

      await unicrowDisputeContract.connect(seller).offerSettlement(escrowId, [5000, 5000]);

      expect(await unicrowDisputeContract.latestSettlementOffer(escrowId, 0)).to.eq(5000);
      expect(await unicrowDisputeContract.latestSettlementOffer(escrowId, 1)).to.eq(5000);
    });
  });
});
