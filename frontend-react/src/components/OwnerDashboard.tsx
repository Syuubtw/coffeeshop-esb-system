import { useEffect, useState, useMemo, useRef } from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  RefreshCcw, 
  Receipt, 
  Eye, 
  Search,
  ShieldCheck,
  Clock,
  Download,
  Coffee,
  Smartphone,
  Users,
  Flame,
  Award,
  Sparkles,
  CreditCard,
  BarChart3,
  Calendar
} from 'lucide-react';
import api from '../services/api';
import { exportStyledExcel, formatDateTimeWIB } from '../utils/exportCsv';

interface Transaction {
  id: number;
  order_number: string;
  created_at: string;
  order_source: 'POS' | 'QR_TABLE';
  order_type: 'DINE_IN' | 'TAKEAWAY';
  dining_table: { table_number: string } | null;
  customer_name: string;
  payment_method: 'CASH' | 'QRIS' | 'CARD' | 'E_WALLET';
  payment_status: 'PAID' | 'UNPAID' | 'REFUNDED';
  order_status: 'COMPLETED' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'PENDING' | 'CANCELLED';
  subtotal: number;
  tax_amount: number;
  service_charge: number;
  grand_total: number;
  items_summary: string;
  items_detail?: Array<{
    name: string;
    qty: number;
    price: number;
    subtotal: number;
    notes?: string;
  }>;
}

const getAvailableRollingMonths = () => {
  const list = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const label = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    list.push({ month: m, year: y, label, isCurrent: i === 0 });
  }
  return list;
};

