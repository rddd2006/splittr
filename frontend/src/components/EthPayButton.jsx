import React, { useState, useEffect } from 'react';
import { sendSepoliaEth, getEthInrRate, inrToEth, fmtEth, txUrl, switchToSepolia, shortAddr, SEPOLIA } from '../utils/web3';
import { settlementsApi } from '../api/client';

/**
 * EthPayButton
 * Pays a settlement in Sepolia ETH via MetaMask.
 *
 * Props:
 *   toAddress   string  — recipient's Ethereum wallet address
 *   recipientName string
 *   amountInr   number  — INR amount to convert & pay
 *   groupId     string
 *   toUserId    string
 *   onPaid      fn      — called after successful tx
 */
export default function EthPayButton({ toAddress, recipientName, amountInr, groupId, toUserId, onPaid }) {
  const [rate,    setRate]    = useState(null);
  const [status,  setStatus]  = useState('idle');  // idle | switching | pending | success | error
  const [txHash,  setTxHash]  = useState(null);
  const [err,     setErr]     = useState(null);
  const [modal,   setModal]   = useState(false);

  useEffect(() => { getEthInrRate().then(setRate); }, []);

  if (!toAddress) return (
    <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'8px 14px' }}>
      <p style={{ color:'rgba(240,240,244,0.25)', fontSize:11, fontFamily:"'Syne',system-ui" }}>No wallet linked</p>
    </div>
  );

  const ethAmount = rate ? inrToEth(amountInr, rate) : null;

  const handlePay = async () => {
    setErr(null);
    try {
      setStatus('switching');
      await switchToSepolia();

      setStatus('pending');
      const tx = await sendSepoliaEth(toAddress, ethAmount);
      setTxHash(tx.hash);
      setStatus('success');

      // Record settlement on backend
      await settlementsApi.create({
        groupId, toUserId, amount: amountInr,
        note: `Ethereum Sepolia payment: ${fmtEth(ethAmount)}`,
        txHash: tx.hash, method: 'ethereum',
      });

      onPaid?.(tx.hash);
    } catch (e) {
      setErr(e.message || 'Transaction failed');
      setStatus('error');
    }
  };

  const S = {
    btn: {
      display: 'flex', alignItems: 'center', gap: 8,
      background: 'linear-gradient(135deg,#627eea,#8b5cf6)',
      border: 'none', borderRadius: 12, padding: '10px 18px',
      color: 'white', fontSize: 13, fontWeight: 700,
      cursor: status === 'idle' ? 'pointer' : 'not-allowed',
      fontFamily: "'Syne',system-ui",
      boxShadow: '0 4px 16px rgba(98,126,234,0.35)',
      opacity: status !== 'idle' ? 0.7 : 1,
      transition: 'transform 0.15s, box-shadow 0.15s',
    },
  };

  if (status === 'success') return (
    <a href={txUrl(txHash)} target="_blank" rel="noreferrer" style={{
      display:'flex', alignItems:'center', gap:6,
      background:'rgba(0,224,122,0.1)', border:'1px solid rgba(0,224,122,0.3)',
      borderRadius:12, padding:'10px 16px', color:'#00e07a',
      fontSize:12, fontWeight:700, textDecoration:'none', fontFamily:"'Syne',system-ui",
    }}>
      <span>✓</span> View on Etherscan ↗
    </a>
  );

  return (
    <>
      <button
        style={S.btn}
        disabled={status !== 'idle' || !ethAmount}
        onClick={() => setModal(true)}
        onMouseOver={e => { if (status==='idle') { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(98,126,234,0.5)'; }}}
        onMouseOut={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 4px 16px rgba(98,126,234,0.35)'; }}
      >
        {/* ETH diamond */}
        <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
          <path d="M16 0L6 16L16 21L26 16L16 0Z" fill="white" fillOpacity=".9"/>
          <path d="M16 23L6 18L16 32L26 18L16 23Z" fill="white" fillOpacity=".7"/>
        </svg>
        {status === 'idle' ? (
          ethAmount ? `Pay ${ethAmount} ETH` : 'Pay with ETH'
        ) : status === 'switching' ? 'Switching network…'
          : status === 'pending'   ? 'Confirming…'
          : 'Error'}
      </button>

      {/* Confirm modal */}
      {modal && (
        <div onClick={() => { if (status==='idle') setModal(false); }}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(8px)' }}>
          <div onClick={e => e.stopPropagation()} style={{
            background:'rgba(10,10,20,0.98)', border:'1px solid rgba(98,126,234,0.4)',
            borderRadius:24, padding:32, width:360, maxWidth:'90vw',
          }}>
            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
              <div style={{ width:40, height:40, borderRadius:12, background:'rgba(98,126,234,0.15)', border:'1px solid rgba(98,126,234,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>⬡</div>
              <div>
                <p style={{ color:'#f0f0f4', fontSize:16, fontWeight:800, fontFamily:"'Syne',system-ui" }}>Confirm Payment</p>
                <p style={{ color:'rgba(240,240,244,0.4)', fontSize:11, fontFamily:"'Syne',system-ui" }}>Ethereum · Sepolia Testnet</p>
              </div>
            </div>

            {/* Amount */}
            <div style={{ background:'rgba(98,126,234,0.08)', border:'1px solid rgba(98,126,234,0.2)', borderRadius:16, padding:'18px 20px', marginBottom:14 }}>
              <p style={{ color:'rgba(240,240,244,0.4)', fontSize:11, fontFamily:"'Syne',system-ui", marginBottom:4 }}>SENDING</p>
              <p style={{ color:'#a78bfa', fontSize:28, fontWeight:800, fontFamily:"'DM Mono',monospace" }}>
                {ethAmount} ETH
              </p>
              <p style={{ color:'rgba(240,240,244,0.4)', fontSize:12, fontFamily:"'Syne',system-ui", marginTop:2 }}>
                ≈ ₹{Number(amountInr).toLocaleString('en-IN')} at current rate
              </p>
            </div>

            {/* Recipient */}
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'14px 16px', marginBottom:20 }}>
              <p style={{ color:'rgba(240,240,244,0.4)', fontSize:10, fontFamily:"'DM Mono',monospace", letterSpacing:'0.08em', marginBottom:4 }}>TO</p>
              <p style={{ color:'#f0f0f4', fontSize:13, fontWeight:600, fontFamily:"'Syne',system-ui" }}>{recipientName}</p>
              <p style={{ color:'rgba(240,240,244,0.3)', fontSize:11, fontFamily:"'DM Mono',monospace" }}>{toAddress}</p>
            </div>

            {/* Sepolia badge */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#627eea', animation:'pulse 2s infinite' }} />
              <p style={{ color:'rgba(240,240,244,0.35)', fontSize:11, fontFamily:"'Syne',system-ui" }}>
                Testnet only — uses Sepolia ETH (no real value)
              </p>
            </div>

            {err && (
              <div style={{ background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.3)', borderRadius:12, padding:'10px 14px', marginBottom:14 }}>
                <p style={{ color:'#f87171', fontSize:12, fontFamily:"'Syne',system-ui" }}>{err}</p>
              </div>
            )}

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setModal(false)} style={{
                flex:1, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)',
                color:'rgba(240,240,244,0.5)', borderRadius:12, padding:'12px 0',
                fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'Syne',system-ui",
              }}>Cancel</button>
              <button onClick={handlePay} disabled={status !== 'idle'} style={{
                flex:2, background:'linear-gradient(135deg,#627eea,#8b5cf6)',
                border:'none', color:'white', borderRadius:12, padding:'12px 0',
                fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'Syne',system-ui",
                opacity: status !== 'idle' ? 0.6 : 1,
              }}>
                {status === 'idle' ? '⬡ Confirm in MetaMask' : `${status === 'switching' ? 'Switching…' : 'Confirming…'}`}
              </button>
            </div>

            <p style={{ color:'rgba(240,240,244,0.2)', fontSize:10, textAlign:'center', marginTop:14, fontFamily:"'Syne',system-ui" }}>
              You'll confirm the tx in MetaMask · Get test ETH at{' '}
              <a href={SEPOLIA.faucet} target="_blank" rel="noreferrer" style={{ color:'rgba(240,240,244,0.35)' }}>sepoliafaucet.com</a>
            </p>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </>
  );
}
