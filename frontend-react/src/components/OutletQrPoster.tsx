import React, { useState, useEffect } from 'react';
import { Smartphone, Printer, Coffee, ArrowRight } from 'lucide-react';

export const OutletQrPoster: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Target URL that employee's phone opens when scanning this QR
  const mobileAttendanceUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/presensi`
    : 'http://localhost:5173/presensi';

  // Generate QR SVG via public quickchart or inline SVG
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(mobileAttendanceUrl)}&margin=10`;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-6 sm:p-10 font-sans">
      {/* Top Header */}
      <header className="flex items-center justify-between border-b border-slate-800 pb-5 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Coffee className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              POSTER PRESENSI OUTLET COFFEESHOP
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Stasiun QR Code Resmi untuk Presensi Seluruh Staf (Barista & Kasir)
            </p>
          </div>
        </div>

        <div className="text-right hidden sm:block">
          <div className="text-2xl font-black text-amber-400 font-mono tracking-wider">
            {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
          </div>
          <div className="text-xs text-slate-400 font-medium">
            {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </header>

      {/* Main Center Card: Big QR Poster */}
      <main className="max-w-xl mx-auto w-full my-auto py-8">
        <div className="bg-gradient-to-b from-slate-800 to-slate-850 rounded-3xl p-8 sm:p-10 border border-slate-700/80 shadow-2xl text-center relative overflow-hidden">
          {/* Decorative Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold mb-6">
            <Smartphone className="w-4 h-4" /> SCAN DENGAN KAMERA HP UNTUK ABSEN
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
            Arahkan Kamera HP ke Sini
          </h2>
          <p className="text-sm text-slate-300 max-w-md mx-auto mb-8">
            Buka kamera bawaan HP Anda, arahkan ke QR Code di bawah, lalu ketuk tautan yang muncul untuk memilih nama Anda.
          </p>

          {/* QR Code Frame */}
          <div className="inline-block p-4 sm:p-5 bg-white rounded-3xl shadow-xl shadow-black/40 border-4 border-amber-500/50 mb-8 transition transform hover:scale-[1.02]">
            <img
              src={qrImageUrl}
              alt="QR Code Presensi Outlet"
              className="w-64 h-64 sm:w-72 sm:h-72 object-contain rounded-xl"
            />
          </div>

          {/* 3 Step Guide */}
          <div className="grid grid-cols-3 gap-3 text-left border-t border-slate-700/60 pt-6">
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/40">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] flex items-center justify-center mb-1.5">
                1
              </span>
              <p className="text-[11px] font-bold text-white">Scan QR</p>
              <p className="text-[10px] text-slate-400">Gunakan kamera HP atau Google Lens</p>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/40">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] flex items-center justify-center mb-1.5">
                2
              </span>
              <p className="text-[11px] font-bold text-white">Buka di Chrome</p>
              <p className="text-[10px] text-slate-400">Tautan otomatis membuka form presensi</p>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/40">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] flex items-center justify-center mb-1.5">
                3
              </span>
              <p className="text-[11px] font-bold text-white">Pilih Nama</p>
              <p className="text-[10px] text-slate-400">Klik Masuk, langsung tercatat hadir!</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Navigation & Testing Shortcuts */}
      <footer className="max-w-4xl mx-auto w-full border-t border-slate-800 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Server Presensi Aktif • Target: <code className="text-amber-400 bg-slate-800 px-2 py-0.5 rounded">{mobileAttendanceUrl}</code></span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => window.print()}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            Cetak Poster Stiker
          </button>
          
          <a
            href="/presensi"
            target="_blank"
            rel="noreferrer"
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          >
            Buka Layar HP Langsung
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </footer>
    </div>
  );
};
