import * as dotenv from 'dotenv';
dotenv.config();

import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { type MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
export const NETWORK_CONFIG = {
  indexer: process.env.VITE_MIDNIGHT_INDEXER_URL || 'https://indexer.preview.midnight.network/api/v1/graphql',
  indexerWs: process.env.VITE_MIDNIGHT_INDEXER_WS_URL || 'wss://indexer.preview.midnight.network/api/v1/graphql/ws',
  node: process.env.VITE_MIDNIGHT_NODE_URL || 'https://rpc.preview.midnight.network',
  proofServer: process.env.VITE_MIDNIGHT_PROOF_SERVER_URL || 'https://proof-pub.preview.midnight.network',
};

export const getMidnightProviders = (accountId: string = 'default-account'): Partial<MidnightProviders> => {
  const zkConfigProvider = new NodeZkConfigProvider('./contracts/managed/cred-vault');
  
  return {
    publicDataProvider: indexerPublicDataProvider(NETWORK_CONFIG.indexer, NETWORK_CONFIG.indexerWs),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(NETWORK_CONFIG.proofServer),
    privateStateProvider: levelPrivateStateProvider({ 
      privateStateStoreName: 'cred-vault-private-state',
      midnightDbName: 'cred-vault-db',
      signingKeyStoreName: 'cred-vault-signing',
      accountId,
      privateStoragePasswordProvider: async () => Buffer.from('insecure-dev-password')
    })
  };
};
