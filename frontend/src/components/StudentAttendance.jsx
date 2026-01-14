import React, { useState, useEffect, useRef } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import { Camera, MapPin, AlertCircle, Calendar, GraduationCap, User, School, Hash, ArrowRight, ArrowLeft, Layers, Building2, Clock, ChevronDown, ChevronLeft, Users } from "lucide-react";
import { API_URL } from "./config";
import { SelectInput, Button, SuccessScreen, unique, Spinner, ToastProvider, useToast } from "./Shared";

function StudentAttendanceContent({ goHome, deviceId }) {
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [meta, setMeta] = useState({ sessions: [], faculties: [], departments: [], lecturers: [], classes: [] });
  const [selections, setSelections] = useState({ session: "", semester: "", faculty: "", dept: "", level: "", lecturerId: "", lectureId: "" });
  const [identifier, setIdentifier] = useState("");
  const [student, setStudent] = useState(null);
  const webcamRef = useRef(null);

  useEffect(() => {
    axios.get(`${API_URL}/meta/sessions`).then((res) => setMeta((m) => ({ ...m, sessions: res.data })));
    axios.get(`${API_URL}/meta/faculties-list`).then((res) => setMeta((m) => ({ ...m, faculties: res.data })));
  }, []);

  useEffect(() => {
    if (selections.faculty) {
      axios.get(`${API_URL}/meta/departments-list?facultyId=${selections.faculty}`).then((res) => setMeta((m) => ({ ...m, departments: res.data })));
    }
  }, [selections.faculty]);

  useEffect(() => {
    if (selections.dept && selections.level) {
      axios.get(`${API_URL}/meta/lecturers?department=${selections.dept}&level=${selections.level}`).then((res) => setMeta((m) => ({ ...m, lecturers: res.data })));
    }
  }, [selections.dept, selections.level]);

  useEffect(() => {
    if (selections.lecturerId) {
      axios.get(`${API_URL}/meta/classes?lecturerId=${selections.lecturerId}`).then((res) => setMeta((m) => ({ ...m, classes: res.data })));
    }
  }, [selections.lecturerId]);

  const handleSelection = (field, value) => setSelections((prev) => ({ ...prev, [field]: value }));

  const verifyIdentity = async () => {
    if (!identifier) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/identify`, { identifier: identifier.trim().toUpperCase() });
      setStudent(res.data);
      setStep(4); // Direct to Camera
    } catch (err) { toast.error("Matric Number not found."); } 
    finally { setLoading(false); }
  };

  const processAttendance = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const imageSrc = webcamRef.current.getScreenshot();
        const blob = await fetch(imageSrc).then((r) => r.blob());
        const formData = new FormData();
        formData.append("file", blob, "face.jpg");
        formData.append("studentId", student.id);
        formData.append("lectureId", selections.lectureId);
        formData.append("lat", pos.coords.latitude);
        formData.append("long", pos.coords.longitude);
        formData.append("deviceId", deviceId);
        await axios.post(`${API_URL}/mark`, formData);
        setStep(5);
      } catch (err) { toast.error("Check-in Failed"); } 
      finally { setLoading(false); }
    }, () => { setLoading(false); toast.error("GPS Required"); }, { enableHighAccuracy: true });
  };

  const LayoutWrapper = ({ children, title, subtitle, backStep }) => (
    <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-cover bg-center p-4 overflow-y-auto" style={{ backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.9)), url('https://images.unsplash.com/photo-1541339907198-e08756ebafe3?q=80&w=2070&auto=format&fit=crop')` }}>
      <div className="w-full max-w-md space-y-6 animate-fade-in-up">
        <div className="flex items-center justify-between mb-2">
          <button onClick={backStep || goHome} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-md border border-white/10"><ChevronLeft size={20} /></button>
          <div className="text-right"><h2 className="text-white font-black text-xl tracking-tight">Students <span className="text-blue-500">Check-In</span></h2><p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{subtitle}</p></div>
        </div>
        <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-2xl border border-white/20 overflow-hidden relative">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  );

  if (step === 1) return (
    <LayoutWrapper title="Academic Context" subtitle="Step 1 of 3">
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4"><SelectInput icon={<Calendar size={16} />} label="Session" options={unique(meta.sessions, "session")} value={selections.session} onChange={(v) => handleSelection("session", v)} /><SelectInput icon={<Clock size={16} />} label="Semester" options={["1st", "2nd"]} value={selections.semester} onChange={(v) => handleSelection("semester", v)} /></div>
        <div className="space-y-1.5"><label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5"><GraduationCap size={16} /> Faculty</label>
        <select className="w-full h-12 bg-white border border-gray-200 text-sm rounded-xl px-4 outline-none appearance-none cursor-pointer" value={selections.faculty} onChange={(e) => handleSelection("faculty", e.target.value)}><option value="">-- Select Faculty --</option>{meta.faculties.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select></div>
        <div className="space-y-1.5"><label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5"><Building2 size={16} /> Department</label>
        <select className="w-full h-12 bg-white border border-gray-200 text-sm rounded-xl px-4 outline-none appearance-none" value={selections.dept} onChange={(e) => handleSelection("dept", e.target.value)} disabled={!meta.departments.length}><option value="">-- Select Department --</option>{meta.departments.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}</select></div>
        <SelectInput icon={<Layers size={16} />} label="Level" options={["100", "200", "300", "400", "500", "600", "700"]} value={selections.level} onChange={(v) => handleSelection("level", v)} />
        <Button onClick={() => setStep(2)} disabled={!selections.dept || !selections.level} colorClass="bg-blue-600 hover:bg-blue-700 py-4 shadow-xl shadow-blue-500/20">Next Step <ArrowRight size={18} className="ml-2" /></Button>
      </div>
    </LayoutWrapper>
  );

  if (step === 2) return (
    <LayoutWrapper title="Class Details" subtitle="Step 2 of 3" backStep={() => setStep(1)}>
      <div className="space-y-6">
        <div className="space-y-1.5"><label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5"><User size={16} /> Assign Lecturer</label>
        <select className="w-full h-12 bg-white border border-gray-200 text-sm rounded-xl px-4 outline-none appearance-none" disabled={!meta.lecturers.length} value={selections.lecturerId} onChange={(e) => handleSelection("lecturerId", e.target.value)}><option value="">-- Choose Lecturer --</option>{meta.lecturers.map((l) => <option key={l.id} value={l.id}>{l.title} {l.firstName} {l.lastName}</option>)}</select></div>
        <div className="space-y-1.5"><label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5"><School size={16} /> Select Course</label>
        <select className="w-full h-12 bg-white border border-gray-200 text-sm rounded-xl px-4 outline-none appearance-none" disabled={!meta.classes.length} value={selections.lectureId} onChange={(e) => handleSelection("lectureId", e.target.value)}><option value="">-- Choose Course --</option>{meta.classes.filter((c) => c.session === selections.session && c.semester === selections.semester).map((c) => (<option key={c.id} value={c.id}>{c.courseCode}: {c.courseTitle}</option>))}</select></div>
        <Button onClick={() => setStep(3)} disabled={!selections.lectureId} colorClass="bg-blue-600 hover:bg-blue-700 py-4 shadow-xl shadow-blue-500/20">Confirm Course <ArrowRight size={18} className="ml-2" /></Button>
      </div>
    </LayoutWrapper>
  );

 if (step === 3) return (
    <LayoutWrapper title="Identify Student" subtitle="Step 3 of 3" backStep={() => setStep(2)}>
      <div className="space-y-6">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
            <Hash size={16} /> Matriculation Number
          </label>
          <div className="relative">
            <input 
              key="matric-input" // ✅ Added key to maintain stability
              type="text" 
              autoFocus // ✅ Forces cursor to stay active
              className="w-full h-14 bg-gray-50 border border-gray-200 text-lg font-black tracking-widest text-slate-800 rounded-2xl px-5 outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:font-normal placeholder:tracking-normal" 
              placeholder="e.g. ENG/20/001" 
              value={identifier} 
              onChange={(e) => setIdentifier(e.target.value.toUpperCase())} 
            />
          </div>
          <p className="text-[10px] text-gray-400 pl-1 font-medium">Verify your student ID for facial biometric unlock.</p>
        </div>
        <Button 
          onClick={verifyIdentity} 
          disabled={loading || !identifier} 
          loading={loading} 
          colorClass="bg-slate-900 hover:bg-black py-4 shadow-xl shadow-slate-400/20"
        >
          Verify Identity <ArrowRight size={18} className="ml-2" />
        </Button>
      </div>
    </LayoutWrapper>
  );

  if (step === 4) return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-50">
      <Webcam ref={webcamRef} screenshotFormat="image/jpeg" className="absolute inset-0 w-full h-full object-cover opacity-60" videoConstraints={{ facingMode: "user" }} />
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-8">
        <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] p-5 text-white text-center border border-white/10 mx-auto max-w-sm w-full"><span className="bg-blue-500 text-[8px] font-black uppercase px-2 py-0.5 rounded-full mb-2 inline-block animate-pulse">Scanning Active</span><h3 className="font-black text-2xl tracking-tight">{student?.firstName} {student?.lastName}</h3><p className="text-slate-400 text-xs mt-1 font-medium">Verify presence</p></div>
        <div className="flex-1 flex items-center justify-center"><div className="w-[80vw] h-[80vw] max-w-[320px] max-h-[320px] border-4 border-white/30 rounded-full flex items-center justify-center relative"><div className="absolute inset-0 border-4 border-blue-500 rounded-full animate-ping opacity-20" /><div className="w-[92%] h-[92%] border-2 border-dashed border-white/50 rounded-full animate-[spin_10s_linear_infinite]" /></div></div>
        <div className="bg-white/10 backdrop-blur-xl rounded-[2.5rem] p-6 border border-white/20 mx-auto max-w-sm w-full text-center">
          <p className="text-white text-sm mb-6 flex justify-center items-center gap-2 font-bold uppercase tracking-wider">{msg || "Position face in circle"}</p>
          <div className="flex gap-4"><button onClick={() => setStep(3)} className="flex-1 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold transition-all border border-white/10">Back</button><button onClick={processAttendance} disabled={loading} className="flex-[2] py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black shadow-2xl flex items-center justify-center gap-2">{loading ? <Spinner /> : <><Camera size={20} /> Verify Presence</>}</button></div>
        </div>
      </div>
    </div>
  );

  if (step === 5) return (
    <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-cover bg-center p-4" style={{ backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.9)), url('https://images.unsplash.com/photo-1541339907198-e08756ebafe3?q=80&w=2070&auto=format&fit=crop')` }}>
      <div className="w-full max-w-md animate-fade-in-up"><SuccessScreen title="Check-in Successful!" msg={`${student?.firstName}, your presence has been recorded.`} onReset={() => { setStep(1); setSelections({ level: "" }); setIdentifier(""); }} /></div>
    </div>
  );
}

export default function StudentAttendance(props) {
  return <ToastProvider><StudentAttendanceContent {...props} /></ToastProvider>;
}