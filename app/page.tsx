"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, getDoc, addDoc, where } from "firebase/firestore";
import { useTheme, useLanguage } from "@/lib/Providers";
import { 
  ArrowRight, ShoppingCart, PackageSearch, X, Loader2, Trash2, 
  Image as ImageIcon, Search, CheckCircle2, ChevronDown, ChevronRight, 
  MapPin, Phone, User, Truck, Building2, LocateFixed, Activity, Briefcase, FileText, Menu, Mail,
  MessageSquare, Send, Scissors, Plus, Sun, Moon, LogIn, UserPlus, ShieldCheck, Clock
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

const formatDate = (val: any) => {
  if (!val) return "N/A";
  try {
    if (val.toDate) return val.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const date = new Date(val);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) { return "N/A"; }
};

const getStatusColor = (status: string) => {
  switch (status) { 
    case 'pending_payment': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'; 
    case 'processing': return 'text-blue-500 bg-blue-500/10 border-blue-500/20'; 
    case 'dispatched': return 'text-purple-500 bg-purple-500/10 border-purple-500/20'; 
    case 'delivered': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'; 
    default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20'; 
  }
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
  const [shuffledProducts, setShuffledProducts] = useState<any[]>([]);
  const [marketingAssets, setMarketingAssets] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<any>(initialSettingsState);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [activeFilters, setActiveFilters] = useState({ menu: "All", submenu: "All", type: "All" });

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2>(1);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  
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

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authForm, setAuthForm] = useState({ name: "", phone: "", password: "", companyName: "", tinNumber: "" });
  
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [clientOrders, setClientOrders] = useState<any[]>([]);

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
    const unsubscribe = onSnapshot(q, (snapshot) => { 
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(fetched);
      setShuffledProducts([...fetched].sort(() => Math.random() - 0.5));
      setLoading(false); 
    }, () => setLoading(false));
    const unsubMarketing = onSnapshot(query(collection(db, "marketing"), orderBy("createdAt", "desc")), (snapshot) => { setMarketingAssets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); });
    const unsubSettings = onSnapshot(doc(db, "settings", "global"), (docSnap) => { if (docSnap.exists()) setSystemSettings({ ...initialSettingsState, ...docSnap.data() }); });
    
    try {
      const cachedUser = localStorage.getItem("az_client_user");
      if (cachedUser) {
        const parsed = JSON.parse(cachedUser);
        setCurrentUser(parsed);
        setFormData(prev => ({ ...prev, name: parsed.name, phone: parsed.phone, companyName: parsed.companyName || "", tinNumber: parsed.tinNumber || "", requireVat: !!parsed.tinNumber }));
      }
    } catch(e){}

    return () => { unsubscribe(); unsubMarketing(); unsubSettings(); };
  }, []);

  useEffect(() => {
    if (!currentUser?.phone) {
      setClientOrders([]);
      return;
    }
    const qUser = query(collection(db, "orders"), where("phone", "==", currentUser.phone));
    const unsubOrders = onSnapshot(qUser, (snapshot) => {
      const ords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      ords.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setClientOrders(ords);
    });
    return () => unsubOrders();
  }, [currentUser]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [aiHistory, isAiTyping]);

  const uniqueMenus = useMemo(() => Array.from(new Set([...Object.keys(PREDEFINED_MATRIX), ...products.map(p => p.menu).filter(Boolean)])), [products]);

  const filteredProducts = useMemo(() => {
    return shuffledProducts.filter(p => {
      const searchMatch = (p.title || "").toLowerCase().includes(searchQuery.toLowerCase()) || (p.menu || "").toLowerCase().includes(searchQuery.toLowerCase());
      const menuMatch = activeFilters.menu === "All" || p.menu === activeFilters.menu;
      return searchMatch && menuMatch;
    });
  }, [shuffledProducts, searchQuery, activeFilters]);

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

  const handleClientAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === "signup") {
      if (!authForm.name || !authForm.phone || !authForm.password) { alert("Please complete required parameters."); return; }
      const profile = { name: authForm.name, phone: authForm.phone, companyName: authForm.companyName, tinNumber: authForm.tinNumber };
      localStorage.setItem("az_client_user", JSON.stringify(profile));
      setCurrentUser(profile);
      setFormData(prev => ({ ...prev, name: profile.name, phone: profile.phone, companyName: profile.companyName, tinNumber: profile.tinNumber, requireVat: !!profile.tinNumber }));
      setToast({ show: true, msg: "Logistics Profile Established." });
    } else {
      if (!authForm.phone || !authForm.password) { alert("Enter credentials."); return; }
      const profile = { name: authForm.name || "Verified Representative", phone: authForm.phone, companyName: authForm.companyName, tinNumber: authForm.tinNumber };
      localStorage.setItem("az_client_user", JSON.stringify(profile));
      setCurrentUser(profile);
      setToast({ show: true, msg: "Welcome back." });
    }
    setIsAuthOpen(false);
    setTimeout(() => setToast({ show: false, msg: "" }), 3000);
  };

  const handleClientLogout = () => {
    localStorage.removeItem("az_client_user");
    setCurrentUser(null);
    setFormData({ name: "", phone: "", region: "Addis Ababa", subCity: "", address: "", companyName: "", tinNumber: "", requireVat: false });
    setIsDashboardOpen(false);
    setToast({ show: true, msg: "Session revoked." });
    setTimeout(() => setToast({ show: false, msg: "" }), 3000);
  };

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
      
      await addDoc(collection(db, "orders"), payload);
      
      // 📡 LIVE TELEGRAM NEURAL LINK
      try {
        const tgBotToken = "8901674777:AAFJU1bLmXWXY2E0Ozgx2CY-zdgwW4jt6pw"; 
        const tgChatId = "650359151"; // Brother's Authenticated ID
        
        if (tgChatId !== "YOUR_CHAT_ID") {
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
        console.warn("Telegram API failed to dispatch", tgError);
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

  const activeAds = marketingAssets.filter(ad => ad.active);
  const heroAds = activeAds.filter(ad => ad.placement === 'hero');
  const footerAds = activeAds.filter(ad => ad.placement === 'footer');
  const inlineAds = activeAds.filter(ad => ad.placement === 'inline' || !ad.placement);
  const marqueeAds = activeAds.filter(ad => ad.placement === 'marquee');

  const heroAd = heroAds.length > 0 ? heroAds[0] : null;
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
    <div className={`relative min-h-screen font-sans scroll-smooth transition-colors duration-300 ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-[#F4F6F9] text-gray-900'}`}>
      <style jsx global>{`
        @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 25s linear infinite; }
        .animate-marquee:hover { animation-play-state: paused; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>

      <header className={`fixed top-0 w-full z-40 transition-all duration-300 border-b ${scrolled ? (isDarkMode ? 'bg-black/90 border-white/10 shadow-2xl backdrop-blur-md' : 'bg-white/95 border-gray-200 shadow-xl backdrop-blur-md') : (isDarkMode ? 'bg-[#0A0A0F]/90 border-white/5' : 'bg-white border-gray-100')}`}>
        <div className="max-w-[1400px] mx-auto px-3 md:px-6 py-2 md:py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
          
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs bg-emerald-500 shadow-md">AZ</div>
              <h1 className="text-lg md:text-2xl font-black tracking-tight uppercase">{systemSettings.companyName.split(' ')[0]}<span className="text-emerald-500">.</span></h1>
            </div>
            
            <div className="flex items-center gap-2">
              <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-white/5 text-yellow-400 hover:bg-white/10' : 'bg-gray-100 text-indigo-600 hover:bg-gray-200'}`}>
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              
              {currentUser ? (
                <button onClick={() => setIsDashboardOpen(true)} className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase truncate max-w-[120px]">
                  <ShieldCheck size={12}/> {currentUser.name}
                </button>
              ) : (
                <button onClick={() => { setAuthMode("signup"); setIsAuthOpen(true); }} className={`md:hidden p-2 rounded-lg ${isDarkMode ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                  <UserPlus size={16} />
                </button>
              )}
            </div>
          </div>
          
          <div className="relative w-full md:w-[350px] lg:w-[480px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={15} />
            <input 
              type="text" placeholder={t("Search over 1,000 heavy building assets...", "የግንባታ እቃዎችን እዚህ ይፈልጉ...")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs outline-none transition-all ${isDarkMode ? 'bg-[#111111] border border-white/10 text-white focus:border-emerald-500' : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-emerald-500 focus:bg-white'}`}
            />
          </div>

          <div className="hidden md:flex items-center gap-4 text-xs font-bold">
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border ${isDarkMode ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'}`}><MapPin size={12} className="text-emerald-500"/> Addis Ababa</div>
            <button onClick={() => setIsTrackingOpen(true)} className="hover:text-emerald-500 transition-colors">{t("Track Route", "ትዕዛዝ ተከታተል")}</button>
            
            {currentUser ? (
              <button onClick={() => setIsDashboardOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider text-[10px] hover:bg-emerald-500 hover:text-black transition-colors">
                <ShieldCheck size={14}/> {currentUser.name}
              </button>
            ) : (
              <button onClick={() => { setAuthMode("signup"); setIsAuthOpen(true); }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border uppercase tracking-wider text-[10px] transition-colors ${isDarkMode ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                <LogIn size={13} /> {t("Join / Profile", "መለያ ፍጠር")}
              </button>
            )}
          </div>
        </div>

        <div className={`border-t ${isDarkMode ? 'border-white/5 bg-black/40' : 'border-gray-200 bg-white'}`}>
          <div className="max-w-[1400px] mx-auto px-3 md:px-6 py-2">
             <div className="flex overflow-x-auto gap-1.5 pb-1 scrollbar-hide snap-x">
               <button onClick={() => setActiveFilters({menu: 'All', submenu: 'All', type: 'All'})} className={`snap-start flex-shrink-0 px-3.5 py-1.5 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-wider transition-all border ${activeFilters.menu === 'All' ? 'bg-emerald-500 text-black border-emerald-500' : (isDarkMode ? 'bg-[#111111] text-gray-400 border-white/5 hover:bg-white/5' : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200')}`}>All Materials</button>
               {uniqueMenus.map((menu:any) => (
                 <button key={menu} onClick={() => setActiveFilters({menu, submenu: 'All', type: 'All'})} className={`snap-start flex-shrink-0 px-3.5 py-1.5 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-wider transition-all border ${activeFilters.menu === menu ? 'bg-emerald-500 text-black border-emerald-500' : (isDarkMode ? 'bg-[#111111] text-gray-400 border-white/5 hover:bg-white/5' : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200')}`}>{menu}</button>
               ))}
             </div>
          </div>
        </div>
      </header>

      <div className="pt-28 md:pt-36"></div>

      {heroAd && (
        <div className="w-full max-w-[1400px] mx-auto px-3 md:px-6 mb-4">
          <div className={`relative w-full h-20 md:h-32 rounded-xl border overflow-hidden group ${isDarkMode ? 'border-white/10 bg-[#111111]' : 'border-gray-200 bg-white'}`}>
            <AdMedia asset={heroAd} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>
      )}

      {marqueeAds.length > 0 && (
        <div className={`w-full border-y py-1.5 md:py-2 overflow-hidden flex relative mb-4 ${isDarkMode ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
          <div className="animate-marquee flex gap-4 md:gap-8 items-center min-w-max px-4">
            {[...marqueeAds, ...marqueeAds, ...marqueeAds].map((ad, i) => (
              <div key={i} className={`flex items-center gap-2 pr-3 rounded-full border shadow-sm overflow-hidden h-7 md:h-8 ${isDarkMode ? 'bg-black border-white/5 text-emerald-400' : 'bg-white border-gray-200 text-emerald-600'}`}>
                <AdMedia asset={ad} className="h-full w-16 md:w-20 object-cover" />
                <span className="font-black tracking-widest text-[8px] uppercase whitespace-nowrap">Market Hot Deal</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <section id="catalog" className="max-w-[1400px] mx-auto px-2 md:px-6 pb-40">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">{[1,2,3,4,5,6,7,8,9,10].map(n => <div key={n} className={`rounded-xl aspect-[4/5] animate-pulse ${isDarkMode ? 'bg-white/5' : 'bg-gray-200'}`} />)}</div>
        ) : catalogMixedItems.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-20 opacity-50 border border-dashed rounded-xl ${isDarkMode ? 'border-white/10 bg-[#111111]' : 'border-gray-300 bg-white'}`}><PackageSearch size={40} className="mb-3 opacity-30" /><p className="text-xs font-bold">No assets found matching parameters.</p></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3 grid-flow-row-dense">
            {catalogMixedItems.map((item, i) => {
              if (!item.isAd) {
                const product = item.data;
                return (
                  <div key={product.id} onClick={() => openQuickAdd(product)} className={`col-span-1 border rounded-xl overflow-hidden flex flex-col hover:shadow-md transition-all cursor-pointer group animate-in fade-in ${isDarkMode ? 'bg-[#111111] border-white/10 hover:border-emerald-500/50' : 'bg-white border-gray-200 hover:border-emerald-500'}`}>
                    <div className={`relative aspect-square overflow-hidden ${isDarkMode ? 'bg-black/50' : 'bg-gray-100'}`}>
                       {product.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102" alt="product"/> : <div className="w-full h-full flex items-center justify-center opacity-10"><ImageIcon size={20}/></div>}
                       {product.allowCustomSize && <span className="absolute top-1.5 left-1.5 bg-yellow-500 text-black text-[7px] font-black px-1.5 py-0.5 rounded shadow">CUT PER M</span>}
                    </div>
                    <div className="p-2.5 md:p-3 flex flex-col flex-1">
                       <p className="font-black text-emerald-500 text-xs md:text-base leading-none mb-1">{(parseFloat(product.price) || 0).toLocaleString()} <span className="text-[7px] md:text-[8px] opacity-60 font-medium">ETB</span></p>
                       <p className={`text-[10px] md:text-xs font-semibold line-clamp-2 leading-tight flex-1 ${isDarkMode ? 'text-white/90' : 'text-gray-800'}`}>{product.title}</p>
                       <div className="pt-2 mt-2 border-t border-gray-500/10 flex justify-between items-center text-[8px] md:text-[9px] opacity-40">
                         <span className="truncate flex items-center gap-0.5 max-w-[70%]"><MapPin size={8}/> {product.warehouse || "Central Warehouse"}</span>
                         <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-700'} group-hover:bg-emerald-500 group-hover:text-black group-hover:border-emerald-500 transition-colors`}><Plus size={10}/></div>
                       </div>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={`ad-${i}`} className={`col-span-2 row-span-1 rounded-xl overflow-hidden shadow-sm border group bg-black min-h-[110px] relative border-indigo-500/20`}>
                    <AdMedia asset={item.data} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-transform duration-700" />
                    <span className="absolute top-2 right-2 text-[6px] tracking-widest font-black uppercase text-white/40 border border-white/20 px-1 rounded backdrop-blur-sm">AD</span>
                  </div>
                );
              }
            })}
          </div>
        )}
      </section>

      {footerAd && (
        <div className={`w-full relative h-[20vh] md:h-[30vh] overflow-hidden rounded-t-[3rem] border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
          <AdMedia asset={footerAd} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />
        </div>
      )}

      {cartItems.length > 0 && !isCartOpen && !quickAddProduct && (
        <div className="fixed bottom-5 w-full pointer-events-none z-50 flex justify-center px-4 animate-in slide-in-from-bottom-10 duration-300">
           <button onClick={() => setIsCartOpen(true)} className="pointer-events-auto bg-emerald-500 text-black px-5 py-2.5 rounded-full font-black shadow-xl flex items-center gap-3 border border-emerald-400 whitespace-nowrap hover:bg-emerald-400 transition-transform active:scale-95">
              <div className="relative">
                <ShoppingCart size={16}/>
                <span className="absolute -top-2 -right-2 bg-black text-white text-[8px] w-3.5 h-3.5 flex items-center justify-center rounded-full border border-emerald-500">{cartCount}</span>
              </div>
              <span className="text-xs border-l border-black/10 pl-3">{cartTotal.toLocaleString()} ETB</span>
              <ChevronRight size={14} className="opacity-60"/>
           </button>
        </div>
      )}

      {isAuthOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsAuthOpen(false)} />
          <div className={`relative w-full max-w-sm rounded-2xl p-5 md:p-6 shadow-2xl ${isDarkMode ? 'bg-[#111111] border border-white/10' : 'bg-white border border-gray-200 text-gray-900'}`}>
            <button onClick={() => setIsAuthOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-full opacity-50 hover:opacity-100"><X size={16}/></button>
            <h3 className="font-black text-lg mb-1">{authMode === "signup" ? t("Establish Representative Profile", "የኩባንያ መለያ መፍጠሪያ") : t("Authorized Access Signature", "መለያ መግቢያ")}</h3>
            <p className="text-[11px] opacity-50 mb-4">{authMode === "signup" ? "Create an account to automatically link TIN and billing credentials." : "Sign in to activate saved contract parameters."}</p>
            
            <form onSubmit={handleClientAuth} className="space-y-3">
              {authMode === "signup" && (
                <div><input type="text" required placeholder="Full Representative Name" value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} className={`w-full px-3 py-2.5 text-xs rounded-xl outline-none ${isDarkMode ? 'bg-black border border-white/10 text-white focus:border-emerald-500' : 'bg-gray-50 border border-gray-200 focus:border-emerald-500'}`} /></div>
              )}
              <div><input type="tel" required placeholder="Phone Number (Username)" value={authForm.phone} onChange={e => setAuthForm({...authForm, phone: e.target.value})} className={`w-full px-3 py-2.5 text-xs rounded-xl outline-none ${isDarkMode ? 'bg-black border border-white/10 text-white focus:border-emerald-500' : 'bg-gray-50 border border-gray-200 focus:border-emerald-500'}`} /></div>
              <div><input type="password" required placeholder="Secure Passcode" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} className={`w-full px-3 py-2.5 text-xs rounded-xl outline-none ${isDarkMode ? 'bg-black border border-white/10 text-white focus:border-emerald-500' : 'bg-gray-50 border border-gray-200 focus:border-emerald-500'}`} /></div>
              
              {authMode === "signup" && (
                <>
                  <div className="border-t border-gray-500/10 my-2 pt-2"></div>
                  <div><input type="text" placeholder="Corporate Title (Optional)" value={authForm.companyName} onChange={e => setAuthForm({...authForm, companyName: e.target.value})} className={`w-full px-3 py-2.5 text-xs rounded-xl outline-none ${isDarkMode ? 'bg-black border border-white/10' : 'bg-gray-50 border border-gray-200'}`} /></div>
                  <div><input type="text" maxLength={10} placeholder="TIN Number (Optional - 10 Digits)" value={authForm.tinNumber} onChange={e => setAuthForm({...authForm, tinNumber: e.target.value})} className={`w-full px-3 py-2.5 text-xs rounded-xl outline-none font-mono ${isDarkMode ? 'bg-black border border-white/10' : 'bg-gray-50 border border-gray-200'}`} /></div>
                </>
              )}

              <button type="submit" className="w-full py-3 bg-emerald-500 text-black text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 mt-2">
                {authMode === "signup" ? "Build Profile" : "Authenticate Signature"}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-gray-500/10 text-center">
              <button onClick={() => setAuthMode(authMode === "signup" ? "login" : "signup")} className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 hover:underline">
                {authMode === "signup" ? "Already have a matrix signature? Log In" : "Need to establish corporate registration? Sign Up"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDashboardOpen && currentUser && (
        <div className="fixed inset-0 z-[100] flex justify-end animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsDashboardOpen(false)} />
          <div className={`relative h-full w-full md:w-[480px] shadow-2xl flex flex-col ${isDarkMode ? 'bg-[#050505] border-l border-white/10 text-white' : 'bg-gray-50 border-l border-gray-200 text-gray-900'} animate-in slide-in-from-right-full`}>
            
            <div className={`p-5 md:p-6 border-b flex justify-between items-start ${isDarkMode ? 'border-white/10 bg-black/40' : 'border-gray-200 bg-white'}`}>
              <div>
                <h2 className="text-lg md:text-xl font-black tracking-tight flex items-center gap-2"><ShieldCheck className="text-emerald-500"/> Corporate Dashboard</h2>
                <p className="text-[10px] md:text-xs opacity-60 mt-1 uppercase tracking-widest">Logged in as {currentUser.name}</p>
              </div>
              <button onClick={() => setIsDashboardOpen(false)} className="p-2 rounded-full opacity-50 hover:opacity-100 transition-colors"><X size={18}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
              
              <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-[#111111] border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h3 className="text-[10px] font-black uppercase tracking-widest opacity-50 border-b pb-2 mb-3">Identity Matrix</h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div><p className="opacity-50 mb-0.5">Phone</p><p className="font-bold">{currentUser.phone}</p></div>
                  {currentUser.companyName && <div><p className="opacity-50 mb-0.5">Company</p><p className="font-bold truncate">{currentUser.companyName}</p></div>}
                  {currentUser.tinNumber && <div><p className="opacity-50 mb-0.5">TIN</p><p className="font-mono font-bold tracking-widest text-emerald-500">{currentUser.tinNumber}</p></div>}
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-3 ml-1">Pipeline History ({clientOrders.length})</h3>
                {clientOrders.length === 0 ? (
                  <div className={`flex flex-col items-center justify-center p-8 rounded-xl border border-dashed opacity-50 ${isDarkMode ? 'border-white/20' : 'border-gray-300'}`}>
                    <Activity size={32} className="mb-2 opacity-40"/>
                    <p className="text-xs font-bold">No active pipelines found.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {clientOrders.map(order => (
                      <div key={order.id} className={`p-3.5 rounded-xl border ${isDarkMode ? 'bg-[#111111] border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-[10px] font-mono opacity-60 mb-0.5">{order.id}</p>
                            <p className="text-[10px] font-bold flex items-center gap-1"><Clock size={10}/> {formatDate(order.createdAt)}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${getStatusColor(order.status || 'pending')}`}>
                            {(order.status || "pending").replace("_", " ")}
                          </span>
                        </div>
                        <div className={`mt-2 pt-2 border-t flex justify-between items-center ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
                          <p className="text-[10px] opacity-60">{order.items?.length || 0} Assets Deployed</p>
                          <p className="text-sm font-black text-emerald-500">{(order.totalAmount || 0).toLocaleString()} ETB</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={`p-5 md:p-6 border-t ${isDarkMode ? 'border-white/10 bg-black/60' : 'border-gray-200 bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.05)]'}`}>
               <button onClick={handleClientLogout} className="w-full py-3.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 font-black uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2">
                 Log Out Session
               </button>
            </div>

          </div>
        </div>
      )}

      {quickAddProduct && (
        <div className="fixed inset-0 z-[90] flex items-end md:items-center justify-center animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setQuickAddProduct(null)} />
          <div className={`relative w-full md:w-[390px] border rounded-t-2xl md:rounded-2xl shadow-2xl p-5 ${isDarkMode ? 'bg-[#111111] border-white/10' : 'bg-white border-gray-200 text-gray-900'}`}>
            <button onClick={() => setQuickAddProduct(null)} className="absolute top-4 right-4 p-1.5 rounded-full opacity-40 hover:opacity-100"><X size={15}/></button>
            
            <div className="flex gap-3 mb-4 border-b border-gray-500/10 pb-3">
               <div className="w-16 h-16 rounded-xl bg-black/30 border border-white/5 overflow-hidden flex-shrink-0">
                 {quickAddProduct.imageUrl && <img src={quickAddProduct.imageUrl} className="w-full h-full object-cover" alt="img"/>}
               </div>
               <div className="flex-1 min-w-0 pr-4">
                 <h3 className="font-bold text-sm leading-tight mb-1 truncate">{quickAddProduct.title}</h3>
                 <p className="text-emerald-500 font-black text-base">{(parseFloat(quickAddProduct.price)||0).toLocaleString()} <span className="text-[9px] opacity-50 font-medium">ETB / {quickAddProduct.metric}</span></p>
               </div>
            </div>

            <div className="space-y-3.5">
              {quickAddProduct.allowCustomSize && (
                <div className={`rounded-xl p-2.5 flex items-center justify-between border ${isDarkMode ? 'bg-yellow-500/5 border-yellow-500/20 text-yellow-400' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700'}`}>
                  <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"><Scissors size={12}/> {quickAddProduct.customSizeLabel || "Length (m)"}</span>
                  <input type="number" min="0.1" step="0.1" value={qaLength} onChange={(e) => setQaLength(e.target.value === "" ? "" : parseFloat(e.target.value))} className={`w-20 border rounded-lg py-1 text-xs text-center outline-none font-bold ${isDarkMode ? 'bg-black border-white/10' : 'bg-white border-gray-300'}`} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                {quickAddProduct.color && (
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider opacity-50 mb-1 block">Color</label>
                    <select value={qaColor} onChange={(e) => setQaColor(e.target.value)} className={`w-full border text-xs rounded-lg px-2 py-2 outline-none ${isDarkMode ? 'bg-black border-white/10' : 'bg-white border-gray-200'}`}>
                      {quickAddProduct.color.split(',').map((c:string) => c.trim()).filter(Boolean).map((c:string) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                )}
                {quickAddProduct.size && (
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-wider opacity-50 block mb-1">Size</label>
                    <select value={qaSize} onChange={(e) => setQaSize(e.target.value)} className={`w-full border text-xs rounded-lg px-2 py-2 outline-none ${isDarkMode ? 'bg-black border-white/10' : 'bg-white border-gray-200'}`}>
                      {quickAddProduct.size.split(',').map((s:string) => s.trim()).filter(Boolean).map((s:string) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-wider opacity-50 block mb-1">Quantity</label>
                <div className={`flex items-center border rounded-xl p-0.5 ${isDarkMode ? 'bg-black border-white/10' : 'bg-white border-gray-200'}`}>
                   <button onClick={() => setQaQty(prev => Math.max(1, (typeof prev==='number'?prev:1) - 1))} className={`w-8 h-8 flex items-center justify-center font-bold text-sm rounded-lg ${isDarkMode ? 'bg-white/5 text-white/50' : 'bg-gray-100 text-gray-600'}`}>-</button>
                   <input type="number" value={qaQty} onChange={(e) => setQaQty(e.target.value === "" ? "" : parseInt(e.target.value))} onBlur={() => {if(qaQty==="" || (typeof qaQty==='number'&&qaQty<1) || isNaN(Number(qaQty))) setQaQty(1)}} className="flex-1 bg-transparent text-center font-black text-sm outline-none" />
                   <button onClick={() => setQaQty(prev => (typeof prev==='number'?prev:1) + 1)} className={`w-8 h-8 flex items-center justify-center font-bold text-sm rounded-lg ${isDarkMode ? 'bg-white/5 text-white/50' : 'bg-gray-100 text-gray-600'}`}>+</button>
                </div>
              </div>
              
              <button onClick={executeQuickAdd} className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest text-xs shadow-lg transition-transform active:scale-95">Add to Pipeline</button>
            </div>
          </div>
        </div>
      )}

      <div className={`fixed inset-0 z-[80] transition-all duration-500 ${isCartOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div onClick={() => {setIsCartOpen(false); setCheckoutStep(1);}} className={`absolute inset-0 bg-black/80 transition-opacity duration-300 ${isCartOpen ? 'opacity-100' : 'opacity-0'}`} />
        <div className={`absolute top-0 right-0 h-full w-full md:w-[480px] shadow-2xl transform transition-transform duration-300 flex flex-col ${isCartOpen ? 'translate-x-0' : 'translate-x-full'} ${isDarkMode ? 'bg-[#050505] border-l border-white/10' : 'bg-white border-l border-gray-200 text-gray-900'}`}>
          <div className="p-4 border-b flex justify-between items-center bg-black/5">
            <h2 className="text-sm md:text-base font-black uppercase tracking-widest flex items-center gap-2">{checkoutStep === 1 ? <><ShoppingCart size={15}/> {t("Logistics Pipeline", "የዕቃ ቅርጫት")}</> : <><FileText size={15}/> Settlement Directives</>}</h2>
            <button onClick={() => {setIsCartOpen(false); setCheckoutStep(1);}} className="p-1.5 rounded-full opacity-50 hover:opacity-100"><X size={16} /></button>
          </div>
          
          {checkoutStep === 1 ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
                <div className="space-y-3 h-full flex flex-col">
                  {cartItems.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-30 space-y-3"><ShoppingCart size={40} /><p className="font-bold text-xs">{t("Pipeline unallocated.", "ቅርጫቱ ባዶ ነው።")}</p></div>
                  ) : (
                    <div className="flex-1 space-y-2.5">
                      {cartItems.map(item => {
                        const lengthMult = item.allowCustomSize && item.customLength ? parseFloat(item.customLength) : 1;
                        return (
                          <div key={item.cartItemId} className={`flex gap-3 items-center border p-2.5 rounded-xl ${isDarkMode ? 'bg-[#111111] border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="w-12 h-12 rounded-lg bg-black/20 overflow-hidden flex-shrink-0">
                              {item.imageUrl ? <img src={item.imageUrl} alt="img" className="w-full h-full object-cover" /> : <ImageIcon className="w-full h-full p-2.5 opacity-20" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-xs truncate mb-0.5">{item.title}</h4>
                              <p className="text-[10px] opacity-60">{(parseFloat(item.price) * lengthMult).toLocaleString()} ETB</p>
                              <div className="flex gap-1 flex-wrap mt-1">
                                {item.customLength && <span className="text-[8px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-1 py-0.5 rounded flex items-center gap-0.5"><Scissors size={8}/> {item.customLength}m</span>}
                                {item.selectedSize && <span className="text-[8px] bg-white/10 px-1 py-0.5 rounded opacity-70">Sz: {item.selectedSize}</span>}
                                {item.selectedColor && <span className="text-[8px] bg-white/10 px-1 py-0.5 rounded opacity-70">Col: {item.selectedColor}</span>}
                              </div>
                              <div className={`flex items-center border rounded-lg p-0.5 mt-1.5 w-[65px] ${isDarkMode ? 'bg-black border-white/10' : 'bg-white border-gray-300'}`}>
                                <input type="number" value={item.quantity} onChange={(e) => updateCartQuantity(item.cartItemId, e.target.value)} onBlur={(e) => handleCartQuantityBlur(item.cartItemId, e.target.value)} className="w-full bg-transparent text-[10px] font-bold text-center outline-none" />
                              </div>
                            </div>
                            <div className="flex flex-col items-end justify-between h-full py-0.5">
                              <button onClick={() => removeFromCart(item.cartItemId)} className="text-red-400 hover:text-red-500 mb-2 p-1 opacity-60"><Trash2 size={13} /></button>
                              <span className="font-black text-emerald-500 text-xs">{((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1) * lengthMult).toLocaleString()}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div className={`p-4 border-t shadow-lg ${isDarkMode ? 'bg-black/80 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex justify-between items-end mb-4"><span className="opacity-50 text-[10px] font-bold uppercase tracking-widest">Aggregate total</span><span className="text-lg md:text-xl font-black text-emerald-500">{cartTotal.toLocaleString()} ETB</span></div>
                <button disabled={cartItems.length === 0} onClick={() => setCheckoutStep(2)} className="w-full py-3.5 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-40">Proceed to Logistics <ArrowRight size={14} /></button>
              </div>
            </div>
          ) : (
            <form id="checkout-form" onSubmit={handleCheckout} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 scrollbar-hide space-y-5">
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase tracking-wider opacity-50 border-b pb-1">Representative Identity</h3>
                  <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={14} /><input type="text" required placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={`w-full pl-9 pr-4 py-2.5 text-xs rounded-xl outline-none border ${isDarkMode ? 'bg-[#111111] border-white/10' : 'bg-gray-50 border-gray-200'}`} /></div>
                  <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={14} /><input type="tel" required placeholder="Active Phone (09...)" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className={`w-full pl-9 pr-4 py-2.5 text-xs rounded-xl outline-none border ${isDarkMode ? 'bg-[#111111] border-white/10' : 'bg-gray-50 border-gray-200'}`} /></div>
                  
                  <div className={`p-3 rounded-xl border space-y-3 ${isDarkMode ? 'bg-black/30 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input type="checkbox" checked={formData.requireVat} onChange={e => setFormData({...formData, requireVat: e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-indigo-600" />
                      <span className="text-xs font-bold">Request Corporate VAT Ledger (+15%)</span>
                    </label>
                    {formData.requireVat && (
                      <div className="space-y-2.5 pt-1 animate-in fade-in">
                        <div className="relative"><Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={14} /><input type="text" required placeholder="Registered Corporate Identity" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className={`w-full pl-9 pr-4 py-2.5 text-xs rounded-lg outline-none border ${isDarkMode ? 'bg-[#111111] border-white/10' : 'bg-white border-gray-200'}`} /></div>
                        <div className="relative"><FileText className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={14} /><input type="text" required placeholder="10-Digit TIN Registration" value={formData.tinNumber} onChange={e => setFormData({...formData, tinNumber: e.target.value})} className={`w-full pl-9 pr-4 py-2.5 text-xs rounded-lg outline-none border font-mono tracking-widest ${isDarkMode ? 'bg-[#111111] border-white/10' : 'bg-white border-gray-200'}`} /></div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase tracking-wider opacity-50 border-b pb-1">Fulfillment Allocation</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setDeliveryType("Delivery")} className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-bold text-xs ${deliveryType === "Delivery" ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : (isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50')}`}><Truck size={14} /> Site Freight</button>
                    <button type="button" onClick={() => setDeliveryType("Warehouse Pickup")} className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-bold text-xs ${deliveryType === "Warehouse Pickup" ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : (isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50')}`}><Building2 size={14} /> Depot Pickup</button>
                  </div>
                </div>

                {deliveryType === "Delivery" && (
                  <div className="space-y-3 animate-in fade-in">
                    <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={14} />
                      <select required value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} className={`w-full pl-9 pr-4 py-2.5 text-xs rounded-xl outline-none border appearance-none ${isDarkMode ? 'bg-[#111111] border-white/10 text-white' : 'bg-gray-50 border-gray-200'}`}><option value="" disabled>Select Region</option>{ethiopianRegions.map(r => <option key={r} value={r}>{r}</option>)}</select>
                    </div>
                    {formData.region === "Addis Ababa" && (
                      <div className="relative"><LocateFixed className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={14} />
                        <select required value={formData.subCity} onChange={e => setFormData({...formData, subCity: e.target.value})} className={`w-full pl-9 pr-4 py-2.5 text-xs rounded-xl outline-none border appearance-none ${isDarkMode ? 'bg-[#111111] border-white/10 text-white' : 'bg-gray-50 border-gray-200'}`}><option value="" disabled>Select Sub-City</option>{addisSubcities.map(sc => <option key={sc} value={sc}>{sc}</option>)}</select>
                      </div>
                    )}
                    <textarea required placeholder="Specific site orientation coordinates or delivery landmarks..." rows={2.5} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className={`w-full p-3 text-xs rounded-xl outline-none border resize-none ${isDarkMode ? 'bg-[#111111] border-white/10' : 'bg-gray-50 border-gray-200'}`}></textarea>
                  </div>
                )}
              </div>

              <div className={`p-4 border-t shadow-lg bg-black/90 ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                {formData.requireVat && (
                  <div className="flex justify-between items-center text-xs opacity-70 mb-2 border-b border-white/5 pb-1.5"><span>Subtotal</span><span>{cartSubtotal.toLocaleString()} ETB</span></div>
                )}
                <div className="flex justify-between items-end mb-4"><span className="opacity-50 text-[10px] font-bold uppercase tracking-widest">Aggregate total</span><span className="text-base md:text-xl font-black text-emerald-400">{cartTotal.toLocaleString()} ETB</span></div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setCheckoutStep(1)} className={`px-4 py-3 rounded-xl border text-xs font-bold ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'}`}>Back</button>
                  <button type="submit" disabled={isCheckingOut} className="flex-1 py-3 bg-emerald-500 text-black font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2">
                    {isCheckingOut ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                    {isCheckingOut ? "Syncing Directive..." : "Submit Order Pipeline"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className={`fixed bottom-4 md:bottom-6 right-4 md:right-6 z-[70] w-[calc(100vw-2rem)] md:w-96 bg-[#0A0A0F] border border-indigo-500/30 rounded-3xl shadow-2xl flex flex-col transition-all duration-300 origin-bottom-right ${isAiOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`} style={{ height: '460px', maxHeight: '75vh' }}>
        <div className="p-3 border-b border-indigo-500/30 flex justify-between items-center bg-indigo-900/20 rounded-t-3xl">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg"><Activity size={14} /></div>
            <div><h3 className="font-black text-xs text-indigo-100">AmanZone AI</h3></div>
          </div>
          <button onClick={() => setIsAiOpen(false)} className="p-1.5 text-indigo-300 hover:text-white"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3.5 scrollbar-hide bg-black/40">
          {aiHistory.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-2.5 rounded-xl text-xs ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white/10 text-gray-200 border border-white/5 rounded-bl-sm'}`}>{msg.text}</div>
            </div>
          ))}
          {isAiTyping && (
            <div className="flex justify-start"><div className="bg-white/10 p-2.5 rounded-xl rounded-bl-sm border border-white/5 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span><span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span></div></div>
          )}
          <div ref={chatEndRef} />
        </div>
        <form onSubmit={handleAiSubmit} className="p-2 border-t border-white/10 bg-[#0A0A0F] rounded-b-3xl flex gap-1.5">
          <input type="text" placeholder="Query warehouse allocation matrix..." value={aiMessage} onChange={(e) => setAiMessage(e.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 outline-none focus:border-indigo-500 text-xs" />
          <button disabled={isAiTyping} type="submit" className="p-2.5 rounded-lg bg-indigo-600 text-white disabled:opacity-50"><Send size={15} /></button>
        </form>
      </div>

      <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2">
        {systemSettings.aiEnabled && <button onClick={() => setIsAiOpen(true)} className="p-3 rounded-full bg-indigo-600 text-white shadow-xl hover:scale-105 transition-transform"><MessageSquare size={18} /></button>}
      </div>

    </div>
  );
}
