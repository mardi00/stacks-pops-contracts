
import { Clarinet, Tx, Chain, Account, types, Contract } from 'https://deno.land/x/clarinet@v0.27.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';
import {
    flipPowerSwitchAndTest,
    freezePopsAndTest,
    defrostPopsAndTest,
    MIN_FREEZING_BLOCKS,
    STACKS_POPS_CONTRACT_NAME
} from './test-helper.ts';


export const mintManyPopsAndTest = (caller: string, chain: Chain, number: number) => {
    const calls = [];
    const STACKSPOPS_ALL = [];
  
    let total = 10000;
    let total2 = 1;
    for (let i = 1; i <= number; i++) {
      calls.push(Tx.contractCall(STACKS_POPS_CONTRACT_NAME, 'mint', [], caller));
      const mintBlock = chain.mineBlock(calls);
      //assertEquals(mintBlock.receipts[0].result, '(ok true)', 'Should be able to mint');
      const mod = i%2;
      if(mod === 0) {
        STACKSPOPS_ALL.push(types.uint(total2))
        total2+=1;
      } else {
        STACKSPOPS_ALL.push(types.uint(total))
        total-=1;
      }
    }
    return { STACKSPOPS_ALL };
  };
  
  export const freezeManyPopsByChunkAndTest = (caller: string, chain: Chain, pops: any) => {
    let i,j, temporary, chunk = 20;
    for (i = 0,j = pops.length; i < j; i += chunk) {
      temporary = pops.slice(i, i + chunk);
      freezePopsAndTest(caller, chain, '(ok true)', types.list(temporary))
    }
  };
  
  export const defrostManyPopsByChunkAndTest = (caller: string, chain: Chain, pops: any) => {
    let i,j, temporary, chunk = 20;
    for (i = 0,j = pops.length; i < j; i += chunk) {
      temporary = pops.slice(i, i + chunk);
      defrostPopsAndTest(caller, chain, '(ok true)', types.list(temporary))
    }
  };
  

  
Clarinet.test({
    name:  `Ensure that we can freeze more than 2500`,
    async fn(chain: Chain, accounts: Map<string, Account>) {
      let deployer = accounts.get('deployer')!;
      const { STACKSPOPS_ALL } = mintManyPopsAndTest(deployer.address, chain, 20);
      flipPowerSwitchAndTest(deployer.address, chain, '(ok true)');
      freezeManyPopsByChunkAndTest(deployer.address, chain, STACKSPOPS_ALL);
      // We mine empty blocks 
      chain.mineEmptyBlock(MIN_FREEZING_BLOCKS);
  
      defrostManyPopsByChunkAndTest(deployer.address, chain, STACKSPOPS_ALL);
    },
  });
  