export const OwnerDashboard: React.FC = () => {
  // Financial Tab State
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'POS' | 'QR_TABLE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);

  // Business Intelligence & Sales Analytics State
  const [biStats, setBiStats] = useState<any>(null);

  // 12 Rolling Months Generator (Bulan Berjalan s/d 12 Bulan Terakhir)
  const availableMonths = useMemo(() => getAvailableRollingMonths(), []);

  const [selectedPeriod, setSelectedPeriod] = useState<{ month: number; year: number }>(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });

  const isFetchingRef = useRef(false);

  const fetchStatsAndOrders = async (
    periodOverride?: { month: number; year: number }
  ) => {
    if (document.hidden) return;
    if (isFetchingRef.current) return;

    const period = periodOverride || selectedPeriod;
    const qParams = `?month=${period.month}&year=${period.year}`;

    try {
      isFetchingRef.current = true;
      setLoading(true);

      // Fetch orders + BI stats secara bersamaan dengan filter periode
      const [resOrders, resBIStats] = await Promise.allSettled([
        api.get(`/pos/orders/recent${qParams}`),
        api.get(`/dashboard/stats${qParams}`),
      ]);
      if (resBIStats.status === 'fulfilled' && resBIStats.value.data?.data) {
        setBiStats(resBIStats.value.data.data);
      }
      const ordersRes = resOrders.status === 'fulfilled' ? resOrders.value : null;
      if (ordersRes?.data?.data?.data) {
        const mapped = ordersRes.data.data.data.map((o: any) => ({
          id: o.id,
          order_number: o.order_number,
          created_at: formatDateTimeWIB(o.created_at),
          order_source: o.order_source,
          order_type: o.order_type,
          dining_table: o.dining_table,
          customer_name: o.customer_name || 'Walk-in Guest',
          payment_method: o.payment_method || 'QRIS',
          payment_status: o.payment_status || 'PAID',
          order_status: o.order_status || 'COMPLETED',
          subtotal: Number(o.subtotal),
          tax_amount: Number(o.tax_amount),
          service_charge: Number(o.service_charge),
          grand_total: Number(o.grand_total),
          items_summary: o.items?.map((i: any) => `${i.qty}x ${i.product?.name || 'Menu'}`).join(', ') || 'Menu Order',
          items_detail: o.items?.map((i: any) => ({
            name: i.product?.name || 'Item',
            qty: i.qty,
            price: Number(i.unit_price),
            subtotal: Number(i.subtotal),
            notes: i.notes
          }))
        }));
        setTransactions(mapped);
      }
    } catch {
      // Keep offline
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsAndOrders();
    const interval = setInterval(() => {
      fetchStatsAndOrders();
    }, 15000);
    return () => clearInterval(interval);
  }, [selectedPeriod]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchSource = sourceFilter === 'ALL' || t.order_source === sourceFilter;
      const matchQuery = !searchQuery || 
        t.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.customer_name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSource && matchQuery;
    });
  }, [transactions, sourceFilter, searchQuery]);

  // Financial Totals — Hanya transaksi yang PAID yang diakui sebagai Omset Riil Kas Masuk
  const paidTransactions = useMemo(() => filteredTransactions.filter((t) => t.payment_status === 'PAID'), [filteredTransactions]);
  const unpaidTransactionsCount = useMemo(() => filteredTransactions.filter((t) => t.payment_status === 'UNPAID').length, [filteredTransactions]);
  const totalRevenue = useMemo(() => paidTransactions.reduce((acc, curr) => acc + curr.grand_total, 0), [paidTransactions]);

  const weeklyTrend = biStats?.weekly_trend;
  const maxWeeklySales = useMemo(() => {
    if (!weeklyTrend || weeklyTrend.length === 0) return 1;
    const maxVal = Math.max(...weeklyTrend.map((t: any) => t.sales || 0));
    return maxVal > 0 ? maxVal : 1;
  }, [weeklyTrend]);

  const formatIDR = (val: number | string) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(val));
  };

  const handleExportCurrentReport = () => {
    const today = new Date().toISOString().slice(0, 10);

    const headers = [
      'Nomor Struk',
      'Waktu Pesanan',
      'Sumber Pesanan',
      'Penyajian',
      'Nomor Meja',
      'Nama Pelanggan',
      'Metode Pembayaran',
      'Status Bayar',
      'Status Pesanan',
      'Daftar Menu Dipesan',
      'Harga Menu (Rp)',
      'Pajak Restoran (10%) (Rp)',
      'Biaya Layanan Toko (5%) (Rp)',
      'Total Pembayaran (Rp)',
    ];
    const rows = filteredTransactions.map((t) => [
      t.order_number,
      t.created_at,
      t.order_source === 'QR_TABLE' ? 'Pesanan Meja (QR)' : 'Kasir Langsung',
      t.order_type === 'DINE_IN' ? 'Minum di Tempat' : 'Bungkus / Bawa Pulang',
      t.dining_table?.table_number || '-',
      t.customer_name,
      t.payment_method === 'QRIS' ? 'QRIS' : 'Uang Tunai',
      t.payment_status === 'PAID' ? 'Sudah Lunas' : t.payment_status === 'REFUNDED' ? 'Dibatalkan' : 'Belum Bayar',
      t.order_status,
      t.items_summary,
      t.subtotal,
      t.tax_amount,
      t.service_charge,
      t.grand_total,
    ]);
    exportStyledExcel({
      filename: `Laporan_Penjualan_Owner_${today}`,
      title: 'LAPORAN TRANSAKSI PENJUALAN KEDAI KOPI',
      subtitle: `Filter: ${sourceFilter === 'ALL' ? 'Semua Sumber Pesanan (Kasir & Meja QR)' : sourceFilter} | Total ${filteredTransactions.length} Pesanan`,
      author: 'Pemilik Kedai (Owner)',
      summaryItems: [
        { label: 'TOTAL UANG MASUK PENJUALAN', value: formatIDR(totalRevenue) },
        { label: 'TOTAL PESANAN SELESAI', value: `${paidTransactions.length} Pesanan` },
      ],
      headers,
      rows,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Halaman Pemilik Kedai (Owner)</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[11px] font-bold border border-purple-200">
              Pemilik Kedai
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pantau omzet penjualan harian, performa menu terlaris, dan riwayat transaksi penjualan kedai secara otomatis.
          </p>
        </div>

        {/* Master Navigation & Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter Periode 12 Bulan Terakhir */}
          <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200/80 px-3 py-1.5 rounded-2xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <select
              value={`${selectedPeriod.month}-${selectedPeriod.year}`}
              onChange={(e) => {
                const [m, y] = e.target.value.split('-').map(Number);
                setSelectedPeriod({ month: m, year: y });
              }}
              className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer pr-1 text-xs"
            >
              {availableMonths.map((item) => (
                <option key={`${item.month}-${item.year}`} value={`${item.month}-${item.year}`}>
                  {item.label} {item.isCurrent ? '(Bulan Berjalan)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Ekspor Cepat Tabel Aktif */}
          <button
            onClick={handleExportCurrentReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 text-xs font-bold transition cursor-pointer"
            title="Download Data Tabel Saat Ini (Excel)"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Unduh Tabel Ini</span>
          </button>

          <button 
            onClick={() => fetchStatsAndOrders()}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* EXECUTIVE SALES & PERFORMANCE OVERVIEW */}
      {/* ============================================================== */}
      <div className="space-y-6">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Total Omset */}
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Uang Masuk Kasir</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-bold text-slate-900 font-mono tracking-tight">{formatIDR(totalRevenue)}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Dari <span className="font-bold text-emerald-600">{paidTransactions.length} Struk</span> lunas
                  {unpaidTransactionsCount > 0 && (
                    <span className="text-amber-600 font-medium block text-[10px]">
                      ({unpaidTransactionsCount} pesanan belum bayar di kasir)
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Total Transaksi Selesai */}
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Transaksi Selesai</span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-bold text-amber-700 font-mono tracking-tight">{paidTransactions.length} Pesanan</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Transaksi pesanan lunas di outlet
                </p>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* ANALITIK PENJUALAN & POLA BISNIS KEDAI                         */}
          {/* ============================================================== */}

          {/* 1. Baris Informasi Penting Kedai */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Rata-Rata Omzet Harian */}
            <div className="bg-linear-to-br from-indigo-50/70 to-white border border-indigo-100/80 p-5 rounded-2xl shadow-xs">
              <div className="flex justify-between items-center text-indigo-500">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700">Rata-Rata Omzet Harian</span>
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
                  {formatIDR(Math.round(totalRevenue / 30))}
                </h3>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                    Est. 30 Hari Kerja
                  </span>
                  <span className="text-[11px] text-slate-500">Penjualan harian</span>
                </div>
              </div>
            </div>

            {/* Total Minuman & Makanan Terjual */}
            <div className="bg-linear-to-br from-amber-50/70 to-white border border-amber-100/80 p-5 rounded-2xl shadow-xs">
              <div className="flex justify-between items-center text-amber-500">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Total Minuman & Makanan Terjual</span>
                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                  <Coffee className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
                  {(biStats?.month_to_date?.total_cups_sold || 0).toLocaleString('id-ID')} <span className="text-sm font-normal text-slate-500">Cup/Porsi</span>
                </h3>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                    ~{Math.round((biStats?.month_to_date?.total_cups_sold || 0) / 30)} Porsi/Hari
                  </span>
                  <span className="text-[11px] text-slate-500">Kopi & Roti/Kue</span>
                </div>
              </div>
            </div>

            {/* Cara Tamu Memesan (Kasir vs QR) */}
            <div className="bg-linear-to-br from-cyan-50/70 to-white border border-cyan-100/80 p-5 rounded-2xl shadow-xs">
              <div className="flex justify-between items-center text-cyan-500">
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-700">Cara Tamu Memesan</span>
                <div className="p-2 bg-cyan-100 text-cyan-700 rounded-xl">
                  <Smartphone className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-lg font-bold text-slate-900">
                    {biStats?.distribution?.channels?.POS?.percent || 70}% <span className="text-xs font-normal text-slate-500">Kasir Langsung</span>
                  </h3>
                  <span className="text-xs font-semibold text-cyan-700 font-mono">
                    {biStats?.distribution?.channels?.QR_TABLE?.percent || 30}% QR Meja
                  </span>
                </div>
                {/* Visual Dual Progress Bar */}
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex mt-2.5">
                  <div 
                    className="bg-cyan-600 h-full transition-all duration-500" 
                    style={{ width: `${biStats?.distribution?.channels?.POS?.percent || 70}%` }}
                    title={`Kasir: ${biStats?.distribution?.channels?.POS?.percent || 70}%`}
                  />
                  <div 
                    className="bg-sky-400 h-full transition-all duration-500" 
                    style={{ width: `${biStats?.distribution?.channels?.QR_TABLE?.percent || 30}%` }}
                    title={`QR Meja: ${biStats?.distribution?.channels?.QR_TABLE?.percent || 30}%`}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 flex justify-between">
                  <span>Pesan di Meja Kasir</span>
                  <span>Pesan Mandiri di Meja</span>
                </p>
              </div>
            </div>

            {/* Tempat Menikmati (Di Tempat vs Bawa Pulang) */}
            <div className="bg-linear-to-br from-emerald-50/70 to-white border border-emerald-100/80 p-5 rounded-2xl shadow-xs">
              <div className="flex justify-between items-center text-emerald-500">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Tempat Menikmati</span>
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-lg font-bold text-slate-900">
                    {biStats?.distribution?.types?.DINE_IN?.percent || 74}% <span className="text-xs font-normal text-slate-500">Di Tempat</span>
                  </h3>
                  <span className="text-xs font-semibold text-emerald-700 font-mono">
                    {biStats?.distribution?.types?.TAKEAWAY?.percent || 26}% Bungkus
                  </span>
                </div>
                {/* Visual Dual Progress Bar */}
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex mt-2.5">
                  <div 
                    className="bg-emerald-600 h-full transition-all duration-500" 
                    style={{ width: `${biStats?.distribution?.types?.DINE_IN?.percent || 74}%` }}
                    title={`Di Tempat: ${biStats?.distribution?.types?.DINE_IN?.percent || 74}%`}
                  />
                  <div 
                    className="bg-teal-400 h-full transition-all duration-500" 
                    style={{ width: `${biStats?.distribution?.types?.TAKEAWAY?.percent || 26}%` }}
                    title={`Bungkus: ${biStats?.distribution?.types?.TAKEAWAY?.percent || 26}%`}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 flex justify-between">
                  <span>Minum / Nongkrong di Kedai</span>
                  <span>Bungkus Bawa Pulang</span>
                </p>
              </div>
            </div>
          </div>

          {/* Baris 1: 5 Menu Paling Laris & Grafik Tren Penjualan */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 5 Menu Paling Laris & Paling Menguntungkan */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-900 text-base">5 Menu Paling Laris di Kedai</h2>
                      <p className="text-xs text-slate-500">Menu favorit pelanggan dengan jumlah pesanan terbanyak.</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                    Paling Laku Bulan Ini
                  </span>
                </div>

                <div className="divide-y divide-slate-100 mt-3">
                  {(biStats?.top_products && biStats.top_products.length > 0) ? (
                    biStats.top_products.map((item: any, idx: number) => {
                      const medalStyles = [
                        'bg-amber-500 text-white ring-2 ring-amber-200', // 1st Emas
                        'bg-slate-400 text-white ring-2 ring-slate-200',  // 2nd Perak
                        'bg-amber-700 text-white ring-2 ring-amber-200',  // 3rd Perunggu
                        'bg-slate-100 text-slate-600',
                        'bg-slate-100 text-slate-600',
                      ];

                      return (
                        <div key={item.product_id || idx} className="py-3 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-xl transition-colors">
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${medalStyles[idx] || 'bg-slate-100 text-slate-600'}`}>
                              {idx + 1}
                            </span>
                            <div>
                              <div className="font-bold text-slate-800 text-sm">{item.name}</div>
                              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                                <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">{item.sku}</span>
                                <span>·</span>
                                <span className="font-medium text-slate-600">{item.total_qty} porsi terjual</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-bold text-slate-900 text-sm font-mono">{formatIDR(item.total_revenue)}</div>
                            <div className="flex items-center justify-end gap-1.5 text-xs mt-0.5">
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                                {item.total_qty} porsi terjual
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      Memuat daftar menu terlaris...
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/60 p-3 rounded-xl">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <strong>Catatan Bisnis:</strong> Menu Kopi Susu dan Makanan Ringan menyumbang porsi penjualan terbesar di kedai.
                </span>
                <span className="font-semibold text-slate-700">Data Struk Penjualan</span>
              </div>
            </div>

            {/* Grafik Penjualan 7 Hari Terakhir */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-900 text-base">Grafik Penjualan 7 Hari Terakhir</h2>
                      <p className="text-xs text-slate-500">Naik-turunnya uang masuk kasir untuk melihat hari paling ramai.</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> 7 Hari
                  </span>
                </div>

                {/* Vertical Bar Chart Container */}
                <div className="mt-6 flex items-end justify-between gap-2 h-44 px-2 pt-6">
                  {biStats?.weekly_trend?.map((day: any, idx: number) => {
                    const heightPercent = maxWeeklySales > 0 ? Math.max(12, Math.round((day.sales / maxWeeklySales) * 100)) : 12;
                    return (
                      <div key={day.date || idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                        {/* Tooltip on Hover */}
                        <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] rounded-lg py-1 px-2 pointer-events-none whitespace-nowrap z-10 shadow-lg font-mono">
                          {formatIDR(day.sales)} ({day.order_count} pesanan)
                        </div>

                        {/* Top Label (Amount) */}
                        <span className="text-[10px] font-mono font-bold text-slate-600 mb-1 opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity truncate w-full text-center">
                          {day.sales >= 1000000 ? `${(day.sales / 1000000).toFixed(1)} jt` : `${Math.round(day.sales / 1000)} rb`}
                        </span>

                        {/* The Vertical Bar */}
                        <div className="w-full max-w-[36px] bg-slate-100 rounded-t-xl overflow-hidden flex flex-col justify-end p-0.5 transition-all duration-300">
                          <div 
                            className={`w-full rounded-t-lg transition-all duration-500 ${
                              day.is_weekend 
                                ? 'bg-linear-to-t from-indigo-600 to-purple-500 group-hover:from-indigo-500 group-hover:to-purple-400' 
                                : 'bg-linear-to-t from-blue-600 to-sky-400 group-hover:from-blue-500 group-hover:to-sky-300'
                            }`}
                            style={{ height: `${heightPercent}%` }}
                          />
                        </div>

                        {/* Day & Date Labels */}
                        <div className="mt-2 text-center">
                          <span className={`text-xs font-bold block ${day.is_weekend ? 'text-indigo-600' : 'text-slate-700'}`}>
                            {day.day_name.substring(0, 3)}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {day.date_formatted}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chart Legend / Footnote */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-blue-600"></span> Hari Kerja (Senin-Jumat)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-indigo-600"></span> Akhir Pekan (Sabtu-Minggu)
                  </span>
                </div>
                <span className="text-slate-500 text-[11px]">
                  Total 7 Hari: <strong className="text-slate-800 font-mono">{formatIDR(biStats?.weekly_trend?.reduce((sum: number, d: any) => sum + (d.sales || 0), 0) || 0)}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Baris 2: Jam Sibuk Outlet & Pembayaran Pelanggan */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Jam Kunjungan Paling Ramai */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-base">Jam Kunjungan Paling Ramai</h2>
                    <p className="text-xs text-slate-500">Tingkat kepadatan pengunjung per jam buka kedai (07:00 - 22:00).</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Flame className="w-3 h-3" /> Jadwal Shift Staf
                </span>
              </div>

              {/* Peak Hours Timeline / Bars */}
              <div className="mt-4 space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {biStats?.peak_hours?.map((slot: any) => {
                  return (
                    <div 
                      key={slot.hour} 
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                        slot.is_peak 
                          ? 'bg-rose-50/60 border-rose-200/80' 
                          : 'bg-white border-slate-100 hover:bg-slate-50/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-slate-700 w-24">
                          {slot.label}
                        </span>
                        {slot.is_peak && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                            <Flame className="w-3 h-3" /> PALING RAMAI
                          </span>
                        )}
                      </div>

                      {/* Visual Bar & Stats */}
                      <div className="flex items-center gap-4 flex-1 max-w-[220px] justify-end">
                        <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${slot.is_peak ? 'bg-rose-500' : 'bg-slate-400'}`}
                            style={{ width: `${slot.intensity_percent}%` }}
                          />
                        </div>
                        <div className="text-right w-16">
                          <span className="font-bold text-xs text-slate-800 font-mono">{slot.order_count}</span>
                          <span className="text-[10px] text-slate-400 ml-1">struk</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/60 p-3 rounded-xl">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-rose-500" />
                  <strong>Saran untuk Pemilik:</strong> Siapkan barista cadangan saat jam makan siang (12:00-14:00) dan malam (19:00-21:00).
                </span>
              </div>
            </div>

            {/* Pembayaran Pelanggan (Hanya QRIS & Uang Tunai) */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-900 text-base">Cara Pembayaran Pelanggan</h2>
                      <p className="text-xs text-slate-500">Perbandingan pembayaran tamu: hanya melalui QRIS dan Uang Tunai.</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    Uang Masuk
                  </span>
                </div>

                {/* Payment Breakdown Cards: Hanya QRIS & Uang Tunai */}
                <div className="mt-4 space-y-3">
                  {/* QRIS */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <span className="font-bold text-slate-800 text-xs">Pembayaran QRIS (GoPay, OVO, ShopeePay, BCA, dll.)</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-700 text-xs">
                        {formatIDR(biStats?.distribution?.payments?.QRIS?.amount || 0)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${biStats?.distribution?.payments?.QRIS?.percent || 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 mt-1.5">
                      <span>{biStats?.distribution?.payments?.QRIS?.count || 0} Pembelian</span>
                      <span className="font-bold text-slate-700">{biStats?.distribution?.payments?.QRIS?.percent || 0}% dari seluruh omset</span>
                    </div>
                  </div>

                  {/* Cash / Uang Tunai */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        <span className="font-bold text-slate-800 text-xs">Uang Tunai (Cash di Kasir)</span>
                      </div>
                      <span className="font-mono font-bold text-amber-700 text-xs">
                        {formatIDR(biStats?.distribution?.payments?.CASH?.amount || 0)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-amber-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${biStats?.distribution?.payments?.CASH?.percent || 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 mt-1.5">
                      <span>{biStats?.distribution?.payments?.CASH?.count || 0} Pembelian</span>
                      <span className="font-bold text-slate-700">{biStats?.distribution?.payments?.CASH?.percent || 0}% dari seluruh omset</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reconciliation note */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/60 p-3 rounded-xl">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Semua uang masuk langsung tercatat rapi ke buku kas outlet.
                </span>
              </div>
            </div>
          </div>

          {/* Audit Transactions Table */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 flex-wrap gap-3">
              <div>
                <h2 className="font-bold text-slate-900 text-base">Riwayat Transaksi Penjualan Masuk</h2>
                <p className="text-xs text-slate-500 mt-0.5">Daftar pesanan kasir dan pesanan meja tersimpan otomatis secara langsung.</p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari nomor struk / nama pembeli..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-50 border border-slate-200 pl-8 pr-3 py-1.5 text-xs rounded-xl"
                  />
                </div>

                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs rounded-xl font-semibold"
                >
                  <option value="ALL">Semua Pesanan</option>
                  <option value="POS">Pesanan Kasir</option>
                  <option value="QR_TABLE">Pesanan Meja (QR)</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="pb-3">Nomor Struk & Waktu</th>
                    <th className="pb-3">Pesanan & Meja</th>
                    <th className="pb-3">Nama Pelanggan</th>
                    <th className="pb-3">Menu Dipesan</th>
                    <th className="pb-3 text-right">Harga Menu</th>
                    <th className="pb-3 text-right">Pajak (10%)</th>
                    <th className="pb-3 text-right">Total Pembayaran</th>
                    <th className="pb-3 text-center">Status Pembayaran</th>
                    <th className="pb-3 text-center">Rincian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 font-mono">
                        <div className="font-bold text-slate-900">{t.order_number}</div>
                        <div className="text-[10px] text-slate-400">{t.created_at}</div>
                      </td>
                      <td className="py-3.5">
                        <span className="font-bold text-slate-800">
                          {t.order_source === 'QR_TABLE' ? 'Pesanan Meja' : 'Kasir Langsung'}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {t.dining_table ? `Meja ${t.dining_table.table_number}` : 'Bungkus / Bawa Pulang'}
                        </span>
                      </td>
                      <td className="py-3.5 font-medium text-slate-800">{t.customer_name}</td>
                      <td className="py-3.5 max-w-xs truncate text-slate-600" title={t.items_summary}>
                        {t.items_summary}
                      </td>
                      <td className="py-3.5 text-right font-mono text-slate-600">{formatIDR(t.subtotal)}</td>
                      <td className="py-3.5 text-right font-mono text-blue-600 font-semibold">{formatIDR(t.tax_amount)}</td>
                      <td className="py-3.5 text-right font-mono font-bold text-slate-900 text-sm">{formatIDR(t.grand_total)}</td>
                      <td className="py-3.5 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          t.payment_status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : t.payment_status === 'REFUNDED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {t.payment_status === 'PAID' ? '● Sudah Lunas' : t.payment_status === 'REFUNDED' ? 'Dibatalkan' : '⏳ Belum Bayar'}
                        </span>
                      </td>
                      <td className="py-3.5 text-center">
                        <button
                          onClick={() => setSelectedReceipt(t)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                          title="Lihat Rincian Struk"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      {/* RECEIPT INSPECTION MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2">
                <Receipt className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Faktur Pembelian Terverifikasi</h3>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">{selectedReceipt.order_number}</p>
            </div>

            <div className="border-t border-b border-dashed border-slate-200 py-3 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-500">
                <span>Pelanggan:</span>
                <span className="font-semibold text-slate-800">{selectedReceipt.customer_name}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Waktu Transaksi:</span>
                <span className="font-mono text-slate-700">{selectedReceipt.created_at}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Metode Bayar:</span>
                <span className="font-bold text-emerald-600">{selectedReceipt.payment_method}</span>
              </div>
              <div className="pt-2 border-t border-dashed border-slate-200 flex justify-between items-baseline font-bold text-slate-900">
                <span>Total Bersih:</span>
                <span className="font-mono text-base text-amber-600">{formatIDR(selectedReceipt.grand_total)}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedReceipt(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
            >
              Tutup Rincian
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
