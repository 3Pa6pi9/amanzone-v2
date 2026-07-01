"use client";

import React, { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, updateDoc, doc, query, orderBy } from "firebase/firestore";
import { 
  Package, Plus, Edit2, Trash2, X, Search, Activity, 
  Box, Settings, Save, Loader2, CheckCircle2, Image as ImageIcon, AlertTriangle,
  TrendingUp, Truck, MapPin, Phone, User, FileText, ChevronRight, UploadCloud, Building2, ChevronDown, Menu
} from "lucide-react";

// ... [initialFormState and other logic remain the same] ...

export default function AdminCommandCenter() {
  const [activeTab, setActiveTab] = useState("inventory");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // ... [Keep all your existing states, useEffects, and functions] ...

  return (
    <div className="flex min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30">
      
      {/* MOBILE TOP NAV (Visible only on mobile) */}
      <div className="lg:hidden fixed top-0 w-full z-50 bg-[#0A0A0F] border-b border-white/10 p-4 flex justify-between items-center">
        <div className="flex items-center gap-2 font-black text-emerald-400 text-lg">
          <Box size={20} /> AMANZONE ADMIN
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-white/5 rounded-lg">
          <Menu size={24} />
        </button>
      </div>

      {/* SIDEBAR (Desktop: Fixed, Mobile: Slide-in overlay) */}
      <aside className={`fixed lg:left-0 h-full w-64 border-r border-white/10 bg-[#0A0A0F] z-40 transition-transform lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0 pt-20' : '-translate-x-full'}`}>
        {/* ... [Your Sidebar code from before] ... */}
      </aside>

      {/* MAIN CONTENT AREA (Add top padding for mobile) */}
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 pt-24 lg:pt-8">
        
        {/* Responsive Grid for Inventory Table */}
        <div className="bg-[#0A0A0F] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          {/* Mobile view of the table uses card-based layout, Desktop uses Grid */}
          <div className="hidden lg:grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-[10px] font-bold uppercase tracking-widest opacity-50 bg-black/50">
            {/* Headers... */}
          </div>
          
          <div className="divide-y divide-white/5">
            {filteredProducts.map((product) => (
              <div key={product.id} className="grid grid-cols-1 lg:grid-cols-12 gap-2 p-4 items-center hover:bg-white/5 transition-colors">
                {/* Mobile View: Stacked Card Look */}
                <div className="col-span-12 lg:col-span-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-black overflow-hidden flex-shrink-0">
                    <img src={product.imageUrl} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-bold">{product.title}</p>
                    <p className="text-xs opacity-50">{product.warehouse} • Stock: {product.stock}</p>
                  </div>
                </div>

                {/* Desktop Specific Grid Layout */}
                <div className="hidden lg:block lg:col-span-3 text-xs opacity-50">{product.menu}</div>
                <div className="hidden lg:block lg:col-span-2 font-bold text-emerald-400">{product.price} ETB</div>
                
                {/* Action buttons (Bigger touch targets for mobile) */}
                <div className="col-span-12 lg:col-span-3 flex justify-end gap-3 pt-4 lg:pt-0">
                   <button onClick={() => openEditMenu(product)} className="px-6 py-2 bg-blue-500/10 text-blue-400 rounded-lg text-sm font-bold w-full lg:w-auto">Edit</button>
                   <button onClick={() => handleDelete(product.id)} className="px-6 py-2 bg-red-500/10 text-red-400 rounded-lg text-sm font-bold w-full lg:w-auto">Purge</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
