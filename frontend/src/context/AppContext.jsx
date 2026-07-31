import { createContext, useState, useEffect, useContext } from "react";

const AppContext = createContext();

export function AppProvider({ children }) {
    const [token, setToken] = useState(localStorage.getItem("vyaparsetu_accessToken") || "");
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem("vyaparsetu_user");
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const [theme, setTheme] = useState(user?.themeColor || "forest_green");
    const [language, setLanguage] = useState(user?.language || "en");
    const [businessType, setBusinessType] = useState(user?.businessType || "");

    // Global date states
    const [selectedDate, setSelectedDate] = useState("");
    const [dateFilter, setDateFilter] = useState("month");

    useEffect(() => {
        if (user) {
            setTheme(user.themeColor || "forest_green");
            setLanguage(user.language || "en");
            setBusinessType(user.businessType || "");
        }
    }, [user]);

    useEffect(() => {
        const isTokenExpired = (t) => {
            if (!t) return true;
            try {
                const base64Url = t.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                const payload = JSON.parse(jsonPayload);
                if (payload.exp) {
                    return Date.now() >= payload.exp * 1000;
                }
                return false;
            } catch (e) {
                return true;
            }
        };

        if (token && isTokenExpired(token)) {
            logoutUser();
        }
    }, [token]);

    const applyTheme = (themeName, customColors = {}) => {
        let primary = "#1F4D3D";
        let light = "#F0F5F3";
        let hover = "#16372b";
        let border = "#1F4D3D15";
        let bg = "#FAF6F0";

        if (themeName === "forest_green") {
            primary = "#1F4D3D";
            light = "#F0F5F3";
            hover = "#16372b";
            border = "#1F4D3D15";
            bg = "#FAF6F0";
        } else if (themeName === "deep_blue") {
            primary = "#1E3A5F";
            light = "#F0F4F8";
            hover = "#152943";
            border = "#1E3A5F15";
            bg = "#FAF6F0";
        } else if (themeName === "coffee_shop") {
            primary = "#6E473B"; // Dark accent
            light = "#F3EBE0";   // Medium-light cream
            hover = "#54362d";   // Darker shade of primary button
            border = "#BEB5A9";  // Light tone
            bg = "#FAF6F0";      // Soft cream
        } else if (themeName === "custom") {
            primary = customColors.primary || localStorage.getItem("vyaparsetu_custom_primary") || "#6E473B";
            light = customColors.light || localStorage.getItem("vyaparsetu_custom_light") || "#F3EBE0";
            bg = customColors.bg || localStorage.getItem("vyaparsetu_custom_bg") || "#FAF6F0";
            hover = primary;
            border = primary + "20";
        }

        document.documentElement.style.setProperty('--primary-color', primary);
        document.documentElement.style.setProperty('--primary-color-light', light);
        document.documentElement.style.setProperty('--primary-color-hover', hover);
        document.documentElement.style.setProperty('--primary-color-border', border);
        document.documentElement.style.setProperty('--bg-color', bg);
    };

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        applyTheme(theme);
    }, [theme]);

    const setCustomThemeColors = (colorsObj) => {
        localStorage.setItem("vyaparsetu_custom_primary", colorsObj.primary);
        localStorage.setItem("vyaparsetu_custom_light", colorsObj.light);
        localStorage.setItem("vyaparsetu_custom_bg", colorsObj.bg);
        applyTheme("custom", colorsObj);
    };

    const loginUser = (accessToken, refreshToken, userData) => {
        localStorage.setItem("vyaparsetu_accessToken", accessToken);
        localStorage.setItem("vyaparsetu_refreshToken", refreshToken);
        localStorage.setItem("vyaparsetu_user", JSON.stringify(userData));
        setToken(accessToken);
        setUser(userData);
    };

    const logoutUser = () => {
        localStorage.removeItem("vyaparsetu_accessToken");
        localStorage.removeItem("vyaparsetu_refreshToken");
        localStorage.removeItem("vyaparsetu_user");
        setToken("");
        setUser(null);
    };

    const updateProfile = async (updatedData) => {
        if (!token) return false;

        try {
            const res = await fetch("http://localhost:8000/api/auth/profile/", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(updatedData)
            });

            if (!res.ok) {
                if (res.status === 401) {
                    logoutUser();
                }
                throw new Error("Failed to update profile");
            }

            const data = await res.json();
            if (data.success) {
                const newUser = {
                    ...user,
                    businessName: data.user.businessName,
                    ownerFullName: data.user.ownerFullName,
                    businessType: data.user.businessType,
                    themeColor: data.user.themeColor,
                    language: data.user.language,
                    phoneNumber: data.user.phoneNumber,
                    profilePic: data.user.profilePic,
                    eodReminderTime: data.user.eodReminderTime,
                    eodReminderEnabled: data.user.eodReminderEnabled
                };
                localStorage.setItem("lekhbook_user", JSON.stringify(newUser));
                setUser(newUser);
                return true;
            }
        } catch (err) {
            console.error("Error updating profile:", err);
        }
        return false;
    };

    // Dictionary for localization (English & Hindi)
    const translations = {
        en: {
            appName: "KhataNova",
            dashboard: "Dashboard",
            addEntry: "Add Entry",
            reports: "Reports",
            udhaar: "Udhaar (Credit Book)",
            expenses: "Expenses",
            settings: "Settings",
            logout: "Logout",
            profit: "Profit",
            loss: "Loss",
            netProfit: "Net Profit",
            today: "Today",
            weekly: "Weekly",
            monthly: "Monthly",
            totalPendingUdhaar: "Total Pending Credit",
            recentActivity: "Recent Activity",
            categoryBreakdown: "Expense Category Breakdown",
            salesExpenseTrend: "Sales vs Expense Trend",
            income: "Income",
            expense: "Expense",
            amount: "Amount",
            category: "Category",
            date: "Date",
            note: "Note (Optional)",
            submit: "Save Entry",
            customerName: "Customer Name",
            dueDate: "Due Date",
            status: "Status",
            pending: "Pending",
            paid: "Paid",
            markPaid: "Mark as Paid",
            sendReminder: "Send Reminder",
            themeColor: "Theme Color",
            language: "Language",
            businessType: "Business Type",
            retailer: "Retailer",
            foodBusiness: "Food Business / Restaurant",
            serviceProvider: "Service Business",
            selectBusinessType: "Select Your Business Type",
            selectBusinessDesc: "Choose the category that best describes your business to load customized entry categories.",
            saveSettings: "Save Settings",
            editProfile: "Edit Profile",
            businessName: "Business Name",
            ownerName: "Owner Name",
            phone: "Phone Number",
            email: "Email Address",
            uploadReceipt: "Upload Receipt (Optional)",
            searchCustomer: "Search customer by name...",
            addCustomer: "Add Customer Credit",
            enterAmount: "Enter Amount",
            enterCustomerName: "Enter Customer Name",
            noActivity: "No entries recorded yet.",
            noUdhaar: "No outstanding credits.",
            lenaHai: "Lena Hai (To Collect)",
            denaHai: "Dena Hai (To Give)",
            all: "All",
            custom: "Custom",
            filterBy: "Filter by Date Range",
            exportCsv: "Export to CSV",
            printPdf: "Print Report / PDF",
            actions: "Actions",
            edit: "Edit",
            delete: "Delete"
        },
        hi: {
            appName: "खातानोवा",
            dashboard: "डैशबोर्ड",
            addEntry: "एंट्री जोड़ें",
            reports: "रिपोर्ट्स",
            udhaar: "उधार (क्रेडिट बुक)",
            expenses: "खर्चे",
            settings: "सेटिंग्स",
            logout: "लॉगआउट",
            profit: "लाभ",
            loss: "हानि",
            netProfit: "कुल लाभ/हानि",
            today: "आज का",
            weekly: "इस सप्ताह का",
            monthly: "इस महीने का",
            totalPendingUdhaar: "कुल बकाया उधार",
            recentActivity: "हाल की गतिविधियां",
            categoryBreakdown: "श्रेणी-वार खर्चों का विवरण",
            salesExpenseTrend: "बिक्री बनाम खर्च का रुझान",
            income: "आय (कमाई)",
            expense: "खर्च",
            amount: "राशि (₹)",
            category: "श्रेणी",
            date: "तारीख",
            note: "विवरण / नोट",
            submit: "एंट्री सहेजें",
            customerName: "ग्राहक का नाम",
            dueDate: "भुगतान की तारीख",
            status: "स्थिति",
            pending: "बकाया",
            paid: "चुका दिया",
            markPaid: "चुका दिया मार्क करें",
            sendReminder: "रिमाइंडर भेजें",
            themeColor: "थीम का रंग",
            language: "भाषा",
            businessType: "व्यवसाय का प्रकार",
            retailer: "रिटेलर (खुदरा विक्रेता)",
            foodBusiness: "खाद्य व्यवसाय (रेस्टोरेंट/कैफे)",
            serviceProvider: "सेवा प्रदाता (सर्विसेज)",
            selectBusinessType: "अपने व्यवसाय का प्रकार चुनें",
            selectBusinessDesc: "अनुकूलित श्रेणियां लोड करने के लिए वह श्रेणी चुनें जो आपके व्यवसाय का सबसे अच्छा वर्णन करती है।",
            saveSettings: "सेटिंग्स सहेजें",
            editProfile: "प्रोफ़ाइल संपादित करें",
            businessName: "व्यवसाय का नाम",
            ownerName: "मालिक का नाम",
            phone: "फ़ोन नंबर",
            email: "ईमेल पता",
            uploadReceipt: "रसीद अपलोड करें (वैकल्पिक)",
            searchCustomer: "ग्राहक का नाम खोजें...",
            addCustomer: "नया उधार जोड़ें",
            enterAmount: "राशि दर्ज करें",
            enterCustomerName: "ग्राहक का नाम दर्ज करें",
            noActivity: "अभी तक कोई एंट्री नहीं है।",
            noUdhaar: "कोई बकाया उधार नहीं है।",
            lenaHai: "लेना है",
            denaHai: "देना है",
            all: "सभी",
            custom: "कस्टम",
            filterBy: "तारीख सीमा चुनें",
            exportCsv: "CSV डाउनलोड करें",
            printPdf: "प्रिंट रिपोर्ट / PDF",
            actions: "कार्रवाई",
            edit: "बदले",
            delete: "हटाएं"
        },
        gu: {
            appName: "ખાતાનોવા",
            dashboard: "ડેશબોર્ડ",
            addEntry: "નોંધ ઉમેરો",
            reports: "અહેવાલો",
            udhaar: "ઉધાર (ક્રેડિટ બુક)",
            expenses: "ખર્ચ",
            settings: "સેટિંગ્સ",
            logout: "લોગઆઉટ",
            profit: "નફો",
            loss: "નુકસાન",
            netProfit: "ચોખ્ખો નફો",
            today: "આજે",
            weekly: "સાપ્તાહિક",
            monthly: "માસિક",
            totalPendingUdhaar: "કુલ બાકી ઉધાર",
            recentActivity: "તાજેતરની પ્રવૃત્તિ",
            categoryBreakdown: "ખર્ચ શ્રેણી વિભાજન",
            salesExpenseTrend: "વેચાણ વિરુદ્ધ ખર્ચ પ્રવાહ",
            income: "આવક",
            expense: "ખર્ચ",
            amount: "રકમ",
            category: "શ્રેણી",
            date: "તારીખ",
            note: "નોંધ (વૈકલ્પિક)",
            submit: "નોંધ સાચવો",
            customerName: "ગ્રાહકનું નામ",
            dueDate: "નિયત તારીખ",
            status: "સ્થિતિ",
            pending: "બાકી",
            paid: "ચૂકવેલ",
            markPaid: "ચૂકવેલ તરીકે ચિહ્નિત કરો",
            sendReminder: "રિમાઇન્ડર મોકલો",
            themeColor: "થીમ રંગ",
            language: "ભાષા",
            businessType: "વ્યવસાય પ્રકાર",
            retailer: "છૂટક વેપારી",
            foodBusiness: "ખાદ્ય વ્યવસાય / રેસ્ટોરન્ટ",
            serviceProvider: "સેવા પ્રદાતા",
            selectBusinessType: "તમારા વ્યવસાયનો પ્રકાર પસંદ કરો",
            selectBusinessDesc: "કસ્ટમાઇઝ્ડ શ્રેણીઓ લોડ કરવા માટે તમારા વ્યવસાયનું શ્રેષ્ઠ વર્ણન કરતી શ્રેણી પસંદ કરો.",
            saveSettings: "સેટિંગ્સ સાચવો",
            editProfile: "પ્રોફાઇલ સંપાદિત કરો",
            businessName: "વ્યવસાયનું નામ",
            ownerName: "માલિકનું નામ",
            phone: "ફોન નંબર",
            email: "ઇમેઇલ સરનામું",
            uploadReceipt: "રસીદ અપલોડ કરો (વૈકલ્પિક)",
            searchCustomer: "ગ્રાહકનું નામ શોધો...",
            addCustomer: "ગ્રાહક ક્રેડિટ ઉમેરો",
            enterAmount: "રકમ દાખલ કરો",
            enterCustomerName: "ગ્રાહકનું નામ દાખલ કરો",
            noActivity: "હજી સુધી કોઈ પ્રવૃત્તિ નથી.",
            noUdhaar: "કોઈ બાકી ક્રેડિટ નથી.",
            lenaHai: "લેવાના છે",
            denaHai: "આપવાના છે",
            all: "બધા",
            custom: "કસ્ટમ",
            filterBy: "તારીખ મર્યાદા ફિલ્ટર કરો",
            exportCsv: "CSV નિકાસ કરો",
            printPdf: "રિપોર્ટ પ્રિન્ટ કરો / PDF",
            actions: "પગલાં",
            edit: "ફેરફાર કરો",
            delete: "કાઢી નાખો"
        }
    };

    const t = translations[language] || translations.en;

    // Default categories based on business type
    const categories = {
        retailer: {
            income: ["Sales", "Refund", "Commission", "Other"],
            expense: ["Inventory Purchase", "Rent", "Salaries", "Electricity", "Taxes", "Transport", "Marketing", "Miscellaneous"]
        },
        food: {
            income: ["Dine-in Sales", "Delivery Sales", "Catering", "Other"],
            expense: ["Raw Materials / Groceries", "Kitchen Equipment", "Salaries", "Rent", "Electricity", "Gas", "Delivery Fees", "Miscellaneous"]
        },
        service: {
            income: ["Service Fees", "Consulting", "Support", "Subscription", "Other"],
            expense: ["Software Tools", "Rent", "Salaries", "Internet", "Travel", "Taxes", "Marketing", "Miscellaneous"]
        }
    };

    const getCategories = () => {
        const type = businessType?.toLowerCase() || "retailer";
        if (type.includes("food")) return categories.food;
        if (type.includes("service")) return categories.service;
        return categories.retailer;
    };

    // Color definitions for dynamic UI accent styling
    const themeColors = {
        forest_green: {
            primary: "primary",
            primaryHover: "primary-hover",
            primaryBg: "bg-primary",
            primaryBgLight: "primary-light",
            primaryText: "text-primary",
            primaryTextDark: "text-primary",
            primaryBorder: "border-primary",
            primaryBorderLight: "primary-border"
        },
        deep_blue: {
            primary: "primary",
            primaryHover: "primary-hover",
            primaryBg: "bg-primary",
            primaryBgLight: "primary-light",
            primaryText: "text-primary",
            primaryTextDark: "text-primary",
            primaryBorder: "border-primary",
            primaryBorderLight: "primary-border"
        },
        coffee_shop: {
            primary: "primary",
            primaryHover: "primary-hover",
            primaryBg: "bg-primary",
            primaryBgLight: "primary-light",
            primaryText: "text-primary",
            primaryTextDark: "text-primary",
            primaryBorder: "border-primary",
            primaryBorderLight: "primary-border"
        },
        custom: {
            primary: "primary",
            primaryHover: "primary-hover",
            primaryBg: "bg-primary",
            primaryBgLight: "primary-light",
            primaryText: "text-primary",
            primaryTextDark: "text-primary",
            primaryBorder: "border-primary",
            primaryBorderLight: "primary-border"
        }
    };

    const colors = themeColors[theme] || themeColors.forest_green;

    return (
        <AppContext.Provider value={{
            token,
            user,
            theme,
            language,
            businessType,
            selectedDate,
            dateFilter,
            setTheme,
            setLanguage,
            setBusinessType,
            setSelectedDate,
            setDateFilter,
            loginUser,
            logoutUser,
            updateProfile,
            t,
            getCategories,
            colors,
            setCustomThemeColors
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    return useContext(AppContext);
}
