import React from "react";
import { User, Lock, UserPlus, ChevronRight } from "lucide-react";

export default function MainMenu({ setView }) {
  return (
    // Outer wrapper with background image and overlay
    <div 
      className="fixed inset-0 w-full h-full flex items-center justify-center bg-cover bg-center p-4"
      style={{ 
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.8)), url('https://images.unsplash.com/photo-1541339907198-e08756ebafe3?q=80&w=2070&auto=format&fit=crop')` 
      }}
    >
      <div className="w-full max-w-md space-y-8 animate-fade-in-up">
        {/* Header Section with white text for visibility */}
        <div className="text-center">
          <div className="inline-block px-4 py-1.5 mb-4 rounded-full bg-blue-500/10 border border-blue-400/20 backdrop-blur-md">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Attendance Management System</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-sm">
            CheckIt<span className="text-blue-500"> Portal</span>
          </h1>
          <p className="text-slate-300 mt-2 font-medium">Digital attendance & school registry</p>
        </div>

        <div className="grid gap-4">
          {/* 1. PUBLIC: STUDENT CHECK-IN */}
          <MenuCard 
            icon={<User size={24} className="text-white"/>} 
            title="Student Check-In" 
            desc="Mark attendance for active class" 
            color="bg-blue-600" 
            onClick={() => setView("attendance")} 
          />
          
          {/* 2. PUBLIC: REGISTRATION */}
          <MenuCard 
            icon={<UserPlus size={24} className="text-white"/>} 
            title="New Student" 
            desc="First time registration" 
            color="bg-emerald-600" 
            onClick={() => setView("register")} 
          />

          {/* 3. PROTECTED: STAFF PORTAL */}
          <MenuCard 
            icon={<Lock size={24} className="text-white"/>} 
            title="Staff Portal" 
            desc="Lecturers, Admins & Exam Officers" 
            color="bg-slate-900" 
            onClick={() => setView("login")} 
          />
        </div>

        {/* Footer info */}
        <div className="text-center pt-4">
          <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">
            © {new Date().getFullYear()} CheckIt Attendance System
          </p>
        </div>
      </div>
    </div>
  );
}

const MenuCard = ({ icon, title, desc, color, onClick }) => (
  <button 
    onClick={onClick} 
    className="w-full bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-2xl border border-white/20 hover:bg-white transition-all flex items-center gap-5 text-left group"
  >
    <div className={`${color} w-12 h-12 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <div className="flex-1">
      <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
        {title}
      </h3>
      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
        {desc}
      </p>
    </div>
    <div className="bg-gray-50 p-2 rounded-full group-hover:bg-blue-50 transition-colors">
      <ChevronRight className="text-gray-300 group-hover:text-blue-500" size={20} />
    </div>
  </button>
);