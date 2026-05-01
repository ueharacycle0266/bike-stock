import { useState, useMemo, useCallback } from "react";

const SUPABASE_URL = "https://autpzeeprcyosyqegtai.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1dHB6ZWVwcmN5b3N5cWVndGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNTEwMDUsImV4cCI6MjA5MjgyNzAwNX0.YWH6PvFYu2n2BN5aWQZ8KaPKv4Ns4K_ObfyK28Gdq18";
const PASSWORD = "0266";
const STAFF = ["あさと", "たけし"];
const HOURS = Array.from({length:22}, (_,i) => { const h=Math.floor(i/2)+9, m=i%2===0?"00":"30"; return `${h}:${m}`; });

const api = async (path, method="GET", body=null) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: { "apikey":SUPABASE_KEY, "Authorization":`Bearer ${SUPABASE_KEY}`, "Content-Type":"application/json", "Prefer":method==="POST"?"return=representation":"return=minimal" },
    body: body ? JSON.stringify(body) : null,
  });
  if (method==="GET"||method==="POST") return res.json();
  return res;
};

const uid = () => "x"+Math.random().toString(36).slice(2,9);
const toKatakana = s => s.replace(/[\u3041-\u3096]/g, c => String.fromCharCode(c.charCodeAt(0)+0x60));
const fmt = (dt,mode="short") => {
  if (!dt) return "";
  const d = new Date(dt);
  if (mode==="short") return `${d.getMonth()+1}/${d.getDate()}`;
  if (mode==="mmdd") return `${d.getMonth()+1}/${d.getDate()}`;
  if (mode==="full") return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  if (mode==="date") return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  return "";
};
const getDayLabel = (d) => ["日","月","火","水","木","金","土"][d.getDay()];
const exportCSV = (cats) => {
  const rows = [["カテゴリ","ブランド","商品名","在庫数","注文ライン","定価","仕入れ","在庫定価合計","在庫仕入合計"]];
  cats.forEach(c => c.brands?.forEach(b => b.items?.forEach(i => rows.push([c.name,b.name,i.name,i.stock,i.minStock,i.retailPrice||0,i.costPrice||0,(i.retailPrice||0)*i.stock,(i.costPrice||0)*i.stock]))));
  const blob = new Blob(["\uFEFF"+rows.map(r=>r.map(v=>`"${v}"`).join(",")).join("\n")],{type:"text/csv;charset=utf-8;"});
  const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`在庫_${fmt(new Date(),"date")}.csv`; a.click();
};

