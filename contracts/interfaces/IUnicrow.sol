// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.0;

import "../UnicrowTypes.sol";

interface IUnicrow {
  /**
   * @notice Deposit ETH or SafeERC20 to open a new escrow payment
   * @dev Escrow ID is generated automatically by the contract
   * @param data Escrow data (seller, marketplace, currency, and challenge period information)
   * @param arbitrator Arbitrator address (submit zero address to not set an arbitrator)
   * @param arbitratorFee Arbitrator Fee
   */
  function pay(
    DepositInput memory data,
    address arbitrator,
    uint16 arbitratorFee
  ) external payable;

  /**
   * @notice Function called by UnicrowDispute to execute a challenge
   * @dev can be called by UnicrowDispute only
   * @param escrowId ID of the challenged escrow payment
   * @param split New split (bips)
   * @param consensus New consensus
   * @param challengeStart When the new challenge period starts
   * @param challengeEnd When the new challenge period ends
   */
  function challenge(
    uint256 escrowId,
    uint16[4] memory split,
    int16[2] memory consensus,
    uint64 challengeStart,
    uint64 challengeEnd
  ) external;

  /**
   * @notice Refund 100% of the buyer payment (all fees are waived).
   * @dev Can be called only by the Seller
   * @param escrowId id of the escrow to be refunded
   */
  function refund(uint escrowId) external;

  /**
   * @notice Release the payment to the seller and to all other parties that charge a fee from it.
   * @dev Can be called by the Buyer only
   * @param escrowId ID of the escrow to be released
   */
  function release(uint escrowId) external;

  /**
   * @notice Settle a payment (i.e. split it with arbitrary shares between the buyer and the seller). Fees are reduced proportionally to the seller's share.
   * @dev Can be called only by UnicrowDispute
   * @param escrowId ID of the escrow to be settled
   * @param split New split in bips (total must equal 10000)
   * @param consensus New consensus
   */
  function settle(
    uint256 escrowId,
    uint16[4] memory split,
    int16[2] memory consensus
    ) external;

  /**
   * @dev Calculating the final splits (incl. fees) based on how the payment is concluded.
   * @dev The splits are not expected to equal 100% in total. Buyer and seller splits should equal 100 based
   * @dev on how the payment is settled, other splits represent fees which will get reduced and deducted accordingly
   * @param currentSplit Current splits in bips
   */
  function splitCalculation(
    uint16[5] memory currentSplit
  ) external returns(uint16[] memory);

  /**
   * @dev Get the escrow data (without arbitrator or settlement information)
   * @param escrowId ID of the escrow to retrieve information of
   */
  function getEscrow(
    uint256 escrowId
  ) external returns(Escrow memory);

  /**
   * @notice Set the escrow as claimed (i.e. that its balance has been sent to all the parties involved).
   * @dev Callable only by other Unicrow contracts
   * @param escrowId ID of the escrow to set as claimed
   */
  function setClaimed(uint escrowId) external;

  /**
   * @notice Update escrow fee (governance only, cannot be more than 1%)
   * @param fee New escrow fee (bips)
   */
  function updateEscrowFee(uint16 fee) external;

  /**
   * @notice Update governance contract address (governable)
   * @param governance New governance address
   */
  function updateGovernance(address governance) external;
}
