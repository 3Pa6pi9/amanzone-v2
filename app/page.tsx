"use client";

import React, { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, getDoc } from "firebase/firestore";
import { useTheme, useLanguage } from "@/lib/Providers";
import { 
  ArrowRight, ShoppingCart, PackageSearch, X, Loader2, Trash2, 
  Image as ImageIcon, Search, CheckCircle2, ChevronDown, ChevronRight, 
  MapPin, Phone, User, Truck, Building2, LocateFixed, Activity, Briefcase, FileText, Menu
} from "lucide-react";

// --- THE PREDEFINED ETHIOPIAN MATERIAL MATRIX ---
const PREDEFINED_MATRIX: Record<string, string[]> = {
  "የግንባታ ብረት": ["የሀገር ውስጥ", "የቱርክ ብረት"],
  "ቆርቆሮ": ["መደበኛ ቆርቆሮ", "ኤጋ ቆርቆሮ", "ታይልስ ቆርቆሮ"],
  "ጂብሰም ቦርድ": ["የውሃ ስርገት የሚከላከል", "የድምፅ ስርገት የሚከላከል", "መገጣጠሚያዎች"],
  "የኮርኒስ ንጣፍ": ["ፒ.ቪ.ሲ", "Armstrong (አርምስትሮንግ)", "Acrostic (አኮስቲክ)", "መገጣጠሚያዎች"],
  "ጣውላ": ["አውስትራሊያ", "ሻሸመኔ"],
  "MDF": ["የተለጠፈ (Laminated)", "መደበኛ"],
  "ትቦላሬ": [
    "RHS (Rectangular Hallow Section)",
    "CHS (Circular Hallow Section)",
    "SHS (Square Hallow Section)",
    "ቶንዲኖ (Round Bar)",
    "ፊያቶ (Flat Iron)",
    "አንግል (Angel Iron)",
    "ኤል.ቲ.ዜድ (LTZ)",
    "ላሜራ"
  ]
};

