# CredVault - Confidential Credentials dApp

![CI/CD](https://github.com/your-username/credvault/actions/workflows/ci.yml/badge.svg)

CredVault is a confidential credentials decentralized application built on the **Midnight Network (Preview Testnet)**. It allows issuers to grant credentials to holders without exposing the holder's identity or the specifics of the credential to the public ledger.

## Privacy Model

CredVault leverages Midnight's zero-knowledge circuits (Compact) to strictly enforce what data is public and what remains private.

### What is Stored On-Chain (Public)
- **Credential Existence:** Stored only as an opaque cryptographic commitment (hash).
- **Validity Status:** An Active/Revoked boolean flag associated with the commitment.
- **Authorized Issuers:** A ledger map of authorized issuer public keys that are permitted to issue credentials.

### What is Stored Off-Chain (Private State)
- **Credential Type:** The actual content or type of the credential (e.g., "KYC_VERIFIED") is passed as a private witness.
- **Holder Identity:** The holder's unique secret is never revealed on-chain.
- **Issuer Identity per Credential:** While the set of ALL issuers is public, exactly WHICH issuer granted a specific credential remains private.
- **Cryptographic Salt:** Used to prevent rainbow table attacks on the commitments.

By keeping the raw inputs off-chain and only verifying zero-knowledge proofs on-chain, CredVault completely preserves user privacy.

## Setup Instructions

### Prerequisites
- Node.js >= 18.0.0
- Midnight Lace Wallet Extension (configured to Preview Testnet)
- Docker (Required for the local Midnight Proof Server)

### Running the Local Proof Server (Required)
Because zero-knowledge proving is extremely computationally intensive, Midnight v4 requires a local proof server daemon to generate proofs client-side. The dApp will fail to submit transactions if this is not running.

Start the official Midnight proof server in Docker on your machine:
\\\ash
docker run -d -p 6300:6300 ghcr.io/midnight-ntwrk/proof-server:latest
\\\
*(This will bind to \http://127.0.0.1:6300\ which the frontend uses by default).*

### Installation
1. Clone the repository
2. Install frontend dependencies:
   \\\ash
   cd frontend
   npm install
   \\\

### Testing
Run the Vitest test suite covering issuance logic, access control, and utilities:
\\\ash
cd frontend
npm run test
\\\

### Frontend
Run the local Vite development server:
\\\ash
cd frontend
npm run dev
\\\
Open \http://localhost:5173\ and connect your Lace Wallet to the **Preview** network.
