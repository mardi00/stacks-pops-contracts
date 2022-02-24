
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
  STACKSPOPS_INVALID,
  STACKS_POPS_CONTRACT_NAME,
  FROZEN_STACKS_POPS_CONTRACT_NAME,
  STACKS_POPS_ICE_MACHINE_CONTRACT_NAME,
  STACKS_POPS_ICE_CONTRACT_NAME
} from './test-helper.ts';


Clarinet.test({
  name: "Ensure that we can't change set-mint-address",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;
    let wallet1 = accounts.get('wallet_1')!;
    const mintAddressBlock = chain.mineBlock([
      Tx.contractCall(FROZEN_STACKS_POPS_CONTRACT_NAME, 'set-mint-address', [], wallet1.address),
    ]);
    const expected = `(err u506)`;
    assertEquals(mintAddressBlock.receipts[0].result, expected, `Should be ${expected} but got ${mintAddressBlock.receipts[0].result}`);
  },
});

Clarinet.test({
  name: "Ensure that we can set-base-uri",
  async fn(chain: Chain, accounts: Map<string, Account>) {
      let deployer = accounts.get('deployer')!;

    const block = chain.mineBlock([
      Tx.contractCall(FROZEN_STACKS_POPS_CONTRACT_NAME, 'set-base-uri', [types.ascii('loool')], deployer.address),
    ]);
    const expected = `(ok true)`;
    assertEquals(block.receipts[0].result, expected, `Should be ${expected} but got ${block.receipts[0].result}`);
  },
});

Clarinet.test({
  name: "Ensure that we can't set-base-uri when metadata are frozen",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;

    const freeze = chain.mineBlock([
      Tx.contractCall(FROZEN_STACKS_POPS_CONTRACT_NAME, 'freeze-metadata', [], deployer.address),
    ]);
    let expected = `(ok true)`;
    assertEquals(freeze.receipts[0].result, expected, `Should be ${expected} but got ${freeze.receipts[0].result}`);


    const block = chain.mineBlock([
      Tx.contractCall(FROZEN_STACKS_POPS_CONTRACT_NAME, 'set-base-uri', [types.ascii('loool')], deployer.address),
    ]);
    expected = `(err u505)`;
    assertEquals(block.receipts[0].result, expected, `Should be ${expected} but got ${block.receipts[0].result}`);
  },
});

Clarinet.test({
  name: "Ensure that we can get-contract-uri",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;
    const uri = chain.callReadOnlyFn(FROZEN_STACKS_POPS_CONTRACT_NAME, 'get-contract-uri', [], deployer.address);
    const expected = `(ok "ipfs://QmayHCoY25enr4XmBQxyVFKSU9tkRPy64JywNDDaK9c8MT/frozen-stacks-pops.json")`;
    assertEquals(uri.result, expected, `Should be ${expected} but got ${uri.result}`);
  },
});

Clarinet.test({
  name: "Ensure that we can get-token-uri for u99",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;
    const uri = chain.callReadOnlyFn(FROZEN_STACKS_POPS_CONTRACT_NAME, 'get-token-uri', [types.uint(99)], deployer.address);
    const expected = `(ok (some "ipfs://QmayHCoY25enr4XmBQxyVFKSU9tkRPy64JywNDDaK9c8MT/frozen-stacks-pops-{id}.json"))`;
    assertEquals(uri.result, expected, `Should be ${expected} but got ${uri.result}`);
  },
});

Clarinet.test({
  name: "External can't mint pop",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;
    let wallet1 = accounts.get('wallet_1')!;
    const mintAddressBlock = chain.mineBlock([
      Tx.contractCall(FROZEN_STACKS_POPS_CONTRACT_NAME, 'mint', [types.principal(wallet1.address), types.uint(1)], wallet1.address),
    ]);
    const expected = `(err u401)`;
    assertEquals(mintAddressBlock.receipts[0].result, expected, `Should be ${expected} but got ${mintAddressBlock.receipts[0].result}`);
  },
});


Clarinet.test({
  name: "External can't burn pop",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;
    flipPowerSwitchAndTest(deployer.address, chain, '(ok true)');
    mintPopsAndTest(deployer.address, chain);
    freezePopsAndTest(deployer.address, chain, '(ok true)', STACKSPOPS);

    const burnAddressBlock = chain.mineBlock([
      Tx.contractCall(FROZEN_STACKS_POPS_CONTRACT_NAME, 'burn', [types.uint(1), types.principal(deployer.address)], deployer.address),
    ]);
    const expected = `(err u401)`;
    assertEquals(burnAddressBlock.receipts[0].result, expected, `Should be ${expected} but got ${burnAddressBlock.receipts[0].result}`);
  },
});
