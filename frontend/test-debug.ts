import { ShieldedCoinPublicKey, MidnightBech32m } from '@midnight-ntwrk/wallet-sdk-address-format';
import crypto from 'crypto';

const dummyCoin = new ShieldedCoinPublicKey(crypto.randomBytes(32));
console.log('Original Hex:', dummyCoin.toHexString());

const bechStr = ShieldedCoinPublicKey.codec.encode('preview', dummyCoin).asString();
console.log('Bech32m:', bechStr);

const parsed = MidnightBech32m.parse(bechStr);
console.log('Parsed data:', parsed.data.toString('hex'));

const recovered = new ShieldedCoinPublicKey(parsed.data);
console.log('Recovered Hex:', recovered.toHexString());
console.log('Match?', dummyCoin.toHexString() === recovered.toHexString());
