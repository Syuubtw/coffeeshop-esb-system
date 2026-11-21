import { useEffect, useState, useMemo, useRef } from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  RefreshCcw, 
  Receipt, 
  Eye, 
  Search,
  TrendingUp,
  ShieldCheck,
  Scale,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Download,
  Coffee,
  Smartphone,
  Users,
  Flame,
  Award,
  Sparkles,
  CreditCard,
  BarChart3,
  Calendar,
  FileSpreadsheet,
  X,
  CheckCircle
} from 'lucide-react';
import api from '../services/api';
import { exportStyledExcel } from '../utils/exportCsv';

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

interface AuditLogItem {
  id: number;
  user_name: string;
  user_role: string;
  action: string;
  entity_type: string;
  description: string;
  ip_address: string;
  created_at: string;
}

interface CashReconciliationItem {
  id: number;
  cashier_name: string;
  opened_at: string;
  closed_at: string | null;
  status: string;
  start_cash: number;
  cash_sales_total: number;
  expected_ending_cash: number;
  actual_ending_cash: number | null;
  difference: number;
  difference_status: 'BALANCED' | 'OVER' | 'SHORT';
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
  // Top Level Navigation: Laporan Penjualan & Pemeriksaan Kasir
  const [activeOwnerTab, setActiveOwnerTab] = useState<'FINANCIAL' | 'AUDIT'>('FINANCIAL');

  // Audit Subtab
  const [auditSubTab, setAuditSubTab] = useState<'LOGS' | 'RECONCILIATION' | 'VOID'>('LOGS');

  // Financial Tab State
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'POS' | 'QR_TABLE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);

  // Business Intelligence & Sales Analytics State
  const [biStats, setBiStats] = useState<any>(null);

  // Audit Data State
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [cashReconciliations, setCashReconciliations] = useState<CashReconciliationItem[]>([]);
  const [voidOrders, setVoidOrders] = useState<any[]>([]);

  // 12 Rolling Months Generator (Bulan Berjalan s/d 12 Bulan Terakhir)
  const availableMonths = useMemo(() => getAvailableRollingMonths(), []);

