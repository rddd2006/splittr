import { useState, useRef, useCallback, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, CartesianGrid } from "recharts";

const C = {
  bg:"#1B2838", s1:"rgba(51,255,0,0.05)", s2:"rgba(51,255,0,0.08)",
  b1:"rgba(255,176,0,0.15)", b2:"rgba(255,176,0,0.25)",
  green:"#33FF00", gDim:"rgba(51,255,0,0.12)", gGlow:"0 0 28px rgba(51,255,0,0.35)",
  blue:"#4f8ef7", purple:"#a78bfa", amber:"#FFB000", red:"#CC0000", rDim:"rgba(204,0,0,0.1)",
  text:"#E8E0D0", sub:"rgba(232,224,208,0.6)", dim:"rgba(232,224,208,0.3)",
  mono:"'VT323','JetBrains Mono',monospace", sans:"'VT323','JetBrains Mono',system-ui,sans-serif",
};
const card  = (x={}) => ({ background:C.s1, border:`2px solid ${C.amber}`, borderRadius:0, backdropFilter:"blur(14px)", ...x });
const fmt   = (n) => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(Math.abs(n||0));
const short = a => a ? `${a.slice(0,6)}…${a.slice(-4)}` : "";
const GROUPS=[
  {id:"g1",name:"Goa Trip 2025",   code:"GOAK3F2P",emoji:"🏖️",members:4,balance:-2400,expenses:8 },
  {id:"g2",name:"Office Lunch",    code:"LUN4CH9X",emoji:"🍱",members:6,balance:850,  expenses:23},
  {id:"g3",name:"Apartment Bills", code:"APT7HM1Q",emoji:"🏠",members:3,balance:-1200,expenses:12},
  {id:"g4",name:"Diwali Party",    code:"DWL8PZ3R",emoji:"🪔",members:8,balance:3200, expenses:5 },
];
const OWE=[
  {id:"p1",name:"Priya Sharma",init:"PS",upi:"priya@paytm",  wallet:"0xAbCd1234567890abcdef1234567890ABCDEF1234",amount:1800,group:"Goa Trip",  color:"#f472b6"},
  {id:"p2",name:"Rahul Dev",   init:"RD",upi:"rahul@oksbi",  wallet:"0xDeF0987654321fedcba0987654321FEDCBA0987",amount:600, group:"Apartment",  color:C.blue},
];
const OWED=[
  {id:"p3",name:"Neha Kumar", init:"NK",upi:"neha@ybl",     wallet:"0x1234567890ABCDEF1234567890abcdef12345678",amount:850, group:"Office",    color:C.green},
  {id:"p4",name:"Rohit Singh",init:"RS",upi:"rohit@okicici",wallet:"0xFEDCBA0987654321FEDCBA0987654321fedcba09",amount:3200,group:"Diwali",    color:C.purple},
];
const FEED=[
  {id:1,t:"Hotel stay (3 nights)", g:"Goa Trip",  a:4800,by:"Priya", time:"2h ago", type:"exp"},
  {id:2,t:"Smoke House lunch",     g:"Office",    a:1250,by:"You",   time:"1d ago", type:"exp"},
  {id:3,t:"Rahul settled up",      g:"Apartment", a:800, by:"Rahul", time:"2d ago", type:"settle"},
  {id:4,t:"Diwali decorations",    g:"Diwali",    a:3200,by:"You",   time:"3d ago", type:"exp"},
  {id:5,t:"Beach bar tab",         g:"Goa Trip",  a:950, by:"Arjun", time:"4d ago", type:"exp"},
];
const SPEND=[{m:"Dec",v:12400},{m:"Jan",v:8900},{m:"Feb",v:15200},{m:"Mar",v:11000},{m:"Apr",v:19500},{m:"May",v:7800}];
const PIE=[{name:"Food",v:38,c:C.green},{name:"Travel",v:28,c:C.blue},{name:"Stay",v:22,c:C.purple},{name:"Other",v:12,c:C.dim}];

