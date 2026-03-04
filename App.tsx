import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import DocAnalyzer from './components/DocAnalyzer';
import MyDocuments from './components/MyDocuments';
import DraftGenerator from './components/DraftGenerator';
import AdvocateTools from './components/AdvocateTools';
import ProfilePage from './components/ProfilePage';
import Auth from './components/Auth';
import LawLibrary from './components/LawLibrary';
import { AppTab, UserProfile, UserType } from './types';
import { 
  Menu, Gavel, User as UserIcon
} from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.CHAT);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('legallens_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.token || parsed.access_token)) {
          return {
            ...parsed,
            id: parsed.user_id || parsed.id
          } as UserProfile;
        }
      }
    } catch (e) { console.error("Session parse failure", e); }
    return null;
  });

  const handleLogin = (profile: UserProfile) => {
    const standardized = { ...profile, id: profile.user_id || profile.id };
    setUser(standardized);
    localStorage.setItem('legallens_session', JSON.stringify(standardized));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('legallens_session');
  };

  const handleUpdateProfile = (updated: UserProfile) => {
    const standardized = { ...updated, id: updated.user_id || updated.id };
    setUser(standardized);
    localStorage.setItem('legallens_session', JSON.stringify(standardized));
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  const renderContent = () => {
    const contentMap: Record<AppTab, React.ReactNode> = {
      [AppTab.CHAT]: <ChatWindow />,
      [AppTab.DOCUMENT]: <DocAnalyzer user={user} />,
      [AppTab.MY_DOCUMENTS]: <MyDocuments />,
      [AppTab.DRAFTS]: <DraftGenerator />,
      [AppTab.ADVOCATE_TOOLS]: <AdvocateTools user={user} />,
      [AppTab.PROFILE]: <ProfilePage user={user} onUpdate={handleUpdateProfile} onLogout={handleLogout} />,
      [AppTab.RESOURCES]: <LawLibrary />,
    };

    return (
      <div className="h-full">
        {contentMap[activeTab] || <ChatWindow />}
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      <div className={`fixed inset-0 z-50 lg:relative lg:block ${isSidebarOpen ? 'block' : 'hidden'} lg:z-auto`}>
        <div className="absolute inset-0 bg-slate-900/50 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
        <div className="relative h-full w-64 shadow-xl">
          <Sidebar 
            activeTab={activeTab} 
            userType={user.userType} 
            setActiveTab={(tab) => { setActiveTab(tab); setIsSidebarOpen(false); }} 
          />
        </div>
      </div>
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm z-20">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 text-slate-500" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 capitalize font-serif tracking-tight">
              {activeTab.replace('_', ' ')}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div 
              className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition-colors"
              onClick={() => setActiveTab(AppTab.PROFILE)}
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 leading-none">{user.name || 'User'}</p>
                <p className="text-[10px] font-medium text-slate-500 uppercase mt-1 tracking-widest">
                  {user.userType === UserType.ADVOCATE ? 'Advocate' : 'Citizen'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white overflow-hidden shadow-sm border border-slate-100">
                {user.photoUrl ? (
                  <img src={user.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${user.userType === UserType.ADVOCATE ? 'bg-indigo-600' : 'bg-slate-900'}`}>
                    {user.userType === UserType.ADVOCATE ? <Gavel className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;