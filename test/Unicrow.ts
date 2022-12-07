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
    it("should be able to get the escrow data", async function () {
      // Buyer needs to approve escrowValue allowance to unicrowContract contract
      await fakeTokenContract.connect(buyer).approve(unicrowContract.address, escrowValue);

      //@ts-ignore
      await expect(
        unicrowContract.connect(buyer).pay(
          {
            //@ts-ignore
            ...payCommon,
          },
          ZERO_ADDRESS,
          0
        )
      ).to.emit(unicrowContract, "Pay");

      expect((await unicrowContract.getEscrow(escrowId)).amount).to.eq(escrowValue);
    });

    it("should be able to get all the escrow data with erc20", async function () {
      // Buyer needs to approve escrowValue allowance to unicrowContract contract
      await fakeTokenContract.connect(buyer).approve(unicrowContract.address, escrowValue);

      //@ts-ignore
      await expect(
        unicrowContract.connect(buyer).pay(
          {
            //@ts-ignore
            ...payCommon,
          },
          ZERO_ADDRESS,
          0
        )
      ).to.emit(unicrowContract, "Pay");

      expect((await unicrowContract.getAllEscrowData(escrowId)).token.symbol).to.eq(
        "CROW"
      );
      expect((await unicrowContract.getAllEscrowData(escrowId)).token.address_).to.eq(
        fakeTokenContract.address
      );
      expect((await unicrowContract.getAllEscrowData(escrowId)).token.decimals).to.eq(18);
    });

    it("should be able to get all the escrow data with eth", async function () {
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
        )
      ).to.emit(unicrowContract, "Pay");

      expect((await unicrowContract.getAllEscrowData(escrowId)).token.symbol).to.eq("ETH");
      expect((await unicrowContract.getAllEscrowData(escrowId)).token.address_).to.eq(
        ZERO_ADDRESS
      );
      expect((await unicrowContract.getAllEscrowData(escrowId)).token.decimals).to.eq(18);
    });

    it("should be able to increment the escrowId", async function () {
      // Buyer needs to approve escrowValue allowance to unicrowContract contract
      await fakeTokenContract.connect(buyer).approve(unicrowContract.address, escrowValue);

      //@ts-ignore
      await expect(
        unicrowContract.connect(buyer).pay(
          {
            //@ts-ignore
            ...payCommon,
          },
          ZERO_ADDRESS,
          0
        )
      ).to.emit(unicrowContract, "Pay");

      expect(await unicrowContract.escrowIdCounter()).to.be.equal(1);

      await fakeTokenContract.connect(buyer).approve(unicrowContract.address, escrowValue);

      //@ts-ignore
      await expect(
        unicrowContract.connect(buyer).pay(
          {
            //@ts-ignore
            ...payCommon,
          },
          ZERO_ADDRESS,
          0
        )
      ).to.emit(unicrowContract, "Pay");

      expect(await unicrowContract.escrowIdCounter()).to.be.equal(2);

      expect((await unicrowContract.getEscrow(escrowId)).amount).to.eq(escrowValue);
    });

    it("should be able buyer deposits ERC20 into unicrowContract", async function () {
      // Buyer needs to approve escrowValue allowance to unicrowContract contract
      await fakeTokenContract.connect(buyer).approve(unicrowContract.address, escrowValue);

      //@ts-ignore
      await expect(
        unicrowContract.connect(buyer).pay(
          {
            //@ts-ignore
            ...payCommon,
          },
          ZERO_ADDRESS,
          0
        )
      ).to.emit(unicrowContract, "Pay");

      expect((await unicrowContract.getEscrow(escrowId)).amount).to.eq(escrowValue);
    });

    it("should not be able buyer deposits ERC20 into unicrowContract", async function () {
      // Buyer needs to approve escrowValue allowance to unicrowContract contract
      await fakeTokenContract.connect(buyer).approve(unicrowContract.address, escrowValue);

      //@ts-ignore
      await expect(
        unicrowContract.connect(buyer).pay(
          {
            //@ts-ignore
            ...payCommon,
            marketplaceFee: 100
          },
          ZERO_ADDRESS,
          0
        )
      ).to.be.revertedWith("0-009");
    });

    it("should be able buyer deposits ETH payment to unicrowContract", async function () {
      await expect(
        unicrowContract.connect(buyer).pay(
          {
            //@ts-ignore
            ...payEther,
          },
          ZERO_ADDRESS,
          0,
          {
            value: escrowValueEth,
          }
        )
      ).to.emit(unicrowContract, "Pay");

      expect((await unicrowContract.getEscrow(escrowId)).amount).to.eq(escrowValueEth);
    });

    it("should not be able buyer deposits ETH with wrong currency", async function () {
      await expect(
        unicrowContract.connect(buyer).pay(
          {
            //@ts-ignore
            ...payCommon,
          },
          ZERO_ADDRESS,
          0,
          {
            value: escrowValueEth,
          }
        )
      ).to.be.revertedWith("0-010")
    });

    it("should not be able to payment amount be equal 0", async function () {
      await expect(
        unicrowContract.connect(buyer).pay(
          {
            //@ts-ignore
            ...payCommon,
            amount: 0
          },
          ZERO_ADDRESS,
          0,
          {
            value: escrowValueEth,
          }
        )
      ).to.be.revertedWith("0-011")
    });
  });

  context("When refund happens", function () {
    it("should be able to seller refund with erc20", async function () {
      await fakeTokenContract.connect(buyer).approve(unicrowContract.address, escrowValue);

      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        ZERO_ADDRESS,
        0
      );

      const refundSplit = [10000, 0, 0, 0];

      await expect(unicrowContract.connect(seller).refund(escrowId)).to.emit(
        unicrowContract,
        "Refund"
      );
      expect((await unicrowContract.getEscrow(escrowId)).split).to.deep.eq(refundSplit);
    });

    it("should be able to seller refund", async function () {
      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payEther,
        },
        ZERO_ADDRESS,
        0,
        { value: escrowValueEth }
      );

      const refundSplit = [10000, 0, 0, 0];

      await expect(unicrowContract.connect(seller).refund(escrowId)).to.emit(
        unicrowContract,
        "Refund"
      );
      expect((await unicrowContract.getEscrow(escrowId)).split).to.deep.eq(refundSplit);
    });

    it("should be able to seller refund after a challenge", async function () {
      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payEther,
        },
        ZERO_ADDRESS,
        0,
        { value: escrowValueEth }
      );

      await unicrowDisputeContract.connect(buyer).challenge(escrowId);

      await network.provider.send("evm_increaseTime", [600]);
      await network.provider.send("evm_mine");

      const refundSplit = [10000, 0, 0, 0];

      await expect(unicrowContract.connect(seller).refund(escrowId)).to.emit(
        unicrowContract,
        "Refund"
      );
      expect((await unicrowContract.getEscrow(escrowId)).split).to.deep.eq(refundSplit);
    });
  });

  context("When challenge happens", function () {
    it("should not be able to challenge if you arent seller or buyer", async function () {
      await fakeTokenContract.connect(buyer).approve(unicrowContract.address, escrowValue);

      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        ZERO_ADDRESS,
        0
      );

      await expect(
        unicrowDisputeContract.connect(owner).challenge(escrowId)
      ).to.be.revertedWith("1-009");
    });


    it("should not be able to challenge sequencelly before challenge period starts", async function () {
      await fakeTokenContract.connect(buyer).approve(unicrowContract.address, escrowValue);

      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        ZERO_ADDRESS,
        0
      );

      await unicrowDisputeContract.connect(buyer).challenge(escrowId);

      await expect(
        unicrowDisputeContract.connect(buyer).challenge(escrowId)
      ).to.be.revertedWith("1-019");
    });

    it("should not be able to challenge sequencelly after challenge period starts", async function () {
      await fakeTokenContract.connect(buyer).approve(unicrowContract.address, escrowValue);

      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        ZERO_ADDRESS,
        0
      );

      await unicrowDisputeContract.connect(buyer).challenge(escrowId);

      await network.provider.send("evm_increaseTime", [400]);
      await network.provider.send("evm_mine");

      await expect(
        unicrowDisputeContract.connect(buyer).challenge(escrowId)
      ).to.be.revertedWith("1-014");
    });

    it("should not be able seller challenge at first time", async function () {
      await fakeTokenContract.connect(buyer).approve(unicrowContract.address, escrowValue);

      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        ZERO_ADDRESS,
        0
      );

      await expect(
        unicrowDisputeContract.connect(seller).challenge(escrowId)
      ).to.be.revertedWith("1-015");
    });

    it("should not be able to challenge after challenge period", async function () {
      await fakeTokenContract.connect(buyer).approve(unicrowContract.address, escrowValue);

      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        ZERO_ADDRESS,
        0
      );

      await network.provider.send("evm_increaseTime", [400]);
      await network.provider.send("evm_mine");

      await expect(
        unicrowDisputeContract.connect(seller).challenge(escrowId)
      ).to.be.revertedWith("1-016");
    });

    it("should be able to challenge", async function () {
      await fakeTokenContract.connect(buyer).approve(unicrowContract.address, escrowValue);

      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        ZERO_ADDRESS,
        0
      );

      const consensus = [1, -1];

      const escrowFee = await unicrowContract.protocolFee();
      const split = [10000, 0, 0, escrowFee];

      await expect(unicrowDisputeContract.connect(buyer).challenge(escrowId)).to.emit(
        unicrowDisputeContract,
        "Challenge"
      );
      expect((await unicrowContract.getEscrow(escrowId)).consensus).to.deep.eq(consensus);
      expect((await unicrowContract.getEscrow(escrowId)).split).to.deep.eq(split);
    });

    it("should be able to re-challenge", async function () {
      // Buyer needs to approve escrowValue allowance to unicrowContract contract
      await fakeTokenContract.connect(buyer).approve(unicrowContract.address, escrowValue);

      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
          challengePeriod: 60 * 60 * 24 * 7,
        },
        ZERO_ADDRESS,
        0
      );

      const tx = await unicrowDisputeContract.connect(buyer).challenge(escrowId);
      await tx.wait();

      await network.provider.send("evm_increaseTime", [60 * 60 * 24 * 10]);
      await network.provider.send("evm_mine");

      await unicrowDisputeContract.connect(seller).challenge(escrowId);

      const consensus = [2, -2];

      const escrowFee = await unicrowContract.protocolFee();
      const split = [10000, 0, 0, escrowFee];

      await network.provider.send("evm_increaseTime", [60 * 60 * 24 * 10]);
      await network.provider.send("evm_mine");

      await expect(unicrowDisputeContract.connect(buyer).challenge(escrowId)).to.emit(
        unicrowDisputeContract,
        "Challenge"
      );

      expect((await unicrowContract.getEscrow(escrowId)).consensus).to.deep.eq(consensus);
      expect((await unicrowContract.getEscrow(escrowId)).split).to.deep.eq(split);
    });

    it("should not be able to re-challenge before start period", async function () {
      // Buyer needs to approve escrowValue allowance to unicrowContract contract
      await fakeTokenContract.connect(buyer).approve(unicrowContract.address, escrowValue);
      // Listen for Deposit event for a successful funded unicrowContract
      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
          challengePeriod: 100000,
        },
        ZERO_ADDRESS,
        0
      );

      await unicrowDisputeContract.connect(buyer).challenge(escrowId);

      await expect(
        unicrowDisputeContract.connect(seller).challenge(escrowId)
      ).to.be.revertedWith("1-019");
    });
  });

  context("When settlement happens", function () {
    it("should not be able to settlement if you arent seller or buyer", async function () {
      await fakeTokenContract.connect(buyer).approve(unicrowContract.address, escrowValue);

      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        ZERO_ADDRESS,
        0
      );

      await unicrowDisputeContract.connect(buyer).challenge(escrowId);

      await expect(
        unicrowDisputeContract.connect(owner).offerSettlement(escrowId, [5000, 5000])
      ).to.be.revertedWith("1-009");
    });

    it("should be able to settlement", async function () {
      await fakeTokenContract.connect(buyer).approve(unicrowContract.address, escrowValue);

      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        ZERO_ADDRESS,
        0
      );

      const newSplit = [5000, 5000];
      const consensus = [1, -1];

      //@ts-ignore
      await expect(
        unicrowDisputeContract.connect(seller).offerSettlement(escrowId, [5000, 5000])
      ).to.emit(unicrowDisputeContract, "SettlementOffer");

      expect(
        await (
          await unicrowDisputeContract.getSettlementDetails(escrowId)
        ).latestSettlementOffer
      ).to.deep.eq([newSplit[0], newSplit[1]]);
      expect(
        await (
          await unicrowDisputeContract.getSettlementDetails(escrowId)
        ).latestSettlementOfferBy
      ).to.deep.eq(seller.address);
    });

    it("should not be able to approve settlement without offer", async function () {
      await fakeTokenContract.connect(buyer).approve(unicrowContract.address, escrowValue);

      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        ZERO_ADDRESS,
        0
      );

      await expect(
        unicrowDisputeContract.connect(seller).approveSettlement(escrowId, [5000, 5000])
      ).to.be.revertedWith("1-017");
    });

    it("should not be able to settlement after approve", async function () {
      await fakeTokenContract.connect(buyer).approve(unicrowContract.address, escrowValue);

      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        ZERO_ADDRESS,
        0
      );

      const newSplit = [5000, 5000];
      const consensus = [1, -1];

      //@ts-ignore
      await expect(
        unicrowDisputeContract.connect(seller).offerSettlement(escrowId, [5000, 5000])
      ).to.emit(unicrowDisputeContract, "SettlementOffer");

      await unicrowDisputeContract
        .connect(buyer)
        .approveSettlement(escrowId, [5000, 5000]);

      await expect(
        unicrowDisputeContract.connect(seller).offerSettlement(escrowId, [5000, 5000])
      ).to.be.revertedWith("1-005");
    });

    it("should not be able to get dispute without settlement", async function () {
      await fakeTokenContract.connect(buyer).approve(unicrowContract.address, escrowValue);

      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        ZERO_ADDRESS,
        0
      );

      await expect(
        (
          await unicrowDisputeContract.getSettlementDetails(escrowId)
        ).latestSettlementOfferBy
      ).to.be.equal(ZERO_ADDRESS);
    });

    it("should be able to settlement first", async function () {
      await fakeTokenContract.connect(buyer).approve(unicrowContract.address, escrowValue);

      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        ZERO_ADDRESS,
        0
      );

      const newSplit = [5000, 5000];
      const consensus = [1, -1];

      //@ts-ignore
      await unicrowDisputeContract.connect(buyer).challenge(escrowId);

      //@ts-ignore
      await expect(
        unicrowDisputeContract.connect(seller).offerSettlement(escrowId, [5000, 5000])
      ).to.emit(unicrowDisputeContract, "SettlementOffer");

      expect((await unicrowContract.getEscrow(escrowId)).consensus).to.deep.eq(consensus);

      expect(
        (await unicrowDisputeContract.getSettlementDetails(escrowId)).latestSettlementOffer
      ).to.deep.eq([newSplit[0], newSplit[1]]);
      expect(
        (await unicrowDisputeContract.getSettlementDetails(escrowId))
          .latestSettlementOfferBy
      ).to.deep.eq(seller.address);
    });

    it("should be able to get settlement data", async function () {
      await fakeTokenContract.connect(buyer).approve(unicrowContract.address, escrowValue);

      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        ZERO_ADDRESS,
        0
      );

      const newSplit = [5000, 5000];
      const consensus = [1, -1];

      //@ts-ignore
      await unicrowDisputeContract.connect(buyer).challenge(escrowId);

      //@ts-ignore
      await expect(
        unicrowDisputeContract.connect(seller).offerSettlement(escrowId, [5000, 5000])
      ).to.emit(unicrowDisputeContract, "SettlementOffer");

      expect((await unicrowContract.getEscrow(escrowId)).consensus).to.deep.eq(consensus);

      expect(
        (await unicrowDisputeContract.getSettlementDetails(escrowId)).latestSettlementOffer
      ).to.deep.eq([newSplit[0], newSplit[1]]);
      expect(
        (await unicrowDisputeContract.getSettlementDetails(escrowId))
          .latestSettlementOfferBy
      ).to.deep.eq(seller.address);
    });

    it("should be able to change consensus offer", async function () {
      await fakeTokenContract.connect(buyer).approve(unicrowContract.address, escrowValue);

      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        bob.address,
        0
      );

      const consensus = [1, -1];

      await unicrowDisputeContract.connect(buyer).challenge(escrowId);

      //@ts-ignore
      await expect(
        unicrowDisputeContract.connect(seller).offerSettlement(escrowId, [5000, 5000])
      ).to.emit(unicrowDisputeContract, "SettlementOffer");

      expect((await unicrowContract.getEscrow(escrowId)).consensus).to.deep.eq(consensus);
    });

    it("should not be able to settlement exceed the split limit", async function () {
      await fakeTokenContract.connect(buyer).approve(unicrowContract.address, escrowValue);

      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        ZERO_ADDRESS,
        0
      );

      await unicrowDisputeContract.connect(buyer).challenge(escrowId);

      await expect(
        unicrowDisputeContract.connect(seller).offerSettlement(escrowId, [5000, 5005])
      ).to.be.revertedWith("1-007");
    });
  });

  context("When release happens", function () {
    it("should not be able to release if you arent buyer", async function () {
      await fakeTokenContract.connect(buyer).approve(unicrowContract.address, escrowValue);

      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        ZERO_ADDRESS,
        0
      );

      await expect(unicrowContract.connect(owner).release(escrowId)).to.be.revertedWith(
        "1-025"
      );
    });

    it("should be able to buyer releases the payment", async function () {
      await fakeTokenContract.connect(buyer).approve(unicrowContract.address, escrowValue);

      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        ZERO_ADDRESS,
        0
      );

      const consensus = [1, 1];

      await expect(unicrowContract.connect(buyer).release(escrowId)).to.emit(
        unicrowContract,
        "Release"
      );

      expect((await unicrowContract.getEscrow(escrowId)).consensus).to.deep.eq(consensus);
    });

    it("should not be able to seller releases the payment", async function () {
      await fakeTokenContract.connect(buyer).approve(unicrowContract.address, escrowValue);

      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        ZERO_ADDRESS,
        0
      );

      await unicrowDisputeContract.connect(buyer).challenge(escrowId);

      const consensus = [1, 1];

      await expect(unicrowContract.connect(seller).release(escrowId)).to.be.revertedWith(
        "1-025"
      );
    });

    it("should not be able to buyer releases the payment after claim", async function () {
      await fakeTokenContract.connect(buyer).approve(unicrowContract.address, escrowValue);

      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        ZERO_ADDRESS,
        0
      );

      await unicrowContract.connect(buyer).release(escrowId);

      await expect(unicrowContract.connect(buyer).release(escrowId)).to.be.revertedWith(
        "0-005"
      );
    });
  });
});
