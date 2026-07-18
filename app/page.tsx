"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, getDoc, addDoc } from "firebase/firestore";
import { useTheme, useLanguage } from "@/lib/Providers";
import { 
  ArrowRight, ShoppingCart, PackageSearch, X, Loader2, Trash2, 
  Image as ImageIcon, Search, CheckCircle2, ChevronDown, ChevronRight, 
  MapPin, Phone, User, Truck, Building2, LocateFixed, Activity, Briefcase, FileText, Menu, Mail,
  MessageSquare, Send, Scissors, Plus
} from "lucide-react";

const PREDEFINED_MATRIX: Record<string, string[]> = {
  "የግንባታ ብረት": ["የሀገር ውስጥ", "የቱርክ ብረት"],
  "ቆርቆሮ": ["መደበኛ ቆርቆሮ", "ኤጋ ቆርቆሮ", "ታይልስ ቆርቆሮ"],
  "ጂብሰም ቦርድ": ["የውሃ ስርገት የሚከላከል", "የድምፅ ስርገት የሚከላከል", "መገጣጠሚያዎች"],
  "የኮርኒስ ንጣፍ": ["ፒ.ቪ.ሲ", "Armstrong (አርምስትሮንግ)", "Acrostic (አኮስቲክ)", "መገጣጠሚያዎች"],
  "ጣውላ": ["አውስትራሊያ", "ሻሸመኔ"],
  "MDF": ["የተለጠፈ (Laminated)", "መደበኛ"],
  "ትቦላሬ": [
    "RHS (Rectangular Hallow Section)", "CHS (Circular Hallow Section)", "SHS (Square Hallow Section)",
    "ቶንዲኖ (Round Bar)", "ፊያቶ (Flat Iron)", "አንግል (Angel Iron)", "ኤል.ቲ.ዜድ (LTZ)", "ላሜራ"
  ]
};

const initialSettingsState = {
  companyName: "AmanZone Trading PLC", slogan: "Industrial Grade. Delivered.", logoUrl: "",
  phone: "", email: "", address: "Addis Ababa, Ethiopia", taxRate: 15, deliveryBaseFee: 250, aiEnabled: true
};

const AdMedia = ({ asset, className }: { asset: any, className?: string }) => {
  if (!asset) return null;
  return asset.type === 'video' ? (
    <video src={asset.url} autoPlay loop muted playsInline className={className} />
  ) : (
    <img src={asset.url} alt="AmanZone Ad" loading="lazy" className={className} />
  );
};

