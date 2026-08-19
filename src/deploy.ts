import { buildWallet } from './wallet.js';
import { getMidnightProviders } from './network.js';
import { Contract } from '@midnight-ntwrk/midnight-js-contracts';
import { Contract as CredVaultContract, ledger } from '../contracts/managed/cred-vault/contract/index.js';
import { CompactTypeBytes, persistentHash } from '@midnight-ntwrk/compact-runtime';

// ============================================================
// Holder-side: generate a commitment to a secret without revealing it.
// Confirmed against the real @midnight-ntwrk/compact-runtime exports:
//   persistentHash(rtType, value) — rtType is a CompactType instance
//   new CompactTypeBytes(32)      — the real 32-byte type descriptor
// This matches the .compact circuit's persistentHash<Bytes<32>>(secret).
// ============================================================
export function generateHolderCommitment(holderSecret: Uint8Array): Uint8Array {
  if (holderSecret.length !== 32) {
    throw new Error('holderSecret must be exactly 32 bytes');
  }
  const bytes32Type = new CompactTypeBytes(32);
  return persistentHash(bytes32Type, holderSecret);
}

// ============================================================
// Private state shape.
// NOTE: In a real deployment, these values should NOT be hardcoded:
//   - credType: chosen dynamically by the app (e.g. based on user selection)
//   - salt: generated fresh per issuance via crypto.getRandomValues
//   - holderSecret: derived from the holder's wallet, never leaves their device
//   - issuerId: the issuer's registered public key (Bytes<32>)
// This type/witness object is a stand-in until wallet-derived values are wired in.
// ============================================================
type CredVaultPrivateState = {
  credentialType: Uint8Array;
  holderSecret: Uint8Array;
  issuerId: Uint8Array;
  salt: Uint8Array;
};

const witnesses = {
  credentialType: (context: any): [CredVaultPrivateState, Uint8Array] =>
    [context.privateState, context.privateState.credentialType],
  holderSecret: (context: any): [CredVaultPrivateState, Uint8Array] =>
    [context.privateState, context.privateState.holderSecret],
  issuerId: (context: any): [CredVaultPrivateState, Uint8Array] =>
    [context.privateState, context.privateState.issuerId],
  salt: (context: any): [CredVaultPrivateState, Uint8Array] =>
    [context.privateState, context.privateState.salt],
};

export const deployContract = async (walletSeed: string) => {
  const wallet = await buildWallet(walletSeed);
  const providers = getMidnightProviders();

  const credVaultContract = new Contract(
    new CredVaultContract(witnesses),
    providers
  );

  console.log('Deploying CredVault to Midnight Preview...');
  const deployedContract = await credVaultContract.deploy(wallet);
  console.log('Successfully deployed!');
  console.log('Contract Address:', deployedContract.address);
  return deployedContract;
};
