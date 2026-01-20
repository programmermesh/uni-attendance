import * as XLSX from 'xlsx';

const BulkUpload = ({ type, onComplete }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  // 1. Generate Template
  const downloadTemplate = () => {
    const headers = type === 'student' 
      ? [['firstName', 'lastName', 'matricNumber', 'faculty', 'department', 'level', 'sex']]
      : [['firstName', 'lastName', 'email', 'role', 'faculty', 'department', 'password']];
    
    const ws = XLSX.utils.aoa_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `${type}_upload_template.xlsx`);
  };

  // 2. Parse and Upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      setLoading(true);
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wsname]);

        const endpoint = type === 'student' ? 'admin/student/bulk' : 'admin/staff/bulk';
        await axios.post(`${API_URL}/${endpoint}`, data);
        
        toast.success(`Bulk ${type} creation successful!`);
        if (onComplete) onComplete();
      } catch (err) {
        toast.error("Failed to process file. Check headers.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="p-6 bg-slate-50 rounded-[2rem] border border-dashed border-slate-300 text-center space-y-4">
      <div className="flex flex-col items-center justify-center">
        <Download className="text-blue-500 mb-2" size={32} />
        <h3 className="font-bold text-slate-800 text-lg">Bulk {type === 'student' ? 'Student' : 'Staff'} Upload</h3>
        <p className="text-xs text-slate-500 max-w-[200px] mx-auto">Download the template, fill it, and upload it back here.</p>
      </div>
      
      <div className="flex gap-3 justify-center">
        <button onClick={downloadTemplate} className="text-xs font-bold bg-white border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-100 transition-all flex items-center gap-2">
          <Download size={14}/> Template
        </button>
        
        <label className="text-xs font-bold bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-blue-200">
          <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} disabled={loading} />
          {loading ? <Loader2 className="animate-spin" size={14}/> : <><UserPlus size={14}/> Upload File</>}
        </label>
      </div>
    </div>
  );
};