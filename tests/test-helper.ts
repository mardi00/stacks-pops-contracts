
import { Clarinet, Tx, Chain, Account, types, Contract } from 'https://deno.land/x/clarinet@v0.27.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';


const version = 'v1';
export const STACKS_POPS_CONTRACT_NAME = `stacks-pops-${version}`;
export const FROZEN_STACKS_POPS_CONTRACT_NAME = `frozen-stacks-pops-${version}`;
export const STACKS_POPS_ICE_MACHINE_CONTRACT_NAME = `stacks-pops-ice-machine-${version}`;
export const STACKS_POPS_ICE_CONTRACT_NAME = `stacks-pops-ice-${version}`;
export const INITIAL_ICE = 1380000000;
export const MIN_FREEZING_BLOCKS = 1000; 
export const ICE_PER_POP_PER_BLOCK = 1;
export const MELT_TIME = 48000;
export const MELT_RATE = 4;
export const REWARD_RATE = 1;
export const MIN_BALANCE = 1618;
export const STACKSPOPS = types.list([types.uint(10000), types.uint(1), types.uint(9999)]);
export const STACKSPOPS_INT = [10000, 1, 9999];
export const STACKSPOPS_INVALID = types.list([types.uint(10000), types.uint(1), types.uint(722)]);
const CONTRACT_DEPLOYER = "ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE";

export const mintPopsAndTest = (caller: string, chain: Chain) => {
  const calls = [];
  for (let i = 0; i < 3; i++) {
    calls.push(Tx.contractCall(STACKS_POPS_CONTRACT_NAME, 'mint', [], caller));
  }
  const mintBlock = chain.mineBlock(calls);
  assertEquals(mintBlock.receipts[0].result, '(ok true)', 'Should be able to mint');
  return mintBlock;
};

export const flipPowerSwitchAndTest = (caller: string, chain: Chain, expected: string) => {
  const flipPowerSwitchBlock = chain.mineBlock([
    Tx.contractCall(STACKS_POPS_ICE_MACHINE_CONTRACT_NAME, 'flip-power-switch', [], caller),
  ])
  assertEquals(flipPowerSwitchBlock.receipts[0].result, expected, `Should be ${expected} got ${flipPowerSwitchBlock.receipts[0].result}`);
  return flipPowerSwitchBlock;
};


export const checkMachineStateAndTest = (owner: string, chain: Chain, expected: string) => {
  const state = chain.callReadOnlyFn(STACKS_POPS_ICE_MACHINE_CONTRACT_NAME, 'get-machine-state', [], owner);
  assertEquals(state.result, expected, `Should have ${expected} but result is ${state.result}`);
  return state;
};



export const checkPopsBalanceByOwner = (owner: string, chain: Chain, expected: string) => {
  const balance = chain.callReadOnlyFn(STACKS_POPS_CONTRACT_NAME, 'get-pops-by-owner', [types.principal(owner)], owner);
  assertEquals(balance.result, expected, `Should have ${expected} but result is ${balance.result}`);
  return balance;
};

export const checkFrozenBalanceByOwner = (owner: string, chain: Chain, expected: string) => {
  const frozenBalance = chain.callReadOnlyFn(FROZEN_STACKS_POPS_CONTRACT_NAME, 'get-balance', [types.principal(owner)], owner);
  assertEquals(frozenBalance.result, expected, `Should have ${expected} but got ${frozenBalance.result}`);
  return frozenBalance;
};

export const checkIceBalance = (owner: string, chain: Chain, expected: string) => {
  const iceBalance = chain.callReadOnlyFn(STACKS_POPS_ICE_CONTRACT_NAME, 'get-balance', [types.principal(owner)], owner);
  assertEquals(iceBalance.result, expected,  `Balance should be ${expected} but got ${iceBalance.result}`);
  return iceBalance;
};


