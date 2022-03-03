
import { Clarinet, Tx, Chain, Account, types, Contract } from 'https://deno.land/x/clarinet@v0.27.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';
import {
  mintPopsAndTest,
  checkIceBalanceMachine,
  checkFrozenBalanceByOwner,
  checkFreezeBlockAndTest,
  checkPopsBalanceByOwner,
  freezePopsAndTest,
  flipPowerSwitchAndTest,
  checkMachineStateAndTest,
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
  STACKS_POPS_ICE_CONTRACT_NAME,
  STACKSPOPS_INT,
  STACKSPOPS_INVALID_INT
} from './test-helper.ts';

Clarinet.test({
  name: "Ensure that pops can't be frozen if the machine is off",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;

    mintPopsAndTest(deployer.address, chain);
    checkIceBalanceMachine(deployer.address, chain, `u${INITIAL_ICE}`);
    checkFrozenBalanceByOwner(deployer.address, chain, `u0`);

    freezePopsAndTest(deployer.address, chain, '(err u500)', STACKSPOPS_INT,);
  },
});

Clarinet.test({
  name: "Ensure that the machine can be switched on and we can freeze pops",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;
    flipPowerSwitchAndTest(deployer.address, chain, '(ok true)');
    mintPopsAndTest(deployer.address, chain);
    checkIceBalanceMachine(deployer.address, chain, `u${INITIAL_ICE}`);

    checkPopsBalanceByOwner(deployer.address, chain, '(ok [u10000, u1, u9999])');
    checkFrozenBalanceByOwner(deployer.address, chain, 'u0');

    freezePopsAndTest(deployer.address, chain, '(ok true)', STACKSPOPS_INT);


    checkPopsBalanceByOwner(deployer.address, chain, '(ok [])');
    checkFrozenBalanceByOwner(deployer.address, chain, 'u3');
  },
});
Clarinet.test({
  name: "Ensure that the machine can be switched on and we can 't freeze twice the same pops",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;
    flipPowerSwitchAndTest(deployer.address, chain, '(ok true)');
    mintPopsAndTest(deployer.address, chain);
    checkIceBalanceMachine(deployer.address, chain, `u${INITIAL_ICE}`);

    checkPopsBalanceByOwner(deployer.address, chain, '(ok [u10000, u1, u9999])');
    checkFrozenBalanceByOwner(deployer.address, chain, 'u0');

    freezePopsAndTest(deployer.address, chain, '(ok true)', STACKSPOPS_INT);


    checkPopsBalanceByOwner(deployer.address, chain, '(ok [])');
    checkFrozenBalanceByOwner(deployer.address, chain, 'u3');
    freezePopsAndTest(deployer.address, chain, '(err u401)', STACKSPOPS_INT);
  },
});


Clarinet.test({
  name: "Ensure that the machine can be switched on and off",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;
    checkMachineStateAndTest(deployer.address, chain, '(ok false)');
    flipPowerSwitchAndTest(deployer.address, chain, '(ok true)');
    checkMachineStateAndTest(deployer.address, chain, '(ok true)');
    flipPowerSwitchAndTest(deployer.address, chain, '(ok false)');
    checkMachineStateAndTest(deployer.address, chain, '(ok false)');
  },
});

Clarinet.test({
  name: "Ensure that the machine can be switched on by owner only",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;
    let wallet1 = accounts.get('wallet_1')!;

    flipPowerSwitchAndTest(wallet1.address, chain, '(err u401)');
  },
});

Clarinet.test({
  name: "Ensure that we can't freeze pops we don't own",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;
    let wallet1 = accounts.get('wallet_1')!;

    flipPowerSwitchAndTest(deployer.address, chain, '(ok true)');
    mintPopsAndTest(deployer.address, chain);
    checkIceBalanceMachine(deployer.address, chain, `u${INITIAL_ICE}`);

    checkPopsBalanceByOwner(deployer.address, chain, '(ok [u10000, u1, u9999])');
    checkFrozenBalanceByOwner(deployer.address, chain, 'u0');

    freezePopsAndTest(wallet1.address, chain, '(err u401)', STACKSPOPS_INT);
  },
});

Clarinet.test({
  name: "Ensure that we can't freeze unknown id",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;

    flipPowerSwitchAndTest(deployer.address, chain, '(ok true)');
    mintPopsAndTest(deployer.address, chain);
    checkIceBalanceMachine(deployer.address, chain, `u${INITIAL_ICE}`);

    checkPopsBalanceByOwner(deployer.address, chain, '(ok [u10000, u1, u9999])');
    checkFrozenBalanceByOwner(deployer.address, chain, 'u0');

    freezePopsAndTest(deployer.address, chain, '(err u404)', STACKSPOPS_INVALID_INT);
  },
});


