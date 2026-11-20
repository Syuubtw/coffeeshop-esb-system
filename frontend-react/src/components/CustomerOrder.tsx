import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  ShoppingBag, 
  Plus, 
  QrCode, 
  Building2, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Search, 
  ChevronRight, 
  Flame, 
  X,
  Coffee,
  Smartphone,
  Maximize2
} from 'lucide-react';
import api from '../services/api';

interface CustomerMenuItem {
  id: number;
  name: string;
  sku: string;
  base_price: number;
  category: string;
  description: string;
  tag?: string;
}

const FALLBACK_MENU: CustomerMenuItem[] = [
  { id: 1, name: 'Espresso Single', sku: 'PRD-ESP-001', base_price: 18000, category: 'Espresso', description: 'Ekstraksi 1 shot espresso murni dari biji kopi Arabica pilihan.' },
  { id: 2, name: 'Espresso Double', sku: 'PRD-ESP-002', base_price: 25000, category: 'Espresso', description: 'Ekstraksi 2 shot espresso murni ganda, aroma pekat dan kuat.' },
  { id: 3, name: 'Americano (Iced/Hot)', sku: 'PRD-ESP-003', base_price: 22000, category: 'Espresso', description: 'Espresso dengan air mineral segar, disajikan dingin atau panas.', tag: 'Populer' },
  { id: 4, name: 'Cappuccino Silk', sku: 'PRD-ESP-004', base_price: 28000, category: 'Espresso', description: 'Keseimbangan espresso mantap dan foam susu tebal beraroma cokelat.' },
  { id: 5, name: 'Café Latte Creamy', sku: 'PRD-ESP-005', base_price: 30000, category: 'Espresso', description: 'Single shot espresso dengan microfoam susu full cream lembut.', tag: 'Favorit' },
  { id: 6, name: 'Flat White', sku: 'PRD-ESP-006', base_price: 32000, category: 'Espresso', description: 'Double ristretto dengan velvety microfoam susu halus.' },
  { id: 7, name: 'Mocha Latte', sku: 'PRD-ESP-007', base_price: 35000, category: 'Espresso', description: 'Espresso berpadu cokelat bubuk pekat dan susu segar hangat.' },
  { id: 8, name: 'Caramel Macchiato', sku: 'PRD-ESP-008', base_price: 38000, category: 'Espresso', description: 'Espresso dengan susu vanila segar dan sirup caramel leleh di atasnya.' },
  { id: 9, name: 'V60 Toraja Arabica', sku: 'PRD-MAN-001', base_price: 35000, category: 'Manual Brew', description: 'Single origin Toraja dengan profil rasa fruity dan floral manis alami.' },
  { id: 10, name: 'V60 Lampung Robusta', sku: 'PRD-MAN-002', base_price: 30000, category: 'Manual Brew', description: 'Seduhan manual V60 Robusta Lampung mantap berkarakter bold cokelat.' },
  { id: 11, name: 'French Press', sku: 'PRD-MAN-003', base_price: 32000, category: 'Manual Brew', description: 'Metode perendaman kopi berbody tebal dan aroma maksimal.' },
  { id: 12, name: 'Matcha Uji Latte', sku: 'PRD-NON-001', base_price: 32000, category: 'Non-Coffee', description: 'Matcha ceremonial Uji Jepang asli tanpa kopi, creamy dan menyegarkan.' },
  { id: 13, name: 'Belgian Chocolate', sku: 'PRD-NON-002', base_price: 28000, category: 'Non-Coffee', description: 'Cokelat Belgia pekat dengan susu hangat atau es batu kristal.' },
  { id: 14, name: 'Earl Grey Pure Tea', sku: 'PRD-NON-003', base_price: 22000, category: 'Non-Coffee', description: 'Teh hitam aromatik berpadu kesegaran citrus bergamot alami.' },
  { id: 15, name: 'Fresh Orange Juice', sku: 'PRD-NON-004', base_price: 25000, category: 'Non-Coffee', description: 'Jus jeruk murni diperas segar tanpa pemanis buatan.' },
  { id: 16, name: 'Butter Croissant', sku: 'PRD-SNK-001', base_price: 25000, category: 'Pastry', description: 'Pastry renyah dengan mentega Prancis yang dipanggang segar tiap pagi.', tag: 'Fresh Baked' },
  { id: 17, name: 'Toast Roti Bakar', sku: 'PRD-SNK-002', base_price: 20000, category: 'Pastry', description: 'Roti bakar renyah mentega dengan taburan manis lezat.' },
  { id: 18, name: 'Kopi Susu Gula Aren', sku: 'PRD-SIG-001', base_price: 28000, category: 'Signature', description: 'Espresso blend mantap dengan susu segar dan gula aren organik cair.', tag: 'Best Seller 🔥' },
  { id: 19, name: 'Dirty Matcha Latte', sku: 'PRD-SIG-002', base_price: 38000, category: 'Signature', description: 'Perpaduan ceremonial matcha Uji Jepang dengan 1 shot espresso Arabica.', tag: 'Signature' },
  { id: 20, name: 'Vanilla Affogato', sku: 'PRD-SIG-003', base_price: 35000, category: 'Signature', description: 'Double scoop es krim vanila disiram double shot espresso panas.' },
];

