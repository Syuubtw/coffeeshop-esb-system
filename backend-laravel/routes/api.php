<?php

use App\Http\Controllers\Api\AccountingController;
use App\Http\Controllers\Api\AuditController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\HrPayrollController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\KdsController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PosController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\PurchaseOrderController;
use App\Http\Controllers\Api\QrOrderController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Coffee Shop ERP & POS (ESB / Mie Gacoan Style)
|--------------------------------------------------------------------------
| Role Permissions:
|   super_admin    → Owner, full access to all endpoints
|   store_manager  → Back Office, inventory, attendance, audit read
|   cashier        → POS, payment confirmation, attendance
|   barista        → KDS kitchen display, attendance
|--------------------------------------------------------------------------
*/

// ==========================================
// 1. PUBLIC & AUTHENTICATION ENDPOINTS
// ==========================================
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/status', [AuthController::class, 'checkStatus']);
});

// ==========================================
// 2. CUSTOMER SELF-SERVICE QR TABLE ORDERING
// (Public / Token Protected - Mie Gacoan Style)
// ==========================================
Route::prefix('qr')->group(function () {
    Route::get('/table/{token}', [QrOrderController::class, 'verifyTable']);
    Route::post('/order', [QrOrderController::class, 'placeOrder']);
    Route::get('/order/{orderNumber}/status', [QrOrderController::class, 'checkStatus']);
});

// ==========================================
// 3. MIDTRANS PAYMENT GATEWAY (SANDBOX 100% FREE)
// ==========================================
Route::prefix('payment')->group(function () {
    Route::post('/midtrans/snap/{orderId}', [PaymentController::class, 'createSnapToken']);
    Route::post('/midtrans/callback', [PaymentController::class, 'handleCallback']);
    Route::post('/midtrans/simulate/{orderId}', [PaymentController::class, 'simulatePaymentSuccess']);
});

// ==========================================
// 3.5. PUBLIC EMPLOYEE QR ATTENDANCE (SCAN VIA HP SENDIRI)
// ==========================================
Route::prefix('hr')->group(function () {
    Route::get('/public-employees', [HrPayrollController::class, 'getPublicEmployees']);
    Route::post('/qr-attendance', [HrPayrollController::class, 'qrAttendance']);
    Route::post('/public-attendance', [HrPayrollController::class, 'publicAttendance']);
});

