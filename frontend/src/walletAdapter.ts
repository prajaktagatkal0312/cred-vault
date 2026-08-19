import { type WalletProvider, type MidnightProvider } from '@midnight-ntwrk/midnight-js-types';
import { type WalletConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { Transaction, SignatureEnabled, Proof, Binding } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { MidnightBech32m, ShieldedAddress } from '@midnight-ntwrk/wallet-sdk-address-format';
import { getNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

// Utility to convert hex strings to Uint8Array and vice-versa
const toHex = (arr: Uint8Array): string =>
  Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');

const fromHex = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
};

/**
 * Builds a manual WalletProvider and MidnightProvider from a connected Lace wallet instance.
 */
export const buildWalletAdapter = async (laceApi: WalletConnectedAPI): Promise<WalletProvider & MidnightProvider & { getCoinPublicKeyBytes: () => Uint8Array }> => {
  const { shieldedAddress } = await laceApi.getShieldedAddresses();
  
  // Use the currently configured network id
  const networkId = getNetworkId(); 
  
  // The SDK has a known runtime bug when decoding individual ShieldedCoinPublicKey/ShieldedEncryptionPublicKey 
  // instances directly via .decode(). However, decoding the unified ShieldedAddress works perfectly and safely 
  // extracts both keys internally.
  // CAVEAT: Decoding logic is verified against self-generated (encode->decode round-trip) test data only. 
  // Not yet verified against a live Lace-issued address. First live Deploy button click against a real connected 
  // wallet is the actual verification of this path — treat any failure there as highest priority, starting here.
  const parsedAddress = MidnightBech32m.parse(shieldedAddress).decode(ShieldedAddress, networkId);

  return {
    getCoinPublicKey: () => parsedAddress.coinPublicKeyString(),
    getCoinPublicKeyBytes: () => {
      const pubKey = parsedAddress.coinPublicKey as any;
      const bytes = pubKey.data || pubKey;
      return new Uint8Array(bytes);
    },
    getEncryptionPublicKey: () => parsedAddress.encryptionPublicKeyString(),
    
    // Note on TTL: WalletConnectedAPI (Lace) does not expose a TTL parameter in balanceUnsealedTransaction;
    // it handles transaction expiration/TTL internally.
    balanceTx: async (tx, _ttl) => {
      console.log('balanceTx called: Asking Lace to balance and sign transaction...');
      const txBytes = tx.serialize();
      const txHex = toHex(txBytes);
      const { tx: balancedTxHex } = await laceApi.balanceUnsealedTransaction(txHex);
      console.log('balanceTx finished: Transaction balanced and signed by Lace.');
      const balancedBytes = fromHex(balancedTxHex);
      return Transaction.deserialize<SignatureEnabled, Proof, Binding>(
        'signature', 
        'proof', 
        'binding', 
        balancedBytes
      );
    },
    
    submitTx: async (tx) => {
      console.log('submitTx called: Submitting transaction to the network via Lace...');
      const txBytes = tx.serialize();
      await laceApi.submitTransaction(toHex(txBytes));
      const hash = tx.transactionHash();
      console.log('submitTx finished: Transaction submitted successfully!');
      console.log('--- TX HASH:', hash, '---');
      console.log('Now waiting for indexer to observe it on-chain...');
      return hash; 
    }
  };
};
