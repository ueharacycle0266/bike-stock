import { useState, useMemo, useEffect } from "react";

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
  Settings: () => (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  Up: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>),
  Down: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>),
  Edit: () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>),
  Trash: () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>),
  X: () => (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>),
  Refresh: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>),
  Lock: () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>),
};

function LoginScreen({ onLogin }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const handleLogin = () => {
    if (pw === PASSWORD) { onLogin(); }
    else { setErr(true); setPw(""); setTimeout(() => setErr(false), 2000); }
  };
  return (
    <div style={{ background: "#f5f0e8", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{CSS}</style>
      <div style={{ background: "#faf7f2", border: "1px solid #e0d9ce", borderRadius: 20, padding: "40px 36px", width: 320, maxWidth: "90vw", boxShadow: "0 8px 32px rgba(42,32,24,.1)", textAlign: "center" }}>
        <div style={{ color: "#2a2018", marginBottom: 8 }}><Ico.Lock /></div>
        <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 22, color: "#2a2018", marginBottom: 6 }}>🚲 在庫管理</div>
        <div style={{ fontFamily: "Syne,sans-serif", fontSize: 10, color: "#b0a898", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 28 }}>Bike Parts Inventory</div>
        <input type="password" value={pw} onChange={e => { setPw(e.target.value); setErr(false); }} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="パスワードを入力"
          style={{ width: "100%", background: err ? "#fdf0ee" : "#f5f0e8", border: `1.5px solid ${err ? "#c0392b" : "#ccc5ba"}`, borderRadius: 10, padding: "12px 14px", color: "#2a2018", fontFamily: "Noto Sans JP,sans-serif", fontSize: 16, outline: "none", textAlign: "center", letterSpacing: "0.2em", marginBottom: 8 }} autoFocus />
        {err && <p style={{ color: "#c0392b", fontSize: 12, marginBottom: 8, fontFamily: "Noto Sans JP,sans-serif" }}>パスワードが違います</p>}
        <button className="pbtn" style={{ width: "100%", padding: "12px" }} onClick={handleLogin}>入る</button>
      </div>
    </div>
  );
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(() => sessionStorage.getItem("bike_auth") === "1");
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("all");

  const [adjModal, setAdjModal] = useState(null);
  const [addItemModal, setAddItemModal] = useState(null);
  const [editItemModal, setEditItemModal] = useState(null); // 商品編集モーダル
  const [addBrandModal, setAddBrandModal] = useState(null);
  const [addCatModal, setAddCatModal] = useState(false);
  const [minModal, setMinModal] = useState(null);

  const [stOpen, setStOpen] = useState(false);
  const [stTab, setStTab] = useState("cats");
  const [stCatId, setStCatId] = useState(null);
  const [stBrandId, setStBrandId] = useState(null);

  const [rnCat, setRnCat] = useState(null); const [rnCatV, setRnCatV] = useState("");
  const [rnBrand, setRnBrand] = useState(null); const [rnBrandV, setRnBrandV] = useState("");
  const [rnItem, setRnItem] = useState(null); const [rnItemV, setRnItemV] = useState("");

  const [newItemF, setNewItemF] = useState({ name: "", stock: "", minStock: "", retailPrice: "", costPrice: "", catId: "", brandId: "" });
  const [editItemF, setEditItemF] = useState({ name: "", stock: "", minStock: "", retailPrice: "", costPrice: "" });
  const [newBrandF, setNewBrandF] = useState("");
  const [newCatF, setNewCatF] = useState("");
  const [adjVal, setAdjVal] = useState("");
  const [minVal, setMinVal] = useState("");

  const loadData = async () => {
    setLoading(true);
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
          })),
        })),
      })));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (loggedIn) loadData(); }, [loggedIn]);

  const handleLogin = () => {
    sessionStorage.setItem("bike_auth", "1");
    setLoggedIn(true);
  };

  if (!loggedIn) return <LoginScreen onLogin={handleLogin} />;

  const sortedCats = [...cats].sort((a, b) => a.order - b.order);
  const needOrder = useMemo(() => {
    const r = [];
    cats.forEach(c => c.brands?.forEach(b => b.items?.forEach(i => {
      if (i.stock <= i.minStock) r.push({ ...i, catName: c.name, brandName: b.name, catId: c.id, brandId: b.id });
    })));
    return r;
  }, [cats]);

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

  // 在庫増減
  const doAdj = async () => {
    if (!adjModal || adjVal === "") return;
    const n = parseInt(adjVal); if (isNaN(n) || n < 0) return;
    const c = cats.find(c => c.id === adjModal.catId);
    const b = c?.brands?.find(b => b.id === adjModal.brandId);
    const i = b?.items?.find(i => i.id === adjModal.itemId); if (!i) return;
    const newStock = adjModal.mode === "add" ? i.stock + n : Math.max(0, i.stock - n);
    updItemLocal(adjModal.catId, adjModal.brandId, adjModal.itemId, { stock: newStock });
    const sid = adjModal.itemId; setAdjModal(null); setAdjVal("");
    setSaving(true); await api(`items?id=eq.${sid}`, "PATCH", { stock: newStock }); setSaving(false);
  };

  // 商品編集
  const openEditItem = (catId, brandId, item) => {
    setEditItemModal({ catId, brandId, itemId: item.id });
    setEditItemF({ name: item.name, stock: String(item.stock), minStock: String(item.minStock), retailPrice: String(item.retailPrice || ""), costPrice: String(item.costPrice || "") });
  };

  const doEditItem = async () => {
    if (!editItemModal || !editItemF.name || editItemF.stock === "" || editItemF.minStock === "") return;
    const patch = { name: editItemF.name, stock: +editItemF.stock || 0, minStock: +editItemF.minStock || 0, retailPrice: +editItemF.retailPrice || 0, costPrice: +editItemF.costPrice || 0 };
    updItemLocal(editItemModal.catId, editItemModal.brandId, editItemModal.itemId, patch);
    const sid = editItemModal.itemId; setEditItemModal(null);
    setSaving(true);
    await api(`items?id=eq.${sid}`, "PATCH", { name: patch.name, stock: patch.stock, min_stock: patch.minStock, retail_price: patch.retailPrice, cost_price: patch.costPrice });
    setSaving(false);
  };

  // 商品追加
  const doAddItem = async () => {
    if (!newItemF.name || newItemF.stock === "" || newItemF.minStock === "") return;
    const catId = addItemModal?.catId || newItemF.catId;
    const brandId = addItemModal?.brandId || newItemF.brandId;
    if (!catId || !brandId) return;
    const cat = cats.find(c => c.id === catId);
    const brand = cat?.brands?.find(b => b.id === brandId); if (!brand) return;
    const maxOrd = (brand.items || []).reduce((m, i) => Math.max(m, i.order), -1);
    const newId = uid();
    const newItem = { id: newId, name: newItemF.name, stock: +newItemF.stock || 0, minStock: +newItemF.minStock || 0, retailPrice: +newItemF.retailPrice || 0, costPrice: +newItemF.costPrice || 0, order: maxOrd + 1 };
    setCats(p => p.map(c => c.id !== catId ? c : { ...c, brands: c.brands.map(b => b.id !== brandId ? b : { ...b, items: [...(b.items || []), newItem] }) }));
    setNewItemF({ name: "", stock: "", minStock: "", retailPrice: "", costPrice: "", catId: "", brandId: "" });
    setAddItemModal(null);
    setSaving(true);
    await api("items", "POST", { id: newId, brand_id: brandId, category_id: catId, name: newItem.name, stock: newItem.stock, min_stock: newItem.minStock, retail_price: newItem.retailPrice, cost_price: newItem.costPrice, order: newItem.order });
    setSaving(false);
  };

  const doAddBrand = async () => {
    if (!newBrandF.trim() || !addBrandModal?.catId) return;
    const catId = addBrandModal.catId;
    const cat = cats.find(c => c.id === catId); if (!cat) return;
    const maxOrd = (cat.brands || []).reduce((m, b) => Math.max(m, b.order), -1);
    const newId = uid();
    setCats(p => p.map(c => c.id !== catId ? c : { ...c, brands: [...(c.brands || []), { id: newId, category_id: catId, name: newBrandF.trim(), order: maxOrd + 1, items: [] }] }));
    setNewBrandF(""); setAddBrandModal(null);
    setSaving(true); await api("brands", "POST", { id: newId, category_id: catId, name: newBrandF.trim(), order: maxOrd + 1 }); setSaving(false);
  };

  const doAddCat = async () => {
    if (!newCatF.trim()) return;
    const maxOrd = cats.reduce((m, c) => Math.max(m, c.order), -1);
    const newId = uid();
    setCats(p => [...p, { id: newId, name: newCatF.trim(), order: maxOrd + 1, brands: [] }]);
    setNewCatF(""); setAddCatModal(false);
    setSaving(true); await api("categories", "POST", { id: newId, name: newCatF.trim(), order: maxOrd + 1 }); setSaving(false);
  };

  const doMin = async () => {
    if (!minModal || minVal === "") return;
    const n = parseInt(minVal); if (isNaN(n) || n < 0) return;
    updItemLocal(minModal.catId, minModal.brandId, minModal.itemId, { minStock: n });
    const sid = minModal.itemId; setMinModal(null); setMinVal("");
    setSaving(true); await api(`items?id=eq.${sid}`, "PATCH", { min_stock: n }); setSaving(false);
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

  if (loading) return (
    <div style={{ background: "#f5f0e8", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <style>{CSS}</style>
      <div className="spin" />
      <p style={{ fontFamily: "Syne,sans-serif", color: "#9a8f82", fontSize: 14 }}>データを読み込み中...</p>
    </div>
  );

  return (
    <div style={S.root}>
      <style>{CSS}</style>

      <header style={S.hdr}>
        <div>
          <div style={S.logo}>🚲 在庫管理</div>
          <div style={S.sub}>Bike Parts Inventory</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {saving && <span style={{ fontSize: 11, color: "#9a8f82" }}>保存中...</span>}
          <button className="icobtn" onClick={loadData}><Ico.Refresh /></button>
          <button className="gbtn" onClick={() => setAddItemModal({ catId: "", brandId: "" })}>+ 商品追加</button>
          <button className="pbtn" onClick={() => setAddCatModal(true)}>+ カテゴリ追加</button>
          <button className="icobtn" onClick={() => setStOpen(true)}><Ico.Settings /></button>
        </div>
      </header>

      <nav style={S.nav}>
        <button className={`tbtn ${tab === "all" ? "ton" : "toff"}`} onClick={() => setTab("all")}>全在庫</button>
        <button className={`tbtn ${tab === "order" ? "tred" : "toff"}`} onClick={() => setTab("order")} style={{ display: "flex", alignItems: "center", gap: 7 }}>
          {needOrder.length > 0 && <span className="dot" />}
          注文が必要
          {needOrder.length > 0 && <span className="badge">{needOrder.length}</span>}
        </button>
      </nav>

      <main style={S.main}>
        {tab === "order" && (
          needOrder.length === 0
            ? <div style={S.empty}><div style={{ fontSize: 38 }}>✅</div><p style={{ color: "#9a8f82", marginTop: 12 }}>注文が必要な商品はありません</p></div>
            : <>
              <p style={{ color: "#c0392b", fontFamily: "Syne,sans-serif", fontWeight: 700, marginBottom: 16, fontSize: 14 }}>⚠️ {needOrder.length}点が注文ラインに達しています</p>
              {needOrder.map(i => (
                <div className="ocard" key={i.id}>
                  <div>
                    <div style={{ color: "#9a8f82", fontSize: 11, marginBottom: 2 }}>{i.catName} › {i.brandName}</div>
                    <div style={{ color: "#2a2018", fontWeight: 700, fontSize: 15 }}>{i.name}</div>
                    <div style={{ color: "#b0a898", fontSize: 11, marginTop: 2 }}>注文ライン: {i.minStock}個以下</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 30, color: i.stock === 0 ? "#c0392b" : "#c87a00" }}>{i.stock}</div>
                    <div style={{ color: "#b0a898", fontSize: 11 }}>現在庫</div>
                  </div>
                </div>
              ))}
            </>
        )}

        {tab === "all" && sortedCats.map(cat => {
          const sortedBrands = [...(cat.brands || [])].sort((a, b) => a.order - b.order);
          return (
            <section key={cat.id} style={S.catBlk}>
              <div className="cathdr">
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={S.catNm}>{cat.name}</span>
                  <span style={{ color: "#b0a898", fontSize: 12 }}>{sortedBrands.length}ブランド</span>
                </div>
                <button className="smbtn brand" onClick={() => setAddBrandModal({ catId: cat.id })}>+ ブランド追加</button>
              </div>
              {sortedBrands.length === 0 && <p style={{ color: "#c8bfb0", fontSize: 13, padding: "8px 0" }}>ブランドを追加してください</p>}
              {sortedBrands.map(brand => {
                const sortedItems = [...(brand.items || [])].sort((a, b) => a.order - b.order);
                return (
                  <div key={brand.id} style={S.brandBlk}>
                    <div className="brandhdr">
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={S.brandNm}>🏷 {brand.name}</span>
                        <span style={{ color: "#b0a898", fontSize: 11 }}>{sortedItems.length}種類</span>
                      </div>
                      <button className="smbtn" onClick={() => setAddItemModal({ catId: cat.id, brandId: brand.id })}>+ 商品追加</button>
                    </div>
                    {sortedItems.length === 0 && <p style={{ color: "#c8bfb0", fontSize: 12, padding: "6px 0" }}>商品がまだありません</p>}
                    {sortedItems.map(item => {
                      const low = item.stock <= item.minStock;
                      const crit = item.stock === 0;
                      const sc = crit ? "scrit" : low ? "slow" : "sok";
                      return (
                        <div key={item.id} className="irow">
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontWeight: 700, color: "#2a2018", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
                              {low && <span className={`tag ${crit ? "tcrit" : "tlow"}`}>{crit ? "在庫切れ" : "要注文"}</span>}
                            </div>
                            <div style={{ display: "flex", gap: 10, marginTop: 3, flexWrap: "wrap", alignItems: "center" }}>
                              {item.retailPrice > 0 && <span style={{ color: "#2a7a5a", fontSize: 11, fontWeight: 600 }}>定価 ¥{item.retailPrice.toLocaleString()}</span>}
                              {item.costPrice > 0 && <span style={{ color: "#9a8f82", fontSize: 11 }}>仕入 ¥{item.costPrice.toLocaleString()}</span>}
                              <span className="minlink" onClick={() => { setMinModal({ catId: cat.id, brandId: brand.id, itemId: item.id }); setMinVal(String(item.minStock)); }}>注文ライン: {item.minStock}</span>
                              
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                            <button className="adjbtn dec" onClick={() => { setAdjModal({ catId: cat.id, brandId: brand.id, itemId: item.id, mode: "sub" }); setAdjVal(""); }}>−</button>
                            <span className={`snum ${sc}`}>{item.stock}</span>
                            <button className="adjbtn inc" onClick={() => { setAdjModal({ catId: cat.id, brandId: brand.id, itemId: item.id, mode: "add" }); setAdjVal(""); }}>+</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </section>
          );
        })}
        {tab === "all" && sortedCats.length === 0 && (
          <div style={S.empty}><div style={{ fontSize: 38 }}>📦</div><p style={{ color: "#9a8f82", marginTop: 12 }}>カテゴリを追加して始めましょう</p></div>
        )}
      </main>

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
                    <p style={{ fontSize: 11, color: "#b0a898", marginBottom: 10 }}>↑↓ 順番変更　✏ 名前変更　🗑 削除</p>
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
                            <button className="sico sedit" onClick={() => { setStOpen(false); openEditItem(stCatId, stBrandId, item); }}><Ico.Edit /></button>
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

      {/* 在庫増減モーダル */}
      {adjModal && (() => {
        const c = cats.find(c => c.id === adjModal.catId);
        const b = c?.brands?.find(b => b.id === adjModal.brandId);
        const i = b?.items?.find(i => i.id === adjModal.itemId);
        return (
          <div className="mover" onClick={() => setAdjModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>{adjModal.mode === "add" ? "📦 在庫を増やす" : "📤 在庫を減らす"}</h3>
              <p style={{ color: "#9a8f82", fontSize: 13, marginBottom: 16 }}>{i?.name}　現在: <strong style={{ color: "#c87a00" }}>{i?.stock}個</strong></p>
              <div className="fg"><label>{adjModal.mode === "add" ? "追加する数量" : "減らす数量"}</label><input type="number" min="0" value={adjVal} onChange={e => setAdjVal(e.target.value)} placeholder="数量を入力" autoFocus onKeyDown={e => e.key === "Enter" && doAdj()} /></div>
              {adjVal !== "" && !isNaN(parseInt(adjVal)) && (
                <p style={{ color: "#9a8f82", fontSize: 12, marginBottom: 14 }}>変更後: <strong style={{ color: "#2d7a44" }}>{adjModal.mode === "add" ? (i?.stock || 0) + parseInt(adjVal) : Math.max(0, (i?.stock || 0) - parseInt(adjVal))}個</strong></p>
              )}
              <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
                <button className="gbtn" onClick={() => setAdjModal(null)}>キャンセル</button>
                <button className="pbtn" onClick={doAdj}>確定</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 商品編集モーダル */}
      {editItemModal && (
        <div className="mover" onClick={() => setEditItemModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>✏️ 商品を編集</h3>
            <div className="fg"><label>商品名</label><input value={editItemF.name} onChange={e => setEditItemF(n => ({ ...n, name: e.target.value }))} placeholder="商品名" /></div>
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

      {/* 商品追加モーダル */}
      {addItemModal && (
        <div className="mover" onClick={() => setAddItemModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>🔧 商品を追加</h3>
            <div className="fg"><label>カテゴリ</label>
              <select value={addItemModal.catId || newItemF.catId} onChange={e => { setAddItemModal(m => ({ ...m, catId: e.target.value, brandId: "" })); setNewItemF(n => ({ ...n, catId: e.target.value, brandId: "" })); }}>
                <option value="">選択してください</option>
                {sortedCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {(addItemModal.catId || newItemF.catId) && (
              <div className="fg"><label>ブランド</label>
                <select value={addItemModal.brandId || newItemF.brandId} onChange={e => { setAddItemModal(m => ({ ...m, brandId: e.target.value })); setNewItemF(n => ({ ...n, brandId: e.target.value })); }}>
                  <option value="">選択してください</option>
                  {[...(cats.find(c => c.id === (addItemModal.catId || newItemF.catId))?.brands || [])].sort((a, b) => a.order - b.order).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
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
              <button className="gbtn" onClick={() => { setAddItemModal(null); setNewItemF({ name: "", stock: "", minStock: "", retailPrice: "", costPrice: "", catId: "", brandId: "" }); }}>キャンセル</button>
              <button className="pbtn" onClick={doAddItem}>追加</button>
            </div>
          </div>
        </div>
      )}

      {/* ブランド追加モーダル */}
      {addBrandModal && (
        <div className="mover" onClick={() => setAddBrandModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>🏷 ブランドを追加</h3>
            <div className="fg"><label>ブランド名</label><input value={newBrandF} onChange={e => setNewBrandF(e.target.value)} placeholder="例: Panaracer" autoFocus onKeyDown={e => e.key === "Enter" && doAddBrand()} /></div>
            <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
              <button className="gbtn" onClick={() => setAddBrandModal(null)}>キャンセル</button>
              <button className="pbtn" onClick={doAddBrand}>追加</button>
            </div>
          </div>
        </div>
      )}

      {/* カテゴリ追加モーダル */}
      {addCatModal && (
        <div className="mover" onClick={() => setAddCatModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>📁 カテゴリを追加</h3>
            <div className="fg"><label>カテゴリ名</label><input value={newCatF} onChange={e => setNewCatF(e.target.value)} placeholder="例: ライト・アクセサリー" autoFocus onKeyDown={e => e.key === "Enter" && doAddCat()} /></div>
            <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
              <button className="gbtn" onClick={() => setAddCatModal(false)}>キャンセル</button>
              <button className="pbtn" onClick={doAddCat}>追加</button>
            </div>
          </div>
        </div>
      )}

      {/* 注文ライン変更モーダル */}
      {minModal && (() => {
        const c = cats.find(c => c.id === minModal.catId);
        const b = c?.brands?.find(b => b.id === minModal.brandId);
        const i = b?.items?.find(i => i.id === minModal.itemId);
        return (
          <div className="mover" onClick={() => setMinModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>⚙️ 注文ラインを変更</h3>
              <p style={{ color: "#9a8f82", fontSize: 13, marginBottom: 16 }}>{i?.name}</p>
              <div className="fg"><label>この個数以下で「要注文」と表示</label><input type="number" min="0" value={minVal} onChange={e => setMinVal(e.target.value)} autoFocus onKeyDown={e => e.key === "Enter" && doMin()} /></div>
              <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
                <button className="gbtn" onClick={() => setMinModal(null)}>キャンセル</button>
                <button className="pbtn" onClick={doMin}>保存</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Noto+Sans+JP:wght@400;500;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #f5f0e8; font-family: 'Noto Sans JP', sans-serif; color: #2a2018; }
  ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #ede8df; } ::-webkit-scrollbar-thumb { background: #c8bfb0; border-radius: 2px; }
  .spin { width: 36px; height: 36px; border: 3px solid #e0d9ce; border-top-color: #2a2018; border-radius: 50%; animation: rot .7s linear infinite; }
  @keyframes rot { to { transform: rotate(360deg); } }
  .pbtn { background: #2a2018; color: #f5f0e8; font-weight: 700; padding: 9px 22px; font-size: 13px; border-radius: 8px; border: none; cursor: pointer; font-family: 'Syne', sans-serif; transition: background .15s, transform .15s; }
  .pbtn:hover { background: #3d3020; transform: translateY(-1px); }
  .gbtn { background: #e8e2d8; color: #7a6f63; font-weight: 600; padding: 9px 18px; font-size: 13px; border-radius: 8px; border: none; cursor: pointer; font-family: 'Syne', sans-serif; transition: background .15s; }
  .gbtn:hover { background: #ddd6ca; color: #2a2018; }
  .icobtn { background: #e8e2d8; border: none; cursor: pointer; border-radius: 9px; padding: 8px; display: flex; align-items: center; justify-content: center; color: #7a6f63; transition: background .15s, color .15s; }
  .icobtn:hover { background: #2a2018; color: #f5f0e8; }
  .smbtn { background: #e8e2d8; color: #7a6f63; font-size: 12px; padding: 4px 10px; border-radius: 6px; border: none; cursor: pointer; font-family: 'Noto Sans JP', sans-serif; font-weight: 500; transition: background .12s; }
  .smbtn:hover { background: #ddd6ca; color: #2a2018; }
  .smbtn.brand { background: #d6e4f0; color: #2563a8; } .smbtn.brand:hover { background: #c4d6ea; }
  .ibtn { background: #d6ead9; color: #2d7a44; font-size: 12px; padding: 4px 10px; border-radius: 6px; border: none; cursor: pointer; font-family: 'Noto Sans JP', sans-serif; font-weight: 500; transition: background .12s; }
  .ibtn:hover { background: #c2dfc7; }
  .dbtn { background: #f0d9d6; color: #c0392b; font-size: 12px; padding: 4px 10px; border-radius: 6px; border: none; cursor: pointer; font-family: 'Noto Sans JP', sans-serif; font-weight: 500; transition: background .12s; }
  .dbtn:hover { background: #e8c8c4; }
  .adjbtn { width: 32px; height: 32px; border-radius: 8px; border: none; cursor: pointer; font-size: 18px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background .12s; }
  .adjbtn.dec { background: #f0d9d6; color: #c0392b; } .adjbtn.dec:hover { background: #e8c8c4; }
  .adjbtn.inc { background: #d6ead9; color: #2d7a44; } .adjbtn.inc:hover { background: #c2dfc7; }
  .edit-inline-btn:hover { color: #2563a8; }
  .tbtn { background: none; border: none; cursor: pointer; font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; padding: 10px 20px; border-radius: 8px; transition: all .18s; letter-spacing: .03em; display: flex; align-items: center; gap: 7px; }
  .ton { background: #2a2018; color: #f5f0e8; } .toff { color: #9a8f82; } .toff:hover { color: #2a2018; background: #e8e2d8; } .tred { background: #c0392b; color: #fff; }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: #c0392b; animation: pulse 1.5s infinite; }
  .badge { background: #c0392b; color: #fff; border-radius: 99px; padding: 1px 7px; font-size: 11px; font-weight: 700; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
  .irow { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 8px; background: #fff; border: 1px solid #e8e2d8; margin-bottom: 5px; transition: border-color .12s, box-shadow .12s; }
  .irow:hover { border-color: #c8bfb0; box-shadow: 0 2px 8px rgba(42,32,24,.06); }
  .snum { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 21px; min-width: 34px; text-align: center; }
  .sok { color: #2d7a44; } .slow { color: #c87a00; } .scrit { color: #c0392b; }
  .tag { font-size: 10px; padding: 1px 6px; border-radius: 4px; font-family: 'Syne', sans-serif; font-weight: 700; flex-shrink: 0; }
  .tlow { background: #c87a0015; color: #c87a00; border: 1px solid #c87a0040; } .tcrit { background: #c0392b15; color: #c0392b; border: 1px solid #c0392b40; }
  .minlink { color: #b0a898; font-size: 11px; cursor: pointer; text-decoration: underline; } .minlink:hover { color: #7a6f63; }
  .cathdr { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .brandhdr { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .ocard { background: #fdf0ee; border: 1px solid #f0c8c4; border-radius: 12px; padding: 14px 16px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; }
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
  .sico { background: #f0ece4; border: 1px solid #e0d9ce; cursor: pointer; border-radius: 6px; padding: 5px; display: flex; align-items: center; justify-content: center; color: #9a8f82; transition: all .12s; }
  .sico:hover { background: #e8e2d8; color: #2a2018; } .sico:disabled { opacity: .22; cursor: not-allowed; }
  .sedit:hover { background: #d6e4f0; color: #2563a8; } .sdel:hover { background: #f0d9d6; color: #c0392b; }
  .rninput { flex: 1; background: #fff; border: 1.5px solid #2a2018; border-radius: 6px; padding: 5px 9px; font-family: 'Noto Sans JP', sans-serif; font-size: 13px; color: #2a2018; outline: none; }
  .chip { background: #e8e2d8; border: 1.5px solid transparent; border-radius: 20px; padding: 5px 13px; font-family: 'Noto Sans JP', sans-serif; font-size: 12px; font-weight: 600; color: #7a6f63; cursor: pointer; transition: all .12s; }
  .chip:hover { background: #ddd6ca; color: #2a2018; } .chipon { background: #2a2018; color: #f5f0e8; border-color: #2a2018; }
`;

const S = {
  root: { background: "#f5f0e8", minHeight: "100vh" },
  hdr: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 16px", borderBottom: "1px solid #e0d9ce", background: "#faf7f2", flexWrap: "wrap", gap: 10 },
  logo: { fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 20, color: "#2a2018", letterSpacing: "-.02em" },
  sub: { fontFamily: "Syne,sans-serif", fontSize: 10, color: "#b0a898", letterSpacing: ".1em", marginTop: 2, textTransform: "uppercase" },
  nav: { display: "flex", gap: 7, padding: "10px 20px", borderBottom: "1px solid #e0d9ce", background: "#faf7f2" },
  main: { padding: "20px", maxWidth: 860 },
  catBlk: { marginBottom: 28 },
  brandBlk: { background: "#faf7f2", border: "1px solid #e8e2d8", borderRadius: 12, padding: "12px 14px", marginBottom: 10 },
  catNm: { fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 15, color: "#2a2018" },
  brandNm: { fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 13, color: "#2563a8" },
  empty: { textAlign: "center", padding: "64px 0" },
};
