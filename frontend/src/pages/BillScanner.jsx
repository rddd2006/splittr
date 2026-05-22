/**
 * AI Bill Scanner Page
 * Uses Vision API to extract line items, total, merchant from receipt photos.
 * Drop an image → AI reads it → expense form pre-filled automatically.
 */
import React, { useState, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { groupsApi, expensesApi } from '../api/client';

const T = {
  green: '#00e07a', greenDim: 'rgba(0,224,122,0.12)', greenGlow: 'rgba(0,224,122,0.25)',
  red: '#f87171',   redDim:  'rgba(248,113,113,0.12)',
  border: 'rgba(255,255,255,0.07)', surface: 'rgba(255,255,255,0.035)',
  text: '#f0f0f4',  sub: 'rgba(240,240,244,0.45)', dim: 'rgba(240,240,244,0.2)',
  mono: "'DM Mono', monospace", sans: "'Syne', system-ui, sans-serif",
};
const glass = (extra = {}) => ({
  background: T.surface, border: `1px solid ${T.border}`,
  borderRadius: 16, backdropFilter: 'blur(12px)', ...extra,
});
const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.abs(n || 0));

async function scanBillAI(base64, mediaType) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: `Analyze this receipt/bill image. Return ONLY a valid JSON object, no markdown:
{"merchant":"name","date":"YYYY-MM-DD","currency":"INR","subtotal":0.00,"tax":0.00,"total":0.00,"items":[{"name":"item","qty":1,"amount":0.00}]}
Use null for fields you cannot read.` },
        ],
      }],
    }),
  });
  const d = await res.json();
  const raw = d.content?.find(b => b.type === 'text')?.text || '{}';
  return JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim());
}

