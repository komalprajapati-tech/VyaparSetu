import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import Layout from "../components/Layout";
import { BookOpen, UserPlus, Send, CheckCircle, AlertCircle, Loader2, Calendar } from "lucide-react";
import API_BASE_URL from "../config";

function Udhaar() {
    const { token, user, colors, t } = useApp();
    const [udhaarList, setUdhaarList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Form inputs for new Udhaar entry
    const [customerName, setCustomerName] = useState("");
    const [amount, setAmount] = useState("");
    const [dueDate, setDueDate] = useState("");
    
    const [actionLoading, setActionLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        fetchUdhaar();
    }, [token]);

    const fetchUdhaar = () => {
        setLoading(true);
        fetch(`${API_BASE_URL}/api/udhaar/?status=pending`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
        .then(async (res) => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to load credits");
            return data;
        })
        .then((data) => {
            setUdhaarList(data.udhaar);
            setLoading(false);
        })
        .catch((err) => {
            setError(err.message || "Error loading credits.");
            setLoading(false);
        });
    };

    const handleAddUdhaar = (e) => {
        e.preventDefault();
        if (!customerName || !amount) {
            alert("Customer Name and Amount are required.");
            return;
        }
        setActionLoading(true);
        setError("");

        fetch(`${API_BASE_URL}/api/udhaar/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                customer_name: customerName,
                amount: parseFloat(amount),
                due_date: dueDate || null
            })
        })
        .then(async (res) => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to add credit record.");
            return data;
        })
        .then((data) => {
            setActionLoading(false);
            setCustomerName("");
            setAmount("");
            setDueDate("");
            setSuccessMessage("Credit entry added successfully.");
            setTimeout(() => setSuccessMessage(""), 3000);
            fetchUdhaar();
        })
        .catch((err) => {
            setActionLoading(false);
            setError(err.message || "Error adding credit.");
        });
    };

    const handleMarkPaid = (id) => {
        if (!window.confirm("Are you sure you want to mark this credit as paid?")) return;
        
        fetch(`${API_BASE_URL}/api/udhaar/${id}/`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                status: "paid"
            })
        })
        .then(async (res) => {
            if (!res.ok) throw new Error("Failed to update status");
            fetchUdhaar();
        })
        .catch((err) => {
            alert(err.message || "Error updating record.");
        });
    };

    const handleSendReminder = (customer) => {
        const businessName = user?.businessName || "our business";
        const message = `Hello ${customer.customer_name}, this is a friendly reminder that an outstanding payment of ₹${customer.amount} is due for ${businessName}${customer.due_date ? ` on ${customer.due_date}` : ""}. Kindly clear it at your earliest convenience. Thank you!`;
        const encodedText = encodeURIComponent(message);
        
        // Open WhatsApp API link
        window.open(`https://api.whatsapp.com/send?text=${encodedText}`, "_blank");
    };

    return (
        <Layout>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Form to Add Credit (Left pane) */}
                <div className="bg-white border border-slate-200 rounded shadow-sm p-6 h-fit">
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                        <UserPlus size={18} className={`text-${colors.primary}`} />
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{t.addCustomer}</h3>
                    </div>

                    {successMessage && (
                        <div className={`mb-4 p-3 bg-${colors.primaryBgLight} border border-${colors.primaryBorderLight} text-xs text-${colors.primary} font-medium rounded`}>
                            {successMessage}
                        </div>
                    )}

                    <form onSubmit={handleAddUdhaar} className="space-y-4">
                        {/* Name */}
                        <div>
                            <label className="block mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.customerName} *</label>
                            <input
                                type="text"
                                required
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="Customer full name..."
                                className="w-full h-10 border border-slate-200 rounded px-3 text-xs outline-none focus:border-slate-400"
                            />
                        </div>

                        {/* Amount */}
                        <div>
                            <label className="block mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.amount} *</label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="₹ 0.00"
                                className="w-full h-10 border border-slate-200 rounded px-3 text-xs outline-none focus:border-slate-400"
                            />
                        </div>

                        {/* Due Date */}
                        <div>
                            <label className="block mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.dueDate}</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full h-10 border border-slate-200 rounded px-3 text-xs outline-none focus:border-slate-400"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={actionLoading}
                            style={{ backgroundColor: "var(--color-primary)" }}
                            className="w-full h-10 rounded text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 pt-0.5 cursor-pointer hover:opacity-90 active:scale-98"
                        >
                            {actionLoading ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                "Record Credit Entry"
                            )}
                        </button>
                    </form>
                </div>

                {/* Credit Ledger Table (Right pane) */}
                <div className="bg-white border border-slate-200 rounded shadow-sm p-6 lg:col-span-2">
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                        <BookOpen size={18} className={`text-${colors.primary}`} />
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{t.udhaar}</h3>
                    </div>

                    {loading ? (
                        <div className="h-44 flex items-center justify-center">
                            <Loader2 className={`animate-spin text-${colors.primary}`} size={24} />
                        </div>
                    ) : error ? (
                        <div className="p-4 bg-red-50 border border-red-200 text-xs text-red-650 flex items-center gap-2 rounded">
                            <AlertCircle size={16} /> {error}
                        </div>
                    ) : udhaarList.length === 0 ? (
                        <div className="py-12 text-center text-xs text-slate-400">
                            {t.noUdhaar}
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {udhaarList.map((customer) => {
                                const isOverdue = customer.due_date && new Date(customer.due_date) < new Date();
                                return (
                                    <div key={customer.id} className="py-4 flex flex-wrap items-center justify-between gap-4">
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900">{customer.customer_name}</h4>
                                            <div className="flex items-center gap-1 text-[10px] text-slate-450 mt-1">
                                                <Calendar size={11} />
                                                <span>Recorded: {customer.created_at}</span>
                                                {customer.due_date && (
                                                    <>
                                                        <span className="mx-1">•</span>
                                                        <span className={isOverdue ? "text-red-500 font-semibold" : ""}>
                                                            Due: {customer.due_date} {isOverdue && "(Overdue)"}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-red-500">₹{customer.amount.toLocaleString("en-IN")}</p>
                                                <span className="text-[9px] bg-red-50 text-red-550 border border-red-100 rounded px-1.5 py-0.5 font-bold uppercase">Pending</span>
                                            </div>

                                            {/* Action triggers */}
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleSendReminder(customer)}
                                                    className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-250 transition"
                                                    title={t.sendReminder}
                                                >
                                                    <Send size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleMarkPaid(customer.id)}
                                                    className={`h-8 px-3 rounded text-xs font-semibold bg-${colors.primaryBgLight} text-${colors.primary} border border-${colors.primaryBorderLight} hover:bg-${colors.primary} hover:text-white transition flex items-center gap-1`}
                                                >
                                                    <CheckCircle size={14} />
                                                    {t.markPaid}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>
        </Layout>
    );
}

export default Udhaar;
