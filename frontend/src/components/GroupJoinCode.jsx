import React, { useState } from 'react';
import { groupsApi } from '../api/client';
import { useApp } from '../context/AppContext';

/**
 * GroupJoinCode
 * Shows the group's unique invite code with:
 *  - Copy to clipboard
 *  - Web Share API (mobile)
 *  - Regenerate (admin only)
 */
export default function GroupJoinCode({ groupId, joinCode: initialCode, isAdmin, onRegenerate }) {
  const { showToast } = useApp();
  const [code,      setCode]      = useState(initialCode);
  const [copied,    setCopied]    = useState(false);
  const [regen,     setRegen]     = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareCode = async () => {
    const text = `Join my group on SettleUp!\nInvite code: ${code}\n\nDownload SettleUp and enter the code to join.`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Join my SettleUp group', text }); }
      catch { /* user cancelled */ }
    } else {
      navigator.clipboard.writeText(text);
      showToast('Invite text copied!');
    }
  };

  const handleRegen = async () => {
    if (!confirm('Regenerate the invite code? The old code will stop working.')) return;
    setRegen(true);
    try {
      const res = await groupsApi.regenerateCode(groupId);
      setCode(res.data.joinCode);
      showToast('Invite code regenerated');
      onRegenerate?.(res.data.joinCode);
    } catch {
      showToast('Failed to regenerate code', 'error');
    } finally { setRegen(false); }
  };

  // Format code as XXXX-XXXX for readability
  const formatted = code ? `${code.slice(0,4)}-${code.slice(4)}` : '--------';

  return (
    <div style={{
      background: 'rgba(0,224,122,0.04)',
      border: '1px solid rgba(0,224,122,0.2)',
      borderRadius: 18, padding: 20,
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div>
          <p style={{ color:'rgba(0,224,122,0.7)', fontSize:10, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:"'Syne',system-ui", marginBottom:2 }}>
            Invite Code
          </p>
          <p style={{ color:'rgba(240,240,244,0.4)', fontSize:11, fontFamily:"'Syne',system-ui" }}>
            Share this code to let others join
          </p>
        </div>
        {isAdmin && (
          <button onClick={handleRegen} disabled={regen} style={{
            background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)',
            color:'rgba(240,240,244,0.35)', borderRadius:8, padding:'5px 10px',
            fontSize:10, fontWeight:600, cursor:'pointer', fontFamily:"'Syne',system-ui",
          }}>
            {regen ? '…' : '↺ Regenerate'}
          </button>
        )}
      </div>

      {/* Code display */}
      <div style={{
        background: 'rgba(0,0,0,0.4)',
        border: '1px solid rgba(0,224,122,0.3)',
        borderRadius: 14, padding: '16px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <span style={{ color:'#00e07a', fontSize:26, fontWeight:800, fontFamily:"'DM Mono',monospace", letterSpacing:'0.12em' }}>
          {formatted}
        </span>
        <button onClick={copyCode} style={{
          background: copied ? 'rgba(0,224,122,0.15)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${copied ? 'rgba(0,224,122,0.4)' : 'rgba(255,255,255,0.1)'}`,
          color: copied ? '#00e07a' : 'rgba(240,240,244,0.5)',
          borderRadius: 10, padding:'8px 14px',
          fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Syne',system-ui",
          transition:'all 0.2s',
        }}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>

      {/* Share button */}
      <button onClick={shareCode} style={{
        width: '100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        background: 'rgba(0,224,122,0.08)', border: '1px solid rgba(0,224,122,0.2)',
        color: '#00e07a', borderRadius:12, padding:'11px 0',
        fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'Syne',system-ui",
      }}>
        <span>↑</span> Share Invite
      </button>

      <p style={{ color:'rgba(240,240,244,0.2)', fontSize:10, textAlign:'center', marginTop:10, fontFamily:"'Syne',system-ui" }}>
        Anyone with this code can join the group
      </p>
    </div>
  );
}