const Ico = {
  Settings:()=>(<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>),
  Search:()=>(<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>),
  Plus:()=>(<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>),
  Refresh:()=>(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>),
  X:()=>(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>),
  Up:()=>(<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>),
  Down:()=>(<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>),
  Edit:()=>(<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>),
  Trash:()=>(<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>),
  ChevDown:()=>(<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>),
  ChevLeft:()=>(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>),
  ChevRight:()=>(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>),
  Download:()=>(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>),
  Chart:()=>(<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>),
  Back:()=>(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>),
  Calendar:()=>(<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>),
  List:()=>(<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>),
  Bike:()=>(<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 0 0-1-1h-1l-4 8"/><path d="M12 6l4 8H5.5"/></svg>),
};

export default function App() {
  const [screen, setScreen] = useState("login");
  const [pwVal, setPwVal] = useState(""); const [pwErr, setPwErr] = useState(false);
  const [appMode, setAppMode] = useState("stock");
  const [modeMenu, setModeMenu] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── 在庫 ──
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

  // ── 顧客 ──
  const [customers, setCustomers] = useState([]);
  const [custLoaded, setCustLoaded] = useState(false);
  const [custLoading, setCustLoading] = useState(false);
  const [custSearch, setCustSearch] = useState("");
  const [custDetail, setCustDetail] = useState(null);
  const [bikeDetail, setBikeDetail] = useState(null); // {cust, bikeIdx}
  const [addCustModal, setAddCustModal] = useState(false);
  const [editCustModal, setEditCustModal] = useState(null);
  const [newCust, setNewCust] = useState({name:"",furigana:"",phone:"",address:"",memo:""});
  const [makerMaster, setMakerMaster] = useState([]);
  const [newBikeF, setNewBikeF] = useState({maker:"",color:""});
  const [stCustOpen, setStCustOpen] = useState(false);
  const [newMakerF, setNewMakerF] = useState("");
  const [rnMaker, setRnMaker] = useState(null); const [rnMakerV, setRnMakerV] = useState("");

  // ── 修理メニュー ──
  const [repairMenus, setRepairMenus] = useState([]);
  const [editMenuOpen, setEditMenuOpen] = useState(false);
  const [newMenuF, setNewMenuF] = useState({name:"",price:""});

  // ── 見積もり ──
  const [estimates, setEstimates] = useState([]); // 全見積もり
  const [addEstModal, setAddEstModal] = useState(null); // {custId, bikeIdx}
  const [editEstModal, setEditEstModal] = useState(null); // estimate obj
  const [estItems, setEstItems] = useState([]); // [{menuId, qty}]
  const [estMemo, setEstMemo] = useState("");

  // ── 予約 ──
  const [reservations, setReservations] = useState([]);
  const [calDate, setCalDate] = useState(() => { const d=new Date(); d.setHours(0,0,0,0); return d; });
  const [calView, setCalView] = useState("week"); // week | list
  const [addResModal, setAddResModal] = useState(null); // {date, time} or null
  const [resForm, setResForm] = useState({custId:"",bikeIdx:0,checkinDate:"",dueDate:"",dueDateUnknown:false,staff:"あさと",memo:""});
  const [resCustSearch, setResCustSearch] = useState("");
  const [selectedRes, setSelectedRes] = useState(null);

  // ── データ取得 ──
  const loadStock = async () => {
    try {
      const [cD,bD,iD] = await Promise.all([api("categories?select=*&order=order.asc"),api("brands?select=*&order=order.asc"),api("items?select=*&order=order.asc")]);
      setCats(cD.map(c=>({...c,brands:bD.filter(b=>b.category_id===c.id).map(b=>({...b,items:iD.filter(i=>i.brand_id===b.id).map(i=>({id:i.id,name:i.name,stock:i.stock,minStock:i.min_stock,retailPrice:i.retail_price,costPrice:i.cost_price,order:i.order})).sort((a,b)=>a.order-b.order)})).sort((a,b)=>a.order-b.order)})));
    } catch(e){console.error(e);}
    setScreen("main");
  };

  const loadCustomers = async () => {
    setCustLoading(true);
    try {
      const data = await api("customers?select=*&order=created_at.desc");
      if (Array.isArray(data)) {
        setCustomers(data.map(c=>({...c,bikes:c.bikes||[]})));
        setCustLoaded(true);
      }
    } catch(e){console.error(e);}
    setCustLoading(false);
  };

  const loadMasters = async () => {
    try {
      const [menus, makers] = await Promise.all([
        api("repair_menus?select=*&order=order.asc"),
        api("maker_master?select=*&order=order.asc").catch(()=>[]),
      ]);
      setRepairMenus(menus||[]);
      setMakerMaster(makers||[]);
    } catch(e){console.error(e);}
  };

  const loadEstimates = async () => {
    try {
      const data = await api("estimates?select=*&order=created_at.desc").catch(()=>[]);
      setEstimates(data||[]);
    } catch(e){console.error(e);}
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

  const switchMode = async (mode) => {
    setAppMode(mode); setModeMenu(false);
    if (mode==="customer" && !custLoaded) { await Promise.all([loadCustomers(),loadMasters(),loadEstimates()]); }
    if (mode==="reservation") { await Promise.all([loadReservations(), !custLoaded&&loadCustomers()]); }
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

  // ── 在庫ハンドラ ──
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
  const doAddCust=async()=>{ if(!newCust.name.trim()) return; const id=uid(); const furi=toKatakana(newCust.furigana||""); const obj={id,...newCust,furigana:furi,bikes:[],created_at:new Date().toISOString()}; setCustomers(p=>[obj,...p]); setNewCust({name:"",furigana:"",phone:"",address:"",memo:""}); setAddCustModal(false); await api("customers","POST",{id,name:newCust.name.trim(),furigana:furi||null,phone:newCust.phone||null,address:newCust.address||null,memo:newCust.memo||null,bikes:[]}); };
  const doEditCust=async()=>{ if(!editCustModal||!editCustModal.name.trim()) return; const furi=toKatakana(editCustModal.furigana||""); const upd={...editCustModal,furigana:furi}; setCustomers(p=>p.map(c=>c.id===upd.id?{...c,...upd}:c)); if(custDetail?.id===upd.id) setCustDetail(prev=>({...prev,...upd})); const id=upd.id; setEditCustModal(null); await api(`customers?id=eq.${id}`,"PATCH",{name:upd.name,furigana:furi||null,phone:upd.phone||null,address:upd.address||null,memo:upd.memo||null,bikes:upd.bikes||[]}); };
  const delCust=async(id)=>{ if(!window.confirm("削除しますか？")) return; setCustomers(p=>p.filter(c=>c.id!==id)); setCustDetail(null); await api(`customers?id=eq.${id}`,"DELETE"); };
  const addBike=async()=>{ if(!newBikeF.maker.trim()||!custDetail) return; const bikes=[...(custDetail.bikes||[]),{maker:newBikeF.maker,color:newBikeF.color}]; setCustDetail(p=>({...p,bikes})); setCustomers(p=>p.map(c=>c.id===custDetail.id?{...c,bikes}:c)); setNewBikeF({maker:"",color:""}); await api(`customers?id=eq.${custDetail.id}`,"PATCH",{bikes}); };
  const delBike=async(idx)=>{ const bikes=(custDetail.bikes||[]).filter((_,i)=>i!==idx); setCustDetail(p=>({...p,bikes})); setCustomers(p=>p.map(c=>c.id===custDetail.id?{...c,bikes}:c)); await api(`customers?id=eq.${custDetail.id}`,"PATCH",{bikes}); };

  // ── メーカーマスター ──
  const doAddMaker=async()=>{ if(!newMakerF.trim()) return; const o=(makerMaster||[]).reduce((m,r)=>Math.max(m,r.order||0),-1); const id=uid(); const obj={id,name:newMakerF.trim(),order:o+1}; setMakerMaster(p=>[...p,obj]); setNewMakerF(""); await api("maker_master","POST",obj).catch(()=>{}); };
  const delMaker=async(id)=>{ setMakerMaster(p=>p.filter(m=>m.id!==id)); await api(`maker_master?id=eq.${id}`,"DELETE").catch(()=>{}); };
  const commitRnMaker=async(id)=>{ if(!rnMakerV.trim()){setRnMaker(null);return;} setMakerMaster(p=>p.map(m=>m.id===id?{...m,name:rnMakerV.trim()}:m)); setRnMaker(null); await api(`maker_master?id=eq.${id}`,"PATCH",{name:rnMakerV.trim()}).catch(()=>{}); };

  // ── 修理メニュー ──
  const doAddMenu=async()=>{ if(!newMenuF.name.trim()) return; const o=(repairMenus||[]).reduce((m,r)=>Math.max(m,r.order||0),-1); const id=uid(); const obj={id,name:newMenuF.name.trim(),price:+newMenuF.price||0,order:o+1}; setRepairMenus(p=>[...p,obj]); setNewMenuF({name:"",price:""}); await api("repair_menus","POST",obj); };
  const delMenu=async(id)=>{ setRepairMenus(p=>p.filter(m=>m.id!==id)); await api(`repair_menus?id=eq.${id}`,"DELETE"); };

  // ── 見積もり ──
  const estTotal = useMemo(()=>estItems.reduce((s,it)=>{ const m=repairMenus.find(m=>m.id===it.menuId); return s+(m?.price||0)*it.qty; },0),[estItems,repairMenus]);
  const openAddEst=(custId,bikeIdx)=>{ setAddEstModal({custId,bikeIdx}); setEstItems([]); setEstMemo(""); };
  const openEditEst=(est)=>{ setEditEstModal(est); setEstItems(est.items||[]); setEstMemo(est.memo||""); };
  const doSaveEst=async()=>{
    if(!addEstModal) return;
    const id=uid(); const obj={id,customer_id:addEstModal.custId,bike_index:addEstModal.bikeIdx,items:estItems,memo:estMemo,total:estTotal,created_at:new Date().toISOString()};
    setEstimates(p=>[obj,...p]); setAddEstModal(null);
    await api("estimates","POST",{id,customer_id:addEstModal.custId,bike_index:addEstModal.bikeIdx,items:JSON.stringify(estItems),memo:estMemo,total:estTotal}).catch(()=>{});
  };
  const doUpdateEst=async()=>{
    if(!editEstModal) return;
    const upd={...editEstModal,items:estItems,memo:estMemo,total:estTotal};
    setEstimates(p=>p.map(e=>e.id===upd.id?upd:e)); setEditEstModal(null);
    await api(`estimates?id=eq.${upd.id}`,"PATCH",{items:JSON.stringify(estItems),memo:estMemo,total:estTotal}).catch(()=>{});
  };
  const delEst=async(id)=>{ if(!window.confirm("削除しますか？")) return; setEstimates(p=>p.filter(e=>e.id!==id)); await api(`estimates?id=eq.${id}`,"DELETE").catch(()=>{}); };
  const custEstimates=(custId,bikeIdx)=>estimates.filter(e=>e.customer_id===custId&&e.bike_index===bikeIdx);

  // ── 予約 ──
  const getWeekDates=(base)=>{ const d=new Date(base); d.setDate(d.getDate()-d.getDay()+1); return Array.from({length:7},(_,i)=>{ const dd=new Date(d); dd.setDate(d.getDate()+i); return dd; }); };
  const weekDates = useMemo(()=>getWeekDates(calDate),[calDate]);
  const resByCell = useMemo(()=>{
    const m={};
    reservations.forEach(r=>{
      const d=new Date(r.checkin_date); const key=`${fmt(d,"date")}_${r.checkin_time||""}`;
      if(!m[key]) m[key]=[];
      m[key].push(r);
    });
    return m;
  },[reservations]);
  const custMap = useMemo(()=>{ const m={}; customers.forEach(c=>m[c.id]=c); return m; },[customers]);
  const resCusts = useMemo(()=>{ if(!resCustSearch.trim()) return customers.slice(0,8); const q=resCustSearch.toLowerCase(); return customers.filter(c=>c.name?.includes(resCustSearch)||c.furigana?.includes(resCustSearch)||(c.phone||"").replace(/[-\s]/g,"").endsWith(resCustSearch.replace(/[-\s]/g,""))).slice(0,8); },[resCustSearch,customers]);
  const selectedResCust = customers.find(c=>c.id===resForm.custId);

  const doAddRes=async()=>{
    if(!addResModal||!resForm.checkinDate) return;
    const id=uid();
    const obj={id,...resForm,checkin_date:resForm.checkinDate,checkin_time:addResModal.time,status:"reserved",created_at:new Date().toISOString()};
    setReservations(p=>[...p,obj]); setAddResModal(null);
    setResForm({custId:"",bikeIdx:0,checkinDate:"",dueDate:"",dueDateUnknown:false,staff:"あさと",memo:""});
    await api("reservations","POST",{id,customer_id:resForm.custId||null,bike_index:resForm.bikeIdx,checkin_date:resForm.checkinDate,checkin_time:addResModal.time,due_date:resForm.dueDateUnknown?null:resForm.dueDate||null,staff:resForm.staff,memo:resForm.memo||null,status:"reserved"}).catch(()=>{});
  };
  const doCheckin=async(id)=>{ setReservations(p=>p.map(r=>r.id===id?{...r,status:"in"}:r)); setSelectedRes(null); await api(`reservations?id=eq.${id}`,"PATCH",{status:"in"}).catch(()=>{}); };
  const doCheckout=async(id)=>{ setReservations(p=>p.map(r=>r.id===id?{...r,status:"done"}:r)); setSelectedRes(null); await api(`reservations?id=eq.${id}`,"PATCH",{status:"done"}).catch(()=>{}); };
  const delRes=async(id)=>{ if(!window.confirm("削除しますか？")) return; setReservations(p=>p.filter(r=>r.id!==id)); setSelectedRes(null); await api(`reservations?id=eq.${id}`,"DELETE").catch(()=>{}); };

  const filteredCusts = useMemo(()=>customers.filter(c=>{ const q=custSearch.trim(); if(!q) return true; if(c.name?.includes(q)||c.furigana?.includes(q)) return true; const phone=(c.phone||"").replace(/[-\s]/g,""); if(phone.endsWith(q.replace(/[-\s]/g,""))) return true; return false; }),[customers,custSearch]);

  // ── ログイン ──
  if (screen==="login") return (
    <div style={{background:"#f5f0e8",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>{CSS}</style>
      <div style={{background:"#faf7f2",border:"1px solid #e0d9ce",borderRadius:20,padding:"40px 36px",width:320,maxWidth:"90vw",boxShadow:"0 8px 32px rgba(42,32,24,.1)",textAlign:"center"}}>
        <div style={{fontSize:32,marginBottom:8}}>🔒</div>
        <div style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:22,color:"#2a2018",marginBottom:6}}>🚲 上原サイクル</div>
        <div style={{fontFamily:"Syne,sans-serif",fontSize:10,color:"#b0a898",letterSpacing:".1em",textTransform:"uppercase",marginBottom:28}}>Management System</div>
        <input type="password" value={pwVal} onChange={e=>{setPwVal(e.target.value);setPwErr(false);}} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="パスワードを入力"
          style={{width:"100%",background:pwErr?"#fdf0ee":"#f5f0e8",border:`1.5px solid ${pwErr?"#c0392b":"#ccc5ba"}`,borderRadius:10,padding:"12px 14px",color:"#2a2018",fontFamily:"Noto Sans JP,sans-serif",fontSize:16,outline:"none",textAlign:"center",letterSpacing:"0.2em",marginBottom:8}} autoFocus />
        {pwErr&&<p style={{color:"#c0392b",fontSize:12,marginBottom:8}}>パスワードが違います</p>}
        <button className="pbtn" style={{width:"100%",padding:"12px"}} onClick={handleLogin}>入る</button>
      </div>
    </div>
  );
  if (screen==="loading") return (
    <div style={{background:"#f5f0e8",minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}>
      <style>{CSS}</style>
      <div className="spin"/><p style={{fontFamily:"Syne,sans-serif",color:"#9a8f82",fontSize:14}}>読み込み中...</p>
    </div>
  );

  const Header=({children})=>(
    <header style={S.hdr}>
      <div style={{position:"relative"}}>
        <button onClick={()=>setModeMenu(!modeMenu)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
          <div style={S.logo}>{appMode==="stock"?"🚲 在庫":appMode==="customer"?"👤 顧客":"📅 予約"}</div>
          <span style={{color:"#b0a898",marginTop:2}}><Ico.ChevDown/></span>
        </button>
        <div style={S.sub}>{appMode==="stock"?"Inventory":appMode==="customer"?"Customers":"Reservations"}</div>
        {modeMenu&&(
          <div style={{position:"absolute",top:"100%",left:0,background:"#faf7f2",border:"1px solid #e0d9ce",borderRadius:10,padding:"6px",zIndex:200,minWidth:160,boxShadow:"0 4px 16px rgba(42,32,24,.12)"}}>
            <button className="mode-btn" onClick={()=>switchMode("stock")}>🚲 在庫管理</button>
            <button className="mode-btn" onClick={()=>switchMode("customer")}>👤 顧客管理</button>
            <button className="mode-btn" onClick={()=>switchMode("reservation")}>📅 予約管理</button>
          </div>
        )}
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>{saving&&<span style={{fontSize:10,color:"#b0a898"}}>保存中...</span>}{children}</div>
    </header>
  );

  // ════════════════════════════════════════
  // 予約管理画面
  // ════════════════════════════════════════
  if (appMode==="reservation") {
    const inShop = reservations.filter(r=>r.status==="in").sort((a,b)=>new Date(a.due_date||"9999")-new Date(b.due_date||"9999"));
    const upcoming = reservations.filter(r=>r.status==="reserved").sort((a,b)=>new Date(a.checkin_date)-new Date(b.checkin_date));
    return (
      <div style={S.root}>
        <style>{CSS}</style>
        <Header>
          <button className="icobtn" onClick={()=>loadReservations()}><Ico.Refresh/></button>
          <button className={`icobtn ${calView==="week"?"icobtn-on":""}`} onClick={()=>setCalView("week")}><Ico.Calendar/></button>
          <button className={`icobtn ${calView==="list"?"icobtn-on":""}`} onClick={()=>setCalView("list")}><Ico.List/></button>
        </Header>

        {calView==="week" && (
          <>
            <div style={{background:"#faf7f2",borderBottom:"1px solid #e0d9ce",padding:"8px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <button className="icobtn" onClick={()=>{const d=new Date(calDate);d.setDate(d.getDate()-7);setCalDate(d);}}><Ico.ChevLeft/></button>
              <span style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:14,color:"#2a2018"}}>{calDate.getFullYear()}年{calDate.getMonth()+1}月</span>
              <button className="icobtn" onClick={()=>{const d=new Date(calDate);d.setDate(d.getDate()+7);setCalDate(d);}}><Ico.ChevRight/></button>
            </div>
            <div style={{overflowX:"auto"}} className="hide-scroll">
              <table style={{borderCollapse:"collapse",width:"100%",minWidth:500}}>
                <thead>
                  <tr style={{background:"#faf7f2"}}>
                    <th style={{width:48,padding:"6px 4px",fontSize:11,color:"#b0a898",borderBottom:"1px solid #e0d9ce",borderRight:"1px solid #f0ece4"}}></th>
                    {weekDates.map(d=>{
                      const isToday=fmt(d,"date")===fmt(new Date(),"date");
                      const isSun=d.getDay()===0; const isSat=d.getDay()===6;
                      return <th key={d.toISOString()} style={{padding:"6px 2px",fontSize:11,borderBottom:"1px solid #e0d9ce",textAlign:"center",color:isSun?"#c0392b":isSat?"#2563a8":"#7a6f63",fontFamily:"Noto Sans JP,sans-serif",fontWeight:700,background:isToday?"#f0ece4":"#faf7f2",minWidth:46}}>
                        <div style={{fontSize:13,fontWeight:800,color:isToday?"#2a2018":isSun?"#c0392b":isSat?"#2563a8":"#2a2018"}}>{d.getDate()}</div>
                        <div style={{fontSize:10}}>{getDayLabel(d)}</div>
                      </th>;
                    })}
                  </tr>
                </thead>
                <tbody>
                  {HOURS.map(time=>(
                    <tr key={time}>
                      <td style={{fontSize:10,color:"#b0a898",padding:"0 4px",textAlign:"right",borderRight:"1px solid #f0ece4",verticalAlign:"top",paddingTop:2,whiteSpace:"nowrap"}}>{time}</td>
                      {weekDates.map(d=>{
                        const key=`${fmt(d,"date")}_${time}`;
                        const cellRes=resByCell[key]||[];
                        const isToday=fmt(d,"date")===fmt(new Date(),"date");
                        return <td key={key} style={{border:"1px solid #f0ece4",height:36,verticalAlign:"top",background:isToday?"#faf7f4":"#fff",cursor:"pointer",position:"relative"}}
                          onClick={()=>{setAddResModal({date:d,time});setResForm(f=>({...f,checkinDate:fmt(d,"date")}));}}>
                          {cellRes.map(r=>{
                            const c=custMap[r.customer_id];
                            const color=r.status==="in"?"#2d7a44":r.status==="done"?"#b0a898":"#2563a8";
                            return <div key={r.id} style={{background:color+"20",border:`1px solid ${color}50`,borderRadius:3,padding:"1px 3px",fontSize:9,color:color,fontWeight:700,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",margin:1}}
                              onClick={e=>{e.stopPropagation();setSelectedRes(r);}}>{c?.name||"?"}</div>;
                          })}
                        </td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {calView==="list" && (
          <div style={{padding:"16px 20px"}}>
            {inShop.length>0&&(
              <div style={{marginBottom:20}}>
                <div style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:14,color:"#2a2018",marginBottom:10}}>🏪 入庫中 ({inShop.length}台)</div>
                {inShop.map(r=>{
                  const c=custMap[r.customer_id];
                  const bike=c?.bikes?.[r.bike_index];
                  return <div key={r.id} style={{background:"#fff",border:"1px solid #e8e2d8",borderRadius:10,padding:"12px 14px",marginBottom:6,cursor:"pointer"}} onClick={()=>setSelectedRes(r)}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:14,color:"#2a2018"}}>{c?.name||"?"} {bike&&<span style={{fontSize:11,color:"#2563a8"}}>🚲{bike.maker}</span>}</div>
                        <div style={{fontSize:12,color:"#9a8f82",marginTop:2}}>入庫: {fmt(r.checkin_date,"mmdd")} ・ {r.staff}</div>
                        {r.memo&&<div style={{fontSize:11,color:"#b0a898",marginTop:2}}>{r.memo}</div>}
                      </div>
                      {r.due_date?<span style={{background:"#fdf0ee",color:"#c0392b",fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:6,flexShrink:0}}>{fmt(r.due_date,"mmdd")}出庫</span>:<span style={{background:"#f5f0e8",color:"#b0a898",fontSize:11,padding:"2px 7px",borderRadius:6}}>出庫日未定</span>}
                    </div>
                  </div>;
                })}
              </div>
            )}
            {upcoming.length>0&&(
              <div>
                <div style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:14,color:"#2a2018",marginBottom:10}}>📅 予約一覧</div>
                {upcoming.map(r=>{
                  const c=custMap[r.customer_id];
                  const bike=c?.bikes?.[r.bike_index];
                  return <div key={r.id} style={{background:"#fff",border:"1px solid #e8e2d8",borderRadius:10,padding:"12px 14px",marginBottom:6,cursor:"pointer"}} onClick={()=>setSelectedRes(r)}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:14,color:"#2a2018"}}>{c?.name||"?"} {bike&&<span style={{fontSize:11,color:"#2563a8"}}>🚲{bike.maker}</span>}</div>
                        <div style={{fontSize:12,color:"#9a8f82",marginTop:2}}>{fmt(r.checkin_date,"mmdd")} {r.checkin_time} ・ {r.staff}</div>
                        {r.memo&&<div style={{fontSize:11,color:"#b0a898",marginTop:2}}>{r.memo}</div>}
                      </div>
                      {r.due_date?<span style={{background:"#e8f0d6",color:"#2d7a44",fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:6,flexShrink:0}}>{fmt(r.due_date,"mmdd")}出庫予定</span>:<span style={{background:"#f5f0e8",color:"#b0a898",fontSize:11,padding:"2px 7px",borderRadius:6}}>出庫日未定</span>}
                    </div>
                  </div>;
                })}
              </div>
            )}
            {inShop.length===0&&upcoming.length===0&&<div style={S.empty}><div style={{fontSize:38}}>📅</div><p style={{color:"#9a8f82",marginTop:12}}>予約・入庫はありません</p></div>}
          </div>
        )}

        {/* 予約追加モーダル */}
        {addResModal&&(
          <div className="mover" onClick={()=>setAddResModal(null)}>
            <div className="modal" onClick={e=>e.stopPropagation()}>
              <h3>📅 予約を追加</h3>
              <div style={{background:"#f5f0e8",borderRadius:8,padding:"8px 12px",marginBottom:14,fontSize:13,color:"#2a2018",fontWeight:700}}>
                {addResModal.date.getMonth()+1}/{addResModal.date.getDate()}（{getDayLabel(addResModal.date)}） {addResModal.time}
              </div>
              <div className="fg"><label>入庫日 *</label><input type="date" value={resForm.checkinDate} onChange={e=>setResForm(f=>({...f,checkinDate:e.target.value}))}/></div>
              <div className="fg"><label>出庫予定日</label>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <input type="date" value={resForm.dueDate} onChange={e=>setResForm(f=>({...f,dueDate:e.target.value,dueDateUnknown:false}))} disabled={resForm.dueDateUnknown} style={{flex:1,opacity:resForm.dueDateUnknown?0.4:1}}/>
                  <label style={{display:"flex",alignItems:"center",gap:4,fontSize:12,color:"#7a6f63",whiteSpace:"nowrap"}}>
                    <input type="checkbox" checked={resForm.dueDateUnknown} onChange={e=>setResForm(f=>({...f,dueDateUnknown:e.target.checked,dueDate:e.target.checked?"":f.dueDate}))}/>未定
                  </label>
                </div>
              </div>
              <div className="fg"><label>顧客</label>
                <input value={resCustSearch} onChange={e=>setResCustSearch(e.target.value)} placeholder="名前・フリガナ・下4桁で検索" style={{width:"100%",background:"#f5f0e8",border:"1px solid #ccc5ba",borderRadius:8,padding:"8px 10px",fontFamily:"Noto Sans JP,sans-serif",fontSize:16,color:"#2a2018",outline:"none",marginBottom:6}}/>
                {resCusts.map(c=>(
                  <div key={c.id} onClick={()=>{setResForm(f=>({...f,custId:c.id,bikeIdx:0}));setResCustSearch(c.name);}} style={{padding:"6px 10px",cursor:"pointer",borderRadius:6,background:resForm.custId===c.id?"#2a2018":"transparent",color:resForm.custId===c.id?"#f5f0e8":"#2a2018",fontSize:13,fontWeight:600}}>
                    {c.name} {c.furigana&&<span style={{fontSize:11,opacity:0.7}}>{c.furigana}</span>}
                  </div>
                ))}
              </div>
              {selectedResCust?.bikes?.length>0&&(
                <div className="fg"><label>自転車</label>
                  <select value={resForm.bikeIdx} onChange={e=>setResForm(f=>({...f,bikeIdx:+e.target.value}))}>
                    {selectedResCust.bikes.map((b,i)=><option key={i} value={i}>{b.maker}{b.color?` (${b.color})`:""}</option>)}
                  </select>
                </div>
              )}
              <div className="fg"><label>担当者</label>
                <select value={resForm.staff} onChange={e=>setResForm(f=>({...f,staff:e.target.value}))}>
                  {STAFF.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="fg"><label>メモ</label><input value={resForm.memo} onChange={e=>setResForm(f=>({...f,memo:e.target.value}))}/></div>
              <div style={{display:"flex",gap:9,justifyContent:"flex-end"}}>
                <button className="gbtn" onClick={()=>setAddResModal(null)}>キャンセル</button>
                <button className="pbtn" onClick={doAddRes}>予約する</button>
              </div>
            </div>
          </div>
        )}

        {/* 予約詳細モーダル */}
        {selectedRes&&(()=>{
          const c=custMap[selectedRes.customer_id];
          const bike=c?.bikes?.[selectedRes.bike_index];
          const statusLabel=selectedRes.status==="reserved"?"予約中":selectedRes.status==="in"?"入庫中":"出庫済";
          const statusColor=selectedRes.status==="reserved"?"#2563a8":selectedRes.status==="in"?"#2d7a44":"#b0a898";
          return <div className="mover" onClick={()=>setSelectedRes(null)}>
            <div className="modal" onClick={e=>e.stopPropagation()}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
                <h3 style={{marginBottom:0}}>{c?.name||"顧客不明"}</h3>
                <button className="icobtn" onClick={()=>setSelectedRes(null)}><Ico.X/></button>
              </div>
              <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
                <span style={{background:statusColor+"20",color:statusColor,fontSize:12,fontWeight:700,padding:"2px 8px",borderRadius:6}}>{statusLabel}</span>
                {bike&&<span style={{background:"#d6e4f0",color:"#2563a8",fontSize:12,padding:"2px 8px",borderRadius:6}}>🚲 {bike.maker}{bike.color?` (${bike.color})`:""}</span>}
              </div>
              <div style={S.infoRow}><span style={S.infoLabel}>入庫日</span><span>{fmt(selectedRes.checkin_date,"mmdd")}</span></div>
              {selectedRes.checkin_time&&<div style={S.infoRow}><span style={S.infoLabel}>時間</span><span>{selectedRes.checkin_time}</span></div>}
              <div style={S.infoRow}><span style={S.infoLabel}>出庫予定</span><span>{selectedRes.due_date?fmt(selectedRes.due_date,"mmdd"):"未定"}</span></div>
              <div style={S.infoRow}><span style={S.infoLabel}>担当</span><span>{selectedRes.staff}</span></div>
              {selectedRes.memo&&<div style={S.infoRow}><span style={S.infoLabel}>メモ</span><span>{selectedRes.memo}</span></div>}
              <div style={{display:"flex",gap:8,marginTop:16,flexWrap:"wrap"}}>
                {selectedRes.status==="reserved"&&<button className="pbtn" style={{flex:1,fontSize:12}} onClick={()=>doCheckin(selectedRes.id)}>✅ 入庫確定</button>}
                {selectedRes.status==="in"&&<button className="pbtn" style={{flex:1,fontSize:12,background:"#2d7a44"}} onClick={()=>doCheckout(selectedRes.id)}>🏁 出庫</button>}
                <button className="gbtn" style={{fontSize:12}} onClick={()=>delRes(selectedRes.id)}>削除</button>
              </div>
            </div>
          </div>;
        })()}
      </div>
    );
  }

  // ════════════════════════════════════════
  // 顧客管理画面
  // ════════════════════════════════════════
  if (appMode==="customer") {
    // 自転車詳細（見積もり画面）
    if (bikeDetail) {
      const {cust,bikeIdx}=bikeDetail;
      const bike=cust.bikes[bikeIdx];
      const ests=custEstimates(cust.id,bikeIdx);
      return <div style={S.root}>
        <style>{CSS}</style>
        <Header>
          <button className="icobtn" onClick={()=>setAddEstModal(null)}><Ico.Refresh/></button>
        </Header>
        <div style={{background:"#faf7f2",borderBottom:"1px solid #e0d9ce",padding:"10px 20px",display:"flex",alignItems:"center",gap:10}}>
          <button className="icobtn" onClick={()=>setBikeDetail(null)}><Ico.Back/></button>
          <div style={{flex:1}}>
            <div style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:15,color:"#2563a8"}}>🚲 {bike.maker}{bike.color?` (${bike.color})`:""}</div>
            <div style={{fontSize:12,color:"#9a8f82"}}>{cust.name}</div>
          </div>
          <button className="pbtn" style={{fontSize:12,padding:"6px 14px"}} onClick={()=>openAddEst(cust.id,bikeIdx)}>+ 見積もり作成</button>
        </div>
        <div style={{padding:"16px 20px"}}>
          {ests.length===0&&<div style={S.empty}><div style={{fontSize:38}}>📋</div><p style={{color:"#9a8f82",marginTop:12}}>見積もり・修理履歴がありません</p></div>}
          {ests.map(e=>(
            <div key={e.id} style={{background:"#fff",border:"1px solid #e8e2d8",borderRadius:12,padding:"14px 16px",marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div style={{fontSize:12,color:"#9a8f82"}}>{fmt(e.created_at,"full")}</div>
                <div style={{display:"flex",gap:6}}>
                  <button className="sico sedit" onClick={()=>openEditEst(e)}><Ico.Edit/></button>
                  <button className="sico sdel" onClick={()=>delEst(e.id)}><Ico.Trash/></button>
                </div>
              </div>
              {(e.items||[]).map((it,i)=>{ const m=repairMenus.find(m=>m.id===it.menuId); return m&&<div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"4px 0",borderBottom:"1px solid #f5f0e8"}}><span>{m.name} × {it.qty}</span><span style={{color:"#2a7a5a",fontWeight:600}}>¥{((m.price||0)*it.qty).toLocaleString()}</span></div>; })}
              <div style={{display:"flex",justifyContent:"space-between",marginTop:8,fontWeight:800,fontSize:15,color:"#2a2018"}}>
                <span>合計</span><span style={{color:"#2a7a5a"}}>¥{(e.total||0).toLocaleString()}</span>
              </div>
              {e.memo&&<div style={{fontSize:12,color:"#b0a898",marginTop:6}}>{e.memo}</div>}
            </div>
          ))}
        </div>

        {/* 見積もり追加モーダル */}
        {addEstModal&&(
          <div className="mover" onClick={()=>setAddEstModal(null)}>
            <div className="modal" onClick={e=>e.stopPropagation()}>
              <h3>📋 見積もり作成</h3>
              <div style={{marginBottom:14}}>
                {repairMenus.map(m=>{
                  const it=estItems.find(i=>i.menuId===m.id);
                  return <div key={m.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:"1px solid #f5f0e8"}}>
                    <span style={{flex:1,fontSize:13,color:"#2a2018"}}>{m.name}</span>
                    <span style={{fontSize:12,color:"#2a7a5a",minWidth:60,textAlign:"right"}}>¥{(m.price||0).toLocaleString()}</span>
                    <div style={{display:"flex",alignItems:"center",gap:4}}>
                      <button style={{width:28,height:28,borderRadius:6,border:"1px solid #e0d9ce",background:"#f5f0e8",cursor:"pointer",fontSize:16,color:"#c0392b"}} onClick={()=>setEstItems(p=>{ const idx=p.findIndex(i=>i.menuId===m.id); if(idx<0) return p; const n=[...p]; if(n[idx].qty<=1) return p.filter(i=>i.menuId!==m.id); n[idx]={...n[idx],qty:n[idx].qty-1}; return n; })}>−</button>
                      <span style={{minWidth:24,textAlign:"center",fontWeight:700,fontSize:14}}>{it?.qty||0}</span>
                      <button style={{width:28,height:28,borderRadius:6,border:"1px solid #e0d9ce",background:"#f5f0e8",cursor:"pointer",fontSize:16,color:"#2d7a44"}} onClick={()=>setEstItems(p=>{ const idx=p.findIndex(i=>i.menuId===m.id); if(idx<0) return [...p,{menuId:m.id,qty:1}]; const n=[...p]; n[idx]={...n[idx],qty:n[idx].qty+1}; return n; })}>+</button>
                    </div>
                  </div>;
                })}
                {repairMenus.length===0&&<p style={{color:"#b0a898",fontSize:13}}>メニューが未設定です</p>}
              </div>
              {estTotal>0&&<div style={{background:"#f5f0e8",borderRadius:8,padding:"10px 14px",display:"flex",justifyContent:"space-between",marginBottom:12}}>
                <span style={{fontWeight:700,fontSize:14}}>合計</span>
                <span style={{fontWeight:800,fontSize:16,color:"#2a7a5a"}}>¥{estTotal.toLocaleString()}</span>
              </div>}
              <div className="fg"><label>メモ</label><input value={estMemo} onChange={e=>setEstMemo(e.target.value)} placeholder="備考など"/></div>
              <div style={{display:"flex",gap:9,justifyContent:"flex-end"}}>
                <button className="gbtn" onClick={()=>setAddEstModal(null)}>キャンセル</button>
                <button className="pbtn" onClick={doSaveEst}>保存</button>
              </div>
            </div>
          </div>
        )}
        {/* 見積もり編集モーダル */}
        {editEstModal&&(
          <div className="mover" onClick={()=>setEditEstModal(null)}>
            <div className="modal" onClick={e=>e.stopPropagation()}>
              <h3>📋 見積もり編集</h3>
              <div style={{marginBottom:14}}>
                {repairMenus.map(m=>{
                  const it=estItems.find(i=>i.menuId===m.id);
                  return <div key={m.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:"1px solid #f5f0e8"}}>
                    <span style={{flex:1,fontSize:13,color:"#2a2018"}}>{m.name}</span>
                    <span style={{fontSize:12,color:"#2a7a5a",minWidth:60,textAlign:"right"}}>¥{(m.price||0).toLocaleString()}</span>
                    <div style={{display:"flex",alignItems:"center",gap:4}}>
                      <button style={{width:28,height:28,borderRadius:6,border:"1px solid #e0d9ce",background:"#f5f0e8",cursor:"pointer",fontSize:16,color:"#c0392b"}} onClick={()=>setEstItems(p=>{ const idx=p.findIndex(i=>i.menuId===m.id); if(idx<0) return p; const n=[...p]; if(n[idx].qty<=1) return p.filter(i=>i.menuId!==m.id); n[idx]={...n[idx],qty:n[idx].qty-1}; return n; })}>−</button>
                      <span style={{minWidth:24,textAlign:"center",fontWeight:700,fontSize:14}}>{it?.qty||0}</span>
                      <button style={{width:28,height:28,borderRadius:6,border:"1px solid #e0d9ce",background:"#f5f0e8",cursor:"pointer",fontSize:16,color:"#2d7a44"}} onClick={()=>setEstItems(p=>{ const idx=p.findIndex(i=>i.menuId===m.id); if(idx<0) return [...p,{menuId:m.id,qty:1}]; const n=[...p]; n[idx]={...n[idx],qty:n[idx].qty+1}; return n; })}>+</button>
                    </div>
                  </div>;
                })}
              </div>
              {estTotal>0&&<div style={{background:"#f5f0e8",borderRadius:8,padding:"10px 14px",display:"flex",justifyContent:"space-between",marginBottom:12}}>
                <span style={{fontWeight:700,fontSize:14}}>合計</span><span style={{fontWeight:800,fontSize:16,color:"#2a7a5a"}}>¥{estTotal.toLocaleString()}</span>
              </div>}
              <div className="fg"><label>メモ</label><input value={estMemo} onChange={e=>setEstMemo(e.target.value)}/></div>
              <div style={{display:"flex",gap:9,justifyContent:"flex-end"}}>
                <button className="gbtn" onClick={()=>setEditEstModal(null)}>キャンセル</button>
                <button className="pbtn" onClick={doUpdateEst}>保存</button>
              </div>
            </div>
          </div>
        )}
      </div>;
    }

    // 顧客詳細
    if (custDetail) {
      const bikes=custDetail.bikes||[];
      return <div style={S.root}>
        <style>{CSS}</style>
        <Header>
          <button className="icobtn" onClick={()=>{ loadCustomers(); setCustDetail(null); }}><Ico.Refresh/></button>
        </Header>
        <div style={{background:"#faf7f2",borderBottom:"1px solid #e0d9ce",padding:"10px 20px",display:"flex",alignItems:"center",gap:8}}>
          <button className="icobtn" onClick={()=>setCustDetail(null)}><Ico.Back/></button>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:16,color:"#2a2018"}}>{custDetail.name}</div>
            {custDetail.furigana&&<div style={{fontSize:11,color:"#b0a898"}}>{custDetail.furigana}</div>}
          </div>
          <button className="smbtn" onClick={()=>setEditCustModal({...custDetail})}>編集</button>
          <button className="smbtn" onClick={()=>{ switchMode("reservation"); setAddResModal({date:new Date(),time:"10:00"}); setResForm(f=>({...f,custId:custDetail.id,checkinDate:fmt(new Date(),"date")})); setCustDetail(null); }} style={{background:"#d6e4f0",color:"#2563a8"}}>📅</button>
          <button className="smbtn" style={{color:"#c0392b"}} onClick={()=>delCust(custDetail.id)}>削除</button>
        </div>
        <div style={{padding:"16px 20px"}}>
          {custDetail.phone&&<div style={S.infoRow}><span style={S.infoLabel}>電話番号</span><span>{custDetail.phone}</span></div>}
          {custDetail.address&&<div style={S.infoRow}><span style={S.infoLabel}>住所</span><span>{custDetail.address}</span></div>}
          {custDetail.memo&&<div style={S.infoRow}><span style={S.infoLabel}>メモ</span><span style={{whiteSpace:"pre-wrap"}}>{custDetail.memo}</span></div>}
          <div style={{marginTop:20}}>
            <div style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:14,color:"#2a2018",marginBottom:12}}>🚲 登録自転車</div>
            {bikes.map((bike,i)=>(
              <div key={i} style={{background:"#fff",border:"1px solid #e8e2d8",borderRadius:10,padding:"12px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>setBikeDetail({cust:custDetail,bikeIdx:i})}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,color:"#2563a8",fontSize:14}}>🚲 {bike.maker}</div>
                  {bike.color&&<div style={{fontSize:12,color:"#9a8f82"}}>{bike.color}</div>}
                  <div style={{fontSize:11,color:"#b0a898",marginTop:2}}>{custEstimates(custDetail.id,i).length}件の履歴</div>
                </div>
                <span style={{color:"#c8bfb0",fontSize:18}}>›</span>
                <button className="sico sdel" style={{flexShrink:0}} onClick={e=>{e.stopPropagation();delBike(i);}}><Ico.Trash/></button>
              </div>
            ))}
            <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
              <select value={newBikeF.maker} onChange={e=>setNewBikeF(n=>({...n,maker:e.target.value}))} style={{flex:2,minWidth:100,background:"#f5f0e8",border:"1px solid #ccc5ba",borderRadius:8,padding:"8px 10px",fontFamily:"Noto Sans JP,sans-serif",fontSize:16,color:"#2a2018",outline:"none"}}>
                <option value="">メーカー選択</option>
                {makerMaster.map(m=><option key={m.id} value={m.name}>{m.name}</option>)}
              </select>
              <input value={newBikeF.color} onChange={e=>setNewBikeF(n=>({...n,color:e.target.value}))} placeholder="色（任意）" style={{flex:1,minWidth:60,background:"#f5f0e8",border:"1px solid #ccc5ba",borderRadius:8,padding:"8px 10px",fontFamily:"Noto Sans JP,sans-serif",fontSize:16,color:"#2a2018",outline:"none"}}/>
              <button className="pbtn" style={{padding:"8px 14px",fontSize:12,flexShrink:0}} onClick={addBike}>追加</button>
            </div>
          </div>
        </div>
        {editCustModal&&(
          <div className="mover" onClick={()=>setEditCustModal(null)}>
            <div className="modal" onClick={e=>e.stopPropagation()}>
              <h3>✏️ 顧客を編集</h3>
              <div className="fg"><label>名前 *</label><input value={editCustModal.name} onChange={e=>setEditCustModal(n=>({...n,name:e.target.value}))}/></div>
              <div className="fg"><label>フリガナ</label><input value={editCustModal.furigana||""} onChange={e=>setEditCustModal(n=>({...n,furigana:e.target.value}))} placeholder="ひらがなも可"/></div>
              <div className="fg"><label>電話番号</label><input value={editCustModal.phone||""} onChange={e=>setEditCustModal(n=>({...n,phone:e.target.value}))} type="tel"/></div>
              <div className="fg"><label>住所</label><input value={editCustModal.address||""} onChange={e=>setEditCustModal(n=>({...n,address:e.target.value}))}/></div>
              <div className="fg"><label>メモ</label><textarea value={editCustModal.memo||""} onChange={e=>setEditCustModal(n=>({...n,memo:e.target.value}))} style={{...S.textarea,fontSize:16}}/></div>
              <div style={{display:"flex",gap:9,justifyContent:"flex-end"}}><button className="gbtn" onClick={()=>setEditCustModal(null)}>キャンセル</button><button className="pbtn" onClick={doEditCust}>保存</button></div>
            </div>
          </div>
        )}
      </div>;
    }

    // 顧客一覧
    return <div style={S.root}>
      <style>{CSS}</style>
      <Header>
        <button className="icobtn" onClick={()=>{loadCustomers();loadEstimates();}}><Ico.Refresh/></button>
        <button className="icobtn" onClick={()=>setAddCustModal(true)}><Ico.Plus/></button>
        <button className="icobtn" onClick={()=>setStCustOpen(true)}><Ico.Settings/></button>
      </Header>
      <div style={{padding:"16px 20px"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,background:"#f5f0e8",border:"1.5px solid #ccc5ba",borderRadius:10,padding:"8px 12px",marginBottom:14}}>
          <Ico.Search/>
          <input value={custSearch} onChange={e=>setCustSearch(e.target.value)} placeholder="名前・フリガナ・下4桁で検索..." style={{flex:1,background:"none",border:"none",outline:"none",fontSize:14,color:"#2a2018",fontFamily:"Noto Sans JP,sans-serif"}}/>
        </div>
        {filteredCusts.length===0&&!custLoading&&<p style={{color:"#b0a898",fontSize:13,textAlign:"center",padding:"40px 0"}}>{custLoaded?"顧客がいません。＋から追加してください":"読み込み中..."}</p>}
        {filteredCusts.map(c=>(
          <div key={c.id} className="irow" onClick={()=>setCustDetail(c)}>
            <div style={{width:40,height:40,borderRadius:"50%",background:"#e8e2d8",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:16,color:"#7a6f63",flexShrink:0}}>{c.name[0]}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:700,color:"#2a2018",fontSize:15}}>{c.name}</div>
              {c.furigana&&<div style={{color:"#b0a898",fontSize:11}}>{c.furigana}</div>}
              {c.phone&&<div style={{color:"#9a8f82",fontSize:12}}>{c.phone}</div>}
              {(c.bikes||[]).length>0&&<div style={{fontSize:11,color:"#2563a8"}}>🚲 {(c.bikes||[]).map(b=>b.maker).join("・")}</div>}
            </div>
            <span style={{color:"#c8bfb0",fontSize:18}}>›</span>
          </div>
        ))}
      </div>

      {/* 顧客追加 */}
      {addCustModal&&(
        <div className="mover" onClick={()=>setAddCustModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <h3>👤 顧客を追加</h3>
            <div className="fg"><label>名前 *</label><input value={newCust.name} onChange={e=>setNewCust(n=>({...n,name:e.target.value}))} placeholder="山田 太郎" autoFocus/></div>
            <div className="fg"><label>フリガナ</label><input value={newCust.furigana} onChange={e=>setNewCust(n=>({...n,furigana:e.target.value}))} placeholder="ヤマダ タロウ（ひらがなも可）"/></div>
            <div className="fg"><label>電話番号</label><input value={newCust.phone} onChange={e=>setNewCust(n=>({...n,phone:e.target.value}))} type="tel"/></div>
            <div className="fg"><label>住所（任意）</label><input value={newCust.address} onChange={e=>setNewCust(n=>({...n,address:e.target.value}))}/></div>
            <div className="fg"><label>メモ（任意）</label><textarea value={newCust.memo} onChange={e=>setNewCust(n=>({...n,memo:e.target.value}))} style={{...S.textarea,fontSize:16}}/></div>
            <div style={{display:"flex",gap:9,justifyContent:"flex-end"}}><button className="gbtn" onClick={()=>setAddCustModal(false)}>キャンセル</button><button className="pbtn" onClick={doAddCust}>追加</button></div>
          </div>
        </div>
      )}

      {/* 顧客設定パネル */}
      {stCustOpen&&(
        <div className="stover" onClick={()=>setStCustOpen(false)}>
          <aside className="stpanel" onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
              <span style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:17,color:"#2a2018"}}>⚙️ 設定</span>
              <button className="icobtn" onClick={()=>setStCustOpen(false)}><Ico.X/></button>
            </div>
            <div style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:14,color:"#2a2018",marginBottom:10}}>🚲 メーカーマスター</div>
            {(makerMaster||[]).map(m=>(
              <div key={m.id} className="strow">
                {rnMaker===m.id
                  ? <input className="rninput" value={rnMakerV} onChange={e=>setRnMakerV(e.target.value)} autoFocus onBlur={()=>commitRnMaker(m.id)} onKeyDown={e=>{if(e.key==="Enter")commitRnMaker(m.id);if(e.key==="Escape")setRnMaker(null);}}/>
                  : <span style={{flex:1,fontWeight:600,color:"#2a2018",fontSize:13}}>{m.name}</span>
                }
                <button className="sico sedit" onClick={()=>{setRnMaker(m.id);setRnMakerV(m.name);}}><Ico.Edit/></button>
                <button className="sico sdel" onClick={()=>delMaker(m.id)}><Ico.Trash/></button>
              </div>
            ))}
            <div style={{display:"flex",gap:8,marginTop:8}}>
              <input value={newMakerF} onChange={e=>setNewMakerF(e.target.value)} placeholder="例: GIANT" style={{flex:1,background:"#f5f0e8",border:"1px solid #ccc5ba",borderRadius:8,padding:"8px 10px",fontFamily:"Noto Sans JP,sans-serif",fontSize:16,color:"#2a2018",outline:"none"}} onKeyDown={e=>e.key==="Enter"&&doAddMaker()}/>
              <button className="pbtn" style={{padding:"8px 14px",fontSize:12}} onClick={doAddMaker}>追加</button>
            </div>
            <div style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:14,color:"#2a2018",marginBottom:10,marginTop:24}}>🔧 修理メニュー</div>
            {repairMenus.map(m=>(
              <div key={m.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"#f5f0e8",borderRadius:8,marginBottom:6}}>
                <span style={{flex:1,fontSize:13,fontWeight:600,color:"#2a2018"}}>{m.name}</span>
                {m.price>0&&<span style={{fontSize:12,color:"#2a7a5a"}}>¥{m.price.toLocaleString()}</span>}
                <button className="sico sdel" onClick={()=>delMenu(m.id)}><Ico.Trash/></button>
              </div>
            ))}
            <div style={{display:"flex",gap:6,marginTop:8}}>
              <input value={newMenuF.name} onChange={e=>setNewMenuF(n=>({...n,name:e.target.value}))} placeholder="修理内容" style={{flex:2,background:"#f5f0e8",border:"1px solid #ccc5ba",borderRadius:8,padding:"8px 10px",fontFamily:"Noto Sans JP,sans-serif",fontSize:16,color:"#2a2018",outline:"none"}}/>
              <input value={newMenuF.price} onChange={e=>setNewMenuF(n=>({...n,price:e.target.value}))} placeholder="金額" type="number" style={{flex:1,minWidth:70,background:"#f5f0e8",border:"1px solid #ccc5ba",borderRadius:8,padding:"8px 10px",fontFamily:"Noto Sans JP,sans-serif",fontSize:16,color:"#2a2018",outline:"none"}}/>
              <button className="pbtn" style={{padding:"8px 12px",fontSize:12}} onClick={doAddMenu}>追加</button>
            </div>
          </aside>
        </div>
      )}
    </div>;
  }

  // ════════════════════════════════════════
  // 在庫管理画面
  // ════════════════════════════════════════
  return <div style={S.root}>
    <style>{CSS}</style>
    <Header>
      <button className="icobtn" onClick={()=>{setScreen("loading");loadStock();}}><Ico.Refresh/></button>
      <button className="icobtn" onClick={()=>{setSearchOpen(true);setSearchQ("");}}><Ico.Search/></button>
      <button className="icobtn" onClick={()=>setShowSummary(true)}><Ico.Chart/></button>
      <button className="icobtn" onClick={()=>exportCSV(cats)}><Ico.Download/></button>
      <button className="icobtn" onClick={()=>setAddMenu(!addMenu)} style={addMenu?{background:"#2a2018",color:"#f5f0e8"}:{}}><Ico.Plus/></button>
      <button className="icobtn" onClick={()=>setStOpen(true)}><Ico.Settings/></button>
    </Header>

    {addMenu&&(
      <div style={{background:"#faf7f2",borderBottom:"1px solid #e0d9ce",padding:"10px 20px",display:"flex",gap:8,flexWrap:"wrap"}}>
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

    <main style={S.main}>
      {mainTab==="order"&&(needOrder.length===0?<div style={S.empty}><div style={{fontSize:38}}>✅</div><p style={{color:"#9a8f82",marginTop:12}}>注文が必要な商品はありません</p></div>:needOrder.map(i=><div key={i.id} className="irow" onClick={()=>openDetail(i.catId,i.brandId,i)}>
        <div style={{flex:1,minWidth:0}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontWeight:700,color:"#2a2018",fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{i.name}</span><span className={`tag ${i.stock===0?"tcrit":"tlow"}`}>{i.stock===0?"在庫切れ":"要注文"}</span></div><span style={{color:"#b0a898",fontSize:11}}>{i.catName} › {i.brandName}</span></div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",flexShrink:0}}><span className={`snum ${i.stock===0?"scrit":"slow"}`}>{i.stock}</span><span style={{fontSize:10,color:"#b0a898",marginTop:1}}>ライン:{i.minStock}</span></div>
      </div>))}

      {mainTab==="stock"&&displayBrands.map(brand=>(
        <div key={brand.id} style={S.brandBlk}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            {selectedCatId==="all"&&<span style={{color:"#b0a898",fontSize:11}}>{brand.catName} ›</span>}
            <span style={S.brandNm}>🏷 {brand.name}</span>
            <span style={{color:"#b0a898",fontSize:11}}>{brand.items.length}種類</span>
          </div>
          {brand.items.length===0&&<p style={{color:"#c8bfb0",fontSize:12,padding:"4px 0"}}>商品がまだありません</p>}
          {[...brand.items].sort((a,b)=>a.order-b.order).map(item=>{
            const catId=brand.category_id||cats.find(c=>c.brands?.some(b=>b.id===brand.id))?.id;
            const low=item.stock<=item.minStock; const crit=item.stock===0; const sc=crit?"scrit":low?"slow":"sok";
            return <div key={item.id} className="irow" onClick={()=>openDetail(catId,brand.id,item)}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontWeight:700,color:"#2a2018",fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</span>{low&&<span className={`tag ${crit?"tcrit":"tlow"}`}>{crit?"在庫切れ":"要注文"}</span>}</div>
                <div style={{display:"flex",gap:10,marginTop:3,flexWrap:"wrap"}}>{item.retailPrice>0&&<span style={{color:"#2a7a5a",fontSize:11,fontWeight:600}}>定価 ¥{item.retailPrice.toLocaleString()}</span>}{item.costPrice>0&&<span style={{color:"#9a8f82",fontSize:11}}>仕入 ¥{item.costPrice.toLocaleString()}</span>}</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",flexShrink:0}}><span className={`snum ${sc}`}>{item.stock}</span><span style={{fontSize:10,color:"#b0a898",marginTop:1}}>ライン:{item.minStock}</span></div>
            </div>;
          })}
        </div>
      ))}
    </main>

    {/* 合計金額モーダル */}
    {showSummary&&(<div className="mover" onClick={()=>setShowSummary(false)}><div className="modal" onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}><h3 style={{marginBottom:0}}>📊 在庫合計金額</h3><button className="icobtn" onClick={()=>setShowSummary(false)}><Ico.X/></button></div>
      <div style={{background:"#f5f0e8",borderRadius:10,padding:"14px 16px",marginBottom:16}}>
        <div style={{fontSize:11,color:"#9a8f82",marginBottom:6}}>全体合計</div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:13}}>定価合計</span><span style={{fontFamily:"Noto Sans JP,sans-serif",fontWeight:700,fontSize:16,color:"#2a7a5a"}}>¥{summary.total.retail.toLocaleString()}</span></div>
        <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:13}}>仕入合計</span><span style={{fontFamily:"Noto Sans JP,sans-serif",fontWeight:700,fontSize:16,color:"#9a8f82"}}>¥{summary.total.cost.toLocaleString()}</span></div>
      </div>
      <div style={{fontSize:11,color:"#9a8f82",marginBottom:8}}>カテゴリ別</div>
      {sortedCats.map(cat=>(<div key={cat.id} style={{borderBottom:"1px solid #e8e2d8",paddingBottom:10,marginBottom:10}}>
        <div style={{fontWeight:700,fontSize:13,color:"#2a2018",marginBottom:6}}>{cat.name}</div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,color:"#7a6f63"}}>定価合計</span><span style={{fontWeight:600,fontSize:13,color:"#2a7a5a"}}>¥{(summary.byCat[cat.id]?.retail||0).toLocaleString()}</span></div>
        <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:12,color:"#7a6f63"}}>仕入合計</span><span style={{fontWeight:600,fontSize:13,color:"#9a8f82"}}>¥{(summary.byCat[cat.id]?.cost||0).toLocaleString()}</span></div>
      </div>))}
    </div></div>)}

    {/* 検索 */}
    {searchOpen&&(<div className="search-overlay" onClick={()=>setSearchOpen(false)}><div className="search-panel" onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:12}}>
        <div style={{flex:1,display:"flex",alignItems:"center",gap:8,background:"#f5f0e8",border:"1.5px solid #ccc5ba",borderRadius:10,padding:"8px 12px"}}><Ico.Search/><input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="商品名で検索..." autoFocus style={{flex:1,background:"none",border:"none",outline:"none",fontSize:15,color:"#2a2018",fontFamily:"Noto Sans JP,sans-serif"}}/></div>
        <button className="icobtn" onClick={()=>setSearchOpen(false)}><Ico.X/></button>
      </div>
      {searchQ&&stockSearch.length===0&&<p style={{color:"#b0a898",fontSize:13}}>見つかりませんでした</p>}
      {stockSearch.map(item=>{ const low=item.stock<=item.minStock; const crit=item.stock===0; const sc=crit?"scrit":low?"slow":"sok"; return <div key={item.id} className="irow" style={{marginBottom:6}} onClick={()=>{setSelectedCatId(item.catId);setMainTab("stock");setSearchOpen(false);openDetail(item.catId,item.brandId,item);}}>
        <div style={{flex:1,minWidth:0}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontWeight:700,color:"#2a2018",fontSize:14}}>{item.name}</span>{low&&<span className={`tag ${crit?"tcrit":"tlow"}`}>{crit?"在庫切れ":"要注文"}</span>}</div><span style={{color:"#b0a898",fontSize:11}}>{item.catName} › {item.brandName}</span></div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end"}}><span className={`snum ${sc}`}>{item.stock}</span><span style={{fontSize:10,color:"#b0a898"}}>ライン:{item.minStock}</span></div>
      </div>; })}
      {!searchQ&&<p style={{color:"#c8bfb0",fontSize:13}}>商品名を入力してください</p>}
    </div></div>)}

    {/* 商品詳細モーダル */}
    {itemDetail&&(()=>{ const{catId,brandId,item}=itemDetail; const cat=cats.find(c=>c.id===catId); const brand=cat?.brands?.find(b=>b.id===brandId); return <div className="mover" onClick={()=>setItemDetail(null)}><div className="modal" onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}><h3 style={{flex:1,marginBottom:0,fontFamily:"Noto Sans JP,sans-serif",fontWeight:700,fontSize:17,color:"#2a2018"}}>{item.name}</h3><button className="icobtn" onClick={()=>setItemDetail(null)} style={{marginLeft:8,flexShrink:0}}><Ico.X/></button></div>
      <p style={{color:"#b0a898",fontSize:12,marginBottom:16}}>{cat?.name} › {brand?.name}</p>
      <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>{item.retailPrice>0&&<span style={{color:"#2a7a5a",fontSize:13,fontWeight:600}}>定価 ¥{item.retailPrice.toLocaleString()}</span>}{item.costPrice>0&&<span style={{color:"#9a8f82",fontSize:13}}>仕入 ¥{item.costPrice.toLocaleString()}</span>}</div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:24,margin:"16px 0 20px"}}>
        <button className="big-adj dec" onClick={()=>setDetailStock(s=>Math.max(0,s-1))}>−</button>
        <div style={{textAlign:"center"}}><div style={{fontFamily:"Noto Sans JP,sans-serif",fontWeight:700,fontSize:52,color:detailStock===0?"#c0392b":detailStock<=item.minStock?"#c87a00":"#2d7a44",lineHeight:1}}>{detailStock}</div><div style={{color:"#b0a898",fontSize:11,marginTop:6}}>注文ライン: {item.minStock}</div></div>
        <button className="big-adj inc" onClick={()=>setDetailStock(s=>s+1)}>+</button>
      </div>
      <div style={{display:"flex",gap:9}}><button className="gbtn" style={{flex:1}} onClick={()=>setItemDetail(null)}>キャンセル</button><button className="pbtn" style={{flex:2}} onClick={confirmStock}>確定</button></div>
      <div style={{borderTop:"1px solid #e8e2d8",marginTop:14,paddingTop:12}}><button style={{width:"100%",background:"#f5f0e8",border:"1px solid #e0d9ce",borderRadius:8,padding:"9px",fontSize:13,color:"#7a6f63",cursor:"pointer",fontFamily:"Noto Sans JP,sans-serif"}} onClick={()=>{setItemDetail(null);openEditItem(catId,brandId,item);}}>📝 詳細編集（名前・価格・注文ライン）</button></div>
    </div></div>; })()}

    {/* 詳細編集 */}
    {editItemModal&&(<div className="mover" onClick={()=>setEditItemModal(null)}><div className="modal" onClick={e=>e.stopPropagation()}>
      <h3>📝 商品を編集</h3>
      <div className="fg"><label>商品名</label><input value={editItemF.name} onChange={e=>setEditItemF(n=>({...n,name:e.target.value}))}/></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><div className="fg"><label>在庫数</label><input type="number" min="0" value={editItemF.stock} onChange={e=>setEditItemF(n=>({...n,stock:e.target.value}))}/></div><div className="fg"><label>注文ライン</label><input type="number" min="0" value={editItemF.minStock} onChange={e=>setEditItemF(n=>({...n,minStock:e.target.value}))}/></div></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><div className="fg"><label>定価（円）</label><input type="number" min="0" value={editItemF.retailPrice} onChange={e=>setEditItemF(n=>({...n,retailPrice:e.target.value}))} placeholder="0"/></div><div className="fg"><label>仕入れ価格（円）</label><input type="number" min="0" value={editItemF.costPrice} onChange={e=>setEditItemF(n=>({...n,costPrice:e.target.value}))} placeholder="0"/></div></div>
      <div style={{display:"flex",gap:9,justifyContent:"flex-end"}}><button className="gbtn" onClick={()=>setEditItemModal(null)}>キャンセル</button><button className="pbtn" onClick={doEditItem}>保存</button></div>
    </div></div>)}

    {/* 追加モーダル */}
    {addModal==="cat"&&(<div className="mover" onClick={()=>setAddModal(null)}><div className="modal" onClick={e=>e.stopPropagation()}><h3>📁 カテゴリを追加</h3><div className="fg"><label>カテゴリ名</label><input value={newCatF} onChange={e=>setNewCatF(e.target.value)} placeholder="例: タイヤ・チューブ" autoFocus onKeyDown={e=>e.key==="Enter"&&doAddCat()}/></div><div style={{display:"flex",gap:9,justifyContent:"flex-end"}}><button className="gbtn" onClick={()=>setAddModal(null)}>キャンセル</button><button className="pbtn" onClick={doAddCat}>追加</button></div></div></div>)}
    {addModal==="brand"&&(<div className="mover" onClick={()=>setAddModal(null)}><div className="modal" onClick={e=>e.stopPropagation()}><h3>🏷 ブランドを追加</h3><div className="fg"><label>カテゴリ</label><select value={newBrandF.catId} onChange={e=>setNewBrandF(n=>({...n,catId:e.target.value}))}><option value="">選択してください</option>{sortedCats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div className="fg"><label>ブランド名</label><input value={newBrandF.name} onChange={e=>setNewBrandF(n=>({...n,name:e.target.value}))} placeholder="例: Panaracer" onKeyDown={e=>e.key==="Enter"&&doAddBrand()}/></div><div style={{display:"flex",gap:9,justifyContent:"flex-end"}}><button className="gbtn" onClick={()=>setAddModal(null)}>キャンセル</button><button className="pbtn" onClick={doAddBrand}>追加</button></div></div></div>)}
    {addModal==="item"&&(<div className="mover" onClick={()=>setAddModal(null)}><div className="modal" onClick={e=>e.stopPropagation()}><h3>🔧 商品を追加</h3><div className="fg"><label>カテゴリ</label><select value={newItemF.catId} onChange={e=>setNewItemF(n=>({...n,catId:e.target.value,brandId:""}))}><option value="">選択してください</option>{sortedCats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>{newItemF.catId&&<div className="fg"><label>ブランド</label><select value={newItemF.brandId} onChange={e=>setNewItemF(n=>({...n,brandId:e.target.value}))}><option value="">選択してください</option>{[...(cats.find(c=>c.id===newItemF.catId)?.brands||[])].sort((a,b)=>a.order-b.order).map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div>}<div className="fg"><label>商品名 *</label><input value={newItemF.name} onChange={e=>setNewItemF(n=>({...n,name:e.target.value}))} placeholder="例: 26インチ タイヤ"/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><div className="fg"><label>在庫数 *</label><input type="number" min="0" value={newItemF.stock} onChange={e=>setNewItemF(n=>({...n,stock:e.target.value}))} placeholder="0"/></div><div className="fg"><label>注文ライン *</label><input type="number" min="0" value={newItemF.minStock} onChange={e=>setNewItemF(n=>({...n,minStock:e.target.value}))} placeholder="5"/></div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><div className="fg"><label>定価（円）</label><input type="number" min="0" value={newItemF.retailPrice} onChange={e=>setNewItemF(n=>({...n,retailPrice:e.target.value}))} placeholder="0"/></div><div className="fg"><label>仕入れ価格（円）</label><input type="number" min="0" value={newItemF.costPrice} onChange={e=>setNewItemF(n=>({...n,costPrice:e.target.value}))} placeholder="0"/></div></div><div style={{display:"flex",gap:9,justifyContent:"flex-end",marginTop:4}}><button className="gbtn" onClick={()=>setAddModal(null)}>キャンセル</button><button className="pbtn" onClick={doAddItem}>追加</button></div></div></div>)}

    {/* 設定パネル */}
    {stOpen&&(<div className="stover" onClick={()=>setStOpen(false)}><aside className="stpanel" onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}><span style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:17,color:"#2a2018"}}>⚙️ 設定・並び替え</span><button className="icobtn" onClick={()=>setStOpen(false)}><Ico.X/></button></div>
      <div style={{display:"flex",gap:4,marginBottom:18,background:"#ede8df",borderRadius:9,padding:4}}>
        {["cats","brands","items"].map(t=><button key={t} className={`sttab ${stTab===t?"sttabon":""}`} onClick={()=>{setStTab(t);setRnCat(null);setRnBrand(null);setRnItem(null);}}>{t==="cats"?"カテゴリ":t==="brands"?"ブランド":"商品"}</button>)}
      </div>
      {stTab==="cats"&&(<>{`↑↓ ✏ 🗑`.split(" ").length>0&&<p style={{fontSize:11,color:"#b0a898",marginBottom:11}}>↑↓ 順番変更　✏ 名前変更　🗑 削除</p>}{sortedCats.map((cat,idx)=><div key={cat.id} className="strow">{rnCat===cat.id?<input className="rninput" value={rnCatV} onChange={e=>setRnCatV(e.target.value)} autoFocus onBlur={()=>commitRnCat(cat.id)} onKeyDown={e=>{if(e.key==="Enter")commitRnCat(cat.id);if(e.key==="Escape")setRnCat(null);}}/>:<span style={{flex:1,fontWeight:600,color:"#2a2018",fontSize:14}}>{cat.name}<span style={{color:"#b0a898",fontWeight:400,fontSize:11,marginLeft:5}}>{(cat.brands||[]).length}ブランド</span></span>}<div style={{display:"flex",gap:4}}><button className="sico" onClick={()=>moveCat(cat.id,-1)} disabled={idx===0}><Ico.Up/></button><button className="sico" onClick={()=>moveCat(cat.id,1)} disabled={idx===sortedCats.length-1}><Ico.Down/></button><button className="sico sedit" onClick={()=>{setRnCat(cat.id);setRnCatV(cat.name);}}><Ico.Edit/></button><button className="sico sdel" onClick={()=>delCat(cat.id)}><Ico.Trash/></button></div></div>)}</>)}
      {stTab==="brands"&&(<><div style={{marginBottom:14}}><p style={{fontSize:11,color:"#b0a898",marginBottom:8}}>カテゴリを選択</p><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{sortedCats.map(c=><button key={c.id} className={`chip ${stCatId===c.id?"chipon":""}`} onClick={()=>{setStCatId(c.id);setRnBrand(null);}}>{c.name}</button>)}</div></div>{stCatId?<>{<p style={{fontSize:11,color:"#b0a898",marginBottom:10}}>↑↓ 順番変更　✏ 名前変更　🗑 削除</p>}{sortedStBrands.map((brand,idx)=><div key={brand.id} className="strow">{rnBrand===brand.id?<input className="rninput" value={rnBrandV} onChange={e=>setRnBrandV(e.target.value)} autoFocus onBlur={()=>commitRnBrand(stCatId,brand.id)} onKeyDown={e=>{if(e.key==="Enter")commitRnBrand(stCatId,brand.id);if(e.key==="Escape")setRnBrand(null);}}/>:<span style={{flex:1,fontWeight:600,color:"#2a2018",fontSize:13}}>{brand.name}<span style={{color:"#b0a898",fontWeight:400,fontSize:11,marginLeft:5}}>{(brand.items||[]).length}種類</span></span>}<div style={{display:"flex",gap:4}}><button className="sico" onClick={()=>moveBrand(stCatId,brand.id,-1)} disabled={idx===0}><Ico.Up/></button><button className="sico" onClick={()=>moveBrand(stCatId,brand.id,1)} disabled={idx===sortedStBrands.length-1}><Ico.Down/></button><button className="sico sedit" onClick={()=>{setRnBrand(brand.id);setRnBrandV(brand.name);}}><Ico.Edit/></button><button className="sico sdel" onClick={()=>delBrand(stCatId,brand.id)}><Ico.Trash/></button></div></div>)}{sortedStBrands.length===0&&<p style={{color:"#c8bfb0",fontSize:13}}>ブランドがありません</p>}</>:<p style={{color:"#c8bfb0",fontSize:13,paddingTop:6}}>カテゴリを選んでください</p>}</>)}
      {stTab==="items"&&(<><div style={{marginBottom:10}}><p style={{fontSize:11,color:"#b0a898",marginBottom:8}}>カテゴリを選択</p><div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>{sortedCats.map(c=><button key={c.id} className={`chip ${stCatId===c.id?"chipon":""}`} onClick={()=>{setStCatId(c.id);setStBrandId(null);setRnItem(null);}}>{c.name}</button>)}</div>{stCatId&&<><p style={{fontSize:11,color:"#b0a898",marginBottom:8}}>ブランドを選択</p><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{sortedStBrands.map(b=><button key={b.id} className={`chip ${stBrandId===b.id?"chipon":""}`} onClick={()=>{setStBrandId(b.id);setRnItem(null);}}>{b.name}</button>)}</div></>}</div>{stBrandId?<><p style={{fontSize:11,color:"#b0a898",marginBottom:10}}>↑↓ 順番　✏ 名前変更　📝 詳細編集　🗑 削除</p>{sortedStItems.map((item,idx)=>{ const rk=`${stBrandId}:${item.id}`; return <div key={item.id} className="strow">{rnItem===rk?<input className="rninput" value={rnItemV} onChange={e=>setRnItemV(e.target.value)} autoFocus onBlur={()=>commitRnItem(stCatId,stBrandId,item.id)} onKeyDown={e=>{if(e.key==="Enter")commitRnItem(stCatId,stBrandId,item.id);if(e.key==="Escape")setRnItem(null);}}/>:<span style={{flex:1,fontWeight:600,color:"#2a2018",fontSize:13}}>{item.name}<span style={{color:"#b0a898",fontWeight:400,fontSize:11,marginLeft:5}}>在庫:{item.stock}</span></span>}<div style={{display:"flex",gap:4}}><button className="sico" onClick={()=>moveItem(stCatId,stBrandId,item.id,-1)} disabled={idx===0}><Ico.Up/></button><button className="sico" onClick={()=>moveItem(stCatId,stBrandId,item.id,1)} disabled={idx===sortedStItems.length-1}><Ico.Down/></button><button className="sico sedit" onClick={()=>{setRnItem(rk);setRnItemV(item.name);}}><Ico.Edit/></button><button className="sico" style={{background:"#e8f0d6",color:"#2d7a44",border:"1px solid #c8e0b0",fontSize:13}} onClick={()=>{setStOpen(false);openEditItem(stCatId,stBrandId,item);}}>📝</button><button className="sico sdel" onClick={()=>delItem(stCatId,stBrandId,item.id)}><Ico.Trash/></button></div></div>; })}{sortedStItems.length===0&&<p style={{color:"#c8bfb0",fontSize:13}}>商品がありません</p>}</>:<p style={{color:"#c8bfb0",fontSize:13,paddingTop:6}}>{stCatId?"ブランドを選んでください":"カテゴリを選んでください"}</p>}</>)}
    </aside></div>)}
  </div>;
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Noto+Sans+JP:wght@400;500;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #f5f0e8; font-family: 'Noto Sans JP', sans-serif; color: #2a2018; }
  input, select, textarea { font-size: 16px !important; }
  ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #ede8df; } ::-webkit-scrollbar-thumb { background: #c8bfb0; border-radius: 2px; }
  .hide-scroll::-webkit-scrollbar { display: none; }
  .spin { width: 36px; height: 36px; border: 3px solid #e0d9ce; border-top-color: #2a2018; border-radius: 50%; animation: rot .7s linear infinite; }
  @keyframes rot { to { transform: rotate(360deg); } }
  .pbtn { background: #2a2018; color: #f5f0e8; font-weight: 700; padding: 9px 22px; font-size: 13px; border-radius: 8px; border: none; cursor: pointer; font-family: 'Syne', sans-serif; }
  .gbtn { background: #e8e2d8; color: #7a6f63; font-weight: 600; padding: 9px 18px; font-size: 13px; border-radius: 8px; border: none; cursor: pointer; font-family: 'Syne', sans-serif; }
  .gbtn:hover { background: #ddd6ca; color: #2a2018; }
  .icobtn { background: #e8e2d8; border: none; cursor: pointer; border-radius: 9px; padding: 8px; display: flex; align-items: center; justify-content: center; color: #7a6f63; transition: background .15s, color .15s; }
  .icobtn:hover, .icobtn-on { background: #2a2018; color: #f5f0e8; }
  .smbtn { background: #e8e2d8; color: #7a6f63; font-size: 12px; padding: 5px 12px; border-radius: 6px; border: none; cursor: pointer; font-family: 'Noto Sans JP', sans-serif; font-weight: 500; }
  .mode-btn { display: block; width: 100%; text-align: left; background: none; border: none; cursor: pointer; padding: 8px 12px; font-family: 'Noto Sans JP', sans-serif; font-size: 14px; font-weight: 600; color: #2a2018; border-radius: 7px; }
  .mode-btn:hover { background: #f0ece4; }
  .cat-tab { background: none; border: none; cursor: pointer; font-family: 'Noto Sans JP', sans-serif; font-size: 13px; font-weight: 600; padding: 6px 14px; border-radius: 20px; color: #c8bfb0; transition: all .15s; white-space: nowrap; display: inline-flex; align-items: center; gap: 4px; }
  .cat-tab:hover { color: #7a6f63; background: #f0ece4; }
  .cat-tab-on { background: #2a2018; color: #f5f0e8 !important; }
  .cat-tab-order { background: #fdf0ee; color: #c0392b !important; border: 1px solid #f0c8c4; }
  .add-chip { background: #f5f0e8; border: 1.5px solid #e0d9ce; border-radius: 20px; padding: 7px 16px; font-size: 13px; font-family: 'Noto Sans JP', sans-serif; font-weight: 600; color: #2a2018; cursor: pointer; }
  .add-chip:hover { background: #2a2018; color: #f5f0e8; border-color: #2a2018; }
  .irow { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 10px; background: #fff; border: 1px solid #e8e2d8; margin-bottom: 6px; cursor: pointer; transition: border-color .12s, box-shadow .12s; }
  .irow:hover { border-color: #c8bfb0; box-shadow: 0 2px 10px rgba(42,32,24,.09); }
  .snum { font-family: 'Noto Sans JP', sans-serif; font-weight: 700; font-size: 22px; }
  .sok { color: #2d7a44; } .slow { color: #c87a00; } .scrit { color: #c0392b; }
  .tag { font-size: 10px; padding: 1px 6px; border-radius: 4px; font-family: 'Noto Sans JP', sans-serif; font-weight: 700; flex-shrink: 0; }
  .tlow { background: #c87a0015; color: #c87a00; border: 1px solid #c87a0040; }
  .tcrit { background: #c0392b15; color: #c0392b; border: 1px solid #c0392b40; }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: #c0392b; display: inline-block; animation: pulse 1.5s infinite; flex-shrink: 0; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
  .big-adj { width: 56px; height: 56px; border-radius: 50%; border: none; cursor: pointer; font-size: 28px; font-weight: 700; display: flex; align-items: center; justify-content: center; font-family: 'Noto Sans JP', sans-serif; }
  .big-adj.dec { background: #f0d9d6; color: #c0392b; }
  .big-adj.inc { background: #d6ead9; color: #2d7a44; }
  .search-overlay { position: fixed; inset: 0; background: rgba(42,32,24,.4); z-index: 950; display: flex; align-items: flex-start; justify-content: center; padding-top: 60px; backdrop-filter: blur(4px); }
  .search-panel { background: #faf7f2; border: 1px solid #ddd6ca; border-radius: 16px; padding: 16px; width: 420px; max-width: 93vw; max-height: 70vh; overflow-y: auto; }
  .mover { position: fixed; inset: 0; background: rgba(42,32,24,.42); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
  .modal { background: #faf7f2; border: 1px solid #ddd6ca; border-radius: 16px; padding: 26px; width: 370px; max-width: 92vw; max-height: 90vh; overflow-y: auto; }
  .modal h3 { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 800; color: #2a2018; margin-bottom: 18px; }
  .fg { margin-bottom: 13px; }
  .fg label { display: block; font-size: 11px; color: #9a8f82; margin-bottom: 5px; }
  .fg input, .fg select, .fg textarea { width: 100%; background: #f5f0e8; border: 1px solid #ccc5ba; border-radius: 8px; padding: 9px 11px; color: #2a2018; font-family: 'Noto Sans JP', sans-serif; outline: none; }
  .fg input:focus, .fg select:focus, .fg textarea:focus { border-color: #2a2018; }
  .stover { position: fixed; inset: 0; background: rgba(42,32,24,.28); z-index: 900; display: flex; justify-content: flex-end; }
  .stpanel { background: #faf7f2; width: 350px; max-width: 93vw; height: 100%; overflow-y: auto; padding: 26px 20px; box-shadow: -4px 0 28px rgba(42,32,24,.13); animation: sin .22s cubic-bezier(.22,1,.36,1); }
  @keyframes sin { from { transform: translateX(100%); } to { transform: translateX(0); } }
  .sttab { flex: 1; background: none; border: none; cursor: pointer; font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700; padding: 8px 0; border-radius: 7px; color: #9a8f82; }
  .sttabon { background: #faf7f2; color: #2a2018; box-shadow: 0 1px 4px rgba(42,32,24,.09); }
  .strow { display: flex; align-items: center; gap: 7px; padding: 9px 11px; border-radius: 9px; background: #f5f0e8; border: 1px solid #e8e2d8; margin-bottom: 6px; min-height: 48px; }
  .sico { background: #f0ece4; border: 1px solid #e0d9ce; cursor: pointer; border-radius: 6px; padding: 5px; display: flex; align-items: center; justify-content: center; color: #9a8f82; font-size: 13px; flex-shrink: 0; }
  .sico:hover { background: #e8e2d8; color: #2a2018; }
  .sico:disabled { opacity: .22; cursor: not-allowed; }
  .sedit:hover { background: #d6e4f0; color: #2563a8; }
  .sdel:hover { background: #f0d9d6; color: #c0392b; }
  .rninput { flex: 1; background: #fff; border: 1.5px solid #2a2018; border-radius: 6px; padding: 5px 9px; font-family: 'Noto Sans JP', sans-serif; color: #2a2018; outline: none; }
  .chip { background: #e8e2d8; border: 1.5px solid transparent; border-radius: 20px; padding: 5px 13px; font-family: 'Noto Sans JP', sans-serif; font-size: 12px; font-weight: 600; color: #7a6f63; cursor: pointer; }
  .chipon { background: #2a2018; color: #f5f0e8; border-color: #2a2018; }
`;

const S = {
  root:{background:"#f5f0e8",minHeight:"100vh"},
  hdr:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:"1px solid #e0d9ce",background:"#faf7f2",position:"relative",zIndex:100},
  logo:{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:20,color:"#2a2018",letterSpacing:"-.02em"},
  sub:{fontFamily:"Syne,sans-serif",fontSize:10,color:"#b0a898",letterSpacing:".1em",marginTop:2,textTransform:"uppercase"},
  main:{padding:"16px 20px",maxWidth:860},
  brandBlk:{background:"#faf7f2",border:"1px solid #e8e2d8",borderRadius:12,padding:"12px 14px",marginBottom:12},
  brandNm:{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:13,color:"#2563a8"},
  empty:{textAlign:"center",padding:"64px 0"},
  infoRow:{display:"flex",gap:12,padding:"10px 0",borderBottom:"1px solid #f0ece4",alignItems:"flex-start"},
  infoLabel:{fontSize:11,color:"#b0a898",minWidth:70,paddingTop:2},
  textarea:{width:"100%",background:"#f5f0e8",border:"1px solid #ccc5ba",borderRadius:8,padding:"9px 11px",color:"#2a2018",fontFamily:"Noto Sans JP,sans-serif",outline:"none",resize:"vertical",minHeight:60},
};
