import chai, { expect } from "chai";

import { ethers, network } from "hardhat";
import { solidity } from "ethereum-waffle";

//@ts-ignore
import { constants } from "@openzeppelin/test-helpers";

import { Unicrow } from "../types/Unicrow";
import { UnicrowClaim } from "../types/UnicrowClaim";
import { UnicrowDispute } from "../types/UnicrowDispute";
import { UnicrowArbitrator } from "../types/UnicrowArbitrator";
import { FakeToken } from "../types/FakeToken";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { setup } from "./helpers/deploy";

chai.use(solidity);


describe("UnicrowClaim", function () {
  let unicrowContract: Unicrow;
  let unicrowClaimContract: UnicrowClaim;
  let unicrowDisputeContract: UnicrowDispute;
  let unicrowArbitratorContract: UnicrowArbitrator;
  let crowToken: FakeToken;

  let owner: SignerWithAddress;
  let buyer: SignerWithAddress;
  let bob: SignerWithAddress;
  let seller: SignerWithAddress;
  let marketplace: SignerWithAddress;
  let treasury: SignerWithAddress;

  let payCommon: any;
  let payEther: any;

  const { ZERO_ADDRESS } = constants;

  const escrowValue = ethers.utils.parseUnits("100", 18);

  const escrowValueEth = ethers.utils.parseUnits("100", 18);

  const escrowId = 0;
  const secondEscrowId = String(ethers.utils.id("an escrow account2"));

  beforeEach(async () => {
    // Get the list of accounts
    [owner, buyer, seller, bob, marketplace, treasury] = await ethers.getSigners();
    
    const {
      unicrow,
      unicrowDispute,
      unicrowArbitrator,
      unicrowClaim,
      token,
    } = await setup();

    unicrowContract = unicrow;
    unicrowClaimContract = unicrowClaim;
    unicrowDisputeContract = unicrowDispute;
    unicrowArbitratorContract = unicrowArbitrator;
    crowToken = token;

    await crowToken.transfer(
      buyer.address,
      ethers.utils.parseUnits("100000", 18)
    );
    await crowToken.transfer(
      seller.address,
      ethers.utils.parseUnits("100", 18)
    );
    
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


  context("When claim happens", function () {
    it("should be able to claim using singleClaim", async function () {
      await crowToken.connect(buyer).approve(unicrowContract.address, escrowValue);
      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        ZERO_ADDRESS,
        0
      );

      await network.provider.send("evm_increaseTime", [600]);
      await network.provider.send("evm_mine");

      await expect(() =>
        unicrowClaimContract.connect(seller).singleClaim(escrowId)
      ).to.changeTokenBalances(
        crowToken,
        [buyer, seller, treasury],
        [
          ethers.utils.parseUnits("0", 18),
          ethers.utils.parseUnits("100", 18),
          ethers.utils.parseUnits("0", 18),
        ]
      );
    });

    it("should emit the right amounts using singleClaim", async function () {
      await crowToken.connect(buyer).approve(unicrowContract.address, escrowValue);
      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
          marketplace: bob.address,
          marketplaceFee: 1000,
        },
        ZERO_ADDRESS,
        0
      );

      await unicrowDisputeContract.connect(buyer).offerSettlement(escrowId, [5000, 5000]);

      const tx = await unicrowDisputeContract
        .connect(seller)
        .approveSettlement(escrowId, [5000, 5000]);
      const txn = await tx.wait();

      const event = txn?.events?.find((e) => e.event == "ApproveOffer");

      expect(
        event?.args?.amounts.map((a: string) => ethers.utils.formatUnits(a, 18))
      ).to.deep.equal(["50.0", "45.0", "5.0", "0.0", "0.0"]);
    });

    it("should be able to claim approving settlement", async function () {
      await crowToken.connect(buyer).approve(unicrowContract.address, escrowValue);
      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        bob.address,
        1000
      );

      await unicrowDisputeContract.connect(seller).offerSettlement(escrowId, [5000, 5000]);

      await expect(() =>
        unicrowDisputeContract.connect(buyer).approveSettlement(escrowId, [5000, 5000])
      ).to.changeTokenBalances(
        crowToken,
        [buyer, seller, bob, treasury],
        [
          ethers.utils.parseUnits("50", 18),
          ethers.utils.parseUnits("45", 18),
          ethers.utils.parseUnits("5", 18),
          ethers.utils.parseUnits("0", 18),
        ]
      );
    });

    it("should be able to claim with release", async function () {
      await crowToken.connect(buyer).approve(unicrowContract.address, escrowValue);
      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        ZERO_ADDRESS,
        0
      );

      await expect(() =>
        unicrowContract.connect(buyer).release(escrowId)
      ).to.changeTokenBalances(
        crowToken,
        [buyer, seller, treasury],
        [
          ethers.utils.parseUnits("0", 18),
          ethers.utils.parseUnits("100", 18),
          ethers.utils.parseUnits("0", 18),
        ]
      );
    });

    it("should not be able to claim after a release", async function () {
      await crowToken.connect(buyer).approve(unicrowContract.address, escrowValue);
      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        ZERO_ADDRESS,
        0
      );

      await network.provider.send("evm_increaseTime", [600]);
      await network.provider.send("evm_mine");

      await unicrowClaimContract.connect(seller).claim([escrowId]);

      await expect(unicrowContract.connect(buyer).release(escrowId)).to.to.be.revertedWith(
        "0-005"
      );
    });

    it("should be able to buyer claim 100% after a challenge and", async function () {
      await crowToken.connect(buyer).approve(unicrowContract.address, escrowValue);
      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        bob.address,
        1000
      );

      await unicrowDisputeContract.connect(buyer).challenge(escrowId);

      await network.provider.send("evm_increaseTime", [600]);
      await network.provider.send("evm_mine");

      await expect(() =>
        unicrowClaimContract.connect(seller).claim([escrowId])
      ).to.changeTokenBalances(
        crowToken,
        [buyer, seller, bob],
        [ethers.utils.parseUnits("100", 18), 0, 0]
      );
    });

    it("should not be able to claim after arbitrate", async function () {
      await crowToken.connect(buyer).approve(unicrowContract.address, escrowValue);
      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        bob.address,
        1000
      );

      await unicrowDisputeContract.connect(buyer).challenge(escrowId);

      await network.provider.send("evm_increaseTime", [300]);
      await network.provider.send("evm_mine");

      await expect(() =>
        unicrowArbitratorContract.connect(bob).arbitrate(escrowId, [5000, 5000])
      ).to.changeTokenBalances(
        crowToken,
        [buyer, seller, bob, treasury],
        [
          ethers.utils.parseUnits("45", 18),
          ethers.utils.parseUnits("45", 18),
          ethers.utils.parseUnits("10", 18),
          ethers.utils.parseUnits("0", 18),
        ]
      );

      await expect(
        unicrowClaimContract.connect(buyer).singleClaim(escrowId)
      ).to.be.revertedWith("0-005");
    });

    it("should be able to arbitrate claim", async function () {
      await crowToken.connect(buyer).approve(unicrowContract.address, escrowValue);
      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        bob.address,
        1000
      );

      await unicrowDisputeContract.connect(buyer).challenge(escrowId);

      await network.provider.send("evm_increaseTime", [300]);
      await network.provider.send("evm_mine");

      await expect(() =>
        unicrowArbitratorContract.connect(bob).arbitrate(escrowId, [5000, 5000])
      ).to.changeTokenBalances(
        crowToken,
        [buyer, seller, bob, treasury],
        [
          ethers.utils.parseUnits("45", 18),
          ethers.utils.parseUnits("45", 18),
          ethers.utils.parseUnits("10", 18),
          ethers.utils.parseUnits("0", 18),
        ]
      );
    });

    it("should be able to get event claim", async function () {
      await crowToken.connect(buyer).approve(unicrowContract.address, escrowValue);
      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        ZERO_ADDRESS,
        0
      );

      await network.provider.send("evm_increaseTime", [300]);
      await network.provider.send("evm_mine");

      await expect(unicrowClaimContract.connect(seller).claim([escrowId])).to.emit(
        unicrowClaimContract,
        "Claim"
      );
    });

    it("should be able to claim with seller split", async function () {
      await crowToken.connect(buyer).approve(unicrowContract.address, escrowValue);
      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        ZERO_ADDRESS,
        0
      );

      await network.provider.send("evm_increaseTime", [300]);
      await network.provider.send("evm_mine");

      await expect(() =>
        unicrowClaimContract.connect(seller).claim([escrowId])
      ).to.changeTokenBalance(
        crowToken,
        seller,
        ethers.utils.parseUnits("100", 18)
      );
    });

    it("should not be able to claim twice", async function () {
      await crowToken.connect(buyer).approve(unicrowContract.address, escrowValue);
      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        ZERO_ADDRESS,
        0
      );

      await network.provider.send("evm_increaseTime", [300]);
      await network.provider.send("evm_mine");

      await unicrowClaimContract.connect(seller).claim([escrowId]);

      await expect(
        unicrowClaimContract.connect(seller).claim([escrowId])
      ).to.be.revertedWith("0-005");
    });

    it("should be able to claim marketplace fee", async function () {
      await crowToken.connect(buyer).approve(unicrowContract.address, escrowValue);
      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
          marketplaceFee: 200,
          marketplace: marketplace.address,
        },
        ZERO_ADDRESS,
        0
      );

      await network.provider.send("evm_increaseTime", [300]);
      await network.provider.send("evm_mine");

      await expect(() =>
        unicrowClaimContract.connect(seller).claim([escrowId])
      ).to.changeTokenBalance(
        crowToken,
        marketplace,
        ethers.utils.parseUnits("2", 18)
      );
    });

    it("should be able to claim ETH", async function () {
      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payEther,
        },
        ZERO_ADDRESS,
        0,
        { value: escrowValueEth }
      );

      await network.provider.send("evm_increaseTime", [300]);
      await network.provider.send("evm_mine");

      await expect(() =>
        unicrowClaimContract.connect(seller).claim([escrowId])
      ).to.changeEtherBalance(seller, ethers.utils.parseUnits("100", 18));
    });

    it("should be able to claim two escrows", async function () {
      await crowToken.connect(buyer).approve(unicrowContract.address, escrowValue);
      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        ZERO_ADDRESS,
        0
      );

      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payEther,
        },
        ZERO_ADDRESS,
        0,
        { value: escrowValueEth }
      );

      await network.provider.send("evm_increaseTime", [300]);
      await network.provider.send("evm_mine");

      await expect(() =>
        unicrowClaimContract.connect(seller).claim([escrowId, secondEscrowId])
      ).to.changeTokenBalance(
        crowToken,
        seller,
        ethers.utils.parseUnits("100", 18)
      );
    });

    it("should not be able to claim to claim before expires time without manually release", async function () {
      await crowToken.connect(buyer).approve(unicrowContract.address, escrowValue);
      await unicrowContract.connect(buyer).pay(
        {
          //@ts-ignore
          ...payCommon,
        },
        ZERO_ADDRESS,
        0
      );

      await expect(
        unicrowClaimContract.connect(seller).claim([escrowId])
      ).to.be.revertedWith("0-006");
    });
  });
});
