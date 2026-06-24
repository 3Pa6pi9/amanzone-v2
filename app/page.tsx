"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/lib/Providers";
import { ShoppingCart, PhoneCall, ArrowRight, Loader2, PackageSearch } from "lucide-react";

export default function ClientStorefront() {
  const { language, toggleLanguage, t } = useLanguage();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch products from the database when the page loads
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await fetch("/api/inventory");
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (error) {
        console.error("Failed to load inventory:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  return (
    <div className="min-h-screen flex flex-col scroll-smooth">
      {/* Sticky Navbar */}
      <header className="sticky top-0 z-40 px-6 py-4 flex justify-between items-center shadow-md border-b"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white"
               style={{ backgroundColor: 'var(--accent)' }}>
            AZ
          </div>
          <h1 className="text-xl font-bold tracking-wide">AmanZone</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex gap-6 text-sm font-medium">
            <a href="#products" className="hover:opacity-70 transition">{t("Products", "ምርቶች")}</a>
            <a href="#contact" className="hover:opacity-70 transition">{t("Contact", "አድራሻ")}</a>
          </nav>

          {/* Language Toggle */}
          <button 
            onClick={toggleLanguage}
            className="px-4 py-2 border rounded-lg text-sm font-bold hover:opacity-80 transition"
            style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}
          >
            {language === "EN" ? "አማርኛ" : "English"}
          </button>

          <button className="relative p-2 hover:opacity-80 transition">
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
          <span style={{ color: 'var(--accent)' }}>{t("Confidence.", "ሙሉ እምነት ይገንቡ።")}</span>
        </h2>
        
        <p className="text-lg md:text-xl max-w-2xl mb-10" style={{ color: 'var(--text-muted)' }}>
          {t(
            "Premium construction materials, from Turkish steel to roofing iron, delivered directly to your site with complete reliability.", 
            "ከቱርክ ብረት እስከ መደበኛ ቆርቆሮ ያሉ ከፍተኛ ጥራት ያላቸውን የግንባታ እቃዎች፣ በቀጥታ ወደ ግንባታ ቦታዎ በታማኝነት እናደርሳለን።"
          )}
        </p>

        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <a href="#products" 
             className="flex items-center justify-center gap-2 px-8 py-4 text-white font-bold rounded-xl transition hover:opacity-90"
             style={{ backgroundColor: 'var(--accent)' }}>
            {t("View Catalog", "ካታሎግ ይመልከቱ")} <ArrowRight size={20} />
          </a>
          
          <a href="#contact" 
             className="flex items-center justify-center gap-2 px-8 py-4 font-bold rounded-xl border transition hover:opacity-90"
             style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}>
            <PhoneCall size={20} /> {t("Request Quote", "ዋጋ ይጠይቁ")}
          </a>
        </div>
      </main>

      {/* Products Grid Section */}
      <section id="products" className="py-20 border-t" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h3 className="text-3xl font-bold" style={{ color: 'var(--accent)' }}>{t("Live Inventory", "ያሉን ምርቶች")}</h3>
              <p className="mt-2" style={{ color: 'var(--text-muted)' }}>{t("Current stock available for dispatch.", "ለማጓጓዝ ዝግጁ የሆኑ እቃዎች::")}</p>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-50">
              <Loader2 className="animate-spin mb-4" size={48} style={{ color: 'var(--accent)' }} />
              <p>{t("Syncing with warehouse...", "ከመጋዘን ጋር በመገናኘት ላይ...")}</p>
            </div>
          ) : products.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-20 opacity-50 border border-dashed rounded-2xl" style={{ borderColor: 'var(--border-color)' }}>
              <PackageSearch size={48} className="mb-4" />
              <p>{t("No materials currently deployed.", "በአሁኑ ጊዜ ምንም እቃዎች የሉም::")}</p>
            </div>
          ) : (
            /* The Actual Product Grid */
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((item) => (
                <div key={item.id} className="rounded-2xl p-5 flex flex-col border transition hover:scale-[1.02]"
                     style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }}>
                  
                  {/* Category Badge */}
                  <span className="text-xs font-bold px-3 py-1 rounded-full w-fit mb-3"
                        style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-muted)' }}>
                    {item.menu || "Material"}
                  </span>
                  
                  <h4 className="text-lg font-bold mb-1">{item.title}</h4>
                  <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                    {item.description || `${item.metric || ''} ${item.type || ''} ${item.color || ''}`}
                  </p>
                  
                  <div className="mt-auto pt-4 border-t flex justify-between items-center" style={{ borderColor: 'var(--border-color)' }}>
                    <span className="font-bold text-xl">{item.price} ETB</span>
                    <button className="p-2 rounded-lg text-white" style={{ backgroundColor: 'var(--accent)' }}>
                      <ShoppingCart size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}