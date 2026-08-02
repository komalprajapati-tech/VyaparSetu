import { useNavigate, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    PlusCircle,
    FileText,
    BookOpen,
    PieChart,
    Settings,
    LogOut,
    Plus,
    Menu,
    X,
    Search,
    Bell,
    Globe,
    Calendar,
    ChevronLeft,
    ChevronDown,
    TrendingUp
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { useState, useEffect } from "react";
import API_BASE_URL from "../config";

function Layout({ children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { token, user, logoutUser, theme, language, updateProfile, selectedDate, setSelectedDate, setDateFilter, t } = useApp();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [langOpen, setLangOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [activeToast, setActiveToast] = useState(null);

    const fetchNotifications = () => {
        if (!token) return;
        fetch(`${API_BASE_URL}/api/auth/notifications/`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                setNotifications(data.notifications);
                // Trigger Toast pop-up for unread notifications
                const unreadNotifs = data.notifications.filter(n => !n.isRead);
                if (unreadNotifs.length > 0 && !activeToast) {
                    setActiveToast(unreadNotifs[0]);
                }
            }
        })
        .catch(err => console.error("Error fetching notifications:", err));
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [token]);

    const handleMarkRead = (id) => {
        fetch(`${API_BASE_URL}/api/auth/notifications/${id}/read/`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            }
        });
    };

    const handleDismiss = (id) => {
        fetch(`${API_BASE_URL}/api/auth/notifications/${id}/dismiss/`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                setNotifications(prev => prev.filter(n => n.id !== id));
            }
        });
    };

    const handleLanguageChange = async (langId) => {
        setLangOpen(false);
        await updateProfile({ language: langId });
    };

    const getLanguageLabel = (lang) => {
        if (lang === "hi") return "हिंदी (HI)";
        if (lang === "gu") return "ગુજરાતી (GU)";
        return "English (EN)";
    };

    const navItems = [
        { name: t.dashboard || "Dashboard", path: "/dashboard", icon: LayoutDashboard },
        { name: t.addEntry || "Add Entry", path: "/add-entry", icon: PlusCircle },
        { name: t.reports || "Reports", path: "/reports", icon: FileText },
        { name: t.udhaar || "Udhaar (Credit Book)", path: "/udhaar", icon: BookOpen },
        { name: t.expenses || "Expenses", path: "/expenses", icon: PieChart },
        { name: t.settings || "Settings", path: "/settings", icon: Settings }
    ];

    const handleLogout = () => {
        logoutUser();
        navigate("/login");
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] font-sans flex text-slate-800">
            {/* Sidebar (Desktop) */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#09261e] text-white border-r border-[#09261e] transform lg:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col justify-between p-5 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
            >
                <div className="flex flex-col h-full justify-between">
                    <div>
                        {/* Logo / Header */}
                        <div className="flex items-center justify-between mb-6 px-1">
                            <div>
                                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-[#00a86b] flex items-center justify-center text-white">
                                        <TrendingUp size={18} strokeWidth={2.5} />
                                    </div>
                                    Vyapar<span className="text-[#00a86b]">Setu</span>
                                </h2>
                                <div className="mt-2 pl-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate w-40">{user?.businessName || "DEV'S STORE"}</p>
                                    <span className="inline-block bg-[#00a86b]/15 text-[#00a86b] text-[9px] font-bold px-2 py-0.5 rounded-md border border-[#00a86b]/20 uppercase mt-0.5">PREMIUM PLAN</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="text-slate-400 hover:text-white bg-white/5 border border-white/10 rounded-lg p-1.5 transition cursor-pointer lg:hidden"
                            >
                                <ChevronLeft size={16} />
                            </button>
                        </div>

                        {/* Navigation links */}
                        <nav className="space-y-1.5 mt-8">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path ||
                                    (item.path.startsWith("/add-entry") && location.pathname === "/add-entry");
                                return (
                                    <button
                                        key={item.name}
                                        onClick={() => {
                                            navigate(item.path);
                                            setSidebarOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${isActive
                                                ? "bg-white/10 text-white shadow-xs font-extrabold"
                                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                                            }`}
                                    >
                                        <Icon size={18} strokeWidth={isActive ? 2.2 : 1.75} className={isActive ? "text-white" : "text-slate-400"} />
                                        {item.name}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Bottom Settings & Logout */}
                    <div className="pt-4 space-y-1 border-t border-white/10">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                        >
                            <LogOut size={18} strokeWidth={2} />
                            {t.logout || "Logout"}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Backdrop for Mobile Sidebar */}
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden"
                />
            )}

            {/* Main Content Workspace */}
            <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
                {/* Header Navbar */}
                <header className="px-6 py-4 flex items-center justify-between z-20 sticky top-0 bg-[#f8fafc]/90 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden text-slate-600 hover:text-slate-800 p-2 bg-white border border-slate-200/80 rounded-xl shadow-xs cursor-pointer"
                        >
                            <Menu size={20} />
                        </button>

                        {/* Search bar inside header */}
                        <div className="hidden md:flex items-center gap-2.5 px-4 py-2.5 bg-white border border-slate-200/80 rounded-2xl w-96 shadow-xs">
                            <Search size={16} className="text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search items, invoices, customers..."
                                className="bg-transparent border-none outline-none text-xs w-full text-slate-700 placeholder-slate-400 font-medium"
                            />
                        </div>
                    </div>

                    {/* Header Controls (Language, Notifications, Calendar, Profile) */}
                    <div className="flex items-center gap-3">
                        
                        {/* Language Selector Dropdown */}
                        <div className="relative">
                            <button 
                                onClick={() => {
                                    setLangOpen(!langOpen);
                                    setNotifOpen(false);
                                }}
                                className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 shadow-xs cursor-pointer hover:bg-slate-50 transition"
                            >
                                <Globe size={14} className="text-slate-500" />
                                <span>{getLanguageLabel(language)}</span>
                                <ChevronDown size={12} className="text-slate-400" />
                            </button>
                            
                            {langOpen && (
                                <div className="absolute right-0 mt-2 w-36 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-1 font-sans">
                                    <button 
                                        onClick={() => handleLanguageChange("en")}
                                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold hover:bg-slate-50 ${language === "en" ? "text-emerald-700 bg-emerald-50/50 font-bold" : "text-slate-700"}`}
                                    >
                                        English (EN)
                                    </button>
                                    <button 
                                        onClick={() => handleLanguageChange("hi")}
                                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold hover:bg-slate-50 ${language === "hi" ? "text-emerald-700 bg-emerald-50/50 font-bold" : "text-slate-700"}`}
                                    >
                                        हिंदी (HI)
                                    </button>
                                    <button 
                                        onClick={() => handleLanguageChange("gu")}
                                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold hover:bg-slate-50 ${language === "gu" ? "text-emerald-700 bg-emerald-50/50 font-bold" : "text-slate-700"}`}
                                    >
                                        ગુજરાતી (GU)
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Notification Bell */}
                        <div className="relative">
                            <button 
                                onClick={() => {
                                    setNotifOpen(!notifOpen);
                                    setLangOpen(false);
                                    fetchNotifications();
                                }}
                                className="text-slate-600 p-2.5 bg-white border border-slate-200/80 rounded-xl hover:bg-slate-50 transition relative shadow-xs cursor-pointer flex items-center justify-center"
                            >
                                <Bell size={16} strokeWidth={2} />
                                {notifications.filter(n => !n.isRead).length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-[8px] font-bold text-white flex items-center justify-center shadow-xs">
                                        {notifications.filter(n => !n.isRead).length}
                                    </span>
                                )}
                            </button>
                            
                            {notifOpen && (
                                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-4 font-sans text-slate-800">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
                                        <h3 className="text-xs font-bold text-slate-850 uppercase tracking-wider">Alerts & Notifications</h3>
                                        <span className="text-[9px] bg-emerald-50 text-emerald-700 font-extrabold px-2 py-0.5 rounded-full">
                                            {notifications.filter(n => !n.isRead).length} New
                                        </span>
                                    </div>
                                    {notifications.length === 0 ? (
                                        <p className="text-center text-xs text-slate-400 py-6 font-medium">No alerts at the moment.</p>
                                    ) : (
                                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                            {notifications.map(n => (
                                                <div 
                                                    key={n.id} 
                                                    onClick={() => handleMarkRead(n.id)}
                                                    className={`p-3 rounded-xl border transition-all relative flex flex-col justify-between hover:bg-slate-50/40 cursor-pointer ${n.isRead ? 'bg-white border-slate-100 text-slate-500' : 'bg-emerald-50/20 border-emerald-100/50 text-slate-850'}`}
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex items-start gap-1.5">
                                                            {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 flex-shrink-0 mt-1.5" />}
                                                            <div>
                                                                <h4 className="text-xs font-bold leading-tight">{n.title}</h4>
                                                                <p className="text-[9px] mt-1 text-slate-500 leading-normal">{n.message}</p>
                                                                <span className="text-[7px] text-slate-400 mt-1.5 block font-semibold">{n.createdAt}</span>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDismiss(n.id);
                                                            }}
                                                            className="text-slate-400 hover:text-slate-600 p-0.5 hover:bg-slate-100 rounded-md transition"
                                                        >
                                                            <X size={11} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Calendar */}
                        <div className="relative">
                            <button 
                                className={`text-slate-600 p-2.5 bg-white border rounded-xl hover:bg-slate-50 transition shadow-xs flex items-center justify-center ${selectedDate ? "border-emerald-500 bg-emerald-50/20" : "border-slate-200/80"}`}
                            >
                                <Calendar size={16} strokeWidth={2} className={selectedDate ? "text-emerald-700" : ""} />
                            </button>
                            <input 
                                type="date" 
                                value={selectedDate}
                                onChange={(e) => {
                                    setSelectedDate(e.target.value);
                                    setDateFilter("");
                                }}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                        </div>
 
                        {/* Owner Profile Container */}
                        <div className="flex items-center gap-2.5 pl-3">
                            <div className="text-right hidden md:block">
                                <h1 className="text-xs font-extrabold text-slate-900 leading-tight">
                                    {user?.ownerFullName || "kiran thakor"}
                                </h1>
                                <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-600 block">
                                    RETAILER
                                </span>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-[#00a86b] text-white flex items-center justify-center shadow-sm text-sm font-bold font-sans overflow-hidden">
                                {user?.profilePic ? (
                                    <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    user?.ownerFullName ? user.ownerFullName.charAt(0).toUpperCase() : "K"
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Sub-page Workspace */}
                <main className="flex-1 p-6 pt-2 relative">
                    {children}
                </main>

                {/* Floating Reminder Toast Pop-up */}
                {activeToast && (
                    <div className="fixed top-20 right-6 z-50 max-w-sm w-full bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700/60 animate-in slide-in-from-top-4 duration-300 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Bell size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-black text-amber-400 uppercase tracking-wider">{activeToast.title}</h5>
                            <p className="text-xs text-slate-200 mt-1 leading-snug font-medium">{activeToast.message}</p>
                            <div className="flex items-center gap-3 mt-3">
                                <button
                                    onClick={() => {
                                        handleMarkRead(activeToast.id);
                                        setActiveToast(null);
                                    }}
                                    className="text-[11px] font-extrabold bg-[#00a86b] hover:bg-[#00965e] text-white px-3 py-1 rounded-lg transition"
                                >
                                    Dismiss
                                </button>
                                {activeToast.type === 'udhaar_overdue' && (
                                    <button
                                        onClick={() => {
                                            handleMarkRead(activeToast.id);
                                            setActiveToast(null);
                                            navigate("/udhaar");
                                        }}
                                        className="text-[11px] font-bold text-amber-300 hover:underline"
                                    >
                                        View Udhaar Book
                                    </button>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => setActiveToast(null)}
                            className="text-slate-400 hover:text-white text-xs font-bold p-1"
                        >
                            ✕
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}

export default Layout;
