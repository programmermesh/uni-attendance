import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  FileBarChart,
  LogOut,
  MapPin,
  UserPlus,
  Building2,
  Shield,
  Presentation,
  User,
  Mail,
  Phone,
  Lock,
  Settings,
  Key,
  Calendar,
  Clock,
  Eye,
  EyeOff,
  Layers,
  Check,
  ChevronDown,
  Search,
  Menu,
  X,
  AlertCircle,
  Download,
  Printer,
  Loader2,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { API_URL } from "./config";
import {
  Card,
  Button,
  SuccessScreen,
  ToastProvider,
  useToast,
  Label,
} from "./Shared";
import * as XLSX from "xlsx";

// ============================================================================
// STYLING COMPONENTS (Unchanged)
// ============================================================================

const FormInput = ({ label, icon: Icon, type = "text", ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="space-y-1.5 w-full">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
        {label}
      </label>
      <div className="relative group">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
            <Icon size={18} />
          </div>
        )}
        <input
          type={isPassword ? (showPassword ? "text" : "password") : type}
          className={`
            w-full bg-white border border-gray-200 text-gray-800 text-sm rounded-xl py-3 
            ${Icon ? "pl-10" : "px-4"} 
            ${isPassword ? "pr-10" : "pr-4"} 
            outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-gray-300 shadow-sm
          `}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer focus:outline-none"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};

const FormSelect = ({ label, icon: Icon, children, ...props }) => (
  <div className="space-y-1.5 w-full">
    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
      {label}
    </label>
    <div className="relative group">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
          <Icon size={18} />
        </div>
      )}
      <select
        className={`w-full bg-white border border-gray-200 text-gray-800 text-sm rounded-xl py-3 ${
          Icon ? "pl-10" : "px-4"
        } pr-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer shadow-sm`}
        {...props}
      >
        {children}
      </select>
    </div>
  </div>
);

// ============================================================================
// 🎛️ MAIN EXPORT
// ============================================================================
export default function AdminDashboardWrapper(props) {
  return (
    <ToastProvider>
      <AdminDashboardContent {...props} />
    </ToastProvider>
  );
}

function AdminDashboardContent({ user, goHome }) {
  const getStartTab = () => {
    if (user.role === "lecturer") return "my_classes";
    if (user.role === "exam_officer") return "reports";
    return "overview";
  };

  const [activeTab, setActiveTab] = useState(getStartTab());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans relative">
      {/* 📱 MOBILE HEADER */}
      <div className="lg:hidden fixed top-0 w-full bg-slate-900 text-white z-50 px-4 py-3 flex justify-between items-center shadow-md">
        <h2 className="text-lg font-black tracking-tighter">
          Check<span className="text-blue-500">It</span>
        </h2>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* SIDEBAR */}
      <aside
        className={`
          w-72 bg-slate-900 text-white flex flex-col fixed h-full z-40 shadow-2xl transition-transform duration-300 ease-in-out
          ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 lg:static lg:h-screen
        `}
      >
        <div className="p-8 border-b border-slate-800 hidden lg:block">
          <h2 className="text-2xl font-black tracking-tighter">
            Check<span className="text-blue-500">It</span>
          </h2>
        </div>

        <div className="px-6 pt-6 lg:pt-0 pb-4">
          <div className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-2xl border border-slate-700 mt-6 lg:mt-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-sm font-bold shadow-lg shadow-blue-900/50 shrink-0">
              {user.firstName[0]}
              {user.lastName[0]}
            </div>
            <div className="leading-tight overflow-hidden">
              <p className="text-sm font-bold truncate">
                {user.title ? user.title + " " : ""}
                {user.firstName}
              </p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                {user.role.replace("_", " ")}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-6 py-2 space-y-1 overflow-y-auto custom-scrollbar">
          {user.role === "admin" && (
            <>
              <NavSection title="Directory" />
              <NavItem
                icon={<LayoutDashboard size={18} />}
                label="Overview"
                active={activeTab === "overview"}
                onClick={() => {
                  setActiveTab("overview");
                  closeMenu();
                }}
              />
              <NavItem
                icon={<Users size={18} />}
                label="Lecturer List"
                active={activeTab === "lecturer_list"}
                onClick={() => {
                  setActiveTab("lecturer_list");
                  closeMenu();
                }}
              />

              <NavSection title="Administration" />
              <NavItem
                icon={<Building2 size={18} />}
                label="School Structure"
                active={activeTab === "structure"}
                onClick={() => {
                  setActiveTab("structure");
                  closeMenu();
                }}
              />

              <NavSection title="Onboarding" />
              <NavItem
                icon={<UserPlus size={18} />}
                label="Register Staff"
                active={activeTab === "register_staff"}
                onClick={() => {
                  setActiveTab("register_staff");
                  closeMenu();
                }}
              />
              <NavItem
                icon={<GraduationCap size={18} />}
                label="Register Student"
                active={activeTab === "add_student"}
                onClick={() => {
                  setActiveTab("add_student");
                  closeMenu();
                }}
              />
            </>
          )}

          {user.role === "lecturer" && (
            <>
              <NavSection title="Academics" />
              <NavItem
                icon={<BookOpen size={18} />}
                label="Create Course"
                active={activeTab === "create_course"}
                onClick={() => {
                  setActiveTab("create_course");
                  closeMenu();
                }}
              />
              <NavItem
                icon={<MapPin size={18} />}
                label="Activate Session"
                active={activeTab === "my_classes"}
                onClick={() => {
                  setActiveTab("my_classes");
                  closeMenu();
                }}
              />
            </>
          )}

          {(user.role === "exam_officer" ||
            user.role === "admin" ||
            user.role === "lecturer") && (
            <>
              <NavSection title="Examinations" />
              <NavItem
                icon={<FileBarChart size={18} />}
                label="Eligibility Reports"
                active={activeTab === "reports"}
                onClick={() => {
                  setActiveTab("reports");
                  closeMenu();
                }}
              />
            </>
          )}

          <NavSection title="Account" />
          <NavItem
            icon={<Settings size={18} />}
            label="Settings"
            active={activeTab === "settings"}
            onClick={() => {
              setActiveTab("settings");
              closeMenu();
            }}
          />
        </nav>

        <div className="p-6 border-t border-slate-800">
          <button
            onClick={goHome}
            className="flex items-center gap-3 text-slate-400 hover:text-white hover:bg-slate-800 transition-all w-full p-3 rounded-xl text-sm font-medium group"
          >
            <LogOut
              size={18}
              className="group-hover:-translate-x-1 transition-transform"
            />{" "}
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 w-full lg:w-auto h-screen overflow-y-auto pt-20 lg:pt-10 p-4 lg:p-10 bg-gray-50">
        <div className="max-w-7xl mx-auto space-y-6">
          {user.role === "admin" && (
            <>
              {activeTab === "overview" && <DashboardOverview />}
              {activeTab === "lecturer_list" && <LecturerList />}
              {activeTab === "structure" && <ManageStructure />}
              {activeTab === "register_staff" && <RegisterStaff />}
              {activeTab === "add_student" && <ManageStudents />}
            </>
          )}

          {user.role === "lecturer" && (
            <>
              {activeTab === "create_course" && (
                <ManageCourses currentUser={user} />
              )}
              {activeTab === "my_classes" && (
                <LecturerActions currentUser={user} />
              )}
            </>
          )}

          {activeTab === "reports" && <ExamOfficerPortal />}
          {activeTab === "settings" && <SettingsPage user={user} />}
        </div>
      </main>

      {isMobileMenuOpen && (
        <div
          onClick={closeMenu}
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
        ></div>
      )}
    </div>
  );
}

const NavSection = ({ title }) => (
  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6 px-4">
    {title}
  </div>
);

