import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import Layout from "../components/Layout";
import API_BASE_URL from "../config";
import { 
    ArrowUpRight, 
    ArrowDownRight, 
    Loader2, 
    IndianRupee, 
    AlertCircle,
    ShoppingBag,
    Utensils,
    Briefcase,
    Tag,
    Home,
    Zap,
    Truck,
    Activity,
    PlusCircle,
    Receipt,
    Package,
    Users,
    Archive,
    TrendingUp,
    AlertTriangle,
    FileText,
    BookOpen,
    PieChart,
    Plus
} from "lucide-react";


function Dashboard() {
    const navigate = useNavigate();
    const { token, user, selectedDate, setSelectedDate, dateFilter, setDateFilter, t } = useApp();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [summary, setSummary] = useState(null);
    const [hoveredPoint, setHoveredPoint] = useState(null);

    useEffect(() => {
        fetchSummary();
    }, [token, dateFilter, selectedDate]);

    const fetchSummary = () => {
        setLoading(true);
        let url = `${API_BASE_URL}/api/ledger/summary/`;
        const params = [];
        if (selectedDate) {
            params.push(`date=${selectedDate}`);
        } else if (dateFilter) {
            params.push(`period=${dateFilter}`);
        }
        if (params.length > 0) {
            url += `?${params.join("&")}`;
        }

        fetch(url, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
        .then(async (res) => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to load summary");
            return data;
        })
        .then((data) => {
            setSummary(data.summary);
            setLoading(false);
        })
        .catch((err) => {
            setError(err.message || "Could not fetch dashboard summary.");
            setLoading(false);
        });
    };

    const getCategoryIcon = (category) => {
        const cat = category.toLowerCase();
        if (cat.includes("sales") || cat.includes("income") || cat.includes("refund")) {
            return <ArrowUpRight className="text-emerald-600" size={16} strokeWidth={1.5} />;
        }
        if (cat.includes("inventory") || cat.includes("purchase") || cat.includes("groceries") || cat.includes("raw")) {
            return <ShoppingBag className="text-indigo-600" size={16} strokeWidth={1.5} />;
        }
        if (cat.includes("food") || cat.includes("kitchen") || cat.includes("restaurant") || cat.includes("dine-in") || cat.includes("delivery")) {
            return <Utensils className="text-amber-600" size={16} strokeWidth={1.5} />;
        }
        if (cat.includes("salary") || cat.includes("salaries") || cat.includes("consulting") || cat.includes("subscription")) {
            return <Briefcase className="text-blue-600" size={16} strokeWidth={1.5} />;
        }
        if (cat.includes("rent") || cat.includes("room")) {
            return <Home className="text-purple-600" size={16} strokeWidth={1.5} />;
        }
        if (cat.includes("electricity") || cat.includes("gas") || cat.includes("utility") || cat.includes("internet") || cat.includes("software")) {
            return <Zap className="text-yellow-600" size={16} strokeWidth={1.5} />;
        }
        if (cat.includes("transport") || cat.includes("travel") || cat.includes("delivery fees")) {
            return <Truck className="text-teal-600" size={16} strokeWidth={1.5} />;
        }
        if (cat.includes("tax") || cat.includes("marketing")) {
            return <Tag className="text-rose-600" size={16} strokeWidth={1.5} />;
        }
        return <Activity className="text-slate-600" size={16} strokeWidth={1.5} />;
    };

    if (loading) {
        return (
            <Layout>
                <div className="h-96 flex items-center justify-center">
                    <Loader2 className="animate-spin text-emerald-600" size={32} />
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="bg-red-50/50 border border-red-150/10 text-red-700 p-4 rounded-xl flex items-center gap-2">
                    <AlertCircle size={18} />
                    <span className="text-xs font-bold">{error}</span>
                </div>
            </Layout>
        );
    }

    const periodIncome = summary?.income || 0;
    const periodExpense = summary?.expense || 0;
    const periodNet = summary?.net || 0;
    const totalUdhaar = summary?.total_pending_udhaar || 0;

    // --- Dynamic SVG Bar Chart calculations ---
    const trend = summary?.trend || [];
    const maxVal = Math.max(...trend.map(d => Math.max(d.income, d.expense)), 100);
    const chartHeight = 180;
    const chartWidth = 500;
    const paddingLeft = 45;
    const paddingRight = 20;
    const paddingTop = 25;
    const paddingBottom = 30;

    const getX = (index) => {
        const count = trend.length;
        if (count <= 1) return paddingLeft + (chartWidth - paddingLeft - paddingRight) / 2;
        const availableW = chartWidth - paddingLeft - paddingRight;
        const step = availableW / count;
        return paddingLeft + step * index + step / 2;
    };
    const getY = (value) => chartHeight - paddingBottom - (value * (chartHeight - paddingTop - paddingBottom) / maxVal);

    // Path generators
    let incomePath = "";
    let expensePath = "";
    if (trend.length > 0) {
        incomePath = `M ${getX(0)} ${getY(trend[0].income)} ` + trend.map((d, i) => `L ${getX(i)} ${getY(d.income)}`).join(" ");
        expensePath = `M ${getX(0)} ${getY(trend[0].expense)} ` + trend.map((d, i) => `L ${getX(i)} ${getY(d.expense)}`).join(" ");
    }

    // --- Dynamic SVG Donut Chart calculations ---
    const expenseCategories = summary?.expense_categories || [];
    const totalExpenses = expenseCategories.reduce((sum, c) => sum + c.amount, 0);

    let cumulativePercent = 0;
    const getCoordinatesForPercent = (percent) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };

    const donutSlices = expenseCategories.map((cat, index) => {
        const percent = cat.amount / (totalExpenses || 1);
        const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
        cumulativePercent += percent;
        const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
        
        const largeArcFlag = percent > 0.5 ? 1 : 0;
        
        // Colors palette - Premium Emerald Slate Palette
        const colorsList = [
            "#113830", // Deep Slate Green
            "#10b981", // Emerald Green
            "#3b82f6", // Royal Blue
            "#6366f1", // Indigo
            "#f59e0b", // Amber
            "#ec4899", // Pink
            "#14b8a6", // Teal
            "#8b5cf6"  // Purple
        ];
        const sliceColor = colorsList[index % colorsList.length];

        return {
            path: `M ${startX * 50} ${startY * 50} A 50 50 0 ${largeArcFlag} 1 ${endX * 50} ${endY * 50} L 0 0`,
            color: sliceColor,
            category: cat.category,
            amount: cat.amount
        };
    });

    const getPeriodLabel = () => {
        if (selectedDate) return selectedDate;
        const filter = dateFilter?.toLowerCase() || "month";
        if (filter === "today") return t.today || "Today";
        if (filter === "week") return t.weekly || "Weekly";
        if (filter === "month") return t.monthly || "Monthly";
        if (filter === "year") return "Yearly";
        return "";
    };

    return (
        <Layout>
            <div className="space-y-6 font-sans">

                {/* Welcome back header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            Welcome back, {user?.ownerFullName ? user.ownerFullName.split(" ")[0].toLowerCase() : "kiran"}
                        </h1>
                        <div className="flex flex-wrap items-center gap-2 mt-2.5">
                            <span className="px-3 py-1 bg-slate-200/60 text-slate-600 rounded-lg text-xs font-semibold">{selectedDate || "Today"}</span>
                            <span className="px-3 py-1 bg-slate-200/60 text-slate-600 rounded-lg text-xs font-semibold">FY 2024-25</span>
                            <span className="px-3 py-1 bg-emerald-100/60 text-emerald-700 rounded-lg text-xs font-semibold">Main Branch</span>
                        </div>
                    </div>
                    
                    {/* Date Switcher */}
                    <div className="flex bg-slate-200/50 p-1 rounded-xl w-fit">
                        {["Today", "Weekly", "Monthly", "Year"].map((filter) => {
                            const filterVal = filter === "Weekly" ? "week" : filter === "Monthly" ? "month" : filter.toLowerCase();
                            const isActive = !selectedDate && dateFilter === filterVal;
                            return (
                                <button 
                                    key={filter} 
                                    onClick={() => {
                                        setSelectedDate("");
                                        setDateFilter(filterVal);
                                    }}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${isActive ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                                >
                                    {filter}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Quick Actions Card */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase flex items-center gap-2">
                            <span className="text-amber-500 text-sm">⚡</span>
                            QUICK ACTIONS
                        </h2>
                        <span className="text-xs text-slate-400 font-normal hidden sm:block">Common tasks in one click</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Quick Income */}
                        <button 
                            onClick={() => navigate("/add-entry?type=income")}
                            className="bg-[#00a86b] hover:bg-[#00965e] text-white flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl text-sm font-semibold shadow-md shadow-emerald-600/15 transition-all cursor-pointer w-full"
                        >
                            <span className="text-lg font-bold">+</span> + Quick Income
                        </button>
                        {/* Quick Expense */}
                        <button 
                            onClick={() => navigate("/add-entry?type=expense")}
                            className="bg-white hover:bg-slate-50 text-slate-700 border-2 border-dashed border-slate-200 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl text-sm font-semibold transition-all cursor-pointer w-full"
                        >
                            <span className="text-lg font-bold text-slate-500">-</span> + Quick Expense
                        </button>
                    </div>
                </div>
                
                {/* 4 Summary Metrics Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Period Income */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
                        <div className="w-full h-1 bg-emerald-500 absolute top-0 left-0" />
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">INCOME (MONTHLY)</span>
                            <div className="w-8 h-8 rounded-full bg-emerald-100/70 text-emerald-600 flex items-center justify-center font-bold text-sm">
                                $
                            </div>
                        </div>
                        <div className="mt-3">
                            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
                                ₹{periodIncome.toLocaleString("en-IN")}
                            </h3>
                            <span className="inline-flex items-center gap-1 mt-3 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 uppercase">
                                ↑ INCOME
                            </span>
                        </div>
                    </div>
 
                    {/* Period Expense */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
                        <div className="w-full h-1 bg-pink-500 absolute top-0 left-0" />
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">EXPENSE (MONTHLY)</span>
                            <div className="w-8 h-8 rounded-full bg-pink-100/70 text-pink-500 flex items-center justify-center font-bold text-sm">
                                ⊖
                            </div>
                        </div>
                        <div className="mt-3">
                            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
                                ₹{periodExpense.toLocaleString("en-IN")}
                            </h3>
                            <span className="inline-flex items-center gap-1 mt-3 text-[10px] font-bold px-2 py-0.5 rounded-md bg-pink-50 text-pink-500 uppercase">
                                ↓ EXPENSE
                            </span>
                        </div>
                    </div>
 
                    {/* Period Net */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
                        <div className="w-full h-1 bg-sky-500 absolute top-0 left-0" />
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">NET PROFIT (MONTHLY)</span>
                            <div className="w-8 h-8 rounded-full bg-sky-100/70 text-sky-600 flex items-center justify-center">
                                <TrendingUp size={16} />
                            </div>
                        </div>
                        <div className="mt-3">
                            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
                                ₹{periodNet.toLocaleString("en-IN")}
                            </h3>
                            <span className="inline-flex items-center gap-1 mt-3 text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-50 text-sky-600 uppercase">
                                ✓ PROFIT
                            </span>
                        </div>
                    </div>
 
                    {/* Credit Book Udhaar */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
                        <div className="w-full h-1 bg-amber-400 absolute top-0 left-0" />
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOTAL PENDING CREDIT</span>
                            <div className="w-8 h-8 rounded-full bg-amber-100/70 text-amber-700 flex items-center justify-center">
                                <BookOpen size={16} />
                            </div>
                        </div>
                        <div className="mt-3">
                            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
                                ₹{totalUdhaar.toLocaleString("en-IN")}
                            </h3>
                            <span className="inline-block mt-3 bg-amber-100/70 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                                OUTSTANDING
                            </span>
                        </div>
                    </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Sales vs Expense Grouped Bar Chart */}
                    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs lg:col-span-2 relative min-h-[340px] flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">SALES VS EXPENSE TREND</h4>
                            <div className="flex gap-4 text-xs font-semibold">
                                <span className="flex items-center gap-1.5 text-slate-600">
                                    <span className="w-3 h-3 bg-[#00a86b] rounded-md" /> Income
                                </span>
                                <span className="flex items-center gap-1.5 text-slate-600">
                                    <span className="w-3 h-3 bg-[#064e3b] rounded-md" /> Expense
                                </span>
                            </div>
                        </div>

                        {trend.length === 0 || maxVal === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center py-10 relative">
                                {/* Dotted Grid lines simulation */}
                                <div className="w-full space-y-8 absolute inset-0 py-6 px-4 flex flex-col justify-between opacity-30 pointer-events-none">
                                    <div className="border-b border-dashed border-slate-200 w-full" />
                                    <div className="border-b border-dashed border-slate-200 w-full" />
                                    <div className="border-b border-dashed border-slate-200 w-full" />
                                </div>
                                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mb-3 z-10">
                                    <TrendingUp size={28} className="stroke-[1.5]" />
                                </div>
                                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest z-10">
                                    AWAITING BUSINESS ACTIVITY...
                                </span>
                            </div>
                        ) : (
                            <div className="relative w-full">
                                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible">
                                     {/* Horizontal Light Grid Lines & Y-Axis Labels */}
                                     {[0.0, 0.25, 0.5, 0.75, 1.0].map((p, idx) => {
                                         const val = maxVal * p;
                                         const y = chartHeight - paddingBottom - (val * (chartHeight - paddingTop - paddingBottom) / maxVal);
                                         let label = `0`;
                                         if (val >= 1000) {
                                             label = `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k`;
                                         } else if (val > 0) {
                                             label = `${val.toFixed(0)}`;
                                         }
                                         return (
                                             <g key={idx}>
                                                 <text 
                                                     x={paddingLeft - 10} 
                                                     y={y + 3} 
                                                     textAnchor="end" 
                                                     className="text-[9px] fill-slate-350 font-semibold"
                                                 >
                                                     {label}
                                                 </text>
                                                 {p >= 0 && (
                                                     <line 
                                                         x1={paddingLeft} 
                                                         y1={y} 
                                                         x2={chartWidth - paddingRight} 
                                                         y2={y} 
                                                         stroke="#f1f5f9" 
                                                         strokeWidth={1} 
                                                     />
                                                 )}
                                             </g>
                                         );
                                     })}

                                     {/* Grouped Pill Bars */}
                                     {trend.map((d, i) => {
                                         const xGroup = getX(i);
                                         const count = trend.length;
                                         const step = (chartWidth - paddingLeft - paddingRight) / count;
                                         const barWidth = 14; // Pill rounded bar width
                                         const barGap = 4;
                                         const plotHeight = chartHeight - paddingTop - paddingBottom;
                                         const baseY = chartHeight - paddingBottom;
                                         
                                         const incomeH = Math.max((d.income * plotHeight) / maxVal, 0);
                                         const expenseH = Math.max((d.expense * plotHeight) / maxVal, 0);

                                         const incomeY = baseY - incomeH;
                                         const expenseY = baseY - expenseH;

                                         const incomeBarX = xGroup - barWidth - (barGap / 2);
                                         const expenseBarX = xGroup + (barGap / 2);

                                         return (
                                             <g key={i}>
                                                 {/* Income Bar (Light Bright Green Pill) */}
                                                 {incomeH > 0 ? (
                                                     <rect
                                                         x={incomeBarX}
                                                         y={incomeY}
                                                         width={barWidth}
                                                         height={incomeH}
                                                         rx={barWidth / 2}
                                                         ry={barWidth / 2}
                                                         fill="#00c853"
                                                         className="transition-all duration-300 hover:opacity-90"
                                                     />
                                                 ) : (
                                                     <rect
                                                         x={incomeBarX}
                                                         y={baseY - 4}
                                                         width={barWidth}
                                                         height={4}
                                                         rx={2}
                                                         ry={2}
                                                         fill="#e2e8f0"
                                                     />
                                                 )}

                                                 {/* Expense Bar (Deep Emerald Dark Green Pill) */}
                                                 {expenseH > 0 ? (
                                                     <rect
                                                         x={expenseBarX}
                                                         y={expenseY}
                                                         width={barWidth}
                                                         height={expenseH}
                                                         rx={barWidth / 2}
                                                         ry={barWidth / 2}
                                                         fill="#064e3b"
                                                         className="transition-all duration-300 hover:opacity-90"
                                                     />
                                                 ) : (
                                                     <rect
                                                         x={expenseBarX}
                                                         y={baseY - 4}
                                                         width={barWidth}
                                                         height={4}
                                                         rx={2}
                                                         ry={2}
                                                         fill="#cbd5e1"
                                                     />
                                                 )}
                                                 
                                                 {/* X Axis Date Label */}
                                                 <text x={xGroup} y={chartHeight - 6} textAnchor="middle" className="text-[9px] fill-slate-400 font-semibold pointer-events-none">
                                                     {d.date}
                                                 </text>

                                                 {/* Hover Overlay */}
                                                 <rect
                                                     x={xGroup - step / 2}
                                                     y={paddingTop}
                                                     width={step}
                                                     height={plotHeight}
                                                     fill="transparent"
                                                     className="cursor-pointer"
                                                     onMouseEnter={() => {
                                                         setHoveredPoint({
                                                             x: xGroup,
                                                             y: Math.min(incomeY, expenseY),
                                                             date: d.date,
                                                             income: d.income,
                                                             expense: d.expense,
                                                             profit: d.income - d.expense
                                                         });
                                                     }}
                                                     onMouseLeave={() => setHoveredPoint(null)}
                                                 />
                                             </g>
                                         );
                                     })}
                                </svg>
                                
                                {/* Tooltip Overlay */}
                                {hoveredPoint && (
                                    <div 
                                        className="absolute bg-slate-900/95 text-white text-[10px] p-2.5 rounded-xl shadow-xl pointer-events-none z-10 border border-white/10 backdrop-blur-xs transition-all duration-100"
                                        style={{
                                            left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                                            top: `${(hoveredPoint.y / chartHeight) * 100}%`,
                                            transform: 'translate(-50%, -115%)',
                                        }}
                                    >
                                        <p className="font-extrabold border-b border-white/15 pb-1 mb-1.5 text-center text-slate-300">{hoveredPoint.date}</p>
                                        <div className="space-y-0.5">
                                            <p className="flex justify-between gap-4"><span className="text-slate-400">Income:</span> <span className="text-emerald-400 font-bold">₹{hoveredPoint.income.toLocaleString("en-IN")}</span></p>
                                            <p className="flex justify-between gap-4"><span className="text-slate-400">Expense:</span> <span className="text-emerald-200 font-bold">₹{hoveredPoint.expense.toLocaleString("en-IN")}</span></p>
                                            <p className="flex justify-between gap-4 border-t border-white/10 pt-1 mt-1 font-bold">
                                                <span>Profit:</span> 
                                                <span className={hoveredPoint.profit >= 0 ? "text-emerald-400" : "text-rose-400"}>
                                                    ₹{hoveredPoint.profit.toLocaleString("en-IN")}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Expense Breakdown Pie/Donut Chart */}
                    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between min-h-[340px] relative">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">EXPENSE CATEGORY BREAKDOWN</h4>

                        {totalExpenses === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                                {/* Circular Dotted Line Placeholder */}
                                <div className="w-36 h-36 rounded-full border-2 border-dashed border-slate-200/80 flex items-center justify-center mb-6">
                                    <PieChart size={32} className="text-slate-300 stroke-[1.25]" />
                                </div>
                                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">
                                    NO ENTRIES RECORDED YET
                                </span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center">
                                {/* SVG Donut */}
                                <div className="w-32 h-32 relative mb-6">
                                    <svg viewBox="-60 -60 120 120" className="w-full h-full transform -rotate-90">
                                        {donutSlices.map((slice, index) => (
                                            <path key={index} d={slice.path} fill={slice.color} />
                                        ))}
                                        {/* Center hole for Donut look */}
                                        <circle cx={0} cy={0} r={36} fill="#fff" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
                                        <span className="text-xs font-black text-slate-800 mt-0.5">₹{totalExpenses.toLocaleString("en-IN")}</span>
                                    </div>
                                </div>

                                {/* Legend */}
                                <div className="w-full space-y-2 max-h-32 overflow-y-auto pr-1">
                                    {donutSlices.map((slice, index) => (
                                        <div key={index} className="flex items-center justify-between text-[11px]">
                                            <div className="flex items-center gap-2 text-slate-500 font-medium truncate">
                                                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: slice.color }} />
                                                <span className="truncate">{slice.category}</span>
                                            </div>
                                            <span className="font-bold text-slate-800">₹{slice.amount}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Floating Green Plus Button */}
                        <button
                            onClick={() => navigate("/add-entry")}
                            className="absolute bottom-4 right-4 w-12 h-12 rounded-2xl bg-[#00a86b] hover:bg-[#00965e] text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        >
                            <Plus size={26} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>

                {/* Recent Activity List */}
                <div className="bg-white border border-slate-200/50 rounded-2xl shadow-xs p-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">{t.recentActivity || "Recent Activity"}</h4>

                    {summary?.recent_activity?.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400 font-medium">
                            {t.noActivity || "No entries recorded yet."}
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {summary?.recent_activity?.map((entry) => (
                                <div 
                                    key={entry.id} 
                                    className="py-3 flex items-center justify-between hover:bg-slate-50/50 px-2 rounded-xl transition-all duration-200"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                                            {getCategoryIcon(entry.category)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-850">{entry.category}</p>
                                            {entry.note && <p className="text-[10px] text-slate-400 mt-0.5">{entry.note}</p>}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-xs font-extrabold ${entry.type === "income" ? "text-emerald-700" : "text-rose-600"}`}>
                                            {entry.type === "income" ? "+" : "-"} ₹{entry.amount.toLocaleString("en-IN")}
                                        </span>
                                        <p className="text-[9px] text-slate-400 mt-0.5 font-semibold">{entry.date}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </Layout>
    );
}

export default Dashboard;
