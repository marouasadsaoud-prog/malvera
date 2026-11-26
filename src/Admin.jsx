import { useState, useRef, Fragment } from "react";
import {
  sb, sbAuth, signOut, uploadPhoto, toNum, money, waLink, normPhone, STATUS_LIST, STATUS_BG, STATUS_SEL,
  imgsOf, DETAIL_FIELDS, TEXT_GROUPS, DEFAULTS, ING_CATEGORIES, Ico, Stars,
} from "./lib.jsx";

const NOSTOCK = ["cancelled", "returned"];
const patchOpts = (body) => ({ method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(body) });
const slugify = (s) => String(s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export default function Admin({ T, shared, onExit }) {
  const { products, setProducts, collections, setCollections, texts, setTexts, delivery, setDelivery } = shared;
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [orders, setOrders] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [reviews, setReviews] = useState([]);

  const run = async (fn) => {
    try { await fn(); return true; } catch (e) {
      const m = String((e && e.message) || e);
      if (/JWT|permission denied|row-level security|PGRST30/i.test(m)) alert("Your admin session has expired. Please log out and log in again.");
      else alert("Error: " + m);
      return false;
    }
  };
  const loadAdminData = async () => {
    const get = async (path, set) => { try { set(await sb(path)); } catch (e) { console.error(e); } };
    await Promise.all([get("ingredients?order=id", setIngredients), get("orders?order=created_at.desc", setOrders), get("reviews?order=id.desc", setReviews)]);
  };

  const updateOrderStatus = (o, status) => run(async () => {
    await sb(`orders?id=eq.${o.id}`, patchOpts({ status }));
    setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, status } : x)));
    const was = NOSTOCK.includes(o.status), now = NOSTOCK.includes(status);
    if (was === now || !Array.isArray(o.items)) return;
    const sign = !was && now ? 1 : -1;
    if (!window.confirm(sign === 1 ? "Put the items of this order back in stock?" : "Take the items of this order out of stock again?")) return;
    for (const it of o.items) {
      if (it.preorder) continue;
      const p = products.find((x) => x.id === it.productId);
      if (!p) continue;
      const stock = Math.max(0, (Number(p.stock) || 0) + sign * Number(it.qty));
      await sb(`products?id=eq.${p.id}`, patchOpts({ stock }));
      setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, stock } : x)));
    }
  });
  const deleteOrder = (id) => run(async () => { await sb(`orders?id=eq.${id}`, { method: "DELETE", headers: { Prefer: "return=minimal" } }); setOrders((p) => p.filter((o) => o.id !== id)); });
  const patchProduct = (id, patch) => run(async () => { await sb(`products?id=eq.${id}`, patchOpts(patch)); setProducts((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x))); });
  const addProduct = (data) => run(async () => {
    const id = Math.max(0, ...products.map((p) => p.id)) + 1;
    const ins = await sb("products", { method: "POST", body: JSON.stringify({ ...data, id }) });
    if (ins[0]) setProducts((p) => [...p, ins[0]]);
  });
  const deleteProduct = (id) => run(async () => { await sb(`products?id=eq.${id}`, { method: "DELETE", headers: { Prefer: "return=minimal" } }); setProducts((p) => p.filter((x) => x.id !== id)); });
  const patchIngredient = (id, patch) => run(async () => { await sb(`ingredients?id=eq.${id}`, patchOpts(patch)); setIngredients((p) => p.map((i) => (i.id === id ? { ...i, ...patch } : i))); });
  const addIngredient = (data) => run(async () => {
    const id = Math.max(0, ...ingredients.map((i) => i.id)) + 1;
    const ins = await sb("ingredients", { method: "POST", body: JSON.stringify({ ...data, id }) });
    if (ins[0]) setIngredients((p) => [...p, ins[0]]);
  });
  const deleteIngredient = (id) => run(async () => { await sb(`ingredients?id=eq.${id}`, { method: "DELETE", headers: { Prefer: "return=minimal" } }); setIngredients((p) => p.filter((i) => i.id !== id)); });
  const patchDelivery = (id, patch) => run(async () => { await sb(`delivery_prices?id=eq.${id}`, patchOpts(patch)); setDelivery((p) => p.map((d) => (d.id === id ? { ...d, ...patch } : d))); });

  if (!isAdmin) return <AdminLogin T={T} onLogin={async () => { await loadAdminData(); setIsAdmin(true); }} onBack={onExit} />;

  const tabs = [
    { key: "dashboard", label: "Dashboard", icon: "📊" }, { key: "orders", label: T.adm_orders, icon: "📋" },
    { key: "products", label: T.adm_products, icon: "📦" }, { key: "collections", label: "Collections", icon: "🗂️" },
    { key: "reviews", label: "Reviews", icon: "⭐" }, { key: "texts", label: "Site texts", icon: "✏️" },
    { key: "ingredients", label: T.adm_ing, icon: "🧪" }, { key: "delivery", label: T.adm_delivery, icon: "🚚" },
  ];
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-logo">MALVERA</div>
        {tabs.map((tb) => (
          <button key={tb.key} className={`sidebar-link ${tab === tb.key ? "active" : ""}`} onClick={() => setTab(tb.key)}><span style={{ fontSize: "1.1rem" }}>{tb.icon}</span><span>{tb.label}</span></button>
        ))}
        <button className="sidebar-link sidebar-logout" onClick={onExit}><span style={{ fontSize: "1.1rem" }}>🌐</span><span>View site</span></button>
        <button className="sidebar-link" onClick={() => { signOut(); onExit(); }}><span style={{ fontSize: "1.1rem" }}>🚪</span><span>{T.adm_logout}</span></button>
      </aside>
      <main className="admin-main">
        <h2 className="admin-title">{tabs.find((x) => x.key === tab).label}</h2>
        {tab === "dashboard" && <DashboardTab orders={orders} products={products} ingredients={ingredients} />}
        {tab === "orders" && <OrdersTab T={T} orders={orders} onUpdateStatus={updateOrderStatus} onDeleteOrder={deleteOrder} />}
        {tab === "products" && <ProductsTab T={T} products={products} collections={collections} onPatch={patchProduct} onAdd={addProduct} onDelete={deleteProduct} />}
        {tab === "collections" && <CollectionsTab collections={collections} setCollections={setCollections} run={run} />}
        {tab === "reviews" && <ReviewsTab reviews={reviews} setReviews={setReviews} run={run} />}
        {tab === "texts" && <TextsTab texts={texts} setTexts={setTexts} run={run} />}
        {tab === "ingredients" && <IngredientsTab T={T} ingredients={ingredients} onPatch={patchIngredient} onAdd={addIngredient} onDelete={deleteIngredient} />}
        {tab === "delivery" && <DeliveryTab T={T} delivery={delivery} onPatch={patchDelivery} />}
      </main>
    </div>
  );
}

