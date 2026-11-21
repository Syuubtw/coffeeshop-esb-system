<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\PayrollPeriod;
use App\Models\Payslip;
use App\Models\PayslipItem;
use App\Models\User;
use App\Models\WorkSchedule;
use App\Services\AuditService;
use Carbon\Carbon;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

#[Group(
    name: '10. HR & Presensi (Absensi Karyawan & Kiosk)',
    description: 'Presensi karyawan: absensi mandiri mobile QR/GPS, tablet kiosk absensi, monitoring presensi live & bulanan, dan reset device binding.',
    weight: 10
)]
class HrPayrollController extends Controller
{
    /**
     * Rekap Presensi Karyawan Realtime Hari Ini
     */
    public function getLiveAttendance(Request $request): JsonResponse
    {
        $today = Carbon::today()->toDateString();

        // Auto-close leftover attendance from previous days that staff forgot to clock-out
        Attendance::whereDate('created_at', '<', $today)
            ->whereNull('clock_out')
            ->get()
            ->each(function ($stale) {
                $clockIn = Carbon::parse($stale->clock_in);
                $stale->update([
                    'clock_out' => $clockIn->copy()->addHours(8),
                ]);
            });

        $employees = Employee::with(['user'])->where('employment_status', 'ACTIVE')->where('position', '!=', 'OWNER')->orderBy('employee_code')->get();
        $attendances = Attendance::whereDate('created_at', $today)->get()->keyBy('employee_id');

        $data = $employees->map(function ($emp) use ($attendances) {
            return $this->buildEmployeeAttendanceData($emp, $attendances->get($emp->id));
        });

        return response()->json([
            'status' => 'success',
            'data' => [
                'date' => Carbon::now()->translatedFormat('l, d F Y'),
                'time' => Carbon::now()->format('H:i:s'),
                'total_employees' => $employees->count(),
                'working_now' => $data->where('status', 'WORKING')->count(),
                'finished' => $data->where('status', 'FINISHED')->count(),
                'not_present' => $data->where('status', 'NOT_CLOCKED_IN')->count(),
                'employees' => $data->values(),
            ]
        ]);
    }

    /**
     * Daftar Karyawan Aktif untuk Presensi Mandiri HP
     */
    public function getPublicEmployees(Request $request): JsonResponse
    {
        return $this->getLiveAttendance($request);
    }

    /**
     * Daftar Seluruh Data SDM & Profil Karyawan
     */
    public function getEmployees(): JsonResponse
    {
        $employees = Employee::with('user')
            ->where('position', '!=', 'OWNER')
            ->orderBy('employee_code')
            ->get()
            ->map(function ($emp) {
                return [
                    'id' => $emp->id,
                    'user_id' => $emp->user_id,
                    'employee_code' => $emp->employee_code,
                    'name' => $emp->user->name ?? 'Staf',
                    'email' => $emp->user->email ?? '-',
                    'position' => $emp->position,
                    'department' => $emp->department,
                    'employment_status' => $emp->employment_status,
                    'phone' => $emp->phone,
                    'base_salary' => (float) $emp->base_salary,
                    'daily_allowance' => (float) $emp->daily_allowance,
                    'hourly_overtime_rate' => (float) $emp->hourly_overtime_rate,
                    'qr_token' => $emp->qr_token,
                    'is_device_locked' => !empty($emp->device_id),
                    'device_info' => $emp->device_info,
                    'created_at' => $emp->created_at?->format('Y-m-d'),
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => $employees,
        ]);
    }

    /**
     * Tambah Karyawan Baru Otomatis (Buat Akun, Kode Staf & QR Presensi)
     */
    public function storeEmployee(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'email' => 'required|email|unique:users,email',
            'password' => 'nullable|string|min:6',
            'position' => 'required|string|in:MANAGER,CASHIER,BARISTA,ADMIN_GUDANG',
            'department' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:20',
            'base_salary' => 'nullable|numeric|min:0',
            'daily_allowance' => 'nullable|numeric|min:0',
            'hourly_overtime_rate' => 'nullable|numeric|min:0',
        ]);

        return DB::transaction(function () use ($validated) {
            $password = !empty($validated['password']) ? $validated['password'] : 'password';
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => bcrypt($password),
                'email_verified_at' => now(),
            ]);

            $roleName = match ($validated['position']) {
                'MANAGER' => 'store_manager',
                'CASHIER' => 'cashier',
                'ADMIN_GUDANG' => 'warehouse_admin',
                default => 'barista',
            };
            $user->assignRole($roleName);

            $lastEmp = Employee::orderBy('id', 'desc')->first();
            $nextNum = ($lastEmp ? $lastEmp->id : 0) + 1;
            $code = sprintf('EMP-%03d', $nextNum);
            while (Employee::where('employee_code', $code)->exists()) {
                $nextNum++;
                $code = sprintf('EMP-%03d', $nextNum);
            }

            $qrToken = 'QR-' . strtoupper(substr(md5(uniqid($code, true)), 0, 10));

            $department = !empty($validated['department']) ? $validated['department'] : match ($validated['position']) {
                'MANAGER' => 'OPERATIONAL',
                'CASHIER' => 'FRONT_OFFICE',
                'ADMIN_GUDANG' => 'LOGISTICS',
                default => 'BAR',
            };

            $employee = Employee::create([
                'user_id' => $user->id,
                'employee_code' => $code,
                'position' => $validated['position'],
                'department' => $department,
                'employment_status' => 'ACTIVE',
                'phone' => $validated['phone'] ?? null,
                'base_salary' => (float) ($validated['base_salary'] ?? 0),
                'daily_allowance' => (float) ($validated['daily_allowance'] ?? 0),
                'hourly_overtime_rate' => (float) ($validated['hourly_overtime_rate'] ?? 0),
                'qr_token' => $qrToken,
            ]);

            AuditService::log(
                'EMPLOYEE_CREATED',
                'Employee',
                $employee->id,
                "Karyawan baru {$user->name} ({$code}) berhasil didaftarkan sebagai {$employee->position}."
            );

