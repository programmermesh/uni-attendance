import React, { useState } from "react";
import axios from "axios";
import { LogIn, Mail, Key, Eye, EyeOff, AlertCircle, ChevronLeft } from "lucide-react"; 
import { API_URL } from "./config";
import { Card, Button } from "./Shared";

export default function StaffLogin({ onLogin, goHome }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", role: "lecturer" });
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Please enter both email and password.");
      return;
    }
    
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, form);
      onLogin(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 w-full h-full flex items-center justify-center bg-cover bg-center p-4 overflow-y-auto"
      style={{ 
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.9)), url('https://images.unsplash.com/photo-1541339907198-e08756ebafe3?q=80&w=2070&auto=format&fit=crop')` 
      }}
    >
      <div className="w-full max-w-md space-y-6 animate-fade-in-up">
        
        {/* Header Section */}
        <div className="flex items-center justify-between px-2">
          <button 
            onClick={goHome} 
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-md border border-white/10"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-right">
             <h2 className="text-white font-black text-2xl tracking-tight">Staff <span className="text-blue-500">Portal</span></h2>
             <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Authorized Access Only</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-2xl border border-white/20 relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-slate-500/50 to-transparent" />
          
          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Role Segmented Picker */}
            <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 border border-slate-200/50">
              <RoleBtn label="Lecturer" active={form.role === 'lecturer'} onClick={() => setForm({...form, role: 'lecturer'})} />
              <RoleBtn label="Officer" active={form.role === 'exam_officer'} onClick={() => setForm({...form, role: 'exam_officer'})} />
              <RoleBtn label="Admin" active={form.role === 'admin'} onClick={() => setForm({...form, role: 'admin'})} />
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/10 text-red-600 text-xs font-bold p-4 rounded-2xl flex items-center gap-3 border border-red-200/50 animate-shake">
                <AlertCircle size={18} className="shrink-0" /> 
                <span>{error}</span>
              </div>
            )}

            {/* Inputs Group */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input 
                    type="email" 
                    className="w-full h-12 bg-white border border-gray-200 text-gray-800 text-sm rounded-xl py-3 pl-10 pr-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-gray-300 shadow-sm"
                    placeholder={form.role === 'admin' ? "admin@uni.edu" : "staff@uni.edu"}
                    value={form.email} 
                    onChange={e => { setForm({...form, email: e.target.value}); setError(""); }}
                  />
                </div>
              </div>

              <PasswordInput 
                value={form.password} 
                onChange={e => { setForm({...form, password: e.target.value}); setError(""); }} 
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button 
                onClick={handleLogin} 
                loading={loading} 
                colorClass="bg-slate-900 hover:bg-black py-4 shadow-xl shadow-slate-900/30 w-full"
              >
                <LogIn size={20} className="mr-2 inline" /> Authenticate & Enter
              </Button>
            </div>
          </form>
        </div>

        <p className="text-center text-slate-400 text-[10px] uppercase font-bold tracking-[0.2em]">
          © 2026 CheckIt Attendance System
        </p>
      </div>
    </div>
  );
}

const RoleBtn = ({ label, active, onClick }) => (
  <button 
    type="button"
    onClick={onClick}
    className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-tighter rounded-xl transition-all duration-300 ${
      active 
        ? 'bg-white shadow-md text-blue-600 ring-1 ring-slate-200' 
        : 'text-gray-400 hover:text-gray-600'
    }`}
  >
    {label}
  </button>
);

const PasswordInput = ({ value, onChange }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Password</label>
      <div className="relative group">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
          <Key size={18} />
        </div>
        <input 
          type={show ? "text" : "password"} 
          className="w-full h-12 bg-white border border-gray-200 text-gray-800 text-sm rounded-xl py-3 pl-10 pr-12 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-gray-300 shadow-sm"
          placeholder="••••••••"
          value={value} 
          onChange={onChange} 
        />
        <button 
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
};