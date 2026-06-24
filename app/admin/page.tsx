"use client";

import React, { useState, useEffect } from "react";
import { Menu, X, LayoutDashboard, Package, Settings, Loader2 } from "lucide-react";

// The Amharic Catalog Matrix
const catalogStructure: Record<string, any> = {
  "የግንባታ ብረት (Construction Steel)": { submenus: ["የሀገር ውስጥ", "የቱርክ ብረት"], types: ["Deformed Bar", "Plain Bar"], metrics: ["8mm", "10mm", "12mm"], colors: ["Standard Iron"] },
  "ቆርቆሮ (Roofing Iron)": { submenus: ["መደበኛ ቆርቆሮ", "ኤጋ ቆርቆሮ", "ታይልስ ቆርቆሮ"], types: ["G-28", "G-32"], metrics: ["Standard", "Custom"], colors: ["Red", "Green", "Blue"] },
  "ጂብሰም ቦርድ (Gypsum Board)": { submenus: ["የውሃ ስርገት የሚከላከል", "የድምፅ ስርገት የሚከላከል", "መገጣጠሚያዎች"], types: ["Interior", "Exterior"], metrics: ["9mm", "12.5mm"], colors: ["White"] },
  "የኮርኒስ ንጣፍ (Ceiling Boards)": { submenus: ["ፒ.ቪ.ሲ (PVC)", "አርምስትሮንግ (Armstrong)", "አኮስቲክ (Acoustic)"], types: ["Standard"], metrics: ["60x60cm"], colors: ["White", "Wood"] },
  "ጣውላ (Timber)": { submenus: ["አውስትራሊያ", "ሻሸመኔ"], types: ["Eucalyptus", "Pine"], metrics: ["2x4", "2x3"], colors: ["Natural"] },
  "MDF": { submenus: ["የተለጠፈ (Laminated)", "መደበኛ"], types: ["Standard", "High Density"], metrics: ["1220x2440mm"], colors: ["White", "Black"] },
  "ትቦላሬ (Tubular Profiles)": { submenus: ["RHS", "CHS", "SHS", "Round Bar", "Flat Iron", "Angle Iron", "LTZ", "ላሜራ"], types: ["Standard"], metrics: ["1mm", "2mm"], colors: ["Standard"] }
};

const themeColors = ["#6C63FF", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [themeColor, setThemeColor] = useState("#6C63FF");
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // Form states for adding items
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [menu, setMenu] = useState("");
  const [submenu, setSubmenu] = useState("");
  const [materialType, setMaterialType] = useState("");
  const [color, setColor] = useState("");
  const [metric, setMetric] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // Settings states
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const showToast = (msg: string, type: 'success' | 'error') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, price: parseFloat(price), menu, submenu, type: materialType, color, metric, description, imageUrl }),
      });
      if (res.ok) {
        showToast("Deployed to Live Catalog!", "success");
        setTitle(""); setPrice(""); setMenu(""); setSubmenu(""); setMaterialType(""); setColor(""); setMetric(""); setDescription(""); setImageUrl(""); 
      } else showToast("Database Error: Check connection.", "error");
    } catch (err) { showToast("Deployment Failed.", "error"); }
    finally { setLoading(false); }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", password: currentPassword, newPassword: newPassword })
      });
      const data = await res.json();
      if (res.ok) { 
        showToast("Password updated securely!", "success"); 
        setCurrentPassword(""); 
        setNewPassword(""); 
      } else {
        showToast(`Error: ${data.error}`, "error");
      }
    } catch (err) { showToast("Failed to connect to server.", "error"); }
    finally { setSettingsLoading(false); }
  };

  // Single clean Login Screen
  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full bg-[#12121A] flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-[#161622] rounded-3xl p-8 border border-gray-800">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Admin Access</h2>
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full p-4 rounded-xl bg-[#2A2A3D] text-white mb-4 outline-none border border-transparent focus:border-[#6C63FF]" 
            value={adminPass} 
            onChange={(e) => setAdminPass(e.target.value)} 
          />
          <button 
            onClick={() => adminPass === "miracle" ? setIsAuthenticated(true) : showToast("Wrong Password", "error")} 
            className="w-full py-3 bg-[#6C63FF] rounded-xl font-bold text-white hover:bg-[#5a52d9] transition"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
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
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">Dashboard</h2>
            <p className="text-gray-400">Welcome to your store control node.</p>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Deploy New Inventory Material</h2>
            <form onSubmit={handleDeploy} className="max-w-xl space-y-4 bg-[#161622] p-6 rounded-2xl border border-gray-800">
              <input type="text" placeholder="Material Item Title" value={title} onChange={e=>setTitle(e.target.value)} className="w-full p-3 rounded-lg bg-[#2A2A3D] text-white outline-none" required />
              <input type="number" placeholder="Price (ETB)" value={price} onChange={e=>setPrice(e.target.value)} className="w-full p-3 rounded-lg bg-[#2A2A3D] text-white outline-none" required />
              <button type="submit" disabled={loading} className="px-6 py-3 bg-[#6C63FF] rounded-xl font-bold flex items-center gap-2">
                {loading && <Loader2 className="animate-spin" size={18} />} Deploy Material
              </button>
            </form>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8 animate-in fade-in">
            <h2 className="text-3xl font-bold">Settings</h2>
            <div className="bg-[#1E1E2C] p-6 rounded-2xl border border-gray-800">
              <label className="text-sm text-gray-400 mb-4 block">Select UI Accent Color</label>
              <div className="flex gap-4">
                {themeColors.map(c => (
                  <button key={c} onClick={() => setThemeColor(c)} className={`w-10 h-10 rounded-full ${themeColor === c ? 'ring-2 ring-white' : ''}`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>

            <div className="bg-[#1E1E2C] p-6 rounded-2xl border border-gray-800 space-y-4">
              <h3 className="text-xl font-bold">Update Master Key</h3>
              <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-sm">
                <input type="password" placeholder="Current Password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} className="w-full p-3 rounded-lg bg-[#2A2A3D] text-white outline-none" required />
                <input type="password" placeholder="New Password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="w-full p-3 rounded-lg bg-[#2A2A3D] text-white outline-none" required />
                <button type="submit" disabled={settingsLoading} className="px-6 py-3 bg-red-600 rounded-xl font-bold">Update Key</button>
              </form>
            </div>
          </div>
        )}
      </main>
      
      {/* Notifications */}
      {notification && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-xl z-50 ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {notification.msg}
        </div>
      )}
    </div>
  );
}

function NavItem({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3 w-full p-3 rounded-xl transition ${active ? 'bg-white/10 text-white font-bold' : 'text-gray-400 hover:bg-white/5'}`}>
      {icon} {label}
    </button>
  );
}