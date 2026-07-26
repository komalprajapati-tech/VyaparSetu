import { useState } from "react";
import { useApp } from "../context/AppContext";
import Layout from "../components/Layout";
import { Settings as SettingsIcon, Loader2, Save, Globe, Palette, User } from "lucide-react";
 
function Settings() {
    const { user, theme, language, setTheme, setLanguage, updateProfile, colors, t, setCustomThemeColors } = useApp();
 
    const [businessName, setBusinessName] = useState(user?.businessName || "");
    const [ownerFullName, setOwnerFullName] = useState(user?.ownerFullName || "");
    const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
    const [profilePic, setProfilePic] = useState(user?.profilePic || "");
    const [eodReminderTime, setEodReminderTime] = useState(user?.eodReminderTime || "22:00");
    const [eodReminderEnabled, setEodReminderEnabled] = useState(user?.eodReminderEnabled !== false);

    const handleProfilePicChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePic(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
 
    const [customPrimary, setCustomPrimary] = useState(() => localStorage.getItem("lekhbook_custom_primary") || "#6E473B");
    const [customLight, setCustomLight] = useState(() => localStorage.getItem("lekhbook_custom_light") || "#F3EBE0");
    const [customBg, setCustomBg] = useState(() => localStorage.getItem("lekhbook_custom_bg") || "#FAF6F0");
 
    const handleCustomColorChange = (key, value) => {
        let updatedColors = {
            primary: customPrimary,
            light: customLight,
            bg: customBg
        };
        if (key === "primary") {
            setCustomPrimary(value);
            updatedColors.primary = value;
        } else if (key === "light") {
            setCustomLight(value);
            updatedColors.light = value;
        } else if (key === "bg") {
            setCustomBg(value);
            updatedColors.bg = value;
        }
 
        setCustomThemeColors(updatedColors);
    };
 
    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMessage("");
        setErrorMessage("");

        const success = await updateProfile({
            businessName,
            ownerFullName,
            phoneNumber,
            profilePic,
            eodReminderTime,
            eodReminderEnabled
        });

        setLoading(false);
        if (success) {
            setSuccessMessage(t.saveSettings + " successfully.");
        } else {
            setErrorMessage("Failed to update profile settings.");
        }
    };
 
    const handleColorThemeChange = async (colorId) => {
        setTheme(colorId);
        await updateProfile({ themeColor: colorId });
    };
 
    const handleLanguageChange = async (langId) => {
        setLanguage(langId);
        await updateProfile({ language: langId });
    };
 
    return (
        <Layout>
            <div className="max-w-2xl mx-auto space-y-6">
                
                {/* Profile Edit Card */}
                <div className="bg-white border border-[#BEB5A9]/20 rounded-2xl p-6 sm:p-8 shadow-[0_4px_16px_rgba(41,28,14,0.02)]">
                    
                    <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                        <User size={18} className="text-primary" />
                        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{t.editProfile}</h2>
                    </div>
 
                    {successMessage && (
                        <div className="mb-6 p-3 bg-primary-light border border-primary-border text-xs text-primary font-medium rounded-xl">
                            {successMessage}
                        </div>
                    )}
                    {errorMessage && (
                        <div className="mb-6 p-3 bg-red-50 border border-red-200/50 text-xs text-red-650 rounded-xl">
                            {errorMessage}
                        </div>
                    )}
 
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                        {/* Profile Picture Uploader */}
                        <div className="flex flex-col items-center gap-3 mb-6">
                            <div className="w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-emerald-400/20 shadow-md text-2xl font-bold font-sans overflow-hidden">
                                {profilePic ? (
                                    <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    ownerFullName ? ownerFullName.charAt(0).toUpperCase() : "K"
                                )}
                            </div>
                            <label className="cursor-pointer bg-slate-50 border border-slate-200 hover:bg-slate-100 transition px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs">
                                Change Photo
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleProfilePicChange} 
                                    className="hidden" 
                                />
                            </label>
                        </div>

                        {/* Email (Readonly) */}
                        <div>
                            <label className="block mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.email}</label>
                            <input
                                type="email"
                                disabled
                                value={user?.email || ""}
                                className="w-full h-11 border border-slate-200/60 rounded-xl px-3 text-xs bg-slate-50 text-slate-400 outline-none cursor-not-allowed"
                            />
                        </div>
 
                        {/* Business Name */}
                        <div>
                            <label className="block mb-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.businessName} *</label>
                            <input
                                type="text"
                                required
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                className="w-full h-11 border border-slate-200 rounded-xl px-3 text-xs outline-none focus:border-slate-350"
                            />
                        </div>
 
                        {/* Owner Full Name */}
                        <div>
                            <label className="block mb-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.ownerName} *</label>
                            <input
                                type="text"
                                required
                                value={ownerFullName}
                                onChange={(e) => setOwnerFullName(e.target.value)}
                                className="w-full h-11 border border-slate-200 rounded-xl px-3 text-xs outline-none focus:border-slate-350"
                            />
                        </div>

                        {/* Contact Number */}
                        <div>
                            <label className="block mb-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.phone || "Phone Number"}</label>
                            <input
                                type="text"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="+91 99999 99999"
                                className="w-full h-11 border border-slate-200 rounded-xl px-3 text-xs outline-none focus:border-slate-350"
                            />
                        </div>

                        {/* End-of-Day Reminder Config */}
                        <div className="pt-4 border-t border-slate-100">
                            <label className="flex items-center gap-3 cursor-pointer mb-3">
                                <input 
                                    type="checkbox"
                                    checked={eodReminderEnabled}
                                    onChange={(e) => setEodReminderEnabled(e.target.checked)}
                                    className="w-4 h-4 text-[#0cb281] border-slate-300 rounded focus:ring-[#0cb281]"
                                />
                                <span className="text-xs font-bold text-slate-700">Enable End-of-Day Reminder</span>
                            </label>
                            
                            {eodReminderEnabled && (
                                <div className="flex items-center gap-4 pl-7">
                                    <div>
                                        <label className="block mb-1.5 text-[9px] font-bold text-slate-550 uppercase tracking-wider">Reminder Time</label>
                                        <input 
                                            type="time" 
                                            value={eodReminderTime}
                                            onChange={(e) => setEodReminderTime(e.target.value)}
                                            className="h-10 px-3 border border-slate-250 rounded-xl text-xs outline-none bg-white font-bold"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-4 leading-normal">
                                        Alerts when no income entries are logged by this time.
                                    </p>
                                </div>
                            )}
                        </div>
 
                        <button
                            type="submit"
                            disabled={loading}
                            className="h-11 px-5 rounded-full bg-primary hover:bg-primary-hover text-white font-bold text-xs transition flex items-center gap-1.5 pt-0.5 shadow-xs"
                        >
                            {loading ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <>
                                    <Save size={14} />
                                    {t.saveSettings}
                                 </>
                            )}
                        </button>
                    </form>
                </div>
 
                {/* Preference Preferences Card (Theme & Lang) */}
                <div className="bg-white border border-[#BEB5A9]/20 rounded-2xl p-6 sm:p-8 space-y-8 shadow-[0_4px_16px_rgba(41,28,14,0.02)]">
                    
                    {/* Theme Picker */}
                    <div>
                        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                            <Palette size={18} className="text-primary" />
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{t.themeColor}</h3>
                        </div>
 
                        <div className="flex flex-wrap gap-3 mb-5">
                            {/* Forest Green */}
                            <button
                                type="button"
                                onClick={() => handleColorThemeChange("forest_green")}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition ${theme === "forest_green" ? "border-primary bg-primary-light text-primary" : "border-slate-200 hover:bg-slate-50 text-slate-650"}`}
                            >
                                <span className="w-3.5 h-3.5 rounded-full bg-[#1F4D3D] block" />
                                Forest Green
                            </button>
                            
                            {/* Deep Blue */}
                            <button
                                type="button"
                                onClick={() => handleColorThemeChange("deep_blue")}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition ${theme === "deep_blue" ? "border-primary bg-primary-light text-primary" : "border-slate-200 hover:bg-slate-50 text-slate-650"}`}
                            >
                                <span className="w-3.5 h-3.5 rounded-full bg-[#1E3A5F] block" />
                                Deep Blue
                            </button>

                            {/* Coffee Shop */}
                            <button
                                type="button"
                                onClick={() => handleColorThemeChange("coffee_shop")}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition ${theme === "coffee_shop" ? "border-primary bg-primary-light text-primary" : "border-slate-200 hover:bg-slate-50 text-slate-650"}`}
                            >
                                <span className="w-3.5 h-3.5 rounded-full bg-[#6E473B] block" />
                                Coffee Shop
                            </button>

                            {/* Custom Palette */}
                            <button
                                type="button"
                                onClick={() => handleColorThemeChange("custom")}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition ${theme === "custom" ? "border-primary bg-primary-light text-primary" : "border-slate-200 hover:bg-slate-50 text-slate-650"}`}
                            >
                                <span className="w-3.5 h-3.5 rounded-full bg-linear-to-r from-red-400 via-emerald-400 to-blue-400 block" />
                                Custom Palette
                            </button>
                        </div>

                        {/* Custom Palette Inputs */}
                        {theme === "custom" && (
                            <div className="bg-[#FAF6F0] p-4 rounded-2xl border border-[#BEB5A9]/20 space-y-4">
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Configure Custom Colors</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {/* Custom Primary */}
                                    <div>
                                        <label className="block mb-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Primary Accent</label>
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="color" 
                                                value={customPrimary} 
                                                onChange={(e) => handleCustomColorChange("primary", e.target.value)}
                                                className="w-8 h-8 rounded-lg cursor-pointer border border-slate-250 outline-none"
                                            />
                                            <span className="text-[10px] font-semibold text-slate-600 font-mono uppercase">{customPrimary}</span>
                                        </div>
                                    </div>
 
                                    {/* Custom Light Accent */}
                                    <div>
                                        <label className="block mb-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Light Accent / BG</label>
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="color" 
                                                value={customLight} 
                                                onChange={(e) => handleCustomColorChange("light", e.target.value)}
                                                className="w-8 h-8 rounded-lg cursor-pointer border border-slate-250 outline-none"
                                            />
                                            <span className="text-[10px] font-semibold text-slate-600 font-mono uppercase">{customLight}</span>
                                        </div>
                                    </div>
 
                                    {/* Custom Background */}
                                    <div>
                                        <label className="block mb-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Page Background</label>
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="color" 
                                                value={customBg} 
                                                onChange={(e) => handleCustomColorChange("bg", e.target.value)}
                                                className="w-8 h-8 rounded-lg cursor-pointer border border-slate-250 outline-none"
                                            />
                                            <span className="text-[10px] font-semibold text-slate-600 font-mono uppercase">{customBg}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
 
                    {/* Language Switcher */}
                    <div>
                        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                            <Globe size={18} className="text-primary" />
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{t.language}</h3>
                        </div>
 
                        <div className="flex flex-wrap gap-4">
                            {/* English */}
                            <button
                                onClick={() => handleLanguageChange("en")}
                                className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition ${language === "en" ? "border-primary bg-primary-light text-primary font-bold" : "border-slate-200 hover:bg-slate-50 text-slate-650"}`}
                            >
                                English (EN)
                            </button>
                            
                            {/* Hindi */}
                            <button
                                onClick={() => handleLanguageChange("hi")}
                                className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition ${language === "hi" ? "border-primary bg-primary-light text-primary font-bold" : "border-slate-200 hover:bg-slate-50 text-slate-650"}`}
                            >
                                हिन्दी (HI)
                            </button>

                            {/* Gujarati */}
                            <button
                                onClick={() => handleLanguageChange("gu")}
                                className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition ${language === "gu" ? "border-primary bg-primary-light text-primary font-bold" : "border-slate-200 hover:bg-slate-50 text-slate-650"}`}
                            >
                                ગુજરાતી (GU)
                            </button>
                        </div>
                    </div>
 
                </div>
 
            </div>
        </Layout>
    );
}
 
export default Settings;
