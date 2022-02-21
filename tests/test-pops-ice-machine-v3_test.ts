
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.13.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

const MIN_FREEZING_BLOCKS = 10;
const ICE_PER_POP_PER_BLOCK = 10;
const MELT_TIME = 30;
const MELT_RATE = 4;
const REWARD_RATE = 1;

Clarinet.test({
  name: "Ensure that pops can't be frozen if the machine is off",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;

    const mintBlock = chain.mineBlock([
      Tx.contractCall('test-pops-v3', 'mint', [], deployer.address),
      Tx.contractCall('test-pops-v3', 'mint', [], deployer.address),
      Tx.contractCall('test-pops-v3', 'mint', [], deployer.address),
    ]);
    
    assertEquals(mintBlock.receipts[0].result, '(ok true)', 'Should be able to mint');

    let balance = chain.callReadOnlyFn('test-pops-v3', 'get-pops-by-owner', [types.principal(deployer.address)], deployer.address);
    assertEquals(balance.result, '(ok [u10000, u1, u9999])', 'Should have 3 pops');

    const freezeBlock = chain.mineBlock([
      Tx.contractCall('test-pops-ice-machine-v3', 'freeze-many', [types.list([types.uint(10000), types.uint(1), types.uint(9999)])], deployer.address),
    ]);
    console.log(freezeBlock);
    assertEquals(freezeBlock.receipts[0].result, '(err u500)', 'Shouldnt be able to freeze');
  },
});

Clarinet.test({
  name: "Ensure that the machine can be switched on and we can freeze pops",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;

    const flipPowerSwitchBlock = chain.mineBlock([
      Tx.contractCall('test-pops-ice-machine-v3', 'flip-power-switch', [], deployer.address),
    ])
    assertEquals(flipPowerSwitchBlock.receipts[0].result, '(ok true)', 'Should turn on machine');

    const mintBlock = chain.mineBlock([
      Tx.contractCall('test-pops-v3', 'mint', [], deployer.address),
      Tx.contractCall('test-pops-v3', 'mint', [], deployer.address),
      Tx.contractCall('test-pops-v3', 'mint', [], deployer.address),
    ]);
    assertEquals(mintBlock.receipts[0].result, '(ok true)', 'Should be able to mint');

    let balance = chain.callReadOnlyFn('test-pops-v3', 'get-pops-by-owner', [types.principal(deployer.address)], deployer.address);
    assertEquals(balance.result, '(ok [u10000, u1, u9999])', 'Should have 3 pops');


    const freezeBlock = chain.mineBlock([
      Tx.contractCall('test-pops-ice-machine-v3', 'freeze-many', [types.list([types.uint(10000), types.uint(1), types.uint(9999)])], deployer.address),
    ]);
    assertEquals(freezeBlock.receipts[0].result, '(ok true)', 'Should be able to freeze');


    balance = chain.callReadOnlyFn('test-pops-v3', 'get-pops-by-owner', [types.principal(deployer.address)], deployer.address);
    assertEquals(balance.result, '(ok [])', 'Should have 0 pops');

    const frozenBalance = chain.callReadOnlyFn('test-frozen-pops-v3', 'get-balance', [types.principal(deployer.address)], deployer.address);
    assertEquals(frozenBalance.result, 'u3', 'Should have 3 frozen pops');
  },
});

