import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2, KeyRound } from "lucide-react";
import { useApp } from "../context/AppContext";

function ResetPassword() {
    const navigate = useNavigate();
    const location = useLocation();
    const { colors } = useApp();

    const initialEmail = location.state?.email || "";
    const [email, setEmail] = useState(initialEmail);
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email || !otp || !newPassword || !confirmPassword) {
            setError("Please fill in all fields.");
            return;
        }
        if (newPassword.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setError("");
        setSuccessMessage("");
        setLoading(true);

        fetch("http://localhost:8000/api/auth/reset-password/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email,
                otp,
                newPassword,
            }),
        })
        .then(async (res) => {
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "Failed to reset password.");
            }
            return data;
        })
        .then((data) => {
            setLoading(false);
            setSuccessMessage("Password reset successful! Redirecting to login...");
            setTimeout(() => {
                navigate("/login", { state: { message: "Password reset successful. Please sign in." } });
            }, 1800);
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

                    {/* Back Link */}
                    <button
                        onClick={() => navigate("/login")}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 font-semibold mb-6 transition"
                    >
                        Back to Login
                    </button>

                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className={`mx-auto w-12 h-12 rounded bg-${colors.primaryBgLight} border border-${colors.primaryBorderLight} flex items-center justify-center mb-4`}>
                            <KeyRound size={24} className={`text-${colors.primary}`} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">Set New Password</h2>
                        <p className="mt-2 text-slate-500 text-xs leading-normal">
                            Enter the 6-digit OTP reset code and your new password below.
                        </p>
                    </div>

                    {/* Feedback Messages */}
                    {error && (
                        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-xs text-red-600 rounded">
                            {error}
                        </div>
                    )}
                    {successMessage && (
                        <div className={`mb-6 p-3 bg-${colors.primaryBgLight} border border-${colors.primaryBorderLight} text-xs text-${colors.primary} font-medium rounded`}>
                            {successMessage}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        
                        {/* Email */}
                        <div>
                            <label className="block mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Email Address
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@business.com"
                                className={`w-full h-11 border border-slate-200 rounded px-4 text-sm bg-slate-50/50 outline-none focus:bg-white focus:border-${colors.primary}`}
                            />
                        </div>

                        {/* OTP Code */}
                        <div>
                            <label className="block mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Reset OTP Code
                            </label>
                            <input
                                type="text"
                                required
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="Enter 6-digit code"
                                className={`w-full h-11 border border-slate-200 rounded px-4 text-sm bg-slate-50/50 outline-none focus:bg-white focus:border-${colors.primary}`}
                            />
                        </div>

                        {/* New Password */}
                        <div>
                            <label className="block mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Min 8 characters"
                                    className={`w-full h-11 border border-slate-200 rounded px-4 pr-10 text-sm bg-slate-50/50 outline-none focus:bg-white focus:border-${colors.primary}`}
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
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Re-enter new password"
                                    className={`w-full h-11 border border-slate-200 rounded px-4 pr-10 text-sm bg-slate-50/50 outline-none focus:bg-white focus:border-${colors.primary}`}
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
                                    Saving...
                                </>
                            ) : (
                                "Update Password"
                            )}
                        </button>
                    </form>

                </div>
            </div>
        </div>
    );
}

export default ResetPassword;
