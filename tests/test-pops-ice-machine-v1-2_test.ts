
import { Clarinet, Tx, Chain, Account, types, Contract } from 'https://deno.land/x/clarinet@v0.27.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';
import {
    flipPowerSwitchAndTest,
    freezePopsAndTest,
    defrostPopsAndTest,
    MIN_FREEZING_BLOCKS,
    STACKS_POPS_CONTRACT_NAME
} from './test-helper.ts';


export const mintManyPopsAndTest = (caller: string, chain: Chain, number: number, bottom: number, top: number ) => {
    const STACKSPOPS_ALL = [];
    for (let i = 1; i <= number; i++) {
      const calls = [];
      calls.push(Tx.contractCall(STACKS_POPS_CONTRACT_NAME, 'mint', [], caller));
      const mintBlock = chain.mineBlock(calls);
      assertEquals(mintBlock.receipts[0].result, '(ok true)', 'Should be able to mint');
      const mod = i%2;
      if(mod === 0) {
        STACKSPOPS_ALL.push(types.uint(bottom))
        bottom+=1;
      } else {
        STACKSPOPS_ALL.push(types.uint(top))
        top-=1;
      }
    }
    return { STACKSPOPS_ALL, top, bottom };
  };
  
  export const freezeManyPopsByChunkAndTest = (caller: string, chain: Chain, pops: any, name: string) => {
    console.log(`------- > Start freeze for ${name}`);
    const chunks = chunkArray(pops, 10);
    let i = 1;
    for(const chunk of chunks) {
      console.log(`Freeze chunck ${i} out of ${chunks.length}`);
      freezePopsAndTest(caller, chain, '(ok true)', types.list(chunk))
      i += 1;
    }
  };

  function chunkArray(array: any, chunkSize: any) {
    return Array.from(
      { length: Math.ceil(array.length / chunkSize) },
      (_, index) => array.slice(index * chunkSize, (index + 1) * chunkSize)   
    );
  }
  
  export const defrostManyPopsByChunkAndTest = (caller: string, chain: Chain, pops: any) => {
    const chunks = chunkArray(pops, 10);
    let i = 1;
    for(const chunk of chunks) {
      console.log(`Freeze chunck ${i} out of ${chunks.length}`);
      defrostPopsAndTest(caller, chain, '(ok true)', types.list(chunk));
      i += 1;
    }
  };
  

  
Clarinet.test({
    name:  `Ensure that we can freeze more than 2500`,
    async fn(chain: Chain, accounts: Map<string, Account>) {
      let deployer = accounts.get('deployer')!;
      let wallet_1 = accounts.get('wallet_1')!;
      let wallet_2 = accounts.get('wallet_2')!;
      let wallet_3 = accounts.get('wallet_3')!;
      let wallet_4 = accounts.get('wallet_4')!;
      let wallet_5 = accounts.get('wallet_5')!;
      let wallet_6 = accounts.get('wallet_6')!;
      flipPowerSwitchAndTest(deployer.address, chain, '(ok true)');


      const mint_wallet = (wallet: any, bottom: number = 1, top: number = 10000) =>{
        const { STACKSPOPS_ALL } = mintManyPopsAndTest(wallet.address, chain, 500, bottom, top);
        freezeManyPopsByChunkAndTest(wallet.address, chain, STACKSPOPS_ALL, wallet.address.toString());
        return STACKSPOPS_ALL;
      }

      const STACKSPOPS_WALL1 = mint_wallet(wallet_1);
      const STACKSPOPS_WALL2 = mint_wallet(wallet_2, 251, 9750);
      const STACKSPOPS_WALL3 = mint_wallet(wallet_3, 501, 9500);
      const STACKSPOPS_WALL4 = mint_wallet(wallet_4, 751, 9250);
      const STACKSPOPS_WALL5 = mint_wallet(wallet_5, 1001, 9000);
      const STACKSPOPS_WALL6 = mint_wallet(wallet_6, 1251, 8750);
      // We mine empty blocks 
      chain.mineEmptyBlock(MIN_FREEZING_BLOCKS);
  
     //defrostManyPopsByChunkAndTest(deployer.address, chain, STACKSPOPS_ALL_W1);
    },
  });
  