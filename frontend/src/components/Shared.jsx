import React, { createContext, useContext, useState, useEffect } from "react";
import { Loader2, CheckCircle2, XCircle, Info, X } from "lucide-react";

// ============================================================================
// 🌀 SPINNER
// ============================================================================
export const Spinner = ({ size = 20, color = "text-current" }) => (
  <Loader2 className={`animate-spin ${color}`} size={size} />
);

// ============================================================================
// 🍞 TOAST SYSTEM
// ============================================================================
const ToastContext = createContext();
export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const toast = {
    success: (msg) => addToast(msg, "success"),
    error: (msg) => addToast(msg, "error"),
    info: (msg) => addToast(msg, "info"),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map((t) => (
          <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border w-80 transform transition-all duration-300 animate-slide-in bg-white ${t.type === 'error' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-emerald-500'}`}>
            <div className="shrink-0">
              {t.type === 'success' ? <CheckCircle2 size={20} className="text-emerald-500" /> : <XCircle size={20} className="text-red-500" />}
            </div>
            <p className="text-sm font-medium flex-1 text-gray-800">{t.message}</p>
            <button onClick={() => removeToast(t.id)}><X size={16} className="text-gray-400 hover:text-gray-600"/></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// ============================================================================
// 🧩 UI COMPONENTS
// ============================================================================

export const Card = ({ title, subtitle, children, color, className = "" }) => (
  <div className={`bg-white rounded-2xl p-8 border-l-4 shadow-sm hover:shadow-md transition-all ${color || 'border-blue-600'} ${className}`}>
    <div className="mb-8 border-b border-gray-100 pb-4">
      <h3 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
    {children}
  </div>
);

export const Label = ({ icon, children }) => (
  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-2">
    {icon} {children}
  </label>
);

export const Button = ({ children, onClick, disabled, loading, colorClass = "bg-blue-600 hover:bg-blue-700" }) => (
  <button 
    onClick={onClick}
    disabled={disabled || loading}
    className={`w-full py-3.5 px-6 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 ${disabled || loading ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none" : colorClass}`}
  >
    {loading && <Spinner size={18} color="text-current" />}
    {children}
  </button>
);

// ✅ RESTORED: SelectInput (Used by StudentAttendance.jsx)
export const SelectInput = ({ label, icon, options, value, onChange, disabled }) => (
  <div className="group">
    <Label icon={icon}>{label}</Label>
    <div className="relative">
      <select
        className="w-full bg-white border border-gray-200 text-gray-800 text-sm rounded-xl py-3 px-4 pr-8 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer disabled:bg-gray-100 disabled:text-gray-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">Select {label}...</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      {/* Custom arrow for styling */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </div>
    </div>
  </div>
);

// ✅ NEW: FormInput (Used by AdminDashboard)
export const FormInput = ({ label, icon: Icon, type = "text", ...props }) => (
  <div className="space-y-1.5 w-full">
    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">{label}</label>
    <div className="relative group">
      {Icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors"><Icon size={18} /></div>}
      <input 
        type={type}
        className={`w-full bg-white border border-gray-200 text-gray-800 text-sm rounded-xl py-3 ${Icon ? 'pl-10' : 'px-4'} pr-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-gray-300 shadow-sm`}
        {...props}
      />
    </div>
  </div>
);

// ✅ NEW: FormSelect (Children based, Used by AdminDashboard)
export const FormSelect = ({ label, icon: Icon, children, ...props }) => (
  <div className="space-y-1.5 w-full">
    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">{label}</label>
    <div className="relative group">
      {Icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors"><Icon size={18} /></div>}
      <select 
        className={`w-full bg-white border border-gray-200 text-gray-800 text-sm rounded-xl py-3 ${Icon ? 'pl-10' : 'px-4'} pr-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer shadow-sm`}
        {...props}
      >
        {children}
      </select>
    </div>
  </div>
);

export const SuccessScreen = ({ title, msg, onReset }) => (
  <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in-up">
    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
      <CheckCircle2 size={40} className="text-green-600" />
    </div>
    <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
    <p className="text-gray-500 mb-8">{msg}</p>
    <Button onClick={onReset} colorClass="bg-gray-900 hover:bg-black">Done</Button>
  </div>
);

export const unique = (arr, key) => [...new Set(arr.map(item => item[key]))];