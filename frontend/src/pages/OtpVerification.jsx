import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ShieldCheck, ArrowLeft, Loader2, Lock } from "lucide-react";
import { useApp } from "../context/AppContext";

function OtpVerification() {
    const navigate = useNavigate();
    const location = useLocation();
    const { loginUser, colors } = useApp();

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

        fetch("http://localhost:8000/api/auth/verify-otp/", {
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
            
            // Log user in
            loginUser(data.accessToken, data.refreshToken, data.user);
            
            setTimeout(() => {
                navigate("/select-business");
            }, 1500);
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

        fetch("http://localhost:8000/api/auth/resend-otp/", {
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
                            <ShieldCheck size={24} className={`text-${colors.primary}`} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">Verify OTP</h2>
                        <p className="mt-2 text-slate-500 text-xs leading-normal px-2">
                            Enter the 6-digit code sent to <br /><span className="font-semibold text-slate-700">{email}</span>
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
                                    className={`w-11 h-12 text-center text-lg font-bold border border-slate-200 rounded bg-slate-50/50 outline-none focus:bg-white focus:border-${colors.primary} focus:ring-1 focus:ring-${colors.primary}`}
                                />
                            ))}
                        </div>

                        {/* Verify Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full h-11 rounded bg-${colors.primary} text-white font-semibold text-sm transition flex items-center justify-center gap-2`}
                            style={{ backgroundColor: colors.theme === 'deep_blue' ? '#2563eb' : '#059669' }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                "Verify & Continue"
                            )}
                        </button>
                    </form>

                    {/* Resend Action */}
                    <div className="mt-8 text-center text-xs">
                        {timer > 0 ? (
                            <p className="text-slate-400">
                                Resend code in <span className="font-semibold text-slate-600">{timer}s</span>
                            </p>
                        ) : (
                            <button
                                onClick={handleResend}
                                className={`font-bold text-${colors.primary} hover:underline transition`}
                            >
                                Resend OTP Code
                            </button>
                        )}
                    </div>

                    {/* Security Info */}
                    <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
                        <Lock size={10} /> Secure Identity Verification
                    </div>

                </div>
            </div>
        </div>
    );
}

export default OtpVerification;