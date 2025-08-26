// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "../interfaces/IUnicrow.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../UnicrowTypes.sol";

contract TestUnicrowInteraction {
    using SafeERC20 for IERC20;
    
    IUnicrow public unicrow;
    
    constructor(address _unicrowAddress) {
        unicrow = IUnicrow(_unicrowAddress);
    }
    
    // Use a struct to avoid stack too deep errors
    struct PaymentParams {
        address buyer;
        address seller;
        address currency;
        uint256 amount;
        address marketplace;
        uint16 marketplaceFee;
        uint32 challengePeriod;
        uint32 challengeExtension;
        string paymentReference;
        address arbitrator;
        uint16 arbitratorFee;
        address sender; // Allow setting the sender parameter
    }

    // Function to test calling Unicrow's pay() with ERC20 tokens
    function testPayWithERC20(PaymentParams calldata params) external returns (uint256 escrowId) {
        // Create the escrow input structure
        EscrowInput memory input = EscrowInput({
            buyer: params.buyer,
            seller: params.seller,
            currency: params.currency,
            amount: params.amount,
            marketplace: params.marketplace,
            marketplaceFee: params.marketplaceFee,
            challengePeriod: params.challengePeriod,
            challengeExtension: params.challengeExtension,
            paymentReference: params.paymentReference
        });
        
        // If the currency is not ETH and we need to handle tokens, do the transfer
        if (params.currency != address(0)) {
            // If sender is address(this) or address(0), we need to first pull tokens to this contract
            // because in both cases, Unicrow will try to pull tokens from this contract
            if (params.sender == address(this) || params.sender == address(0)) {
                // Transfer tokens from the buyer to this contract
                IERC20(params.currency).safeTransferFrom(msg.sender, address(this), params.amount);
                
                // Approve the Unicrow contract to spend tokens from this contract
                IERC20(params.currency).safeApprove(address(unicrow), params.amount);
            }
        }
        
        // Call Unicrow's pay function with the specified sender
        return unicrow.pay(params.sender, input, params.arbitrator, params.arbitratorFee);
    }
}