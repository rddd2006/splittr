import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import WalletConnect from '../components/WalletConnect';

export default function LoginPage() {
  const { login, register, showToast } = useApp();
  const navigate = useNavigate();
  const [mode,    setMode]    = useState('login');
  const [authTab, setAuthTab] = useState('email'); // 'email' | 'wallet'
  const [form,    setForm]    = useState({ name:'', email:'', password:'' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      mode === 'login'
        ? await login(form.email, form.password)
        : await register(form.name, form.email, form.password);
      navigate('/');
    } catch (err) {
      showToast(err.response?.data?.error || 'Something went wrong', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'#1B2838', display:'flex', alignItems:'center', justifyContent:'center', padding:16, fontFamily:"'VT323',monospace" }}>
      {/* Ambient glow */}
      <div style={{ position:'fixed', top:'15%', left:'50%', transform:'translateX(-50%)', width:700, height:500, background:'radial-gradient(ellipse, rgba(51,255,0,0.06) 0%, transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'fixed', bottom:'10%', right:'10%', width:400, height:400, background:'radial-gradient(ellipse, rgba(255,176,0,0.05) 0%, transparent 70%)', pointerEvents:'none' }} />

      <div style={{ width:'100%', maxWidth:440, position:'relative', zIndex:1 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:60, height:60, borderRadius:0, background:'#33FF00', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:900, color:'#1B2838', marginBottom:14, boxShadow:'0 0 40px rgba(51,255,0,0.4)', textShadow:'0 0 5px rgba(51,255,0,0.5)' }}>S</div>
          <h1 style={{ color:'#E8E0D0', fontSize:30, fontWeight:800, letterSpacing:'0.05em', marginBottom:6, fontFamily:"'VT323',monospace" }}>SPLITTR</h1>
          <p style={{ color:'rgba(232,224,208,0.5)', fontSize:14, fontFamily:"'VT323',monospace" }}>Split bills. Settle debts. No drama.</p>
        </div>

        {/* Card */}
        <div style={{ background:'rgba(255,176,0,0.05)', border:'2px solid rgba(255,176,0,0.2)', borderRadius:0, padding:28, backdropFilter:'blur(20px)' }}>

          {/* Sign in / Create account toggle */}
          <div style={{ display:'flex', background:'rgba(0,0,0,0.35)', borderRadius:0, padding:3, marginBottom:24, border:'2px solid rgba(255,176,0,0.1)' }}>
            {[['login','Sign In'],['register','Create Account']].map(([m, label]) => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex:1, padding:'9px 0', borderRadius:0, border:'none',
                fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'VT323',monospace",
                transition:'all 0.2s',
                background: mode===m ? 'rgba(51,255,0,0.12)' : 'transparent',
                color:      mode===m ? '#33FF00' : 'rgba(232,224,208,0.5)',
                boxShadow:  mode===m ? '0 0 0 2px rgba(51,255,0,0.3)' : 'none',
              }}>{label}</button>
            ))}
          </div>

          {/* Email / Wallet tab */}
          <div style={{ display:'flex', gap:8, marginBottom:22 }}>
            {[['email','📧 Email'],['wallet','🦊 Wallet']].map(([t, label]) => (
              <button key={t} onClick={() => setAuthTab(t)} style={{
                flex:1, padding:'8px 0', borderRadius:0, border:'none',
                fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'VT323',monospace",
                background: authTab===t ? 'rgba(51,255,0,0.08)' : 'transparent',
                color:      authTab===t ? '#33FF00' : 'rgba(232,224,208,0.3)',
                borderBottom: authTab===t ? '2px solid #33FF00' : '2px solid transparent',
              }}>{label}</button>
            ))}
          </div>

          {authTab === 'email' ? (
            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {mode === 'register' && (
                <div>
                  <label style={{ display:'block', color:'rgba(232,224,208,0.5)', fontSize:10, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6, fontFamily:"'VT323',monospace" }}>Full Name</label>
                  <input style={{ width:'100%', background:'rgba(51,255,0,0.04)', border:'2px solid rgba(255,176,0,0.2)', borderRadius:0, padding:'12px 14px', color:'#33FF00', fontSize:14, fontFamily:"'VT323',monospace", outline:'none' }}
                    placeholder="Priya Sharma" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required
                    onFocus={e=>e.target.style.borderColor='rgba(51,255,0,0.6)'} onBlur={e=>e.target.style.borderColor='rgba(255,176,0,0.2)'} />
                </div>
              )}
              <div>
                <label style={{ display:'block', color:'rgba(232,224,208,0.5)', fontSize:10, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6, fontFamily:"'VT323',monospace" }}>Email</label>
                <input style={{ width:'100%', background:'rgba(51,255,0,0.04)', border:'2px solid rgba(255,176,0,0.2)', borderRadius:0, padding:'12px 14px', color:'#33FF00', fontSize:14, fontFamily:"'VT323',monospace", outline:'none' }}
                  type="email" placeholder="priya@example.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required
                  onFocus={e=>e.target.style.borderColor='rgba(51,255,0,0.6)'} onBlur={e=>e.target.style.borderColor='rgba(255,176,0,0.2)'} />
              </div>
              <div>
                <label style={{ display:'block', color:'rgba(232,224,208,0.5)', fontSize:10, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6, fontFamily:"'VT323',monospace" }}>Password</label>
                <input style={{ width:'100%', background:'rgba(51,255,0,0.04)', border:'2px solid rgba(255,176,0,0.2)', borderRadius:0, padding:'12px 14px', color:'#33FF00', fontSize:14, fontFamily:"'VT323',monospace", outline:'none' }}
                  type="password" placeholder="••••••••" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required minLength={8}
                  onFocus={e=>e.target.style.borderColor='rgba(51,255,0,0.6)'} onBlur={e=>e.target.style.borderColor='rgba(255,176,0,0.2)'} />
              </div>
              <button type="submit" disabled={loading} style={{
                marginTop:4, width:'100%', padding:'14px 0',
                background: loading ? 'rgba(51,255,0,0.3)' : '#33FF00',
                border:'3px solid #33FF00', borderRadius:0, color:'#1B2838', fontSize:15, fontWeight:800,
                cursor: loading ? 'not-allowed':'pointer', fontFamily:"'VT323',monospace",
                boxShadow: loading ? 'none' : '0 0 20px rgba(51,255,0,0.4)',
              }}>
                {loading ? 'Please wait…' : mode==='login' ? 'Sign In →' : 'Create Account →'}
              </button>
              {mode==='login' && (
                <p style={{ color:'rgba(232,224,208,0.3)', fontSize:11, textAlign:'center', fontFamily:"'VT323',monospace" }}>
                  demo · alice@example.com · password123
                </p>
              )}
            </form>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ background:'rgba(51,255,0,.06)', border:'2px solid rgba(51,255,0,.2)', borderRadius:0, padding:'14px 16px' }}>
                <p style={{ color:'rgba(232,224,208,0.5)', fontSize:12, fontFamily:"'VT323',monospace", lineHeight:1.6 }}>
                  Connect your MetaMask wallet to sign in without a password.
                  Your wallet address becomes your identity on Splittr.
                </p>
              </div>
              <WalletConnect mode={mode === 'register' ? 'login' : 'login'} />
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ flex:1, height:1, background:'rgba(255,176,0,0.15)' }} />
                <span style={{ color:'rgba(232,224,208,0.3)', fontSize:11, fontFamily:"'VT323',monospace" }}>Sepolia Testnet Supported</span>
                <div style={{ flex:1, height:1, background:'rgba(255,176,0,0.15)' }} />
              </div>
              <div style={{ display:'flex', gap:8 }}>
                {[['⬡','Ethereum'],['🦊','MetaMask'],['🔐','EIP-191']].map(([ico,label]) => (
                  <div key={label} style={{ flex:1, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'8px 4px', textAlign:'center' }}>
                    <p style={{ fontSize:16 }}>{ico}</p>
                    <p style={{ color:'rgba(240,240,244,0.3)', fontSize:9, fontWeight:600, fontFamily:"'Syne',system-ui", marginTop:2 }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
