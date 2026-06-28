"use client";

import React, { useState } from "react";
import { MessageSquare, X, Send } from "lucide-react";
import { useLanguage } from "@/lib/Providers";

export default function AIAssistant({ isAdmin = false }: { isAdmin?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
 const { language } = useLanguage();
 const t = (en: string, am: string) => (language === "EN" ? en : am);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-80 h-96 rounded-2xl shadow-2xl flex flex-col overflow-hidden border"
             style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          
          {/* Header */}
          <div className="p-4 flex justify-between items-center text-white" style={{ backgroundColor: 'var(--accent)' }}>
            <span className="font-bold">
              {isAdmin ? "Admin Intel AI" : t("AmanZone Support", "አማን-ዞን ድጋፍ")}
            </span>
            <button onClick={() => setIsOpen(false)} className="hover:opacity-75"><X size={18} /></button>
          </div>

          {/* Chat Body */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="p-3 rounded-lg text-sm w-[85%]" 
                 style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-main)' }}>
              {isAdmin 
                ? "Directives loaded. I can help you format inventory matrices, analyze sales data, or optimize logistics routes. How can I assist?"
                : t("Hello! I can help you calculate material quantities or find specific construction supplies. What are you building?", "ሰላም! የሚፈልጉትን የግንባታ እቃ እንዲያገኙ ልረዳዎ እችላለሁ። ምን እየገነቡ ነው?")}
            </div>
          </div>

          {/* Input Area */}
          <div className="p-3 border-t flex gap-2" style={{ borderColor: 'var(--border-color)' }}>
            <input 
              type="text" 
              placeholder={t("Type your question...", "ጥያቄዎን ያስገቡ...")}
              className="flex-1 p-2 rounded-lg outline-none text-sm"
              style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-main)' }}
            />
            <button className="p-2 rounded-lg text-white" style={{ backgroundColor: 'var(--accent)' }}>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-105 transition-transform"
        style={{ backgroundColor: 'var(--accent)' }}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
}