export default function BillScanner() {
  const { showToast } = useApp();
  const [dragging,  setDragging]  = useState(false);
  const [preview,   setPreview]   = useState(null);
  const [scanning,  setScanning]  = useState(false);
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState(null);
  const [groups,    setGroups]    = useState([]);
  const [selGroup,  setSelGroup]  = useState('');
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const inputRef = useRef();

  const processFile = useCallback(async (file) => {
    if (!file?.type.startsWith('image/')) { setError('Please upload an image file.'); return; }
    setError(null); setResult(null); setSaved(false);
    const reader = new FileReader();
    reader.onload = async (e) => {
      setPreview(e.target.result);
      const base64 = e.target.result.split(',')[1];
      setScanning(true);
      try {
        const data = await scanBillAI(base64, file.type);
        setResult(data);
        const gRes = await groupsApi.list();
        setGroups(gRes.data);
        if (gRes.data.length > 0) setSelGroup(gRes.data[0].id);
      } catch {
        setError("Couldn't extract bill data. Try a clearer photo.");
      } finally {
        setScanning(false);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    processFile(e.dataTransfer.files[0]);
  }, [processFile]);

  const handleSave = async () => {
    if (!selGroup || !result?.total) return;
    setSaving(true);
    try {
      await expensesApi.create(selGroup, {
        title: result.merchant || 'Scanned Bill',
        amount: result.total,
        splitType: 'EQUAL',
        description: `AI-scanned receipt. Items: ${result.items?.map(i => i.name).join(', ')}`,
      });
      setSaved(true);
      showToast('Expense added from bill scan!');
    } catch {
      showToast('Failed to save expense', 'error');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => { setPreview(null); setResult(null); setError(null); setSaved(false); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '24px 0' }}>
      <div>
        <h1 style={{ color: T.text, fontSize: 26, fontWeight: 800, fontFamily: T.sans, marginBottom: 6 }}>AI Bill Scanner</h1>
        <p style={{ color: T.sub, fontSize: 14, fontFamily: T.sans }}>
          Photograph any receipt — Claude extracts merchant, items & total instantly.
        </p>
      </div>

      {!preview ? (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current.click()}
          style={{
            ...glass(), borderRadius: 24, padding: '56px 24px',
            border: `2px dashed ${dragging ? T.green : T.border}`,
            background: dragging ? T.greenDim : T.surface,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          <div style={{ fontSize: 48 }}>📸</div>
          <p style={{ color: T.text, fontSize: 18, fontWeight: 700, fontFamily: T.sans }}>Drop bill image here</p>
          <p style={{ color: T.sub, fontSize: 13, fontFamily: T.sans }}>or click to browse · JPG, PNG, WEBP, HEIC</p>
          <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => processFile(e.target.files[0])} capture="environment" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16 }}>
          <div style={{ ...glass(), borderRadius: 20, overflow: 'hidden', position: 'relative' }}>
            <img src={preview} alt="Bill" style={{ width: '100%', height: 320, objectFit: 'cover' }} />
            {scanning && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(5,5,10,0.82)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
              }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', border: `3px solid ${T.border}`, borderTopColor: T.green, animation: 'spin 0.8s linear infinite' }} />
                <p style={{ color: T.green, fontFamily: T.sans, fontSize: 14, fontWeight: 600 }}>Claude is reading your bill…</p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {error && <div style={{ ...glass(), borderRadius: 14, padding: 16, border: `1px solid ${T.red}44`, background: T.redDim }}>
              <p style={{ color: T.red, fontFamily: T.sans, fontSize: 13 }}>{error}</p>
            </div>}

            {result && !scanning && (<>
              <div style={{ ...glass(), borderRadius: 16, padding: 18 }}>
                <p style={{ color: T.dim, fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: T.sans, marginBottom: 14 }}>Extracted</p>
                {[['Merchant', result.merchant], ['Date', result.date], ['Tax', result.tax != null ? fmt(result.tax) : null]].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: T.sub, fontSize: 12, fontFamily: T.sans }}>{k}</span>
                    <span style={{ color: T.text, fontSize: 12, fontFamily: T.mono }}>{v}</span>
                  </div>
                ))}
              </div>

              {result.items?.length > 0 && (
                <div style={{ ...glass(), borderRadius: 16, padding: 16, maxHeight: 160, overflowY: 'auto' }}>
                  <p style={{ color: T.dim, fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: T.sans, marginBottom: 10 }}>Items</p>
                  {result.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < result.items.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                      <span style={{ color: T.text, fontSize: 12, fontFamily: T.sans }}>{item.name}</span>
                      <span style={{ color: T.green, fontSize: 12, fontFamily: T.mono }}>{fmt(item.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ background: T.greenDim, border: `1px solid ${T.green}44`, borderRadius: 14, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: T.sub, fontSize: 13, fontFamily: T.sans }}>Total</span>
                <span style={{ color: T.green, fontSize: 24, fontWeight: 800, fontFamily: T.mono }}>{fmt(result.total)}</span>
              </div>

              {groups.length > 0 && !saved && (
                <select
                  value={selGroup}
                  onChange={e => setSelGroup(e.target.value)}
                  style={{ ...glass(), color: T.text, fontSize: 13, fontFamily: T.sans, padding: '10px 14px', cursor: 'pointer', outline: 'none' }}
                >
                  {groups.map(g => <option key={g.id} value={g.id} style={{ background: '#1a1a2e' }}>{g.name}</option>)}
                </select>
              )}

              {saved ? (
                <div style={{ background: T.greenDim, border: `1px solid ${T.green}44`, borderRadius: 12, padding: '13px 0', textAlign: 'center' }}>
                  <p style={{ color: T.green, fontSize: 14, fontWeight: 700, fontFamily: T.sans }}>✓ Saved to group</p>
                </div>
              ) : (
                <button onClick={handleSave} disabled={saving || !selGroup} style={{
                  background: `linear-gradient(135deg, ${T.green}, #10b981)`, border: 'none', borderRadius: 12,
                  padding: '13px 0', color: '#07070a', fontSize: 14, fontWeight: 800,
                  cursor: 'pointer', fontFamily: T.sans, boxShadow: `0 4px 20px ${T.greenGlow}`,
                }}>
                  {saving ? 'Saving…' : 'Add to Group →'}
                </button>
              )}
            </>)}
          </div>
        </div>
      )}

      {preview && (
        <button onClick={reset} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 10, color: T.sub, fontSize: 12, padding: '8px 18px', cursor: 'pointer', fontFamily: T.sans, alignSelf: 'flex-start' }}>
          ← Scan another
        </button>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
