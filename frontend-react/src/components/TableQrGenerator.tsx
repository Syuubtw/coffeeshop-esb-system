import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Printer,
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Search,
  RefreshCw,
  Coffee,
  Users,
  Sparkles,
  MapPin,
  X
} from 'lucide-react';
import api from '../services/api';
import { getQrCodeUrl } from '../utils/qrCode';
import { formatTableDisplayName } from '../utils/tableHelper';

interface DiningTable {
  id: number;
  table_number: string;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
  qr_token?: string;
  order_url?: string;
}

// Default fallback tables if backend not yet reached
const FALLBACK_TABLES: DiningTable[] = [
  { id: 1, table_number: 'TB-01', capacity: 2, status: 'AVAILABLE' },
  { id: 2, table_number: 'TB-02', capacity: 2, status: 'AVAILABLE' },
  { id: 3, table_number: 'TB-03', capacity: 4, status: 'AVAILABLE' },
  { id: 4, table_number: 'TB-04', capacity: 4, status: 'AVAILABLE' },
  { id: 5, table_number: 'TB-05', capacity: 4, status: 'AVAILABLE' },
  { id: 6, table_number: 'TB-06', capacity: 6, status: 'AVAILABLE' },
  { id: 7, table_number: 'TB-07', capacity: 6, status: 'AVAILABLE' },
  { id: 8, table_number: 'TB-08', capacity: 8, status: 'AVAILABLE' },
  { id: 9, table_number: 'TB-09', capacity: 4, status: 'AVAILABLE' },
  { id: 10, table_number: 'TB-10', capacity: 4, status: 'AVAILABLE' },
  { id: 11, table_number: 'TB-11', capacity: 2, status: 'AVAILABLE' },
  { id: 12, table_number: 'TB-12', capacity: 2, status: 'AVAILABLE' },
  { id: 13, table_number: 'TB-VIP-01', capacity: 10, status: 'AVAILABLE' },
  { id: 14, table_number: 'TB-VIP-02', capacity: 8, status: 'AVAILABLE' },
  { id: 15, table_number: 'TB-BAR-01', capacity: 1, status: 'AVAILABLE' },
  { id: 16, table_number: 'TB-BAR-02', capacity: 1, status: 'AVAILABLE' },
  { id: 17, table_number: 'TB-BAR-03', capacity: 1, status: 'AVAILABLE' },
  { id: 18, table_number: 'TB-BAR-04', capacity: 1, status: 'AVAILABLE' },
  { id: 19, table_number: 'TB-OUT-01', capacity: 4, status: 'AVAILABLE' },
  { id: 20, table_number: 'TB-OUT-02', capacity: 4, status: 'AVAILABLE' },
];

