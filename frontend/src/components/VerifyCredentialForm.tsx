import { stringToBytes32 } from '../utils';
import React, { useState, useRef } from 'react';
import { useWallet } from '../hooks/useWallet';
import { buildWalletAdapter } from '../walletAdapter';
import { getMidnightProviders } from '../network';
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { Contract as CredVaultContract } from '../../../contracts/managed/cred-vault/contract';
import { Stamp } from './Stamp';
import { Upload } from 'lucide-react';

export const VerifyCredentialForm: React.FC<{ contractAddress: string }> = ({ contractAddress }) => {
  const { status, walletAPI, error, connect } = useWallet();
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [secretFileContent, setSecretFileContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setSecretFileContent(event.target?.result as string);
      reader.readAsText(file);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAPI || !secretFileContent) return;

    setIsVerifying(true);
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

      const secretsData = JSON.parse(secretFileContent);
      if (!secretsData.credentialType || !secretsData.holderSecret || !secretsData.issuerId || !secretsData.salt) {
        throw new Error('Invalid secret file format');
      }

      const hexToUint8Array = (hex: string) => {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
          bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
        }
        return bytes;
      };

      

      await providers.privateStateProvider.set('cred-vault-private-state', {
        credentialType: stringToBytes32(secretsData.credentialType),
        holderSecret: hexToUint8Array(secretsData.holderSecret),
        issuerId: hexToUint8Array(secretsData.issuerId),
        salt: hexToUint8Array(secretsData.salt)
      });

      const contract = await findDeployedContract(providers, {
        contractAddress,
        compiledContract,
        privateStateId: 'cred-vault-private-state',
      });
      
      await contract.callTx.verifyCredential();

      setResult({ success: true, message: 'The proof is valid on-chain.' });
      setSecretFileContent('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setResult({ success: false, message: err.message || 'Verification failed' });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="relative bg-cv-surface border border-cv-border rounded-md p-6 sm:p-8 shadow-2xl mt-8">
      <div className="absolute -top-3 left-4 bg-cv-surface px-2 text-[10px] font-mono font-bold text-cv-text-secondary uppercase tracking-widest border border-cv-border border-b-0 rounded-t-sm">
        FILE 03 â€” VERIFY
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-mono font-bold text-cv-text-primary uppercase tracking-wide mb-2">Verify Credential</h2>
        <p className="text-cv-text-secondary text-sm max-w-2xl">
          Prove ownership of a credential without revealing your identity. The proof is verified against the public contract state.
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
            className="w-full sm:w-auto px-6 py-3 bg-cv-bg hover:bg-cv-border border border-cv-border text-white font-mono font-bold uppercase tracking-wider text-sm rounded-sm transition-all disabled:opacity-50"
          >
            {status === 'CONNECTING' ? 'Connecting...' : 'Connect Wallet'}
          </button>
        ) : (
          <form onSubmit={handleVerify} className="flex flex-col items-start gap-6 w-full">
            <div className="w-full">
              <label className="block text-xs font-mono font-bold text-cv-text-secondary uppercase tracking-widest mb-2">
                Credential Secrets File (.json)
              </label>
              <div className="relative border border-dashed border-cv-border hover:border-cv-accent rounded-sm bg-cv-bg/50 flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-colors group">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  required
                />
                <Upload className="w-6 h-6 text-cv-text-secondary group-hover:text-cv-accent mb-3 transition-colors" />
                <p className="text-sm text-cv-text-primary font-medium">
                  {secretFileContent ? 'File loaded successfully' : 'Click or drag file to upload'}
                </p>
                <p className="text-xs text-cv-text-secondary mt-1">
                  Upload the JSON file provided by your issuer
                </p>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isVerifying || !secretFileContent || !contractAddress}
              className="w-full sm:w-auto px-6 py-3 bg-cv-accent hover:bg-indigo-500 active:bg-cv-accent active:shadow-inner text-white font-mono font-bold uppercase tracking-wider text-sm rounded-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isVerifying ? 'Processing...' : 'Verify Credential'}
            </button>
          </form>
        )}

        {isVerifying && (
          <div className="mt-6">
            <Stamp status="pending" text="PENDING" subtext="Awaiting network confirmation..." />
          </div>
        )}

        {result && (
          <div className="mt-6">
            <Stamp 
              status={result.success ? "success" : "error"} 
              text={result.success ? "VERIFIED" : "DENIED"} 
              subtext={result.message} 
            />
          </div>
        )}
      </div>
    </div>
  );
};


