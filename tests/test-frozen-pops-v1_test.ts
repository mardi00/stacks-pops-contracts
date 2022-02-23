
import { Clarinet, Tx, Chain, Account, types, Contract } from 'https://deno.land/x/clarinet@v0.13.0/index.ts';
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
  STACKSPOPS_INVALID
} from './test-helper.ts';


Clarinet.test({
  name: "Ensure that we can't change set-mint-address",
  async fn(chain: Chain, accounts: Map<string, Account>) {
      let deployer = accounts.get('deployer')!;
      let wallet1 = accounts.get('wallet_1')!;
      const mintAddressBlock = chain.mineBlock([
      Tx.contractCall('test-frozen-pops-v3', 'set-mint-address', [], wallet1.address),
    ]);
    const expected = `(err u506)`;
    assertEquals(mintAddressBlock.receipts[0].result, expected, `Should be ${expected} but got ${mintAddressBlock.receipts[0].result}`);
  },
});


Clarinet.test({
  name: "External can't mint pop",
  async fn(chain: Chain, accounts: Map<string, Account>) {
      let deployer = accounts.get('deployer')!;
      let wallet1 = accounts.get('wallet_1')!;
      const mintAddressBlock = chain.mineBlock([
      Tx.contractCall('test-frozen-pops-v3', 'mint', [types.principal(wallet1.address), types.uint(1)], wallet1.address),
    ]);
    const expected = `(err u401)`;
    assertEquals(mintAddressBlock.receipts[0].result, expected, `Should be ${expected} but got ${mintAddressBlock.receipts[0].result}`);
  },
});


Clarinet.test({
  name: "External can't burn pop",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;
    flipPowerSwitchAndTest(deployer.address, chain);
    mintPopsAndTest(deployer.address, chain);
    freezePopsAndTest(deployer.address, chain, '(ok true)', STACKSPOPS);

    const burnAddressBlock = chain.mineBlock([
      Tx.contractCall('test-frozen-pops-v3', 'burn', [types.uint(1), types.principal(deployer.address)], deployer.address),
    ]);
    const expected = `(err u401)`;
    assertEquals(burnAddressBlock.receipts[0].result, expected, `Should be ${expected} but got ${burnAddressBlock.receipts[0].result}`);
  },
});
