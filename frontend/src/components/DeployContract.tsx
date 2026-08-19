import React, { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { buildWalletAdapter } from '../walletAdapter';
import { getMidnightProviders } from '../network';
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { Contract as CredVaultContract } from '../../../contracts/managed/cred-vault/contract';
import { RedactedValue } from './RedactedValue';
import { Stamp } from './Stamp';

export const DeployContract: React.FC<{
  setContractAddress: (addr: string) => void;
  contractAddress: string;
}> = ({ setContractAddress, contractAddress }) => {
  const { status, walletAPI, connect, error } = useWallet();
  const [deployStatus, setDeployStatus] = useState<string>('');
  const [deployError, setDeployError] = useState<string>('');

  const handleDeploy = async () => {
    console.log('handleDeploy triggered! contractAddress state is currently:', contractAddress);
    if (!walletAPI) return;
    try {
      setDeployError('');
      setDeployStatus('Building adapter...');
      const adapter = await buildWalletAdapter(walletAPI as any);
      
      setDeployStatus('Initializing providers...');
      const baseProviders = getMidnightProviders();
      
      const providers = {
        ...baseProviders,
        walletProvider: adapter,
        midnightProvider: adapter,
      } as any;

      setDeployStatus('Deploying contract... please sign in Lace.');
      
      const witnesses = {
        credentialType: (context: any) => [context.privateState, context.privateState.credentialType],
        holderSecret: (context: any) => [context.privateState, context.privateState.holderSecret],
        issuerId: (context: any) => [context.privateState, context.privateState.issuerId],
        salt: (context: any) => [context.privateState, context.privateState.salt],
      };
      
      let lastTxHash = '';
      const originalSubmitTx = adapter.submitTx;
      adapter.submitTx = async (tx) => {
        lastTxHash = await originalSubmitTx(tx);
        console.log('Deploy tx hash:', lastTxHash);
        setDeployStatus('Transaction submitted. Polling for confirmation...');
        return lastTxHash;
      };

      const compiledContract = CompiledContract.withWitnesses(
        CompiledContract.make('cred-vault', CredVaultContract),
        witnesses as any
      );

      const deployPromise = deployContract(providers, {
        compiledContract,
        privateStateId: 'cred-vault-private-state',
        initialPrivateState: {
          credentialType: new Uint8Array(32),
          holderSecret: new Uint8Array(32),
          issuerId: new Uint8Array(32),
          salt: new Uint8Array(32),
        },
        args: []
      });

      const pollingPromise = new Promise(async (resolve, reject) => {
        while (!lastTxHash) {
          await new Promise(r => setTimeout(r, 1000));
        }
        
        const interval = setInterval(async () => {
          try {
            const requestBody = {
              query: `query { transactions(offset: { hash: "${lastTxHash}" }) { hash contractActions { address } block { hash } } }`
            };
            
            const res = await fetch('https://indexer.preview.midnight.network/api/v4/graphql', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody)
            });
            
            const json = await res.json();
            const tx = json?.data?.transactions?.[0];
            
            if (tx && tx.block?.hash) {
              clearInterval(interval);
              const address = tx.contractActions?.[0]?.address;
              if (address) {
                resolve({ deployTxData: { public: { contractAddress: address } } });
              }
            }
          } catch (e) {
            console.error("Polling error caught:", e);
          }
        }, 3000);

        setTimeout(() => {
          clearInterval(interval);
          reject(new Error('Fallback polling timed out after 60 seconds.'));
        }, 60000);
      });

      const deployedContract = await Promise.race([deployPromise, pollingPromise]) as any;
      console.log('deployedContract:', deployedContract);
      
      const addressRaw = deployedContract.deployTxData.public.contractAddress;
      console.log('deployed address raw:', addressRaw, typeof addressRaw);
      const address = typeof addressRaw === 'string' ? addressRaw : (addressRaw as any).toString();
      console.log('deployed address stringified:', address);

      // Auto-register deployer as issuer
      setDeployStatus('Registering deployer as issuer...');
      const { findDeployedContract } = await import('@midnight-ntwrk/midnight-js-contracts');
      
      // Initialize private state with dummies just so findDeployedContract doesn't throw
      await providers.privateStateProvider.set('cred-vault-private-state', {
        credentialType: new Uint8Array(32),
        holderSecret: new Uint8Array(32),
        issuerId: new Uint8Array(32),
        salt: new Uint8Array(32),
      });

      const contract = await findDeployedContract(providers, {
        contractAddress: address,
        compiledContract,
        privateStateId: 'cred-vault-private-state',
      });
      const issuerPublicKey = (adapter as any).getCoinPublicKeyBytes();
      
      let regTxHash = '';
      const origSubmit = adapter.submitTx;
      adapter.submitTx = async (tx: any) => {
        regTxHash = await origSubmit(tx);
        console.log('RegisterIssuer tx hash:', regTxHash);
        setDeployStatus('Registration submitted. Confirming on-chain...');
        return regTxHash;
      };
      
      await contract.callTx.registerIssuer(issuerPublicKey);
      
      setContractAddress(address);
      setDeployStatus('Deployed successfully!');
    } catch (err: any) {
      console.error(err);
      setContractAddress('');
      setDeployStatus('');
      setDeployError(err.message || String(err));
    }
  };

  return (
    <div className="relative bg-cv-surface border border-cv-border rounded-md p-6 sm:p-8 shadow-2xl mb-8">
      <div className="absolute -top-3 left-4 bg-cv-surface px-2 text-[10px] font-mono font-bold text-cv-text-secondary uppercase tracking-widest border border-cv-border border-b-0 rounded-t-sm">
        FILE 01 — DEPLOY
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-mono font-bold text-cv-text-primary uppercase tracking-wide mb-2">Initialize CredVault</h2>
        <p className="text-cv-text-secondary text-sm max-w-2xl">
          Instantiate a new confidential credentials contract on the Midnight Network. All issued credentials will be mathematically bound to this contract address.
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
          <div className="flex flex-col items-start gap-6">
            {!contractAddress && (
              <button 
                onClick={handleDeploy}
                disabled={!!deployStatus && deployStatus !== 'Deployed successfully!'}
                className="w-full sm:w-auto px-6 py-3 bg-cv-accent hover:bg-indigo-500 active:bg-cv-accent active:shadow-inner text-white font-mono font-bold uppercase tracking-wider text-sm rounded-sm transition-all disabled:opacity-50"
              >
                {deployStatus && deployStatus !== 'Deployed successfully!' ? 'Processing...' : 'Deploy Contract'}
              </button>
            )}

            {deployError && (
              <Stamp status="error" text="DENIED" subtext={deployError} />
            )}

            {deployStatus && deployStatus !== 'Deployed successfully!' && (
              <Stamp status="pending" text="PENDING" subtext={deployStatus} />
            )}

            {(contractAddress || deployStatus === 'Deployed successfully!') && (
              <div className="w-full flex flex-col gap-2 p-4 bg-cv-bg border border-cv-border rounded-sm">
                <span className="text-xs font-mono font-bold text-cv-text-secondary uppercase tracking-widest">Contract Address</span>
                <RedactedValue value={contractAddress} />
                {contractAddress && (
                  <div className="mt-2">
                    <Stamp status="success" text="DEPLOYED" />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