  const [selectedPeriod, setSelectedPeriod] = useState<{ month: number; year: number }>(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });

  const selectedPeriodLabel = useMemo(() => {
    const match = availableMonths.find(m => m.month === selectedPeriod.month && m.year === selectedPeriod.year);
    return match ? match.label : `${selectedPeriod.month}/${selectedPeriod.year}`;
  }, [availableMonths, selectedPeriod]);

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportingType, setExportingType] = useState<string | null>(null);

  const isFetchingRef = useRef(false);

  const fetchStatsAndOrders = async (
    forceTab?: 'FINANCIAL' | 'AUDIT',
    periodOverride?: { month: number; year: number }
  ) => {
    if (document.hidden && !forceTab) return;
    if (isFetchingRef.current) return;

    const currentTab = forceTab || activeOwnerTab;
    const period = periodOverride || selectedPeriod;
    const qParams = `?month=${period.month}&year=${period.year}`;

    try {
      isFetchingRef.current = true;
      setLoading(true);

      if (currentTab === 'FINANCIAL') {
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
            created_at: o.created_at?.replace('T', ' ').substring(0, 19),
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
      } else if (currentTab === 'AUDIT') {
        const [resLogs, resCash, resVoid] = await Promise.allSettled([
          api.get('/audit/logs'),
          api.get('/audit/cash-reconciliation'),
          api.get('/audit/void-orders'),
        ]);

        if (resLogs.status === 'fulfilled' && resLogs.value.data?.data?.data) {
          setAuditLogs(resLogs.value.data.data.data);
        }
        if (resCash.status === 'fulfilled' && resCash.value.data?.data) {
          setCashReconciliations(resCash.value.data.data);
        }
        if (resVoid.status === 'fulfilled' && resVoid.value.data?.data) {
          setVoidOrders(resVoid.value.data.data);
        }
      }
    } catch {
      // Keep offline
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsAndOrders(activeOwnerTab);
    const interval = setInterval(() => {
      fetchStatsAndOrders();
    }, 15000);
    return () => clearInterval(interval);
  }, [activeOwnerTab, selectedPeriod]);

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
  const totalPB1Tax = useMemo(() => paidTransactions.reduce((acc, curr) => acc + curr.tax_amount, 0), [paidTransactions]);
  const avgOrderValue = useMemo(() => (paidTransactions.length > 0 ? Math.round(totalRevenue / paidTransactions.length) : 0), [paidTransactions, totalRevenue]);

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

    if (activeOwnerTab === 'FINANCIAL') {
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
          { label: 'TITIPAN PAJAK RESTORAN PB1 (10%)', value: formatIDR(totalPB1Tax) },
          { label: 'RATA-RATA NILAI BELANJA (AOV)', value: formatIDR(avgOrderValue) },
        ],
        headers,
        rows,
      });
    } else if (activeOwnerTab === 'AUDIT') {
      if (auditSubTab === 'RECONCILIATION') {
        const headers = ['Nama Kasir', 'Jam Buka Shift', 'Jam Tutup Shift', 'Status Shift', 'Modal Awal Kasir (Rp)', 'Total Uang Tunai Masuk (Rp)', 'Uang yang Seharusnya Ada (Rp)', 'Uang Fisik Dihitung Kasir (Rp)', 'Selisih Uang (Rp)', 'Kesesuaian Uang'];
        const rows = cashReconciliations.map((c) => [
          c.cashier_name,
          c.opened_at,
          c.closed_at || 'Sedang Aktif',
          c.status === 'CLOSED' ? 'Shift Selesai' : 'Sedang Bertugas',
          c.start_cash,
          c.cash_sales_total,
          c.expected_ending_cash,
          c.actual_ending_cash ?? '-',
          c.difference,
          c.difference_status === 'BALANCED' ? 'Uang Pas (Sesuai)' : c.difference_status === 'OVER' ? 'Uang Berlebih' : 'Uang Kurang',
        ]);
        exportStyledExcel({
          filename: `Laporan_Pemeriksaan_Kas_Kasir_${today}`,
          title: 'LAPORAN PENGECEKAN UANG KASIR SAAT TUTUP SHIFT',
          subtitle: 'Pengecekan fisik uang di laci kasir vs catatan penjualan di sistem kasir',
          author: 'Pemilik Kedai (Owner)',
          summaryItems: [
            { label: 'TOTAL SESI KASIR', value: `${cashReconciliations.length} Sesi Tutup Kas` },
          ],
          headers,
          rows,
        });
      } else {
        const headers = ['Waktu', 'Nama Karyawan', 'Posisi Kerja', 'Aksi', 'Tipe Data', 'Penjelasan Aktivitas', 'Alamat Jaringan (IP)'];
        const rows = auditLogs.map((l) => [
          l.created_at,
          l.user_name,
          l.user_role,
          l.action,
          l.entity_type,
          l.description,
          l.ip_address,
        ]);
        exportStyledExcel({
          filename: `Laporan_Audit_Forensik_${today}`,
          title: 'LAPORAN AUDIT TRAIL AKTIVITAS & FORENSIK STAF',
          subtitle: 'Rekam jejak forensik keamanan sistem (login, approval, pembatalan pesanan, dsb.)',
          author: 'Faiz Rifki Syuhada (Owner)',
          summaryItems: [
            { label: 'TOTAL LOG TEREKAM', value: `${auditLogs.length} Aktivitas` },
          ],
          headers,
          rows,
        });
      }
    }
  };

  // 1. Export Laporan Penjualan Bulanan Lengkap
  const handleExportMonthlySales = async () => {
    try {
      setExportingType('sales');
      const res = await api.get(`/pos/orders/recent?month=${selectedPeriod.month}&year=${selectedPeriod.year}&per_page=1000`);
      const orders = res.data.data?.data || res.data.data || transactions;
      const headers = ['No. Faktur', 'Tanggal & Waktu', 'Nama Tamu', 'Tipe / Meja', 'Subtotal', 'Diskon', 'Pajak PB1', 'Service Charge', 'Total Bayar', 'Metode Bayar', 'Status'];
      const rows = orders.map((o: any) => [
        o.order_number,
        o.created_at,
        o.customer_name || 'Pelanggan Umum',
        o.dining_table ? `Meja ${o.dining_table.table_number}` : 'Bungkus / Takeaway',
        Number(o.subtotal || 0),
        Number(o.discount_amount || 0),
        Number(o.tax_amount || 0),
        Number(o.service_charge || 0),
        Number(o.grand_total || 0),
        o.payment_method === 'CASH' ? 'Uang Tunai (Cash)' : (o.payment_method || 'QRIS'),
        o.payment_status || o.order_status,
      ]);

      const totalOmset = orders.reduce((sum: number, o: any) => sum + Number(o.grand_total || 0), 0);

      exportStyledExcel({
        filename: `Laporan_Penjualan_${selectedPeriod.month}_${selectedPeriod.year}`,
        title: `LAPORAN PENJUALAN KEDAI - PERIODE ${selectedPeriodLabel.toUpperCase()}`,
        subtitle: 'Rincian transaksi penjualan kasir & pesanan QR meja',
        author: 'Faiz Rifki Syuhada (Owner)',
        themeColor: '#1d4ed8',
        summaryItems: [
          { label: 'PERIODE LAPORAN', value: selectedPeriodLabel },
          { label: 'TOTAL TRANSAKSI', value: `${orders.length} Pesanan` },
          { label: 'TOTAL OMSET PENJUALAN', value: formatIDR(totalOmset) },
        ],
        headers,
        rows,
      });
    } catch (err) {
      console.error('Failed to export sales:', err);
    } finally {
      setExportingType(null);
    }
  };

  // 2. Export Laporan Kehadiran & Gaji Karyawan
  const handleExportMonthlyAttendance = async () => {
    try {
      setExportingType('attendance');
      const res = await api.get(`/hr/attendance/monthly?month=${selectedPeriod.month}&year=${selectedPeriod.year}`);
      const recap = res.data.data?.recap || [];
      const details = res.data.data?.details || [];

      let headers: string[] = [];
      let rows: (string | number)[][] = [];

      if (details.length > 0) {
        headers = ['Nama Karyawan', 'Role / Divisi', 'Tanggal', 'Jam Masuk', 'Jam Pulang', 'Terlambat (Menit)', 'Alasan Keterlambatan', 'Status Presensi'];
        rows = details.map((d: any) => [
          d.user?.name || d.user_name || '-',
          d.user?.role || d.user_role || 'Staff Outlet',
          d.date || (d.clock_in ? d.clock_in.substring(0, 10) : '-'),
          d.clock_in ? d.clock_in.substring(11, 16) : '-',
          d.clock_out ? d.clock_out.substring(11, 16) : '-',
          d.late_minutes || 0,
          d.late_reason || '-',
          d.status || 'HADIR',
        ]);
      } else {
        headers = ['Nama Karyawan', 'Role / Divisi', 'Hari Kerja Hadir', 'Terlambat', 'Izin / Sakit', 'Alpha / Bolos', 'Estimasi Gaji'];
        rows = recap.map((r: any) => [
          r.name || '-',
          r.role || 'Staff',
          r.present_days || 0,
          r.late_days || 0,
          r.leave_days || 0,
          r.absent_days || 0,
          Number(r.estimated_salary || 0),
        ]);
      }

      exportStyledExcel({
        filename: `Laporan_Presensi_Gaji_${selectedPeriod.month}_${selectedPeriod.year}`,
        title: `LAPORAN KEHADIRAN & GAJI STAF - PERIODE ${selectedPeriodLabel.toUpperCase()}`,
        subtitle: 'Rekapitulasi jam kerja, keterlambatan, dan gaji karyawan outlet',
        author: 'Faiz Rifki Syuhada (Owner)',
        themeColor: '#7c3aed',
        summaryItems: [
          { label: 'PERIODE LAPORAN', value: selectedPeriodLabel },
          { label: 'TOTAL STAF TERDAFTAR', value: `${recap.length || details.length} Karyawan` },
        ],
        headers,
        rows,
      });
    } catch (err) {
      console.error('Failed to export attendance:', err);
    } finally {
      setExportingType(null);
    }
  };

  // 3. Export Laporan Mutasi Stok Bahan Baku
  const handleExportMonthlyInventory = async () => {
    try {
      setExportingType('inventory');
      const res = await api.get(`/inventory/stock-card-summary?month=${selectedPeriod.month}&year=${selectedPeriod.year}`);
      const items = res.data.data || [];
      const headers = [
        'Nama Bahan Baku',
        'Satuan',
        'Bahan Masuk / Pembelian',
        'Pemakaian Menu (Resep)',
        'Bahan Rusak / Basi',
        'Total Pemakaian',
        'Sisa Stok Akhir',
        'Keterangan Kemasan & Porsi',
      ];
      const rows = items.map((i: any) => {
        const isGram = i.unit === 'gram';
        const isMl = i.unit === 'ml';
        const divisor = (isGram || isMl) ? 1000 : 1;
        const displayUnit = isGram ? 'kg' : isMl ? 'Liter' : (i.unit || 'pcs');

        const formatQty = (qty: number) => {
          if (!qty) return 0;
          const val = qty / divisor;
          return Number(val.toFixed(3));
        };

        let note = '';
        const nameLower = (i.name || '').toLowerCase();
        if (nameLower.includes('kopi')) note = '1 kg ≈ 55 cup espresso';
        else if (nameLower.includes('susu')) note = '1 Liter = 1 Kotak (≈ 5 cup latte)';
        else if (nameLower.includes('air') || nameLower.includes('galon')) note = '1 Galon = 19 Liter (≈ 95 cup)';
        else if (nameLower.includes('cup')) note = '1 Slop = 50 pcs';
        else if (nameLower.includes('sirup')) note = '1 Botol = 750 ml';
        else if (nameLower.includes('aren')) note = '1 Liter = 1 Botol';
        else if (nameLower.includes('pastry')) note = '1 Pack = 1 kg (10 pcs)';

        return [
          i.name || i.material_name || '-',
          displayUnit,
          formatQty(Number(i.total_in || 0)),
          formatQty(Number(i.total_used_sale || i.total_out_sale || 0)),
          formatQty(Number(i.total_used_waste || i.total_out_waste || 0)),
          formatQty(Number(i.total_used || 0)),
          formatQty(Number(i.current_stock || 0)),
          note || '-',
        ];
      });

      exportStyledExcel({
        filename: `Laporan_Mutasi_Stok_${selectedPeriod.month}_${selectedPeriod.year}`,
        title: `LAPORAN MUTASI & STOK BAHAN BAKU - PERIODE ${selectedPeriodLabel.toUpperCase()}`,
        subtitle: 'Riwayat pembelian masuk, pemakaian resep minuman, dan bahan rusak/basi',
        author: 'Faiz Rifki Syuhada (Owner)',
        themeColor: '#d97706',
        summaryItems: [
          { label: 'PERIODE LAPORAN', value: selectedPeriodLabel },
          { label: 'TOTAL BAHAN BAKU', value: `${items.length} Item` },
        ],
        headers,
        rows,
      });
    } catch (err) {
      console.error('Failed to export inventory:', err);
    } finally {
      setExportingType(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Top Banner & Tab Navigation */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Halaman Pemilik Kedai (Owner)</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[11px] font-bold border border-purple-200">
              Pemilik Kedai
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pantau omzet penjualan harian, performa menu terlaris, dan audit pemeriksaan kasir secara otomatis.
          </p>
        </div>

        {/* Master Navigation Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200/60 text-xs font-semibold">
            <button
              onClick={() => setActiveOwnerTab('FINANCIAL')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition cursor-pointer font-bold ${
                activeOwnerTab === 'FINANCIAL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" /> Laporan Penjualan
            </button>
            <button
              onClick={() => setActiveOwnerTab('AUDIT')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition cursor-pointer font-bold ${
                activeOwnerTab === 'AUDIT' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" /> Pemeriksaan Kasir & Kas
            </button>
          </div>

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

          {/* Tombol Buka Pusat Laporan Bulanan (.xlsx) */}
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-xs font-bold transition shadow-xs cursor-pointer"
            title="Buka Pusat Rekap Laporan Bulanan (Excel .xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Pusat Laporan Bulanan (Excel)</span>
          </button>

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
      {/* VIEW 1: FINANCIAL OVERVIEW & AUDIT STRUK (EXISTING) */}
      {/* ============================================================== */}
      {activeOwnerTab === 'FINANCIAL' && (
        <div className="space-y-6">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

            {/* Total Pajak Resto PB1 */}
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pajak Restoran (PB1 10%)</span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-bold text-blue-700 font-mono tracking-tight">{formatIDR(totalPB1Tax)}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Titipan uang pajak daerah
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

            {/* Rata-Rata Belanja Tamu (AOV) */}
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Rata-Rata Belanja Tamu</span>
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-bold text-purple-700 font-mono tracking-tight">{formatIDR(avgOrderValue)}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Rata-rata belanja per struk kasir
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
      )}

      {/* ============================================================== */}
      {/* VIEW 2: PUSAT AUDIT TRAIL & PEMERIKSAAN KASIR */}
      {/* ============================================================== */}

      {/* ============================================================== */}
      {/* VIEW 3: PUSAT AUDIT TRAIL & ANTI-FRAUD */}
      {/* ============================================================== */}
      {activeOwnerTab === 'AUDIT' && (
        <div className="space-y-6">
          {/* Sub Navigation Bar for Audit */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit border border-slate-200/60 text-xs font-bold">
            <button
              onClick={() => setAuditSubTab('LOGS')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition cursor-pointer ${
                auditSubTab === 'LOGS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-blue-600" /> Riwayat Kerja Karyawan
            </button>
            <button
              onClick={() => setAuditSubTab('RECONCILIATION')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition cursor-pointer ${
                auditSubTab === 'RECONCILIATION' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Scale className="w-3.5 h-3.5 text-emerald-600" /> Pengecekan Uang Kasir (Tutup Shift)
            </button>
            <button
              onClick={() => setAuditSubTab('VOID')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition cursor-pointer ${
                auditSubTab === 'VOID' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Pemeriksaan Pembatalan Struk
            </button>
          </div>

          {/* SUB-VIEW 1: SYSTEM ACTION AUDIT LOGS */}
          {auditSubTab === 'LOGS' && (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 flex-wrap gap-2">
                <div>
                  <h2 className="font-bold text-slate-900 text-base">Catatan Riwayat Kerja Karyawan</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Mencatat nama karyawan, waktu pengerjaan, dan rincian perubahan yang dilakukan di sistem.</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                  {auditLogs.length} Aktivitas Terbaru
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold bg-slate-50/50">
                      <th className="py-3 px-3 w-40">Waktu & Tanggal</th>
                      <th className="py-3 px-3 w-40">Nama Karyawan & Bagian</th>
                      <th className="py-3 px-3 w-36 text-center">Aksi yang Dilakukan</th>
                      <th className="py-3 px-3">Rincian yang Dikerjakan</th>
                      <th className="py-3 px-3 w-32 font-mono text-right">Alamat Jaringan (IP)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400">
                          Belum ada catatan aktivitas staf.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-3 font-mono text-slate-500 whitespace-nowrap">
                            {log.created_at?.replace('T', ' ').substring(0, 19)}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900 block">{log.user_name}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{log.user_role}</span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              log.action.includes('ORDER') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                              log.action.includes('SHIFT') ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                              log.action.includes('WASTE') ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                              'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-700 font-medium">{log.description}</td>
                          <td className="py-3 px-3 font-mono text-slate-400 text-right">{log.ip_address}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUB-VIEW 2: CASH DRAWER RECONCILIATION */}
          {auditSubTab === 'RECONCILIATION' && (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="font-bold text-slate-900 text-base">Pengecekan Uang Kasir (Tutup Shift)</h2>
                <p className="text-xs text-slate-500 mt-0.5">Mencocokkan jumlah uang fisik di laci kasir dengan total penjualan tunai di sistem.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold bg-slate-50/50">
                      <th className="py-3 px-3">Nama Kasir</th>
                      <th className="py-3 px-3">Jam Buka / Tutup</th>
                      <th className="py-3 px-3 text-right">Modal Awal di Laci</th>
                      <th className="py-3 px-3 text-right">Penjualan Tunai</th>
                      <th className="py-3 px-3 text-right font-bold text-slate-700">Uang Seharusnya Ada</th>
                      <th className="py-3 px-3 text-right font-bold text-slate-900">Uang Fisik Dihitung Kasir</th>
                      <th className="py-3 px-3 text-right">Selisih Uang</th>
                      <th className="py-3 px-3 text-center">Hasil Pengecekan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cashReconciliations.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-3 font-bold text-slate-900">{c.cashier_name}</td>
                        <td className="py-3 px-3 font-mono text-slate-500">
                          <div>Buka: {c.opened_at?.substring(11, 19)}</div>
                          <div className="text-[10px] text-slate-400">{c.closed_at ? `Tutup: ${c.closed_at.substring(11, 19)}` : 'Sedang Aktif'}</div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">{formatIDR(c.start_cash)}</td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-600 font-semibold">{formatIDR(c.cash_sales_total)}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">{formatIDR(c.expected_ending_cash)}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          {c.actual_ending_cash !== null ? formatIDR(c.actual_ending_cash) : 'Belum Tutup'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold">
                          {c.difference === 0 ? (
                            <span className="text-emerald-600">Rp 0 (Pas)</span>
                          ) : c.difference > 0 ? (
                            <span className="text-blue-600 font-bold flex items-center justify-end gap-1">
                              <ArrowUpRight className="w-3.5 h-3.5" /> +{formatIDR(c.difference)}
                            </span>
                          ) : (
                            <span className="text-rose-600 font-bold flex items-center justify-end gap-1">
                              <ArrowDownRight className="w-3.5 h-3.5" /> {formatIDR(c.difference)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            c.difference_status === 'BALANCED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            c.difference_status === 'OVER' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {c.difference_status === 'BALANCED' ? 'Uang Pas (Sesuai)' : c.difference_status === 'OVER' ? 'Uang Berlebih' : 'Uang Kurang'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUB-VIEW 3: AUDIT VOID & DISKON */}
          {auditSubTab === 'VOID' && (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="font-bold text-slate-900 text-base">Pemeriksaan Pembatalan Struk & Diskon</h2>
                <p className="text-xs text-slate-500 mt-0.5">Memantau apakah ada struk yang dibatalkan kasir setelah uang diterima.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-semibold bg-slate-50/50">
                      <th className="py-3 px-3">Nomor Struk</th>
                      <th className="py-3 px-3">Pelanggan & Meja</th>
                      <th className="py-3 px-3 text-right">Nilai Pesanan</th>
                      <th className="py-3 px-3 text-right">Potongan Diskon</th>
                      <th className="py-3 px-3 text-center">Status Pesanan</th>
                      <th className="py-3 px-4">Catatan Pemeriksaan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {voidOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          Tidak ada pembatalan pesanan yang mencurigakan. Operasional kasir berjalan aman.
                        </td>
                      </tr>
                    ) : (
                      voidOrders.map((vo) => (
                        <tr key={vo.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">{vo.order_number}</td>
                          <td className="py-3 px-3">
                            <span className="font-medium text-slate-800">{vo.customer_name}</span>
                            <span className="text-[10px] text-slate-400 block">{vo.dining_table ? `Meja ${vo.dining_table.table_number}` : 'Bungkus'}</span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">{formatIDR(vo.grand_total)}</td>
                          <td className="py-3 px-3 text-right font-mono text-rose-600 font-semibold">
                            {vo.discount_amount > 0 ? `-${formatIDR(vo.discount_amount)}` : '-'}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              {vo.order_status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            Tercatat aman di sistem
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

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

      {/* MONTHLY RECAP EXPORT MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg leading-tight">Pusat Rekap Laporan Bulanan (.xlsx)</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pilihan file unduhan untuk periode <span className="font-bold text-emerald-700">{selectedPeriodLabel}</span>
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notice info */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-xs text-slate-600 flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800">Format Microsoft Excel Profesional & Otomatis</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Setiap dokumen diekspor dengan judul resmi, ringkasan angka penting, header warna, dan kolom angka yang langsung dapat diolah atau dicetak.
                </p>
              </div>
            </div>

            {/* 4 Report Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* 1. Laporan Penjualan */}
              <div className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-xs transition bg-white flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                      Penjualan & Kasir
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">.xlsx</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Laporan Penjualan Lengkap</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Daftar seluruh faktur pesanan (POS & QR meja), omset, potongan diskon, pajak PB1, dan metode bayar (QRIS & Tunai).
                  </p>
                </div>
                <button
                  onClick={handleExportMonthlySales}
                  disabled={exportingType === 'sales'}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{exportingType === 'sales' ? 'Membuat File...' : 'Unduh Laporan Penjualan'}</span>
                </button>
              </div>

              {/* 2. Laporan Kehadiran & Gaji */}
              <div className="p-4 rounded-2xl border border-slate-200 hover:border-purple-300 hover:shadow-xs transition bg-white flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">
                      SDM & Presensi
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">.xlsx</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Laporan Kehadiran & Gaji</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Rekapitulasi jam kerja staf outlet (barista, kasir, gudang), riwayat keterlambatan + alasan, serta estimasi gaji.
                  </p>
                </div>
                <button
                  onClick={handleExportMonthlyAttendance}
                  disabled={exportingType === 'attendance'}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{exportingType === 'attendance' ? 'Membuat File...' : 'Unduh Laporan Presensi'}</span>
                </button>
              </div>

              {/* 3. Laporan Mutasi Stok */}
              <div className="p-4 rounded-2xl border border-slate-200 hover:border-amber-300 hover:shadow-xs transition bg-white flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                      Gudang & Bahan
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">.xlsx</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Laporan Mutasi Stok Bahan</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Rekam jejak pembelian masuk, pemakaian resep otomatis, bahan rusak/tumpah/basi (waste), dan sisa stok fisik gudang.
                  </p>
                </div>
                <button
                  onClick={handleExportMonthlyInventory}
                  disabled={exportingType === 'inventory'}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{exportingType === 'inventory' ? 'Membuat File...' : 'Unduh Laporan Stok'}</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
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
