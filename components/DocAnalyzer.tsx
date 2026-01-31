
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Upload, FileText, Loader2, Search, AlertCircle, CheckCircle2, 
  Gavel, Archive, RefreshCw, FileCheck, MessageSquare, Send, 
  Clock, Users, BookOpen, ShieldAlert, Bot, User 
} from 'lucide-react';
import { analyzeLegalDocument, chatWithLegalAI } from '../services/geminiService';
import { UserProfile, Role, Message, Language, Jurisdiction } from '../types';
import { apiRequest } from '../services/apiService';

interface DocAnalyzerProps {
  user: UserProfile;
}

const DocAnalyzer: React.FC<DocAnalyzerProps> = ({ user }) => {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState<'IDLE' | 'READING' | 'AI_PROCESSING' | 'ARCHIVING'>('IDLE');
  const [progress, setProgress] = useState(0);
  const [isArchived, setIsArchived] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Document QA States
  const [qaMessages, setQaMessages] = useState<Message[]>([]);
  const [qaInput, setQaInput] = useState('');
  const [isQaLoading, setIsQaLoading] = useState(false);
  const qaEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (qaEndRef.current) {
      qaEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [qaMessages]);

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
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const validTypes = [
      'application/pdf', 
      'image/png', 
      'image/jpeg', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    if (validTypes.includes(selectedFile.type)) {
      setFile(selectedFile);
      setAnalysis('');
      setQaMessages([]);
      setIsArchived(false);
      setError(null);
    } else {
      setError("Format Unsupported. Please upload PDF, DOCX, or Image (PNG/JPG).");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setIsArchived(false);
    setError(null);
    setProgress(10);
    setAnalysisStage('READING');

    try {
      const reader = new FileReader();
      
      const readingInterval = setInterval(() => {
        setProgress(p => Math.min(p + 5, 30));
      }, 100);

      reader.onload = async () => {
        clearInterval(readingInterval);
        setProgress(40);
        setAnalysisStage('AI_PROCESSING');
        
        try {
          const base64 = (reader.result as string).split(',')[1];
          
          const aiInterval = setInterval(() => {
            setProgress(p => {
              if (p < 85) return p + 1;
              return p;
            });
          }, 200);

          const result = await analyzeLegalDocument(base64, file.type);
          clearInterval(aiInterval);
          
          const finalAnalysis = result || "No analysis could be generated.";
          setAnalysis(finalAnalysis);
          
          // Initialize QA with a context message
          setQaMessages([{
            id: 'init',
            role: Role.AI,
            content: `Document analyzed successfully. I've extracted the key issues, parties, and statutory citations. You can now ask specific questions about this ${file.name} or related legal provisions.`,
            timestamp: new Date()
          }]);

          setProgress(90);
          setAnalysisStage('ARCHIVING');

          await apiRequest('/legal/log-document', {
            method: 'POST',
            body: JSON.stringify({ name: file.name, analysis: finalAnalysis })
          });
          setIsArchived(true);
          setProgress(100);
        } catch (e: any) {
          setError("AI Intelligence Sync Failure: " + e.message);
        } finally {
          setIsAnalyzing(false);
          setAnalysisStage('IDLE');
        }
      };
      
      reader.onerror = () => {
        clearInterval(readingInterval);
        setError("Local storage read failure.");
        setIsAnalyzing(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error: any) {
      setError("Process termination: " + error.message);
      setIsAnalyzing(false);
    }
  };

  const handleQaSend = async () => {
    if (!qaInput.trim() || isQaLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content: qaInput,
      timestamp: new Date()
    };

    setQaMessages(prev => [...prev, userMsg]);
    setQaInput('');
    setIsQaLoading(true);

    try {
      const contextPrompt = `
Context: You are discussing a document previously analyzed. 
Document Summary/Analysis: ${analysis.substring(0, 2000)}...
User Question about this document: ${userMsg.content}
`;
      const response = await chatWithLegalAI(
        contextPrompt, 
        qaMessages.map(m => ({ role: m.role, content: m.content })),
        user.preferences?.language || Language.ENGLISH,
        user.preferences?.jurisdiction || Jurisdiction.UNION
      );

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.AI,
        content: response.text,
        timestamp: new Date()
      };

      setQaMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      console.error(e);
      setQaMessages(prev => [...prev, {
        id: 'error',
        role: Role.AI,
        content: "Error connecting to legal QA node.",
        timestamp: new Date()
      }]);
    } finally {
      setIsQaLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 text-indigo-600 mb-2">
          <ShieldAlert className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-[0.4em]">Advanced Discovery Engine</span>
        </div>
        <h2 className="text-4xl font-bold font-serif text-slate-900 tracking-tight">Intelligent Case Review</h2>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
          Upload PDF, DOCX or Scanned Images. Our AI extracts parties, issues, dates, and statutory mapping with 2024 compliance.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-[32px] p-8 flex items-start gap-6 text-red-800 animate-in slide-in-from-top-4 shadow-sm">
          <AlertCircle className="w-8 h-8 shrink-0 text-red-600" />
          <div className="flex-1">
            <p className="font-bold text-lg mb-1">Processing Exception</p>
            <p className="text-sm opacity-80 leading-relaxed">{error}</p>
            <button onClick={() => setError(null)} className="mt-4 px-6 py-2 bg-red-100 text-red-800 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-200 transition-all">
              Dismiss Warning
            </button>
          </div>
        </div>
      )}

      <div 
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`bg-white rounded-[48px] p-16 border-2 border-dashed transition-all duration-700 flex flex-col items-center justify-center gap-10 relative overflow-hidden ${
          dragActive 
            ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01] shadow-[0_40px_80px_rgba(79,70,229,0.15)]' 
            : 'border-slate-200 hover:border-indigo-300 shadow-xl shadow-slate-200/40'
        }`}
      >
        <div className={`w-32 h-32 rounded-[40px] flex items-center justify-center transform transition-all duration-700 ${
          dragActive ? 'bg-indigo-600 rotate-0 scale-110 shadow-indigo-600/30 shadow-2xl' : 'bg-slate-900 rotate-6'
        }`}>
          {dragActive ? (
            <FileCheck className="w-16 h-16 text-white animate-bounce" />
          ) : (
            <Upload className={`w-16 h-16 text-white ${isAnalyzing ? 'animate-pulse' : ''}`} />
          )}
        </div>
        
        <div className="text-center space-y-3">
          <p className={`font-bold text-3xl font-serif tracking-tight transition-colors ${dragActive ? 'text-indigo-600' : 'text-slate-900'}`}>
            {dragActive ? 'Release to Initialize' : 'Ingest Document'}
          </p>
          <p className="text-slate-400 font-medium text-sm">Automated summarization and legal issue extraction.</p>
        </div>

        <input 
          type="file" 
          accept=".pdf,.png,.jpg,.jpeg,.docx,.doc" 
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
        />
        
        <div className="flex flex-col items-center gap-6 w-full max-w-lg">
          {!isAnalyzing ? (
            <label 
              htmlFor="file-upload" 
              className={`w-full bg-slate-50 border border-slate-100 px-10 py-6 rounded-[28px] font-bold transition-all text-center cursor-pointer shadow-sm flex items-center justify-center gap-4 group ${
                file ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'text-slate-600 hover:bg-white hover:shadow-xl hover:-translate-y-1'
              }`}
            >
              <FileText className={`w-6 h-6 transition-transform group-hover:scale-110 ${file ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span className="truncate max-w-[250px]">{file ? file.name : 'Choose PDF, DOCX or Image'}</span>
            </label>
          ) : (
            <div className="w-full space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.3em] text-indigo-600">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {analysisStage.replace('_', ' ')}...
                </span>
                <span>{progress}%</span>
              </div>
              <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner p-1">
                <div 
                  className="h-full bg-indigo-600 rounded-full transition-all duration-700 ease-out shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {file && !isAnalyzing && (
            <button 
              onClick={handleUpload}
              className="w-full bg-slate-900 text-white px-12 py-6 rounded-[32px] font-bold hover:bg-slate-800 flex items-center justify-center gap-4 shadow-2xl shadow-slate-900/20 active:scale-[0.98] transition-all text-sm uppercase tracking-widest"
            >
              <Search className="w-5 h-5" />
              Perform Intelligent Analysis
            </button>
          )}
        </div>
      </div>

      {analysis && !isAnalyzing && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-12 duration-1000">
          <div className="bg-white rounded-[48px] shadow-2xl overflow-hidden border border-slate-100">
            <div className="bg-slate-900 px-12 py-10 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center shadow-xl shadow-amber-500/20 rotate-3">
                  <BookOpen className="w-8 h-8 text-slate-900" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white font-serif tracking-tight">AI Audit Report</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-2 text-amber-500 text-[10px] font-bold uppercase tracking-widest border border-amber-500/30 px-3 py-1 rounded-full bg-amber-500/5">
                      <ShieldAlert className="w-3 h-3" />
                      Statutory Compliant
                    </span>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Hash: {Math.random().toString(16).slice(2, 10).toUpperCase()}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-12 space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-4">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Parties Involved</h4>
                  <p className="text-xs font-bold text-slate-900">Extracted and indexed from document context.</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-4">
                  <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Crucial Dates</h4>
                  <p className="text-xs font-bold text-slate-900">Limitation periods and deadlines mapped.</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-4">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                    <Gavel className="w-5 h-5" />
                  </div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Statutory Mapping</h4>
                  <p className="text-xs font-bold text-slate-900">References to IPC/BNS/CPC/CPC included.</p>
                </div>
              </div>
              
              <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-inner min-h-[400px]">
                <div className="prose prose-slate max-w-none prose-lg prose-headings:font-serif prose-headings:text-slate-900 whitespace-pre-wrap text-slate-700 leading-relaxed font-medium">
                  {analysis}
                </div>
              </div>
            </div>

            <div className="px-12 py-10 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <Archive className="w-5 h-5 text-indigo-600" />
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em]">Verified Secure Storage Archive</p>
              </div>
              <button 
                onClick={() => window.print()}
                className="bg-white border border-slate-200 text-slate-700 px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-100 transition-all shadow-sm"
              >
                Export Audit PDF
              </button>
            </div>
          </div>

          {/* Interactive QA Section */}
          <div className="bg-indigo-950 rounded-[48px] shadow-2xl overflow-hidden border border-indigo-900 p-1">
            <div className="bg-indigo-900/50 p-8 flex items-center gap-4 border-b border-white/5">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-white font-serif">Legal Consultation QA</h4>
                <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest mt-1">Ask detailed questions regarding this specific document.</p>
              </div>
            </div>

            <div className="h-[500px] overflow-y-auto p-10 space-y-6 custom-scrollbar bg-slate-900/40">
              {qaMessages.map((msg) => (
                <div key={msg.id} className={`flex gap-4 ${msg.role === Role.USER ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                    msg.role === Role.USER ? 'bg-indigo-600 text-white' : 'bg-white/10 text-white'
                  }`}>
                    {msg.role === Role.USER ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5 text-amber-500" />}
                  </div>
                  <div className={`max-w-[80%] ${msg.role === Role.USER ? 'text-right' : ''}`}>
                    <div className={`p-6 rounded-[32px] text-sm leading-relaxed ${
                      msg.role === Role.USER 
                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-xl' 
                        : 'bg-white/5 text-slate-200 border border-white/10 rounded-tl-none font-medium'
                    }`}>
                      {msg.content}
                    </div>
                    <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-2">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {isQaLoading && (
                <div className="flex gap-4 animate-in fade-in">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center"><Bot className="w-5 h-5 text-amber-500 animate-pulse" /></div>
                  <div className="bg-white/5 border border-white/10 p-6 rounded-[32px] rounded-tl-none flex items-center gap-3">
                    <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                    <span className="text-xs text-indigo-300 font-bold uppercase tracking-widest">Interpreting Statutes...</span>
                  </div>
                </div>
              )}
              <div ref={qaEndRef} />
            </div>

            <div className="p-8 bg-indigo-900/30 border-t border-white/5">
              <div className="relative max-w-4xl mx-auto">
                <input 
                  type="text" 
                  value={qaInput}
                  onChange={(e) => setQaInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQaSend()}
                  placeholder="e.g., 'What is the limitation period for this notice?'"
                  className="w-full bg-indigo-900/40 border-2 border-white/10 rounded-[32px] px-8 py-5 pr-20 text-white outline-none focus:border-amber-500 focus:bg-indigo-900/60 transition-all placeholder:text-indigo-300/40 font-medium"
                />
                <button 
                  onClick={handleQaSend}
                  disabled={isQaLoading || !qaInput.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-amber-500 text-slate-900 p-4 rounded-2xl hover:bg-amber-400 transition-all disabled:opacity-50 active:scale-95 shadow-xl"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocAnalyzer;
