/**
 * Web3 utilities — MetaMask / Ethereum integration
 *
 * Sepolia Testnet
 *   Chain ID : 11155111  (0xaa36a7)
 *   Explorer : https://sepolia.etherscan.io
 *   Faucet   : https://sepoliafaucet.com
 */
import { ethers } from 'ethers';

export const SEPOLIA = {
  chainId:     '0xaa36a7',       // 11155111 decimal
  chainIdDec:  11155111n,
  name:        'Sepolia Testnet',
  symbol:      'SepoliaETH',
  rpc:         'https://rpc.sepolia.org',
  explorer:    'https://sepolia.etherscan.io',
  faucet:      'https://sepoliafaucet.com',
};

/** Is MetaMask (or any injected provider) available? */
export const hasMetaMask = () =>
  typeof window !== 'undefined' && Boolean(window.ethereum);

/** Get an ethers BrowserProvider from MetaMask */
export const getProvider = () => {
  if (!hasMetaMask()) throw new Error('MetaMask not installed. Please install it from metamask.io');
  return new ethers.BrowserProvider(window.ethereum);
};

/** Request accounts and return the first address */
export const connectWallet = async () => {
  const provider = getProvider();
  await provider.send('eth_requestAccounts', []);
  const signer  = await provider.getSigner();
  return signer.getAddress();
};

/** Return the currently selected address without a popup (null if not connected) */
export const getConnectedAddress = async () => {
  if (!hasMetaMask()) return null;
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    return accounts[0] || null;
  } catch { return null; }
};

/** Sign a message with the connected wallet */
export const signMessage = async (message) => {
  const provider = getProvider();
  const signer   = await provider.getSigner();
  return signer.signMessage(message);
};

/** Switch the wallet to Sepolia; add the network if it's missing */
export const switchToSepolia = async () => {
  if (!hasMetaMask()) throw new Error('MetaMask not installed');
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: SEPOLIA.chainId }],
    });
  } catch (err) {
    // 4902 = chain not added yet
    if (err.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId:         SEPOLIA.chainId,
          chainName:       SEPOLIA.name,
          nativeCurrency:  { name: SEPOLIA.name, symbol: SEPOLIA.symbol, decimals: 18 },
          rpcUrls:         [SEPOLIA.rpc, 'https://sepolia.infura.io/v3/'],
          blockExplorerUrls: [SEPOLIA.explorer],
        }],
      });
    } else throw err;
  }
};

/**
 * Send ETH on Sepolia testnet.
 * @param {string} toAddress  - recipient wallet address
 * @param {string} amountEth  - amount in ETH (e.g. "0.005")
 * @returns {ethers.TransactionResponse}
 */
export const sendSepoliaEth = async (toAddress, amountEth) => {
  if (!hasMetaMask()) throw new Error('MetaMask not installed');

  // Ensure we're on Sepolia
  const provider = getProvider();
  const network  = await provider.getNetwork();
  if (network.chainId !== SEPOLIA.chainIdDec) {
    await switchToSepolia();
  }

  const signer = await provider.getSigner();
  const tx = await signer.sendTransaction({
    to:    toAddress,
    value: ethers.parseEther(amountEth),
  });
  return tx;
};

/** Sepolia Etherscan link for a transaction */
export const txUrl = (hash) => `${SEPOLIA.explorer}/tx/${hash}`;

/** Shorten an address: 0x1234...abcd */
export const shortAddr = (addr) =>
  addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '';

// ── ETH / INR rate ────────────────────────────────────────

let _cachedRate = null;
let _rateTs     = 0;

/**
 * Fetch the current ETH → INR rate from CoinGecko.
 * Cached for 2 minutes to avoid hammering the API.
 * Falls back to 300,000 if the request fails.
 */
export const getEthInrRate = async () => {
  const now = Date.now();
  if (_cachedRate && now - _rateTs < 120_000) return _cachedRate;
  try {
    const res  = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr', { signal: AbortSignal.timeout(4000) });
    const data = await res.json();
    _cachedRate = data.ethereum.inr;
    _rateTs     = now;
    return _cachedRate;
  } catch {
    return _cachedRate || 300_000; // sensible fallback
  }
};

/** Convert INR → ETH string (6 decimal places) */
export const inrToEth = (inr, rate) => (inr / rate).toFixed(6);

/** Format ETH value for display */
export const fmtEth = (eth) => `${Number(eth).toFixed(6)} ETH`;
