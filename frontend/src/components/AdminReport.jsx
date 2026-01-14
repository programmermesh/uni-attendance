import React, { useState, useEffect } from "react";
import axios from "axios";
import { FileText, BookOpen, School, Calendar, CheckCircle, XCircle, User, Download, ArrowLeft } from "lucide-react";
import { API_URL } from "./config";
import { Card, SelectInput, Button, unique, Label, Spinner } from "./Shared";

export default function AdminReport({ goHome }) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  
  // Data Buckets
  const [meta, setMeta] = useState({ sessions: [], faculties: [], departments: [], classes: [] });
  const [selections, setSelections] = useState({ session: "", semester: "", faculty: "", dept: "", classId: "" });

  // --- 1. Cascading API Loaders ---
  useEffect(() => { axios.get(`${API_URL}/meta/sessions`).then(res => setMeta(m => ({ ...m, sessions: res.data }))); }, []);
  
  useEffect(() => {
    if (selections.session && selections.semester) {
      axios.get(`${API_URL}/meta/faculties?session=${selections.session}&semester=${selections.semester}`)
        .then(res => setMeta(m => ({ ...m, faculties: res.data })));
    }
  }, [selections.session, selections.semester]);

  useEffect(() => {
    if (selections.faculty) {
      axios.get(`${API_URL}/meta/departments?faculty=${selections.faculty}`)
        .then(res => setMeta(m => ({ ...m, departments: res.data })));
    }
  }, [selections.faculty]);

  // NOTE: Admin doesn't need to select a Lecturer, just the Department -> Course
  // But our backend currently filters classes by Lecturer ID. 
  // TO FIX THIS properly, we should add an endpoint to get classes by Department.
  // FOR NOW: We will fetch all lecturers in the dept, then fetch all their classes to build a list.
  useEffect(() => {
    if (selections.dept) {
      // 1. Get Lecturers in Dept
      axios.get(`${API_URL}/meta/lecturers?department=${selections.dept}`)
        .then(async (res) => {
           const lecturers = res.data;
           let allClasses = [];
           // 2. Parallel fetch of classes for all lecturers in this dept
           // (In a real production app, you'd make a single API call: /meta/classes?department=CS)
           const promises = lecturers.map(l => axios.get(`${API_URL}/meta/classes?lecturerId=${l.id}`));
           const results = await Promise.all(promises);
           results.forEach(r => allClasses.push(...r.data));
           setMeta(m => ({ ...m, classes: allClasses }));
        });
    }
  }, [selections.dept]);

  const handleSelection = (field, value) => setSelections(prev => ({ ...prev, [field]: value }));

  // --- 2. Generate Report Action ---
  const generateReport = async () => {
    if (!selections.classId) return;
    setLoading(true);
    setReport(null);
    
    const courseName = meta.classes.find(c => c.id === selections.classId)?.course;
    
    try {
      const res = await axios.get(`${API_URL}/admin/report?course=${courseName}`);
      setReport({ ...res.data, courseName });
    } catch (err) {
      alert("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      
      {/* 1. Filter Card */}
      <Card title="Exam Eligibility Portal" subtitle="Generate attendance reports for any course" color="border-gray-800">
        <div className="grid grid-cols-2 gap-4">
          <SelectInput icon={<Calendar size={16}/>} label="Session" options={unique(meta.sessions, 'session')} value={selections.session} onChange={v => handleSelection('session', v)} />
          <SelectInput label="Semester" options={unique(meta.sessions, 'semester')} value={selections.semester} onChange={v => handleSelection('semester', v)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
           <SelectInput icon={<BookOpen size={16}/>} label="Faculty" options={meta.faculties.map(f => f.faculty)} value={selections.faculty} onChange={v => handleSelection('faculty', v)} />
           <SelectInput label="Department" options={meta.departments.map(d => d.department)} value={selections.dept} onChange={v => handleSelection('dept', v)} />
        </div>
        
        <div className="group">
           <Label icon={<School size={16}/>}>Course</Label>
           <select className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg p-3 outline-none disabled:opacity-50" disabled={!meta.classes.length} value={selections.classId} onChange={(e) => handleSelection('classId', e.target.value)}>
             <option value="">Select Course...</option>
             {meta.classes.map(c => <option key={c.id} value={c.id}>{c.course}</option>)}
           </select>
        </div>

        <Button onClick={generateReport} disabled={!selections.classId} loading={loading} colorClass="bg-gray-800 hover:bg-black shadow-gray-200">
          <FileText size={20}/> VIEW ELIGIBILITY LIST
        </Button>
      </Card>

      {/* 2. Results Table */}
      {report && (
        <div className="bg-white rounded-3xl shadow-xl border-t-4 border-blue-600 overflow-hidden animate-fade-in-up">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-blue-50">
            <div>
              <h2 className="text-xl font-bold text-blue-900">{report.courseName}</h2>
              <p className="text-sm text-blue-600">Total Classes Held: <span className="font-bold">{report.totalClasses}</span></p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Eligibility Threshold</span>
              <p className="text-2xl font-bold text-gray-900">80%</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-100 uppercase text-xs font-bold text-gray-500">
                <tr>
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">Matric No</th>
                  <th className="px-6 py-4 text-center">Attended</th>
                  <th className="px-6 py-4 text-center">Percentage</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {report.students.length === 0 ? (
                   <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">No students found for this course.</td></tr>
                ) : (
                  report.students.map((s, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{s.lastName} {s.firstName}</td>
                      <td className="px-6 py-4">{s.matricNumber}</td>
                      <td className="px-6 py-4 text-center font-mono">{s.attended} / {s.total}</td>
                      <td className="px-6 py-4 text-center font-bold">{s.percentage}%</td>
                      <td className="px-6 py-4 text-center">
                        {s.isEligible ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                            <CheckCircle size={14}/> ELIGIBLE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                            <XCircle size={14}/> BARRED
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}