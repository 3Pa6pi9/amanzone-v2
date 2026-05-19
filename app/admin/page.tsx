"use client";

import { useState, useEffect } from "react";

// --- The Master Catalog Matrix ---
const catalogStructure: Record<string, any> = {
  "Construction Steel (የግንባታ ብረት)": {
    submenus: ["Turkish (ቱርክ)", "Local (ሀገር በቀል)"],
    types: ["Deformed Bar", "Plain Bar"],
    metrics: ["8mm", "10mm", "12mm", "14mm", "16mm", "20mm", "24mm"],
    colors: ["Standard Iron"]
  },
  "Roofing Iron Sheets (ቆርቆሮ)": {
    submenus: ["Standard (የተለመደ)", "EGA (ኢ.ጂ.ኤ)", "Tiles (ታይልስ)"],
    types: ["G-28", "G-32", "G-35"],
    metrics: ["Standard Length", "Custom Length"],
    colors: ["Unpainted", "Red", "Blue", "Green"]
  },
  "Tubular Steel Profiles (ቱቦና ፕሮፋይል ብረት)": {
    submenus: ["RHS", "CHS", "SHS", "Round Bar", "Flat Iron", "Angle Iron", "LTZ", "Sheet Metal"],
    types: ["Standard Duty", "Heavy Duty"],
    metrics: ["1mm", "1.2mm", "1.5mm", "2mm", "Custom"],
    colors: ["Standard Iron"]
  },
  "Ceiling Tiles (ኮርኒስ)": {
    submenus: ["PVC", "Armstrong", "Acoustic"],
    types: ["Standard", "Waterproof", "Fire Retardant"],
    metrics: ["60x60cm", "Custom"],
    colors: ["White", "Wood Grain", "Custom"]
  },
  "Timber (ጣውላ)": {
    submenus: ["Australia (አውስትራሊያ)", "Shashemene (ሻሸመኔ)"],
    types: ["Eucalyptus", "Pine", "Hardwood"],
    metrics: ["2x4", "2x3", "Custom"],
    colors: ["Natural Wood"]
  },
  "MDF Boards (ኤም ዲ ኤፍ)": {
    submenus: ["Laminated", "Raw"],
    types: ["Standard", "High Density"],
    metrics: ["1220x2440mm", "Custom"],
    colors: ["White", "Black", "Walnut", "Custom"]
  },
  "Gypsum Board (ጂፕሰም)": {
    submenus: ["Standard", "Moisture Resistant", "Fire Retardant"],
    types: ["Interior Grade", "Exterior Grade"],
    metrics: ["9mm", "12.5mm"],
    colors: ["White / Gray"]
  }
};

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [activeTab, setActiveTab] = useState("deploy");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Base Deployment Form State
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // Amharic Catalog Attributes
  const [menu, setMenu] = useState("");
  const [submenu, setSubmenu] = useState("");
  const [materialType, setMaterialType] = useState("");
  const [color, setColor] = useState("");
  const [metric, setMetric] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "miracle" || passwordInput === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("Security Access Denied: Invalid Key.");
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await fetch("/api/inventory");
      if (res.ok) setProducts(await res.json());
    } catch (err) { console.error("Sync Error", err); }
  };

  useEffect(() => { if (isAuthenticated) fetchInventory(); }, [isAuthenticated]);

  // Reset dependent fields when Main Menu changes
  useEffect(() => {
    setSubmenu(""); setMaterialType(""); setColor(""); setMetric("");
  }, [menu]);

  const openCloudinary = () => {
    // @ts-ignore
    const widget = window.cloudinary.createUploadWidget(
      { cloudName: "dfqfcbgb3", uploadPreset: "amanzone_uploads" },
      (error: any, result: any) => {
        if (!error && result.event === "success") setImageUrl(result.info.secure_url);
      }
    );
    widget.open();
  };

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title, 
          price: parseFloat(price), 
          menu, 
          submenu, 
          type: materialType, 
          color, 
          metric, 
          description, 
          imageUrl 
        }),
      });
      if (res.ok) {
        alert("Deployed to Live Catalog!");
        setTitle(""); setPrice(""); setMenu(""); setSubmenu(""); setMaterialType(""); setColor(""); setMetric(""); setDescription(""); setImageUrl(""); 
        fetchInventory();
      }
    } catch (err) { alert("Deployment Failed."); }
    finally { setLoading(false); }
  };

  if (!isAuthenticated) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl">
        <h1 className="text-3xl font-black text-amber-500 mb-6 text-center">AMANZONE ADMIN</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="password" value={passwordInput} onChange={(e)=>setPasswordInput(e.target.value)} placeholder="Access Key..." className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-white outline-none focus:border-amber-500"/>
          <button type="submit" className="w-full bg-amber-500 py-3 rounded-lg font-bold uppercase tracking-widest text-black">Unlock Node</button>
          {authError && <p className="text-red-500 text-xs text-center">{authError}</p>}
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex font-sans">
      <aside className="w-64 bg-neutral-900 border-r border-neutral-800 p-6 space-y-8 hidden md:block">
        <h2 className="text-xl font-black text-amber-500">CONTROL PANEL</h2>
        <nav className="flex flex-col gap-2">
          {["deploy", "inventory", "settings"].map(tab => (
            <button key={tab} onClick={()=>setActiveTab(tab)} className={`text-left p-3 rounded-lg capitalize font-bold ${activeTab === tab ? "bg-amber-500 text-black" : "text-neutral-500 hover:bg-neutral-800"}`}>{tab}</button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto w-full">
        {/* Mobile Tab Switcher */}
        <div className="flex gap-2 mb-6 md:hidden overflow-x-auto">
           {["deploy", "inventory", "settings"].map(tab => (
            <button key={tab} onClick={()=>setActiveTab(tab)} className={`px-4 py-2 rounded-lg capitalize text-sm font-bold ${activeTab === tab ? "bg-amber-500 text-black" : "bg-neutral-900 text-neutral-500"}`}>{tab}</button>
          ))}
        </div>

        {activeTab === "deploy" && (
          <div className="max-w-3xl bg-neutral-900 p-6 md:p-8 rounded-xl border border-neutral-800 shadow-xl">
            <h3 className="text-xl font-bold mb-6 border-b border-neutral-800 pb-4 text-amber-500 uppercase tracking-wider">New Material Deployment</h3>
            <form onSubmit={handleDeploy} className="space-y-6">
              
              {/* Core Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-500 font-bold mb-2">Product Title</label>
                  <input type="text" value={title} onChange={(e)=>setTitle(e.target.value)} required placeholder="e.g. 12mm Deformed Steel" className="w-full bg-black p-3 border border-neutral-800 rounded-lg text-white focus:border-amber-500 outline-none"/>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-500 font-bold mb-2">Price (USD)</label>
                  <input type="number" value={price} onChange={(e)=>setPrice(e.target.value)} required placeholder="Price per unit/ton" className="w-full bg-black p-3 border border-neutral-800 rounded-lg text-white focus:border-amber-500 outline-none"/>
                </div>
              </div>

              {/* Advanced Classification Matrix */}
              <div className="bg-black/50 p-6 border border-neutral-800 rounded-xl space-y-4">
                <h4 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4">Classification Matrix</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Main Menu Dropdown */}
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">Main Category (Menu)</label>
                    <select value={menu} onChange={(e)=>setMenu(e.target.value)} required className="w-full bg-neutral-900 p-3 border border-neutral-800 rounded-lg text-sm text-white focus:border-amber-500 outline-none">
                      <option value="">-- Select Category --</option>
                      {Object.keys(catalogStructure).map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Submenu Dropdown (Depends on Menu) */}
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">Sub Category</label>
                    <select value={submenu} onChange={(e)=>setSubmenu(e.target.value)} disabled={!menu} className="w-full bg-neutral-900 p-3 border border-neutral-800 rounded-lg text-sm text-white focus:border-amber-500 outline-none disabled:opacity-50">
                      <option value="">-- Select Submenu --</option>
                      {menu && catalogStructure[menu]?.submenus.map((sub: string) => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  {/* Type Dropdown */}
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">Type</label>
                    <select value={materialType} onChange={(e)=>setMaterialType(e.target.value)} disabled={!menu} className="w-full bg-neutral-900 p-3 border border-neutral-800 rounded-lg text-sm text-white focus:border-amber-500 outline-none disabled:opacity-50">
                      <option value="">-- Select Type --</option>
                      {menu && catalogStructure[menu]?.types?.map((type: string) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {/* Color Dropdown */}
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">Color Variant</label>
                    <select value={color} onChange={(e)=>setColor(e.target.value)} disabled={!menu} className="w-full bg-neutral-900 p-3 border border-neutral-800 rounded-lg text-sm text-white focus:border-amber-500 outline-none disabled:opacity-50">
                      <option value="">-- Select Color --</option>
                      {menu && catalogStructure[menu]?.colors?.map((col: string) => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>

                  {/* Metric Dropdown */}
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">Metric / Dimension</label>
                    <select value={metric} onChange={(e)=>setMetric(e.target.value)} disabled={!menu} className="w-full bg-neutral-900 p-3 border border-neutral-800 rounded-lg text-sm text-white focus:border-amber-500 outline-none disabled:opacity-50">
                      <option value="">-- Select Metric --</option>
                      {menu && catalogStructure[menu]?.metrics?.map((met: string) => (
                        <option key={met} value={met}>{met}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Description & Media */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-500 font-bold mb-2">Specifications Note</label>
                <textarea rows={3} value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Enter full material specifications here..." className="w-full bg-black p-3 border border-neutral-800 rounded-lg text-white focus:border-amber-500 outline-none"></textarea>
              </div>

              <div>
                <button type="button" onClick={openCloudinary} className="w-full bg-neutral-800 hover:bg-neutral-700 transition-colors p-4 rounded-lg border border-neutral-700 text-amber-500 font-bold text-sm uppercase tracking-widest shadow-inner">
                  Upload Media Asset via Cloudinary
                </button>
                {imageUrl && <p className="text-xs text-emerald-400 mt-2 font-mono">✓ Media Linked: {imageUrl}</p>}
              </div>

              <button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 transition-colors p-4 rounded-lg font-black text-black uppercase tracking-widest mt-4 shadow-lg disabled:opacity-50">
                {loading ? "Deploying Node..." : "Deploy to Catalog"}
              </button>
            </form>
          </div>
        )}

        {/* INVENTORY TAB */}
        {activeTab === "inventory" && (
          <div className="max-w-4xl">
            <h3 className="text-xl font-bold mb-6 border-b border-neutral-800 pb-4 text-amber-500 uppercase tracking-wider">Active Inventory</h3>
            <div className="grid grid-cols-1 gap-4">
              {products.map((prod) => (
                <div key={prod.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center shadow-md gap-4">
                  <div className="flex items-center gap-4">
                    {prod.imageUrl && <img src={prod.imageUrl} alt={prod.title} className="w-16 h-16 object-cover rounded-lg border border-neutral-800" />}
                    <div>
                      <h4 className="font-bold text-neutral-100 text-lg">{prod.title}</h4>
                      <p className="text-xs text-neutral-400 mt-1">
                        {prod.menu} {prod.submenu && `➔ ${prod.submenu}`}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {prod.type && <span className="text-[10px] uppercase tracking-wider bg-neutral-800 px-2 py-1 rounded text-neutral-300">{prod.type}</span>}
                        {prod.color && <span className="text-[10px] uppercase tracking-wider bg-neutral-800 px-2 py-1 rounded text-neutral-300">{prod.color}</span>}
                        {prod.metric && <span className="text-[10px] uppercase tracking-wider bg-neutral-800 px-2 py-1 rounded text-neutral-300">{prod.metric}</span>}
                        <span className="text-[10px] uppercase tracking-wider bg-amber-500/20 text-amber-500 px-2 py-1 rounded font-bold">${prod.price}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={async () => {
                    if(confirm("Confirm removal?")) {
                      await fetch(`/api/inventory/${prod.id}`, { method: "DELETE" });
                      fetchInventory();
                    }
                  }} className="bg-red-950/40 hover:bg-red-950 text-red-400 border border-red-900/50 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors w-full md:w-auto">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
           <div className="max-w-xl bg-neutral-900 p-8 rounded-xl border border-neutral-800">
             <h3 className="text-xl font-bold mb-6 border-b border-neutral-800 pb-4 text-amber-500 uppercase tracking-wider">Global Settings</h3>
             <p className="text-neutral-500 text-sm">Hostess logistics strictly assigned to China imports.</p>
           </div>
        )}
      </main>
    </div>
  );
}
