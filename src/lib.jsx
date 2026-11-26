export const SUPABASE_URL = "https://oknqxjijpebnyogcpeee.supabase.co";
export const SUPABASE_KEY = "sb_publishable_f2GocL92eVimF-c3ugdnGQ_izZygETk";

// Admin login session (kept in memory only)
let SESSION = null;

export const authHeaders = () => ({
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SESSION ? SESSION.access : SUPABASE_KEY}`,
});

let refreshing = null;
const refreshSession = () => {
  if (!SESSION || !SESSION.refresh) return Promise.resolve(false);
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
          method: "POST",
          headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: SESSION.refresh }),
        });
        const data = await res.json();
        if (data.access_token) {
          SESSION = { access: data.access_token, refresh: data.refresh_token };
          return true;
        }
      } catch (e) {}
      SESSION = null;
      return false;
    })().finally(() => { refreshing = null; });
  }
  return refreshing;
};

export const sb = async (path, opts = {}, retry = true) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
      ...(path.startsWith("rpc/") ? {} : { Prefer: "return=representation" }),
      ...(opts.headers || {}),
    },
  });
  if (res.status === 401 && retry && SESSION && (await refreshSession())) {
    return sb(path, opts, false);
  }
  const text = await res.text();
  if (!res.ok) { console.error(text); throw new Error(text); }
  return text ? JSON.parse(text) : [];
};

export const sbAuth = async (email, pass) => {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: pass }),
  });
  const data = await res.json();
  if (data.access_token) {
    SESSION = { access: data.access_token, refresh: data.refresh_token };
    return { success: true };
  }
  return { success: false };
};

export const signOut = () => { SESSION = null; };

export const uploadPhoto = async (file, productId) => {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `product-${productId}-${Date.now()}.${ext}`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/products/${path}`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/products/${path}`;
};
export const toNum = (v) => parseInt(String(v ?? "").replace(/[^\d]/g, ""), 10) || 0;
export const unitPrice = (p) => toNum(p.discount_price) || toNum(p.price);
export const getFee = (delivery, wilaya, type) => {
  const row = delivery.find((d) => d.wilaya === wilaya);
  if (!row) return null;
  return Number(type === "stopdesk" ? row.stopdesk : row.home);
};
export const WILAYAS = ["Adrar","Chlef","Laghouat","Oum El Bouaghi","Batna","Béjaïa","Biskra","Béchar","Blida","Bouira","Tamanrasset","Tébessa","Tlemcen","Tiaret","Tizi Ouzou","Alger","Djelfa","Jijel","Sétif","Saïda","Skikda","Sidi Bel Abbès","Annaba","Guelma","Constantine","Médéa","Mostaganem","M'Sila","Mascara","Ouargla","Oran","El Bayadh","Illizi","Bordj Bou Arréridj","Boumerdès","El Tarf","Tindouf","Tissemsilt","El Oued","Khenchela","Souk Ahras","Tipaza","Mila","Aïn Defla","Naâma","Aïn Témouchent","Ghardaïa","Relizane","Timimoun","Bordj Badji Mokhtar","Ouled Djellal","Béni Abbès","In Salah","In Guezzam","Touggourt","Djanet","El M'Ghair","El Meniaa"];

export const ANDERSON_STOPDESKS = {
  "Adrar":[{name:"Station Adrar",maps:"https://maps.app.goo.gl/e5kwRmwmo67GEwJ86"}],
  "Chlef":[{name:"Station Chlef",maps:"https://maps.app.goo.gl/VTna2gw3i6KRQ9pD8"},{name:"Station Chlef Ténès",maps:""}],
  "Laghouat":[{name:"Station Laghouat",maps:"https://maps.app.goo.gl/c6om88PyezNU3vmu9"},{name:"Station Laghouat New",maps:"https://maps.app.goo.gl/svydvVAmEqXkm8rh8"},{name:"Station Laghouat Aflou",maps:"https://maps.app.goo.gl/eCAEDjKLhXNzW9fq9"}],
  "Oum El Bouaghi":[{name:"Station Oum El Bouaghi",maps:"https://maps.app.goo.gl/Za6dHPyzm6PH7uVL6"},{name:"Station Ain Fekroune",maps:"https://maps.app.goo.gl/JC1oRpVBQoaKVmrw7"},{name:"Station Ain M'Lila",maps:"https://maps.app.goo.gl/u4we5hCSTRjCUCXQ9"}],
  "Batna":[{name:"Station Batna",maps:"https://maps.app.goo.gl/KxRNJQ535AwAwXJq8"},{name:"Station Batna Cité El Amrani",maps:"https://maps.app.goo.gl/WmCjZ7vRsJaTEZT98"}],
  "Béjaïa":[{name:"Station Béjaïa",maps:"https://maps.app.goo.gl/oQh2eGmLEndBmzko7"},{name:"Station Béjaïa Akbou",maps:"https://maps.app.goo.gl/y2GjkFvx9CVChDRD6"},{name:"Station Béjaïa El Kseur",maps:"https://maps.app.goo.gl/yrZst9s8W6jxQkdE9"}],
  "Biskra":[{name:"Station Biskra",maps:"https://maps.app.goo.gl/Zb8mzZEVf2wRPDK3A"}],
  "Béchar":[{name:"Station Béchar",maps:"https://maps.app.goo.gl/jWbpQpHJSbKYwimD9"}],
  "Blida":[{name:"Station Blida",maps:"https://maps.app.goo.gl/9UkBYddSCQkHGWob9"},{name:"Station Blida Boufarik",maps:"https://maps.app.goo.gl/zzBXZtyxBhUPxpvT8"},{name:"Station Blida El Affroune",maps:"https://maps.app.goo.gl/aoRXgowQQryxe5Tg7"}],
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
export const STOPDESK_WILAYAS = Object.keys(ANDERSON_STOPDESKS);

export const money = (n) => `${Number(n || 0).toLocaleString("en-US")} DA`;
export const waLink = (num, text) => {
  let d = String(num || "").replace(/\D/g, "");
  if (d.startsWith("0")) d = "213" + d.slice(1);
  return `https://wa.me/${d}${text ? "?text=" + encodeURIComponent(text) : ""}`;
};
export const normPhone = (p) => {
  let d = String(p || "").replace(/\D/g, "");
  if (d.startsWith("213")) d = "0" + d.slice(3);
  return d;
};
export const STATUS_LIST = ["pending","preorder","confirmed","delivered","cancelled","returned"];
export const STATUS_BG = {pending:"#fffdf3",preorder:"#fff7ec",confirmed:"#f0f7ff",delivered:"#f0fff4",cancelled:"#fff5f5",returned:"#f7f2fc"};
export const STATUS_SEL = {pending:["#fef3cd","#856404"],preorder:["#ffe5c2","#8a4b08"],confirmed:["#d1edff","#0a5a8a"],delivered:["#d4edda","#155724"],cancelled:["#fde8e8","#c0392b"],returned:["#ece3f7","#6b3fa0"]};

// ---------- product helpers ----------
export const imgsOf = (p) => (Array.isArray(p.images) && p.images.length ? p.images : p.image_url ? [p.image_url] : []).slice(0, 5);
export const isSold = (p) => Number(p.stock) <= 0;
export const canBuy = (p) => !isSold(p) || !!p.preorder;
export const pText = (p, base, lang) => {
  const a = lang === "ar" ? p[base + "_ar"] : p[base];
  const b = lang === "ar" ? p[base] : p[base + "_ar"];
  return (a && String(a).trim()) ? a : (b || "");
};
export const pDet = (p, k, lang) => {
  const d = p.details || {};
  const o = lang === "ar" ? "en" : "ar";
  return (d[k + "_" + lang] && String(d[k + "_" + lang]).trim()) ? d[k + "_" + lang] : (d[k + "_" + o] || "");
};
export const DETAIL_FIELDS = [
  ["size", "Size / quantity", "الحجم / الكمية"],
  ["usage", "How to use", "طريقة الاستعمال"],
  ["suitability", "Suitable for", "مناسب لـ"],
  ["precautions", "Precautions", "احتياطات"],
  ["storage", "Storage", "التخزين"],
  ["experience", "What to expect", "ماذا تتوقعين"],
  ["ingredients", "Ingredients", "المكونات"],
];

