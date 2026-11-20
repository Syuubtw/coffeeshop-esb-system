import React, { useEffect, useState, useCallback } from 'react';
import { 
  UserCheck, 
  CheckCircle2, 
  RotateCcw, 
  Timer, 
  Search, 
  Clock, 
  AlertCircle,
  Lock,
  Unlock,
  ExternalLink,
  ShieldCheck,
  FileSpreadsheet,
  Download,
  Calendar,
  Users,
  Activity,
  Maximize2,
  Printer,
  X,
  MapPin,
  MessageSquare
} from 'lucide-react';
import api from '../services/api';
import { getQrCodeUrl } from '../utils/qrCode';
import { exportStyledExcel } from '../utils/exportCsv';

interface EmployeeItem {
  id?: number;
  employee_id?: number;
  employee_code: string;
  name: string;
  position: string;
  department: string;
  avatar_url?: string;
  status: 'NOT_CLOCKED_IN' | 'WORKING' | 'FINISHED';
  clock_in?: string | null;
  clock_out?: string | null;
  work_duration?: string | null;
  shift_name?: string | null;
  device_id?: string | null;
  is_device_locked: boolean;
  device_info?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  location_name?: string | null;
  late_reason?: string | null;
  notes?: string | null;
}

interface MonthlyRecapItem {
  employee_id: number;
  employee_code: string;
  name: string;
  position: string;
  department: string;
  phone: string;
  present_days: number;
  late_count: number;
  total_late_minutes: number;
  total_work_hours: number;
  total_overtime_hours: number;
  is_device_locked: boolean;
  device_info: string;
}

interface MonthlyDetailItem {
  id: number;
  date: string;
  date_formatted: string;
  employee_code: string;
  name: string;
  position: string;
  clock_in: string;
  clock_out: string;
  duration: string;
  late_minutes: number;
  overtime_minutes: number;
  status: string;
  latitude?: number | null;
  longitude?: number | null;
  location_name?: string | null;
  late_reason?: string | null;
  notes?: string | null;
}

interface MonthlyResponseData {
  month: number;
  year: number;
  month_name: string;
  total_employees: number;
  total_attendance_records: number;
  recap: MonthlyRecapItem[];
  details: MonthlyDetailItem[];
}

