
import React, { useState } from 'react';
import { PenTool, FileText, Clipboard, Copy, Check, Loader2, Sparkles, Send } from 'lucide-react';
import { generateDraft } from '../services/geminiService';

const DraftGenerator: React.FC = () => {
  const [details, setDetails] = useState('');
  const [draftType, setDraftType] = useState('Legal Notice');
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const draftTypes = [
    'Legal Notice',
    'Rent Agreement',
    'Consumer Complaint',
    'RTI Application',
    'FIR Format',
    'Employment Contract'
  ];

  const handleGenerate = async () => {
    if (!details.trim()) return;
    setIsGenerating(true);
    try {
      const draft = await generateDraft(draftType, details);
      setResult(draft || "Failed to generate draft.");
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
          <div className="flex items-center gap-3 text-slate-900">
            <Sparkles className="w-6 h-6 text-amber-500" />
            <h2 className="text-2xl font-bold font-serif">Smart Draftsman</h2>
          </div>
          
          <div className="space-y-4">
            <label className="block text-sm font-bold text-slate-600 uppercase tracking-widest">Document Category</label>
            <div className="grid grid-cols-2 gap-2">
              {draftTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setDraftType(type)}
                  className={`px-4 py-3 text-xs font-bold rounded-xl transition-all border-2 ${
                    draftType === type 
                      ? 'bg-slate-900 text-white border-slate-900' 
                      : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-bold text-slate-600 uppercase tracking-widest">Case Particulars</label>
            <textarea
              rows={6}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Enter names, dates, amounts, and facts... e.g., 'Draft a notice to a tenant who hasn't paid rent for 3 months at Flat 402, Mumbai.'"
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:outline-none focus:border-indigo-600 transition-all text-sm"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !details.trim()}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50 shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <PenTool className="w-5 h-5" />}
            {isGenerating ? 'Drafting Precise Content...' : 'Generate Legal Draft'}
          </button>
        </div>
      </div>

      <div className="lg:col-span-3">
        {result ? (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 h-full flex flex-col">
            <div className="bg-slate-900 px-8 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-amber-500" />
                <span className="text-white font-bold text-sm tracking-wide uppercase">{draftType} PREVIEW</span>
              </div>
              <button 
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors text-xs font-bold"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Clipboard className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy Text'}
              </button>
            </div>
            <div className="flex-1 p-10 overflow-y-auto bg-[url('https://www.transparenttextures.com/patterns/lined-paper-2.png')]">
              <div className="bg-white/80 backdrop-blur-sm p-10 border border-slate-200 shadow-inner rounded-xl whitespace-pre-wrap font-serif leading-loose text-slate-800">
                {result}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center bg-slate-100 rounded-3xl border-2 border-dashed border-slate-300 p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-700">Awaiting Particulars</h3>
              <p className="text-slate-500 text-sm max-w-xs">Your generated draft will appear here once you provide case details.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DraftGenerator;