export const TableQrGenerator: React.FC = () => {
  const [tables, setTables] = useState<DiningTable[]>(FALLBACK_TABLES);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState<'ALL' | 'INDOOR' | 'VIP' | 'BAR' | 'OUTDOOR'>('ALL');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Modal Add Table
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newCapacity, setNewCapacity] = useState(4);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Single Table Print Modal / Target
  const [singlePrintTable, setSinglePrintTable] = useState<DiningTable | null>(null);

  // Base origin URL for customer order
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';

  const fetchTables = async () => {
    setLoading(true);
    try {
      const res = await api.get('/qr/tables');
      if (res.data?.status === 'success' && Array.isArray(res.data.data)) {
        setTables(res.data.data);
      }
    } catch {
      // Fallback kept intact
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const getTableArea = (tableNumber: string): 'INDOOR' | 'VIP' | 'BAR' | 'OUTDOOR' => {
    const num = tableNumber.toUpperCase();
    if (num.includes('VIP')) return 'VIP';
    if (num.includes('BAR')) return 'BAR';
    if (num.includes('OUT')) return 'OUTDOOR';
    return 'INDOOR';
  };

  const getAreaBadgeColor = (area: 'INDOOR' | 'VIP' | 'BAR' | 'OUTDOOR') => {
    switch (area) {
      case 'VIP':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'BAR':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'OUTDOOR':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  const getAreaLabel = (area: 'INDOOR' | 'VIP' | 'BAR' | 'OUTDOOR') => {
    switch (area) {
      case 'VIP':
        return 'Ruang VIP';
      case 'BAR':
        return 'Meja Bar';
      case 'OUTDOOR':
        return 'Area Outdoor';
      default:
        return 'Area Indoor';
    }
  };

  const filteredTables = tables.filter((t) => {
    const area = getTableArea(t.table_number);
    if (areaFilter !== 'ALL' && area !== areaFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        t.table_number.toLowerCase().includes(q) ||
        getAreaLabel(area).toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCopyLink = (tableNumber: string, id: number) => {
    const url = `${origin}/order/table/${tableNumber}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNumber.trim()) {
      alert('Nomor meja wajib diisi!');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.post('/qr/tables', {
        table_number: newTableNumber.trim().toUpperCase(),
        capacity: Number(newCapacity) || 4,
      });
      alert(res.data?.message || 'Meja baru berhasil ditambahkan!');
      setShowAddModal(false);
      setNewTableNumber('');
      setNewCapacity(4);
      fetchTables();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menambahkan meja baru');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTable = async (t: DiningTable) => {
    if (!confirm(`Hapus meja ${t.table_number}? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }
    try {
      const res = await api.delete(`/qr/tables/${t.id}`);
      alert(res.data?.message || `Meja ${t.table_number} berhasil dihapus.`);
      fetchTables();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus meja');
    }
  };

  const handlePrintAll = () => {
    setSinglePrintTable(null);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handlePrintSingle = (t: DiningTable) => {
    setSinglePrintTable(t);
    setTimeout(() => {
      window.print();
      setSinglePrintTable(null);
    }, 150);
  };

  const tablesToPrint = singlePrintTable ? [singlePrintTable] : filteredTables;

  return (
    <div className="space-y-6">
      {/* Print Specific CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 10mm;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          .page-break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* Screen Header (Hidden on Print) */}
      <div className="no-print bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 shadow-inner">
            <QrCode className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Pusat QR Code & Stiker Meja Pelanggan
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Self-Order Table
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Kelola, pantau, dan cetak stiker QR meja untuk pemesanan mandiri oleh pelanggan langsung dari meja kafe.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchTables()}
            disabled={loading}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            title="Refresh Data Meja"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Tambah Meja
          </button>

          <button
            onClick={handlePrintAll}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs sm:text-sm font-black shadow-md shadow-emerald-600/20 transition active:scale-95"
          >
            <Printer className="w-4 h-4" />
            Cetak Stiker Meja ({filteredTables.length})
          </button>
        </div>
      </div>

      {/* Metrics & Filter Bar (Hidden on Print) */}
      <div className="no-print space-y-4">
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 block">Total Meja Kedai</span>
              <span className="text-2xl font-black text-slate-900">{tables.length}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              <MapPin className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-600 block">Meja Kosong (Tersedia)</span>
              <span className="text-2xl font-black text-emerald-600">
                {tables.filter((t) => t.status === 'AVAILABLE').length}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Check className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-amber-600 block">Meja Terisi Pelanggan</span>
              <span className="text-2xl font-black text-amber-600">
                {tables.filter((t) => t.status === 'OCCUPIED').length}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Coffee className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-purple-600 block">Total Kapasitas Kursi</span>
              <span className="text-2xl font-black text-purple-600">
                {tables.reduce((acc, t) => acc + (t.capacity || 4), 0)} Tamu
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search */}
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {(
              [
                { id: 'ALL', label: 'Semua Area' },
                { id: 'INDOOR', label: 'Indoor Reguler' },
                { id: 'VIP', label: 'Area VIP' },
                { id: 'BAR', label: 'Meja Bar' },
                { id: 'OUTDOOR', label: 'Outdoor' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setAreaFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  areaFilter === tab.id
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode meja (misal: TB-01, VIP)..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
            />
          </div>
        </div>
      </div>

      {/* Main Table Sticker Grid (Also Used as Printable Area) */}
      <div id="print-area">
        {/* Header Only on Print */}
        <div className="hidden print:block mb-6 text-center border-b-2 border-slate-800 pb-4">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Coffee className="w-7 h-7 text-amber-700" />
            <h1 className="text-2xl font-black text-slate-900 tracking-wider">
              COFFEESHOP ENTERPRISE
            </h1>
          </div>
          <p className="text-xs text-slate-600 font-medium">
            Lembar Stiker QR Code Meja Pelanggan — Silakan Gunting Mengikuti Garis Tepi dan Tempel pada Meja
          </p>
        </div>

        {/* Sticker Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 print:grid-cols-2 print:gap-4">
          {tablesToPrint.map((t) => {
            const tableArea = getTableArea(t.table_number);
            const customerOrderUrl = `${origin}/order/table/${t.table_number}`;
            const qrUrl = getQrCodeUrl(customerOrderUrl, 300);

            return (
              <div
                key={t.id}
                className="page-break-inside-avoid bg-white rounded-2xl border-2 border-slate-200/90 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden relative print:border-2 print:border-dashed print:border-slate-400 print:shadow-none print:rounded-xl"
              >
                {/* Visual Top Accent Bar */}
                <div
                  className={`h-2 w-full ${
                    tableArea === 'VIP'
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-500'
                      : tableArea === 'BAR'
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                      : tableArea === 'OUTDOOR'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600'
                  }`}
                />

                {/* Card Top Information */}
                <div className="p-4 pb-2 flex items-center justify-between border-b border-slate-100">
                  <span
                    className={`px-2.5 py-1 rounded-md text-[11px] font-black border uppercase tracking-wider ${getAreaBadgeColor(
                      tableArea
                    )}`}
                  >
                    {getAreaLabel(tableArea)}
                  </span>

                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <Users className="w-3.5 h-3.5" />
                    <span>{t.capacity || 4} Kursi</span>
                  </div>
                </div>

                {/* Printable Sticker Body */}
                <div className="p-5 text-center flex flex-col items-center flex-1 justify-center bg-slate-50/50 print:bg-white print:p-4">
                  {/* Brand Tag */}
                  <div className="flex items-center gap-1.5 text-slate-800 font-extrabold text-xs tracking-widest uppercase mb-1">
                    <Coffee className="w-4 h-4 text-amber-600" />
                    <span>COFFEE SHOP</span>
                  </div>

                  {/* Big Friendly Table Name */}
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight my-0.5">
                    {formatTableDisplayName(t.table_number)}
                  </h2>
                  <span className="text-[11px] font-mono text-slate-400 font-bold tracking-wider block mb-1">
                    ({t.table_number})
                  </span>

                  {/* Sub Instruction */}
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Pindai untuk Pesan & Bayar
                  </p>

                  {/* High Quality QR Frame */}
                  <div className="p-3 bg-white rounded-2xl border-2 border-slate-200/80 shadow-inner inline-block my-1 print:border print:border-slate-300">
                    <img
                      src={qrUrl}
                      alt={`QR Code ${t.table_number}`}
                      className="w-36 h-36 sm:w-40 sm:h-40 object-contain print:w-36 print:h-36"
                      loading="lazy"
                    />
                  </div>

                  {/* URL Display */}
                  <div className="mt-3 px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-mono text-slate-600 max-w-full truncate">
                    {customerOrderUrl.replace(/^https?:\/\//, '')}
                  </div>
                </div>

                {/* Status Indicator & Live Preview Link */}
                <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        t.status === 'AVAILABLE'
                          ? 'bg-emerald-500 animate-pulse'
                          : 'bg-amber-500'
                      }`}
                    />
                    <span className="font-semibold text-slate-600">
                      {t.status === 'AVAILABLE' ? 'Tersedia' : 'Terisi Pelanggan'}
                    </span>
                  </div>

                  <a
                    href={customerOrderUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="no-print text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 hover:underline text-[11px]"
                  >
                    Buka Menu <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Card Bottom Actions (Hidden on Print) */}
                <div className="no-print p-3 bg-slate-50 border-t border-slate-100 flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopyLink(t.table_number, t.id)}
                    className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1"
                    title="Salin Link Pemesanan"
                  >
                    {copiedId === t.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-extrabold">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Salin Link</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handlePrintSingle(t)}
                    className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm"
                    title="Cetak Stiker Meja Ini Saja"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak</span>
                  </button>

                  <button
                    onClick={() => handleDeleteTable(t)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Hapus Meja Ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredTables.length === 0 && (
          <div className="no-print bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
              <QrCode className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Tidak ada meja yang sesuai</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Tidak ditemukan data meja dengan filter pencarian saat ini. Silakan ubah filter atau tambahkan meja baru.
            </p>
          </div>
        )}
      </div>

      {/* Modal Tambah Meja Baru (Hidden on Print) */}
      {showAddModal && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Tambah Meja Baru</h3>
                  <p className="text-xs text-slate-500">Daftarkan nomor meja untuk pelanggan</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTable} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nomor / Kode Meja <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: TB-13, TB-VIP-03, TB-OUT-03"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 uppercase transition"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Format rekomendasi: TB-01 (Indoor), TB-VIP-01 (VIP), TB-BAR-01 (Bar), TB-OUT-01 (Outdoor)
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Kapasitas Kursi (Jumlah Tamu)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-md shadow-amber-600/20 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Meja Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
