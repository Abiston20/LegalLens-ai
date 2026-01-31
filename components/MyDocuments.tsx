
import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Calendar, 
  Eye, 
  Loader2, 
  Search, 
  Gavel, 
  X, 
  AlertCircle, 
  ArrowUpDown, 
  Filter, 
  FilterX, 
  ChevronDown,
  Clock,
  LayoutGrid,
  List as ListIcon
} from 'lucide-react';
import { UserDocument } from '../types';
import { apiRequest } from '../services/apiService';

const MyDocuments: React.FC = () => {
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<UserDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Filter and Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/legal/my-documents');
      setDocuments(data);
    } catch (e: any) {
      console.error("Failed to fetch documents", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedDocs = useMemo(() => {
    let result = [...documents];

    // Search Logic (Name and Analysis content)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(doc => 
        doc.name.toLowerCase().includes(term) || 
        doc.analysis.toLowerCase().includes(term)
      );
    }

    // Sort Logic
    result.sort((a, b) => {
      const dateA = new Date(a.uploadDate).getTime();
      const dateB = new Date(b.uploadDate).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [documents, searchTerm, sortOrder]);

  const resetFilters = () => {
    setSearchTerm('');
    setSortOrder('newest');
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs text-center">
          Decrypting Vault Archive...<br/>
          <span className="opacity-50 text-[10px]">Verifying Jurisdictional Integrity</span>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-indigo-600 mb-1">
            <Clock className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Historical Archive</span>
          </div>
          <h2 className="text-3xl font-bold font-serif text-slate-900 tracking-tight">Case Document Vault</h2>
          <p className="text-slate-500 font-medium">Secure access to all previously processed legal intelligence reports.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 px-6 py-3 rounded-2xl flex items-center gap-3 border border-indigo-100 shadow-sm">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">{documents.length} Records In Vault</span>
          </div>
        </div>
      </div>

      {/* Advanced Search & Filter Bar */}
      <div className="bg-white p-4 md:p-6 rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 mb-10 space-y-4 md:space-y-0 md:flex items-center gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search by filename or keywords in analysis..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-12 pr-12 focus:outline-none focus:border-amber-500 focus:bg-white transition-all text-sm font-medium"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="h-10 w-px bg-slate-200 hidden md:block mx-1"></div>
          
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            <button 
              onClick={() => setSortOrder('newest')}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${sortOrder === 'newest' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Newest
            </button>
            <button 
              onClick={() => setSortOrder('oldest')}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${sortOrder === 'oldest' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Oldest
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-100">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>

          {(searchTerm || sortOrder !== 'newest') && (
            <button 
              onClick={resetFilters}
              className="p-3 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-2xl transition-all shadow-sm border border-amber-100"
              title="Clear Filters"
            >
              <FilterX className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-10 bg-red-50 border border-red-100 p-8 rounded-[40px] flex items-center gap-6 text-red-700 animate-in zoom-in duration-300 shadow-sm">
          <AlertCircle className="w-8 h-8 shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-lg mb-1">Archive Synchronization Failure</p>
            <p className="text-sm opacity-80 leading-relaxed">Could not establish connection with the vault nodes. Please verify your encrypted session.</p>
          </div>
          <button onClick={fetchDocuments} className="bg-red-700 text-white px-8 py-3 rounded-2xl text-xs font-bold shadow-lg shadow-red-700/20 active:scale-95 transition-all">
            Retry Connection
          </button>
        </div>
      )}

      {filteredAndSortedDocs.length === 0 && !error ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[48px] p-24 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center relative">
            <Search className="w-10 h-10 text-slate-300" />
            <div className="absolute top-0 right-0 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-white border-4 border-white animate-bounce">
              <span className="text-[10px] font-bold">!</span>
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 font-serif">Search Query Yielded Zero Results</h3>
            <p className="text-slate-500 mt-2 max-w-sm mx-auto font-medium leading-relaxed">We couldn't find any documents matching your criteria. Try adjusting your search term or filtering parameters.</p>
          </div>
          <button 
            onClick={resetFilters}
            className="text-xs font-bold text-indigo-600 uppercase tracking-[0.2em] border-b-2 border-indigo-600/20 pb-1 hover:border-indigo-600 transition-all"
          >
            Reset All Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-700">
          {filteredAndSortedDocs.map((doc) => (
            <div 
              key={doc.id}
              className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group cursor-pointer flex flex-col h-full overflow-hidden relative"
              onClick={() => setSelectedDoc(doc)}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 blur-3xl rounded-full -mr-10 -mt-10 group-hover:bg-amber-100/30 transition-colors"></div>
              
              <div className="bg-indigo-50 w-16 h-16 rounded-[24px] flex items-center justify-center mb-8 group-hover:bg-indigo-600 transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 relative z-10">
                <FileText className="w-8 h-8 text-indigo-600 group-hover:text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-3 truncate font-serif relative z-10" title={doc.name}>{doc.name}</h3>
              
              <div className="flex items-center gap-3 text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-8 relative z-10">
                <div className="bg-slate-100 p-1.5 rounded-lg">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                {new Date(doc.uploadDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>

              <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Analysis Ready</span>
                </div>
                <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold group-hover:gap-3 transition-all">
                  <span>View Report</span>
                  <Eye className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm animate-in fade-in duration-700">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Document Details</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date Processed</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredAndSortedDocs.map((doc) => (
                <tr 
                  key={doc.id} 
                  className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                  onClick={() => setSelectedDoc(doc)}
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-slate-900 text-sm truncate max-w-md">{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-xs font-medium text-slate-500">{new Date(doc.uploadDate).toLocaleDateString()}</span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="text-indigo-600 hover:text-indigo-800 font-bold text-[10px] uppercase tracking-widest flex items-center justify-end gap-2 ml-auto">
                      Access Report
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Report View Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[48px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-500 border border-white/20">
            {/* Modal Header */}
            <div className="bg-slate-900 px-8 py-8 md:px-12 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center shadow-xl shadow-amber-500/20 rotate-3">
                  <Gavel className="w-7 h-7 text-slate-900" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white font-serif tracking-tight truncate max-w-[300px] md:max-w-md">{selectedDoc.name}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-amber-500 text-[10px] font-bold uppercase tracking-widest border border-amber-500/30 px-3 py-1 rounded-full bg-amber-500/10 flex items-center gap-2">
                      <div className="w-1 h-1 bg-amber-500 rounded-full animate-pulse"></div>
                      Intelligence Archive
                    </span>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                      {new Date(selectedDoc.uploadDate).toLocaleDateString(undefined, { dateStyle: 'long' })}
                    </p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedDoc(null)}
                className="p-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all border border-white/10 active:scale-90"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar bg-slate-50/50">
              <div className="max-w-4xl mx-auto space-y-10">
                <div className="bg-white p-8 md:p-12 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50/50 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                  
                  <div className="prose prose-slate max-w-none prose-sm md:prose-base whitespace-pre-wrap leading-relaxed text-slate-700 font-medium relative z-10">
                    {selectedDoc.analysis}
                  </div>
                </div>

                <div className="bg-amber-50/50 border border-amber-100 rounded-3xl p-6 flex items-start gap-4">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-1 shrink-0" />
                  <p className="text-[11px] font-medium text-amber-900/70 leading-relaxed italic">
                    Note: This document analysis was generated by AI based on statutory codes active at the time of processing. Legislative amendments post-processing date may affect the current validity of specific findings.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-8 md:px-12 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6 shrink-0">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  <div className="w-8 h-8 bg-indigo-600 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm">AI</div>
                  <div className="w-8 h-8 bg-slate-900 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm">LL</div>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Verified Jurisdictional Report</p>
              </div>
              
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <button 
                  onClick={() => window.print()}
                  className="flex-1 sm:flex-none px-8 py-3.5 bg-slate-100 text-slate-700 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                >
                  Export PDF
                </button>
                <button 
                  onClick={() => setSelectedDoc(null)}
                  className="flex-1 sm:flex-none px-10 py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/20"
                >
                  Close Archive
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyDocuments;
