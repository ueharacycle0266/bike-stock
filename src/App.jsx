import { useState, useMemo } from "react";

const SUPABASE_URL = "https://autpzeeprcyosyqegtai.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1dHB6ZWVwcmN5b3N5cWVndGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNTEwMDUsImV4cCI6MjA5MjgyNzAwNX0.YWH6PvFYu2n2BN5aWQZ8KaPKv4Ns4K_ObfyK28Gdq18";
const PASSWORD = "0266";

const api = async (path, method = "GET", body = null) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": method === "POST" ? "return=representation" : "return=minimal",
    },
    body: body ? JSON.stringify(body) : null,
  });
  if (method === "GET" || method === "POST") return res.json();
  return res;
};

const uid = () => "x" + Math.random().toString(36).slice(2, 9);

const Ico = {
  Settings: () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>),
  Search: () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>),
  Plus: () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>),
  Refresh: () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>),
  X: () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>),
  Up: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>),
  Down: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>),
  Edit: () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>),
  Trash: () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>),
};

export default function App() {
  const [screen, setScreen] = useState("login");
  const [pwVal, setPwVal] = useState("");
  const [pwErr, setPwErr] = useState(false);
  const [cats, setCats] = useState([]);
  const [saving, setSaving] = useState(false);

  const [selectedCatId, setSelectedCatId] = useState("all");
  const [mainTab, setMainTab] = useState("stock"); // stock | order
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [addMenu, setAddMenu] = useState(false);
  const [stOpen, setStOpen] = useState(false);
  const [stTab, setStTab] = useState("cats");
  const [stCatId, setStCatId] = useState(null);
  const [stBrandId, setStBrandId] = useState(null);

  const [itemDetail, setItemDetail] = useState(null);
  const [detailStock, setDetailStock] = useState(0);
  const [addModal, setAddModal] = useState(null);
  const [editItemModal, setEditItemModal] = useState(null);
  const [editItemF, setEditItemF] = useState({ name: "", stock: "", minStock: "", retailPrice: "", costPrice: "" });

  const [newCatF, setNewCatF] = useState("");
  const [newBrandF, setNewBrandF] = useState({ name: "", catId: "" });
  const [newItemF, setNewItemF] = useState({ name: "", stock: "", minStock: "", retailPrice: "", costPrice: "", catId: "", brandId: "" });

  const [rnCat, setRnCat] = useState(null); const [rnCatV, setRnCatV] = useState("");
  const [rnBrand, setRnBrand] = useState(null); const [rnBrandV, setRnBrandV] = useState("");
  const [rnItem, setRnItem] = useState(null); const [rnItemV, setRnItemV] = useState("");

  const loadData = async () => {
    try {
      const [catsData, brandsData, itemsData] = await Promise.all([
        api("categories?select=*&order=order.asc"),
        api("brands?select=*&order=order.asc"),
        api("items?select=*&order=order.asc"),
      ]);
      setCats(catsData.map(c => ({
        ...c,
        brands: brandsData.filter(b => b.category_id === c.id).map(b => ({
          ...b,
          items: itemsData.filter(i => i.brand_id === b.id).map(i => ({
            id: i.id, name: i.name, stock: i.stock,
            minStock: i.min_stock, retailPrice: i.retail_price,
            costPrice: i.cost_price, order: i.order,
          })).sort((a, b) => a.order - b.order),
        })).sort((a, b) => a.order - b.order),
      })));
    } catch (e) { console.error(e); }
    setScreen("main");
  };

  const handleLogin = () => {
    if (pwVal === PASSWORD) { setScreen("loading"); loadData(); }
    else { setPwErr(true); setPwVal(""); setTimeout(() => setPwErr(false), 2000); }
  };

  const sortedCats = [...cats].sort((a, b) => a.order - b.order);

  // 表示するブランド一覧（「すべて」か特定カテゴリ）
  const displayBrands = useMemo(() => {
    if (selectedCatId === "all") {
      return sortedCats.flatMap(c => (c.brands || []).map(b => ({ ...b, catName: c.name })));
    }
    const cat = cats.find(c => c.id === selectedCatId);
    return (cat?.brands || []).map(b => ({ ...b, catName: cat.name }));
  }, [cats, selectedCatId]);

  const needOrder = useMemo(() => {
    const r = [];
    cats.forEach(c => c.brands?.forEach(b => b.items?.forEach(i => {
      if (i.stock <= i.minStock) r.push({ ...i, catName: c.name, brandName: b.name, catId: c.id, brandId: b.id });
    })));
    return r;
  }, [cats]);

  const searchResults = useMemo(() => {
    if (!searchQ.trim()) return [];
    const q = searchQ.toLowerCase();
    const r = [];
    cats.forEach(c => c.brands?.forEach(b => b.items?.forEach(i => {
      if (i.name.toLowerCase().includes(q)) r.push({ ...i, catName: c.name, brandName: b.name, catId: c.id, brandId: b.id });
    })));
    return r.slice(0, 8);
  }, [searchQ, cats]);

  const stCat = cats.find(c => c.id === stCatId);
  const sortedStBrands = stCat ? [...(stCat.brands || [])].sort((a, b) => a.order - b.order) : [];
  const stBrand = stCat?.brands?.find(b => b.id === stBrandId);
  const sortedStItems = stBrand ? [...(stBrand.items || [])].sort((a, b) => a.order - b.order) : [];

  const updItemLocal = (catId, brandId, itemId, patch) =>
    setCats(p => p.map(c => c.id !== catId ? c : {
      ...c, brands: c.brands.map(b => b.id !== brandId ? b : {
        ...b, items: b.items.map(i => i.id !== itemId ? i : { ...i, ...patch })
      })
    }));

  const openDetail = (catId, brandId, item) => {
    setItemDetail({ catId, brandId, item });
    setDetailStock(item.stock);
  };

  const confirmStock = async () => {
    if (!itemDetail) return;
    const { catId, brandId, item } = itemDetail;
    updItemLocal(catId, brandId, item.id, { stock: detailStock });
    setItemDetail(null);
    setSaving(true);
    await api(`items?id=eq.${item.id}`, "PATCH", { stock: detailStock });
    setSaving(false);
  };

  const openEditItem = (catId, brandId, item) => {
    setEditItemModal({ catId, brandId, itemId: item.id });
    setEditItemF({ name: item.name, stock: String(item.stock), minStock: String(item.minStock), retailPrice: String(item.retailPrice || ""), costPrice: String(item.costPrice || "") });
  };

  const doEditItem = async () => {
    if (!editItemModal || !editItemF.name) return;
    const patch = { name: editItemF.name, stock: +editItemF.stock || 0, minStock: +editItemF.minStock || 0, retailPrice: +editItemF.retailPrice || 0, costPrice: +editItemF.costPrice || 0 };
    updItemLocal(editItemModal.catId, editItemModal.brandId, editItemModal.itemId, patch);
    const sid = editItemModal.itemId; setEditItemModal(null);
    setSaving(true);
    await api(`items?id=eq.${sid}`, "PATCH", { name: patch.name, stock: patch.stock, min_stock: patch.minStock, retail_price: patch.retailPrice, cost_price: patch.costPrice });
    setSaving(false);
  };

  const doAddCat = async () => {
    if (!newCatF.trim()) return;
    const maxOrd = cats.reduce((m, c) => Math.max(m, c.order), -1);
    const newId = uid();
    setCats(p => [...p, { id: newId, name: newCatF.trim(), order: maxOrd + 1, brands: [] }]);
    setNewCatF(""); setAddModal(null);
    setSaving(true); await api("categories", "POST", { id: newId, name: newCatF.trim(), order: maxOrd + 1 }); setSaving(false);
  };

  const doAddBrand = async () => {
    if (!newBrandF.name.trim() || !newBrandF.catId) return;
    const cat = cats.find(c => c.id === newBrandF.catId); if (!cat) return;
    const maxOrd = (cat.brands || []).reduce((m, b) => Math.max(m, b.order), -1);
    const newId = uid();
    setCats(p => p.map(c => c.id !== newBrandF.catId ? c : { ...c, brands: [...(c.brands || []), { id: newId, category_id: newBrandF.catId, name: newBrandF.name.trim(), order: maxOrd + 1, items: [] }] }));
    setNewBrandF({ name: "", catId: "" }); setAddModal(null);
    setSaving(true); await api("brands", "POST", { id: newId, category_id: newBrandF.catId, name: newBrandF.name.trim(), order: maxOrd + 1 }); setSaving(false);
  };

  const doAddItem = async () => {
    if (!newItemF.name || newItemF.stock === "" || newItemF.minStock === "" || !newItemF.catId || !newItemF.brandId) return;
    const cat = cats.find(c => c.id === newItemF.catId);
    const brand = cat?.brands?.find(b => b.id === newItemF.brandId); if (!brand) return;
    const maxOrd = (brand.items || []).reduce((m, i) => Math.max(m, i.order), -1);
    const newId = uid();
    const newItem = { id: newId, name: newItemF.name, stock: +newItemF.stock || 0, minStock: +newItemF.minStock || 0, retailPrice: +newItemF.retailPrice || 0, costPrice: +newItemF.costPrice || 0, order: maxOrd + 1 };
    setCats(p => p.map(c => c.id !== newItemF.catId ? c : { ...c, brands: c.brands.map(b => b.id !== newItemF.brandId ? b : { ...b, items: [...(b.items || []), newItem] }) }));
    setNewItemF({ name: "", stock: "", minStock: "", retailPrice: "", costPrice: "", catId: "", brandId: "" }); setAddModal(null);
    setSaving(true);
    await api("items", "POST", { id: newId, brand_id: newItemF.brandId, category_id: newItemF.catId, name: newItem.name, stock: newItem.stock, min_stock: newItem.minStock, retail_price: newItem.retailPrice, cost_price: newItem.costPrice, order: newItem.order });
    setSaving(false);
  };

  const moveCat = async (catId, dir) => {
    const s = [...cats].sort((a, b) => a.order - b.order);
    const idx = s.findIndex(c => c.id === catId); const sw = idx + dir;
    if (sw < 0 || sw >= s.length) return;
    const a = s.map(c => ({ ...c })); const tmp = a[idx].order; a[idx].order = a[sw].order; a[sw].order = tmp;
    setCats(a); setSaving(true);
    await Promise.all([api(`categories?id=eq.${a[idx].id}`, "PATCH", { order: a[idx].order }), api(`categories?id=eq.${a[sw].id}`, "PATCH", { order: a[sw].order })]); setSaving(false);
  };

  const moveBrand = async (catId, brandId, dir) => {
    const cat = cats.find(c => c.id === catId); if (!cat) return;
    const s = [...(cat.brands || [])].sort((a, b) => a.order - b.order);
    const idx = s.findIndex(b => b.id === brandId); const sw = idx + dir;
    if (sw < 0 || sw >= s.length) return;
    const a = s.map(b => ({ ...b })); const tmp = a[idx].order; a[idx].order = a[sw].order; a[sw].order = tmp;
    setCats(p => p.map(c => c.id !== catId ? c : { ...c, brands: a })); setSaving(true);
    await Promise.all([api(`brands?id=eq.${a[idx].id}`, "PATCH", { order: a[idx].order }), api(`brands?id=eq.${a[sw].id}`, "PATCH", { order: a[sw].order })]); setSaving(false);
  };

  const moveItem = async (catId, brandId, itemId, dir) => {
    const cat = cats.find(c => c.id === catId); if (!cat) return;
    const brand = cat.brands?.find(b => b.id === brandId); if (!brand) return;
    const s = [...(brand.items || [])].sort((a, b) => a.order - b.order);
    const idx = s.findIndex(i => i.id === itemId); const sw = idx + dir;
    if (sw < 0 || sw >= s.length) return;
    const a = s.map(i => ({ ...i })); const tmp = a[idx].order; a[idx].order = a[sw].order; a[sw].order = tmp;
    setCats(p => p.map(c => c.id !== catId ? c : { ...c, brands: c.brands.map(b => b.id !== brandId ? b : { ...b, items: a }) }));
    setSaving(true);
    await Promise.all([api(`items?id=eq.${a[idx].id}`, "PATCH", { order: a[idx].order }), api(`items?id=eq.${a[sw].id}`, "PATCH", { order: a[sw].order })]); setSaving(false);
  };

  const delCat = async (catId) => {
    if (!window.confirm("このカテゴリとブランド・商品を全て削除しますか？")) return;
    setCats(p => p.filter(c => c.id !== catId));
    if (stCatId === catId) { setStCatId(null); setStBrandId(null); }
    setSaving(true); await api(`categories?id=eq.${catId}`, "DELETE"); setSaving(false);
  };

  const delBrand = async (catId, brandId) => {
    if (!window.confirm("このブランドと商品を全て削除しますか？")) return;
    setCats(p => p.map(c => c.id !== catId ? c : { ...c, brands: c.brands.filter(b => b.id !== brandId) }));
    if (stBrandId === brandId) setStBrandId(null);
    setSaving(true); await api(`brands?id=eq.${brandId}`, "DELETE"); setSaving(false);
  };

  const delItem = async (catId, brandId, itemId) => {
    if (!window.confirm("この商品を削除しますか？")) return;
    setCats(p => p.map(c => c.id !== catId ? c : { ...c, brands: c.brands.map(b => b.id !== brandId ? b : { ...b, items: b.items.filter(i => i.id !== itemId) }) }));
    setSaving(true); await api(`items?id=eq.${itemId}`, "DELETE"); setSaving(false);
  };

  const commitRnCat = async (catId) => {
    if (!rnCatV.trim()) { setRnCat(null); return; }
    setCats(p => p.map(c => c.id === catId ? { ...c, name: rnCatV.trim() } : c));
    setRnCat(null); setSaving(true); await api(`categories?id=eq.${catId}`, "PATCH", { name: rnCatV.trim() }); setSaving(false);
  };

  const commitRnBrand = async (catId, brandId) => {
    if (!rnBrandV.trim()) { setRnBrand(null); return; }
    setCats(p => p.map(c => c.id !== catId ? c : { ...c, brands: c.brands.map(b => b.id === brandId ? { ...b, name: rnBrandV.trim() } : b) }));
    setRnBrand(null); setSaving(true); await api(`brands?id=eq.${brandId}`, "PATCH", { name: rnBrandV.trim() }); setSaving(false);
  };

  const commitRnItem = async (catId, brandId, itemId) => {
    if (!rnItemV.trim()) { setRnItem(null); return; }
    updItemLocal(catId, brandId, itemId, { name: rnItemV.trim() });
    setRnItem(null); setSaving(true); await api(`items?id=eq.${itemId}`, "PATCH", { name: rnItemV.trim() }); setSaving(false);
  };

  // ── ログイン画面 ──────────────────
  if (screen === "login") return (
    <div style={{ background: "#f5f0e8", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{CSS}</style>
      <div style={{ background: "#faf7f2", border: "1px solid #e0d9ce", borderRadius: 20, padding: "40px 36px", width: 320, maxWidth: "90vw", boxShadow: "0 8px 32px rgba(42,32,24,.1)", textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
        <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 22, color: "#2a2018", marginBottom: 6 }}>🚲 在庫管理</div>
        <div style={{ fontFamily: "Syne,sans-serif", fontSize: 10, color: "#b0a898", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 28 }}>Bike Parts Inventory</div>
        <input type="password" value={pwVal} onChange={e => { setPwVal(e.target.value); setPwErr(false); }} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="パスワードを入力"
          style={{ width: "100%", background: pwErr ? "#fdf0ee" : "#f5f0e8", border: `1.5px solid ${pwErr ? "#c0392b" : "#ccc5ba"}`, borderRadius: 10, padding: "12px 14px", color: "#2a2018", fontFamily: "Noto Sans JP,sans-serif", fontSize: 16, outline: "none", textAlign: "center", letterSpacing: "0.2em", marginBottom: 8 }} autoFocus />
        {pwErr && <p style={{ color: "#c0392b", fontSize: 12, marginBottom: 8 }}>パスワードが違います</p>}
        <button className="pbtn" style={{ width: "100%", padding: "12px" }} onClick={handleLogin}>入る</button>
      </div>
    </div>
  );

  if (screen === "loading") return (
    <div style={{ background: "#f5f0e8", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <style>{CSS}</style>
      <div className="spin" />
      <p style={{ fontFamily: "Syne,sans-serif", color: "#9a8f82", fontSize: 14 }}>データを読み込み中...</p>
    </div>
  );

  // ── メイン画面 ────────────────────
  return (
    <div style={S.root}>
      <style>{CSS}</style>

      {/* ヘッダー */}
      <header style={S.hdr}>
        <div>
          <div style={S.logo}>🚲 在庫管理</div>
          <div style={S.sub}>Bike Parts Inventory</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {saving && <span style={{ fontSize: 10, color: "#b0a898" }}>保存中...</span>}
          <button className="icobtn" onClick={() => { setScreen("loading"); loadData(); }}><Ico.Refresh /></button>
          <button className="icobtn" onClick={() => { setSearchOpen(true); setSearchQ(""); }}><Ico.Search /></button>
          <button className="icobtn" onClick={() => setAddMenu(!addMenu)} style={addMenu ? { background: "#2a2018", color: "#f5f0e8" } : {}}><Ico.Plus /></button>
          <button className="icobtn" onClick={() => setStOpen(true)}><Ico.Settings /></button>
        </div>
      </header>

      {/* ＋メニュー */}
      {addMenu && (
        <div style={{ background: "#faf7f2", borderBottom: "1px solid #e0d9ce", padding: "10px 20px", display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="add-chip" onClick={() => { setAddModal("cat"); setAddMenu(false); }}>📁 カテゴリ追加</button>
          <button className="add-chip" onClick={() => { setAddModal("brand"); setAddMenu(false); }}>🏷 ブランド追加</button>
          <button className="add-chip" onClick={() => { setAddModal("item"); setAddMenu(false); }}>🔧 商品追加</button>
        </div>
      )}

      {/* 注文が必要バナー */}
      {needOrder.length > 0 && (
        <div style={{ background: "#fdf0ee", borderBottom: "1px solid #f0c8c4", padding: "8px 20px", display: "flex", alignItems: "center", gap: 8 }}>
          <span className="dot" />
          <span style={{ fontSize: 12, color: "#c0392b", fontWeight: 700 }}>注文が必要な商品が{needOrder.length}点あります</span>
        </div>
      )}

      {/* カテゴリ横スクロール */}
      <div style={{ background: "#faf7f2", borderBottom: "1px solid #e0d9ce", padding: "10px 20px", overflowX: "auto", whiteSpace: "nowrap", display: "flex", gap: 4 }} className="hide-scroll">
        {/* すべてタブ */}
        <button className={`cat-tab ${selectedCatId === "all" && mainTab === "stock" ? "cat-tab-on" : ""}`} onClick={() => { setSelectedCatId("all"); setMainTab("stock"); }}>
          すべて
        </button>
        {sortedCats.map(cat => (
          <button key={cat.id} className={`cat-tab ${selectedCatId === cat.id && mainTab === "stock" ? "cat-tab-on" : ""}`} onClick={() => { setSelectedCatId(cat.id); setMainTab("stock"); }}>
            {cat.name}
          </button>
        ))}
        {/* 注文が必要タブ */}
        <button className={`cat-tab ${mainTab === "order" ? "cat-tab-order" : ""}`} onClick={() => setMainTab("order")} style={{ display: "flex", alignItems: "center", gap: 5 }}>
          {needOrder.length > 0 && <span className="dot" style={{ width: 6, height: 6 }} />}
          要注文
          {needOrder.length > 0 && <span style={{ background: "#c0392b", color: "#fff", borderRadius: 99, padding: "0px 5px", fontSize: 10, fontWeight: 700 }}>{needOrder.length}</span>}
        </button>
      </div>

      {/* コンテンツ */}
      <main style={S.main}>

        {/* 注文が必要タブ */}
        {mainTab === "order" && (
          needOrder.length === 0
            ? <div style={S.empty}><div style={{ fontSize: 38 }}>✅</div><p style={{ color: "#9a8f82", marginTop: 12 }}>注文が必要な商品はありません</p></div>
            : needOrder.map(i => (
              <div key={i.id} className="irow" onClick={() => openDetail(i.catId, i.brandId, i)}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 700, color: "#2a2018", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.name}</span>
                    <span className={`tag ${i.stock === 0 ? "tcrit" : "tlow"}`}>{i.stock === 0 ? "在庫切れ" : "要注文"}</span>
                  </div>
                  <span style={{ color: "#b0a898", fontSize: 11 }}>{i.catName} › {i.brandName}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0 }}>
                  <span className={`snum ${i.stock === 0 ? "scrit" : "slow"}`}>{i.stock}</span>
                  <span style={{ fontSize: 10, color: "#b0a898", marginTop: 1 }}>ライン:{i.minStock}</span>
                </div>
              </div>
            ))
        )}

        {/* 在庫タブ */}
        {mainTab === "stock" && displayBrands.map(brand => (
          <div key={brand.id} style={S.brandBlk}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              {selectedCatId === "all" && <span style={{ color: "#b0a898", fontSize: 11, fontFamily: "Noto Sans JP,sans-serif" }}>{brand.catName} ›</span>}
              <span style={S.brandNm}>🏷 {brand.name}</span>
              <span style={{ color: "#b0a898", fontSize: 11 }}>{brand.items.length}種類</span>
            </div>
            {brand.items.length === 0 && <p style={{ color: "#c8bfb0", fontSize: 12, padding: "4px 0" }}>商品がまだありません</p>}
            {[...brand.items].sort((a, b) => a.order - b.order).map(item => {
              const low = item.stock <= item.minStock;
              const crit = item.stock === 0;
              const sc = crit ? "scrit" : low ? "slow" : "sok";
              return (
                <div key={item.id} className="irow" onClick={() => openDetail(brand.category_id || brand.catId || cats.find(c => c.brands?.some(b => b.id === brand.id))?.id, brand.id, item)}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 700, color: "#2a2018", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
                      {low && <span className={`tag ${crit ? "tcrit" : "tlow"}`}>{crit ? "在庫切れ" : "要注文"}</span>}
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 3, flexWrap: "wrap" }}>
                      {item.retailPrice > 0 && <span style={{ color: "#2a7a5a", fontSize: 11, fontWeight: 600 }}>定価 ¥{item.retailPrice.toLocaleString()}</span>}
                      {item.costPrice > 0 && <span style={{ color: "#9a8f82", fontSize: 11 }}>仕入 ¥{item.costPrice.toLocaleString()}</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0 }}>
                    <span className={`snum ${sc}`}>{item.stock}</span>
                    <span style={{ fontSize: 10, color: "#b0a898", marginTop: 1 }}>ライン:{item.minStock}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </main>

      {/* 検索パネル */}
      {searchOpen && (
        <div className="search-overlay" onClick={() => setSearchOpen(false)}>
          <div className="search-panel" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "#f5f0e8", border: "1.5px solid #ccc5ba", borderRadius: 10, padding: "8px 12px" }}>
                <Ico.Search />
                <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="商品名で検索..." autoFocus
                  style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 15, color: "#2a2018", fontFamily: "Noto Sans JP,sans-serif" }} />
              </div>
              <button className="icobtn" onClick={() => setSearchOpen(false)}><Ico.X /></button>
            </div>
            {searchQ && searchResults.length === 0 && <p style={{ color: "#b0a898", fontSize: 13, padding: "8px 0" }}>見つかりませんでした</p>}
            {searchResults.map(item => {
              const low = item.stock <= item.minStock;
              const crit = item.stock === 0;
              const sc = crit ? "scrit" : low ? "slow" : "sok";
              return (
                <div key={item.id} className="irow" style={{ marginBottom: 6 }} onClick={() => { setSelectedCatId(item.catId); setMainTab("stock"); setSearchOpen(false); openDetail(item.catId, item.brandId, item); }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 700, color: "#2a2018", fontSize: 14 }}>{item.name}</span>
                      {low && <span className={`tag ${crit ? "tcrit" : "tlow"}`}>{crit ? "在庫切れ" : "要注文"}</span>}
                    </div>
                    <span style={{ color: "#b0a898", fontSize: 11 }}>{item.catName} › {item.brandName}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <span className={`snum ${sc}`}>{item.stock}</span>
                    <span style={{ fontSize: 10, color: "#b0a898" }}>ライン:{item.minStock}</span>
                  </div>
                </div>
              );
            })}
            {!searchQ && <p style={{ color: "#c8bfb0", fontSize: 13, padding: "8px 0" }}>商品名を入力してください</p>}
          </div>
        </div>
      )}

      {/* 商品詳細モーダル */}
      {itemDetail && (() => {
        const { catId, brandId, item } = itemDetail;
        const cat = cats.find(c => c.id === catId);
        const brand = cat?.brands?.find(b => b.id === brandId);
        return (
          <div className="mover" onClick={() => setItemDetail(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                <h3 style={{ flex: 1, marginBottom: 0, fontFamily: "Noto Sans JP,sans-serif", fontWeight: 700, fontSize: 17, color: "#2a2018" }}>{item.name}</h3>
                <button className="icobtn" onClick={() => setItemDetail(null)} style={{ marginLeft: 8, flexShrink: 0 }}><Ico.X /></button>
              </div>
              <p style={{ color: "#b0a898", fontSize: 12, marginBottom: 16 }}>{cat?.name} › {brand?.name}</p>
              <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                {item.retailPrice > 0 && <span style={{ color: "#2a7a5a", fontSize: 13, fontWeight: 600 }}>定価 ¥{item.retailPrice.toLocaleString()}</span>}
                {item.costPrice > 0 && <span style={{ color: "#9a8f82", fontSize: 13 }}>仕入 ¥{item.costPrice.toLocaleString()}</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, margin: "16px 0 20px" }}>
                <button className="big-adj dec" onClick={() => setDetailStock(s => Math.max(0, s - 1))}>−</button>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "Noto Sans JP,sans-serif", fontWeight: 700, fontSize: 52, color: detailStock === 0 ? "#c0392b" : detailStock <= item.minStock ? "#c87a00" : "#2d7a44", lineHeight: 1 }}>{detailStock}</div>
                  <div style={{ color: "#b0a898", fontSize: 11, marginTop: 6 }}>注文ライン: {item.minStock}</div>
                </div>
                <button className="big-adj inc" onClick={() => setDetailStock(s => s + 1)}>+</button>
              </div>
              <div style={{ display: "flex", gap: 9 }}>
                <button className="gbtn" style={{ flex: 1 }} onClick={() => setItemDetail(null)}>キャンセル</button>
                <button className="pbtn" style={{ flex: 2 }} onClick={confirmStock}>確定</button>
              </div>
              <div style={{ borderTop: "1px solid #e8e2d8", marginTop: 14, paddingTop: 12 }}>
                <button style={{ width: "100%", background: "#f5f0e8", border: "1px solid #e0d9ce", borderRadius: 8, padding: "9px", fontSize: 13, color: "#7a6f63", cursor: "pointer", fontFamily: "Noto Sans JP,sans-serif" }}
                  onClick={() => { setItemDetail(null); openEditItem(catId, brandId, item); }}>
                  📝 詳細編集（名前・価格・注文ライン）
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 詳細編集モーダル */}
      {editItemModal && (
        <div className="mover" onClick={() => setEditItemModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>📝 商品を編集</h3>
            <div className="fg"><label>商品名</label><input value={editItemF.name} onChange={e => setEditItemF(n => ({ ...n, name: e.target.value }))} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div className="fg"><label>在庫数</label><input type="number" min="0" value={editItemF.stock} onChange={e => setEditItemF(n => ({ ...n, stock: e.target.value }))} /></div>
              <div className="fg"><label>注文ライン</label><input type="number" min="0" value={editItemF.minStock} onChange={e => setEditItemF(n => ({ ...n, minStock: e.target.value }))} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div className="fg"><label>定価（円）</label><input type="number" min="0" value={editItemF.retailPrice} onChange={e => setEditItemF(n => ({ ...n, retailPrice: e.target.value }))} placeholder="0" /></div>
              <div className="fg"><label>仕入れ価格（円）</label><input type="number" min="0" value={editItemF.costPrice} onChange={e => setEditItemF(n => ({ ...n, costPrice: e.target.value }))} placeholder="0" /></div>
            </div>
            <div style={{ display: "flex", gap: 9, justifyContent: "flex-end", marginTop: 4 }}>
              <button className="gbtn" onClick={() => setEditItemModal(null)}>キャンセル</button>
              <button className="pbtn" onClick={doEditItem}>保存</button>
            </div>
          </div>
        </div>
      )}

      {/* カテゴリ追加モーダル */}
      {addModal === "cat" && (
        <div className="mover" onClick={() => setAddModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>📁 カテゴリを追加</h3>
            <div className="fg"><label>カテゴリ名</label><input value={newCatF} onChange={e => setNewCatF(e.target.value)} placeholder="例: タイヤ・チューブ" autoFocus onKeyDown={e => e.key === "Enter" && doAddCat()} /></div>
            <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
              <button className="gbtn" onClick={() => setAddModal(null)}>キャンセル</button>
              <button className="pbtn" onClick={doAddCat}>追加</button>
            </div>
          </div>
        </div>
      )}

      {/* ブランド追加モーダル */}
      {addModal === "brand" && (
        <div className="mover" onClick={() => setAddModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>🏷 ブランドを追加</h3>
            <div className="fg"><label>カテゴリ</label>
              <select value={newBrandF.catId} onChange={e => setNewBrandF(n => ({ ...n, catId: e.target.value }))}>
                <option value="">選択してください</option>
                {sortedCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="fg"><label>ブランド名</label><input value={newBrandF.name} onChange={e => setNewBrandF(n => ({ ...n, name: e.target.value }))} placeholder="例: Panaracer" onKeyDown={e => e.key === "Enter" && doAddBrand()} /></div>
            <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
              <button className="gbtn" onClick={() => setAddModal(null)}>キャンセル</button>
              <button className="pbtn" onClick={doAddBrand}>追加</button>
            </div>
          </div>
        </div>
      )}

      {/* 商品追加モーダル */}
      {addModal === "item" && (
        <div className="mover" onClick={() => setAddModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>🔧 商品を追加</h3>
            <div className="fg"><label>カテゴリ</label>
              <select value={newItemF.catId} onChange={e => setNewItemF(n => ({ ...n, catId: e.target.value, brandId: "" }))}>
                <option value="">選択してください</option>
                {sortedCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {newItemF.catId && (
              <div className="fg"><label>ブランド</label>
                <select value={newItemF.brandId} onChange={e => setNewItemF(n => ({ ...n, brandId: e.target.value }))}>
                  <option value="">選択してください</option>
                  {[...(cats.find(c => c.id === newItemF.catId)?.brands || [])].sort((a, b) => a.order - b.order).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}
            <div className="fg"><label>商品名 *</label><input value={newItemF.name} onChange={e => setNewItemF(n => ({ ...n, name: e.target.value }))} placeholder="例: 26インチ タイヤ" /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div className="fg"><label>在庫数 *</label><input type="number" min="0" value={newItemF.stock} onChange={e => setNewItemF(n => ({ ...n, stock: e.target.value }))} placeholder="0" /></div>
              <div className="fg"><label>注文ライン *</label><input type="number" min="0" value={newItemF.minStock} onChange={e => setNewItemF(n => ({ ...n, minStock: e.target.value }))} placeholder="5" /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div className="fg"><label>定価（円）</label><input type="number" min="0" value={newItemF.retailPrice} onChange={e => setNewItemF(n => ({ ...n, retailPrice: e.target.value }))} placeholder="0" /></div>
              <div className="fg"><label>仕入れ価格（円）</label><input type="number" min="0" value={newItemF.costPrice} onChange={e => setNewItemF(n => ({ ...n, costPrice: e.target.value }))} placeholder="0" /></div>
            </div>
            <div style={{ display: "flex", gap: 9, justifyContent: "flex-end", marginTop: 4 }}>
              <button className="gbtn" onClick={() => setAddModal(null)}>キャンセル</button>
              <button className="pbtn" onClick={doAddItem}>追加</button>
            </div>
          </div>
        </div>
      )}

      {/* 設定パネル */}
      {stOpen && (
        <div className="stover" onClick={() => setStOpen(false)}>
          <aside className="stpanel" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 17, color: "#2a2018", display: "flex", alignItems: "center", gap: 7 }}><Ico.Settings /> 設定・並び替え</span>
              <button className="icobtn" onClick={() => setStOpen(false)}><Ico.X /></button>
            </div>
            <div style={{ display: "flex", gap: 4, marginBottom: 18, background: "#ede8df", borderRadius: 9, padding: 4 }}>
              {["cats", "brands", "items"].map(t => (
                <button key={t} className={`sttab ${stTab === t ? "sttabon" : ""}`} onClick={() => { setStTab(t); setRnCat(null); setRnBrand(null); setRnItem(null); }}>
                  {t === "cats" ? "カテゴリ" : t === "brands" ? "ブランド" : "商品"}
                </button>
              ))}
            </div>
            {stTab === "cats" && (
              <>
                <p style={{ fontSize: 11, color: "#b0a898", marginBottom: 11 }}>↑↓ 順番変更　✏ 名前変更　🗑 削除</p>
                {sortedCats.map((cat, idx) => (
                  <div key={cat.id} className="strow">
                    {rnCat === cat.id
                      ? <input className="rninput" value={rnCatV} onChange={e => setRnCatV(e.target.value)} autoFocus onBlur={() => commitRnCat(cat.id)} onKeyDown={e => { if (e.key === "Enter") commitRnCat(cat.id); if (e.key === "Escape") setRnCat(null); }} />
                      : <span style={{ flex: 1, fontWeight: 600, color: "#2a2018", fontSize: 14 }}>{cat.name}<span style={{ color: "#b0a898", fontWeight: 400, fontSize: 11, marginLeft: 5 }}>{(cat.brands || []).length}ブランド</span></span>
                    }
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="sico" onClick={() => moveCat(cat.id, -1)} disabled={idx === 0}><Ico.Up /></button>
                      <button className="sico" onClick={() => moveCat(cat.id, 1)} disabled={idx === sortedCats.length - 1}><Ico.Down /></button>
                      <button className="sico sedit" onClick={() => { setRnCat(cat.id); setRnCatV(cat.name); }}><Ico.Edit /></button>
                      <button className="sico sdel" onClick={() => delCat(cat.id)}><Ico.Trash /></button>
                    </div>
                  </div>
                ))}
              </>
            )}
            {stTab === "brands" && (
              <>
                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 11, color: "#b0a898", marginBottom: 8 }}>カテゴリを選択</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {sortedCats.map(c => <button key={c.id} className={`chip ${stCatId === c.id ? "chipon" : ""}`} onClick={() => { setStCatId(c.id); setRnBrand(null); }}>{c.name}</button>)}
                  </div>
                </div>
                {stCatId ? (
                  <>
                    <p style={{ fontSize: 11, color: "#b0a898", marginBottom: 10 }}>↑↓ 順番変更　✏ 名前変更　🗑 削除</p>
                    {sortedStBrands.map((brand, idx) => (
                      <div key={brand.id} className="strow">
                        {rnBrand === brand.id
                          ? <input className="rninput" value={rnBrandV} onChange={e => setRnBrandV(e.target.value)} autoFocus onBlur={() => commitRnBrand(stCatId, brand.id)} onKeyDown={e => { if (e.key === "Enter") commitRnBrand(stCatId, brand.id); if (e.key === "Escape") setRnBrand(null); }} />
                          : <span style={{ flex: 1, fontWeight: 600, color: "#2a2018", fontSize: 13 }}>{brand.name}<span style={{ color: "#b0a898", fontWeight: 400, fontSize: 11, marginLeft: 5 }}>{(brand.items || []).length}種類</span></span>
                        }
                        <div style={{ display: "flex", gap: 4 }}>
                          <button className="sico" onClick={() => moveBrand(stCatId, brand.id, -1)} disabled={idx === 0}><Ico.Up /></button>
                          <button className="sico" onClick={() => moveBrand(stCatId, brand.id, 1)} disabled={idx === sortedStBrands.length - 1}><Ico.Down /></button>
                          <button className="sico sedit" onClick={() => { setRnBrand(brand.id); setRnBrandV(brand.name); }}><Ico.Edit /></button>
                          <button className="sico sdel" onClick={() => delBrand(stCatId, brand.id)}><Ico.Trash /></button>
                        </div>
                      </div>
                    ))}
                    {sortedStBrands.length === 0 && <p style={{ color: "#c8bfb0", fontSize: 13 }}>ブランドがありません</p>}
                  </>
                ) : <p style={{ color: "#c8bfb0", fontSize: 13, paddingTop: 6 }}>カテゴリを選んでください</p>}
              </>
            )}
            {stTab === "items" && (
              <>
                <div style={{ marginBottom: 10 }}>
                  <p style={{ fontSize: 11, color: "#b0a898", marginBottom: 8 }}>カテゴリを選択</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                    {sortedCats.map(c => <button key={c.id} className={`chip ${stCatId === c.id ? "chipon" : ""}`} onClick={() => { setStCatId(c.id); setStBrandId(null); setRnItem(null); }}>{c.name}</button>)}
                  </div>
                  {stCatId && (
                    <>
                      <p style={{ fontSize: 11, color: "#b0a898", marginBottom: 8 }}>ブランドを選択</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {sortedStBrands.map(b => <button key={b.id} className={`chip ${stBrandId === b.id ? "chipon" : ""}`} onClick={() => { setStBrandId(b.id); setRnItem(null); }}>{b.name}</button>)}
                      </div>
                    </>
                  )}
                </div>
                {stBrandId ? (
                  <>
                    <p style={{ fontSize: 11, color: "#b0a898", marginBottom: 10 }}>↑↓ 順番　✏ 名前変更　📝 詳細編集　🗑 削除</p>
                    {sortedStItems.map((item, idx) => {
                      const rk = `${stBrandId}:${item.id}`;
                      return (
                        <div key={item.id} className="strow">
                          {rnItem === rk
                            ? <input className="rninput" value={rnItemV} onChange={e => setRnItemV(e.target.value)} autoFocus onBlur={() => commitRnItem(stCatId, stBrandId, item.id)} onKeyDown={e => { if (e.key === "Enter") commitRnItem(stCatId, stBrandId, item.id); if (e.key === "Escape") setRnItem(null); }} />
                            : <span style={{ flex: 1, fontWeight: 600, color: "#2a2018", fontSize: 13 }}>{item.name}<span style={{ color: "#b0a898", fontWeight: 400, fontSize: 11, marginLeft: 5 }}>在庫:{item.stock}</span></span>
                          }
                          <div style={{ display: "flex", gap: 4 }}>
                            <button className="sico" onClick={() => moveItem(stCatId, stBrandId, item.id, -1)} disabled={idx === 0}><Ico.Up /></button>
                            <button className="sico" onClick={() => moveItem(stCatId, stBrandId, item.id, 1)} disabled={idx === sortedStItems.length - 1}><Ico.Down /></button>
                            <button className="sico sedit" onClick={() => { setRnItem(rk); setRnItemV(item.name); }}><Ico.Edit /></button>
                            <button className="sico" style={{ background: "#e8f0d6", color: "#2d7a44", border: "1px solid #c8e0b0", fontSize: 13 }} onClick={() => { setStOpen(false); openEditItem(stCatId, stBrandId, item); }}>📝</button>
                            <button className="sico sdel" onClick={() => delItem(stCatId, stBrandId, item.id)}><Ico.Trash /></button>
                          </div>
                        </div>
                      );
                    })}
                    {sortedStItems.length === 0 && <p style={{ color: "#c8bfb0", fontSize: 13 }}>商品がありません</p>}
                  </>
                ) : <p style={{ color: "#c8bfb0", fontSize: 13, paddingTop: 6 }}>{stCatId ? "ブランドを選んでください" : "カテゴリを選んでください"}</p>}
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Noto+Sans+JP:wght@400;500;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #f5f0e8; font-family: 'Noto Sans JP', sans-serif; color: #2a2018; }
  ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #ede8df; } ::-webkit-scrollbar-thumb { background: #c8bfb0; border-radius: 2px; }
  .hide-scroll::-webkit-scrollbar { display: none; }
  .spin { width: 36px; height: 36px; border: 3px solid #e0d9ce; border-top-color: #2a2018; border-radius: 50%; animation: rot .7s linear infinite; }
  @keyframes rot { to { transform: rotate(360deg); } }
  .pbtn { background: #2a2018; color: #f5f0e8; font-weight: 700; padding: 9px 22px; font-size: 13px; border-radius: 8px; border: none; cursor: pointer; font-family: 'Syne', sans-serif; transition: background .15s; }
  .pbtn:hover { background: #3d3020; }
  .gbtn { background: #e8e2d8; color: #7a6f63; font-weight: 600; padding: 9px 18px; font-size: 13px; border-radius: 8px; border: none; cursor: pointer; font-family: 'Syne', sans-serif; transition: background .15s; }
  .gbtn:hover { background: #ddd6ca; color: #2a2018; }
  .icobtn { background: #e8e2d8; border: none; cursor: pointer; border-radius: 9px; padding: 8px; display: flex; align-items: center; justify-content: center; color: #7a6f63; transition: background .15s, color .15s; }
  .icobtn:hover { background: #2a2018; color: #f5f0e8; }
  .cat-tab { background: none; border: none; cursor: pointer; font-family: 'Noto Sans JP', sans-serif; font-size: 13px; font-weight: 600; padding: 6px 14px; border-radius: 20px; color: #c8bfb0; transition: all .15s; white-space: nowrap; display: inline-flex; align-items: center; gap: 4px; }
  .cat-tab:hover { color: #7a6f63; background: #f0ece4; }
  .cat-tab-on { background: #2a2018; color: #f5f0e8 !important; }
  .cat-tab-order { background: #fdf0ee; color: #c0392b !important; border: 1px solid #f0c8c4; }
  .add-chip { background: #f5f0e8; border: 1.5px solid #e0d9ce; border-radius: 20px; padding: 7px 16px; font-size: 13px; font-family: 'Noto Sans JP', sans-serif; font-weight: 600; color: #2a2018; cursor: pointer; transition: all .12s; }
  .add-chip:hover { background: #2a2018; color: #f5f0e8; border-color: #2a2018; }
  .irow { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 10px; background: #fff; border: 1px solid #e8e2d8; margin-bottom: 6px; cursor: pointer; transition: border-color .12s, box-shadow .12s, transform .12s; }
  .irow:hover { border-color: #c8bfb0; box-shadow: 0 2px 10px rgba(42,32,24,.09); transform: translateY(-1px); }
  .snum { font-family: 'Noto Sans JP', sans-serif; font-weight: 700; font-size: 22px; }
  .sok { color: #2d7a44; } .slow { color: #c87a00; } .scrit { color: #c0392b; }
  .tag { font-size: 10px; padding: 1px 6px; border-radius: 4px; font-family: 'Noto Sans JP', sans-serif; font-weight: 700; flex-shrink: 0; }
  .tlow { background: #c87a0015; color: #c87a00; border: 1px solid #c87a0040; } .tcrit { background: #c0392b15; color: #c0392b; border: 1px solid #c0392b40; }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: #c0392b; display: inline-block; animation: pulse 1.5s infinite; flex-shrink: 0; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
  .big-adj { width: 56px; height: 56px; border-radius: 50%; border: none; cursor: pointer; font-size: 28px; font-weight: 700; display: flex; align-items: center; justify-content: center; transition: all .12s; font-family: 'Noto Sans JP', sans-serif; }
  .big-adj.dec { background: #f0d9d6; color: #c0392b; } .big-adj.dec:hover { background: #e8c8c4; transform: scale(1.05); }
  .big-adj.inc { background: #d6ead9; color: #2d7a44; } .big-adj.inc:hover { background: #c2dfc7; transform: scale(1.05); }
  .search-overlay { position: fixed; inset: 0; background: rgba(42,32,24,.4); z-index: 950; display: flex; align-items: flex-start; justify-content: center; padding-top: 60px; backdrop-filter: blur(4px); }
  .search-panel { background: #faf7f2; border: 1px solid #ddd6ca; border-radius: 16px; padding: 16px; width: 420px; max-width: 93vw; max-height: 70vh; overflow-y: auto; box-shadow: 0 10px 36px rgba(42,32,24,.15); }
  .mover { position: fixed; inset: 0; background: rgba(42,32,24,.42); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
  .modal { background: #faf7f2; border: 1px solid #ddd6ca; border-radius: 16px; padding: 26px; width: 370px; max-width: 92vw; box-shadow: 0 10px 36px rgba(42,32,24,.13); max-height: 90vh; overflow-y: auto; }
  .modal h3 { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 800; color: #2a2018; margin-bottom: 18px; }
  .fg { margin-bottom: 13px; } .fg label { display: block; font-size: 11px; color: #9a8f82; margin-bottom: 5px; }
  .fg input, .fg select { width: 100%; background: #f5f0e8; border: 1px solid #ccc5ba; border-radius: 8px; padding: 9px 11px; color: #2a2018; font-family: 'Noto Sans JP', sans-serif; font-size: 14px; outline: none; transition: border-color .15s; }
  .fg input:focus, .fg select:focus { border-color: #2a2018; } .fg select option { background: #faf7f2; }
  .stover { position: fixed; inset: 0; background: rgba(42,32,24,.28); z-index: 900; display: flex; justify-content: flex-end; }
  .stpanel { background: #faf7f2; width: 350px; max-width: 93vw; height: 100%; overflow-y: auto; padding: 26px 20px; box-shadow: -4px 0 28px rgba(42,32,24,.13); animation: sin .22s cubic-bezier(.22,1,.36,1); }
  @keyframes sin { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  .sttab { flex: 1; background: none; border: none; cursor: pointer; font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700; padding: 8px 0; border-radius: 7px; color: #9a8f82; transition: all .13s; }
  .sttabon { background: #faf7f2; color: #2a2018; box-shadow: 0 1px 4px rgba(42,32,24,.09); }
  .strow { display: flex; align-items: center; gap: 7px; padding: 9px 11px; border-radius: 9px; background: #f5f0e8; border: 1px solid #e8e2d8; margin-bottom: 6px; min-height: 48px; } .strow:hover { border-color: #c8bfb0; }
  .sico { background: #f0ece4; border: 1px solid #e0d9ce; cursor: pointer; border-radius: 6px; padding: 5px; display: flex; align-items: center; justify-content: center; color: #9a8f82; transition: all .12s; font-size: 13px; }
  .sico:hover { background: #e8e2d8; color: #2a2018; } .sico:disabled { opacity: .22; cursor: not-allowed; }
  .sedit:hover { background: #d6e4f0; color: #2563a8; } .sdel:hover { background: #f0d9d6; color: #c0392b; }
  .rninput { flex: 1; background: #fff; border: 1.5px solid #2a2018; border-radius: 6px; padding: 5px 9px; font-family: 'Noto Sans JP', sans-serif; font-size: 13px; color: #2a2018; outline: none; }
  .chip { background: #e8e2d8; border: 1.5px solid transparent; border-radius: 20px; padding: 5px 13px; font-family: 'Noto Sans JP', sans-serif; font-size: 12px; font-weight: 600; color: #7a6f63; cursor: pointer; transition: all .12s; }
  .chip:hover { background: #ddd6ca; color: #2a2018; } .chipon { background: #2a2018; color: #f5f0e8; border-color: #2a2018; }
`;

const S = {
  root: { background: "#f5f0e8", minHeight: "100vh" },
  hdr: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #e0d9ce", background: "#faf7f2" },
  logo: { fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 20, color: "#2a2018", letterSpacing: "-.02em" },
  sub: { fontFamily: "Syne,sans-serif", fontSize: 10, color: "#b0a898", letterSpacing: ".1em", marginTop: 2, textTransform: "uppercase" },
  main: { padding: "16px 20px", maxWidth: 860 },
  brandBlk: { background: "#faf7f2", border: "1px solid #e8e2d8", borderRadius: 12, padding: "12px 14px", marginBottom: 12 },
  brandNm: { fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 13, color: "#2563a8" },
  empty: { textAlign: "center", padding: "64px 0" },
};
