import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid';
import { School, ArrowLeft } from "lucide-react";
import axios from "axios"; // ✅ Import Axios

import MainMenu from "./components/MainMenu";
import StudentAttendance from "./components/StudentAttendance";
import StudentRegistration from "./components/StudentRegistration";
import StaffLogin from "./components/StaffLogin";
import AdminDashboard from "./components/AdminDashboard"; 

export default function App() {
  const [view, setView] = useState("menu"); 
  const [user, setUser] = useState(null); 
  const [deviceId, setDeviceId] = useState("");
  const [loading, setLoading] = useState(true); 

  // 1. 🔄 INITIALIZE APP (Device ID & Session Check)
  useEffect(() => {
    // A. Handle Device ID
    let storedId = localStorage.getItem("uni_device_id");
    if (!storedId) {
      storedId = uuidv4();
      localStorage.setItem("uni_device_id", storedId);
    }
    setDeviceId(storedId);

    // B. Handle User Session (Persistence)
    const storedUser = localStorage.getItem("uni_user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setView("dashboard"); // Restore dashboard view
      } catch (error) {
        console.error("Session corrupted", error);
        localStorage.removeItem("uni_user");
      }
    }

    setLoading(false); // App is ready
  }, []);

  // 2. 🛡️ AXIOS INTERCEPTOR (Auto Logout on 401 Unauthorized)
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          // Token expired or invalid
          localStorage.removeItem("uni_user");
          setUser(null);
          setView("login"); // Force login screen
        }
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  // 3. 🔴 LOGOUT HANDLER
  const goHome = () => {
    localStorage.removeItem("uni_user"); // ✅ Clear storage
    setUser(null); 
    setView("menu");
  };

  // 4. 🟢 LOGIN SUCCESS HANDLER
  const handleLoginSuccess = (userData) => {
    localStorage.setItem("uni_user", JSON.stringify(userData)); // ✅ Save to storage
    setUser(userData);
    setView("dashboard");
  };

  // 5. ⏳ LOADING SCREEN
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col">
      {/* Header (Hide on Dashboard) */}
      {view !== 'dashboard' && (
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-2 text-indigo-900 font-bold text-lg">
            <School className="text-indigo-600" />
            <span>CheckIt</span>
          </div>
          {view !== "menu" && (
            <button onClick={goHome} className="text-gray-500 hover:text-gray-900 flex items-center gap-1 text-sm font-medium transition-colors">
              <ArrowLeft size={16} /> Back to Menu
            </button>
          )}
        </div>
      )}

      <div className={`flex-1 ${view === 'dashboard' ? '' : 'flex items-center justify-center p-4'}`}>
        
        {view === "menu" && <MainMenu setView={setView} />}
        
        {/* Public Routes */}
        {view === "attendance" && <StudentAttendance goHome={goHome} deviceId={deviceId} />}
        {view === "register" && <StudentRegistration goHome={goHome} />}
        
        {/* Protected Routes */}
        {view === "login" && <StaffLogin onLogin={handleLoginSuccess} goHome={goHome} />}
        {view === "dashboard" && user && <AdminDashboard user={user} goHome={goHome} />}
      </div>
    </div>
  );
}