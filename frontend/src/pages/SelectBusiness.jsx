import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Utensils, Briefcase, Loader2, ArrowRight } from "lucide-react";
import { useApp } from "../context/AppContext";

function SelectBusiness() {
    const navigate = useNavigate();
    const { updateProfile, colors, t, logoutUser } = useApp();
    const [loadingType, setLoadingType] = useState("");
    const [error, setError] = useState("");

    const businessOptions = [
        {
            id: "retailer",
            title: t.retailer,
            desc: "For general stores, boutiques, supermarkets, mobile shops, pharmacies, etc.",
            icon: ShoppingBag,
            color: "blue"
        },
        {
            id: "food",
            title: t.foodBusiness,
            desc: "For restaurants, cafes, food trucks, catering, dhabas, bakery shops, etc.",
            icon: Utensils,
            color: "amber"
        },
        {
            id: "service",
            title: t.serviceProvider,
            desc: "For consultants, agencies, salons, tutors, repair shops, developers, etc.",
            icon: Briefcase,
            color: "indigo"
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
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 font-sans">
            <div className="w-full max-w-4xl">
                
                {/* Title */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        {t.selectBusinessType}
                    </h1>
                    {error && (
                        <div className="mt-4 max-w-md mx-auto p-3 bg-red-50 border border-red-200 text-xs text-red-650 font-bold rounded">
                            {error}
                        </div>
                    )}
                    <p className="mt-3 text-slate-500 text-sm max-w-lg mx-auto leading-relaxed">
                        {t.selectBusinessDesc}
                    </p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {businessOptions.map((option) => {
                        const Icon = option.icon;
                        const isThisLoading = loadingType === option.id;
                        return (
                            <button
                                key={option.id}
                                disabled={!!loadingType}
                                onClick={() => handleSelect(option.id)}
                                className="bg-white border border-slate-200 rounded p-8 text-left shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 group flex flex-col justify-between h-72 cursor-pointer disabled:opacity-75 disabled:pointer-events-none"
                            >
                                <div>
                                    {/* Icon Container */}
                                    <div className="w-12 h-12 rounded bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 mb-6 group-hover:bg-slate-100 transition">
                                        <Icon size={24} />
                                    </div>
                                    
                                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-slate-900">
                                        {option.title}
                                    </h3>
                                    
                                    <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                                        {option.desc}
                                    </p>
                                </div>

                                <div className={`flex items-center gap-2 text-xs font-bold text-${colors.primary} mt-6`}>
                                    {isThisLoading ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            Setting Up...
                                        </>
                                    ) : (
                                        <>
                                            Select Category
                                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className="text-center mt-10">
                    <button
                        onClick={() => {
                            logoutUser();
                            navigate("/login");
                        }}
                        className="text-xs font-semibold text-slate-500 hover:text-red-650 hover:underline cursor-pointer transition"
                    >
                        Sign out / Switch Account
                    </button>
                </div>

            </div>
        </div>
    );
}

export default SelectBusiness;
