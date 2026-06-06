import { useState, useEffect } from "react";


const SUPABASE_URL = "https://oknqxjijpebnyogcpeee.supabase.co";
const SUPABASE_KEY = "sb_publishable_f2GocL92eVimF-c3ugdnGQ_izZygETk";

const sb = async (path, opts = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...opts.headers,
    },
    ...opts,
  });
  const text = await res.text();
  return text ? JSON.parse(text) : [];
};
const sbAuth = async (email, pass) => {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: pass }),
  });
  const data = await res.json();
  if (data.access_token) return { success: true, token: data.access_token };
  return { success: false };
};
const WILAYAS = ["Adrar","Chlef","Laghouat","Oum El Bouaghi","Batna","Béjaïa","Biskra","Béchar","Blida","Bouira","Tamanrasset","Tébessa","Tlemcen","Tiaret","Tizi Ouzou","Alger","Djelfa","Jijel","Sétif","Saïda","Skikda","Sidi Bel Abbès","Annaba","Guelma","Constantine","Médéa","Mostaganem","M'Sila","Mascara","Ouargla","Oran","El Bayadh","Illizi","Bordj Bou Arréridj","Boumerdès","El Tarf","Tindouf","Tissemsilt","El Oued","Khenchela","Souk Ahras","Tipaza","Mila","Aïn Defla","Naâma","Aïn Témouchent","Ghardaïa","Relizane","Timimoun","Bordj Badji Mokhtar","Ouled Djellal","Béni Abbès","In Salah","In Guezzam","Touggourt","Djanet","El M'Ghair","El Meniaa"];
const EMOJIS = {1:"✨",2:"🧼",3:"💋",4:"🥥",5:"🍑",6:"🤍",7:"🌿",8:"🍓",9:"🫧",10:"🌙"};
const CAT_LABELS = { face:{en:"Face",ar:"الوجه"}, lip:{en:"Lip Care",ar:"العناية بالشفاه"}, body:{en:"Body",ar:"الجسم"}, hair:{en:"Hair",ar:"الشعر"} };
const PriceDisplay = ({price, discount_price}) => discount_price ? (<span><span style={{textDecoration:"line-through",color:"var(--muted)",fontSize:"0.85rem",marginRight:8}}>{price}</span><span style={{color:"var(--red)",fontWeight:600}}>{discount_price}</span></span>) : <span>{price}</span>;

