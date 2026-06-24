"use client";

import React from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { ShoppingCart, PhoneCall, ArrowRight } from "lucide-react";

export default function ClientStorefront() {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#12121A] flex flex-col">
      {/* Sticky Navbar */}
      <header className="sticky top-0 z-50 bg-[#161622] border-b border-gray-800 px-6 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#6C63FF] rounded-lg flex items-center justify-center font-bold">
            AZ
          </div>
          <h1 className="text-xl font-bold tracking-wide">AmanZone</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-300">
            <a href="#products" className="hover:text-[#6C63FF] transition">{t("Products", "ምርቶች")}</a>
            <a href="#about" className="hover:text-[#6C63FF] transition">{t("About Us", "ስለ እኛ")}</a>
            <a href="#contact" className="hover:text-[#6C63FF] transition">{t("Contact", "አድራሻ")}</a>
          </nav>

          {/* Language Toggle Button */}
          <button 
            onClick={toggleLanguage}
            className="px-4 py-2 bg-[#1E1E2C] border border-gray-700 rounded-lg text-sm font-bold hover:bg-gray-800 transition"
          >
            {language === "EN" ? "አማርኛ" : "English"}
          </button>

          <button className="relative p-2 text-gray-300 hover:text-white transition">
            <ShoppingCart size={24} />
            <span className="absolute top-0 right-0 w-4 h-4 bg-amber-500 text-black text-xs font-bold flex items-center justify-center rounded-full">
              0
            </span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 px-6 py-16 md:py-32 max-w-7xl mx-auto w-full flex flex-col items-center text-center">
        <h2 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
          {t("Build with ", "በ ")}
          <span className="text-[#6C63FF]">{t("Confidence.", "ሙሉ እምነት ይገንቡ።")}</span>
        </h2>
        
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10">
          {t(
            "Premium construction materials, from Turkish steel to roofing iron, delivered directly to your site with complete reliability.", 
            "ከቱርክ ብረት እስከ መደበኛ ቆርቆሮ ያሉ ከፍተኛ ጥራት ያላቸውን የግንባታ እቃዎች፣ በቀጥታ ወደ ግንባታ ቦታዎ በታማኝነት እናደርሳለን።"
          )}
        </p>

        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <button className="flex items-center justify-center gap-2 px-8 py-4 bg-[#6C63FF] text-white font-bold rounded-xl hover:bg-[#5a52d9] transition">
            {t("View Catalog", "ካታሎግ ይመልከቱ")} <ArrowRight size={20} />
          </button>
          
          <button className="flex items-center justify-center gap-2 px-8 py-4 bg-[#1E1E2C] text-white font-bold rounded-xl border border-gray-700 hover:bg-gray-800 transition">
            <PhoneCall size={20} /> {t("Request Quote", "ዋጋ ይጠይቁ")}
          </button>
        </div>
      </main>
    </div>
  );
}