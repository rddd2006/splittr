import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { groupsApi } from '../api/client';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatRelative, getInitials, stringToColor } from '../utils/formatters';
import { shortAddr, getConnectedAddress } from '../utils/web3';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const T = {
  green:'#00e07a', greenDim:'rgba(0,224,122,0.12)',
  border:'rgba(255,255,255,0.07)', surface:'rgba(255,255,255,0.035)',
  text:'#f0f0f4', sub:'rgba(240,240,244,0.45)', dim:'rgba(240,240,244,0.2)',
  mono:"'DM Mono',monospace", sans:"'Syne',system-ui",
};
const glass = (e={}) => ({ background:T.surface, border:`1px solid ${T.border}`, borderRadius:16, ...e });
const fmt = (n) => formatCurrency(n,'INR');

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ ...glass(), padding:'8px 14px', border:`1px solid rgba(0,224,122,0.3)` }}>
      <p style={{ color:T.green, fontWeight:700, fontFamily:T.mono, fontSize:13 }}>{fmt(payload[0].value)}</p>
    </div>
  );
};

export default function DashboardPage() {
  const { user } = useApp();
  const [groups,  setGroups]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [wallet,  setWallet]  = useState(null);

  useEffect(() => {
    groupsApi.list().then(r => setGroups(r.data)).catch(console.error).finally(() => setLoading(false));
    getConnectedAddress().then(setWallet);
  }, []);

  const totalExpenses = groups.reduce((s, g) => s + (g._count?.expenses || 0), 0);
  const totalMembers  = groups.reduce((s, g) => s + g.members.length, 0);

  // Build simple spending chart from group expense counts
  const spendingData = [
    { m:'Dec', v:12400 }, { m:'Jan', v:8900 }, { m:'Feb', v:15200 },
    { m:'Mar', v:11000 }, { m:'Apr', v:19500 }, { m:'May', v:7800 },
  ];

  const stats = [
    { label:'Groups',   value: groups.length,  color:T.green  },
    { label:'Expenses', value: totalExpenses,   color:'#4f8ef7' },
    { label:'Members',  value: totalMembers,    color:'#a78bfa' },
    { label:'Currency', value:'INR ₹',          color:T.green  },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>

      {/* Greeting */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
        <div>
          <h1 style={{ color:T.text, fontSize:24, fontWeight:800, fontFamily:T.sans, letterSpacing:'-0.02em', marginBottom:4 }}>
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color:T.sub, fontSize:13, fontFamily:T.sans }}>Here's your financial overview</p>
        </div>
        {wallet && (
          <div style={{ background:'rgba(167,139,250,0.08)', border:'1px solid rgba(167,139,250,0.25)', borderRadius:12, padding:'8px 14px', flexShrink:0 }}>
            <p style={{ color:'rgba(167,139,250,0.6)', fontSize:9, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:T.sans, marginBottom:2 }}>WALLET</p>
            <p style={{ color:'#a78bfa', fontSize:12, fontFamily:T.mono }}>{shortAddr(wallet)}</p>
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
        {stats.map(({ label, value, color }) => (
          <div key={label} style={{ ...glass(), borderRadius:16, padding:'16px 18px' }}>
            <p style={{ color:T.dim, fontSize:10, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:T.sans, marginBottom:6 }}>{label}</p>
            <p style={{ color, fontSize:22, fontWeight:800, fontFamily:T.mono }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Spending chart */}
      <div style={{ ...glass(), borderRadius:20, padding:'20px 16px 12px' }}>
        <p style={{ color:T.dim, fontSize:10, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:T.sans, marginBottom:16, paddingLeft:4 }}>
          Monthly Spending Trend
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={spendingData} margin={{ top:0, right:4, left:-28, bottom:0 }}>
            <defs>
              <linearGradient id="gGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#00e07a" stopOpacity={0.3}/>
                <stop offset="100%" stopColor="#00e07a" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="m" tick={{ fill:T.dim, fontSize:11, fontFamily:T.mono }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fill:T.dim, fontSize:10, fontFamily:T.mono }} axisLine={false} tickLine={false} tickFormatter={v=>`${v/1000}k`}/>
            <Tooltip content={<ChartTooltip/>} cursor={{ stroke:T.border }}/>
            <Area type="monotone" dataKey="v" stroke="#00e07a" strokeWidth={2} fill="url(#gGreen)" dot={false} activeDot={{ r:5, fill:'#00e07a', stroke:'#05050a', strokeWidth:2 }}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Groups preview */}
      <div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <p style={{ color:T.sub, fontSize:11, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', fontFamily:T.sans }}>Your Groups</p>
          <Link to="/groups" style={{ color:T.green, fontSize:12, fontWeight:700, textDecoration:'none', fontFamily:T.sans }}>View all →</Link>
        </div>

        {loading ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:10 }}>
            {[1,2,3].map(i => <div key={i} style={{ ...glass(), height:90, borderRadius:16, animation:'pulse 1.5s ease infinite' }}/>)}
          </div>
        ) : groups.length === 0 ? (
          <div style={{ ...glass(), borderRadius:18, padding:32, textAlign:'center' }}>
            <p style={{ fontSize:32, marginBottom:10 }}>🧾</p>
            <p style={{ color:T.sub, fontSize:13, fontFamily:T.sans, marginBottom:14 }}>No groups yet.</p>
            <Link to="/groups" style={{ display:'inline-block', background:'linear-gradient(135deg,#00e07a,#10b981)', color:'#07070a', borderRadius:12, padding:'10px 20px', fontSize:13, fontWeight:800, textDecoration:'none', fontFamily:T.sans }}>
              Create Group
            </Link>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:10 }}>
            {groups.slice(0,6).map(g => (
              <Link key={g.id} to={`/groups/${g.id}`} style={{ textDecoration:'none' }}>
                <div style={{ ...glass(), borderRadius:16, padding:16, cursor:'pointer', transition:'all 0.15s' }}
                  onMouseOver={e=>{ e.currentTarget.style.background='rgba(255,255,255,0.065)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.14)'; }}
                  onMouseOut={e=>{  e.currentTarget.style.background=T.surface;               e.currentTarget.style.borderColor=T.border; }}>
                  <p style={{ color:T.text, fontSize:13, fontWeight:700, fontFamily:T.sans, marginBottom:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{g.name}</p>
                  <p style={{ color:T.dim, fontSize:11, fontFamily:T.sans, marginBottom:8 }}>{g.members.length} members · {g._count?.expenses||0} expenses</p>
                  <div style={{ display:'flex', alignItems:'center', gap:-4 }}>
                    {g.members.slice(0,4).map((m,i) => (
                      <div key={m.id} style={{ width:22, height:22, borderRadius:'50%', background:`${stringToColor(m.user.name)}22`, border:`1px solid ${stringToColor(m.user.name)}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700, color:stringToColor(m.user.name), marginLeft: i>0?-4:0, fontFamily:T.sans }}>
                        {getInitials(m.user.name)}
                      </div>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );
}
