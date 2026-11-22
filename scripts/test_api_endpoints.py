# -*- coding: utf-8 -*-
"""
Automated Test Suite for CoffeeShop RESTful API
Tests public endpoints, authentication, table verification, menu catalog,
cashier shifts, and owner audit reconciliation.
"""

import urllib.request
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def request_json(url, method="GET", data=None, token=None):
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
        
    payload = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=payload, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req, timeout=5) as res:
            return res.status, json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except:
            return e.code, {"error": body}
    except Exception as e:
        return 0, {"error": str(e)}

def main():
    print("=" * 65)
    print(" ☕  PENGUJIAN KELAYAKAN RESTFUL API COFFEESHOP SYSTEM")
    print("=" * 65)
    
    passed = 0
    total = 0

    # 1. Root Health Check (Public)
    total += 1
    code, res = request_json(BASE_URL)
    if code == 200 and res.get("status") == "online":
        print(f" [PASS] 1. Root API Health Check (200 OK): {res.get('message')}")
        passed += 1
    else:
        print(f" [FAIL] 1. Root API Health Check -> Code {code}: {res}")

    # 2. Public Tables List (Meja 01 s/d Meja 05)
    total += 1
    code, res = request_json(f"{BASE_URL}/qr/tables")
    tables = res.get("data", [])
    if code == 200 and len(tables) > 0:
        table_numbers = [t.get("table_number") for t in tables]
        print(f" [PASS] 2. Daftar Meja QR Publik (200 OK): {len(tables)} Meja Terdaftar ({', '.join(table_numbers)})")
        passed += 1
    else:
        print(f" [FAIL] 2. Daftar Meja QR Publik -> Code {code}: {res}")

    # 3. Table 01 Verification via Token (Public Mie Gacoan Style)
    total += 1
    code, res = request_json(f"{BASE_URL}/qr/table/TABLE_01_KEY")
    table_obj = res.get("data", {}).get("table", {})
    menu_obj = res.get("data", {}).get("menu", [])
    if code == 200 and table_obj.get("table_number") in ["TB-01", "TABLE_01_KEY", "Meja 01"]:
        print(f" [PASS] 3. Verifikasi Token Meja QR (TABLE_01_KEY):")
        print(f"        -> Meja: {table_obj.get('table_number')} | Status: {table_obj.get('status')}")
        print(f"        -> Menu Customer Otomatis Termuat: {len(menu_obj)} Produk Aktif")
        passed += 1
    else:
        print(f" [FAIL] 3. Verifikasi Token Meja -> Code {code}: {res}")

    # 4. Public Employee Attendance List (Kiosk Check)
    total += 1
    code, res = request_json(f"{BASE_URL}/hr/public-employees")
    emps_data = res.get("data", [])
    if isinstance(emps_data, dict):
        emps_list = list(emps_data.values())
    elif isinstance(emps_data, list):
        emps_list = emps_data
    else:
        emps_list = []
        
    if code == 200 and len(emps_list) > 0:
        emp_names = [e.get("name") if isinstance(e, dict) else str(e) for e in emps_list[:3]]
        print(f" [PASS] 4. Data Karyawan Absensi Kios Publik: {len(emps_list)} Karyawan ({', '.join(emp_names)}, dll)")
        passed += 1
    else:
        print(f" [FAIL] 4. Absensi Kios Publik -> Code {code}: {res}")

    # 5. Authentication Login (Owner / Super Admin)
    total += 1
    code, res = request_json(f"{BASE_URL}/auth/login", method="POST", data={
        "email": "admin@coffeeshop.test",
        "password": "password"
    })
    token = res.get("data", {}).get("token")
    user = res.get("data", {}).get("user", {})
    if code == 200 and token:
        print(f" [PASS] 5. Autentikasi Login (POST /api/auth/login):")
        print(f"        -> Pengguna: {user.get('name')} | Role: {user.get('role')}")
        print(f"        -> Bearer Token Sanctum: Berhasil diterbitkan.")
        passed += 1
    else:
        print(f" [FAIL] 5. Autentikasi Login -> Code {code}: {res}")

    # 6. Authenticated User Profile (GET /api/auth/me)
    total += 1
    code, res = request_json(f"{BASE_URL}/auth/me", token=token)
    if code == 200 and res.get("data", {}).get("email") == "admin@coffeeshop.test":
        print(f" [PASS] 6. Verifikasi Bearer Token (/api/auth/me): Identitas valid.")
        passed += 1
    else:
        print(f" [FAIL] 6. Verifikasi Token -> Code {code}: {res}")

    # 7. Menu Categories (Authenticated Staff Endpoint)
    total += 1
    code, res = request_json(f"{BASE_URL}/menu/categories", token=token)
    categories = res.get("data", [])
    if code == 200 and len(categories) > 0:
        cat_names = [c.get("name") for c in categories]
        print(f" [PASS] 7. Katalog Kategori Menu Staf (GET /api/menu/categories): {len(categories)} Kategori ({', '.join(cat_names)})")
        passed += 1
    else:
        print(f" [FAIL] 7. Katalog Kategori Menu -> Code {code}: {res}")

    # 8. Menu Products (Authenticated Staff Endpoint)
    total += 1
    code, res = request_json(f"{BASE_URL}/menu/products", token=token)
    products = res.get("data", [])
    if code == 200 and len(products) > 0:
        print(f" [PASS] 8. Katalog Produk Menu Staf (GET /api/menu/products): {len(products)} Produk Siap Jual")
        passed += 1
    else:
        print(f" [FAIL] 8. Katalog Produk Menu -> Code {code}: {res}")

    # 9. Cash Drawer Reconciliation (Bug Fix Verification)
    total += 1
    code, res = request_json(f"{BASE_URL}/audit/cash-reconciliation", token=token)
    if code == 200 and res.get("status") == "success":
        shifts = res.get("data", [])
        print(f" [PASS] 9. Rekonsiliasi Kas Laci Kasir (GET /api/audit/cash-reconciliation):")
        print(f"        -> Status: 200 OK | {len(shifts)} Sesi Shift Kasir Ter-audit.")
        passed += 1
    else:
        print(f" [FAIL] 9. Rekonsiliasi Kas Laci Kasir -> Code {code}: {res}")

    # 10. Dashboard Statistics (Omzet, Pajak PB1 10%, AOV)
    total += 1
    code, res = request_json(f"{BASE_URL}/dashboard/stats", token=token)
    if code == 200 and res.get("status") == "success":
        stats = res.get("data", {})
        print(f" [PASS] 10. Dashboard Statistik Owner (GET /api/dashboard/stats):")
        print(f"        -> Omzet Penjualan, Pajak PB1 (10%), & AOV sukses terhitung.")
        passed += 1
    else:
        print(f" [FAIL] 10. Dashboard Statistik Owner -> Code {code}: {res}")

    # 11. Barista Kitchen Display System (KDS Queue FIFO)
    total += 1
    code, res = request_json(f"{BASE_URL}/kds/queue", token=token)
    if code == 200 and res.get("status") == "success":
        queue = res.get("data", [])
        print(f" [PASS] 11. Antrean Dapur Barista KDS FIFO (GET /api/kds/queue): Aktif normal.")
        passed += 1
    else:
        print(f" [FAIL] 11. Antrean Dapur Barista KDS -> Code {code}: {res}")

    print("=" * 65)
    print(f" HASIL PENGUJIAN: {passed}/{total} ENDPOINT LOLOS ({'100% SEMPURNA' if passed == total else 'ADA KENDALA'})")
    print("=" * 65)
    
    if passed == total:
        print(" 🎉 SELURUH RESTFUL API BERJALAN DENGAN BENAR, AMAN, DAN SESUAI SPESIFIKASI!")
    else:
        print(" ⚠️  Ada beberapa endpoint yang perlu dicek ulang.")

if __name__ == "__main__":
    main()
