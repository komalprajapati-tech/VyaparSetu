import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2, Lock as LockIcon } from "lucide-react";
import { useApp } from "../context/AppContext";
import API_BASE_URL from "../config";

function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { loginUser, colors } = useApp();

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
                // Redirect user to select-business
                navigate("/select-business");
            }
        })
        .catch((err) => {
            setLoading(false);
            setError(err.message || "Could not connect to server. Make sure the backend is running.");
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-50 font-sans">
            {toastMessage && (
                <div className={`fixed top-5 right-5 bg-${colors.primary} text-white px-5 py-3 rounded border border-${colors.primary} shadow-lg font-semibold text-sm flex items-center gap-2 z-50`}>
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    {toastMessage}
                </div>
            )}

            <div className="w-full max-w-md">
                <div className="bg-white border border-slate-200 rounded shadow-sm p-8 sm:p-10">
                    
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                            Khata<span className={`text-${colors.primary}`}>Nova</span>
                        </h1>
                        <p className="mt-2 text-slate-500 text-sm">
                            Classic Profit-Loss & Ledger Book
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-xs text-red-600 rounded">
                            {error}
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        
                        {/* Email */}
                        <div>
                            <label className="block mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@business.com"
                                    className={`w-full h-11 border border-slate-200 rounded pl-10 pr-4 text-sm bg-slate-50/50 outline-none focus:bg-white focus:border-${colors.primary}`}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Password
                            </label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className={`w-full h-11 border border-slate-200 rounded pl-10 pr-10 text-sm bg-slate-50/50 outline-none focus:bg-white focus:border-${colors.primary}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 transition"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Forgot Password */}
                        <div className="flex justify-end pt-1">
                            <button
                                type="button"
                                onClick={() => navigate("/forgot-password")}
                                className={`text-xs font-semibold text-${colors.primary} hover:underline transition`}
                            >
                                Forgot Password?
                            </button>
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full h-11 rounded bg-${colors.primary} hover:bg-${colors.primary} text-white font-semibold text-sm transition flex items-center justify-center gap-2 mt-4`}
                            style={{ backgroundColor: colors.theme === 'deep_blue' ? '#2563eb' : '#059669' }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </form>

                    {/* Register Link */}
                    <div className="mt-8 text-center text-xs border-t border-slate-100 pt-6">
                        <p className="text-slate-500">
                            New merchant?
                            <button
                                type="button"
                                onClick={() => navigate("/")}
                                className={`ml-1.5 font-bold text-${colors.primary} hover:underline transition`}
                            >
                                Register Business
                            </button>
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-4 flex items-center justify-between text-[10px] text-slate-400">
                        <span>© 2026 KhataNova.</span>
                        <span className="flex items-center gap-1">
                            <LockIcon size={10} className="text-slate-400" />
                            Secure SSL
                        </span>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default Login;