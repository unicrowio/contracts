// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IUnicrowClaimRewards {
    function distribute(address buyer, address seller, uint256 fee, address token) external;
}
