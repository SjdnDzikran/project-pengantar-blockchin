import { create } from 'zustand';
import { BrowserProvider } from 'ethers';

const useWalletStore = create((set, get) => ({
  // State
  isConnected: false,
  address: null,
  provider: null,
  chainId: null,
  
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

  disconnectWallet: () => {
    set({
      isConnected: false,
      address: null,
      provider: null,
      chainId: null,
    });
  },

  // Listen to account changes
  setupListeners: () => {
    if (!window.ethereum) return;

    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        get().disconnectWallet();
      } else {
        set({ address: accounts[0] });
      }
    });

    window.ethereum.on('chainChanged', () => {
      window.location.reload();
    });
  },
}));

export default useWalletStore;
