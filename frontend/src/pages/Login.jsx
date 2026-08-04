import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2, Wallet } from "lucide-react";
import { useApp } from "../context/AppContext";
import API_BASE_URL from "../config";

function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { loginUser } = useApp();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [toastMessage, setToastMessage] = useState(location.state?.message || "");

    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => {
                setToastMessage("");
                window.history.replaceState({}, document.title);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email || !password) {
            setError("Please fill in all fields.");
            return;
        }
        setError("");
        setLoading(true);

        fetch(`${API_BASE_URL}/api/auth/login/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        })
        .then(async (res) => {
            const data = await res.json();
            if (!res.ok) {
                if (res.status === 403) {
                    navigate("/otp", { state: { email } });
                    return;
                }
                throw new Error(data.message || "Login failed.");
            }
            return data;
        })
        .then((data) => {
            if (data) {
                setLoading(false);
                loginUser(data.accessToken, data.refreshToken, data.user);
                // Redirect user based on businessType presence
                if (data.user?.businessType) {
                    navigate("/dashboard");
                } else {
                    navigate("/select-business");
                }
            }
        })
        .catch((err) => {
            setLoading(false);
            setError(err.message || "Could not connect to server. Make sure the backend is running.");
        });
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-[#f8fafc] font-sans text-slate-700">
            {toastMessage && (
                <div className="fixed top-5 right-5 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-lg font-semibold text-sm flex items-center gap-2 z-50">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    {toastMessage}
                </div>
            )}

            {/* Top Logo */}
            <div className="flex items-center gap-2.5 mb-8">
                <div className="w-10 h-10 rounded-xl bg-[#475569] flex items-center justify-center text-white shadow-sm">
                    <Wallet size={22} className="stroke-[2.2]" />
                </div>
                <span className="text-2xl font-bold text-slate-900 tracking-tight">VyaparSetu</span>
            </div>

            {/* Main Form Card */}
            <div className="w-full max-w-[440px] bg-white rounded-3xl shadow-lg shadow-slate-200/40 p-8 sm:p-10 border border-slate-200/90">
                
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        Welcome Back
                    </h1>
                    <p className="mt-2 text-slate-500 text-sm font-normal max-w-[280px] mx-auto leading-relaxed">
                        Sign in to access your ledger book & account.
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-3 bg-red-50 border border-red-100 text-xs text-red-600 rounded-xl">
                        {error}
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    
                    {/* SECTION: LOGIN CREDENTIALS */}
                    <div className="space-y-3">
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            ACCOUNT CREDENTIALS
                        </span>

                        {/* Email */}
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

                        {/* Password */}
                        <div className="relative">
                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
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
                    </div>

                    {/* Forgot Password */}
                    <div className="flex justify-end pt-1">
                        <button
                            type="button"
                            onClick={() => navigate("/forgot-password")}
                            className="text-xs font-semibold text-emerald-600 hover:underline transition"
                        >
                            Forgot Password?
                        </button>
                    </div>

                    {/* Sign In Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 rounded-2xl bg-[#00a86b] hover:bg-[#00965e] active:scale-[0.99] text-white font-semibold text-sm transition-all duration-200 shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 mt-4"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Signing In...
                            </>
                        ) : (
                            "Sign In"
                        )}
                    </button>
                </form>

                {/* Register Link Divider & Button */}
                <div className="mt-8 text-center text-xs border-t border-slate-100 pt-6">
                    <p className="text-slate-500">
                        New merchant?{" "}
                        <button
                            type="button"
                            onClick={() => navigate("/")}
                            className="font-bold text-slate-700 hover:text-emerald-600 hover:underline transition"
                        >
                            Register Business
                        </button>
                    </p>
                </div>

            </div>
        </div>
    );
}

export default Login;