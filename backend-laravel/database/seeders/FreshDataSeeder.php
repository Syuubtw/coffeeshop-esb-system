<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\AuditLog;
use App\Models\CashierShift;
use App\Models\Category;
use App\Models\ChartOfAccount;
use App\Models\DiningTable;
use App\Models\Employee;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PayrollPeriod;
use App\Models\Payslip;
use App\Models\PayslipItem;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\RawMaterial;
use App\Models\StockMovement;
use App\Models\User;
use App\Services\AccountingService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class FreshDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🧹 Memulai reset dan pembuatan data baru coffeeshop...');

        // ═══════════════════════════════════════════════════════════════
        // 1. TRUNCATE ALL OPERATIONAL / TRANSACTIONAL DATA
        // ═══════════════════════════════════════════════════════════════
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        DB::table('orders')->truncate();
        DB::table('order_items')->truncate();
        DB::table('order_item_modifiers')->truncate();
        DB::table('cashier_shifts')->truncate();
        DB::table('attendances')->truncate();
        DB::table('work_schedules')->truncate();
        DB::table('purchase_orders')->truncate();
        DB::table('purchase_order_items')->truncate();
        DB::table('stock_movements')->truncate();
        DB::table('stock_opnames')->truncate();
        DB::table('stock_opname_items')->truncate();
        DB::table('waste_logs')->truncate();
        DB::table('journal_entries')->truncate();
        DB::table('journal_entry_items')->truncate();
        DB::table('payroll_periods')->truncate();
        DB::table('payslips')->truncate();
        DB::table('payslip_items')->truncate();
        DB::table('audit_logs')->truncate();
        DB::table('personal_access_tokens')->truncate();

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Reset dining tables to AVAILABLE
        DiningTable::query()->update(['status' => 'AVAILABLE']);

        $this->command->info('✅ Seluruh data transaksi lama berhasil di-reset.');

        // ═══════════════════════════════════════════════════════════════
        // 2. VERIFY / RESTORE EMPLOYEES & USERS (NAMA KARYAWAN TETAP UTUH)
        // ═══════════════════════════════════════════════════════════════
        $superAdmin = User::firstOrCreate(['email' => 'admin@coffeeshop.test'], [
            'name' => 'Faiz Rifki Syuhada',
            'password' => bcrypt('password'),
        ]);
        $storeManager = User::firstOrCreate(['email' => 'manager@coffeeshop.test'], [
            'name' => 'Raka Pratama (Store Manager)',
            'password' => bcrypt('password'),
        ]);
        $cashierUser = User::firstOrCreate(['email' => 'cashier@coffeeshop.test'], [
            'name' => 'Siti Rahmawati (Kasir Utama)',
            'password' => bcrypt('password'),
        ]);
        $barista1 = User::firstOrCreate(['email' => 'barista@coffeeshop.test'], [
            'name' => 'Fajar Nugraha (Barista Utama)',
            'password' => bcrypt('password'),
        ]);
        $barista2 = User::firstOrCreate(['email' => 'barista2@coffeeshop.test'], [
            'name' => 'Dimas Pratama (Barista Espresso)',
            'password' => bcrypt('password'),
        ]);
        $barista3 = User::firstOrCreate(['email' => 'barista3@coffeeshop.test'], [
            'name' => 'Sarah Amelia (Barista Manual Brew)',
            'password' => bcrypt('password'),
        ]);
        $warehouseUser = User::firstOrCreate(['email' => 'warehouse@coffeeshop.test'], [
            'name' => 'Budi Santoso (Admin Gudang & Purchasing)',
            'password' => bcrypt('password'),
        ]);

        $employees = Employee::with('user')->orderBy('employee_code')->get();
        $this->command->info("✅ 7 Karyawan aktif terverifikasi utuh ({$employees->pluck('user.name')->join(', ')}).");

        // ═══════════════════════════════════════════════════════════════
        // 3. RESET CHART OF ACCOUNTS & OPENING BALANCES
        // ═══════════════════════════════════════════════════════════════
        $this->call(ChartOfAccountsSeeder::class);

        // ═══════════════════════════════════════════════════════════════
        // 4. RESET RAW MATERIALS STOCK (STOK GUDANG SEGAR)
        // ═══════════════════════════════════════════════════════════════
        $freshStocks = [
            'RM-COFFEE-001' => ['stock' => 35000, 'cost' => 250],   // 35 kg Arabica Toraja
            'RM-COFFEE-002' => ['stock' => 20000, 'cost' => 150],   // 20 kg Robusta Lampung
            'RM-DAIRY-001'  => ['stock' => 80000, 'cost' => 20],    // 80 L Susu Full Cream
            'RM-DAIRY-002'  => ['stock' => 25000, 'cost' => 45],    // 25 L Susu Oat
            'RM-SWEET-001'  => ['stock' => 18000, 'cost' => 35],    // 18 L Gula Aren Cair
            'RM-SWEET-002'  => ['stock' => 8000,  'cost' => 80],    // 8 L Sirup Vanilla
            'RM-SWEET-003'  => ['stock' => 8000,  'cost' => 80],    // 8 L Sirup Caramel
            'RM-SWEET-004'  => ['stock' => 6000,  'cost' => 90],    // 6 L Sirup Hazelnut
            'RM-CHOCO-001'  => ['stock' => 12000, 'cost' => 120],   // 12 kg Cokelat Bubuk
            'RM-TEA-001'    => ['stock' => 4000,  'cost' => 500],   // 4 kg Matcha Powder
            'RM-ICE-001'    => ['stock' => 150000,'cost' => 5],     // 150 kg Es Batu
            'RM-CUP-001'    => ['stock' => 3500,  'cost' => 1500],  // 3.500 pcs Cup Dingin 22oz
            'RM-CUP-002'    => ['stock' => 2000,  'cost' => 2000],  // 2.000 pcs Cup Panas 12oz
            'RM-CUP-003'    => ['stock' => 3500,  'cost' => 500],   // 3.500 pcs Tutup Cup
            'RM-CUP-004'    => ['stock' => 8000,  'cost' => 300],   // 8.000 pcs Sedotan
            'RM-TOP-001'    => ['stock' => 10000, 'cost' => 100],   // 10 L Whipped Cream
            'RM-PASTRY-001' => ['stock' => 15000, 'cost' => 30],    // 15 kg Adonan Croissant
            'RM-PASTRY-002' => ['stock' => 8000,  'cost' => 40],    // 8 kg Roti Toast
            'RM-TEA-002'    => ['stock' => 4000,  'cost' => 300],   // 4 kg Teh Earl Grey
            'RM-WATER-001'  => ['stock' => 150000,'cost' => 1],     // 150 L Air Galon
        ];

        foreach ($freshStocks as $sku => $val) {
            $rm = RawMaterial::where('sku', $sku)->first();
            if ($rm) {
                $rm->update([
                    'current_stock' => $val['stock'],
                    'avg_cost_per_unit' => $val['cost'],
                ]);

                StockMovement::create([
                    'raw_material_id' => $rm->id,
                    'type' => 'IN_PURCHASE',
                    'qty' => $val['stock'],
                    'unit_cost' => $val['cost'],
                    'notes' => 'Stok awal gudang baru (Fresh Initial Inventory)',
                    'created_at' => Carbon::now()->subDays(5),
                    'updated_at' => Carbon::now()->subDays(5),
                ]);
            }
        }
        $this->command->info('✅ Stok bahan baku gudang berhasil diatur ulang dengan nilai baru.');

        // ═══════════════════════════════════════════════════════════════
        // 5. CREATE FRESH PURCHASE ORDERS (PO PENGADAAN GUDANG)
        // ═══════════════════════════════════════════════════════════════
        $po1 = PurchaseOrder::create([
            'po_number' => 'PO-20261118-001',
            'supplier_name' => 'Toko Sumber Kopi Roastery & Packaging',
            'requested_by' => $warehouseUser->id,
            'approved_by' => $storeManager->id,
            'status' => 'RECEIVED',
            'total_amount' => 6750000,
            'order_date' => Carbon::now()->subDays(3)->toDateString(),
            'expected_delivery_date' => Carbon::now()->subDays(2)->toDateString(),
            'received_at' => Carbon::now()->subDays(2)->setHour(10)->setMinute(30),
            'notes' => 'Pengadaan rutin mingguan biji kopi arabica fresh roast dan gelas cup dingin 22oz.',
            'created_at' => Carbon::now()->subDays(3),
            'updated_at' => Carbon::now()->subDays(2),
        ]);

        $rmArabica = RawMaterial::where('sku', 'RM-COFFEE-001')->first();
        $rmCup = RawMaterial::where('sku', 'RM-CUP-001')->first();

        PurchaseOrderItem::create([
            'purchase_order_id' => $po1->id,
            'raw_material_id' => $rmArabica->id,
            'qty_ordered' => 15000,
            'unit_cost' => 250,
            'subtotal' => 3750000,
        ]);
        PurchaseOrderItem::create([
            'purchase_order_id' => $po1->id,
            'raw_material_id' => $rmCup->id,
            'qty_ordered' => 2000,
            'unit_cost' => 1500,
            'subtotal' => 3000000,
        ]);

        $po2 = PurchaseOrder::create([
            'po_number' => 'PO-20261120-002',
            'supplier_name' => 'Distributor Susu Diamond & Sirup Monin',
            'requested_by' => $warehouseUser->id,
            'approved_by' => $storeManager->id,
            'status' => 'RECEIVED',
            'total_amount' => 1650000,
            'order_date' => Carbon::now()->subDay()->toDateString(),
            'expected_delivery_date' => Carbon::now()->subDay()->toDateString(),
            'received_at' => Carbon::now()->subDay()->setHour(14)->setMinute(15),
            'notes' => 'Restock susu full cream segar dan sirup caramel untuk minuman signature kopi.',
            'created_at' => Carbon::now()->subDay(),
            'updated_at' => Carbon::now()->subDay(),
        ]);

        $rmMilk = RawMaterial::where('sku', 'RM-DAIRY-001')->first();
        $rmCaramel = RawMaterial::where('sku', 'RM-SWEET-003')->first();
        $rmOat = RawMaterial::where('sku', 'RM-DAIRY-002')->first();

        PurchaseOrderItem::create([
            'purchase_order_id' => $po2->id,
            'raw_material_id' => $rmMilk->id,
            'qty_ordered' => 40000,
            'unit_cost' => 20,
            'subtotal' => 800000,
        ]);
        PurchaseOrderItem::create([
            'purchase_order_id' => $po2->id,
            'raw_material_id' => $rmCaramel->id,
            'qty_ordered' => 5000,
            'unit_cost' => 80,
            'subtotal' => 400000,
        ]);
        PurchaseOrderItem::create([
            'purchase_order_id' => $po2->id,
            'raw_material_id' => $rmOat->id,
            'qty_ordered' => 10000,
            'unit_cost' => 45,
            'subtotal' => 450000,
        ]);

        $po3 = PurchaseOrder::create([
            'po_number' => 'PO-' . date('Ymd') . '-003',
            'supplier_name' => 'Pasar Tradisional Bahan Segar',
            'requested_by' => $warehouseUser->id,
            'approved_by' => $storeManager->id,
            'status' => 'APPROVED',
            'total_amount' => 600000,
            'order_date' => Carbon::now()->toDateString(),
            'expected_delivery_date' => Carbon::now()->toDateString(),
            'notes' => 'Gula aren asli nira kelapa dan es batu kristal higienis untuk persiapan operasional.',
            'created_at' => Carbon::now()->subHours(3),
            'updated_at' => Carbon::now()->subHours(2),
        ]);

        $rmSugar = RawMaterial::where('sku', 'RM-SWEET-001')->first();
        $rmIce = RawMaterial::where('sku', 'RM-ICE-001')->first();

        PurchaseOrderItem::create([
            'purchase_order_id' => $po3->id,
            'raw_material_id' => $rmSugar->id,
            'qty_ordered' => 10000,
            'unit_cost' => 35,
            'subtotal' => 350000,
        ]);
        PurchaseOrderItem::create([
            'purchase_order_id' => $po3->id,
            'raw_material_id' => $rmIce->id,
            'qty_ordered' => 50000,
            'unit_cost' => 5,
            'subtotal' => 250000,
        ]);

        $po4 = PurchaseOrder::create([
            'po_number' => 'PO-' . date('Ymd') . '-004',
            'supplier_name' => 'Oatmilk Official Store & Tea Specialty',
            'requested_by' => $warehouseUser->id,
            'status' => 'PENDING_APPROVAL',
            'total_amount' => 1500000,
            'order_date' => Carbon::now()->toDateString(),
            'expected_delivery_date' => Carbon::now()->addDay()->toDateString(),
            'notes' => 'Pengajuan penambahan susu oat dan teh earl grey premium karena lonjakan pesanan.',
            'created_at' => Carbon::now()->subHour(),
            'updated_at' => Carbon::now()->subHour(),
        ]);

        $rmTea = RawMaterial::where('sku', 'RM-TEA-002')->first();

        PurchaseOrderItem::create([
            'purchase_order_id' => $po4->id,
            'raw_material_id' => $rmOat->id,
            'qty_ordered' => 20000,
            'unit_cost' => 45,
            'subtotal' => 900000,
        ]);
        PurchaseOrderItem::create([
            'purchase_order_id' => $po4->id,
            'raw_material_id' => $rmTea->id,
            'qty_ordered' => 2000,
            'unit_cost' => 300,
            'subtotal' => 600000,
        ]);

        $this->command->info('✅ 4 Purchase Order baru berhasil dibuat di modul gudang.');

        // ═══════════════════════════════════════════════════════════════
        // 6. CREATE CASHIER SHIFTS (KEMARIN & HARI INI)
        // ═══════════════════════════════════════════════════════════════
        $shiftYesterday = CashierShift::create([
            'user_id' => $cashierUser->id,
            'opened_at' => Carbon::now()->subDay()->setHour(8)->setMinute(0),
            'closed_at' => Carbon::now()->subDay()->setHour(21)->setMinute(45),
            'starting_cash' => 500000,
            'expected_ending_cash' => 1340000,
            'actual_ending_cash' => 1340000,
            'created_at' => Carbon::now()->subDay()->setHour(8),
            'updated_at' => Carbon::now()->subDay()->setHour(21)->setMinute(45),
        ]);

        $shiftToday = CashierShift::create([
            'user_id' => $cashierUser->id,
            'opened_at' => Carbon::now()->setHour(7)->setMinute(45),
            'closed_at' => null, // SEDANG AKTIF!
            'starting_cash' => 500000,
            'expected_ending_cash' => 500000,
            'created_at' => Carbon::now()->setHour(7)->setMinute(45),
            'updated_at' => Carbon::now()->setHour(7)->setMinute(45),
        ]);

        $this->command->info('✅ Shift kasir Siti Rahmawati aktif hari ini (Modal: Rp 500.000).');

        // ═══════════════════════════════════════════════════════════════
        // 7. CREATE REALISTIC POS & TABLE ORDERS
        // ═══════════════════════════════════════════════════════════════
        $pAren = Product::with('recipes.rawMaterial')->where('sku', 'PRD-SIG-001')->first();
        $pLatte = Product::with('recipes.rawMaterial')->where('sku', 'PRD-ESP-005')->first();
        $pAmericano = Product::with('recipes.rawMaterial')->where('sku', 'PRD-ESP-003')->first();
        $pCroissant = Product::with('recipes.rawMaterial')->where('sku', 'PRD-SNK-001')->first();
        $pToast = Product::with('recipes.rawMaterial')->where('sku', 'PRD-SNK-002')->first();
        $pMatcha = Product::with('recipes.rawMaterial')->where('sku', 'PRD-NON-001')->first();
        $pV60 = Product::with('recipes.rawMaterial')->where('sku', 'PRD-MAN-001')->first();
        $pChoco = Product::with('recipes.rawMaterial')->where('sku', 'PRD-NON-002')->first();
        $pCappuccino = Product::with('recipes.rawMaterial')->where('sku', 'PRD-ESP-004')->first();
        $pDirtyMatcha = Product::with('recipes.rawMaterial')->where('sku', 'PRD-SIG-002')->first();

        $tables = DiningTable::all()->keyBy('table_number');
        $accounting = app(AccountingService::class);

        // Helper to create an order
        $createOrder = function (
            string $orderNum,
            ?DiningTable $table,
            CashierShift $shift,
            string $source,
            string $type,
            string $custName,
            string $payMethod,
            string $payStatus,
            string $orderStatus,
            array $itemsList,
            Carbon $time
        ) use ($accounting) {
            $subtotal = 0;
            foreach ($itemsList as $it) {
                $subtotal += ($it['product']->base_price * $it['qty']);
            }
            $tax = round($subtotal * 0.10, 2);
            $service = $type === 'DINE_IN' ? round($subtotal * 0.05, 2) : 0;
            $grand = $subtotal + $tax + $service;

            $order = Order::create([
                'order_number' => $orderNum,
                'dining_table_id' => $table?->id,
                'cashier_shift_id' => $shift->id,
                'order_source' => $source,
                'order_type' => $type,
                'customer_name' => $custName,
                'subtotal' => $subtotal,
                'tax_amount' => $tax,
                'service_charge' => $service,
                'discount_amount' => 0,
                'grand_total' => $grand,
                'payment_method' => $payMethod,
                'payment_status' => $payStatus,
                'order_status' => $orderStatus,
                'created_at' => $time,
                'updated_at' => $time,
            ]);

            foreach ($itemsList as $it) {
                $unitCogs = 0;
                foreach ($it['product']->recipes as $rcp) {
                    $unitCogs += ($rcp->qty_needed * ($rcp->rawMaterial->avg_cost_per_unit ?? 0));
                }

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $it['product']->id,
                    'qty' => $it['qty'],
                    'unit_price' => $it['product']->base_price,
                    'unit_cogs' => $unitCogs,
                    'subtotal' => $it['product']->base_price * $it['qty'],
                    'notes' => $it['notes'] ?? null,
                    'created_at' => $time,
                    'updated_at' => $time,
                ]);

                // Deduct inventory
                foreach ($it['product']->recipes as $rcp) {
                    $deduct = $rcp->qty_needed * $it['qty'];
                    RawMaterial::where('id', $rcp->raw_material_id)->decrement('current_stock', $deduct);

                    StockMovement::create([
                        'raw_material_id' => $rcp->raw_material_id,
                        'type' => 'OUT_SALE',
                        'qty' => $deduct,
                        'unit_cost' => $rcp->rawMaterial->avg_cost_per_unit ?? 0,
                        'reference_type' => Order::class,
                        'reference_id' => $order->id,
                        'notes' => "Sale via Order #{$order->order_number}",
                        'created_at' => $time,
                        'updated_at' => $time,
                    ]);
                }
            }

            if ($table && in_array($orderStatus, ['CONFIRMED', 'PREPARING', 'READY'])) {
                $table->update(['status' => 'OCCUPIED']);
            }

            if ($payStatus === 'PAID') {
                $accounting->recordOrderSale($order);
            }

            return $order;
        };

        // Orders Yesterday
        $yDate = Carbon::now()->subDay();
        $createOrder('POS-' . $yDate->format('Ymd') . '-00101', null, $shiftYesterday, 'POS', 'TAKEAWAY', 'Bpk. Ahmad Kurnia', 'CASH', 'PAID', 'COMPLETED', [
            ['product' => $pAren, 'qty' => 2],
            ['product' => $pCroissant, 'qty' => 1],
        ], $yDate->copy()->setHour(9)->setMinute(15));

        $createOrder('ORD-' . $yDate->format('Ymd') . '-00102', $tables->get('TB-01'), $shiftYesterday, 'QR_TABLE', 'DINE_IN', 'Meja 1 - Clara & Maya', 'QRIS', 'PAID', 'COMPLETED', [
            ['product' => $pLatte, 'qty' => 2],
            ['product' => $pToast, 'qty' => 1],
        ], $yDate->copy()->setHour(11)->setMinute(30));

        $createOrder('POS-' . $yDate->format('Ymd') . '-00103', null, $shiftYesterday, 'POS', 'TAKEAWAY', 'Dennis Saputra', 'CASH', 'PAID', 'COMPLETED', [
            ['product' => $pAmericano, 'qty' => 1],
            ['product' => $pAren, 'qty' => 1],
        ], $yDate->copy()->setHour(14)->setMinute(20));

        $createOrder('ORD-' . $yDate->format('Ymd') . '-00104', $tables->get('TB-06'), $shiftYesterday, 'QR_TABLE', 'DINE_IN', 'Meja 6 - Tim Creative', 'QRIS', 'PAID', 'COMPLETED', [
            ['product' => $pAren, 'qty' => 4],
            ['product' => $pV60, 'qty' => 2],
            ['product' => $pCroissant, 'qty' => 3],
        ], $yDate->copy()->setHour(16)->setMinute(45));

        // Orders Today
        $tDate = Carbon::now();

        // 1. Completed Walk-In (CASH)
        $createOrder('POS-' . $tDate->format('Ymd') . '-00201', null, $shiftToday, 'POS', 'TAKEAWAY', 'Bpk. Hendra Wijaya', 'CASH', 'PAID', 'COMPLETED', [
            ['product' => $pAren, 'qty' => 2],
            ['product' => $pCroissant, 'qty' => 1],
        ], $tDate->copy()->setHour(8)->setMinute(15));

        // 2. Completed Dine-In (QRIS)
        $createOrder('ORD-' . $tDate->format('Ymd') . '-00202', $tables->get('TB-01'), $shiftToday, 'QR_TABLE', 'DINE_IN', 'Meja 1 - Anissa & Gita', 'QRIS', 'PAID', 'COMPLETED', [
            ['product' => $pLatte, 'qty' => 2],
            ['product' => $pToast, 'qty' => 1],
        ], $tDate->copy()->setHour(8)->setMinute(45));

        // 3. Completed Walk-In (CASH)
        $createOrder('POS-' . $tDate->format('Ymd') . '-00203', null, $shiftToday, 'POS', 'TAKEAWAY', 'Rian Pratama', 'CASH', 'PAID', 'COMPLETED', [
            ['product' => $pAmericano, 'qty' => 1],
            ['product' => $pToast, 'qty' => 1],
        ], $tDate->copy()->setHour(9)->setMinute(10));

        // 4. KDS READY (Siap Saji di Layar Barista!)
        $createOrder('ORD-' . $tDate->format('Ymd') . '-00204', $tables->get('TB-02'), $shiftToday, 'QR_TABLE', 'DINE_IN', 'Meja 2 - Kevin Tan', 'QRIS', 'PAID', 'READY', [
            ['product' => $pV60, 'qty' => 1],
            ['product' => $pMatcha, 'qty' => 1],
        ], $tDate->copy()->subMinutes(15));

        // 5. KDS PREPARING (Sedang Diracik di Layar Barista!)
        $createOrder('ORD-' . $tDate->format('Ymd') . '-00205', $tables->get('TB-04'), $shiftToday, 'QR_TABLE', 'DINE_IN', 'Meja 4 - Nadia Putri', 'QRIS', 'PAID', 'PREPARING', [
            ['product' => $pDirtyMatcha, 'qty' => 2],
            ['product' => $pChoco, 'qty' => 1],
        ], $tDate->copy()->subMinutes(8));

        // 6. KDS CONFIRMED (Pesanan Baru Masuk Antrean Barista!)
        $createOrder('POS-' . $tDate->format('Ymd') . '-00206', $tables->get('TB-05'), $shiftToday, 'POS', 'DINE_IN', 'Dine-In Meja 5 (Rico)', 'CASH', 'PAID', 'CONFIRMED', [
            ['product' => $pCappuccino, 'qty' => 2],
            ['product' => $pCroissant, 'qty' => 2],
        ], $tDate->copy()->subMinutes(3));

        // 7. POS UNPAID (Pesanan Meja Masuk Menunggu Bayar di Kasir!)
        $createOrder('ORD-' . $tDate->format('Ymd') . '-00207', $tables->get('TB-03'), $shiftToday, 'QR_TABLE', 'DINE_IN', 'Meja 3 - Dimas & Rekan', 'CASH', 'UNPAID', 'PENDING', [
            ['product' => $pAren, 'qty' => 3],
        ], $tDate->copy()->subMinutes(2));

        // Update shift expected cash based on today's cash sales
        $todayCashSales = Order::where('cashier_shift_id', $shiftToday->id)
            ->where('payment_method', 'CASH')
            ->where('payment_status', 'PAID')
            ->sum('grand_total');
        $shiftToday->update(['expected_ending_cash' => $shiftToday->starting_cash + $todayCashSales]);

        $this->command->info('✅ Transaksi realistis hari ini & kemarin berhasil dibuat (KDS memiliki antrean, Kasir memiliki shift & pesanan meja).');

        // ═══════════════════════════════════════════════════════════════
        // 8. CREATE FRESH ATTENDANCE & HR DATA
        // ═══════════════════════════════════════════════════════════════
        $empMap = $employees->keyBy('employee_code');

        // Past Monthly Attendance for November (Nov 1 to Nov 20)
        $curMonth = Carbon::now()->month;
        $curYear = Carbon::now()->year;

        for ($day = 1; $day <= 20; $day++) {
            $date = Carbon::create($curYear, $curMonth, $day);
            if ($date->isSunday()) continue; // Libur hari Minggu

            foreach ($employees as $emp) {
                // Random punctuality
                $isLate = rand(1, 10) === 1; // 10% chance late
                $lateMin = $isLate ? rand(5, 25) : 0;
                $inTime = $date->copy()->setHour(7)->setMinute(45 + ($isLate ? 15 + $lateMin : rand(0, 10)));
                $outTime = $date->copy()->setHour(16)->setMinute(30 + rand(0, 30));

                Attendance::create([
                    'employee_id' => $emp->id,
                    'clock_in' => $inTime,
                    'clock_out' => $outTime,
                    'late_minutes' => $lateMin,
                    'late_reason' => $isLate ? 'Macet lalu lintas di perjalanan' : null,
                    'status' => 'PRESENT',
                    'latitude' => -6.2088,
                    'longitude' => 106.8456,
                    'location_name' => 'Outlet Coffeeshop (Radius Aman)',
                    'notes' => 'Presensi harian staf reguler',
                    'created_at' => $inTime,
                    'updated_at' => $outTime,
                ]);
            }
        }

        // Today's Attendance (2026-11-21):
        // 3 Staff Working Right Now (Siti Kasir, Fajar Barista, Dimas Barista)
        $todayNow = Carbon::now();

        Attendance::create([
            'employee_id' => $empMap['EMP-003']->id, // Siti Rahmawati (Kasir)
            'clock_in' => $todayNow->copy()->setHour(7)->setMinute(46),
            'clock_out' => null, // Sedang Aktif Bekerja!
            'late_minutes' => 0,
            'status' => 'PRESENT',
            'latitude' => -6.2088,
            'longitude' => 106.8456,
            'location_name' => 'Outlet Coffeeshop (Radius Aman)',
            'created_at' => $todayNow->copy()->setHour(7)->setMinute(46),
            'updated_at' => $todayNow->copy()->setHour(7)->setMinute(46),
        ]);

        Attendance::create([
            'employee_id' => $empMap['EMP-004']->id, // Fajar Nugraha (Barista Utama)
            'clock_in' => $todayNow->copy()->setHour(7)->setMinute(51),
            'clock_out' => null, // Sedang Aktif Bekerja!
            'late_minutes' => 0,
            'status' => 'PRESENT',
            'latitude' => -6.2088,
            'longitude' => 106.8456,
            'location_name' => 'Outlet Coffeeshop (Radius Aman)',
            'created_at' => $todayNow->copy()->setHour(7)->setMinute(51),
            'updated_at' => $todayNow->copy()->setHour(7)->setMinute(51),
        ]);

        Attendance::create([
            'employee_id' => $empMap['EMP-005']->id, // Dimas Pratama (Barista Espresso)
            'clock_in' => $todayNow->copy()->setHour(7)->setMinute(58),
            'clock_out' => null, // Sedang Aktif Bekerja!
            'late_minutes' => 0,
            'status' => 'PRESENT',
            'latitude' => -6.2088,
            'longitude' => 106.8456,
            'location_name' => 'Outlet Coffeeshop (Radius Aman)',
            'created_at' => $todayNow->copy()->setHour(7)->setMinute(58),
            'updated_at' => $todayNow->copy()->setHour(7)->setMinute(58),
        ]);

        // EMP-001 (Faiz), EMP-002 (Raka), EMP-006 (Sarah), EMP-007 (Budi) do NOT have today's attendance row
        // -> status = "Belum Masuk" (NOT_CLOCKED_IN), siap diuji presensi mandiri oleh user!

        // ═══════════════════════════════════════════════════════════════
        // 9. CREATE 1 PAST PAYROLL PERIOD (OKTOBER 2026)
        // ═══════════════════════════════════════════════════════════════
        $prevMonth = Carbon::now()->subMonth();
        $payroll = PayrollPeriod::create([
            'month' => $prevMonth->month,
            'year' => $prevMonth->year,
            'start_date' => $prevMonth->copy()->startOfMonth()->toDateString(),
            'end_date' => $prevMonth->copy()->endOfMonth()->toDateString(),
            'total_disbursed' => 0,
            'status' => 'CALCULATED',
        ]);

        $totalDisbursed = 0;
        foreach ($employees as $emp) {
            $daysPresent = 22;
            $allowance = $daysPresent * $emp->daily_allowance;
            $overtime = 4 * $emp->hourly_overtime_rate;
            $scBonus = 350000;
            $netSalary = $emp->base_salary + $allowance + $overtime + $scBonus;
            $totalDisbursed += $netSalary;

            $slip = Payslip::create([
                'payroll_period_id' => $payroll->id,
                'employee_id' => $emp->id,
                'total_attendance_days' => $daysPresent,
                'total_late_minutes' => 15,
                'total_overtime_hours' => 4,
                'base_salary_earned' => $emp->base_salary,
                'allowance_earned' => $allowance,
                'overtime_earned' => $overtime,
                'service_charge_bonus' => $scBonus,
                'deductions_amount' => 15000,
                'net_salary' => $netSalary - 15000,
            ]);

            PayslipItem::create(['payslip_id' => $slip->id, 'type' => 'EARNING', 'description' => 'Gaji Pokok Bulanan', 'amount' => $emp->base_salary]);
            PayslipItem::create(['payslip_id' => $slip->id, 'type' => 'EARNING', 'description' => "Uang Kehadiran ({$daysPresent} Hari)", 'amount' => $allowance]);
            PayslipItem::create(['payslip_id' => $slip->id, 'type' => 'EARNING', 'description' => 'Uang Lembur (4 Jam)', 'amount' => $overtime]);
            PayslipItem::create(['payslip_id' => $slip->id, 'type' => 'BONUS', 'description' => 'Bagi Hasil Service Charge Restoran', 'amount' => $scBonus]);
            PayslipItem::create(['payslip_id' => $slip->id, 'type' => 'DEDUCTION', 'description' => 'Potongan Terlambat (15 Menit)', 'amount' => 15000]);
        }
        $payroll->update(['total_disbursed' => $totalDisbursed]);

        $this->command->info('✅ Rekap presensi bulanan dan penggajian karyawan berhasil dihitung.');

        // ═══════════════════════════════════════════════════════════════
        // 10. CREATE AUDIT LOGS
        // ═══════════════════════════════════════════════════════════════
        AuditLog::create([
            'user_id' => $superAdmin->id,
            'user_name' => $superAdmin->name,
            'user_role' => 'Owner',
            'action' => 'DATABASE_FRESH_SEEDED',
            'entity_type' => 'System',
            'entity_id' => 1,
            'description' => 'Sistem berhasil direset dan diisi dengan data operasional baru yang segar dan konsisten.',
            'created_at' => now(),
        ]);

        $this->command->info('');
        $this->command->info('🎉 DATA BERHASIL DIRESET & DIPERBARUI DENGAN SUKSES! 🎉');
        $this->command->info('• Seluruh 7 nama karyawan tetap utuh.');
        $this->command->info('• Stok gudang baru & 4 pengadaan PO siap diperiksa.');
        $this->command->info('• Shift kasir & transaksi hari ini aktif.');
        $this->command->info('• Antrean racik KDS Barista aktif (Ready, Preparing, Confirmed).');
        $this->command->info('• Presensi staf siap digunakan.');
    }
}
