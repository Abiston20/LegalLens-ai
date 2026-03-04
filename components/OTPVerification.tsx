
import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Loader2, ArrowLeft, RefreshCw, Lock } from 'lucide-react';

interface OTPVerificationProps {
  email: string;
  onVerify: (otp: string) => void;
  onBack: () => void;
  isLoading: boolean;
  error: string | null;
}

const OTPVerification: React.FC<OTPVerificationProps> = ({ email, onVerify, onBack, isLoading, error }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Move to next input
    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  useEffect(() => {
    if (otp.every(digit => digit !== '')) {
      onVerify(otp.join(''));
    }
  }, [otp, onVerify]);

  return (
    <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
      <div className="space-y-3">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-indigo-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-3 h-3" /> Go Back
        </button>
        <h2 className="text-4xl font-bold text-slate-900 tracking-tight font-serif">Security Gate</h2>
        <p className="text-slate-400 font-medium">
          We've dispatched a 6-digit access code to <span className="text-indigo-600 font-bold">{email}</span>.
        </p>
      </div>

      <div className="flex justify-between gap-3">
        {otp.map((digit, idx) => (
          <input
            key={idx}
            /* Fixed: ref callback must return void or a cleanup function; assignment returns the value which causes a type mismatch. */
            ref={el => { inputs.current[idx] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleChange(e.target.value, idx)}
            onKeyDown={e => handleKeyDown(e, idx)}
            className="w-12 h-16 md:w-14 md:h-20 bg-white border-2 border-slate-100 rounded-2xl text-center text-2xl font-black font-mono text-slate-900 focus:border-indigo-600 outline-none shadow-sm transition-all"
          />
        ))}
      </div>

      {error && (
        <p className="text-red-500 text-xs font-bold text-center animate-shake bg-red-50 py-3 rounded-xl border border-red-100 flex items-center justify-center gap-2">
          <Lock className="w-4 h-4" /> {error}
        </p>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-center gap-4 text-slate-300">
          <div className="h-px w-10 bg-slate-200"></div>
          <span className="text-[10px] font-black uppercase tracking-widest">Awaiting Verification</span>
          <div className="h-px w-10 bg-slate-200"></div>
        </div>

        <button 
          disabled={isLoading}
          className="w-full bg-slate-900 text-white font-black py-7 rounded-[32px] hover:bg-slate-800 transition-all flex items-center justify-center gap-4 shadow-2xl shadow-slate-900/10 active:scale-[0.98] group uppercase tracking-[0.3em] text-[11px]"
        >
          {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
            <>
              Verify Identity
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </>
          )}
        </button>

        <div className="text-center">
          <button className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-amber-600 transition-colors flex items-center gap-2 mx-auto">
            <RefreshCw className="w-3 h-3" /> Resend Security Code
          </button>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