const NavItem = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm ${
      active
        ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30 translate-x-1"
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
    }`}
  >
    {icon} <span>{label}</span>
  </button>
);

// ============================================================================
// OVERVIEW (Student Management with Bulk Promote & Custom Modals)
// ============================================================================
function DashboardOverview() {
  const toast = useToast();

  // 1. Core Data State
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    totalLecturers: 0,
  });
  const [students, setStudents] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // 2. Filter & Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filterFaculty, setFilterFaculty] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // 3. Action States (Edit & Bulk)
  const [editingStudent, setEditingStudent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [promoting, setPromoting] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    targetLevel: "",
  });

  // --- FETCH DATA ---
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [metricRes, facRes, studentRes] = await Promise.all([
        axios.get(`${API_URL}/admin/metrics`),
        axios.get(`${API_URL}/meta/faculties-list`),
        axios.get(`${API_URL}/admin/student`),
      ]);
      setMetrics(metricRes.data);
      setFaculties(facRes.data);
      const studentList = Array.isArray(studentRes.data)
        ? studentRes.data
        : studentRes.data.data || [];
      setStudents(studentList);
    } catch (err) {
      console.error("Dashboard Load Error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Load Departments when Faculty filter changes
  useEffect(() => {
    if (filterFaculty) {
      const selectedFac = faculties.find(
        (f) => f.id === filterFaculty || f.name === filterFaculty
      );
      const facId = selectedFac ? selectedFac.id : filterFaculty;
      axios
        .get(`${API_URL}/meta/departments-list?facultyId=${facId}`)
        .then((res) => setDepartments(res.data))
        .catch(() => setDepartments([]));
    } else {
      setDepartments([]);
      setFilterDept("");
    }
  }, [filterFaculty, faculties]);

  // --- LOGIC: Filter & Selection ---
  const filteredStudents = students.filter((s) => {
    const fullName = `${s.firstName || ""} ${s.lastName || ""}`.toLowerCase();
    const matric = (s.matricNumber || "").toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      matric.includes(searchTerm.toLowerCase());

    const sFac = typeof s.faculty === "object" ? s.faculty?.name : s.faculty;
    const matchesFac = filterFaculty
      ? sFac === faculties.find((f) => f.id === filterFaculty)?.name ||
        s.faculty === filterFaculty
      : true;

    const sDept =
      typeof s.department === "object" ? s.department?.name : s.department;
    const matchesDept = filterDept
      ? sDept === departments.find((d) => d.id === filterDept)?.name ||
        s.department === filterDept
      : true;

    return matchesSearch && matchesFac && matchesDept;
  });

  const currentItems = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const toggleSelectAll = () => {
    if (selectedIds.length === currentItems.length && currentItems.length > 0)
      setSelectedIds([]);
    else setSelectedIds(currentItems.map((s) => s.id));
  };

  // --- ACTIONS: Bulk Promote ---
  const executePromotion = async () => {
    setPromoting(true);
    try {
      await axios.post(`${API_URL}/admin/bulk-promote`, {
        ids: selectedIds,
        newLevel: confirmModal.targetLevel,
      });
      toast.success(`Successfully promoted ${selectedIds.length} students!`);
      setSelectedIds([]);
      setConfirmModal({ show: false, targetLevel: "" });
      loadDashboardData();
    } catch (err) {
      toast.error("Promotion failed");
    } finally {
      setPromoting(false);
    }
  };

  // --- ACTIONS: Update Single Student ---
  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.patch(`${API_URL}/admin/student/${editingStudent.id}`, {
        firstName: editingStudent.firstName,
        lastName: editingStudent.lastName,
        level: editingStudent.level,
        sex: editingStudent.sex,
      });
      toast.success("Record updated!");
      setEditingStudent(null);
      loadDashboardData();
    } catch (err) {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up pb-20 relative">
      {/* 📊 METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard
          label="Total Students"
          value={metrics.totalStudents}
          icon={<GraduationCap size={24} className="text-blue-600" />}
          color="bg-blue-50 border-blue-200"
        />
        <MetricCard
          label="Total Lecturers"
          value={metrics.totalLecturers}
          icon={<Users size={24} className="text-emerald-600" />}
          color="bg-emerald-50 border-emerald-200"
        />
      </div>

      {/* BULK ACTION BAR */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] w-full max-w-xl px-4">
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between border border-white/10 backdrop-blur-lg">
            <div className="flex items-center gap-3 pl-2">
              <span className="bg-blue-600 px-2 py-1 rounded text-[10px] font-black">
                {selectedIds.length} SELECTED
              </span>
              <p className="text-sm font-bold">Bulk Promote to:</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-3 py-2 outline-none cursor-pointer"
                onChange={(e) =>
                  e.target.value &&
                  setConfirmModal({ show: true, targetLevel: e.target.value })
                }
              >
                <option value="">-- Level --</option>
                <option value="200">200</option>
                <option value="300">300</option>
                <option value="400">400</option>
                <option value="500">500</option>
                <option value="600">600</option>
                <option value="700">700</option>
              </select>
              <button
                onClick={() => setSelectedIds([])}
                className="p-2 hover:text-red-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT DIRECTORY CARD */}
      <Card
        title="Student Directory"
        subtitle="Manage university students"
        className="w-full"
      >
        {/* Filters */}
        <div className="p-5 border-b border-gray-200 bg-gray-50/50">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-4 relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search name or matric..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="md:col-span-3">
              <select
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
                value={filterFaculty}
                onChange={(e) => setFilterFaculty(e.target.value)}
              >
                <option value="">All Faculties</option>
                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-3">
              <select
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
                disabled={!filterFaculty}
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2 flex items-center justify-end font-bold text-gray-400 text-[10px] uppercase">
              {filteredStudents.length} Records
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold">
              <tr>
                <th className="px-6 py-4 w-10">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                    checked={
                      selectedIds.length === currentItems.length &&
                      currentItems.length > 0
                    }
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 py-4">Student Name</th>
                <th className="px-6 py-4">Matric No</th>
                <th className="px-6 py-4 text-center">Level</th>
                <th className="px-6 py-4 text-right">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center">
                    <Loader2 className="animate-spin inline text-blue-600" />
                  </td>
                </tr>
              ) : (
                currentItems.map((s) => (
                  <tr
                    key={s.id}
                    className={`${
                      selectedIds.includes(s.id)
                        ? "bg-blue-50/50"
                        : "hover:bg-blue-50/20"
                    } transition-colors`}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                        checked={selectedIds.includes(s.id)}
                        onChange={() =>
                          setSelectedIds((prev) =>
                            prev.includes(s.id)
                              ? prev.filter((i) => i !== s.id)
                              : [...prev, s.id]
                          )
                        }
                      />
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {s.lastName} {s.firstName}
                      <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">
                        {typeof s.department === "object"
                          ? s.department?.name
                          : s.department}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                      {s.matricNumber}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-[10px] font-black italic">
                        {s.level}L
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setEditingStudent({ ...s })}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Settings size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <p className="text-[10px] text-gray-500 font-bold uppercase">
            Page {currentPage} of {totalPages || 1}
          </p>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-2 rounded-lg bg-white border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
            >
              <ArrowLeft size={16} />
            </button>
            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-2 rounded-lg bg-white border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </Card>

      {/* 🛠️ MODAL 1: EDIT STUDENT INFO */}
      {editingStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-zoom-in">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-blue-50/30">
              <div>
                <h3 className="text-xl font-black text-slate-900 italic uppercase">
                  Edit Record
                </h3>
                <p className="text-xs text-slate-500 font-bold">
                  {editingStudent.matricNumber}
                </p>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-2 text-slate-400 hover:text-red-500"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleUpdateStudent} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="First Name"
                  value={editingStudent.firstName}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      firstName: e.target.value,
                    })
                  }
                />
                <FormInput
                  label="Last Name"
                  value={editingStudent.lastName}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      lastName: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormSelect
                  label="Academic Level"
                  value={editingStudent.level}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      level: e.target.value,
                    })
                  }
                >
                  <option>100</option>
                  <option>200</option>
                  <option>300</option>
                  <option>400</option>
                  <option>500</option>
                  <option>600</option>
                  <option>700</option>
                  <option>PGC</option>
                </FormSelect>
                <FormSelect
                  label="Gender"
                  value={editingStudent.sex}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      sex: e.target.value,
                    })
                  }
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </FormSelect>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="flex-1 py-4 text-sm font-bold text-gray-400 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all"
                >
                  Discard
                </button>
                <Button
                  type="submit"
                  loading={saving}
                  colorClass="bg-blue-600 hover:bg-blue-700 flex-[2] py-4 shadow-xl shadow-blue-200"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK PROMOTE CONFIRMATION */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl text-center space-y-6 animate-zoom-in">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <ArrowRight size={40} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900">
                Are you sure?
              </h3>
              <p className="text-sm text-slate-500 mt-2">
                You are moving{" "}
                <span className="font-bold text-blue-600">
                  {selectedIds.length} students
                </span>{" "}
                to{" "}
                <span className="font-bold text-slate-900">
                  {confirmModal.targetLevel} Level
                </span>
                .
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() =>
                  setConfirmModal({ show: false, targetLevel: "" })
                }
                className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl font-bold hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={executePromotion}
                disabled={promoting}
                className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 flex items-center justify-center"
              >
                {promoting ? <Spinner /> : "Confirm Promotion"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const MetricCard = ({ label, value, icon, color }) => (
  <div
    className={`p-6 rounded-2xl border ${color} flex flex-col justify-between h-28 md:h-32 shadow-sm`}
  >
    <div className="flex justify-between items-start">
      <div className="text-gray-500 font-medium text-xs md:text-sm">
        {label}
      </div>
      <div className="p-2 bg-white rounded-lg shadow-sm">{icon}</div>
    </div>
    <div className="text-2xl md:text-3xl font-bold text-gray-800">{value}</div>
  </div>
);

// ============================================================================
// LECTURER DIRECTORY (Paginated + Editable with Dynamic Depts)
// ============================================================================
function LecturerList() {
  const toast = useToast();
  const [allLecturers, setAllLecturers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [editingLecturer, setEditingLecturer] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalDepartments, setModalDepartments] = useState([]);

  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedFacId, setSelectedFacId] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchLecturers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/meta/lecturers`);
      setAllLecturers(res.data);
    } catch (e) {
      toast.error("Failed to load lecturers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    axios
      .get(`${API_URL}/meta/faculties-list`)
      .then((res) => setFaculties(res.data));
    fetchLecturers();
  }, []);

  useEffect(() => {
    if (selectedFacId) {
      axios
        .get(`${API_URL}/meta/departments-list?facultyId=${selectedFacId}`)
        .then((res) => setDepartments(res.data))
        .catch(() => setDepartments([]));
    } else {
      setDepartments([]);
      setSelectedDeptId("");
    }
  }, [selectedFacId]);

  useEffect(() => {
    if (editingLecturer?.faculty) {
      const selectedFac = faculties.find(
        (f) =>
          f.name === editingLecturer.faculty || f.id === editingLecturer.faculty
      );
      const facId = selectedFac ? selectedFac.id : null;

      if (facId) {
        axios
          .get(`${API_URL}/meta/departments-list?facultyId=${facId}`)
          .then((res) => setModalDepartments(res.data))
          .catch(() => setModalDepartments([]));
      }
    } else {
      setModalDepartments([]);
    }
  }, [editingLecturer?.faculty, faculties]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedFacId, selectedDeptId]);

  const filteredLecturers = allLecturers.filter((l) => {
    const fullName = `${l.title} ${l.firstName} ${l.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      l.email.toLowerCase().includes(searchTerm.toLowerCase());

    const facName = faculties.find((f) => f.id === selectedFacId)?.name;
    const deptName = departments.find((d) => d.id === selectedDeptId)?.name;

    const matchesFac = selectedFacId ? l.faculty === facName : true;
    const matchesDept = selectedDeptId ? l.department === deptName : true;

    return matchesSearch && matchesFac && matchesDept;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredLecturers.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredLecturers.length / itemsPerPage);

  const handleUpdateLecturer = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.patch(
        `${API_URL}/admin/lecturer/${editingLecturer.id}`,
        editingLecturer
      );
      toast.success("Lecturer updated successfully");
      setEditingLecturer(null);
      fetchLecturers();
    } catch (err) {
      toast.error("Failed to update lecturer");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Card
        title="Lecturer Directory"
        subtitle="Manage university lecturers"
        className="w-full"
      >
        <div className="mb-8 grid grid-cols-1 md:grid-cols-12 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <div className="md:col-span-4 relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-500 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="md:col-span-4">
            <select
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white"
              value={selectedFacId}
              onChange={(e) => setSelectedFacId(e.target.value)}
            >
              <option value="">All Faculties</option>
              {faculties.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-4">
            <select
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white"
              disabled={!selectedFacId}
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded-2xl shadow-sm">
          <table className="w-full text-sm text-left text-gray-500 whitespace-nowrap">
            <thead className="text-[10px] text-gray-500 uppercase font-black bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Full Name</th>
                <th className="px-6 py-4">Faculty / Department</th>
                <th className="px-6 py-4">Contact Email</th>
                <th className="px-6 py-4 text-right">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="p-10 text-center">
                    <Loader2 className="animate-spin inline text-blue-600" />
                  </td>
                </tr>
              ) : (
                currentItems.map((l) => (
                  <tr
                    key={l.id}
                    className="bg-white hover:bg-blue-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">
                        {l.title} {l.firstName} {l.lastName}
                      </div>
                      <div className="text-[10px] text-gray-400 uppercase">
                        ID: {l.id.split("-")[0]}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-700 font-medium">
                        {l.faculty}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {l.department}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-blue-600">
                      {l.email}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setEditingLecturer({ ...l })}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                      >
                        <Settings size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 flex justify-between items-center bg-gray-50 border-t border-gray-100 rounded-b-2xl">
          <p className="text-[10px] font-bold text-gray-400 uppercase">
            Page {currentPage} of {totalPages || 1}
          </p>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-2 bg-white rounded-lg border border-gray-200 disabled:opacity-50"
            >
              <ArrowLeft size={16} />
            </button>
            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-2 bg-white rounded-lg border border-gray-200 disabled:opacity-50"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </Card>

      {editingLecturer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-zoom-in">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-blue-50/50">
              <h3 className="text-xl font-bold text-gray-900">
                Edit Staff Info
              </h3>
              <button
                onClick={() => setEditingLecturer(null)}
                className="p-2 text-gray-400 hover:text-red-500"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateLecturer} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormSelect
                  label="Title"
                  value={editingLecturer.title}
                  onChange={(e) =>
                    setEditingLecturer({
                      ...editingLecturer,
                      title: e.target.value,
                    })
                  }
                >
                  <option>Dr.</option>
                  <option>Prof.</option>
                  <option>Mr.</option>
                  <option>Mrs.</option>
                </FormSelect>
                <FormInput
                  label="Email Address"
                  value={editingLecturer.email}
                  onChange={(e) =>
                    setEditingLecturer({
                      ...editingLecturer,
                      email: e.target.value,
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="First Name"
                  value={editingLecturer.firstName}
                  onChange={(e) =>
                    setEditingLecturer({
                      ...editingLecturer,
                      firstName: e.target.value,
                    })
                  }
                />
                <FormInput
                  label="Last Name"
                  value={editingLecturer.lastName}
                  onChange={(e) =>
                    setEditingLecturer({
                      ...editingLecturer,
                      lastName: e.target.value,
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormSelect
                  label="Faculty"
                  value={editingLecturer.faculty}
                  onChange={(e) =>
                    setEditingLecturer({
                      ...editingLecturer,
                      faculty: e.target.value,
                      department: "",
                    })
                  }
                >
                  <option value="">Select Faculty</option>
                  {faculties.map((f) => (
                    <option key={f.id} value={f.name}>
                      {f.name}
                    </option>
                  ))}
                </FormSelect>

                <FormSelect
                  label="Department"
                  value={editingLecturer.department}
                  disabled={!editingLecturer.faculty}
                  onChange={(e) =>
                    setEditingLecturer({
                      ...editingLecturer,
                      department: e.target.value,
                    })
                  }
                >
                  <option value="">Select Department</option>
                  {modalDepartments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </FormSelect>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingLecturer(null)}
                  className="flex-1 py-3 text-xs font-bold text-gray-500 bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  loading={saving}
                  colorClass="bg-blue-600 hover:bg-blue-700 flex-1"
                >
                  Save Profile
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MANAGE STRUCTURE
// ============================================================================
function ManageStructure() {
  const toast = useToast();
  const [faculties, setFaculties] = useState([]);
  const [newFaculty, setNewFaculty] = useState("");
  const [newDept, setNewDept] = useState({ facultyId: "", name: "" });
  const [loadingFac, setLoadingFac] = useState(false);
  const [loadingDept, setLoadingDept] = useState(false);

  const fetchFaculties = () => {
    axios
      .get(`${API_URL}/meta/faculties-list`)
      .then((res) => setFaculties(res.data))
      .catch((e) => console.error(e));
  };

  useEffect(() => {
    fetchFaculties();
  }, []);

  // ✅ Fixed using arrow function syntax to avoid "Unexpected keyword" errors
  const createFaculty = async () => {
    if (!newFaculty) return;
    setLoadingFac(true);
    try {
      await axios.post(`${API_URL}/admin/faculty`, { name: newFaculty });
      toast.success("Faculty Created Successfully!");
      setNewFaculty("");
      fetchFaculties();
    } catch (err) {
      toast.error("Failed to create faculty");
    } finally {
      setLoadingFac(false);
    }
  };

  // ✅ Fixed using arrow function syntax
  const createDept = async () => {
    if (!newDept.facultyId || !newDept.name) return;
    setLoadingDept(true);
    try {
      await axios.post(`${API_URL}/admin/department`, newDept);
      toast.success("Department Created Successfully!");
      setNewDept({ ...newDept, name: "" });
    } catch (err) {
      toast.error("Failed to create department");
    } finally {
      setLoadingDept(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up">
      <Card title="Manage Faculties" subtitle="Create broad areas of study">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <FormInput
            label="Faculty Name"
            placeholder="e.g. Engineering"
            value={newFaculty}
            onChange={(e) => setNewFaculty(e.target.value)}
          />
          <div className="mb-0.5 w-full sm:w-24">
            <Button
              onClick={createFaculty}
              loading={loadingFac}
              colorClass="bg-slate-800 hover:bg-black"
            >
              Add
            </Button>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            Existing Faculties
          </p>
          <div className="flex flex-wrap gap-2">
            {faculties.length === 0 && (
              <span className="text-xs text-gray-400">No faculties found.</span>
            )}
            {faculties.map((f) => (
              <span
                key={f.id}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200"
              >
                {f.name}
              </span>
            ))}
          </div>
        </div>
      </Card>

      <Card title="Manage Departments" subtitle="Add departments to faculties">
        <div className="space-y-4">
          <FormSelect
            label="Select Faculty"
            value={newDept.facultyId}
            onChange={(e) =>
              setNewDept({ ...newDept, facultyId: e.target.value })
            }
          >
            <option value="">Choose Faculty...</option>
            {faculties.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </FormSelect>

          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <FormInput
              label="Department Name"
              placeholder="e.g. Civil Engineering"
              value={newDept.name}
              onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
            />
            <div className="mb-0.5 w-full sm:w-24">
              <Button
                onClick={createDept}
                loading={loadingDept}
                disabled={!newDept.facultyId}
                colorClass="bg-slate-800 hover:bg-black"
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// REGISTER STAFF
// ============================================================================
function RegisterStaff() {
  const toast = useToast();
  const [roleType, setRoleType] = useState("lecturer");
  const [form, setForm] = useState({
    title: "Dr.",
    firstName: "",
    lastName: "",
    middleName: "",
    email: "",
    phoneNumber: "",
    faculty: "",
    department: "",
  });
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);

  useEffect(() => {
    axios
      .get(`${API_URL}/meta/faculties-list`)
      .then((res) => setFaculties(res.data));
  }, []);

  useEffect(() => {
    if (form.faculty)
      axios
        .get(`${API_URL}/meta/departments-list?facultyId=${form.faculty}`)
        .then((res) => setDepartments(res.data));
    else setDepartments([]);
  }, [form.faculty]);

  const handleSubmit = async () => {
    if (!form.email || !form.firstName)
      return toast.error("Email and Name required");
    setLoading(true);
    const facultyName =
      faculties.find((f) => f.id === form.faculty)?.name || form.faculty;
    const deptName =
      departments.find((d) => d.id === form.department)?.name ||
      form.department;

    let endpoint =
      roleType === "lecturer"
        ? "admin/lecturer"
        : roleType === "admin"
        ? "admin/create-admin"
        : "admin/create-exam-officer";

    try {
      await axios.post(`${API_URL}/${endpoint}`, {
        ...form,
        faculty: facultyName,
        department: deptName,
        role: roleType,
      });
      toast.success(`${roleType.replace("_", " ")} created successfully!`);
      setForm({
        ...form,
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
      });
    } catch (err) {
      toast.error("Action Failed");
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      [
        "title",
        "firstName",
        "lastName",
        "email",
        "role",
        "faculty",
        "department",
        "phoneNumber",
        "password",
      ],
    ];
    const ws = XLSX.utils.aoa_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `staff_upload_template.xlsx`);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      setBulkLoading(true);
      setUploadResults(null);
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wsname]);
        const res = await axios.post(`${API_URL}/admin/staff/bulk`, data);
        setUploadResults(res.data);
        toast.success("Import complete.");
      } catch (err) {
        toast.error("Bulk upload failed.");
      } finally {
        setBulkLoading(false);
        e.target.value = null;
      }
    };
    reader.readAsBinaryString(file);
  };

  const defaultPassword =
    roleType === "admin"
      ? "admin123"
      : roleType === "exam_officer"
      ? "exam123"
      : "password123";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Card
          title="Staff Registration"
          subtitle="Create accounts for university staff"
          color={roleType === "admin" ? "border-red-500" : "border-blue-500"}
        >
          <div className="bg-slate-50 p-2 rounded-xl mb-8 border border-slate-100 grid grid-cols-3 gap-2">
            <RoleTab
              label="Lecturer"
              icon={<Presentation size={14} />}
              active={roleType === "lecturer"}
              onClick={() => setRoleType("lecturer")}
            />
            <RoleTab
              label="Officer"
              icon={<FileBarChart size={14} />}
              active={roleType === "exam_officer"}
              onClick={() => setRoleType("exam_officer")}
            />
            <RoleTab
              label="Admin"
              icon={<Shield size={14} />}
              active={roleType === "admin"}
              onClick={() => setRoleType("admin")}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="flex gap-4">
                {roleType === "lecturer" && (
                  <div className="w-1/3">
                    <FormSelect
                      label="Title"
                      value={form.title}
                      onChange={(e) =>
                        setForm({ ...form, title: e.target.value })
                      }
                    >
                      <option>Dr.</option>
                      <option>Prof.</option>
                      <option>Mr.</option>
                      <option>Mrs.</option>
                    </FormSelect>
                  </div>
                )}
                <div className="flex-1">
                  <FormInput
                    label="First Name"
                    icon={User}
                    value={form.firstName}
                    onChange={(e) =>
                      setForm({ ...form, firstName: e.target.value })
                    }
                  />
                </div>
              </div>
              <FormInput
                label="Middle Name"
                icon={User}
                value={form.middleName}
                onChange={(e) =>
                  setForm({ ...form, middleName: e.target.value })
                }
              />
              <FormInput
                label="Email Address"
                icon={Mail}
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-6">
              <FormInput
                label="Last Name"
                icon={User}
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
              {roleType === "lecturer" ? (
                <FormInput
                  label="Phone Number"
                  icon={Phone}
                  value={form.phoneNumber}
                  onChange={(e) =>
                    setForm({ ...form, phoneNumber: e.target.value })
                  }
                />
              ) : (
                <div className="p-6 rounded-xl border bg-slate-50 border-slate-200 flex gap-4 items-center">
                  <Lock className="text-slate-400" size={20} />
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-500">
                      Default Password
                    </p>
                    <p className="text-sm font-mono font-bold text-blue-600">
                      {defaultPassword}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {roleType === "lecturer" && (
            <div className="mt-8 pt-8 border-t border-gray-100">
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-6 tracking-widest">
                Academic Assignment
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormSelect
                  label="Faculty"
                  value={form.faculty}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      faculty: e.target.value,
                      department: "",
                    })
                  }
                >
                  <option value="">Select Faculty...</option>
                  {faculties.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </FormSelect>
                <FormSelect
                  label="Department"
                  disabled={!form.faculty}
                  value={form.department}
                  onChange={(e) =>
                    setForm({ ...form, department: e.target.value })
                  }
                >
                  <option value="">Select Department...</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </FormSelect>
              </div>
            </div>
          )}
          <div className="mt-10 flex justify-end">
            <Button
              onClick={handleSubmit}
              loading={loading}
              colorClass={
                roleType === "admin"
                  ? "bg-slate-900 hover:bg-black w-full md:w-1/3"
                  : "bg-blue-600 hover:bg-blue-700 w-full md:w-1/3"
              }
            >
              Create {roleType.replace("_", " ")}
            </Button>
          </div>
        </Card>

        {uploadResults && (
          <Card
            title="Staff Import Summary"
            subtitle="Details of the bulk operation"
          >
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-green-50 rounded-2xl border border-green-100 text-center text-green-700">
                <p className="text-[10px] font-bold uppercase">Success</p>
                <p className="text-2xl font-black">
                  {uploadResults.successfullyCreated?.length || 0}
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-2xl border border-red-100 text-center text-red-700">
                <p className="text-[10px] font-bold uppercase">Failed</p>
                <p className="text-2xl font-black">
                  {uploadResults.failedRecords?.length || 0}
                </p>
              </div>
            </div>
            {uploadResults.failedRecords.map((err, i) => (
              <div
                key={i}
                className="p-3 text-xs flex justify-between bg-white items-center"
              >
                <span className="font-bold text-slate-700">
                  {err.identifier}
                </span>
                <span className="text-red-500 font-medium italic">
                  {err.reason}
                </span>
              </div>
            ))}
            <Button
              onClick={() => setUploadResults(null)}
              colorClass="mt-4 bg-slate-100 text-slate-600 w-full"
            >
              Dismiss
            </Button>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl border border-slate-800 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-3xl flex items-center justify-center mx-auto border border-blue-500/30">
              <Users size={32} />
            </div>
            <h3 className="text-xl font-black">Staff Bulk Upload</h3>
            <p className="text-xs text-slate-400 italic">
              Import multiple roles at once.
            </p>
          </div>
          <button
            onClick={downloadTemplate}
            className="w-full py-4 bg-slate-800 text-slate-300 rounded-2xl text-xs font-bold uppercase hover:bg-slate-700 transition-all border border-slate-700 flex items-center justify-center gap-2"
          >
            <Download size={18} /> Get Excel Template
          </button>
          <label className="w-full py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase hover:bg-blue-500 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-900/50">
            <input
              type="file"
              className="hidden"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              disabled={bulkLoading}
            />
            {bulkLoading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                <ArrowRight size={18} /> Upload Filled Excel
              </>
            )}
          </label>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// REGISTER STUDENT
// ============================================================================
function ManageStudents() {
  const toast = useToast();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    middleName: "",
    matricNumber: "",
    faculty: "",
    department: "",
    sex: "",
    level: "",
  });
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [uploadResults, setUploadResults] = useState(null);

  useEffect(() => {
    axios
      .get(`${API_URL}/meta/faculties-list`)
      .then((res) => setFaculties(res.data));
  }, []);

  useEffect(() => {
    if (form.faculty)
      axios
        .get(`${API_URL}/meta/departments-list?facultyId=${form.faculty}`)
        .then((res) => setDepartments(res.data));
    else setDepartments([]);
  }, [form.faculty]);

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.matricNumber || !form.faculty || !form.department || !form.level || !form.sex) {
      return toast.error("Please fill required fields");
    }
    setLoading(true);
    const facultyName =
      faculties.find((f) => f.id === form.faculty)?.name || form.faculty;
    const deptName =
      departments.find((d) => d.id === form.department)?.name ||
      form.department;

    try {
      await axios.post(`${API_URL}/admin/student`, {
        ...form,
        faculty: facultyName,
        department: deptName,
      });
      toast.success("Student Registered Successfully!");
      setForm({ ...form, firstName: "", lastName: "", matricNumber: "" , faculty: "" , department: "", level: "", sex: ""});
    } catch (err) {
      toast.error("Registration Failed");
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      [
        "firstName",
        "lastName",
        "middleName",
        "matricNumber",
        "faculty",
        "department",
        "level",
        "sex",
      ],
    ];
    const ws = XLSX.utils.aoa_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `student_upload_template.xlsx`);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      setBulkLoading(true);
      setUploadResults(null);
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wsname]);
        const res = await axios.post(`${API_URL}/admin/student/bulk`, data);
        setUploadResults(res.data);
        toast.success("Bulk processing finished.");
      } catch (err) {
        toast.error("Upload failed.");
      } finally {
        setBulkLoading(false);
        e.target.value = null;
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Card title="New Student" subtitle="Add student to the system registry">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <FormInput
              label="First Name"
              icon={User}
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
            <FormInput
              label="Last Name"
              icon={User}
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </div>
          <div className="mb-6">
            <FormInput
              label="Matriculation Number"
              icon={Shield}
              placeholder="UNI/2025/..."
              value={form.matricNumber}
              onChange={(e) =>
                setForm({ ...form, matricNumber: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <FormSelect
              label="Faculty"
              icon={Building2}
              value={form.faculty}
              onChange={(e) =>
                setForm({ ...form, faculty: e.target.value, department: "" })
              }
            >
              <option value="">Select Faculty...</option>
              {faculties.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </FormSelect>
            <FormSelect
              label="Department"
              icon={Building2}
              disabled={!form.faculty}
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            >
              <option value="">Select Department...</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </FormSelect>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <FormSelect
              label="Level"
              icon={BookOpen}
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
            >
                <option value="">Select Level...</option>
              <option>100</option>
              <option>200</option>
              <option>300</option>
              <option>400</option>
              <option>500</option>
              <option>600</option>
              <option>700</option>
            </FormSelect>
            <FormSelect
              label="Gender"
              icon={Users}
              value={form.sex}
              onChange={(e) => setForm({ ...form, sex: e.target.value })}
            >
              <option value="">Select Gender...</option>
              <option>Male</option>
              <option value="Female">Female</option>
            </FormSelect>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              loading={loading}
              colorClass="bg-emerald-600 hover:bg-emerald-700 w-full md:w-1/3"
            >
              <UserPlus size={18} /> Register Student
            </Button>
          </div>
        </Card>

        {uploadResults && (
          <Card title="Upload Summary" subtitle="Check for skipped records">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-green-50 rounded-2xl border border-green-100 text-center">
                <p className="text-[10px] font-bold text-green-600 uppercase">
                  Successfully Added
                </p>
                <p className="text-2xl font-black text-green-700">
                  {uploadResults.successfullyCreated?.length || 0}
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-2xl border border-red-100 text-center">
                <p className="text-[10px] font-bold text-red-600 uppercase">
                  Errors/Duplicates
                </p>
                <p className="text-2xl font-black text-red-700">
                  {uploadResults.failedRecords?.length || 0}
                </p>
              </div>
            </div>
            {uploadResults.failedRecords?.length > 0 && (
              <div className="max-h-48 overflow-y-auto border rounded-2xl divide-y">
                {uploadResults.failedRecords.map((err, i) => (
                  <div
                    key={i}
                    className="p-3 text-xs flex justify-between bg-white"
                  >
                    <span className="font-bold text-slate-700">
                      {err.identifier}
                    </span>
                    <span className="text-red-500 font-medium italic">
                      {err.reason}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setUploadResults(null)}
              className="w-full mt-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
            >
              Dismiss Report
            </button>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl space-y-6 border border-slate-800">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-3xl flex items-center justify-center mx-auto border border-blue-500/30">
              <FileBarChart size={32} />
            </div>
            <h3 className="text-xl font-black">Student Bulk Import</h3>
            <p className="text-xs text-slate-400">
              Add multiple students via Excel.
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={downloadTemplate}
              className="w-full py-4 bg-slate-800 text-slate-300 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-slate-700 transition-all flex items-center justify-center gap-2 border border-slate-700"
            >
              <Download size={18} /> Get Excel Template
            </button>
            <label className="w-full py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-900/50">
              <input
                type="file"
                className="hidden"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                disabled={bulkLoading}
              />
              {bulkLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <ArrowRight size={18} /> Upload Filled Excel
                </>
              )}
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MANAGE COURSES (Bulk Creation with Multi-Select logic)
// ============================================================================
function ManageCourses({ currentUser }) {
  const toast = useToast();

  const [form, setForm] = useState({
    courseCode: "",
    courseTitle: "",
    level: "100",
    session: "2025/2026",
    semester: "1st",
  });

  // Target Selection State
  const [tempFaculty, setTempFaculty] = useState("");
  const [tempDept, setTempDept] = useState("");
  const [selectedTargets, setSelectedTargets] = useState([]); // Array of {fac, dept}

  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios
      .get(`${API_URL}/meta/faculties-list`)
      .then((res) => setFaculties(res.data));
  }, []);

  useEffect(() => {
    if (tempFaculty) {
      const facObj = faculties.find(
        (f) => f.id === tempFaculty || f.name === tempFaculty
      );
      const facId = facObj ? facObj.id : tempFaculty;
      axios
        .get(`${API_URL}/meta/departments-list?facultyId=${facId}`)
        .then((res) => setDepartments(res.data))
        .catch(() => setDepartments([]));
    } else {
      setDepartments([]);
    }
  }, [tempFaculty, faculties]);

  const addTarget = () => {
    if (!tempFaculty || !tempDept) {
      toast.error("Select both Faculty and Department first");
      return;
    }

    // Find the actual names from your state lists
    const facultyObj = faculties.find((f) => f.id === tempFaculty);
    const deptObj = departments.find((d) => d.id === tempDept);

    const facultyName = facultyObj ? facultyObj.name : tempFaculty;
    const deptName = deptObj ? deptObj.name : tempDept;

    // Avoid duplicates
    const exists = selectedTargets.find((t) => t.department === deptName);
    if (exists) {
      toast.error("This department is already added");
      return;
    }

    // Store as 'faculty' and 'department' (matching your DB columns)
    setSelectedTargets([
      ...selectedTargets,
      { faculty: facultyName, department: deptName },
    ]);

    setTempDept("");
  };

  const removeTarget = (index) => {
    setSelectedTargets(selectedTargets.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Send the data exactly as the backend expects
      const payload = {
        ...form, // courseCode, courseTitle, level, session, semester
        lecturerId: currentUser.id,
        targets: selectedTargets, // Array of { faculty: "...", department: "..." }
      };

      await axios.post(`${API_URL}/admin/lecture/bulk`, payload);
      toast.success("Courses Created Successfully!");
      setSelectedTargets([]);
      setForm({ ...form, courseCode: "", courseTitle: "" });
    } catch (err) {
      toast.error("Failed to create courses");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title="Create Course"
      subtitle="Assign one course to multiple departments at once"
      className="w-full"
    >
      {/* 1. Course Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-6">
          <FormInput
            label="Course Code"
            icon={BookOpen}
            placeholder="e.g. CSC 101"
            value={form.courseCode}
            onChange={(e) =>
              setForm({ ...form, courseCode: e.target.value.toUpperCase() })
            }
          />
          <FormInput
            label="Course Title"
            icon={Presentation}
            placeholder="e.g. Intro to Computing"
            value={form.courseTitle}
            onChange={(e) => setForm({ ...form, courseTitle: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormSelect
            label="Session"
            value={form.session}
            onChange={(e) => setForm({ ...form, session: e.target.value })}
          >
            <option>2024/2025</option>
            <option>2025/2026</option>
          </FormSelect>
          <FormSelect
            label="Semester"
            value={form.semester}
            onChange={(e) => setForm({ ...form, semester: e.target.value })}
          >
            <option value="1st">1st Semester</option>
            <option value="2nd">2nd Semester</option>
          </FormSelect>
          <div className="col-span-2">
            <FormSelect
              label="Target Level"
              icon={Layers}
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
            >
              <option>100</option>
              <option>200</option>
              <option>300</option>
              <option>400</option>
              <option>500</option>
              <option>600</option>
              <option>00</option>
            </FormSelect>
          </div>
        </div>
      </div>

      <hr className="my-8 border-gray-100" />

      {/* 2. Multi-Target Assignment Area */}
      <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Building2 size={14} /> Assign to Departments
        </h4>

        <div className="flex flex-col md:flex-row gap-4 items-end mb-6">
          <div className="flex-1 w-full">
            <FormSelect
              label="Select Faculty"
              value={tempFaculty}
              onChange={(e) => setTempFaculty(e.target.value)}
            >
              <option value="">-- Choose Faculty --</option>
              {faculties.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </FormSelect>
          </div>
          <div className="flex-1 w-full">
            <FormSelect
              label="Select Department"
              value={tempDept}
              disabled={!tempFaculty}
              onChange={(e) => setTempDept(e.target.value)}
            >
              <option value="">-- Choose Department --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </FormSelect>
          </div>
          <button
            type="button"
            onClick={addTarget}
            className="h-12 px-6 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all flex items-center gap-2"
          >
            <UserPlus size={18} /> Add
          </button>
        </div>

        {/* List of Selected Departments */}
        <div className="flex flex-wrap gap-2 mt-4">
          {selectedTargets.map((target, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 pl-4 pr-2 py-2 rounded-2xl flex items-center gap-3 shadow-sm animate-zoom-in"
            >
              <div className="leading-tight">
                {/* Use 'target.faculty' and 'target.department' here */}
                <p className="text-[10px] font-black text-blue-600 uppercase">
                  {target.faculty}
                </p>
                <p className="text-xs font-bold text-slate-800">
                  {target.department}
                </p>
              </div>
              <button
                onClick={() => removeTarget(idx)}
                className="p-1.5 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="mt-10 flex flex-col md:flex-row justify-between items-center gap-6 pt-6 border-t border-gray-100">
        <div className="flex items-center gap-3 text-amber-600 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">
          <AlertCircle size={16} />
          <p className="text-xs font-bold uppercase tracking-tight">
            Creating {selectedTargets.length} course instance(s)
          </p>
        </div>
        <div className="w-full md:w-1/3">
          <Button
            onClick={handleSubmit}
            loading={loading}
            disabled={selectedTargets.length === 0}
            colorClass="bg-blue-600 hover:bg-blue-700 py-4 shadow-xl shadow-blue-200"
          >
            <Check size={18} /> Batch Create Courses
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// LECTURER ACTIONS (Filterable + Paginated)
// ============================================================================
function LecturerActions({ currentUser }) {
  const toast = useToast();
  const [classes, setClasses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Selection & Pagination States
  const [selFac, setSelFac] = useState("");
  const [selDept, setSelDept] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // 1. Initial Load
  const fetchData = async () => {
    try {
      const [classRes, facRes] = await Promise.all([
        axios.get(`${API_URL}/meta/classes?lecturerId=${currentUser.id}`),
        axios.get(`${API_URL}/meta/faculties-list`),
      ]);
      setClasses(classRes.data);
      setFaculties(facRes.data);
    } catch (err) {
      console.error("Data fetch failed", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser.id]);

  // 2. Load Departments
  useEffect(() => {
    if (selFac) {
      axios
        .get(`${API_URL}/meta/departments-list?facultyId=${selFac}`)
        .then((res) => setDepartments(res.data))
        .catch(() => setDepartments([]));
    } else {
      setDepartments([]);
      setSelDept("");
    }
    setCurrentPage(1);
  }, [selFac]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selDept]);

  // 3. Filter & Pagination Logic
  const filteredClasses = classes.filter((c) => {
    const facultyMatch = selFac
      ? c.faculty === faculties.find((f) => f.id === selFac)?.name ||
        c.faculty === selFac
      : true;
    const deptMatch = selDept
      ? c.department === departments.find((d) => d.id === selDept)?.name ||
        c.department === selDept
      : true;
    return facultyMatch && deptMatch;
  });

  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);
  const currentItems = filteredClasses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const currentCourse = classes.find((c) => c.id === selectedClassId);

  const activateClass = async () => {
    if (!selectedClassId) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await axios.post(`${API_URL}/activate-session`, {
            lectureId: selectedClassId,
            topic: currentCourse.courseTitle,
            lat: pos.coords.latitude,
            long: pos.coords.longitude,
          });
          setSuccess(true);
          fetchData();
        } catch (err) {
          toast.error("Activation Failed");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
        toast.error("GPS required");
      }
    );
  };

  const endSession = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/deactivate-session`, {
        lectureId: selectedClassId,
      });
      toast.success("Session ended.");
      fetchData();
    } catch (err) {
      toast.error("Failed to end session");
    } finally {
      setLoading(false);
    }
  };

  if (success)
    return (
      <SuccessScreen
        title="Class Session Active"
        msg={`Attendance is live for ${currentCourse?.courseTitle}`}
        onReset={() => {
          setSuccess(false);
          fetchData();
        }}
      />
    );

  return (
    <Card
      title="Attendance Control"
      subtitle="Select a course instance to manage"
    >
      <div className="space-y-6">
        {/* FILTERS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <FormSelect
            label="Filter Faculty"
            icon={Building2}
            value={selFac}
            onChange={(e) => {
              setSelFac(e.target.value);
              setSelectedClassId("");
            }}
          >
            <option value="">All My Faculties</option>
            {faculties.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </FormSelect>

          <FormSelect
            label="Filter Department"
            icon={Users}
            disabled={!selFac}
            value={selDept}
            onChange={(e) => {
              setSelDept(e.target.value);
              setSelectedClassId("");
            }}
          >
            <option value="">All My Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </FormSelect>
        </div>

        {/* PAGINATED LIST */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
              <BookOpen size={14} /> Course Instances ({filteredClasses.length})
            </label>
            {totalPages > 1 && (
              <span className="text-[10px] font-black text-blue-600 uppercase">
                Page {currentPage} of {totalPages}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            {currentItems.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-2xl">
                <p className="text-sm text-gray-400">
                  No courses match your filters.
                </p>
              </div>
            ) : (
              currentItems.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedClassId(c.id)}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between group cursor-pointer ${
                    selectedClassId === c.id
                      ? "bg-blue-50 border-blue-500 shadow-sm"
                      : "bg-white border-gray-100 hover:border-blue-200"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">
                        {c.courseCode}
                      </span>
                      <h4
                        className={`font-bold text-sm ${
                          selectedClassId === c.id
                            ? "text-blue-900"
                            : "text-slate-800"
                        }`}
                      >
                        {c.courseTitle}
                      </h4>
                      {c.isActive && (
                        <span className="flex items-center gap-1 text-[8px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full animate-pulse font-black uppercase">
                          Live
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 font-medium">
                      {c.department} • {c.level} Level
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selectedClassId === c.id
                        ? "bg-blue-600 border-blue-600"
                        : "border-slate-200"
                    }`}
                  >
                    {selectedClassId === c.id && (
                      <Check size={12} className="text-white" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="p-2 rounded-lg bg-gray-100 text-gray-600 disabled:opacity-30 hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft size={16} />
              </button>
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      currentPage === i + 1
                        ? "w-6 bg-blue-600"
                        : "w-1.5 bg-gray-300"
                    }`}
                  />
                ))}
              </div>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="p-2 rounded-lg bg-gray-100 text-gray-600 disabled:opacity-30 hover:bg-gray-200 transition-colors"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* ACTION BUTTON */}
        {selectedClassId && (
          <div className="pt-4 border-t border-slate-100 animate-fade-in-up">
            {currentCourse?.isActive ? (
              <Button
                onClick={endSession}
                loading={loading}
                colorClass="bg-red-600 hover:bg-red-700 w-full py-4 shadow-xl shadow-red-200 font-black uppercase tracking-widest"
              >
                End Session
              </Button>
            ) : (
              <Button
                onClick={activateClass}
                loading={loading}
                colorClass="bg-blue-600 hover:bg-blue-700 w-full py-4 shadow-xl shadow-blue-500/20 font-black uppercase tracking-widest"
              >
                Start Session
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

// ============================================================================
// 7. EXAM OFFICER PORTAL (Fixed: Merges "CSC:101" and "CSC 101" records)
// ============================================================================
function ExamOfficerPortal() {
  const toast = useToast();

  // 1. Data Lists & State
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);

  const [filters, setFilters] = useState({
    facultyId: "",
    deptId: "",
    session: "",
    semester: "",
    level: "",
    courseId: "",
  });

  const [report, setReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // --- HELPER: Normalize Code ---
  // Turns "CSC: 101" -> "CSC101"
  const normalizeCode = (str) =>
    !str ? "" : str.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  // 2. Initial Data Fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [facRes, sessRes] = await Promise.all([
          axios.get(`${API_URL}/meta/faculties-list`),
          axios.get(`${API_URL}/meta/sessions`),
        ]);
        setFaculties(facRes.data);
        setSessions(sessRes.data.map((s) => s.session));
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, []);

  // 3. Load Departments
  useEffect(() => {
    if (filters.facultyId) {
      axios
        .get(`${API_URL}/meta/departments-list?facultyId=${filters.facultyId}`)
        .then((res) => setDepartments(res.data))
        .catch(() => setDepartments([]));
    } else {
      setDepartments([]);
    }
  }, [filters.facultyId]);

  // 4. Load Courses
  useEffect(() => {
    if (
      !filters.deptId ||
      !filters.session ||
      !filters.semester ||
      !filters.level
    ) {
      setAvailableCourses([]);
      return;
    }

    const fetchCourses = async () => {
      setLoadingCourses(true);
      try {
        // 🔍 1. Resolve the Name string for the selected Department ID
        const selectedDeptObj = departments.find(
          (d) => d.id === filters.deptId
        );
        const deptName = selectedDeptObj ? selectedDeptObj.name : "";

        // 2. Fetch all classes
        // Ensure your backend endpoint is: GET /attendance/meta/all-classes
        const res = await axios.get(`${API_URL}/meta/all-classes`);

        // 3. Filter using Case-Insensitive Name matching
        const filtered = res.data.filter((c) => {
          // Normalize names to prevent issues with spaces or casing
          const dbDept = (c.department || "").toString().trim().toLowerCase();
          const targetDept = deptName.trim().toLowerCase();

          const deptMatch = dbDept === targetDept;
          const sessionMatch = c.session === filters.session;
          const semesterMatch = c.semester === filters.semester;
          const levelMatch = String(c.level) === String(filters.level);

          return deptMatch && sessionMatch && semesterMatch && levelMatch;
        });

        console.log("Filtered Results:", filtered); // Check your console to see if any match
        setAvailableCourses(filtered);
      } catch (err) {
        console.error("Course fetch error:", err);
        setAvailableCourses([]);
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();
  }, [
    filters.deptId,
    filters.session,
    filters.semester,
    filters.level,
    departments,
  ]);
  // --- LOGIC: Group Duplicate Courses for Dropdown ---
  const uniqueCourses = [];
  const seenKeys = new Set();

  availableCourses.forEach((c) => {
    // Create a unique key using Code + Department
    const key = `${c.courseCode}-${c.department}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueCourses.push(c);
    }
  });

  // Update the JSX to show the department name in the dropdown
  {
    uniqueCourses.map((c) => (
      <option key={c.id} value={c.id}>
        {c.courseCode} - {c.courseTitle} ({c.department})
      </option>
    ));
  }

  /// 5. GENERATE REPORT
  const generateReport = async () => {
    if (!filters.courseId) {
      toast.error("Please select a course first.");
      return;
    }
    setLoadingReport(true);

    try {
      // ✅ Use 'lectureId' parameter to match the backend expectation
      const res = await axios.get(
        `${API_URL}/admin/report?lectureId=${filters.courseId}`
      );

      const data = res.data;

      // Check if the backend returned a list
      if (!data.students || data.students.length === 0) {
        toast.error("No one has marked attendance for this course yet.");
        setReport(null);
      } else {
        setReport(data);
        toast.success("Report Generated!");
      }
    } catch (err) {
      console.error("Report Error:", err);
      toast.error("Error connecting to server.");
      setReport(null);
    } finally {
      setLoadingReport(false);
    }
  };

  // 📥 EXCEL DOWNLOAD FUNCTION
  const downloadExcel = () => {
    if (!report || !report.students.length) {
      toast.error("No data to export");
      return;
    }

    const selectedCourse = availableCourses.find(
      (c) => c.id === filters.courseId
    );
    const courseName = selectedCourse
      ? selectedCourse.courseCode || selectedCourse.course
      : "Course";

    // 1. Define Headers correctly (Individual strings)
    const headers = [
      "Last Name",
      "First Name",
      "Matric Number",
      "Classes Attended",
      "Total Classes",
      "Attendance %",
      "Eligibility Status",
    ];

    // 2. Map Rows to match Headers exactly
    const rows = report.students.map((s) => {
      return [
        `"${s.lastName}"`, // Column A
        `"${s.firstName}"`, // Column B
        `"${s.matricNumber}"`, // Column C (Quoted to prevent Excel formatting issues)
        s.attended, // Column D
        s.total, // Column E
        `${s.percentage}%`, // Column F
        s.isEligible ? "ELIGIBLE" : "BARRED", // Column G
      ].join(",");
    });

    // 3. Combine with newlines
    const csvContent = [headers.join(","), ...rows].join("\n");

    // 4. Create Blob & Download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    // Clean Filename
    const cleanCourseName = courseName
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase();
    link.setAttribute("download", `${cleanCourseName}_eligibility_report.csv`);

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 🖨️ PRINT FUNCTION
  const handlePrint = () => {
    const selectedCourse = availableCourses.find(
      (c) => c.id === filters.courseId
    );
    const courseName = selectedCourse
      ? selectedCourse.courseCode || selectedCourse.course
      : "Unknown Course";

    const printContent = document.getElementById("printable-report").innerHTML;
    const printWindow = window.open("", "", "height=600,width=800");

    printWindow.document.write("<html><head><title>Eligibility Report</title>");
    printWindow.document.write(`
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
        .header { margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .header h1 { margin: 0; font-size: 24px; text-transform: uppercase; }
        .header h2 { margin: 5px 0 0; font-size: 18px; color: #555; }
        .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
        th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
        th { background-color: #f4f4f4; font-weight: bold; text-transform: uppercase; }
        .status-eligible { color: green; font-weight: bold; }
        .status-barred { color: red; font-weight: bold; }
        .footer { margin-top: 30px; font-size: 10px; color: #999; text-align: center; }
      </style>
    `);
    printWindow.document.write("</head><body>");

    printWindow.document.write(`
      <div class="header">
        <h1>Exam Eligibility Report</h1>
        <h2>${courseName}</h2>
      </div>
      <div class="meta-grid">
        <div><strong>Session:</strong> ${filters.session}</div>
        <div><strong>Semester:</strong> ${filters.semester}</div>
        <div><strong>Level:</strong> ${filters.level}</div>
        <div><strong>Date Generated:</strong> ${new Date().toLocaleDateString()}</div>
      </div>
    `);

    printWindow.document.write(printContent);
    printWindow.document.write(
      '<div class="footer">Generated by UniPortal System</div>'
    );
    printWindow.document.write("</body></html>");

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <Card
        title="Exam Eligibility Check"
        subtitle="Verify student attendance status"
      >
        {/* ROW 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <FormSelect
            label="Faculty"
            icon={Building2}
            value={filters.facultyId}
            onChange={(e) =>
              setFilters({
                ...filters,
                facultyId: e.target.value,
                deptId: "",
                courseId: "",
              })
            }
          >
            <option value="">-- Select Faculty --</option>
            {faculties.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </FormSelect>
          <FormSelect
            label="Department"
            icon={Building2}
            disabled={!filters.facultyId}
            value={filters.deptId}
            onChange={(e) =>
              setFilters({ ...filters, deptId: e.target.value, courseId: "" })
            }
          >
            <option value="">-- Select Department --</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </FormSelect>
        </div>

        {/* ROW 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          <FormSelect
            label="Session"
            icon={Calendar}
            value={filters.session}
            onChange={(e) =>
              setFilters({ ...filters, session: e.target.value, courseId: "" })
            }
          >
            <option value="">-- Session --</option>
            {sessions.map((s, i) => (
              <option key={i} value={s}>
                {s}
              </option>
            ))}
            {sessions.length === 0 && (
              <option value="2025/2026">2025/2026</option>
            )}
          </FormSelect>
          <FormSelect
            label="Semester"
            icon={Clock}
            value={filters.semester}
            onChange={(e) =>
              setFilters({ ...filters, semester: e.target.value, courseId: "" })
            }
          >
            <option value="">-- Semester --</option>
            <option value="1st">1st Semester</option>
            <option value="2nd">2nd Semester</option>
          </FormSelect>
          <FormSelect
            label="Level"
            icon={Layers}
            value={filters.level}
            onChange={(e) =>
              setFilters({ ...filters, level: e.target.value, courseId: "" })
            }
          >
            <option value="">-- Level --</option>
            <option value="100">100</option>
            <option value="200">200</option>
            <option value="300">300</option>
            <option value="400">400</option>
            <option value="500">500</option>
            <option value="600">600</option>
            <option value="700">700</option>
          </FormSelect>
        </div>

        {/* ROW 3: COURSES (Deduplicated) */}
        <div className="mb-6 relative">
          <FormSelect
            label={loadingCourses ? "Loading Courses..." : "Select Course"}
            icon={BookOpen}
            disabled={
              !filters.deptId ||
              !filters.session ||
              !filters.semester ||
              !filters.level ||
              loadingCourses
            }
            value={filters.courseId}
            onChange={(e) =>
              setFilters({ ...filters, courseId: e.target.value })
            }
          >
            <option value="">-- Select Course to Check --</option>
            {uniqueCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.courseCode || c.courseTitle}
              </option>
            ))}
          </FormSelect>
          {availableCourses.length === 0 &&
            filters.deptId &&
            filters.level &&
            !loadingCourses && (
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                <AlertCircle size={12} /> No courses found matching these
                criteria.
              </p>
            )}
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <Button
            onClick={generateReport}
            loading={loadingReport}
            disabled={!filters.courseId}
            colorClass="bg-slate-900 hover:bg-black"
          >
            <FileBarChart size={18} /> Generate Eligibility List
          </Button>
        </div>
      </Card>

      {/* REPORT DISPLAY AREA */}
      {report && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in-up">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="font-bold text-gray-800">Eligibility Report</h3>
              <p className="text-xs text-gray-500">
                {report.students.length} Students • {filters.session} •{" "}
                {filters.level} Level
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handlePrint}
                disabled={report.students.length === 0}
                className={`flex items-center gap-2 border px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors shadow-sm ${
                  report.students.length === 0
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-blue-600 cursor-pointer"
                }`}
              >
                <Printer size={16} /> Print / PDF
              </button>

              <button
                onClick={downloadExcel}
                disabled={report.students.length === 0}
                className={`flex items-center gap-2 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors shadow-sm ${
                  report.students.length === 0
                    ? "bg-gray-300 shadow-none cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 cursor-pointer"
                }`}
              >
                <Download size={16} /> Export CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-100 uppercase text-xs font-bold text-gray-500 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 bg-gray-100">Student Name</th>
                  <th className="px-6 py-4 bg-gray-100">Matric No.</th>
                  <th className="px-6 py-4 bg-gray-100 text-center">
                    Attendance
                  </th>
                  <th className="px-6 py-4 bg-gray-100 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {report.students.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-gray-400">
                      No students found.
                    </td>
                  </tr>
                ) : (
                  report.students.map((s, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {s.lastName} {s.firstName}
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-mono">
                        {s.matricNumber}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-gray-700">
                            {s.attended}/{s.total}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            ({s.percentage}%)
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {s.isEligible ? (
                          <span className="inline-flex items-center gap-1 text-green-700 font-bold text-[10px] uppercase bg-green-50 border border-green-200 px-2 py-1 rounded-full">
                            <Check size={10} /> Eligible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-700 font-bold text-[10px] uppercase bg-red-50 border border-red-200 px-2 py-1 rounded-full">
                            <X size={10} /> Barred
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div id="printable-report" className="hidden">
            <table>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Matric Number</th>
                  <th>Attendance</th>
                  <th>Percentage</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {report.students.map((s, i) => (
                  <tr key={i}>
                    <td>
                      {s.lastName}, {s.firstName}
                    </td>
                    <td>{s.matricNumber}</td>
                    <td>
                      {s.attended} / {s.total}
                    </td>
                    <td>{s.percentage}%</td>
                    <td
                      className={
                        s.isEligible ? "status-eligible" : "status-barred"
                      }
                    >
                      {s.isEligible ? "ELIGIBLE" : "BARRED"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsPage({ user }) {
  const toast = useToast();
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (form.newPassword !== form.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/change-password`, {
        id: user.id,
        role: user.role,
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
      });
      toast.success("Password Changed Successfully!");
      setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <Card
        title="Account Settings"
        subtitle="Manage your security preferences"
        className="w-full"
      >
        <div className="max-w-xl">
          <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Key size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-blue-900">
                Change Password
              </h4>
              <p className="text-xs text-blue-700 mt-1">
                For security, please change your default password immediately
                after your first login.
              </p>
            </div>
          </div>
          <div className="space-y-6">
            <div className="relative">
              <FormInput
                label="Current Password"
                icon={Lock}
                type="password"
                placeholder="••••••••"
                value={form.oldPassword}
                onChange={(e) =>
                  setForm({ ...form, oldPassword: e.target.value })
                }
              />
            </div>
            <div className="h-px bg-gray-100 my-2" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="New Password"
                icon={Key}
                type="password"
                placeholder="Min 6 chars"
                value={form.newPassword}
                onChange={(e) =>
                  setForm({ ...form, newPassword: e.target.value })
                }
              />
              <FormInput
                label="Confirm New Password"
                icon={Key}
                type="password"
                placeholder="Repeat password"
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm({ ...form, confirmPassword: e.target.value })
                }
              />
            </div>
          </div>
          <div className="mt-8 flex justify-end">
            <div className="w-full sm:w-48">
              <Button
                onClick={handleChangePassword}
                loading={loading}
                colorClass="bg-slate-900 hover:bg-black"
              >
                Update Password
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

const RoleTab = ({ label, icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
      active
        ? "bg-white shadow-sm text-gray-900 ring-1 ring-gray-200"
        : "text-gray-400 hover:text-gray-600 hover:bg-gray-200/50"
    }`}
  >
    {icon} {label}
  </button>
);
