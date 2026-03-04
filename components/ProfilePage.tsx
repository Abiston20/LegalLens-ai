
import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Mail, Shield, Gavel, Edit3, Save, CheckCircle2, 
  AlertCircle, Loader2, Globe, MapPin, Lock, X, ShieldCheck,
  Eye, EyeOff, RefreshCcw, Activity, FileText, Info, Briefcase,
  Award, FileBadge, Scale, Users, Camera, LogOut, Key
} from 'lucide-react';
import { UserProfile, UserType, Language, Jurisdiction } from '../types';
import { apiRequest } from '../services/apiService';

interface ProfilePageProps {
  user: UserProfile;
  onUpdate: (updatedUser: UserProfile) => void;
  onLogout: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUpdate, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name || '');
  const [barId, setBarId] = useState(user.barId || '');
  const [photoUrl, setPhotoUrl] = useState(user.photoUrl || '');
  const [language, setLanguage] = useState<Language>(user.preferences?.language || Language.ENGLISH);
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction>(user.preferences?.jurisdiction || Jurisdiction.UNION);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [stats, setStats] = useState({ chats: 0, docs: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const chats = await apiRequest('/legal/chat');
        const docs = await apiRequest('/legal/my-documents');
        setStats({
          chats: Array.isArray(chats) ? chats.length : 0,
          docs: Array.isArray(docs) ? docs.length : 0
        });
      } catch (e) {
        console.error("Failed to fetch user stats", e);
      }
    };
    fetchStats();
  }, [user.id]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
        setIsEditing(true); // Trigger edit mode when photo changes
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePreferences = async () => {
    setLoading(true);
    try {
      const updatedUser: UserProfile = { 
        ...user, 
        name,
        photoUrl,
        barId: user.userType === UserType.ADVOCATE ? barId : undefined,
        preferences: { 
          language, 
          jurisdiction 
        }
      };

      // Persist to API
      await apiRequest('/user/update', {
        method: 'PATCH',
        body: JSON.stringify({
          name: updatedUser.name,
          bar_id: updatedUser.barId,
          photo_url: updatedUser.photoUrl,
          preferences: updatedUser.preferences
        })
      });

      // Update local state and parent
      onUpdate(updatedUser);
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      console.error("Profile synchronization failure:", e);
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const isAdvocate = user.userType === UserType.ADVOCATE;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20 relative">
      
      {success && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-bold text-sm uppercase tracking-widest">Vault Updated Successfully</span>
        </div>
      )}

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden">
        <div className={`h-32 relative ${isAdvocate ? 'bg-amber-900' : 'bg-slate-900'}`}>
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
          
          {/* Profile Photo Selection */}
          <div className="absolute -bottom-12 left-12 group">
            <div className={`w-32 h-32 rounded-[40px] flex items-center justify-center text-white shadow-2xl border-4 border-white transform rotate-3 overflow-hidden relative ${isAdvocate ? 'bg-amber-500' : 'bg-indigo-600'}`}>
              {photoUrl ? (
                <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                isAdvocate ? <Gavel className="w-12 h-12" /> : <User className="w-12 h-12" />
              )}
              
              {/* Photo Edit Overlay */}
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
              >
                <Camera className="w-8 h-8" />
              </button>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handlePhotoUpload} 
              className="hidden" 
              accept="image/*"
            />
          </div>
        </div>
        
        <div className="pt-16 pb-10 px-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold font-serif text-slate-900 tracking-tight flex items-center gap-3">
              {user.name || 'Anonymous User'}
              {isAdvocate && (
                <span className="bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-amber-200 flex items-center gap-1.5">
                  <Award className="w-3 h-3" /> Professional
                </span>
              )}
            </h2>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" />
              {user.identifier}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {isEditing ? (
              <div className="flex items-center gap-3">
                <button onClick={() => setIsEditing(false)} className="px-6 py-3 rounded-2xl font-bold text-slate-500 hover:text-slate-700 transition-all text-sm">Cancel</button>
                <button onClick={handleSavePreferences} disabled={loading} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Profile
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button onClick={() => setIsEditing(true)} className="bg-slate-100 text-slate-700 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-200 transition-all border border-slate-200 text-sm">
                  <Edit3 className="w-4 h-4" />
                  Edit Settings
                </button>
                <button onClick={onLogout} className="bg-red-50 text-red-600 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-red-100 transition-all border border-red-100 text-sm">
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 space-y-8">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
              <Shield className="w-5 h-5 text-indigo-600" />
              Identity Configuration
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Legal Name</label>
                {isEditing ? (
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 outline-none focus:border-indigo-600 transition-all font-semibold" />
                ) : (
                  <p className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-semibold text-slate-700">{user.name || 'Not Specified'}</p>
                )}
              </div>
              
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Portal Role</label>
                <div className={`px-4 py-3 rounded-xl border font-bold text-xs uppercase tracking-widest flex items-center gap-3 ${isAdvocate ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-indigo-50 border-indigo-100 text-indigo-700'}`}>
                  {isAdvocate ? <Scale className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                  {isAdvocate ? 'Advocate / Practitioner' : 'Public Citizen'}
                </div>
              </div>

              {isAdvocate && (
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">State Bar ID</label>
                  {isEditing ? (
                    <input type="text" value={barId} onChange={(e) => setBarId(e.target.value)} placeholder="MAH/123/2024" className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 outline-none focus:border-indigo-600 transition-all font-semibold" />
                  ) : (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-semibold text-slate-700 flex items-center gap-2">
                      <FileBadge className="w-4 h-4 text-amber-500" />
                      {user.barId || 'Verification Pending'}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Primary Language</label>
                <div className="relative">
                  <select disabled={!isEditing} value={language} onChange={(e) => setLanguage(e.target.value as Language)} className="w-full appearance-none bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 pr-10 font-semibold text-slate-700 outline-none focus:border-indigo-600 transition-all disabled:opacity-70">
                    {Object.values(Language).map(lang => <option key={lang} value={lang}>{lang}</option>)}
                  </select>
                  <Globe className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Legal Region</label>
                <div className="relative">
                  <select disabled={!isEditing} value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value as Jurisdiction)} className="w-full appearance-none bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 pr-10 font-semibold text-slate-700 outline-none focus:border-indigo-600 transition-all disabled:opacity-70">
                    {Object.values(Jurisdiction).map(jur => <option key={jur} value={jur}>{jur}</option>)}
                  </select>
                  <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-[40px] p-10 space-y-8 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
              <Key className="w-5 h-5 text-indigo-600" />
              Auth Controls
            </h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={onLogout} className="flex-1 bg-slate-900 text-white px-8 py-5 rounded-[24px] font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10">
                <LogOut className="w-5 h-5" />
                Terminate Session
              </button>
              <button onClick={onLogout} className="flex-1 bg-white border-2 border-slate-100 text-slate-700 px-8 py-5 rounded-[24px] font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:border-indigo-600 hover:text-indigo-600 transition-all">
                <RefreshCcw className="w-5 h-5" />
                Switch Account
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 p-10 rounded-[40px] shadow-2xl space-y-10 text-white relative overflow-hidden">
            <h3 className="text-xl font-bold flex items-center gap-3 relative z-10">
              <Activity className="w-5 h-5 text-amber-500" />
              Activity Audit
            </h3>
            <div className="space-y-6 relative z-10">
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Consultations</p>
                  <p className="text-3xl font-bold text-white">{stats.chats}</p>
                </div>
                <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center"><Activity className="w-5 h-5 text-indigo-400" /></div>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Analyzed Docs</p>
                  <p className="text-3xl font-bold text-white">{stats.docs}</p>
                </div>
                <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center"><FileText className="w-5 h-5 text-amber-400" /></div>
              </div>
            </div>
          </div>

          <div className="bg-slate-100 p-8 rounded-[40px] border border-slate-200">
            <div className="flex items-center gap-3 text-slate-600 mb-4">
              <Info className="w-5 h-5" />
              <h4 className="font-bold text-[10px] uppercase tracking-widest">Platform Note</h4>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed font-medium italic">
              "Credential changes require local vault synchronization. If you transition from Citizen to Advocate, please contact our support node for bar verification."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
