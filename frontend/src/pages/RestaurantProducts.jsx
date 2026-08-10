import { useState, useEffect } from "react";
import { 
    Plus, 
    Search, 
    Edit, 
    Trash2, 
    Check, 
    X, 
    Loader2, 
    UtensilsCrossed, 
    Tag, 
    DollarSign, 
    Layers, 
    Power,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import { useApp } from "../context/AppContext";
import Layout from "../components/Layout";
import API_BASE_URL from "../config";

const DEFAULT_CATEGORIES = ["Starters", "Main Course", "Beverages", "Desserts", "Snacks", "Combos"];

function RestaurantProducts() {
    const { token } = useApp();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    
    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Form inputs
    const [formData, setFormData] = useState({
        name: "",
        category: "Main Course",
        price: "",
        is_veg: true,
        is_available: true,
        variants: [] // Array of { name: "", price: "" }
    });

    const [newVariant, setNewVariant] = useState({ name: "", price: "" });

    const fetchProducts = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/products/`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setProducts(data.products);
            }
        } catch (err) {
            console.error("Failed to load products:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [token]);

    const handleOpenAddModal = () => {
        setEditingProduct(null);
        setFormData({
            name: "",
            category: selectedCategory !== "All" ? selectedCategory : "Main Course",
            price: "",
            is_veg: true,
            is_available: true,
            variants: []
        });
        setError("");
        setShowModal(true);
    };

    const handleOpenEditModal = (prod) => {
        setEditingProduct(prod);
        setFormData({
            name: prod.name,
            category: prod.category,
            price: prod.price.toString(),
            is_veg: prod.is_veg,
            is_available: prod.is_available,
            variants: prod.variants ? [...prod.variants] : []
        });
        setError("");
        setShowModal(true);
    };

    const handleToggleAvailability = async (prod) => {
        try {
            const updatedStatus = !prod.is_available;
            const res = await fetch(`${API_BASE_URL}/api/products/${prod.id}/`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ is_available: updatedStatus })
            });
            const data = await res.json();
            if (data.success) {
                setProducts(products.map(p => p.id === prod.id ? { ...p, is_available: updatedStatus } : p));
            }
        } catch (err) {
            console.error("Failed to toggle availability:", err);
        }
    };

    const handleDeleteProduct = async (prodId) => {
        if (!window.confirm("Are you sure you want to delete this menu product?")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/products/${prodId}/`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setProducts(products.filter(p => p.id !== prodId));
            }
        } catch (err) {
            console.error("Failed to delete product:", err);
        }
    };

    const handleAddVariant = () => {
        if (!newVariant.name.trim() || !newVariant.price) return;
        setFormData({
            ...formData,
            variants: [...formData.variants, { name: newVariant.name.trim(), price: parseFloat(newVariant.price) }]
        });
        setNewVariant({ name: "", price: "" });
    };

    const handleRemoveVariant = (index) => {
        setFormData({
            ...formData,
            variants: formData.variants.filter((_, i) => i !== index)
        });
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.price) {
            setError("Product name and base price are required.");
            return;
        }

        setSaving(true);
        setError("");

        try {
            const payload = {
                name: formData.name.trim(),
                category: formData.category.trim(),
                price: parseFloat(formData.price),
                is_veg: formData.is_veg,
                is_available: formData.is_available,
                variants: formData.variants
            };

            const url = editingProduct 
                ? `${API_BASE_URL}/api/products/${editingProduct.id}/`
                : `${API_BASE_URL}/api/products/`;

            const method = editingProduct ? "PUT" : "POST";

            const res = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
                setShowModal(false);
                fetchProducts();
            } else {
                setError(data.message || "Operation failed.");
            }
        } catch (err) {
            setError("Server connection error.");
        } finally {
            setSaving(false);
        }
    };

    // Extract all unique categories present in products list + default categories
    const categoriesList = Array.from(new Set(["All", ...DEFAULT_CATEGORIES, ...products.map(p => p.category)]));

    const filteredProducts = products.filter(p => {
        const matchesCategory = selectedCategory === "All" || p.category.toLowerCase() === selectedCategory.toLowerCase();
        const matchesSearch = !searchQuery || 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            p.category.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <Layout>
            <div className="space-y-6 pb-12">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                        <div className="p-2.5 rounded-xl bg-emerald-50 text-[#1F4D3D] border border-emerald-200/60">
                            <UtensilsCrossed size={22} />
                        </div>
                        Menu & Product Management
                    </h1>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                        Manage your restaurant dishes, categories, veg/non-veg status, sizes, and stock availability.
                    </p>
                </div>

                <button
                    onClick={handleOpenAddModal}
                    style={{ backgroundColor: "var(--color-primary)" }}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold text-white shadow-sm hover:opacity-95 transition cursor-pointer"
                >
                    <Plus size={16} strokeWidth={2.5} />
                    Add Dish / Product
                </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                {/* Search */}
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search menu item or category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
                    />
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                    {categoriesList.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                                selectedCategory === cat
                                    ? "bg-slate-900 text-white shadow-xs"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Products Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200/80">
                    <Loader2 size={32} className="animate-spin text-emerald-600 mb-3" />
                    <p className="text-xs font-medium text-slate-500">Loading menu products...</p>
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200/80 text-center px-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center text-[#1F4D3D] mb-3">
                        <UtensilsCrossed size={24} />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">No dishes found</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                        {searchQuery || selectedCategory !== "All"
                            ? "No menu item matches your search filters. Try resetting filters."
                            : "Your menu is currently empty. Tap 'Add Dish / Product' to create your first menu item."}
                    </p>
                    <button
                        onClick={handleOpenAddModal}
                        style={{ backgroundColor: "var(--color-primary)" }}
                        className="mt-4 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-95 transition cursor-pointer"
                    >
                        + Add First Dish
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredProducts.map(product => (
                        <div
                            key={product.id}
                            className={`bg-white border rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 relative group shadow-xs ${
                                !product.is_available 
                                    ? "border-slate-200 opacity-75 bg-slate-50/70" 
                                    : "border-slate-200/90 hover:border-emerald-300 hover:shadow-md"
                            }`}
                        >
                            <div>
                                {/* Header badge row */}
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    {/* Veg / Non-Veg Indicator */}
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-4 h-4 rounded-xs border flex items-center justify-center ${
                                            product.is_veg ? "border-emerald-600 bg-white" : "border-rose-600 bg-white"
                                        }`}>
                                            <div className={`w-2 h-2 rounded-full ${
                                                product.is_veg ? "bg-emerald-600" : "bg-rose-600"
                                            }`} />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                            {product.is_veg ? "Veg" : "Non-Veg"}
                                        </span>
                                    </div>

                                    {/* Category tag */}
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 truncate max-w-28">
                                        {product.category}
                                    </span>
                                </div>

                                {/* Title & Price */}
                                <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
                                    {product.name}
                                </h3>

                                <div className="mt-2 flex items-baseline gap-1">
                                    <span className="text-lg font-black text-slate-900">₹{product.price}</span>
                                    {product.variants && product.variants.length > 0 && (
                                        <span className="text-[11px] font-semibold text-slate-400">
                                            ({product.variants.length} sizes)
                                        </span>
                                    )}
                                </div>

                                {/* Variants preview */}
                                {product.variants && product.variants.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                        {product.variants.map((v, idx) => (
                                            <span key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                {v.name}: ₹{v.price}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer actions */}
                            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                                {/* Availability toggle button */}
                                <button
                                    onClick={() => handleToggleAvailability(product)}
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                        product.is_available
                                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                                            : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                                    }`}
                                >
                                    <Power size={13} strokeWidth={2.5} />
                                    {product.is_available ? "In Stock" : "Out of Stock"}
                                </button>

                                {/* Edit & Delete icons */}
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleOpenEditModal(product)}
                                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                                        title="Edit product"
                                    >
                                        <Edit size={15} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteProduct(product.id)}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                        title="Delete product"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add / Edit Product Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <UtensilsCrossed size={18} className="text-emerald-600" />
                                {editingProduct ? "Edit Menu Dish" : "Add New Dish"}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {error && (
                            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium rounded-xl flex items-center gap-2">
                                <AlertCircle size={15} />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSaveProduct} className="mt-4 space-y-4">
                            {/* Product Name */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Dish Name *
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Paneer Butter Masala, Cold Coffee, Veg Burger"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            {/* Category & Price Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Category *
                                    </label>
                                    <input
                                        type="text"
                                        list="category-suggestions"
                                        placeholder="e.g. Starters, Main Course"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        required
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                                    />
                                    <datalist id="category-suggestions">
                                        {DEFAULT_CATEGORIES.map(c => <option key={c} value={c} />)}
                                    </datalist>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Base Price (₹) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="e.g. 180"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        required
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            {/* Veg/Non-Veg & Availability Toggles */}
                            <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Dietary Type</label>
                                    <div className="flex items-center gap-3">
                                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="is_veg"
                                                checked={formData.is_veg === true}
                                                onChange={() => setFormData({ ...formData, is_veg: true })}
                                                className="text-emerald-600 focus:ring-emerald-500"
                                            />
                                            <span className="text-emerald-700">Veg</span>
                                        </label>
                                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="is_veg"
                                                checked={formData.is_veg === false}
                                                onChange={() => setFormData({ ...formData, is_veg: false })}
                                                className="text-rose-600 focus:ring-rose-500"
                                            />
                                            <span className="text-rose-700">Non-Veg</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Initial Stock</label>
                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_available}
                                            onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                                            className="rounded text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <span>In Stock</span>
                                    </label>
                                </div>
                            </div>

                            {/* Size Variants / Sub-options Section */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Size / Portion Variants (Optional)
                                </label>
                                <p className="text-[11px] text-slate-500 mb-2">Add options like "Half ₹100 / Full ₹180" or "Small / Large".</p>

                                {/* Added Variants list */}
                                {formData.variants.length > 0 && (
                                    <div className="space-y-1.5 mb-3">
                                        {formData.variants.map((v, i) => (
                                            <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-800">
                                                <span>{v.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold">₹{v.price}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveVariant(i)}
                                                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Add Variant input */}
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder="Variant name (e.g. Full)"
                                        value={newVariant.name}
                                        onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400"
                                    />
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Price (₹)"
                                        value={newVariant.price}
                                        onChange={(e) => setNewVariant({ ...newVariant, price: e.target.value })}
                                        className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddVariant}
                                        className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                                    >
                                        + Add
                                    </button>
                                </div>
                            </div>

                            {/* Submit Buttons */}
                            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    style={{ backgroundColor: "var(--color-primary)" }}
                                    className="px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs hover:opacity-95 transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
                                >
                                    {saving && <Loader2 size={14} className="animate-spin" />}
                                    {editingProduct ? "Update Product" : "Save Dish"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    </Layout>
    );
}

export default RestaurantProducts;
