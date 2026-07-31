import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import Layout from "../components/Layout";
import { PieChart, Loader2, AlertCircle } from "lucide-react";
import API_BASE_URL from "../config";

function Expenses() {
    const { token, colors, t } = useApp();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchExpenses();
    }, [token]);

    const fetchExpenses = () => {
        setLoading(true);
        fetch(`${API_BASE_URL}/api/ledger/summary/`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
        .then(async (res) => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to load expenses data.");
            return data;
        })
        .then((data) => {
            setSummary(data.summary);
            setLoading(false);
        })
        .catch((err) => {
            setError(err.message || "Error loading expense summary.");
            setLoading(false);
        });
    };

    if (loading) {
        return (
            <Layout>
                <div className="h-96 flex items-center justify-center">
                    <Loader2 className={`animate-spin text-${colors.primary}`} size={32} />
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded flex items-center gap-2">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            </Layout>
        );
    }

    const expenseCategories = summary?.expense_categories || [];
    const totalExpenses = expenseCategories.reduce((sum, c) => sum + c.amount, 0);

    // Donut calculations
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
        
        const colorsList = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#6b7280", "#14b8a6"];
        const sliceColor = colorsList[index % colorsList.length];

        return {
            path: `M ${startX * 50} ${startY * 50} A 50 50 0 ${largeArcFlag} 1 ${endX * 50} ${endY * 50} L 0 0`,
            color: sliceColor,
            category: cat.category,
            amount: cat.amount
        };
    });

    return (
        <Layout>
            <div className="bg-white border border-slate-200 rounded shadow-sm p-6">
                
                {/* Header */}
                <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                    <PieChart size={20} className={`text-${colors.primary}`} />
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{t.expenses}</h2>
                </div>

                {totalExpenses === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400">
                        {t.noActivity}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-4">
                        
                        {/* Donut graphic */}
                        <div className="flex flex-col items-center">
                            <div className="w-52 h-52 relative">
                                <svg viewBox="-60 -60 120 120" className="w-full h-full transform -rotate-90">
                                    {donutSlices.map((slice, index) => (
                                        <path key={index} d={slice.path} fill={slice.color} />
                                    ))}
                                    <circle cx={0} cy={0} r={32} fill="#fff" />
                                </svg>
                            </div>
                            <div className="mt-6 text-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Expenses</span>
                                <h3 className="text-3xl font-extrabold text-slate-900 mt-1">₹{totalExpenses.toLocaleString("en-IN")}</h3>
                            </div>
                        </div>

                        {/* Details Breakdown */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Category Wise Distribution</h4>
                            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-2">
                                {donutSlices.map((slice, idx) => {
                                    const pct = ((slice.amount / totalExpenses) * 100).toFixed(1);
                                    return (
                                        <div key={idx} className="py-3.5 flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2.5 font-semibold text-slate-700">
                                                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: slice.color }} />
                                                <span>{slice.category}</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-slate-900">₹{slice.amount.toLocaleString("en-IN")}</p>
                                                <p className="text-[10px] text-slate-400 mt-0.5">{pct}% of total</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                    </div>
                )}

            </div>
        </Layout>
    );
}

export default Expenses;