Clarinet.test({
  name: "Ensure that we can't defrost too early",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;

    const flipPowerSwitchBlock = chain.mineBlock([
      Tx.contractCall('test-pops-ice-machine-v3', 'flip-power-switch', [], deployer.address),
    ])
    assertEquals(flipPowerSwitchBlock.receipts[0].result, '(ok true)', 'Should turn on machine');

    const mintBlock = chain.mineBlock([
      Tx.contractCall('test-pops-v3', 'mint', [], deployer.address),
      Tx.contractCall('test-pops-v3', 'mint', [], deployer.address),
      Tx.contractCall('test-pops-v3', 'mint', [], deployer.address),
    ]);
    assertEquals(mintBlock.receipts[0].result, '(ok true)', 'Should be able to mint');

    let balance = chain.callReadOnlyFn('test-pops-v3', 'get-pops-by-owner', [types.principal(deployer.address)], deployer.address);
    assertEquals(balance.result, '(ok [u10000, u1, u9999])', 'Should have 3 pops');


    const freezeBlock = chain.mineBlock([
      Tx.contractCall('test-pops-ice-machine-v3', 'freeze-many', [types.list([types.uint(10000), types.uint(1), types.uint(9999)])], deployer.address),
    ]);
    assertEquals(freezeBlock.receipts[0].result, '(ok true)', 'Should be able to freeze');


    balance = chain.callReadOnlyFn('test-pops-v3', 'get-pops-by-owner', [types.principal(deployer.address)], deployer.address);
    assertEquals(balance.result, '(ok [])', 'Should have 0 pops');

    const frozenBalance = chain.callReadOnlyFn('test-frozen-pops-v3', 'get-balance', [types.principal(deployer.address)], deployer.address);
    assertEquals(frozenBalance.result, 'u3', 'Should have 3 frozen pops');

    // TOO EARLY
    const defrostBlockFail = chain.mineBlock([
      Tx.contractCall('test-pops-ice-machine-v3', 'defrost-many', [types.list([types.uint(10000), types.uint(1), types.uint(9999)])], deployer.address),
    ]);
    assertEquals(defrostBlockFail.receipts[0].result, '(err u501)',  'Shouldnt be able to defrost');
  },
});

Clarinet.test({
  name:  `Ensure that we can defrost after ${MIN_FREEZING_BLOCKS} blocks`,
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;

    const flipPowerSwitchBlock = chain.mineBlock([
      Tx.contractCall('test-pops-ice-machine-v3', 'flip-power-switch', [], deployer.address),
    ])
    assertEquals(flipPowerSwitchBlock.receipts[0].result, '(ok true)', 'Should turn on machine');

    const mintBlock = chain.mineBlock([
      Tx.contractCall('test-pops-v3', 'mint', [], deployer.address),
      Tx.contractCall('test-pops-v3', 'mint', [], deployer.address),
      Tx.contractCall('test-pops-v3', 'mint', [], deployer.address),
    ]);
    assertEquals(mintBlock.receipts[0].result, '(ok true)', 'Should be able to mint');

    let balance = chain.callReadOnlyFn('test-pops-v3', 'get-pops-by-owner', [types.principal(deployer.address)], deployer.address);
    assertEquals(balance.result, '(ok [u10000, u1, u9999])', 'Should have 3 pops');


    const freezeBlock = chain.mineBlock([
      Tx.contractCall('test-pops-ice-machine-v3', 'freeze-many', [types.list([types.uint(10000), types.uint(1), types.uint(9999)])], deployer.address),
    ]);
    assertEquals(freezeBlock.receipts[0].result, '(ok true)', 'Should be able to freeze');


    balance = chain.callReadOnlyFn('test-pops-v3', 'get-pops-by-owner', [types.principal(deployer.address)], deployer.address);
    assertEquals(balance.result, '(ok [])', 'Should have 0 pops');

    let frozenBalance = chain.callReadOnlyFn('test-frozen-pops-v3', 'get-balance', [types.principal(deployer.address)], deployer.address);
    assertEquals(frozenBalance.result, 'u3', 'Should have 3 frozen pops');

    // We mine empty blocks 
    chain.mineEmptyBlock(MIN_FREEZING_BLOCKS);


    const defrostBlock = chain.mineBlock([
      Tx.contractCall('test-pops-ice-machine-v3', 'defrost-many', [types.list([types.uint(10000), types.uint(1), types.uint(9999)])], deployer.address),
    ]);
    assertEquals(defrostBlock.receipts[0].result, '(ok true)',  'Should be able to defrost');

    frozenBalance = chain.callReadOnlyFn('test-frozen-pops-v3', 'get-balance', [types.principal(deployer.address)], deployer.address);
    assertEquals(frozenBalance.result, 'u0', 'Should have 0 frozen pops');

    const iceBalance = chain.callReadOnlyFn('test-pops-ice-v3', 'get-balance', [types.principal(deployer.address)], deployer.address);
    const calculBalance = (chain.blockHeight - freezeBlock.height) * ICE_PER_POP_PER_BLOCK * 3;
    assertEquals(iceBalance.result, `(ok u${calculBalance})`,  `Balance should be ${calculBalance}`);
  },
});