export default function PremiumStorefront() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const t = (en: string, am: string) => (language === "EN" ? en : am);

  const [products, setProducts] = useState<any[]>([]);
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
  
  const [formData, setFormData] = useState({ 
    name: "", phone: "", region: "Addis Ababa", subCity: "", address: "",
    companyName: "", tinNumber: "", requireVat: false
  });

  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [trackingId, setTrackingId] = useState("");
  const [trackingStatus, setTrackingStatus] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const [scrolled, setScrolled] = useState(false);
  const [toast, setToast] = useState<{ show: boolean, msg: string }>({ show: false, msg: "" });

  const ethiopianRegions = ["Addis Ababa", "Oromia", "Amhara", "Tigray", "Sidama", "SNNPR", "Somali", "Afar", "Benishangul-Gumuz", "Gambela", "Harari", "Dire Dawa"];
  const addisSubcities = ["Bole", "Yeka", "Nifas Silk-Lafto", "Kirkos", "Kolfe Keranio", "Lideta", "Gulele", "Addis Ketema", "Akaky Kaliti", "Arada", "Lemi Kura"];

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 50);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const q = query(collection(db, "inventory"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsubscribe();
  }, []);

  // --- DYNAMICALLY MERGE PREDEFINED MATRIX WITH ACTIVE PRODUCTS ---
  const catalogTree = useMemo(() => {
    const tree: any = {};
    
    // 1. Initialize with the hardcoded matrix so empty categories still show up
    Object.keys(PREDEFINED_MATRIX).forEach(menu => {
      tree[menu] = {};
      PREDEFINED_MATRIX[menu].forEach(submenu => {
        tree[menu][submenu] = new Set();
      });
    });

    // 2. Populate actual products (adds custom types and custom menus if created)
    products.forEach(p => {
      const m = p.menu || "Uncategorized";
      const sm = p.submenu || "General";
      const tType = p.type || "Standard";
      
      if (!tree[m]) tree[m] = {};
      if (!tree[m][sm]) tree[m][sm] = new Set();
      tree[m][sm].add(tType);
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

  const addToCart = (product: any) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
    setToast({ show: true, msg: `${product.title || "Material"} added to pipeline` });
    setTimeout(() => setToast({ show: false, msg: "" }), 3000);
  };

  const removeFromCart = (id: string) => setCartItems(prev => prev.filter(item => item.id !== id));
  
  const updateCartQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCartItems(prev => prev.map(item => item.id === id ? { ...item, quantity: newQuantity } : item));
  };
  
  const cartSubtotal = cartItems.reduce((total, item) => total + (parseFloat(item.price) * item.quantity), 0);
  const vatAmount = formData.requireVat ? cartSubtotal * 0.15 : 0;
  const cartTotal = cartSubtotal + vatAmount;
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    setIsCheckingOut(true);
    try {
      const payload = {
        items: cartItems,
        customerName: formData.name,
        companyName: formData.companyName,
        tinNumber: formData.tinNumber,
        requireVat: formData.requireVat,
        phone: formData.phone,
        totalAmount: cartSubtotal,
        deliveryType,
        region: formData.region,
        subCity: formData.subCity,
        specificAddress: formData.address
      };
      
      const res = await fetch("/api/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
      else alert(`Payment Initialization Failed: ${data.error || "Check console"}`);
    } catch (error) {
      alert("System error during checkout pipeline.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const trackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrackingLoading(true);
    try {
      const docRef = doc(db, "orders", trackingId.trim());
      const orderSnap = await getDoc(docRef);
      if (orderSnap.exists()) setTrackingStatus({ found: true, ...orderSnap.data() });
      else setTrackingStatus({ found: false, error: "Tracking ID not found in active pipeline." });
    } catch (error) {
      setTrackingStatus({ found: false, error: "Network error accessing Command Center." });
    } finally {
      setTrackingLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen font-sans scroll-smooth" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-main)' }}>
      
      <div className="fixed top-[-20%] left-[-10%] w-[50rem] h-[50rem] pointer-events-none transform-gpu" style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 60%)', opacity: 0.12 }} />
      <div className="fixed bottom-[-10%] right-[-5%] w-[40rem] h-[40rem] pointer-events-none transform-gpu opacity-10" style={{ background: 'radial-gradient(circle, #059669 0%, transparent 60%)' }} />

      {/* Header */}
      <header className={`fixed top-0 w-full z-40 transition-colors duration-300 border-b transform-gpu ${scrolled ? 'bg-black/80 py-3 border-white/10 shadow-2xl backdrop-blur-md' : 'bg-transparent py-3 md:py-5 border-transparent'}`}>
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center font-black text-white shadow-[0_0_20px_rgba(255,255,255,0.1)] text-xs md:text-base" style={{ backgroundColor: 'var(--accent)' }}>AZ</div>
            <h1 className="text-xl md:text-2xl font-black tracking-tighter">AmanZone<span style={{ color: 'var(--accent)' }}>.</span></h1>
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
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 text-white text-[9px] md:text-[10px] font-bold flex items-center justify-center rounded-full shadow-lg border border-black animate-in zoom-in" style={{ backgroundColor: 'var(--accent)' }}>
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-6 pt-28 md:pt-40 pb-10 md:pb-16 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 md:gap-3 px-4 py-2 md:px-5 md:py-2.5 rounded-full bg-white/5 border border-white/10 mb-6 md:mb-8">
          <span className="relative flex h-2 w-2 md:h-2.5 md:w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 md:h-2.5 md:w-2.5 bg-emerald-500"></span></span>
          <span className="text-[10px] md:text-xs font-semibold tracking-widest text-gray-300 uppercase">{t("Live Sync Active", "ቀጥታ ስርጭት ክፍት ነው")}</span>
        </div>
        <h2 className="text-4xl sm:text-5xl md:text-8xl font-black tracking-tighter mb-4 md:mb-6 leading-[1.1]">
          {t("Industrial Grade.", "የግንባታ.")} <br />
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, var(--text-main), var(--accent))' }}>
            {t("Delivered.", "እቃዎች በታማኝነት።")}
          </span>
        </h2>
        <div className="relative w-full max-w-xl mt-4 md:mt-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" size={18} />
          <input 
            type="text" placeholder={t("Search materials...", "ፈልግ...")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-6 py-3 md:py-4 rounded-2xl bg-black/40 border border-white/10 outline-none focus:border-white/30 transition-colors shadow-2xl text-base md:text-lg"
          />
        </div>
      </main>

      {/* Main Architecture: Sidebar + Grid */}
      <section id="catalog" className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-6 pb-40 flex flex-col md:flex-row gap-6 md:gap-8">
        
        {/* MOBILE MATRIX TOGGLE */}
        <div className="md:hidden w-full sticky top-[72px] z-30">
          <button 
            onClick={() => setIsMobileMatrixOpen(!isMobileMatrixOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-[#111111] border border-white/10 rounded-xl font-bold shadow-2xl"
          >
            <span className="flex items-center gap-2"><Menu size={18} className="text-emerald-400" /> {t("Material Matrix", "የዕቃ አይነቶች")}</span>
            <ChevronDown size={18} className={`transition-transform duration-300 ${isMobileMatrixOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Logistics Accordion Sidebar */}
        <aside className={`w-full md:w-72 flex-shrink-0 flex-col gap-2 relative ${isMobileMatrixOpen ? 'flex' : 'hidden md:flex'}`}>
          <div className="sticky top-[100px] bg-[#111111] border border-white/10 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 shadow-2xl overflow-hidden transform-gpu">
            <h3 className="font-black text-sm md:text-lg mb-4 md:mb-6 uppercase tracking-widest border-b border-white/10 pb-3 md:pb-4 hidden md:block">{t("Material Matrix", "የዕቃ አይነቶች")}</h3>
            
            <button 
              onClick={() => { setActiveFilters({ menu: "All", submenu: "All", type: "All" }); setIsMobileMatrixOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs md:text-sm font-bold transition-colors mb-2 ${activeFilters.menu === "All" ? 'bg-white text-black' : 'hover:bg-white/10'}`}
            >
              {t("View All Pipeline", "ሁሉንም እይ")}
            </button>

            <div className="space-y-1 max-h-[50vh] md:max-h-[60vh] overflow-y-auto scrollbar-hide pr-2">
              {Object.keys(catalogTree).map(menu => (
                <div key={menu} className="flex flex-col">
                  <button 
                    onClick={() => {
                      toggleMenu(menu);
                      setActiveFilters({ menu, submenu: "All", type: "All" });
                    }}
                    className={`flex items-center justify-between w-full text-left px-3 md:px-4 py-3 rounded-xl text-xs md:text-sm font-bold transition-colors ${activeFilters.menu === menu && activeFilters.submenu === "All" ? 'bg-white/20' : 'hover:bg-white/5'}`}
                    style={{ color: activeFilters.menu === menu ? 'var(--accent)' : '' }}
                  >
                    <span className="truncate pr-2">{menu}</span>
                    {expandedMenus[menu] ? <ChevronDown size={14} className="flex-shrink-0" /> : <ChevronRight size={14} className="flex-shrink-0" />}
                  </button>

                  {/* Submenus */}
                  {expandedMenus[menu] && (
                    <div className="ml-2 md:ml-4 mt-1 border-l border-white/10 flex flex-col gap-1 pl-2">
                      {Object.keys(catalogTree[menu]).map(submenu => (
                        <div key={submenu}>
                          <button 
                            onClick={() => { setActiveFilters({ menu, submenu, type: "All" }); setIsMobileMatrixOpen(false); }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-[11px] md:text-xs font-semibold transition-colors ${activeFilters.submenu === submenu && activeFilters.type === "All" ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                          >
                            {submenu}
                          </button>
                          
                          {/* Sub-submenus (Types) */}
                          {activeFilters.submenu === submenu && (
                            <div className="ml-2 md:ml-3 mt-1 flex flex-col gap-1">
                              {Array.from(catalogTree[menu][submenu] as Set<string>).map(type => (
                                type !== "Standard" && type !== "" && (
                                  <button 
                                    key={type as string} onClick={() => { setActiveFilters({ menu, submenu, type: type as string }); setIsMobileMatrixOpen(false); }}
                                    className={`w-full text-left px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] uppercase tracking-wider font-bold transition-colors ${activeFilters.type === type ? 'text-emerald-400' : 'text-gray-500 hover:text-white'}`}
                                  >
                                    • {type as string}
                                  </button>
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

        {/* Product Grid */}
        <div className="flex-1 min-h-screen">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[1,2,3,4,5,6].map(n => (
                <div key={n} className="rounded-3xl h-[22rem] md:h-[26rem] bg-white/5 border border-white/5 animate-pulse p-4 md:p-6 flex flex-col" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 md:py-32 opacity-50 border border-dashed border-white/10 rounded-[1.5rem] md:rounded-[2rem] bg-[#111111]">
              <PackageSearch size={48} className="mb-4 md:mb-6 opacity-30 md:w-16 md:h-16" />
              <p className="text-base md:text-xl font-bold">{t("No materials match this configuration.", "ምንም እቃዎች አልተገኙም።")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredProducts.map((item, i) => (
                <div key={item.id} className="group rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 flex flex-col bg-[#111111] border border-white/10 transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl relative overflow-hidden animate-in fade-in zoom-in transform-gpu" style={{ animationDelay: `${(i % 10) * 30}ms` }}>
                  
                  {item.imageUrl ? (
                    <div className="w-full h-48 md:h-56 mb-4 md:mb-6 rounded-[1rem] md:rounded-2xl overflow-hidden bg-black/40 border border-white/5 relative">
                      <img src={item.imageUrl} alt={item.title || "Product"} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 transform-gpu" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                        <p className="text-[10px] md:text-xs font-bold text-white line-clamp-3">{item.description || "Premium structural material ready for deployment."}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-48 md:h-56 mb-4 md:mb-6 rounded-[1rem] md:rounded-2xl overflow-hidden bg-black/40 border border-white/5 flex flex-col items-center justify-center text-white/30">
                      <ImageIcon size={24} className="mb-2 md:w-8 md:h-8" />
                      <span className="text-[10px] md:text-xs uppercase tracking-widest font-bold">No Showcase Asset</span>
                    </div>
                  )}

                  {/* SPECIFICATION BADGES */}
                  <div className="flex flex-wrap gap-1.5 md:gap-2 mb-2 md:mb-3">
                    <span className="text-[8px] md:text-[9px] font-bold px-2 py-0.5 md:px-2.5 md:py-1 rounded-full bg-white/10 uppercase tracking-wider">{item.menu || "Material"}</span>
                    {item.metric && <span className="text-[8px] md:text-[9px] font-bold px-2 py-0.5 md:px-2.5 md:py-1 rounded-full bg-black/50 border border-white/10 uppercase tracking-wider text-gray-400">{item.metric}</span>}
                    {item.size && <span className="text-[8px] md:text-[9px] font-bold px-2 py-0.5 md:px-2.5 md:py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase tracking-wider">Sz: {item.size}</span>}
                    {item.color && <span className="text-[8px] md:text-[9px] font-bold px-2 py-0.5 md:px-2.5 md:py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 uppercase tracking-wider">Clr: {item.color}</span>}
                  </div>
                  
                  <h4 className="text-lg md:text-xl font-bold mb-1 group-hover:text-white transition-colors line-clamp-2">{item.title || "Unnamed Material"}</h4>
                  <p className="text-[10px] md:text-xs mb-4 md:mb-6 opacity-50 line-clamp-1">{item.submenu || ''} {item.type || ''}</p>
                  
                  <div className="mt-auto pt-4 border-t border-white/10 flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="font-black text-xl md:text-2xl text-emerald-400 leading-none">{(parseFloat(item.price) || 0).toLocaleString()}</span>
                      <span className="text-[9px] md:text-[10px] opacity-50 uppercase tracking-widest mt-1">ETB / Unit</span>
                    </div>
                    <button onClick={() => addToCart(item)} className="p-2.5 md:p-3.5 rounded-[1rem] bg-white/5 hover:text-white transition-transform active:scale-95 border border-white/10 shadow-lg hover:bg-[var(--accent)]">
                      <ShoppingCart size={18} className="md:w-5 md:h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-40 flex flex-col gap-4">
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className={`p-2.5 md:p-3 rounded-full bg-black/80 backdrop-blur-md border border-white/20 shadow-xl transition-all duration-300 ${scrolled ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0'}`}>
          <ChevronDown size={18} className="rotate-180 md:w-5 md:h-5" />
        </button>
      </div>

      {/* Dynamic Toast */}
      <div className={`fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 md:px-6 md:py-3 rounded-full bg-white text-black font-bold text-xs md:text-sm shadow-2xl flex items-center gap-2 md:gap-3 transition-all duration-300 ${toast.show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        <CheckCircle2 className="text-emerald-500" size={16} />
        {toast.msg}
      </div>

      {/* --- LIVE TRACKING MODAL --- */}
      {isTrackingOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div onClick={() => setIsTrackingOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg bg-[#0A0A0F] border border-white/10 rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <button onClick={() => setIsTrackingOpen(false)} className="absolute top-4 right-4 md:top-6 md:right-6 opacity-50 hover:opacity-100"><X /></button>
            <h2 className="text-xl md:text-2xl font-black mb-2 flex items-center gap-2 md:gap-3"><Activity className="text-emerald-400" /> Pipeline Tracker</h2>
            <p className="text-xs md:text-sm opacity-50 mb-4 md:mb-6">Enter your Chapa TX-REF to view live logistics status.</p>
            
            <form onSubmit={trackOrder} className="flex flex-col sm:flex-row gap-2 mb-6">
              <input 
                type="text" placeholder="e.g. AZ-12345678-999" required value={trackingId} onChange={(e) => setTrackingId(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-white/30 font-mono text-base"
              />
              <button disabled={trackingLoading} type="submit" className="px-6 py-3 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-colors flex items-center justify-center sm:w-32">
                {trackingLoading ? <Loader2 className="animate-spin" size={18} /> : "Scan"}
              </button>
            </form>

            {trackingStatus && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                {!trackingStatus.found ? (
                  <p className="text-red-400 text-sm font-bold flex items-center gap-2"><X size={16} /> {trackingStatus.error}</p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-white/10 pb-3">
                      <span className="text-xs uppercase tracking-widest opacity-50">Status</span>
                      <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-[10px] md:text-xs font-black uppercase tracking-wider border border-indigo-500/20">
                        {trackingStatus.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs md:text-sm">
                      <div><p className="opacity-50 text-[10px] md:text-xs">Client</p><p className="font-bold truncate">{trackingStatus.customerName}</p></div>
                      <div><p className="opacity-50 text-[10px] md:text-xs">Total Value</p><p className="font-bold text-emerald-400">{(trackingStatus.totalAmount || 0).toLocaleString()} ETB</p></div>
                      <div className="col-span-2">
                        <p className="opacity-50 text-[10px] md:text-xs">Logistics Route</p>
                        <p className="font-bold">{trackingStatus.deliveryType === "Delivery" ? `${trackingStatus.logistics.region}, ${trackingStatus.logistics.subCity}` : "Warehouse Pickup (Bole, Addis Ababa)"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- PRE-CHECKOUT TWO-STEP DRAWER --- */}
      <div className={`fixed inset-0 z-50 transition-all duration-500 ${isCartOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div onClick={() => {setIsCartOpen(false); setCheckoutStep(1);}} className={`absolute inset-0 bg-black/80 transition-opacity duration-300 ${isCartOpen ? 'opacity-100' : 'opacity-0'}`} />
        
        <div className={`absolute top-0 right-0 h-full w-full md:w-[500px] bg-[#050505] border-l border-white/10 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          
          <div className="p-4 md:p-6 border-b border-white/10 flex justify-between items-center bg-black/40">
            <h2 className="text-lg md:text-xl font-black tracking-wider flex items-center gap-2 md:gap-3">
              {checkoutStep === 1 ? <><ShoppingCart size={18} style={{ color: 'var(--accent)' }} /> {t("Logistics Cart", "የዕቃ ቅርጫት")}</> : <><FileText size={18} style={{ color: 'var(--accent)' }} /> Logistics & Billing</>}
            </h2>
            <button onClick={() => {setIsCartOpen(false); setCheckoutStep(1);}} className="p-2 rounded-full hover:bg-white/10 transition-colors opacity-50 hover:opacity-100"><X size={18} /></button>
          </div>
          
          {checkoutStep === 1 ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">
                <div className="space-y-4 h-full flex flex-col">
                  {cartItems.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-30 space-y-4">
                      <ShoppingCart size={48} className="md:w-16 md:h-16" />
                      <p className="font-bold text-sm md:text-base">{t("Pipeline empty.", "ቅርጫቱ ባዶ ነው።")}</p>
                    </div>
                  ) : (
                    <div className="flex-1 space-y-3 md:space-y-4">
                      {cartItems.map(item => (
                        <div key={item.id} className="flex gap-3 md:gap-4 items-center bg-[#111111] border border-white/10 p-2.5 md:p-3 rounded-2xl">
                          <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-black/50 border border-white/5 overflow-hidden flex-shrink-0">
                            {item.imageUrl ? <img src={item.imageUrl} alt={item.title} loading="lazy" decoding="async" className="w-full h-full object-cover" /> : <ImageIcon className="w-full h-full p-3 opacity-30" />}
                          </div>
                          
                          <div className="flex-1">
                            <h4 className="font-bold text-xs md:text-sm mb-0.5 line-clamp-1">{item.title}</h4>
                            
                            {(item.size || item.color) && (
                              <p className="text-[8px] md:text-[9px] uppercase tracking-widest opacity-50 mb-1">
                                {item.size && <span className="mr-2">[{item.size}]</span>}
                                {item.color && <span>[{item.color}]</span>}
                              </p>
                            )}
                            
                            <p className="text-[10px] md:text-xs opacity-70 mb-1 md:mb-2">{(parseFloat(item.price) || 0).toLocaleString()} ETB</p>
                            
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] md:text-[10px] font-bold opacity-50 uppercase tracking-widest">QTY:</span>
                              <input 
                                type="number" min="1" value={item.quantity || 1} 
                                onChange={(e) => updateCartQuantity(item.id, parseInt(e.target.value) || 1)}
                                className="w-14 md:w-16 px-1 md:px-2 py-0.5 bg-black border border-white/10 rounded text-[10px] md:text-xs font-bold text-center outline-none focus:border-[var(--accent)]"
                              />
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end justify-between h-full py-1">
                            <button onClick={() => removeFromCart(item.id)} className="text-red-400/50 hover:text-red-400 transition-colors mb-2 p-1"><Trash2 size={14} /></button>
                            <span className="font-black text-emerald-400 text-xs md:text-sm">{((parseFloat(item.price) || 0) * item.quantity).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 md:p-6 bg-black/90 border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.8)] z-10">
                <div className="flex justify-between items-end mb-4">
                  <span className="opacity-50 font-medium uppercase tracking-widest text-[10px] md:text-xs">Total Pipeline</span>
                  <span className="text-xl md:text-2xl font-black">{cartTotal.toLocaleString()} ETB</span>
                </div>
                <button onClick={() => setCheckoutStep(2)} className="w-full py-3 md:py-4 rounded-xl text-white font-black uppercase tracking-widest text-xs md:text-sm transition-transform active:scale-95 flex items-center justify-center gap-2 md:gap-3 shadow-[0_0_30px_rgba(255,255,255,0.1)]" style={{ backgroundColor: 'var(--accent)' }}>
                  Configure Logistics <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            // FORM WRAPS THE SCROLLING AREA AND THE FOOTER BUTTONS
            <form id="checkout-form" onSubmit={handleCheckout} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">
                <div className="space-y-6 md:space-y-8 animate-in slide-in-from-right-4 pb-4">
                  
                  <div className="space-y-3 md:space-y-4">
                    <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-50 border-b border-white/10 pb-2">Billing Identity</h3>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={16} />
                      <input type="text" required placeholder="Authorized Representative Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-base md:text-sm" />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={16} />
                      <input type="tel" required placeholder="Active Phone Number (e.g. 0911...)" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-base md:text-sm" />
                    </div>
                    
                    <div className="p-3 md:p-4 rounded-xl border border-white/10 bg-black/30 space-y-3 md:space-y-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={formData.requireVat} onChange={e => setFormData({...formData, requireVat: e.target.checked})} className="w-4 h-4 md:w-5 md:h-5 rounded border-gray-400 text-indigo-600 focus:ring-indigo-500 bg-white/10" />
                        <span className="text-xs md:text-sm font-bold">Require Corporate Invoice (+15% VAT)</span>
                      </label>
                      
                      {formData.requireVat && (
                        <div className="space-y-3 pt-2 animate-in fade-in zoom-in-95">
                          <div className="relative">
                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={16} />
                            <input type="text" required placeholder="Registered Company Name" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-emerald-500 text-base md:text-sm" />
                          </div>
                          <div className="relative">
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={16} />
                            <input type="text" required placeholder="TIN Number (10 Digits)" value={formData.tinNumber} onChange={e => setFormData({...formData, tinNumber: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-emerald-500 text-base md:text-sm font-mono tracking-widest" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 md:space-y-4">
                    <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-50 border-b border-white/10 pb-2">Deployment Strategy</h3>
                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                      <button type="button" onClick={() => setDeliveryType("Delivery")} className={`flex flex-col items-center justify-center gap-1 md:gap-2 p-3 md:p-4 rounded-xl border transition-colors ${deliveryType === "Delivery" ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                        <Truck size={18} className="md:w-5 md:h-5" /> <span className="text-[10px] md:text-xs font-bold">Site Delivery</span>
                      </button>
                      <button type="button" onClick={() => setDeliveryType("Warehouse Pickup")} className={`flex flex-col items-center justify-center gap-1 md:gap-2 p-3 md:p-4 rounded-xl border transition-colors ${deliveryType === "Warehouse Pickup" ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                        <Building2 size={18} className="md:w-5 md:h-5" /> <span className="text-[10px] md:text-xs font-bold">Self Pickup</span>
                      </button>
                    </div>
                  </div>

                  {deliveryType === "Delivery" && (
                    <div className="space-y-3 md:space-y-4 animate-in fade-in">
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={16} />
                        <select required value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-black border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-base md:text-sm appearance-none">
                          <option value="" disabled>Select Region</option>
                          {ethiopianRegions.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      {formData.region === "Addis Ababa" && (
                        <div className="relative">
                          <LocateFixed className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={16} />
                          <select required value={formData.subCity} onChange={e => setFormData({...formData, subCity: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-black border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-base md:text-sm appearance-none">
                            <option value="" disabled>Select Sub-City</option>
                            {addisSubcities.map(sc => <option key={sc} value={sc}>{sc}</option>)}
                          </select>
                        </div>
                      )}
                      <textarea required placeholder="Specific site directions / Google Maps Link" rows={3} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-3 md:p-4 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-indigo-500 text-base md:text-sm resize-none"></textarea>
                      <p className="text-[9px] md:text-[10px] text-gray-400 uppercase font-bold tracking-widest text-center mt-2 flex items-center justify-center gap-1 md:gap-2"><Truck size={10} className="md:w-3 md:h-3"/> Delivery cost calculated post-inspection.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 md:p-6 bg-black/90 border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.8)] z-10">
                {formData.requireVat && (
                  <>
                    <div className="flex justify-between items-center text-xs md:text-sm opacity-70 mb-2 border-b border-white/5 pb-2">
                      <span>Subtotal</span>
                      <span>{cartSubtotal.toLocaleString()} ETB</span>
                    </div>
                    <div className="flex justify-between items-center text-xs md:text-sm text-emerald-400 mb-3 md:mb-4">
                      <span>VAT (15%)</span>
                      <span>+ {vatAmount.toLocaleString()} ETB</span>
                    </div>
                  </>
                )}
                
                <div className="flex justify-between items-end mb-4">
                  <span className="opacity-50 font-medium uppercase tracking-widest text-[10px] md:text-xs">Total Pipeline</span>
                  <span className="text-xl md:text-2xl font-black">{cartTotal.toLocaleString()} ETB</span>
                </div>
                
                <div className="flex gap-2 md:gap-3">
                  <button type="button" onClick={() => setCheckoutStep(1)} className="px-4 py-3 md:px-6 md:py-4 rounded-xl border border-white/10 bg-white/5 text-xs md:text-sm font-bold hover:bg-white/10">Back</button>
                  <button type="submit" disabled={isCheckingOut} className="flex-1 py-3 md:py-4 rounded-xl text-black bg-white font-black uppercase tracking-widest text-xs md:text-sm transition-transform active:scale-95 flex items-center justify-center gap-2 md:gap-3 shadow-xl">
                    {isCheckingOut ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                    {isCheckingOut ? "Connecting..." : "Pay via Chapa"}
                  </button>
                </div>
              </div>
            </form>
          )}

        </div>
      </div>

      {/* Enterprise Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black/80 pt-20 pb-10 mt-20 transform-gpu">
        <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white" style={{ backgroundColor: 'var(--accent)' }}>AZ</div>
              <h2 className="text-xl font-black tracking-tighter">AmanZone Trading PLC</h2>
            </div>
            <p className="opacity-50 text-sm max-w-sm leading-relaxed mb-6">Ethiopia's premier logistics and supply matrix for industrial-grade construction materials. Deployed with precision, secured by technology.</p>
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto px-6 pt-8 border-t border-white/5 text-center flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs opacity-30 font-bold uppercase tracking-widest">© 2026 AmanZone Trading PLC.</p>
        </div>
      </footer>
    </div>
  );
}
