import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Building2, User, Lock, Eye, EyeOff, Loader2, ShieldCheck, Wallet } from "lucide-react";
import API_BASE_URL from "../config";

function Register() {
    const navigate = useNavigate();
    const location = useLocation();

    const [businessType, setBusinessType] = useState(location.state?.businessType || "retailer");
    const [businessName, setBusinessName] = useState("");
    const [ownerFullName, setOwnerFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!businessName || !ownerFullName || !email || !password || !confirmPassword) {
            setError("Please fill in all fields.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setError("");
        setLoading(true);

        fetch(`${API_BASE_URL}/api/auth/register/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                businessName,
                ownerFullName,
                email,
                password,
                confirmPassword,
                businessType,
            }),
        })
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.message || "Registration failed.");
                }
                return data;
            })
            .then((data) => {
                setLoading(false);
                navigate("/otp", { state: { email, businessType } });
            })
            .catch((err) => {
                setLoading(false);
                setError(err.message || "Could not connect to server. Make sure the backend is running.");
            });
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-[#f8fafc] font-sans text-slate-700">
            {/* Top Logo */}
            <div className="flex items-center gap-2.5 mb-8">
                <div className="w-10 h-10 rounded-xl bg-[#475569] flex items-center justify-center text-[#ffffff] shadow-sm">
                    <Wallet size={22} className="stroke-[2.2]" />
                </div>
                <span className="text-2xl font-bold text-slate-900 tracking-tight">VyaparSetu</span>
            </div>

            {/* Main Form Card */}
            <div className="w-full max-w-[440px] bg-white rounded-3xl shadow-lg shadow-slate-200/40 p-8 sm:p-10 border border-slate-200/90">

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        Create Merchant Account
                    </h1>
                    <p className="mt-2 text-slate-500 text-sm font-normal max-w-[280px] mx-auto leading-relaxed">
                        Join thousands of businesses managing with precision.
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-3 bg-red-50 border border-red-100 text-xs text-red-600 rounded-xl">
                        {error}
                    </div>
                )}

                {/* Register Form */}
                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* SECTION 1: BUSINESS DETAILS */}
                    <div className="space-y-3">
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            BUSINESS DETAILS
                        </span>

                        {/* Legal Business Name */}
                        <div className="relative">
                            <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                required
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                placeholder="Legal Business Name"
                                className="w-full h-12 bg-[#f1f5f9]/70 border border-slate-200/60 rounded-2xl pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                            />
                        </div>

                        {/* Legal Owner Name */}
                        <div className="relative">
                            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                required
                                value={ownerFullName}
                                onChange={(e) => setOwnerFullName(e.target.value)}
                                placeholder="Legal Owner Name"
                                className="w-full h-12 bg-[#f1f5f9]/70 border border-slate-200/60 rounded-2xl pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                            />
                        </div>
                    </div>

                    {/* SECTION 2: LOGIN CREDENTIALS */}
                    <div className="space-y-3 pt-2">
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            LOGIN CREDENTIALS
                        </span>

                        {/* Work Email Address */}
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-base font-semibold">@</span>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Work Email Address"
                                className="w-full h-12 bg-[#f1f5f9]/70 border border-slate-200/60 rounded-2xl pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                            />
                        </div>

                        {/* Choose Password */}
                        <div>
                            <div className="relative">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Choose Password"
                                    className="w-full h-12 bg-[#f1f5f9]/70 border border-slate-200/60 rounded-2xl pl-11 pr-11 text-sm text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {/* Password strength indicator bars */}
                            <div className="grid grid-cols-3 gap-2 mt-2">
                                <div className={`h-1 rounded-full ${password.length > 0 ? "bg-emerald-500" : "bg-slate-200"}`}></div>
                                <div className={`h-1 rounded-full ${password.length >= 6 ? "bg-emerald-500" : "bg-slate-200"}`}></div>
                                <div className={`h-1 rounded-full ${password.length >= 8 ? "bg-emerald-500" : "bg-slate-200"}`}></div>
                            </div>
                            <span className="block mt-1 text-[11px] text-slate-400">
                                Use 8+ characters with mixed cases
                            </span>
                        </div>

                        {/* Confirm Password */}
                        <div className="relative">
                            <ShieldCheck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm Password"
                                className="w-full h-12 bg-[#f1f5f9]/70 border border-slate-200/60 rounded-2xl pl-11 pr-11 text-sm text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Complete Registration Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{ backgroundColor: "var(--color-primary)" }}
                        className="w-full h-12 rounded-2xl active:scale-[0.99] text-white font-semibold text-sm transition-all duration-200 shadow-md flex items-center justify-center gap-2 mt-4 cursor-pointer hover:opacity-90"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Registering...
                            </>
                        ) : (
                            "Complete Registration"
                        )}
                    </button>
                </form>

                {/* Login Link Divider & Button */}
                <div className="mt-8 text-center text-xs border-t border-slate-100 pt-6">
                    <p className="text-slate-500">
                        Already have an account?{" "}
                        <button
                            type="button"
                            onClick={() => navigate("/login")}
                            className="font-bold text-slate-700 hover:text-emerald-600 hover:underline transition"
                        >
                            Login here
                        </button>
                    </p>
                </div>

            </div>
        </div>
    );
}

export default Register;