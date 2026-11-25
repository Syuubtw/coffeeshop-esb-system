import React, { useEffect, useState, useRef } from 'react';
import { 
  Package, 
  CheckCircle, 
  XCircle, 
  Plus, 
  RefreshCcw, 
  Activity, 
  Search, 
  Download, 
  ClipboardCheck, 
  Boxes,
  Truck,
  ShoppingCart,
  Clock,
  Trash2,
  History,
  X
} from 'lucide-react';
import api from '../services/api';
import { exportStyledExcel } from '../utils/exportCsv';

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

interface Supplier {
  id: number;
  name: string;
  category: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  lead_time_days: number;
  is_active: boolean;
}

interface PurchaseOrderItem {
  id: number;
  purchase_order_id: number;
  raw_material_id: number;
  qty_ordered: number;
  unit_cost: number;
  subtotal: number;
  raw_material?: RawMaterialStock;
}

interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  supplier_name: string;
  requested_by: number;
  approved_by?: number;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'RECEIVED' | 'CANCELLED';
  total_amount: number;
  order_date: string;
  expected_delivery_date?: string;
  received_at?: string;
  notes?: string;
  supplier?: Supplier;
  requester?: { id: number; name: string };
  approver?: { id: number; name: string };
  items: PurchaseOrderItem[];
}

interface StockMovementLog {
  id: number;
  raw_material_id: number;
  type: string;
  qty: number;
  unit_cost: number;
  notes?: string;
  created_at: string;
  raw_material?: {
    id: number;
    name: string;
    sku: string;
    unit: string;
  };
}

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

const getMovementDetails = (mov: StockMovementLog) => {
  const type = mov.type;
  const isPositive = ['IN', 'IN_PURCHASE', 'IN_ADJUSTMENT'].includes(type) || (type === 'ADJUSTMENT' && mov.qty > 0);

  if (type === 'IN' || type === 'IN_PURCHASE') {
    return {
      label: '📥 INBOUND (Masuk PO)',
      category: 'IN',
      badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      sign: '+'
    };
  }
  if (type === 'IN_ADJUSTMENT') {
    return {
      label: '📈 INBOUND (Selisih Lebih Opname)',
      category: 'IN',
      badgeClass: 'bg-teal-50 text-teal-700 border border-teal-200',
      sign: '+'
    };
  }
  if (type === 'OUT_SALE' || type === 'OUT') {
    return {
      label: '☕ OUTBOUND (Resep Kasir)',
      category: 'OUT_SALE',
      badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200',
      sign: '-'
    };
  }
  if (type === 'OUT_WASTE') {
    return {
      label: '⚠️ OUTBOUND (Bahan Rusak / Basi)',
      category: 'WASTE_OPNAME',
      badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200',
      sign: '-'
    };
  }
  if (type === 'OUT_ADJUSTMENT') {
    return {
      label: '📉 OUTBOUND (Tumpah / Selisih Opname)',
      category: 'WASTE_OPNAME',
      badgeClass: 'bg-amber-50 text-amber-800 border border-amber-300',
      sign: '-'
    };
  }
  if (type === 'ADJUSTMENT') {
    return {
      label: isPositive ? '📈 PENYESUAIAN (+)' : '📉 PENYESUAIAN (-)',
      category: 'WASTE_OPNAME',
      badgeClass: isPositive ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-amber-50 text-amber-800 border border-amber-300',
      sign: isPositive ? '+' : '-'
    };
  }
  return {
    label: isPositive ? '📥 MASUK' : '📤 KELUAR',
    category: isPositive ? 'IN' : 'OUT_SALE',
    badgeClass: isPositive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200',
    sign: isPositive ? '+' : '-'
  };
};

export interface OpnameInputSpec {
  inputUnit: string;
  multiplier: number;
  systemVal: number;
  step: string;
}

const getOpnameInputSpec = (m: RawMaterialStock): OpnameInputSpec => {
  if (m.unit === 'gram') {
    const systemVal = Number((m.current_stock / 1000).toFixed(2));
    return {
      inputUnit: 'kg',
      multiplier: 1000,
      systemVal,
      step: 'any',
    };
  }
  if (m.unit === 'ml') {
    const systemVal = Number((m.current_stock / 1000).toFixed(2));
    return {
      inputUnit: 'Liter',
      multiplier: 1000,
      systemVal,
      step: 'any',
    };
  }
  return {
    inputUnit: m.unit,
    multiplier: 1,
    systemVal: m.current_stock,
    step: '1',
  };
};

export interface PackagingUnitInfo {
  purchaseUnit: string;        // e.g. "kg", "Liter", "Botol (750 ml)", "Slop (50 pcs)", "Karung (10 kg)", "Galon (19 L)"
  packDetail: string;          // e.g. "Pack (1 kg)", "Kotak (1 L)", "Botol (750 ml)", "Slop (50 pcs)"
  multiplier: number;          // multiplier to base recipe units (e.g. 1000 for kg->gram)
  pricePerPurchaseUnit: number;// Price in IDR per purchase unit (e.g. 30000 IDR per kg)
  baseUnit: string;            // "gram", "ml", "pcs"
  costPerBaseUnit: number;     // 30 IDR per gram
}

