import { useState } from "react";
import { useApp } from "../context/AppContext";
import Layout from "../components/Layout";
import { Palette, Check, Sparkles, Save, Loader2 } from "lucide-react";

function Appearance() {
    const { theme, setTheme, updateProfile, setCustomThemeColors } = useApp();

    const [selectedTheme, setSelectedTheme] = useState(theme || "forest_green");
    const [loading, setLoading] = useState(false);
    const [toastMessage, setToastMessage] = useState("");

    const [customPrimary, setCustomPrimary] = useState(() => localStorage.getItem("vyaparsetu_custom_primary") || "#1F4D3D");
    const [customLight, setCustomLight] = useState(() => localStorage.getItem("vyaparsetu_custom_light") || "#E8F5EC");
    const [customBg, setCustomBg] = useState(() => localStorage.getItem("vyaparsetu_custom_bg") || "#f8fafc");

    const themePresets = [
        {
            id: "forest_green",
            name: "Forest Emerald",
            desc: "Classic deep forest green with soft mint highlights",
            primary: "#1F4D3D",
            accent: "#10b981",
            bg: "#f8fafc"
        },
        {
            id: "deep_blue",
            name: "Royal Sapphire",
            desc: "Professional navy blue with crisp slate accents",
            primary: "#1E3A5F",
            accent: "#3b82f6",
            bg: "#f8fafc"
        },
        {
            id: "coffee_shop",
            name: "Warm Coffee & Mocha",
            desc: "Cozy warm brown and soft cream undertones",
            primary: "#6E473B",
            accent: "#d97706",
            bg: "#FAF6F0"
        }
    ];

    const isChanged = selectedTheme !== theme || selectedTheme === "custom";

    const handleSelectPreset = (presetId) => {
        setSelectedTheme(presetId);
    };

    const handleSaveTheme = async () => {
        setLoading(true);
        setToastMessage("");

        if (selectedTheme === "custom") {
            setCustomThemeColors({
                primary: customPrimary,
                light: customLight,
                bg: customBg
            });
        } else {
            setTheme(selectedTheme);
        }

        const success = await updateProfile({ themeColor: selectedTheme });
        setLoading(false);
        if (success) {
            setToastMessage("Theme applied & saved successfully!");
            setTimeout(() => setToastMessage(""), 3000);
        } else {
            setToastMessage("Theme applied!");
            setTimeout(() => setToastMessage(""), 3000);
        }
    };

    const handleCustomColorChange = (key, value) => {
        let updated = { primary: customPrimary, light: customLight, bg: customBg };
        if (key === "primary") {
            setCustomPrimary(value);
            updated.primary = value;
        } else if (key === "light") {
            setCustomLight(value);
            updated.light = value;
        } else if (key === "bg") {
            setCustomBg(value);
            updated.bg = value;
        }
        setSelectedTheme("custom");
    };

    return (
        <Layout>
            <div className="max-w-3xl mx-auto space-y-7 font-sans pb-8 relative">

                {/* Toast Notification */}
                {toastMessage && (
                    <div className="fixed top-20 right-6 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl font-bold text-xs flex items-center gap-2 z-50 border border-slate-700/60 animate-in slide-in-from-top-4">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        {toastMessage}
                    </div>
                )}
                
                {/* Page Title */}
                <div className="flex items-center gap-3 border-b border-slate-200/80 pb-4">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100/80 border border-emerald-200 text-[#1F4D3D] flex items-center justify-center shadow-xs">
                        <Palette size={20} className="stroke-[2.2]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Appearance & Theme</h1>
                        <p className="text-xs text-slate-500 font-normal">Customize colors, visual theme accents, and display styles across the entire application.</p>
                    </div>
                </div>

                {/* Theme Presets */}
                <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <Sparkles size={14} className="text-emerald-600" />
                            Theme Presets
                        </h2>
                        <span className="text-xs text-slate-400 font-normal">Choose your workspace vibe</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {themePresets.map((t) => {
                            const isSelected = selectedTheme === t.id;
                            const isCurrentlyActive = theme === t.id;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => handleSelectPreset(t.id)}
                                    className={`p-5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between h-40 cursor-pointer relative overflow-hidden group ${
                                        isSelected 
                                            ? "border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-md" 
                                            : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-2">
                                            <span className="w-4 h-4 rounded-full shadow-2xs border border-white" style={{ backgroundColor: t.primary }} />
                                            <span className="w-4 h-4 rounded-full shadow-2xs border border-white" style={{ backgroundColor: t.accent }} />
                                        </div>
                                        {isCurrentlyActive && (
                                            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs" title="Currently Active Theme">
                                                <Check size={14} strokeWidth={3} />
                                            </span>
                                        )}
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-emerald-800 transition">{t.name}</h3>
                                        <p className="text-[11px] text-slate-500 leading-relaxed mt-1">{t.desc}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Save Button below Presets */}
                    <div className="pt-2 flex justify-end">
                        <button
                            onClick={handleSaveTheme}
                            disabled={loading}
                            style={{ backgroundColor: "var(--color-accent)" }}
                            className="px-6 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-sm text-white cursor-pointer active:scale-95 disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={15} className="animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={15} />
                                    Save Theme
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Custom Accent Palette */}
                <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
                    <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Custom Color Palette</h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Primary Accent Color</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={customPrimary}
                                    onChange={(e) => handleCustomColorChange("primary", e.target.value)}
                                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 p-0.5"
                                />
                                <span className="text-xs font-mono font-bold text-slate-600">{customPrimary}</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Light Tint Highlight</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={customLight}
                                    onChange={(e) => handleCustomColorChange("light", e.target.value)}
                                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 p-0.5"
                                />
                                <span className="text-xs font-mono font-bold text-slate-600">{customLight}</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Background Backdrop</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={customBg}
                                    onChange={(e) => handleCustomColorChange("bg", e.target.value)}
                                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 p-0.5"
                                />
                                <span className="text-xs font-mono font-bold text-slate-600">{customBg}</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </Layout>
    );
}

export default Appearance;
