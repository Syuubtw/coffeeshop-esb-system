import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  QrCode, 
  Check, 
  RotateCcw,
  Sparkles,
  ShoppingBag,
  Clock,
  Printer,
  CheckCircle,
  Coffee,
  Banknote,
  Lock,
  Unlock,
  AlertCircle,
  X
} from 'lucide-react';
import api from '../services/api';
import { formatTableDisplayName } from '../utils/tableHelper';

interface ProductItem {
  id: number;
  name: string;
  sku: string;
  base_price: number;
  category: string;
  tag?: string;
  color?: string;
}

const CATEGORIES = ['Semua', 'Espresso', 'Signature', 'Manual Brew', 'Non-Coffee', 'Pastry'];

const PRODUCTS: ProductItem[] = [
  { id: 1, name: 'Espresso Single', sku: 'PRD-ESP-001', base_price: 18000, category: 'Espresso' },
  { id: 2, name: 'Espresso Double', sku: 'PRD-ESP-002', base_price: 25000, category: 'Espresso' },
  { id: 3, name: 'Americano (Iced/Hot)', sku: 'PRD-ESP-003', base_price: 22000, category: 'Espresso', tag: 'Populer' },
  { id: 4, name: 'Cappuccino Silk', sku: 'PRD-ESP-004', base_price: 28000, category: 'Espresso' },
  { id: 5, name: 'Café Latte Creamy', sku: 'PRD-ESP-005', base_price: 30000, category: 'Espresso', tag: 'Favorit' },
  { id: 6, name: 'Flat White', sku: 'PRD-ESP-006', base_price: 32000, category: 'Espresso' },
  { id: 7, name: 'Mocha Latte', sku: 'PRD-ESP-007', base_price: 35000, category: 'Espresso' },
  { id: 8, name: 'Caramel Macchiato', sku: 'PRD-ESP-008', base_price: 38000, category: 'Espresso' },
  { id: 9, name: 'V60 Toraja Arabica', sku: 'PRD-MAN-001', base_price: 35000, category: 'Manual Brew' },
  { id: 10, name: 'V60 Lampung Robusta', sku: 'PRD-MAN-002', base_price: 30000, category: 'Manual Brew' },
  { id: 11, name: 'French Press', sku: 'PRD-MAN-003', base_price: 32000, category: 'Manual Brew' },
  { id: 12, name: 'Matcha Uji Latte', sku: 'PRD-NON-001', base_price: 32000, category: 'Non-Coffee' },
  { id: 13, name: 'Belgian Chocolate', sku: 'PRD-NON-002', base_price: 28000, category: 'Non-Coffee' },
  { id: 14, name: 'Earl Grey Pure Tea', sku: 'PRD-NON-003', base_price: 22000, category: 'Non-Coffee' },
  { id: 15, name: 'Fresh Orange Juice', sku: 'PRD-NON-004', base_price: 25000, category: 'Non-Coffee' },
  { id: 16, name: 'Butter Croissant', sku: 'PRD-SNK-001', base_price: 25000, category: 'Pastry', tag: 'Fresh' },
  { id: 17, name: 'Toast Roti Bakar', sku: 'PRD-SNK-002', base_price: 20000, category: 'Pastry' },
  { id: 18, name: 'Kopi Susu Gula Aren', sku: 'PRD-SIG-001', base_price: 28000, category: 'Signature', tag: 'Best Seller 🔥' },
  { id: 19, name: 'Dirty Matcha Latte', sku: 'PRD-SIG-002', base_price: 38000, category: 'Signature', tag: 'Signature' },
  { id: 20, name: 'Vanilla Affogato', sku: 'PRD-SIG-003', base_price: 35000, category: 'Signature' },
];

