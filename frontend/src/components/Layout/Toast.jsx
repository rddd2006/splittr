import React from 'react';
import { useApp } from '../../context/AppContext';

export default function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  const bg = { success:'linear-gradient(135deg,#00e07a,#10b981)', error:'linear-gradient(135deg,#f87171,#ef4444)', info:'linear-gradient(135deg,#4f8ef7,#6366f1)' };
  return (
    <div style={{ position:'fixed', top:20, right:20, zIndex:9999, padding:'12px 20px', borderRadius:14, background:bg[toast.type]||bg.info, color: toast.type==='success'?'#07070a':'white', fontSize:13, fontWeight:700, fontFamily:"'Syne',system-ui", boxShadow:'0 8px 32px rgba(0,0,0,0.4)', maxWidth:300, animation:'fadeUp 0.3s ease' }}>
      {toast.message}
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
