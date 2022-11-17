/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PayableOverrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import { FunctionFragment, Result } from "@ethersproject/abi";
import { Listener, Provider } from "@ethersproject/providers";
import { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from "./common";

export type EscrowStruct = {
  buyer: string;
  seller: string;
  challengePeriodStart: BigNumberish;
  challengePeriodEnd: BigNumberish;
  challengeExtension: BigNumberish;
  marketplace: string;
  marketplaceFee: BigNumberish;
  currency: string;
  claimed: BigNumberish;
  consensus: [BigNumberish, BigNumberish];
  split: [BigNumberish, BigNumberish, BigNumberish, BigNumberish];
  amount: BigNumberish;
};

export type EscrowStructOutput = [
  string,
  string,
  BigNumber,
  BigNumber,
  BigNumber,
  string,
  BigNumber,
  string,
  number,
  [number, number],
  [number, number, number, number],
  BigNumber
] & {
  buyer: string;
  seller: string;
  challengePeriodStart: BigNumber;
  challengePeriodEnd: BigNumber;
  challengeExtension: BigNumber;
  marketplace: string;
  marketplaceFee: BigNumber;
  currency: string;
  claimed: number;
  consensus: [number, number];
  split: [number, number, number, number];
  amount: BigNumber;
};

export type DepositInputStruct = {
  buyer: string;
  seller: string;
  marketplace: string;
  currency: string;
  marketplaceFee: BigNumberish;
  challengePeriod: BigNumberish;
  challengeExtension: BigNumberish;
  amount: BigNumberish;
};

export type DepositInputStructOutput = [
  string,
  string,
  string,
  string,
  number,
  number,
  number,
  BigNumber
] & {
  buyer: string;
  seller: string;
  marketplace: string;
  currency: string;
  marketplaceFee: number;
  challengePeriod: number;
  challengeExtension: number;
  amount: BigNumber;
};

export interface IUnicrowInterface extends utils.Interface {
  contractName: "IUnicrow";
  functions: {
    "challenge(uint256,uint16[4],int16[2],uint64,uint64)": FunctionFragment;
    "getEscrow(uint256)": FunctionFragment;
    "pay((address,address,address,address,uint16,uint32,uint32,uint256),address,uint16)": FunctionFragment;
    "refund(uint256)": FunctionFragment;
    "release(uint256)": FunctionFragment;
    "setClaimed(uint256)": FunctionFragment;
    "settle(uint256,uint16[4],int16[2])": FunctionFragment;
    "splitCalculation(uint16[5])": FunctionFragment;
    "updateEscrowFee(uint16)": FunctionFragment;
    "updateGovernance(address)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "challenge",
    values: [
      BigNumberish,
      [BigNumberish, BigNumberish, BigNumberish, BigNumberish],
      [BigNumberish, BigNumberish],
      BigNumberish,
      BigNumberish
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "getEscrow",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "pay",
    values: [DepositInputStruct, string, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "refund",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "release",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "setClaimed",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "settle",
    values: [
      BigNumberish,
      [BigNumberish, BigNumberish, BigNumberish, BigNumberish],
      [BigNumberish, BigNumberish]
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "splitCalculation",
    values: [
      [BigNumberish, BigNumberish, BigNumberish, BigNumberish, BigNumberish]
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "updateEscrowFee",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "updateGovernance",
    values: [string]
  ): string;

  decodeFunctionResult(functionFragment: "challenge", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "getEscrow", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "pay", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "refund", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "release", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "setClaimed", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "settle", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "splitCalculation",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "updateEscrowFee",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "updateGovernance",
    data: BytesLike
  ): Result;

  events: {};
}

export interface IUnicrow extends BaseContract {
  contractName: "IUnicrow";
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: IUnicrowInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    challenge(
      escrowId: BigNumberish,
      split: [BigNumberish, BigNumberish, BigNumberish, BigNumberish],
      consensus: [BigNumberish, BigNumberish],
      challengeStart: BigNumberish,
      challengeEnd: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    getEscrow(
      escrowId: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    pay(
      data: DepositInputStruct,
      arbitrator: string,
      arbitratorFee: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    refund(
      escrowId: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    release(
      escrowId: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    setClaimed(
      escrowId: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    settle(
      escrowId: BigNumberish,
      split: [BigNumberish, BigNumberish, BigNumberish, BigNumberish],
      consensus: [BigNumberish, BigNumberish],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    splitCalculation(
      currentSplit: [
        BigNumberish,
        BigNumberish,
        BigNumberish,
        BigNumberish,
        BigNumberish
      ],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    updateEscrowFee(
      fee: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    updateGovernance(
      governance: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  challenge(
    escrowId: BigNumberish,
    split: [BigNumberish, BigNumberish, BigNumberish, BigNumberish],
    consensus: [BigNumberish, BigNumberish],
    challengeStart: BigNumberish,
    challengeEnd: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  getEscrow(
    escrowId: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  pay(
    data: DepositInputStruct,
    arbitrator: string,
    arbitratorFee: BigNumberish,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  refund(
    escrowId: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  release(
    escrowId: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  setClaimed(
    escrowId: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  settle(
    escrowId: BigNumberish,
    split: [BigNumberish, BigNumberish, BigNumberish, BigNumberish],
    consensus: [BigNumberish, BigNumberish],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  splitCalculation(
    currentSplit: [
      BigNumberish,
      BigNumberish,
      BigNumberish,
      BigNumberish,
      BigNumberish
    ],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  updateEscrowFee(
    fee: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  updateGovernance(
    governance: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    challenge(
      escrowId: BigNumberish,
      split: [BigNumberish, BigNumberish, BigNumberish, BigNumberish],
      consensus: [BigNumberish, BigNumberish],
      challengeStart: BigNumberish,
      challengeEnd: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    getEscrow(
      escrowId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<EscrowStructOutput>;

    pay(
      data: DepositInputStruct,
      arbitrator: string,
      arbitratorFee: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    refund(escrowId: BigNumberish, overrides?: CallOverrides): Promise<void>;

    release(escrowId: BigNumberish, overrides?: CallOverrides): Promise<void>;

    setClaimed(
      escrowId: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    settle(
      escrowId: BigNumberish,
      split: [BigNumberish, BigNumberish, BigNumberish, BigNumberish],
      consensus: [BigNumberish, BigNumberish],
      overrides?: CallOverrides
    ): Promise<void>;

    splitCalculation(
      currentSplit: [
        BigNumberish,
        BigNumberish,
        BigNumberish,
        BigNumberish,
        BigNumberish
      ],
      overrides?: CallOverrides
    ): Promise<[number, number, number, number]>;

    updateEscrowFee(
      fee: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    updateGovernance(
      governance: string,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {};

  estimateGas: {
    challenge(
      escrowId: BigNumberish,
      split: [BigNumberish, BigNumberish, BigNumberish, BigNumberish],
      consensus: [BigNumberish, BigNumberish],
      challengeStart: BigNumberish,
      challengeEnd: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    getEscrow(
      escrowId: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    pay(
      data: DepositInputStruct,
      arbitrator: string,
      arbitratorFee: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    refund(
      escrowId: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    release(
      escrowId: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    setClaimed(
      escrowId: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    settle(
      escrowId: BigNumberish,
      split: [BigNumberish, BigNumberish, BigNumberish, BigNumberish],
      consensus: [BigNumberish, BigNumberish],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    splitCalculation(
      currentSplit: [
        BigNumberish,
        BigNumberish,
        BigNumberish,
        BigNumberish,
        BigNumberish
      ],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    updateEscrowFee(
      fee: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    updateGovernance(
      governance: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    challenge(
      escrowId: BigNumberish,
      split: [BigNumberish, BigNumberish, BigNumberish, BigNumberish],
      consensus: [BigNumberish, BigNumberish],
      challengeStart: BigNumberish,
      challengeEnd: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    getEscrow(
      escrowId: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    pay(
      data: DepositInputStruct,
      arbitrator: string,
      arbitratorFee: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    refund(
      escrowId: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    release(
      escrowId: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    setClaimed(
      escrowId: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    settle(
      escrowId: BigNumberish,
      split: [BigNumberish, BigNumberish, BigNumberish, BigNumberish],
      consensus: [BigNumberish, BigNumberish],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    splitCalculation(
      currentSplit: [
        BigNumberish,
        BigNumberish,
        BigNumberish,
        BigNumberish,
        BigNumberish
      ],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    updateEscrowFee(
      fee: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    updateGovernance(
      governance: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}
