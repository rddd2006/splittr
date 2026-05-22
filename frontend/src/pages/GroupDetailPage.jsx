import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { groupsApi, expensesApi, settlementsApi } from '../api/client';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, getInitials, stringToColor } from '../utils/formatters';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import GPayButton from '../components/GPayButton';
import EthPayButton from '../components/EthPayButton';
import GroupJoinCode from '../components/GroupJoinCode';

const T = { green:'#00e07a', greenDim:'rgba(0,224,122,0.12)', red:'#f87171', redDim:'rgba(248,113,113,0.12)', border:'rgba(255,255,255,0.07)', surface:'rgba(255,255,255,0.035)', text:'#f0f0f4', sub:'rgba(240,240,244,0.45)', dim:'rgba(240,240,244,0.2)', mono:"'DM Mono',monospace", sans:"'Syne',system-ui" };
const glass = (e={}) => ({ background:T.surface, border:`1px solid ${T.border}`, borderRadius:16, ...e });
const fmt = (n, cur='INR') => formatCurrency(n, cur);

function Avatar({ name, size=36 }) {
  const color = stringToColor(name);
  return <div style={{ width:size, height:size, borderRadius:size/2, background:`${color}22`, border:`1px solid ${color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.32, fontWeight:700, color, fontFamily:T.sans, flexShrink:0 }}>{getInitials(name)}</div>;
}

const TABS = ['expenses','balances','chart','members','settle'];

export default function GroupDetailPage() {
  const { id } = useParams();
  const { user, showToast } = useApp();
  const [group,  setGroup]  = useState(null);
  const [bals,   setBals]   = useState([]);
  const [plan,   setPlan]   = useState([]);
  const [loading,setLoading]= useState(true);
  const [tab,    setTab]    = useState('expenses');
  const [showExpForm, setShowExpForm] = useState(false);
  const [showAddMem,  setShowAddMem]  = useState(false);
  const [expForm, setExpForm] = useState({ title:'', amount:'', splitType:'EQUAL', description:'' });
  const [memEmail,setMemEmail]= useState('');
  const [saving, setSaving]   = useState(false);

  const load = useCallback(async () => {
    try {
      const [gR, bR, pR] = await Promise.all([
        groupsApi.get(id), groupsApi.getBalances(id), groupsApi.getSettlementPlan(id),
      ]);
      setGroup(gR.data); setBals(bR.data); setPlan(pR.data);
    } catch { showToast('Failed to load group','error'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const addExpense = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await expensesApi.create(id, { ...expForm, amount: parseFloat(expForm.amount) });
      showToast('Expense added!');
      setShowExpForm(false); setExpForm({ title:'', amount:'', splitType:'EQUAL', description:'' });
      load();
    } catch (err) { showToast(err.response?.data?.error || 'Failed','error'); }
    finally { setSaving(false); }
  };

  const addMember = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await groupsApi.addMember(id, memEmail);
      showToast('Member added!');
      setShowAddMem(false); setMemEmail(''); load();
    } catch (err) { showToast(err.response?.data?.error || 'Failed','error'); }
    finally { setSaving(false); }
  };

  const deleteExpense = async (expId) => {
    if (!confirm('Delete this expense?')) return;
    try { await expensesApi.delete(expId); showToast('Deleted'); load(); }
    catch (err) { showToast(err.response?.data?.error || 'Failed','error'); }
  };

  const settle = async (toUserId, amount) => {
    try {
      await settlementsApi.create({ groupId:id, toUserId, amount, method:'manual' });
      showToast('Settlement recorded!'); load();
    } catch { showToast('Failed','error'); }
  };

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:240 }}><div style={{ width:36, height:36, borderRadius:'50%', border:`3px solid ${T.border}`, borderTopColor:T.green, animation:'spin 0.8s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;
  if (!group)  return <p style={{ color:T.sub, textAlign:'center', padding:40, fontFamily:T.sans }}>Group not found. <Link to="/groups" style={{ color:T.green }}>Go back</Link></p>;

  const myBal = bals.find(b => b.userId === user?.id);
  const isAdmin = group.members.find(m => m.user.id === user?.id)?.role === 'ADMIN';
  const PIE_COLORS = [T.green,'#4f8ef7','#a78bfa','#f87171','#fbbf24'];

  // Spending by member for pie chart
  const pieData = bals.map((b,i) => ({ name:b.name, value: Math.abs(b.balance) })).filter(d=>d.value>0);

  const INP = { width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'11px 14px', color:T.text, fontSize:13, fontFamily:T.sans, outline:'none' };
  const LBL = { display:'block', color:T.dim, fontSize:10, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:5 };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Breadcrumb + header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
            <Link to="/groups" style={{ color:T.dim, fontSize:12, textDecoration:'none', fontFamily:T.sans }}>Groups</Link>
            <span style={{ color:T.dim }}>›</span>
            <span style={{ color:T.sub, fontSize:12, fontFamily:T.sans }}>{group.name}</span>
          </div>
          <h1 style={{ color:T.text, fontSize:22, fontWeight:800, fontFamily:T.sans }}>{group.name}</h1>
          {group.description && <p style={{ color:T.sub, fontSize:13, fontFamily:T.sans, marginTop:2 }}>{group.description}</p>}
          <div style={{ display:'flex', gap:12, marginTop:6 }}>
            <span style={{ color:T.dim, fontSize:11, fontFamily:T.sans }}>{group.members.length} members</span>
            <span style={{ color:T.dim, fontSize:11, fontFamily:T.sans }}>{group._count?.expenses||0} expenses</span>
            <span style={{ color:T.dim, fontSize:11, fontFamily:T.sans }}>{group.currency}</span>
          </div>
        </div>
        {myBal && (
          <div style={{ ...glass(), padding:'14px 18px', textAlign:'right', flexShrink:0, borderColor: myBal.balance>=0?'rgba(0,224,122,0.2)':'rgba(248,113,113,0.2)' }}>
            <p style={{ color:T.dim, fontSize:10, fontFamily:T.sans, marginBottom:4 }}>Your balance</p>
            <p style={{ color: myBal.balance>=0?T.green:T.red, fontSize:20, fontWeight:800, fontFamily:T.mono }}>
              {myBal.balance>=0?'+':'−'}{fmt(Math.abs(myBal.balance), group.currency)}
            </p>
            <p style={{ color:T.dim, fontSize:10, fontFamily:T.sans, marginTop:2 }}>
              {myBal.balance>0?'you are owed':myBal.balance<0?'you owe':'settled ✓'}
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:2, borderBottom:`1px solid ${T.border}`, overflowX:'auto', scrollbarWidth:'none' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding:'10px 16px', borderBottom:`2px solid ${tab===t?T.green:'transparent'}`,
            color: tab===t?T.green:T.sub, background:'transparent', border:'none',
            fontSize:13, fontWeight: tab===t?700:500, cursor:'pointer', fontFamily:T.sans,
            whiteSpace:'nowrap', transition:'color 0.15s',
          }}>{t==='settle'?'⚡ Settle Up':t.charAt(0).toUpperCase()+t.slice(1)}</button>
        ))}
      </div>

      {/* ── EXPENSES ── */}
      {tab==='expenses' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <button onClick={() => setShowExpForm(!showExpForm)} style={{ background:'linear-gradient(135deg,#00e07a,#10b981)', border:'none', borderRadius:12, padding:'10px 18px', color:'#07070a', fontSize:13, fontWeight:800, cursor:'pointer', fontFamily:T.sans }}>+ Add Expense</button>
          </div>
          {showExpForm && (
            <div style={{ ...glass(), borderRadius:18, padding:20 }}>
              <form onSubmit={addExpense} style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div><label style={LBL}>Title *</label><input style={INP} placeholder="Hotel, lunch…" value={expForm.title} onChange={e=>setExpForm({...expForm,title:e.target.value})} required /></div>
                  <div><label style={LBL}>Amount ({group.currency}) *</label><input style={INP} type="number" step="0.01" min="0.01" placeholder="0.00" value={expForm.amount} onChange={e=>setExpForm({...expForm,amount:e.target.value})} required /></div>
                </div>
                <div><label style={LBL}>Split</label>
                  <select style={{ ...INP }} value={expForm.splitType} onChange={e=>setExpForm({...expForm,splitType:e.target.value})}>
                    <option value="EQUAL">Equal split</option>
                    <option value="PERCENTAGE">By percentage</option>
                    <option value="EXACT">Exact amounts</option>
                  </select>
                </div>
                <div><label style={LBL}>Note</label><input style={INP} placeholder="Optional" value={expForm.description} onChange={e=>setExpForm({...expForm,description:e.target.value})} /></div>
                <div style={{ display:'flex', gap:10 }}>
                  <button type="submit" disabled={saving} style={{ flex:2, background:'linear-gradient(135deg,#00e07a,#10b981)', border:'none', borderRadius:12, padding:'12px 0', color:'#07070a', fontSize:13, fontWeight:800, cursor:'pointer', fontFamily:T.sans }}>{saving?'Adding…':'Add Expense'}</button>
                  <button type="button" onClick={()=>setShowExpForm(false)} style={{ flex:1, background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:12, padding:'12px 0', color:T.sub, fontSize:13, cursor:'pointer', fontFamily:T.sans }}>Cancel</button>
                </div>
              </form>
            </div>
          )}
          {!group.expenses?.length ? (
            <div style={{ ...glass(), borderRadius:18, padding:48, textAlign:'center' }}>
              <p style={{ fontSize:32, marginBottom:10 }}>🧾</p>
              <p style={{ color:T.sub, fontFamily:T.sans }}>No expenses yet.</p>
            </div>
          ) : group.expenses.map(exp => (
            <div key={exp.id} style={{ ...glass(), borderRadius:16, padding:'14px 18px', display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:40, height:40, borderRadius:12, background:T.greenDim, border:`1px solid rgba(0,224,122,0.2)`, display:'flex', alignItems:'center', justifyContent:'center', color:T.green, fontWeight:800, fontSize:14, flexShrink:0 }}>{exp.title[0].toUpperCase()}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ color:T.text, fontSize:13, fontWeight:700, fontFamily:T.sans, marginBottom:2 }}>{exp.title}</p>
                <p style={{ color:T.dim, fontSize:11, fontFamily:T.sans }}>Paid by <span style={{ color:T.sub }}>{exp.payer.name}</span> · {formatDate(exp.date)}</p>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <p style={{ color:T.text, fontSize:15, fontWeight:700, fontFamily:T.mono }}>{fmt(parseFloat(exp.amount), group.currency)}</p>
                <p style={{ color:T.dim, fontSize:10, fontFamily:T.sans }}>{exp.splits?.length} splits</p>
              </div>
              {exp.payer.id===user?.id && <button onClick={()=>deleteExpense(exp.id)} style={{ background:'transparent', border:'none', color:T.dim, cursor:'pointer', fontSize:16, padding:'0 4px' }}>✕</button>}
            </div>
          ))}
        </div>
      )}

      {/* ── BALANCES ── */}
      {tab==='balances' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {bals.map(b => (
            <div key={b.userId} style={{ ...glass(), borderRadius:16, padding:'14px 18px', display:'flex', alignItems:'center', gap:14 }}>
              <Avatar name={b.name} size={42} />
              <div style={{ flex:1 }}>
                <p style={{ color:T.text, fontSize:14, fontWeight:700, fontFamily:T.sans }}>{b.name}</p>
                <p style={{ color:T.dim, fontSize:11, fontFamily:T.sans }}>{b.balance>0?'is owed':b.balance<0?'owes':'settled up ✓'}</p>
              </div>
              <p style={{ color:b.balance>0?T.green:b.balance<0?T.red:T.dim, fontSize:18, fontWeight:700, fontFamily:T.mono }}>
                {b.balance>=0?'+':'−'}{fmt(Math.abs(b.balance), group.currency)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── CHART ── */}
      {tab==='chart' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ ...glass(), borderRadius:18, padding:20 }}>
            <p style={{ color:T.dim, fontSize:10, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:T.sans, marginBottom:14 }}>Balance Distribution</p>
            {pieData.length>0 ? (
              <div style={{ display:'flex', alignItems:'center', gap:20 }}>
                <PieChart width={160} height={160}><Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={72} strokeWidth={0}>{pieData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}</Pie></PieChart>
                <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
                  {pieData.map((d,i)=>(
                    <div key={d.name} style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:8, height:8, borderRadius:4, background:PIE_COLORS[i%PIE_COLORS.length], flexShrink:0 }}/>
                      <span style={{ color:T.sub, fontSize:12, fontFamily:T.sans, flex:1 }}>{d.name}</span>
                      <span style={{ color:T.text, fontSize:12, fontFamily:T.mono }}>{fmt(d.value, group.currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <p style={{ color:T.dim, textAlign:'center', padding:40, fontFamily:T.sans }}>No data yet</p>}
          </div>
        </div>
      )}

      {/* ── MEMBERS ── */}
      {tab==='members' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {isAdmin && (
            <div style={{ display:'flex', justifyContent:'flex-end' }}>
              <button onClick={()=>setShowAddMem(!showAddMem)} style={{ background:T.greenDim, border:`1px solid rgba(0,224,122,0.3)`, color:T.green, borderRadius:12, padding:'10px 18px', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:T.sans }}>+ Add Member</button>
            </div>
          )}
          {showAddMem && (
            <form onSubmit={addMember} style={{ display:'flex', gap:10 }}>
              <input style={{ ...INP, flex:1 }} type="email" placeholder="friend@example.com" value={memEmail} onChange={e=>setMemEmail(e.target.value)} required />
              <button type="submit" disabled={saving} style={{ background:'linear-gradient(135deg,#00e07a,#10b981)', border:'none', borderRadius:12, padding:'11px 20px', color:'#07070a', fontSize:13, fontWeight:800, cursor:'pointer', fontFamily:T.sans }}>{saving?'…':'Add'}</button>
              <button type="button" onClick={()=>setShowAddMem(false)} style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:12, padding:'11px 14px', color:T.sub, fontSize:13, cursor:'pointer', fontFamily:T.sans }}>✕</button>
            </form>
          )}
          {group.members.map(m => (
            <div key={m.id} style={{ ...glass(), borderRadius:16, padding:'14px 18px', display:'flex', alignItems:'center', gap:14 }}>
              <Avatar name={m.user.name} size={44} />
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ color:T.text, fontSize:13, fontWeight:700, fontFamily:T.sans }}>{m.user.name}</p>
                <p style={{ color:T.dim, fontSize:11, fontFamily:T.sans }}>{m.user.email}</p>
                {m.user.walletAddress && (
                  <p style={{ color:'rgba(167,139,250,0.7)', fontSize:10, fontFamily:T.mono, marginTop:2 }}>
                    ⬡ {m.user.walletAddress.slice(0,8)}…{m.user.walletAddress.slice(-6)}
                  </p>
                )}
              </div>
              <span style={{ background: m.role==='ADMIN'?T.greenDim:'rgba(255,255,255,0.05)', border:`1px solid ${m.role==='ADMIN'?'rgba(0,224,122,0.3)':'rgba(255,255,255,0.08)'}`, color:m.role==='ADMIN'?T.green:T.dim, borderRadius:8, padding:'3px 10px', fontSize:10, fontWeight:700, fontFamily:T.sans }}>
                {m.role}
              </span>
            </div>
          ))}

          {/* Invite code */}
          <GroupJoinCode groupId={id} joinCode={group.joinCode} isAdmin={isAdmin} onRegenerate={code => setGroup(g => ({...g, joinCode:code}))} />
        </div>
      )}

      {/* ── SETTLE ── */}
      {tab==='settle' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ background:'rgba(251,191,36,0.05)', border:'1px solid rgba(251,191,36,0.2)', borderRadius:14, padding:'12px 16px' }}>
            <p style={{ color:'rgba(251,191,36,0.8)', fontSize:12, fontFamily:T.sans }}>
              💡 Minimum transactions plan — click GPay or ETH to pay instantly.
            </p>
          </div>
          {plan.length===0 ? (
            <div style={{ ...glass(), borderRadius:18, padding:48, textAlign:'center' }}>
              <p style={{ fontSize:36, marginBottom:10 }}>✅</p>
              <p style={{ color:T.text, fontWeight:700, fontFamily:T.sans, marginBottom:4 }}>All settled up!</p>
              <p style={{ color:T.sub, fontSize:13, fontFamily:T.sans }}>No pending payments in this group.</p>
            </div>
          ) : plan.map((txn, i) => (
            <div key={i} style={{ ...glass(), borderRadius:16, padding:'16px 20px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom: txn.from.userId===user?.id ? 14 : 0 }}>
                <Avatar name={txn.from.name} size={40} />
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ color:T.text, fontSize:13, fontFamily:T.sans }}>
                    <span style={{ fontWeight:700 }}>{txn.from.name}</span>
                    <span style={{ color:T.dim }}> pays </span>
                    <span style={{ fontWeight:700 }}>{txn.to.name}</span>
                  </p>
                  {txn.to.walletAddress && (
                    <p style={{ color:'rgba(167,139,250,0.6)', fontSize:10, fontFamily:T.mono }}>
                      ⬡ {txn.to.walletAddress.slice(0,8)}…{txn.to.walletAddress.slice(-4)}
                    </p>
                  )}
                </div>
                <p style={{ color:T.red, fontSize:18, fontWeight:800, fontFamily:T.mono, flexShrink:0 }}>
                  {fmt(txn.amount, group.currency)}
                </p>
              </div>

              {txn.from.userId===user?.id && (
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  <GPayButton upiId={`${txn.to.name.toLowerCase().replace(/\\s/,'')}@upi`} name={txn.to.name} amount={txn.amount} note={`Splittr: ${group.name}`} />
                  <EthPayButton toAddress={txn.to.walletAddress} recipientName={txn.to.name} amountInr={txn.amount} groupId={id} toUserId={txn.to.userId} onPaid={load} />
                  <button onClick={() => settle(txn.to.userId, txn.amount)} style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${T.border}`, borderRadius:12, padding:'10px 16px', color:T.sub, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:T.sans }}>Mark Paid</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
