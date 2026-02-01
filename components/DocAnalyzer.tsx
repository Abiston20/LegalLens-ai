
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Upload, FileText, Loader2, Search, AlertCircle, CheckCircle2, 
  Gavel, Archive, RefreshCw, FileCheck, MessageSquare, Send, 
  Clock, Users, BookOpen, ShieldAlert, Bot, User, Info, Sparkles
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
      setError("Format Unsupported. Please upload PDF, DOCX, or Scanned Image (PNG/JPG).");
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
          
          setQaMessages([{
            id: 'init',
            role: Role.AI,
            content: `I've successfully performed an intelligent extraction for ${file.name}. I've identified the key legal issues, parties, and dates. You can now use this Legal QA interface to ask specific questions about the document's provisions or its statutory implications under BNS/IPC.`,
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
          setError("LegalLens Core Failure: " + e.message);
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
Context: You are LegalLens discussing a document previously analyzed. 
Document Summary/Analysis: ${analysis.substring(0, 3000)}...
User Question about this specific document: ${userMsg.content}
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
        content: "Error connecting to legal QA node. Please check your network.",
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
          <Sparkles className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-[0.4em]">Intelligent Discovery Core</span>
        </div>
        <h2 className="text-4xl font-bold font-serif text-slate-900 tracking-tight">LegalLens Case Analysis</h2>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
          Automated Summarization, Issue Extraction, and Statutory Mapping for Indian Law.
        </p>
      </div>

      <div 
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`bg-white rounded-[48px] p-16 border-2 border-dashed transition-all duration-700 flex flex-col items-center justify-center gap-10 relative overflow-hidden ${
          dragActive 
            ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01] shadow-2xl' 
            : 'border-slate-200 hover:border-indigo-300 shadow-xl shadow-slate-200/40'
        }`}
      >
        <div className={`w-32 h-32 rounded-[40px] flex items-center justify-center transform transition-all duration-700 ${
          dragActive ? 'bg-indigo-600 scale-110' : 'bg-slate-900'
        }`}>
          {dragActive ? <FileCheck className="w-16 h-16 text-white animate-bounce" /> : <Upload className={`w-16 h-16 text-white ${isAnalyzing ? 'animate-pulse' : ''}`} />}
        </div>
        
        <div className="text-center space-y-3">
          <p className="font-bold text-3xl font-serif text-slate-900">
            {dragActive ? 'Ready to Ingest' : 'Upload Legal Files'}
          </p>
          <p className="text-slate-400 font-medium text-sm">PDF, DOCX, and Scanned Images Supported.</p>
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
              className={`w-full bg-slate-50 border border-slate-100 px-10 py-6 rounded-[28px] font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-4 group ${
                file ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'text-slate-600 hover:bg-white'
              }`}
            >
              <FileText className={`w-6 h-6 ${file ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span className="truncate max-w-[250px]">{file ? file.name : 'Choose File'}</span>
            </label>
          ) : (
            <div className="w-full space-y-6">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.3em] text-indigo-600">
                <span>{analysisStage.replace('_', ' ')}...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 transition-all duration-700" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {file && !isAnalyzing && (
            <button 
              onClick={handleUpload}
              className="w-full bg-slate-900 text-white px-12 py-6 rounded-[32px] font-bold hover:bg-slate-800 flex items-center justify-center gap-4 shadow-2xl active:scale-95 transition-all text-sm uppercase tracking-widest"
            >
              <Search className="w-5 h-5" />
              Perform Discovery
            </button>
          )}
        </div>
      </div>

      {analysis && !isAnalyzing && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-12 duration-1000">
          {/* Analysis Report Card */}
          <div className="bg-white rounded-[48px] shadow-2xl overflow-hidden border border-slate-100">
            <div className="bg-slate-900 px-12 py-10 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center rotate-3">
                  <BookOpen className="w-8 h-8 text-slate-900" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white font-serif tracking-tight">Intelligence Audit</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-500/20">
                      Analysis Complete
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-12 space-y-12">
              {/* Feature Chips */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Summarization', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Issue Extraction', icon: Gavel, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { label: 'Party Identification', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Date Mapping', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                ].map((chip, idx) => (
                  <div key={idx} className={`${chip.bg} ${chip.color} p-4 rounded-2xl flex items-center gap-3 border border-white`}>
                    <chip.icon className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{chip.label}</span>
                  </div>
                ))}
              </div>

              <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-inner">
                <div className="prose prose-slate max-w-none prose-lg prose-headings:font-serif whitespace-pre-wrap text-slate-700 leading-relaxed font-medium">
                  {analysis}
                </div>
              </div>
            </div>
          </div>

          {/* Legal QA Interface */}
          <div className="bg-indigo-950 rounded-[48px] shadow-2xl overflow-hidden border border-indigo-900">
            <div className="bg-indigo-900/50 p-8 flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-white font-serif">LegalLens Document QA</h4>
                <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest mt-1">Interrogate the document's legal findings.</p>
              </div>
            </div>

            <div className="h-[400px] overflow-y-auto p-10 space-y-6 bg-slate-900/40 custom-scrollbar">
              {qaMessages.map((msg) => (
                <div key={msg.id} className={`flex gap-4 ${msg.role === Role.USER ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    msg.role === Role.USER ? 'bg-indigo-600 text-white' : 'bg-white/10 text-white'
                  }`}>
                    {msg.role === Role.USER ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5 text-amber-500" />}
                  </div>
                  <div className={`max-w-[80%] ${msg.role === Role.USER ? 'text-right' : ''}`}>
                    <div className={`p-6 rounded-[32px] text-sm ${
                      msg.role === Role.USER 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-white/5 text-slate-200 border border-white/10 rounded-tl-none'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              {isQaLoading && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center"><Loader2 className="w-5 h-5 text-amber-500 animate-spin" /></div>
                  <div className="bg-white/5 border border-white/10 p-6 rounded-[32px] rounded-tl-none">
                    <span className="text-xs text-indigo-300 font-bold uppercase tracking-widest">LegalLens is Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={qaEndRef} />
            </div>

            <div className="p-8 bg-indigo-900/30">
              <div className="relative">
                <input 
                  type="text" 
                  value={qaInput}
                  onChange={(e) => setQaInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQaSend()}
                  placeholder="Ask a question about this case..."
                  className="w-full bg-indigo-900/40 border-2 border-white/10 rounded-[32px] px-8 py-5 pr-20 text-white outline-none focus:border-amber-500 transition-all font-medium"
                />
                <button 
                  onClick={handleQaSend}
                  disabled={isQaLoading || !qaInput.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-amber-500 text-slate-900 p-4 rounded-2xl hover:bg-amber-400 disabled:opacity-50 active:scale-95"
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
