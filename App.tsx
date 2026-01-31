
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import DocAnalyzer from './components/DocAnalyzer';
import MyDocuments from './components/MyDocuments';
import DraftGenerator from './components/DraftGenerator';
import AdvocateTools from './components/AdvocateTools';
import ProfilePage from './components/ProfilePage';
import Auth from './components/Auth';
import { AppTab, UserProfile, UserType } from './types';
import { Scale, Search, Shield, HelpCircle, BookOpen, Gavel, User as UserIcon, Menu, X, MessageSquare, FileText, FolderOpen, PenTool, Library, UserCircle, Briefcase } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.CHAT);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
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

  const handleUpdateProfile = (updatedProfile: UserProfile) => {
    setUser(updatedProfile);
    localStorage.setItem('legallens_session', JSON.stringify(updatedProfile));
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
      case AppTab.PROFILE:
        return <ProfilePage user={user} onUpdate={handleUpdateProfile} />;
      case AppTab.RESOURCES:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in duration-500">
            {[
              { title: 'IPC / BNS Index', desc: 'Browse criminal laws & sections', icon: Shield, color: 'text-red-600', bg: 'bg-red-50' },
              { title: 'CPC / BNSS Rules', desc: 'Civil procedure & court rules', icon: Scale, color: 'text-amber-600', bg: 'bg-amber-50' },
              { title: 'Commercial Acts', desc: 'Companies, GST, Contracts, IPR', icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50' },
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

  const navItems = [
    { id: AppTab.CHAT, icon: MessageSquare, label: 'Chat' },
    { id: AppTab.DOCUMENT, icon: FileText, label: 'Analyze' },
    { id: AppTab.DRAFTS, icon: PenTool, label: 'Draft' },
    { id: AppTab.PROFILE, icon: UserCircle, label: 'Profile' }
  ];

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden relative">
      {/* Sidebar - Hidden on mobile by default */}
      <div className={`fixed inset-0 z-50 lg:relative lg:block ${isSidebarOpen ? 'block' : 'hidden'} lg:z-auto`}>
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
        <div className="relative h-full w-64">
          <Sidebar activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setIsSidebarOpen(false); }} />
        </div>
      </div>
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navbar */}
        <header className="h-20 bg-white border-b border-slate-200 px-6 md:px-10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6 text-slate-900" />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Portal:</span>
              <span className="text-xs md:text-sm font-bold text-slate-900 uppercase tracking-wide truncate max-w-[150px] md:max-w-none">
                {activeTab === AppTab.CHAT && 'Consultation'}
                {activeTab === AppTab.DOCUMENT && 'Doc Intelligence'}
                {activeTab === AppTab.MY_DOCUMENTS && 'Vault'}
                {activeTab === AppTab.DRAFTS && 'Drafting'}
                {activeTab === AppTab.ADVOCATE_TOOLS && 'Command Center'}
                {activeTab === AppTab.RESOURCES && 'Library'}
                {activeTab === AppTab.PROFILE && 'Identity'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 md:gap-6">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-colors ${
              user.userType === UserType.ADVOCATE ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
            }`}>
              {user.userType === UserType.ADVOCATE ? <Gavel className="w-3 md:w-3.5 h-3 md:h-3.5" /> : <UserIcon className="w-3 md:w-3.5 h-3 md:h-3.5" />}
              <span className="hidden xs:inline">{user.userType === UserType.ADVOCATE ? 'Advocate' : 'Citizen'}</span>
            </div>
            
            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900 leading-none truncate max-w-[120px]">
                  {user.name || user.identifier}
                </p>
                <button 
                  onClick={handleLogout}
                  className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mt-1 hover:text-amber-600 transition-colors"
                >
                  Logout
                </button>
              </div>
              <div 
                className="w-9 h-9 md:w-10 md:h-10 bg-slate-900 rounded-xl flex items-center justify-center border border-slate-800 text-white shadow-lg cursor-pointer hover:bg-slate-800 transition-colors"
                onClick={() => setActiveTab(AppTab.PROFILE)}
              >
                <UserCircle className="w-5 h-5 md:w-6 md:h-6" />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-4 md:p-10 overflow-y-auto custom-scrollbar bg-slate-50/30 pb-24 md:pb-10">
          {renderContent()}
        </div>

        {/* Bottom Mobile Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around px-4 z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 transition-colors ${
                activeTab === item.id ? 'text-amber-500' : 'text-slate-400'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[9px] font-bold uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
};

export default App;
