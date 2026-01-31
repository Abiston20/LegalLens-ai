
import React, { useState, useRef } from 'react';
import { Scale, ShieldCheck, ArrowRight, Loader2, Lock, AlertCircle, User as UserIcon, Mail, Gavel, Users, ChevronLeft, CreditCard, RefreshCw } from 'lucide-react';
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
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const toggleMode = () => {
    const nextMode = mode === 'LOGIN' ? 'REGISTER' : 'LOGIN';
    setMode(nextMode);
    setError(null);
    setStep(nextMode === 'REGISTER' ? 'ROLE_SELECT' : 'FORM');
    setUserType(nextMode === 'LOGIN' ? UserType.CITIZEN : null);
    setOtp(['', '', '', '', '', '']);
  };

  const handleRoleSelect = (type: UserType) => {
    setUserType(type);
    setStep('FORM');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = mode === 'REGISTER' ? '/auth/register' : '/auth/send-otp';
      const body = mode === 'REGISTER' 
        ? { name, email: identifier, user_type: userType, bar_id: barId } 
        : { identifier };

      await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      setStep('OTP');
    } catch (err: any) {
      setError(err.message);
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
    <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-6 z-[9999]">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
      
      <div className="max-w-2xl w-full relative">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[40px] p-10 shadow-2xl overflow-hidden relative min-h-[500px] flex flex-col transition-all duration-500">
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-500/20 transform -rotate-6">
              <Scale className="w-8 h-8 text-slate-900" />
            </div>
            <h1 className="text-3xl font-bold text-white font-serif tracking-tight mb-2">LEGALLENS</h1>
            <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">
              {mode === 'LOGIN' ? 'Secure Login' : 'Create Legal Account'}
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3 text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold mb-1">Connection Error</p>
                <p className="opacity-80">{error}</p>
                <button 
                  onClick={() => setError(null)} 
                  className="mt-2 text-xs font-bold uppercase tracking-widest flex items-center gap-1 hover:text-white"
                >
                  <RefreshCw className="w-3 h-3" /> Dismiss & Retry
                </button>
              </div>
            </div>
          )}

          {mode === 'REGISTER' && step === 'ROLE_SELECT' ? (
            <div className="flex-1 space-y-8 flex flex-col justify-center animate-in fade-in zoom-in-95 duration-300">
              <div className="text-center">
                <h2 className="text-xl font-bold text-white mb-2">Choose Your Legal Path</h2>
                <p className="text-slate-400 text-sm">Select the account type that matches your needs</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => handleRoleSelect(UserType.CITIZEN)}
                  className="group bg-white/5 border border-white/10 p-8 rounded-[32px] text-left hover:bg-amber-500 hover:border-amber-400 transition-all duration-300 hover:scale-[1.02] shadow-lg"
                >
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-slate-900/20 transition-colors">
                    <Users className="w-7 h-7 text-white group-hover:text-slate-900" />
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-slate-900 mb-2">Citizen User</h3>
                  <p className="text-slate-400 text-sm group-hover:text-slate-900/70 leading-relaxed">
                    Access AI consultation, document analysis, and library resources.
                  </p>
                </button>

                <button
                  onClick={() => handleRoleSelect(UserType.ADVOCATE)}
                  className="group bg-white/5 border border-white/10 p-8 rounded-[32px] text-left hover:bg-indigo-600 hover:border-indigo-500 transition-all duration-300 hover:scale-[1.02] shadow-lg"
                >
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/20 transition-colors">
                    <Gavel className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Advocate/Judge</h3>
                  <p className="text-slate-400 text-sm group-hover:text-white/70 leading-relaxed">
                    Professional drafting tools, advanced case retrieval, and verification.
                  </p>
                </button>
              </div>

              <p className="text-center text-slate-500 text-xs">
                Already registered? 
                <button onClick={toggleMode} className="ml-2 text-amber-500 font-bold hover:underline">Log In</button>
              </p>
            </div>
          ) : step === 'FORM' ? (
            <form onSubmit={handleFormSubmit} className="space-y-6 max-w-md mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
              {mode === 'REGISTER' && (
                <button 
                  type="button" 
                  onClick={() => setStep('ROLE_SELECT')}
                  className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-4"
                >
                  <ChevronLeft className="w-4 h-4" /> Change Role
                </button>
              )}

              {mode === 'REGISTER' && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-500">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <input 
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={userType === UserType.ADVOCATE ? "Advocate Name" : "Your Name"}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                  </div>

                  {userType === UserType.ADVOCATE && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Bar Enrollment ID</label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <input 
                          type="text"
                          required
                          value={barId}
                          onChange={(e) => setBarId(e.target.value)}
                          placeholder="e.g. MAH/1234/2024"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500/50"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Email ID</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-500">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input 
                    type="email"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="legal@chamber.com"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <button 
                  type="submit"
                  disabled={loading || !identifier || (mode === 'REGISTER' && !name)}
                  className={`w-full font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl active:scale-95 disabled:opacity-50 ${
                    userType === UserType.ADVOCATE ? 'bg-indigo-600 text-white shadow-indigo-600/20' : 'bg-amber-500 text-slate-900 shadow-amber-500/20'
                  }`}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{mode === 'LOGIN' ? 'Request Login OTP' : 'Complete Registration'} <ArrowRight className="w-5 h-5" /></>}
                </button>
                
                <p className="text-center text-slate-400 text-xs">
                  {mode === 'LOGIN' ? "Need a professional account?" : "Already have an account?"}
                  <button 
                    type="button"
                    onClick={toggleMode}
                    className="ml-2 text-amber-500 font-bold hover:underline"
                  >
                    {mode === 'LOGIN' ? 'Sign Up' : 'Log In'}
                  </button>
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-8 max-w-md mx-auto w-full animate-in fade-in zoom-in-95 duration-300">
              <div className="text-center mb-6">
                <p className="text-slate-400 text-sm">Security code dispatched to <span className="text-white font-bold">{identifier}</span></p>
              </div>

              <div className="flex justify-between gap-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => { otpRefs.current[idx] = el; }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
                        otpRefs.current[idx - 1]?.focus();
                      }
                    }}
                    className="w-12 h-16 bg-white/5 border border-white/10 rounded-xl text-center text-2xl font-bold text-white focus:outline-none focus:border-amber-500 transition-all shadow-inner"
                  />
                ))}
              </div>

              <button 
                type="submit"
                disabled={loading || otp.some(d => !d)}
                className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl shadow-indigo-600/20 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Access Secure Portal <Lock className="w-5 h-5" /></>}
              </button>
            </form>
          )}

          <div className="mt-auto pt-8 border-t border-white/10 flex items-center justify-center gap-4">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Quantum-Safe Encryption Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
