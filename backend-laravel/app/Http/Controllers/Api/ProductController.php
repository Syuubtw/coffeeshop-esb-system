<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\Recipe;
use App\Services\AuditService;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

#[Group(
    name: '08. Manajer (Katalog Menu & Resep)',
    description: 'Manajemen menu & kategori kopi/makanan, formula resep menu, dan ketersediaan stok.',
    weight: 8
)]
class ProductController extends Controller
{
    /**
     * Daftar Seluruh Menu Kopi / Makanan Beserta Resep
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::with(['category', 'recipes.rawMaterial'])
            ->orderBy('id', 'asc');

        if (!$request->boolean('include_inactive')) {
            $query->where('is_active', true);
        }

        $products = $query->get();

        return response()->json([
            'status' => 'success',
            'data' => $products,
        ]);
    }

    /**
     * Daftar Kategori Produk (Coffee, Non-Coffee, Food, dll)
     */
    public function categories(): JsonResponse
    {
        $categories = Category::all();

        return response()->json([
            'status' => 'success',
            'data' => $categories,
        ]);
    }

    /**
     * Tambah Menu Baru Beserta Formula Takaran Resep
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'category_id' => 'required|exists:categories,id',
            'base_price' => 'required|numeric|min:1000',
            'sku' => 'nullable|string|unique:products,sku',
            'recipes' => 'nullable|array',
            'recipes.*.raw_material_id' => 'required|exists:raw_materials,id',
            'recipes.*.qty_needed' => 'required|numeric|min:0.01',
        ]);

        return DB::transaction(function () use ($validated) {
            $sku = $validated['sku'] ?? ('PRD-' . strtoupper(Str::random(3)) . '-' . rand(100, 999));

            $product = Product::create([
                'name' => $validated['name'],
                'category_id' => $validated['category_id'],
                'sku' => $sku,
                'base_price' => $validated['base_price'],
                'is_active' => true,
                'is_daily_available' => true,
            ]);

            // Save BOM Recipes
            if (!empty($validated['recipes'])) {
                foreach ($validated['recipes'] as $recipeInput) {
                    Recipe::create([
                        'product_id' => $product->id,
                        'raw_material_id' => $recipeInput['raw_material_id'],
                        'qty_needed' => $recipeInput['qty_needed'],
                    ]);
                }
            }

            return response()->json([
                'status' => 'success',
                'message' => "Menu {$product->name} berhasil ditambahkan dan langsung aktif di Kasir & QR Meja.",
                'data' => $product->load(['category', 'recipes.rawMaterial']),
            ], 201);
        });
    }

    /**
     * Toggle Ketersediaan Stok Menu Harian (Aktif / Nonaktif)
     */
    public function toggleDaily(Request $request, int $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        $product->update([
            'is_daily_available' => !$product->is_daily_available,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Status ketersediaan menu {$product->name} diubah.",
            'data' => $product,
        ]);
    }

    /**
     * Perbarui Detail Menu, Harga Jual, dan Komposisi Resep
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:150',
            'category_id' => 'sometimes|required|exists:categories,id',
            'base_price' => 'sometimes|required|numeric|min:1000',
            'recipes' => 'nullable|array',
            'recipes.*.raw_material_id' => 'required|exists:raw_materials,id',
            'recipes.*.qty_needed' => 'required|numeric|min:0.01',
        ]);

        return DB::transaction(function () use ($product, $validated) {
            $oldPrice = $product->base_price;
            $newPrice = $validated['base_price'] ?? $oldPrice;

            $product->update([
                'name' => $validated['name'] ?? $product->name,
                'category_id' => $validated['category_id'] ?? $product->category_id,
                'base_price' => $newPrice,
            ]);

            // Update BOM recipes if provided
            if (isset($validated['recipes'])) {
                Recipe::where('product_id', $product->id)->delete();
                foreach ($validated['recipes'] as $recipeInput) {
                    Recipe::create([
                        'product_id' => $product->id,
                        'raw_material_id' => $recipeInput['raw_material_id'],
                        'qty_needed' => $recipeInput['qty_needed'],
                    ]);
                }
            }

            // Audit Log if price changed
            if ((float)$oldPrice !== (float)$newPrice) {
                AuditService::log(
                    'PRICE_CHANGED',
                    'Product',
                    $product->id,
                    "Perubahan harga menu '{$product->name}' dari Rp " . number_format($oldPrice, 0, ',', '.') . " menjadi Rp " . number_format($newPrice, 0, ',', '.'),
                    ['base_price' => $oldPrice],
                    ['base_price' => $newPrice]
                );
            }

            return response()->json([
                'status' => 'success',
                'message' => "Menu {$product->name} berhasil diperbarui. Harga baru langsung aktif untuk pesanan POS kasir & QR meja.",
                'data' => $product->load(['category', 'recipes.rawMaterial']),
            ]);
        });
    }
}

