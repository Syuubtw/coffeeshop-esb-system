import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Coffee, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import api from '../services/api';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
      setPassword('password');
    }
  }, [location.state]);

  const handleRedirectByRole = (user: any) => {
    if (user.roles?.includes('super_admin')) {
      navigate('/admin');
    } else if (user.roles?.includes('store_manager')) {
      navigate('/manager');
    } else if (user.roles?.includes('warehouse_admin')) {
      navigate('/warehouse');
    } else if (user.roles?.includes('barista')) {
      navigate('/kds');
    } else {
      navigate('/pos');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.post('/auth/login', { email, password });
      const { user, token } = res.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      handleRedirectByRole(user);
    } catch {
      // Offline / Preset Fallback Authentication
      if (email === 'admin@coffeeshop.test' && password === 'password') {
        const dummyUser = { name: 'Faiz Rifki Syuhada (Owner)', email, roles: ['super_admin'] };
        localStorage.setItem('token', 'offline-token-super_admin');
        localStorage.setItem('user', JSON.stringify(dummyUser));
        handleRedirectByRole(dummyUser);
      } else if (email === 'manager@coffeeshop.test' && password === 'password') {
        const dummyUser = { name: 'Store Manager', email, roles: ['store_manager'] };
        localStorage.setItem('token', 'offline-token-store_manager');
        localStorage.setItem('user', JSON.stringify(dummyUser));
        handleRedirectByRole(dummyUser);
      } else if (email === 'warehouse@coffeeshop.test' && password === 'password') {
        const dummyUser = { name: 'Budi Santoso (Admin Gudang & Purchasing)', email, roles: ['warehouse_admin'] };
        localStorage.setItem('token', 'offline-token-warehouse');
        localStorage.setItem('user', JSON.stringify(dummyUser));
        handleRedirectByRole(dummyUser);
      } else if (email === 'cashier@coffeeshop.test' && password === 'password') {
        const dummyUser = { name: 'Kasir Frontline', email, roles: ['cashier'] };
        localStorage.setItem('token', 'offline-token-cashier');
        localStorage.setItem('user', JSON.stringify(dummyUser));
        handleRedirectByRole(dummyUser);
      } else if (email === 'barista@coffeeshop.test' && password === 'password') {
        const dummyUser = { name: 'Fajar Nugraha (Barista Utama)', email, roles: ['barista'] };
        localStorage.setItem('token', 'offline-token-barista');
        localStorage.setItem('user', JSON.stringify(dummyUser));
        handleRedirectByRole(dummyUser);
      } else if (email === 'barista2@coffeeshop.test' && password === 'password') {
        const dummyUser = { name: 'Dimas Pratama (Barista Espresso)', email, roles: ['barista'] };
        localStorage.setItem('token', 'offline-token-barista2');
        localStorage.setItem('user', JSON.stringify(dummyUser));
        handleRedirectByRole(dummyUser);
      } else if (email === 'barista3@coffeeshop.test' && password === 'password') {
        const dummyUser = { name: 'Sarah Amelia (Barista Manual Brew)', email, roles: ['barista'] };
        localStorage.setItem('token', 'offline-token-barista3');
        localStorage.setItem('user', JSON.stringify(dummyUser));
        handleRedirectByRole(dummyUser);
      } else {
        setErrorMsg('Email atau password salah. Silakan periksa kembali!');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillCredential = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('password');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-100 text-slate-900">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-amber-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-amber-600/30">
            <Coffee className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Portal Staf CoffeeShop</h1>
          <p className="text-xs text-slate-500 mt-1">
            Khusus Karyawan & Manajemen Restoran
          </p>

          <div className="mt-4 flex justify-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              🔴 Status Sesi: Belum Login
            </div>
          </div>
        </div>

        {/* Attendance Success Banner */}
        {location.state?.attendanceSuccess && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>
              Presensi atas nama <strong>{location.state.name || 'Staf'}</strong> berhasil dicatat! Silakan login untuk memulai stasiun kerja.
            </span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Staf
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="nama@coffeeshop.test"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 text-sm rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Kata Sandi / Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 text-sm rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 active:scale-[0.99] text-white font-bold text-sm rounded-xl transition shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? 'Memverifikasi...' : 'Masuk ke Sistem'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Role Fillers — 5 Staff Roles */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center mb-3">
            Pintasan Login 5 Role Staf:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillCredential('admin@coffeeshop.test')}
              className="p-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-left transition cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-purple-700 font-bold text-xs">
                <ShieldCheck className="w-3.5 h-3.5" /> 1. Owner
              </div>
              <div className="text-[9px] text-purple-600/80 mt-0.5">Finansial & Laba Rugi (/admin)</div>
            </button>

            <button
              type="button"
              onClick={() => fillCredential('manager@coffeeshop.test')}
              className="p-2.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-left transition cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-blue-700 font-bold text-xs">
                <ShieldCheck className="w-3.5 h-3.5" /> 2. Store Manager
              </div>
              <div className="text-[9px] text-blue-600/80 mt-0.5">Back Office & Menu (/manager)</div>
            </button>

            <button
              type="button"
              onClick={() => fillCredential('warehouse@coffeeshop.test')}
              className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-left transition cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-xs">
                <ShieldCheck className="w-3.5 h-3.5" /> 3. Admin Gudang
              </div>
              <div className="text-[9px] text-indigo-600/80 mt-0.5">Logistik & Inbound (/warehouse)</div>
            </button>

            <button
              type="button"
              onClick={() => fillCredential('cashier@coffeeshop.test')}
              className="p-2.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-left transition cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-amber-700 font-bold text-xs">
                <Coffee className="w-3.5 h-3.5" /> 4. Kasir
              </div>
              <div className="text-[9px] text-amber-600/80 mt-0.5">Front Office POS (/pos)</div>
            </button>

            <div className="col-span-2 p-2.5 rounded-xl border border-teal-200 bg-teal-50 text-left flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-teal-700 font-bold text-xs">
                <Coffee className="w-3.5 h-3.5" /> 5. Barista (3 Staf):
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => fillCredential('barista@coffeeshop.test')}
                  className="px-2 py-0.5 rounded bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold transition cursor-pointer"
                  title="Fajar Nugraha (Barista Utama)"
                >
                  Fajar
                </button>
                <button
                  type="button"
                  onClick={() => fillCredential('barista2@coffeeshop.test')}
                  className="px-2 py-0.5 rounded bg-teal-100 hover:bg-teal-200 text-teal-800 text-[10px] font-bold border border-teal-300 transition cursor-pointer"
                  title="Dimas Pratama (Barista Espresso)"
                >
                  Dimas
                </button>
                <button
                  type="button"
                  onClick={() => fillCredential('barista3@coffeeshop.test')}
                  className="px-2 py-0.5 rounded bg-teal-100 hover:bg-teal-200 text-teal-800 text-[10px] font-bold border border-teal-300 transition cursor-pointer"
                  title="Sarah Amelia (Barista Manual Brew)"
                >
                  Sarah
                </button>
              </div>
            </div>
          </div>

          {/* Public Access Link: Pelanggan & Presensi HP */}
          <div className="mt-4 pt-3 border-t border-dashed border-slate-200 flex flex-col gap-2 text-[11px]">
            <div className="flex items-center justify-between">
              <a
                href="/order/table/TB-01"
                target="_blank"
                rel="noreferrer"
                className="text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 hover:underline"
                title="Buka Self-Ordering Pelanggan Meja TB-01"
              >
                📱 5. Pelanggan (QR Meja) ↗
              </a>
              <a
                href="/absen"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 hover:underline"
                title="Buka poster QR Code Outlet untuk ditempel di toko & di-scan karyawan"
              >
                📷 Poster QR Absen Toko ↗
              </a>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2 text-center">
              <span className="text-[10px] text-slate-500">
                Alur Absen: Buka <b>Poster QR</b> ➔ Karyawan Scan pakai Kamera HP ➔ Terbuka{' '}
                <a
                  href="/presensi"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline font-bold"
                  title="Klik untuk simulasi tampilan di Chrome HP karyawan"
                >
                  Chrome HP (/presensi) ↗
                </a>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
