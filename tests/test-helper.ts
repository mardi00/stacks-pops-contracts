
import { Clarinet, Tx, Chain, Account, types, Contract } from 'https://deno.land/x/clarinet@v0.13.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

export const INITIAL_ICE = 1380000000;
export const MIN_FREEZING_BLOCKS = 2000;
export const ICE_PER_POP_PER_BLOCK = 1;
export const MELT_TIME = 48000;
export const MELT_RATE = 4;
export const REWARD_RATE = 1;
export const MIN_BALANCE = 1618;


export const STACKSPOPS = types.list([types.uint(10000), types.uint(1), types.uint(9999)]);
export const STACKSPOPS_INVALID = types.list([types.uint(10000), types.uint(1), types.uint(722)]);

export const mintPopsAndTest = (caller: string, chain: Chain) => {
  const calls = [];
  for (let i = 0; i < 3; i++) {
    calls.push(Tx.contractCall('test-pops-v5', 'mint', [], caller));
  }
  const mintBlock = chain.mineBlock(calls);
  assertEquals(mintBlock.receipts[0].result, '(ok true)', 'Should be able to mint');
  return mintBlock;
};

export const flipPowerSwitchAndTest = (caller: string, chain: Chain) => {
  const flipPowerSwitchBlock = chain.mineBlock([
    Tx.contractCall('test-pops-ice-machine-v5', 'flip-power-switch', [], caller),
  ])
  assertEquals(flipPowerSwitchBlock.receipts[0].result, '(ok true)', 'Should be able to flip machine switch');
  return flipPowerSwitchBlock;
};


export const checkPopsBalanceByOwner = (owner: string, chain: Chain, expected: string) => {
  const balance = chain.callReadOnlyFn('test-pops-v5', 'get-pops-by-owner', [types.principal(owner)], owner);
  assertEquals(balance.result, expected, `Should have ${expected} but result is ${balance.result}`);
  return balance;
};

export const checkFrozenBalanceByOwner = (owner: string, chain: Chain, expected: string) => {
  const frozenBalance = chain.callReadOnlyFn('test-frozen-pops-v5', 'get-balance', [types.principal(owner)], owner);
  assertEquals(frozenBalance.result, expected, `Should have ${expected} but got ${frozenBalance.result}`);
  return frozenBalance;
};

export const checkIceBalance = (owner: string, chain: Chain, expected: string) => {
  const iceBalance = chain.callReadOnlyFn('test-pops-ice-v5', 'get-balance', [types.principal(owner)], owner);
  assertEquals(iceBalance.result, expected,  `Balance should be ${expected} but got ${iceBalance.result}`);
  return iceBalance;
};


export const checkIceBalanceMachine = (owner: string, chain: Chain, expected: string) => {
  const iceMachineBalance = chain.callReadOnlyFn('test-pops-ice-machine-v5', 'get-machine-ice-balance', [], owner);
  assertEquals(iceMachineBalance.result, expected,  `Balance should be ${expected} but got ${iceMachineBalance.result}`);
  return iceMachineBalance;
};

export const freezePopsAndTest = (caller: string, chain: Chain, expected: string, pops: any) => {
  const freezeBlock = chain.mineBlock([
    Tx.contractCall('test-pops-ice-machine-v5', 'freeze-many', [pops], caller),
  ]);
  assertEquals(freezeBlock.receipts[0].result, expected, `Should be ${expected} but got ${freezeBlock.receipts[0].result}`);
  return freezeBlock;
};

export const defrostPopsAndTest = (caller: string, chain: Chain, expected: string, pops: any) => {
  const defrostBlock = chain.mineBlock([
    Tx.contractCall('test-pops-ice-machine-v5', 'defrost-many', [pops], caller),
  ]);
  assertEquals(defrostBlock.receipts[0].result, expected,  `Should be ${expected} but got ${defrostBlock.receipts[0].result}`);
  return defrostBlock;
};

export const sendHeatwaveAndTest = (caller: string, target: string, chain: Chain, expected: string) => {
  const heatWaveBlock = chain.mineBlock([
    Tx.contractCall('test-pops-ice-v5', 'heat-wave-at', [types.principal(target)], caller),
  ]);
  assertEquals(heatWaveBlock.receipts[0].result, expected, `Should ${expected} got ${heatWaveBlock.receipts[0].result}`);
};
