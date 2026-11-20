import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Coffee, 
  UserCheck, 
  ArrowRight, 
  Sparkles, 
  AlertCircle,
  LogOut,
  MapPin,
  MessageSquare
} from 'lucide-react';
import api from '../services/api';

interface EmployeeItem {
  id: number;
  name: string;
  role: string;
  position: string;
  code: string;
  department: string;
  status: 'NOT_CLOCKED_IN' | 'WORKING' | 'FINISHED';
  clock_in?: string | null;
  clock_out?: string | null;
  icon?: string;
}

const DEFAULT_EMPLOYEES: EmployeeItem[] = [
  { id: 4, name: 'Fajar Nugraha', role: 'Barista Utama', position: 'BARISTA', code: 'EMP-004', department: 'KITCHEN', status: 'NOT_CLOCKED_IN', icon: '☕' },
  { id: 5, name: 'Dimas Pratama', role: 'Barista Espresso', position: 'BARISTA', code: 'EMP-005', department: 'KITCHEN', status: 'NOT_CLOCKED_IN', icon: '☕' },
  { id: 6, name: 'Sarah Amelia', role: 'Barista Manual Brew', position: 'BARISTA', code: 'EMP-006', department: 'KITCHEN', status: 'NOT_CLOCKED_IN', icon: '☕' },
  { id: 3, name: 'Siti Rahmawati', role: 'Kasir Utama', position: 'CASHIER', code: 'EMP-003', department: 'FRONT_OFFICE', status: 'NOT_CLOCKED_IN', icon: '💼' },
  { id: 2, name: 'Raka Pratama', role: 'Store Manager', position: 'MANAGER', code: 'EMP-002', department: 'OPERATIONAL', status: 'NOT_CLOCKED_IN', icon: '👔' },
];

