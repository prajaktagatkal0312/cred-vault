import {
  Contract,
  ledger,
  type Witnesses,
} from '../contracts/managed/cred-vault/contract/index.js';
import {
  CompactTypeBytes,
  persistentHash,
  createCircuitContext,
  createConstructorContext,
  dummyContractAddress,
} from '@midnight-ntwrk/compact-runtime';

function bytes32(fill: number): Uint8Array {
  return new Uint8Array(32).fill(fill);
}

function holderCommitmentOf(secret: Uint8Array): Uint8Array {
  return persistentHash(new CompactTypeBytes(32), secret);
}

type CredVaultPrivateState = {
  credentialType: Uint8Array;
  holderSecret: Uint8Array;
  issuerId: Uint8Array;
  salt: Uint8Array;
};

// Stand-in 32-byte hex-encoded coin public key for tests (not a real wallet key).
const testCoinPublicKey = '0'.repeat(64);

describe('CredVault Smart Contract', () => {
  const issuerSecretSeed = bytes32(0xaa);
  const holderSecret = bytes32(0xbb);
  const credType = bytes32(0x01);
  const salt = bytes32(0x99);

  let context: any;

  beforeEach(() => {
    const privateState: CredVaultPrivateState = {
      credentialType: credType,
      holderSecret: holderSecret,
      issuerId: issuerSecretSeed,
      salt: salt,
    };

    const witnesses: Witnesses<CredVaultPrivateState> = {
      credentialType: (ctx) => [ctx.privateState, ctx.privateState.credentialType],
      holderSecret: (ctx) => [ctx.privateState, ctx.privateState.holderSecret],
      issuerId: (ctx) => [ctx.privateState, ctx.privateState.issuerId],
      salt: (ctx) => [ctx.privateState, ctx.privateState.salt],
    };

    const contract = new Contract<CredVaultPrivateState>(witnesses);

    const constructorResult = contract.initialState(
      createConstructorContext(privateState, testCoinPublicKey)
    );

    const circuitContext = createCircuitContext(
      dummyContractAddress(),
      testCoinPublicKey,
      constructorResult.currentContractState,
      constructorResult.currentPrivateState
    );

    context = { contract, circuitContext };
  });

  it('registerIssuer() succeeds for a new issuer', () => {
    const result = context.contract.impureCircuits.registerIssuer(
      context.circuitContext,
      issuerSecretSeed
    );
    expect(result).toBeDefined();
  });

  it('issueCredential() succeeds for a new credential and increments credentialCount', () => {
    let step = context.contract.impureCircuits.registerIssuer(
      context.circuitContext,
      issuerSecretSeed
    );

    const holderCommitment = holderCommitmentOf(holderSecret);

    step = context.contract.impureCircuits.issueCredential(
      step.context,
      holderCommitment,
      issuerSecretSeed
    );

    // NOTE: exact path to the ledger-queryable state on CircuitContext
    // (step.context.currentQueryContext / .state) is not yet confirmed —
    // if this line errors, that's the next thing to inspect.
    const ledgerState = ledger(step.context.currentQueryContext.state);
    expect(ledgerState.credentialCount).toBe(1n);
  });

  it('issueCredential() fails if called twice with identical credType + salt', () => {
    let step = context.contract.impureCircuits.registerIssuer(
      context.circuitContext,
      issuerSecretSeed
    );

    const holderCommitment = holderCommitmentOf(holderSecret);

    step = context.contract.impureCircuits.issueCredential(
      step.context,
      holderCommitment,
      issuerSecretSeed
    );

    expect(() => {
      context.contract.impureCircuits.issueCredential(
        step.context,
        holderCommitment,
        issuerSecretSeed
      );
    }).toThrow();
  });

  it('verifyCredential() succeeds for a valid, non-revoked credential', () => {
    let step = context.contract.impureCircuits.registerIssuer(
      context.circuitContext,
      issuerSecretSeed
    );

    const holderCommitment = holderCommitmentOf(holderSecret);

    step = context.contract.impureCircuits.issueCredential(
      step.context,
      holderCommitment,
      issuerSecretSeed
    );

    expect(() => {
      context.contract.impureCircuits.verifyCredential(step.context);
    }).not.toThrow();
  });

  it('verifyCredential() FAILS for a credential that has been revoked', () => {
    let step = context.contract.impureCircuits.registerIssuer(
      context.circuitContext,
      issuerSecretSeed
    );

    const holderCommitment = holderCommitmentOf(holderSecret);

    step = context.contract.impureCircuits.issueCredential(
      step.context,
      holderCommitment,
      issuerSecretSeed
    );

    step = context.contract.impureCircuits.revokeCredential(
      step.context,
      holderCommitment,
      issuerSecretSeed
    );

    expect(() => {
      context.contract.impureCircuits.verifyCredential(step.context);
    }).toThrow();
  });
});
