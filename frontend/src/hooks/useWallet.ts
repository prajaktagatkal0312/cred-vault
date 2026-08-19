import { useState, useEffect, useCallback, useRef } from 'react';
import { WalletConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';

export type WalletStatus = 'NOT_INSTALLED' | 'WRONG_NETWORK' | 'ERROR' | 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING';

interface WalletState {
  status: WalletStatus;
  walletAPI: WalletConnectedAPI | null;
  error: string | null;
}

export const useWallet = () => {
  const [state, setState] = useState<WalletState>({
    status: 'DISCONNECTED',
    walletAPI: null,
    error: null,
  });
  
  const isConnecting = useRef(false);

  const getInjectedLace = useCallback(() => {
    const midnight = (window as any).midnight;
    if (!midnight) return null;
    
    // Enumerate window.midnight and find the entry with a callable .connect function AND a string apiVersion
    for (const injected of Object.values(midnight) as any[]) {
      if (injected && typeof injected.connect === 'function' && typeof injected.apiVersion === 'string') {
        return injected;
      }
    }
    return null;
  }, []);

  useEffect(() => {
    // On mount, poll every 500ms for up to ~10 seconds before falling back to NOT_INSTALLED
    let attempts = 0;
    const maxAttempts = 20; // 20 * 500ms = 10s
    
    const pollInterval = setInterval(() => {
      const injected = getInjectedLace();
      if (injected) {
        clearInterval(pollInterval);
        // We found it, but we are not connected yet.
      } else {
        attempts++;
        if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          setState(s => ({ ...s, status: 'NOT_INSTALLED', error: 'Lace wallet not detected.' }));
        }
      }
    }, 500);
    
    return () => clearInterval(pollInterval);
  }, [getInjectedLace]);

  const connect = useCallback(async () => {
    if (isConnecting.current) return;
    
    const injected = getInjectedLace();
    if (!injected) {
      setState({ status: 'NOT_INSTALLED', walletAPI: null, error: 'Lace wallet not installed' });
      return;
    }

    isConnecting.current = true;
    setState(s => ({ ...s, status: 'CONNECTING', error: null }));

    try {
      let api: WalletConnectedAPI | null = null;
      let errorMsg = '';
      
      try {
        // PRIMARY network string for this project
        api = await injected.connect("preview");
      } catch (e: any) {
        errorMsg = e.message || String(e);
        
        // Locked wallet check
        if (errorMsg.toLowerCase().includes('locked')) {
          setState({ status: 'ERROR', walletAPI: null, error: 'Lace wallet is locked. Please unlock it.' });
          isConnecting.current = false;
          return;
        }

        // Defensive fallback probes
        const fallbacks = ['preprod', 'testnet', 'mainnet', 'undeployed'];
        let connectedFallback = false;
        
        for (const net of fallbacks) {
          try {
            api = await injected.connect(net);
            connectedFallback = true;
            break;
          } catch (fallbackError) {
            // Ignore fallback errors and continue probing
          }
        }
        
        if (connectedFallback) {
          setState({ status: 'WRONG_NETWORK', walletAPI: null, error: 'Connected to wrong network. Please switch Lace to Preview network.' });
          isConnecting.current = false;
          return;
        }
      }

      if (api) {
        setState({ status: 'CONNECTED', walletAPI: api, error: null });
      } else {
        setState({ status: 'ERROR', walletAPI: null, error: errorMsg || 'Connection request rejected.' });
      }
    } catch (err: any) {
      setState({ status: 'ERROR', walletAPI: null, error: err.message || 'An unknown error occurred.' });
    } finally {
      isConnecting.current = false;
    }
  }, [getInjectedLace]);

  return { ...state, connect };
};
