import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import LoginPage      from './pages/LoginPage';
import DashboardPage  from './pages/DashboardPage';
import GroupsPage     from './pages/GroupsPage';
import GroupDetailPage from './pages/GroupDetailPage';
import ExpensesPage   from './pages/ExpensesPage';
import BillScanner    from './pages/BillScanner';
import Toast          from './components/Layout/Toast';
import { getInitials, stringToColor } from './utils/formatters';
import { getConnectedAddress, shortAddr } from './utils/web3';

const NAV = [
  { to:'/',         label:'Dashboard', icon:'◈', end:true },
  { to:'/groups',   label:'Groups',    icon:'◎' },
  { to:'/expenses', label:'Expenses',  icon:'↑' },
  { to:'/scanner',  label:'Scan Bill', icon:'⬡' },
];

const T = { green:'#00e07a', border:'rgba(255,255,255,0.07)', text:'#f0f0f4', sub:'rgba(240,240,244,0.45)', dim:'rgba(240,240,244,0.2)', sans:"'Syne',system-ui", mono:"'DM Mono',monospace" };

function Sidebar({ user, onLogout }) {
  const [wallet, setWallet] = React.useState(null);
  React.useEffect(() => { getConnectedAddress().then(setWallet); }, []);

  return (
    <aside style={{ width:220, flexShrink:0, display:'flex', flexDirection:'column', borderRight:`1px solid ${T.border}`, background:'rgba(255,255,255,0.02)' }}>
      {/* Logo */}
      <div style={{ padding:'20px 18px 16px', borderBottom:`1px solid ${T.border}`, display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:34, height:34, borderRadius:10, background:'linear-gradient(135deg,#00e07a,#10b981)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:18, color:'#07070a', flexShrink:0 }}>S</div>
        <span style={{ color:T.text, fontSize:17, fontWeight:800, letterSpacing:'-0.02em', fontFamily:T.sans }}>SettleUp</span>
      </div>

      <nav style={{ flex:1, padding:'12px 10px', display:'flex', flexDirection:'column', gap:4 }}>
        {NAV.map(({ to, label, icon, end }) => (
          <NavLink key={to} to={to} end={end} style={({ isActive }) => ({
            display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:12,
            textDecoration:'none', fontFamily:T.sans, fontSize:13, fontWeight: isActive?700:500,
            color:      isActive ? T.green : T.sub,
            background: isActive ? 'rgba(0,224,122,0.08)' : 'transparent',
            border:     isActive ? '1px solid rgba(0,224,122,0.2)' : '1px solid transparent',
            transition:'all 0.15s',
          })}>
            <span style={{ fontSize:17, lineHeight:1 }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + wallet */}
      <div style={{ padding:'12px 10px', borderTop:`1px solid ${T.border}` }}>
        {wallet && (
          <div style={{ background:'rgba(167,139,250,0.06)', border:'1px solid rgba(167,139,250,0.2)', borderRadius:10, padding:'8px 10px', marginBottom:8 }}>
            <p style={{ color:'rgba(167,139,250,0.5)', fontSize:9, fontWeight:600, letterSpacing:'0.1em', fontFamily:T.sans, textTransform:'uppercase', marginBottom:2 }}>Wallet</p>
            <p style={{ color:'#a78bfa', fontSize:11, fontFamily:T.mono }}>{shortAddr(wallet)}</p>
          </div>
        )}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:10 }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:`${stringToColor(user?.name)}22`, border:`1px solid ${stringToColor(user?.name)}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:stringToColor(user?.name), flexShrink:0 }}>
            {getInitials(user?.name)}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ color:T.text, fontSize:12, fontWeight:700, fontFamily:T.sans, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name}</p>
            <p style={{ color:T.dim, fontSize:10, fontFamily:T.mono, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {user?.walletAddress ? shortAddr(user.walletAddress) : user?.email}
            </p>
          </div>
          <button onClick={onLogout} style={{ background:'none', border:'none', color:T.dim, cursor:'pointer', fontSize:16, padding:'2px', lineHeight:1 }} title="Sign out">⇤</button>
        </div>
      </div>
    </aside>
  );
}

function BottomNav() {
  return (
    <nav style={{
      position:'fixed', bottom:0, left:0, right:0, zIndex:50,
      background:'rgba(5,5,10,0.97)', backdropFilter:'blur(20px)',
      borderTop:`1px solid ${T.border}`,
      display:'flex', padding:'8px 0 max(8px,env(safe-area-inset-bottom))',
    }}>
      {NAV.map(({ to, label, icon, end }) => (
        <NavLink key={to} to={to} end={end} style={({ isActive }) => ({
          flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3,
          textDecoration:'none', padding:'4px 0',
          color: isActive ? T.green : T.dim,
          transition:'color 0.15s',
        })}>
          <span style={{ fontSize:20, lineHeight:1 }}>{icon}</span>
          <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.04em', fontFamily:T.sans }}>
            {label.split(' ')[0].toUpperCase()}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}

function Layout({ children }) {
  const { user, logout } = useApp();
  const navigate = useNavigate();
  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#05050a' }}>
      {/* Desktop sidebar */}
      <div style={{ display:'none' }} className="desk-sidebar">
        <Sidebar user={user} onLogout={handleLogout} />
      </div>

      {/* Page content */}
      <div style={{ flex:1, minWidth:0, paddingBottom:80 }} className="mob-pad">
        <main style={{ maxWidth:860, margin:'0 auto', padding:'24px 16px' }}>
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <div className="mob-nav">
        <BottomNav />
      </div>

      <style>{`
        @media (min-width: 768px) {
          .desk-sidebar { display: flex !important; }
          .mob-nav      { display: none  !important; }
          .mob-pad      { padding-bottom: 0 !important; }
        }
        @media (max-width: 767px) {
          .desk-sidebar { display: none  !important; }
          .mob-nav      { display: block !important; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius:4px; }
        body { background:#05050a; color:#f0f0f4; }
        select option { background:#1a1a2e; }
      `}</style>
    </div>
  );
}

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useApp();
  if (loading) return (
    <div style={{ display:'flex', height:'100vh', alignItems:'center', justifyContent:'center', background:'#05050a' }}>
      <div style={{ width:36, height:36, borderRadius:'50%', border:'3px solid rgba(255,255,255,0.1)', borderTopColor:'#00e07a', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AuthBootstrap = ({ children }) => {
  const { checkAuth } = useApp();
  useEffect(() => { checkAuth(); }, [checkAuth]);
  return children;
};

const W = ({ page: Page }) => (
  <ProtectedRoute><Layout><Page/></Layout></ProtectedRoute>
);

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AuthBootstrap>
          <Toast/>
          <Routes>
            <Route path="/login"       element={<LoginPage/>}/>
            <Route path="/"            element={<W page={DashboardPage}/>}/>
            <Route path="/groups"      element={<W page={GroupsPage}/>}/>
            <Route path="/groups/:id"  element={<W page={GroupDetailPage}/>}/>
            <Route path="/expenses"    element={<W page={ExpensesPage}/>}/>
            <Route path="/scanner"     element={<W page={BillScanner}/>}/>
            <Route path="*"            element={<Navigate to="/" replace/>}/>
          </Routes>
        </AuthBootstrap>
      </BrowserRouter>
    </AppProvider>
  );
}