Clarinet.test({
  name: "Ensure that we can't defrost too early",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;

    flipPowerSwitchAndTest(deployer.address, chain, '(ok true)');
    mintPopsAndTest(deployer.address, chain);
    checkIceBalanceMachine(deployer.address, chain, `u${INITIAL_ICE}`);

    checkPopsBalanceByOwner(deployer.address, chain, '(ok [u10000, u1, u9999])');
    checkFrozenBalanceByOwner(deployer.address, chain, 'u0');

    freezePopsAndTest(deployer.address, chain, '(ok true)', STACKSPOPS_INT);


    checkPopsBalanceByOwner(deployer.address, chain, '(ok [])');
    checkFrozenBalanceByOwner(deployer.address, chain, 'u3');

    defrostPopsAndTest(deployer.address, chain, '(err u501)', STACKSPOPS_INT, 0);
  },
});

Clarinet.test({
  name:  `Ensure that we can defrost after ${MIN_FREEZING_BLOCKS} blocks`,
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;

    flipPowerSwitchAndTest(deployer.address, chain, '(ok true)');
    mintPopsAndTest(deployer.address, chain);
    checkIceBalanceMachine(deployer.address, chain, `u${INITIAL_ICE}`);

    checkPopsBalanceByOwner(deployer.address, chain, '(ok [u10000, u1, u9999])');
    checkFrozenBalanceByOwner(deployer.address, chain, 'u0');

    const freezeBlock = freezePopsAndTest(deployer.address, chain, '(ok true)', STACKSPOPS_INT);


    checkPopsBalanceByOwner(deployer.address, chain, '(ok [])');
    checkFrozenBalanceByOwner(deployer.address, chain, 'u3');

    // We mine empty blocks 
    chain.mineEmptyBlock(MIN_FREEZING_BLOCKS);

    defrostPopsAndTest(deployer.address, chain, '(ok true)', STACKSPOPS_INT, MIN_FREEZING_BLOCKS+1);
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

    flipPowerSwitchAndTest(deployer.address, chain, '(ok true)');
    mintPopsAndTest(deployer.address, chain);
    checkIceBalanceMachine(deployer.address, chain, `u${INITIAL_ICE}`);

    checkPopsBalanceByOwner(deployer.address, chain, '(ok [u10000, u1, u9999])');
    checkFrozenBalanceByOwner(deployer.address, chain, 'u0');

    const freezeBlock = freezePopsAndTest(deployer.address, chain, '(ok true)', STACKSPOPS_INT);


    checkPopsBalanceByOwner(deployer.address, chain, '(ok [])');
    checkFrozenBalanceByOwner(deployer.address, chain, 'u3');

    // We mine empty blocks 
    chain.mineEmptyBlock(MIN_FREEZING_BLOCKS);

    defrostPopsAndTest(wallet1.address, chain, '(err u401)', STACKSPOPS_INT, MIN_FREEZING_BLOCKS+1);
  },
});

Clarinet.test({
  name:  `Ensure that we can't defrost pops with unknown id`,
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;

    flipPowerSwitchAndTest(deployer.address, chain, '(ok true)');
    mintPopsAndTest(deployer.address, chain);
    checkIceBalanceMachine(deployer.address, chain, `u${INITIAL_ICE}`);

    checkPopsBalanceByOwner(deployer.address, chain, '(ok [u10000, u1, u9999])');
    checkFrozenBalanceByOwner(deployer.address, chain, 'u0');

    const freezeBlock = freezePopsAndTest(deployer.address, chain, '(ok true)', STACKSPOPS_INT);


    checkPopsBalanceByOwner(deployer.address, chain, '(ok [])');
    checkFrozenBalanceByOwner(deployer.address, chain, 'u3');

    // We mine empty blocks 
    chain.mineEmptyBlock(MIN_FREEZING_BLOCKS);

    defrostPopsAndTest(deployer.address, chain, '(err u404)', STACKSPOPS_INVALID_INT, 0);
  },
});

Clarinet.test({
  name:  `Ensure that we can't defrost pops we don't own`,
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;
    let wallet1 = accounts.get('wallet_1')!;

    flipPowerSwitchAndTest(deployer.address, chain, '(ok true)');
    mintPopsAndTest(deployer.address, chain);
    checkIceBalanceMachine(deployer.address, chain, `u${INITIAL_ICE}`);

    checkPopsBalanceByOwner(deployer.address, chain, '(ok [u10000, u1, u9999])');
    checkFrozenBalanceByOwner(deployer.address, chain, 'u0');

    const freezeBlock = freezePopsAndTest(deployer.address, chain, '(ok true)', STACKSPOPS_INT);


    checkPopsBalanceByOwner(deployer.address, chain, '(ok [])');
    checkFrozenBalanceByOwner(deployer.address, chain, 'u3');

    // We mine empty blocks 
    chain.mineEmptyBlock(MIN_FREEZING_BLOCKS);

    defrostPopsAndTest(wallet1.address, chain, '(err u401)', STACKSPOPS_INT, MIN_FREEZING_BLOCKS+1);
  },
});

