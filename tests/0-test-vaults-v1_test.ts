
import { Clarinet, Tx, Chain, Account, types, Contract } from 'https://deno.land/x/clarinet@v0.27.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';
import {
  mintPopsAndTest,
  freezePopsAndTest,
  flipPowerSwitchAndTest,
  FROZEN_STACKS_POPS_CONTRACT_NAME,
  STACKSPOPS_INT,
  VAULT_CONTRACT_NAME
} from './test-helper.ts';


Clarinet.test({
  name: "External can't pull pop",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;
    flipPowerSwitchAndTest(deployer.address, chain, '(ok true)');
    mintPopsAndTest(deployer.address, chain);
    freezePopsAndTest(deployer.address, chain, '(ok true)', STACKSPOPS_INT);

    const pullAddressBlock = chain.mineBlock([
      Tx.contractCall(VAULT_CONTRACT_NAME(1), 'pull-pop', [types.uint(1), types.principal(deployer.address)], deployer.address),
    ]);
    const expected = `(err u401)`;
    assertEquals(pullAddressBlock.receipts[0].result, expected, `Should be ${expected} but got ${pullAddressBlock.receipts[0].result}`);
  },
});


Clarinet.test({
  name: "External can't push pop",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;
    flipPowerSwitchAndTest(deployer.address, chain, '(ok true)');
    mintPopsAndTest(deployer.address, chain);

    const pushAddressBlock = chain.mineBlock([
      Tx.contractCall(VAULT_CONTRACT_NAME(1), 'push-pop', [types.uint(1)], deployer.address),
    ]);
    const expected = `(err u401)`;
    assertEquals(pushAddressBlock.receipts[0].result, expected, `Should be ${expected} but got ${pushAddressBlock.receipts[0].result}`);
  },
});