function Av({name,color=C.green,size=36}){
  const ini=name?.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase()||"?";
  return <div style={{width:size,height:size,borderRadius:size/2,background:color+"22",border:`1.5px solid ${color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.32,fontWeight:700,color,fontFamily:C.sans,flexShrink:0}}>{ini}</div>;
}
function Chip({children,color=C.green}){
  return <span style={{background:color+"18",border:`2px solid ${color}`,color,borderRadius:0,padding:"3px 10px",fontSize:11,fontWeight:700,fontFamily:C.sans}}>{children}</span>;
}

function GPay({upi,name,amount}){
  const [modal,setModal]=useState(false);
  const [cp,setCp]=useState(false);
  const upiUrl=`upi://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent(name)}&am=${Number(amount).toFixed(2)}&cu=INR&tn=Splittr`;
  const tezUrl=`tez://upi/pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent(name)}&am=${Number(amount).toFixed(2)}&cu=INR`;
  const go=()=>{
    const ua=navigator.userAgent||"";
    if(/Android/i.test(ua)){window.location.href=tezUrl;setTimeout(()=>{window.location.href=upiUrl;},600);}
    else if(/iPhone|iPad/i.test(ua)){window.location.href=upiUrl;}
    else setModal(true);
  };
  const copy=()=>{try{navigator.clipboard.writeText(upi);}catch{}setCp(true);setTimeout(()=>setCp(false),2000);};
  return(<>
    <button onClick={go} style={{display:"flex",alignItems:"center",gap:8,background:"#33FF00",border:"3px solid #33FF00",borderRadius:0,padding:"10px 18px",color:"#1B2838",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:C.sans,boxShadow:"0 0 15px rgba(51,255,0,0.4)",transition:"transform .15s,box-shadow .15s"}}
      onMouseOver={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 28px rgba(66,133,244,.55)";}}
      onMouseOut={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 4px 16px rgba(66,133,244,.4)";}}>
      <svg width="14" height="14" viewBox="0 0 24 24"><path d="M21.8 10.2H12v3.6h5.6c-.5 2.5-2.7 4.2-5.6 4.2-3.4 0-6-2.7-6-6s2.6-6 6-6c1.5 0 2.8.5 3.8 1.4l2.7-2.7C16.9 3 14.6 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.5 0 10-4.5 10-10 0-.6-.1-1.2-.2-1.8z" fill="white"/></svg>
      Pay {fmt(amount)}
    </button>
    {modal&&<div onClick={()=>setModal(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,backdropFilter:"blur(10px)"}}>
      <div onClick={e=>e.stopPropagation()} style={{...card({padding:28,width:340,maxWidth:"92vw",borderRadius:24,border:"1px solid rgba(66,133,244,.3)"})}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <div style={{width:44,height:44,borderRadius:0,background:"rgba(51,255,0,.12)",border:"2px solid rgba(51,255,0,.4)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="20" height="20" viewBox="0 0 24 24"><path d="M21.8 10.2H12v3.6h5.6c-.5 2.5-2.7 4.2-5.6 4.2-3.4 0-6-2.7-6-6s2.6-6 6-6c1.5 0 2.8.5 3.8 1.4l2.7-2.7C16.9 3 14.6 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.5 0 10-4.5 10-10 0-.6-.1-1.2-.2-1.8z" fill="#4285f4"/></svg>
          </div>
          <div><p style={{color:C.text,fontSize:15,fontWeight:800,fontFamily:C.sans}}>Pay via GPay / UPI</p><p style={{color:C.sub,fontSize:11,fontFamily:C.sans}}>Opens UPI app on mobile</p></div>
        </div>
        <div style={{background:"rgba(0,0,0,.4)",border:`2px solid ${C.amber}`,borderRadius:0,padding:"18px 20px",marginBottom:14}}>
          <p style={{color:C.dim,fontSize:10,fontFamily:C.mono,letterSpacing:".1em",marginBottom:4}}>AMOUNT</p>
          <p style={{color:"#4285f4",fontSize:28,fontWeight:800,fontFamily:C.mono}}>{fmt(amount)}</p>
          <p style={{color:C.sub,fontSize:12,fontFamily:C.sans,marginTop:2}}>to {name}</p>
        </div>
        <div style={{background:"rgba(51,255,0,.06)",border:"2px solid rgba(51,255,0,.2)",borderRadius:0,padding:"12px 16px",marginBottom:14}}>
          <p style={{color:C.dim,fontSize:10,fontFamily:C.mono,letterSpacing:".08em",marginBottom:4}}>UPI ID</p>
          <p style={{color:C.text,fontSize:15,fontWeight:700,fontFamily:C.mono}}>{upi}</p>
        </div>
        <button onClick={copy} style={{width:"100%",background:cp?"rgba(51,255,0,.1)":C.s2,border:`2px solid ${cp?"rgba(51,255,0,.6)":C.b1}`,color:cp?C.green:C.sub,borderRadius:0,padding:"11px 0",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:C.sans,marginBottom:10,transition:"all .2s"}}>{cp?"✓ Copied!":"Copy UPI ID"}</button>
        <a href={upiUrl} style={{display:"block",textAlign:"center",background:"linear-gradient(135deg,#4285f4,#34a853)",color:"white",borderRadius:12,padding:"11px 0",fontSize:13,fontWeight:700,textDecoration:"none",fontFamily:C.sans}}>Open GPay / UPI App</a>
        <p style={{color:C.dim,fontSize:10,textAlign:"center",marginTop:12,fontFamily:C.sans}}>On Android, the Pay button opens GPay via tez://</p>
      </div>
    </div>}
  </>);
}

function EthPay({wallet,name,amountInr}){
  const [modal,setModal]=useState(false);
  const [status,setStatus]=useState("idle");
  const [hash,setHash]=useState("");
  const rate=300000;
  const eth=(amountInr/rate).toFixed(6);
  if(!wallet)return <div style={{background:"rgba(255,255,255,.03)",border:`2px solid ${C.b1}`,borderRadius:0,padding:"9px 14px"}}><p style={{color:C.dim,fontSize:11,fontFamily:C.sans}}>No wallet linked</p></div>;
  const pay=async()=>{
    if(!window.ethereum){alert("Please install MetaMask to pay with ETH.");return;}
    setStatus("pending");
    try{
      const {ethers}=await import("https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.umd.min.js");
      const prov=new ethers.BrowserProvider(window.ethereum);
      const net=await prov.getNetwork();
      if(net.chainId!==11155111n){
        await window.ethereum.request({method:"wallet_switchEthereumChain",params:[{chainId:"0xaa36a7"}]});
      }
      const signer=await prov.getSigner();
      const tx=await signer.sendTransaction({to:wallet,value:ethers.parseEther(eth)});
      setHash(tx.hash);setStatus("done");
    }catch(e){console.error(e);setStatus("err");}
  };
  return(<>
    <button onClick={()=>setModal(true)} style={{display:"flex",alignItems:"center",gap:8,background:"#FFB000",border:"3px solid #FFB000",borderRadius:0,padding:"10px 18px",color:"#1B2838",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:C.sans,boxShadow:"0 0 15px rgba(255,176,0,0.4)",transition:"transform .15s"}}
      onMouseOver={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseOut={e=>e.currentTarget.style.transform=""}>
      <svg width="13" height="13" viewBox="0 0 32 32" fill="none"><path d="M16 0L6 16L16 21L26 16L16 0Z" fill="white" fillOpacity=".9"/><path d="M16 23L6 18L16 32L26 18L16 23Z" fill="white" fillOpacity=".7"/></svg>
      {eth} ETH
    </button>
    {modal&&<div onClick={()=>{if(status!=="pending")setModal(false);}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.9)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:10000,backdropFilter:"blur(10px)"}}>
      <div onClick={e=>e.stopPropagation()} style={{...card({padding:28,width:360,maxWidth:"92vw",borderRadius:24,border:"1px solid rgba(98,126,234,.35)"})}}>
        <p style={{color:"rgba(167,139,250,.7)",fontSize:11,fontWeight:600,letterSpacing:".1em",textTransform:"uppercase",fontFamily:C.sans,marginBottom:6}}>Ethereum · Sepolia Testnet</p>
        <p style={{color:"#a78bfa",fontSize:28,fontWeight:800,fontFamily:C.mono,marginBottom:2}}>{eth} ETH</p>
        <p style={{color:C.sub,fontSize:12,fontFamily:C.sans,marginBottom:20}}>≈ {fmt(amountInr)} at current rate · to {name}</p>
        <div style={{background:"rgba(255,176,0,.06)",border:"2px solid rgba(255,176,0,.2)",borderRadius:0,padding:"12px 16px",marginBottom:16}}>
          <p style={{color:C.dim,fontSize:10,fontFamily:C.mono,letterSpacing:".08em",marginBottom:4}}>RECIPIENT WALLET</p>
          <p style={{color:C.text,fontSize:12,fontFamily:C.mono,wordBreak:"break-all"}}>{wallet}</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,background:"rgba(255,176,0,.05)",border:"2px solid rgba(255,176,0,.2)",borderRadius:0,padding:"10px 14px",marginBottom:16}}>
          <span style={{fontSize:14}}>⚠️</span>
          <p style={{color:"rgba(251,191,36,.7)",fontSize:11,fontFamily:C.sans}}>Sepolia testnet — test ETH has no real value. Get free ETH at sepoliafaucet.com</p>
        </div>
        {status==="done"&&<div style={{background:"rgba(51,255,0,.08)",border:"2px solid rgba(51,255,0,.4)",borderRadius:0,padding:"10px 14px",marginBottom:14,textAlign:"center"}}><p style={{color:C.green,fontSize:12,fontFamily:C.sans,fontWeight:700}}>✓ Sent! <a href={`https://sepolia.etherscan.io/tx/${hash}`} target="_blank" rel="noreferrer" style={{color:C.green}}>View on Etherscan ↗</a></p></div>}
        {status==="err"&&<div style={{background:C.rDim,border:"2px solid rgba(204,0,0,.4)",borderRadius:0,padding:"10px 14px",marginBottom:14}}><p style={{color:C.red,fontSize:12,fontFamily:C.sans}}>Transaction failed. Ensure you are on Sepolia and have test ETH.</p></div>}
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>setModal(false)} style={{flex:1,background:C.s2,border:`1px solid ${C.b1}`,color:C.sub,borderRadius:12,padding:"12px 0",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:C.sans}}>Cancel</button>
          <button onClick={pay} disabled={["pending","done"].includes(status)} style={{flex:2,background:"linear-gradient(135deg,#627eea,#8b5cf6)",border:"none",color:"white",borderRadius:12,padding:"12px 0",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:C.sans,opacity:["pending","done"].includes(status)?.6:1}}>
            {status==="pending"?"Confirming…":"⬡ Confirm in MetaMask"}
          </button>
        </div>
      </div>
    </div>}
  </>);
}

async function scanBill(b64,mt){
  const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:[{type:"image",source:{type:"base64",media_type:mt,data:b64}},{type:"text",text:`Analyze this receipt/bill image carefully. Return ONLY valid JSON (no markdown, no explanation):\n{"merchant":"string","date":"YYYY-MM-DD or null","currency":"INR","subtotal":0,"tax":0,"total":0,"items":[{"name":"string","qty":1,"amount":0}]}`}]}]})});
  const d=await r.json();
  const raw=(d.content?.find(x=>x.type==="text")?.text||"{}");
  return JSON.parse(raw.replace(/```json?\n?|```/g,"").trim());
}

