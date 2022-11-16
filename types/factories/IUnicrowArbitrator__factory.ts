/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type {
  IUnicrowArbitrator,
  IUnicrowArbitratorInterface,
} from "../IUnicrowArbitrator";

const _abi = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "escrowId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "validationAddress",
        type: "address",
      },
      {
        internalType: "uint16",
        name: "validation",
        type: "uint16",
      },
    ],
    name: "approveArbitrator",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "escrowId",
        type: "uint256",
      },
      {
        internalType: "uint16[2]",
        name: "newSplit",
        type: "uint16[2]",
      },
    ],
    name: "arbitrate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "escrowId",
        type: "uint256",
      },
    ],
    name: "getArbitratorData",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "arbitrator",
            type: "address",
          },
          {
            internalType: "uint16",
            name: "arbitratorFee",
            type: "uint16",
          },
          {
            internalType: "bool",
            name: "sellerConsensus",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "buyerConsensus",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "arbitrated",
            type: "bool",
          },
        ],
        internalType: "struct Arbitrator",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "escrowId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "arbitrator",
        type: "address",
      },
      {
        internalType: "uint16",
        name: "arbitratorFee",
        type: "uint16",
      },
    ],
    name: "proposeArbitrator",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "escrowId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "arbitrator",
        type: "address",
      },
      {
        internalType: "uint16",
        name: "arbitratorFee",
        type: "uint16",
      },
    ],
    name: "setArbitrator",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export class IUnicrowArbitrator__factory {
  static readonly abi = _abi;
  static createInterface(): IUnicrowArbitratorInterface {
    return new utils.Interface(_abi) as IUnicrowArbitratorInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): IUnicrowArbitrator {
    return new Contract(address, _abi, signerOrProvider) as IUnicrowArbitrator;
  }
}
