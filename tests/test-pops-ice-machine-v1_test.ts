
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.13.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
  name: "Ensure that pops can't be frozen if the mahine is off",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;
    const mintBlock = chain.mineBlock([
      Tx.contractCall('test-pops-v2', 'mint', [], deployer.address),
      Tx.contractCall('test-pops-v2', 'mint', [], deployer.address),
      Tx.contractCall('test-pops-v2', 'mint', [], deployer.address),

    ]);
    const freezeBlock = chain.mineBlock([
      Tx.contractCall('test-pops-ice-machine-v2', 'freeze-many', [types.list([types.uint(10000), types.uint(1), types.uint(9999)])], deployer.address),
    ]);
    assertEquals(freezeBlock.receipts[0].result, '(err u500)');
  },
});

Clarinet.test({
  name: "Ensure that the machine can be switched on and we can freeze pops",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;

    const flipPowerSwitchBlock = chain.mineBlock([
      Tx.contractCall('test-pops-ice-machine-v2', 'flip-power-switch', [], deployer.address),
    ])

    assertEquals(flipPowerSwitchBlock.receipts[0].result, '(ok true)');

    const mintBlock = chain.mineBlock([
      Tx.contractCall('test-pops-v2', 'mint', [], deployer.address),
      Tx.contractCall('test-pops-v2', 'mint', [], deployer.address),
      Tx.contractCall('test-pops-v2', 'mint', [], deployer.address),

    ]);

    const balance = chain.callReadOnlyFn('test-pops-v2', 'get-pops-by-owner', [types.principal(deployer.address)], deployer.address);


    const freezeBlock = chain.mineBlock([
      Tx.contractCall('test-pops-ice-machine-v2', 'freeze-many', [types.list([types.uint(10000), types.uint(1), types.uint(9999)])], deployer.address),
    ]);

    const frozenBalance = chain.callReadOnlyFn('test-frozen-pops-v2', 'get-balance', [types.principal(deployer.address)], deployer.address);


    assertEquals(freezeBlock.receipts[0].result, '(ok true)');
    assertEquals(frozenBalance.result, 'u3');
  },
});


Clarinet.test({
  name: "Ensure that we can't defrost too early",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;

    const flipPowerSwitchBlock = chain.mineBlock([
      Tx.contractCall('test-pops-ice-machine-v2', 'flip-power-switch', [], deployer.address),
    ])

    assertEquals(flipPowerSwitchBlock.receipts[0].result, '(ok true)');

    const mintBlock = chain.mineBlock([
      Tx.contractCall('test-pops-v2', 'mint', [], deployer.address),
      Tx.contractCall('test-pops-v2', 'mint', [], deployer.address),
      Tx.contractCall('test-pops-v2', 'mint', [], deployer.address),

    ]);
    const freezeBlock = chain.mineBlock([
      Tx.contractCall('test-pops-ice-machine-v2', 'freeze-many', [types.list([types.uint(10000), types.uint(1), types.uint(9999)])], deployer.address),
    ]);

    assertEquals(freezeBlock.receipts[0].result, '(ok true)');

    // TOO EARLY
    const defrostBlockFail = chain.mineBlock([
      Tx.contractCall('test-pops-ice-machine-v2', 'defrost-many', [types.list([types.uint(10000), types.uint(1), types.uint(9999)])], deployer.address),
    ]);

    const frozenBalance = chain.callReadOnlyFn('test-frozen-pops-v2', 'get-balance', [types.principal(deployer.address)], deployer.address);

    assertEquals(defrostBlockFail.receipts[0].result, '(err u501)');
    assertEquals(frozenBalance.result, 'u0');
  },
});

Clarinet.test({
  name: "Ensure that we can defrost after 30 blocks",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;

    const flipPowerSwitchBlock = chain.mineBlock([
      Tx.contractCall('test-pops-ice-machine-v2', 'flip-power-switch', [], deployer.address),
    ])

    assertEquals(flipPowerSwitchBlock.receipts[0].result, '(ok true)');

    const mintBlock = chain.mineBlock([
      Tx.contractCall('test-pops-v2', 'mint', [], deployer.address),
      Tx.contractCall('test-pops-v2', 'mint', [], deployer.address),
      Tx.contractCall('test-pops-v2', 'mint', [], deployer.address),

    ]);
    const freezeBlock = chain.mineBlock([
      Tx.contractCall('test-pops-ice-machine-v2', 'freeze-many', [types.list([types.uint(10000), types.uint(1), types.uint(9999)])], deployer.address),
    ]);

    let frozenBalance = chain.callReadOnlyFn('test-frozen-pops-v2', 'get-balance', [types.principal(deployer.address)], deployer.address);
    assertEquals(frozenBalance.result, 'u3');

    assertEquals(freezeBlock.receipts[0].result, '(ok true)');


    chain.mineEmptyBlock(31);

    const defrostBlockSuccess = chain.mineBlock([
      Tx.contractCall('test-pops-ice-machine-v2', 'defrost-many', [types.list([types.uint(10000), types.uint(1), types.uint(9999)])], deployer.address),
    ]);

    frozenBalance = chain.callReadOnlyFn('test-frozen-pops-v2', 'get-balance', [types.principal(deployer.address)], deployer.address);

    assertEquals(defrostBlockSuccess.receipts[0].result, '(ok true)');
    assertEquals(frozenBalance.result, 'u0');
  },
});



Clarinet.test({
  name: "Ensure that we can mint",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;
    // Mine a block with one transaction.

    const flipPowerSwitchBlock = chain.mineBlock([
      Tx.contractCall('test-pops-ice-machine-v2', 'flip-power-switch', [], deployer.address),
    ])

    assertEquals(flipPowerSwitchBlock.receipts[0].result, '(ok true)');

    const mintBlock = chain.mineBlock([
      Tx.contractCall('test-pops-v2', 'mint', [], deployer.address),
      Tx.contractCall('test-pops-v2', 'mint', [], deployer.address),
      Tx.contractCall('test-pops-v2', 'mint', [], deployer.address),

    ]);

    const freezeBlock = chain.mineBlock([
      Tx.contractCall('test-pops-ice-machine-v2', 'freeze-many', [types.list([types.uint(10000), types.uint(1), types.uint(9999)])], deployer.address),
    ]);

    assertEquals(freezeBlock.receipts[0].result, '(ok true)');

    // TOO EARLY
    const defrostBlockFail = chain.mineBlock([
      Tx.contractCall('test-pops-ice-machine-v2', 'defrost-many', [types.list([types.uint(10000), types.uint(1), types.uint(9999)])], deployer.address),
    ]);

    assertEquals(defrostBlockFail.receipts[0].result, '(err u501)');

    chain.mineEmptyBlock(31);

    // OK
    const defrostBlockSuccess= chain.mineBlock([
      Tx.contractCall('test-pops-ice-machine-v2', 'defrost-many', [types.list([types.uint(10000), types.uint(1), types.uint(9999)])], deployer.address),
    ]);
    
    


    let frozenBalance = chain.callReadOnlyFn('test-frozen-pops-v2', 'get-balance', [types.principal(deployer.address)], deployer.address);

  },
});
