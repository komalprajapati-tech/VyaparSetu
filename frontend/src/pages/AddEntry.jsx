import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import Layout from "../components/Layout";
import { PlusCircle, Loader2, ArrowLeft, Image as ImageIcon } from "lucide-react";
import API_BASE_URL from "../config";
 
function AddEntry() {
    const navigate = useNavigate();
    const location = useLocation();
    const { token, user, getCategories, colors, t } = useApp();
 
    const queryParams = new URLSearchParams(location.search);
    const initialType = queryParams.get("type") === "expense" ? "expense" : "income";
 
    const [type, setType] = useState(initialType); // income or expense
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("");
    const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [note, setNote] = useState("");
    const [receiptImg, setReceiptImg] = useState(""); // Base64 image
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const businessCategories = getCategories();
    const categoriesList = type === "income" ? businessCategories.income : businessCategories.expense;

    // Handle Category Auto-Selection
    useState(() => {
        if (categoriesList && categoriesList.length > 0) {
            setCategory(categoriesList[0]);
        }
    }, [type]);

    // Handle image upload mock base64 representation
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setReceiptImg(reader.result); // Base64 string
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!amount || !category || !date) {
            setError("Please fill in all required fields.");
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
        .then((data) => {
            setLoading(false);
            setSuccessMessage("Entry added successfully!");
            setTimeout(() => {
                navigate("/dashboard");
            }, 1000);
        })
        .catch((err) => {
            setLoading(false);
            setError(err.message || "Error saving entry.");
        });
    };

    return (
        <Layout>
            <div className="max-w-2xl mx-auto space-y-6">
                
                {/* Back Button */}
                <button
                    onClick={() => navigate("/dashboard")}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 font-semibold transition"
                >
                    <ArrowLeft size={14} /> Back to Dashboard
                </button>

                {/* Card Container */}
                <div className="bg-white border border-slate-200 rounded shadow-sm p-6 sm:p-8">
                    
                    {/* Header */}
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-slate-900">{t.addEntry}</h2>
                        <p className="text-xs text-slate-400 mt-1">Record a cash flow item for your ledger ledger.</p>
                    </div>

                    {/* Messages */}
                    {error && (
                        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-xs text-red-650 rounded">
                            {error}
                        </div>
                    )}
                    {successMessage && (
                        <div className={`mb-6 p-3 bg-${colors.primaryBgLight} border border-${colors.primaryBorderLight} text-xs text-${colors.primary} font-medium rounded`}>
                            {successMessage}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* Toggle Tab */}
                        <div className="flex bg-slate-100 p-1.5 rounded gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setType("income");
                                    setCategory(businessCategories.income[0]);
                                }}
                                className={`flex-1 py-2 text-center text-xs font-bold rounded transition ${type === "income" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-750"}`}
                            >
                                {t.income}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setType("expense");
                                    setCategory(businessCategories.expense[0]);
                                }}
                                className={`flex-1 py-2 text-center text-xs font-bold rounded transition ${type === "expense" ? "bg-white text-red-500 shadow-sm" : "text-slate-500 hover:text-slate-750"}`}
                            >
                                {t.expense}
                            </button>
                        </div>

                        {/* Amount */}
                        <div>
                            <label className="block mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                                {t.amount} *
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">₹</span>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full h-12 text-lg font-bold border border-slate-200 rounded pl-9 pr-4 bg-slate-50/50 outline-none focus:bg-white focus:border-slate-400"
                                />
                            </div>
                        </div>

                        {/* Category Dropdown */}
                        <div>
                            <label className="block mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                                {t.category} *
                            </label>
                            <select
                                required
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full h-11 border border-slate-200 rounded px-3 text-sm bg-slate-50/50 outline-none focus:bg-white focus:border-slate-400"
                            >
                                {categoriesList.map((cat, idx) => (
                                    <option key={idx} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* Date */}
                        <div>
                            <label className="block mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                                {t.date} *
                            </label>
                            <input
                                type="date"
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full h-11 border border-slate-200 rounded px-3 text-sm bg-slate-50/50 outline-none focus:bg-white"
                            />
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                                {t.note}
                            </label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Enter description..."
                                rows="3"
                                className="w-full border border-slate-200 rounded p-3 text-sm bg-slate-50/50 outline-none focus:bg-white"
                            />
                        </div>

                        {/* Receipt Upload */}
                        <div>
                            <label className="block mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                                {t.uploadReceipt}
                            </label>
                            <div className="border border-dashed border-slate-250 rounded p-4 flex flex-col items-center justify-center bg-slate-50/30 hover:bg-slate-50/55 transition relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                                {receiptImg ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <img src={receiptImg} alt="Receipt Preview" className="h-20 object-contain rounded border border-slate-100" />
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setReceiptImg("");
                                            }}
                                            className="text-[10px] text-red-500 font-bold hover:underline"
                                        >
                                            Remove Photo
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <ImageIcon size={24} className="text-slate-400 mb-1" />
                                        <span className="text-xs text-slate-500 font-medium">Click to upload image</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full h-11 rounded bg-${colors.primary} text-white font-semibold text-sm transition flex items-center justify-center gap-2 pt-1`}
                            style={{ backgroundColor: colors.theme === 'deep_blue' ? '#2563eb' : '#059669' }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <PlusCircle size={16} />
                                    {t.submit}
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
