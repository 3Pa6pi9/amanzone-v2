"use client";

<<<<<<< HEAD
import { useState, useEffect } from "react";

// --- THEME ENGINE ---
const themeMap: Record<string, any> = {
  amber: { text: "text-amber-500", bg: "bg-amber-500", border: "border-amber-500", hover: "hover:bg-amber-500", hoverText: "hover:text-amber-500", checked: "checked:bg-amber-500 checked:border-amber-500", focus: "focus:border-amber-500" },
  crimson: { text: "text-rose-600", bg: "bg-rose-600", border: "border-rose-600", hover: "hover:bg-rose-600", hoverText: "hover:text-rose-600", checked: "checked:bg-rose-600 checked:border-rose-600", focus: "focus:border-rose-600" },
  cobalt: { text: "text-blue-500", bg: "bg-blue-500", border: "border-blue-500", hover: "hover:bg-blue-500", hoverText: "hover:text-blue-500", checked: "checked:bg-blue-500 checked:border-blue-500", focus: "focus:border-blue-500" },
  emerald: { text: "text-emerald-500", bg: "bg-emerald-500", border: "border-emerald-500", hover: "hover:bg-emerald-500", hoverText: "hover:text-emerald-500", checked: "checked:bg-emerald-500 checked:border-emerald-500", focus: "focus:border-emerald-500" },
  violet: { text: "text-violet-500", bg: "bg-violet-500", border: "border-violet-500", hover: "hover:bg-violet-500", hoverText: "hover:text-violet-500", checked: "checked:bg-violet-500 checked:border-violet-500", focus: "focus:border-violet-500" }
};

