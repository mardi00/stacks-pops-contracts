
import { Clarinet, Tx, Chain, Account, types, Contract } from 'https://deno.land/x/clarinet@v0.13.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

const INITIAL_ICE = 1380000000;
const MIN_FREEZING_BLOCKS = 2000;
const ICE_PER_POP_PER_BLOCK = 1;
const MELT_TIME = 48000;
const MELT_RATE = 4;
const REWARD_RATE = 1;
const MIN_BALANCE = 1618;


const STACKSPOPS = types.list([types.uint(10000), types.uint(1), types.uint(9999)]);
const STACKSPOPS_INVALID = types.list([types.uint(10000), types.uint(1), types.uint(722)]);

const mintPopsAndTest = (caller: string, chain: Chain) => {
  const calls = [];
  for (let i = 0; i < 3; i++) {
    calls.push(Tx.contractCall('test-pops-v3', 'mint', [], caller));
  }
  const mintBlock = chain.mineBlock(calls);
  assertEquals(mintBlock.receipts[0].result, '(ok true)', 'Should be able to mint');
  return mintBlock;
};

const flipPowerSwitchAndTest = (caller: string, chain: Chain) => {
  const flipPowerSwitchBlock = chain.mineBlock([
    Tx.contractCall('test-pops-ice-machine-v3', 'flip-power-switch', [], caller),
  ])
  assertEquals(flipPowerSwitchBlock.receipts[0].result, '(ok true)', 'Should be able to flip machine switch');
  return flipPowerSwitchBlock;
};


const checkPopsBalanceByOwner = (owner: string, chain: Chain, expected: string) => {
  const balance = chain.callReadOnlyFn('test-pops-v3', 'get-pops-by-owner', [types.principal(owner)], owner);
  assertEquals(balance.result, expected, `Should have ${expected} but result is ${balance.result}`);
  return balance;
};

const checkFrozenBalanceByOwner = (owner: string, chain: Chain, expected: string) => {
  const frozenBalance = chain.callReadOnlyFn('test-frozen-pops-v3', 'get-balance', [types.principal(owner)], owner);
  assertEquals(frozenBalance.result, expected, `Should have ${expected} but got ${frozenBalance.result}`);
  return frozenBalance;
};

const checkIceBalance = (owner: string, chain: Chain, expected: string) => {
  const iceBalance = chain.callReadOnlyFn('test-pops-ice-v3', 'get-balance', [types.principal(owner)], owner);
  assertEquals(iceBalance.result, expected,  `Balance should be ${expected} but got ${iceBalance.result}`);
  return iceBalance;
};


const checkIceBalanceMachine = (owner: string, chain: Chain, expected: string) => {
  const iceMachineBalance = chain.callReadOnlyFn('test-pops-ice-machine-v3', 'get-machine-ice-balance', [], owner);
  assertEquals(iceMachineBalance.result, expected,  `Balance should be ${expected} but got ${iceMachineBalance.result}`);
  return iceMachineBalance;
};

const freezePopsAndTest = (caller: string, chain: Chain, expected: string, pops: any) => {
  const freezeBlock = chain.mineBlock([
    Tx.contractCall('test-pops-ice-machine-v3', 'freeze-many', [pops], caller),
  ]);
  assertEquals(freezeBlock.receipts[0].result, expected, `Should be ${expected} but got ${freezeBlock.receipts[0].result}`);
  return freezeBlock;
};

const defrostPopsAndTest = (caller: string, chain: Chain, expected: string, pops: any) => {
  const defrostBlock = chain.mineBlock([
    Tx.contractCall('test-pops-ice-machine-v3', 'defrost-many', [pops], caller),
  ]);
  assertEquals(defrostBlock.receipts[0].result, expected,  `Should be ${expected} but got ${defrostBlock.receipts[0].result}`);
  return defrostBlock;
};

const sendHeatwaveAndTest = (caller: string, target: string, chain: Chain, expected: string) => {
  const heatWaveBlock = chain.mineBlock([
    Tx.contractCall('test-pops-ice-v3', 'heat-wave-at', [types.principal(target)], caller),
  ]);
  assertEquals(heatWaveBlock.receipts[0].result, expected, `Should ${expected} got ${heatWaveBlock.receipts[0].result}`);
};


