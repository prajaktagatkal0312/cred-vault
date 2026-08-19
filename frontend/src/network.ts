import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { type MidnightProviders, type PrivateStateProvider } from '@midnight-ntwrk/midnight-js-types';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';

class InMemoryPrivateStateProvider implements PrivateStateProvider<string, any> {
  private states = new Map<string, any>();
  private signingKeys = new Map<string, any>();
  
  async setContractAddress(address: string): Promise<void> {}
  async set(privateStateId: string, privateState: any): Promise<void> {
    this.states.set(privateStateId, privateState);
  }
  async get(privateStateId: string): Promise<any | null> {
    return this.states.get(privateStateId) || null;
  }
  async remove(privateStateId: string): Promise<void> {
    this.states.delete(privateStateId);
  }
  async clear(): Promise<void> {
    this.states.clear();
  }
  async setSigningKey(address: any, signingKey: any): Promise<void> {
    this.signingKeys.set(address, signingKey);
  }
  async getSigningKey(address: any): Promise<any | null> {
    return this.signingKeys.get(address) || null;
  }
  async removeSigningKey(address: any): Promise<void> {
    this.signingKeys.delete(address);
  }
  async clearSigningKeys(): Promise<void> {
    this.signingKeys.clear();
  }
  async exportPrivateStates(): Promise<any> { throw new Error('Not implemented'); }
  async importPrivateStates(): Promise<any> { return { imported: 0, skipped: 0, overwritten: 0 }; }
  async exportSigningKeys(): Promise<any> { throw new Error('Not implemented'); }
  async importSigningKeys(): Promise<any> { return { imported: 0, skipped: 0, overwritten: 0 }; }
}

export const NETWORK_CONFIG = {
  indexer: 'https://indexer.preview.midnight.network/api/v4/graphql',
  indexerWs: 'wss://indexer.preview.midnight.network/api/v4/graphql/ws',
  node: import.meta.env.VITE_MIDNIGHT_NODE_URL || 'https://rpc.preview.midnight.network',
  proofServer: import.meta.env.VITE_MIDNIGHT_PROOF_SERVER_URL || 'http://127.0.0.1:6300',
};

export const getMidnightProviders = (accountId: string = 'default-account'): Partial<MidnightProviders> => {
  // In the browser, we fetch the ZK config from a static URL, or just use the local vite dev server to serve it.
  // The contract artifacts should be placed in the public directory of the frontend, e.g. /contract/
  const zkConfigProvider = new FetchZkConfigProvider(
    window.location.origin + '/cred-vault', 
    fetch.bind(window)
  );
  
  console.log('FINAL RESOLVED INDEXER URL:', NETWORK_CONFIG.indexer);
  console.log('FINAL RESOLVED INDEXER WS URL:', NETWORK_CONFIG.indexerWs);
  
  return {
    publicDataProvider: indexerPublicDataProvider(NETWORK_CONFIG.indexer, NETWORK_CONFIG.indexerWs),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(NETWORK_CONFIG.proofServer, zkConfigProvider),
    privateStateProvider: new InMemoryPrivateStateProvider()
  };
};