const catalogStructure: Record<string, any> = {
  "Construction Steel (የግንባታ ብረት)": { submenus: ["Turkish (ቱርክ)", "Local (ሀገር በቀል)"], types: ["Deformed Bar", "Plain Bar"], metrics: ["8mm", "10mm", "12mm", "14mm", "16mm", "20mm", "24mm"], colors: ["Standard Iron"] },
  "Roofing Iron Sheets (ቆርቆሮ)": { submenus: ["Standard (የተለመደ)", "EGA (ኢ.ጂ.ኤ)", "Tiles (ታይልስ)"], types: ["G-28", "G-32", "G-35"], metrics: ["Standard Length", "Custom Length"], colors: ["Unpainted", "Red", "Blue", "Green"] },
  "Tubular Steel Profiles (ቱቦና ፕሮፋይል ብረት)": { submenus: ["RHS", "CHS", "SHS", "Round Bar", "Flat Iron", "Angle Iron", "LTZ", "Sheet Metal"], types: ["Standard Duty", "Heavy Duty"], metrics: ["1mm", "1.2mm", "1.5mm", "2mm", "Custom"], colors: ["Standard Iron"] },
  "Ceiling Tiles (ኮርኒስ)": { submenus: ["PVC", "Armstrong", "Acoustic"], types: ["Standard", "Waterproof", "Fire Retardant"], metrics: ["60x60cm", "Custom"], colors: ["White", "Wood Grain", "Custom"] },
  "Timber (ጣውላ)": { submenus: ["Australia (አውስትራሊያ)", "Shashemene (ሻሸመኔ)"], types: ["Eucalyptus", "Pine", "Hardwood"], metrics: ["2x4", "2x3", "Custom"], colors: ["Natural Wood"] },
  "MDF Boards (ኤም ዲ ኤፍ)": { submenus: ["Laminated", "Raw"], types: ["Standard", "High Density"], metrics: ["1220x2440mm", "Custom"], colors: ["White", "Black", "Walnut", "Custom"] },
  "Gypsum Board (ጂፕሰም)": { submenus: ["Standard", "Moisture Resistant", "Fire Retardant"], types: ["Interior Grade", "Exterior Grade"], metrics: ["9mm", "12.5mm"], colors: ["White / Gray"] }
=======
import React, { useState, useEffect } from "react";
import { Menu, X, LayoutDashboard, Package, ShoppingCart, Settings, Palette, Lock, UploadCloud, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

// The Amharic Catalog Matrix
const catalogStructure: Record<string, any> = {
  "የግንባታ ብረት (Construction Steel)": { submenus: ["የሀገር ውስጥ", "የቱርክ ብረት"], types: ["Deformed Bar", "Plain Bar"], metrics: ["8mm", "10mm", "12mm"], colors: ["Standard Iron"] },
  "ቆርቆሮ (Roofing Iron)": { submenus: ["መደበኛ ቆርቆሮ", "ኤጋ ቆርቆሮ", "ታይልስ ቆርቆሮ"], types: ["G-28", "G-32"], metrics: ["Standard", "Custom"], colors: ["Red", "Green", "Blue"] },
  "ጂብሰም ቦርድ (Gypsum Board)": { submenus: ["የውሃ ስርገት የሚከላከል", "የድምፅ ስርገት የሚከላከል", "መገጣጠሚያዎች"], types: ["Interior", "Exterior"], metrics: ["9mm", "12.5mm"], colors: ["White"] },
  "የኮርኒስ ንጣፍ (Ceiling Boards)": { submenus: ["ፒ.ቪ.ሲ (PVC)", "አርምስትሮንግ (Armstrong)", "አኮስቲክ (Acoustic)"], types: ["Standard"], metrics: ["60x60cm"], colors: ["White", "Wood"] },
  "ጣውላ (Timber)": { submenus: ["አውስትራሊያ", "ሻሸመኔ"], types: ["Eucalyptus", "Pine"], metrics: ["2x4", "2x3"], colors: ["Natural"] },
  "MDF": { submenus: ["የተለጠፈ (Laminated)", "መደበኛ"], types: ["Standard", "High Density"], metrics: ["1220x2440mm"], colors: ["White", "Black"] },
  "ትቦላሬ (Tubular Profiles)": { submenus: ["RHS", "CHS", "SHS", "Round Bar", "Flat Iron", "Angle Iron", "LTZ", "ላሜራ"], types: ["Standard"], metrics: ["1mm", "2mm"], colors: ["Standard"] }
>>>>>>> 897b8485f2b00d59be677144965edc371517a93f
};

const themeColors = ["#6C63FF", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
<<<<<<< HEAD
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [activeTab, setActiveTab] = useState("deploy");
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [menu, setMenu] = useState("");
  const [submenu, setSubmenu] = useState("");
  const [materialType, setMaterialType] = useState("");
  const [color, setColor] = useState("");
  const [metric, setMetric] = useState("");

  const [settingsLoading, setSettingsLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  // Dynamic App Theme State
  const [appTheme, setAppTheme] = useState("amber");
  const tTheme = themeMap[appTheme] || themeMap.amber;

  useEffect(() => {
    const savedTheme = localStorage.getItem("amanzone_theme");
    if (savedTheme) setAppTheme(savedTheme);
  }, []);

  const handleSaveTheme = () => {
    localStorage.setItem("amanzone_theme", appTheme);
    alert("Global theme applied to Storefront & Admin. Refresh storefront to see changes.");
  };

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

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) setOrders(await res.json());
    } catch (err) { console.error("Order Sync Error", err); }
  };

  useEffect(() => { 
    if (isAuthenticated) { fetchInventory(); fetchOrders(); }
  }, [isAuthenticated]);

  useEffect(() => { setSubmenu(""); setMaterialType(""); setColor(""); setMetric(""); }, [menu]);

  const openCloudinary = () => {
    // @ts-ignore
    const widget = window.cloudinary.createUploadWidget(
      { cloudName: "dfqfcbgb3", uploadPreset: "amanzone_uploads" },
      (error: any, result: any) => { if (!error && result.event === "success") setImageUrl(result.info.secure_url); }
=======
  const [adminPass, setAdminPass] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [themeColor, setThemeColor] = useState("#6C63FF");
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full bg-[#12121A] flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-[#161622] rounded-3xl p-8 border border-gray-800">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Admin Access</h2>
          <input type="password" placeholder="Password" className="w-full p-4 rounded-xl bg-[#2A2A3D] text-white mb-4" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} />
          <button onClick={() => adminPass === "miracle" ? setIsAuthenticated(true) : showToast("Wrong Password", "error")} className="w-full py-3 bg-[#6C63FF] rounded-xl font-bold text-white">Login</button>
        </div>
      </div>
>>>>>>> 897b8485f2b00d59be677144965edc371517a93f
    );
    widget.open();
  };

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, price: parseFloat(price), menu, submenu, type: materialType, color, metric, description, imageUrl }),
      });
      if (res.ok) {
        alert("Deployed to Live Catalog!");
        setTitle(""); setPrice(""); setMenu(""); setSubmenu(""); setMaterialType(""); setColor(""); setMetric(""); setDescription(""); setImageUrl(""); 
        fetchInventory();
      } else alert("Database Error: Check your Firebase connection.");
    } catch (err) { alert("Deployment Failed."); }
    finally { setLoading(false); }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", password: currentPassword, newPassword: newPassword })
      });
      const data = await res.json();
      if (res.ok) { alert("Password updated securely!"); setCurrentPassword(""); setNewPassword(""); } 
      else alert(`Error: ${data.error}`);
    } catch (err) { alert("Failed to connect to server."); }
    finally { setSettingsLoading(false); }
  };

  if (!isAuthenticated) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl">
        <h1 className={`text-3xl font-black ${tTheme.text} mb-6 text-center`}>AMANZONE ADMIN</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="password" value={passwordInput} onChange={(e)=>setPasswordInput(e.target.value)} placeholder="Access Key..." className={`w-full bg-black border border-neutral-800 rounded-lg p-3 text-white outline-none ${tTheme.focus}`}/>
          <button type="submit" className={`w-full ${tTheme.bg} py-3 rounded-lg font-bold uppercase tracking-widest text-black`}>Unlock Node</button>
          {authError && <p className="text-red-500 text-xs text-center">{authError}</p>}
        </form>
      </div>
    </div>
  );

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-black text-neutral-100 flex font-sans">
      <aside className="w-64 bg-neutral-900 border-r border-neutral-800 p-6 space-y-8 hidden md:block">
        <h2 className={`text-xl font-black ${tTheme.text}`}>CONTROL PANEL</h2>
        <nav className="flex flex-col gap-2">
          {["deploy", "inventory", "orders", "settings"].map(tab => (
            <button key={tab} onClick={()=>setActiveTab(tab)} className={`text-left p-3 rounded-lg capitalize font-bold ${activeTab === tab ? `${tTheme.bg} text-black` : "text-neutral-500 hover:bg-neutral-800"}`}>{tab}</button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto w-full">
        <div className="flex gap-2 mb-6 md:hidden overflow-x-auto">
           {["deploy", "inventory", "orders", "settings"].map(tab => (
            <button key={tab} onClick={()=>setActiveTab(tab)} className={`px-4 py-2 rounded-lg capitalize text-sm font-bold ${activeTab === tab ? `${tTheme.bg} text-black` : "bg-neutral-900 text-neutral-500"}`}>{tab}</button>
          ))}
        </div>

        {activeTab === "deploy" && (
          <div className="max-w-3xl bg-neutral-900 p-6 md:p-8 rounded-xl border border-neutral-800 shadow-xl">
            <h3 className={`text-xl font-bold mb-6 border-b border-neutral-800 pb-4 ${tTheme.text} uppercase tracking-wider`}>New Material Deployment</h3>
            <form onSubmit={handleDeploy} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-500 font-bold mb-2">Product Title</label>
                  <input type="text" value={title} onChange={(e)=>setTitle(e.target.value)} required placeholder="e.g. 12mm Deformed Steel" className={`w-full bg-black p-3 border border-neutral-800 rounded-lg text-white outline-none ${tTheme.focus}`}/>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-500 font-bold mb-2">Price (ETB)</label>
                  <input type="number" value={price} onChange={(e)=>setPrice(e.target.value)} required placeholder="Price in Birr" className={`w-full bg-black p-3 border border-neutral-800 rounded-lg text-white outline-none ${tTheme.focus}`}/>
                </div>
              </div>

              <div className="bg-black/50 p-6 border border-neutral-800 rounded-xl space-y-4">
                <h4 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4">Classification Matrix</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">Main Category (Menu)</label>
                    <select value={menu} onChange={(e)=>setMenu(e.target.value)} required className={`w-full bg-neutral-900 p-3 border border-neutral-800 rounded-lg text-sm text-white outline-none ${tTheme.focus}`}>
                      <option value="">-- Select Category --</option>
                      {Object.keys(catalogStructure).map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">Sub Category</label>
                    <select value={submenu} onChange={(e)=>setSubmenu(e.target.value)} disabled={!menu} className={`w-full bg-neutral-900 p-3 border border-neutral-800 rounded-lg text-sm text-white outline-none disabled:opacity-50 ${tTheme.focus}`}>
                      <option value="">-- Select Submenu --</option>
                      {menu && catalogStructure[menu]?.submenus.map((sub: string) => <option key={sub} value={sub}>{sub}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">Type</label>
                    <select value={materialType} onChange={(e)=>setMaterialType(e.target.value)} disabled={!menu} className={`w-full bg-neutral-900 p-3 border border-neutral-800 rounded-lg text-sm text-white outline-none disabled:opacity-50 ${tTheme.focus}`}>
                      <option value="">-- Select Type --</option>
                      {menu && catalogStructure[menu]?.types?.map((type: string) => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">Color Variant</label>
                    <select value={color} onChange={(e)=>setColor(e.target.value)} disabled={!menu} className={`w-full bg-neutral-900 p-3 border border-neutral-800 rounded-lg text-sm text-white outline-none disabled:opacity-50 ${tTheme.focus}`}>
                      <option value="">-- Select Color --</option>
                      {menu && catalogStructure[menu]?.colors?.map((col: string) => <option key={col} value={col}>{col}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">Metric / Dimension</label>
                    <select value={metric} onChange={(e)=>setMetric(e.target.value)} disabled={!menu} className={`w-full bg-neutral-900 p-3 border border-neutral-800 rounded-lg text-sm text-white outline-none disabled:opacity-50 ${tTheme.focus}`}>
                      <option value="">-- Select Metric --</option>
                      {menu && catalogStructure[menu]?.metrics?.map((met: string) => <option key={met} value={met}>{met}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-500 font-bold mb-2">Specifications Note</label>
                <textarea rows={3} value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Enter full material specifications here..." className={`w-full bg-black p-3 border border-neutral-800 rounded-lg text-white outline-none ${tTheme.focus}`}></textarea>
              </div>

              <div>
                <button type="button" onClick={openCloudinary} className={`w-full bg-neutral-800 hover:bg-neutral-700 transition-colors p-4 rounded-lg border border-neutral-700 ${tTheme.text} font-bold text-sm uppercase tracking-widest shadow-inner`}>
                  Upload Media Asset via Cloudinary
                </button>
                {imageUrl && <p className="text-xs text-emerald-400 mt-2 font-mono">✓ Media Linked: {imageUrl}</p>}
              </div>

              <button type="submit" disabled={loading} className={`w-full ${tTheme.bg} hover:opacity-80 transition-colors p-4 rounded-lg font-black text-black uppercase tracking-widest mt-4 shadow-lg disabled:opacity-50`}>
                {loading ? "Deploying Node..." : "Deploy to Catalog"}
              </button>
            </form>
          </div>
        )}

        {activeTab === "inventory" && (
          <div className="max-w-4xl">
            <h3 className={`text-xl font-bold mb-6 border-b border-neutral-800 pb-4 ${tTheme.text} uppercase tracking-wider`}>Active Inventory</h3>
            <div className="grid grid-cols-1 gap-4">
              {products.map((prod) => (
                <div key={prod.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center shadow-md gap-4">
                  <div className="flex items-center gap-4">
                    {prod.imageUrl && <img src={prod.imageUrl} alt={prod.title} className="w-16 h-16 object-cover rounded-lg border border-neutral-800" />}
                    <div>
                      <h4 className="font-bold text-neutral-100 text-lg">{prod.title}</h4>
                      <p className="text-xs text-neutral-400 mt-1">{prod.menu} {prod.submenu && `➔ ${prod.submenu}`}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {prod.type && <span className="text-[10px] uppercase tracking-wider bg-neutral-800 px-2 py-1 rounded text-neutral-300">{prod.type}</span>}
                        {prod.metric && <span className="text-[10px] uppercase tracking-wider bg-neutral-800 px-2 py-1 rounded text-neutral-300">{prod.metric}</span>}
                        <span className={`text-[10px] uppercase tracking-wider ${tTheme.text} bg-neutral-800 px-2 py-1 rounded font-bold`}>{prod.price} ETB</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={async () => {
                    if(confirm("Confirm removal?")) { await fetch(`/api/inventory/${prod.id}`, { method: "DELETE" }); fetchInventory(); }
                  }} className="bg-red-950/40 hover:bg-red-950 text-red-400 border border-red-900/50 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors w-full md:w-auto">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === "orders" && (
           <div className="max-w-4xl">
             <h3 className={`text-xl font-bold mb-6 border-b border-neutral-800 pb-4 ${tTheme.text} uppercase tracking-wider`}>Active Orders</h3>
             {orders.length === 0 ? (
               <div className="bg-neutral-900 p-8 rounded-xl border border-neutral-800 text-center text-neutral-500">No active orders yet.</div>
             ) : (
               <div className="grid grid-cols-1 gap-6">
                 {orders.map((order) => (
                   <div key={order.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-md">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className={`font-bold ${tTheme.text} text-lg`}>{order.customer?.name || "Guest Customer"}</h4>
                          <p className="text-xs text-neutral-400 mt-1">
                            {order.customer?.phone} 
                            {order.customer?.company && order.customer?.company !== "N/A" && ` | ${order.customer?.company}`} 
                            {order.customer?.tin && order.customer?.tin !== "N/A" && ` | TIN: ${order.customer?.tin}`}
                          </p>
                          <p className="text-xs text-emerald-500 mt-1 border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 rounded inline-block">
                            {order.delivery?.method || "Store Pickup"}: {order.delivery?.address || "N/A"}
                          </p>
                        </div>
                        <span className={`text-[10px] font-bold px-3 py-1 rounded uppercase tracking-wider ${order.status === 'pending' || order.status === 'negotiation_requested' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="border-t border-neutral-800 pt-4 space-y-3">
                        {order.items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm items-center">
                            <span className="text-neutral-300"><span className={`${tTheme.text} font-bold mr-2`}>{item.quantity}x</span> {item.title || "Material"}</span>
                            <span className="text-neutral-500 text-xs">{item.price} ETB</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-neutral-800 mt-6 pt-4 flex justify-between items-center font-bold">
                        <span className="text-neutral-500 uppercase tracking-widest text-xs">Total Amount</span>
                        <span className={`${tTheme.text} text-xl`}>{order.total} ETB</span>
                      </div>
                   </div>
                 ))}
               </div>
             )}
           </div>
        )}

        {activeTab === "settings" && (
          <div className="max-w-3xl space-y-8">
            <div className="bg-neutral-900 p-8 rounded-xl border border-neutral-800 shadow-xl">
              <h3 className={`text-xl font-bold mb-6 border-b border-neutral-800 pb-4 ${tTheme.text} uppercase tracking-wider`}>Global Brand Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-500 font-bold mb-2">Global Color Theme</label>
                  <select value={appTheme} onChange={(e)=>setAppTheme(e.target.value)} className={`w-full bg-black p-3 border border-neutral-800 rounded-lg text-white outline-none ${tTheme.focus}`}>
                    <option value="amber">AmanZone Amber (Default)</option>
                    <option value="crimson">Industrial Crimson</option>
                    <option value="cobalt">Steel Cobalt</option>
                    <option value="emerald">Eco Emerald</option>
                    <option value="violet">Royal Violet</option>
                  </select>
                </div>
              </div>
              <button onClick={handleSaveTheme} className={`mt-6 ${tTheme.bg} text-black px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-wider hover:opacity-80 transition-colors`}>
                Save & Broadcast Theme
              </button>
            </div>

            <div className="bg-neutral-900 p-8 rounded-xl border border-neutral-800 shadow-xl">
              <h3 className={`text-xl font-bold mb-6 border-b border-neutral-800 pb-4 ${tTheme.text} uppercase tracking-wider`}>Security Control</h3>
              <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-500 font-bold mb-2">Current Access Key</label>
                  <input type="password" value={currentPassword} onChange={(e)=>setCurrentPassword(e.target.value)} required className={`w-full bg-black p-3 border border-neutral-800 rounded-lg text-white outline-none ${tTheme.focus}`}/>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-500 font-bold mb-2">New Access Key</label>
                  <input type="password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} required className={`w-full bg-black p-3 border border-neutral-800 rounded-lg text-white outline-none ${tTheme.focus}`}/>
                </div>
                <button type="submit" disabled={settingsLoading} className={`${tTheme.bg} hover:opacity-80 text-black px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors disabled:opacity-50`}>
                  {settingsLoading ? "Updating..." : "Update Security Key"}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
=======
    <div className="flex h-screen bg-[#12121A] text-white">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-[#161622] p-4 flex justify-between items-center z-50 border-b border-gray-800">
        <span className="font-bold">AmanZone Admin</span>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>{isSidebarOpen ? <X /> : <Menu />}</button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed md:relative z-40 w-64 h-full bg-[#161622] p-6 border-r border-gray-800 transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <nav className="space-y-4 mt-16 md:mt-0">
          <NavItem active={activeTab === 'dashboard'} icon={<LayoutDashboard size={20}/>} label="Dashboard" onClick={() => setActiveTab('dashboard')} />
          <NavItem active={activeTab === 'inventory'} icon={<Package size={20}/>} label="Inventory" onClick={() => setActiveTab('inventory')} />
          <NavItem active={activeTab === 'settings'} icon={<Settings size={20}/>} label="Settings" onClick={() => setActiveTab('settings')} />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 pt-24 md:pt-10">
        {activeTab === 'settings' && (
          <div className="space-y-8 animate-in fade-in">
            <h2 className="text-3xl font-bold">Settings</h2>
            <div className="bg-[#1E1E2C] p-6 rounded-2xl">
              <label className="text-sm text-gray-400 mb-4 block">Select UI Accent Color</label>
              <div className="flex gap-4">
                {themeColors.map(c => (
                  <button key={c} onClick={() => setThemeColor(c)} className={`w-10 h-10 rounded-full ${themeColor === c ? 'ring-2 ring-white' : ''}`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <button className="px-6 py-3 bg-[#6C63FF] rounded-xl font-bold" onClick={() => showToast("Settings Updated", "success")}>Save Preferences</button>
          </div>
        )}
        {/* Add your Dashboard/Inventory content here */}
      </main>
      
      {/* Notifications */}
      {notification && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-xl ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {notification.msg}
        </div>
      )}
>>>>>>> 897b8485f2b00d59be677144965edc371517a93f
    </div>
  );
}

function NavItem({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3 w-full p-3 rounded-xl ${active ? 'bg-white/10 text-white' : 'text-gray-500'}`}>
      {icon} {label}
    </button>
  );
}
