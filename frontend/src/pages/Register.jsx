import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, User, Mail, Lock, Eye, EyeOff, Loader2, Lock as LockIcon } from "lucide-react";
import { useApp } from "../context/AppContext";
import API_BASE_URL from "../config";

function Register() {
    const navigate = useNavigate();
    const { colors } = useApp();

    const [businessName, setBusinessName] = useState("");
    const [ownerFullName, setOwnerFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    
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
        if (!agreeToTerms) {
            setError("You must agree to the Terms and Conditions.");
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
                agreeToTerms,
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
            navigate("/otp", { state: { email } });
        })
        .catch((err) => {
            setLoading(false);
            setError(err.message || "Could not connect to server. Make sure the backend is running.");
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-50 font-sans">
            <div className="w-full max-w-md">
                <div className="bg-white border border-slate-200 rounded shadow-sm p-8 sm:p-10">
                    
                    {/* Header */}
                    <div className="text-center mb-6">
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                            Khata<span className={`text-${colors.primary}`}>Nova</span>
                        </h1>
                        <p className="mt-2 text-slate-500 text-sm">
                            Register Business Merchant Account
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-xs text-red-600 rounded">
                            {error}
                        </div>
                    )}

                    {/* Register Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        
                        {/* Business Name */}
                        <div>
                            <label className="block mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Business Name
                            </label>
                            <div className="relative">
                                <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    value={businessName}
                                    onChange={(e) => setBusinessName(e.target.value)}
                                    placeholder="e.g. Verma Retailers"
                                    className={`w-full h-11 border border-slate-200 rounded pl-10 pr-4 text-sm bg-slate-50/50 outline-none focus:bg-white focus:border-${colors.primary}`}
                                />
                            </div>
                        </div>

                        {/* Owner Full Name */}
                        <div>
                            <label className="block mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Owner Name
                            </label>
                            <div className="relative">
                                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    value={ownerFullName}
                                    onChange={(e) => setOwnerFullName(e.target.value)}
                                    placeholder="e.g. Rakesh Verma"
                                    className={`w-full h-11 border border-slate-200 rounded pl-10 pr-4 text-sm bg-slate-50/50 outline-none focus:bg-white focus:border-${colors.primary}`}
                                />
                            </div>
                        </div>

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
                                    placeholder="Min 8 characters"
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

                        {/* Confirm Password */}
                        <div>
                            <label className="block mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Re-enter password"
                                    className={`w-full h-11 border border-slate-200 rounded pl-10 pr-10 text-sm bg-slate-50/50 outline-none focus:bg-white focus:border-${colors.primary}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 transition"
                                >
                                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Terms */}
                        <div className="flex items-start gap-2 pt-2">
                            <input
                                type="checkbox"
                                id="terms"
                                checked={agreeToTerms}
                                onChange={(e) => setAgreeToTerms(e.target.checked)}
                                className={`mt-1 h-4 w-4 rounded border-slate-300 text-${colors.primary} focus:ring-${colors.primary}`}
                            />
                            <label htmlFor="terms" className="text-xs text-slate-500 leading-normal">
                                I agree to the terms and privacy conditions of KhataNova app.
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full h-11 rounded bg-${colors.primary} text-white font-semibold text-sm transition flex items-center justify-center gap-2 mt-4`}
                            style={{ backgroundColor: colors.theme === 'deep_blue' ? '#2563eb' : '#059669' }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Registering...
                                </>
                            ) : (
                                "Register Account"
                            )}
                        </button>
                    </form>

                    {/* Login Link */}
                    <div className="mt-8 text-center text-xs border-t border-slate-100 pt-6">
                        <p className="text-slate-500">
                            Already have an account?
                            <button
                                type="button"
                                onClick={() => navigate("/login")}
                                className={`ml-1.5 font-bold text-${colors.primary} hover:underline transition`}
                            >
                                Login
                            </button>
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default Register;