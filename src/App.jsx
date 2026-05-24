import React, { useState, useMemo, useCallback, useRef } from "react";

const SUPABASE_URL = "https://autpzeeprcyosyqegtai.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1dHB6ZWVwcmN5b3N5cWVndGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNTEwMDUsImV4cCI6MjA5MjgyNzAwNX0.YWH6PvFYu2n2BN5aWQZ8KaPKv4Ns4K_ObfyK28Gdq18";
const PASSWORD = "0266";
const STAFF = ["あさと", "たけし"];

const api = async (path, method="GET", body=null) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      "apikey":SUPABASE_KEY,
      "Authorization":`Bearer ${SUPABASE_KEY}`,
      "Content-Type":"application/json",
      "Prefer":method==="POST"?"return=representation":"return=minimal",
      "Cache-Control":"no-cache"
    },
    body: body ? JSON.stringify(body) : null,
    cache: "no-store",
  });
  const text = await res.text();
  const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;
  if (!res.ok) throw new Error(typeof data === "string" ? data : (data?.message || `Request failed: ${res.status}`));
  if (method==="GET"||method==="POST") return data ?? [];
  return data ?? res;
};

const uid = () => "x"+Math.random().toString(36).slice(2,9);
const uuid = () => (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
const toKatakana = s => s.replace(/[\u3041-\u3096]/g, c => String.fromCharCode(c.charCodeAt(0)+0x60));
const fmt = (dt, mode="date") => {
  if (!dt) return "";
  const d = new Date(dt);
  if (mode==="date") return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  if (mode==="short") return `${d.getMonth()+1}/${d.getDate()}`;
  if (mode==="full") return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}`;
  return "";
};
const today = () => { const d=new Date(); d.setHours(0,0,0,0); return d; };
const exportCSV = (cats) => {
  const rows = [["カテゴリ","ブランド","商品名","在庫数","注文ライン","定価","仕入れ","在庫定価合計","在庫仕入合計"]];
  cats.forEach(c => c.brands?.forEach(b => b.items?.forEach(i => rows.push([c.name,b.name,i.name,i.stock,i.minStock,i.retailPrice||0,i.costPrice||0,(i.retailPrice||0)*i.stock,(i.costPrice||0)*i.stock]))));
  const blob = new Blob(["\uFEFF"+rows.map(r=>r.map(v=>`"${v}"`).join(",")).join("\n")],{type:"text/csv;charset=utf-8;"});
  const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`在庫_${fmt(new Date())}.csv`; a.click();
};
const normalizeBikes = (bikes) => {
  if (Array.isArray(bikes)) return bikes;
  if (typeof bikes === "string" && bikes.trim()) { try { const p=JSON.parse(bikes); return Array.isArray(p)?p:[]; } catch { return []; } }
  return [];
};
const normalizeJsonArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) { try { const p=JSON.parse(value); return Array.isArray(p)?p:[]; } catch { return []; } }
  return [];
};
const normalizeCustomer = (c) => ({ ...c, bikes: normalizeBikes(c.bikes), notes: normalizeJsonArray(c.notes), customer_rank: c.customer_rank||"通常" });
const normalizeEstimate = (e) => ({ ...e, items: normalizeJsonArray(e.items) });

// ── SVG アイコン ──
const Ico = {
  Home:()=>(<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>),
  Box:()=>(<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27,6.96 12,12.01 20.73,6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>),
  Users:()=>(<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>),
  Kanban:()=>(<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="11" rx="1"/><rect x="17" y="3" width="5" height="14" rx="1"/></svg>),
  Phone:()=>(<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.72 11.5a19.79 19.79 0 01-3.07-8.67A2 2 0 013.65 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.91 9.91a16 16 0 006.18 6.18l.98-.98a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>),
  Plus:()=>(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>),
  Search:()=>(<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>),
  Back:()=>(<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>),
  Edit:()=>(<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>),
  Trash:()=>(<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>),
  X:()=>(<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>),
  Refresh:()=>(<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>),
  Settings:()=>(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>),
  Up:()=>(<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>),
  Down:()=>(<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>),
  Download:()=>(<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>),
  ChevDown:()=>(<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>),
  Chart:()=>(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>),
};

export default function App() {
  const [screen, setScreen] = useState("login");
  const [pwVal, setPwVal] = useState(""); const [pwErr, setPwErr] = useState(false);
  const [mode, setMode] = useState("home");
  const [saving, setSaving] = useState(false);

  // 在庫 state
  const [cats, setCats] = useState([]);
  const [selectedCatId, setSelectedCatId] = useState("all");
  const [mainTab, setMainTab] = useState("stock");
  const [searchOpen, setSearchOpen] = useState(false); const [searchQ, setSearchQ] = useState("");
  const [addMenu, setAddMenu] = useState(false);
  const [stOpen, setStOpen] = useState(false); const [stTab, setStTab] = useState("cats");
  const [stCatId, setStCatId] = useState(null); const [stBrandId, setStBrandId] = useState(null);
  const [itemDetail, setItemDetail] = useState(null); const [detailStock, setDetailStock] = useState(0);
  const [addModal, setAddModal] = useState(null);
  const [editItemModal, setEditItemModal] = useState(null);
  const [editItemF, setEditItemF] = useState({name:"",stock:"",minStock:"",retailPrice:"",costPrice:""});
  const [newCatF, setNewCatF] = useState("");
  const [newBrandF, setNewBrandF] = useState({name:"",catId:""});
  const [newItemF, setNewItemF] = useState({name:"",stock:"",minStock:"",retailPrice:"",costPrice:"",catId:"",brandId:""});
  const [rnCat, setRnCat] = useState(null); const [rnCatV, setRnCatV] = useState("");
  const [rnBrand, setRnBrand] = useState(null); const [rnBrandV, setRnBrandV] = useState("");
  const [rnItem, setRnItem] = useState(null); const [rnItemV, setRnItemV] = useState("");
  const [showSummary, setShowSummary] = useState(false);

  // 顧客 state
  const [customers, setCustomers] = useState([]);
  const [custLoaded, setCustLoaded] = useState(false);
  const [custLoading, setCustLoading] = useState(false);
  const customerRequestNo = useRef(0);
  const [custSearch, setCustSearch] = useState("");
  const [custDetail, setCustDetail] = useState(null);
  const [addCustModal, setAddCustModal] = useState(false);
  const [editCustModal, setEditCustModal] = useState(null);
  const [newCust, setNewCust] = useState({name:"",furigana:"",phone:"",address:"",memo:"",customer_rank:"通常"});
  const [makerMaster, setMakerMaster] = useState([]);
  const [newBikeF, setNewBikeF] = useState({maker:"",color:"",nextMaintenanceDate:""});
  const [addBikeModal, setAddBikeModal] = useState(false);
  const [stCustOpen, setStCustOpen] = useState(false);
  const [newMakerF, setNewMakerF] = useState("");
  const [rnMaker, setRnMaker] = useState(null); const [rnMakerV, setRnMakerV] = useState("");
  const [custRankFilter, setCustRankFilter] = useState("all");

  // 修理メニュー
  const [repairMenus, setRepairMenus] = useState([]);
  const [editMenuOpen, setEditMenuOpen] = useState(false);
  const [newMenuF, setNewMenuF] = useState({name:"",price:"",group1:"",group2:""});
  const [editRepairMenu, setEditRepairMenu] = useState(null);

  // 作業（予約）state
  const [reservations, setReservations] = useState([]);
  const [addResModal, setAddResModal] = useState(false);
  const [resForm, setResForm] = useState({custId:"",bikeIdx:0,checkinDate:"",dueDate:"",dueDateUnknown:false,staff:"あさと",memo:""});
  const [resCustSearch, setResCustSearch] = useState("");
  const [editResModal, setEditResModal] = useState(null);
  const [selectedRes, setSelectedRes] = useState(null);

  // 電話帳 state
  const [phoneFilter, setPhoneFilter] = useState("all");

  // 見積もり state
  const [estimates, setEstimates] = useState([]);
  const [addEstModal, setAddEstModal] = useState(null);
  const [editEstModal, setEditEstModal] = useState(null);
  const [estItems, setEstItems] = useState([]);
  const [estMemo, setEstMemo] = useState("");

  // ── データ取得 ──
  const loadStock = async () => {
    try {
      const [cD,bD,iD] = await Promise.all([api("categories?select=*&order=order.asc"),api("brands?select=*&order=order.asc"),api("items?select=*&order=order.asc")]);
      setCats(cD.map(c=>({...c,brands:bD.filter(b=>b.category_id===c.id).map(b=>({...b,items:iD.filter(i=>i.brand_id===b.id).map(i=>({id:i.id,name:i.name,stock:i.stock,minStock:i.min_stock,retailPrice:i.retail_price,costPrice:i.cost_price,order:i.order})).sort((a,b)=>a.order-b.order)})).sort((a,b)=>a.order-b.order)})));
      loadCustomers({silent:true}).catch(()=>{});
    } catch(e){console.error(e);}
    setScreen("main");
  };

  const loadCustomers = async ({ silent=false } = {}) => {
    const reqNo = ++customerRequestNo.current;
    if (!silent && !custLoaded && customers.length===0) setCustLoading(true);
    try {
      const data = await api("customers?select=*&order=created_at.desc");
      if (!Array.isArray(data)) throw new Error("取得結果が配列ではありません");
      const normalized = data.map(normalizeCustomer);
      if (reqNo === customerRequestNo.current) { setCustomers(normalized); setCustLoaded(true); }
      return normalized;
    } catch(e) {
      console.error(e);
      return customers;
    } finally { if (reqNo===customerRequestNo.current) setCustLoading(false); }
  };

  const loadMasters = async () => {
    try {
      const [menus, makers] = await Promise.all([
        api("repair_menus?select=*&order=name.asc").catch(()=>[]),
        api("maker_master?select=*&order=order.asc").catch(()=>[]),
      ]);
      setRepairMenus(Array.isArray(menus) ? [...menus].sort((a,b)=>a.name.localeCompare(b.name,"ja")) : []);
      setMakerMaster(Array.isArray(makers) ? [...makers].sort((a,b)=>a.name.localeCompare(b.name,"ja")) : []);
    } catch(e){ console.error(e); }
  };

  const loadReservations = async () => {
    try {
      const data = await api("reservations?select=*&order=checkin_date.asc").catch(()=>[]);
      setReservations(data||[]);
    } catch(e){console.error(e);}
  };

  const handleLogin = () => {
    if (pwVal===PASSWORD) { setScreen("loading"); loadStock(); }
    else { setPwErr(true); setPwVal(""); setTimeout(()=>setPwErr(false),2000); }
  };

  const loadEstimates=async()=>{ try { const d=await api("estimates?select=*&order=created_at.desc").catch(()=>[]); setEstimates((d||[]).map(normalizeEstimate)); } catch(e){console.error(e);} };
  const getEstItemName=(it)=>it?.name||repairMenus.find(m=>m.id===it?.menuId)?.name||"";
  const getEstItemPrice=(it)=>Number(it?.price??repairMenus.find(m=>m.id===it?.menuId)?.price??0);
  const cleanEstItems=(items)=>(items||[]).filter(it=>String(getEstItemName(it)||"").trim()||Number(it.price||0)>0).map(it=>({name:String(getEstItemName(it)||"").trim(),price:Number(getEstItemPrice(it)||0),qty:Number(it.qty||1)}));
  const estTotal=useMemo(()=>(estItems||[]).reduce((s,it)=>s+getEstItemPrice(it)*(Number(it.qty)||0),0),[estItems,repairMenus]);
  const doSaveEst=async()=>{ if(!addEstModal) return; const items=cleanEstItems(estItems); const total=items.reduce((s,it)=>s+(Number(it.price||0)*Number(it.qty||0)),0); const id=uid(); const obj={id,customer_id:addEstModal.custId,bike_index:addEstModal.bikeIdx,items,memo:estMemo,total,created_at:new Date().toISOString()}; setSaving(true); try { const saved=await api("estimates","POST",{id,customer_id:addEstModal.custId,bike_index:addEstModal.bikeIdx,items,memo:estMemo,total}); const row=normalizeEstimate(Array.isArray(saved)?(saved[0]||obj):obj); setEstimates(p=>[row,...p]); setAddEstModal(null); } catch(e){console.error(e);alert("見積もりの保存に失敗しました。");} finally{setSaving(false);} };
  const doUpdateEst=async()=>{ if(!editEstModal) return; const items=cleanEstItems(estItems); const total=items.reduce((s,it)=>s+(Number(it.price||0)*Number(it.qty||0)),0); const upd={...editEstModal,items,memo:estMemo,total}; setSaving(true); try { await api(`estimates?id=eq.${upd.id}`,"PATCH",{items,memo:estMemo,total}); setEstimates(p=>p.map(e=>e.id===upd.id?upd:e)); setEditEstModal(null); } catch(e){console.error(e);alert("見積もりの更新に失敗しました。");} finally{setSaving(false);} };
  const delEst=async(id)=>{ if(!window.confirm("削除しますか？")) return; setEstimates(p=>p.filter(e=>e.id!==id)); await api(`estimates?id=eq.${id}`,"DELETE").catch(()=>{}); };
  const custEstimates=(custId,bikeIdx)=>estimates.filter(e=>e.customer_id===custId&&e.bike_index===bikeIdx);

    const switchMode = async (m) => {
    setMode(m);
    if (m==="customers"||m==="phone") { await loadCustomers({silent:custLoaded}); await loadMasters(); }
    if (m==="customers") { loadEstimates(); }
    if (m==="kanban") { await loadReservations(); if(!custLoaded) await loadCustomers({silent:false}); await loadMasters(); }
    if (m==="home") { if(!custLoaded) loadCustomers({silent:false}); loadReservations(); }
  };

  // ── 在庫 派生 ──
  const sortedCats = [...cats].sort((a,b)=>a.order-b.order);
  const displayBrands = useMemo(()=>{
    if (selectedCatId==="all") return sortedCats.flatMap(c=>(c.brands||[]).map(b=>({...b,catName:c.name,catId:c.id})));
    const cat=cats.find(c=>c.id===selectedCatId);
    return (cat?.brands||[]).map(b=>({...b,catName:cat.name,catId:cat.id}));
  },[cats,selectedCatId]);
  const needOrder = useMemo(()=>{ const r=[]; cats.forEach(c=>c.brands?.forEach(b=>b.items?.forEach(i=>{ if(i.stock<=i.minStock) r.push({...i,catName:c.name,brandName:b.name,catId:c.id,brandId:b.id}); }))); return r; },[cats]);
  const stockSearch = useMemo(()=>{ if(!searchQ.trim()) return []; const q=searchQ.toLowerCase(); const r=[]; cats.forEach(c=>c.brands?.forEach(b=>b.items?.forEach(i=>{ if(i.name.toLowerCase().includes(q)) r.push({...i,catName:c.name,brandName:b.name,catId:c.id,brandId:b.id}); }))); return r.slice(0,8); },[searchQ,cats]);
  const summary = useMemo(()=>{ const t={retail:0,cost:0}; const bc={}; cats.forEach(c=>{ let cr=0,cc=0; c.brands?.forEach(b=>b.items?.forEach(i=>{ const r=(i.retailPrice||0)*i.stock,co=(i.costPrice||0)*i.stock; t.retail+=r;t.cost+=co;cr+=r;cc+=co; })); bc[c.id]={name:c.name,retail:cr,cost:cc}; }); return {total:t,byCat:bc}; },[cats]);
  const stCat=cats.find(c=>c.id===stCatId); const sortedStBrands=stCat?[...(stCat.brands||[])].sort((a,b)=>a.order-b.order):[]; const stBrand=stCat?.brands?.find(b=>b.id===stBrandId); const sortedStItems=stBrand?[...(stBrand.items||[])].sort((a,b)=>a.order-b.order):[];
  const updItemLocal=(catId,brandId,itemId,patch)=>setCats(p=>p.map(c=>c.id!==catId?c:{...c,brands:c.brands.map(b=>b.id!==brandId?b:{...b,items:b.items.map(i=>i.id!==itemId?i:{...i,...patch})})}));

  // ── 在庫ハンドラ（旧アプリ流用） ──
  const openDetail=(catId,brandId,item)=>{setItemDetail({catId,brandId,item});setDetailStock(item.stock);};
  const confirmStock=async()=>{ if(!itemDetail) return; const{catId,brandId,item}=itemDetail; updItemLocal(catId,brandId,item.id,{stock:detailStock}); setItemDetail(null); setSaving(true); await api(`items?id=eq.${item.id}`,"PATCH",{stock:detailStock}); setSaving(false); };
  const openEditItem=(catId,brandId,item)=>{ setEditItemModal({catId,brandId,itemId:item.id}); setEditItemF({name:item.name,stock:String(item.stock),minStock:String(item.minStock),retailPrice:String(item.retailPrice||""),costPrice:String(item.costPrice||"")}); };
  const doEditItem=async()=>{ if(!editItemModal||!editItemF.name) return; const patch={name:editItemF.name,stock:+editItemF.stock||0,minStock:+editItemF.minStock||0,retailPrice:+editItemF.retailPrice||0,costPrice:+editItemF.costPrice||0}; updItemLocal(editItemModal.catId,editItemModal.brandId,editItemModal.itemId,patch); const sid=editItemModal.itemId; setEditItemModal(null); setSaving(true); await api(`items?id=eq.${sid}`,"PATCH",{name:patch.name,stock:patch.stock,min_stock:patch.minStock,retail_price:patch.retailPrice,cost_price:patch.costPrice}); setSaving(false); };
  const doAddCat=async()=>{ if(!newCatF.trim()) return; const o=cats.reduce((m,c)=>Math.max(m,c.order),-1); const id=uid(); setCats(p=>[...p,{id,name:newCatF.trim(),order:o+1,brands:[]}]); setNewCatF("");setAddModal(null); setSaving(true); await api("categories","POST",{id,name:newCatF.trim(),order:o+1}); setSaving(false); };
  const doAddBrand=async()=>{ if(!newBrandF.name.trim()||!newBrandF.catId) return; const cat=cats.find(c=>c.id===newBrandF.catId); if(!cat) return; const o=(cat.brands||[]).reduce((m,b)=>Math.max(m,b.order),-1); const id=uid(); setCats(p=>p.map(c=>c.id!==newBrandF.catId?c:{...c,brands:[...(c.brands||[]),{id,category_id:newBrandF.catId,name:newBrandF.name.trim(),order:o+1,items:[]}]})); setNewBrandF({name:"",catId:""});setAddModal(null); setSaving(true); await api("brands","POST",{id,category_id:newBrandF.catId,name:newBrandF.name.trim(),order:o+1}); setSaving(false); };
  const doAddItem=async()=>{ if(!newItemF.name||newItemF.stock===""||newItemF.minStock===""||!newItemF.catId||!newItemF.brandId) return; const cat=cats.find(c=>c.id===newItemF.catId); const brand=cat?.brands?.find(b=>b.id===newItemF.brandId); if(!brand) return; const o=(brand.items||[]).reduce((m,i)=>Math.max(m,i.order),-1); const id=uid(); const ni={id,name:newItemF.name,stock:+newItemF.stock||0,minStock:+newItemF.minStock||0,retailPrice:+newItemF.retailPrice||0,costPrice:+newItemF.costPrice||0,order:o+1}; setCats(p=>p.map(c=>c.id!==newItemF.catId?c:{...c,brands:c.brands.map(b=>b.id!==newItemF.brandId?b:{...b,items:[...(b.items||[]),ni]})})); setNewItemF({name:"",stock:"",minStock:"",retailPrice:"",costPrice:"",catId:"",brandId:""});setAddModal(null); setSaving(true); await api("items","POST",{id,brand_id:newItemF.brandId,category_id:newItemF.catId,name:ni.name,stock:ni.stock,min_stock:ni.minStock,retail_price:ni.retailPrice,cost_price:ni.costPrice,order:ni.order}); setSaving(false); };
  const moveCat=async(catId,dir)=>{ const s=[...cats].sort((a,b)=>a.order-b.order); const idx=s.findIndex(c=>c.id===catId); const sw=idx+dir; if(sw<0||sw>=s.length) return; const a=s.map(c=>({...c})); const tmp=a[idx].order; a[idx].order=a[sw].order; a[sw].order=tmp; setCats(a); setSaving(true); await Promise.all([api(`categories?id=eq.${a[idx].id}`,"PATCH",{order:a[idx].order}),api(`categories?id=eq.${a[sw].id}`,"PATCH",{order:a[sw].order})]); setSaving(false); };
  const moveBrand=async(catId,brandId,dir)=>{ const cat=cats.find(c=>c.id===catId); if(!cat) return; const s=[...(cat.brands||[])].sort((a,b)=>a.order-b.order); const idx=s.findIndex(b=>b.id===brandId); const sw=idx+dir; if(sw<0||sw>=s.length) return; const a=s.map(b=>({...b})); const tmp=a[idx].order; a[idx].order=a[sw].order; a[sw].order=tmp; setCats(p=>p.map(c=>c.id!==catId?c:{...c,brands:a})); setSaving(true); await Promise.all([api(`brands?id=eq.${a[idx].id}`,"PATCH",{order:a[idx].order}),api(`brands?id=eq.${a[sw].id}`,"PATCH",{order:a[sw].order})]); setSaving(false); };
  const moveItem=async(catId,brandId,itemId,dir)=>{ const cat=cats.find(c=>c.id===catId); if(!cat) return; const brand=cat.brands?.find(b=>b.id===brandId); if(!brand) return; const s=[...(brand.items||[])].sort((a,b)=>a.order-b.order); const idx=s.findIndex(i=>i.id===itemId); const sw=idx+dir; if(sw<0||sw>=s.length) return; const a=s.map(i=>({...i})); const tmp=a[idx].order; a[idx].order=a[sw].order; a[sw].order=tmp; setCats(p=>p.map(c=>c.id!==catId?c:{...c,brands:c.brands.map(b=>b.id!==brandId?b:{...b,items:a})})); setSaving(true); await Promise.all([api(`items?id=eq.${a[idx].id}`,"PATCH",{order:a[idx].order}),api(`items?id=eq.${a[sw].id}`,"PATCH",{order:a[sw].order})]); setSaving(false); };
  const delCat=async(catId)=>{ if(!window.confirm("削除しますか？")) return; setCats(p=>p.filter(c=>c.id!==catId)); if(stCatId===catId){setStCatId(null);setStBrandId(null);} setSaving(true); await api(`categories?id=eq.${catId}`,"DELETE"); setSaving(false); };
  const delBrand=async(catId,brandId)=>{ if(!window.confirm("削除しますか？")) return; setCats(p=>p.map(c=>c.id!==catId?c:{...c,brands:c.brands.filter(b=>b.id!==brandId)})); if(stBrandId===brandId) setStBrandId(null); setSaving(true); await api(`brands?id=eq.${brandId}`,"DELETE"); setSaving(false); };
  const delItem=async(catId,brandId,itemId)=>{ if(!window.confirm("削除しますか？")) return; setCats(p=>p.map(c=>c.id!==catId?c:{...c,brands:c.brands.map(b=>b.id!==brandId?b:{...b,items:b.items.filter(i=>i.id!==itemId)})})); setSaving(true); await api(`items?id=eq.${itemId}`,"DELETE"); setSaving(false); };
  const commitRnCat=async(catId)=>{ if(!rnCatV.trim()){setRnCat(null);return;} setCats(p=>p.map(c=>c.id===catId?{...c,name:rnCatV.trim()}:c)); setRnCat(null); setSaving(true); await api(`categories?id=eq.${catId}`,"PATCH",{name:rnCatV.trim()}); setSaving(false); };
  const commitRnBrand=async(catId,brandId)=>{ if(!rnBrandV.trim()){setRnBrand(null);return;} setCats(p=>p.map(c=>c.id!==catId?c:{...c,brands:c.brands.map(b=>b.id===brandId?{...b,name:rnBrandV.trim()}:b)})); setRnBrand(null); setSaving(true); await api(`brands?id=eq.${brandId}`,"PATCH",{name:rnBrandV.trim()}); setSaving(false); };
  const commitRnItem=async(catId,brandId,itemId)=>{ if(!rnItemV.trim()){setRnItem(null);return;} updItemLocal(catId,brandId,itemId,{name:rnItemV.trim()}); setRnItem(null); setSaving(true); await api(`items?id=eq.${itemId}`,"PATCH",{name:rnItemV.trim()}); setSaving(false); };

  // ── 顧客ハンドラ ──
  const doAddCust=async()=>{
    const name=newCust.name.trim(); if(!name) return;
    const furi=toKatakana(newCust.furigana||"");
    const payload={id:uuid(),name,furigana:furi||null,phone:newCust.phone||null,address:newCust.address||null,memo:newCust.memo||null,customer_rank:newCust.customer_rank||"通常",bikes:[]};
    setSaving(true);
    try {
      const saved=await api("customers","POST",payload);
      const row=normalizeCustomer(Array.isArray(saved)?(saved[0]||{...payload,created_at:new Date().toISOString()}):{...payload,created_at:new Date().toISOString()});
      setCustomers(p=>[row,...p.filter(c=>c.id!==row.id)]);
      setNewCust({name:"",furigana:"",phone:"",address:"",memo:"",customer_rank:"通常"});
      setAddCustModal(false);
      await loadCustomers({silent:true});
    } catch(e){ console.error(e); alert("顧客の保存に失敗しました。"); }
    finally { setSaving(false); }
  };
  const doEditCust=async()=>{
    if(!editCustModal||!editCustModal.name.trim()) return;
    const furi=toKatakana(editCustModal.furigana||"");
    const upd={...editCustModal,furigana:furi};
    setSaving(true);
    try {
      await api(`customers?id=eq.${upd.id}`,"PATCH",{name:upd.name,furigana:furi||null,phone:upd.phone||null,address:upd.address||null,memo:upd.memo||null,customer_rank:upd.customer_rank||"通常",bikes:upd.bikes||[]});
      setCustomers(p=>p.map(c=>c.id===upd.id?{...c,...upd}:c));
      if(custDetail?.id===upd.id) setCustDetail(prev=>({...prev,...upd}));
      setEditCustModal(null);
      await loadCustomers({silent:true});
    } catch(e){ console.error(e); alert("顧客情報の保存に失敗しました。"); }
    finally { setSaving(false); }
  };
  const delCust=async(id)=>{
    if(!window.confirm("削除しますか？")) return;
    setSaving(true);
    try { await api(`customers?id=eq.${id}`,"DELETE"); setCustomers(p=>p.filter(c=>c.id!==id)); setCustDetail(null); }
    catch(e){ console.error(e); alert("削除に失敗しました。"); }
    finally { setSaving(false); }
  };
  const addBike=async()=>{
    if(!newBikeF.maker.trim()||!custDetail) return;
    const bikes=[...(custDetail.bikes||[]),{maker:newBikeF.maker,color:newBikeF.color,nextMaintenanceDate:newBikeF.nextMaintenanceDate||null}];
    setSaving(true);
    try { await api(`customers?id=eq.${custDetail.id}`,"PATCH",{bikes}); setCustDetail(p=>({...p,bikes})); setCustomers(p=>p.map(c=>c.id===custDetail.id?{...c,bikes}:c)); setNewBikeF({maker:"",color:"",nextMaintenanceDate:""}); setAddBikeModal(false); }
    catch(e){ console.error(e); alert("自転車情報の保存に失敗しました。"); }
    finally { setSaving(false); }
  };
  const delBike=async(idx)=>{
    if(!window.confirm("削除しますか？")||!custDetail) return;
    const bikes=(custDetail.bikes||[]).filter((_,i)=>i!==idx);
    setSaving(true);
    try { await api(`customers?id=eq.${custDetail.id}`,"PATCH",{bikes}); setCustDetail(p=>({...p,bikes})); setCustomers(p=>p.map(c=>c.id===custDetail.id?{...c,bikes}:c)); }
    catch(e){ console.error(e); }
    finally { setSaving(false); }
  };
  const updateBikeMaintenance=async(idx,date)=>{
    if(!custDetail) return;
    const bikes=(custDetail.bikes||[]).map((b,i)=>i===idx?{...b,nextMaintenanceDate:date||null}:b);
    setCustDetail(p=>({...p,bikes})); setCustomers(p=>p.map(c=>c.id===custDetail.id?{...c,bikes}:c));
    setSaving(true);
    try { await api(`customers?id=eq.${custDetail.id}`,"PATCH",{bikes}); }
    catch(e){ console.error(e); }
    finally { setSaving(false); }
  };
  const doAddMaker=async()=>{
    const name=newMakerF.trim(); if(!name) return;
    const o=(makerMaster||[]).reduce((m,x)=>Math.max(m,x.order??0),-1)+1;
    const id=uid();
    setSaving(true);
    try { const saved=await api("maker_master","POST",{id,name,order:o}); const row=Array.isArray(saved)?(saved[0]||{id,name,order:o}):{id,name,order:o}; setMakerMaster(p=>[...p,row].sort((a,b)=>(a.order??0)-(b.order??0))); setNewMakerF(""); }
    catch(e){ console.error(e); }
    finally { setSaving(false); }
  };
  const commitRnMaker=async(id)=>{ const name=rnMakerV.trim(); if(!name){setRnMaker(null);return;} setSaving(true); try { await api(`maker_master?id=eq.${id}`,"PATCH",{name}); setMakerMaster(p=>p.map(m=>m.id===id?{...m,name}:m)); setRnMaker(null); } catch(e){console.error(e);} finally{setSaving(false);} };
  const delMaker=async(id)=>{ if(!window.confirm("削除しますか？")) return; setSaving(true); try { await api(`maker_master?id=eq.${id}`,"DELETE"); setMakerMaster(p=>p.filter(m=>m.id!==id)); } catch(e){console.error(e);} finally{setSaving(false);} };
  const doAddMenu=async()=>{ const name=newMenuF.name.trim(); if(!name) return; const price=+newMenuF.price||0; const id=uid(); setSaving(true); try { const saved=await api("repair_menus","POST",{id,name,price,order:(repairMenus||[]).length,group1:newMenuF.group1||"",group2:newMenuF.group2||""}); const row=Array.isArray(saved)?(saved[0]||{id,name,price}):{id,name,price}; setRepairMenus(p=>[...p,row].sort((a,b)=>a.name.localeCompare(b.name,"ja"))); setNewMenuF({name:"",price:"",group1:"",group2:""}); } catch(e){console.error(e);} finally{setSaving(false);} };
  const delMenu=async(id)=>{ if(!window.confirm("削除しますか？")) return; setSaving(true); try { await api(`repair_menus?id=eq.${id}`,"DELETE"); setRepairMenus(p=>p.filter(m=>m.id!==id)); } catch(e){console.error(e);} finally{setSaving(false);} };
  const doEditMenu=async()=>{ if(!editRepairMenu) return; const{id,name,price,group1,group2}=editRepairMenu; if(!name.trim()) return; setSaving(true); try { await api(`repair_menus?id=eq.${id}`,"PATCH",{name:name.trim(),price:+price||0,group1:(group1||"").trim(),group2:(group2||"").trim()}); setRepairMenus(p=>p.map(m=>m.id===id?{...m,name:name.trim(),price:+price||0}:m).sort((a,b)=>a.name.localeCompare(b.name,"ja"))); setEditRepairMenu(null); } catch(e){console.error(e);} finally{setSaving(false);} };

  // ── 作業ハンドラ ──
  const doAddRes=async()=>{
    if(!resForm.checkinDate) return;
    const id=uid();
    setSaving(true);
    try {
      await api("reservations","POST",{id,customer_id:resForm.custId||null,bike_index:resForm.bikeIdx,checkin_date:resForm.checkinDate,due_date:resForm.dueDateUnknown?null:resForm.dueDate||null,staff:resForm.staff,memo:resForm.memo||null,status:"reserved"});
      await loadReservations();
      setAddResModal(false);
      setResForm({custId:"",bikeIdx:0,checkinDate:"",dueDate:"",dueDateUnknown:false,staff:"あさと",memo:""});
      setResCustSearch("");
    } catch(e){ console.error(e); alert("作業の保存に失敗しました。"); }
    finally { setSaving(false); }
  };
  const doEditRes=async()=>{
    if(!editResModal) return;
    const upd={...editResModal,due_date:editResModal.dueDateUnknown?null:editResModal.due_date||null};
    setReservations(p=>p.map(r=>r.id===upd.id?upd:r));
    setEditResModal(null);
    await api(`reservations?id=eq.${upd.id}`,"PATCH",{checkin_date:upd.checkin_date,due_date:upd.due_date,staff:upd.staff,memo:upd.memo||null}).catch(()=>{});
  };
  const updateResStatus=async(id,status)=>{
    setReservations(p=>p.map(r=>r.id===id?{...r,status}:r));
    setSelectedRes(null);
    await api(`reservations?id=eq.${id}`,"PATCH",{status}).catch(()=>{});
  };
  const delRes=async(id)=>{ if(!window.confirm("削除しますか？")) return; setReservations(p=>p.filter(r=>r.id!==id)); setSelectedRes(null); await api(`reservations?id=eq.${id}`,"DELETE").catch(()=>{}); };

  // ── 顧客検索 ──
  const searchCustomerMatch=(c,raw)=>{ const terms=raw.trim().toLowerCase().split(/\s+/).filter(Boolean); if(!terms.length) return true; const phone=(c.phone||"").replace(/[-\s]/g,""); const hay=[c.name||"",c.furigana||"",phone,(c.bikes||[]).map(b=>`${b.maker||""} ${b.color||""}`).join(" ")].join(" ").toLowerCase(); return terms.every(t=>{ const nt=t.replace(/[-\s]/g,""); return hay.includes(t)||(nt&&phone.includes(nt)); }); };
  const resCusts=useMemo(()=>customers.filter(c=>searchCustomerMatch(c,resCustSearch)).slice(0,8),[resCustSearch,customers]);
  const selectedResCust=customers.find(c=>c.id===resForm.custId);

  // ── メンテ期限チェック ──
  const mainteExpired=useMemo(()=>customers.filter(c=>(c.bikes||[]).some(b=>b.nextMaintenanceDate&&new Date(b.nextMaintenanceDate)<today())),[customers]);
  const mainteThisMonth=useMemo(()=>{ const t=today(); const lim=new Date(t); lim.setMonth(lim.getMonth()+1); return customers.filter(c=>(c.bikes||[]).some(b=>{ if(!b.nextMaintenanceDate) return false; const d=new Date(b.nextMaintenanceDate); return d>=t&&d<=lim; })); },[customers]);

  // ── 顧客フィルター ──
  const filteredCustomers=useMemo(()=>{
    let list=customers;
    if(custRankFilter==="expired") list=mainteExpired;
    else if(custRankFilter==="month") list=mainteThisMonth;
    else if(custRankFilter!=="all") list=customers.filter(c=>c.customer_rank===custRankFilter);
    if(custSearch.trim()) list=list.filter(c=>searchCustomerMatch(c,custSearch));
    return list;
  },[customers,custSearch,custRankFilter,mainteExpired,mainteThisMonth]);

  // ── ログイン画面 ──
  if (screen==="login") return (
    <div style={{background:"#faf8f4",minHeight:"100dvh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <style>{CSS}</style>
      <div style={{fontFamily:"'Shippori Mincho',serif",fontWeight:700,fontSize:26,color:"#2a2018",marginBottom:6,letterSpacing:"0.02em"}}>ウエハラ<span style={{color:"#c0724a"}}>サイクル</span></div>
      <div style={{fontSize:11,color:"#9a9088",letterSpacing:".14em",textTransform:"uppercase",marginBottom:40}}>Management System</div>
      <input type="password" value={pwVal} onChange={e=>setPwVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="パスワード" style={{width:"100%",maxWidth:280,background:pwErr?"#fae8e8":"#f3f0ea",border:`1.5px solid ${pwErr?"#c0392b":"#e0d9ce"}`,borderRadius:12,padding:"14px 18px",color:"#2a2018",fontFamily:"'Noto Sans JP',sans-serif",fontSize:16,outline:"none",textAlign:"center",letterSpacing:"0.2em",marginBottom:10}} autoFocus/>
      {pwErr&&<div style={{fontSize:12,color:"#c0392b",marginBottom:10}}>パスワードが違います</div>}
      <button onClick={handleLogin} style={{width:"100%",maxWidth:280,background:"#2a2018",color:"#faf8f4",border:"none",borderRadius:12,padding:"14px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"'Noto Sans JP',sans-serif"}}>ログイン</button>
    </div>
  );

  if (screen==="loading") return (
    <div style={{background:"#faf8f4",minHeight:"100dvh",display:"flex",alignItems:"center",justifyContent:"center",gap:14,flexDirection:"column"}}>
      <style>{CSS}</style>
      <div className="spin"/><p style={{color:"#9a9088",fontSize:14,fontFamily:"'Noto Sans JP',sans-serif"}}>読み込み中...</p>
    </div>
  );

  // ── 共通コンポーネント ──
  const BottomNav=()=>(
    <nav style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:500,background:"#fff",borderTop:"1px solid rgba(42,32,24,.1)",display:"flex",alignItems:"stretch",zIndex:500,paddingBottom:"env(safe-area-inset-bottom,0px)",boxShadow:"0 -2px 12px rgba(42,32,24,.07)"}}>
      {[
        {id:"home",icon:<Ico.Home/>,label:"ホーム"},
        {id:"stock",icon:<Ico.Box/>,label:"在庫"},
        {id:"customers",icon:<Ico.Users/>,label:"顧客"},
        {id:"kanban",icon:<Ico.Kanban/>,label:"作業"},
        {id:"phone",icon:<Ico.Phone/>,label:"電話帳"},
      ].map(t=>(
        <button key={t.id} onClick={()=>switchMode(t.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,padding:"9px 2px 8px",cursor:"pointer",border:"none",background:"none",color:mode===t.id?"#c0724a":"#9a9088",fontSize:9,fontFamily:"'Noto Sans JP',sans-serif",fontWeight:700,letterSpacing:"0.04em",transition:"color .15s",position:"relative"}}>
          {t.icon}
          {t.label}
          {t.id==="kanban"&&reservations.filter(r=>r.status==="in").length>0&&<span style={{position:"absolute",top:6,right:"calc(50% - 14px)",width:7,height:7,background:"#c0724a",borderRadius:"50%",border:"1.5px solid #fff"}}/>}
        </button>
      ))}
    </nav>
  );

  const PageWrap=({children})=>(<div style={{background:"#faf8f4",minHeight:"100dvh",paddingBottom:72}}><style>{CSS}</style>{children}<BottomNav/></div>);

  const EstModal=({open,onClose,onSave,title})=>(
    <Modal open={open} onClose={onClose} title={title||"見積もり"}>
      {(addEstModal||editEstModal)&&(()=>{
        const custId=addEstModal?.custId||editEstModal?.customer_id;
        const bikeIdx=addEstModal?.bikeIdx??editEstModal?.bike_index??0;
        const c=customers.find(x=>x.id===custId);
        const b=c?.bikes?.[bikeIdx];
        return c?(<div style={{background:"#faf8f4",borderRadius:10,padding:"10px 14px",marginBottom:14}}><div style={{fontWeight:700,fontSize:14,color:"#2a2018"}}>{c.name}</div>{b&&<div style={{fontSize:12,color:"#9a9088",marginTop:2}}>🚲 {b.maker}{b.color?` (${b.color})`:""}</div>}</div>):null;
      })()}
      <div style={{marginBottom:10}}>
        {(estItems||[]).map((it,idx)=>(
          <div key={idx} style={{display:"grid",gridTemplateColumns:"1fr 70px 60px 30px",gap:6,alignItems:"center",marginBottom:7}}>
            <select value={it.menuId||""} onChange={e=>{ const m=repairMenus.find(x=>x.id===e.target.value); setEstItems(p=>p.map((x,i)=>i===idx?{...x,menuId:e.target.value,name:m?.name||"",price:m?.price||x.price}:x)); }} style={{background:"#f3f0ea",border:"1px solid rgba(42,32,24,.1)",borderRadius:8,padding:"8px 9px",fontSize:13,color:"#2a2018",fontFamily:"'Noto Sans JP',sans-serif",outline:"none"}}><option value="">メニュー選択</option>{repairMenus.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select>
            <input type="number" value={it.price||""} onChange={e=>setEstItems(p=>p.map((x,i)=>i===idx?{...x,price:e.target.value}:x))} placeholder="金額" style={{background:"#f3f0ea",border:"1px solid rgba(42,32,24,.1)",borderRadius:8,padding:"8px 6px",fontSize:13,color:"#2a2018",textAlign:"right",outline:"none",fontFamily:"'DM Mono',monospace"}}/>
            <input type="number" value={it.qty||1} onChange={e=>setEstItems(p=>p.map((x,i)=>i===idx?{...x,qty:+e.target.value}:x))} min={1} style={{background:"#f3f0ea",border:"1px solid rgba(42,32,24,.1)",borderRadius:8,padding:"8px 6px",fontSize:13,color:"#2a2018",textAlign:"center",outline:"none"}}/>
            <button onClick={()=>setEstItems(p=>p.filter((_,i)=>i!==idx))} style={{background:"none",border:"none",cursor:"pointer",color:"#c8bfb0",display:"flex",alignItems:"center",justifyContent:"center"}}><Ico.Trash/></button>
          </div>
        ))}
        <button onClick={()=>setEstItems(p=>[...(p||[]),{menuId:"",name:"",price:"",qty:1}])} style={{width:"100%",background:"#f3f0ea",border:"1px dashed rgba(42,32,24,.15)",borderRadius:9,padding:"9px",fontSize:13,color:"#7a7060",cursor:"pointer",fontFamily:"'Noto Sans JP',sans-serif",fontWeight:600}}>＋ 行を追加</button>
      </div>
      <div style={{textAlign:"right",fontFamily:"'DM Mono',monospace",fontSize:18,fontWeight:500,color:"#2a2018",marginBottom:12}}>合計 ¥{estTotal.toLocaleString()}</div>
      <FG label="メモ"><Textarea value={estMemo} onChange={setEstMemo} placeholder="作業メモ・備考" rows={3}/></FG>
      <div style={{display:"flex",gap:8,marginTop:4}}>
        <Btn onClick={onClose} variant="outline" style={{flex:1}}>キャンセル</Btn>
        <Btn onClick={onSave} variant="primary" style={{flex:2}}>💾 保存する</Btn>
      </div>
    </Modal>
  );



  const SearchBar=({value,onChange,placeholder})=>(
    <div style={{padding:"0 18px 14px"}}>
      <div style={{background:"#fff",border:"1.5px solid rgba(42,32,24,.1)",borderRadius:40,padding:"10px 16px",display:"flex",alignItems:"center",gap:8,boxShadow:"0 1px 6px rgba(42,32,24,.05)"}}>
        <Ico.Search/>
        <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||"検索…"} style={{flex:1,background:"none",border:"none",outline:"none",fontSize:14,color:"#2a2018",fontFamily:"'Noto Sans JP',sans-serif"}}/>
        {value&&<button onClick={()=>onChange("")} style={{background:"none",border:"none",cursor:"pointer",color:"#9a9088",display:"flex"}}><Ico.X/></button>}
      </div>
    </div>
  );

  const PageHeader=({title,sub,right})=>(
    <div style={{padding:"18px 18px 14px",display:"flex",alignItems:"flex-end",justifyContent:"space-between"}}>
      <div>
        <div style={{fontFamily:"'Shippori Mincho',serif",fontSize:22,fontWeight:700,color:"#2a2018",letterSpacing:"0.02em"}}>{title}</div>
        {sub&&<div style={{fontSize:12,color:"#9a9088",marginTop:3}}>{sub}</div>}
      </div>
      {right&&<div>{right}</div>}
    </div>
  );

  const Tag=({children,color="gray"})=>{
    const styles={gray:{bg:"#f0ece4",c:"#7a7060"},green:{bg:"#e6f2ec",c:"#3d7a56"},amber:{bg:"#fdf2d8",c:"#a06c10"},red:{bg:"#fae8e8",c:"#a83030"},blue:{bg:"#e4eef8",c:"#2e5f90"},accent:{bg:"#fdf0e8",c:"#c0724a"},purple:{bg:"#f0ecfa",c:"#6650a0"}};
    const s=styles[color]||styles.gray;
    return <span style={{display:"inline-flex",alignItems:"center",padding:"3px 9px",borderRadius:20,fontSize:11,fontWeight:700,background:s.bg,color:s.c}}>{children}</span>;
  };

  const Btn=({onClick,children,variant="primary",size="md",style:sx={}})=>{
    const base={display:"inline-flex",alignItems:"center",gap:5,border:"none",cursor:"pointer",fontFamily:"'Noto Sans JP',sans-serif",fontWeight:700,borderRadius:40,transition:"all .15s",...sx};
    const sizes={sm:{padding:"7px 13px",fontSize:12},md:{padding:"10px 18px",fontSize:13}};
    const variants={primary:{background:"#c0724a",color:"#fff"},outline:{background:"#fff",color:"#4a4038",border:"1.5px solid rgba(42,32,24,.12)"},dark:{background:"#2a2018",color:"#faf8f4"},green:{background:"#e6f2ec",color:"#3d7a56",border:"1.5px solid rgba(61,122,86,.2)"}};
    return <button onClick={onClick} style={{...base,...sizes[size],...variants[variant]||{}}}>{children}</button>;
  };

  // ── モーダル共通 ──
  const Modal=({open,onClose,title,children})=>{
    if(!open) return null;
    return (
      <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(42,32,24,.45)",zIndex:1000,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
        <div style={{background:"#fff",borderRadius:"16px 16px 0 0",width:"100%",maxWidth:500,maxHeight:"88dvh",overflowY:"auto",paddingBottom:"env(safe-area-inset-bottom,16px)",animation:"su .22s ease"}}>
          <div style={{width:36,height:4,background:"#e0d8d0",borderRadius:2,margin:"12px auto 0"}}/>
          <div style={{padding:"16px 18px 14px",borderBottom:"1px solid rgba(42,32,24,.06)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontFamily:"'Shippori Mincho',serif",fontSize:16,fontWeight:700,color:"#2a2018"}}>{title}</div>
            <button onClick={onClose} style={{width:30,height:30,borderRadius:"50%",background:"#f0ece4",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#7a7060"}}><Ico.X/></button>
          </div>
          <div style={{padding:18}}>{children}</div>
        </div>
      </div>
    );
  };

  const FG=({label,children})=>(<div style={{marginBottom:14}}><label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"#9a9088",marginBottom:7}}>{label}</label>{children}</div>);
  const Input=({value,onChange,placeholder,type="text",style:sx={}})=>(<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{width:"100%",padding:"12px 14px",background:"#f3f0ea",border:"1.5px solid rgba(42,32,24,.1)",borderRadius:9,fontSize:14,color:"#2a2018",fontFamily:"'Noto Sans JP',sans-serif",outline:"none",...sx}}/>);
  const Select=({value,onChange,children})=>(<select value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",padding:"12px 14px",background:"#f3f0ea",border:"1.5px solid rgba(42,32,24,.1)",borderRadius:9,fontSize:14,color:"#2a2018",fontFamily:"'Noto Sans JP',sans-serif",outline:"none",WebkitAppearance:"none"}}>{children}</select>);
  const Textarea=({value,onChange,placeholder,rows=4})=>(<textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{width:"100%",padding:"12px 14px",background:"#f3f0ea",border:"1.5px solid rgba(42,32,24,.1)",borderRadius:9,fontSize:14,color:"#2a2018",fontFamily:"'Noto Sans JP',sans-serif",outline:"none",resize:"vertical"}}/>);


  // ════════════════════════════════════════
  // HOME 画面
  // ════════════════════════════════════════
  if (mode==="home") {
    const totalStock=cats.reduce((s,c)=>s+c.brands.reduce((s2,b)=>s2+b.items.reduce((s3,i)=>s3+i.stock,0),0),0);
    const critStock=cats.reduce((acc,c)=>[...acc,...c.brands.reduce((a2,b)=>[...a2,...b.items.filter(i=>i.stock===0).map(i=>({...i,brandName:b.name}))],[])],[]);
    const lowStock=cats.reduce((acc,c)=>[...acc,...c.brands.reduce((a2,b)=>[...a2,...b.items.filter(i=>i.stock>0&&i.stock<=i.minStock).map(i=>({...i,brandName:b.name}))],[])],[]);
    const inShop=reservations.filter(r=>r.status==="in");
    const todayStr=fmt(today());
    const todayRes=reservations.filter(r=>r.status==="reserved"&&r.checkin_date===todayStr);

    return (
      <PageWrap>
        <div style={{padding:"20px 18px 14px"}}>
          <div style={{fontFamily:"'Shippori Mincho',serif",fontWeight:700,fontSize:24,color:"#2a2018",marginBottom:2}}>ウエハラ<span style={{color:"#c0724a"}}>サイクル</span></div>
          <div style={{fontSize:12,color:"#9a9088"}}>{new Date().getFullYear()}年{new Date().getMonth()+1}月{new Date().getDate()}日</div>
        </div>

        {/* KPI */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,padding:"0 18px",marginBottom:16}}>
          {[
            {label:"在庫台数",val:totalStock,unit:"点",color:"#c0724a",alert:critStock.length>0?`欠品 ${critStock.length}点`:lowStock.length>0?`残少 ${lowStock.length}点`:"問題なし",alertColor:critStock.length>0?"#a83030":lowStock.length>0?"#a06c10":"#3d7a56"},
            {label:"入庫中",val:inShop.length,unit:"台",color:"#3d7a56",alert:"作業対応中",alertColor:"#3d7a56"},
            {label:"今日の予約",val:todayRes.length,unit:"件",color:"#2e5f90",alert:"入庫予定",alertColor:"#2e5f90"},
            {label:"メンテ期限切れ",val:mainteExpired.length,unit:"名",color:"#a06c10",alert:"要電話",alertColor:"#a83030"},
          ].map((s,i)=>(
            <div key={i} style={{background:"#fff",borderRadius:14,border:"1px solid rgba(42,32,24,.09)",padding:"14px 14px 12px",boxShadow:"0 1px 8px rgba(42,32,24,.06)",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",bottom:0,left:0,right:0,height:3,background:s.color,borderRadius:"0 0 14px 14px"}}/>
              <div style={{fontSize:11,color:"#9a9088",fontWeight:600,marginBottom:6}}>{s.label}</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:26,fontWeight:500,color:"#2a2018",lineHeight:1}}>{s.val}<span style={{fontSize:12,color:"#9a9088",fontFamily:"'Noto Sans JP',sans-serif",fontWeight:500,marginLeft:2}}>{s.unit}</span></div>
              <div style={{fontSize:10,marginTop:5,color:s.alertColor,fontWeight:700}}>{s.alert}</div>
            </div>
          ))}
        </div>

        {/* 今日の予約 */}
        {todayRes.length>0&&(
          <div style={{padding:"0 18px",marginBottom:14}}>
            <div style={{background:"#fff",borderRadius:14,border:"1px solid rgba(42,32,24,.09)",overflow:"hidden",boxShadow:"0 1px 8px rgba(42,32,24,.06)"}}>
              <div style={{padding:"12px 16px 11px",borderBottom:"1px solid rgba(42,32,24,.06)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{fontFamily:"'Shippori Mincho',serif",fontWeight:700,fontSize:14,color:"#2a2018"}}>📅 今日の入庫予定</div>
                <Btn onClick={()=>switchMode("kanban")} variant="outline" size="sm">作業管理へ</Btn>
              </div>
              {todayRes.map(r=>{ const c=customers.find(x=>x.id===r.customer_id); const b=c?.bikes?.[r.bike_index||0]; return (
                <div key={r.id} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",borderBottom:"1px solid rgba(42,32,24,.05)"}}>
                  <div style={{width:38,height:38,borderRadius:"50%",background:"#f0ece4",color:"#7a7060",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Shippori Mincho',serif",fontWeight:700,fontSize:15,flexShrink:0}}>{(c?.name||"?")[0]}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:700,color:"#2a2018"}}>{c?.name||"未設定"}</div>
                    <div style={{fontSize:11,color:"#9a9088",marginTop:1}}>{b?`🚲 ${b.maker}`:""}{r.staff?` ／ ${r.staff}`:""}</div>
                  </div>
                  <Tag color="blue">{r.staff||""}</Tag>
                </div>
              );})}
            </div>
          </div>
        )}

        {/* 在庫アラート */}
        {(critStock.length>0||lowStock.length>0)&&(
          <div style={{padding:"0 18px",marginBottom:14}}>
            <div style={{background:"#fff",borderRadius:14,border:"1px solid rgba(42,32,24,.09)",overflow:"hidden",boxShadow:"0 1px 8px rgba(42,32,24,.06)"}}>
              <div style={{padding:"12px 16px 11px",borderBottom:"1px solid rgba(42,32,24,.06)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{fontFamily:"'Shippori Mincho',serif",fontWeight:700,fontSize:14,color:"#2a2018"}}>📦 在庫アラート</div>
                <Btn onClick={()=>switchMode("stock")} variant="outline" size="sm">在庫へ</Btn>
              </div>
              {critStock.slice(0,3).map(i=>(
                <div key={i.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",borderBottom:"1px solid rgba(42,32,24,.05)"}}>
                  <span style={{width:8,height:8,borderRadius:"50%",background:"#c0392b",flexShrink:0}}/>
                  <div style={{flex:1,fontSize:13,fontWeight:600,color:"#2a2018"}}>{i.brandName} {i.name}</div>
                  <Tag color="red">欠品</Tag>
                </div>
              ))}
              {lowStock.slice(0,2).map(i=>(
                <div key={i.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",borderBottom:"1px solid rgba(42,32,24,.05)"}}>
                  <span style={{width:8,height:8,borderRadius:"50%",background:"#c87a00",flexShrink:0}}/>
                  <div style={{flex:1,fontSize:13,fontWeight:600,color:"#2a2018"}}>{i.brandName} {i.name}</div>
                  <Tag color="amber">残少 {i.stock}点</Tag>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* メンテ期限切れ */}
        {mainteExpired.length>0&&(
          <div style={{padding:"0 18px",marginBottom:14}}>
            <div style={{background:"#fff",borderRadius:14,border:"1px solid rgba(42,32,24,.09)",overflow:"hidden",boxShadow:"0 1px 8px rgba(42,32,24,.06)"}}>
              <div style={{padding:"12px 16px 11px",borderBottom:"1px solid rgba(42,32,24,.06)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{fontFamily:"'Shippori Mincho',serif",fontWeight:700,fontSize:14,color:"#2a2018"}}>📞 メンテ期限切れ</div>
                <Btn onClick={()=>switchMode("phone")} variant="outline" size="sm">電話帳へ</Btn>
              </div>
              {mainteExpired.slice(0,4).map(c=>{ const eb=(c.bikes||[]).find(b=>b.nextMaintenanceDate&&new Date(b.nextMaintenanceDate)<today()); return (
                <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 16px",borderBottom:"1px solid rgba(42,32,24,.05)"}}>
                  <div style={{width:38,height:38,borderRadius:"50%",background:"#fae8e8",color:"#a83030",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Shippori Mincho',serif",fontWeight:700,fontSize:15,flexShrink:0}}>{(c.name||"?")[0]}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:700,color:"#2a2018"}}>{c.name}</div>
                    <div style={{fontSize:11,color:"#a06c10",marginTop:1}}>⚠ {eb?.maker} — {eb?.nextMaintenanceDate}</div>
                  </div>
                  {c.phone&&<a href={`tel:${(c.phone||"").replace(/-/g,"")}`} style={{width:40,height:40,borderRadius:"50%",background:"#e6f2ec",border:"1.5px solid rgba(61,122,86,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,textDecoration:"none",flexShrink:0}}>📞</a>}
                </div>
              );})}
              {mainteExpired.length>4&&<div style={{padding:"8px 16px",fontSize:11,color:"#9a9088",textAlign:"center"}}>他 {mainteExpired.length-4}名</div>}
            </div>
          </div>
        )}

        {/* ショートカット */}
        <div style={{padding:"0 18px",marginBottom:18}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[
              {icon:"📦",label:"在庫管理",sub:"在庫確認・発注",id:"stock",color:"#c0724a"},
              {icon:"👥",label:"顧客管理",sub:"カルテ・自転車",id:"customers",color:"#2563a8"},
              {icon:"📋",label:"作業管理",sub:"カンバン・進捗",id:"kanban",color:"#3d7a56"},
              {icon:"📞",label:"電話帳",sub:"ワンタップ発信",id:"phone",color:"#6650a0"},
            ].map(s=>(
              <button key={s.id} onClick={()=>switchMode(s.id)} style={{background:"#fff",border:"1px solid rgba(42,32,24,.09)",borderRadius:14,padding:"14px 12px",cursor:"pointer",textAlign:"left",boxShadow:"0 1px 8px rgba(42,32,24,.06)"}}>
                <div style={{fontSize:24,marginBottom:6}}>{s.icon}</div>
                <div style={{fontFamily:"'Noto Sans JP',sans-serif",fontWeight:700,fontSize:13,color:"#2a2018",marginBottom:2}}>{s.label}</div>
                <div style={{fontSize:10,color:"#9a9088"}}>{s.sub}</div>
              </button>
            ))}
          </div>
        </div>
      </PageWrap>
    );
  }

  // ════════════════════════════════════════
  // 電話帳
  // ════════════════════════════════════════
  if (mode==="phone") {
    const phFilter=phoneFilter==="expired"?mainteExpired:phoneFilter==="month"?mainteThisMonth:customers;
    const phList=custSearch?phFilter.filter(c=>searchCustomerMatch(c,custSearch)):phFilter;

    return (
      <PageWrap>
        <PageHeader title="電話帳" sub={`${phList.length}名表示`}/>
        <SearchBar value={custSearch} onChange={setCustSearch} placeholder="名前・電話番号で検索…"/>
        <div style={{display:"flex",gap:7,overflowX:"auto",padding:"0 18px 13px",scrollbarWidth:"none"}}>
          {[{k:"all",l:"すべて"},{k:"expired",l:`期限切れ ${mainteExpired.length}名`},{k:"month",l:`今月期限 ${mainteThisMonth.length}名`}].map(f=>(
            <button key={f.k} onClick={()=>setPhoneFilter(f.k)} style={{padding:"7px 14px",borderRadius:20,fontSize:12,fontWeight:700,whiteSpace:"nowrap",cursor:"pointer",flexShrink:0,border:"1.5px solid",background:phoneFilter===f.k?"#2a2018":"#fff",color:phoneFilter===f.k?"#faf8f4":"#7a7060",borderColor:phoneFilter===f.k?"#2a2018":"rgba(42,32,24,.12)"}}>{f.l}</button>
          ))}
        </div>
        <div style={{padding:"0 18px",marginBottom:20}}>
          <div style={{background:"#fff",borderRadius:14,border:"1px solid rgba(42,32,24,.09)",overflow:"hidden",boxShadow:"0 1px 8px rgba(42,32,24,.06)"}}>
            {phList.length===0&&<div style={{padding:"40px 20px",textAlign:"center",color:"#c8bfb0",fontSize:13}}>該当する顧客がいません</div>}
            {phList.map((c,idx)=>{ const eb=(c.bikes||[]).find(b=>b.nextMaintenanceDate&&new Date(b.nextMaintenanceDate)<today()); const mb=!eb&&(c.bikes||[]).find(b=>{ if(!b.nextMaintenanceDate) return false; const d=new Date(b.nextMaintenanceDate); const t2=today(); return d>=t2&&d<=new Date(t2.getTime()+30*24*60*60*1000); }); return (
              <div key={c.id} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",borderBottom:idx<phList.length-1?"1px solid rgba(42,32,24,.06)":"none"}}>
                <div style={{width:44,height:44,borderRadius:"50%",background:eb?"#fae8e8":mb?"#fdf2d8":"#f0ece4",color:eb?"#a83030":mb?"#a06c10":"#7a7060",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Shippori Mincho',serif",fontWeight:700,fontSize:18,flexShrink:0}}>{(c.name||"?")[0]}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700,color:"#2a2018",marginBottom:2}}>{c.name}</div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:15,fontWeight:500,color:"#3a3028",letterSpacing:"0.04em",marginBottom:2}}>{c.phone||<span style={{color:"#c8bfb0",fontSize:12}}>電話番号未登録</span>}</div>
                  {eb&&<div style={{fontSize:11,color:"#a83030",fontWeight:600}}>⚠ {eb.maker} メンテ期限切れ</div>}
                  {mb&&<div style={{fontSize:11,color:"#a06c10",fontWeight:600}}>⚠ {mb.maker} 今月期限</div>}
                  {!eb&&!mb&&(c.bikes||[]).length>0&&<div style={{fontSize:11,color:"#9a9088"}}>🚲 {(c.bikes||[]).map(b=>b.maker).join("・")}</div>}
                </div>
                <div style={{display:"flex",gap:7,alignItems:"center",flexShrink:0}}>
                  {c.phone&&<a href={`tel:${(c.phone||"").replace(/-/g,"")}`} style={{width:44,height:44,borderRadius:"50%",background:"#e6f2ec",border:"1.5px solid rgba(61,122,86,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:19,textDecoration:"none"}}>📞</a>}
                  <button onClick={()=>{setCustDetail(c);switchMode("customers");}} style={{width:34,height:34,borderRadius:"50%",background:"#f0ece4",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#7a7060",fontSize:16}}>›</button>
                </div>
              </div>
            );})}
          </div>
        </div>
      </PageWrap>
    );
  }


  // ════════════════════════════════════════
  // 顧客管理
  // ════════════════════════════════════════
  if (mode==="customers") {

    // 顧客カルテ詳細
    if (custDetail) {
      const c=custDetail;
      return (
        <PageWrap>
          {/* プロフィールヘッダー */}
          <div style={{background:"#fff",borderBottom:"1px solid rgba(42,32,24,.09)",padding:"16px 18px 16px",display:"flex",alignItems:"center",gap:12}}>
            <button onClick={()=>setCustDetail(null)} style={{background:"#f0ece4",border:"none",cursor:"pointer",width:36,height:36,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:"#2a2018"}}><Ico.Back/></button>
            <div style={{width:52,height:52,borderRadius:"50%",background:"#fdf0e8",color:"#c0724a",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Shippori Mincho',serif",fontSize:22,fontWeight:700,flexShrink:0,border:"2px solid rgba(192,114,74,.18)"}}>{(c.name||"?")[0]}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:"'Shippori Mincho',serif",fontSize:19,fontWeight:700,color:"#2a2018"}}>{c.name}</div>
              <div style={{fontSize:11,color:"#9a9088",marginTop:2}}>{c.furigana||""}</div>
              <div style={{display:"flex",gap:5,marginTop:6,flexWrap:"wrap"}}>
                {c.customer_rank&&c.customer_rank!=="通常"&&<Tag color="amber">{c.customer_rank}</Tag>}
                {(c.bikes||[]).length>0&&<Tag color="blue">{(c.bikes||[]).length}台登録</Tag>}
              </div>
            </div>
            <button onClick={()=>setEditCustModal({...c})} style={{background:"#f0ece4",border:"none",cursor:"pointer",width:36,height:36,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"#7a7060"}}><Ico.Edit/></button>
          </div>

          {/* 電話番号 */}
          <div style={{padding:"14px 18px 0"}}>
            <div style={{background:"#fff",borderRadius:14,border:"1px solid rgba(42,32,24,.09)",padding:"14px 16px",boxShadow:"0 1px 8px rgba(42,32,24,.06)"}}>
              <div style={{fontSize:11,fontWeight:700,color:"#9a9088",letterSpacing:".1em",textTransform:"uppercase",marginBottom:9}}>電話番号</div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
                <div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:22,fontWeight:500,color:"#2a2018",letterSpacing:"0.05em"}}>{c.phone||<span style={{fontSize:14,color:"#c8bfb0"}}>未登録</span>}</div>
                </div>
                {c.phone&&<a href={`tel:${(c.phone||"").replace(/-/g,"")}`} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"11px 20px",borderRadius:40,background:"#e6f2ec",border:"1.5px solid rgba(61,122,86,.22)",color:"#3d7a56",fontSize:14,fontWeight:700,textDecoration:"none",fontFamily:"'Noto Sans JP',sans-serif"}}>📞 電話する</a>}
              </div>
            </div>
          </div>

          {/* 基本情報 */}
          <div style={{padding:"10px 18px 0"}}>
            <div style={{background:"#fff",borderRadius:14,border:"1px solid rgba(42,32,24,.09)",overflow:"hidden",boxShadow:"0 1px 8px rgba(42,32,24,.06)"}}>
              {[["住所",c.address||"—"],["メモ",c.memo||"—"],["ランク",c.customer_rank||"通常"]].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"11px 16px",borderBottom:"1px solid rgba(42,32,24,.06)",gap:10}}>
                  <span style={{fontSize:12,color:"#9a9088",fontWeight:500,flexShrink:0}}>{k}</span>
                  <span style={{fontSize:13,color:"#2a2018",fontWeight:600,textAlign:"right"}}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 保有自転車 */}
          <div style={{padding:"10px 18px 0"}}>
            <div style={{background:"#fff",borderRadius:14,border:"1px solid rgba(42,32,24,.09)",overflow:"hidden",boxShadow:"0 1px 8px rgba(42,32,24,.06)"}}>
              <div style={{padding:"12px 16px 11px",borderBottom:"1px solid rgba(42,32,24,.06)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{fontFamily:"'Shippori Mincho',serif",fontWeight:700,fontSize:14,color:"#2a2018"}}>🚲 保有自転車</div>
                <Btn onClick={()=>setAddBikeModal(true)} variant="outline" size="sm">＋ 追加</Btn>
              </div>
              {(c.bikes||[]).length===0&&<div style={{padding:"20px 16px",fontSize:13,color:"#c8bfb0",textAlign:"center"}}>自転車未登録</div>}
              {(c.bikes||[]).map((b,idx)=>{
                const isExpired=b.nextMaintenanceDate&&new Date(b.nextMaintenanceDate)<today();
                return (
                  <div key={idx} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderBottom:"1px solid rgba(42,32,24,.06)"}}>
                    <div style={{width:42,height:42,borderRadius:10,background:"#f0ece4",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🚲</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:700,color:"#2a2018"}}>{b.maker}</div>
                      <div style={{fontSize:11,color:"#9a9088",marginTop:2}}>{b.color||""}</div>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginTop:5}}>
                        <span style={{fontSize:10,color:"#9a9088"}}>次回メンテ</span>
                        <input type="date" value={b.nextMaintenanceDate||""} onChange={e=>updateBikeMaintenance(idx,e.target.value)} style={{fontSize:12,border:"1px solid rgba(42,32,24,.12)",borderRadius:6,padding:"3px 8px",background:"#f3f0ea",color:isExpired?"#a83030":"#2a2018",fontFamily:"'Noto Sans JP',sans-serif",outline:"none"}}/>
                        {isExpired&&<Tag color="red">期限切れ</Tag>}
                      </div>
                    </div>
                    <button onClick={()=>delBike(idx)} style={{background:"none",border:"none",cursor:"pointer",color:"#c8bfb0",padding:4}}><Ico.Trash/></button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 見積もり・修理履歴 */}
          {(c.bikes||[]).length>0&&(
            <div style={{padding:"10px 18px 0"}}>
              <div style={{background:"#fff",borderRadius:14,border:"1px solid rgba(42,32,24,.09)",overflow:"hidden",boxShadow:"0 1px 8px rgba(42,32,24,.06)"}}>
                <div style={{padding:"12px 16px 11px",borderBottom:"1px solid rgba(42,32,24,.06)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{fontFamily:"'Shippori Mincho',serif",fontWeight:700,fontSize:14,color:"#2a2018"}}>🔧 見積もり・修理履歴</div>
                </div>
                {(c.bikes||[]).map((b,bikeIdx)=>{
                  const ests=custEstimates(c.id,bikeIdx);
                  return (
                    <div key={bikeIdx} style={{padding:"12px 16px",borderBottom:"1px solid rgba(42,32,24,.06)"}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:ests.length>0?10:0}}>
                        <div style={{fontSize:13,fontWeight:700,color:"#2563a8"}}>🚲 {b.maker}{b.color?` (${b.color})`:""}</div>
                        <Btn onClick={()=>{loadEstimates();setAddEstModal({custId:c.id,bikeIdx});setEstItems([]);setEstMemo("");}} variant="outline" size="sm"><Ico.Plus/>作成</Btn>
                      </div>
                      {ests.map(e=>(
                        <div key={e.id} style={{background:"#faf8f4",borderRadius:9,padding:"10px 12px",marginTop:8,border:"1px solid rgba(42,32,24,.07)"}}>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                            <div style={{fontFamily:"'DM Mono',monospace",fontSize:15,fontWeight:500,color:"#c0724a"}}>¥{(e.total||0).toLocaleString()}</div>
                            <div style={{fontSize:10,color:"#9a9088"}}>{e.created_at?fmt(e.created_at,"short"):""}</div>
                          </div>
                          {(e.items||[]).map((it,i)=><div key={i} style={{fontSize:11,color:"#7a7060",marginBottom:1}}>{it.name} × {it.qty} = ¥{((it.price||0)*(it.qty||1)).toLocaleString()}</div>)}
                          {e.memo&&<div style={{fontSize:11,color:"#9a9088",marginTop:4,borderTop:"1px solid rgba(42,32,24,.06)",paddingTop:4}}>{e.memo}</div>}
                          <div style={{display:"flex",gap:6,marginTop:8}}>
                            <button onClick={()=>{setEditEstModal(e);setEstItems(e.items||[]);setEstMemo(e.memo||"");}} style={{background:"#e4eef8",border:"none",cursor:"pointer",borderRadius:6,padding:"5px 10px",fontSize:11,color:"#2e5f90",fontWeight:700,fontFamily:"'Noto Sans JP',sans-serif"}}>✏ 編集</button>
                            <button onClick={()=>delEst(e.id)} style={{background:"#fae8e8",border:"none",cursor:"pointer",borderRadius:6,padding:"5px 10px",fontSize:11,color:"#a83030",fontWeight:700,fontFamily:"'Noto Sans JP',sans-serif"}}>🗑 削除</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* メモ */}
          <div style={{padding:"10px 18px 20px"}}>
            <div style={{background:"#fff",borderRadius:14,border:"1px solid rgba(42,32,24,.09)",padding:"14px 16px",boxShadow:"0 1px 8px rgba(42,32,24,.06)"}}>
              <div style={{fontFamily:"'Shippori Mincho',serif",fontWeight:700,fontSize:14,color:"#2a2018",marginBottom:10}}>メモ</div>
              <div style={{fontSize:13,color:"#4a4038",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{c.memo||<span style={{color:"#c8bfb0"}}>メモなし</span>}</div>
            </div>
          </div>

          {/* 見積もり作成モーダル */}
          <EstModal open={!!addEstModal} onClose={()=>setAddEstModal(null)} onSave={doSaveEst} title="見積もりを作成"/>
          {/* 見積もり編集モーダル */}
          <EstModal open={!!editEstModal} onClose={()=>setEditEstModal(null)} onSave={doUpdateEst} title="見積もりを編集"/>

          {/* 顧客編集モーダル */}
          <Modal open={!!editCustModal} onClose={()=>setEditCustModal(null)} title="顧客情報を編集">
            {editCustModal&&<>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                <FG label="氏名"><Input value={editCustModal.name||""} onChange={v=>setEditCustModal(p=>({...p,name:v}))} placeholder="田中 美咲"/></FG>
                <FG label="フリガナ"><Input value={editCustModal.furigana||""} onChange={v=>setEditCustModal(p=>({...p,furigana:v}))} placeholder="タナカ ミサキ"/></FG>
              </div>
              <FG label="電話番号"><Input value={editCustModal.phone||""} onChange={v=>setEditCustModal(p=>({...p,phone:v}))} type="tel" placeholder="090-XXXX-XXXX" style={{fontFamily:"'DM Mono',monospace",fontSize:15,letterSpacing:"0.04em"}}/></FG>
              <FG label="住所"><Input value={editCustModal.address||""} onChange={v=>setEditCustModal(p=>({...p,address:v}))} placeholder="諏訪市○○"/></FG>
              <FG label="ランク"><Select value={editCustModal.customer_rank||"通常"} onChange={v=>setEditCustModal(p=>({...p,customer_rank:v}))}><option>通常</option><option>常連</option><option>VIP</option><option>見込み</option></Select></FG>
              <FG label="メモ"><Textarea value={editCustModal.memo||""} onChange={v=>setEditCustModal(p=>({...p,memo:v}))} placeholder="メモ…" rows={3}/></FG>
              <div style={{display:"flex",gap:8,marginTop:4}}>
                <Btn onClick={()=>setEditCustModal(null)} variant="outline" style={{flex:1}}>キャンセル</Btn>
                <Btn onClick={doEditCust} variant="primary" style={{flex:2}}>💾 保存する</Btn>
              </div>
            </>}
          </Modal>

          {/* 自転車追加モーダル */}
          <Modal open={addBikeModal} onClose={()=>setAddBikeModal(false)} title="自転車を追加">
            <FG label="メーカー">
              <Select value={newBikeF.maker} onChange={v=>setNewBikeF(p=>({...p,maker:v}))}>
                <option value="">選択してください</option>
                {makerMaster.map(m=><option key={m.id}>{m.name}</option>)}
              </Select>
            </FG>
            <FG label="カラー"><Input value={newBikeF.color} onChange={v=>setNewBikeF(p=>({...p,color:v}))} placeholder="ブラック・シルバーなど"/></FG>
            <FG label="次回メンテナンス日"><Input type="date" value={newBikeF.nextMaintenanceDate} onChange={v=>setNewBikeF(p=>({...p,nextMaintenanceDate:v}))}/></FG>
            <div style={{display:"flex",gap:8,marginTop:4}}>
              <Btn onClick={()=>setAddBikeModal(false)} variant="outline" style={{flex:1}}>キャンセル</Btn>
              <Btn onClick={addBike} variant="primary" style={{flex:2}}>🚲 追加する</Btn>
            </div>
          </Modal>
        </PageWrap>
      );
    }

    // 顧客一覧
    return (
      <PageWrap>
        <PageHeader title="顧客一覧" sub={`${filteredCustomers.length}名`} right={<div style={{display:"flex",gap:8}}><button onClick={()=>{setStCustOpen(true);loadMasters();}} style={{background:"#f0ece4",border:"none",cursor:"pointer",width:36,height:36,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"#7a7060"}}><Ico.Settings/></button><Btn onClick={()=>setAddCustModal(true)} variant="primary" size="sm"><Ico.Plus/>追加</Btn></div>}/>
        <SearchBar value={custSearch} onChange={setCustSearch} placeholder="名前・電話番号で検索…"/>

        {/* フィルターチップ */}
        <div style={{display:"flex",gap:7,overflowX:"auto",padding:"0 18px 13px",scrollbarWidth:"none"}}>
          {[{k:"all",l:"すべて"},{k:"VIP",l:"VIP"},{k:"常連",l:"常連"},{k:"見込み",l:"見込み"},{k:"expired",l:`期限切れ ${mainteExpired.length}`},{k:"month",l:`今月期限 ${mainteThisMonth.length}`}].map(f=>(
            <button key={f.k} onClick={()=>setCustRankFilter(f.k)} style={{padding:"7px 14px",borderRadius:20,fontSize:12,fontWeight:700,whiteSpace:"nowrap",cursor:"pointer",flexShrink:0,border:"1.5px solid",background:custRankFilter===f.k?"#2a2018":"#fff",color:custRankFilter===f.k?"#faf8f4":"#7a7060",borderColor:custRankFilter===f.k?"#2a2018":"rgba(42,32,24,.12)"}}>{f.l}</button>
          ))}
        </div>

        <div style={{padding:"0 18px",marginBottom:20}}>
          {custLoading&&<div style={{textAlign:"center",padding:30,color:"#9a9088",fontSize:13}}>読み込み中...</div>}
          {!custLoading&&filteredCustomers.length===0&&<div style={{textAlign:"center",padding:40,color:"#c8bfb0",fontSize:13}}>顧客が見つかりません</div>}
          {!custLoading&&filteredCustomers.length>0&&(
            <div style={{background:"#fff",borderRadius:14,border:"1px solid rgba(42,32,24,.09)",overflow:"hidden",boxShadow:"0 1px 8px rgba(42,32,24,.06)"}}>
              {filteredCustomers.map((c,idx)=>{
                const eb=(c.bikes||[]).find(b=>b.nextMaintenanceDate&&new Date(b.nextMaintenanceDate)<today());
                return (
                  <div key={c.id} onClick={()=>setCustDetail(c)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderBottom:idx<filteredCustomers.length-1?"1px solid rgba(42,32,24,.06)":"none",cursor:"pointer"}}>
                    <div style={{width:42,height:42,borderRadius:"50%",background:eb?"#fae8e8":"#f0ece4",color:eb?"#a83030":"#7a7060",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Shippori Mincho',serif",fontWeight:700,fontSize:17,flexShrink:0}}>{(c.name||"?")[0]}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:700,color:"#2a2018",marginBottom:2}}>{c.name}</div>
                      <div style={{fontSize:12,color:"#9a9088"}}>{(c.bikes||[]).length>0?`🚲 ${(c.bikes||[]).map(b=>b.maker).join("・")}`:c.phone||"電話番号未登録"}</div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                      {c.customer_rank&&c.customer_rank!=="通常"&&<Tag color={c.customer_rank==="VIP"?"accent":c.customer_rank==="常連"?"amber":"gray"}>{c.customer_rank}</Tag>}
                      {eb&&<Tag color="red">期限切れ</Tag>}
                    </div>
                    <span style={{color:"#c8bfb0",fontSize:18}}>›</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 顧客追加モーダル */}
        <Modal open={addCustModal} onClose={()=>setAddCustModal(false)} title="新規顧客登録">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            <FG label="氏名"><Input value={newCust.name} onChange={v=>setNewCust(p=>({...p,name:v}))} placeholder="田中 美咲"/></FG>
            <FG label="フリガナ"><Input value={newCust.furigana} onChange={v=>setNewCust(p=>({...p,furigana:v}))} placeholder="タナカ ミサキ"/></FG>
          </div>
          <FG label="電話番号"><Input value={newCust.phone} onChange={v=>setNewCust(p=>({...p,phone:v}))} type="tel" placeholder="090-XXXX-XXXX" style={{fontFamily:"'DM Mono',monospace",fontSize:15,letterSpacing:"0.04em"}}/></FG>
          <FG label="住所"><Input value={newCust.address} onChange={v=>setNewCust(p=>({...p,address:v}))} placeholder="諏訪市○○"/></FG>
          <FG label="ランク"><Select value={newCust.customer_rank} onChange={v=>setNewCust(p=>({...p,customer_rank:v}))}><option>通常</option><option>常連</option><option>VIP</option><option>見込み</option></Select></FG>
          <FG label="メモ"><Textarea value={newCust.memo} onChange={v=>setNewCust(p=>({...p,memo:v}))} placeholder="初回来店時のメモなど" rows={3}/></FG>
          <div style={{display:"flex",gap:8,marginTop:4}}>
            <Btn onClick={()=>setAddCustModal(false)} variant="outline" style={{flex:1}}>キャンセル</Btn>
            <Btn onClick={doAddCust} variant="primary" style={{flex:2}}>💾 登録する</Btn>
          </div>
        </Modal>

        {/* 顧客設定（メーカーマスター・修理メニュー） */}
        {stCustOpen&&(
          <div onClick={e=>e.target===e.currentTarget&&setStCustOpen(false)} style={{position:"fixed",inset:0,background:"rgba(42,32,24,.28)",zIndex:900,display:"flex",justifyContent:"flex-end"}}>
            <div style={{background:"#faf8f4",width:"min(300px,92vw)",height:"100%",overflowY:"auto",padding:"20px 16px",boxShadow:"-4px 0 28px rgba(42,32,24,.13)",animation:"sin .22s cubic-bezier(.22,1,.36,1)"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                <span style={{fontFamily:"'Shippori Mincho',serif",fontWeight:700,fontSize:16,color:"#2a2018"}}>⚙️ 設定</span>
                <button onClick={()=>setStCustOpen(false)} style={{background:"#e8e2d8",border:"none",cursor:"pointer",borderRadius:9,padding:8,display:"flex",color:"#7a6f63"}}><Ico.X/></button>
              </div>
              <div style={{fontFamily:"'Shippori Mincho',serif",fontWeight:700,fontSize:14,color:"#2a2018",marginBottom:8}}>🚲 メーカー</div>
              <div className="compact-form" style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) auto",gap:6,marginBottom:10}}>
                <input value={newMakerF} onChange={e=>setNewMakerF(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doAddMaker()} placeholder="メーカー名" style={{background:"#f5f0e8",border:"1px solid #ccc5ba",borderRadius:8,padding:"8px 10px",fontFamily:"'Noto Sans JP',sans-serif",color:"#2a2018",outline:"none",fontSize:14}}/>
                <button onClick={doAddMaker} style={{background:"#2a2018",color:"#f5f0e8",border:"none",borderRadius:8,padding:"8px 12px",cursor:"pointer",fontFamily:"'Noto Sans JP',sans-serif",fontSize:13,fontWeight:700}}>追加</button>
              </div>
              {makerMaster.map(m=>(
                <div key={m.id} style={{display:"flex",alignItems:"center",gap:7,padding:"8px 10px",borderRadius:9,background:"#f5f0e8",border:"1px solid #e8e2d8",marginBottom:6}}>
                  {rnMaker===m.id?<input value={rnMakerV} onChange={e=>setRnMakerV(e.target.value)} autoFocus onBlur={()=>commitRnMaker(m.id)} onKeyDown={e=>{if(e.key==="Enter")commitRnMaker(m.id);if(e.key==="Escape")setRnMaker(null);}} style={{flex:1,background:"#fff",border:"1.5px solid #2a2018",borderRadius:6,padding:"4px 8px",fontFamily:"'Noto Sans JP',sans-serif",color:"#2a2018",outline:"none"}}/>:<span style={{flex:1,fontWeight:600,color:"#2a2018",fontSize:13}}>{m.name}</span>}
                  <button onClick={()=>{setRnMaker(m.id);setRnMakerV(m.name);}} style={{background:"#e8e2d8",border:"none",cursor:"pointer",borderRadius:6,padding:5,display:"flex",color:"#9a8f82"}}><Ico.Edit/></button>
                  <button onClick={()=>delMaker(m.id)} style={{background:"#f0d9d6",border:"none",cursor:"pointer",borderRadius:6,padding:5,display:"flex",color:"#c0392b"}}><Ico.Trash/></button>
                </div>
              ))}
              <div style={{fontFamily:"'Shippori Mincho',serif",fontWeight:700,fontSize:14,color:"#2a2018",marginTop:18,marginBottom:8}}>🔧 修理メニュー</div>
              <div style={{marginBottom:10}}>
                <input value={newMenuF.name} onChange={e=>setNewMenuF(p=>({...p,name:e.target.value}))} placeholder="メニュー名" style={{width:"100%",background:"#f5f0e8",border:"1px solid #ccc5ba",borderRadius:8,padding:"8px 10px",fontFamily:"'Noto Sans JP',sans-serif",color:"#2a2018",outline:"none",marginBottom:5,fontSize:14}}/>
                <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:6}}>
                  <input value={newMenuF.price} onChange={e=>setNewMenuF(p=>({...p,price:e.target.value}))} placeholder="金額" type="number" style={{background:"#f5f0e8",border:"1px solid #ccc5ba",borderRadius:8,padding:"8px 10px",fontFamily:"'Noto Sans JP',sans-serif",color:"#2a2018",outline:"none",fontSize:14}}/>
                  <button onClick={doAddMenu} style={{background:"#2a2018",color:"#f5f0e8",border:"none",borderRadius:8,padding:"8px 12px",cursor:"pointer",fontFamily:"'Noto Sans JP',sans-serif",fontSize:13,fontWeight:700}}>追加</button>
                </div>
              </div>
              {repairMenus.map(m=>(
                <div key={m.id} style={{display:"flex",alignItems:"center",gap:7,padding:"8px 10px",borderRadius:9,background:"#f5f0e8",border:"1px solid #e8e2d8",marginBottom:6}}>
                  <span style={{flex:1,fontWeight:600,color:"#2a2018",fontSize:13}}>{m.name}<span style={{color:"#9a8f82",fontWeight:400,fontSize:11,marginLeft:6}}>¥{(m.price||0).toLocaleString()}</span></span>
                  <button onClick={()=>setEditRepairMenu({...m})} style={{background:"#d6e4f0",border:"none",cursor:"pointer",borderRadius:6,padding:5,display:"flex",color:"#2563a8"}}><Ico.Edit/></button>
                  <button onClick={()=>delMenu(m.id)} style={{background:"#f0d9d6",border:"none",cursor:"pointer",borderRadius:6,padding:5,display:"flex",color:"#c0392b"}}><Ico.Trash/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 修理メニュー編集モーダル */}
        <Modal open={!!editRepairMenu} onClose={()=>setEditRepairMenu(null)} title="修理メニューを編集">
          {editRepairMenu&&<>
            <FG label="メニュー名"><Input value={editRepairMenu.name||""} onChange={v=>setEditRepairMenu(p=>({...p,name:v}))}/></FG>
            <FG label="金額（円）"><Input type="number" value={String(editRepairMenu.price||"")} onChange={v=>setEditRepairMenu(p=>({...p,price:v}))}/></FG>
            <div style={{display:"flex",gap:8,marginTop:4}}>
              <Btn onClick={()=>setEditRepairMenu(null)} variant="outline" style={{flex:1}}>キャンセル</Btn>
              <Btn onClick={doEditMenu} variant="primary" style={{flex:2}}>💾 保存</Btn>
            </div>
          </>}
        </Modal>
      </PageWrap>
    );
  }


  // ════════════════════════════════════════
  // 作業管理（カンバン）
  // ════════════════════════════════════════
  if (mode==="kanban") {
    const custMap=Object.fromEntries(customers.map(c=>[c.id,c]));
    const cols=[
      {key:"reserved",label:"受付済み",color:"#9a9088",bg:"#f3f0ea"},
      {key:"in",label:"作業中",color:"#a06c10",bg:"#fdf2d8"},
      {key:"done",label:"完了",color:"#3d7a56",bg:"#e6f2ec"},
    ];
    const getResCard=(r)=>{
      const c=custMap[r.customer_id];
      const b=c?.bikes?.[r.bike_index||0];
      return {cust:c,bike:b};
    };

    return (
      <PageWrap>
        <div style={{padding:"18px 18px 10px",display:"flex",alignItems:"flex-end",justifyContent:"space-between"}}>
          <div>
            <div style={{fontFamily:"'Shippori Mincho',serif",fontSize:22,fontWeight:700,color:"#2a2018"}}>作業管理</div>
            <div style={{fontSize:12,color:"#9a9088",marginTop:3}}>進行中 {reservations.filter(r=>r.status==="in").length}件</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>loadReservations()} style={{background:"#f0ece4",border:"none",cursor:"pointer",width:36,height:36,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"#2a2018"}}><Ico.Refresh/></button>
            <Btn onClick={()=>setAddResModal(true)} variant="primary" size="sm"><Ico.Plus/>追加</Btn>
          </div>
        </div>

        {/* カンバン横スクロール */}
        <div style={{display:"flex",gap:10,overflowX:"auto",padding:"0 18px 14px",scrollSnapType:"x mandatory",WebkitOverflowScrolling:"touch",scrollbarWidth:"none"}}>
          {cols.map(col=>{
            const items=reservations.filter(r=>r.status===col.key).sort((a,b)=>new Date(a.due_date||"9999")-new Date(b.due_date||"9999"));
            return (
              <div key={col.key} style={{minWidth:200,background:"#fff",borderRadius:14,border:"1px solid rgba(42,32,24,.09)",overflow:"hidden",flexShrink:0,scrollSnapAlign:"start",boxShadow:"0 1px 8px rgba(42,32,24,.06)"}}>
                <div style={{padding:"11px 14px",background:col.bg,borderBottom:"1px solid rgba(42,32,24,.07)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontSize:12,fontWeight:700,color:col.color,letterSpacing:"0.04em"}}>{col.label}</span>
                  <span style={{background:col.color,color:"#fff",borderRadius:10,padding:"1px 8px",fontSize:11,fontWeight:700}}>{items.length}</span>
                </div>
                <div style={{padding:10,display:"flex",flexDirection:"column",gap:8,minHeight:200}}>
                  {items.map(r=>{
                    const{cust,bike}=getResCard(r);
                    const isOverdue=r.due_date&&new Date(r.due_date)<today()&&r.status!=="done";
                    return (
                      <div key={r.id} onClick={()=>setSelectedRes(r)} style={{background:"#faf8f4",borderRadius:10,padding:"11px 12px",border:`1px solid ${isOverdue?"rgba(168,48,48,.25)":"rgba(42,32,24,.09)"}`,cursor:"pointer"}}>
                        <div style={{fontSize:13,fontWeight:700,color:"#2a2018",marginBottom:2}}>{cust?.name||r.memo||"未設定"}</div>
                        <div style={{fontSize:11,color:"#9a9088",marginBottom:8,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{bike?`🚲 ${bike.maker}`:r.memo||""}</div>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                          <Tag color={r.staff==="あさと"?"blue":"green"}>{r.staff||""}</Tag>
                          <span style={{fontSize:10,color:isOverdue?"#a83030":"#9a9088",fontFamily:"'DM Mono',monospace",fontWeight:isOverdue?700:400}}>
                            {r.due_date?fmt(r.due_date,"short"):"期日未定"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {items.length===0&&<div style={{padding:"20px 10px",textAlign:"center",color:"#c8bfb0",fontSize:12}}>なし</div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* 作業詳細モーダル */}
        <Modal open={!!selectedRes} onClose={()=>setSelectedRes(null)} title="作業詳細">
          {selectedRes&&(()=>{
            const{cust,bike}=getResCard(selectedRes);
            return <>
              <div style={{background:"#faf8f4",borderRadius:12,padding:"14px 16px",marginBottom:16}}>
                <div style={{fontWeight:700,fontSize:15,color:"#2a2018",marginBottom:4}}>{cust?.name||"未設定"}</div>
                {bike&&<div style={{fontSize:13,color:"#9a9088",marginBottom:4}}>🚲 {bike.maker}{bike.color?` (${bike.color})`:""}</div>}
                {cust?.phone&&<a href={`tel:${(cust.phone||"").replace(/-/g,"")}`} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"8px 14px",borderRadius:30,background:"#e6f2ec",border:"1.5px solid rgba(61,122,86,.2)",color:"#3d7a56",fontSize:13,fontWeight:700,textDecoration:"none",fontFamily:"'Noto Sans JP',sans-serif",marginTop:4}}>📞 電話する</a>}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
                {[["入庫日",selectedRes.checkin_date?fmt(selectedRes.checkin_date,"short"):"—"],["完了予定",selectedRes.due_date?fmt(selectedRes.due_date,"short"):"未定"],["担当",selectedRes.staff||"—"],["ステータス",selectedRes.status==="reserved"?"受付済み":selectedRes.status==="in"?"作業中":"完了"]].map(([k,v])=>(
                  <div key={k} style={{background:"#f3f0ea",borderRadius:9,padding:"10px 12px"}}>
                    <div style={{fontSize:10,color:"#9a9088",fontWeight:600,marginBottom:3}}>{k}</div>
                    <div style={{fontSize:13,fontWeight:700,color:"#2a2018"}}>{v}</div>
                  </div>
                ))}
              </div>
              {selectedRes.memo&&<div style={{background:"#faf8f4",borderRadius:9,padding:"10px 12px",marginBottom:14,fontSize:13,color:"#4a4038",lineHeight:1.6}}>{selectedRes.memo}</div>}
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {selectedRes.status==="reserved"&&<Btn onClick={()=>updateResStatus(selectedRes.id,"in")} variant="primary" style={{flex:1}}>🔧 作業開始</Btn>}
                {selectedRes.status==="in"&&<Btn onClick={()=>updateResStatus(selectedRes.id,"done")} variant="dark" style={{flex:1}}>✅ 完了にする</Btn>}
                {selectedRes.status==="done"&&<Btn onClick={()=>updateResStatus(selectedRes.id,"in")} variant="outline" style={{flex:1}}>↩ 作業中に戻す</Btn>}
                <Btn onClick={()=>{setEditResModal({...selectedRes});setSelectedRes(null);}} variant="outline"><Ico.Edit/></Btn>
                <Btn onClick={()=>delRes(selectedRes.id)} variant="outline" style={{color:"#a83030"}}><Ico.Trash/></Btn>
              </div>
            </>;
          })()}
        </Modal>

        {/* 作業追加モーダル */}
        <Modal open={addResModal} onClose={()=>{setAddResModal(false);setResForm({custId:"",bikeIdx:0,checkinDate:"",dueDate:"",dueDateUnknown:false,staff:"あさと",memo:""});setResCustSearch("");}} title="作業を追加">
          <FG label="顧客検索">
            <input value={resCustSearch} onChange={e=>setResCustSearch(e.target.value)} placeholder="名前・フリガナ・電話番号" style={{width:"100%",padding:"10px 14px",background:"#f3f0ea",border:"1.5px solid rgba(42,32,24,.1)",borderRadius:9,fontSize:14,color:"#2a2018",fontFamily:"'Noto Sans JP',sans-serif",outline:"none",marginBottom:6}}/>
            {resCustSearch&&resCusts.map(c=>(
              <div key={c.id} onClick={()=>{setResForm(p=>({...p,custId:c.id,bikeIdx:0}));setResCustSearch("");}} style={{padding:"9px 12px",borderRadius:8,background:resForm.custId===c.id?"#fdf0e8":"#faf8f4",border:`1px solid ${resForm.custId===c.id?"#c0724a":"rgba(42,32,24,.09)"}`,marginBottom:4,cursor:"pointer"}}>
                <div style={{fontSize:13,fontWeight:700,color:"#2a2018"}}>{c.name}</div>
                <div style={{fontSize:11,color:"#9a9088"}}>{c.phone||""} {(c.bikes||[]).map(b=>b.maker).join("・")}</div>
              </div>
            ))}
            {resForm.custId&&(()=>{
              const c=customers.find(x=>x.id===resForm.custId);
              if(!c) return null;
              return <div style={{padding:"8px 12px",borderRadius:8,background:"#fdf0e8",border:"1px solid #c0724a",marginBottom:6}}>
                <div style={{fontSize:13,fontWeight:700,color:"#c0724a"}}>✓ {c.name}</div>
                {(c.bikes||[]).length>0&&<select value={resForm.bikeIdx} onChange={e=>setResForm(p=>({...p,bikeIdx:+e.target.value}))} style={{marginTop:5,width:"100%",padding:"7px 10px",background:"#fff",border:"1px solid rgba(42,32,24,.12)",borderRadius:7,fontSize:13,color:"#2a2018",fontFamily:"'Noto Sans JP',sans-serif",outline:"none"}}>{c.bikes.map((b,i)=><option key={i} value={i}>{b.maker}{b.color?` (${b.color})`:""}</option>)}</select>}
              </div>;
            })()}
          </FG>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            <FG label="入庫日"><Input type="date" value={resForm.checkinDate} onChange={v=>setResForm(p=>({...p,checkinDate:v}))}/></FG>
            <FG label="完了予定日"><Input type="date" value={resForm.dueDate} onChange={v=>setResForm(p=>({...p,dueDate:v}))} style={{opacity:resForm.dueDateUnknown?0.3:1}}/></FG>
          </div>
          <label style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,fontSize:13,color:"#4a4038",cursor:"pointer"}}>
            <input type="checkbox" checked={resForm.dueDateUnknown} onChange={e=>setResForm(p=>({...p,dueDateUnknown:e.target.checked}))} style={{width:16,height:16,accentColor:"#c0724a"}}/>
            完了日未定
          </label>
          <FG label="担当">
            <Select value={resForm.staff} onChange={v=>setResForm(p=>({...p,staff:v}))}>
              {STAFF.map(s=><option key={s}>{s}</option>)}
            </Select>
          </FG>
          <FG label="メモ"><Textarea value={resForm.memo} onChange={v=>setResForm(p=>({...p,memo:v}))} placeholder="作業内容・部品番号など" rows={3}/></FG>
          <div style={{display:"flex",gap:8,marginTop:4}}>
            <Btn onClick={()=>{setAddResModal(false);setResForm({custId:"",bikeIdx:0,checkinDate:"",dueDate:"",dueDateUnknown:false,staff:"あさと",memo:""});setResCustSearch("");}} variant="outline" style={{flex:1}}>キャンセル</Btn>
            <Btn onClick={doAddRes} variant="primary" style={{flex:2}}>💾 追加する</Btn>
          </div>
        </Modal>

        {/* 作業編集モーダル */}
        <Modal open={!!editResModal} onClose={()=>setEditResModal(null)} title="作業を編集">
          {editResModal&&<>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              <FG label="入庫日"><Input type="date" value={editResModal.checkin_date||""} onChange={v=>setEditResModal(p=>({...p,checkin_date:v}))}/></FG>
              <FG label="完了予定日"><Input type="date" value={editResModal.due_date||""} onChange={v=>setEditResModal(p=>({...p,due_date:v}))}/></FG>
            </div>
            <FG label="担当"><Select value={editResModal.staff||"あさと"} onChange={v=>setEditResModal(p=>({...p,staff:v}))}>{STAFF.map(s=><option key={s}>{s}</option>)}</Select></FG>
            <FG label="ステータス"><Select value={editResModal.status||"reserved"} onChange={v=>setEditResModal(p=>({...p,status:v}))}><option value="reserved">受付済み</option><option value="in">作業中</option><option value="done">完了</option></Select></FG>
            <FG label="メモ"><Textarea value={editResModal.memo||""} onChange={v=>setEditResModal(p=>({...p,memo:v}))} rows={3}/></FG>
            <div style={{display:"flex",gap:8,marginTop:4}}>
              <Btn onClick={()=>setEditResModal(null)} variant="outline" style={{flex:1}}>キャンセル</Btn>
              <Btn onClick={doEditRes} variant="primary" style={{flex:2}}>💾 保存する</Btn>
            </div>
          </>}
        </Modal>
      </PageWrap>
    );
  }


  // ════════════════════════════════════════
  // 在庫管理（旧アプリのロジックを新デザインで）
  // ════════════════════════════════════════


  if (mode==="stock") {
    return (
      <div style={{background:"#faf8f4",minHeight:"100dvh",paddingBottom:72}}>
        <style>{CSS}</style>
        {/* ヘッダー */}
        <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px",borderBottom:"1px solid rgba(42,32,24,.09)",background:"#fff",position:"sticky",top:0,zIndex:100}}>
          <div>
            <div style={{fontFamily:"'Shippori Mincho',serif",fontWeight:700,fontSize:18,color:"#2a2018",letterSpacing:"-.01em"}}>📦 在庫管理</div>
            {saving&&<div style={{fontSize:10,color:"#9a9088"}}>保存中...</div>}
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button onClick={()=>{setScreen("loading");loadStock();}} style={{background:"#f0ece4",border:"none",cursor:"pointer",borderRadius:9,padding:8,display:"flex",color:"#7a6f63"}}><Ico.Refresh/></button>
            <button onClick={()=>{setSearchOpen(true);setSearchQ("");}} style={{background:"#f0ece4",border:"none",cursor:"pointer",borderRadius:9,padding:8,display:"flex",color:"#7a6f63"}}><Ico.Search/></button>
            <button onClick={()=>setShowSummary(true)} style={{background:"#f0ece4",border:"none",cursor:"pointer",borderRadius:9,padding:8,display:"flex",color:"#7a6f63"}}><Ico.Chart/></button>
            <button onClick={()=>exportCSV(cats)} style={{background:"#f0ece4",border:"none",cursor:"pointer",borderRadius:9,padding:8,display:"flex",color:"#7a6f63"}}><Ico.Download/></button>
            <button onClick={()=>setAddMenu(!addMenu)} style={{background:addMenu?"#2a2018":"#f0ece4",border:"none",cursor:"pointer",borderRadius:9,padding:8,display:"flex",color:addMenu?"#faf8f4":"#7a6f63"}}><Ico.Plus/></button>
            <button onClick={()=>setStOpen(true)} style={{background:"#f0ece4",border:"none",cursor:"pointer",borderRadius:9,padding:8,display:"flex",color:"#7a6f63"}}><Ico.Settings/></button>
          </div>
        </header>

        {addMenu&&(
          <div style={{background:"#faf8f4",borderBottom:"1px solid #e0d9ce",padding:"10px 20px",display:"flex",gap:8,flexWrap:"wrap"}}>
            <button className="add-chip" onClick={()=>{setAddModal("cat");setAddMenu(false);}}>📁 カテゴリ追加</button>
            <button className="add-chip" onClick={()=>{setAddModal("brand");setAddMenu(false);}}>🏷 ブランド追加</button>
            <button className="add-chip" onClick={()=>{setAddModal("item");setAddMenu(false);}}>🔧 商品追加</button>
          </div>
        )}

        {needOrder.length>0&&(<div style={{background:"#fdf0ee",borderBottom:"1px solid #f0c8c4",padding:"8px 20px",display:"flex",alignItems:"center",gap:8}}><span className="dot"/><span style={{fontSize:12,color:"#c0392b",fontWeight:700}}>注文が必要な商品が{needOrder.length}点あります</span></div>)}

        <div style={{background:"#faf7f2",borderBottom:"1px solid #e0d9ce",padding:"10px 20px",overflowX:"auto",whiteSpace:"nowrap",display:"flex",gap:4}} className="hide-scroll">
          <button className={`cat-tab ${selectedCatId==="all"&&mainTab==="stock"?"cat-tab-on":""}`} onClick={()=>{setSelectedCatId("all");setMainTab("stock");}}>すべて</button>
          {sortedCats.map(cat=><button key={cat.id} className={`cat-tab ${selectedCatId===cat.id&&mainTab==="stock"?"cat-tab-on":""}`} onClick={()=>{setSelectedCatId(cat.id);setMainTab("stock");}}>{cat.name}</button>)}
          <button className={`cat-tab ${mainTab==="order"?"cat-tab-order":""}`} onClick={()=>setMainTab("order")} style={{display:"inline-flex",alignItems:"center",gap:5}}>
            {needOrder.length>0&&<span className="dot" style={{width:6,height:6}}/>}要注文{needOrder.length>0&&<span style={{background:"#c0392b",color:"#fff",borderRadius:99,padding:"0px 5px",fontSize:10,fontWeight:700}}>{needOrder.length}</span>}
          </button>
        </div>

        <main style={{padding:"16px 20px",maxWidth:860,paddingBottom:80}}>
          {mainTab==="order"&&(needOrder.length===0?<div style={{textAlign:"center",padding:"64px 0"}}><div style={{fontSize:38}}>✅</div><p style={{color:"#9a8f82",marginTop:12}}>注文が必要な商品はありません</p></div>:needOrder.map(i=><div key={i.id} className="irow" onClick={()=>openDetail(i.catId,i.brandId,i)}>
            <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14,color:"#2a2018"}}>{i.name}</div><div style={{fontSize:11,color:"#9a8f82",marginTop:2}}>{i.catName} / {i.brandName}</div></div>
            <div style={{textAlign:"right"}}><div className={`snum ${i.stock===0?"scrit":"slow"}`}>{i.stock}</div><div style={{fontSize:10,color:"#9a8f82"}}>最低{i.minStock}</div></div>
          </div>))}

          {mainTab==="stock"&&displayBrands.map(brand=>(
            <div key={brand.id} style={{background:"#faf7f2",border:"1px solid #e8e2d8",borderRadius:12,padding:"12px 14px",marginBottom:12}}>
              <div style={{fontFamily:"'Shippori Mincho',serif",fontWeight:700,fontSize:13,color:"#2563a8",marginBottom:10}}>{brand.catName&&selectedCatId==="all"?`${brand.catName} / `:""}{brand.name}</div>
              {(brand.items||[]).sort((a,b)=>a.order-b.order).map(item=>{
                const low=item.stock<=item.minStock; const crit=item.stock===0;
                const sc=crit?"scrit":low?"slow":"sok";
                return (
                  <div key={item.id} className="irow" style={{marginBottom:6}} onClick={()=>openDetail(brand.catId,brand.id,item)}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:14,color:"#2a2018"}}>{item.name}</div>
                      {(item.retailPrice||item.costPrice)&&<div style={{fontSize:11,color:"#9a8f82",marginTop:2}}>定価 ¥{(item.retailPrice||0).toLocaleString()} ／ 仕入 ¥{(item.costPrice||0).toLocaleString()}</div>}
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div className={`snum ${sc}`}>{item.stock}</div>
                      <div style={{fontSize:10,color:"#9a8f82"}}>最低{item.minStock}</div>
                    </div>
                    {crit&&<span className="tag tcrit">欠品</span>}
                    {!crit&&low&&<span className="tag tlow">残少</span>}
                  </div>
                );
              })}
              {(brand.items||[]).length===0&&<div style={{fontSize:12,color:"#c8bfb0",padding:"8px 0"}}>商品がありません</div>}
            </div>
          ))}
        </main>

        {/* 在庫詳細・数量変更モーダル */}
        {itemDetail&&(
          <div style={{position:"fixed",inset:0,background:"rgba(42,32,24,.42)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,backdropFilter:"blur(4px)"}}>
            <div style={{background:"#faf7f2",border:"1px solid #ddd6ca",borderRadius:16,padding:"20px 16px",width:"calc(100vw - 32px)",maxWidth:420}}>
              <h3 style={{fontFamily:"'Shippori Mincho',serif",fontSize:17,fontWeight:700,color:"#2a2018",marginBottom:18}}>{itemDetail.item.name}</h3>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:20,marginBottom:24}}>
                <button className="big-adj dec" onClick={()=>setDetailStock(s=>Math.max(0,s-1))}>－</button>
                <div style={{textAlign:"center"}}><div style={{fontFamily:"'DM Mono',monospace",fontSize:40,fontWeight:500,color:"#2a2018",lineHeight:1}}>{detailStock}</div><div style={{fontSize:11,color:"#9a8f82",marginTop:4}}>最低 {itemDetail.item.minStock}</div></div>
                <button className="big-adj inc" onClick={()=>setDetailStock(s=>s+1)}>＋</button>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="gbtn" style={{flex:1}} onClick={()=>{setItemDetail(null);openEditItem(itemDetail.catId,itemDetail.brandId,itemDetail.item);}}>✏ 詳細編集</button>
                <button className="gbtn" style={{flex:1}} onClick={()=>setItemDetail(null)}>キャンセル</button>
                <button className="pbtn" style={{flex:2}} onClick={confirmStock}>保存</button>
              </div>
            </div>
          </div>
        )}

        {/* 商品詳細編集 */}
        {editItemModal&&(
          <div style={{position:"fixed",inset:0,background:"rgba(42,32,24,.42)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,backdropFilter:"blur(4px)"}}>
            <div style={{background:"#faf7f2",border:"1px solid #ddd6ca",borderRadius:16,padding:"20px 16px",width:"calc(100vw - 32px)",maxWidth:420}}>
              <h3 style={{fontFamily:"'Shippori Mincho',serif",fontSize:17,fontWeight:700,color:"#2a2018",marginBottom:18}}>商品を編集</h3>
              <div className="fg"><label>商品名</label><input value={editItemF.name} onChange={e=>setEditItemF(p=>({...p,name:e.target.value}))} style={{width:"100%",background:"#f5f0e8",border:"1px solid #ccc5ba",borderRadius:8,padding:"9px 11px",color:"#2a2018",fontFamily:"'Noto Sans JP',sans-serif",outline:"none"}}/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div className="fg"><label>在庫数</label><input type="number" value={editItemF.stock} onChange={e=>setEditItemF(p=>({...p,stock:e.target.value}))} style={{width:"100%",background:"#f5f0e8",border:"1px solid #ccc5ba",borderRadius:8,padding:"9px 11px",color:"#2a2018",fontFamily:"'Noto Sans JP',sans-serif",outline:"none"}}/></div>
                <div className="fg"><label>注文ライン</label><input type="number" value={editItemF.minStock} onChange={e=>setEditItemF(p=>({...p,minStock:e.target.value}))} style={{width:"100%",background:"#f5f0e8",border:"1px solid #ccc5ba",borderRadius:8,padding:"9px 11px",color:"#2a2018",fontFamily:"'Noto Sans JP',sans-serif",outline:"none"}}/></div>
                <div className="fg"><label>定価（円）</label><input type="number" value={editItemF.retailPrice} onChange={e=>setEditItemF(p=>({...p,retailPrice:e.target.value}))} style={{width:"100%",background:"#f5f0e8",border:"1px solid #ccc5ba",borderRadius:8,padding:"9px 11px",color:"#2a2018",fontFamily:"'Noto Sans JP',sans-serif",outline:"none"}}/></div>
                <div className="fg"><label>仕入値（円）</label><input type="number" value={editItemF.costPrice} onChange={e=>setEditItemF(p=>({...p,costPrice:e.target.value}))} style={{width:"100%",background:"#f5f0e8",border:"1px solid #ccc5ba",borderRadius:8,padding:"9px 11px",color:"#2a2018",fontFamily:"'Noto Sans JP',sans-serif",outline:"none"}}/></div>
              </div>
              <div style={{display:"flex",gap:8,marginTop:8}}>
                <button className="gbtn" style={{flex:1}} onClick={()=>setEditItemModal(null)}>キャンセル</button>
                <button className="pbtn" style={{flex:2}} onClick={doEditItem}>保存</button>
              </div>
            </div>
          </div>
        )}

        {/* 追加モーダル群 */}
        {addModal==="cat"&&(
          <div style={{position:"fixed",inset:0,background:"rgba(42,32,24,.42)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,backdropFilter:"blur(4px)"}}>
            <div style={{background:"#faf7f2",border:"1px solid #ddd6ca",borderRadius:16,padding:"20px 16px",width:"calc(100vw - 32px)",maxWidth:400}}>
              <h3 style={{fontFamily:"'Shippori Mincho',serif",fontSize:17,fontWeight:700,color:"#2a2018",marginBottom:18}}>カテゴリを追加</h3>
              <div className="fg"><label>カテゴリ名</label><input value={newCatF} onChange={e=>setNewCatF(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doAddCat()} autoFocus style={{width:"100%",background:"#f5f0e8",border:"1px solid #ccc5ba",borderRadius:8,padding:"9px 11px",color:"#2a2018",fontFamily:"'Noto Sans JP',sans-serif",outline:"none"}}/></div>
              <div style={{display:"flex",gap:8}}><button className="gbtn" onClick={()=>setAddModal(null)}>キャンセル</button><button className="pbtn" style={{flex:1}} onClick={doAddCat}>追加</button></div>
            </div>
          </div>
        )}
        {addModal==="brand"&&(
          <div style={{position:"fixed",inset:0,background:"rgba(42,32,24,.42)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,backdropFilter:"blur(4px)"}}>
            <div style={{background:"#faf7f2",border:"1px solid #ddd6ca",borderRadius:16,padding:"20px 16px",width:"calc(100vw - 32px)",maxWidth:400}}>
              <h3 style={{fontFamily:"'Shippori Mincho',serif",fontSize:17,fontWeight:700,color:"#2a2018",marginBottom:18}}>ブランドを追加</h3>
              <div className="fg"><label>カテゴリ</label><select value={newBrandF.catId} onChange={e=>setNewBrandF(p=>({...p,catId:e.target.value}))} style={{width:"100%",background:"#f5f0e8",border:"1px solid #ccc5ba",borderRadius:8,padding:"9px 11px",color:"#2a2018",fontFamily:"'Noto Sans JP',sans-serif",outline:"none",WebkitAppearance:"none"}}><option value="">選択してください</option>{sortedCats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div className="fg"><label>ブランド名</label><input value={newBrandF.name} onChange={e=>setNewBrandF(p=>({...p,name:e.target.value}))} autoFocus style={{width:"100%",background:"#f5f0e8",border:"1px solid #ccc5ba",borderRadius:8,padding:"9px 11px",color:"#2a2018",fontFamily:"'Noto Sans JP',sans-serif",outline:"none"}}/></div>
              <div style={{display:"flex",gap:8}}><button className="gbtn" onClick={()=>setAddModal(null)}>キャンセル</button><button className="pbtn" style={{flex:1}} onClick={doAddBrand}>追加</button></div>
            </div>
          </div>
        )}
        {addModal==="item"&&(
          <div style={{position:"fixed",inset:0,background:"rgba(42,32,24,.42)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,backdropFilter:"blur(4px)"}}>
            <div style={{background:"#faf7f2",border:"1px solid #ddd6ca",borderRadius:16,padding:"20px 16px",width:"calc(100vw - 32px)",maxWidth:420,maxHeight:"90vh",overflowY:"auto"}}>
              <h3 style={{fontFamily:"'Shippori Mincho',serif",fontSize:17,fontWeight:700,color:"#2a2018",marginBottom:18}}>商品を追加</h3>
              <div className="fg"><label>カテゴリ</label><select value={newItemF.catId} onChange={e=>setNewItemF(p=>({...p,catId:e.target.value,brandId:""}))} style={{width:"100%",background:"#f5f0e8",border:"1px solid #ccc5ba",borderRadius:8,padding:"9px 11px",color:"#2a2018",fontFamily:"'Noto Sans JP',sans-serif",outline:"none",WebkitAppearance:"none"}}><option value="">選択してください</option>{sortedCats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              {newItemF.catId&&<div className="fg"><label>ブランド</label><select value={newItemF.brandId} onChange={e=>setNewItemF(p=>({...p,brandId:e.target.value}))} style={{width:"100%",background:"#f5f0e8",border:"1px solid #ccc5ba",borderRadius:8,padding:"9px 11px",color:"#2a2018",fontFamily:"'Noto Sans JP',sans-serif",outline:"none",WebkitAppearance:"none"}}><option value="">選択してください</option>{(cats.find(c=>c.id===newItemF.catId)?.brands||[]).map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div>}
              <div className="fg"><label>商品名</label><input value={newItemF.name} onChange={e=>setNewItemF(p=>({...p,name:e.target.value}))} autoFocus style={{width:"100%",background:"#f5f0e8",border:"1px solid #ccc5ba",borderRadius:8,padding:"9px 11px",color:"#2a2018",fontFamily:"'Noto Sans JP',sans-serif",outline:"none"}}/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div className="fg"><label>在庫数</label><input type="number" value={newItemF.stock} onChange={e=>setNewItemF(p=>({...p,stock:e.target.value}))} style={{width:"100%",background:"#f5f0e8",border:"1px solid #ccc5ba",borderRadius:8,padding:"9px 11px",color:"#2a2018",fontFamily:"'Noto Sans JP',sans-serif",outline:"none"}}/></div>
                <div className="fg"><label>注文ライン</label><input type="number" value={newItemF.minStock} onChange={e=>setNewItemF(p=>({...p,minStock:e.target.value}))} style={{width:"100%",background:"#f5f0e8",border:"1px solid #ccc5ba",borderRadius:8,padding:"9px 11px",color:"#2a2018",fontFamily:"'Noto Sans JP',sans-serif",outline:"none"}}/></div>
                <div className="fg"><label>定価（円）</label><input type="number" value={newItemF.retailPrice} onChange={e=>setNewItemF(p=>({...p,retailPrice:e.target.value}))} style={{width:"100%",background:"#f5f0e8",border:"1px solid #ccc5ba",borderRadius:8,padding:"9px 11px",color:"#2a2018",fontFamily:"'Noto Sans JP',sans-serif",outline:"none"}}/></div>
                <div className="fg"><label>仕入値（円）</label><input type="number" value={newItemF.costPrice} onChange={e=>setNewItemF(p=>({...p,costPrice:e.target.value}))} style={{width:"100%",background:"#f5f0e8",border:"1px solid #ccc5ba",borderRadius:8,padding:"9px 11px",color:"#2a2018",fontFamily:"'Noto Sans JP',sans-serif",outline:"none"}}/></div>
              </div>
              <div style={{display:"flex",gap:8,marginTop:8}}><button className="gbtn" onClick={()=>setAddModal(null)}>キャンセル</button><button className="pbtn" style={{flex:1}} onClick={doAddItem}>追加</button></div>
            </div>
          </div>
        )}

        {/* 合計サマリー */}
        {showSummary&&(
          <div style={{position:"fixed",inset:0,background:"rgba(42,32,24,.42)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,backdropFilter:"blur(4px)"}}>
            <div style={{background:"#faf7f2",border:"1px solid #ddd6ca",borderRadius:16,padding:"20px 16px",width:"calc(100vw - 32px)",maxWidth:420,maxHeight:"80vh",overflowY:"auto"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h3 style={{fontFamily:"'Shippori Mincho',serif",fontSize:17,fontWeight:700,color:"#2a2018"}}>在庫サマリー</h3><button onClick={()=>setShowSummary(false)} style={{background:"#e8e2d8",border:"none",cursor:"pointer",borderRadius:9,padding:8,display:"flex",color:"#7a6f63"}}><Ico.X/></button></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                <div style={{background:"#f5f0e8",borderRadius:10,padding:"12px"}}><div style={{fontSize:11,color:"#9a8f82",marginBottom:4}}>定価合計</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:18,fontWeight:500,color:"#2a2018"}}>¥{summary.total.retail.toLocaleString()}</div></div>
                <div style={{background:"#f5f0e8",borderRadius:10,padding:"12px"}}><div style={{fontSize:11,color:"#9a8f82",marginBottom:4}}>仕入合計</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:18,fontWeight:500,color:"#2a2018"}}>¥{summary.total.cost.toLocaleString()}</div></div>
              </div>
              {Object.values(summary.byCat).map(c=>(
                <div key={c.name} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid #f0ece4",fontSize:13}}>
                  <span style={{color:"#2a2018",fontWeight:600}}>{c.name}</span>
                  <span style={{color:"#9a8f82",fontFamily:"'DM Mono',monospace"}}>¥{c.retail.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 検索オーバーレイ */}
        {searchOpen&&(
          <div style={{position:"fixed",inset:0,background:"rgba(42,32,24,.4)",zIndex:950,display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:60,backdropFilter:"blur(4px)"}}>
            <div style={{background:"#faf7f2",border:"1px solid #ddd6ca",borderRadius:16,padding:16,width:420,maxWidth:"93vw",maxHeight:"70vh",overflowY:"auto"}}>
              <div style={{display:"flex",gap:8,marginBottom:12}}>
                <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} autoFocus placeholder="商品名を検索…" style={{flex:1,background:"#f5f0e8",border:"1px solid #ccc5ba",borderRadius:8,padding:"9px 11px",color:"#2a2018",fontFamily:"'Noto Sans JP',sans-serif",outline:"none"}}/>
                <button onClick={()=>setSearchOpen(false)} style={{background:"#e8e2d8",border:"none",cursor:"pointer",borderRadius:9,padding:"9px 12px",color:"#7a6f63",fontFamily:"'Noto Sans JP',sans-serif",fontWeight:600}}>閉じる</button>
              </div>
              {stockSearch.map(item=>{ const low=item.stock<=item.minStock; const crit=item.stock===0; const sc=crit?"scrit":low?"slow":"sok"; return <div key={item.id} className="irow" style={{marginBottom:6}} onClick={()=>{setSelectedCatId(item.catId);setMainTab("stock");setSearchOpen(false);openDetail(item.catId,item.brandId,item);}}>
                <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14,color:"#2a2018"}}>{item.name}</div><div style={{fontSize:11,color:"#9a8f82"}}>{item.catName} / {item.brandName}</div></div>
                <div className={`snum ${sc}`}>{item.stock}</div>
              </div>; })}
              {searchQ&&stockSearch.length===0&&<p style={{color:"#c8bfb0",fontSize:13,textAlign:"center",padding:"20px 0"}}>見つかりません</p>}
            </div>
          </div>
        )}

        {/* 設定パネル */}
        {stOpen&&(
          <div onClick={e=>e.target===e.currentTarget&&setStOpen(false)} style={{position:"fixed",inset:0,background:"rgba(42,32,24,.28)",zIndex:900,display:"flex",justifyContent:"flex-end"}}>
            <div style={{background:"#faf7f2",width:"min(300px,92vw)",height:"100%",overflowY:"auto",padding:"20px 16px",boxShadow:"-4px 0 28px rgba(42,32,24,.13)",animation:"sin .22s cubic-bezier(.22,1,.36,1)"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                <span style={{fontFamily:"'Shippori Mincho',serif",fontWeight:700,fontSize:16,color:"#2a2018"}}>⚙️ 設定</span>
                <button onClick={()=>setStOpen(false)} style={{background:"#e8e2d8",border:"none",cursor:"pointer",borderRadius:9,padding:8,display:"flex",color:"#7a6f63"}}><Ico.X/></button>
              </div>
              <div style={{display:"flex",background:"#f0ece4",borderRadius:9,padding:3,marginBottom:14}}>
                {["cats","brands","items"].map(t=><button key={t} className={`sttab ${stTab===t?"sttabon":""}`} onClick={()=>{setStTab(t);setRnCat(null);setRnBrand(null);setRnItem(null);}}>{t==="cats"?"カテゴリ":t==="brands"?"ブランド":"商品"}</button>)}
              </div>
              {stTab==="cats"&&(<><p style={{fontSize:11,color:"#b0a898",marginBottom:11}}>↑↓ 順番変更　✏ 名前変更　🗑 削除</p>{sortedCats.map((cat,idx)=><div key={cat.id} className="strow">{rnCat===cat.id?<input className="rninput" value={rnCatV} onChange={e=>setRnCatV(e.target.value)} autoFocus onBlur={()=>commitRnCat(cat.id)} onKeyDown={e=>{if(e.key==="Enter")commitRnCat(cat.id);if(e.key==="Escape")setRnCat(null);}}/>:<span style={{flex:1,fontWeight:600,color:"#2a2018",fontSize:14}}>{cat.name}<span style={{color:"#b0a898",fontWeight:400,fontSize:11,marginLeft:5}}>{(cat.brands||[]).length}ブランド</span></span>}<div style={{display:"flex",gap:4}}><button className="sico" onClick={()=>moveCat(cat.id,-1)} disabled={idx===0}><Ico.Up/></button><button className="sico" onClick={()=>moveCat(cat.id,1)} disabled={idx===sortedCats.length-1}><Ico.Down/></button><button className="sico sedit" onClick={()=>{setRnCat(cat.id);setRnCatV(cat.name);}}><Ico.Edit/></button><button className="sico sdel" onClick={()=>delCat(cat.id)}><Ico.Trash/></button></div></div>)}</>)}
              {stTab==="brands"&&(<><div style={{marginBottom:14}}><p style={{fontSize:11,color:"#b0a898",marginBottom:8}}>カテゴリを選択</p><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{sortedCats.map(c=><button key={c.id} className={`chip ${stCatId===c.id?"chipon":""}`} onClick={()=>{setStCatId(c.id);setRnBrand(null);}}>{c.name}</button>)}</div></div>{stCatId?<>{sortedStBrands.map((brand,idx)=><div key={brand.id} className="strow">{rnBrand===brand.id?<input className="rninput" value={rnBrandV} onChange={e=>setRnBrandV(e.target.value)} autoFocus onBlur={()=>commitRnBrand(stCatId,brand.id)} onKeyDown={e=>{if(e.key==="Enter")commitRnBrand(stCatId,brand.id);if(e.key==="Escape")setRnBrand(null);}}/>:<span style={{flex:1,fontWeight:600,color:"#2a2018",fontSize:13}}>{brand.name}</span>}<div style={{display:"flex",gap:4}}><button className="sico" onClick={()=>moveBrand(stCatId,brand.id,-1)} disabled={idx===0}><Ico.Up/></button><button className="sico" onClick={()=>moveBrand(stCatId,brand.id,1)} disabled={idx===sortedStBrands.length-1}><Ico.Down/></button><button className="sico sedit" onClick={()=>{setRnBrand(brand.id);setRnBrandV(brand.name);}}><Ico.Edit/></button><button className="sico sdel" onClick={()=>delBrand(stCatId,brand.id)}><Ico.Trash/></button></div></div>)}</>:<p style={{color:"#c8bfb0",fontSize:13}}>カテゴリを選んでください</p>}</>)}
              {stTab==="items"&&(<><div style={{marginBottom:10}}><div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>{sortedCats.map(c=><button key={c.id} className={`chip ${stCatId===c.id?"chipon":""}`} onClick={()=>{setStCatId(c.id);setStBrandId(null);setRnItem(null);}}>{c.name}</button>)}</div>{stCatId&&<div style={{display:"flex",flexWrap:"wrap",gap:6}}>{sortedStBrands.map(b=><button key={b.id} className={`chip ${stBrandId===b.id?"chipon":""}`} onClick={()=>{setStBrandId(b.id);setRnItem(null);}}>{b.name}</button>)}</div>}</div>{stBrandId?sortedStItems.map((item,idx)=>{ const rk=`${stBrandId}:${item.id}`; return <div key={item.id} className="strow">{rnItem===rk?<input className="rninput" value={rnItemV} onChange={e=>setRnItemV(e.target.value)} autoFocus onBlur={()=>commitRnItem(stCatId,stBrandId,item.id)} onKeyDown={e=>{if(e.key==="Enter")commitRnItem(stCatId,stBrandId,item.id);if(e.key==="Escape")setRnItem(null);}}/>:<span style={{flex:1,fontWeight:600,color:"#2a2018",fontSize:13}}>{item.name}<span style={{color:"#b0a898",fontWeight:400,fontSize:11,marginLeft:5}}>在庫:{item.stock}</span></span>}<div style={{display:"flex",gap:4}}><button className="sico" onClick={()=>moveItem(stCatId,stBrandId,item.id,-1)} disabled={idx===0}><Ico.Up/></button><button className="sico" onClick={()=>moveItem(stCatId,stBrandId,item.id,1)} disabled={idx===sortedStItems.length-1}><Ico.Down/></button><button className="sico sedit" onClick={()=>{setRnItem(rk);setRnItemV(item.name);}}><Ico.Edit/></button><button className="sico" style={{background:"#e8f0d6",color:"#2d7a44",border:"1px solid #c8e0b0",fontSize:13}} onClick={()=>{setStOpen(false);openEditItem(stCatId,stBrandId,item);}}>📝</button><button className="sico sdel" onClick={()=>delItem(stCatId,stBrandId,item.id)}><Ico.Trash/></button></div></div>; }):<p style={{color:"#c8bfb0",fontSize:13,paddingTop:6}}>{stCatId?"ブランドを選んでください":"カテゴリを選んでください"}</p>}</>)}
            </div>
          </div>
        )}

        <BottomNav/>
      </div>
    );
  }

  // ── フォールバック（homeへ） ──
  return null;
}


const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@600;700&family=Noto+Sans+JP:wght@400;500;700&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #faf8f4; font-family: 'Noto Sans JP', sans-serif; color: #2a2018; -webkit-font-smoothing: antialiased; }
  input, select, textarea { font-size: 16px !important; }
  ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #ede8df; } ::-webkit-scrollbar-thumb { background: #c8bfb0; border-radius: 2px; }
  .hide-scroll::-webkit-scrollbar { display: none; }
  .spin { width: 36px; height: 36px; border: 3px solid #e0d9ce; border-top-color: #2a2018; border-radius: 50%; animation: rot .7s linear infinite; }
  @keyframes rot { to { transform: rotate(360deg); } }
  @keyframes su { from { transform: translateY(100%); } to { transform: translateY(0); } }
  @keyframes sin { from { transform: translateX(100%); } to { transform: translateX(0); } }
  .pbtn { background: #2a2018; color: #faf8f4; font-weight: 700; padding: 9px 22px; font-size: 13px; border-radius: 8px; border: none; cursor: pointer; font-family: 'Noto Sans JP', sans-serif; }
  .gbtn { background: #e8e2d8; color: #7a6f63; font-weight: 600; padding: 9px 18px; font-size: 13px; border-radius: 8px; border: none; cursor: pointer; font-family: 'Noto Sans JP', sans-serif; }
  .gbtn:hover { background: #ddd6ca; color: #2a2018; }
  .cat-tab { background: none; border: none; cursor: pointer; font-family: 'Noto Sans JP', sans-serif; font-size: 13px; font-weight: 700; padding: 6px 14px; border-radius: 20px; color: #c8bfb0; transition: all .15s; white-space: nowrap; display: inline-flex; align-items: center; gap: 4px; }
  .cat-tab:hover { color: #7a6f63; background: #f0ece4; }
  .cat-tab-on { background: #2a2018; color: #faf8f4 !important; }
  .cat-tab-order { background: #fdf0ee; color: #c0392b !important; border: 1px solid #f0c8c4; }
  .add-chip { background: #f5f0e8; border: 1.5px solid #e0d9ce; border-radius: 20px; padding: 7px 16px; font-size: 13px; font-family: 'Noto Sans JP', sans-serif; font-weight: 700; color: #2a2018; cursor: pointer; }
  .add-chip:hover { background: #2a2018; color: #f5f0e8; border-color: #2a2018; }
  .irow { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 10px; background: #fff; border: 1px solid #e8e2d8; margin-bottom: 6px; cursor: pointer; transition: border-color .12s, box-shadow .12s; }
  .irow:hover { border-color: #c8bfb0; box-shadow: 0 2px 10px rgba(42,32,24,.09); }
  .snum { font-family: 'DM Mono', monospace; font-weight: 700; font-size: 22px; }
  .sok { color: #2d7a44; } .slow { color: #c87a00; } .scrit { color: #c0392b; }
  .tag { font-size: 10px; padding: 2px 7px; border-radius: 5px; font-family: 'Noto Sans JP', sans-serif; font-weight: 700; flex-shrink: 0; }
  .tlow { background: #c87a0015; color: #c87a00; border: 1px solid #c87a0040; }
  .tcrit { background: #c0392b15; color: #c0392b; border: 1px solid #c0392b40; }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: #c0392b; display: inline-block; animation: pulse 1.5s infinite; flex-shrink: 0; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
  .big-adj { width: 56px; height: 56px; border-radius: 50%; border: none; cursor: pointer; font-size: 28px; font-weight: 700; display: flex; align-items: center; justify-content: center; font-family: 'Noto Sans JP', sans-serif; }
  .big-adj.dec { background: #f0d9d6; color: #c0392b; }
  .big-adj.inc { background: #d6ead9; color: #2d7a44; }
  .fg { margin-bottom: 13px; }
  .fg label { display: block; font-size: 11px; color: #9a8f82; margin-bottom: 5px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
  .fg input, .fg select, .fg textarea { width: 100%; max-width: 100%; box-sizing: border-box; background: #f5f0e8; border: 1px solid #ccc5ba; border-radius: 8px; padding: 9px 11px; color: #2a2018; font-family: 'Noto Sans JP', sans-serif; outline: none; display: block; }
  .stover { position: fixed; inset: 0; background: rgba(42,32,24,.28); z-index: 900; display: flex; justify-content: flex-end; }
  .stpanel { background: #faf7f2; width: min(300px, 92vw); max-width: 92vw; height: 100%; overflow-y: auto; padding: 20px 16px; box-shadow: -4px 0 28px rgba(42,32,24,.13); animation: sin .22s cubic-bezier(.22,1,.36,1); }
  .sttab { flex: 1; background: none; border: none; cursor: pointer; font-family: 'Noto Sans JP', sans-serif; font-size: 12px; font-weight: 700; padding: 8px 0; border-radius: 7px; color: #9a8f82; }
  .sttabon { background: #faf7f2; color: #2a2018; box-shadow: 0 1px 4px rgba(42,32,24,.09); }
  .strow { display: flex; align-items: center; gap: 7px; padding: 9px 11px; border-radius: 9px; background: #f5f0e8; border: 1px solid #e8e2d8; margin-bottom: 6px; min-height: 48px; }
  .sico { background: #f0ece4; border: 1px solid #e0d9ce; cursor: pointer; border-radius: 6px; padding: 5px; display: flex; align-items: center; justify-content: center; color: #9a8f82; font-size: 13px; flex-shrink: 0; }
  .sico:hover { background: #e8e2d8; color: #2a2018; }
  .sico:disabled { opacity: .22; cursor: not-allowed; }
  .sedit:hover { background: #d6e4f0; color: #2563a8; }
  .sdel:hover { background: #f0d9d6; color: #c0392b; }
  .rninput { flex: 1; background: #fff; border: 1.5px solid #2a2018; border-radius: 6px; padding: 5px 9px; font-family: 'Noto Sans JP', sans-serif; color: #2a2018; outline: none; }
  .chip { background: #e8e2d8; border: 1.5px solid transparent; border-radius: 20px; padding: 5px 13px; font-family: 'Noto Sans JP', sans-serif; font-size: 12px; font-weight: 700; color: #7a6f63; cursor: pointer; }
  .chipon { background: #2a2018; color: #f5f0e8; border-color: #2a2018; }
  @media (max-width: 520px) {
    .fg input, .fg select, .fg textarea { min-width: 0; }
  }
`;
