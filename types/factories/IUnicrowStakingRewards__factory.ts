/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type {
  IUnicrowStakingRewards,
  IUnicrowStakingRewardsInterface,
} from "../IUnicrowStakingRewards";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "collectFee",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export class IUnicrowStakingRewards__factory {
  static readonly abi = _abi;
  static createInterface(): IUnicrowStakingRewardsInterface {
    return new utils.Interface(_abi) as IUnicrowStakingRewardsInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): IUnicrowStakingRewards {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as IUnicrowStakingRewards;
  }
}