Clarinet.test({
  name: "Ensure that pops can't be frozen if the machine is off",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;

    mintPopsAndTest(deployer.address, chain);
    checkIceBalanceMachine(deployer.address, chain, `u${INITIAL_ICE}`);

    checkPopsBalanceByOwner(deployer.address, chain, '(ok [u10000, u1, u9999])');
    checkFrozenBalanceByOwner(deployer.address, chain, 'u0');

    freezePopsAndTest(deployer.address, chain, '(err u500)', STACKSPOPS);

    checkFrozenBalanceByOwner(deployer.address, chain, 'u0');
    checkPopsBalanceByOwner(deployer.address, chain, '(ok [u10000, u1, u9999])');
  },
});

Clarinet.test({
  name: "Ensure that the machine can be switched on and we can freeze pops",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;

    flipPowerSwitchAndTest(deployer.address, chain);
    mintPopsAndTest(deployer.address, chain);
    checkIceBalanceMachine(deployer.address, chain, `u${INITIAL_ICE}`);

    checkPopsBalanceByOwner(deployer.address, chain, '(ok [u10000, u1, u9999])');
    checkFrozenBalanceByOwner(deployer.address, chain, 'u0');

    freezePopsAndTest(deployer.address, chain, '(ok true)', STACKSPOPS);

    checkPopsBalanceByOwner(deployer.address, chain, '(ok [])');
    checkFrozenBalanceByOwner(deployer.address, chain, 'u3');
  },
});

Clarinet.test({
  name: "Ensure that we can't freeze pops we don't own",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;
    let wallet1 = accounts.get('wallet_1')!;

    flipPowerSwitchAndTest(deployer.address, chain);
    mintPopsAndTest(deployer.address, chain);
    checkIceBalanceMachine(deployer.address, chain, `u${INITIAL_ICE}`);

    checkPopsBalanceByOwner(deployer.address, chain, '(ok [u10000, u1, u9999])');
    checkFrozenBalanceByOwner(deployer.address, chain, 'u0');

    freezePopsAndTest(wallet1.address, chain, '(err u401)', STACKSPOPS);
  },
});

Clarinet.test({
  name: "Ensure that we can't freeze unknown id",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;

    flipPowerSwitchAndTest(deployer.address, chain);
    mintPopsAndTest(deployer.address, chain);
    checkIceBalanceMachine(deployer.address, chain, `u${INITIAL_ICE}`);

    checkPopsBalanceByOwner(deployer.address, chain, '(ok [u10000, u1, u9999])');
    checkFrozenBalanceByOwner(deployer.address, chain, 'u0');

    freezePopsAndTest(deployer.address, chain, '(err u404)', STACKSPOPS_INVALID);
  },
});


Clarinet.test({
  name: "Ensure that we can't defrost too early",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;

    flipPowerSwitchAndTest(deployer.address, chain);
    mintPopsAndTest(deployer.address, chain);
    checkIceBalanceMachine(deployer.address, chain, `u${INITIAL_ICE}`);

    checkPopsBalanceByOwner(deployer.address, chain, '(ok [u10000, u1, u9999])');
    checkFrozenBalanceByOwner(deployer.address, chain, 'u0');

    freezePopsAndTest(deployer.address, chain, '(ok true)', STACKSPOPS);


    checkPopsBalanceByOwner(deployer.address, chain, '(ok [])');
    checkFrozenBalanceByOwner(deployer.address, chain, 'u3');

    defrostPopsAndTest(deployer.address, chain, '(err u501)', STACKSPOPS);
  },
});

