import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, Loader2, KeyRound } from "lucide-react";
import { useApp } from "../context/AppContext";

function ForgotPassword() {
    const navigate = useNavigate();
    const { colors } = useApp();

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email) {
            setError("Please enter your email address.");
            return;
        }
        setError("");
        setSuccessMessage("");
        setLoading(true);

        fetch("http://localhost:8000/api/auth/forgot-password/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
        })
        .then(async (res) => {
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "Failed to request reset.");
            }
            return data;
        })
        .then((data) => {
            setLoading(false);
            setSuccessMessage("Reset code sent! Redirecting...");
            setTimeout(() => {
                navigate("/reset-password", { state: { email } });
            }, 1500);
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
                        <ArrowLeft size={14} /> Back to Login
                    </button>

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className={`mx-auto w-12 h-12 rounded bg-${colors.primaryBgLight} border border-${colors.primaryBorderLight} flex items-center justify-center mb-4`}>
                            <KeyRound size={24} className={`text-${colors.primary}`} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">Forgot Password</h2>
                        <p className="mt-2 text-slate-500 text-xs leading-normal px-2">
                            Enter your registered email and we'll send a 6-digit code to verify your request.
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

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full h-11 rounded bg-${colors.primary} text-white font-semibold text-sm transition flex items-center justify-center gap-2 pt-1`}
                            style={{ backgroundColor: colors.theme === 'deep_blue' ? '#2563eb' : '#059669' }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                "Send Verification Code"
                            )}
                        </button>
                    </form>

                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;
