
import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Mail, Shield, Gavel, Edit3, Save, CheckCircle2, 
  AlertCircle, Loader2, Globe, MapPin, Lock, X, ShieldCheck,
  Eye, EyeOff, RefreshCcw, Activity, FileText, Info
} from 'lucide-react';
import { UserProfile, UserType, Language, Jurisdiction } from '../types';
import { apiRequest } from '../services/apiService';

interface ProfilePageProps {
  user: UserProfile;
  onUpdate: (updatedUser: UserProfile) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name || '');
  const [language, setLanguage] = useState<Language>(user.preferences?.language || Language.ENGLISH);
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction>(user.preferences?.jurisdiction || Jurisdiction.UNION);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [stats, setStats] = useState({ chats: 0, docs: 0 });

  // Password Change Flow States
  const [showPasswordFlow, setShowPasswordFlow] = useState(false);
  const [pwdStep, setPwdStep] = useState<'IDLE' | 'OTP' | 'NEW_PWD'>('IDLE');
  const [pwdOtp, setPwdOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [showSimNotification, setShowSimNotification] = useState(false);
  const [simOtp, setSimOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const chats = await apiRequest('/legal/chat');
        const docs = await apiRequest('/legal/my-documents');
        setStats({
          chats: chats?.length || 0,
          docs: docs?.length || 0
        });
      } catch (e) {
        console.error("Failed to fetch user stats", e);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSavePreferences = async () => {
    setLoading(true);
    try {
      // In a real app, we would send a PATCH to Supabase users table here.
      // For this step, we update the local session which represents our current user state.
      const updatedUser: UserProfile = { 
        ...user, 
        name,
        preferences: { 
          language, 
          jurisdiction 
        }
      };
      onUpdate(updatedUser);
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const initPasswordChange = async () => {
    setLoading(true);
    setPwdError(null);
    try {
      const res = await apiRequest('/auth/change-password-init');
      if (res.demo_otp) {
        setSimOtp(res.demo_otp);
        setShowSimNotification(true);
      }
      setPwdStep('OTP');
      setShowPasswordFlow(true);
      setResendTimer(60);
      setPwdOtp(['', '', '', '', '', '']);
    } catch (e: any) {
      setPwdError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...pwdOtp];
    newOtp[index] = value.substring(value.length - 1);
    setPwdOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pwdOtp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const verifyPwdOtp = async () => {
    const otpString = pwdOtp.join('');
    if (otpString.length < 6) return;
    setLoading(true);
    try {
      if (otpString === simOtp) {
        setPwdStep('NEW_PWD');
        setShowSimNotification(false);
        setPwdError(null);
      } else {
        throw new Error("Incorrect verification code. Please check and try again.");
      }
    } catch (e: any) {
      setPwdError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const finalizePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setPwdError("Security keys do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPwdError("Security key must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1200));
      setSuccess(true);
      setShowPasswordFlow(false);
      setPwdStep('IDLE');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      setPwdError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20 relative">
      
      {/* Simulation Email Notification */}
      {showSimNotification && (
        <div className="fixed top-8 right-8 z-[10000] w-full max-w-sm animate-in slide-in-from-right-8 duration-500">
          <div className="bg-white rounded-3xl shadow-2xl border border-indigo-100 overflow-hidden">
            <div className="bg-amber-500 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-bold text-xs uppercase tracking-widest">Security Dispatch</span>
              </div>
              <button onClick={() => setShowSimNotification(false)} className="text-white/60 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">From: LegalLens Security</p>
                <h4 className="font-bold text-slate-900 text-sm">Action: Access Credentials Reset</h4>
              </div>
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">Confirmation Code</p>
                  <p className="text-3xl font-bold text-amber-600 tracking-[0.2em] font-mono">{simOtp}</p>
                </div>
                <ShieldCheck className="w-8 h-8 text-amber-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="h-32 bg-slate-900 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/20 to-transparent"></div>
          <div className="absolute -bottom-12 left-12">
            <div className="w-24 h-24 bg-amber-500 rounded-3xl flex items-center justify-center text-slate-900 shadow-2xl border-4 border-white transform rotate-3">
              <User className="w-12 h-12" />
            </div>
          </div>
        </div>
        
        <div className="pt-16 pb-10 px-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold font-serif text-slate-900 tracking-tight flex items-center gap-3">
              {user.name || 'Professional Identity'}
              {user.userType === UserType.ADVOCATE && (
                <span className="bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-amber-200 flex items-center gap-1.5">
                  <Gavel className="w-3 h-3" /> Verified
                </span>
              )}
            </h2>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" />
              {user.identifier}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {isEditing ? (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-3 rounded-2xl font-bold text-slate-500 hover:text-slate-700 transition-all text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSavePreferences}
                  disabled={loading}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Confirm Updates
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="bg-slate-100 text-slate-700 px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-200 transition-all border border-slate-200"
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 animate-in zoom-in duration-300">
          <CheckCircle2 className="w-5 h-5" />
          <p className="text-sm font-bold uppercase tracking-widest">Profile Preferences Synchronized</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Identity & Preferences */}
          <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 space-y-8">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
              <Shield className="w-5 h-5 text-indigo-600" />
              Profile Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.g. Adv. John Doe"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 font-medium transition-all"
                  />
                ) : (
                  <p className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-semibold text-slate-700">
                    {user.name || 'Not Set'}
                  </p>
                )}
              </div>
              
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Digital Address</label>
                <p className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-semibold text-slate-400 italic">
                  {user.identifier}
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Language Hub</label>
                <div className="relative">
                  <select 
                    disabled={!isEditing}
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as Language)}
                    className="w-full appearance-none bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 pr-10 font-semibold text-slate-700 outline-none focus:border-amber-500 transition-all disabled:opacity-70"
                  >
                    {Object.values(Language).map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                  <Globe className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jurisdictional Node</label>
                <div className="relative">
                  <select 
                    disabled={!isEditing}
                    value={jurisdiction}
                    onChange={(e) => setJurisdiction(e.target.value as Jurisdiction)}
                    className="w-full appearance-none bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 pr-10 font-semibold text-slate-700 outline-none focus:border-amber-500 transition-all disabled:opacity-70"
                  >
                    {Object.values(Jurisdiction).map(jur => (
                      <option key={jur} value={jur}>{jur}</option>
                    ))}
                  </select>
                  <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Robust Password Flow Section */}
          <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 space-y-8">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
              <Lock className="w-5 h-5 text-red-500" />
              Security Protocol
            </h3>

            {!showPasswordFlow ? (
              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-sm">Update Access Key</h4>
                  <p className="text-xs text-slate-500 font-medium">Reset your secure identity access key via OTP.</p>
                </div>
                <button 
                  onClick={initPasswordChange}
                  className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-800 transition-all"
                >
                  Initiate Reset
                </button>
              </div>
            ) : (
              <div className="space-y-8 animate-in slide-in-from-top-4 duration-300">
                {pwdError && (
                  <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 text-red-700 text-xs font-bold">
                    <AlertCircle className="w-4 h-4" />
                    {pwdError}
                  </div>
                )}

                {pwdStep === 'OTP' ? (
                  <div className="space-y-8">
                    <div className="text-center space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identity Verification</p>
                      <p className="text-xs text-slate-500">Enter the 6-digit code sent to your registered node.</p>
                    </div>
                    
                    <div className="flex justify-between gap-2 max-w-sm mx-auto">
                      {pwdOtp.map((digit, idx) => (
                        <input 
                          key={idx} 
                          ref={el => { otpRefs.current[idx] = el; }}
                          type="text" 
                          maxLength={1} 
                          value={digit} 
                          onKeyDown={(e) => handleKeyDown(idx, e)}
                          onChange={e => handleOtpChange(idx, e.target.value)}
                          className="w-12 h-16 bg-slate-50 border-2 border-slate-100 rounded-xl text-center text-2xl font-bold text-slate-900 outline-none focus:border-amber-500 transition-all shadow-sm" 
                        />
                      ))}
                    </div>

                    <div className="flex flex-col items-center gap-4">
                      <button 
                        onClick={verifyPwdOtp}
                        disabled={loading || pwdOtp.some(d => !d)}
                        className="w-full max-w-sm bg-indigo-600 text-white py-4 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/20 active:scale-95"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Authorize Protocol'}
                      </button>
                      
                      <div className="flex flex-col items-center gap-2">
                        <button 
                          onClick={initPasswordChange}
                          disabled={resendTimer > 0}
                          className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 hover:text-indigo-600 disabled:opacity-50 transition-colors"
                        >
                          <RefreshCcw className={`w-3 h-3 ${resendTimer > 0 ? '' : 'animate-spin-slow'}`} />
                          {resendTimer > 0 ? `Resend Available in ${resendTimer}s` : 'Resend Verification Code'}
                        </button>
                        <button 
                          onClick={() => setShowPasswordFlow(false)}
                          className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors"
                        >
                          Abort Reset Process
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">New Security Key</label>
                        <div className="relative">
                          <input 
                            type={showPassword ? "text" : "password"} 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:border-amber-500 font-medium pr-10 shadow-sm" 
                            placeholder="••••••••"
                          />
                          <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confirm Key</label>
                        <input 
                          type={showPassword ? "text" : "password"} 
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 outline-none focus:border-amber-500 font-medium shadow-sm" 
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
                      <button 
                        onClick={() => setShowPasswordFlow(false)}
                        className="flex-1 py-4 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
                      >
                        Discard Reset
                      </button>
                      <button 
                        onClick={finalizePasswordChange}
                        disabled={loading || !newPassword}
                        className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all disabled:opacity-50 shadow-lg shadow-slate-900/10 active:scale-95"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Apply Security Key'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats Column */}
        <div className="space-y-8">
          <div className="bg-slate-900 p-10 rounded-[40px] shadow-2xl space-y-10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full"></div>
            
            <h3 className="text-xl font-bold flex items-center gap-3 relative z-10">
              <Activity className="w-5 h-5 text-amber-500" />
              Engagement Metrics
            </h3>

            <div className="space-y-6 relative z-10">
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Consultations</p>
                  <p className="text-3xl font-bold text-white">{stats.chats}</p>
                </div>
                <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                  <Activity className="w-5 h-5 text-indigo-400" />
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Intelligence Audits</p>
                  <p className="text-3xl font-bold text-white">{stats.docs}</p>
                </div>
                <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-amber-400" />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 space-y-4">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Quantum Data Sovereignty</span>
                <span className="text-emerald-500">Secure</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-full animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 p-8 rounded-[40px] space-y-4">
            <div className="flex items-center gap-3 text-amber-800">
              <Info className="w-5 h-5 shrink-0" />
              <h4 className="font-bold text-xs uppercase tracking-widest">Identity Note</h4>
            </div>
            <p className="text-amber-900/70 text-[11px] leading-relaxed font-medium">
              Your profile preferences for {language} and {jurisdiction} influence all legal analysis engines. Changes are applied instantly across the LegalLens network.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