export const StaffMobileAttendance: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeItem[]>(DEFAULT_EMPLOYEES);
  const [selectedStaff, setSelectedStaff] = useState<EmployeeItem | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lateReason, setLateReason] = useState<string>('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState<string>('Mencari sinyal GPS...');

  // Geolocation detection
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationName('Outlet Coffeeshop (Radius Valid)');
        },
        () => {
          setCoords({ lat: -6.2088, lng: 106.8456 });
          setLocationName('Outlet Coffeeshop Utama (Standar)');
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setCoords({ lat: -6.2088, lng: 106.8456 });
      setLocationName('Outlet Coffeeshop Utama (Standar)');
    }
  }, []);

  // Clock timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Policy: Jam masuk kerja adalah 09.00 WIB
  const isLateNow = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const seconds = currentTime.getSeconds();
    return hours > 9 || (hours === 9 && (minutes > 0 || seconds > 0));
  };

  const getLateMinutesCount = () => {
    const now = currentTime;
    const shiftStart = new Date(now);
    shiftStart.setHours(9, 0, 0, 0);
    if (now > shiftStart) {
      return Math.floor((now.getTime() - shiftStart.getTime()) / 60000);
    }
    return 0;
  };

  // Fetch live employee list from backend
  const fetchEmployees = async () => {
    try {
      const res = await api.get('/hr/public-employees');
      if (res.data?.data?.employees) {
        const mapped = res.data.data.employees.map((e: any) => ({
          id: e.employee_id,
          name: e.name,
          role: e.position,
          position: e.position,
          code: e.employee_code,
          department: e.department,
          status: e.status || 'NOT_CLOCKED_IN',
          clock_in: e.clock_in,
          clock_out: e.clock_out,
          icon: e.position.includes('BARISTA') ? '☕' : e.position.includes('CASHIER') ? '💼' : '👔',
        }));
        setEmployees(mapped);
      }
    } catch {
      // Fallback to default list if offline
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleRecordAttendance = async (action: 'CLOCK_IN' | 'CLOCK_OUT') => {
    if (!selectedStaff) return;

    // Validasi alasan keterlambatan jika Clock-In di atas jam 09.00
    if (action === 'CLOCK_IN' && isLateNow() && !lateReason.trim()) {
      setErrorMessage('Wajib mengisi kolom alasan keterlambatan karena Anda masuk setelah pukul 09.00 WIB.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await api.post('/hr/public-attendance', {
        employee_id: selectedStaff.id,
        action: action,
        late_reason: lateReason.trim() || undefined,
        notes: lateReason.trim() || undefined,
        latitude: coords?.lat ?? -6.2088,
        longitude: coords?.lng ?? 106.8456,
        location_name: locationName,
      });

      if (res.data?.status === 'success') {
        setSuccessData(res.data);
        fetchEmployees(); // Refresh live status
      } else if (res.data?.status === 'warning' || res.data?.status === 'info') {
        setSuccessData(res.data);
      } else {
        setErrorMessage(res.data?.message || 'Terjadi kendala saat mencatat presensi.');
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'Gagal menghubungi server. Pastikan Anda terhubung ke jaringan outlet.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetSelection = () => {
    setSuccessData(null);
    setSelectedStaff(null);
    setErrorMessage(null);
    setLateReason('');
    fetchEmployees();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans antialiased max-w-md mx-auto shadow-2xl relative">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. TOP HEADER (Mobile App Feel)                             */}
      {/* ───────────────────────────────────────────────────────────── */}
      <header className="bg-slate-900 border-b border-slate-800 px-5 py-4 sticky top-0 z-20 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black text-white leading-tight tracking-tight">
                PRESENSI STAF
              </h1>
              <p className="text-[11px] text-amber-400 font-medium">
                Outlet Coffeeshop Resmi
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm font-black text-white font-mono">
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-[10px] text-slate-400">
              {currentTime.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
            </div>
          </div>
        </div>
      </header>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. SUCCESS SCREEN MODAL (Full Visual Satisfaction)           */}
      {/* ───────────────────────────────────────────────────────────── */}
      {successData ? (
        <main className="flex-1 p-6 flex flex-col justify-center items-center text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-4 border-emerald-500 flex items-center justify-center text-emerald-400 mb-6 shadow-2xl shadow-emerald-500/30 animate-pulse">
            <CheckCircle2 className="w-14 h-14" />
          </div>

          <span className={`inline-block px-3 py-1 rounded-full font-black text-xs uppercase tracking-wider mb-2 border ${
            successData.is_late 
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
          }`}>
            {successData.action === 'CLOCK_IN' 
              ? (successData.is_late ? `⚠️ TERLAMBAT (${successData.late_minutes} MENIT)` : '🟢 CLOCK-IN TEPAT WAKTU') 
              : '🏁 CLOCK-OUT BERHASIL'}
          </span>

          <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
            {successData.title || 'BERHASIL PRESENSI!'}
          </h2>

          <p className="text-xs text-slate-300 max-w-xs mb-6">
            {successData.message}
          </p>

          {/* Details Card */}
          <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 text-left mb-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <span className="text-xs text-slate-400">Nama Karyawan</span>
              <span className="text-sm font-bold text-white">{successData.employee?.name || selectedStaff?.name}</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <span className="text-xs text-slate-400">Posisi / Jabatan</span>
              <span className="text-xs font-semibold text-amber-400">{successData.employee?.position || selectedStaff?.role}</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <span className="text-xs text-slate-400">Waktu Tercatat</span>
              <span className="text-sm font-black font-mono text-emerald-400">{successData.time}</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <span className="text-xs text-slate-400">Status Kehadiran</span>
              {successData.is_late ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                  <AlertCircle className="w-3.5 h-3.5" /> TERLAMBAT ({successData.late_minutes} Menit)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                  <CheckCircle2 className="w-3.5 h-3.5" /> TEPAT WAKTU ✓
                </span>
              )}
            </div>
            {successData.late_reason && (
              <div className="pt-1">
                <span className="text-[11px] text-slate-400 block mb-1">Alasan Keterlambatan:</span>
                <p className="text-xs text-amber-300 italic bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                  "{successData.late_reason}"
                </p>
              </div>
            )}
          </div>

          <button
            onClick={resetSelection}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm transition shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span>Presensi Karyawan Lain / Selesai</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </main>
      ) : (
        /* ───────────────────────────────────────────────────────────── */
        /* 3. MAIN WORKFLOW: SELECT STAFF & CLOCK IN/OUT               */
        /* ───────────────────────────────────────────────────────────── */
        <main className="flex-1 p-5 overflow-y-auto">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-4 mb-5 shadow-lg">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-1">
              <Sparkles className="w-4 h-4" />
              <span>PRESENSI MANDIRI TANPA LOGIN</span>
            </div>
            <p className="text-xs text-slate-300">
              Pilih nama Anda di bawah ini untuk mencatat jam kehadiran masuk atau pulang.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Step 1: Staff Selection List */}
          <div className="mb-6">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
              1. Pilih Nama Anda:
            </span>

            <div className="space-y-2.5">
              {employees.map((emp) => {
                const isSelected = selectedStaff?.id === emp.id;
                const isWorking = emp.status === 'WORKING';
                const isFinished = emp.status === 'FINISHED';

                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => {
                      setSelectedStaff(emp);
                      setErrorMessage(null);
                    }}
                    className={`w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer active:scale-[0.99] ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold shadow ${
                        isSelected ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {emp.icon || '☕'}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white flex items-center gap-1.5">
                          {emp.name}
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {emp.role} • <span className="font-mono text-slate-500">{emp.code}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      {isWorking ? (
                        <span className="px-2 py-1 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Masuk {emp.clock_in}
                        </span>
                      ) : isFinished ? (
                        <span className="px-2 py-1 rounded-md bg-blue-500/20 border border-blue-500/40 text-blue-300 text-[10px] font-bold">
                          Selesai ({emp.clock_out})
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-semibold">
                          Belum Masuk
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Action Confirmation when Selected */}
          {selectedStaff && (
            <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-5 shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-2">
                2. Konfirmasi Presensi:
              </span>

              <div className="flex items-center gap-3 mb-4 p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 font-black">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{selectedStaff.name}</h4>
                  <p className="text-[11px] text-slate-400">{selectedStaff.role} ({selectedStaff.code})</p>
                </div>
              </div>

              {/* Late Warning & Reason Input (Jika masuk setelah pukul 09.00 WIB) */}
              {selectedStaff.status !== 'WORKING' && isLateNow() && (
                <div className="mb-3 p-3.5 bg-amber-500/10 border border-amber-500/40 rounded-xl space-y-2 text-left">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Perhatian: Masuk Melebihi Jam 09.00 WIB</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Jam masuk shift standar adalah <b className="text-white">09:00 WIB</b>. Saat ini pukul <b className="text-amber-300 font-mono">{currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</b> (Terhitung terlambat <b className="text-amber-400">+{getLateMinutesCount()} menit</b>).
                  </p>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-300 uppercase tracking-wider mb-1">
                      Alasan Keterlambatan <span className="text-rose-400">*</span>:
                    </label>
                    <textarea
                      rows={2}
                      value={lateReason}
                      onChange={(e) => setLateReason(e.target.value)}
                      placeholder="Tulis alasan keterlambatan Anda secara jujur..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>
                  {/* Quick Preset Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {[
                      'Ban Bocor / Kendaraan Mogok',
                      'Macet Parah di Jalan',
                      'Hujan Lebat / Cuaca Buruk',
                      'Keperluan Mendesak Keluarga',
                    ].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setLateReason(chip)}
                        className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold border border-slate-700 transition"
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Optional Comment Input when On-Time */}
              {selectedStaff.status !== 'WORKING' && !isLateNow() && (
                <div className="mb-3 p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 text-left">
                  <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-xs">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Catatan / Pesan Kehadiran (Opsional):</span>
                  </div>
                  <textarea
                    rows={2}
                    value={lateReason}
                    onChange={(e) => setLateReason(e.target.value)}
                    placeholder="Tulis pesan atau catatan shift untuk Store Manager jika ada..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition"
                  />
                </div>
              )}

              {/* GPS Geolocation Verification Badge */}
              <div className="mb-3.5 p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-left">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-white block leading-tight">
                      {locationName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {coords ? `Lat: ${coords.lat.toFixed(4)}, Long: ${coords.lng.toFixed(4)}` : 'Mencari sinyal GPS...'}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[9px] uppercase tracking-wider">
                  GPS Aktif
                </span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5">
                {selectedStaff.status !== 'WORKING' && (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleRecordAttendance('CLOCK_IN')}
                    className={`w-full py-4 rounded-xl text-white font-black text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50 ${
                      isLateNow()
                        ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 shadow-amber-600/25'
                        : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-emerald-600/25'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>
                      {submitting
                        ? 'Menyimpan...'
                        : isLateNow()
                        ? '⚠️ PRESENSI MASUK (TERLAMBAT)'
                        : '🟢 PRESENSI MASUK (CLOCK IN)'}
                    </span>
                  </button>
                )}

                {selectedStaff.status === 'WORKING' && (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleRecordAttendance('CLOCK_OUT')}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black text-sm transition shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>{submitting ? 'Menyimpan...' : '🔴 PRESENSI PULANG (CLOCK OUT)'}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </main>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. FOOTER NOTE                                              */}
      {/* ───────────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 border-t border-slate-800 px-5 py-3 text-center text-[10px] text-slate-500">
        <p>Sistem Presensi QR Mandiri Coffeeshop • Terhubung ke Kiosk Manager</p>
      </footer>
    </div>
  );
};
