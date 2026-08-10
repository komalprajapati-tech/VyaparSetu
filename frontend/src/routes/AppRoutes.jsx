import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import Register from "../pages/Register";
import Login from "../pages/Login";
import OtpVerification from "../pages/OtpVerification";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import SelectBusiness from "../pages/SelectBusiness";
import Dashboard from "../pages/Dashboard";
import AddEntry from "../pages/AddEntry";
import Reports from "../pages/Reports";
import Udhaar from "../pages/Udhaar";
import Expenses from "../pages/Expenses";
import Settings from "../pages/Settings";
import Appearance from "../pages/Appearance";
import PersonalPlanning from "../pages/PersonalPlanning";
import RestaurantDashboard from "../pages/RestaurantDashboard";
import RestaurantProducts from "../pages/RestaurantProducts";
import RestaurantBilling from "../pages/RestaurantBilling";

// Helper to check token expiration
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

// Route guard component
function ProtectedRoute({ children, requireBusinessSelection = true }) {
    const { token, user, businessType, logoutUser } = useApp();
    const effectiveBusinessType = businessType || user?.businessType;
    
    if (!token || isTokenExpired(token)) {
        if (token) {
            setTimeout(() => {
                logoutUser();
            }, 0);
        }
        return <Navigate to="/login" replace />;
    }
    
    if (requireBusinessSelection && !effectiveBusinessType) {
        return <Navigate to="/select-business" replace />;
    }
    
    return children;
}

function AppRoutes() {
    const { token, user, businessType } = useApp();

    const isTokenValid = token && !isTokenExpired(token);
    const effectiveBusinessType = businessType || user?.businessType;
    const defaultAuthRedirect = effectiveBusinessType ? "/dashboard" : "/select-business";

    return (
        <BrowserRouter>
            <Routes>
                {/* Public / Auth paths */}
                <Route path="/" element={isTokenValid ? <Navigate to={defaultAuthRedirect} replace /> : <SelectBusiness />} />
                <Route path="/register" element={isTokenValid ? <Navigate to={defaultAuthRedirect} replace /> : <Register />} />
                <Route path="/login" element={isTokenValid ? <Navigate to={defaultAuthRedirect} replace /> : <Login />} />
                <Route path="/otp" element={<OtpVerification />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                
                {/* Business selection */}
                <Route 
                    path="/select-business" 
                    element={<SelectBusiness />} 
                />

                {/* Core App Modules - Protected & requires selection */}
                <Route 
                    path="/dashboard" 
                    element={
                        <ProtectedRoute>
                            {effectiveBusinessType === "food" ? <RestaurantDashboard /> : <Dashboard />}
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/restaurant/products" 
                    element={
                        <ProtectedRoute>
                            <RestaurantProducts />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/restaurant/billing" 
                    element={
                        <ProtectedRoute>
                            <RestaurantBilling />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/add-entry" 
                    element={
                        <ProtectedRoute>
                            <AddEntry />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/reports" 
                    element={
                        <ProtectedRoute>
                            <Reports />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/udhaar" 
                    element={
                        <ProtectedRoute>
                            <Udhaar />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/expenses" 
                    element={
                        <ProtectedRoute>
                            <Expenses />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/appearance" 
                    element={
                        <ProtectedRoute>
                            <Appearance />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/personal-planning" 
                    element={
                        <ProtectedRoute>
                            <PersonalPlanning />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/settings" 
                    element={
                        <ProtectedRoute>
                            <Settings />
                        </ProtectedRoute>
                    } 
                />

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;