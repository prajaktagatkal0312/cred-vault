import { stringToBytes32 } from '../utils';
import React, { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { buildWalletAdapter } from '../walletAdapter';
import { getMidnightProviders } from '../network';
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { Contract as CredVaultContract } from '../../../contracts/managed/cred-vault/contract';
import { persistentHash, Bytes32Descriptor } from '@midnight-ntwrk/compact-runtime';
import { Stamp } from './Stamp';

export const IssueCredentialForm: React.FC<{ contractAddress: string }> = ({ contractAddress }) => {
  const { status, walletAPI, error, connect } = useWallet();
  const [credentialType, setCredentialType] = useState('');
  const [isIssuing, setIsIssuing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAPI) return;

    setIsIssuing(true);
    setResult(null);

    try {
      if (!contractAddress) throw new Error('Contract not deployed or address missing');
      
      const adapter = await buildWalletAdapter(walletAPI as any);
      const baseProviders = getMidnightProviders();
      const providers = {
        ...baseProviders,
        walletProvider: adapter,
        midnightProvider: adapter,
      } as any;
      
      const holderSecret = crypto.getRandomValues(new Uint8Array(32));
      const salt = crypto.getRandomValues(new Uint8Array(32));
      
      // Calculate commitment
      const bytes32Type = Bytes32Descriptor;
      const rawHolderCommitment = persistentHash(bytes32Type, holderSecret);
      const holderCommitment = new Uint8Array(rawHolderCommitment as any);
      
      const issuerPublicKey = (adapter as any).getCoinPublicKeyBytes();
      if (!issuerPublicKey) throw new Error("Could not extract coin public key from adapter");
      console.log('Unwrapped issuerPublicKey length:', issuerPublicKey.length, 'isUint8Array:', issuerPublicKey instanceof Uint8Array);
      
      const witnesses = {
        credentialType: (context: any) => [context.privateState, context.privateState.credentialType],
        holderSecret: (context: any) => [context.privateState, context.privateState.holderSecret],
        issuerId: (context: any) => [context.privateState, context.privateState.issuerId],
        salt: (context: any) => [context.privateState, context.privateState.salt],
      };
      
      const compiledContract = CompiledContract.withWitnesses(
        CompiledContract.make('cred-vault', CredVaultContract),
        witnesses as any
      );

      

      await providers.privateStateProvider.set('cred-vault-private-state', {
        credentialType: stringToBytes32(credentialType),
        holderSecret,
        issuerId: issuerPublicKey,
        salt,
      });

      const contract = await findDeployedContract(providers, {
        contractAddress,
        compiledContract,
        privateStateId: 'cred-vault-private-state',
      });

      await contract.callTx.issueCredential(holderCommitment, issuerPublicKey);

      const secretsData = {
        credentialType,
        holderSecret: Array.from(holderSecret).map(b => b.toString(16).padStart(2, '0')).join(''),
        issuerId: Array.from(issuerPublicKey as Uint8Array).map((b: any) => b.toString(16).padStart(2, '0')).join(''),
        salt: Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')
      };

      const blob = new Blob([JSON.stringify(secretsData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `credential-${credentialType.replace(/\s+/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setResult({ success: true, message: 'Secrets downloaded.' });
      setCredentialType('');
    } catch (err: any) {
      setResult({ success: false, message: err.message || 'Failed to issue credential' });
    } finally {
      setIsIssuing(false);
    }
  };

  return (
    <div className="relative bg-cv-surface border border-cv-border rounded-md p-6 sm:p-8 shadow-2xl">
      <div className="absolute -top-3 left-4 bg-cv-surface px-2 text-[10px] font-mono font-bold text-cv-text-secondary uppercase tracking-widest border border-cv-border border-b-0 rounded-t-sm">
        FILE 02 â€” ISSUE
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-mono font-bold text-cv-text-primary uppercase tracking-wide mb-2">Issue Credential</h2>
        <p className="text-cv-text-secondary text-sm max-w-2xl">
          Generate a confidential credential. The cryptographic details remain private, bound to the holder's secret.
        </p>
      </div>

      {status === 'ERROR' && error ? (
        <div className="mb-6">
          <Stamp status="error" text="DENIED" subtext={error} />
        </div>
      ) : status === 'WRONG_NETWORK' ? (
        <div className="mb-6">
          <Stamp status="error" text="DENIED" subtext={error || 'Please connect to Midnight Preview network.'} />
        </div>
      ) : status === 'NOT_INSTALLED' ? (
        <div className="mb-6">
          <Stamp status="error" text="DENIED" subtext={error || 'Lace wallet is not installed.'} />
        </div>
      ) : null}

      <div className="space-y-6">
        {status !== 'CONNECTED' ? (
          <button 
            onClick={connect}
            disabled={status === 'CONNECTING'}
            className="w-full sm:w-auto px-6 py-3 bg-cv-accent hover:bg-indigo-500 active:bg-cv-accent active:shadow-inner text-white font-mono font-bold uppercase tracking-wider text-sm rounded-sm transition-all disabled:opacity-50"
          >
            {status === 'CONNECTING' ? 'Connecting...' : 'Connect Wallet'}
          </button>
        ) : (
          <form onSubmit={handleIssue} className="flex flex-col items-start gap-6">
            <div className="w-full">
              <label className="block text-xs font-mono font-bold text-cv-text-secondary uppercase tracking-widest mb-2">
                Credential Type
              </label>
              <input
                type="text"
                value={credentialType}
                onChange={(e) => setCredentialType(e.target.value)}
                className="w-full bg-cv-bg border border-cv-border rounded-sm px-4 py-3 text-cv-text-primary font-mono focus:outline-none focus:border-cv-accent focus:ring-1 focus:ring-cv-accent transition-all placeholder:text-cv-text-secondary/50"
                placeholder="E.G., KYC_VERIFIED"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isIssuing || !credentialType || !contractAddress}
              className="w-full sm:w-auto px-6 py-3 bg-cv-accent hover:bg-indigo-500 active:bg-cv-accent active:shadow-inner text-white font-mono font-bold uppercase tracking-wider text-sm rounded-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isIssuing ? 'Processing...' : 'Issue Credential'}
            </button>
          </form>
        )}

        {isIssuing && (
          <div className="mt-6">
            <Stamp status="pending" text="PENDING" subtext="Awaiting network confirmation..." />
          </div>
        )}

        {result && (
          <div className="mt-6">
            <Stamp 
              status={result.success ? "success" : "error"} 
              text={result.success ? "ISSUED" : "DENIED"} 
              subtext={result.message} 
            />
          </div>
        )}
      </div>
    </div>
  );
};