const TR = {
  en:{nav_home:"Home",nav_catalog:"Catalog",nav_order:"Order",hero_cta:"Explore Collection",hero_sub:"Pure. Natural. Handcrafted.",v_natural:"Natural",v_handmade:"Handmade",v_trad:"Traditional",v_tallow:"Tallow-Based",cat_title:"Our Collection",f_all:"All",f_face:"Face",f_lip:"Lip Care",f_body:"Body",f_hair:"Hair",order_btn:"Order Now",details_btn:"View Details",back:"← Back",order_title:"Place Your Order",f_name:"Full Name",f_phone:"Phone Number",f_wilaya:"Wilaya",f_addr:"Delivery Address",f_product:"Product",f_qty:"Quantity",sel_wilaya:"Select your wilaya",sel_product:"Select a product",submit:"Place Order",conf_title:"Order Received!",conf_msg:"Thank you! We will contact you shortly to confirm your order.",conf_back:"Back to Shop",brand_desc:"At Malvera, we believe in timeless beauty rooted in tradition. Every product is handcrafted with pure, natural ingredients — centered around the power of beef tallow — to nourish, strengthen, and restore balance to your skin, lips, and hair.",adm_login:"Admin Login",adm_email:"Email",adm_pass:"Password",adm_signin:"Sign In",adm_wrong:"Invalid credentials",adm_orders:"Orders",adm_products:"Product Stock",adm_ing:"Ingredients",adm_logout:"Logout",s_pending:"Pending",s_confirmed:"Confirmed",s_delivered:"Delivered",low_stock:"Low Stock",save:"Save",search:"Search...",c_name:"Customer",c_product:"Product",c_qty:"Qty",c_wilaya:"Wilaya",c_phone:"Phone",c_date:"Date",c_status:"Status",no_orders:"No orders yet.",threshold:"Alert (g)",stock_qty:"Stock",loading:"Loading..."},
  ar:{nav_home:"الرئيسية",nav_catalog:"المنتجات",nav_order:"اطلب الآن",hero_ctu:"اكتشفي المجموعة",hero_sub:"طبيعي. نقي. صنع بالحب.",v_natural:"طبيعي",v_handmade:"صنع يدوي",v_trad:"تراثي",v_tallow:"زبدة الشحم",cat_title:"مجموعتنا",f_all:"الكل",f_face:"الوجه",f_lip:"العناية بالشفاه",f_body:"الجسم",f_hair:"الشعر",order_btn:"اطلبي الآن",details_btn:"عرض التفاصيل",back:"→ رجوع",order_title:"أرسلي طلبك",f_name:"الاسم الكامل",f_phone:"رقم الهاتف",f_wilaya:"الولاية",f_addr:"عنوان التوصيل",f_product:"المنتج",f_qty:"الكمية",sel_wilaya:"اختاري ولايتك",sel_product:"اختاري منتجاً",submit:"إرسال الطلب",conf_title:"تم استلام طلبك!",conf_msg:"شكراً لكِ! سنتواصل معكِ قريباً لتأكيد طلبك.",conf_back:"العودة للمتجر",brand_desc:"في Malvera، نؤمن بالجمال الخالد المستوحى من الموروث. كل منتج مصنوع يدوياً من مكونات طبيعية خالصة — في قلبها شحم البقر — لتغذية بشرتكِ وشعركِ وشفاهكِ وإعادة توازنها.",adm_login:"تسجيل الدخول",adm_email:"البريد",adm_pass:"كلمة المرور",adm_signin:"دخول",adm_wrong:"بيانات غير صحيحة",adm_orders:"الطلبات",adm_products:"مخزون المنتجات",adm_ing:"المكونات",adm_logout:"خروج",s_pending:"قيد الانتظار",s_confirmed:"مؤكد",s_delivered:"تم التوصيل",low_stock:"مخزون منخفض",save:"حفظ",search:"بحث...",c_name:"العميلة",c_product:"المنتج",c_qty:"الكمية",c_wilaya:"الولاية",c_phone:"الهاتف",c_date:"التاريخ",c_status:"الحالة",no_orders:"لا توجد طلبات بعد.",threshold:"حد التنبيه",stock_qty:"الكمية",loading:"جاري التحميل..."}
};
  const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{--beige:#f5ede0;--beige2:#ede0cc;--cream:#faf6f0;--mocha:#4a3728;--mocha2:#6b4f3a;--gold:#c9a96e;--gold2:#e8c98a;--text:#2d1f14;--muted:#8a7060;--red:#c0392b;--orange:#e67e22;--white:#ffffff;--shadow:0 4px 24px rgba(74,55,40,0.10);--shadow2:0 2px 8px rgba(74,55,40,0.08);}
body{font-family:'Jost',sans-serif;background:var(--cream);color:var(--text);min-height:100vh;}
h1,h2,h3{font-family:'Cormorant Garamond',serif;}
.rtl{direction:rtl;text-align:right;}.ltr{direction:ltr;text-align:left;}
.nav{position:sticky;top:0;z-index:100;background:rgba(245,237,224,0.96);backdrop-filter:blur(12px);border-bottom:1px solid var(--beige2);display:flex;align-items:center;justify-content:space-between;padding:0 32px;height:64px;box-shadow:var(--shadow2);}
.nav-logo{font-family:'Cormorant Garamond',serif;font-size:1.7rem;font-weight:600;color:var(--mocha);letter-spacing:4px;text-transform:uppercase;cursor:pointer;}
.nav-links{display:flex;gap:24px;align-items:center;}
.nav-link{background:none;border:none;cursor:pointer;font-family:'Jost';font-size:0.78rem;letter-spacing:2px;text-transform:uppercase;color:var(--mocha2);transition:color 0.2s;}
.nav-link:hover,.nav-link.active{color:var(--gold);}
.lang-btn{background:var(--mocha);color:var(--cream);border:none;cursor:pointer;padding:6px 14px;border-radius:20px;font-size:0.75rem;font-family:'Jost';transition:background 0.2s;}
.lang-btn:hover{background:var(--mocha2);}
.hero{min-height:88vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(160deg,var(--beige) 0%,var(--cream) 50%,var(--beige2) 100%);text-align:center;padding:60px 24px;position:relative;}
.hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 70% 30%,rgba(201,169,110,0.13) 0%,transparent 60%),radial-gradient(ellipse at 20% 80%,rgba(74,55,40,0.07) 0%,transparent 50%);pointer-events:none;}
.hero-tag{font-size:0.72rem;letter-spacing:4px;text-transform:uppercase;color:var(--gold);margin-bottom:20px;}
.hero-title{font-size:clamp(3rem,8vw,6rem);font-weight:300;color:var(--mocha);line-height:1.05;margin-bottom:12px;font-style:italic;}
.hero-title span{font-style:normal;font-weight:600;}
.hero-sub{font-size:0.85rem;letter-spacing:3px;text-transform:uppercase;color:var(--muted);margin-bottom:40px;}
.hero-desc{max-width:560px;color:var(--mocha2);line-height:1.8;font-size:0.97rem;margin-bottom:44px;font-weight:300;}
.btn-primary{background:var(--mocha);color:var(--cream);border:none;cursor:pointer;padding:14px 36px;font-family:'Jost';font-size:0.78rem;letter-spacing:3px;text-transform:uppercase;border-radius:2px;transition:all 0.25s;}
.btn-primary:hover{background:var(--gold);color:var(--mocha);}
.btn-outline{background:transparent;color:var(--mocha);border:1px solid var(--mocha);cursor:pointer;padding:10px 24px;font-family:'Jost';font-size:0.75rem;letter-spacing:2px;text-transform:uppercase;border-radius:2px;transition:all 0.25s;}
.btn-outline:hover{background:var(--mocha);color:var(--cream);}
.values{display:flex;justify-content:center;flex-wrap:wrap;border-top:1px solid var(--beige2);border-bottom:1px solid var(--beige2);background:var(--white);}
.value-item{padding:28px 40px;text-align:center;border-right:1px solid var(--beige2);flex:1;min-width:160px;}
.value-item:last-child{border-right:none;}
.value-icon{font-size:1.4rem;margin-bottom:8px;}
.value-label{font-size:0.72rem;letter-spacing:2px;text-transform:uppercase;color:var(--muted);}
.catalog{padding:60px 32px;max-width:1200px;margin:0 auto;}
.section-title{font-size:2.4rem;font-weight:300;color:var(--mocha);margin-bottom:8px;font-style:italic;}
.section-line{width:48px;height:2px;background:var(--gold);margin-bottom:36px;}
.filters{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:36px;}
.filter-btn{background:none;border:1px solid var(--beige2);cursor:pointer;padding:8px 20px;font-family:'Jost';font-size:0.74rem;letter-spacing:2px;text-transform:uppercase;color:var(--muted);border-radius:20px;transition:all 0.2s;}
.filter-btn:hover,.filter-btn.active{background:var(--mocha);color:var(--cream);border-color:var(--mocha);}
.products-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:28px;}
.product-card{background:var(--white);border-radius:4px;overflow:hidden;box-shadow:var(--shadow2);transition:transform 0.25s,box-shadow 0.25s;cursor:pointer;}
.product-card:hover{transform:translateY(-4px);box-shadow:var(--shadow);}
.product-img{height:200px;background:linear-gradient(135deg,var(--beige) 0%,var(--beige2) 100%);display:flex;align-items:center;justify-content:center;font-size:3.5rem;}
.product-info{padding:20px;}
.product-cat{font-size:0.65rem;letter-spacing:2px;text-transform:uppercase;color:var(--gold);margin-bottom:6px;}
.product-name{font-size:1.15rem;font-weight:600;color:var(--mocha);margin-bottom:6px;font-family:'Cormorant Garamond';}
.product-short{font-size:0.83rem;color:var(--muted);line-height:1.6;margin-bottom:14px;}
.product-price{font-size:1rem;color:var(--mocha);font-weight:500;margin-bottom:14px;}
.product-actions{display:flex;gap:8px;}
.detail{max-width:900px;margin:0 auto;padding:40px 32px;}
.detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:start;}
.detail-img{height:380px;background:linear-gradient(135deg,var(--beige) 0%,var(--beige2) 100%);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:6rem;}
.detail-title{font-size:2.2rem;font-weight:300;color:var(--mocha);margin-bottom:8px;font-style:italic;}
.detail-price{font-size:1.3rem;color:var(--gold);font-weight:500;margin-bottom:20px;}
.detail-desc{color:var(--mocha2);line-height:1.9;font-size:0.95rem;margin-bottom:28px;font-weight:300;}
.order-page{max-width:580px;margin:0 auto;padding:48px 24px;}
.order-title{font-size:2rem;font-weight:300;font-style:italic;color:var(--mocha);margin-bottom:8px;}
.form-group{margin-bottom:20px;}
.form-label{display:block;font-size:0.72rem;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:8px;}
.form-input,.form-select{width:100%;padding:12px 16px;border:1px solid var(--beige2);border-radius:2px;font-family:'Jost';font-size:0.9rem;color:var(--text);background:var(--white);outline:none;transition:border-color 0.2s;}
.form-input:focus,.form-select:focus{border-color:var(--gold);}
.confirm{text-align:center;padding:80px 24px;}
.confirm-icon{font-size:4rem;margin-bottom:24px;}
.confirm-title{font-size:2.2rem;font-style:italic;font-weight:300;color:var(--mocha);margin-bottom:16px;}
.confirm-msg{color:var(--muted);line-height:1.8;margin-bottom:36px;}
.admin-login{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--mocha);}
.login-card{background:var(--cream);padding:48px 40px;border-radius:4px;width:100%;max-width:380px;text-align:center;}
.login-logo{font-size:2rem;letter-spacing:4px;font-weight:600;color:var(--gold);margin-bottom:8px;font-family:'Cormorant Garamond';}
.login-title{font-size:1.8rem;font-style:italic;color:var(--mocha);margin-bottom:32px;}
.admin-layout{display:flex;min-height:100vh;background:#f8f4ef;}
.admin-sidebar{width:220px;background:var(--mocha);padding:32px 0;display:flex;flex-direction:column;flex-shrink:0;}
.sidebar-logo{font-family:'Cormorant Garamond';font-size:1.3rem;letter-spacing:3px;color:var(--gold2);text-align:center;padding:0 20px 28px;border-bottom:1px solid rgba(255,255,255,0.1);margin-bottom:16px;}
.sidebar-link{background:none;border:none;cursor:pointer;width:100%;text-align:left;padding:13px 24px;font-family:'Jost';font-size:0.8rem;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,0.6);transition:all 0.2s;}
.sidebar-link:hover,.sidebar-link.active{color:var(--gold2);background:rgba(255,255,255,0.06);}
.sidebar-logout{margin-top:auto;}
.admin-main{flex:1;padding:36px 40px;overflow-y:auto;}
.admin-title{font-size:1.8rem;font-style:italic;color:var(--mocha);margin-bottom:24px;}
.admin-card{background:var(--white);border-radius:4px;padding:24px;margin-bottom:20px;box-shadow:var(--shadow2);}
table{width:100%;border-collapse:collapse;}
th{font-size:0.68rem;letter-spacing:2px;text-transform:uppercase;color:var(--muted);padding:10px 14px;text-align:left;border-bottom:1px solid var(--beige2);}
td{padding:12px 14px;font-size:0.87rem;border-bottom:1px solid var(--beige2);color:var(--text);vertical-align:middle;}
tr:last-child td{border-bottom:none;}
tr.low{background:#fff5f0;}
.badge{display:inline-block;padding:3px 10px;border-radius:10px;font-size:0.7rem;letter-spacing:1px;text-transform:uppercase;font-weight:500;}
.badge-pending{background:#fef3cd;color:#856404;}
.badge-confirmed{background:#d1edff;color:#0a5a8a;}
.badge-delivered{background:#d4edda;color:#155724;}
.badge-low{background:#fde8e8;color:var(--red);}
.badge-ok{background:#d4edda;color:#155724;}
.status-select{padding:4px 8px;border:1px solid var(--beige2);border-radius:3px;font-size:0.8rem;font-family:'Jost';background:var(--white);cursor:pointer;}
.qty-input{width:80px;padding:4px 8px;border:1px solid var(--beige2);border-radius:3px;font-size:0.85rem;font-family:'Jost';}
.btn-save{background:var(--mocha);color:var(--white);border:none;cursor:pointer;padding:5px 14px;border-radius:3px;font-size:0.75rem;font-family:'Jost';transition:background 0.2s;}
.btn-save:hover{background:var(--gold);color:var(--mocha);}
.search-bar{display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;}
.search-input{flex:1;min-width:200px;padding:9px 16px;border:1px solid var(--beige2);border-radius:2px;font-family:'Jost';font-size:0.87rem;outline:none;}
.search-input:focus{border-color:var(--gold);}
.select-filter{padding:9px 14px;border:1px solid var(--beige2);border-radius:2px;font-family:'Jost';font-size:0.85rem;background:var(--white);cursor:pointer;}
.ing-cat{font-size:0.7rem;letter-spacing:2px;text-transform:uppercase;color:var(--gold);padding:16px 14px 6px;}
.stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:16px;margin-bottom:28px;}
.stat-card{background:var(--white);border-radius:4px;padding:20px;text-align:center;box-shadow:var(--shadow2);}
.stat-num{font-size:2rem;font-family:'Cormorant Garamond';color:var(--mocha);font-weight:600;}
.stat-label{font-size:0.68rem;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-top:4px;}
.back-btn{background:none;border:none;cursor:pointer;font-family:'Jost';font-size:0.78rem;letter-spacing:1px;color:var(--muted);margin-bottom:24px;display:inline-flex;align-items:center;gap:6px;transition:color 0.2s;}
.back-btn:hover{color:var(--mocha);}
.loader{display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;gap:16px;}
@media(max-width:768px){
  .nav{padding:0 16px;}.nav-links{gap:14px;}.detail-grid{grid-template-columns:1fr;}
  .admin-sidebar{width:56px;}.sidebar-logo,.sidebar-link span{display:none;}.sidebar-link{text-align:center;padding:14px;}
  .admin-main{padding:20px 16px;}.catalog{padding:40px 16px;}
  .products-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;}
  .values{flex-direction:column;}.value-item{border-right:none;border-bottom:1px solid var(--beige2);}
}
`;

export default function App() {
  const [lang, setLang] = useState("en");
  const [page, setPage] = useState("home");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [preselected, setPreselected] = useState(null);
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminTab, setAdminTab] = useState("orders");
  const [loading, setLoading] = useState(true);
  const T = TR[lang];

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [p, i, o] = await Promise.all([
        sb("products?order=id"),
        sb("ingredients?order=id"),
        sb("orders?order=created_at.desc"),
      ]);
      setProducts(p); setIngredients(i); setOrders(o);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const handleOrder = async (data) => {
    try {
      const inserted = await sb("orders", { method:"POST", body: JSON.stringify({ name:data.name, phone:data.phone, wilaya:data.wilaya, address:data.address, product_name:data.productName, product_id:data.productId, qty:data.qty, status:"pending" }) });
      const prod = products.find(p => p.id === data.productId);
      if (prod) {
        const newStock = Math.max(0, prod.stock - data.qty);
        await sb(`products?id=eq.${prod.id}`, { method:"PATCH", body: JSON.stringify({ stock: newStock }) });
        setProducts(prev => prev.map(p => p.id === prod.id ? {...p, stock: newStock} : p));
      }
      if (inserted[0]) setOrders(prev => [inserted[0], ...prev]);
      setPage("confirm");
    } catch(e) { console.error(e); }
  };

  const updateOrderStatus = async (id, status) => {
    await sb(`orders?id=eq.${id}`, { method:"PATCH", body: JSON.stringify({ status }) });
    setOrders(prev => prev.map(o => o.id===id ? {...o,status} : o));
  };
  const updateProductStock = async (id, stock) => {
    await sb(`products?id=eq.${id}`, { method:"PATCH", body: JSON.stringify({ stock: Number(stock) }) });
    setProducts(prev => prev.map(p => p.id===id ? {...p,stock:Number(stock)} : p));
  };
  const updateProductThreshold = async (id, threshold) => {
    await sb(`products?id=eq.${id}`, { method:"PATCH", body: JSON.stringify({ threshold: Number(threshold) }) });
    setProducts(prev => prev.map(p => p.id===id ? {...p,threshold:Number(threshold)} : p));
  };
  const updateProductPrice = async (id, price) => {
    await sb(`products?id=eq.${id}`, { method:"PATCH", body: JSON.stringify({ price }) });
    setProducts(prev => prev.map(p => p.id===id ? {...p,price} : p));
  };
  const updateProductDiscount = async (id, discount_price) => {
    await sb(`products?id=eq.${id}`, { method:"PATCH", body: JSON.stringify({ discount_price: discount_price||null }) });
    setProducts(prev => prev.map(p => p.id===id ? {...p,discount_price:discount_price||null} : p));
  };
  const updateIngQty = async (id, qty) => {
    await sb(`ingredients?id=eq.${id}`, { method:"PATCH", body: JSON.stringify({ qty: Number(qty) }) });
    setIngredients(prev => prev.map(i => i.id===id ? {...i,qty:Number(qty)} : i));
  };
  const updateIngThreshold = async (id, threshold) => {
    await sb(`ingredients?id=eq.${id}`, { method:"PATCH", body: JSON.stringify({ threshold: Number(threshold) }) });
    setIngredients(prev => prev.map(i => i.id===id ? {...i,threshold:Number(threshold)} : i));
  };

  if (loading) return (
    <>
      <style>{CSS}</style>
      <div className="loader">
        <div style={{fontFamily:"Cormorant Garamond",fontSize:"2.5rem",color:"var(--mocha)",letterSpacing:"6px"}}>MALVERA</div>
        <div style={{color:"var(--muted)",fontSize:"0.8rem",letterSpacing:"3px"}}>{T.loading}</div>
      </div>
    </>
  );

  return (
    <>
      <style>{CSS}</style>
      {page==="admin-login" && <AdminLogin T={T} onLogin={()=>{setIsAdmin(true);setPage("admin");}} onBack={()=>setPage("home")} />}
      {page==="admin" && isAdmin && (
        <AdminDashboard T={T} tab={adminTab} setTab={setAdminTab} orders={orders} products={products} ingredients={ingredients}
          onUpdateOrderStatus={updateOrderStatus} onUpdateProductStock={updateProductStock} onUpdateProductThreshold={updateProductThreshold}
          onUpdateIngQty={updateIngQty} onUpdateIngThreshold={updateIngThreshold}
          onUpdateProductPrice={updateProductPrice} onUpdateProductDiscount={updateProductDiscount}
          onLogout={()=>{setIsAdmin(false);setPage("home");}} />
      )}
      {!["admin-login","admin"].includes(page) && (
        <div className={lang==="ar"?"rtl":"ltr"}>
          <nav className="nav">
            <div className="nav-logo" onClick={()=>setPage("home")}>MALVERA</div>
            <div className="nav-links">
              {[["home",T.nav_home],["catalog",T.nav_catalog],["order",T.nav_order]].map(([p,l])=>(
                <button key={p} className={`nav-link ${page===p?"active":""}`} onClick={()=>setPage(p)}>{l}</button>
              ))}
              <button className="lang-btn" onClick={()=>setLang(lang==="en"?"ar":"en")}>{lang==="en"?"عربي":"EN"}</button>
            </div>
          </nav>
          {page==="home" && (
            <>
              <section className="hero">
                <div className="hero-tag">✦ Natural Cosmetics ✦</div>
                <h1 className="hero-title"><span>Malvera</span></h1>
                <p className="hero-sub">{T.hero_sub}</p>
                <p className="hero-desc">{T.brand_desc}</p>
                <button className="btn-primary" onClick={()=>setPage("catalog")}>{T.hero_cta}</button>
              </section>
              <div className="values">
                {[["🌿",T.v_natural],["🤲",T.v_handmade],["📿",T.v_trad],["🥩",T.v_tallow]].map(([icon,label])=>(
                  <div key={label} className="value-item"><div className="value-icon">{icon}</div><div className="value-label">{label}</div></div>
                ))}
              </div>
            </>
          )}
          {page==="catalog" && (
            <CatalogPage T={T} lang={lang} products={products}
              onOrder={p=>{setPreselected(p);setPage("order");}}
              onDetail={p=>{setSelectedProduct(p);setPage("detail");}} />
          )}
          {page==="detail" && selectedProduct && (
            <div className="detail" style={{paddingTop:48}}>
              <button className="back-btn" onClick={()=>setPage("catalog")}>{T.back}</button>
              <div className="detail-grid">
                <div className="detail-img">{EMOJIS[selectedProduct.id]||"🌿"}</div>
                <div>
                  <div className="product-cat">{selectedProduct.category}</div>
                  <h2 className="detail-title">{selectedProduct.name}</h2>
                  <div className="detail-price"><PriceDisplay price={selectedProduct.price} discount_price={selectedProduct.discount_price} /></div>
                  <p className="detail-desc">{selectedProduct.full_desc}</p>
                  <button className="btn-primary" onClick={()=>{setPreselected(selectedProduct);setPage("order");}}>{T.order_btn}</button>
                </div>
              </div>
            </div>
          )}
          {page==="order" && (
            <OrderPage T={T} products={products} preselected={preselected} onSubmit={handleOrder} onBack={()=>setPage("catalog")} />
          )}
          {page==="confirm" && (
            <div className="confirm">
              <div className="confirm-icon">✨</div>
              <h2 className="confirm-title">{T.conf_title}</h2>
              <p className="confirm-msg">{T.conf_msg}</p>
              <button className="btn-primary" onClick={()=>{setPage("home");setPreselected(null);}}>{T.conf_back}</button>
            </div>
          )}
          <footer style={{background:"var(--mocha)",color:"rgba(255,255,255,0.5)",textAlign:"center",padding:"28px 24px",fontSize:"0.75rem",letterSpacing:"1px",marginTop:60}}>
            <div style={{fontFamily:"Cormorant Garamond",fontSize:"1.1rem",color:"var(--gold2)",letterSpacing:"4px",marginBottom:8}}>MALVERA</div>
            <div>Natural Cosmetics · Handcrafted with Love</div>
            <div onClick={()=>setPage("admin-login")} style={{marginTop:8,height:20,cursor:"default"}} />
          </footer>
        </div>
      )}
    </>
  );
}

function CatalogPage({ T, lang, products, onOrder, onDetail }) {
  const [activeFilter, setActiveFilter] = useState("all");
  const filters = [{key:"all",label:T.f_all},{key:"face",label:T.f_face},{key:"lip",label:T.f_lip},{key:"body",label:T.f_body},{key:"hair",label:T.f_hair}];
  const filtered = activeFilter==="all" ? products : products.filter(p=>p.category?.includes(activeFilter));
  return (
    <div className="catalog">
      <h2 className="section-title">{T.cat_title}</h2>
      <div className="section-line" />
      <div className="filters">
        {filters.map(f=><button key={f.key} className={`filter-btn ${activeFilter===f.key?"active":""}`} onClick={()=>setActiveFilter(f.key)}>{f.label}</button>)}
      </div>
      <div className="products-grid">
        {filtered.map(p=>(
          <div key={p.id} className="product-card" onClick={()=>onDetail(p)}>
            <div className="product-img">{EMOJIS[p.id]||"🌿"}</div>
            <div className="product-info">
              <div className="product-cat">{p.category?.split(",").map(c=>CAT_LABELS[c.trim()]?.[lang]).filter(Boolean).join(" · ")}</div>
              <div className="product-name">{p.name}</div>
              <div className="product-short">{p.short_desc}</div>
              <div className="product-price"><PriceDisplay price={p.price} discount_price={p.discount_price} /></div>
              <div className="product-actions" onClick={e=>e.stopPropagation()}>
                <button className="btn-primary" style={{padding:"8px 16px",fontSize:"0.72rem"}} onClick={()=>onOrder(p)}>{T.order_btn}</button>
                <button className="btn-outline" style={{padding:"8px 14px",fontSize:"0.72rem"}} onClick={()=>onDetail(p)}>{T.details_btn}</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderPage({ T, products, preselected, onSubmit, onBack }) {
  const [form, setForm] = useState({name:"",phone:"",wilaya:"",address:"",productId:preselected?.id||"",qty:1});
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const handle = () => {
    if (!form.name||!form.phone||!form.wilaya||!form.address||!form.productId) return;
    const prod = products.find(p=>p.id===Number(form.productId));
    onSubmit({...form, productId:Number(form.productId), productName:prod?.name, qty:Number(form.qty)});
  };
  return (
    <div className="order-page">
      <button className="back-btn" onClick={onBack}>{T.back}</button>
      <h2 className="order-title">{T.order_title}</h2>
      <div className="section-line" style={{marginBottom:32}} />
      {[["name",T.f_name,"text"],["phone",T.f_phone,"tel"],["address",T.f_addr,"text"]].map(([k,l,type])=>(
        <div className="form-group" key={k}>
          <label className="form-label">{l} *</label>
          <input className="form-input" type={type} value={form[k]} onChange={e=>set(k,e.target.value)} />
        </div>
      ))}
      <div className="form-group">
        <label className="form-label">{T.f_wilaya} *</label>
        <select className="form-select" value={form.wilaya} onChange={e=>set("wilaya",e.target.value)}>
          <option value="">{T.sel_wilaya}</option>
          {WILAYAS.map(w=><option key={w} value={w}>{w}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">{T.f_product} *</label>
        <select className="form-select" value={form.productId} onChange={e=>set("productId",e.target.value)}>
          <option value="">{T.sel_product}</option>
          {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">{T.f_qty}</label>
        <input className="form-input" type="number" min="1" style={{width:100}} value={form.qty} onChange={e=>set("qty",e.target.value)} />
      </div>
      <button className="btn-primary" style={{width:"100%",padding:15}} onClick={handle}>{T.submit}</button>
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
    const result = await sbAuth(email, pass);
    setLoading(false);
    if (result.success) onLogin(result.token);
    else setErr(true);
  };
  return (
    <div className="admin-login">
      <div className="login-card">
        <div className="login-logo">MALVERA</div>
        <h2 className="login-title">{T.adm_login}</h2>
        <div className="form-group">
          <label className="form-label">{T.adm_email}</label>
          <input className="form-input" type="email" value={email} onChange={e=>{setEmail(e.target.value);setErr(false);}} />
        </div>
        <div className="form-group">
          <label className="form-label">{T.adm_pass}</label>
          <input className="form-input" type="password" value={pass} onChange={e=>{setPass(e.target.value);setErr(false);}} onKeyDown={e=>e.key==="Enter"&&handle()} />
        </div>
        {err && <p style={{color:"var(--red)",fontSize:"0.8rem",marginBottom:12}}>{T.adm_wrong}</p>}
        <button className="btn-primary" style={{width:"100%",padding:14,marginBottom:12}} onClick={handle} disabled={loading}>{loading ? "..." : T.adm_signin}</button>
        <button className="btn-outline" style={{width:"100%",padding:10}} onClick={onBack}>{T.back}</button>
      </div>
    </div>
  );
}

function AdminDashboard({ T, tab, setTab, orders, products, ingredients, onUpdateOrderStatus, onUpdateProductStock, onUpdateProductThreshold, onUpdateIngQty, onUpdateIngThreshold, onUpdateProductPrice, onUpdateProductDiscount, onLogout }) {
  const lowP = products.filter(p=>p.stock<=p.threshold).length;
  const lowI = ingredients.filter(i=>i.threshold>0&&i.qty<=i.threshold).length;
  const tabs = [{key:"orders",label:T.adm_orders,icon:"📋"},{key:"products",label:T.adm_products,icon:"📦"},{key:"ingredients",label:T.adm_ing,icon:"🧪"}];
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-logo">MALVERA</div>
        {tabs.map(tb=>(
          <button key={tb.key} className={`sidebar-link ${tab===tb.key?"active":""}`} onClick={()=>setTab(tb.key)}>
            {tb.icon} <span>{tb.label}</span>
          </button>
        ))}
        <button className="sidebar-link sidebar-logout" onClick={onLogout}>🚪 <span>{T.adm_logout}</span></button>
      </aside>
      <main className="admin-main">
        <h2 className="admin-title">{tabs.find(tb=>tb.key===tab)?.label}</h2>
        <div className="stat-grid">
          <div className="stat-card"><div className="stat-num">{orders.length}</div><div className="stat-label">Total Orders</div></div>
          <div className="stat-card"><div className="stat-num" style={{color:"var(--orange)"}}>{orders.filter(o=>o.status==="pending").length}</div><div className="stat-label">Pending</div></div>
          <div className="stat-card"><div className="stat-num" style={{color:"var(--red)"}}>{lowP}</div><div className="stat-label">Low Products</div></div>
          <div className="stat-card"><div className="stat-num" style={{color:"var(--red)"}}>{lowI}</div><div className="stat-label">Low Ingredients</div></div>
        </div>
        {tab==="orders" && <OrdersTab T={T} orders={orders} onUpdateStatus={onUpdateOrderStatus} />}
        {tab==="products" && <ProductsTab T={T} products={products} onUpdateStock={onUpdateProductStock} onUpdateThreshold={onUpdateProductThreshold} onUpdatePrice={onUpdateProductPrice} onUpdateDiscount={onUpdateProductDiscount} />}
        {tab==="ingredients" && <IngredientsTab T={T} ingredients={ingredients} onUpdateQty={onUpdateIngQty} onUpdateThreshold={onUpdateIngThreshold} />}
      </main>
    </div>
  );
}

function OrdersTab({ T, orders, onUpdateStatus }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterWilaya, setFilterWilaya] = useState("all");
  const filtered = orders.filter(o=>
    (filterStatus==="all"||o.status===filterStatus)&&
    (filterWilaya==="all"||o.wilaya===filterWilaya)&&
    (o.name?.toLowerCase().includes(search.toLowerCase())||o.product_name?.toLowerCase().includes(search.toLowerCase()))
  );
  const wilayas = [...new Set(orders.map(o=>o.wilaya).filter(Boolean))];
  return (
    <div className="admin-card">
      <div className="search-bar">
        <input className="search-input" placeholder={T.search} value={search} onChange={e=>setSearch(e.target.value)} />
        <select className="select-filter" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="pending">{T.s_pending}</option>
          <option value="confirmed">{T.s_confirmed}</option>
          <option value="delivered">{T.s_delivered}</option>
        </select>
        <select className="select-filter" value={filterWilaya} onChange={e=>setFilterWilaya(e.target.value)}>
          <option value="all">All Wilayas</option>
          {wilayas.map(w=><option key={w} value={w}>{w}</option>)}
        </select>
      </div>
      {filtered.length===0 ? <p style={{color:"var(--muted)",padding:"20px 0"}}>{T.no_orders}</p> : (
        <div style={{overflowX:"auto"}}>
          <table>
            <thead><tr><th>{T.c_name}</th><th>{T.c_product}</th><th>{T.c_qty}</th><th>{T.c_wilaya}</th><th>{T.c_phone}</th><th>{T.c_date}</th><th>{T.c_status}</th></tr></thead>
            <tbody>
              {filtered.map(o=>(
                <tr key={o.id}>
                  <td><strong>{o.name}</strong><br/><span style={{fontSize:"0.75rem",color:"var(--muted)"}}>{o.address}</span></td>
                  <td>{o.product_name}</td><td>{o.qty}</td><td>{o.wilaya}</td><td>{o.phone}</td>
                  <td style={{fontSize:"0.8rem",color:"var(--muted)"}}>{new Date(o.created_at).toLocaleString()}</td>
                  <td>
                    <select className="status-select" value={o.status} onChange={e=>onUpdateStatus(o.id,e.target.value)}>
                      <option value="pending">{T.s_pending}</option>
                      <option value="confirmed">{T.s_confirmed}</option>
                      <option value="delivered">{T.s_delivered}</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ProductsTab({ T, products, onUpdateStock, onUpdateThreshold, onUpdatePrice, onUpdateDiscount }) {
  const [edits, setEdits] = useState({});
  const setEdit = (id,field,val) => setEdits(e=>({...e,[id]:{...e[id],[field]:val}}));
  const save = (p) => {
    if (edits[p.id]?.stock!==undefined) onUpdateStock(p.id, edits[p.id].stock);
    if (edits[p.id]?.threshold!==undefined) onUpdateThreshold(p.id, edits[p.id].threshold);
    if (edits[p.id]?.price!==undefined) onUpdatePrice(p.id, edits[p.id].price);
    if (edits[p.id]?.discount_price!==undefined) onUpdateDiscount(p.id, edits[p.id].discount_price);
    setEdits(e=>{const n={...e};delete n[p.id];return n;});
  };
  return (
    <div className="admin-card">
      <div style={{overflowX:"auto"}}>
        <table>
          <thead><tr><th>Product</th><th>{T.stock_qty}</th><th>{T.threshold}</th><th>Price</th><th>Discount Price</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {products.map(p=>{
              const isLow=p.stock<=p.threshold;
              const sv=edits[p.id]?.stock??p.stock;
              const tv=edits[p.id]?.threshold??p.threshold;
              const pv=edits[p.id]?.price??p.price??'';
              const dv=edits[p.id]?.discount_price??p.discount_price??'';
              return (
                <tr key={p.id} className={isLow?"low":""}>
                  <td><span style={{marginRight:8}}>{EMOJIS[p.id]||"🌿"}</span>{p.name}</td>
                  <td><input className="qty-input" type="number" min="0" value={sv} onChange={e=>setEdit(p.id,"stock",e.target.value)} onKeyDown={e=>e.key==="Enter"&&save(p)} /></td>
                  <td><input className="qty-input" type="number" min="0" value={tv} onChange={e=>setEdit(p.id,"threshold",e.target.value)} onKeyDown={e=>e.key==="Enter"&&save(p)} /></td>
                  <td><input className="qty-input" style={{width:90}} type="text" placeholder="e.g. 1200 DA" value={pv} onChange={e=>setEdit(p.id,"price",e.target.value)} onKeyDown={e=>e.key==="Enter"&&save(p)} /></td>
                  <td><input className="qty-input" style={{width:90}} type="text" placeholder="Leave empty" value={dv} onChange={e=>setEdit(p.id,"discount_price",e.target.value)} onKeyDown={e=>e.key==="Enter"&&save(p)} /></td>
                  <td>{isLow?<span className="badge badge-low">{T.low_stock}</span>:<span className="badge badge-ok">OK</span>}</td>
                  <td><button className="btn-save" onClick={()=>save(p)}>{T.save}</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function IngredientsTab({ T, ingredients, onUpdateQty, onUpdateThreshold }) {
  const [edits, setEdits] = useState({});
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const setEdit = (id,field,val) => setEdits(e=>({...e,[id]:{...e[id],[field]:val}}));
  const save = (ing) => {
    if (edits[ing.id]?.qty!==undefined) onUpdateQty(ing.id, edits[ing.id].qty);
    if (edits[ing.id]?.threshold!==undefined) onUpdateThreshold(ing.id, edits[ing.id].threshold);
    setEdits(e=>{const n={...e};delete n[ing.id];return n;});
  };
  const cats = [...new Set(ingredients.map(i=>i.category))];
  const filtered = ingredients.filter(i=>(filterCat==="all"||i.category===filterCat)&&i.name.toLowerCase().includes(search.toLowerCase()));
  const grouped = cats.reduce((acc,cat)=>{const items=filtered.filter(i=>i.category===cat);if(items.length)acc[cat]=items;return acc;},{});
  return (
    <div className="admin-card">
      <div className="search-bar">
        <input className="search-input" placeholder={T.search} value={search} onChange={e=>setSearch(e.target.value)} />
        <select className="select-filter" value={filterCat} onChange={e=>setFilterCat(e.target.value)}>
          <option value="all">All Categories</option>
          {cats.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div style={{overflowX:"auto"}}>
        <table>
          <thead><tr><th>Ingredient</th><th>Qty (g)</th><th>{T.threshold}</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {Object.entries(grouped).map(([cat,items])=>(
              <>
                <tr key={cat}><td colSpan={5} className="ing-cat">{cat}</td></tr>
                {items.map(ing=>{
                  const isLow=ing.threshold>0&&ing.qty<=ing.threshold;
                  const qv=edits[ing.id]?.qty??ing.qty;
                  const tv=edits[ing.id]?.threshold??ing.threshold;
                  return (
                    <tr key={ing.id} className={isLow?"low":""}>
                      <td>{ing.name}</td>
                      <td><input className="qty-input" type="number" min="0" value={qv} onChange={e=>setEdit(ing.id,"qty",e.target.value)} onKeyDown={e=>e.key==="Enter"&&save(ing)} /></td>
                      <td><input className="qty-input" type="number" min="0" value={tv} onChange={e=>setEdit(ing.id,"threshold",e.target.value)} onKeyDown={e=>e.key==="Enter"&&save(ing)} /></td>
                      <td>{isLow?<span className="badge badge-low">{T.low_stock}</span>:<span className="badge badge-ok">OK</span>}</td>
                      <td><button className="btn-save" onClick={()=>save(ing)}>{T.save}</button></td>
                    </tr>
                  );
                })}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