Clarinet.test({
  name:  `Ensure that we can defrost after ${MIN_FREEZING_BLOCKS} blocks`,
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;

    flipPowerSwitchAndTest(deployer.address, chain);
    mintPopsAndTest(deployer.address, chain);
    checkIceBalanceMachine(deployer.address, chain, `u${INITIAL_ICE}`);

    checkPopsBalanceByOwner(deployer.address, chain, '(ok [u10000, u1, u9999])');
    checkFrozenBalanceByOwner(deployer.address, chain, 'u0');

    const freezeBlock = freezePopsAndTest(deployer.address, chain, '(ok true)', STACKSPOPS);


    checkPopsBalanceByOwner(deployer.address, chain, '(ok [])');
    checkFrozenBalanceByOwner(deployer.address, chain, 'u3');

    // We mine empty blocks 
    chain.mineEmptyBlock(MIN_FREEZING_BLOCKS);

    defrostPopsAndTest(deployer.address, chain, '(ok true)', STACKSPOPS);
    checkFrozenBalanceByOwner(deployer.address, chain, 'u0');
    checkPopsBalanceByOwner(deployer.address, chain, '(ok [u10000, u1, u9999])');

    const calculBalance = (chain.blockHeight - freezeBlock.height) * ICE_PER_POP_PER_BLOCK * 3;
    checkIceBalance(deployer.address, chain, `(ok u${calculBalance})`);
    checkIceBalanceMachine(deployer.address, chain, `u${INITIAL_ICE - calculBalance}`);
  },
});

Clarinet.test({
  name:  `Ensure that we can't defrost pops we don't own`,
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;
    let wallet1 = accounts.get('wallet_1')!;

    flipPowerSwitchAndTest(deployer.address, chain);
    mintPopsAndTest(deployer.address, chain);
    checkIceBalanceMachine(deployer.address, chain, `u${INITIAL_ICE}`);

    checkPopsBalanceByOwner(deployer.address, chain, '(ok [u10000, u1, u9999])');
    checkFrozenBalanceByOwner(deployer.address, chain, 'u0');

    const freezeBlock = freezePopsAndTest(deployer.address, chain, '(ok true)', STACKSPOPS);


    checkPopsBalanceByOwner(deployer.address, chain, '(ok [])');
    checkFrozenBalanceByOwner(deployer.address, chain, 'u3');

    // We mine empty blocks 
    chain.mineEmptyBlock(MIN_FREEZING_BLOCKS);

    defrostPopsAndTest(wallet1.address, chain, '(err u401)', STACKSPOPS);
  },
});

Clarinet.test({
  name:  `Ensure that we can't defrost pops with unknown id`,
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;

    flipPowerSwitchAndTest(deployer.address, chain);
    mintPopsAndTest(deployer.address, chain);
    checkIceBalanceMachine(deployer.address, chain, `u${INITIAL_ICE}`);

    checkPopsBalanceByOwner(deployer.address, chain, '(ok [u10000, u1, u9999])');
    checkFrozenBalanceByOwner(deployer.address, chain, 'u0');

    const freezeBlock = freezePopsAndTest(deployer.address, chain, '(ok true)', STACKSPOPS);


    checkPopsBalanceByOwner(deployer.address, chain, '(ok [])');
    checkFrozenBalanceByOwner(deployer.address, chain, 'u3');

    // We mine empty blocks 
    chain.mineEmptyBlock(MIN_FREEZING_BLOCKS);

    defrostPopsAndTest(deployer.address, chain, '(err u404)', STACKSPOPS_INVALID);
  },
});

Clarinet.test({
  name:  `Ensure that we can't defrost pops we don't own`,
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;
    let wallet1 = accounts.get('wallet_1')!;

    flipPowerSwitchAndTest(deployer.address, chain);
    mintPopsAndTest(deployer.address, chain);
    checkIceBalanceMachine(deployer.address, chain, `u${INITIAL_ICE}`);

    checkPopsBalanceByOwner(deployer.address, chain, '(ok [u10000, u1, u9999])');
    checkFrozenBalanceByOwner(deployer.address, chain, 'u0');

    const freezeBlock = freezePopsAndTest(deployer.address, chain, '(ok true)', STACKSPOPS);


    checkPopsBalanceByOwner(deployer.address, chain, '(ok [])');
    checkFrozenBalanceByOwner(deployer.address, chain, 'u3');

    // We mine empty blocks 
    chain.mineEmptyBlock(MIN_FREEZING_BLOCKS);

    defrostPopsAndTest(wallet1.address, chain, '(err u401)', STACKSPOPS);
  },
});