const getPackagingUnit = (m: RawMaterialStock): PackagingUnitInfo => {
  const name = (m.name || '').toLowerCase();
  const sku = (m.sku || '').toUpperCase();
  const unit = m.unit || 'unit';
  const rawCost = Number(m.avg_cost_per_unit) || 0;
  // If stored as thousand notation (e.g. 0.03 = 30 IDR), convert to IDR
  const costPerBaseUnit = rawCost > 0 && rawCost < 10 ? rawCost * 1000 : rawCost;

  if (name.includes('susu') || name.includes('milk') || sku.includes('DAIRY')) {
    const mult = 1000;
    return {
      purchaseUnit: 'Kotak (1 L)',
      packDetail: 'Kotak (1 Liter)',
      multiplier: mult,
      pricePerPurchaseUnit: mult * costPerBaseUnit,
      baseUnit: unit,
      costPerBaseUnit
    };
  }
  if (name.includes('galon') || name.includes('air') || sku.includes('WATER')) {
    const mult = 19000;
    return {
      purchaseUnit: 'Galon (19 L)',
      packDetail: 'Galon (19 Liter)',
      multiplier: mult,
      pricePerPurchaseUnit: mult * costPerBaseUnit,
      baseUnit: unit,
      costPerBaseUnit
    };
  }
  if (name.includes('sirup') || name.includes('syrup')) {
    const mult = 750;
    return {
      purchaseUnit: 'Botol (750 ml)',
      packDetail: 'Botol (750 ml)',
      multiplier: mult,
      pricePerPurchaseUnit: mult * costPerBaseUnit,
      baseUnit: unit,
      costPerBaseUnit
    };
  }
  if (name.includes('gula aren') || name.includes('sweet')) {
    const mult = 1000;
    return {
      purchaseUnit: 'Botol (1 L)',
      packDetail: 'Botol (1 Liter)',
      multiplier: mult,
      pricePerPurchaseUnit: mult * costPerBaseUnit,
      baseUnit: unit,
      costPerBaseUnit
    };
  }
  if (name.includes('kopi') || name.includes('coffee') || sku.includes('COFFEE')) {
    const mult = 1000;
    return {
      purchaseUnit: 'kg',
      packDetail: 'Bag (1 kg)',
      multiplier: mult,
      pricePerPurchaseUnit: mult * costPerBaseUnit,
      baseUnit: unit,
      costPerBaseUnit
    };
  }
  if (name.includes('matcha') || name.includes('tea')) {
    const mult = 500;
    return {
      purchaseUnit: 'Pouch (500 g)',
      packDetail: 'Pouch (500 g)',
      multiplier: mult,
      pricePerPurchaseUnit: mult * costPerBaseUnit,
      baseUnit: unit,
      costPerBaseUnit
    };
  }
  if (name.includes('cokelat') || name.includes('choco')) {
    const mult = 1000;
    return {
      purchaseUnit: 'kg',
      packDetail: 'Pack (1 kg)',
      multiplier: mult,
      pricePerPurchaseUnit: mult * costPerBaseUnit,
      baseUnit: unit,
      costPerBaseUnit
    };
  }
  if (name.includes('pastry') || name.includes('croissant') || sku.includes('PASTRY')) {
    const mult = 1000;
    return {
      purchaseUnit: 'kg',
      packDetail: 'Pack (1 kg)',
      multiplier: mult,
      pricePerPurchaseUnit: mult * costPerBaseUnit,
      baseUnit: unit,
      costPerBaseUnit
    };
  }
  if (name.includes('es batu') || name.includes('ice')) {
    const mult = 10000;
    return {
      purchaseUnit: 'Karung (10 kg)',
      packDetail: 'Karung (10 kg)',
      multiplier: mult,
      pricePerPurchaseUnit: mult * costPerBaseUnit,
      baseUnit: unit,
      costPerBaseUnit
    };
  }
  if (name.includes('cup') || sku.includes('CUP')) {
    const mult = 50;
    return {
      purchaseUnit: 'Slop (50 pcs)',
      packDetail: 'Slop (50 pcs)',
      multiplier: mult,
      pricePerPurchaseUnit: mult * costPerBaseUnit,
      baseUnit: unit,
      costPerBaseUnit
    };
  }

  if (unit === 'gram') {
    const mult = 1000;
    return {
      purchaseUnit: 'kg',
      packDetail: 'Pack (1 kg)',
      multiplier: mult,
      pricePerPurchaseUnit: mult * costPerBaseUnit,
      baseUnit: unit,
      costPerBaseUnit
    };
  }
  if (unit === 'ml') {
    const mult = 1000;
    return {
      purchaseUnit: 'Liter',
      packDetail: 'Botol (1 L)',
      multiplier: mult,
      pricePerPurchaseUnit: mult * costPerBaseUnit,
      baseUnit: unit,
      costPerBaseUnit
    };
  }

  return {
    purchaseUnit: 'Pack',
    packDetail: 'Pack Standar',
    multiplier: 1,
    pricePerPurchaseUnit: costPerBaseUnit,
    baseUnit: unit,
    costPerBaseUnit
  };
};