function Scanner(){
  const [drag,setDrag]=useState(false);
  const [prev,setPrev]=useState(null);
  const [scanning,setScanning]=useState(false);
  const [result,setResult]=useState(null);
  const [err,setErr]=useState(null);
  const [added,setAdded]=useState(false);
  const ref=useRef();
  const proc=useCallback(async f=>{
    if(!f?.type.startsWith("image/")){setErr("Please upload an image file.");return;}
    setErr(null);setResult(null);setAdded(false);
    const reader=new FileReader();
    reader.onload=async e=>{
      setPrev(e.target.result);setScanning(true);
      try{setResult(await scanBill(e.target.result.split(",")[1],f.type));}
      catch(ex){console.error(ex);setErr("Could not read bill. Try a clearer photo.");}
      finally{setScanning(false);}
    };
    reader.readAsDataURL(f);
  },[]);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div>
        <h2 style={{color:C.text,fontSize:22,fontWeight:800,fontFamily:C.sans,marginBottom:4}}>AI Bill Scanner</h2>
        <p style={{color:C.sub,fontSize:13,fontFamily:C.sans}}>Drop any receipt photo — Claude Vision reads every line item instantly.</p>
      </div>
      {!prev?(
        <div onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);proc(e.dataTransfer.files[0]);}} onClick={()=>ref.current.click()}
          style={{...card({borderRadius:0,padding:"60px 24px",border:`2px dashed ${drag?C.green:C.b1}`,background:drag?C.gDim:C.s1,display:"flex",flexDirection:"column",alignItems:"center",gap:14,cursor:"pointer",transition:"all .2s"})}}> 
          <div style={{width:68,height:68,borderRadius:20,background:C.gDim,border:`1px solid rgba(0,224,122,.35)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32}}>📷</div>
          <p style={{color:C.text,fontSize:17,fontWeight:700,fontFamily:C.sans}}>Drop a bill image here</p>
          <p style={{color:C.sub,fontSize:12,fontFamily:C.sans}}>or tap to browse · JPG, PNG, WEBP, HEIC</p>
          <input ref={ref} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>proc(e.target.files[0])}/>
        </div>
      ):(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <div style={{...card({borderRadius:0,overflow:"hidden",position:"relative"})}}>
            <img src={prev} alt="" style={{width:"100%",height:300,objectFit:"cover",display:"block"}}/>
            {scanning&&<div style={{position:"absolute",inset:0,background:"rgba(5,5,10,.88)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,backdropFilter:"blur(4px)"}}>
              <div style={{width:48,height:48,borderRadius:"50%",border:`3px solid ${C.b1}`,borderTopColor:C.green,animation:"spin .8s linear infinite"}}/>
              <p style={{color:C.green,fontFamily:C.sans,fontSize:13,fontWeight:600}}>Claude is reading your bill…</p>
              <p style={{color:C.dim,fontFamily:C.sans,fontSize:11}}>Extracting items & amounts</p>
            </div>}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {err&&<div style={{...card({borderRadius:0,padding:"14px 16px",border:"2px solid rgba(204,0,0,.4)",background:C.rDim})}}><p style={{color:C.red,fontSize:13,fontFamily:C.sans}}>{err}</p></div>}
            {result&&!scanning&&<>
              <div style={{...card({borderRadius:16,padding:16})}}>
                <p style={{color:C.dim,fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".1em",fontFamily:C.sans,marginBottom:12}}>Extracted Info</p>
                {[["Merchant",result.merchant],["Date",result.date],["Tax",result.tax!=null?fmt(result.tax):null]].filter(([,v])=>v&&v!=="null").map(([k,v])=>(
                  <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:`1px solid ${C.b1}`}}>
                    <span style={{color:C.sub,fontSize:12,fontFamily:C.sans}}>{k}</span>
                    <span style={{color:C.text,fontSize:12,fontFamily:C.mono}}>{v}</span>
                  </div>
                ))}
              </div>
              {result.items?.length>0&&(
                <div style={{...card({borderRadius:16,padding:16,maxHeight:160,overflowY:"auto"})}}>
                  <p style={{color:C.dim,fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:".1em",fontFamily:C.sans,marginBottom:10}}>Line Items</p>
                  {result.items.map((it,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:i<result.items.length-1?`1px solid ${C.b1}`:"none"}}>
                      <span style={{color:C.text,fontSize:12,fontFamily:C.sans,flex:1,paddingRight:8}}>{it.name}{it.qty>1?` ×${it.qty}`:""}</span>
                      <span style={{color:C.green,fontSize:12,fontFamily:C.mono,flexShrink:0}}>{fmt(it.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{background:C.gDim,border:"2px solid rgba(51,255,0,.4)",borderRadius:0,padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{color:C.sub,fontSize:13,fontFamily:C.sans}}>Total</span>
                <span style={{color:C.green,fontSize:26,fontWeight:800,fontFamily:C.mono}}>{fmt(result.total)}</span>
              </div>
              {added
                ?<div style={{background:C.gDim,border:"1px solid rgba(0,224,122,.3)",borderRadius:12,padding:"12px 0",textAlign:"center"}}><p style={{color:C.green,fontSize:13,fontWeight:700,fontFamily:C.sans}}>✓ Added as expense</p></div>
                :<button onClick={()=>setAdded(true)} style={{background:`${C.green}`,border:"3px solid ${C.green}",borderRadius:0,padding:"13px 0",color:"#1B2838",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:C.sans,boxShadow:C.gGlow}}>Add to Group →</button>
              }
            </>}
            {!result&&!scanning&&!err&&<div style={{...card({borderRadius:16,padding:40,display:"flex",alignItems:"center",justifyContent:"center"})}}><p style={{color:C.dim,fontSize:13,fontFamily:C.sans}}>Results will appear here…</p></div>}
          </div>
        </div>
      )}
      {prev&&<button onClick={()=>{setPrev(null);setResult(null);setErr(null);setAdded(false);}} style={{background:"transparent",border:`2px solid ${C.b1}`,borderRadius:0,color:C.sub,fontSize:12,padding:"8px 18px",cursor:"pointer",fontFamily:C.sans,alignSelf:"flex-start"}}>← Scan another</button>}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function Dashboard(){
  const totalOwed=OWED.reduce((s,x)=>s+x.amount,0),totalOwe=OWE.reduce((s,x)=>s+x.amount,0),net=totalOwed-totalOwe;
  const Tip=({active,payload})=>(!active||!payload?.length)?null:<div style={{...card({padding:"7px 12px",border:"1px solid rgba(0,224,122,.3)"})}}>
    <p style={{color:C.green,fontWeight:700,fontFamily:C.mono,fontSize:12}}>{fmt(payload[0].value)}</p></div>;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{borderRadius:0,padding:"26px 24px 22px",background:"linear-gradient(135deg,rgba(51,255,0,.1),rgba(255,176,0,.06))",border:"2px solid rgba(51,255,0,.22)",boxShadow:"0 0 60px rgba(51,255,0,.1)",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-60,right:-60,width:220,height:220,borderRadius:"50%",background:"radial-gradient(circle,rgba(0,224,122,.12),transparent 70%)",pointerEvents:"none"}}/>
        <p style={{color:C.sub,fontSize:11,fontWeight:600,letterSpacing:".1em",textTransform:"uppercase",fontFamily:C.sans,marginBottom:8}}>Net Balance</p>
        <p style={{fontSize:40,fontWeight:800,fontFamily:C.sans,letterSpacing:"-.02em",background:net>=0?`linear-gradient(90deg,${C.green},#34d399)`:`linear-gradient(90deg,${C.red},#f87171)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:20}}>
          {net>=0?"+":" −"}{fmt(Math.abs(net))}
        </p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {[["You're owed",totalOwed,C.green],["You owe",totalOwe,C.red]].map(([l,v,col])=>(
            <div key={l} style={{background:"rgba(0,0,0,.28)",borderRadius:0,padding:"12px 14px"}}>
              <p style={{color:C.sub,fontSize:11,fontFamily:C.sans,marginBottom:4}}>{l}</p>
              <p style={{color:col,fontSize:20,fontWeight:700,fontFamily:C.mono}}>{fmt(v)}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 176px",gap:12}}>
        <div style={{...card({borderRadius:20,padding:"18px 14px 10px"})}}>
          <p style={{color:C.dim,fontSize:10,fontWeight:600,letterSpacing:".1em",textTransform:"uppercase",fontFamily:C.sans,marginBottom:14,paddingLeft:4}}>Monthly Spending</p>
          <ResponsiveContainer width="100%" height={155}>
            <AreaChart data={SPEND} margin={{top:0,right:4,left:-28,bottom:0}}>
              <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.green} stopOpacity={.3}/><stop offset="100%" stopColor={C.green} stopOpacity={0}/></linearGradient></defs>
              <XAxis dataKey="m" tick={{fill:C.dim,fontSize:11,fontFamily:C.mono}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:C.dim,fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`${v/1000}k`}/>
              <Tooltip content={<Tip/>} cursor={{stroke:C.b1}}/>
              <Area type="monotone" dataKey="v" stroke={C.green} strokeWidth={2} fill="url(#g1)" dot={false} activeDot={{r:5,fill:C.green,stroke:C.bg,strokeWidth:2}}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{...card({borderRadius:20,padding:"18px 12px"})}}>
          <p style={{color:C.dim,fontSize:10,fontWeight:600,letterSpacing:".1em",textTransform:"uppercase",fontFamily:C.sans,marginBottom:10}}>Category</p>
          <PieChart width={152} height={100} style={{alignSelf:"center"}}><Pie data={PIE} dataKey="v" cx="50%" cy="50%" innerRadius={28} outerRadius={46} strokeWidth={0}>{PIE.map((d,i)=><Cell key={i} fill={d.c}/>)}</Pie></PieChart>
          <div style={{display:"flex",flexDirection:"column",gap:5,marginTop:8}}>
            {PIE.map(d=><div key={d.name} style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:6,height:6,borderRadius:3,background:d.c,flexShrink:0}}/><span style={{color:C.sub,fontSize:10,fontFamily:C.sans,flex:1}}>{d.name}</span><span style={{color:C.text,fontSize:10,fontFamily:C.mono}}>{d.v}%</span></div>)}
          </div>
        </div>
      </div>

      <div style={{...card({borderRadius:20,overflow:"hidden"})}}>
        <div style={{padding:"14px 20px 12px",borderBottom:`1px solid ${C.b1}`}}><p style={{color:C.sub,fontSize:11,fontWeight:600,letterSpacing:".08em",textTransform:"uppercase",fontFamily:C.sans}}>Recent Activity</p></div>
        {FEED.map((item,i)=>(
          <div key={item.id} style={{display:"flex",alignItems:"center",gap:14,padding:"13px 20px",borderBottom:i<FEED.length-1?`1px solid ${C.b1}`:"none"}}>
            <div style={{width:36,height:36,borderRadius:10,background:item.type==="settle"?C.gDim:"rgba(79,142,247,.1)",border:`1px solid ${item.type==="settle"?"rgba(0,224,122,.25)":"rgba(79,142,247,.25)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{item.type==="settle"?"✓":"↑"}</div>
            <div style={{flex:1,minWidth:0}}>
              <p style={{color:C.text,fontSize:13,fontWeight:600,fontFamily:C.sans,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.t}</p>
              <p style={{color:C.dim,fontSize:11,fontFamily:C.sans}}>{item.g} · {item.by==="You"?"you paid":`${item.by} paid`}</p>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <p style={{color:item.type==="settle"?C.green:C.text,fontSize:14,fontWeight:700,fontFamily:C.mono}}>{fmt(item.a)}</p>
              <p style={{color:C.dim,fontSize:10,fontFamily:C.sans}}>{item.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Groups(){
  const [code,setCode]=useState("");
  const [joined,setJoined]=useState(null);
  const [showNew,setShowNew]=useState(false);
  const [newName,setNewName]=useState("");
  const [copied,setCopied]=useState({});
  const copyCode=(g)=>{try{navigator.clipboard.writeText(g.code);}catch{}setCopied(x=>({...x,[g.id]:true}));setTimeout(()=>setCopied(x=>({...x,[g.id]:false})),2000);};
  const doJoin=()=>{
    const c=code.replace("-","").toUpperCase();
    const g=GROUPS.find(x=>x.code===c);
    if(g){setJoined(g.name);setCode("");}
    else alert("Invalid code. Try: "+GROUPS[0].code.slice(0,4)+"-"+GROUPS[0].code.slice(4));
  };
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
        <div><h2 style={{color:C.text,fontSize:22,fontWeight:800,fontFamily:C.sans,marginBottom:4}}>Groups</h2><p style={{color:C.sub,fontSize:13,fontFamily:C.sans}}>Create groups · invite with a code</p></div>
        <button onClick={()=>setShowNew(!showNew)} style={{background:`linear-gradient(135deg,${C.green},#10b981)`,border:"none",borderRadius:12,padding:"10px 18px",color:"#07070a",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:C.sans,boxShadow:C.gGlow,flexShrink:0}}>+ New Group</button>
      </div>

      <div style={{...card({borderRadius:18,padding:18,background:"rgba(98,126,234,.04)",border:"1px solid rgba(98,126,234,.2)"})}}>
        <p style={{color:"rgba(98,126,234,.8)",fontSize:10,fontWeight:600,letterSpacing:".1em",textTransform:"uppercase",fontFamily:C.sans,marginBottom:12}}>⬡ Join with Invite Code</p>
        <div style={{display:"flex",gap:10}}>
          <input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="XXXX-XXXX" maxLength={9}
            style={{flex:1,background:"rgba(255,255,255,.04)",border:`1px solid ${C.b1}`,borderRadius:12,padding:"11px 14px",color:C.text,fontSize:14,fontFamily:C.mono,outline:"none"}}
            onFocus={e=>e.target.style.borderColor="rgba(98,126,234,.5)"} onBlur={e=>e.target.style.borderColor=C.b1}
            onKeyDown={e=>e.key==="Enter"&&doJoin()}/>
          <button onClick={doJoin} disabled={code.replace("-","").length<8} style={{background:"linear-gradient(135deg,#627eea,#8b5cf6)",border:"none",borderRadius:12,padding:"11px 22px",color:"white",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:C.sans,opacity:code.replace("-","").length<8?.5:1}}>Join</button>
        </div>
        {joined&&<div style={{display:"flex",alignItems:"center",gap:8,marginTop:10}}><span style={{color:C.green,fontSize:14}}>✓</span><p style={{color:C.green,fontSize:12,fontFamily:C.sans,fontWeight:600}}>Joined "{joined}" successfully!</p></div>}
      </div>

      {showNew&&(
        <div style={{...card({borderRadius:18,padding:20})}}>
          <p style={{color:C.green,fontSize:11,fontWeight:600,letterSpacing:".08em",textTransform:"uppercase",fontFamily:C.sans,marginBottom:14}}>New Group</p>
          <div style={{display:"flex",gap:10}}>
            <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Goa Trip 2025"
              style={{flex:1,background:C.s2,border:`1px solid ${C.b1}`,borderRadius:12,padding:"11px 14px",color:C.text,fontSize:14,fontFamily:C.sans,outline:"none"}}
              onFocus={e=>e.target.style.borderColor=`rgba(0,224,122,.5)`} onBlur={e=>e.target.style.borderColor=C.b1}
              onKeyDown={e=>{if(e.key==="Enter"&&newName){const code=Math.random().toString(36).slice(2,10).toUpperCase();alert(`Group "${newName}" created!\nInvite code: ${code.slice(0,4)}-${code.slice(4)}`);setShowNew(false);setNewName("");}}}/>
            <button onClick={()=>{if(newName){const code=Math.random().toString(36).slice(2,10).toUpperCase();alert(`Group "${newName}" created!\nInvite code: ${code.slice(0,4)}-${code.slice(4)}`);setShowNew(false);setNewName("");}}} style={{background:`linear-gradient(135deg,${C.green},#10b981)`,border:"none",borderRadius:12,padding:"11px 22px",color:"#07070a",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:C.sans}}>Create</button>
            <button onClick={()=>setShowNew(false)} style={{background:C.s2,border:`1px solid ${C.b1}`,borderRadius:12,padding:"11px 14px",color:C.sub,fontSize:13,cursor:"pointer",fontFamily:C.sans}}>✕</button>
          </div>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:12}}>
        {GROUPS.map(g=>(
          <div key={g.id} style={{...card({borderRadius:18,padding:20,cursor:"pointer",transition:"all .15s"})}}
            onMouseOver={e=>{e.currentTarget.style.background=C.s2;e.currentTarget.style.borderColor=C.b2;}}
            onMouseOut={e=>{e.currentTarget.style.background=C.s1;e.currentTarget.style.borderColor=C.b1;}}>
            <div style={{fontSize:28,marginBottom:12}}>{g.emoji}</div>
            <p style={{color:C.text,fontSize:14,fontWeight:700,fontFamily:C.sans,marginBottom:3}}>{g.name}</p>
            <p style={{color:C.sub,fontSize:11,fontFamily:C.sans,marginBottom:10}}>{g.members} members · {g.expenses} expenses</p>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <span style={{background:"rgba(255,255,255,.05)",border:`1px solid ${C.b1}`,borderRadius:8,padding:"3px 9px",color:C.dim,fontSize:11,fontFamily:C.mono,letterSpacing:".06em"}}>{g.code.slice(0,4)}-{g.code.slice(4)}</span>
              <Chip color={g.balance>=0?C.green:C.red}>{g.balance>=0?"+":"−"}{fmt(Math.abs(g.balance))}</Chip>
            </div>
            <button onClick={()=>copyCode(g)} style={{width:"100%",background:copied[g.id]?"rgba(0,224,122,.1)":C.gDim,border:`1px solid ${copied[g.id]?"rgba(0,224,122,.4)":"rgba(0,224,122,.2)"}`,color:C.green,borderRadius:10,padding:"9px 0",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:C.sans,transition:"all .2s"}}>
              {copied[g.id]?"✓ Copied!":"📋 Copy Invite Code"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Settle(){
  const [paid,setPaid]=useState({});
  const allSettled=Object.keys(paid).length===OWE.length&&OWE.every(p=>paid[p.id]);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div><h2 style={{color:C.text,fontSize:22,fontWeight:800,fontFamily:C.sans,marginBottom:4}}>Settle Up</h2><p style={{color:C.sub,fontSize:13,fontFamily:C.sans}}>Minimum transactions to clear all debts.</p></div>
      <div style={{background:"rgba(79,142,247,.06)",border:"1px solid rgba(79,142,247,.2)",borderRadius:14,padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:18}}>📱</span>
        <p style={{color:C.sub,fontSize:12,fontFamily:C.sans,lineHeight:1.6}}>
          <strong style={{color:C.text}}>Android</strong>: GPay opens via <code style={{color:C.green,fontSize:11,background:"rgba(0,224,122,.1)",padding:"1px 5px",borderRadius:4}}>tez://upi</code> deep link.
          &nbsp;<strong style={{color:C.text}}>iPhone</strong>: opens any UPI app.
          &nbsp;<strong style={{color:C.text}}>Desktop</strong>: shows UPI ID modal.
        </p>
      </div>

      {allSettled&&<div style={{background:C.gDim,border:"1px solid rgba(0,224,122,.3)",borderRadius:16,padding:"28px 0",textAlign:"center"}}><p style={{fontSize:36,marginBottom:10}}>🎉</p><p style={{color:C.green,fontSize:16,fontWeight:800,fontFamily:C.sans}}>All settled up!</p></div>}

      <div><p style={{color:C.red,fontSize:11,fontWeight:600,letterSpacing:".1em",textTransform:"uppercase",fontFamily:C.sans,marginBottom:10}}>You Owe</p>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {OWE.map(p=>(
            <div key={p.id} style={{...card({borderRadius:16,padding:"16px 20px",background:"rgba(248,113,113,.03)",border:"1px solid rgba(248,113,113,.14)"})}}>
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:paid[p.id]?0:14}}>
                <Av name={p.name} color={p.color} size={44}/>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{color:C.text,fontSize:14,fontWeight:700,fontFamily:C.sans}}>{p.name}</p>
                  <p style={{color:C.sub,fontSize:11,fontFamily:C.sans}}>{p.group} · {p.upi}</p>
                  {p.wallet&&<p style={{color:"rgba(167,139,250,.55)",fontSize:10,fontFamily:C.mono,marginTop:1}}>⬡ {short(p.wallet)}</p>}
                </div>
                <p style={{color:C.red,fontSize:18,fontWeight:800,fontFamily:C.mono,flexShrink:0}}>{fmt(p.amount)}</p>
              </div>
              {paid[p.id]
                ?<div style={{background:C.gDim,border:"1px solid rgba(0,224,122,.25)",borderRadius:10,padding:"9px 0",textAlign:"center"}}><p style={{color:C.green,fontSize:12,fontWeight:700,fontFamily:C.sans}}>✓ Marked as paid</p></div>
                :<div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <GPay upi={p.upi} name={p.name} amount={p.amount}/>
                  <EthPay wallet={p.wallet} name={p.name} amountInr={p.amount}/>
                  <button onClick={()=>setPaid(x=>({...x,[p.id]:true}))} style={{background:C.s2,border:`1px solid ${C.b1}`,color:C.sub,borderRadius:12,padding:"10px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:C.sans}}>Mark Paid</button>
                </div>
              }
            </div>
          ))}
        </div>
      </div>

      <div><p style={{color:C.green,fontSize:11,fontWeight:600,letterSpacing:".1em",textTransform:"uppercase",fontFamily:C.sans,marginBottom:10}}>You're Owed</p>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {OWED.map(p=>(
            <div key={p.id} style={{...card({borderRadius:16,padding:"16px 20px",background:"rgba(0,224,122,.03)",border:"1px solid rgba(0,224,122,.14)"})}}>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <Av name={p.name} color={p.color} size={44}/>
                <div style={{flex:1}}><p style={{color:C.text,fontSize:14,fontWeight:700,fontFamily:C.sans}}>{p.name}</p><p style={{color:C.sub,fontSize:11,fontFamily:C.sans}}>{p.group} · {p.upi}</p></div>
                <p style={{color:C.green,fontSize:18,fontWeight:800,fontFamily:C.mono,marginRight:8}}>+{fmt(p.amount)}</p>
                <button onClick={()=>{try{navigator.clipboard.writeText(p.upi);}catch{}alert("Copied: "+p.upi);}} style={{background:C.gDim,border:"1px solid rgba(0,224,122,.25)",color:C.green,borderRadius:10,padding:"8px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:C.sans,flexShrink:0}}>Copy UPI</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const TABS=[{id:"dash",label:"Dashboard",icon:"◈"},{id:"scanner",label:"Scan Bill",icon:"⬡"},{id:"groups",label:"Groups",icon:"◎"},{id:"settle",label:"Settle Up",icon:"↯"}];

export default function App(){
  const [tab,setTab]=useState("dash");
  const PAGE={dash:Dashboard,scanner:Scanner,groups:Groups,settle:Settle};
  const Page=PAGE[tab];
  return(
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:C.sans}}>
      <link href="https://fonts.googleapis.com/css2?family=VT323&display=swap" rel="stylesheet"/>
      <nav style={{position:"sticky",top:0,zIndex:50,background:"rgba(27,40,56,.92)",backdropFilter:"blur(20px)",borderBottom:`2px solid ${C.b1}`,padding:"0 20px",display:"flex",alignItems:"center",gap:4}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginRight:20,padding:"13px 0",flexShrink:0}}>
          <div style={{width:30,height:30,borderRadius:0,background:`#33FF00`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:900,color:"#1B2838",textShadow:"0 0 5px rgba(51,255,0,0.5)"}}>S</div>
          <span style={{color:C.text,fontSize:16,fontWeight:800,letterSpacing:"0.05em",fontFamily:"'VT323', monospace",textShadow:"0 0 5px rgba(51,255,0,0.3)"}} className="logo-txt">SPLITTR</span>
        </div>
        <div style={{display:"flex",gap:2,flex:1}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{background:tab===t.id?C.gDim:"transparent",border:`1px solid ${tab===t.id?"rgba(0,224,122,.3)":"transparent"}`,color:tab===t.id?C.green:C.sub,borderRadius:10,padding:"8px 14px",fontSize:13,fontWeight:tab===t.id?700:500,cursor:"pointer",fontFamily:C.sans,display:"flex",alignItems:"center",gap:6,transition:"all .15s",whiteSpace:"nowrap"}}>
              <span style={{fontSize:15}}>{t.icon}</span><span className="tab-lbl">{t.label}</span>
            </button>
          ))}
        </div>
        <div style={{width:32,height:32,borderRadius:"50%",background:"rgba(0,224,122,.12)",border:"1px solid rgba(0,224,122,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:C.green,flexShrink:0}}>AS</div>
      </nav>

      <main style={{maxWidth:900,margin:"0 auto",padding:"24px 16px 100px"}}><Page/></main>

      <nav style={{position:"fixed",bottom:0,left:0,right:0,zIndex:50,background:"rgba(5,5,10,.97)",backdropFilter:"blur(20px)",borderTop:`1px solid ${C.b1}`,display:"flex",padding:"8px 0 max(8px,env(safe-area-inset-bottom))"}} className="mob-nav">
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,background:"transparent",border:"none",cursor:"pointer",color:tab===t.id?C.green:C.dim,padding:"4px 0",transition:"color .15s",fontFamily:C.sans}}>
            <span style={{fontSize:20,lineHeight:1}}>{t.icon}</span>
            <span style={{fontSize:9,fontWeight:700,letterSpacing:".04em"}}>{t.label.split(" ")[0].toUpperCase()}</span>
          </button>
        ))}
      </nav>

      <style>{`
        .tab-lbl,.logo-txt{display:inline;}
        @media(max-width:600px){.tab-lbl{display:none!important;} main{padding-bottom:88px;}}
        @media(min-width:601px){.mob-nav{display:none!important;}}
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:4px;}
        body{background:#05050a;}
        select option{background:#1a1a2e;}
      `}</style>
    </div>
  );
}
