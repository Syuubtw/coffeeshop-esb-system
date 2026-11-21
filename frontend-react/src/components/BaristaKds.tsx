import React, { useEffect, useState, useRef } from 'react';
import { 
  Coffee, 
  CheckCircle2, 
  ChefHat, 
  RotateCcw,
  Timer
} from 'lucide-react';
import api from '../services/api';
import { formatTableDisplayName } from '../utils/tableHelper';

interface KdsOrderItem {
  id: number;
  qty: number;
  notes?: string;
  product?: { name: string; category?: string };
  modifiers?: Array<{ modifier_name: string }>;
}

interface KdsOrder {
  id: number;
  order_number: string;
  order_source: string;
  customer_name: string;
  dining_table?: { table_number: string };
  order_status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  payment_status: string;
  created_at: string;
  items: KdsOrderItem[];
}

export const BaristaKds: React.FC = () => {
  const [orders, setOrders] = useState<KdsOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterMode, setFilterMode] = useState<'ALL' | 'ACTIVE' | 'READY'>('ALL');
  const isFetchingRef = useRef(false);

  const fetchKdsQueue = async () => {
    if (document.hidden) return;
    if (isFetchingRef.current) return;

    try {
      isFetchingRef.current = true;
      setLoading(true);
      const res = await api.get('/kds/queue');
      if (res.data?.data) {
        setOrders(res.data.data);
      } else {
        setOrders([]);
      }
    } catch {
      setOrders([]);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKdsQueue();
    const interval = setInterval(fetchKdsQueue, 7000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId: number, nextStatus: string) => {
    try {
      await api.patch(`/kds/orders/${orderId}/status`, { order_status: nextStatus });
      fetchKdsQueue();
    } catch {
      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, order_status: nextStatus as any } : o))
      );
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filterMode === 'ACTIVE') return ['PENDING', 'CONFIRMED', 'PREPARING'].includes(o.order_status);
    if (filterMode === 'READY') return o.order_status === 'READY';
    return true;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-5.5rem)] gap-4 overflow-hidden">
      {/* KDS Header Bar */}
      <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base tracking-tight">Layar Antrean Dapur & Barista</h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 animate-pulse">
                ● Terhubung Otomatis
              </span>
            </div>
            <p className="text-xs text-slate-400">Daftar pesanan minuman & makanan yang siap dibuat secara langsung</p>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterMode('ACTIVE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterMode === 'ACTIVE'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Sedang Dibuat ({orders.filter(o => ['PENDING', 'CONFIRMED', 'PREPARING'].includes(o.order_status)).length})
          </button>
          <button
            onClick={() => setFilterMode('READY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterMode === 'READY'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Siap Diambil ({orders.filter(o => o.order_status === 'READY').length})
          </button>
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterMode === 'ALL'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Semua ({orders.length})
          </button>

          <button
            onClick={fetchKdsQueue}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer ml-2"
            title="Perbarui Antrean"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Orders Board */}
      <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max p-1">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full py-24 flex flex-col items-center justify-center text-slate-400">
            <Coffee className="w-12 h-12 text-slate-300 mb-2 stroke-[1.5]" />
            <p className="text-base font-semibold text-slate-700">Tidak Ada Antrean Barista</p>
            <p className="text-xs text-slate-400 mt-1">Pesanan kopi baru dari kasir atau QR meja akan muncul di sini secara otomatis.</p>
          </div>
        ) : (
          filteredOrders.map((ord) => {
            const isPreparing = ord.order_status === 'PREPARING';
            const isReady = ord.order_status === 'READY';
            const isPending = ['PENDING', 'CONFIRMED'].includes(ord.order_status);

            return (
              <div
                key={ord.id}
                className={`rounded-2xl border flex flex-col justify-between overflow-hidden shadow-xs transition ${
                  isPreparing
                    ? 'border-blue-400 bg-blue-50/20 ring-2 ring-blue-400/20'
                    : isReady
                    ? 'border-teal-400 bg-teal-50/20'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className={`p-3.5 border-b flex items-start justify-between ${
                    isPreparing ? 'bg-blue-600 text-white' :
                    isReady ? 'bg-teal-700 text-white' :
                    'bg-slate-900 text-white'
                  }`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm bg-white/20 px-2 py-0.5 rounded-md">
                          {ord.dining_table ? formatTableDisplayName(ord.dining_table.table_number) : 'Bungkus'}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                          {ord.order_source === 'QR_TABLE' ? '📱 Pesanan Meja' : '🖥️ Kasir Langsung'}
                        </span>
                      </div>
                      <div className="font-bold text-xs mt-1 truncate">{ord.customer_name}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] font-mono text-white/80">
                        {ord.created_at?.substring(11, 16) || 'Baru'}
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/20 uppercase mt-0.5 inline-block">
                        {ord.order_status === 'PREPARING' ? 'Sedang Dibuat' : ord.order_status === 'READY' ? 'Siap Disajikan' : 'Menunggu'}
                      </span>
                    </div>
                  </div>

                  {/* Drink Item List */}
                  <div className="p-3.5 space-y-3">
                    {ord.items?.map((it, idx) => (
                      <div key={idx} className="border-b border-slate-100 last:border-0 pb-2.5 last:pb-0">
                        <div className="flex items-baseline justify-between">
                          <span className="font-extrabold text-slate-900 text-sm">
                            {it.qty}x {it.product?.name || 'Kopi'}
                          </span>
                        </div>

                        {it.modifiers && it.modifiers.length > 0 && (
                          <div className="text-xs text-amber-800 font-semibold mt-0.5 pl-3 border-l-2 border-amber-400">
                            {it.modifiers.map((m) => m.modifier_name).join(', ')}
                          </div>
                        )}

                        {it.notes && (
                          <div className="text-[11px] text-rose-700 italic mt-0.5 pl-3 border-l-2 border-rose-400">
                            "{it.notes}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Progress Controls */}
                <div className="p-3 border-t border-slate-100 bg-slate-50/70 flex gap-2">
                  {isPending && (
                    <button
                      onClick={() => handleUpdateStatus(ord.id, 'PREPARING')}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Timer className="w-3.5 h-3.5" /> Mulai Racik Minuman
                    </button>
                  )}

                  {isPreparing && (
                    <button
                      onClick={() => handleUpdateStatus(ord.id, 'READY')}
                      className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Minuman Siap Diambil
                    </button>
                  )}

                  {isReady && (
                    <button
                      onClick={() => handleUpdateStatus(ord.id, 'COMPLETED')}
                      className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Selesai Disajikan
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
