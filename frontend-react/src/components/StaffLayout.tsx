import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Coffee, Bell, LogOut, ShieldCheck, Package, Clock, QrCode, TrendingUp } from 'lucide-react';

interface StaffLayoutProps {
  children: React.ReactNode;
}

export const StaffLayout: React.FC<StaffLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isLoggedIn = Boolean(token && user.email);

  const isSuperAdmin = user.roles?.includes('super_admin');
  const isStoreManager = user.roles?.includes('store_manager');
  const isWarehouse = user.roles?.includes('warehouse_admin');
  const isCashier = user.roles?.includes('cashier');
  const isBarista = user.roles?.includes('barista');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Role label for sub-header
  const roleLabel = isSuperAdmin ? 'Pemilik Kedai (Owner)'
    : isStoreManager ? 'Manajer Kedai'
    : isWarehouse ? 'Staf Gudang & Bahan Baku'
    : isCashier ? 'Kasir'
    : isBarista ? 'Barista (Pembuat Kopi)'
    : 'Karyawan Kedai';

  // Avatar label
  const avatarLabel = isSuperAdmin ? 'OW' : isStoreManager ? 'SM' : isWarehouse ? 'GD' : isCashier ? 'KS' : 'BR';
  const avatarClass = isSuperAdmin ? 'bg-purple-100 text-purple-800'
    : isStoreManager ? 'bg-blue-100 text-blue-800'
    : isWarehouse ? 'bg-indigo-100 text-indigo-800'
    : isCashier ? 'bg-amber-100 text-amber-800'
    : 'bg-teal-100 text-teal-800';

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200/80 px-6 py-3 flex items-center justify-between shadow-2xs shrink-0">
        <div className="flex items-center gap-6">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-sm shadow-amber-600/30">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-sm tracking-tight block leading-tight">Kedai Kopi Kita</span>
              <span className="text-[11px] text-slate-500 font-semibold tracking-wide block whitespace-nowrap">{roleLabel}</span>
            </div>
          </div>

          {/* NAV: Owner (super_admin) — HANYA LAPORAN BISNIS & AUDIT KAS */}
          {isSuperAdmin && (
            <nav className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200/60">
              <NavButton 
                path="/admin" 
                label="Laporan Penjualan" 
                icon={<TrendingUp className="w-3.5 h-3.5 text-blue-600" />} 
                isActive={location.pathname === '/admin' && !location.search.includes('tab=audit')}
                location={location} 
                navigate={navigate} 
              />
              <NavButton 
                path="/admin?tab=audit" 
                label="Pemeriksaan Kasir & Kas" 
                icon={<ShieldCheck className="w-3.5 h-3.5 text-purple-600" />} 
                isActive={location.pathname === '/admin' && location.search.includes('tab=audit')}
                location={location} 
                navigate={navigate} 
              />
            </nav>
          )}

          {/* NAV: Store Manager */}
          {isStoreManager && (
            <nav className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200/60">
              <NavButton path="/manager" label="Menu & Resep" icon={<ShieldCheck className="w-3.5 h-3.5 text-blue-600" />} location={location} navigate={navigate} />
              <NavButton path="/table-qr" label="QR Meja" icon={<QrCode className="w-3.5 h-3.5 text-amber-600" />} location={location} navigate={navigate} />
              <NavButton path="/attendance" label="Absensi Karyawan" icon={<Clock className="w-3.5 h-3.5 text-emerald-600" />} location={location} navigate={navigate} />
            </nav>
          )}

          {/* NAV: Admin Gudang (warehouse_admin) */}
          {isWarehouse && (
            <nav className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200/60">
              <NavButton path="/warehouse" label="Gudang Bahan Baku" icon={<Package className="w-3.5 h-3.5 text-indigo-600" />} location={location} navigate={navigate} />
            </nav>
          )}

          {/* NAV: Cashier (Kasir) */}
          {isCashier && (
            <nav className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200/60">
              <NavButton path="/pos" label="Layar Kasir" icon={<ShoppingBag className="w-3.5 h-3.5 text-amber-600" />} location={location} navigate={navigate} />
            </nav>
          )}

          {/* NAV: Barista */}
          {isBarista && (
            <nav className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200/60">
              <NavButton path="/kds" label="Layar Antrean Dapur" icon={<Coffee className="w-3.5 h-3.5 text-teal-600" />} location={location} navigate={navigate} />
            </nav>
          )}
        </div>

        {/* Right Info: User info & Logout Button */}
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-800">Sedang Aktif</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-full border border-rose-200 shadow-2xs">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              <span className="text-rose-800">Belum Masuk</span>
            </div>
          )}

          <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition">
            <Bell className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
            <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center ${avatarClass}`}>
              {avatarLabel}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-900 leading-tight">{user.name}</div>
              <div className="text-[10px] text-slate-400">{user.email}</div>
            </div>
            <button
              onClick={handleLogout}
              title="Keluar / Ganti Akun"
              className="p-1.5 ml-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 p-5 overflow-hidden">
        {children}
      </main>
    </div>
  );
};

// Reusable nav button
interface NavButtonProps {
  path: string;
  label: string;
  icon: React.ReactNode;
  location: { pathname: string };
  navigate: (path: string) => void;
  isActive?: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({ path, label, icon, location, navigate, isActive }) => {
  const active = isActive !== undefined ? isActive : location.pathname === path;
  return (
    <button
      onClick={() => navigate(path)}
      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
        active
          ? 'bg-white text-slate-900 shadow-xs'
          : 'text-slate-500 hover:text-slate-900'
      }`}
    >
      {icon}
      {label}
    </button>
  );
};
