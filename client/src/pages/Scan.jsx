import { useState, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, Camera, X, CheckCircle, AlertTriangle, ShieldAlert, Download, FileText, ScanLine } from 'lucide-react';

const Scan = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file) => {
    if (!file.type.match('image.*')) {
      alert("Please select an image file");
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
    setScanResult(null); // Reset previous results
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    
    setIsLoading(true);
    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const res = await axios.post('/scans', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setScanResult(res.data);
    } catch (error) {
      console.error("Scan failed", error);
      alert("Failed to analyze image. Ensure AI service is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadReport = async () => {
    if (!scanResult) return;
    try {
      const res = await axios.get(`/reports/${scanResult.scan._id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `LabelCheck_Report_${scanResult.scan._id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Failed to download report", error);
      alert("Failed to download report");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">New Compliance Scan</h1>
        <p className="text-slate-400">Upload a product label photo to run OCR and verify Legal Metrology declarations.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-4">
          {!preview ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`glass-card relative overflow-hidden transition-all duration-300 border-2 border-dashed ${
                isDragging ? 'border-electric bg-electric/5' : 'border-white/20'
              } flex flex-col items-center justify-center p-12 text-center h-[400px] cursor-pointer`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
            >
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                <UploadCloud size={32} className="text-electric" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Drag & Drop Label Photo</h3>
              <p className="text-slate-400 mb-6 max-w-xs text-sm">Upload high-resolution images of the Principal Display Panel for best OCR results.</p>
              
              <div className="flex gap-4">
                <button className="btn-secondary flex items-center gap-2">
                  <Camera size={18} /> Use Camera
                </button>
                <button className="btn-primary">Browse Files</button>
              </div>
              
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files[0])}
              />
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card overflow-hidden h-[400px] relative group"
            >
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              
              {/* Overlay controls */}
              <div className="absolute inset-0 bg-navy-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm gap-4">
                 <button 
                  onClick={() => { setPreview(''); setScanResult(null); setSelectedFile(null); }}
                  className="w-12 h-12 bg-white/10 hover:bg-rose-500 hover:text-white rounded-full flex items-center justify-center text-rose-400 transition-colors backdrop-blur-md"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scanning Overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-navy-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                  <div className="relative w-24 h-24 mb-6">
                     <div className="absolute inset-0 border-4 border-electric/30 rounded-full" />
                     <div className="absolute inset-0 border-4 border-electric border-t-transparent rounded-full animate-spin" />
                     <div className="absolute inset-0 flex items-center justify-center">
                       <ScanLine className="text-electric animate-pulse" size={24} />
                     </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Analyzing Label...</h3>
                  <p className="text-slate-400 text-sm animate-pulse">Running EasyOCR & rule engine</p>
                </div>
              )}
            </motion.div>
          )}

          <AnimatePresence>
            {preview && !scanResult && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <button 
                  onClick={handleAnalyze}
                  className="btn-primary w-full h-14 text-lg flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_25px_rgba(59,130,246,0.6)]"
                >
                  <ScanLine size={20} /> Analyze Compliance
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          {!scanResult ? (
            <div className="glass-card h-[400px] flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-slate-500">
                <FileText size={24} />
              </div>
              <p className="text-slate-400">Analysis results will appear here</p>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {/* Verdict Card */}
              <div className={`glass-card p-6 border-l-4 ${scanResult.compliance.status === 'COMPLIANT' ? 'border-l-emerald-500' : 'border-l-rose-500'} relative overflow-hidden`}>
                <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-10 blur-2xl ${scanResult.compliance.status === 'COMPLIANT' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {scanResult.compliance.status === 'COMPLIANT' ? (
                        <CheckCircle className="text-emerald-500" size={24} />
                      ) : (
                        <ShieldAlert className="text-rose-500" size={24} />
                      )}
                      <h2 className="text-2xl font-bold text-white">
                        {scanResult.compliance.status === 'COMPLIANT' ? 'Compliant' : 'Non-Compliant'}
                      </h2>
                    </div>
                    <p className="text-slate-400 text-sm">
                      Processed in {scanResult.processing_time_sec}s
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">{scanResult.compliance.risk_score}</div>
                    <div className="text-xs text-slate-400 font-medium tracking-wider uppercase">Risk Score</div>
                  </div>
                </div>

                {/* Violations List */}
                {scanResult.compliance.violations?.length > 0 && (
                  <div className="mt-6 space-y-3 relative z-10">
                    <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Detected Violations</h4>
                    {scanResult.compliance.violations.map((v, i) => (
                      <div key={i} className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 flex items-start gap-3">
                        <AlertTriangle className="text-rose-400 shrink-0 mt-0.5" size={16} />
                        <div>
                          <p className="text-rose-200 text-sm font-medium">{v.description}</p>
                          <p className="text-rose-400/60 text-xs mt-1">Ref: {v.rule_reference}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Extracted Data Table */}
              <div className="glass-card p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-white">Extracted Declarations</h3>
                  <button onClick={downloadReport} className="btn-secondary flex items-center gap-2 text-sm py-1.5 px-4">
                    <Download size={14} /> PDF Report
                  </button>
                </div>
                
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {scanResult.declarations.map((decl, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-slate-200 capitalize">{decl.field.replace('_', ' ')}</p>
                        <p className="text-xs text-slate-500">{decl.rule_reference}</p>
                      </div>
                      <div className="text-right">
                        {decl.found ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-white font-medium truncate max-w-[150px] block" title={decl.value}>{decl.value}</span>
                            <CheckCircle size={14} className="text-emerald-500" />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-rose-400">
                            <X size={14} />
                            <span className="text-sm font-medium">Missing</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Scan;