/*Clarinet.test({
  name:  `Ensure that we can defrost after ${MIN_FREEZING_BLOCKS} blocks when ICE machine is empty`,
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;

    flipPowerSwitchAndTest(deployer.address, chain, '(ok true)');
    mintPopsAndTest(deployer.address, chain, 3);
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
     checkIceBalance(deployer.address, chain, `(ok u0)`);
    checkIceBalanceMachine(deployer.address, chain, `u${INITIAL_ICE}`);
    //const calculBalance = (chain.blockHeight - freezeBlock.height) * ICE_PER_POP_PER_BLOCK * 3;
   
  },
});*/

Clarinet.test({
  name:  `Ensure that we can't resend a heat wave too early`,
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;
    let attacker = accounts.get('wallet_1')!;

    flipPowerSwitchAndTest(deployer.address, chain, '(ok true)');
    mintPopsAndTest(deployer.address, chain);
    checkIceBalanceMachine(deployer.address, chain, `u${INITIAL_ICE}`);

    checkFrozenBalanceByOwner(deployer.address, chain, 'u0');
    checkPopsBalanceByOwner(deployer.address, chain, '(ok [u10000, u1, u9999])');


    const freezeBlock = freezePopsAndTest(deployer.address, chain, '(ok true)', STACKSPOPS_INT);


    checkPopsBalanceByOwner(deployer.address, chain, '(ok [])');

    checkFrozenBalanceByOwner(deployer.address, chain, 'u3');

    // We mine empty blocks
    chain.mineEmptyBlock(MIN_FREEZING_BLOCKS);


    defrostPopsAndTest(deployer.address, chain, '(ok true)', STACKSPOPS_INT, MIN_FREEZING_BLOCKS+1);

    checkFrozenBalanceByOwner(deployer.address, chain, 'u0');

    const calculBalance = (chain.blockHeight - freezeBlock.height) * ICE_PER_POP_PER_BLOCK * 3;
    checkIceBalance(deployer.address, chain, `(ok u${calculBalance})`);
    checkIceBalanceMachine(deployer.address, chain, `u${INITIAL_ICE - calculBalance}`);

    const heatWaveBlock = chain.mineBlock([
      Tx.contractCall(STACKS_POPS_ICE_CONTRACT_NAME, 'heat-wave-at', [types.principal(deployer.address)], attacker.address),
    ]);
    assertEquals(heatWaveBlock.receipts[0].result, '(err u501)', 'Shouldnt be able to send a heat wave');
  },
});


Clarinet.test({
  name:  `Ensure that we can send a heat wave after ${MELT_TIME} block`,
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get('deployer')!;
    let attacker = accounts.get('wallet_1')!;

    flipPowerSwitchAndTest(deployer.address, chain, '(ok true)');
    mintPopsAndTest(deployer.address, chain);
    checkIceBalanceMachine(deployer.address, chain, `u${INITIAL_ICE}`);

    checkPopsBalanceByOwner(deployer.address, chain, '(ok [u10000, u1, u9999])');
    checkFrozenBalanceByOwner(deployer.address, chain, 'u0');

    const freezeBlock = freezePopsAndTest(deployer.address, chain, '(ok true)', STACKSPOPS_INT);


    checkPopsBalanceByOwner(deployer.address, chain, '(ok [])');
    checkFrozenBalanceByOwner(deployer.address, chain, 'u3');

    // We mine empty blocks 
    chain.mineEmptyBlock(MIN_FREEZING_BLOCKS);


    defrostPopsAndTest(deployer.address, chain, '(ok true)', STACKSPOPS_INT, MIN_FREEZING_BLOCKS+1);
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
      Tx.contractCall(STACKS_POPS_ICE_CONTRACT_NAME, 'transfer', [types.uint(calculNewBalance-4), types.principal(deployer.address), types.principal(attacker.address), types.none()], deployer.address),
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

    flipPowerSwitchAndTest(deployer.address, chain, '(ok true)');
    mintPopsAndTest(deployer.address, chain);
    checkIceBalanceMachine(deployer.address, chain, `u${INITIAL_ICE}`);

    checkPopsBalanceByOwner(deployer.address, chain, '(ok [u10000, u1, u9999])');
    checkFrozenBalanceByOwner(deployer.address, chain, 'u0');

    const freezeBlock = freezePopsAndTest(deployer.address, chain, '(ok true)', STACKSPOPS_INT);


    checkPopsBalanceByOwner(deployer.address, chain, '(ok [])');
    checkFrozenBalanceByOwner(deployer.address, chain, 'u3');

    // We mine empty blocks 
    chain.mineEmptyBlock(MIN_FREEZING_BLOCKS);


    defrostPopsAndTest(deployer.address, chain, '(ok true)', STACKSPOPS_INT, MIN_FREEZING_BLOCKS+1);
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
      Tx.contractCall(STACKS_POPS_ICE_CONTRACT_NAME, 'transfer', [types.uint(1), types.principal(deployer.address), types.principal(attacker.address), types.none()], deployer.address),
    ]);
    assertEquals(tranferBlock.receipts[0].result, `(ok true)`,  `Transfert should be succesful`);


    sendHeatwaveAndTest(attacker.address, deployer.address, chain, '(err u501)')

  },
});