export const AttendanceKiosk: React.FC = () => {
  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<'LIVE_KIOSK' | 'MONTHLY_RECAP'>('LIVE_KIOSK');

  // Live Kiosk States
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Monthly Recap States
  const currentMonthNum = new Date().getMonth() + 1;
  const currentYearNum = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthNum);
  const [selectedYear, setSelectedYear] = useState<number>(currentYearNum);
  const [monthlyData, setMonthlyData] = useState<MonthlyResponseData | null>(null);
  const [loadingMonthly, setLoadingMonthly] = useState<boolean>(false);
  const [monthlyFilterSearch, setMonthlyFilterSearch] = useState<string>('');
  const [activeRecapSubtab, setActiveRecapSubtab] = useState<'SUMMARY' | 'DAILY_LOGS'>('SUMMARY');

  // Clock Ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('id-ID', { hour12: false }));
      setCurrentDate(now.toLocaleDateString('id-ID', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Live Attendance
  const fetchLiveAttendance = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const res = await api.get('/hr/attendance/live');
      if (res.data?.status === 'success') {
        setEmployees(res.data.data.employees || []);
      }
    } catch (err: any) {
      console.error('Failed to load attendance:', err);
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  // Fetch Monthly Recap
  const fetchMonthlyRecap = useCallback(async (m: number, y: number) => {
    setLoadingMonthly(true);
    try {
      const res = await api.get(`/hr/attendance/monthly?month=${m}&year=${y}`);
      if (res.data?.status === 'success') {
        setMonthlyData(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load monthly attendance:', err);
    } finally {
      setLoadingMonthly(false);
    }
  }, []);

  // Initial & Polling
  useEffect(() => {
    fetchLiveAttendance();
    const pollInterval = setInterval(() => {
      fetchLiveAttendance(true);
      if (activeTab === 'MONTHLY_RECAP') {
        fetchMonthlyRecap(selectedMonth, selectedYear);
      }
    }, 15000); // 15 detik live update
    return () => clearInterval(pollInterval);
  }, [fetchLiveAttendance, activeTab, selectedMonth, selectedYear, fetchMonthlyRecap]);

  // Load Monthly when tab or period changes
  useEffect(() => {
    if (activeTab === 'MONTHLY_RECAP') {
      fetchMonthlyRecap(selectedMonth, selectedYear);
    }
  }, [activeTab, selectedMonth, selectedYear, fetchMonthlyRecap]);

  // Manual Clock Action (Manager/Owner override)
  const handleManualClock = async (emp: EmployeeItem) => {
    const empId = emp.id || emp.employee_id;
    if (!empId) {
      setActionError('ID Karyawan tidak valid.');
      return;
    }

    const isClockIn = emp.status === 'NOT_CLOCKED_IN';
    const action = isClockIn ? 'CLOCK_IN' : 'CLOCK_OUT';
    const actionLabel = isClockIn ? 'Clock-In (Masuk)' : 'Clock-Out (Selesai Pulang)';

    if (!window.confirm(`Konfirmasi manual ${actionLabel} untuk karyawan:\n${emp.employee_code} - ${emp.name}?`)) {
      return;
    }

    setProcessingId(empId);
    setActionSuccess(null);
    setActionError(null);

    try {
      const res = await api.post('/hr/attendance/clock', {
        employee_id: empId,
        id: empId,
        employee_code: emp.employee_code,
        action: action,
        method: 'KIOSK_MANUAL'
      });

      if (res.data?.status === 'success') {
        setActionSuccess(res.data?.message || `Berhasil ${actionLabel} untuk ${emp.name}`);
        fetchLiveAttendance(true);
        if (monthlyData) fetchMonthlyRecap(selectedMonth, selectedYear);
      } else {
        setActionError(res.data?.message || 'Gagal memproses absensi.');
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setProcessingId(null);
      setTimeout(() => {
        setActionSuccess(null);
        setActionError(null);
      }, 5000);
    }
  };

  // Reset Device Lock
  const handleResetDevice = async (emp: EmployeeItem) => {
    const empId = emp.id || emp.employee_id;
    if (!empId) {
      setActionError('ID Karyawan tidak valid.');
      return;
    }

    if (!window.confirm(`Lepaskan kunci perangkat HP untuk ${emp.name}?\n\nKaryawan ini nantinya dapat mendaftarkan smartphone baru saat melakukan scan QR.`)) {
      return;
    }

    setProcessingId(empId);
    try {
      const res = await api.post(`/hr/employees/${empId}/reset-device`);
      if (res.data?.status === 'success') {
        setActionSuccess(res.data?.message || `Kunci perangkat untuk ${emp.name} berhasil di-reset.`);
        fetchLiveAttendance(true);
        if (monthlyData) fetchMonthlyRecap(selectedMonth, selectedYear);
      } else {
        setActionError(res.data?.message || 'Gagal reset perangkat.');
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Gagal reset perangkat.');
    } finally {
      setProcessingId(null);
      setTimeout(() => {
        setActionSuccess(null);
        setActionError(null);
      }, 5000);
    }
  };

  // Export Excel Handlers
  const handleExportMonthlyRecapExcel = () => {
    if (!monthlyData || !monthlyData.recap || monthlyData.recap.length === 0) {
      alert('Tidak ada data rekap presensi untuk diunduh pada bulan yang dipilih.');
      return;
    }

    const headers = [
      'No',
      'NIP / Kode Karyawan',
      'Nama Karyawan',
      'Jabatan / Posisi',
      'Divisi / Dept',
      'No. HP',
      'Hari Masuk',
      'Hari Terlambat',
      'Total Menit Telat',
      'Total Jam Kerja',
      'Total Lembur (Jam)',
      'Status Binding HP'
    ];

    const rows = monthlyData.recap.map((item, idx) => [
      idx + 1,
      item.employee_code,
      item.name,
      item.position,
      item.department,
      item.phone,
      `${item.present_days} Hari`,
      `${item.late_count} Kali`,
      `${item.total_late_minutes} Menit`,
      `${item.total_work_hours} Jam`,
      `${item.total_overtime_hours} Jam`,
      item.is_device_locked ? 'Terkunci (Terdaftar)' : 'Belum Terkunci'
    ]);

    const totalHoursAll = monthlyData.recap.reduce((acc, curr) => acc + curr.total_work_hours, 0);
    const totalLateMinAll = monthlyData.recap.reduce((acc, curr) => acc + curr.total_late_minutes, 0);

    exportStyledExcel({
      filename: `Rekap_Presensi_Bulanan_${monthlyData.year}_${String(monthlyData.month).padStart(2, '0')}.xls`,
      title: `REKAPITULASI PRESENSI & JAM KERJA KARYAWAN`,
      subtitle: `Periode: ${monthlyData.month_name} | Outlet: Coffeeshop ESB | Hak Akses: Store Manager & Owner`,
      author: 'ESB Attendance Kiosk System',
      themeColor: '#0f766e', // Teal modern
      summaryItems: [
        { label: 'Bulan / Tahun', value: monthlyData.month_name },
        { label: 'Total Staf Aktif', value: `${monthlyData.total_employees} Orang` },
        { label: 'Total Jam Kerja Staf', value: `${totalHoursAll.toFixed(1)} Jam` },
        { label: 'Total Menit Terlambat', value: `${totalLateMinAll} Menit` },
      ],
      headers,
      rows,
      alignments: ['center', 'center', 'left', 'left', 'left', 'center', 'center', 'center', 'right', 'right', 'right', 'center']
    });
  };

  const handleExportDailyLogsExcel = () => {
    if (!monthlyData || !monthlyData.details || monthlyData.details.length === 0) {
      alert('Tidak ada catatan log harian presensi untuk diunduh pada bulan yang dipilih.');
      return;
    }

    const headers = [
      'No',
      'Tanggal',
      'NIP',
      'Nama Karyawan',
      'Posisi',
      'Jam Masuk (Clock-In)',
      'Jam Pulang (Clock-Out)',
      'Total Durasi',
      'Menit Telat',
      'Alasan Terlambat / Komentar',
      'Lokasi GPS (Lat, Long)',
      'Lembur (Menit)',
      'Status Kehadiran'
    ];

    const rows = monthlyData.details.map((log, idx) => [
      idx + 1,
      log.date_formatted,
      log.employee_code,
      log.name,
      log.position,
      log.clock_in,
      log.clock_out,
      log.duration,
      `${log.late_minutes} m`,
      log.late_reason || log.notes || '-',
      log.latitude && log.longitude ? `${Number(log.latitude).toFixed(4)}, ${Number(log.longitude).toFixed(4)} (${log.location_name || 'Outlet'})` : 'Outlet Coffeeshop (-6.2088, 106.8456)',
      `${log.overtime_minutes} m`,
      log.status
    ]);

    exportStyledExcel({
      filename: `Log_Presensi_Harian_${monthlyData.year}_${String(monthlyData.month).padStart(2, '0')}.xls`,
      title: `LOG DETAIL HARIAN KEHADIRAN KARYAWAN`,
      subtitle: `Periode: ${monthlyData.month_name} | Total Log: ${monthlyData.details.length} Catatan`,
      author: 'ESB Attendance Kiosk System',
      themeColor: '#1e3a8a', // Deep Blue
      summaryItems: [
        { label: 'Periode Log', value: monthlyData.month_name },
        { label: 'Total Catatan Masuk', value: `${monthlyData.details.length} Transaksi` },
      ],
      headers,
      rows,
      alignments: ['center', 'left', 'center', 'left', 'left', 'center', 'center', 'center', 'right', 'left', 'left', 'right', 'center']
    });
  };

  // Filtered lists
  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.employee_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRecap = monthlyData?.recap.filter(e =>
    e.name.toLowerCase().includes(monthlyFilterSearch.toLowerCase()) ||
    e.employee_code.toLowerCase().includes(monthlyFilterSearch.toLowerCase()) ||
    e.position.toLowerCase().includes(monthlyFilterSearch.toLowerCase())
  ) || [];

  const filteredLogs = monthlyData?.details.filter(l =>
    l.name.toLowerCase().includes(monthlyFilterSearch.toLowerCase()) ||
    l.employee_code.toLowerCase().includes(monthlyFilterSearch.toLowerCase()) ||
    l.date.includes(monthlyFilterSearch)
  ) || [];

  const totalEmployeesCount = employees.length;
  const workingCount = employees.filter(e => e.status === 'WORKING').length;
  const finishedCount = employees.filter(e => e.status === 'FINISHED').length;
  const notClockedCount = employees.filter(e => e.status === 'NOT_CLOCKED_IN').length;

  const outletQrValue = 'ESB-COFFEE-OUTLET-MAIN-AUTH-TOKEN-2026';
  const mobileScanUrl = `${window.location.origin}/absen?token=${outletQrValue}`;

  const monthsList = [
    { num: 1, name: 'Januari' },
    { num: 2, name: 'Februari' },
    { num: 3, name: 'Maret' },
    { num: 4, name: 'April' },
    { num: 5, name: 'Mei' },
    { num: 6, name: 'Juni' },
    { num: 7, name: 'Juli' },
    { num: 8, name: 'Agustus' },
    { num: 9, name: 'September' },
    { num: 10, name: 'Oktober' },
    { num: 11, name: 'November' },
    { num: 12, name: 'Desember' }
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="bg-slate-900 text-white px-6 py-4 shadow-lg flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="bg-amber-600 p-2.5 rounded-xl shadow-md flex items-center justify-center">
            <UserCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              Kiosk Presensi & Rekap Kehadiran
              <span className="text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Live Sinkron
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Station Khusus Store Manager & Owner • Anti-Titip Absen 1 Staf = 1 Smartphone
            </p>
          </div>
        </div>

        {/* Tab Switcher & Clock */}
        <div className="flex items-center space-x-4">
          <div className="bg-slate-800 p-1 rounded-xl flex items-center space-x-1 border border-slate-700">
            <button
              onClick={() => setActiveTab('LIVE_KIOSK')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center space-x-2 ${
                activeTab === 'LIVE_KIOSK'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Papan Kiosk Hari Ini</span>
            </button>
            <button
              onClick={() => setActiveTab('MONTHLY_RECAP')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center space-x-2 ${
                activeTab === 'MONTHLY_RECAP'
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Riwayat & Rekap Bulanan (Excel)</span>
            </button>
          </div>

          <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 text-right hidden sm:block">
            <div className="text-base font-mono font-bold text-amber-400 tracking-wider">
              {currentTime || '--:--:--'} WIB
            </div>
            <div className="text-xs text-slate-400">
              {currentDate || 'Memuat...'}
            </div>
          </div>
        </div>
      </header>

      {/* Notifications */}
      {actionSuccess && (
        <div className="bg-emerald-600 text-white px-6 py-2.5 flex items-center justify-between text-sm shadow-md animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-100 hover:text-white">✕</button>
        </div>
      )}

      {actionError && (
        <div className="bg-rose-600 text-white px-6 py-2.5 flex items-center justify-between text-sm shadow-md animate-fadeIn">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-100 hover:text-white">✕</button>
        </div>
      )}

      {/* TAB 1: LIVE KIOSK */}
      {activeTab === 'LIVE_KIOSK' && (
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
          {/* Banner Scan QR HP Outlet */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-xl border border-indigo-900/50 flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="flex items-center space-x-4">
              <div 
                onClick={() => setShowQrModal(true)}
                className="bg-white p-2 rounded-xl shadow-md cursor-pointer hover:scale-105 transition-transform group relative"
                title="Klik untuk perbesar QR Code"
              >
                <img 
                  src={getQrCodeUrl(mobileScanUrl, 90)} 
                  alt="QR Absensi" 
                  className="w-20 h-20 rounded"
                />
                <span className="absolute inset-0 bg-black/40 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 text-white text-[10px] font-bold">
                  Perbesar
                </span>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-bold">QR Presensi Outlet (Scan Pakai Kamera HP Karyawan)</h2>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Anti-Titip Absen
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  Karyawan membuka menu Presensi di smartphone masing-masing, lalu mengarahkan kamera HP ke QR Code ini. Sistem otomatis melakukan Clock-In / Clock-Out tanpa memilih nama secara manual.
                </p>
                <div className="mt-2 flex items-center space-x-3 text-xs text-indigo-200">
                  <span className="font-mono bg-indigo-900/60 px-2 py-1 rounded border border-indigo-700/50">
                    Token: {outletQrValue}
                  </span>
                  <span>• Model A: Kamera HP Scan QR Toko</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              <a
                href={mobileScanUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow flex items-center space-x-2 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Buka di HP / Tab Baru</span>
              </a>
              <button
                onClick={() => setShowQrModal(true)}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold px-3 py-2.5 rounded-xl shadow flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Maximize2 className="w-4 h-4" />
                <span>Perbesar QR</span>
              </button>
              <button
                onClick={() => setShowPrintModal(true)}
                className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-2.5 rounded-xl shadow flex items-center space-x-1.5 transition-colors cursor-pointer"
                title="Cetak Poster Akrilik / Stiker Dinding"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Stiker Poster</span>
              </button>
            </div>
          </div>

          {/* Quick Stats & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* KPI Badges */}
            <div className="flex items-center space-x-2 text-xs w-full sm:w-auto overflow-x-auto pb-1">
              <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg font-semibold text-slate-700 shadow-sm flex items-center gap-1.5 whitespace-nowrap">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                Total: <strong className="text-slate-900">{totalEmployeesCount}</strong>
              </span>
              <span className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg font-semibold text-emerald-700 shadow-sm flex items-center gap-1.5 whitespace-nowrap">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Bekerja: <strong className="text-emerald-800">{workingCount}</strong>
              </span>
              <span className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg font-semibold text-amber-700 shadow-sm flex items-center gap-1.5 whitespace-nowrap">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Belum Masuk: <strong className="text-amber-800">{notClockedCount}</strong>
              </span>
              <span className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg font-semibold text-blue-700 shadow-sm flex items-center gap-1.5 whitespace-nowrap">
                <Timer className="w-3.5 h-3.5 text-blue-600" />
                Selesai Shift: <strong className="text-blue-800">{finishedCount}</strong>
              </span>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, NIP, atau posisi..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
              />
            </div>
          </div>

          {/* Employee Attendance Cards Grid */}
          {loading ? (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-400 shadow-sm">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-500 border-t-transparent mb-2"></div>
              <p className="text-sm">Memuat status presensi karyawan real-time...</p>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-400 shadow-sm">
              <p className="text-sm font-medium">Tidak ada karyawan yang cocok dengan pencarian.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEmployees.map((emp) => {
                const empId = emp.id || emp.employee_id || 0;
                const isWorking = emp.status === 'WORKING';
                const isFinished = emp.status === 'FINISHED';
                const isNotClocked = emp.status === 'NOT_CLOCKED_IN';

                return (
                  <div
                    key={empId || emp.employee_code}
                    className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm overflow-hidden flex flex-col justify-between ${
                      isWorking 
                        ? 'border-emerald-300 ring-1 ring-emerald-300' 
                        : isFinished 
                        ? 'border-blue-200' 
                        : 'border-slate-200'
                    }`}
                  >
                    {/* Card Header */}
                    <div className="p-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[11px] font-mono font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                            {emp.employee_code}
                          </span>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            {emp.position}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-800 mt-1 line-clamp-1">
                          {emp.name}
                        </h3>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {isWorking && (
                          <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                            HADIR
                          </span>
                        )}
                        {isFinished && (
                          <span className="bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-bold px-2 py-1 rounded-full shadow-sm">
                            PULANG
                          </span>
                        )}
                        {isNotClocked && (
                          <span className="bg-slate-200 text-slate-600 text-[11px] font-semibold px-2 py-1 rounded-full">
                            BELUM ABSEN
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Body: Hours & Shift */}
                    <div className="p-4 space-y-2 text-xs text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Jam Masuk:</span>
                        <span className="font-semibold font-mono text-slate-800">
                          {emp.clock_in ? `${emp.clock_in} WIB` : '-'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Jam Pulang:</span>
                        <span className="font-semibold font-mono text-slate-800">
                          {emp.clock_out ? `${emp.clock_out} WIB` : '-'}
                        </span>
                      </div>

                      {/* Alasan / Catatan & Lokasi GPS */}
                      {(emp.late_reason || emp.notes) && (
                        <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span className="italic leading-tight">"{emp.late_reason || emp.notes}"</span>
                        </div>
                      )}

                      {emp.clock_in && (
                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <span className="text-slate-500 inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-rose-500" />
                            {emp.location_name || 'Outlet Coffeeshop'}
                          </span>
                          <a
                            href={`https://www.google.com/maps?q=${emp.latitude || -6.2088},${emp.longitude || 106.8456}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 font-bold underline text-[10px]"
                          >
                            Maps ↗
                          </a>
                        </div>
                      )}

                      {/* Device Binding Status */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 text-[11px]">
                          {emp.is_device_locked ? (
                            <span className="text-emerald-600 flex items-center gap-1 font-medium">
                              <Lock className="w-3.5 h-3.5" /> Terkunci ke HP
                            </span>
                          ) : (
                            <span className="text-slate-400 flex items-center gap-1">
                              <Unlock className="w-3.5 h-3.5" /> Belum bind HP
                            </span>
                          )}
                        </div>
                        {emp.is_device_locked && (
                          <button
                            onClick={() => handleResetDevice(emp)}
                            disabled={processingId === empId}
                            className="text-[10px] text-rose-600 hover:text-rose-700 font-semibold underline cursor-pointer"
                            title="Buka kunci agar karyawan bisa ganti smartphone"
                          >
                            Reset Kunci HP
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Card Footer: Manual Action Override for Store Manager */}
                    <div className="p-3 bg-slate-50 border-t border-slate-100">
                      {isFinished ? (
                        <div className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold text-slate-500 bg-slate-100 flex items-center justify-center space-x-1.5 border border-slate-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>Shift Selesai (Sudah Absen Pulang)</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleManualClock(emp)}
                          disabled={processingId === empId}
                          className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer ${
                            isNotClocked
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-rose-600 hover:bg-rose-700 text-white'
                          }`}
                        >
                          {processingId === empId ? (
                            <span>Memproses...</span>
                          ) : isNotClocked ? (
                            <>
                              <Clock className="w-3.5 h-3.5" />
                              <span>Clock-In Manual (Masuk)</span>
                            </>
                          ) : (
                            <>
                              <Timer className="w-3.5 h-3.5" />
                              <span>Clock-Out Manual (Selesai Kerja)</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      )}

      {/* TAB 2: REKAP BULANAN & RIWAYAT (EXCEL) */}
      {activeTab === 'MONTHLY_RECAP' && (
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
          {/* Controls Header: Month/Year selector & Action buttons */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-teal-600" />
                <span className="text-sm font-bold text-slate-700">Pilih Periode:</span>
              </div>

              {/* Month Dropdown */}
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-slate-50 border border-slate-300 text-slate-800 text-sm font-semibold rounded-xl px-3 py-2 focus:ring-2 focus:ring-teal-500"
              >
                {monthsList.map((m) => (
                  <option key={m.num} value={m.num}>
                    {m.name}
                  </option>
                ))}
              </select>

              {/* Year Dropdown */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-slate-50 border border-slate-300 text-slate-800 text-sm font-semibold rounded-xl px-3 py-2 focus:ring-2 focus:ring-teal-500"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>

              <button
                onClick={() => fetchMonthlyRecap(selectedMonth, selectedYear)}
                disabled={loadingMonthly}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${loadingMonthly ? 'animate-spin' : ''}`} />
                <span>Segarkan</span>
              </button>
            </div>

            {/* Excel Download Buttons */}
            <div className="flex items-center space-x-2.5 w-full md:w-auto">
              <button
                onClick={handleExportMonthlyRecapExcel}
                className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow flex items-center justify-center space-x-2 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Export Rekap Bulanan (.xls)</span>
              </button>
              <button
                onClick={handleExportDailyLogsExcel}
                className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow flex items-center justify-center space-x-2 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Export Log Harian (.xls)</span>
              </button>
            </div>
          </div>

          {/* 4 Summary Cards */}
          {monthlyData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
                <div className="bg-slate-100 p-3 rounded-xl text-slate-700">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-400">Total Karyawan</div>
                  <div className="text-xl font-bold text-slate-800">{monthlyData.total_employees} Orang</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
                <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-400">Presensi Bulan Ini</div>
                  <div className="text-xl font-bold text-blue-700">{monthlyData.total_attendance_records} Kali</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
                <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-400">Total Jam Kerja</div>
                  <div className="text-xl font-bold text-emerald-700">
                    {monthlyData.recap.reduce((acc, c) => acc + c.total_work_hours, 0).toFixed(1)} Jam
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
                <div className="bg-rose-50 p-3 rounded-xl text-rose-600">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-400">Total Keterlambatan</div>
                  <div className="text-xl font-bold text-rose-700">
                    {monthlyData.recap.reduce((acc, c) => acc + c.total_late_minutes, 0)} Menit
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subtab Switcher (Ringkasan vs Log Harian) & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="bg-slate-200 p-1 rounded-xl flex items-center space-x-1 w-full sm:w-auto">
              <button
                onClick={() => setActiveRecapSubtab('SUMMARY')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeRecapSubtab === 'SUMMARY'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                1. Ringkasan Akumulasi Karyawan ({filteredRecap.length})
              </button>
              <button
                onClick={() => setActiveRecapSubtab('DAILY_LOGS')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeRecapSubtab === 'DAILY_LOGS'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                2. Log Rincian Harian ({filteredLogs.length})
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={monthlyFilterSearch}
                onChange={(e) => setMonthlyFilterSearch(e.target.value)}
                placeholder="Cari dalam tabel..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 shadow-sm"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {loadingMonthly ? (
              <div className="p-12 text-center text-slate-400">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent mb-2"></div>
                <p className="text-sm">Menyiapkan rekapitulasi data kehadiran bulanan...</p>
              </div>
            ) : activeRecapSubtab === 'SUMMARY' ? (
              /* TABEL 1: RINGKASAN AKUMULASI KARYAWAN */
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Karyawan</th>
                      <th className="py-3 px-4">Jabatan</th>
                      <th className="py-3 px-4 text-center">Kehadiran</th>
                      <th className="py-3 px-4 text-center">Terlambat</th>
                      <th className="py-3 px-4 text-right">Menit Telat</th>
                      <th className="py-3 px-4 text-right">Total Jam Kerja</th>
                      <th className="py-3 px-4 text-right">Lembur</th>
                      <th className="py-3 px-4 text-center">Perangkat HP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecap.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          Tidak ada data karyawan.
                        </td>
                      </tr>
                    ) : (
                      filteredRecap.map((item) => (
                        <tr key={item.employee_id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800">{item.name}</div>
                            <div className="text-[11px] font-mono text-slate-400">{item.employee_code} • {item.phone}</div>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-700">
                            {item.position}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              {item.present_days} Hari
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {item.late_count > 0 ? (
                              <span className="font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                                {item.late_count} Kali
                              </span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700">
                            {item.total_late_minutes} m
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                            {item.total_work_hours} Jam
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-600">
                            {item.total_overtime_hours} Jam
                          </td>
                          <td className="py-3 px-4 text-center">
                            {item.is_device_locked ? (
                              <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                                <Lock className="w-3 h-3" /> Terdaftar
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                Belum Bind
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              /* TABEL 2: LOG RINCIAN HARIAN */
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Tanggal</th>
                      <th className="py-3 px-4">Karyawan</th>
                      <th className="py-3 px-4 text-center">Masuk</th>
                      <th className="py-3 px-4 text-center">Pulang</th>
                      <th className="py-3 px-4 text-center">Durasi</th>
                      <th className="py-3 px-4 text-right">Telat</th>
                      <th className="py-3 px-4 text-center">Alasan Terlambat / Komentar</th>
                      <th className="py-3 px-4 text-center">Lokasi GPS (Lat, Long)</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-400">
                          Belum ada log presensi tercatat pada bulan ini.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-800">
                            {log.date_formatted}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800">{log.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{log.employee_code} • {log.position}</div>
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700">
                            {log.clock_in}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-blue-700">
                            {log.clock_out}
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-slate-700">
                            {log.duration}
                          </td>
                          <td className="py-3 px-4 text-right font-mono">
                            {log.late_minutes > 0 ? (
                              <span className="text-rose-600 font-bold">+{log.late_minutes}m</span>
                            ) : (
                              <span className="text-slate-400">Tepat Waktu</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {log.late_reason || log.notes ? (
                              <div className="inline-flex items-start gap-1 px-2 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-[11px] max-w-[170px] text-left">
                                <MessageSquare className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                                <span className="italic font-medium truncate" title={log.late_reason || log.notes || undefined}>
                                  "{log.late_reason || log.notes}"
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-mono">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl bg-slate-50 border border-slate-200 text-[10px]">
                              <div className="flex items-center gap-1 font-bold text-slate-800">
                                <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                                <span className="truncate max-w-[110px]">{log.location_name || 'Outlet Coffeeshop'}</span>
                              </div>
                              <div className="flex items-center gap-1 font-mono text-[9px] text-slate-500">
                                <span>
                                  {log.latitude && log.longitude
                                    ? `${Number(log.latitude).toFixed(4)}, ${Number(log.longitude).toFixed(4)}`
                                    : '-6.2088, 106.8456'}
                                </span>
                                <a
                                  href={`https://www.google.com/maps?q=${log.latitude || -6.2088},${log.longitude || 106.8456}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-indigo-600 underline font-sans font-bold"
                                  title="Buka Google Maps"
                                >
                                  Maps ↗
                                </a>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded text-[11px]">
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      )}

      {/* Modal Perbesar QR Presensi */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">QR Presensi Outlet</h3>
              <p className="text-xs text-slate-500">Scan menggunakan kamera HP staf masing-masing</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 inline-block shadow-inner">
              <img
                src={getQrCodeUrl(mobileScanUrl, 260)}
                alt="QR Code Besar"
                className="w-64 h-64 mx-auto rounded-xl shadow"
              />
            </div>
            <div className="text-xs font-mono bg-slate-100 py-1.5 px-3 rounded-lg text-slate-600 break-all">
              {mobileScanUrl}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowQrModal(false);
                  setShowPrintModal(true);
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Poster</span>
              </button>
              <button
                onClick={() => setShowQrModal(false)}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cetak Poster QR (Stiker Dinding / Meja Akrilik) */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative space-y-5 border border-slate-200">
            <button
              onClick={() => setShowPrintModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Poster Card (Siap Diprint / Pajang) */}
            <div className="border-4 border-slate-900 rounded-3xl p-6 text-center space-y-4 bg-gradient-to-b from-amber-50/50 to-white shadow-md">
              <div className="inline-block bg-slate-900 text-white px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest">
                ☕ ESB Coffeeshop ERP
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">PAPAN PRESENSI OUTLET</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Scan Kamera HP untuk Clock-In Masuk & Pulang</p>
              </div>

              {/* QR Image */}
              <div className="bg-white p-3 rounded-2xl border-2 border-slate-300 inline-block shadow-inner">
                <img
                  src={getQrCodeUrl(mobileScanUrl, 260)}
                  alt="Poster QR"
                  className="w-56 h-56 mx-auto rounded-xl"
                />
              </div>

              {/* 3 Langkah Instruksi */}
              <div className="text-left bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1.5 text-slate-700">
                <div className="font-bold text-slate-900 text-[11px] uppercase tracking-wider mb-1">
                  📋 Petunjuk Staf Coffeeshop:
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span>Buka menu <strong>Presensi di HP</strong> masing-masing.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span>Arahkan kamera HP ke QR Code di atas.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <span>Otomatis tercatat Masuk/Pulang (Anti-Titip Absen 1 HP = 1 Staf).</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 font-mono">
                Token: {outletQrValue}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Poster / Simpan PDF</span>
              </button>
              <button
                onClick={() => setShowPrintModal(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-5 py-3 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceKiosk;
