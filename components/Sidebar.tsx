
import React from 'react';
import { 
  MessageSquare, 
  FileText, 
  FolderOpen,
  PenTool, 
  Library, 
  Maximize2,
  ShieldCheck,
  Info,
  Briefcase,
  UserCircle
} from 'lucide-react';
import { AppTab } from '../types';

interface SidebarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: AppTab.CHAT, label: 'Legal Consultation', icon: MessageSquare },
    { id: AppTab.DOCUMENT, label: 'Document Analysis', icon: FileText },
    { id: AppTab.MY_DOCUMENTS, label: 'My Documents', icon: FolderOpen },
    { id: AppTab.DRAFTS, label: 'Legal Drafting', icon: PenTool },
    { id: AppTab.ADVOCATE_TOOLS, label: 'Advocate Tools', icon: Briefcase },
    { id: AppTab.RESOURCES, label: 'Law Library', icon: Library },
    { id: AppTab.PROFILE, label: 'My Profile', icon: UserCircle },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-full border-r border-slate-800">
      <div className="p-8 flex items-center gap-4">
        <div className="bg-amber-500 p-2.5 rounded-xl shadow-lg shadow-amber-500/20 transform -rotate-3">
          <Maximize2 className="w-6 h-6 text-slate-900" />
        </div>
        <div>
          <h1 className="text-xl font-bold font-serif tracking-tight leading-none text-white">LEGALLENS</h1>
          <p className="text-[9px] text-slate-400 uppercase tracking-[0.2em] font-bold mt-1.5 opacity-60">Legal Intelligence</p>
        </div>
      </div>

      <nav className="flex-1 px-4 mt-6 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all duration-300 ${
              activeTab === item.id 
                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'animate-pulse' : ''}`} />
            <span className="font-semibold text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 mt-auto">
        <div className="bg-slate-800/50 rounded-3xl p-5 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-3 text-emerald-500">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Auth Active</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
            Session encrypted with quantum-safe tokens. Your data is never shared.
          </p>
        </div>
        <div className="mt-6 flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest px-2 font-bold opacity-40">
          <span>Enterprise v1.2</span>
          <Info className="w-3 h-3 cursor-pointer hover:text-slate-300 transition-colors" />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