export const WarehouseDashboard: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'po' | 'inventory' | 'opname' | 'movements'>('po');
  const [materials, setMaterials] = useState<RawMaterialStock[]>([]);
  const [searchMaterial, setSearchMaterial] = useState('');
  const [movements, setMovements] = useState<StockMovementLog[]>([]);
  const [movementFilter, setMovementFilter] = useState<'ALL' | 'IN' | 'OUT_SALE' | 'WASTE_OPNAME'>('ALL');
  const [searchMovement, setSearchMovement] = useState('');
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [poStats, setPoStats] = useState({ total: 0, pending: 0, approved: 0, received: 0 });
  const [loading, setLoading] = useState(false);

  // Modal Create PO State
  const [showCreatePoModal, setShowCreatePoModal] = useState(false);
  const [manualVendorName, setManualVendorName] = useState('');
  const [poNotes, setPoNotes] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [poItems, setPoItems] = useState<Array<{ raw_material_id: number; qty_ordered: string; unit_cost: string }>>([]);
  const [isSubmittingPo, setIsSubmittingPo] = useState(false);

  // Stock Opname State
  const [physicalCounts, setPhysicalCounts] = useState<{ [materialId: number]: string }>({});
  const [opnameReasons, setOpnameReasons] = useState<{ [materialId: number]: string }>({});
  const [opnameHistory, setOpnameHistory] = useState<any[]>([]);
  const [isSubmittingOpname, setIsSubmittingOpname] = useState(false);

  // Add Material State (Konsisten kg, liter, pcs, gram, ml)
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [matName, setMatName] = useState('');
  const [matUnit, setMatUnit] = useState<'kg' | 'liter' | 'pcs' | 'gram' | 'ml'>('kg');
  const [matMinAlert, setMatMinAlert] = useState<number>(2);
  const [matInitialStock, setMatInitialStock] = useState<number>(5);
  const [matCostPerUnit, setMatCostPerUnit] = useState<number>(100000);
  const [isSubmittingMat, setIsSubmittingMat] = useState(false);

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
      fetchDashboardData('inventory');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menambahkan bahan baku');
    } finally {
      setIsSubmittingMat(false);
    }
  };

  const isFetchingRef = useRef(false);

  const fetchDashboardData = async (targetTab?: string) => {
    if (document.hidden && !targetTab) return;
    if (isFetchingRef.current) return;

    const currentTab = targetTab || activeSubTab;

    try {
      isFetchingRef.current = true;
      setLoading(true);

      // Always fetch materials
      const resMat = await api.get('/inventory/materials');
      if (resMat.data?.data) {
        setMaterials(resMat.data.data.map((m: any) => ({
          ...m,
          current_stock: Number(m.current_stock),
          min_stock_alert: Number(m.min_stock_alert),
          avg_cost_per_unit: Number(m.avg_cost_per_unit),
        })));
      }

      if (currentTab === 'po') {
        const resPo = await api.get('/procurement/orders');
        if (resPo.data?.data) {
          setPurchaseOrders(resPo.data.data.orders || []);
          if (resPo.data.data.stats) {
            setPoStats(resPo.data.data.stats);
          }
        }
      } else if (currentTab === 'opname') {
        const resOpn = await api.get('/audit/stock-opnames');
        if (resOpn.data?.data?.data) {
          setOpnameHistory(resOpn.data.data.data);
        }
      } else if (currentTab === 'movements') {
        const resMov = await api.get('/inventory/movements');
        if (resMov.data?.data?.data) {
          setMovements(resMov.data.data.data);
        }
      }
    } catch {
      // Keep state if offline
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(activeSubTab);
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 10000);
    return () => clearInterval(interval);
  }, [activeSubTab]);

  // Open modal pre-filled for a specific material in packaging units (kg, Liter, Pack, etc.)
  const handleQuickPoForMaterial = (mat: RawMaterialStock) => {
    setManualVendorName('');
    setPoNotes(`Pengadaan restock: ${mat.name} menipis/habis.`);
    setPoItems([
      {
        raw_material_id: mat.id,
        qty_ordered: '5', // Default pesan 5 kemasan (5 kg / 5 kotak / 5 pack)
        unit_cost: String(mat.avg_cost_per_unit || '0'),
      }
    ]);
    setShowCreatePoModal(true);
  };

  const handleAddPoItemRow = () => {
    if (materials.length === 0) return;
    setPoItems([
      ...poItems,
      { raw_material_id: materials[0].id, qty_ordered: '1', unit_cost: String(materials[0].avg_cost_per_unit || '0') }
    ]);
  };

  const handleRemovePoItemRow = (index: number) => {
    setPoItems(poItems.filter((_, idx) => idx !== index));
  };

  const handlePoItemChange = (index: number, field: 'raw_material_id' | 'qty_ordered' | 'unit_cost', val: string) => {
    setPoItems(poItems.map((item, idx) => {
      if (idx !== index) return item;
      if (field === 'raw_material_id') {
        const mat = materials.find(m => m.id === Number(val));
        return {
          ...item,
          raw_material_id: Number(val),
          unit_cost: String(mat?.avg_cost_per_unit || item.unit_cost),
        };
      }
      return { ...item, [field]: val };
    }));
  };

  const calculatedPoTotal = poItems.reduce((acc, it) => {
    const mat = materials.find(m => m.id === it.raw_material_id);
    const packInfo = mat ? getPackagingUnit(mat) : { pricePerPurchaseUnit: 0 };
    const q = Number(it.qty_ordered) || 0;
    return acc + (q * packInfo.pricePerPurchaseUnit);
  }, 0);

  const handleSubmitPo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expectedDeliveryDate) {
      alert('Estimasi Tanggal Kirim wajib diisi.');
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    if (expectedDeliveryDate < todayStr) {
      alert('Estimasi Tanggal Kirim tidak boleh memilih tanggal di masa lampau.');
      return;
    }
    if (poItems.length === 0) {
      alert('Pilih minimal 1 bahan baku untuk dipesan.');
      return;
    }
    const invalidQtyItem = poItems.find(it => !it.qty_ordered || Number(it.qty_ordered) <= 0);
    if (invalidQtyItem) {
      alert('Jumlah order pada setiap bahan baku harus lebih dari 0.');
      return;
    }

    try {
      setIsSubmittingPo(true);
      const res = await api.post('/procurement/orders', {
        supplier_id: null,
        supplier_name: manualVendorName.trim() || 'Pembelian Langsung / Vendor Bebas',
        vendor_name: manualVendorName.trim() || 'Pembelian Langsung / Vendor Bebas',
        expected_delivery_date: expectedDeliveryDate,
        notes: poNotes,
        items: poItems.map(it => {
          const mat = materials.find(m => m.id === it.raw_material_id);
          const packInfo = mat ? getPackagingUnit(mat) : { multiplier: 1, costPerBaseUnit: 0 };
          const packageQty = Number(it.qty_ordered) || 1;
          const totalQtyInBase = packageQty * packInfo.multiplier;
          const unitCostBase = packInfo.costPerBaseUnit;

          return {
            raw_material_id: it.raw_material_id,
            qty_ordered: totalQtyInBase,
            unit_cost: unitCostBase,
          };
        })
      });

      alert(res.data.message || 'Purchase Order berhasil dibuat dan diajukan ke Store Manager!');
      setShowCreatePoModal(false);
      setPoItems([]);
      setPoNotes('');
      setManualVendorName('');
      setExpectedDeliveryDate('');
      await fetchDashboardData('po');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal membuat Purchase Order.');
    } finally {
      setIsSubmittingPo(false);
    }
  };

  const handleReceiveGoods = async (po: PurchaseOrder) => {
    if (!window.confirm(`Konfirmasi penerimaan barang fisik untuk PO #${po.po_number}? Seluruh stok bahan baku di gudang akan otomatis bertambah.`)) {
      return;
    }

    try {
      setLoading(true);
      const res = await api.post(`/procurement/orders/${po.id}/receive`);
      alert(res.data.message || 'Barang berhasil diterima dan stok gudang telah diperbarui!');
      await fetchDashboardData('po');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal memproses penerimaan barang.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitStockOpname = async (e: React.FormEvent) => {
    e.preventDefault();
    const items = materials
      .filter((m) => physicalCounts[m.id] !== undefined && physicalCounts[m.id] !== '')
      .map((m) => {
        const spec = getOpnameInputSpec(m);
        const inputNum = Number(physicalCounts[m.id]);
        const physical_stock = Math.round(inputNum * spec.multiplier);
        return {
          raw_material_id: m.id,
          physical_stock,
          reason: opnameReasons[m.id] || 'Penyusutan Operasional / Tumpahan Wajar',
        };
      });

    if (items.length === 0) {
      alert('Masukkan minimal 1 hitungan fisik bahan baku untuk diajukan.');
      return;
    }

    setIsSubmittingOpname(true);
    try {
      await api.post('/audit/stock-opnames', {
        opname_date: new Date().toISOString().substring(0, 10),
        notes: 'Pemeriksaan Fisik Rak Gudang oleh Admin Gudang (Menunggu Approval Manager)',
        items,
      });

      alert('Hasil Pemeriksaan Fisik berhasil diajukan! Menunggu verifikasi & persetujuan dari Store Manager.');
      setPhysicalCounts({});
      setOpnameReasons({});
      await fetchDashboardData('opname');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menyimpan pemeriksaan fisik.');
    } finally {
      setIsSubmittingOpname(false);
    }
  };

  const handleExportStock = () => {
    const today = new Date().toISOString().slice(0, 10);
    const headers = [
      'ID', 'SKU', 'Nama Bahan Baku', 'Satuan', 'Sisa Stok Gudang', 'Batas Minimum', 'Status', 'HPP Rata-Rata (Rp)', 'Total Aset (Rp)'
    ];
    const rows = materials.map((m) => [
      m.id, m.sku, m.name, m.unit, m.current_stock, m.min_stock_alert,
      m.current_stock <= 0 ? 'HABIS' : m.current_stock <= m.min_stock_alert ? 'MENIPIS' : 'AMAN',
      m.avg_cost_per_unit, Math.round(m.current_stock * m.avg_cost_per_unit)
    ]);
    const totalAsset = materials.reduce((acc, curr) => acc + (curr.current_stock * curr.avg_cost_per_unit), 0);
    const lowStockCount = materials.filter(m => m.current_stock <= m.min_stock_alert).length;
  const safeStockCount = Math.max(0, materials.length - lowStockCount);

    exportStyledExcel({
      filename: `Laporan_Gudang_Logistik_${today}`,
      title: 'LAPORAN REKAP PERSEDIAAN GUDANG & BAHAN BAKU',
      subtitle: 'Monitoring inventaris bahan baku real-time, kemasan fisik, dan status pengadaan',
      author: 'Budi Santoso (Admin Gudang & Purchasing)',
      summaryItems: [
        { label: 'TOTAL BAHAN', value: `${materials.length} Item` },
        { label: 'STOK AMAN', value: `${safeStockCount} Item` },
        { label: 'PERLU RESTOCK', value: `${lowStockCount} Item` },
        { label: 'TOTAL ASET', value: `Rp ${Math.round(totalAsset).toLocaleString('id-ID')}` },
      ],
      headers,
      rows,
    });
  };

  const lowStockCount = materials.filter(m => m.current_stock <= m.min_stock_alert).length;
  const safeStockCount = Math.max(0, materials.length - lowStockCount);

  const formatIDR = (val: number | string) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(val));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 font-sans">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <Boxes className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Halaman Gudang & Pembelian Bahan</h1>
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Terhubung Otomatis
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pengadaan bahan baku dari pemasok, penerimaan barang masuk ke gudang, dan pengecekan stok fisik berkala.
          </p>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200/60 text-xs font-semibold">
            <button
              onClick={() => setActiveSubTab('po')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                activeSubTab === 'po' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5 text-indigo-600" /> Pesanan Pembelian Bahan (PO)
              {poStats.pending > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] flex items-center justify-center font-bold">
                  {poStats.pending}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveSubTab('inventory')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                activeSubTab === 'inventory' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-amber-600" /> Stok Rak Gudang
              {lowStockCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold">
                  {lowStockCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveSubTab('opname')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                activeSubTab === 'opname' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5 text-teal-600" /> Pengecekan Stok Fisik (Opname)
            </button>
            <button
              onClick={() => setActiveSubTab('movements')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                activeSubTab === 'movements' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-purple-600" /> Riwayat Keluar Masuk Bahan
            </button>
          </div>

          <button
            onClick={() => fetchDashboardData()}
            disabled={loading}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
            title="Perbarui Data"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* TAB 1: PURCHASE ORDERS (PENGADAAN) */}
      {activeSubTab === 'po' && (
        <div className="space-y-4">
          {/* PO KPI Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Purchase Orders</span>
                <ShoppingCart className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="text-xl font-bold font-mono text-slate-900 mt-1">{poStats.total} Order</p>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Semua riwayat pengadaan</span>
            </div>

            <div className="bg-amber-50/60 border border-amber-200/70 p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">Menunggu Approval</span>
                <Clock className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <p className="text-xl font-bold font-mono text-amber-800 mt-1">{poStats.pending} Order</p>
              <span className="text-[10px] text-amber-600 mt-0.5 block">Butuh tinjauan Store Manager</span>
            </div>

            <div className="bg-blue-50/50 border border-blue-200/60 p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">PO Siap Diterima</span>
                <Truck className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <p className="text-xl font-bold font-mono text-blue-800 mt-1">{poStats.approved} Order</p>
              <span className="text-[10px] text-blue-600 mt-0.5 block">Sudah disetujui, tunggu kurir</span>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-200/60 p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">PO Selesai (Received)</span>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <p className="text-xl font-bold font-mono text-emerald-800 mt-1">{poStats.received} Order</p>
              <span className="text-[10px] text-emerald-600 mt-0.5 block">Stok sudah masuk ke gudang</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Daftar Pengadaan Bahan Baku (Purchase Orders)</h2>
              <p className="text-xs text-slate-500">Ajukan pesanan ke supplier, pantau status persetujuan Store Manager, dan konfirmasi barang tiba.</p>
            </div>
            <button
              onClick={() => {
                if (poItems.length === 0) handleAddPoItemRow();
                setShowCreatePoModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> + Buat Purchase Order (PO)
            </button>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-4 py-3">No. PO</th>
                    <th className="px-4 py-3">Vendor / Supplier</th>
                    <th className="px-4 py-3">Rincian Bahan yang Dipesan</th>
                    <th className="px-4 py-3">Total Nilai</th>
                    <th className="px-4 py-3">Status Persetujuan</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchaseOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                        Belum ada data Purchase Order. Klik tombol <strong>+ Buat Purchase Order</strong> untuk memesan bahan menipis.
                      </td>
                    </tr>
                  ) : (
                    purchaseOrders.map((po) => {
                      const isPending = po.status === 'PENDING_APPROVAL';
                      const isApproved = po.status === 'APPROVED';
                      const isReceived = po.status === 'RECEIVED';
                      const isRejected = po.status === 'REJECTED';

                      return (
                        <tr key={po.id} className="hover:bg-slate-50/70 transition">
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">
                            {po.po_number}
                            <div className="text-[10px] text-slate-400 font-sans font-normal">
                              Tgl: {po.order_date}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-800">
                            {po.supplier_name || po.supplier?.name || 'Supplier Terdaftar'}
                            <div className="text-[10px] text-slate-500 font-normal">
                              Diajukan oleh: {po.requester?.name || 'Admin Gudang'}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              {po.items?.map((it, idx) => {
                                const mat = it.raw_material;
                                const qty = Number(it.qty_ordered);
                                const u = mat?.unit || '';
                                let qtyDisplay = `${qty.toLocaleString('id-ID')} ${u}`;
                                if (u === 'gram' && qty >= 1000) {
                                  qtyDisplay = `${(qty / 1000).toLocaleString('id-ID')} kg (${qty.toLocaleString('id-ID')} g)`;
                                } else if (u === 'ml' && qty >= 1000) {
                                  qtyDisplay = `${(qty / 1000).toLocaleString('id-ID')} Liter (${qty.toLocaleString('id-ID')} ml)`;
                                }
                                return (
                                  <div key={idx} className="text-[11px] text-slate-700">
                                    • <span className="font-semibold">{mat?.name || 'Bahan'}</span>: {qtyDisplay}
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">
                            {formatIDR(po.total_amount)}
                          </td>
                          <td className="px-4 py-3">
                            {isPending && (
                              <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200 flex items-center gap-1 w-fit">
                                <Clock className="w-3 h-3" /> Menunggu Review Manager
                              </span>
                            )}
                            {isApproved && (
                              <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200 flex items-center gap-1 w-fit">
                                <CheckCircle className="w-3 h-3" /> Disetujui (Tunggu Kiriman)
                              </span>
                            )}
                            {isReceived && (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200 flex items-center gap-1 w-fit">
                                <CheckCircle className="w-3 h-3" /> Barang Sudah Diterima
                              </span>
                            )}
                            {isRejected && (
                              <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200 flex items-center gap-1 w-fit">
                                <XCircle className="w-3 h-3" /> Ditolak Manager
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {isApproved ? (
                              <button
                                onClick={() => handleReceiveGoods(po)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-xs transition flex items-center gap-1 ml-auto cursor-pointer"
                              >
                                <Truck className="w-3.5 h-3.5" /> Konfirmasi Barang Tiba
                              </button>
                            ) : isReceived ? (
                              <span className="text-[11px] text-slate-400 font-medium">Selesai Masuk Rak</span>
                            ) : isPending ? (
                              <span className="text-[11px] text-amber-600 font-medium italic">Pending Approval</span>
                            ) : (
                              <span className="text-[11px] text-rose-500 font-medium">Batal</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STOK RAK GUDANG */}
      {activeSubTab === 'inventory' && (
        <div className="space-y-4">
          {/* Quick Inventory Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Total Bahan Terdaftar
              </span>
              <p className="text-xl font-bold font-mono text-slate-900 mt-1">
                {materials.length} Item
              </p>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Semua master bahan baku aktif
              </span>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-200/60 p-4 rounded-2xl">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
                Stok Aman (Cukup)
              </span>
              <p className="text-xl font-bold font-mono text-emerald-800 mt-1">
                {safeStockCount} Item
              </p>
              <span className="text-[10px] text-emerald-600 mt-0.5 block">
                Sisa stok di atas batas minimum
              </span>
            </div>

            <div className="bg-amber-50/60 border border-amber-200/70 p-4 rounded-2xl">
              <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
                Perlu Restock / Kritis
              </span>
              <p className="text-xl font-bold font-mono text-amber-800 mt-1">
                {lowStockCount} Item
              </p>
              <span className="text-[10px] text-amber-600 mt-0.5 block">
                Stok menipis atau habis &le; batas minimum
              </span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari bahan baku rak gudang..."
                value={searchMaterial}
                onChange={(e) => setSearchMaterial(e.target.value)}
                className="w-full bg-white border border-slate-200 pl-10 pr-4 py-2 text-xs rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddMaterialModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-2xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> + Tambah Bahan Baku Baru
              </button>
              <button
                onClick={handleExportStock}
                className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" /> Unduh Laporan Excel
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-4 py-3">Nama Bahan Baku</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Sisa Stok Sistem</th>
                    <th className="px-4 py-3">Kemasan Fisik Riil</th>
                    <th className="px-4 py-3">Batas Minimum</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Harga Beli / Satuan</th>
                    <th className="px-4 py-3 text-right">Tindakan Pengadaan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {materials
                    .filter((m) =>
                      m.name.toLowerCase().includes(searchMaterial.toLowerCase()) ||
                      m.sku.toLowerCase().includes(searchMaterial.toLowerCase())
                    )
                    .map((mat) => {
                      const isZero = mat.current_stock <= 0;
                      const isLow = mat.current_stock <= mat.min_stock_alert;
                      const pack = getPackagingUnit(mat);
                      const stockQty = formatHumanQuantity(mat.current_stock, mat);
                      const bufferQty = formatHumanQuantity(mat.min_stock_alert, mat);

                      return (
                        <tr key={mat.id} className="hover:bg-slate-50/70 transition">
                          <td className="px-4 py-3 font-bold text-slate-900">{mat.name}</td>
                          <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">{mat.sku}</td>
                          <td className="px-4 py-3 font-mono text-xs">
                            <span className="font-bold text-slate-900 block">
                              {stockQty.primary}
                            </span>
                            {stockQty.secondary && (
                              <span className="text-[10px] text-slate-400 block font-sans">
                                {stockQty.secondary}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px] border border-slate-200/60">
                              {getPackagingSpec(mat)}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">
                            <span className="font-bold text-slate-700 block">
                              {bufferQty.primary}
                            </span>
                            {bufferQty.secondary && (
                              <span className="text-[10px] text-slate-400 block font-sans">
                                {bufferQty.secondary}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isZero ? (
                              <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200">
                                🔴 Habis
                              </span>
                            ) : isLow ? (
                              <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200">
                                🟡 Menipis
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                                🟢 Aman
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-mono font-bold text-slate-900 text-xs block">
                              Rp {pack.pricePerPurchaseUnit.toLocaleString('id-ID')} / {pack.purchaseUnit}
                            </span>
                            {pack.multiplier > 1 && (
                              <span className="text-[10px] text-slate-400 font-mono block">
                                ≈ Rp {pack.costPerBaseUnit.toLocaleString('id-ID')}/{mat.unit}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleQuickPoForMaterial(mat)}
                              className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition shadow-2xs cursor-pointer inline-flex items-center gap-1 ${
                                isLow || isZero
                                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20 active:scale-95'
                                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 active:scale-95'
                              }`}
                              title={isLow || isZero ? 'Stok kritis! Ajukan PO pengadaan segera' : 'Ajukan PO pengadaan untuk bahan ini'}
                            >
                              <ShoppingCart className="w-3 h-3" />
                              {isLow || isZero ? 'Restock Kritis' : '+ Ajukan PO'}
                            </button>
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

      {/* TAB 4: INPUT HITUNG OPNAME */}
      {activeSubTab === 'opname' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-amber-900 text-xs">
            <div className="flex items-start gap-3">
              <ClipboardCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Pemeriksaan Fisik Berkala (Stock Opname) oleh Admin Gudang:</span>
                Hitung jumlah fisik barang di rak gudang, lalu masukkan angka riilnya di form ini. Pengajuan akan tercatat sebagai <strong>PENDING_APPROVAL</strong> dan saldo stok HANYA akan disesuaikan setelah diverifikasi & disetujui oleh Store Manager.
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmitStockOpname} className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="font-bold text-sm text-slate-900">Form Hitung Fisik Rak Gudang</h2>
                <p className="text-xs text-slate-500 mt-0.5">Input hitungan langsung dalam satuan <strong>kg</strong> & <strong>Liter</strong> (otomatis dikonversi ke resep sistem)</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const autofill: { [key: number]: string } = {};
                    materials.forEach((m) => {
                      const spec = getOpnameInputSpec(m);
                      autofill[m.id] = String(spec.systemVal);
                    });
                    setPhysicalCounts(autofill);
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                  title="Salin semua angka sistem (tinggal ubah bahan yang ada selisih)"
                >
                  ⚡ Isi Sesuai Sistem
                </button>
                {Object.keys(physicalCounts).length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPhysicalCounts({})}
                    className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Reset
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmittingOpname}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
                >
                  {isSubmittingOpname ? 'Mengajukan...' : 'Ajukan Hasil Opname ke Manager'}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Nama Bahan Baku</th>
                    <th className="px-4 py-3">Kemasan Fisik</th>
                    <th className="px-4 py-3">Stok di Sistem</th>
                    <th className="px-4 py-3">Hitungan Fisik Riil</th>
                    <th className="px-4 py-3">Selisih (Variance)</th>
                    <th className="px-4 py-3">Keterangan / Alasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {materials.map((mat) => {
                    const spec = getOpnameInputSpec(mat);
                    const physicalInput = physicalCounts[mat.id];
                    const numPhysicalInput = physicalInput !== undefined && physicalInput !== '' ? Number(physicalInput) : null;
                    const numPhysicalBase = numPhysicalInput !== null ? Math.round(numPhysicalInput * spec.multiplier) : null;
                    const diffBase = numPhysicalBase !== null ? numPhysicalBase - mat.current_stock : null;
                    const diffInput = numPhysicalInput !== null ? numPhysicalInput - spec.systemVal : null;
                    const packaging = getPackagingSpec(mat);
                    const stockQty = formatHumanQuantity(mat.current_stock, mat);

                    return (
                      <tr key={mat.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3 font-bold text-slate-900">{mat.name}</td>
                        <td className="px-4 py-3 text-slate-500 text-[11px]">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px] border border-slate-200/60">
                            {packaging}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          <span className="font-bold text-slate-900 block">{stockQty.primary}</span>
                          <span className="text-[10px] text-slate-400 block font-sans">
                            ({mat.current_stock.toLocaleString('id-ID')} {mat.unit})
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step={spec.step}
                              placeholder={`${spec.systemVal}`}
                              value={physicalCounts[mat.id] || ''}
                              onChange={(e) => setPhysicalCounts({ ...physicalCounts, [mat.id]: e.target.value })}
                              className="w-24 bg-slate-50 border border-slate-200 px-2.5 py-1.5 text-xs rounded-xl font-bold font-mono text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                            />
                            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-1 rounded-lg">
                              {spec.inputUnit}
                            </span>
                          </div>
                          {numPhysicalBase !== null && spec.multiplier > 1 && (
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                              = {numPhysicalBase.toLocaleString('id-ID')} {mat.unit}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {diffInput !== null && diffBase !== null ? (
                            <div>
                              <span
                                className={`font-bold font-mono px-2 py-0.5 rounded-md text-[11px] inline-block ${
                                  diffBase === 0
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : diffBase < 0
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}
                              >
                                {diffBase === 0
                                  ? '0 (Sesuai ✅)'
                                  : diffBase < 0
                                  ? `${diffInput.toFixed(1).replace('.0', '')} ${spec.inputUnit}`
                                  : `+${diffInput.toFixed(1).replace('.0', '')} ${spec.inputUnit}`}
                              </span>
                              {diffBase !== 0 && (
                                <span className={`text-[10px] font-semibold block mt-0.5 ${diffBase < 0 ? 'text-rose-600' : 'text-blue-600'}`}>
                                  {diffBase < 0 ? '🔴 Kurang' : '🔵 Lebih'} ({diffBase > 0 ? '+' : ''}{diffBase.toLocaleString('id-ID')} {mat.unit})
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono text-[11px] italic">Belum diisi</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            placeholder="Alasan selisih (cth: tumpah wajar, rusak, selisih racik)..."
                            value={opnameReasons[mat.id] || ''}
                            onChange={(e) => setOpnameReasons({ ...opnameReasons, [mat.id]: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs rounded-xl text-slate-700 focus:outline-none focus:bg-white focus:border-indigo-500"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </form>

          {/* Opname History */}
          {opnameHistory.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">Riwayat Pengajuan Opname Terdahulu</h3>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {opnameHistory.slice(0, 5).map((opn: any) => (
                  <div key={opn.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50">
                    <div>
                      <div className="font-bold text-slate-900">{opn.opname_number} — {opn.opname_date}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{opn.notes} • Diaudit oleh: {opn.auditor?.name || 'Admin Gudang'}</div>
                    </div>
                    <div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        opn.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {opn.status === 'APPROVED' ? '✅ Disetujui Store Manager' : '⏳ Menunggu Approval Manager'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: RIWAYAT MUTASI */}
      {activeSubTab === 'movements' && (() => {
        const inCount = movements.filter(m => getMovementDetails(m).category === 'IN').length;
        const saleCount = movements.filter(m => getMovementDetails(m).category === 'OUT_SALE').length;
        const wasteOpnameCount = movements.filter(m => getMovementDetails(m).category === 'WASTE_OPNAME').length;

        const filteredMovements = movements.filter((mov) => {
          const meta = getMovementDetails(mov);
          if (movementFilter === 'IN' && meta.category !== 'IN') return false;
          if (movementFilter === 'OUT_SALE' && meta.category !== 'OUT_SALE') return false;
          if (movementFilter === 'WASTE_OPNAME' && meta.category !== 'WASTE_OPNAME') return false;

          if (searchMovement.trim()) {
            const q = searchMovement.toLowerCase();
            const matName = (mov.raw_material?.name || '').toLowerCase();
            const notes = (mov.notes || '').toLowerCase();
            return matName.includes(q) || notes.includes(q);
          }
          return true;
        });

        return (
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-600" />
                  <h2 className="font-bold text-sm text-slate-900">Buku Mutasi Barang Gudang (Inbound & Outbound Ledger)</h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Mencatat riwayat kronologis otomatis aliran barang masuk (pembelian PO) dan keluar (resep menu kasir, tumpahan, dan selisih opname fisik).
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari bahan / no. opname..."
                  value={searchMovement}
                  onChange={(e) => setSearchMovement(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="px-4 py-2.5 bg-slate-100/60 border-b border-slate-200/80 flex items-center gap-2 overflow-x-auto text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Filter:</span>
              <button
                onClick={() => setMovementFilter('ALL')}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer shrink-0 ${
                  movementFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua Mutasi ({movements.length})
              </button>
              <button
                onClick={() => setMovementFilter('IN')}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer shrink-0 flex items-center gap-1 ${
                  movementFilter === 'IN'
                    ? 'bg-white text-emerald-700 shadow-2xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                📥 Masuk PO ({inCount})
              </button>
              <button
                onClick={() => setMovementFilter('OUT_SALE')}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer shrink-0 flex items-center gap-1 ${
                  movementFilter === 'OUT_SALE'
                    ? 'bg-white text-blue-700 shadow-2xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-blue-700'
                }`}
              >
                ☕ Resep Kasir ({saleCount})
              </button>
              <button
                onClick={() => setMovementFilter('WASTE_OPNAME')}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer shrink-0 flex items-center gap-1 ${
                  movementFilter === 'WASTE_OPNAME'
                    ? 'bg-white text-amber-800 shadow-2xs border border-amber-300'
                    : 'text-slate-600 hover:text-amber-800'
                }`}
              >
                ⚠️ Tumpah / Rusak / Opname ({wasteOpnameCount})
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Waktu</th>
                    <th className="px-4 py-3">Bahan Baku</th>
                    <th className="px-4 py-3">Tipe Mutasi</th>
                    <th className="px-4 py-3">Kuantitas</th>
                    <th className="px-4 py-3">Biaya/Unit</th>
                    <th className="px-4 py-3">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        Tidak ada riwayat mutasi bahan yang sesuai filter.
                      </td>
                    </tr>
                  ) : (
                    filteredMovements.map((mov) => {
                      const humanQty = mov.raw_material ? formatHumanQuantity(Math.abs(mov.qty), mov.raw_material) : null;
                      const meta = getMovementDetails(mov);
                      return (
                        <tr key={mov.id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3 text-slate-500 text-[11px] whitespace-nowrap font-mono">
                            {new Date(mov.created_at).toLocaleString('id-ID')}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-900">{mov.raw_material?.name || '-'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${meta.badgeClass}`}>
                              {meta.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">
                            {humanQty ? (
                              <>
                                <span className={`font-bold block ${meta.sign === '+' ? 'text-emerald-700' : 'text-slate-900'}`}>
                                  {meta.sign}{humanQty.primary}
                                </span>
                                <span className="text-[10px] text-slate-400 block font-sans">
                                  ({meta.sign}{Math.abs(mov.qty).toLocaleString('id-ID')} {mov.raw_material?.unit})
                                </span>
                              </>
                            ) : (
                              <span className="font-bold text-slate-900">{meta.sign}{Math.abs(mov.qty)}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-600">{formatIDR(mov.unit_cost)}</td>
                          <td className="px-4 py-3 text-slate-600 text-[11px] font-medium">{mov.notes || '-'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* MODAL: BUAT PURCHASE ORDER (PO) */}
      {showCreatePoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900">Buat Purchase Order (PO) Pengadaan Bahan</h3>
              </div>
              <button
                onClick={() => setShowCreatePoModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPo} className="space-y-4 pt-3 text-xs overflow-y-auto flex-1 pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Vendor / Supplier (Tulis Manual):
                  </label>
                  <input
                    type="text"
                    value={manualVendorName}
                    onChange={(e) => setManualVendorName(e.target.value)}
                    placeholder="Tulis nama vendor / pemasok manual..."
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">Dapat ditulis bebas nama toko / supplier</span>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Estimasi Tanggal Kirim: <span className="text-rose-500 font-black">* (Wajib Diisi)</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={expectedDeliveryDate}
                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                    className={`w-full bg-slate-50 border px-3 py-2 rounded-xl text-slate-900 font-semibold focus:outline-none focus:bg-white transition ${
                      !expectedDeliveryDate ? 'border-amber-400 bg-amber-50/30' : 'border-slate-200 focus:border-indigo-500'
                    }`}
                  />
                  <span className="text-[10px] text-rose-500 font-semibold block mt-0.5">
                    * Wajib diisi agar tombol ajukan PO aktif
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Catatan Pengadaan / Alasan:</label>
                <input
                  type="text"
                  placeholder="Contoh: Restock bahan menipis menjelang lonjakan akhir pekan"
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              {/* Items List */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center mb-1">
                  <div>
                    <span className="font-bold text-slate-800 text-xs">Daftar Bahan Baku yang Dipesan:</span>
                    <p className="text-[10px] text-slate-400">Pilih bahan, tentukan kuantitas, dan periksa harga beli per satuan.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPoItemRow}
                    className="text-indigo-600 hover:text-indigo-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer bg-indigo-50 px-2 py-1 rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Bahan Lain
                  </button>
                </div>

                {/* Column Headers */}
                <div className="grid grid-cols-12 gap-2 px-3 py-1.5 bg-slate-100/80 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <div className="col-span-5">Nama Bahan Baku</div>
                  <div className="col-span-3">Jumlah Order</div>
                  <div className="col-span-3 text-right">Estimasi Subtotal</div>
                  <div className="col-span-1 text-center">Hapus</div>
                </div>

                <div className="space-y-2">
                  {poItems.map((item, idx) => {
                    const currentMat = materials.find(m => m.id === item.raw_material_id);
                    const packInfo = currentMat ? getPackagingUnit(currentMat) : {
                      purchaseUnit: 'Pack',
                      packDetail: 'Pack Standar',
                      multiplier: 1,
                      pricePerPurchaseUnit: 0,
                      baseUnit: 'unit',
                      costPerBaseUnit: 0
                    };
                    const qty = Number(item.qty_ordered) || 0;
                    const subtotalInRupiah = qty * packInfo.pricePerPurchaseUnit;

                    return (
                      <div key={idx} className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-5">
                            <select
                              value={item.raw_material_id}
                              onChange={(e) => handlePoItemChange(idx, 'raw_material_id', e.target.value)}
                              className="w-full bg-white border border-slate-200 px-2.5 py-2 rounded-xl text-slate-900 font-semibold text-xs focus:outline-none focus:border-indigo-500 truncate"
                            >
                              {materials.map((m) => {
                                const p = getPackagingUnit(m);
                                const cleanName = m.name.replace(/\s*\([^)]*\)$/, '');
                                return (
                                  <option key={m.id} value={m.id}>
                                    {cleanName} ({p.purchaseUnit})
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          <div className="col-span-3 relative">
                            <input
                              type="number"
                              min="1"
                              step="any"
                              placeholder="1"
                              value={item.qty_ordered}
                              onChange={(e) => handlePoItemChange(idx, 'qty_ordered', e.target.value)}
                              className="w-full bg-white border border-slate-200 pl-3 pr-14 py-2 rounded-xl text-slate-900 font-bold text-xs focus:outline-none focus:border-indigo-500"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-indigo-700 bg-indigo-50 font-bold px-1.5 py-0.5 rounded border border-indigo-100">
                              {packInfo.purchaseUnit}
                            </span>
                          </div>

                          <div className="col-span-3 text-right pr-2">
                            <span className="font-mono font-bold text-indigo-700 text-xs block">
                              Rp {subtotalInRupiah.toLocaleString('id-ID')}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              @ Rp {packInfo.pricePerPurchaseUnit.toLocaleString('id-ID')} / {packInfo.purchaseUnit}
                            </span>
                          </div>

                          <div className="col-span-1 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemovePoItemRow(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                              title="Hapus baris"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Info Kemasan Nyata & Konversi Resep Dapur */}
                        <div className="px-2.5 py-1.5 bg-white border border-slate-100 rounded-xl text-[11px] text-slate-600 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-emerald-700 font-bold">📦 Satuan Beli:</span>
                            <span className="font-semibold text-slate-800">{qty} {packInfo.purchaseUnit}</span>
                            {packInfo.multiplier > 1 && (
                              <span className="text-slate-500">
                                (Otomatis masuk resep: <strong>{(qty * packInfo.multiplier).toLocaleString('id-ID')} {currentMat?.unit}</strong>)
                              </span>
                            )}
                          </div>
                          <span className="text-slate-400 text-[10px]">
                            HPP Resep: Rp {packInfo.costPerBaseUnit.toLocaleString('id-ID')}/{currentMat?.unit}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total Summary */}
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex justify-between items-center">
                <span className="font-bold text-indigo-900">Total Estimasi Pembelian PO:</span>
                <span className="font-black text-indigo-900 text-sm font-mono">
                  {formatIDR(calculatedPoTotal)}
                </span>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreatePoModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPo || !expectedDeliveryDate}
                  className={`flex-1 py-2.5 font-bold rounded-xl transition ${
                    !expectedDeliveryDate
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 cursor-pointer'
                  }`}
                  title={!expectedDeliveryDate ? 'Estimasi tanggal kirim wajib diisi untuk mengajukan PO' : ''}
                >
                  {isSubmittingPo ? 'Mengajukan...' : 'Ajukan PO ke Store Manager'}
                </button>
              </div>
              {!expectedDeliveryDate && (
                <p className="text-[10px] text-rose-500 font-bold text-center">
                  * Estimasi Tanggal Kirim wajib diisi agar pengajuan PO dapat diproses.
                </p>
              )}
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
                  placeholder="Contoh: Sirup Pandan Wangi, Susu Almond, dll."
                  value={matName}
                  onChange={(e) => setMatName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 font-semibold"
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
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 font-bold"
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
    </div>
  );
};

export default WarehouseDashboard;
