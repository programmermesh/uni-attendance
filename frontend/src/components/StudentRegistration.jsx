import React, { useState, useEffect } from "react";
import axios from "axios";
import { User, Hash, Layers, Users, UserPlus, GraduationCap, Building2, ChevronLeft } from "lucide-react"; 
import { API_URL } from "./config";
import { Card, Button, SuccessScreen } from "./Shared";

// Reusing the styled FormInput with Glassmorphism compatibility
const FormInput = ({ label, icon: Icon, ...props }) => (
  <div className="space-y-1.5 w-full">
    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
      {label}
    </label>
    <div className="relative group">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600 transition-colors">
        <Icon size={18} />
      </div>
      <input 
        className="w-full bg-white border border-gray-200 text-gray-800 text-sm rounded-xl py-3 pl-10 pr-4 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-gray-300 shadow-sm"
        {...props}
      />
    </div>
  </div>
);

// Reusing the styled FormSelect with Glassmorphism compatibility
const FormSelect = ({ label, icon: Icon, children, ...props }) => (
  <div className="space-y-1.5 w-full">
    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
      {label}
    </label>
    <div className="relative group">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600 transition-colors">
        <Icon size={18} />
      </div>
      <select
        className="w-full bg-white border border-gray-200 text-gray-800 text-sm rounded-xl py-3 pl-10 pr-4 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all appearance-none cursor-pointer shadow-sm"
        {...props}
      >
        {children}
      </select>
    </div>
  </div>
);

export default function StudentRegistration({ goHome }) {
  const [form, setForm] = useState({ 
    firstName: "", 
    lastName: "", 
    middleName: "", 
    matricNumber: "", 
    faculty: "", 
    department: "", 
    sex: "Male", 
    level: "100" 
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/meta/faculties-list`)
      .then(res => setFaculties(res.data))
      .catch(err => console.error("Failed to load faculties", err));
  }, []);

  useEffect(() => {
    if (form.faculty) {
      axios.get(`${API_URL}/meta/departments-list?facultyId=${form.faculty}`)
        .then(res => setDepartments(res.data))
        .catch(() => setDepartments([]));
    } else {
      setDepartments([]);
    }
  }, [form.faculty]);

  const handleSubmit = async () => {
    setLoading(true);
    const facultyName = faculties.find(f => f.id === form.faculty)?.name || form.faculty;
    const deptName = departments.find(d => d.id === form.department)?.name || form.department;

    try {
      await axios.post(`${API_URL}/admin/student`, {
        ...form,
        faculty: facultyName,
        department: deptName
      });
      setSuccess(true);
    } catch (err) {
      alert(err.response?.data?.message || "Registration Failed");
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div 
      className="fixed inset-0 w-full h-full flex items-center justify-center bg-cover bg-center p-4"
      style={{ backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.9)), url('https://images.unsplash.com/photo-1541339907198-e08756ebafe3?q=80&w=2070&auto=format&fit=crop')` }}
    >
       <div className="w-full max-w-md animate-fade-in-up">
        <SuccessScreen title="Registration Complete!" msg={`Welcome, ${form.firstName}. Your profile has been created.`} onReset={goHome} />
       </div>
    </div>
  );

  return (
    <div 
      className="fixed inset-0 w-full h-full flex items-center justify-center bg-cover bg-center p-4 overflow-y-auto custom-scrollbar"
      style={{ backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.9)), url('https://images.unsplash.com/photo-1541339907198-e08756ebafe3?q=80&w=2070&auto=format&fit=crop')` }}
    >
      <div className="w-full max-w-xl my-auto py-10 space-y-6 animate-fade-in-up">
        {/* Header Section */}
        <div className="flex items-center justify-between px-2">
          <button onClick={goHome} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-md border border-white/10">
            <ChevronLeft size={20} />
          </button>
          <div className="text-right">
             <h2 className="text-white font-black text-2xl tracking-tight">Student <span className="text-emerald-500">Registry</span></h2>
             <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">New Profile Creation</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-white/20 relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormInput 
                  label="First Name" 
                  icon={User} 
                  value={form.firstName} 
                  onChange={e => setForm({...form, firstName: e.target.value})} 
                />
                <FormInput 
                  label="Last Name" 
                  icon={User} 
                  value={form.lastName} 
                  onChange={e => setForm({...form, lastName: e.target.value})} 
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
               <FormInput 
                  label="Middle Name" 
                  icon={User} 
                  value={form.middleName} 
                  onChange={e => setForm({...form, middleName: e.target.value})} 
                />
               <FormInput 
                  label="Matric Number" 
                  icon={Hash} 
                  placeholder="e.g. ENG/20/001" 
                  value={form.matricNumber} 
                  onChange={e => setForm({...form, matricNumber: e.target.value.toUpperCase()})} 
                />
            </div>

            <div className="h-px bg-gray-100/50" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormSelect 
                label="Faculty" 
                icon={GraduationCap} 
                value={form.faculty} 
                onChange={e => setForm({...form, faculty: e.target.value, department: ""})}
              >
                 <option value="">-- Select Faculty --</option>
                 {faculties.map(f => (
                   <option key={f.id} value={f.id}>{f.name}</option>
                 ))}
              </FormSelect>
              
              <FormSelect 
                label="Department" 
                icon={Building2} 
                value={form.department} 
                onChange={e => setForm({...form, department: e.target.value})}
                disabled={!form.faculty}
              >
                 <option value="">-- Select Department --</option>
                 {departments.map(d => (
                   <option key={d.id} value={d.id}>{d.name}</option>
                 ))}
              </FormSelect>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormSelect 
                label="Gender" 
                icon={Users} 
                value={form.sex} 
                onChange={e => setForm({...form, sex: e.target.value})}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </FormSelect>
              
              <FormSelect 
                label="Academic Level" 
                icon={Layers} 
                value={form.level} 
                onChange={e => setForm({...form, level: e.target.value})}
              >
                <option value="100">100 Level</option>
                <option value="200">200 Level</option>
                <option value="300">300 Level</option>
                <option value="400">400 Level</option>
                <option value="500">500 Level</option>
                <option value="600">600 Level</option>
                <option value="700">700 Level</option>
              </FormSelect>
            </div>

            <div className="pt-4">
              <Button 
                onClick={handleSubmit} 
                disabled={!form.matricNumber || !form.lastName || !form.faculty || !form.department} 
                loading={loading} 
                colorClass="bg-emerald-600 hover:bg-emerald-700 py-4 shadow-xl shadow-emerald-500/20 w-full"
              >
                <UserPlus size={20} className="mr-2 inline" /> Create Student Profile
              </Button>
            </div>
          </div>
        </div>
        
        <p className="text-center text-slate-400 text-[10px] uppercase font-bold tracking-[0.2em]">
         © 2026 CheckIt Attendance System
        </p>
      </div>
    </div>
  );
}