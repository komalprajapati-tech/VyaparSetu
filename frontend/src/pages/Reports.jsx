import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import Layout from "../components/Layout";
import { Search, Download, Printer, Trash2, Calendar, AlertCircle, Loader2 } from "lucide-react";

function Reports() {
    const { token, colors, t } = useApp();
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Filter states
    const [filterPreset, setFilterPreset] = useState("all"); // all, today, week, month, custom
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split("T")[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [typeFilter, setTypeFilter] = useState(""); // empty, income, expense

    // Quick totals
    const [totalIncome, setTotalIncome] = useState(0);
    const [totalExpense, setTotalExpense] = useState(0);

    useEffect(() => {
        fetchEntries();
    }, [token, filterPreset, startDate, endDate, typeFilter]);

    const getQueryDates = () => {
        const today = new Date().toISOString().split("T")[0];
        if (filterPreset === "all") return { start: "", end: "" };
        if (filterPreset === "today") return { start: today, end: today };
        if (filterPreset === "week") {
            const current = new Date();
            const first = current.getDate() - current.getDay(); // Sunday
            const firstday = new Date(current.setDate(first)).toISOString().split("T")[0];
            return { start: firstday, end: today };
        }
        if (filterPreset === "month") {
            const firstday = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
            return { start: firstday, end: today };
        }
        return { start: startDate, end: endDate };
    };

    const fetchEntries = () => {
        setLoading(true);
        const { start, end } = getQueryDates();
        let url = `http://localhost:8000/api/entries/?type=${typeFilter}`;
        if (start && end) {
            url += `&start_date=${start}&end_date=${end}`;
        }

        fetch(url, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || "Failed to load reports");
                return data;
            })
            .then((data) => {
                setEntries(data.entries);

                // Calculate sums
                let inc = 0;
                let exp = 0;
                data.entries.forEach(e => {
                    if (e.type === "income") inc += e.amount;
                    else exp += e.amount;
                });
                setTotalIncome(inc);
                setTotalExpense(exp);

                setLoading(false);
            })
            .catch((err) => {
                setError(err.message || "Error loading transactions.");
                setLoading(false);
            });
    };

    const handleDelete = (id) => {
        if (!window.confirm("Are you sure you want to delete this entry?")) return;

        fetch(`http://localhost:8000/api/entries/${id}/`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
            .then(async (res) => {
                if (!res.ok) throw new Error("Failed to delete entry");
                fetchEntries();
            })
            .catch((err) => {
                alert(err.message || "Error deleting entry.");
            });
    };

    const handleExportCsv = () => {
        const { start, end } = getQueryDates();
        let url = `http://localhost:8000/api/reports/export/?token=${token}&type=${typeFilter}`;
        if (start && end) {
            url += `&start_date=${start}&end_date=${end}`;
        }

        // Open download link
        window.open(url, "_blank");
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <Layout>
            <div className="space-y-6">

                {/* Filters Panel */}
                <div className="bg-white border border-slate-200 rounded shadow-sm p-5 space-y-4 print:hidden">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{t.reports}</h2>

                        <div className="flex gap-2">
                            <button
                                onClick={handleExportCsv}
                                className={`flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition`}
                            >
                                <Download size={14} />
                                {t.exportCsv}
                            </button>
                            <button
                                onClick={handlePrint}
                                className={`flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition`}
                            >
                                <Printer size={14} />
                                {t.printPdf}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                        {/* Preset */}
                        <div>
                            <label className="block mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-450">Date Preset</label>
                            <select
                                value={filterPreset}
                                onChange={(e) => setFilterPreset(e.target.value)}
                                className="w-full h-9 border border-slate-200 rounded px-2.5 text-xs bg-slate-50/50 outline-none focus:bg-white"
                            >
                                <option value="all">{t.all}</option>
                                <option value="today">{t.today}</option>
                                <option value="week">{t.weekly}</option>
                                <option value="month">{t.monthly}</option>
                                <option value="custom">{t.custom}</option>
                            </select>
                        </div>

                        {/* Custom Dates */}
                        {filterPreset === "custom" && (
                            <>
                                <div>
                                    <label className="block mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-450">Start Date</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full h-9 border border-slate-200 rounded px-2.5 text-xs bg-slate-50/50 outline-none focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-450">End Date</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full h-9 border border-slate-200 rounded px-2.5 text-xs bg-slate-50/50 outline-none focus:bg-white"
                                    />
                                </div>
                            </>
                        )}

                        {/* Type */}
                        <div>
                            <label className="block mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-450">Type</label>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="w-full h-9 border border-slate-200 rounded px-2.5 text-xs bg-slate-50/50 outline-none focus:bg-white"
                            >
                                <option value="">{t.all}</option>
                                <option value="income">{t.income}</option>
                                <option value="expense">{t.expense}</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Report Printable Header (Only active on window.print()) */}
                <div className="hidden print:block mb-8 text-center border-b border-slate-200 pb-4">
                    <h1 className="text-2xl font-bold">KhataNova Ledger Ledger Report</h1>
                    <p className="text-sm text-slate-500 mt-1">Generated Statement - {new Date().toLocaleDateString()}</p>
                </div>

                {/* Metrics Summary Cards */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white border border-slate-200 rounded p-4 shadow-sm text-center">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{t.income}</span>
                        <h4 className="text-lg font-bold text-emerald-600 mt-0.5">₹{totalIncome.toLocaleString("en-IN")}</h4>
                    </div>
                    <div className="bg-white border border-slate-200 rounded p-4 shadow-sm text-center">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{t.expense}</span>
                        <h4 className="text-lg font-bold text-red-500 mt-0.5">₹{totalExpense.toLocaleString("en-IN")}</h4>
                    </div>
                    <div className="bg-white border border-slate-200 rounded p-4 shadow-sm text-center">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{t.netProfit}</span>
                        <h4 className={`text-lg font-bold mt-0.5 ${(totalIncome - totalExpense) >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                            ₹{(totalIncome - totalExpense).toLocaleString("en-IN")}
                        </h4>
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="h-44 flex items-center justify-center">
                            <Loader2 className={`animate-spin text-${colors.primary}`} size={24} />
                        </div>
                    ) : error ? (
                        <div className="p-6 text-red-650 text-xs flex items-center gap-2">
                            <AlertCircle size={16} /> {error}
                        </div>
                    ) : entries.length === 0 ? (
                        <div className="p-12 text-center text-xs text-slate-400">
                            {t.noActivity}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                                        <th className="p-4">{t.date}</th>
                                        <th className="p-4">{t.category}</th>
                                        <th className="p-4">{t.note}</th>
                                        <th className="p-4 text-right">{t.amount}</th>
                                        <th className="p-4 text-center print:hidden">{t.actions}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {entries.map((entry) => (
                                        <tr key={entry.id} className="hover:bg-slate-50/50 transition">
                                            <td className="p-4 whitespace-nowrap text-slate-600">{entry.date}</td>
                                            <td className="p-4 font-bold text-slate-900">{entry.category}</td>
                                            <td className="p-4 text-slate-500 max-w-xs truncate">{entry.note || "-"}</td>
                                            <td className={`p-4 text-right font-bold ${entry.type === "income" ? "text-emerald-600" : "text-red-500"}`}>
                                                {entry.type === "income" ? "+" : "-"} ₹{entry.amount.toLocaleString("en-IN")}
                                            </td>
                                            <td className="p-4 text-center print:hidden">
                                                <button
                                                    onClick={() => handleDelete(entry.id)}
                                                    className="text-slate-400 hover:text-red-500 transition p-1"
                                                    title="Delete Entry"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </Layout>
    );
}

export default Reports;
