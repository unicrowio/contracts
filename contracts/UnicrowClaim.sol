// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IUnicrowClaim.sol";
import "./interfaces/IUnicrowStakingRewards.sol";
import "./interfaces/IUnicrowClaimRewards.sol";
import "./UnicrowArbitrator.sol";
import "./Unicrow.sol";
import "./UnicrowTypes.sol";

/**
 * @title Contract for managing claims from Unicrow's escrow
 */
contract UnicrowClaim is IUnicrowClaim, Context, ReentrancyGuard {
    using SafeMath for uint256;

    /// Reference to the main escrow contract (immutable)
    Unicrow public unicrow;

    /// Reference to the Arbitrator contract (immutable)
    UnicrowArbitrator public immutable unicrowArbitrator;

    IUnicrowClaimRewards public crowRewards;

    IUnicrowStakingRewards public stakingRewards;

    /// Destination address of the protocol fee (governed)
    address public unicrowFeeAddress;

    /// Emitted when multiple escrows are claimed
    /// @param escrows data of all escrows that were claimed
    event Claim(ClaimEvent[] escrows);

    /// Emitted when a single escrow payment is claimed
    /// @param escrow data of the claimed escrow
    event SingleClaim(ClaimEvent escrow);

    /**
     * @param unicrow_ main escrow contract
     * @param unicrowArbitrator_ arbitration contract
     * @param unicrowFeeAddress_ address to collect escrow fee
     */
    constructor(
        address unicrow_,
        address unicrowArbitrator_,
        address unicrowFeeAddress_
    ) {
        unicrow = Unicrow(payable(unicrow_));
        unicrowArbitrator = UnicrowArbitrator(unicrowArbitrator_);

        unicrowFeeAddress = unicrowFeeAddress_;
    }

    modifier onlyGovernance() {
        require(_msgSender() == unicrow.governanceAddress());
        _;
    }

    /// @inheritdoc IUnicrowClaim
    function updateCrowRewards(address crowRewards_) external override onlyGovernance {
        crowRewards = IUnicrowClaimRewards(crowRewards_);
    }

    /// @inheritdoc IUnicrowClaim
    function updateStakingRewards(address stakingRewards_) external override onlyGovernance {
        stakingRewards = IUnicrowStakingRewards(stakingRewards_);
    }

    /// @inheritdoc IUnicrowClaim
    function updateUnicrowFeeAddress(address unicrowFeeAddress_) external override onlyGovernance {
        unicrowFeeAddress = unicrowFeeAddress_;
    }

    /// @inheritdoc IUnicrowClaim
    function claim(uint[] calldata escrows) external override payable nonReentrant {

        ClaimEvent[] memory events = new ClaimEvent[](escrows.length);

        for (uint256 i = 0; i < escrows.length; i++) {
            Escrow memory escrow = unicrow.getEscrow(escrows[i]);

            Arbitrator memory arbitratorData = unicrowArbitrator
                .getArbitratorData(escrows[i]);

            require(escrow.claimed == 0, "0-005");

            require(
                (escrow.consensus[WHO_SELLER] >= 1 &&
                    escrow.consensus[WHO_BUYER] >= 1) ||
                    block.timestamp > escrow.challengePeriodEnd,
                "0-006"
            );

            uint16[4] memory calculatedSplits = calculateSplits(
                arbitratorData.arbitratorFee,
                arbitratorData.arbitrated,
                escrow
            );

            uint256[5] memory payments = calculatePayments(
                escrow.amount,
                calculatedSplits,
                escrow.split[WHO_SELLER],
                arbitratorData.arbitratorFee,
                arbitratorData.arbitrated
            );

            address[5] memory addresses = [
                escrow.buyer,
                escrow.seller,
                escrow.marketplace,
                address(unicrowFeeAddress),
                arbitratorData.arbitrator
            ];

            claimPayments(escrows[i], payments, addresses, escrow.currency);

            if(address(crowRewards) != address(0)){
                crowRewards.distribute(escrow.buyer, escrow.seller, payments[WHO_UNICROW]);
            }

            if(address(stakingRewards) != address(0)){
                stakingRewards.collectFee(escrow.currency, payments[WHO_UNICROW]);
            }

            events[i] = ClaimEvent(escrows[i], payments);
        }

        emit Claim(events);
    }

    /// @inheritdoc IUnicrowClaim
    function singleClaim(uint escrowId) external override payable nonReentrant returns(uint256[5] memory) {
        Escrow memory escrow = unicrow.getEscrow(escrowId);

        Arbitrator memory arbitratorData = unicrowArbitrator
                .getArbitratorData(escrowId);

        // Check that the payment hasn't been claimed yet
        require(escrow.claimed == 0, "0-005");

        // Make sure both parties consented to releasing the payment from the escrow
        require(
            (escrow.consensus[WHO_SELLER] >= 1 &&
                escrow.consensus[WHO_BUYER] >= 1) ||
                block.timestamp > escrow.challengePeriodEnd,
            "0-006"
        );

        // Calculate final splits (in bips) from gross splits
        uint16[4] memory calculatedSplits = calculateSplits(
            arbitratorData.arbitratorFee,
            arbitratorData.arbitrated,
            escrow
        );

        // Calculate amounts to be sent in the token
        uint256[5] memory payments = calculatePayments(
            escrow.amount,
            calculatedSplits,
            escrow.split[WHO_SELLER],
            arbitratorData.arbitratorFee,
            arbitratorData.arbitrated
        );

        // Prepare list of addresses for the withdrawals
        address[5] memory addresses = [
            escrow.buyer,
            escrow.seller,
            escrow.marketplace,
            address(unicrowFeeAddress),
            arbitratorData.arbitrator
        ];

        // Send the shares to the addresses
        claimPayments(escrowId, payments, addresses, escrow.currency);

        if(address(crowRewards) != address(0)){
            crowRewards.distribute(escrow.buyer, escrow.seller, payments[WHO_UNICROW]);
        }

        if(address(stakingRewards) != address(0)){
            stakingRewards.collectFee(escrow.currency, payments[WHO_UNICROW]);
        }

        // Emit the event incl. final amounts
        emit SingleClaim(ClaimEvent(escrowId, payments));

        // Return the final amounts
        return [
            payments[WHO_BUYER],
            payments[WHO_SELLER],
            payments[WHO_MARKETPLACE],
            payments[WHO_UNICROW],
            payments[WHO_ARBITRATOR]
        ];
    }

    /**
     * @dev Calculates how the balance in the escrow should be split between all the relevant parties
     * @param arbitratorFee Arbitrator information is not part of core escrow data, so fee is provided separately here
     * @param arbitrated Whether the escrow was decided by an arbitrator
     * @param escrow Escrow information
     */
    function calculateSplits(
        uint16 arbitratorFee,
        bool arbitrated,
        Escrow memory escrow
    ) internal view returns(uint16[4] memory) {
        uint16[4] memory split;

        // The calculation will differ slightly based on whether the payment was decided by an arbitrator or not
        if(arbitrated) {
            split = unicrowArbitrator.arbitrationCalculation(
                [
                    escrow.split[WHO_BUYER],
                    escrow.split[WHO_SELLER],
                    escrow.split[WHO_MARKETPLACE],
                    escrow.split[WHO_UNICROW],
                    arbitratorFee
                ]
            );
        } else {
            split = unicrow.splitCalculation(
                [
                    escrow.split[WHO_BUYER],
                    escrow.split[WHO_SELLER],
                    escrow.split[WHO_MARKETPLACE],
                    escrow.split[WHO_UNICROW],
                    arbitratorFee
                ]
            );
        }

        return split;
    }

    /**
     * @dev Calculates actual amounts that should be sent to the parties
     * @param amount payment amount in escrow (in token)
     * @param split final splits
     * @param fullSellerSplit seller split 
     * @param arbitratorFee Arbitrator fee
     * @param arbitrated whether the payment was arbitrated (it impacts final arbitrator's fee for refunds)
     */
    function calculatePayments(
        uint amount,
        uint16[4] memory split,
        uint16 fullSellerSplit,
        uint16 arbitratorFee,
        bool arbitrated
    ) internal pure returns(uint256[5] memory) {
        uint256[5] memory payments;

        // Multiply all the splits by the total amount
        payments[WHO_BUYER] = uint256(split[WHO_BUYER]).mul(amount).div(_100_PCT_IN_BIPS);
        payments[WHO_SELLER] = uint256(split[WHO_SELLER]).mul(amount).div(_100_PCT_IN_BIPS);
        payments[WHO_MARKETPLACE] = uint256(split[WHO_MARKETPLACE]).mul(amount).div(_100_PCT_IN_BIPS);
        payments[WHO_UNICROW] = uint256(split[WHO_UNICROW]).mul(amount).div(_100_PCT_IN_BIPS);

        if(!arbitrated) {
            // If the payment wasn't arbitrated, the arbitrator fee is calculated from seller's share
            // (normally 100%, but could be 0 for refund)
            uint16 arbitratorFee_ = uint16(uint256(arbitratorFee).mul(fullSellerSplit).div(_100_PCT_IN_BIPS));
            payments[WHO_ARBITRATOR] = uint256(arbitratorFee_).mul(amount).div(_100_PCT_IN_BIPS);
        } else {
            // If the arbitrator decided the payment, they get their full fee
            // (in such case, buyer's split was reduced in the calling function)
            payments[WHO_ARBITRATOR] = uint256(arbitratorFee).mul(amount).div(_100_PCT_IN_BIPS);
        }

        return payments;
    }

    /**
     * @dev Sends payments to the addresses of all the eligible parties
     * @param escrowId Id of the escrow
     * @param amounts amounts in token to claim
     * @param addresses destination addresses for each claimed share
     * @param currency address of the payment token
     */
    function claimPayments(
        uint escrowId,
        uint[5] memory amounts,
        address[5] memory addresses,
        address currency
    ) internal {
        for (uint256 i = 0; i < amounts.length; i++) {
            if (amounts[i] > 0) {
                unicrow.sendEscrowShare(addresses[i], amounts[i], currency);
            }
        }

        unicrow.setClaimed(escrowId);
    }
}