
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

uint16 constant _100_PCT_IN_BIPS = 10000;

uint8 constant WHO_BUYER = 0;
uint8 constant WHO_SELLER = 1;
uint8 constant WHO_MARKETPLACE = 2;
uint8 constant WHO_UNICROW = 3;
uint8 constant WHO_ARBITRATOR = 4;

/**
 * @param buyer Who sent the payment
 * @param seller Whom is the payment for
 * @param challengePerdiodStart When does/has the current challenge period start(ed) (seconds in Unix epoch)
 * @param challengePeriodEnd When does the current challenge period end (seconds in Unix epoch)
 * @param challengeExtension By how much will the challenge period get extended after a challenge (in seconds)
 */
struct Escrow {
    address buyer;
    address seller;
    uint64 challengePeriodStart;
    uint64 challengePeriodEnd;
    uint64 challengeExtension;
    address marketplace;
    uint256 marketplaceFee;
    address currency;
    uint16 claimed;
    int16[2] consensus;
    uint16[4] split;
    uint256 amount;
}

struct DepositInput {
    address buyer;
    address seller;
    address marketplace;
    address currency;
    uint16 marketplaceFee;
    uint32 challengePeriod;
    uint32 challengeExtension;
    uint256 amount;
}

/// @notice Information about arbitrator proposed or assigned to an escrow
/// @notice if both buyerConsensus and sellerConsensus are 1, the arbitrator is assigned, otherwise it's only been proposed by the party that has 1
struct Arbitrator {
    /// @dev Address of the arbitrator
    address arbitrator;
    /// @dev Arbitrator's fee in bips
    uint16 arbitratorFee;
    /// @dev Seller's agreement on the arbitrator
    bool sellerConsensus;
    /// @dev Buyer's agreement on the arbitrator
    bool buyerConsensus;
    /// @dev Has the escrow been decided by the arbitrator
    bool arbitrated;
}

struct ClaimEvent {
    uint escrowId;
    uint[5] amount;
}

struct Settlement {
    address latestSettlementOfferBy;
    uint16[2] latestSettlementOffer;
}

struct Token {
    address address_;
    uint256 decimals;
    string symbol;
}

struct Data {
    Escrow escrow;
    Arbitrator arbitrator;
    Settlement settlement;
    Token token;
}

function abs8(int16 x) pure returns (int16) {
    return x >= 0 ? x : -x;
}
