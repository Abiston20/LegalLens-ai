
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Gavel, 
  Search, 
  FileSignature, 
  MessageSquareLock, 
  ExternalLink, 
  Copy, 
  Check, 
  Loader2, 
  ShieldCheck, 
  Users,
  ChevronRight,
  Database,
  Upload,
  FileText,
  Calendar,
  ChevronLeft,
  Lock,
  AlertCircle,
  FileCheck,
  // Fix: Added missing 'X' icon from lucide-react
  X
} from 'lucide-react';
import { chatWithLegalAI } from '../services/geminiService';
import { Role, UserProfile } from '../types';
import { apiRequest } from '../services/apiService';

interface AdvocateToolsProps {
  user: UserProfile;
}

const AdvocateTools: React.FC<AdvocateToolsProps> = ({ user }) => {
  const [activeSubTab, setActiveSubTab] = useState<'PRECEDENT' | 'CLAUSES' | 'CLIENTS'>('PRECEDENT');
  const [precedentQuery, setPrecedentQuery] = useState('');
  const [precedentResult, setPrecedentResult] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [copiedClause, setCopiedClause] = useState<string | null>(null);

  // Client Portal States
  const [selectedClient, setSelectedClient] = useState<{name: string, matter: string} | null>(null);
  const [clientDocs, setClientDocs] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clients = [
    { name: 'Aditya Mehta', matter: 'Criminal Petition (Sec. 482)', lastActive: '2 hours ago', status: 'Encrypted' },
    { name: 'S. K. Global Corp', matter: 'Equity Purchase Agreement', lastActive: 'Yesterday', status: 'Active' },
    { name: 'Dr. Reema Sahni', matter: 'Medical Negligence Defense', lastActive: '3 days ago', status: 'Priority' },
  ];

  const clauses = [
    { title: 'Arbitration Clause', content: 'Any dispute arising out of or in connection with this contract, including any question regarding its existence, validity or termination, shall be referred to and finally resolved by arbitration in accordance with the Arbitration and Conciliation Act, 1996.' },
    { title: 'Force Majeure', content: 'Neither party shall be liable for any failure or delay in performance of its obligations under this Agreement if such failure or delay is caused by circumstances beyond its reasonable control, including acts of God, war, riot, or pandemic.' },
    { title: 'Confidentiality', content: 'The Receiving Party shall maintain the Confidential Information in strict confidence and shall not disclose it to any third party without the prior written consent of the Disclosing Party.' },
    { title: 'Limitation of Liability', content: 'In no event shall either party be liable for any indirect, incidental, special, or consequential damages, or damages for loss of profits, revenue, data or use.' }
  ];

  const handlePrecedentSearch = async () => {
    if (!precedentQuery.trim()) return;
    setIsSearching(true);
    setError(null);
    try {
      const response = await chatWithLegalAI(`Research Indian case precedents for the following legal issue: ${precedentQuery}. Focus on High Court and Supreme Court judgments from the last 10 years.`, []);
      setPrecedentResult(response.text);
    } catch (e: any) {
      console.error(e);
      setError("Legal Research AI experienced an interruption: " + e.message);
    } finally {
      setIsSearching(false);
    }
  };

  const copyClause = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedClause(text);
    setTimeout(() => setCopiedClause(null), 2000);
  };

  const fetchClientDocs = async (clientName: string) => {
    setError(null);
    try {
      const data = await apiRequest(`/legal/advocate/client-documents?client_name=${encodeURIComponent(clientName)}`);
      setClientDocs(data);
    } catch (e: any) {
      console.error("Failed to fetch client docs", e);
      setError(e.message);
    }
  };

  const processFileUpload = async (file: File) => {
    if (!selectedClient) return;
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Simulation of upload progress
      const progressTimer = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressTimer);
            return 90;
          }
          return prev + Math.floor(Math.random() * 10) + 5;
        });
      }, 200);

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Content = (reader.result as string).split(',')[1];
          await apiRequest('/legal/advocate/client-document', {
            method: 'POST',
            body: JSON.stringify({
              client_name: selectedClient.name,
              matter: selectedClient.matter,
              file_name: file.name,
              content_base64: base64Content
            })
          });
          
          setUploadProgress(100);
          setTimeout(() => {
            setIsUploading(false);
            setUploadProgress(0);
            fetchClientDocs(selectedClient.name);
          }, 500);
        } catch (uploadError: any) {
          clearInterval(progressTimer);
          setError("File upload to secure vault failed: " + uploadError.message);
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (e: any) {
      setError("Local file processing failed: " + e.message);
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFileUpload(e.target.files[0]);
    }
  };

  // Drag and Drop Handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFileUpload(e.dataTransfer.files[0]);
    }
  }, [selectedClient]);

  const enterClientPortal = (client: typeof clients[0]) => {
    setSelectedClient(client);
    fetchClientDocs(client.name);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-bold font-serif text-slate-900 tracking-tight">Advocate Command Center</h2>
          <p className="text-slate-500 mt-2 font-medium">Specialized professional suite for legal research and practice management.</p>
        </div>
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
          {[
            { id: 'PRECEDENT', label: 'Case Precedents', icon: Gavel },
            { id: 'CLAUSES', label: 'Clause Library', icon: FileSignature },
            { id: 'CLIENTS', label: 'Secure Portal', icon: MessageSquareLock },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveSubTab(tab.id as any); setSelectedClient(null); setError(null); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === tab.id 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-[32px] p-6 flex items-start gap-4 text-red-800 animate-in zoom-in duration-300">
          <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Module Sync Error</p>
            <p className="text-sm opacity-80">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-800 p-2 hover:bg-red-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden min-h-[600px] flex flex-col">
        {activeSubTab === 'PRECEDENT' && (
          <div className="flex flex-col h-full">
            <div className="p-10 border-b border-slate-50 bg-slate-50/30">
              <div className="max-w-3xl space-y-6">
                <div className="flex items-center gap-3 text-indigo-600 mb-2">
                  <Database className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em]">AI-Powered Research Engine</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 font-serif">Deep Case Retrieval</h3>
                <p className="text-slate-500 text-sm">Query legal issues to find relevant SCC, Manupatra style case references and summary of ratios.</p>
                <div className="relative group">
                  <input 
                    type="text"
                    value={precedentQuery}
                    onChange={(e) => setPrecedentQuery(e.target.value)}
                    placeholder="Search e.g., 'Doctrine of Res Sub Judice in property disputes'..."
                    className="w-full bg-white border-2 border-slate-100 rounded-3xl py-5 pl-8 pr-32 focus:outline-none focus:border-amber-500 focus:bg-white shadow-xl shadow-slate-200/50 transition-all text-sm font-medium"
                    onKeyDown={(e) => e.key === 'Enter' && handlePrecedentSearch()}
                  />
                  <button 
                    onClick={handlePrecedentSearch}
                    disabled={isSearching || !precedentQuery}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold text-xs hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Research
                  </button>
                </div>
              </div>
            </div>

            <div className="p-10">
              {precedentResult ? (
                <div className="prose prose-slate max-w-none whitespace-pre-wrap leading-relaxed text-slate-700 font-medium animate-in fade-in duration-500">
                  <div className="flex items-center gap-2 mb-6 text-emerald-600 font-bold text-[10px] uppercase tracking-widest bg-emerald-50 w-fit px-4 py-1.5 rounded-full">
                    <ShieldCheck className="w-4 h-4" />
                    Verified Precedents Located
                  </div>
                  {precedentResult}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center space-y-4 opacity-40">
                  <Gavel className="w-16 h-16 text-slate-200" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Enter a legal issue above to begin discovery</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSubTab === 'CLAUSES' && (
          <div className="p-10 space-y-10">
            <div className="max-w-2xl">
              <h3 className="text-2xl font-bold text-slate-900 font-serif">Standard Clause Library</h3>
              <p className="text-slate-500 text-sm mt-2">Professional, court-tested legal boilerplate for complex drafting.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {clauses.map((clause, idx) => (
                <div key={idx} className="group p-8 rounded-3xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:shadow-xl transition-all duration-300 relative">
                  <h4 className="font-bold text-slate-900 mb-4 flex items-center justify-between">
                    {clause.title}
                    <button 
                      onClick={() => copyClause(clause.content)}
                      className="text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      {copiedClause === clause.content ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </h4>
                  <p className="text-slate-600 text-sm leading-relaxed font-medium">
                    {clause.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSubTab === 'CLIENTS' && (
          <div className="flex-1 flex flex-col h-full">
            {!selectedClient ? (
              <div className="p-10 space-y-8 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 font-serif">Secure Client Matters</h3>
                    <p className="text-slate-500 text-sm mt-2">Select a client matter to manage documents and secure communications.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {clients.map((client, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => enterClientPortal(client)}
                      className="flex items-center justify-between p-6 rounded-3xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer group shadow-sm bg-white"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">{client.name}</h4>
                          <p className="text-slate-400 text-xs font-medium">{client.matter}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right hidden md:block">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{client.lastActive}</p>
                          <div className="flex items-center gap-1.5 justify-end mt-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">{client.status}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 transition-all group-hover:translate-x-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div 
                className={`flex-1 flex flex-col animate-in slide-in-from-right-4 duration-300 relative transition-all ${dragActive ? 'bg-indigo-50/40' : ''}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                {/* Drag Overlay Feedback */}
                {dragActive && (
                  <div className="absolute inset-0 z-10 border-4 border-dashed border-indigo-400 flex items-center justify-center bg-indigo-50/60 backdrop-blur-sm pointer-events-none">
                    <div className="bg-white p-10 rounded-[48px] shadow-2xl flex flex-col items-center gap-4 border border-indigo-100">
                      <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-white animate-bounce">
                        <Upload className="w-10 h-10" />
                      </div>
                      <p className="text-xl font-bold text-indigo-900 font-serif">Release to Upload</p>
                      <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Encrypting for {selectedClient.name}</p>
                    </div>
                  </div>
                )}

                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                    <button 
                      onClick={() => { setSelectedClient(null); setError(null); }}
                      className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-slate-900 transition-all shadow-sm"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 font-serif">{selectedClient.name}</h3>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">{selectedClient.matter}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:block text-right">
                      <div className="flex items-center gap-2 justify-end mb-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">AES-256 Enabled</span>
                      </div>
                    </div>
                    <label className="cursor-pointer bg-slate-900 text-white px-8 py-4 rounded-[20px] font-bold text-xs hover:bg-slate-800 transition-all flex items-center gap-3 shadow-xl shadow-slate-900/10 active:scale-95">
                      <input type="file" className="hidden" onChange={handleFileChange} />
                      <Upload className="w-4 h-4" />
                      Upload File
                    </label>
                  </div>
                </div>

                {/* Progress Bar Container */}
                {isUploading && (
                  <div className="bg-white border-b border-slate-100 px-10 py-6 animate-in slide-in-from-top-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Secure Handshake in progress...</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">{uploadProgress}% Complete</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="flex-1 p-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Case Documents</h4>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold text-slate-300 italic">Drag files here to upload</span>
                        <span className="text-xs font-bold text-indigo-600">{clientDocs.length} Vaulted</span>
                      </div>
                    </div>

                    {clientDocs.length === 0 && !isUploading ? (
                      <div className="h-80 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[48px] text-slate-400 space-y-4 bg-slate-50/20">
                        <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm">
                          <FileText className="w-8 h-8 opacity-20" />
                        </div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-center">No documents in secure portal<br/><span className="text-[10px] opacity-60">Drag and drop to initiate encryption</span></p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {clientDocs.map((doc, idx) => (
                          <div key={idx} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group border-b-2 hover:border-b-indigo-500">
                            <div className="flex items-start justify-between mb-4">
                              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                                <FileText className="w-5 h-5" />
                              </div>
                              <Lock className="w-4 h-4 text-slate-200" />
                            </div>
                            <h5 className="font-bold text-slate-900 text-sm mb-1 truncate" title={doc.file_name}>{doc.file_name}</h5>
                            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                              <Calendar className="w-3 h-3" />
                              {new Date(doc.upload_date).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Matter Profile</h4>
                    <div className="bg-slate-900 rounded-[40px] p-8 text-white space-y-6 shadow-2xl relative overflow-hidden">
                      <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full"></div>
                      
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-60">Matter Token</p>
                          <p className="text-xs font-mono font-bold text-amber-500">LL-MTR-992-SEC</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-60">Portal Access</p>
                          <p className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Biometric Verified
                          </p>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-white/10">
                        <p className="text-[11px] leading-relaxed text-slate-400 font-medium italic">
                          "All data transferred through this portal is subject to Zero-Knowledge Encryption protocols. Documents are strictly end-to-end encrypted between LegalLens servers and your verified terminal."
                        </p>
                      </div>

                      <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Retention: 3 Years</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex flex-wrap items-center justify-center gap-6 py-4 opacity-40 grayscale hover:grayscale-0 transition-all cursor-default">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-900" />
          <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Quantum-Resistant Vault</span>
        </div>
        <div className="w-1 h-1 bg-slate-400 rounded-full hidden sm:block"></div>
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-slate-900" />
          <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Server Node: India-South-1</span>
        </div>
      </div>
    </div>
  );
};

export default AdvocateTools;
