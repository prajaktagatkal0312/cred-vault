import { IssueCredentialForm } from './components/IssueCredentialForm';
import { VerifyCredentialForm } from './components/VerifyCredentialForm';
import { PrivacyPanel } from './components/PrivacyPanel';
import { DeployContract } from './components/DeployContract';

import { useState } from 'react';

function App() {
  const [contractAddress, setContractAddress] = useState<string>('');
  
  return (
    <div className="min-h-screen bg-cv-bg text-cv-text-primary selection:bg-cv-accent/30 font-sans">
      <nav className="border-b border-cv-border bg-cv-surface/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-cv-accent flex items-center justify-center font-mono font-bold text-white text-xs tracking-wider">
                CV
              </div>
              <span className="font-mono font-bold text-lg text-white uppercase tracking-widest">CredVault</span>
            </div>
            <div className="font-mono text-[10px] text-cv-text-secondary uppercase tracking-[0.2em]">
              Security Level: Top Secret
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-16">
          <h1 className="text-3xl md:text-4xl font-mono font-bold text-white uppercase tracking-wider mb-4">
            Confidential Credentials
          </h1>
          <p className="text-base text-cv-text-secondary max-w-3xl leading-relaxed">
            Cryptographic dossier system built on the Midnight Network. Issue and verify credentials without exposing underlying plaintext data. All operations require cryptographic clearance via Lace.
          </p>
        </div>

        <DeployContract setContractAddress={setContractAddress} contractAddress={contractAddress} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <IssueCredentialForm contractAddress={contractAddress} />
          <VerifyCredentialForm contractAddress={contractAddress} />
        </div>

        <PrivacyPanel />
      </main>

      <footer className="border-t border-cv-border py-12 text-center text-xs font-mono text-cv-text-secondary uppercase tracking-widest">
        <p>Built for the Midnight Preview Testnet // Clearance Required</p>
      </footer>
    </div>
  );
}

export default App;