            return response()->json([
                'status' => 'success',
                'message' => "Karyawan {$user->name} ({$code}) berhasil ditambahkan ke sistem.",
                'data' => [
                    'id' => $employee->id,
                    'user_id' => $user->id,
                    'employee_code' => $code,
                    'name' => $user->name,
                    'email' => $user->email,
                    'position' => $employee->position,
                    'department' => $employee->department,
                    'phone' => $employee->phone,
                    'base_salary' => (float) $employee->base_salary,
                    'daily_allowance' => (float) $employee->daily_allowance,
                    'hourly_overtime_rate' => (float) $employee->hourly_overtime_rate,
                    'qr_token' => $employee->qr_token,
                ],
            ], 201);
        });
    }

    /**
     * Ubah Data Karyawan (Profil, Jabatan, Divisi, Telepon, Email, Status & Reset Password)
     */
    public function updateEmployee(Request $request, $id): JsonResponse
    {
        $employee = Employee::with('user')->findOrFail($id);
        $user = $employee->user;

        // Proteksi Akun Owner: Store Manager tidak boleh mengubah akun Owner / super_admin
        if ($employee->position === 'OWNER' || ($user && $user->hasRole('super_admin'))) {
            return response()->json([
                'status' => 'error',
                'message' => 'Akses Ditolak: Akun Pemilik Kedai (Owner) dilindungi dan tidak dapat diubah oleh Store Manager.',
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'email' => 'required|email|unique:users,email,' . ($user ? $user->id : 0),
            'password' => 'nullable|string|min:6',
            'position' => 'required|string|in:MANAGER,CASHIER,BARISTA,ADMIN_GUDANG',
            'department' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:20',
            'employment_status' => 'required|string|in:ACTIVE,INACTIVE',
        ]);

        return DB::transaction(function () use ($employee, $user, $validated) {
            if ($user) {
                $userData = [
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                ];
                if (!empty($validated['password'])) {
                    $userData['password'] = bcrypt($validated['password']);
                }
                $user->update($userData);

                $roleName = match ($validated['position']) {
                    'MANAGER' => 'store_manager',
                    'CASHIER' => 'cashier',
                    'ADMIN_GUDANG' => 'warehouse_admin',
                    default => 'barista',
                };
                $user->syncRoles([$roleName]);
            }

            $department = !empty($validated['department']) ? $validated['department'] : match ($validated['position']) {
                'MANAGER' => 'OPERATIONAL',
                'CASHIER' => 'FRONT_OFFICE',
                'ADMIN_GUDANG' => 'LOGISTICS',
                default => 'BAR',
            };

            $employee->update([
                'position' => $validated['position'],
                'department' => $department,
                'employment_status' => $validated['employment_status'],
                'phone' => $validated['phone'] ?? null,
            ]);

            AuditService::log(
                'EMPLOYEE_UPDATED',
                'Employee',
                $employee->id,
                "Data profil karyawan {$employee->employee_code} ({$validated['name']}) berhasil diperbarui."
            );

            return response()->json([
                'status' => 'success',
                'message' => "Data karyawan {$validated['name']} ({$employee->employee_code}) berhasil diperbarui.",
                'data' => $employee->fresh(['user']),
            ]);
        });
    }

    /**
     * Rekapitulasi Presensi & Riwayat Bulanan Karyawan
     */
    public function getMonthlyAttendance(Request $request): JsonResponse
    {
        $month = (int) $request->query('month', Carbon::now()->month);
        $year = (int) $request->query('year', Carbon::now()->year);

        $startDate = Carbon::create($year, $month, 1)->startOfMonth();
        $endDate = Carbon::create($year, $month, 1)->endOfMonth();

        $employees = Employee::with('user')
            ->where('employment_status', 'ACTIVE')
            ->orderBy('employee_code')
            ->get();

        $attendances = Attendance::with('employee.user')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->orderBy('created_at', 'desc')
            ->get();

        // Group by employee for monthly summary
        $recap = $employees->map(function ($emp) use ($attendances) {
            $empAtt = $attendances->where('employee_id', $emp->id);
            $presentDays = $empAtt->whereNotNull('clock_in')->count();
            $lateCount = $empAtt->where('late_minutes', '>', 0)->count();
            $totalLateMin = (int) $empAtt->sum('late_minutes');
            $totalOtMin = (int) $empAtt->sum('overtime_minutes');

            // Total working minutes
            $totalWorkMinutes = $empAtt->reduce(function ($carry, $att) {
                if ($att->clock_in && $att->clock_out) {
                    return $carry + Carbon::parse($att->clock_out)->diffInMinutes(Carbon::parse($att->clock_in));
                }
                return $carry;
            }, 0);

            $workHours = round($totalWorkMinutes / 60, 1);
            $otHours = round($totalOtMin / 60, 1);

            return [
                'id' => $emp->id,
                'employee_id' => $emp->id,
                'employee_code' => $emp->employee_code,
                'name' => $emp->user->name ?? 'Staf',
                'position' => $emp->position,
                'department' => $emp->department ?? '-',
                'phone' => $emp->phone ?? '-',
                'present_days' => $presentDays,
                'late_count' => $lateCount,
                'total_late_minutes' => $totalLateMin,
                'total_work_hours' => $workHours,
                'total_overtime_hours' => $otHours,
                'is_device_locked' => !empty($emp->device_id),
                'device_info' => $emp->device_info ?? 'Belum bind',
            ];
        });

        // Detail individual attendance logs
        $details = $attendances->map(function ($att) {
            $durationMin = 0;
            if ($att->clock_in && $att->clock_out) {
                $durationMin = Carbon::parse($att->clock_out)->diffInMinutes(Carbon::parse($att->clock_in));
            }
            $hours = floor($durationMin / 60);
            $mins = $durationMin % 60;
            $durationStr = $durationMin > 0 ? "{$hours}j {$mins}m" : '-';

            return [
                'id' => $att->id,
                'date' => Carbon::parse($att->created_at)->format('Y-m-d'),
                'date_formatted' => Carbon::parse($att->created_at)->translatedFormat('l, d M Y'),
                'employee_code' => $att->employee->employee_code ?? '-',
                'name' => $att->employee->user->name ?? '-',
                'position' => $att->employee->position ?? '-',
                'clock_in' => $att->clock_in ? Carbon::parse($att->clock_in)->format('H:i') : '-',
                'clock_out' => $att->clock_out ? Carbon::parse($att->clock_out)->format('H:i') : '-',
                'duration' => $durationStr,
                'late_minutes' => $att->late_minutes ?? 0,
                'late_reason' => $att->late_reason,
                'overtime_minutes' => $att->overtime_minutes ?? 0,
                'status' => $att->status ?? 'PRESENT',
                'latitude' => $att->latitude ? (float) $att->latitude : null,
                'longitude' => $att->longitude ? (float) $att->longitude : null,
                'location_name' => $att->location_name ?? ($att->latitude ? 'Outlet Utama' : null),
                'notes' => $att->notes ?? $att->late_reason,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => [
                'month' => $month,
                'year' => $year,
                'month_name' => Carbon::create($year, $month, 1)->translatedFormat('F Y'),
                'total_employees' => $employees->count(),
                'total_attendance_records' => $attendances->count(),
                'recap' => $recap->values(),
                'details' => $details->values(),
            ]
        ]);
    }

    /**
     * Build employee attendance response data (reusable)
     */
    private function buildEmployeeAttendanceData(Employee $emp, ?Attendance $att): array
    {
        $status = 'NOT_CLOCKED_IN';
        $clockInStr = null;
        $clockOutStr = null;
        $durationMinutes = 0;

        if ($att) {
            if ($att->clock_in && !$att->clock_out) {
                $status = 'WORKING';
                $clockInStr = $att->clock_in->format('H:i');
                $durationMinutes = Carbon::now()->diffInMinutes($att->clock_in);
            } elseif ($att->clock_out) {
                $status = 'FINISHED';
                $clockInStr = $att->clock_in ? $att->clock_in->format('H:i') : null;
                $clockOutStr = $att->clock_out->format('H:i');
                if ($att->clock_in) {
                    $durationMinutes = $att->clock_out->diffInMinutes($att->clock_in);
                }
            }
        }

        $hours = floor($durationMinutes / 60);
        $mins = $durationMinutes % 60;
        $durationFormatted = ($hours > 0 ? "{$hours}j " : "") . "{$mins}m";

        return [
            'id' => $emp->id,
            'employee_id' => $emp->id,
            'employee_code' => $emp->employee_code,
            'qr_token' => $emp->qr_token,
            'name' => $emp->user->name ?? 'Karyawan',
            'email' => $emp->user->email ?? '-',
            'position' => $emp->position,
            'department' => $emp->department ?? '-',
            'status' => $status,
            'clock_in' => $clockInStr,
            'clock_out' => $clockOutStr,
            'duration_minutes' => $durationMinutes,
            'duration_formatted' => $durationMinutes > 0 ? $durationFormatted : '-',
            'late_minutes' => $att?->late_minutes ?? 0,
            'late_reason' => $att?->late_reason,
            'is_late' => ($att?->late_minutes ?? 0) > 0,
            'overtime_minutes' => $att?->overtime_minutes ?? 0,
            'latitude' => $att?->latitude ? (float) $att->latitude : ($att?->clock_in ? -6.2088 : null),
            'longitude' => $att?->longitude ? (float) $att->longitude : ($att?->clock_in ? 106.8456 : null),
            'location_name' => $att?->location_name ?? ($att?->clock_in ? 'Outlet Coffeeshop (Radius Aman)' : null),
            'notes' => $att?->notes ?? $att?->late_reason,
            'attendance_id' => $att?->id,
            'device_id' => $emp->device_id,
            'device_info' => $emp->device_info,
            'is_device_locked' => !empty($emp->device_id),
            'device_locked_at' => $emp->device_locked_at ? Carbon::parse($emp->device_locked_at)->format('d/m/Y H:i') : null,
        ];
    }

    /**
     * Koreksi Presensi Masuk / Pulang oleh Manajer
     */
    public function toggleAttendance(Request $request): JsonResponse
    {
        $employeeId = $request->input('employee_id') ?? $request->input('id');
        if (!$employeeId && $request->filled('employee_code')) {
            $employeeId = Employee::where('employee_code', $request->input('employee_code'))->value('id');
        }
        $request->merge(['employee_id' => $employeeId]);

        $rawAction = strtoupper($request->input('action', ''));
        if ($rawAction === 'IN') $rawAction = 'CLOCK_IN';
        if ($rawAction === 'OUT') $rawAction = 'CLOCK_OUT';
        $request->merge(['action' => $rawAction]);

        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'action' => 'required|in:CLOCK_IN,CLOCK_OUT',
        ]);

        $today = Carbon::today()->toDateString();
        $att = Attendance::where('employee_id', $validated['employee_id'])
            ->whereDate('created_at', $today)
            ->first();

        $emp = Employee::with('user')->findOrFail($validated['employee_id']);

        if ($validated['action'] === 'CLOCK_IN') {
            if ($att && $att->clock_in) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Karyawan ini sudah melakukan clock-in (masuk) hari ini pada jam ' . $att->clock_in->format('H:i') . ' WIB.',
                    'data' => $this->buildEmployeeAttendanceData($emp, $att),
                ], 400);
            }
            $now = Carbon::now();
            $att = Attendance::create([
                'employee_id' => $validated['employee_id'],
                'clock_in' => $now,
                'status' => 'PRESENT',
                'latitude' => $request->input('latitude', -6.2088),
                'longitude' => $request->input('longitude', 106.8456),
                'location_name' => $request->input('location_name', 'Outlet Coffeeshop (Stasiun Manager)'),
                'late_reason' => $request->input('late_reason'),
                'notes' => $request->input('notes') ?? $request->input('late_reason'),
            ]);

            AuditService::log('CLOCK_IN', 'Attendance', $att->id,
                "Manager mencatat masuk: {$emp->user->name} ({$emp->employee_code}) jam " . $now->format('H:i') . " WIB");

            return response()->json([
                'status' => 'success',
                'message' => "✅ {$emp->user->name} berhasil Clock-In jam " . $now->format('H:i') . " WIB.",
                'data' => $this->buildEmployeeAttendanceData($emp, $att),
            ]);
        } else {
            if (!$att || !$att->clock_in) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Karyawan belum melakukan clock-in (masuk) hari ini.',
                ], 400);
            }
            if ($att->clock_out && !$request->boolean('force')) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Karyawan sudah menyelesaikan shift (clock-out) hari ini pada jam ' . $att->clock_out->format('H:i') . ' WIB.',
                    'data' => $this->buildEmployeeAttendanceData($emp, $att),
                ], 400);
            }
            $now = Carbon::now();
            $durationMin = $now->diffInMinutes($att->clock_in);
            $att->update(['clock_out' => $now]);

            AuditService::log('CLOCK_OUT', 'Attendance', $att->id,
                "Manager mencatat pulang: {$emp->user->name} ({$emp->employee_code}) jam " . $now->format('H:i') . " WIB, durasi {$durationMin} menit");

            return response()->json([
                'status' => 'success',
                'message' => "✅ {$emp->user->name} berhasil Clock-Out jam " . $now->format('H:i') . " WIB. Durasi kerja: {$durationMin} menit.",
                'data' => $this->buildEmployeeAttendanceData($emp, $att),
            ]);
        }
    }

    /**
     * Reset Kunci Perangkat Karyawan (Ganti HP / Device Binding)
     */
    public function resetDeviceLock(int $employeeId): JsonResponse
    {
        $employee = Employee::with('user')->findOrFail($employeeId);
        $employee->update([
            'device_id' => null,
            'device_info' => null,
            'device_locked_at' => null,
        ]);

        AuditService::log('RESET_DEVICE', 'Employee', $employee->id,
            "Reset Device Lock presensi untuk {$employee->user->name} ({$employee->employee_code})");

        return response()->json([
            'status' => 'success',
            'message' => "Kunci device untuk {$employee->user->name} berhasil di-reset. Karyawan dapat mendaftarkan HP baru pada scan presensi berikutnya.",
        ]);
    }

    /**
     * Presensi Mandiri Jam Masuk (Clock-In)
     */
    public function clockIn(Request $request): JsonResponse
    {
        $employee = Employee::where('user_id', $request->user()->id)->firstOrFail();
        $today = Carbon::today()->toDateString();

        $schedule = WorkSchedule::where('employee_id', $employee->id)
            ->where('work_date', $today)
            ->first();

        $existingAttendance = Attendance::where('employee_id', $employee->id)
            ->whereDate('created_at', $today)
            ->first();

        if ($existingAttendance && $existingAttendance->clock_in) {
            return response()->json([
                'status' => 'error',
                'message' => 'Anda sudah melakukan absen masuk hari ini pada jam ' .
                    $existingAttendance->clock_in->format('H:i') . ' WIB.',
            ], 400);
        }

        $now = Carbon::now();
        $lateMinutes = 0;

        if ($schedule) {
            $shiftStart = Carbon::parse($schedule->work_date . ' ' . $schedule->start_time);
            if ($now->greaterThan($shiftStart)) {
                $lateMinutes = (int) $now->diffInMinutes($shiftStart);
            }
        }

        $attendance = Attendance::create([
            'employee_id' => $employee->id,
            'work_schedule_id' => $schedule?->id,
            'clock_in' => $now,
            'late_minutes' => $lateMinutes,
            'status' => 'PRESENT',
        ]);

        AuditService::log('CLOCK_IN', 'Attendance', $attendance->id,
            "{$request->user()->name} absen masuk jam " . $now->format('H:i') . " WIB" .
            ($lateMinutes > 0 ? " (terlambat {$lateMinutes} menit)" : " (tepat waktu)"));

        $att = Attendance::where('employee_id', $employee->id)->whereDate('created_at', $today)->first();
        $employee->load('user');

        return response()->json([
            'status' => 'success',
            'message' => "✅ Absen Masuk berhasil! Jam " . $now->format('H:i') . " WIB" .
                ($lateMinutes > 0 ? " — Terlambat {$lateMinutes} menit" : " — Tepat Waktu ✓"),
            'data' => $this->buildEmployeeAttendanceData($employee, $att),
        ], 201);
    }

    /**
     * Presensi Mandiri Jam Pulang (Clock-Out)
     */
    public function clockOut(Request $request): JsonResponse
    {
        $employee = Employee::where('user_id', $request->user()->id)->firstOrFail();
        $today = Carbon::today()->toDateString();

        $attendance = Attendance::where('employee_id', $employee->id)
            ->whereDate('created_at', $today)
            ->first();

        if (!$attendance || !$attendance->clock_in) {
            return response()->json([
                'status' => 'error',
                'message' => 'Anda belum melakukan absen masuk hari ini.',
            ], 400);
        }

        if ($attendance->clock_out) {
            return response()->json([
                'status' => 'error',
                'message' => 'Anda sudah melakukan absen pulang hari ini pada jam ' .
                    $attendance->clock_out->format('H:i') . ' WIB.',
            ], 400);
        }

        $now = Carbon::now();
        $durationMinutes = (int) $now->diffInMinutes($attendance->clock_in);
        $overtimeMinutes = 0;

        if ($attendance->workSchedule) {
            $shiftEnd = Carbon::parse($attendance->workSchedule->work_date . ' ' . $attendance->workSchedule->end_time);
            if ($now->greaterThan($shiftEnd)) {
                $overtimeMinutes = (int) $now->diffInMinutes($shiftEnd);
            }
        }

        $attendance->update([
            'clock_out' => $now,
            'overtime_minutes' => $overtimeMinutes,
        ]);

        $hours = floor($durationMinutes / 60);
        $mins = $durationMinutes % 60;
        $durationFormatted = "{$hours} jam {$mins} menit";

        AuditService::log('CLOCK_OUT', 'Attendance', $attendance->id,
            "{$request->user()->name} absen pulang jam " . $now->format('H:i') . " WIB, durasi kerja {$durationFormatted}" .
            ($overtimeMinutes > 0 ? ", lembur {$overtimeMinutes} menit" : ""));

        $employee->load('user');

        return response()->json([
            'status' => 'success',
            'message' => "✅ Absen Pulang berhasil! Jam " . $now->format('H:i') . " WIB — Durasi Kerja: {$durationFormatted}" .
                ($overtimeMinutes > 0 ? " (Lembur {$overtimeMinutes} menit)" : ""),
            'data' => $this->buildEmployeeAttendanceData($employee, $attendance),
        ]);
    }

    /**
     * Presensi Tablet Kiosk Toko (Scan QR / Masuk PIN)
     *
     * Token bisa berupa employee QR token atau employee_code
     * Fitur Anti-Titip Absen: 1 QR Code terkunci untuk 1 Device/HP
     */
    public function qrAttendance(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'qr_token' => 'required|string',
            'device_id' => 'nullable|string',
            'device_info' => 'nullable|string',
        ]);

        // Find employee by QR token or employee_code
        $employee = Employee::with(['user'])
            ->where('qr_token', $validated['qr_token'])
            ->orWhere('employee_code', strtoupper($validated['qr_token']))
            ->first();

        if (!$employee) {
            return response()->json([
                'status' => 'error',
                'message' => 'QR Code tidak dikenali. Pastikan QR kode presensi valid.',
            ], 404);
        }

        // ═══════════════════════════════════════════════════════════════
        // ANTI-TITIP ABSEN: STRICT BI-DIRECTIONAL 1 PHONE = 1 EMPLOYEE
        // ═══════════════════════════════════════════════════════════════
        $deviceId = $validated['device_id'] ?? null;
        $deviceInfo = $validated['device_info'] ?? $request->header('User-Agent');
        $deviceNotice = null;

        if ($deviceId) {
            // 1. CEK: Apakah HP ini sudah terikat ke karyawan LAIN? (Anti-Titip Absen Berbagi HP)
            $existingBoundStaff = Employee::with('user')
                ->where('device_id', $deviceId)
                ->where('id', '!=', $employee->id)
                ->first();

            if ($existingBoundStaff) {
                return response()->json([
                    'status' => 'error',
                    'error_code' => 'DEVICE_ALREADY_BOUND_TO_OTHER',
                    'message' => "❌ Akses Ditolak (Anti-Titip Absen)! Smartphone ini sudah terikat permanen pada karyawan: {$existingBoundStaff->user->name} ({$existingBoundStaff->employee_code}). 1 HP HANYA boleh digunakan oleh 1 orang staf. Anda tidak boleh absen memakai HP rekan kerja.",
                ], 403);
            }

            // 2. CEK: Apakah akun ini sudah terikat di HP lain?
            if (!empty($employee->device_id) && $employee->device_id !== $deviceId) {
                return response()->json([
                    'status' => 'error',
                    'error_code' => 'DEVICE_MISMATCH',
                    'message' => '❌ Akses Ditolak (Anti-Titip Absen)! QR Code ini sudah terkunci ke HP lain (' .
                        ($employee->device_info ?: 'Perangkat Terdaftar') . '). 1 QR Code hanya berlaku untuk 1 HP terdaftar. Hubungi Manager jika baru berganti HP.',
                ], 403);
            }

            // 3. Ikat HP pertama kali
            if (empty($employee->device_id)) {
                $employee->update([
                    'device_id' => $deviceId,
                    'device_info' => $deviceInfo,
                    'device_locked_at' => now(),
                ]);
                $deviceNotice = "🔒 HP ini berhasil dikunci sebagai perangkat resmi Anda (Anti-Titip Absen).";
            }
        }

        $today = Carbon::today()->toDateString();
        $att = Attendance::where('employee_id', $employee->id)
            ->whereDate('created_at', $today)
            ->first();

        $now = Carbon::now();

        // Auto-detect: belum clock-in → clock-in; sudah clock-in belum clock-out → clock-out
        if (!$att || !$att->clock_in) {
            // CLOCK IN
            $schedule = WorkSchedule::where('employee_id', $employee->id)
                ->where('work_date', $today)
                ->first();

            $lateMinutes = 0;
            if ($schedule) {
                $shiftStart = Carbon::parse($schedule->work_date . ' ' . $schedule->start_time);
                if ($now->greaterThan($shiftStart)) {
                    $lateMinutes = (int) $now->diffInMinutes($shiftStart);
                }
            }

            $att = Attendance::create([
                'employee_id' => $employee->id,
                'work_schedule_id' => $schedule?->id,
                'clock_in' => $now,
                'late_minutes' => $lateMinutes,
                'status' => 'PRESENT',
            ]);

            AuditService::log('CLOCK_IN', 'Attendance', $att->id,
                "QR Scan: {$employee->user->name} ({$employee->employee_code}) absen masuk jam " .
                $now->format('H:i') . " WIB" . ($lateMinutes > 0 ? " (terlambat {$lateMinutes} menit)" : ""));

            return response()->json([
                'status' => 'success',
                'action' => 'CLOCK_IN',
                'message' => "✅ Absen Masuk Tercatat!",
                'detail' => "Jam " . $now->format('H:i') . " WIB" .
                    ($lateMinutes > 0 ? " — Terlambat {$lateMinutes} menit" : " — Tepat Waktu ✓"),
                'data' => $this->buildEmployeeAttendanceData($employee, $att),
            ]);

        } elseif (!$att->clock_out) {
            // CLOCK OUT
            $durationMinutes = (int) $now->diffInMinutes($att->clock_in);
            $overtimeMinutes = 0;

            if ($att->workSchedule) {
                $shiftEnd = Carbon::parse($att->workSchedule->work_date . ' ' . $att->workSchedule->end_time);
                if ($now->greaterThan($shiftEnd)) {
                    $overtimeMinutes = (int) $now->diffInMinutes($shiftEnd);
                }
            }

            $att->update([
                'clock_out' => $now,
                'overtime_minutes' => $overtimeMinutes,
            ]);

            $hours = floor($durationMinutes / 60);
            $mins = $durationMinutes % 60;

            AuditService::log('CLOCK_OUT', 'Attendance', $att->id,
                "QR Scan: {$employee->user->name} ({$employee->employee_code}) absen pulang jam " .
                $now->format('H:i') . " WIB, durasi {$durationMinutes} menit");

            return response()->json([
                'status' => 'success',
                'action' => 'CLOCK_OUT',
                'message' => "✅ Absen Pulang Tercatat!",
                'detail' => "Jam " . $now->format('H:i') . " WIB — Durasi Kerja: {$hours}j {$mins}m" .
                    ($overtimeMinutes > 0 ? " (Lembur {$overtimeMinutes} menit)" : ""),
                'data' => $this->buildEmployeeAttendanceData($employee, $att),
            ]);

        } else {
            // Already fully clocked-in & out
            return response()->json([
                'status' => 'info',
                'action' => 'ALREADY_DONE',
                'message' => "Shift hari ini sudah selesai.",
                'detail' => "Masuk: " . $att->clock_in->format('H:i') . " | Pulang: " . $att->clock_out->format('H:i'),
                'data' => $this->buildEmployeeAttendanceData($employee, $att),
            ]);
        }
    }

    /**
     * Scan QR Poster Outlet via Kamera HP Karyawan
     */
    public function scanOutletQr(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'outlet_token' => 'required|string',
            'device_id' => 'nullable|string',
            'device_info' => 'nullable|string',
        ]);

        // Acceptable outlet tokens: matches outlet prefix or contains ESB / OUTLET / COFFEESHOP / PRESENSI / localhost
        $validTokenPattern = '/(ESB|OUTLET|COFFEESHOP|PRESENSI|absen|localhost)/i';
        if (!preg_match($validTokenPattern, $validated['outlet_token'])) {
            return response()->json([
                'status' => 'error',
                'message' => '❌ QR Code tidak valid! Pastikan Anda men-scan QR Code Resmi Outlet Coffeeshop.',
            ], 422);
        }

        $user = $request->user();
        $employee = Employee::with('user')->where('user_id', $user->id)->first();
        if (!$employee) {
            return response()->json([
                'status' => 'error',
                'message' => 'Akun Anda tidak terhubung ke profil karyawan aktif.',
            ], 404);
        }

        // Anti-titip absen: device locking check (STRICT BI-DIRECTIONAL 1 PHONE = 1 EMPLOYEE)
        $deviceId = $validated['device_id'] ?? null;
        $deviceInfo = $validated['device_info'] ?? $request->header('User-Agent');
        $deviceNotice = null;

        if ($deviceId) {
            // 1. CEK: Apakah HP ini sudah terikat ke karyawan LAIN? (Anti-Titip Absen Berbagi HP)
            $existingBoundStaff = Employee::with('user')
                ->where('device_id', $deviceId)
                ->where('id', '!=', $employee->id)
                ->first();

            if ($existingBoundStaff) {
                return response()->json([
                    'status' => 'error',
                    'error_code' => 'DEVICE_ALREADY_BOUND_TO_OTHER',
                    'message' => "❌ Akses Ditolak (Anti-Titip Absen)! Smartphone ini sudah terikat resmi pada karyawan: {$existingBoundStaff->user->name} ({$existingBoundStaff->employee_code}).\n\n1 HP HANYA boleh digunakan oleh 1 orang staf. Anda tidak boleh absen memakai HP rekan kerja.",
                ], 403);
            }

            // 2. CEK: Apakah akun ini sudah terikat di HP lain?
            if (!empty($employee->device_id) && $employee->device_id !== $deviceId) {
                return response()->json([
                    'status' => 'error',
                    'error_code' => 'DEVICE_MISMATCH',
                    'message' => "❌ Akses Ditolak (Anti-Titip Absen)! Akun {$user->name} sudah terikat pada HP lain ({$employee->device_info}). Hubungi Store Manager jika Anda mengganti smartphone.",
                ], 403);
            }

            // 3. Ikat HP pertama kali
            if (empty($employee->device_id)) {
                $employee->update([
                    'device_id' => $deviceId,
                    'device_info' => $deviceInfo,
                    'device_locked_at' => now(),
                ]);
                $deviceNotice = "🔒 HP ini berhasil dikunci secara permanen sebagai perangkat resmi Anda.";
            }
        }

        $today = Carbon::today()->toDateString();
        $att = Attendance::where('employee_id', $employee->id)
            ->whereDate('created_at', $today)
            ->first();
        $now = Carbon::now();

        // 1. Clock-in
        if (!$att || !$att->clock_in) {
            $schedule = WorkSchedule::where('employee_id', $employee->id)
                ->where('work_date', $today)
                ->first();

            $lateMinutes = 0;
            if ($schedule) {
                $shiftStart = Carbon::parse($schedule->work_date . ' ' . $schedule->start_time);
                if ($now->greaterThan($shiftStart)) {
                    $lateMinutes = (int) $now->diffInMinutes($shiftStart);
                }
            }

            $attendance = Attendance::create([
                'employee_id' => $employee->id,
                'work_schedule_id' => $schedule?->id,
                'clock_in' => $now,
                'late_minutes' => $lateMinutes,
                'status' => 'PRESENT',
            ]);

            AuditService::log('QR_CLOCK_IN', 'Attendance', $attendance->id,
                "{$user->name} ({$employee->position}) scan QR Outlet Clock-In jam " . $now->format('H:i') . " WIB"
            );

            return response()->json([
                'status' => 'success',
                'action' => 'CLOCK_IN',
                'message' => "🎉 Absen Masuk Berhasil! Jam {$now->format('H:i')} WIB",
                'detail' => $lateMinutes > 0 ? "Terlambat {$lateMinutes} menit." : "Tepat Waktu ✓",
                'device_notice' => $deviceNotice,
                'data' => $this->buildEmployeeAttendanceData($employee, $attendance),
            ]);
        }

        // 2. Clock-out
        if (!$att->clock_out) {
            $durationMinutes = (int) $now->diffInMinutes($att->clock_in);
            $hours = floor($durationMinutes / 60);
            $mins = $durationMinutes % 60;
            $durationFormatted = "{$hours} jam {$mins} menit";

            $att->update([
                'clock_out' => $now,
            ]);

            AuditService::log('QR_CLOCK_OUT', 'Attendance', $att->id,
                "{$user->name} ({$employee->position}) scan QR Outlet Clock-Out jam " . $now->format('H:i') . " WIB (durasi: {$durationFormatted})"
            );

            return response()->json([
                'status' => 'success',
                'action' => 'CLOCK_OUT',
                'message' => "🏁 Absen Pulang Berhasil! Jam {$now->format('H:i')} WIB",
                'detail' => "Total waktu bekerja hari ini: {$durationFormatted}.",
                'device_notice' => $deviceNotice,
                'data' => $this->buildEmployeeAttendanceData($employee, $att),
            ]);
        }

        // 3. Already finished
        return response()->json([
            'status' => 'info',
            'action' => 'FINISHED',
            'message' => "Shift Anda hari ini sudah selesai (Clock-In: " . Carbon::parse($att->clock_in)->format('H:i') . ", Clock-Out: " . Carbon::parse($att->clock_out)->format('H:i') . " WIB).",
            'data' => $this->buildEmployeeAttendanceData($employee, $att),
        ]);
    }

    /**
     * Status Presensi Hari Ini Milik Karyawan yang Login
     */
    public function getMyAttendanceStatus(Request $request): JsonResponse
    {
        $user = $request->user();
        $employee = Employee::with('user')->where('user_id', $user->id)->first();
        if (!$employee) {
            return response()->json(['status' => 'error', 'message' => 'Bukan karyawan aktif'], 404);
        }
        $today = Carbon::today()->toDateString();
        $att = Attendance::where('employee_id', $employee->id)->whereDate('created_at', $today)->first();

        return response()->json([
            'status' => 'success',
            'data' => $this->buildEmployeeAttendanceData($employee, $att),
        ]);
    }

    /**
     * Presensi Cepat Staf via Web HP (Scan QR & GPS)
     *
     * Karyawan scan QR Outlet -> Buka di Chrome HP -> Pilih Nama -> Masuk/Pulang
     */
    public function publicAttendance(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'action' => 'nullable|in:CLOCK_IN,CLOCK_OUT,TOGGLE',
            'pin' => 'nullable|string',
            'late_reason' => 'nullable|string|max:500',
            'notes' => 'nullable|string|max:500',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'location_name' => 'nullable|string|max:255',
        ]);

        $employee = Employee::with('user')->findOrFail($validated['employee_id']);
        $today = Carbon::today()->toDateString();
        $att = Attendance::where('employee_id', $employee->id)->whereDate('created_at', $today)->first();
        $now = Carbon::now();
        $action = $validated['action'] ?? 'TOGGLE';

        if ($action === 'TOGGLE') {
            if (!$att || !$att->clock_in) {
                $action = 'CLOCK_IN';
            } elseif (!$att->clock_out) {
                $action = 'CLOCK_OUT';
            } else {
                return response()->json([
                    'status' => 'info',
                    'action' => 'ALREADY_COMPLETED',
                    'title' => 'Shift Hari Ini Selesai',
                    'message' => "{$employee->user->name} sudah menyelesaikan jam kerja hari ini.",
                    'time' => $now->format('H:i') . ' WIB',
                    'clock_in' => Carbon::parse($att->clock_in)->format('H:i') . ' WIB',
                    'clock_out' => Carbon::parse($att->clock_out)->format('H:i') . ' WIB',
                    'employee' => [
                        'name' => $employee->user->name,
                        'position' => $employee->position,
                        'code' => $employee->employee_code,
                    ]
                ]);
            }
        }

        if ($action === 'CLOCK_IN') {
            if ($att && $att->clock_in) {
                return response()->json([
                    'status' => 'warning',
                    'action' => 'ALREADY_IN',
                    'title' => 'Sudah Absen Masuk',
                    'message' => "{$employee->user->name} sudah tercatat masuk jam " . Carbon::parse($att->clock_in)->format('H:i') . " WIB.",
                    'time' => Carbon::parse($att->clock_in)->format('H:i') . ' WIB',
                    'employee' => [
                        'name' => $employee->user->name,
                        'position' => $employee->position,
                        'code' => $employee->employee_code,
                    ]
                ]);
            }

            $schedule = WorkSchedule::where('employee_id', $employee->id)->where('work_date', $today)->first();
            $shiftStart = $schedule
                ? Carbon::parse($schedule->work_date . ' ' . $schedule->start_time)
                : Carbon::parse($today . ' 09:00:00');

            $lateMinutes = 0;
            $lateReason = null;
            if ($now->greaterThan($shiftStart)) {
                $lateMinutes = (int) $now->diffInMinutes($shiftStart);
                $lateReason = !empty($validated['late_reason']) ? trim($validated['late_reason']) : 'Terlambat tanpa keterangan';
            }

            $latitude = $request->input('latitude') !== null ? (float) $request->input('latitude') : -6.2088;
            $longitude = $request->input('longitude') !== null ? (float) $request->input('longitude') : 106.8456;
            $locationName = $request->input('location_name') ?: 'Outlet Coffeeshop (GPS Valid)';
            $notes = $request->input('notes') ?: $lateReason;

            $att = Attendance::create([
                'employee_id' => $employee->id,
                'work_schedule_id' => $schedule?->id,
                'clock_in' => $now,
                'late_minutes' => $lateMinutes,
                'late_reason' => $lateReason,
                'status' => $lateMinutes > 0 ? 'LATE' : 'PRESENT',
                'latitude' => $latitude,
                'longitude' => $longitude,
                'location_name' => $locationName,
                'notes' => $notes,
            ]);

            AuditService::log('PUBLIC_CLOCK_IN', 'Attendance', $att->id,
                "Presensi HP: {$employee->user->name} ({$employee->position}) masuk jam " . $now->format('H:i') . " WIB" .
                ($lateMinutes > 0 ? " [TERLAMBAT {$lateMinutes}m - Alasan: {$lateReason}]" : " [TEPAT WAKTU]"));

            return response()->json([
                'status' => 'success',
                'action' => 'CLOCK_IN',
                'title' => $lateMinutes > 0 ? 'PRESENSI MASUK (TERLAMBAT)' : 'BERHASIL PRESENSI MASUK!',
                'message' => $lateMinutes > 0
                    ? "Presensi masuk tercatat. Anda terlambat {$lateMinutes} menit (Jam masuk standar: 09:00 WIB)."
                    : "Selamat bertugas di outlet! Presensi masuk tepat waktu berhasil dicatat.",
                'time' => $now->format('H:i:s') . ' WIB',
                'detail' => $lateMinutes > 0 ? "Terlambat {$lateMinutes} menit. Alasan: \"{$lateReason}\"" : "Tepat Waktu ✓",
                'is_late' => $lateMinutes > 0,
                'late_minutes' => $lateMinutes,
                'late_reason' => $lateReason,
                'employee' => [
                    'id' => $employee->id,
                    'name' => $employee->user->name,
                    'position' => $employee->position,
                    'code' => $employee->employee_code,
                    'clock_in' => $now->format('H:i'),
                    'status' => 'WORKING',
                ]
            ]);
        } else {
            // CLOCK_OUT
            if (!$att || !$att->clock_in) {
                return response()->json([
                    'status' => 'error',
                    'message' => "Karyawan {$employee->user->name} belum melakukan presensi masuk hari ini.",
                ], 400);
            }

            if ($att->clock_out) {
                return response()->json([
                    'status' => 'warning',
                    'action' => 'ALREADY_OUT',
                    'title' => 'Sudah Absen Pulang',
                    'message' => "{$employee->user->name} sudah tercatat pulang jam " . Carbon::parse($att->clock_out)->format('H:i') . " WIB.",
                    'time' => Carbon::parse($att->clock_out)->format('H:i') . ' WIB',
                    'employee' => [
                        'name' => $employee->user->name,
                        'position' => $employee->position,
                        'code' => $employee->employee_code,
                    ]
                ]);
            }

            $durationMinutes = (int) $now->diffInMinutes($att->clock_in);
            $hours = floor($durationMinutes / 60);
            $mins = $durationMinutes % 60;
            $durationFormatted = "{$hours} jam {$mins} menit";

            $att->update(['clock_out' => $now]);

            AuditService::log('PUBLIC_CLOCK_OUT', 'Attendance', $att->id,
                "Presensi HP: {$employee->user->name} ({$employee->position}) pulang jam " . $now->format('H:i') . " WIB");

            return response()->json([
                'status' => 'success',
                'action' => 'CLOCK_OUT',
                'title' => 'BERHASIL PRESENSI PULANG!',
                'message' => "Terima kasih atas kerja kerasnya hari ini! Selamat beristirahat.",
                'time' => $now->format('H:i:s') . ' WIB',
                'duration' => $durationFormatted,
                'employee' => [
                    'id' => $employee->id,
                    'name' => $employee->user->name,
                    'position' => $employee->position,
                    'code' => $employee->employee_code,
                    'clock_out' => $now->format('H:i'),
                    'status' => 'FINISHED',
                ]
            ]);
        }
    }

    /**
     * Generate Monthly Payroll Run for All Employees (Kept for future use)
     */
    public function runPayroll(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer|min:2024',
            'service_charge_pool' => 'nullable|numeric|min:0',
        ]);

        $startDate = Carbon::create($validated['year'], $validated['month'], 1)->startOfMonth()->toDateString();
        $endDate = Carbon::create($validated['year'], $validated['month'], 1)->endOfMonth()->toDateString();

        return DB::transaction(function () use ($validated, $startDate, $endDate) {
            $period = PayrollPeriod::firstOrCreate(
                ['month' => $validated['month'], 'year' => $validated['year']],
                [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'status' => 'DRAFT',
                ]
            );

            $employees = Employee::where('employment_status', 'ACTIVE')->get();
            $totalDisbursed = 0;
            $daysInMonth = Carbon::create($validated['year'], $validated['month'], 1)->daysInMonth;
            $serviceChargePool = $validated['service_charge_pool'] ?? 0;
            $scPerEmployee = count($employees) > 0 ? round($serviceChargePool / count($employees), 2) : 0;

            foreach ($employees as $emp) {
                $attendances = Attendance::where('employee_id', $emp->id)
                    ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                    ->where('status', 'PRESENT')
                    ->get();

                $daysPresent = $attendances->count();
                $unpaidAbsenceDays = max(0, $daysInMonth - $daysPresent);

                $dailyRate = $daysInMonth > 0 ? round($emp->base_salary / $daysInMonth, 2) : 0;
                $absenceDeduction = round($unpaidAbsenceDays * $dailyRate, 2);

                $totalLateMin = $attendances->sum('late_minutes');
                $totalOtHours = round($attendances->sum('overtime_minutes') / 60, 2);

                $baseEarned = max(0, $emp->base_salary - $absenceDeduction);
                $allowanceEarned = $daysPresent * $emp->daily_allowance;
                $overtimeEarned = $totalOtHours * $emp->hourly_overtime_rate;
                $lateDeduction = $totalLateMin * 1000;
                $totalDeductions = $absenceDeduction + $lateDeduction;

                $netSalary = $emp->base_salary + $allowanceEarned + $overtimeEarned + $scPerEmployee - $totalDeductions;
                $totalDisbursed += $netSalary;

                $payslip = Payslip::updateOrCreate(
                    ['payroll_period_id' => $period->id, 'employee_id' => $emp->id],
                    [
                        'total_attendance_days' => $daysPresent,
                        'total_late_minutes' => $totalLateMin,
                        'total_overtime_hours' => $totalOtHours,
                        'base_salary_earned' => $baseEarned,
                        'allowance_earned' => $allowanceEarned,
                        'overtime_earned' => $overtimeEarned,
                        'service_charge_bonus' => $scPerEmployee,
                        'deductions_amount' => $totalDeductions,
                        'net_salary' => $netSalary,
                    ]
                );

                $payslip->items()->delete();
                $items = [
                    ['type' => 'EARNING', 'description' => "Gaji Pokok Bulanan ({$daysInMonth} Hari)", 'amount' => $emp->base_salary],
                    ['type' => 'EARNING', 'description' => "Uang Kehadiran ({$daysPresent} Hari)", 'amount' => $allowanceEarned],
                    ['type' => 'EARNING', 'description' => "Lembur ({$totalOtHours} Jam)", 'amount' => $overtimeEarned],
                    ['type' => 'BONUS', 'description' => 'Bagi Hasil Service Charge', 'amount' => $scPerEmployee],
                ];
                if ($absenceDeduction > 0) {
                    $items[] = ['type' => 'DEDUCTION', 'description' => "Potongan Mangkir ({$unpaidAbsenceDays} Hari)", 'amount' => $absenceDeduction];
                }
                if ($lateDeduction > 0) {
                    $items[] = ['type' => 'DEDUCTION', 'description' => "Potongan Terlambat ({$totalLateMin} Menit)", 'amount' => $lateDeduction];
                }
                foreach ($items as $item) {
                    PayslipItem::create(array_merge($item, ['payslip_id' => $payslip->id]));
                }
            }

            $period->update(['total_disbursed' => $totalDisbursed, 'status' => 'CALCULATED']);

            return response()->json([
                'status' => 'success',
                'message' => 'Payroll berhasil dihitung.',
                'data' => $period->load('payslips.items', 'payslips.employee.user'),
            ]);
        });
    }
}
