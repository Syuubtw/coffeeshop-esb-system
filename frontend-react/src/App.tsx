import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CustomerOrder } from './components/CustomerOrder';
import { LoginPage } from './components/LoginPage';
import { CashierPos } from './components/CashierPos';
import { BaristaKds } from './components/BaristaKds';
import { OwnerDashboard } from './components/OwnerDashboard';
import { ManagerDashboard } from './components/ManagerDashboard';
import { WarehouseDashboard } from './components/WarehouseDashboard';
import { AttendanceKiosk } from './components/AttendanceKiosk';
import { OutletQrPoster } from './components/OutletQrPoster';
import { StaffMobileAttendance } from './components/StaffMobileAttendance';
import { ProtectedRoute } from './components/ProtectedRoute';
import { StaffLayout } from './components/StaffLayout';

/**
 * Role-Based Route Access Matrix (Strict Dedicated Station):
 * ─────────────────────────────────────────────────────────────
 * Route         │ Component            │ Hak Akses Role
 * ─────────────────────────────────────────────────────────────
 * /admin        │ OwnerDashboard       │ super_admin (Owner)
 * /manager      │ ManagerDashboard     │ store_manager, super_admin
 * /warehouse    │ WarehouseDashboard   │ warehouse_admin, store_manager, super_admin
 * /pos          │ CashierPos           │ cashier
 * /kds          │ BaristaKds           │ barista
 * /attendance   │ AttendanceKiosk      │ store_manager, super_admin
 * /presensi     │ StaffMobileAttendance│ Publik HP Karyawan
 * /absen        │ OutletQrPoster       │ Publik Poster QR Toko
 * /order/table  │ CustomerOrder        │ Publik Pelanggan Meja
 * ─────────────────────────────────────────────────────────────
 */

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ======================================================== */}
        {/* 1. PUBLIC ROUTE: PELANGGAN SCAN QR MEJA (TANPA LOGIN)     */}
        {/* ======================================================== */}
        <Route path="/order/table/:tableId" element={<CustomerOrder />} />
        <Route path="/order" element={<Navigate to="/order/table/TB-01" replace />} />

        {/* ======================================================== */}
        {/* 1.5. PUBLIC ROUTES: QR DISPLAY TOKO & PRESENSI HP STAF   */}
        {/* ======================================================== */}
        {/* Poster QR Outlet yang dipajang di kasir/dinding */}
        <Route path="/absen" element={<OutletQrPoster />} />
        <Route path="/scan" element={<OutletQrPoster />} />
        <Route path="/qr-outlet" element={<OutletQrPoster />} />

        {/* Halaman Web Chrome di HP Karyawan setelah scan QR */}
        <Route path="/presensi" element={<StaffMobileAttendance />} />
        <Route path="/presensi-staff" element={<StaffMobileAttendance />} />

        {/* ======================================================== */}
        {/* 2. STAFF AUTHENTICATION (LOGIN)                          */}
        {/* ======================================================== */}
        <Route path="/login" element={<LoginPage />} />

        {/* ======================================================== */}
        {/* 3. PROTECTED ROUTES — ROLE-BASED ACCESS                  */}
        {/* ======================================================== */}

        {/* POS Kasir — Khusus Kasir (1 Peran = 1 Stasiun) */}
        <Route
          path="/pos"
          element={
            <ProtectedRoute allowedRoles={['cashier']}>
              <StaffLayout>
                <CashierPos />
              </StaffLayout>
            </ProtectedRoute>
          }
        />

        {/* KDS Dapur — Khusus Barista (1 Peran = 1 Stasiun) */}
        <Route
          path="/kds"
          element={
            <ProtectedRoute allowedRoles={['barista']}>
              <StaffLayout>
                <BaristaKds />
              </StaffLayout>
            </ProtectedRoute>
          }
        />

        {/* Store Manager Back Office — Store Manager & Owner Master View */}
        <Route
          path="/manager"
          element={
            <ProtectedRoute allowedRoles={['store_manager', 'super_admin']}>
              <StaffLayout>
                <ManagerDashboard />
              </StaffLayout>
            </ProtectedRoute>
          }
        />

        {/* Admin Gudang & Logistik — Warehouse Admin, Store Manager, Owner */}
        <Route
          path="/warehouse"
          element={
            <ProtectedRoute allowedRoles={['warehouse_admin', 'store_manager', 'super_admin']}>
              <StaffLayout>
                <WarehouseDashboard />
              </StaffLayout>
            </ProtectedRoute>
          }
        />

        {/* Owner Executive Dashboard — Owner ONLY */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <StaffLayout>
                <OwnerDashboard />
              </StaffLayout>
            </ProtectedRoute>
          }
        />

        {/* Presensi QR Kiosk — KHUSUS Store Manager & Owner */}
        <Route
          path="/attendance"
          element={
            <ProtectedRoute allowedRoles={['store_manager', 'super_admin']}>
              <StaffLayout>
                <AttendanceKiosk />
              </StaffLayout>
            </ProtectedRoute>
          }
        />

        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/order/table/TB-01" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
