import React, { useState } from 'react';

/**
 * GPayButton
 * Mobile  → opens GPay/UPI app directly via tez:// or upi:// deep link
 * Desktop → shows modal with UPI ID + copy button
 */
export default function GPayButton({ upiId, name, amount, note = 'SettleUp', style = {} }) {
  const [modal,  setModal]  = useState(false);
  const [copied, setCopied] = useState(false);

  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${Number(amount).toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;
  // GPay-specific deep link (Android)
  const gpayUrl = `tez://upi/pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${Number(amount).toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;

  const handleClick = () => {
    const ua = navigator.userAgent || '';
    const isAndroid = /Android/i.test(ua);
    const isIOS     = /iPhone|iPad|iPod/i.test(ua);

    if (isAndroid) {
      // Try GPay tez:// first, fallback to generic upi://
      window.location.href = gpayUrl;
      setTimeout(() => { window.location.href = upiUrl; }, 600);
    } else if (isIOS) {
      window.location.href = upiUrl;
    } else {
      setModal(true);
    }
  };

  const copyUPI = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fmt = (n) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return (
    <>
      <button
        onClick={handleClick}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(135deg, #4285f4 0%, #34a853 100%)',
          border: 'none', borderRadius: 12, padding: '10px 18px',
          color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          fontFamily: "'Syne', system-ui",
          boxShadow: '0 4px 16px rgba(66,133,244,0.4)',
          transition: 'transform 0.15s, box-shadow 0.15s',
          ...style,
        }}
        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(66,133,244,0.5)'; }}
        onMouseOut={e  => { e.currentTarget.style.transform = '';                 e.currentTarget.style.boxShadow = '0 4px 16px rgba(66,133,244,0.4)'; }}
      >
        {/* Google G */}
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path d="M21.8 10.2H12v3.6h5.6c-.5 2.5-2.7 4.2-5.6 4.2-3.4 0-6-2.7-6-6s2.6-6 6-6c1.5 0 2.8.5 3.8 1.4l2.7-2.7C16.9 3 14.6 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.5 0 10-4.5 10-10 0-.6-.1-1.2-.2-1.8z" fill="white"/>
        </svg>
        Pay {fmt(amount)}
      </button>

      {modal && (
        <div
          onClick={() => setModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(8px)' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'rgba(10,10,20,0.99)', border: '1px solid rgba(66,133,244,0.3)', borderRadius: 24, padding: 28, width: 340, maxWidth: '92vw' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(66,133,244,0.15)', border: '1px solid rgba(66,133,244,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24"><path d="M21.8 10.2H12v3.6h5.6c-.5 2.5-2.7 4.2-5.6 4.2-3.4 0-6-2.7-6-6s2.6-6 6-6c1.5 0 2.8.5 3.8 1.4l2.7-2.7C16.9 3 14.6 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.5 0 10-4.5 10-10 0-.6-.1-1.2-.2-1.8z" fill="#4285f4"/></svg>
              </div>
              <div>
                <p style={{ color: '#f0f0f4', fontSize: 16, fontWeight: 800, fontFamily: "'Syne',system-ui" }}>Pay via GPay / UPI</p>
                <p style={{ color: 'rgba(240,240,244,0.4)', fontSize: 12, fontFamily: "'Syne',system-ui" }}>Open on your phone or scan</p>
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '18px 20px', marginBottom: 14 }}>
              <p style={{ color: 'rgba(240,240,244,0.35)', fontSize: 11, fontFamily: "'DM Mono',monospace", letterSpacing: '0.1em', marginBottom: 4 }}>AMOUNT</p>
              <p style={{ color: '#4285f4', fontSize: 28, fontWeight: 800, fontFamily: "'DM Mono',monospace" }}>{fmt(amount)}</p>
              <p style={{ color: 'rgba(240,240,244,0.4)', fontSize: 12, fontFamily: "'Syne',system-ui", marginTop: 2 }}>to {name}</p>
            </div>

            <div style={{ background: 'rgba(66,133,244,0.06)', border: '1px solid rgba(66,133,244,0.2)', borderRadius: 14, padding: '14px 16px', marginBottom: 14 }}>
              <p style={{ color: 'rgba(240,240,244,0.3)', fontSize: 10, fontFamily: "'DM Mono',monospace", letterSpacing: '0.08em', marginBottom: 6 }}>UPI ID</p>
              <p style={{ color: '#f0f0f4', fontSize: 16, fontWeight: 700, fontFamily: "'DM Mono',monospace" }}>{upiId}</p>
            </div>

            <button onClick={copyUPI} style={{ width: '100%', background: copied ? 'rgba(0,224,122,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${copied ? 'rgba(0,224,122,0.4)' : 'rgba(255,255,255,0.1)'}`, color: copied ? '#00e07a' : 'rgba(240,240,244,0.6)', borderRadius: 12, padding: '12px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne',system-ui", marginBottom: 10, transition: 'all 0.2s' }}>
              {copied ? '✓ Copied!' : 'Copy UPI ID'}
            </button>

            <a href={upiUrl} style={{ display: 'block', textAlign: 'center', background: 'linear-gradient(135deg,#4285f4,#34a853)', color: 'white', borderRadius: 12, padding: '12px 0', fontSize: 13, fontWeight: 700, textDecoration: 'none', fontFamily: "'Syne',system-ui" }}>
              Open GPay / UPI App
            </a>

            <p style={{ color: 'rgba(240,240,244,0.2)', fontSize: 11, textAlign: 'center', marginTop: 14, fontFamily: "'Syne',system-ui" }}>
              On mobile, this button opens GPay directly
            </p>
          </div>
        </div>
      )}
    </>
  );
}
