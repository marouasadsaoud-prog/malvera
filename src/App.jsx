import { useState, useEffect, useRef, Fragment } from "react";

const SUPABASE_URL = "https://oknqxjijpebnyogcpeee.supabase.co";
const SUPABASE_KEY = "sb_publishable_f2GocL92eVimF-c3ugdnGQ_izZygETk";

// Your contact details (shown to customers after they order)
const CONTACT_PHONE = "0541913440";
const CONTACT_INSTAGRAM = "malveraofficial";
const CONTACT_EMAIL = "malveraofficiel@gmail.com";

const sb = async (path, opts = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  if (!res.ok) { console.error(text); throw new Error(text); }
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

const uploadPhoto = async (file, productId) => {
  const ext = file.name.split(".").pop();
  const path = `product-${productId}-${Date.now()}.${ext}`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/products/${path}`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/products/${path}`;
};

const toNum = (v) => parseInt(String(v ?? "").replace(/[^\d]/g, ""), 10) || 0;
const money = (n) => `${Number(n || 0).toLocaleString("en-US")} DA`;
const unitPrice = (p) => toNum(p.discount_price) || toNum(p.price);
const getFee = (delivery, wilaya, type) => {
  const row = delivery.find((d) => d.wilaya === wilaya);
  if (!row) return null;
  return Number(type === "stopdesk" ? row.stopdesk : row.home);
};

const WILAYAS = ["Adrar","Chlef","Laghouat","Oum El Bouaghi","Batna","Béjaïa","Biskra","Béchar","Blida","Bouira","Tamanrasset","Tébessa","Tlemcen","Tiaret","Tizi Ouzou","Alger","Djelfa","Jijel","Sétif","Saïda","Skikda","Sidi Bel Abbès","Annaba","Guelma","Constantine","Médéa","Mostaganem","M'Sila","Mascara","Ouargla","Oran","El Bayadh","Illizi","Bordj Bou Arréridj","Boumerdès","El Tarf","Tindouf","Tissemsilt","El Oued","Khenchela","Souk Ahras","Tipaza","Mila","Aïn Defla","Naâma","Aïn Témouchent","Ghardaïa","Relizane","Timimoun","Bordj Badji Mokhtar","Ouled Djellal","Béni Abbès","In Salah","In Guezzam","Touggourt","Djanet","El M'Ghair","El Meniaa"];

const ANDERSON_STOPDESKS = {
  "Adrar":[{name:"Station Adrar",maps:"https://maps.app.goo.gl/e5kwRmwmo67GEwJ86"}],
  "Chlef":[{name:"Station Chlef",maps:"https://maps.app.goo.gl/VTna2gw3i6KRQ9pD8"},{name:"Station Chlef Ténès",maps:""}],
  "Laghouat":[{name:"Station Laghouat",maps:"https://maps.app.goo.gl/c6om88PyezNU3vmu9"},{name:"Station Laghouat New",maps:"https://maps.app.goo.gl/svydvVAmEqXkm8rh8"},{name:"Station Laghouat Aflou",maps:"https://maps.app.goo.gl/eCAEDjKLhXNzW9fq9"}],
  "Oum El Bouaghi":[{name:"Station Oum El Bouaghi",maps:"https://maps.app.goo.gl/Za6dHPyzm6PH7uVL6"},{name:"Station Ain Fekroune",maps:"https://maps.app.goo.gl/JC1oRpVBQoaKVmrw7"},{name:"Station Ain M'Lila",maps:"https://maps.app.goo.gl/u4we5hCSTRjCUCXQ9"}],
  "Batna":[{name:"Station Batna",maps:"https://maps.app.goo.gl/KxRNJQ535AwAwXJq8"},{name:"Station Batna Cité El Amrani",maps:"https://maps.app.goo.gl/WmCjZ7vRsJaTEZT98"}],
  "Béjaïa":[{name:"Station Béjaïa",maps:"https://maps.app.goo.gl/oQh2eGmLEndBmzko7"},{name:"Station Béjaïa Akbou",maps:"https://maps.app.goo.gl/y2GjkFvx9CVChDRD6"},{name:"Station Béjaïa El Kseur",maps:"https://maps.app.goo.gl/yrZst9s8W6jxQkdE9"}],
  "Biskra":[{name:"Station Biskra",maps:"https://maps.app.goo.gl/Zb8mzZEVf2wRPDK3A"}],
  "Béchar":[{name:"Station Béchar",maps:"https://maps.app.goo.gl/jWbpQpHJSbKYwimD9"}],
  "Blida":[{name:"Station Blida",maps:"https://maps.app.goo.gl/9UkBYddSCQkHGWob9"},{name:"Station Blida Boufarik",maps:"https://maps.app.goo.gl/zzBXZtyxBhUPxpvT8"},{name:"Station Blida El Affroune",maps:"https://maps.app.goo.gl/aoRXgowQryxe5Tg7"}],
  "Bouira":[{name:"Station Bouira",maps:"https://maps.app.goo.gl/qiVHrJrei1jjaawF8"},{name:"Station Bouira Lakhdaria",maps:"https://maps.app.goo.gl/ciDiJvGR3RjppkNs6"}],
  "Tamanrasset":[{name:"Station Tamanrasset",maps:"https://maps.app.goo.gl/9GoNzzXyLVLH6cz16"}],
  "Tébessa":[{name:"Station Tébessa",maps:"https://maps.app.goo.gl/kFAD3nWmZoRYEAm4A"},{name:"Station Tébessa New",maps:"https://maps.app.goo.gl/EgBieZUDQ12Nme5f8"}],
  "Tlemcen":[{name:"Station Tlemcen",maps:"https://maps.app.goo.gl/GGiswKszmE6bYzPQ9"},{name:"Station Maghnia",maps:"https://maps.app.goo.gl/iLdsZBsi6ZbL2KA76"}],
  "Tiaret":[{name:"Station Tiaret",maps:"https://maps.app.goo.gl/mvNVfxXqY8xr4xj49"}],
  "Tizi Ouzou":[{name:"Station Tizi Ouzou",maps:"https://maps.app.goo.gl/pCLrZaFtCznWWqf29"},{name:"Station Tizi Ouzou Azazga",maps:"https://maps.app.goo.gl/3BJ39ZeumQEhKhMa9"},{name:"Station Tizi Ouzou Nouvelle Ville",maps:"https://maps.app.goo.gl/v4Ts8yjjcbEo2Zjh7"},{name:"Station Tizi Ouzou Boughni",maps:"https://maps.app.goo.gl/ZYUdaJLdGG1Gp4Hw7"}],
  "Alger":[{name:"Station Alger Chéraga",maps:"https://maps.app.goo.gl/jD53QqkD2wVU93jy7"},{name:"Station Alger Oued Smar",maps:"https://maps.app.goo.gl/8S9qyX46kn4hNNw97"},{name:"Station Alger Réghaïa",maps:"https://maps.app.goo.gl/kE4THbSgakgCQGHb8"},{name:"Station Alger Sacré Coeur",maps:"https://maps.app.goo.gl/NUBmFMNwPmxqsQfV6"},{name:"Station Alger Bab El Oued",maps:"https://maps.app.goo.gl/SxBsbZvt8VXe2t5S8"},{name:"Station Alger Aïn Benian",maps:"https://maps.app.goo.gl/PQgSKgTkWpPZTLzr7"},{name:"Station Alger Draria",maps:"https://maps.app.goo.gl/CQR9SqvnccWbKyB97"},{name:"Station Alger Alger Plage",maps:"https://maps.app.goo.gl/im6hVErQy6TEeorz8"},{name:"Station Alger Eucalyptus",maps:"https://maps.app.goo.gl/iCY3WvRU9pWgjkTy6"},{name:"Station Alger Dely Ibrahim",maps:"https://maps.app.goo.gl/LH7GSFidDz3RrosX6"},{name:"Station Alger Aïn Naâdja",maps:"https://maps.app.goo.gl/tRkiACfNVFVt5ueT9"},{name:"Station Alger Rouiba",maps:"https://maps.app.goo.gl/DDDCtGYrbu1pyLPLA"},{name:"Station Alger Sidi Abdellah",maps:"https://maps.app.goo.gl/hn6bMCBZ35TGY9zMA"},{name:"Station Alger Beb Ezouar",maps:"https://maps.app.goo.gl/V9a9ke24BxYvpkvRA"},{name:"Station Alger Kouba",maps:"https://maps.app.goo.gl/wKz2utPian7uNTht9"}],
  "Djelfa":[{name:"Station Djelfa",maps:"https://maps.app.goo.gl/9C4QwgaSttFA2T7c6"},{name:"Station Djelfa Aïn Oussera",maps:"https://maps.app.goo.gl/yZXrbDdeaBojzH8D8"}],
  "Jijel":[{name:"Station Jijel",maps:"https://maps.app.goo.gl/nQQBBrmDYRvAvfMn9"}],
  "Sétif":[{name:"Station Sétif El Eulma",maps:"https://maps.app.goo.gl/ypgZ6TUDJxv7JWqY8"},{name:"Station Sétif El Hidab",maps:"https://maps.app.goo.gl/ArWGww1kgkYGUG5P6"},{name:"Station Sétif Aïn Oulmene",maps:"https://maps.app.goo.gl/2KVYz5joqYJnHaQw5"},{name:"Station Sétif Aïn Azal",maps:"https://maps.app.goo.gl/u56u2t78Soaninqy7"},{name:"Station Sétif Cité Bouaraoua",maps:""}],
  "Saïda":[{name:"Station Saïda",maps:"https://maps.app.goo.gl/6uHbvmbbego1oVfo6"}],
  "Skikda":[{name:"Station Skikda",maps:"https://maps.app.goo.gl/4xFfbBhoor9VSnkc6"}],
  "Sidi Bel Abbès":[{name:"Station Sidi Bel Abbès",maps:"https://maps.app.goo.gl/xdU9XHedRHnPCRju5"},{name:"Station Sidi Bel Abbès Télagh",maps:"https://maps.app.goo.gl/NTZ1MKXD64emjDYy6"}],
  "Annaba":[{name:"Station Annaba",maps:"https://maps.app.goo.gl/pHxuUpMnmLoMKqd68"},{name:"Station Annaba El Bouni",maps:"https://maps.app.goo.gl/gre9Drp5j1uvEgN3A"}],
  "Guelma":[{name:"Station Guelma",maps:"https://maps.app.goo.gl/tTSeEUoca62gQi9P9"}],
  "Constantine":[{name:"Station Constantine Ali Mendjeli",maps:"https://maps.app.goo.gl/49EkZL8DXf4UqzsP6"},{name:"Station Constantine Sidi Mebrouk",maps:"https://maps.app.goo.gl/MFQ82RvRQkzPVdWy9"}],
  "Médéa":[{name:"Station Médéa",maps:"https://maps.app.goo.gl/dLxeUKbUFYkw9PCX7"}],
  "Mostaganem":[{name:"Station Mostaganem",maps:"https://maps.app.goo.gl/ZS9zvoWn9vAD8U9r9"},{name:"Station Mostaganem 2",maps:"https://maps.app.goo.gl/P4fkjFt8vW3bp1bM8"}],
  "M'Sila":[{name:"Station M'Sila",maps:""},{name:"Station M'Sila New",maps:"https://maps.app.goo.gl/dMK6rNSSYqpq5gJu8"},{name:"Station Bousaâda",maps:"https://maps.app.goo.gl/er7ddvJNfw3GpCQw7"}],
  "Mascara":[{name:"Station Mascara",maps:"https://maps.app.goo.gl/Z24XWCbV2oANCVbq7"},{name:"Station Mascara Sig",maps:"https://maps.app.goo.gl/3BMsU1np9t2BtYBo8"}],
  "Ouargla":[{name:"Station Ouargla",maps:"https://maps.app.goo.gl/3cMpoffssfm31eiz8"},{name:"Station Ouargla Hassi Messaoud",maps:"https://maps.app.goo.gl/1ujEcDGbz6UB55Zv8"}],
  "Oran":[{name:"Station Oran Gambetta",maps:"https://maps.app.goo.gl/KFxhRwMhhNjXa5WV8"},{name:"Station Oran Haï Sabah",maps:"https://maps.app.goo.gl/cGHFG2kPkkssf9j18"},{name:"Station Oran Es Sénia Maraval",maps:"https://maps.app.goo.gl/WBypYcM1iuCrKHGn6"},{name:"Station Oran Khemisti Marsa El Kébir",maps:"https://maps.app.goo.gl/8LNi1FiDYaVBxZMPA"},{name:"Station Oran Aïn Turk",maps:"https://maps.app.goo.gl/j8rSVQ6PgxK3rrgJ6"}],
  "El Bayadh":[{name:"Station El Bayadh",maps:"https://maps.app.goo.gl/txCe86XDL3cHci8c9"}],
  "Illizi":[{name:"Station Illizi",maps:"https://maps.app.goo.gl/Nq9sb3qgDLskXKix8"},{name:"Station In Amenas",maps:""},{name:"Station Aïn Amenas New",maps:"https://maps.app.goo.gl/f1vuk2pHrtFHaNeUA"}],
  "Bordj Bou Arréridj":[{name:"Station Bordj Bou Arréridj",maps:"https://maps.app.goo.gl/dnG3sGzVRcm7b3MD7"}],
  "Boumerdès":[{name:"Station Boumerdès",maps:"https://maps.app.goo.gl/urE5qh6KxE61wCfj6"},{name:"Station Boumerdès Borj Ménaïel",maps:"https://maps.app.goo.gl/5y8U7jN9VFYTskkS9"},{name:"Station Dellys",maps:"https://maps.app.goo.gl/CcrypFG8Gd2D7eDy7"}],
  "El Tarf":[{name:"Station El Tarf",maps:""},{name:"Station El Tarf New",maps:"https://maps.app.goo.gl/YDQBYdGeSP8weZrg7"}],
  "Tissemsilt":[{name:"Station Tissemsilt",maps:"https://maps.app.goo.gl/4HCw7MarbhkdPVgv8"},{name:"Station Tissemsilt Bordj Bounaama",maps:"https://maps.app.goo.gl/i8Pbrfe74Nt82ySU8"}],
  "El Oued":[{name:"Station El Oued",maps:"https://maps.app.goo.gl/Jx3z31EAujW6yhv26"}],
  "Khenchela":[{name:"Station Khenchela",maps:"https://maps.app.goo.gl/JE8LxXYjUoRJj8y46"}],
  "Souk Ahras":[{name:"Station Souk Ahras",maps:"https://maps.app.goo.gl/m8WVP29QPG5eGe7N7"}],
  "Tipaza":[{name:"Station Tipaza",maps:"https://maps.app.goo.gl/fZHRJeWMyUee3Azo9"},{name:"Station Tipaza Hadjout",maps:"https://maps.app.goo.gl/wpQ88PXZcuSvvNfD6"},{name:"Station Tipaza Koléa",maps:"https://maps.app.goo.gl/TLDwxR7uHzG2gnyC7"}],
  "Mila":[{name:"Station Mila",maps:"https://maps.app.goo.gl/cLN3rESG2BBKMdPS7"},{name:"Station Chelghoum Laïd",maps:"https://maps.app.goo.gl/4MiiEt1X7d8KuBxe6"}],
  "Aïn Defla":[{name:"Station Aïn Defla",maps:"https://maps.app.goo.gl/dDaPGzzFH5WXGqWk7"},{name:"Station Aïn Defla Khemis Miliana",maps:"https://maps.app.goo.gl/akVWFicGBacivrb56"}],
  "Naâma":[{name:"Station Naâma Méchria",maps:"https://maps.app.goo.gl/cVUPoUNaWxcrEwk87"}],
  "Aïn Témouchent":[{name:"Station Aïn Témouchent",maps:"https://maps.app.goo.gl/1BdnjT4zLTRGCSGr7"},{name:"Station Aïn Témouchent Béni Saf",maps:"https://maps.app.goo.gl/yW9wKpYXD8G1c8dX9"}],
  "Ghardaïa":[{name:"Station Ghardaïa",maps:"https://maps.app.goo.gl/cXud7e3msezqYtVQ7"}],
  "Relizane":[{name:"Station Relizane",maps:"https://maps.app.goo.gl/7221SR9vbvVhwV6QA"},{name:"Station Relizane Oued Rhiou",maps:"https://maps.app.goo.gl/GyEbfZNGoaH5MXJj6"}],
  "Ouled Djellal":[{name:"Station Ouled Djellal",maps:"https://maps.app.goo.gl/6sfe8AAdziro5qne6"}],
  "In Salah":[{name:"Station In Salah",maps:"https://maps.app.goo.gl/L5tCxgovXucPoNhX9"}],
  "Touggourt":[{name:"Station Touggourt",maps:"https://maps.app.goo.gl/7ZzXboGXpcMBpcEq9"}],
  "Djanet":[{name:"Station Djanet",maps:"https://maps.app.goo.gl/Sub9C3s8ByQRZRy56"},{name:"Station Djanet New",maps:"https://maps.app.goo.gl/huPNCpPsL8eYfkfj6"}],
  "El M'Ghair":[{name:"Station El M'Ghair",maps:"https://maps.app.goo.gl/yPERLTuVt166JXPD9"}]
};
const STOPDESK_WILAYAS = Object.keys(ANDERSON_STOPDESKS);
const CATEGORIES = ["face","lip","body","hair","face,body"];
const CAT_LABELS = {face:{en:"Face",ar:"الوجه"},lip:{en:"Lip Care",ar:"العناية بالشفاه"},body:{en:"Body",ar:"الجسم"},hair:{en:"Hair",ar:"الشعر"}};
const ING_CATEGORIES = ["Base Ingredients","Actives & Acids","Preservatives","Waxes, Emulsifiers & Texture Agents","Clays & Powders","Essential Oils","Fragrance Oils","Herbs, Seeds & Botanicals","Other"];
const PriceDisplay = ({price,discount_price}) => discount_price?(<span><span style={{textDecoration:"line-through",color:"var(--muted)",fontSize:"0.85rem",marginRight:8}}>{price}</span><span style={{color:"var(--red)",fontWeight:600}}>{discount_price}</span></span>):<span>{price}</span>;

const TR = {
  en:{nav_home:"Home",nav_catalog:"Catalog",nav_order:"Order",hero_cta:"Explore Collection",hero_sub:"Pure. Natural. Handcrafted.",v_natural:"Natural",v_handmade:"Handmade",v_trad:"Traditional",v_tallow:"Tallow-Based",cat_title:"Our Collection",f_all:"All",f_face:"Face",f_lip:"Lip Care",f_body:"Body",f_hair:"Hair",details_btn:"Details",back:"← Back",order_title:"Your Order",f_name:"Full Name",f_phone:"Phone Number",f_wilaya:"Wilaya",f_addr:"Delivery Address",sel_wilaya:"Select your wilaya",submit:"Place Order",conf_title:"Order Received!",conf_back:"Back to Shop",brand_desc:"At Malvera, we believe in timeless beauty rooted in tradition. Every product is handcrafted with pure, natural ingredients — centered around the power of beef tallow — to nourish, strengthen, and restore balance to your skin, lips, and hair.",adm_login:"Admin Login",adm_email:"Email",adm_pass:"Password",adm_signin:"Sign In",adm_wrong:"Invalid credentials",adm_orders:"Orders",adm_products:"Products",adm_ing:"Ingredients",adm_delivery:"Delivery",adm_logout:"Logout",s_pending:"Pending",s_confirmed:"Confirmed",s_delivered:"Delivered",s_cancelled:"Cancelled",s_returned:"Returned",low_stock:"Low Stock",save:"Save",search:"Search...",c_name:"Customer",c_order:"Order",c_product:"Products",c_qty:"Qty",c_total:"Total",c_wilaya:"Wilaya",c_phone:"Phone",c_date:"Date",c_status:"Status",no_orders:"No orders yet.",threshold:"Alert",stock_qty:"Stock",loading:"Loading...",del_type:"Delivery Type",del_home:"Home Delivery",del_stop:"Stop Desk",f_commune:"Commune",f_stopdesk:"Select Stop Desk",sel_commune:"Enter your commune",sel_stopdesk:"Select a stop desk",view_map:"View on map",home_price:"Home price (DA)",stop_price:"Stop desk price (DA)",sales:"Sales (delivered)",
    add_basket:"Add to basket",view_basket:"View basket",choose_products:"Choose your products",your_basket:"Your basket",basket_empty:"Your basket is empty. Add products above.",your_details:"Your details",subtotal:"Subtotal",delivery_fee:"Delivery",total:"Total",fee_tbc:"To be confirmed",select_wilaya_fee:"Select your wilaya",err_basket:"Please add at least one product to your basket.",err_fill:"Please fill in all the required fields.",err_phone:"Please enter a valid phone number (example: 0555123456).",err_send:"Sorry, your order could not be sent. Please try again.",order_number:"Order number",your_order:"Your order",keep_number:"Please keep your order number.",conf_msg:"Thank you! We have received your order and we will contact you very soon to confirm it.",contact_us:"For more information, you can contact us:",lbl_phone:"Phone",lbl_instagram:"Instagram",lbl_email:"Email",delivery_to:"Delivery"},
  ar:{nav_home:"الرئيسية",nav_catalog:"المنتجات",nav_order:"الطلب",hero_cta:"اكتشفي المجموعة",hero_sub:"طبيعي. نقي. صنع بالحب.",v_natural:"طبيعي",v_handmade:"صنع يدوي",v_trad:"تراثي",v_tallow:"زبدة الشحم",cat_title:"مجموعتنا",f_all:"الكل",f_face:"الوجه",f_lip:"العناية بالشفاه",f_body:"الجسم",f_hair:"الشعر",details_btn:"التفاصيل",back:"→ رجوع",order_title:"طلبك",f_name:"الاسم الكامل",f_phone:"رقم الهاتف",f_wilaya:"الولاية",f_addr:"عنوان التوصيل",sel_wilaya:"اختاري ولايتك",submit:"إرسال الطلب",conf_title:"تم استلام طلبك!",conf_back:"العودة للمتجر",brand_desc:"في Malvera، نؤمن بالجمال الخالد المستوحى من الموروث. كل منتج مصنوع يدوياً من مكونات طبيعية خالصة — في قلبها شحم البقر — لتغذية بشرتكِ وشعركِ وشفاهكِ وإعادة توازنها.",adm_login:"تسجيل الدخول",adm_email:"البريد",adm_pass:"كلمة المرور",adm_signin:"دخول",adm_wrong:"بيانات غير صحيحة",adm_orders:"الطلبات",adm_products:"المنتجات",adm_ing:"المكونات",adm_delivery:"التوصيل",adm_logout:"خروج",s_pending:"قيد الانتظار",s_confirmed:"مؤكد",s_delivered:"تم التوصيل",s_cancelled:"ملغى",s_returned:"مرتجع",low_stock:"مخزون منخفض",save:"حفظ",search:"بحث...",c_name:"العميلة",c_order:"الطلب",c_product:"المنتجات",c_qty:"الكمية",c_total:"المجموع",c_wilaya:"الولاية",c_phone:"الهاتف",c_date:"التاريخ",c_status:"الحالة",no_orders:"لا توجد طلبات بعد.",threshold:"حد التنبيه",stock_qty:"الكمية",loading:"جاري التحميل...",del_type:"نوع التوصيل",del_home:"توصيل للمنزل",del_stop:"نقطة توقف",f_commune:"البلدية",f_stopdesk:"اختاري نقطة التوقف",sel_commune:"أدخلي بلديتك",sel_stopdesk:"اختاري نقطة التوقف",view_map:"عرض على الخريطة",home_price:"سعر التوصيل للمنزل (دج)",stop_price:"سعر نقطة التوقف (دج)",sales:"المبيعات (المسلّمة)",
    add_basket:"أضيفي إلى السلة",view_basket:"عرض السلة",choose_products:"اختاري منتجاتك",your_basket:"سلتك",basket_empty:"سلتك فارغة. أضيفي منتجات من الأعلى.",your_details:"معلوماتك",subtotal:"المجموع الجزئي",delivery_fee:"التوصيل",total:"المجموع",fee_tbc:"سيتم تأكيده",select_wilaya_fee:"اختاري الولاية",err_basket:"يرجى إضافة منتج واحد على الأقل إلى السلة.",err_fill:"يرجى ملء جميع الحقول المطلوبة.",err_phone:"يرجى إدخال رقم هاتف صحيح (مثال: 0555123456).",err_send:"عذراً، تعذّر إرسال طلبك. يرجى المحاولة مرة أخرى.",order_number:"رقم الطلب",your_order:"طلبك",keep_number:"يرجى الاحتفاظ برقم الطلب.",conf_msg:"شكراً لكِ! لقد استلمنا طلبك وسنتواصل معكِ قريباً جداً لتأكيده.",contact_us:"لمزيد من المعلومات يمكنكِ التواصل معنا:",lbl_phone:"الهاتف",lbl_instagram:"إنستغرام",lbl_email:"البريد الإلكتروني",delivery_to:"التوصيل"}
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{--beige:#f5ede0;--beige2:#ede0cc;--cream:#faf6f0;--mocha:#4a3728;--mocha2:#6b4f3a;--gold:#c9a96e;--gold2:#e8c98a;--text:#2d1f14;--muted:#8a7060;--red:#c0392b;--orange:#e67e22;--white:#ffffff;--shadow:0 4px 24px rgba(74,55,40,0.10);--shadow2:0 2px 8px rgba(74,55,40,0.08);}
html{-webkit-text-size-adjust:100%;}
body{font-family:'Jost',sans-serif;background:var(--cream);color:var(--text);min-height:100vh;overflow-x:hidden;}
h1,h2,h3{font-family:'Cormorant Garamond',serif;}
img{max-width:100%;}
.rtl{direction:rtl;text-align:right;}.ltr{direction:ltr;text-align:left;}
.muted{color:var(--muted);font-size:0.9rem;}
.nav{position:sticky;top:0;z-index:100;background:rgba(245,237,224,0.96);backdrop-filter:blur(12px);border-bottom:1px solid var(--beige2);display:flex;align-items:center;justify-content:space-between;padding:0 32px;height:64px;box-shadow:var(--shadow2);}
.nav-logo{font-family:'Cormorant Garamond',serif;font-size:1.7rem;font-weight:600;color:var(--mocha);letter-spacing:4px;text-transform:uppercase;cursor:pointer;}
.nav-links{display:flex;gap:24px;align-items:center;}
.nav-link{background:none;border:none;cursor:pointer;font-family:'Jost';font-size:0.78rem;letter-spacing:2px;text-transform:uppercase;color:var(--mocha2);transition:color 0.2s;display:inline-flex;align-items:center;}
.nav-link:hover,.nav-link.active{color:var(--gold);}
.cart-badge{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 5px;margin-inline-start:5px;border-radius:9px;background:var(--gold);color:var(--mocha);font-size:0.65rem;font-weight:600;letter-spacing:0;}
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
.filter-btn{background:none;border:1px solid var(--beige2);cursor:pointer;padding:8px 20px;font-family:'Jost';font-size:0.74rem;letter-spacing:2px;text-transform:uppercase;color:var(--muted);border-radius:20px;transition:all 0.2s;white-space:nowrap;}
.filter-btn:hover,.filter-btn.active{background:var(--mocha);color:var(--cream);border-color:var(--mocha);}
.products-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:28px;}
.product-card{background:var(--white);border-radius:4px;overflow:hidden;box-shadow:var(--shadow2);transition:transform 0.25s,box-shadow 0.25s;cursor:pointer;}
.product-card:hover{transform:translateY(-4px);box-shadow:var(--shadow);}
.product-img{height:200px;background:linear-gradient(135deg,var(--beige) 0%,var(--beige2) 100%);display:flex;align-items:center;justify-content:center;font-size:3.5rem;overflow:hidden;}
.product-img img{width:100%;height:100%;object-fit:cover;}
.product-info{padding:20px;}
.product-cat{font-size:0.65rem;letter-spacing:2px;text-transform:uppercase;color:var(--gold);margin-bottom:6px;}
.product-name{font-size:1.15rem;font-weight:600;color:var(--mocha);margin-bottom:6px;font-family:'Cormorant Garamond';}
.product-short{font-size:0.83rem;color:var(--muted);line-height:1.6;margin-bottom:14px;}
.product-price{font-size:1rem;color:var(--mocha);font-weight:500;margin-bottom:14px;}
.product-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;}
.stepper{display:flex;align-items:center;width:132px;height:40px;border:1px solid var(--beige2);border-radius:4px;overflow:hidden;background:var(--white);flex-shrink:0;}
.stepper button{width:40px;height:100%;border:none;background:var(--beige);cursor:pointer;font-size:1.2rem;color:var(--mocha);}
.stepper input{flex:1;min-width:0;width:100%;height:100%;border:none;text-align:center;font-family:'Jost';font-size:16px;outline:none;background:var(--white);-moz-appearance:textfield;}
.stepper input::-webkit-outer-spin-button,.stepper input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}
.detail{max-width:900px;margin:0 auto;padding:40px 32px;}
.detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:start;}
.detail-img{height:380px;background:linear-gradient(135deg,var(--beige) 0%,var(--beige2) 100%);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:6rem;overflow:hidden;}
.detail-img img{width:100%;height:100%;object-fit:cover;}
.detail-title{font-size:2.2rem;font-weight:300;color:var(--mocha);margin-bottom:8px;font-style:italic;}
.detail-price{font-size:1.3rem;color:var(--gold);font-weight:500;margin-bottom:20px;}
.detail-desc{color:var(--mocha2);line-height:1.9;font-size:0.95rem;margin-bottom:28px;font-weight:300;}
.order-page{max-width:760px;margin:0 auto;padding:48px 24px;}
.order-title{font-size:2rem;font-weight:300;font-style:italic;color:var(--mocha);margin-bottom:8px;}
.step-title{font-family:'Cormorant Garamond',serif;font-size:1.45rem;color:var(--mocha);font-style:italic;margin:30px 0 14px;}
.pick-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;}
.pick-card{background:var(--white);border:2px solid var(--beige2);border-radius:6px;padding:10px;display:flex;flex-direction:column;gap:8px;transition:border-color 0.2s;}
.pick-card.selected{border-color:var(--gold);}
.pick-card>:last-child{margin-top:auto;}
.pick-img{height:120px;border-radius:4px;overflow:hidden;background:linear-gradient(135deg,var(--beige),var(--beige2));display:flex;align-items:center;justify-content:center;font-size:2.2rem;}
.pick-img img{width:100%;height:100%;object-fit:cover;}
.pick-name{font-family:'Cormorant Garamond',serif;font-weight:600;font-size:1.05rem;color:var(--mocha);line-height:1.2;}
.pick-price{font-size:0.85rem;color:var(--mocha2);}
.pick-card .stepper{width:100%;}
.pick-add{padding:11px 8px !important;font-size:0.7rem !important;letter-spacing:1px !important;}
.basket{background:var(--white);border:1px solid var(--beige2);border-radius:6px;overflow:hidden;}
.basket-row{display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--beige2);}
.basket-thumb{width:46px;height:46px;border-radius:4px;overflow:hidden;background:var(--beige2);flex-shrink:0;display:flex;align-items:center;justify-content:center;}
.basket-thumb img{width:100%;height:100%;object-fit:cover;}
.basket-info{flex:1;min-width:0;}
.basket-name{font-size:0.9rem;font-weight:500;}
.basket-unit{font-size:0.75rem;color:var(--muted);}
.basket-line{font-weight:500;font-size:0.9rem;white-space:nowrap;}
.basket-x{background:none;border:none;color:var(--muted);cursor:pointer;font-size:1.1rem;padding:8px;}
.basket-sub{display:flex;justify-content:space-between;padding:12px;background:var(--beige);font-size:0.92rem;}
.totals{background:var(--white);border:1px solid var(--beige2);border-radius:6px;padding:14px 16px;margin:26px 0 16px;}
.totals>div{display:flex;justify-content:space-between;gap:12px;padding:6px 0;font-size:0.92rem;}
.totals .grand{border-top:1px solid var(--beige2);margin-top:6px;padding-top:12px;font-size:1.15rem;font-weight:600;color:var(--mocha);}
.form-error{background:#fde8e8;color:var(--red);padding:12px 14px;border-radius:4px;font-size:0.85rem;margin-bottom:14px;}
.cart-bar{position:fixed;left:12px;right:12px;bottom:12px;z-index:120;max-width:560px;width:calc(100% - 24px);margin:0 auto;background:var(--mocha);color:var(--cream);border:none;border-radius:8px;padding:14px 18px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;box-shadow:0 6px 24px rgba(0,0,0,0.25);font-family:'Jost';font-size:0.9rem;}
.form-group{margin-bottom:20px;}
.form-label{display:block;font-size:0.72rem;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:8px;}
.form-input,.form-select,.form-textarea{width:100%;padding:12px 16px;border:1px solid var(--beige2);border-radius:2px;font-family:'Jost';font-size:0.9rem;color:var(--text);background:var(--white);outline:none;transition:border-color 0.2s;}
.form-textarea{min-height:80px;resize:vertical;}
.form-input:focus,.form-select:focus,.form-textarea:focus{border-color:var(--gold);}
.confirm{max-width:560px;margin:0 auto;text-align:center;padding:70px 20px;}
.confirm-icon{font-size:4rem;margin-bottom:16px;}
.confirm-title{font-size:2.2rem;font-style:italic;font-weight:300;color:var(--mocha);margin-bottom:12px;}
.confirm-msg{color:var(--mocha2);line-height:1.8;margin-bottom:22px;}
.order-no{display:inline-block;margin:6px 0 22px;padding:10px 22px;border:1px dashed var(--gold);border-radius:6px;font-size:1rem;color:var(--mocha2);}
.order-no strong{font-size:1.6rem;color:var(--mocha);margin-inline-start:8px;font-family:'Cormorant Garamond',serif;}
.receipt{background:var(--white);border:1px solid var(--beige2);border-radius:6px;padding:16px;text-align:start;margin-bottom:22px;box-shadow:var(--shadow2);}
.receipt-title{font-family:'Cormorant Garamond',serif;font-size:1.3rem;font-style:italic;color:var(--mocha);margin-bottom:8px;}
.receipt-row{display:flex;justify-content:space-between;gap:12px;padding:6px 0;font-size:0.9rem;}
.receipt-row.grand{border-top:1px solid var(--beige2);margin-top:6px;padding-top:12px;font-weight:600;font-size:1.05rem;color:var(--mocha);}
.receipt-meta{margin-top:12px;padding-top:12px;border-top:1px dashed var(--beige2);font-size:0.82rem;color:var(--muted);line-height:1.7;}
.contact-box{background:var(--beige);border-radius:6px;padding:16px;margin:0 0 26px;text-align:start;line-height:2;font-size:0.92rem;}
.contact-box a{color:var(--mocha);font-weight:500;}
.admin-login{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--mocha);padding:16px;}
.login-card{background:var(--cream);padding:48px 40px;border-radius:4px;width:100%;max-width:380px;text-align:center;}
.login-logo{font-size:2rem;letter-spacing:4px;font-weight:600;color:var(--gold);margin-bottom:8px;font-family:'Cormorant Garamond';}
.login-title{font-size:1.8rem;font-style:italic;color:var(--mocha);margin-bottom:32px;}
.admin-layout{display:flex;min-height:100vh;background:#f8f4ef;}
.admin-sidebar{width:220px;background:var(--mocha);padding:32px 0;display:flex;flex-direction:column;flex-shrink:0;}
.sidebar-logo{font-family:'Cormorant Garamond';font-size:1.3rem;letter-spacing:3px;color:var(--gold2);text-align:center;padding:0 20px 28px;border-bottom:1px solid rgba(255,255,255,0.1);margin-bottom:16px;}
.sidebar-link{background:none;border:none;cursor:pointer;width:100%;text-align:left;padding:13px 24px;font-family:'Jost';font-size:0.8rem;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,0.6);transition:all 0.2s;}
.sidebar-link:hover,.sidebar-link.active{color:var(--gold2);background:rgba(255,255,255,0.06);}
.sidebar-logout{margin-top:auto;}
.admin-main{flex:1;min-width:0;padding:36px 40px;overflow-y:auto;}
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
.badge-cancelled{background:#fde8e8;color:#c0392b;}
.badge-returned{background:#ece3f7;color:#6b3fa0;}
.badge-low{background:#fde8e8;color:var(--red);}
.badge-ok{background:#d4edda;color:#155724;}
.status-select{padding:4px 8px;border:1px solid var(--beige2);border-radius:3px;font-size:0.8rem;font-family:'Jost';background:var(--white);cursor:pointer;}
.qty-input{width:80px;padding:4px 8px;border:1px solid var(--beige2);border-radius:3px;font-size:0.85rem;font-family:'Jost';}
.btn-save{background:var(--mocha);color:var(--white);border:none;cursor:pointer;padding:5px 14px;border-radius:3px;font-size:0.75rem;font-family:'Jost';transition:background 0.2s;}
.btn-save:hover{background:var(--gold);color:var(--mocha);}
.btn-add{background:var(--gold);color:var(--mocha);border:none;cursor:pointer;padding:8px 20px;border-radius:3px;font-size:0.78rem;font-family:'Jost';font-weight:500;transition:background 0.2s;margin-bottom:16px;}
.btn-add:hover{background:var(--mocha);color:var(--cream);}
.btn-danger{background:#fde8e8;color:var(--red);border:none;cursor:pointer;padding:4px 10px;border-radius:3px;font-size:0.75rem;font-family:'Jost';}
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
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:300;display:flex;align-items:center;justify-content:center;padding:16px;}
.modal{background:var(--cream);border-radius:4px;padding:28px;width:100%;max-width:500px;max-height:90vh;overflow-y:auto;}
.modal-title{font-size:1.4rem;font-style:italic;color:var(--mocha);margin-bottom:20px;}
.photo-preview{width:80px;height:80px;object-fit:cover;border-radius:4px;border:1px solid var(--beige2);}

@media(max-width:768px){
  .nav{padding:0 14px;height:56px;}
  .nav-logo{font-size:1.25rem;letter-spacing:2px;}
  .nav-links{gap:10px;}
  .nav-link{font-size:0.66rem;letter-spacing:1px;padding:8px 2px;}
  .lang-btn{padding:6px 10px;font-size:0.7rem;}
  .hero{min-height:auto;padding:56px 20px 64px;}
  .hero-tag{font-size:0.62rem;letter-spacing:3px;}
  .hero-sub{font-size:0.72rem;letter-spacing:2px;margin-bottom:24px;}
  .hero-desc{font-size:0.92rem;margin-bottom:32px;}
  .btn-primary{padding:14px 28px;letter-spacing:2px;}
  .values{display:grid;grid-template-columns:1fr 1fr;}
  .value-item{padding:20px 10px;min-width:0;border-right:none;border-bottom:1px solid var(--beige2);}
  .value-item:nth-child(odd){border-right:1px solid var(--beige2);}
  .value-item:nth-last-child(-n+2){border-bottom:none;}
  .catalog{padding:32px 14px;}
  .section-title{font-size:1.9rem;}
  .section-line{margin-bottom:22px;}
  .filters{flex-wrap:nowrap;overflow-x:auto;margin:0 -14px 22px;padding:0 14px 6px;}
  .filter-btn{flex-shrink:0;padding:9px 16px;}
  .products-grid{grid-template-columns:repeat(2,1fr);gap:12px;}
  .product-card:hover{transform:none;}
  .product-img{height:150px;font-size:2.6rem;}
  .product-info{padding:12px;}
  .product-name{font-size:1rem;}
  .product-short{font-size:0.74rem;line-height:1.45;margin-bottom:8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
  .product-price{font-size:0.9rem;margin-bottom:10px;}
  .product-actions{flex-direction:column;align-items:stretch;}
  .product-actions>button{width:100%;padding:11px 8px !important;}
  .product-actions .stepper{width:100%;}
  .detail{padding:20px 14px;}
  .detail-grid{grid-template-columns:1fr;gap:22px;}
  .detail-img{height:320px;}
  .detail-title{font-size:1.8rem;}
  .order-page{padding:28px 14px;}
  .order-title{font-size:1.7rem;}
  .pick-grid{grid-template-columns:repeat(2,1fr);}
  .pick-img{height:110px;}
  .form-input,.form-select,.form-textarea{font-size:16px;padding:13px 14px;}
  .confirm{padding:48px 16px;}
  .confirm-title{font-size:1.8rem;}
  .login-card{padding:36px 24px;}

  .admin-layout{flex-direction:column;}
  .admin-sidebar{position:fixed;bottom:0;left:0;right:0;width:100%;height:62px;flex-direction:row;padding:0;z-index:150;border-top:1px solid rgba(255,255,255,0.12);}
  .sidebar-logo{display:none;}
  .sidebar-link{flex:1;width:auto;text-align:center;padding:6px 2px;font-size:0.58rem;letter-spacing:0.5px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;}
  .sidebar-logout{margin-top:0;}
  .admin-main{padding:16px 12px 84px;}
  .admin-title{font-size:1.5rem;margin-bottom:16px;}
  .stat-grid{grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:18px;}
  .stat-card{padding:14px;}
  .stat-num{font-size:1.5rem;}
  .admin-card{padding:14px;}
  .search-input{min-width:0;width:100%;flex:none;font-size:16px;}
  .select-filter{flex:1;font-size:16px;}

  .rtable thead{display:none;}
  .rtable,.rtable tbody,.rtable tr,.rtable td{display:block;width:100%;}
  .rtable tr{border:1px solid var(--beige2);border-radius:6px;margin-bottom:12px;padding:4px 0;}
  .rtable td{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:8px 12px;border-bottom:1px dashed var(--beige2);text-align:right;}
  .rtable td:last-child{border-bottom:none;}
  .rtable td::before{content:attr(data-label);font-size:0.62rem;letter-spacing:1px;text-transform:uppercase;color:var(--muted);text-align:left;flex-shrink:0;}
  .rtable td[colspan]::before{display:none;}
  .rtable tr.cat-row{border:none;margin:0;padding:0;}
  .rtable td.stack{flex-direction:column;align-items:stretch;text-align:left;}
  .rtable td.stack::before{margin-bottom:4px;}
  .rtable td.center{justify-content:center;}
  .rtable td.center::before{display:none;}
  .rtable .qty-input{width:110px;font-size:16px;}
  .rtable td.stack .qty-input,.rtable td.stack textarea{width:100% !important;font-size:16px;}
}
`;

function Stepper({qty,onChange}) {
  return (
    <div className="stepper">
      <button type="button" onClick={()=>onChange(qty-1)}>−</button>
      <input type="number" inputMode="numeric" min="1" value={qty} onChange={e=>{ if(e.target.value!=="") onChange(e.target.value); }} />
      <button type="button" onClick={()=>onChange(qty+1)}>+</button>
    </div>
  );
}

export default function App() {
  const [lang,setLang] = useState("en");
  const [page,setPage] = useState("home");
  const [selectedProduct,setSelectedProduct] = useState(null);
  const [products,setProducts] = useState([]);
  const [ingredients,setIngredients] = useState([]);
  const [orders,setOrders] = useState([]);
  const [delivery,setDelivery] = useState([]);
  const [cart,setCart] = useState([]);
  const [lastOrder,setLastOrder] = useState(null);
  const [isAdmin,setIsAdmin] = useState(false);
  const [adminTab,setAdminTab] = useState("orders");
  const [loading,setLoading] = useState(true);
  const T = TR[lang];

  useEffect(()=>{loadPublic();},[]);
  useEffect(()=>{window.scrollTo(0,0);},[page]);

  const run = async (fn) => {
    try { await fn(); } catch(e) { alert("Error: " + (e.message || e)); }
  };

  const loadPublic = async () => {
    setLoading(true);
    try { setProducts(await sb("products?order=id")); } catch(e){ console.error(e); }
    try { setDelivery(await sb("delivery_prices?order=id")); } catch(e){ console.error(e); }
    setLoading(false);
  };
  const loadAdminData = async () => {
    try {
      const [i,o] = await Promise.all([sb("ingredients?order=id"), sb("orders?order=created_at.desc")]);
      setIngredients(i); setOrders(o);
    } catch(e){ console.error(e); }
  };

  const changeQty = (id,q) => setCart(prev=>{
    const n = Math.min(999, Math.max(0, Math.floor(Number(q)) || 0));
    const exists = prev.some(i=>i.productId===id);
    if (n===0) return prev.filter(i=>i.productId!==id);
    if (exists) return prev.map(i=>i.productId===id?{...i,qty:n}:i);
    return [...prev,{productId:id,qty:n}];
  });

  const cartLines = cart.map(c=>{
    const p = products.find(x=>x.id===c.productId);
    if (!p) return null;
    const unit = unitPrice(p);
    return {productId:c.productId,qty:c.qty,product:p,name:p.name,unit,line:unit*c.qty};
  }).filter(Boolean);
  const cartCount = cartLines.reduce((s,l)=>s+l.qty,0);
  const subtotal = cartLines.reduce((s,l)=>s+l.line,0);

  const handleOrder = async (form) => {
    try {
      const items = cartLines.map(l=>({productId:l.productId,productName:l.name,qty:l.qty,price:l.unit}));
      if (items.length===0) return false;
      const rawFee = getFee(delivery,form.wilaya,form.deliveryType);
      const fee = rawFee===null?0:rawFee;
      const total = subtotal+fee;
      const isStop = form.deliveryType==="stopdesk";
      const inserted = await sb("orders",{method:"POST",body:JSON.stringify({
        name:form.name.trim(), phone:form.phone.trim(), wilaya:form.wilaya,
        address:isStop?form.stopdesk:form.address.trim(),
        commune:isStop?null:form.commune.trim(),
        delivery_type:form.deliveryType,
        product_name:items.map(i=>`${i.productName} x${i.qty}`).join(", "),
        items, qty:items.reduce((s,i)=>s+i.qty,0),
        subtotal, delivery_fee:fee, total, status:"pending"
      })});
      for (const item of items) {
        const prod = products.find(p=>p.id===item.productId);
        if (prod) {
          const newStock = Math.max(0,(Number(prod.stock)||0)-item.qty);
          await sb(`products?id=eq.${prod.id}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({stock:newStock})});
          setProducts(prev=>prev.map(p=>p.id===prod.id?{...p,stock:newStock}:p));
        }
      }
      setLastOrder({
        number: inserted[0] ? inserted[0].order_number : null,
        items, subtotal, fee, feeKnown:rawFee!==null, total,
        name:form.name.trim(), wilaya:form.wilaya, deliveryType:form.deliveryType,
        place: isStop?form.stopdesk:`${form.commune.trim()} - ${form.address.trim()}`
      });
      setCart([]);
      setPage("confirm");
      return true;
    } catch(e){
      console.error(e);
      return false;
    }
  };

  const updateOrderStatus = (id,status) => run(async()=>{
    await sb(`orders?id=eq.${id}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({status})});
    setOrders(prev=>prev.map(o=>o.id===id?{...o,status}:o));
  });
  const deleteOrder = (id) => run(async()=>{
    await sb(`orders?id=eq.${id}`,{method:"DELETE",headers:{Prefer:"return=minimal"}});
    setOrders(prev=>prev.filter(o=>o.id!==id));
  });
  const patchProduct = (id,patch) => run(async()=>{
    await sb(`products?id=eq.${id}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify(patch)});
    setProducts(prev=>prev.map(p=>p.id===id?{...p,...patch}:p));
  });
  const addProduct = (data) => run(async()=>{
    const id = Math.max(0,...products.map(p=>p.id))+1;
    const inserted = await sb("products",{method:"POST",body:JSON.stringify({...data,id})});
    if (inserted[0]) setProducts(prev=>[...prev,inserted[0]]);
  });
  const deleteProduct = (id) => run(async()=>{
    await sb(`products?id=eq.${id}`,{method:"DELETE",headers:{Prefer:"return=minimal"}});
    setProducts(prev=>prev.filter(p=>p.id!==id));
  });
  const patchIngredient = (id,patch) => run(async()=>{
    await sb(`ingredients?id=eq.${id}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify(patch)});
    setIngredients(prev=>prev.map(i=>i.id===id?{...i,...patch}:i));
  });
  const addIngredient = (data) => run(async()=>{
    const id = Math.max(0,...ingredients.map(i=>i.id))+1;
    const inserted = await sb("ingredients",{method:"POST",body:JSON.stringify({...data,id})});
    if (inserted[0]) setIngredients(prev=>[...prev,inserted[0]]);
  });
  const deleteIngredient = (id) => run(async()=>{
    await sb(`ingredients?id=eq.${id}`,{method:"DELETE",headers:{Prefer:"return=minimal"}});
    setIngredients(prev=>prev.filter(i=>i.id!==id));
  });
  const patchDelivery = (id,patch) => run(async()=>{
    await sb(`delivery_prices?id=eq.${id}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify(patch)});
    setDelivery(prev=>prev.map(d=>d.id===id?{...d,...patch}:d));
  });

  if (loading) return (
    <>
      <style>{CSS}</style>
      <div className="loader">
        <div style={{fontFamily:"Cormorant Garamond",fontSize:"2.5rem",color:"var(--mocha)",letterSpacing:"6px"}}>MALVERA</div>
        <div style={{color:"var(--muted)",fontSize:"0.8rem",letterSpacing:"3px"}}>{T.loading}</div>
      </div>
    </>
  );

  const detailLine = selectedProduct ? cart.find(i=>i.productId===selectedProduct.id) : null;
  const showBar = ["catalog","detail"].includes(page) && cartCount>0;

  return (
    <>
      <style>{CSS}</style>
      {page==="admin-login"&&<AdminLogin T={T} onLogin={async()=>{await loadAdminData();setIsAdmin(true);setPage("admin");}} onBack={()=>setPage("home")} />}
      {page==="admin"&&isAdmin&&(
        <AdminDashboard T={T} tab={adminTab} setTab={setAdminTab} orders={orders} products={products} ingredients={ingredients} delivery={delivery}
          onUpdateOrderStatus={updateOrderStatus} onDeleteOrder={deleteOrder}
          onPatchProduct={patchProduct} onAddProduct={addProduct} onDeleteProduct={deleteProduct}
          onPatchIngredient={patchIngredient} onAddIngredient={addIngredient} onDeleteIngredient={deleteIngredient}
          onPatchDelivery={patchDelivery}
          onLogout={()=>{setIsAdmin(false);setOrders([]);setPage("home");}} />
      )}
      {!["admin-login","admin"].includes(page)&&(
        <div className={lang==="ar"?"rtl":"ltr"} style={{paddingBottom:showBar?76:0}}>
          <nav className="nav">
            <div className="nav-logo" onClick={()=>setPage("home")}>MALVERA</div>
            <div className="nav-links">
              {[["home",T.nav_home],["catalog",T.nav_catalog],["order",T.nav_order]].map(([p,l])=>(
                <button key={p} className={`nav-link ${page===p?"active":""}`} onClick={()=>setPage(p)}>
                  {l}{p==="order"&&cartCount>0&&<span className="cart-badge">{cartCount}</span>}
                </button>
              ))}
              <button className="lang-btn" onClick={()=>setLang(lang==="en"?"ar":"en")}>{lang==="en"?"عربي":"EN"}</button>
            </div>
          </nav>
          {page==="home"&&(
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
          {page==="catalog"&&(
            <CatalogPage T={T} lang={lang} products={products} cart={cart} onChangeQty={changeQty}
              onDetail={p=>{setSelectedProduct(p);setPage("detail");}} />
          )}
          {page==="detail"&&selectedProduct&&(
            <div className="detail">
              <button className="back-btn" onClick={()=>setPage("catalog")}>{T.back}</button>
              <div className="detail-grid">
                <div className="detail-img">
                  {selectedProduct.image_url?<img src={selectedProduct.image_url} alt={selectedProduct.name} />:<span>🌿</span>}
                </div>
                <div>
                  <div className="product-cat">{selectedProduct.category}</div>
                  <h2 className="detail-title">{selectedProduct.name}</h2>
                  <div className="detail-price"><PriceDisplay price={selectedProduct.price} discount_price={selectedProduct.discount_price} /></div>
                  <p className="detail-desc">{selectedProduct.full_desc}</p>
                  <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"center"}}>
                    {detailLine
                      ? <Stepper qty={detailLine.qty} onChange={q=>changeQty(selectedProduct.id,q)} />
                      : <button className="btn-primary" onClick={()=>changeQty(selectedProduct.id,1)}>{T.add_basket}</button>}
                    {detailLine&&<button className="btn-outline" onClick={()=>setPage("order")}>{T.view_basket}</button>}
                  </div>
                </div>
              </div>
            </div>
          )}
          {page==="order"&&(
            <OrderPage T={T} products={products} cartLines={cartLines} subtotal={subtotal} delivery={delivery}
              onChangeQty={changeQty} onSubmit={handleOrder} onBack={()=>setPage("catalog")} />
          )}
          {page==="confirm"&&(
            <ConfirmPage T={T} order={lastOrder} onBack={()=>setPage("home")} />
          )}
          <footer style={{background:"var(--mocha)",color:"rgba(255,255,255,0.5)",textAlign:"center",padding:"28px 24px",fontSize:"0.75rem",letterSpacing:"1px",marginTop:60}}>
            <div style={{fontFamily:"Cormorant Garamond",fontSize:"1.1rem",color:"var(--gold2)",letterSpacing:"4px",marginBottom:8}}>MALVERA</div>
            <div>Natural Cosmetics · Handcrafted with Love</div>
            <div style={{marginTop:10,lineHeight:1.9}}>
              <a href={`tel:${CONTACT_PHONE}`} style={{color:"inherit"}} dir="ltr">{CONTACT_PHONE}</a>
              {" · "}
              <a href={`https://instagram.com/${CONTACT_INSTAGRAM}`} target="_blank" rel="noreferrer" style={{color:"inherit"}}>@{CONTACT_INSTAGRAM}</a>
            </div>
            <div onClick={()=>{
              if(!window._tap) window._tap={count:0,timer:null};
              window._tap.count++;
              clearTimeout(window._tap.timer);
              window._tap.timer=setTimeout(()=>{window._tap.count=0;},1000);
              if(window._tap.count>=3){window._tap.count=0;setPage("admin-login");}
            }} style={{marginTop:8,height:32,cursor:"default",userSelect:"none",WebkitTapHighlightColor:"transparent"}} />
          </footer>
          {showBar&&(
            <button className="cart-bar" onClick={()=>setPage("order")}>
              <span>🛒 {cartCount} · {money(subtotal)}</span>
              <span>{T.view_basket}</span>
            </button>
          )}
        </div>
      )}
    </>
  );
}

