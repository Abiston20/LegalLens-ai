
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import DocAnalyzer from './components/DocAnalyzer';
import MyDocuments from './components/MyDocuments';
import DraftGenerator from './components/DraftGenerator';
import AdvocateTools from './components/AdvocateTools';
import Auth from './components/Auth';
import { AppTab, UserProfile, UserType } from './types';
import { Scale, Search, Shield, HelpCircle, BookOpen, Gavel, User as UserIcon } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.CHAT);
  
  // Initialize state directly from localStorage to prevent flickering
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('legallens_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.token) {
          return parsed as UserProfile;
        }
      }
    } catch (e) {
      console.error("Failed to parse session", e);
    }
    return null;
  });

  const handleLogin = (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem('legallens_session', JSON.stringify(profile));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('legallens_session');
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case AppTab.CHAT:
        return <ChatWindow />;
      case AppTab.DOCUMENT:
        return <DocAnalyzer user={user} />;
      case AppTab.MY_DOCUMENTS:
        return <MyDocuments />;
      case AppTab.DRAFTS:
        return <DraftGenerator />;
      case AppTab.ADVOCATE_TOOLS:
        return <AdvocateTools user={user} />;
      case AppTab.RESOURCES:
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in zoom-in duration-500">
            {[
              { title: 'IPC / BNS Index', desc: 'Browse criminal laws & sections', icon: Shield, color: 'text-red-600', bg: 'bg-red-50' },
              { title: 'CPC / BNSS Rules', desc: 'Civil procedure & court rules', icon: Scale, color: 'text-amber-600', bg: 'bg-amber-50' },
              { title: 'Constitution of India', desc: 'Fundamental rights & duties', icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { title: 'Legal Case Search', desc: 'Find precedents across high courts', icon: Search, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { title: 'Law FAQ Bot', desc: 'Answers to common legal issues', icon: HelpCircle, color: 'text-slate-600', bg: 'bg-slate-50' },
            ].map((card, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group">
                <div className={`${card.bg} w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <card.icon className={`w-7 h-7 ${card.color}`} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{card.title}</h3>
                <p className="text-slate-500 text-sm font-medium">{card.desc}</p>
                <div className="mt-6 flex items-center text-xs font-bold text-indigo-600 uppercase tracking-widest gap-2">
                  <span>Explore Library</span>
                  <div className="w-4 h-[1px] bg-indigo-600"></div>
                </div>
              </div>
            ))}
          </div>
        );
      default:
        return <ChatWindow />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navbar */}
        <header className="h-20 bg-white border-b border-slate-200 px-10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Section:</span>
            <span className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              {activeTab === AppTab.CHAT && 'Legal Consultation Chat'}
              {activeTab === AppTab.DOCUMENT && 'Smart Case Analysis'}
              {activeTab === AppTab.MY_DOCUMENTS && 'Case Archive'}
              {activeTab === AppTab.DRAFTS && 'Automated Legal Drafting'}
              {activeTab === AppTab.ADVOCATE_TOOLS && 'Advocate Command Center'}
              {activeTab === AppTab.RESOURCES && 'Digital Law Library'}
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors ${
              user.userType === UserType.ADVOCATE ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
            }`}>
              {user.userType === UserType.ADVOCATE ? <Gavel className="w-3.5 h-3.5" /> : <UserIcon className="w-3.5 h-3.5" />}
              {user.userType === UserType.ADVOCATE ? 'Advocate Portal' : 'Citizen User'}
            </div>
            
            <div className="h-8 w-px bg-slate-200"></div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-900 leading-none truncate max-w-[150px]">
                  {user.name || user.identifier}
                </p>
                <button 
                  onClick={handleLogout}
                  className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-1 hover:text-amber-600 transition-colors"
                >
                  Logout
                </button>
              </div>
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center border border-slate-800 text-white shadow-lg">
                <Shield className="w-5 h-5" />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-10 overflow-y-auto custom-scrollbar bg-slate-50/30">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