Clarinet.test({
  name:  `Ensure that we can defrost after ${MIN_FREEZING_BLOCKS} blocks when ICE machine is empty`,
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;

    flipPowerSwitchAndTest(deployer.address, chain);
    mintPopsAndTest(deployer.address, chain);
    checkIceBalanceMachine(deployer.address, chain, `u${INITIAL_ICE}`);

    checkPopsBalanceByOwner(deployer.address, chain, '(ok [u10000, u1, u9999])');


    const freezeBlock = freezePopsAndTest(deployer.address, chain, '(ok true)', STACKSPOPS);


    checkPopsBalanceByOwner(deployer.address, chain, '(ok [])');

    checkFrozenBalanceByOwner(deployer.address, chain, 'u3');

    // We mine empty blocks 
    chain.mineEmptyBlock(MIN_FREEZING_BLOCKS);


    defrostPopsAndTest(deployer.address, chain, '(ok true)', STACKSPOPS);

    checkFrozenBalanceByOwner(deployer.address, chain, 'u0');

    checkPopsBalanceByOwner(deployer.address, chain, '(ok [u10000, u1, u9999])');

    const calculBalance = (chain.blockHeight - freezeBlock.height) * ICE_PER_POP_PER_BLOCK * 3;
    checkIceBalance(deployer.address, chain, `(ok u${calculBalance})`);
  },
});

Clarinet.test({
  name:  `Ensure that we can't resend a heat wave too early`,
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;
    let attacker = accounts.get('wallet_1')!;

    flipPowerSwitchAndTest(deployer.address, chain);
    mintPopsAndTest(deployer.address, chain);
    checkIceBalanceMachine(deployer.address, chain, `u${INITIAL_ICE}`);

    checkFrozenBalanceByOwner(deployer.address, chain, 'u0');
    checkPopsBalanceByOwner(deployer.address, chain, '(ok [u10000, u1, u9999])');


    const freezeBlock = freezePopsAndTest(deployer.address, chain, '(ok true)', STACKSPOPS);


    checkPopsBalanceByOwner(deployer.address, chain, '(ok [])');

    checkFrozenBalanceByOwner(deployer.address, chain, 'u3');

    // We mine empty blocks
    chain.mineEmptyBlock(MIN_FREEZING_BLOCKS);


    defrostPopsAndTest(deployer.address, chain, '(ok true)', STACKSPOPS);

    checkFrozenBalanceByOwner(deployer.address, chain, 'u0');

    const calculBalance = (chain.blockHeight - freezeBlock.height) * ICE_PER_POP_PER_BLOCK * 3;
    checkIceBalance(deployer.address, chain, `(ok u${calculBalance})`);
    checkIceBalanceMachine(deployer.address, chain, `u${INITIAL_ICE - calculBalance}`);

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

    flipPowerSwitchAndTest(deployer.address, chain);
    mintPopsAndTest(deployer.address, chain);
    checkIceBalanceMachine(deployer.address, chain, `u${INITIAL_ICE}`);

    checkPopsBalanceByOwner(deployer.address, chain, '(ok [u10000, u1, u9999])');
    checkFrozenBalanceByOwner(deployer.address, chain, 'u0');

    const freezeBlock = freezePopsAndTest(deployer.address, chain, '(ok true)', STACKSPOPS);


    checkPopsBalanceByOwner(deployer.address, chain, '(ok [])');
    checkFrozenBalanceByOwner(deployer.address, chain, 'u3');

    // We mine empty blocks 
    chain.mineEmptyBlock(MIN_FREEZING_BLOCKS);


    defrostPopsAndTest(deployer.address, chain, '(ok true)', STACKSPOPS);
    checkPopsBalanceByOwner(deployer.address, chain, '(ok [u10000, u1, u9999])');


    checkFrozenBalanceByOwner(deployer.address, chain, 'u0');

    const calculBalance = Math.round((chain.blockHeight - freezeBlock.height) * ICE_PER_POP_PER_BLOCK * 3);
    const calculMachineBalance = INITIAL_ICE - calculBalance;
    checkIceBalance(deployer.address, chain, `(ok u${calculBalance})`);
    checkIceBalanceMachine(deployer.address, chain, `u${calculMachineBalance}`);

    // We mine empty blocks 
    chain.mineEmptyBlock(MELT_TIME);


    sendHeatwaveAndTest(attacker.address, deployer.address, chain, '(ok true)') 

    // we try to resend, should be too hot
    sendHeatwaveAndTest(attacker.address, deployer.address, chain, '(err u502)') 

    // we check balances
    const calculNewBalance = Math.round(calculBalance - ((calculBalance * (MELT_RATE+REWARD_RATE))/100));
    checkIceBalance(deployer.address, chain, `(ok u${calculNewBalance})`);

    let calculAttackerBalance = Math.round((calculBalance * REWARD_RATE)/100);
    const attackerBalance = checkIceBalance(attacker.address, chain, `(ok u${calculAttackerBalance})`);

    checkIceBalanceMachine(deployer.address, chain, `u${Math.round(calculMachineBalance + (calculBalance * MELT_RATE)/100)}`);

    // we transfer
    const tranferBlock = chain.mineBlock([
      Tx.contractCall('test-pops-ice-v3', 'transfer', [types.uint(calculNewBalance-4), types.principal(deployer.address), types.principal(attacker.address)], deployer.address),
    ]);
    assertEquals(tranferBlock.receipts[0].result, `(ok true)`,  `Transfert should be succesful`);


  
    calculAttackerBalance = calculAttackerBalance + (calculNewBalance-4);
    checkIceBalance(attacker.address, chain, `(ok u${calculAttackerBalance})`);

    // We mine empty blocks 
    chain.mineEmptyBlock(MELT_TIME);

    // We try to resend heat wave with low balance
    sendHeatwaveAndTest(attacker.address, deployer.address, chain, '(err u503)') 

  },
});



