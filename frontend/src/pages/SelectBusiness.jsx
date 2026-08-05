import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Utensils, Briefcase, Loader2, ArrowRight, LogOut, BookOpen } from "lucide-react";
import { useApp } from "../context/AppContext";

function SelectBusiness() {
    const navigate = useNavigate();
    const { token, updateProfile, t, logoutUser } = useApp();
    const [loadingType, setLoadingType] = useState("");
    const [error, setError] = useState("");

    const businessOptions = [
        {
            id: "retailer",
            title: t.retailer,
            desc: "For general stores, boutiques, supermarkets, mobile shops, pharmacies, etc.",
            icon: ShoppingBag,
            delay: "120ms"
        },
        {
            id: "food",
            title: t.foodBusiness,
            desc: "For restaurants, cafes, food trucks, catering, dhabas, bakery shops, etc.",
            icon: Utensils,
            delay: "260ms"
        },
        {
            id: "service",
            title: t.serviceProvider,
            desc: "For consultants, agencies, salons, tutors, repair shops, developers, etc.",
            icon: Briefcase,
            delay: "400ms"
        }
    ];

    const handleSelect = async (typeId) => {
        if (!token) {
            // User is creating a new account -> Navigate to register with selected category
            navigate("/register", { state: { businessType: typeId } });
            return;
        }

        // User is logged in (e.g. updating profile or first-time login without category)
        setLoadingType(typeId);
        setError("");
        const success = await updateProfile({ businessType: typeId });
        setLoadingType("");
        if (success) {
            navigate("/dashboard");
        } else {
            setError("Failed to set business type. Your login session may have expired. Redirecting...");
            setTimeout(() => {
                logoutUser();
                navigate("/login");
            }, 3000);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 font-sans relative overflow-hidden bg-[#f8fafc]">
            {/* Subtle background ambient blur circles matching dashboard palette */}
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-emerald-100/50 opacity-60 filter blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-teal-100/40 opacity-50 filter blur-3xl pointer-events-none" />

            <div className="w-full max-w-5xl z-10">
                
                {/* Header with Welcome Entrance Animation */}
                <div className="text-center mb-12 animate-welcome-entrance flex flex-col items-center">
                    {/* Brand Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 shadow-xs mb-5">
                        <div className="w-6 h-6 rounded-lg bg-[#1F4D3D] flex items-center justify-center text-white">
                            <BookOpen size={14} className="stroke-[2.5]" />
                        </div>
                        <span className="text-xs font-semibold text-[#1F4D3D] tracking-wide">
                            Welcome to Vyapar<span className="text-[#10b981]">Setu</span>
                        </span>
                    </div>

                    {/* Main Hero Heading */}
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                        Select Your <span className="bg-gradient-to-r from-[#1F4D3D] to-emerald-600 bg-clip-text text-transparent">Business Type</span>
                    </h1>
                    
                    {error && (
                        <div className="mt-4 max-w-md mx-auto p-3.5 bg-red-50 border border-red-200 text-xs text-red-700 font-medium rounded-lg shadow-sm">
                            {error}
                        </div>
                    )}
                    
                    <p className="text-slate-500 text-sm sm:text-base max-w-lg mx-auto leading-relaxed font-normal mt-3">
                        Choose the category that best describes your store to customize your ledger & entries.
                    </p>
                </div>

                {/* Cards Grid with Staggered Entrance Animations */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {businessOptions.map((option) => {
                        const Icon = option.icon;
                        const isThisLoading = loadingType === option.id;
                        return (
                            <button
                                key={option.id}
                                disabled={!!loadingType}
                                onClick={() => handleSelect(option.id)}
                                style={{
                                    animationDelay: option.delay,
                                }}
                                className="animate-card-entrance bg-white border border-slate-200/90 rounded-2xl p-8 text-left hover:border-emerald-500 transition-all duration-300 group flex flex-col justify-between h-80 cursor-pointer disabled:opacity-75 disabled:pointer-events-none relative overflow-hidden transform hover:-translate-y-1.5 shadow-sm hover:shadow-md"
                            >
                                 {/* Decorative Accent Line at top of card */}
                                <div style={{ backgroundColor: "var(--color-primary)" }} className="absolute top-0 left-0 right-0 h-1.5 opacity-90 transition-all duration-300" />

                                <div>
                                    {/* Icon Container */}
                                    <div 
                                        style={{ backgroundColor: "var(--color-primary-light)", borderColor: "var(--color-primary-border)", color: "var(--color-primary)" }}
                                        className="w-14 h-14 rounded-full border flex items-center justify-center mb-6 transition-all duration-300 shadow-xs"
                                    >
                                        <Icon size={26} strokeWidth={2} />
                                    </div>
                                    
                                    <h3 style={{ color: "var(--color-primary)" }} className="text-xl font-bold transition-colors">
                                        {option.title}
                                    </h3>
                                    
                                    <p className="text-slate-500 text-xs sm:text-sm mt-3 leading-relaxed">
                                        {option.desc}
                                    </p>
                                </div>

                                {/* Call to action pill button */}
                                <div className="mt-8">
                                    <div 
                                        style={{ backgroundColor: "var(--color-primary)" }}
                                        className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-full text-xs font-semibold text-white shadow-sm transition-all duration-200"
                                    >
                                        {isThisLoading ? (
                                            <>
                                                <Loader2 size={15} className="animate-spin" />
                                                <span>Setting Up...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Select Category</span>
                                                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

            </div>
        </div>
    );
}

export default SelectBusiness;
