import { WalletBuilder } from '@midnight-ntwrk/wallet-sdk';
import { getMidnightProviders } from './network.js';

export const buildWallet = async (seed: string) => {
  const providers = getMidnightProviders();
  const wallet = await WalletBuilder.buildFromSeed(
    seed,
    providers,
    'preview' // Explicitly target preview testnet
  );
  return wallet;
};
