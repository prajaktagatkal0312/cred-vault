import { getMidnightProviders } from './network.js';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => 
  new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log('CredVault CLI - Read-Only Query Tool');
  console.log('Connects to Midnight Indexer to query contract state without a wallet.\n');
  
  const address = await question('Enter Contract Address: ');
  
  if (!address) {
    console.error('Address is required.');
    process.exit(1);
  }

  console.log('\nInitializing public data provider...');
  const providers = getMidnightProviders();
  
  try {
    console.log(`Querying state for contract: ${address}`);
    const contractState = await providers.publicDataProvider.queryContractState(address);
    if (!contractState) {
      console.log('No state found on-chain for this address.');
    } else {
      console.log('\nContract State:');
      console.log(JSON.stringify(contractState, null, 2));
      // In a real app, you would deserialize this with the Contract ledger schema
      console.log(`\nRaw State Data (Bytes): ${contractState.data.length} bytes`);
    }
  } catch (error) {
    console.error('Failed to query contract state:', error);
  }
  
  rl.close();
}

main().catch(console.error);
