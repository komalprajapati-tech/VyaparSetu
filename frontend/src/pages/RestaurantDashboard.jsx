import { useState, useEffect } from "react";
import { 
    Utensils, 
    TrendingUp, 
    Receipt, 
    DollarSign, 
    ShoppingBag, 
    ArrowUpRight, 
    ArrowDownRight, 
    Calendar, 
    Loader2, 
    Plus, 
    Clock, 
    Award,
    PieChart,
    PlusCircle
} from "lucide-react";
import { useApp } from "../context/AppContext";
import Layout from "../components/Layout";
import API_BASE_URL from "../config";
import { useNavigate } from "react-router-dom";

function RestaurantDashboard() {
    const { token, user, selectedDate } = useApp();
    const navigate = useNavigate();
    const [filterRange, setFilterRange] = useState("today"); // "today", "week", "month", "year"
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    // Quick entry modal/form state
    const [quickType, setQuickType] = useState("income");
    const [quickAmount, setQuickAmount] = useState("");
    const [quickCategory, setQuickCategory] = useState("Restaurant Sales");
    const [quickNote, setQuickNote] = useState("");
    const [quickSaving, setQuickSaving] = useState(false);
    const [quickSuccess, setQuickSuccess] = useState("");

    const fetchSummary = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/restaurant/summary/?range=${filterRange}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setSummary(data.summary);
            }
        } catch (err) {
            console.error("Error fetching restaurant summary:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, [filterRange, token]);

    const handleQuickSubmit = async (e) => {
        e.preventDefault();
        if (!quickAmount) return;

        setQuickSaving(true);
        setQuickSuccess("");

        try {
            const dateStr = new Date().toISOString().split('T')[0];
            const payload = {
                amount: parseFloat(quickAmount),
                type: quickType,
                category: quickCategory,
                date: dateStr,
                note: quickNote,
                business_type: "food"
            };

            const res = await fetch(`${API_BASE_URL}/api/entries/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
                setQuickAmount("");
                setQuickNote("");
                setQuickSuccess("Entry added successfully!");
                fetchSummary();
                setTimeout(() => setQuickSuccess(""), 3000);
            }
        } catch (err) {
            console.error("Error submitting quick entry:", err);
        } finally {
            setQuickSaving(false);
        }
    };

    // Calculate max sales value for trend chart height scaling
    const maxSales = summary?.trend ? Math.max(...summary.trend.map(t => t.sales), 100) : 100;

    return (
        <Layout>
            <div className="space-y-6 pb-12">
            {/* Header & Filter Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                        <div className="p-2.5 rounded-xl bg-emerald-50 text-[#1F4D3D] border border-emerald-200/60">
                            <Utensils size={22} />
                        </div>
                        Food Business Dashboard
                    </h1>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                        Live counter sales performance, net profit analysis, and top-selling dishes.
                    </p>
                </div>

                {/* Range Filter Buttons */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                    {["today", "week", "month", "year"].map(r => (
                        <button
                            key={r}
                            onClick={() => setFilterRange(r)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                                filterRange === r
                                    ? "bg-white text-slate-900 shadow-xs"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            {/* Metric Cards Row (4 Cards) */}
            {loading ? (
                <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-slate-200/80">
                    <Loader2 size={30} className="animate-spin text-emerald-600 mb-2" />
                    <span className="text-xs text-slate-500 font-medium ml-2">Loading metrics...</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Today / Period Sales */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                {filterRange === "today" ? "Today's Sales" : `${filterRange} Sales`}
                            </span>
                            <div className="p-2 rounded-xl bg-emerald-50 text-[#1F4D3D]">
                                <Receipt size={18} />
                            </div>
                        </div>

                        <div className="mt-3">
                            <div className="text-2xl font-black text-slate-900">
                                ₹{summary?.period_sales?.toFixed(2) || "0.00"}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 font-medium">
                                From {summary?.bills_count || 0} bills generated
                            </p>
                        </div>
                    </div>

                    {/* Net Profit / Loss */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Net Profit / Loss
                            </span>
                            <div className={`p-2 rounded-xl ${
                                (summary?.net_profit || 0) >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                            }`}>
                                <TrendingUp size={18} />
                            </div>
                        </div>

                        <div className="mt-3">
                            <div className={`text-2xl font-black ${
                                (summary?.net_profit || 0) >= 0 ? "text-emerald-700" : "text-rose-600"
                            }`}>
                                ₹{summary?.net_profit?.toFixed(2) || "0.00"}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 font-medium">
                                Total Income - Total Expenses
                            </p>
                        </div>
                    </div>

                    {/* Average Bill Value */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Avg Bill Value
                            </span>
                            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
                                <DollarSign size={18} />
                            </div>
                        </div>

                        <div className="mt-3">
                            <div className="text-2xl font-black text-slate-900">
                                ₹{summary?.avg_bill_value?.toFixed(2) || "0.00"}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 font-medium">
                                Revenue per customer ticket
                            </p>
                        </div>
                    </div>

                    {/* Bills Count */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Total Bills
                            </span>
                            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                                <ShoppingBag size={18} />
                            </div>
                        </div>

                        <div className="mt-3">
                            <div className="text-2xl font-black text-slate-900">
                                {summary?.bills_count || 0}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 font-medium">
                                Counter orders completed
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Grid: Top Products & Sales Chart (2 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Top-Selling Dishes Widget (5 cols) */}
                <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <Award size={18} className="text-amber-500" />
                                    Top Selling Dishes
                                </h3>
                                <p className="text-xs text-slate-500 font-medium">Most popular items by quantity sold.</p>
                            </div>

                            <button
                                onClick={() => navigate("/restaurant/products")}
                                className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                            >
                                Manage Menu
                            </button>
                        </div>

                        <div className="mt-4 space-y-3">
                            {!summary?.top_products || summary.top_products.length === 0 ? (
                                <div className="py-12 text-center text-xs text-slate-400 font-medium">
                                    No sales records for selected timeframe.
                                </div>
                            ) : (
                                summary.top_products.map((prod, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-[#1F4D3D] text-xs font-black flex items-center justify-center">
                                                #{idx + 1}
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-900">{prod.name}</h4>
                                                <p className="text-[11px] text-slate-500 font-medium">{prod.quantity} orders sold</p>
                                            </div>
                                        </div>

                                        <span className="text-xs font-black text-slate-900">
                                            ₹{prod.revenue.toFixed(2)}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Quick Billing Action Button */}
                    <button
                        onClick={() => navigate("/restaurant/billing")}
                        style={{ backgroundColor: "var(--color-primary)" }}
                        className="mt-6 w-full py-3.5 rounded-xl text-xs font-bold text-white shadow-sm hover:opacity-95 transition cursor-pointer flex items-center justify-center gap-2"
                    >
                        <Receipt size={16} />
                        <span>Open Billing Counter</span>
                    </button>
                </div>

                {/* Right: Sales Trend SVG Chart & Quick Entry (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Sales Trend Bar Chart Card */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <TrendingUp size={18} className="text-emerald-600" />
                                    Sales Performance Trend
                                </h3>
                                <p className="text-xs text-slate-500 font-medium">Revenue timeline breakdown ({filterRange}).</p>
                            </div>
                        </div>

                        {/* SVG Bar Visualization */}
                        <div className="mt-6 h-48 flex items-end justify-between gap-2 px-2 border-b border-slate-200 pb-2">
                            {summary?.trend && summary.trend.length > 0 ? (
                                summary.trend.map((point, idx) => {
                                    const heightPct = Math.max(8, (point.sales / maxSales) * 100);
                                    return (
                                        <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                                            {/* Tooltip on hover */}
                                            <div className="opacity-0 group-hover:opacity-100 transition text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded shadow-xs mb-1">
                                                ₹{point.sales}
                                            </div>
                                            <div 
                                                style={{ height: `${heightPct}%`, backgroundColor: "var(--color-primary)" }}
                                                className="w-full rounded-t-md opacity-90 group-hover:opacity-100 transition-all duration-300"
                                            />
                                            <span className="text-[10px] font-semibold text-slate-500 truncate max-w-10">
                                                {point.label}
                                            </span>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="w-full flex items-center justify-center text-xs text-slate-400 font-medium py-12">
                                    No chart data available.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Income / Expense Card */}
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
                        <div className="pb-3 border-b border-slate-100">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <PlusCircle size={18} className="text-emerald-600" />
                                Quick Expense / Income Entry
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">Log raw material purchases, milk, vegetables, or general operational expenses.</p>
                        </div>

                        {quickSuccess && (
                            <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-bold rounded-xl">
                                {quickSuccess}
                            </div>
                        )}

                        <form onSubmit={handleQuickSubmit} className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">Type</label>
                                <select
                                    value={quickType}
                                    onChange={(e) => setQuickType(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                                >
                                    <option value="expense">Expense (-)</option>
                                    <option value="income">Income (+)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">Amount (₹)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={quickAmount}
                                    onChange={(e) => setQuickAmount(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">Note / Supplier</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Milk & Dairy"
                                    value={quickNote}
                                    onChange={(e) => setQuickNote(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                                />
                            </div>

                            <div className="flex items-end">
                                <button
                                    type="submit"
                                    disabled={quickSaving}
                                    style={{ backgroundColor: "var(--color-primary)" }}
                                    className="w-full py-2.5 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-95 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                                >
                                    {quickSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                    Log Entry
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </Layout>
    );
}

export default RestaurantDashboard;