// ==========================================
// 4. AUTHENTICATED STAFF ROUTES (SANCTUM)
// ==========================================
Route::middleware('auth:sanctum')->group(function () {

    // Profile & Logout (semua role)
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // ── POS (Cashier, Store Manager, Owner) ──
    Route::prefix('pos')->middleware('role:cashier,store_manager,super_admin')->group(function () {
        Route::post('/shift/open', [PosController::class, 'openShift']);
        Route::post('/shift/close', [PosController::class, 'closeShift']);
        Route::post('/orders', [PosController::class, 'storeOrder']);
        Route::get('/orders/recent', [PosController::class, 'recentOrders']);
        Route::patch('/orders/{orderId}/pay', [PosController::class, 'confirmPayment']);
        Route::patch('/orders/{orderId}/status', [PosController::class, 'updateOrderStatus']);
    });

    // ── KDS (Barista, Store Manager, Owner) ──
    Route::prefix('kds')->middleware('role:barista,store_manager,super_admin')->group(function () {
        Route::get('/queue', [KdsController::class, 'queue']);
        Route::patch('/orders/{orderId}/status', [KdsController::class, 'updateStatus']);
        Route::patch('/products/{productId}/daily-availability', [KdsController::class, 'toggleProductDaily']);
    });

    // ── INVENTORY & RAW MATERIALS (Admin Gudang, Store Manager, Owner) ──
    Route::prefix('inventory')->middleware('role:warehouse_admin,store_manager,super_admin')->group(function () {
        Route::get('/materials', [InventoryController::class, 'index']);
        Route::post('/stock-in', [InventoryController::class, 'stockIn']);
        Route::post('/adjustment', [InventoryController::class, 'stockAdjustment']);
        Route::post('/waste', [InventoryController::class, 'reportWaste']);
        Route::patch('/waste/{wasteId}/approve', [InventoryController::class, 'approveWaste']);
        Route::get('/movements', [InventoryController::class, 'movements']);
        Route::get('/stock-card/{materialId}', [InventoryController::class, 'stockCard']);
        Route::get('/stock-card-summary', [InventoryController::class, 'stockCardSummary']);
    });

    // ── HR & ATTENDANCE (Semua role bisa presensi diri sendiri) ──
    Route::prefix('hr')->group(function () {
        // Self-attendance — semua role yang sudah login
        Route::get('/my-status', [HrPayrollController::class, 'getMyAttendanceStatus']);
        Route::post('/scan-outlet-qr', [HrPayrollController::class, 'scanOutletQr']);
        Route::post('/clock-in', [HrPayrollController::class, 'clockIn']);
        Route::post('/clock-out', [HrPayrollController::class, 'clockOut']);
        Route::post('/qr-attendance', [HrPayrollController::class, 'qrAttendance']);

        // Manager / Owner — lihat & kelola presensi seluruh karyawan
        Route::middleware('role:store_manager,super_admin')->group(function () {
            Route::get('/attendance/realtime', [HrPayrollController::class, 'getLiveAttendance']);
            Route::get('/attendance/live', [HrPayrollController::class, 'getLiveAttendance']);
            Route::get('/attendance/monthly', [HrPayrollController::class, 'getMonthlyAttendance']);
            Route::post('/attendance/toggle', [HrPayrollController::class, 'toggleAttendance']);
            Route::post('/attendance/clock', [HrPayrollController::class, 'toggleAttendance']);
            Route::post('/attendance/reset-device/{employeeId}', [HrPayrollController::class, 'resetDeviceLock']);
            Route::post('/employees/{employeeId}/reset-device', [HrPayrollController::class, 'resetDeviceLock']);
        });
    });

    // ── DASHBOARD & ANALYTICS (Store Manager, Owner) ──
    Route::prefix('dashboard')->middleware('role:store_manager,super_admin')->group(function () {
        Route::get('/stats', [DashboardController::class, 'stats']);
    });

    // ── MENU & BOM RECIPE MANAGEMENT ──
    Route::prefix('menu')->group(function () {
        // Read Menu & Categories (Kasir POS, Barista KDS, Store Manager & Owner)
        Route::get('/products', [ProductController::class, 'index']);
        Route::get('/categories', [ProductController::class, 'categories']);

        // Mutations / CRUD (Store Manager & Owner ONLY)
        Route::middleware('role:store_manager,super_admin')->group(function () {
            Route::post('/products', [ProductController::class, 'store']);
            Route::put('/products/{id}', [ProductController::class, 'update']);
            Route::patch('/products/{id}/toggle-daily', [ProductController::class, 'toggleDaily']);
        });
    });

    // ── ACCOUNTING & GENERAL LEDGER (Owner ONLY) ──
    Route::prefix('accounting')->middleware('role:super_admin')->group(function () {
        Route::get('/coa', [AccountingController::class, 'getChartOfAccounts']);
        Route::get('/journals', [AccountingController::class, 'getJournalEntries']);
        Route::get('/profit-loss', [AccountingController::class, 'getProfitLoss']);
        Route::get('/balance-sheet', [AccountingController::class, 'getBalanceSheet']);
        Route::get('/trial-balance', [AccountingController::class, 'getTrialBalance']);
        Route::post('/journals', [AccountingController::class, 'storeManualJournal']);
    });

    // ── PENGADAAN & PURCHASE ORDERS (Procurement / PO) ──
    Route::prefix('procurement')->group(function () {
        Route::middleware('role:warehouse_admin,store_manager,super_admin')->group(function () {
            Route::get('/suppliers', [PurchaseOrderController::class, 'getSuppliers']);
            Route::get('/orders', [PurchaseOrderController::class, 'getOrders']);
            Route::post('/orders', [PurchaseOrderController::class, 'store']);
            Route::post('/orders/{id}/receive', [PurchaseOrderController::class, 'receive']);
        });

        Route::middleware('role:store_manager,super_admin')->group(function () {
            Route::patch('/orders/{id}/approve', [PurchaseOrderController::class, 'approve']);
            Route::patch('/orders/{id}/reject', [PurchaseOrderController::class, 'reject']);
        });
    });

    // ── AUDIT & ANTI-FRAUD ──
    Route::prefix('audit')->middleware('role:warehouse_admin,store_manager,super_admin')->group(function () {
        Route::get('/stock-opnames', [AuditController::class, 'getStockOpnames']);
        Route::post('/stock-opnames', [AuditController::class, 'storeStockOpname']);
    });

    Route::prefix('audit')->middleware('role:store_manager,super_admin')->group(function () {
        Route::get('/logs', [AuditController::class, 'getAuditLogs']);
        Route::patch('/stock-opnames/{id}/approve', [AuditController::class, 'approveStockOpname']);
        Route::get('/cash-reconciliation', [AuditController::class, 'getCashDrawerReconciliation']);
        Route::get('/void-orders', [AuditController::class, 'getVoidAudit']);
    });
});
