// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./Unicrow.sol";
import "./interfaces/IUnicrowArbitrator.sol";
import "./interfaces/IUnicrowClaim.sol";
import "./UnicrowTypes.sol";

/**
 * @title Unicrow Arbitrator
 * @notice Functionality for assigning an arbitrator to an escrow and for an arbitrator to decide a dispute
 */
contract UnicrowArbitrator is IUnicrowArbitrator, Context, ReentrancyGuard {
    using SafeMath for uint256;
    using Address for address payable;

    /// Reference to the main Unicrow contract
    Unicrow public unicrow;
    /// Reference to the contract that manages claims from the escrows
    IUnicrowClaim public unicrowClaim;

    /// Stores information about arbitrators in relation to escrows
    mapping(uint256 => Arbitrator) public escrowArbitrator;

    /**
     * @dev Emitted when an arbitrator has been proposed by one of the parties or
     * @dev if the other party sends a different proposal or also if the original party changes their proposal
     * @param escrowId Id of the escrow to which the proposer belongs
     * @param arbitrator Arbitrator's address
     * @param arbitratorFee Proposed fee in bips
     * @param proposer Address of the party that sent the proposal
    */
    event ArbitratorProposed(uint256 indexed escrowId, address arbitrator, uint16 arbitratorFee, address proposer);

    /**
     * @dev Emitted when the arbitrator proposal was approved by the other party
     * @param escrowId Id of the escrow to which the proposer belongs
     * @param arbitrator Arbitrator's address
     * @param arbitratorFee Proposed fee in bips
    */
    event ArbitratorApproved(uint256 indexed escrowId, address arbitrator, uint256 arbitratorFee);

    /**
     * @dev Emitted when the arbitrator has resolved a dispute
     * @param escrowId Id of the arbitrated escrow
     * @param escrow The escrow data, incl. the final split between buyer and seller as decided by the arbitrator
     * @param blockTime Timestamp of the block in which the transaction was minuted
     * @param amounts All amounts (i.e. incl. marketplace fee, arbitrator fee, and protocol fee) in the token
     */
    event Arbitrated(uint256 indexed escrowId, Escrow escrow, uint256 blockTime, uint256[5] amounts);

    /**
     * The constructor provides immutable reference to the main escrow and claim contracts
     * @param unicrow_ Unicrow contract address
     * @param unicrowClaim_ UnicrowClaim contract address
     */
    constructor(
        address unicrow_,
        address unicrowClaim_
    ) {
        unicrow = Unicrow(payable(unicrow_));
        unicrowClaim = IUnicrowClaim(payable(unicrowClaim_));
    }

    /**
     * @dev Checks if the provided address is either a buyer or a seller in the provided escrow
     * @param escrowId Id of the escrow to check
     * @param caller Address to check against
     */
    modifier isEscrowMember(uint256 escrowId, address caller) {
        require(_isEscrowBuyer(escrowId, caller) || _isEscrowSeller(escrowId, caller), "2-004");
        _;
    }

    /**
     * @dev Checks if the caller is a seller in an escrow with the provided id
     * @param escrowId Id of the escrow to check
     */
    modifier isEscrowSeller(uint256 escrowId) {
        require(_isEscrowSeller(escrowId, _msgSender()));
        _;
    }

    /// @dev Checks if the caller is the Unicrow's main escrow contract
    modifier isUnicrow() {
        require(_msgSender() == address(unicrow));
        _;
    }

    /// @inheritdoc IUnicrowArbitrator
    function setArbitrator(
        uint256 escrowId,
        address arbitrator,
        uint16 arbitratorFee
    ) external override isUnicrow {
        require(arbitrator != address(0));
        require(
            arbitrator != unicrow.getEscrow(escrowId).seller &&
            arbitrator != unicrow.getEscrow(escrowId).buyer
        );

        escrowArbitrator[escrowId].arbitrator = arbitrator;
        escrowArbitrator[escrowId].arbitratorFee = arbitratorFee;
        escrowArbitrator[escrowId].buyerConsensus = true;
        escrowArbitrator[escrowId].sellerConsensus = true;
    }

    /// @inheritdoc IUnicrowArbitrator
    function proposeArbitrator(
        uint256 escrowId,
        address arbitrator,
        uint16 arbitratorFee
    ) external override isEscrowMember(escrowId, _msgSender()) {
        Arbitrator storage arbitratorData = escrowArbitrator[escrowId];

        require(!arbitratorData.buyerConsensus || !arbitratorData.sellerConsensus,"2-006" );

        if (_isEscrowBuyer(escrowId, _msgSender())) {
            arbitratorData.buyerConsensus = true;
            arbitratorData.sellerConsensus = false;
            arbitratorData.arbitrator = arbitrator;
            arbitratorData.arbitratorFee = arbitratorFee;
        } else if (_isEscrowSeller(escrowId, _msgSender())) {
            arbitratorData.sellerConsensus = true;
            arbitratorData.buyerConsensus = false;
            arbitratorData.arbitrator = arbitrator;
            arbitratorData.arbitratorFee = arbitratorFee;
        }

        emit ArbitratorProposed(
            escrowId,
            arbitrator,
            arbitratorFee,
            _msgSender()
        );
    }

    /// @inheritdoc IUnicrowArbitrator
    function approveArbitrator(uint256 escrowId, address validationAddress, uint16 validation)
        external
        override
        isEscrowMember(escrowId, _msgSender())
    {
        Arbitrator memory arbitratorData = getArbitratorData(escrowId);

        require(validationAddress == arbitratorData.arbitrator, "2-008");
        require(validation == arbitratorData.arbitratorFee, "2-007");

        if (_isEscrowBuyer(escrowId, _msgSender())) {
            require(
                arbitratorData.buyerConsensus == false,
                "2-003"
            );
            escrowArbitrator[escrowId].buyerConsensus = true;
        }
        if (_isEscrowSeller(escrowId, _msgSender())) {
            require(
                arbitratorData.sellerConsensus == false,
                "2-003"
            );
            escrowArbitrator[escrowId].sellerConsensus = true;
        }

        emit ArbitratorApproved(escrowId, arbitratorData.arbitrator, arbitratorData.arbitratorFee);
    }

    /// @inheritdoc IUnicrowArbitrator
    function arbitrate(uint256 escrowId, uint16[2] memory newSplit)
        external
        override
    {
        Arbitrator memory arbitratorData = getArbitratorData(escrowId);
        Escrow memory escrow = unicrow.getEscrow(escrowId);

        require(_msgSender() == arbitratorData.arbitrator, "2-005");

        require(
            arbitratorData.buyerConsensus && arbitratorData.sellerConsensus,
            "2-001"
        );

        require(newSplit[WHO_BUYER] + newSplit[WHO_SELLER] == 10000, "1-007");

        escrow.consensus[WHO_BUYER] = abs8(escrow.consensus[WHO_BUYER]) == 0
            ? int16(1)
            : abs8(escrow.consensus[WHO_BUYER]);
        escrow.consensus[WHO_SELLER] = abs8(escrow.consensus[WHO_SELLER]);

        escrow.split[0] = newSplit[WHO_BUYER];
        escrow.split[1] = newSplit[WHO_SELLER];

        unicrow.settle(
            escrowId,
            escrow.split,
            escrow.consensus
        );

        escrowArbitrator[escrowId].arbitrated = true;

        uint256[5] memory amounts = unicrowClaim.singleClaim(escrowId);

        emit Arbitrated(escrowId, escrow, block.timestamp, amounts);
    }

    /**
     * @dev Calculates final splits of all parties involved in the payment when the paymet is decided by an arbitrator.
     * @dev If seller's split is < 100% it will discount the marketplace and protocol fee, but
     * @dev (unlike normal refund or settlement) will keep full Arbitrator fee and deduct it from buyer's and seller's share proportionally
     * @param currentSplit Current split in bips. See WHO_* contants for keys
     * @return Splits in bips using the same keys for the array
     */
    function arbitrationCalculation(
        uint16[5] memory currentSplit
    ) public pure returns (uint16[] memory) {
        uint16[] memory split = new uint16[](4);

        uint16 calculatedSellerArbitratorFee;
        uint16 calculatedBuyerArbitratorFee;

        unchecked {
            calculatedBuyerArbitratorFee = uint16(
                uint256(currentSplit[WHO_ARBITRATOR])
                    .mul(currentSplit[WHO_BUYER])
                    .div(_100_PCT_IN_BIPS)
            );
        }

        unchecked {
            calculatedSellerArbitratorFee = uint16(
                uint256(currentSplit[WHO_ARBITRATOR])
                    .mul(currentSplit[WHO_SELLER])
                    .div(_100_PCT_IN_BIPS)
            );
        }

        if (currentSplit[WHO_CROW] > 0) {
            unchecked {
                split[WHO_CROW] = uint16(
                    uint256(currentSplit[WHO_CROW])
                        .mul(currentSplit[WHO_SELLER])
                        .div(_100_PCT_IN_BIPS)
                );
            }
        }

        if (currentSplit[WHO_MARKETPLACE] > 0) {
            unchecked {
                split[WHO_MARKETPLACE] = uint16(
                    uint256(currentSplit[WHO_MARKETPLACE])
                        .mul(currentSplit[WHO_SELLER])
                        .div(_100_PCT_IN_BIPS)
                );
            }
        }

        if(currentSplit[WHO_BUYER] > 0) {
            unchecked {
                split[WHO_BUYER] = uint16(
                    uint256(currentSplit[WHO_BUYER])
                        .sub(calculatedBuyerArbitratorFee)
                    );
            }
        }

        if(currentSplit[WHO_SELLER] > 0) {
            unchecked {
                split[WHO_SELLER] = uint16(
                    uint256(currentSplit[WHO_SELLER])
                        .sub(split[WHO_CROW])
                        .sub(split[WHO_MARKETPLACE])
                        .sub(calculatedSellerArbitratorFee)
                    );
            }
        }

        return split;
    }

    /// @inheritdoc IUnicrowArbitrator
    function getArbitratorData(uint256 escrowId)
        public
        override
        view
        returns (Arbitrator memory)
    {
        return escrowArbitrator[escrowId];
    }

    /**
     * @dev Checks whether an address is a buyer in the provided escrow
     * @param escrowId Id of the escrow to check against
     * @param _buyer the addres to check
     */
    function _isEscrowBuyer(uint256 escrowId, address _buyer)
        internal
        view
        returns (bool)
    {
        return _buyer == unicrow.getEscrow(escrowId).buyer;
    }

    /**
     * @dev Checks whether an address is a seller in the provided escrow
     * @param escrowId Id of the escrow to check against
     * @param _seller the addres to check
     */
    function _isEscrowSeller(uint256 escrowId, address _seller)
        internal
        view
        returns (bool)
    {
        return _seller == unicrow.getEscrow(escrowId).seller;
    }
}
