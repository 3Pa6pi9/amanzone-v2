"use client";

import React, { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, updateDoc, doc, query, orderBy, setDoc } from "firebase/firestore";
import { 
  Package, Plus, Edit2, Trash2, X, Search, Activity, 
  Box, Settings, Save, Loader2, CheckCircle2, Image as ImageIcon, AlertTriangle,
  TrendingUp, Truck, MapPin, Phone, User, FileText, ChevronRight, UploadCloud, Building2, ChevronDown, Check
} from "lucide-react";

// Updated template including STOCK and WAREHOUSE
const initialFormState = {
  title: "",
  price: "",
  description: "",
  menu: "",
  submenu: "",
  type: "Standard",
  metric: "",
  size: "",
  color: "",
  imageUrl: "",
  stock: "",
  warehouse: ""
};

export default function AdminCommandCenter() {
  const [activeTab, setActiveTab] = useState("inventory");
  
  // --- INVENTORY STATE ---
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialFormState);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // --- DYNAMIC TOGGLE STATES ---
  const [isNewMenu, setIsNewMenu] = useState(false);
  const [isNewSubmenu, setIsNewSubmenu] = useState(false);
  const [isNewType, setIsNewType] = useState(false);
  const [isNewMetric, setIsNewMetric] = useState(false);
  const [isNewSize, setIsNewSize] = useState(false);
  const [isNewColor, setIsNewColor] = useState(false);
  const [isNewWarehouse, setIsNewWarehouse] = useState(false);

  // --- ORDERS STATE ---
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isOrderDrawerOpen, setIsOrderDrawerOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [dispatchInfo, setDispatchInfo] = useState({ driverName: "", driverPhone: "", vehiclePlate: "" });
  
  // --- SETTINGS STATE ---
  const [systemSettings, setSystemSettings] = useState<any>({ taxRate: 15, deliveryBaseFee: 250, aiEnabled: false });

  const [toast, setToast] = useState({ show: false, msg: "", type: "success" });

  useEffect(() => {
    // Inventory
    const qInv = query(collection(db, "inventory"), orderBy("createdAt", "desc"));
    const unsubInv = onSnapshot(qInv, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    // Orders
    const qOrders = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubInv(); unsubOrders(); };
  }, []);

  const showToast = (msg: string, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "success" }), 3000);
  };

  // --- DYNAMIC EXTRACTIONS ---
  const uniqueMenus = useMemo(() => Array.from(new Set(products.map(p => p.menu).filter(Boolean))), [products]);
  const uniqueSubmenus = useMemo(() => Array.from(new Set(products.filter(p => p.menu === formData.menu).map(p => p.submenu).filter(Boolean))), [products, formData.menu]);
  const uniqueTypes = useMemo(() => Array.from(new Set(products.filter(p => p.submenu === formData.submenu).map(p => p.type).filter(Boolean))), [products, formData.submenu]);
  const uniqueMetrics = useMemo(() => Array.from(new Set(products.map(p => p.metric).filter(Boolean))), [products]);
  const uniqueSizes = useMemo(() => Array.from(new Set(products.map(p => p.size).filter(Boolean))), [products]);
  const uniqueColors = useMemo(() => Array.from(new Set(products.map(p => p.color).filter(Boolean))), [products]);
  const uniqueWarehouses = useMemo(() => Array.from(new Set(products.map(p => p.warehouse).filter(Boolean))), [products]);

  // --- INVENTORY LOGIC ---
  const openAddMenu = () => {
    setFormData(initialFormState);
    setEditingId(null);
    setIsNewMenu(uniqueMenus.length === 0);
    setIsNewSubmenu(true);
    setIsNewType(true);
    setIsNewMetric(uniqueMetrics.length === 0);
    setIsNewSize(uniqueSizes.length === 0);
    setIsNewColor(uniqueColors.length === 0);
    setIsNewWarehouse(uniqueWarehouses.length === 0);
    setIsDrawerOpen(true);
  };

  const openEditMenu = (product: any) => {
    setFormData({
      title: product.title || "",
      price: product.price || "",
      description: product.description || "",
      menu: product.menu || "",
      submenu: product.submenu || "",
      type: product.type || "Standard",
      metric: product.metric || "",
      size: product.size || "",
      color: product.color || "",
      imageUrl: product.imageUrl || "",
      stock: product.stock || "",
      warehouse: product.warehouse || ""
    });
    setEditingId(product.id);
    setIsNewMenu(false); setIsNewSubmenu(false); setIsNewType(false);
    setIsNewMetric(false); setIsNewSize(false); setIsNewColor(false); setIsNewWarehouse(false);
    setIsDrawerOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      if (!uploadPreset || !cloudName) throw new Error("Cloudinary env missing.");
      uploadData.append("upload_preset", uploadPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: uploadData });
      if (!res.ok) throw new Error("Cloudinary rejection");

      const data = await res.json();
      setFormData(prev => ({ ...prev, imageUrl: data.secure_url }));
      showToast("Asset uploaded successfully.");
    } catch (error) {
      showToast("Cloudinary upload failed.", "error");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = { 
        ...formData, 
        price: formData.price.toString(), 
        stock: Number(formData.stock),
        updatedAt: new Date().toISOString() 
      };

      if (editingId) {
        await updateDoc(doc(db, "inventory", editingId), payload);
        showToast("Material updated.");
      } else {
        await addDoc(collection(db, "inventory"), { ...payload, createdAt: new Date().toISOString() });
        showToast("New material deployed.");
      }
      setIsDrawerOpen(false);
    } catch (error) {
      showToast("System error during save.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Purge this material?")) return;
    setIsDeleting(id);
    try {
      await fetch(`/api/inventory/${id}`, { method: "DELETE" });
      showToast("Material purged.");
    } catch {
      showToast("Failed to purge.", "error");
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => (p.title || "").toLowerCase().includes(searchQuery.toLowerCase()) || (p.menu || "").toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);


  // --- ORDERS & DISPATCH LOGIC ---
  const openOrderMenu = (order: any) => {
    setSelectedOrder(order);
    setDispatchInfo(order.dispatchInfo || { driverName: "", driverPhone: "", vehiclePlate: "" });
    setIsOrderDrawerOpen(true);
  };

  const updateOrderStatus = async (id: string, newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'dispatched') {
        updateData.dispatchInfo = dispatchInfo;
      }

      await updateDoc(doc(db, "orders", id), updateData);
      showToast(`Status updated to ${newStatus.replace("_", " ").toUpperCase()}`);
      setSelectedOrder((prev: any) => ({ ...prev, status: newStatus, dispatchInfo: newStatus === 'dispatched' ? dispatchInfo : prev.dispatchInfo }));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_payment': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'processing': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'dispatched': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'delivered': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const totalRevenue = useMemo(() => orders.reduce((sum, order) => sum + (Number(order.finalAmount) || 0), 0), [orders]);
  const activeOrdersCount = useMemo(() => orders.filter(o => o.status !== 'delivered').length, [orders]);
  const vatCollected = useMemo(() => orders.reduce((sum, order) => sum + ((Number(order.finalAmount) || 0) - (Number(order.subtotal) || 0)), 0), [orders]);

  return (
    <div className="flex min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30">
      
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full font-bold text-sm shadow-2xl flex items-center gap-3 transition-all duration-300 ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'} ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-white text-black'}`}>
        {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 className="text-emerald-500" size={18} />}
        {toast.msg}
      </div>

      <aside className="w-64 border-r border-white/10 bg-[#0A0A0F] flex flex-col fixed h-full z-40">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-black bg-emerald-400">AZ</div>
            <div><h1 className="font-black tracking-tight text-lg leading-tight">Command<br/>Center</h1></div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab("inventory")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === "inventory" ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
            <Box size={18} /> Inventory Control
          </button>
          
          <button onClick={() => setActiveTab("orders")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === "orders" ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
            <Activity size={18} /> Logistics & Orders
            {activeOrdersCount > 0 && <span className="ml-auto flex items-center justify-center w-5 h-5 bg-emerald-500 text-black text-[10px] rounded-full">{activeOrdersCount}</span>}
          </button>

          <button onClick={() => setActiveTab("settings")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === "settings" ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
            <Settings size={18} /> Advanced Settings
          </button>
        </nav>
      </aside>

      <main className="flex-1 ml-64 p-8">
        
        {/* ========================================= */}
        {/* TAB: INVENTORY CONTROL (WITH STOCK & WAREHOUSE) */}
        {/* ========================================= */}
        {activeTab === "inventory" && (
          <div className="animate-in fade-in duration-300">
            <header className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-3xl font-black tracking-tight mb-2">Inventory Matrix</h2>
                <p className="text-sm opacity-50 font-medium">Manage stock levels, locations, and storefront materials.</p>
              </div>
              <button onClick={openAddMenu} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <Plus size={18} /> Deploy Material
              </button>
            </header>

            <div className="flex gap-4 mb-8">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" size={18} />
                <input 
                  type="text" placeholder="Search by name, category, or ID..." 
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[#111111] border border-white/10 rounded-xl outline-none focus:border-emerald-500 transition-colors text-sm"
                />
              </div>
            </div>

            <div className="bg-[#0A0A0F] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-[10px] font-bold uppercase tracking-widest opacity-50 bg-black/50">
                <div className="col-span-1 text-center">Asset</div>
                <div className="col-span-3">Material Identity</div>
                <div className="col-span-2">Location & Stock</div>
                <div className="col-span-3">Logistics Matrix</div>
                <div className="col-span-2">Pricing (ETB)</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>

              <div className="divide-y divide-white/5">
                {loading ? (
                  <div className="p-20 flex flex-col items-center justify-center opacity-50"><Loader2 className="animate-spin mb-4" size={32} /></div>
                ) : filteredProducts.length === 0 ? (
                  <div className="p-20 flex flex-col items-center justify-center opacity-30"><Package size={48} className="mb-4" /></div>
                ) : (
                  filteredProducts.map((product) => (
                    <div key={product.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors">
                      <div className="col-span-1 flex justify-center">
                        <div className="w-10 h-10 rounded-lg bg-black border border-white/10 overflow-hidden flex items-center justify-center">
                          {product.imageUrl ? <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" /> : <ImageIcon size={16} className="opacity-30" />}
                        </div>
                      </div>
                      <div className="col-span-3">
                        <p className="font-bold text-sm line-clamp-1">{product.title || "Unnamed"}</p>
                        <p className="text-xs opacity-50 font-mono mt-0.5">{product.id.slice(0, 8)}...</p>
                      </div>
                      
                      {/* NEW: LOCATION & STOCK DISPLAY */}
                      <div className="col-span-2">
                        <div className="flex items-center gap-1.5 mb-1">
                          <MapPin size={12} className="text-emerald-400" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 truncate">{product.warehouse || "Central Hub"}</span>
                        </div>
                        <p className="text-xs font-black bg-white/10 inline-block px-2 py-0.5 rounded border border-white/5">QTY: {product.stock || 0}</p>
                      </div>

                      <div className="col-span-3">
                        <div className="flex gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-white/10 rounded text-[9px] font-bold uppercase tracking-wider">{product.menu || "N/A"}</span>
                        </div>
                        <p className="text-[10px] opacity-50 truncate">{product.submenu} • {product.metric} {product.size ? `• ${product.size}` : ''}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="font-black text-emerald-400">{(parseFloat(product.price) || 0).toLocaleString()}</p>
                        <p className="text-[10px] opacity-50 uppercase tracking-widest mt-0.5">Per {product.metric || "Unit"}</p>
                      </div>
                      <div className="col-span-1 flex items-center justify-end gap-2">
                        <button onClick={() => openEditMenu(product)} className="p-2 rounded-lg hover:bg-white/10 transition-colors text-blue-400 hover:text-blue-300"><Edit2 size={16} /></button>
                        <button disabled={isDeleting === product.id} onClick={() => handleDelete(product.id)} className="p-2 rounded-lg hover:bg-red-500/20 transition-colors text-red-400 hover:text-red-300 disabled:opacity-50">
                          {isDeleting === product.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================= */}
        {/* TAB: LOGISTICS & ORDERS */}
        {/* ========================================= */}
        {activeTab === "orders" && (
          <div className="animate-in fade-in duration-300">
            <header className="mb-8">
              <h2 className="text-3xl font-black tracking-tight mb-2">Executive Overview</h2>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="p-6 rounded-[2rem] bg-gradient-to-br from-emerald-900/40 to-black border border-emerald-500/20 shadow-xl relative overflow-hidden">
                <TrendingUp className="absolute right-6 top-6 opacity-20 text-emerald-400" size={48} />
                <h3 className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">Total Pipeline Revenue</h3>
                <p className="text-4xl font-black text-emerald-400">{totalRevenue.toLocaleString()} <span className="text-lg opacity-50">ETB</span></p>
              </div>
              <div className="p-6 rounded-[2rem] bg-[#111111] border border-white/10 shadow-xl">
                <h3 className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">Active Logistics Routes</h3>
                <p className="text-4xl font-black">{activeOrdersCount}</p>
              </div>
              <div className="p-6 rounded-[2rem] bg-[#111111] border border-white/10 shadow-xl">
                <h3 className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">VAT Liability Collected</h3>
                <p className="text-4xl font-black text-gray-300">{vatCollected.toLocaleString()} <span className="text-lg opacity-50">ETB</span></p>
              </div>
            </div>

            <div className="bg-[#0A0A0F] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-[10px] font-bold uppercase tracking-widest opacity-50 bg-black/50">
                <div className="col-span-3">Transaction / Client</div>
                <div className="col-span-3">Logistics Strategy</div>
                <div className="col-span-2">Value (ETB)</div>
                <div className="col-span-2">Pipeline Status</div>
                <div className="col-span-2 text-right">Action</div>
              </div>

              <div className="divide-y divide-white/5">
                {orders.length === 0 ? (
                  <div className="p-20 flex flex-col items-center justify-center opacity-30"><Activity size={48} className="mb-4" /></div>
                ) : (
                  orders.map((order) => (
                    <div key={order.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors cursor-pointer" onClick={() => openOrderMenu(order)}>
                      <div className="col-span-3">
                        <p className="font-bold text-sm truncate">{order.customerName}</p>
                        <p className="text-[10px] text-emerald-400 font-mono mt-0.5">{order.id}</p>
                      </div>
                      <div className="col-span-3">
                        <p className="text-xs font-bold mb-1 flex items-center gap-1.5 opacity-80">
                          {order.deliveryType === "Delivery" ? <><Truck size={12}/> Site Delivery</> : <><Building2 size={12}/> Self Pickup</>}
                        </p>
                        {order.deliveryType === "Delivery" && <p className="text-[10px] opacity-50 truncate">{order.logistics.region} • {order.logistics.subCity}</p>}
                      </div>
                      <div className="col-span-2">
                        <p className="font-black text-sm">{(Number(order.finalAmount) || 0).toLocaleString()}</p>
                      </div>
                      <div className="col-span-2">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border rounded-full ${getStatusColor(order.status)}`}>{order.status.replace("_", " ")}</span>
                      </div>
                      <div className="col-span-2 flex justify-end">
                        <button className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold flex items-center gap-2">View <ChevronRight size={14} /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================= */}
        {/* TAB: ADVANCED SETTINGS & AI CONFIG        */}
        {/* ========================================= */}
        {activeTab === "settings" && (
          <div className="animate-in fade-in duration-300">
            <header className="mb-8">
              <h2 className="text-3xl font-black tracking-tight mb-2">System Configuration</h2>
              <p className="text-sm opacity-50 font-medium">Core variables and AI communication network settings.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Financial Constants */}
              <div className="bg-[#0A0A0F] border border-white/10 rounded-[2rem] p-8 shadow-2xl">
                <h3 className="font-black text-lg mb-6 flex items-center gap-3 border-b border-white/10 pb-4"><FileText className="text-emerald-400"/> Core Variables</h3>
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest opacity-70 block mb-2">Corporate VAT Rate (%)</label>
                    <input type="number" value={systemSettings.taxRate} onChange={e => setSystemSettings({...systemSettings, taxRate: e.target.value})} className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-xl outline-none focus:border-emerald-500 font-mono" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest opacity-70 block mb-2">Base Delivery Fee (ETB)</label>
                    <input type="number" value={systemSettings.deliveryBaseFee} onChange={e => setSystemSettings({...systemSettings, deliveryBaseFee: e.target.value})} className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-xl outline-none focus:border-emerald-500 font-mono" />
                  </div>
                </div>
              </div>

              {/* AI Network Module */}
              <div className="bg-gradient-to-br from-indigo-900/20 to-[#0A0A0F] border border-indigo-500/20 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none" />
                <h3 className="font-black text-lg mb-6 flex items-center gap-3 border-b border-indigo-500/20 pb-4"><Activity className="text-indigo-400"/> AI Communication Layer</h3>
                <div className="space-y-6">
                  <p className="text-sm opacity-70 leading-relaxed">Establish the neural link between the Storefront Client AI and the Admin Assistant AI.</p>
                  
                  <div className="flex items-center justify-between p-4 bg-black/50 border border-white/5 rounded-xl">
                    <div>
                      <p className="font-bold text-sm">AI Agent Network</p>
                      <p className="text-[10px] uppercase tracking-widest opacity-50 mt-1">Status: {systemSettings.aiEnabled ? 'Online' : 'Offline'}</p>
                    </div>
                    <button onClick={() => setSystemSettings({...systemSettings, aiEnabled: !systemSettings.aiEnabled})} className={`w-12 h-6 rounded-full transition-colors relative ${systemSettings.aiEnabled ? 'bg-indigo-500' : 'bg-white/10'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${systemSettings.aiEnabled ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                  
                  <div className="opacity-50 grayscale pointer-events-none">
                    <label className="text-xs font-bold uppercase tracking-widest opacity-70 block mb-2">LLM API Key (OpenAI / Gemini)</label>
                    <input type="password" value="sk-xxxxxxxxxxxxxxxxxxxxxxxx" readOnly className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-xl font-mono text-xs" />
                    <p className="text-[10px] mt-2 text-indigo-400 font-bold uppercase tracking-widest">Awaiting Part 2 Implementation</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* ========================================= */}
      {/* DRAWER: INVENTORY FORM (WITH STOCK & WAREHOUSE) */}
      {/* ========================================= */}
      <div className={`fixed inset-0 z-50 transition-all duration-300 ${isDrawerOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div onClick={() => setIsDrawerOpen(false)} className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0'}`} />
        <div className={`absolute top-0 right-0 h-full w-full md:w-[600px] bg-[#0A0A0F] border-l border-white/10 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/40">
            <h2 className="text-xl font-black tracking-wider flex items-center gap-3">
              {editingId ? <Edit2 className="text-emerald-400" /> : <Plus className="text-emerald-400" />} 
              {editingId ? "Reconfigure Material" : "Deploy New Material"}
            </h2>
            <button onClick={() => setIsDrawerOpen(false)} className="p-2 rounded-full hover:bg-white/10 transition-colors opacity-50 hover:opacity-100"><X size={20} /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            <form id="material-form" onSubmit={handleSave} className="space-y-6">
              
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest opacity-70 flex justify-between"><span>Showcase Asset</span></label>
                <div className="flex gap-4 items-center">
                  <div onClick={() => document.getElementById('imageUpload')?.click()} className="relative w-16 h-16 rounded-xl bg-black border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center group cursor-pointer hover:border-emerald-500 transition-colors">
                    {formData.imageUrl ? <img src={formData.imageUrl} className="w-full h-full object-cover" /> : <UploadCloud size={20} className="opacity-30 group-hover:text-emerald-400 group-hover:opacity-100" />}
                    {isUploadingImage && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-400" size={20} /></div>}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input type="file" id="imageUpload" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    <input required type="url" placeholder="Paste direct image link..." value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-xl outline-none focus:border-emerald-500 text-sm" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest opacity-70">Material Title</label>
                  <input required type="text" placeholder="e.g. Grade 60 Rebar" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-xl outline-none focus:border-emerald-500 text-sm font-bold" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest opacity-70">Pricing (ETB)</label>
                  <input required type="number" min="0" step="0.01" placeholder="0.00" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-xl outline-none focus:border-emerald-500 text-sm font-mono" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Metric Unit</label>
                    {uniqueMetrics.length > 0 && <button type="button" onClick={() => setIsNewMetric(!isNewMetric)} className="text-[9px] text-emerald-400 font-bold uppercase">{isNewMetric ? "Select Existing" : "+ Add New"}</button>}
                  </div>
                  {isNewMetric || uniqueMetrics.length === 0 ? (
                    <input required type="text" placeholder="e.g. Kg, Bags" value={formData.metric} onChange={e => setFormData({...formData, metric: e.target.value})} className="w-full px-3 py-3 bg-[#111111] border border-white/10 rounded-lg outline-none focus:border-emerald-500 text-sm" />
                  ) : (
                    <div className="relative">
                      <select required value={formData.metric} onChange={e => setFormData({...formData, metric: e.target.value})} className="w-full px-3 py-3 bg-[#111111] border border-white/10 rounded-lg outline-none focus:border-emerald-500 text-sm appearance-none">
                        <option value="" disabled>Select Metric</option>
                        {uniqueMetrics.map(m => <option key={m as string} value={m as string}>{m as string}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" />
                    </div>
                  )}
                </div>
              </div>

              {/* NEW: STOCK & LOCATION TRACKING */}
              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-900/10 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400 border-b border-emerald-500/20 pb-2">Location & Physical Stock</h3>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Current Quantity</label>
                    <input required type="number" min="0" placeholder="0" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg outline-none focus:border-emerald-500 text-sm font-mono text-emerald-400" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Assigned Facility</label>
                      {uniqueWarehouses.length > 0 && <button type="button" onClick={() => setIsNewWarehouse(!isNewWarehouse)} className="text-[9px] text-emerald-400 font-bold uppercase">{isNewWarehouse ? "Select Existing" : "+ Add New"}</button>}
                    </div>
                    {isNewWarehouse || uniqueWarehouses.length === 0 ? (
                      <input required type="text" placeholder="e.g. Kality Main Hub" value={formData.warehouse} onChange={e => setFormData({...formData, warehouse: e.target.value})} className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg outline-none focus:border-emerald-500 text-sm" />
                    ) : (
                      <div className="relative">
                        <select required value={formData.warehouse} onChange={e => setFormData({...formData, warehouse: e.target.value})} className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg outline-none focus:border-emerald-500 text-sm appearance-none">
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
                <h3 className="text-xs font-bold uppercase tracking-widest opacity-50 border-b border-white/10 pb-2">Storefront Matrix</h3>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Primary Menu</label>
                      {uniqueMenus.length > 0 && <button type="button" onClick={() => setIsNewMenu(!isNewMenu)} className="text-[9px] text-emerald-400 font-bold uppercase">{isNewMenu ? "Select Existing" : "+ Add New"}</button>}
                    </div>
                    {isNewMenu || uniqueMenus.length === 0 ? (
                      <input required type="text" placeholder="e.g. Structural" value={formData.menu} onChange={e => setFormData({...formData, menu: e.target.value})} className="w-full px-3 py-2 bg-[#111111] border border-white/10 rounded-lg outline-none focus:border-emerald-500 text-sm" />
                    ) : (
                      <div className="relative">
                        <select required value={formData.menu} onChange={e => {setFormData({...formData, menu: e.target.value, submenu: "", type: "Standard"}); setIsNewSubmenu(false); setIsNewType(false);}} className="w-full px-3 py-2 bg-[#111111] border border-white/10 rounded-lg outline-none focus:border-emerald-500 text-sm appearance-none">
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
                      <input required type="text" placeholder="e.g. Steel & Metals" value={formData.submenu} onChange={e => setFormData({...formData, submenu: e.target.value})} className="w-full px-3 py-2 bg-[#111111] border border-white/10 rounded-lg outline-none focus:border-emerald-500 text-sm" />
                    ) : (
                      <div className="relative">
                        <select required value={formData.submenu} onChange={e => {setFormData({...formData, submenu: e.target.value, type: "Standard"}); setIsNewType(false);}} className="w-full px-3 py-2 bg-[#111111] border border-white/10 rounded-lg outline-none focus:border-emerald-500 text-sm appearance-none">
                          <option value="" disabled>Select Submenu</option>
                          {uniqueSubmenus.map(m => <option key={m as string} value={m as string}>{m as string}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" />
                      </div>
                    )}
                  </div>

                  <div className="col-span-2 space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Material Type</label>
                      <button type="button" onClick={() => setIsNewType(!isNewType)} className="text-[9px] text-emerald-400 font-bold uppercase">{isNewType ? "Select Existing" : "+ Add New"}</button>
                    </div>
                    {isNewType ? (
                      <input required type="text" placeholder="e.g. Premium" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 bg-[#111111] border border-white/10 rounded-lg outline-none focus:border-emerald-500 text-sm" />
                    ) : (
                      <div className="relative">
                        <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 bg-[#111111] border border-white/10 rounded-lg outline-none focus:border-emerald-500 text-sm appearance-none">
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
                <label className="text-xs font-bold uppercase tracking-widest opacity-70">Technical Description</label>
                <textarea required rows={4} placeholder="Detailed specifications..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-4 bg-[#111111] border border-white/10 rounded-xl outline-none focus:border-emerald-500 text-sm resize-none"></textarea>
              </div>

            </form>
          </div>

          <div className="p-6 bg-black/90 border-t border-white/10 flex gap-3">
            <button type="button" onClick={() => setIsDrawerOpen(false)} className="px-6 py-4 rounded-xl border border-white/10 bg-white/5 font-bold hover:bg-white/10 transition-colors">Cancel</button>
            <button type="submit" form="material-form" disabled={isSaving || isUploadingImage} className="flex-1 py-4 rounded-xl text-black bg-emerald-500 hover:bg-emerald-400 font-black uppercase tracking-widest transition-transform active:scale-95 flex items-center justify-center gap-3 shadow-xl">
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              {isSaving ? "Syncing..." : (editingId ? "Update Parameters" : "Deploy to Live")}
            </button>
          </div>
        </div>
      </div>


      {/* ========================================= */}
      {/* DRAWER: ORDER DETAILS & ADVANCED DISPATCH */}
      {/* ========================================= */}
      <div className={`fixed inset-0 z-50 transition-all duration-300 ${isOrderDrawerOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div onClick={() => setIsOrderDrawerOpen(false)} className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOrderDrawerOpen ? 'opacity-100' : 'opacity-0'}`} />
        <div className={`absolute top-0 right-0 h-full w-full md:w-[600px] bg-[#0A0A0F] border-l border-white/10 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${isOrderDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          
          <div className="p-6 border-b border-white/10 flex justify-between items-start bg-black/40">
            <div>
              <h2 className="text-xl font-black tracking-wider flex items-center gap-3 mb-1">
                Logistics Directive
              </h2>
              <p className="text-sm font-mono text-emerald-400 opacity-80">{selectedOrder?.id}</p>
            </div>
            <button onClick={() => setIsOrderDrawerOpen(false)} className="p-2 rounded-full hover:bg-white/10 transition-colors opacity-50 hover:opacity-100"><X size={20} /></button>
          </div>

          {selectedOrder && (
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide space-y-8">
              
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest opacity-50 border-b border-white/10 pb-2 mb-4">Pipeline Status Control</h3>
                <div className="grid grid-cols-2 gap-3">
                  {['pending_payment', 'processing', 'dispatched', 'delivered'].map((statusOption) => (
                    <button 
                      key={statusOption}
                      disabled={isUpdatingStatus || selectedOrder.status === statusOption}
                      onClick={() => updateOrderStatus(selectedOrder.id, statusOption)}
                      className={`px-4 py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all
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

              {/* NEW: ADVANCED DISPATCHING INTEL */}
              {selectedOrder.status === 'dispatched' && (
                <div className="p-5 rounded-[1.5rem] bg-indigo-900/10 border border-indigo-500/20 space-y-4 animate-in fade-in slide-in-from-top-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2"><Truck size={14}/> Dispatch Driver Intel</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="Driver Name" value={dispatchInfo.driverName} onChange={e => setDispatchInfo({...dispatchInfo, driverName: e.target.value})} className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg outline-none focus:border-indigo-500 text-sm" />
                    <input type="text" placeholder="Driver Phone" value={dispatchInfo.driverPhone} onChange={e => setDispatchInfo({...dispatchInfo, driverPhone: e.target.value})} className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg outline-none focus:border-indigo-500 text-sm" />
                    <input type="text" placeholder="Vehicle Plate No." value={dispatchInfo.vehiclePlate} onChange={e => setDispatchInfo({...dispatchInfo, vehiclePlate: e.target.value})} className="col-span-2 w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg outline-none focus:border-indigo-500 text-sm font-mono" />
                  </div>
                  <button onClick={() => updateOrderStatus(selectedOrder.id, 'dispatched')} className="w-full py-2 bg-indigo-500/20 text-indigo-400 font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-indigo-500/30 transition-colors">
                    Save Dispatch Intel
                  </button>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest opacity-50 border-b border-white/10 pb-2">Client Intel</h3>
                <div className="grid grid-cols-2 gap-4">
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

              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest opacity-50 border-b border-white/10 pb-2">Deployment Strategy</h3>
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    {selectedOrder.deliveryType === "Delivery" ? <Truck className="text-blue-400" size={18} /> : <Building2 className="text-indigo-400" size={18} />}
                    <span className="font-bold">{selectedOrder.deliveryType}</span>
                  </div>
                  {selectedOrder.deliveryType === "Delivery" && selectedOrder.logistics && (
                    <div className="pl-6 border-l border-white/10 text-sm">
                      <p className="font-bold">{selectedOrder.logistics.region}</p>
                      <p className="opacity-70 mb-2">{selectedOrder.logistics.subCity}</p>
                      <p className="opacity-50 text-xs">{selectedOrder.logistics.specificAddress}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest opacity-50 border-b border-white/10 pb-2">Materials Manifest</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-black border border-white/5 rounded-xl">
                      <div>
                        <p className="font-bold text-sm">{item.title}</p>
                        <p className="text-xs opacity-50">{item.quantity} {item.metric || 'Units'} @ {(Number(item.price)||0).toLocaleString()} ETB</p>
                      </div>
                      <p className="font-black text-emerald-400 text-sm">
                        {((Number(item.price)||0) * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
                
                <div className="pt-4 border-t border-white/10 text-sm space-y-2">
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
                  <div className="flex justify-between text-xl font-black pt-2">
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