function AdminLogin({ T, onLogin, onBack }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState(false);
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    setLoading(true);
    const r = await sbAuth(email.trim(), pass);
    if (r.success) await onLogin(); else setErr(true);
    setLoading(false);
  };
  return (
    <div className="admin-login">
      <div className="login-card">
        <div className="login-logo">MALVERA</div>
        <h2 className="login-title">Admin</h2>
        <div className="form-group"><label className="form-label">{T.adm_email}</label><input className="form-input" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr(false); }} /></div>
        <div className="form-group"><label className="form-label">{T.adm_pass}</label><input className="form-input" type="password" value={pass} onChange={(e) => { setPass(e.target.value); setErr(false); }} onKeyDown={(e) => e.key === "Enter" && handle()} /></div>
        {err && <p style={{ color: "var(--red)", fontSize: "0.8rem", marginBottom: 12 }}>{T.adm_wrong}</p>}
        <button className="btn-primary" style={{ width: "100%", marginBottom: 12 }} onClick={handle} disabled={loading}>{loading ? "..." : T.adm_signin}</button>
        <button className="btn-outline" style={{ width: "100%" }} onClick={onBack}>{T.back}</button>
      </div>
    </div>
  );
}

// ---------------- DASHBOARD + CUSTOMER ANALYTICS ----------------
function DashboardTab({ orders, products, ingredients }) {
  const DAY = 864e5;
  const valid = orders.filter((o) => !NOSTOCK.includes(o.status));
  const sum = (a) => a.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const by = {};
  valid.forEach((o) => { const k = normPhone(o.phone); if (k) (by[k] = by[k] || []).push(o); });
  const custs = Object.entries(by).map(([phone, os]) => {
    os.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    return { phone, name: os[os.length - 1].name, os, n: os.length, spent: sum(os), last: os[os.length - 1].created_at };
  });
  const ret = custs.filter((c) => c.n >= 2);
  const unique = custs.length, one = unique - ret.length;
  const repeat = unique ? Math.round((ret.length / unique) * 100) : 0;
  const totalRev = sum(valid), retRev = ret.reduce((s, c) => s + c.spent, 0);
  const gaps = ret.map((c) => (new Date(c.os[1].created_at) - new Date(c.os[0].created_at)) / DAY).sort((a, b) => a - b);
  const avgGap = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null;
  const medGap = gaps.length ? gaps[Math.floor(gaps.length / 2)] : null;
  const fd = (d) => (d === null ? "—" : d < 1 ? "< 1 day" : `${Math.round(d)} days`);
  const delivered = sum(orders.filter((o) => o.status === "delivered"));
  const aov = valid.length ? Math.round(totalRev / valid.length) : 0;
  const waiting = orders.filter((o) => o.status === "pending" || o.status === "preorder").length;

  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString("en", { month: "short" }), v: 0 }); }
  valid.forEach((o) => { const d = new Date(o.created_at); const m = months.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`); if (m) m.v += Number(o.total) || 0; });
  const maxM = Math.max(1, ...months.map((m) => m.v));

  const prod = {};
  valid.forEach((o) => (o.items || []).forEach((it) => { const p = (prod[it.productName] = prod[it.productName] || { q: 0, r: 0 }); p.q += Number(it.qty) || 0; p.r += (Number(it.price) || 0) * (Number(it.qty) || 0); }));
  const topProd = Object.entries(prod).sort((a, b) => b[1].q - a[1].q).slice(0, 5);
  const wil = {};
  valid.forEach((o) => { if (o.wilaya) wil[o.wilaya] = (wil[o.wilaya] || 0) + 1; });
  const topWil = Object.entries(wil).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const st = {};
  orders.forEach((o) => { st[o.status] = (st[o.status] || 0) + 1; });
  const topCust = [...custs].sort((a, b) => b.spent - a.spent).slice(0, 8);
  const lowP = products.filter((p) => p.active !== false && Number(p.stock) <= Number(p.threshold || 0));
  const lowI = ingredients.filter((i) => i.threshold > 0 && i.qty <= i.threshold);
  const Bars = ({ rows, fmt }) => { const mx = Math.max(1, ...rows.map((r) => r[1])); return rows.length === 0 ? <p className="muted">No data yet.</p> : rows.map(([l, v, c]) => <div className="bar-row" key={l}><span>{l}</span><div className="bar-t"><i style={{ width: `${(v / mx) * 100}%`, background: c }} /></div><b>{fmt ? fmt(v) : v}</b></div>); };
  const Card = ({ n, l, sub, color }) => <div className="stat-card"><div className="stat-num" style={{ color, fontSize: String(n).length > 9 ? "1.4rem" : undefined }}>{n}</div><div className="stat-label">{l}</div>{sub && <div className="stat-sub">{sub}</div>}</div>;
  return (
    <>
      <div className="stat-grid">
        <Card n={orders.length} l="Total orders" />
        <Card n={waiting} l="Waiting (pending + pre-order)" color="var(--orange)" />
        <Card n={money(delivered)} l="Sales (delivered)" color="#155724" />
        <Card n={money(aov)} l="Average order" />
      </div>
      <h3 className="serif" style={{ fontSize: "1.4rem", color: "var(--mocha)", margin: "6px 0 12px" }}>Customers</h3>
      <div className="stat-grid">
        <Card n={unique} l="Unique customers" sub="by phone number" />
        <Card n={one} l="One-time customers" />
        <Card n={ret.length} l="Returning customers" sub="2 orders or more" color="#155724" />
        <Card n={`${repeat}%`} l="Returning rate" color="var(--gold3)" />
        <Card n={money(retRev)} l="Returning revenue" sub={totalRev ? `${Math.round((retRev / totalRev) * 100)}% of all revenue` : ""} />
        <Card n={fd(avgGap)} l="Time to 2nd order" sub={gaps.length ? `average · median ${fd(medGap)}` : "needs returning customers"} />
        <Card n={unique ? (valid.length / unique).toFixed(1) : "0"} l="Orders per customer" />
      </div>
      <p className="muted" style={{ marginBottom: 18 }}>Customers are counted by phone number. Cancelled and returned orders are not counted.</p>
      <div className="two">
        <div className="admin-card"><h3>Revenue by month</h3><div className="mbars">{months.map((m) => <div key={m.key}><span>{m.v ? Math.round(m.v / 1000) + "k" : ""}</span><i style={{ height: `${(m.v / maxM) * 100}%` }} /><span>{m.label}</span></div>)}</div></div>
        <div className="admin-card"><h3>Orders by status</h3><Bars rows={STATUS_LIST.filter((s) => st[s]).map((s) => [s, st[s], STATUS_SEL[s][1]])} /></div>
        <div className="admin-card"><h3>Best-selling products</h3><Bars rows={topProd.map(([n, v]) => [n, v.q])} fmt={(v) => `${v} sold`} /></div>
        <div className="admin-card"><h3>Top wilayas</h3><Bars rows={topWil} fmt={(v) => `${v} orders`} /></div>
      </div>
      <div className="admin-card">
        <h3>Best customers</h3>
        {topCust.length === 0 ? <p className="muted">No customers yet.</p> : (
          <table className="rtable">
            <thead><tr><th>Customer</th><th>Phone</th><th>Orders</th><th>Spent</th><th>Last order</th></tr></thead>
            <tbody>{topCust.map((c) => (
              <tr key={c.phone}>
                <td data-label="Customer"><strong>{c.name}</strong> {c.n >= 2 && <span className="badge badge-vip">returning</span>}</td>
                <td data-label="Phone"><a href={waLink(c.phone)} target="_blank" rel="noreferrer" dir="ltr">{c.phone}</a></td>
                <td data-label="Orders">{c.n}</td><td data-label="Spent">{money(c.spent)}</td>
                <td data-label="Last order">{Math.max(0, Math.round((Date.now() - new Date(c.last)) / DAY))} days ago</td>
              </tr>))}</tbody>
          </table>
        )}
      </div>
      {(lowP.length > 0 || lowI.length > 0) && (
        <div className="admin-card">
          <h3>Low stock</h3>
          {lowP.map((p) => <div key={p.id} style={{ padding: "4px 0" }}><span className="badge badge-low">product</span> {p.name} — {p.stock} left</div>)}
          {lowI.map((i) => <div key={i.id} style={{ padding: "4px 0" }}><span className="badge badge-low">ingredient</span> {i.name} — {i.qty} left</div>)}
        </div>
      )}
    </>
  );
}

// ---------------- ORDERS ----------------
function OrdersTab({ T, orders, onUpdateStatus, onDeleteOrder }) {
  const [search, setSearch] = useState("");
  const [fs, setFs] = useState("all");
  const [fw, setFw] = useState("all");
  const label = { pending: T.s_pending, preorder: T.s_preorder, confirmed: T.s_confirmed, delivered: T.s_delivered, cancelled: T.s_cancelled, returned: T.s_returned };
  const cnt = {};
  orders.filter((o) => !NOSTOCK.includes(o.status)).forEach((o) => { const k = normPhone(o.phone); cnt[k] = (cnt[k] || 0) + 1; });
  const q = search.toLowerCase();
  const filtered = orders.filter((o) => (fs === "all" || o.status === fs) && (fw === "all" || o.wilaya === fw) &&
    ((o.name || "").toLowerCase().includes(q) || (o.product_name || "").toLowerCase().includes(q) || String(o.order_number || "").includes(q) || (o.phone || "").includes(q)));
  const wilayas = [...new Set(orders.map((o) => o.wilaya).filter(Boolean))];
  const exportCsv = () => {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [["Order", "Date", "Name", "Phone", "Wilaya", "Delivery", "Commune", "Address", "Products", "Subtotal", "Delivery fee", "Total", "Status"]];
    filtered.forEach((o) => rows.push([o.order_number, new Date(o.created_at).toLocaleString(), o.name, o.phone, o.wilaya, o.delivery_type, o.commune, o.address, o.product_name, o.subtotal, o.delivery_fee, o.total, o.status]));
    const blob = new Blob(["﻿" + rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "malvera-orders.csv"; a.click();
  };
  return (
    <div className="admin-card">
      <div className="search-bar">
        <input className="search-input" placeholder={T.search} value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="select-filter" value={fs} onChange={(e) => setFs(e.target.value)}><option value="all">All statuses</option>{STATUS_LIST.map((s) => <option key={s} value={s}>{label[s]}</option>)}</select>
        <select className="select-filter" value={fw} onChange={(e) => setFw(e.target.value)}><option value="all">All wilayas</option>{wilayas.map((w) => <option key={w} value={w}>{w}</option>)}</select>
        <button className="btn-soft" onClick={exportCsv}>⬇ Export Excel (CSV)</button>
      </div>
      {filtered.length === 0 ? <p className="muted" style={{ padding: "20px 0" }}>{T.no_orders}</p> : (
        <div style={{ overflowX: "auto" }}>
          <table className="rtable">
            <thead><tr><th>{T.c_order}</th><th>{T.c_name}</th><th>{T.c_product}</th><th>{T.c_total}</th><th>{T.c_wilaya}</th><th>Delivery</th><th>{T.c_phone}</th><th>{T.c_date}</th><th>{T.c_status}</th></tr></thead>
            <tbody>
              {filtered.map((o) => {
                const colors = STATUS_SEL[o.status] || STATUS_SEL.pending;
                const k = normPhone(o.phone);
                return (
                  <tr key={o.id} style={{ background: STATUS_BG[o.status] || "white" }}>
                    <td data-label={T.c_order}><strong dir="ltr">{o.order_number ? `#${o.order_number}` : "—"}</strong></td>
                    <td data-label={T.c_name}><div><strong>{o.name}</strong> {cnt[k] >= 2 && !NOSTOCK.includes(o.status) && <span className="badge badge-vip">returning ×{cnt[k]}</span>}<br /><span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{o.commune ? `${o.commune} - ` : ""}{o.address}</span></div></td>
                    <td data-label={T.c_product}><div>{o.items && o.items.length > 0 ? o.items.map((it, i) => <div key={i} style={{ fontSize: "0.82rem" }}>{it.productName} <b>x{it.qty}</b>{it.preorder && <span className="badge badge-preorder" style={{ marginInlineStart: 6 }}>pre-order</span>}</div>) : o.product_name}</div></td>
                    <td data-label={T.c_total}>{o.total ? <div><strong>{money(o.total)}</strong><br /><span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{money(o.subtotal)} + {money(o.delivery_fee)}</span></div> : "—"}</td>
                    <td data-label={T.c_wilaya}>{o.wilaya}</td>
                    <td data-label="Delivery"><span className={`badge ${o.delivery_type === "stopdesk" ? "badge-confirmed" : "badge-pending"}`}>{o.delivery_type === "stopdesk" ? "Stop Desk" : "Home"}</span></td>
                    <td data-label={T.c_phone}><a href={`tel:${o.phone}`} dir="ltr">{o.phone}</a> <a href={waLink(o.phone, `Hello ${o.name}, this is Malvera about your order #${o.order_number}.`)} target="_blank" rel="noreferrer" title="WhatsApp" style={{ color: "#25a85a", verticalAlign: "middle" }}><Ico n="wa" s={18} /></a></td>
                    <td data-label={T.c_date} style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{new Date(o.created_at).toLocaleString()}</td>
                    <td data-label={T.c_status}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <select className="status-select" value={o.status} onChange={(e) => onUpdateStatus(o, e.target.value)} style={{ background: colors[0], color: colors[1], fontWeight: 500 }}>{STATUS_LIST.map((s) => <option key={s} value={s}>{label[s]}</option>)}</select>
                        <button onClick={() => { if (window.confirm("Delete this order?")) onDeleteOrder(o.id); }} className="btn-danger">🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------- PRODUCTS ----------------
function RichField({ label, value, onChange, rtl, rows = 4 }) {
  const ref = useRef(null);
  const bold = () => {
    const el = ref.current; if (!el) return;
    const a = el.selectionStart, b = el.selectionEnd, v = value || "";
    onChange(a === b ? v.slice(0, a) + "****" + v.slice(b) : v.slice(0, a) + "**" + v.slice(a, b) + "**" + v.slice(b));
    setTimeout(() => { el.focus(); const p = a === b ? a + 2 : b + 4; el.setSelectionRange(p, p); }, 0);
  };
  return (
    <div className="form-group" style={{ marginBottom: 12 }}>
      <div className="ed-lbl"><span>{label}</span><button type="button" onClick={bold} title="Select text, then press B to make it bold">B</button></div>
      <textarea ref={ref} className="form-textarea" rows={rows} dir={rtl ? "rtl" : "ltr"} value={value || ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
const Field = ({ label, children }) => <div className="form-group" style={{ marginBottom: 12 }}><div className="ed-lbl"><span>{label}</span></div>{children}</div>;

function ProductEditor({ p, collections, onSave, onClose, onDelete }) {
  const isNew = !p;
  const [d, setD] = useState(() => p ? {
    ...p, price: p.price ?? "", discount_price: p.discount_price ?? "", details: { ...(p.details || {}) }, images: imgsOf(p),
    cats: (p.category || "").split(",").map((s) => s.trim()).filter(Boolean),
  } : { name: "", name_ar: "", short_desc: "", short_desc_ar: "", full_desc: "", full_desc_ar: "", price: "", discount_price: "", stock: 0, threshold: 0, preorder: false, active: true, details: {}, images: [], cats: [] });
  const [up, setUp] = useState(false);
  const fileRef = useRef(null);
  const set = (k, v) => setD((x) => ({ ...x, [k]: v }));
  const setDet = (k, v) => setD((x) => ({ ...x, details: { ...x.details, [k]: v } }));
  const toggleCat = (s) => set("cats", d.cats.includes(s) ? d.cats.filter((x) => x !== s) : [...d.cats, s]);
  const addPhotos = async (files) => {
    setUp(true);
    let imgs = [...d.images];
    for (const f of Array.from(files)) {
      if (imgs.length >= 5) { alert("Maximum 5 photos per product."); break; }
      const url = await uploadPhoto(f, p ? p.id : "new");
      if (url) imgs.push(url); else alert("Photo upload failed. If your session expired, log out and log in again.");
    }
    set("images", imgs); setUp(false);
    if (fileRef.current) fileRef.current.value = "";
  };
  const move = (i, dir) => { const a = [...d.images]; const j = i + dir; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; set("images", a); };
  const save = async () => {
    if (!d.name.trim() || !String(d.price).trim()) { alert("Please fill the product name and the price."); return; }
    const payload = {
      name: d.name.trim(), name_ar: d.name_ar || null, short_desc: d.short_desc || "", short_desc_ar: d.short_desc_ar || null,
      full_desc: d.full_desc || "", full_desc_ar: d.full_desc_ar || null, price: String(d.price).trim(),
      discount_price: String(d.discount_price || "").trim() || null, stock: Number(d.stock) || 0, threshold: Number(d.threshold) || 0,
      category: d.cats.join(","), preorder: !!d.preorder, active: d.active !== false, details: d.details, images: d.images, image_url: d.images[0] || null,
    };
    const ok = await onSave(payload);
    if (ok) onClose();
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">{isNew ? "Add a new product" : "Edit product"}</h3>

        <div className="ed-sec">Name and prices</div>
        <div className="ed-2">
          <Field label="Name (English) *"><input className="form-input" value={d.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="الاسم (عربي)"><input className="form-input" dir="rtl" value={d.name_ar || ""} onChange={(e) => set("name_ar", e.target.value)} /></Field>
        </div>
        <div className="ed-4">
          <Field label="Price (DA) *"><input className="form-input" value={d.price} onChange={(e) => set("price", e.target.value)} /></Field>
          <Field label="Discount price"><input className="form-input" value={d.discount_price} onChange={(e) => set("discount_price", e.target.value)} placeholder="empty = none" /></Field>
          <Field label="Stock"><input className="form-input" type="number" min="0" value={d.stock} onChange={(e) => set("stock", e.target.value)} /></Field>
          <Field label="Low-stock alert at"><input className="form-input" type="number" min="0" value={d.threshold} onChange={(e) => set("threshold", e.target.value)} /></Field>
        </div>
        <label className="chk"><input type="checkbox" checked={!!d.preorder} onChange={(e) => set("preorder", e.target.checked)} />Allow pre-order when out of stock</label>
        <label className="chk"><input type="checkbox" checked={d.active !== false} onChange={(e) => set("active", e.target.checked)} />Visible on the website</label>

        <div className="ed-sec">Collections</div>
        <div>{collections.map((k) => <label className="chk" key={k.id}><input type="checkbox" checked={d.cats.includes(k.slug)} onChange={() => toggleCat(k.slug)} />{k.name_en}</label>)}</div>

        <div className="ed-sec">Photos (up to 5 - the first one is the main photo)</div>
        <div className="photo-row">
          {d.images.map((u, i) => (
            <div className="photo-box" key={u + i}>
              <img src={u} alt="" />
              <small>{i === 0 ? "MAIN" : `Photo ${i + 1}`}</small>
              <div><button type="button" onClick={() => move(i, -1)}>←</button><button type="button" onClick={() => move(i, 1)}>→</button><button type="button" onClick={() => set("images", d.images.filter((_, j) => j !== i))}>✕</button></div>
            </div>
          ))}
          {d.images.length < 5 && (
            <div className="photo-box" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 120 }}>
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => addPhotos(e.target.files)} />
              <button type="button" className="btn-soft" onClick={() => fileRef.current && fileRef.current.click()}>{up ? "⏳ Uploading..." : "📷 Add photos"}</button>
            </div>
          )}
        </div>

        <div className="ed-sec">Descriptions (use the B button or **text** for bold - press Enter for a new line)</div>
        <div className="ed-2">
          <RichField label="Short description (English)" value={d.short_desc} onChange={(v) => set("short_desc", v)} rows={2} />
          <RichField label="وصف قصير (عربي)" value={d.short_desc_ar} onChange={(v) => set("short_desc_ar", v)} rtl rows={2} />
          <RichField label="Full description (English)" value={d.full_desc} onChange={(v) => set("full_desc", v)} />
          <RichField label="الوصف الكامل (عربي)" value={d.full_desc_ar} onChange={(v) => set("full_desc_ar", v)} rtl />
        </div>

        <div className="ed-sec">Product details (shown on the product page, leave empty to hide)</div>
        {[["availability", "Availability note (example: back in stock in December)", "ملاحظة التوفر"], ...DETAIL_FIELDS].map(([k, en, ar]) => (
          <div className="ed-2" key={k}>
            <RichField label={en} value={d.details[k + "_en"]} onChange={(v) => setDet(k + "_en", v)} rows={k === "availability" ? 1 : 3} />
            <RichField label={ar} value={d.details[k + "_ar"]} onChange={(v) => setDet(k + "_ar", v)} rtl rows={k === "availability" ? 1 : 3} />
          </div>
        ))}

        <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
          <button className="btn-primary" style={{ flex: 1 }} onClick={save}>Save product</button>
          <button className="btn-outline" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          {!isNew && <button className="btn-danger" onClick={() => { if (window.confirm("Delete this product for good?")) { onDelete(p.id); onClose(); } }}>🗑️ Delete</button>}
        </div>
      </div>
    </div>
  );
}

function ProductsTab({ T, products, collections, onPatch, onAdd, onDelete }) {
  const [edit, setEdit] = useState(null);
  const [stockEd, setStockEd] = useState({});
  const nameOf = (s) => (collections.find((k) => k.slug === s.trim()) || {}).name_en || s;
  return (
    <div className="admin-card">
      <button className="btn-add" onClick={() => setEdit("new")}>+ Add new product</button>
      {edit && <ProductEditor p={edit === "new" ? null : edit} collections={collections} onClose={() => setEdit(null)} onDelete={onDelete}
        onSave={(payload) => (edit === "new" ? onAdd(payload) : onPatch(edit.id, payload))} />}
      <div style={{ overflowX: "auto" }}>
        <table className="rtable">
          <thead><tr><th>Photo</th><th>Product</th><th>{T.stock_qty}</th><th>Price</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {products.map((p) => {
              const low = Number(p.stock) <= Number(p.threshold || 0);
              const img = imgsOf(p)[0];
              return (
                <tr key={p.id} className={low ? "low" : ""}>
                  <td data-label="Photo">{img ? <img src={img} alt="" className="photo-preview" /> : <div className="photo-preview" style={{ background: "var(--beige2)" }} />}</td>
                  <td data-label="Product"><strong>{p.name}</strong>{p.name_ar && <div dir="rtl" style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{p.name_ar}</div>}<div style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{(p.category || "").split(",").filter(Boolean).map(nameOf).join(" · ")}</div></td>
                  <td data-label={T.stock_qty}><input className="qty-input" type="number" min="0" value={stockEd[p.id] ?? p.stock} onChange={(e) => setStockEd((s) => ({ ...s, [p.id]: e.target.value }))}
                    onBlur={() => { if (stockEd[p.id] !== undefined && Number(stockEd[p.id]) !== Number(p.stock)) onPatch(p.id, { stock: Number(stockEd[p.id]) || 0 }); setStockEd((s) => { const n = { ...s }; delete n[p.id]; return n; }); }} /></td>
                  <td data-label="Price">{p.discount_price ? <><s style={{ color: "var(--muted)" }}>{p.price}</s> {p.discount_price}</> : p.price}</td>
                  <td data-label="Status">
                    {p.active === false && <span className="badge badge-cancelled">hidden</span>}{" "}
                    {Number(p.stock) <= 0 ? (p.preorder ? <span className="badge badge-preorder">pre-order</span> : <span className="badge badge-low">sold out</span>) : low ? <span className="badge badge-low">{T.low_stock}</span> : <span className="badge badge-ok">OK</span>}
                  </td>
                  <td className="center"><button className="btn-save" onClick={() => setEdit(p)}>✏️ Edit</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------- COLLECTIONS ----------------
function CollectionsTab({ collections, setCollections, run }) {
  const [ed, setEd] = useState({});
  const [n, setN] = useState({ name_en: "", name_ar: "" });
  const put = (id, k, v) => setEd((e) => ({ ...e, [id]: { ...e[id], [k]: v } }));
  const save = (k) => run(async () => {
    const e = ed[k.id]; if (!e) return;
    const patch = { ...e }; if (patch.sort !== undefined) patch.sort = Number(patch.sort) || 0;
    await sb(`collections?id=eq.${k.id}`, patchOpts(patch));
    setCollections((c) => c.map((x) => (x.id === k.id ? { ...x, ...patch } : x)));
    setEd((x) => { const m = { ...x }; delete m[k.id]; return m; });
  });
  const add = () => run(async () => {
    const slug = slugify(n.name_en);
    if (!slug) { alert("Please write the English name (letters and numbers)."); return; }
    if (collections.some((c) => c.slug === slug)) { alert("This collection already exists."); return; }
    const ins = await sb("collections", { method: "POST", body: JSON.stringify({ slug, name_en: n.name_en.trim(), name_ar: n.name_ar.trim() || null, sort: collections.length + 1 }) });
    if (ins[0]) setCollections((c) => [...c, ins[0]]);
    setN({ name_en: "", name_ar: "" });
  });
  const del = (k) => { if (!window.confirm(`Delete the collection "${k.name_en}"? Products are not deleted.`)) return; run(async () => { await sb(`collections?id=eq.${k.id}`, { method: "DELETE", headers: { Prefer: "return=minimal" } }); setCollections((c) => c.filter((x) => x.id !== k.id)); }); };
  return (
    <>
      <div className="admin-card">
        <h3>Add a collection</h3>
        <div className="ed-2">
          <Field label="Name (English)"><input className="form-input" value={n.name_en} onChange={(e) => setN({ ...n, name_en: e.target.value })} /></Field>
          <Field label="الاسم (عربي)"><input className="form-input" dir="rtl" value={n.name_ar} onChange={(e) => setN({ ...n, name_ar: e.target.value })} /></Field>
        </div>
        <button className="btn-add" onClick={add}>+ Add collection</button>
        <p className="muted">After adding it, open a product and tick the collection to put the product in it.</p>
      </div>
      <div className="admin-card">
        <table className="rtable">
          <thead><tr><th>English</th><th>عربي</th><th>Order</th><th></th></tr></thead>
          <tbody>{collections.map((k) => {
            const e = ed[k.id] || {};
            return (
              <tr key={k.id}>
                <td data-label="English"><input className="qty-input" style={{ width: 160 }} value={e.name_en ?? k.name_en} onChange={(x) => put(k.id, "name_en", x.target.value)} /></td>
                <td data-label="عربي"><input className="qty-input" dir="rtl" style={{ width: 160 }} value={e.name_ar ?? k.name_ar ?? ""} onChange={(x) => put(k.id, "name_ar", x.target.value)} /></td>
                <td data-label="Order"><input className="qty-input" type="number" style={{ width: 70 }} value={e.sort ?? k.sort ?? 0} onChange={(x) => put(k.id, "sort", x.target.value)} /></td>
                <td className="center"><div style={{ display: "flex", gap: 6 }}><button className="btn-save" style={{ opacity: ed[k.id] ? 1 : 0.5 }} onClick={() => save(k)}>Save</button><button className="btn-danger" onClick={() => del(k)}>🗑️</button></div></td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
    </>
  );
}

// ---------------- REVIEWS ----------------
function ReviewsTab({ reviews, setReviews, run }) {
  const blank = { name: "", city: "", stars: 5, text_en: "", text_ar: "", visible: true };
  const [n, setN] = useState(blank);
  const [ed, setEd] = useState({});
  const put = (id, k, v) => setEd((e) => ({ ...e, [id]: { ...e[id], [k]: v } }));
  const add = () => run(async () => {
    if (!n.name.trim() || !(n.text_en.trim() || n.text_ar.trim())) { alert("Please write the customer name and what she said."); return; }
    const ins = await sb("reviews", { method: "POST", body: JSON.stringify({ ...n, stars: Number(n.stars) }) });
    if (ins[0]) setReviews((r) => [ins[0], ...r]);
    setN(blank);
  });
  const save = (r) => run(async () => {
    const e = ed[r.id]; if (!e) return;
    const patch = { ...e }; if (patch.stars !== undefined) patch.stars = Number(patch.stars);
    await sb(`reviews?id=eq.${r.id}`, patchOpts(patch));
    setReviews((a) => a.map((x) => (x.id === r.id ? { ...x, ...patch } : x)));
    setEd((x) => { const m = { ...x }; delete m[r.id]; return m; });
  });
  const del = (r) => { if (window.confirm("Delete this review?")) run(async () => { await sb(`reviews?id=eq.${r.id}`, { method: "DELETE", headers: { Prefer: "return=minimal" } }); setReviews((a) => a.filter((x) => x.id !== r.id)); }); };
  const form = (v, onChange, k) => (
    <>
      <div className="ed-4">
        <Field label="Customer name"><input className="form-input" value={v.name || ""} onChange={(e) => onChange(k, "name", e.target.value)} /></Field>
        <Field label="City"><input className="form-input" value={v.city || ""} onChange={(e) => onChange(k, "city", e.target.value)} /></Field>
        <Field label="Stars"><select className="form-select" value={v.stars} onChange={(e) => onChange(k, "stars", e.target.value)}>{[5, 4, 3, 2, 1].map((s) => <option key={s} value={s}>{"★".repeat(s)}</option>)}</select></Field>
        <Field label="Show on website"><label className="chk"><input type="checkbox" checked={v.visible !== false} onChange={(e) => onChange(k, "visible", e.target.checked)} />Visible</label></Field>
      </div>
      <div className="ed-2">
        <Field label="What she said (English)"><textarea className="form-textarea" rows={2} value={v.text_en || ""} onChange={(e) => onChange(k, "text_en", e.target.value)} /></Field>
        <Field label="ماذا قالت (عربي)"><textarea className="form-textarea" rows={2} dir="rtl" value={v.text_ar || ""} onChange={(e) => onChange(k, "text_ar", e.target.value)} /></Field>
      </div>
    </>
  );
  return (
    <>
      <div className="admin-card">
        <h3>Add a review</h3>
        {form(n, (k, f, val) => setN((x) => ({ ...x, [f]: val })))}
        <button className="btn-add" onClick={add}>+ Add review</button>
        <p className="muted">If there are no visible reviews, the reviews section disappears from the home page.</p>
      </div>
      {reviews.map((r) => (
        <div className="admin-card" key={r.id}>
          {form({ ...r, ...(ed[r.id] || {}) }, (id, f, val) => put(id, f, val), r.id)}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Stars n={Number((ed[r.id] || {}).stars ?? r.stars)} s={16} />
            <button className="btn-save" style={{ marginInlineStart: "auto", opacity: ed[r.id] ? 1 : 0.5 }} onClick={() => save(r)}>Save</button>
            <button className="btn-danger" onClick={() => del(r)}>🗑️</button>
          </div>
        </div>
      ))}
    </>
  );
}

// ---------------- SITE TEXTS ----------------
function TextsTab({ texts, setTexts, run }) {
  const [ed, setEd] = useState({});
  const [up, setUp] = useState("");
  const upsert = (key, en, ar) => run(async () => {
    await sb("site_texts?on_conflict=key", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ key, en, ar }) });
    setTexts((t) => ({ ...t, [key]: { en, ar } }));
  });
  const reset = (key) => run(async () => {
    await sb(`site_texts?key=eq.${key}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
    setTexts((t) => { const m = { ...t }; delete m[key]; return m; });
    setEd((x) => { const m = { ...x }; delete m[key]; return m; });
  });
  const img = async (key, file) => {
    if (!file) return;
    setUp(key);
    const url = await uploadPhoto(file, key);
    if (url) await upsert(key, url, url); else alert("Upload failed. If your session expired, log out and log in again.");
    setUp("");
  };
  const ImgSetting = ({ k, label, help }) => {
    const url = texts[k] && texts[k].en;
    return (
      <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", padding: "8px 0" }}>
        {url ? <img src={url} alt="" style={{ width: 120, height: 80, objectFit: "cover", borderRadius: 6 }} /> : <div style={{ width: 120, height: 80, background: "var(--beige2)", borderRadius: 6 }} />}
        <div style={{ flex: 1, minWidth: 180 }}><strong>{label}</strong><div className="muted">{help}</div></div>
        <label className="btn-soft" style={{ cursor: "pointer" }}>{up === k ? "⏳..." : "📷 Upload"}<input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => img(k, e.target.files[0])} /></label>
        {url && <button className="btn-danger" onClick={() => reset(k)}>Remove</button>}
      </div>
    );
  };
  return (
    <>
      <div className="admin-card">
        <h3>Pictures</h3>
        <ImgSetting k="hero_bg" label="Home page background" help="A nature photo. It is shown very faded behind the title." />
        <ImgSetting k="story_img" label="Our story picture" help="A photo of you or your workshop." />
      </div>
      <p className="muted" style={{ marginBottom: 16 }}>Change any text of the home page below. Write the English and the Arabic versions, then press Save. If you leave a box empty, the default text is used. Use **text** for bold.</p>
      {TEXT_GROUPS.map((g) => (
        <div className="admin-card" key={g.g}>
          <h3>{g.g}</h3>
          {g.items.map(([k, label, den, dar]) => {
            const saved = texts[k] || {};
            const cur = { en: (ed[k] && ed[k].en) ?? saved.en ?? den, ar: (ed[k] && ed[k].ar) ?? saved.ar ?? dar };
            const dirty = !!ed[k];
            const long = den.length > 60;
            return (
              <div key={k} style={{ padding: "10px 0", borderTop: "1px solid var(--beige2)" }}>
                <div className="ed-lbl"><span><strong>{label}</strong></span><span>{texts[k] && <button type="button" onClick={() => reset(k)} title="Go back to the default text" style={{ fontWeight: 400 }}>reset</button>}</span></div>
                <div className="ed-2">
                  <textarea className="form-textarea" rows={long ? 3 : 1} style={{ minHeight: 0 }} value={cur.en} onChange={(e) => setEd((x) => ({ ...x, [k]: { en: e.target.value, ar: cur.ar } }))} />
                  <textarea className="form-textarea" rows={long ? 3 : 1} style={{ minHeight: 0 }} dir="rtl" value={cur.ar} onChange={(e) => setEd((x) => ({ ...x, [k]: { en: cur.en, ar: e.target.value } }))} />
                </div>
                {dirty && <button className="btn-save" style={{ marginTop: 8 }} onClick={async () => { if (await upsert(k, cur.en, cur.ar)) setEd((x) => { const m = { ...x }; delete m[k]; return m; }); }}>Save</button>}
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
}

// ---------------- INGREDIENTS ----------------
function IngredientsTab({T,ingredients,onPatch,onAdd,onDelete}) {
  const emptyI = {name:"",category:"Base Ingredients",qty:0,threshold:0};
  const [edits,setEdits] = useState({});
  const [search,setSearch] = useState("");
  const [filterCat,setFilterCat] = useState("all");
  const [showAdd,setShowAdd] = useState(false);
  const [newIng,setNewIng] = useState(emptyI);
  const setEdit = (id,field,val)=>setEdits(e=>({...e,[id]:{...e[id],[field]:val}}));
  const save = async (ing)=>{
    const ed = edits[ing.id];
    if (!ed) return;
    const patch = {};
    if (ed.qty!==undefined) patch.qty = Number(ed.qty)||0;
    if (ed.threshold!==undefined) patch.threshold = Number(ed.threshold)||0;
    await onPatch(ing.id,patch);
    setEdits(e=>{const n={...e};delete n[ing.id];return n;});
  };
  const handleAdd = async ()=>{
    if (!newIng.name) { alert("Please fill the name."); return; }
    await onAdd({...newIng,qty:Number(newIng.qty)||0,threshold:Number(newIng.threshold)||0});
    setNewIng(emptyI);
    setShowAdd(false);
  };
  const cats = [...new Set(ingredients.map(i=>i.category))];
  const filtered = ingredients.filter(i=>(filterCat==="all"||i.category===filterCat)&&(i.name||"").toLowerCase().includes(search.toLowerCase()));
  const grouped = cats.reduce((acc,cat)=>{const items=filtered.filter(i=>i.category===cat);if(items.length)acc[cat]=items;return acc;},{});
  return (
    <div className="admin-card">
      <button className="btn-add" onClick={()=>setShowAdd(true)}>+ Add New Ingredient</button>
      {showAdd&&(
        <div className="modal-overlay" onClick={()=>setShowAdd(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <h3 className="modal-title">Add New Ingredient</h3>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" value={newIng.name} onChange={e=>setNewIng(i=>({...i,name:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={newIng.category} onChange={e=>setNewIng(i=>({...i,category:e.target.value}))}>
                {ING_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{display:"flex",gap:12}}>
              <div className="form-group" style={{flex:1}}>
                <label className="form-label">Quantity (g)</label>
                <input className="form-input" type="number" min="0" value={newIng.qty} onChange={e=>setNewIng(i=>({...i,qty:e.target.value}))} />
              </div>
              <div className="form-group" style={{flex:1}}>
                <label className="form-label">Alert at (g)</label>
                <input className="form-input" type="number" min="0" value={newIng.threshold} onChange={e=>setNewIng(i=>({...i,threshold:e.target.value}))} />
              </div>
            </div>
            <div style={{display:"flex",gap:12}}>
              <button className="btn-primary" style={{flex:1,padding:13}} onClick={handleAdd}>Add Ingredient</button>
              <button className="btn-outline" style={{flex:1,padding:13}} onClick={()=>setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <div className="search-bar">
        <input className="search-input" placeholder={T.search} value={search} onChange={e=>setSearch(e.target.value)} />
        <select className="select-filter" value={filterCat} onChange={e=>setFilterCat(e.target.value)}>
          <option value="all">All Categories</option>
          {cats.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div style={{overflowX:"auto"}}>
        <table className="rtable">
          <thead><tr><th>Ingredient</th><th>Qty (g)</th><th>{T.threshold}</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {Object.entries(grouped).map(([cat,items])=>(
              <Fragment key={cat}>
                <tr className="cat-row"><td colSpan={5} className="ing-cat">{cat}</td></tr>
                {items.map(ing=>{
                  const ed = edits[ing.id]||{};
                  const isLow = ing.threshold>0&&ing.qty<=ing.threshold;
                  const dirty = Object.keys(ed).length>0;
                  return (
                    <tr key={ing.id} className={isLow?"low":""}>
                      <td data-label="Ingredient"><strong style={{fontWeight:500}}>{ing.name}</strong></td>
                      <td data-label="Qty (g)"><input className="qty-input" type="number" min="0" value={ed.qty??ing.qty} onChange={e=>setEdit(ing.id,"qty",e.target.value)} /></td>
                      <td data-label={T.threshold}><input className="qty-input" type="number" min="0" value={ed.threshold??ing.threshold} onChange={e=>setEdit(ing.id,"threshold",e.target.value)} /></td>
                      <td data-label="Status">{isLow?<span className="badge badge-low">{T.low_stock}</span>:<span className="badge badge-ok">OK</span>}</td>
                      <td className="center">
                        <div style={{display:"flex",gap:6}}>
                          <button className="btn-save" style={{padding:"9px 14px",opacity:dirty?1:0.5}} onClick={()=>save(ing)}>{T.save}</button>
                          <button className="btn-danger" style={{padding:"9px 14px"}} onClick={()=>{if(window.confirm("Delete this ingredient?")) onDelete(ing.id);}}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DeliveryTab({T,delivery,onPatch}) {
  const [edits,setEdits] = useState({});
  const [search,setSearch] = useState("");
  const setEdit = (id,field,val)=>setEdits(e=>({...e,[id]:{...e[id],[field]:val}}));
  const save = async (d)=>{
    const ed = edits[d.id];
    if (!ed) return;
    const patch = {};
    if (ed.home!==undefined) patch.home = Number(ed.home)||0;
    if (ed.stopdesk!==undefined) patch.stopdesk = Number(ed.stopdesk)||0;
    await onPatch(d.id,patch);
    setEdits(e=>{const n={...e};delete n[d.id];return n;});
  };
  const filtered = delivery.filter(d=>(d.wilaya||"").toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="admin-card">
      <p className="muted" style={{marginBottom:14}}>Change a price, then press Save. Customers see the new price immediately.</p>
      <div className="search-bar">
        <input className="search-input" placeholder={T.search} value={search} onChange={e=>setSearch(e.target.value)} />
      </div>
      <div style={{overflowX:"auto"}}>
        <table className="rtable">
          <thead><tr><th>{T.c_wilaya}</th><th>{T.home_price}</th><th>{T.stop_price}</th><th></th></tr></thead>
          <tbody>
            {filtered.map(d=>{
              const ed = edits[d.id]||{};
              const dirty = Object.keys(ed).length>0;
              return (
                <tr key={d.id}>
                  <td data-label={T.c_wilaya}><strong style={{fontWeight:500}}>{d.wilaya}</strong></td>
                  <td data-label={T.home_price}><input className="qty-input" type="number" min="0" value={ed.home??d.home} onChange={e=>setEdit(d.id,"home",e.target.value)} /></td>
                  <td data-label={T.stop_price}><input className="qty-input" type="number" min="0" value={ed.stopdesk??d.stopdesk} onChange={e=>setEdit(d.id,"stopdesk",e.target.value)} /></td>
                  <td className="center"><button className="btn-save" style={{padding:"9px 18px",opacity:dirty?1:0.5}} onClick={()=>save(d)}>{T.save}</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
