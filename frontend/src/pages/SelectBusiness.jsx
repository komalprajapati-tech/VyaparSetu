import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Utensils, Briefcase, Loader2, ArrowRight, LogOut, BookOpen } from "lucide-react";
import { useApp } from "../context/AppContext";

function SelectBusiness() {
    const navigate = useNavigate();
    const { updateProfile, t, logoutUser } = useApp();
    const [loadingType, setLoadingType] = useState("");
    const [error, setError] = useState("");

    const businessOptions = [
        {
            id: "retailer",
            title: t.retailer,
            desc: "For general stores, boutiques, supermarkets, mobile shops, pharmacies, etc.",
            icon: ShoppingBag,
            delay: "100ms"
        },
        {
            id: "food",
            title: t.foodBusiness,
            desc: "For restaurants, cafes, food trucks, catering, dhabas, bakery shops, etc.",
            icon: Utensils,
            delay: "200ms"
        },
        {
            id: "service",
            title: t.serviceProvider,
            desc: "For consultants, agencies, salons, tutors, repair shops, developers, etc.",
            icon: Briefcase,
            delay: "300ms"
        }
    ];

    const handleSelect = async (typeId) => {
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
        <div 
            className="min-h-screen flex items-center justify-center px-4 py-12 font-sans relative overflow-hidden"
            style={{
                background: "linear-gradient(135deg, #F7F1EA 0%, #E1D4C2 100%)",
            }}
        >
            {/* Subtle background ambient blur circles */}
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#E1D4C2] opacity-40 filter blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#BEB5A9] opacity-30 filter blur-3xl pointer-events-none" />

            <div className="w-full max-w-5xl z-10 animate-fade-in">
                
                {/* Header */}
                <div className="text-center mb-12 space-y-3">
                    {/* Brand Mark / Logo Icon */}
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#E1D4C2]/60 border border-[#BEB5A9]/50 shadow-sm text-[#291C0E] mb-2">
                        <BookOpen size={26} strokeWidth={2.2} />
                    </div>

                    <h1 
                        className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-[#291C0E]"
                        style={{ fontFamily: "Georgia, Cambria, 'Times New Roman', Times, serif" }}
                    >
                        {t.selectBusinessType}
                    </h1>
                    
                    {error && (
                        <div className="mt-4 max-w-md mx-auto p-3.5 bg-red-50 border border-red-200 text-xs text-red-700 font-medium rounded-lg shadow-sm">
                            {error}
                        </div>
                    )}
                    
                    <p className="text-[#6E473B] text-sm sm:text-base max-w-xl mx-auto leading-relaxed font-normal opacity-90">
                        {t.selectBusinessDesc}
                    </p>
                </div>

                {/* Cards Grid */}
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
                                    boxShadow: "0 10px 25px -5px rgba(41, 28, 14, 0.08), 0 8px 10px -6px rgba(41, 28, 14, 0.04)"
                                }}
                                className="bg-[#FAF7F2] border border-[#E1D4C2] rounded-2xl p-8 text-left hover:border-[#6E473B] transition-all duration-300 group flex flex-col justify-between h-80 cursor-pointer disabled:opacity-75 disabled:pointer-events-none relative overflow-hidden transform hover:-translate-y-1.5"
                            >
                                {/* Decorative Accent Line at top of card */}
                                <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#6E473B] opacity-80 group-hover:opacity-100 transition-opacity" />

                                <div>
                                    {/* Icon Container */}
                                    <div className="w-14 h-14 rounded-full bg-[#BEB5A9]/30 border border-[#BEB5A9]/40 flex items-center justify-center text-[#291C0E] mb-6 group-hover:bg-[#6E473B] group-hover:text-white transition-all duration-300 shadow-sm">
                                        <Icon size={26} strokeWidth={2} />
                                    </div>
                                    
                                    <h3 
                                        className="text-xl font-bold text-[#291C0E] group-hover:text-[#6E473B] transition-colors"
                                        style={{ fontFamily: "Georgia, Cambria, 'Times New Roman', Times, serif" }}
                                    >
                                        {option.title}
                                    </h3>
                                    
                                    <p className="text-[#6E473B]/80 text-xs sm:text-sm mt-3 leading-relaxed">
                                        {option.desc}
                                    </p>
                                </div>

                                {/* Call to action pill button */}
                                <div className="mt-8">
                                    <div className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-full text-xs font-semibold bg-[#6E473B] text-white group-hover:bg-[#291C0E] shadow-sm transition-all duration-200">
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

                {/* Footer Link */}
                <div className="text-center mt-12">
                    <button
                        onClick={() => {
                            logoutUser();
                            navigate("/login");
                        }}
                        className="inline-flex items-center gap-2 text-xs font-medium text-[#6E473B]/80 hover:text-red-700 cursor-pointer transition-colors duration-150 py-2 px-4 rounded-full hover:bg-black/5"
                    >
                        <LogOut size={14} />
                        <span>Sign out / Switch Account</span>
                    </button>
                </div>

            </div>
        </div>
    );
}

export default SelectBusiness;