export const checkIceBalanceMachine = (owner: string, chain: Chain, expected: string) => {
  const iceMachineBalance = chain.callReadOnlyFn(STACKS_POPS_ICE_MACHINE_CONTRACT_NAME, 'get-machine-ice-balance', [], owner);
  assertEquals(iceMachineBalance.result, expected,  `Balance should be ${expected} but got ${iceMachineBalance.result}`);
  return iceMachineBalance;
};

export const freezePopsAndTest = (caller: string, chain: Chain, expected: string, pops: any) => {
  const freezeBlock = chain.mineBlock([
    Tx.contractCall(STACKS_POPS_ICE_MACHINE_CONTRACT_NAME, 'freeze-many', [pops], caller),
  ]);
  assertEquals(freezeBlock.receipts[0].result, expected, `Should be ${expected} but got ${freezeBlock.receipts[0].result}`);
  if(freezeBlock.receipts[0].result == '(ok true)') checkFreezeTokenEvents(freezeBlock, caller);
  return freezeBlock;
};

export const checkFreezeTokenEvents = (freezeBlock: any, caller: string) => {
  STACKSPOPS_INT.forEach((id) => {
    freezeBlock.receipts[0].events.expectNonFungibleTokenTransferEvent(
      types.uint(id),
      caller, 
      `${CONTRACT_DEPLOYER}.${STACKS_POPS_ICE_MACHINE_CONTRACT_NAME}`,
      `${CONTRACT_DEPLOYER}.${STACKS_POPS_CONTRACT_NAME}`,
      `stacks-pops`,
    );
    freezeBlock.receipts[0].events.expectNonFungibleTokenMintEvent(
      types.uint(id),
      caller, 
      `${CONTRACT_DEPLOYER}.${FROZEN_STACKS_POPS_CONTRACT_NAME}`,
      `frozen-stacks-pops`,
    );
  });
}

export const defrostPopsAndTest = (caller: string, chain: Chain, expected: string, pops: any) => {
  const defrostBlock = chain.mineBlock([
    Tx.contractCall(STACKS_POPS_ICE_MACHINE_CONTRACT_NAME, 'defrost-many', [pops], caller),
  ]);
  assertEquals(defrostBlock.receipts[0].result, expected,  `Should be ${expected} but got ${defrostBlock.receipts[0].result}`);
  if(defrostBlock.receipts[0].result == '(ok true)') checkDefrostTokenEvents(defrostBlock, caller);
  return defrostBlock;
};

export const checkDefrostTokenEvents = (freezeBlock: any, caller: string) => {
  STACKSPOPS_INT.forEach((id) => {
    freezeBlock.receipts[0].events.expectNonFungibleTokenTransferEvent(
      types.uint(id),
     `${CONTRACT_DEPLOYER}.${STACKS_POPS_ICE_MACHINE_CONTRACT_NAME}`,
      caller, 
      `${CONTRACT_DEPLOYER}.${STACKS_POPS_CONTRACT_NAME}`,
      `stacks-pops`,
    );
    freezeBlock.receipts[0].events.expectNonFungibleTokenBurnEvent(
      types.uint(id),
      caller, 
      `${CONTRACT_DEPLOYER}.${FROZEN_STACKS_POPS_CONTRACT_NAME}`,
      `frozen-stacks-pops`,
    );
  });
}

export const sendHeatwaveAndTest = (caller: string, target: string, chain: Chain, expected: string) => {
  const heatWaveBlock = chain.mineBlock([
    Tx.contractCall(STACKS_POPS_ICE_CONTRACT_NAME, 'heat-wave-at', [types.principal(target)], caller),
  ]);
  assertEquals(heatWaveBlock.receipts[0].result, expected, `Should ${expected} got ${heatWaveBlock.receipts[0].result}`);
};

export const checkFreezeBlockAndTest = (owner: string, chain: Chain, id: number, expected: string) => {
  const freezeBlock = chain.callReadOnlyFn(STACKS_POPS_ICE_MACHINE_CONTRACT_NAME, 'get-freeze-block-height', [types.uint(id)], owner);
  assertEquals(freezeBlock.result, expected,  `Should be ${expected} but got ${freezeBlock.result}`);
  return freezeBlock;
};