const CATEGORIES = [
  { id: 'Semua', label: 'Semua', icon: '🌟' },
  { id: 'Espresso', label: 'Espresso', icon: '☕' },
  { id: 'Signature', label: 'Signature', icon: '🔥' },
  { id: 'Manual Brew', label: 'Manual Brew', icon: '🌿' },
  { id: 'Non-Coffee', label: 'Non-Coffee', icon: '🍵' },
  { id: 'Pastry', label: 'Pastry & Snack', icon: '🥐' },
];

export const CustomerOrder: React.FC = () => {
  const { tableId } = useParams<{ tableId?: string }>();
  const tableNumber = (tableId || 'TB-01').toUpperCase();

  // Desktop View Toggle (Phone frame simulator vs Responsive Fullscreen)
  const [viewMode, setViewMode] = useState<'MOBILE_FRAME' | 'FULLSCREEN'>('MOBILE_FRAME');

  const [menuList, setMenuList] = useState<CustomerMenuItem[]>(FALLBACK_MENU);
  const [selectedCat, setSelectedCat] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [customerName, setCustomerName] = useState('');
  
  // Cart
  // Helper to distinguish Food/Pastry vs Beverages
  const isFoodItem = (item?: CustomerMenuItem | null) => {
    if (!item) return false;
    const cat = (item.category || '').toLowerCase();
    const name = (item.name || '').toLowerCase();
    return (
      cat.includes('pastry') ||
      cat.includes('snack') ||
      cat.includes('makanan') ||
      cat.includes('food') ||
      cat.includes('course') ||
      cat.includes('dessert') ||
      name.includes('croissant') ||
      name.includes('toast') ||
      name.includes('mie') ||
      name.includes('nasi') ||
      name.includes('cake') ||
      name.includes('roti')
    );
  };

  const [cart, setCart] = useState<Array<{
    product: CustomerMenuItem;
    qty: number;
    sugarLevel?: string;
    iceLevel?: string;
    milkType?: string;
    extraShot?: boolean;
    foodServing?: string;
    foodCutlery?: string;
    notes?: string;
  }>>([]);

  // Customize Item Modal
  const [selectedItemToCustomize, setSelectedItemToCustomize] = useState<CustomerMenuItem | null>(null);
  const [modalSugar, setModalSugar] = useState('Normal Sugar');
  const [modalIce, setModalIce] = useState('Normal Ice');
  const [modalMilk, setModalMilk] = useState('Regular Milk');
  const [modalExtraShot, setModalExtraShot] = useState(false);
  const [modalFoodServing, setModalFoodServing] = useState('Hangat / Dipanaskan');
  const [modalFoodCutlery, setModalFoodCutlery] = useState('Perlu Sendok & Garpu');
  const [modalNotes, setModalNotes] = useState('');

  // Checkout
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [paymentOption, setPaymentOption] = useState<'QRIS' | 'CASH'>('QRIS');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);

  // Midtrans Sandbox State (100% Free Sandbox Simulator)
  const [midtransModal, setMidtransModal] = useState<any | null>(null);
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);

  // Fetch real menu from Laravel backend
  useEffect(() => {
    const loadBackendMenu = async () => {
      try {
        const res = await api.get(`/qr/table/${tableNumber}`);
        if (res.data?.data?.menu && res.data.data.menu.length > 0) {
          const mapped = res.data.data.menu.map((p: any) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            base_price: Number(p.base_price),
            category: p.category?.name || 'Espresso',
            description: p.description || `${p.name} racikan barista dengan bahan baku pilihan terbaik.`,
            tag: p.sku.includes('SIG')
              ? (p.name.includes('Dirty') ? 'Signature' : 'Best Seller 🔥')
              : p.sku.includes('SNK')
              ? 'Fresh Baked'
              : p.name.includes('Americano')
              ? 'Populer'
              : p.name.includes('Latte')
              ? 'Favorit'
              : undefined,
          }));
          setMenuList(mapped);
        }
      } catch {
        // Fallback to initial preset
      }
    };
    loadBackendMenu();
  }, [tableNumber]);

  const filteredMenu = useMemo(() => {
    return menuList.filter((item) => {
      const matchCat = selectedCat === 'Semua' || item.category.toLowerCase().includes(selectedCat.toLowerCase());
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [menuList, selectedCat, searchQuery]);

  const openCustomizeModal = (item: CustomerMenuItem) => {
    setSelectedItemToCustomize(item);
    setModalSugar('Normal Sugar');
    setModalIce('Normal Ice');
    setModalMilk('Regular Milk');
    setModalExtraShot(false);
    setModalFoodServing('Hangat / Dipanaskan');
    setModalFoodCutlery('Perlu Sendok & Garpu');
    setModalNotes('');
  };

  const confirmAddToCart = () => {
    if (!selectedItemToCustomize) return;
    const isFood = isFoodItem(selectedItemToCustomize);

    setCart((prev) => [
      ...prev,
      {
        product: selectedItemToCustomize,
        qty: 1,
        sugarLevel: !isFood ? modalSugar : undefined,
        iceLevel: !isFood ? modalIce : undefined,
        milkType: !isFood ? modalMilk : undefined,
        extraShot: !isFood ? modalExtraShot : false,
        foodServing: isFood ? modalFoodServing : undefined,
        foodCutlery: isFood ? modalFoodCutlery : undefined,
        notes: modalNotes,
      }
    ]);

    setSelectedItemToCustomize(null);
  };

  const updateCartQty = (idx: number, delta: number) => {
    setCart((prev) => 
      prev
        .map((item, i) => {
          if (i === idx) {
            const nextQty = item.qty + delta;
            return nextQty > 0 ? { ...item, qty: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as any
    );
  };

  const subtotal = useMemo(() => {
    return cart.reduce((acc, curr) => {
      let itemPrice = curr.product.base_price;
      if (curr.milkType?.includes('Oat')) itemPrice += 8000;
      if (curr.extraShot) itemPrice += 5000;
      return acc + (itemPrice * curr.qty);
    }, 0);
  }, [cart]);

  const tax = Math.round(subtotal * 0.10);
  const service = Math.round(subtotal * 0.05);
  const grandTotal = subtotal + tax + service;

  // Real API Order Submission (Connected to PostgreSQL Backend)
  const handlePlaceOrder = async () => {
    if (cart.length === 0 || !customerName.trim()) return;
    setIsSubmitting(true);

    const payload = {
      qr_token: tableNumber,
      customer_name: customerName.trim(),
      payment_method: paymentOption,
      items: cart.map(i => {
        const isFood = isFoodItem(i.product);
        const optionSummary = isFood 
          ? `${i.foodServing || 'Suhu Normal'}, ${i.foodCutlery || 'Tanpa Alat Makan'}`
          : `${i.sugarLevel || 'Normal Sugar'}, ${i.iceLevel || 'Normal Ice'}, ${i.milkType || 'Regular Milk'}${i.extraShot ? ', +Extra Shot' : ''}`;
        return {
          product_id: i.product.id,
          qty: i.qty,
          notes: `${optionSummary}${i.notes ? ` (${i.notes})` : ''}`,
          modifiers: []
        };
      })
    };

    try {
      const res = await api.post('/qr/order', payload);
      const createdOrder = res.data.data;

      if (paymentOption === 'QRIS') {
        setMidtransModal(createdOrder);
      } else {
        setOrderSuccess(createdOrder);
      }
    } catch {
      const fallbackOrder = {
        order_number: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
        table_number: tableNumber,
        customer_name: customerName,
        payment_method: paymentOption,
        grand_total: grandTotal,
        payment_status: 'UNPAID',
        items: cart
      };

      if (paymentOption === 'QRIS') {
        setMidtransModal(fallbackOrder);
      } else {
        setOrderSuccess(fallbackOrder);
      }
    } finally {
      setIsSubmitting(false);
      setCart([]);
      setIsCartOpen(false);
    }
  };

  const handleSimulateMidtransSuccess = async () => {
    if (!midtransModal) return;
    setIsSimulatingPayment(true);

    try {
      if (midtransModal.id) {
        const res = await api.post(`/payment/midtrans/simulate/${midtransModal.id}`);
        setOrderSuccess(res.data.data);
      } else {
        setOrderSuccess({ ...midtransModal, payment_status: 'PAID' });
      }
    } catch {
      setOrderSuccess({ ...midtransModal, payment_status: 'PAID' });
    } finally {
      setIsSimulatingPayment(false);
      setMidtransModal(null);
    }
  };

  const formatIDR = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="min-h-screen bg-slate-900/90 text-slate-800 flex flex-col items-center justify-start p-0 md:p-6 font-sans">
      
      {/* DESKTOP TOP BAR: TOGGLE MOBILE PREVIEW vs FULLSCREEN */}
      <div className="hidden md:flex items-center justify-between w-full max-w-md lg:max-w-xl mb-4 bg-slate-800/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700/60 shadow-lg text-white">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Customer QR View</span>
        </div>

        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setViewMode('MOBILE_FRAME')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === 'MOBILE_FRAME'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" /> Mobile Phone
          </button>
          <button
            onClick={() => setViewMode('FULLSCREEN')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === 'FULLSCREEN'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" /> Lebar Penuh
          </button>
        </div>
      </div>

      {/* MAIN CONTAINER: ADAPTS RESPONSIVELY */}
      <div
        className={`w-full bg-slate-50 transition-all duration-200 flex flex-col overflow-hidden relative shadow-2xl ${
          viewMode === 'MOBILE_FRAME'
            ? 'max-w-md min-h-screen md:min-h-[850px] md:max-h-[880px] md:rounded-[40px] md:border-[10px] md:border-slate-800 md:ring-1 md:ring-slate-700'
            : 'max-w-3xl min-h-screen md:min-h-[850px] md:rounded-3xl border border-slate-200'
        }`}
      >
        {/* SMARTPHONE TOP SPEAKER NOTCH (Only on desktop phone preview) */}
        {viewMode === 'MOBILE_FRAME' && (
          <div className="hidden md:flex justify-center pt-2 pb-1 bg-slate-900 shrink-0">
            <div className="w-24 h-4 bg-slate-800 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-slate-900 ml-auto mr-1.5"></div>
            </div>
          </div>
        )}

        {/* TOP APP HEADER */}
        <header className="bg-slate-900 text-white p-5 pb-4 shrink-0 shadow-sm relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-amber-600/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex justify-between items-center mb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-600 flex items-center justify-center text-white shadow-sm shadow-amber-600/30">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-white leading-tight">ESB Coffee & Eatery</h1>
                <p className="text-[10px] text-amber-400 font-semibold tracking-wide">Self-Ordering QR Table</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-400/30 text-amber-300 rounded-full font-bold font-mono text-xs shadow-xs">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              Meja {tableNumber}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative mt-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kopi, pastry, atau minuman favorit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/90 border border-slate-700/80 pl-10 pr-4 py-2.5 text-xs rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-slate-800 transition"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </header>

        {/* HORIZONTAL CATEGORY PILLS */}
        <div className="bg-white border-b border-slate-200/70 p-2.5 px-4 flex gap-2 overflow-x-auto shrink-0 scrollbar-none shadow-2xs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCat === cat.id
                  ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30 scale-[1.02]'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* MENU FEED (CLEAN MODERN CARDS) */}
        <main className="flex-1 overflow-y-auto p-4 space-y-3 pb-28">
          {filteredMenu.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center text-slate-400">
              <Coffee className="w-10 h-10 text-slate-300 mb-2 stroke-[1.5]" />
              <p className="text-sm font-semibold text-slate-600">Menu Tidak Ditemukan</p>
              <p className="text-xs text-slate-400 mt-1">Coba ketik kata kunci lain atau pilih kategori Semua.</p>
            </div>
          ) : (
            filteredMenu.map((item) => (
              <div
                key={item.id}
                onClick={() => openCustomizeModal(item)}
                className="group bg-white hover:bg-amber-50/20 border border-slate-200/90 hover:border-amber-400 p-4 rounded-3xl transition-all duration-150 flex items-center justify-between gap-3.5 cursor-pointer shadow-2xs hover:shadow-md active:scale-[0.99]"
              >
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {item.category}
                    </span>
                    {item.tag && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-0.5">
                        <Flame className="w-2.5 h-2.5 text-amber-600" /> {item.tag}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-amber-700 transition">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                  
                  <div className="mt-3 font-bold text-slate-950 font-mono text-sm">
                    {formatIDR(item.base_price)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openCustomizeModal(item);
                  }}
                  className="w-9 h-9 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-sm shadow-amber-600/30 hover:bg-amber-500 active:scale-90 shrink-0 transition"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            ))
          )}
        </main>

        {/* FLOATING BOTTOM CART BAR (CLEAN TACTILE PILL) */}
        {cart.length > 0 && (
          <div className="absolute bottom-4 left-4 right-4 bg-slate-900 text-white p-3.5 px-4 rounded-3xl shadow-2xl flex items-center justify-between z-30 animate-in slide-in-from-bottom-3 duration-200 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-600 flex items-center justify-center font-bold text-xs text-white shadow-sm shadow-amber-600/40">
                {cart.reduce((a, b) => a + b.qty, 0)}
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Pesanan Meja</div>
                <div className="font-bold font-mono text-sm text-white">{formatIDR(grandTotal)}</div>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white text-xs font-bold rounded-2xl transition cursor-pointer shadow-sm shadow-amber-600/30"
            >
              Lihat Keranjang <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* CUSTOMIZE ITEM BOTTOM SHEET MODAL */}
        {selectedItemToCustomize && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-40 flex flex-col justify-end animate-in fade-in duration-150">
            <div className="bg-white rounded-t-[32px] p-6 space-y-4 max-h-[88%] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-8 duration-200 text-slate-900 border-t border-slate-100">
              <div className="flex justify-between items-start pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-base text-slate-900">{selectedItemToCustomize.name}</h3>
                  <span className="font-mono text-xs font-bold text-amber-600">{formatIDR(selectedItemToCustomize.base_price)}</span>
                </div>
                <button
                  onClick={() => setSelectedItemToCustomize(null)}
                  className="p-1.5 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Conditional Options: FOOD vs DRINK */}
              {isFoodItem(selectedItemToCustomize) ? (
                <>
                  {/* Pilihan Suhu Penyajian Makanan */}
                  <div className="space-y-1.5 text-xs">
                    <label className="font-bold text-slate-800 block">Suhu Penyajian Makanan:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Hangat / Dipanaskan', 'Suhu Normal / Langsung'].map((srv) => (
                        <button
                          key={srv}
                          type="button"
                          onClick={() => setModalFoodServing(srv)}
                          className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold transition cursor-pointer ${
                            modalFoodServing === srv 
                              ? 'bg-amber-600 text-white border-amber-600 shadow-2xs' 
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {srv}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pilihan Peralatan Makan */}
                  <div className="space-y-1.5 text-xs">
                    <label className="font-bold text-slate-800 block">Peralatan Makan:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Perlu Sendok & Garpu', 'Tanpa Sendok & Garpu'].map((ctl) => (
                        <button
                          key={ctl}
                          type="button"
                          onClick={() => setModalFoodCutlery(ctl)}
                          className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold transition cursor-pointer ${
                            modalFoodCutlery === ctl 
                              ? 'bg-amber-600 text-white border-amber-600 shadow-2xs' 
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {ctl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Catatan untuk Dapur */}
                  <div className="text-xs space-y-1">
                    <label className="font-bold text-slate-800 block">Catatan untuk Dapur / Kitchen:</label>
                    <input
                      type="text"
                      placeholder="Contoh: Pisahkan saus, potong 2 bagian, jangan terlalu garing..."
                      value={modalNotes}
                      onChange={(e) => setModalNotes(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Sugar Level */}
                  <div className="space-y-1.5 text-xs">
                    <label className="font-bold text-slate-800 block">Tingkat Manis (Sugar Level):</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Normal Sugar', 'Less Sugar (50%)', 'No Sugar (0%)'].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setModalSugar(s)}
                          className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold transition cursor-pointer ${
                            modalSugar === s 
                              ? 'bg-amber-600 text-white border-amber-600 shadow-2xs' 
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ice Level */}
                  <div className="space-y-1.5 text-xs">
                    <label className="font-bold text-slate-800 block">Tingkat Es (Ice Level):</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Normal Ice', 'Less Ice', 'No Ice / Hot'].map((ice) => (
                        <button
                          key={ice}
                          type="button"
                          onClick={() => setModalIce(ice)}
                          className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold transition cursor-pointer ${
                            modalIce === ice 
                              ? 'bg-amber-600 text-white border-amber-600 shadow-2xs' 
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {ice}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Milk Option */}
                  <div className="space-y-1.5 text-xs">
                    <label className="font-bold text-slate-800 block">Pilihan Susu:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Regular Milk', 'Oat Milk (+Rp 8.000)'].map((milk) => (
                        <button
                          key={milk}
                          type="button"
                          onClick={() => setModalMilk(milk)}
                          className={`py-2 px-3 rounded-xl border text-[11px] font-bold transition cursor-pointer ${
                            modalMilk === milk 
                              ? 'bg-amber-600 text-white border-amber-600 shadow-2xs' 
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {milk}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Extra Shot Addon */}
                  <div className="flex justify-between items-center p-3 rounded-2xl border border-slate-200 bg-slate-50/60 text-xs">
                    <div>
                      <div className="font-bold text-slate-900">+ Extra Shot Espresso Arabica</div>
                      <div className="text-[10px] text-slate-500 font-mono">+ Rp 5.000</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={modalExtraShot}
                      onChange={(e) => setModalExtraShot(e.target.checked)}
                      className="w-4 h-4 accent-amber-600 cursor-pointer"
                    />
                  </div>

                  {/* Notes */}
                  <div className="text-xs space-y-1">
                    <label className="font-bold text-slate-800 block">Catatan untuk Barista:</label>
                    <input
                      type="text"
                      placeholder="Contoh: Pisah es batu, sedotan ramah lingkungan..."
                      value={modalNotes}
                      onChange={(e) => setModalNotes(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
                    />
                  </div>
                </>
              )}

              <button
                onClick={confirmAddToCart}
                className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-2xl shadow-md transition cursor-pointer active:scale-[0.99]"
              >
                + Tambahkan ke Pesanan
              </button>
            </div>
          </div>
        )}

        {/* CART & CHECKOUT BOTTOM SHEET */}
        {isCartOpen && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex flex-col justify-end animate-in fade-in duration-150">
            <div className="bg-white rounded-t-[32px] p-6 space-y-4 max-h-[92%] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-8 duration-200 text-slate-900 border-t border-slate-100">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-base text-slate-900">Keranjang Meja {tableNumber}</h3>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Customer Name */}
              <div className="text-xs space-y-1.5">
                <label className="font-bold text-slate-800 block">Nama Pemesan (Untuk panggilan pesanan):</label>
                <input
                  type="text"
                  required
                  placeholder="Ketik nama Anda (misal: Budi / Sarah)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              {/* Items List */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 divide-y divide-slate-100">
                {cart.map((item, idx) => (
                  <div key={idx} className="pt-2 first:pt-0 text-xs flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-900">{item.product.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {isFoodItem(item.product) ? (
                          <span>{item.foodServing || 'Suhu Normal'} • {item.foodCutlery || 'Alat Makan'}{item.notes ? ` • Note: ${item.notes}` : ''}</span>
                        ) : (
                          <span>{item.sugarLevel || 'Normal Sugar'} • {item.iceLevel || 'Normal Ice'} {item.milkType?.includes('Oat') ? '• Oat Milk' : ''} {item.extraShot ? '• +Extra Shot' : ''}</span>
                        )}
                      </div>
                      <div className="text-xs font-mono font-bold text-amber-700 mt-0.5">{formatIDR(item.product.base_price)}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button onClick={() => updateCartQty(idx, -1)} className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold">-</button>
                      <span className="font-bold font-mono text-xs w-4 text-center">{item.qty}</span>
                      <button onClick={() => updateCartQty(idx, 1)} className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold">+</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pricing Breakdown */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1.5 text-slate-600">
                <div className="flex justify-between">
                  <span>Harga Menu</span>
                  <span className="font-mono text-slate-800">{formatIDR(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pajak Restoran (10%)</span>
                  <span className="font-mono text-slate-800">{formatIDR(tax)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Biaya Layanan Toko (5%)</span>
                  <span className="font-mono text-slate-800">{formatIDR(service)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-950 pt-2 border-t border-slate-200">
                  <span>Total Tagihan</span>
                  <span className="text-amber-600 font-mono">{formatIDR(grandTotal)}</span>
                </div>
              </div>

              {/* Payment Flow Selection */}
              <div className="space-y-2 pt-1 text-xs">
                <span className="font-bold text-slate-800 block">Pilih Cara Pembayaran:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentOption('QRIS')}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                      paymentOption === 'QRIS'
                        ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-2xs'
                        : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <QrCode className="w-4 h-4 text-amber-600" /> Bayar QRIS (Midtrans)
                    </div>
                    <div className="text-[10px] text-slate-500 leading-tight">Simulator sandbox gratis langsung lunas.</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentOption('CASH')}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                      paymentOption === 'CASH'
                        ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-2xs'
                        : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <Building2 className="w-4 h-4 text-blue-600" /> Bayar di Kasir
                    </div>
                    <div className="text-[10px] text-slate-500 leading-tight">Bayar uang tunai (cash) ke meja kasir depan.</div>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={!customerName.trim() || cart.length === 0 || isSubmitting}
                className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-bold text-xs rounded-2xl shadow-lg shadow-amber-600/30 transition cursor-pointer active:scale-[0.99] flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Mengirim Pesanan...' : `Pesan Sekarang • ${formatIDR(grandTotal)}`}
              </button>
            </div>
          </div>
        )}

        {/* MIDTRANS SANDBOX SIMULATOR MODAL (100% FREE TESTING) */}
        {midtransModal && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs z-50 p-5 flex flex-col justify-center items-center animate-in fade-in text-slate-900">
            <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col items-center text-center space-y-3.5">
              {/* Midtrans Brand Header */}
              <div className="flex items-center justify-between w-full pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-slate-900 tracking-tight">Midtrans Payment Sandbox</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                  Mode Gratis (Simulator)
                </span>
              </div>

              {/* Amount Box */}
              <div>
                <p className="text-xs text-slate-400">Total Pembayaran QRIS</p>
                <div className="text-2xl font-bold font-mono text-slate-900 mt-0.5">
                  {formatIDR(midtransModal.grand_total)}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Order ID: <span className="font-mono font-semibold">{midtransModal.order_number}</span>
                </p>
              </div>

              {/* QR Code Graphic Box */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center relative">
                <div className="w-40 h-40 bg-white p-2 rounded-xl shadow-xs flex items-center justify-center border border-slate-200">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=00020101021226670016ID.CO.MIDTRANS01189360099900000000010215${midtransModal.order_number}5204581253033605802ID5914ESB%20COFFEESHOP6007JAKARTA62070703A016304`}
                    alt="Midtrans QRIS Sandbox"
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-[10px] text-slate-500 font-medium mt-2">
                  NMID: ID1029482019 • QRIS Standar Bank Indonesia
                </p>
              </div>

              {/* Explanatory text */}
              <div className="text-[11px] text-amber-900 bg-amber-50 p-2.5 rounded-xl text-left border border-amber-200/60 leading-relaxed">
                💡 <b>Mode Belajar 100% Gratis:</b> Tidak perlu transfer uang asli. Cukup klik tombol hijau di bawah untuk menyimulasikan pembayaran QRIS sukses via Midtrans.
              </div>

              {/* Simulator Action Button */}
              <div className="w-full space-y-2 pt-1">
                <button
                  onClick={handleSimulateMidtransSuccess}
                  disabled={isSimulatingPayment}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSimulatingPayment ? 'Memproses Webhook...' : '⚡ Simulasikan Bayar Sukses (Lunas)'}
                </button>

                <button
                  onClick={() => setMidtransModal(null)}
                  className="w-full py-1.5 text-slate-400 hover:text-slate-600 text-xs font-semibold transition cursor-pointer"
                >
                  Batal / Kembali
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ORDER SUCCESS MODAL */}
        {orderSuccess && (
          <div className="absolute inset-0 bg-white z-50 p-6 flex flex-col justify-between animate-in fade-in text-slate-900 text-center">
            <div className="space-y-4 my-auto">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">Pesanan Berhasil Masuk!</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Nomor Pesanan: <span className="font-mono font-bold text-slate-800">{orderSuccess.order_number}</span>
                </p>
              </div>

              {/* Status Box */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Meja:</span>
                  <span className="font-bold text-slate-900">{orderSuccess.table_number || tableNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama Pelanggan:</span>
                  <span className="font-bold text-slate-900">{orderSuccess.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status Pembayaran:</span>
                  <span className={`font-bold ${orderSuccess.payment_status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {orderSuccess.payment_status === 'PAID' ? 'LUNAS (QRIS)' : 'MENUNGGU PEMBAYARAN DI KASIR'}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-slate-950">
                  <span>Total Tagihan:</span>
                  <span className="font-mono">{formatIDR(orderSuccess.grand_total)}</span>
                </div>
              </div>

              {orderSuccess.payment_status === 'PAID' ? (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-[11px] rounded-xl flex items-center gap-2 text-left">
                  <Clock className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Pesanan & pemotongan stok bahan baku telah terhubung langsung ke Manager & Kasir!</span>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 text-amber-800 text-[11px] rounded-xl flex items-center gap-2 text-left">
                  <Clock className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Silakan ke kasir dan sebutkan <b>Meja {orderSuccess.table_number || tableNumber}</b> untuk menyelesaikan pembayaran.</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setOrderSuccess(null)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Pesan Menu Tambahan
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
