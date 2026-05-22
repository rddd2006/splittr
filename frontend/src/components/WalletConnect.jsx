import React, { useState, useEffect } from 'react';
import { connectWallet, getConnectedAddress, shortAddr, hasMetaMask } from '../utils/web3';
import { web3Api } from '../api/client';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

/**
 * WalletConnect
 * Renders a "Connect Wallet" button that:
 *  1. Calls MetaMask to get address
 *  2. Fetches a nonce from the backend
 *  3. Signs the nonce message
 *  4. Verifies with backend → gets JWT
 *  5. Logs the user in
 */
export default function WalletConnect({ onSuccess, mode = 'login' }) {
  const { showToast } = useApp();
  const navigate = useNavigate();
  const [step,    setStep]    = useState('idle');  // idle | connecting | signing | verifying | done
  const [address, setAddress] = useState(null);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    getConnectedAddress().then(addr => { if (addr) setAddress(addr); });
  }, []);

  const stepLabel = {
    idle:       mode === 'link' ? 'Link Wallet' : 'Connect Wallet',
    connecting: 'Connecting…',
    signing:    'Sign in MetaMask…',
    verifying:  'Verifying…',
    done:       'Connected!',
  };

  const handleConnect = async () => {
    setError(null);
    try {
      // 1. Get address
      setStep('connecting');
      const addr = await connectWallet();
      setAddress(addr);

      // 2. Get challenge nonce
      setStep('signing');
      const nonceRes = await web3Api.getNonce(addr);
      const { message } = nonceRes.data;

      // 3. Sign the message
      const { signMessage } = await import('../utils/web3');
      const signature = await signMessage(message);

      // 4. Verify with backend
      setStep('verifying');
      let res;
      if (mode === 'link') {
        res = await web3Api.linkWallet({ address: addr, signature });
        showToast('Wallet linked successfully!');
        onSuccess?.(res.data);
      } else {
        res = await web3Api.verify({ address: addr, signature });
        localStorage.setItem('accessToken',  res.data.accessToken);
        localStorage.setItem('refreshToken', res.data.refreshToken);
        setStep('done');
        showToast('Signed in with wallet!');
        onSuccess?.(res.data);
        navigate('/');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Wallet connection failed';
      setError(msg);
      setStep('idle');
    }
  };

  const isLoading = ['connecting','signing','verifying'].includes(step);

  return (
    <div>
      {!hasMetaMask() && (
        <div style={{ background:'rgba(251,191,36,0.1)', border:'1px solid rgba(251,191,36,0.3)', borderRadius:12, padding:'10px 14px', marginBottom:12 }}>
          <p style={{ color:'#fbbf24', fontSize:12, fontFamily:"'Syne',system-ui" }}>
            MetaMask not detected.{' '}
            <a href="https://metamask.io" target="_blank" rel="noreferrer" style={{ color:'#fbbf24', textDecoration:'underline' }}>
              Install it here →
            </a>
          </p>
        </div>
      )}

      <button
        onClick={handleConnect}
        disabled={isLoading || !hasMetaMask()}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          background: isLoading
            ? 'rgba(251,191,36,0.08)'
            : 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.08))',
          border: '1px solid rgba(251,191,36,0.35)',
          borderRadius: 14, padding: '13px 20px',
          color: '#fbbf24', fontSize: 14, fontWeight: 700,
          cursor: isLoading || !hasMetaMask() ? 'not-allowed' : 'pointer',
          fontFamily: "'Syne', system-ui",
          opacity: !hasMetaMask() ? 0.5 : 1,
          transition: 'all 0.2s',
        }}
      >
        {/* MetaMask fox SVG */}
        {!isLoading ? (
          <svg width="20" height="20" viewBox="0 0 35 33" fill="none">
            <path d="M32.9583 1L19.8242 10.7183L22.2566 4.99099L32.9583 1Z" fill="#E17726" stroke="#E17726" strokeWidth="0.25"/>
            <path d="M2.04834 1L15.0707 10.8091L12.7491 4.99098L2.04834 1Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25"/>
            <path d="M28.2292 23.5334L24.7016 28.872L32.2409 30.9315L34.3928 23.6516L28.2292 23.5334Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25"/>
            <path d="M0.619873 23.6516L2.75932 30.9315L10.2869 28.872L6.77151 23.5334L0.619873 23.6516Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25"/>
            <path d="M9.89578 15.1338L7.80469 18.2893L15.2502 18.6284L14.9994 10.6L9.89578 15.1338Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25"/>
            <path d="M25.1049 15.1338L19.9188 10.5091L19.8242 18.6284L27.2015 18.2893L25.1049 15.1338Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25"/>
            <path d="M10.2869 28.872L14.7985 26.7078L10.8888 23.7043L10.2869 28.872Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25"/>
            <path d="M20.2075 26.7078L24.7016 28.872L24.1115 23.7043L20.2075 26.7078Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25"/>
          </svg>
        ) : (
          <div style={{ width:18, height:18, borderRadius:'50%', border:'2px solid rgba(251,191,36,0.3)', borderTopColor:'#fbbf24', animation:'spin 0.8s linear infinite' }} />
        )}

        <span>
          {isLoading ? stepLabel[step] : address && step === 'idle'
            ? `${stepLabel.idle} (${shortAddr(address)})`
            : stepLabel.idle}
        </span>
      </button>

      {address && step === 'idle' && (
        <p style={{ color:'rgba(251,191,36,0.5)', fontSize:10, textAlign:'center', marginTop:8, fontFamily:"'DM Mono',monospace" }}>
          {address}
        </p>
      )}

      {error && (
        <p style={{ color:'#f87171', fontSize:12, marginTop:8, textAlign:'center', fontFamily:"'Syne',system-ui" }}>
          {error}
        </p>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
