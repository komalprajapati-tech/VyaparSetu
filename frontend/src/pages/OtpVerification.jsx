import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ShieldCheck, ArrowLeft, Loader2, Wallet } from "lucide-react";
import { useApp } from "../context/AppContext";
import API_BASE_URL from "../config";

function OtpVerification() {
    const navigate = useNavigate();
    const location = useLocation();
    const { loginUser } = useApp();

    const email = location.state?.email || "your email";
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [timer, setTimer] = useState(30);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const inputs = useRef([]);

    useEffect(() => {
        if (timer === 0) return;
        const interval = setInterval(() => {
            setTimer((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [timer]);

    const handleChange = (value, index) => {
        if (!/^[0-9]?$/.test(value)) return;
        const updatedOtp = [...otp];
        updatedOtp[index] = value;
        setOtp(updatedOtp);

        if (value && index < 5) {
            inputs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace") {
            if (otp[index] === "" && index > 0) {
                const updatedOtp = [...otp];
                updatedOtp[index - 1] = "";
                setOtp(updatedOtp);
                inputs.current[index - 1].focus();
            } else if (otp[index] !== "") {
                const updatedOtp = [...otp];
                updatedOtp[index] = "";
                setOtp(updatedOtp);
            }
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").trim();
        if (!/^\d{6}$/.test(pasted)) return;

        const values = pasted.split("");
        setOtp(values);
        inputs.current[5].focus();
    };

    const handleVerify = (e) => {
        e.preventDefault();
        const otpCode = otp.join("");
        if (otpCode.length < 6) {
            setError("Please enter the full 6-digit OTP code.");
            return;
        }
        setError("");
        setLoading(true);

        fetch(`${API_BASE_URL}/api/auth/verify-otp/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, otp: otpCode }),
        })
        .then(async (res) => {
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "Verification failed.");
            }
            return data;
        })
        .then((data) => {
            setLoading(false);
            setSuccessMessage("Email verified successfully! Redirecting...");
            
            // Log user in automatically
            loginUser(data.accessToken, data.refreshToken, data.user);
            
            navigate("/select-business", { replace: true });
        })
        .catch((err) => {
            setLoading(false);
            setError(err.message || "Invalid OTP code. Please try again.");
        });
    };

    const handleResend = () => {
        if (timer > 0) return;
        setError("");
        setSuccessMessage("");
        setTimer(30);

        fetch(`${API_BASE_URL}/api/auth/resend-otp/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
        })
        .then(async (res) => {
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "Failed to resend code.");
            }
            setSuccessMessage("OTP sent successfully to your email.");
        })
        .catch((err) => {
            setError(err.message || "Failed to resend code.");
        });
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-[#f8fafc] font-sans text-slate-700">
            {/* Top Logo */}
            <div className="flex items-center gap-2.5 mb-8">
                <div className="w-10 h-10 rounded-xl bg-[#475569] flex items-center justify-center text-white shadow-sm">
                    <Wallet size={22} className="stroke-[2.2]" />
                </div>
                <span className="text-2xl font-bold text-slate-900 tracking-tight">VyaparSetu</span>
            </div>

            {/* Main Form Card */}
            <div className="w-full max-w-[440px] bg-white rounded-3xl shadow-lg shadow-slate-200/40 p-8 sm:p-10 border border-slate-200/90">
                
                {/* Back Link */}
                <button
                    onClick={() => navigate("/login")}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-600 font-semibold mb-6 transition"
                >
                    <ArrowLeft size={14} /> Back to Login
                </button>

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4 text-emerald-600 shadow-sm">
                        <ShieldCheck size={26} />
                    </div>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Verify OTP</h1>
                    <p className="mt-2 text-slate-500 text-sm font-normal max-w-[280px] mx-auto leading-relaxed">
                        Enter the 6-digit code sent to <br /><span className="font-semibold text-slate-800">{email}</span>
                    </p>
                </div>

                {/* Feedback Messages */}
                {error && (
                    <div className="mb-6 p-3 bg-red-50 border border-red-100 text-xs text-red-600 rounded-xl">
                        {error}
                    </div>
                )}
                {successMessage && (
                    <div className="mb-6 p-3 bg-emerald-50 border border-emerald-100 text-xs text-emerald-700 font-medium rounded-xl">
                        {successMessage}
                    </div>
                )}

                {/* OTP Inputs Form */}
                <form onSubmit={handleVerify} className="space-y-6">
                    <div className="flex justify-between gap-2" onPaste={handlePaste}>
                        {otp.map((digit, idx) => (
                            <input
                                key={idx}
                                ref={(el) => (inputs.current[idx] = el)}
                                type="text"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(e.target.value, idx)}
                                onKeyDown={(e) => handleKeyDown(e, idx)}
                                className="w-12 h-13 text-center text-xl font-bold border border-slate-200/60 rounded-2xl bg-[#f1f5f9]/70 text-slate-800 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                            />
                        ))}
                    </div>

                    {/* Verify Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 rounded-2xl bg-[#00a86b] hover:bg-[#00965e] active:scale-[0.99] text-white font-semibold text-sm transition-all duration-200 shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 mt-4"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Verifying...
                            </>
                        ) : (
                            "Verify & Continue"
                        )}
                    </button>
                </form>

                {/* Resend Action */}
                <div className="mt-8 text-center text-xs border-t border-slate-100 pt-6">
                    {timer > 0 ? (
                        <p className="text-slate-400">
                            Resend code in <span className="font-semibold text-slate-600">{timer}s</span>
                        </p>
                    ) : (
                        <button
                            onClick={handleResend}
                            className="font-bold text-emerald-600 hover:underline transition"
                        >
                            Resend OTP Code
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}

export default OtpVerification;