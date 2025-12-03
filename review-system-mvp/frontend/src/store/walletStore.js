import { create } from 'zustand';
import { BrowserProvider } from 'ethers';
import { walletAuthAPI } from '../services/walletAuth';
import useAuthStore from './authStore';

const useWalletStore = create((set, get) => ({
  // State
  isConnected: false,
  address: null,
  provider: null,
  chainId: null,
  isAuthenticating: false,
  
  // Actions
  connectWallet: async () => {
    try {
      if (!window.ethereum) {
        throw new Error('No wallet found. Please install MetaMask or another Web3 wallet.');
      }

      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const network = await provider.getNetwork();
      
      set({
        isConnected: true,
        address: accounts[0],
        provider,
        chainId: Number(network.chainId),
      });

      return accounts[0];
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  },

  authenticateWallet: async () => {
    const { address, provider } = get();
    
    if (!address || !provider) {
      throw new Error('Wallet not connected');
    }

    set({ isAuthenticating: true });

    try {
      // Step 1: Get nonce from backend
      const nonceResponse = await walletAuthAPI.getNonce(address);
      const { nonce, message } = nonceResponse.data.data;

      // Step 2: Sign the nonce with user's wallet
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(nonce);

      // Step 3: Verify signature and get JWT token
      const authResponse = await walletAuthAPI.verifySignature(address, signature);
      const { user, token } = authResponse.data.data;

      // Step 4: Store auth data
      localStorage.setItem('token', token);
      useAuthStore.getState().setAuth(user, token);

      return { user, token };
    } catch (error) {
      console.error('Failed to authenticate wallet:', error);
      throw error;
    } finally {
      set({ isAuthenticating: false });
    }
  },

  disconnectWallet: () => {
    set({
      isConnected: false,
      address: null,
      provider: null,
      chainId: null,
    });
    
    // Also clear auth
    localStorage.removeItem('token');
    useAuthStore.getState().logout();
  },

  // Listen to account changes
  setupListeners: () => {
    if (!window.ethereum) return;

    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        get().disconnectWallet();
      } else {
        set({ address: accounts[0] });
        // Clear auth when account changes - user needs to re-authenticate
        localStorage.removeItem('token');
        useAuthStore.getState().logout();
      }
    });

    window.ethereum.on('chainChanged', () => {
      window.location.reload();
    });
  },
}));

export default useWalletStore;
