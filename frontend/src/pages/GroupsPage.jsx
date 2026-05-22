import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { groupsApi } from '../api/client';
import { useApp } from '../context/AppContext';
import { formatRelative } from '../utils/formatters';

const S = {
  card: { background:'rgba(255,255,255,0.035)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:18, padding:20 },
  input: { width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'12px 14px', color:'#f0f0f4', fontSize:14, fontFamily:"'Syne',system-ui", outline:'none' },
  label: { display:'block', color:'rgba(240,240,244,0.4)', fontSize:10, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 },
};

export default function GroupsPage() {
  const { showToast } = useApp();
  const [groups,    setGroups]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [joinCode,  setJoinCode]  = useState('');
  const [joining,   setJoining]   = useState(false);
  const [creating,  setCreating]  = useState(false);
  const [form,      setForm]      = useState({ name:'', description:'', currency:'INR' });

  const fetchGroups = () => groupsApi.list().then(r=>setGroups(r.data)).catch(console.error).finally(()=>setLoading(false));
  useEffect(() => { fetchGroups(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault(); setCreating(true);
    try {
      await groupsApi.create(form);
      showToast('Group created!');
      setShowForm(false); setForm({ name:'', description:'', currency:'INR' });
      fetchGroups();
    } catch (err) { showToast(err.response?.data?.error || 'Failed to create group', 'error'); }
    finally { setCreating(false); }
  };

  const handleJoin = async (e) => {
    e.preventDefault(); setJoining(true);
    try {
      const res = await groupsApi.join(joinCode.replace('-','').toUpperCase());
      showToast(`Joined "${res.data.name}"!`);
      setJoinCode(''); fetchGroups();
    } catch (err) { showToast(err.response?.data?.error || 'Invalid code', 'error'); }
    finally { setJoining(false); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try { await groupsApi.delete(id); showToast('Group deleted'); fetchGroups(); }
    catch (err) { showToast(err.response?.data?.error || 'Failed', 'error'); }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
        <div>
          <h1 style={{ color:'#f0f0f4', fontSize:26, fontWeight:800, fontFamily:"'Syne',system-ui", marginBottom:4 }}>Groups</h1>
          <p style={{ color:'rgba(240,240,244,0.4)', fontSize:13, fontFamily:"'Syne',system-ui" }}>Create or join expense groups</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{
          background:'linear-gradient(135deg,#00e07a,#10b981)', border:'none', borderRadius:12,
          padding:'10px 18px', color:'#07070a', fontSize:13, fontWeight:800, cursor:'pointer',
          fontFamily:"'Syne',system-ui", boxShadow:'0 4px 16px rgba(0,224,122,0.25)', flexShrink:0,
        }}>+ New Group</button>
      </div>

      {/* Join with code */}
      <div style={{ ...S.card, background:'rgba(98,126,234,0.04)', border:'1px solid rgba(98,126,234,0.2)' }}>
        <p style={{ color:'rgba(98,126,234,0.8)', fontSize:10, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:"'Syne',system-ui", marginBottom:12 }}>
          ⬡ Join with Invite Code
        </p>
        <form onSubmit={handleJoin} style={{ display:'flex', gap:10 }}>
          <input
            style={{ ...S.input, flex:1 }}
            placeholder="XXXX-XXXX or XXXXXXXX"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            maxLength={9}
            onFocus={e=>e.target.style.borderColor='rgba(98,126,234,0.5)'}
            onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.08)'}
          />
          <button type="submit" disabled={joining || joinCode.length < 8} style={{
            background:'linear-gradient(135deg,#627eea,#8b5cf6)', border:'none',
            borderRadius:12, padding:'12px 20px', color:'white', fontSize:13, fontWeight:700,
            cursor: joining || joinCode.length<8 ? 'not-allowed' : 'pointer',
            fontFamily:"'Syne',system-ui", opacity: joinCode.length<8 ? 0.5 : 1,
          }}>{joining ? '…' : 'Join'}</button>
        </form>
      </div>

      {/* Create group form */}
      {showForm && (
        <div style={S.card}>
          <p style={{ color:'rgba(0,224,122,0.7)', fontSize:11, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', fontFamily:"'Syne',system-ui", marginBottom:16 }}>New Group</p>
          <form onSubmit={handleCreate} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label style={S.label}>Group Name *</label>
              <input style={S.input} placeholder="Goa Trip 2025" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required
                onFocus={e=>e.target.style.borderColor='rgba(0,224,122,0.5)'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.08)'} />
            </div>
            <div>
              <label style={S.label}>Description</label>
              <input style={S.input} placeholder="What's this group for?" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}
                onFocus={e=>e.target.style.borderColor='rgba(0,224,122,0.5)'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.08)'} />
            </div>
            <div>
              <label style={S.label}>Currency</label>
              <select style={{ ...S.input }} value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})}>
                <option value="INR">₹ INR — Indian Rupee</option>
                <option value="USD">$ USD — US Dollar</option>
                <option value="EUR">€ EUR — Euro</option>
                <option value="GBP">£ GBP — British Pound</option>
              </select>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button type="submit" disabled={creating} style={{
                flex:2, background:'linear-gradient(135deg,#00e07a,#10b981)', border:'none',
                borderRadius:12, padding:'12px 0', color:'#07070a', fontSize:14, fontWeight:800,
                cursor:'pointer', fontFamily:"'Syne',system-ui",
              }}>{creating ? 'Creating…' : 'Create Group'}</button>
              <button type="button" onClick={() => setShowForm(false)} style={{
                flex:1, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)',
                borderRadius:12, padding:'12px 0', color:'rgba(240,240,244,0.4)', fontSize:13,
                fontWeight:600, cursor:'pointer', fontFamily:"'Syne',system-ui",
              }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Group list */}
      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
          {[1,2,3].map(i => <div key={i} style={{ ...S.card, height:140, animation:'pulse 1.5s ease infinite' }} />)}
        </div>
      ) : groups.length === 0 ? (
        <div style={{ ...S.card, padding:48, textAlign:'center' }}>
          <p style={{ fontSize:40, marginBottom:12 }}>🏖️</p>
          <p style={{ color:'#f0f0f4', fontWeight:700, fontFamily:"'Syne',system-ui", marginBottom:6 }}>No groups yet</p>
          <p style={{ color:'rgba(240,240,244,0.4)', fontSize:13, fontFamily:"'Syne',system-ui" }}>Create one or join with an invite code</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:12 }}>
          {groups.map(g => (
            <div key={g.id} style={S.card}
              onMouseOver={e=>{ e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.14)'; }}
              onMouseOut={e=>{ e.currentTarget.style.background='rgba(255,255,255,0.035)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <Link to={`/groups/${g.id}`} style={{ color:'#f0f0f4', fontSize:14, fontWeight:700, fontFamily:"'Syne',system-ui", textDecoration:'none', display:'block', marginBottom:4 }}>
                    {g.name}
                  </Link>
                  <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                    <span style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:6, padding:'2px 7px', color:'rgba(240,240,244,0.4)', fontSize:10, fontFamily:"'DM Mono',monospace" }}>
                      {g.joinCode?.slice(0,4)}-{g.joinCode?.slice(4)}
                    </span>
                  </div>
                </div>
                <button onClick={() => handleDelete(g.id, g.name)} style={{ background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.15)', borderRadius:8, padding:'4px 8px', color:'#f87171', fontSize:11, cursor:'pointer', fontFamily:"'Syne',system-ui", flexShrink:0, marginLeft:8 }}>✕</button>
              </div>

              <div style={{ display:'flex', gap:8, marginBottom:14 }}>
                <span style={{ color:'rgba(240,240,244,0.4)', fontSize:11, fontFamily:"'Syne',system-ui" }}>{g.members?.length} members</span>
                <span style={{ color:'rgba(240,240,244,0.2)', fontSize:11 }}>·</span>
                <span style={{ color:'rgba(240,240,244,0.4)', fontSize:11, fontFamily:"'Syne',system-ui" }}>{g._count?.expenses || 0} expenses</span>
              </div>

              <Link to={`/groups/${g.id}`} style={{
                display:'block', textAlign:'center',
                background:'rgba(0,224,122,0.08)', border:'1px solid rgba(0,224,122,0.2)',
                color:'#00e07a', borderRadius:10, padding:'9px 0',
                fontSize:12, fontWeight:700, textDecoration:'none', fontFamily:"'Syne',system-ui",
              }}>Open →</Link>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );
}