Clarinet.test({
  name:  `Ensure that we can't send a heat wave too early`,
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;
    let attacker = accounts.get('wallet_1')!;

    const flipPowerSwitchBlock = chain.mineBlock([
      Tx.contractCall('test-pops-ice-machine-v3', 'flip-power-switch', [], deployer.address),
    ])
    assertEquals(flipPowerSwitchBlock.receipts[0].result, '(ok true)', 'Should turn on machine');

    const mintBlock = chain.mineBlock([
      Tx.contractCall('test-pops-v3', 'mint', [], deployer.address),
      Tx.contractCall('test-pops-v3', 'mint', [], deployer.address),
      Tx.contractCall('test-pops-v3', 'mint', [], deployer.address),
    ]);
    assertEquals(mintBlock.receipts[0].result, '(ok true)', 'Should be able to mint');

    let balance = chain.callReadOnlyFn('test-pops-v3', 'get-pops-by-owner', [types.principal(deployer.address)], deployer.address);
    assertEquals(balance.result, '(ok [u10000, u1, u9999])', 'Should have 3 pops');


    const freezeBlock = chain.mineBlock([
      Tx.contractCall('test-pops-ice-machine-v3', 'freeze-many', [types.list([types.uint(10000), types.uint(1), types.uint(9999)])], deployer.address),
    ]);
    assertEquals(freezeBlock.receipts[0].result, '(ok true)', 'Should be able to freeze');


    balance = chain.callReadOnlyFn('test-pops-v3', 'get-pops-by-owner', [types.principal(deployer.address)], deployer.address);
    assertEquals(balance.result, '(ok [])', 'Should have 0 pops');

    let frozenBalance = chain.callReadOnlyFn('test-frozen-pops-v3', 'get-balance', [types.principal(deployer.address)], deployer.address);
    assertEquals(frozenBalance.result, 'u3', 'Should have 3 frozen pops');

    // We mine empty blocks
    chain.mineEmptyBlock(MIN_FREEZING_BLOCKS);


    const defrostBlock = chain.mineBlock([
      Tx.contractCall('test-pops-ice-machine-v3', 'defrost-many', [types.list([types.uint(10000), types.uint(1), types.uint(9999)])], deployer.address),
    ]);
    assertEquals(defrostBlock.receipts[0].result, '(ok true)',  'Should be able to defrost');

    frozenBalance = chain.callReadOnlyFn('test-frozen-pops-v3', 'get-balance', [types.principal(deployer.address)], deployer.address);
    assertEquals(frozenBalance.result, 'u0', 'Should have 0 frozen pops');

    const iceBalance = chain.callReadOnlyFn('test-pops-ice-v3', 'get-balance', [types.principal(deployer.address)], deployer.address);
    const calculBalance = (chain.blockHeight - freezeBlock.height) * ICE_PER_POP_PER_BLOCK * 3;
    assertEquals(iceBalance.result, `(ok u${calculBalance})`,  `Balance should be ${calculBalance}`);

    const heatWaveBlock = chain.mineBlock([
      Tx.contractCall('test-pops-ice-v3', 'heat-wave-at', [types.principal(deployer.address)], attacker.address),
    ]);
    assertEquals(heatWaveBlock.receipts[0].result, '(err u501)', 'Shouldnt be able to send a heat wave');
  },
});


