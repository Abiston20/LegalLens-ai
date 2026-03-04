
import React, { useState, useEffect } from 'react';
import { PenTool, FileText, Clipboard, Copy, Check, Loader2, Sparkles, Send, History, Clock, FileCheck } from 'lucide-react';
import { generateDraft } from '../services/geminiService';
import { apiRequest } from '../services/apiService';
import { LegalDraft } from '../types';

const DraftGenerator: React.FC = () => {
  const [details, setDetails] = useState('');
  const [draftType, setDraftType] = useState('Legal Notice');
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recentDrafts, setRecentDrafts] = useState<LegalDraft[]>([]);

  useEffect(() => {
    fetchRecentDrafts();
  }, []);

  const fetchRecentDrafts = async () => {
    try {
      // Cast response to any to satisfy state setter
      const drafts = await apiRequest('/legal/my-drafts') as any;
      setRecentDrafts(drafts || []);
    } catch (e) {
      console.error("Failed to fetch drafts", e);
    }
  };

  const draftTypes = [
    'Legal Notice',
    'Rent Agreement',
    'Consumer Complaint',
    'RTI Application',
    'FIR Format',
    'Employment Contract',
    'Affidavit',
    'Power of Attorney'
  ];

  const handleGenerate = async () => {
    if (!details.trim()) return;
    setIsGenerating(true);
    try {
      const draft = await generateDraft(draftType, details);
      setResult(draft || "Failed to generate draft.");
      
      // Save to Vault
      await apiRequest('/legal/log-draft', {
        method: 'POST',
        body: JSON.stringify({ type: draftType, content: draft })
      });
      
      fetchRecentDrafts();
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
      {/* Sidebar: Recent History */}
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm h-full flex flex-col">
          <div className="flex items-center gap-3 text-slate-900 mb-6">
            <History className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-sm uppercase tracking-widest">Recent Archive</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
            {recentDrafts.length === 0 ? (
              <div className="text-center py-10 opacity-30">
                <FileText className="w-10 h-10 mx-auto mb-2" />
                <p className="text-[10px] font-bold uppercase tracking-widest">No Recent Drafts</p>
              </div>
            ) : (
              recentDrafts.map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    setResult(d.content);
                    setDraftType(d.type);
                  }}
                  className="w-full text-left p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 transition-all group"
                >
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">{d.type}</p>
                  <p className="text-xs font-semibold text-slate-700 truncate">{d.content.substring(0, 50)}...</p>
                  <div className="flex items-center gap-2 mt-2 text-[9px] text-slate-400 font-bold uppercase">
                    <Clock className="w-3 h-3" />
                    {new Date(d.timestamp).toLocaleDateString()}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Drafting UI */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200 space-y-8">
          <div className="flex items-center gap-3 text-slate-900">
            <Sparkles className="w-6 h-6 text-amber-500" />
            <h2 className="text-2xl font-bold font-serif">Drafting Desk</h2>
          </div>
          
          <div className="space-y-4">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Instrument</label>
            <div className="grid grid-cols-2 gap-2">
              {draftTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setDraftType(type)}
                  className={`px-4 py-3 text-[10px] font-bold rounded-xl transition-all border-2 ${
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
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Case Particulars</label>
            <textarea
              rows={6}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="List parties, dates, and core facts..."
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:outline-none focus:border-indigo-600 transition-all text-sm font-medium"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !details.trim()}
            className="w-full bg-indigo-600 text-white py-6 rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50 shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-4 text-xs uppercase tracking-widest"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <PenTool className="w-5 h-5" />}
            {isGenerating ? 'Compiling Legal Logic...' : 'Establish Draft'}
          </button>
        </div>
      </div>

      {/* Output Preview */}
      <div className="lg:col-span-5 h-full">
        {result ? (
          <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-200 h-full flex flex-col">
            <div className="bg-slate-900 px-8 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileCheck className="w-5 h-5 text-amber-500" />
                <span className="text-white font-bold text-xs tracking-widest uppercase">{draftType} PREVIEW</span>
              </div>
              <button 
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Sync Clipboard'}
              </button>
            </div>
            <div className="flex-1 p-10 overflow-y-auto bg-[url('https://www.transparenttextures.com/patterns/lined-paper-2.png')]">
              <div className="bg-white/80 backdrop-blur-sm p-10 border border-slate-100 shadow-inner rounded-3xl whitespace-pre-wrap font-serif leading-loose text-slate-800 text-sm md:text-base">
                {result}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-200 p-12 text-center space-y-6">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm">
              <FileText className="w-10 h-10 text-slate-200" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-400 font-serif">Awaiting Discovery</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest max-w-xs leading-relaxed">Generated instruments will appear here for audit and export.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DraftGenerator;