export default function PremiumStorefront() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const t = (en: string, am: string) => (language === "EN" ? en : am);

  const [products, setProducts] = useState<any[]>([]);
  const [marketingAssets, setMarketingAssets] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<any>(initialSettingsState);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isMobileMatrixOpen, setIsMobileMatrixOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const [activeFilters, setActiveFilters] = useState({ menu: "All", submenu: "All", type: "All" });

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2>(1);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  
  // Quick Configurator State
  const [quickAddProduct, setQuickAddProduct] = useState<any>(null);
  const [qaQty, setQaQty] = useState<number | string>(1);
  const [qaLength, setQaLength] = useState<number | string>(1);
  const [qaColor, setQaColor] = useState("");
  const [qaSize, setQaSize] = useState("");

  const [deliveryType, setDeliveryType] = useState<"Warehouse Pickup" | "Delivery">("Delivery");
  const [formData, setFormData] = useState({ name: "", phone: "", region: "Addis Ababa", subCity: "", address: "", companyName: "", tinNumber: "", requireVat: false });

  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [trackingId, setTrackingId] = useState("");
  const [trackingStatus, setTrackingStatus] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [aiHistory, setAiHistory] = useState<{role: 'user'|'ai', text: string}[]>([{role: 'ai', text: "Hello! I am AmanZone AI. I have live access to our warehouse matrix. What materials are you looking for today?"}]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [scrolled, setScrolled] = useState(false);
  const [toast, setToast] = useState<{ show: boolean, msg: string }>({ show: false, msg: "" });

  const ethiopianRegions = ["Addis Ababa", "Oromia", "Amhara", "Tigray", "Sidama", "SNNPR", "Somali", "Afar", "Benishangul-Gumuz", "Gambela", "Harari", "Dire Dawa"];
  const addisSubcities = ["Bole", "Yeka", "Nifas Silk-Lafto", "Kirkos", "Kolfe Keranio", "Lideta", "Gulele", "Addis Ketema", "Akaky Kaliti", "Arada", "Lemi Kura"];

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) { window.requestAnimationFrame(() => { setScrolled(window.scrollY > 50); ticking = false; }); ticking = true; }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const q = query(collection(db, "inventory"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => { setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); setLoading(false); }, () => setLoading(false));
    const unsubMarketing = onSnapshot(query(collection(db, "marketing"), orderBy("createdAt", "desc")), (snapshot) => { setMarketingAssets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); });
    const unsubSettings = onSnapshot(doc(db, "settings", "global"), (docSnap) => { if (docSnap.exists()) setSystemSettings({ ...initialSettingsState, ...docSnap.data() }); });
    return () => { unsubscribe(); unsubMarketing(); unsubSettings(); };
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [aiHistory, isAiTyping]);

  const catalogTree = useMemo(() => {
    const tree: any = {};
    Object.keys(PREDEFINED_MATRIX).forEach(menu => { tree[menu] = {}; PREDEFINED_MATRIX[menu].forEach(submenu => { tree[menu][submenu] = new Set(); }); });
    products.forEach(p => {
      const m = p.menu || "Uncategorized"; const sm = p.submenu || "General"; const tType = p.type || "Standard";
      if (!tree[m]) tree[m] = {}; if (!tree[m][sm]) tree[m][sm] = new Set(); tree[m][sm].add(tType);
    });
    return tree;
  }, [products]);

  const toggleMenu = (menu: string) => setExpandedMenus(prev => ({ ...prev, [menu]: !prev[menu] }));

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const searchMatch = (p.title || "").toLowerCase().includes(searchQuery.toLowerCase()) || (p.menu || "").toLowerCase().includes(searchQuery.toLowerCase());
      const menuMatch = activeFilters.menu === "All" || p.menu === activeFilters.menu;
      const submenuMatch = activeFilters.submenu === "All" || p.submenu === activeFilters.submenu;
      const typeMatch = activeFilters.type === "All" || p.type === activeFilters.type;
      return searchMatch && menuMatch && submenuMatch && typeMatch;
    });
  }, [products, searchQuery, activeFilters]);

  // Handle Quick Add Modal Opening
  const openQuickAdd = (item: any) => {
    const availableColors = item.color ? item.color.split(',').map((c:string) => c.trim()).filter(Boolean) : [];
    const availableSizes = item.size ? item.size.split(',').map((s:string) => s.trim()).filter(Boolean) : [];
    setQaColor(availableColors[0] || "");
    setQaSize(availableSizes[0] || "");
    setQaQty(1);
    setQaLength(1);
    setQuickAddProduct(item);
  };

  const executeQuickAdd = () => {
    if (!quickAddProduct) return;
    const finalQty = typeof qaQty === 'number' && qaQty >= 1 ? qaQty : 1;
    const finalLength = typeof qaLength === 'number' && qaLength > 0 ? qaLength : 1;

    const configuredProduct = {
      ...quickAddProduct,
      cartItemId: `${quickAddProduct.id}-${qaSize}-${qaColor}-${quickAddProduct.allowCustomSize ? finalLength : 'standard'}`,
      quantity: finalQty,
      selectedColor: qaColor,
      selectedSize: qaSize,
      customLength: quickAddProduct.allowCustomSize ? finalLength : null
    };

    setCartItems(prev => {
      const existing = prev.find(item => item.cartItemId === configuredProduct.cartItemId);
      if (existing) {
        const currentQty = typeof existing.quantity === 'number' ? existing.quantity : (parseInt(existing.quantity) || 0);
        return prev.map(item => item.cartItemId === configuredProduct.cartItemId ? { ...item, quantity: currentQty + configuredProduct.quantity } : item);
      }
      return [...prev, configuredProduct];
    });

    setToast({ show: true, msg: `${configuredProduct.title} added to pipeline` });
    setTimeout(() => setToast({ show: false, msg: "" }), 3000);
    setQuickAddProduct(null);
  };

  const removeFromCart = (cartItemId: string) => setCartItems(prev => prev.filter(item => item.cartItemId !== cartItemId));

  const updateCartQuantity = (cartItemId: string, val: string | number) => {
    if (val === "") { setCartItems(prev => prev.map(item => item.cartItemId === cartItemId ? { ...item, quantity: "" } : item)); return; }
    const parsed = typeof val === 'string' ? parseInt(val) : val;
    if (!isNaN(parsed) && parsed > 0) setCartItems(prev => prev.map(item => item.cartItemId === cartItemId ? { ...item, quantity: parsed } : item));
  };

  const handleCartQuantityBlur = (cartItemId: string, currentQuantity: any) => {
    const parsed = parseInt(currentQuantity);
    if (isNaN(parsed) || parsed < 1) updateCartQuantity(cartItemId, 1);
  };
  
  const cartSubtotal = cartItems.reduce((total, item) => {
    const basePrice = parseFloat(item.price) || 0;
    const qty = parseInt(item.quantity) || 1;
    const lengthMultiplier = item.allowCustomSize && item.customLength ? parseFloat(item.customLength) : 1;
    return total + (basePrice * qty * lengthMultiplier);
  }, 0);

  const vatAmount = formData.requireVat ? cartSubtotal * (systemSettings.taxRate / 100) : 0;
  const cartTotal = cartSubtotal + vatAmount;
  const cartCount = cartItems.reduce((acc, item) => acc + (parseInt(item.quantity) || 1), 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault(); if (cartItems.length === 0) return; setIsCheckingOut(true);
    try {
      const sanitizedItems = cartItems.map(item => ({ ...item, quantity: parseInt(item.quantity) || 1 }));
      const payload = {
        items: sanitizedItems, customerName: formData.name, companyName: formData.companyName,
        tinNumber: formData.tinNumber, requireVat: formData.requireVat, phone: formData.phone,
        totalAmount: cartTotal, subtotal: cartSubtotal, deliveryType, region: formData.region, 
        subCity: formData.subCity, specificAddress: formData.address, baseDeliveryFee: systemSettings.deliveryBaseFee,
        status: "pending_payment", createdAt: new Date().toISOString()
      };
      
      // 1. Sync to Firebase Command Center
      await addDoc(collection(db, "orders"), payload);
      
      // 2. Telegram Neural Link Integration (Direct Push)
      // Replace YOUR_BOT_TOKEN and YOUR_CHAT_ID with your actual Telegram bot credentials.
      try {
        const tgBotToken = "YOUR_BOT_TOKEN"; 
        const tgChatId = "YOUR_CHAT_ID"; 
        
        if (tgBotToken !== "YOUR_BOT_TOKEN") {
          const tgMessage = `🚨 *NEW PIPELINE ORDER* 🚨\n\n` +
                            `👤 *Client:* ${payload.customerName}\n` +
                            `📞 *Phone:* ${payload.phone}\n` +
                            `💰 *Total Yield:* ${payload.totalAmount.toLocaleString()} ETB\n` +
                            `🚚 *Type:* ${payload.deliveryType}\n\n` +
                            `Log into the Command Center to process this order.`;

          await fetch(`https://api.telegram.org/bot${tgBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: tgChatId, text: tgMessage, parse_mode: 'Markdown' })
          });
        }
      } catch (tgError) {
        console.warn("Telegram push skipped or failed.", tgError);
      }
      
      setCartItems([]); setIsCartOpen(false); setCheckoutStep(1);
      setToast({ show: true, msg: "Order Dispatched to Command Center successfully!" });
      setTimeout(() => setToast({ show: false, msg: "" }), 4000);
    } catch (error) { alert("System error during checkout pipeline."); } finally { setIsCheckingOut(false); }
  };

  const trackOrder = async (e: React.FormEvent) => {
    e.preventDefault(); setTrackingLoading(true);
    try {
      const docRef = doc(db, "orders", trackingId.trim());
      const orderSnap = await getDoc(docRef);
      if (orderSnap.exists()) setTrackingStatus({ found: true, ...orderSnap.data() });
      else setTrackingStatus({ found: false, error: "Tracking ID not found in active pipeline." });
    } catch (error) { setTrackingStatus({ found: false, error: "Network error accessing Command Center." }); } finally { setTrackingLoading(false); }
  };

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!aiMessage.trim()) return;
    const userMsg = aiMessage;
    setAiHistory(prev => [...prev, {role: 'user', text: userMsg}]);
    setAiMessage(""); setIsAiTyping(true);
    try {
      const res = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userMsg, inventory: products }) });
      const data = await res.json();
      setAiHistory(prev => [...prev, {role: 'ai', text: data.reply}]);
      if (data.adminAlert) await fetch('/api/ai/alert', { method: 'POST', body: JSON.stringify({ alert: data.adminAlert }) }).catch(() => {});
    } catch (error) { setAiHistory(prev => [...prev, {role: 'ai', text: "Neural link disrupted. Please try again."}]); } finally { setIsAiTyping(false); }
  };

  const renderSlogan = () => {
    const parts = systemSettings.slogan.split('.');
    if (parts.length < 2) return <>{systemSettings.slogan}</>;
    return (
      <>{parts[0]}. <br /><span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, var(--text-main), var(--accent))' }}>{parts.slice(1).join('.').trim()}</span></>
    );
  };

  const activeAds = marketingAssets.filter(ad => ad.active);
  const heroAds = activeAds.filter(ad => ad.placement === 'hero');
  const floatingAds = activeAds.filter(ad => ad.placement === 'floating');
  const footerAds = activeAds.filter(ad => ad.placement === 'footer');
  const inlineAds = activeAds.filter(ad => ad.placement === 'inline' || !ad.placement);
  const marqueeAds = activeAds.filter(ad => ad.placement === 'marquee');

  const heroAd = heroAds.length > 0 ? heroAds[0] : null;
  const floatingAd = floatingAds.length > 0 ? floatingAds[0] : null;
  const footerAd = footerAds.length > 0 ? footerAds[0] : null;

  const catalogMixedItems: any[] = [];
  let inlineAdCount = 0;
  
  filteredProducts.forEach((product, i) => {
    catalogMixedItems.push({ isAd: false, data: product });
    if ((i + 1) % 6 === 0 && inlineAds.length > 0) {
      const ad = inlineAds[inlineAdCount % inlineAds.length];
      catalogMixedItems.push({ isAd: true, data: ad });
      inlineAdCount++;
    }
  });

  return (
    <div className="relative min-h-screen font-sans scroll-smooth overflow-x-hidden" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-main)' }}>
      <style jsx global>{`
        input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 25s linear infinite; }
        .animate-marquee:hover { animation-play-state: paused; }
      `}</style>

      <div className="fixed top-[-20%] left-[-10%] w-[50rem] h-[50rem] pointer-events-none transform-gpu" style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 60%)', opacity: 0.12 }} />
      <div className="fixed bottom-[-10%] right-[-5%] w-[40rem] h-[40rem] pointer-events-none transform-gpu opacity-10" style={{ background: 'radial-gradient(circle, #059669 0%, transparent 60%)' }} />

      <header className={`fixed top-0 w-full z-40 transition-colors duration-300 border-b transform-gpu ${scrolled ? 'bg-black/90 py-2 md:py-3 border-white/10 shadow-2xl backdrop-blur-md' : 'bg-[#0A0A0F]/90 py-3 md:py-5 border-white/5 backdrop-blur-sm'}`}>
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 flex flex-col md:flex-row md:items-center gap-3 md:gap-0 justify-between">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
              <div className="w-8 h-8 rounded flex items-center justify-center font-black text-white text-xs overflow-hidden" style={{ backgroundColor: 'var(--accent)' }}>
                {systemSettings.logoUrl ? <img src={systemSettings.logoUrl} className="w-full h-full object-cover" alt="Logo" /> : "AZ"}
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-tighter truncate max-w-[150px] md:max-w-none">
                {systemSettings.companyName.split(' ')[0]}<span style={{ color: 'var(--accent)' }}>.</span>
              </h1>
            </div>
            
            <div className="flex items-center gap-3 md:hidden">
              <div className="flex items-center gap-1 text-[10px] text-gray-400 bg-white/5 px-2 py-1 rounded border border-white/10"><MapPin size={10} className="text-emerald-400"/> Addis Ababa</div>
            </div>
          </div>
          
          <div className="relative w-full md:w-[400px] lg:w-[500px] mx-auto md:mx-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={16} />
            <input 
              type="text" placeholder={t("Search materials...", "ፈልግ...")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 md:py-3 rounded-lg bg-black border border-white/10 outline-none focus:border-emerald-500 transition-colors text-sm"
            />
          </div>

          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-1 text-[11px] text-gray-400 bg-white/5 px-3 py-1.5 rounded border border-white/10"><MapPin size={12} className="text-emerald-400"/> Addis Ababa</div>
            <button onClick={() => setIsTrackingOpen(true)} className="text-xs font-bold hover:text-emerald-400 transition-colors">{t("Track Order", "ትዕዛዝ ተከታተል")}</button>
            <button onClick={() => setLanguage(language === "EN" ? "AM" : "EN")} className="text-xs font-bold hover:text-emerald-400 transition-colors px-2 border-l border-white/10">{language === "EN" ? "አማርኛ" : "EN"}</button>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-4 md:px-6 mt-3 md:mt-4">
           <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide snap-x">
             <button onClick={() => setActiveFilters({menu: 'All', submenu: 'All', type: 'All'})} className={`snap-start flex-shrink-0 px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold transition-colors whitespace-nowrap border ${activeFilters.menu === 'All' ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-[#111111] text-gray-300 border-white/10 hover:bg-white/10'}`}>All Materials</button>
             {uniqueMenus.map((menu:any) => (
               <button key={menu} onClick={() => setActiveFilters({menu, submenu: 'All', type: 'All'})} className={`snap-start flex-shrink-0 px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold transition-colors whitespace-nowrap border ${activeFilters.menu === menu ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-[#111111] text-gray-300 border-white/10 hover:bg-white/10'}`}>{menu}</button>
             ))}
           </div>
        </div>
      </header>

      <div className="pt-32 md:pt-40"></div>

      {floatingAd && (
        <div className="hidden lg:block fixed top-1/3 left-6 z-30 pointer-events-auto group">
          <div className="relative w-20 h-20 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] border-4 border-indigo-500/20 shadow-[0_0_40px_rgba(79,70,229,0.3)] overflow-hidden transition-all duration-700 hover:w-64 hover:h-64 hover:rounded-[2rem] hover:border-emerald-500 hover:shadow-[0_0_50px_rgba(16,185,129,0.5)] cursor-pointer bg-black">
             <AdMedia asset={floatingAd} className="w-full h-full object-cover scale-150 group-hover:scale-100 transition-transform duration-700" />
             <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors duration-500" />
          </div>
        </div>
      )}

      {heroAd && (
        <div className="w-full max-w-[1400px] mx-auto px-4 md:px-6 mb-6">
          <div className="relative w-full h-24 md:h-32 lg:h-40 rounded-2xl md:rounded-3xl border border-white/10 shadow-2xl overflow-hidden group bg-[#111111]">
            <AdMedia asset={heroAd} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent pointer-events-none" />
            <div className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 font-black text-white/50 tracking-[0.5em] uppercase text-[8px] md:text-xs rotate-[-90deg] origin-left">PROMO</div>
          </div>
        </div>
      )}

      {marqueeAds.length > 0 && (
        <div className="w-full bg-emerald-500/5 border-y border-emerald-500/20 py-2 md:py-3 overflow-hidden flex relative mb-6">
          <div className="absolute left-0 top-0 bottom-0 w-12 md:w-32 bg-gradient-to-r from-[#050505] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 md:w-32 bg-gradient-to-l from-[#050505] to-transparent z-10 pointer-events-none" />
          <div className="animate-marquee flex gap-4 md:gap-8 items-center min-w-max px-4">
            {[...marqueeAds, ...marqueeAds, ...marqueeAds, ...marqueeAds, ...marqueeAds].map((ad, i) => (
              <div key={i} className="flex items-center gap-3 bg-[#111111] pr-4 rounded-full border border-white/5 shadow-lg overflow-hidden h-8 md:h-10">
                <AdMedia asset={ad} className="h-full w-20 md:w-24 object-cover" />
                <span className="text-emerald-400 font-bold tracking-widest text-[8px] md:text-[10px] uppercase whitespace-nowrap">Special Offer</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <section id="catalog" className="relative z-10 max-w-[1400px] mx-auto px-3 md:px-6 pb-40">
        {!loading && filteredProducts.length > 0 && <div className="flex justify-between items-center mb-4"><p className="text-[10px] md:text-xs font-bold opacity-50 uppercase tracking-widest px-1">{filteredProducts.length} Results Found</p></div>}
        
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">{[1,2,3,4,5,6,7,8,9,10].map(n => <div key={n} className="rounded-xl h-[16rem] md:h-[18rem] bg-[#111111] border border-white/5 animate-pulse" />)}</div>
        ) : catalogMixedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50 border border-dashed border-white/10 rounded-2xl bg-[#111111]"><PackageSearch size={48} className="mb-4 opacity-30" /><p className="text-sm md:text-base font-bold">No materials match this configuration.</p></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 grid-flow-row-dense">
            {catalogMixedItems.map((item, i) => {
              if (!item.isAd) {
                const product = item.data;
                return (
                  <div key={product.id} onClick={() => openQuickAdd(product)} className="col-span-1 bg-[#0A0A0F] border border-white/10 rounded-xl overflow-hidden flex flex-col hover:border-emerald-500/50 hover:shadow-[0_5px_15px_rgba(16,185,129,0.1)] transition-all cursor-pointer group animate-in fade-in zoom-in" style={{ animationDelay: `${(i % 10) * 10}ms` }}>
                    <div className="relative aspect-[4/3] bg-black/80 overflow-hidden">
                       {product.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/> : <div className="w-full h-full flex items-center justify-center opacity-20"><ImageIcon size={24}/></div>}
                       {product.allowCustomSize && <span className="absolute top-2 left-2 bg-yellow-500/90 backdrop-blur-sm text-black text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg flex items-center gap-1"><Scissors size={8}/> CUT</span>}
                    </div>
                    <div className="p-3 flex flex-col flex-1 bg-[#111111]">
                       <p className="font-black text-emerald-400 text-sm md:text-base leading-none mb-1">{(parseFloat(product.price) || 0).toLocaleString()} <span className="text-[8px] text-white/50 font-medium">ETB</span></p>
                       <p className="text-[11px] md:text-xs font-medium text-white/90 line-clamp-2 leading-snug mb-2">{product.title}</p>
                       <div className="mt-auto pt-2 border-t border-white/5 flex justify-between items-center">
                         <p className="text-[8px] text-gray-500 uppercase flex items-center gap-1 truncate"><MapPin size={8}/> {product.warehouse || "Addis Ababa"}</p>
                         <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-black transition-colors"><Plus size={14}/></div>
                       </div>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={`ad-${i}`} className="col-span-2 row-span-1 rounded-xl overflow-hidden shadow-2xl border border-indigo-500/20 group transition-all duration-700 bg-black min-h-[120px]">
                    <AdMedia asset={item.data} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-transform duration-1000 group-hover:scale-105" />
                    <div className="absolute top-2 right-2 text-[7px] tracking-[0.2em] font-black uppercase text-white/50 border border-white/20 px-1.5 py-0.5 rounded backdrop-blur-sm">AD</div>
                  </div>
                );
              }
            })}
          </div>
        )}
      </section>

      {footerAd && (
        <div className="w-full relative h-[25vh] md:h-[35vh] overflow-hidden rounded-t-[50%] border-t border-white/10 shadow-[0_-20px_50px_rgba(255,255,255,0.05)] mt-10">
          <AdMedia asset={footerAd} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none" />
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <h1 className="text-2xl md:text-4xl font-black text-white/80 tracking-widest">{systemSettings.companyName.split(' ')[0]}<span style={{ color: 'var(--accent)' }}>.</span></h1>
            <p className="text-[9px] md:text-[10px] font-mono opacity-50 mt-1">INDUSTRIAL GRADE</p>
          </div>
        </div>
      )}

      {quickAddProduct && (
        <div className="fixed inset-0 z-[90] flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setQuickAddProduct(null)} />
          <div className="relative w-full md:w-[400px] bg-[#111111] border border-white/10 md:rounded-3xl rounded-t-3xl shadow-2xl p-5 md:p-6 animate-in slide-in-from-bottom-full md:zoom-in-95 duration-300">
            <button onClick={() => setQuickAddProduct(null)} className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10"><X size={16}/></button>
            
            <div className="flex gap-4 mb-6">
               <div className="w-20 h-20 rounded-xl bg-black border border-white/10 overflow-hidden flex-shrink-0">
                 {quickAddProduct.imageUrl ? <img src={quickAddProduct.imageUrl} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center opacity-30"><ImageIcon/></div>}
               </div>
               <div className="flex-1 pr-6">
                 <h3 className="font-bold text-sm md:text-base leading-tight mb-1">{quickAddProduct.title}</h3>
                 <p className="text-emerald-400 font-black text-lg">{(parseFloat(quickAddProduct.price)||0).toLocaleString()} <span className="text-[10px] text-white/50 font-medium">ETB / {quickAddProduct.metric}</span></p>
               </div>
            </div>

            <div className="space-y-4">
              {quickAddProduct.allowCustomSize && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-xs text-yellow-400 font-bold uppercase tracking-widest flex items-center gap-2"><Scissors size={14}/> {quickAddProduct.customSizeLabel || "Length (m)"}</span>
                  <input type="number" min="0.1" step="0.1" value={qaLength} onChange={(e) => setQaLength(e.target.value === "" ? "" : parseFloat(e.target.value))} className="w-24 bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-center outline-none focus:border-yellow-500 text-yellow-400 font-bold" style={{ MozAppearance: 'textfield' }} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {quickAddProduct.color && (
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 block mb-1">Color</label>
                    <select value={qaColor} onChange={(e) => setQaColor(e.target.value)} className="w-full bg-[#111111] border border-white/10 rounded-lg px-3 py-2.5 text-xs outline-none focus:border-emerald-500">
                      {quickAddProduct.color.split(',').map((c:string) => c.trim()).filter(Boolean).map((c:string) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                )}
                {quickAddProduct.size && (
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 block mb-1">Size</label>
                    <select value={qaSize} onChange={(e) => setQaSize(e.target.value)} className="w-full bg-[#111111] border border-white/10 rounded-lg px-3 py-2.5 text-xs outline-none focus:border-emerald-500">
                      {quickAddProduct.size.split(',').map((s:string) => s.trim()).filter(Boolean).map((s:string) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 block mb-1">Total Quantity</label>
                <div className="flex items-center bg-[#111111] border border-white/10 rounded-xl p-1">
                   <button onClick={() => setQaQty(prev => Math.max(1, (typeof prev==='number'?prev:1) - 1))} className="w-10 h-10 flex items-center justify-center text-white/50 hover:text-white bg-black/50 rounded-lg">-</button>
                   <input type="number" value={qaQty} onChange={(e) => setQaQty(e.target.value === "" ? "" : parseInt(e.target.value))} onBlur={() => {if(qaQty==="" || (typeof qaQty==='number'&&qaQty<1) || isNaN(Number(qaQty))) setQaQty(1)}} className="flex-1 bg-transparent text-center font-black text-lg outline-none" style={{ MozAppearance: 'textfield' }} />
                   <button onClick={() => setQaQty(prev => (typeof prev==='number'?prev:1) + 1)} className="w-10 h-10 flex items-center justify-center text-white/50 hover:text-white bg-black/50 rounded-lg">+</button>
                </div>
              </div>
              
              <div className="pt-2">
                <button onClick={executeQuickAdd} className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-transform active:scale-95">Add to Pipeline</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {cartItems.length > 0 && !isCartOpen && !quickAddProduct && (
        <div className="fixed bottom-6 w-full pointer-events-none z-50 flex justify-center px-4 animate-in slide-in-from-bottom-10 fade-in duration-500">
           <button onClick={() => setIsCartOpen(true)} className="pointer-events-auto bg-emerald-500/90 backdrop-blur-md text-black px-6 py-3 rounded-full font-black shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center gap-4 hover:bg-emerald-400 transition-transform active:scale-95 border border-emerald-400 whitespace-nowrap">
              <div className="relative">
                <ShoppingCart size={18}/>
                <span className="absolute -top-2 -right-2 bg-black text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full border border-emerald-500">{cartCount}</span>
              </div>
              <span className="text-sm border-l border-black/20 pl-4">{cartTotal.toLocaleString()} ETB</span>
              <ChevronRight size={16} className="opacity-50 -ml-2"/>
           </button>
        </div>
      )}

      <div className={`fixed inset-0 z-[80] transition-all duration-500 ${isCartOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div onClick={() => {setIsCartOpen(false); setCheckoutStep(1);}} className={`absolute inset-0 bg-black/80 transition-opacity duration-300 ${isCartOpen ? 'opacity-100' : 'opacity-0'}`} />
        <div className={`absolute top-0 right-0 h-full w-full md:w-[500px] bg-[#050505] border-l border-white/10 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-4 md:p-6 border-b border-white/10 flex justify-between items-center bg-black/40">
            <h2 className="text-lg md:text-xl font-black tracking-wider flex items-center gap-2 md:gap-3">{checkoutStep === 1 ? <><ShoppingCart size={18} style={{ color: 'var(--accent)' }} /> {t("Logistics Cart", "የዕቃ ቅርጫት")}</> : <><FileText size={18} style={{ color: 'var(--accent)' }} /> Logistics & Billing</>}</h2>
            <button onClick={() => {setIsCartOpen(false); setCheckoutStep(1);}} className="p-2 rounded-full hover:bg-white/10 transition-colors opacity-50 hover:opacity-100"><X size={18} /></button>
          </div>
          
          {checkoutStep === 1 ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">
                <div className="space-y-4 h-full flex flex-col">
                  {cartItems.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-30 space-y-4"><ShoppingCart size={48} className="md:w-16 md:h-16" /><p className="font-bold text-sm md:text-base">{t("Pipeline empty.", "ቅርጫቱ ባዶ ነው።")}</p></div>
                  ) : (
                    <div className="flex-1 space-y-3 md:space-y-4">
                      {cartItems.map(item => {
                        const price = parseFloat(item.price) || 0;
                        const qty = parseInt(item.quantity) || 1;
                        const lengthMult = item.allowCustomSize && item.customLength ? parseFloat(item.customLength) : 1;
                        const itemTotal = price * qty * lengthMult;
                        
                        return (
                          <div key={item.cartItemId} className="flex gap-3 md:gap-4 items-center bg-[#111111] border border-white/10 p-2.5 md:p-3 rounded-2xl">
                            <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-black/50 border border-white/5 overflow-hidden flex-shrink-0">
                              {item.imageUrl ? <img src={item.imageUrl} alt={item.title} loading="lazy" className="w-full h-full object-cover" /> : <ImageIcon className="w-full h-full p-3 opacity-30" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-xs md:text-sm mb-0.5 truncate">{item.title}</h4>
                              <p className="text-[10px] md:text-xs opacity-70 mb-1">{(price * lengthMult).toLocaleString()} ETB {item.allowCustomSize && <span className="opacity-50 text-[8px]">(Custom Cut)</span>}</p>
                              
                              <div className="flex gap-1 mb-2 flex-wrap">
                                {item.customLength && <span className="text-[8px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 px-1.5 py-0.5 rounded flex items-center gap-1"><Scissors size={8}/> {item.customLength} {item.customSizeLabel}</span>}
                                {item.selectedSize && <span className="text-[8px] bg-white/10 px-1.5 py-0.5 rounded text-gray-300">Sz: {item.selectedSize}</span>}
                                {item.selectedColor && <span className="text-[8px] bg-white/10 px-1.5 py-0.5 rounded text-gray-300">Col: {item.selectedColor}</span>}
                              </div>
                              <div className="flex items-center gap-1 mt-1 bg-black rounded-lg p-0.5 border border-white/10 w-[60px] md:w-[70px]">
                                <input type="number" value={item.quantity} onChange={(e) => updateCartQuantity(item.cartItemId, e.target.value)} onBlur={(e) => handleCartQuantityBlur(item.cartItemId, e.target.value)} className="w-full bg-transparent text-[10px] md:text-xs font-bold text-center outline-none" style={{ MozAppearance: 'textfield' }} />
                              </div>
                            </div>
                            <div className="flex flex-col items-end justify-between h-full py-1">
                              <button onClick={() => removeFromCart(item.cartItemId)} className="text-red-400/50 hover:text-red-400 transition-colors mb-2 p-1"><Trash2 size={14} /></button>
                              <span className="font-black text-emerald-400 text-xs md:text-sm">{itemTotal.toLocaleString()}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 md:p-6 bg-black/90 border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.8)] z-10">
                <div className="flex justify-between items-end mb-4"><span className="opacity-50 font-medium uppercase tracking-widest text-[10px] md:text-xs">Total Pipeline</span><span className="text-xl md:text-2xl font-black">{cartTotal.toLocaleString()} ETB</span></div>
                <button disabled={cartItems.length === 0} onClick={() => setCheckoutStep(2)} className="w-full py-3 md:py-4 rounded-xl text-white font-black uppercase tracking-widest text-xs md:text-sm transition-transform active:scale-95 flex items-center justify-center gap-2 md:gap-3 shadow-[0_0_30px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:active:scale-100" style={{ backgroundColor: 'var(--accent)' }}>Configure Logistics <ArrowRight size={16} /></button>
              </div>
            </div>
          ) : (
            <form id="checkout-form" onSubmit={handleCheckout} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">
                <div className="space-y-6 md:space-y-8 animate-in slide-in-from-right-4 pb-4">
                  <div className="space-y-3 md:space-y-4">
                    <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-50 border-b border-white/10 pb-2">Billing Identity</h3>
                    <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={16} /><input type="text" required placeholder="Authorized Representative Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-[#111111] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-base md:text-sm" /></div>
                    <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={16} /><input type="tel" required placeholder="Active Phone Number (e.g. 0911...)" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-[#111111] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-base md:text-sm" /></div>
                    <div className="p-3 md:p-4 rounded-xl border border-white/10 bg-[#111111] space-y-3 md:space-y-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={formData.requireVat} onChange={e => setFormData({...formData, requireVat: e.target.checked})} className="w-4 h-4 md:w-5 md:h-5 rounded border-gray-400 text-indigo-600 focus:ring-indigo-500 bg-white/10" />
                        <span className="text-xs md:text-sm font-bold">Require Corporate Invoice (+{systemSettings.taxRate}% VAT)</span>
                      </label>
                      {formData.requireVat && (
                        <div className="space-y-3 pt-2 animate-in fade-in zoom-in-95">
                          <div className="relative"><Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={16} /><input type="text" required placeholder="Registered Company Name" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-[#111111] border border-white/10 rounded-xl outline-none focus:border-emerald-500 text-base md:text-sm" /></div>
                          <div className="relative"><FileText className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={16} /><input type="text" required placeholder="TIN Number (10 Digits)" value={formData.tinNumber} onChange={e => setFormData({...formData, tinNumber: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-[#111111] border border-white/10 rounded-xl outline-none focus:border-emerald-500 text-base md:text-sm font-mono tracking-widest" /></div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 md:space-y-4">
                    <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-50 border-b border-white/10 pb-2">Deployment Strategy</h3>
                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                      <button type="button" onClick={() => setDeliveryType("Delivery")} className={`flex flex-col items-center justify-center gap-1 md:gap-2 p-3 md:p-4 rounded-xl border transition-colors ${deliveryType === "Delivery" ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-white/10 bg-[#111111] hover:bg-white/10'}`}><Truck size={18} className="md:w-5 md:h-5" /> <span className="text-[10px] md:text-xs font-bold">Site Delivery</span></button>
                      <button type="button" onClick={() => setDeliveryType("Warehouse Pickup")} className={`flex flex-col items-center justify-center gap-1 md:gap-2 p-3 md:p-4 rounded-xl border transition-colors ${deliveryType === "Warehouse Pickup" ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' : 'border-white/10 bg-[#111111] hover:bg-white/10'}`}><Building2 size={18} className="md:w-5 md:h-5" /> <span className="text-[10px] md:text-xs font-bold">Self Pickup</span></button>
                    </div>
                  </div>

                  {deliveryType === "Delivery" && (
                    <div className="space-y-3 md:space-y-4 animate-in fade-in">
                      <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={16} />
                        <select required value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-black border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-base md:text-sm appearance-none"><option value="" disabled>Select Region</option>{ethiopianRegions.map(r => <option key={r} value={r}>{r}</option>)}</select>
                      </div>
                      {formData.region === "Addis Ababa" && (
                        <div className="relative"><LocateFixed className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={16} />
                          <select required value={formData.subCity} onChange={e => setFormData({...formData, subCity: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-black border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-base md:text-sm appearance-none"><option value="" disabled>Select Sub-City</option>{addisSubcities.map(sc => <option key={sc} value={sc}>{sc}</option>)}</select>
                        </div>
                      )}
                      <textarea required placeholder="Specific site directions / Google Maps Link" rows={3} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-3 md:p-4 bg-[#111111] border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-base md:text-sm resize-none"></textarea>
                      <p className="text-[9px] md:text-[10px] text-gray-400 uppercase font-bold tracking-widest text-center mt-2 flex items-center justify-center gap-1 md:gap-2"><Truck size={10} className="md:w-3 md:h-3"/> Base delivery starts at {systemSettings.deliveryBaseFee} ETB.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 md:p-6 bg-black/90 border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.8)] z-10">
                {formData.requireVat && (
                  <>
                    <div className="flex justify-between items-center text-xs md:text-sm opacity-70 mb-2 border-b border-white/5 pb-2"><span>Subtotal</span><span>{cartSubtotal.toLocaleString()} ETB</span></div>
                    <div className="flex justify-between items-center text-xs md:text-sm text-emerald-400 mb-3 md:mb-4"><span>VAT ({systemSettings.taxRate}%)</span><span>+ {vatAmount.toLocaleString()} ETB</span></div>
                  </>
                )}
                <div className="flex justify-between items-end mb-4"><span className="opacity-50 font-medium uppercase tracking-widest text-[10px] md:text-xs">Total Pipeline</span><span className="text-xl md:text-2xl font-black">{cartTotal.toLocaleString()} ETB</span></div>
                <div className="flex gap-2 md:gap-3">
                  <button type="button" onClick={() => setCheckoutStep(1)} className="px-4 py-3 md:px-6 md:py-4 rounded-xl border border-white/10 bg-white/5 text-xs md:text-sm font-bold hover:bg-white/10">Back</button>
                  <button type="submit" disabled={isCheckingOut} className="flex-1 py-3 md:py-4 rounded-xl text-black bg-white font-black uppercase tracking-widest text-xs md:text-sm transition-transform active:scale-95 flex items-center justify-center gap-2 md:gap-3 shadow-xl">
                    {isCheckingOut ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                    {isCheckingOut ? "Syncing..." : "Submit Order Pipeline"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