Clarinet.test({
  name:  `Ensure that we can send a heat wave after ${MELT_TIME} block`,
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;
    let attacker = accounts.get('wallet_1')!;

    const flipPowerSwitchBlock = chain.mineBlock([
      Tx.contractCall('test-pops-ice-machine-v3', 'flip-power-switch', [], deployer.address),
    ])
    assertEquals(flipPowerSwitchBlock.receipts[0].result, '(ok true)', 'Should turn on machine');

    const mintBlock = chain.mineBlock([
      Tx.contractCall('test-pops-v3', 'mint', [], deployer.address),
      Tx.contractCall('test-pops-v3', 'mint', [], deployer.address),
      Tx.contractCall('test-pops-v3', 'mint', [], deployer.address),
    ]);
    assertEquals(mintBlock.receipts[0].result, '(ok true)', 'Should be able to mint');

    let balance = chain.callReadOnlyFn('test-pops-v3', 'get-pops-by-owner', [types.principal(deployer.address)], deployer.address);
    assertEquals(balance.result, '(ok [u10000, u1, u9999])', 'Should have 3 pops');


    const freezeBlock = chain.mineBlock([
      Tx.contractCall('test-pops-ice-machine-v3', 'freeze-many', [types.list([types.uint(10000), types.uint(1), types.uint(9999)])], deployer.address),
    ]);
    assertEquals(freezeBlock.receipts[0].result, '(ok true)', 'Should be able to freeze');


    balance = chain.callReadOnlyFn('test-pops-v3', 'get-pops-by-owner', [types.principal(deployer.address)], deployer.address);
    assertEquals(balance.result, '(ok [])', 'Should have 0 pops');

    let frozenBalance = chain.callReadOnlyFn('test-frozen-pops-v3', 'get-balance', [types.principal(deployer.address)], deployer.address);
    assertEquals(frozenBalance.result, 'u3', 'Should have 3 frozen pops');

    // We mine empty blocks 
    chain.mineEmptyBlock(MIN_FREEZING_BLOCKS);


    const defrostBlock = chain.mineBlock([
      Tx.contractCall('test-pops-ice-machine-v3', 'defrost-many', [types.list([types.uint(10000), types.uint(1), types.uint(9999)])], deployer.address),
    ]);
    assertEquals(defrostBlock.receipts[0].result, '(ok true)',  'Should be able to defrost');

    frozenBalance = chain.callReadOnlyFn('test-frozen-pops-v3', 'get-balance', [types.principal(deployer.address)], deployer.address);
    assertEquals(frozenBalance.result, 'u0', 'Should have 0 frozen pops');

    const iceBalance = chain.callReadOnlyFn('test-pops-ice-v3', 'get-balance', [types.principal(deployer.address)], deployer.address);
    const calculBalance = (chain.blockHeight - freezeBlock.height) * ICE_PER_POP_PER_BLOCK * 3;
    assertEquals(iceBalance.result, `(ok u${calculBalance})`,  `Balance should be ${calculBalance}`);

    // We mine empty blocks 
    chain.mineEmptyBlock(MELT_TIME);

    let heatWaveBlock = chain.mineBlock([
      Tx.contractCall('test-pops-ice-v3', 'heat-wave-at', [types.principal(deployer.address)], attacker.address),
    ]);
    assertEquals(heatWaveBlock.receipts[0].result, '(ok true)', 'Should be able to send a heat wave');

    // we try to resend, should be too hot
    heatWaveBlock = chain.mineBlock([
      Tx.contractCall('test-pops-ice-v3', 'heat-wave-at', [types.principal(deployer.address)], attacker.address),
    ]);
    assertEquals(heatWaveBlock.receipts[0].result, '(err u502)', 'Shouldnt be able to send a heat wave');

    // we check balances
    const newIceBalance = chain.callReadOnlyFn('test-pops-ice-v3', 'get-balance', [types.principal(deployer.address)], deployer.address);
    const calculNewBalance = Math.round(calculBalance - ((calculBalance * (MELT_RATE+REWARD_RATE))/100));
    assertEquals(newIceBalance.result, `(ok u${calculNewBalance})`,  `Balance should be ${calculNewBalance} but is ${newIceBalance.result}`);

    let attackerBalance = chain.callReadOnlyFn('test-pops-ice-v3', 'get-balance', [types.principal(attacker.address)], deployer.address);
    let calculAttackerBalance = Math.round((calculBalance * REWARD_RATE)/100);
    assertEquals(attackerBalance.result, `(ok u${calculAttackerBalance})`,  `Balance should be ${calculAttackerBalance} but is ${attackerBalance.result}`);

    // we transfer
    const tranferBlock = chain.mineBlock([
      Tx.contractCall('test-pops-ice-v3', 'transfer', [types.uint(calculNewBalance-4), types.principal(deployer.address), types.principal(attacker.address)], deployer.address),
    ]);
    assertEquals(tranferBlock.receipts[0].result, `(ok true)`,  `Transfert should be succesful`);


    attackerBalance = chain.callReadOnlyFn('test-pops-ice-v3', 'get-balance', [types.principal(attacker.address)], deployer.address);
    calculAttackerBalance = calculAttackerBalance + (calculNewBalance-4);
    assertEquals(attackerBalance.result, `(ok u${calculAttackerBalance})`,  `Balance should be ${calculAttackerBalance} but is ${attackerBalance.result}`);

    // We mine empty blocks 
    chain.mineEmptyBlock(MELT_TIME);

    // We try to resend heat wave with low balance
    heatWaveBlock = chain.mineBlock([
      Tx.contractCall('test-pops-ice-v3', 'heat-wave-at', [types.principal(deployer.address)], attacker.address),
    ]);
    assertEquals(heatWaveBlock.receipts[0].result, '(err u503)', 'Shouldnt be able to send a heat wave');

  },
});
