
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
        STACKSPOPS_ALL.push(bottom)
        bottom+=1;
      } else {
        STACKSPOPS_ALL.push(top)
        top-=1;
      }
    }
    return { STACKSPOPS_ALL, top, bottom };
  };
  
  export const freezeManyPopsByChunkAndTest = (caller: string, chain: Chain, pops: any, name: string) => {
    console.log(`------- > Start freeze for ${name}`);
    const chunks = chunkArray(pops, 5);
    let i = 1;
    for(const chunk of chunks) {
      console.log(`Freeze chunck ${i} out of ${chunks.length}`);
      freezePopsAndTest(caller, chain, '(ok true)', chunk)
      i += 1;
    }
  };

  function chunkArray(array: any, chunkSize: any) {
    return Array.from(
      { length: Math.ceil(array.length / chunkSize) },
      (_, index) => array.slice(index * chunkSize, (index + 1) * chunkSize)   
    );
  }
  
  export const defrostManyPopsByChunkAndTest = (caller: string, chain: Chain, pops: any, name: string, expected_reward: number) => {
    console.log(`------- > Start defrost for ${name}`);
    const chunks = chunkArray(pops, 5);
    let i = 1;
    for(const chunk of chunks) {
      console.log(`Defrost chunck ${i} out of ${chunks.length}`)
      defrostPopsAndTest(caller, chain, '(ok true)', chunk, expected_reward);
      i+= 1;
    }
  };
  // 0 1 2 3 4 5

  
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


      const mint_wallet = (wallet: any, bottom: number = 1, top: number = 10000, name: string) =>{
        const { STACKSPOPS_ALL } = mintManyPopsAndTest(wallet.address, chain, 500, bottom, top); // 500 tx
        return STACKSPOPS_ALL;
      }

      // we mine all the 3000 pops
      const STACKSPOPS_WALL1 = mint_wallet(wallet_1, 1, 10000, 'wallet1');
      const STACKSPOPS_WALL2 = mint_wallet(wallet_2, 251, 9750, 'wallet2');
      const STACKSPOPS_WALL3 = mint_wallet(wallet_3, 501, 9500, 'wallet3');
      const STACKSPOPS_WALL4 = mint_wallet(wallet_4, 751, 9250, 'wallet4');
      const STACKSPOPS_WALL5 = mint_wallet(wallet_5, 1001, 9000, 'wallet5');
      const STACKSPOPS_WALL6 = mint_wallet(wallet_6, 1251, 8750, 'wallet6');


      freezeManyPopsByChunkAndTest(wallet_1.address, chain, STACKSPOPS_WALL1, 'wallet1'); // 50 block
      freezeManyPopsByChunkAndTest(wallet_2.address, chain, STACKSPOPS_WALL2, 'wallet2'); // 50 block
      freezeManyPopsByChunkAndTest(wallet_3.address, chain, STACKSPOPS_WALL3, 'wallet3'); // 50 block
      freezeManyPopsByChunkAndTest(wallet_4.address, chain, STACKSPOPS_WALL4, 'wallet4'); // 50 block
      freezeManyPopsByChunkAndTest(wallet_5.address, chain, STACKSPOPS_WALL5, 'wallet5'); // 50 block
      freezeManyPopsByChunkAndTest(wallet_6.address, chain, STACKSPOPS_WALL6, 'wallet6'); // 50 block

      // We mine empty blocks 
      chain.mineEmptyBlock(MIN_FREEZING_BLOCKS);
  
     defrostManyPopsByChunkAndTest(wallet_1.address, chain, STACKSPOPS_WALL1, 'wallet1', 1600);
     defrostManyPopsByChunkAndTest(wallet_2.address, chain, STACKSPOPS_WALL2, 'wallet2', 1600);
     defrostManyPopsByChunkAndTest(wallet_3.address, chain, STACKSPOPS_WALL3, 'wallet3', 1600);
     defrostManyPopsByChunkAndTest(wallet_4.address, chain, STACKSPOPS_WALL4, 'wallet4', 1600);
     defrostManyPopsByChunkAndTest(wallet_5.address, chain, STACKSPOPS_WALL5, 'wallet5', 1600);
     defrostManyPopsByChunkAndTest(wallet_6.address, chain, STACKSPOPS_WALL6, 'wallet6', 1600);
    },
  });
  