function CatalogPage({T,lang,products,cart,onChangeQty,onDetail}) {
  const [activeFilter,setActiveFilter] = useState("all");
  const filters = [{key:"all",label:T.f_all},{key:"face",label:T.f_face},{key:"lip",label:T.f_lip},{key:"body",label:T.f_body},{key:"hair",label:T.f_hair}];
  const filtered = activeFilter==="all"?products:products.filter(p=>p.category?.includes(activeFilter));
  return (
    <div className="catalog">
      <h2 className="section-title">{T.cat_title}</h2>
      <div className="section-line" />
      <div className="filters">
        {filters.map(f=><button key={f.key} className={`filter-btn ${activeFilter===f.key?"active":""}`} onClick={()=>setActiveFilter(f.key)}>{f.label}</button>)}
      </div>
      <div className="products-grid">
        {filtered.map(p=>{
          const inCart = cart.find(i=>i.productId===p.id);
          return (
            <div key={p.id} className="product-card" onClick={()=>onDetail(p)}>
              <div className="product-img">
                {p.image_url?<img src={p.image_url} alt={p.name} />:<span>🌿</span>}
              </div>
              <div className="product-info">
                <div className="product-cat">{p.category?.split(",").map(c=>CAT_LABELS[c.trim()]?.[lang]).filter(Boolean).join(" · ")}</div>
                <div className="product-name">{p.name}</div>
                <div className="product-short">{p.short_desc}</div>
                <div className="product-price"><PriceDisplay price={p.price} discount_price={p.discount_price} /></div>
                <div className="product-actions" onClick={e=>e.stopPropagation()}>
                  {inCart
                    ? <Stepper qty={inCart.qty} onChange={q=>onChangeQty(p.id,q)} />
                    : <button className="btn-primary" style={{padding:"10px 16px",fontSize:"0.72rem"}} onClick={()=>onChangeQty(p.id,1)}>{T.add_basket}</button>}
                  <button className="btn-outline" style={{padding:"10px 14px",fontSize:"0.72rem"}} onClick={()=>onDetail(p)}>{T.details_btn}</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrderPageOld({T,products,cartLines,subtotal,delivery,onChangeQty,onSubmit,onBack}) {
  const [form,setForm] = useState({name:"",phone:"",wilaya:"",commune:"",address:"",stopdesk:"",deliveryType:"home"});
  const [sending,setSending] = useState(false);
  const [err,setErr] = useState("");
  const set = (k,v)=>setForm(f=>({...f,[k]:v}));
  const isStopdesk = form.deliveryType==="stopdesk";
  const stopdesks = form.wilaya&&ANDERSON_STOPDESKS[form.wilaya]?ANDERSON_STOPDESKS[form.wilaya]:[];
  const selectedStopdesk = stopdesks.find(s=>s.name===form.stopdesk);
  const fee = form.wilaya?getFee(delivery,form.wilaya,form.deliveryType):null;
  const total = subtotal+(fee||0);

  const handle = async ()=>{
    if (sending) return;
    setErr("");
    if (cartLines.length===0) { setErr(T.err_basket); return; }
    if (!form.name.trim()||!form.phone.trim()||!form.wilaya) { setErr(T.err_fill); return; }
    if (isStopdesk ? !form.stopdesk : (!form.commune.trim()||!form.address.trim())) { setErr(T.err_fill); return; }
    if (!/^(\+213|0)[567]\d{8}$/.test(form.phone.replace(/[\s.\-]/g,""))) { setErr(T.err_phone); return; }
    setSending(true);
    const ok = await onSubmit(form);
    setSending(false);
    if (ok===false) setErr(T.err_send);
  };

  const deliveryBtn = (key,label)=>(
    <button type="button" onClick={()=>{set("deliveryType",key);set("wilaya","");set("stopdesk","");}} style={{flex:1,padding:"12px 6px",border:`2px solid ${form.deliveryType===key?"var(--mocha)":"var(--beige2)"}`,borderRadius:2,background:form.deliveryType===key?"var(--mocha)":"var(--white)",color:form.deliveryType===key?"var(--cream)":"var(--text)",cursor:"pointer",fontFamily:"Jost",fontSize:"0.85rem",transition:"all 0.2s"}}>{label}</button>
  );

  return (
    <div className="order-page">
      <button className="back-btn" onClick={onBack}>{T.back}</button>
      <h2 className="order-title">{T.order_title}</h2>
      <div className="section-line" style={{marginBottom:8}} />

      <h3 className="step-title">1. {T.choose_products}</h3>
      <div className="pick-grid">
        {products.map(p=>{
          const line = cartLines.find(l=>l.productId===p.id);
          return (
            <div key={p.id} className={`pick-card ${line?"selected":""}`}>
              <div className="pick-img">{p.image_url?<img src={p.image_url} alt={p.name} />:<span>🌿</span>}</div>
              <div className="pick-name">{p.name}</div>
              <div className="pick-price"><PriceDisplay price={p.price} discount_price={p.discount_price} /></div>
              {line
                ? <Stepper qty={line.qty} onChange={q=>onChangeQty(p.id,q)} />
                : <button type="button" className="btn-primary pick-add" onClick={()=>onChangeQty(p.id,1)}>+ {T.add_basket}</button>}
            </div>
          );
        })}
      </div>

      <h3 className="step-title">2. {T.your_basket}</h3>
      {cartLines.length===0 ? <p className="muted">{T.basket_empty}</p> : (
        <div className="basket">
          {cartLines.map(l=>(
            <div className="basket-row" key={l.productId}>
              <div className="basket-thumb">{l.product.image_url?<img src={l.product.image_url} alt="" />:<span>🌿</span>}</div>
              <div className="basket-info">
                <div className="basket-name">{l.name}</div>
                <div className="basket-unit">{money(l.unit)} × {l.qty}</div>
              </div>
              <div className="basket-line">{money(l.line)}</div>
              <button type="button" className="basket-x" onClick={()=>onChangeQty(l.productId,0)}>✕</button>
            </div>
          ))}
          <div className="basket-sub"><span>{T.subtotal}</span><strong>{money(subtotal)}</strong></div>
        </div>
      )}

      <h3 className="step-title">3. {T.your_details}</h3>
      {[["name",T.f_name,"text"],["phone",T.f_phone,"tel"]].map(([k,l,type])=>(
        <div className="form-group" key={k}>
          <label className="form-label">{l} *</label>
          <input className="form-input" type={type} value={form[k]} onChange={e=>set(k,e.target.value)} />
        </div>
      ))}
      <div className="form-group">
        <label className="form-label">{T.del_type} *</label>
        <div style={{display:"flex",gap:12}}>
          {deliveryBtn("home","🏠 "+T.del_home)}
          {deliveryBtn("stopdesk","🏢 "+T.del_stop)}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">{T.f_wilaya} *</label>
        <select className="form-select" value={form.wilaya} onChange={e=>{set("wilaya",e.target.value);set("stopdesk","");}}>
          <option value="">{T.sel_wilaya}</option>
          {(isStopdesk?STOPDESK_WILAYAS:WILAYAS).map(w=>{
            const f = getFee(delivery,w,form.deliveryType);
            return <option key={w} value={w}>{w}{f!==null?` — ${money(f)}`:""}</option>;
          })}
        </select>
      </div>
      {isStopdesk&&form.wilaya&&(
        <div className="form-group">
          <label className="form-label">{T.f_stopdesk} *</label>
          <select className="form-select" value={form.stopdesk} onChange={e=>set("stopdesk",e.target.value)}>
            <option value="">{T.sel_stopdesk}</option>
            {stopdesks.map(s=><option key={s.name} value={s.name}>{s.name}</option>)}
          </select>
          {selectedStopdesk?.maps&&(<a href={selectedStopdesk.maps} target="_blank" rel="noreferrer" style={{display:"inline-block",marginTop:8,fontSize:"0.78rem",color:"var(--gold)",letterSpacing:"1px"}}>📍 {T.view_map}</a>)}
        </div>
      )}
      {!isStopdesk&&(
        <>
          <div className="form-group">
            <label className="form-label">{T.f_commune} *</label>
            <input className="form-input" value={form.commune} onChange={e=>set("commune",e.target.value)} placeholder={T.sel_commune} />
          </div>
          <div className="form-group">
            <label className="form-label">{T.f_addr} *</label>
            <input className="form-input" value={form.address} onChange={e=>set("address",e.target.value)} />
          </div>
        </>
      )}

      <div className="totals">
        <div><span>{T.subtotal}</span><span>{money(subtotal)}</span></div>
        <div><span>{T.delivery_fee}</span><span>{!form.wilaya?T.select_wilaya_fee:fee===null?T.fee_tbc:money(fee)}</span></div>
        <div className="grand"><span>{T.total}</span><span>{money(total)}</span></div>
      </div>

      {err&&<div className="form-error">{err}</div>}
      <button className="btn-primary" style={{width:"100%",padding:16,opacity:sending?0.6:1}} onClick={handle} disabled={sending}>{sending?"...":T.submit}</button>
    </div>
  );
}

function ConfirmPage({T,order,onBack}) {
  if (!order) return null;
  return (
    <div className="confirm">
      <div className="confirm-icon">✨</div>
      <h2 className="confirm-title">{T.conf_title}</h2>
      <div className="order-no">{T.order_number}<strong dir="ltr">#{order.number!==null&&order.number!==undefined?order.number:"—"}</strong></div>
      <p className="muted" style={{marginTop:-10,marginBottom:20}}>{T.keep_number}</p>
      <div className="receipt">
        <div className="receipt-title">{T.your_order}</div>
        {order.items.map((i,idx)=>(
          <div className="receipt-row" key={idx}><span>{i.productName} × {i.qty}</span><span>{money(i.price*i.qty)}</span></div>
        ))}
        <div className="receipt-row"><span>{T.subtotal}</span><span>{money(order.subtotal)}</span></div>
        <div className="receipt-row"><span>{T.delivery_fee}</span><span>{order.feeKnown?money(order.fee):T.fee_tbc}</span></div>
        <div className="receipt-row grand"><span>{T.total}</span><span>{money(order.total)}</span></div>
        <div className="receipt-meta">
          <div>{order.name}</div>
          <div>{T.delivery_to}: {order.deliveryType==="stopdesk"?T.del_stop:T.del_home} — {order.wilaya}</div>
          <div>{order.place}</div>
        </div>
      </div>
      <p className="confirm-msg">{T.conf_msg}</p>
      <div className="contact-box">
        <div style={{marginBottom:6}}>{T.contact_us}</div>
        <div>📞 {T.lbl_phone}: <a href={`tel:${CONTACT_PHONE}`} dir="ltr">{CONTACT_PHONE}</a></div>
        <div>📸 {T.lbl_instagram}: <a href={`https://instagram.com/${CONTACT_INSTAGRAM}`} target="_blank" rel="noreferrer" dir="ltr">@{CONTACT_INSTAGRAM}</a></div>
        <div>✉️ {T.lbl_email}: <a href={`mailto:${CONTACT_EMAIL}`} dir="ltr">{CONTACT_EMAIL}</a></div>
      </div>
      <button className="btn-primary" onClick={onBack}>{T.conf_back}</button>
    </div>
  );
}
const STATUS_LIST = ["pending","confirmed","delivered","cancelled","returned"];
const STATUS_BG = {pending:"#fffdf3",confirmed:"#f0f7ff",delivered:"#f0fff4",cancelled:"#fff5f5",returned:"#f7f2fc"};
const STATUS_SEL = {pending:["#fef3cd","#856404"],confirmed:["#d1edff","#0a5a8a"],delivered:["#d4edda","#155724"],cancelled:["#fde8e8","#c0392b"],returned:["#ece3f7","#6b3fa0"]};

function AdminLogin({T,onLogin,onBack}) {
  const [email,setEmail] = useState("");
  const [pass,setPass] = useState("");
  const [err,setErr] = useState(false);
  const [loading,setLoading] = useState(false);
  const handle = async ()=>{
    setLoading(true);
    const result = await sbAuth(email,pass);
    if (result.success) await onLogin(result.token);
    else setErr(true);
    setLoading(false);
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
        {err&&<p style={{color:"var(--red)",fontSize:"0.8rem",marginBottom:12}}>{T.adm_wrong}</p>}
        <button className="btn-primary" style={{width:"100%",padding:14,marginBottom:12}} onClick={handle} disabled={loading}>{loading?"...":T.adm_signin}</button>
        <button className="btn-outline" style={{width:"100%",padding:12}} onClick={onBack}>{T.back}</button>
      </div>
    </div>
  );
}

function AdminDashboard({T,tab,setTab,orders,products,ingredients,delivery,onUpdateOrderStatus,onDeleteOrder,onPatchProduct,onAddProduct,onDeleteProduct,onPatchIngredient,onAddIngredient,onDeleteIngredient,onPatchDelivery,onLogout}) {
  const lowP = products.filter(p=>p.stock<=p.threshold).length;
  const lowI = ingredients.filter(i=>i.threshold>0&&i.qty<=i.threshold).length;
  const sales = orders.filter(o=>o.status==="delivered").reduce((s,o)=>s+(Number(o.total)||0),0);
  const tabs = [
    {key:"orders",label:T.adm_orders,icon:"📋"},
    {key:"products",label:T.adm_products,icon:"📦"},
    {key:"ingredients",label:T.adm_ing,icon:"🧪"},
    {key:"delivery",label:T.adm_delivery,icon:"🚚"}
  ];
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-logo">MALVERA</div>
        {tabs.map(tb=>(
          <button key={tb.key} className={`sidebar-link ${tab===tb.key?"active":""}`} onClick={()=>setTab(tb.key)}>
            <span style={{fontSize:"1.1rem"}}>{tb.icon}</span><span>{tb.label}</span>
          </button>
        ))}
        <button className="sidebar-link sidebar-logout" onClick={onLogout}><span style={{fontSize:"1.1rem"}}>🚪</span><span>{T.adm_logout}</span></button>
      </aside>
      <main className="admin-main">
        <h2 className="admin-title">{tabs.find(tb=>tb.key===tab)?.label}</h2>
        <div className="stat-grid">
          <div className="stat-card"><div className="stat-num">{orders.length}</div><div className="stat-label">Total Orders</div></div>
          <div className="stat-card"><div className="stat-num" style={{color:"var(--orange)"}}>{orders.filter(o=>o.status==="pending").length}</div><div className="stat-label">Pending</div></div>
          <div className="stat-card"><div className="stat-num" style={{color:"#155724",fontSize:"1.4rem"}}>{money(sales)}</div><div className="stat-label">{T.sales}</div></div>
          <div className="stat-card"><div className="stat-num" style={{color:"var(--red)"}}>{lowP}</div><div className="stat-label">Low Products</div></div>
          <div className="stat-card"><div className="stat-num" style={{color:"var(--red)"}}>{lowI}</div><div className="stat-label">Low Ingredients</div></div>
        </div>
        {tab==="orders"&&<OrdersTab T={T} orders={orders} onUpdateStatus={onUpdateOrderStatus} onDeleteOrder={onDeleteOrder} />}
        {tab==="products"&&<ProductsTab T={T} products={products} onPatch={onPatchProduct} onAdd={onAddProduct} onDelete={onDeleteProduct} />}
        {tab==="ingredients"&&<IngredientsTab T={T} ingredients={ingredients} onPatch={onPatchIngredient} onAdd={onAddIngredient} onDelete={onDeleteIngredient} />}
        {tab==="delivery"&&<DeliveryTab T={T} delivery={delivery} onPatch={onPatchDelivery} />}
      </main>
    </div>
  );
}

function OrdersTab({T,orders,onUpdateStatus,onDeleteOrder}) {
  const [search,setSearch] = useState("");
  const [filterStatus,setFilterStatus] = useState("all");
  const [filterWilaya,setFilterWilaya] = useState("all");
  const label = {pending:T.s_pending,confirmed:T.s_confirmed,delivered:T.s_delivered,cancelled:T.s_cancelled,returned:T.s_returned};
  const q = search.toLowerCase();
  const filtered = orders.filter(o=>
    (filterStatus==="all"||o.status===filterStatus)&&
    (filterWilaya==="all"||o.wilaya===filterWilaya)&&
    ((o.name||"").toLowerCase().includes(q)||(o.product_name||"").toLowerCase().includes(q)||String(o.order_number||"").includes(q)||(o.phone||"").includes(q))
  );
  const wilayas = [...new Set(orders.map(o=>o.wilaya).filter(Boolean))];
  return (
    <div className="admin-card">
      <div className="search-bar">
        <input className="search-input" placeholder={T.search} value={search} onChange={e=>setSearch(e.target.value)} />
        <select className="select-filter" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
          <option value="all">All Statuses</option>
          {STATUS_LIST.map(s=><option key={s} value={s}>{label[s]}</option>)}
        </select>
        <select className="select-filter" value={filterWilaya} onChange={e=>setFilterWilaya(e.target.value)}>
          <option value="all">All Wilayas</option>
          {wilayas.map(w=><option key={w} value={w}>{w}</option>)}
        </select>
      </div>
      {filtered.length===0?<p style={{color:"var(--muted)",padding:"20px 0"}}>{T.no_orders}</p>:(
        <div style={{overflowX:"auto"}}>
          <table className="rtable">
            <thead><tr><th>{T.c_order}</th><th>{T.c_name}</th><th>{T.c_product}</th><th>{T.c_total}</th><th>{T.c_wilaya}</th><th>Delivery</th><th>{T.c_phone}</th><th>{T.c_date}</th><th>{T.c_status}</th></tr></thead>
            <tbody>
              {filtered.map(o=>{
                const colors = STATUS_SEL[o.status]||STATUS_SEL.pending;
                return (
                  <tr key={o.id} style={{background:STATUS_BG[o.status]||"white"}}>
                    <td data-label={T.c_order}><strong dir="ltr">{o.order_number?`#${o.order_number}`:"—"}</strong></td>
                    <td data-label={T.c_name}><div><strong>{o.name}</strong><br/><span style={{fontSize:"0.75rem",color:"var(--muted)"}}>{o.commune?`${o.commune} - `:""}{o.address}</span></div></td>
                    <td data-label={T.c_product}><div>{o.items&&o.items.length>0?o.items.map((item,i)=><div key={i} style={{fontSize:"0.82rem"}}>{item.productName} <b>x{item.qty}</b></div>):o.product_name}</div></td>
                    <td data-label={T.c_total}>
                      {o.total?(<div style={{textAlign:"inherit"}}><strong>{money(o.total)}</strong><br/><span style={{fontSize:"0.7rem",color:"var(--muted)"}}>{money(o.subtotal)} + {money(o.delivery_fee)}</span></div>):"—"}
                    </td>
                    <td data-label={T.c_wilaya}>{o.wilaya}</td>
                    <td data-label="Delivery"><span className={`badge ${o.delivery_type==="stopdesk"?"badge-confirmed":"badge-pending"}`}>{o.delivery_type==="stopdesk"?"Stop Desk":"Home"}</span></td>
                    <td data-label={T.c_phone}><a href={`tel:${o.phone}`} style={{color:"inherit"}} dir="ltr">{o.phone}</a></td>
                    <td data-label={T.c_date} style={{fontSize:"0.8rem",color:"var(--muted)"}}>{new Date(o.created_at).toLocaleString()}</td>
                    <td data-label={T.c_status}>
                      <div style={{display:"flex",gap:6,alignItems:"center"}}>
                        <select className="status-select" value={o.status} onChange={e=>onUpdateStatus(o.id,e.target.value)} style={{background:colors[0],color:colors[1],fontWeight:500,padding:"8px"}}>
                          {STATUS_LIST.map(s=><option key={s} value={s}>{label[s]}</option>)}
                        </select>
                        <button onClick={()=>{if(window.confirm("Delete this order?")) onDeleteOrder(o.id);}} className="btn-danger" style={{padding:"8px 12px"}}>🗑️</button>
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

function ProductsTab({T,products,onPatch,onAdd,onDelete}) {
  const emptyP = {name:"",category:"face",short_desc:"",full_desc:"",price:"",stock:0,threshold:0,discount_price:""};
  const [edits,setEdits] = useState({});
  const [showAdd,setShowAdd] = useState(false);
  const [newP,setNewP] = useState(emptyP);
  const [uploading,setUploading] = useState({});
  const fileRef = useRef({});
  const setEdit = (id,field,val)=>setEdits(e=>({...e,[id]:{...e[id],[field]:val}}));
  const save = async (p)=>{
    const ed = edits[p.id];
    if (!ed) return;
    const patch = {};
    if (ed.stock!==undefined) patch.stock = Number(ed.stock)||0;
    if (ed.threshold!==undefined) patch.threshold = Number(ed.threshold)||0;
    if (ed.price!==undefined) patch.price = ed.price;
    if (ed.discount_price!==undefined) patch.discount_price = ed.discount_price||null;
    if (ed.short_desc!==undefined) patch.short_desc = ed.short_desc;
    if (ed.full_desc!==undefined) patch.full_desc = ed.full_desc;
    await onPatch(p.id,patch);
    setEdits(e=>{const n={...e};delete n[p.id];return n;});
  };
  const handlePhoto = async (p,file)=>{
    if (!file) return;
    setUploading(u=>({...u,[p.id]:true}));
    const url = await uploadPhoto(file,p.id);
    if (url) await onPatch(p.id,{image_url:url});
    else alert("Photo upload failed.");
    setUploading(u=>({...u,[p.id]:false}));
  };
  const handleAdd = async ()=>{
    if (!newP.name||!newP.price) { alert("Please fill the name and the price."); return; }
    await onAdd({...newP,stock:Number(newP.stock)||0,threshold:Number(newP.threshold)||0,discount_price:newP.discount_price||null});
    setNewP(emptyP);
    setShowAdd(false);
  };
  return (
    <div className="admin-card">
      <button className="btn-add" onClick={()=>setShowAdd(true)}>+ Add New Product</button>
      {showAdd&&(
        <div className="modal-overlay" onClick={()=>setShowAdd(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <h3 className="modal-title">Add New Product</h3>
            {[["name","Product Name"],["short_desc","Short Description"],["price","Price (e.g. 1200 DA)"],["discount_price","Discount Price (optional)"]].map(([k,l])=>(
              <div className="form-group" key={k}>
                <label className="form-label">{l}</label>
                <input className="form-input" value={newP[k]} onChange={e=>setNewP(p=>({...p,[k]:e.target.value}))} />
              </div>
            ))}
            <div className="form-group">
              <label className="form-label">Full Description</label>
              <textarea className="form-textarea" value={newP.full_desc} onChange={e=>setNewP(p=>({...p,full_desc:e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={newP.category} onChange={e=>setNewP(p=>({...p,category:e.target.value}))}>
                {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{display:"flex",gap:12}}>
              <div className="form-group" style={{flex:1}}>
                <label className="form-label">Stock</label>
                <input className="form-input" type="number" min="0" value={newP.stock} onChange={e=>setNewP(p=>({...p,stock:e.target.value}))} />
              </div>
              <div className="form-group" style={{flex:1}}>
                <label className="form-label">Alert at</label>
                <input className="form-input" type="number" min="0" value={newP.threshold} onChange={e=>setNewP(p=>({...p,threshold:e.target.value}))} />
              </div>
            </div>
            <p style={{fontSize:"0.78rem",color:"var(--muted)",marginBottom:12}}>You can add the photo after saving, using the 📷 button in the list.</p>
            <div style={{display:"flex",gap:12}}>
              <button className="btn-primary" style={{flex:1,padding:13}} onClick={handleAdd}>Add Product</button>
              <button className="btn-outline" style={{flex:1,padding:13}} onClick={()=>setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <div style={{overflowX:"auto"}}>
        <table className="rtable">
          <thead><tr><th>Photo</th><th>Product</th><th>{T.stock_qty}</th><th>{T.threshold}</th><th>Price</th><th>Discount</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {products.map(p=>{
              const ed = edits[p.id]||{};
              const isLow = p.stock<=p.threshold;
              const dirty = Object.keys(ed).length>0;
              return (
                <tr key={p.id} className={isLow?"low":""}>
                  <td data-label="Photo">
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                      {p.image_url?<img src={p.image_url} alt="" className="photo-preview" />:<div style={{width:60,height:60,background:"var(--beige2)",borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.5rem"}}>🌿</div>}
                      <input type="file" accept="image/*" style={{display:"none"}} ref={el=>{fileRef.current[p.id]=el;}} onChange={e=>handlePhoto(p,e.target.files[0])} />
                      <button onClick={()=>fileRef.current[p.id]&&fileRef.current[p.id].click()} style={{background:"var(--beige2)",border:"none",cursor:"pointer",padding:"8px 14px",borderRadius:3,fontSize:"0.8rem",fontFamily:"Jost"}}>{uploading[p.id]?"⏳":"📷 Photo"}</button>
                    </div>
                  </td>
                  <td data-label="Product" className="stack">
                    <strong>{p.name}</strong>
                    <span style={{fontSize:"0.72rem",color:"var(--muted)"}}>{p.category}</span>
                    <input className="qty-input" style={{width:"100%",marginTop:6}} type="text" placeholder="Short description" value={ed.short_desc??p.short_desc??""} onChange={e=>setEdit(p.id,"short_desc",e.target.value)} />
                    <textarea style={{width:"100%",marginTop:6,padding:"6px 8px",border:"1px solid var(--beige2)",borderRadius:3,fontSize:"0.82rem",fontFamily:"Jost",resize:"vertical",minHeight:60}} placeholder="Full description" value={ed.full_desc??p.full_desc??""} onChange={e=>setEdit(p.id,"full_desc",e.target.value)} />
                  </td>
                  <td data-label={T.stock_qty}><input className="qty-input" type="number" min="0" value={ed.stock??p.stock} onChange={e=>setEdit(p.id,"stock",e.target.value)} /></td>
                  <td data-label={T.threshold}><input className="qty-input" type="number" min="0" value={ed.threshold??p.threshold} onChange={e=>setEdit(p.id,"threshold",e.target.value)} /></td>
                  <td data-label="Price"><input className="qty-input" style={{width:100}} type="text" value={ed.price??p.price??""} onChange={e=>setEdit(p.id,"price",e.target.value)} /></td>
                  <td data-label="Discount"><input className="qty-input" style={{width:100}} type="text" placeholder="Empty" value={ed.discount_price??p.discount_price??""} onChange={e=>setEdit(p.id,"discount_price",e.target.value)} /></td>
                  <td data-label="Status">{isLow?<span className="badge badge-low">{T.low_stock}</span>:<span className="badge badge-ok">OK</span>}</td>
                  <td className="center">
                    <div style={{display:"flex",gap:6,flexDirection:"column"}}>
                      <button className="btn-save" style={{padding:"9px 14px",opacity:dirty?1:0.5}} onClick={()=>save(p)}>{T.save}</button>
                      <button className="btn-danger" style={{padding:"9px 14px"}} onClick={()=>{if(window.confirm("Delete this product?")) onDelete(p.id);}}>🗑️</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

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

function OrderPage({T,products,cartLines,subtotal,delivery,onChangeQty,onSubmit,onBack}) {
  const ar = T.nav_home==="الرئيسية";
  const L = ar
    ? {explore:"استكشفي المزيد من المنتجات",hide:"إخفاء المنتجات",more:"أضيفي منتجات أخرى",none:"لا توجد منتجات أخرى."}
    : {explore:"Explore more products",hide:"Hide products",more:"Add more products",none:"No other products available."};
  const [form,setForm] = useState({name:"",phone:"",wilaya:"",commune:"",address:"",stopdesk:"",deliveryType:"home"});
  const [showMore,setShowMore] = useState(cartLines.length===0);
  const [sending,setSending] = useState(false);
  const [err,setErr] = useState("");
  const set = (k,v)=>setForm(f=>({...f,[k]:v}));
  const isStopdesk = form.deliveryType==="stopdesk";
  const stopdesks = form.wilaya&&ANDERSON_STOPDESKS[form.wilaya]?ANDERSON_STOPDESKS[form.wilaya]:[];
  const selectedStopdesk = stopdesks.find(s=>s.name===form.stopdesk);
  const fee = form.wilaya?getFee(delivery,form.wilaya,form.deliveryType):null;
  const total = subtotal+(fee||0);
  const available = products.filter(p=>!cartLines.find(l=>l.productId===p.id));

  const handle = async ()=>{
    if (sending) return;
    setErr("");
    if (cartLines.length===0) { setErr(T.err_basket); return; }
    if (!form.name.trim()||!form.phone.trim()||!form.wilaya) { setErr(T.err_fill); return; }
    if (isStopdesk ? !form.stopdesk : (!form.commune.trim()||!form.address.trim())) { setErr(T.err_fill); return; }
    if (!/^(\+213|0)[567]\d{8}$/.test(form.phone.replace(/[\s.\-]/g,""))) { setErr(T.err_phone); return; }
    setSending(true);
    const ok = await onSubmit(form);
    setSending(false);
    if (ok===false) setErr(T.err_send);
  };

  const deliveryBtn = (key,label)=>(
    <button type="button" onClick={()=>{set("deliveryType",key);set("wilaya","");set("stopdesk","");}} style={{flex:1,padding:"12px 6px",border:`2px solid ${form.deliveryType===key?"var(--mocha)":"var(--beige2)"}`,borderRadius:2,background:form.deliveryType===key?"var(--mocha)":"var(--white)",color:form.deliveryType===key?"var(--cream)":"var(--text)",cursor:"pointer",fontFamily:"Jost",fontSize:"0.85rem",transition:"all 0.2s"}}>{label}</button>
  );

  return (
    <div className="order-page">
      <button className="back-btn" onClick={onBack}>{T.back}</button>
      <h2 className="order-title">{T.order_title}</h2>
      <div className="section-line" style={{marginBottom:8}} />

      <h3 className="step-title">1. {T.your_basket}</h3>
      {cartLines.length===0 ? <p className="muted">{T.basket_empty}</p> : (
        <div className="basket">
          {cartLines.map(l=>(
            <div className="basket-row" key={l.productId} style={{flexWrap:"wrap"}}>
              <div className="basket-thumb" style={{width:64,height:64}}>{l.product.image_url?<img src={l.product.image_url} alt="" />:<span>🌿</span>}</div>
              <div className="basket-info">
                <div className="basket-name">{l.name}</div>
                <div className="basket-unit">{money(l.unit)}</div>
              </div>
              <button type="button" className="basket-x" onClick={()=>onChangeQty(l.productId,0)}>✕</button>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",gap:10}}>
                <Stepper qty={l.qty} onChange={q=>onChangeQty(l.productId,q)} />
                <div className="basket-line">{money(l.line)}</div>
              </div>
            </div>
          ))}
          <div className="basket-sub"><span>{T.subtotal}</span><strong>{money(subtotal)}</strong></div>
        </div>
      )}

      <button type="button" className="btn-outline" style={{width:"100%",marginTop:12,padding:14}} onClick={()=>setShowMore(s=>!s)}>
        {showMore ? L.hide : (cartLines.length===0 ? T.choose_products : L.explore)} {showMore?"▲":"▼"}
      </button>

      {showMore&&(
        <div style={{marginTop:14}}>
          {available.length===0 ? <p className="muted">{L.none}</p> : (
            <div className="pick-grid">
              {available.map(p=>(
                <div key={p.id} className="pick-card">
                  <div className="pick-img">{p.image_url?<img src={p.image_url} alt={p.name} />:<span>🌿</span>}</div>
                  <div className="pick-name">{p.name}</div>
                  <div className="pick-price"><PriceDisplay price={p.price} discount_price={p.discount_price} /></div>
                  <button type="button" className="btn-primary pick-add" onClick={()=>onChangeQty(p.id,1)}>+ {T.add_basket}</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <h3 className="step-title">2. {T.your_details}</h3>
      {[["name",T.f_name,"text"],["phone",T.f_phone,"tel"]].map(([k,l,type])=>(
        <div className="form-group" key={k}>
          <label className="form-label">{l} *</label>
          <input className="form-input" type={type} value={form[k]} onChange={e=>set(k,e.target.value)} />
        </div>
      ))}
      <div className="form-group">
        <label className="form-label">{T.del_type} *</label>
        <div style={{display:"flex",gap:12}}>
          {deliveryBtn("home","🏠 "+T.del_home)}
          {deliveryBtn("stopdesk","🏢 "+T.del_stop)}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">{T.f_wilaya} *</label>
        <select className="form-select" value={form.wilaya} onChange={e=>{set("wilaya",e.target.value);set("stopdesk","");}}>
          <option value="">{T.sel_wilaya}</option>
          {(isStopdesk?STOPDESK_WILAYAS:WILAYAS).map(w=>{
            const f = getFee(delivery,w,form.deliveryType);
            return <option key={w} value={w}>{w}{f!==null?` — ${money(f)}`:""}</option>;
          })}
        </select>
      </div>
      {isStopdesk&&form.wilaya&&(
        <div className="form-group">
          <label className="form-label">{T.f_stopdesk} *</label>
          <select className="form-select" value={form.stopdesk} onChange={e=>set("stopdesk",e.target.value)}>
            <option value="">{T.sel_stopdesk}</option>
            {stopdesks.map(s=><option key={s.name} value={s.name}>{s.name}</option>)}
          </select>
          {selectedStopdesk?.maps&&(<a href={selectedStopdesk.maps} target="_blank" rel="noreferrer" style={{display:"inline-block",marginTop:8,fontSize:"0.78rem",color:"var(--gold)",letterSpacing:"1px"}}>📍 {T.view_map}</a>)}
        </div>
      )}
      {!isStopdesk&&(
        <>
          <div className="form-group">
            <label className="form-label">{T.f_commune} *</label>
            <input className="form-input" value={form.commune} onChange={e=>set("commune",e.target.value)} placeholder={T.sel_commune} />
          </div>
          <div className="form-group">
            <label className="form-label">{T.f_addr} *</label>
            <input className="form-input" value={form.address} onChange={e=>set("address",e.target.value)} />
          </div>
        </>
      )}

      <div className="totals">
        <div><span>{T.subtotal}</span><span>{money(subtotal)}</span></div>
        <div><span>{T.delivery_fee}</span><span>{!form.wilaya?T.select_wilaya_fee:fee===null?T.fee_tbc:money(fee)}</span></div>
        <div className="grand"><span>{T.total}</span><span>{money(total)}</span></div>
      </div>

      {err&&<div className="form-error">{err}</div>}
      <button className="btn-primary" style={{width:"100%",padding:16,opacity:sending?0.6:1}} onClick={handle} disabled={sending}>{sending?"...":T.submit}</button>
    </div>
  );
}
