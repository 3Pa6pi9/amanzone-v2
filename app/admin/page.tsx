'use client';

import React, { useState, useEffect } from 'react';
import { Package, Clock, PlusCircle, Upload, Lock, Settings, Key, Image as ImageIcon, Palette, LogOut, LayoutTemplate } from 'lucide-react';

const categoryDictionary: Record<string, { subCategories: string[], units: string[] }> = {
  "የግንባታ ብረት (Construction Steel)": { subCategories: ["የሀገር ውስጥ (Local)", "የቱርክ ብረት (Turkish)"], units: ["kg", "tons", "pcs"] },
  "ቆርቆሮ (Roofing Iron)": { subCategories: ["መደበኛ ቆርቆሮ", "ኤጋ ቆርቆሮ", "ታይልስ ቆርቆሮ"], units: ["pcs", "m"] },
  "ጂብሰም ቦርድ (Gypsum Board)": { subCategories: ["የውሃ ስርገት የሚከላከል", "የድምፅ ስርገት የሚከላከል", "መገጣጠሚያዎች"], units: ["pcs", "m²"] },
  "የኮርኒስ ንጣፍ (Ceiling)": { subCategories: ["ፒ.ቪ.ሲ (PVC)", "Armstrong (አርምስትሮንግ)", "Acrostic (አኮስቲክ)", "መገጣጠሚያዎች"], units: ["pcs", "m²", "box"] },
  "ጣውላ (Timber)": { subCategories: ["አውስትራሊያ", "ሻሸመኔ"], units: ["pcs", "m³", "m"] },
  "MDF": { subCategories: ["የተለጠፈ (Laminated)", "መደበኛ (Standard)"], units: ["pcs", "m²"] },
  "ትቦላሬ (Tubular & Profiles)": { subCategories: ["RHS (Rectangular Hallow Section)", "CHS (Circular Hallow Section)", "SHS (Square Hallow Section)", "ቶንዲኖ (Round Bar)", "ፊያቶ (Flat Iron)", "አንግል (Angle Iron)", "ኤል.ቲ.ዜድ (LTZ)", "ላሜራ (Sheet Metal)"], units: ["pcs", "kg", "m"] }
};

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'INVENTORY' | 'ORDERS' | 'SETTINGS'>('INVENTORY');
  
  const [orders, setOrders] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  // Settings State
  const [theme, setTheme] = useState('orange');
  const [layout, setLayout] = useState('grid');
  
  const [newItem, setNewItem] = useState({
    name: "", category: "የግንባታ ብረት (Construction Steel)", subCategory: "የሀገር ውስጥ (Local)",
    type: "", color: "", price: "", stock: "", unit: "kg", status: "Standard"
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetch('/api/orders').then(res => res.json()).then(data => setOrders(Array.isArray(data) ? data : []));
      fetch('/api/inventory').then(res => res.json()).then(data => setInventory(Array.isArray(data) ? data : []));
      
      setTheme(localStorage.getItem('az_theme') || 'orange');
      setLayout(localStorage.getItem('az_layout') || 'grid');
    }
  }, [isAuthenticated]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCat = e.target.value;
    setNewItem({ ...newItem, category: selectedCat, subCategory: categoryDictionary[selectedCat].subCategories[0], unit: categoryDictionary[selectedCat].units[0] });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) setIsAuthenticated(true);
    else alert("Incorrect admin password.");
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert("Please select a product image.");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

      const cloudinaryRes = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
      const cloudinaryData = await cloudinaryRes.json();
      
      if (!cloudinaryData.secure_url) throw new Error("Image upload failed. Check Cloudinary settings.");

      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newItem, image: cloudinaryData.secure_url }),
      });

      if (response.ok) {
        alert("Success: Product added to AmanZone Catalog!");
        setNewItem({ ...newItem, name: "", price: "", stock: "", type: "", color: "" });
        setFile(null);
        fetch('/api/inventory').then(res => res.json()).then(data => setInventory(Array.isArray(data) ? data : [])); 
      } else {
        throw new Error("Firebase rejected the data.");
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('az_theme', newTheme);
  };
  const updateLayout = (newLayout: string) => {
    setLayout(newLayout);
    localStorage.setItem('az_layout', newLayout);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center p-6 text-white font-sans selection:bg-orange-500">
        <div className="bg-[#161616] p-10 rounded-3xl border border-white/10 w-full max-w-md shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-3xl rounded-full"></div>
          <div className="flex justify-center mb-6"><Lock size={40} className="text-orange-500" /></div>
          <h2 className="text-3xl font-black text-center italic tracking-tighter mb-8">AMANZONE <span className="text-orange-500">ADMIN</span></h2>
          <form onSubmit={handleLogin} className="space-y-4 relative z-10">
            <input type="password" placeholder="Master Terminal Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black border border-white/10 p-4 rounded-xl outline-none focus:border-orange-500 transition font-mono" />
            <button type="submit" className="w-full bg-orange-500 text-black font-black py-4 rounded-xl uppercase tracking-widest hover:bg-orange-600 transition">Unlock Terminal</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0b0b0b] text-white min-h-screen p-6 md:p-10 font-sans selection:bg-orange-500">
      
      {/* HEADER & TABS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 border-b border-white/5 pb-6 sticky top-0 bg-[#0b0b0b]/90 backdrop-blur-md z-50 pt-4">
        <h1 className="text-3xl md:text-4xl font-black text-orange-500 italic uppercase tracking-tighter">AmanZone Control</h1>
        <div className="flex gap-2 bg-[#161616] p-1.5 rounded-2xl border border-white/10 overflow-x-auto w-full md:w-auto">
          <button onClick={() => setActiveTab('INVENTORY')} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition ${activeTab === 'INVENTORY' ? 'bg-orange-500 text-black' : 'text-gray-400 hover:text-white'}`}><Package size={16}/> Inventory</button>
          <button onClick={() => setActiveTab('ORDERS')} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition ${activeTab === 'ORDERS' ? 'bg-orange-500 text-black' : 'text-gray-400 hover:text-white'}`}><Clock size={16}/> Orders</button>
          <button onClick={() => setActiveTab('SETTINGS')} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition ${activeTab === 'SETTINGS' ? 'bg-orange-500 text-black' : 'text-gray-400 hover:text-white'}`}><Settings size={16}/> Settings</button>
        </div>
        <button onClick={() => setIsAuthenticated(false)} className="text-gray-500 hover:text-white flex items-center gap-2 text-xs uppercase tracking-widest transition"><LogOut size={16}/> Logout</button>
      </div>
      
      <div className="max-w-7xl mx-auto">
        
        {/* ================= INVENTORY TAB ================= */}
        {/* ================= INVENTORY TAB ================= */}
        
        {activeTab === 'INVENTORY' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
            <div className="xl:col-span-4 bg-[#161616] p-8 rounded-[2rem] border border-white/5 sticky top-32">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <PlusCircle className="text-orange-500"/> {newItem.id ? "EDIT PRODUCT" : "ADD STOCK"}
              </h2>
              
              {/* Form implementation remains the same, just update handleUpload logic */}
              <form onSubmit={handleUpload} className="space-y-5">
                {/* ... (Keep your existing form inputs here) ... */}
                
                {/* Image Input (Make it optional if editing) */}
                <div className="grid grid-cols-2 gap-4 items-end mt-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 ml-2">Placement</label>
                    <select value={newItem.status} onChange={e => setNewItem({...newItem, status: e.target.value})} className="w-full bg-black border border-white/10 p-4 rounded-xl mt-1 text-sm outline-none text-orange-500 font-bold">
                        <option>Standard</option><option>Featured</option><option>Discounted</option>
                    </select>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 ml-2 mb-1">{newItem.id ? "Upload to replace image" : "Product Image"}</p>
                    <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full bg-black border border-white/10 p-3 rounded-xl text-[10px] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white file:text-black file:font-bold cursor-pointer" />
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button disabled={loading} type="submit" className="flex-1 bg-orange-500 text-black font-black py-4 rounded-xl hover:bg-orange-600 transition uppercase tracking-widest text-xs">
                    {loading ? "Processing..." : (newItem.id ? "Save Changes" : "Deploy")}
                  </button>
                  {newItem.id && (
                    <button type="button" onClick={() => {
                        setNewItem({ name: "", category: "የግንባታ ብረት (Construction Steel)", subCategory: "የሀገር ውስጥ (Local)", type: "", color: "", price: "", stock: "", unit: "kg", status: "Standard" });
                        setFile(null);
                    }} className="px-4 bg-gray-800 text-white rounded-xl text-xs font-bold hover:bg-gray-700">Cancel</button>
                  )}
                </div>
              </form>
            </div>
            
            <div className="xl:col-span-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3"><Package className="text-orange-500"/> LIVE DATABANK</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {inventory.length === 0 ? <p className="text-gray-500">Catalog is empty.</p> : inventory.map((item: any) => (
                  <div key={item.id} className="bg-[#161616] p-5 rounded-2xl border border-white/5 hover:border-orange-500/30 transition flex flex-col justify-between group relative overflow-hidden">
                    {/* NEW: Edit and Delete Buttons */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <button onClick={() => setNewItem(item)} className="bg-blue-500 text-white text-[10px] px-2 py-1 rounded font-bold">Edit</button>
                      <button onClick={async () => {
                        if(confirm("Are you sure you want to delete this product?")) {
                          await fetch(`/api/inventory/${item.id}`, { method: 'DELETE' });
                          fetch('/api/inventory').then(res=>res.json()).then(setInventory);
                        }
                      }} className="bg-red-500 text-white text-[10px] px-2 py-1 rounded font-bold">Del</button>
                    </div>

                    {item.status === "Featured" && <div className="absolute top-0 left-0 bg-orange-500 text-black text-[8px] font-black px-2 py-1 rounded-br-lg uppercase tracking-widest">Featured</div>}
                    
                    <div className="mt-4">
                      <span className="text-[8px] bg-black px-2 py-1 rounded-md text-orange-500 uppercase tracking-widest border border-white/5 mb-2 inline-block max-w-full truncate">
                        {item.category.split(' ')[0]} / {item.subCategory.split(' ')[0]}
                      </span>
                      <p className="font-bold text-sm leading-tight mt-1">{item.name}</p>
                    </div>
                    <div className="mt-4 flex justify-between items-end border-t border-white/5 pt-4">
                      <p className="text-orange-500 font-mono text-sm font-bold">{item.price} ETB</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">{item.stock} {item.unit}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

            
            <div className="xl:col-span-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3"><Package className="text-orange-500"/> LIVE DATABANK</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {inventory.length === 0 ? <p className="text-gray-500 text-sm p-4 col-span-3">Catalog is empty.</p> : inventory.map((item: any) => (
                  <div key={item.id} className="bg-[#161616] p-5 rounded-2xl border border-white/5 hover:border-orange-500/30 transition flex flex-col justify-between group relative overflow-hidden">
                    {item.status === "Featured" && <div className="absolute top-0 right-0 bg-orange-500 text-black text-[8px] font-black px-2 py-1 rounded-bl-lg uppercase tracking-widest">Featured</div>}
                    <div>
                      <span className="text-[8px] bg-black px-2 py-1 rounded-md text-orange-500 uppercase tracking-widest border border-white/5 mb-2 inline-block max-w-full truncate">
                        {item.category.split(' ')[0]} / {item.subCategory.split(' ')[0]}
                      </span>
                      <p className="font-bold text-sm leading-tight mt-1">{item.name}</p>
                    </div>
                    <div className="mt-4 flex justify-between items-end border-t border-white/5 pt-4">
                      <p className="text-orange-500 font-mono text-sm font-bold">{item.price} ETB</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">{item.stock} {item.unit}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= ORDERS TAB ================= */}
        {activeTab === 'ORDERS' && (
          <div className="max-w-6xl mx-auto">
             <h2 className="text-2xl font-bold mb-6 flex items-center gap-3"><Clock className="text-orange-500"/> INCOMING DISPATCH REQUESTS</h2>
             
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {orders.length === 0 ? <p className="text-gray-500 p-6 bg-[#161616] rounded-3xl border border-white/5">No active orders right now.</p> : orders.map((order: any) => (
                <div key={order.id} className={`flex flex-col p-8 rounded-[2.5rem] border ${order.type === 'OFFICIAL' ? 'border-orange-500/40 bg-gradient-to-b from-orange-500/5 to-transparent' : 'border-white/10 bg-[#161616]'}`}>
                  
                  {/* Order Header: Price & Type */}
                  <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-6">
                    <div>
                        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase ${order.type === 'OFFICIAL' ? 'bg-orange-500 text-black' : 'bg-white/10 text-white'}`}>{order.type} ORDER</span>
                        <p className="text-xs text-gray-500 mt-3 font-mono">{new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-mono text-orange-500 font-black text-2xl">{Number(order.total || 0).toLocaleString()} ETB</p>
                        {order.type === 'OFFICIAL' && <p className="text-[10px] text-gray-500 mt-1 uppercase">Includes {Number(order.vat || 0).toLocaleString()} ETB VAT</p>}
                    </div>
                  </div>

                  {/* Client Data Block */}
                  <div className="bg-black/40 p-5 rounded-2xl border border-white/5 mb-6 space-y-3">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Client Logistics Info</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-gray-400">Name</p>
                            <p className="text-sm font-bold">{order.client?.name || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Phone</p>
                            <p className="text-sm font-bold">{order.client?.phone || 'N/A'}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-xs text-gray-400">Delivery Address</p>
                            <p className="text-sm font-bold">{order.client?.address || 'N/A'}</p>
                        </div>
                        {order.client?.tin && (
                            <div className="col-span-2 border-t border-white/10 pt-3 mt-1">
                                <p className="text-xs text-orange-500">Corporate TIN: <span className="font-bold text-white">{order.client.tin}</span></p>
                            </div>
                        )}
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="flex-1 space-y-2">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">Required Materials ({order.items?.length || 0} items)</p>
                    {Array.isArray(order.items) && order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-sm bg-white/5 p-3 rounded-xl border border-white/5">
                        <div className="flex gap-3 items-center">
                            <span className="bg-black text-white px-2 py-1 rounded-md text-[10px] font-bold">{item.qty || 1}x</span>
                            <span className="font-bold text-gray-300">{item.name}</span>
                        </div>
                        <span className="text-orange-500 font-mono text-xs">{((item.price || 0) * (item.qty || 1)).toLocaleString()} ETB</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="mt-6 pt-6 border-t border-white/5 flex gap-3">
                    <button className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl text-xs font-bold transition">Mark as Processed</button>
                    {order.client?.phone && <a href={`tel:${order.client.phone}`} className="flex-1 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-500 text-center py-3 rounded-xl text-xs font-bold transition flex items-center justify-center">Call Client</a>}
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= SETTINGS TAB ================= */}
        {activeTab === 'SETTINGS' && (
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-8">
              <div className="bg-[#161616] p-8 rounded-[2.5rem] border border-white/5">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3"><Palette className="text-orange-500"/> CLIENT UI THEME</h3>
                <p className="text-xs text-gray-400 mb-4">Change the primary accent color for the public-facing storefront.</p>
                <div className="flex gap-4">
                  <button onClick={() => updateTheme('orange')} className={`w-12 h-12 rounded-full bg-orange-500 transition ${theme === 'orange' ? 'ring-4 ring-white/30 scale-110' : 'hover:scale-110'}`}></button>
                  <button onClick={() => updateTheme('blue')} className={`w-12 h-12 rounded-full bg-blue-500 transition ${theme === 'blue' ? 'ring-4 ring-white/30 scale-110' : 'hover:scale-110'}`}></button>
                  <button onClick={() => updateTheme('green')} className={`w-12 h-12 rounded-full bg-green-500 transition ${theme === 'green' ? 'ring-4 ring-white/30 scale-110' : 'hover:scale-110'}`}></button>
                </div>
              </div>

              <div className="bg-[#161616] p-8 rounded-[2.5rem] border border-white/5">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3"><LayoutTemplate className="text-orange-500"/> CLIENT UI LAYOUT</h3>
                <p className="text-xs text-gray-400 mb-4">Choose how the product catalog is displayed to customers.</p>
                <div className="flex gap-4">
                  <button onClick={() => updateLayout('grid')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition ${layout === 'grid' ? 'bg-white text-black' : 'bg-black border border-white/10'}`}>Grid View</button>
                  <button onClick={() => updateLayout('list')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition ${layout === 'list' ? 'bg-white text-black' : 'bg-black border border-white/10'}`}>List View</button>
                </div>
              </div>
            </div>

            <div className="bg-[#161616] p-8 rounded-[2.5rem] border border-white/5 h-fit">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3"><Key className="text-orange-500"/> SECURITY & AUTH</h3>
              <p className="text-xs text-gray-400 mb-6 leading-relaxed">Your master password is currently secured in the server-side environment variables.</p>
              <div className="space-y-4 opacity-50 cursor-not-allowed grayscale">
                <input disabled type="password" placeholder="Current Password" className="w-full bg-black border border-white/10 p-4 rounded-xl text-sm outline-none" />
                <input disabled type="password" placeholder="New Password" className="w-full bg-black border border-white/10 p-4 rounded-xl text-sm outline-none" />
                <button disabled className="w-full bg-white text-black font-black py-4 rounded-xl uppercase tracking-widest text-xs">Update Credentials</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}