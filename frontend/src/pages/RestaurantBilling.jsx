import { useState, useEffect } from "react";
import { 
    Receipt, 
    Search, 
    Plus, 
    Minus, 
    Trash2, 
    Check, 
    X, 
    Printer, 
    History, 
    Utensils, 
    Loader2, 
    Percent, 
    DollarSign, 
    ShoppingBag, 
    ChevronRight,
    AlertCircle,
    Calendar
} from "lucide-react";
import { useApp } from "../context/AppContext";
import Layout from "../components/Layout";
import API_BASE_URL from "../config";

function RestaurantBilling() {
    const { token, user, apiFetch } = useApp();
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [activeCategory, setActiveCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");

    // Active bill items
    const [billItems, setBillItems] = useState([]);
    const [discount, setDiscount] = useState(0);
    const [discountType, setDiscountType] = useState("amount"); // "amount" or "percent"
    const [generatingBill, setGeneratingBill] = useState(false);
    const [billError, setBillError] = useState("");

    // Variant selector modal state
    const [variantModalProduct, setVariantModalProduct] = useState(null);

    // Generated receipt modal state
    const [activeReceipt, setActiveReceipt] = useState(null);

    // Bill history state
    const [activeTab, setActiveTab] = useState("billing"); // "billing" or "history"
    const [pastBills, setPastBills] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [historySearch, setHistorySearch] = useState("");

    const fetchProducts = async () => {
        if (!token) return;
        setLoadingProducts(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/products/`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setProducts(data.products);
            }
        } catch (err) {
            console.error("Error fetching products:", err);
        } finally {
            setLoadingProducts(false);
        }
    };

    const fetchPastBills = async () => {
        if (!token) return;
        setLoadingHistory(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/billing/history/`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setPastBills(data.bills);
            }
        } catch (err) {
            console.error("Error fetching past bills:", err);
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [token]);

    useEffect(() => {
        if (activeTab === "history") {
            fetchPastBills();
        }
    }, [activeTab, token]);

    // Categories list
    const categories = ["All", ...Array.from(new Set(products.map(p => p.category)))];

    const filteredProducts = products.filter(p => {
        const matchesCategory = activeCategory === "All" || p.category.toLowerCase() === activeCategory.toLowerCase();
        const matchesSearch = !searchQuery || 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            p.category.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // Add item to bill
    const handleAddProductToBill = (product, selectedVariant = null) => {
        if (!product.is_available) return;

        // If product has variants and no variant was passed, open variant picker
        if (product.variants && product.variants.length > 0 && !selectedVariant) {
            setVariantModalProduct(product);
            return;
        }

        const itemName = product.name;
        const variantName = selectedVariant ? selectedVariant.name : "";
        const itemPrice = selectedVariant ? selectedVariant.price : product.price;
        const itemKey = `${product.id}_${variantName}`;

        setBillItems(prev => {
            const existingIdx = prev.findIndex(item => item.key === itemKey);
            if (existingIdx >= 0) {
                const updated = [...prev];
                updated[existingIdx].quantity += 1;
                return updated;
            } else {
                return [...prev, {
                    key: itemKey,
                    productId: product.id,
                    name: itemName,
                    variant: variantName,
                    price: itemPrice,
                    quantity: 1
                }];
            }
        });

        if (variantModalProduct) {
            setVariantModalProduct(null);
        }
    };

    const handleUpdateQuantity = (key, delta) => {
        setBillItems(prev => {
            return prev.map(item => {
                if (item.key === key) {
                    const newQty = item.quantity + delta;
                    return newQty > 0 ? { ...item, quantity: newQty } : null;
                }
                return item;
            }).filter(Boolean);
        });
    };

    const handleRemoveItem = (key) => {
        setBillItems(prev => prev.filter(item => item.key !== key));
    };

    // Calculations
    const subtotal = billItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const calculatedDiscount = discountType === "percent" 
        ? (subtotal * (parseFloat(discount) || 0)) / 100 
        : (parseFloat(discount) || 0);
    const grandTotal = Math.max(0, subtotal - calculatedDiscount);

    // Finalize bill
    const handleGenerateBill = async () => {
        if (billItems.length === 0) {
            setBillError("Please add at least one dish to the bill.");
            return;
        }

        setGeneratingBill(true);
        setBillError("");

        try {
            const payload = {
                items: billItems.map(i => ({
                    name: i.name,
                    variant: i.variant,
                    price: i.price,
                    quantity: i.quantity
                })),
                discount: calculatedDiscount
            };

            const res = await apiFetch("/api/billing/generate/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            }, "Generating receipt & posting sales...");

            const data = await res.json();
            if (data.success) {
                setActiveReceipt(data.bill);
                setBillItems([]);
                setDiscount(0);
            } else {
                setBillError(data.message || "Failed to generate bill.");
            }
        } catch (err) {
            console.error("Error generating bill:", err);
            setBillError(err.message || "Server connection error.");
        } finally {
            setGeneratingBill(false);
        }
    };

    const handlePrintReceipt = () => {
        window.print();
    };

    const filteredPastBills = pastBills.filter(b => {
        if (!historySearch) return true;
        const q = historySearch.toLowerCase();
        return b.bill_number.toLowerCase().includes(q) ||
            b.items.some(i => i.name.toLowerCase().includes(q)) ||
            b.created_at.includes(q);
    });

    return (
        <Layout>
            <div className="space-y-6 pb-12">
            {/* Header & Mode Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                        <div className="p-2.5 rounded-xl bg-emerald-50 text-[#1F4D3D] border border-emerald-200/60">
                            <Receipt size={22} />
                        </div>
                        Counter Billing & POS
                    </h1>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                        Instant touch billing, line adjustments, bill generation, and receipt history.
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                    <button
                        onClick={() => setActiveTab("billing")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                            activeTab === "billing"
                                ? "bg-white text-slate-900 shadow-xs"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        <Utensils size={15} />
                        Billing Counter
                    </button>
                    <button
                        onClick={() => setActiveTab("history")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                            activeTab === "history"
                                ? "bg-white text-slate-900 shadow-xs"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        <History size={15} />
                        Bill History
                    </button>
                </div>
            </div>

            {/* BILLING VIEW */}
            {activeTab === "billing" ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Product Selection Grid (7 cols on lg) */}
                    <div className="lg:col-span-7 space-y-4">
                        {/* Search & Category Filter */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                            <div className="relative">
                                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search dish to add..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
                                />
                            </div>

                            {/* Category Pills */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                                            activeCategory === cat
                                                ? "bg-slate-900 text-white"
                                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Product Cards Grid */}
                        {loadingProducts ? (
                            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200/80">
                                <Loader2 size={28} className="animate-spin text-emerald-600 mb-2" />
                                <p className="text-xs text-slate-500 font-medium">Loading items...</p>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-14 bg-white rounded-2xl border border-slate-200/80 text-center px-4">
                                <p className="text-xs font-bold text-slate-700">No dishes available</p>
                                <p className="text-[11px] text-slate-500 mt-1">Add items under Product Management to start billing.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {filteredProducts.map(product => {
                                    const isAvailable = product.is_available;
                                    const hasVariants = product.variants && product.variants.length > 0;
                                    return (
                                        <button
                                            key={product.id}
                                            disabled={!isAvailable}
                                            onClick={() => handleAddProductToBill(product)}
                                            className={`p-3.5 bg-white border rounded-2xl text-left flex flex-col justify-between h-32 transition-all cursor-pointer relative overflow-hidden group ${
                                                isAvailable 
                                                    ? "border-slate-200/90 hover:border-emerald-500 hover:shadow-md active:scale-[0.98]" 
                                                    : "border-slate-200 bg-slate-50 opacity-60 pointer-events-none"
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-center justify-between gap-1 mb-1">
                                                    <div className={`w-3 h-3 rounded-xs border flex items-center justify-center ${
                                                        product.is_veg ? "border-emerald-600 bg-white" : "border-rose-600 bg-white"
                                                    }`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${
                                                            product.is_veg ? "bg-emerald-600" : "bg-rose-600"
                                                        }`} />
                                                    </div>

                                                    {!isAvailable && (
                                                        <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">Out of Stock</span>
                                                    )}
                                                </div>

                                                <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                                                    {product.name}
                                                </h4>
                                            </div>

                                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                                                <span className="text-sm font-black text-slate-900">₹{product.price}</span>
                                                {hasVariants ? (
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                        +{product.variants.length} Sizes
                                                    </span>
                                                ) : (
                                                    <div className="w-6 h-6 rounded-lg bg-emerald-50 group-hover:bg-[#1F4D3D] text-[#1F4D3D] group-hover:text-white flex items-center justify-center transition">
                                                        <Plus size={14} strokeWidth={2.5} />
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Current Bill & Summary (5 cols on lg) */}
                    <div className="lg:col-span-5 space-y-4 sticky top-20">
                        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between min-h-[480px]">
                            <div>
                                {/* Bill Panel Header */}
                                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                            <ShoppingBag size={18} className="text-emerald-600" />
                                            Current Bill
                                        </h3>
                                        <p className="text-[11px] text-slate-500 font-medium">{billItems.length} unique items selected</p>
                                    </div>

                                    {billItems.length > 0 && (
                                        <button
                                            onClick={() => setBillItems([])}
                                            className="text-[11px] font-bold text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg transition cursor-pointer"
                                        >
                                            Clear All
                                        </button>
                                    )}
                                </div>

                                {billError && (
                                    <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium rounded-xl flex items-center gap-1.5">
                                        <AlertCircle size={14} />
                                        {billError}
                                    </div>
                                )}

                                {/* Bill Line Items List */}
                                {billItems.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                                            <Utensils size={20} />
                                        </div>
                                        <p className="text-xs font-bold text-slate-600">Bill is empty</p>
                                        <p className="text-[11px] text-slate-400 mt-1">Tap dishes on the left panel to add them to this order.</p>
                                    </div>
                                ) : (
                                    <div className="mt-3 space-y-2 max-h-[260px] overflow-y-auto pr-1">
                                        {billItems.map(item => (
                                            <div key={item.key} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
                                                <div className="flex-1 pr-2">
                                                    <h5 className="font-bold text-slate-800 line-clamp-1">
                                                        {item.name}
                                                    </h5>
                                                    {item.variant && (
                                                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                                            {item.variant}
                                                        </span>
                                                    )}
                                                    <div className="text-[11px] text-slate-500 font-medium">₹{item.price}</div>
                                                </div>

                                                {/* Stepper & Line Total */}
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center bg-white border border-slate-200 rounded-lg">
                                                        <button
                                                            onClick={() => handleUpdateQuantity(item.key, -1)}
                                                            className="p-1 text-slate-600 hover:bg-slate-100 rounded-l-lg cursor-pointer"
                                                        >
                                                            <Minus size={13} />
                                                        </button>
                                                        <span className="px-2 font-bold text-xs text-slate-900">{item.quantity}</span>
                                                        <button
                                                            onClick={() => handleUpdateQuantity(item.key, 1)}
                                                            className="p-1 text-slate-600 hover:bg-slate-100 rounded-r-lg cursor-pointer"
                                                        >
                                                            <Plus size={13} />
                                                        </button>
                                                    </div>

                                                    <span className="font-extrabold text-slate-900 w-16 text-right">
                                                        ₹{item.price * item.quantity}
                                                    </span>

                                                    <button
                                                        onClick={() => handleRemoveItem(item.key)}
                                                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Summary & Checkout Section */}
                            <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                                {/* Subtotal */}
                                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                                    <span>Subtotal</span>
                                    <span className="text-slate-900 font-bold">₹{subtotal.toFixed(2)}</span>
                                </div>

                                {/* Discount Controls */}
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs font-semibold text-slate-600">Discount</span>
                                        <div className="flex items-center bg-slate-100 rounded-md p-0.5 border border-slate-200">
                                            <button
                                                type="button"
                                                onClick={() => setDiscountType("amount")}
                                                className={`px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer ${
                                                    discountType === "amount" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                                                }`}
                                            >
                                                ₹
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDiscountType("percent")}
                                                className={`px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer ${
                                                    discountType === "percent" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                                                }`}
                                            >
                                                %
                                            </button>
                                        </div>
                                    </div>

                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={discount || ""}
                                        onChange={(e) => setDiscount(e.target.value)}
                                        className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-right text-slate-900"
                                    />
                                </div>

                                {calculatedDiscount > 0 && (
                                    <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold">
                                        <span>Discount Savings</span>
                                        <span>- ₹{calculatedDiscount.toFixed(2)}</span>
                                    </div>
                                )}

                                {/* Grand Total */}
                                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-base font-black text-slate-900">
                                    <span>Grand Total</span>
                                    <span className="text-xl text-[#1F4D3D]">₹{grandTotal.toFixed(2)}</span>
                                </div>

                                {/* Generate Bill CTA */}
                                <button
                                    onClick={handleGenerateBill}
                                    disabled={billItems.length === 0 || generatingBill}
                                    style={{ backgroundColor: "var(--color-primary)" }}
                                    className="w-full py-3.5 rounded-xl text-xs font-bold text-white shadow-sm hover:opacity-95 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {generatingBill ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>Processing Bill...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Receipt size={16} />
                                            <span>Generate & Complete Bill</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* HISTORY VIEW */
                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Past Bills & Receipts</h3>
                            <p className="text-xs text-slate-500 font-medium">Search and review completed restaurant transactions.</p>
                        </div>

                        <div className="relative w-full sm:w-72">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by bill #, dish name..."
                                value={historySearch}
                                onChange={(e) => setHistorySearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
                            />
                        </div>
                    </div>

                    {loadingHistory ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Loader2 size={28} className="animate-spin text-emerald-600 mb-2" />
                            <p className="text-xs text-slate-500 font-medium">Loading history...</p>
                        </div>
                    ) : filteredPastBills.length === 0 ? (
                        <div className="py-12 text-center text-xs text-slate-500">
                            No past bills found.
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filteredPastBills.map(bill => (
                                <div key={bill.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 p-2 rounded-xl transition">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-xs text-slate-900">{bill.bill_number}</span>
                                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                                {bill.created_at}
                                            </span>
                                        </div>

                                        <p className="text-xs text-slate-600 mt-1 line-clamp-1">
                                            {bill.items.map(i => `${i.name}${i.variant ? ' (' + i.variant + ')' : ''} x${i.quantity}`).join(", ")}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-4">
                                        <span className="text-base font-black text-slate-900">₹{bill.grand_total.toFixed(2)}</span>
                                        <button
                                            onClick={() => setActiveReceipt(bill)}
                                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5"
                                        >
                                            <Receipt size={14} />
                                            View Receipt
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* VARIANT PICKER MODAL */}
            {variantModalProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-5 shadow-2xl animate-in fade-in zoom-in duration-150">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h4 className="font-bold text-sm text-slate-900">{variantModalProduct.name}</h4>
                                <p className="text-[11px] text-slate-500">Select portion / size variant:</p>
                            </div>
                            <button
                                onClick={() => setVariantModalProduct(null)}
                                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="mt-3 space-y-2">
                            {/* Base price option if available */}
                            <button
                                onClick={() => handleAddProductToBill(variantModalProduct, { name: "Regular", price: variantModalProduct.price })}
                                className="w-full p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 flex items-center justify-between text-xs font-bold text-slate-800 transition cursor-pointer"
                            >
                                <span>Regular</span>
                                <span className="text-emerald-700">₹{variantModalProduct.price}</span>
                            </button>

                            {variantModalProduct.variants.map((varItem, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleAddProductToBill(variantModalProduct, varItem)}
                                    className="w-full p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 flex items-center justify-between text-xs font-bold text-slate-800 transition cursor-pointer"
                                >
                                    <span>{varItem.name}</span>
                                    <span className="text-emerald-700">₹{varItem.price}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* RECEIPT MODAL */}
            {activeReceipt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-150 relative">
                        {/* Non-printable close button */}
                        <button
                            onClick={() => setActiveReceipt(null)}
                            className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer print:hidden"
                        >
                            <X size={18} />
                        </button>

                        {/* Printable Area */}
                        <div id="receipt-print-area" className="text-slate-800 font-sans space-y-4">
                            {/* Receipt Header */}
                            <div className="text-center pb-3 border-b border-dashed border-slate-300">
                                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                                    {user?.businessName || "RESTAURANT & CAFE"}
                                </h2>
                                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Tax Invoice / Cash Receipt</p>
                                <div className="mt-2 text-[10px] text-slate-400 font-mono">
                                    {activeReceipt.bill_number} | {activeReceipt.created_at}
                                </div>
                            </div>

                            {/* Table of items */}
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between font-bold text-slate-500 text-[10px] uppercase border-b pb-1">
                                    <span className="w-12">Qty</span>
                                    <span className="flex-1">Item</span>
                                    <span className="w-16 text-right">Amount</span>
                                </div>

                                {activeReceipt.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between font-medium">
                                        <span className="w-12 font-bold text-slate-900">{item.quantity}x</span>
                                        <span className="flex-1">
                                            {item.name} {item.variant ? `(${item.variant})` : ''}
                                        </span>
                                        <span className="w-16 text-right font-bold">₹{item.line_total.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Totals */}
                            <div className="pt-3 border-t border-dashed border-slate-300 space-y-1.5 text-xs">
                                <div className="flex justify-between text-slate-600">
                                    <span>Subtotal</span>
                                    <span>₹{activeReceipt.subtotal.toFixed(2)}</span>
                                </div>

                                {activeReceipt.discount > 0 && (
                                    <div className="flex justify-between text-emerald-700 font-semibold">
                                        <span>Discount</span>
                                        <span>- ₹{activeReceipt.discount.toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                                    <span>Grand Total</span>
                                    <span className="text-[#1F4D3D]">₹{activeReceipt.grand_total.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Footer note */}
                            <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-400">
                                Thank you for dining with us! Have a great day.
                            </div>
                        </div>

                        {/* Modal Action Buttons */}
                        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3 print:hidden">
                            <button
                                onClick={() => setActiveReceipt(null)}
                                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                            >
                                Close
                            </button>
                            <button
                                onClick={handlePrintReceipt}
                                style={{ backgroundColor: "var(--color-primary)" }}
                                className="px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs hover:opacity-95 transition cursor-pointer flex items-center gap-2"
                            >
                                <Printer size={15} />
                                Print Receipt
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </Layout>
    );
}

export default RestaurantBilling;