export const CashierPos: React.FC = () => {
  // Navigation between direct POS register and Customer Table QR Incoming Queue
  const [activeTab, setActiveTab] = useState<'POS_REGISTER' | 'TABLE_ORDERS'>('POS_REGISTER');

  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [productList, setProductList] = useState<ProductItem[]>(PRODUCTS);
  const [cart, setCart] = useState<Array<{ product: ProductItem; qty: number; note?: string }>>([]);
  const [customerName, setCustomerName] = useState('');
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN');
  const [selectedTable, setSelectedTable] = useState('TB-01');

  // Table Orders Live Queue
  const [tableOrders, setTableOrders] = useState<any[]>([]);
  const [tableFilter, setTableFilter] = useState<'ACTIVE' | 'UNPAID' | 'PAID' | 'COMPLETED' | 'ALL'>('ACTIVE');

  // Payment Type (Hanya QRIS & Uang Tunai)
  const [paymentType, setPaymentType] = useState<'QRIS' | 'CASH'>('QRIS');

  const [isSuccessModal, setIsSuccessModal] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any | null>(null);
  const isFetchingRef = useRef(false);

  // Shift Management State
  const [shiftInfo, setShiftInfo] = useState<{
    is_open: boolean;
    shift: any;
    cash_sales: number;
    non_cash_sales: number;
    total_sales: number;
    orders_count: number;
    expected_cash: number;
  } | null>(null);
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [startingCashInput, setStartingCashInput] = useState<number>(500000);
  const [endingCashInput, setEndingCashInput] = useState<number>(0);
  const [isSubmittingShift, setIsSubmittingShift] = useState(false);

  const fetchCurrentShift = async () => {
    try {
      const res = await api.get('/pos/shift/current');
      if (res.data?.data) {
        setShiftInfo(res.data.data);
      }
    } catch {
      // offline / mock fallback
    }
  };

  useEffect(() => {
    fetchCurrentShift();
  }, []);

  const handleOpenShift = async () => {
    setIsSubmittingShift(true);
    try {
      await api.post('/pos/shift/open', { starting_cash: startingCashInput });
      setShowOpenShiftModal(false);
      await fetchCurrentShift();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal membuka shift kasir');
    } finally {
      setIsSubmittingShift(false);
    }
  };

  const handleCloseShift = async () => {
    setIsSubmittingShift(true);
    try {
      const res = await api.post('/pos/shift/close', { actual_ending_cash: endingCashInput });
      const diff = res.data?.data?.difference ?? 0;
      const diffMsg = diff === 0
        ? 'Kas fisik laci pas (Sesuai)!'
        : diff > 0
        ? `Kas fisik berlebih +${formatIDR(diff)}`
        : `Kas fisik selisih kurang -${formatIDR(Math.abs(diff))}`;
      alert(`Shift kasir berhasil ditutup! ${diffMsg}`);
      setShowCloseShiftModal(false);
      await fetchCurrentShift();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menutup shift kasir');
    } finally {
      setIsSubmittingShift(false);
    }
  };

  // Fetch products once on mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const resProducts = await api.get('/menu/products');
        if (resProducts.data?.data && resProducts.data.data.length > 0) {
          const mapped: ProductItem[] = resProducts.data.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            base_price: Number(p.base_price),
            category: p.category?.name || 'Espresso',
            tag: p.sku.includes('SIG')
              ? 'Best Seller 🔥'
              : p.sku.includes('SNK')
              ? 'Fresh'
              : p.name.includes('Americano')
              ? 'Populer'
              : p.name.includes('Latte')
              ? 'Favorit'
              : undefined,
          }));
          setProductList(mapped);
        }
      } catch {
        // Fallback intact
      }
    };
    loadProducts();
  }, []);

  // Fetch live orders with background tab throttle
  const fetchRecentOrders = async () => {
    if (document.hidden) return;
    if (isFetchingRef.current) return;

    try {
      isFetchingRef.current = true;
      const resOrders = await api.get('/pos/orders/recent');
      if (resOrders.data?.data?.data) {
        setTableOrders(resOrders.data.data.data);
      }
    } catch {
      // Keep state
    } finally {
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchRecentOrders();
    const interval = setInterval(fetchRecentOrders, 8000);
    return () => clearInterval(interval);
  }, []);

  const pendingTableCount = useMemo(() => {
    return tableOrders.filter((o) => o.order_source === 'QR_TABLE' && o.order_status !== 'COMPLETED').length;
  }, [tableOrders]);

  const unpaidTableCount = useMemo(() => {
    return tableOrders.filter((o) => o.order_source === 'QR_TABLE' && o.payment_status === 'UNPAID').length;
  }, [tableOrders]);

  const filteredProducts = useMemo(() => {
    return productList.filter((item) => {
      const matchCat =
        selectedCategory === 'Semua' ||
        item.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        selectedCategory.toLowerCase().includes(item.category.toLowerCase());
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [productList, selectedCategory, searchQuery]);

  const addToCart = (product: ProductItem) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.product.id === product.id);
      if (idx > -1) {
        return prev.map((item, i) =>
          i === idx ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const changeQty = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.qty + delta;
            return nextQty > 0 ? { ...item, qty: nextQty } : null;
          }
          return item;
        })
        .filter((item): item is { product: ProductItem; qty: number; note?: string } => item !== null)
    );
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((acc, curr) => acc + curr.product.base_price * curr.qty, 0);
  const tax = Math.round(subtotal * 0.1);
  const service = orderType === 'DINE_IN' ? Math.round(subtotal * 0.05) : 0;
  const grandTotal = subtotal + tax + service;

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const chosenPayment = paymentType === 'QRIS' ? 'QRIS' : 'CASH';

    const payload = {
      dining_table_id: orderType === 'DINE_IN'
        ? parseInt(selectedTable.replace('TB-0', ''), 10) || 1
        : null,
      order_type: orderType,
      customer_name: customerName || 'Pelanggan Kasir',
      payment_method: chosenPayment,
      discount_amount: 0,
      items: cart.map((i) => ({
        product_id: i.product.id,
        qty: i.qty,
        notes: '',
        modifiers: [],
      })),
    };

    try {
      const res = await api.post('/pos/orders', payload);
      setLastReceipt({
        ...res.data.data,
        bank_name: paymentType === 'CASH' ? 'Uang Tunai' : 'QRIS',
      });
      fetchRecentOrders();
      fetchCurrentShift();
    } catch {
      setLastReceipt({
        order_number: 'POS-' + Math.floor(100000 + Math.random() * 900000),
        customer_name: customerName || 'Pelanggan Kasir',
        grand_total: grandTotal,
        payment_method: chosenPayment,
        bank_name: paymentType === 'CASH' ? 'Uang Tunai' : 'QRIS',
        table_number: orderType === 'DINE_IN' ? selectedTable : 'Bungkus / Bawa Pulang',
        items: cart,
      });
    }

    setIsSuccessModal(true);
    setCart([]);
    setCustomerName('');
  };

  // Cashier confirms table payment (CASH / DEBIT at counter)
  const handleConfirmTablePayment = async (orderId: number) => {
    try {
      await api.patch(`/pos/orders/${orderId}/pay`, { payment_method: 'CASH' });
      fetchRecentOrders();
      fetchCurrentShift();
    } catch {
      // Local fallback
      setTableOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, payment_status: 'PAID', order_status: 'CONFIRMED' } : o))
      );
    }
  };

  // Cashier or barista updates order status
  const handleUpdateOrderStatus = async (orderId: number, nextStatus: string) => {
    try {
      await api.patch(`/pos/orders/${orderId}/status`, { order_status: nextStatus });
      fetchRecentOrders();
    } catch {
      setTableOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, order_status: nextStatus } : o))
      );
    }
  };

  const filteredTableOrders = useMemo(() => {
    return tableOrders.filter((o) => {
      if (tableFilter === 'ACTIVE') return o.order_status !== 'COMPLETED';
      if (tableFilter === 'UNPAID') return o.payment_status === 'UNPAID' && o.order_status !== 'COMPLETED';
      if (tableFilter === 'PAID') return o.payment_status === 'PAID' && o.order_status !== 'COMPLETED';
      if (tableFilter === 'COMPLETED') return o.order_status === 'COMPLETED';
      return true; // 'ALL'
    });
  }, [tableOrders, tableFilter]);

  const formatIDR = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="flex flex-col h-[calc(100vh-5.5rem)] gap-4 overflow-hidden">
      {/* Top Header Mode Switcher Bar */}
      <div className="bg-white border border-slate-200/80 px-5 py-2.5 rounded-2xl shadow-xs flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('POS_REGISTER')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'POS_REGISTER'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-amber-500" />
            Pesanan Langsung di Kasir
          </button>

          <button
            onClick={() => setActiveTab('TABLE_ORDERS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer relative ${
              activeTab === 'TABLE_ORDERS'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60'
            }`}
          >
            <QrCode className="w-4 h-4" />
            Pesanan Masuk dari Meja (QR)
            {pendingTableCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {pendingTableCount}
              </span>
            )}
          </button>
        </div>

        {/* Live Status indicator & Shift Controls */}
        <div className="flex items-center gap-3 text-xs">
          {/* Shift Status Button */}
          {shiftInfo?.is_open ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Shift Aktif • Modal: {formatIDR(shiftInfo.shift?.starting_cash || 0)}
              </span>
              <button
                onClick={() => {
                  setEndingCashInput(shiftInfo.expected_cash || shiftInfo.shift?.starting_cash || 0);
                  setShowCloseShiftModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold transition cursor-pointer"
                title="Tutup Shift Kasir Hari Ini & Rekonsiliasi Kas"
              >
                <Lock className="w-3.5 h-3.5 text-rose-600" />
                Tutup Shift
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 font-bold border border-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                Belum Buka Shift
              </span>
              <button
                onClick={() => setShowOpenShiftModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition cursor-pointer"
                title="Buka Shift Kasir Baru Hari Ini"
              >
                <Unlock className="w-3.5 h-3.5" />
                Buka Shift Kasir
              </button>
            </div>
          )}

          {unpaidTableCount > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
              <Clock className="w-3.5 h-3.5 text-amber-700 animate-spin" />
              {unpaidTableCount} Meja Menunggu Bayar
            </span>
          )}
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Terhubung Otomatis
          </span>
        </div>
      </div>

      {/* VIEW 1: POS REGISTER WALK-IN */}
      {activeTab === 'POS_REGISTER' && (
        <div className="flex-1 flex gap-5 overflow-hidden">
          {/* LEFT: Product Catalog */}
          <div className="flex-1 flex flex-col min-w-0 bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            {/* Search & Dine-In/Takeaway */}
            <div className="p-4 pb-3 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari menu kopi, minuman, makanan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2 text-xs rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-amber-500 transition"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOrderType('DINE_IN')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition ${
                    orderType === 'DINE_IN'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  🍽️ Minum di Tempat
                </button>
                <button
                  onClick={() => setOrderType('TAKEAWAY')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition ${
                    orderType === 'TAKEAWAY'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  🛍️ Bungkus / Bawa Pulang
                </button>
              </div>
            </div>

            {/* Category Pills */}
            <div className="px-4 py-2.5 flex gap-2 overflow-x-auto border-b border-slate-100 shrink-0">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Product Cards Grid */}
            <div className="p-4 flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 auto-rows-max">
              {filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => addToCart(prod)}
                  className="group bg-white hover:bg-amber-50/30 border border-slate-200/90 hover:border-amber-400 p-3.5 rounded-2xl flex flex-col justify-between transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-md active:scale-[0.98]"
                >
                  <div>
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {prod.category}
                      </span>
                      {prod.tag && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          {prod.tag}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-900 text-xs leading-snug group-hover:text-amber-700 transition">
                      {prod.name}
                    </h3>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs font-mono">
                      {formatIDR(prod.base_price)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(prod);
                      }}
                      className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center hover:bg-amber-500 transition active:scale-90"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Cashier Ticket */}
          <div className="w-96 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col shrink-0 overflow-hidden">
            <div className="p-4 pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-amber-600" />
                  <h2 className="font-bold text-slate-900 text-sm">Daftar Pesanan Struk</h2>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {orderType === 'DINE_IN' ? formatTableDisplayName(selectedTable) : 'Bungkus / Bawa Pulang'}
                </p>
              </div>

              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  title="Hapus Semua Pesanan"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Inputs */}
            <div className="p-3 border-b border-slate-100 bg-slate-50/60 grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Nama Pemesan..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="col-span-2 bg-white border border-slate-200 px-3 py-1.5 text-xs rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500"
              />

              {orderType === 'DINE_IN' ? (
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="bg-white border border-slate-200 px-2 py-1.5 text-xs rounded-xl font-semibold text-slate-700 focus:outline-none focus:border-amber-500"
                >
                  <option value="TB-01">Meja 01</option>
                  <option value="TB-02">Meja 02</option>
                  <option value="TB-03">Meja 03</option>
                  <option value="TB-04">Meja 04</option>
                  <option value="TB-05">Meja 05</option>
                </select>
              ) : (
                <div className="bg-slate-200/70 text-slate-500 text-[11px] font-semibold rounded-xl flex items-center justify-center">
                  Bungkus
                </div>
              )}
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center mb-2 text-slate-300">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-600">Belum Ada Menu yang Dipilih</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-[170px]">
                    Silakan pilih menu minuman atau makanan di sebelah kiri
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-slate-900 text-xs truncate">
                        {item.product.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                        {formatIDR(item.product.base_price)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                        <button
                          onClick={() => changeQty(item.product.id, -1)}
                          className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100 transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center text-xs font-bold text-slate-800 font-mono">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => changeQty(item.product.id, 1)}
                          className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100 transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => changeQty(item.product.id, -item.qty)}
                        className="text-slate-300 hover:text-rose-500 p-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Price & Checkout */}
            <div className="p-4 border-t border-slate-100 bg-white space-y-3">
              <div className="space-y-1 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Harga Menu</span>
                  <span className="font-mono text-slate-700 font-medium">{formatIDR(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pajak Restoran (10%)</span>
                  <span className="font-mono text-slate-700 font-medium">{formatIDR(tax)}</span>
                </div>
                {orderType === 'DINE_IN' && (
                  <div className="flex justify-between">
                    <span>Biaya Layanan Toko (5%)</span>
                    <span className="font-mono text-slate-700 font-medium">{formatIDR(service)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
                  <span className="font-bold text-slate-900 text-sm">Total Pembayaran</span>
                  <span className="font-mono text-base font-bold text-amber-600">{formatIDR(grandTotal)}</span>
                </div>
              </div>

              {/* Payment Select: Hanya QRIS & Uang Tunai */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPaymentType('QRIS')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    paymentType === 'QRIS'
                      ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-600" /> QRIS
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType('CASH')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    paymentType === 'CASH'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5 text-emerald-600" /> Uang Tunai
                </button>
              </div>

              <button
                disabled={cart.length === 0}
                onClick={handleCheckout}
                className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs shadow-md transition cursor-pointer active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" /> Selesaikan Pembayaran & Cetak Struk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: CUSTOMER QR TABLE ORDERS (ANTREAN PESANAN MEJA) */}
      {activeTab === 'TABLE_ORDERS' && (
        <div className="flex-1 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col overflow-hidden">
          {/* Filter Bar */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setTableFilter('ACTIVE')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  tableFilter === 'ACTIVE' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ⚡ Antrean Aktif ({tableOrders.filter((o) => o.order_status !== 'COMPLETED').length})
              </button>
              <button
                onClick={() => setTableFilter('UNPAID')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  tableFilter === 'UNPAID' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                ⏳ Menunggu Bayar ({tableOrders.filter((o) => o.payment_status === 'UNPAID' && o.order_status !== 'COMPLETED').length})
              </button>
              <button
                onClick={() => setTableFilter('PAID')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  tableFilter === 'PAID' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                ☕ Sedang Diproses ({tableOrders.filter((o) => o.payment_status === 'PAID' && o.order_status !== 'COMPLETED').length})
              </button>
              <button
                onClick={() => setTableFilter('COMPLETED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  tableFilter === 'COMPLETED' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                ✅ Riwayat Selesai ({tableOrders.filter((o) => o.order_status === 'COMPLETED').length})
              </button>
              <button
                onClick={() => setTableFilter('ALL')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  tableFilter === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                Semua ({tableOrders.length})
              </button>
            </div>

            <button
              onClick={fetchRecentOrders}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Refresh Antrean
            </button>
          </div>

          {/* Cards Grid */}
          <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-max">
            {filteredTableOrders.length === 0 ? (
              <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400">
                <Coffee className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-600">Belum Ada Pesanan Meja</p>
                <p className="text-xs text-slate-400 mt-0.5">Pesanan dari scan QR meja akan muncul di sini secara langsung.</p>
              </div>
            ) : (
              filteredTableOrders.map((ord) => {
                const pStatus = (ord.payment_status || '').toUpperCase();
                const isPaid = ['PAID', 'SETTLEMENT', 'SUCCESS', 'CAPTURE'].includes(pStatus);
                const isUnpaid = !isPaid;
                const isCompleted = ord.order_status === 'COMPLETED';
                const isQrTable = ord.order_source === 'QR_TABLE';

                return (
                  <div
                    key={ord.id}
                    className={`rounded-2xl border p-4.5 flex flex-col justify-between transition shadow-xs ${
                      isUnpaid
                        ? 'border-amber-300 bg-amber-50/40 hover:border-amber-400'
                        : isCompleted
                        ? 'border-slate-200 bg-slate-50/50 opacity-80'
                        : 'border-emerald-200 bg-white hover:border-emerald-400'
                    }`}
                  >
                    <div>
                      {/* Top Header of Card */}
                      <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs tracking-wide">
                              {ord.dining_table ? formatTableDisplayName(ord.dining_table.table_number) : 'Bungkus'}
                            </span>
                            {isQrTable && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                                📱 Pesanan Meja
                              </span>
                            )}
                          </div>
                          <div className="font-bold text-slate-900 text-sm mt-1.5">
                            {ord.customer_name || 'Pelanggan'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {ord.order_number} • {ord.created_at?.substring(11, 19) || 'Baru'}
                          </div>
                        </div>

                        {/* Status Badges */}
                        <div className="text-right space-y-1">
                          {isUnpaid ? (
                            <span className="inline-block px-2.5 py-1 rounded-full bg-amber-500 text-white text-[10px] font-bold shadow-2xs animate-pulse">
                              {ord.payment_method === 'QRIS' ? '⏳ Belum Bayar (QRIS)' : '⏳ Belum Bayar di Kasir'}
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-2xs">
                              ✅ Sudah Lunas ({ord.payment_method === 'QRIS' ? 'QRIS' : 'Tunai'})
                            </span>
                          )}
                          <div className="text-[10px] font-semibold text-slate-500">
                            Status: {ord.order_status === 'PENDING' ? 'Menunggu' : ord.order_status === 'CONFIRMED' ? 'Diterima' : ord.order_status === 'PREPARING' ? 'Sedang Dibuat' : ord.order_status === 'READY' ? 'Siap Disajikan' : 'Selesai'}
                          </div>
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="py-3 space-y-2 border-b border-slate-100">
                        {ord.items?.map((it: any, idx: number) => (
                          <div key={idx} className="text-xs flex justify-between items-start">
                            <div>
                              <span className="font-bold text-slate-800">{it.qty}x</span>{' '}
                              <span className="text-slate-700 font-medium">{it.product?.name || 'Menu Kopi'}</span>
                              {it.modifiers && it.modifiers.length > 0 && (
                                <div className="text-[10px] text-slate-500 pl-4">
                                  + {it.modifiers.map((m: any) => m.modifier_name).join(', ')}
                                </div>
                              )}
                              {it.notes && (
                                <div className="text-[10px] text-amber-700 italic pl-4">
                                  Catatan: "{it.notes}"
                                </div>
                              )}
                            </div>
                            <span className="font-mono text-slate-600 text-[11px]">
                              {formatIDR(Number(it.subtotal))}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Total Calculation */}
                      <div className="pt-2.5 flex justify-between items-baseline">
                        <span className="text-xs text-slate-500 font-medium">Total Pembayaran</span>
                        <span className="font-mono font-bold text-sm text-slate-900">
                          {formatIDR(Number(ord.grand_total))}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons for Cashier */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                      {isUnpaid && (
                        <button
                          onClick={() => handleConfirmTablePayment(ord.id)}
                          className="flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Banknote className="w-3.5 h-3.5" /> {ord.payment_method === 'QRIS' ? 'Konfirmasi Pembayaran QRIS' : 'Terima Pembayaran Tunai'}
                        </button>
                      )}

                      {isPaid && (ord.order_status === 'PENDING' || ord.order_status === 'CONFIRMED') && (
                        <>
                          <button
                            onClick={() => handleUpdateOrderStatus(ord.id, 'PREPARING')}
                            className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <Coffee className="w-3.5 h-3.5" /> Kirim ke Barista (Dibuat)
                          </button>
                          <button
                            onClick={() => handleUpdateOrderStatus(ord.id, 'COMPLETED')}
                            className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                            title="Selesaikan Langsung"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-400" /> Selesai
                          </button>
                        </>
                      )}

                      {ord.order_status === 'PREPARING' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'READY')}
                          className="flex-1 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" /> Siap Disajikan (Ready)
                        </button>
                      )}

                      {ord.order_status === 'READY' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'COMPLETED')}
                          className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Selesai (Meja Bersih)
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setLastReceipt(ord);
                          setIsSuccessModal(true);
                        }}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                        title="Lihat / Cetak Struk"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      {isSuccessModal && lastReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2.5">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Struk Transaksi Kasir</h3>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">{lastReceipt.order_number}</p>
            </div>

            <div className="border-t border-b border-dashed border-slate-200 py-3 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-500">
                <span>Pelanggan:</span>
                <span className="font-semibold text-slate-800">{lastReceipt.customer_name}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Penyajian / Meja:</span>
                <span className="font-semibold text-slate-800">
                  {lastReceipt.dining_table?.table_number ? formatTableDisplayName(lastReceipt.dining_table.table_number) : (formatTableDisplayName(lastReceipt.table_number) || 'Minum di Tempat')}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Metode Pembayaran:</span>
                <span className="font-semibold text-emerald-600">
                  {lastReceipt.payment_method === 'QRIS' ? 'QRIS' : 'Uang Tunai'}
                </span>
              </div>
              <div className="pt-2 border-t border-dashed border-slate-200 flex justify-between items-baseline font-bold text-slate-900">
                <span>Total:</span>
                <span className="font-mono text-base text-amber-600">
                  {formatIDR(Number(lastReceipt.grand_total))}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Cetak
              </button>
              <button
                onClick={() => setIsSuccessModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OPEN SHIFT MODAL */}
      {showOpenShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Unlock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Buka Shift Kasir (Awal Hari)</h3>
                  <p className="text-xs text-slate-500">Mulai operasional kasir baru hari ini</p>
                </div>
              </div>
              <button
                onClick={() => setShowOpenShiftModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Modal Kas Awal di Laci (Uang Pecahan/Kembalian)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={startingCashInput}
                    onChange={(e) => setStartingCashInput(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 text-sm font-semibold rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500 transition"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex gap-2">
                {[300000, 500000, 1000000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setStartingCashInput(preset)}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      startingCashInput === preset
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {formatIDR(preset)}
                  </button>
                ))}
              </div>

              <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200/60 text-xs text-amber-800 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  Aturan Buka Kasir Harian:
                </p>
                <p className="text-[11px] leading-relaxed">
                  Shift kasir berlaku untuk 1 hari kalender operasional. Jika pergantian hari terjadi, shift kasir kemarin otomatis ditutup dan kasir memulai shift baru hari ini.
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowOpenShiftModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmittingShift}
                onClick={handleOpenShift}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50"
              >
                {isSubmittingShift ? 'Membuka...' : 'Buka Shift Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLOSE SHIFT MODAL & DRAWER RECONCILIATION */}
      {showCloseShiftModal && shiftInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Tutup Shift & Rekonsiliasi Kas</h3>
                  <p className="text-xs text-slate-500">Hitung kas fisik laci sebelum tutup kasir hari ini</p>
                </div>
              </div>
              <button
                onClick={() => setShowCloseShiftModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Shift Summary Cards */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span className="text-slate-400 block text-[10px]">Modal Awal:</span>
                <span className="font-bold text-slate-800 font-mono text-sm">
                  {formatIDR(shiftInfo.shift?.starting_cash || 0)}
                </span>
              </div>
              <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100">
                <span className="text-emerald-700 block text-[10px]">Penjualan Tunai:</span>
                <span className="font-bold text-emerald-800 font-mono text-sm">
                  +{formatIDR(shiftInfo.cash_sales || 0)}
                </span>
              </div>
              <div className="bg-blue-50/60 p-3 rounded-2xl border border-blue-100">
                <span className="text-blue-700 block text-[10px]">Penjualan QRIS:</span>
                <span className="font-bold text-blue-800 font-mono text-sm">
                  {formatIDR(shiftInfo.non_cash_sales || 0)}
                </span>
              </div>
              <div className="bg-amber-50/80 p-3 rounded-2xl border border-amber-200/60">
                <span className="text-amber-800 block text-[10px] font-bold">Harus Ada di Laci:</span>
                <span className="font-bold text-amber-900 font-mono text-sm">
                  {formatIDR(shiftInfo.expected_cash || ((shiftInfo.shift?.starting_cash || 0) + (shiftInfo.cash_sales || 0)))}
                </span>
              </div>
            </div>

            {/* Input Ending Cash */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Hitung Fisik Uang Tunai di Laci Kasir Sekarang:
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={endingCashInput}
                  onChange={(e) => setEndingCashInput(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 text-sm font-semibold rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500 transition"
                />
              </div>
            </div>

            {/* Realtime Difference Pill */}
            {(() => {
              const expected = shiftInfo.expected_cash || ((shiftInfo.shift?.starting_cash || 0) + (shiftInfo.cash_sales || 0));
              const diff = endingCashInput - expected;
              if (diff === 0) {
                return (
                  <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Uang fisik pas sesuai dengan perhitungan sistem! (Selisih: Rp 0)</span>
                  </div>
                );
              } else if (diff > 0) {
                return (
                  <div className="p-3 rounded-2xl bg-blue-50 text-blue-800 border border-blue-200 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Uang fisik berlebih +{formatIDR(diff)} (Surplus)</span>
                  </div>
                );
              } else {
                return (
                  <div className="p-3 rounded-2xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Selisih uang kurang -{formatIDR(Math.abs(diff))} (Periksa kembali uang di laci)</span>
                  </div>
                );
              }
            })()}

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCloseShiftModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmittingShift}
                onClick={handleCloseShift}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50"
              >
                {isSubmittingShift ? 'Menutup...' : 'Tutup Shift Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
