import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("Unicrow ERC20 Interaction Test", function() {
  let testToken: Contract;
  let unicrow: Contract;
  let unicrowClaim: Contract;
  let unicrowArbitrator: Contract;
  let unicrowDispute: Contract;
  let testInteraction: Contract;
  let owner: SignerWithAddress, buyer: SignerWithAddress, seller: SignerWithAddress, 
      marketplace: SignerWithAddress, arbitrator: SignerWithAddress, protocolFeeAddress: SignerWithAddress;
  
  const TOKEN_INITIAL_SUPPLY = ethers.utils.parseUnits("1000", 18); // 1000 tokens
  const TEST_AMOUNT = ethers.utils.parseUnits("10", 18); // 10 tokens for testing
  const CHALLENGE_PERIOD = 60 * 60 * 24; // 1 day in seconds
  const MARKETPLACE_FEE = 100; // 1% (in basis points)
  const ARBITRATOR_FEE = 200; // 2% (in basis points)
  const PROTOCOL_FEE = 50; // 0.5% fee (in basis points)
  
  beforeEach(async function() {
    try {
      console.log("Setting up test environment...");
      
      // Get signers
      [owner, buyer, seller, marketplace, arbitrator, protocolFeeAddress] = await ethers.getSigners();
      console.log("Owner address:", owner.address);
      console.log("Buyer address:", buyer.address);
      
      // Deploy test token
      console.log("Deploying TestToken...");
      const TestToken = await ethers.getContractFactory("TestToken");
      testToken = await TestToken.deploy(TOKEN_INITIAL_SUPPLY);
      await testToken.deployed();
      console.log("TestToken deployed at:", testToken.address);
      
      // Need to deploy in a specific order due to circular dependencies
      
      // First step: deploy all contracts without initialization
      console.log("Deploying UnicrowClaim without initialization...");
      const UnicrowClaim = await ethers.getContractFactory("UnicrowClaim");
      
      console.log("Deploying UnicrowArbitrator without initialization...");
      const UnicrowArbitrator = await ethers.getContractFactory("UnicrowArbitrator");
      
      console.log("Deploying UnicrowDispute without initialization...");
      const UnicrowDispute = await ethers.getContractFactory("UnicrowDispute");
      
      console.log("Deploying Unicrow...");
      const Unicrow = await ethers.getContractFactory("Unicrow");
      
      // First deploy Unicrow
      unicrow = await Unicrow.deploy(
        ethers.constants.AddressZero, // Temporarily use zero address for unicrowClaim
        ethers.constants.AddressZero, // Temporarily use zero address for unicrowArbitrator
        ethers.constants.AddressZero, // Temporarily use zero address for unicrowDispute
        owner.address, // governance address
        PROTOCOL_FEE
      );
      await unicrow.deployed();
      console.log("Unicrow deployed at:", unicrow.address);
      
      // Then deploy UnicrowClaim with Unicrow address
      unicrowClaim = await UnicrowClaim.deploy(
        unicrow.address,
        ethers.constants.AddressZero, // Temporarily use zero address for unicrowArbitrator
        protocolFeeAddress.address
      );
      await unicrowClaim.deployed();
      console.log("UnicrowClaim deployed at:", unicrowClaim.address);
      
      // Deploy UnicrowArbitrator with addresses
      unicrowArbitrator = await UnicrowArbitrator.deploy(
        unicrow.address,
        unicrowClaim.address
      );
      await unicrowArbitrator.deployed();
      console.log("UnicrowArbitrator deployed at:", unicrowArbitrator.address);
      
      // Deploy UnicrowDispute with addresses
      unicrowDispute = await UnicrowDispute.deploy(
        unicrow.address,
        unicrowClaim.address,
        unicrowArbitrator.address
      );
      await unicrowDispute.deployed();
      console.log("UnicrowDispute deployed at:", unicrowDispute.address);
      
      // Now we need to update the addresses in Unicrow
      const unicrowFactory = await ethers.getContractFactory("Unicrow");
      
      // Deploy a new Unicrow with the correct addresses
      unicrow = await unicrowFactory.deploy(
        unicrowClaim.address,
        unicrowArbitrator.address,
        unicrowDispute.address,
        owner.address, // governance address
        PROTOCOL_FEE
      );
      await unicrow.deployed();
      console.log("Re-deployed Unicrow with correct addresses at:", unicrow.address);
      
      // Now need to redeploy the other contracts with the new Unicrow address
      const unicrowClaimFactory = await ethers.getContractFactory("UnicrowClaim");
      unicrowClaim = await unicrowClaimFactory.deploy(
        unicrow.address,
        unicrowArbitrator.address,
        protocolFeeAddress.address
      );
      await unicrowClaim.deployed();
      console.log("Re-deployed UnicrowClaim with correct addresses at:", unicrowClaim.address);
      
      const unicrowArbitratorFactory = await ethers.getContractFactory("UnicrowArbitrator");
      unicrowArbitrator = await unicrowArbitratorFactory.deploy(
        unicrow.address,
        unicrowClaim.address
      );
      await unicrowArbitrator.deployed();
      console.log("Re-deployed UnicrowArbitrator with correct addresses at:", unicrowArbitrator.address);
      
      const unicrowDisputeFactory = await ethers.getContractFactory("UnicrowDispute");
      unicrowDispute = await unicrowDisputeFactory.deploy(
        unicrow.address,
        unicrowClaim.address,
        unicrowArbitrator.address
      );
      await unicrowDispute.deployed();
      console.log("Re-deployed UnicrowDispute with correct addresses at:", unicrowDispute.address);
      
      // One final deployment of Unicrow with the correct addresses
      unicrow = await unicrowFactory.deploy(
        unicrowClaim.address,
        unicrowArbitrator.address,
        unicrowDispute.address,
        owner.address, // governance address
        PROTOCOL_FEE
      );
      await unicrow.deployed();
      console.log("Final deployment of Unicrow at:", unicrow.address);
      
      // Deploy test interaction contract
      console.log("Deploying TestUnicrowInteraction...");
      const TestUnicrowInteraction = await ethers.getContractFactory("TestUnicrowInteraction");
      testInteraction = await TestUnicrowInteraction.deploy(unicrow.address);
      await testInteraction.deployed();
      console.log("TestUnicrowInteraction deployed at:", testInteraction.address);
      
      // Fund buyer with test tokens
      console.log("Funding buyer with tokens...");
      const transferTx = await testToken.transfer(buyer.address, TEST_AMOUNT.mul(3)); // Fund with more tokens for all tests
      await transferTx.wait();
      
      // Check buyer's balance to ensure they received the tokens
      const buyerBalance = await testToken.balanceOf(buyer.address);
      console.log("Buyer's balance after funding:", buyerBalance.toString());
      expect(buyerBalance).to.equal(TEST_AMOUNT.mul(3));
      
      // Only need to approve the TestUnicrowInteraction contract now
      console.log("Approving token spend for TestUnicrowInteraction contract:", testInteraction.address);
      const approveInteractionTx = await testToken.connect(buyer).approve(testInteraction.address, TEST_AMOUNT.mul(3));
      await approveInteractionTx.wait();
      
      // Verify the approval was set correctly
      const interactionAllowance = await testToken.allowance(buyer.address, testInteraction.address);
      console.log("Allowance for TestUnicrowInteraction contract:", interactionAllowance.toString());
      expect(interactionAllowance).to.equal(TEST_AMOUNT.mul(3));
      
      console.log("Setup complete, ready to run tests");
    } catch (error) {
      console.error("Error in beforeEach:", error);
      throw error;
    }
  });
  
  it("should successfully create an escrow payment with ERC20 tokens using address(this) as sender", async function() {
    try {
      console.log("Starting test for address(this) as sender...");
      
      const buyerInitialBalance = await testToken.balanceOf(buyer.address);
      console.log("Buyer initial balance:", buyerInitialBalance.toString());
      
      const contractInitialBalance = await testToken.balanceOf(unicrow.address);
      console.log("Contract initial balance:", contractInitialBalance.toString());
      
      // Check allowance once more before transaction
      const interactionAllowanceBefore = await testToken.allowance(buyer.address, testInteraction.address);
      console.log("Allowance for TestUnicrowInteraction before transaction:", interactionAllowanceBefore.toString());
      
      const paymentParams = {
        buyer: buyer.address,
        seller: seller.address,
        currency: testToken.address,
        amount: TEST_AMOUNT,
        marketplace: marketplace.address,
        marketplaceFee: MARKETPLACE_FEE,
        challengePeriod: CHALLENGE_PERIOD,
        challengeExtension: 0,
        paymentReference: "test-payment-ref-address-this",
        arbitrator: ethers.constants.AddressZero,
        arbitratorFee: 0,
        sender: testInteraction.address // Use the test contract as the sender
      };
      
      console.log("Calling testPayWithERC20 with params:", {
        buyer: paymentParams.buyer,
        seller: paymentParams.seller,
        currency: paymentParams.currency,
        amount: paymentParams.amount.toString(),
        sender: paymentParams.sender
      });
      
      // Call the function that will initiate the token transfer
      const tx = await testInteraction.connect(buyer).testPayWithERC20(paymentParams);
      console.log("Transaction hash:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("Transaction mined. Events:", receipt.events?.length);
      
      // Get the escrow ID directly from the counter
      const escrowId = (await unicrow.escrowIdCounter()).sub(1);
      console.log("Escrow ID:", escrowId.toString());
      
      const buyerFinalBalance = await testToken.balanceOf(buyer.address);
      console.log("Buyer final balance:", buyerFinalBalance.toString());
      
      expect(buyerFinalBalance).to.equal(buyerInitialBalance.sub(TEST_AMOUNT));
      console.log("✅ Buyer balance decreased by the correct amount");
      
      const contractFinalBalance = await testToken.balanceOf(unicrow.address);
      console.log("Contract final balance:", contractFinalBalance.toString());
      
      expect(contractFinalBalance).to.equal(contractInitialBalance.add(TEST_AMOUNT));
      console.log("✅ Contract balance increased by the correct amount");
      
      // Get the escrow data
      const escrow = await unicrow.getEscrow(escrowId);
      console.log("Escrow data:", {
        buyer: escrow.buyer,
        seller: escrow.seller,
        currency: escrow.currency,
        amount: escrow.amount.toString()
      });
      
      expect(escrow.buyer).to.equal(buyer.address);
      expect(escrow.seller).to.equal(seller.address);
      expect(escrow.currency).to.equal(testToken.address);
      expect(escrow.amount).to.equal(TEST_AMOUNT);
      
      console.log("✅ Escrow was created with the correct parameters");
    } catch (error) {
      console.error("Error during test:", error);
      throw error;
    }
  });
  
  it("should successfully create an escrow payment with ERC20 tokens using zero address as sender", async function() {
    try {
      console.log("Starting test for zero address as sender...");
      
      const buyerInitialBalance = await testToken.balanceOf(buyer.address);
      console.log("Buyer initial balance:", buyerInitialBalance.toString());
      
      const contractInitialBalance = await testToken.balanceOf(unicrow.address);
      console.log("Contract initial balance:", contractInitialBalance.toString());
      
      const paymentParams = {
        buyer: buyer.address,
        seller: seller.address,
        currency: testToken.address,
        amount: TEST_AMOUNT,
        marketplace: marketplace.address,
        marketplaceFee: MARKETPLACE_FEE,
        challengePeriod: CHALLENGE_PERIOD,
        challengeExtension: 0,
        paymentReference: "test-payment-ref-zero-address",
        arbitrator: ethers.constants.AddressZero,
        arbitratorFee: 0,
        sender: ethers.constants.AddressZero // Use zero address as the sender
      };
      
      console.log("Calling testPayWithERC20 with params:", {
        buyer: paymentParams.buyer,
        seller: paymentParams.seller,
        currency: paymentParams.currency,
        amount: paymentParams.amount.toString(),
        sender: paymentParams.sender
      });
      
      // Call the function
      const tx = await testInteraction.connect(buyer).testPayWithERC20(paymentParams);
      console.log("Transaction hash:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("Transaction mined. Events:", receipt.events?.length);
      
      // Get the escrow ID directly from the counter
      const escrowId = (await unicrow.escrowIdCounter()).sub(1);
      console.log("Escrow ID:", escrowId.toString());
      
      const buyerFinalBalance = await testToken.balanceOf(buyer.address);
      console.log("Buyer final balance:", buyerFinalBalance.toString());
      
      expect(buyerFinalBalance).to.equal(buyerInitialBalance.sub(TEST_AMOUNT));
      console.log("✅ Buyer balance decreased by the correct amount");
      
      const contractFinalBalance = await testToken.balanceOf(unicrow.address);
      console.log("Contract final balance:", contractFinalBalance.toString());
      
      expect(contractFinalBalance).to.equal(contractInitialBalance.add(TEST_AMOUNT));
      console.log("✅ Contract balance increased by the correct amount");
      
      // Get the escrow data
      const escrow = await unicrow.getEscrow(escrowId);
      console.log("Escrow data:", {
        buyer: escrow.buyer,
        seller: escrow.seller,
        currency: escrow.currency,
        amount: escrow.amount.toString()
      });
      
      expect(escrow.buyer).to.equal(buyer.address);
      expect(escrow.seller).to.equal(seller.address);
      expect(escrow.currency).to.equal(testToken.address);
      expect(escrow.amount).to.equal(TEST_AMOUNT);
      
      console.log("✅ Escrow was created with the correct parameters");
    } catch (error) {
      console.error("Error during test:", error);
      throw error;
    }
  });
  
  it("should successfully create an escrow payment with ERC20 tokens using explicitly set TestUnicrowInteraction address as sender", async function() {
    try {
      console.log("Starting test with explicitly set TestUnicrowInteraction address as sender...");
      
      const buyerInitialBalance = await testToken.balanceOf(buyer.address);
      console.log("Buyer initial balance:", buyerInitialBalance.toString());
      
      const contractInitialBalance = await testToken.balanceOf(unicrow.address);
      console.log("Contract initial balance:", contractInitialBalance.toString());
      
      // Check allowance once more before transaction
      const interactionAllowanceBefore = await testToken.allowance(buyer.address, testInteraction.address);
      console.log("Allowance for TestUnicrowInteraction before transaction:", interactionAllowanceBefore.toString());
      
      const paymentParams = {
        buyer: buyer.address,
        seller: seller.address,
        currency: testToken.address,
        amount: TEST_AMOUNT,
        marketplace: marketplace.address,
        marketplaceFee: MARKETPLACE_FEE,
        challengePeriod: CHALLENGE_PERIOD,
        challengeExtension: 0,
        paymentReference: "test-payment-ref-explicit-contract-address",
        arbitrator: ethers.constants.AddressZero,
        arbitratorFee: 0,
        sender: testInteraction.address // Explicitly set to the TestUnicrowInteraction contract address
      };
      
      console.log("Calling testPayWithERC20 with params:", {
        buyer: paymentParams.buyer,
        seller: paymentParams.seller,
        currency: paymentParams.currency,
        amount: paymentParams.amount.toString(),
        sender: paymentParams.sender
      });
      
      // Call the function that will initiate the token transfer
      const tx = await testInteraction.connect(buyer).testPayWithERC20(paymentParams);
      console.log("Transaction hash:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("Transaction mined. Events:", receipt.events?.length);
      
      // Get the escrow ID directly from the counter
      const escrowId = (await unicrow.escrowIdCounter()).sub(1);
      console.log("Escrow ID:", escrowId.toString());
      
      const buyerFinalBalance = await testToken.balanceOf(buyer.address);
      console.log("Buyer final balance:", buyerFinalBalance.toString());
      
      expect(buyerFinalBalance).to.equal(buyerInitialBalance.sub(TEST_AMOUNT));
      console.log("✅ Buyer balance decreased by the correct amount");
      
      const contractFinalBalance = await testToken.balanceOf(unicrow.address);
      console.log("Contract final balance:", contractFinalBalance.toString());
      
      expect(contractFinalBalance).to.equal(contractInitialBalance.add(TEST_AMOUNT));
      console.log("✅ Contract balance increased by the correct amount");
      
      // Get the escrow data
      const escrow = await unicrow.getEscrow(escrowId);
      console.log("Escrow data:", {
        buyer: escrow.buyer,
        seller: escrow.seller,
        currency: escrow.currency,
        amount: escrow.amount.toString()
      });
      
      expect(escrow.buyer).to.equal(buyer.address);
      expect(escrow.seller).to.equal(seller.address);
      expect(escrow.currency).to.equal(testToken.address);
      expect(escrow.amount).to.equal(TEST_AMOUNT);
      
      console.log("✅ Escrow was created with the correct parameters");
    } catch (error) {
      console.error("Error during test:", error);
      throw error;
    }
  });
});