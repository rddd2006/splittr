import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { groupsApi, expensesApi } from '../api/client';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const T = { green:'#00e07a', border:'rgba(255,255,255,0.07)', surface:'rgba(255,255,255,0.035)', text:'#f0f0f4', sub:'rgba(240,240,244,0.45)', dim:'rgba(240,240,244,0.2)', mono:"'DM Mono',monospace", sans:"'Syne',system-ui" };
const glass = (e={}) => ({ background:T.surface, border:`1px solid ${T.border}`, borderRadius:16, ...e });

export default function ExpensesPage() {
  const { user, showToast } = useApp();
  const [groups,   setGroups]   = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const gRes = await groupsApi.list();
        setGroups(gRes.data);
        const lists = await Promise.all(
          gRes.data.map(g => expensesApi.list(g.id, { limit:50 }).then(r => r.data.expenses.map(e => ({ ...e, groupName:g.name, groupCurrency:g.currency }))))
        );
        setExpenses(lists.flat().sort((a,b) => new Date(b.date)-new Date(a.date)));
      } catch { showToast('Failed to load','error'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const displayed = filter === 'mine' ? expenses.filter(e => e.payer?.id === user?.id) : expenses;
  const total = displayed.reduce((s,e) => s + parseFloat(e.amount), 0);

  // Monthly data
  const monthlyData = displayed.reduce((acc, exp) => {
    const m = new Date(exp.date).toLocaleString('default', { month:'short', year:'2-digit' });
    const ex = acc.find(a => a.m === m);
    if (ex) ex.v += parseFloat(exp.amount); else acc.push({ m, v: parseFloat(exp.amount) });
    return acc;
  }, []).slice(-6);

  const groupData = groups.map(g => ({
    name: g.name.length > 10 ? g.name.slice(0,10)+'…' : g.name,
    v: expenses.filter(e => e.groupName === g.name).reduce((s,e) => s+parseFloat(e.amount), 0),
  })).filter(g => g.v > 0);

  const ChartTip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return <div style={{ ...glass(), padding:'8px 12px', border:'1px solid rgba(0,224,122,0.3)' }}><p style={{ color:T.green, fontFamily:T.mono, fontSize:12, fontWeight:700 }}>₹{payload[0].value.toLocaleString('en-IN')}</p></div>;
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <div>
        <h1 style={{ color:T.text, fontSize:24, fontWeight:800, fontFamily:T.sans, marginBottom:4 }}>Expenses</h1>
        <p style={{ color:T.sub, fontSize:13, fontFamily:T.sans }}>All expenses across your groups</p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
        {[['Total Count', displayed.length, T.text],['Total Amount', `₹${total.toLocaleString('en-IN')}`, T.green],['Groups', groups.length, '#a78bfa']].map(([l,v,c])=>(
          <div key={l} style={{ ...glass(), borderRadius:16, padding:'14px 16px' }}>
            <p style={{ color:T.dim, fontSize:10, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', fontFamily:T.sans, marginBottom:6 }}>{l}</p>
            <p style={{ color:c, fontSize:20, fontWeight:800, fontFamily:T.mono }}>{v}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      {!loading && expenses.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div style={{ ...glass(), borderRadius:18, padding:'18px 14px 10px' }}>
            <p style={{ color:T.dim, fontSize:10, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', fontFamily:T.sans, marginBottom:14, paddingLeft:4 }}>Monthly Trend</p>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={monthlyData} margin={{ left:-28, right:4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                <XAxis dataKey="m" tick={{ fill:T.dim, fontSize:10, fontFamily:T.mono }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:T.dim, fontSize:9 }} axisLine={false} tickLine={false} tickFormatter={v=>`${v/1000}k`}/>
                <Tooltip content={<ChartTip/>}/>
                <Line type="monotone" dataKey="v" stroke={T.green} strokeWidth={2} dot={false} activeDot={{ r:4, fill:T.green }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ ...glass(), borderRadius:18, padding:'18px 14px 10px' }}>
            <p style={{ color:T.dim, fontSize:10, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', fontFamily:T.sans, marginBottom:14, paddingLeft:4 }}>By Group</p>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={groupData} margin={{ left:-28, right:4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                <XAxis dataKey="name" tick={{ fill:T.dim, fontSize:9 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:T.dim, fontSize:9 }} axisLine={false} tickLine={false} tickFormatter={v=>`${v/1000}k`}/>
                <Tooltip content={<ChartTip/>}/>
                <Bar dataKey="v" fill={T.green} radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filter */}
      <div style={{ display:'flex', gap:8 }}>
        {[['all','All Expenses'],['mine','Paid by Me']].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} style={{
            padding:'8px 16px', borderRadius:10, border:'none', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:T.sans,
            background: filter===v ? T.greenDim : 'rgba(255,255,255,0.04)',
            color:      filter===v ? T.green    : T.sub,
            boxShadow:  filter===v ? '0 0 0 1px rgba(0,224,122,0.3)' : 'none',
          }}>{l}</button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {[1,2,3,4].map(i => <div key={i} style={{ ...glass(), height:64, borderRadius:14, animation:'pulse 1.5s ease infinite' }}/>)}
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ ...glass(), borderRadius:18, padding:48, textAlign:'center' }}>
          <p style={{ fontSize:36, marginBottom:12 }}>📋</p>
          <p style={{ color:T.sub, fontFamily:T.sans, marginBottom:14 }}>No expenses found.</p>
          <Link to="/groups" style={{ display:'inline-block', background:'linear-gradient(135deg,#00e07a,#10b981)', color:'#07070a', borderRadius:12, padding:'10px 20px', fontSize:13, fontWeight:800, textDecoration:'none', fontFamily:T.sans }}>Go to Groups</Link>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {displayed.map(exp => (
            <div key={exp.id} style={{ ...glass(), borderRadius:14, padding:'13px 18px', display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:38, height:38, borderRadius:12, background:'rgba(0,224,122,0.1)', border:'1px solid rgba(0,224,122,0.2)', display:'flex', alignItems:'center', justifyContent:'center', color:T.green, fontWeight:800, fontSize:14, flexShrink:0 }}>
                {exp.title[0].toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <p style={{ color:T.text, fontSize:13, fontWeight:700, fontFamily:T.sans, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{exp.title}</p>
                  <span style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:6, padding:'2px 7px', color:T.dim, fontSize:10, fontFamily:T.sans, flexShrink:0 }}>{exp.groupName}</span>
                </div>
                <p style={{ color:T.dim, fontSize:11, fontFamily:T.sans, marginTop:2 }}>
                  {exp.payer?.id===user?.id?'You paid':`${exp.payer?.name} paid`} · {formatDate(exp.date)}
                </p>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <p style={{ color:T.text, fontSize:14, fontWeight:700, fontFamily:T.mono }}>{formatCurrency(parseFloat(exp.amount), exp.groupCurrency)}</p>
                <p style={{ color:T.dim, fontSize:10, fontFamily:T.sans }}>{exp.splits?.length} people</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );
}
