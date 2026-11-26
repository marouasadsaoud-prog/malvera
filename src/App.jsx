import { useState, useEffect, useRef } from "react";
import {
  sb, toNum, unitPrice, getFee, WILAYAS, ANDERSON_STOPDESKS, STOPDESK_WILAYAS, money, waLink,
  imgsOf, isSold, canBuy, pText, pDet, DETAIL_FIELDS, Rich, Ico, Stars, Stepper, DEFAULTS, TR, CSS,
} from "./lib.jsx";
import Admin from "./Admin.jsx";

const FALLBACK_COLLECTIONS = [
  { id: 1, slug: "face", name_en: "Face", name_ar: "الوجه" },
  { id: 2, slug: "lip", name_en: "Lip Care", name_ar: "العناية بالشفاه" },
  { id: 3, slug: "body", name_en: "Body", name_ar: "الجسم" },
  { id: 4, slug: "hair", name_en: "Hair", name_ar: "الشعر" },
];

const priceOf = (p) => (
  p.discount_price && toNum(p.discount_price)
    ? <span><s style={{ color: "var(--muted)", fontSize: "0.85em", marginInlineEnd: 8 }}>{money(toNum(p.price))}</s><span style={{ color: "var(--red)", fontWeight: 600 }}>{money(toNum(p.discount_price))}</span></span>
    : <span>{money(toNum(p.price))}</span>
);
const Bold = ({ text }) => String(text || "").split(/(\*\*[^*]+\*\*)/g).map((s, j) => (/^\*\*[^*]+\*\*$/.test(s) ? <strong key={j}>{s.slice(2, -2).trim()}</strong> : s));

function Leaves() {
  const d = <><path d="M20 560C60 400 120 260 250 90" /><path d="M70 440c-30-10-50-35-55-60 30 0 52 20 55 60z" /><path d="M95 360c30-5 55-25 62-55-32 2-58 22-62 55z" /><path d="M130 285c-28-12-42-38-44-62 28 4 46 26 44 62z" /><path d="M170 220c30-3 52-22 60-50-30 0-54 18-60 50z" /><path d="M215 150c-24-14-34-38-34-60 26 6 40 28 34 60z" /></>;
  return (
    <>
      <svg className="hero-leaf" style={{ left: -30, top: 0 }} width="360" height="560" viewBox="0 0 360 560" fill="none" stroke="#7d8f69" strokeWidth="1.4" aria-hidden="true">{d}</svg>
      <svg className="hero-leaf" style={{ right: -30, bottom: 0, transform: "scaleX(-1)" }} width="360" height="560" viewBox="0 0 360 560" fill="none" stroke="#a08a5a" strokeWidth="1.4" aria-hidden="true">{d}</svg>
    </>
  );
}

function Avail({ p, T }) {
  const sold = isSold(p);
  if (sold && p.preorder) return <div className="avail pre"><i />{T.preorder}</div>;
  if (sold) return <div className="avail out"><i />{T.out_stock}</div>;
  if (Number(p.stock) <= Number(p.threshold || 0)) return <div className="avail pre"><i />{T.few_left}</div>;
  return <div className="avail"><i />{T.in_stock}</div>;
}

function ProductCard({ p, c }) {
  const { T, lang, cart, changeQty } = c;
  const imgs = imgsOf(p);
  const sold = isSold(p);
  const pre = sold && p.preorder;
  const inCart = cart.find((i) => i.productId === p.id);
  const pc = toNum(p.price), dc = toNum(p.discount_price);
  const off = !sold && dc && pc && dc < pc ? Math.round(100 - (dc / pc) * 100) : 0;
  return (
    <div className="pcard" onClick={() => c.openProduct(p)}>
      <div className={`pimg ${sold && !pre ? "soldimg" : ""}`}>
        {imgs[0] ? <img src={imgs[0]} alt={pText(p, "name", lang)} loading="lazy" /> : <Ico n="leaf" s={44} />}
        {sold && !pre && <span className="tag red">{T.sold_out}</span>}
        {pre && <span className="tag">{T.preorder}</span>}
        {off > 0 && <span className="tag gold">-{off}%</span>}
      </div>
      <div className="pinfo">
        <div className="pcat">{c.catLabel(p)}</div>
        <div className="pname">{pText(p, "name", lang)}</div>
        <div className="pshort">{pText(p, "short_desc", lang)}</div>
        <div className="pprice">{priceOf(p)}</div>
        <Avail p={p} T={T} />
        <div className="pact" onClick={(e) => e.stopPropagation()}>
          {sold && !pre ? <button className="btn-outline" disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>{T.sold_out}</button>
            : inCart ? <Stepper qty={inCart.qty} onChange={(q) => changeQty(p.id, q)} />
            : <button className={pre ? "btn-outline" : "btn-primary"} onClick={() => changeQty(p.id, 1)}>{pre ? T.preorder_btn : T.add_basket}</button>}
        </div>
      </div>
    </div>
  );
}

