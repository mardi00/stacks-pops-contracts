
import { Clarinet, Tx, Chain, Account, types, Contract } from 'https://deno.land/x/clarinet@v0.27.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';
import {
  mintPopsAndTest,
  checkIceBalanceMachine,
  checkFrozenBalanceByOwner,
  checkPopsBalanceByOwner,
  freezePopsAndTest,
  flipPowerSwitchAndTest,
  defrostPopsAndTest,
  checkIceBalance,
  sendHeatwaveAndTest,
  INITIAL_ICE,
  MIN_FREEZING_BLOCKS,
  ICE_PER_POP_PER_BLOCK,
  MELT_TIME,
  MELT_RATE,
  REWARD_RATE,
  MIN_BALANCE,
  STACKSPOPS,
  STACKS_POPS_CONTRACT_NAME,
  FROZEN_STACKS_POPS_CONTRACT_NAME,
  STACKS_POPS_ICE_MACHINE_CONTRACT_NAME,
  STACKS_POPS_ICE_CONTRACT_NAME
} from './test-helper.ts';


Clarinet.test({
  name: "Ensure that we can't set-ice-machine",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;
    const block = chain.mineBlock([
      Tx.contractCall(STACKS_POPS_ICE_CONTRACT_NAME, 'set-ice-machine', [types.principal(deployer.address)], deployer.address),
    ]);
    const expected = `(err u504)`;
    assertEquals(block.receipts[0].result, expected, `Should be ${expected} but got ${block.receipts[0].result}`);
  },
});

