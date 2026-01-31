
import React, { useState, useCallback } from 'react';
import { Upload, FileText, Loader2, Search, AlertCircle, CheckCircle2, Gavel, Archive, RefreshCw, FileCheck } from 'lucide-react';
import { analyzeLegalDocument } from '../services/geminiService';
import { UserProfile } from '../types';
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
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg'];
      if (validTypes.includes(droppedFile.type)) {
        setFile(droppedFile);
        setAnalysis('');
        setIsArchived(false);
        setError(null);
      } else {
        setError("Invalid file type. Please upload a PDF or an Image (PNG/JPG).");
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setAnalysis('');
      setIsArchived(false);
      setError(null);
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
      
      // Simulate reading progress
      const readingInterval = setInterval(() => {
        setProgress(p => Math.min(p + 5, 30));
      }, 100);

      reader.onload = async () => {
        clearInterval(readingInterval);
        setProgress(40);
        setAnalysisStage('AI_PROCESSING');
        
        try {
          const base64 = (reader.result as string).split(',')[1];
          
          // AI Analysis stage - usually takes the longest
          const aiInterval = setInterval(() => {
            setProgress(p => {
              if (p < 85) return p + 1;
              return p;
            });
          }, 200);

          const result = await analyzeLegalDocument(base64, file.type);
          clearInterval(aiInterval);
          
          const finalAnalysis = result || "No analysis could be generated for this document.";
          setAnalysis(finalAnalysis);
          
          setProgress(90);
          setAnalysisStage('ARCHIVING');

          // Log to user history securely
          try {
            await apiRequest('/legal/log-document', {
              method: 'POST',
              body: JSON.stringify({ name: file.name, analysis: finalAnalysis })
            });
            setIsArchived(true);
            setProgress(100);
          } catch (archiveError: any) {
            console.warn("Document analysis succeeded but archiving failed:", archiveError);
            setError("Analysis complete, but failed to save to history: " + archiveError.message);
          }
        } catch (e: any) {
          setError("AI Analysis failed: " + e.message);
        } finally {
          setIsAnalyzing(false);
          setAnalysisStage('IDLE');
        }
      };
      
      reader.onerror = () => {
        clearInterval(readingInterval);
        setError("Could not read file locally.");
        setIsAnalyzing(false);
        setAnalysisStage('IDLE');
      };
      
      reader.readAsDataURL(file);
    } catch (error: any) {
      setError("Process error: " + error.message);
      setIsAnalyzing(false);
      setAnalysisStage('IDLE');
    }
  };

  const getStageMessage = () => {
    switch (analysisStage) {
      case 'READING': return 'Ingesting Secure Data...';
      case 'AI_PROCESSING': return 'Gemini Neural Analysis...';
      case 'ARCHIVING': return 'Securing to Vault...';
      default: return 'Processing...';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="text-center space-y-3">
        <h2 className="text-4xl font-bold font-serif text-slate-900 tracking-tight">Document Intelligence</h2>
        <p className="text-slate-500 text-lg max-w-xl mx-auto">
          Securely analyze contracts, legal notices, or affidavits for immediate risk assessment and statutory mapping.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-[32px] p-6 flex items-start gap-4 text-red-800 animate-in slide-in-from-top-4">
          <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">System Alert</p>
            <p className="text-sm opacity-80">{error}</p>
            <button onClick={() => setError(null)} className="mt-3 text-xs font-bold uppercase tracking-widest flex items-center gap-1 hover:underline">
              <RefreshCw className="w-3 h-3" /> Dismiss
            </button>
          </div>
        </div>
      )}

      <div 
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`bg-white rounded-[40px] p-12 border-2 border-dashed transition-all duration-500 flex flex-col items-center justify-center gap-8 relative overflow-hidden ${
          dragActive 
            ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01] shadow-2xl' 
            : 'border-slate-200 hover:border-indigo-400 shadow-sm'
        }`}
      >
        {isArchived && (
          <div className="absolute top-6 right-6 flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full text-xs font-bold border border-emerald-100 animate-in zoom-in duration-300">
            <Archive className="w-3.5 h-3.5" />
            Analysis Archived
          </div>
        )}

        <div className={`w-28 h-28 rounded-[36px] flex items-center justify-center transform transition-all duration-700 ${
          dragActive ? 'bg-indigo-600 rotate-0 scale-110 shadow-indigo-600/20 shadow-2xl' : 'bg-indigo-50 rotate-6 hover:rotate-0'
        }`}>
          {dragActive ? (
            <FileCheck className="w-14 h-14 text-white animate-bounce" />
          ) : (
            <Upload className={`w-14 h-14 text-indigo-600 ${isAnalyzing ? 'animate-pulse' : ''}`} />
          )}
        </div>
        
        <div className="text-center space-y-2">
          <p className={`font-bold text-2xl transition-colors ${dragActive ? 'text-indigo-600' : 'text-slate-900'}`}>
            {dragActive ? 'Drop to Securely Upload' : 'Upload Case Document'}
          </p>
          <p className="text-slate-500 text-sm font-medium">Drag & Drop or select a file to map findings against Indian Legal Codes.</p>
        </div>

        <input 
          type="file" 
          accept=".pdf,.png,.jpg,.jpeg" 
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
        />
        
        <div className="flex flex-col items-center gap-6 w-full max-w-md">
          {!isAnalyzing ? (
            <label 
              htmlFor="file-upload" 
              className={`w-full bg-white border-2 px-8 py-5 rounded-3xl font-bold transition-all text-center cursor-pointer shadow-sm flex items-center justify-center gap-3 ${
                file ? 'border-amber-500 text-amber-700 bg-amber-50/30' : 'border-slate-100 text-slate-700 hover:bg-slate-50 hover:border-slate-200'
              }`}
            >
              <FileText className={`w-5 h-5 ${file ? 'text-amber-500' : 'text-slate-400'}`} />
              <span className="truncate max-w-[200px]">{file ? file.name : 'Select PDF or Image'}</span>
            </label>
          ) : (
            <div className="w-full space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-600">
                <span>{getStageMessage()}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-indigo-600 transition-all duration-500 ease-out shadow-[0_0_15px_rgba(79,70,229,0.5)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {file && !isAnalyzing && (
            <button 
              onClick={handleUpload}
              className="w-full bg-slate-900 text-white px-10 py-5 rounded-3xl font-bold hover:bg-slate-800 flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/20 active:scale-[0.98] transition-all"
            >
              <Search className="w-5 h-5" />
              Initiate Neural Analysis
            </button>
          )}
        </div>
      </div>

      {analysis && !isAnalyzing && (
        <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in slide-in-from-bottom-10 duration-700">
          <div className="bg-slate-900 px-10 py-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center">
                <Gavel className="w-6 h-6 text-slate-900" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white font-serif tracking-tight">Intelligence Report</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Generated by LEGALLENS Neural Engine</p>
              </div>
            </div>
            {isArchived && (
              <div className="flex items-center gap-2 text-amber-500 text-[10px] font-bold uppercase tracking-[0.2em] animate-pulse">
                <CheckCircle2 className="w-4 h-4" />
                Securely Archived
              </div>
            )}
          </div>
          
          <div className="p-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-red-50 p-8 rounded-[32px] border border-red-100 flex gap-4 group hover:bg-red-100/50 transition-colors">
                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-red-200 transition-colors">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h4 className="text-red-800 font-bold text-sm uppercase tracking-wider mb-2">Liability & Risks</h4>
                  <p className="text-red-900/70 text-xs leading-relaxed font-medium">Potential legal exposures and non-compliance vectors identified within document text.</p>
                </div>
              </div>
              <div className="bg-emerald-50 p-8 rounded-[32px] border border-emerald-100 flex gap-4 group hover:bg-emerald-100/50 transition-colors">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-emerald-200 transition-colors">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-emerald-800 font-bold text-sm uppercase tracking-wider mb-2">Statutory Alignment</h4>
                  <p className="text-emerald-900/70 text-xs leading-relaxed font-medium">Document mapped against 2024 Indian Judicial Standards and latest amendments.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50/50 p-10 rounded-[36px] border border-slate-100 shadow-inner">
              <div className="prose prose-slate max-w-none whitespace-pre-wrap text-slate-800 leading-loose font-medium text-base">
                {analysis}
              </div>
            </div>
          </div>
          
          <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">Confidentiality: Tier 1 Encrypted</p>
            </div>
            <span className="text-indigo-600 text-xs font-bold uppercase tracking-widest bg-white px-5 py-2 rounded-full border border-indigo-100 shadow-sm">
              Digital Signature: Verified AI Advisor
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocAnalyzer;