Clarinet.test({
  name:  `Ensure that we can't send a heat wave after ${MELT_TIME} block if the wallet has been active`,
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;
    let attacker = accounts.get('wallet_1')!;

    flipPowerSwitchAndTest(deployer.address, chain);
    mintPopsAndTest(deployer.address, chain);
    checkIceBalanceMachine(deployer.address, chain, `u${INITIAL_ICE}`);

    checkPopsBalanceByOwner(deployer.address, chain, '(ok [u10000, u1, u9999])');
    checkFrozenBalanceByOwner(deployer.address, chain, 'u0');

    const freezeBlock = freezePopsAndTest(deployer.address, chain, '(ok true)', STACKSPOPS);


    checkPopsBalanceByOwner(deployer.address, chain, '(ok [])');
    checkFrozenBalanceByOwner(deployer.address, chain, 'u3');

    // We mine empty blocks 
    chain.mineEmptyBlock(MIN_FREEZING_BLOCKS);


    defrostPopsAndTest(deployer.address, chain, '(ok true)', STACKSPOPS);
    checkPopsBalanceByOwner(deployer.address, chain, '(ok [u10000, u1, u9999])');


    checkFrozenBalanceByOwner(deployer.address, chain, 'u0');

    const calculBalance = Math.round((chain.blockHeight - freezeBlock.height) * ICE_PER_POP_PER_BLOCK * 3);
    const calculMachineBalance = INITIAL_ICE - calculBalance;
    checkIceBalance(deployer.address, chain, `(ok u${calculBalance})`);
    checkIceBalanceMachine(deployer.address, chain, `u${calculMachineBalance}`);

    // We mine empty blocks 
    chain.mineEmptyBlock(MELT_TIME+10);

    // we transfer 1 $ICE
    const tranferBlock = chain.mineBlock([
      Tx.contractCall('test-pops-ice-v3', 'transfer', [types.uint(1), types.principal(deployer.address), types.principal(attacker.address)], deployer.address),
    ]);
    assertEquals(tranferBlock.receipts[0].result, `(ok true)`,  `Transfert should be succesful`);


    sendHeatwaveAndTest(attacker.address, deployer.address, chain, '(err u501)')

  },
});
