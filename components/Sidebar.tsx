
import React from 'react';
import { 
  MessageSquare, 
  FileText, 
  FolderOpen,
  PenTool, 
  Library, 
  Briefcase,
  UserCircle,
  Scale,
  ShieldCheck
} from 'lucide-react';
import { AppTab, UserType } from '../types';

interface SidebarProps {
  activeTab: AppTab;
  userType: UserType;
  setActiveTab: (tab: AppTab) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, userType, setActiveTab }) => {
  const allMenuItems = [
    { id: AppTab.CHAT, label: 'Consultation', icon: MessageSquare, roles: [UserType.CITIZEN, UserType.ADVOCATE] },
    { id: AppTab.DOCUMENT, label: 'Analysis', icon: FileText, roles: [UserType.CITIZEN, UserType.ADVOCATE] },
    { id: AppTab.MY_DOCUMENTS, label: 'My Vault', icon: FolderOpen, roles: [UserType.CITIZEN, UserType.ADVOCATE] },
    { id: AppTab.DRAFTS, label: 'Drafting', icon: PenTool, roles: [UserType.CITIZEN, UserType.ADVOCATE] },
    { id: AppTab.ADVOCATE_TOOLS, label: 'Advocate Tools', icon: Briefcase, roles: [UserType.ADVOCATE] },
    { id: AppTab.RESOURCES, label: 'Law Library', icon: Library, roles: [UserType.CITIZEN, UserType.ADVOCATE] },
    { id: AppTab.PROFILE, label: 'Profile', icon: UserCircle, roles: [UserType.CITIZEN, UserType.ADVOCATE] },
  ];

  const menuItems = allMenuItems.filter(item => item.roles.includes(userType));

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-full">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
          <Scale className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">LegalLens</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            {userType === UserType.ADVOCATE ? 'Advocate Node' : 'Citizen Node'}
          </p>
        </div>
      </div>

      <nav className="flex-1 px-4 mt-8 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === item.id 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-semibold text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto space-y-2">
        <div className="bg-slate-800 rounded-xl p-4 text-xs space-y-2">
          <div className="flex items-center gap-2 text-indigo-400">
            <ShieldCheck className="w-4 h-4" />
            <span className="font-bold uppercase tracking-wider">Secure Local Vault</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[10px]">
            Your data is stored exclusively in this browser. No external database is connected.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
