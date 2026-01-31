
import React, { useState, useRef, useEffect } from 'react';
import { Scale, ShieldCheck, ArrowRight, Loader2, Lock, AlertCircle, User as UserIcon, Mail, Gavel, Users, ChevronLeft, CreditCard, PlayCircle, Shield, Bell, X, Info } from 'lucide-react';
import { UserProfile, UserType } from '../types';
import { apiRequest } from '../services/apiService';

interface AuthProps {
  onLogin: (user: UserProfile) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [userType, setUserType] = useState<UserType | null>(null);
  const [step, setStep] = useState<'ROLE_SELECT' | 'FORM' | 'OTP'>('FORM');
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [barId, setBarId] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSimNotification, setShowSimNotification] = useState(false);
  const [simOtp, setSimOtp] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Automatically hide simulation notification after 15 seconds
  useEffect(() => {
    if (showSimNotification) {
      const timer = setTimeout(() => setShowSimNotification(false), 20000);
      return () => clearTimeout(timer);
    }
  }, [showSimNotification]);

  const toggleMode = () => {
    const nextMode = mode === 'LOGIN' ? 'REGISTER' : 'LOGIN';
    setMode(nextMode);
    setError(null);
    setStep(nextMode === 'REGISTER' ? 'ROLE_SELECT' : 'FORM');
    setUserType(nextMode === 'LOGIN' ? UserType.CITIZEN : null);
    setOtp(['', '', '', '', '', '']);
    setShowSimNotification(false);
  };

  const handleRoleSelect = (type: UserType) => {
    setUserType(type);
    setStep('FORM');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setIsSendingEmail(true);
    setError(null);

    try {
      const endpoint = mode === 'REGISTER' ? '/auth/register' : '/auth/send-otp';
      const body = mode === 'REGISTER' 
        ? { name, email: identifier, user_type: userType, bar_id: barId } 
        : { identifier };

      const response = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (response.demo_otp) {
        setSimOtp(response.demo_otp);
        // Add a slight delay to mimic real email transit
        setTimeout(() => {
          setShowSimNotification(true);
          setIsSendingEmail(false);
        }, 1200);
      }

      setStep('OTP');
    } catch (err: any) {
      setError(err.message);
      setIsSendingEmail(false);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length < 6) return;
    
    setLoading(true);
    setError(null);

    try {
      const data = await apiRequest('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ identifier, otp: otpString }),
      });

      setShowSimNotification(false);
      onLogin({
        id: data.user_id,
        identifier: identifier,
        token: data.access_token,
        userType: data.user_type as UserType,
        name: data.name,
        barId: data.bar_id
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-6 z-[9999] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.05),transparent),radial-gradient(circle_at_bottom_left,rgba(79,70,229,0.05),transparent)]"></div>
      
      {/* SIMULATION EMAIL NOTIFICATION */}
      {showSimNotification && (
        <div className="fixed top-8 right-8 z-[10000] w-full max-w-sm animate-in slide-in-from-right-8 duration-500">
          <div className="bg-white rounded-3xl shadow-2xl border border-indigo-100 overflow-hidden">
            <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-bold text-xs uppercase tracking-widest">Incoming Secure Mail</span>
              </div>
              <button onClick={() => setShowSimNotification(false)} className="text-white/60 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">From: LegalLens Security</p>
                <h4 className="font-bold text-slate-900 text-sm">Action Required: Login Verification</h4>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Authorization Code</p>
                  <p className="text-3xl font-bold text-indigo-600 tracking-[0.2em] font-mono">{simOtp}</p>
                </div>
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
                  <ShieldCheck className="w-7 h-7 text-indigo-600" />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic border-t border-slate-100 pt-3">
                Note: In production, this email is sent to <strong>{identifier}</strong> using encrypted SMTP channels.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl w-full relative">
        <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-[48px] p-12 shadow-2xl overflow-hidden relative min-h-[580px] flex flex-col transition-all duration-700">
          
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-20 h-20 bg-amber-500 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-amber-500/20 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
              <Scale className="w-10 h-10 text-slate-900" />
            </div>
            <h1 className="text-4xl font-bold text-white font-serif tracking-tight">LEGALLENS</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.4em] mt-3 opacity-60">AI Intelligence Core</p>
          </div>

          {error && (
            <div className="mb-8 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-4 text-red-400 text-sm animate-in zoom-in duration-300">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {mode === 'REGISTER' && step === 'ROLE_SELECT' ? (
            <div className="flex-1 space-y-8 flex flex-col justify-center animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => handleRoleSelect(UserType.CITIZEN)}
                  className="group bg-white/5 border border-white/10 p-10 rounded-[40px] text-left hover:bg-amber-500 transition-all duration-500 shadow-lg hover:scale-[1.02]"
                >
                  <Users className="w-10 h-10 text-white mb-6 group-hover:text-slate-900 transition-colors" />
                  <h3 className="text-2xl font-bold text-white group-hover:text-slate-900 transition-colors">Citizen</h3>
                  <p className="text-slate-400 text-sm group-hover:text-slate-900/70 mt-3 leading-relaxed transition-colors">Legal consultation and document vault for individuals.</p>
                </button>
                <button
                  onClick={() => handleRoleSelect(UserType.ADVOCATE)}
                  className="group bg-white/5 border border-white/10 p-10 rounded-[40px] text-left hover:bg-indigo-600 transition-all duration-500 shadow-lg hover:scale-[1.02]"
                >
                  <Gavel className="w-10 h-10 text-white mb-6 transition-colors" />
                  <h3 className="text-2xl font-bold text-white transition-colors">Advocate</h3>
                  <p className="text-slate-400 text-sm group-hover:text-white/70 mt-3 leading-relaxed transition-colors">Professional research, drafting, and client portals.</p>
                </button>
              </div>
              <p className="text-center text-slate-500 text-xs mt-4">
                Already registered? <button onClick={toggleMode} className="text-amber-500 font-bold hover:underline">Sign In</button>
              </p>
            </div>
          ) : step === 'FORM' ? (
            <form onSubmit={handleFormSubmit} className="space-y-6 max-w-md mx-auto w-full animate-in slide-in-from-bottom-6 duration-500">
              {mode === 'REGISTER' && (
                <div className="relative group">
                  <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 text-white outline-none focus:border-amber-500 transition-all" />
                </div>
              )}
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
                <input type="email" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Email Address" className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 text-white outline-none focus:border-amber-500 transition-all" />
              </div>
              
              <button type="submit" disabled={loading} className="w-full bg-amber-500 text-slate-900 font-bold py-5 rounded-2xl hover:bg-amber-400 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-amber-500/20 active:scale-[0.98] disabled:opacity-50">
                {loading ? <div className="flex items-center gap-3"><Loader2 className="w-6 h-6 animate-spin" /> <span>{isSendingEmail ? 'Sending Secure Mail...' : 'Authorizing...'}</span></div> : <>{mode === 'LOGIN' ? 'Access Portal' : 'Create Profile'} <ArrowRight className="w-6 h-6" /></>}
              </button>
              
              <div className="flex items-center justify-between px-2 pt-4">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                  {mode === 'LOGIN' ? 'New to Legallens?' : 'Existing Member?'}
                  <button type="button" onClick={toggleMode} className="ml-2 text-amber-500 hover:underline">{mode === 'LOGIN' ? 'Register' : 'Sign In'}</button>
                </p>
                <div className="flex items-center gap-2 text-emerald-500/60 text-[9px] font-bold uppercase tracking-[0.2em]">
                  <Shield className="w-3 h-3" /> Encrypted
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-10 max-w-md mx-auto w-full animate-in zoom-in duration-500">
              <div className="text-center space-y-3">
                <p className="text-slate-300 text-sm">Security code dispatched to <span className="text-white font-bold">{identifier}</span></p>
                <div className="flex items-center justify-center gap-2 py-2 px-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                  <Mail className="w-4 h-4 text-indigo-400" />
                  <p className="text-indigo-300 text-[10px] uppercase font-bold tracking-[0.1em]">Please check your inbox (Simulation Overlay Incoming)</p>
                </div>
              </div>
              <div className="flex justify-between gap-3">
                {otp.map((digit, idx) => (
                  <input key={idx} ref={el => { otpRefs.current[idx] = el; }} type="text" maxLength={1} value={digit} onChange={e => handleOtpChange(idx, e.target.value)} className="w-14 h-20 bg-white/5 border border-white/10 rounded-2xl text-center text-3xl font-bold text-white outline-none focus:border-amber-500 transition-all shadow-xl" />
                ))}
              </div>
              <button onClick={handleVerifyOtp} disabled={loading || otp.some(d => !d)} className="w-full bg-indigo-600 text-white font-bold py-5 rounded-2xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-2xl shadow-indigo-600/20">
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Finalize Encryption <Lock className="w-6 h-6" /></>}
              </button>
              <div className="text-center">
                <button 
                  type="button" 
                  onClick={() => setShowSimNotification(true)} 
                  className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-indigo-400 transition-colors"
                >
                  Email not arrived? Show simulated mail notification
                </button>
              </div>
            </div>
          )}

          <div className="mt-auto pt-12 border-t border-white/5 flex items-center justify-between text-[9px] font-bold text-slate-600 uppercase tracking-[0.3em]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Verified Jurisdictional Node
            </div>
            <span>v2.5 Professional</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
