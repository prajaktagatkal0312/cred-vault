import { ShieldedAddress, MidnightBech32m, ShieldedCoinPublicKey, ShieldedEncryptionPublicKey } from '@midnight-ntwrk/wallet-sdk-address-format';
import * as ledger from '@midnight-ntwrk/ledger-v8';
import crypto from 'crypto';

const shieldedSeed = crypto.randomBytes(32);
const shieldedKeys = ledger.ZswapSecretKeys.fromSeed(shieldedSeed);
console.log("Original coin pub hex:", shieldedKeys.coinPublicKey);

const addr = new ShieldedAddress(
  new ShieldedCoinPublicKey(Buffer.from(shieldedKeys.coinPublicKey, 'hex')),
  new ShieldedEncryptionPublicKey(Buffer.from(shieldedKeys.encryptionPublicKey, 'hex'))
);

const encoded = MidnightBech32m.encode('preview', addr).toString();
console.log('Encoded address:', encoded);

try {
  const decoded = MidnightBech32m.parse(encoded).decode(ShieldedAddress, 'preview');
  console.log('Decoded coin pub:', decoded.coinPublicKeyString());
  console.log('Decode ShieldedAddress worked!');
} catch (e: any) {
  console.error('Decode ShieldedAddress failed:', e.stack);
}

const encodedCoin = MidnightBech32m.encode('preview', addr.coinPublicKey).toString();
console.log('Encoded coin:', encodedCoin);
try {
  const decodedCoin = MidnightBech32m.parse(encodedCoin).decode(ShieldedCoinPublicKey as any, 'preview');
  console.log('Decoded coin:', decodedCoin.toHexString());
} catch (e: any) {
  console.error('Decode ShieldedCoinPublicKey failed:', e.stack);
}
