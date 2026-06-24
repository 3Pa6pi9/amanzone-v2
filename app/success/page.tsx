"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center selection:bg-amber-500 selection:text-black">
      <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
        <svg className="w-12 h-12 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">
        Transaction <span className="text-emerald-500">Verified</span>
      </h1>
      
      <p className="text-neutral-400 max-w-md mx-auto mb-2 text-lg">
        Your payment has been successfully processed by Chapa.
      </p>
      
      {orderId && (
        <p className="text-neutral-500 font-mono text-sm bg-neutral-900 px-4 py-2 rounded-lg border border-neutral-800 inline-block mb-10">
          Order Ref: {orderId}
        </p>
      )}

      <div className="flex gap-4">
        <Link href="/" className="bg-amber-500 hover:bg-white text-black px-8 py-4 rounded-xl font-black uppercase tracking-widest transition-colors shadow-lg">
          Return to Catalog
        </Link>
      </div>
    </div>
  );
}