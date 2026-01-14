import React, { useState, useEffect, useRef } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import { Camera, Hash, ArrowRight, BookOpen, User, CheckCircle, Smartphone } from "lucide-react";
import { API_URL } from "./config";
import { Button, SuccessScreen, Spinner, ToastProvider, useToast } from "./Shared";

function StudentAttendanceContent({ goHome, deviceId }) {
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState({ lecturers: [], classes: [] });
  const [selections, setSelections] = useState({ lectureId: "" });
  const [identifier, setIdentifier] = useState("");
  const [student, setStudent] = useState(null);
  const webcamRef = useRef(null);

  // 1. Identify Student & Auto-Load Profile
  const verifyIdentity = async () => {
    if (!identifier) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/identify`, { 
        identifier: identifier.trim().toUpperCase() 
      });
      const studentData = res.data;
      setStudent(studentData);
      
      // Load classes for this student's specific context (Dept/Level)
      // This endpoint should return courses where isActive is true
      const classRes = await axios.get(
        `${API_URL}/meta/classes?department=${studentData.department}&level=${studentData.level}`
      );
      
      // Filter for LIVE courses only
      const liveClasses = classRes.data.filter(c => c.isActive === true);
      setMeta({ classes: liveClasses });
      
      if (liveClasses.length === 0) {
        toast.info("No active sessions found for your department/level.");
      }
      
      setStep(2); 
    } catch (err) { 
      toast.error("Matric Number not found."); 
    } finally { 
      setLoading(false); 
    }
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
        setStep(3);
      } catch (err) { 
        toast.error(err.response?.data?.message || "Check-in Failed"); 
      } finally { 
        setLoading(false); 
      }
    }, () => { 
      setLoading(false); 
      toast.error("GPS Required for validation"); 
    }, { enableHighAccuracy: true });
  };

  const LayoutWrapper = ({ children, title, subtitle }) => (
    <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-slate-900 p-4 overflow-y-auto">
      <div className="w-full max-w-md space-y-6 animate-fade-in-up">
        <div className="text-center">
            <h2 className="text-white font-black text-2xl tracking-tight">Check<span className="text-blue-500">It</span></h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{subtitle}</p>
        </div>
        <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl overflow-hidden">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  );

  // STEP 1: MATRIC NUMBER INPUT
  if (step === 1) return (
    <LayoutWrapper title="Welcome back" subtitle="Identify yourself">
      <div className="space-y-6 mt-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Matriculation Number</label>
          <input 
            type="text" 
            autoFocus
            className="w-full h-14 bg-gray-50 border border-gray-200 text-lg font-black tracking-widest text-slate-800 rounded-2xl px-5 outline-none focus:border-blue-500 focus:bg-white transition-all" 
            placeholder="ENG/XX/XXX" 
            value={identifier} 
            onChange={(e) => setIdentifier(e.target.value.toUpperCase())} 
          />
        </div>
        <Button onClick={verifyIdentity} disabled={!identifier || loading} loading={loading} colorClass="bg-blue-600 hover:bg-blue-700 py-4 shadow-xl">
          Identify Me <ArrowRight size={18} className="ml-2" />
        </Button>
        <button onClick={goHome} className="w-full text-center text-xs font-bold text-gray-400 uppercase hover:text-gray-600 transition-colors">Return to Home</button>
      </div>
    </LayoutWrapper>
  );

  // STEP 2: SELECT ACTIVE COURSE
  if (step === 2) return (
    <LayoutWrapper title="Active Classes" subtitle={`Hi, ${student?.firstName}`}>
      <div className="space-y-6">
        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Your Profile</p>
            <p className="text-sm font-bold text-slate-800">{student?.department} • {student?.level} Level</p>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Smartphone size={14}/> Currently Live
          </label>
          {meta.classes.length > 0 ? (
            <div className="grid gap-3">
              {meta.classes.map((c) => (
                <div 
                  key={c.id}
                  onClick={() => setSelections({ lectureId: c.id })}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center ${
                    selections.lectureId === c.id ? "border-blue-500 bg-blue-50" : "border-gray-100 hover:border-blue-200 bg-white"
                  }`}
                >
                  <div>
                    <p className="text-[10px] font-black text-blue-600 uppercase">{c.courseCode}</p>
                    <p className="text-sm font-bold text-slate-800">{c.courseTitle}</p>
                    <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><User size={10}/> {c.lecturer?.firstName} {c.lecturer?.lastName}</p>
                  </div>
                  {selections.lectureId === c.id && <CheckCircle size={20} className="text-blue-500" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
               <p className="text-xs font-bold text-gray-400">NO ACTIVE SESSIONS FOUND</p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition-all">Back</button>
            <Button onClick={() => setStep(4)} disabled={!selections.lectureId} colorClass="flex-[2] bg-blue-600 hover:bg-blue-700 py-4 shadow-xl">
                Enter Camera <ArrowRight size={18} className="ml-2" />
            </Button>
        </div>
      </div>
    </LayoutWrapper>
  );

  // STEP 4: WEBCAM (Maintained original UI structure but streamlined)
  if (step === 4) return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-50">
      <Webcam ref={webcamRef} screenshotFormat="image/jpeg" className="absolute inset-0 w-full h-full object-cover opacity-60" videoConstraints={{ facingMode: "user" }} />
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-8">
        <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] p-5 text-white text-center border border-white/10 mx-auto max-w-sm w-full">
            <span className="bg-blue-500 text-[8px] font-black uppercase px-2 py-0.5 rounded-full mb-2 inline-block animate-pulse">Validation Active</span>
            <h3 className="font-black text-2xl tracking-tight">{student?.firstName} {student?.lastName}</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
            <div className="w-[80vw] h-[80vw] max-w-[320px] max-h-[320px] border-4 border-white/30 rounded-full flex items-center justify-center relative">
                <div className="absolute inset-0 border-4 border-blue-500 rounded-full animate-ping opacity-20" />
            </div>
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-[2.5rem] p-6 border border-white/20 mx-auto max-w-sm w-full text-center">
          <div className="flex gap-4">
            <button onClick={() => setStep(2)} className="flex-1 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold transition-all border border-white/10">Back</button>
            <button onClick={processAttendance} disabled={loading} className="flex-[2] py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black shadow-2xl flex items-center justify-center gap-2">
                {loading ? <Spinner /> : <><Camera size={20} /> Verify Presence</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (step === 3) return (
    <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <SuccessScreen 
            title="Attendance Marked!" 
            msg={`${student?.firstName}, your record has been added for ${meta.classes.find(c => c.id === selections.lectureId)?.courseCode}.`} 
            onReset={() => { setStep(1); setIdentifier(""); setSelections({lectureId: ""}); }} 
        />
      </div>
    </div>
  );
}

export default function StudentAttendance(props) {
  return <ToastProvider><StudentAttendanceContent {...props} /></ToastProvider>;
}