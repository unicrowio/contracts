import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

// Base Sepolia contract addresses - replace with the actual deployed addresses
const DEPLOYED_ADDRESSES = {
    UNICROW: "0x32fAB9f28724c1c5832D5d6830Afe498F8AbDaAC", // Replace with the actual Unicrow address on Base Sepolia
    UNICROW_CLAIM: "0x01d612617028F14Db6c6F4C00B2a9b4107A90f7a", // Replace with the actual UnicrowClaim address on Base Sepolia
    UNICROW_ARBITRATOR: "0xAd8d43DDefaF2779F72340627A81B9f31330C3Dd", // Replace with the actual UnicrowArbitrator address on Base Sepolia
    UNICROW_DISPUTE: "0xDb2076dCEcC82Ed0dD204Bf7b6DBA44F0Fea9e36", // Replace with the actual UnicrowDispute address on Base Sepolia
    TEST_TOKEN: "0xAA5151346daE563A577f503820bCaFf18E736a54" // Replace with a pre-deployed ERC20 token address on Base Sepolia
  };

describe("Unicrow ERC20 Interaction on Base Sepolia", function() {
  let testToken: Contract;
  let testInteraction: Contract;
  let wallet: any;
  let seller: string, marketplace: string, arbitrator: string;
  
  const TEST_AMOUNT = ethers.utils.parseUnits("1", 18); // 1 token for testing (smaller amount for testnet)
  const CHALLENGE_PERIOD = 60 * 60 * 24; // 1 day in seconds
  const MARKETPLACE_FEE = 100; // 1% (in basis points)
  const ARBITRATOR_FEE = 0; // No arbitrator fee for simplicity
  
  before(async function() {
    this.timeout(120000); // Increase timeout for network operations

    try {
      console.log("Setting up test environment on Base Sepolia...");
      
      // Get the mnemonic from .env
      const mnemonic = process.env.MNEMONIC;
      if (!mnemonic) {
        throw new Error("Missing MNEMONIC in .env file");
      }
      
      // Create a wallet from the mnemonic
      const provider = ethers.provider;
      wallet = ethers.Wallet.fromMnemonic(mnemonic).connect(provider);
      console.log("Wallet address from mnemonic:", wallet.address);
      
      // Create some dummy addresses for test parameters
      const dummyWallet1 = ethers.Wallet.createRandom();
      const dummyWallet2 = ethers.Wallet.createRandom();
      const dummyWallet3 = ethers.Wallet.createRandom();
      
      seller = dummyWallet1.address;
      marketplace = dummyWallet2.address;
      arbitrator = dummyWallet3.address;
      
      console.log("Test addresses:");
      console.log("Buyer (wallet):", wallet.address);
      console.log("Seller:", seller);
      console.log("Marketplace:", marketplace);
      
      // Connect to existing test token
      console.log("Connecting to pre-deployed ERC20 token...");
      testToken = await ethers.getContractAt("IERC20", DEPLOYED_ADDRESSES.TEST_TOKEN, wallet);
      console.log("Connected to test token at:", testToken.address);
      
      // Deploy test interaction contract
      console.log("Deploying TestUnicrowInteraction...");
      const TestUnicrowInteraction = await ethers.getContractFactory("TestUnicrowInteraction", wallet);
      testInteraction = await TestUnicrowInteraction.deploy(DEPLOYED_ADDRESSES.UNICROW);
      await testInteraction.deployed();
      console.log("TestUnicrowInteraction deployed at:", testInteraction.address);
      
      // Check wallet's balance to ensure it has tokens
      const walletBalance = await testToken.balanceOf(wallet.address);
      console.log("Wallet's initial token balance:", walletBalance.toString());
      
      // If the wallet doesn't have enough tokens, we need to get some
      if (walletBalance.lt(TEST_AMOUNT.mul(3))) {
        console.log("Wallet needs more tokens for tests. Please acquire some tokens first.");
        console.log(`Required: ${TEST_AMOUNT.mul(3).toString()}, Current: ${walletBalance.toString()}`);
      }
      
      // Approve the TestUnicrowInteraction contract
      console.log("Approving token spend for TestUnicrowInteraction contract:", testInteraction.address);
      const approveInteractionTx = await testToken.approve(testInteraction.address, TEST_AMOUNT.mul(2));
      await approveInteractionTx.wait();
      
      // Verify the approval was set correctly
      const interactionAllowance = await testToken.allowance(wallet.address, testInteraction.address);
      console.log("Allowance for TestUnicrowInteraction contract:", interactionAllowance.toString());
      expect(interactionAllowance).to.be.at.least(TEST_AMOUNT.mul(2));
      
      // Also approve the Unicrow contract directly for the buyer-as-sender test
      console.log("Approving token spend for Unicrow contract:", DEPLOYED_ADDRESSES.UNICROW);
      const approveUnicrowTx = await testToken.approve(DEPLOYED_ADDRESSES.UNICROW, TEST_AMOUNT);
      await approveUnicrowTx.wait();
      
      // Verify the approval was set correctly
      const unicrowAllowance = await testToken.allowance(wallet.address, DEPLOYED_ADDRESSES.UNICROW);
      console.log("Allowance for Unicrow contract:", unicrowAllowance.toString());
      expect(unicrowAllowance).to.be.at.least(TEST_AMOUNT);
      
      console.log("Setup complete, ready to run tests");
    } catch (error) {
      console.error("Error in before:", error);
      throw error;
    }
  });
  
  it("should successfully create an escrow payment with ERC20 tokens using test contract as sender", async function() {
    try {
      console.log("Starting test with TestUnicrowInteraction as sender...");
      
      const buyerInitialBalance = await testToken.balanceOf(wallet.address);
      console.log("Buyer initial balance:", buyerInitialBalance.toString());
      
      const contractInitialBalance = await testToken.balanceOf(DEPLOYED_ADDRESSES.UNICROW);
      console.log("Unicrow contract initial balance:", contractInitialBalance.toString());
      
      const paymentParams = {
        buyer: wallet.address,
        seller: seller,
        currency: testToken.address,
        amount: TEST_AMOUNT,
        marketplace: marketplace,
        marketplaceFee: MARKETPLACE_FEE,
        challengePeriod: CHALLENGE_PERIOD,
        challengeExtension: 0,
        paymentReference: "sepolia-test-contract-sender",
        arbitrator: ethers.constants.AddressZero,
        arbitratorFee: ARBITRATOR_FEE,
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
      const tx = await testInteraction.testPayWithERC20(paymentParams);
      console.log("Transaction hash:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("Transaction mined. Block number:", receipt.blockNumber);
      
      const buyerFinalBalance = await testToken.balanceOf(wallet.address);
      console.log("Buyer final balance:", buyerFinalBalance.toString());
      
      expect(buyerFinalBalance).to.equal(buyerInitialBalance.sub(TEST_AMOUNT));
      console.log("✅ Buyer balance decreased by the correct amount");
      
      const contractFinalBalance = await testToken.balanceOf(DEPLOYED_ADDRESSES.UNICROW);
      console.log("Unicrow contract final balance:", contractFinalBalance.toString());
      
      expect(contractFinalBalance).to.equal(contractInitialBalance.add(TEST_AMOUNT));
      console.log("✅ Unicrow contract balance increased by the correct amount");
      
      console.log("✅ Escrow payment was successfully processed");
    } catch (error) {
      console.error("Error during test:", error);
      throw error;
    }
  });
  
  it("should successfully create an escrow payment with ERC20 tokens using zero address as sender", async function() {
    try {
      console.log("Starting test with zero address as sender...");
      
      const buyerInitialBalance = await testToken.balanceOf(wallet.address);
      console.log("Buyer initial balance:", buyerInitialBalance.toString());
      
      const contractInitialBalance = await testToken.balanceOf(DEPLOYED_ADDRESSES.UNICROW);
      console.log("Unicrow contract initial balance:", contractInitialBalance.toString());
      
      const paymentParams = {
        buyer: wallet.address,
        seller: seller,
        currency: testToken.address,
        amount: TEST_AMOUNT,
        marketplace: marketplace,
        marketplaceFee: MARKETPLACE_FEE,
        challengePeriod: CHALLENGE_PERIOD,
        challengeExtension: 0,
        paymentReference: "sepolia-test-zero-address",
        arbitrator: ethers.constants.AddressZero,
        arbitratorFee: ARBITRATOR_FEE,
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
      const tx = await testInteraction.testPayWithERC20(paymentParams);
      console.log("Transaction hash:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("Transaction mined. Block number:", receipt.blockNumber);
      
      const buyerFinalBalance = await testToken.balanceOf(wallet.address);
      console.log("Buyer final balance:", buyerFinalBalance.toString());
      
      expect(buyerFinalBalance).to.equal(buyerInitialBalance.sub(TEST_AMOUNT));
      console.log("✅ Buyer balance decreased by the correct amount");
      
      const contractFinalBalance = await testToken.balanceOf(DEPLOYED_ADDRESSES.UNICROW);
      console.log("Unicrow contract final balance:", contractFinalBalance.toString());
      
      expect(contractFinalBalance).to.equal(contractInitialBalance.add(TEST_AMOUNT));
      console.log("✅ Unicrow contract balance increased by the correct amount");
      
      console.log("✅ Escrow payment was successfully processed");
    } catch (error) {
      console.error("Error during test:", error);
      throw error;
    }
  });
  
  it("should successfully create an escrow payment with ERC20 tokens using buyer's address as sender", async function() {
    try {
      console.log("Starting test with buyer's address as sender...");
      
      const buyerInitialBalance = await testToken.balanceOf(wallet.address);
      console.log("Buyer initial balance:", buyerInitialBalance.toString());
      
      const contractInitialBalance = await testToken.balanceOf(DEPLOYED_ADDRESSES.UNICROW);
      console.log("Unicrow contract initial balance:", contractInitialBalance.toString());
      
      // Check allowance once more before transaction
      const unicrowAllowanceBefore = await testToken.allowance(wallet.address, DEPLOYED_ADDRESSES.UNICROW);
      console.log("Allowance for Unicrow before transaction:", unicrowAllowanceBefore.toString());
      
      const paymentParams = {
        buyer: wallet.address,
        seller: seller,
        currency: testToken.address,
        amount: TEST_AMOUNT,
        marketplace: marketplace,
        marketplaceFee: MARKETPLACE_FEE,
        challengePeriod: CHALLENGE_PERIOD,
        challengeExtension: 0,
        paymentReference: "sepolia-test-buyer-sender",
        arbitrator: ethers.constants.AddressZero,
        arbitratorFee: ARBITRATOR_FEE,
        sender: wallet.address // Use buyer's address as the sender
      };
      
      console.log("Calling testPayWithERC20 with params:", {
        buyer: paymentParams.buyer,
        seller: paymentParams.seller,
        currency: paymentParams.currency,
        amount: paymentParams.amount.toString(),
        sender: paymentParams.sender
      });
      
      // Call the function
      const tx = await testInteraction.testPayWithERC20(paymentParams);
      console.log("Transaction hash:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("Transaction mined. Block number:", receipt.blockNumber);
      
      const buyerFinalBalance = await testToken.balanceOf(wallet.address);
      console.log("Buyer final balance:", buyerFinalBalance.toString());
      
      expect(buyerFinalBalance).to.equal(buyerInitialBalance.sub(TEST_AMOUNT));
      console.log("✅ Buyer balance decreased by the correct amount");
      
      const contractFinalBalance = await testToken.balanceOf(DEPLOYED_ADDRESSES.UNICROW);
      console.log("Unicrow contract final balance:", contractFinalBalance.toString());
      
      expect(contractFinalBalance).to.equal(contractInitialBalance.add(TEST_AMOUNT));
      console.log("✅ Unicrow contract balance increased by the correct amount");
      
      console.log("✅ Escrow payment was successfully processed");
    } catch (error) {
      console.error("Error during test:", error);
      throw error;
    }
  });
});