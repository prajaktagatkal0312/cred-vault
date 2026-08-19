import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { Contract as CredVaultContract } from '../../contracts/managed/cred-vault/contract/index.js';

async function main() {
  const witnesses = {
    credentialType: (context: any) => [context.privateState, context.privateState.credentialType],
    holderSecret: (context: any) => [context.privateState, context.privateState.holderSecret],
    issuerId: (context: any) => [context.privateState, context.privateState.issuerId],
    salt: (context: any) => [context.privateState, context.privateState.salt],
  };

  const compiledContract = {
    tag: 'cred-vault',
    [Symbol.for('compact-js/CompiledContract')]: {
      ctor: CredVaultContract,
      witnesses
    }
  } as any;

  // Fake providers to get past validation
  const dummyProvider = {} as any;
  const providers = {
    privateStateProvider: dummyProvider,
    zkConfigProvider: dummyProvider,
    publicDataProvider: dummyProvider,
    proofProvider: dummyProvider,
    walletProvider: dummyProvider,
    midnightProvider: dummyProvider,
  } as any;

  console.log('Calling deployContract...');
  try {
    await deployContract(providers, {
      compiledContract,
      privateStateId: 'cred-vault-private-state',
      initialPrivateState: {
        credentialType: new Uint8Array(32),
        holderSecret: new Uint8Array(32),
        issuerId: new Uint8Array(32),
        salt: new Uint8Array(32),
      },
      args: []
    });
  } catch (err: any) {
    console.log('Error thrown (expected network/crypto, NOT contract validation):');
    console.log(err.message || err);
    console.log(err.stack);
  }
}

main().catch(console.error);
