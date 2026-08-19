import { buildWalletAdapter } from './frontend/src/walletAdapter';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { ShieldedAddress, ShieldedCoinPublicKey, ShieldedEncryptionPublicKey, MidnightBech32m } from '@midnight-ntwrk/wallet-sdk-address-format';
import crypto from 'crypto';

setNetworkId('preview');

// Generate dummy keys
const dummyCoinData = crypto.randomBytes(32);
const dummyEncData = crypto.randomBytes(32);
const dummyCoin = new ShieldedCoinPublicKey(dummyCoinData);
const dummyEnc = new ShieldedEncryptionPublicKey(dummyEncData);
const dummyAddress = new ShieldedAddress(dummyCoin, dummyEnc);

const laceApiMock: any = {
  getShieldedAddresses: async () => {
    return {
      shieldedAddress: MidnightBech32m.encode('preview', dummyAddress).asString(),
      shieldedCoinPublicKey: dummyAddress.coinPublicKeyString(),
      shieldedEncryptionPublicKey: dummyAddress.encryptionPublicKeyString()
    };
  }
};

(async () => {
  console.log("Mocking WalletConnectedAPI...");
  console.log("Original Coin Pub (Hex):", dummyCoinData.toString('hex'));
  
  const adapter = await buildWalletAdapter(laceApiMock);
  
  const resolvedCoinPub = adapter.getCoinPublicKey();
  console.log("Decoded Coin Pub (Hex): ", resolvedCoinPub);
  
  if (resolvedCoinPub === dummyCoinData.toString('hex')) {
    console.log("✅ SUCCESS: Decoded key perfectly matches the original!");
  } else {
    console.log("❌ FAILURE: Mismatch!");
  }
})();