function StopLocator({ c }) {
  const { T, tx } = c;
  const [w, setW] = useState("");
  const [s, setS] = useState("");
  const list = w ? ANDERSON_STOPDESKS[w] || [] : [];
  const sel = list.find((x) => x.name === s);
  return (
    <div className="stopcard">
      <div className="form-group" style={{ marginBottom: 12 }}>
        <label className="form-label">{T.stop_sel_w}</label>
        <select className="form-select" value={w} onChange={(e) => { setW(e.target.value); setS(""); }}>
          <option value="">{T.sel_wilaya}</option>
          {STOPDESK_WILAYAS.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
      </div>
      {w && (
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">{T.stop_sel_s}</label>
          <select className="form-select" value={s} onChange={(e) => setS(e.target.value)}>
            <option value="">{T.sel_stopdesk}</option>
            {list.map((x) => <option key={x.name} value={x.name}>{x.name}</option>)}
          </select>
        </div>
      )}
      {sel && sel.maps && <a className="mapbtn" href={sel.maps} target="_blank" rel="noreferrer"><Ico n="pin" s={22} />{T.stop_map_btn}</a>}
      {sel && !sel.maps && <p className="muted" style={{ marginTop: 12 }}>{T.stop_nomap}</p>}
      {!sel && <p className="muted" style={{ marginTop: 12 }}>{T.stop_pick}</p>}
    </div>
  );
}

function Home({ c }) {
  const { T, tx, lang, shown, collections, reviews } = c;
  const trust = [["leaf", "t1"], ["drop", "t2"], ["truck", "t3"], ["check", "t4"]];
  const cols = collections.filter((k) => shown.some((p) => (p.category || "").split(",").map((x) => x.trim()).includes(k.slug)));
  const heroBg = c.texts.hero_bg && c.texts.hero_bg.en;
  const storyImg = c.texts.story_img && c.texts.story_img.en;
  return (
    <>
      <section className="hero">
        {heroBg && <div className="hero-bg" style={{ backgroundImage: `url(${heroBg})` }} />}
        <Leaves />
        <div className="hero-in">
          <div className="eyebrow">{tx("hero_tag")}</div>
          <h1 className="hero-title brand">MALVERA</h1>
          <div className="hero-tagline ital">{tx("hero_tagline")}</div>
          <p className="hero-desc">{tx("hero_desc")}</p>
          <div className="hero-btns">
            <button className="btn-primary" onClick={() => c.openShop("all")}>{tx("hero_btn1")}</button>
            <button className="btn-outline" onClick={() => c.goSection("story")}>{tx("hero_btn2")}</button>
          </div>
        </div>
      </section>
      <div className="trust"><div className="trust-in">
        {trust.map(([ic, k]) => (
          <div className="trust-i" key={k}><Ico n={ic} s={32} /><div><b>{tx(k)}</b><small>{tx(k + "s")}</small></div></div>
        ))}
      </div></div>

      {cols.length > 0 && (
        <section className="wrap section">
          <div className="eyebrow">{tx("cats_eyebrow")}</div>
          <h2 className="h2">{tx("cats_title")}</h2>
          <div className="cats">
            {cols.map((k) => {
              const first = shown.find((p) => (p.category || "").split(",").map((x) => x.trim()).includes(k.slug) && imgsOf(p)[0]);
              return (
                <button key={k.id} className="cat-card" onClick={() => c.openShop(k.slug)}>
                  <div className="cat-img">{first && <img src={imgsOf(first)[0]} alt="" loading="lazy" />}</div>
                  <div className="cat-foot"><b>{(lang === "ar" && k.name_ar) || k.name_en}</b><span>{T.explore} →</span></div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {shown.length > 0 && (
        <section className="wrap section">
          <div className="head-row">
            <div><div className="eyebrow">{tx("coll_eyebrow")}</div><h2 className="h2">{tx("coll_title")}</h2></div>
            <button className="link-u" onClick={() => c.openShop("all")}>{T.view_all}</button>
          </div>
          <div className="pgrid">{shown.slice(0, 4).map((p) => <ProductCard key={p.id} p={p} c={c} />)}</div>
        </section>
      )}

      <section className="wrap section" id="story">
        <div className="split">
          <div><div className="story-img">{storyImg && <img src={storyImg} alt="" loading="lazy" />}</div></div>
          <div>
            <div className="eyebrow">{tx("story_eyebrow")}</div>
            <h2 className="h2">{tx("story_title")}</h2>
            <p className="story-p">{tx("story_text")}</p>
            <div className="ticks">
              {["story_b1", "story_b2", "story_b3"].map((k) => <div key={k}><span className="tick"><Ico n="check" s={15} /></span><span>{tx(k)}</span></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="wrap section">
        <div className="center"><div className="eyebrow">{tx("steps_eyebrow")}</div><h2 className="h2">{tx("steps_title")}</h2></div>
        <div className="steps">
          {[1, 2, 3].map((n) => <div className="step" key={n}><div className="step-n">{n}</div><h3>{tx(`step${n}_t`)}</h3><p>{tx(`step${n}_d`)}</p></div>)}
        </div>
      </section>

      {reviews.length > 0 && (
        <section className="wrap section">
          <div className="center"><div className="eyebrow">{tx("reviews_eyebrow")}</div><h2 className="h2">{tx("reviews_title")}</h2></div>
          <div className="revs">
            {reviews.slice(0, 9).map((r) => (
              <div className="rev" key={r.id}>
                <Stars n={r.stars || 5} />
                <q>“{(lang === "ar" ? r.text_ar || r.text_en : r.text_en || r.text_ar) || ""}”</q>
                <b>{r.name}</b>{r.city && <small>{r.city}</small>}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="wrap section">
        <div className="stopblock">
          <div style={{ flex: "1 1 340px", minWidth: 0 }}>
            <div className="eyebrow">{tx("stop_eyebrow")}</div>
            <h2>{tx("stop_title")}</h2>
            <p>{tx("stop_desc")}</p>
          </div>
          <StopLocator c={c} />
        </div>
      </section>
    </>
  );
}

function ShopPage({ c }) {
  const { T, lang, shown, collections } = c;
  const f = c.filter;
  const list = f === "all" ? shown : shown.filter((p) => (p.category || "").split(",").map((x) => x.trim()).includes(f));
  return (
    <div className="wrap page-top">
      <div className="eyebrow">{T.nav_shop}</div>
      <h2 className="h2">{T.cat_title}</h2>
      <div className="filters">
        <button className={`filter-btn ${f === "all" ? "active" : ""}`} onClick={() => c.setFilter("all")}>{T.f_all}</button>
        {collections.map((k) => <button key={k.id} className={`filter-btn ${f === k.slug ? "active" : ""}`} onClick={() => c.setFilter(k.slug)}>{(lang === "ar" && k.name_ar) || k.name_en}</button>)}
      </div>
      {list.length === 0 ? <p className="muted" style={{ marginTop: 30 }}>{T.no_products}</p> : <div className="pgrid">{list.map((p) => <ProductCard key={p.id} p={p} c={c} />)}</div>}
    </div>
  );
}

function DetailPage({ c, p }) {
  const { T, lang, tx, cart, changeQty } = c;
  const imgs = imgsOf(p);
  const [i, setI] = useState(0);
  const touch = useRef(null);
  useEffect(() => { setI(0); }, [p.id]);
  const n = imgs.length;
  const go = (d) => setI((x) => (x + d + n) % n);
  const sold = isSold(p), pre = sold && p.preorder;
  const line = cart.find((x) => x.productId === p.id);
  const fields = DETAIL_FIELDS.map(([k, en, ar]) => [k, lang === "ar" ? ar : en, pDet(p, k, lang)]).filter((x) => x[2] && x[2].trim());
  const note = pDet(p, "availability", lang);
  const others = c.shown.filter((x) => x.id !== p.id).slice(0, 4);
  return (
    <div className="wrap page-top">
      <button className="back-btn" onClick={() => c.openShop(c.filter)}>{T.back_shop}</button>
      <div className="dgrid">
        <div>
          <div className="gal-main"
            onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => { if (touch.current === null || n < 2) return; const dx = e.changedTouches[0].clientX - touch.current; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); touch.current = null; }}>
            {n > 0 ? <img src={imgs[i]} alt={pText(p, "name", lang)} style={sold && !pre ? { opacity: 0.6 } : null} /> : <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}><Ico n="leaf" s={64} /></div>}
            {sold && !pre && <span className="tag red">{T.sold_out}</span>}
            {pre && <span className="tag">{T.preorder}</span>}
            {n > 1 && <>
              <button className="gal-arrow l" onClick={() => go(-1)} aria-label="previous"><Ico n="left" s={20} /></button>
              <button className="gal-arrow r" onClick={() => go(1)} aria-label="next"><Ico n="right" s={20} /></button>
              <div className="gal-dots">{imgs.map((_, k) => <i key={k} className={k === i ? "on" : ""} />)}</div>
            </>}
          </div>
          {n > 1 && <div className="thumbs">{imgs.map((u, k) => <button key={k} className={`thumb ${k === i ? "on" : ""}`} onClick={() => setI(k)}><img src={u} alt="" /></button>)}</div>}
        </div>
        <div>
          <div className="pcat">{c.catLabel(p)}</div>
          <h1 className="d-title">{pText(p, "name", lang)}</h1>
          <div className="d-price">{priceOf(p)}</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginTop: 8 }}>
            <Avail p={p} T={T} />{note && <span className="muted">· {note}</span>}
          </div>
          {pText(p, "short_desc", lang) && <p className="d-desc"><Rich text={pText(p, "short_desc", lang)} /></p>}
          <div className="d-buy">
            {sold && !pre ? <button className="btn-outline" disabled style={{ opacity: 0.5, flex: "1 1 200px" }}>{T.sold_out}</button>
              : line ? <><Stepper qty={line.qty} onChange={(q) => changeQty(p.id, q)} /><button className="btn-primary" onClick={() => c.go("order")}>{T.view_basket}</button></>
              : <><Stepper qty={c.detailQty} onChange={(q) => c.setDetailQty(Math.max(1, Math.floor(Number(q)) || 1))} /><button className="btn-primary" onClick={() => changeQty(p.id, c.detailQty)}>{pre ? T.preorder_btn : T.add_basket}</button></>}
          </div>
          {pre && <div className="d-note">{tx("preorder_note")}</div>}
          {pText(p, "full_desc", lang) && <div className="d-desc"><Rich text={pText(p, "full_desc", lang)} /></div>}
          {fields.length > 0 && (
            <div className="accs">
              {fields.map(([k, title, body], idx) => (
                <details className="acc" key={k + p.id} open={idx === 0}>
                  <summary>{title}<Ico n="down" s={18} /></summary>
                  <div className="acc-b"><Rich text={body} /></div>
                </details>
              ))}
            </div>
          )}
        </div>
      </div>
      {others.length > 0 && (
        <div className="section">
          <h2 className="h2">{T.more_like}</h2>
          <div className="pgrid">{others.map((x) => <ProductCard key={x.id} p={x} c={c} />)}</div>
        </div>
      )}
    </div>
  );
}

function OrderPage({ c }) {
  const { T, lang, tx, shown, cartLines, subtotal, delivery, changeQty } = c;
  const [form, setForm] = useState({ name: "", phone: "", wilaya: "", commune: "", address: "", stopdesk: "", deliveryType: "home" });
  const [showMore, setShowMore] = useState(cartLines.length === 0);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const isStop = form.deliveryType === "stopdesk";
  const stops = form.wilaya && ANDERSON_STOPDESKS[form.wilaya] ? ANDERSON_STOPDESKS[form.wilaya] : [];
  const sel = stops.find((s) => s.name === form.stopdesk);
  const fee = form.wilaya ? getFee(delivery, form.wilaya, form.deliveryType) : null;
  const total = subtotal + (fee || 0);
  const available = shown.filter((p) => canBuy(p) && !cartLines.find((l) => l.productId === p.id));
  const hasPre = cartLines.some((l) => l.pre);

  const handle = async () => {
    if (sending) return;
    setErr("");
    if (cartLines.length === 0) { setErr(T.err_basket); return; }
    if (!form.name.trim() || !form.phone.trim() || !form.wilaya) { setErr(T.err_fill); return; }
    if (isStop ? !form.stopdesk : (!form.commune.trim() || !form.address.trim())) { setErr(T.err_fill); return; }
    if (!/^(\+213|0)[567]\d{8}$/.test(form.phone.replace(/[\s.\-]/g, ""))) { setErr(T.err_phone); return; }
    setSending(true);
    const r = await c.submitOrder(form, sel);
    setSending(false);
    if (r !== true) setErr(r);
  };
  const dbtn = (key, ic, label) => (
    <button type="button" className={`dbtn ${form.deliveryType === key ? "on" : ""}`} onClick={() => { set("deliveryType", key); set("wilaya", ""); set("stopdesk", ""); }}><Ico n={ic} s={20} />{label}</button>
  );
  return (
    <div className="order-page">
      <button className="back-btn" onClick={() => c.openShop("all")}>{T.back_shop}</button>
      <h2 className="order-title">{T.order_title}</h2>

      <h3 className="step-title">1. {T.your_basket}</h3>
      {cartLines.length === 0 ? <p className="muted">{T.basket_empty}</p> : (
        <div className="basket">
          {cartLines.map((l) => (
            <div className="basket-row" key={l.productId}>
              <div className="basket-thumb">{imgsOf(l.product)[0] && <img src={imgsOf(l.product)[0]} alt="" />}</div>
              <div className="basket-info">
                <div className="basket-name">{l.name}{l.pre && <span className="pre-pill">{T.pre_tag}</span>}</div>
                <div className="basket-unit">{money(l.unit)}</div>
              </div>
              <button type="button" className="basket-x" onClick={() => changeQty(l.productId, 0)}>✕</button>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: 10 }}>
                <Stepper qty={l.qty} onChange={(q) => changeQty(l.productId, q)} />
                <div className="basket-line">{money(l.line)}</div>
              </div>
            </div>
          ))}
          <div className="basket-sub"><span>{T.subtotal}</span><strong>{money(subtotal)}</strong></div>
        </div>
      )}
      {hasPre && <div className="d-note">{tx("preorder_note")}</div>}
      <button type="button" className="btn-outline" style={{ width: "100%", marginTop: 12 }} onClick={() => setShowMore((s) => !s)}>
        {showMore ? T.hide_more : cartLines.length === 0 ? T.choose_products : T.explore_more} {showMore ? "▲" : "▼"}
      </button>
      {showMore && (
        <div style={{ marginTop: 14 }}>
          {available.length === 0 ? <p className="muted">{T.no_other}</p> : (
            <div className="pick-grid">
              {available.map((p) => (
                <div key={p.id} className="pick-card">
                  <div className="pick-img">{imgsOf(p)[0] && <img src={imgsOf(p)[0]} alt="" />}</div>
                  <div className="pick-name">{pText(p, "name", lang)}</div>
                  <div className="pick-price">{priceOf(p)}</div>
                  <button type="button" className="btn-primary pick-add" onClick={() => changeQty(p.id, 1)}>+ {isSold(p) ? T.preorder_btn : T.add_basket}</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <h3 className="step-title">2. {T.your_details}</h3>
      {[["name", T.f_name, "text"], ["phone", T.f_phone, "tel"]].map(([k, l, type]) => (
        <div className="form-group" key={k}>
          <label className="form-label">{l} *</label>
          <input className="form-input" type={type} dir={k === "phone" ? "ltr" : undefined} value={form[k]} onChange={(e) => set(k, e.target.value)} />
        </div>
      ))}
      <div className="form-group">
        <label className="form-label">{T.del_type} *</label>
        <div className="dtype">{dbtn("home", "home", T.del_home)}{dbtn("stopdesk", "building", T.del_stop)}</div>
      </div>
      <div className="form-group">
        <label className="form-label">{T.f_wilaya} *</label>
        <select className="form-select" value={form.wilaya} onChange={(e) => { set("wilaya", e.target.value); set("stopdesk", ""); }}>
          <option value="">{T.sel_wilaya}</option>
          {(isStop ? STOPDESK_WILAYAS : WILAYAS).map((w) => { const f = getFee(delivery, w, form.deliveryType); return <option key={w} value={w}>{w}{f !== null ? ` — ${money(f)}` : ""}</option>; })}
        </select>
      </div>
      {isStop && form.wilaya && (
        <div className="form-group">
          <label className="form-label">{T.f_stopdesk} *</label>
          <select className="form-select" value={form.stopdesk} onChange={(e) => set("stopdesk", e.target.value)}>
            <option value="">{T.sel_stopdesk}</option>
            {stops.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
          </select>
          <div className="stopbox" style={{ marginTop: 12 }}>
            {sel && sel.maps && <a className="mapbtn" style={{ marginTop: 0 }} href={sel.maps} target="_blank" rel="noreferrer"><Ico n="pin" s={22} />{T.stop_map_btn}</a>}
            {sel && !sel.maps && <p className="muted">{T.stop_nomap}</p>}
            {!sel && <p className="muted">{T.stop_pick}</p>}
          </div>
        </div>
      )}
      {!isStop && (
        <>
          <div className="form-group"><label className="form-label">{T.f_commune} *</label><input className="form-input" value={form.commune} onChange={(e) => set("commune", e.target.value)} placeholder={T.sel_commune} /></div>
          <div className="form-group"><label className="form-label">{T.f_addr} *</label><input className="form-input" value={form.address} onChange={(e) => set("address", e.target.value)} /></div>
        </>
      )}
      <div className="totals">
        <div><span>{T.subtotal}</span><span>{money(subtotal)}</span></div>
        <div><span>{T.delivery_fee}</span><span>{!form.wilaya ? T.select_wilaya_fee : fee === null ? T.fee_tbc : money(fee)}</span></div>
        <div className="grand"><span>{T.total}</span><span>{money(total)}</span></div>
      </div>
      {err && <div className="form-error">{err}</div>}
      <button className="btn-primary" style={{ width: "100%", padding: 17 }} onClick={handle} disabled={sending}>{sending ? "..." : T.submit}</button>
    </div>
  );
}

function ConfirmPage({ c }) {
  const { T, tx, lastOrder: o } = c;
  if (!o) return null;
  const wa = c.ct("c_whatsapp"), ig = c.ct("c_instagram"), tt = c.ct("c_tiktok"), em = c.ct("c_email");
  return (
    <div className="confirm">
      <h2 className="confirm-title">{T.conf_title}</h2>
      <div className="order-no">{T.order_number}<strong dir="ltr">#{o.number ?? "—"}</strong></div>
      <p className="muted" style={{ marginBottom: 20 }}>{T.keep_number}</p>
      <div className="receipt">
        <div className="receipt-title">{T.your_order}</div>
        {o.items.map((i, k) => <div className="receipt-row" key={k}><span>{i.productName} × {i.qty}{i.preorder && <span className="pre-pill">{T.pre_tag}</span>}</span><span>{money(i.price * i.qty)}</span></div>)}
        <div className="receipt-row"><span>{T.subtotal}</span><span>{money(o.subtotal)}</span></div>
        <div className="receipt-row"><span>{T.delivery_fee}</span><span>{money(o.fee)}</span></div>
        <div className="receipt-row grand"><span>{T.total}</span><span>{money(o.total)}</span></div>
        <div className="receipt-meta">
          <div>{o.name}</div>
          <div>{T.delivery_to}: {o.deliveryType === "stopdesk" ? T.del_stop : T.del_home} — {o.wilaya}</div>
          <div>{o.place}</div>
        </div>
        {o.deliveryType === "stopdesk" && o.map && <a className="mapbtn" href={o.map} target="_blank" rel="noreferrer"><Ico n="pin" s={22} />{T.stop_map_btn}</a>}
      </div>
      {o.pre && <div className="d-note" style={{ marginBottom: 18, textAlign: "start" }}>{tx("preorder_note")}</div>}
      <p className="muted" style={{ marginBottom: 20, lineHeight: 1.8, fontSize: "1rem" }}>{T.conf_msg}</p>
      <div className="contact-box">
        <div style={{ marginBottom: 6 }}>{T.contact_us}</div>
        <a href={waLink(wa)} target="_blank" rel="noreferrer"><Ico n="wa" s={20} /><span dir="ltr">WhatsApp: {wa}</span></a>
        <a href={`https://instagram.com/${ig}`} target="_blank" rel="noreferrer"><Ico n="ig" s={20} /><span dir="ltr">@{ig}</span></a>
        <a href={`https://www.tiktok.com/@${tt}`} target="_blank" rel="noreferrer"><Ico n="tt" s={20} /><span dir="ltr">@{tt}</span></a>
        <a href={`mailto:${em}`}><Ico n="mail" s={20} /><span dir="ltr">{em}</span></a>
      </div>
      <button className="btn-primary" onClick={() => c.go("home")}>{T.conf_back}</button>
    </div>
  );
}

function Footer({ c }) {
  const { T, tx, lang, collections } = c;
  const wa = c.ct("c_whatsapp"), ig = c.ct("c_instagram"), tt = c.ct("c_tiktok");
  const tap = useRef({ n: 0, t: null });
  return (
    <footer className="footer" id="contact">
      <div className="foot-in">
        <div style={{ flex: "1 1 280px", minWidth: 0 }}>
          <div className="foot-logo brand">MALVERA</div>
          <p style={{ marginTop: 14, fontSize: "0.95rem", lineHeight: 1.7, color: "#d3c4ad", fontWeight: 300, maxWidth: 340 }}>{tx("footer_desc")}</p>
        </div>
        <div style={{ flex: "0 1 200px", minWidth: 0 }}>
          <div className="foot-h">{T.nav_shop}</div>
          <div className="foot-l">{collections.map((k) => <button key={k.id} onClick={() => c.openShop(k.slug)}>{(lang === "ar" && k.name_ar) || k.name_en}</button>)}</div>
        </div>
        <div style={{ flex: "0 1 280px", minWidth: 0 }}>
          <div className="foot-h">{T.nav_contact}</div>
          <div className="foot-l">
            <a href={waLink(wa)} target="_blank" rel="noreferrer"><Ico n="wa" s={20} /><span dir="ltr">WhatsApp · {wa}</span></a>
            <a href={`https://instagram.com/${ig}`} target="_blank" rel="noreferrer"><Ico n="ig" s={20} /><span dir="ltr">@{ig}</span></a>
            <a href={`https://www.tiktok.com/@${tt}`} target="_blank" rel="noreferrer"><Ico n="tt" s={20} /><span dir="ltr">@{tt}</span></a>
          </div>
        </div>
      </div>
      <div className="foot-b">© Malvera
        <span onClick={() => {
          const t = tap.current; t.n++; clearTimeout(t.t); t.t = setTimeout(() => { t.n = 0; }, 1000);
          if (t.n >= 3) { t.n = 0; c.go("admin"); }
        }} style={{ display: "inline-block", width: 70, height: 28, verticalAlign: "middle", cursor: "default", userSelect: "none", WebkitTapHighlightColor: "transparent" }} />
      </div>
    </footer>
  );
}

export default function App() {
  const [lang, setLang] = useState("en");
  const [page, setPage] = useState("home");
  const [selId, setSelId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [texts, setTexts] = useState({});
  const [reviews, setReviews] = useState([]);
  const [delivery, setDelivery] = useState([]);
  const [cart, setCart] = useState([]);
  const [detailQty, setDetailQty] = useState(1);
  const [lastOrder, setLastOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const T = TR[lang];

  const loadPublic = async () => {
    const get = async (path, set) => { try { set(await sb(path)); } catch (e) { console.error(e); } };
    await Promise.all([
      get("products?order=id", setProducts),
      get("delivery_prices?order=id", setDelivery),
      get("collections?order=sort,id", setCollections),
      get("reviews?visible=eq.true&order=id.desc", setReviews),
      sb("site_texts").then((rows) => { const m = {}; rows.forEach((r) => { m[r.key] = { en: r.en, ar: r.ar }; }); setTexts(m); }).catch(() => {}),
    ]);
    setLoading(false);
  };
  useEffect(() => { loadPublic(); }, []);
  useEffect(() => { window.scrollTo(0, 0); }, [page, selId]);
  useEffect(() => { document.documentElement.lang = lang; document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"; }, [lang]);

  const tx = (k) => { const v = texts[k] && texts[k][lang]; return v && String(v).trim() ? v : (DEFAULTS[k] ? DEFAULTS[k][lang] : ""); };
  const ct = (k) => { const v = texts[k] && texts[k].en; return v && String(v).trim() ? v : DEFAULTS[k].en; };
  const colls = collections.length ? collections : FALLBACK_COLLECTIONS;
  const shown = products.filter((p) => p.active !== false);
  const catLabel = (p) => (p.category || "").split(",").map((s) => colls.find((k) => k.slug === s.trim())).filter(Boolean).map((k) => (lang === "ar" && k.name_ar) || k.name_en).join(" · ");

  const changeQty = (id, q) => setCart((prev) => {
    const p = products.find((x) => x.id === id);
    let n = Math.min(999, Math.max(0, Math.floor(Number(q)) || 0));
    if (p && n > 0) { if (!canBuy(p)) return prev; if (!p.preorder) n = Math.min(n, Math.max(1, Number(p.stock) || 0)); }
    if (n === 0) return prev.filter((i) => i.productId !== id);
    return prev.some((i) => i.productId === id) ? prev.map((i) => (i.productId === id ? { ...i, qty: n } : i)) : [...prev, { productId: id, qty: n }];
  });
  const cartLines = cart.map((x) => {
    const p = products.find((y) => y.id === x.productId);
    if (!p) return null;
    const unit = unitPrice(p);
    return { productId: x.productId, qty: x.qty, product: p, name: pText(p, "name", lang), unit, line: unit * x.qty, pre: x.qty > Number(p.stock || 0) };
  }).filter(Boolean);
  const cartCount = cartLines.reduce((s, l) => s + l.qty, 0);
  const subtotal = cartLines.reduce((s, l) => s + l.line, 0);

  const submitOrder = async (form, stop) => {
    try {
      const isStop = form.deliveryType === "stopdesk";
      const r = await sb("rpc/place_order", { method: "POST", body: JSON.stringify({
        p_name: form.name.trim(), p_phone: form.phone.trim(), p_wilaya: form.wilaya, p_delivery_type: form.deliveryType,
        p_commune: isStop ? "" : form.commune.trim(), p_address: isStop ? form.stopdesk : form.address.trim(),
        p_items: cartLines.map((l) => ({ productId: l.productId, qty: l.qty })),
      }) });
      setLastOrder({
        number: r.order_number, items: r.items, subtotal: r.subtotal, fee: r.delivery_fee, total: r.total, pre: !!r.is_preorder,
        name: form.name.trim(), wilaya: form.wilaya, deliveryType: form.deliveryType, map: stop && stop.maps,
        place: isStop ? form.stopdesk : `${form.commune.trim()} - ${form.address.trim()}`,
      });
      setCart([]); setPage("confirm");
      sb("products?order=id").then(setProducts).catch(() => {});
      return true;
    } catch (e) {
      console.error(e);
      return /out of stock|not available|inactive/i.test(String((e && e.message) || "")) ? T.err_stock : T.err_send;
    }
  };

  const go = (p) => setPage(p);
  const goSection = (id) => {
    const scroll = () => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: "smooth" }); };
    if (page !== "home") { setPage("home"); setTimeout(scroll, 120); } else scroll();
  };
  const openShop = (f) => { setFilter(f || "all"); setPage("shop"); };
  const openProduct = (p) => { setSelId(p.id); setDetailQty(1); setPage("detail"); };
  const c = { T, lang, tx, ct, texts, shown, collections: colls, reviews, cart, cartLines, subtotal, delivery, filter, setFilter, changeQty, detailQty, setDetailQty,
    catLabel, go, goSection, openShop, openProduct, submitOrder, lastOrder };

  if (loading) return (
    <>
      <style>{CSS}</style>
      <div className="loader"><div className="brand" style={{ fontFamily: "Cormorant Garamond", fontSize: "2.5rem", color: "var(--mocha)", letterSpacing: "6px" }}>MALVERA</div></div>
    </>
  );
  if (page === "admin") return (
    <>
      <style>{CSS}</style>
      <Admin T={T} shared={{ products, setProducts, collections, setCollections, texts, setTexts, delivery, setDelivery, reviews, setReviews }} onExit={() => { setPage("home"); loadPublic(); }} />
    </>
  );
  const sp = products.find((p) => p.id === selId);
  const showBar = ["shop", "detail", "home"].includes(page) && cartCount > 0;
  return (
    <>
      <style>{CSS}</style>
      <div className={lang === "ar" ? "rtl" : "ltr"}>
        <nav className="nav"><div className="nav-in">
          <button className="nav-logo brand" onClick={() => go("home")}>MALVERA</button>
          <div className="nav-links">
            <button className={`nav-link ${page === "home" ? "active" : ""}`} onClick={() => go("home")}>{T.nav_home}</button>
            <button className={`nav-link ${["shop", "detail"].includes(page) ? "active" : ""}`} onClick={() => openShop("all")}>{T.nav_shop}</button>
            <button className="nav-link" onClick={() => goSection("story")}>{T.nav_story}</button>
            <button className="nav-link" onClick={() => goSection("contact")}>{T.nav_contact}</button>
          </div>
          <div className="nav-act">
            <button className="lang-btn" onClick={() => setLang(lang === "en" ? "ar" : "en")}>{lang === "en" ? "عربي" : "EN"}</button>
            <button className="basket-btn" onClick={() => go("order")}><Ico n="bag" s={18} /><span className="bt">{T.basket}</span>{cartCount > 0 && <span className="cart-badge">{cartCount}</span>}</button>
          </div>
        </div></nav>
        {page === "home" && <Home c={c} />}
        {page === "shop" && <ShopPage c={c} />}
        {page === "detail" && sp && <DetailPage c={c} p={sp} />}
        {page === "order" && <OrderPage c={c} />}
        {page === "confirm" && <ConfirmPage c={c} />}
        <Footer c={c} />
        {page !== "order" && <a className="wa-float" href={waLink(ct("c_whatsapp"))} target="_blank" rel="noreferrer" aria-label="WhatsApp"><Ico n="wa" s={28} /></a>}
        {showBar && <button className="cart-bar" onClick={() => go("order")}><span>{cartCount} · {money(subtotal)}</span><span>{T.view_basket}</span></button>}
      </div>
    </>
  );
}
