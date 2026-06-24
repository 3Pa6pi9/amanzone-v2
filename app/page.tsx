"use client";

<<<<<<< HEAD
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
=======
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

export default function ClientUI() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Floating AI System state
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiLog, setAiLog] = useState<any[]>([
    { sender: "ai", text: "Welcome to AmanZone Trading PLC Node. How can I facilitate your raw material acquisitions today?" }
  ]);

  // Establish continuous hot collection synchronizer
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snapshot) => {
      const liveData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProducts(liveData);
    });
    return () => unsub();
  }, []);

  const addToCart = (product: any) => {
    setCart((prev) => {
      const exist = prev.find((item) => item.id === product.id);
      if (exist) {
        return prev.map((item) => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
    setIsCartOpen(true);
  };

  const executeCheckout = async () => {
    if (cart.length === 0) return;
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart, total: cart.reduce((sum, i) => sum + (i.price * i.qty), 0) }),
      });
      if (res.ok) {
        alert("Acquisition request broadcasted successfully! Our hostess logistics team will reach out to schedule your delivery from our China transit terminals.");
        setCart([]);
        setIsCartOpen(false);
      }
    } catch (err) {
      alert("Checkout sequence processing fault.");
    }
  };

  const handleAiMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if(!aiInput.trim()) return;
    const userMsg = aiInput;
    setAiLog(p => [...p, { sender: "user", text: userMsg }]);
    setAiInput("");

    setTimeout(() => {
      let aiResponse = "Our system node is validating that operational standard with our logistics base.";
      if(userMsg.toLowerCase().includes("steel") || userMsg.includes("ብረት")) {
        aiResponse = "We host high tensile strength Grade 60 Turkish Deformed Steel (ቱርክ ብረት) structural components. Add them to your freight catalog allocation to prompt quote settlement.";
      } else if (userMsg.toLowerCase().includes("delivery") || userMsg.toLowerCase().includes("china") || userMsg.toLowerCase().includes("shipping")) {
        aiResponse = "AmanZone hostess operators oversee all supply lines coming straight from China delivery points safely to your port coordinates. All logistics are strictly routed through our China imports division.";
      } else if (userMsg.toLowerCase().includes("mdf") || userMsg.includes("ጣውላ")) {
        aiResponse = "We supply premium dense-core MDF boards and natural timber variants. Please check the active yard inventory below for current metric dimensions.";
      }
      setAiLog(p => [...p, { sender: "ai", text: aiResponse }]);
    }, 800);
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDarkMode ? "bg-neutral-950 text-neutral-100" : "bg-neutral-50 text-neutral-900"}`}>
      {/* Structural Glass Header */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-md ${isDarkMode ? "bg-neutral-950/80 border-neutral-800" : "bg-white/80 border-neutral-200"} px-4 md:px-6 py-4 flex justify-between items-center`}>
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-wider text-amber-500">AMANZONE TRADING PLC</h1>
          <p className="text-[10px] md:text-xs uppercase tracking-widest text-neutral-500 font-bold">Premium Materials Hub</p>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-lg border border-neutral-800 text-xs font-semibold hidden md:block">
            {isDarkMode ? "☼ Light View" : "🌙 Industrial Dark"}
          </button>
          <button onClick={() => setIsCartOpen(true)} className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold px-3 md:px-4 py-2 rounded-lg relative transition-colors text-xs md:text-sm uppercase tracking-wider">
            Freight Cargo
            {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold animate-pulse">{cart.reduce((sum,i)=>sum+i.qty,0)}</span>}
>>>>>>> 897b8485f2b00d59be677144965edc371517a93f
          </button>
        </div>
      </header>

<<<<<<< HEAD
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
=======
      {/* Hero Display Frame */}
      <section className={`py-12 md:py-16 px-6 text-center border-b ${isDarkMode ? "bg-neutral-900/40 border-neutral-800" : "bg-neutral-100 border-neutral-200"}`}>
        <h2 className="text-3xl md:text-4xl font-extrabold max-w-3xl mx-auto tracking-tight">Direct Architectural Supply Chains From Global Mills To Your Project Coordinate.</h2>
        <p className="text-neutral-500 mt-4 max-w-xl mx-auto text-sm sm:text-base">Structural reinforcement steel bars, premium dense-core MDF boards, and bulk construction commodities ready for transit initialization from China.</p>
      </section>

      {/* Primary Catalog Interface */}
      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <h3 className="text-lg md:text-xl font-bold uppercase tracking-widest mb-6 md:mb-8 text-neutral-400">Available Yard Inventory</h3>
        {products.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-neutral-800 rounded-2xl">
            <p className="text-neutral-500 text-sm">No live material assets discovered in the database terminal matrix right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {products.map((product) => (
              <div key={product.id} className={`border rounded-xl overflow-hidden shadow-sm transition-transform hover:-translate-y-1 ${isDarkMode ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200"}`}>
                {product.imageUrl && <img src={product.imageUrl} alt={product.title} className="w-full h-48 md:h-56 object-cover border-b border-neutral-800" />}
                <div className="p-5 md:p-6 space-y-4">
                  {/* Category Pathing */}
                  {(product.menu || product.category) && (
                    <span className="text-[10px] md:text-xs uppercase font-extrabold tracking-widest text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-md">
                      {product.menu || product.category} {product.submenu && `➔ ${product.submenu}`}
                    </span>
                  )}
                  
                  <h4 className="text-lg md:text-xl font-bold tracking-tight">{product.title}</h4>
                  
                  {/* Amharic/Detailed Matrix Badges */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {product.type && <span className="bg-neutral-800 border border-neutral-700 text-neutral-300 text-[10px] px-2 py-1 rounded font-mono uppercase">Type: {product.type}</span>}
                    {product.metric && <span className="bg-neutral-800 border border-neutral-700 text-neutral-300 text-[10px] px-2 py-1 rounded font-mono uppercase">Dim: {product.metric}</span>}
                    {product.color && <span className="bg-neutral-800 border border-neutral-700 text-neutral-300 text-[10px] px-2 py-1 rounded font-mono uppercase">Col: {product.color}</span>}
                  </div>

                  <p className={`text-xs md:text-sm line-clamp-3 mt-2 ${isDarkMode ? "text-neutral-400" : "text-neutral-600"}`}>{product.description}</p>
                  
                  <div className="flex justify-between items-center pt-4 mt-4 border-t border-neutral-800/50">
                    <span className="text-xl md:text-2xl font-black text-neutral-100">${product.price}<span className="text-[10px] text-neutral-500 font-normal"> / UNIT</span></span>
                    <button onClick={() => addToCart(product)} className="bg-neutral-800 hover:bg-neutral-700 text-amber-500 border border-amber-500/30 px-3 md:px-4 py-2 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider transition-colors shadow-lg">Allocate</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Sliding Freight Cart Drawer Component */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="fixed inset-0 bg-black z-50" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween" }} className={`fixed right-0 top-0 h-full w-full sm:w-[400px] z-50 p-6 flex flex-col justify-between shadow-2xl border-l ${isDarkMode ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200"}`}>
              <div>
                <div className="flex justify-between items-center border-b border-neutral-800 pb-4 mb-6">
                  <h4 className="text-lg font-black tracking-wider uppercase text-amber-500">Freight Manifesto</h4>
                  <button onClick={() => setIsCartOpen(false)} className="text-neutral-400 font-bold hover:text-neutral-200">✕ Close</button>
                </div>
                <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2">
                  {cart.length === 0 && <p className="text-neutral-500 text-sm text-center py-10">No items currently allocated for freight.</p>}
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center bg-neutral-950 p-4 border border-neutral-800 rounded-xl">
                      <div>
                        <h5 className="font-bold text-sm text-neutral-100 line-clamp-1">{item.title}</h5>
                        <p className="text-[10px] text-amber-500 font-mono mt-1">{item.metric || 'Standard'} • {item.color || 'Base'}</p>
                        <p className="text-xs text-neutral-500 mt-1">${item.price} x {item.qty}</p>
                      </div>
                      <span className="font-mono font-black text-sm text-amber-500 ml-4">${item.price * item.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-neutral-800 pt-6 space-y-4 bg-neutral-900">
                <div className="flex justify-between items-center font-bold text-lg">
                  <span className="text-neutral-300">Gross Valuation:</span>
                  <span className="font-mono text-xl text-neutral-100">${cart.reduce((sum,i)=>sum+(i.price*i.qty),0)}</span>
                </div>
                <button onClick={executeCheckout} className="w-full bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black py-4 rounded-lg tracking-widest uppercase transition-colors text-xs sm:text-sm shadow-[0_0_15px_rgba(245,158,11,0.2)]">Initialize Routing via China</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Tactical Conversational AI Agent Core Node */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40">
        <button onClick={() => setIsAiOpen(!isAiOpen)} className="bg-amber-500 hover:bg-amber-600 text-neutral-950 w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-2xl font-black text-xl flex items-center justify-center transition-transform active:scale-95 relative">
          {isAiOpen ? "✕" : "🤖"}
          {!isAiOpen && <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping"></span>}
        </button>
        <AnimatePresence>
          {isAiOpen && (
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="absolute bottom-16 sm:bottom-20 right-0 w-[calc(100vw-32px)] sm:w-96 h-[400px] bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl flex flex-col overflow-hidden">
              <div className="bg-neutral-800 p-4 border-b border-neutral-700 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm tracking-wide text-amber-500 uppercase flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> AmanZone System Agent
                  </h4>
                  <p className="text-[9px] sm:text-[10px] text-neutral-400 mt-1">Automated Supply Chain Assistant Node</p>
                </div>
              </div>
              <div className="flex-1 p-4 space-y-3 overflow-y-auto text-xs flex flex-col scroll-smooth">
                {aiLog.map((log, i) => (
                  <div key={i} className={`p-3 rounded-xl max-w-[85%] leading-relaxed ${log.sender === "ai" ? "bg-neutral-800 text-neutral-200 self-start rounded-tl-sm border border-neutral-700" : "bg-amber-500 text-neutral-950 font-medium self-end rounded-tr-sm shadow-md"}`}>
                    {log.text}
                  </div>
                ))}
              </div>
              <form onSubmit={handleAiMessage} className="p-3 border-t border-neutral-800 bg-neutral-950 flex gap-2">
                <input type="text" value={aiInput} onChange={(e)=>setAiInput(e.target.value)} placeholder="Inquire about routing logistics..." className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500" />
                <button type="submit" disabled={!aiInput.trim()} className="bg-amber-500 text-neutral-950 font-bold px-4 rounded-lg text-xs disabled:opacity-50 transition-opacity">Send</button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
>>>>>>> 897b8485f2b00d59be677144965edc371517a93f
    </div>
  );
}
