"use client";

import React, { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, updateDoc, doc, query, orderBy, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { 
  Box, Settings, Save, Loader2, CheckCircle2, Image as ImageIcon, AlertTriangle,
  TrendingUp, Truck, MapPin, Phone, User, FileText, ChevronRight, UploadCloud, Building2, ChevronDown, Menu, Mail, Lock, Briefcase, Clock, Printer, Megaphone, Video
} from "lucide-react";

// [KEEP INITIAL STATES SAME AS PREVIOUS - OMITTED FOR BREVITY]

export default function AdminCommandCenter() {
  // ... [ALL STATE HOOKS SAME AS PREVIOUS] ...
  // --- ADDED MARKETING MULTI-UPLOAD HANDLER ---
  const handleMarketingUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setIsUploadingMarketing(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const data = await uploadToCloudinary(files[i]);
        await addDoc(collection(db, "marketing"), { url: data.url, type: data.type, active: true, createdAt: new Date().toISOString() });
      }
      showToast("Media batch deployed.");
    } catch { showToast("Upload failed.", "error"); } finally { setIsUploadingMarketing(false); }
  };
  
  // ... [REST OF COMPONENT REMAINS IDENTICAL] ...
}
