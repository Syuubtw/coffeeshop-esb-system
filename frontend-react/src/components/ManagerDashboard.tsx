import { useEffect, useState, useMemo, useRef } from 'react';
import { 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Plus, 
  RefreshCcw, 
  AlertTriangle, 
  Coffee, 
  Sparkles, 
  Search, 
  Users, 
  LogIn, 
  LogOut, 
  Download, 
  ClipboardCheck, 
  Lock, 
  Unlock, 
  ShieldCheck, 
  ShoppingCart, 
  TrendingUp,
  MapPin,
  MessageSquare,
  UserCheck,
  UserPlus,
  Pencil,
  QrCode,
  X,
  Scale,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert
} from 'lucide-react';
import api from '../services/api';
import { exportStyledExcel } from '../utils/exportCsv';
import { TableQrGenerator } from './TableQrGenerator';

interface RawMaterialStock {
  id: number;
  name: string;
  sku: string;
  unit: string;
  current_stock: number;
  min_stock_alert: number;
  avg_cost_per_unit: number;
  is_low_stock?: boolean;
}

interface ProductWithRecipe {
  id: number;
  name: string;
  sku: string;
  base_price: number;
  category?: { id: number; name: string };
  is_active: boolean;
  is_daily_available: boolean;
  recipes?: Array<{
    id: number;
    raw_material_id: number;
    qty_needed: number;
    raw_material?: { id: number; name: string; unit: string; avg_cost_per_unit: number };
  }>;
}

const FALLBACK_MATERIALS: RawMaterialStock[] = [
  // 🟢 Stok Aman (Semua HPP dalam Full Rupiah)
  { id: 1, name: 'Biji Kopi Arabica Toraja', sku: 'RM-COFFEE-001', unit: 'gram', current_stock: 12000, min_stock_alert: 3000, avg_cost_per_unit: 250 },
  { id: 2, name: 'Biji Kopi Robusta Lampung', sku: 'RM-COFFEE-002', unit: 'gram', current_stock: 2500, min_stock_alert: 3000, avg_cost_per_unit: 150 },
  { id: 3, name: 'Susu Full Cream', sku: 'RM-DAIRY-001', unit: 'ml', current_stock: 24000, min_stock_alert: 10000, avg_cost_per_unit: 20 },
  { id: 4, name: 'Susu Oat', sku: 'RM-DAIRY-002', unit: 'ml', current_stock: 4000, min_stock_alert: 5000, avg_cost_per_unit: 45 },
  { id: 5, name: 'Gula Aren Cair', sku: 'RM-SWEET-001', unit: 'ml', current_stock: 8000, min_stock_alert: 3000, avg_cost_per_unit: 35 },
  { id: 6, name: 'Sirup Vanilla', sku: 'RM-SWEET-002', unit: 'ml', current_stock: 3000, min_stock_alert: 1500, avg_cost_per_unit: 80 },
  { id: 7, name: 'Sirup Caramel', sku: 'RM-SWEET-003', unit: 'ml', current_stock: 1000, min_stock_alert: 1500, avg_cost_per_unit: 80 },
  { id: 8, name: 'Cokelat Bubuk', sku: 'RM-CHOCO-001', unit: 'gram', current_stock: 6000, min_stock_alert: 2000, avg_cost_per_unit: 120 },
  { id: 9, name: 'Matcha Powder', sku: 'RM-TEA-001', unit: 'gram', current_stock: 1500, min_stock_alert: 1000, avg_cost_per_unit: 500 },
  { id: 10, name: 'Es Batu', sku: 'RM-ICE-001', unit: 'gram', current_stock: 35000, min_stock_alert: 15000, avg_cost_per_unit: 5 },
  { id: 11, name: 'Adonan Pastry (Pack 1 kg)', sku: 'RM-PASTRY-001', unit: 'gram', current_stock: 8000, min_stock_alert: 2000, avg_cost_per_unit: 30 },
  { id: 12, name: 'Air Mineral Galon (19 Liter)', sku: 'RM-WATER-001', unit: 'ml', current_stock: 152000, min_stock_alert: 38000, avg_cost_per_unit: 1 },
  { id: 13, name: 'Cup Kertas 12oz (Hot)', sku: 'RM-CUP-002', unit: 'pcs', current_stock: 1200, min_stock_alert: 300, avg_cost_per_unit: 2000 },
  { id: 14, name: 'Cup Plastik 22oz', sku: 'RM-CUP-001', unit: 'pcs', current_stock: 1500, min_stock_alert: 400, avg_cost_per_unit: 1500 },
  { id: 15, name: 'Sirup Hazelnut', sku: 'RM-SWEET-004', unit: 'ml', current_stock: 0, min_stock_alert: 1500, avg_cost_per_unit: 90 },
  { id: 16, name: 'Whipped Cream', sku: 'RM-TOP-001', unit: 'ml', current_stock: 1000, min_stock_alert: 2000, avg_cost_per_unit: 100 },
  { id: 17, name: 'Roti Tawar', sku: 'RM-PASTRY-002', unit: 'pcs', current_stock: 0, min_stock_alert: 20, avg_cost_per_unit: 40 },
];

const formatHumanQuantity = (qty: number, m: { name?: string; sku?: string; unit?: string }): { primary: string; secondary?: string } => {
  const name = (m.name || '').toLowerCase();
  const sku = (m.sku || '').toUpperCase();
  const unit = (m.unit || '').toLowerCase();

  // 1. Bahan Cair (ml / Liter)
  if (unit === 'ml' || unit === 'liter' || name.includes('susu') || name.includes('air') || name.includes('sirup') || name.includes('aren') || sku.includes('LIQ') || sku.includes('WATER') || sku.includes('DAIRY')) {
    const liter = (qty / 1000).toFixed(1).replace('.0', '');
    return {
      primary: `${liter} Liter`,
      secondary: `${qty.toLocaleString('id-ID')} ml`
    };
  }

  // 2. Bahan Bubuk / Biji / Padat (gram / kg)
  if (unit === 'gram' || unit === 'kg' || sku.includes('COFFEE') || sku.includes('ING') || sku.includes('PASTRY') || name.includes('kopi') || name.includes('matcha') || name.includes('cokelat') || name.includes('es batu') || name.includes('teh')) {
    if (qty >= 1000) {
      const kg = (qty / 1000).toFixed(1).replace('.0', '');
      return {
        primary: `${kg} kg`,
        secondary: `${qty.toLocaleString('id-ID')} gram`
      };
    }
    return {
      primary: `${qty.toLocaleString('id-ID')} gram`
    };
  }

  // 3. Kemasan Cup (Slop & pcs)
  if (name.includes('cup') || sku.includes('CUP')) {
    const slops = Math.floor(qty / 50);
    const sisa = qty % 50;
    return {
      primary: `${slops} Slop${sisa > 0 ? ` + ${sisa} pcs` : ''}`,
      secondary: `${qty.toLocaleString('id-ID')} pcs`
    };
  }

  return { primary: `${qty.toLocaleString('id-ID')} ${m.unit || 'pcs'}` };
};

const getPackagingSpec = (m: RawMaterialStock): string => {
  const name = m.name.toLowerCase();
  const sku = m.sku.toUpperCase();

  if (name.includes('susu') || name.includes('milk') || sku.includes('DAIRY')) return 'Kotak (1 Liter)';
  if (name.includes('galon') || name.includes('air') || sku.includes('WATER')) return 'Galon (19 Liter)';
  if (name.includes('sirup') || name.includes('syrup')) return 'Botol (750 ml)';
  if (name.includes('gula aren') || name.includes('sweet')) return 'Botol (1 Liter)';
  if (name.includes('kopi') || name.includes('coffee') || sku.includes('COFFEE')) return 'Bag (1 kg)';
  if (name.includes('matcha') || name.includes('tea')) return 'Pouch (500 g)';
  if (name.includes('cokelat') || name.includes('choco')) return 'Pack (1 kg)';
  if (name.includes('pastry') || name.includes('croissant') || sku.includes('PASTRY')) return 'Pack (1 kg)';
  if (name.includes('es batu') || name.includes('ice')) return 'Karung (10 kg)';
  if (name.includes('cup') || sku.includes('CUP')) return 'Slop (50 pcs)';

  return m.unit === 'gram' ? 'Pack (1 kg)' : m.unit === 'ml' ? 'Botol (1 Liter)' : 'Pack Standar';
};

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

