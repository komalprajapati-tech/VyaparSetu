import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import Layout from "../components/Layout";
import { Loader2, ArrowLeft, Image as ImageIcon, Check, Calendar, FileText, IndianRupee, Tag, CheckCircle2 } from "lucide-react";
import API_BASE_URL from "../config";
 
function AddEntry() {
    const navigate = useNavigate();
    const location = useLocation();
    const { token, user, getCategories, t } = useApp();
 
    const queryParams = new URLSearchParams(location.search);
    const initialType = queryParams.get("type") === "expense" ? "expense" : "income";
 
    const [type, setType] = useState(initialType);
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("");
    const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [note, setNote] = useState("");
    const [receiptImg, setReceiptImg] = useState("");
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const businessCategories = getCategories();
    const categoriesList = type === "income" ? businessCategories.income : businessCategories.expense;

    useEffect(() => {
        if (categoriesList && categoriesList.length > 0) {
            setCategory(categoriesList[0]);
        }
    }, [type]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setReceiptImg(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!amount || !category || !date) {
            setError("Please fill in required fields.");
            return;
        }
        setError("");
        setSuccessMessage("");
        setLoading(true);

        fetch(`${API_BASE_URL}/api/entries/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                amount: parseFloat(amount),
                type,
                category,
                date,
                note,
                receipt_img: receiptImg,
                business_type: user?.businessType || "retailer"
            })
        })
        .then(async (res) => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to save entry");
            return data;
        })
        .then(() => {
            setLoading(false);
            setSuccessMessage("Entry added successfully!");
            setTimeout(() => {
                navigate("/dashboard");
            }, 800);
        })
        .catch((err) => {
            setLoading(false);
            setError(err.message || "Error saving entry.");
        });
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto min-h-[calc(100vh-6rem)] md:h-[calc(100vh-6rem)] flex flex-col justify-center py-2 px-2 sm:px-4">
                
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 px-1">
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80 px-3 py-1.5 rounded-xl shadow-2xs transition-all cursor-pointer"
                    >
                        <ArrowLeft size={14} /> Back
                    </button>

                    {/* Segmented Type Picker Header */}
                    <div className="flex bg-slate-200/60 p-1 rounded-2xl w-full sm:w-64 shadow-inner">
                        <button
                            type="button"
                            onClick={() => {
                                setType("income");
                                if (businessCategories.income.length) setCategory(businessCategories.income[0]);
                            }}
                            className={`flex-1 py-1.5 text-center text-xs font-black rounded-xl transition-all cursor-pointer ${
                                type === "income" 
                                    ? "bg-[#00a86b] text-white shadow-md shadow-emerald-600/20" 
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            + Income
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setType("expense");
                                if (businessCategories.expense.length) setCategory(businessCategories.expense[0]);
                            }}
                            className={`flex-1 py-1.5 text-center text-xs font-black rounded-xl transition-all cursor-pointer ${
                                type === "expense" 
                                    ? "bg-rose-500 text-white shadow-md shadow-rose-500/20" 
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            - Expense
                        </button>
                    </div>
                </div>

                {/* Compact Glass Card */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
                    
                    {/* Top Decorative accent line */}
                    <div className={`absolute top-0 left-0 w-full h-1.5 transition-colors duration-300 ${type === 'income' ? 'bg-[#00a86b]' : 'bg-rose-500'}`} />

                    {/* Alert Notifications */}
                    {error && (
                        <div className="mb-3 px-3 py-2 bg-rose-50 border border-rose-200/80 text-xs font-bold text-rose-600 rounded-xl flex items-center gap-2">
                            <span>⚠️</span> {error}
                        </div>
                    )}
                    {successMessage && (
                        <div className="mb-3 px-3 py-2 bg-emerald-50 border border-emerald-200/80 text-xs font-bold text-emerald-700 rounded-xl flex items-center gap-2">
                            <CheckCircle2 size={16} /> {successMessage}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        
                        {/* Hero Amount Input Section */}
                        <div className="bg-slate-50/80 border border-slate-200/60 rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center relative group focus-within:bg-white focus-within:border-emerald-500 transition-all">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">
                                Enter {type.toUpperCase()} Amount
                            </span>
                            <div className="flex items-center justify-center gap-1 w-full">
                                <span className={`text-xl sm:text-2xl font-black ${type === 'income' ? 'text-[#00a86b]' : 'text-rose-500'}`}>₹</span>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    autoFocus
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0"
                                    className="w-full max-w-[160px] sm:max-w-[200px] text-2xl sm:text-3xl font-black text-slate-900 text-center bg-transparent outline-none placeholder:text-slate-300"
                                />
                            </div>
                        </div>

                        {/* Category Select Pills Grid */}
                        <div>
                            <label className="flex items-center gap-1.5 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                <Tag size={12} /> Select Category *
                            </label>
                            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-1">
                                {categoriesList.map((cat, idx) => {
                                    const isSelected = category === cat;
                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setCategory(cat)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                                                isSelected 
                                                    ? type === 'income'
                                                        ? "bg-emerald-50 text-[#00a86b] border-[#00a86b] shadow-2xs"
                                                        : "bg-rose-50 text-rose-600 border-rose-500 shadow-2xs"
                                                    : "bg-slate-50 text-slate-600 border-slate-200/70 hover:bg-slate-100"
                                            }`}
                                        >
                                            {isSelected && <Check size={12} strokeWidth={3} />}
                                            {cat}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Date and Note Grid Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Date Field */}
                            <div>
                                <label className="flex items-center gap-1.5 mb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                    <Calendar size={12} /> Transaction Date *
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full h-11 border border-slate-200/80 rounded-xl px-3 text-xs font-bold bg-slate-50/50 outline-none focus:bg-white focus:border-slate-400 transition-all text-slate-800"
                                />
                            </div>

                            {/* Note Field */}
                            <div>
                                <label className="flex items-center gap-1.5 mb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                    <FileText size={12} /> Notes / Remark
                                </label>
                                <input
                                    type="text"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Add description..."
                                    className="w-full h-11 border border-slate-200/80 rounded-xl px-3 text-xs font-medium bg-slate-50/50 outline-none focus:bg-white focus:border-slate-400 transition-all text-slate-800"
                                />
                            </div>
                        </div>

                        {/* Receipt Upload Bar */}
                        <div>
                            <div className="border border-dashed border-slate-200/80 rounded-xl p-2.5 flex items-center justify-between bg-slate-50/40 hover:bg-slate-50 transition relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                        <ImageIcon size={16} />
                                    </div>
                                    <span className="text-xs font-semibold text-slate-600">
                                        {receiptImg ? "Receipt Attached" : "Attach Bill / Receipt Photo"}
                                    </span>
                                </div>
                                {receiptImg ? (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setReceiptImg("");
                                        }}
                                        className="text-xs font-bold text-rose-500 hover:underline z-10"
                                    >
                                        Remove
                                    </button>
                                ) : (
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                        Upload
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Action Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full h-12 rounded-2xl text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
                                type === 'income' 
                                    ? 'bg-[#00a86b] hover:bg-[#00965e] shadow-emerald-600/25' 
                                    : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/25'
                            }`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Saving Transaction...
                                </>
                            ) : (
                                <>
                                    Save {type === 'income' ? 'Income' : 'Expense'} Entry
                                </>
                            )}
                        </button>

                    </form>
                </div>
            </div>
        </Layout>
    );
}

export default AddEntry;
