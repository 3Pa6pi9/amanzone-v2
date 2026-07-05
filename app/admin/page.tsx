"use client";

import React, { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, updateDoc, doc, query, orderBy, setDoc, getDoc } from "firebase/firestore";
import { 
  Package, Plus, Edit2, Trash2, X, Search, Activity, 
  Box, Settings, Save, Loader2, CheckCircle2, Image as ImageIcon, AlertTriangle,
  TrendingUp, Truck, MapPin, Phone, User, FileText, ChevronRight, UploadCloud, Building2, ChevronDown, Menu, Mail, Lock
} from "lucide-react";

// --- PREDEFINED MATRIX & INITIAL STATES ---
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

const initialFormState = {
  title: "", price: "", description: "", menu: "የግንባታ ብረት", submenu: "የሀገር ውስጥ", type: "Standard", 
  metric: "", size: "", color: "", imageUrl: "", stock: "", warehouse: ""
};

const initialSettingsState = {
  companyName: "AmanZone Trading PLC", slogan: "Industrial Grade. Delivered.", logoUrl: "",
  phone: "", email: "", address: "Addis Ababa, Ethiopia", taxRate: 15, deliveryBaseFee: 250, aiEnabled: false,
  adminPassword: "AmanZone2026"
};

export default function AdminCommandCenter() {
  // --- AUTHENTICATION STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authInput, setAuthInput] = useState("");
  const [authError, setAuthError] = useState("");

  // Check if admin is already logged in on this browser
  useEffect(() => {
    const session = localStorage.getItem("az_admin_session");
    if (session === "active") setIsAuthenticated(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setAuthError("");

    try {
      // Securely fetch the master password from Firebase
      const settingsSnap = await getDoc(doc(db, "settings", "global"));
      let currentPassword = "AmanZone2026"; // Fallback

      if (settingsSnap.exists() && settingsSnap.data().adminPassword) {
        currentPassword = settingsSnap.data().adminPassword;
      }

      if (authInput === currentPassword) {
        localStorage.setItem("az_admin_session", "active");
        setIsAuthenticated(true);
      } else {
        setAuthError("Invalid Security Clearance");
        setAuthInput("");
      }
    } catch (error) {
      setAuthError("Network error checking clearance.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("az_admin_session");
    setIsAuthenticated(false);
  };

  // --- STANDARD DASHBOARD STATES ---
  const [activeTab, setActiveTab] = useState("inventory");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialFormState);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Dynamic Toggles
  const [isNewMenu, setIsNewMenu] = useState(false);
  const [isNewSubmenu, setIsNewSubmenu] = useState(false);
  const [isNewType, setIsNewType] = useState(false);
  const [isNewMetric, setIsNewMetric] = useState(false);
  const [isNewWarehouse, setIsNewWarehouse] = useState(false);

  // Orders & Settings
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isOrderDrawerOpen, setIsOrderDrawerOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [dispatchInfo, setDispatchInfo] = useState({ driverName: "", driverPhone: "", vehiclePlate: "" });
  const [systemSettings, setSystemSettings] = useState<any>(initialSettingsState);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: "", type: "success" });

  // Only sync database if authenticated to save read costs
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubInv = onSnapshot(query(collection(db, "inventory"), orderBy("createdAt", "desc")), (snapshot) => { 
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); setLoading(false); 
    });
    const unsubOrders = onSnapshot(query(collection(db, "orders"), orderBy("createdAt", "desc")), (snapshot) => { 
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); 
    });
    const unsubSettings = onSnapshot(doc(db, "settings", "global"), (docSnap) => {
      if (docSnap.exists()) setSystemSettings({ ...initialSettingsState, ...docSnap.data() });
    });

    return () => { unsubInv(); unsubOrders(); unsubSettings(); };
  }, [isAuthenticated]);

  // --- SECURITY LOCK SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4 selection:bg-emerald-500/30">
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
           <Lock size={400} />
        </div>
        <div className="w-full max-w-md bg-[#0A0A0F] border border-white/10 p-8 rounded-[2rem] shadow-2xl relative z-10 animate-in fade-in zoom-in duration-500">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Lock size={28} />
            </div>
          </div>
          <h1 className="text-2xl font-black text-center mb-2 tracking-tight">Vault Access</h1>
          <p className="text-center text-sm opacity-50 mb-8">Enter your security clearance to access the Command Center.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input 
                type="password" 
                placeholder="Passcode..." 
                value={authInput}
                onChange={(e) => { setAuthInput(e.target.value); setAuthError(""); }}
                className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-xl outline-none focus:border-emerald-500 text-center tracking-[0.3em] font-mono transition-colors"
                autoFocus
              />
            </div>
            {authError && <p className="text-red-400 text-xs text-center font-bold">{authError}</p>}
            <button type="submit" disabled={isAuthenticating} className="w-full py-4 bg-emerald-500 text-black font-black uppercase tracking-widest text-sm rounded-xl hover:bg-emerald-400 transition-all active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50 flex justify-center items-center gap-2">
              {isAuthenticating ? <Loader2 className="animate-spin" size={18} /> : "Decrypt & Enter"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- STANDARD DASHBOARD FUNCTIONS ---
  const showToast = (msg: string, type = "success") => { setToast({ show: true, msg, type }); setTimeout(() => setToast({ show: false, msg: "", type: "success" }), 4000); };

  const uniqueMenus = useMemo(() => Array.from(new Set([...Object.keys(PREDEFINED_MATRIX), ...products.map(p => p.menu).filter(Boolean)])), [products]);
  const uniqueSubmenus = useMemo(() => {
    const predefined = PREDEFINED_MATRIX[formData.menu] || [];
    const fromDb = products.filter(p => p.menu === formData.menu).map(p => p.submenu).filter(Boolean);
    return Array.from(new Set([...predefined, ...fromDb]));
  }, [products, formData.menu]);
  const uniqueTypes = useMemo(() => Array.from(new Set(products.filter(p => p.submenu === formData.submenu).map(p => p.type).filter(Boolean))), [products, formData.submenu]);
  const uniqueMetrics = useMemo(() => Array.from(new Set(products.map(p => p.metric).filter(Boolean))), [products]);
  const uniqueWarehouses = useMemo(() => Array.from(new Set(products.map(p => p.warehouse).filter(Boolean))), [products]);

  const openAddMenu = () => {
    setFormData(initialFormState); setEditingId(null);
    setIsNewMenu(false); setIsNewSubmenu(false); setIsNewType(true);
    setIsNewMetric(uniqueMetrics.length === 0); setIsNewWarehouse(uniqueWarehouses.length === 0);
    setIsDrawerOpen(true);
  };

  const openEditMenu = (product: any) => {
    setFormData({
      title: product.title || "", price: product.price || "", description: product.description || "",
      menu: product.menu || "", submenu: product.submenu || "", type: product.type || "Standard",
      metric: product.metric || "", size: product.size || "", color: product.color || "",
      imageUrl: product.imageUrl || "", stock: product.stock?.toString() || "", warehouse: product.warehouse || ""
    });
    setEditingId(product.id);
    setIsNewMenu(false); setIsNewSubmenu(false); setIsNewType(false); setIsNewMetric(false); setIsNewWarehouse(false);
    setIsDrawerOpen(true);
  };

  const uploadToCloudinary = async (file: File) => {
    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: uploadData });
    const data = await res.json();
    return data.secure_url;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; setIsUploadingImage(true);
    try { setFormData(prev => ({ ...prev, imageUrl: await uploadToCloudinary(file) })); showToast("Asset uploaded."); } 
    catch { showToast("Upload failed.", "error"); } finally { setIsUploadingImage(false); }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; setIsUploadingLogo(true);
    try { setSystemSettings((prev: any) => ({ ...prev, logoUrl: await uploadToCloudinary(file) })); showToast("Logo uploaded."); } 
    catch { showToast("Logo upload failed.", "error"); } finally { setIsUploadingLogo(false); }
  };

  const handleSaveInventory = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSaving(true);
    try {
      const payload: any = { 
        title: formData.title || "Untitled", price: formData.price?.toString() || "0", description: formData.description || "",
        menu: formData.menu || "Uncategorized", submenu: formData.submenu || "General", type: formData.type || "Standard",
        metric: formData.metric || "Unit", size: formData.size || "", color: formData.color || "", imageUrl: formData.imageUrl || "",
        stock: parseInt(formData.stock as string) || 0, warehouse: formData.warehouse || "Main Hub", updatedAt: new Date().toISOString() 
      };
      Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);
      if (editingId) { await updateDoc(doc(db, "inventory", editingId), payload); showToast("Material updated."); } 
      else { await addDoc(collection(db, "inventory"), { ...payload, createdAt: new Date().toISOString() }); showToast("Material deployed."); }
      setIsDrawerOpen(false);
    } catch (error: any) { showToast(`Error: ${error.message}`, "error"); } finally { setIsSaving(false); }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try { await setDoc(doc(db, "settings", "global"), systemSettings, { merge: true }); showToast("Configurations synced."); } 
    catch (error: any) { showToast(`Error: ${error.message}`, "error"); } finally { setIsSavingSettings(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Purge this material?")) return; setIsDeleting(id);
    try { await fetch(`/api/inventory/${id}`, { method: "DELETE" }); showToast("Material purged."); } 
    catch { showToast("Failed to purge.", "error"); } finally { setIsDeleting(null); }
  };

  const filteredProducts = useMemo(() => products.filter(p => (p.title || "").toLowerCase().includes(searchQuery.toLowerCase()) || (p.menu || "").toLowerCase().includes(searchQuery.toLowerCase())), [products, searchQuery]);

  const openOrderMenu = (order: any) => { setSelectedOrder(order); setDispatchInfo(order.dispatchInfo || { driverName: "", driverPhone: "", vehiclePlate: "" }); setIsOrderDrawerOpen(true); };

  const updateOrderStatus = async (id: string, newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const updateData: any = { status: newStatus }; if (newStatus === 'dispatched') updateData.dispatchInfo = dispatchInfo;
      await updateDoc(doc(db, "orders", id), updateData);
      setSelectedOrder((prev: any) => ({ ...prev, status: newStatus, dispatchInfo: newStatus === 'dispatched' ? dispatchInfo : prev.dispatchInfo }));
      showToast("Status updated");
    } finally { setIsUpdatingStatus(false); }
  };

  const getStatusColor = (status: string) => {
    switch (status) { case 'pending_payment': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'; case 'processing': return 'text-blue-400 bg-blue-400/10 border-blue-400/20'; case 'dispatched': return 'text-purple-400 bg-purple-400/10 border-purple-400/20'; case 'delivered': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'; default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20'; }
  };

  const totalRevenue = useMemo(() => orders.reduce((sum, order) => sum + (Number(order.finalAmount) || 0), 0), [orders]);
  const activeOrdersCount = useMemo(() => orders.filter(o => o.status !== 'delivered').length, [orders]);
  const vatCollected = useMemo(() => orders.reduce((sum, order) => sum + ((Number(order.finalAmount) || 0) - (Number(order.subtotal) || 0)), 0), [orders]);

  return (
    <div className="flex min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30">
      
      <div className={`fixed top-4 md:top-6 left-1/2 -translate-x-1/2 z-[100] px-4 md:px-6 py-2 md:py-3 rounded-full font-bold text-xs md:text-sm shadow-2xl flex items-center gap-2 transition-all duration-300 ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'} ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-white text-black'}`}>
        {toast.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 className="text-emerald-500" size={16} />}
        {toast.msg}
      </div>

      <div className="lg:hidden fixed top-0 w-full z-40 bg-[#0A0A0F] border-b border-white/10 p-4 flex justify-between items-center">
        <div className="flex items-center gap-2 font-black text-white text-lg">
          <div className="w-8 h-8 rounded flex items-center justify-center bg-emerald-500 text-black text-xs">AZ</div> ADMIN
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10">
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <aside className={`fixed lg:left-0 h-full w-64 border-r border-white/10 bg-[#0A0A0F] z-30 transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col ${isMobileMenuOpen ? 'translate-x-0 pt-20' : '-translate-x-full'}`}>
        <div className="hidden lg:block p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-black bg-emerald-400 overflow-hidden">
              {systemSettings.logoUrl ? <img src={systemSettings.logoUrl} className="w-full h-full object-cover" /> : "AZ"}
            </div>
            <div><h1 className="font-black tracking-tight text-lg leading-tight">Command<br/>Center</h1></div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => { setActiveTab("inventory"); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm ${activeTab === "inventory" ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}><Box size={18} /> Inventory Control</button>
          <button onClick={() => { setActiveTab("orders"); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm ${activeTab === "orders" ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}><Activity size={18} /> Logistics & Orders {activeOrdersCount > 0 && <span className="ml-auto flex items-center justify-center w-5 h-5 bg-emerald-500 text-black text-[10px] rounded-full">{activeOrdersCount}</span>}</button>
          <button onClick={() => { setActiveTab("settings"); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm ${activeTab === "settings" ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}><Settings size={18} /> Advanced Settings</button>
        </nav>
        
        {/* LOGOUT BUTTON */}
        <div className="p-4 border-t border-white/10">
          <button onClick={handleLogout} className="w-full py-3 text-xs font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">Lock Vault</button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-64 p-4 lg:p-8 pt-24 lg:pt-8 w-full max-w-[100vw]">
        
        {activeTab === "inventory" && (
          <div className="animate-in fade-in duration-300">
            <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-6 md:mb-8">
              <div><h2 className="text-2xl md:text-3xl font-black tracking-tight mb-1 md:mb-2">Inventory Matrix</h2><p className="text-xs md:text-sm opacity-50 font-medium">Manage stock levels, locations, and storefront materials.</p></div>
              <button onClick={openAddMenu} className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"><Plus size={16} /> Deploy Material</button>
            </header>

            <div className="flex gap-4 mb-6 md:mb-8">
              <div className="relative flex-1 max-w-md"><Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" size={16} /><input type="text" placeholder="Search by name, category..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-[#111111] border border-white/10 rounded-xl outline-none focus:border-emerald-500 transition-colors text-sm" /></div>
            </div>

            <div className="bg-[#0A0A0F] border border-white/10 rounded-[1.5rem] overflow-hidden shadow-2xl">
              <div className="hidden lg:grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-[10px] font-bold uppercase tracking-widest opacity-50 bg-black/50">
                <div className="col-span-1 text-center">Asset</div><div className="col-span-3">Material Identity</div><div className="col-span-2">Location & Stock</div><div className="col-span-3">Logistics Matrix</div><div className="col-span-2">Pricing (ETB)</div><div className="col-span-1 text-right">Actions</div>
              </div>
              <div className="divide-y divide-white/5">
                {loading ? ( <div className="p-10 flex justify-center opacity-50"><Loader2 className="animate-spin" size={32} /></div> ) : filteredProducts.length === 0 ? ( <div className="p-10 flex flex-col items-center justify-center opacity-30"><Package size={48} className="mb-4" /><p className="text-sm font-bold">No materials found.</p></div> ) : (
                  filteredProducts.map((product) => (
                    <div key={product.id} className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 p-4 items-center hover:bg-white/5 transition-colors">
                      <div className="col-span-1 lg:col-span-4 flex items-start lg:items-center gap-3">
                        <div className="w-12 h-12 md:w-10 md:h-10 rounded-lg bg-black border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">{product.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon size={16} className="opacity-30" />}</div>
                        <div className="flex-1"><p className="font-bold text-sm line-clamp-2 leading-tight">{product.title || "Unnamed"}</p><div className="flex flex-wrap items-center gap-1.5 mt-1 lg:hidden"><span className="text-[9px] font-bold uppercase text-emerald-400">{product.warehouse || "Central"}</span><span className="text-[9px] font-bold px-1.5 py-0.5 bg-white/10 rounded">QTY: {product.stock || 0}</span><span className="text-[9px] font-bold px-1.5 py-0.5 bg-white/10 rounded">{product.price} ETB</span></div></div>
                      </div>
                      <div className="hidden lg:block lg:col-span-2"><div className="flex items-center gap-1.5 mb-1"><MapPin size={12} className="text-emerald-400" /><span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 truncate">{product.warehouse || "Central Hub"}</span></div><p className="text-xs font-black bg-white/10 inline-block px-2 py-0.5 rounded border border-white/5">QTY: {product.stock || 0}</p></div>
                      <div className="hidden lg:block lg:col-span-3"><div className="flex gap-1.5 mb-1"><span className="px-2 py-0.5 bg-white/10 rounded text-[9px] font-bold uppercase tracking-wider">{product.menu || "N/A"}</span></div><p className="text-[10px] opacity-50 truncate">{product.submenu} • {product.metric}</p></div>
                      <div className="hidden lg:block lg:col-span-2"><p className="font-black text-emerald-400">{(parseFloat(product.price) || 0).toLocaleString()}</p><p className="text-[10px] opacity-50 uppercase tracking-widest mt-0.5">Per {product.metric || "Unit"}</p></div>
                      <div className="col-span-1 lg:col-span-1 flex lg:justify-end gap-2 mt-2 lg:mt-0"><button onClick={() => openEditMenu(product)} className="flex-1 lg:flex-none flex justify-center items-center p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-blue-400"><Edit2 size={16} /></button><button disabled={isDeleting === product.id} onClick={() => handleDelete(product.id)} className="flex-1 lg:flex-none flex justify-center items-center p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors text-red-400 disabled:opacity-50">{isDeleting === product.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}</button></div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="animate-in fade-in duration-300">
            <header className="mb-6 md:mb-8"><h2 className="text-2xl md:text-3xl font-black tracking-tight mb-1">Executive Overview</h2></header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
              <div className="p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-br from-emerald-900/40 to-black border border-emerald-500/20 shadow-xl relative overflow-hidden"><TrendingUp className="absolute right-6 top-6 opacity-20 text-emerald-400" size={48} /><h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-70 mb-1 md:mb-2">Total Revenue</h3><p className="text-3xl md:text-4xl font-black text-emerald-400">{totalRevenue.toLocaleString()} <span className="text-sm md:text-lg opacity-50">ETB</span></p></div>
              <div className="p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] bg-[#111111] border border-white/10 shadow-xl"><h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-70 mb-1 md:mb-2">Active Routes</h3><p className="text-3xl md:text-4xl font-black">{activeOrdersCount}</p></div>
              <div className="p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] bg-[#111111] border border-white/10 shadow-xl"><h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-70 mb-1 md:mb-2">VAT Liability</h3><p className="text-3xl md:text-4xl font-black text-gray-300">{vatCollected.toLocaleString()} <span className="text-sm md:text-lg opacity-50">ETB</span></p></div>
            </div>
            <div className="bg-[#0A0A0F] border border-white/10 rounded-[1.5rem] overflow-hidden shadow-2xl">
              <div className="divide-y divide-white/5">
                {orders.length === 0 ? ( <div className="p-10 flex flex-col items-center justify-center opacity-30"><Activity size={48} className="mb-4" /></div> ) : (
                  orders.map((order) => (
                    <div key={order.id} className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 p-4 items-center hover:bg-white/5 transition-colors cursor-pointer" onClick={() => openOrderMenu(order)}>
                      <div className="col-span-1 lg:col-span-4 flex justify-between lg:block items-start"><div><p className="font-bold text-sm truncate">{order.customerName}</p><p className="text-[10px] text-emerald-400 font-mono mt-0.5">{order.id}</p></div><div className="lg:hidden font-black text-sm">{(Number(order.finalAmount) || 0).toLocaleString()} ETB</div></div>
                      <div className="col-span-1 lg:col-span-4"><p className="text-xs font-bold mb-1 flex items-center gap-1.5 opacity-80">{order.deliveryType === "Delivery" ? <><Truck size={12}/> Site Delivery</> : <><Building2 size={12}/> Self Pickup</>}</p>{order.deliveryType === "Delivery" && <p className="text-[10px] opacity-50 truncate">{order.logistics.region} • {order.logistics.subCity}</p>}</div>
                      <div className="col-span-1 lg:col-span-4 flex items-center justify-between lg:justify-end gap-3 mt-2 lg:mt-0"><div className="hidden lg:block font-black text-sm mr-4">{(Number(order.finalAmount) || 0).toLocaleString()} ETB</div><span className={`px-2.5 py-1 text-[9px] md:text-[10px] font-bold uppercase tracking-wider border rounded-full ${getStatusColor(order.status)}`}>{order.status.replace("_", " ")}</span><ChevronRight size={16} className="opacity-50" /></div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="animate-in fade-in duration-300 pb-20">
            <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-6 md:mb-8">
              <div><h2 className="text-2xl md:text-3xl font-black tracking-tight mb-1">Global Configuration</h2><p className="text-xs md:text-sm opacity-50 font-medium">Control storefront identity, financials, and AI layer.</p></div>
              <button onClick={handleSaveSettings} disabled={isSavingSettings} className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50">{isSavingSettings ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Sync to Storefront</button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div className="bg-[#0A0A0F] border border-white/10 rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 shadow-2xl">
                <h3 className="font-black text-base md:text-lg mb-4 md:mb-6 flex items-center gap-3 border-b border-white/10 pb-4"><Box className="text-emerald-400" size={20}/> Brand Identity</h3>
                <div className="space-y-4 md:space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                    <div onClick={() => document.getElementById('logoUpload')?.click()} className="w-16 h-16 rounded-xl bg-black border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center group cursor-pointer hover:border-emerald-500 transition-colors relative">
                      {systemSettings.logoUrl ? <img src={systemSettings.logoUrl} className="w-full h-full object-cover" /> : <UploadCloud size={20} className="opacity-30 group-hover:text-emerald-400" />}
                      {isUploadingLogo && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-400" size={20} /></div>}
                    </div>
                    <div className="flex-1"><p className="text-sm font-bold">Corporate Logo</p><p className="text-[10px] uppercase tracking-widest opacity-50 mt-1">PNG, JPG (Max 2MB)</p><input type="file" id="logoUpload" className="hidden" accept="image/*" onChange={handleLogoUpload} /></div>
                  </div>
                  <div><label className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-70 block mb-2">Company Name</label><input type="text" value={systemSettings.companyName} onChange={e => setSystemSettings({...systemSettings, companyName: e.target.value})} className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-xl outline-none focus:border-emerald-500 text-sm font-bold" /></div>
                  <div><label className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-70 block mb-2">Storefront Slogan</label><input type="text" value={systemSettings.slogan} onChange={e => setSystemSettings({...systemSettings, slogan: e.target.value})} className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-xl outline-none focus:border-emerald-500 text-sm" /></div>
                </div>
              </div>

              <div className="bg-[#0A0A0F] border border-white/10 rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 shadow-2xl">
                <h3 className="font-black text-base md:text-lg mb-4 md:mb-6 flex items-center gap-3 border-b border-white/10 pb-4"><Phone className="text-emerald-400" size={20}/> Contact Matrix</h3>
                <div className="space-y-4 md:space-y-6">
                  <div className="relative"><Phone className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" size={16} /><input type="text" placeholder="e.g. +251 911..." value={systemSettings.phone} onChange={e => setSystemSettings({...systemSettings, phone: e.target.value})} className="w-full pl-12 pr-4 py-3 bg-[#111111] border border-white/10 rounded-xl outline-none focus:border-emerald-500 text-sm font-mono" /></div>
                  <div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" size={16} /><input type="email" placeholder="e.g. sales@amanzone.com" value={systemSettings.email} onChange={e => setSystemSettings({...systemSettings, email: e.target.value})} className="w-full pl-12 pr-4 py-3 bg-[#111111] border border-white/10 rounded-xl outline-none focus:border-emerald-500 text-sm" /></div>
                  <div className="relative"><MapPin className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" size={16} /><input type="text" placeholder="e.g. Bole, Addis Ababa" value={systemSettings.address} onChange={e => setSystemSettings({...systemSettings, address: e.target.value})} className="w-full pl-12 pr-4 py-3 bg-[#111111] border border-white/10 rounded-xl outline-none focus:border-emerald-500 text-sm" /></div>
                </div>
              </div>

              <div className="bg-[#0A0A0F] border border-white/10 rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 shadow-2xl">
                <h3 className="font-black text-base md:text-lg mb-4 md:mb-6 flex items-center gap-3 border-b border-white/10 pb-4"><FileText className="text-emerald-400" size={20}/> Financial Constants</h3>
                <div className="space-y-4 md:space-y-6">
                  <div><label className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-70 block mb-2">Corporate VAT Rate (%)</label><input type="number" value={systemSettings.taxRate} onChange={e => setSystemSettings({...systemSettings, taxRate: parseFloat(e.target.value) || 0})} className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-xl outline-none focus:border-emerald-500 font-mono text-sm" /></div>
                  <div><label className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-70 block mb-2">Base Delivery Fee (ETB)</label><input type="number" value={systemSettings.deliveryBaseFee} onChange={e => setSystemSettings({...systemSettings, deliveryBaseFee: parseFloat(e.target.value) || 0})} className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-xl outline-none focus:border-emerald-500 font-mono text-sm" /></div>
                </div>
              </div>

              <div className="bg-[#0A0A0F] border border-white/10 rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 shadow-2xl">
                <h3 className="font-black text-base md:text-lg mb-4 md:mb-6 flex items-center gap-3 border-b border-white/10 pb-4"><Lock className="text-emerald-400" size={20}/> Security</h3>
                <div className="space-y-4 md:space-y-6">
                  <div>
                    <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-70 block mb-2">Master Passcode</label>
                    <input type="text" value={systemSettings.adminPassword} onChange={e => setSystemSettings({...systemSettings, adminPassword: e.target.value})} className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-xl outline-none focus:border-emerald-500 font-mono text-sm" />
                    <p className="text-[9px] md:text-[10px] opacity-50 mt-2">Required to bypass the Admin vault lock screen.</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-900/20 to-[#0A0A0F] border border-indigo-500/20 rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 shadow-2xl relative overflow-hidden md:col-span-2">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none" />
                <h3 className="font-black text-base md:text-lg mb-4 md:mb-6 flex items-center gap-3 border-b border-indigo-500/20 pb-4"><Activity className="text-indigo-400" size={20}/> AI Layer</h3>
                <div className="space-y-4 md:space-y-6 max-w-2xl">
                  <p className="text-xs md:text-sm opacity-70 leading-relaxed">Establish the neural link between the Storefront Client AI and the Admin Assistant AI.</p>
                  <div className="flex items-center justify-between p-4 bg-black/50 border border-white/5 rounded-xl">
                    <div><p className="font-bold text-sm">AI Agent Network</p><p className="text-[9px] md:text-[10px] uppercase tracking-widest opacity-50 mt-1">Status: {systemSettings.aiEnabled ? 'Online' : 'Offline'}</p></div>
                    <button onClick={() => setSystemSettings({...systemSettings, aiEnabled: !systemSettings.aiEnabled})} className={`w-12 h-6 rounded-full transition-colors relative ${systemSettings.aiEnabled ? 'bg-indigo-500' : 'bg-white/10'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${systemSettings.aiEnabled ? 'left-7' : 'left-1'}`} /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================= */}
      {/* DRAWER: INVENTORY FORM */}
      {/* ========================================= */}
      <div className={`fixed inset-0 z-50 transition-all duration-300 ${isDrawerOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div onClick={() => setIsDrawerOpen(false)} className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0'}`} />
        
        <div className={`absolute top-0 right-0 h-full w-full md:w-[600px] bg-[#0A0A0F] border-l border-white/10 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-4 md:p-6 border-b border-white/10 flex justify-between items-center bg-black/40">
            <h2 className="text-lg md:text-xl font-black tracking-wider flex items-center gap-2 md:gap-3">
              {editingId ? <Edit2 className="text-emerald-400" size={20} /> : <Plus className="text-emerald-400" size={20} />} 
              {editingId ? "Reconfigure Material" : "Deploy Material"}
            </h2>
            <button onClick={() => setIsDrawerOpen(false)} className="p-2 rounded-full hover:bg-white/10 transition-colors opacity-50 hover:opacity-100"><X size={20} /></button>
          </div>
          
          <form id="material-form" onSubmit={handleSaveInventory} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 md:space-y-6">
              
              <div className="space-y-2">
                <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-70 flex justify-between"><span>Showcase Asset (Optional)</span></label>
                <div className="flex gap-3 md:gap-4 items-center">
                  <div onClick={() => document.getElementById('imageUpload')?.click()} className="relative w-14 h-14 md:w-16 md:h-16 rounded-xl bg-black border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center group cursor-pointer hover:border-emerald-500 transition-colors">
                    {formData.imageUrl ? <img src={formData.imageUrl} className="w-full h-full object-cover" /> : <UploadCloud size={20} className="opacity-30 group-hover:text-emerald-400 group-hover:opacity-100" />}
                    {isUploadingImage && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-400" size={20} /></div>}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input type="file" id="imageUpload" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    <input type="url" placeholder="Paste image link or click upload..." value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-xl outline-none focus:border-emerald-500 text-base md:text-sm" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-70">Material Title</label>
                  <input required type="text" placeholder="e.g. ቆርቆሮ (Roofing Iron)" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-xl outline-none focus:border-emerald-500 text-base md:text-sm font-bold" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-70">Pricing (ETB)</label>
                  <input required type="number" min="0" step="0.01" placeholder="0.00" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-xl outline-none focus:border-emerald-500 text-base md:text-sm font-mono" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Metric Unit</label>
                    {uniqueMetrics.length > 0 && <button type="button" onClick={() => setIsNewMetric(!isNewMetric)} className="text-[9px] text-emerald-400 font-bold uppercase">{isNewMetric ? "Select Existing" : "+ Add New"}</button>}
                  </div>
                  {isNewMetric || uniqueMetrics.length === 0 ? (
                    <input required type="text" placeholder="e.g. Kg, Bags" value={formData.metric} onChange={e => setFormData({...formData, metric: e.target.value})} className="w-full px-3 py-3 bg-[#111111] border border-white/10 rounded-lg outline-none focus:border-emerald-500 text-base md:text-sm" />
                  ) : (
                    <div className="relative">
                      <select required value={formData.metric} onChange={e => setFormData({...formData, metric: e.target.value})} className="w-full px-3 py-3 bg-[#111111] border border-white/10 rounded-lg outline-none focus:border-emerald-500 text-base md:text-sm appearance-none">
                        <option value="" disabled>Select Metric</option>
                        {uniqueMetrics.map(m => <option key={m as string} value={m as string}>{m as string}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" />
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-900/10 space-y-4">
                <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-emerald-400 border-b border-emerald-500/20 pb-2">Location & Stock</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Current Quantity</label>
                    <input required type="number" min="0" placeholder="0" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg outline-none focus:border-emerald-500 text-base md:text-sm font-mono text-emerald-400" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Assigned Facility</label>
                      {uniqueWarehouses.length > 0 && <button type="button" onClick={() => setIsNewWarehouse(!isNewWarehouse)} className="text-[9px] text-emerald-400 font-bold uppercase">{isNewWarehouse ? "Select Existing" : "+ Add New"}</button>}
                    </div>
                    {isNewWarehouse || uniqueWarehouses.length === 0 ? (
                      <input required type="text" placeholder="e.g. Kality Main Hub" value={formData.warehouse} onChange={e => setFormData({...formData, warehouse: e.target.value})} className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg outline-none focus:border-emerald-500 text-base md:text-sm" />
                    ) : (
                      <div className="relative">
                        <select required value={formData.warehouse} onChange={e => setFormData({...formData, warehouse: e.target.value})} className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg outline-none focus:border-emerald-500 text-base md:text-sm appearance-none">
                          <option value="" disabled>Select Store Location</option>
                          {uniqueWarehouses.map(w => <option key={w as string} value={w as string}>{w as string}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-white/10 bg-black/30 space-y-4">
                <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-50 border-b border-white/10 pb-2">Storefront Matrix</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Primary Menu</label>
                      {uniqueMenus.length > 0 && <button type="button" onClick={() => setIsNewMenu(!isNewMenu)} className="text-[9px] text-emerald-400 font-bold uppercase">{isNewMenu ? "Select Existing" : "+ Add New"}</button>}
                    </div>
                    {isNewMenu || uniqueMenus.length === 0 ? (
                      <input required type="text" placeholder="e.g. የግንባታ ብረት" value={formData.menu} onChange={e => setFormData({...formData, menu: e.target.value})} className="w-full px-3 py-2 bg-[#111111] border border-white/10 rounded-lg outline-none focus:border-emerald-500 text-base md:text-sm" />
                    ) : (
                      <div className="relative">
                        <select required value={formData.menu} onChange={e => {setFormData({...formData, menu: e.target.value, submenu: "", type: "Standard"}); setIsNewSubmenu(false); setIsNewType(false);}} className="w-full px-3 py-2 bg-[#111111] border border-white/10 rounded-lg outline-none focus:border-emerald-500 text-base md:text-sm appearance-none truncate">
                          <option value="" disabled>Select Menu</option>
                          {uniqueMenus.map(m => <option key={m as string} value={m as string}>{m as string}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Submenu</label>
                      {uniqueSubmenus.length > 0 && <button type="button" onClick={() => setIsNewSubmenu(!isNewSubmenu)} className="text-[9px] text-emerald-400 font-bold uppercase">{isNewSubmenu ? "Select Existing" : "+ Add New"}</button>}
                    </div>
                    {isNewSubmenu || uniqueSubmenus.length === 0 ? (
                      <input required type="text" placeholder="e.g. የሀገር ውስጥ" value={formData.submenu} onChange={e => setFormData({...formData, submenu: e.target.value})} className="w-full px-3 py-2 bg-[#111111] border border-white/10 rounded-lg outline-none focus:border-emerald-500 text-base md:text-sm" />
                    ) : (
                      <div className="relative">
                        <select required value={formData.submenu} onChange={e => {setFormData({...formData, submenu: e.target.value, type: "Standard"}); setIsNewType(false);}} className="w-full px-3 py-2 bg-[#111111] border border-white/10 rounded-lg outline-none focus:border-emerald-500 text-base md:text-sm appearance-none truncate">
                          <option value="" disabled>Select Submenu</option>
                          {uniqueSubmenus.map(m => <option key={m as string} value={m as string}>{m as string}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" />
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Material Type</label>
                      <button type="button" onClick={() => setIsNewType(!isNewType)} className="text-[9px] text-emerald-400 font-bold uppercase">{isNewType ? "Select Existing" : "+ Add New"}</button>
                    </div>
                    {isNewType ? (
                      <input required type="text" placeholder="e.g. የቱርክ ብረት" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 bg-[#111111] border border-white/10 rounded-lg outline-none focus:border-emerald-500 text-base md:text-sm" />
                    ) : (
                      <div className="relative">
                        <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 bg-[#111111] border border-white/10 rounded-lg outline-none focus:border-emerald-500 text-base md:text-sm appearance-none">
                          <option value="Standard">Standard</option>
                          {uniqueTypes.filter(t => t !== "Standard").map(t => <option key={t as string} value={t as string}>{t as string}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-70">Technical Description</label>
                <textarea required rows={4} placeholder="Detailed specifications..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-4 bg-[#111111] border border-white/10 rounded-xl outline-none focus:border-emerald-500 text-base md:text-sm resize-none"></textarea>
              </div>

            </div>

            <div className="p-4 md:p-6 bg-black border-t border-white/10 flex gap-2 md:gap-3 sticky bottom-0 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
              <button type="button" onClick={() => setIsDrawerOpen(false)} className="px-4 md:px-6 py-3 md:py-4 rounded-xl border border-white/10 bg-white/5 font-bold hover:bg-white/10 transition-colors text-sm">Cancel</button>
              <button type="submit" disabled={isSaving || isUploadingImage} className="flex-1 py-3 md:py-4 rounded-xl text-black bg-emerald-500 hover:bg-emerald-400 font-black text-xs md:text-sm uppercase tracking-widest transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-xl">
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {isSaving ? "Syncing..." : (editingId ? "Update Parameters" : "Deploy to Live")}
              </button>
            </div>
          </form>

        </div>
      </div>

      {/* ========================================= */}
      {/* DRAWER: ORDER DETAILS */}
      {/* ========================================= */}
      <div className={`fixed inset-0 z-50 transition-all duration-300 ${isOrderDrawerOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div onClick={() => setIsOrderDrawerOpen(false)} className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOrderDrawerOpen ? 'opacity-100' : 'opacity-0'}`} />
        <div className={`absolute top-0 right-0 h-full w-full md:w-[600px] bg-[#0A0A0F] border-l border-white/10 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${isOrderDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          
          <div className="p-4 md:p-6 border-b border-white/10 flex justify-between items-start bg-black/40">
            <div>
              <h2 className="text-lg md:text-xl font-black tracking-wider flex items-center gap-2 mb-1">
                Logistics Directive
              </h2>
              <p className="text-xs md:text-sm font-mono text-emerald-400 opacity-80">{selectedOrder?.id}</p>
            </div>
            <button onClick={() => setIsOrderDrawerOpen(false)} className="p-2 rounded-full hover:bg-white/10 transition-colors opacity-50 hover:opacity-100"><X size={20} /></button>
          </div>

          {selectedOrder && (
            <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide space-y-6 md:space-y-8">
              
              <div>
                <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-50 border-b border-white/10 pb-2 mb-3 md:mb-4">Pipeline Status Control</h3>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  {['pending_payment', 'processing', 'dispatched', 'delivered'].map((statusOption) => (
                    <button 
                      key={statusOption}
                      disabled={isUpdatingStatus || selectedOrder.status === statusOption}
                      onClick={() => updateOrderStatus(selectedOrder.id, statusOption)}
                      className={`px-2 py-3 rounded-xl border text-[9px] md:text-[10px] font-bold uppercase tracking-wider transition-all
                        ${selectedOrder.status === statusOption 
                          ? getStatusColor(statusOption) + ' ring-1 ring-current' 
                          : 'border-white/10 hover:border-white/30 text-gray-400'
                        } disabled:opacity-50`}
                    >
                      {statusOption.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              {selectedOrder.status === 'dispatched' && (
                <div className="p-4 md:p-5 rounded-[1rem] md:rounded-[1.5rem] bg-indigo-900/10 border border-indigo-500/20 space-y-4 animate-in fade-in slide-in-from-top-4">
                  <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2"><Truck size={14}/> Dispatch Driver Intel</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <input type="text" placeholder="Driver Name" value={dispatchInfo.driverName} onChange={e => setDispatchInfo({...dispatchInfo, driverName: e.target.value})} className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg outline-none focus:border-indigo-500 text-sm md:text-sm text-base" />
                    <input type="text" placeholder="Driver Phone" value={dispatchInfo.driverPhone} onChange={e => setDispatchInfo({...dispatchInfo, driverPhone: e.target.value})} className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg outline-none focus:border-indigo-500 text-sm md:text-sm text-base" />
                    <input type="text" placeholder="Vehicle Plate No." value={dispatchInfo.vehiclePlate} onChange={e => setDispatchInfo({...dispatchInfo, vehiclePlate: e.target.value})} className="md:col-span-2 w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg outline-none focus:border-indigo-500 text-sm md:text-sm text-base font-mono" />
                  </div>
                  <button onClick={() => updateOrderStatus(selectedOrder.id, 'dispatched')} className="w-full py-3 bg-indigo-500/20 text-indigo-400 font-bold text-[10px] md:text-xs uppercase tracking-widest rounded-lg hover:bg-indigo-500/30 transition-colors">
                    Save Dispatch Intel
                  </button>
                </div>
              )}

              <div className="space-y-3 md:space-y-4">
                <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-50 border-b border-white/10 pb-2">Client Intel</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <User size={16} className="opacity-50 mb-2" />
                    <p className="font-bold text-sm">{selectedOrder.customerName}</p>
                    <p className="text-xs opacity-50 mt-1 flex items-center gap-1"><Phone size={10}/> {selectedOrder.phone}</p>
                  </div>
                  {selectedOrder.companyName && (
                    <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                      <FileText size={16} className="opacity-50 mb-2" />
                      <p className="font-bold text-sm truncate">{selectedOrder.companyName}</p>
                      <p className="text-xs opacity-50 mt-1 font-mono">TIN: {selectedOrder.tinNumber}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 md:space-y-4">
                <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-50 border-b border-white/10 pb-2">Deployment Strategy</h3>
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    {selectedOrder.deliveryType === "Delivery" ? <Truck className="text-blue-400" size={18} /> : <Building2 className="text-indigo-400" size={18} />}
                    <span className="font-bold text-sm">{selectedOrder.deliveryType}</span>
                  </div>
                  {selectedOrder.deliveryType === "Delivery" && selectedOrder.logistics && (
                    <div className="pl-4 md:pl-6 border-l border-white/10 text-xs md:text-sm">
                      <p className="font-bold">{selectedOrder.logistics.region}</p>
                      <p className="opacity-70 mb-2">{selectedOrder.logistics.subCity}</p>
                      <p className="opacity-50 text-[10px] md:text-xs">{selectedOrder.logistics.specificAddress}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 md:space-y-4">
                <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-50 border-b border-white/10 pb-2">Materials Manifest</h3>
                <div className="space-y-2 md:space-y-3">
                  {selectedOrder.items?.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-black border border-white/5 rounded-xl">
                      <div>
                        <p className="font-bold text-xs md:text-sm line-clamp-1">{item.title}</p>
                        <p className="text-[10px] md:text-xs opacity-50">{item.quantity} {item.metric || 'Units'} @ {(Number(item.price)||0).toLocaleString()} ETB</p>
                      </div>
                      <p className="font-black text-emerald-400 text-sm">
                        {((Number(item.price)||0) * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
                
                <div className="pt-4 border-t border-white/10 text-xs md:text-sm space-y-2">
                  <div className="flex justify-between opacity-70">
                    <span>Base Value</span>
                    <span>{(Number(selectedOrder.subtotal) || 0).toLocaleString()} ETB</span>
                  </div>
                  {(Number(selectedOrder.finalAmount) > Number(selectedOrder.subtotal)) && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Corporate VAT (15%)</span>
                      <span>+ {((Number(selectedOrder.finalAmount)||0) - (Number(selectedOrder.subtotal)||0)).toLocaleString()} ETB</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg md:text-xl font-black pt-2">
                    <span>Total Yield</span>
                    <span>{(Number(selectedOrder.finalAmount) || 0).toLocaleString()} ETB</span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

    </div>
  );
}
