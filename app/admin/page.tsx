"use client";

import React, { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, updateDoc, doc, query, orderBy } from "firebase/firestore";
import { 
  Package, Plus, Edit2, Trash2, X, Search, Activity, 
  Box, Settings, Save, Loader2, CheckCircle2, Image as ImageIcon, AlertTriangle
} from "lucide-react";

// The base template for a new material
const initialFormState = {
  title: "",
  price: "",
  description: "",
  menu: "Structural",
  submenu: "",
  type: "Standard",
  metric: "Unit",
  imageUrl: ""
};

export default function AdminCommandCenter() {
  const [activeTab, setActiveTab] = useState("inventory");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Drawer & Form State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialFormState);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [toast, setToast] = useState({ show: false, msg: "", type: "success" });

  // 1. Live Sync with Firestore Inventory
  useEffect(() => {
    const q = query(collection(db, "inventory"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Database connection lost:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const showToast = (msg: string, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "success" }), 3000);
  };

  const openAddMenu = () => {
    setFormData(initialFormState);
    setEditingId(null);
    setIsDrawerOpen(true);
  };

  const openEditMenu = (product: any) => {
    setFormData({
      title: product.title || "",
      price: product.price || "",
      description: product.description || "",
      menu: product.menu || "Structural",
      submenu: product.submenu || "",
      type: product.type || "Standard",
      metric: product.metric || "Unit",
      imageUrl: product.imageUrl || ""
    });
    setEditingId(product.id);
    setIsDrawerOpen(true);
  };

  // 2. Save / Update Logic
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const payload = {
        ...formData,
        price: formData.price.toString(), // Storefront uses parseFloat()
        updatedAt: new Date().toISOString()
      };

      if (editingId) {
        // Update existing material
        await updateDoc(doc(db, "inventory", editingId), payload);
        showToast("Material parameters updated.");
      } else {
        // Add new material
        await addDoc(collection(db, "inventory"), {
          ...payload,
          createdAt: new Date().toISOString()
        });
        showToast("New material deployed to storefront.");
      }
      
      setIsDrawerOpen(false);
    } catch (error) {
      console.error("Save failed:", error);
      showToast("System error during save.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // 3. Delete Logic (Using the hardened API route)
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently purge this material?")) return;
    
    setIsDeleting(id);
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
      const data = await res.json();
      
      if (res.ok) {
        showToast("Material purged from pipeline.");
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Delete failed:", error);
      showToast("Failed to purge material.", "error");
    } finally {
      setIsDeleting(null);
    }
  };

  // 4. Client-side Search Filter
  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      (p.title || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.menu || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  return (
    <div className="flex min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30">
      
      {/* Dynamic Toast Notification */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full font-bold text-sm shadow-2xl flex items-center gap-3 transition-all duration-300 ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'} ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-white text-black'}`}>
        {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 className="text-emerald-500" size={18} />}
        {toast.msg}
      </div>

      {/* --- SIDEBAR NAVIGATION --- */}
      <aside className="w-64 border-r border-white/10 bg-[#0A0A0F] flex flex-col fixed h-full z-40">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-black bg-emerald-400">AZ</div>
            <div>
              <h1 className="font-black tracking-tight text-lg leading-tight">Command<br/>Center</h1>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab("inventory")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === "inventory" ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
            <Box size={18} /> Inventory Control
          </button>
          
          <button onClick={() => setActiveTab("orders")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === "orders" ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
            <Activity size={18} /> Logistics & Orders <span className="ml-auto px-2 py-0.5 bg-white/10 rounded text-[10px]">Soon</span>
          </button>

          <button onClick={() => setActiveTab("settings")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === "settings" ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
            <Settings size={18} /> System Config <span className="ml-auto px-2 py-0.5 bg-white/10 rounded text-[10px]">Soon</span>
          </button>
        </nav>
        
        <div className="p-6 border-t border-white/10 text-xs opacity-30 font-bold uppercase tracking-widest text-center">
          Admin Environment
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 ml-64 p-8">
        
        {/* Header Section */}
        <header className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-black tracking-tight mb-2">Inventory Matrix</h2>
            <p className="text-sm opacity-50 font-medium">Add, configure, and purge storefront materials in real-time.</p>
          </div>
          <button onClick={openAddMenu} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Plus size={18} /> Deploy Material
          </button>
        </header>

        {/* Search & Stats */}
        <div className="flex gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" size={18} />
            <input 
              type="text" placeholder="Search by name, category, or ID..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#111111] border border-white/10 rounded-xl outline-none focus:border-emerald-500 transition-colors text-sm"
            />
          </div>
          <div className="px-6 py-3 bg-[#111111] border border-white/10 rounded-xl flex items-center gap-3 font-bold text-sm text-gray-400">
            Total Pipeline Assets: <span className="text-emerald-400 text-lg">{products.length}</span>
          </div>
        </div>

        {/* Inventory Data Grid */}
        <div className="bg-[#0A0A0F] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-xs font-bold uppercase tracking-widest opacity-50 bg-black/50">
            <div className="col-span-1 text-center">Asset</div>
            <div className="col-span-3">Material Identity</div>
            <div className="col-span-3">Logistics Matrix (Menu)</div>
            <div className="col-span-2">Pricing (ETB)</div>
            <div className="col-span-2">Date Added</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          <div className="divide-y divide-white/5">
            {loading ? (
              <div className="p-20 flex flex-col items-center justify-center opacity-50">
                <Loader2 className="animate-spin mb-4" size={32} />
                <p className="font-bold uppercase tracking-widest text-sm">Syncing Database...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-20 flex flex-col items-center justify-center opacity-30">
                <Package size={48} className="mb-4" />
                <p className="font-bold">No materials found in the current configuration.</p>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div key={product.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors">
                  
                  {/* Asset Image */}
                  <div className="col-span-1 flex justify-center">
                    <div className="w-10 h-10 rounded-lg bg-black border border-white/10 overflow-hidden flex items-center justify-center">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={16} className="opacity-30" />
                      )}
                    </div>
                  </div>

                  {/* Identity */}
                  <div className="col-span-3">
                    <p className="font-bold text-sm line-clamp-1">{product.title || "Unnamed"}</p>
                    <p className="text-xs opacity-50 font-mono mt-0.5">{product.id.slice(0, 8)}...</p>
                  </div>

                  {/* Matrix */}
                  <div className="col-span-3">
                    <div className="flex gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-white/10 rounded text-[10px] font-bold uppercase tracking-wider">{product.menu || "N/A"}</span>
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold uppercase tracking-wider">{product.type || "N/A"}</span>
                    </div>
                    <p className="text-xs opacity-50 truncate">{product.submenu} • {product.metric}</p>
                  </div>

                  {/* Pricing */}
                  <div className="col-span-2">
                    <p className="font-black text-emerald-400">{(parseFloat(product.price) || 0).toLocaleString()}</p>
                    <p className="text-[10px] opacity-50 uppercase tracking-widest mt-0.5">Per {product.metric || "Unit"}</p>
                  </div>

                  {/* Date Added */}
                  <div className="col-span-2 text-xs opacity-70">
                    {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'Unknown'}
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex items-center justify-end gap-2">
                    <button onClick={() => openEditMenu(product)} className="p-2 rounded-lg hover:bg-white/10 transition-colors text-blue-400 hover:text-blue-300">
                      <Edit2 size={16} />
                    </button>
                    <button disabled={isDeleting === product.id} onClick={() => handleDelete(product.id)} className="p-2 rounded-lg hover:bg-red-500/20 transition-colors text-red-400 hover:text-red-300 disabled:opacity-50">
                      {isDeleting === product.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>

                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* --- ADD / EDIT MATERIAL DRAWER --- */}
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
              
              {/* Asset URL */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest opacity-70 flex justify-between">
                  <span>Showcase Asset URL</span>
                  <span className="opacity-50 text-[10px]">Direct Image Link (Firebase/Imgur)</span>
                </label>
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 rounded-xl bg-black border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {formData.imageUrl ? <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Preview"/> : <ImageIcon size={20} className="opacity-30" />}
                  </div>
                  <input required type="url" placeholder="https://..." value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="flex-1 px-4 py-3 bg-[#111111] border border-white/10 rounded-xl outline-none focus:border-emerald-500 text-sm" />
                </div>
              </div>

              {/* Core Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest opacity-70">Material Title</label>
                  <input required type="text" placeholder="e.g. Grade 60 Rebar (12mm)" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-xl outline-none focus:border-emerald-500 text-sm font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest opacity-70">Pricing (ETB)</label>
                  <input required type="number" min="0" step="0.01" placeholder="0.00" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-xl outline-none focus:border-emerald-500 text-sm font-mono" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest opacity-70">Metric Unit</label>
                  <input required type="text" placeholder="e.g. Kg, Bags, Pieces" value={formData.metric} onChange={e => setFormData({...formData, metric: e.target.value})} className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-xl outline-none focus:border-emerald-500 text-sm" />
                </div>
              </div>

              {/* Logistics Matrix (Categories) */}
              <div className="p-4 rounded-xl border border-white/10 bg-black/30 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest opacity-50 border-b border-white/10 pb-2">Storefront Placement Matrix</h3>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Primary Menu</label>
                    <input required type="text" placeholder="e.g. Structural" value={formData.menu} onChange={e => setFormData({...formData, menu: e.target.value})} className="w-full px-3 py-2 bg-[#111111] border border-white/10 rounded-lg outline-none focus:border-emerald-500 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Submenu</label>
                    <input required type="text" placeholder="e.g. Steel & Metals" value={formData.submenu} onChange={e => setFormData({...formData, submenu: e.target.value})} className="w-full px-3 py-2 bg-[#111111] border border-white/10 rounded-lg outline-none focus:border-emerald-500 text-sm" />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Material Type</label>
                    <input required type="text" placeholder="e.g. Standard, Premium, Imported" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 bg-[#111111] border border-white/10 rounded-lg outline-none focus:border-emerald-500 text-sm" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest opacity-70">Technical Description</label>
                <textarea required rows={4} placeholder="Detailed specifications, load bearings, origins..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-4 bg-[#111111] border border-white/10 rounded-xl outline-none focus:border-emerald-500 text-sm resize-none"></textarea>
              </div>

            </form>
          </div>

          <div className="p-6 bg-black/90 border-t border-white/10 flex gap-3">
            <button type="button" onClick={() => setIsDrawerOpen(false)} className="px-6 py-4 rounded-xl border border-white/10 bg-white/5 font-bold hover:bg-white/10 transition-colors">Cancel</button>
            <button type="submit" form="material-form" disabled={isSaving} className="flex-1 py-4 rounded-xl text-black bg-emerald-500 hover:bg-emerald-400 font-black uppercase tracking-widest transition-transform active:scale-95 flex items-center justify-center gap-3 shadow-xl">
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              {isSaving ? "Syncing..." : (editingId ? "Update Parameters" : "Deploy to Live")}
            </button>
          </div>

        </div>
      </div>
      
    </div>
  );
}