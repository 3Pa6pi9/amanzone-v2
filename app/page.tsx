"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, getDoc, addDoc } from "firebase/firestore";
import { useTheme, useLanguage } from "@/lib/Providers";
import { 
  ArrowRight, ShoppingCart, PackageSearch, X, Loader2, Trash2, 
  Image as ImageIcon, Search, CheckCircle2, ChevronDown, ChevronRight, 
  MapPin, Phone, User, Truck, Building2, LocateFixed, Activity, Briefcase, FileText, Menu, Mail,
  MessageSquare, Send, Scissors, Plus, Sun, Moon, LogIn, UserPlus, ShieldCheck
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
  const [shuffledProducts, setShuffledProducts] = useState<any[]>([]);
  const [marketingAssets, setMarketingAssets] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<any>(initialSettingsState);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState({ menu: "All", submenu: "All", type: "All" });
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2>(1);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [deliveryType, setDeliveryType] = useState<"Warehouse Pickup" | "Delivery">("Delivery");
  const [formData, setFormData] = useState({ name: "", phone: "", region: "Addis Ababa", subCity: "", address: "", companyName: "", tinNumber: "", requireVat: false });
  const [quickAddProduct, setQuickAddProduct] = useState<any>(null);
  const [qaQty, setQaQty] = useState<number | string>(1);
  const [qaLength, setQaLength] = useState<number | string>(1);
  const [qaColor, setQaColor] = useState("");
  const [qaSize, setQaSize] = useState("");
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
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authForm, setAuthForm] = useState({ name: "", phone: "", password: "", companyName: "", tinNumber: "" });

  const ethiopianRegions = ["Addis Ababa", "Oromia", "Amhara", "Tigray", "Sidama", "SNNPR", "Somali", "Afar", "Benishangul-Gumuz", "Gambela", "Harari", "Dire Dawa"];
  const addisSubcities = ["Bole", "Yeka", "Nifas Silk-Lafto", "Kirkos", "Kolfe Keranio", "Lideta", "Gulele", "Addis Ketema", "Akaky Kaliti", "Arada", "Lemi Kura"];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
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
    });
    const unsubMarketing = onSnapshot(query(collection(db, "marketing"), orderBy("createdAt", "desc")), (snapshot) => { setMarketingAssets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); });
    const unsubSettings = onSnapshot(doc(db, "settings", "global"), (docSnap) => { if (docSnap.exists()) setSystemSettings({ ...initialSettingsState, ...docSnap.data() }); });
    return () => { unsubscribe(); unsubMarketing(); unsubSettings(); };
  }, []);

  const catalogTree = useMemo(() => {
    const tree: any = {};
    Object.keys(PREDEFINED_MATRIX).forEach(menu => { tree[menu] = {}; PREDEFINED_MATRIX[menu].forEach(submenu => { tree[menu][submenu] = new Set(); }); });
    products.forEach(p => {
      const m = p.menu || "Uncategorized"; const sm = p.submenu || "General";
      if (!tree[m]) tree[m] = {}; if (!tree[m][sm]) tree[m][sm] = new Set();
    });
    return tree;
  }, [products]);

  // FIX: This is the line that was missing
  const uniqueMenus = useMemo(() => Array.from(new Set([...Object.keys(PREDEFINED_MATRIX), ...products.map(p => p.menu).filter(Boolean)])), [products]);

  // ... [Keep the rest of your functions (openQuickAdd, executeQuickAdd, handleAddToCart, handleCheckout, etc.) exactly as they were in the previous code block] ...

  // To complete the file, just ensure the return JSX matches your previous code block.
  // ... (JSX block) ...
  return (
    <div className={`relative min-h-screen font-sans scroll-smooth overflow-x-hidden ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-[#F4F6F9] text-gray-900'}`}>
        {/* ... (The rest of your JSX) ... */}
    </div>
  );
}