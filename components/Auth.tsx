
import React, { useState } from 'react';
import { 
  Scale, Loader2, AlertCircle, Mail, Gavel, Users, Eye, EyeOff, ShieldCheck, 
  ChevronRight, Bookmark, Gavel as GavelIcon, ShieldAlert, Lock, ArrowRight
} from 'lucide-react';
import { UserType, UserProfile } from '../types';
// Fix: Normalized casing of the import to match the lowercase filename 'authservice' to resolve TS1149 casing conflict.
import { authService } from '../services/authService';
import OTPVerification from './OTPVerification';

interface AuthProps {
  onLogin: (profile: UserProfile) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [userType, setUserType] = useState<UserType | null>(null);
  const [step, setStep] = useState<'ROLE_SELECT' | 'FORM' | 'VERIFY'>('FORM');
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleMode = () => {
    const newMode = mode === 'LOGIN' ? 'REGISTER' : 'LOGIN';
    setMode(newMode);
    setError(null);
    setStep(newMode === 'REGISTER' ? 'ROLE_SELECT' : 'FORM');
    setUserType(newMode === 'LOGIN' ? UserType.CITIZEN : null);
    setShowPassword(false);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'REGISTER') {
        if (!userType) throw new Error("Please select a professional role.");
        await authService.registerRequest(name, identifier, userType, password);
      } else {
        await authService.loginRequest(identifier);
      }
      setStep('VERIFY');
    } catch (err: any) {
      setError(err.message || "Credential verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (otp: string) => {
    setLoading(true);
    setError(null);
    try {
      const type = userType || UserType.CITIZEN;
      const profile = await authService.verifyOtp(identifier, otp, type);
      onLogin(profile);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex overflow-hidden bg-white">
      {/* LEFT: Branding/Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden flex-col items-center justify-center p-20 text-center">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full -mr-48 -mt-48 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-500/5 blur-[100px] rounded-full -ml-20 -mb-20"></div>
        
        <div className="relative z-10 space-y-12 max-w-lg">
          <div className="w-24 h-24 bg-indigo-600 rounded-[32px] flex items-center justify-center mx-auto shadow-2xl rotate-3 transform transition-all hover:rotate-6 hover:scale-110 duration-500">
             <Scale className="w-12 h-12 text-white" />
          </div>
          <div className="space-y-6">
            <h1 className="text-7xl font-black text-white font-serif tracking-tight">LegalLens</h1>
            <p className="text-slate-400 text-xl font-medium leading-relaxed opacity-80">
              The premier AI-powered co-pilot for the Indian legal ecosystem. 
              Zero-knowledge architecture for absolute privacy.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-6 pt-10">
            <div className="bg-white/5 border border-white/10 p-8 rounded-[40px] text-left space-y-3 backdrop-blur-sm">
              <ShieldCheck className="w-8 h-8 text-indigo-400" />
              <p className="text-white font-bold text-sm tracking-tight">Secured Vault</p>
              <p className="text-slate-500 text-[11px] font-medium leading-relaxed">AES-256 local encryption ensures your data never leaves this terminal.</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-8 rounded-[40px] text-left space-y-3 backdrop-blur-sm">
              <GavelIcon className="w-8 h-8 text-amber-500" />
              <p className="text-white font-bold text-sm tracking-tight">Jurisdictional AI</p>
              <p className="text-slate-500 text-[11px] font-medium leading-relaxed">Expert reasoning engine trained on Indian Penal Codes and Civil Statutes.</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Auth Content Area */}
      <div className="w-full lg:w-1/2 h-full flex items-center justify-center bg-slate-50 overflow-y-auto custom-scrollbar">
        <div className="w-full max-w-md p-10 md:p-14 space-y-10">
          
          {step === 'VERIFY' ? (
            <OTPVerification 
              email={identifier}
              onVerify={handleOtpVerify}
              onBack={() => setStep('FORM')}
              isLoading={loading}
              error={error}
            />
          ) : (
            <div className="animate-in fade-in slide-in-from-right-12 duration-1000 space-y-10">
              <div className="lg:hidden text-center space-y-4 mb-10">
                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg rotate-3">
                  <Scale className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-4xl font-black text-slate-900 font-serif tracking-tight">LegalLens</h1>
              </div>

              <div className="space-y-3">
                <h2 className="text-4xl font-bold text-slate-900 tracking-tight font-serif">
                  {mode === 'LOGIN' ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-slate-400 font-medium">
                  {mode === 'LOGIN' 
                    ? 'Authorized access to your secure local vault.' 
                    : 'Initialize your professional identity on this node.'}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-5 rounded-[24px] text-xs font-bold flex items-center gap-4 animate-shake shadow-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}

              {mode === 'REGISTER' && step === 'ROLE_SELECT' ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <button 
                    onClick={() => { setUserType(UserType.CITIZEN); setStep('FORM'); }} 
                    className="w-full flex items-center gap-6 p-8 rounded-[36px] border-2 border-transparent bg-white shadow-xl shadow-slate-200/40 hover:border-indigo-600 hover:shadow-2xl transition-all text-left group"
                  >
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                      <Users className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 text-xl tracking-tight">Public Citizen</p>
                      <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-widest">Personal Legal Suite</p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-slate-200 group-hover:text-indigo-600 transition-all group-hover:translate-x-1" />
                  </button>
                  
                  <button 
                    onClick={() => { setUserType(UserType.ADVOCATE); setStep('FORM'); }} 
                    className="w-full flex items-center gap-6 p-8 rounded-[36px] border-2 border-transparent bg-white shadow-xl shadow-slate-200/40 hover:border-amber-600 hover:shadow-2xl transition-all text-left group"
                  >
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-inner">
                      <Gavel className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 text-xl tracking-tight">Legal Practitioner</p>
                      <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-widest">Advocate Practice Hub</p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-slate-200 group-hover:text-amber-600 transition-all group-hover:translate-x-1" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  {mode === 'REGISTER' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-4">Full Legal Name</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          required 
                          value={name} 
                          onChange={e => setName(e.target.value)} 
                          className="w-full bg-white border-2 border-slate-100 rounded-[28px] px-8 py-5 pl-14 outline-none focus:border-indigo-600 transition-all font-semibold text-slate-700 shadow-sm" 
                          placeholder="e.g. Adv. Vikram Singh" 
                        />
                        <Users className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-4">Email Identifier</label>
                    <div className="relative">
                      <input 
                        type="email" 
                        required 
                        value={identifier} 
                        onChange={e => setIdentifier(e.target.value)} 
                        className="w-full bg-white border-2 border-slate-100 rounded-[28px] px-8 py-5 pl-14 outline-none focus:border-indigo-600 transition-all font-semibold text-slate-700 shadow-sm" 
                        placeholder="counsel@legalnode.in" 
                      />
                      <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    </div>
                  </div>
                  
                  {mode === 'REGISTER' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-4">Vault Password</label>
                      <div className="relative">
                        <input 
                          type={showPassword ? "text" : "password"} 
                          required 
                          value={password} 
                          onChange={e => setPassword(e.target.value)} 
                          className="w-full bg-white border-2 border-slate-100 rounded-[28px] px-8 py-5 pl-14 pr-16 outline-none focus:border-indigo-600 transition-all font-semibold text-slate-700 shadow-sm" 
                          placeholder="••••••••" 
                        />
                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-6 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-indigo-600 transition-colors"
                        >
                          {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full bg-slate-900 text-white font-black py-7 rounded-[32px] hover:bg-slate-800 transition-all flex items-center justify-center gap-4 shadow-2xl shadow-slate-900/10 active:scale-[0.98] group uppercase tracking-[0.3em] text-[11px]"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                      <>
                        {mode === 'LOGIN' ? 'Send OTP' : 'Initialize Node'}
                        <ShieldCheck className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                      </>
                    )}
                  </button>
                  
                  <div className="text-center pt-8 border-t border-slate-200/50">
                    <button 
                      type="button" 
                      onClick={toggleMode} 
                      className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] hover:text-indigo-600 transition-colors flex items-center gap-3 mx-auto"
                    >
                      {mode === 'LOGIN' ? (
                        <>Create new local ID <ArrowRight className="w-3 h-3" /></>
                      ) : (
                        "Returning Practitioner? Sign In"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          <div className="pt-10 flex items-center justify-center gap-10 opacity-30 grayscale hover:grayscale-0 transition-all duration-1000">
             <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em]">GDPR Compliant</span>
             </div>
             <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
             <div className="flex items-center gap-3">
                <Bookmark className="w-5 h-5" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em]">ISO 27001 Protocol</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