export function Rich({ text }) {
  if (!text) return null;
  return (
    <>
      {String(text).split("\n").map((ln, i) => (
        <div key={i} className={ln.trim() === "" ? "rich-gap" : "rich-ln"}>
          {ln.split(/(\*\*[^*]+\*\*)/g).map((s, j) => (/^\*\*[^*]+\*\*$/.test(s) ? <strong key={j}>{s.slice(2, -2)}</strong> : s))}
        </div>
      ))}
    </>
  );
}

const ICONS = {
  bag: <><path d="M5 8h14l-1.2 11H6.2z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
  leaf: <><path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14" /><path d="M5 19c3-4 6-7 10-9" /></>,
  drop: <path d="M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11z" />,
  truck: <><path d="M3 6h11v10H3z" /><path d="M14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></>,
  check: <><circle cx="12" cy="12" r="9" /><path d="M8 12.5l3 3 5-6" /></>,
  pin: <><path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  wa: <><path d="M3 21l1.6-4.6A8.5 8.5 0 1 1 8 19.6z" /><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.5-2-1-1 .8c-1-.4-1.9-1.3-2.3-2.3l.8-1-1-2z" /></>,
  ig: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></>,
  tt: <><path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" /><path d="M14 3c.3 2.5 2 4.2 4.5 4.5" /></>,
  home: <><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /></>,
  building: <><path d="M4 21V5l8-2 8 2v16" /><path d="M9 9h2M13 9h2M9 13h2M13 13h2M10 21v-4h4v4" /></>,
  down: <path d="M6 9l6 6 6-6" />,
  left: <path d="M15 5l-7 7 7 7" />,
  right: <path d="M9 5l7 7-7 7" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
};
export const Ico = ({ n, s = 20 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>{ICONS[n]}</svg>
);
export const Stars = ({ n = 5, s = 18 }) => (
  <div style={{ display: "flex", gap: 4 }}>
    {[1, 2, 3, 4, 5].map((i) => (
      <svg key={i} width={s} height={s} viewBox="0 0 24 24" fill={i <= n ? "#c9a96e" : "none"} stroke="#c9a96e" strokeWidth="1.4" aria-hidden="true"><path d="M12 2l3 6.9 7.5.7-5.7 5 1.7 7.4L12 18.2 5.5 22l1.7-7.4-5.7-5 7.5-.7z" /></svg>
    ))}
  </div>
);
export function Stepper({ qty, onChange }) {
  return (
    <div className="stepper">
      <button type="button" onClick={() => onChange(qty - 1)}>−</button>
      <input type="number" inputMode="numeric" min="1" value={qty} onChange={(e) => { if (e.target.value !== "") onChange(e.target.value); }} />
      <button type="button" onClick={() => onChange(qty + 1)}>+</button>
    </div>
  );
}

export const ING_CATEGORIES = ["Base Ingredients","Actives & Acids","Preservatives","Waxes, Emulsifiers & Texture Agents","Clays & Powders","Essential Oils","Fragrance Oils","Herbs, Seeds & Botanicals","Other"];

// ---------- texts you can edit from the admin (Site texts tab) ----------
export const TEXT_GROUPS = [
  { g: "Home page - top", items: [
    ["hero_tag", "Small title above the name", "NATURAL TALLOW COSMETICS", "مستحضرات تجميل طبيعية بشحم البقر"],
    ["hero_tagline", "Tagline under MALVERA", "Skin care rooted in tradition.", "عناية بالبشرة متجذّرة في الأصالة."],
    ["hero_desc", "Paragraph", "Every Malvera product is handcrafted with pure, premium ingredients, centered around the power of beef tallow, to nourish, strengthen and restore balance to your skin, lips and hair.", "كل منتج من Malvera مصنوع يدويًا من مكونات نقية وفاخرة، في قلبها شحم البقر، لتغذية بشرتك وشفاهك وشعرك وتقويتها وإعادة توازنها."],
    ["hero_btn1", "First button", "Shop the collection", "تسوقي المجموعة"],
    ["hero_btn2", "Second button", "Our story", "قصتنا"],
  ]},
  { g: "Home page - 4 trust badges", items: [
    ["t1", "Badge 1 title", "Premium ingredients", "مكونات فاخرة"], ["t1s", "Badge 1 small text", "Pure and carefully chosen", "نقية ومختارة بعناية"],
    ["t2", "Badge 2 title", "Formulated by professional hands", "تركيبة بأيادٍ محترفة"], ["t2s", "Badge 2 small text", "Made in Algeria", "صنع في الجزائر"],
    ["t3", "Badge 3 title", "Delivery to 58 wilayas", "توصيل إلى 58 ولاية"], ["t3s", "Badge 3 small text", "Home or stop desk", "للمنزل أو نقطة الاستلام"],
    ["t4", "Badge 4 title", "We confirm every order", "نؤكد كل طلب"], ["t4s", "Badge 4 small text", "By phone, before shipping", "عبر الهاتف قبل الشحن"],
  ]},
  { g: "Home page - sections", items: [
    ["cats_eyebrow", "Collections: small title", "SHOP BY NEED", "تسوقي حسب الحاجة"],
    ["cats_title", "Collections: big title", "Find what your skin needs", "اكتشفي ما تحتاجه بشرتك"],
    ["coll_eyebrow", "Products: small title", "THE COLLECTION", "المجموعة"],
    ["coll_title", "Products: big title", "Handmade, one by one", "صنع يدوي، قطعة بقطعة"],
    ["story_eyebrow", "Our story: small title", "OUR STORY", "قصتنا"],
    ["story_title", "Our story: big title", "Timeless beauty, made the traditional way", "جمال خالد، بالطريقة التقليدية"],
    ["story_text", "Our story: paragraph", "Malvera is formulated and made by hand in Algeria. We believe in beauty rooted in tradition, so every product is built around beef tallow and pure natural ingredients, with nothing added just to fill the jar.", "Malvera منتجات مصنوعة يدويًا في الجزائر. نؤمن بجمال متجذّر في الأصالة، لذلك يقوم كل منتج على شحم البقر ومكونات طبيعية نقية، دون إضافة أي شيء لمجرد ملء العلبة."],
    ["story_b1", "Our story: point 1", "Every ingredient is listed on the product page", "جميع المكونات مدرجة في صفحة المنتج"],
    ["story_b2", "Our story: point 2", "How to use it, who it suits and how to store it", "طريقة الاستعمال ولمن يناسب وكيفية التخزين"],
    ["story_b3", "Our story: point 3", "Available in English and Arabic", "متوفر بالعربية والإنجليزية"],
    ["steps_eyebrow", "Steps: small title", "HOW IT WORKS", "كيف يعمل الطلب"],
    ["steps_title", "Steps: big title", "Order in three easy steps", "اطلبي في ثلاث خطوات"],
    ["step1_t", "Step 1 title", "Choose your products", "اختاري منتجاتك"], ["step1_d", "Step 1 text", "Add as many as you like to your basket and pick the quantity of each one.", "أضيفي ما تشائين إلى السلة وحددي كمية كل منتج."],
    ["step2_t", "Step 2 title", "Choose where to receive it", "اختاري مكان الاستلام"], ["step2_d", "Step 2 text", "Home delivery or a stop desk near you. You see the delivery price and your total right away.", "توصيل للمنزل أو إلى نقطة استلام قريبة منك. ترين سعر التوصيل والمجموع فورًا."],
    ["step3_t", "Step 3 title", "We call to confirm", "نتصل بك للتأكيد"], ["step3_d", "Step 3 text", "You get an order number, we contact you, then Anderson delivers your order.", "تحصلين على رقم الطلب، نتواصل معك، ثم تقوم Anderson بتوصيل طلبك."],
    ["reviews_eyebrow", "Reviews: small title", "CUSTOMER REVIEWS", "آراء العملاء"],
    ["reviews_title", "Reviews: big title", "Loved by our customers", "محبوبة لدى عميلاتنا"],
    ["stop_eyebrow", "Stop desk block: small title", "STOP DESK DELIVERY", "التوصيل إلى نقطة الاستلام"],
    ["stop_title", "Stop desk block: big title", "Collect your order close to home", "استلمي طلبك قرب منزلك"],
    ["stop_desc", "Stop desk block: text", "Pick your wilaya and your stop desk, then see exactly where it is on the map.", "اختاري ولايتك ونقطة الاستلام، ثم شاهدي موقعها بالضبط على الخريطة."],
    ["footer_desc", "Footer text", "Natural tallow-based cosmetics, handcrafted with love in Algeria.", "مستحضرات تجميل طبيعية بشحم البقر، مصنوعة بحب في الجزائر."],
  ]},
  { g: "Messages", items: [
    ["preorder_note", "Pre-order message (order page and confirmation)", "Some items in your basket are on pre-order. We will contact you to tell you when your order will be ready for delivery.", "بعض المنتجات في سلتك متوفرة بالطلب المسبق. سنتواصل معك لإخبارك بموعد جاهزية طلبك للتوصيل."],
  ]},
  { g: "Contact and social links (write the same value in both boxes or only English)", items: [
    ["c_whatsapp", "WhatsApp / phone number", "0541913440", "0541913440"],
    ["c_instagram", "Instagram username (no @)", "malveraofficial", "malveraofficial"],
    ["c_tiktok", "TikTok username (no @)", "malvera_official", "malvera_official"],
    ["c_email", "Email", "maleraofficiel@gmail.com", "maleraofficiel@gmail.com"],
  ]},
];
export const DEFAULTS = {};
TEXT_GROUPS.forEach((g) => g.items.forEach(([k, , en, ar]) => { DEFAULTS[k] = { en, ar }; }));

export const TR = {
  en: {
    nav_home: "Home", nav_shop: "Shop", nav_story: "Our story", nav_contact: "Contact", basket: "Basket",
    cat_title: "Our Collection", f_all: "All", details_btn: "Details", back: "← Back", back_shop: "← Back to shop",
    order_title: "Your Order", f_name: "Full Name", f_phone: "Phone Number", f_wilaya: "Wilaya", f_addr: "Delivery Address",
    sel_wilaya: "Select your wilaya", submit: "Place Order", conf_title: "Order Received!", conf_back: "Back to Shop",
    adm_login: "Admin Login", adm_email: "Email", adm_pass: "Password", adm_signin: "Sign In", adm_wrong: "Invalid credentials",
    adm_orders: "Orders", adm_products: "Products", adm_ing: "Ingredients", adm_delivery: "Delivery", adm_logout: "Logout",
    s_pending: "Pending", s_preorder: "Pre-order", s_confirmed: "Confirmed", s_delivered: "Delivered", s_cancelled: "Cancelled", s_returned: "Returned",
    low_stock: "Low Stock", save: "Save", search: "Search...", c_name: "Customer", c_order: "Order", c_product: "Products", c_qty: "Qty",
    c_total: "Total", c_wilaya: "Wilaya", c_phone: "Phone", c_date: "Date", c_status: "Status", no_orders: "No orders yet.",
    threshold: "Alert", stock_qty: "Stock", loading: "Loading...", del_type: "Delivery Type", del_home: "Home Delivery", del_stop: "Stop Desk",
    f_commune: "Commune", f_stopdesk: "Select Stop Desk", sel_commune: "Enter your commune", sel_stopdesk: "Select a stop desk",
    home_price: "Home price (DA)", stop_price: "Stop desk price (DA)", sales: "Sales (delivered)",
    add_basket: "Add to basket", view_basket: "View basket", choose_products: "Choose your products", your_basket: "Your basket",
    basket_empty: "Your basket is empty. Add products above.", your_details: "Your details", subtotal: "Subtotal", delivery_fee: "Delivery",
    total: "Total", fee_tbc: "To be confirmed", select_wilaya_fee: "Select your wilaya",
    err_basket: "Please add at least one product to your basket.", err_fill: "Please fill in all the required fields.",
    err_phone: "Please enter a valid phone number (example: 0555123456).", err_send: "Sorry, your order could not be sent. Please try again.",
    err_stock: "Sorry, one of the products is no longer available in the quantity you chose. Please check your basket.",
    order_number: "Order number", your_order: "Your order", keep_number: "Please keep your order number.",
    conf_msg: "Thank you! We have received your order and we will contact you very soon to confirm it.",
    contact_us: "For more information, you can contact us:", lbl_phone: "Phone", lbl_instagram: "Instagram", lbl_email: "Email", delivery_to: "Delivery",
    sold_out: "Sold out", preorder: "Pre-order", preorder_btn: "Pre-order", in_stock: "In stock", few_left: "Only a few left",
    out_stock: "Out of stock", qty: "Quantity", view_all: "View all products", explore: "Explore", more_like: "You may also like",
    shop_wa: "Order on WhatsApp", pre_tag: "pre-order",
    stop_map_btn: "Click here to see the location of your stopdesk", stop_pick: "Choose your stop desk above, then you can see its location on the map.",
    stop_nomap: "The map location of this stop desk is not available yet. We will send it to you when we contact you.",
    stop_sel_w: "Your wilaya", stop_sel_s: "Your stop desk", explore_more: "Explore more products", hide_more: "Hide products", no_other: "No other products available.",
    no_products: "No products in this collection yet.", off: "OFF", reviews_none: "",
  },
  ar: {
    nav_home: "الرئيسية", nav_shop: "المتجر", nav_story: "قصتنا", nav_contact: "اتصلي بنا", basket: "السلة",
    cat_title: "مجموعتنا", f_all: "الكل", details_btn: "التفاصيل", back: "→ رجوع", back_shop: "→ العودة للمتجر",
    order_title: "طلبك", f_name: "الاسم الكامل", f_phone: "رقم الهاتف", f_wilaya: "الولاية", f_addr: "عنوان التوصيل",
    sel_wilaya: "اختاري ولايتك", submit: "إرسال الطلب", conf_title: "تم استلام طلبك!", conf_back: "العودة للمتجر",
    adm_login: "تسجيل الدخول", adm_email: "البريد", adm_pass: "كلمة المرور", adm_signin: "دخول", adm_wrong: "بيانات غير صحيحة",
    adm_orders: "الطلبات", adm_products: "المنتجات", adm_ing: "المكونات", adm_delivery: "التوصيل", adm_logout: "خروج",
    s_pending: "قيد الانتظار", s_preorder: "طلب مسبق", s_confirmed: "مؤكد", s_delivered: "تم التوصيل", s_cancelled: "ملغى", s_returned: "مرتجع",
    low_stock: "مخزون منخفض", save: "حفظ", search: "بحث...", c_name: "العميلة", c_order: "الطلب", c_product: "المنتجات", c_qty: "الكمية",
    c_total: "المجموع", c_wilaya: "الولاية", c_phone: "الهاتف", c_date: "التاريخ", c_status: "الحالة", no_orders: "لا توجد طلبات بعد.",
    threshold: "حد التنبيه", stock_qty: "الكمية", loading: "جاري التحميل...", del_type: "نوع التوصيل", del_home: "توصيل للمنزل", del_stop: "نقطة استلام",
    f_commune: "البلدية", f_stopdesk: "اختاري نقطة الاستلام", sel_commune: "أدخلي بلديتك", sel_stopdesk: "اختاري نقطة الاستلام",
    home_price: "سعر التوصيل للمنزل (دج)", stop_price: "سعر نقطة الاستلام (دج)", sales: "المبيعات (المسلّمة)",
    add_basket: "أضيفي إلى السلة", view_basket: "عرض السلة", choose_products: "اختاري منتجاتك", your_basket: "سلتك",
    basket_empty: "سلتك فارغة. أضيفي منتجات من الأعلى.", your_details: "معلوماتك", subtotal: "المجموع الجزئي", delivery_fee: "التوصيل",
    total: "المجموع", fee_tbc: "سيتم تأكيده", select_wilaya_fee: "اختاري الولاية",
    err_basket: "يرجى إضافة منتج واحد على الأقل إلى السلة.", err_fill: "يرجى ملء جميع الحقول المطلوبة.",
    err_phone: "يرجى إدخال رقم هاتف صحيح (مثال: 0555123456).", err_send: "عذراً، تعذّر إرسال طلبك. يرجى المحاولة مرة أخرى.",
    err_stock: "عذراً، أحد المنتجات لم يعد متوفراً بالكمية التي اخترتها. يرجى مراجعة سلتك.",
    order_number: "رقم الطلب", your_order: "طلبك", keep_number: "يرجى الاحتفاظ برقم الطلب.",
    conf_msg: "شكراً لكِ! لقد استلمنا طلبك وسنتواصل معكِ قريباً جداً لتأكيده.",
    contact_us: "لمزيد من المعلومات يمكنكِ التواصل معنا:", lbl_phone: "الهاتف", lbl_instagram: "إنستغرام", lbl_email: "البريد الإلكتروني", delivery_to: "التوصيل",
    sold_out: "نفد المخزون", preorder: "طلب مسبق", preorder_btn: "اطلبي مسبقاً", in_stock: "متوفر", few_left: "كمية قليلة",
    out_stock: "غير متوفر", qty: "الكمية", view_all: "عرض كل المنتجات", explore: "اكتشفي", more_like: "قد يعجبك أيضاً",
    shop_wa: "اطلبي عبر واتساب", pre_tag: "طلب مسبق",
    stop_map_btn: "اضغطي هنا لرؤية موقع نقطة الاستلام على الخريطة", stop_pick: "اختاري نقطة الاستلام أعلاه، ثم يمكنك رؤية موقعها على الخريطة.",
    stop_nomap: "موقع نقطة الاستلام هذه على الخريطة غير متوفر بعد. سنرسله لك عند التواصل معك.",
    stop_sel_w: "ولايتك", stop_sel_s: "نقطة الاستلام", explore_more: "استكشفي المزيد من المنتجات", hide_more: "إخفاء المنتجات", no_other: "لا توجد منتجات أخرى.",
    no_products: "لا توجد منتجات في هذه المجموعة بعد.", off: "خصم", reviews_none: "",
  },
};

export const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{--beige:#f5ede0;--beige2:#ede0cc;--cream:#faf6f0;--mocha:#4a3728;--mocha2:#6b4f3a;--gold:#c9a96e;--gold2:#e8c98a;--gold3:#8a6420;--text:#2d1f14;--muted:#7a6252;--red:#c0392b;--orange:#e67e22;--green:#2f7a45;--white:#fff;--shadow:0 4px 24px rgba(74,55,40,0.12);--shadow2:0 2px 14px rgba(74,55,40,0.08);}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth;}
body{font-family:'Jost',sans-serif;background:var(--cream);color:var(--text);min-height:100vh;overflow-x:hidden;}
h1,h2,h3{font-family:'Cormorant Garamond',serif;}
img{max-width:100%;display:block;}
a{color:inherit;text-decoration:none;}
button{font-family:inherit;}
.rtl{direction:rtl;text-align:right;font-family:'Cairo','Jost',sans-serif;}
.ltr{direction:ltr;text-align:left;}
.rtl h1,.rtl h2,.rtl h3,.rtl .serif{font-family:'Cairo','Cormorant Garamond',serif;font-weight:600;}
.rtl *{letter-spacing:0 !important;}
.rtl .brand{letter-spacing:6px !important;font-family:'Cormorant Garamond',serif !important;}
.rtl .ital,.rtl em{font-style:normal !important;}
.muted{color:var(--muted);font-size:0.9rem;}
.wrap{max-width:1240px;margin:0 auto;padding:0 40px;}
.section{padding-top:88px;}
.eyebrow{font-size:0.76rem;letter-spacing:4px;color:var(--gold3);font-weight:500;text-transform:uppercase;}
.h2{font-size:clamp(2rem,4.4vw,3.2rem);font-weight:500;color:var(--mocha);line-height:1.1;margin-top:10px;}
.center{text-align:center;}
.btn-primary{background:var(--mocha);color:var(--cream);border:none;cursor:pointer;padding:15px 34px;font-size:0.8rem;letter-spacing:2.5px;text-transform:uppercase;border-radius:4px;transition:all .25s;display:inline-block;text-align:center;}
.btn-primary:hover{background:var(--gold);color:var(--mocha);}
.btn-primary:disabled{opacity:.5;cursor:not-allowed;}
.btn-outline{background:transparent;color:var(--mocha);border:1px solid var(--mocha);cursor:pointer;padding:14px 32px;font-size:0.8rem;letter-spacing:2.5px;text-transform:uppercase;border-radius:4px;transition:all .25s;display:inline-block;text-align:center;}
.btn-outline:hover{background:var(--mocha);color:var(--cream);}
.nav{position:sticky;top:0;z-index:100;background:rgba(245,237,224,0.97);backdrop-filter:blur(12px);border-bottom:1px solid var(--beige2);}
.nav-in{max-width:1240px;margin:0 auto;padding:0 40px;min-height:80px;display:flex;align-items:center;justify-content:space-between;gap:16px;}
.nav-logo{font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:600;letter-spacing:7px;color:var(--mocha);cursor:pointer;background:none;border:none;}
.nav-links{display:flex;gap:34px;}
.nav-link{background:none;border:none;cursor:pointer;font-size:0.8rem;letter-spacing:2px;text-transform:uppercase;color:var(--mocha);padding:8px 0;border-bottom:1px solid transparent;}
.nav-link:hover,.nav-link.active{color:var(--gold3);border-bottom-color:var(--gold);}
.nav-act{display:flex;gap:10px;align-items:center;}
.lang-btn{background:transparent;border:1px solid var(--mocha);color:var(--mocha);cursor:pointer;padding:9px 16px;border-radius:22px;font-size:0.8rem;}
.basket-btn{display:inline-flex;align-items:center;gap:10px;background:var(--mocha);color:var(--cream);border:none;border-radius:24px;padding:10px 20px;font-size:0.78rem;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;}
.cart-badge{background:var(--gold);color:var(--mocha);border-radius:10px;min-width:20px;height:20px;display:inline-flex;align-items:center;justify-content:center;font-size:0.72rem;font-weight:500;letter-spacing:0;}
.hero{position:relative;overflow:hidden;background:radial-gradient(circle at 12% 25%,#e1e7d3 0,transparent 45%),radial-gradient(circle at 90% 85%,#ecdcc0 0,transparent 50%),#f7f1e6;}
.hero-bg{position:absolute;inset:0;background-size:cover;background-position:center;opacity:.2;}
.hero-leaf{position:absolute;opacity:.28;pointer-events:none;}
.hero-in{position:relative;z-index:1;max-width:900px;margin:0 auto;padding:110px 24px 120px;text-align:center;}
.hero-title{font-size:clamp(3rem,10vw,6rem);font-weight:600;letter-spacing:clamp(6px,1.6vw,16px);line-height:1;color:var(--mocha);margin-top:20px;}
.hero-tagline{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:clamp(1.4rem,3.4vw,2.4rem);color:var(--mocha2);margin-top:16px;}
.hero-desc{margin:24px auto 0;max-width:560px;font-size:1.05rem;line-height:1.8;color:var(--mocha2);font-weight:300;}
.hero-btns{margin-top:36px;display:flex;flex-wrap:wrap;gap:14px;justify-content:center;}
.trust{background:var(--white);border-top:1px solid var(--beige2);border-bottom:1px solid var(--beige2);}
.trust-in{max-width:1240px;margin:0 auto;padding:32px 40px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:26px;}
.trust-i{display:flex;align-items:center;gap:14px;color:var(--mocha);}
.trust-i b{display:block;font-size:0.95rem;font-weight:500;}
.trust-i small{display:block;font-size:0.8rem;color:var(--muted);margin-top:2px;}
.cats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:22px;margin-top:38px;}
.cat-card{display:block;border-radius:14px;overflow:hidden;background:var(--white);box-shadow:var(--shadow2);cursor:pointer;border:none;text-align:inherit;transition:transform .25s;}
.cat-card:hover{transform:translateY(-4px);}
.cat-img{height:240px;background:linear-gradient(135deg,var(--beige),var(--beige2));overflow:hidden;}
.cat-img img{width:100%;height:100%;object-fit:cover;}
.cat-foot{padding:16px 20px;display:flex;justify-content:space-between;align-items:center;gap:8px;}
.cat-foot b{font-family:'Cormorant Garamond',serif;font-size:1.6rem;color:var(--mocha);font-weight:600;}
.rtl .cat-foot b{font-family:'Cairo',serif;font-size:1.3rem;}
.cat-foot span{font-size:0.8rem;color:var(--gold3);letter-spacing:1px;}
.head-row{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:14px;}
.link-u{font-size:0.82rem;letter-spacing:2px;text-transform:uppercase;color:var(--mocha);border-bottom:1px solid var(--mocha);padding-bottom:4px;background:none;border-top:none;border-left:none;border-right:none;cursor:pointer;}
.pgrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:22px;margin-top:38px;}
.pcard{background:var(--white);border-radius:14px;overflow:hidden;box-shadow:var(--shadow2);cursor:pointer;display:flex;flex-direction:column;transition:transform .25s,box-shadow .25s;}
.pcard:hover{transform:translateY(-4px);box-shadow:var(--shadow);}
.pimg{position:relative;aspect-ratio:1/1;background:linear-gradient(135deg,var(--beige),var(--beige2));overflow:hidden;display:flex;align-items:center;justify-content:center;color:var(--muted);}
.pimg img{width:100%;height:100%;object-fit:cover;}
.pimg.soldimg img{opacity:.55;}
.tag{position:absolute;top:12px;inset-inline-start:12px;background:var(--mocha);color:var(--gold2);font-size:0.7rem;letter-spacing:1.5px;padding:6px 12px;border-radius:14px;text-transform:uppercase;}
.tag.red{background:#8c2f24;color:#fff;}
.tag.gold{background:var(--gold);color:var(--mocha);}
.pinfo{padding:18px 18px 20px;display:flex;flex-direction:column;flex:1;}
.pcat{font-size:0.68rem;letter-spacing:2px;text-transform:uppercase;color:var(--gold3);}
.pname{font-family:'Cormorant Garamond',serif;font-size:1.5rem;font-weight:600;color:var(--mocha);margin-top:4px;line-height:1.15;}
.rtl .pname{font-family:'Cairo',serif;font-size:1.15rem;}
.pshort{font-size:0.85rem;color:var(--muted);line-height:1.55;margin-top:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.pprice{font-size:1.05rem;color:var(--mocha);margin-top:8px;}
.avail{margin-top:6px;display:flex;align-items:center;gap:8px;font-size:0.82rem;color:var(--green);}
.avail i{width:8px;height:8px;border-radius:4px;background:var(--green);display:inline-block;}
.avail.pre{color:#9a5a12;}.avail.pre i{background:#c9801f;}
.avail.out{color:var(--red);}.avail.out i{background:var(--red);}
.pact{margin-top:auto;padding-top:14px;}
.pact .btn-primary,.pact .btn-outline{width:100%;padding:13px 8px;font-size:0.74rem;letter-spacing:1.5px;}
.stepper{display:flex;align-items:center;width:140px;height:44px;border:1px solid var(--beige2);border-radius:4px;overflow:hidden;background:var(--white);flex-shrink:0;}
.stepper button{width:42px;height:100%;border:none;background:var(--beige);cursor:pointer;font-size:1.2rem;color:var(--mocha);}
.stepper input{flex:1;min-width:0;width:100%;height:100%;border:none;text-align:center;font-family:'Jost';font-size:16px;outline:none;background:var(--white);-moz-appearance:textfield;}
.stepper input::-webkit-outer-spin-button,.stepper input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}
.pact .stepper{width:100%;}
.split{display:flex;flex-wrap:wrap;align-items:center;gap:64px;}
.split>div{flex:1 1 420px;min-width:0;}
.story-img{height:520px;border-radius:16px;background:linear-gradient(160deg,var(--beige2),#d9c4a3);overflow:hidden;}
.story-img img{width:100%;height:100%;object-fit:cover;}
.story-p{margin-top:22px;font-size:1.05rem;line-height:1.85;color:var(--mocha2);font-weight:300;}
.ticks{margin-top:26px;display:flex;flex-direction:column;gap:14px;}
.ticks div{display:flex;gap:14px;align-items:flex-start;font-size:1rem;}
.tick{margin-top:1px;width:26px;height:26px;border-radius:13px;background:var(--mocha);color:var(--gold2);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;}
.steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;margin-top:44px;}
.step{background:var(--white);border-radius:14px;padding:32px 28px;box-shadow:var(--shadow2);}
.step-n{width:48px;height:48px;border-radius:24px;background:var(--mocha);color:var(--gold2);display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:1.6rem;font-weight:600;}
.step h3{margin-top:18px;font-size:1.7rem;color:var(--mocha);font-weight:600;}
.rtl .step h3{font-size:1.3rem;}
.step p{margin-top:8px;font-size:0.95rem;line-height:1.7;color:var(--mocha2);}
.revs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;margin-top:44px;}
.rev{background:var(--white);border-radius:14px;padding:28px;box-shadow:var(--shadow2);}
.rev q{display:block;margin-top:14px;font-family:'Cormorant Garamond',serif;font-size:1.45rem;line-height:1.45;color:var(--mocha);font-style:italic;quotes:none;}
.rtl .rev q{font-family:'Cairo',serif;font-size:1.1rem;font-style:normal;}
.rev b{display:block;margin-top:18px;font-size:0.92rem;font-weight:500;color:var(--mocha);}
.rev small{font-size:0.8rem;color:var(--muted);}
.stopblock{background:var(--mocha);border-radius:18px;padding:52px 56px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:32px;}
.stopblock .eyebrow{color:var(--gold2);}
.stopblock h2{font-size:clamp(1.9rem,3.6vw,2.7rem);font-weight:500;color:var(--cream);margin-top:10px;line-height:1.1;}
.stopblock p{margin-top:12px;font-size:1rem;line-height:1.7;color:#e6d9c6;font-weight:300;max-width:480px;}
.stopcard p{color:var(--muted);max-width:none;font-size:0.9rem;margin-top:12px;font-weight:400;}
.stopcard{flex:0 1 400px;min-width:0;width:100%;background:var(--cream);border-radius:14px;padding:22px;}
.mapbtn{display:flex;align-items:center;justify-content:center;gap:10px;background:var(--gold);color:#2d1f14;padding:15px 16px;border-radius:6px;font-weight:500;font-size:0.95rem;line-height:1.4;text-align:center;margin-top:14px;box-shadow:0 4px 14px rgba(201,169,110,.45);}
.mapbtn:hover{background:var(--gold2);}
.footer{margin-top:96px;background:#3a2a1e;color:#e6d9c6;}
.foot-in{max-width:1240px;margin:0 auto;padding:60px 40px 36px;display:flex;flex-wrap:wrap;justify-content:space-between;gap:40px;}
.foot-logo{font-family:'Cormorant Garamond',serif;font-size:2.1rem;font-weight:600;letter-spacing:7px;color:var(--gold2);}
.foot-h{font-size:0.76rem;letter-spacing:3px;color:var(--gold2);margin-bottom:14px;text-transform:uppercase;}
.foot-l{display:flex;flex-direction:column;gap:12px;font-size:0.95rem;}
.foot-l a,.foot-l button{display:flex;align-items:center;gap:12px;color:inherit;background:none;border:none;cursor:pointer;font-size:inherit;text-align:inherit;}
.foot-l a:hover,.foot-l button:hover{color:var(--gold2);}
.foot-b{max-width:1240px;margin:0 auto;padding:20px 40px;border-top:1px solid rgba(255,255,255,.12);font-size:0.8rem;color:#b9a98f;}
.wa-float{position:fixed;bottom:18px;inset-inline-end:18px;z-index:110;width:56px;height:56px;border-radius:28px;background:#25a85a;color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 20px rgba(0,0,0,.25);}
.cart-bar{position:fixed;inset-inline-start:12px;inset-inline-end:84px;bottom:12px;z-index:120;max-width:520px;background:var(--mocha);color:var(--cream);border:none;border-radius:10px;padding:15px 18px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;box-shadow:0 6px 24px rgba(0,0,0,0.25);font-size:0.92rem;}
.page-top{padding:40px 0 0;}
.back-btn{background:none;border:none;cursor:pointer;font-size:0.82rem;letter-spacing:1px;color:var(--muted);margin-bottom:22px;display:inline-flex;align-items:center;gap:6px;}
.back-btn:hover{color:var(--mocha);}
.filters{display:flex;gap:10px;flex-wrap:wrap;margin:26px 0 0;}
.filter-btn{background:none;border:1px solid var(--beige2);cursor:pointer;padding:9px 22px;font-size:0.78rem;letter-spacing:2px;text-transform:uppercase;color:var(--muted);border-radius:22px;white-space:nowrap;}
.filter-btn:hover,.filter-btn.active{background:var(--mocha);color:var(--cream);border-color:var(--mocha);}
.dgrid{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:56px;align-items:start;}
.gal-main{position:relative;aspect-ratio:1/1;border-radius:16px;overflow:hidden;background:linear-gradient(135deg,var(--beige),var(--beige2));touch-action:pan-y;}
.gal-main img{width:100%;height:100%;object-fit:cover;}
.gal-arrow{position:absolute;top:50%;transform:translateY(-50%);width:42px;height:42px;border-radius:21px;border:none;background:rgba(255,255,255,.9);color:var(--mocha);display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:var(--shadow2);}
.gal-arrow.l{left:12px;}.gal-arrow.r{right:12px;}
.gal-dots{position:absolute;bottom:12px;left:0;right:0;display:flex;justify-content:center;gap:7px;}
.gal-dots i{width:8px;height:8px;border-radius:4px;background:rgba(255,255,255,.7);}
.gal-dots i.on{background:var(--mocha);}
.thumbs{display:flex;gap:10px;margin-top:12px;flex-wrap:wrap;}
.thumb{width:72px;height:72px;border-radius:8px;overflow:hidden;border:2px solid transparent;cursor:pointer;padding:0;background:var(--beige2);}
.thumb.on{border-color:var(--gold);}
.thumb img{width:100%;height:100%;object-fit:cover;}
.d-title{font-size:clamp(2rem,4vw,3rem);font-weight:500;color:var(--mocha);line-height:1.1;margin-top:6px;}
.d-price{font-size:1.6rem;color:var(--mocha);margin-top:14px;font-family:'Cormorant Garamond',serif;font-weight:600;}
.d-desc{margin-top:18px;color:var(--mocha2);line-height:1.85;font-size:1rem;font-weight:300;}
.d-buy{margin-top:24px;display:flex;gap:12px;flex-wrap:wrap;align-items:center;}
.d-buy .btn-primary{flex:1 1 200px;}
.d-note{margin-top:14px;background:#fff7ec;border:1px solid #f0d9b5;color:#7a4a10;border-radius:8px;padding:12px 14px;font-size:0.88rem;line-height:1.6;}
.accs{margin-top:28px;border-top:1px solid var(--beige2);}
.acc{border-bottom:1px solid var(--beige2);}
.acc summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center;padding:16px 2px;font-size:0.95rem;letter-spacing:1px;color:var(--mocha);font-weight:500;}
.acc summary::-webkit-details-marker{display:none;}
.acc[open] summary svg{transform:rotate(180deg);}
.acc-b{padding:0 2px 18px;color:var(--mocha2);line-height:1.8;font-size:0.95rem;}
.rich-gap{height:.7em;}
.rich-ln strong{color:var(--mocha);}
.order-page{max-width:760px;margin:0 auto;padding:40px 20px 20px;}
.order-title{font-size:2.2rem;font-weight:500;color:var(--mocha);}
.step-title{font-family:'Cormorant Garamond',serif;font-size:1.5rem;color:var(--mocha);font-style:italic;margin:30px 0 14px;}
.rtl .step-title{font-family:'Cairo',serif;font-style:normal;font-size:1.2rem;}
.pick-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;}
.pick-card{background:var(--white);border:2px solid var(--beige2);border-radius:8px;padding:10px;display:flex;flex-direction:column;gap:8px;}
.pick-card>:last-child{margin-top:auto;}
.pick-img{height:120px;border-radius:4px;overflow:hidden;background:linear-gradient(135deg,var(--beige),var(--beige2));}
.pick-img img{width:100%;height:100%;object-fit:cover;}
.pick-name{font-family:'Cormorant Garamond',serif;font-weight:600;font-size:1.05rem;color:var(--mocha);line-height:1.2;}
.rtl .pick-name{font-family:'Cairo',serif;font-size:0.95rem;}
.pick-price{font-size:0.85rem;color:var(--mocha2);}
.pick-add{padding:11px 8px !important;font-size:0.7rem !important;letter-spacing:1px !important;width:100%;}
.basket{background:var(--white);border:1px solid var(--beige2);border-radius:8px;overflow:hidden;}
.basket-row{display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--beige2);flex-wrap:wrap;}
.basket-thumb{width:64px;height:64px;border-radius:6px;overflow:hidden;background:var(--beige2);flex-shrink:0;}
.basket-thumb img{width:100%;height:100%;object-fit:cover;}
.basket-info{flex:1;min-width:0;}
.basket-name{font-size:0.95rem;font-weight:500;}
.basket-unit{font-size:0.78rem;color:var(--muted);}
.basket-line{font-weight:500;font-size:0.95rem;white-space:nowrap;}
.basket-x{background:none;border:none;color:var(--muted);cursor:pointer;font-size:1.1rem;padding:8px;}
.basket-sub{display:flex;justify-content:space-between;padding:12px;background:var(--beige);font-size:0.92rem;}
.pre-pill{display:inline-block;margin-inline-start:6px;background:#ffe5c2;color:#8a4b08;font-size:0.65rem;padding:2px 8px;border-radius:10px;letter-spacing:1px;text-transform:uppercase;}
.totals{background:var(--white);border:1px solid var(--beige2);border-radius:8px;padding:14px 16px;margin:26px 0 16px;}
.totals>div{display:flex;justify-content:space-between;gap:12px;padding:6px 0;font-size:0.92rem;}
.totals .grand{border-top:1px solid var(--beige2);margin-top:6px;padding-top:12px;font-size:1.15rem;font-weight:600;color:var(--mocha);}
.form-error{background:#fde8e8;color:var(--red);padding:12px 14px;border-radius:4px;font-size:0.85rem;margin-bottom:14px;}
.form-group{margin-bottom:20px;}
.form-label{display:block;font-size:0.72rem;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:8px;}
.form-input,.form-select,.form-textarea{width:100%;padding:12px 16px;border:1px solid var(--beige2);border-radius:4px;font-family:inherit;font-size:0.92rem;color:var(--text);background:var(--white);outline:none;}
.form-textarea{min-height:90px;resize:vertical;line-height:1.5;}
.form-input:focus,.form-select:focus,.form-textarea:focus{border-color:var(--gold);}
.dtype{display:flex;gap:12px;}
.dbtn{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:13px 6px;border:2px solid var(--beige2);border-radius:6px;background:var(--white);color:var(--text);cursor:pointer;font-size:0.88rem;}
.dbtn.on{background:var(--mocha);border-color:var(--mocha);color:var(--cream);}
.stopbox{background:var(--beige);border:1px solid var(--beige2);border-radius:10px;padding:14px;margin-top:4px;}
.confirm{max-width:560px;margin:0 auto;text-align:center;padding:60px 20px 0;}
.confirm-title{font-size:2.3rem;font-weight:500;color:var(--mocha);margin-bottom:12px;}
.order-no{display:inline-block;margin:6px 0 10px;padding:10px 22px;border:1px dashed var(--gold);border-radius:8px;font-size:1rem;color:var(--mocha2);}
.order-no strong{font-size:1.7rem;color:var(--mocha);margin-inline-start:8px;font-family:'Cormorant Garamond',serif;}
.receipt{background:var(--white);border:1px solid var(--beige2);border-radius:8px;padding:16px;text-align:start;margin-bottom:22px;box-shadow:var(--shadow2);}
.receipt-title{font-family:'Cormorant Garamond',serif;font-size:1.4rem;font-style:italic;color:var(--mocha);margin-bottom:8px;}
.rtl .receipt-title{font-family:'Cairo',serif;font-style:normal;font-size:1.1rem;}
.receipt-row{display:flex;justify-content:space-between;gap:12px;padding:6px 0;font-size:0.9rem;}
.receipt-row.grand{border-top:1px solid var(--beige2);margin-top:6px;padding-top:12px;font-weight:600;font-size:1.05rem;color:var(--mocha);}
.receipt-meta{margin-top:12px;padding-top:12px;border-top:1px dashed var(--beige2);font-size:0.85rem;color:var(--muted);line-height:1.7;}
.contact-box{background:var(--beige);border-radius:10px;padding:16px;margin:0 0 26px;text-align:start;line-height:2.1;font-size:0.95rem;}
.contact-box a{display:flex;align-items:center;gap:10px;color:var(--mocha);font-weight:500;}
.admin-login{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--mocha);padding:16px;}
.login-card{background:var(--cream);padding:48px 40px;border-radius:6px;width:100%;max-width:380px;text-align:center;}
.login-logo{font-size:2rem;letter-spacing:4px;font-weight:600;color:var(--gold);margin-bottom:8px;font-family:'Cormorant Garamond';}
.login-title{font-size:1.8rem;font-style:italic;color:var(--mocha);margin-bottom:32px;}
.admin-layout{display:flex;min-height:100vh;background:#f8f4ef;font-family:'Jost',sans-serif;direction:ltr;text-align:left;}
.admin-sidebar{width:220px;background:var(--mocha);padding:28px 0;display:flex;flex-direction:column;flex-shrink:0;}
.sidebar-logo{font-family:'Cormorant Garamond';font-size:1.3rem;letter-spacing:3px;color:var(--gold2);text-align:center;padding:0 20px 24px;border-bottom:1px solid rgba(255,255,255,0.1);margin-bottom:12px;}
.sidebar-link{background:none;border:none;cursor:pointer;width:100%;text-align:left;padding:12px 24px;font-size:0.8rem;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,0.6);display:flex;align-items:center;gap:10px;}
.sidebar-link:hover,.sidebar-link.active{color:var(--gold2);background:rgba(255,255,255,0.06);}
.sidebar-logout{margin-top:auto;}
.admin-main{flex:1;min-width:0;padding:34px 38px;}
.admin-title{font-size:1.9rem;font-style:italic;color:var(--mocha);margin-bottom:22px;}
.admin-card{background:var(--white);border-radius:8px;padding:22px;margin-bottom:20px;box-shadow:var(--shadow2);}
.admin-card h3{font-size:1.3rem;color:var(--mocha);margin-bottom:12px;}
table{width:100%;border-collapse:collapse;}
th{font-size:0.68rem;letter-spacing:2px;text-transform:uppercase;color:var(--muted);padding:10px 14px;text-align:left;border-bottom:1px solid var(--beige2);}
td{padding:12px 14px;font-size:0.87rem;border-bottom:1px solid var(--beige2);vertical-align:middle;}
tr:last-child td{border-bottom:none;}
tr.low{background:#fff5f0;}
.badge{display:inline-block;padding:3px 10px;border-radius:10px;font-size:0.7rem;letter-spacing:1px;text-transform:uppercase;font-weight:500;}
.badge-pending{background:#fef3cd;color:#856404;}.badge-confirmed{background:#d1edff;color:#0a5a8a;}.badge-delivered{background:#d4edda;color:#155724;}.badge-cancelled{background:#fde8e8;color:#c0392b;}.badge-returned{background:#ece3f7;color:#6b3fa0;}.badge-preorder{background:#ffe5c2;color:#8a4b08;}.badge-low{background:#fde8e8;color:var(--red);}.badge-ok{background:#d4edda;color:#155724;}.badge-vip{background:#ede0cc;color:var(--mocha);}
.status-select{padding:8px;border:1px solid var(--beige2);border-radius:4px;font-size:0.8rem;font-family:'Jost';cursor:pointer;}
.qty-input{width:80px;padding:6px 8px;border:1px solid var(--beige2);border-radius:4px;font-size:0.85rem;font-family:'Jost';}
.btn-save{background:var(--mocha);color:#fff;border:none;cursor:pointer;padding:9px 16px;border-radius:4px;font-size:0.78rem;font-family:'Jost';}
.btn-save:hover{background:var(--gold);color:var(--mocha);}
.btn-add{background:var(--gold);color:var(--mocha);border:none;cursor:pointer;padding:10px 20px;border-radius:4px;font-size:0.8rem;font-family:'Jost';font-weight:500;margin-bottom:16px;}
.btn-add:hover{background:var(--mocha);color:var(--cream);}
.btn-danger{background:#fde8e8;color:var(--red);border:none;cursor:pointer;padding:9px 12px;border-radius:4px;font-size:0.78rem;font-family:'Jost';}
.btn-soft{background:var(--beige2);color:var(--mocha);border:none;cursor:pointer;padding:9px 14px;border-radius:4px;font-size:0.78rem;font-family:'Jost';}
.search-bar{display:flex;gap:12px;margin-bottom:18px;flex-wrap:wrap;}
.search-input{flex:1;min-width:200px;padding:10px 16px;border:1px solid var(--beige2);border-radius:4px;font-family:'Jost';font-size:0.87rem;outline:none;}
.select-filter{padding:10px 14px;border:1px solid var(--beige2);border-radius:4px;font-family:'Jost';font-size:0.85rem;background:#fff;}
.ing-cat{font-size:0.7rem;letter-spacing:2px;text-transform:uppercase;color:var(--gold);padding:16px 14px 6px;}
.stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;margin-bottom:22px;}
.stat-card{background:#fff;border-radius:8px;padding:18px;text-align:center;box-shadow:var(--shadow2);}
.stat-num{font-size:1.9rem;font-family:'Cormorant Garamond';color:var(--mocha);font-weight:600;line-height:1.2;}
.stat-label{font-size:0.66rem;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-top:4px;}
.stat-sub{font-size:0.74rem;color:var(--muted);margin-top:4px;}
.two{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
.bar-row{display:flex;align-items:center;gap:10px;margin:8px 0;font-size:0.84rem;}
.bar-row>span:first-child{width:110px;flex-shrink:0;color:var(--mocha2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.bar-t{flex:1;height:12px;background:var(--beige);border-radius:6px;overflow:hidden;}
.bar-t i{display:block;height:100%;background:var(--gold);border-radius:6px;}
.bar-row b{width:74px;text-align:right;font-weight:500;flex-shrink:0;}
.mbars{display:flex;align-items:flex-end;gap:10px;height:150px;padding-top:10px;}
.mbars>div{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;font-size:0.7rem;color:var(--muted);gap:4px;}
.mbars i{display:block;width:100%;max-width:48px;background:var(--gold);border-radius:4px 4px 0 0;min-height:2px;}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:300;display:flex;align-items:flex-start;justify-content:center;padding:16px;overflow-y:auto;}
.modal{background:var(--cream);border-radius:8px;padding:24px;width:100%;max-width:820px;margin:auto;font-family:'Jost',sans-serif;direction:ltr;text-align:left;}
.modal-title{font-size:1.5rem;font-style:italic;color:var(--mocha);margin-bottom:16px;}
.ed-sec{font-size:0.72rem;letter-spacing:2px;text-transform:uppercase;color:var(--gold3);margin:22px 0 10px;padding-bottom:6px;border-bottom:1px solid var(--beige2);}
.ed-2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.ed-4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
.ed-lbl{font-size:0.72rem;color:var(--muted);margin-bottom:4px;display:flex;justify-content:space-between;align-items:center;}
.ed-lbl button{background:var(--beige2);border:none;border-radius:3px;padding:2px 8px;cursor:pointer;font-weight:700;font-size:0.72rem;}
.photo-row{display:flex;gap:10px;flex-wrap:wrap;}
.photo-box{width:110px;border:1px solid var(--beige2);border-radius:8px;padding:6px;background:#fff;text-align:center;}
.photo-box img{width:100%;height:90px;object-fit:cover;border-radius:5px;}
.photo-box small{display:block;font-size:0.65rem;color:var(--gold3);margin:3px 0;}
.photo-box div{display:flex;justify-content:center;gap:4px;}
.photo-box button{background:var(--beige);border:none;border-radius:3px;padding:4px 7px;cursor:pointer;font-size:0.78rem;}
.chk{display:inline-flex;align-items:center;gap:6px;margin:0 14px 8px 0;font-size:0.88rem;cursor:pointer;}
.chk input{width:18px;height:18px;}
.loader{display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;gap:16px;}
.photo-preview{width:60px;height:60px;object-fit:cover;border-radius:6px;border:1px solid var(--beige2);}

@media(max-width:1100px){
  .pgrid{grid-template-columns:repeat(3,minmax(0,1fr));}
  .cats{grid-template-columns:repeat(2,minmax(0,1fr));}
  .trust-in{grid-template-columns:repeat(2,minmax(0,1fr));}
}
@media(max-width:820px){
  .wrap,.nav-in,.trust-in,.foot-in,.foot-b{padding-left:18px;padding-right:18px;}
  .nav-in{flex-wrap:wrap;min-height:0;padding-top:10px;padding-bottom:6px;}
  .nav-logo{font-size:1.5rem;letter-spacing:4px;}
  .nav-links{order:3;width:100%;justify-content:space-between;gap:8px;border-top:1px solid var(--beige2);padding-top:2px;}
  .nav-link{font-size:0.7rem;letter-spacing:1px;padding:8px 0;}
  .lang-btn{padding:7px 12px;font-size:0.74rem;}
  .basket-btn{padding:8px 14px;font-size:0.7rem;}
  .basket-btn .bt{display:none;}
  .hero-in{padding:70px 20px 80px;}
  .section{padding-top:60px;}
  .pgrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;}
  .pinfo{padding:12px;}
  .pname{font-size:1.2rem;}
  .rtl .pname{font-size:1rem;}
  .pshort{font-size:0.76rem;-webkit-line-clamp:2;}
  .cats{gap:12px;}
  .cat-img{height:150px;}
  .cat-foot{padding:12px;}.cat-foot b{font-size:1.25rem;}.cat-foot span{display:none;}
  .steps,.revs{grid-template-columns:1fr;}
  .split{gap:30px;}
  .story-img{height:320px;}
  .stopblock{padding:30px 20px;border-radius:14px;}
  .dgrid{grid-template-columns:1fr;gap:26px;}
  .footer{margin-top:64px;}
  .foot-in{padding-top:44px;gap:30px;}
  .two,.ed-2{grid-template-columns:1fr;}
  .ed-4{grid-template-columns:1fr 1fr;}
}
@media(max-width:480px){
  .trust-in{gap:16px;}
  .trust-i{flex-direction:column;text-align:center;gap:8px;}
  .order-title{font-size:1.8rem;}
  .pick-grid{grid-template-columns:repeat(2,1fr);}
  .form-input,.form-select,.form-textarea{font-size:16px;}
  .confirm-title{font-size:1.9rem;}
  .login-card{padding:36px 24px;}
  .mapbtn{font-size:0.9rem;}
}
@media(max-width:768px){
  .admin-layout{flex-direction:column;}
  .admin-sidebar{position:fixed;bottom:0;left:0;right:0;width:100%;height:62px;flex-direction:row;padding:0;z-index:150;border-top:1px solid rgba(255,255,255,0.12);overflow-x:auto;}
  .sidebar-logo{display:none;}
  .sidebar-link{flex:1 0 auto;min-width:68px;width:auto;text-align:center;padding:6px 4px;font-size:0.56rem;letter-spacing:0.5px;flex-direction:column;justify-content:center;gap:2px;}
  .sidebar-logout{margin-top:0;}
  .admin-main{padding:16px 12px 84px;}
  .admin-title{font-size:1.5rem;margin-bottom:14px;}
  .stat-grid{grid-template-columns:repeat(2,1fr);gap:10px;}
  .stat-card{padding:12px;}.stat-num{font-size:1.5rem;}
  .admin-card{padding:14px;}
  .search-input{min-width:0;width:100%;flex:none;font-size:16px;}
  .select-filter{flex:1;font-size:16px;}
  .modal{padding:16px;}
  .rtable thead{display:none;}
  .rtable,.rtable tbody,.rtable tr,.rtable td{display:block;width:100%;}
  .rtable tr{border:1px solid var(--beige2);border-radius:8px;margin-bottom:12px;padding:4px 0;}
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
