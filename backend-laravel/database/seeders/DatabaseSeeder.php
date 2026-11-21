<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\DiningTable;
use App\Models\Employee;
use App\Models\Modifier;
use App\Models\ModifierGroup;
use App\Models\Product;
use App\Models\RawMaterial;
use App\Models\Recipe;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // ═══════════════════════════════════════════════════════════════
        // 1. CREATE ROLES (Spatie)
        // ═══════════════════════════════════════════════════════════════
        $roles = ['super_admin', 'store_manager', 'warehouse_admin', 'cashier', 'barista'];
        foreach ($roles as $roleName) {
            Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
        }

        // ═══════════════════════════════════════════════════════════════
        // 2. CREATE DEFAULT USERS WITH ROLES
        // ═══════════════════════════════════════════════════════════════
        $superAdmin = User::updateOrCreate(
            ['email' => 'admin@coffeeshop.test'],
            [
                'name' => 'Faiz Rifki Syuhada',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );
        $superAdmin->assignRole('super_admin');

        $storeManager = User::updateOrCreate(
            ['email' => 'manager@coffeeshop.test'],
            [
                'name' => 'Raka Pratama (Store Manager)',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );
        $storeManager->assignRole('store_manager');

        $cashierUser = User::updateOrCreate(
            ['email' => 'cashier@coffeeshop.test'],
            [
                'name' => 'Siti Rahmawati (Kasir Utama)',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );
        $cashierUser->assignRole('cashier');

        // Barista 1: Barista Utama / Head Barista
        $baristaUser1 = User::updateOrCreate(
            ['email' => 'barista@coffeeshop.test'],
            [
                'name' => 'Fajar Nugraha (Barista Utama)',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );
        $baristaUser1->assignRole('barista');

        // Barista 2: Barista Espresso Bar
        $baristaUser2 = User::updateOrCreate(
            ['email' => 'barista2@coffeeshop.test'],
            [
                'name' => 'Dimas Pratama (Barista Espresso)',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );
        $baristaUser2->assignRole('barista');

        // Barista 3: Barista Manual Brew & Mocktail
        $baristaUser3 = User::updateOrCreate(
            ['email' => 'barista3@coffeeshop.test'],
            [
                'name' => 'Sarah Amelia (Barista Manual Brew)',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );
        $baristaUser3->assignRole('barista');

        // Admin Gudang & Purchasing
        $warehouseUser = User::updateOrCreate(
            ['email' => 'warehouse@coffeeshop.test'],
            [
                'name' => 'Budi Santoso (Admin Gudang & Purchasing)',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );
        $warehouseUser->assignRole('warehouse_admin');

        // ═══════════════════════════════════════════════════════════════
        // 3. CREATE EMPLOYEE RECORDS
        // ═══════════════════════════════════════════════════════════════
        Employee::updateOrCreate(
            ['employee_code' => 'EMP-001'],
            [
                'user_id' => $superAdmin->id,
                'position' => 'OWNER',
                'department' => 'MANAGEMENT',
                'employment_status' => 'ACTIVE',
                'qr_token' => 'QR-5DE159B2BD',
                'phone' => '081234567890',
                'base_salary' => 8000000.00,
                'daily_allowance' => 75000.00,
                'hourly_overtime_rate' => 50000.00,
                'device_id' => null,
                'device_info' => null,
                'device_locked_at' => null,
            ]
        );

        Employee::updateOrCreate(
            ['employee_code' => 'EMP-002'],
            [
                'user_id' => $storeManager->id,
                'position' => 'MANAGER',
                'department' => 'OPERATIONAL',
                'employment_status' => 'ACTIVE',
                'qr_token' => 'QR-6CDBE86379',
                'phone' => '081234567891',
                'base_salary' => 6000000.00,
                'daily_allowance' => 60000.00,
                'hourly_overtime_rate' => 45000.00,
                'device_id' => null,
                'device_info' => null,
                'device_locked_at' => null,
            ]
        );

        Employee::updateOrCreate(
            ['employee_code' => 'EMP-003'],
            [
                'user_id' => $cashierUser->id,
                'position' => 'CASHIER',
                'department' => 'FRONT_OFFICE',
                'employment_status' => 'ACTIVE',
                'qr_token' => 'QR-18333599FB',
                'phone' => '081234567892',
                'base_salary' => 4500000.00,
                'daily_allowance' => 50000.00,
                'hourly_overtime_rate' => 30000.00,
                'device_id' => null,
                'device_info' => null,
                'device_locked_at' => null,
            ]
        );

        Employee::updateOrCreate(
            ['employee_code' => 'EMP-004'],
            [
                'user_id' => $baristaUser1->id,
                'position' => 'BARISTA',
                'department' => 'BAR',
                'employment_status' => 'ACTIVE',
                'qr_token' => 'QR-1CC1B8C45D',
                'phone' => '081234567893',
                'base_salary' => 4500000.00,
                'daily_allowance' => 50000.00,
                'hourly_overtime_rate' => 30000.00,
                'device_id' => null,
                'device_info' => null,
                'device_locked_at' => null,
            ]
        );

        Employee::updateOrCreate(
            ['employee_code' => 'EMP-005'],
            [
                'user_id' => $baristaUser2->id,
                'position' => 'BARISTA',
                'department' => 'BAR',
                'employment_status' => 'ACTIVE',
                'qr_token' => 'QR-2DD2C9D56E',
                'phone' => '081234567894',
                'base_salary' => 4200000.00,
                'daily_allowance' => 50000.00,
                'hourly_overtime_rate' => 30000.00,
                'device_id' => null,
                'device_info' => null,
                'device_locked_at' => null,
            ]
        );

        Employee::updateOrCreate(
            ['employee_code' => 'EMP-006'],
            [
                'user_id' => $baristaUser3->id,
                'position' => 'BARISTA',
                'department' => 'BAR',
                'employment_status' => 'ACTIVE',
                'qr_token' => 'QR-3EE3DAE67F',
                'phone' => '081234567895',
                'base_salary' => 4200000.00,
                'daily_allowance' => 50000.00,
                'hourly_overtime_rate' => 30000.00,
                'device_id' => null,
                'device_info' => null,
                'device_locked_at' => null,
            ]
        );

        Employee::updateOrCreate(
            ['employee_code' => 'EMP-007'],
            [
                'user_id' => $warehouseUser->id,
                'position' => 'ADMIN_GUDANG',
                'department' => 'LOGISTICS',
                'employment_status' => 'ACTIVE',
                'qr_token' => 'QR-4FF4EBF78A',
                'phone' => '081234567896',
                'base_salary' => 4500000.00,
                'daily_allowance' => 50000.00,
                'hourly_overtime_rate' => 30000.00,
                'device_id' => null,
                'device_info' => null,
                'device_locked_at' => null,
            ]
        );

        // ═══════════════════════════════════════════════════════════════
        // 4. CREATE CATEGORIES
        // ═══════════════════════════════════════════════════════════════
        $categories = [
            ['name' => 'Espresso', 'slug' => 'espresso', 'sort_order' => 1],
            ['name' => 'Manual Brew', 'slug' => 'manual-brew', 'sort_order' => 2],
            ['name' => 'Non-Coffee', 'slug' => 'non-coffee', 'sort_order' => 3],
            ['name' => 'Pastry', 'slug' => 'pastry', 'sort_order' => 4],
            ['name' => 'Main Course', 'slug' => 'main-course', 'sort_order' => 5],
            ['name' => 'Signature', 'slug' => 'signature', 'sort_order' => 6],
        ];

        foreach ($categories as $cat) {
            Category::updateOrCreate(['slug' => $cat['slug']], $cat);
        }

        // ═══════════════════════════════════════════════════════════════
        // 5. CREATE RAW MATERIALS
        // ═══════════════════════════════════════════════════════════════
        $rawMaterials = [
            ['name' => 'Biji Kopi Arabica Toraja', 'sku' => 'RM-COFFEE-001', 'unit' => 'gram', 'current_stock' => 50000, 'min_stock_alert' => 5000, 'avg_cost_per_unit' => 250],
            ['name' => 'Biji Kopi Robusta Lampung', 'sku' => 'RM-COFFEE-002', 'unit' => 'gram', 'current_stock' => 30000, 'min_stock_alert' => 3000, 'avg_cost_per_unit' => 150],
            ['name' => 'Susu Full Cream', 'sku' => 'RM-DAIRY-001', 'unit' => 'ml', 'current_stock' => 100000, 'min_stock_alert' => 10000, 'avg_cost_per_unit' => 20],
            ['name' => 'Susu Oat', 'sku' => 'RM-DAIRY-002', 'unit' => 'ml', 'current_stock' => 30000, 'min_stock_alert' => 5000, 'avg_cost_per_unit' => 45],
            ['name' => 'Gula Aren Cair', 'sku' => 'RM-SWEET-001', 'unit' => 'ml', 'current_stock' => 20000, 'min_stock_alert' => 3000, 'avg_cost_per_unit' => 35],
            ['name' => 'Sirup Vanilla', 'sku' => 'RM-SWEET-002', 'unit' => 'ml', 'current_stock' => 10000, 'min_stock_alert' => 2000, 'avg_cost_per_unit' => 80],
            ['name' => 'Sirup Caramel', 'sku' => 'RM-SWEET-003', 'unit' => 'ml', 'current_stock' => 10000, 'min_stock_alert' => 2000, 'avg_cost_per_unit' => 80],
            ['name' => 'Sirup Hazelnut', 'sku' => 'RM-SWEET-004', 'unit' => 'ml', 'current_stock' => 8000, 'min_stock_alert' => 2000, 'avg_cost_per_unit' => 90],
            ['name' => 'Cokelat Bubuk', 'sku' => 'RM-CHOCO-001', 'unit' => 'gram', 'current_stock' => 15000, 'min_stock_alert' => 2000, 'avg_cost_per_unit' => 120],
            ['name' => 'Matcha Powder', 'sku' => 'RM-TEA-001', 'unit' => 'gram', 'current_stock' => 5000, 'min_stock_alert' => 1000, 'avg_cost_per_unit' => 500],
            ['name' => 'Es Batu', 'sku' => 'RM-ICE-001', 'unit' => 'gram', 'current_stock' => 200000, 'min_stock_alert' => 20000, 'avg_cost_per_unit' => 5],
            ['name' => 'Cup Plastik 22oz', 'sku' => 'RM-CUP-001', 'unit' => 'pcs', 'current_stock' => 5000, 'min_stock_alert' => 500, 'avg_cost_per_unit' => 1500],
            ['name' => 'Cup Kertas 12oz (Hot)', 'sku' => 'RM-CUP-002', 'unit' => 'pcs', 'current_stock' => 3000, 'min_stock_alert' => 300, 'avg_cost_per_unit' => 2000],
            ['name' => 'Lid Cup Plastik', 'sku' => 'RM-CUP-003', 'unit' => 'pcs', 'current_stock' => 5000, 'min_stock_alert' => 500, 'avg_cost_per_unit' => 500],
            ['name' => 'Sedotan Paper', 'sku' => 'RM-CUP-004', 'unit' => 'pcs', 'current_stock' => 10000, 'min_stock_alert' => 1000, 'avg_cost_per_unit' => 300],
            ['name' => 'Whipped Cream', 'sku' => 'RM-TOP-001', 'unit' => 'ml', 'current_stock' => 15000, 'min_stock_alert' => 2000, 'avg_cost_per_unit' => 100],
            ['name' => 'Adonan Pastry Croissant (1kg = 10 pcs)', 'sku' => 'RM-PASTRY-001', 'unit' => 'gram', 'current_stock' => 20000, 'min_stock_alert' => 2000, 'avg_cost_per_unit' => 30],
            ['name' => 'Roti Tawar Toast', 'sku' => 'RM-PASTRY-002', 'unit' => 'gram', 'current_stock' => 10000, 'min_stock_alert' => 1000, 'avg_cost_per_unit' => 40],
            ['name' => 'Teh Earl Grey', 'sku' => 'RM-TEA-002', 'unit' => 'gram', 'current_stock' => 5000, 'min_stock_alert' => 500, 'avg_cost_per_unit' => 300],
            ['name' => 'Air Mineral Galon (19L = 95 Cup)', 'sku' => 'RM-WATER-001', 'unit' => 'ml', 'current_stock' => 190000, 'min_stock_alert' => 38000, 'avg_cost_per_unit' => 1],
        ];

        $rmModels = [];
        foreach ($rawMaterials as $rm) {
            $rmModels[$rm['sku']] = RawMaterial::firstOrCreate(['sku' => $rm['sku']], $rm);
        }

        // Create initial stock movements for each raw material
        foreach ($rmModels as $sku => $rm) {
            StockMovement::firstOrCreate(
                ['raw_material_id' => $rm->id, 'type' => 'IN_PURCHASE', 'reference_type' => 'initial_seed'],
                [
                    'qty' => $rm->current_stock,
                    'unit_cost' => $rm->avg_cost_per_unit,
                    'notes' => 'Initial stock seeding',
                ]
            );
        }

        // ═══════════════════════════════════════════════════════════════
        // 6. CREATE PRODUCTS
        // ═══════════════════════════════════════════════════════════════
        $espressoCategory = Category::where('slug', 'espresso')->first();
        $manualBrewCategory = Category::where('slug', 'manual-brew')->first();
        $nonCoffeeCategory = Category::where('slug', 'non-coffee')->first();
        $snackCategory = Category::where('slug', 'pastry')->first();
        $signatureCategory = Category::where('slug', 'signature')->first();

        $products = [
            // Espresso Based
            ['category_id' => $espressoCategory->id, 'name' => 'Espresso Single', 'sku' => 'PRD-ESP-001', 'base_price' => 18000],
            ['category_id' => $espressoCategory->id, 'name' => 'Espresso Double', 'sku' => 'PRD-ESP-002', 'base_price' => 25000],
            ['category_id' => $espressoCategory->id, 'name' => 'Americano (Iced/Hot)', 'sku' => 'PRD-ESP-003', 'base_price' => 22000],
            ['category_id' => $espressoCategory->id, 'name' => 'Cappuccino Silk', 'sku' => 'PRD-ESP-004', 'base_price' => 28000],
            ['category_id' => $espressoCategory->id, 'name' => 'Café Latte Creamy', 'sku' => 'PRD-ESP-005', 'base_price' => 30000],
            ['category_id' => $espressoCategory->id, 'name' => 'Flat White', 'sku' => 'PRD-ESP-006', 'base_price' => 32000],
            ['category_id' => $espressoCategory->id, 'name' => 'Mocha Latte', 'sku' => 'PRD-ESP-007', 'base_price' => 35000],
            ['category_id' => $espressoCategory->id, 'name' => 'Caramel Macchiato', 'sku' => 'PRD-ESP-008', 'base_price' => 38000],

            // Manual Brew
            ['category_id' => $manualBrewCategory->id, 'name' => 'V60 Toraja Arabica', 'sku' => 'PRD-MAN-001', 'base_price' => 35000],
            ['category_id' => $manualBrewCategory->id, 'name' => 'V60 Lampung Robusta', 'sku' => 'PRD-MAN-002', 'base_price' => 30000],
            ['category_id' => $manualBrewCategory->id, 'name' => 'French Press', 'sku' => 'PRD-MAN-003', 'base_price' => 32000],

            // Non-Coffee
            ['category_id' => $nonCoffeeCategory->id, 'name' => 'Matcha Uji Latte', 'sku' => 'PRD-NON-001', 'base_price' => 32000],
            ['category_id' => $nonCoffeeCategory->id, 'name' => 'Belgian Chocolate', 'sku' => 'PRD-NON-002', 'base_price' => 28000],
            ['category_id' => $nonCoffeeCategory->id, 'name' => 'Earl Grey Pure Tea', 'sku' => 'PRD-NON-003', 'base_price' => 22000],
            ['category_id' => $nonCoffeeCategory->id, 'name' => 'Fresh Orange Juice', 'sku' => 'PRD-NON-004', 'base_price' => 25000],

            // Snack & Pastry
            ['category_id' => $snackCategory->id, 'name' => 'Butter Croissant', 'sku' => 'PRD-SNK-001', 'base_price' => 25000],
            ['category_id' => $snackCategory->id, 'name' => 'Toast Roti Bakar', 'sku' => 'PRD-SNK-002', 'base_price' => 20000],

            // Signature Drinks
            ['category_id' => $signatureCategory->id, 'name' => 'Kopi Susu Gula Aren', 'sku' => 'PRD-SIG-001', 'base_price' => 28000],
            ['category_id' => $signatureCategory->id, 'name' => 'Dirty Matcha Latte', 'sku' => 'PRD-SIG-002', 'base_price' => 38000],
            ['category_id' => $signatureCategory->id, 'name' => 'Vanilla Affogato', 'sku' => 'PRD-SIG-003', 'base_price' => 35000],
        ];

        $prdModels = [];
        foreach ($products as $prd) {
            $prdModels[$prd['sku']] = Product::updateOrCreate(['sku' => $prd['sku']], $prd);
        }

        // ═══════════════════════════════════════════════════════════════
        // 7. CREATE RECIPES (product → raw material)
        // ═══════════════════════════════════════════════════════════════
        $recipes = [
            // Espresso Single: 18g kopi arabica, 1 cup kertas
            ['product_sku' => 'PRD-ESP-001', 'material_sku' => 'RM-COFFEE-001', 'qty_needed' => 18],
            ['product_sku' => 'PRD-ESP-001', 'material_sku' => 'RM-CUP-002', 'qty_needed' => 1],

            // Espresso Double
            ['product_sku' => 'PRD-ESP-002', 'material_sku' => 'RM-COFFEE-001', 'qty_needed' => 36],
            ['product_sku' => 'PRD-ESP-002', 'material_sku' => 'RM-CUP-002', 'qty_needed' => 1],

            // Americano: 18g kopi, 200ml air
            ['product_sku' => 'PRD-ESP-003', 'material_sku' => 'RM-COFFEE-001', 'qty_needed' => 18],
            ['product_sku' => 'PRD-ESP-003', 'material_sku' => 'RM-WATER-001', 'qty_needed' => 200],
            ['product_sku' => 'PRD-ESP-003', 'material_sku' => 'RM-CUP-002', 'qty_needed' => 1],

            // Cappuccino: 18g kopi, 150ml susu
            ['product_sku' => 'PRD-ESP-004', 'material_sku' => 'RM-COFFEE-001', 'qty_needed' => 18],
            ['product_sku' => 'PRD-ESP-004', 'material_sku' => 'RM-DAIRY-001', 'qty_needed' => 150],
            ['product_sku' => 'PRD-ESP-004', 'material_sku' => 'RM-CUP-002', 'qty_needed' => 1],

            // Café Latte: 18g kopi, 200ml susu
            ['product_sku' => 'PRD-ESP-005', 'material_sku' => 'RM-COFFEE-001', 'qty_needed' => 18],
            ['product_sku' => 'PRD-ESP-005', 'material_sku' => 'RM-DAIRY-001', 'qty_needed' => 200],
            ['product_sku' => 'PRD-ESP-005', 'material_sku' => 'RM-CUP-002', 'qty_needed' => 1],

            // Flat White: 36g kopi, 150ml susu
            ['product_sku' => 'PRD-ESP-006', 'material_sku' => 'RM-COFFEE-001', 'qty_needed' => 36],
            ['product_sku' => 'PRD-ESP-006', 'material_sku' => 'RM-DAIRY-001', 'qty_needed' => 150],
            ['product_sku' => 'PRD-ESP-006', 'material_sku' => 'RM-CUP-002', 'qty_needed' => 1],

            // Mocha Latte: 18g kopi, 200ml susu, 20g cokelat
            ['product_sku' => 'PRD-ESP-007', 'material_sku' => 'RM-COFFEE-001', 'qty_needed' => 18],
            ['product_sku' => 'PRD-ESP-007', 'material_sku' => 'RM-DAIRY-001', 'qty_needed' => 200],
            ['product_sku' => 'PRD-ESP-007', 'material_sku' => 'RM-CHOCO-001', 'qty_needed' => 20],
            ['product_sku' => 'PRD-ESP-007', 'material_sku' => 'RM-CUP-002', 'qty_needed' => 1],

            // Caramel Macchiato: 18g kopi, 200ml susu, 30ml sirup caramel
            ['product_sku' => 'PRD-ESP-008', 'material_sku' => 'RM-COFFEE-001', 'qty_needed' => 18],
            ['product_sku' => 'PRD-ESP-008', 'material_sku' => 'RM-DAIRY-001', 'qty_needed' => 200],
            ['product_sku' => 'PRD-ESP-008', 'material_sku' => 'RM-SWEET-003', 'qty_needed' => 30],
            ['product_sku' => 'PRD-ESP-008', 'material_sku' => 'RM-CUP-002', 'qty_needed' => 1],

            // V60 Toraja: 15g kopi arabica, 250ml air
            ['product_sku' => 'PRD-MAN-001', 'material_sku' => 'RM-COFFEE-001', 'qty_needed' => 15],
            ['product_sku' => 'PRD-MAN-001', 'material_sku' => 'RM-WATER-001', 'qty_needed' => 250],

            // V60 Lampung: 15g kopi robusta, 250ml air
            ['product_sku' => 'PRD-MAN-002', 'material_sku' => 'RM-COFFEE-002', 'qty_needed' => 15],
            ['product_sku' => 'PRD-MAN-002', 'material_sku' => 'RM-WATER-001', 'qty_needed' => 250],

            // French Press: 30g kopi arabica, 350ml air
            ['product_sku' => 'PRD-MAN-003', 'material_sku' => 'RM-COFFEE-001', 'qty_needed' => 30],
            ['product_sku' => 'PRD-MAN-003', 'material_sku' => 'RM-WATER-001', 'qty_needed' => 350],

            // Matcha Latte: 5g matcha, 200ml susu
            ['product_sku' => 'PRD-NON-001', 'material_sku' => 'RM-TEA-001', 'qty_needed' => 5],
            ['product_sku' => 'PRD-NON-001', 'material_sku' => 'RM-DAIRY-001', 'qty_needed' => 200],
            ['product_sku' => 'PRD-NON-001', 'material_sku' => 'RM-CUP-002', 'qty_needed' => 1],

            // Chocolate: 25g cokelat, 200ml susu
            ['product_sku' => 'PRD-NON-002', 'material_sku' => 'RM-CHOCO-001', 'qty_needed' => 25],
            ['product_sku' => 'PRD-NON-002', 'material_sku' => 'RM-DAIRY-001', 'qty_needed' => 200],
            ['product_sku' => 'PRD-NON-002', 'material_sku' => 'RM-CUP-002', 'qty_needed' => 1],

            // Earl Grey Tea: 5g teh, 250ml air
            ['product_sku' => 'PRD-NON-003', 'material_sku' => 'RM-TEA-002', 'qty_needed' => 5],
            ['product_sku' => 'PRD-NON-003', 'material_sku' => 'RM-WATER-001', 'qty_needed' => 250],
            ['product_sku' => 'PRD-NON-003', 'material_sku' => 'RM-CUP-002', 'qty_needed' => 1],

            // Butter Croissant: 1 kg adonan menghasilkan 10 pcs -> butuh 100 gram per pcs
            ['product_sku' => 'PRD-SNK-001', 'material_sku' => 'RM-PASTRY-001', 'qty_needed' => 100],

            // Toast Roti Bakar: 80 gram roti tawar (2 lembar)
            ['product_sku' => 'PRD-SNK-002', 'material_sku' => 'RM-PASTRY-002', 'qty_needed' => 80],

            // Es Kopi Susu Gula Aren: 18g kopi, 200ml susu, 30ml gula aren, es batu
            ['product_sku' => 'PRD-SIG-001', 'material_sku' => 'RM-COFFEE-001', 'qty_needed' => 18],
            ['product_sku' => 'PRD-SIG-001', 'material_sku' => 'RM-DAIRY-001', 'qty_needed' => 200],
            ['product_sku' => 'PRD-SIG-001', 'material_sku' => 'RM-SWEET-001', 'qty_needed' => 30],
            ['product_sku' => 'PRD-SIG-001', 'material_sku' => 'RM-ICE-001', 'qty_needed' => 150],
            ['product_sku' => 'PRD-SIG-001', 'material_sku' => 'RM-CUP-001', 'qty_needed' => 1],
            ['product_sku' => 'PRD-SIG-001', 'material_sku' => 'RM-CUP-003', 'qty_needed' => 1],
            ['product_sku' => 'PRD-SIG-001', 'material_sku' => 'RM-CUP-004', 'qty_needed' => 1],

            // Dirty Matcha: 18g kopi, 5g matcha, 200ml susu, es batu
            ['product_sku' => 'PRD-SIG-002', 'material_sku' => 'RM-COFFEE-001', 'qty_needed' => 18],
            ['product_sku' => 'PRD-SIG-002', 'material_sku' => 'RM-TEA-001', 'qty_needed' => 5],
            ['product_sku' => 'PRD-SIG-002', 'material_sku' => 'RM-DAIRY-001', 'qty_needed' => 200],
            ['product_sku' => 'PRD-SIG-002', 'material_sku' => 'RM-ICE-001', 'qty_needed' => 150],
            ['product_sku' => 'PRD-SIG-002', 'material_sku' => 'RM-CUP-001', 'qty_needed' => 1],

            // Vanilla Affogato: 36g kopi, 30ml sirup vanilla, whipped cream
            ['product_sku' => 'PRD-SIG-003', 'material_sku' => 'RM-COFFEE-001', 'qty_needed' => 36],
            ['product_sku' => 'PRD-SIG-003', 'material_sku' => 'RM-SWEET-002', 'qty_needed' => 30],
            ['product_sku' => 'PRD-SIG-003', 'material_sku' => 'RM-TOP-001', 'qty_needed' => 50],
        ];

        foreach ($recipes as $recipe) {
            $product = $prdModels[$recipe['product_sku']];
            $material = $rmModels[$recipe['material_sku']];

            Recipe::firstOrCreate(
                ['product_id' => $product->id, 'raw_material_id' => $material->id],
                ['qty_needed' => $recipe['qty_needed']]
            );
        }

        // ═══════════════════════════════════════════════════════════════
        // 8. CREATE MODIFIER GROUPS & MODIFIERS
        // ═══════════════════════════════════════════════════════════════

        // Sugar Level
        $sugarGroup = ModifierGroup::firstOrCreate(
            ['name' => 'Sugar Level'],
            ['is_required' => true, 'min_select' => 1, 'max_select' => 1]
        );

        $sugarModifiers = [
            ['name' => 'Normal Sugar', 'additional_price' => 0],
            ['name' => 'Less Sugar', 'additional_price' => 0],
            ['name' => 'No Sugar', 'additional_price' => 0],
            ['name' => 'Extra Sugar', 'additional_price' => 0],
        ];
        foreach ($sugarModifiers as $mod) {
            Modifier::firstOrCreate(
                ['modifier_group_id' => $sugarGroup->id, 'name' => $mod['name']],
                $mod
            );
        }

        // Ice Level
        $iceGroup = ModifierGroup::firstOrCreate(
            ['name' => 'Ice Level'],
            ['is_required' => true, 'min_select' => 1, 'max_select' => 1]
        );

        $iceModifiers = [
            ['name' => 'Normal Ice', 'additional_price' => 0],
            ['name' => 'Less Ice', 'additional_price' => 0],
            ['name' => 'No Ice', 'additional_price' => 0],
            ['name' => 'Extra Ice', 'additional_price' => 0],
        ];
        foreach ($iceModifiers as $mod) {
            Modifier::firstOrCreate(
                ['modifier_group_id' => $iceGroup->id, 'name' => $mod['name']],
                $mod
            );
        }

        // Milk Option
        $milkGroup = ModifierGroup::firstOrCreate(
            ['name' => 'Milk Option'],
            ['is_required' => false, 'min_select' => 0, 'max_select' => 1]
        );

        $milkModifiers = [
            ['name' => 'Regular Milk (Full Cream)', 'additional_price' => 0, 'raw_material_id' => $rmModels['RM-DAIRY-001']->id, 'qty_used' => 200],
            ['name' => 'Oat Milk', 'additional_price' => 8000, 'raw_material_id' => $rmModels['RM-DAIRY-002']->id, 'qty_used' => 200],
        ];
        foreach ($milkModifiers as $mod) {
            Modifier::firstOrCreate(
                ['modifier_group_id' => $milkGroup->id, 'name' => $mod['name']],
                $mod
            );
        }

        // Extra Shot
        $shotGroup = ModifierGroup::firstOrCreate(
            ['name' => 'Extra Shot'],
            ['is_required' => false, 'min_select' => 0, 'max_select' => 3]
        );

        Modifier::firstOrCreate(
            ['modifier_group_id' => $shotGroup->id, 'name' => 'Extra Shot Espresso'],
            ['additional_price' => 8000, 'raw_material_id' => $rmModels['RM-COFFEE-001']->id, 'qty_used' => 18]
        );

        // Syrup Add-On
        $syrupGroup = ModifierGroup::firstOrCreate(
            ['name' => 'Syrup Add-On'],
            ['is_required' => false, 'min_select' => 0, 'max_select' => 3]
        );

        $syrupModifiers = [
            ['name' => 'Add Vanilla Syrup', 'additional_price' => 5000, 'raw_material_id' => $rmModels['RM-SWEET-002']->id, 'qty_used' => 15],
            ['name' => 'Add Caramel Syrup', 'additional_price' => 5000, 'raw_material_id' => $rmModels['RM-SWEET-003']->id, 'qty_used' => 15],
            ['name' => 'Add Hazelnut Syrup', 'additional_price' => 5000, 'raw_material_id' => $rmModels['RM-SWEET-004']->id, 'qty_used' => 15],
            ['name' => 'Add Gula Aren', 'additional_price' => 3000, 'raw_material_id' => $rmModels['RM-SWEET-001']->id, 'qty_used' => 20],
        ];
        foreach ($syrupModifiers as $mod) {
            Modifier::firstOrCreate(
                ['modifier_group_id' => $syrupGroup->id, 'name' => $mod['name']],
                $mod
            );
        }

        // Topping
        $toppingGroup = ModifierGroup::firstOrCreate(
            ['name' => 'Topping'],
            ['is_required' => false, 'min_select' => 0, 'max_select' => 3]
        );

        Modifier::firstOrCreate(
            ['modifier_group_id' => $toppingGroup->id, 'name' => 'Add Whipped Cream'],
            ['additional_price' => 5000, 'raw_material_id' => $rmModels['RM-TOP-001']->id, 'qty_used' => 30]
        );

        // Attach modifier groups to espresso-based & signature products
        $espressoProducts = Product::whereIn('sku', [
            'PRD-ESP-001', 'PRD-ESP-002', 'PRD-ESP-003', 'PRD-ESP-004',
            'PRD-ESP-005', 'PRD-ESP-006', 'PRD-ESP-007', 'PRD-ESP-008',
            'PRD-SIG-001', 'PRD-SIG-002', 'PRD-SIG-003',
        ])->get();

        foreach ($espressoProducts as $product) {
            $product->modifierGroups()->syncWithoutDetaching([
                $sugarGroup->id,
                $shotGroup->id,
                $syrupGroup->id,
                $toppingGroup->id,
            ]);
        }

        // Attach ice level to iced drinks
        $icedProducts = Product::whereIn('sku', [
            'PRD-ESP-003', 'PRD-ESP-005', 'PRD-ESP-007', 'PRD-ESP-008',
            'PRD-SIG-001', 'PRD-SIG-002',
            'PRD-NON-001', 'PRD-NON-002', 'PRD-NON-004',
        ])->get();

        foreach ($icedProducts as $product) {
            $product->modifierGroups()->syncWithoutDetaching([$iceGroup->id]);
        }

        // Attach milk option to latte-based drinks
        $latteProducts = Product::whereIn('sku', [
            'PRD-ESP-004', 'PRD-ESP-005', 'PRD-ESP-006', 'PRD-ESP-007',
            'PRD-ESP-008', 'PRD-SIG-001', 'PRD-SIG-002',
            'PRD-NON-001', 'PRD-NON-002',
        ])->get();

        foreach ($latteProducts as $product) {
            $product->modifierGroups()->syncWithoutDetaching([$milkGroup->id]);
        }

        // ═══════════════════════════════════════════════════════════════
        // 9. CREATE DINING TABLES (QR Table Ordering)
        // ═══════════════════════════════════════════════════════════════
        $tables = [
            ['table_number' => 'TB-01', 'capacity' => 2, 'status' => 'AVAILABLE'],
            ['table_number' => 'TB-02', 'capacity' => 2, 'status' => 'AVAILABLE'],
            ['table_number' => 'TB-03', 'capacity' => 4, 'status' => 'AVAILABLE'],
            ['table_number' => 'TB-04', 'capacity' => 4, 'status' => 'AVAILABLE'],
            ['table_number' => 'TB-05', 'capacity' => 6, 'status' => 'AVAILABLE'],
        ];

        foreach ($tables as $table) {
            DiningTable::firstOrCreate(
                ['table_number' => $table['table_number']],
                array_merge($table, [
                    'qr_token' => Str::uuid()->toString(),
                ])
            );
        }

        // ═══════════════════════════════════════════════════════════════
        // 10. SEED CHART OF ACCOUNTS (Accounting & Double-Entry)
        // ═══════════════════════════════════════════════════════════════
        $this->call(ChartOfAccountsSeeder::class);

        $this->command->info('');
        $this->command->info('╔══════════════════════════════════════════════════════════════╗');
        $this->command->info('║   ☕ CoffeeShop ESB System — Database Seeded Successfully   ║');
        $this->command->info('╠══════════════════════════════════════════════════════════════╣');
        $this->command->info('║  Roles    : super_admin, store_manager, cashier, barista     ║');
        $this->command->info('║  Users    : 4 default accounts (password: "password")        ║');
        $this->command->info('║  Category : ' . Category::count() . ' categories                                    ║');
        $this->command->info('║  Materials: ' . RawMaterial::count() . ' raw materials                                 ║');
        $this->command->info('║  Products : ' . Product::count() . ' products                                      ║');
        $this->command->info('║  Recipes  : ' . Recipe::count() . ' recipe entries                                ║');
        $this->command->info('║  Modifiers: ' . Modifier::count() . ' modifiers in ' . ModifierGroup::count() . ' groups                       ║');
        $this->command->info('║  Tables   : ' . DiningTable::count() . ' dining tables with QR tokens                ║');
        $this->command->info('╚══════════════════════════════════════════════════════════════╝');
        $this->command->info('');
        $this->command->info('Default Login Credentials:');
        $this->command->info('  admin@coffeeshop.test    / password (super_admin - Owner)');
        $this->command->info('  manager@coffeeshop.test  / password (store_manager - 1 Manager)');
        $this->command->info('  cashier@coffeeshop.test  / password (cashier - 1 Kasir)');
        $this->command->info('  barista@coffeeshop.test  / password (barista - Barista 1 Utama)');
        $this->command->info('  barista2@coffeeshop.test / password (barista - Barista 2 Espresso)');
        $this->command->info('  barista3@coffeeshop.test / password (barista - Barista 3 Manual Brew)');
        $this->command->info('');
    }
}