export const ManagerDashboard: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'approvals' | 'menu_bom' | 'asset_valuation' | 'employees' | 'shifts' | 'tables' | 'cashier_reconciliation'>('approvals');
  const [cashReconciliations, setCashReconciliations] = useState<CashReconciliationItem[]>([]);
  const [voidOrders, setVoidOrders] = useState<any[]>([]);
  const [cashierAuditSubTab, setCashierAuditSubTab] = useState<'RECONCILIATION' | 'VOID'>('RECONCILIATION');
  const [materials, setMaterials] = useState<RawMaterialStock[]>(FALLBACK_MATERIALS);
  const [searchMaterial, setSearchMaterial] = useState('');
  const [assetFilter, setAssetFilter] = useState<'ALL' | 'LOW' | 'OUT' | 'SAFE'>('ALL');
  const [products, setProducts] = useState<ProductWithRecipe[]>([]);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(false);

  // Employees & SDM Management State
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [searchEmployee, setSearchEmployee] = useState('');

  // New Employee Form State (Tanpa Gaji)
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPosition, setEmpPosition] = useState<'BARISTA' | 'CASHIER' | 'ADMIN_GUDANG' | 'MANAGER'>('BARISTA');
  const [empDepartment, setEmpDepartment] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empPassword, setEmpPassword] = useState('password');
  const [isSubmittingEmp, setIsSubmittingEmp] = useState(false);

  // Edit Employee Form State
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [editEmpName, setEditEmpName] = useState('');
  const [editEmpEmail, setEditEmpEmail] = useState('');
  const [editEmpPosition, setEditEmpPosition] = useState<string>('BARISTA');
  const [editEmpDepartment, setEditEmpDepartment] = useState<string>('BAR');
  const [editEmpPhone, setEditEmpPhone] = useState('');
  const [editEmpPassword, setEditEmpPassword] = useState('');
  const [editEmpStatus, setEditEmpStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [isUpdatingEmp, setIsUpdatingEmp] = useState(false);

  // New Material Form State (Konsisten kg, liter, pcs, gram, ml)
  const [matName, setMatName] = useState('');
  const [matUnit, setMatUnit] = useState<'kg' | 'liter' | 'pcs' | 'gram' | 'ml'>('kg');
  const [matMinAlert, setMatMinAlert] = useState<number>(2);
  const [matInitialStock, setMatInitialStock] = useState<number>(5);
  const [matCostPerUnit, setMatCostPerUnit] = useState<number>(100000);
  const [isSubmittingMat, setIsSubmittingMat] = useState(false);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/hr/employees');
      if (res.data?.data) {
        setEmployeesList(res.data.data);
      }
    } catch {
      // fallback
    }
  };

  const handleOpenEditEmployee = (emp: any) => {
    if (emp.position === 'OWNER') {
      alert('Akses Ditolak: Akun Pemilik Kedai (Owner) dilindungi dan tidak dapat diubah oleh Store Manager.');
      return;
    }
    setEditingEmployee(emp);
    setEditEmpName(emp.name || emp.user?.name || '');
    setEditEmpEmail(emp.email || emp.user?.email || '');
    setEditEmpPosition(emp.position || 'BARISTA');
    setEditEmpDepartment(emp.department || 'BAR');
    setEditEmpPhone(emp.phone || '');
    setEditEmpPassword('');
    setEditEmpStatus(emp.employment_status || 'ACTIVE');
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee || !editEmpName || !editEmpEmail) {
      alert('Nama dan Email wajib diisi!');
      return;
    }
    setIsUpdatingEmp(true);
    try {
      const payload: any = {
        name: editEmpName,
        email: editEmpEmail,
        position: editEmpPosition,
        department: editEmpDepartment,
        phone: editEmpPhone || null,
        employment_status: editEmpStatus,
      };
      if (editEmpPassword.trim().length >= 6) {
        payload.password = editEmpPassword.trim();
      }
      const res = await api.put(`/hr/employees/${editingEmployee.id}`, payload);
      alert(res.data.message || 'Data karyawan berhasil diperbarui!');
      setEditingEmployee(null);
      fetchEmployees();
      fetchLiveStock('shifts');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal memperbarui data karyawan');
    } finally {
      setIsUpdatingEmp(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName || !empEmail) {
      alert('Nama dan Email wajib diisi!');
      return;
    }
    setIsSubmittingEmp(true);
    try {
      const res = await api.post('/hr/employees', {
        name: empName,
        email: empEmail,
        position: empPosition,
        department: empDepartment || undefined,
        phone: empPhone || null,
        password: empPassword || 'password',
      });
      alert(res.data.message || 'Karyawan baru berhasil didaftarkan!');
      setShowAddEmployeeModal(false);
      setEmpName('');
      setEmpEmail('');
      setEmpPhone('');
      setEmpDepartment('');
      fetchEmployees();
      fetchLiveStock('shifts');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menambahkan karyawan');
    } finally {
      setIsSubmittingEmp(false);
    }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matName) {
      alert('Nama bahan baku wajib diisi!');
      return;
    }
    setIsSubmittingMat(true);
    try {
      let finalUnit: string = matUnit;
      let finalStock = Number(matInitialStock) || 0;
      let finalMin = Number(matMinAlert) || 0;
      let finalCost = Number(matCostPerUnit) || 0;

      if (matUnit === 'kg') {
        finalUnit = 'gram';
        finalStock = finalStock * 1000;
        finalMin = finalMin * 1000;
        finalCost = finalCost > 0 ? Math.round(finalCost / 1000) : 0;
      } else if (matUnit === 'liter') {
        finalUnit = 'ml';
        finalStock = finalStock * 1000;
        finalMin = finalMin * 1000;
        finalCost = finalCost > 0 ? Math.round(finalCost / 1000) : 0;
      }

      const res = await api.post('/inventory/materials', {
        name: matName,
        unit: finalUnit,
        min_stock_alert: finalMin,
        current_stock: finalStock,
        avg_cost_per_unit: finalCost,
      });
      alert(res.data.message || 'Bahan baku baru berhasil didaftarkan ke gudang!');
      setShowAddMaterialModal(false);
      setMatName('');
      setMatInitialStock(5);
      setMatMinAlert(2);
      setMatCostPerUnit(100000);
      fetchLiveStock('asset_valuation');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menambahkan bahan baku');
    } finally {
      setIsSubmittingMat(false);
    }
  };

  // Approvals Hub (Maker vs Checker) State
  const [pendingPurchaseOrders, setPendingPurchaseOrders] = useState<any[]>([]);
  const [pendingOpnames, setPendingOpnames] = useState<any[]>([]);
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);

  // Real-Time Company Attendance State
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [attendanceFilter, setAttendanceFilter] = useState<'ALL' | 'WORKING' | 'NOT_CLOCKED_IN' | 'FINISHED'>('ALL');
  const [isTogglingAttendance, setIsTogglingAttendance] = useState(false);

  // Add Menu Modal State
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuCategory, setNewMenuCategory] = useState<number>(1);
  const [newMenuPrice, setNewMenuPrice] = useState<string>('');
  const [recipeRows, setRecipeRows] = useState<Array<{ raw_material_id: number; qty_needed: string }>>([
    { raw_material_id: 1, qty_needed: '18' },
    { raw_material_id: 3, qty_needed: '150' },
  ]);
  const [isSubmittingMenu, setIsSubmittingMenu] = useState(false);

  const isFetchingRef = useRef(false);

  // Load static menu & categories once on mount
  useEffect(() => {
    const loadStaticData = async () => {
      try {
        const [resProd, resCat] = await Promise.allSettled([
          api.get('/menu/products'),
          api.get('/menu/categories'),
        ]);
        if (resProd.status === 'fulfilled' && resProd.value.data?.data) {
          setProducts(resProd.value.data.data);
        }
        if (resCat.status === 'fulfilled' && resCat.value.data?.data) {
          setCategories(resCat.value.data.data);
          if (resCat.value.data.data.length > 0) {
            setNewMenuCategory(resCat.value.data.data[0].id);
          }
        }
      } catch {
        // Fallback intact
      }
      fetchEmployees();
    };
    loadStaticData();
  }, []);

  // Live polling / sync with real PostgreSQL database on-demand per active tab
  const fetchLiveStock = async (targetTab?: string) => {
    if (document.hidden && !targetTab) return;
    if (isFetchingRef.current) return;

    const currentTab = targetTab || activeSubTab;

    try {
      isFetchingRef.current = true;
      setLoading(true);

      // Always fetch pending approvals for Store Manager
      try {
        const [resPo, resOpnAll] = await Promise.allSettled([
          api.get('/procurement/orders'),
          api.get('/audit/stock-opnames')
        ]);
        if (resPo.status === 'fulfilled' && resPo.value.data?.data?.orders) {
          const allOrders = resPo.value.data.data.orders;
          setPendingPurchaseOrders(allOrders.filter((p: any) => p.status === 'PENDING_APPROVAL'));
        }
        if (resOpnAll.status === 'fulfilled' && resOpnAll.value.data?.data?.data) {
          const allOpn = resOpnAll.value.data.data.data;
          setPendingOpnames(allOpn.filter((o: any) => o.status === 'PENDING_APPROVAL'));
        }
      } catch {
        // Keep fallback
      }

      // Always ensure materials are synced for valuations & recipes
      try {
        const resMat = await api.get('/inventory/materials');
        if (resMat.data?.data) {
          const mapped = resMat.data.data.map((m: any) => ({
            id: m.id,
            name: m.name,
            sku: m.sku,
            unit: m.unit,
            current_stock: Number(m.current_stock),
            min_stock_alert: Number(m.min_stock_alert),
            avg_cost_per_unit: Number(m.avg_cost_per_unit),
            is_low_stock: m.is_low_stock
          }));
          setMaterials(mapped);
        }
      } catch {
        // Keep fallback
      }

      if (currentTab === 'shifts') {
        const resAtt = await api.get('/hr/attendance/realtime');
        if (resAtt.data?.data) {
          setAttendanceData(resAtt.data.data);
        }
      } else if (currentTab === 'employees') {
        const resEmp = await api.get('/hr/employees');
        if (resEmp.data?.data) {
          setEmployeesList(resEmp.data.data);
        }
      } else if (currentTab === 'menu_bom') {
        const resProd = await api.get('/menu/products');
        if (resProd.data?.data) {
          setProducts(resProd.data.data);
        }
      } else if (currentTab === 'cashier_reconciliation') {
        const [resCash, resVoid] = await Promise.allSettled([
          api.get('/audit/cash-reconciliation'),
          api.get('/audit/void-orders'),
        ]);
        if (resCash.status === 'fulfilled' && resCash.value.data?.data) {
          setCashReconciliations(resCash.value.data.data);
        }
        if (resVoid.status === 'fulfilled' && resVoid.value.data?.data) {
          setVoidOrders(resVoid.value.data.data);
        }
      }
    } catch {
      // Keep state if offline
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  };

  const handleApprovePo = async (poId: number, poNum: string) => {
    try {
      setIsProcessingApproval(true);
      const res = await api.patch(`/procurement/orders/${poId}/approve`);
      alert(res.data.message || `Purchase Order ${poNum} berhasil disetujui! Admin gudang dapat mengonfirmasi penerimaan saat kurir tiba.`);
      await fetchLiveStock();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menyetujui Purchase Order.');
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const handleRejectPo = async (poId: number, poNum: string) => {
    const reason = window.prompt(`Masukkan alasan penolakan PO ${poNum}:`, 'Harga belum sesuai / anggaran terbatas');
    if (!reason) return;
    try {
      setIsProcessingApproval(true);
      const res = await api.patch(`/procurement/orders/${poId}/reject`, { reason });
      alert(res.data.message || `Purchase Order ${poNum} telah ditolak.`);
      await fetchLiveStock();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menolak Purchase Order.');
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const handleApproveOpname = async (opnameId: number, opnameNum: string) => {
    try {
      setIsProcessingApproval(true);
      const res = await api.patch(`/audit/stock-opnames/${opnameId}/approve`);
      alert(res.data.message || `Hasil Stock Opname ${opnameNum} berhasil diverifikasi & saldo stok gudang telah resmi diperbarui!`);
      await fetchLiveStock();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menyetujui Stock Opname.');
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const handleToggleAttendance = async (employeeId: number, action: 'CLOCK_IN' | 'CLOCK_OUT') => {
    try {
      setIsTogglingAttendance(true);
      const res = await api.post('/hr/attendance/toggle', { employee_id: employeeId, action });
      alert(res.data.message || 'Presensi karyawan berhasil diperbarui!');
      fetchLiveStock('shifts');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal mengubah presensi karyawan.');
    } finally {
      setIsTogglingAttendance(false);
    }
  };

  const handleExportAssetValuation = () => {
    const today = new Date().toISOString().slice(0, 10);
    const headers = [
      'No',
      'SKU',
      'Nama Bahan Baku',
      'Kemasan Gudang',
      'Sisa Stok Fisik',
      'Batas Buffer Minimum',
      'Total Nilai Aset (Rp)',
      'Status Buffer'
    ];

    const totalVal = materials.reduce((acc, m) => {
      let c = Number(m.avg_cost_per_unit) || 0;
      if (c > 0 && c < 10) c *= 1000;
      return acc + (Number(m.current_stock) * c);
    }, 0);

    const rows = materials.map((m, idx) => {
      let c = Number(m.avg_cost_per_unit) || 0;
      if (c > 0 && c < 10) c *= 1000;
      const itemVal = Math.round(Number(m.current_stock) * c);
      const isOutOfStock = m.current_stock <= 0;
      const isLow = m.current_stock > 0 && m.current_stock <= m.min_stock_alert;
      const status = isOutOfStock ? 'STOK HABIS' : isLow ? 'MENIPIS' : 'AMAN';
      const packSpec = getPackagingSpec(m);
      const stockQty = formatHumanQuantity(m.current_stock, m);
      const bufferQty = formatHumanQuantity(m.min_stock_alert, m);

      return [
        idx + 1,
        m.sku,
        m.name,
        packSpec,
        `${stockQty.primary}${stockQty.secondary ? ` (${stockQty.secondary})` : ''}`,
        `${bufferQty.primary}${bufferQty.secondary ? ` (${bufferQty.secondary})` : ''}`,
        itemVal,
        status
      ];
    });

    const lowCount = materials.filter(m => m.current_stock <= m.min_stock_alert).length;

    exportStyledExcel({
      filename: `Laporan_Valuasi_Aset_Bahan_${today}`,
      title: 'LAPORAN VALUASI ASET & BIAYA BAHAN BAKU OUTLET',
      subtitle: 'Monitoring nilai finansial persediaan barang, moving average HPP, status buffer safety stock, dan food cost control',
      author: 'Store Manager / Faiz Rifki Syuhada',
      summaryItems: [
        { label: 'TOTAL BAHAN BAKU', value: `${materials.length} Item` },
        { label: 'PERLU RESTOCK / MENIPIS', value: `${lowCount} Item` },
        { label: 'TOTAL VALUASI ASET', value: `Rp ${Math.round(totalVal).toLocaleString('id-ID')}` },
      ],
      headers,
      rows,
    });
  };

  const handleExportAttendance = () => {
    const today = new Date().toISOString().slice(0, 10);
    if (!attendanceData?.employees) return;
    const headers = [
      'Kode Staf',
      'Nama Karyawan',
      'Jabatan / Divisi',
      'Email',
      'Status Kehadiran',
      'Jam Masuk (Clock-In)',
      'Jam Pulang (Clock-Out)',
      'Durasi Kerja',
      'Keterlambatan (Menit)'
    ];
    const rows = attendanceData.employees.map((emp: any) => [
      emp.employee_code,
      emp.name,
      emp.position,
      emp.email,
      emp.status === 'WORKING' ? 'Sedang Bertugas' : emp.status === 'FINISHED' ? 'Selesai Shift' : 'Belum Hadir',
      emp.clock_in ? `${emp.clock_in} WIB` : '-',
      emp.clock_out ? `${emp.clock_out} WIB` : '-',
      emp.duration_formatted,
      emp.late_minutes
    ]);
    const totalStaff = attendanceData.employees.length;
    const workingStaff = attendanceData.employees.filter((e: any) => e.status === 'WORKING').length;

    exportStyledExcel({
      filename: `Laporan_Presensi_Karyawan_${today}`,
      title: 'REKAPITULASI PRESENSI & KEHADIRAN STAF OUTLET',
      subtitle: 'Laporan absensi harian karyawan outlet, status shift aktif, dan kepatuhan jam kerja',
      author: 'Faiz Rifki Syuhada (Owner)',
      summaryItems: [
        { label: 'TOTAL KARYAWAN', value: `${totalStaff} Orang` },
        { label: 'SEDANG BERTUGAS', value: `${workingStaff} Orang` },
      ],
      headers,
      rows,
    });
  };

  // Immediate fetch on tab change & Polling interval 10s (stops if tab in background)
  useEffect(() => {
    fetchLiveStock(activeSubTab);
    const interval = setInterval(() => {
      fetchLiveStock();
    }, 10000);
    return () => clearInterval(interval);
  }, [activeSubTab]);

  // Recipe calculation for new menu modal
  const calculatedNewMenuCogs = useMemo(() => {
    return recipeRows.reduce((acc, row) => {
      const mat = materials.find(m => m.id === row.raw_material_id);
      const qty = Number(row.qty_needed) || 0;
      let costPerUnit = Number(mat?.avg_cost_per_unit) || 0;
      if (costPerUnit > 0 && costPerUnit < 10) costPerUnit *= 1000;
      return acc + (qty * costPerUnit);
    }, 0);
  }, [recipeRows, materials]);

  const calculatedNewMenuMargin = useMemo(() => {
    const price = Number(newMenuPrice) || 0;
    if (price <= 0) return { profit: 0, percentage: 0 };
    const profit = price - calculatedNewMenuCogs;
    const percentage = Math.round((profit / price) * 100);
    return { profit, percentage };
  }, [newMenuPrice, calculatedNewMenuCogs]);

  const handleAddRecipeRow = () => {
    if (materials.length === 0) return;
    setRecipeRows([...recipeRows, { raw_material_id: materials[0].id, qty_needed: '1' }]);
  };

  const handleRemoveRecipeRow = (index: number) => {
    setRecipeRows(recipeRows.filter((_, idx) => idx !== index));
  };

  const handleRecipeRowChange = (index: number, field: 'raw_material_id' | 'qty_needed', value: any) => {
    setRecipeRows(recipeRows.map((r, idx) => idx === index ? { ...r, [field]: value } : r));
  };

  const handleSubmitNewMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuName || !newMenuPrice) return;
    setIsSubmittingMenu(true);

    try {
      await api.post('/menu/products', {
        name: newMenuName,
        category_id: newMenuCategory,
        base_price: Number(newMenuPrice),
        recipes: recipeRows.map(r => ({
          raw_material_id: r.raw_material_id,
          qty_needed: Number(r.qty_needed),
        })),
      });

      await fetchLiveStock();
      setShowAddMenuModal(false);
      setNewMenuName('');
      setNewMenuPrice('');
      setRecipeRows([
        { raw_material_id: 1, qty_needed: '18' },
        { raw_material_id: 3, qty_needed: '150' },
      ]);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menambahkan menu baru.');
    } finally {
      setIsSubmittingMenu(false);
    }
  };

  const filteredEmployees = useMemo(() => {
    return employeesList.filter((emp) => {
      const q = searchEmployee.toLowerCase();
      return (
        emp.name?.toLowerCase().includes(q) ||
        emp.employee_code?.toLowerCase().includes(q) ||
        emp.position?.toLowerCase().includes(q) ||
        emp.email?.toLowerCase().includes(q)
      );
    });
  }, [employeesList, searchEmployee]);

  const lowStockCount = materials.filter(m => m.current_stock <= m.min_stock_alert).length;
  const pendingApprovalsCount = pendingPurchaseOrders.length + pendingOpnames.length;

  const formatIDR = (val: number | string) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(val));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Halaman Manajer Kedai</h1>
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Terhubung Otomatis
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Persetujuan pembelian, pengaturan menu & takaran resep, pemantauan stok bahan, dan absensi kerja karyawan.
          </p>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200/60 text-xs font-semibold">
            <button
              onClick={() => setActiveSubTab('approvals')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                activeSubTab === 'approvals' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Pusat Persetujuan
              {pendingApprovalsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold animate-pulse">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveSubTab('menu_bom')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                activeSubTab === 'menu_bom' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Coffee className="w-3.5 h-3.5 text-amber-600" /> Kelola Menu & Resep ({products.length})
            </button>
            <button
              onClick={() => setActiveSubTab('asset_valuation')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                activeSubTab === 'asset_valuation' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Valuasi Aset & Biaya Bahan
              {lowStockCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] flex items-center justify-center font-bold">
                  {lowStockCount}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveSubTab('employees');
                fetchEmployees();
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                activeSubTab === 'employees' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-purple-600" /> Data Karyawan ({employeesList.length || 7})
            </button>
            <button
              onClick={() => setActiveSubTab('shifts')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                activeSubTab === 'shifts' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-600" /> Presensi Karyawan (Live)
              {attendanceData && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              )}
            </button>
            <button
              onClick={() => setActiveSubTab('tables')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                activeSubTab === 'tables' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <QrCode className="w-3.5 h-3.5 text-amber-600" /> Stiker & QR Meja
            </button>
            <button
              onClick={() => {
                setActiveSubTab('cashier_reconciliation');
                fetchLiveStock('cashier_reconciliation');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                activeSubTab === 'cashier_reconciliation' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Scale className="w-3.5 h-3.5 text-purple-600" /> Pemeriksaan Kasir & Kas
            </button>
          </div>

          <button
            onClick={() => fetchLiveStock()}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
            title="Refresh Data Sekarang"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* SUBTAB 0: PUSAT PERSETUJUAN (APPROVAL HUB - MAKER VS CHECKER) */}
      {activeSubTab === 'approvals' && (
        <div className="space-y-6">
          {/* Header Info Banner */}
          <div className="bg-indigo-50 border border-indigo-200 p-5 rounded-3xl text-xs space-y-2 text-indigo-950">
            <div className="flex items-center gap-2 font-bold text-sm text-indigo-900">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <span>Pusat Persetujuan Pembelian & Pengecekan Bahan Baku</span>
            </div>
            <p className="text-indigo-800 leading-relaxed">
              Prinsip Keamanan Toko: Setiap pembelian bahan baku dan pengecekan fisik diajukan terlebih dahulu oleh <strong>Bagian Gudang</strong>. Manajer atau Pemilik Kedai memeriksa dan menyetujuinya di sini sebelum uang/tagihan dan stok resmi tercatat di sistem keuangan.
            </p>
          </div>

          {/* Bagian 1: Persetujuan Purchase Orders (PO) */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-indigo-600" />
                <h2 className="font-bold text-slate-900 text-sm">
                  Pengajuan Pembelian Bahan Baku dari Gudang
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200">
                  {pendingPurchaseOrders.length} Menunggu Persetujuan
                </span>
              </div>
            </div>

            {pendingPurchaseOrders.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Tidak ada pembelian bahan yang menunggu persetujuan saat ini.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingPurchaseOrders.map((po) => (
                  <div key={po.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">{po.po_number}</span>
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]">
                          Menunggu Persetujuan
                        </span>
                      </div>
                      <div className="text-slate-600">
                        <strong>Pemasok:</strong> {po.supplier_name} • <strong>Diajukan oleh:</strong> {po.requester?.name || 'Bagian Gudang'}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        <strong>Rincian Bahan:</strong> {po.items?.map((it: any) => {
                          const mat = it.raw_material;
                          const qty = Number(it.qty_ordered);
                          const u = mat?.unit || '';
                          let qtyDisplay = `${qty.toLocaleString('id-ID')} ${u}`;
                          if (u === 'gram' && qty >= 1000) {
                            qtyDisplay = `${(qty / 1000).toLocaleString('id-ID')} kg (${qty.toLocaleString('id-ID')} g)`;
                          } else if (u === 'ml' && qty >= 1000) {
                            qtyDisplay = `${(qty / 1000).toLocaleString('id-ID')} Liter (${qty.toLocaleString('id-ID')} ml)`;
                          }
                          return `${mat?.name || 'Bahan'} [${qtyDisplay}]`;
                        }).join(', ')}
                      </div>
                      <div className="text-slate-500 italic text-[11px]">
                        "{po.notes || 'Pengadaan bahan baku'}"
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right mr-2">
                        <span className="text-[10px] text-slate-400 block">Total Biaya Belanja</span>
                        <span className="font-mono font-bold text-slate-900 text-sm">{formatIDR(po.total_amount)}</span>
                      </div>
                      <button
                        onClick={() => handleRejectPo(po.id, po.po_number)}
                        disabled={isProcessingApproval}
                        className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition cursor-pointer"
                      >
                        ✕ Tolak
                      </button>
                      <button
                        onClick={() => handleApprovePo(po.id, po.po_number)}
                        disabled={isProcessingApproval}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                      >
                        ✓ Setujui Pembelian
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bagian 2: Persetujuan Hasil Stock Opname */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-teal-600" />
                <h2 className="font-bold text-slate-900 text-sm">
                  Pengajuan Pengecekan Stok Fisik dari Gudang
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200">
                  {pendingOpnames.length} Menunggu Verifikasi
                </span>
              </div>
            </div>

            {pendingOpnames.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Tidak ada pengecekan fisik yang menunggu verifikasi saat ini.
              </div>
            ) : (
              <div className="space-y-4">
                {pendingOpnames.map((opn) => (
                  <div key={opn.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{opn.opname_number}</span>
                          <span className="text-[11px] text-slate-400 font-mono">Tgl: {opn.opname_date}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Dicek oleh: <strong>{opn.auditor?.name || 'Bagian Gudang'}</strong> • "{opn.notes}"
                        </p>
                      </div>

                      <button
                        onClick={() => handleApproveOpname(opn.id, opn.opname_number)}
                        disabled={isProcessingApproval}
                        className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                      >
                        ✓ Verifikasi & Terapkan Saldo Stok
                      </button>
                    </div>

                    {/* Breakdown items */}
                    <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-100/70 text-slate-500 text-[10px] uppercase font-bold">
                          <tr>
                            <th className="p-2.5">Bahan Baku</th>
                            <th className="p-2.5">Stok Sistem</th>
                            <th className="p-2.5">Hitungan Fisik Riil</th>
                            <th className="p-2.5">Selisih (Variance)</th>
                            <th className="p-2.5">Alasan Selisih</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {opn.items?.map((it: any) => {
                            const diff = Number(it.variance_qty);
                            const mat = it.raw_material || it.rawMaterial || {};
                            const sysQty = formatHumanQuantity(Number(it.system_stock), mat);
                            const physQty = formatHumanQuantity(Number(it.physical_stock), mat);
                            const diffQty = formatHumanQuantity(Math.abs(diff), mat);

                            return (
                              <tr key={it.id} className="hover:bg-slate-50/70 transition">
                                <td className="p-2.5 font-bold text-slate-900">
                                  {mat.name || '-'}
                                  {mat.sku && <span className="text-[10px] text-slate-400 block font-mono font-normal">{mat.sku}</span>}
                                </td>
                                <td className="p-2.5 text-slate-700 font-mono">
                                  <span className="font-bold block">{sysQty.primary}</span>
                                  <span className="text-[10px] text-slate-400 font-sans block">
                                    ({Number(it.system_stock).toLocaleString('id-ID')} {mat.unit})
                                  </span>
                                </td>
                                <td className="p-2.5 font-mono">
                                  <span className="font-bold text-slate-900 block">{physQty.primary}</span>
                                  <span className="text-[10px] text-slate-400 font-sans block">
                                    ({Number(it.physical_stock).toLocaleString('id-ID')} {mat.unit})
                                  </span>
                                </td>
                                <td className="p-2.5">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono inline-block ${
                                    diff === 0
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : diff < 0
                                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                                  }`}>
                                    {diff === 0 ? '0 (Sesuai ✅)' : diff < 0 ? `-${diffQty.primary}` : `+${diffQty.primary}`}
                                  </span>
                                  {diff !== 0 && (
                                    <span className={`text-[10px] font-sans font-semibold block mt-0.5 ${diff < 0 ? 'text-rose-600' : 'text-blue-600'}`}>
                                      {diff < 0 ? '🔴 Kurang' : '🔵 Lebih'} ({diff > 0 ? '+' : ''}{diff.toLocaleString('id-ID')} {mat.unit})
                                    </span>
                                  )}
                                </td>
                                <td className="p-2.5 text-slate-500 text-[11px]">{it.reason || '-'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: KELOLA MENU & RESEP BOM (BACK OFFICE ACCESS) */}
      {activeSubTab === 'menu_bom' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-900 text-base">Kelola Daftar Menu & Takaran Resep Bahan Baku</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200">
                  Otomatis Terbit ke QR & Kasir
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Manajer dapat mendaftarkan menu baru dan takaran resep yang otomatis memotong stok gudang saat pesanan dibuat.
              </p>
            </div>

            <button
              onClick={() => setShowAddMenuModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-sm transition cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" /> + Tambah Menu Baru
            </button>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => {
              const unitCogs = (p.recipes || []).reduce((sum, r) => {
                let cost = Number(r.raw_material?.avg_cost_per_unit) || 0;
                if (cost > 0 && cost < 10) cost *= 1000;
                return sum + (Number(r.qty_needed) * cost);
              }, 0);

              const margin = p.base_price > 0 ? Math.round(((p.base_price - unitCogs) / p.base_price) * 100) : 0;

              return (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-amber-400 transition shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold text-[10px] uppercase">
                        {p.category?.name || 'Beverage'}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">{p.sku}</span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm leading-snug">{p.name}</h3>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex justify-between items-baseline">
                      <span className="text-xs text-slate-400">Harga Jual:</span>
                      <span className="font-bold font-mono text-sm text-slate-900">{formatIDR(p.base_price)}</span>
                    </div>

                    {/* Recipe Ingredients Pill List */}
                    <div className="mt-3 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 text-[11px] space-y-1">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Takaran Resep Bahan Baku:
                      </div>
                      {p.recipes && p.recipes.length > 0 ? (
                        p.recipes.map((r, idx) => {
                          const matName = (r.raw_material?.name || 'Bahan').toLowerCase();
                          const qty = Number(r.qty_needed);
                          let yieldHint = '';
                          if (matName.includes('pastry') || matName.includes('croissant') || matName.includes('adonan')) {
                            yieldHint = '(1 kg = 10 pcs)';
                          } else if (matName.includes('air') || matName.includes('galon')) {
                            yieldHint = '(1 Galon = 95 cup)';
                          } else if (matName.includes('kopi')) {
                            yieldHint = '(1 kg = 55 cup)';
                          } else if (matName.includes('susu')) {
                            yieldHint = '(1 L = 5 cup)';
                          }

                          return (
                            <div key={idx} className="flex justify-between items-center text-slate-600 text-[11px]">
                              <span>• {r.raw_material?.name || 'Bahan'}</span>
                              <div className="text-right">
                                <span className="font-mono font-semibold text-slate-800">
                                  {qty} {r.raw_material?.unit}
                                </span>
                                {yieldHint && (
                                  <span className="text-[10px] text-purple-600 ml-1 font-medium font-sans">
                                    {yieldHint}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-slate-400 italic">Belum ada resep bahan.</div>
                      )}
                    </div>
                  </div>

                  {/* Profit Margin Info */}
                  <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Biaya Modal Bahan:</span>
                      <span className="font-mono font-bold text-slate-700">{formatIDR(unitCogs)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Perkiraan Keuntungan:</span>
                      <span className="font-mono font-bold text-emerald-600">~{margin}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 3: VALUASI ASET & BIAYA BAHAN BAKU (FOOD COST CONTROL) */}
      {activeSubTab === 'asset_valuation' && (() => {
        const totalAssetValuation = materials.reduce((acc, m) => {
          let c = Number(m.avg_cost_per_unit) || 0;
          if (c > 0 && c < 10) c *= 1000;
          return acc + (Number(m.current_stock) * c);
        }, 0);

        const filteredMaterials = materials.filter((m) => {
          const matchesSearch = m.name.toLowerCase().includes(searchMaterial.toLowerCase()) ||
            m.sku.toLowerCase().includes(searchMaterial.toLowerCase());
          if (!matchesSearch) return false;

          const isOut = m.current_stock <= 0;
          const isLow = m.current_stock > 0 && m.current_stock <= m.min_stock_alert;

          if (assetFilter === 'SAFE') return !isOut && !isLow;
          if (assetFilter === 'LOW') return isLow;
          if (assetFilter === 'OUT') return isOut;
          return true;
        });

        return (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-6">
            {/* Header Title & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-slate-900 text-base">Valuasi Aset Stok Bahan Baku (Food Cost Control)</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                    Nilai Finansial Riil
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Monitoring audit nilai rupiah inventaris bahan baku, status safety buffer, dan total modal kerja tersimpan di outlet.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari bahan baku atau SKU..."
                    value={searchMaterial}
                    onChange={(e) => setSearchMaterial(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 pl-8.5 pr-3 py-1.5 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>

                <button
                  onClick={handleExportAssetValuation}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-xs font-bold rounded-xl transition cursor-pointer shrink-0 shadow-xs"
                  title="Export Laporan Valuasi ke Excel / CSV"
                >
                  <Download className="w-3.5 h-3.5" /> Export Excel
                </button>
              </div>
            </div>

            {/* 3 Executive Financial KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-emerald-50/50 border border-emerald-200/60 p-4 rounded-2xl">
                <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
                  Total Valuasi Stok Bahan
                </span>
                <p className="text-xl font-black font-mono text-emerald-800 mt-1">
                  Rp {Math.round(totalAssetValuation).toLocaleString('id-ID')}
                </p>
                <span className="text-[10px] text-emerald-600 mt-0.5 block">Modal kerja tersimpan di rak/chiller</span>
              </div>

              <div className="bg-amber-50/60 border border-amber-200/70 p-4 rounded-2xl">
                <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
                  Perlu Restock / Buffer Kritis
                </span>
                <p className="text-xl font-bold font-mono text-amber-800 mt-1">
                  {lowStockCount} Item
                </p>
                <span className="text-[10px] text-amber-600 mt-0.5 block">Stok &le; batas minimum alert</span>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Total Bahan Terdaftar
                </span>
                <p className="text-xl font-bold font-mono text-slate-900 mt-1">
                  {materials.length} Item
                </p>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Bahan baku aktif dalam resep</span>
              </div>
            </div>

            {/* Segregation of Duties Info Banner */}
            <div className="bg-indigo-50/60 border border-indigo-100 p-3 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-indigo-900">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  <strong>Pemisahan Wewenang (Internal Control):</strong> Nilai finansial bahan baku diawasi oleh <strong>Store Manager</strong>. Operasional fisik (penerimaan kiriman supplier, hitung fisik rak, & inisiasi PO) dilakukan oleh <strong>Admin Gudang</strong> di portal Gudang.
                </span>
              </div>
              <button
                onClick={() => setActiveSubTab('approvals')}
                className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold rounded-lg text-[11px] shrink-0 cursor-pointer self-end sm:self-auto"
              >
                Pusat Persetujuan PO ➔
              </button>
            </div>

            {/* Quick Status Filter Pills & Action */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-slate-500 font-semibold mr-1">Filter Status:</span>
                <button
                  onClick={() => setAssetFilter('ALL')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    assetFilter === 'ALL' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua Bahan ({materials.length})
                </button>
                <button
                  onClick={() => setAssetFilter('SAFE')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    assetFilter === 'SAFE' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  🟢 Stok Aman ({materials.filter(m => m.current_stock > m.min_stock_alert).length})
                </button>
                <button
                  onClick={() => setAssetFilter('LOW')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    assetFilter === 'LOW' ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  🟡 Menipis ({materials.filter(m => m.current_stock > 0 && m.current_stock <= m.min_stock_alert).length})
                </button>
                <button
                  onClick={() => setAssetFilter('OUT')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    assetFilter === 'OUT' ? 'bg-rose-600 text-white shadow-xs' : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  🔴 Stok Habis ({materials.filter(m => m.current_stock <= 0).length})
                </button>
              </div>

              <button
                onClick={() => setShowAddMaterialModal(true)}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> + Tambah Bahan Baku Baru
              </button>
            </div>

            {/* Valuation Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold bg-slate-50/50">
                    <th className="py-3 px-3">Bahan Baku & SKU</th>
                    <th className="py-3 px-3 text-center">Kemasan Standar Gudang</th>
                    <th className="py-3 px-3 text-right">Sisa Stok Fisik</th>
                    <th className="py-3 px-3 text-right">Batas Buffer Minimum</th>
                    <th className="py-3 px-3 text-right font-black text-slate-900">Total Valuasi Aset</th>
                    <th className="py-3 px-3 text-center">Status Buffer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMaterials.map((m) => {
                    const isOutOfStock = m.current_stock <= 0;
                    const isLow = m.current_stock > 0 && m.current_stock <= m.min_stock_alert;

                    let c = Number(m.avg_cost_per_unit) || 0;
                    if (c > 0 && c < 10) c *= 1000;

                    const itemVal = Math.round(Number(m.current_stock) * c);
                    const stockQty = formatHumanQuantity(m.current_stock, m);
                    const bufferQty = formatHumanQuantity(m.min_stock_alert, m);

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-3">
                          <div className="font-semibold text-slate-900">{m.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{m.sku}</div>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/60">
                            {getPackagingSpec(m)}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-sm">
                          <div>
                            <span className={isOutOfStock ? 'text-rose-700 font-black' : isLow ? 'text-amber-600 font-black' : 'text-slate-900 font-bold'}>
                              {stockQty.primary}
                            </span>
                          </div>
                          {stockQty.secondary && (
                            <div className="text-[10px] text-slate-400 font-sans font-medium mt-0.5">
                              {stockQty.secondary}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-sm">
                          <div className="font-bold text-slate-700">
                            {bufferQty.primary}
                          </div>
                          {bufferQty.secondary && (
                            <div className="text-[10px] text-slate-400 font-sans font-medium mt-0.5">
                              {bufferQty.secondary}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono font-black text-sm text-emerald-800 bg-emerald-50/20">
                          Rp {itemVal.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold border border-rose-300 text-[10px] shadow-2xs">
                              <XCircle className="w-3 h-3 text-rose-600" /> 🔴 Stok Habis
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-300 text-[10px]">
                              <AlertTriangle className="w-3 h-3 text-amber-600" /> 🟡 Menipis
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[10px]">
                              <CheckCircle className="w-3 h-3 text-emerald-600" /> 🟢 Stok Aman
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* SUBTAB 4: DATA KARYAWAN & MANAJEMEN SDM */}
      {activeSubTab === 'employees' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-bold text-slate-900 text-base">Data Karyawan & Manajemen SDM</h2>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
                  <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                  Master SDM
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Kelola profil karyawan, jabatan kerja, divisi, akses login operasional, dan status aktif staf kedai.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddEmployeeModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5 text-amber-400" /> + Tambah Karyawan Baru
              </button>
              <button
                onClick={fetchEmployees}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
                title="Refresh Data Karyawan"
              >
                <RefreshCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Karyawan</span>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {employeesList.length}
              </div>
              <span className="text-[11px] text-slate-400">Staf Terdaftar Aktif</span>
            </div>

            <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-4 shadow-2xs">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                ☕ Tim Barista
              </span>
              <div className="text-2xl font-bold font-mono text-amber-900 mt-1">
                {employeesList.filter(e => e.position === 'BARISTA').length}
              </div>
              <span className="text-[11px] text-amber-700/80">Peracik Minuman Kopi</span>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-4 shadow-2xs">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                💼 Kasir & Admin Gudang
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-900 mt-1">
                {employeesList.filter(e => ['CASHIER', 'ADMIN_GUDANG'].includes(e.position)).length}
              </div>
              <span className="text-[11px] text-emerald-700/80">Operasional Depan & Logistik</span>
            </div>

            <div className="bg-purple-50/50 border border-purple-200/80 rounded-2xl p-4 shadow-2xs">
              <span className="text-xs font-bold text-purple-800 uppercase tracking-wider flex items-center gap-1">
                👔 Store Manager
              </span>
              <div className="text-2xl font-bold font-mono text-purple-900 mt-1">
                {employeesList.filter(e => e.position === 'MANAGER').length}
              </div>
              <span className="text-[11px] text-purple-700/80">Manajer Kedai Operasional</span>
            </div>
          </div>

          {/* Search Box */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama karyawan, kode staf, atau posisi..."
                value={searchEmployee}
                onChange={(e) => setSearchEmployee(e.target.value)}
                className="w-full bg-white border border-slate-200 pl-10 pr-4 py-2 text-xs rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-2xs"
              />
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Menampilkan {filteredEmployees.length} dari {employeesList.length} karyawan
            </span>
          </div>

          {/* Employee Table */}
          <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Karyawan</th>
                    <th className="py-3.5 px-4">Kode Staf</th>
                    <th className="py-3.5 px-4">Posisi & Bagian</th>
                    <th className="py-3.5 px-4">Email Login</th>
                    <th className="py-3.5 px-4">No. Telepon / WA</th>
                    <th className="py-3.5 px-4 text-center">Status Akun</th>
                    <th className="py-3.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.map((emp) => (
                    <tr 
                      key={emp.id} 
                      className="hover:bg-amber-50/30 transition cursor-pointer group"
                      onClick={() => handleOpenEditEmployee(emp)}
                      title="Klik untuk mengubah data karyawan ini"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs ${
                            emp.position === 'OWNER' ? 'bg-amber-100 text-amber-800' :
                            emp.position === 'MANAGER' ? 'bg-purple-100 text-purple-800' :
                            emp.position === 'CASHIER' ? 'bg-emerald-100 text-emerald-800' :
                            emp.position === 'ADMIN_GUDANG' ? 'bg-blue-100 text-blue-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {emp.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-amber-600 transition flex items-center gap-1.5">
                              {emp.name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">ID: #{emp.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        {emp.employee_code}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          emp.position === 'OWNER' ? 'bg-amber-100 text-amber-800' :
                          emp.position === 'MANAGER' ? 'bg-purple-100 text-purple-800' :
                          emp.position === 'CASHIER' ? 'bg-emerald-100 text-emerald-800' :
                          emp.position === 'ADMIN_GUDANG' ? 'bg-blue-100 text-blue-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {emp.position === 'OWNER' ? '👑 Owner' :
                           emp.position === 'MANAGER' ? '👔 Store Manager' :
                           emp.position === 'CASHIER' ? '💵 Kasir Utama' :
                           emp.position === 'ADMIN_GUDANG' ? '📦 Admin Gudang' :
                           '☕ Barista'}
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">{emp.department || '-'}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {emp.email}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {emp.phone || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {emp.employment_status === 'INACTIVE' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Nonaktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Aktif
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        {emp.position === 'OWNER' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200" title="Akun Pemilik Kedai (Owner) dilindungi">
                            🔒 Akun Owner
                          </span>
                        ) : (
                          <button
                            onClick={() => handleOpenEditEmployee(emp)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                          >
                            <Pencil className="w-3 h-3 text-slate-500" /> Ubah
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: PRESENSI & KEHADIRAN REAL-TIME SEMUA KARYAWAN */}
      {activeSubTab === 'shifts' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-bold text-slate-900 text-base">Presensi & Kehadiran Real-Time Seluruh Karyawan</h2>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 shadow-2xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Live Monitor
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Pantau kehadiran seluruh staf perusahaan secara real-time. Jam masuk, pulang, durasi shift, dan aksi Clock-In/Out cepat.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                📅 {attendanceData?.date || 'Hari Ini'}
              </span>
              <button
                onClick={handleExportAttendance}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
                title="Export Data Presensi ke Excel / CSV"
              >
                <Download className="w-3.5 h-3.5" /> Export Excel
              </button>
              <button
                onClick={() => fetchLiveStock()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Karyawan</span>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {attendanceData?.total_employees || 4}
              </div>
              <span className="text-[11px] text-slate-400">Terdaftar di Perusahaan</span>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-4 shadow-2xs">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Sedang Bertugas
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
                {attendanceData?.working_now || 0}
              </div>
              <span className="text-[11px] text-emerald-600">Aktif di outlet saat ini</span>
            </div>

            <div className="bg-rose-50/50 border border-rose-200/80 rounded-2xl p-4 shadow-2xs">
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Belum Clock-In
              </span>
              <div className="text-2xl font-bold font-mono text-rose-700 mt-1">
                {attendanceData?.not_present || 0}
              </div>
              <span className="text-[11px] text-rose-600">Belum masuk hari ini</span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span> Selesai Shift
              </span>
              <div className="text-2xl font-bold font-mono text-slate-800 mt-1">
                {attendanceData?.finished || 0}
              </div>
              <span className="text-[11px] text-slate-500">Sudah Clock-Out</span>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
              <h3 className="font-bold text-slate-900 text-sm">Daftar Kehadiran Seluruh Karyawan (Live)</h3>

              {/* Filter Buttons */}
              <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-semibold gap-1">
                <button
                  onClick={() => setAttendanceFilter('ALL')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    attendanceFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Semua ({attendanceData?.employees?.length || 0})
                </button>
                <button
                  onClick={() => setAttendanceFilter('WORKING')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    attendanceFilter === 'WORKING' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  🟢 Bertugas ({attendanceData?.working_now || 0})
                </button>
                <button
                  onClick={() => setAttendanceFilter('NOT_CLOCKED_IN')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    attendanceFilter === 'NOT_CLOCKED_IN' ? 'bg-white text-rose-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  🔴 Belum Masuk ({attendanceData?.not_present || 0})
                </button>
                <button
                  onClick={() => setAttendanceFilter('FINISHED')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    attendanceFilter === 'FINISHED' ? 'bg-white text-slate-800 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  ⚪ Selesai ({attendanceData?.finished || 0})
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="pb-3">Karyawan & Posisi</th>
                    <th className="pb-3 text-center">Status Kehadiran</th>
                    <th className="pb-3 text-center">Device HP (Anti-Titip)</th>
                    <th className="pb-3 text-center">Ketepatan Waktu</th>
                    <th className="pb-3 text-center">Alasan Terlambat / Komentar</th>
                    <th className="pb-3 text-center">Lokasi GPS (Lat, Long)</th>
                    <th className="pb-3 text-center">Jam Masuk (Clock-In)</th>
                    <th className="pb-3 text-center">Jam Pulang (Clock-Out)</th>
                    <th className="pb-3 text-center">Durasi Kerja</th>
                    <th className="pb-3 text-right">Aksi Cepat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendanceData?.employees
                    ?.filter((emp: any) => attendanceFilter === 'ALL' || emp.status === attendanceFilter)
                    ?.map((emp: any) => {
                      const isWorking = emp.status === 'WORKING';
                      const isFinished = emp.status === 'FINISHED';
                      const isNotPresent = emp.status === 'NOT_CLOCKED_IN';

                      return (
                        <tr key={emp.employee_id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3.5 pr-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center ${
                                emp.position === 'MANAGER' ? 'bg-purple-100 text-purple-800' :
                                emp.position === 'CASHIER' ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'
                              }`}>
                                {emp.position === 'MANAGER' ? 'MN' : emp.position === 'CASHIER' ? 'KS' : 'BR'}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-sm">{emp.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {emp.employee_code} • {emp.position} • {emp.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 text-center">
                            {isWorking && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[11px] shadow-2xs">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                🟢 Sedang Bertugas
                              </span>
                            )}
                            {isFinished && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 font-bold border border-slate-200 text-[11px]">
                                ⚪ Selesai Shift
                              </span>
                            )}
                            {isNotPresent && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200 text-[11px]">
                                🔴 Belum Clock-In
                              </span>
                            )}
                          </td>

                          {/* Device Lock Anti-Titip Absen Column */}
                          <td className="py-3.5 text-center">
                            {emp.is_device_locked ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-[10px]">
                                <Lock className="w-3 h-3 text-amber-600 shrink-0" />
                                <span className="font-semibold truncate max-w-[110px]">{emp.device_info || '1 HP Terkunci'}</span>
                                <button
                                  onClick={async () => {
                                    if (confirm(`Reset kunci device HP untuk ${emp.name}? Karyawan dapat mendaftarkan HP baru pada scan berikutnya.`)) {
                                      await api.post(`/hr/attendance/reset-device/${emp.employee_id}`);
                                      alert('Device lock berhasil di-reset!');
                                      fetchLiveStock('shifts');
                                    }
                                  }}
                                  className="text-[9px] text-rose-600 hover:text-rose-800 font-bold underline ml-1 cursor-pointer shrink-0"
                                  title="Reset kunci device agar karyawan bisa pakai HP baru"
                                >
                                  Reset
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 inline-flex items-center gap-1">
                                <Unlock className="w-3 h-3" /> Siap Bind
                              </span>
                            )}
                          </td>

                          {/* Ketepatan Waktu (Batas 09:00 WIB) */}
                          <td className="py-3.5 text-center">
                            {emp.clock_in ? (
                              emp.late_minutes > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-200 text-[10px]">
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                  Terlambat +{emp.late_minutes}m
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                  <CheckCircle className="w-3 h-3 text-emerald-600" /> Tepat Waktu ✓
                                </span>
                              )
                            ) : (
                              <span className="text-slate-400 font-mono">-</span>
                            )}
                          </td>

                          {/* Alasan Keterlambatan / Komentar Karyawan */}
                          <td className="py-3.5 text-center">
                            {emp.late_reason || emp.notes ? (
                              <div className="inline-flex items-start gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50/90 text-amber-900 border border-amber-200/90 text-[11px] max-w-[190px] text-left shadow-2xs">
                                <MessageSquare className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                <span className="italic font-medium leading-snug line-clamp-2" title={emp.late_reason || emp.notes || undefined}>
                                  "{emp.late_reason || emp.notes}"
                                </span>
                              </div>
                            ) : emp.clock_in ? (
                              <span className="text-slate-400 text-[11px] italic">Tidak ada catatan</span>
                            ) : (
                              <span className="text-slate-400 font-mono">-</span>
                            )}
                          </td>

                          {/* Lokasi GPS & Maps */}
                          <td className="py-3.5 text-center">
                            {emp.clock_in ? (
                              <div className="inline-flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/80 text-[10px]">
                                <div className="flex items-center gap-1 font-bold text-slate-800">
                                  <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                                  <span className="truncate max-w-[120px]">{emp.location_name || 'Outlet Coffeeshop'}</span>
                                </div>
                                <div className="flex items-center gap-1 font-mono text-[9px] text-slate-500">
                                  <span>
                                    {emp.latitude && emp.longitude
                                      ? `${Number(emp.latitude).toFixed(4)}, ${Number(emp.longitude).toFixed(4)}`
                                      : '-6.2088, 106.8456'}
                                  </span>
                                  <a
                                    href={`https://www.google.com/maps?q=${emp.latitude || -6.2088},${emp.longitude || 106.8456}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-indigo-600 hover:text-indigo-800 underline font-sans font-bold ml-0.5"
                                    title="Buka lokasi di Google Maps"
                                  >
                                    Maps ↗
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-mono">-</span>
                            )}
                          </td>

                          <td className="py-3.5 text-center font-mono font-semibold text-slate-800">
                            {emp.clock_in ? `${emp.clock_in} WIB` : '-'}
                          </td>

                          <td className="py-3.5 text-center font-mono font-semibold text-slate-800">
                            {emp.clock_out ? `${emp.clock_out} WIB` : (isWorking ? 'Masih Bekerja' : '-')}
                          </td>

                          <td className="py-3.5 text-center font-mono font-bold text-indigo-700">
                            {emp.duration_formatted}
                          </td>

                          <td className="py-3.5 text-right">
                            {isNotPresent && (
                              <button
                                onClick={() => handleToggleAttendance(emp.employee_id, 'CLOCK_IN')}
                                disabled={isTogglingAttendance}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                              >
                                <LogIn className="w-3.5 h-3.5" /> Clock-In (Masuk)
                              </button>
                            )}
                            {isWorking && (
                              <button
                                onClick={() => handleToggleAttendance(emp.employee_id, 'CLOCK_OUT')}
                                disabled={isTogglingAttendance}
                                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                              >
                                <LogOut className="w-3.5 h-3.5" /> Clock-Out (Pulang)
                              </button>
                            )}
                            {isFinished && (
                              <span className="text-[11px] text-slate-400 font-medium italic">
                                Shift Ditutup
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: PUSAT QR CODE & STIKER MEJA PELANGGAN */}
      {activeSubTab === 'tables' && (
        <TableQrGenerator />
      )}

      {/* SUBTAB 6: PEMERIKSAAN KASIR & KAS (REKONSILIASI KAS & VOID AUDIT) */}
      {activeSubTab === 'cashier_reconciliation' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shadow-2xs">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-lg tracking-tight">Pemeriksaan Kasir & Rekonsiliasi Kas</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cocokkan fisik uang laci kasir saat tutup shift dan awasi pembatalan struk (void) untuk mencegah fraud.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200/60 text-xs font-bold">
                <button
                  onClick={() => setCashierAuditSubTab('RECONCILIATION')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer ${
                    cashierAuditSubTab === 'RECONCILIATION' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5 text-emerald-600" /> Tutup Shift Kasir
                </button>
                <button
                  onClick={() => setCashierAuditSubTab('VOID')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer ${
                    cashierAuditSubTab === 'VOID' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Audit Pembatalan (Void)
                </button>
              </div>

              <button
                onClick={() => fetchLiveStock('cashier_reconciliation')}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
                title="Segarkan Data"
              >
                <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* VIEW: RECONCILIATION */}
          {cashierAuditSubTab === 'RECONCILIATION' && (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center flex-wrap gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Pengecekan Uang Kasir (Tutup Shift)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Mencocokkan jumlah uang fisik di laci kasir dengan total penjualan tunai di sistem POS.</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
                  {cashReconciliations.length} Sesi Kasir Tercatat
                </span>
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
                    {cashReconciliations.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          Belum ada data rekonsiliasi tutup kasir.
                        </td>
                      </tr>
                    ) : (
                      cashReconciliations.map((c) => (
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
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW: VOID ORDERS */}
          {cashierAuditSubTab === 'VOID' && (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center flex-wrap gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Pemeriksaan Pembatalan Struk & Diskon</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Memantau apakah ada struk yang dibatalkan kasir setelah pesanan dibuat atau uang diterima.</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                  {voidOrders.length} Catatan Void
                </span>
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

      {/* MODAL TAMBAH MENU BARU DENGAN RESEP BOM (BACK OFFICE) */}
      {showAddMenuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 max-h-[92vh] overflow-y-auto overflow-x-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Tambah Menu Baru & Racikan Resep (BOM)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tentukan nama, harga jual, serta takaran bahan baku yang otomatis memotong stok gudang saat dipesan.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddMenuModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition cursor-pointer"
                title="Tutup Modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitNewMenu} className="space-y-4">
              {/* Nama Menu */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Menu Minuman / Makanan <span className="text-rose-500 font-black">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pandan Aren Latte, Salted Caramel Toast..."
                  value={newMenuName}
                  onChange={(e) => setNewMenuName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white font-medium"
                />
              </div>

              {/* Kategori & Harga Jual Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Kategori Menu</label>
                  <select
                    value={newMenuCategory}
                    onChange={(e) => setNewMenuCategory(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Harga Jual Outlet (IDR) <span className="text-rose-500 font-black">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                      Rp
                    </span>
                    <input
                      type="number"
                      required
                      min="1000"
                      placeholder="32.000"
                      value={newMenuPrice}
                      onChange={(e) => setNewMenuPrice(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3.5 py-2.5 text-xs rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Bill of Materials (BOM) Recipe Builder */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Racikan Resep Bahan Baku (BOM)</span>
                    <span className="text-[10px] text-slate-500">Stok bahan akan otomatis dipotong atomik dari gudang tiap menu terjual</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddRecipeRow}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs transition cursor-pointer active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Bahan
                  </button>
                </div>

                {/* Column Headers */}
                <div className="hidden sm:grid grid-cols-12 gap-2 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <div className="col-span-6">Nama Bahan Baku & Biaya Satuan</div>
                  <div className="col-span-3">Takaran Saji</div>
                  <div className="col-span-2 text-right">Estimasi HPP</div>
                  <div className="col-span-1 text-center">Hapus</div>
                </div>

                {/* Recipe Rows List */}
                <div className="space-y-2">
                  {recipeRows.map((row, idx) => {
                    const selectedMat = materials.find(m => m.id === row.raw_material_id);
                    const qty = Number(row.qty_needed) || 0;
                    let matCost = Number(selectedMat?.avg_cost_per_unit) || 0;
                    if (matCost > 0 && matCost < 10) matCost *= 1000;
                    const lineCost = qty * matCost;

                    return (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                        {/* Select Bahan Baku */}
                        <div className="col-span-12 sm:col-span-6 min-w-0">
                          <select
                            value={row.raw_material_id}
                            onChange={(e) => handleRecipeRowChange(idx, 'raw_material_id', Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-500 truncate"
                          >
                            {materials.map((m) => {
                              let c = Number(m.avg_cost_per_unit) || 0;
                              if (c > 0 && c < 10) c *= 1000;
                              return (
                                <option key={m.id} value={m.id}>
                                  {m.name} ({m.unit}) — Rp {c.toLocaleString('id-ID')}/{m.unit}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        {/* Takaran Qty Input */}
                        <div className="col-span-6 sm:col-span-3">
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              step="any"
                              min="0.1"
                              required
                              placeholder="1"
                              value={row.qty_needed}
                              onChange={(e) => handleRecipeRowChange(idx, 'qty_needed', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 pl-2.5 pr-12 py-1.5 text-xs rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                            />
                            <span className="absolute right-2 text-[10px] font-bold text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">
                              {selectedMat?.unit}
                            </span>
                          </div>
                        </div>

                        {/* Subtotal HPP */}
                        <div className="col-span-4 sm:col-span-2 text-right pr-1">
                          <span className="font-mono font-bold text-xs text-slate-900 block">
                            Rp {lineCost.toLocaleString('id-ID')}
                          </span>
                        </div>

                        {/* Delete Action */}
                        <div className="col-span-2 sm:col-span-1 text-center">
                          {recipeRows.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => handleRemoveRecipeRow(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Hapus bahan dari resep"
                            >
                              <Trash2 className="w-3.5 h-3.5 mx-auto" />
                            </button>
                          ) : (
                            <span className="text-slate-200 text-xs">-</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Financial Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="bg-amber-50/80 border border-amber-200/70 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                        Total Modal HPP Bahan
                      </span>
                      <span className="text-[11px] text-amber-700/80">Biaya pokok resep per porsi</span>
                    </div>
                    <span className="text-base font-black font-mono text-amber-900">
                      {formatIDR(calculatedNewMenuCogs)}
                    </span>
                  </div>

                  <div className={`p-3 rounded-xl border flex items-center justify-between ${
                    Number(newMenuPrice) > 0
                      ? calculatedNewMenuMargin.profit >= 0
                        ? 'bg-emerald-50/80 border-emerald-200/70'
                        : 'bg-rose-50/80 border-rose-200/70'
                      : 'bg-slate-100/80 border-slate-200'
                  }`}>
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                        Number(newMenuPrice) > 0 ? (calculatedNewMenuMargin.profit >= 0 ? 'text-emerald-800' : 'text-rose-800') : 'text-slate-500'
                      }`}>
                        Estimasi Margin Laba
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {Number(newMenuPrice) > 0 ? 'Potensi profit per porsi' : 'Isi harga jual di atas'}
                      </span>
                    </div>
                    <div className="text-right">
                      {Number(newMenuPrice) > 0 ? (
                        <>
                          <span className={`text-sm font-black font-mono block ${
                            calculatedNewMenuMargin.profit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                          }`}>
                            {formatIDR(calculatedNewMenuMargin.profit)}
                          </span>
                          <span className={`text-[10px] font-bold ${
                            calculatedNewMenuMargin.profit >= 0 ? 'text-emerald-600' : 'text-rose-500'
                          }`}>
                            ~{calculatedNewMenuMargin.percentage}% Margin
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400">Rp 0 (0%)</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMenuModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMenu}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  {isSubmittingMenu ? 'Menyimpan...' : 'Simpan & Terbitkan Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH KARYAWAN BARU */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Tambah Karyawan Baru (Registrasi SDM)</h3>
                  <p className="text-xs text-slate-500">Sistem otomatis membuat kode staf, akun login, dan QR token</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddEmployeeModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap Karyawan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Rizky Ramadhan"
                    value={empName}
                    onChange={(e) => setEmpName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Akun Login <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="rizky@coffeeshop.test"
                    value={empEmail}
                    onChange={(e) => setEmpEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jabatan / Posisi <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={empPosition}
                    onChange={(e) => setEmpPosition(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500 font-bold"
                  >
                    <option value="BARISTA">☕ Barista (Peracik Kopi)</option>
                    <option value="CASHIER">💵 Kasir Utama (Front Office)</option>
                    <option value="ADMIN_GUDANG">📦 Admin Gudang & Logistik</option>
                    <option value="MANAGER">👔 Store Manager (Manajer Kedai)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No. Handphone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="08123456789x"
                    value={empPhone}
                    onChange={(e) => setEmpPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password Awal Login
                  </label>
                  <input
                    type="text"
                    value={empPassword}
                    onChange={(e) => setEmpPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddEmployeeModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEmp}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                  {isSubmittingEmp ? 'Mendaftarkan...' : 'Simpan & Daftarkan Karyawan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL UBAH DATA KARYAWAN */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Ubah Data Karyawan</h3>
                  <p className="text-xs text-slate-500">Kode Staf: <span className="font-mono font-bold text-amber-800">{editingEmployee.employee_code}</span></p>
                </div>
              </div>
              <button
                onClick={() => setEditingEmployee(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateEmployee} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Karyawan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editEmpName}
                  onChange={(e) => setEditEmpName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Posisi / Jabatan Kerja <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editEmpPosition}
                    onChange={(e) => setEditEmpPosition(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500 font-bold"
                  >
                    <option value="BARISTA">☕ Barista (Peracik Kopi)</option>
                    <option value="CASHIER">💵 Kasir Utama (Front Office)</option>
                    <option value="ADMIN_GUDANG">📦 Admin Gudang & Logistik</option>
                    <option value="MANAGER">👔 Store Manager (Manajer Kedai)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Divisi / Bagian
                  </label>
                  <input
                    type="text"
                    value={editEmpDepartment}
                    onChange={(e) => setEditEmpDepartment(e.target.value)}
                    placeholder="Contoh: BAR, OPERATIONAL, LOGISTICS"
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Akun Login <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={editEmpEmail}
                    onChange={(e) => setEditEmpEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No. Handphone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="08123456789x"
                    value={editEmpPhone}
                    onChange={(e) => setEditEmpPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reset Password Login
                  </label>
                  <input
                    type="text"
                    placeholder="Kosongkan jika tidak diubah"
                    value={editEmpPassword}
                    onChange={(e) => setEditEmpPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Akun Staf
                  </label>
                  <select
                    value={editEmpStatus}
                    onChange={(e) => setEditEmpStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500 font-bold"
                  >
                    <option value="ACTIVE">🟢 Aktif Bekerja</option>
                    <option value="INACTIVE">🔴 Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingEmp}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Pencil className="w-3.5 h-3.5 text-amber-400" />
                  {isUpdatingEmp ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH BAHAN BAKU BARU */}
      {showAddMaterialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Tambah Bahan Baku Baru</h3>
                  <p className="text-xs text-slate-500">Kode SKU otomatis di-generate oleh sistem</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddMaterialModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMaterial} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Bahan Baku <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Susu Segar Diamond, Kopi Arabika Gayo, Sirup Hazelnut..."
                  value={matName}
                  onChange={(e) => setMatName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Satuan Ukur Bahan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={matUnit}
                  onChange={(e) => {
                    const u = e.target.value as any;
                    setMatUnit(u);
                    if (u === 'kg') {
                      setMatMinAlert(2);
                      setMatInitialStock(5);
                      setMatCostPerUnit(120000);
                    } else if (u === 'liter') {
                      setMatMinAlert(2);
                      setMatInitialStock(10);
                      setMatCostPerUnit(20000);
                    } else if (u === 'pcs') {
                      setMatMinAlert(100);
                      setMatInitialStock(500);
                      setMatCostPerUnit(1500);
                    } else {
                      setMatMinAlert(1000);
                      setMatInitialStock(2000);
                      setMatCostPerUnit(50);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500 font-bold"
                >
                  <option value="kg">Kilogram (kg) — Kopi, Bubuk Minuman, Biji, Bahan Padat</option>
                  <option value="liter">Liter (L) — Susu Segar, Sirup, Air Galon, Bahan Cair</option>
                  <option value="pcs">Pcs / Buah — Cup Plastik, Tutup, Sedotan, Kemasan</option>
                  <option value="gram">Gram (g) — Takaran Kecil / Bumbu Halus</option>
                  <option value="ml">Mililiter (ml) — Konsentrat / Esens Cair</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Batas Minimum Stok ({matUnit})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={matMinAlert}
                    onChange={(e) => setMatMinAlert(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs font-mono font-bold rounded-xl text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Stok Fisik Awal ({matUnit})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={matInitialStock}
                    onChange={(e) => setMatInitialStock(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs font-mono font-bold rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Harga Beli / Biaya Satuan (Rp/{matUnit})
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={matCostPerUnit}
                  onChange={(e) => setMatCostPerUnit(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs font-mono font-bold rounded-xl text-slate-900"
                />
              </div>

              {/* Conversion Preview Badge */}
              {matUnit === 'kg' && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                  💡 <strong>Konversi Takaran Kasir:</strong> {matInitialStock} kg = <strong>{((matInitialStock || 0) * 1000).toLocaleString('id-ID')} gram</strong> @ Rp {Math.round((matCostPerUnit || 0) / 1000).toLocaleString('id-ID')}/g (otomatis disesuaikan ke takaran resep mesin kasir).
                </div>
              )}
              {matUnit === 'liter' && (
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px] leading-relaxed">
                  💡 <strong>Konversi Takaran Kasir:</strong> {matInitialStock} Liter = <strong>{((matInitialStock || 0) * 1000).toLocaleString('id-ID')} ml</strong> @ Rp {Math.round((matCostPerUnit || 0) / 1000).toLocaleString('id-ID')}/ml (otomatis disesuaikan ke takaran resep minuman).
                </div>
              )}
              {matUnit === 'pcs' && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-[11px] leading-relaxed">
                  📦 <strong>Satuan Kemasan:</strong> Bahan dihitung per buah / item kemasan.
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMaterialModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMat}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {isSubmittingMat ? 'Mendaftarkan...' : 'Simpan Bahan Baku'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETAIL KARTU STOK SELESAI */}
    </div>
  );
};
