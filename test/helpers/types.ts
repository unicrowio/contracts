import { BigNumberish } from "ethers";

export interface PayType {
    buyer: string;
    seller: string;
    marketplace: string;
    currency: string;
    marketplaceFee: BigNumberish;
    challengePeriod: BigNumberish;
    challengeExtension: BigNumberish;
    amount: BigNumberish;
  }