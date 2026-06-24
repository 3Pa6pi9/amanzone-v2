export default function Loading() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-8 z-50">
      
      {/* Glowing Logo */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 bg-amber-500 rounded-full blur-[40px] opacity-20 animate-pulse"></div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white relative z-10">
          AMAN<span className="text-amber-500">ZONE</span>
        </h1>
      </div>
      
      {/* Industrial Loading Bar */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-48 h-1 bg-neutral-900 rounded-full overflow-hidden relative">
          <div className="absolute top-0 left-0 h-full bg-amber-500 w-full animate-[translateX_1.5s_ease-in-out_infinite] origin-left scale-x-50 shadow-[0_0_10px_rgba(245,158,11,0.8)]"></div>
        </div>
        <p className="text-neutral-600 text-[10px] font-bold uppercase tracking-[0.2em] animate-pulse">
          Establishing Secure Link...
        </p>
      </div>

    </div>
  );
}