
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
    name:  `Ensure that we swap v1 tokens to v2 tokens`,
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