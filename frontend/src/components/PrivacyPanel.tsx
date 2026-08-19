import { Shield, EyeOff, Lock } from 'lucide-react';

export const PrivacyPanel = () => {
  return (
    <div className="relative bg-cv-surface border border-cv-border rounded-md p-6 sm:p-8 shadow-2xl">
      <div className="absolute -top-3 left-4 bg-cv-surface px-2 text-[10px] font-mono font-bold text-cv-text-secondary uppercase tracking-widest border border-cv-border border-b-0 rounded-t-sm">
        FILE 04 — SECURITY
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-mono font-bold text-cv-text-primary uppercase tracking-wide mb-2">Zero-Knowledge Guarantees</h2>
        <p className="text-cv-text-secondary text-sm">
          System operational parameters and privacy boundaries enforced by the Midnight Network.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border border-cv-border p-5 rounded-sm bg-cv-bg/30">
          <Shield className="w-8 h-8 text-cv-accent mb-4" />
          <h3 className="font-mono font-bold uppercase tracking-wide text-sm mb-2 text-white">Immutable Logic</h3>
          <p className="text-cv-text-secondary text-sm leading-relaxed">
            The verification circuitry is permanently deployed. Altering the logic requires a new deployment and re-issuance of all credentials.
          </p>
        </div>
        
        <div className="border border-cv-border p-5 rounded-sm bg-cv-bg/30">
          <EyeOff className="w-8 h-8 text-cv-accent mb-4" />
          <h3 className="font-mono font-bold uppercase tracking-wide text-sm mb-2 text-white">Confidential State</h3>
          <p className="text-cv-text-secondary text-sm leading-relaxed">
            Secrets are hashed locally. The network only sees ZK proofs of valid commitments, not the raw credentials or holder identities.
          </p>
        </div>
        
        <div className="border border-cv-border p-5 rounded-sm bg-cv-bg/30">
          <Lock className="w-8 h-8 text-cv-accent mb-4" />
          <h3 className="font-mono font-bold uppercase tracking-wide text-sm mb-2 text-white">Holder Control</h3>
          <p className="text-cv-text-secondary text-sm leading-relaxed">
            Only the entity possessing the original downloaded JSON secrets can successfully generate a valid zero-knowledge proof for verification.
          </p>
        </div>
      </div>
    </div>
  );
};

