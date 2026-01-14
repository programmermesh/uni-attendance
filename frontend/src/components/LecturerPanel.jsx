import React, { useState, useEffect } from "react";
import axios from "axios";
import { MapPin, BookOpen, User, School, Calendar, Building2, Presentation, Layers } from "lucide-react";
import { API_URL } from "./config";
import { Card, SelectInput, Button, SuccessScreen, Label, unique, Spinner, useToast } from "./Shared";

export default function LecturerPanel({ goHome }) {
  const toast = useToast(); // ✅ Use Toast for errors
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Data Buckets
  const [meta, setMeta] = useState({ sessions: [], faculties: [], departments: [], lecturers: [], classes: [] });
  
  // Selections
  const [selections, setSelections] = useState({ 
    session: "", 
    semester: "", 
    faculty: "", 
    dept: "", 
    level: "", 
    lecturerId: "", 
    classId: "",
    topic: "" 
  });

  // 1. Load Sessions & Faculties (Robust Load)
  useEffect(() => {
    axios.get(`${API_URL}/meta/sessions`).then(res => setMeta(m => ({ ...m, sessions: res.data })));
    axios.get(`${API_URL}/meta/faculties-list`).then(res => setMeta(m => ({ ...m, faculties: res.data })));
  }, []);

  // 2. Load Departments (When Faculty ID selected)
  useEffect(() => {
    if (selections.faculty) {
      axios.get(`${API_URL}/meta/departments-list?facultyId=${selections.faculty}`)
        .then(res => setMeta(m => ({ ...m, departments: res.data })));
    }
  }, [selections.faculty]);

  // 3. Load Lecturers (When Dept & Level selected)
  useEffect(() => {
    if (selections.dept && selections.level) {
      axios.get(`${API_URL}/meta/lecturers?department=${selections.dept}&level=${selections.level}`)
        .then(res => setMeta(m => ({ ...m, lecturers: res.data })));
    }
  }, [selections.dept, selections.level]);

  // 4. Load Classes (When Lecturer selected)
  useEffect(() => {
    if (selections.lecturerId) {
      axios.get(`${API_URL}/meta/classes?lecturerId=${selections.lecturerId}`)
        .then(res => setMeta(m => ({ ...m, classes: res.data })));
    }
  }, [selections.lecturerId]);

  const handleSelection = (field, value) => setSelections(prev => ({ ...prev, [field]: value }));


  const activateClass = () => {
    if (!selections.topic) {
        toast.error("Please enter a topic for this session.");
        return;
    }

    setLoading(true);
    if (!navigator.geolocation) {
      toast.error("GPS not supported");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        await axios.post(`${API_URL}/activate-session`, {
          lectureId: selections.classId,
          topic: selections.topic,
          lat: pos.coords.latitude,
          long: pos.coords.longitude
        });
        setSuccess(true);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to activate class.");
      } finally {
        setLoading(false);
      }
    }, () => {
      toast.error("GPS Permission Denied. Cannot activate class.");
      setLoading(false);
    });
  };

  if (success) return (
    <SuccessScreen 
      title="Class Activated!" 
      msg={`Attendance is live for: "${selections.topic}"`} 
      onReset={goHome} 
    />
  );

  return (
    <Card title="Lecturer Portal" subtitle="Activate your session location" color="border-indigo-500">
      
      {/* Row 1: Session / Semester */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <SelectInput icon={<Calendar size={16}/>} label="Session" options={unique(meta.sessions, 'session')} value={selections.session} onChange={v => handleSelection('session', v)} />
        <SelectInput label="Semester" options={["1st", "2nd"]} value={selections.semester} onChange={v => handleSelection('semester', v)} />
      </div>

      {/* Row 2: Faculty */}
      <div className="group mb-4">
         <Label icon={<BookOpen size={16}/>}>Faculty</Label>
         <select className="input-field" disabled={!meta.faculties.length} value={selections.faculty} onChange={(e) => handleSelection('faculty', e.target.value)}>
           <option value="">Select...</option>
           {meta.faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
         </select>
      </div>
      
      {/* Row 3: Dept / Level */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="group">
            <Label icon={<Building2 size={16}/>}>Department</Label>
            <select className="input-field" disabled={!meta.departments.length} value={selections.dept} onChange={(e) => handleSelection('dept', e.target.value)}>
            <option value="">Select...</option>
            {meta.departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
        </div>
        <SelectInput icon={<Layers size={16}/>} label="Level" options={["100", "200", "300", "400", "500", "PGC"]} value={selections.level} onChange={v => handleSelection('level', v)} />
      </div>
      
      {/* Row 4: Lecturer Selection */}
      <div className="group mb-4">
         <Label icon={<User size={16}/>}>Select Your Name</Label>
         <select className="input-field" disabled={!meta.lecturers.length} value={selections.lecturerId} onChange={(e) => handleSelection('lecturerId', e.target.value)}>
           <option value="">Select...</option>
           {meta.lecturers.map(l => <option key={l.id} value={l.id}>{l.title} {l.firstName} {l.lastName}</option>)}
         </select>
      </div>

      {/* Row 5: Course Selection */}
      <div className="group mb-4">
         <Label icon={<School size={16}/>}>Course to Activate</Label>
         <select className="input-field" disabled={!meta.classes.length} value={selections.classId} onChange={(e) => handleSelection('classId', e.target.value)}>
           <option value="">Select Course...</option>
           {meta.classes.map(c => (
             <option key={c.id} value={c.id}>
               {c.courseCode}: {c.courseTitle}
             </option>
           ))}
         </select>
      </div>

      {/* Row 6: TOPIC INPUT (Required) */}
      <div className="group mb-6">
         <Label icon={<Presentation size={16}/>}>Session Topic</Label>
         <input 
           type="text" 
           className="w-full bg-white border border-gray-200 text-gray-900 rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500" 
           placeholder="e.g. Week 2: Thermodynamics"
           value={selections.topic}
           onChange={(e) => handleSelection('topic', e.target.value)}
         />
      </div>

      <Button onClick={activateClass} disabled={!selections.classId || !selections.topic || loading} loading={loading} colorClass="bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200">
        <MapPin size={20}/> ACTIVATE SESSION HERE
      </Button>
    </Card>
  );
}