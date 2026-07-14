"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, getDoc, addDoc } from "firebase/firestore";
import { useTheme, useLanguage } from "@/lib/Providers";
import { 
  ArrowRight, ShoppingCart, PackageSearch, X, Loader2, Trash2, 
  Image as ImageIcon, Search, CheckCircle2, ChevronDown, ChevronRight, 
  MapPin, Phone, User, Truck, Building2, LocateFixed, Activity, Briefcase, FileText, Menu, Mail,
  MessageSquare, Send, Scissors
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

// =======================================================================
// DYNAMIC CUSTOM-CUT PRODUCT CARD
// =======================================================================
const StorefrontProductCard = ({ item, onAddToCart }: { item: any, onAddToCart: (item: any) => void }) => {
  const availableColors = item.color ? item.color.split(',').map((c:string) => c.trim()).filter(Boolean) : [];
  const availableSizes = item.size ? item.size.split(',').map((s:string) => s.trim()).filter(Boolean) : [];
  
  const [localQty, setLocalQty] = useState<number | string>(1);
  const [customLength, setCustomLength] = useState<number | string>(1);
  
  const [selectedColor, setSelectedColor] = useState(availableColors[0] || "");
  const [selectedSize, setSelectedSize] = useState(availableSizes[0] || "");

  const handlePushToCart = () => {
    const finalQty = typeof localQty === 'number' && localQty >= 1 ? localQty : 1;
    const finalLength = typeof customLength === 'number' && customLength > 0 ? customLength : 1;
    
    onAddToCart({
      ...item,
      cartItemId: `${item.id}-${selectedSize}-${selectedColor}-${item.allowCustomSize ? finalLength : 'standard'}`,
      quantity: finalQty,
      selectedColor,
      selectedSize,
      customLength: item.allowCustomSize ? finalLength : null
    });
    setLocalQty(1);
    if(item.allowCustomSize) setCustomLength(1);
  };

  const currentMultiplier = item.allowCustomSize && typeof customLength === 'number' && customLength > 0 ? customLength : 1;
  const currentPrice = (parseFloat(item.price) || 0) * currentMultiplier;

  return (
    <div className="group rounded-2xl md:rounded-[2rem] p-3 md:p-5 bg-[#111111] border border-white/10 transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl relative overflow-hidden flex flex-col h-full">
      {item.imageUrl ? (
        <div className="overflow-hidden bg-black/40 border border-white/5 relative flex-shrink-0 w-full h-32 md:h-48 mb-3 md:mb-5 rounded-xl md:rounded-2xl">
          <img src={item.imageUrl} alt={item.title || "Product"} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        </div>
      ) : (
        <div className="overflow-hidden bg-black/40 border border-white/5 flex flex-col items-center justify-center text-white/30 flex-shrink-0 w-full h-32 md:h-48 mb-3 md:mb-5 rounded-xl md:rounded-2xl">
          <ImageIcon size={24} className="mb-2 md:w-8 md:h-8" />
        </div>
      )}

      <div className="flex flex-col flex-1">
        <div className="flex flex-wrap gap-1 md:gap-2 mb-1.5 md:mb-2">
          <span className="text-[7px] md:text-[9px] font-bold px-1.5 md:px-2 py-0.5 rounded-full bg-white/10 uppercase tracking-wider truncate max-w-[80px] md:max-w-[100px]">{item.menu || "Material"}</span>
          {item.metric && <span className="text-[7px] md:text-[9px] font-bold px-1.5 md:px-2 py-0.5 rounded-full bg-black/50 border border-white/10 uppercase tracking-wider text-gray-400">{item.metric}</span>}
        </div>
        <h4 className="font-bold group-hover:text-white transition-colors truncate text-sm md:text-xl mb-0.5 md:mb-1">{item.title}</h4>
        <p className="opacity-50 truncate text-[9px] md:text-xs mb-3">{item.submenu || ''} {item.type || ''}</p>
        
        {/* CUSTOM LENGTH ENGINE */}
        {item.allowCustomSize && (
          <div className="mb-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 flex items-center justify-between">
            <span className="text-[9px] md:text-[10px] text-yellow-400 font-bold uppercase tracking-widest flex items-center gap-1"><Scissors size={10}/> {item.customSizeLabel || "Length (m)"}</span>
            <input type="number" min="0.1" step="0.1" value={customLength} onChange={(e) => setCustomLength(e.target.value === "" ? "" : parseFloat(e.target.value))} className="w-16 md:w-20 bg-black border border-white/10 rounded px-2 py-1 text-xs text-center outline-none focus:border-yellow-500 text-yellow-400 font-bold" />
          </div>
        )}

        {(availableColors.length > 0 || availableSizes.length > 0) && (
          <div className="flex flex-col xl:flex-row gap-2 mb-4 mt-auto">
            {availableColors.length > 0 && (
              <select value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)} className="flex-1 bg-black border border-white/10 rounded-lg px-2 py-1.5 text-[9px] md:text-xs outline-none">
                {availableColors.map((c: string) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            {availableSizes.length > 0 && (
              <select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)} className="flex-1 bg-black border border-white/10 rounded-lg px-2 py-1.5 text-[9px] md:text-xs outline-none">
                {availableSizes.map((s: string) => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
          </div>
        )}

        <div className="mt-auto flex justify-between items-end pt-3 md:pt-4 border-t border-white/10">
          <div className="flex flex-col truncate pr-1">
            <span className="font-black text-emerald-400 leading-none truncate text-base md:text-2xl">{currentPrice.toLocaleString()}</span>
            <span className="text-[7px] md:text-[10px] opacity-50 uppercase tracking-widest mt-1 truncate">ETB / {item.allowCustomSize ? 'Unit' : item.metric}</span>
          </div>
          
          <div className="flex items-center gap-1 md:gap-2">
            <div className="flex items-center bg-black border border-white/10 rounded-lg p-0.5 h-full w-[40px] md:w-[60px]">
              <input type="number" value={localQty} onChange={(e) => setLocalQty(e.target.value === "" ? "" : parseInt(e.target.value))} onBlur={handleQtyBlur} className="w-full bg-transparent text-[10px] md:text-xs font-bold text-center outline-none" style={{ MozAppearance: 'textfield' }} />
            </div>
            <button onClick={handlePushToCart} className="rounded-lg bg-emerald-500 text-black hover:bg-emerald-400 transition-transform active:scale-95 shadow-lg p-1.5 md:p-2.5">
              <ShoppingCart size={14} className="md:w-4 md:h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
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

  const handleAddToCart = (configuredProduct: any) => {
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
  
  // Adjusted subtotal calculation to include the custom length multiplier
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
      
      // TEMPORARY BYPASS: Since Chapa is failing, route directly to Firebase to test the system end-to-end.
      await addDoc(collection(db, "orders"), payload);
      
      setCartItems([]);
      setIsCartOpen(false);
      setCheckoutStep(1);
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

  // --- SPECIFIC AD DISTRIBUTION LOGIC ---
  const activeAds = marketingAssets.filter(ad => ad.active);
  const heroAds = activeAds.filter(ad => ad.placement === 'hero');
  const floatingAds = activeAds.filter(ad => ad.placement === 'floating');
  const footerAds = activeAds.filter(ad => ad.placement === 'footer');
  const inlineAds = activeAds.filter(ad => ad.placement === 'inline' || !ad.placement);

  const heroAd = heroAds.length > 0 ? heroAds[0] : null;
  const floatingAd = floatingAds.length > 0 ? floatingAds[0] : null;
  const footerAd = footerAds.length > 0 ? footerAds[0] : null;

  // Weave INLINE ads into the product catalog
  const catalogMixedItems: any[] = [];
  let inlineAdCount = 0;
  
  filteredProducts.forEach((product, i) => {
    catalogMixedItems.push({ isAd: false, data: product });
    
    // Inject an ad every 6 items (more spacious for dense grids)
    if ((i + 1) % 6 === 0 && inlineAds.length > 0) {
      const ad = inlineAds[inlineAdCount % inlineAds.length];
      catalogMixedItems.push({ isAd: true, data: ad, shapeVariant: inlineAdCount % 4 });
      inlineAdCount++;
    }
  });

  return (
    <div className="relative min-h-screen font-sans scroll-smooth overflow-x-hidden" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-main)' }}>
      <div className="fixed top-[-20%] left-[-10%] w-[50rem] h-[50rem] pointer-events-none transform-gpu" style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 60%)', opacity: 0.12 }} />
      <div className="fixed bottom-[-10%] right-[-5%] w-[40rem] h-[40rem] pointer-events-none transform-gpu opacity-10" style={{ background: 'radial-gradient(circle, #059669 0%, transparent 60%)' }} />

      <header className={`fixed top-0 w-full z-40 transition-colors duration-300 border-b transform-gpu ${scrolled ? 'bg-black/80 py-3 border-white/10 shadow-2xl backdrop-blur-md' : 'bg-transparent py-3 md:py-5 border-transparent'}`}>
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center font-black text-white shadow-[0_0_20px_rgba(255,255,255,0.1)] text-xs md:text-base overflow-hidden" style={{ backgroundColor: 'var(--accent)' }}>
              {systemSettings.logoUrl ? <img src={systemSettings.logoUrl} className="w-full h-full object-cover" alt="Logo" /> : "AZ"}
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tighter truncate max-w-[150px] md:max-w-none">
              {systemSettings.companyName.split(' ')[0]}<span style={{ color: 'var(--accent)' }}>.</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-2 md:gap-6">
            <button onClick={() => setIsTrackingOpen(true)} className="flex items-center gap-2 px-3 py-1.5 md:px-4 rounded-full bg-white/5 border border-white/10 text-[10px] md:text-xs font-bold hover:bg-white/10 transition-colors">
              <Activity size={14} className="text-emerald-400" /> <span className="hidden sm:inline">{t("Track Order", "ትዕዛዝ ተከታተል")}</span>
            </button>
            <button onClick={() => setLanguage(language === "EN" ? "AM" : "EN")} className="px-3 py-1.5 md:px-4 rounded-full bg-white/5 border border-white/10 text-[10px] md:text-xs font-bold hover:bg-white/10 transition-colors">
              {language === "EN" ? "አማርኛ" : "EN"}
            </button>
            <button onClick={() => setIsCartOpen(true)} className="relative p-2 hover:scale-110 transition-transform">
              <ShoppingCart size={20} className="md:w-6 md:h-6" />
              {cartCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 text-white text-[9px] md:text-[10px] font-bold flex items-center justify-center rounded-full shadow-lg border border-black animate-in zoom-in" style={{ backgroundColor: 'var(--accent)' }}>{cartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* --- FLOATING ORB AD (Z-INDEXED) --- */}
      {floatingAd && (
        <div className="hidden lg:block fixed top-1/3 left-6 z-30 pointer-events-auto group">
          <div className="relative w-24 h-24 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] border-4 border-indigo-500/20 shadow-[0_0_40px_rgba(79,70,229,0.3)] overflow-hidden transition-all duration-700 hover:w-64 hover:h-64 hover:rounded-[2rem] hover:border-emerald-500 hover:shadow-[0_0_50px_rgba(16,185,129,0.5)] cursor-pointer bg-black z-30">
             <AdMedia asset={floatingAd} className="w-full h-full object-cover scale-150 group-hover:scale-100 transition-transform duration-700" />
             <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors duration-500" />
          </div>
        </div>
      )}

      <main className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-6 pt-28 md:pt-40 pb-6 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 md:gap-3 px-4 py-2 md:px-5 md:py-2.5 rounded-full bg-white/5 border border-white/10 mb-6 md:mb-8">
          <span className="relative flex h-2 w-2 md:h-2.5 md:w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 md:h-2.5 md:w-2.5 bg-emerald-500"></span></span>
          <span className="text-[10px] md:text-xs font-semibold tracking-widest text-gray-300 uppercase">{t("Live Sync Active", "ቀጥታ ስርጭት ክፍት ነው")}</span>
        </div>
        <h2 className="text-4xl sm:text-5xl md:text-8xl font-black tracking-tighter mb-4 md:mb-6 leading-[1.1]">{renderSlogan()}</h2>
        
        {/* --- HERO PANORAMIC AD --- */}
        {heroAd && (
          <div className="w-full mt-6 md:mt-10 mb-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 max-w-4xl mx-auto">
            <div className="relative w-full h-24 md:h-32 lg:h-48 rounded-[3rem] md:rounded-[5rem] border border-white/10 shadow-[0_20px_50px_-12px_rgba(16,185,129,0.2)] overflow-hidden group">
              <AdMedia asset={heroAd} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent pointer-events-none" />
              <div className="absolute left-6 md:left-10 top-1/2 -translate-y-1/2 font-black text-white/50 tracking-[0.5em] uppercase text-[8px] md:text-xs rotate-[-90deg] origin-left">Sponsored</div>
            </div>
          </div>
        )}

        <div className="relative w-full max-w-xl mt-4 md:mt-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" size={18} />
          <input 
            type="text" placeholder={t("Search materials...", "ፈልግ...")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-6 py-3 md:py-4 rounded-2xl bg-black/40 border border-white/10 outline-none focus:border-white/30 transition-colors shadow-2xl text-base md:text-lg"
          />
        </div>
      </main>

      <section id="catalog" className="relative z-10 max-w-[1400px] mx-auto px-2 md:px-6 pb-40 flex flex-col md:flex-row gap-4 md:gap-8">
        <div className="md:hidden w-full sticky top-[72px] z-30 px-2">
          <button onClick={() => setIsMobileMatrixOpen(!isMobileMatrixOpen)} className="w-full flex items-center justify-between px-4 py-3 bg-[#111111] border border-white/10 rounded-xl font-bold shadow-2xl">
            <span className="flex items-center gap-2"><Menu size={18} className="text-emerald-400" /> {t("Material Matrix", "የዕቃ አይነቶች")}</span>
            <ChevronDown size={18} className={`transition-transform duration-300 ${isMobileMatrixOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <aside className={`w-full md:w-72 flex-shrink-0 flex-col gap-2 relative px-2 md:px-0 ${isMobileMatrixOpen ? 'flex' : 'hidden md:flex'}`}>
          <div className="sticky top-[100px] bg-[#111111] border border-white/10 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 shadow-2xl overflow-hidden transform-gpu">
            <h3 className="font-black text-sm md:text-lg mb-4 md:mb-6 uppercase tracking-widest border-b border-white/10 pb-3 md:pb-4 hidden md:block">{t("Material Matrix", "የዕቃ አይነቶች")}</h3>
            <button onClick={() => { setActiveFilters({ menu: "All", submenu: "All", type: "All" }); setIsMobileMatrixOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl text-xs md:text-sm font-bold transition-colors mb-2 ${activeFilters.menu === "All" ? 'bg-white text-black' : 'hover:bg-white/10'}`}>{t("View All Pipeline", "ሁሉንም እይ")}</button>
            <div className="space-y-1 max-h-[50vh] md:max-h-[60vh] overflow-y-auto scrollbar-hide pr-2">
              {Object.keys(catalogTree).map(menu => (
                <div key={menu} className="flex flex-col">
                  <button onClick={() => { toggleMenu(menu); setActiveFilters({ menu, submenu: "All", type: "All" }); }} className={`flex items-center justify-between w-full text-left px-3 md:px-4 py-3 rounded-xl text-xs md:text-sm font-bold transition-colors ${activeFilters.menu === menu && activeFilters.submenu === "All" ? 'bg-white/20' : 'hover:bg-white/5'}`} style={{ color: activeFilters.menu === menu ? 'var(--accent)' : '' }}>
                    <span className="truncate pr-2">{menu}</span>{expandedMenus[menu] ? <ChevronDown size={14} className="flex-shrink-0" /> : <ChevronRight size={14} className="flex-shrink-0" />}
                  </button>
                  {expandedMenus[menu] && (
                    <div className="ml-2 md:ml-4 mt-1 border-l border-white/10 flex flex-col gap-1 pl-2">
                      {Object.keys(catalogTree[menu]).map(submenu => (
                        <div key={submenu}>
                          <button onClick={() => { setActiveFilters({ menu, submenu, type: "All" }); setIsMobileMatrixOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-[11px] md:text-xs font-semibold transition-colors ${activeFilters.submenu === submenu && activeFilters.type === "All" ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>{submenu}</button>
                          {activeFilters.submenu === submenu && (
                            <div className="ml-2 md:ml-3 mt-1 flex flex-col gap-1">
                              {Array.from(catalogTree[menu][submenu] as Set<string>).map(type => (
                                type !== "Standard" && type !== "" && (
                                  <button key={type as string} onClick={() => { setActiveFilters({ menu, submenu, type: type as string }); setIsMobileMatrixOpen(false); }} className={`w-full text-left px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] uppercase tracking-wider font-bold transition-colors ${activeFilters.type === type ? 'text-emerald-400' : 'text-gray-500 hover:text-white'}`}>• {type as string}</button>
                                )
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex-1 min-h-screen px-2 md:px-0">
          {!loading && filteredProducts.length > 0 && <div className="flex justify-between items-center mb-4 md:mb-6"><p className="text-xs md:text-sm font-bold opacity-50 uppercase tracking-widest">{filteredProducts.length} Assets Found</p></div>}
          
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">{[1,2,3,4,5,6].map(n => <div key={n} className="rounded-2xl h-[16rem] md:h-[22rem] bg-white/5 border border-white/5 animate-pulse p-4" />)}</div>
          ) : catalogMixedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 md:py-32 opacity-50 border border-dashed border-white/10 rounded-[1.5rem] md:rounded-[2rem] bg-[#111111]"><PackageSearch size={48} className="mb-4 md:mb-6 opacity-30 md:w-16 md:h-16" /><p className="text-base md:text-xl font-bold">{t("No materials match this configuration.", "ምንም እቃዎች አልተገኙም።")}</p></div>
          ) : (
            // FORCED MULTI-COLUMN DENSE GRID (2 columns mobile, 3-4 desktop)
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4 grid-flow-row-dense">
              {catalogMixedItems.map((item, i) => {
                if (!item.isAd) {
                  return (
                    <div key={item.data.id} className="col-span-1 row-span-1 animate-in fade-in zoom-in transform-gpu" style={{ animationDelay: `${(i % 10) * 30}ms` }}>
                      <StorefrontProductCard item={item.data} onAddToCart={handleAddToCart} />
                    </div>
                  );
                } else {
                  // --- THE CRAZY SHAPE VARIANTS ---
                  let shapeClasses = "";
                  switch (item.shapeVariant) {
                    case 0: // Tall Pillar
                      shapeClasses = "col-span-1 row-span-2 rounded-[3rem] min-h-[350px] md:min-h-[450px]"; break;
                    case 1: // Wide Banner
                      shapeClasses = "col-span-2 row-span-1 rounded-bl-[3rem] rounded-tr-[3rem] min-h-[180px] md:min-h-[220px]"; break;
                    case 2: // Perfect Circle
                      shapeClasses = "col-span-1 row-span-1 aspect-square rounded-full scale-95 hover:scale-100"; break;
                    case 3: // Big Feature Square
                      shapeClasses = "col-span-2 row-span-2 rounded-[2rem] min-h-[350px] md:min-h-[450px]"; break;
                  }

                  return (
                    <div key={`ad-${i}`} className={`${shapeClasses} relative overflow-hidden shadow-2xl border border-white/10 group transition-all duration-700 bg-black`}>
                      <AdMedia asset={item.data} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-transform duration-1000 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                      <div className="absolute top-3 right-3 text-[7px] md:text-[8px] tracking-[0.3em] font-black uppercase text-white/50 border border-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">AD</div>
                    </div>
                  );
                }
              })}
            </div>
          )}
        </div>
      </section>

      {/* --- FOOTER DOME AD --- */}
      {footerAd && (
        <div className="w-full relative h-[30vh] md:h-[50vh] overflow-hidden rounded-t-[50%] md:rounded-t-[100%] border-t border-white/10 shadow-[0_-20px_50px_rgba(255,255,255,0.05)] mt-10">
          <AdMedia asset={footerAd} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <h1 className="text-3xl md:text-5xl font-black text-white/80 tracking-widest">{systemSettings.companyName.split(' ')[0]}<span style={{ color: 'var(--accent)' }}>.</span></h1>
            <p className="text-[10px] md:text-xs font-mono opacity-50 mt-2">INDUSTRIAL GRADE • DELIVERED</p>
          </div>
        </div>
      )}

      {/* --- PERSISTENT FLOATING CART BANNER --- */}
      {cartItems.length > 0 && !isCartOpen && (
        <div className="fixed bottom-0 left-0 w-full z-40 p-4 md:p-6 animate-in slide-in-from-bottom-20 duration-500 pointer-events-none">
          <div className="max-w-[1400px] mx-auto flex justify-center md:justify-end">
             <button onClick={() => setIsCartOpen(true)} className="pointer-events-auto w-full md:w-auto bg-emerald-500 text-black px-6 py-4 rounded-2xl md:rounded-[2rem] font-black shadow-[0_10px_40px_rgba(16,185,129,0.3)] flex items-center justify-between gap-6 hover:bg-emerald-400 transition-transform active:scale-95 border-2 border-emerald-400">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-black/10 rounded-full flex items-center justify-center"><ShoppingCart size={16}/></div>
                  <div className="text-left"><p className="text-[10px] uppercase tracking-widest opacity-80 leading-none mb-1">Pipeline Active</p><p className="text-sm md:text-base leading-none">{cartCount} {cartCount === 1 ? 'Item' : 'Items'} • {cartTotal.toLocaleString()} ETB</p></div>
                </div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-80">View <ChevronRight size={16}/></div>
             </button>
          </div>
        </div>
      )}

      {/* --- FLOATING CONTROLS (Moved up slightly to avoid cart banner) --- */}
      <div className={`fixed right-4 md:right-6 z-40 flex flex-col gap-3 transition-all duration-300 ${cartItems.length > 0 && !isCartOpen ? 'bottom-24 md:bottom-28' : 'bottom-4 md:bottom-6'}`}>
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className={`p-3 rounded-full bg-black/80 backdrop-blur-md border border-white/20 shadow-xl transition-all duration-300 flex items-center justify-center ${scrolled ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0 pointer-events-none'}`}><ChevronDown size={20} className="rotate-180" /></button>
        {systemSettings.aiEnabled && <button onClick={() => setIsAiOpen(true)} className="p-3 md:p-4 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-transform hover:scale-110 flex items-center justify-center bg-indigo-600 text-white animate-bounce-slow"><MessageSquare size={24} /></button>}
      </div>

      {/* --- AI CHAT DRAWER --- */}
      <div className={`fixed bottom-4 md:bottom-6 right-4 md:right-24 z-[70] w-[calc(100vw-2rem)] md:w-96 bg-[#0A0A0F] border border-indigo-500/30 rounded-3xl shadow-2xl flex flex-col transition-all duration-300 origin-bottom-right ${isAiOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`} style={{ height: '500px', maxHeight: '80vh' }}>
        <div className="p-4 border-b border-indigo-500/30 flex justify-between items-center bg-indigo-900/20 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg"><Activity size={16} /></div>
            <div><h3 className="font-black text-sm text-indigo-100">AmanZone AI</h3><p className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Online</p></div>
          </div>
          <button onClick={() => setIsAiOpen(false)} className="p-2 text-indigo-300 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-black/40">
          {aiHistory.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white/10 text-gray-200 border border-white/5 rounded-bl-sm'}`}>{msg.text}</div>
            </div>
          ))}
          {isAiTyping && (
            <div className="flex justify-start"><div className="bg-white/10 p-3 rounded-2xl rounded-bl-sm border border-white/5 flex items-center gap-1"><span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span><span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span><span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span></div></div>
          )}
          <div ref={chatEndRef} />
        </div>
        <form onSubmit={handleAiSubmit} className="p-3 border-t border-white/10 bg-[#0A0A0F] rounded-b-3xl flex gap-2">
          <input type="text" placeholder="Ask about materials or stock..." value={aiMessage} onChange={(e) => setAiMessage(e.target.value)} className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-indigo-500 text-sm" />
          <button disabled={isAiTyping} type="submit" className="p-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"><Send size={18} /></button>
        </form>
      </div>

      <div className={`fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 md:px-6 md:py-3 rounded-full bg-white text-black font-bold text-xs md:text-sm shadow-2xl flex items-center gap-2 md:gap-3 transition-all duration-300 ${toast.show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}><CheckCircle2 className="text-emerald-500" size={16} />{toast.msg}</div>

      {/* --- TRACKING DRAWER --- */}
      {isTrackingOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div onClick={() => setIsTrackingOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg bg-[#0A0A0F] border border-white/10 rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <button onClick={() => setIsTrackingOpen(false)} className="absolute top-4 right-4 md:top-6 md:right-6 opacity-50 hover:opacity-100"><X /></button>
            <h2 className="text-xl md:text-2xl font-black mb-2 flex items-center gap-2 md:gap-3"><Activity className="text-emerald-400" /> Pipeline Tracker</h2>
            <form onSubmit={trackOrder} className="flex flex-col sm:flex-row gap-2 mb-6">
              <input type="text" placeholder="e.g. AZ-12345678-999" required value={trackingId} onChange={(e) => setTrackingId(e.target.value)} className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-white/30 font-mono text-base" />
              <button disabled={trackingLoading} type="submit" className="px-6 py-3 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-colors flex items-center justify-center sm:w-32">{trackingLoading ? <Loader2 className="animate-spin" size={18} /> : "Scan"}</button>
            </form>
            {trackingStatus && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                {!trackingStatus.found ? (
                  <p className="text-red-400 text-sm font-bold flex items-center gap-2"><X size={16} /> {trackingStatus.error}</p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-white/10 pb-3">
                      <span className="text-xs uppercase tracking-widest opacity-50">Status</span><span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-[10px] md:text-xs font-black uppercase tracking-wider border border-indigo-500/20">{(trackingStatus.status || "pending").replace("_", " ")}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs md:text-sm">
                      <div><p className="opacity-50 text-[10px] md:text-xs">Client</p><p className="font-bold truncate">{trackingStatus.customerName}</p></div>
                      <div><p className="opacity-50 text-[10px] md:text-xs">Total Value</p><p className="font-bold text-emerald-400">{(trackingStatus.totalAmount || 0).toLocaleString()} ETB</p></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- CART DRAWER --- */}
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
                    <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={16} /><input type="text" required placeholder="Authorized Representative Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-base md:text-sm" /></div>
                    <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={16} /><input type="tel" required placeholder="Active Phone Number (e.g. 0911...)" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-base md:text-sm" /></div>
                    <div className="p-3 md:p-4 rounded-xl border border-white/10 bg-black/30 space-y-3 md:space-y-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={formData.requireVat} onChange={e => setFormData({...formData, requireVat: e.target.checked})} className="w-4 h-4 md:w-5 md:h-5 rounded border-gray-400 text-indigo-600 focus:ring-indigo-500 bg-white/10" />
                        <span className="text-xs md:text-sm font-bold">Require Corporate Invoice (+{systemSettings.taxRate}% VAT)</span>
                      </label>
                      {formData.requireVat && (
                        <div className="space-y-3 pt-2 animate-in fade-in zoom-in-95">
                          <div className="relative"><Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={16} /><input type="text" required placeholder="Registered Company Name" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-emerald-500 text-base md:text-sm" /></div>
                          <div className="relative"><FileText className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={16} /><input type="text" required placeholder="TIN Number (10 Digits)" value={formData.tinNumber} onChange={e => setFormData({...formData, tinNumber: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-emerald-500 text-base md:text-sm font-mono tracking-widest" /></div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 md:space-y-4">
                    <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-50 border-b border-white/10 pb-2">Deployment Strategy</h3>
                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                      <button type="button" onClick={() => setDeliveryType("Delivery")} className={`flex flex-col items-center justify-center gap-1 md:gap-2 p-3 md:p-4 rounded-xl border transition-colors ${deliveryType === "Delivery" ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}><Truck size={18} className="md:w-5 md:h-5" /> <span className="text-[10px] md:text-xs font-bold">Site Delivery</span></button>
                      <button type="button" onClick={() => setDeliveryType("Warehouse Pickup")} className={`flex flex-col items-center justify-center gap-1 md:gap-2 p-3 md:p-4 rounded-xl border transition-colors ${deliveryType === "Warehouse Pickup" ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}><Building2 size={18} className="md:w-5 md:h-5" /> <span className="text-[10px] md:text-xs font-bold">Self Pickup</span></button>
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
                      <textarea required placeholder="Specific site directions / Google Maps Link" rows={3} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-3 md:p-4 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-base md:text-sm resize-none"></textarea>
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

      <style jsx global>{`
        input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>
    </div>
  );
}
